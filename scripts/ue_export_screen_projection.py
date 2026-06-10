# Unreal Editor Python — export screen-mesh outlines projected to a camera.
#
# WHAT IT DOES
#   Projects every vertex of the SELECTED static-mesh actors through a chosen
#   camera and writes normalized 2D points (0..1 screen space) to JSON. That
#   JSON lets us draw pixel-exact SVG overlays over the venue layout render.
#
# HOW TO RUN (in the Unreal Editor)
#   1. In the Outliner, SELECT all the screen meshes (and nothing else).
#   2. Tools > Execute Python Script... and pick this file.
#      - If there is exactly ONE camera actor in the level, it is used
#        automatically.
#      - If there are several, the run fails but PRINTS ALL CAMERA NAMES in
#        the Output Log — set CAMERA_NAME below to the right one and rerun.
#      - If the layout image was captured from the editor viewport (no camera
#        actor), set USE_VIEWPORT_CAMERA = True, frame the viewport exactly
#        like the layout render, then rerun. Set FOV_OVERRIDE if you know the
#        viewport FOV (defaults to 90).
#   3. Output: <Project>/Saved/screens_projection.json — paste its contents
#      back in chat or commit it to the repo.

import json
import math
import os

import unreal

# ----------------------------------------------------------------------------
CAMERA_NAME = ""              # camera actor's Outliner label; "" = auto-detect
USE_VIEWPORT_CAMERA = False   # True = use the current editor viewport instead
FOV_OVERRIDE = None           # e.g. 90.0 to force the horizontal FOV
RENDER_W, RENDER_H = 1376, 768  # layout render pixel size (only ratio matters)
MAX_PTS_PER_ACTOR = 1200
# ----------------------------------------------------------------------------


def get_view():
    """Returns (location, forward, right, up, fov_horizontal_deg)."""
    if USE_VIEWPORT_CAMERA:
        ues = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
        loc, rot = ues.get_level_viewport_camera_info()
        fwd = unreal.MathLibrary.get_forward_vector(rot)
        right = unreal.MathLibrary.get_right_vector(rot)
        up = unreal.MathLibrary.get_up_vector(rot)
        fov = float(FOV_OVERRIDE or 90.0)
        unreal.log(f"Using VIEWPORT camera at {loc} fov={fov}")
        return loc, fwd, right, up, fov

    sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    cams = [a for a in sub.get_all_level_actors() if isinstance(a, unreal.CameraActor)]
    cam = None
    if CAMERA_NAME:
        for a in cams:
            if a.get_actor_label() == CAMERA_NAME:
                cam = a
                break
        if cam is None:
            unreal.log_error(f"No camera labeled '{CAMERA_NAME}'. Cameras in level:")
            for a in cams:
                unreal.log_error(f"  - {a.get_actor_label()}  ({a.get_class().get_name()})")
            raise RuntimeError("Set CAMERA_NAME to one of the labels above")
    elif len(cams) == 1:
        cam = cams[0]
        unreal.log(f"Auto-selected the only camera: '{cam.get_actor_label()}'")
    else:
        unreal.log_error(f"{len(cams)} camera actors found — set CAMERA_NAME to one of:")
        for a in cams:
            unreal.log_error(f"  - {a.get_actor_label()}  ({a.get_class().get_name()})")
        if not cams:
            unreal.log_error("  (none — if the shot came from the viewport, set USE_VIEWPORT_CAMERA = True)")
        raise RuntimeError("Camera not resolved — see Output Log")

    fov = None
    if FOV_OVERRIDE:
        fov = float(FOV_OVERRIDE)
    else:
        for comp in cam.get_components_by_class(unreal.CameraComponent):
            try:
                fov = float(comp.field_of_view)
                break
            except Exception:
                pass
    if not fov:
        raise RuntimeError("Could not read FOV — set FOV_OVERRIDE at the top")
    unreal.log(f"Using camera '{cam.get_actor_label()}' fov={fov}")
    return (cam.get_actor_location(), cam.get_actor_forward_vector(),
            cam.get_actor_right_vector(), cam.get_actor_up_vector(), fov)


def mesh_world_vertices(actor):
    """All vertices of every StaticMeshComponent on the actor, in world space."""
    pts = []
    pml = unreal.ProceduralMeshLibrary
    for comp in actor.get_components_by_class(unreal.StaticMeshComponent):
        mesh = comp.static_mesh
        if not mesh:
            continue
        xf = comp.get_component_transform()
        got = False
        for section in range(8):
            try:
                verts, _tris, _n, _uv, _tan = pml.get_section_from_static_mesh(mesh, 0, section)
            except Exception:
                break
            if not verts:
                break
            got = True
            for v in verts:
                pts.append(xf.transform_location(v))
        if not got:
            # fallback: bounding-box corners (coarse, but keeps the actor present)
            origin, ext = comp.get_local_bounds()
            for sx in (-1, 1):
                for sy in (-1, 1):
                    for sz in (-1, 1):
                        local = unreal.Vector(origin.x + sx * ext.x, origin.y + sy * ext.y, origin.z + sz * ext.z)
                        pts.append(xf.transform_location(local))
    return pts


def main():
    loc, fwd, right, up, fov_deg = get_view()

    aspect = RENDER_W / float(RENDER_H)
    tan_h = math.tan(math.radians(fov_deg) / 2.0)  # UE FOV is horizontal
    tan_v = tan_h / aspect

    sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    selected = sub.get_selected_level_actors()
    if not selected:
        raise RuntimeError("Nothing selected — select the screen mesh actors first")

    out = {
        "viewport": USE_VIEWPORT_CAMERA,
        "fov_horizontal_deg": fov_deg,
        "resolution": [RENDER_W, RENDER_H],
        "actors": {},
    }

    for actor in selected:
        pts = mesh_world_vertices(actor)
        if not pts:
            unreal.log_warning(f"{actor.get_actor_label()}: no mesh vertices found")
            continue
        step = max(1, len(pts) // MAX_PTS_PER_ACTOR)
        uv = []
        for i in range(0, len(pts), step):
            d = pts[i] - loc
            x = d.dot(fwd)
            if x <= 1.0:  # behind or at the camera
                continue
            y = d.dot(right)
            z = d.dot(up)
            u = (y / x / tan_h + 1.0) / 2.0
            v = 1.0 - (z / x / tan_v + 1.0) / 2.0
            uv.append([round(u, 5), round(v, 5)])
        out["actors"][actor.get_actor_label()] = uv
        unreal.log(f"{actor.get_actor_label()}: {len(uv)} projected points")

    path = os.path.join(unreal.SystemLibrary.get_project_saved_directory(), "screens_projection.json")
    with open(path, "w") as f:
        json.dump(out, f)
    unreal.log(f"WROTE {path}")


main()
