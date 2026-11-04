// Admin panel. Shown only when GET /api/admin answers 200, which the server does only for the project owner.
(() => {
  const avatar = (u) => 'https://images.websim.com/avatar/' + encodeURIComponent(u);
  const KIND = { user: 'Account', ip: 'IP', fp: 'Device' };
  const ACTED = { kick: 'Kicked', ban: 'Banned account', 'ban-ip': 'Banned IP of', 'ban-fp': 'Banned device of' };
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
  async function api(method, body) {
    const r = await fetch('/api/admin', {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || 'Request failed.'), { status: r.status });
    return j;
  }

  let data = null;
  let selected = '';
  let panel = null;
  const status = () => panel.querySelector('.admin-status');

  function render() {
    const list = panel.querySelector('.admin-active');
    list.replaceChildren(...(data.active.length ? data.active.map((u) => h('button', {
      type: 'button',
      class: 'admin-row' + (u.id === selected ? ' on' : ''),
      'aria-pressed': u.id === selected ? 'true' : 'false',
      onclick: () => { selected = u.id; render(); },
    }, h('img', { src: avatar(u.username), alt: '' }), h('span', { class: 'admin-name' }, '@' + u.username), h('small', {}, u.map === 'sword-heights' ? 'Sword Fight' : 'Lobby'))) : [h('p', { class: 'admin-empty' }, 'Nobody is in a game right now.')]));

    const sel = data.active.find((u) => u.id === selected);
    const detail = panel.querySelector('.admin-detail');
    if (!sel) {
      detail.replaceChildren(h('p', { class: 'admin-empty' }, 'Select a player.'));
    } else {
      const act = (label, action, disabled, danger) => h('button', { type: 'button', class: danger ? 'danger' : '', disabled: disabled ? true : null, onclick: () => run(action, sel) }, label);
      detail.replaceChildren(
        h('strong', { class: 'admin-who' }, '@' + sel.username),
        h('dl', {},
          h('dt', {}, 'IP'), h('dd', {}, sel.ip || 'none on record'),
          h('dt', {}, 'Device'), h('dd', {}, sel.fp ? sel.fp.slice(0, 12) + '…' : 'none on record')),
        h('div', { class: 'admin-actions' },
          act('Kick', 'kick', false, false),
          act('Ban account', 'ban', false, true),
          act('Ban IP', 'ban-ip', !sel.ip, true),
          act('Ban device', 'ban-fp', !sel.fp, true)));
    }

    const bans = panel.querySelector('.admin-bans');
    bans.replaceChildren(...(data.bans.length ? data.bans.map((b) => h('li', {},
      h('span', {}, KIND[b.kind] + ': ' + (b.kind === 'user' && b.label ? '@' + b.label : (b.label || b.value.slice(0, 16)))),
      h('button', { type: 'button', onclick: () => unban(b) }, 'Unban'))) : [h('li', { class: 'admin-empty' }, 'No bans.')]));
  }

  async function refresh() {
    data = await api('GET');
    if (selected && !data.active.some((u) => u.id === selected)) selected = '';
    render();
  }

  async function run(action, sel) {
    try {
      await api('POST', { action, userId: sel.id });
      status().textContent = ACTED[action] + ' @' + sel.username + '.';
      await refresh();
    } catch (e) {
      status().textContent = e.message;
    }
  }

  async function unban(b) {
    try {
      await api('POST', { action: 'unban', kind: b.kind, value: b.value });
      status().textContent = 'Unbanned.';
      await refresh();
    } catch (e) {
      status().textContent = e.message;
    }
  }

  function close() { panel.hidden = true; }

  async function open() {
    panel.hidden = false;
    status().textContent = '';
    try { await refresh(); } catch (e) { status().textContent = e.message; }
  }

  function build() {
    panel = h('div', { class: 'admin-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Admin', hidden: true },
      h('div', { class: 'admin-card' },
        h('header', { class: 'admin-head' }, h('strong', {}, 'Admin'), h('button', { type: 'button', class: 'admin-x', 'aria-label': 'Close', onclick: close }, '×')),
        h('div', { class: 'admin-cols' },
          h('section', {}, h('h3', {}, 'Active'), h('div', { class: 'admin-active' })),
          h('section', { class: 'admin-right' }, h('div', { class: 'admin-detail' }), h('h3', {}, 'Bans'), h('ul', { class: 'admin-bans' }))),
        h('p', { class: 'admin-status', role: 'status' })));
    document.body.append(panel);
    panel.addEventListener('pointerdown', (e) => { if (e.target === panel) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  }

  (async () => {
    try { data = await api('GET'); } catch (_) { return; }
    build();
    const nav = document.querySelector('.home-drawer-links') || document.querySelector('.home-nav-items') || document.querySelector('.home-nav');
    if (!nav) return;
    const button = h('button', { type: 'button', class: 'home-admin', onclick: open },
      h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('path', { d: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z' })),
      h('span', {}, 'Admin'));
    nav.append(button);
  })();
})();
