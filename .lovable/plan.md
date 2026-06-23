## Goal
Make the previz scene read as the real venue by revealing the structural meshes already in `soleia_screens.gltf` (pool wall, deck, truss, ceiling, etc.) instead of hiding them. Keep it stylized so the LED screens remain the hero.

You'll see the result in the live preview as soon as the plan is approved — nothing is pushed/published. Publishing only happens when you explicitly click Publish.

## Current behavior
In `src/components/venue/RoomScene.tsx` (`RoomModel`), the traversal hides every mesh whose material name doesn't start with `MI_`:

```ts
if (!/^MI_/.test((m0 as THREE.Material)?.name ?? '')) {
  mesh.visible = false;
  return;
}
```

That kills all architectural geometry, leaving only the floating LED slabs.

## Changes (only `src/components/venue/RoomScene.tsx`)

1. **Stop hiding structural meshes.** Replace the early-return with a branch:
   - If material name starts with `MI_` → existing LED screen pipeline (unchanged).
   - Otherwise → keep visible, assign a stylized PBR `MeshStandardMaterial` based on a name classifier.

2. **Name-based material classifier.** Inspect node/material name and assign one of a small palette:
   - `pool|water` → deep blue-black, low roughness, high metalness (reads as still water with reflections).
   - `wall|tile|deck|stage|floor_struct` → dark matte concrete (`#1a1a22`, roughness 0.85).
   - `truss|frame|rig|mesh|metal` → dark brushed metal (`#2a2a32`, metalness 0.8, roughness 0.35).
   - `ceiling|roof` → near-black matte (`#0d0d12`).
   - Fallback → neutral dark matte (`#15151c`, roughness 0.9).

3. **Lighting pass.** Add minimal, cheap lighting so PBR surfaces actually render:
   - `<ambientLight intensity={0.18} color="#3a3550" />`
   - `<hemisphereLight>` (sky `#2a2a40`, ground `#0a0a10`, intensity 0.25).
   - No shadow maps, no env map.

4. **Keep the mirrored floor + flow shader.** Reflector floor stays dominant; structural floor meshes get `renderOrder` adjusted if they conflict.

5. **Performance guardrails.** Frustum-cull structural meshes, no shadows, shared materials per category, leave `dpr`/AA logic unchanged.

## Out of scope
- No new glTF, no procedural geometry, no texture downloads.
- No changes to LED screen shaders, previz video pipeline, or admin upload flow.
- No file changes outside `RoomScene.tsx`.

## Preview & iteration
After approval I'll make the edit and the preview updates immediately. If a category looks wrong on a specific mesh, we tune the classifier regex — single file, easy iteration. Nothing reaches the published site until you click Publish.
