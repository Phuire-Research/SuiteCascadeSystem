// SWRM · ShaderWrap · the WebGL post-process presenter. Binds a source frame (a bitmap /
// canvas / image — the offscreen terminal's composited output) as uSource and runs the
// reference design's GLSL over it. The GLSL is ported VERBATIM from the reference design
// (DevCascades/Reference/Refinements prior Release/shader-wrap-reference-design-v2.html) —
// per the production curry, only the SOURCE of the texture changes (Electron offscreen),
// everything downstream of the bind is identical. Reusable by the terminal presenter (D1/D2)
// and the SCP self-render (D5).

import {
  ShaderRenderMode,
  SHADER_MODE_UMODE,
  SHADER_GEO_CURVE,
  DEFAULT_SHADER_FPS,
  clampShaderFps,
} from '../shared/shaderRenderMode';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Ported verbatim from the reference design's fragment program (all 12 modes · Muxon = 13).
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSource;
uniform vec2  uRes;
uniform float uTime;
uniform int   uMode;
uniform float uCurve;

vec2 warp(vec2 uv, float amt){
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + (dot(c,c) - 1.0) * amt;
  return c * 0.5 + 0.5;
}

float bayer4(vec2 p){
  int x=int(mod(p.x,4.0)); int y=int(mod(p.y,4.0)); int i=x+y*4;
  float m[16];
  m[0]=0.0;m[1]=8.0;m[2]=2.0;m[3]=10.0;m[4]=12.0;m[5]=4.0;m[6]=14.0;m[7]=6.0;
  m[8]=3.0;m[9]=11.0;m[10]=1.0;m[11]=9.0;m[12]=15.0;m[13]=7.0;m[14]=13.0;m[15]=5.0;
  float t=0.0; for(int k=0;k<16;k++){ if(k==i) t=m[k]; }
  return (t+1.0)/17.0 - 0.5;
}
vec3 cga(vec3 col){
  vec3 p[4];
  p[0]=vec3(0.0); p[1]=vec3(0.33,1.0,1.0); p[2]=vec3(1.0,0.33,1.0); p[3]=vec3(1.0);
  float best=1e9; vec3 o=p[0];
  for(int i=0;i<4;i++){ float d=distance(col,p[i]); if(d<best){best=d;o=p[i];} }
  return o;
}
vec3 dmg(float l){
  if(l<0.25) return vec3(0.06,0.22,0.06);
  if(l<0.50) return vec3(0.19,0.38,0.13);
  if(l<0.75) return vec3(0.55,0.67,0.06);
  return vec3(0.61,0.74,0.06);
}

void main(){
  vec2 uv = vUv;
  float vig = 1.0;
  bool curved = (uMode==10 || uMode==11 || uMode==13);
  vec2 preUv = uv;

  // SWRM · top-edge projection + bloom (user 2026-06-08). topCol = the top-row colour (the Suite
  // Colours bar) at this column; topGlow = full across the curve-bent band, fading a handful of px
  // DOWN into the page (the soft lower lip). Added back additively at the end as a touch of bloom.
  float topGlow = 0.0;
  vec3 topCol = vec3(0.0);
  // The BOTTOM mirror (user 2026-06-11 · pairs with the inverse spectrum band under the
  // TaskBar): sample the bottom row and project it DOWN through the curve-bent band below the
  // content, with the same bloom treatment.
  float bottomGlow = 0.0;
  vec3 bottomCol = vec3(0.0);

  if(curved){
    uv = warp(uv, uCurve);
    // the curve bends the top AND bottom edges around. Instead of hard black edges there,
    // PROJECT the edge pixel lines — the Suite Colours bars — outward: clamp uv.y to the top
    // row above, to the bottom row below. Left / right keep the curve (black).
    if(uv.x<0.0||uv.x>1.0){ gl_FragColor=vec4(0.0,0.0,0.0,1.0); return; }
    float dPx = uv.y * uRes.y;            // px below the top row (<=0 in the bent band)
    uv.y = max(uv.y, 0.0);
    topCol = texture2D(uSource, vec2(uv.x, 0.0)).rgb;
    topGlow = 1.0 - smoothstep(0.0, 14.0, max(dPx, 0.0)); // full in the band, fades 14px into content
    float dPxB = (1.0 - uv.y) * uRes.y;   // px above the bottom row (<=0 in the bent band below)
    uv.y = min(uv.y, 1.0);
    bottomCol = texture2D(uSource, vec2(uv.x, 1.0)).rgb;
    bottomGlow = 1.0 - smoothstep(0.0, 14.0, max(dPxB, 0.0)); // full in the band, fades 14px up
    // vignette PRUNED (user 2026-06-08) · keep the curve boundary, drop the corner + radial
    // darkening (vig stays 1.0 → the col*=vig below is a no-op). Cleaner, brighter edges.
  }

  vec3 col = texture2D(uSource, uv).rgb;

  // MUXON : curvature <-> chromatic, Muxified (channel split driven by the warp's own field)
  if(uMode==13){
    vec2 disp = uv - preUv;
    float r2  = dot(preUv-0.5, preUv-0.5);
    vec2 sep  = (length(disp) > 1e-5 ? normalize(disp) : (uv-0.5)) * (uCurve * r2 * 0.63);
    float cr = texture2D(uSource, uv + sep).r;
    float cg = texture2D(uSource, uv).g;
    float cb = texture2D(uSource, uv - sep).b;
    // "there slightly, not noticeable" (user 2026-06-08): displacement ×0.6→×0.63 (+5%, a touch
    // wider) AND opacity 0.5→0.4 (another 10% down). col is still the clean texel here → mix the
    // split in at 40% so the fringe is present but faint.
    col = mix(col, vec3(cr, cg, cb), 0.4);
    // grid freq 0.7 (locked) · luminance recovery (Pewter D3/D4 critique): scan floor raised
    // 0.82+0.18 → 0.90+0.10 so the grid modulates brightness lightly instead of darkening.
    float scan = 0.90 + 0.10*sin(uv.y*uRes.y*3.14159*0.7);
    float mask = 0.90 + 0.10*sin(uv.x*uRes.x*3.14159*1.05);
    col *= scan*mask; col += col*0.20;
  }

  if(uMode==12 || uMode==11){
    float r0 = length(uv-0.5);
    vec2 dir = (uv-0.5);
    float amt = (uMode==11? 0.020 : 0.012) * r0;
    float cr = texture2D(uSource, uv + dir*amt).r;
    float cg = texture2D(uSource, uv).g;
    float cb = texture2D(uSource, uv - dir*amt).b;
    col = vec3(cr,cg,cb);
  }

  if(uMode==10 || uMode==1){
    float scan = 0.80 + 0.20*sin(uv.y*uRes.y*3.14159);
    float mask = 0.88 + 0.12*sin(uv.x*uRes.x*3.14159*1.5);
    col *= scan*mask; col += col*0.22;
  }
  if(uMode==11){
    float glare = smoothstep(0.6,0.0,length(uv-vec2(0.35,0.28)));
    col += glare*0.10;
  }
  else if(uMode==2){
    float c3 = mod(floor(uv.x*uRes.x),3.0);
    vec3 sp = vec3(c3==0.0?1.0:0.25, c3==1.0?1.0:0.25, c3==2.0?1.0:0.25);
    float gap = (mod(floor(uv.y*uRes.y),3.0)==0.0)?0.6:1.0;
    col *= sp*1.6*gap;
  }
  else if(uMode==3){
    float l=dot(col,vec3(0.299,0.587,0.114)); col=dmg(l);
    float dt=(mod(floor(uv.x*uRes.x*0.5),2.0)<1.0 && mod(floor(uv.y*uRes.y*0.5),2.0)<1.0)?0.9:1.0;
    col*=dt;
  }
  else if(uMode==4){ vec2 px=uv*uRes; col+=bayer4(px)*0.28; col=cga(col); }
  else if(uMode==5){
    float j=sin(uv.y*120.0+uTime*6.0)*0.0016 + (fract(sin(floor(uv.y*240.0)+uTime)*43758.5)-0.5)*0.0020;
    col=vec3(texture2D(uSource,uv+vec2(0.004+j,0.0)).r, texture2D(uSource,uv+vec2(j,0.0)).g, texture2D(uSource,uv+vec2(-0.004+j,0.0)).b);
    float n=fract(sin(dot(uv*uRes+uTime,vec2(12.9898,78.233)))*43758.5);
    col+=(n-0.5)*0.10; col*=0.82+0.18*sin(uv.y*uRes.y*3.14159);
  }
  else if(uMode==6){
    float l=dot(col,vec3(0.299,0.587,0.114));
    l=pow(l,0.7);
    vec3 tint=vec3(0.30,1.0,0.92);
    col=tint*l;
    col+=tint*smoothstep(0.55,1.0,l)*0.6;
  }
  else if(uMode==7){
    float l=dot(col,vec3(0.299,0.587,0.114));
    l=smoothstep(0.35,0.65,l);
    float grain=(fract(sin(dot(floor(uv*uRes),vec2(12.9,78.2)))*43758.5)-0.5)*0.06;
    vec3 paper=vec3(0.92,0.91,0.86);
    vec3 ink=vec3(0.10,0.10,0.12);
    col=mix(ink,paper,l)+grain;
  }

  // contrast +8% (user 2026-06-08) — the CRT effects wash the image out; push values off
  // mid-gray to restore punch. Skipped for uMode==0 ('off') so it is a TRUE raw pass-through.
  if(uMode != 0){ col = (col - 0.5) * 1.08 + 0.5; }
  // top-edge bloom · a touch of additive lift of the projected Suite Colours (user 2026-06-08).
  // Full across the bent band, fading down the soft lip → the colours read as light spilling
  // up/down rather than a painted stripe. 0.35 = "a touch"; raise for more glow.
  col += topCol * topGlow * 0.35;
  col += bottomCol * bottomGlow * 0.35;
  col *= vig;
  gl_FragColor = vec4(col,1.0);
}`;

export class ShaderWrap {
  private gl: WebGLRenderingContext;
  private prog!: WebGLProgram;
  private tex!: WebGLTexture;
  private mode: ShaderRenderMode = 'off';
  private startTime = 0;
  private raf: number | null = null;
  private source: TexImageSource | null = null;
  private rawFrame: { data: Uint8Array; width: number; height: number } | null = null;
  private rgbaScratch: Uint8Array | null = null;
  private dirty = false;
  private uRes!: WebGLUniformLocation | null;
  private uTime!: WebGLUniformLocation | null;
  private uMode!: WebGLUniformLocation | null;
  private uCurve!: WebGLUniformLocation | null;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) throw new Error('ShaderWrap: WebGL unavailable');
    this.gl = gl;
    this.initGL();
  }

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('[ShaderWrap] compile:', gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  private initGL(): void {
    const gl = this.gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, this.compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, this.compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.prog = prog;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.uRes = gl.getUniformLocation(prog, 'uRes');
    this.uTime = gl.getUniformLocation(prog, 'uTime');
    this.uMode = gl.getUniformLocation(prog, 'uMode');
    this.uCurve = gl.getUniformLocation(prog, 'uCurve');
  }

  setMode(mode: ShaderRenderMode): void {
    this.mode = mode;
  }

  /** Set the source frame to shade on the next draw (a canvas/image — the D5 SCP self-render). */
  setSource(source: TexImageSource): void {
    this.source = source;
    this.rawFrame = null;
    this.dirty = true;
  }

  /**
   * Bind a raw bitmap frame — the Electron offscreen `paint` NativeImage.getBitmap() (the
   * terminal target · D1). getBitmap() is BGRA premultiplied; the terminal surface is opaque
   * (alpha=255 throughout) so premultiply is a no-op, but R↔B must swap. Swizzle once into a
   * reused scratch buffer so the ported GLSL (which samples .rgb) stays VERBATIM. The deferred
   * shared-texture path delivers a real GPU texture and skips this copy entirely (the curry).
   */
  setRawFrame(data: Uint8Array, width: number, height: number): void {
    const n = width * height * 4;
    if (n <= 0 || data.length < n) return;
    if (!this.rgbaScratch || this.rgbaScratch.length !== n) {
      this.rgbaScratch = new Uint8Array(n);
    }
    const out = this.rgbaScratch;
    for (let i = 0; i < n; i += 4) {
      out[i] = data[i + 2];
      out[i + 1] = data[i + 1];
      out[i + 2] = data[i];
      out[i + 3] = data[i + 3];
    }
    this.rawFrame = { data: out, width, height };
    this.source = null;
    this.dirty = true;
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }

  /**
   * The analytic inverse of the Fitzgibbon barrel warp: a real screen pointer (px,py in
   * canvas-pixel space) → the true un-warped position the offscreen DOM lives at. Used by the
   * geometric tier (Muxon/CRT Curve/Fishbowl) to forward sendInputEvent to the right element.
   */
  inverseWarp(px: number, py: number): { x: number; y: number } {
    const amt = SHADER_GEO_CURVE[this.mode] ?? 0;
    const w = this.canvas.width || 1;
    const h = this.canvas.height || 1;
    let cx = (px / w) * 2 - 1;
    let cy = (py / h) * 2 - 1;
    const rd2 = cx * cx + cy * cy;
    const k = 1.0 / (1.0 - amt * rd2);
    cx *= k;
    cy *= k;
    return { x: (cx * 0.5 + 0.5) * w, y: (cy * 0.5 + 0.5) * h };
  }

  /**
   * SWRM · D2 · the FORWARD warp the fragment shader applies, ported verbatim from its GLSL
   * `warp()`: c = uv*2-1; c *= 1 + (|c|²-1)*amt; back to uv. The shader displays
   * `uSource @ warp(screen_uv)` for the fragment at `screen_uv` — so the offscreen DOM cell
   * UNDER a screen click is exactly `warp(click)`. Apply this to pointer coords for the geometric
   * tier so clicks/drag land on the right cell (crosshair parity). amt=0 (color tier) → identity.
   * [If parity is observed inverted in practice, swap the presenter to inverseWarp — one line.]
   */
  warpPoint(px: number, py: number): { x: number; y: number } {
    const amt = SHADER_GEO_CURVE[this.mode] ?? 0;
    if (amt === 0) return { x: px, y: py };
    const w = this.canvas.width || 1;
    const h = this.canvas.height || 1;
    let cx = (px / w) * 2 - 1;
    let cy = (py / h) * 2 - 1;
    const factor = 1 + (cx * cx + cy * cy - 1) * amt;
    cx *= factor;
    cy *= factor;
    return { x: (cx * 0.5 + 0.5) * w, y: (cy * 0.5 + 0.5) * h };
  }

  // C919 · THE FRAME GOVERNOR — default 24 (Like Animation). raf fires at display rate
  // (60/120Hz); draws are gated to the fps interval with drift correction (the remainder
  // subtraction keeps the cadence honest instead of accumulating skew). setFps live-swaps
  // via the 'scs:shaderFps' channel (the renderMode Watcher-Cascade-Pipe idiom).
  private fps = DEFAULT_SHADER_FPS;
  private lastFrameTime = 0;

  setFps(fps: number): void {
    const clamped = clampShaderFps(fps);
    if (clamped !== null) this.fps = clamped;
  }

  start(): void {
    if (this.raf !== null) return;
    this.startTime = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const interval = 1000 / this.fps;
      const elapsed = now - this.lastFrameTime;
      if (elapsed < interval) return;
      this.lastFrameTime = now - (elapsed % interval);
      this.draw();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  private draw(): void {
    const gl = this.gl;
    // 'off' must STILL draw — the terminal is offscreen, so the presenter is the only visible
    // surface; not drawing would freeze the last shaded frame. uMode=0 = a raw pass-through.
    if (!this.source && !this.rawFrame) return;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    // Re-upload only when a new source frame arrived (dirty); time-driven modes still redraw
    // every rAF from the retained texture (the dual-clock) so jitter/glow animate when idle.
    if (this.dirty) {
      try {
        if (this.rawFrame) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rawFrame.width, this.rawFrame.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.rawFrame.data);
        } else if (this.source) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source);
        }
      } catch (err) {
        console.error('[ShaderWrap] texImage2D:', err);
      }
      this.dirty = false;
    }
    gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uTime, (performance.now() - this.startTime) / 1000);
    gl.uniform1i(this.uMode, SHADER_MODE_UMODE[this.mode] ?? 0);
    gl.uniform1f(this.uCurve, SHADER_GEO_CURVE[this.mode] ?? 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
