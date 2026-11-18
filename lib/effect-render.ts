import { effectById, type AppliedEffect } from "./effects"

// Renders an image with an effect (lib/effects) into a PNG data URL, which the
// canvas then shows in the image's place. One small WebGL fragment shader per
// effect, written for this prototype to approximate the look of create-omat's
// thumbnails — not a port of anything. Results are cached per image, effect
// and slider values, so moving a slider back is instant.

// Longest side rendered: plenty for the canvas, cheap enough to redo per frame
// while a slider moves.
const MAX_SIDE = 1024
const CACHE_LIMIT = 60

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  // Top-left of the image is uv (0, 0), as it is in the texture.
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

// Shared by every effect: the image, its size in pixels, up to four slider
// values in the order lib/effects lists them, and a few helpers.
const HEADER = `
precision highp float;
uniform sampler2D u_img;
uniform vec2 u_res;
uniform float u_p0;
uniform float u_p1;
uniform float u_p2;
uniform float u_p3;
varying vec2 v_uv;

vec4 tex(vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(u_img, uv);
}
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}
vec2 chroma(vec3 c) {
  return vec2(dot(c, vec3(-0.169, -0.331, 0.5)), dot(c, vec3(0.5, -0.419, -0.081)));
}
// Edge strength from luminance and alpha, a 3x3 Sobel at the given radius.
float edges(vec2 uv, float radius) {
  vec2 px = radius / u_res;
  float k[9];
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec4 s = tex(uv + vec2(float(x), float(y)) * px);
      k[(y + 1) * 3 + (x + 1)] = lum(s.rgb) * s.a + s.a * 0.5;
    }
  }
  float gx = k[2] + 2.0 * k[5] + k[8] - k[0] - 2.0 * k[3] - k[6];
  float gy = k[6] + 2.0 * k[7] + k[8] - k[0] - 2.0 * k[1] - k[2];
  return clamp(length(vec2(gx, gy)), 0.0, 1.0);
}
`

const SHADERS: Record<string, string> = {
  // levels
  posterize: `
void main() {
  vec4 c = tex(v_uv);
  float l = max(u_p0, 1.0);
  gl_FragColor = vec4(clamp(floor(c.rgb * l + 0.5) / l, 0.0, 1.0), c.a);
}`,
  // blur, dots, size
  "dot-pattern": `
void main() {
  vec2 cells = vec2(u_p1, u_p1 * u_res.y / u_res.x);
  vec2 g = v_uv * cells;
  vec4 c = tex((floor(g) + 0.5) / cells);
  float r = mix(0.1, 0.8, u_p2);
  float soft = 0.03 + u_p0 * 0.4;
  float d = length(fract(g) - 0.5);
  gl_FragColor = vec4(c.rgb, c.a * (1.0 - smoothstep(r - soft, r, d)));
}`,
  // radius, segments
  "radial-pixel": `
void main() {
  float aspect = u_res.x / u_res.y;
  vec2 p = v_uv - 0.5;
  p.x *= aspect;
  float ringStep = max(u_p0 * 0.12, 0.004);
  float angleStep = max(u_p1 * 18.85, 0.005);
  float r = (floor(length(p) / ringStep) + 0.5) * ringStep;
  float a = (floor(atan(p.y, p.x) / angleStep) + 0.5) * angleStep;
  vec2 q = vec2(cos(a), sin(a)) * r;
  q.x /= aspect;
  gl_FragColor = tex(q + 0.5);
}`,
  // scale
  linocut: `
void main() {
  vec4 c = tex(v_uv);
  vec2 p = v_uv * vec2(u_res.x / u_res.y, 1.0);
  float period = mix(0.006, 0.04, u_p0);
  float s = sin((p.x * 0.6 + p.y) / period * 6.2832) * 0.5 + 0.5;
  float l = lum(c.rgb);
  float v = smoothstep(s * 0.8 + 0.05, s * 0.8 + 0.15, l);
  gl_FragColor = vec4(vec3(v), c.a);
}`,
  // horizontal, vertical
  pixelize: `
void main() {
  vec2 cells = vec2(max(u_p0, 1.0), max(u_p1, 1.0));
  gl_FragColor = tex((floor(v_uv * cells) + 0.5) / cells);
}`,
  // amount, scale, time
  liquid: `
void main() {
  float f = 3.0 + u_p1 * 10.0;
  float t = u_p2 * 6.2832;
  vec2 off = vec2(
    sin(v_uv.y * f + t) + 0.5 * sin(v_uv.y * f * 2.3 + t * 1.7),
    cos(v_uv.x * f * 1.3 + t) + 0.5 * cos(v_uv.x * f * 2.1 - t)
  ) * u_p0 * 0.15;
  gl_FragColor = tex(v_uv + off);
}`,
  // offset, slices, speedV, time
  "cross-cut": `
void main() {
  float band = floor(v_uv.y * u_p1 * 2.0);
  float seed = band + floor(u_p3 * 10.0) * 17.0;
  float shift = (hash(seed) - 0.5) * 2.0 * u_p0 * step(0.35, hash(seed + 3.1));
  float lift = (hash(seed + 7.0) - 0.5) * u_p2 * 0.02;
  gl_FragColor = tex(v_uv + vec2(shift, lift));
}`,
  // angle, scale
  "half-tone": `
void main() {
  vec4 c = tex(v_uv);
  float a = radians(u_p0);
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  float cell = mix(3.0, 24.0, u_p1) * u_res.x / 600.0;
  vec2 g = rot * (v_uv * u_res) / cell;
  vec2 centre = (floor(g) + 0.5) * cell;
  vec4 s = tex((centre * rot) / u_res);
  float r = sqrt(clamp(1.0 - lum(s.rgb), 0.0, 1.0)) * 0.62;
  float ink = 1.0 - smoothstep(r - 0.08, r + 0.08, length(fract(g) - 0.5));
  gl_FragColor = vec4(vec3(1.0 - ink), c.a);
}`,
  // distortion, distortion2, rollSpeed, speed
  "tv-glitch": `
void main() {
  float y = v_uv.y + sin(v_uv.y * 20.0) * u_p2 * 0.002;
  float rough = (noise(y * (u_p3 * 3.0 + 2.0)) - 0.5) * u_p0 * 0.02;
  float fine = sin(y * u_res.y * 0.5) * u_p1 * 0.0015;
  vec2 uv = vec2(v_uv.x + rough + fine, y);
  float split = 0.002 + u_p0 * 0.0008;
  vec4 r = tex(uv + vec2(split, 0.0));
  vec4 g = tex(uv);
  vec4 b = tex(uv - vec2(split, 0.0));
  gl_FragColor = vec4(r.r, g.g, b.b, max(g.a, max(r.a, b.a)));
}`,
  // side: 0 left onto right, 1 right onto left, 2 top onto bottom, 3 bottom onto top
  mirror: `
void main() {
  vec2 uv = v_uv;
  float side = floor(u_p0 + 0.5);
  if (side < 0.5) uv.x = uv.x > 0.5 ? 1.0 - uv.x : uv.x;
  else if (side < 1.5) uv.x = uv.x < 0.5 ? 1.0 - uv.x : uv.x;
  else if (side < 2.5) uv.y = uv.y > 0.5 ? 1.0 - uv.y : uv.y;
  else uv.y = uv.y < 0.5 ? 1.0 - uv.y : uv.y;
  gl_FragColor = tex(uv);
}`,
  // amount, passthrough
  outliner: `
void main() {
  vec4 c = tex(v_uv);
  float e = edges(v_uv, 1.5);
  vec3 tone = vec3(0.47, 0.42, 0.38) * (0.7 + 0.6 * lum(c.rgb));
  vec3 base = mix(tone, c.rgb, u_p1 * 0.5);
  gl_FragColor = vec4(mix(base, vec3(1.0), clamp(e * 1.5, 0.0, 1.0) * u_p0), c.a);
}`,
  // amount, darkness, size
  glow: `
void main() {
  vec4 c = tex(v_uv);
  vec2 rad = vec2(u_p2 * 0.004) * vec2(1.0, u_res.x / u_res.y);
  vec4 sum = vec4(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 0.3927;
    sum += tex(v_uv + vec2(cos(a), sin(a)) * rad);
    sum += tex(v_uv + vec2(cos(a), sin(a)) * rad * 0.5);
  }
  sum /= 32.0;
  vec3 col = c.rgb * (1.0 - u_p1 * 0.25) + sum.rgb * sum.rgb * u_p0 * 0.9;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), max(c.a, sum.a * u_p0 * 0.6));
}`,
  // darkness, offset
  vignette: `
void main() {
  vec4 c = tex(v_uv);
  float d = length(v_uv - 0.5) * 1.4142;
  float edge = u_p1 * 0.55;
  float v = 1.0 - smoothstep(edge - 0.7, edge + 0.3, d);
  gl_FragColor = vec4(c.rgb * mix(1.0, v * 0.85, u_p0), c.a);
}`,
  sharpie: `
void main() {
  vec4 c = tex(v_uv);
  float e = edges(v_uv, 1.2);
  vec3 col = (c.rgb - 0.5) * 1.3 + 0.5;
  col = mix(col, col * vec3(0.85, 1.0, 0.55), 0.6);
  gl_FragColor = vec4(clamp(col * (1.0 - e * 0.9), 0.0, 1.0), c.a);
}`,
  // colorMatch, brightnessMatch, smoothness — light tones to blue
  recolor: `
void main() {
  vec4 c = tex(v_uv);
  vec3 from = vec3(1.0);
  vec3 to = vec3(0.12, 0.2, 0.85);
  float l = lum(c.rgb);
  float match = distance(chroma(c.rgb), chroma(from)) * 4.0
    + abs(l - lum(from)) / (0.5 + u_p1);
  float w = 1.0 - smoothstep(u_p0, u_p0 + u_p2, match);
  gl_FragColor = vec4(mix(c.rgb, to * (0.4 + l), w), c.a);
}`,
  // colorMatch, smoothness, spill — keys out green, spill greys what's left
  "green-screen": `
void main() {
  vec4 c = tex(v_uv);
  float d = distance(chroma(c.rgb), chroma(vec3(0.0, 1.0, 0.0)));
  float keyed = 1.0 - smoothstep(u_p0 * 0.25, u_p0 * 0.25 + u_p1 * 0.4, d);
  vec3 col = mix(c.rgb, vec3(lum(c.rgb)), u_p2 * 0.9);
  gl_FragColor = vec4(col, c.a * (1.0 - keyed));
}`,
}

type Gl = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  programs: Map<string, WebGLProgram>
  buffer: WebGLBuffer
}

let shared: Gl | null = null

const getGl = (): Gl | null => {
  if (shared) return shared
  const canvas = document.createElement("canvas")
  const gl = canvas.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true })
  if (!gl) return null
  const buffer = gl.createBuffer()
  if (!buffer) return null
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  shared = { canvas, gl, programs: new Map(), buffer }
  return shared
}

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("Could not create shader")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader did not compile")
  }
  return shader
}

const programFor = (ctx: Gl, id: string): WebGLProgram => {
  const cached = ctx.programs.get(id)
  if (cached) return cached
  const { gl } = ctx
  const program = gl.createProgram()
  if (!program) throw new Error("Could not create program")
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, HEADER + SHADERS[id]))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Program did not link")
  }
  ctx.programs.set(id, program)
  return program
}

const images = new Map<string, Promise<HTMLImageElement>>()
const loadImage = (src: string) => {
  let pending = images.get(src)
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Could not load ${src}`))
      img.src = src
    })
    images.set(src, pending)
  }
  return pending
}

const draw = (ctx: Gl, img: HTMLImageElement, applied: AppliedEffect): string => {
  const def = effectById(applied.id)
  if (!def || !SHADERS[def.id]) throw new Error(`Unknown effect ${applied.id}`)
  const { gl, canvas } = ctx
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  gl.viewport(0, 0, canvas.width, canvas.height)

  const program = programFor(ctx, def.id)
  gl.useProgram(program)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

  gl.uniform1i(gl.getUniformLocation(program, "u_img"), 0)
  gl.uniform2f(gl.getUniformLocation(program, "u_res"), canvas.width, canvas.height)
  def.params.forEach((param, i) => {
    const value = applied.values[param.key] ?? param.defaultValue
    gl.uniform1f(gl.getUniformLocation(program, `u_p${i}`), value)
  })

  gl.bindBuffer(gl.ARRAY_BUFFER, ctx.buffer)
  const pos = gl.getAttribLocation(program, "a_pos")
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  gl.deleteTexture(texture)
  return canvas.toDataURL("image/png")
}

const results = new Map<string, Promise<string>>()

export const effectRenderKey = (src: string, applied: AppliedEffect) =>
  `${applied.id}|${JSON.stringify(applied.values)}|${src}`

// The image with the effect, as a data URL — the plain src again if WebGL is
// unavailable or the render fails, so the image never disappears.
export const renderEffect = (src: string, applied: AppliedEffect): Promise<string> => {
  const key = effectRenderKey(src, applied)
  const cached = results.get(key)
  if (cached) return cached
  const pending = loadImage(src)
    .then(img => {
      const ctx = getGl()
      return ctx ? draw(ctx, img, applied) : src
    })
    .catch(error => {
      console.error("Effect render failed", error)
      return src
    })
  results.set(key, pending)
  if (results.size > CACHE_LIMIT) {
    const oldest = results.keys().next().value
    if (oldest !== undefined) results.delete(oldest)
  }
  return pending
}
