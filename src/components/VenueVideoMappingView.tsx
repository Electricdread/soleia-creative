import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Power, Maximize, Minimize2, Orbit, ZoomIn, Move } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import RoomScene from '@/components/venue/RoomScene';
import solIcon from '@/assets/sol-icon.png';

/**
 * Video Mapping — Creative Guide schema (editorial / luxury). An interactive 3D
 * model of the venue with live previz (a mapped show played onto every screen).
 */

// The 3D venue embed: orbit + zoom, Play Previz, Fullscreen — framed in the
// Creative Guide's gold/elevated surface language.
function VenueRoom({ roomRef }: { roomRef: RefObject<HTMLDivElement> }) {
  const progressRef = useRef(0); // unused in orbit mode (RoomScene tour driver)
  const [previz, setPreviz] = useState(false);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === roomRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [roomRef]);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else roomRef.current?.requestFullscreen?.();
  };

  return (
    <div
      ref={roomRef}
      className="relative w-full overflow-hidden rounded-3xl edge-gold surface-elevated bg-black"
      style={{ aspectRatio: '16 / 9' }}
    >
      <RoomScene progressRef={progressRef} orbit previz={previz} />

      {/* Mouse navigation instructions */}
      <div className="absolute left-3 top-3 z-10 hidden flex-col gap-1.5 rounded-2xl border border-primary/25 bg-black/50 px-3 py-2.5 backdrop-blur-sm sm:flex">
        <span className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-primary/90">Navigate</span>
        <span className="flex items-center gap-2 text-[10.5px] text-white/85"><Orbit className="h-3.5 w-3.5 text-primary/80" /> Drag — orbit</span>
        <span className="flex items-center gap-2 text-[10.5px] text-white/85"><ZoomIn className="h-3.5 w-3.5 text-primary/80" /> Scroll — zoom</span>
        <span className="flex items-center gap-2 text-[10.5px] text-white/85"><Move className="h-3.5 w-3.5 text-primary/80" /> Right-drag — pan</span>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/30 bg-black/55 px-2 py-1.5 backdrop-blur-md">
        <button
          onClick={() => setPreviz((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
            previz ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-white/10'
          }`}
        >
          {previz ? <><Power className="h-3.5 w-3.5" /> Stop Previz</> : <><Play className="h-3.5 w-3.5" /> Play Previz</>}
        </button>
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

export default function VenueVideoMappingView() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
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

      {/* HERO */}
      <section className="flex min-h-[68vh] flex-col items-center justify-center px-6 pt-32 pb-16 text-center">
        <Reveal>
          <span className="mb-4 block text-[11px] uppercase tracking-[0.34em] text-primary">Creative Content Design</span>
          <h1 className="mb-5 font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">Video Mapping</h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every screen in the venue is a different shape and resolution. Step inside an interactive 3D model of the
            room and preview real mapped content on every surface — see how motion, branding and pixel-perfect mapping
            turn the space into one immersive canvas.
          </p>
        </Reveal>
      </section>

      {/* 3D VENUE + PREVIZ */}
      <section className="pb-24">
        <div className="container mx-auto max-w-6xl px-6">
          <Reveal className="mb-11">
            <span className="mb-3.5 block text-[11px] uppercase tracking-[0.34em] text-primary">The Venue in 3D</span>
            <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">Preview the room, live.</h2>
          </Reveal>
          <Reveal>
            <VenueRoom roomRef={roomRef} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Drag to orbit · scroll to zoom · <span className="text-primary">Play Previz</span> to map a show onto every screen.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
