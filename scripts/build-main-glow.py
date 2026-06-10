#!/usr/bin/env python3
"""Build the Main Interior glow overlay from UE screen-mesh projections.

Input: scripts/data/fitted_screens.json — screen-mesh vertices exported from
the Unreal project (scripts/ue_export_screens_all_cams.py), affine-fitted onto
the venue blueprint frame (see scripts/data/README in repo history for the
fit). Shapes are exact mesh projections, so the glow hugs the real screens.

Output: public/creative-guide/zone-glows/main.png (1376x768, transparent).
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1376, 768
GOLD = (255, 186, 60)

PANELS = {'LED_SR_IMAG', 'LED_SL_IMAG', 'LED_Center'}  # flat → convex hull
BANDS = {'LED_SR_Curves', 'LED_SL_Curves'}             # curved → point band


def convex_hull(pts):
    pts = sorted(map(tuple, pts))
    if len(pts) <= 2:
        return pts
    def half(seq):
        out = []
        for p in seq:
            while len(out) >= 2 and (out[-1][0]-out[-2][0])*(p[1]-out[-2][1]) - (out[-1][1]-out[-2][1])*(p[0]-out[-2][0]) <= 0:
                out.pop()
            out.append(p)
        return out
    lower, upper = half(pts), half(pts[::-1])
    return lower[:-1] + upper[:-1]


def main():
    data = json.load(open('scripts/data/fitted_screens.json'))
    mask = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(mask)

    for label, uv in data.items():
        px = [(u * W, v * H) for u, v in uv]
        if label in PANELS:
            d.polygon(convex_hull(px), fill=255)
        elif label in BANDS:
            for x, y in px:
                d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=255)

    # close the gaps between band dots, then trim back to size
    closed = mask.filter(ImageFilter.GaussianBlur(3)).point(lambda v: 255 if v > 110 else 0)
    core = closed.filter(ImageFilter.GaussianBlur(1.6))
    halo = closed.filter(ImageFilter.GaussianBlur(10))

    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.paste(Image.new('RGBA', (W, H), GOLD + (255,)), (0, 0), halo.point(lambda v: int(v * 0.5)))
    out.paste(Image.new('RGBA', (W, H), GOLD + (255,)), (0, 0), core.point(lambda v: int(v * 0.88)))
    out.save('public/creative-guide/zone-glows/main.png')
    print('wrote zone-glows/main.png')


if __name__ == '__main__':
    main()
