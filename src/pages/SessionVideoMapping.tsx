import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VenueVideoMappingView, { type PrevizClipOption } from '@/components/VenueVideoMappingView';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SessionVideoMapping() {
  const { token } = useParams<{ token: string }>();
  const [clips, setClips] = useState<PrevizClipOption[] | null>(null);
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
        ((rows as Array<{ id: string; title: string; url: string }>) || []).map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
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
  );
}
