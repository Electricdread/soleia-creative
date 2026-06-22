import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VenueVideoMappingView, { type PrevizClipOption } from '@/components/VenueVideoMappingView';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PrevizPlayer } from '@/components/previz/PrevizPlayer';
import { usePrevizCues } from '@/hooks/usePrevizCues';

interface ClipWithCues extends PrevizClipOption {
  is_default?: boolean;
}

function RunOfShowSection({ clips }: { clips: ClipWithCues[] }) {
  const [activeId, setActiveId] = useState<string | null>(
    clips.find((c) => c.is_default)?.id ?? clips[0]?.id ?? null,
  );
  const { cues } = usePrevizCues(activeId);
  const active = clips.find((c) => c.id === activeId);
  if (!active) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">Run of Show</h2>
          <p className="text-xs text-muted-foreground">
            Cue markers along the timeline mark the moments mapped to this show.
          </p>
        </div>
        {clips.length > 1 && (
          <select
            value={activeId ?? ''}
            onChange={(e) => setActiveId(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>
      <PrevizPlayer videoUrl={active.url} cues={cues} />
    </section>
  );
}

export default function SessionVideoMapping() {
  const { token } = useParams<{ token: string }>();
  const [clips, setClips] = useState<ClipWithCues[] | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: session, error: sErr } = await supabase
        .from('creative_sessions')
        .select('id, project_name, client_name')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle();
      if (sErr || !session) {
        setError('Session not found');
        setClips([]);
        return;
      }
      setSessionName(session.project_name || session.client_name);
      const { data: rows } = await supabase
        .from('session_previz_clips')
        .select('id, title, url, sort_order, is_default')
        .eq('session_id', session.id)
        .order('is_default', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      setClips(
        ((rows as Array<{ id: string; title: string; url: string; is_default: boolean }>) || []).map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          is_default: r.is_default,
        })),
      );
    })();
  }, [token]);

  if (clips === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <VenueVideoMappingView
        clips={clips}
        heading={sessionName ? `Video Mapping — ${sessionName}` : 'Video Mapping'}
        subheading={
          error
            ? 'This session link is no longer active.'
            : clips.length === 0
              ? 'No previz clips have been uploaded for this session yet. The 3D venue uses the bundled default movie below.'
              : undefined
        }
      />
      {clips.length > 0 && <RunOfShowSection clips={clips} />}
    </>
  );
}
