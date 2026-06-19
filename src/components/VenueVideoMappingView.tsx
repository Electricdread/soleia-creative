import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Power, Maximize, Minimize2, Orbit, ZoomIn, Move, Layers, Check, ChevronDown } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import RoomScene from '@/components/venue/RoomScene';
import { supabase } from '@/integrations/supabase/client';
import solIcon from '@/assets/sol-icon.png';
// Note: intentionally NOT using Radix Popover here — it portals to document.body,
// which becomes invisible when the room container enters fullscreen. We render a
// plain absolute-positioned menu inside the roomRef so it stays visible.

/**
 * Video Mapping — Creative Guide schema (editorial / luxury). An interactive 3D
 * model of the venue with live previz (a mapped show played onto every screen).
 */

export interface PrevizClipOption {
  id: string;
  title: string;
  url: string;
}

interface VenueRoomProps {
  roomRef: RefObject<HTMLDivElement>;
  clips: PrevizClipOption[];
  fallbackUrl?: string;
}

function VenueRoom({ roomRef, clips, fallbackUrl }: VenueRoomProps) {
  const progressRef = useRef(0);
  const [previz, setPreviz] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(clips[0]?.id ?? null);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  useEffect(() => {
    if (clips.length && !clips.find((c) => c.id === activeId)) {
      setActiveId(clips[0].id);
    }
  }, [clips, activeId]);

  const [pseudoFull, setPseudoFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === roomRef.current);
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange' as any, onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange' as any, onChange);
    };
  }, [roomRef]);

  useEffect(() => {
    if (!pseudoFull) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPseudoFull(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [pseudoFull]);

  const toggleFull = () => {
    const el = roomRef.current as any;
    if (!el) return;
    const doc = document as any;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
      return;
    }
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitEnterFullscreen;
    if (req) {
      try {
        const r = req.call(el);
        if (r && typeof r.catch === 'function') r.catch(() => setPseudoFull(true));
      } catch {
        setPseudoFull(true);
      }
    } else {
      setPseudoFull(true);
    }
  };

  const active = clips.find((c) => c.id === activeId) ?? null;
  const previzUrl = active?.url ?? fallbackUrl;

  const showingFull = isFull || pseudoFull;

  return (
    <div
      ref={roomRef}
      className={
        pseudoFull
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black overflow-hidden'
          : 'relative w-full overflow-hidden rounded-3xl edge-gold surface-elevated bg-black'
      }
      style={pseudoFull ? undefined : { aspectRatio: '16 / 9' }}
    >
      <RoomScene progressRef={progressRef} orbit previz={previz} previzUrl={previzUrl} />

      <div className="absolute left-3 top-3 z-10 hidden flex-col gap-1.5 rounded-2xl border border-primary/25 bg-black/50 px-3 py-2.5 backdrop-blur-sm sm:flex">
        <span className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-primary/90">Navigate</span>
        <span className="flex items-center gap-2 text-[10.5px] text-white/85"><Orbit className="h-3.5 w-3.5 text-primary/80" /> Drag — orbit</span>
        <span className="flex items-center gap-2 text-[10.5px] text-white/85"><ZoomIn className="h-3.5 w-3.5 text-primary/80" /> Scroll — zoom</span>
        <span className="flex items-center gap-2 text-[10.5px] text-white/85"><Move className="h-3.5 w-3.5 text-primary/80" /> Right-drag — pan</span>
      </div>

      {/* Active clip title chip */}
      {previz && active && (
        <div className="absolute right-3 top-3 z-10 rounded-full border border-primary/30 bg-black/55 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-[0.18em] text-primary/90">Now playing</span>
          <span className="ml-2 text-[11px] font-medium text-white">{active.title}</span>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/30 bg-black/55 px-2 py-1.5 backdrop-blur-md">
        <button
          onClick={() => setPreviz((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
            previz ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-white/10'
          }`}
        >
          {previz ? <><Power className="h-3.5 w-3.5" /> Stop Previz</> : <><Play className="h-3.5 w-3.5" /> Play Previz</>}
        </button>

        {clips.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => clips.length > 1 && setPlaylistOpen((v) => !v)}
              disabled={clips.length < 2}
              className={`inline-flex max-w-[260px] items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-70 ${clips.length > 1 ? 'border border-primary/40 bg-primary/15 text-white hover:bg-primary/25' : 'text-white hover:bg-white/10'}`}
              title={clips.length > 1 ? 'Switch previz clip' : active?.title}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="truncate normal-case tracking-normal">
                {active?.title ?? 'Playlist'}
              </span>
              {clips.length > 1 && (
                <>
                  <span className="ml-0.5 rounded-full bg-primary/30 px-1.5 py-px text-[9px] font-bold tracking-normal text-white">
                    {(clips.findIndex((c) => c.id === activeId) + 1) || 1}/{clips.length}
                  </span>
                  <ChevronDown className={`h-3 w-3 opacity-80 transition-transform ${playlistOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {playlistOpen && clips.length > 1 && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPlaylistOpen(false)}
                />
                <div className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-md border border-primary/20 bg-black/90 p-1 shadow-xl backdrop-blur-xl">
                  <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.18em] text-primary/80">
                    Previz Playlist
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {clips.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveId(c.id);
                          setPreviz(true);
                          setPlaylistOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[12px] transition-colors hover:bg-primary/15 ${
                          c.id === activeId ? 'bg-primary/10 text-white' : 'text-white/80'
                        }`}
                      >
                        <Check
                          className={`h-3.5 w-3.5 flex-shrink-0 ${
                            c.id === activeId ? 'text-primary' : 'text-transparent'
                          }`}
                        />
                        <span className="truncate">{c.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={toggleFull}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
        >
          {isFull ? <><Minimize2 className="h-3.5 w-3.5" /> Exit</> : <><Maximize className="h-3.5 w-3.5" /> Fullscreen</>}
        </button>
      </div>
    </div>
  );
}

interface VenueVideoMappingViewProps {
  clips?: PrevizClipOption[];
  heading?: string;
  subheading?: string;
}

export default function VenueVideoMappingView({
  clips: clipsProp,
  heading,
  subheading,
}: VenueVideoMappingViewProps = {}) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | undefined>(undefined);
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fallback to the global previz movie when no per-session clips are provided.
  useEffect(() => {
    if (clipsProp && clipsProp.length) return;
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'venue_previz_url')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && data.value.trim()) setFallbackUrl(data.value.trim());
      });
  }, [clipsProp]);

  const clips = clipsProp ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 sm:px-8 transition-all duration-400 ${
          scrolled ? 'py-3 glass border-b border-primary/15' : 'py-5 border-b border-transparent'
        }`}
      >
        <button onClick={() => navigate('/creative-guide')} className="flex items-center" aria-label="Soleia Creative Guide">
          <img src={solIcon} alt="Soleia" className="h-9 sm:h-10 w-auto object-contain" />
        </button>
        <button
          onClick={() => navigate('/creative-guide')}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Creative Guide
        </button>
      </header>

      <section className="flex min-h-[68vh] flex-col items-center justify-center px-6 pt-32 pb-16 text-center">
        <Reveal>
          <span className="mb-4 block text-[11px] uppercase tracking-[0.34em] text-primary">Creative Content Design</span>
          <h1 className="mb-5 font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {heading ?? 'Video Mapping'}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subheading ??
              'Every screen in the venue is a different shape and resolution. Step inside an interactive 3D model of the room and preview real mapped content on every surface — see how motion, branding and pixel-perfect mapping turn the space into one immersive canvas.'}
          </p>
        </Reveal>
      </section>

      <section className="pb-24">
        <div className="container mx-auto max-w-6xl px-6">
          <Reveal className="mb-11">
            <span className="mb-3.5 block text-[11px] uppercase tracking-[0.34em] text-primary">The Venue in 3D</span>
            <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">Preview the room, live.</h2>
          </Reveal>
          <Reveal>
            <VenueRoom roomRef={roomRef} clips={clips} fallbackUrl={fallbackUrl} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Drag to orbit · scroll to zoom · <span className="text-primary">Play Previz</span>
              {clips.length > 1 ? ' — open the playlist to switch between clips.' : ' to map a show onto every screen.'}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
