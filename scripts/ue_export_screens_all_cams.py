# Unreal Editor Python — export screen-mesh projections through EVERY camera.
#
# No camera picking needed: this projects the screen meshes through all camera
# actors in the level (CineCamera FOV derived from focal length + filmback)
# plus the current viewport, and writes one JSON. We match the right view
# against the venue layout image afterwards.
#
# HOW TO RUN
#   1. In the Outliner, SELECT all the screen meshes (only them).
#      (If nothing is selected, the script falls back to any actor whose name
#       matches SCREEN_NAME_PATTERN below.)
#   2. Tools > Execute Python Script... and pick this file.
#   3. Paste the contents of <Project>/Saved/screens_projection_all.json back
#      in chat, or commit it to the repo.

import json
import math
import os
import re

import unreal

# ----------------------------------------------------------------------------
SCREEN_NAME_PATTERN = r"(?i)screen|led|imag|curve|booth|tv|marquee"
ASPECT = 1376.0 / 768.0      # aspect of the venue layout image
MAX_PTS_PER_ACTOR = 400
# ----------------------------------------------------------------------------


def target_actors(sub):
    sel = sub.get_selected_level_actors()
    if sel:
        return list(sel)
    rx = re.compile(SCREEN_NAME_PATTERN)
    return [a for a in sub.get_all_level_actors()
            if isinstance(a, unreal.StaticMeshActor) and rx.search(a.get_actor_label())]


def world_transform(comp, actor):
    # the python name of K2_GetComponentToWorld varies across UE versions
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


def mesh_world_vertices(actor):
    pts = []
    pml = unreal.ProceduralMeshLibrary
    for comp in actor.get_components_by_class(unreal.StaticMeshComponent):
        mesh = comp.static_mesh
        if not mesh:
            continue
        xf = world_transform(comp, actor)
        got = False
        for section in range(8):
            try:
                verts, _t, _n, _u, _tg = pml.get_section_from_static_mesh(mesh, 0, section)
            except Exception:
                break
            if not verts:
                break
            got = True
            for v in verts:
                pts.append(xform_point(xf, v))
        if not got:
            origin, ext = comp.get_local_bounds()
            for sx in (-1, 1):
                for sy in (-1, 1):
                    for sz in (-1, 1):
                        pts.append(xform_point(xf, unreal.Vector(
                            origin.x + sx * ext.x, origin.y + sy * ext.y, origin.z + sz * ext.z)))
    return pts


def camera_views(sub):
    """Yields (name, location, fwd, right, up, horizontal_fov_deg)."""
    for a in sub.get_all_level_actors():
        if not isinstance(a, unreal.CameraActor):
            continue
        fov = None
        for comp in a.get_components_by_class(unreal.CineCameraComponent):
            try:
                fl = float(comp.current_focal_length)
                sw = float(comp.filmback.sensor_width)
                fov = math.degrees(2.0 * math.atan(sw / (2.0 * fl)))
            except Exception:
                pass
        if fov is None:
            for comp in a.get_components_by_class(unreal.CameraComponent):
                try:
                    fov = float(comp.field_of_view)
                    break
                except Exception:
                    pass
        if fov is None:
            fov = 90.0
        yield (a.get_actor_label(), a.get_actor_location(), a.get_actor_forward_vector(),
               a.get_actor_right_vector(), a.get_actor_up_vector(), fov)

    try:
        ues = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
        loc, rot = ues.get_level_viewport_camera_info()
        yield ("__VIEWPORT__", loc, unreal.MathLibrary.get_forward_vector(rot),
               unreal.MathLibrary.get_right_vector(rot), unreal.MathLibrary.get_up_vector(rot), 90.0)
    except Exception:
        pass


def main():
    sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = target_actors(sub)
    if not actors:
        raise RuntimeError("No screen actors (select them, or adjust SCREEN_NAME_PATTERN)")
    unreal.log(f"Projecting {len(actors)} actors: {[a.get_actor_label() for a in actors]}")

    world_pts = {}
    for a in actors:
        pts = mesh_world_vertices(a)
        step = max(1, len(pts) // MAX_PTS_PER_ACTOR)
        world_pts[a.get_actor_label()] = pts[::step]
        if not pts:
            unreal.log_warning(f"{a.get_actor_label()}: no vertices")

    out = {"aspect": ASPECT, "cameras": {}}
    for name, loc, fwd, right, up, fov in camera_views(sub):
        tan_h = math.tan(math.radians(fov) / 2.0)
        tan_v = tan_h / ASPECT
        cam_entry = {"fov_horizontal_deg": round(fov, 3), "actors": {}}
        total = inside = 0
        for label, pts in world_pts.items():
            uv = []
            for p in pts:
                d = p - loc
                x = d.dot(fwd)
                if x <= 1.0:
                    continue
                u = (d.dot(right) / x / tan_h + 1.0) / 2.0
                v = 1.0 - (d.dot(up) / x / tan_v + 1.0) / 2.0
                uv.append([round(u, 4), round(v, 4)])
                total += 1
                if 0.0 <= u <= 1.0 and 0.0 <= v <= 1.0:
                    inside += 1
            cam_entry["actors"][label] = uv
        frac = (inside / total) if total else 0.0
        cam_entry["in_frame_fraction"] = round(frac, 3)
        unreal.log(f"{name}: fov={fov:.1f}  in-frame={frac:.0%}")
        # keep the points only for cameras that actually see the screens
        if frac < 0.25:
            cam_entry["actors"] = {}
        out["cameras"][name] = cam_entry

    path = os.path.join(unreal.SystemLibrary.get_project_saved_directory(), "screens_projection_all.json")
    with open(path, "w") as f:
        json.dump(out, f)
    unreal.log(f"WROTE {path}")


main()
