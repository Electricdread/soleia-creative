import React, { useEffect, useRef } from 'react';

/**
 * TechnicalBackdrop — the "Technical Brand Geometry" atmospheric background.
 *
 * A full-bleed dot-matrix particle field reconstructed per the design spec:
 * sparse grid of dots with a soft radial depth fade, a slow breathing pulse,
 * and subtle pointer-reactive parallax drift. Re-skinned to the Soleia gold
 * palette (reads the live `--primary` token, so it follows the light/dark
 * theme) instead of the spec's reference gray.
 *
 * Rendered on a 2D canvas — visually equivalent to the spec's three.js field but
 * dependency-free and far lighter, which suits the "minimal / meditative" motion
 * level. DOM/static fallbacks:
 *   - no 2D context available  → renders nothing (page background shows through)
 *   - prefers-reduced-motion   → paints a single static frame, no animation loop
 */

const SPACING = 30;        // px between dots (sparse)
const DOT_RADIUS = 1.15;   // base dot radius
const BREATH_PERIOD = 9;   // seconds per breathing cycle
const DRIFT = 14;          // max parallax drift in px

export function TechnicalBackdrop({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // fallback: no field, page background remains

    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, cols = 0, rows = 0;
    let primary = '38 92% 50%';

    // per-dot pseudo-random depth for parallax + brightness variation
    let depth: Float32Array = new Float32Array(0);

    const readPrimary = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim();
      if (v) primary = v;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / SPACING) + 2;
      rows = Math.ceil(h / SPACING) + 2;
      depth = new Float32Array(cols * rows);
      for (let i = 0; i < depth.length; i++) {
        // stable hash-ish value in [0,1]
        depth[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        if (depth[i] < 0) depth[i] += 1;
      }
    };

    const cx = () => w / 2;
    const cy = () => h * 0.42; // depth fade focuses slightly above center

    // pointer drift (eased)
    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    const onPointer = (e: PointerEvent) => {
      targetX = ((e.clientX / w) - 0.5) * 2;
      targetY = ((e.clientY / h) - 0.5) * 2;
    };

    const draw = (timeMs: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = timeMs / 1000;
      const breath = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / BREATH_PERIOD);
      const pulse = 0.55 + 0.45 * breath; // alpha/size multiplier

      curX += (targetX - curX) * 0.04;
      curY += (targetY - curY) * 0.04;

      const ccx = cx(), ccy = cy();
      const maxD = Math.hypot(Math.max(ccx, w - ccx), Math.max(ccy, h - ccy));
      const baseAlpha = 0.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const z = depth[r * cols + c]; // 0..1 depth
          const par = 0.4 + z * 0.6;     // nearer dots drift more
          const px = c * SPACING - SPACING + curX * DRIFT * par;
          const py = r * SPACING - SPACING + curY * DRIFT * par;

          // soft radial depth fade: faint at the focal centre (keeps copy
          // readable) and at the far edges, fullest through the mid-field
          const d = Math.hypot(px - ccx, py - ccy) / maxD; // 0..~1
          const fade = Math.sin(Math.min(d, 1) * Math.PI); // 0 at center & edge, 1 mid
          const a = baseAlpha * pulse * (0.25 + 0.75 * z) * (0.15 + 0.85 * fade);
          if (a <= 0.012) continue;

          const rad = DOT_RADIUS * (0.6 + 0.4 * z) * (0.85 + 0.15 * breath);
          ctx.beginPath();
          ctx.fillStyle = `hsl(${primary} / ${a.toFixed(3)})`;
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    let raf = 0;
    const loop = (ts: number) => {
      draw(ts);
      raf = requestAnimationFrame(loop);
    };

    readPrimary();
    resize();

    // refresh dot color when the theme class flips
    const themeObserver = new MutationObserver(readPrimary);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', resize);
    if (!reduceMotion) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      raf = requestAnimationFrame(loop);
    } else {
      draw(0); // single static frame
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full ${className}`}
    />
  );
}

export default TechnicalBackdrop;
