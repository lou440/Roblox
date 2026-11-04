// Game discovery home: live friends, catalog games, and multiplayer counts.
(() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const avatar = (username) => 'https://images.websim.com/avatar/' + encodeURIComponent(username);
  const GAMES = Object.values(window.MapCatalog).map((g) => ({ ...g, map: g.id, id: 'home-' + g.id }));
  const byMap = new Map(GAMES.map((g) => [g.map, g]));
  const icon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  const icons = {
    home: icon('<path d="M3 10.8 12 4l9 6.8v9.1a1 1 0 0 1-1 1h-5.2v-6h-5.6v6H4a1 1 0 0 1-1-1z"/>'),
    charts: icon('<path d="M4 20V11h4v9M10 20V5h4v15M16 20v-7h4v7"/>'),
    chat: icon('<path d="M4 5h16v12H9l-5 4z"/><path d="M8 9h8M8 13h5"/>'),
    me: icon('<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.6-6 8-6s7.2 2 8 6"/>'),
    add: icon('<path d="M12 5v14M5 12h14"/>'),
    search: icon('<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>'),
    settings: icon('<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.5-2.6 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h3l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.5 2.6-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1)"/>'),
    bell: icon('<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>'),
    menu: icon('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    thumb: icon('<path d="M7 10v10H4V10h3Zm0 10h9.5a2 2 0 0 0 1.9-1.4l1.5-5A2 2 0 0 0 18 11h-5l.7-3.5A2 2 0 0 0 12 5l-5 5"/>'),
  };

  const root = document.createElement('section');
  root.id = 'home-screen';
  root.className = 'home-screen';
  root.setAttribute('aria-label', 'Home');
  root.innerHTML = `
    <aside class="home-nav" aria-label="Main navigation">
      <button type="button" class="home-menu-toggle" id="home-menu-toggle" aria-label="Open menu" aria-expanded="false">${icons.menu}<i></i></button>
      <div class="home-nav-items">
        <button class="on" id="home-nav-home" type="button" aria-current="page">${icons.home}<span>Home</span></button>
        <button id="home-nav-charts" type="button">${icons.charts}<span>Charts</span></button>
        <button id="home-nav-chat" type="button">${icons.chat}<span>Chat</span></button>
        <button id="home-nav-me" type="button">${icons.me}<span>Me</span></button>
      </div>
      <div class="home-nav-bottom"><button type="button" id="home-nav-platform" aria-label="Open Studio" title="Studio"><span class="rbx-icon" aria-hidden="true">studio</span></button></div>
    </aside>
    <div class="home-body">
      <header class="home-top">
        <a class="home-brand" href="#" aria-label="Roblox Select"><img src="img/roblox-logo-white.png" alt="Roblox"><span>SELECT</span></a>
        <label class="home-search">${icons.search}<input id="home-search-input" type="search" placeholder="Search" aria-label="Search games"></label>
        <div class="home-account">
          <button class="home-offline-toggle" id="home-offline-toggle" type="button" aria-pressed="false" title="Play solo in Offline Mode">Offline</button>
          <button class="home-account-user" id="home-me" type="button" aria-label="Open avatar editor"><img class="home-me" alt=""><span id="home-username">Guest</span></button>
          <button class="home-icon-button home-robux-button" type="button" id="home-robux" aria-label="Robux">${icon('<path d="m7 3 10 1 5 8-5 8-10 1-5-9z"/><path d="m10 9 5-.5-.5 6-5 .5z"/>')}</button>
          <button class="home-icon-button home-notification" type="button" id="home-notifications" aria-label="Notifications" aria-expanded="false">${icons.bell}<span id="home-request-badge" hidden></span></button>
        </div>
      </header>
      <main class="home-main">
        <section class="home-friends-section" aria-label="Friends">
          <div class="home-friends" id="home-friends"></div><p id="home-friend-status" role="status" aria-live="polite" hidden></p>
        </section>
        <section class="home-games-section" id="home-recommended-section">
          <h1>Recommended For You</h1>
          <div class="home-games" id="home-games"></div>
        </section>
        <section class="home-continue-section">
          <h2><span>Continue</span><button type="button" id="home-continue-next" aria-label="Show more games">›</button></h2>
          <div class="home-continue" id="home-continue"></div>
        </section>
      </main>
      <section class="home-avatar-host" id="home-avatar-host" aria-label="Avatar"></section>
    </div>
    <section class="home-friend-picker" id="home-friend-picker" role="dialog" aria-modal="true" aria-label="Add friends" hidden>
      <div class="home-friend-picker-card"><header><strong>Add Friends</strong><button type="button" id="home-picker-close" aria-label="Close">×</button></header><div class="home-picker-list" id="home-picker-list"></div></div>
    </section>
    <section class="home-search-view" id="home-search-view" aria-label="Search games" aria-hidden="true">
      <button type="button" class="home-search-shade" aria-label="Close search"></button>
      <div class="home-search-panel">
        <div class="home-search-row">${icons.search}<input id="home-search-modal-input" type="search" placeholder="Search" aria-label="Search games"><button type="button" id="home-search-cancel">Cancel</button></div>
        <section><h2>Recently Visited</h2><div class="home-search-recent" id="home-search-recent"></div></section>
        <section><h2>Try searching for</h2><div class="home-search-chips" id="home-search-chips"></div></section>
        <section><h2 id="home-search-results-title">Trending Games in United States</h2><div class="home-search-games" id="home-search-games"></div></section>
      </div>
    </section>
    <section class="home-notification-popover" id="home-notification-popover" aria-label="Notifications" hidden>
      <header><strong>Notifications</strong><button type="button" id="home-notifications-close" aria-label="Close notifications">×</button></header>
      <div class="home-notification-list" id="home-notification-list"></div>
    </section>
    <section class="home-profile-pane" id="home-profile-pane" aria-label="Profile" aria-hidden="true">
      <button class="home-profile-shade" type="button" aria-label="Close profile"></button>
      <aside class="home-profile-card">
        <button class="home-profile-close" type="button" aria-label="Close profile">×</button>
        <div class="home-profile-banner"></div>
        <div class="home-profile-identity"><img id="home-profile-avatar" alt=""><div><strong id="home-profile-name">Guest</strong><span id="home-profile-handle">@guest</span></div></div>
        <div class="home-profile-stats"><span><b id="home-profile-friends">0</b> Friends</span></div>
        <div class="home-profile-actions"><button type="button" class="primary" id="home-edit-appearance">Edit appearance</button><button type="button" id="home-edit-profile">Edit profile</button></div>
        <h2>Currently Wearing</h2>
        <div class="home-profile-preview"><canvas id="home-profile-preview-canvas" aria-label="3D avatar preview"></canvas></div>
        <div class="home-profile-wearing"><div><strong>Classic R6 Avatar</strong><small>Head mesh with classic face</small></div></div>
        <h2>Experiences</h2>
        <div class="home-profile-games" id="home-profile-games"></div>
        <button type="button" class="home-profile-full" id="home-profile-full">View full profile</button>
      </aside>
    </section>
    <section class="home-robux-page" id="home-robux-page" aria-hidden="true">
      <header><button type="button" id="home-robux-close" aria-label="Close Robux page">×</button><div>Balance: unavailable</div></header>
      <main><div class="home-robux-balance">${icon('<path d="m7 3 10 1 5 8-5 8-10 1-5-9z"/><path d="m10 9 5-.5-.5 6-5 .5z"/>')}<strong>Robux balance</strong><span>View your balance on Roblox</span><a href="https://www.roblox.com/upgrades/robux" target="_blank" rel="noopener">Open Roblox</a></div><h1>Enjoy up to 25%<br> more Robux</h1><h2>Robux packages</h2><div class="home-robux-packages"><a href="https://www.roblox.com/upgrades/robux" target="_blank" rel="noopener">Buy Robux on Roblox <span>›</span></a></div></main>
    </section>
    <section class="home-drawer" id="home-drawer" aria-label="Roblox menu" aria-hidden="true">
      <button class="home-drawer-shade" id="home-drawer-shade" type="button" aria-label="Close menu"></button>
      <aside class="home-drawer-panel" aria-label="Account and navigation">
        <button type="button" class="home-drawer-profile" id="home-drawer-profile">
          <img src="assets/uploaded/roblox-white.png" alt="" id="home-drawer-avatar">
          <span><strong id="home-drawer-name">Guest</strong><small id="home-drawer-handle">Signed out</small></span>
        </button>
        <div class="home-drawer-social">
          <div class="home-drawer-friends">
            <span class="home-drawer-people">${icon('<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c.7-3.5 3.3-5.3 8-5.3s7.3 1.8 8 5.3\"/>')}</span>
            <strong id="home-drawer-friend-count">0 Friends</strong>
            <button type="button" id="home-drawer-add-friends">Find players</button>
          </div>
          <button type="button" class="home-drawer-plus" data-drawer-action="plus">${icon('<path d="M12 3 21 8v8l-9 5-9-5V8z"/><path d="M12 12v9M3 8l9 5 9-5\"/>')}<span>More fun for less. Roblox Plus.</span><span class="home-drawer-chevron">›</span></button>
        </div>
        <nav class="home-drawer-links" aria-label="Roblox links">
          <button type="button" data-drawer-action="continue">${icon('<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5\"/><path d=\"M4 4v4.5h4.5M12 8v4l2.5 1.5\"/>')}<span>Continue Playing</span></button>
          <button type="button" data-drawer-action="friends">${icon('<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20c.4-3 2.3-4.5 6-4.5s5.6 1.5 6 4.5M16 5.5a3 3 0 0 1 0 5.7M17 15c2.4.4 3.7 2 4 4.5\"/>')}<span>Friends</span><b id="home-drawer-request-count" hidden></b></button>
          <button type="button" data-drawer-action="communities">${icon('<path d=\"M3 20v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/><path d=\"M4 8H2m20 0h-2\"/>')}<span>Communities</span></button>
          <button type="button" data-drawer-action="inventory">${icon('<path d=\"M5 8h14l1 13H4L5 8Z\"/><path d=\"M9 8V6a3 3 0 0 1 6 0v2\"/>')}<span>Inventory</span></button>
          <button type="button" data-drawer-action="trades">${icon('<path d=\"M4 7h15l-3-3M20 17H5l3 3\"/><path d=\"M19 7v4M5 17v-4\"/>')}<span>Trades</span></button>
          <button type="button" data-drawer-action="messages">${icon('<path d=\"M4 5h16v13H9l-5 3z\"/><path d=\"M8 9h8M8 13h5\"/>')}<span>Messages</span><b class=\"home-drawer-unread\" hidden></b></button>
          <button type="button" data-drawer-action="plus">${icon('<path d=\"M12 3 21 8v8l-9 5-9-5V8z\"/><path d=\"M12 12v9M3 8l9 5 9-5\"/>')}<span>Roblox Plus</span></button>
          <button type="button" data-drawer-action="settings">${icon('<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"m19 13.5 1.4 1.1-1.6 2.8-1.7-.7a7 7 0 0 1-1.5.9l-.3 1.9h-3.2l-.3-1.9a7 7 0 0 1-1.5-.9l-1.7.7L7 14.6l1.4-1.1a7 7 0 0 1 0-1.8L7 10.6l1.6-2.8 1.7.7a7 7 0 0 1 1.5-.9l.3-1.9h3.2l.3 1.9a7 7 0 0 1 1.5.9l1.7-.7 1.6 2.8-1.4 1.1a7 7 0 0 1 0 1.8Z\"/>')}<span>Settings</span></button>
          <button type="button" data-drawer-action="help">${icon('<path d=\"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z\"/><path d=\"M9.5 9a2.6 2.6 0 1 1 4.5 1.8c-1.2 1.1-2 1.3-2 3M12 17.5v.1\"/>')}<span>Help &amp; Safety</span></button>
        </nav>
        <div class="home-drawer-lower">
          <button type="button" data-drawer-action="learn">${icon('<path d=\"M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22z\"/><path d=\"M4 5.5v13A3.5 3.5 0 0 1 7.5 15H20\"/>')}<span>Learn</span></button>
          <button type="button" data-drawer-action="create">${icon('<path d=\"m5 5 14-2-2 16-14 2z\"/><path d=\"m10 10 4-1-1 4-4 1z\"/>')}<span>Create</span></button>
          <div class="home-drawer-account-actions">
            <button type="button" data-drawer-action="switch">Switch accounts</button>
            <button type="button" data-drawer-action="signin">Quick sign-in</button>
            <button type="button" data-drawer-action="signout">Sign out</button>
          </div>
          <div class="home-drawer-legal"><a href="https://www.roblox.com/info/terms" target="_blank" rel="noopener">Terms</a><a href="https://www.roblox.com/info/privacy" target="_blank" rel="noopener">Privacy</a></div>
        </div>
      </aside>
    </section>`;
  document.body.appendChild(root);
  const homeOfflineStyle = document.createElement('style');
  homeOfflineStyle.textContent =
    '.home-offline-toggle{height:32px;padding:0 11px;border-radius:999px;border:1px solid rgba(148,163,184,.38);background:rgba(30,41,59,.72);color:#e2e8f0;font:700 12px/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}' +
    '.home-offline-toggle[aria-pressed="true"]{background:#b45309;border-color:#f59e0b;color:#fff}';
  document.head.appendChild(homeOfflineStyle);
  const homeOfflineBtn = root.querySelector('#home-offline-toggle');
  function syncHomeOfflineBtn() {
    const on = !!(window.__multiplayer?.offlinePreferred || window.__multiplayer?.offlineMode || sessionStorage.getItem('roblox-offline-mode') === '1');
    homeOfflineBtn.setAttribute('aria-pressed', String(on));
    homeOfflineBtn.textContent = on ? 'Offline: ON' : 'Offline';
  }
  homeOfflineBtn.addEventListener('click', () => {
    const cur = homeOfflineBtn.getAttribute('aria-pressed') === 'true';
    const next = !cur;
    if (window.__multiplayer?.setOfflinePreferred) window.__multiplayer.setOfflinePreferred(next);
    else {
      try {
        if (next) sessionStorage.setItem('roblox-offline-mode', '1');
        else sessionStorage.removeItem('roblox-offline-mode');
      } catch {}
    }
    syncHomeOfflineBtn();
  });
  window.addEventListener('mp:offline-changed', syncHomeOfflineBtn);
  syncHomeOfflineBtn();

  const friendsEl = root.querySelector('#home-friends');
  const meButton = root.querySelector('#home-me');
  const meImg = meButton.querySelector('img');
  const friendPicker = root.querySelector('#home-friend-picker');
  const pickerList = root.querySelector('#home-picker-list');
  const drawer = root.querySelector('#home-drawer');
  const drawerToggle = root.querySelector('#home-menu-toggle');
  let counts = window.__multiplayer?.connected ? (window.__multiplayer.counts ?? null) : null;
  let roster = [];
  let socialData = null;
  let sortByActivity = false;
  let searchTerm = '';
  let currentUser = null;
  let profileViewer = null;
  let profileViewerFailed = false;
  let notificationItems = [];
  let dismissedGames = new Set();

  function gameMeta(map) {
    const online = counts ? Number(counts[map] || 0) : null;
    return `<span class="home-card-meta${online === null ? ' off' : ''}">${icons.thumb}<span>${online === null ? 'Offline' : `${online} playing`}</span></span>`;
  }
  function gameCard(g, compact = false) {
    if (compact) return `<button class="home-continue-card" type="button" data-map="${esc(g.map)}" aria-label="Continue ${esc(g.title)}">
      <span class="home-continue-thumb"><img src="${esc(g.thumb)}" alt="" loading="lazy"></span>
      <span class="home-card-title">${esc(g.title)}</span>
      <span class="home-continue-meta">${counts ? `${Number(counts[g.map] || 0)} playing` : 'Play now'}</span>
    </button>`;
    if (dismissedGames.has(g.map)) return '';
    return `<article class="home-card" data-map-card="${esc(g.map)}">
      <span class="home-thumb"><img src="${esc(g.thumb)}" alt="" loading="lazy"><button type="button" class="home-card-dismiss" data-dismiss="${esc(g.map)}" aria-label="Dismiss ${esc(g.title)}">×</button></span>
      <span class="home-card-title">${esc(g.title)}</span>
      ${gameMeta(g.map)}
      <button type="button" class="home-card-play" data-map="${esc(g.map)}" aria-label="Play ${esc(g.title)}"><span aria-hidden="true">▶</span></button>
    </article>`;
  }
  function visibleGames() {
    const filtered = GAMES.filter((g) => g.title.toLowerCase().includes(searchTerm));
    if (!sortByActivity || !counts) return filtered;
    return filtered.slice().sort((a, b) => Number(counts[b.map] || 0) - Number(counts[a.map] || 0));
  }
  function paintGames() {
    const games = visibleGames();
    root.querySelector('#home-games').innerHTML = games.map((g) => gameCard(g)).join('');
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('lobby-recent-games') || '[]'); } catch (_) {}
    recent = Array.isArray(recent) ? recent.filter((map) => byMap.has(map)) : [];
    const continueGames = [...new Set([...recent, ...GAMES.map((g) => g.map)])].map((map) => byMap.get(map)).filter((g) => g && g.title.toLowerCase().includes(searchTerm));
    root.querySelector('#home-continue').innerHTML = continueGames.map((g) => gameCard(g, true)).join('');
    root.querySelector('#home-profile-games').innerHTML = GAMES.slice(0, 4).map((g) => `<button type="button" data-map="${esc(g.map)}"><img src="${esc(g.thumb)}" alt=""><span>${esc(g.title)}</span></button>`).join('');
    renderSearchContents();
  }
  const searchView = root.querySelector('#home-search-view');
  const modalSearch = root.querySelector('#home-search-modal-input');
  const suggestions = ['Tycoon', 'Escape', 'Survival', 'Story', 'Escape Room', 'Tower Defense', 'Sandbox', 'RPG', 'Life', 'Quiz'];
  function renderSearchContents() {
    const recent = (() => {
      try {
        const maps = JSON.parse(localStorage.getItem('lobby-recent-games') || '[]');
        return (Array.isArray(maps) ? maps : []).map((map) => byMap.get(map)).filter(Boolean);
      } catch (_) { return []; }
    })();
    const recentGames = recent.length ? [...new Map(recent.map((g) => [g.map, g])).values()] : GAMES.slice(0, 7);
    root.querySelector('#home-search-recent').innerHTML = recentGames.length
      ? recentGames.map((g) => searchGameCard(g)).join('')
      : '<p class="home-search-empty">Games you play will appear here.</p>';
    root.querySelector('#home-search-chips').innerHTML = suggestions.map((word) => `<button type="button" data-search-term="${esc(word)}">${esc(word)}</button>`).join('');
    const results = visibleGames();
    const searching = !!searchTerm;
    root.querySelector('#home-search-results-title').textContent = searching ? 'Search results' : 'Trending Games in United States';
    root.querySelector('#home-search-games').innerHTML = results.length
      ? results.map((g) => searchGameCard(g)).join('')
      : '<p class="home-search-empty">No games found.</p>';
  }
  function searchGameCard(g) {
    const online = counts ? Number(counts[g.map] || 0) + ' playing' : 'Play now';
    return `<button type="button" class="home-search-game" data-map="${esc(g.map)}"><img src="${esc(g.thumb)}" alt="" loading="lazy"><strong>${esc(g.title)}</strong><span>${esc(online)}</span></button>`;
  }
  function openSearch() {
    closeNotifications();
    closeProfile();
    setDrawer(false);
    searchView.classList.add('is-open');
    searchView.setAttribute('aria-hidden', 'false');
    modalSearch.value = searchTerm;
    renderSearchContents();
    requestAnimationFrame(() => modalSearch.focus({ preventScroll: true }));
  }
  function closeSearch() {
    searchView.classList.remove('is-open');
    searchView.setAttribute('aria-hidden', 'true');
    root.querySelector('#home-search-input').value = searchTerm;
  }
  function setSearch(value) {
    searchTerm = value.trim().toLowerCase();
    root.querySelector('#home-search-input').value = value;
    paintGames();
  }
  function renderNotificationPane() {
    const list = root.querySelector('#home-notification-list');
    if (!notificationItems.length) {
      list.innerHTML = '<p class="home-notifications-empty">You’re all caught up.</p>';
      return;
    }
    list.innerHTML = notificationItems.map((item) => {
      const age = item.kind === 'invite' ? 'Game invite' : item.kind === 'request' ? 'Friend request' : 'Update';
      const message = item.kind === 'invite'
        ? `@${item.from?.username || 'Player'} invited you to ${byMap.get(item.map)?.title || 'a game'}.`
        : item.kind === 'request'
          ? `@${item.from?.username || 'Player'} sent you a friend request.`
          : item.text || 'You have a new notification.';
      const action = item.kind === 'invite' ? 'Join' : item.kind === 'request' ? 'Accept' : '';
      return `<article class="home-notification-item" data-notice-id="${item.id}"><div class="home-notification-avatar">${item.from?.username ? `<img src="${avatar(item.from.username)}" alt="">` : icon('<path d=\"M12 3 21 8v8l-9 5-9-5V8z\"/>')}</div><div class="home-notification-copy"><strong>${esc(age)}</strong><p>${esc(message)}</p><div class="home-notification-actions"><button type="button" data-notice-dismiss="${item.id}">Dismiss</button>${action ? `<button type="button" class="primary" data-notice-action="${item.id}">${action}</button>` : ''}</div></div><button type="button" class="home-notification-more" data-notice-dismiss="${item.id}" aria-label="Dismiss notification">⋮</button></article>`;
    }).join('');
  }
  function closeNotifications() {
    root.querySelector('#home-notification-popover').hidden = true;
    root.querySelector('#home-notifications').setAttribute('aria-expanded', 'false');
  }
  function toggleNotifications() {
    const popover = root.querySelector('#home-notification-popover');
    const opening = popover.hidden;
    closeSearch();
    popover.hidden = !opening;
    root.querySelector('#home-notifications').setAttribute('aria-expanded', String(opening));
    if (opening) renderNotificationPane();
  }
  function openProfile() {
    closeNotifications();
    closeSearch();
    closeFriendPicker();
    setDrawer(false);
    const pane = root.querySelector('#home-profile-pane');
    pane.classList.add('is-open');
    pane.setAttribute('aria-hidden', 'false');
    if (!profileViewer && !profileViewerFailed) {
      try {
        profileViewer = window.AvatarViewer.create(root.querySelector('#home-profile-preview-canvas'));
      } catch (_) { profileViewerFailed = true; }
    }
    profileViewer?.setState({ appearance: window.__avatarAppearanceName || null, colors: window.__avatarColors || window.AvatarViewer?.DEFAULT_COLORS });
    profileViewer?.start();
  }
  function closeProfile() {
    root.querySelector('#home-profile-pane').classList.remove('is-open');
    root.querySelector('#home-profile-pane').setAttribute('aria-hidden', 'true');
    profileViewer?.stop();
  }
  function receiveNotification(message) {
    const m = message || {};
    const item = { ...m, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    notificationItems.unshift(item);
    notificationItems = notificationItems.slice(0, 20);
    const badge = root.querySelector('#home-request-badge');
    badge.hidden = false;
    badge.textContent = notificationItems.length > 9 ? '9+' : String(notificationItems.length);
    if (!root.querySelector('#home-notification-popover').hidden) renderNotificationPane();
  }
  window.addEventListener('mp:notice', (e) => receiveNotification(e.detail));
  function paintCounts() { paintGames(); }
  function renderRoster(detail) {
    roster = (detail?.players || []).filter((p) => !p.self && p.id && p.username);
    if (!detail?.connected) counts = null;
    else if (!counts) window.__multiplayer?.requestCounts?.();
    paintCounts();
    paintFriendPicker();
  }
  function renderFriends(data) {
    socialData = data;
    const list = data?.friends || [];
    const addCard = `<button class="home-friend home-add-friend" id="home-add-friend" type="button"><span class="home-friend-avatar">${icons.add}${data?.incoming?.length ? `<i class="home-friend-count">${data.incoming.length}</i>` : ''}</span><span>Add Friends</span></button>`;
    const friendCards = list.map((f) => `<button class="home-friend${f.online ? ' is-online' : ''}" type="button" data-friend="${esc(f.id)}" aria-label="${f.online && byMap.has(f.map) ? 'Join' : 'View'} @${esc(f.username)}${f.online && byMap.has(f.map) ? ' in ' + esc(byMap.get(f.map).title) : ''}"><span class="home-friend-avatar"><img src="${avatar(f.username)}" alt="">${f.online ? '<i></i>' : ''}</span><span class="home-name">${esc(f.username)}</span></button>`).join('');
    friendsEl.innerHTML = addCard + friendCards;
    root.querySelector('#home-add-friend').addEventListener('click', openFriendPicker);
    friendsEl.querySelectorAll('[data-friend]').forEach((button) => button.addEventListener('click', async () => {
      const status=root.querySelector('#home-friend-status');status.hidden=false;status.textContent='Checking where your friend is playing…';button.disabled=true;
      try{const response=await fetch('/api/social',{cache:'no-store'});if(!response.ok)throw Error('unavailable');const data=await response.json();const friend=(data.friends||[]).find(f=>f.id===button.dataset.friend);if(friend?.online&&typeof friend.map==='string'&&byMap.has(friend.map)){status.hidden=true;play(friend.map);return}status.textContent='Your friend is not in a joinable game right now.';renderFriends(data)}catch(_){status.textContent='Could not check your friend’s game. Please try again.'}finally{button.disabled=false}
    }));
    const badge = root.querySelector('#home-request-badge');
    const incoming = data?.incoming?.length || 0;
    const totalBadge = Math.max(incoming, notificationItems.length);
    badge.hidden = totalBadge === 0;
    badge.textContent = totalBadge > 9 ? '9+' : String(totalBadge);
    root.querySelector('#home-drawer-friend-count').textContent = `${list.length} ${list.length === 1 ? 'Friend' : 'Friends'}`;
    root.querySelector('#home-profile-friends').textContent = list.length;
    const drawerBadge = root.querySelector('#home-drawer-request-count');
    drawerBadge.hidden = incoming === 0;
    drawerBadge.textContent = incoming > 99 ? '99+' : String(incoming);
    for (const request of data?.incoming || []) {
      const id = 'friend-' + request.id;
      if (!notificationItems.some((item) => item.id === id || (item.kind === 'request' && item.from?.id === request.id))) {
        notificationItems.push({ id, kind: 'request', from: request });
      }
    }
    if (notificationItems.length > 20) notificationItems = notificationItems.slice(-20);
    if (!root.querySelector('#home-notification-popover').hidden) renderNotificationPane();
    paintFriendPicker();
  }
  async function loadFriends() {
    try {
      const r = await fetch('/api/social', { cache: 'no-store' });
      if (r.ok) renderFriends(await r.json());
      else renderFriends(null);
    } catch (_) { renderFriends(null); }
  }
  window.addEventListener('social:changed', loadFriends);
  window.addEventListener('mp:roster', (e) => renderRoster(e.detail));
  window.addEventListener('mp:counts', (e) => { counts = e.detail; paintCounts(); });
  setInterval(() => { if (!root.hidden) loadFriends(); }, 20000);

  function paintFriendPicker() {
    if (!pickerList) return;
    const friendIds = new Set([...(socialData?.friends || []), ...(socialData?.outgoing || [])].map((p) => p.id));
    const available = roster.filter((p) => !friendIds.has(p.id));
    if (!window.__multiplayer?.connected) {
      pickerList.innerHTML = '<p>Join a game to find players to add.</p>';
      return;
    }
    if (!available.length) {
      pickerList.innerHTML = '<p>No new players are here right now.</p>';
      return;
    }
    pickerList.innerHTML = available.map((p) => {
      const isIncoming = (socialData?.incoming || []).some((x) => x.id === p.id);
      const isOutgoing = (socialData?.outgoing || []).some((x) => x.id === p.id);
      const label = isIncoming ? 'Accept' : isOutgoing ? 'Sent' : 'Add';
      return `<div class="home-picker-person"><img src="${avatar(p.username)}" alt=""><span>@${esc(p.username)}</span><button type="button" data-request="${esc(p.id)}" ${isOutgoing ? 'disabled' : ''}>${label}</button></div>`;
    }).join('');
    pickerList.querySelectorAll('[data-request]').forEach((button) => button.addEventListener('click', () => {
      const incoming = (socialData?.incoming || []).some((x) => x.id === button.dataset.request);
      window.__multiplayer?.social?.(incoming ? 'accept' : 'request', button.dataset.request);
      button.textContent = incoming ? 'Accepted' : 'Sent';
      button.disabled = true;
      setTimeout(loadFriends, 500);
    }));
  }
  function openFriendPicker() { friendPicker.hidden = false; paintFriendPicker(); }
  function closeFriendPicker() { friendPicker.hidden = true; }
  root.querySelector('#home-picker-close').addEventListener('click', closeFriendPicker);
  friendPicker.addEventListener('click', (e) => { if (e.target === friendPicker) closeFriendPicker(); });
  root.querySelector('#home-notifications').addEventListener('click', (e) => { e.stopPropagation(); toggleNotifications(); });
  root.querySelector('#home-notifications-close').addEventListener('click', closeNotifications);
  root.querySelector('#home-notification-list').addEventListener('click', (e) => {
    const dismiss = e.target.closest('[data-notice-dismiss]');
    if (dismiss) {
      notificationItems = notificationItems.filter((item) => item.id !== dismiss.dataset.noticeDismiss);
      renderNotificationPane();
      const badge = root.querySelector('#home-request-badge');
      badge.hidden = !notificationItems.length;
      badge.textContent = notificationItems.length > 9 ? '9+' : String(notificationItems.length);
      return;
    }
    const action = e.target.closest('[data-notice-action]');
    if (!action) return;
    const item = notificationItems.find((x) => x.id === action.dataset.noticeAction);
    if (!item) return;
    if (item.kind === 'request' && item.from?.id) window.__multiplayer?.social?.('accept', item.from.id);
    if (item.kind === 'invite' && byMap.has(item.map)) play(item.map);
    notificationItems = notificationItems.filter((x) => x.id !== item.id);
    renderNotificationPane();
  });

  Promise.resolve(window.websim?.getUser?.()).then((user) => {
    if (!user?.username) return;
    currentUser = user;
    meImg.src = avatar(user.username);
    root.querySelector('#home-username').textContent = user.username;
    root.querySelector('#home-drawer-avatar').src = avatar(user.username);
    root.querySelector('#home-drawer-name').textContent = user.username;
    root.querySelector('#home-drawer-handle').textContent = '@' + user.username;
    root.querySelector('#home-profile-avatar').src = avatar(user.username);
    root.querySelector('#home-profile-name').textContent = user.username;
    root.querySelector('#home-profile-handle').textContent = '@' + user.username;
  }).catch(() => {});

  function play(map) {
    try {
      const saved = JSON.parse(localStorage.getItem('lobby-recent-games') || '[]');
      localStorage.setItem('lobby-recent-games', JSON.stringify([map, ...(Array.isArray(saved) ? saved : []).filter((item) => item !== map)].slice(0, 12)));
    } catch (_) {}
    const current = window.MapSelection?.id || 'game';
    const wantOffline = !!(window.__multiplayer?.offlinePreferred || sessionStorage.getItem('roblox-offline-mode') === '1');
    if (current !== map) {
      const url = new URL(location.href);
      url.searchParams.set('map', map);
      url.searchParams.set('play', '1');
      if (wantOffline) url.searchParams.set('offline', '1');
      else url.searchParams.delete('offline');
      location.assign(url.href);
      return;
    }
    if (wantOffline && !window.__multiplayer?.offlineMode) {
      window.__multiplayer?.enterOffline?.('Offline mode enabled · Solo local play');
    }
    root.hidden = true;
    window.__homeOpen = false;
    window.dispatchEvent(new CustomEvent('home:play', { detail: { map } }));
  }
  root.addEventListener('click', (e) => {
    const dismiss = e.target.closest('[data-dismiss]');
    if (dismiss) {
      e.stopPropagation();
      dismissedGames.add(dismiss.dataset.dismiss);
      paintGames();
      return;
    }
    const button = e.target.closest('[data-map]');
    if (button) play(button.dataset.map);
  });
  const topSearch = root.querySelector('#home-search-input');
  topSearch.readOnly = true;
  topSearch.addEventListener('focus', openSearch);
  topSearch.addEventListener('click', openSearch);
  root.querySelector('.home-search-shade').addEventListener('click', closeSearch);
  root.querySelector('#home-search-cancel').addEventListener('click', closeSearch);
  modalSearch.addEventListener('input', () => setSearch(modalSearch.value));
  root.querySelector('#home-search-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-search-term]');
    if (!chip) return;
    modalSearch.value = chip.dataset.searchTerm;
    setSearch(modalSearch.value);
    modalSearch.focus();
  });
  root.querySelector('#home-continue-next').addEventListener('click', () => {
    const strip = root.querySelector('#home-continue');
    strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: 'smooth' });
  });
  const homeNav = root.querySelector('#home-nav-home');
  const chartsNav = root.querySelector('#home-nav-charts');
  const avatarNav = root.querySelector('#home-nav-me');
  const navItems = [...root.querySelectorAll('.home-nav-items button')];
  function setNav(button) {
    navItems.forEach((item) => { item.classList.toggle('on', item === button); item.removeAttribute('aria-current'); });
    if (button) button.setAttribute('aria-current', 'page');
  }
  homeNav.addEventListener('click', () => { window.AvatarStudio?.close(); showView('home'); sortByActivity = false; paintGames(); setNav(homeNav); });
  chartsNav.addEventListener('click', () => { window.AvatarStudio?.close(); showView('home'); sortByActivity = true; paintGames(); setNav(chartsNav); root.querySelector('#home-recommended-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  root.querySelector('#home-nav-chat').addEventListener('click', () => {
    root.hidden = true; window.__homeOpen = false;
    document.getElementById('rbx-chat-button')?.click();
  });
  avatarNav.addEventListener('click', () => { setNav(avatarNav); window.AvatarStudio?.open(); });
  meButton.addEventListener('click', openProfile);
  root.querySelector('.home-profile-shade').addEventListener('click', closeProfile);
  root.querySelector('.home-profile-close').addEventListener('click', closeProfile);
  root.querySelector('#home-edit-appearance').addEventListener('click', () => { closeProfile(); window.AvatarStudio?.open(); });
  root.querySelector('#home-edit-profile').addEventListener('click', () => {
    if (currentUser?.username) window.open('https://websim.com/@' + encodeURIComponent(currentUser.username), '_blank', 'noopener');
  });
  root.querySelector('#home-profile-full').addEventListener('click', () => {
    if (currentUser?.username) window.open('https://websim.com/@' + encodeURIComponent(currentUser.username), '_blank', 'noopener');
  });
  root.querySelector('#home-robux').addEventListener('click', () => {
    closeNotifications();
    closeProfile();
    closeSearch();
    root.querySelector('#home-robux-page').classList.add('is-open');
    root.querySelector('#home-robux-page').setAttribute('aria-hidden', 'false');
  });
  root.querySelector('#home-robux-close').addEventListener('click', () => {
    root.querySelector('#home-robux-page').classList.remove('is-open');
    root.querySelector('#home-robux-page').setAttribute('aria-hidden', 'true');
  });
  function setDrawer(open) {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    drawerToggle.setAttribute('aria-expanded', String(open));
    drawerToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  drawerToggle.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-open')));
  root.querySelector('#home-drawer-shade').addEventListener('click', () => setDrawer(false));
  root.querySelector('#home-drawer-profile').addEventListener('click', () => {
    setDrawer(false);
    openProfile();
  });
  root.querySelector('#home-drawer-add-friends').addEventListener('click', () => {
    setDrawer(false);
    openFriendPicker();
  });
  const drawerLinks = {
    communities: 'https://www.roblox.com/communities',
    inventory: 'https://www.roblox.com/users/inventory',
    trades: 'https://www.roblox.com/trades',
    plus: 'https://www.roblox.com/premium/membership',
    help: 'https://www.roblox.com/help',
    learn: 'https://education.roblox.com/',
    create: 'https://create.roblox.com/',
    switch: 'https://www.roblox.com/login',
    signin: 'https://www.roblox.com/login',
    signout: 'https://www.roblox.com/logout',
  };
  root.querySelectorAll('[data-drawer-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.drawerAction;
    if (action === 'continue') { setDrawer(false); return; }
    if (action === 'friends') {
      setDrawer(false);
      friendsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (action === 'messages') {
      setDrawer(false);
      root.hidden = true;
      window.__homeOpen = false;
      document.getElementById('rbx-chat-button')?.click();
      return;
    }
    if (action === 'settings') {
      setDrawer(false);
      root.hidden = true;
      window.__homeOpen = false;
      document.getElementById('rbx-menu-button')?.click();
      return;
    }
    const url = drawerLinks[action];
    if (url) window.open(url, '_blank', 'noopener');
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (searchView.classList.contains('is-open')) closeSearch();
    else if (!root.querySelector('#home-notification-popover').hidden) closeNotifications();
    else if (root.querySelector('#home-profile-pane').classList.contains('is-open')) closeProfile();
    else if (root.querySelector('#home-robux-page').classList.contains('is-open')) root.querySelector('#home-robux-close').click();
    else if (drawer.classList.contains('is-open')) setDrawer(false);
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  document.addEventListener('pointerdown', (e) => {
    const popover = root.querySelector('#home-notification-popover');
    if (!popover.hidden && !popover.contains(e.target) && !root.querySelector('#home-notifications').contains(e.target)) closeNotifications();
  });
  root.querySelector('.home-brand').addEventListener('click', (e) => e.preventDefault());

  function showView(view) {
    const isAvatar = view === 'avatar';
    root.classList.toggle('is-avatar', isAvatar);
    root.querySelector('.home-main').hidden = isAvatar;
    setNav(isAvatar ? avatarNav : homeNav);
  }
  const autoPlay = new URLSearchParams(location.search).get('play') === '1';
  root.hidden = autoPlay;
  window.__homeOpen = !autoPlay;
  paintGames();
  loadFriends();
  if (window.__multiplayer?.connected && !counts) window.__multiplayer.requestCounts?.();
  window.HomeScreen = Object.freeze({
    show() { root.hidden = false; window.__homeOpen = true; },
    hide() { root.hidden = true; window.__homeOpen = false; },
    showAvatar() { showView('avatar'); },
    showHome() { showView('home'); },
  });
})();
