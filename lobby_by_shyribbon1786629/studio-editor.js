/* Functional 3D World Studio editor (WebGL viewport, 3D gizmos, Explorer/Properties,
 * honest account/local persistence, live-world read import, and isolated Box3D playtest).
 * Note: This is an integrated 3D world editor for this project, not Roblox's proprietary Studio. */
(() => {
  'use strict';

  const STORE_V2 = 'lobby-studio-scene-v2';
  const STORE_LEGACY = 'lobby-studio-items';
  const THEME_KEY = 'lobby-studio-theme';
  const SHAPES = ['block', 'sphere', 'wedge', 'cylinder', 'spawn', 'floor'];
  const MATERIALS = ['plastic', 'smooth', 'neon', 'wood', 'slate'];
  const SNAP_STEPS = [1, 0.5, 0.25, 0];

  const icon = name => '<span class="rbx-icon" aria-hidden="true">' + name + '</span>';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const round3 = v => Math.round(Number(v) * 1000) / 1000;
  const deg2rad = d => (Number(d) || 0) * Math.PI / 180;
  const hexToRgb = hex => {
    const s = typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '4f95cf';
    const n = parseInt(s, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  // Row-major 3x3 rotation matrix R = Ry(ry) * Rx(rx) * Rz(rz), matching box3d-physics.mjs & demo-obstacles.js
  function mat3FromEuler(rxDeg = 0, ryDeg = 0, rzDeg = 0) {
    const rx = deg2rad(rxDeg), ry = deg2rad(ryDeg), rz = deg2rad(rzDeg);
    const cx = Math.cos(rx), sx = Math.sin(rx);
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const cz = Math.cos(rz), sz = Math.sin(rz);
    return [
      cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx,
      cx * sz,                 cx * cz,               -sx,
     -sy * cz + cy * sx * sz,  sy * sz + cy * sx * cz, cy * cx
    ];
  }

  function quatFromMat3(m) {
    const a = m[0], d = m[4], f = m[8], t = a + d + f;
    let x, y, z, w, s;
    if (t > 0) { s = Math.sqrt(t + 1) * 2; w = s / 4; x = (m[7] - m[5]) / s; y = (m[2] - m[6]) / s; z = (m[3] - m[1]) / s; }
    else if (a > d && a > f) { s = Math.sqrt(1 + a - d - f) * 2; w = (m[7] - m[5]) / s; x = s / 4; y = (m[1] + m[3]) / s; z = (m[2] + m[6]) / s; }
    else if (d > f) { s = Math.sqrt(1 + d - a - f) * 2; w = (m[2] - m[6]) / s; x = (m[1] + m[3]) / s; y = s / 4; z = (m[5] + m[7]) / s; }
    else { s = Math.sqrt(1 + f - a - d) * 2; w = (m[3] - m[1]) / s; x = (m[2] + m[6]) / s; y = (m[5] + m[7]) / s; z = s / 4; }
    return [x, y, z, w];
  }

  function mat3FromQuat(q) {
    const [x, y, z, w] = q;
    return [
      1 - 2 * (y * y + z * z), 2 * (x * y - w * z),     2 * (x * z + w * y),
      2 * (x * y + w * z),     1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
      2 * (x * z - w * y),     2 * (y * z + w * x),     1 - 2 * (x * x + y * y)
    ];
  }

  function colOfMat3(m, c) { return [m[c], m[3 + c], m[6 + c]]; }
  function mulMat3Vec(m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
    ];
  }
  function mulMat3TVec(m, v) {
    return [
      m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
      m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
      m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
    ];
  }

  function modelMat4(pos, m3, scale) {
    const [sx, sy, sz] = scale;
    return new Float32Array([
      m3[0] * sx, m3[3] * sx, m3[6] * sx, 0,
      m3[1] * sy, m3[4] * sy, m3[7] * sy, 0,
      m3[2] * sz, m3[5] * sz, m3[8] * sz, 0,
      pos[0],     pos[1],     pos[2],     1
    ]);
  }

  function perspectiveMat4(fovRad, aspect, near, far) {
    const f = 1 / Math.tan(fovRad / 2), nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  function lookAtMat4(eye, target, up = [0, 1, 0]) {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    let zn = Math.hypot(zx, zy, zz) || 1; zx /= zn; zy /= zn; zz /= zn;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    let xn = Math.hypot(xx, xy, xz) || 1; xx /= xn; xy /= xn; xz /= xn;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1
    ]);
  }

  function mulMat4(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] =
          a[0 * 4 + r] * b[c * 4 + 0] +
          a[1 * 4 + r] * b[c * 4 + 1] +
          a[2 * 4 + r] * b[c * 4 + 2] +
          a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }

  function invertMat4(m) {
    const inv = new Float32Array(16);
    inv[0] = m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
    inv[4] = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
    inv[8] = m[4]*m[9]*m[15] - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
    inv[12] = -m[4]*m[9]*m[14] + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
    inv[1] = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
    inv[5] = m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
    inv[9] = -m[0]*m[9]*m[15] + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
    inv[13] = m[0]*m[9]*m[14] - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
    inv[2] = m[1]*m[6]*m[15] - m[1]*m[7]*m[14] - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7] - m[13]*m[3]*m[6];
    inv[6] = -m[0]*m[6]*m[15] + m[0]*m[7]*m[14] + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7] + m[12]*m[3]*m[6];
    inv[10] = m[0]*m[5]*m[15] - m[0]*m[7]*m[13] - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7] - m[12]*m[3]*m[5];
    inv[14] = -m[0]*m[5]*m[14] + m[0]*m[6]*m[13] + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6] + m[12]*m[2]*m[5];
    inv[3] = -m[1]*m[6]*m[11] + m[1]*m[7]*m[10] + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7] + m[9]*m[3]*m[6];
    inv[7] = m[0]*m[6]*m[11] - m[0]*m[7]*m[10] - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7] - m[8]*m[3]*m[6];
    inv[11] = -m[0]*m[5]*m[11] + m[0]*m[7]*m[9] + m[4]*m[1]*m[11] - m[4]*m[3]*m[9] - m[8]*m[1]*m[7] + m[8]*m[3]*m[5];
    inv[15] = m[0]*m[5]*m[10] - m[0]*m[6]*m[9] - m[4]*m[1]*m[10] + m[4]*m[2]*m[9] + m[8]*m[1]*m[6] - m[8]*m[2]*m[5];
    let det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
    if (Math.abs(det) < 1e-12) return null;
    det = 1 / det;
    for (let i = 0; i < 16; i++) inv[i] *= det;
    return inv;
  }

  function unprojectRay(nx, ny, invVP) {
    const pNear = [
      invVP[0]*nx + invVP[4]*ny - invVP[8]  + invVP[12],
      invVP[1]*nx + invVP[5]*ny - invVP[9]  + invVP[13],
      invVP[2]*nx + invVP[6]*ny - invVP[10] + invVP[14],
      invVP[3]*nx + invVP[7]*ny - invVP[11] + invVP[15]
    ];
    const pFar = [
      invVP[0]*nx + invVP[4]*ny + invVP[8]  + invVP[12],
      invVP[1]*nx + invVP[5]*ny + invVP[9]  + invVP[13],
      invVP[2]*nx + invVP[6]*ny + invVP[10] + invVP[14],
      invVP[3]*nx + invVP[7]*ny + invVP[11] + invVP[15]
    ];
    const o = [pNear[0] / pNear[3], pNear[1] / pNear[3], pNear[2] / pNear[3]];
    const f = [pFar[0] / pFar[3], pFar[1] / pFar[3], pFar[2] / pFar[3]];
    let dx = f[0] - o[0], dy = f[1] - o[1], dz = f[2] - o[2];
    const n = Math.hypot(dx, dy, dz) || 1;
    return { origin: o, dir: [dx / n, dy / n, dz / n] };
  }

  // Closest parameters between ray (O + s*D) and line (P + u*A)
  function closestRayLine(O, D, P, A) {
    const w0 = [O[0] - P[0], O[1] - P[1], O[2] - P[2]];
    const a = D[0]*D[0] + D[1]*D[1] + D[2]*D[2];
    const b = D[0]*A[0] + D[1]*A[1] + D[2]*A[2];
    const c = A[0]*A[0] + A[1]*A[1] + A[2]*A[2];
    const d = D[0]*w0[0] + D[1]*w0[1] + D[2]*w0[2];
    const e = A[0]*w0[0] + A[1]*w0[1] + A[2]*w0[2];
    const denom = a * c - b * b;
    if (Math.abs(denom) < 1e-7) return { s: 0, u: e / (c || 1), dist: Infinity };
    const s = (b * e - c * d) / denom;
    const u = (a * e - b * d) / denom;
    const q1 = [O[0] + D[0]*s, O[1] + D[1]*s, O[2] + D[2]*s];
    const q2 = [P[0] + A[0]*u, P[1] + A[1]*u, P[2] + A[2]*u];
    return { s, u, dist: Math.hypot(q1[0]-q2[0], q1[1]-q2[1], q1[2]-q2[2]) };
  }

  function normalizeItem(raw, idx = 0) {
    if (!raw || typeof raw !== 'object') return null;
    const rawShape = String(raw.shape || raw.kind || 'block').toLowerCase();
    if (rawShape === 'mark') return null; // drop obsolete 2D SpawnMark pseudo-ellipse
    const shape = SHAPES.includes(rawShape) ? rawShape : 'block';
    const matRaw = String(raw.material || 'plastic').toLowerCase();
    const material = MATERIALS.includes(matRaw) ? matRaw : 'plastic';
    const w = clamp(Number.isFinite(Number(raw.w)) ? Number(raw.w) : (shape === 'floor' ? 128 : 4), 0.2, 1024);
    const h = clamp(Number.isFinite(Number(raw.h)) ? Number(raw.h) : (shape === 'floor' || shape === 'spawn' ? 1 : 4), 0.2, 1024);
    const d = clamp(Number.isFinite(Number(raw.d)) ? Number(raw.d) : (shape === 'floor' ? 128 : 4), 0.2, 1024);
    const defaultY = shape === 'floor' ? -h / 2 : h / 2;
    return {
      id: String(raw.id || ('part-' + (idx + 1))),
      name: String(raw.name || 'Part').slice(0, 48) || 'Part',
      shape,
      kind: shape,
      x: round3(Number.isFinite(Number(raw.x)) ? Number(raw.x) : 0),
      y: round3(Number.isFinite(Number(raw.y)) ? Number(raw.y) : defaultY),
      z: round3(Number.isFinite(Number(raw.z)) ? Number(raw.z) : 0),
      w: round3(w),
      h: round3(h),
      d: round3(d),
      rx: round3(Number.isFinite(Number(raw.rx)) ? Number(raw.rx) : 0),
      ry: round3(Number.isFinite(Number(raw.ry)) ? Number(raw.ry) : 0),
      rz: round3(Number.isFinite(Number(raw.rz)) ? Number(raw.rz) : 0),
      color: typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color.toLowerCase() : (shape === 'floor' ? '#636f82' : shape === 'spawn' ? '#dfe5ee' : '#4f95cf'),
      material,
      anchored: raw.anchored !== false,
      canCollide: raw.canCollide !== false
    };
  }

  function defaultScene() {
    return [
      normalizeItem({ id: 'baseplate', name: 'Baseplate', shape: 'floor', x: 0, y: -0.5, z: 0, w: 128, h: 1, d: 128, color: '#636f82', material: 'plastic', anchored: true, canCollide: true }),
      normalizeItem({ id: 'spawn', name: 'SpawnLocation', shape: 'spawn', x: 0, y: 0.5, z: 0, w: 8, h: 1, d: 8, color: '#dfe5ee', material: 'smooth', anchored: true, canCollide: true })
    ];
  }

  // Exact ray intersection against local-space Studio shapes
  function rayHitItem(ray, item) {
    const C = [item.x, item.y, item.z];
    const m = mat3FromEuler(item.rx, item.ry, item.rz);
    const rel = [ray.origin[0] - C[0], ray.origin[1] - C[1], ray.origin[2] - C[2]];
    const ro = mulMat3TVec(m, rel);
    const rd = mulMat3TVec(m, ray.dir);
    const hx = item.w / 2, hy = item.h / 2, hz = item.d / 2;

    if (item.shape === 'sphere') {
      const ox = ro[0] / hx, oy = ro[1] / hy, oz = ro[2] / hz;
      const dx = rd[0] / hx, dy = rd[1] / hy, dz = rd[2] / hz;
      const A = dx*dx + dy*dy + dz*dz;
      const B = 2 * (ox*dx + oy*dy + oz*dz);
      const K = ox*ox + oy*oy + oz*oz - 1;
      const disc = B*B - 4*A*K;
      if (disc < 0) return null;
      const sq = Math.sqrt(disc);
      let t = (-B - sq) / (2 * A);
      if (t < 0.01) t = (-B + sq) / (2 * A);
      if (t < 0.01) return null;
      const lp = [ro[0] + rd[0]*t, ro[1] + rd[1]*t, ro[2] + rd[2]*t];
      const ln = [lp[0]/(hx*hx), lp[1]/(hy*hy), lp[2]/(hz*hz)];
      const wn = mulMat3Vec(m, ln);
      const nn = Math.hypot(...wn) || 1;
      return { item, t, normal: wn.map(v => v / nn) };
    }

    // Bounding box slab test (used directly for block/spawn/floor, refined for wedge/cylinder)
    let tmin = -Infinity, tmax = Infinity, hitAxis = 1, hitSign = 1;
    const half = [hx, hy, hz];
    for (let i = 0; i < 3; i++) {
      if (Math.abs(rd[i]) < 1e-9) {
        if (Math.abs(ro[i]) > half[i]) return null;
      } else {
        let t1 = (-half[i] - ro[i]) / rd[i];
        let t2 = (half[i] - ro[i]) / rd[i];
        let s1 = -1;
        if (t1 > t2) { [t1, t2] = [t2, t1]; s1 = 1; }
        if (t1 > tmin) { tmin = t1; hitAxis = i; hitSign = s1; }
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return null;
      }
    }
    if (tmax < 0.01) return null;

    if (item.shape === 'wedge') {
      // Wedge occupies local y <= z * (hy / hz) inside [-hx..hx] x [-hy..hy] x [-hz..hz]
      // Plane equation: f(p) = hz * p.y - hy * p.z <= 0
      const f0 = hz * ro[1] - hy * ro[2];
      const df = hz * rd[1] - hy * rd[2];
      let lo = Math.max(0.01, tmin), hi = tmax, slopeHit = false;
      if (Math.abs(df) < 1e-9) {
        if (f0 > 0) return null;
      } else {
        const ts = -f0 / df;
        if (df > 0) hi = Math.min(hi, ts);
        else if (ts > lo) { lo = ts; slopeHit = true; }
      }
      if (lo > hi) return null;
      const ln = slopeHit ? [0, hz, -hy] : [hitAxis === 0 ? hitSign : 0, hitAxis === 1 ? hitSign : 0, hitAxis === 2 ? hitSign : 0];
      const wn = mulMat3Vec(m, ln);
      const nn = Math.hypot(...wn) || 1;
      return { item, t: lo, normal: wn.map(v => v / nn) };
    }

    if (item.shape === 'cylinder') {
      // Vertical cylinder (x/hx)^2 + (z/hz)^2 <= 1, y in [-hy, hy]
      let bestT = Infinity, bestN = [0, 1, 0];
      if (Math.abs(rd[1]) > 1e-9) {
        for (const sgn of [-1, 1]) {
          const tc = (sgn * hy - ro[1]) / rd[1];
          if (tc >= 0.01 && tc < bestT) {
            const px = (ro[0] + rd[0]*tc) / hx, pz = (ro[2] + rd[2]*tc) / hz;
            if (px*px + pz*pz <= 1) { bestT = tc; bestN = [0, sgn, 0]; }
          }
        }
      }
      const ox = ro[0] / hx, oz = ro[2] / hz, dx = rd[0] / hx, dz = rd[2] / hz;
      const A = dx*dx + dz*dz, B = 2*(ox*dx + oz*dz), K = ox*ox + oz*oz - 1;
      if (A > 1e-9) {
        const disc = B*B - 4*A*K;
        if (disc >= 0) {
          const sq = Math.sqrt(disc);
          for (const ts of [(-B - sq) / (2*A), (-B + sq) / (2*A)]) {
            if (ts >= 0.01 && ts < bestT) {
              const py = ro[1] + rd[1]*ts;
              if (Math.abs(py) <= hy) {
                const lx = ro[0] + rd[0]*ts, lz = ro[2] + rd[2]*ts;
                bestT = ts;
                bestN = [lx / (hx*hx), 0, lz / (hz*hz)];
              }
            }
          }
        }
      }
      if (!Number.isFinite(bestT)) return null;
      const wn = mulMat3Vec(m, bestN);
      const nn = Math.hypot(...wn) || 1;
      return { item, t: bestT, normal: wn.map(v => v / nn) };
    }

    const t = tmin >= 0.01 ? tmin : tmax;
    const ln = [hitAxis === 0 ? hitSign : 0, hitAxis === 1 ? hitSign : 0, hitAxis === 2 ? hitSign : 0];
    const wn = mulMat3Vec(m, ln);
    return { item, t, normal: wn };
  }

  // Procedural 3D Mesh Builders (interleaved pos[3], normal[3], uv[2] -> 8 floats/vertex)
  function buildBoxMesh() {
    const out = [];
    const faces = [
      { n: [0, 1, 0],  p: [[-0.5,0.5,-0.5], [-0.5,0.5,0.5], [0.5,0.5,0.5], [0.5,0.5,-0.5]] },
      { n: [0, -1, 0], p: [[-0.5,-0.5,0.5], [-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [0.5,-0.5,0.5]] },
      { n: [0, 0, 1],  p: [[-0.5,-0.5,0.5], [0.5,-0.5,0.5], [0.5,0.5,0.5], [-0.5,0.5,0.5]] },
      { n: [0, 0, -1], p: [[0.5,-0.5,-0.5], [-0.5,-0.5,-0.5], [-0.5,0.5,-0.5], [0.5,0.5,-0.5]] },
      { n: [1, 0, 0],  p: [[0.5,-0.5,0.5], [0.5,-0.5,-0.5], [0.5,0.5,-0.5], [0.5,0.5,0.5]] },
      { n: [-1, 0, 0], p: [[-0.5,-0.5,-0.5], [-0.5,-0.5,0.5], [-0.5,0.5,0.5], [-0.5,0.5,-0.5]] },
    ];
    const uvs = [[0,0],[0,1],[1,1],[1,0]];
    for (const f of faces) {
      for (const idx of [0, 1, 2, 0, 2, 3]) {
        out.push(...f.p[idx], ...f.n, ...uvs[idx]);
      }
    }
    return new Float32Array(out);
  }

  function buildWedgeMesh() {
    // Matches Box3D wedge hull: bottom [-0.5..0.5, -0.5, -0.5..0.5], back [+Z] rises to y=+0.5
    const out = [];
    const pushTri = (a, b, c, n, ua, ub, uc) => {
      out.push(...a, ...n, ...ua, ...b, ...n, ...ub, ...c, ...n, ...uc);
    };
    const pushQuad = (a, b, c, d, n) => {
      pushTri(a, b, c, n, [0,0], [1,0], [1,1]);
      pushTri(a, c, d, n, [0,0], [1,1], [0,1]);
    };
    const s = Math.SQRT1_2;
    // Sloped ramp (from z=-0.5,y=-0.5 up to z=+0.5,y=+0.5), normal [0, +s, -s]
    pushQuad([-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [0.5,0.5,0.5], [-0.5,0.5,0.5], [0, s, -s]);
    // Back face (+Z)
    pushQuad([0.5,-0.5,0.5], [-0.5,-0.5,0.5], [-0.5,0.5,0.5], [0.5,0.5,0.5], [0, 0, 1]);
    // Bottom face (-Y)
    pushQuad([-0.5,-0.5,0.5], [0.5,-0.5,0.5], [0.5,-0.5,-0.5], [-0.5,-0.5,-0.5], [0, -1, 0]);
    // Left (-X) & Right (+X) triangular side walls
    pushTri([-0.5,-0.5,-0.5], [-0.5,0.5,0.5], [-0.5,-0.5,0.5], [-1, 0, 0], [0,0], [1,1], [1,0]);
    pushTri([0.5,-0.5,0.5], [0.5,0.5,0.5], [0.5,-0.5,-0.5], [1, 0, 0], [0,0], [0,1], [1,0]);
    return new Float32Array(out);
  }

  function buildSphereMesh(latBands = 16, lonBands = 24) {
    const out = [];
    const pt = (j, i) => {
      const th = (j / latBands) * Math.PI, ph = (i / lonBands) * Math.PI * 2;
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.sin(ph);
      return { p: [nx * 0.5, ny * 0.5, nz * 0.5], n: [nx, ny, nz], u: [i / lonBands, j / latBands] };
    };
    for (let j = 0; j < latBands; j++) {
      for (let i = 0; i < lonBands; i++) {
        const a = pt(j, i), b = pt(j + 1, i), c = pt(j + 1, i + 1), d = pt(j, i + 1);
        for (const v of [a, b, c, a, c, d]) out.push(...v.p, ...v.n, ...v.u);
      }
    }
    return new Float32Array(out);
  }

  function buildCylinderMesh(segs = 24) {
    const out = [];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      // Side quad
      const p00 = [c0*0.5, -0.5, s0*0.5], p01 = [c0*0.5, 0.5, s0*0.5];
      const p10 = [c1*0.5, -0.5, s1*0.5], p11 = [c1*0.5, 0.5, s1*0.5];
      out.push(...p00, c0,0,s0, i/segs,0, ...p10, c1,0,s1, (i+1)/segs,0, ...p11, c1,0,s1, (i+1)/segs,1);
      out.push(...p00, c0,0,s0, i/segs,0, ...p11, c1,0,s1, (i+1)/segs,1, ...p01, c0,0,s0, i/segs,1);
      // Top cap (+Y)
      out.push(0,0.5,0, 0,1,0, 0.5,0.5, ...p11, 0,1,0, 0.5+c1*0.5,0.5+s1*0.5, ...p01, 0,1,0, 0.5+c0*0.5,0.5+s0*0.5);
      // Bottom cap (-Y)
      out.push(0,-0.5,0, 0,-1,0, 0.5,0.5, ...p00, 0,-1,0, 0.5+c0*0.5,0.5+s0*0.5, ...p10, 0,-1,0, 0.5+c1*0.5,0.5+s1*0.5);
    }
    return new Float32Array(out);
  }

  // DOM Construction
  const root = document.createElement('section');
  root.id = 'studio-editor';
  root.className = 'studio-editor';
  root.hidden = true;
  root.setAttribute('aria-label', '3D World Studio editor');
  root.innerHTML =
    '<header class="studio-titlebar">' +
      '<div class="studio-title-left">' +
        '<button class="studio-logo" data-close aria-label="Close Studio">' + icon('studio') + '</button>' +
        '<strong class="studio-place-title">Lobby.studio.json</strong>' +
        '<span class="studio-save-state">Saved in this browser only</span>' +
      '</div>' +
      '<nav class="studio-tabs"><button class="active" data-tab="home">Home</button><button data-tab="model">Model</button><button data-tab="test">Test</button><button data-tab="view">View</button></nav>' +
      '<div class="studio-title-actions">' +
        '<button class="studio-icon-btn" data-theme-toggle aria-label="Toggle Studio theme" title="Toggle theme">' + icon('moon-with-stars') + '</button>' +
        '<button class="studio-icon-btn" data-close aria-label="Close">' + icon('x') + '</button>' +
      '</div>' +
    '</header>' +
    '<div class="studio-ribbon"><div class="studio-ribbon-tools">' +
      '<button class="studio-tool active" data-tool="select" title="Select (1)">' + icon('cursor') + '<span>Select</span></button>' +
      '<button class="studio-tool" data-tool="move" title="Move along X/Y/Z (2)">' + icon('dual-arrows-large-horizontal') + '<span>Move</span></button>' +
      '<button class="studio-tool" data-tool="scale" title="Scale X/Y/Z (3)">' + icon('dual-arrows-to-corners') + '<span>Scale</span></button>' +
      '<button class="studio-tool" data-tool="rotate" title="Rotate X/Y/Z (4)">' + icon('arrow-spin-clockwise') + '<span>Rotate</span></button>' +
      '<i></i>' +
      '<button class="studio-tool studio-insert" title="Insert Block Part">' + icon('cube') + '<span>Part</span></button>' +
      '<button class="studio-tool" data-action="duplicate" title="Duplicate Selected (Ctrl+D)">' + icon('copy') + '<span>Duplicate</span></button>' +
      '<button class="studio-tool" data-action="delete" title="Delete Selected (Del)">' + icon('trash') + '<span>Delete</span></button>' +
      '<i></i>' +
      '<button class="studio-tool" data-action="play" title="Isolated 3D Playtest (F5)">' + icon('play-large') + '<span>Play</span></button>' +
      '<i></i>' +
      '<button class="studio-tool" data-action="undo" title="Undo (Ctrl+Z)">' + icon('arrow-curved-path-left') + '<span>Undo</span></button>' +
      '<button class="studio-tool" data-action="redo" title="Redo (Ctrl+Y)">' + icon('arrow-curved-path-right') + '<span>Redo</span></button>' +
      '<i></i>' +
      '<button class="studio-tool" data-action="import-world" title="Copy current live GridWorld blocks into Studio">' + icon('download') + '<span>Import World</span></button>' +
      '<button class="studio-tool" data-action="export" title="Download .studio.json">' + icon('save') + '<span>Export</span></button>' +
    '</div></div>' +
    '<div class="studio-workarea">' +
      '<aside class="studio-toolbox">' +
        '<header><strong>Toolbox</strong><span>3D Parts</span></header>' +
        '<div class="studio-toolbox-tabs"><button class="active">Parts</button><button data-action="import-json">Load JSON</button></div>' +
        '<label class="studio-search">⌕ <input placeholder="Search 3D shapes" aria-label="Search models"></label>' +
        '<div class="studio-models">' +
          '<button data-add="Block"><span class="studio-model-swatch block"></span><b>Block</b></button>' +
          '<button data-add="Sphere"><span class="studio-model-swatch sphere"></span><b>Sphere</b></button>' +
          '<button data-add="Wedge"><span class="studio-model-swatch wedge"></span><b>Wedge</b></button>' +
          '<button data-add="Cylinder"><span class="studio-model-swatch cylinder"></span><b>Cylinder</b></button>' +
          '<button data-add="SpawnLocation"><span class="studio-model-swatch spawn"></span><b>Spawn</b></button>' +
        '</div>' +
        '<input type="file" accept=".json,application/json" class="studio-json-file" hidden>' +
      '</aside>' +
      '<main class="studio-viewport">' +
        '<div class="studio-viewport-bar">' +
          '<button type="button">3D Viewport</button>' +
          '<span class="studio-freecam-label">FREECAM 3D · Right-drag + WASD/EQ</span>' +
          '<button class="studio-reset-camera" type="button">Reset view</button>' +
        '</div>' +
        '<div class="studio-conflict-bar" hidden>' +
          '<span class="studio-conflict-msg">Local draft differs from account save.</span>' +
          '<button type="button" data-conflict-action="use-account">Use Account Save</button>' +
          '<button type="button" data-conflict-action="overwrite">Overwrite Account</button>' +
        '</div>' +
        '<canvas class="studio-scene" aria-label="3D WebGL viewport"></canvas>' +
        '<div class="studio-touch-controls" aria-label="Touch play controls">' +
          '<div class="studio-touch-stick" role="application" aria-label="Movement joystick"><span class="studio-touch-stick-base"></span><span class="studio-touch-stick-knob"></span></div>' +
          '<button type="button" class="studio-touch-jump" aria-label="Jump">Jump</button>' +
        '</div>' +
        '<div class="studio-hint">Click part to select · Drag handles to transform · Right-drag + WASD to fly</div>' +
        '<div class="studio-status">' +
          '<span>⌖</span> <span class="studio-status-pos">0, 0, 0</span>' +
          '<span class="studio-part-count">2 parts</span>' +
          '<button type="button" class="studio-snap-btn" title="Cycle grid snap">Snap: 1 stud</button>' +
        '</div>' +
      '</main>' +
      '<aside class="studio-right">' +
        '<section class="studio-explorer">' +
          '<header><strong>Explorer</strong><span>Workspace</span></header>' +
          '<label class="studio-explorer-search"><span>⌕</span><input placeholder="Filter workspace" aria-label="Filter Explorer"></label>' +
          '<div class="studio-tree" role="tree"></div>' +
        '</section>' +
        '<section class="studio-properties">' +
          '<header><strong>Properties</strong><span>3D Transform</span></header>' +
          '<div class="studio-props-content"></div>' +
        '</section>' +
      '</aside>' +
    '</div>';

  try { root.classList.toggle('theme-dark', localStorage.getItem(THEME_KEY) === 'dark'); } catch {}
  document.body.append(root);
  root.querySelector('[data-theme-toggle] .rbx-icon').textContent = root.classList.contains('theme-dark') ? 'sun' : 'moon-with-stars';

  const canvas = root.querySelector('canvas.studio-scene');
  const tree = root.querySelector('.studio-tree');
  const props = root.querySelector('.studio-props-content');
  const saveStateEl = root.querySelector('.studio-save-state');
  const conflictBarEl = root.querySelector('.studio-conflict-bar');
  const conflictMsgEl = root.querySelector('.studio-conflict-msg');
  const statusPosEl = root.querySelector('.studio-status-pos');
  const partCountEl = root.querySelector('.studio-part-count');
  const snapBtn = root.querySelector('.studio-snap-btn');
  const modeLabelEl = root.querySelector('.studio-freecam-label');
  const hintEl = root.querySelector('.studio-hint');
  const playBtn = root.querySelector('[data-action="play"]');
  const fileInput = root.querySelector('.studio-json-file');

  // WebGL 3D Context Setup
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false, stencil: false, preserveDrawingBuffer: true });
  let glProg = null, lineProg = null, meshes = null, lineBuf = null;

  function compileShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || 'Shader compile error');
    }
    return sh;
  }

  function createProgram(vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || 'Program link error');
    }
    return p;
  }

  function initWebGL() {
    if (!gl) return;
    const vs = `
      attribute vec3 aPos;
      attribute vec3 aNormal;
      attribute vec2 aUV;
      uniform mat4 uVP;
      uniform mat4 uModel;
      uniform mat3 uNormalMat;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUV;
      void main() {
        vec4 wp = uModel * vec4(aPos, 1.0);
        vWorldPos = wp.xyz;
        vNormal = normalize(uNormalMat * aNormal);
        vUV = aUV;
        gl_Position = uVP * wp;
      }
    `;
    const fs = `
      precision mediump float;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUV;
      uniform vec3 uColor;
      uniform vec3 uEye;
      uniform float uMaterial; // 0=plastic, 1=smooth, 2=neon, 3=wood, 4=slate
      uniform float uIsFloor;
      uniform float uIsSpawn;
      uniform float uSelected;
      void main() {
        vec3 N = normalize(vNormal);
        if (uMaterial > 1.5 && uMaterial < 2.5) {
          vec3 glow = mix(uColor * 1.25, vec3(1.0), 0.25);
          gl_FragColor = vec4(clamp(glow, 0.0, 1.0), 1.0);
          return;
        }
        vec3 base = uColor;
        // Crisp 4-stud & 1-stud grid lines on Baseplate / Plastic top surfaces
        if (uIsFloor > 0.5 && N.y > 0.8) {
          vec2 g1 = abs(fract(vWorldPos.xz - 0.5) - 0.5) / 0.045;
          vec2 g4 = abs(fract(vWorldPos.xz * 0.25 - 0.5) - 0.5) / 0.022;
          float line1 = 1.0 - min(min(g1.x, g1.y), 1.0);
          float line4 = 1.0 - min(min(g4.x, g4.y), 1.0);
          base = mix(base, base * 0.82, line1 * 0.45);
          base = mix(base, vec3(0.86, 0.90, 0.96), line4 * 0.35);
        } else if (uIsSpawn > 0.5 && N.y > 0.8) {
          vec2 c = vUV - vec2(0.5);
          float r = length(c);
          if (r > 0.27 && r < 0.36) base = vec3(0.18, 0.23, 0.32);
          else if (r < 0.22 && (abs(c.x) < 0.045 || abs(c.y) < 0.045)) base = vec3(0.95, 0.76, 0.18);
        } else if (uMaterial > 2.5 && uMaterial < 3.5) {
          float grain = sin((vWorldPos.x + vWorldPos.z) * 6.0 + sin(vWorldPos.y * 4.0)) * 0.06;
          base += grain;
        }
        vec3 L = normalize(vec3(0.52, 0.80, 0.30));
        float ndl = max(dot(N, L), 0.0);
        float hemi = 0.5 + 0.5 * N.y;
        vec3 amb = mix(vec3(0.24, 0.27, 0.33), vec3(0.56, 0.62, 0.72), hemi);
        vec3 V = normalize(uEye - vWorldPos);
        vec3 H = normalize(L + V);
        float specPow = uMaterial > 0.5 && uMaterial < 1.5 ? 48.0 : 20.0;
        float specAmt = uMaterial > 0.5 && uMaterial < 1.5 ? 0.28 : 0.10;
        float spec = pow(max(dot(N, H), 0.0), specPow) * specAmt * step(0.01, ndl);
        vec3 lit = base * (amb + ndl * 0.68) + vec3(spec);
        if (uSelected > 0.5) lit = mix(lit, vec3(0.20, 0.68, 1.0), 0.16);
        gl_FragColor = vec4(clamp(lit, 0.0, 1.0), 1.0);
      }
    `;
    const lvs = `
      attribute vec3 aPos;
      attribute vec4 aCol;
      uniform mat4 uVP;
      varying vec4 vCol;
      void main() { vCol = aCol; gl_Position = uVP * vec4(aPos, 1.0); }
    `;
    const lfs = `
      precision mediump float;
      varying vec4 vCol;
      void main() { gl_FragColor = vCol; }
    `;

    const p = createProgram(vs, fs);
    glProg = {
      prog: p,
      aPos: gl.getAttribLocation(p, 'aPos'),
      aNormal: gl.getAttribLocation(p, 'aNormal'),
      aUV: gl.getAttribLocation(p, 'aUV'),
      uVP: gl.getUniformLocation(p, 'uVP'),
      uModel: gl.getUniformLocation(p, 'uModel'),
      uNormalMat: gl.getUniformLocation(p, 'uNormalMat'),
      uColor: gl.getUniformLocation(p, 'uColor'),
      uEye: gl.getUniformLocation(p, 'uEye'),
      uMaterial: gl.getUniformLocation(p, 'uMaterial'),
      uIsFloor: gl.getUniformLocation(p, 'uIsFloor'),
      uIsSpawn: gl.getUniformLocation(p, 'uIsSpawn'),
      uSelected: gl.getUniformLocation(p, 'uSelected')
    };

    const lp = createProgram(lvs, lfs);
    lineProg = {
      prog: lp,
      aPos: gl.getAttribLocation(lp, 'aPos'),
      aCol: gl.getAttribLocation(lp, 'aCol'),
      uVP: gl.getUniformLocation(lp, 'uVP')
    };

    const makeVBO = data => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return { buf: b, count: data.length / 8 };
    };
    const box = makeVBO(buildBoxMesh());
    meshes = {
      block: box,
      floor: box,
      spawn: box,
      wedge: makeVBO(buildWedgeMesh()),
      sphere: makeVBO(buildSphereMesh(16, 24)),
      cylinder: makeVBO(buildCylinderMesh(24))
    };
    lineBuf = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  }

  try { initWebGL(); } catch (e) { console.error('Studio WebGL init:', e); }

  // Editor State
  let items = defaultScene();
  let placeName = 'Lobby.studio.json';
  let selected = null;
  let tool = 'select';
  let snapIndex = 0; // 1 stud default
  let undoStack = [], redoStack = [];
  let saveTimer = 0;
  let lastCloudOk = false;

  // 3D Freecam State
  const cam = { eye: [0, 14, 26], yaw: 0, pitch: -0.42 };
  const heldKeys = new Set();
  const touchMove = { side: 0, forward: 0 };
  let touchJump = false;
  let drag = null;
  let lastVP = null, lastInvVP = null;
  let rafId = 0, lastFrameTs = 0;

  // Isolated Box3D Playtest State
  let playtesting = false;
  let playStarting = false;
  let prePlaySnapshot = null;
  let prePlaySelectedId = null;
  let prePlayCam = null;
  let playPhysics = null;
  let playDynamicParts = [];
  let playPlayer = null;
  let playCam = { yaw: 0, pitch: 0.30, dist: 13 };
  let playAnimTime = 0;

  function snapVal(v) {
    const s = SNAP_STEPS[snapIndex];
    return s > 0 ? Math.round(v / s) * s : v;
  }

  function camForward() {
    const cp = Math.cos(cam.pitch);
    return [-Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), -Math.cos(cam.yaw) * cp];
  }

  function resetCamera() {
    cam.eye = [0, 14, 26];
    cam.yaw = 0;
    cam.pitch = -0.42;
    renderFrame();
  }

  function focusSelected() {
    if (!selected) return;
    const dist = Math.max(8, Math.hypot(selected.w, selected.h, selected.d) * 1.35);
    const f = camForward();
    cam.eye = [selected.x - f[0] * dist, selected.y - f[1] * dist, selected.z - f[2] * dist];
    renderFrame();
  }

  // Persistence: identity-scoped localStorage + single-flight CAS /api/studio-place with honest status
  let activeAccountId = null; // null = anonymous, string = authenticated user_id
  let accountAuthenticated = false;
  let authResolved = false;
  let knownCloudUpdatedAt = null;
  let conflictCloudPlace = null;
  let editEpoch = 0;
  let saveSeq = 0;
  let saveChain = Promise.resolve({ saved: false, reason: 'idle' });

  function storageKeyFor(accountId) {
    return accountId ? (STORE_V2 + ':user:' + accountId) : (STORE_V2 + ':anon');
  }

  function canonicalItemsJson(arr) {
    const clean = (arr || []).map((o, i) => normalizeItem(o, i)).filter(Boolean);
    return JSON.stringify(clean.map(o => ({
      id: o.id, name: o.name, shape: o.shape,
      x: o.x, y: o.y, z: o.z, w: o.w, h: o.h, d: o.d,
      rx: o.rx, ry: o.ry, rz: o.rz,
      color: o.color, material: o.material,
      anchored: o.anchored, canCollide: o.canCollide
    })));
  }

  function readLocalRecord(accountId) {
    const key = storageKeyFor(accountId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length) {
          const clean = parsed.items.map((o, i) => normalizeItem(o, i)).filter(Boolean);
          if (clean.length) {
            return {
              name: typeof parsed.name === 'string' && parsed.name ? parsed.name : placeName,
              items: clean,
              baseUpdatedAt: Number.isFinite(parsed.baseUpdatedAt) ? Number(parsed.baseUpdatedAt) : null,
              updatedAt: Number(parsed.updatedAt) || 0,
              dirty: parsed.dirty !== false,
              scoped: true
            };
          }
        }
      }
      // Anonymous-only fallback to legacy unscoped keys (never cross-imported into signed-in accounts)
      if (!accountId) {
        const v2 = JSON.parse(localStorage.getItem(STORE_V2) || 'null');
        if (v2 && Array.isArray(v2.items) && v2.items.length) {
          const clean = v2.items.map((o, i) => normalizeItem(o, i)).filter(Boolean);
          if (clean.length) return { name: v2.name || placeName, items: clean, baseUpdatedAt: null, updatedAt: Number(v2.updatedAt) || 0, dirty: true, scoped: false };
        }
        const leg = JSON.parse(localStorage.getItem(STORE_LEGACY) || 'null');
        if (Array.isArray(leg) && leg.length) {
          const clean = leg.map((o, i) => normalizeItem(o, i)).filter(Boolean);
          if (clean.length) return { name: placeName, items: clean, baseUpdatedAt: null, updatedAt: 0, dirty: true, scoped: false };
        }
      }
    } catch {}
    return null;
  }

  function persistLocalSnapshot(accountId = activeAccountId, cleanCloudSync = false) {
    try {
      const clean = items.map((o, i) => normalizeItem(o, i)).filter(Boolean);
      const record = {
        name: placeName,
        items: clean,
        accountId: accountId || null,
        baseUpdatedAt: knownCloudUpdatedAt,
        dirty: !cleanCloudSync,
        updatedAt: Date.now()
      };
      localStorage.setItem(storageKeyFor(accountId), JSON.stringify(record));
      return true;
    } catch {
      return false;
    }
  }

  function updateConflictBar(customMessage) {
    if (!conflictBarEl) return;
    if (!conflictCloudPlace) {
      conflictBarEl.hidden = true;
      return;
    }
    if (conflictMsgEl) {
      conflictMsgEl.textContent = customMessage || 'Local draft differs from your saved account place.';
    }
    conflictBarEl.hidden = false;
  }

  async function runSave(reqSeq, opts = {}) {
    if (playtesting) return { saved: false, reason: 'playtesting' };
    const forceOverwrite = opts.forceOverwrite === true;
    // Coalesce burst saves: if a newer save request is already queued behind us (and we aren't force-overwriting), let the latest one send the final state
    if (!forceOverwrite && reqSeq < saveSeq) {
      const localOk = persistLocalSnapshot(activeAccountId);
      return { saved: localOk, target: localOk ? 'coalesced' : 'none', coalesced: true };
    }
    if (conflictCloudPlace && !forceOverwrite) {
      const localOk = persistLocalSnapshot(activeAccountId);
      lastCloudOk = false;
      saveStateEl.textContent = localOk
        ? 'Conflict: choose Use Account Save or Overwrite'
        : 'Conflict (and browser storage unavailable)';
      updateConflictBar();
      return { saved: false, target: localOk ? 'local' : 'none', conflict: true };
    }

    const snapshotName = placeName;
    const snapshotItems = items.map((o, i) => normalizeItem(o, i)).filter(Boolean);
    const localPreOk = persistLocalSnapshot(activeAccountId);

    try {
      const payload = {
        name: snapshotName,
        items: snapshotItems,
        ifMatchUpdatedAt: knownCloudUpdatedAt
      };
      if (forceOverwrite) payload.forceOverwrite = true;
      const r = await fetch('/api/studio-place', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (r.status === 409) {
        const j = await r.json().catch(() => null);
        if (j?.userId) { activeAccountId = String(j.userId); accountAuthenticated = true; }
        if (j?.place && Array.isArray(j.place.items)) {
          conflictCloudPlace = {
            name: j.place.name || placeName,
            items: j.place.items.map((o, i) => normalizeItem(o, i)).filter(Boolean),
            updatedAt: Number(j.place.updatedAt) || 0
          };
          knownCloudUpdatedAt = conflictCloudPlace.updatedAt;
        } else {
          conflictCloudPlace = { name: 'My Place', items: defaultScene(), updatedAt: null, deleted: true };
          knownCloudUpdatedAt = null;
        }
        const localOk = persistLocalSnapshot(activeAccountId);
        lastCloudOk = false;
        saveStateEl.textContent = localOk
          ? 'Conflict: account save changed elsewhere'
          : 'Conflict (and browser storage unavailable)';
        updateConflictBar('Account save changed in another session. Choose which version to keep.');
        return { saved: false, target: localOk ? 'local' : 'none', conflict: true };
      }
      if (r.ok) {
        const j = await r.json().catch(() => null);
        if (j?.userId) { activeAccountId = String(j.userId); accountAuthenticated = true; }
        if (Number.isFinite(j?.place?.updatedAt)) {
          knownCloudUpdatedAt = Number(j.place.updatedAt);
        }
        conflictCloudPlace = null;
        updateConflictBar();
        persistLocalSnapshot(activeAccountId, true);
        lastCloudOk = true;
        saveStateEl.textContent = 'Saved to account';
        return { saved: true, target: 'account', updatedAt: knownCloudUpdatedAt };
      }
    } catch {}

    lastCloudOk = false;
    const localOk = localPreOk || persistLocalSnapshot(activeAccountId, false);
    if (localOk) {
      saveStateEl.textContent = 'Saved in this browser only';
      return { saved: true, target: 'local' };
    }
    saveStateEl.textContent = 'Unsaved (storage unavailable)';
    return { saved: false, target: 'none', error: 'storage-unavailable' };
  }

  function saveNow(opts = {}) {
    if (playtesting) return Promise.resolve({ saved: false, reason: 'playtesting' });
    clearTimeout(saveTimer);
    saveTimer = 0;
    const reqSeq = ++saveSeq;
    saveChain = saveChain.then(() => runSave(reqSeq, opts), () => runSave(reqSeq, opts));
    return saveChain;
  }

  function acceptAccountSave() {
    if (!conflictCloudPlace || playtesting) return false;
    const before = JSON.stringify(items);
    items = conflictCloudPlace.items.map((o, i) => normalizeItem(o, i)).filter(Boolean);
    if (conflictCloudPlace.name) {
      placeName = conflictCloudPlace.name;
      root.querySelector('.studio-place-title').textContent = placeName;
    }
    knownCloudUpdatedAt = conflictCloudPlace.updatedAt;
    conflictCloudPlace = null;
    selected = null;
    lastCloudOk = true;
    editEpoch++;
    undoStack.push(before);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
    persistLocalSnapshot(activeAccountId, true);
    updateConflictBar();
    saveStateEl.textContent = 'Saved to account';
    redrawTree(); drawProps(); renderFrame();
    return true;
  }

  function overwriteAccountWithLocal() {
    if (playtesting) return Promise.resolve({ saved: false, reason: 'playtesting' });
    return saveNow({ forceOverwrite: true });
  }

  conflictBarEl?.addEventListener('click', e => {
    const btn = e.target.closest('[data-conflict-action]');
    if (!btn) return;
    if (btn.dataset.conflictAction === 'use-account') acceptAccountSave();
    else if (btn.dataset.conflictAction === 'overwrite') overwriteAccountWithLocal();
  });

  function scheduleSave() {
    if (playtesting) return;
    editEpoch++;
    const localOk = persistLocalSnapshot(activeAccountId);
    if (conflictCloudPlace) {
      lastCloudOk = false;
      saveStateEl.textContent = localOk
        ? 'Conflict: choose Use Account Save or Overwrite'
        : 'Conflict (and browser storage unavailable)';
      updateConflictBar();
      return;
    }
    saveStateEl.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveNow(); }, 350);
  }

  async function loadInitialScene() {
    const startEpoch = editEpoch;
    // Pre-hydrate anonymous draft only while identity is unresolved
    const anonDraft = readLocalRecord(null);
    if (anonDraft && editEpoch === startEpoch) {
      items = anonDraft.items;
      placeName = anonDraft.name;
      root.querySelector('.studio-place-title').textContent = placeName;
      redrawTree(); drawProps(); renderFrame();
    }

    try {
      const r = await fetch('/api/studio-place');
      if (r.ok) {
        const j = await r.json();
        accountAuthenticated = !!j?.authenticated;
        activeAccountId = accountAuthenticated ? String(j?.userId || window.__WEBSIM_USER_ID || 'authenticated-default') : null;
        authResolved = true;

        const cloudItems = Array.isArray(j?.place?.items)
          ? j.place.items.map((o, i) => normalizeItem(o, i)).filter(Boolean)
          : [];
        const cloud = cloudItems.length ? {
          name: j.place.name || 'Lobby.studio.json',
          items: cloudItems,
          updatedAt: Number(j.place.updatedAt) || 0
        } : null;

        // FENCE: If user edited in-session while initial GET was pending, NEVER overwrite their edits!
        if (editEpoch !== startEpoch) {
          if (cloud) {
            if (knownCloudUpdatedAt !== null && knownCloudUpdatedAt >= cloud.updatedAt) {
              return;
            }
            if (canonicalItemsJson(items) !== canonicalItemsJson(cloud.items)) {
              knownCloudUpdatedAt = cloud.updatedAt;
              conflictCloudPlace = cloud;
              lastCloudOk = false;
              const localOk = persistLocalSnapshot(activeAccountId);
              saveStateEl.textContent = localOk
                ? 'Conflict: unsaved edits vs account save'
                : 'Conflict (and browser storage unavailable)';
              updateConflictBar('Your in-session edits conflict with an existing account save.');
            } else {
              knownCloudUpdatedAt = cloud.updatedAt;
              conflictCloudPlace = null;
              lastCloudOk = true;
              persistLocalSnapshot(activeAccountId, true);
              saveStateEl.textContent = 'Saved to account';
            }
          } else {
            knownCloudUpdatedAt = null;
            conflictCloudPlace = null;
            persistLocalSnapshot(activeAccountId, false);
          }
          return;
        }

        if (accountAuthenticated) {
          const userLocal = readLocalRecord(activeAccountId);
          if (userLocal && cloud) {
            const sameItems = canonicalItemsJson(userLocal.items) === canonicalItemsJson(cloud.items);
            const sameName = (userLocal.name || '') === (cloud.name || '');
            const localIsStaleCopy = userLocal.dirty === false && userLocal.baseUpdatedAt !== null && userLocal.baseUpdatedAt < cloud.updatedAt;
            if ((sameItems && sameName) || localIsStaleCopy) {
              items = cloud.items;
              placeName = cloud.name;
              knownCloudUpdatedAt = cloud.updatedAt;
              conflictCloudPlace = null;
              lastCloudOk = true;
              persistLocalSnapshot(activeAccountId, true);
              updateConflictBar();
              saveStateEl.textContent = 'Saved to account';
            } else {
              // Divergent local draft for this same account: keep both safe, do NOT claim Saved to account, do NOT auto-overwrite
              items = userLocal.items;
              placeName = userLocal.name;
              knownCloudUpdatedAt = cloud.updatedAt;
              conflictCloudPlace = cloud;
              lastCloudOk = false;
              updateConflictBar('Local browser draft differs from your saved account place.');
              saveStateEl.textContent = 'Conflict: local draft differs from account save';
            }
          } else if (cloud) {
            // Account save exists (ignore any unscoped/anonymous local draft so another user's or stale anonymous data never overwrites account!)
            items = cloud.items;
            placeName = cloud.name;
            knownCloudUpdatedAt = cloud.updatedAt;
            conflictCloudPlace = null;
            lastCloudOk = true;
            persistLocalSnapshot(activeAccountId, true);
            updateConflictBar();
            saveStateEl.textContent = 'Saved to account';
          } else if (userLocal) {
            items = userLocal.items;
            placeName = userLocal.name;
            knownCloudUpdatedAt = null;
            conflictCloudPlace = null;
            lastCloudOk = false;
            updateConflictBar();
            saveStateEl.textContent = 'Local draft (not yet saved to account)';
          } else {
            // Signed-in user with neither account save nor user-scoped local draft: start clean (never inherit anonymous draft)
            items = defaultScene();
            placeName = 'Lobby.studio.json';
            knownCloudUpdatedAt = null;
            conflictCloudPlace = null;
            lastCloudOk = false;
            updateConflictBar();
            saveStateEl.textContent = 'Unsaved new place';
          }
          selected = null;
          root.querySelector('.studio-place-title').textContent = placeName;
          redrawTree(); drawProps(); renderFrame();
          return;
        }

        // Unauthenticated / anonymous
        knownCloudUpdatedAt = null;
        conflictCloudPlace = null;
        lastCloudOk = false;
        updateConflictBar();
        if (anonDraft) {
          const ok = persistLocalSnapshot(null);
          saveStateEl.textContent = ok ? 'Saved in this browser only' : 'Unsaved (storage unavailable)';
        } else {
          const ok = persistLocalSnapshot(null);
          saveStateEl.textContent = ok ? 'Saved in this browser only' : 'Unsaved (storage unavailable)';
        }
        root.querySelector('.studio-place-title').textContent = placeName;
        redrawTree(); drawProps(); renderFrame();
        return;
      }
    } catch {}

    authResolved = true;
    if (editEpoch === startEpoch) {
      const ok = persistLocalSnapshot(activeAccountId);
      saveStateEl.textContent = ok ? 'Saved in this browser only' : 'Unsaved (storage unavailable)';
      root.querySelector('.studio-place-title').textContent = placeName;
      redrawTree(); drawProps(); renderFrame();
    }
  }

  loadInitialScene();

  function remember(beforeJson) {
    const nowJson = JSON.stringify(items);
    if (beforeJson === nowJson) return;
    editEpoch++;
    undoStack.push(beforeJson);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
  }

  function history(isRedo) {
    if (playtesting) return;
    const source = isRedo ? redoStack : undoStack;
    const target = isRedo ? undoStack : redoStack;
    if (!source.length) {
      saveStateEl.textContent = isRedo ? 'Nothing to redo' : 'Nothing to undo';
      return;
    }
    target.push(JSON.stringify(items));
    items = JSON.parse(source.pop()).map((o, i) => normalizeItem(o, i)).filter(Boolean);
    selected = selected ? items.find(o => o.id === selected.id) || null : null;
    redrawTree(); drawProps(); renderFrame(); scheduleSave();
  }

  // UI Sync: Explorer & Properties
  function updateStatusFooter() {
    partCountEl.textContent = items.length + ' part' + (items.length === 1 ? '' : 's');
    if (playtesting && playPlayer) {
      statusPosEl.textContent = [round3(playPlayer.x), round3(playPlayer.y), round3(playPlayer.z)].join(', ');
    } else if (selected) {
      statusPosEl.textContent = [round3(selected.x), round3(selected.y), round3(selected.z)].join(', ');
    } else {
      statusPosEl.textContent = '0, 0, 0';
    }
  }

  function redrawTree() {
    const q = (root.querySelector('.studio-explorer-search input')?.value || '').trim().toLowerCase();
    tree.innerHTML =
      '<div class="studio-tree-row rootrow">▾ <span class="rbx-icon">folder</span> Workspace (' + items.length + ')</div>' +
      items.map(o => {
        const hide = q && !o.name.toLowerCase().includes(q) && !o.shape.toLowerCase().includes(q) ? ' hidden' : '';
        return '<button class="studio-tree-row ' + (selected === o ? 'selected' : '') + '" data-id="' + o.id + '" role="treeitem"' + hide + '>› <span class="rbx-icon">cube</span> ' +
          o.name.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])) +
          ' <small style="opacity:.6;margin-left:auto">' + o.shape + '</small></button>';
      }).join('');
    tree.querySelectorAll('[data-id]').forEach(b => {
      b.onclick = () => { if (!playtesting) select(items.find(o => o.id === b.dataset.id)); };
    });
    updateStatusFooter();
  }

  function drawProps() {
    if (playtesting) {
      props.innerHTML = '<div class="studio-no-selection">Isolated 3D Playtest running.<br><br>Controls: WASD to move, Space to jump, Right-drag to orbit camera.<br>Click <b>Stop</b> in the ribbon to return to editing.</div>';
      return;
    }
    if (!selected) {
      props.innerHTML = '<div class="studio-no-selection">Select a 3D part in the viewport or Explorer to edit Position, Size, Rotation, Shape, Material, and Collision.</div>';
      return;
    }
    const esc = s => String(s).replace(/["<>&]/g, c => ({ '"': '&quot;', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    props.innerHTML =
      '<div class="studio-prop-group">▾ &nbsp; Data</div>' +
      '<label>Name<input data-prop="name" value="' + esc(selected.name) + '"></label>' +
      '<label>Shape<select data-prop="shape">' + SHAPES.map(s => '<option value="' + s + '"' + (selected.shape === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></label>' +
      '<div class="studio-prop-group">▾ &nbsp; Transform (Studs / Deg)</div>' +
      '<label>Position X<input data-prop="x" type="number" step="0.5" value="' + selected.x + '"></label>' +
      '<label>Position Y<input data-prop="y" type="number" step="0.5" value="' + selected.y + '"></label>' +
      '<label>Position Z<input data-prop="z" type="number" step="0.5" value="' + selected.z + '"></label>' +
      '<label>Size X<input data-prop="w" type="number" min="0.2" max="1024" step="0.5" value="' + selected.w + '"></label>' +
      '<label>Size Y<input data-prop="h" type="number" min="0.2" max="1024" step="0.5" value="' + selected.h + '"></label>' +
      '<label>Size Z<input data-prop="d" type="number" min="0.2" max="1024" step="0.5" value="' + selected.d + '"></label>' +
      '<label>Rotation X<input data-prop="rx" type="number" step="15" value="' + selected.rx + '"></label>' +
      '<label>Rotation Y<input data-prop="ry" type="number" step="15" value="' + selected.ry + '"></label>' +
      '<label>Rotation Z<input data-prop="rz" type="number" step="15" value="' + selected.rz + '"></label>' +
      '<div class="studio-prop-group">▾ &nbsp; Appearance & Physics</div>' +
      '<label>Color<input data-prop="color" type="color" value="' + selected.color + '"></label>' +
      '<label>Material<select data-prop="material">' + MATERIALS.map(m => '<option value="' + m + '"' + (selected.material === m ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></label>' +
      '<label>Anchored<input data-prop="anchored" type="checkbox"' + (selected.anchored ? ' checked' : '') + '></label>' +
      '<label>CanCollide<input data-prop="canCollide" type="checkbox"' + (selected.canCollide ? ' checked' : '') + '></label>';

    props.querySelectorAll('[data-prop]').forEach(el => {
      const handler = () => {
        if (!selected || playtesting) return;
        const key = el.dataset.prop;
        const before = JSON.stringify(items);
        if (key === 'name') selected.name = el.value.slice(0, 48) || 'Part';
        else if (key === 'color') selected.color = el.value.toLowerCase();
        else if (key === 'shape') { selected.shape = SHAPES.includes(el.value) ? el.value : 'block'; selected.kind = selected.shape; }
        else if (key === 'material') selected.material = MATERIALS.includes(el.value) ? el.value : 'plastic';
        else if (key === 'anchored' || key === 'canCollide') selected[key] = !!el.checked;
        else {
          const v = Number(el.value);
          if (!Number.isFinite(v)) return;
          if (key === 'w' || key === 'h' || key === 'd') selected[key] = round3(clamp(v, 0.2, 1024));
          else if (key === 'rx' || key === 'ry' || key === 'rz') selected[key] = round3(clamp(v, -360, 360));
          else selected[key] = round3(clamp(v, -2048, 2048));
        }
        remember(before);
        if (key === 'name' || key === 'shape') redrawTree();
        updateStatusFooter();
        renderFrame();
        scheduleSave();
      };
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', handler);
    });
  }

  function updatePropInputsLive() {
    if (!selected || playtesting) return;
    for (const k of ['x', 'y', 'z', 'w', 'h', 'd', 'rx', 'ry', 'rz']) {
      const inp = props.querySelector('[data-prop="' + k + '"]');
      if (inp && document.activeElement !== inp) inp.value = String(selected[k]);
    }
    updateStatusFooter();
  }

  function select(o) {
    selected = o || null;
    redrawTree();
    drawProps();
    updateStatusFooter();
    renderFrame();
  }

  // Insert 3D Parts with Genuine Shape
  function addPart(typeName = 'Part') {
    if (playtesting) return null;
    const mapShape = {
      Part: 'block',
      Block: 'block',
      Sphere: 'sphere',
      Wedge: 'wedge',
      Cylinder: 'cylinder',
      SpawnLocation: 'spawn'
    };
    const shape = mapShape[typeName] || 'block';
    const baseLabel = typeName === 'SpawnLocation' ? 'SpawnLocation' : (SHAPES.includes(typeName.toLowerCase()) ? typeName : 'Part');
    let n = 1;
    while (items.some(o => o.name === baseLabel + (n === 1 ? '' : n))) n++;
    const f = camForward();
    // Place in front of camera projected near y >= 0, snapped to grid
    const targetX = snapVal(clamp(cam.eye[0] + f[0] * 14, -256, 256));
    const targetZ = snapVal(clamp(cam.eye[2] + f[2] * 14, -256, 256));
    const dims = shape === 'spawn' ? [8, 1, 8] : shape === 'sphere' ? [4, 4, 4] : shape === 'wedge' ? [4, 4, 6] : shape === 'cylinder' ? [4, 5, 4] : [4, 4, 4];
    const color = shape === 'spawn' ? '#dfe5ee' : shape === 'wedge' ? '#e59838' : shape === 'sphere' ? '#49b675' : shape === 'cylinder' ? '#9b6bd6' : '#4f95cf';
    const before = JSON.stringify(items);
    const created = normalizeItem({
      id: 'part-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: baseLabel + (n === 1 ? '' : n),
      shape,
      kind: shape,
      x: targetX,
      y: round3(dims[1] / 2),
      z: targetZ,
      w: dims[0],
      h: dims[1],
      d: dims[2],
      rx: 0, ry: 0, rz: 0,
      color,
      material: 'plastic',
      anchored: true,
      canCollide: true
    });
    items.push(created);
    remember(before);
    select(created);
    scheduleSave();
    return created;
  }

  function duplicateSelected() {
    if (playtesting || !selected || selected.shape === 'floor') return null;
    const before = JSON.stringify(items);
    const copy = normalizeItem({
      ...selected,
      id: 'part-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: selected.name + '_Copy',
      x: round3(selected.x + Math.max(1, SNAP_STEPS[snapIndex] || 1)),
      y: round3(selected.y),
      z: round3(selected.z + Math.max(1, SNAP_STEPS[snapIndex] || 1))
    });
    items.push(copy);
    remember(before);
    select(copy);
    scheduleSave();
    return copy;
  }

  function deleteSelected() {
    if (playtesting || !selected || selected.shape === 'floor') return false;
    const before = JSON.stringify(items);
    items = items.filter(o => o !== selected);
    remember(before);
    select(null);
    scheduleSave();
    return true;
  }

  // One-way read snapshot from live GridWorld into Studio (never mutates live GridWorld!)
  function importLiveWorld() {
    if (playtesting) return 0;
    const gwParts = window.GridWorld?.parts || [];
    const before = JSON.stringify(items);
    const keepIds = new Set(items.filter(o => !String(o.id).startsWith('live-')).map(o => o.id));
    const next = items.filter(o => keepIds.has(o.id));
    let imported = 0;
    for (let i = 0; i < gwParts.length && next.length < 480; i++) {
      const p = gwParts[i];
      if (!p || !Array.isArray(p.center) || !Array.isArray(p.size)) continue;
      const sh = p.shape === 'wedge' ? 'wedge' : p.shape === 'sphere' ? 'sphere' : p.shape === 'cylinder' ? 'cylinder' : 'block';
      const colHex = Array.isArray(p.color)
        ? '#' + p.color.slice(0, 3).map(v => clamp(Math.round(v * 255), 0, 255).toString(16).padStart(2, '0')).join('')
        : (typeof p.color === 'string' && /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : '#418ac9');
      // Extract yaw from 3x3 matrix if present
      let ry = 0;
      if (Array.isArray(p.matrix) && p.matrix.length === 9) ry = round3(Math.atan2(p.matrix[2], p.matrix[8]) * 180 / Math.PI);
      next.push(normalizeItem({
        id: 'live-' + (i + 1),
        name: 'WorldPart' + (i + 1),
        shape: sh,
        x: p.center[0], y: p.center[1], z: p.center[2],
        w: p.size[0], h: p.size[1], d: p.size[2],
        rx: 0, ry, rz: 0,
        color: colHex,
        material: p.glow ? 'neon' : 'plastic',
        anchored: true,
        canCollide: p.collide !== false
      }));
      imported++;
    }
    items = next;
    remember(before);
    redrawTree(); drawProps(); renderFrame();
    if (imported > 0) scheduleSave();
    else saveStateEl.textContent = 'No live user-built blocks to import';
    return imported;
  }

  // Gizmo Geometry & Picking
  function gizmoScaleFor(C, eye) {
    return Math.max(2.6, Math.hypot(eye[0] - C[0], eye[1] - C[1], eye[2] - C[2]) * 0.14);
  }

  function pickGizmoHandle(ray) {
    if (!selected || playtesting || tool === 'select') return null;
    const C = [selected.x, selected.y, selected.z];
    const gLen = gizmoScaleFor(C, cam.eye);
    const m3 = mat3FromEuler(selected.rx, selected.ry, selected.rz);

    if (tool === 'move') {
      const axes = [[1,0,0], [0,1,0], [0,0,1]];
      let best = null, bestDist = gLen * 0.13;
      for (let i = 0; i < 3; i++) {
        const res = closestRayLine(ray.origin, ray.dir, C, axes[i]);
        if (res.s > 0 && res.u >= 0.1 * gLen && res.u <= 1.15 * gLen && res.dist < bestDist) {
          bestDist = res.dist;
          best = { kind: 'move', axisIndex: i, axis: axes[i], u0: res.u };
        }
      }
      return best;
    }

    if (tool === 'scale') {
      const half = [selected.w / 2, selected.h / 2, selected.d / 2];
      let best = null, bestDist = gLen * 0.15;
      for (let i = 0; i < 3; i++) {
        const ax = colOfMat3(m3, i);
        for (const sign of [1, -1]) {
          const dir = ax.map(v => v * sign);
          const reach = half[i] + gLen * 0.55;
          const res = closestRayLine(ray.origin, ray.dir, C, dir);
          if (res.s > 0 && res.u >= Math.max(0.15, half[i] * 0.4) && res.u <= reach + gLen * 0.18 && res.dist < bestDist) {
            bestDist = res.dist;
            best = { kind: 'scale', axisIndex: i, sign, axis: dir, u0: res.u };
          }
        }
      }
      return best;
    }

    if (tool === 'rotate') {
      const radius = gLen * 0.85;
      let best = null, bestErr = gLen * 0.16;
      for (let i = 0; i < 3; i++) {
        const n = i === 0 ? [1,0,0] : i === 1 ? [0,1,0] : [0,0,1];
        const denom = ray.dir[0]*n[0] + ray.dir[1]*n[1] + ray.dir[2]*n[2];
        if (Math.abs(denom) < 0.08) continue;
        const t = ((C[0]-ray.origin[0])*n[0] + (C[1]-ray.origin[1])*n[1] + (C[2]-ray.origin[2])*n[2]) / denom;
        if (t < 0.05) continue;
        const hit = [ray.origin[0] + ray.dir[0]*t - C[0], ray.origin[1] + ray.dir[1]*t - C[1], ray.origin[2] + ray.dir[2]*t - C[2]];
        const r = Math.hypot(...hit);
        const err = Math.abs(r - radius);
        if (err < bestErr) {
          bestErr = err;
          const u1 = i === 0 ? [0,1,0] : [1,0,0];
          const u2 = i === 0 ? [0,0,1] : i === 1 ? [0,0,1] : [0,1,0];
          const ang0 = Math.atan2(hit[0]*u2[0] + hit[1]*u2[1] + hit[2]*u2[2], hit[0]*u1[0] + hit[1]*u1[1] + hit[2]*u1[2]);
          best = { kind: 'rotate', axisIndex: i, normal: n, u1, u2, ang0 };
        }
      }
      return best;
    }
    return null;
  }

  // WebGL 3D Scene Rendering
  function drawMeshInstance(mesh, pos, m3, size, rgb, matIdx, isFloor, isSpawn, isSel) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
    gl.enableVertexAttribArray(glProg.aPos);
    gl.vertexAttribPointer(glProg.aPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(glProg.aNormal);
    gl.vertexAttribPointer(glProg.aNormal, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(glProg.aUV);
    gl.vertexAttribPointer(glProg.aUV, 2, gl.FLOAT, false, 32, 24);

    const model = modelMat4(pos, m3, size);
    const nMat = new Float32Array([
      m3[0], m3[3], m3[6],
      m3[1], m3[4], m3[7],
      m3[2], m3[5], m3[8]
    ]);
    gl.uniformMatrix4fv(glProg.uModel, false, model);
    gl.uniformMatrix3fv(glProg.uNormalMat, false, nMat);
    gl.uniform3fv(glProg.uColor, rgb);
    gl.uniform1f(glProg.uMaterial, matIdx);
    gl.uniform1f(glProg.uIsFloor, isFloor ? 1 : 0);
    gl.uniform1f(glProg.uIsSpawn, isSpawn ? 1 : 0);
    gl.uniform1f(glProg.uSelected, isSel ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  function pushLine(arr, a, b, col) {
    arr.push(a[0], a[1], a[2], col[0], col[1], col[2], col[3],
             b[0], b[1], b[2], col[0], col[1], col[2], col[3]);
  }

  function buildSelectionAndGizmoLines(eye) {
    if (!selected || playtesting) return null;
    const lines = [];
    const C = [selected.x, selected.y, selected.z];
    const m3 = mat3FromEuler(selected.rx, selected.ry, selected.rz);
    const hx = selected.w / 2 + 0.03, hy = selected.h / 2 + 0.03, hz = selected.d / 2 + 0.03;
    const corners = [
      [-hx,-hy,-hz], [hx,-hy,-hz], [hx,-hy,hz], [-hx,-hy,hz],
      [-hx, hy,-hz], [hx, hy,-hz], [hx, hy,hz], [-hx, hy,hz]
    ].map(p => { const w = mulMat3Vec(m3, p); return [C[0]+w[0], C[1]+w[1], C[2]+w[2]]; });
    const selCol = [0.09, 0.66, 1.0, 1.0];
    for (const [i, j] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]) {
      pushLine(lines, corners[i], corners[j], selCol);
    }

    const gLen = gizmoScaleFor(C, eye);
    const axisCols = [[0.95, 0.24, 0.24, 1], [0.16, 0.80, 0.36, 1], [0.23, 0.52, 0.98, 1]];

    if (tool === 'move') {
      const axes = [[1,0,0], [0,1,0], [0,0,1]];
      for (let i = 0; i < 3; i++) {
        const ax = axes[i], tip = [C[0]+ax[0]*gLen, C[1]+ax[1]*gLen, C[2]+ax[2]*gLen];
        pushLine(lines, C, tip, axisCols[i]);
        const p1 = i === 0 ? [0,1,0] : [1,0,0], p2 = i === 2 ? [0,1,0] : [0,0,1];
        for (const p of [p1, p2, p1.map(v=>-v), p2.map(v=>-v)]) {
          pushLine(lines, tip, [tip[0]-ax[0]*gLen*0.18+p[0]*gLen*0.08, tip[1]-ax[1]*gLen*0.18+p[1]*gLen*0.08, tip[2]-ax[2]*gLen*0.18+p[2]*gLen*0.08], axisCols[i]);
        }
      }
    } else if (tool === 'scale') {
      const half = [selected.w / 2, selected.h / 2, selected.d / 2];
      for (let i = 0; i < 3; i++) {
        const ax = colOfMat3(m3, i);
        for (const sign of [1, -1]) {
          const r = half[i] + gLen * 0.55;
          const end = [C[0]+ax[0]*r*sign, C[1]+ax[1]*r*sign, C[2]+ax[2]*r*sign];
          const start = [C[0]+ax[0]*half[i]*sign, C[1]+ax[1]*half[i]*sign, C[2]+ax[2]*half[i]*sign];
          pushLine(lines, start, end, axisCols[i]);
        }
      }
    } else if (tool === 'rotate') {
      const radius = gLen * 0.85, segs = 40;
      for (let i = 0; i < 3; i++) {
        const u1 = i === 0 ? [0,1,0] : [1,0,0];
        const u2 = i === 0 ? [0,0,1] : i === 1 ? [0,0,1] : [0,1,0];
        for (let s = 0; s < segs; s++) {
          const a0 = (s / segs) * Math.PI * 2, a1 = ((s + 1) / segs) * Math.PI * 2;
          const p0 = [C[0] + (u1[0]*Math.cos(a0) + u2[0]*Math.sin(a0))*radius, C[1] + (u1[1]*Math.cos(a0) + u2[1]*Math.sin(a0))*radius, C[2] + (u1[2]*Math.cos(a0) + u2[2]*Math.sin(a0))*radius];
          const p1 = [C[0] + (u1[0]*Math.cos(a1) + u2[0]*Math.sin(a1))*radius, C[1] + (u1[1]*Math.cos(a1) + u2[1]*Math.sin(a1))*radius, C[2] + (u1[2]*Math.cos(a1) + u2[2]*Math.sin(a1))*radius];
          pushLine(lines, p0, p1, axisCols[i]);
        }
      }
    }
    return new Float32Array(lines);
  }

  function renderPlaytestAvatar(eye) {
    if (!playtesting || !playPlayer) return;
    const p = playPlayer;
    const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
    const speed = Math.hypot(p.vx || 0, p.vz || 0);
    const swing = p.grounded ? Math.sin(playAnimTime * 10) * Math.min(1, speed / 14) * 35 : 22;
    const col = window.__avatarColors || {};
    const rgbOf = (part, fb) => col[part] ? col[part].slice(0, 3) : fb;
    const limbDraw = (lx, ly, lz, sx, sy2, sz, pitchDeg, rgb) => {
      const mLocal = mat3FromEuler(pitchDeg, p.yaw * 180 / Math.PI, 0);
      const wx = p.x + lx * cy + lz * sy;
      const wy = p.y + ly;
      const wz = p.z - lx * sy + lz * cy;
      drawMeshInstance(meshes.block, [wx, wy, wz], mLocal, [sx, sy2, sz], rgb, 1, false, false, false);
    };
    limbDraw(0, 4.5, 0, 1.2, 1.2, 1.2, 0, rgbOf('Head', [0.96, 0.80, 0.19]));
    limbDraw(0, 3.0, 0, 2.0, 2.0, 1.0, 0, rgbOf('Torso', [0.05, 0.41, 0.67]));
    limbDraw(-1.5, 3.0, 0, 1.0, 2.0, 1.0,  swing, rgbOf('Left Arm', [0.96, 0.80, 0.19]));
    limbDraw( 1.5, 3.0, 0, 1.0, 2.0, 1.0, -swing, rgbOf('Right Arm', [0.96, 0.80, 0.19]));
    limbDraw(-0.5, 1.0, 0, 1.0, 2.0, 1.0, -swing, rgbOf('Left Leg', [0.64, 0.74, 0.28]));
    limbDraw( 0.5, 1.0, 0, 1.0, 2.0, 1.0,  swing, rgbOf('Right Leg', [0.64, 0.74, 0.28]));
  }

  function renderFrame() {
    if (!gl || !glProg || root.hidden) return;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round((r.width || 800) * dpr));
    const h = Math.max(2, Math.round((r.height || 500) * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    const isDark = root.classList.contains('theme-dark');
    if (isDark) gl.clearColor(0.14, 0.17, 0.22, 1);
    else gl.clearColor(0.58, 0.76, 0.92, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let eye, target;
    if (playtesting && playPlayer) {
      const focus = [playPlayer.x, playPlayer.y + 3.6, playPlayer.z];
      const cp = Math.cos(playCam.pitch);
      const desired = [
        focus[0] + Math.sin(playCam.yaw) * cp * playCam.dist,
        focus[1] + Math.sin(playCam.pitch) * playCam.dist,
        focus[2] + Math.cos(playCam.yaw) * cp * playCam.dist
      ];
      const fClip = playPhysics?.clipCamera ? playPhysics.clipCamera(focus, desired) : 1;
      eye = [
        focus[0] + (desired[0] - focus[0]) * fClip,
        focus[1] + (desired[1] - focus[1]) * fClip,
        focus[2] + (desired[2] - focus[2]) * fClip
      ];
      target = focus;
    } else {
      eye = cam.eye;
      const f = camForward();
      target = [eye[0] + f[0], eye[1] + f[1], eye[2] + f[2]];
    }

    const proj = perspectiveMat4(62 * Math.PI / 180, w / h, 0.15, 2500);
    const view = lookAtMat4(eye, target);
    const vp = mulMat4(proj, view);
    lastVP = vp;
    lastInvVP = invertMat4(vp);

    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(glProg.prog);
    gl.uniformMatrix4fv(glProg.uVP, false, vp);
    gl.uniform3fv(glProg.uEye, eye);

    for (const o of items) {
      const mesh = meshes[o.shape] || meshes.block;
      const m3 = o.__dynQuat ? mat3FromQuat(o.__dynQuat) : mat3FromEuler(o.rx, o.ry, o.rz);
      const matIdx = Math.max(0, MATERIALS.indexOf(o.material));
      drawMeshInstance(mesh, [o.x, o.y, o.z], m3, [o.w, o.h, o.d], hexToRgb(o.color), matIdx, o.shape === 'floor', o.shape === 'spawn', selected === o && !playtesting);
    }

    if (playtesting) renderPlaytestAvatar(eye);

    const lineData = buildSelectionAndGizmoLines(eye);
    if (lineData && lineData.length) {
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(lineProg.prog);
      gl.uniformMatrix4fv(lineProg.uVP, false, vp);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(lineProg.aPos);
      gl.vertexAttribPointer(lineProg.aPos, 3, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(lineProg.aCol);
      gl.vertexAttribPointer(lineProg.aCol, 4, gl.FLOAT, false, 28, 12);
      gl.drawArrays(gl.LINES, 0, lineData.length / 7);

      // Draw solid 3D Scale handle end-cubes so Scale handles are crisp and obvious
      if (tool === 'scale' && selected) {
        gl.useProgram(glProg.prog);
        gl.uniformMatrix4fv(glProg.uVP, false, vp);
        gl.uniform3fv(glProg.uEye, eye);
        const C = [selected.x, selected.y, selected.z];
        const gLen = gizmoScaleFor(C, eye);
        const m3 = mat3FromEuler(selected.rx, selected.ry, selected.rz);
        const half = [selected.w / 2, selected.h / 2, selected.d / 2];
        const rgbs = [[0.95, 0.24, 0.24], [0.16, 0.80, 0.36], [0.23, 0.52, 0.98]];
        const hs = gLen * 0.11;
        for (let i = 0; i < 3; i++) {
          const ax = colOfMat3(m3, i);
          for (const sign of [1, -1]) {
            const rDist = half[i] + gLen * 0.55;
            const hc = [C[0]+ax[0]*rDist*sign, C[1]+ax[1]*rDist*sign, C[2]+ax[2]*rDist*sign];
            drawMeshInstance(meshes.block, hc, m3, [hs, hs, hs], rgbs[i], 2, false, false, false);
          }
        }
      }
      gl.enable(gl.DEPTH_TEST);
    }
  }

  // Isolated 3D Playtest Lifecycle (real Box3D capsule + unanchored bodies, zero live-world mutation)
  async function startPlaytest() {
    if (playtesting || playStarting) return false;
    playStarting = true;
    saveStateEl.textContent = 'Starting isolated 3D playtest…';
    try {
      const mod = await import('./box3d-physics.mjs');
      prePlaySnapshot = structuredClone(items);
      prePlaySelectedId = selected?.id || null;
      prePlayCam = { eye: cam.eye.slice(), yaw: cam.yaw, pitch: cam.pitch };

      const staticParts = [];
      playDynamicParts = [];
      for (const o of items) {
        if (!o.canCollide) continue;
        const m3 = mat3FromEuler(o.rx, o.ry, o.rz);
        const physShape = (o.shape === 'wedge' || o.shape === 'sphere' || o.shape === 'cylinder') ? o.shape : 'box';
        if (o.anchored) {
          staticParts.push({
            center: [o.x, o.y, o.z],
            size: [o.w, o.h, o.d],
            shape: physShape,
            matrix: m3,
            collide: true
          });
        } else {
          const dyn = {
            center: [o.x, o.y, o.z],
            size: [o.w, o.h, o.d],
            shape: physShape,
            rotation: quatFromMat3(m3),
            velocity: [0, 0, 0],
            angular: [0, 0, 0],
            networkOwned: true,
            __item: o
          };
          playDynamicParts.push(dyn);
        }
      }
      staticParts.contactVersion = 1;
      playPhysics = await mod.createPhysics({ obstacles: { collisionParts: staticParts }, baseplate: null });

      const spawnObj = items.find(o => o.shape === 'spawn') || items.find(o => o.shape === 'floor') || { x: 0, y: 0, z: 0, h: 1 };
      playPlayer = {
        x: spawnObj.x,
        y: spawnObj.y + spawnObj.h / 2 + 0.05,
        z: spawnObj.z,
        vx: 0, vy: 0, vz: 0,
        yaw: 0,
        grounded: false,
        groundGrace: 0,
        jumpHold: 0
      };
      playCam = { yaw: 0, pitch: 0.32, dist: 13 };
      playAnimTime = 0;
      playAccum = 0;
      lastFrameTs = performance.now();
      playtesting = true;
      root.classList.add('is-playtesting');
      clearInterval(playTimer);
      playTimer = setInterval(() => {
        if (!playtesting || root.hidden) return;
        const now = performance.now();
        if (now - lastFrameTs >= 30) {
          const dt = Math.min(0.25, (now - lastFrameTs) / 1000);
          lastFrameTs = now;
          stepPlaytestElapsed(dt);
        }
      }, 33);

      playBtn.classList.add('is-playtesting');
      playBtn.querySelector('span:last-child').textContent = 'Stop';
      const touchMode = matchMedia('(pointer: coarse)').matches;
      modeLabelEl.textContent = touchMode ? 'PLAYTEST · TOUCH CONTROLS' : 'PLAYTEST (ISOLATED) · WASD + Space';
      modeLabelEl.classList.add('is-playtest');
      hintEl.textContent = touchMode ? 'Move with joystick · Drag to look · Pinch to zoom · Jump button' : 'Isolated Playtest: WASD move · Space jump · Right-drag orbit · Wheel zoom · Click Stop to edit';
      saveStateEl.textContent = 'Isolated playtest active (live world untouched)';
      drawProps();
      updateStatusFooter();
      renderFrame();
      return true;
    } catch (e) {
      console.error('Studio playtest start failed:', e);
      saveStateEl.textContent = 'Playtest failed: ' + (e.message || e);
      return false;
    } finally {
      playStarting = false;
    }
  }

  function stopPlaytest() {
    if (!playtesting) return false;
    clearInterval(playTimer);
    playTimer = 0;
    try { playPhysics?.destroy?.(); } catch {}
    playPhysics = null;
    playDynamicParts = [];
    playPlayer = null;
    playtesting = false;
    root.classList.remove('is-playtesting');
    touchMove.side = touchMove.forward = 0; touchJump = false;
    if (prePlaySnapshot) {
      items = structuredClone(prePlaySnapshot);
      prePlaySnapshot = null;
    }
    if (prePlayCam) {
      cam.eye = prePlayCam.eye.slice();
      cam.yaw = prePlayCam.yaw;
      cam.pitch = prePlayCam.pitch;
      prePlayCam = null;
    }
    selected = prePlaySelectedId ? items.find(o => o.id === prePlaySelectedId) || null : null;
    prePlaySelectedId = null;

    playBtn.classList.remove('is-playtesting');
    playBtn.querySelector('span:last-child').textContent = 'Play';
    modeLabelEl.textContent = 'FREECAM 3D · Right-drag + WASD/EQ';
    modeLabelEl.classList.remove('is-playtest');
    hintEl.textContent = 'Click part to select · Drag colored X/Y/Z handles to transform · Right-drag + WASD to fly';
    saveStateEl.textContent = lastCloudOk ? 'Saved to account' : 'Saved in this browser only';
    redrawTree();
    drawProps();
    updateStatusFooter();
    renderFrame();
    return true;
  }

  let playAccum = 0;
  let playTimer = 0;

  function stepPlaytestElapsed(elapsedSec) {
    if (!playtesting || !playPhysics || !playPlayer) return;
    const typing = document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
    let fIn = 0, rIn = 0;
    if (!typing) {
      if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) fIn += 1;
      if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) fIn -= 1;
      if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) rIn += 1;
      if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) rIn -= 1;
      fIn += touchMove.forward; rIn += touchMove.side;
    }
    const sy = Math.sin(playCam.yaw), cy = Math.cos(playCam.yaw);
    let wx = -sy * fIn + cy * rIn;
    let wz = -cy * fIn - sy * rIn;
    const wn = Math.hypot(wx, wz);
    if (wn > 1e-5) {
      wx = (wx / wn) * 16;
      wz = (wz / wn) * 16;
      playPlayer.yaw = Math.atan2(wx, wz);
    } else {
      wx = 0; wz = 0;
    }
    const jump = !typing && (heldKeys.has('Space') || touchJump);
    playAccum = Math.min(0.25, playAccum + Math.max(0, elapsedSec));
    const FIXED = 1 / 60;
    let stepped = false;
    while (playAccum >= FIXED - 1e-6) {
      playAccum = Math.max(0, playAccum - FIXED);
      if (jump && playPlayer.grounded) {
        playPlayer.vy = 50;
        playPlayer.grounded = false;
        playPlayer.groundGrace = 0;
      }
      playPlayer.vx = wx;
      playPlayer.vz = wz;
      playPhysics.tick(FIXED, playDynamicParts);
      playPhysics.step(playPlayer, wx * FIXED, wz * FIXED, FIXED, playPhysics.metrics?.gravity || 196.2);
      if (playPlayer.y < -60) {
        const sp = items.find(o => o.shape === 'spawn') || items.find(o => o.shape === 'floor') || { x: 0, y: 0, z: 0, h: 1 };
        playPlayer.x = sp.x; playPlayer.y = sp.y + sp.h / 2 + 0.05; playPlayer.z = sp.z;
        playPlayer.vx = playPlayer.vy = playPlayer.vz = 0;
      }
      playAnimTime += FIXED;
      stepped = true;
    }
    if (stepped) {
      for (const dp of playDynamicParts) {
        dp.__item.x = round3(dp.center[0]);
        dp.__item.y = round3(dp.center[1]);
        dp.__item.z = round3(dp.center[2]);
        dp.__item.__dynQuat = dp.rotation.slice();
      }
      updateStatusFooter();
      renderFrame();
    }
  }

  // Animation Loop (Freecam WASD + Isolated Box3D Playtest Stepping)
  function tickLoop(ts) {
    if (root.hidden) { rafId = 0; return; }
    const rawDt = Math.min(0.25, Math.max(0.001, lastFrameTs ? (ts - lastFrameTs) / 1000 : 1 / 60));
    lastFrameTs = ts;
    const dt = Math.min(0.05, rawDt);

    const typing = document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (playtesting && playPhysics && playPlayer) {
      stepPlaytestElapsed(rawDt);
    } else if (!typing && drag?.mode === 'orbit') {
      const f = camForward();
      const right = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
      const speed = (heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight')) ? 52 : 24;
      let moved = false;
      const stepVec = (v, s) => { cam.eye[0] += v[0]*s; cam.eye[1] += v[1]*s; cam.eye[2] += v[2]*s; moved = true; };
      if (heldKeys.has('KeyW')) stepVec(f, speed * dt);
      if (heldKeys.has('KeyS')) stepVec(f, -speed * dt);
      if (heldKeys.has('KeyD')) stepVec(right, speed * dt);
      if (heldKeys.has('KeyA')) stepVec(right, -speed * dt);
      if (heldKeys.has('KeyE')) { cam.eye[1] += speed * dt; moved = true; }
      if (heldKeys.has('KeyQ')) { cam.eye[1] -= speed * dt; moved = true; }
      if (moved) renderFrame();
    }

    rafId = requestAnimationFrame(tickLoop);
  }

  function ensureLoop() {
    if (!rafId && !root.hidden) {
      lastFrameTs = 0;
      rafId = requestAnimationFrame(tickLoop);
    }
  }

  // Viewport Pointer Interaction (3D Raycast + Move/Scale/Rotate Gizmos + Orbit/Pan)
  function rayFromEvent(e) {
    if (!lastInvVP) renderFrame();
    if (!lastInvVP) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = 1 - ((e.clientY - rect.top) / rect.height) * 2;
    return unprojectRay(nx, ny, lastInvVP);
  }

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Two-finger pinch zoom is available on touch screens; one-finger drags orbit the camera.
  const activeTouches = new Map();
  let pinchDistance = 0;
  const touchGap = () => { const p=[...activeTouches.values()]; return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); };
  canvas.addEventListener('pointerdown', e => { if(e.pointerType==='touch'){activeTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(activeTouches.size===2){drag=null;pinchDistance=touchGap();e.preventDefault();}} });
  canvas.addEventListener('pointermove', e => {
    if(e.pointerType!=='touch'||!activeTouches.has(e.pointerId))return;
    activeTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(activeTouches.size>=2){const gap=touchGap();if(pinchDistance&&gap){const delta=gap-pinchDistance;if(playtesting)playCam.dist=clamp(playCam.dist-delta*.035,3,45);else{const f=camForward();cam.eye[0]+=f[0]*delta*.035;cam.eye[1]+=f[1]*delta*.035;cam.eye[2]+=f[2]*delta*.035;}renderFrame();}pinchDistance=gap;e.preventDefault();}
  },{passive:false});
  const releaseTouch=e=>{activeTouches.delete(e.pointerId);if(activeTouches.size<2)pinchDistance=0;};
  canvas.addEventListener('pointerup',releaseTouch);canvas.addEventListener('pointercancel',releaseTouch);

  canvas.addEventListener('pointerdown', e => {
    if(e.pointerType==='touch'&&activeTouches.size>1)return;
    canvas.focus?.();
    if(playtesting&&e.pointerType==='touch'){drag={mode:'orbit',x:e.clientX,y:e.clientY,yaw:playCam.yaw,pitch:playCam.pitch};try{canvas.setPointerCapture(e.pointerId)}catch{};e.preventDefault();return;}
    if (e.button === 2) {
      drag = {
        mode: 'orbit',
        x: e.clientX, y: e.clientY,
        yaw: playtesting ? playCam.yaw : cam.yaw,
        pitch: playtesting ? playCam.pitch : cam.pitch
      };
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    if (e.button === 1 && !playtesting) {
      drag = { mode: 'pan', x: e.clientX, y: e.clientY, eye0: cam.eye.slice() };
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    if (e.button !== 0 || playtesting) return;

    const ray = rayFromEvent(e);
    if (!ray) return;

    // 1. Check 3D transform gizmo handles first
    const gHit = pickGizmoHandle(ray);
    if (gHit && selected) {
      drag = {
        mode: 'gizmo',
        gizmo: gHit,
        before: JSON.stringify(items),
        pos0: [selected.x, selected.y, selected.z],
        size0: [selected.w, selected.h, selected.d],
        rot0: [selected.rx, selected.ry, selected.rz]
      };
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    // 2. Raycast all 3D parts
    let closest = null;
    for (const o of items) {
      const h = rayHitItem(ray, o);
      if (h && (!closest || h.t < closest.t)) closest = h;
    }
    if (!closest) {
      select(null);
      if(e.pointerType==='touch'){drag={mode:'orbit',x:e.clientX,y:e.clientY,yaw:cam.yaw,pitch:cam.pitch};try{canvas.setPointerCapture(e.pointerId)}catch{};}
      return;
    }
    select(closest.item);

    if (closest.item.shape !== 'floor' && (tool === 'select' || tool === 'move')) {
      drag = {
        mode: 'planar',
        before: JSON.stringify(items),
        planeY: closest.item.y,
        hitOffset: [
          ray.origin[0] + ray.dir[0] * closest.t - closest.item.x,
          0,
          ray.origin[2] + ray.dir[2] * closest.t - closest.item.z
        ]
      };
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener('pointermove', e => {
    if(e.pointerType==='touch'&&activeTouches.size>1)return;
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;

    if (drag.mode === 'orbit') {
      if (playtesting) {
        playCam.yaw = drag.yaw - dx * 0.007;
        playCam.pitch = clamp(drag.pitch + dy * 0.006, -0.35, 1.35);
      } else {
        cam.yaw = drag.yaw - dx * 0.0065;
        cam.pitch = clamp(drag.pitch - dy * 0.0065, -1.48, 1.48);
      }
      renderFrame();
      return;
    }

    if (drag.mode === 'pan') {
      const right = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
      const f = camForward();
      const up = [
        right[1]*f[2] - right[2]*f[1],
        right[2]*f[0] - right[0]*f[2],
        right[0]*f[1] - right[1]*f[0]
      ];
      const k = 0.045;
      cam.eye[0] = drag.eye0[0] - right[0]*dx*k - up[0]*dy*k;
      cam.eye[1] = drag.eye0[1] - right[1]*dx*k - up[1]*dy*k;
      cam.eye[2] = drag.eye0[2] - right[2]*dx*k - up[2]*dy*k;
      renderFrame();
      return;
    }

    if (!selected || playtesting) return;
    const ray = rayFromEvent(e);
    if (!ray) return;

    if (drag.mode === 'planar') {
      if (Math.abs(ray.dir[1]) < 1e-4) return;
      const t = (drag.planeY - ray.origin[1]) / ray.dir[1];
      if (t <= 0 || t > 1000) return;
      editEpoch++;
      selected.x = round3(snapVal(ray.origin[0] + ray.dir[0]*t - drag.hitOffset[0]));
      selected.z = round3(snapVal(ray.origin[2] + ray.dir[2]*t - drag.hitOffset[2]));
      updatePropInputsLive();
      renderFrame();
      return;
    }

    if (drag.mode === 'gizmo') {
      editEpoch++;
      const g = drag.gizmo;
      if (g.kind === 'move') {
        const res = closestRayLine(ray.origin, ray.dir, drag.pos0, g.axis);
        if (!Number.isFinite(res.u)) return;
        const delta = snapVal(res.u - g.u0);
        const prop = ['x', 'y', 'z'][g.axisIndex];
        selected[prop] = round3(drag.pos0[g.axisIndex] + delta);
      } else if (g.kind === 'scale') {
        const res = closestRayLine(ray.origin, ray.dir, drag.pos0, g.axis);
        if (!Number.isFinite(res.u)) return;
        const rawDelta = snapVal(res.u - g.u0);
        const newDim = clamp(drag.size0[g.axisIndex] + rawDelta, 0.2, 1024);
        const actualDelta = newDim - drag.size0[g.axisIndex];
        const sProp = ['w', 'h', 'd'][g.axisIndex];
        selected[sProp] = round3(newDim);
        // Anchor opposite face in 3D space
        selected.x = round3(drag.pos0[0] + g.axis[0] * actualDelta * 0.5);
        selected.y = round3(drag.pos0[1] + g.axis[1] * actualDelta * 0.5);
        selected.z = round3(drag.pos0[2] + g.axis[2] * actualDelta * 0.5);
      } else if (g.kind === 'rotate') {
        const C = drag.pos0, n = g.normal;
        const denom = ray.dir[0]*n[0] + ray.dir[1]*n[1] + ray.dir[2]*n[2];
        if (Math.abs(denom) < 0.04) return;
        const t = ((C[0]-ray.origin[0])*n[0] + (C[1]-ray.origin[1])*n[1] + (C[2]-ray.origin[2])*n[2]) / denom;
        if (t < 0.02) return;
        const hit = [ray.origin[0] + ray.dir[0]*t - C[0], ray.origin[1] + ray.dir[1]*t - C[1], ray.origin[2] + ray.dir[2]*t - C[2]];
        const ang = Math.atan2(hit[0]*g.u2[0] + hit[1]*g.u2[1] + hit[2]*g.u2[2], hit[0]*g.u1[0] + hit[1]*g.u1[1] + hit[2]*g.u1[2]);
        let dDeg = (ang - g.ang0) * 180 / Math.PI;
        if (SNAP_STEPS[snapIndex] > 0) dDeg = Math.round(dDeg / 15) * 15;
        const rProp = ['rx', 'ry', 'rz'][g.axisIndex];
        let nextAngle = ((drag.rot0[g.axisIndex] + dDeg + 540) % 360) - 180;
        selected[rProp] = round3(nextAngle);
      }
      updatePropInputsLive();
      renderFrame();
    }
  });

  const finishDrag = () => {
    if (drag && (drag.mode === 'gizmo' || drag.mode === 'planar')) {
      remember(drag.before);
      drawProps();
      scheduleSave();
    }
    drag = null;
  };
  canvas.addEventListener('pointerup', finishDrag);
  canvas.addEventListener('pointercancel', () => { drag = null; });

  const touchStick=root.querySelector('.studio-touch-stick'),touchKnob=root.querySelector('.studio-touch-stick-knob');
  let stickPointer=null,stickOrigin=null;
  const clearStick=()=>{touchMove.side=touchMove.forward=0;stickPointer=null;stickOrigin=null;touchKnob.style.transform='translate(0,0)'};
  touchStick.addEventListener('pointerdown',e=>{if(!playtesting||stickPointer!==null)return;const r=touchStick.getBoundingClientRect();stickPointer=e.pointerId;stickOrigin={x:e.clientX,y:e.clientY};touchStick.setPointerCapture(e.pointerId);touchStick.classList.add('is-active');e.preventDefault();});
  touchStick.addEventListener('pointermove',e=>{if(e.pointerId!==stickPointer)return;let x=e.clientX-stickOrigin.x,y=e.clientY-stickOrigin.y,n=Math.hypot(x,y),limit=38;if(n>limit){x*=limit/n;y*=limit/n}touchMove.side=x/limit;touchMove.forward=-y/limit;touchKnob.style.transform=`translate(${x}px,${y}px)`;e.preventDefault();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])touchStick.addEventListener(name,e=>{if(e.pointerId===stickPointer){clearStick();touchStick.classList.remove('is-active')}});
  const jumpButton=root.querySelector('.studio-touch-jump');
  jumpButton.addEventListener('pointerdown',e=>{if(!playtesting)return;touchJump=true;try{jumpButton.setPointerCapture(e.pointerId)}catch{};e.preventDefault()});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])jumpButton.addEventListener(name,()=>{touchJump=false});

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (playtesting) {
      playCam.dist = clamp(playCam.dist + e.deltaY * 0.015, 3, 45);
    } else {
      const f = camForward();
      const step = -e.deltaY * 0.025;
      cam.eye[0] += f[0] * step;
      cam.eye[1] += f[1] * step;
      cam.eye[2] += f[2] * step;
    }
    renderFrame();
  }, { passive: false });

  // Controls, Shortcuts & Lifecycle
  function setTool(nextTool) {
    if (!['select', 'move', 'scale', 'rotate'].includes(nextTool)) return;
    tool = nextTool;
    root.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    if (!playtesting) {
      const touchMode=matchMedia('(pointer: coarse)').matches;
      const msgs = touchMode ? {
        select: 'Tap a part · Drag handles to transform · Drag empty space to orbit · Pinch to zoom',
        move: 'Move: drag an axis handle · Drag empty space to orbit · Pinch to zoom',
        scale: 'Scale: drag an axis handle · Drag empty space to orbit · Pinch to zoom',
        rotate: 'Rotate: drag a ring handle · Drag empty space to orbit · Pinch to zoom'
      } : {
        select: 'Select: click 3D part or drag horizontally · Right-drag + WASD fly',
        move: 'Move: drag Red (X), Green (Y), or Blue (Z) arrow in 3D space',
        scale: 'Scale: drag ±X / ±Y / ±Z face cube handles to resize in 3D',
        rotate: 'Rotate: drag Red (Pitch X), Green (Yaw Y), or Blue (Roll Z) 3D ring'
      };
      hintEl.textContent = msgs[tool];
    }
    renderFrame();
  }

  root.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  root.querySelector('.studio-insert').addEventListener('click', () => addPart('Part'));
  root.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => addPart(b.dataset.add)));

  snapBtn.addEventListener('click', () => {
    snapIndex = (snapIndex + 1) % SNAP_STEPS.length;
    const s = SNAP_STEPS[snapIndex];
    snapBtn.textContent = s > 0 ? ('Snap: ' + s + ' stud' + (s === 1 ? '' : 's')) : 'Snap: Off';
  });

  root.querySelectorAll('[data-action]').forEach(b => {
    b.addEventListener('click', () => {
      const a = b.dataset.action;
      if (a === 'play') {
        if (playtesting) stopPlaytest();
        else startPlaytest();
      } else if (a === 'undo' || a === 'redo') {
        history(a === 'redo');
      } else if (a === 'duplicate') {
        duplicateSelected();
      } else if (a === 'delete') {
        deleteSelected();
      } else if (a === 'import-world') {
        importLiveWorld();
      } else if (a === 'export') {
        const blob = new Blob([JSON.stringify({ name: placeName, version: 2, items }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = placeName || 'place.studio.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else if (a === 'import-json') {
        fileInput.click();
      }
    });
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file || playtesting) return;
    try {
      const parsed = JSON.parse(await file.text());
      const arr = Array.isArray(parsed) ? parsed : parsed?.items;
      if (!Array.isArray(arr) || !arr.length) throw new Error('JSON has no parts array');
      const before = JSON.stringify(items);
      items = arr.slice(0, 500).map((o, i) => normalizeItem(o, i)).filter(Boolean);
      if (parsed?.name) { placeName = String(parsed.name).slice(0, 64); root.querySelector('.studio-place-title').textContent = placeName; }
      selected = null;
      remember(before);
      redrawTree(); drawProps(); renderFrame(); scheduleSave();
    } catch (err) {
      saveStateEl.textContent = 'Import failed: ' + (err.message || err);
    }
  });

  root.querySelector('.studio-reset-camera').addEventListener('click', () => {
    if (playtesting) { playCam.yaw = 0; playCam.pitch = 0.32; playCam.dist = 13; renderFrame(); }
    else resetCamera();
  });

  root.querySelector('[data-theme-toggle]').addEventListener('click', e => {
    const on = root.classList.toggle('theme-dark');
    try { localStorage.setItem(THEME_KEY, on ? 'dark' : 'light'); } catch {}
    e.currentTarget.querySelector('.rbx-icon').textContent = on ? 'sun' : 'moon-with-stars';
    renderFrame();
  });

  root.querySelector('.studio-explorer-search input').addEventListener('input', () => redrawTree());
  root.querySelector('.studio-search input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    root.querySelectorAll('.studio-models [data-add]').forEach(row => { row.hidden = !row.dataset.add.toLowerCase().includes(q); });
  });
  root.querySelectorAll('.studio-tabs button').forEach(b => {
    b.addEventListener('click', () => root.querySelectorAll('.studio-tabs button').forEach(x => x.classList.toggle('active', x === b)));
  });

  // Intercept keyboard while Studio is open so background game character never walks!
  window.addEventListener('keydown', e => {
    if (root.hidden) return;
    heldKeys.add(e.code);
    const typing = document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (!typing) e.stopPropagation();

    if (e.key === 'Escape') {
      e.preventDefault();
      if (playtesting) stopPlaytest();
      else close();
      return;
    }
    if (e.key === 'F5') {
      e.preventDefault();
      if (playtesting) stopPlaytest(); else startPlaytest();
      return;
    }
    if (typing || playtesting) return;

    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { history(e.shiftKey); e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { history(true); e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'd') { duplicateSelected(); e.preventDefault(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); e.preventDefault(); return; }
    if (k === 'f' && selected) { focusSelected(); e.preventDefault(); return; }
    if (!e.ctrlKey && !e.metaKey && drag?.mode !== 'orbit') {
      if (k === '1') setTool('select');
      else if (k === '2') setTool('move');
      else if (k === '3') setTool('scale');
      else if (k === '4') setTool('rotate');
    }
  }, true);

  window.addEventListener('keyup', e => {
    heldKeys.delete(e.code);
    if (!root.hidden) e.stopPropagation();
  }, true);
  window.addEventListener('blur', () => { heldKeys.clear(); touchMove.side=touchMove.forward=0; touchJump=false; });
  window.addEventListener('resize', () => { if (!root.hidden) renderFrame(); });

  function open() {
    root.hidden = false;
    if(matchMedia('(pointer: coarse)').matches&&!playtesting)hintEl.textContent='Tap a part · Drag handles to edit · Drag empty space to orbit · Pinch to zoom';
    window.dispatchEvent(new Event('hud:control-suspend'));
    redrawTree();
    drawProps();
    updateStatusFooter();
    renderFrame();
    ensureLoop();
    requestAnimationFrame(() => renderFrame());
  }

  function close() {
    if (playtesting) stopPlaytest();
    heldKeys.clear();
    touchMove.side=touchMove.forward=0; touchJump=false; clearStick();
    drag = null;
    root.hidden = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    document.getElementById('home-screen')?.focus?.();
  }

  root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));

  window.RobloxStudioEditor = Object.freeze({
    open,
    close,
    renderNow: renderFrame,
    addPart,
    selectById(id) { const o = items.find(x => x.id === id) || null; select(o); return o; },
    setTool,
    startPlaytest,
    stopPlaytest,
    importLiveWorld,
    saveNow,
    acceptAccountSave,
    overwriteAccountWithLocal,
    projectWorldToScreen(x, y, z) {
      if (!lastVP) renderFrame();
      if (!lastVP) return null;
      const rect = canvas.getBoundingClientRect();
      const c = [
        lastVP[0]*x + lastVP[4]*y + lastVP[8]*z  + lastVP[12],
        lastVP[1]*x + lastVP[5]*y + lastVP[9]*z  + lastVP[13],
        lastVP[2]*x + lastVP[6]*y + lastVP[10]*z + lastVP[14],
        lastVP[3]*x + lastVP[7]*y + lastVP[11]*z + lastVP[15]
      ];
      if (c[3] <= 0.01) return null;
      return {
        x: rect.left + (c[0] / c[3] * 0.5 + 0.5) * rect.width,
        y: rect.top  + (0.5 - c[1] / c[3] * 0.5) * rect.height
      };
    },
    getState() {
      return {
        open: !root.hidden,
        webgl: !!gl,
        tool,
        snap: SNAP_STEPS[snapIndex],
        playtesting,
        saveStatus: saveStateEl.textContent,
        accountId: activeAccountId,
        authenticated: accountAuthenticated,
        cloudUpdatedAt: knownCloudUpdatedAt,
        hasConflict: !!conflictCloudPlace,
        conflictPlace: conflictCloudPlace ? { name: conflictCloudPlace.name, updatedAt: conflictCloudPlace.updatedAt, partCount: conflictCloudPlace.items.length } : null,
        selectedId: selected?.id || null,
        items: items.map(o => ({ ...o })),
        camera: { eye: cam.eye.slice(), yaw: cam.yaw, pitch: cam.pitch },
        playPlayer: playPlayer ? { x: playPlayer.x, y: playPlayer.y, z: playPlayer.z, grounded: playPlayer.grounded } : null
      };
    },
    get active() { return !root.hidden; }
  });

  const studioButton = document.getElementById('home-nav-platform');
  if (studioButton) {
    studioButton.setAttribute('aria-label', 'Open 3D World Studio');
    studioButton.title = '3D World Studio';
    studioButton.addEventListener('click', open);
  }
})();
