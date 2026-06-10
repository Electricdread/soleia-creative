#!/usr/bin/env python3
"""Main Room blueprint — front-on schematic matching the venue render.

Mirrors the composition of the Unreal/photo reference taken from the back of the
room looking at the stage: a sunburst of ~13 blue LED ceiling blades radiating
from a central hub with the faceted disco ball, the green wraparound LED curve
sweeping across the walls, and the stage wall of three color-coded screens —
SR IMAG (yellow), Center (green, arched), SL IMAG (red) — with the magenta DJ
booth in front and tiered seating in the foreground. Gold technical-line
aesthetic, light + dark colorways.

Renders SVGs to /tmp/main-room-{light,dark}.svg; rasterize at 1920x1080 and copy
to public/creative-guide/main-room-blueprint-{light,dark}.png.
"""
import math

W, H = 1920, 1080

C = dict(
    blade='#2a44ea', edge='#ff3a1f', curve='#16c39a',
    sr='#e6d011', center='#36d23a', sl='#ec3a16', dj='#e42ce0', sofa='#e04a64',
)

COLORWAYS = {
    'dark': dict(
        bg='#0e0c08', grid='rgba(232,165,31,0.06)', line='#e8a51f',
        dim='rgba(232,165,31,0.5)', faint='rgba(232,165,31,0.26)',
        text='#f3e3bd', sub='rgba(243,227,189,0.6)', steel='#5a6472',
        bladeOp='0.5', zoneOp='0.85',
    ),
    'light': dict(
        bg='#faf5ea', grid='rgba(160,106,16,0.09)', line='#a06a10',
        dim='rgba(160,106,16,0.55)', faint='rgba(160,106,16,0.3)',
        text='#3a2a10', sub='rgba(58,42,16,0.65)', steel='#8a93a0',
        bladeOp='0.38', zoneOp='0.85',
    ),
}

# ceiling hub
HX, HY = 960, 372
# blade-tip ellipse (room is wider than tall in this fisheye view)
BRX, BRY = 815, 470


def pol(a, r, cx=HX, cy=HY):
    t = math.radians(a)
    return (cx + r * math.cos(t), cy - r * math.sin(t))


def ell(a, rx=BRX, ry=BRY, cx=HX, cy=HY):
    t = math.radians(a)
    return (cx + rx * math.cos(t), cy - ry * math.sin(t))


def poly(points, fill, stroke, sw=1, op=1.0):
    pts = ' '.join(f'{x:.1f},{y:.1f}' for x, y in points)
    return f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'


def line(x0, y0, x1, y1, stroke, sw=1.2, op=1.0, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"{d}/>'


def label(x, y, t, c, size=17, fill=None, anchor='start', weight='600', spacing='0.16em'):
    return (f'<text x="{x}" y="{y}" font-family="DejaVu Sans Mono, monospace" font-size="{size}" '
            f'letter-spacing="{spacing}" font-weight="{weight}" fill="{fill or c["text"]}" '
            f'text-anchor="{anchor}">{t}</text>')


def leader(x0, y0, x1, y1, c):
    return (line(x0, y0, x1, y1, c['faint'], 1.2)
            + f'<circle cx="{x0:.1f}" cy="{y0:.1f}" r="3" fill="{c["line"]}"/>')


def swatch(x, y, color, c):
    return (f'<rect x="{x}" y="{y}" width="13" height="13" rx="2" fill="{color}" opacity="0.92" '
            f'stroke="{c["faint"]}" stroke-width="0.8"/>')


def mirror_ball(x, y, r, c):
    out = [f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c["bg"]}" stroke="{c["dim"]}" stroke-width="1.3"/>']
    for a in (30, 90, 150):
        p0 = pol(a, r, x, y); p1 = pol(a + 180, r, x, y)
        out.append(line(*p0, *p1, c['faint'], 0.8))
    for rr in (r * 0.55,):
        out.append(f'<circle cx="{x}" cy="{y}" r="{rr:.0f}" fill="none" stroke="{c["faint"]}" stroke-width="0.7"/>')
    return ''.join(out)


def build(mode):
    c = COLORWAYS[mode]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append(f'<rect width="{W}" height="{H}" fill="{c["bg"]}"/>')

    # grid
    for gx in range(0, W + 1, 48):
        s.append(line(gx, 0, gx, H, c['grid'], 1))
    for gy in range(0, H + 1, 48):
        s.append(line(0, gy, W, gy, c['grid'], 1))

    # frame
    s.append(f'<rect x="26" y="26" width="{W-52}" height="{H-52}" fill="none" stroke="{c["line"]}" stroke-width="2.5"/>')
    s.append(f'<rect x="36" y="36" width="{W-72}" height="{H-72}" fill="none" stroke="{c["faint"]}" stroke-width="1"/>')

    # ===== CEILING BLADES (sunburst), spanning the top hemisphere =====
    A0, A1, N = -16, 196, 13
    for i in range(N):
        a = A0 + (A1 - A0) * i / (N - 1)
        i1 = pol(a - 2.4, 54); i2 = pol(a + 2.4, 54)
        o1 = ell(a - 6.6); o2 = ell(a + 6.6)
        s.append(poly([i1, o1, o2, i2], C['blade'], C['blade'], 1, float(c['bladeOp'])))
        # red LED edge strips along each blade
        s.append(line(*i1, *o1, C['edge'], 2.2, 0.9))
        s.append(line(*i2, *o2, C['edge'], 2.2, 0.9))

    # central hub
    hub = [pol(a, 50) for a in range(0, 360, 45)]
    s.append(poly(hub, c['bg'], c['line'], 2))
    # faceted disco ball hanging below the hub
    dbx, dby, dbr = HX, HY + 96, 38
    s.append(f'<circle cx="{dbx}" cy="{dby}" r="{dbr}" fill="{c["bg"]}" stroke="{c["line"]}" stroke-width="2"/>')
    for a in range(0, 360, 30):
        p = pol(a, dbr, dbx, dby)
        s.append(line(dbx, dby, *p, c['faint'], 0.7))
    for rr in (dbr * 0.66, dbr * 0.33):
        s.append(f'<circle cx="{dbx}" cy="{dby}" r="{rr:.0f}" fill="none" stroke="{c["faint"]}" stroke-width="0.7"/>')
    s.append(line(dbx, HY + 8, dbx, dby - dbr, c['dim'], 1))  # drop line

    # satellite mirror balls
    for (mx, my, mr) in [(560, 470, 13), (1360, 470, 13), (430, 560, 11), (1490, 560, 11),
                          (700, 560, 10), (1220, 560, 10), (840, 600, 9), (1080, 600, 9)]:
        s.append(mirror_ball(mx, my, mr, c))

    # ===== GREEN WRAPAROUND CURVE (LED band sweeping across the walls) =====
    # bottom arc of a large high-centered ellipse -> gentle "smile" across the frame
    ecx, ecy = 960, -560
    r_out, r_in = 1235, 1180
    def band_arc(r):
        pts = []
        for x in range(96, W - 96 + 1, 24):
            dx = x - ecx
            if abs(dx) <= r:
                pts.append((x, ecy + math.sqrt(r * r - dx * dx)))
        return pts
    top = band_arc(r_in); bot = band_arc(r_out)
    pts = ' '.join(f'{x:.1f},{y:.1f}' for x, y in top) + ' ' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in reversed(bot))
    s.append(f'<polygon points="{pts}" fill="{C["curve"]}" stroke="{C["curve"]}" stroke-width="1.5" opacity="{c["zoneOp"]}"/>')

    # VIP wall booths beneath the curve, both sides (red curtained niches w/ portholes)
    for side in (-1, 1):
        for k in range(5):
            bx = 960 + side * (470 + k * 78)
            if not (130 < bx < W - 130):
                continue
            by = ecy + math.sqrt(max(r_out * r_out - (bx - ecx) ** 2, 0)) + 20
            s.append(f'<rect x="{bx-26:.1f}" y="{by:.1f}" width="52" height="58" rx="4" fill="{C["sofa"]}" opacity="0.4" stroke="{c["dim"]}" stroke-width="1"/>')
            s.append(f'<circle cx="{bx:.1f}" cy="{by+18:.1f}" r="9" fill="none" stroke="{c["dim"]}" stroke-width="1.1"/>')

    # ===== STAGE WALL (three color-coded screens) =====
    yT, yB = 690, 824
    # SR IMAG (audience left)
    s.append(f'<rect x="612" y="{yT}" width="252" height="{yB-yT}" rx="4" fill="{C["sr"]}" opacity="{c["zoneOp"]}" stroke="{C["sr"]}" stroke-width="1.5"/>')
    # SL IMAG (audience right)
    s.append(f'<rect x="1056" y="{yT}" width="252" height="{yB-yT}" rx="4" fill="{C["sl"]}" opacity="{c["zoneOp"]}" stroke="{C["sl"]}" stroke-width="1.5"/>')
    # CENTER screen with arch
    s.append(f'<rect x="872" y="{yT+6}" width="176" height="{yB-yT-6}" rx="4" fill="{C["center"]}" opacity="{c["zoneOp"]}" stroke="{C["center"]}" stroke-width="1.5"/>')
    s.append(f'<path d="M 906 {yB} L 906 {yT+58} A 54 54 0 0 1 1014 {yT+58} L 1014 {yB}" '
             f'fill="none" stroke="{c["bg"]}" stroke-width="2.4" opacity="0.7"/>')
    # truss line above the screens + side speaker arrays
    s.append(line(612, yT - 14, 1308, yT - 14, c['dim'], 2))
    for sx in (840, 1066):
        s.append(f'<rect x="{sx}" y="{yT-10}" width="28" height="74" fill="none" stroke="{c["dim"]}" stroke-width="1.3"/>')

    # structural columns flanking the stage
    for cxp in (548, 1372):
        s.append(f'<rect x="{cxp-9}" y="560" width="18" height="360" rx="3" fill="{c["bg"]}" stroke="{c["steel"]}" stroke-width="2"/>')
        s.append(line(cxp, 560, cxp, 920, c['faint'], 0.8))

    # ===== DJ BOOTH (magenta front) + speaker base =====
    bx0, bw = 846, 228
    s.append(f'<rect x="{bx0}" y="844" width="{bw}" height="48" rx="5" fill="none" stroke="{c["line"]}" stroke-width="1.8"/>')
    s.append(f'<rect x="{bx0}" y="892" width="{bw}" height="12" rx="3" fill="{C["dj"]}" opacity="0.92"/>')
    s.append(f'<rect x="{bx0+24}" y="904" width="{bw-48}" height="56" rx="3" fill="none" stroke="{c["dim"]}" stroke-width="1.4"/>')
    for gx in range(int(bx0 + 40), int(bx0 + bw - 30), 26):
        s.append(line(gx, 910, gx, 954, c['faint'], 1))

    # ===== FOREGROUND TIERED SEATING (perspective rows) =====
    for r, (yy, count, span) in enumerate([(984, 9, 760), (1024, 11, 900)]):
        for i in range(count):
            f = (i - (count - 1) / 2) / ((count - 1) / 2)
            x = 960 + f * span
            w = 60 + 6 * r
            s.append(f'<rect x="{x-w/2:.1f}" y="{yy}" width="{w}" height="22" rx="4" fill="none" stroke="{c["dim"]}" stroke-width="1.3"/>')
    # red sofa booths front and center
    for dx in (-150, -50, 50, 150):
        s.append(f'<rect x="{960+dx-44}" y="1004" width="88" height="30" rx="6" fill="{C["sofa"]}" opacity="0.55" stroke="{C["sofa"]}" stroke-width="1"/>')

    # ===== CALLOUTS =====
    # curves
    s.append(leader(300, 470, 270, 470, c))
    s.append(swatch(150, 460, C['curve'], c)); s.append(label(172, 472, 'SR CURVE', c)); s.append(label(150, 496, '2304×592', c, 13, c['sub']))
    s.append(leader(1620, 470, 1650, 470, c))
    s.append(swatch(1672, 460, C['curve'], c)); s.append(label(1694, 472, 'SL CURVE', c)); s.append(label(1672, 496, '2304×592', c, 13, c['sub']))
    # stage screens
    s.append(leader(700, yT, 470, 690, c))
    s.append(swatch(298, 678, C['sr'], c)); s.append(label(320, 690, 'SR IMAG', c)); s.append(label(298, 714, '1216×592', c, 13, c['sub']))
    s.append(leader(960, yT + 6, 960, 624, c))
    s.append(swatch(884, 612, C['center'], c)); s.append(label(906, 624, 'CENTER · 648×272', c))
    s.append(leader(1220, yT, 1450, 690, c))
    s.append(swatch(1452, 678, C['sl'], c)); s.append(label(1474, 690, 'SL IMAG', c)); s.append(label(1452, 714, '1216×592', c, 13, c['sub']))
    # dj booth
    s.append(leader(bx0, 898, 470, 898, c))
    s.append(swatch(298, 886, C['dj'], c)); s.append(label(320, 898, 'DJ BOOTH', c))
    # ceiling blades
    s.append(leader(*ell(150), 1452, 360, c))
    s.append(swatch(1452, 348, C['blade'], c)); s.append(label(1474, 360, 'LED CEILING BLADES ×13', c, 15))
    # disco ball + curtain note
    s.append(label(dbx, dby + dbr + 22, 'DISCO BALL', c, 12.5, c['sub'], 'middle'))
    s.append(label(960, 1066, 'TIERED VIP SEATING · DANCE FLOOR FRONT', c, 13, c['sub'], 'middle'))

    # ===== TITLE BLOCK =====
    s.append(label(64, 84, 'SOLEIA · LAS VEGAS', c, 16, c['sub']))
    s.append(f'<text x="62" y="128" font-family="DejaVu Serif, Georgia, serif" font-size="38" '
             f'font-style="italic" fill="{c["line"]}">Main Room</text>')
    s.append(label(64, 156, 'STAGE ELEVATION · LED ZONES COLOR-CODED · NTS', c, 12.5, c['sub']))
    s.append(line(62, 170, 470, 170, c['faint'], 1))

    # bottom strip
    s.append(line(62, H - 62, W - 62, H - 62, c['faint'], 1))
    s.append(label(64, H - 38, 'MAIN ROOM — IMMERSIVE LED SYSTEM', c, 13, c['sub']))
    s.append(label(W - 64, H - 38, 'SOLEIA CREATIVE GUIDE', c, 13, c['sub'], 'end'))

    s.append('</svg>')
    return '\n'.join(s)


for mode in COLORWAYS:
    path = f'/tmp/main-room-{mode}.svg'
    with open(path, 'w') as f:
        f.write(build(mode))
    print('wrote', path)
