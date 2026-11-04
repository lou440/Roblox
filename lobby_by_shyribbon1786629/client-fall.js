/* Block drop, client side (#4166 / #4495 / #4546).
 *
 * The server is still the owner of the world: it decides what is persisted. But the
 * player must not depend on that round-trip to SEE a tower collapse, because a stale
 * room, a slow socket or a refused broadcast all look identical on screen: nothing
 * happens.
 *
 * So: whenever a block disappears from the local world for any reason (my own delete,
 * another player's delete, a rocket, a snapshot correction), this file re-checks which
 * blocks still touch the ground and drops the ones that do not - with the exact same
 * falling animation the server's `buildFall` message uses (`window.__buildFallFx`),
 * and it reports each dropped block back to the server as a normal delete so the room
 * agrees and it stays gone after a rejoin.
 *
 * Safe by construction:
 *  - it only ever removes blocks that are NOT connected to the ground;
 *  - "connected" is generous (26 neighbours, touching counts), so it never drops
 *    anything that is merely hanging next to something else;
 *  - a world with nothing deleted is never touched;
 *  - it cannot loop (internal flag) and it never drops more than MAX_DROP at once.
 */
(() => {
  'use strict';
  if (window.ClientFall && window.ClientFall.ready) return;

  const SIZES = { block: [4, 4, 4], full: [3, 3, 3], tiny: [1, 1, 1], slab: [4, 1, 4], pillar: [1, 4, 1] };
  const MAX_DROP = 64;
  const NEIGHBOURS = (() => {
    const out = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      if (dx || dy || dz) out.push([dx, dy, dz]);
    }
    return out;
  })();

  /* Pure: given a list of blocks ({x,y,z,...}), return the keys of every block that
   * cannot reach the ground by touching other blocks. Ground = anything at y <= 0. */
  function unsupported(list, key) {
    const k = key || ((x, y, z) => x + ',' + y + ',' + z);
    const byKey = new Map();
    for (const b of list || []) {
      if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y) || !Number.isFinite(b.z)) continue;
      byKey.set(k(b.x, b.y, b.z), b);
    }
    const supported = new Set();
    const queue = [];
    for (const [kk, b] of byKey) if (b.y <= 0) { supported.add(kk); queue.push(b); }
    for (let i = 0; i < queue.length; i++) {
      const b = queue[i];
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const nk = k(b.x + dx, b.y + dy, b.z + dz);
        if (supported.has(nk) || !byKey.has(nk)) continue;
        supported.add(nk);
        queue.push(byKey.get(nk));
      }
    }
    const out = [];
    for (const kk of byKey.keys()) if (!supported.has(kk)) out.push(kk);
    return out;
  }

  const colorFor = (hexColor) => (/^#[a-f0-9]{6}$/i.test(hexColor || '')
    ? [1, 3, 5].map((i) => parseInt(hexColor.slice(i, i + 2), 16) / 255).concat(1)
    : [0.55, 0.55, 0.58, 1]);

  let internal = false;
  let scheduled = false;
  let installed = false;

  function fx(block) {
    const arr = (window.__buildFallFx = window.__buildFallFx || []);
    const size = SIZES[block.variant] || SIZES.block;
    arr.push({
      start: performance.now() / 1000,
      center: [block.x * 4, block.y * 4 + size[1] / 2, block.z * 4],
      size,
      color: colorFor(block.color),
    });
    if (arr.length > 240) arr.shift();
  }

  function dropUnsupported() {
    const gw = window.GridWorld;
    if (!gw || !gw.blocks || !gw.apply) return 0;
    if (internal) return 0;
    const doomed = unsupported([...gw.blocks.values()], gw.key);
    if (!doomed.length) return 0;
    const list = doomed.slice(0, MAX_DROP);
    internal = true;
    try {
      for (const kk of list) {
        const block = gw.blocks.get(kk);
        if (!block) continue;
        const copy = { x: block.x, y: block.y, z: block.z, color: block.color, variant: block.variant || 'block' };
        gw.apply({ action: 'delete', key: kk });          // gone from the local world now
        fx(copy);                                          // the drop you actually see
        try { window.__multiplayer?.sendBuild?.({ action: 'delete', x: copy.x, y: copy.y, z: copy.z, color: copy.color }); } catch (_) {}
      }
    } finally {
      internal = false;
    }
    return list.length;
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    const run = () => { scheduled = false; try { dropUnsupported(); } catch (_) {} };
    if (typeof queueMicrotask === 'function') queueMicrotask(run);
    else Promise.resolve().then(run);
  }

  function install() {
    const gw = window.GridWorld;
    if (!gw || installed) return !!gw;
    if (typeof gw.apply !== 'function') return false;
    const apply = gw.apply;
    gw.apply = function (msg) {
      const before = msg && msg.action === 'delete' && msg.key && gw.blocks.get(msg.key);
      const result = apply.apply(this, arguments);
      if (msg && msg.action === 'delete' && before && !internal) schedule();
      return result;
    };
    installed = true;
    window.ClientFall = Object.freeze({ ready: true, unsupported, dropUnsupported, MAX_DROP });
    return true;
  }

  // GridWorld loads before this file, but stay tolerant if the order ever changes.
  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      if (install() || ++tries > 120) clearInterval(timer);
    }, 50);
  }

  (window.__clientFallDiagnostics = window.__clientFallDiagnostics || []).push('client-fall ready');
})();
