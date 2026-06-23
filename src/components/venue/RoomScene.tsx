/**
 * Interactive 3D venue scene — real curved Unreal geometry (glTF) with each
 * surface showing its mapping card (UV islands rescaled to 0–1 so the full card
 * reads on the true curved surface).
 *
 * TOUR mode (default): a scroll-driven camera flows through the room beat by
 * beat (driven by `progressRef`, 0→1). As the flow front reaches each surface it
 * DIMS the placeholder card and crossfades to a live animated SOLEIA brand
 * layer — visualising flow + branding cohesion. ORBIT mode (fullscreen): free
 * orbit/zoom, surfaces keep their cards.
 */
import { MutableRefObject, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF, Sparkles, MeshReflectorMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ---- flowing floor field — lines stream across the floor toward the back ---- */
const FLOOR_VERT = `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FLOOR_FRAG = `
varying vec3 vW;
uniform float uTime;
uniform vec2 uCenter;
uniform vec2 uFlowDir;   // horizontal direction toward the back
uniform vec2 uPerp;
uniform float uScale;    // cells per world unit
uniform float uSpeed;
uniform float uFade;     // fade distance (world units)
uniform vec3 uColA;
uniform vec3 uColB;
float lineAt(float c, float w) {
  float f = fract(c);
  float d = min(f, 1.0 - f);
  return 1.0 - smoothstep(0.0, w, d);
}
void main() {
  vec2 rel = vW.xz - uCenter;
  float depth = dot(rel, uFlowDir);
  float lat = dot(rel, uPerp);
  // transverse rungs stream along the flow toward the back; rails stay put
  float rungs = lineAt(depth * uScale - uTime * uSpeed, 0.06);
  float rails = lineAt(lat * uScale, 0.05) * 0.6;
  float grid = max(rungs, rails);
  float fade = smoothstep(uFade, uFade * 0.04, length(rel));
  float breathe = 0.55 + 0.45 * sin(uTime * 0.7);
  float t = clamp(depth / uFade * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uColA, uColB, t);
  float intensity = grid * fade * (0.35 + 0.65 * breathe);
  gl_FragColor = vec4(col * intensity * 1.7, intensity);
}`;

function FlowFloor({
  radius,
  floorY,
  flowDir,
  matRef,
}: {
  radius: number;
  floorY: number;
  flowDir: THREE.Vector2;
  matRef: React.RefObject<THREE.ShaderMaterial>;
}) {
  const reduce = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector2(0, 0) },
      uFlowDir: { value: flowDir.clone() },
      uPerp: { value: new THREE.Vector2(-flowDir.y, flowDir.x) },
      uScale: { value: 1 / (radius * 0.12) },
      uSpeed: { value: 0 },
      uFade: { value: radius * 2.6 },
      uColA: { value: new THREE.Color('#A020F0') },
      uColB: { value: new THREE.Color('#00BFFF') },
    }),
    [flowDir, radius],
  );
  useFrame((state) => {
    if (!reduce) uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY + 0.02, 0]}>
      <planeGeometry args={[radius * 8, radius * 8, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={FLOOR_VERT}
        fragmentShader={FLOOR_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

const GLTF_URL = '/venue/soleia_screens.gltf';

export interface BeatMeta {
  focus: 'room' | 'sunray' | 'imag' | 'center' | 'dj';
  title: string;
  body: string;
}

export const BEAT_META: BeatMeta[] = [
  {
    focus: 'room',
    title: 'Arrival — one space',
    body: 'Step inside. Before a single logo, the room has to read as one space. That first impression is where flow begins.',
  },
  {
    focus: 'sunray',
    title: 'Energy radiates',
    body: 'The sunrays throw light outward from the ceiling — motion that fills the room with energy, not just pictures on a wall.',
  },
  {
    focus: 'imag',
    title: 'Branding, everywhere at once',
    body: 'The flow reaches the IMAG panels and the placeholder gives way to the live brand. Consistent branding on every surface is what makes the space feel owned.',
  },
  {
    focus: 'center',
    title: 'The focal point',
    body: 'Every surface complements the center screen. Flow means the eye is guided through the room, never lost.',
  },
  {
    focus: 'dj',
    title: 'Driving the floor',
    body: 'The booth carries the energy to the crowd. Every screen now alive with one brand — the room becomes an immersive world.',
  },
];

/* ---- animated SOLEIA brand layer (drawn to a canvas texture) ---- */
function makeBrandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;

  const draw = (t: number) => {
    ctx.clearRect(0, 0, 1024, 256);
    ctx.fillStyle = '#06040d';
    ctx.fillRect(0, 0, 1024, 256);

    // flowing neon blobs
    ctx.globalCompositeOperation = 'lighter';
    const cols = ['#A020F0', '#FF007F', '#00BFFF'];
    for (let i = 0; i < 3; i++) {
      const x = (((t * 0.06 + i / 3) % 1) + 1) % 1 * 1024;
      const rg = ctx.createRadialGradient(x, 128, 0, x, 128, 320);
      rg.addColorStop(0, cols[i] + 'cc');
      rg.addColorStop(1, '#00000000');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 1024, 256);
    }
    ctx.globalCompositeOperation = 'source-over';

    // scrolling SOLEIA wordmark ticker (reads on any aspect ratio)
    ctx.font = '700 120px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.shadowColor = '#FF007F';
    ctx.shadowBlur = 34;
    const label = 'SOLEIA   ☀   ';
    const tw = ctx.measureText(label).width;
    let x = -((t * 120) % tw);
    for (; x < 1024; x += tw) ctx.fillText(label, x, 140);
    ctx.shadowBlur = 0;

    tex.needsUpdate = true;
  };

  draw(0);
  return { tex, draw };
}

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// sUV mirrors U (cards/brand/movie read from the audience side, i.e. the back
// of these meshes). uRegion = (offU, offV, scaleU, scaleV) places the screen's
// 0–1 surface into its rectangle of the pixel-map movie. uVideoFlipV flips the
// region vertically if the movie reads upside-down.
const FRAG = `
uniform sampler2D uCard;
uniform sampler2D uBrand;
uniform sampler2D uVideo;
uniform float uMix;
uniform float uBright;
uniform float uUseVideo;
uniform float uVideoFlipU;
uniform float uVideoFlipV;
uniform vec4 uRegion;
varying vec2 vUv;
void main() {
  vec2 sUV = vec2(1.0 - vUv.x, vUv.y);
  vec3 card = texture2D(uCard, sUV).rgb;
  vec3 brand = texture2D(uBrand, sUV).rgb;
  vec2 rUV = vec2(mix(vUv.x, 1.0 - vUv.x, uVideoFlipU), mix(vUv.y, 1.0 - vUv.y, uVideoFlipV));
  vec3 video = texture2D(uVideo, uRegion.xy + rUV * uRegion.zw).rgb;
  vec3 base = mix(card, brand, uMix);
  vec3 col = mix(base, video, uUseVideo);
  gl_FragColor = vec4(col * uBright, 1.0);
}`;

// Pixel-map rectangles (x, y, w, h) within the 3840×2160 movie frame.
const FRAME_W = 3840;
const FRAME_H = 2160;
const REGIONS: Record<string, [number, number, number, number]> = {
  LED_SR_IMAG: [0, 0, 1216, 592],
  LED_Center: [1216, 0, 640, 272],
  LED_SL_IMAG: [1856, 0, 1216, 592],
  LED_DJ_Booth: [906, 594, 1260, 168],
  LED_SR_Curves: [0, 794, 2304, 272],
  LED_SL_Curves: [0, 1066, 2304, 272],
  LED_Sol_Rays_Sunray_1: [0, 1368, 1920, 128],
  LED_Sol_Rays_Sunray_2: [0, 1496, 1536, 128],
  LED_Sol_Rays_Sunray_3: [0, 1624, 1792, 128],
  LED_Sol_Rays_Sunray_4: [0, 1752, 1792, 128],
  LED_Sol_Rays_Sunray_5: [0, 1880, 1792, 128],
  LED_Sol_Rays_Sunray_6: [0, 2008, 1536, 128],
  // Outdoor screens (real flat MI_OUTDOOR* planes from Unreal).
  outdoor_SR: [2322, 793, 588, 840],
  outdoor_SL: [2916, 793, 588, 840],
  LED_Outdoor_Arch: [2322, 1639, 1512, 504],
};

function regionVec4(name: string): THREE.Vector4 {
  const r = REGIONS[name];
  if (!r) return new THREE.Vector4(0, 0, 1, 1);
  const [x, y, w, h] = r;
  // V measured from the bottom of the frame for GL sampling
  return new THREE.Vector4(x / FRAME_W, 1 - (y + h) / FRAME_H, w / FRAME_W, h / FRAME_H);
}

/**
 * Per-screen UV corrections, keyed by LED node name. Set u:true to mirror a
 * card horizontally, v:true to flip it vertically. Filled in from what you see.
 */
const UV_FIX: Record<string, { u?: boolean; v?: boolean }> = {
  // e.g. LED_SR_IMAG: { u: true },
};

function applyUVFix(geo: THREE.BufferGeometry, name: string) {
  const fix = UV_FIX[name];
  if (!fix) return;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i);
    let v = uv.getY(i);
    if (fix.u) u = 1 - u;
    if (fix.v) v = 1 - v;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
}

/** Rescale a mesh's UV island so [uMin,uMax]×[vMin,vMax] becomes [0,1]×[0,1]. */
function normalizeUVs(geo: THREE.BufferGeometry) {
  const uv = geo.attributes.uv as THREE.BufferAttribute | undefined;
  if (!uv) return;
  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    if (u < uMin) uMin = u;
    if (u > uMax) uMax = u;
    if (v < vMin) vMin = v;
    if (v > vMax) vMax = v;
  }
  const uw = uMax - uMin || 1;
  const vh = vMax - vMin || 1;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) - uMin) / uw, (uv.getY(i) - vMin) / vh);
  }
  uv.needsUpdate = true;
}

function firstMap(material: THREE.Material | THREE.Material[]): THREE.Texture | null {
  const m = Array.isArray(material) ? material[0] : material;
  return (m as THREE.MeshStandardMaterial | undefined)?.map ?? null;
}

function beatIndexForName(name: string): number {
  if (/Outdoor/i.test(name)) return 0;
  if (/Sunray/i.test(name)) return 1;
  if (/IMAG|Curve/i.test(name)) return 2;
  if (/Center/i.test(name)) return 3;
  if (/DJ/i.test(name)) return 4;
  return 2;
}

function namedAncestor(obj: THREE.Object3D): string {
  // Screen actor nodes are LED_* (interior + arch) or outdoor_SR / outdoor_SL.
  let p: THREE.Object3D | null = obj;
  while (p) {
    if (/^(LED_|outdoor_)/i.test(p.name)) return p.name;
    p = p.parent;
  }
  return '';
}

interface ScreenRef {
  beat: number;
  material: THREE.ShaderMaterial;
}

interface Beat {
  target: THREE.Vector3;
  camPos: THREE.Vector3;
}

function CameraRig({
  beats,
  screens,
  brand,
  progressRef,
  previz,
}: {
  beats: Beat[];
  screens: ScreenRef[];
  brand: { tex: THREE.CanvasTexture; draw: (t: number) => void };
  progressRef: MutableRefObject<number>;
  previz: boolean;
}) {
  const cam = useThree((s) => s.camera);
  const tmpT = useRef(new THREE.Vector3());
  const tmpP = useRef(new THREE.Vector3());

  useFrame((state) => {
    const n = beats.length;
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const seg = p * (n - 1);
    const i = Math.min(Math.floor(seg), n - 2);
    const f = seg - i;
    tmpT.current.copy(beats[i].target).lerp(beats[i + 1].target, f);
    tmpP.current.copy(beats[i].camPos).lerp(beats[i + 1].camPos, f);
    cam.position.lerp(tmpP.current, 0.16);
    cam.lookAt(tmpT.current);

    if (previz) return; // movie playing — leave screens at uUseVideo=1, full bright
    brand.draw(state.clock.elapsedTime);

    for (const s of screens) {
      // reveal: once the flow front passes a surface's beat, it stays branded
      const reveal = THREE.MathUtils.smoothstep(seg, s.beat - 0.6, s.beat + 0.25);
      // travelling highlight around the current focus
      const d = Math.abs(s.beat - seg);
      const bright = THREE.MathUtils.lerp(1.6, 0.62, THREE.MathUtils.clamp(d / 1.4, 0, 1));
      s.material.uniforms.uMix.value = reveal;
      s.material.uniforms.uBright.value = bright;
    }
  });

  return null;
}

function VenueStructure({
  radius,
  floorY,
  stageCenter,
  flowDir,
}: {
  radius: number;
  floorY: number;
  stageCenter: THREE.Vector3;
  flowDir: THREE.Vector2;
}) {
  const layout = useMemo(() => {
    const stageDir = new THREE.Vector3(flowDir.x, 0, flowDir.y);
    if (stageDir.lengthSq() < 1e-4) stageDir.set(1, 0, 0);
    stageDir.normalize();
    return {
      rotationY: Math.atan2(-stageDir.z, stageDir.x),
      roomDepth: radius * 1.45,
      roomWidth: radius * 1.28,
      wallHeight: radius * 0.36,
      ceilingY: Math.max(stageCenter.y + radius * 0.14, floorY + radius * 0.28),
      beam: Math.max(radius * 0.012, 0.34),
    };
  }, [flowDir.x, flowDir.y, floorY, radius, stageCenter.y]);

  const materials = useMemo(
    () => ({
      floor: new THREE.MeshStandardMaterial({ color: '#36343c', roughness: 0.9, metalness: 0.04 }),
      wall: new THREE.MeshStandardMaterial({ color: '#24222a', roughness: 0.92, metalness: 0.02 }),
      metal: new THREE.MeshStandardMaterial({ color: '#64606c', roughness: 0.5, metalness: 0.55 }),
      water: new THREE.MeshStandardMaterial({ color: '#185b78', roughness: 0.28, metalness: 0.25, transparent: true, opacity: 0.72 }),
      ceiling: new THREE.MeshStandardMaterial({ color: '#1e1d24', roughness: 0.94, metalness: 0.01, transparent: true, opacity: 0.82 }),
    }),
    [],
  );

  const trussZ = [-0.42, -0.14, 0.14, 0.42].map((z) => z * layout.roomWidth);
  const crossX = [-0.76, -0.52, -0.28, -0.04, 0.18].map((x) => x * layout.roomDepth);

  return (
    <group position={[stageCenter.x, 0, stageCenter.z]} rotation={[0, layout.rotationY, 0]}>
      <mesh material={materials.floor} position={[-layout.roomDepth * 0.43, floorY - 0.08, 0]}>
        <boxGeometry args={[layout.roomDepth * 1.18, 0.18, layout.roomWidth * 1.04]} />
      </mesh>

      <mesh material={materials.water} position={[-layout.roomDepth * 0.72, floorY + 0.08, 0]}>
        <boxGeometry args={[layout.roomDepth * 0.34, 0.08, layout.roomWidth * 0.9]} />
      </mesh>

      <mesh material={materials.wall} position={[layout.roomDepth * 0.19, floorY + layout.wallHeight * 0.5, 0]}>
        <boxGeometry args={[0.5, layout.wallHeight, layout.roomWidth * 1.04]} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh
          key={`side-wall-${side}`}
          material={materials.wall}
          position={[-layout.roomDepth * 0.28, floorY + layout.wallHeight * 0.46, side * layout.roomWidth * 0.52]}
        >
          <boxGeometry args={[layout.roomDepth * 0.95, layout.wallHeight * 0.92, 0.42]} />
        </mesh>
      ))}

      <mesh material={materials.ceiling} position={[-layout.roomDepth * 0.32, layout.ceilingY + layout.beam * 0.65, 0]}>
        <boxGeometry args={[layout.roomDepth * 0.92, 0.08, layout.roomWidth * 1.02]} />
      </mesh>

      {trussZ.map((z) => (
        <mesh key={`truss-long-${z}`} material={materials.metal} position={[-layout.roomDepth * 0.32, layout.ceilingY, z]}>
          <boxGeometry args={[layout.roomDepth * 0.98, layout.beam, layout.beam]} />
        </mesh>
      ))}

      {crossX.map((x) => (
        <mesh key={`truss-cross-${x}`} material={materials.metal} position={[x, layout.ceilingY, 0]}>
          <boxGeometry args={[layout.beam, layout.beam, layout.roomWidth * 0.94]} />
        </mesh>
      ))}

      {[-1, 1].flatMap((side) =>
        [-0.62, -0.16, 0.16].map((x) => (
          <mesh
            key={`column-${side}-${x}`}
            material={materials.metal}
            position={[x * layout.roomDepth, floorY + layout.wallHeight * 0.5, side * layout.roomWidth * 0.47]}
          >
            <cylinderGeometry args={[layout.beam * 1.45, layout.beam * 1.45, layout.wallHeight, 12]} />
          </mesh>
        )),
      )}
    </group>
  );
}

function RoomModel({
  orbit,
  previz,
  progressRef,
  videoTex,
}: {
  orbit: boolean;
  previz: boolean;
  progressRef: MutableRefObject<number>;
  videoTex: THREE.VideoTexture;
}) {
  const { scene } = useGLTF(GLTF_URL);

  const built = useMemo(() => {
    const clone = scene.clone(true);
    const brand = makeBrandTexture();
    const screens: ScreenRef[] = [];

    // Shared stylized PBR materials for structural geometry. Kept dark and
    // matte so the LED screens remain the visual hero.
    const structuralMats = {
      water: new THREE.MeshStandardMaterial({ color: '#1a2740', roughness: 0.25, metalness: 0.6 }),
      concrete: new THREE.MeshStandardMaterial({ color: '#3d3d48', roughness: 0.88, metalness: 0.04 }),
      metal: new THREE.MeshStandardMaterial({ color: '#5a5a66', roughness: 0.42, metalness: 0.7 }),
      ceiling: new THREE.MeshStandardMaterial({ color: '#26262e', roughness: 0.92, metalness: 0.0 }),
      fallback: new THREE.MeshStandardMaterial({ color: '#3a3a44', roughness: 0.85, metalness: 0.08 }),
    };
    const classify = (mesh: THREE.Mesh, matName: string): THREE.MeshStandardMaterial => {
      const n = `${mesh.name} ${mesh.parent?.name ?? ''} ${matName}`.toLowerCase();
      if (/pool|water/.test(n)) return structuralMats.water;
      if (/truss|frame|rig|metal|beam|pipe/.test(n)) return structuralMats.metal;
      if (/ceiling|roof/.test(n)) return structuralMats.ceiling;
      if (/wall|tile|deck|stage|floor/.test(n)) return structuralMats.concrete;
      return structuralMats.fallback;
    };

    // Recentre first so world matrices are correct for UV projection.
    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    clone.position.sub(center);
    clone.updateMatrixWorld(true);

    clone.traverse((o) => {
      o.visible = true;
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;

      const name = namedAncestor(mesh);
      const m0 = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const matName = (m0 as THREE.Material)?.name ?? '';
      if (!/^MI_/.test(matName)) {
        // Structural geometry — keep visible with stylized PBR material.
        mesh.material = classify(mesh, matName);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = true;
        return;
      }


      const geo = (mesh.geometry as THREE.BufferGeometry).clone();
      normalizeUVs(geo);
      applyUVFix(geo, name);
      mesh.geometry = geo;

      const map = firstMap(mesh.material);
      if (map) {
        map.colorSpace = THREE.NoColorSpace; // passthrough (see videoTex note)
        map.anisotropy = 8;
        map.wrapS = THREE.ClampToEdgeWrapping;
        map.wrapT = THREE.ClampToEdgeWrapping;
        map.needsUpdate = true;
      }
      const material = new THREE.ShaderMaterial({
        uniforms: {
          // Outdoor screens have no baked card texture → fall back to the live
          // brand layer so they read as branded (not black) when previz is off.
          uCard: { value: map ?? brand.tex },
          uBrand: { value: brand.tex },
          uVideo: { value: videoTex },
          uMix: { value: 0 },
          uBright: { value: 1 },
          uUseVideo: { value: 0 },
          uVideoFlipU: { value: 0 },
          uVideoFlipV: { value: 1 },
          uRegion: { value: regionVec4(name) },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
      });
      mesh.material = material;
      screens.push({ beat: beatIndexForName(name), material });
    });

    const posByName: Record<string, THREE.Vector3> = {};
    const sunraySum = new THREE.Vector3();
    let sunrayN = 0;
    clone.traverse((o) => {
      if (!/^LED_/.test(o.name)) return;
      const wp = new THREE.Vector3();
      o.getWorldPosition(wp);
      posByName[o.name] = wp;
      if (/Sunray/i.test(o.name)) {
        sunraySum.add(wp);
        sunrayN += 1;
      }
    });
    const hub = sunrayN ? sunraySum.multiplyScalar(1 / sunrayN) : new THREE.Vector3(0, size.y * 0.4, 0);

    const targetFor = (focus: BeatMeta['focus']): THREE.Vector3 => {
      switch (focus) {
        case 'room':
          return new THREE.Vector3(0, size.y * 0.04, 0);
        case 'sunray':
          return hub.clone();
        case 'imag': {
          const sr = posByName['LED_SR_IMAG'];
          const sl = posByName['LED_SL_IMAG'];
          if (sr && sl) return sr.clone().add(sl).multiplyScalar(0.5);
          return (sr ?? sl ?? new THREE.Vector3()).clone();
        }
        case 'center':
          return (posByName['LED_Center'] ?? new THREE.Vector3()).clone();
        case 'dj':
          return (posByName['LED_DJ_Booth'] ?? new THREE.Vector3()).clone();
      }
    };

    const radius = Math.max(size.length() / 2, 1);
    const dist = radius * 0.5;
    const beats: Beat[] = BEAT_META.map((bm) => {
      const target = targetFor(bm.focus);
      if (bm.focus === 'room') {
        // wide establishing shot from the audience side
        return { target, camPos: new THREE.Vector3(-radius * 0.6, radius * 0.32, radius * 1.05) };
      }
      const fwd = target.clone().negate().normalize();
      const camPos = target
        .clone()
        .add(fwd.multiplyScalar(dist))
        .add(new THREE.Vector3(0, radius * 0.06, 0));
      return { target, camPos };
    });

    // Front-on "audience" default view: look at the stage wall from the
    // floor side (DJ booth sits in front of the wall → that's toward us).
    const stageWall = new THREE.Vector3();
    let wallN = 0;
    for (const k of ['LED_Center', 'LED_SR_IMAG', 'LED_SL_IMAG']) {
      if (posByName[k]) {
        stageWall.add(posByName[k]);
        wallN += 1;
      }
    }
    if (wallN) stageWall.multiplyScalar(1 / wallN);
    const audienceDir = (posByName['LED_DJ_Booth'] ?? new THREE.Vector3(0, 0, 1)).clone().sub(stageWall);
    audienceDir.y = 0;
    if (audienceDir.lengthSq() < 1e-4) audienceDir.set(0, 0, 1);
    audienceDir.normalize();
    const frontTarget = stageWall.clone();
    const frontCam = stageWall
      .clone()
      .add(audienceDir.clone().multiplyScalar(radius * 1.35))
      .add(new THREE.Vector3(0, radius * 0.1, 0));
    // floor lines flow away from the audience toward the back (stage)
    const flowDir = new THREE.Vector2(-audienceDir.x, -audienceDir.z);
    if (flowDir.lengthSq() < 1e-4) flowDir.set(1, 0);
    flowDir.normalize();

    return {
      root: clone,
      screens,
      beats,
      brand,
      radius,
      floorY: box.min.y - center.y,
      frontCam,
      frontTarget,
      flowDir,
    };
  }, [scene, videoTex]);

  // When previz starts, clear the brand mix so it crossfades card → movie.
  useEffect(() => {
    if (!previz) return;
    for (const s of built.screens) {
      s.material.uniforms.uMix.value = 0;
      s.material.uniforms.uBright.value = 1;
    }
  }, [previz, built]);

  // Crossfade cards <-> movie instead of a hard cut.
  useFrame((_, dt) => {
    const target = previz ? 1 : 0;
    const k = Math.min(1, dt * 2.4); // ~0.4s fade
    for (const s of built.screens) {
      const u = s.material.uniforms.uUseVideo;
      u.value += (target - u.value) * k;
    }
  });

  // Floor material ref — breathing lives in its shader; here we tint it to the
  // movie's average colour during previz, and restore the neon default after.
  const floorMatRef = useRef<THREE.ShaderMaterial>(null);
  const sampler = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 14;
    return { c, ctx: c.getContext('2d', { willReadFrequently: true }) };
  }, []);
  const frameN = useRef(0);
  const tmpC = useRef(new THREE.Color());

  useFrame(() => {
    if (!previz || !sampler.ctx) return;
    const m = floorMatRef.current;
    if (!m) return;
    frameN.current += 1;
    // Sample the movie every ~20 frames so the video decoder isn't starved
    // by the floor-tint readback while previz is playing.
    if (frameN.current % 20 !== 0) return;
    const vid = videoTex.image as HTMLVideoElement | undefined;
    if (!vid || vid.readyState < 2) return;
    try {
      sampler.ctx.drawImage(vid, 0, 0, sampler.c.width, sampler.c.height);
      const data = sampler.ctx.getImageData(0, 0, sampler.c.width, sampler.c.height).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
      const target = tmpC.current.setRGB(r / n / 255, g / n / 255, b / n / 255);
      const hsl = { h: 0, s: 0, l: 0 };
      target.getHSL(hsl);
      target.setHSL(hsl.h, Math.min(1, hsl.s * 1.6 + 0.1), Math.min(0.7, hsl.l + 0.18));
      m.uniforms.uColA.value.lerp(target, 0.15);
      m.uniforms.uColB.value.lerp(target, 0.15);
    } catch {
      // cross-origin / not ready — ignore
    }
  });

  // Restore the neon floor colours when previz turns off.
  useEffect(() => {
    if (previz) return;
    const m = floorMatRef.current;
    if (m) {
      m.uniforms.uColA.value.set('#A020F0');
      m.uniforms.uColB.value.set('#00BFFF');
    }
  }, [previz]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={50}
        near={built.radius * 0.02}
        far={built.radius * 40}
        position={orbit ? built.frontCam.toArray() : built.beats[0].camPos.toArray()}
      />
      {orbit ? (
        <OrbitControls
          target={built.frontTarget.toArray()}
          enablePan
          minDistance={built.radius * 0.25}
          maxDistance={built.radius * 6}
          maxPolarAngle={Math.PI * 0.95}
        />
      ) : (
        <CameraRig beats={built.beats} screens={built.screens} brand={built.brand} progressRef={progressRef} previz={previz} />
      )}

      <VenueStructure radius={built.radius} floorY={built.floorY} stageCenter={built.frontTarget} flowDir={built.flowDir} />
      <primitive object={built.root} />

      {/* Clean mirrored floor — reflects the screens */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, built.floorY, 0]}>
        <planeGeometry args={[built.radius * 10, built.radius * 10]} />
        <MeshReflectorMaterial
          resolution={2048}
          blur={[0, 0]}
          mixBlur={0}
          mixStrength={3}
          mirror={1}
          color="#141420"
          metalness={0.9}
          roughness={0.12}
        />
      </mesh>

      {/* Flowing floor — lines stream across the floor toward the back */}
      {/* Minimal lighting + env so stylized PBR structural surfaces render */}
      <ambientLight intensity={0.55} color="#b8b4d0" />
      <hemisphereLight args={['#8a8ab0', '#1a1a22', 0.7]} />
      <directionalLight position={[built.radius * 1.2, built.radius * 1.8, built.radius * 0.8]} intensity={0.9} color="#ffffff" />
      <Environment preset="night" />

      {/* Flowing floor — lines stream across the floor toward the back */}
      <FlowFloor radius={built.radius} floorY={built.floorY} flowDir={built.flowDir} matRef={floorMatRef} />


      {/* subtle glowing sparkle (bloom turns these into twinkles) */}
      <Sparkles
        count={90}
        scale={[built.radius * 2.4, built.radius * 1.4, built.radius * 2.4]}
        position={[0, built.floorY + built.radius * 0.5, 0]}
        size={2.5}
        speed={0.25}
        opacity={0.55}
        noise={1.5}
        color="#9ad8ff"
      />

    </>
  );
}

// Bundled fallback movie — used until an admin uploads one (see VenuePrevizManager).
const FALLBACK_PREVIZ_URL = '/venue/previz-vanderpump.mp4';

export default function RoomScene({
  progressRef,
  orbit = false,
  previz = false,
  previzUrl,
  onVideoReady,
}: {
  progressRef: MutableRefObject<number>;
  orbit?: boolean;
  previz?: boolean;
  /** Active previz movie URL (from site_settings). Falls back to the bundled file. */
  previzUrl?: string;
  /** Receives the underlying HTMLVideoElement whenever the source changes — used by cue overlays to sync to the same playback clock. */
  onVideoReady?: (video: HTMLVideoElement | null) => void;
}) {
  const src = previzUrl && previzUrl.trim() ? previzUrl : FALLBACK_PREVIZ_URL;
  const video = useMemo(() => {
    const v = document.createElement('video');
    // crossOrigin MUST be set BEFORE src so the request is sent with CORS
    // headers — otherwise the resulting canvas is tainted and getImageData
    // (used by the floor colour sampler) throws, leaving the floor stuck on
    // the default neon palette instead of tinting to the movie's colours.
    v.crossOrigin = 'anonymous';
    v.loop = true;
    v.muted = true; // start muted so autoplay is allowed; parent unmutes on user gesture
    v.playsInline = true;
    // 'auto' on a 1–2 GB H.264 file causes the browser to chase the whole
    // buffer aggressively and stutters playback. 'metadata' lets the media
    // engine stream just-in-time, which is far smoother for big previz files.
    v.preload = 'metadata';
    (v as any).disablePictureInPicture = true;
    v.src = src;
    return v;
  }, [src]);
  useEffect(() => {
    onVideoReady?.(video);
    return () => onVideoReady?.(null);
  }, [video, onVideoReady]);
  const videoTex = useMemo(() => {
    const t = new THREE.VideoTexture(video);
    // passthrough: the custom screen shader has no sRGB output encoding, so we
    // keep the texels raw and write them straight to the (sRGB) framebuffer.
    t.colorSpace = THREE.NoColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, [video]);

  useEffect(() => {
    if (previz) {
      // Kick the decoder before play() so the first frames are ready.
      try { video.load(); } catch { /* noop */ }
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      video.pause();
    }
  }, [previz, video]);

  return (
    <Canvas
      className="vvm-3d-canvas"
      // Lower the pixel-ratio ceiling while previz is playing so the GPU
      // isn't decoding video AND rasterising 2x pixels at the same time.
      dpr={previz ? [1, 1.25] : [1, 2]}
      gl={{ antialias: !previz, alpha: false, toneMapping: THREE.NoToneMapping, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#06060b']} />
      <Suspense fallback={null}>
        <RoomModel orbit={orbit} previz={previz} progressRef={progressRef} videoTex={videoTex} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(GLTF_URL);
