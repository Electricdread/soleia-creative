import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { HomeButton } from '@/components/HomeButton';

interface Share {
  id: string;
  token: string;
  title: string;
  intro_note: string | null;
  category_id: string | null;
  clip_ids: string[] | null;
  is_active: boolean;
  expires_at: string | null;
  view_count: number;
}

interface Clip {
  id: string;
  title: string;
  preview_url: string | null;
  thumbnail: string | null;
  resolution: string | null;
  duration: string | null;
  category: string | null;
  category_id: string | null;
}

export default function SharedLookBook() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<Share | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [previewing, setPreviewing] = useState<Clip | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      const { data: s, error } = await supabase
        .from('lookbook_shares')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setShare(s as Share);

      // resolve clips
      let q = supabase
        .from('cached_clips')
        .select('id,title,preview_url,thumbnail,resolution,duration,category,category_id')
        .order('created_at', { ascending: false })
        .limit(500);

      if (s.clip_ids && s.clip_ids.length > 0) {
        q = q.in('id', s.clip_ids);
      } else if (s.category_id) {
        q = q.eq('category_id', s.category_id);
      }

      const { data: cl } = await q;
      setClips((cl || []) as Clip[]);

      if (s.category_id) {
        const { data: cat } = await supabase
          .from('lookbook_categories')
          .select('name')
          .eq('id', s.category_id)
          .maybeSingle();
        setCategoryName(cat?.name ?? null);
      }

      // increment view count via security-definer RPC (best-effort)
      supabase.rpc('increment_lookbook_share_view', { p_token: token }).then(() => {});

      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !share) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
        <img src={soleiaLogo} alt="Soleia" className="h-10 w-auto object-contain mb-6" />
        <h1 className="font-display text-2xl text-foreground mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
          Look Book unavailable
        </h1>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          This link is expired or no longer active.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border">
        <div className="absolute top-4 left-4 z-20">
          <HomeButton variant="dark" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center text-center">
          <img src={soleiaLogo} alt="Soleia" className="h-10 w-auto object-contain" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-primary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Look Book {categoryName ? `· ${categoryName}` : ''}
          </p>
          <h1
            className="font-display mt-2 text-3xl sm:text-4xl text-foreground"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {share.title}
          </h1>
          {share.intro_note && (
            <p className="mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              {share.intro_note}
            </p>
          )}
        </div>
      </header>

      {/* Gallery */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {clips.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl text-muted-foreground">
            <p className="text-sm">No looks in this collection yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clips.map((c) => (
              <SharedTile key={c.id} clip={c} onOpen={() => setPreviewing(c)} />
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-[10px] uppercase tracking-[0.3em] text-zinc-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Curated by Soleia Creative Team
        </p>
      </main>

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-5xl bg-background border-border p-0">
          {previewing && (
            <div>
              <video
                src={previewing.preview_url || undefined}
                poster={previewing.thumbnail || undefined}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[80vh] bg-background"
              />
              <div className="p-4 text-foreground">
                <h3 className="text-lg" style={{ fontFamily: 'DM Serif Display, serif' }}>{previewing.title}</h3>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {previewing.resolution} {previewing.duration ? `· ${previewing.duration}` : ''}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SharedTile({ clip, onOpen }: { clip: Clip; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [hovering]);

  // viewport autoplay on mobile
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.5 }
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onOpen}
      role="button"
      style={{ touchAction: 'manipulation' }}
      className="group relative rounded-xl overflow-hidden bg-muted border border-border hover:border-primary/40 transition-colors cursor-pointer"
    >
      <div className="aspect-video bg-background">
        {clip.preview_url ? (
          <video
            ref={videoRef}
            src={clip.preview_url}
            poster={clip.thumbnail || undefined}
            muted
            playsInline
            loop
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : clip.thumbnail ? (
          <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Play className="h-8 w-8" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {clip.resolution && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-background/60 text-foreground backdrop-blur-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {clip.resolution}
            </span>
          )}
          {clip.duration && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-background/60 text-foreground backdrop-blur-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {clip.duration}
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm text-foreground truncate">{clip.title || 'Untitled'}</p>
      </div>
    </div>
  );
}
