/* Classic clothing, catalog items, and textured character meshes, including R6/R15 attachments.
 * Supports Head, Hair, Face, Neck/Collar, Left/Right Shoulder, BodyBack/Front, and Waist attachments. */
(() => {
  'use strict';

  const names = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  const faces = [
    { n: [0, 0, -1], v: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { n: [0, 0, 1], v: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { n: [1, 0, 0], v: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [0, 1, 0], v: [[-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [0, -1, 0], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5]] },
  ];
  const rects = {
    Torso: { front: [231, 74, 359, 202], back: [427, 74, 555, 202], right: [165, 74, 229, 202], left: [361, 74, 425, 202], top: [231, 8, 359, 72], bottom: [231, 204, 359, 268] },
    right: { front: [217, 355, 280, 483], back: [85, 355, 148, 483], right: [19, 355, 82, 483], left: [151, 355, 214, 483], top: [217, 289, 280, 352], bottom: [217, 485, 280, 549] },
    left: { front: [308, 355, 371, 483], back: [440, 355, 503, 483], right: [374, 355, 437, 483], left: [506, 355, 569, 483], top: [308, 289, 371, 352], bottom: [308, 485, 371, 549] },
  };

  const IDENT_ROT = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  // per-item accessory offsets (#2131/#2230/#2312): bounded head-local x/y/z (±OFF_BOUND studs) + scale multiplier s ([S_MIN,S_MAX], neutral 1)
  const OFF_BOUND = 0.5, S_MIN = 0.5, S_MAX = 2;
  const sanitizeOff = (v) => { const n = typeof v === 'number' ? v : NaN; if (!Number.isFinite(n)) return 0; return Math.max(-OFF_BOUND, Math.min(OFF_BOUND, Math.round(n * 1000) / 1000)); };
  const sanitizeS = (v) => { const n = typeof v === 'number' ? v : NaN; if (!Number.isFinite(n)) return 1; return Math.max(S_MIN, Math.min(S_MAX, Math.round(n * 1000) / 1000)); };
  const pickOffsets = (o) => { const x = sanitizeOff(o?.x), y = sanitizeOff(o?.y), z = sanitizeOff(o?.z), s = sanitizeS(o?.s); return { ...(x ? { x } : {}), ...(y ? { y } : {}), ...(z ? { z } : {}), ...(s !== 1 ? { s } : {}) }; };
  const ATTACHMENT_SPEC = {
    HatAttachment: { r6Part: 'Head', r6Anchor: [0, 0.5, 0], r15Part: 'R15Head', r15Anchor: [0, 0.5, 0], category: 'hats' },
    HairAttachment: { r6Part: 'Head', r6Anchor: [0, 0.5, 0], r15Part: 'R15Head', r15Anchor: [0, 0.5, 0], category: 'hair' },
    FaceFrontAttachment: { r6Part: 'Head', r6Anchor: [0, 0, -0.5], r15Part: 'R15Head', r15Anchor: [0, 0, -0.5], category: 'hats' },
    FaceCenterAttachment: { r6Part: 'Head', r6Anchor: [0, 0, 0], r15Part: 'R15Head', r15Anchor: [0, 0, 0], category: 'hats' },
    BodyBackAttachment: { r6Part: 'Torso', r6Anchor: [0, 0, 0.5], r15Part: 'UpperTorso', r15Anchor: [0, 0.2, 0.5], category: 'back' },
    BodyFrontAttachment: { r6Part: 'Torso', r6Anchor: [0, 0, -0.5], r15Part: 'UpperTorso', r15Anchor: [0, 0.2, -0.5], category: 'hats' },
    NeckAttachment: { r6Part: 'Torso', r6Anchor: [0, 1.0, 0], r15Part: 'UpperTorso', r15Anchor: [0, 0.8, 0], category: 'shoulder' },
    LeftCollarAttachment: { r6Part: 'Torso', r6Anchor: [-1.0, 1.0, 0], r15Part: 'UpperTorso', r15Anchor: [-1.0, 0.8, 0], category: 'shoulder' },
    RightCollarAttachment: { r6Part: 'Torso', r6Anchor: [1.0, 1.0, 0], r15Part: 'UpperTorso', r15Anchor: [1.0, 0.8, 0], category: 'shoulder' },
    WaistBackAttachment: { r6Part: 'Torso', r6Anchor: [0, -1.0, 0.5], r15Part: 'LowerTorso', r15Anchor: [0, 0, 0.5], category: 'back' },
    WaistFrontAttachment: { r6Part: 'Torso', r6Anchor: [0, -1.0, -0.5], r15Part: 'LowerTorso', r15Anchor: [0, 0, -0.5], category: 'hats' },
    WaistCenterAttachment: { r6Part: 'Torso', r6Anchor: [0, -1.0, 0], r15Part: 'LowerTorso', r15Anchor: [0, 0, 0], category: 'hats' },
    RightShoulderAttachment: { r6Part: 'Right Arm', r6Anchor: [0, 1.0, 0], r15Part: 'RightUpperArm', r15Anchor: [0, 0.4, 0], category: 'shoulder' },
    LeftShoulderAttachment: { r6Part: 'Left Arm', r6Anchor: [0, 1.0, 0], r15Part: 'LeftUpperArm', r15Anchor: [0, 0.4, 0], category: 'shoulder' },
  };
  const HAT_TYPE_NAMES = new Set([
    'Hat', 'HairAccessory', 'FaceAccessory', 'BackAccessory',
    'ShoulderAccessory', 'FrontAccessory', 'NeckAccessory', 'WaistAccessory',
  ]);
  const isHatLikeType = (t) => HAT_TYPE_NAMES.has(t);

  const sharedCharacters = new Map();
  const extractId = (s) => {
    const value = String(s || '').trim();
    const m = value.match(/(?:id=|rbxassetid:\/\/|roblox\.com\/asset\/?\?id=)(\d+)/i) || value.match(/^(\d{1,16})$/);
    return m ? Number(m[1]) : 0;
  };

  function meshGeometry(buf) {
    const a = new Uint8Array(buf), txt = new TextDecoder().decode(a.slice(0, 40)), nl = txt.indexOf('\n');
    if (nl < 0) throw Error('unknown mesh');
    const ver = txt.slice(0, nl).trim(), vertices = [], uvs = [];
    if (ver === 'version 1.00' || ver === 'version 1.01') {
      const raw = new TextDecoder().decode(a), start = raw.indexOf('\n', raw.indexOf('\n') + 1) + 1;
      const values = [...raw.slice(start).matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].split(',').map(Number));
      if (!values.length || values.length % 3 || values.length > 600000) throw Error('unsupported legacy mesh');
      for (let i = 0; i < values.length; i += 3) {
        const p = values[i], n = values[i + 1], u = values[i + 2];
        vertices.push(p[0] * 0.5, p[1] * 0.5, p[2] * 0.5, n[0], n[1], n[2]);
        uvs.push(u[0], 1 - u[1]);
      }
    } else if (ver.startsWith('version 2.') || ver.startsWith('version 3.')) {
      const d = new DataView(buf), p = nl + 1, header = d.getUint16(p, true), stride = d.getUint8(p + 2), faceStride = d.getUint8(p + 3);
      let count = 0, tri = 0;
      if (ver.startsWith('version 3.')) {
        const lodSize = d.getUint16(p + 4, true), lodCount = d.getUint16(p + 6, true);
        count = d.getUint32(p + 8, true);
        tri = d.getUint32(p + 12, true);
        const v0 = p + header, idx0 = v0 + count * stride, lodStart = idx0 + tri * faceStride;
        if (lodCount >= 2 && lodSize >= 4 && lodStart + 8 <= buf.byteLength) {
          const lod0End = d.getUint32(lodStart + 4, true);
          if (lod0End > 0 && lod0End <= tri) tri = lod0End;
        }
      } else {
        count = d.getUint32(p + 4, true);
        tri = d.getUint32(p + 8, true);
      }
      const v = p + header, idx = v + count * stride;
      if (header < 12 || stride < 32 || faceStride < 12 || !count || !tri || count > 100000 || tri > 100000 || idx + tri * faceStride > buf.byteLength) throw Error('invalid mesh');
      for (let i = 0; i < tri; i++) {
        for (let j = 0; j < 3; j++) {
          const k = d.getUint32(idx + i * faceStride + j * 4, true);
          if (k >= count) throw Error('bad mesh index');
          for (let q = 0; q < 6; q++) vertices.push(d.getFloat32(v + k * stride + q * 4, true));
          uvs.push(d.getFloat32(v + k * stride + 24, true), 1 - d.getFloat32(v + k * stride + 28, true));
        }
      }
    } else if (ver === 'version 4.00' || ver === 'version 4.01') {
      const d = new DataView(buf), p = nl + 1;
      if (p + 24 > buf.byteLength) throw Error('truncated v4 header');
      const header = d.getUint16(p, true), nv = d.getUint32(p + 4, true), nf = d.getUint32(p + 8, true);
      const lodCount = d.getUint16(p + 12, true), boneCount = d.getUint16(p + 14, true);
      const boneNamesBytes = d.getUint32(p + 16, true), subsetCount = d.getUint16(p + 20, true);
      if (header !== 24 || !nv || !nf || nv > 100000 || nf > 100000 || lodCount > 64 || boneCount > 256 || subsetCount > 4096) throw Error('invalid v4 header');
      if (boneCount !== 0) throw Error('skinned mesh is not supported');
      if (boneNamesBytes !== 0 || subsetCount !== 0) throw Error('unsupported static v4 mesh metadata');
      const vertexStart = p + header, vertexBytes = nv * 40, faceBytes = nf * 12, lodBytes = lodCount * 4;
      if (vertexStart + vertexBytes + faceBytes + lodBytes > buf.byteLength) throw Error('invalid v4 file length');
      const faceStart = vertexStart + vertexBytes, lodStart = faceStart + faceBytes, lods = [];
      for (let i = 0; i < lodCount; i++) lods.push(d.getUint32(lodStart + i * 4, true));
      if (lodCount && lods[0] !== 0) throw Error('v4 mesh has no base LOD');
      if (lods.some((x, i) => x > nf || (i > 0 && x < lods[i - 1]))) throw Error('invalid v4 LOD offsets');
      const firstFace = lodCount ? lods[0] : 0, lastFace = lodCount > 1 ? lods[1] : nf;
      if (lastFace <= firstFace || lastFace > nf) throw Error('invalid v4 highest-detail LOD');
      for (let i = 0; i < nf; i++) {
        for (let j = 0; j < 3; j++) {
          const k = d.getUint32(faceStart + i * 12 + j * 4, true);
          if (k >= nv) throw Error('bad mesh index');
          if (i >= firstFace && i < lastFace) {
            const v = vertexStart + k * 40;
            for (let q = 0; q < 6; q++) vertices.push(d.getFloat32(v + q * 4, true));
            uvs.push(d.getFloat32(v + 24, true), 1 - d.getFloat32(v + 28, true));
          }
        }
      }
    } else throw Error('unsupported mesh version');
    if (!vertices.length || vertices.some((x) => !Number.isFinite(x)) || uvs.some((x) => !Number.isFinite(x))) throw Error('invalid mesh');
    return { vertices: new Float32Array(vertices), uvs: new Float32Array(uvs), count: vertices.length / 6 };
  }

  function xmlVec(node) {
    if (!node) return null;
    const n = (t) => Number(node.getElementsByTagName(t)[0]?.textContent || 0);
    return [n('X'), n('Y'), n('Z')];
  }
  function xmlRot(node) {
    if (!node) return IDENT_ROT;
    const tags = ['R00', 'R01', 'R02', 'R10', 'R11', 'R12', 'R20', 'R21', 'R22'];
    const vals = tags.map((t) => {
      const el = node.getElementsByTagName(t)[0];
      return el ? Number(el.textContent) : NaN;
    });
    return vals.every(Number.isFinite) ? vals : IDENT_ROT;
  }
  function parseAssetXml(text) {
    const doc = new DOMParser().parseFromString(text.replace(/^\uFEFF/, ''), 'text/xml');
    const out = { scale: [1, 1, 1], offset: [0, 0, 0], ap: null, apRot: IDENT_ROT, attachment: 'HatAttachment', attachmentMap: {}, wrapAssetCount: 0 };
    for (const c of doc.getElementsByTagName('Content')) {
      const name = c.getAttribute('name'), id = extractId(c.textContent);
      if (id && name) out[name] = id;
    }
    for (const item of doc.getElementsByTagName('Item')) {
      const cls = item.getAttribute('class') || '';
      if (cls === 'WrapLayer' || cls === 'WrapTarget' || cls === 'Bone') out.wrapAssetCount++;
      if (['Shirt', 'Pants', 'ShirtGraphic', 'Decal', 'Accessory', 'Hat'].includes(cls)) out.classHint ||= cls;
      if (cls === 'Attachment') {
        let attName = '', cf = null, cfRot = IDENT_ROT;
        for (const ch of item.children) {
          if (ch.tagName === 'Properties') {
            for (const p of ch.children) {
              if (p.getAttribute('name') === 'Name') attName = (p.textContent || '').trim();
              if (p.getAttribute('name') === 'CFrame') { cf = xmlVec(p); cfRot = xmlRot(p); }
            }
          }
        }
        if (attName && cf) out.attachmentMap[attName] = { pos: cf, rot: cfRot };
      }
      if (!out.name && ['Accessory', 'Hat', 'Shirt', 'Pants', 'ShirtGraphic', 'Decal'].includes(cls)) {
        for (const ch of item.children) {
          if (ch.tagName === 'Properties') {
            for (const p of ch.children) {
              if (p.getAttribute('name') === 'Name' && p.textContent) out.name = p.textContent.trim();
            }
          }
        }
      }
    }
    const chosenAtt = Object.keys(ATTACHMENT_SPEC).find((k) => out.attachmentMap[k]);
    if (chosenAtt) {
      out.attachment = chosenAtt;
      out.ap = out.attachmentMap[chosenAtt].pos;
      out.apRot = out.attachmentMap[chosenAtt].rot || IDENT_ROT;
    }
    for (const v of [...doc.getElementsByTagName('Vector3'), ...doc.getElementsByTagName('CoordinateFrame')]) {
      const name = v.getAttribute('name'), vec = xmlVec(v);
      if (name === 'Scale' && vec) out.scale = vec;
      if (name === 'Offset' && vec) out.offset = vec;
      if (name === 'AttachmentPoint' && vec && !out.ap) { out.ap = vec; out.apRot = xmlRot(v); }
    }
    out.ap ||= [0, 0, 0];
    return out;
  }

  async function parseAssetModel(buf) {
    const u8 = new Uint8Array(buf);
    if (u8.length >= 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) {
      return { directImage: true, scale: [1, 1, 1], offset: [0, 0, 0], ap: [0, 0, 0], apRot: IDENT_ROT, attachment: 'HatAttachment', wrapAssetCount: 0 };
    }
    const head = new TextDecoder().decode(u8.subarray(0, 8));
    if (head !== '<roblox!') return parseAssetXml(new TextDecoder().decode(buf));
    if (!window.RbxAvatarModel) throw Error('Binary avatar model reader is not loaded');
    const items = await window.RbxAvatarModel.decode(buf);
    const out = { scale: [1, 1, 1], offset: [0, 0, 0], ap: null, apRot: IDENT_ROT, attachment: 'HatAttachment', attachmentMap: {}, wrapAssetCount: 0 };
    for (const item of items) {
      const p = item.props;
      if (item.className === 'WrapLayer' || item.className === 'WrapTarget' || item.className === 'Bone') out.wrapAssetCount++;
      if (['Shirt', 'Pants', 'ShirtGraphic', 'Decal', 'Accessory', 'Hat'].includes(item.className)) out.classHint ||= item.className;
      if (item.className === 'Attachment' && p.Name && Array.isArray(p.CFrame)) {
        out.attachmentMap[p.Name] = { pos: p.CFrame, rot: p.CFrameRot || IDENT_ROT };
      }
      for (const k of ['MeshId', 'TextureId', 'Texture', 'ShirtTemplate', 'PantsTemplate', 'Graphic']) {
        const id = extractId(p[k]);
        if (id) out[k] = id;
      }
      if (p.Scale) out.scale = p.Scale;
      if (p.Offset) out.offset = p.Offset;
      if (p.AttachmentPoint && !out.ap) { out.ap = p.AttachmentPoint; out.apRot = p.AttachmentPointRot || IDENT_ROT; }
      if (!out.name && p.Name && ['Accessory', 'Hat', 'Shirt', 'Pants', 'ShirtGraphic', 'Decal'].includes(item.className)) {
        out.name = String(p.Name);
      }
    }
    const chosenAtt = Object.keys(ATTACHMENT_SPEC).find((k) => out.attachmentMap[k]);
    if (chosenAtt) {
      out.attachment = chosenAtt;
      out.ap = out.attachmentMap[chosenAtt].pos;
      out.apRot = out.attachmentMap[chosenAtt].rot || IDENT_ROT;
    }
    out.ap ||= [0, 0, 0];
    return out;
  }

  function detectType(xml) {
    if (xml.ShirtTemplate) return 'Shirt';
    if (xml.PantsTemplate) return 'Pants';
    if (xml.Graphic) return 'TShirt';
    if (xml.MeshId) return 'Hat';
    if (xml.Texture && xml.classHint === 'Decal') return 'Face';
    if (xml.directImage) return 'Face';
    return null;
  }
  function detectCategory(xml, type) {
    if (type === 'Shirt') return 'shirts';
    if (type === 'Pants') return 'pants';
    if (type === 'TShirt') return 'tshirts';
    if (type === 'Face') return 'faces';
    if (type === 'Hat') return ATTACHMENT_SPEC[xml.attachment]?.category || 'hats';
    return 'hats';
  }

  async function fetchPublicAssetBytes(id) {
    const strId = String(id || '').trim();
    if (!/^\d{1,16}$/.test(strId)) throw Error('Invalid asset ID');
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 18000);
      try {
        const r = await fetch('/api/avatar-asset?id=' + strId, { signal: controller.signal });
        if (r.ok) return await r.arrayBuffer();
        const reason = (await r.text()).slice(0, 180);
        if (attempt === 0 && [429, 502, 503, 504].includes(r.status)) {
          await new Promise((ok) => setTimeout(ok, 400));
          continue;
        }
        const err = Error(reason || ('Asset ' + strId + ' unavailable (HTTP ' + r.status + ')'));
        err.httpStatus = r.status;
        err.assetId = strId;
        throw err;
      } catch (e) {
        if (controller.signal.aborted || e?.name === 'AbortError') throw Error('Asset ' + strId + ' request timed out (18s).');
        throw e;
      } finally { clearTimeout(timer); }
    }
  }

  async function validateCatalogAssetId(id) {
    const strId = String(id || '').trim();
    if (!/^\d{1,16}$/.test(strId)) return { ok: false, reason: 'Enter a numeric Roblox asset ID.' };
    try {
      const raw = await fetchPublicAssetBytes(strId);
      const xml = await parseAssetModel(raw);
      if (xml.wrapAssetCount && !xml.MeshId && !xml.ShirtTemplate && !xml.PantsTemplate && !xml.Graphic) {
        return { ok: false, reason: 'Asset #' + strId + ' is layered 3D clothing, which is not wearable on classic bodies.' };
      }
      const type = detectType(xml);
      if (!type) return { ok: false, reason: 'Asset #' + strId + ' is not a wearable Shirt, Pants, T-Shirt, Face, or Accessory.' };
      if (type === 'Hat') {
        const meshBuf = await fetchPublicAssetBytes(xml.MeshId);
        meshGeometry(meshBuf);
        if (xml.TextureId) await fetchPublicAssetBytes(xml.TextureId);
      } else if (type === 'Shirt' && xml.ShirtTemplate) {
        await fetchPublicAssetBytes(xml.ShirtTemplate);
      } else if (type === 'Pants' && xml.PantsTemplate) {
        await fetchPublicAssetBytes(xml.PantsTemplate);
      } else if (type === 'TShirt' && xml.Graphic) {
        await fetchPublicAssetBytes(xml.Graphic);
      } else if (type === 'Face' && !xml.directImage && xml.Texture) {
        await fetchPublicAssetBytes(xml.Texture);
      }
      const category = detectCategory(xml, type);
      const attLabel = type === 'Hat' && xml.attachment ? ' · ' + xml.attachment : '';
      return {
        ok: true,
        assetId: strId,
        type,
        category,
        attachment: xml.attachment || null,
        title: (xml.name && xml.name !== 'Accessory' && xml.name !== 'Hat' ? xml.name : type + ' #' + strId),
        subtitle: 'Verified Public ' + type + attLabel + ' · #' + strId,
      };
    } catch (e) {
      const status = e?.httpStatus;
      if (status === 401 || status === 403 || /401|403|restricts public|unavailable/i.test(e?.message || '')) {
        return {
          ok: false,
          restricted: true,
          reason: 'Asset #' + strId + ' is unavailable: Roblox restricts unauthenticated public Asset Delivery (HTTP ' + (status || 403) + ') for its mesh or texture.',
        };
      }
      return { ok: false, reason: e?.message || ('Asset #' + strId + ' could not be verified.') };
    }
  }

  function create(gl, b) {
    const appearances = new Map(), bytesCache = new Map(), localUrlCache = new Map(), equipCache = new Map();
    const A = window.ArchivedR6Animation, remoteQueue = [];
    let remoteActive = 0, preloadPins = new Set();

    function pumpRemote() {
      while (remoteActive < 2 && remoteQueue.length) {
        const task = remoteQueue.shift();
        remoteActive++;
        task().finally(() => { remoteActive--; pumpRemote(); });
      }
    }
    function asset(id) {
      const strId = String(id || '').trim();
      if (!bytesCache.has(strId)) {
        bytesCache.set(strId, fetchPublicAssetBytes(strId).catch((e) => { bytesCache.delete(strId); throw e; }));
      }
      return bytesCache.get(strId);
    }
    function localBytes(url) {
      const key = String(url);
      if (!localUrlCache.has(key)) {
        localUrlCache.set(key, fetch(key).then((r) => {
          if (!r.ok) throw Error('Bundled asset unavailable (' + key + ')');
          return r.arrayBuffer();
        }).catch((e) => { localUrlCache.delete(key); throw e; }));
      }
      return localUrlCache.get(key);
    }
    async function img(buf) {
      const a = new Uint8Array(buf);
      const mime = a[0] === 137 && a[1] === 80 ? 'image/png' : a[0] === 255 && a[1] === 216 ? 'image/jpeg' : 'application/octet-stream';
      const blob = new Blob([buf], { type: mime }), url = URL.createObjectURL(blob);
      try {
        return await new Promise((ok, bad) => {
          const i = new Image();
          i.onload = () => ok(i);
          i.onerror = () => bad(Error('invalid image'));
          i.src = url;
        });
      } finally { URL.revokeObjectURL(url); }
    }
    function tex(image) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    function buffers(g) {
      const v = gl.createBuffer(), u = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, v); gl.bufferData(gl.ARRAY_BUFFER, g.vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, u); gl.bufferData(gl.ARRAY_BUFFER, g.uvs, gl.STATIC_DRAW);
      return { v, u, count: g.count };
    }
    function clothingGeometry(partName) {
      const map = rects[partName === 'Torso' ? 'Torso' : partName.startsWith('Right') ? 'right' : 'left'], v = [], u = [];
      for (let f = 0; f < 6; f++) {
        const face = faces[f], r = map[names[f]], x0 = r[0] / 585, y0 = r[1] / 559, x1 = r[2] / 585, y1 = r[3] / 559;
        const coords = f === 4 ? [[x0, y0], [x0, y1], [x1, y1], [x1, y0]]
          : f === 5 ? [[x0, y1], [x0, y0], [x1, y0], [x1, y1]]
          : [[x0, y1], [x1, y1], [x1, y0], [x0, y0]];
        for (const i of [0, 1, 2, 0, 2, 3]) { v.push(...face.v[i], ...face.n); u.push(...coords[i]); }
      }
      return buffers({ vertices: new Float32Array(v), uvs: new Float32Array(u), count: 36 });
    }
    const clothBuffers = Object.fromEntries(['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'].map((n) => [n, clothingGeometry(n)]));

    function compose(shirtImg, pantsImg, tshirtImg) {
      if (!shirtImg && !pantsImg && !tshirtImg) return null;
      const c = document.createElement('canvas');
      c.width = 585; c.height = 559;
      const q = c.getContext('2d');
      if (pantsImg) q.drawImage(pantsImg, 0, 0, 585, 559);
      if (shirtImg) q.drawImage(shirtImg, 0, 0, 585, 559);
      if (tshirtImg) q.drawImage(tshirtImg, 231, 74, 128, 128);
      return tex(c);
    }

    async function loadSingleEquip(id, expectedType = 'Auto') {
      const strId = String(id || '').trim();
      if (strId.startsWith('cat:')) {
        const catItem = window.CatalogPack?.byId?.(strId);
        if (!catItem) throw Error('Catalog item ' + strId + ' is not registered');
        if (catItem.type === 'Face') return { type: 'Face', texture: tex(await img(await localBytes(catItem.localUrl))) };
        if (catItem.type === 'Shirt') { const image = await img(await localBytes(catItem.localUrl)); return { type: 'Shirt', image, texture: tex(image) }; }
        if (catItem.type === 'Pants') { const image = await img(await localBytes(catItem.localUrl)); return { type: 'Pants', image, texture: tex(image) }; }
        if (catItem.type === 'TShirt') { const image = await img(await localBytes(catItem.localUrl)); return { type: 'TShirt', image }; }
        if (catItem.type === 'Hat') {
          const [meshBuf, texBuf] = await Promise.all([
            localBytes(catItem.meshUrl),
            catItem.textureUrl ? localBytes(catItem.textureUrl) : Promise.resolve(null),
          ]);
          return {
            type: 'Hat',
            geo: buffers(meshGeometry(meshBuf)),
            texture: texBuf ? tex(await img(texBuf)) : null,
            scale: catItem.scale || [1, 1, 1],
            offset: catItem.offset || [0, 0, 0],
            attachment: catItem.attachment || 'HatAttachment',
            ap: catItem.ap || [0, 0, 0],
            apRot: catItem.apRot || IDENT_ROT,
            assetId: strId,
            editorItem: true,
          };
        }
        throw Error('Unsupported catalog item type: ' + catItem.type);
      }

      const raw = await asset(strId);
      const xml = await parseAssetModel(raw);
      if (xml.wrapAssetCount && !xml.MeshId && !xml.ShirtTemplate && !xml.PantsTemplate && !xml.Graphic) {
        throw Error('Layered clothing (3D jacket/shirt/pants) is not supported yet; try a classic Shirt, Pants, T-Shirt, Face, or Accessory ID.');
      }
      const actual = detectType(xml) || (expectedType === 'Auto' ? null : (isHatLikeType(expectedType) ? 'Hat' : expectedType));
      if (!actual) throw Error('Asset ' + strId + ' is not a supported Shirt, Pants, T-Shirt, Face, or Accessory.');
      const normExpected = isHatLikeType(expectedType) ? 'Hat' : expectedType;
      if (normExpected && normExpected !== 'Auto' && actual !== normExpected) {
        throw Error('Asset ' + strId + ' is a ' + actual + ', not ' + expectedType + '.');
      }
      const wrapRestricted = (err, depKind, depId) => {
        if (err && (err.httpStatus === 401 || err.httpStatus === 403 || /401|403|unavailable/i.test(err.message || ''))) {
          throw Error('Asset ' + strId + ' cannot be worn because Roblox restricts public unauthenticated delivery of its ' + depKind + ' (' + depId + ').');
        }
        throw err;
      };
      if (actual === 'Shirt') {
        try { const image = await img(await asset(xml.ShirtTemplate || strId)); return { type: 'Shirt', image, texture: tex(image) }; }
        catch (e) { wrapRestricted(e, 'ShirtTemplate', xml.ShirtTemplate || strId); }
      }
      if (actual === 'Pants') {
        try { const image = await img(await asset(xml.PantsTemplate || strId)); return { type: 'Pants', image, texture: tex(image) }; }
        catch (e) { wrapRestricted(e, 'PantsTemplate', xml.PantsTemplate || strId); }
      }
      if (actual === 'TShirt') {
        try { const image = await img(await asset(xml.Graphic || strId)); return { type: 'TShirt', image }; }
        catch (e) { wrapRestricted(e, 'T-Shirt graphic', xml.Graphic || strId); }
      }
      if (actual === 'Face') {
        if (xml.directImage) return { type: 'Face', texture: tex(await img(raw)) };
        try { return { type: 'Face', texture: tex(await img(await asset(xml.Texture || strId))) }; }
        catch (e) { wrapRestricted(e, 'Face texture', xml.Texture || strId); }
      }
      if (actual === 'Hat') {
        if (!xml.MeshId) throw Error('Accessory ' + strId + ' has no SpecialMesh MeshId.');
        if (xml.scale.some((v) => !Number.isFinite(v) || Math.abs(v) > 10)) throw Error('Accessory scale out of bounds');
        let meshBuf;
        try { meshBuf = await asset(xml.MeshId); } catch (e) { wrapRestricted(e, 'mesh', xml.MeshId); }
        const geo = buffers(meshGeometry(meshBuf));
        let texture = null, warning = null;
        if (xml.TextureId) {
          try { texture = tex(await img(await asset(xml.TextureId))); }
          catch (e) { warning = 'Accessory texture unavailable: ' + e.message; }
        }
        return {
          type: 'Hat',
          geo,
          texture,
          scale: xml.scale,
          offset: xml.offset,
          attachment: xml.attachment || 'HatAttachment',
          ap: xml.ap || [0, 0, 0],
          apRot: xml.apRot || IDENT_ROT,
          assetId: strId,
          warning,
          editorItem: true,
        };
      }
      throw Error('Unsupported asset type: ' + actual);
    }

    function loadCachedEquip(id, type = 'Auto') {
      const k = String(id).trim() + ':' + (type || 'Auto');
      if (!equipCache.has(k)) {
        equipCache.set(k, loadSingleEquip(id, type).catch((e) => { equipCache.delete(k); throw e; }));
      }
      return equipCache.get(k);
    }

    async function applyOverride(key, items, baseAppearance = null) {
      const normKey = String(key || '').trim().toLowerCase();
      if (!normKey) throw Error('missing override key');
      const loaded = [];
      for (const item of items) {
        const eq = await loadCachedEquip(item.id, item.type || 'Auto');
        loaded.push({ ...eq, id: String(item.id), ...pickOffsets(item) }); // #2131/#2230/#2312
      }
      const baseKey = baseAppearance && String(baseAppearance).trim().toLowerCase() !== normKey
        ? String(baseAppearance).trim().toLowerCase()
        : '';
      if (baseKey) ensure(baseKey);
      const base = baseKey ? appearances.get(baseKey) : null;
      const hasBase = !!(base && base.character && base.status === 'ready');

      let shirtImg = null, pantsImg = null, tshirtImg = null, shirtTex = null, pantsTex = null, faceTex = null;
      const edAcc = [];
      for (const eq of loaded) {
        if (eq.type === 'Shirt') { shirtImg = eq.image; shirtTex = eq.texture; }
        else if (eq.type === 'Pants') { pantsImg = eq.image; pantsTex = eq.texture; }
        else if (eq.type === 'TShirt') { tshirtImg = eq.image; }
        else if (eq.type === 'Face') { faceTex = eq.texture; }
        else if (eq.type === 'Hat' && edAcc.length < 4) edAcc.push(eq);
      }
      const torsoTex = compose(shirtImg, pantsImg, tshirtImg);
      const baseAcc = hasBase ? (base.baseAccessories || base.accessories || []) : [];
      const state = {
        status: 'ready',
        character: hasBase,
        composed: hasBase,
        baseCharacter: hasBase ? (base.canonicalName || baseAppearance) : (baseKey || null),
        rig: hasBase ? base.rig : null,
        parts: hasBase ? base.parts : null,
        baseAccessories: baseAcc,
        editorAccessories: edAcc,
        accessories: hasBase ? [...baseAcc, ...edAcc] : edAcc,
        shirt: shirtTex,
        pants: pantsTex,
        torso: torsoTex,
        face: faceTex,
        loaded: loaded.length,
        skipped: 0,
        failures: [],
      };
      appearances.set(normKey, state);
      return loaded.map((x) => ({ id: x.id, type: x.type, ...pickOffsets(x) })); // #2131/#2230/#2312
    }

    async function load(info) {
      const name = String(info.name || '').toLowerCase();
      if (!name) throw Error('missing avatar name');
      const old = appearances.get(name);
      if (old?.promise && !(old.status === 'ready' && old.failures?.length)) return old.promise;
      const baseKey = info.baseCharacter ? String(info.baseCharacter).toLowerCase() : '';
      const base = baseKey ? appearances.get(baseKey) : null;
      const hasBase = !!(base && base.character && base.status === 'ready');
      const state = {
        status: 'loading', character: hasBase, composed: hasBase,
        baseCharacter: hasBase ? (base.canonicalName || info.baseCharacter) : null,
        rig: hasBase ? base.rig : null, parts: hasBase ? base.parts : null,
        baseAccessories: hasBase ? base.accessories : [], editorAccessories: [],
        shirt: null, pants: null, torso: null, face: null, accessories: [],
        loaded: 0, skipped: 0, failures: [],
      };
      appearances.set(name, state);
      state.promise = (async () => {
        if (baseKey && !hasBase) {
          state.status = 'ready';
          state.failures.push({ id: baseKey, name: 'BaseCharacter', type: 'Character', reason: 'Saved avatar base is not ready.' });
          return { loaded: 0, skipped: (info.assets || []).length, clothes: false, accessories: 0, editorAccessories: 0, baseAccessories: 0, failures: state.failures };
        }
        const all = (info.assets || []).filter((a) => {
          const t = a.assetType || a.type;
          return ['Shirt', 'Pants', 'TShirt', 'T-Shirt', 'ShirtGraphic', 'Face', 'Decal'].includes(t) || isHatLikeType(t);
        });
        const assets = all.slice(0, 12);
        state.skipped = all.length - assets.length;
        let shirtImg = null, pantsImg = null, tshirtImg = null, cursor = 0;
        await Promise.all(Array.from({ length: Math.min(3, assets.length) }, async () => {
          while (cursor < assets.length) {
            const a = assets[cursor++];
            const rawType = a.assetType || a.type;
            const normType = (rawType === 'T-Shirt' || rawType === 'ShirtGraphic') ? 'TShirt' : rawType === 'Decal' ? 'Face' : isHatLikeType(rawType) ? 'Hat' : rawType;
            try {
              const eq = await loadCachedEquip(a.id, normType);
              if (eq.type === 'Shirt') { shirtImg = eq.image; state.shirt = eq.texture; }
              else if (eq.type === 'Pants') { pantsImg = eq.image; state.pants = eq.texture; }
              else if (eq.type === 'TShirt') { tshirtImg = eq.image; }
              else if (eq.type === 'Face') { state.face = eq.texture; }
              else if (eq.type === 'Hat' && state.editorAccessories.length < 4) {
                state.editorAccessories.push({ ...eq, ...pickOffsets(a) }); // #2131/#2230/#2312 copy: never mutate shared equipCache records
                if (eq.warning) state.failures.push({ id: a.id, name: a.name, type: rawType, reason: eq.warning });
              }
              state.loaded++;
            } catch (e) {
              state.skipped++;
              state.failures.push({ id: a.id, name: a.name, type: rawType, reason: e.message || 'Load failed' });
            }
          }
        }));
        state.torso = compose(shirtImg, pantsImg, tshirtImg);
        state.accessories = hasBase ? [...state.baseAccessories, ...state.editorAccessories] : state.editorAccessories;
        state.status = 'ready';
        return {
          loaded: state.loaded, skipped: state.skipped,
          clothes: !!(shirtImg || pantsImg || tshirtImg),
          accessories: state.accessories.length,
          editorAccessories: state.editorAccessories.length,
          baseAccessories: state.baseAccessories.length,
          failures: state.failures,
        };
      })();
      return state.promise;
    }

    async function loadCharacter(name, zip, preparsed = null) {
      const zipCopy = zip instanceof ArrayBuffer ? zip.slice(0) : null;
      const data = preparsed || await window.AvatarCharacter.parse(zipCopy ? zipCopy.slice(0) : zip);
      const key = String(String(name).startsWith('https://api.websim.com/blobs/') || /^[A-Za-z0-9_]{1,20}$/.test(name || '') ? name : data.name).toLowerCase();
      const canonicalName = /^[A-Za-z0-9_]{1,20}$/.test(name || '') ? name : (String(name).startsWith('https://api.websim.com/blobs/') ? name : data.name);
      if (zipCopy) sharedCharacters.set(key, { name: canonicalName, zip: zipCopy, data });
      const textures = {};
      for (const [n, bytes] of Object.entries(data.textures)) {
        try {
          const image = await img(bytes);
          if (image.width > gl.getParameter(gl.MAX_TEXTURE_SIZE) || image.height > gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw Error('texture exceeds this device’s GPU size limit');
          textures[n] = tex(image);
        } catch (e) { throw Error(n + ': ' + e.message); }
      }
      const make = (g) => ({
        geo: buffers(g), texture: textures[g.material.texture] || null,
        color: g.material.color || [1, 1, 1, 1], scale: [1, 1, 1],
        part: g.part, offset: g.offset, rigPart: g.rigPart,
        bindOffset: g.bindOffset, rigOffset: g.rigOffset,
      });
      const baseAcc = data.accessories.map(make);
      const state = {
        status: 'ready', character: true, composed: false, canonicalName,
        zipBytes: zipCopy, rawData: data, rig: data.rig,
        parts: Object.fromEntries(Object.entries(data.parts).map(([n, g]) => [n, (Array.isArray(g) ? g : [g]).map(make)])),
        baseAccessories: baseAcc, editorAccessories: [], accessories: baseAcc,
        face: null, shirt: null, pants: null, torso: null,
        loaded: (data.rig ? 15 : 6) + baseAcc.length, skipped: 0, failures: [],
      };
      appearances.set(key, state);
      if (appearances.size > 24) {
        const keep = new Set([...preloadPins, key, String(window.__avatarAppearanceName || '').toLowerCase(), ...[...(window.__multiplayer?.remotes?.values() || [])].map((r) => String(r.avatarUrl || r.avatarName || '').toLowerCase())]);
        for (const [n, s] of appearances) {
          if (appearances.size <= 24) break;
          if (keep.has(n) || !s.character || s.composed || s.status !== 'ready') continue;
          const meshes = [...Object.values(s.parts).flat(), ...s.accessories], texSet = new Set();
          for (const p of meshes) { gl.deleteBuffer(p.geo.v); gl.deleteBuffer(p.geo.u); if (p.texture) texSet.add(p.texture); }
          for (const t of texSet) gl.deleteTexture(t);
          appearances.delete(n);
        }
      }
      return { name: canonicalName, loaded: state.loaded, rigType: state.rig ? 'R15' : 'R6', bodyParts: state.rig ? 15 : 6, accessories: state.accessories.length, skipped: 0, failures: [] };
    }

    function getCharacterSource(name) {
      if (!name) return null;
      const key = String(name).toLowerCase(), s = appearances.get(key);
      if (s?.character && !s.composed && s.rawData) return { name: s.canonicalName || name, zip: s.zipBytes ? s.zipBytes.slice(0) : null, data: s.rawData };
      if (s?.composed && s.baseCharacter) return getCharacterSource(s.baseCharacter);
      const shared = sharedCharacters.get(key);
      return shared ? { name: shared.name, zip: shared.zip.slice(0), data: shared.data } : null;
    }
    function removeAppearance(name) {
      const key = String(name || '').toLowerCase(), s = appearances.get(key);
      if (!s) return;
      if (s.torso) gl.deleteTexture(s.torso);
      appearances.delete(key);
    }
    function ensure(name) {
      if (!name) return null;
      const key = String(name).toLowerCase();
      if (!appearances.has(key)) {
        const shared = sharedCharacters.get(key);
        if (shared) {
          const holder = { status: 'loading', promise: null };
          appearances.set(key, holder);
          holder.promise = loadCharacter(shared.name, shared.zip, shared.data).catch(() => {
            if (appearances.get(key) === holder) holder.status = 'unavailable';
            return { status: 'unavailable' };
          });
          return holder;
        }
        if (key !== 'judahsfriendtrey' && !String(name).startsWith('https://api.websim.com/blobs/')) {
          const s = { status: 'unavailable' };
          appearances.set(key, s);
          return s;
        }
        let resolve;
        const holder = { status: 'queued', promise: new Promise((r) => { resolve = r; }) };
        appearances.set(key, holder);
        remoteQueue.push(async () => {
          try {
            if (window.__multiplayer?.sessionReplaced) return;
            holder.status = 'fetching';
            const r = await fetch(key === 'judahsfriendtrey' ? 'avatars/judahsfriendtrey.zip' : name, { signal: AbortSignal.timeout(30000) });
            if (!r.ok) throw Error('Saved character HTTP ' + r.status);
            await loadCharacter(name, await r.arrayBuffer());
          } catch { holder.status = 'unavailable'; }
          finally { resolve({ status: appearances.get(key)?.status || 'unavailable' }); }
        });
        pumpRemote();
      }
      return appearances.get(key);
    }

    function ensureRemote(baseName, editorAssets) {
      if (!Array.isArray(editorAssets) || !editorAssets.length) { const state=ensure(baseName); return { key: baseName, state, loading: ['queued','fetching','loading'].includes(state?.status) }; }
      const baseReady = !baseName || ensure(baseName)?.status === 'ready';
      if (baseName && !baseReady) { const state=ensure(baseName); return { key: baseName, state, loading: ['queued','fetching','loading'].includes(state?.status) }; }
      const sig = editorAssets.map((a) => { const o = pickOffsets(a); const has = o.x !== undefined || o.y !== undefined || o.z !== undefined || o.s !== undefined; return String(a.type) + ':' + String(a.id) + (has ? ':' + [o.x || 0, o.y || 0, o.z || 0, o.s || 1].join('/') : ''); }).join(','); // #2131/#2230/#2312 offsets are part of the composite-cache key
      const compKey = ('remote-comp:' + (baseName || 'noob') + ':' + sig).toLowerCase();
      if (!appearances.has(compKey)) {
        const mapped = editorAssets.map((a) => ({ id: String(a.id), name: String(a.type), assetType: a.type, ...pickOffsets(a) })); // #2131/#2230/#2312
        load({ name: compKey, baseCharacter: baseName || null, assets: mapped }).catch(() => { const s=appearances.get(compKey); if(s?.status==='loading')s.status='unavailable'; });
      }
      const st = appearances.get(compKey);
      return st?.status === 'ready' ? { key: compKey, state: st, loading: false } : { key: baseName, state: ensure(baseName), loading: ['queued','fetching','loading'].includes(st?.status) };
    }

    function preload(name) {
      const s = ensure(name);
      if (!s) return Promise.resolve({ status: 'ready' });
      if (s.status === 'ready' || s.status === 'unavailable') return Promise.resolve({ status: s.status });
      return Promise.resolve(s.promise).then(() => ({ status: appearances.get(String(name).toLowerCase())?.status || 'unavailable' }));
    }
    function pinPreload(names) { preloadPins = new Set(names); }

    function draw(g, texture, scale, model, color) {
      gl.bindBuffer(gl.ARRAY_BUFFER, g.v);
      gl.enableVertexAttribArray(b.pos); gl.vertexAttribPointer(b.pos, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(b.normal); gl.vertexAttribPointer(b.normal, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.u);
      gl.enableVertexAttribArray(b.uv); gl.vertexAttribPointer(b.uv, 2, gl.FLOAT, false, 8, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1f(b.loc.uUseFace, texture ? 1 : 0);
      gl.uniform3fv(b.loc.uScale, scale);
      gl.uniformMatrix4fv(b.loc.uModel, false, new Float32Array(model));
      gl.uniform4fv(b.loc.uColor, color);
      gl.uniform1f(b.loc.uFloor, 0);
      gl.drawArrays(gl.TRIANGLES, 0, g.count);
    }

    function face(name) {
      const s = ensure(name);
      return s?.status === 'ready' ? (s.face || null) : null;
    }
    function rigPose(name, matrices, state) {
      const s = ensure(name);
      return s?.rig ? window.R15Rig.pose(s.rig, matrices, state) : matrices;
    }
    function part(name, body, model, color, scale, frames) {
      const s = ensure(name);
      if (!s || s.status !== 'ready') return false;
      if (body === 'Head' && s.face) return false;
      if (s.character) {
        const clothTex = body === 'Head' ? null : (body === 'Torso' ? s.torso : body.includes('Arm') ? s.shirt : s.pants);
        if (!s.rig && clothTex) { draw(clothBuffers[body], clothTex, scale, model, color || [1, 1, 1, 1]); return true; }
        const chunks = s.parts?.[body];
        if (!chunks) return false;
        for (const p of chunks) {
          const f = p.rigPart === 'Head' ? (frames?.R15Head || frames?.Head) : frames?.[p.rigPart];
          const frame = f && p.bindOffset ? A.multiply(f, A.fromCFrame({ position: p.bindOffset.map((v) => -v), rotation: IDENT_ROT })) : model;
          draw(p.geo, clothTex || p.texture, [1, 1, 1], frame, clothTex ? (color || [1, 1, 1, 1]) : p.color);
        }
        return true;
      }
      if (body === 'Head') return false;
      const t = body === 'Torso' ? s.torso : body.includes('Arm') ? s.shirt : s.pants;
      if (!t) return false;
      draw(clothBuffers[body], t, scale, model, color || [1, 1, 1, 1]);
      return true;
    }

    function computeEditorAccessoryFrame(a, isRig, head, frames) {
      const spec = ATTACHMENT_SPEC[a.attachment] || ATTACHMENT_SPEC.HatAttachment;
      if (!frames && spec.r6Part !== 'Head') return null;
      let baseFrame = null, anchor = spec.r6Anchor;
      if (spec.r6Part === 'Head') {
        baseFrame = (isRig ? (frames?.R15Head || frames?.Head) : null) || frames?.R15Head || head;
        anchor = spec.r6Anchor;
      } else if (isRig && frames?.[spec.r15Part]) {
        baseFrame = frames[spec.r15Part];
        anchor = spec.r15Anchor;
      } else if (frames?.[spec.r15Part]) {
        baseFrame = frames[spec.r15Part];
        anchor = spec.r15Anchor;
      } else if (frames?.[spec.r6Part]) {
        baseFrame = frames[spec.r6Part];
        anchor = spec.r6Anchor;
      }
      if (!baseFrame) return null;
      const aX = sanitizeOff(a.x), aY = sanitizeOff(a.y), aZ = sanitizeOff(a.z); // #2131/#2230/#2312 head-local anchor offset
      const anchorMat = A.fromCFrame({ position: (aX || aY || aZ) ? [anchor[0] + aX, anchor[1] + aY, anchor[2] + aZ] : anchor, rotation: IDENT_ROT });
      const attachMat = A.fromCFrame({ position: a.ap || [0, 0, 0], rotation: a.apRot || IDENT_ROT });
      const meshOffMat = A.fromCFrame({ position: a.offset || [0, 0, 0], rotation: IDENT_ROT });
      return A.multiply(baseFrame, A.multiply(A.multiply(anchorMat, A.inverseRigid(attachMat)), meshOffMat));
    }

    function placements(name, head, frames) {
      const s = ensure(name);
      if (!s || s.status !== 'ready') return [];
      if (s.character) {
        const out = [];
        const baseList = s.baseAccessories || [];
        for (let i = 0; i < baseList.length; i++) {
          const a = baseList[i];
          if (a.editorItem) continue;
          const rigFrame = a.rigPart === 'Head' ? (frames?.R15Head || frames?.Head) : frames?.[a.rigPart];
          const base = rigFrame || (a.part === 'Head' ? head : frames?.[a.part]);
          if (base) out.push({ index: i, frame: A.multiply(base, A.fromCFrame({ position: rigFrame ? a.rigOffset : a.offset, rotation: IDENT_ROT })) });
        }
        const edStart = baseList.length, edList = s.editorAccessories || [];
        for (let j = 0; j < edList.length; j++) {
          const frame = computeEditorAccessoryFrame(edList[j], !!s.rig, head, frames);
          if (frame) out.push({ index: edStart + j, frame });
        }
        return out;
      }
      const out = [];
      for (let i = 0; i < s.accessories.length; i++) {
        const frame = computeEditorAccessoryFrame(s.accessories[i], false, head, frames);
        if (frame) out.push({ index: i, frame });
      }
      return out;
    }

    function accessoryAt(name, index, model) {
      const s = ensure(name), a = s?.accessories?.[index];
      if (!a) return;
      const sm = sanitizeS(a.s); // #2312 per-item scale multiplier (neutral 1 for legacy/base entries)
      draw(a.geo, a.texture, (a.scale || [1, 1, 1]).map((v) => v * sm), model, a.color || [1, 1, 1, 1]);
    }
    function accessories(name, head, frames) {
      for (const x of placements(name, head, frames)) accessoryAt(name, x.index, x.frame);
    }

    return Object.freeze({
      load, loadCharacter, getCharacterSource, removeAppearance,
      ensure, ensureRemote, preload, pinPreload,
      applyOverride, loadEquipAsset: loadCachedEquip, face,
      rigPose, part, accessories, placements, accessoryAt,
      inspect: (name) => {
        const s = appearances.get(String(name || '').toLowerCase());
        return s ? {
          status: s.status, character: !!s.character, composed: !!s.composed,
          baseCharacter: s.baseCharacter || null, rigType: s.rig ? 'R15' : 'R6',
          loaded: s.loaded, skipped: s.skipped,
          accessories: s.accessories?.length || 0,
          baseAccessories: s.baseAccessories?.length || 0,
          editorAccessories: s.editorAccessories?.length || 0,
          failures: s.failures || [],
        } : null;
      },
    });
  }

  window.AvatarAssets = Object.freeze({
    create,
    clampY: sanitizeOff, clampOff: sanitizeOff, clampS: sanitizeS, // #2131/#2230/#2312 single source of truth
    Y_BOUND: OFF_BOUND, OFF_BOUND, S_MIN, S_MAX,
    createRenderer: create,
    meshGeometry,
    parseRbxMesh: meshGeometry,
    parseAssetModel,
    validateCatalogAssetId,
    ATTACHMENT_SPEC: Object.freeze(ATTACHMENT_SPEC),
  });
})();
