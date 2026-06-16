import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

interface ApprovedClip {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  item_type: string;
  description: string | null;
}

interface ProposalApprovedClipsProps {
  sessionId: string;
}

export default function ProposalApprovedClips({ sessionId }: ProposalApprovedClipsProps) {
  const [clips, setClips] = useState<ApprovedClip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch all mood board items for this session that have 'love' reactions
      const { data: items } = await supabase
        .from('mood_board_items')
        .select('id, title, thumbnail_url, file_url, item_type, description')
        .eq('session_id', sessionId);

      if (!items || items.length === 0) { setLoading(false); return; }

      const { data: reactions } = await supabase
        .from('mood_board_reactions')
        .select('item_id')
        .eq('reaction_type', 'love')
        .in('item_id', items.map(i => i.id));

      if (!reactions || reactions.length === 0) { setLoading(false); return; }

      const approvedIds = new Set(reactions.map(r => r.item_id));
      const approved = items.filter(i => approvedIds.has(i.id));
      setClips(approved);
      setLoading(false);
    };
    load();
  }, [sessionId]);

  if (loading || clips.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6 border-b border-[#ecf0f1] pb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-[#2c3e50]">Approved Creative Selections</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {clips.map((clip) => {
          const thumb = clip.thumbnail_url || clip.file_url;
          const isVideo = clip.item_type === 'video' || (thumb && /\.(mp4|webm|mov)/i.test(thumb));

          return (
            <div
              key={clip.id}
              className="group relative bg-background rounded-xl overflow-hidden border border-[#ecf0f1] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-[#f0f3f5] relative overflow-hidden">
                {isVideo && thumb ? (
                  <video
                    src={thumb}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    onLoadedMetadata={(e) => {
                      const vid = e.currentTarget;
                      vid.currentTime = Math.min(1, vid.duration * 0.25);
                    }}
                  />
                ) : thumb ? (
                  <img
                    src={thumb}
                    alt={clip.title || 'Approved'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[#bdc3c7] text-xs uppercase">{clip.item_type}</span>
                  </div>
                )}
                {/* Gold approved badge */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <svg className="w-3.5 h-3.5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              {clip.title && (
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-[#2c3e50] truncate">{clip.title}</p>
                  {clip.description && (
                    <p className="text-[10px] text-[#95a5a6] truncate mt-0.5">{clip.description}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[#95a5a6] mt-4 italic">
        These selections have been approved during the creative session review.
      </p>
    </section>
  );
}
