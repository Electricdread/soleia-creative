import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X, MousePointerClick } from 'lucide-react';
import { ALL_LED_ZONES, DISPLAY_TYPES } from '@/lib/creativeGuide';

// Cinematic top-down render exported from Unreal.
const RENDER_SRC = '/creative-guide/venue-render.jpg';

// Reference pixel-map / mapping cards exported for the venue.
const MAP_INTERIOR = '/creative-guide/led-interior-mapping.png';
const MAP_OUTDOOR = '/creative-guide/led-outdoor-mapping.png';
const MAP_OUTDOOR_ARCH = '/creative-guide/led-outdoor-arch-mapping.png';
const MAP_TV = '/creative-guide/tv-pixelmap.png';

interface Pin {
  t: string;
  x: number;
  y: number;
  // Links the pin to a mapping card. `zoneId` resolves against the LED zone
  // specs; `tv` pulls from the TV display type. Pins with neither are plain
  // location labels (pools, lily pad).
  zoneId?: string;
  tv?: boolean;
  mapImage?: string;
}

// Zone pins, positioned as % of the render (projected from real Unreal coordinates).
const PINS: Pin[] = [
  { t: 'Lily Pad', x: 19.0, y: 33.0 },
  { t: 'TV Displays', x: 40.7, y: 25.4, tv: true, mapImage: MAP_TV },
  { t: 'Pool 2', x: 31.0, y: 55.0 },
  { t: 'Pool', x: 46.9, y: 55.0 },
  { t: 'Outdoor SR', x: 58.1, y: 41.1, zoneId: 'outdoor-sr', mapImage: MAP_OUTDOOR },
  { t: 'Outdoor SL', x: 58.1, y: 69.0, zoneId: 'outdoor-sl', mapImage: MAP_OUTDOOR },
  { t: 'Outdoor Arch', x: 39.5, y: 72.8, zoneId: 'outdoor-arch', mapImage: MAP_OUTDOOR_ARCH },
  { t: 'SR Curves', x: 73.0, y: 31.2, zoneId: 'curves-sr', mapImage: MAP_INTERIOR },
  { t: 'SR IMAG', x: 81.0, y: 43.6, zoneId: 'imag-sr', mapImage: MAP_INTERIOR },
  { t: 'Center', x: 82.7, y: 55.2, zoneId: 'center', mapImage: MAP_INTERIOR },
  { t: 'SL IMAG', x: 80.9, y: 66.7, zoneId: 'imag-sl', mapImage: MAP_INTERIOR },
  { t: 'SL Curves', x: 72.7, y: 78.9, zoneId: 'curves-sl', mapImage: MAP_INTERIOR },
];

// Mapping card shown when a screen pin is selected.
interface MappingCard {
  name: string;
  kind: string;
  resolution: string;
  description: string;
  useCases?: string[];
  mapImage?: string;
}

const zoneById = new Map(ALL_LED_ZONES.map((z) => [z.id, z]));
const tvDisplay = DISPLAY_TYPES.find((d) => d.id === 'television');

// Resolve the explanatory mapping card for a pin, or null for plain labels.
function getCard(pin: Pin): MappingCard | null {
  if (pin.tv && tvDisplay) {
    return {
      name: 'TV Displays',
      kind: 'TV / Narrowcasting',
      resolution: tvDisplay.videoSpecs.resolution,
      description: tvDisplay.description,
      mapImage: pin.mapImage,
    };
  }
  if (pin.zoneId) {
    const z = zoneById.get(pin.zoneId);
    if (z) {
      return {
        name: z.name,
        kind: z.category === 'outdoor' ? 'Exterior LED' : 'Interior LED',
        resolution: z.resolution ?? z.specs?.resolution ?? '—',
        description: z.description,
        useCases: z.useCases,
        mapImage: pin.mapImage,
      };
    }
  }
  return null;
}

const MIN = 1;
const MAX = 5;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function InteractiveVenueMap() {
  const [renderOk, setRenderOk] = useState(true);
  const [fs, setFs] = useState(false);
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [activePin, setActivePin] = useState<string | null>(null);

  const activeCard = activePin ? getCard(PINS.find((p) => p.t === activePin)!) : null;

  const wrapRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const last = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<number | null>(null);

  const reset = useCallback(() => setT({ s: 1, x: 0, y: 0 }), []);
  useEffect(() => { reset(); }, [fs, reset]);

  const clampXY = useCallback((x: number, y: number, s: number) => {
    const el = wrapRef.current;
    if (!el) return { x, y };
    const maxX = ((s - 1) * el.clientWidth) / 2;
    const maxY = ((s - 1) * el.clientHeight) / 2;
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  const zoomAt = useCallback((factor: number, clientX?: number, clientY?: number) => {
    setT((prev) => {
      const s = clamp(prev.s * factor, MIN, MAX);
      const el = wrapRef.current;
      if (!el || s === prev.s) return prev;
      const rect = el.getBoundingClientRect();
      const cx = (clientX ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
      const cy = (clientY ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;
      const ratio = s / prev.s;
      const nx = cx * (1 - ratio) + prev.x * ratio;
      const ny = cy * (1 - ratio) + prev.y * ratio;
      if (s === 1) return { s: 1, x: 0, y: 0 };
      const c = clampXY(nx, ny, s);
      return { s, x: c.x, y: c.y };
    });
  }, [clampXY]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y); last.current = null;
    } else { last.current = { x: e.clientX, y: e.clientY }; setDragging(true); }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) zoomAt(dist / pinch.current, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.current = dist; return;
    }
    if (last.current && t.s > 1) {
      const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      setT((prev) => { const c = clampXY(prev.x + dx, prev.y + dy, prev.s); return { ...prev, x: c.x, y: c.y }; });
    }
  };
  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) { last.current = null; setDragging(false); }
  };
  const onDoubleClick = (e: React.MouseEvent) => { if (t.s > 1) reset(); else zoomAt(2.4, e.clientX, e.clientY); };

  const stage = (
    <div className={`relative overflow-hidden bg-black select-none ${fs ? 'flex-1' : 'border border-primary/15'}`}>
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/40 z-20 pointer-events-none" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/40 z-20 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/40 z-20 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/40 z-20 pointer-events-none" />

      <div
        ref={wrapRef}
        className="w-full h-full touch-none"
        style={{ cursor: t.s > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in', aspectRatio: fs ? undefined : '16 / 9' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onDoubleClick={onDoubleClick}
      >
        <div
          className="relative w-full h-full"
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`, transformOrigin: 'center', transition: dragging ? 'none' : 'transform 0.18s ease-out' }}
        >
          {renderOk ? (
            <img src={RENDER_SRC} alt="Soleia venue — top-down render" draggable={false} className="w-full h-full object-contain" onError={() => setRenderOk(false)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center px-6">
              <p className="text-xs text-white/55 max-w-xs">Add a top-down render to <span className="text-primary">/public/creative-guide/venue-render.jpg</span>.</p>
            </div>
          )}

          {/* zone pins */}
          {renderOk && PINS.map((p) => {
            const hasCard = !!getCard(p);
            const isActive = activePin === p.t;
            return (
              <div key={p.t} className={`absolute ${hasCard ? '' : 'pointer-events-none'}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <div className="flex items-center gap-1" style={{ transform: `translate(-50%, -50%) scale(${1 / t.s})`, transformOrigin: 'left center' }}>
                  {hasCard ? (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setActivePin((cur) => (cur === p.t ? null : p.t)); }}
                      className="flex items-center gap-1 rounded-full pl-0.5 pr-2 py-0.5 -ml-0.5 cursor-pointer hover:bg-primary/15 transition-colors"
                      aria-label={`Show mapping card for ${p.t}`}
                    >
                      <span className={`w-2 h-2 rounded-full ring-2 ring-black/50 shrink-0 transition-all ${isActive ? 'bg-amber-300 ring-amber-300/60 scale-125' : 'bg-primary'}`} />
                      <span
                        className={`whitespace-nowrap text-[11px] font-semibold transition-colors ${isActive ? 'text-amber-200' : 'text-white'}`}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' }}
                      >
                        {p.t}
                      </span>
                    </button>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 ring-2 ring-black/40 shrink-0" />
                      <span
                        className="whitespace-nowrap text-[11px] font-medium text-white/80"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' }}
                      >
                        {p.t}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
        <MapBtn onClick={() => zoomAt(1.4)} label="Zoom in"><ZoomIn className="w-4 h-4" /></MapBtn>
        <MapBtn onClick={() => zoomAt(1 / 1.4)} label="Zoom out"><ZoomOut className="w-4 h-4" /></MapBtn>
        <MapBtn onClick={reset} label="Reset"><RotateCcw className="w-4 h-4" /></MapBtn>
        <MapBtn onClick={() => setFs((f) => !f)} label={fs ? 'Exit fullscreen' : 'Fullscreen'}>{fs ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</MapBtn>
      </div>
      <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm px-3 py-1.5 text-[10.5px] text-white/75 pointer-events-none">
        <MousePointerClick className="w-3 h-3" /> Tap a screen pin for specs · drag to pan · pinch or scroll to zoom
      </div>

      {/* Mapping card for the selected screen pin */}
      {activeCard && (
        <div className="absolute top-3 left-3 z-30 w-[min(20rem,calc(100%-1.5rem))] max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-primary/30 bg-black/85 backdrop-blur-md shadow-[0_8px_40px_-8px_rgba(0,0,0,0.8)]">
          {activeCard.mapImage && (
            <div className="relative h-28 w-full overflow-hidden rounded-t-xl">
              <img src={activeCard.mapImage} alt={`${activeCard.name} mapping`} className="h-full w-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setActivePin(null)}
            aria-label="Close"
            className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.22em] text-primary">{activeCard.kind}</span>
              <h4 className="text-base font-semibold text-white leading-tight">{activeCard.name}</h4>
              <span className="inline-block rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-mono text-primary">{activeCard.resolution}</span>
            </div>
            <p className="text-xs leading-relaxed text-white/70">{activeCard.description}</p>
            {activeCard.useCases && activeCard.useCases.length > 0 && (
              <div className="space-y-1.5 border-t border-white/10 pt-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Best for</p>
                <ul className="space-y-1">
                  {activeCard.useCases.map((u) => (
                    <li key={u} className="flex items-start gap-1.5 text-xs text-white/75">
                      <span className="mt-0.5 text-primary">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (fs) return <div className="fixed inset-0 z-[80] bg-background flex flex-col p-3 sm:p-5">{stage}</div>;
  return stage;
}

function MapBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label}
      className="w-9 h-9 flex items-center justify-center rounded-full border border-primary/30 bg-black/55 backdrop-blur-sm text-white/85 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
      {children}
    </button>
  );
}

export default InteractiveVenueMap;
