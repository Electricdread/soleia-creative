# Unreal Editor Python — export a top-down PLAN of the venue geometry.
#
# No camera involved: writes world-space footprints straight down (plan view),
# which is exactly what a blueprint/floor-plan needs.
#
#   - EVERY target actor: its world-aligned bounding box (cheap, tiny) —
#     gives the venue massing: walls, pools, stages, cabanas...
#   - LED/screen actors (name matches LED_PATTERN): full mesh vertices too,
#     so the screens can be drawn with exact shapes.
#
# HOW TO RUN
#   1. Selection:
#        - EASIEST: select nothing — it exports ALL StaticMeshActors in the
#          level (bounding boxes only are small, this is fine even for
#          thousands of actors).
#        - Or select just the actors you want in the plan.
#   2. Tools > Execute Python Script... and pick this file.
#   3. Commit <Project>/Saved/venue_plan.json to the repo (or paste it).

import json
import os
import re

import unreal

# ----------------------------------------------------------------------------
LED_PATTERN = r"(?i)led|screen|imag|curve|booth|marquee|tv_|_tv"
MAX_PTS_PER_LED = 600
# ----------------------------------------------------------------------------


def world_transform(comp, actor):
    for name in ('get_world_transform', 'get_component_transform', 'get_component_to_world',
                 'k2_get_component_to_world'):
        fn = getattr(comp, name, None)
        if fn:
            try:
                return fn()
            except Exception:
                pass
    return actor.get_actor_transform()


def xform_point(xf, v):
    try:
        return xf.transform_location(v)
    except Exception:
        return unreal.MathLibrary.transform_location(xf, v)


def led_vertices(actor):
    pts = []
    pml = unreal.ProceduralMeshLibrary
    for comp in actor.get_components_by_class(unreal.StaticMeshComponent):
        mesh = comp.static_mesh
        if not mesh:
            continue
        xf = world_transform(comp, actor)
        for section in range(8):
            try:
                verts, _t, _n, _u, _tg = pml.get_section_from_static_mesh(mesh, 0, section)
            except Exception:
                break
            if not verts:
                break
            for v in verts:
                pts.append(xform_point(xf, v))
    return pts


def main():
    sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = list(sub.get_selected_level_actors())
    if not actors:
        actors = [a for a in sub.get_all_level_actors() if isinstance(a, unreal.StaticMeshActor)]
    unreal.log(f"Exporting plan footprints for {len(actors)} actors")

    rx = re.compile(LED_PATTERN)
    out = {"unit": "cm", "actors": []}
    for a in actors:
        label = a.get_actor_label()
        try:
            origin, extent = a.get_actor_bounds(False)
        except Exception:
            continue
        entry = {
            "label": label,
            "bbox": [round(origin.x, 1), round(origin.y, 1), round(extent.x, 1), round(extent.y, 1),
                     round(origin.z, 1), round(extent.z, 1)],
        }
        if rx.search(label):
            pts = led_vertices(a)
            step = max(1, len(pts) // MAX_PTS_PER_LED)
            entry["verts"] = [[round(p.x, 1), round(p.y, 1), round(p.z, 1)] for p in pts[::step]]
        out["actors"].append(entry)

    path = os.path.join(unreal.SystemLibrary.get_project_saved_directory(), "venue_plan.json")
    with open(path, "w") as f:
        json.dump(out, f)
    unreal.log(f"WROTE {path}  ({len(out['actors'])} actors)")


main()
