/* 3D preview for the avatar studio. It has its own WebGL context and reuses the game's shader, R6 part sizes,
 * head mesh, face texture and the AvatarAssets renderer, so the preview matches the in-game avatar. */
(() => {'use strict';
const DEFAULT = Object.freeze({
  Head: [245/255, 205/255, 48/255, 1], Torso: [13/255, 105/255, 172/255, 1],
  'Left Arm': [245/255, 205/255, 48/255, 1], 'Right Arm': [245/255, 205/255, 48/255, 1],
  'Left Leg': [164/255, 189/255, 71/255, 1], 'Right Leg': [164/255, 189/255, 71/255, 1]
});
const UNIFORMS = ['uViewProjection', 'uScale', 'uModel', 'uColor', 'uFloor', 'uCamera', 'uFace', 'uStud', 'uUseFace', 'uAvatarOpacity'];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
  return shader;
}
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), m = new Float32Array(16);
  m[0] = f / aspect; m[5] = f; m[10] = (far + near) / (near - far); m[11] = -1; m[14] = 2 * far * near / (near - far);
  return m;
}
function lookAt(eye, center) {
  let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz); zx /= len; zy /= len; zz /= len;
  let xx = zz, xy = 0, xz = -zx; // cross(world up [0,1,0], camera z)
  len = Math.hypot(xx, xy, xz) || 1; xx /= len; xy /= len; xz /= len;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1
  ]);
}
function multiply(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function buffer(gl, target, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(target, b);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return b;
}
function texture(gl, unit, src, { repeat = false, fill = [128, 128, 128, 255], mip = false } = {}) {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(fill));
  const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const img = new Image();
  img.onload = () => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if (mip) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
  };
  img.src = src;
  gl.activeTexture(gl.TEXTURE0);
  return t;
}

function create(canvas) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) throw Error('WebGL is not available on this device.');
  const derivatives = !!gl.getExtension('OES_standard_derivatives');
  const highp = !!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision;
  const { vertexSource, fragmentSource } = window.DemoShaders(derivatives, highp);
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) || 'Shader linking failed');
  gl.useProgram(program);
  const loc = {};
  for (const n of UNIFORMS) loc[n] = gl.getUniformLocation(program, n);
  const pos = gl.getAttribLocation(program, 'aPosition'), normal = gl.getAttribLocation(program, 'aNormal'), uv = gl.getAttribLocation(program, 'aUV');
  gl.enableVertexAttribArray(pos);
  gl.enableVertexAttribArray(normal);
  gl.uniform1i(loc.uFace, 0);
  gl.uniform1i(loc.uStud, 1);

  const Block = window.WasmBlockGeometry, Parts = window.ArchivedR6Parts, Anim = window.ArchivedR6Animation;
  const verts = [];
  for (let side = 0; side < Block.faceCount; side++) {
    const c = Block.faceVertices([1, 1, 1], side), n = Block.facePlane([1, 1, 1], side).slice(0, 3);
    for (const p of [c[0], c[1], c[2], c[0], c[2], c[3]]) verts.push(...p, ...n);
  }
  const cube = buffer(gl, gl.ARRAY_BUFFER, new Float32Array(verts));
  const head = window.LinkedR6HeadMesh.geometry();
  const headVerts = buffer(gl, gl.ARRAY_BUFFER, head.vertices);
  const headUVs = buffer(gl, gl.ARRAY_BUFFER, head.uvs);
  const headIdx = buffer(gl, gl.ELEMENT_ARRAY_BUFFER, head.indices);
  const faceTex = texture(gl, 0, window.ArchivedR6Face.dataUri, { fill: [0, 0, 0, 0] });
  texture(gl, 1, window.RobloxStudTexture.dataUri, { repeat: true, mip: true });
  const renderer = window.AvatarAssets.create(gl, { pos, normal, uv, loc });

  const offset = window.RunningHeightAdapter.create(Parts.parts).target(0, 0);
  const pose = Anim.create(window.ArchivedR6AnimationData).step(0, 0);
  const modelYaw = Math.PI;

  function bindVerts(buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 24, 12);
  }
  function drawCube(scale, frame, color) {
    bindVerts(cube);
    gl.disableVertexAttribArray(uv);
    gl.vertexAttrib2f(uv, 0, 0);
    gl.uniform1f(loc.uUseFace, 0);
    gl.uniform3fv(loc.uScale, scale);
    gl.uniformMatrix4fv(loc.uModel, false, new Float32Array(frame));
    gl.uniform4fv(loc.uColor, color);
    gl.uniform1f(loc.uFloor, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
  function drawHead(frame, color, app = null) {
    bindVerts(headVerts);
    gl.bindBuffer(gl.ARRAY_BUFFER, headUVs);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 8, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.face?.(app) || faceTex);
    gl.uniform1f(loc.uUseFace, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, headIdx);
    gl.uniform3fv(loc.uScale, Parts.headMeshScale);
    gl.uniformMatrix4fv(loc.uModel, false, new Float32Array(frame));
    gl.uniform4fv(loc.uColor, color);
    gl.uniform1f(loc.uFloor, 0);
    gl.drawElements(gl.TRIANGLES, head.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  const state = { appearance: null, colors: DEFAULT, yaw: 0, pitch: 0.12, dist: 9 };
  let raf = 0, running = false;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function render() {
    resize();
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.09, 0.12, 0.17, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const root = Anim.yawFrame(0, offset, 0, modelYaw);
    const rigged = renderer.rigPose(state.appearance, pose, { phase: 'ground', move: 0, time: 0 });
    const F = Object.fromEntries(Object.entries(rigged).map(([n, m]) => [n, Anim.multiply(root, m)]));
    const torso = F.Torso, target = [torso[12], torso[13] + 0.4, torso[14]];
    const cp = Math.cos(state.pitch);
    const eye = [
      target[0] + Math.sin(state.yaw) * cp * state.dist,
      target[1] + Math.sin(state.pitch) * state.dist,
      target[2] + Math.cos(state.yaw) * cp * state.dist
    ];
    const vp = multiply(perspective(Math.PI / 3, canvas.width / canvas.height, 0.1, 800), lookAt(eye, target));
    window.Atmosphere?.update?.(performance.now() / 1000);
    window.Atmosphere?.apply?.(gl, program);
    gl.uniformMatrix4fv(loc.uViewProjection, false, vp);
    gl.uniform3fv(loc.uCamera, eye);
    gl.uniform1f(loc.uAvatarOpacity, 1);
    const app = state.appearance, c = state.colors;
    for (const name of ['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg']) {
      const size = Parts.parts[name].size, color = c[name] || DEFAULT[name];
      if (!renderer.part(app, name, F[name], color, size, F)) drawCube(size, F[name], color);
    }
    const headColor = c.Head || DEFAULT.Head;
    if (!renderer.part(app, 'Head', F.Head, headColor, [2, 1, 1], F)) drawHead(F.R15Head || F.Head, headColor, app);
    renderer.accessories(app, F.Head, F);
  }
  function loop() {
    if (!running) return;
    render();
    raf = requestAnimationFrame(loop);
  }

  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    state.yaw -= (e.clientX - drag.x) * 0.01;
    state.pitch = clamp(state.pitch + (e.clientY - drag.y) * 0.005, -0.5, 1.2);
    drag = { x: e.clientX, y: e.clientY };
  });
  const stopDrag = () => { drag = null; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    state.dist = clamp(state.dist * (e.deltaY > 0 ? 1.08 : 0.92), 4, 20);
  }, { passive: false });

  return {
    renderer,
    setState(next) { Object.assign(state, next); },
    setAppearance(app) { state.appearance = app || null; },
    setColors(c) { if (c) state.colors = c; },
    start() { if (running) return; running = true; loop(); },
    stop() { running = false; cancelAnimationFrame(raf); }
  };
}

window.AvatarViewer = Object.freeze({ create, DEFAULT_COLORS: DEFAULT });
})();
