import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X, Hand } from 'lucide-react';

// Cinematic top-down render exported from Unreal.
const RENDER_SRC = '/creative-guide/venue-render.jpg';

// Zone pins, positioned as % of the render (projected from real Unreal coordinates).
const PINS: { t: string; x: number; y: number }[] = [
  { t: 'Lily Pad', x: 19.0, y: 33.0 },
  { t: 'TV Displays', x: 40.7, y: 25.4 },
  { t: 'Pool 2', x: 31.0, y: 55.0 },
  { t: 'Pool', x: 46.9, y: 55.0 },
  { t: 'Outdoor SR', x: 58.1, y: 41.1 },
  { t: 'Outdoor SL', x: 58.1, y: 69.0 },
  { t: 'Outdoor Arch', x: 39.5, y: 72.8 },
  { t: 'SR Curves', x: 73.0, y: 31.2 },
  { t: 'SR IMAG', x: 81.0, y: 43.6 },
  { t: 'Center', x: 82.7, y: 55.2 },
  { t: 'SL IMAG', x: 80.9, y: 66.7 },
  { t: 'SL Curves', x: 72.7, y: 78.9 },
];

const MIN = 1;
const MAX = 5;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function InteractiveVenueMap() {
  const [renderOk, setRenderOk] = useState(true);
  const [fs, setFs] = useState(false);
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

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
          {renderOk && PINS.map((p) => (
            <div key={p.t} className="absolute pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <div className="flex items-center gap-1" style={{ transform: `translate(-50%, -50%) scale(${1 / t.s})`, transformOrigin: 'left center' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-black/50 shrink-0" />
                <span
                  className="whitespace-nowrap text-[11px] font-medium text-white"
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
        <Hand className="w-3 h-3" /> Drag to pan · scroll or pinch to zoom · double-click to zoom
      </div>
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
