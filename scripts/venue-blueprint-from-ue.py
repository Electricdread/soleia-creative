#!/usr/bin/env python3
"""Venue Layout map generated from the Unreal geometry export.

Single source of truth: scripts/data/venue_plan.json (world-space footprints +
LED mesh vertices from scripts/ue_export_plan.py). Renders:

  public/creative-guide/venue-blueprint-light.png   (1376x768)
  public/creative-guide/venue-blueprint-dark.png
  public/creative-guide/zone-glows/{main,arrival,tv}.png

…all through the same world->image projection, so the zone glow overlays are
pixel-registered with the map by construction.

Style: the client's luxury isometric render language — charcoal (or cream)
decks, red seating, gold lattice accents, teal pools, green palms, gold
Soleia wordmark. No text labels; the interactive HUD carries the naming.
"""
import json
import math
import re
from PIL import Image, ImageDraw, ImageFilter

W, H = 1376, 768
SS = 2  # supersample
DATA = 'scripts/data/venue_plan.json'
LOGO = 'src/assets/soleia-wide-logo.png'

GOLD_GLOW = (255, 186, 60)

CW = {
    'dark': dict(
        bg=(10, 10, 11), plate=(31, 31, 34), plate_edge=(66, 64, 60), room_floor=(38, 38, 42),
        lattice=(164, 127, 58, 130), gold=(201, 160, 78), gold_dim=(146, 116, 58),
        red=(166, 38, 30), red_hi=(208, 64, 50), red_dk=(108, 24, 19),
        water=(36, 104, 122), water_hi=(96, 178, 192), water_rim=(150, 118, 62),
        unit=(46, 46, 51), unit_edge=(96, 92, 84),
        screen=(15, 15, 18), spoke=(24, 24, 28), spoke_edge=(74, 72, 68),
        palm1=(44, 106, 58), palm2=(74, 148, 84), pot=(58, 44, 30),
    ),
    'light': dict(
        bg=(233, 222, 202), plate=(243, 234, 216), plate_edge=(189, 172, 138), room_floor=(247, 240, 226),
        lattice=(193, 156, 84, 150), gold=(168, 126, 48), gold_dim=(196, 166, 110),
        red=(178, 44, 34), red_hi=(214, 76, 60), red_dk=(124, 28, 22),
        water=(108, 188, 202), water_hi=(168, 224, 232), water_rim=(168, 132, 66),
        unit=(236, 226, 206), unit_edge=(168, 148, 108),
        screen=(56, 52, 48), spoke=(228, 218, 198), spoke_edge=(178, 162, 128),
        palm1=(56, 124, 66), palm2=(88, 164, 94), pot=(122, 92, 60),
    ),
}

ZONES = {
    'main': ['LED_SR_Curves', 'LED_SL_Curves', 'LED_SR_IMAG', 'LED_SL_IMAG', 'LED_Center', 'LED_DJ_Booth'],
    'arrival': ['outdoor_sr_box', 'outdoor_sl_box', 'LED_Outdoor_Screen', 'LED_Outdoor_Arch_Screen'],
    'tv': [],  # filled with TV_* actors at load time
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


def palm(d, x, y, c, r):
    """Stylized palm: two-tone fronds + dark center."""
    for k in range(8):
        ang = k * math.pi / 4 + 0.3
        col = c['palm1'] if k % 2 else c['palm2']
        tip = (x + r * math.cos(ang), y + r * math.sin(ang))
        side = 0.32
        a1 = (x + r * 0.45 * math.cos(ang - side), y + r * 0.45 * math.sin(ang - side))
        a2 = (x + r * 0.45 * math.cos(ang + side), y + r * 0.45 * math.sin(ang + side))
        d.polygon([(x, y), a1, tip, a2], fill=col)
    rr = max(2 * SS, r * 0.14)
    d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=c['pot'])


def lattice(img, mask, c, spacing):
    """Gold diagonal cross-hatch clipped to mask."""
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    w, h = img.size
    for x0 in range(-h, w + h, spacing):
        ld.line([(x0, 0), (x0 + h, h)], fill=c['lattice'], width=SS)
        ld.line([(x0 + h, 0), (x0, h)], fill=c['lattice'], width=SS)
    img.paste(lay, (0, 0), Image.composite(mask, Image.new('L', img.size, 0), lay.split()[3]))


def draw_layout(plan, mode):
    c = CW[mode]
    img = Image.new('RGB', (W * SS, H * SS), c['bg'])
    d = ImageDraw.Draw(img, 'RGBA')
    A, pre = plan.acts, plan.by_prefix

    # ---- venue plate (union of floor slabs + main-room disc) ----
    plate = Image.new('L', img.size, 0)
    pd = ImageDraw.Draw(plate)
    for label in ('floor_inside', 'Floor_outside', 'floor_inside_002'):
        if label in A:
            pd.rounded_rectangle(plan.rect(A[label]), radius=26 * SS, fill=255)
    if 'Roof' in A:
        pd.ellipse(plan.rect(A['Roof']), fill=255)
    # edge: plate silhouette stroked slightly larger
    edge = plate.filter(ImageFilter.MaxFilter(5))
    img.paste(Image.new('RGB', img.size, c['plate_edge']), (0, 0), edge)
    img.paste(Image.new('RGB', img.size, c['plate']), (0, 0), plate)
    d = ImageDraw.Draw(img, 'RGBA')

    # gold lattice on the west terrace + outer deck
    if 'Floor_outside' in A:
        lat = Image.new('L', img.size, 0)
        ld = ImageDraw.Draw(lat)
        ld.rounded_rectangle(plan.rect(A['Floor_outside']), radius=26 * SS, fill=255)
        # clear the inner beach deck so the lattice reads as a border terrace
        if 'floor_inside' in A:
            r = plan.rect(A['floor_inside'])
            ld.rounded_rectangle([r[0] + 30 * SS, r[1] + 30 * SS, r[2] - 30 * SS, r[3] - 30 * SS],
                                 radius=26 * SS, fill=0)
        lattice(img, lat, c, 26 * SS)
        d = ImageDraw.Draw(img, 'RGBA')

    # main-room floor disc
    if 'Roof' in A:
        d.ellipse(plan.rect(A['Roof'], grow=-6 * SS), fill=c['room_floor'], outline=c['plate_edge'], width=2 * SS)

    # ---- sunray ceiling spokes (subtle) ----
    for a in pre.get('LED_Sol_Rays_Sunray', []):
        ph = plan.vhull(a)
        if ph:
            d.polygon(ph, fill=c['spoke'], outline=c['spoke_edge'], width=SS)

    # ---- pools ----
    for label in ('pool', 'pool2'):
        if label not in A:
            continue
        r = plan.rect(A[label])
        d.rounded_rectangle(r, radius=34 * SS, fill=c['water'], outline=c['water_rim'], width=2 * SS)
        inset = 12 * SS
        d.rounded_rectangle([r[0] + inset, r[1] + inset, r[2] - inset, r[3] - inset],
                            radius=26 * SS, outline=c['water_hi'] + (110,), width=SS)
        # ripple arcs
        for i in range(3):
            rx0 = r[0] + (r[2] - r[0]) * (0.2 + 0.22 * i)
            ry0 = r[1] + (r[3] - r[1]) * (0.3 + 0.16 * i)
            d.arc([rx0, ry0, rx0 + 60 * SS, ry0 + 24 * SS], 200, 340, fill=c['water_hi'] + (150,), width=SS)

    # ---- beach stage platform ----
    if 'Circle' in A:
        r = plan.rect(A['Circle'])
        d.rounded_rectangle(r, radius=10 * SS, fill=c['unit'], outline=c['gold_dim'], width=2 * SS)

    # ---- cabana / bungalow rooms ----
    for a in pre.get('Rooms', []):
        d.rectangle(plan.rect(a), fill=c['unit'], outline=c['unit_edge'], width=SS)

    # stairs
    if 'Stairs' in A:
        r = plan.rect(A['Stairs'])
        d.rectangle(r, fill=c['unit'], outline=c['unit_edge'], width=SS)
        for i in range(1, 5):
            yy = r[1] + (r[3] - r[1]) * i / 5
            d.line([(r[0], yy), (r[2], yy)], fill=c['unit_edge'], width=SS)

    # DJ stage risers
    for label in ('Cube_30', 'Cube_43'):
        if label in A:
            d.rounded_rectangle(plan.rect(A[label]), radius=8 * SS, fill=c['unit'], outline=c['gold_dim'], width=SS)

    # ---- furniture: red seating, beds, loungers; tables gold-rimmed ----
    red_kinds = ('Couch_APPLYSUBD', 'sofa_short4', 'sofa_short', 'sofa_long',
                 'SOFA_ROUNDED_FRAME', 'SOFA_INDOOR_L_SHAPE', 'bed', 'lowpCube8')
    for p in red_kinds:
        for a in pre.get(p, []):
            r = plan.rect(a)
            if (r[2] - r[0]) * (r[3] - r[1]) >= (260 * SS) ** 2:
                continue
            rad = 5 * SS if p != 'lowpCube8' else 12 * SS
            if r[2] - r[0] < 3 * SS or r[3] - r[1] < 3 * SS:
                continue
            d.rounded_rectangle(r, radius=min(rad, (r[2]-r[0])/2, (r[3]-r[1])/2), fill=c['red'], outline=c['red_dk'], width=SS)
            # seat highlight
            hi = [r[0] + 2 * SS, r[1] + 2 * SS, r[2] - 2 * SS, r[1] + (r[3] - r[1]) * 0.45]
            if hi[2] > hi[0] and hi[3] > hi[1]:
                d.rounded_rectangle(hi, radius=min(rad, (hi[2]-hi[0])/2, (hi[3]-hi[1])/2), fill=c['red_hi'] + (70,))
    for p in ('table', 'INDOOR_TABLE', 'BED_TABLE'):
        for a in pre.get(p, []):
            r = plan.rect(a)
            if (r[2] - r[0]) < 70 * SS:
                d.ellipse(r, fill=c['unit'], outline=c['gold_dim'], width=SS)

    # ---- palms (planters + trees) ----
    for p in ('SM_Windmill_Palm', 'SM_Coconut_Tree', 'Wood_pot'):
        for a in pre.get(p, []):
            x, y = plan.P(a['bbox'][0], a['bbox'][1])
            palm(d, x, y, c, (19 if p != 'Wood_pot' else 13) * SS)

    # ---- mirror ball ----
    if 'Mirror_ball1' in A:
        x, y = plan.P(A['Mirror_ball1']['bbox'][0], A['Mirror_ball1']['bbox'][1])
        rr = 7 * SS
        d.ellipse([x - rr, y - rr, x + rr, y + rr], outline=c['gold'], width=SS)
        d.line([(x - rr, y), (x + rr, y)], fill=c['gold_dim'], width=SS)
        d.line([(x, y - rr), (x, y + rr)], fill=c['gold_dim'], width=SS)

    # ---- TVs ----
    for label in ZONES['tv']:
        a = A[label]
        x, y = plan.P(a['bbox'][0], a['bbox'][1])
        d.rectangle([x - 3 * SS, y - 3 * SS, x + 3 * SS, y + 3 * SS], fill=c['gold'])

    # ---- LED screens ----
    def screen_shape(label):
        a = A.get(label)
        if not a:
            return None
        ph = plan.vhull(a)
        if ph and len(ph) >= 3:
            return ('poly', ph)
        return ('rect', plan.rect(a, grow=2 * SS))

    # curves get the gold diamond-lattice treatment like the reference band
    for label in ('LED_SR_Curves', 'LED_SL_Curves'):
        sh = screen_shape(label)
        if not sh:
            continue
        mask = Image.new('L', img.size, 0)
        ImageDraw.Draw(mask).polygon(sh[1], fill=255)
        img.paste(Image.new('RGB', img.size, c['screen']), (0, 0), mask)
        lattice(img, mask, c, 10 * SS)
        d = ImageDraw.Draw(img, 'RGBA')
        d.polygon(sh[1], outline=c['gold'], width=2 * SS)

    for label in ('LED_SR_IMAG', 'LED_SL_IMAG', 'LED_Center', 'LED_Stage_Arch',
                  'LED_Outdoor_Screen', 'LED_Outdoor_Arch_Screen', 'outdoor_sr_box', 'outdoor_sl_box',
                  'LED_DJ_Booth'):
        sh = screen_shape(label)
        if not sh:
            continue
        if sh[0] == 'poly':
            d.polygon(sh[1], fill=c['screen'], outline=c['gold'], width=2 * SS)
        else:
            d.rectangle(sh[1], fill=c['screen'], outline=c['gold'], width=2 * SS)

    # ---- Soleia wordmark ----
    logo = Image.open(LOGO).convert('RGBA')
    lw = 220 * SS
    lh = int(logo.height * lw / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    img.paste(logo, ((W * SS - lw) // 2, 18 * SS), logo)

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
            elif zone == 'tv':
                x, y = plan.P(a['bbox'][0], a['bbox'][1])
                d.rectangle([x - 4 * SS, y - 4 * SS, x + 4 * SS, y + 4 * SS], fill=255)
            else:
                d.rectangle(plan.rect(a, grow=2 * SS), fill=255)
        mask = mask.resize((W, H), Image.LANCZOS)
        core = mask.filter(ImageFilter.GaussianBlur(1.2))
        halo = mask.filter(ImageFilter.GaussianBlur(9))
        out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        out.paste(Image.new('RGBA', (W, H), GOLD_GLOW + (255,)), (0, 0), halo.point(lambda v: int(v * 0.55)))
        out.paste(Image.new('RGBA', (W, H), GOLD_GLOW + (255,)), (0, 0), core.point(lambda v: int(v * 0.9)))
        out.save(f'public/creative-guide/zone-glows/{zone}.png')
        bbox = mask.getbbox()
        if bbox:
            x0, y0, x1, y1 = bbox
            print(f"{zone}: cx={(x0+x1)/2/W*100:.1f} cy={(y0+y1)/2/H*100:.1f} "
                  f"rx={(x1-x0)/2/W*100:.1f} ry={(y1-y0)/2/H*100:.1f}")


def main():
    plan = Plan()
    for mode in CW:
        draw_layout(plan, mode).save(f'public/creative-guide/venue-blueprint-{mode}.png')
        print('layout', mode, 'written')
    draw_glows(plan)


if __name__ == '__main__':
    main()
