// A stitched-embroidery look rendered in one fragment shader.
//
// The existing preview (product-catalog-client) walks every pixel in JS and
// strokes thousands of short lines, then layers an emboss fourteen times — a
// second or more for a designer-sized render. Here the whole look is one GPU
// pass over the design: every pixel works out for itself which thread it lies
// on, how that thread is lit, and whether it sits in the satin border that
// runs along every edge. One draw call, no per-pixel JavaScript, and the
// result lands in an ordinary 2D canvas so callers see no difference.
//
// What the shader models, from the cues that make embroidery read as such:
//   · fill regions stitched in parallel runs, each colour region in its own
//     direction (tatami fill), with the brick-staggered needle points where
//     one stitch ends and the next begins
//   · thread as a tiny lit cylinder: a bright crown, dark gaps between
//     threads, and the anisotropic sheen of polyester thread (a highlight
//     that runs across the thread, not along it)
//   · a satin border along every outside edge and every thin stroke,
//     stitched across the edge and rounded like a bead
//   · a seam where two colour regions meet, and a soft drop shadow where the
//     raised patch lifts off the fabric
//
// One WebGL context is shared by all renders (browsers cap live contexts at
// about sixteen); the texture is re-uploaded per render, which is cheap.

export type EmbroideryGlOptions = {
  /** Thread pitch in render pixels — the distance between neighbouring threads. */
  pitch?: number
  /** Width of the satin border along edges, in render pixels. */
  border?: number
  /** Strength of the thread's sheen, 0–1. */
  sheen?: number
  /** Strength of the raised-patch relief and drop shadow, 0–1. */
  relief?: number
  /** Length of one fill stitch, in thread pitches, before the needle goes down again. */
  stitch?: number
  /** How many levels each colour channel is flattened to — fewer reads as fewer threads. */
  levels?: number
}

// Tuned by eye over the whole Graphics panel: a coarse, clearly visible
// thread, a wide satin border, a little sheen and a moderate relief.
export const EMBROIDERY_GL_DEFAULTS: Required<EmbroideryGlOptions> = {
  pitch: 7.1,
  border: 12.5,
  sheen: 0.25,
  relief: 0.45,
  stitch: 9,
  levels: 9,
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_size;
uniform float u_pitch;
uniform float u_border;
uniform float u_sheen;
uniform float u_relief;
uniform float u_stitch;
uniform float u_levels;

const float PI = 3.14159265;
const vec3 LIGHT = normalize(vec3(-0.42, -0.5, 0.75));

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec4 tap(vec2 px) {
  return texture2D(u_tex, px / u_size);
}

vec3 quant(vec3 c, float n) {
  return floor(c * n + 0.5) / n;
}

// One thread, lit: T is the thread's direction, t the coordinate across the
// threads (the ridges repeat every pitch), s the coordinate along them.
// segLen > 0 breaks the run into stitches with staggered needle points.
vec3 threadShade(vec3 base, vec2 T, float t, float s, float segLen, float sheen) {
  float ph = fract(t / u_pitch);
  float h = sin(ph * PI);
  vec2 N2 = vec2(-T.y, T.x);
  vec3 n = normalize(vec3(N2 * cos(ph * PI) * 0.9, max(h, 0.18)));
  float diff = max(dot(n, LIGHT), 0.0);
  vec3 H = normalize(LIGHT + vec3(0.0, 0.0, 1.0));
  float TdotH = dot(vec3(T, 0.0), H);
  float spec = pow(max(1.0 - TdotH * TdotH, 0.0), 22.0) * sheen * (0.25 + 0.75 * h);
  float dip = 1.0;
  if (segLen > 0.0) {
    float row = floor(t / u_pitch);
    float off = mod(row, 3.0) * segLen / 3.0;
    float seg = fract((s + off) / segLen);
    dip = smoothstep(0.0, 0.1, seg) * smoothstep(1.0, 0.9, seg);
    dip = 0.7 + 0.3 * dip;
  }
  // Averages out close to the thread's own colour, so the patch stays as
  // light as the artwork; the crown goes a little past it, the gaps below.
  vec3 col = base * (0.7 + 0.48 * diff) * (0.8 + 0.22 * h) * dip;
  col += spec * mix(vec3(1.0), base, 0.35) * 0.55;
  return col;
}

void main() {
  vec2 px = v_uv * u_size;
  vec4 c0 = tap(px);
  float a0 = c0.a;

  // Eight taps round the pixel at the border width, eight more at half of it:
  // how much design surrounds this pixel, and which way its edges run.
  float cov = 0.0;
  float minCov = 1.0;
  vec2 grad = vec2(0.0);
  vec2 axis = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    float ang = float(i) * PI / 4.0;
    vec2 d = vec2(cos(ang), sin(ang));
    float a1 = tap(px + d * u_border).a;
    float a2 = tap(px + d * u_border * 0.5).a;
    cov += a1;
    minCov = min(minCov, a1);
    grad -= d * (a1 + a2);
    // Doubled angles, so opposite taps vote for the same axis: the axis the
    // design continues along is the edge's tangent.
    float w = a1 + a2;
    axis += w * w * vec2(cos(2.0 * ang), sin(2.0 * ang));
  }
  cov /= 8.0;

  if (a0 < 0.02) {
    // Outside the design: only the patch's drop shadow, set down and right.
    float sh = 0.0;
    vec2 o = px - vec2(1.5, 2.5);
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * PI / 4.0;
      sh += tap(o + vec2(cos(ang), sin(ang)) * 3.0).a;
    }
    sh = sh / 8.0 * 0.4 * u_relief;
    gl_FragColor = vec4(0.0, 0.0, 0.0, sh);
    return;
  }

  // Thread colours are solid: flatten the artwork slightly.
  vec3 q = quant(c0.rgb, u_levels);

  // Tatami fill — each colour region stitched in its own direction. The
  // region's colour is read over a small patch, so shading inside painted
  // artwork doesn't flip the direction from pixel to pixel.
  vec3 keyCol = c0.rgb;
  for (int i = 0; i < 4; i++) {
    float ang1 = float(i) * PI / 2.0 + PI / 4.0;
    vec4 nb = tap(px + vec2(cos(ang1), sin(ang1)) * 5.0);
    keyCol += nb.a > 0.5 ? nb.rgb : c0.rgb;
  }
  vec3 key = quant(keyCol / 5.0, 4.0);
  float hsh = hash(key.xy * 7.0 + key.z * 13.0);
  float ang = (floor(hsh * 5.0) - 2.0) * 0.5 + 0.3;
  vec2 T = vec2(cos(ang), sin(ang));
  vec2 N = vec2(-T.y, T.x);
  float s = dot(px, T);
  float t = dot(px, N);
  t += (hash(vec2(floor(s / (u_pitch * 3.0)), floor(t / u_pitch))) - 0.5) * 0.5;
  vec3 col = threadShade(q, T, t, s, u_pitch * u_stitch, u_sheen);

  // Satin border along the outside edge — stitched across the edge, so the
  // ridges repeat along the tangent — and rounded like a bead.
  float edgeAmt = 1.0 - smoothstep(0.25, 0.85, minCov);
  if (edgeAmt > 0.0 && length(axis) > 0.001) {
    float tangentAng = atan(axis.y, axis.x) * 0.5;
    vec2 Tg = vec2(cos(tangentAng), sin(tangentAng));
    vec2 G = vec2(-Tg.y, Tg.x);
    if (dot(G, grad) < 0.0) G = -G;
    float bead = sin(clamp((cov - 0.3) / 0.65, 0.0, 1.0) * PI);
    vec3 border = threadShade(q * 0.96, G, dot(px, Tg), dot(px, G), 0.0, u_sheen * 1.4);
    border *= 0.78 + 0.34 * bead;
    col = mix(col, border, edgeAmt);
  }

  // Seams between colour regions — the gap where one run of thread stops
  // and the next colour starts.
  float seam = 0.0;
  for (int i = 0; i < 4; i++) {
    float ang2 = float(i) * PI / 2.0;
    vec4 nb = tap(px + vec2(cos(ang2), sin(ang2)) * 1.5);
    seam += length(quant(nb.rgb, u_levels) - q) * step(0.5, nb.a);
  }
  seam = smoothstep(0.2, 0.7, seam);
  col *= 1.0 - 0.3 * seam;

  // The raised patch: its edge slopes down to the fabric, so the lit side
  // brightens and the far side falls into shadow.
  vec2 Gn = length(grad) > 0.001 ? normalize(grad) : vec2(0.0);
  vec3 en = normalize(vec3(-Gn * edgeAmt * 1.1, 1.0));
  float rl = dot(en, LIGHT) - LIGHT.z;
  col *= 1.0 + rl * 1.2 * u_relief;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), a0);
}
`

type Renderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  uniforms: Record<
    "size" | "pitch" | "border" | "sheen" | "relief" | "stitch" | "levels",
    WebGLUniformLocation | null
  >
}

let renderer: Renderer | null | undefined

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`embroidery shader: ${log}`)
  }
  return shader
}

function createRenderer(): Renderer | null {
  const canvas = document.createElement("canvas")
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    antialias: false,
    depth: false,
    stencil: false,
  })
  if (!gl) return null

  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`embroidery shader: ${gl.getProgramInfoLog(program)}`)
  }
  gl.useProgram(program)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, "a_pos")
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.uniform1i(gl.getUniformLocation(program, "u_tex"), 0)

  const u = (name: string) => gl.getUniformLocation(program, name)
  return {
    canvas,
    gl,
    uniforms: {
      size: u("u_size"),
      pitch: u("u_pitch"),
      border: u("u_border"),
      sheen: u("u_sheen"),
      relief: u("u_relief"),
      stitch: u("u_stitch"),
      levels: u("u_levels"),
    },
  }
}

/** Whether this browser can run the shader at all. */
export function embroideryGlSupported() {
  if (renderer === undefined) renderer = createRenderer()
  return renderer !== null
}

/**
 * Renders `source` (already scaled to `width` × `height`) as embroidery and
 * returns a fresh 2D canvas holding the result — the same shape of result the
 * JS renderer gives, so the two are interchangeable.
 */
export function renderEmbroideryGl(
  source: TexImageSource,
  width: number,
  height: number,
  options: EmbroideryGlOptions = {}
): HTMLCanvasElement {
  if (renderer === undefined) renderer = createRenderer()
  if (!renderer) throw new Error("embroidery shader: WebGL unavailable")
  const { canvas, gl, uniforms } = renderer
  const o = { ...EMBROIDERY_GL_DEFAULTS, ...options }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  gl.viewport(0, 0, width, height)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.uniform2f(uniforms.size, width, height)
  gl.uniform1f(uniforms.pitch, o.pitch)
  gl.uniform1f(uniforms.border, o.border)
  gl.uniform1f(uniforms.sheen, o.sheen)
  gl.uniform1f(uniforms.relief, o.relief)
  gl.uniform1f(uniforms.stitch, o.stitch)
  gl.uniform1f(uniforms.levels, o.levels)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, 3)

  // Copied out in the same task, before the drawing buffer can be dropped.
  const out = document.createElement("canvas")
  out.width = width
  out.height = height
  out.getContext("2d")!.drawImage(canvas, 0, 0)
  return out
}
