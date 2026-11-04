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
    catalog: icon('<path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    avatar: icon('<circle cx="12" cy="6.5" r="3.2"/><path d="m7.5 11.5 4.5 1.8 4.5-1.8V20h-9z"/><path d="m7.5 11.5-3 3.5M16.5 11.5l3 3.5"/>'),
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
        <button id="home-nav-catalog" type="button">${icons.catalog}<span>Catalog</span></button>
        <button id="home-nav-avatar" type="button">${icons.avatar}<span>Avatar</span></button>
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
          <button class="home-account-user" id="home-me" type="button" aria-label="Open avatar editor"><img class="home-me" alt=""><span id="home-username">Guest</span></button>
          <button class="home-icon-button home-robux-button" type="button" id="home-robux" aria-label="Robux">${icon('<path d="m7 3 10 1 5 8-5 8-10 1-5-9z"/><path d="m10 9 5-.5-.5 6-5 .5z"/>')}</button>
          <button class="home-icon-button home-notification" type="button" id="home-notifications" aria-label="Notifications" aria-expanded="false">${icons.bell}<span id="home-request-badge" hidden></span></button>
        </div>
      </header>
      <main class="home-main">
        <section class="home-friends-section" aria-label="Friends">
          <div class="home-friends-shell" style="position:relative;display:flex;align-items:center;gap:6px;min-width:0;"><button type="button" id="home-friends-prev" aria-label="Scroll friends left" hidden style="flex:0 0 auto;width:28px;height:28px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.45);color:#fff;font-size:18px;line-height:1;cursor:pointer;padding:0;">‹</button><div class="home-friends" id="home-friends" style="flex:1 1 auto;min-width:0;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;scrollbar-width:none;"></div><button type="button" id="home-friends-next" aria-label="Scroll friends right" hidden style="flex:0 0 auto;width:28px;height:28px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.45);color:#fff;font-size:18px;line-height:1;cursor:pointer;padding:0;">›</button></div><p id="home-friend-status" role="status" aria-live="polite" hidden></p>
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
      <section class="home-catalog-host" id="home-catalog-host" aria-label="Catalog" hidden>
        <div class="home-catalog-header">
          <div>
            <h1>Catalog</h1>
            <p>Pick items for your collection here, then open the Avatar Editor to choose which ones to wear.</p>
          </div>
          <div class="home-catalog-header-actions">
            <button type="button" class="home-catalog-wear-btn" id="home-catalog-open-avatar">Open Avatar Editor to Wear →</button>
          </div>
        </div>
        <div class="home-catalog-toolbar">
          <div class="home-catalog-tabs" id="home-catalog-tabs" role="tablist" aria-label="Catalog categories">
            <button type="button" class="on" data-cat="all">All</button>
            <button type="button" data-cat="faces">Faces</button>
            <button type="button" data-cat="shirts">Shirts</button>
            <button type="button" data-cat="pants">Pants</button>
            <button type="button" data-cat="tshirts">T-Shirts</button>
            <button type="button" data-cat="hair">Hair</button>
            <button type="button" data-cat="shoulder">Shoulder</button>
            <button type="button" data-cat="back">Back</button>
            <button type="button" data-cat="hats">Hats &amp; IDs</button>
          </div>
          <input id="home-catalog-search" class="home-catalog-search" type="search" placeholder="Search catalog (e.g. Sonic, Man Face, Backpack)…" aria-label="Search catalog items">
          <form class="home-catalog-id-form" id="home-catalog-id-form">
            <input id="home-catalog-asset-input" type="text" inputmode="numeric" placeholder="Add Roblox Asset ID (e.g. 1829157894)" aria-label="Roblox Asset ID">
            <button type="submit">Add to Collection</button>
          </form>
        </div>
        <p class="home-catalog-status" id="home-catalog-status" role="status" aria-live="polite" hidden></p>
        <div class="home-catalog-grid" id="home-catalog-grid"></div>
      </section>
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
        <div class="home-profile-actions"><button type="button" class="primary" id="home-edit-appearance">Edit Avatar</button><button type="button" id="home-open-catalog-from-me">Catalog</button><button type="button" id="home-edit-profile">Profile</button></div>
        <h2>Currently Wearing &amp; Your Stuff</h2>
        <div class="home-profile-preview"><canvas id="home-profile-preview-canvas" aria-label="3D avatar preview"></canvas></div>
        <div class="home-profile-wearing" id="home-profile-wearing"><div><strong>Classic R6 Avatar</strong><small>Head mesh with classic face</small></div></div>
        <h2>Your Games &amp; Creations</h2>
        <div class="home-profile-studio" id="home-profile-studio">
          <div class="home-profile-studio-info"><strong id="home-profile-studio-title">My World Studio Place</strong><small id="home-profile-studio-meta">Build and save your own 3D place</small></div>
          <button type="button" class="primary" id="home-profile-open-studio">Open Studio</button>
        </div>
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
  document.documentElement?.classList?.remove('is-home-boot');
  const homeOfflineStyle = document.createElement('style');
  homeOfflineStyle.textContent =
    '.home-catalog-host{flex:1;min-height:0;overflow:auto;padding:20px 30px 32px;background:#111113;color:#f5f5f7}' +
    '.home-catalog-host[hidden]{display:none}' +
    '.home-catalog-header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}' +
    '.home-catalog-header h1{margin:0 0 4px;font-size:22px;font-weight:700}' +
    '.home-catalog-header p{margin:0;color:#a1a1aa;font-size:13px}' +
    '.home-catalog-wear-btn{height:36px;padding:0 14px;border-radius:8px;border:1px solid #3b82f6;background:#2563eb;color:#fff;font:600 13px/1 system-ui,sans-serif;cursor:pointer}' +
    '.home-catalog-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}' +
    '.home-catalog-tabs{display:flex;flex-wrap:wrap;gap:6px}' +
    '.home-catalog-tabs button{height:32px;padding:0 12px;border-radius:999px;border:1px solid #2d2d35;background:#1c1c22;color:#d4d4d8;font:600 12px/1 system-ui,sans-serif;cursor:pointer}' +
    '.home-catalog-tabs button.on{background:#f4f4f5;border-color:#f4f4f5;color:#111113}' +
    '.home-catalog-search{height:34px;min-width:210px;max-width:280px;flex:1;padding:0 10px;border-radius:7px;border:1px solid #32323b;background:#1c1c22;color:#f4f4f5;font:13px system-ui,sans-serif}' +
    '.home-catalog-id-form{display:flex;gap:8px;flex:1;max-width:380px;min-width:240px}' +
    '.home-catalog-id-form input{flex:1;height:34px;padding:0 10px;border-radius:7px;border:1px solid #32323b;background:#1c1c22;color:#f4f4f5;font:13px system-ui,sans-serif}' +
    '.home-catalog-id-form button{height:34px;padding:0 12px;border-radius:7px;border:0;background:#3f3f46;color:#fff;font:600 12px/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}' +
    '.home-catalog-status{margin:0 0 12px;padding:8px 12px;border-radius:7px;background:#1e293b;color:#e2e8f0;font-size:12px}' +
    '.home-catalog-status[data-error="true"]{background:#450a0a;border:1px solid #b91c1c;color:#fecaca}' +
    '.home-catalog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:12px}' +
    '.home-catalog-card{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:10px;border:1px solid #26262e;background:#18181d}' +
    '.home-catalog-thumb{height:96px;border-radius:8px;background:#22222a;display:flex;align-items:center;justify-content:center;color:#9ca3af;font:700 12px/1.2 system-ui,sans-serif;text-align:center;padding:8px;overflow:hidden}' +
    '.home-catalog-thumb img{max-width:100%;max-height:100%;object-fit:contain}' +
    '.home-catalog-card strong{font-size:13px;line-height:1.25;color:#f4f4f5}' +
    '.home-catalog-card small{font-size:11px;color:#9ca3af}' +
    '.home-catalog-card button{margin-top:auto;height:30px;border-radius:6px;border:1px solid #3f3f46;background:#27272a;color:#f4f4f5;font:600 12px/1 system-ui,sans-serif;cursor:pointer}' +
    '.home-catalog-card button.is-owned{background:#14532d;border-color:#22c55e;color:#dcfce7}' +
    '.home-catalog-card button[disabled]{opacity:.55;cursor:not-allowed}' +
    '.home-profile-studio{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;margin:0 0 12px;border-radius:8px;background:#222229;border:1px solid #30303a}' +
    '.home-profile-studio-info{display:flex;flex-direction:column;gap:2px}' +
    '.home-profile-studio-info strong{font-size:13px;color:#f4f4f5}' +
    '.home-profile-studio-info small{font-size:11px;color:#a1a1aa}' +
    '.home-profile-studio button{height:30px;padding:0 12px;border-radius:6px;border:0;background:#2563eb;color:#fff;font:600 12px/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}';
  document.head.appendChild(homeOfflineStyle);
  // #2993/#2985: the Home Offline toggle is removed — offline engages ONLY via the multiplayer
  // bounded-retry auto-fallback (arena4 lane). Clear any stale session preference once so it can
  // never trap a session; stored offline builds (localStorage) are untouched.
  try { sessionStorage.removeItem('roblox-offline-mode'); } catch {}

  const friendsEl = root.querySelector('#home-friends');
  const meButton = root.querySelector('#home-me');
  const meImg = meButton.querySelector('img');
  const friendPicker = root.querySelector('#home-friend-picker');
  const pickerList = root.querySelector('#home-picker-list');
  const drawer = root.querySelector('#home-drawer');
  const drawerToggle = root.querySelector('#home-menu-toggle');
  let counts = (window.__multiplayer?.connected || window.__multiplayer?.lobbyConnected) ? (window.__multiplayer.counts ?? null) : null;
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
  function refreshProfileSummary() {
    const wearingEl = root.querySelector('#home-profile-wearing');
    if (wearingEl) {
      let equipped = [];
      try {
        const raw = JSON.parse(localStorage.getItem('roblox-avatar-editor-v1') || 'null');
        if (Array.isArray(raw?.items)) equipped = raw.items;
      } catch (_) {}
      const owned = window.CatalogCollection?.getOwned?.() || [];
      const baseName = window.__avatarAppearanceName && !String(window.__avatarAppearanceName).startsWith('__custom__')
        ? window.__avatarAppearanceName
        : null;
      const title = baseName ? `Character: ${baseName}` : (equipped.length ? `${equipped.length} Equipped Asset${equipped.length === 1 ? '' : 's'}` : 'Classic R6 Avatar');
      const subParts = [];
      if (equipped.length) {
        const names = equipped.map((i) => i.label || window.CatalogPack?.byId?.(i.id)?.title || `${i.type || 'Asset'} #${i.id}`);
        subParts.push('Wearing: ' + names.join(', '));
      } else subParts.push('Head mesh with classic face');
      subParts.push(`Catalog collection: ${owned.length} item${owned.length === 1 ? '' : 's'}`);
      wearingEl.innerHTML = `<div><strong>${esc(title)}</strong><small>${esc(subParts.join(' · '))}</small></div>`;
    }
    const studioMeta = root.querySelector('#home-profile-studio-meta');
    if (studioMeta) {
      fetch('/api/studio-place', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((j) => {
        if (j?.place && Array.isArray(j.place.items)) {
          studioMeta.textContent = `${j.place.items.length} saved part${j.place.items.length === 1 ? '' : 's'} in your 3D place`;
        } else {
          studioMeta.textContent = 'Build and save your own 3D place';
        }
      }).catch(() => {});
    }
  }
  function openProfile() {
    window.__pendingAvatarOpen = false;
    window.AvatarStudio?.close?.();
    showView('home');
    closeNotifications();
    closeSearch();
    closeFriendPicker();
    setDrawer(false);
    refreshProfileSummary();
    const pane = root.querySelector('#home-profile-pane');
    pane.classList.add('is-open');
    pane.setAttribute('aria-hidden', 'false');
    setNav(root.querySelector('#home-nav-me'));
    if (!profileViewer && !profileViewerFailed) {
      try {
        profileViewer = window.AvatarViewer.create(root.querySelector('#home-profile-preview-canvas'));
      } catch (_) { profileViewerFailed = true; }
    }
    const appName = window.__avatarAppearanceName || null;
    if (profileViewer && appName && String(appName).startsWith('__custom__')) {
      try {
        const raw = JSON.parse(localStorage.getItem('roblox-avatar-editor-v1') || 'null');
        if (Array.isArray(raw?.items) && raw.items.length && profileViewer.renderer?.applyOverride) {
          profileViewer.renderer.applyOverride(appName, raw.items, raw.base || null).catch(() => {});
        }
      } catch (_) {}
    }
    profileViewer?.setState({ appearance: appName, colors: window.__avatarColors || window.AvatarViewer?.DEFAULT_COLORS });
    profileViewer?.start();
  }
  function closeProfile() {
    root.querySelector('#home-profile-pane').classList.remove('is-open');
    root.querySelector('#home-profile-pane').setAttribute('aria-hidden', 'true');
    profileViewer?.stop();
    if (!root.classList.contains('is-avatar') && root.querySelector('#home-catalog-host')?.hidden !== false) {
      setNav(root.querySelector('#home-nav-home'));
    }
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
    if (!detail?.connected && !detail?.lobby) counts = null;
    else if (!counts) window.__multiplayer?.requestCounts?.();
    paintCounts();
    paintFriendPicker();
  }
  let friendPagerWired = false;
  function updateFriendArrows() {
    if (!friendsEl) return;
    const prev = root.querySelector('#home-friends-prev'), next = root.querySelector('#home-friends-next');
    if (!prev || !next) return;
    const max = Math.max(0, friendsEl.scrollWidth - friendsEl.clientWidth);
    const overflow = max > 4;
    prev.hidden = !overflow; next.hidden = !overflow;
    prev.disabled = friendsEl.scrollLeft <= 2;
    next.disabled = friendsEl.scrollLeft >= max - 2;
    prev.style.opacity = prev.disabled ? '.35' : '1';
    next.style.opacity = next.disabled ? '.35' : '1';
  }
  function setupFriendPager() {
    if (friendPagerWired) { updateFriendArrows(); return; }
    const prev = root.querySelector('#home-friends-prev'), next = root.querySelector('#home-friends-next');
    if (!prev || !next || !friendsEl) return;
    friendPagerWired = true;
    const page = () => Math.max(120, Math.round(friendsEl.clientWidth * 0.8));
    prev.addEventListener('click', () => { friendsEl.scrollBy({ left: -page(), behavior: 'smooth' }); });
    next.addEventListener('click', () => { friendsEl.scrollBy({ left: page(), behavior: 'smooth' }); });
    friendsEl.addEventListener('scroll', updateFriendArrows, { passive: true });
    window.addEventListener('resize', updateFriendArrows);
    if (typeof ResizeObserver === 'function') new ResizeObserver(updateFriendArrows).observe(friendsEl);
    updateFriendArrows();
  }
  function renderFriends(data) {
    socialData = data;
    const list = data?.friends || [];
    const addCard = `<button class="home-friend home-add-friend" id="home-add-friend" type="button"><span class="home-friend-avatar">${icons.add}${data?.incoming?.length ? `<i class="home-friend-count">${data.incoming.length}</i>` : ''}</span><span>Add Friends</span></button>`;
    const friendCards = list.map((f) => `<button class="home-friend${f.online ? ' is-online' : ''}" type="button" data-friend="${esc(f.id)}" aria-label="${f.online && byMap.has(f.map) ? 'Join' : 'View'} @${esc(f.username)}${f.online && byMap.has(f.map) ? ' in ' + esc(byMap.get(f.map).title) : ''}"><span class="home-friend-avatar"><img src="${avatar(f.username)}" alt="">${f.online ? '<i></i>' : ''}</span><span class="home-name">${esc(f.username)}</span></button>`).join('');
    friendsEl.innerHTML = addCard + friendCards;
    root.querySelector('#home-add-friend').addEventListener('click', openFriendPicker);
    setupFriendPager();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(updateFriendArrows);
    friendsEl.querySelectorAll('img').forEach((img) => img.addEventListener('load', updateFriendArrows, { once: true }));
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
    if (!window.__multiplayer?.connected && !window.__multiplayer?.lobbyConnected) {
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
    migratePreAuthCatalog();
    meImg.src = avatar(user.username);
    root.querySelector('#home-username').textContent = user.username;
    root.querySelector('#home-drawer-avatar').src = avatar(user.username);
    root.querySelector('#home-drawer-name').textContent = user.username;
    root.querySelector('#home-drawer-handle').textContent = '@' + user.username;
    root.querySelector('#home-profile-avatar').src = avatar(user.username);
    root.querySelector('#home-profile-name').textContent = user.username;
    root.querySelector('#home-profile-handle').textContent = '@' + user.username;
    paintCatalog();
  }).catch(() => {});

  function play(map) {
    try {
      const saved = JSON.parse(localStorage.getItem('lobby-recent-games') || '[]');
      localStorage.setItem('lobby-recent-games', JSON.stringify([map, ...(Array.isArray(saved) ? saved : []).filter((item) => item !== map)].slice(0, 12)));
    } catch (_) {}
    const current = window.MapSelection?.id || 'game';
    // #2993: never derive offline mode from a stored preference — only preserve an ALREADY
    // active auto-fallback offline session (window.__multiplayer.offlineMode set by the bounded
    // retry path). No manual offline entry point remains.
    const alreadyOffline = !!window.__multiplayer?.offlineMode;
    if (current !== map) {
      const url = new URL(location.href);
      url.searchParams.set('map', map);
      url.searchParams.delete('play');   // #4550: a named map is enough to start playing
      if (alreadyOffline) url.searchParams.set('offline', '1');
      else url.searchParams.delete('offline');
      location.assign(url.href);
      return;
    }
    window.JoiningScreen?.run?.();
    if (window.__multiplayer?.enterGame) {
      window.__multiplayer.enterGame();
    }
    root.hidden = true;
    window.__homeOpen = false;
    document.documentElement?.classList?.remove('is-home-boot');
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
  const catalogNav = root.querySelector('#home-nav-catalog');
  const avatarNav = root.querySelector('#home-nav-avatar');
  const meNav = root.querySelector('#home-nav-me');
  const catalogHost = root.querySelector('#home-catalog-host');
  const catalogGrid = root.querySelector('#home-catalog-grid');
  const catalogStatus = root.querySelector('#home-catalog-status');
  const navItems = [...root.querySelectorAll('.home-nav-items button')];
  function setNav(button) {
    navItems.forEach((item) => { item.classList.toggle('on', item === button); item.removeAttribute('aria-current'); });
    if (button) button.setAttribute('aria-current', 'page');
  }

  let activeCatalogCategory = 'all';
  let catalogLastPersisted = true;
  let catalogLastError = '';
  const CATALOG_CAP = 120;
  const sessionOwnedByKey = new Map();
  const preAuthAddedItems = new Map();
  const catalogStoreKey = () => 'roblox-catalog-collection-v1:' + (currentUser?.id || 'guest');
  function readOwnedCatalog() {
    const k = catalogStoreKey();
    if (sessionOwnedByKey.has(k)) return sessionOwnedByKey.get(k).slice();
    try {
      const parsed = JSON.parse(localStorage.getItem(k) || '[]');
      return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x.key === 'string') : [];
    } catch (_) { return []; }
  }
  function writeOwnedCatalog(list) {
    const k = catalogStoreKey();
    const clean = list.slice(0, CATALOG_CAP);
    let persisted = false;
    try {
      localStorage.setItem(k, JSON.stringify(clean));
      sessionOwnedByKey.delete(k);
      persisted = true;
    } catch (_) {
      sessionOwnedByKey.set(k, clean);
      persisted = false;
    }
    catalogLastPersisted = persisted;
    window.dispatchEvent(new CustomEvent('catalog:owned-changed', { detail: { items: clean, persisted } }));
    return persisted;
  }
  function migratePreAuthCatalog() {
    if (!currentUser?.id) return;
    const cur = readOwnedCatalog();
    let changed = false;
    for (const item of preAuthAddedItems.values()) {
      if (!cur.some((x) => x.key === item.key) && cur.length < CATALOG_CAP) { cur.push(item); changed = true; }
    }
    preAuthAddedItems.clear();
    try {
      const claimKey = 'roblox-catalog-guest-claimed-v1';
      const claimedBy = localStorage.getItem(claimKey);
      if (!claimedBy) {
        const guestItems = JSON.parse(localStorage.getItem('roblox-catalog-collection-v1:guest') || '[]');
        if (Array.isArray(guestItems) && guestItems.length) {
          for (const item of guestItems) {
            if (item && typeof item.key === 'string' && !cur.some((x) => x.key === item.key) && cur.length < CATALOG_CAP) {
              cur.push(item);
              changed = true;
            }
          }
          localStorage.setItem(claimKey, String(currentUser.id));
          localStorage.removeItem('roblox-catalog-collection-v1:guest');
        }
      }
    } catch (_) {}
    if (changed) writeOwnedCatalog(cur);
  }
  const DEFAULT_CATALOG_ITEMS = window.CatalogPack?.items ? [...window.CatalogPack.items] : [
    { key: 'asset:1829157894', assetId: '1829157894', type: 'Hat', title: 'Jurassic World Backpack', category: 'back', subtitle: 'Back Accessory · BodyBackAttachment · #1829157894', thumb: 'assets/catalog/thumbs/back-1829157894.png', available: true },
    { key: 'asset:1028606', assetId: '1028606', type: 'Hat', title: 'Red Baseball Cap', category: 'hats', subtitle: 'Classic Roblox Hat · #1028606', available: true },
    { key: 'asset:1309918', assetId: '1309918', type: 'Hat', title: 'Blue Winter Cap', category: 'hats', subtitle: 'Classic Roblox Hat · #1309918', available: true },
    { key: 'asset:151675683', assetId: '151675683', type: 'Hat', title: 'Hero Mask', category: 'hats', subtitle: 'Head Accessory · #151675683', available: true },
    { key: 'asset:48474294', assetId: '48474294', type: 'Hat', title: 'Beautiful Hair', category: 'hair', subtitle: 'Hair Accessory · #48474294', available: true },
    { key: 'asset:62234425', assetId: '62234425', type: 'Hat', title: 'Brown Charmer Hair', category: 'hair', subtitle: 'Hair Accessory · #62234425', available: true },
    { key: 'asset:20573078', assetId: '20573078', type: 'Hat', title: 'Sideswept Shaggy', category: 'hair', subtitle: 'Hair Accessory · #20573078', available: true },
  ];
  let extraCatalogItems = window.CatalogPack?.items ? [...window.CatalogPack.items] : [];
  let catalogSearchQuery = '';
  const typeToCategory = (type) => {
    if (type === 'Face') return 'faces';
    if (type === 'Shirt') return 'shirts';
    if (type === 'Pants') return 'pants';
    if (type === 'TShirt') return 'tshirts';
    return 'hats';
  };
  window.CatalogCollection = Object.freeze({
    get lastPersisted() { return catalogLastPersisted; },
    get lastError() { return catalogLastError; },
    getOwned: readOwnedCatalog,
    has(key) { return readOwnedCatalog().some((x) => x.key === key); },
    add(item) {
      catalogLastError = '';
      if (!item || !item.key || item.available === false) { catalogLastError = 'unavailable'; return false; }
      const pack = window.CatalogPack?.byId?.(item.assetId || item.key);
      const resolvedType = item.type || pack?.type || 'Auto';
      const entry = {
        key: item.key,
        assetId: item.assetId || pack?.assetId || null,
        type: resolvedType,
        title: item.title || pack?.title || item.key,
        category: item.category || pack?.category || typeToCategory(resolvedType),
        ...((item.thumb || pack?.thumb) ? { thumb: item.thumb || pack.thumb } : {}),
      };
      const cur = readOwnedCatalog();
      if (cur.some((x) => x.key === entry.key)) return true;
      if (cur.length >= CATALOG_CAP) {
        catalogLastError = `Collection full (${CATALOG_CAP} items max). Remove an item first.`;
        return false;
      }
      if (!currentUser?.id) preAuthAddedItems.set(entry.key, entry);
      cur.push(entry);
      writeOwnedCatalog(cur);
      return true;
    },
    ownByAssetId(assetId, type = 'Auto') {
      const id = String(assetId || '').trim();
      if (!id) return false;
      const pack = window.CatalogPack?.byId?.(id);
      if (pack) return this.add(pack);
      return this.add({
        key: id.startsWith('cat:') ? id : ('asset:' + id),
        assetId: id,
        type,
        title: (type && type !== 'Auto' ? type : 'Asset') + ' #' + id,
        category: typeToCategory(type),
        available: true,
      });
    },
    remove(key) {
      if (!currentUser?.id) preAuthAddedItems.delete(key);
      const next = readOwnedCatalog().filter((x) => x.key !== key);
      writeOwnedCatalog(next);
    },
    registerItems(items) {
      if (!Array.isArray(items)) return;
      extraCatalogItems = items;
      paintCatalog();
    }
  });

  function setCatalogMessage(text, isError = false) {
    if (!catalogStatus) return;
    catalogStatus.hidden = !text;
    catalogStatus.textContent = text || '';
    catalogStatus.dataset.error = isError ? 'true' : 'false';
  }

  function paintCatalog() {
    if (!catalogGrid) return;
    const owned = readOwnedCatalog();
    const ownedKeys = new Set(owned.map((x) => x.key));
    const customOwned = owned.filter((o) => !DEFAULT_CATALOG_ITEMS.some((d) => d.key === o.key) && !extraCatalogItems.some((d) => d.key === o.key))
      .map((o) => ({ ...o, subtitle: o.subtitle || (o.assetId ? `Roblox ${o.type || 'Asset'} · #${o.assetId}` : 'Owned Item'), available: true }));
    const mergedMap = new Map();
    for (const item of [...extraCatalogItems, ...customOwned, ...DEFAULT_CATALOG_ITEMS]) {
      if (!mergedMap.has(item.key)) mergedMap.set(item.key, item);
    }
    const q = catalogSearchQuery.trim().toLowerCase();
    const items = [...mergedMap.values()].filter((it) => {
      if (activeCatalogCategory !== 'all' && it.category !== activeCatalogCategory) return false;
      if (!q) return true;
      const hay = `${it.title || ''} ${it.subtitle || ''} ${it.category || ''} ${it.type || ''} ${it.assetId || ''} ${it.key || ''}`.toLowerCase();
      return hay.includes(q);
    });
    if (!items.length) {
      catalogGrid.innerHTML = `<div style="grid-column:1/-1;padding:24px;border-radius:10px;border:1px dashed #2d2d35;color:#a1a1aa;text-align:center;font-size:13px">No catalog items match "${esc(catalogSearchQuery.trim())}" in this category.</div>`;
      return;
    }
    catalogGrid.innerHTML = items.map((it) => {
      const isOwned = ownedKeys.has(it.key);
      const resolvedThumb = it.thumb ? (window.CatalogPack?.assetUrl ? window.CatalogPack.assetUrl(it.thumb) : it.thumb) : null;
      const badge = resolvedThumb ? `<img src="${esc(resolvedThumb)}" alt="">` : `<span>${esc((it.category || 'ITEM').toUpperCase())}</span>`;
      const btnLabel = !it.available ? 'Unavailable' : (isOwned ? 'In Collection ✓ (Remove)' : 'Add to Collection');
      return `<article class="home-catalog-card" data-catalog-key="${esc(it.key)}">
        <div class="home-catalog-thumb">${badge}</div>
        <strong>${esc(it.title)}</strong>
        <small>${esc(it.subtitle || '')}</small>
        <button type="button" class="${isOwned ? 'is-owned' : ''}" data-catalog-toggle="${esc(it.key)}" ${!it.available ? 'disabled' : ''}>${esc(btnLabel)}</button>
      </article>`;
    }).join('');
    catalogGrid.querySelectorAll('[data-catalog-toggle]').forEach((btn) => btn.addEventListener('click', () => {
      const key = btn.dataset.catalogToggle;
      const item = mergedMap.get(key);
      if (!item || !item.available) return;
      if (window.CatalogCollection.has(key)) {
        window.CatalogCollection.remove(key);
        setCatalogMessage(`Removed "${item.title}" from your collection.` + (window.CatalogCollection.lastPersisted ? '' : ' (Session only — browser storage unavailable)'), false);
      } else {
        const added = window.CatalogCollection.add(item);
        setCatalogMessage(
          added
            ? `Added "${item.title}" to your collection! Open the Avatar tab to wear it.` + (window.CatalogCollection.lastPersisted ? '' : ' (Saved for this session only — browser storage unavailable)')
            : (window.CatalogCollection.lastError || `Could not add "${item.title}".`),
          !added
        );
      }
      paintCatalog();
    }));
  }

  root.querySelector('#home-catalog-search')?.addEventListener('input', (e) => {
    catalogSearchQuery = e.target.value || '';
    paintCatalog();
  });
  root.querySelector('#home-catalog-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-cat]');
    if (!tab) return;
    activeCatalogCategory = tab.dataset.cat;
    root.querySelectorAll('#home-catalog-tabs button').forEach((b) => b.classList.toggle('on', b === tab));
    paintCatalog();
  });
  root.querySelector('#home-catalog-id-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = root.querySelector('#home-catalog-asset-input');
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    const raw = String(input.value || '').trim();
    const id = /^\d{1,16}$/.test(raw) ? raw : raw.match(/(?:rbxassetid:\/\/|[?&]id=|\/catalog\/|\/library\/|\/asset\/)(\d{1,16})/i)?.[1];
    if (!id) {
      setCatalogMessage('Enter a numeric Roblox Asset ID or catalog URL.', true);
      return;
    }
    if (submitBtn) submitBtn.disabled = true;
    setCatalogMessage(`Verifying Roblox asset #${id} & dependent mesh/texture delivery…`, false);
    try {
      const pack = window.CatalogPack?.byId?.(id);
      if (window.AvatarAssets?.validateCatalogAssetId) {
        const check = await window.AvatarAssets.validateCatalogAssetId(id);
        if (!check.ok) {
          setCatalogMessage(check.reason || `Asset #${id} is unavailable for public import.`, true);
          return;
        }
        const added = window.CatalogCollection.add({
          key: pack?.key || ('asset:' + id),
          assetId: id,
          type: pack?.type || check.type || 'Auto',
          title: pack?.title || check.title || ('Asset #' + id),
          subtitle: pack?.subtitle || check.subtitle || (`Roblox ${check.type || 'Asset'} · #${id}`),
          category: pack?.category || check.category || 'hats',
          ...(pack?.thumb ? { thumb: pack.thumb } : {}),
          available: true,
        });
        if (!added) {
          setCatalogMessage(window.CatalogCollection.lastError || `Could not add Asset #${id}.`, true);
          return;
        }
        input.value = '';
        setCatalogMessage(`Added "${pack?.title || check.title || ('Asset #' + id)}" (${check.category}) to your collection! Open the Avatar tab to equip it.` + (window.CatalogCollection.lastPersisted ? '' : ' (Saved for this session only — browser storage unavailable)'), false);
        paintCatalog();
        return;
      }
      const r = await fetch('/api/avatar-asset?id=' + encodeURIComponent(id));
      if (!r.ok) {
        const msg = (await r.text()).slice(0, 140) || `HTTP ${r.status}`;
        setCatalogMessage(`Asset #${id} unavailable for public import (${msg}).`, true);
        return;
      }
      const added = window.CatalogCollection.add({ key: 'asset:' + id, assetId: id, title: 'Asset #' + id, category: 'hats', available: true });
      if (!added) {
        setCatalogMessage(window.CatalogCollection.lastError || `Could not add Asset #${id}.`, true);
        return;
      }
      input.value = '';
      setCatalogMessage(`Added Asset #${id} to your collection! Open the Avatar tab to equip it.` + (window.CatalogCollection.lastPersisted ? '' : ' (Saved for this session only — browser storage unavailable)'), false);
      paintCatalog();
    } catch (err) {
      setCatalogMessage(err?.message || 'Could not check that asset right now.', true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
  function openAvatarStudioSafe(trigger = null) {
    if (window.AvatarStudio?.open) {
      window.AvatarStudio.open(trigger);
      return;
    }
    window.__pendingAvatarOpen = true;
    showView('avatar');
    const host = root.querySelector('#home-avatar-host');
    if (host && !host.querySelector('#home-avatar-loading')) {
      const msg = document.createElement('p');
      msg.id = 'home-avatar-loading';
      msg.style.cssText = 'margin:32px;color:#cbd5e1;font:600 14px system-ui,sans-serif';
      msg.textContent = 'Loading Avatar Editor…';
      host.appendChild(msg);
    }
  }
  root.querySelector('#home-catalog-open-avatar').addEventListener('click', (e) => {
    closeProfile();
    setNav(avatarNav);
    openAvatarStudioSafe(e.currentTarget);
  });

  homeNav.addEventListener('click', () => { window.__pendingAvatarOpen = false; closeProfile(); window.AvatarStudio?.close(); showView('home'); sortByActivity = false; paintGames(); setNav(homeNav); });
  chartsNav.addEventListener('click', () => { window.__pendingAvatarOpen = false; closeProfile(); window.AvatarStudio?.close(); showView('home'); sortByActivity = true; paintGames(); setNav(chartsNav); root.querySelector('#home-recommended-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  catalogNav.addEventListener('click', () => { window.__pendingAvatarOpen = false; closeProfile(); window.AvatarStudio?.close(); showView('catalog'); paintCatalog(); });
  avatarNav.addEventListener('click', () => { closeProfile(); setNav(avatarNav); openAvatarStudioSafe(avatarNav); });
  root.querySelector('#home-nav-chat').addEventListener('click', () => {
    if (root.querySelector('#home-notification-popover').hidden) toggleNotifications();
  });
  meNav.addEventListener('click', openProfile);
  meButton.addEventListener('click', openProfile);
  root.querySelector('.home-profile-shade').addEventListener('click', closeProfile);
  root.querySelector('.home-profile-close').addEventListener('click', closeProfile);
  root.querySelector('#home-edit-appearance').addEventListener('click', (e) => { closeProfile(); setNav(avatarNav); openAvatarStudioSafe(e.currentTarget); });
  root.querySelector('#home-open-catalog-from-me').addEventListener('click', () => { closeProfile(); showView('catalog'); paintCatalog(); });
  root.querySelector('#home-profile-open-studio').addEventListener('click', () => { closeProfile(); window.RobloxStudioEditor?.open?.(); });
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
      if (root.querySelector('#home-notification-popover').hidden) toggleNotifications();
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
    const isCatalog = view === 'catalog';
    root.classList.toggle('is-avatar', isAvatar);
    root.classList.toggle('is-catalog', isCatalog);
    root.querySelector('.home-main').hidden = isAvatar || isCatalog;
    if (catalogHost) catalogHost.hidden = !isCatalog;
    setNav(isAvatar ? avatarNav : (isCatalog ? catalogNav : homeNav));
  }
  const autoPlay = new URLSearchParams(location.search).get('play') === '1';
  root.hidden = autoPlay;
  window.__homeOpen = !autoPlay;
  paintGames();
  paintCatalog();
  loadFriends();
  if ((window.__multiplayer?.connected || window.__multiplayer?.lobbyConnected) && !counts) window.__multiplayer.requestCounts?.();
  window.HomeScreen = Object.freeze({
    show() { root.hidden = false; window.__homeOpen = true; document.documentElement?.classList?.remove('is-home-boot'); },
    hide() { root.hidden = true; window.__homeOpen = false; document.documentElement?.classList?.remove('is-home-boot'); },
    showAvatar() { showView('avatar'); },
    showCatalog() { closeProfile(); window.AvatarStudio?.close?.(); showView('catalog'); paintCatalog(); },
    showMe() { openProfile(); },
    showHome() { showView('home'); },
  });
})();
