#!/usr/bin/env python3
"""Generate the Main Room mapping-card image from the LED pixel map.

Recreates the client's teal pixel-map diagram of the main room screens —
SR Curve 2304x272, SR IMAG 1216x592, Center 640x272, SL IMAG 1216x592,
SL Curve 2304x272, DJ Booth 1260x168 — as test-pattern panels (banded curves,
quadrant IMAGs, checkered booth) with diagonal guides, dashed center circles,
corner registration marks and glossy label pills.

Outputs public/creative-guide/zone-cards/main-{light,dark}.png at 1600x472
(the established zone-card canvas), light/dark differing only in background.
"""
import math
from PIL import Image, ImageDraw, ImageFont

SS = 2  # supersample factor

# Real pixel-space layout: (label, x, y, w, h, style)
GAP = 24
SCREENS = [
    ('SR CURVE', 0, 0, 2304, 272, 'curve'),
    ('SR IMAG', 2304 + GAP, 0, 1216, 592, 'imag'),
    ('CENTER', 3520 + 2 * GAP, 0, 640, 272, 'imag'),
    ('SL IMAG', 4160 + 3 * GAP, 0, 1216, 592, 'imag'),
    ('SL CURVE', 5376 + 4 * GAP, 0, 2304, 272, 'curve'),
]
TOTAL_W = 5376 + 4 * GAP + 2304
DJ = ('DJ BOOTH', (TOTAL_W - 1260) // 2, 592 + GAP, 1260, 168, 'checker')
TOTAL_H = 592 + GAP + 168

CYAN_BANDS = [(98, 217, 238), (31, 167, 224), (143, 233, 242)]
QUAD = [(69, 240, 168), (43, 191, 138), (42, 140, 114), (30, 107, 88)]
RED = (255, 90, 90)
FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def draw_panel(d, x, y, w, h, style):
    if style == 'curve':
        hb = [0.22, 0.56, 0.22]
        cy = y
        for frac, col in zip(hb, CYAN_BANDS):
            d.rectangle([x, cy, x + w, cy + h * frac], fill=col)
            cy += h * frac
    elif style == 'imag':
        d.rectangle([x, y, x + w / 2, y + h / 2], fill=QUAD[0])
        d.rectangle([x + w / 2, y, x + w, y + h / 2], fill=QUAD[1])
        d.rectangle([x, y + h / 2, x + w / 2, y + h], fill=QUAD[2])
        d.rectangle([x + w / 2, y + h / 2, x + w, y + h], fill=QUAD[3])
    else:  # checker
        cols = 10
        cw = w / cols
        for i in range(cols):
            d.rectangle([x + i * cw, y, x + (i + 1) * cw, y + h], fill=QUAD[(i * 2 + 1) % 4])
    # diagonal guides + dashed center circle
    d.line([x, y, x + w, y + h], fill=(255, 255, 255, 160), width=2)
    d.line([x + w, y, x, y + h], fill=(255, 255, 255, 160), width=2)
    cx, cyc = x + w / 2, y + h / 2
    r = min(w, h) * 0.42
    steps = 60
    for i in range(0, steps, 2):
        a0, a1 = 2 * math.pi * i / steps, 2 * math.pi * (i + 1) / steps
        d.arc([cx - r, cyc - r, cx + r, cyc + r], math.degrees(a0), math.degrees(a1), fill=(255, 255, 255, 200), width=2)
    # red corner registration wedges
    s = min(w, h) * 0.12
    for px, py, sx, sy in [(x, y, 1, 1), (x + w, y, -1, 1), (x, y + h, 1, -1), (x + w, y + h, -1, -1)]:
        d.polygon([(px, py), (px + sx * s, py), (px, py + sy * s)], fill=RED)


def label_pill(img, d, cx, cy, title, dims, panel_h):
    # font sized from the panel's on-canvas height
    fs1 = int(max(13, min(40, panel_h * 0.24)))
    f1 = ImageFont.truetype(FONT_B, fs1)
    f2 = ImageFont.truetype(FONT_B, max(10, int(fs1 * 0.6)))
    t1 = d.textbbox((0, 0), title, font=f1)
    t2 = d.textbbox((0, 0), dims, font=f2)
    w1, h1 = t1[2] - t1[0], t1[3] - t1[1]
    w2, h2 = t2[2] - t2[0], t2[3] - t2[1]
    pw = max(w1, w2) + fs1
    ph1 = h1 + int(fs1 * 0.55)
    ph2 = h2 + int(fs1 * 0.35)
    y0 = cy - (ph1 + ph2) / 2
    # glossy dark pills
    d.rounded_rectangle([cx - pw / 2, y0, cx + pw / 2, y0 + ph1], radius=ph1 / 2, fill=(28, 28, 30), outline=(90, 90, 95), width=2)
    d.rounded_rectangle([cx - pw / 2, y0 + ph1 + 2, cx + pw / 2, y0 + ph1 + ph2], radius=ph2 / 2, fill=(38, 38, 42), outline=(90, 90, 95), width=2)
    d.text((cx - w1 / 2 - t1[0], y0 + (ph1 - h1) / 2 - t1[1]), title, font=f1, fill=(255, 255, 255))
    d.text((cx - w2 / 2 - t2[0], y0 + ph1 + 2 + (ph2 - h2) / 2 - t2[1]), dims, font=f2, fill=(235, 235, 235))


def build(bg):
    CW, CH = 1600 * SS, 472 * SS
    img = Image.new('RGB', (CW, CH), bg)
    d = ImageDraw.Draw(img, 'RGBA')
    margin = 30 * SS
    scale = (CW - 2 * margin) / TOTAL_W
    ox = margin
    oy = (CH - TOTAL_H * scale) / 2

    def m(v): return v * scale

    panels = SCREENS + [DJ]
    for label, x, y, w, h, style in panels:
        draw_panel(d, ox + m(x), oy + m(y), m(w), m(h), style)
    for label, x, y, w, h, style in panels:
        dims = f'W {w}  X  H {h}'
        label_pill(img, d, ox + m(x + w / 2), oy + m(y + h / 2), label, dims, m(h))
    return img.resize((1600, 472), Image.LANCZOS)


def main():
    build((251, 244, 227)).save('public/creative-guide/zone-cards/main-light.png')
    build((10, 9, 7)).save('public/creative-guide/zone-cards/main-dark.png')
    print('main zone cards written')


if __name__ == '__main__':
    main()
