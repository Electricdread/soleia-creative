import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ArtlistClip } from '@/lib/api/artlist';

interface ClientLink {
  id: string;
  token: string;
  client_name: string;
  event_name: string;
  event_date: string | null;
  is_active: boolean;
}

interface SharedSelection {
  id: string;
  link_id: string;
  clip_id: string;
  clip_title: string;
  clip_thumbnail: string | null;
  clip_category: string | null;
  note: string;
  placements: string[];
}

export function useSharedSession(token: string | undefined) {
  const { toast } = useToast();
  const [clientLink, setClientLink] = useState<ClientLink | null>(null);
  const [selections, setSelections] = useState<SharedSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client link info
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('No session token provided');
      return;
    }

    const fetchSession = async () => {
      setIsLoading(true);
      try {
        // Fetch client link
        const { data: linkData, error: linkError } = await supabase
          .from('client_links')
          .select('*')
          .eq('token', token)
          .eq('is_active', true)
          .maybeSingle();

        if (linkError) throw linkError;
        
        if (!linkData) {
          setError('Session not found or has expired');
          setIsLoading(false);
          return;
        }

        setClientLink(linkData);

        // Fetch existing selections
        const { data: selectionsData, error: selectionsError } = await supabase
          .from('link_selections')
          .select('*')
          .eq('link_id', linkData.id);

        if (selectionsError) throw selectionsError;
        setSelections(selectionsData || []);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message || 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [token]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!clientLink?.id) return;

    const channel = supabase
      .channel(`link_selections:${clientLink.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'link_selections',
          filter: `link_id=eq.${clientLink.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSelections(prev => {
              // Avoid duplicates
              if (prev.some(s => s.id === (payload.new as SharedSelection).id)) {
                return prev;
              }
              return [...prev, payload.new as SharedSelection];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSelections(prev =>
              prev.map(s =>
                s.id === (payload.new as SharedSelection).id
                  ? (payload.new as SharedSelection)
                  : s
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSelections(prev =>
              prev.filter(s => s.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientLink?.id]);

  // Toggle clip selection (add or remove)
  const toggleSelection = useCallback(async (clip: ArtlistClip) => {
    if (!clientLink?.id) return;

    const existing = selections.find(s => s.clip_id === clip.id);

    if (existing) {
      // Remove selection
      const { error } = await supabase
        .from('link_selections')
        .delete()
        .eq('id', existing.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove selection',
          variant: 'destructive',
        });
      }
    } else {
      // Add selection
      const { error } = await supabase
        .from('link_selections')
        .insert({
          link_id: clientLink.id,
          clip_id: clip.id,
          clip_title: clip.title,
          clip_thumbnail: clip.thumbnail,
          clip_category: clip.category,
          note: '',
          placements: [],
        });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add selection',
          variant: 'destructive',
        });
      }
    }
  }, [clientLink?.id, selections, toast]);

  // Update selection note
  const updateNote = useCallback(async (clipId: string, note: string) => {
    const selection = selections.find(s => s.clip_id === clipId);
    if (!selection) return;

    const { error } = await supabase
      .from('link_selections')
      .update({ note })
      .eq('id', selection.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    }
  }, [selections, toast]);

  // Update placements
  const updatePlacements = useCallback(async (clipId: string, placements: string[]) => {
    const selection = selections.find(s => s.clip_id === clipId);
    if (!selection) return;

    const { error } = await supabase
      .from('link_selections')
      .update({ placements })
      .eq('id', selection.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update placements',
        variant: 'destructive',
      });
    }
  }, [selections, toast]);

  // Check if a clip is selected
  const isSelected = useCallback((clipId: string) => {
    return selections.some(s => s.clip_id === clipId);
  }, [selections]);

  // Get selection data for a clip
  const getSelection = useCallback((clipId: string) => {
    return selections.find(s => s.clip_id === clipId);
  }, [selections]);

  return {
    clientLink,
    selections,
    isLoading,
    error,
    toggleSelection,
    updateNote,
    updatePlacements,
    isSelected,
    getSelection,
  };
}
