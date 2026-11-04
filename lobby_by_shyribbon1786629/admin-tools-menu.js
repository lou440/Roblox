/* Trey-only in-game /admin tools menu.
 * Authorization is enforced server-side via GET /api/admin-tools and WebSocket adminGrantTool
 * against immutable project-owner userId + username; client checks are purely UI convenience. */
(() => {
  'use strict';
  const TOOLS = [
    ['sword', 'Linked Sword', 'Combat'],
    ['rocket', 'Rocket Launcher', 'Combat'],
    ['trowel', 'Classic Trowel', 'Classic'],
    ['pistol', "General's .45", 'Combat'],
    ['subspace', 'Subspace Tripmine', 'Combat'],
    ['carpet', 'Rainbow Carpet', 'Gear'],
    ['bloxycola', 'Bloxy Cola', 'Gear'],
    ['paintball', 'Paintball Gun', 'Combat'],
    ['slingshot', 'Slingshot', 'Combat'],
    ['superball', 'Superball', 'Combat'],
    ['timebomb', 'Timebomb', 'Combat'],
    ['jetboots', 'Jet Boots', 'Gear'],
    ['build', 'Build', 'Building'],
    ['delete', 'Delete', 'Building'],
    ['paint', 'Paint', 'Building'],
    ['checker', 'Build Checker', 'Building'],
  ];

  let modal = null;
  let statusEl = null;
  let moderationEl = null;
  const adminUnlocked = (window.__adminUnlockedTools = new Set());

  function isSupported(id) {
    if (id === 'bloxycola') return !!window.BloxyColaData;
    if (id === 'sword') return !!window.LinkedSwordData;
    if (id === 'rocket') return !!window.ClassicRocketData;
    if (id === 'trowel') return !!window.ClassicTrowelData;
    if (id === 'pistol') return !!window.General45Data;
    if (id === 'subspace') return !!window.SubspaceTripmineData;
    if (id === 'carpet') return !!window.RainbowCarpetData;
    if (['paintball', 'slingshot', 'superball', 'timebomb', 'jetboots'].includes(id)) {
      return Array.isArray(window.LegacyPlaceToolData) && window.LegacyPlaceToolData.some((t) => t.id === id);
    }
    if (['build', 'delete', 'paint', 'checker'].includes(id)) {
      return Array.isArray(window.BuildToolData) && window.BuildToolData.some((t) => t.id === id);
    }
    return false;
  }

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids.flat()) {
      if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  function close() {
    if (modal) modal.hidden = true;
  }

  function applyGrantedTool(toolId) {
    adminUnlocked.add(toolId);
    const bp = window.__robloxBackpack;
    if (bp && typeof bp.adminGrant === 'function') {
      bp.adminGrant(toolId);
    } else if (bp && typeof bp.grantTool === 'function') {
      bp.grantTool(toolId);
    }
    if (statusEl) statusEl.textContent = 'Equipped ' + toolId + '.';
  }

  let pendingGrant = null;
  function clearPendingGrant() { if (pendingGrant) { clearTimeout(pendingGrant.timer); pendingGrant = null; } }
  window.addEventListener('mp:admin-tool-granted', (e) => {
    const toolId = e.detail && e.detail.tool;
    if (!toolId) return;
    if (pendingGrant && pendingGrant.tool !== toolId) return;
    clearPendingGrant();
    applyGrantedTool(toolId);
  });
  // #4140: the server can reject a grant (map rules, PvP off, unsupported, not owner).
  // Without this the status stayed at "Requesting…" forever.
  window.addEventListener('mp:admin-tool-rejected', (e) => {
    const d = e.detail || {};
    if (pendingGrant && d.tool && pendingGrant.tool !== d.tool) return;
    clearPendingGrant();
    if (statusEl) statusEl.textContent = d.error || 'That tool was refused on this map.';
  });

  function requestTool(toolId, label) {
    const mp = window.__multiplayer;
    if (mp && mp.connected && typeof mp.sendAdminGrantTool === 'function') {
      clearPendingGrant();
      if (statusEl) statusEl.textContent = 'Requesting ' + label + '…';
      pendingGrant = { tool: toolId, timer: setTimeout(() => {
        pendingGrant = null;
        if (statusEl) statusEl.textContent = 'No answer from the server for ' + label + '. Check that you are signed in as the owner and that this map allows the tool.';
      }, 6000) };
      mp.sendAdminGrantTool(toolId);
    } else {
      applyGrantedTool(toolId);
    }
  }

  function ensureModal() {
    if (modal) return modal;
    statusEl = h('p', { class: 'admin-status', role: 'status' }, '');
    moderationEl = h('div', { class: 'admin-moderation', style: 'margin-top:14px;border-top:1px solid rgba(255,255,255,.18);padding-top:10px;' });
    const grid = h('div', {
      class: 'admin-tools-grid',
      style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px;margin-top:10px;',
    });
    modal = h(
      'div',
      { class: 'admin-panel', id: 'rbx-admin-tools-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Admin Tools', hidden: true },
      h(
        'div',
        { class: 'admin-card', style: 'max-width:560px;width:92vw;' },
        h(
          'header',
          { class: 'admin-head' },
          h('strong', {}, 'Admin Gear & Tools (/admin)'),
          h('button', { type: 'button', class: 'admin-x', 'aria-label': 'Close', onclick: close }, '×')
        ),
        h('p', { style: 'margin:0 0 8px;opacity:.8;font-size:13px;' }, 'Click any supported tool to add & equip it in your hotbar.'),
        grid,
        statusEl,
        moderationEl
      )
    );
    modal._grid = grid;
    modal.addEventListener('pointerdown', (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.hidden) close();
    });
    document.body.append(modal);
    return modal;
  }

  function renderTools(allowedList) {
    const m = ensureModal();
    const allowed = Array.isArray(allowedList) ? new Set(allowedList) : null;
    const buttons = TOOLS.filter(([id]) => isSupported(id) && (!allowed || allowed.has(id))).map(([id, label, group]) =>
      h(
        'button',
        {
          type: 'button',
          class: 'admin-row',
          style: 'display:flex;flex-direction:column;align-items:flex-start;padding:8px 10px;gap:2px;cursor:pointer;',
          onclick: () => requestTool(id, label),
        },
        h('span', { class: 'admin-name', style: 'font-weight:600;' }, label),
        h('small', { style: 'opacity:.7;font-size:11px;' }, group)
      )
    );
    m._grid.replaceChildren(...(buttons.length ? buttons : [h('p', { class: 'admin-empty' }, 'No supported tools available.')]));
  }


  async function adminJson(path, options) { const r = await fetch(path, { cache: 'no-store', ...options }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || ('Admin request failed (' + r.status + ').')); return j; }
  function moderationStatus(text) { if (statusEl) statusEl.textContent = text; }
  async function previewBlocks(user) { try { moderationStatus('Counting blocks for ' + (user.username || user.id) + '…'); const p = await adminJson('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'preview-user-builds', userId: user.id, scope: 'all' }) }); const v = p.preview; moderationStatus((v.username || v.userId) + ': ' + v.total + ' blocks (Peaceful ' + v.counts.fbp + ', Hostile ' + v.counts.fbh + ', legacy ' + v.counts.legacy + '). Ban only: this interim build does not remove existing blocks from that account.'); } catch (e) { moderationStatus(e.message || 'Unable to preview blocks.'); } }
  async function moderateUser(user, action) { try { await adminJson('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId: user.id }) }); moderationStatus((action === 'ban' ? 'Banned ' : 'Kicked ') + (user.username || user.id) + '.'); await renderModeration(); } catch (e) { moderationStatus(e.message || 'Moderation failed.'); } }
  async function renderModeration(query) { if (!moderationEl) return; const search = h('input', { type: 'search', placeholder: 'Search known/offline users by name or Websim UID', value: query || '', style: 'width:100%;box-sizing:border-box;padding:6px;margin:6px 0;' }); const list = h('div', { style: 'display:flex;flex-direction:column;gap:6px;max-height:220px;overflow:auto;' }); const run = async () => { list.replaceChildren(h('p', { style: 'opacity:.7;font-size:12px;' }, 'Loading known users…')); try { const j = await adminJson('/api/admin?known=1&q=' + encodeURIComponent(search.value.trim())); const users = [...(j.known || []), ...(j.active || []).filter((a) => !(j.known || []).some((k) => k.id === a.id))]; list.replaceChildren(...(users.length ? users.map((user) => h('div', { style: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px;border:1px solid rgba(255,255,255,.12);border-radius:6px;' }, h('span', { style: 'font-size:12px;flex:1;min-width:160px;' }, (user.username || '(unknown)') + ' · ' + user.id + (user.builds != null ? ' · ' + user.builds + ' blocks' : '')), h('button', { type: 'button', onclick: () => moderateUser(user, 'ban') }, 'Ban'), h('button', { type: 'button', onclick: () => moderateUser(user, 'kick') }, 'Kick'), h('button', { type: 'button', onclick: () => previewBlocks(user) }, 'Preview blocks'))) : [h('p', { style: 'opacity:.7;font-size:12px;' }, 'No known users found.')])); } catch (e) { list.replaceChildren(h('p', { style: 'color:#f88;font-size:12px;' }, e.message || 'Unable to load users.')); } }; moderationEl.replaceChildren(h('strong', { style: 'font-size:13px;' }, 'Moderation'), h('p', { style: 'margin:4px 0;opacity:.75;font-size:12px;' }, 'Ban/kick by Websim UID. This interim build only bans: the authorized BenTheMaster317 target is blocked from joining, but their existing blocks are NOT removed. Automatic block cleanup and generic bulk delete are both held pending a cross-isolate-safe design.'), search, h('button', { type: 'button', onclick: run }, 'Search'), list); search.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); }); await run(); }
  async function openFromChat() {
    try {
      const r = await fetch('/api/admin-tools', { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        window.dispatchEvent(new CustomEvent('hud:service-notice', { detail: { text: j.error || 'The /admin menu is restricted to Trey6383.' } }));
        return false;
      }
      window.dispatchEvent(new Event('hud:control-suspend'));
      renderTools(j.tools);
      statusEl.textContent = '';
      renderModeration('BenTheMaster317');
      modal.hidden = false;
      return true;
    } catch (_) {
      window.dispatchEvent(new CustomEvent('hud:service-notice', { detail: { text: 'Unable to verify /admin authorization.' } }));
      return false;
    }
  }

  window.__adminToolsMenu = Object.freeze({ openFromChat, close });
})();
