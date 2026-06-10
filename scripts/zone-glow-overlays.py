#!/usr/bin/env python3
"""Generate screen-shaped glow overlays for the venue map zones.

One transparent PNG per zone on the blueprint's native 1376x768 canvas; the
app stacks the active zone's overlay on the map and pulses it via CSS. Shapes
follow the screens themselves (band arcs, strips) rather than ellipses, traced
from the client's color-coded markups — to be refined from the PSD screen
layers when provided.

Outputs public/creative-guide/zone-glows/{main,arrival,tv}.png.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

W, H = 1376, 768
GOLD = (255, 186, 60)


def catmull_rom(pts, steps=16):
    p = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for j in range(steps):
            t = j / steps
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(pts[-1])
    return out


def band(pts, half_w):
    line = catmull_rom(pts)
    left, right = [], []
    for i, (x, y) in enumerate(line):
        a = line[max(i - 1, 0)]
        b = line[min(i + 1, len(line) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        n = math.hypot(dx, dy) or 1
        nx, ny = -dy / n, dx / n
        left.append((x + nx * half_w, y + ny * half_w))
        right.append((x - nx * half_w, y - ny * half_w))
    return left + right[::-1]


# Zone shapes: list of polygons / rounded rects per zone.
ZONES = {
    'main': [
        # SR Curve — upper bench-row arc
        ('poly', band([(908, 105), (985, 122), (1055, 152), (1125, 200)], 16)),
        # Stage wall arc — IMAG SR / Center / IMAG SL (the hatched screen arc)
        ('poly', band([(1128, 192), (1168, 240), (1192, 290), (1198, 335), (1190, 380), (1170, 420), (1148, 450)], 22)),
        # SL Curve — curb wall under the tiered seating
        ('poly', band([(952, 582), (1020, 562), (1090, 539), (1155, 508), (1196, 468)], 14)),
    ],
    'arrival': [
        ('rrect', (795, 230, 875, 465, 18)),
        ('rrect', (408, 420, 585, 525, 18)),
    ],
    'tv': [
        ('rrect', (509, 54, 729, 161, 18)),
    ],
}


def render(shapes):
    base = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(base)
    for kind, data in shapes:
        if kind == 'poly':
            d.polygon(data, fill=255)
        else:
            x0, y0, x1, y1, r = data
            d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=255)
    core = base.filter(ImageFilter.GaussianBlur(2.5))
    halo = base.filter(ImageFilter.GaussianBlur(14))
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # halo first, then core on top
    out.paste(Image.new('RGBA', (W, H), GOLD + (255,)), (0, 0), halo.point(lambda v: int(v * 0.55)))
    out.paste(Image.new('RGBA', (W, H), GOLD + (255,)), (0, 0), core.point(lambda v: int(v * 0.85)))
    return out


def main():
    os.makedirs('public/creative-guide/zone-glows', exist_ok=True)
    for zid, shapes in ZONES.items():
        render(shapes).save(f'public/creative-guide/zone-glows/{zid}.png')
        print('wrote', zid)


if __name__ == '__main__':
    main()
