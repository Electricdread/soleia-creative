#!/usr/bin/env python3
"""Replicate the SR curve screen onto the SL (lower) arc of the venue blueprints.

The isometric render shows the SR Curve screen as a narrow dark strip running
along the inside of the upper red roof band (client-confirmed). The SL side is
missing its screen, so this draws a matching strip along the inner edge of the
lower arc's red band — colors are sampled from the existing SR screen in each
colorway so the pair match exactly.

Run from the repo root; edits public/creative-guide/venue-blueprint-{light,dark}.png
in place. Coordinates are in the native 1376x768 frame.
"""
import math
from PIL import Image, ImageDraw

# Points along the existing SR screen strip (upper arc) — used for color sampling.
SR_SAMPLES = [(1000, 115), (1045, 133), (1090, 159)]

# Centerline of the replica strip: the inner edge of the lower red band, from
# beside the round terrace up to where the band meets the outer ring.
SL_PATH = [(962, 588), (1005, 608), (1055, 614), (1100, 604), (1140, 578), (1175, 540), (1200, 498), (1216, 455), (1222, 428)]
HALF_W = 3.5  # strip half-width (the SR screen reads ~7px wide)


def catmull_rom(pts, steps_per_seg=16):
    """Smooth polyline through pts (Catmull-Rom, clamped ends)."""
    p = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for j in range(steps_per_seg):
            t = j / steps_per_seg
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(pts[-1])
    return out


def offset_band(line, half_w):
    left, right = [], []
    for i, (x, y) in enumerate(line):
        a = line[max(i - 1, 0)]
        b = line[min(i + 1, len(line) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        n = math.hypot(dx, dy) or 1
        nx, ny = -dy / n, dx / n
        left.append((x + nx * half_w, y + ny * half_w))
        right.append((x - nx * half_w, y - ny * half_w))
    return left, right


def avg_color(img, pts):
    px = img.convert('RGB')
    cs = [px.getpixel(p) for p in pts]
    return tuple(sum(c[i] for c in cs) // len(cs) for i in range(3))


def draw_screen(img):
    face = avg_color(img, SR_SAMPLES)
    # soft top edge: halfway between the screen face and the adjacent walkway
    walk = avg_color(img, [(x, y + 8) for x, y in SR_SAMPLES])
    edge = tuple((f + w) // 2 for f, w in zip(face, walk))
    line = catmull_rom(SL_PATH)
    left, right = offset_band(line, HALF_W)
    out = img.convert('RGBA')
    d = ImageDraw.Draw(out)
    d.polygon(left + right[::-1], fill=face + (255,))
    # light top edge on the walkway side (matches how the SR screen reads)
    d.line(left, fill=edge + (255,), width=2, joint='curve')
    # subtle dark seam on the red-band side
    seam = tuple(max(c - 18, 0) for c in face)
    d.line(right, fill=seam + (255,), width=1, joint='curve')
    return out.convert('RGB'), face, edge


def main():
    for mode in ('light', 'dark'):
        path = f'public/creative-guide/venue-blueprint-{mode}.png'
        img, face, edge = draw_screen(Image.open(path))
        img.save(path)
        print(f'{mode}: face={face} edge={edge}')


if __name__ == '__main__':
    main()
