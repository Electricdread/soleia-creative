import { supabase } from '@/integrations/supabase/client';

/**
 * What clients did in a creative session: their approvals, declines and comments on each mood board item, and the
 * approvals they confirmed with their name.
 *
 * Clients write these straight into their tables from the session page. Until 2026-09-15 no admin screen read them
 * back (owner: "when approving or declining, commenting is not registering"); admins now read them here, under the
 * admin RLS policies.
 */

export interface FeedbackItem {
  id: string;
  title: string | null;
  item_type: string;
  thumbnail_url: string | null;
  file_url: string | null;
}

export interface FeedbackReaction {
  id: string;
  item_id: string;
  reaction_type: string;
  reactor_name: string;
  created_at: string;
}

export interface FeedbackComment {
  id: string;
  item_id: string;
  commenter_name: string;
  content: string;
  created_at: string;
}

export interface FeedbackSignoff {
  id: string;
  signer_name: string;
  approved_item_ids: string[];
  created_at: string;
}

export interface SessionFeedback {
  items: FeedbackItem[];
  reactions: FeedbackReaction[];
  comments: FeedbackComment[];
  signoffs: FeedbackSignoff[];
}

export interface ItemFeedback {
  item: FeedbackItem;
  approvedBy: FeedbackReaction[];
  declinedBy: FeedbackReaction[];
  comments: FeedbackComment[];
}

export interface FeedbackSummary {
  approved: number;
  declined: number;
  comments: number;
  signoffs: number;
  total: number;
  /** The newest thing a client did, or null when they have done nothing. */
  latestAt: string | null;
  /** Items anyone reacted to or commented on, in mood board order. */
  items: ItemFeedback[];
  /** Newest first. */
  signoffList: FeedbackSignoff[];
}

const byTime = <T extends { created_at: string }>(a: T, b: T) => Date.parse(a.created_at) - Date.parse(b.created_at);

export function summarizeFeedback({ items, reactions, comments, signoffs }: SessionFeedback): FeedbackSummary {
  const approvals = reactions.filter((r) => r.reaction_type === 'love');
  const declines = reactions.filter((r) => r.reaction_type === 'decline');
  const perItem = items
    .map((item) => ({
      item,
      approvedBy: approvals.filter((r) => r.item_id === item.id).sort(byTime),
      declinedBy: declines.filter((r) => r.item_id === item.id).sort(byTime),
      comments: comments.filter((c) => c.item_id === item.id).sort(byTime),
    }))
    .filter((entry) => entry.approvedBy.length || entry.declinedBy.length || entry.comments.length);
  const times = [...approvals, ...declines, ...comments, ...signoffs].map((row) => row.created_at);
  const latestAt = times.length ? times.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b)) : null;
  return {
    approved: approvals.length,
    declined: declines.length,
    comments: comments.length,
    signoffs: signoffs.length,
    total: approvals.length + declines.length + comments.length + signoffs.length,
    latestAt,
    items: perItem,
    signoffList: [...signoffs].sort((a, b) => byTime(b, a)),
  };
}

// creative_session_signoffs arrived on 2026-09-15; until Lovable regenerates types.ts it is not in the typed client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- temporary: remove once types.ts carries the table
const signoffTable = () => (supabase as unknown as { from: (table: string) => any }).from('creative_session_signoffs');

export async function fetchSessionFeedback(sessionId: string): Promise<SessionFeedback> {
  const [items, reactions, comments, signoffs] = await Promise.all([
    supabase
      .from('mood_board_items')
      .select('id, title, item_type, thumbnail_url, file_url')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('mood_board_reactions')
      .select('id, item_id, reaction_type, reactor_name, created_at, mood_board_items!inner(session_id)')
      .eq('mood_board_items.session_id', sessionId),
    supabase
      .from('mood_board_comments')
      .select('id, item_id, commenter_name, content, created_at, mood_board_items!inner(session_id)')
      .eq('mood_board_items.session_id', sessionId),
    signoffTable()
      .select('id, signer_name, approved_item_ids, created_at')
      .eq('session_id', sessionId),
  ]);
  return {
    items: (items.data ?? []) as FeedbackItem[],
    reactions: (reactions.data ?? []).map(({ id, item_id, reaction_type, reactor_name, created_at }) => ({ id, item_id, reaction_type, reactor_name, created_at })),
    comments: (comments.data ?? []).map(({ id, item_id, commenter_name, content, created_at }) => ({ id, item_id, commenter_name, content, created_at })),
    signoffs: ((signoffs.data ?? []) as FeedbackSignoff[]).map((s) => ({ ...s, approved_item_ids: s.approved_item_ids ?? [] })),
  };
}

/** Records a client's typed-name confirmation of the items they approved. Returns an error message, or null. */
export async function recordSignoff(sessionId: string, signerName: string, itemIds: string[]): Promise<string | null> {
  const { error } = await signoffTable().insert({
    session_id: sessionId,
    signer_name: signerName.trim(),
    approved_item_ids: itemIds,
  });
  return error ? error.message || 'not recorded' : null;
}
