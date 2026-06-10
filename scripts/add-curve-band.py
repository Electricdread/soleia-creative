#!/usr/bin/env python3
"""Draw the SR + SL curve LED screens into the venue blueprints.

The isometric venue render doesn't show the two amphitheatre curve screens, so
both are drawn in as matching hatched dark bands with the venue-red rim — the
same treatment for each, per the client's blue markings on the layout:

- SR Curve: the lower walkway arc (round terrace up toward the right edge).
- SL Curve: the upper bench-row arc (round terrace down to the Main screens).

Run from the repo root; edits public/creative-guide/venue-blueprint-{light,dark}.png
in place. Coordinates are in the blueprints' native 1376x768 frame.
"""
import math
from PIL import Image, ImageDraw

# Quadratic beziers traced from the client's blue markings: (P0, C, P2, half_w)
BANDS = [
    # SR Curve — lower walkway arc
    ((995, 577), (1115, 530), (1205, 449), 16),
    # SL Curve — upper bench-row arc
    ((910, 112), (1028, 128), (1122, 202), 16),
]


def bez(p0, c, p2, t):
    x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p2[0]
    y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p2[1]
    return x, y


def band_polygon(p0, c, p2, half_w, steps=48):
    left, right = [], []
    for i in range(steps + 1):
        t = i / steps
        x, y = bez(p0, c, p2, t)
        dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p2[0] - c[0])
        dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p2[1] - c[1])
        n = math.hypot(dx, dy) or 1
        nx, ny = -dy / n, dx / n
        left.append((x + nx * half_w, y + ny * half_w))
        right.append((x - nx * half_w, y - ny * half_w))
    return left + right[::-1]


def draw_bands(img, fill, hatch, rim):
    out = img.convert('RGBA')
    for p0, c, p2, half_w in BANDS:
        poly = band_polygon(p0, c, p2, half_w)
        xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
        overlay = Image.new('RGBA', out.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)
        d.polygon(poly, fill=fill)
        # diagonal hatch clipped to the band
        mask = Image.new('L', out.size, 0)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        hatch_layer = Image.new('RGBA', out.size, (0, 0, 0, 0))
        hd = ImageDraw.Draw(hatch_layer)
        x0, x1 = int(min(xs)) - 120, int(max(xs)) + 120
        y0, y1 = int(min(ys)), int(max(ys))
        for hx in range(x0, x1, 7):
            hd.line([(hx, y1 + 40), (hx + (y1 - y0) + 80, y0 - 40)], fill=hatch, width=1)
        overlay.paste(hatch_layer, (0, 0), mask)
        d.line(poly + [poly[0]], fill=rim, width=2, joint='curve')
        out = Image.alpha_composite(out, overlay)
    return out.convert('RGB')


def main():
    light = Image.open('public/creative-guide/venue-blueprint-light.png')
    dark = Image.open('public/creative-guide/venue-blueprint-dark.png')

    light = draw_bands(light, (38, 38, 43, 255), (62, 62, 70, 255), (140, 31, 31, 255))
    dark = draw_bands(dark, (44, 44, 50, 255), (74, 74, 84, 255), (158, 36, 36, 255))

    light.save('public/creative-guide/venue-blueprint-light.png')
    dark.save('public/creative-guide/venue-blueprint-dark.png')
    print('SR + SL curve bands drawn')


if __name__ == '__main__':
    main()
