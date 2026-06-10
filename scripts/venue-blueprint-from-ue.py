#!/usr/bin/env python3
"""Venue Layout blueprint generated from the Unreal geometry export.

Single source of truth: scripts/data/venue_plan.json (world-space footprints +
LED mesh vertices from scripts/ue_export_plan.py). Renders:

  public/creative-guide/venue-blueprint-light.png   (1376x768)
  public/creative-guide/venue-blueprint-dark.png
  public/creative-guide/zone-glows/{main,arrival,tv}.png

…all through the same world->image projection, so the zone glow overlays are
pixel-registered with the blueprint by construction. Also prints the zone
region extents (percent) for ZONE_PINS auto-focus framing.

Style: the site's gold technical-blueprint language (grid, double frame,
serif title block, street labels), bright + dark colorways.
"""
import json
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1376, 768
SS = 2  # supersample
DATA = 'scripts/data/venue_plan.json'
F_SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
F_MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
F_MONO_B = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'

GOLD_GLOW = (255, 186, 60)

CW = {
    'light': dict(bg=(250, 244, 230), grid=(160, 106, 16, 20), line=(160, 106, 16),
                  dim=(160, 106, 16, 140), faint=(160, 106, 16, 70), fill=(160, 106, 16, 38),
                  screen=(160, 106, 16, 95), water=(96, 160, 175, 60), text=(58, 42, 16),
                  sub=(58, 42, 16, 160)),
    'dark': dict(bg=(14, 12, 8), grid=(232, 165, 31, 14), line=(232, 165, 31),
                 dim=(232, 165, 31, 130), faint=(232, 165, 31, 60), fill=(232, 165, 31, 26),
                 screen=(232, 165, 31, 95), water=(110, 190, 205, 55), text=(243, 227, 189),
                 sub=(243, 227, 189, 150)),
}

ZONES = {
    'main': ['LED_SR_Curves', 'LED_SL_Curves', 'LED_SR_IMAG', 'LED_SL_IMAG', 'LED_Center', 'LED_DJ_Booth'],
    'arrival': ['outdoor_sr_box', 'outdoor_sl_box', 'LED_Outdoor_Screen', 'LED_Outdoor_Arch_Screen'],
    'tv': [],  # filled with TV_* actors at load time
}

SCREEN_LABELS = {
    'LED_SR_Curves': 'SR CURVE', 'LED_SL_Curves': 'SL CURVE', 'LED_SR_IMAG': 'IMAG SR',
    'LED_SL_IMAG': 'IMAG SL', 'LED_Center': 'CENTER', 'LED_DJ_Booth': 'DJ BOOTH',
    'LED_Outdoor_Screen': 'OUTDOOR SCREEN', 'LED_Outdoor_Arch_Screen': 'OUTDOOR ARCH',
    'outdoor_sr_box': 'OUTDOOR SR', 'outdoor_sl_box': 'OUTDOOR SL',
    'LED_Stage_Arch': 'STAGE ARCH',
}


def hull(pts):
    pts = sorted(set((round(x, 1), round(y, 1)) for x, y in pts))
    if len(pts) <= 2:
        return list(pts)
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


class Plan:
    def __init__(self):
        d = json.load(open(DATA))
        self.acts = {a['label']: a for a in d['actors']}
        self.by_prefix = {}
        for a in d['actors']:
            self.by_prefix.setdefault(self._pre(a['label']), []).append(a)
        ZONES['tv'] = [a['label'] for a in d['actors'] if self._pre(a['label']) == 'TV']

        # bounds from floors + rooms + pools + screens (ignore stray props)
        keep = []
        for a in d['actors']:
            p = self._pre(a['label'])
            if p in ('Floor', 'floor_inside', 'Floor_outside', 'Rooms', 'pool', 'pool2') or 'LED' in a['label']:
                keep.append(a)
        xs, ys = [], []
        for a in keep:
            ox, oy, ex, ey, _, _ = a['bbox']
            xs += [ox - ex, ox + ex]
            ys += [oy - ey, oy + ey]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        pad = 64 * SS
        s = min((W * SS - 2 * pad) / (x1 - x0), (H * SS - 2 * pad) / (y1 - y0))
        self.s = s
        self.ox = (W * SS - (x1 - x0) * s) / 2 - x0 * s
        self.oy = (H * SS - (y1 - y0) * s) / 2 - y0 * s

    @staticmethod
    def _pre(label):
        import re
        return re.sub(r'[_\s]*\d+$', '', label)

    def P(self, wx, wy):
        return (self.ox + wx * self.s, self.oy + wy * self.s)

    def rect(self, a, grow=0):
        ox, oy, ex, ey, _, _ = a['bbox']
        x0, y0 = self.P(ox - ex, oy - ey)
        x1, y1 = self.P(ox + ex, oy + ey)
        return [x0 - grow, y0 - grow, x1 + grow, y1 + grow]

    def vhull(self, a):
        return hull([self.P(x, y) for x, y, z in a['verts']]) if a.get('verts') else None


def draw_blueprint(plan, mode):
    c = CW[mode]
    img = Image.new('RGB', (W * SS, H * SS), c['bg'])
    d = ImageDraw.Draw(img, 'RGBA')

    # grid + frame
    for gx in range(0, W * SS, 48 * SS):
        d.line([(gx, 0), (gx, H * SS)], fill=c['grid'], width=SS)
    for gy in range(0, H * SS, 48 * SS):
        d.line([(0, gy), (W * SS, gy)], fill=c['grid'], width=SS)

    A = plan.acts
    pre = plan.by_prefix

    # floors — faint footprint slabs
    for label in ('floor_inside', 'floor_inside_002', 'Floor_outside'):
        if label in A:
            d.rounded_rectangle(plan.rect(A[label]), radius=14 * SS, fill=c['fill'], outline=c['faint'], width=SS)

    # main-room circle (roof footprint as room outline)
    if 'Roof' in A:
        d.ellipse(plan.rect(A['Roof']), outline=c['dim'], width=2 * SS)

    # pools
    for label, name in (('pool', 'POOL'), ('pool2', 'POOL 2'), ('Circle', 'STAGE')):
        if label not in A:
            continue
        r = plan.rect(A[label])
        if label == 'Circle':
            d.rounded_rectangle(r, radius=8 * SS, fill=c['fill'], outline=c['dim'], width=2 * SS)
        else:
            d.rounded_rectangle(r, radius=20 * SS, fill=c['water'], outline=c['dim'], width=2 * SS)
        f = ImageFont.truetype(F_MONO, 11 * SS)
        tb = d.textbbox((0, 0), name, font=f)
        d.text(((r[0] + r[2]) / 2 - (tb[2] - tb[0]) / 2, (r[1] + r[3]) / 2 - (tb[3] - tb[1]) / 2),
               name, font=f, fill=c['sub'])

    # cabana / bungalow rooms
    for a in pre.get('Rooms', []):
        d.rectangle(plan.rect(a), outline=c['dim'], width=SS)

    # stairs
    if 'Stairs' in A:
        r = plan.rect(A['Stairs'])
        d.rectangle(r, outline=c['faint'], width=SS)
        for i in range(1, 5):
            yy = r[1] + (r[3] - r[1]) * i / 5
            d.line([(r[0], yy), (r[2], yy)], fill=c['faint'], width=SS)

    # furniture — seating, beds, tables
    for p in ('Couch_APPLYSUBD', 'sofa_short4', 'sofa_short', 'sofa_long', 'SOFA_ROUNDED_FRAME', 'SOFA_INDOOR_L_SHAPE', 'bed', 'BED_TABLE'):
        for a in pre.get(p, []):
            r = plan.rect(a)
            if (r[2] - r[0]) * (r[3] - r[1]) < (260 * SS) ** 2:
                d.rectangle(r, outline=c['faint'], width=SS)
    for p in ('table', 'INDOOR_TABLE'):
        for a in pre.get(p, []):
            r = plan.rect(a)
            if (r[2] - r[0]) < 80 * SS:
                d.ellipse(r, outline=c['faint'], width=SS)

    # palms
    for p in ('SM_Windmill_Palm', 'SM_Coconut_Tree'):
        for a in pre.get(p, []):
            x, y = plan.P(a['bbox'][0], a['bbox'][1])
            rr = 9 * SS
            for k in range(6):
                ang = k * math.pi / 3
                d.line([(x, y), (x + rr * math.cos(ang), y + rr * math.sin(ang))], fill=c['dim'], width=SS)
            d.ellipse([x - 2 * SS, y - 2 * SS, x + 2 * SS, y + 2 * SS], fill=c['dim'])

    # TVs — small solid markers
    for label in ZONES['tv']:
        a = A[label]
        x, y = plan.P(a['bbox'][0], a['bbox'][1])
        d.rectangle([x - 3 * SS, y - 3 * SS, x + 3 * SS, y + 3 * SS], fill=c['screen'], outline=c['line'], width=SS)

    # sunray ceiling blades — faint spokes
    for a in pre.get('LED_Sol_Rays_Sunray', []):
        ph = plan.vhull(a)
        if ph:
            d.polygon(ph, fill=(c['faint'][0], c['faint'][1], c['faint'][2], 22), outline=c['faint'], width=SS)

    # mirror ball
    if 'Mirror_ball' in A:
        x, y = plan.P(A['Mirror_ball']['bbox'][0], A['Mirror_ball']['bbox'][1])
        d.ellipse([x - 6 * SS, y - 6 * SS, x + 6 * SS, y + 6 * SS], outline=c['line'], width=SS)

    # LED screens — prominent
    def draw_screen(label):
        a = A.get(label)
        if not a:
            return None
        ph = plan.vhull(a)
        if ph and len(ph) >= 3:
            d.polygon(ph, fill=c['screen'], outline=c['line'], width=2 * SS)
            xs = [p[0] for p in ph]; ys = [p[1] for p in ph]
        else:
            r = plan.rect(a, grow=2 * SS)
            d.rectangle(r, fill=c['screen'], outline=c['line'], width=2 * SS)
            xs = [r[0], r[2]]; ys = [r[1], r[3]]
        return (min(xs), min(ys), max(xs), max(ys))

    boxes = {}
    for label in SCREEN_LABELS:
        b = draw_screen(label)
        if b:
            boxes[label] = b

    # screen labels with small offsets to avoid overlap
    f = ImageFont.truetype(F_MONO_B, 11 * SS)
    OFF = {'LED_SR_Curves': (0, -16), 'LED_SL_Curves': (0, 16), 'LED_SR_IMAG': (30, -12),
           'LED_SL_IMAG': (30, 12), 'LED_Center': (44, 0), 'LED_DJ_Booth': (-52, 0),
           'LED_Outdoor_Screen': (0, -18), 'LED_Outdoor_Arch_Screen': (0, 16),
           'outdoor_sr_box': (0, -16), 'outdoor_sl_box': (0, 16), 'LED_Stage_Arch': (0, -20)}
    for label, b in boxes.items():
        t = SCREEN_LABELS[label]
        ox_, oy_ = OFF.get(label, (0, -14))
        mx = (b[0] + b[2]) / 2 + ox_ * SS
        my = (b[1] + b[3]) / 2 + oy_ * SS
        tb = d.textbbox((0, 0), t, font=f)
        d.text((mx - (tb[2] - tb[0]) / 2, my - (tb[3] - tb[1]) / 2), t, font=f, fill=c['text'])

    # frame + title block + street labels
    d.rectangle([24 * SS, 24 * SS, W * SS - 24 * SS, H * SS - 24 * SS], outline=c['line'], width=2 * SS)
    d.rectangle([32 * SS, 32 * SS, W * SS - 32 * SS, H * SS - 32 * SS], outline=c['faint'], width=SS)
    d.text((48 * SS, 46 * SS), 'SOLEIA · LAS VEGAS', font=ImageFont.truetype(F_MONO, 11 * SS), fill=c['sub'])
    d.text((46 * SS, 64 * SS), 'Venue Layout', font=ImageFont.truetype(F_SERIF, 27 * SS), fill=c['line'])
    d.text((48 * SS, 102 * SS), 'TOP-DOWN PLAN · GENERATED FROM UE GEOMETRY · NOT TO SCALE',
           font=ImageFont.truetype(F_MONO, 9 * SS), fill=c['sub'])
    fs = ImageFont.truetype(F_MONO, 10 * SS)
    d.text((48 * SS, H * SS - 44 * SS), 'FLAMINGO ROAD', font=fs, fill=c['sub'])
    d.text((W * SS - 220 * SS, H * SS - 44 * SS), 'SOLEIA CREATIVE GUIDE', font=fs, fill=c['sub'])

    return img.resize((W, H), Image.LANCZOS)


def draw_glows(plan):
    for zone, labels in ZONES.items():
        mask = Image.new('L', (W * SS, H * SS), 0)
        d = ImageDraw.Draw(mask)
        for label in labels:
            a = plan.acts.get(label)
            if not a:
                continue
            ph = plan.vhull(a)
            if ph and len(ph) >= 3:
                d.polygon(ph, fill=255)
            else:
                r = plan.rect(a, grow=2 * SS)
                if zone == 'tv':
                    x, y = plan.P(a['bbox'][0], a['bbox'][1])
                    d.rectangle([x - 4 * SS, y - 4 * SS, x + 4 * SS, y + 4 * SS], fill=255)
                else:
                    d.rectangle(r, fill=255)
        mask = mask.resize((W, H), Image.LANCZOS)
        core = mask.filter(ImageFilter.GaussianBlur(1.2))
        halo = mask.filter(ImageFilter.GaussianBlur(9))
        out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        out.paste(Image.new('RGBA', (W, H), GOLD_GLOW + (255,)), (0, 0), halo.point(lambda v: int(v * 0.55)))
        out.paste(Image.new('RGBA', (W, H), GOLD_GLOW + (255,)), (0, 0), core.point(lambda v: int(v * 0.9)))
        out.save(f'public/creative-guide/zone-glows/{zone}.png')

        # region extents (percent) for auto-focus framing
        bbox = mask.getbbox()
        if bbox:
            x0, y0, x1, y1 = bbox
            print(f"{zone}: cx={(x0+x1)/2/W*100:.1f} cy={(y0+y1)/2/H*100:.1f} "
                  f"rx={(x1-x0)/2/W*100:.1f} ry={(y1-y0)/2/H*100:.1f}")


def main():
    plan = Plan()
    for mode in CW:
        draw_blueprint(plan, mode).save(f'public/creative-guide/venue-blueprint-{mode}.png')
        print('blueprint', mode, 'written')
    draw_glows(plan)
    # context label positions
    for label in ('pool', 'pool2'):
        a = plan.acts.get(label)
        if a:
            x, y = plan.P(a['bbox'][0], a['bbox'][1])
            print(f"label {label}: x={x/SS/W*100*SS:.1f}% y={y/SS/H*100*SS:.1f}%")


if __name__ == '__main__':
    main()
