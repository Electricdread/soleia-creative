import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { adminRecipients, sendEach } from "../_shared/notify.ts";
import {
  buildFeedbackDigest,
  reactionKind,
  type FeedbackEvent,
  type FeedbackSession,
} from "../_shared/creativeFeedbackDigest.ts";

// Emails the studio what clients approved, declined, commented and confirmed in their creative sessions, every
// 15 minutes (pg_cron soleia-creative-feedback-digest). Everything created after the watermark goes into one email;
// the watermark moves only once that email reached someone, so a failed send is retried with the next run.
// ?dry=1 reports what would be sent and writes nothing.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_ORIGIN = 'https://soleiacreative.app';
const WATERMARK = 'creative-feedback-digest';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

// A many-to-one embed arrives as an object, but older clients have returned a one-element array.
const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? value[0] ?? null : value ?? null);

type ItemRef = { title: string | null; session_id: string };
interface ReactionRow { reaction_type: string; reactor_name: string; created_at: string; mood_board_items: ItemRef | ItemRef[] | null }
interface CommentRow { commenter_name: string; content: string; created_at: string; mood_board_items: ItemRef | ItemRef[] | null }
interface SignoffRow { session_id: string; signer_name: string; approved_item_ids: string[] | null; created_at: string }
interface SessionRow { id: string; project_name: string; client_name: string; token: string; event_date: string | null }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const dry = new URL(req.url).searchParams.get('dry') === '1';

  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const until = new Date().toISOString();
    const advance = async () => {
      const { error } = await db.from('notification_watermarks').upsert({ key: WATERMARK, last_run_at: until });
      if (error) throw error;
    };

    const { data: mark, error: markError } = await db
      .from('notification_watermarks')
      .select('last_run_at')
      .eq('key', WATERMARK)
      .maybeSingle();
    if (markError) throw markError;
    if (!mark) {
      // No watermark means no history to report: start from now rather than mailing every approval ever made.
      if (!dry) await advance();
      return json({ success: true, seeded: until, dry });
    }
    const since = mark.last_run_at as string;

    const [reactions, comments, signoffs] = await Promise.all([
      db.from('mood_board_reactions')
        .select('reaction_type, reactor_name, created_at, mood_board_items!inner(title, session_id)')
        .gt('created_at', since).lte('created_at', until),
      db.from('mood_board_comments')
        .select('commenter_name, content, created_at, mood_board_items!inner(title, session_id)')
        .gt('created_at', since).lte('created_at', until),
      db.from('creative_session_signoffs')
        .select('session_id, signer_name, approved_item_ids, created_at')
        .gt('created_at', since).lte('created_at', until),
    ]);
    for (const result of [reactions, comments, signoffs]) if (result.error) throw result.error;

    const events: FeedbackEvent[] = [];
    for (const r of (reactions.data ?? []) as unknown as ReactionRow[]) {
      const kind = reactionKind(r.reaction_type);
      const item = one(r.mood_board_items);
      if (!kind || !item) continue;
      events.push({ kind, at: r.created_at, who: r.reactor_name, sessionId: item.session_id, itemTitle: item.title });
    }
    for (const c of (comments.data ?? []) as unknown as CommentRow[]) {
      const item = one(c.mood_board_items);
      if (!item) continue;
      events.push({ kind: 'comment', at: c.created_at, who: c.commenter_name, sessionId: item.session_id, itemTitle: item.title, text: c.content });
    }
    for (const s of (signoffs.data ?? []) as unknown as SignoffRow[]) {
      events.push({ kind: 'signoff', at: s.created_at, who: s.signer_name, sessionId: s.session_id, itemCount: (s.approved_item_ids ?? []).length });
    }

    if (!events.length) {
      if (!dry) await advance();
      return json({ success: true, since, until, events: 0, dry });
    }

    const ids = [...new Set(events.map((e) => e.sessionId))];
    const { data: rows, error: sessionError } = await db
      .from('creative_sessions')
      .select('id, project_name, client_name, token, event_date')
      .in('id', ids);
    if (sessionError) throw sessionError;
    const sessions: FeedbackSession[] = ((rows ?? []) as unknown as SessionRow[]).map((s) => ({
      id: s.id, projectName: s.project_name, clientName: s.client_name, token: s.token, eventDate: s.event_date,
    }));

    const digest = buildFeedbackDigest(events, sessions, APP_ORIGIN);
    if (!digest) {
      if (!dry) await advance();
      return json({ success: true, since, until, events: 0, dry });
    }
    if (dry) return json({ dry: true, since, until, counts: digest.counts, subject: digest.subject, recipients: adminRecipients().length });

    const report = await sendEach({
      template: 'creative-feedback-digest',
      to: adminRecipients(),
      subject: digest.subject,
      html: digest.html,
    });
    if (report.delivered.length) await advance();
    else console.error('creative-feedback-digest reached nobody; the watermark stays for the next run', JSON.stringify(report.failed));

    return json({
      success: report.delivered.length > 0,
      since, until,
      counts: digest.counts,
      delivered: report.delivered,
      failed: report.failed,
      sandbox: report.sandbox,
    });
  } catch (e) {
    console.error('creative-feedback-digest error:', e);
    return json({ error: e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e) }, 500);
  }
});
