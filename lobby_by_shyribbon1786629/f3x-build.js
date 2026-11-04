/* #4414b — Free Build build-mode picker, plus an F3X-style tool set.
 *
 * cli asked for: a popup on entering Free Build asking "Building Tools or F3X?", and for
 * Free Build to be able to use F3X instead of btools.
 *
 * This file never replaces build-tools.js. It sits in front of it:
 *  - "Building Tools" = the existing grid tools, untouched.
 *  - "F3X" adds Move / Rotate on top of Build / Delete / Paint, plus a size + colour strip.
 *    While F3X is on, its click handler runs first and stops the classic tool from also firing.
 * Targeting reuses build-tools' own hover (`window.__buildTools.getState().hover`), so there is
 * exactly one raycast in the game and F3X inherits its range/spawn rules for free.
 * Edits go through the same server-authoritative `mp.sendBuild` the classic tools use.
 */
(() => {
  'use strict';

  const MODE_KEY = 'rbx-build-mode';
  const SEND_GAP = 170;            // server rejects build edits faster than 150 ms
  const VARIANTS = [['block', 'Block 4'], ['full', 'Full 3'], ['tiny', 'Tiny 1'], ['slab', 'Slab'], ['pillar', 'Pillar']];

  let mode = null;                  // 'btools' | 'f3x'
  let action = 'build';             // build | delete | paint | move | rotate
  let variant = 'block', orientation = 0, color = '#418ac9';
  let moveFrom = null;              // pending source block for Move
  let lastSend = 0, lastPopMap = null, lastPanelSig = '', panel = null, pop = null, notice = null, noticeUntil = 0;

  try { mode = sessionStorage.getItem(MODE_KEY) || null; } catch (_) {}

  const bp = () => window.__robloxBackpack;
  const freeBuild = () => /^freebuild-/.test(window.MapSelection?.id || '');
  const inGame = () => !window.__homeOpen && !window.JoiningScreen?.active && !!document.querySelector('canvas');

  function setNotice(text) {
    if (!notice) return;
    notice.textContent = text;
    notice.hidden = false;
    noticeUntil = performance.now() + 2600;
  }

  function injectStyle() {
    if (document.getElementById('f3x-style')) return;
    const s = document.createElement('style');
    s.id = 'f3x-style';
    s.textContent = `
#f3x-pop{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(10,12,18,.62)}
#f3x-pop[hidden]{display:none}
#f3x-pop .f3x-card{background:#15191f;border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:20px 22px;max-width:420px;width:92vw;font:600 14px/1.45 system-ui,sans-serif;color:#e8edf5;box-shadow:0 18px 50px rgba(0,0,0,.55)}
#f3x-pop h2{margin:0 0 6px;font-size:17px}
#f3x-pop p{margin:0 0 14px;font-weight:400;opacity:.8}
#f3x-pop .f3x-choices{display:flex;gap:10px;flex-wrap:wrap}
#f3x-pop button{flex:1 1 160px;cursor:pointer;padding:11px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:#212936;color:#e8edf5;font:inherit;text-align:left}
#f3x-pop button small{display:block;font-weight:400;opacity:.65;margin-top:3px}
#f3x-pop button:hover{border-color:#4f9dff;background:#26324a}
#f3x-panel{position:fixed;left:14px;bottom:96px;z-index:40;background:rgba(18,22,29,.94);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:9px;font:600 12px/1.3 system-ui,sans-serif;color:#dfe6f1;display:flex;flex-direction:column;gap:7px;max-width:210px}
#f3x-panel[hidden]{display:none}
#f3x-panel .f3x-row{display:flex;gap:5px;flex-wrap:wrap}
#f3x-panel button{cursor:pointer;padding:5px 8px;border-radius:7px;border:1px solid rgba(255,255,255,.16);background:#1d2530;color:#dfe6f1;font:inherit}
#f3x-panel button.on{background:#2f6fd0;border-color:#5aa0ff;color:#fff}
#f3x-panel select,#f3x-panel input[type=color]{background:#1d2530;color:#dfe6f1;border:1px solid rgba(255,255,255,.16);border-radius:7px;padding:3px;font:inherit}
#f3x-panel .f3x-hint{font-weight:400;opacity:.62;font-size:11px}
#f3x-notice{position:fixed;left:50%;bottom:170px;transform:translateX(-50%);z-index:45;background:rgba(16,20,26,.94);border:1px solid rgba(255,255,255,.16);color:#eaf0f8;padding:7px 12px;border-radius:999px;font:600 12px/1 system-ui,sans-serif}
#f3x-notice[hidden]{display:none}
`;
    document.head.append(s);
  }

  function buildPopup() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.id = 'f3x-pop';
    pop.hidden = true;
    pop.innerHTML = `<div class="f3x-card" role="dialog" aria-modal="true" aria-label="Choose build tools">
      <h2>How do you want to build?</h2>
      <p>Free Build only. You can switch any time from the build panel.</p>
      <div class="f3x-choices">
        <button type="button" data-mode="btools">Building Tools<small>The classic grid build, delete and paint tools.</small></button>
        <button type="button" data-mode="f3x">F3X<small>Build, delete and paint, plus move and rotate a block you already placed.</small></button>
      </div></div>`;
    pop.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('button[data-mode]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      choose(b.dataset.mode);
    }, true);
    document.body.append(pop);
    return pop;
  }

  function choose(m) {
    mode = m === 'f3x' ? 'f3x' : 'btools';
    try { sessionStorage.setItem(MODE_KEY, mode); } catch (_) {}
    if (pop) pop.hidden = true;
    // #4537: never leave the player without build tools - grant them back and equip Build
    // if the backpack came up empty (this is what made btools "disappear everywhere").
    const bag = window.__robloxBackpack;
    const items = bag?.getState?.().items || [];
    if (!items.some((it) => it && it.id === 'build')) {
      for (const d of window.BuildToolData || []) bag?.grantTool?.(d.id);
    }
    if (!bag?.getState?.().equippedTool) bag?.selectTool?.('build');
    renderPanel();
    setNotice(mode === 'f3x' ? 'F3X tools on. Move and Rotate are in the panel.' : 'Classic Building Tools on.');
  }

  function showPopup() {
    if (!freeBuild() || !inGame()) return;
    buildPopup();
    pop.hidden = false;
    if (panel) panel.hidden = true;   // the panel waits until the choice is made
  }

  function renderPanel() {
    if (!panel) return;
    panel.hidden = mode !== 'f3x' || !freeBuild();
    for (const b of panel.querySelectorAll('button[data-action]')) {
      b.classList.toggle('on', b.dataset.action === action);
    }
    const mv = panel.querySelector('.f3x-hint');
    if (mv) mv.textContent = moveFrom ? 'Move: now click the empty spot.' : '';
  }

  function buildPanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'f3x-panel';
    panel.hidden = true;
    panel.innerHTML = `<div class="f3x-row">
        <button type="button" data-action="build">Build</button>
        <button type="button" data-action="delete">Delete</button>
        <button type="button" data-action="paint">Paint</button>
      </div>
      <div class="f3x-row">
        <button type="button" data-action="move">Move</button>
        <button type="button" data-action="rotate">Rotate</button>
      </div>
      <div class="f3x-row">
        <select class="f3x-variant" aria-label="Block size"></select>
        <input type="color" class="f3x-color" value="#418ac9" aria-label="Block colour">
      </div>
      <div class="f3x-row"><button type="button" class="f3x-switch">Change build mode</button></div>
      <div class="f3x-hint" role="status"></div>`;
    const sel = panel.querySelector('.f3x-variant');
    for (const [id, label] of VARIANTS) {
      const o = document.createElement('option');
      o.value = id; o.textContent = label;
      sel.append(o);
    }
    sel.value = variant;
    sel.addEventListener('change', () => { variant = sel.value; });
    panel.querySelector('.f3x-color').addEventListener('input', (e) => { color = e.target.value; });
    panel.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('button[data-action]');
      if (a) { action = a.dataset.action; moveFrom = null; renderPanel(); return; }
      if (e.target.closest && e.target.closest('.f3x-switch')) { buildPopup(); pop.hidden = false; }
    }, true);
    document.body.append(panel);
    return panel;
  }

  function buildNotice() {
    if (notice) return notice;
    notice = document.createElement('div');
    notice.id = 'f3x-notice';
    notice.hidden = true;
    document.body.append(notice);
    return notice;
  }

  function submit(payload) {
    const mp = window.__multiplayer;
    if (!mp) return false;
    if (mp.connected) return mp.sendBuild(payload) !== false;
    if (mp.offlineMode && mp.applyOfflineBuild) { mp.applyOfflineBuild(payload); return true; }
    setNotice('Join the room to build.');
    return false;
  }

  function rotateOrientation(o) {
    const list = window.BuildOrientation?.list || [0, 1, 2, 3];
    const i = list.indexOf(o);
    return list[(i + 1) % list.length];
  }

  // Everything F3X does, given a hover target from build-tools.
  function apply(actionName, hover, nowMs) {
    const now = nowMs == null ? performance.now() : nowMs;
    if (!hover || !hover.inRange) { setNotice('Move within 32 studs of what you want to edit.'); return false; }
    if (now - lastSend < SEND_GAP) return false;

    if (actionName === 'delete') {
      if (!hover.block) { setNotice('Aim at a block to delete it.'); return false; }
      lastSend = now;
      return submit({ action: 'delete', x: hover.block.x, y: hover.block.y, z: hover.block.z, color: hover.block.color });
    }
    if (actionName === 'paint') {
      if (!hover.block) { setNotice('Aim at a block to paint it.'); return false; }
      lastSend = now;
      return submit({ action: 'paint', x: hover.block.x, y: hover.block.y, z: hover.block.z, color });
    }
    if (actionName === 'build') {
      if (!hover.cell) { setNotice('Aim at the ground or a block face.'); return false; }
      if (window.GridWorld?.blocks?.has(window.GridWorld.key(...hover.cell))) { setNotice('Something is already in that space.'); return false; }
      lastSend = now;
      return submit({ action: 'build', x: hover.cell[0], y: hover.cell[1], z: hover.cell[2], color, variant, orientation, source: hover.block ? [hover.block.x, hover.block.y, hover.block.z] : null });
    }
    if (actionName === 'rotate') {
      if (!hover.block) { setNotice('Aim at a block to rotate it.'); return false; }
      const b = hover.block;
      lastSend = now;
      submit({ action: 'delete', x: b.x, y: b.y, z: b.z, color: b.color });
      setTimeout(() => submit({ action: 'build', x: b.x, y: b.y, z: b.z, color: b.color, variant: b.variant || 'block', orientation: rotateOrientation(b.orientation || 0) }), SEND_GAP + 30);
      return true;
    }
    if (actionName === 'move') {
      if (!moveFrom) {
        if (!hover.block) { setNotice('Click the block you want to move.'); return false; }
        const b = hover.block;
        moveFrom = { x: b.x, y: b.y, z: b.z, color: b.color, variant: b.variant || 'block', orientation: b.orientation || 0 };
        setNotice('Now click where you want it.');
        return true;
      }
      if (!hover.cell) { setNotice('Aim at the ground or a block face.'); return false; }
      const f = moveFrom; moveFrom = null;
      lastSend = now;
      submit({ action: 'delete', x: f.x, y: f.y, z: f.z, color: f.color });
      const cell = hover.cell.slice();
      setTimeout(() => submit({ action: 'build', x: cell[0], y: cell[1], z: cell[2], color: f.color, variant: f.variant, orientation: f.orientation }), SEND_GAP + 30);
      return true;
    }
    return false;
  }

  function f3xActive() {
    if (mode !== 'f3x' || !freeBuild()) return null;
    const tool = bp()?.getState?.().equippedTool;
    return ['build', 'delete', 'paint'].includes(tool) ? tool : null;
  }

  function onPointerDown(e) {
    if (!f3xActive()) return;
    const canvas = document.querySelector('canvas');
    if (!canvas || (e.target !== canvas && !canvas.contains(e.target))) return;
    const hover = window.__buildTools?.getState?.().hover;
    if (!hover) return;
    // Take the click away from the classic grid tool so only one edit happens.
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    apply(action, hover);
  }

  function tick() {
    if (notice && !notice.hidden && performance.now() > noticeUntil) notice.hidden = true;
    const mapId = window.MapSelection?.id || '';
    if (!/^freebuild-/.test(mapId)) lastPopMap = null;          // leaving Free Build re-arms the question
    else if (inGame() && lastPopMap !== mapId) {
      // #4536: cli wants the choice on EVERY launch of Free Build / Hostile, not once per session.
      lastPopMap = mapId;
      showPopup();
    }
    if (freeBuild() && inGame() && !panel) { buildPanel(); buildNotice(); renderPanel(); }
    // keep the panel in sync the same frame you leave / join a map (the old 1.2 s poll felt broken)
    const sig = `${mode}|${freeBuild()}|${action}|${moveFrom ? 1 : 0}`;
    if (sig !== lastPanelSig) { lastPanelSig = sig; renderPanel(); }
    requestAnimationFrame(tick);
  }

  function init() {
    if (window.__f3xReady) return;
    window.__f3xReady = true;
    injectStyle();
    buildPanel();
    buildNotice();
    renderPanel();
    window.addEventListener('pointerdown', onPointerDown, true);
    // A saved choice should still apply when you change maps without reloading.
    setInterval(renderPanel, 1200);
    requestAnimationFrame(tick);
  }

  window.F3X = { get mode() { return mode; }, choose, apply, showPopup, variant: (v) => { variant = v; }, isActive: f3xActive };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
