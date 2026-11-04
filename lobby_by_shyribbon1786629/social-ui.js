// Friend requests, game invites, announcements, and the device id for bans.
// The server decides every outcome; this file only sends requests and shows results.
(() => {
  const GAME_NAMES = Object.fromEntries(Object.values(window.MapCatalog).map(g=>[g.id,g.title]));
  const avatar = (u) => 'https://images.websim.com/avatar/' + encodeURIComponent(u);
  const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
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
  const send = (action, to) => window.__multiplayer?.social?.(action, to);
  const currentMap = () => (window.MapSelection?.id || 'game');
  function joinMap(map) {
    if (map === currentMap()) return;
    const url = new URL(location.href);
    url.searchParams.set('map', map);
    url.searchParams.delete('play');   // #4550: no alternate Play URL needed
    location.assign(url.href);
  }

  // Toasts: requests, invites, and server notices.
  const host = h('div', { class: 'social-toasts', role: 'status', 'aria-live': 'polite' });
  document.body.append(host);
  function toast(text, actions = [], ms = 6000) {
    const buttons = actions.map((a) => h('button', { type: 'button', class: a.primary ? 'primary' : '', onclick: () => { el.remove(); a.run?.(); } }, a.label));
    const el = h('div', { class: 'social-toast' }, h('p', {}, text), buttons.length ? h('div', { class: 'social-toast-actions' }, buttons) : null);
    host.append(el);
    if (ms) setTimeout(() => el.remove(), ms);
  }
  function acceptFriend(id) {
    send('accept', id);
    setTimeout(() => window.dispatchEvent(new Event('social:changed')), 500);
  }
  window.addEventListener('mp:notice', (e) => {
    const m = e.detail || {};
    if (m.kind === 'request' && m.from) {
      toast('@' + m.from.username + ' sent you a friend request.', [
        { label: 'Accept', primary: true, run: () => acceptFriend(m.from.id) },
        { label: 'Later' },
      ], 0);
    } else if (m.kind === 'invite' && m.from) {
      toast('@' + m.from.username + ' invited you to ' + (GAME_NAMES[m.map] || 'a game') + '.', [
        { label: 'Join', primary: true, run: () => joinMap(m.map) },
        { label: 'Dismiss' },
      ], 15000);
    } else if (m.text) {
      toast(m.text);
    }
  });

  // Announcements from /announcement: a Roblox-style modal, one at a time.
  const queue = [];
  let showing = false;
  window.addEventListener('mp:announcement', (e) => {
    queue.push(e.detail || {});
    if (!showing) showNext();
  });
  function showNext() {
    const m = queue.shift();
    if (!m) { showing = false; return; }
    showing = true;
    const ok = h('button', { type: 'button', class: 'rbx-announce-ok', onclick: () => { box.remove(); showNext(); } }, 'OK');
    const box = h('div', { class: 'rbx-announce', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Announcement' },
      h('div', { class: 'rbx-announce-card' },
        h('header', { class: 'rbx-announce-head' }, 'Announcement'),
        h('div', { class: 'rbx-announce-body' }, h('p', {}, m.text || ''), m.from ? h('small', {}, 'From @' + m.from) : null),
        h('footer', { class: 'rbx-announce-foot' }, ok)));
    document.body.append(box);
    ok.focus();
  }

  // Profile card: friend actions for the player whose row was opened (in a game only).
  const actions = document.getElementById('rbx-profile-actions');
  let stamp = 0;
  function hideActions() { actions.hidden = true; actions.replaceChildren(); }
  function again(uid) { setTimeout(() => paint(uid), 700); }
  async function paint(uid) {
    const mine = ++stamp;
    let data = null;
    try { const r = await fetch('/api/social', { cache: 'no-store' }); if (r.ok) data = await r.json(); } catch (_) {}
    if (mine !== stamp) return;
    if (!data) return hideActions();
    const has = (list) => (list || []).some((x) => x.id === uid);
    let buttons;
    if (has(data.friends)) {
      buttons = [h('button', { type: 'button', class: 'primary', onclick: () => { send('invite', uid); again(uid); } }, 'Invite to game'), h('span', { class: 'social-note' }, 'Friends')];
    } else if (has(data.incoming)) {
      buttons = [h('button', { type: 'button', class: 'primary', onclick: () => { acceptFriend(uid); again(uid); } }, 'Accept friend request')];
    } else if (has(data.outgoing)) {
      buttons = [h('button', { type: 'button', disabled: true }, 'Request sent')];
    } else {
      buttons = [h('button', { type: 'button', class: 'primary', onclick: () => { send('request', uid); again(uid); } }, 'Add friend')];
    }
    actions.replaceChildren(...buttons);
    actions.hidden = false;
  }
  window.addEventListener('rbx:profile', (e) => {
    const d = e.detail || {};
    if (!d.open || d.self || !d.uid || !window.__multiplayer?.connected) return hideActions();
    paint(d.uid);
  });
  window.addEventListener('hud:menu-open', hideActions);

  // Device id: a random token kept in localStorage plus a few browser signals, hashed.
  // It is a soft signal for device bans, not proof of identity.
  (async () => {
    try {
      let id = '';
      try {
        id = localStorage.getItem('websim-device-id') || '';
        if (!id) { id = hex(crypto.getRandomValues(new Uint8Array(16))); localStorage.setItem('websim-device-id', id); }
      } catch (_) {}
      const raw = [id, navigator.userAgent, navigator.language, screen.width, screen.height, screen.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
      window.__deviceFp = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))));
      const user = await window.websim?.getUser?.();
      if (user) fetch('/api/device', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fp: window.__deviceFp }) }).catch(() => {});
    } catch (_) {}
  })();
})();
