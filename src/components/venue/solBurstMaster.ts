/**
 * Soleia — Sol Burst master frame (Background 01).
 * Offscreen WebGL renderer for the demo content that plays across the mapped
 * LED screens in the video-map explainer. It renders ONE 3840×2160-aspect
 * frame (at reduced resolution); every screen panel then blits its own map
 * rectangle out of this canvas — the same one-file-many-surfaces behaviour
 * the explainer describes.
 *
 * Standalone reference build: public/prototypes/background-01-fluid-field.html
 * Single fullscreen triangle, one draw call, no textures. All motion is driven
 * by the explainer's timeline clock, so pausing the explainer freezes the
 * content too.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uT;
uniform float uBreath;

const vec3 BASE  = vec3(0.094, 0.067, 0.055);  /* #18110E */
const vec3 CREAM = vec3(0.953, 0.914, 0.847);  /* #F3E9D8 */
const vec3 GOLD  = vec3(0.843, 0.710, 0.427);  /* #D7B56D */
const vec3 GREEN = vec3(0.937, 0.969, 0.875);  /* #EFF7DF */

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm2(vec2 p) {
  return noise(p) * 0.667 + noise(p * 2.03 + 11.3) * 0.333;
}
float fbm3(vec2 p) {
  return noise(p) * 0.571 + noise(p * 2.03 + 11.3) * 0.286 + noise(p * 4.11 + 27.7) * 0.143;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 pv = (frag - 0.5 * uRes) / uRes.y;
  float rad = length(pv);
  float theta = atan(pv.y, pv.x);
  float ft = uT * 0.045;

  vec2 p = pv * 1.4;
  vec2 q = vec2(
    fbm2(p + vec2(0.0, ft * 0.30)),
    fbm2(p + vec2(5.2, 1.3) + vec2(-ft * 0.24, 0.0)));
  float f = fbm3(p + 1.6 * q);

  float cluster = fbm2(vec2(cos(theta), sin(theta)) * 2.3 + vec2(ft * 0.06, -ft * 0.05));
  float bright = 0.16 + 0.84 * smoothstep(0.34, 0.82, cluster);

  float phase = (theta + uT * 0.006) * 44.0 + (f - 0.5) * 2.6;
  float crest = 0.5 + 0.5 * sin(phase);
  float wedge = pow(crest, 1.3);
  float line  = pow(crest, 3.8);
  float env = smoothstep(0.02, 0.20, rad) * (0.30 + 0.70 * exp(-rad * 1.1));
  float ray = (0.62 * wedge + 0.38 * line) * env * bright;

  vec3 col = BASE;
  col += CREAM * smoothstep(0.50, 0.95, f) * 0.06 * (0.7 + 0.4 * uBreath);
  col += GOLD * ray * (0.34 + 0.22 * uBreath);
  col += CREAM * ray * ray * 0.22;
  col += GREEN * ray * smoothstep(0.86, 0.98, cluster) * 0.06;
  col += CREAM * exp(-rad * rad * 9.0) * (0.30 + 0.12 * uBreath);
  col += GOLD  * exp(-rad * rad * 2.4) * (0.10 + 0.05 * uBreath);

  col *= 1.0 - dot(pv, pv) * 0.30;
  col += (hash(frag * 0.6031 + floor(uT * 12.0)) - 0.5) * 0.010;

  gl_FragColor = vec4(col, 1.0);
}
`;

const BREATH_PERIOD = 9.0;

export class SolBurstMaster {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private uT: WebGLUniformLocation | null = null;
  private uBreath: WebGLUniformLocation | null = null;

  constructor(width = 960, height = 540) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    try {
      const gl = this.canvas.getContext('webgl', {
        alpha: false, antialias: false, depth: false, stencil: false,
        powerPreference: 'high-performance', preserveDrawingBuffer: true,
      });
      if (!gl) return;
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed');
        }
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) || 'program link failed');
      }
      gl.useProgram(prog);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), width, height);
      this.uT = gl.getUniformLocation(prog, 'uT');
      this.uBreath = gl.getUniformLocation(prog, 'uBreath');
      gl.viewport(0, 0, width, height);
      this.gl = gl;
    } catch {
      this.gl = null;
    }
  }

  get ok() { return this.gl != null; }

  /** Render the frame at timeline second t (delta-time safe — pure function of t). */
  render(t: number) {
    const gl = this.gl;
    if (!gl) return;
    let b = 0.5 - 0.5 * Math.cos((t * 2 * Math.PI) / BREATH_PERIOD);
    b = b * b * (3 - 2 * b);
    gl.uniform1f(this.uT, t);
    gl.uniform1f(this.uBreath, b);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
  }
}
