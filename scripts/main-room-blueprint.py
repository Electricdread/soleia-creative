#!/usr/bin/env python3
"""Generate the Main Room top-down blueprint (light + dark colorways).

Geometry is traced from the Unreal render of the main room: circular floor,
twelve LED ceiling blades radiating from the mirror-ball hub, wraparound LED
curves on both sides, and a faceted stage wall of SR IMAG / Center / SL IMAG
behind the DJ booth. Zone colors match the color-coded render.

Outputs SVGs to /tmp/main-room-{light,dark}.svg; rasterize at 1920x1080 (e.g.
open the SVG in headless chromium via playwright and screenshot) and copy to
public/creative-guide/main-room-blueprint-{light,dark}.png.
"""
import math

W, H = 1920, 1080
CX, CY, R = 960, 590, 360

ZONE = {
    'curve':  '#17c08f',
    'sr':     '#e3d418',
    'center': '#3fd43a',
    'sl':     '#e84a1e',
    'dj':     '#e23ce0',
    'blade':  '#2a3cdf',
}

COLORWAYS = {
    'dark': dict(
        bg='#0e0c08', grid='rgba(232,165,31,0.07)', line='#e8a51f',
        dim='rgba(232,165,31,0.5)', faint='rgba(232,165,31,0.28)',
        text='#f3e3bd', sub='rgba(243,227,189,0.6)', bladeOp='0.33',
    ),
    'light': dict(
        bg='#faf5ea', grid='rgba(160,106,16,0.10)', line='#a06a10',
        dim='rgba(160,106,16,0.55)', faint='rgba(160,106,16,0.30)',
        text='#3a2a10', sub='rgba(58,42,16,0.65)', bladeOp='0.24',
    ),
}

def pt(angle_deg, r, cx=CX, cy=CY):
    a = math.radians(angle_deg)
    return (cx + r * math.cos(a), cy - r * math.sin(a))

def arc_band(a0, a1, r_in, r_out, fill, stroke, sw=1.5, opacity=1.0):
    """Annular band from angle a0 to a1 (deg, CCW), as an SVG path."""
    large = 1 if (a1 - a0) % 360 > 180 else 0
    p0o, p1o = pt(a0, r_out), pt(a1, r_out)
    p0i, p1i = pt(a0, r_in), pt(a1, r_in)
    d = (f"M {p0o[0]:.1f} {p0o[1]:.1f} "
         f"A {r_out} {r_out} 0 {large} 0 {p1o[0]:.1f} {p1o[1]:.1f} "
         f"L {p1i[0]:.1f} {p1i[1]:.1f} "
         f"A {r_in} {r_in} 0 {large} 1 {p0i[0]:.1f} {p0i[1]:.1f} Z")
    return (f'<path d="{d}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}" opacity="{opacity}"/>')

def blade(angle, c):
    """Tapered ceiling blade: narrow at hub, wide at rim."""
    p = [pt(angle - 1.8, 86), pt(angle - 3.8, 322), pt(angle + 3.8, 322), pt(angle + 1.8, 86)]
    pts = ' '.join(f'{x:.1f},{y:.1f}' for x, y in p)
    return (f'<polygon points="{pts}" fill="{ZONE["blade"]}" opacity="{c["bladeOp"]}" '
            f'stroke="{ZONE["blade"]}" stroke-width="1"/>')

def seat(angle, r, c, w=46, h=16):
    x, y = pt(angle, r)
    rot = 90 - angle
    return (f'<rect x="{x - w/2:.1f}" y="{y - h/2:.1f}" width="{w}" height="{h}" rx="5" '
            f'fill="none" stroke="{c["dim"]}" stroke-width="1.4" '
            f'transform="rotate({rot:.1f} {x:.1f} {y:.1f})"/>')

def label(x, y, text, c, size=17, fill=None, anchor='start', spacing='0.18em', weight='600'):
    return (f'<text x="{x}" y="{y}" font-family="DejaVu Sans Mono, monospace" '
            f'font-size="{size}" letter-spacing="{spacing}" font-weight="{weight}" '
            f'fill="{fill or c["text"]}" text-anchor="{anchor}">{text}</text>')

def leader(x0, y0, x1, y1, c):
    return (f'<path d="M {x0} {y0} L {x1} {y1}" stroke="{c["faint"]}" '
            f'stroke-width="1.2" fill="none"/>'
            f'<circle cx="{x0}" cy="{y0}" r="2.6" fill="{c["line"]}"/>')

def swatch(x, y, color, c):
    return (f'<rect x="{x}" y="{y}" width="13" height="13" rx="2" fill="{color}" '
            f'opacity="0.9" stroke="{c["faint"]}" stroke-width="0.8"/>')

def build(mode):
    c = COLORWAYS[mode]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append(f'<rect width="{W}" height="{H}" fill="{c["bg"]}"/>')

    # grid
    for gx in range(0, W + 1, 48):
        s.append(f'<line x1="{gx}" y1="0" x2="{gx}" y2="{H}" stroke="{c["grid"]}" stroke-width="1"/>')
    for gy in range(0, H + 1, 48):
        s.append(f'<line x1="0" y1="{gy}" x2="{W}" y2="{gy}" stroke="{c["grid"]}" stroke-width="1"/>')

    # frame
    s.append(f'<rect x="26" y="26" width="{W-52}" height="{H-52}" fill="none" stroke="{c["line"]}" stroke-width="2.5"/>')
    s.append(f'<rect x="36" y="36" width="{W-72}" height="{H-72}" fill="none" stroke="{c["faint"]}" stroke-width="1"/>')

    # ceiling blades (under floor linework), hub gap toward stage handled by even spread
    for k in range(12):
        s.append(blade(15 + k * 30, c))

    # room shell
    s.append(f'<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="{c["line"]}" stroke-width="2.2"/>')
    s.append(f'<circle cx="{CX}" cy="{CY}" r="{R+14}" fill="none" stroke="{c["faint"]}" stroke-width="1"/>')

    # dance floor + hub
    s.append(f'<circle cx="{CX}" cy="{CY}" r="178" fill="none" stroke="{c["dim"]}" stroke-width="1.4" stroke-dasharray="7 7"/>')
    s.append(f'<circle cx="{CX}" cy="{CY}" r="58" fill="none" stroke="{c["faint"]}" stroke-width="1.2"/>')
    # mirror ball
    s.append(f'<circle cx="{CX}" cy="{CY}" r="24" fill="none" stroke="{c["line"]}" stroke-width="1.8"/>')
    for a in (0, 45, 90, 135):
        x0, y0 = pt(a, 24); x1, y1 = pt(a + 180, 24)
        s.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{c["faint"]}" stroke-width="1"/>')
    # satellite mirror balls
    for a, r in ((150, 250), (30, 250), (210, 270), (330, 270), (120, 300), (60, 300)):
        x, y = pt(a, r)
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="none" stroke="{c["dim"]}" stroke-width="1.2"/>')

    # LED curves (wraparound, both sides; entry gap at the back)
    s.append(arc_band(140, 252, R - 2, R + 16, ZONE['curve'], ZONE['curve'], 1.5, 0.85))
    s.append(arc_band(-72, 40, R - 2, R + 16, ZONE['curve'], ZONE['curve'], 1.5, 0.85))

    # stage wall facets: SR IMAG / CENTER / SL IMAG
    s.append(arc_band(104, 138, R - 2, R + 22, ZONE['sr'], ZONE['sr'], 1.5, 0.92))
    s.append(arc_band(77, 103, R - 2, R + 22, ZONE['center'], ZONE['center'], 1.5, 0.92))
    s.append(arc_band(42, 76, R - 2, R + 22, ZONE['sl'], ZONE['sl'], 1.5, 0.92))

    # stage columns
    for a in (139, 41):
        x, y = pt(a, R - 34)
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="13" fill="{c["bg"]}" stroke="{c["line"]}" stroke-width="2"/>')

    # DJ booth (magenta fascia faces the floor) + speaker stacks
    bx, by = CX, CY - R + 78
    s.append(f'<rect x="{bx-80}" y="{by}" width="160" height="44" rx="6" fill="none" stroke="{c["line"]}" stroke-width="1.8"/>')
    s.append(f'<rect x="{bx-80}" y="{by+44}" width="160" height="9" rx="3" fill="{ZONE["dj"]}" opacity="0.9"/>')
    for dx in (-128, 96):
        s.append(f'<rect x="{bx+dx}" y="{by+6}" width="32" height="30" fill="none" stroke="{c["dim"]}" stroke-width="1.3"/>')

    # entry gap at the back
    g0, g1 = pt(252, R), pt(288, R)
    s.append(f'<line x1="{g0[0]:.1f}" y1="{g0[1]:.1f}" x2="{g0[0]:.1f}" y2="{g0[1]+34:.1f}" stroke="{c["line"]}" stroke-width="1.6"/>')
    s.append(f'<line x1="{g1[0]:.1f}" y1="{g1[1]:.1f}" x2="{g1[0]:.1f}" y2="{g1[1]+34:.1f}" stroke="{c["line"]}" stroke-width="1.6"/>')

    # VIP banquettes: two arcs of seating around the lower half + rails
    for a in range(196, 345, 14):
        if not 246 <= a <= 294:
            s.append(seat(a, 232, c))
    for a in range(190, 351, 12):
        if not 246 <= a <= 294:
            s.append(seat(a, 296, c, w=52))
    s.append(arc_band(192, 348, 262, 263, 'none', c['faint'], 1.2))
    # red sofa island at center back
    for i, (dx, dy, w, h) in enumerate(((-66, -10, 38, 52), (-22, 18, 44, 20), (22, 18, 44, 20), (66, -10, 38, 52), (-22, -38, 44, 20), (22, -38, 44, 20))):
        s.append(f'<rect x="{CX+dx-w/2}" y="{CY+258+dy-h/2}" width="{w}" height="{h}" rx="5" fill="#e0506a" opacity="0.55" stroke="#e0506a" stroke-width="1"/>')

    # ---- callouts ----
    # stage zones
    x, y = pt(121, R + 26); s.append(leader(x, y, 430, 218, c))
    s.append(swatch(338, 206, ZONE['sr'], c)); s.append(label(360, 218, 'SR IMAG · 1216×592', c))
    x, y = pt(90, R + 26); s.append(leader(x, y, CX, 158, c))
    s.append(swatch(CX + 8, 146, ZONE['center'], c)); s.append(label(CX + 30, 158, 'CENTER · 648×272', c))
    x, y = pt(59, R + 26); s.append(leader(x, y, 1490, 218, c))
    s.append(swatch(1498, 206, ZONE['sl'], c)); s.append(label(1520, 218, 'SL IMAG · 1216×592', c))
    # curves
    x, y = pt(178, R + 10); s.append(leader(x, y, 470, 596, c))
    s.append(swatch(338, 584, ZONE['curve'], c)); s.append(label(360, 596, 'SR CURVE · 2304×592', c))
    x, y = pt(2, R + 10); s.append(leader(x, y, 1452, 596, c))
    s.append(swatch(1460, 584, ZONE['curve'], c)); s.append(label(1482, 596, 'SL CURVE · 2304×592', c))
    # dj + context
    s.append(leader(bx + 80, by + 48, 1340, 320, c))
    s.append(swatch(1348, 308, ZONE['dj'], c)); s.append(label(1370, 320, 'DJ BOOTH', c))
    x, y = pt(15, 330); s.append(leader(x, y, 1452, 452, c))
    s.append(swatch(1460, 440, ZONE['blade'], c)); s.append(label(1482, 452, 'LED CEILING BLADES ×12', c))
    s.append(label(CX, CY + 152, 'DANCE FLOOR', c, 15, c['sub'], 'middle'))
    s.append(label(CX, CY + 84, 'MIRROR BALL', c, 12.5, c['sub'], 'middle'))
    s.append(label(CX, CY + R + 58, 'ENTRY', c, 15, c['sub'], 'middle'))
    x, y = pt(214, 296); s.append(leader(x, y, 430, 880, c))
    s.append(label(300, 892, 'VIP BANQUETTES', c, 15, c['sub']))

    # title block
    s.append(label(64, 84, 'SOLEIA · LAS VEGAS', c, 16, c['sub']))
    s.append(f'<text x="62" y="128" font-family="DejaVu Serif, Georgia, serif" font-size="38" '
             f'font-style="italic" fill="{c["line"]}">Main Room</text>')
    s.append(label(64, 156, 'PLAN VIEW · LED ZONES COLOR-CODED · NOT TO SCALE', c, 12.5, c['sub']))
    s.append(f'<line x1="62" y1="170" x2="430" y2="170" stroke="{c["faint"]}" stroke-width="1"/>')

    # compass
    s.append(f'<circle cx="1816" cy="118" r="30" fill="none" stroke="{c["line"]}" stroke-width="1.8"/>')
    s.append(f'<path d="M 1816 96 L 1824 126 L 1816 119 L 1808 126 Z" fill="{c["line"]}"/>')
    s.append(label(1816, 174, 'STAGE ▲', c, 12.5, c['sub'], 'middle'))

    # bottom strip
    s.append(f'<line x1="62" y1="{H-62}" x2="{W-62}" y2="{H-62}" stroke="{c["faint"]}" stroke-width="1"/>')
    s.append(label(64, H - 38, 'MAIN ROOM — IMMERSIVE LED SYSTEM', c, 13, c['sub']))
    s.append(label(W - 64, H - 38, 'SOLEIA CREATIVE GUIDE', c, 13, c['sub'], 'end'))

    s.append('</svg>')
    return '\n'.join(s)

for mode in COLORWAYS:
    path = f'/tmp/main-room-{mode}.svg'
    with open(path, 'w') as f:
        f.write(build(mode))
    print('wrote', path)
