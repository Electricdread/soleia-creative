import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Pause, Play, RotateCcw } from 'lucide-react';

/**
 * Soleia — LED Video Map Explainer.
 * A 55.5s timeline-driven animated explainer: the 3840×2160 pixelmap, one motion
 * pass flowing across every surface, the map folding into the room, three zone
 * passes, and the alpha logo landing centred on every screen.
 * Authored on a 1920×1080 stage and scaled to fit its container.
 * Renders in a dark or a bright (light-mode) palette.
 */

const W = 1920, H = 1080;

const HEAD = '"Archivo", Inter, system-ui, sans-serif';
const LOGO = '/soleia-logo-black.png';

/* ---------- palettes ---------- */
const DARK_PALETTE = {
  GROUND: '#18140f', INK: '#f7f3e8', SURF: '#211a13',
  N400: '#d5c7b1', N600: '#c2b096', N700: '#cabba3',
  PANEL: '#0f0c09', BORDER: '#392e22', ACCENT: '#d4790f',
  DIV: 'rgba(247,243,232,0.16)',
  EDGE: 'rgba(247,243,232,0.35)',
  LABEL_BG: 'rgba(14,11,7,0.82)',
  MAP_BG: 'rgba(33,26,19,0.55)',
  HUB_TINT: 'rgba(190,168,132,0.08)',
  BLEND: 'screen' as const,
  LOGO_FILTER: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(15,12,9,0.9))',
  CLOSE_LOGO_FILTER: 'brightness(0) invert(1)',
  FLOW_LINES:
    'repeating-linear-gradient(102deg,'
    + ' rgba(0,0,0,0) 0 2.6%, rgba(247,243,232,0.16) 2.6% 3.0%, rgba(0,0,0,0) 3.0% 3.35%,'
    + ' rgba(0,0,0,0) 3.35% 6.4%, rgba(247,243,232,0.55) 6.4% 6.62%, rgba(0,0,0,0) 6.62% 12.8%)',
  TRAIL_COLORS: ['#f7e3bd', '#f2c98d', '#e8b26a', '#d4790f', '#c2542a', '#b8324a', '#e0d08a', '#fff6e2'],
  TRAIL_HEAD: '#fff8ea',
  BLOOM: ['#c2542a', '#8a3418'] as const,
};

const LIGHT_PALETTE = {
  GROUND: '#f4efe3', INK: '#1b1610', SURF: '#ece4d4',
  N400: '#6f6049', N600: '#7c6c53', N700: '#4c4132',
  PANEL: '#fbf7ee', BORDER: '#c9b795', ACCENT: '#b46f0c',
  DIV: 'rgba(27,22,16,0.18)',
  EDGE: 'rgba(27,22,16,0.28)',
  LABEL_BG: 'rgba(255,252,245,0.88)',
  MAP_BG: 'rgba(255,252,245,0.6)',
  HUB_TINT: 'rgba(180,111,12,0.07)',
  BLEND: 'multiply' as const,
  LOGO_FILTER: 'brightness(0) drop-shadow(0 0 6px rgba(255,255,255,0.75))',
  CLOSE_LOGO_FILTER: 'brightness(0)',
  FLOW_LINES:
    'repeating-linear-gradient(102deg,'
    + ' rgba(255,255,255,0) 0 2.6%, rgba(27,22,16,0.16) 2.6% 3.0%, rgba(255,255,255,0) 3.0% 3.35%,'
    + ' rgba(255,255,255,0) 3.35% 6.4%, rgba(27,22,16,0.45) 6.4% 6.62%, rgba(255,255,255,0) 6.62% 12.8%)',
  TRAIL_COLORS: ['#8a6a1f', '#a5722a', '#b46f0c', '#9c4a1c', '#7d2f2f', '#6b5a2a', '#c08a2e', '#5c4a22'],
  TRAIL_HEAD: '#6b4a12',
  BLOOM: ['#d08a4a', '#b46f0c'] as const,
};

type Palette = typeof DARK_PALETTE;

// Single mutable palette reference: the whole composition renders synchronously
// from the exported component, which sets this before the tree renders.
let P: Palette = DARK_PALETTE;


const MAPW = 3840, MAPH = 2160;
const S = 0.3;
const MX = (W - MAPW * S) / 2, MY = 62;
const FW = 6600, FH = 2160;

/* ---------- timing ---------- */
const SCENES = [
  { name: 'Map', dur: 6 },
  { name: 'Flow', dur: 5 },
  { name: 'Fold', dur: 5.5 },
  { name: 'Zones', dur: 24 },
  { name: 'Remap', dur: 4.5 },
  { name: 'Logos', dur: 5.5 },
  { name: 'Close', dur: 5 },
] as const;

const CUES: Record<string, number> = (() => {
  let t = 0;
  const c: Record<string, number> = {};
  for (const s of SCENES) { c[s.name] = t; t += s.dur; }
  c.__total = t;
  return c;
})();
const TOTAL = CUES.__total;

/* ---------- math ---------- */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

function interpolate(keys: number[], vals: number[], ease = easeInOutSine) {
  return (T: number) => {
    if (T <= keys[0]) return vals[0];
    for (let i = 0; i < keys.length - 1; i++) {
      if (T <= keys[i + 1]) {
        const p = (T - keys[i]) / Math.max(1e-6, keys[i + 1] - keys[i]);
        return vals[i] + (vals[i + 1] - vals[i]) * ease(clamp(p, 0, 1));
      }
    }
    return vals[vals.length - 1];
  };
}
const anim = (start: number, dur: number, ease = easeOutCubic) => (T: number) =>
  ease(clamp((T - start) / Math.max(1e-6, dur), 0, 1));

/* ---------- geometry ---------- */
type Screen = {
  zone: number; id: string; map: [number, number, number, number];
  room: [number, number, number, number]; ry: number; label: string; logo: boolean;
  spoke?: number; hubGap?: number; logoHub?: boolean; pair2?: boolean;
};

const SCREENS: Screen[] = [
  { zone: 0, id: 'SR_IMAG', map: [0, 0, 1216, 592], room: [130, 424, 200, 108], ry: 28, label: 'IMAG SR', logo: true },
  { zone: 0, id: 'CENTER', map: [1216, 0, 640, 272], room: [366, 434, 148, 70], ry: 0, label: 'Center', logo: true },
  { zone: 0, id: 'SL_IMAG', map: [1856, 0, 1216, 592], room: [548, 424, 200, 108], ry: -28, label: 'IMAG SL', logo: true },
  { zone: 0, id: 'DJ', map: [906, 594, 1260, 168], room: [372, 548, 136, 26], ry: 0, label: 'DJ Booth', logo: true },
  { zone: 0, id: 'SR_CURVE', map: [0, 794, 2304, 272], room: [110, 356, 254, 34], ry: 20, label: 'Curve SR', logo: false },
  { zone: 0, id: 'SL_CURVE', map: [0, 1066, 2304, 272], room: [464, 356, 254, 34], ry: -20, label: 'Curve SL', logo: false },
  ...Array.from({ length: 12 }, (_, i) => ({
    zone: 1,
    id: `SUN${i + 1}`,
    logoHub: true,
    pair2: i % 2 === 1,
    map: [0, 1368 + Math.floor(i / 2) * 128, 1792, 112] as [number, number, number, number],
    room: [1152, 439, 250, 46] as [number, number, number, number],
    ry: 0,
    spoke: i * 30,
    hubGap: 86,
    label: '',
    logo: true,
  })),
  { zone: 2, id: 'OUT_SR', map: [2322, 793, 588, 840], room: [1558, 448, 78, 126], ry: 12, label: 'Outdoor SR', logo: true },
  { zone: 2, id: 'OUT_SL', map: [2916, 793, 588, 840], room: [1774, 448, 78, 126], ry: -12, label: 'Outdoor SL', logo: true },
  { zone: 2, id: 'ARCH', map: [2322, 1639, 1512, 504], room: [1636, 482, 158, 62], ry: 0, label: 'Outdoor Arch', logo: true },
];

const flowHead = () => 'linear-gradient(102deg,'
  + ' rgba(0,0,0,0) 0%, rgba(0,0,0,0) 41%, ' + P.ACCENT + '00 43%, ' + P.ACCENT + '99 48.4%,'
  + ' ' + P.ACCENT + 'cc 50%, ' + P.ACCENT + '99 51.6%, ' + P.ACCENT + '00 57%,'
  + ' rgba(0,0,0,0) 59%, rgba(0,0,0,0) 100%)';


const ZONES = [
  { box: [92, 322, 672, 272], label: 'Main interior — walls', align: 'left', cam: 2.0 },
  { box: [778, 288, 750, 348], label: 'Main interior — ceiling sky', align: 'left', cam: 1.85 },
  { box: [1540, 408, 316, 196], label: 'Exterior — pool side', align: 'right', cam: 2.3 },
] as const;
const ZBB = [92, 288, 1764, 348];
const zc = (b: readonly number[]) => [b[0] + b[2] / 2, b[1] + b[3] / 2];

/* ---------- small pieces ---------- */
function Kicker({ children, color = INK, size = 24, style }: any) {
  return (
    <div style={{ font: `700 ${size}px ${HEAD}`, letterSpacing: '0.18em', color, textTransform: 'uppercase', ...style }}>
      {children}
    </div>
  );
}

const TRAIL_COLORS = ['#f7e3bd', '#f2c98d', '#e8b26a', '#d4790f', '#c2542a', '#b8324a', '#e0d08a', '#fff6e2'];
const hash = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
const TRAIL_N = 260, TRAIL_SEG = 6;

function FlowTrails({ T, fold, amp }: { T: number; fold: number; amp: number }) {
  const a = amp * (1 - clamp(fold * 1.6, 0, 1));
  if (a <= 0.01) return null;
  const FX = MX - 520, FY = MY + 1180;
  const segs: JSX.Element[] = [];
  for (let i = 0; i < TRAIL_N; i++) {
    const rr = hash(i, 1);
    const r = 700 + Math.pow(rr, 0.7) * 2100;
    const spd = (0.03 + hash(i, 2) * 0.052) * (1 - rr * 0.35);
    const len = (0.3 + hash(i, 3) * 0.42) * (1 - rr * 0.32);
    const a0 = -0.75 + hash(i, 4) * 2.25 + T * spd;
    const col = TRAIL_COLORS[Math.floor(hash(i, 7) * TRAIL_COLORS.length)];
    const wob = 1 + 0.05 * Math.sin(T * 0.42 + i * 1.7);
    const ry = r * 0.78 * wob, rx = r * wob;
    const wMax = 0.55 + hash(i, 5) * 0.95;
    const bright = 0.3 + hash(i, 6) * 0.7;
    const pt = (t: number) => [FX + Math.cos(t) * rx, FY - Math.sin(t) * ry];
    for (let k = 0; k < TRAIL_SEG; k++) {
      const p0 = pt(a0 + len * (k / TRAIL_SEG)), p1 = pt(a0 + len * ((k + 1) / TRAIL_SEG));
      const f = (k + 1) / TRAIL_SEG;
      segs.push(
        <path key={`${i}-${k}`}
          d={`M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${rx.toFixed(0)} ${ry.toFixed(0)} 0 0 0 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`}
          fill="none" stroke={col} strokeLinecap="round"
          strokeWidth={Number((0.3 + f * f * wMax).toFixed(2))}
          opacity={(0.02 + Math.pow(f, 2.2) * 0.72) * bright * a} />
      );
    }
    const hp = pt(a0 + len);
    segs.push(<circle key={`${i}-h`} cx={hp[0].toFixed(1)} cy={hp[1].toFixed(1)}
      r={Number((0.9 + wMax * 0.9).toFixed(2))} fill="#fff8ea" opacity={(0.55 + bright * 0.45) * a} />);
  }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 4 }}>
      <defs>
        <clipPath id="soleia-panels">
          {SCREENS.map((s) => (
            <rect key={s.id} x={s.map[0] * S + MX} y={s.map[1] * S + MY} width={s.map[2] * S} height={s.map[3] * S} />
          ))}
        </clipPath>
        <radialGradient id="soleia-flowbloom" cx="26%" cy="18%" r="72%">
          <stop offset="0%" stopColor="#c2542a" stopOpacity="0.42" />
          <stop offset="46%" stopColor="#8a3418" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath="url(#soleia-panels)">
        <rect x="0" y="0" width={W} height={H} fill="url(#soleia-flowbloom)" opacity={a} />
        <g style={{ mixBlendMode: 'screen' }}>{segs}</g>
      </g>
    </svg>
  );
}

function ScreenPanel({ s, T, fold, on, logoIn, sweepX, flow, headOn }: any) {
  const [mx, my, mw, mh] = s.map;
  const [rx, ry, rw, rh] = s.room;
  const x = mx * S + MX + (rx - (mx * S + MX)) * fold;
  const y = my * S + MY + (ry - (my * S + MY)) * fold;
  const w = mw * S + (rw - mw * S) * clamp(fold * 1.9, 0, 1);
  const h = mh * S + (rh - mh * S) * clamp(fold * 1.9, 0, 1);
  const rot = (s.ry || 0) * fold;
  const sizeF = clamp(fold * 1.9, 0, 1);
  const spinF = clamp((fold - 0.45) / 0.55, 0, 1);
  const spoke = s.spoke || 0;
  const kM = S, kR = 0.26;
  const spk = s.spoke != null;
  const px = spk ? (0.34 + (spoke / 360) * 0.2) * FW * kR : mx * kR;
  const py = spk ? 30 + ((spoke % 120) / 120) * FH * kR * 0.18 : my * kR;
  const k = kM + (kR - kM) * sizeF;
  const fw = FW * k, fh = FH * k;
  const lerp = (a: number, b: number) => a + (b - a) * sizeF;
  const by = lerp(-my * kM, -30 - py);
  const flowT = T * 300;
  const bxFlow = lerp(-mx * kM - flowT * kM, -40 - px - flowT * kR * 0.5);
  const byFlow = lerp(-my * kM - flowT * 0.22 * kM, -30 - py - flowT * kR * 0.1);
  const headX = ((T * 0.13) % 1) * (FW + 900) - 450;
  const bxHead = lerp(-(mx - headX) * kM, -40 - px + (headX - FW / 2) * kR * 0.5);
  const logoOn = s.logo ? logoIn : 0;
  const flipped = spk && ((spoke * spinF) % 360 + 360) % 360 > 95 && ((spoke * spinF) % 360 + 360) % 360 < 265;

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      transform: spk
        ? `perspective(1600px) rotateX(${68 * spinF}deg) rotate(${spoke * spinF}deg) translateX(${(s.hubGap || 0) * spinF}px)`
        : `perspective(1600px) rotateY(${rot}deg)`,
      transformOrigin: spk ? '0% 50%' : '50% 50%',
      transformStyle: 'preserve-3d',
      opacity: on * (s.pair2 ? clamp((fold - 0.1) / 0.28, 0, 1) : 1),
      border: `2px solid ${fold > 0.5 ? BORDER : 'rgba(247,243,232,0.35)'}`,
      background: PANEL, overflow: 'hidden', boxSizing: 'border-box',
    }}>
      <div style={{
        position: 'absolute', inset: 0, backgroundImage: FLOW_LINES,
        backgroundSize: `${fw}px ${fh}px`, backgroundPosition: `${bxFlow}px ${byFlow}px`,
        backgroundRepeat: 'repeat', opacity: 0.62 * flow, mixBlendMode: 'screen',
      }} />
      <div style={{
        position: 'absolute', inset: 0, backgroundImage: FLOW_HEAD,
        backgroundSize: `${fw}px ${fh}px`, backgroundPosition: `${bxHead}px ${by}px`,
        backgroundRepeat: 'no-repeat', opacity: 0.6 * headOn, mixBlendMode: 'screen',
      }} />
      {s.logoHub && <div style={{ position: 'absolute', inset: 0, background: 'rgba(190,168,132,0.08)' }} />}
      {s.logo && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: logoOn, transform: flipped ? 'rotate(180deg)' : 'none',
        }}>
          <img src={LOGO} alt="" style={{
            width: s.logoHub ? 'auto' : '56%', height: s.logoHub ? '88%' : 'auto',
            maxWidth: s.logoHub ? '82%' : '56%', maxHeight: '90%', objectFit: 'contain',
            filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(15,12,9,0.9))',
          }} />
        </div>
      )}
      {!s.logo && logoOn > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: ACCENT, opacity: 0.7 * logoOn }} />
      )}
    </div>
  );
}

function ScreenLabel({ s, fold, on, labelOut, cs }: any) {
  if (!s.label) return null;
  const [mx, my, mw] = s.map;
  const [rx, ry, rw] = s.room;
  const x = mx * S + MX + (rx - (mx * S + MX)) * fold;
  const y = my * S + MY + (ry - (my * S + MY)) * fold;
  const k = 1 / (cs || 1);
  const boxW = (mw * S + (rw - mw * S) * fold) / k;
  const size = Math.max(8, Math.min(14, boxW * 0.084));
  const short = boxW < 220 ? s.label.replace('Outdoor ', 'Out ').replace(' Booth', '') : s.label;
  if (fold > 0.6 && s.room[3] < 30 && s.logo) return null;
  return (
    <div style={{
      position: 'absolute', left: x + 5 * k, top: y + 5 * k,
      opacity: (1 - labelOut) * on, whiteSpace: 'nowrap',
      background: 'rgba(14,11,7,0.82)', padding: '3px 7px',
      transform: `scale(${k})`, transformOrigin: '0% 0%',
    }}>
      <Kicker size={size} color={N400}>{short}</Kicker>
    </div>
  );
}

function CaptionBlock({ index, title, body, spec, a }: any) {
  if (a <= 0.002) return null;
  return (
    <div style={{
      position: 'absolute', left: 120, bottom: 70, width: 1020,
      opacity: a, transform: `translateY(${(1 - a) * 24}px)`,
    }}>
      <Kicker color={ACCENT}>{index}</Kicker>
      <div style={{ font: `700 50px/1.06 ${HEAD}`, letterSpacing: '-0.02em', color: INK, marginTop: 14 }}>{title}</div>
      <div style={{ font: `400 26px/1.42 ${HEAD}`, color: N700, marginTop: 16 }}>{body}</div>
      <div style={{ height: 2, background: DIV, marginTop: 20 }} />
      <Kicker size={24} color={N600} style={{ marginTop: 14 }}>{spec}</Kicker>
    </div>
  );
}

function CloseCard({ T }: { T: number }) {
  const s = CUES.Close;
  const wipe = anim(s, 0.55, easeInOutQuart)(T);
  const l1 = anim(s + 0.4, 0.7)(T);
  const foot = anim(s + 0.85, 0.6)(T);
  return (
    <div style={{ position: 'absolute', inset: 0, background: SURF, transform: `translateX(${(1 - wipe) * 100}%)` }}>
      <div style={{ position: 'absolute', left: 140, top: 330 }}>
        <div style={{ height: 128, overflow: 'hidden' }}>
          <div style={{
            font: `700 108px/122px ${HEAD}`, letterSpacing: '-0.03em', color: ACCENT,
            transform: `translateY(${(1 - l1) * 130}px)`,
          }}>One map. Every surface.</div>
        </div>
        <div style={{ opacity: foot, marginTop: 26, width: 1180 }}>
          <div style={{ height: 2, background: 'rgba(245,158,10,0.5)' }} />
          <div style={{ font: `400 28px/1.45 ${HEAD}`, color: INK, marginTop: 18 }}>
            Every look is built on the 3840 × 2160 map, so one motion path reaches every
            surface at once. Logos centre on every screen; the curves carry motion only.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 34, opacity: foot }}>
          <img src={LOGO} alt="Soleia" style={{ height: 56, filter: 'brightness(0) invert(1)' }} />
          <div style={{ width: 2, height: 42, background: 'rgba(247,243,232,0.4)' }} />
          <Kicker color={N400}>Soleia Creative</Kicker>
        </div>
      </div>
    </div>
  );
}

/* ---------- the composition ---------- */
function Stage({ T }: { T: number }) {
  const fold = interpolate(
    [CUES.Fold + 0.3, CUES.Fold + 2.3, CUES.Remap + 0.2, CUES.Remap + 1.7],
    [0, 1, 1, 0], easeInOutCubic)(T);
  const sweepX = (T * 168) % FW;
  const flowOn = interpolate(
    [0.6, CUES.Flow - 0.2, CUES.Flow + 1.0, CUES.Fold + 0.5, CUES.Zones + 0.8, CUES.Remap + 0.4, CUES.Close - 0.3],
    [0, 0.35, 1, 0.9, 0.55, 0.7, 0.35])(T);
  const headOn = interpolate([CUES.Flow - 0.2, CUES.Flow + 1.0, CUES.Fold + 1.2, CUES.Zones - 0.2], [0, 1, 0.7, 0])(T);
  const labelOut = interpolate(
    [CUES.Fold + 0.2, CUES.Fold + 0.8, CUES.Zones + 0.1, CUES.Zones + 0.7, CUES.Remap + 0.2, CUES.Remap + 0.6, CUES.Remap + 1.7, CUES.Remap + 2.2],
    [0, 1, 1, 0, 0, 1, 1, 0])(T);
  const logoAll = anim(CUES.Logos + 0.25, 0.9)(T);
  const zoom = interpolate(
    [CUES.Map, CUES.Flow, CUES.Flow + 2.4, CUES.Fold + 0.4, CUES.Logos + 3],
    [1, 1.02, 1.1, 1, 1.04])(T);

  const Z = CUES.Zones, R0 = CUES.Remap;
  const cA = zc(ZBB);
  const zcs = ZONES.map((z) => zc(z.box));
  const keys = [CUES.Fold + 0.4, Z + 0.5, Z + 6.6, Z + 7.4, Z + 13.5, Z + 14.3, Z + 20.4, R0 + 0.1, R0 + 1.8];
  const camS = interpolate(keys,
    [1, ZONES[0].cam, ZONES[0].cam * 1.06, ZONES[1].cam, ZONES[1].cam * 1.06, ZONES[2].cam, ZONES[2].cam * 1.06, 1, 1], easeInOutCubic)(T);
  const camX = interpolate(keys,
    [960, zcs[0][0] - 14, zcs[0][0] + 12, zcs[1][0] + 14, zcs[1][0] - 12, zcs[2][0] - 12, zcs[2][0] + 10, cA[0], 960], easeInOutCubic)(T);
  const camY = interpolate(keys,
    [400, zcs[0][1] + 10, zcs[0][1] - 9, zcs[1][1] - 10, zcs[1][1] + 9, zcs[2][1] + 9, zcs[2][1] - 8, cA[1], 400], easeInOutCubic)(T);

  const stot = zoom * camS;
  const camT = `translate(${-(camX - 960) * stot}px, ${-(camY - 400) * stot}px) scale(${stot})`;
  const zoneAct = T < Z + 0.2 || T > R0 - 0.2 ? -1 : T < Z + 7.1 ? 0 : T < Z + 14.0 ? 1 : 2;
  const zonesLogo = anim(Z + 1.8, 1.2)(T);
  const frameOut = interpolate(
    [CUES.Fold + 0.1, CUES.Fold + 0.8, CUES.Remap + 0.4, CUES.Remap + 1.5], [0, 1, 1, 0])(T);

  const win = (a: number, b: number) => anim(a, 0.5)(T) * (1 - anim(b, 0.4)(T));
  const capMap = win(CUES.Map + 1.4, CUES.Flow - 0.3);
  const capFlow = win(CUES.Flow + 0.3, CUES.Fold - 0.3);
  const capFold = win(CUES.Fold + 1.6, CUES.Zones - 0.3);
  const capZ = [win(Z + 1.2, Z + 6.9), win(Z + 7.8, Z + 13.8), win(Z + 14.7, Z + 20.4), win(Z + 21.1, R0 - 0.25)];
  const capRemap = win(R0 + 0.9, CUES.Logos - 0.3);
  const capLogos = win(CUES.Logos + 0.5, CUES.Close - 0.3);

  const beforeClose = T < CUES.Close;
  const progress = clamp(T / TOTAL, 0, 1);

  return (
    <div style={{ position: 'absolute', inset: 0, background: GROUND, fontFamily: HEAD, overflow: 'hidden' }}>
      {beforeClose && (
        <div style={{ position: 'absolute', inset: 0, transform: camT, transformOrigin: '960px 400px' }}>
          <div style={{
            position: 'absolute', left: MX, top: MY, width: MAPW * S, height: MAPH * S,
            border: `2px solid ${BORDER}`, opacity: (1 - frameOut) * anim(0.1, 0.5)(T),
            background: 'rgba(33,26,19,0.55)',
          }} />
          <div style={{
            position: 'absolute', left: MX + MAPW * S - 470, width: 470, textAlign: 'right',
            top: MY + MAPH * S + 14, opacity: (1 - frameOut) * anim(0.25, 0.5)(T),
          }}>
            <Kicker size={19} color={N600}>Pixelmap — 3840 × 2160</Kicker>
          </div>

          {SCREENS.map((s, i) => (
            <ScreenPanel key={s.id} s={s} T={T} fold={fold}
              on={anim(0.35 + i * 0.05, 0.45)(T)} logoIn={Math.max(logoAll, zonesLogo)}
              sweepX={sweepX} flow={flowOn} headOn={headOn} />
          ))}

          <FlowTrails T={T} fold={fold} amp={flowOn} />

          <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
            {SCREENS.map((s, i) => (
              <ScreenLabel key={`${s.id}-l`} s={s} fold={fold}
                on={anim(0.35 + i * 0.05, 0.45)(T)} labelOut={labelOut} cs={camS} />
            ))}
          </div>

          {ZONES.map((z, zi) => (
            <div key={z.label} style={{
              position: 'absolute', left: z.box[0], top: z.box[1], width: z.box[2], height: z.box[3],
              opacity: fold * anim(CUES.Fold + 1.1, 0.7)(T) * (zoneAct < 0 || zoneAct === zi ? 1 : 0.2),
            }}>
              <div style={{ position: 'absolute', inset: 0, border: `${2 / camS}px solid ${ACCENT}`, opacity: zoneAct === zi ? 0.85 : 0.5 }} />
              <div style={{
                position: 'absolute',
                left: z.align === 'left' ? 0 : undefined,
                right: z.align === 'right' ? 0 : undefined,
                top: -36 / camS, whiteSpace: 'nowrap',
                transform: `scale(${1 / camS})`, transformOrigin: z.align === 'left' ? '0% 100%' : '100% 100%',
              }}>
                <Kicker size={19} color={ACCENT}>{z.label}</Kicker>
              </div>
            </div>
          ))}

          <div style={{
            position: 'absolute', left: MX - 228, top: MY + 1680 * S,
            opacity: (1 - labelOut) * (1 - fold) * anim(1.1, 0.5)(T),
          }}>
            <Kicker size={19} color={N600}>Sol Rays 1–6</Kicker>
          </div>
        </div>
      )}

      <CaptionBlock a={capMap} index="01 — the video map"
        title="Every surface lives on one file." spec="3840 × 2160 · DXV3 · 30–60 fps"
        body="Interior walls, the ceiling Sol Rays and the exterior pool-side screens each own a fixed rectangle of the same 3840 × 2160 frame." />
      <CaptionBlock a={capFlow} index="02 — how motion flows"
        title="One path crosses all of them." spec="Continuous across the map — no per-screen loops"
        body="Because the screens share the frame, a sweep travelling across the map reaches every surface in the same second. That is what makes the room read as one move instead of fifteen separate screens." />
      <CaptionBlock a={capFold} index="03 — in the room"
        title="The same rectangles, in place." spec="Mapped 1:1 to the venue geometry"
        body="Three zones: the main interior walls (curves, IMAG SR and SL, centre, DJ booth), the ceiling sky where the Sol Rays sit as one round array, and the exterior pool side — Outdoor SR, the Arch in the middle, Outdoor SL." />
      <CaptionBlock a={capZ[0]} index="04 — zone 01 · main interior walls"
        title="Nine surfaces, one pass." spec="Curves · IMAG SR / SL · centre · DJ booth"
        body="The IMAG walls, the two curves, the centre panel and the DJ booth all read from the same frame, so a single move travels the room without a seam." />
      <CaptionBlock a={capZ[1]} index="04 — zone 02 · ceiling sky"
        title="The Sol Rays, one array." spec="Twelve blades · sampled from the same file"
        body="The pass carries overhead. Twelve blades in a round array each show their own slice of the map, so the sweep crosses the ceiling as one move rather than twelve looping panels." />
      <CaptionBlock a={capZ[2]} index="04 — zone 03 · exterior pool side"
        title="Outside, on the same map." spec="Outdoor SR · Arch · Outdoor SL"
        body="The pool-side portrait panels and the wide outdoor arch sit in the same 3840 × 2160 frame — arrival content stays in step with the room inside." />
      <CaptionBlock a={capZ[3]} index="04 — three zones, one map"
        title="Fifteen surfaces, one file." spec="Interior · ceiling · exterior"
        body="Changing the look of the room is changing one file — never re-mapping fifteen screens." />
      <CaptionBlock a={capRemap} index="05 — back to the file"
        title="Back to one pixelmap." spec="3840 × 2160 · DXV3 · 30–60 fps"
        body="Every zone folds back into its rectangle. What you hand over is this one file — the room does the rest." />
      <CaptionBlock a={capLogos} index="06 — logo placement"
        title="Any background. Same mark." spec="DXV3 Alpha · 30–60 fps"
        body="The logo animation is one alpha file, so it sits centred over whichever pass is running — on every screen except the curves, which carry motion only." />

      {T >= CUES.Close && <CloseCard T={T} />}

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: T >= CUES.Close + 0.1 ? 0 : 1 }}>
        <div style={{ position: 'absolute', left: 60, top: 44, display: 'flex', gap: 22, alignItems: 'center' }}>
          <div style={{ width: 16, height: 16, background: ACCENT }} />
          <Kicker>Soleia Creative — video map</Kicker>
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 44, height: 2, background: DIV }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: `${progress * 100}%`, background: ACCENT }} />
        </div>
      </div>
    </div>
  );
}

export default function VideoMapExplainer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [T, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const startRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W));
    ro.observe(el);
    setScale(el.clientWidth / W);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    startRef.current = null;
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = (offsetRef.current + (now - startRef.current) / 1000) % TOTAL;
      setT(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      offsetRef.current = T;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const restart = () => { offsetRef.current = 0; startRef.current = null; setT(0); setPlaying(true); };
  const label = useMemo(() => {
    let name = SCENES[0].name as string;
    SCENES.forEach((s) => { if (T >= CUES[s.name]) name = s.name; });
    return name;
  }, [T]);

  return (
    <div
      ref={hostRef}
      className="relative w-full overflow-hidden rounded-3xl edge-gold surface-elevated bg-black"
      style={{ aspectRatio: '16 / 9' }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <Stage T={T} />
      </div>

      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-primary/30 bg-black/55 px-2 py-1.5 backdrop-blur-md">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
        >
          {playing ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Play</>}
        </button>
        <button
          onClick={restart}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restart
        </button>
        <span className="px-3 text-[10px] uppercase tracking-[0.18em] text-primary/90">{label}</span>
      </div>
    </div>
  );
}
