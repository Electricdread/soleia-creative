#!/usr/bin/env python3
"""Top-down MAIN ROOM LED plan, drawn from the Unreal geometry export.

Reads scripts/data/venue_plan.json (world-space mesh vertices exported via
scripts/ue_export_plan.py) and renders a clean plan of the main-room LED
system — SR/SL curves, SR/SL IMAG, Center, and the six sunray ceiling blades —
in the site's gold technical-blueprint style, light + dark colorways.

NOTE: the export contained only LED actors, so this is the LED plan only; venue
massing (pools, cabanas, walls) needs an export that includes those meshes.

Outputs /tmp/mainroom-plan-{light,dark}.png at 1376x768.
"""
import json
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1376, 768
DATA = 'scripts/data/venue_plan.json'
FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_M = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'

CW = {
    'dark': dict(bg=(14, 12, 8), grid=(232, 165, 31, 18), line=(232, 165, 31),
                 fill=(232, 165, 31, 60), faint=(232, 165, 31, 70), text=(243, 227, 189),
                 sub=(243, 227, 189, 150)),
    'light': dict(bg=(250, 244, 230), grid=(160, 106, 16, 22), line=(160, 106, 16),
                  fill=(160, 106, 16, 55), faint=(160, 106, 16, 80), text=(58, 42, 16),
                  sub=(58, 42, 16, 165)),
}

MAIN = ['LED_SR_Curves', 'LED_SL_Curves', 'LED_SR_IMAG', 'LED_SL_IMAG', 'LED_Center',
        'LED_Sol_Rays_Sunray_1', 'LED_Sol_Rays_Sunray_2', 'LED_Sol_Rays_Sunray_3',
        'LED_Sol_Rays_Sunray_4', 'LED_Sol_Rays_Sunray_5', 'LED_Sol_Rays_Sunray_6']
LABELS = {'LED_SR_Curves': 'SR CURVE', 'LED_SL_Curves': 'SL CURVE', 'LED_SR_IMAG': 'IMAG SR',
          'LED_SL_IMAG': 'IMAG SL', 'LED_Center': 'CENTER'}


def hull(pts):
    pts = sorted(set(map(tuple, pts)))
    if len(pts) <= 2:
        return pts
    def cross(o, a, b):
        return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lo = []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    up = []
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0:
            up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]


def main():
    d = json.load(open(DATA))
    acts = {a['label']: a for a in d['actors'] if a['label'] in MAIN and 'verts' in a}

    # world bounds (plan = X,Y) across main-room actors
    xs, ys = [], []
    for a in acts.values():
        for x, y, z in a['verts']:
            xs.append(x); ys.append(y)
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    pad = 90
    sx = (W - 2 * pad) / (x1 - x0)
    sy = (H - 2 * pad) / (y1 - y0)
    s = min(sx, sy)
    # world X -> image Y (room is taller in X), world Y -> image X, so the stage
    # wall (high X) sits at the bottom and curves wrap left/right like the render
    ox = (W - (y1 - y0) * s) / 2
    oy = (H - (x1 - x0) * s) / 2

    def P(wx, wy):
        return (ox + (wy - y0) * s, oy + (wx - x0) * s)

    for mode, c in CW.items():
        img = Image.new('RGB', (W, H), c['bg'])
        dr = ImageDraw.Draw(img, 'RGBA')
        for gx in range(0, W, 48):
            dr.line([(gx, 0), (gx, H)], fill=c['grid'], width=1)
        for gy in range(0, H, 48):
            dr.line([(0, gy), (W, gy)], fill=c['grid'], width=1)
        dr.rectangle([24, 24, W - 24, H - 24], outline=c['line'], width=2)

        # sunray blades (ceiling) — faint spokes from room centre
        cx = sum(P(a['bbox'][0], a['bbox'][1])[0] for k, a in acts.items() if 'Sunray' in k) / 6
        cy = sum(P(a['bbox'][0], a['bbox'][1])[1] for k, a in acts.items() if 'Sunray' in k) / 6
        for k, a in acts.items():
            if 'Sunray' not in k:
                continue
            poly = [P(x, y) for x, y, z in a['verts']]
            dr.polygon(hull(poly), fill=(c['faint'][0], c['faint'][1], c['faint'][2], 30),
                       outline=c['faint'], width=1)

        # screen panels + curves — solid gold outlines
        f = ImageFont.truetype(FONT_M, 15)
        for k, a in acts.items():
            if 'Sunray' in k:
                continue
            poly = hull([P(x, y) for x, y, z in a['verts']])
            dr.polygon(poly, fill=c['fill'], outline=c['line'], width=3)
            mx = sum(p[0] for p in poly) / len(poly)
            my = sum(p[1] for p in poly) / len(poly)
            t = LABELS.get(k, k)
            tb = dr.textbbox((0, 0), t, font=f)
            dr.text((mx - (tb[2]-tb[0]) / 2, my - (tb[3]-tb[1]) / 2), t, font=f, fill=c['text'])

        # title block
        fT = ImageFont.truetype(FONT_M, 14)
        fH = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', 34)
        dr.text((40, 40), 'SOLEIA · LAS VEGAS', font=fT, fill=c['sub'])
        dr.text((38, 64), 'Main Room', font=fH, fill=c['line'])
        dr.text((40, 110), 'INTERIOR LED PLAN · FROM UE GEOMETRY · NTS', font=ImageFont.truetype(FONT_M, 12), fill=c['sub'])

        img.save(f'/tmp/mainroom-plan-{mode}.png')
        print('wrote', mode)


if __name__ == '__main__':
    main()
