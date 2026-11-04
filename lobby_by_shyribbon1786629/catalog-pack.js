/* Bundled Catalog Pack: 8 Classic Faces, 7 Classic Shirts, 9 Classic Pants, 3 Classic T-Shirts,
 * 7 Hair Models, 4 Shoulder Accessories, and verified Roblox accessories. */
(() => {
  // qwen patch (#2170 P0): runtime-generated relative asset URLs do not carry the draft
  // ?v= parameter, so on a draft revision they resolve against current_version and 404.
  // Append the document's own v param to relative asset paths; no-op when absent (promoted/main).
  const __assetV = new URLSearchParams(location.search).get('v');
  const __assetUrl = (p) => (typeof p === 'string' && p && __assetV &&
    !/^(https?:|data:|blob:|\/)/.test(p) && !/[?&]v=/.test(p))
    ? p + (p.includes('?') ? '&' : '?') + 'v=' + __assetV : p;
  const __apiUrl = (p) => (typeof p === 'string' && p.startsWith('/api/') && __assetV && !/[?&]v=/.test(p))
    ? p + (p.includes('?') ? '&' : '?') + 'v=' + __assetV : p;
  const __PATH_FIELDS = ['thumb', 'localUrl', 'meshUrl', 'textureUrl'];
  'use strict';

  const ITEMS = [
    // Classic Faces (8)
    { key: 'cat:face-375226', assetId: 'cat:face-375226', type: 'Face', category: 'faces', title: 'Man Face', subtitle: 'Classic Face · #375226', thumb: 'assets/catalog/thumbs/face-375226.png', localUrl: 'assets/catalog/faces/375226.png', available: true },
    { key: 'cat:face-377435', assetId: 'cat:face-377435', type: 'Face', category: 'faces', title: 'Winning Smile', subtitle: 'Classic Face · #377435', thumb: 'assets/catalog/thumbs/face-377435.png', localUrl: 'assets/catalog/faces/377435.png', available: true },
    { key: 'cat:face-377436', assetId: 'cat:face-377436', type: 'Face', category: 'faces', title: 'Awesome Smile', subtitle: 'Classic Face · #377436', thumb: 'assets/catalog/thumbs/face-377436.png', localUrl: 'assets/catalog/faces/377436.png', available: true },
    { key: 'cat:face-392084', assetId: 'cat:face-392084', type: 'Face', category: 'faces', title: 'Epic Happy Face', subtitle: 'Classic Face · #392084', thumb: 'assets/catalog/thumbs/face-392084.png', localUrl: 'assets/catalog/faces/392084.png', available: true },
    { key: 'cat:face-376363', assetId: 'cat:face-376363', type: 'Face', category: 'faces', title: 'Beast Mode', subtitle: 'Classic Face (512×592 RGBA) · #376363', thumb: 'assets/catalog/thumbs/face-376363.png', localUrl: 'assets/catalog/faces/376363.png', available: true },
    { key: 'cat:face-379507', assetId: 'cat:face-379507', type: 'Face', category: 'faces', title: 'Woman Face', subtitle: 'Classic Face · #379507', thumb: 'assets/catalog/thumbs/face-379507.png', localUrl: 'assets/catalog/faces/379507.png', available: true },
    { key: 'cat:face-376123', assetId: 'cat:face-376123', type: 'Face', category: 'faces', title: 'Drool Face', subtitle: 'Classic Face · #376123', thumb: 'assets/catalog/thumbs/face-376123.png', localUrl: 'assets/catalog/faces/376123.png', available: true },
    { key: 'cat:face-381544', assetId: 'cat:face-381544', type: 'Face', category: 'faces', title: 'Fearful / Worried', subtitle: 'Classic Face · #381544', thumb: 'assets/catalog/thumbs/face-381544.png', localUrl: 'assets/catalog/faces/381544.png', available: true },

    // Classic Shirts (7 — 585×559 R6 wrap templates)
    { key: 'cat:shirt-375220', assetId: 'cat:shirt-375220', type: 'Shirt', category: 'shirts', title: 'Blue Moto Jacket', subtitle: 'Classic R6 Shirt · #375220', thumb: 'assets/catalog/thumbs/shirt-375220.png', localUrl: 'assets/catalog/shirts/375220.png', available: true },
    { key: 'cat:shirt-379312', assetId: 'cat:shirt-379312', type: 'Shirt', category: 'shirts', title: 'Red Varsity Hoodie', subtitle: 'Classic R6 Shirt · #379312', thumb: 'assets/catalog/thumbs/shirt-379312.png', localUrl: 'assets/catalog/shirts/379312.png', available: true },
    { key: 'cat:shirt-375219', assetId: 'cat:shirt-375219', type: 'Shirt', category: 'shirts', title: 'Blue Plaid Flannel', subtitle: 'Classic R6 Shirt · #375219', thumb: 'assets/catalog/thumbs/shirt-375219.png', localUrl: 'assets/catalog/shirts/375219.png', available: true },
    { key: 'cat:shirt-392777', assetId: 'cat:shirt-392777', type: 'Shirt', category: 'shirts', title: 'Pink Layered Tee', subtitle: 'Classic R6 Shirt · #392777', thumb: 'assets/catalog/thumbs/shirt-392777.png', localUrl: 'assets/catalog/shirts/392777.png', available: true },
    { key: 'cat:shirt-375221', assetId: 'cat:shirt-375221', type: 'Shirt', category: 'shirts', title: 'Green #8 Jersey', subtitle: 'Classic R6 Shirt · #375221', thumb: 'assets/catalog/thumbs/shirt-375221.png', localUrl: 'assets/catalog/shirts/375221.png', available: true },
    { key: 'cat:shirt-375218', assetId: 'cat:shirt-375218', type: 'Shirt', category: 'shirts', title: 'Guitar Leather Jacket', subtitle: 'Classic R6 Shirt · #375218', thumb: 'assets/catalog/thumbs/shirt-375218.png', localUrl: 'assets/catalog/shirts/375218.png', available: true },
    { key: 'cat:shirt-392784', assetId: 'cat:shirt-392784', type: 'Shirt', category: 'shirts', title: 'Arcade Pop Leather Jacket', subtitle: 'Classic R6 Shirt · #392784', thumb: 'assets/catalog/thumbs/shirt-392784.png', localUrl: 'assets/catalog/shirts/392784.png', available: true },

    // Classic Pants (9 — 585×559 R6 wrap templates)
    { key: 'cat:pants-379241', assetId: 'cat:pants-379241', type: 'Pants', category: 'pants', title: 'Dark Green Jeans & Skate Shoes', subtitle: 'Classic R6 Pants · #379241', thumb: 'assets/catalog/thumbs/pants-379241.png', localUrl: 'assets/catalog/pants/379241.png', available: true },
    { key: 'cat:pants-379242', assetId: 'cat:pants-379242', type: 'Pants', category: 'pants', title: 'Burgundy Denim Jeans', subtitle: 'Classic R6 Pants · #379242', thumb: 'assets/catalog/thumbs/pants-379242.png', localUrl: 'assets/catalog/pants/379242.png', available: true },
    { key: 'cat:pants-379244', assetId: 'cat:pants-379244', type: 'Pants', category: 'pants', title: 'Blue Jeans & Galaxy Top Outfit', subtitle: 'Classic R6 Outfit Pants · #379244', thumb: 'assets/catalog/thumbs/pants-379244.png', localUrl: 'assets/catalog/pants/379244.png', available: true },
    { key: 'cat:pants-379247', assetId: 'cat:pants-379247', type: 'Pants', category: 'pants', title: 'Black & Neon Cyan Ripped Pants', subtitle: 'Classic R6 Pants · #379247', thumb: 'assets/catalog/thumbs/pants-379247.png', localUrl: 'assets/catalog/pants/379247.png', available: true },
    { key: 'cat:pants-379248', assetId: 'cat:pants-379248', type: 'Pants', category: 'pants', title: 'Black Jeans & Teal Sneakers', subtitle: 'Classic R6 Pants · #379248', thumb: 'assets/catalog/thumbs/pants-379248.png', localUrl: 'assets/catalog/pants/379248.png', available: true },
    { key: 'cat:pants-379252', assetId: 'cat:pants-379252', type: 'Pants', category: 'pants', title: 'Chain Shorts & Lace-Up Boots', subtitle: 'Classic R6 Pants · #379252', thumb: 'assets/catalog/thumbs/pants-379252.png', localUrl: 'assets/catalog/pants/379252.png', available: true },
    { key: 'cat:pants-379258', assetId: 'cat:pants-379258', type: 'Pants', category: 'pants', title: 'Charcoal Slacks & Dress Shoes', subtitle: 'Classic R6 Pants · #379258', thumb: 'assets/catalog/thumbs/pants-379258.png', localUrl: 'assets/catalog/pants/379258.png', available: true },
    { key: 'cat:pants-392785', assetId: 'cat:pants-392785', type: 'Pants', category: 'pants', title: 'Cyber Kneepad Armor Pants', subtitle: 'Classic R6 Pants · #392785', thumb: 'assets/catalog/thumbs/pants-392785.png', localUrl: 'assets/catalog/pants/392785.png', available: true },
    { key: 'cat:pants-393066', assetId: 'cat:pants-393066', type: 'Pants', category: 'pants', title: 'Neon Magenta Sci-Fi Greaves', subtitle: 'Classic R6 Pants · #393066', thumb: 'assets/catalog/thumbs/pants-393066.png', localUrl: 'assets/catalog/pants/393066.png', available: true },

    // Classic T-Shirts (3 — 128×128 front-torso decals)
    { key: 'cat:tshirt-377401', assetId: 'cat:tshirt-377401', type: 'TShirt', category: 'tshirts', title: 'Bloxxer Brick Blast', subtitle: 'Classic T-Shirt · #377401', thumb: 'assets/catalog/thumbs/tshirt-377401.png', localUrl: 'assets/catalog/tshirts/377401.png', available: true },
    { key: 'cat:tshirt-391686', assetId: 'cat:tshirt-391686', type: 'TShirt', category: 'tshirts', title: 'Roblox Squad Emblem', subtitle: 'Classic T-Shirt · #391686', thumb: 'assets/catalog/thumbs/tshirt-391686.png', localUrl: 'assets/catalog/tshirts/391686.png', available: true },
    { key: 'cat:tshirt-377397', assetId: 'cat:tshirt-377397', type: 'TShirt', category: 'tshirts', title: 'Builder Hammer Badge', subtitle: 'Classic T-Shirt · #377397', thumb: 'assets/catalog/thumbs/tshirt-377397.png', localUrl: 'assets/catalog/tshirts/377397.png', available: true },

    // Bundled Hair Models (7)
    { key: 'cat:hair-pal', assetId: 'cat:hair-pal', type: 'Hat', category: 'hair', title: 'Pal Hair', subtitle: '3D Hair Accessory · HairAttachment', thumb: 'assets/catalog/thumbs/hair-pal.png', meshUrl: 'assets/catalog/meshes/hair-pal.mesh', textureUrl: 'assets/catalog/textures/hair-pal.png', attachment: 'HairAttachment', ap: [0, 0.28, 0.10], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:hair-blue-swoosh', assetId: 'cat:hair-blue-swoosh', type: 'Hat', category: 'hair', title: 'Blue Swoosh Hair', subtitle: '3D Hair Accessory · HairAttachment', thumb: 'assets/catalog/thumbs/hair-blue-swoosh.png', meshUrl: 'assets/catalog/meshes/hair-blue-swoosh.mesh', textureUrl: 'assets/catalog/textures/hair-blue-swoosh.png', attachment: 'HairAttachment', ap: [0, 0.92, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:hair-true-blue', assetId: 'cat:hair-true-blue', type: 'Hat', category: 'hair', title: 'True Blue Hair', subtitle: '3D Hair Accessory · HairAttachment', thumb: 'assets/catalog/thumbs/hair-true-blue.png', meshUrl: 'assets/catalog/meshes/hair-true-blue.mesh', textureUrl: 'assets/catalog/textures/hair-true-blue.png', attachment: 'HairAttachment', ap: [0, 0.28, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:hair-brown-charmer', assetId: 'cat:hair-brown-charmer', type: 'Hat', category: 'hair', title: 'Brown Hair Dude', subtitle: '3D Hair Accessory · HairAttachment', thumb: 'assets/catalog/thumbs/hair-brown-charmer.png', meshUrl: 'assets/catalog/meshes/hair-brown-charmer.mesh', textureUrl: 'assets/catalog/textures/hair-brown-charmer.png', attachment: 'HairAttachment', ap: [0, 0.28, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:hair-crazy-gamedev', assetId: 'cat:hair-crazy-gamedev', type: 'Hat', category: 'hair', title: 'Crazy Game Dev Hair', subtitle: '3D Hair Accessory · HairAttachment', thumb: 'assets/catalog/thumbs/hair-crazy-gamedev.png', meshUrl: 'assets/catalog/meshes/hair-crazy-gamedev.mesh', textureUrl: 'assets/catalog/textures/hair-crazy-gamedev.png', attachment: 'HairAttachment', ap: [0, 0.95, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:hair-big-brown', assetId: 'cat:hair-big-brown', type: 'Hat', category: 'hair', title: 'Big Style Brown Hair', subtitle: '3D Hair Accessory · HairAttachment', thumb: 'assets/catalog/thumbs/hair-big-brown.png', meshUrl: 'assets/catalog/meshes/hair-big-brown.mesh', textureUrl: 'assets/catalog/textures/hair-big-brown.png', attachment: 'HairAttachment', ap: [0, 1.12, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:hair-shaggy', assetId: 'cat:hair-shaggy', type: 'Hat', category: 'hair', title: 'Classic Shaggy Hair', subtitle: '3D Hair Accessory · HairAttachment', thumb: 'assets/catalog/thumbs/hair-shaggy.png', meshUrl: 'assets/catalog/meshes/hair-shaggy.mesh', textureUrl: 'assets/catalog/textures/hair-shaggy.png', attachment: 'HairAttachment', ap: [0, 0.94, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },

    // Bundled Shoulder Models (4)
    { key: 'cat:shoulder-sonic', assetId: 'cat:shoulder-sonic', type: 'Hat', category: 'shoulder', title: 'Classic Sonic Shoulder Plushie', subtitle: 'Right Shoulder Accessory', thumb: 'assets/catalog/thumbs/shoulder-sonic.png', meshUrl: 'assets/catalog/meshes/shoulder-sonic.mesh', textureUrl: 'assets/catalog/textures/shoulder-sonic.png', attachment: 'RightShoulderAttachment', ap: [0, -0.58, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:shoulder-business-cat', assetId: 'cat:shoulder-business-cat', type: 'Hat', category: 'shoulder', title: 'Business Cat Shoulder Pal', subtitle: 'Left Shoulder Accessory', thumb: 'assets/catalog/thumbs/shoulder-business-cat.png', meshUrl: 'assets/catalog/meshes/shoulder-business-cat.mesh', textureUrl: 'assets/catalog/textures/shoulder-business-cat.png', attachment: 'LeftShoulderAttachment', ap: [0, -0.65, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:shoulder-twitter-bird', assetId: 'cat:shoulder-twitter-bird', type: 'Hat', category: 'shoulder', title: 'The Bird Says...', subtitle: 'Right Shoulder Accessory', thumb: 'assets/catalog/thumbs/shoulder-twitter-bird.png', meshUrl: 'assets/catalog/meshes/shoulder-twitter-bird.mesh', textureUrl: 'assets/catalog/textures/shoulder-twitter-bird.png', attachment: 'RightShoulderAttachment', ap: [0, 0.02, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },
    { key: 'cat:shoulder-gingerbread', assetId: 'cat:shoulder-gingerbread', type: 'Hat', category: 'shoulder', title: 'Gingerbread Headrow', subtitle: 'Dual-Shoulder Collar Accessory', thumb: 'assets/catalog/thumbs/shoulder-gingerbread.png', meshUrl: 'assets/catalog/meshes/shoulder-gingerbread.mesh', textureUrl: 'assets/catalog/textures/shoulder-gingerbread.png', attachment: 'NeckAttachment', ap: [0, 0.02, 0], scale: [1, 1, 1], offset: [0, 0, 0], available: true },

    // Back Accessory Fixture (#2000 — Public Roblox Asset Delivery verified)
    { key: 'asset:1829157894', assetId: '1829157894', type: 'Hat', category: 'back', title: 'Jurassic World Backpack', subtitle: 'Back Accessory · BodyBackAttachment · #1829157894', thumb: 'assets/catalog/thumbs/back-1829157894.png', available: true },

    // Classic Roblox Hats & Hairs (public IDs with official Roblox thumbnails)
    { key: 'asset:1028606', assetId: '1028606', type: 'Hat', category: 'hats', title: 'Red Baseball Cap', subtitle: 'Classic Roblox Hat · #1028606', thumb: 'assets/catalog/thumbs/asset-1028606.png', available: true },
    { key: 'asset:1309918', assetId: '1309918', type: 'Hat', category: 'hats', title: 'Blue Winter Cap', subtitle: 'Classic Roblox Hat · #1309918', thumb: 'assets/catalog/thumbs/asset-1309918.png', available: true },
    { key: 'asset:151675683', assetId: '151675683', type: 'Hat', category: 'hats', title: 'Hero Mask', subtitle: 'Face Accessory · #151675683', thumb: 'assets/catalog/thumbs/asset-151675683.png', available: true },
    { key: 'asset:48474294', assetId: '48474294', type: 'Hat', category: 'hair', title: 'Beautiful Hair', subtitle: 'Roblox Hair · #48474294', thumb: 'assets/catalog/thumbs/asset-48474294.png', available: true },
    { key: 'asset:62234425', assetId: '62234425', type: 'Hat', category: 'hair', title: 'Brown Charmer Hair', subtitle: 'Roblox Hair · #62234425', thumb: 'assets/catalog/thumbs/asset-62234425.png', available: true },
    { key: 'asset:20573078', assetId: '20573078', type: 'Hat', category: 'hair', title: 'Sideswept Shaggy', subtitle: 'Roblox Hair · #20573078', thumb: 'assets/catalog/thumbs/asset-20573078.png', available: true },
  ].map((x) => { const o = { ...x }; for (const k of __PATH_FIELDS) if (typeof o[k] === 'string') o[k] = __assetUrl(o[k]); return Object.freeze(o); });

  const BY_ID = new Map();
  const SHARED = [];
  let COMBINED = Object.freeze([...ITEMS]);
  for (const it of ITEMS) {
    BY_ID.set(it.key, it);
    if (it.assetId) BY_ID.set(String(it.assetId), it);
  }

  function syncRegistered() {
    COMBINED = Object.freeze([...ITEMS, ...SHARED]);
    window.CatalogCollection?.registerItems?.(COMBINED);
    window.dispatchEvent(new CustomEvent('catalog:shared-updated', { detail: { items: COMBINED } }));
  }

  function mergeShared(list) {
    if (!Array.isArray(list) || !list.length) return 0;
    let added = 0;
    for (const raw of list) {
      if (!raw || !raw.key || !raw.assetId) continue;
      const aid = String(raw.assetId).trim();
      if (BY_ID.has(raw.key) || BY_ID.has(aid)) continue;
      const o = { ...raw, available: raw.available !== false };
      for (const k of __PATH_FIELDS) if (typeof o[k] === 'string') o[k] = __assetUrl(o[k]);
      const frozen = Object.freeze(o);
      SHARED.push(frozen);
      BY_ID.set(frozen.key, frozen);
      BY_ID.set(aid, frozen);
      added++;
    }
    if (added > 0) syncRegistered();
    return added;
  }

  window.CatalogPack = Object.freeze({
    get items() { return COMBINED; },
    byId(id) { return BY_ID.get(String(id || '').trim()) || null; },
    assetUrl: __assetUrl,
    apiUrl: __apiUrl,
    mergeShared,
  });

  if (window.CatalogCollection?.registerItems) {
    window.CatalogCollection.registerItems(COMBINED);
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      window.CatalogCollection?.registerItems?.(COMBINED);
    }, { once: true });
  }

  fetch(__apiUrl('/api/catalog-shared'), { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (!j || typeof j !== 'object') return;
      window.__canPublishSharedCatalog = Boolean(j.canPublishToCatalog);
      window.dispatchEvent(new CustomEvent('catalog:auth-state', { detail: { canPublish: window.__canPublishSharedCatalog } }));
      if (Array.isArray(j.items) && j.items.length) mergeShared(j.items);
    })
    .catch(() => {});
})();
