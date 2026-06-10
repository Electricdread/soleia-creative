#!/usr/bin/env python3
"""Add the missing curve LED screen band to the venue blueprints.

The isometric venue render shows only one curve screen on the amphitheatre;
the second one (lower-right walkway arc, marked by the client in blue on the
layout) is missing. This draws it into both colorways along the marked path:
a dark hatched band matching the look of the existing curve screen, with the
venue-red rim.

Run from the repo root; edits public/creative-guide/venue-blueprint-{light,dark}.png
in place.
"""
import math
from PIL import Image, ImageDraw

# Quadratic bezier traced from the client's blue marking (1376x768 frame):
# the walkway arc between the tiered seating and the outer bench row.
P0 = (995, 577)
C = (1115, 530)
P2 = (1205, 449)
HALF_W = 16  # band half-width in px


def bez(t):
    x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t ** 2 * P2[0]
    y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t ** 2 * P2[1]
    return x, y


def band_polygon(steps=48):
    left, right = [], []
    for i in range(steps + 1):
        t = i / steps
        x, y = bez(t)
        # tangent
        dx = 2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P2[0] - C[0])
        dy = 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P2[1] - C[1])
        n = math.hypot(dx, dy) or 1
        nx, ny = -dy / n, dx / n
        left.append((x + nx * HALF_W, y + ny * HALF_W))
        right.append((x - nx * HALF_W, y - ny * HALF_W))
    return left + right[::-1]


def draw_band(img, fill, hatch, rim):
    poly = band_polygon()
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.polygon(poly, fill=fill)
    # diagonal hatch clipped to the band
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    hatch_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(hatch_layer)
    for x0 in range(900, 1320, 7):
        hd.line([(x0, 620), (x0 + 200, 420)], fill=hatch, width=1)
    overlay.paste(hatch_layer, (0, 0), Image.composite(mask, Image.new('L', img.size, 0), mask))
    # rim
    d.line(poly + [poly[0]], fill=rim, width=2, joint='curve')
    return Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')


def main():
    light = Image.open('public/creative-guide/venue-blueprint-light.png')
    dark = Image.open('public/creative-guide/venue-blueprint-dark.png')

    light = draw_band(light, (38, 38, 43, 255), (62, 62, 70, 255), (140, 31, 31, 255))
    dark = draw_band(dark, (44, 44, 50, 255), (74, 74, 84, 255), (158, 36, 36, 255))

    light.save('public/creative-guide/venue-blueprint-light.png')
    dark.save('public/creative-guide/venue-blueprint-dark.png')
    print('bands drawn')


if __name__ == '__main__':
    main()
