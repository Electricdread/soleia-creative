import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X, MousePointerClick } from 'lucide-react';
import { ALL_LED_ZONES, DISPLAY_TYPES } from '@/lib/creativeGuide';

// Top-down venue blueprint, drawn in the mapping-card style (light + dark
// colorways). Authored at 16:9 so the zone pins line up exactly.
const BLUEPRINT_LIGHT = '/creative-guide/venue-blueprint-light.png';
const BLUEPRINT_DARK = '/creative-guide/venue-blueprint-dark.png';

// Per-zone schematic thumbnails (light + dark colorways) — generated in the
// Soleia "LED Video Display" style. Resolved from the zone id at render time.
const ZONE_CARD_BASE = '/creative-guide/zone-cards';

const zoneById = new Map(ALL_LED_ZONES.map((z) => [z.id, z]));
const tvDisplay = DISPLAY_TYPES.find((d) => d.id === 'television');

// Plain location labels — no mapping card.
const LABEL_PINS: { t: string; x: number; y: number }[] = [
  { t: 'Lily Pad', x: 20.0, y: 19.0 },
  { t: 'Pool 2', x: 33.0, y: 47.0 },
  { t: 'Pool', x: 50.0, y: 47.0 },
];

// Immersive zones. Each is one clickable pin (placed at the zone centroid)
// plus optional member dots at each screen it groups. `screenIds` resolve
// against the LED zone specs; `tv` pulls from the TV display type.
interface ZonePin {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  screenIds?: string[];
  tv?: boolean;
  blurb: string;
  members?: { x: number; y: number }[];
  // Elliptical footprint highlighted on the blueprint when the zone is active.
  region: { cx: number; cy: number; rx: number; ry: number };
}

const ZONE_PINS: ZonePin[] = [
  {
    id: 'right',
    label: 'Right',
    kind: 'Interior LED · Curves',
    x: 72.0, y: 38.0,
    region: { cx: 73, cy: 36, rx: 9, ry: 8 },
    screenIds: ['curves-sr'],
    blurb: 'Stage-right curved LED wall — wraparound ambient visuals and brand washes that wrap the room.',
  },
  {
    id: 'main',
    label: 'Main',
    kind: 'Interior LED · Stage Wall',
    x: 83.0, y: 50.0,
    region: { cx: 84, cy: 50, rx: 7, ry: 13 },
    screenIds: ['imag-sr', 'center', 'imag-sl'],
    blurb: 'The primary stage wall — IMAG side panels flanking the center focal screen for hero moments, logo reveals and live camera.',
    members: [{ x: 81.0, y: 38.0 }, { x: 85.0, y: 50.0 }, { x: 81.0, y: 62.0 }],
  },
  {
    id: 'left',
    label: 'Left',
    kind: 'Interior LED · Curves',
    x: 80.0, y: 67.0,
    region: { cx: 80, cy: 67.5, rx: 9, ry: 10.5 },
    screenIds: ['curves-sl'],
    blurb: 'Stage-left curved LED wall — wraparound ambient visuals and brand washes that wrap the room.',
  },
  {
    id: 'arrival',
    label: 'Arrival',
    kind: 'Exterior LED · Open-air',
    x: 90.0, y: 22.0,
    region: { cx: 87, cy: 42, rx: 11, ry: 30 },
    screenIds: ['outdoor-sr', 'outdoor-sl', 'outdoor-arch'],
    blurb: 'Open-air entry screens facing the Las Vegas Strip — the first brand touchpoint for arriving guests.',
    members: [{ x: 75.0, y: 12.0 }, { x: 95.0, y: 50.0 }, { x: 88.0, y: 80.0 }],
  },
  {
    id: 'tv',
    label: 'TV Displays',
    kind: 'TV / Narrowcasting',
    x: 45.0, y: 14.0,
    region: { cx: 45, cy: 14, rx: 8, ry: 7 },
    tv: true,
    blurb: 'High-definition TV displays throughout the venue for branded content and event visuals.',
  },
];

// Mapping card shown when an immersive zone is selected.
interface MappingCard {
  label: string;
  kind: string;
  light: string;
  dark: string;
  blurb: string;
  screens: { name: string; res: string }[];
  uses: string[];
}

// Resolve the explanatory mapping card for an immersive zone.
function getCard(zone: ZonePin): MappingCard {
  const light = `${ZONE_CARD_BASE}/${zone.id}-light.png`;
  const dark = `${ZONE_CARD_BASE}/${zone.id}-dark.png`;
  if (zone.tv && tvDisplay) {
    return {
      label: zone.label,
      kind: zone.kind,
      light,
      dark,
      blurb: zone.blurb,
      screens: [{ name: 'TV / Narrowcasting', res: tvDisplay.videoSpecs.resolution }],
      uses: [],
    };
  }
  const ids = zone.screenIds ?? [];
  const screens = ids.map((id) => {
    const z = zoneById.get(id);
    return { name: z?.name ?? id, res: z?.resolution ?? z?.specs?.resolution ?? '—' };
  });
  const uses: string[] = [];
  ids.forEach((id) => {
    zoneById.get(id)?.useCases?.forEach((u) => {
      if (!uses.includes(u)) uses.push(u);
    });
  });
  return { label: zone.label, kind: zone.kind, light, dark, blurb: zone.blurb, screens, uses };
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

  const activeZone = ZONE_PINS.find((z) => z.id === activePin) ?? null;
  const activeCard = activeZone ? getCard(activeZone) : null;

  const wrapRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const last = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<number | null>(null);

  const reset = useCallback(() => setT({ s: 1, x: 0, y: 0 }), []);
  useEffect(() => { reset(); }, [fs, reset]);

  // Focus the map on the selected zone, framing its footprint in the open space
  // between the left HUD and the right detail card. Resets when deselected.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (!activeZone) { setT({ s: 1, x: 0, y: 0 }); return; }
    const W = el.clientWidth, H = el.clientHeight;
    const s = 1.7;
    const px = (activeZone.region.cx / 100) * W;
    const py = (activeZone.region.cy / 100) * H;
    const targetX = (188 + (W - 300)) / 2; // midpoint between HUD edge and card edge
    const tx = targetX - W / 2 - (px - W / 2) * s;
    const ty = (H / 2) - H / 2 - (py - H / 2) * s;
    const c = clampXY(tx, ty, s);
    setT({ s, x: c.x, y: c.y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePin]);

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
    <div className={`relative overflow-hidden bg-black select-none ${fs ? 'flex-1' : 'rounded-3xl edge-gold surface-elevated'}`}>
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
            <>
              <img src={BLUEPRINT_LIGHT} alt="Soleia venue — top-down blueprint" draggable={false} className="block dark:hidden w-full h-full object-contain" onError={() => setRenderOk(false)} />
              <img src={BLUEPRINT_DARK} alt="Soleia venue — top-down blueprint" draggable={false} className="hidden dark:block w-full h-full object-contain" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center px-6">
              <p className="text-xs text-white/55 max-w-xs">Add the venue blueprint to <span className="text-primary">/public/creative-guide/venue-blueprint-&#123;light,dark&#125;.png</span>.</p>
            </div>
          )}

          {/* highlight the active zone's footprint on the blueprint */}
          {renderOk && activeZone && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${activeZone.region.cx}%`,
                top: `${activeZone.region.cy}%`,
                width: `${activeZone.region.rx * 2}%`,
                height: `${activeZone.region.ry * 2}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="w-full h-full rounded-[50%] border border-amber-300/70 animate-pulse"
                style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.30), hsl(var(--primary) / 0.06) 70%, transparent)' }}
              />
            </div>
          )}

          {/* plain location labels */}
          {renderOk && LABEL_PINS.map((p) => (
            <div key={p.t} className="absolute pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <div className="flex items-center gap-1" style={{ transform: `translate(-50%, -50%) scale(${1 / t.s})`, transformOrigin: 'left center' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 ring-2 ring-black/40 shrink-0" />
                <span
                  className="whitespace-nowrap text-[11px] font-medium text-white/80"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' }}
                >
                  {p.t}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
        <MapBtn onClick={() => zoomAt(1.4)} label="Zoom in"><ZoomIn className="w-4 h-4" /></MapBtn>
        <MapBtn onClick={() => zoomAt(1 / 1.4)} label="Zoom out"><ZoomOut className="w-4 h-4" /></MapBtn>
        <MapBtn onClick={reset} label="Reset"><RotateCcw className="w-4 h-4" /></MapBtn>
        <MapBtn onClick={() => setFs((f) => !f)} label={fs ? 'Exit fullscreen' : 'Fullscreen'}>{fs ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</MapBtn>
      </div>
      <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm px-3 py-1.5 text-[10.5px] text-white/75 pointer-events-none">
        <MousePointerClick className="w-3 h-3" /> Select a zone · drag to pan · pinch or scroll to zoom
      </div>

      {/* Zone HUD — pick a zone to inspect (highlights its footprint on the map) */}
      <div className={`absolute top-3 left-3 z-30 w-40 sm:w-44 max-w-[46%] max-h-[calc(100%-1.5rem)] flex flex-col rounded-3xl edge-gold surface-elevated bg-black/80 backdrop-blur-md overflow-hidden ${activeCard ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-3 pt-3 pb-2 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Zones</p>
          <p className="text-[10px] text-white/45 mt-0.5">Select to inspect</p>
        </div>
        <ul className="px-1.5 pb-2 space-y-0.5 overflow-y-auto">
          {ZONE_PINS.map((z) => {
            const isActive = activePin === z.id;
            const count = z.tv ? 1 : (z.screenIds?.length ?? 0);
            return (
              <li key={z.id}>
                <button
                  type="button"
                  onClick={() => setActivePin((cur) => (cur === z.id ? null : z.id))}
                  aria-pressed={isActive}
                  className={`w-full text-left rounded-xl pl-2.5 pr-2 py-2 flex items-center gap-2 border-l-2 transition-colors ${isActive ? 'bg-primary/15 border-primary' : 'border-transparent hover:bg-white/5'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? 'bg-amber-300' : 'bg-primary/70'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-xs font-semibold leading-tight truncate ${isActive ? 'text-amber-200' : 'text-white'}`}>{z.label}</span>
                    <span className="block text-[10px] text-white/45 leading-tight truncate">{z.kind}</span>
                  </span>
                  <span className="text-[10px] font-mono text-primary/80 shrink-0">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mapping card for the selected immersive zone (right side) */}
      {activeCard && (
        <div className="absolute top-3 right-3 z-30 w-[min(18rem,calc(100%-1.5rem))] max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-3xl edge-gold surface-elevated bg-black/85 backdrop-blur-md">
          <div className="relative h-28 w-full overflow-hidden rounded-t-3xl">
            <img src={activeCard.light} alt={`${activeCard.label} zone screens`} className="block dark:hidden h-full w-full object-cover" draggable={false} />
            <img src={activeCard.dark} alt={`${activeCard.label} zone screens`} className="hidden dark:block h-full w-full object-cover" draggable={false} />
          </div>
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
              <h4 className="text-base font-semibold text-white leading-tight">{activeCard.label} <span className="text-white/40 font-normal">Zone</span></h4>
            </div>
            <p className="text-xs leading-relaxed text-white/70">{activeCard.blurb}</p>

            {/* Screens grouped in this zone */}
            <div className="space-y-1.5 border-t border-white/10 pt-3">
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                {activeCard.screens.length > 1 ? `${activeCard.screens.length} Screens in this zone` : 'Screen'}
              </p>
              <ul className="space-y-1">
                {activeCard.screens.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white/85">{s.name}</span>
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary shrink-0">{s.res}</span>
                  </li>
                ))}
              </ul>
            </div>

            {activeCard.uses.length > 0 && (
              <div className="space-y-1.5 border-t border-white/10 pt-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Best for</p>
                <ul className="space-y-1">
                  {activeCard.uses.slice(0, 5).map((u) => (
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
