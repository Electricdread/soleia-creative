# Unreal Editor Python — export screen-mesh outlines projected to a camera.
#
# WHAT IT DOES
#   Projects every vertex of the SELECTED static-mesh actors through a chosen
#   camera and writes normalized 2D points (0..1 screen space) to JSON. That
#   JSON lets us draw pixel-exact SVG overlays over the venue layout render.
#
# HOW TO RUN (in the Unreal Editor)
#   1. Edit > Plugins: enable "Python Editor Script Plugin" (and restart if
#      prompted). The "Procedural Mesh Component" plugin should be on too
#      (it is by default; used only to read mesh vertices).
#   2. Set CAMERA_NAME below to the label of the camera actor that rendered
#      the venue layout image (as shown in the Outliner). If your camera is a
#      CineCamera and the FOV read fails, set FOV_OVERRIDE.
#   3. In the Outliner, SELECT all the screen meshes (and nothing else).
#   4. Tools > Execute Python Script... and pick this file.
#   5. Output: <Project>/Saved/screens_projection.json — paste its contents
#      back in chat or commit it to the repo.

import json
import math
import os

import unreal

# ----------------------------------------------------------------------------
CAMERA_NAME = "CameraActor"  # <-- set to your layout camera's Outliner label
FOV_OVERRIDE = None          # e.g. 90.0 if the FOV can't be read automatically
RENDER_W, RENDER_H = 1376, 768  # the layout render's pixel size (ratio is what matters)
MAX_PTS_PER_ACTOR = 1200
# ----------------------------------------------------------------------------


def find_camera():
    sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for a in sub.get_all_level_actors():
        if a.get_actor_label() == CAMERA_NAME:
            return a
    raise RuntimeError(f"Camera actor labeled '{CAMERA_NAME}' not found in level")


def camera_fov(cam_actor):
    if FOV_OVERRIDE:
        return float(FOV_OVERRIDE)
    for comp in cam_actor.get_components_by_class(unreal.CameraComponent):
        try:
            return float(comp.field_of_view)
        except Exception:
            pass
    raise RuntimeError("Could not read FOV — set FOV_OVERRIDE at the top of the script")


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
    cam = find_camera()
    fov_deg = camera_fov(cam)
    cam_loc = cam.get_actor_location()
    fwd = cam.get_actor_forward_vector()
    right = cam.get_actor_right_vector()
    up = cam.get_actor_up_vector()

    aspect = RENDER_W / float(RENDER_H)
    tan_h = math.tan(math.radians(fov_deg) / 2.0)  # UE FOV is horizontal
    tan_v = tan_h / aspect

    sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    selected = sub.get_selected_level_actors()
    if not selected:
        raise RuntimeError("Nothing selected — select the screen mesh actors first")

    out = {
        "camera": CAMERA_NAME,
        "fov_horizontal_deg": fov_deg,
        "resolution": [RENDER_W, RENDER_H],
        "actors": {},
    }

    for actor in selected:
        pts = mesh_world_vertices(actor)
        if not pts:
            continue
        step = max(1, len(pts) // MAX_PTS_PER_ACTOR)
        uv = []
        for i in range(0, len(pts), step):
            d = pts[i] - cam_loc
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
