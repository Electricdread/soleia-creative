import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PrevizCue } from '@/components/previz/PrevizPlayer';

export function usePrevizCues(clipId: string | null | undefined) {
  const [cues, setCues] = useState<PrevizCue[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCues = useCallback(async () => {
    if (!clipId) {
      setCues([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('session_previz_cues')
      .select('id, time_seconds, label, color, sort_order')
      .eq('clip_id', clipId)
      .order('time_seconds', { ascending: true });
    if (error) {
      console.error(error);
      toast.error('Failed to load cues');
    } else {
      setCues(
        ((data as Array<{ id: string; time_seconds: number | string; label: string; color: string | null; sort_order: number }>) || []).map((r) => ({
          id: r.id,
          time_seconds: Number(r.time_seconds),
          label: r.label,
          color: r.color,
          sort_order: r.sort_order,
        })),
      );
    }
    setLoading(false);
  }, [clipId]);

  useEffect(() => {
    fetchCues();
  }, [fetchCues]);

  const addCue = useCallback(
    async (time_seconds: number) => {
      if (!clipId) return;
      const label = `Cue ${cues.length + 1}`;
      const { data, error } = await supabase
        .from('session_previz_cues')
        .insert({ clip_id: clipId, time_seconds, label, sort_order: cues.length })
        .select('id, time_seconds, label, color, sort_order')
        .single();
      if (error || !data) {
        toast.error('Failed to add cue');
        return;
      }
      setCues((prev) =>
        [...prev, { ...data, time_seconds: Number(data.time_seconds) } as PrevizCue].sort(
          (a, b) => a.time_seconds - b.time_seconds,
        ),
      );
    },
    [clipId, cues.length],
  );

  const updateCue = useCallback(
    async (id: string, patch: Partial<Pick<PrevizCue, 'time_seconds' | 'label'>>) => {
      setCues((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, ...patch } : c))
          .sort((a, b) => a.time_seconds - b.time_seconds),
      );
      const { error } = await supabase.from('session_previz_cues').update(patch).eq('id', id);
      if (error) toast.error('Failed to update cue');
    },
    [],
  );

  const deleteCue = useCallback(async (id: string) => {
    setCues((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from('session_previz_cues').delete().eq('id', id);
    if (error) toast.error('Failed to delete cue');
  }, []);

  return { cues, loading, addCue, updateCue, deleteCue, refetch: fetchCues };
}
