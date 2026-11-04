/* Client-side Avatar Editor: equips Owned Catalog items, body colors, and Roblox Username Preview-Before-Save. */
(() => {
  'use strict';

  const PARTS = [
    ['Head', 'Head'], ['Torso', 'Torso'], ['Left Arm', 'Left Arm'],
    ['Right Arm', 'Right Arm'], ['Left Leg', 'Left Leg'], ['Right Leg', 'Right Leg'],
  ];
  const DEFAULT = {
    Head: '#f5cd30', Torso: '#0d69ac', 'Left Arm': '#f5cd30',
    'Right Arm': '#f5cd30', 'Left Leg': '#a4bd47', 'Right Leg': '#a4bd47',
  };
  const SOLID_SWATCHES = [
    ['#f5cd30', 'Bright Yellow'], ['#fde0a6', 'Light Peach'], ['#eab892', 'Light Nougat'],
    ['#cc8e69', 'Nougat'], ['#8d5524', 'Warm Brown'], ['#4a2c17', 'Dark Brown'],
    ['#f8f8f8', 'Institutional White'], ['#a3a2a5', 'Medium Stone Grey'], ['#1b2a35', 'Really Black'],
    ['#c4281c', 'Bright Red'], ['#da8541', 'Bright Orange'], ['#4b974b', 'Bright Green'],
    ['#a4bd47', 'Yellowish Green'], ['#04afec', 'Cyan'], ['#0d69ac', 'Bright Blue'],
    ['#6b327c', 'Bright Violet'], ['#ff66cc', 'Hot Pink'], ['#00e599', 'Neon Mint'],
  ];
  const BODY_PRESETS = {
    noob: { label: 'Noob', colors: { ...DEFAULT } },
    guest: { label: 'Guest', colors: { Head: '#f8f8f8', Torso: '#1b2a35', 'Left Arm': '#f8f8f8', 'Right Arm': '#f8f8f8', 'Left Leg': '#1b2a35', 'Right Leg': '#1b2a35' } },
    builder: { label: 'Builder', colors: { Head: '#a3a2a5', Torso: '#da8541', 'Left Arm': '#a3a2a5', 'Right Arm': '#a3a2a5', 'Left Leg': '#1b2a35', 'Right Leg': '#1b2a35' } },
    zombie: { label: 'Zombie', colors: { Head: '#7f9a56', Torso: '#5a3825', 'Left Arm': '#7f9a56', 'Right Arm': '#7f9a56', 'Left Leg': '#5a3825', 'Right Leg': '#5a3825' } },
    bloxxer: { label: 'Bloxxer', colors: { Head: '#eab892', Torso: '#c4281c', 'Left Arm': '#eab892', 'Right Arm': '#eab892', 'Left Leg': '#1b2a35', 'Right Leg': '#1b2a35' } },
    frost: { label: 'Frost', colors: { Head: '#afddff', Torso: '#0d69ac', 'Left Arm': '#afddff', 'Right Arm': '#afddff', 'Left Leg': '#1e3a5f', 'Right Leg': '#1e3a5f' } },
  };
  const LABEL = {
    Auto: 'Auto-detect', Hat: 'Hat / Accessory', Face: 'Face',
    Shirt: 'Shirt', Pants: 'Pants', TShirt: 'T-Shirt',
  };
  const STORE_KEY = 'roblox-avatar-editor-v1', MAX = 8;
  const CACHE_KEY = 'roblox-avatar-cache-v2'; // #2358 user-scoped instant avatar cache (envelope in localStorage; zip bytes in CacheStorage)
  const HAT_TYPES = new Set([
    'Hat', 'HairAccessory', 'FaceAccessory', 'BackAccessory',
    'ShoulderAccessory', 'FrontAccessory', 'NeckAccessory', 'WaistAccessory',
  ]);
  const isValidAssetId = (id) => /^\d{1,16}$/.test(String(id || '')) || /^cat:[a-z0-9-]{2,40}$/.test(String(id || ''));

  const studioStyle = document.createElement('style');
  studioStyle.id = 'avatar-studio-tile-styles';
  studioStyle.textContent = `
.avatar-studio{position:relative;flex:1;min-height:0;display:flex;gap:28px;box-sizing:border-box;padding:18px 26px 22px;background:#1b1d1f;color:#f4f4f4;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
.avatar-studio[hidden]{display:none}
.as-left{flex:0 0 clamp(230px,23vw,330px);display:flex;flex-direction:column;gap:12px;min-height:0}
.as-title{margin:0;font:700 22px/1.2 system-ui,sans-serif;color:#fff}
.as-preview{position:relative;flex:1 1 auto;min-height:260px;border-radius:12px;overflow:hidden;background:radial-gradient(120% 90% at 50% 30%,#8a7a5f 0%,#5c5142 38%,#2e2a22 78%,#211e19 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.as-preview-glow{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 32%),radial-gradient(60% 40% at 70% 16%,rgba(255,240,210,.16),rgba(255,255,255,0) 70%)}
.avatar-studio canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.avatar-studio canvas.is-dragging{cursor:grabbing}
.avatar-studio-hint{position:absolute;left:12px;bottom:10px;padding:4px 9px;border-radius:999px;background:rgba(10,10,12,.55);color:#e8e8ea;font:600 11px/1 system-ui,sans-serif;pointer-events:none}
.as-left-foot{flex:0 0 auto;display:flex;flex-direction:column;gap:8px;font-size:12.5px;color:#bdbebe}
.as-link{border:0;background:none;padding:0;color:#fff;text-decoration:underline;cursor:pointer;font:inherit}
.as-advanced summary{cursor:pointer;color:#bdbebe;font-size:12.5px;list-style:none}
.as-advanced summary::before{content:"▸ ";color:#8f9094}
.as-advanced[open] summary::before{content:"▾ "}
.as-advanced-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.as-right{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:12px;min-height:0}
.as-promo-row{display:flex;align-items:center;justify-content:space-between;gap:8px 12px;flex:0 0 auto;flex-wrap:wrap}
.as-promo-row .as-promo{min-width:0;flex:1 1 200px}
.as-promo-actions{flex:0 0 auto;display:flex;gap:8px}
.as-promo{color:#bdbebe;font-size:14px}
.as-promo-actions{display:flex;gap:8px}
.as-btn{font:700 13px/1 system-ui,sans-serif;cursor:pointer;border-radius:8px;padding:9px 16px;border:0}
.as-btn.primary{background:#335fff;color:#fff}
.as-btn.primary:hover{filter:brightness(1.12)}
.as-btn.ghost{background:#2e3033;color:#f1f1f4}
.as-btn.ghost:hover{background:#3a3c3e}
.as-btn:focus-visible,.as-link:focus-visible,.as-tabs button:focus-visible,.as-subtabs button:focus-visible,.avatar-tile:focus-visible,.avatar-studio-add button:focus-visible,.avatar-studio-add input:focus-visible,.avatar-studio-add select:focus-visible,.avatar-color-swatch:focus-visible,.avatar-color-preset:focus-visible,.avatar-studio-colors input:focus-visible{outline:2px solid #56ccf2;outline-offset:2px}
.as-tabs{position:relative;display:flex;align-items:center;gap:2px;background:#232527;border-radius:10px;padding:4px 8px;overflow-x:auto;scrollbar-width:none;flex:0 0 auto}
.as-tabs::-webkit-scrollbar{display:none}
.as-tabs button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#bdbebe;font:600 13px/1 system-ui,sans-serif;padding:9px 12px;border-radius:8px;white-space:nowrap;cursor:pointer;box-shadow:inset 0 -2px 0 transparent}
.as-tabs button:hover{color:#fff;background:rgba(255,255,255,.05)}
.as-tabs button.on{color:#fff;box-shadow:inset 0 -2px 0 #fff}
.as-chev{font-size:9px;opacity:.7}
.as-tabs-overflow{flex:0 0 auto;width:26px;height:26px;margin-left:auto;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#2e3033;color:#fff;font-size:15px}
.as-subtabs{display:flex;gap:6px;flex-wrap:wrap;flex:0 0 auto}
.as-subtabs[hidden]{display:none}
.as-subtabs button{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#c8c9cc;font:600 12px/1 system-ui,sans-serif;padding:7px 12px;border-radius:999px;cursor:pointer}
.as-subtabs button.on{background:#335fff;border-color:#335fff;color:#fff}
.as-breadcrumb{flex:0 0 auto;font-size:13px;color:#8f9094;display:flex;gap:6px;align-items:center}
.as-breadcrumb .cur{color:#fff}
.as-breadcrumb i{font-style:normal;color:#6a6b6f}
.as-content{flex:1 1 0;min-height:0;position:relative}
.as-grid-scroll{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none;padding:2px 6px 20px 2px}
.as-grid-scroll[hidden]{display:none}
.as-grid-scroll::-webkit-scrollbar{display:none}
.avatar-tile-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(112px,44vw),1fr));gap:16px 14px}
.avatar-studio-empty{grid-column:1/-1;color:#8f9094;font-size:13px;padding:18px 4px}
.avatar-tile{display:flex;flex-direction:column;gap:6px;padding:0;border:0;background:transparent;color:#fff;cursor:pointer;text-align:left;font:inherit}
.avatar-tile-thumb{position:relative;width:100%;aspect-ratio:1/1;border-radius:10px;border:1px solid #3a3c3e;background:#26282b;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:border-color .12s,box-shadow .12s}
.avatar-tile-thumb img{max-width:100%;max-height:100%;object-fit:contain;pointer-events:none}
.avatar-tile:hover:not(:disabled) .avatar-tile-thumb{border-color:#6a6b6f}
.avatar-tile.is-equipped .avatar-tile-thumb{border:2px solid #335fff;box-shadow:0 0 0 2px rgba(51,95,255,.35)}
#avatar-clothing-card h3{margin:0 0 8px;font-size:13px}
.avatar-clothing-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow:auto}
.avatar-clothing-row{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)}
.avatar-clothing-row .cl-thumb{width:44px;height:44px;border-radius:6px;object-fit:contain;background:rgba(15,23,42,.7);flex:none}
.avatar-clothing-row .cl-meta{flex:1;min-width:0;display:flex;flex-direction:column;font-size:12px;line-height:1.35}
.avatar-clothing-row .cl-meta strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cl-ok{color:#4ade80;font-weight:600}
.cl-blocked{color:#f87171;font-weight:600}
.cl-add{flex:none;padding:5px 10px;font-size:12px}
.as-settings-field{display:flex;flex-direction:column;gap:6px;font-size:12px;margin-bottom:12px}
.as-settings-field select{padding:7px 9px;border-radius:7px;border:1px solid rgba(255,255,255,.18);background:#1c1c22;color:#f1f5f9}
.as-slider{display:grid;grid-template-columns:86px 1fr 52px;align-items:center;gap:8px;font-size:12px;margin:7px 0}
.as-slider input[type=range]{width:100%}
.as-slider output{text-align:right;font-variant-numeric:tabular-nums;opacity:.85}
.as-settings-note{font-size:12px;opacity:.75;margin-top:10px;line-height:1.4}
.avatar-tile:disabled{opacity:.55;cursor:wait}
.avatar-tile-check{position:absolute;left:6px;bottom:6px;width:20px;height:20px;border-radius:999px;background:#335fff;border:1.5px solid #9db4ff;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.6);pointer-events:none}
.avatar-tile-check svg{width:12px;height:12px;stroke:#fff;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}
.avatar-tile-title{font:500 12px/1.3 system-ui,sans-serif;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.as-panel{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none;padding:2px 6px 20px 2px}
.as-panel[hidden]{display:none}
.as-panel::-webkit-scrollbar{display:none}
.as-panel-card{max-width:620px;background:#232527;border:1px solid #303236;border-radius:12px;padding:14px 16px;margin-bottom:12px}
.as-panel-card h3{margin:0 0 10px;font:700 14px/1.2 system-ui,sans-serif;color:#fff}
.avatar-studio-add{display:flex;gap:8px}
.avatar-studio-add select,.avatar-studio-add input{min-width:0;padding:10px 12px;border:1px solid #3a3c3e;border-radius:8px;background:#1b1d1f;color:#f4f4f4;font:13px/1.2 system-ui,sans-serif}
.avatar-studio-add input{flex:1}
.avatar-studio-add input::placeholder{color:#7c7d81}
.avatar-studio-add button{padding:10px 16px;border:0;border-radius:8px;background:#335fff;color:#fff;font:700 13px/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.avatar-studio-add button:disabled{opacity:.5}
.avatar-studio-status{min-height:1.2em;margin:0;font:12px/1.35 system-ui,sans-serif;color:#9aa8ff;flex:0 0 auto}
.as-status{margin:-4px 0 0}
.avatar-studio-status[data-error="true"]{color:#ff8a8a}
.avatar-studio-list{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.avatar-studio-list .avatar-studio-empty{margin:0}
.avatar-studio-chip{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;border-radius:8px;background:#2a2c30;font:12px/1.3 system-ui,sans-serif;color:#e8e8ea}
.avatar-studio-chip button{width:24px;height:24px;border:0;border-radius:50%;background:#3a3c3e;color:#fff;font-size:14px;line-height:1;cursor:pointer;flex:0 0 auto}
#avatar-username-preview-bar{margin-top:10px;padding:10px 12px;border-radius:9px;background:rgba(51,95,255,.14);border:1px solid rgba(51,95,255,.45);display:flex;flex-direction:column;gap:8px}
#avatar-username-preview-bar[hidden]{display:none}
.avatar-studio-all-color label{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:9px;background:rgba(51,95,255,.13);border:1px solid rgba(51,95,255,.4);color:#fff;font-weight:600;font-size:13px;margin-bottom:10px}
.avatar-color-swatches{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:6px;margin-bottom:10px}
.avatar-color-swatch{height:26px;border-radius:6px;border:2px solid rgba(255,255,255,.22);padding:0;cursor:pointer;transition:transform .1s}
.avatar-color-swatch:hover{transform:scale(1.07)}
.avatar-color-swatch.is-active{border-color:#335fff;box-shadow:0 0 0 2px rgba(51,95,255,.5)}
.avatar-color-presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.avatar-color-preset{height:26px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:#2a2c30;color:#e2e8f0;font:600 12px/1 system-ui,sans-serif;cursor:pointer}
.avatar-color-preset:hover{border-color:#335fff}
.avatar-studio-colors{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.avatar-studio-colors label{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;border-radius:9px;background:#1b1d1f;color:#c8c9cc;font-size:12.5px}
.avatar-studio-colors input,.avatar-studio-all-color input{width:28px;height:28px;padding:0;border:0;background:none;cursor:pointer}
.avatar-studio-colors input::-webkit-color-swatch-wrapper,.avatar-studio-all-color input::-webkit-color-swatch-wrapper{padding:0}
.avatar-studio-colors input::-webkit-color-swatch,.avatar-studio-all-color input::-webkit-color-swatch{border:0;border-radius:6px}
.avatar-trey-modal{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,.72);backdrop-filter:blur(4px)}
.avatar-trey-modal[hidden]{display:none}
.avatar-trey-card{width:min(420px,92vw);padding:18px;border-radius:14px;background:#1b1d1f;border:1px solid rgba(51,95,255,.45);box-shadow:0 20px 50px rgba(0,0,0,.65);color:#f8fafc;font:13px/1.45 system-ui,sans-serif}
.avatar-trey-card h4{margin:0 0 6px;font:700 16px/1.25 system-ui,sans-serif;color:#fff}
.avatar-trey-card p{margin:0 0 12px;color:#c6c7cb;font-size:12.5px}
.avatar-trey-actions{display:flex;gap:8px;justify-content:flex-end}
.avatar-trey-actions button{padding:8px 13px;border-radius:8px;font:700 12.5px/1 system-ui,sans-serif;cursor:pointer;border:0}
@media (max-width:880px){
 .avatar-studio{flex-direction:column;overflow-y:auto;gap:14px;padding:12px}
 .as-promo-row{gap:6px 10px}
 .as-promo{font-size:12.5px}
 .as-btn{padding:8px 12px;font-size:12.5px}
 .as-left{flex:0 0 auto}
 .as-preview{flex:none;min-height:0;aspect-ratio:4/3}
 .as-content{min-height:340px}
 .as-grid-scroll,.as-panel{position:relative;inset:auto}
 .as-promo{font-size:13px}
}
`;
  document.head.append(studioStyle);

  const studio = document.createElement('section');
  studio.id = 'avatar-studio';
  studio.className = 'avatar-studio';
  studio.hidden = true;
  studio.setAttribute('role', 'dialog');
  studio.setAttribute('aria-modal', 'true');
  studio.setAttribute('aria-labelledby', 'avatar-studio-title');
  studio.innerHTML = `
  <aside class="as-left">
    <h1 class="as-title" id="avatar-studio-title">Avatar Editor</h1>
    <div class="as-preview">
      <canvas id="avatar-studio-canvas" width="520" height="520" aria-label="3D avatar preview"></canvas>
      <div class="as-preview-glow" aria-hidden="true"></div>
      <div class="avatar-studio-hint">Drag to rotate · Scroll to zoom</div>
    </div>
    <div class="as-left-foot">
      <div class="as-redraw-line">Avatar isn't loading correctly? <button type="button" class="as-link" data-redraw>Redraw</button></div>
      <details class="as-advanced">
        <summary>Advanced</summary>
        <div class="as-advanced-actions">
          <button type="button" class="as-btn ghost" data-reset>Reset Character</button>
          <button type="button" class="as-btn ghost" data-use-noob hidden>Use Default Noob</button>
        </div>
      </details>
    </div>
  </aside>
  <main class="as-right">
    <div class="as-promo-row">
      <span class="as-promo">Explore the marketplace to find more clothes!</span>
      <div class="as-promo-actions">
        <button type="button" class="as-btn ghost" data-done>Done</button>
        <button type="button" class="as-btn primary" data-open-catalog>Get More</button>
      </div>
    </div>
    <div class="as-tabs" id="avatar-tile-cats" role="tablist" aria-label="Avatar editor categories">
      <button type="button" role="tab" class="on" data-wcat="recent" aria-selected="true">Recent<span class="as-chev">▾</span></button>
      <button type="button" role="tab" data-wcat="avatars" aria-selected="false">Avatars<span class="as-chev">▾</span></button>
      <button type="button" role="tab" data-wcat="body" aria-selected="false">Body<span class="as-chev">▾</span></button>
      <button type="button" role="tab" data-wcat="makeup" aria-selected="false">Makeup<span class="as-chev">▾</span></button>
      <button type="button" role="tab" data-wcat="clothing" aria-selected="false">Clothing<span class="as-chev">▾</span></button>
      <button type="button" role="tab" data-wcat="accessories" aria-selected="false">Accessories<span class="as-chev">▾</span></button>
      <button type="button" role="tab" data-wcat="settings" aria-selected="false">Settings</button>
      <span class="as-tabs-overflow" aria-hidden="true">›</span>
    </div>
    <div class="as-subtabs" id="avatar-sub-cats" role="tablist" aria-label="Subcategory" hidden></div>
    <div class="as-breadcrumb" id="avatar-breadcrumb"><span>Recent</span><i>›</i><span class="cur">Recently Added</span></div>
    <div class="avatar-studio-status as-status" role="status" aria-live="polite"></div>
    <div class="as-content">
      <div class="as-grid-scroll" id="avatar-grid-scroll">
        <div class="avatar-tile-grid" id="avatar-owned-list" role="group" aria-label="Available items"></div>
      </div>
      <section class="as-panel" id="avatar-panel-avatars" aria-label="Avatars" hidden>
        <div class="as-panel-card">
          <h3>Roblox Username Import (Preview First)</h3>
          <form class="avatar-studio-add" id="avatar-username-form">
            <input id="avatar-username-input" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Roblox username (e.g. Builderman)">
            <button type="submit" id="avatar-username-btn">Preview</button>
          </form>
          <div id="avatar-username-preview-bar" hidden></div>
          <div id="avatar-clothing-card" class="as-panel-card" hidden></div>
        </div>
        <div class="as-panel-card">
          <h3>Quick Equip Public ID</h3>
          <form class="avatar-studio-add"><select aria-label="Asset type">${Object.entries(LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><input type="text" maxlength="44" autocomplete="off" placeholder="Asset ID (e.g. 1829157894)"><button type="submit">Equip</button></form>
          <div class="avatar-studio-list"></div>
        </div>
      </section>
      <section class="as-panel" id="avatar-panel-body" aria-label="Body colors" hidden>
        <div class="as-panel-card">
          <h3>Body Colors</h3>
          <div class="avatar-studio-all-color"><label><span>Entire Body (All Parts)</span><input type="color" id="avatar-color-all" data-all-parts value="${DEFAULT.Head}" aria-label="Entire body color"></label></div>
          <div class="avatar-color-swatches" role="group" aria-label="Whole-body preset colors">${SOLID_SWATCHES.map(([hex, name]) => `<button type="button" class="avatar-color-swatch" data-swatch="${hex}" style="background:${hex}" title="Set entire body: ${name} (${hex})" aria-label="Set entire body ${name}"></button>`).join('')}</div>
          <div class="avatar-color-presets" role="group" aria-label="Character color themes">${Object.entries(BODY_PRESETS).map(([k, p]) => `<button type="button" class="avatar-color-preset" data-body-preset="${k}" title="Apply ${p.label} body colors">${p.label}</button>`).join('')}</div>
          <div class="avatar-studio-colors">${PARTS.map(([n, l]) => `<label><span>${l}</span><input type="color" data-part="${n}" value="${DEFAULT[n]}"></label>`).join('')}</div>
        </div>
      </section>
      <section class="as-panel" id="avatar-panel-settings" aria-label="Settings" hidden>
        <div class="as-panel-card">
          <h3>Item Settings</h3>
          <label class="as-settings-field"><span>Equipped asset</span><select id="avatar-settings-item" aria-label="Select equipped asset"></select></label>
          <div id="avatar-settings-sliders"></div>
          <div class="as-settings-note" id="avatar-settings-note"></div>
        </div>
      </section>
    </div>
  </main>
  <div class="avatar-trey-modal" id="avatar-trey-catalog-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-trey-modal-title" hidden></div>`;
  document.body.append(studio);

  const canvas = studio.querySelector('#avatar-studio-canvas');
  const form = studio.querySelector('.avatar-studio-add:not(#avatar-username-form)');
  const typeEl = form.querySelector('select');
  const input = form.querySelector('input');
  const addBtn = form.querySelector('button');
  const statusEl = studio.querySelector('.avatar-studio-status');
  const listEl = studio.querySelector('.avatar-studio-list');
  const ownedListEl = studio.querySelector('#avatar-owned-list');
  const resetBtn = studio.querySelector('[data-reset]');
  const noobBtn = studio.querySelector('[data-use-noob]');
  const userForm = studio.querySelector('#avatar-username-form');
  const userInput = studio.querySelector('#avatar-username-input');
  const userBtn = studio.querySelector('#avatar-username-btn');
  const previewBar = studio.querySelector('#avatar-username-preview-bar');
  const clothingCardEl = studio.querySelector('#avatar-clothing-card');
  const treyCatalogModal = studio.querySelector('#avatar-trey-catalog-modal');

  let viewer = null, items = [], colors = { ...DEFAULT }, busy = false, opener = null;
  let wornIds = [], adjustments = {}; // #2379 worn asset ids (full-ZIP imports) · #2397 per-item slider adjustments
  let seq = 0, opEpoch = 0, baseCharacterKey = null, colorCustomized = false;
  let stagedPreview = null, previewAbort = null, pendingTreyHarvest = null;
  let websimUsername = '', knownAvatarUpdatedAt = undefined, activeSaveAbort = null, saveSeq = 0;
  const apiUrl = (p) => (window.CatalogPack?.apiUrl ? window.CatalogPack.apiUrl(p) : p);
  // #2332: single-flight metadata fetch; a late response must never clobber a newer
  // token, and a failed fetch is never cached (so saves can retry it). Callers that
  // need a precondition must await this and refuse to save when it did not succeed.
  let metaReq = null, metaSeq = 0;
  function syncKnownAvatarMeta() {
    if (metaReq) return metaReq;
    const my = ++metaSeq;
    metaReq = fetch(apiUrl('/api/avatar-last'), { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw Object.assign(new Error('meta HTTP ' + r.status), { status: r.status });
        const j = await r.json().catch(() => null);
        if (!j || typeof j !== 'object') throw new Error('meta bad json');
        if (my === metaSeq) knownAvatarUpdatedAt = j.avatar ? (Number(j.avatar.updatedAt) || 0) : null;
        return { ok: true, status: r.status };
      })
      .catch((err) => {
        if (my === metaSeq) metaReq = null; // allow retry next time; never cache failure
        return { ok: false, status: err?.status || 0 };
      });
    return metaReq;
  }
  syncKnownAvatarMeta();
  async function persistServerAvatar(saveName, zipBytes) {
    if (!/^[A-Za-z0-9_]{1,20}$/.test(saveName)) {
      say('Applied @' + saveName + '! (name not server-savable)');
      return;
    }
    if (activeSaveAbort) { try { activeSaveAbort.abort(); } catch {} }
    const saveAc = new AbortController();
    activeSaveAbort = saveAc;
    const mySave = ++saveSeq;
    const headers = zipBytes ? { 'Content-Type': 'application/zip' } : { 'Content-Type': 'application/json' };
    // #2332: never send a save without a CAS precondition — await single-flight metadata
    // and refuse the server write when it could not be confirmed.
    const meta = await syncKnownAvatarMeta();
    if (!meta.ok || knownAvatarUpdatedAt === undefined) {
      say(meta.status === 401
        ? `Applied @${saveName} locally — sign in to Websim to remember across sessions (no server write made).`
        : `Applied @${saveName} locally — could not confirm the saved-avatar state, so no server write was made. Your previously saved avatar is untouched.`, true);
      return;
    }
    headers['x-if-match-updated-at'] = knownAvatarUpdatedAt === null ? 'null' : String(knownAvatarUpdatedAt);
    try {
      const url = zipBytes
        ? apiUrl('/api/avatar-last?name=' + encodeURIComponent(saveName))
        : apiUrl('/api/avatar-last');
      const body = zipBytes ? zipBytes.slice(0) : JSON.stringify({ source: 'download', name: saveName });
      const r = await fetch(url, { method: 'POST', headers, body, signal: saveAc.signal });
      const j = await r.json().catch(() => ({}));
      if (mySave !== saveSeq) return;
      if (r.ok && j?.avatar) {
        knownAvatarUpdatedAt = Number(j.avatar.updatedAt) || Date.now();
        if (j.avatar.url) window.__avatarBlobUrl = j.avatar.url;
        if (zipBytes) await writeAvatarCache({ updatedAt: knownAvatarUpdatedAt, name: saveName, url: j.avatar.url || null }, zipBytes); // #2358
        say(zipBytes ? ('Applied & saved full 3D @' + saveName + ' avatar!') : ('Applied & saved @' + saveName + '!'));
        return;
      }
      if (r.status === 409 && j?.conflict) {
        knownAvatarUpdatedAt = j.avatar ? (Number(j.avatar.updatedAt) || 0) : null;
        const winner = j.avatar?.name ? ('@' + j.avatar.name) : 'another avatar';
        say(`Applied @${saveName} locally — another session saved ${winner} more recently (kept ${winner} saved; Apply again to overwrite).`, true);
        return;
      }
      if (r.status === 401) {
        say(`Applied @${saveName} locally — sign in to Websim to remember across sessions.`, true);
        return;
      }
      say(`Applied @${saveName} locally — server save failed; your previously saved avatar is untouched.`, true);
    } catch (err) {
      if (err?.name === 'AbortError' || mySave !== saveSeq) return;
      say(`Applied @${saveName} locally — server save failed; your previously saved avatar is untouched.`, true);
    } finally {
      if (activeSaveAbort === saveAc) activeSaveAbort = null;
    }
  }
  try {
    (window.websim?.getUser?.() || window.websim?.getCurrentUser?.())?.then((u) => {
      if (u?.username) websimUsername = String(u.username);
    }).catch(() => {});
  } catch {}
  const isTreyUser = () => Boolean(window.__canPublishSharedCatalog) || websimUsername.toLowerCase() === 'trey6383';

  // #2358 instant local avatar cache: small JSON envelope in localStorage + character ZIP in CacheStorage.
  // User-scoped by websim uid (fallback 'guest') so one account never reads another's cache.
  let uidPromise = null;
  function currentUid() {
    if (!uidPromise) {
      uidPromise = Promise.race([
        (window.websim?.getUser?.() || window.websim?.getCurrentUser?.() || Promise.resolve(null)).catch(() => null),
        new Promise((r) => setTimeout(() => r(null), 1500)),
      ]).then((u) => String(u?.id || u?.username || websimUsername || 'guest').toLowerCase()).catch(() => 'guest');
    }
    return uidPromise;
  }
  const CACHE_STORE = 'roblox-avatar-cache';
  const cacheUrl = (key) => 'https://avatar-cache.invalid/' + key;
  function cacheOpen() {
    if (typeof caches === 'undefined') return Promise.reject(new Error('no cache api'));
    return caches.open(CACHE_STORE);
  }
  async function cachePutZip(key, buf) {
    try {
      const c = await cacheOpen();
      await c.put(cacheUrl(key), new Response(buf, { headers: { 'Content-Type': 'application/zip' } }));
    } catch {}
  }
  async function cacheGetZip(key) {
    try {
      const c = await cacheOpen();
      const r = await c.match(cacheUrl(key));
      if (!r) return null;
      return await r.arrayBuffer();
    } catch { return null; }
  }
  async function cachePruneZips(uid, keepName) {
    try {
      const c = await cacheOpen();
      const prefix = 'https://avatar-cache.invalid/zip:' + uid + ':';
      const keys = await c.keys();
      for (const k of keys) {
        const u = k.url || '';
        if (u.startsWith(prefix) && u !== prefix + keepName) { try { await c.delete(k); } catch {} }
      }
    } catch {}
  }
  const MAX_CACHED_ZIP = 24 * 1024 * 1024;
  async function writeAvatarCache(env, zipBytes) {
    try {
      const uid = await currentUid();
      const payload = { v: 2, uid, savedAt: Date.now(), updatedAt: Number.isFinite(env.updatedAt) ? env.updatedAt : -1, name: env.name || null, url: env.url || null };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      if (zipBytes && zipBytes.byteLength > 0 && zipBytes.byteLength <= MAX_CACHED_ZIP && env.name) {
        await cachePutZip('zip:' + uid + ':' + String(env.name), zipBytes.slice(0));
        cachePruneZips(uid, String(env.name));
      }
    } catch {}
  }
  async function readAvatarCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || p.v !== 2 || typeof p !== 'object') return null;
      const uid = await currentUid();
      if (String(p.uid || '') !== uid) return null; // cross-account guard
      return p;
    } catch { return null; }
  }

  function closeTreyModal() {
    pendingTreyHarvest = null;
    if (treyCatalogModal) {
      treyCatalogModal.hidden = true;
      treyCatalogModal.innerHTML = '';
    }
  }

  const rgb = (hex) => {
    const n = parseInt(String(hex || '').slice(1), 16);
    return Number.isFinite(n) ? [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1] : [1, 1, 1, 1];
  };
  const hexOf = (arr) => (!Array.isArray(arr) || arr.length < 3 ? '#ffffff' : '#' + [0, 1, 2].map((i) => Math.max(0, Math.min(255, Math.round((Number(arr[i]) || 0) * 255))).toString(16).padStart(2, '0')).join(''));
  const floats = () => Object.fromEntries(PARTS.map(([n]) => [n, rgb(colors[n])]));
  const say = (msg, bad = false) => { statusEl.textContent = msg; statusEl.dataset.error = bad ? 'true' : 'false'; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function ensureViewer() {
    if (!viewer && window.AvatarViewer) viewer = window.AvatarViewer.create(canvas);
    return viewer;
  }
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        items,
        colors: colorCustomized ? colors : null,
        base: baseCharacterKey || null,
        worn: wornIds.slice(0, 64), // #2379
        adjust: adjustments, // #2397
      }));
    } catch {}
  }
  function clearSavedState() { try { localStorage.removeItem(STORE_KEY); } catch {} }

  function syncBaseFromGame() {
    const cur = window.__avatarAppearanceName || null;
    if (cur && !String(cur).startsWith('__custom__')) baseCharacterKey = cur;
    else if (!cur) baseCharacterKey = null;
    if (noobBtn) noobBtn.hidden = !(baseCharacterKey || window.__avatarBlobUrl);
    if (resetBtn) resetBtn.textContent = baseCharacterKey ? 'Reset to Character' : 'Reset to Noob';
  }
  function clearCustomBase(keepDb = false) {
    if (window.__avatarBlobUrl) { try { URL.revokeObjectURL(window.__avatarBlobUrl); } catch {} }
    window.__avatarBlobUrl = null;
    window.__avatarServerUrl = null;
    window.__avatarDisplayName = null;
    baseCharacterKey = null;
    // #2121: the saved avatar row is never deleted from the editor; if a future
    // feature needs row deletion it must be an explicit separately-reviewed change.
    if (noobBtn) noobBtn.hidden = true;
    if (resetBtn) resetBtn.textContent = 'Reset to Noob';
  }
  function syncColorsFromGame() {
    if (colorCustomized) return;
    const live = window.__avatarColors;
    if (live && typeof live === 'object') {
      for (const [n] of PARTS) if (live[n]) colors[n] = hexOf(live[n]);
    } else colors = { ...DEFAULT };
  }
  function syncPickers() {
    for (const el of studio.querySelectorAll('input[type="color"][data-part]')) {
      el.value = colors[el.dataset.part] || DEFAULT[el.dataset.part];
    }
    const allEl = studio.querySelector('#avatar-color-all');
    const firstHex = (colors[PARTS[0][0]] || DEFAULT.Head).toLowerCase();
    const uniform = PARTS.every(([n]) => (colors[n] || DEFAULT[n]).toLowerCase() === firstHex);
    if (allEl) allEl.value = firstHex;
    for (const sw of studio.querySelectorAll('.avatar-color-swatch[data-swatch]')) {
      sw.classList.toggle('is-active', uniform && sw.dataset.swatch.toLowerCase() === firstHex);
    }
  }
  function broadcastAppearance() {
    const active = window.__avatarAppearanceName || null;
    const mpName = active && String(active).startsWith('__custom__')
      ? (baseCharacterKey && !String(baseCharacterKey).startsWith('blob:') ? baseCharacterKey : null)
      : (active && !String(active).startsWith('blob:') ? active : null);
    const assetPayload = items.length ? items.map((x) => ({ id: x.id, type: x.type })) : null;
    if (!assetPayload && !colorCustomized && !mpName) {
      window.__multiplayer?.sendAvatar?.(null);
      return;
    }
    const colorsPayload = window.__avatarColors || floats();
    window.__multiplayer?.sendAvatar?.(colorsPayload, mpName, assetPayload, { noob: !mpName });
  }
  window.addEventListener('mp:roster', (e) => {
    if (e.detail?.connected && (items.length || colorCustomized)) broadcastAppearance();
  });

  function clearStagedPreview(restoreViewer = true) {
    if (previewAbort) { try { previewAbort.abort(); } catch {} previewAbort = null; }
    if (!stagedPreview) {
      previewBar.hidden = true;
      previewBar.innerHTML = '';
      if (clothingCardEl) { clothingCardEl.hidden = true; clothingCardEl.innerHTML = ''; }
      return;
    }
    stagedPreview = null;
    previewBar.hidden = true;
    previewBar.innerHTML = '';
    if (clothingCardEl) { clothingCardEl.hidden = true; clothingCardEl.innerHTML = ''; }
    if (restoreViewer && viewer) {
      viewer.setAppearance(window.__avatarAppearanceName || null);
      viewer.setColors(window.__avatarColors || floats());
      syncPickers();
    }
  }

  // ---- #2376/#2380/#2401 inline clothing-import card (NOT a popup) ----
  const CLOTHING_TYPES = new Set(['Shirt', 'Pants', 'TShirt']);
  const CLOTH_FACES = [
    { n: [0, 0, -1], name: 'front' }, { n: [0, 0, 1], name: 'back' },
    { n: [-1, 0, 0], name: 'right' }, { n: [1, 0, 0], name: 'left' },
    { n: [0, 1, 0], name: 'top' }, { n: [0, -1, 0], name: 'bottom' },
  ];
  const CLOTH_RECTS = {
    Torso: { front: [231, 74, 359, 202], back: [427, 74, 555, 202], right: [165, 74, 229, 202], left: [361, 74, 425, 202], top: [231, 8, 359, 72], bottom: [231, 204, 359, 268] },
    right: { front: [217, 355, 280, 483], back: [85, 355, 148, 483], right: [19, 355, 82, 483], left: [151, 355, 214, 483], top: [217, 289, 280, 352], bottom: [217, 485, 280, 549] },
    left: { front: [308, 355, 371, 483], back: [440, 355, 503, 483], right: [374, 355, 437, 483], left: [506, 355, 569, 483], top: [308, 289, 371, 352], bottom: [308, 485, 371, 549] },
  };
  let lastParsedBuf = null, lastParsedData = null;
  async function parseZipOnce(buf) {
    if (lastParsedData && lastParsedBuf === buf) return lastParsedData;
    const d = await window.AvatarCharacter.parse(buf);
    lastParsedBuf = buf; lastParsedData = d;
    return d;
  }
  function drawClothTri(ctx, img, s, d) {
    const sx0 = s[0], sy0 = s[1], sx1 = s[2], sy1 = s[3], sx2 = s[4], sy2 = s[5];
    const dx0 = d[0], dy0 = d[1], dx1 = d[2], dy1 = d[3], dx2 = d[4], dy2 = d[5];
    const den = (sx0 - sx2) * (sy1 - sy2) - (sx1 - sx2) * (sy0 - sy2);
    if (!den) return;
    const A = ((dx0 - dx2) * (sy1 - sy2) - (dx1 - dx2) * (sy0 - sy2)) / den;
    const B = ((sx0 - sx2) * (dx1 - dx2) - (sx1 - sx2) * (dx0 - dx2)) / den;
    const C = dx0 - A * sx0 - B * sy0;
    const D = ((dy0 - dy2) * (sy1 - sy2) - (dy1 - dy2) * (sy0 - sy2)) / den;
    const E = ((sx0 - sx2) * (dy1 - dy2) - (sx1 - sx2) * (dy0 - dy2)) / den;
    const F = dy0 - D * sx0 - E * sy0;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(dx0, dy0); ctx.lineTo(dx1, dy1); ctx.lineTo(dx2, dy2); ctx.closePath(); ctx.clip();
    ctx.setTransform(A, D, B, E, C, F);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  // Rasterize a body part's mesh triangles out of the character composite texture into
  // the 585x559 clothing template layout (the renderer's own rect table), so a shirt or
  // pants whose template Roblox restricts (HTTP 401/403) can still be imported from the
  // character's own 3D model. Returns a data-URL thumbnail, or null.
  async function extractClothingThumb(buf, type) {
    try {
      const data = await parseZipOnce(buf);
      const parts = data.parts || {};
      const pick = type === 'Pants'
        ? [['Left Leg', 'left'], ['Right Leg', 'right']]
        : [['Torso', 'Torso'], ['Left Arm', 'left'], ['Right Arm', 'right']];
      const texName = parts.Torso && parts.Torso[0] && parts.Torso[0].material && parts.Torso[0].material.texture;
      const bytes = texName && data.textures ? data.textures[texName] : null;
      if (!bytes) return null;
      const image = await new Promise((ok, bad) => {
        const blob = new Blob([bytes]), u = URL.createObjectURL(blob), i = new Image();
        i.onload = () => { URL.revokeObjectURL(u); ok(i); };
        i.onerror = () => { URL.revokeObjectURL(u); bad(new Error('decode')); };
        i.src = u;
      });
      const c = document.createElement('canvas');
      c.width = 585; c.height = 559;
      const ctx = c.getContext('2d');
      for (const [partName, rectKey] of pick) {
        const chunks = parts[partName] || [];
        const map = CLOTH_RECTS[rectKey];
        for (const ch of chunks) {
          const v = ch.vertices, u = ch.uvs, count = ch.count || (v.length / 6);
          const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
          for (let i = 0; i + 5 < v.length; i += 6) for (let k = 0; k < 3; k++) { const val = v[i + k]; if (val < mn[k]) mn[k] = val; if (val > mx[k]) mx[k] = val; }
          const ctr = [0, 1, 2].map((k) => (mn[k] + mx[k]) / 2);
          const sz = [0, 1, 2].map((k) => Math.max(1e-6, mx[k] - mn[k]));
          for (let t = 0; t + 2 < count; t += 3) {
            const idx = [t, t + 1, t + 2];
            let nx = 0, ny = 0, nz = 0;
            for (const j of idx) { nx += v[6 * j + 3]; ny += v[6 * j + 4]; nz += v[6 * j + 5]; }
            const an = [Math.abs(nx), Math.abs(ny), Math.abs(nz)];
            const ax = an[0] >= an[1] && an[0] >= an[2] ? 0 : (an[1] >= an[2] ? 1 : 2);
            const sign = ax === 0 ? Math.sign(nx) : (ax === 1 ? Math.sign(ny) : Math.sign(nz));
            const f = ax === 2 ? (sign < 0 ? 0 : 1) : (ax === 0 ? (sign < 0 ? 2 : 3) : (sign > 0 ? 4 : 5));
            const face = CLOTH_FACES[f], rect = map[face.name];
            if (!rect) continue;
            const x0 = rect[0], y0 = rect[1], x1 = rect[2], y1 = rect[3];
            const sPts = [], dPts = [];
            for (const j of idx) {
              const a = (v[6 * j] - ctr[0]) / sz[0], b = (v[6 * j + 1] - ctr[1]) / sz[1], cc = (v[6 * j + 2] - ctr[2]) / sz[2];
              let X, Y;
              if (f === 0) { X = x0 + (0.5 - a) * (x1 - x0); Y = y0 + (b + 0.5) * (y1 - y0); }
              else if (f === 1) { X = x0 + (a + 0.5) * (x1 - x0); Y = y0 + (b + 0.5) * (y1 - y0); }
              else if (f === 2) { X = x0 + (cc + 0.5) * (x1 - x0); Y = y0 + (b + 0.5) * (y1 - y0); }
              else if (f === 3) { X = x0 + (0.5 - cc) * (x1 - x0); Y = y0 + (b + 0.5) * (y1 - y0); }
              else if (f === 4) { X = x0 + (a + 0.5) * (x1 - x0); Y = y0 + (0.5 - cc) * (y1 - y0); }
              else { X = x0 + (a + 0.5) * (x1 - x0); Y = y0 + (cc + 0.5) * (y1 - y0); }
              sPts.push(u[2 * j] * image.width, u[2 * j + 1] * image.height);
              dPts.push(X, Y);
            }
            drawClothTri(ctx, image, sPts, dPts);
          }
        }
      }
      return c.toDataURL('image/png');
    } catch { return null; }
  }
  function renderClothingCard(list) {
    if (!clothingCardEl) return;
    const rows = Array.isArray(list) ? list : [];
    if (!rows.length) { clothingCardEl.hidden = true; clothingCardEl.innerHTML = ''; return; }
    clothingCardEl.hidden = false;
    clothingCardEl.innerHTML = `<h3>Imported Clothing</h3>
      <div class="avatar-clothing-list">${rows.map((r, i) => {
        const inLib = Boolean(window.CatalogCollection?.has?.('asset:' + r.id));
        const status = r.status === 'imported'
          ? '<span class="cl-ok">Imported</span>'
          : r.status === 'extracted'
            ? '<span class="cl-ok">Imported from 3D model</span>'
            : '<span class="cl-blocked">Blocked</span>';
        const thumb = r.thumb ? `<img class="cl-thumb" src="${esc(r.thumb)}" alt="">` : '';
        const btn = r.status === 'blocked'
          ? ''
          : `<button type="button" class="as-btn ghost cl-add" data-cl-add="${i}" ${inLib ? 'disabled' : ''}>${inLib ? 'In Collection ✓' : 'Add to Catalog'}</button>`;
        return `<div class="avatar-clothing-row">${thumb}
          <div class="cl-meta"><strong>${esc(r.label || ('#' + r.id))}</strong>
          <small>${esc(LABEL[r.type] || r.type)} · #${esc(r.id)}</small>
          <small class="cl-status">${status}${r.status === 'blocked' ? ' — ' + esc(r.reason || 'unavailable') : ''}</small></div>
          ${btn}</div>`;
      }).join('')}</div>`;
  }
  clothingCardEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cl-add]');
    if (!btn || !stagedPreview || !Array.isArray(stagedPreview.clothingReport)) return;
    const row = stagedPreview.clothingReport[Number(btn.dataset.clAdd)];
    if (!row || !/^\d{1,16}$/.test(String(row.id))) return;
    const ok = window.CatalogCollection?.ownByAssetId?.(row.id, row.type || 'Auto');
    say(ok ? ('Added ' + (row.label || ('#' + row.id)) + ' to your collection.') : 'Already in your collection.');
    renderClothingCard(stagedPreview.clothingReport);
  });
  // #2401: blocked shirt/pants whose template Roblox restricts can still be pulled out of
  // the imported character's own composite texture — upgrade the row when it lands.
  function kickClothingExtraction(charZip, report) {
    if (!charZip || !Array.isArray(report)) return;
    for (const row of report) {
      if (row.status !== 'blocked' || (row.type !== 'Shirt' && row.type !== 'Pants')) continue;
      extractClothingThumb(charZip, row.type).then((thumb) => {
        if (!thumb) return;
        if (!stagedPreview || stagedPreview.clothingReport !== report) return;
        row.status = 'extracted';
        row.thumb = thumb;
        renderClothingCard(report);
      }).catch(() => {});
    }
  }
  // #2379/#2383/#2386: on Apply only — DB/catalog-matched imported assets join the library
  // and every worn imported asset id is recorded so the wardrobe shows the blue outline + check.
  function markImportedWorn(cands, report) {
    const seen = new Set();
    for (const it of [...(cands || []), ...(report || [])]) {
      if (!it || !/^\d{1,16}$/.test(String(it.id || ''))) continue;
      const id = String(it.id);
      if (seen.has(id)) continue;
      seen.add(id);
      const inShared = Boolean(window.CatalogPack?.byId?.(id));
      const inLib = Boolean(window.CatalogCollection?.has?.('asset:' + id));
      if (inShared || inLib) window.CatalogCollection?.ownByAssetId?.(id, it.type || 'Auto');
      if (!wornIds.includes(id)) wornIds.push(id);
      noteRecent(id);
    }
    saveState();
    drawOwnedWardrobe();
  }

  function applyColorChange() {
    clearStagedPreview(false);
    colorCustomized = true;
    const f = floats();
    window.__avatarColors = f;
    viewer?.setColors(f);
    saveState();
    broadcastAppearance();
  }

  function itemDisplayTitle(item) {
    if (item.label) return item.label;
    const pack = window.CatalogPack?.byId?.(item.id);
    if (pack?.title) return pack.title;
    const owned = window.CatalogCollection?.getOwned?.() || [];
    const found = owned.find((c) => String(c.assetId) === String(item.id) || c.key === item.id);
    return found?.title || ('#' + item.id);
  }

  let activeWardrobeCat = 'recent';
  let activeTab = 'recent', activeSub = null;
  const RECENT_KEY = 'roblox-avatar-recent-v1';
  const CATEGORY_GROUPS = {
    clothing: ['shirts', 'pants', 'tshirts'],
    accessories: ['hair', 'hats', 'shoulder', 'back'],
  };
  const SUB_TABS = {
    clothing: [['clothing', 'All'], ['shirts', 'Shirts'], ['pants', 'Pants'], ['tshirts', 'T-Shirts']],
    accessories: [['accessories', 'All'], ['hair', 'Hair'], ['hats', 'Hats'], ['shoulder', 'Shoulder'], ['back', 'Back']],
  };
  const TAB_LABEL = { recent: 'Recent', avatars: 'Avatars', body: 'Body', makeup: 'Makeup', clothing: 'Clothing', accessories: 'Accessories', settings: 'Settings' };
  const SUB_LABEL = { clothing: 'All Clothing', accessories: 'All Accessories', shirts: 'Shirts', pants: 'Pants', tshirts: 'T-Shirts', hair: 'Hair', hats: 'Hats', shoulder: 'Shoulder', back: 'Back', faces: 'Faces' };
  function noteRecent(id) {
    try {
      const aid = String(id || '');
      if (!aid) return;
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      const list = (Array.isArray(raw) ? raw : []).filter((x) => String(x) !== aid);
      list.unshift(aid);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 30)));
    } catch {}
  }
  function resolveItemById(aid) {
    const pack = window.CatalogPack?.byId?.(aid);
    if (pack) return { ...pack };
    const owned = window.CatalogCollection?.getOwned?.() || [];
    const o = owned.find((c) => String(c.assetId) === String(aid) || String(c.key) === String(aid));
    return o ? { ...o } : null;
  }
  function getAvailableWardrobeItems() {
    const owned = window.CatalogCollection?.getOwned?.() || [];
    const pack = window.CatalogPack?.items || [];
    const byKey = new Map();
    const seenAsset = new Set();
    for (const it of [...owned, ...pack]) {
      if (!it || it.available === false || !it.assetId) continue;
      const aid = String(it.assetId);
      if (seenAsset.has(aid)) continue;
      seenAsset.add(aid);
      const packMeta = window.CatalogPack?.byId?.(aid) || window.CatalogPack?.byId?.(it.key);
      byKey.set(it.key, {
        ...packMeta,
        ...it,
        thumb: it.thumb || packMeta?.thumb || null,
        type: it.type || packMeta?.type || 'Auto',
        category: it.category || packMeta?.category || 'hats',
      });
    }
    const all = [...byKey.values()];
    const ownedKeys = new Set(owned.map((o) => String(o.assetId || o.key)));
    const cat = activeWardrobeCat;
    if (cat === 'recent') {
      let recentIds = [];
      try {
        const r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        if (Array.isArray(r)) recentIds = r;
      } catch {}
      const seen = new Set();
      const items = [];
      for (const aid of recentIds) {
        const key = String(aid);
        if (seen.has(key)) continue;
        seen.add(key);
        const it = resolveItemById(key);
        if (it && it.available !== false && it.assetId) {
          items.push({
            ...it,
            thumb: it.thumb || null,
            type: it.type || 'Auto',
            category: it.category || 'hats',
          });
        }
      }
      if (items.length) return items;
      return all.filter((it) => ownedKeys.has(String(it.assetId)) || ownedKeys.has(it.key));
    }
    if (cat === 'all') return all;
    if (cat === 'owned') return all.filter((it) => ownedKeys.has(String(it.assetId)) || ownedKeys.has(it.key));
    if (CATEGORY_GROUPS[cat]) {
      const group = new Set(CATEGORY_GROUPS[cat]);
      return all.filter((it) => group.has(it.category));
    }
    return all.filter((it) => it.category === cat);
  }

  function drawOwnedWardrobe() {
    if (!ownedListEl) return;
    const list = getAvailableWardrobeItems();
    if (!list.length) {
      ownedListEl.innerHTML = `<div class="avatar-studio-empty">${activeWardrobeCat === 'recent' ? 'Nothing recent yet — equip something or use Get More to browse the Catalog.' : activeWardrobeCat === 'owned' ? 'No items in your collection yet. Use Get More to browse the Catalog.' : 'No items in this category yet — try Get More to find more.'}</div>`;
      return;
    }
    ownedListEl.innerHTML = list.map((it) => {
      const equipped = items.some((x) => String(x.id) === String(it.assetId)) || wornIds.includes(String(it.assetId)); // #2379
      const resolvedThumb = it.thumb ? (window.CatalogPack?.assetUrl ? window.CatalogPack.assetUrl(it.thumb) : it.thumb) : null;
      const thumbInner = resolvedThumb
        ? `<img src="${esc(resolvedThumb)}" alt="">`
        : `<span>${esc((LABEL[it.type] || it.type || 'ITEM').toUpperCase())}</span>`;
      const checkBadge = equipped
        ? `<span class="avatar-tile-check" aria-hidden="true"><svg viewBox="0 0 16 16"><polyline points="3.2 8.5 6.6 12 13 4.5"/></svg></span>`
        : '';
      return `<button type="button" class="avatar-tile${equipped ? ' is-equipped' : ''}" data-equip-owned="${esc(it.key)}" data-asset-id="${esc(it.assetId)}" aria-pressed="${equipped}" aria-label="${esc(it.title)}${equipped ? ' (Equipped — click to unequip)' : ' (Click to equip)'}" title="${esc(it.title)}" ${busy ? 'disabled' : ''}>
        <span class="avatar-tile-thumb">${thumbInner}${checkBadge}</span>
        <span class="avatar-tile-title">${esc(it.title)}</span>
      </button>`;
    }).join('');
  }

  function draw() {
    drawOwnedWardrobe();
    listEl.innerHTML = items.length
      ? items.map((it, i) => `<div class="avatar-studio-chip"><span><strong>${esc(LABEL[it.type] || it.type)}</strong> · ${esc(itemDisplayTitle(it))}</span><button type="button" data-rm="${i}" aria-label="Remove ${esc(itemDisplayTitle(it))}" ${busy ? 'disabled' : ''}>×</button></div>`).join('')
      : '<div class="avatar-studio-empty">No custom assets equipped. Pick items from Owned Wardrobe above or enter a public ID.</div>';
  }

  async function render(next, { opId = ++opEpoch, snapshot = null } = {}) {
    const snap = snapshot || {
      active: window.__avatarAppearanceName ?? null,
      blob: window.__avatarBlobUrl ?? null,
      base: baseCharacterKey ?? null,
    };
    const v = ensureViewer();
    const gameR = window.__avatarRenderer?.applyOverride ? window.__avatarRenderer : window.__avatarRenderer?.instance;
    const viewR = v?.renderer;
    if (!gameR && !viewR) throw Error('Avatar renderer is still starting; try again in a moment.');
    if (!next.length) {
      if (opId !== opEpoch) return [];
      items = [];
      const restored = baseCharacterKey || null;
      window.__avatarAppearanceName = restored;
      if (colorCustomized) window.__avatarColors = floats();
      v?.setAppearance(restored);
      v?.setColors(window.__avatarColors || floats());
      saveState();
      broadcastAppearance();
      draw();
      return [];
    }
    const key = '__custom__' + (++seq);
    let resolved = null;
    try {
      const tasks = [];
      if (gameR?.applyOverride) tasks.push(gameR.applyOverride(key, next, baseCharacterKey).then((r) => { resolved = resolved || r; }));
      if (viewR?.applyOverride && viewR !== gameR) tasks.push(viewR.applyOverride(key, next, baseCharacterKey).then((r) => { resolved = resolved || r; }));
      await Promise.all(tasks);
    } catch (err) {
      if (opId === opEpoch) {
        baseCharacterKey = snap.base;
        window.__avatarAppearanceName = snap.active;
        v?.setAppearance(snap.active);
      }
      throw err;
    }
    if (opId !== opEpoch) return resolved || [];
    const labelMap = new Map(next.map((n) => [String(n.id), n.label || null]));
    items = (resolved || next).map((r) => ({
      id: String(r.id),
      type: r.type,
      ...(labelMap.get(String(r.id)) ? { label: labelMap.get(String(r.id)) } : {}),
    }));
    window.__avatarAppearanceName = key;
    if (colorCustomized) window.__avatarColors = floats();
    v?.setAppearance(key);
    v?.setColors(window.__avatarColors || floats());
    saveState();
    broadcastAppearance();
    draw();
    return items;
  }

  async function runEquip(candidate, kind) {
    if (busy) return false;
    clearStagedPreview(true);
    const id = String(candidate.id || '').trim();
    if (!isValidAssetId(id)) { say('Enter a numeric Roblox asset ID or pick a Catalog item.', true); return false; }
    if (items.length >= MAX && (kind === 'Hat' || kind === 'Auto') && !items.some((x) => x.id === id)) {
      say('Up to ' + MAX + ' assets can be equipped at once.', true);
      return false;
    }
    const opId = ++opEpoch;
    const snapshot = {
      active: window.__avatarAppearanceName ?? null,
      blob: window.__avatarBlobUrl ?? null,
      base: baseCharacterKey ?? null,
    };
    busy = true; addBtn.disabled = true; say('Loading ' + (candidate.label || id) + '…'); draw();
    try {
      const filtered = items.filter((x) => x.id !== id && (kind === 'Hat' || kind === 'Auto' || x.type !== kind));
      await render([...filtered, { id, type: kind, label: candidate.label || null }], { opId, snapshot });
      if (opId === opEpoch) { input.value = ''; noteRecent(id); say('Equipped ' + (candidate.label || ('#' + id)) + '.'); }
      return true;
    } catch (err) {
      if (opId === opEpoch) say(err.message || 'Asset could not be equipped.', true);
      return false;
    } finally {
      if (opId === opEpoch) { busy = false; addBtn.disabled = false; draw(); }
    }
  }

  async function equipOwnedCatalogItem(catItem) {
    if (!catItem || !catItem.assetId) return false;
    return runEquip({ id: String(catItem.assetId), label: catItem.title || null }, catItem.type || 'Auto');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = input.value.trim(), kind = typeEl.value;
    if (!isValidAssetId(id)) { say('Enter a numeric Roblox asset ID (1–16 digits).', true); return; }
    const pack = window.CatalogPack?.byId?.(id);
    const ok = await runEquip({ id, label: pack?.title || null }, kind);
    if (ok && /^\d{1,16}$/.test(id)) {
      const equippedItem = items.find((x) => x.id === id);
      window.CatalogCollection?.ownByAssetId?.(id, equippedItem?.type || kind);
      drawOwnedWardrobe();
    }
  });

  // Roblox Username Preview-Before-Save
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const username = userInput.value.trim();
    if (!/^[A-Za-z0-9_]{1,20}$/.test(username)) {
      say('Enter a valid Roblox username (letters, numbers, underscores).', true);
      return;
    }
    if (previewAbort) { try { previewAbort.abort(); } catch {} }
    const ac = new AbortController();
    previewAbort = ac;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ac.abort(); }, 24000);
    userBtn.disabled = true;
    say('Fetching @' + username + ' for 3D preview…');
    try {
      const abortGuard = new Promise((resolve) => {
        if (ac.signal.aborted) { resolve([null, null]); return; }
        ac.signal.addEventListener('abort', () => resolve([null, null]), { once: true });
      });
      const fetchMeta = async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
          const r = await fetch(apiUrl('/api/avatar?username=' + encodeURIComponent(username)), { signal: ac.signal });
          const j = await r.json().catch(() => ({}));
          if (r.ok) return { ok: true, data: j, status: 200 };
          if (r.status === 404 || r.status === 400 || attempt === 1) return { ok: false, data: j, status: r.status };
          await new Promise((res) => setTimeout(res, 400));
        }
        return { ok: false, data: {}, status: 502 };
      };
      const fetchFullZip = async () => {
        if (!window.AvatarCharacter?.fetchZip) return null;
        try { return await window.AvatarCharacter.fetchZip(username); }
        catch {
          if (ac.signal.aborted) return null;
          try { return await window.AvatarCharacter.fetchZip(username, true); }
          catch { return null; }
        }
      };

      const [metaRes, charZip] = await Promise.race([Promise.all([fetchMeta(), fetchFullZip()]), abortGuard]);
      if (ac.signal.aborted) {
        if (timedOut) say('Preview timed out while fetching @' + username + '. Please try again.', true);
        return;
      }
      if (!metaRes?.ok && !charZip) {
        throw Error(metaRes?.data?.error || ('Lookup failed (HTTP ' + (metaRes?.status || 502) + ')'));
      }
      const data = metaRes.ok ? metaRes.data : { name: username, displayName: username, assets: [] };
      const v = ensureViewer();
      const viewR = v?.renderer;
      if (!viewR) throw Error('3D preview is unavailable on this device.');

      const pal = data.palette || {};
      const bc = data.bodyColors || {};
      const pickHex = (cid, fallback) => {
        const h = pal[cid];
        return typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : fallback;
      };
      const previewColors = {
        Head: pickHex(bc.headColorId, DEFAULT.Head),
        Torso: pickHex(bc.torsoColorId, DEFAULT.Torso),
        'Left Arm': pickHex(bc.leftArmColorId, DEFAULT['Left Arm']),
        'Right Arm': pickHex(bc.rightArmColorId, DEFAULT['Right Arm']),
        'Left Leg': pickHex(bc.leftLegColorId, DEFAULT['Left Leg']),
        'Right Leg': pickHex(bc.rightLegColorId, DEFAULT['Right Leg']),
      };

      const rawAssets = Array.isArray(data.assets) ? data.assets : [];
      const harvestCandidates = [];
      for (const a of rawAssets) {
        const t = a.assetType || a.type || '';
        const aid = String(a.id || '').trim();
        if (!/^\d{1,16}$/.test(aid)) continue;
        if (t === 'Shirt') harvestCandidates.push({ id: aid, type: 'Shirt', rawAssetType: t, label: a.name || ('Shirt #' + aid) });
        else if (t === 'Pants') harvestCandidates.push({ id: aid, type: 'Pants', rawAssetType: t, label: a.name || ('Pants #' + aid) });
        else if (t === 'TShirt' || t === 'T-Shirt' || t === 'ShirtGraphic') harvestCandidates.push({ id: aid, type: 'TShirt', rawAssetType: t, label: a.name || ('T-Shirt #' + aid) });
        else if (t === 'Face' || t === 'Decal') harvestCandidates.push({ id: aid, type: 'Face', rawAssetType: t, label: a.name || ('Face #' + aid) });
        else if (HAT_TYPES.has(t)) harvestCandidates.push({ id: aid, type: 'Hat', rawAssetType: t, label: a.name || ('Accessory #' + aid) });
        if (harvestCandidates.length >= 20) break;
      }

      const harvestWearable = [];
      const clothingReport = []; // #2376/#2401: every shirt/pants/T-shirt gets an explicit row
      let skippedRestricted = 0;
      await Promise.all(harvestCandidates.map(async (cand) => {
        try {
          await viewR.loadEquipAsset(cand.id, cand.type);
          harvestWearable.push(cand);
          if (CLOTHING_TYPES.has(cand.type)) clothingReport.push({ ...cand, status: 'imported', reason: '' });
        } catch (err) {
          skippedRestricted++;
          if (CLOTHING_TYPES.has(cand.type)) {
            clothingReport.push({ ...cand, status: 'blocked', reason: (err && err.message) ? err.message : 'Could not load this asset.' });
          }
        }
      }));
      if (ac.signal.aborted) return;

      const wearable = [];
      let hatSlots = 0;
      for (const cand of harvestWearable) {
        if (cand.type === 'Hat') {
          if (hatSlots >= 4) continue;
          hatSlots++;
        }
        wearable.push(cand);
        if (wearable.length >= MAX) break;
      }

      const previewKey = '__preview_user__' + (++seq);
      let usedFullZip = false;
      if (charZip && typeof viewR.loadCharacter === 'function') {
        try {
          const loadedChar = await viewR.loadCharacter(previewKey, charZip.slice(0));
          const whiteFloats = Object.fromEntries(PARTS.map(([n]) => [n, [1, 1, 1, 1]]));
          v.setAppearance(loadedChar?.name || previewKey);
          v.setColors(whiteFloats);
          usedFullZip = true;
        } catch { usedFullZip = false; }
      }
      if (!usedFullZip) {
        if (wearable.length) await viewR.applyOverride(previewKey, wearable, null);
        const previewFloats = Object.fromEntries(PARTS.map(([n]) => [n, rgb(previewColors[n])]));
        v.setAppearance(wearable.length ? previewKey : null);
        v.setColors(previewFloats);
      }
      for (const el of studio.querySelectorAll('input[type="color"][data-part]')) {
        el.value = previewColors[el.dataset.part] || DEFAULT[el.dataset.part];
      }

      stagedPreview = {
        username: data.name || username,
        displayName: data.displayName || data.name || username,
        thumbnail: data.thumbnail || null,
        colors: previewColors,
        items: wearable,
        harvestItems: harvestWearable,
        charZip: usedFullZip ? charZip : null,
        skippedRestricted,
        clothingReport,
      };
      const detailSummary = usedFullZip
        ? `Full 3D Roblox character staged${harvestWearable.length ? ` (${harvestWearable.length} individual catalog asset${harvestWearable.length === 1 ? '' : 's'} also verified)` : ''}. Not saved yet.`
        : `${wearable.length} wearable asset${wearable.length === 1 ? '' : 's'} + body colors staged${skippedRestricted > 0 ? ` · ${skippedRestricted} restricted UGC/layered item${skippedRestricted === 1 ? '' : 's'} skipped` : ''}. Not saved yet.`;
      previewBar.hidden = false;
      previewBar.innerHTML = `<div style="display:flex;align-items:center;gap:10px">
        ${stagedPreview.thumbnail ? `<img src="${esc(stagedPreview.thumbnail)}" alt="" style="width:42px;height:42px;border-radius:8px;background:rgba(15,23,42,.8);object-fit:cover;flex:none">` : ''}
        <div style="min-width:0;flex:1;font-size:12px;line-height:1.35">
          <strong>Previewing @${esc(stagedPreview.username)}</strong>
          <div style="opacity:.82">${esc(detailSummary)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button type="button" data-preview-apply style="flex:1;padding:6px 10px;border-radius:6px;border:0;background:#2563eb;color:#fff;font-weight:600;cursor:pointer">Apply &amp; Save</button>
        <button type="button" data-preview-cancel style="padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;cursor:pointer">Cancel Preview</button>
      </div>`;
      say('Previewing @' + stagedPreview.username + ' — click Apply & Save to wear, or Cancel Preview.');
      renderClothingCard(clothingReport);
      kickClothingExtraction(charZip, clothingReport);

      const treyOwner = isTreyUser();
      const importedTreyName = ['trey6383', 'gigachadtrey'].includes(stagedPreview.username.toLowerCase());
      if ((treyOwner || importedTreyName) && harvestWearable.length > 0 && treyCatalogModal) {
        const alreadyCount = harvestWearable.filter((x) => Boolean(window.CatalogPack?.byId?.(x.id)) || Boolean(window.CatalogCollection?.has?.('asset:' + x.id))).length;
        const newCount = harvestWearable.length - alreadyCount;
        pendingTreyHarvest = { username: stagedPreview.username, assets: harvestWearable, sharedMode: treyOwner };
        treyCatalogModal.hidden = false;
        treyCatalogModal.innerHTML = `<div class="avatar-trey-card">
          <h4 id="avatar-trey-modal-title">Add @${esc(stagedPreview.username)}'s Assets to Catalog?</h4>
          <p>${treyOwner
            ? `Signed in as <strong>@Trey6383</strong>: found <strong>${harvestWearable.length}</strong> wearable asset${harvestWearable.length === 1 ? '' : 's'} on @${esc(stagedPreview.username)} (${newCount} new · ${alreadyCount} already in Catalog). Add all non-duplicate items to the shared Catalog for everyone?`
            : `Found <strong>${harvestWearable.length}</strong> wearable asset${harvestWearable.length === 1 ? '' : 's'} on <strong>@${esc(stagedPreview.username)}</strong> (${newCount} new · ${alreadyCount} already in your Catalog). Add all non-duplicate items to your Catalog collection?`}</p>
          <div class="avatar-trey-actions">
            <button type="button" data-trey-skip style="background:#334155;color:#f1f5f9">No, Skip</button>
            <button type="button" data-trey-confirm style="background:#2563eb;color:#fff">Add All to Catalog</button>
          </div>
        </div>`;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      say(err?.message || 'Could not preview Roblox username.', true);
    } finally {
      clearTimeout(timer);
      if (previewAbort === ac) previewAbort = null;
      userBtn.disabled = false;
    }
  });

  previewBar.addEventListener('click', async (e) => {
    const applyBtn = e.target.closest('[data-preview-apply]');
    const cancelBtn = e.target.closest('[data-preview-cancel]');
    if (cancelBtn) {
      clearStagedPreview(true);
      say('Preview discarded — kept your saved avatar.');
      return;
    }
    if (!applyBtn || !stagedPreview || busy) return;
    const chosen = stagedPreview;
    const opId = ++opEpoch;
    const snapshot = {
      active: window.__avatarAppearanceName ?? null,
      blob: window.__avatarBlobUrl ?? null,
      base: baseCharacterKey ?? null,
    };
    const prevColors = { ...colors }, prevCustomized = colorCustomized;
    busy = true; applyBtn.disabled = true; say('Applying @' + chosen.username + '…');
    try {
      clearStagedPreview(false);
      if (chosen.charZip) {
        const v = ensureViewer();
        const gameR = window.__avatarRenderer?.loadCharacter ? window.__avatarRenderer : window.__avatarRenderer?.instance;
        const viewR = v?.renderer;
        const lowerName = String(chosen.username || 'avatar').trim();
        let loadedName = lowerName;
        if (gameR?.loadCharacter) {
          const res = await gameR.loadCharacter(lowerName, chosen.charZip.slice(0));
          if (res?.name) loadedName = res.name;
        }
        if (viewR?.loadCharacter && viewR !== gameR) {
          await viewR.loadCharacter(loadedName, chosen.charZip.slice(0));
        }
        items = [];
        wornIds = []; // #2379 full-ZIP path carries worn state too
        baseCharacterKey = loadedName;
        colorCustomized = false;
        const whiteFloats = Object.fromEntries(PARTS.map(([n]) => [n, [1, 1, 1, 1]]));
        window.__avatarAppearanceName = loadedName;
        window.__avatarColors = whiteFloats;
        window.__avatarPreviouslyImported = true;
        if (noobBtn) noobBtn.hidden = false;
        if (resetBtn) resetBtn.textContent = 'Reset to Character';
        v?.setAppearance(loadedName);
        v?.setColors(whiteFloats);
        saveState();
        broadcastAppearance();
        await writeAvatarCache({ updatedAt: -1, name: loadedName, url: null }, chosen.charZip); // #2358 pending local cache; a successful save rewrites it with the server token
        markImportedWorn(chosen.harvestItems || chosen.items || [], chosen.clothingReport || []);
        const saveName = String(chosen.username || '').trim();
        await persistServerAvatar(saveName, chosen.charZip);
        return;
      }
      clearCustomBase(true); // #2121: never DELETE the saved avatar row
      colors = { ...chosen.colors };
      colorCustomized = true;
      window.__avatarColors = floats();
      syncPickers();
      await render(chosen.items, { opId, snapshot });
      wornIds = [];
      markImportedWorn(chosen.items, chosen.clothingReport || []);
      // #2121: honest non-destructive save - awaited CAS upsert via POST, never DELETE
      const saveName = String(chosen.username || '').trim();
      await persistServerAvatar(saveName, null);
    } catch (err) {
      colors = prevColors; colorCustomized = prevCustomized;
      window.__avatarColors = colorCustomized ? floats() : undefined;
      syncPickers();
      say(err?.message || 'Could not apply previewed avatar.', true);
    } finally {
      busy = false; draw();
    }
  });

  const tabBar = studio.querySelector('#avatar-tile-cats');
  const subBar = studio.querySelector('#avatar-sub-cats');
  const breadcrumbEl = studio.querySelector('#avatar-breadcrumb');
  const gridScroll = studio.querySelector('#avatar-grid-scroll');
  const panelAvatars = studio.querySelector('#avatar-panel-avatars');
  const panelBody = studio.querySelector('#avatar-panel-body');
  const panelSettings = studio.querySelector('#avatar-panel-settings');
  const settingsItemSel = studio.querySelector('#avatar-settings-item');
  const settingsSlidersEl = studio.querySelector('#avatar-settings-sliders');
  const settingsNoteEl = studio.querySelector('#avatar-settings-note');

  function setBreadcrumb(root, cur) {
    if (breadcrumbEl) breadcrumbEl.innerHTML = `<span>${esc(root)}</span><i>›</i><span class="cur">${esc(cur)}</span>`;
  }
  function selectSub(cat) {
    activeSub = cat;
    activeWardrobeCat = cat;
    if (subBar) {
      subBar.querySelectorAll('button[data-subcat]').forEach((b) => {
        const on = b.dataset.subcat === cat;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    setBreadcrumb(TAB_LABEL[activeTab] || activeTab, SUB_LABEL[cat] || cat);
    drawOwnedWardrobe();
  }
  function selectTab(tab) {
    activeTab = tab;
    if (SUB_TABS[tab]) {
      const sub = (activeSub && SUB_TABS[tab].some(([c]) => c === activeSub)) ? activeSub : SUB_TABS[tab][0][0];
      if (subBar) {
        subBar.hidden = false;
        subBar.innerHTML = SUB_TABS[tab].map(([c, l]) => `<button type="button" role="tab" data-subcat="${c}" aria-selected="${c === sub ? 'true' : 'false'}" class="${c === sub ? 'on' : ''}">${l}</button>`).join('');
      }
      selectSub(sub);
    } else {
      if (subBar) { subBar.hidden = true; subBar.innerHTML = ''; }
      activeSub = null;
      if (tab === 'makeup') { activeWardrobeCat = 'faces'; setBreadcrumb('Makeup', 'Faces'); }
      else if (tab === 'recent') { activeWardrobeCat = 'recent'; setBreadcrumb('Recent', 'Recently Added'); }
      else if (tab === 'avatars') { activeWardrobeCat = 'all'; setBreadcrumb('Avatars', 'Import / Saved'); }
      else if (tab === 'body') { activeWardrobeCat = 'body'; setBreadcrumb('Body', 'Colors'); }
      else if (tab === 'settings') { activeWardrobeCat = 'settings'; setBreadcrumb('Settings', 'Item Settings'); drawSettingsPanel(); }
      else activeWardrobeCat = tab;
      drawOwnedWardrobe();
    }
    if (tabBar) {
      tabBar.querySelectorAll('button[data-wcat]').forEach((b) => {
        const on = b.dataset.wcat === tab;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    const showGrid = tab !== 'avatars' && tab !== 'body' && tab !== 'settings';
    if (gridScroll) gridScroll.hidden = !showGrid;
    if (panelAvatars) panelAvatars.hidden = tab !== 'avatars';
    if (panelBody) panelBody.hidden = tab !== 'body';
    if (panelSettings) panelSettings.hidden = tab !== 'settings';
    if (tab === 'settings') drawSettingsPanel();
  }
  // ---- #2397/#2398/#2400 Settings tab (far right): pick an equipped asset BY NAME, sliders ----
  const SETTING_SLIDERS = [
    ['posX', 'Position X', -2, 2, 0.05], ['posY', 'Position Y', -2, 2, 0.05], ['posZ', 'Position Z', -2, 2, 0.05],
    ['scale', 'Scale', 0.5, 2, 0.05],
  ];
  function applyAdjustmentHook(id, adj) {
    // The renderer owns per-item ap/scale/offset; forward when it exposes a setter (#2392 candidate).
    try {
      const r = window.__avatarRenderer;
      const inst = r && r.instance && typeof r.instance.setEditorAdjustment === 'function' ? r.instance
        : (r && typeof r.setEditorAdjustment === 'function' ? r : null);
      if (inst) inst.setEditorAdjustment(String(id), adj);
    } catch {}
  }
  function drawSettingsPanel() {
    if (!settingsItemSel) return;
    const opts = [];
    if (baseCharacterKey) opts.push(`<option value="__base__">Base character — ${esc(baseCharacterKey)}</option>`);
    for (const it of items) opts.push(`<option value="${esc(it.id)}">${esc(LABEL[it.type] || it.type)} — ${esc(itemDisplayTitle(it))}</option>`);
    settingsItemSel.innerHTML = opts.length ? opts.join('') : '<option value="">No equipped assets</option>';
    drawSettingsSliders();
  }
  function currentSettingId() { return settingsItemSel && settingsItemSel.value ? settingsItemSel.value : ''; }
  function drawSettingsSliders() {
    if (!settingsSlidersEl || !settingsNoteEl) return;
    const id = currentSettingId();
    if (!id) {
      settingsSlidersEl.innerHTML = '';
      settingsNoteEl.textContent = 'Equip an asset (or import an avatar) to adjust it here.';
      return;
    }
    if (id === '__base__') {
      settingsSlidersEl.innerHTML = '';
      settingsNoteEl.textContent = 'The base character itself has no adjustable sliders — pick an equipped asset above.';
      return;
    }
    const it = items.find((x) => String(x.id) === id);
    const adj = adjustments[id] || { pos: [0, 0, 0], scale: 1 };
    const adjustable = it && (it.type === 'Hat' || it.type === 'Auto'); // renderer supports ap/scale/offset on accessories
    settingsSlidersEl.innerHTML = SETTING_SLIDERS.map(([key, label, min, max, step]) => {
      const val = key === 'scale' ? adj.scale : adj.pos[['posX', 'posY', 'posZ'].indexOf(key)];
      return `<label class="as-slider"><span>${label}</span><input type="range" data-adj="${key}" min="${min}" max="${max}" step="${step}" value="${val}" ${adjustable ? '' : 'disabled'} aria-label="${label}"><output>${Number(val).toFixed(2)}</output></label>`;
    }).join('');
    settingsNoteEl.textContent = adjustable
      ? 'Saved with your avatar. Live re-placement applies when the renderer exposes per-item offsets (#2392).'
      : `This ${esc(LABEL[it?.type] || it?.type || 'item')} has no adjustable position/scale parameters — sliders are disabled rather than faked.`;
  }
  settingsItemSel?.addEventListener('change', drawSettingsSliders);
  settingsSlidersEl?.addEventListener('input', (e) => {
    const input = e.target.closest('input[data-adj]');
    if (!input) return;
    const id = currentSettingId();
    if (!id || id === '__base__') return;
    const adj = adjustments[id] || { pos: [0, 0, 0], scale: 1 };
    const v = Number(input.value);
    if (input.dataset.adj === 'scale') adj.scale = v;
    else adj.pos[['posX', 'posY', 'posZ'].indexOf(input.dataset.adj)] = v;
    adjustments[id] = adj;
    const out = input.parentElement && input.parentElement.querySelector('output');
    if (out) out.textContent = v.toFixed(2);
    saveState();
    applyAdjustmentHook(id, { pos: [...adj.pos], scale: adj.scale });
  });
  tabBar?.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-wcat]');
    if (tab) selectTab(tab.dataset.wcat);
  });
  subBar?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-subcat]');
    if (b) selectSub(b.dataset.subcat);
  });


  ownedListEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-equip-owned]');
    if (!btn || busy) return;
    const key = btn.dataset.equipOwned;
    const aid = String(btn.dataset.assetId || '');
    const alreadyEquipped = items.some((x) => String(x.id) === aid);
    if (alreadyEquipped) {
      clearStagedPreview(true);
      const next = items.filter((x) => String(x.id) !== aid);
      const opId = ++opEpoch;
      const snapshot = {
        active: window.__avatarAppearanceName ?? null,
        blob: window.__avatarBlobUrl ?? null,
        base: baseCharacterKey ?? null,
      };
      busy = true; draw();
      try { await render(next, { opId, snapshot }); if (opId === opEpoch) say('Unequipped item.'); }
      catch (err) { if (opId === opEpoch) say(err.message || 'Could not update avatar.', true); }
      finally { if (opId === opEpoch) { busy = false; draw(); } }
      return;
    }
    const all = getAvailableWardrobeItems();
    const found = all.find((x) => x.key === key || String(x.assetId) === aid) || window.CatalogPack?.byId?.(aid) || window.CatalogPack?.byId?.(key);
    if (!found) return;
    const ok = await equipOwnedCatalogItem(found);
    if (ok) { noteRecent(aid); window.CatalogCollection?.add?.(found); }
  });

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-rm]');
    if (!btn || busy) return;
    clearStagedPreview(true);
    const idx = Number(btn.dataset.rm);
    const next = items.filter((_, i) => i !== idx);
    const opId = ++opEpoch;
    const snapshot = {
      active: window.__avatarAppearanceName ?? null,
      blob: window.__avatarBlobUrl ?? null,
      base: baseCharacterKey ?? null,
    };
    busy = true; draw();
    try { await render(next, { opId, snapshot }); if (opId === opEpoch) say('Removed asset.'); }
    catch (err) { if (opId === opEpoch) say(err.message || 'Could not update avatar.', true); }
    finally { if (opId === opEpoch) { busy = false; draw(); } }
  });

  function setEntireBodyColor(hex, label = '') {
    const clean = /^#[0-9a-f]{6}$/i.test(String(hex || '')) ? String(hex).toLowerCase() : DEFAULT.Head;
    for (const [n] of PARTS) colors[n] = clean;
    syncPickers();
    applyColorChange();
    if (label) say(`Applied ${label} to entire body.`);
  }

  studio.querySelector('#avatar-color-all')?.addEventListener('input', (e) => {
    setEntireBodyColor(e.target.value);
  });

  studio.querySelector('.avatar-color-swatches')?.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-swatch]');
    if (!sw) return;
    setEntireBodyColor(sw.dataset.swatch, sw.getAttribute('title')?.replace(/^Set entire body:\s*/i, '') || sw.dataset.swatch);
  });

  studio.querySelector('.avatar-color-presets')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-body-preset]');
    if (!btn) return;
    const preset = BODY_PRESETS[btn.dataset.bodyPreset];
    if (!preset) return;
    colors = { ...preset.colors };
    syncPickers();
    applyColorChange();
    say(`Applied ${preset.label} body colors.`);
  });

  studio.querySelector('.avatar-studio-colors').addEventListener('input', (e) => {
    const part = e.target.dataset.part;
    if (!part) return;
    colors[part] = e.target.value;
    syncPickers();
    applyColorChange();
  });

  studio.querySelector('[data-redraw]')?.addEventListener('click', () => {
    const v = ensureViewer();
    if (v) {
      v.setAppearance(window.__avatarAppearanceName || null);
      v.setColors(window.__avatarColors || floats());
      v.start();
      say('Preview redrawn.');
    } else say('3D preview is unavailable on this device.', true);
  });

  resetBtn.addEventListener('click', async () => {
    clearStagedPreview(true);
    const opId = ++opEpoch;
    items = [];
    wornIds = [];
    colors = { ...DEFAULT };
    colorCustomized = false;
    busy = false; addBtn.disabled = false;
    syncBaseFromGame();
    const restored = baseCharacterKey || null;
    window.__avatarAppearanceName = restored;
    window.__avatarColors = undefined;
    syncPickers();
    viewer?.setAppearance(restored);
    viewer?.setColors(floats());
    clearSavedState();
    broadcastAppearance();
    say(restored ? 'Reset to imported character.' : 'Reset to default Noob.');
    draw();
  });

  noobBtn?.addEventListener('click', () => {
    clearStagedPreview(true);
    const opId = ++opEpoch;
    items = [];
    wornIds = [];
    colors = { ...DEFAULT };
    colorCustomized = false;
    busy = false; addBtn.disabled = false;
    clearCustomBase(true); // #2121: Noob is session-only, saved avatar preserved
    window.__avatarAppearanceName = null;
    window.__avatarColors = undefined;
    syncPickers();
    viewer?.setAppearance(null);
    viewer?.setColors(floats());
    clearSavedState();
    broadcastAppearance();
    say('Switched to default Noob character.');
    draw();
  });

  treyCatalogModal?.addEventListener('click', async (e) => {
    if (e.target === treyCatalogModal || e.target.closest('[data-trey-skip]')) {
      closeTreyModal();
      return;
    }
    const confirmBtn = e.target.closest('[data-trey-confirm]');
    if (!confirmBtn || !pendingTreyHarvest) return;
    const batch = pendingTreyHarvest;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Adding…';
    try {
      if (!batch.sharedMode) {
        let addedLocal = 0, skippedLocal = 0;
        for (const a of batch.assets) {
          const key = 'asset:' + a.id;
          if (window.CatalogPack?.byId?.(a.id) || window.CatalogCollection?.has?.(key)) { skippedLocal++; continue; }
          const cat = a.rawAssetType === 'HairAccessory' ? 'hair'
            : a.rawAssetType === 'ShoulderAccessory' ? 'shoulder'
            : a.rawAssetType === 'BackAccessory' ? 'back'
            : a.type === 'Face' ? 'faces'
            : a.type === 'Shirt' ? 'shirts'
            : a.type === 'Pants' ? 'pants'
            : a.type === 'TShirt' ? 'tshirts' : 'hats';
          if (window.CatalogCollection?.add?.({ key, assetId: a.id, type: a.type, title: a.label, category: cat, available: true })) addedLocal++;
        }
        drawOwnedWardrobe();
        closeTreyModal();
        say(`Added ${addedLocal} new asset${addedLocal === 1 ? '' : 's'} from @${batch.username} to your Catalog${skippedLocal ? ` (${skippedLocal} duplicate${skippedLocal === 1 ? '' : 's'} skipped)` : ''}.`);
        return;
      }
      const knownIds = (window.CatalogPack?.items || []).map((x) => String(x.assetId || '')).filter((x) => /^\d{1,16}$/.test(x));
      const r = await fetch(apiUrl('/api/catalog-shared'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: batch.assets, knownIds }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw Error(j.error || ('Catalog add failed (HTTP ' + r.status + ')'));
      const addedList = Array.isArray(j.added) ? j.added : [];
      if (addedList.length) window.CatalogPack?.mergeShared?.(addedList);
      drawOwnedWardrobe();
      const dupCount = Array.isArray(j.skippedDupes) ? j.skippedDupes.length : 0;
      closeTreyModal();
      say(`Added ${addedList.length} new asset${addedList.length === 1 ? '' : 's'} from @${batch.username} to Shared Catalog${dupCount ? ` (${dupCount} duplicate${dupCount === 1 ? '' : 's'} skipped)` : ''}.`);
    } catch (err) {
      closeTreyModal();
      say(err?.message || 'Could not add assets to shared Catalog.', true);
    }
  });

  window.addEventListener('catalog:owned-changed', () => { if (!studio.hidden) drawOwnedWardrobe(); });
  window.addEventListener('catalog:shared-updated', () => { if (!studio.hidden) drawOwnedWardrobe(); });

  function open(trigger = null, opts = null) {
    window.__pendingAvatarOpen = false;
    document.getElementById('home-avatar-loading')?.remove();
    const host = document.getElementById('home-avatar-host');
    if (host && studio.parentNode !== host) host.append(studio);
    window.HomeScreen?.showAvatar?.();
    window.dispatchEvent(new Event('hud:control-suspend'));
    opener = trigger || document.activeElement;
    clearStagedPreview(false);
    syncKnownAvatarMeta();
    studio.hidden = false;
    syncBaseFromGame();
    syncColorsFromGame();
    syncPickers();
    const v = ensureViewer();
    if (v) {
      v.setAppearance(window.__avatarAppearanceName || null);
      v.setColors(window.__avatarColors || floats());
      v.start();
      say('');
    } else say('3D preview is unavailable on this device. You can still add assets.', true);
    selectTab(activeTab || 'recent');
    draw();
    if (opts && opts.equipItem) equipOwnedCatalogItem(opts.equipItem);
  }
  function close() {
    if (studio.hidden) return;
    closeTreyModal();
    clearStagedPreview(true);
    studio.hidden = true;
    viewer?.stop();
    say('');
    window.HomeScreen?.showHome();
    opener?.focus?.({ preventScroll: true });
  }
  studio.querySelector('[data-done]').addEventListener('click', close);
  studio.querySelector('[data-open-catalog]')?.addEventListener('click', () => {
    closeTreyModal();
    clearStagedPreview(true);
    studio.hidden = true;
    viewer?.stop();
    window.HomeScreen?.showCatalog?.();
  });
  window.addEventListener('keydown', (e) => {
    if (studio.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);

  // Re-apply persisted editor customizations after initial saved-character restore on reload.
  (window.JoiningScreen?.ready || Promise.resolve()).then(async () => {
    const priorColors = window.__avatarColors, priorAppearance = window.__avatarAppearanceName;
    // #2358: instant local cache first — base character ZIP from IndexedDB, no network wait
    let cacheBaseApplied = false;
    const cache = await readAvatarCache();
    if (cache && cache.name && !String(cache.name).startsWith('__custom__')) {
      // the renderer may still be booting when JoiningScreen.ready fires — wait for it
      // (up to ~30s) so the cached character ZIP actually applies instead of being skipped
      let gameR0 = null;
      for (let i = 0; i < 120 && !gameR0; i++) {
        const r = window.__avatarRenderer;
        gameR0 = r && typeof r.loadCharacter === 'function' ? r
          : (r && r.instance && typeof r.instance.loadCharacter === 'function' ? r.instance : null);
        if (!gameR0) await new Promise((r2) => setTimeout(r2, 250));
      }
      const zip = await cacheGetZip('zip:' + cache.uid + ':' + String(cache.name));
      if (zip && gameR0?.loadCharacter) {
        try {
          await gameR0.loadCharacter(cache.name, zip);
          window.__avatarAppearanceName = cache.name;
          window.__avatarBlobUrl = cache.url || null;
          window.__avatarServerUrl = cache.url || null;
          window.__avatarDisplayName = cache.name;
          cacheBaseApplied = true;
        } catch {}
      }
      if (!cacheBaseApplied && gameR0?.ensure) { try { gameR0.ensure(cache.name); } catch {} }
    }
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      if (Array.isArray(saved.worn)) wornIds = saved.worn.map(String).filter((x) => /^\d{1,16}$/.test(x)).slice(0, 64); // #2379
      if (saved.adjust && typeof saved.adjust === 'object') adjustments = saved.adjust; // #2397
      syncBaseFromGame();
      if (saved.base && baseCharacterKey && saved.base.toLowerCase() !== baseCharacterKey.toLowerCase()) return;
      if (!saved.base && baseCharacterKey) return;
      const clean = Array.isArray(saved.items)
        ? saved.items.filter((i) => i && isValidAssetId(i.id) && LABEL[i.type]).slice(0, MAX)
        : [];
      const hasColors = !!(saved.colors && typeof saved.colors === 'object');
      if (clean.length) {
        const opId = ++opEpoch;
        const snapshot = {
          active: window.__avatarAppearanceName ?? null,
          blob: window.__avatarBlobUrl ?? null,
          base: baseCharacterKey ?? null,
        };
        if (hasColors) { colors = { ...DEFAULT, ...saved.colors }; colorCustomized = true; window.__avatarColors = floats(); syncPickers(); }
        await render(clean, { opId, snapshot });
      } else if (hasColors) {
        colors = { ...DEFAULT, ...saved.colors }; colorCustomized = true; window.__avatarColors = floats(); syncPickers();
        broadcastAppearance();
      }
    } catch {
      colors = { ...DEFAULT };
      for (const [n] of PARTS) if (priorColors?.[n]) colors[n] = hexOf(priorColors[n]);
      colorCustomized = false;
      window.__avatarColors = priorColors;
      window.__avatarAppearanceName = priorAppearance;
      syncPickers();
    }
    // #2358 background revalidation: the server wins only when it is strictly newer;
    // a failed revalidation (offline / guest 401) never touches the cached avatar.
    (async () => {
      const myOp = opEpoch, mySave = saveSeq; // #2399: a newer local op/save must win over this async result
      try {
        const r = await fetch(apiUrl('/api/avatar-last'), { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json().catch(() => null);
        const av = j && j.avatar;
        if (!av || !av.url || !av.name || !/^\d{1,16}$|^[A-Za-z0-9_]{1,20}$/.test(String(av.name))) return;
        const serverUpdatedAt = Number(av.updatedAt) || 0;
        const cacheUpdatedAt = cache && typeof cache.updatedAt === 'number' ? cache.updatedAt : -1;
        if (cacheBaseApplied && serverUpdatedAt <= cacheUpdatedAt) return;
        const uidNow = await currentUid(); // #2399: identity guard — never apply another account's avatar
        if (cache && String(cache.uid || '') !== uidNow) return;
        const gameR = window.__avatarRenderer?.loadCharacter ? window.__avatarRenderer : window.__avatarRenderer?.instance;
        if (!gameR?.loadCharacter) return;
        const fr = await fetch(apiUrl('/api/avatar-last?file=1'), { cache: 'no-store' });
        if (!fr.ok) return;
        const buf = await fr.arrayBuffer();
        if (myOp !== opEpoch || mySave !== saveSeq) return; // local state moved on while fetching
        await gameR.loadCharacter(av.name, buf);
        if (myOp !== opEpoch || mySave !== saveSeq) return; // re-check after the async load
        window.__avatarAppearanceName = av.name;
        window.__avatarBlobUrl = av.url;
        window.__avatarServerUrl = av.url;
        window.__avatarDisplayName = av.name;
        await writeAvatarCache({ updatedAt: serverUpdatedAt, name: av.name, url: av.url }, buf);
        try {
          const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
          if (raw && typeof raw === 'object') { raw.base = av.name; localStorage.setItem(STORE_KEY, JSON.stringify(raw)); }
        } catch {}
      } catch {}
    })();
  });

  window.AvatarStudio = Object.freeze({ open, close, get active() { return !studio.hidden; } });
  document.getElementById('home-avatar-loading')?.remove();
  if (window.__pendingAvatarOpen) {
    window.__pendingAvatarOpen = false;
    open();
  }
})();
