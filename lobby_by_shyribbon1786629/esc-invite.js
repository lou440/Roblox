// Invite Friends inside the Esc menu: lists your friends and confirms server delivery via inviteResult (#606).
(() => {
  'use strict';
  const actions = document.querySelector('#rbx-people .rbx-menu-actions');
  const resume = document.getElementById('rbx-menu-resume');
  if (!actions || !resume) return;

  const COOLDOWN_MS = 5000;
  const REQUEST_TIMEOUT_MS = 4000;
  const avatar = (u) => 'https://images.websim.com/avatar/' + encodeURIComponent(u);
  const send = (action, to, requestId) => window.__multiplayer?.social?.(action, to, requestId);
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    return el;
  }

  const invited = Object.create(null);
  const pending = Object.create(null);
  const cooldownTimers = Object.create(null);
  let reqSeq = 0;

  const statusNote = h('p', { class: 'esc-invite-empty esc-invite-status', role: 'status', hidden: true });
  const list = h('div', { class: 'esc-invite-list' });
  const panel = h('section', { id: 'esc-invite-panel', class: 'esc-invite-panel', hidden: true, 'aria-label': 'Invite friends' },
    h('header', { class: 'esc-invite-head' },
      h('strong', {}, 'Invite Friends'),
      h('button', { type: 'button', class: 'esc-invite-close', onclick: () => toggle(false) }, 'Done')),
    statusNote,
    list);

  const openBtn = h('button', { id: 'esc-invite-btn', class: 'rbx-menu-action', type: 'button', 'aria-expanded': 'false', onclick: () => toggle(panel.hidden) }, 'Invite Friends');
  actions.insertBefore(openBtn, resume);
  actions.parentNode.insertBefore(panel, actions);

  let stamp = 0;
  let statusTimer = 0;

  function setStatus(text, isError = false) {
    clearTimeout(statusTimer);
    if (!text) {
      statusNote.hidden = true;
      statusNote.textContent = '';
      statusNote.dataset.error = '';
      return;
    }
    statusNote.textContent = text;
    statusNote.dataset.error = isError ? '1' : '';
    statusNote.hidden = false;
    statusTimer = setTimeout(() => {
      statusNote.hidden = true;
    }, 4500);
  }

  function reasonMessage(reason) {
    if (reason === 'offline') return 'That player is no longer online.';
    if (reason === 'not_friends') return 'Only friends can be invited.';
    if (reason === 'throttled') return 'Please wait a moment before sending another invite.';
    if (reason === 'unavailable') return 'Social service is temporarily unavailable.';
    if (reason === 'timeout') return 'No response from server — try again.';
    if (reason === 'disconnected') return 'Connection lost before invite could be confirmed.';
    return 'Invite could not be delivered.';
  }

  function syncRowButton(uid, btn, online) {
    if (!btn) return;
    if (pending[uid]) {
      btn.disabled = true;
      btn.textContent = 'Sending…';
      return;
    }
    const sentAt = invited[uid] || 0;
    const cooling = sentAt > 0 && (Date.now() - sentAt) < COOLDOWN_MS;
    if (cooling) {
      btn.disabled = true;
      btn.textContent = 'Invited';
      return;
    }
    if (sentAt) delete invited[uid];
    btn.disabled = !online;
    btn.textContent = online ? 'Invite to game' : 'Offline';
  }

  function clearAllPending(reason) {
    let any = false;
    for (const uid of Object.keys(pending)) {
      const entry = pending[uid];
      clearTimeout(entry.timer);
      delete pending[uid];
      syncRowButton(uid, entry.btn, entry.online);
      any = true;
    }
    if (any && reason && !panel.hidden) setStatus(reasonMessage(reason), true);
  }

  function startInvite(f, btn) {
    if (!f?.id || pending[f.id]) return;
    if (!window.__multiplayer?.connected) {
      setStatus('Join a multiplayer server to invite friends.', true);
      return;
    }
    const requestId = 'inv-' + (++reqSeq) + '-' + Date.now().toString(36);
    const timer = setTimeout(() => {
      const cur = pending[f.id];
      if (!cur || cur.requestId !== requestId) return;
      delete pending[f.id];
      syncRowButton(f.id, cur.btn, cur.online);
      if (!panel.hidden) setStatus(reasonMessage('timeout'), true);
    }, REQUEST_TIMEOUT_MS);

    pending[f.id] = { requestId, timer, btn, online: !!f.online };
    syncRowButton(f.id, btn, !!f.online);
    setStatus('');

    const dispatched = send('invite', f.id, requestId);
    if (dispatched === false) {
      clearTimeout(timer);
      delete pending[f.id];
      syncRowButton(f.id, btn, !!f.online);
      setStatus(reasonMessage('disconnected'), true);
    }
  }

  window.addEventListener('mp:invite-result', (e) => {
    const d = e.detail || {};
    let uid = typeof d.targetId === 'string' ? d.targetId : '';
    let entry = uid ? pending[uid] : null;
    if (d.requestId) {
      const found = Object.entries(pending).find(([, v]) => v.requestId === d.requestId);
      if (found) {
        uid = found[0];
        entry = found[1];
      } else if (entry && entry.requestId !== d.requestId) {
        return;
      }
    }
    if (!uid || !entry) return;
    clearTimeout(entry.timer);
    delete pending[uid];

    if (d.ok) {
      invited[uid] = Date.now();
      clearTimeout(cooldownTimers[uid]);
      cooldownTimers[uid] = setTimeout(() => {
        delete cooldownTimers[uid];
        delete invited[uid];
        if (entry.btn?.isConnected) syncRowButton(uid, entry.btn, entry.online);
      }, COOLDOWN_MS);
      syncRowButton(uid, entry.btn, entry.online);
      setStatus('');
    } else {
      if (d.reason === 'offline') entry.online = false;
      syncRowButton(uid, entry.btn, entry.online);
      if (!panel.hidden) setStatus(reasonMessage(d.reason), true);
    }
  });

  window.addEventListener('mp:offline-changed', (e) => {
    if (e.detail?.offline) clearAllPending('disconnected');
  });
  window.addEventListener('mp:session-replaced', () => clearAllPending('disconnected'));

  function toggle(open) {
    panel.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) load();
    else setStatus('');
  }

  async function load() {
    const mine = ++stamp;
    if (!window.__multiplayer?.connected) {
      list.replaceChildren(h('p', { class: 'esc-invite-empty' }, 'Join a multiplayer server to invite friends.'));
      return;
    }
    list.replaceChildren(h('p', { class: 'esc-invite-empty' }, 'Loading friends...'));
    let data = null;
    try { const r = await fetch('/api/social', { cache: 'no-store' }); if (r.ok) data = await r.json(); } catch (_) {}
    if (mine !== stamp) return;
    const friends = (data && data.friends) || [];
    if (!friends.length) {
      list.replaceChildren(h('p', { class: 'esc-invite-empty' }, 'No friends yet. Click a player in the leaderboard to add them, or use the Friends tab on the home screen.'));
      return;
    }
    const sorted = [...friends].sort((a, b) => Number(!!b.online) - Number(!!a.online) || String(a.username).localeCompare(String(b.username)));
    list.replaceChildren(...sorted.map((f) => {
      const online = !!f.online;
      const btn = h('button', {
        type: 'button',
        class: 'esc-invite-send',
        onclick: () => startInvite(f, btn),
      }, 'Invite to game');
      if (pending[f.id]) {
        pending[f.id].btn = btn;
        pending[f.id].online = online;
      }
      syncRowButton(f.id, btn, online);
      return h('div', { class: 'esc-invite-row', 'data-uid': String(f.id || '') },
        h('img', { src: avatar(f.username), alt: '' }),
        h('div', { class: 'esc-invite-user' },
          h('strong', {}, '@' + f.username),
          h('small', {}, online ? (f.map ? 'Online' : 'On home screen') : 'Offline')),
        btn);
    }));
  }

  window.addEventListener('hud:menu-open', () => toggle(false));
  window.addEventListener('social:changed', () => { if (!panel.hidden) load(); });
})();
