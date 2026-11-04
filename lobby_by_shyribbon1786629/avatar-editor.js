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
  // per-item accessory offsets (#2131/#2230/#2312, qwen v2.2 mechanism): bounded head-local x/y/z on
  // equipped items, carried through applyOverride/broadcast/persistence with STABLE asset ids.
  const clampOff = (v) => { const f = window.AvatarAssets?.clampOff; if (typeof f === 'function') return f(v); const n = typeof v === 'number' ? v : NaN; return Number.isFinite(n) ? Math.max(-0.5, Math.min(0.5, Math.round(n * 1000) / 1000)) : 0; };
  const clampS = (v) => { const f = window.AvatarAssets?.clampS; if (typeof f === 'function') return f(v); const n = typeof v === 'number' ? v : NaN; return Number.isFinite(n) ? Math.max(0.5, Math.min(2, Math.round(n * 1000) / 1000)) : 1; };
  const fmtOff = (v) => { const n = Number(v) || 0; return (n > 0 ? '+' : '') + n.toFixed(2); };
  const offsetMemo = {}; // per-id offsets survive unequip/re-equip
  const CACHE_KEY = 'roblox-avatar-cache-v2';
  const LOCAL_ITEMS_KEY = 'roblox-avatar-local-items'; // #2379/#2471: persisted user-provided / derived template images (local only, never shared) // #2358 user-scoped instant avatar cache (envelope in localStorage; zip bytes in CacheStorage)
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
  // #3421: compact in-game switcher — small floating panel, game stays visible behind it
  const compactStyle = document.createElement('style');
  compactStyle.id = 'avatar-studio-compact-styles';
  compactStyle.textContent = `
.avatar-studio.compact{position:fixed;right:14px;top:56px;left:auto;bottom:auto;width:min(440px,94vw);max-height:84vh;height:auto;z-index:1300;display:flex;gap:0;padding:12px 14px;overflow-y:auto;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.08)}
.avatar-studio.compact .as-left{display:none}
.avatar-studio.compact .as-right{flex:1 1 0;min-width:0}
.avatar-studio.compact .as-content{min-height:180px;max-height:54vh}
.avatar-studio.compact .as-grid-scroll{position:relative;inset:auto;overflow:visible;padding:2px 2px 12px}
.avatar-studio.compact .as-panel{position:relative;inset:auto;overflow:visible;padding:2px 2px 12px}
.avatar-studio.compact .as-promo-row{flex-wrap:wrap;gap:6px}
.avatar-saved-list{display:flex;flex-direction:column;gap:6px}
.avatar-saved-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border:1px solid #33363a;border-radius:8px;background:#232527;font-size:12.5px}
.avatar-saved-row .as-saved-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.avatar-saved-row .as-saved-tag{font-size:10.5px;color:#9db4ff;flex:none}
`;
  document.head.append(compactStyle);
  const wornStyle = document.createElement('style');
  document.head.append(wornStyle);

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
        <button type="button" class="as-btn ghost" data-save-avatar title="Save the current base avatar + outfit config to your account (signed-in). Local-only images stay on this device.">Save</button>
        <button type="button" class="as-btn ghost" data-merge-config title="Fetch your account outfit config and merge it non-destructively (local choices always win; nothing local is removed).">Merge account outfit</button>
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
        <div class="as-panel-card" id="avatar-saved-card">
          <h3>Saved Avatars</h3>
          <div id="avatar-saved-list" class="avatar-saved-list"></div>
          <div class="as-settings-note" style="margin-top:6px">Quick in-game switch — the game stays open behind this panel. For the full editor, close this and open Avatar from the home page.</div>
        </div>
        <div class="as-panel-card">
          <h3>Roblox Username Import (Preview First)</h3>
          <form class="avatar-studio-add" id="avatar-username-form">
            <input id="avatar-username-input" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Roblox username (e.g. Builderman)">
            <button type="submit" id="avatar-username-btn">Preview</button>
          </form>
          <div id="avatar-username-preview-bar" hidden></div>
          <input type="file" id="avatar-clothing-upload" accept="image/png,image/jpeg,image/webp" hidden>
          <div id="avatar-clothing-card" class="as-panel-card" hidden></div>
          <div id="avatar-trey-inline-card" class="as-panel-card" hidden></div>
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
`;
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
  const treyCatalogModal = studio.querySelector('#avatar-trey-inline-card'); // #2741: inline card under avatar import, NOT a popup

  let viewer = null, items = [], colors = { ...DEFAULT }, busy = false, opener = null;
  let compactMode = false; // #3421: in-game compact switcher (game stays visible)
  const RECENT_USERS_KEY = 'roblox-avatar-recent-users-v1'; // #3421: recently applied usernames
  let wornIds = [], adjustments = {}; // #2379 worn asset ids (full-ZIP imports) · #2397 per-item slider adjustments
  let seq = 0, opEpoch = 0, baseCharacterKey = null, colorCustomized = false;
  let stagedPreview = null, previewAbort = null, pendingTreyHarvest = null;
  let websimUsername = '', knownAvatarUpdatedAt = undefined, activeSaveAbort = null, saveSeq = 0, knownConfigUpdatedAt = undefined, configMetaReq = null, configMetaSeq = 0, configConflict = false, configOverwriteConsent = false, configSaveSeq = 0, deferredItems = [];
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
  // #2943/#2940: per-user JSON outfit config on the server (items/colors/offsets/worn/base ref),
  // CAS-guarded exactly like /api/avatar-last. Local-only images (cat:local-* data URLs) are
  // stripped client-side AND rejected server-side — they never leave the device (#2408/#2471).
  function syncKnownAvatarConfigMeta() {
    if (configMetaReq) return configMetaReq;
    const my = ++configMetaSeq;
    configMetaReq = fetch(apiUrl('/api/avatar-config'), { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw Object.assign(new Error('config meta HTTP ' + r.status), { status: r.status });
        const j = await r.json().catch(() => null);
        if (!j || typeof j !== 'object') throw new Error('config meta bad json');
        if (my === configMetaSeq) knownConfigUpdatedAt = j.authenticated === false ? 'anon' : (j.config ? (Number(j.updatedAt) || 0) : null);
        return { ok: true, status: r.status, authenticated: j.authenticated !== false };
      })
      .catch((err) => {
        if (my === configMetaSeq) configMetaReq = null; // never cache failure — allow retry
        return { ok: false, status: err?.status || 0 };
      });
    return configMetaReq;
  }
  function stripLocalImages(v) {
    if (Array.isArray(v)) return v.map(stripLocalImages);
    if (v && typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v)) {
        if ((k === 'dataUrl' || k === 'dataURI' || k === 'imageData' || k === 'thumb') && typeof v[k] === 'string' && v[k].startsWith('data:')) continue;
        out[k] = stripLocalImages(v[k]);
      }
      return out;
    }
    return v;
  }
  function buildAvatarConfig() {
    return stripLocalImages({
      version: 1,
      savedAt: Date.now(),
      base: baseCharacterKey || null,
      appearance: String(window.__avatarAppearanceName || ''),
      items: items.concat(deferredItems).slice(0, 400), // #3021/#3072: unresolved restored refs are preserved, not dropped; cap raised so nothing is silently lost
      colors: colorCustomized ? colors : null,
      worn: wornIds.slice(0, 64),
      adjust: adjustments,
    });
  }
  // Returns true ONLY on a confirmed server write; 'conflict' on CAS 409; false otherwise.
  // #2753/#2756: no false success — a failed/unconfirmed write never claims account persistence.
  function hasLocalImageItems() {
    return items.concat(deferredItems).some((it) => it && String(it.id || '').startsWith('cat:local-'));
  }
  // #3021: after a CAS conflict, further saves are BLOCKED until explicit user overwrite consent
  // (or a fresh page load) — a second Save click arms consent and sends x-force-overwrite; the
  // dirty local state is never modified by this path. Single-flight via configSaveSeq.
  async function persistServerAvatarConfig(saveName, { force = false } = {}) {
    if (!/^[A-Za-z0-9_]{1,40}$/.test(saveName)) return false;
    if (configConflict && !force && !configOverwriteConsent) return 'conflict';
    // #3072: never silently drop records — if the payload would exceed the cap, fail visibly with NO post.
    if (items.length + deferredItems.length > 400) return 'too-large';
    const myCfg = ++configSaveSeq;
    const meta = await syncKnownAvatarConfigMeta();
    if (myCfg !== configSaveSeq) return false; // a newer save superseded this one
    if (!meta.ok || knownConfigUpdatedAt === undefined) return false; // no confirmed precondition -> no write
    if (knownConfigUpdatedAt === 'anon') return false; // signed out: local-only by policy
    const useCas = !(force || configOverwriteConsent);
    const ifMatch = knownConfigUpdatedAt === null ? null : knownConfigUpdatedAt;
    const headers = { 'Content-Type': 'application/json' };
    if (useCas) headers['x-if-match-updated-at'] = ifMatch === null ? 'null' : String(ifMatch);
    else headers['x-force-overwrite'] = '1'; // explicit user consent only
    try {
      const r = await fetch(apiUrl('/api/avatar-config'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: saveName, config: buildAvatarConfig(), ifMatchUpdatedAt: useCas ? ifMatch : undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j && j.ok === true && j.config) {
        knownConfigUpdatedAt = Number(j.config.updatedAt) || Date.now();
        configConflict = false; configOverwriteConsent = false;
        return true;
      }
      if (r.status === 409 && j && j.conflict) {
        configConflict = true; // lock: no further writes until consent/reload
        knownConfigUpdatedAt = j.config ? (Number(j.config.updatedAt) || 0) : null;
        return 'conflict';
      }
      if (r.status === 401) { knownConfigUpdatedAt = 'anon'; return false; }
      return false;
    } catch { return false; }
  }
  async function persistServerAvatar(saveName, zipBytes) {
    if (!/^[A-Za-z0-9_]{1,20}$/.test(saveName)) {
      say('Applied @' + saveName + '! (name not server-savable)');
      return false;
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
      return false;
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
        return true;
      }
      if (r.status === 409 && j?.conflict) {
        knownAvatarUpdatedAt = j.avatar ? (Number(j.avatar.updatedAt) || 0) : null;
        const winner = j.avatar?.name ? ('@' + j.avatar.name) : 'another avatar';
        say(`Applied @${saveName} locally — another session saved ${winner} more recently (kept ${winner} saved; Apply again to overwrite).`, true);
        return false;
      }
      if (r.status === 401) {
        say(`Applied @${saveName} locally — sign in to Websim to remember across sessions.`, true);
        return false;
      }
      say(`Applied @${saveName} locally — server save failed; your previously saved avatar is untouched.`, true);
      return false;
    } catch (err) {
      if (err?.name === 'AbortError' || mySave !== saveSeq) return false;
      say(`Applied @${saveName} locally — server save failed; your previously saved avatar is untouched.`, true);
      return false;
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
  function renderTreyInlineCard(batch, newCount, alreadyCount) {
    if (!treyCatalogModal) return;
    const treyOwner = isTreyUser();
    treyCatalogModal.hidden = false;
    treyCatalogModal.innerHTML = `<h3 id="avatar-trey-modal-title">Add @${esc(batch.username)}'s Assets to Catalog?</h3>
      <p>${treyOwner
        ? `Signed in as <strong>@Trey6383</strong>: found <strong>${batch.assets.length}</strong> wearable asset${batch.assets.length === 1 ? '' : 's'} on @${esc(batch.username)} (${newCount} new · ${alreadyCount} already in Catalog). Add all non-duplicate items to the shared Catalog for everyone?`
        : `Found <strong>${batch.assets.length}</strong> wearable asset${batch.assets.length === 1 ? '' : 's'} on @${esc(batch.username)} (${newCount} new · ${alreadyCount} already in your Catalog). Add all non-duplicate items to your Catalog?`}</p>
      <div class="avatar-clothing-list">${batch.assets.map((a) => `<div class="avatar-clothing-row"><div class="cl-meta"><strong>${esc(a.label || ('#' + a.id))}</strong><small>${esc(a.rawAssetType || a.type || '')} · #${esc(a.id)}</small></div></div>`).join('')}</div>
      <div class="avatar-trey-actions">
        <button type="button" data-trey-skip style="background:#334155;color:#f1f5f9">No, Skip</button>
        <button type="button" data-trey-confirm style="background:#2563eb;color:#fff">Add All to Catalog</button>
      </div>`;
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
        deferred: deferredItems.slice(0, 400), // #3021/#3072: restored-but-unresolvable refs, kept so saves never drop them
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
    const assetPayload = items.length ? items.map((x) => ({ id: x.id, type: x.type, ...(x.x ? { x: x.x } : {}), ...(x.y ? { y: x.y } : {}), ...(x.z ? { z: x.z } : {}), ...(x.s && x.s !== 1 ? { s: x.s } : {}) })) : null; // offsets ride along (server clamps)
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

  // #2131/#2230/#2312/#2505: immediate live preview — mutate the registered appearance state;
  // placements() recomputes every frame, so the 3D preview updates WHILE dragging. Non-polluting:
  // only renderers actually holding this key are touched; shared equipCache records are never mutated.
  function applyOffLive(id, axis, v) {
    const key = window.__avatarAppearanceName;
    if (!key) return;
    const rs = [];
    const g = window.__avatarRenderer?.applyOverride ? window.__avatarRenderer : window.__avatarRenderer?.instance;
    if (g && typeof g.ensure === 'function') rs.push(g);
    const vr = viewer?.renderer;
    if (vr && typeof vr.ensure === 'function' && !rs.includes(vr)) rs.push(vr);
    for (const r of rs) {
      try {
        if (typeof r.inspect === 'function' && !r.inspect(key)) continue;
        const st = r.ensure(key);
        for (const a of (st?.editorAccessories || [])) if (String(a.id) === String(id)) a[axis] = v;
      } catch {}
    }
  }

  function clearStagedPreview(restoreViewer = true) {
    if (previewAbort) { try { previewAbort.abort(); } catch {} previewAbort = null; }
    if (!stagedPreview) {
      previewBar.hidden = true;
      previewBar.innerHTML = '';
      if (clothingCardEl) { clothingCardEl.hidden = true; clothingCardEl.innerHTML = ''; }
      closeTreyModal();
      return;
    }
    stagedPreview = null;
    previewBar.hidden = true;
    previewBar.innerHTML = '';
    if (clothingCardEl) { clothingCardEl.hidden = true; clothingCardEl.innerHTML = ''; }
    closeTreyModal();
    if (restoreViewer && viewer) {
      viewer.setAppearance(window.__avatarAppearanceName || null);
      viewer.setColors(window.__avatarColors || floats());
      syncPickers();
    }
  }

  // ---- #2376/#2380/#2401 inline clothing-import card (NOT a popup) ----
  const CLOTHING_TYPES = new Set(['Shirt', 'Pants', 'TShirt']);
  // Local wearable items: a derived (best-effort) or user-uploaded template image persisted as a
  // data URL and exposed to the renderer as a `cat:local-<assetId>` pack item with a blob localUrl.
  // They are LOCAL ONLY — never published to the shared Catalog (#2416) — and clearly labeled.
  function readLocalItems() {
    try {
      const raw = localStorage.getItem(LOCAL_ITEMS_KEY);
      const j = raw ? JSON.parse(raw) : null;
      return j && typeof j === 'object' && !Array.isArray(j) ? j : {};
    } catch { return {}; }
  }
  function writeLocalItems(obj) {
    try {
      const text = JSON.stringify(obj);
      if (text.length > 3500000) { say('Local template store is full — remove an old derived item first.', true); return false; }
      localStorage.setItem(LOCAL_ITEMS_KEY, text);
      return true;
    } catch { say('Could not save the local template image (storage unavailable).', true); return false; }
  }
  async function dataUrlToBlobUrl(dataUrl) {
    try {
      const r = await fetch(dataUrl);
      const b = await r.blob();
      return URL.createObjectURL(b);
    } catch { return null; }
  }
  const localItemKey = (assetId) => 'cat:local-' + String(assetId).replace(/[^a-z0-9-]/gi, '').toLowerCase();
  function registerLocalPackItem(key, entry, blobUrl) {
    try {
      if (window.CatalogPack?.byId?.(key)) return true;
      const cat = entry.type === 'Shirt' ? 'shirts' : entry.type === 'Pants' ? 'pants' : entry.type === 'TShirt' ? 'tshirts' : entry.type === 'Face' ? 'faces' : 'hats';
      const added = window.CatalogPack?.mergeShared?.([{
        key, assetId: key, type: entry.type, category: cat,
        title: entry.title || key,
        subtitle: (entry.source === 'uploaded' ? 'User-provided template (local)' : 'Derived preview — NOT the original template (local)') + ' · #' + entry.assetId,
        thumb: entry.dataUrl, localUrl: blobUrl, available: true, local: true,
      }]);
      if (added) window.CatalogCollection?.add?.({ key, assetId: key, type: entry.type, title: entry.title || key, category: cat, thumb: entry.dataUrl });
      return Boolean(added);
    } catch { return false; }
  }
  async function hydrateLocalItems() {
    const items = readLocalItems();
    for (const [key, entry] of Object.entries(items)) {
      if (!entry || !entry.dataUrl || !/^cat:local-/.test(key)) continue;
      if (window.CatalogPack?.byId?.(key)) continue;
      const blobUrl = await dataUrlToBlobUrl(entry.dataUrl);
      if (blobUrl) registerLocalPackItem(key, entry, blobUrl);
    }
  }
  async function saveLocalClothingItem(row) {
    if (!row || !row.thumb || !/^\d{1,16}$/.test(String(row.id))) return false;
    const key = localItemKey(row.id);
    const items = readLocalItems();
    const entry = { assetId: String(row.id), type: row.type, title: (row.label || ('#' + row.id)) + ' (' + row.type + ')', source: row.status === 'uploaded' ? 'uploaded' : 'derived', dataUrl: row.thumb, savedAt: Date.now() };
    items[key] = entry;
    if (!writeLocalItems(items)) return false;
    const blobUrl = await dataUrlToBlobUrl(entry.dataUrl);
    if (!blobUrl) { say('Saved the image locally, but could not create a wearable object URL.', true); return false; }
    registerLocalPackItem(key, entry, blobUrl);
    return true;
  }
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
    const d = await window.AvatarCharacter.parse(buf.slice(0)); // slice: worker transfer detaches its argument
    lastParsedBuf = buf; lastParsedData = d;
    return d;
  }
  function drawClothTri(ctx, img, s, d, clipPts) {
    const sx0 = s[0], sy0 = s[1], sx1 = s[2], sy1 = s[3], sx2 = s[4], sy2 = s[5];
    const dx0 = d[0], dy0 = d[1], dx1 = d[2], dy1 = d[3], dx2 = d[4], dy2 = d[5];
    const cp = clipPts || d; // #4039: clip path may be expanded without distorting the affine
    const den = (sx0 - sx2) * (sy1 - sy2) - (sx1 - sx2) * (sy0 - sy2);
    if (!den) return false;
    const A = ((dx0 - dx2) * (sy1 - sy2) - (dx1 - dx2) * (sy0 - sy2)) / den;
    const B = ((sx0 - sx2) * (dx1 - dx2) - (sx1 - sx2) * (dx0 - dx2)) / den;
    const C = dx0 - A * sx0 - B * sy0;
    const D = ((dy0 - dy2) * (sy1 - sy2) - (dy1 - dy2) * (sy0 - sy2)) / den;
    const E = ((sx0 - sx2) * (dy1 - dy2) - (sx1 - sx2) * (dy0 - dy2)) / den;
    const F = dy0 - D * sx0 - E * sy0;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cp[0], cp[1]); ctx.lineTo(cp[2], cp[3]); ctx.lineTo(cp[4], cp[5]); ctx.closePath(); ctx.clip();
    ctx.setTransform(A, D, B, E, C, F);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    return true;
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
      // CharacterMesh encodes all chunks in one body-part bind space. R15
      // segments/material splits must share a single part-wide normalization,
      // and each chunk must sample its own material texture.
      const images = new Map();
      async function imageForChunk(ch) {
        const name = ch?.material?.texture, bytes = name && data.textures?.[name];
        if (!bytes) return null;
        if (!images.has(name)) images.set(name, new Promise((ok, bad) => {
          const blob = new Blob([bytes]), u = URL.createObjectURL(blob), i = new Image();
          i.onload = () => { URL.revokeObjectURL(u); ok(i); };
          i.onerror = () => { URL.revokeObjectURL(u); bad(new Error('decode')); };
          i.src = u;
        }));
        return images.get(name);
      }
      let trianglesDrawn = 0;
      const c = document.createElement('canvas');
      c.width = 585; c.height = 559;
      const ctx = c.getContext('2d');
      // #3577: normalize each FACE by that face's own tangent bounds (per part, across all
      // chunks) instead of the whole-chunk bounding box, so the projection reaches the rect
      // edges and no white seams remain at the template borders. Tangent axes per face class:
      // z-faces (front/back) -> (x,y); x-faces (right/left) -> (z,y); y-faces (top/bottom) -> (x,z).
      const tangentAxes = (f) => (f <= 1 ? [0, 1] : f <= 3 ? [2, 1] : [0, 2]);
      const flipU = (f) => f === 0 || f === 3; // matches renderer orientation (#2832 parity)
      for (const [partName, rectKey] of pick) {
        const chunks = parts[partName] || [];
        const map = CLOTH_RECTS[rectKey];
        if (!chunks.length) continue;
        const tris = [];
        for (const ch of chunks) {
          const v = ch.vertices, u = ch.uvs, count = ch.count || (v.length / 6);
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
            tris.push({ f, rect, idx, v, u, ch });
          }
        }
        const faceBounds = new Map();
        for (const tr of tris) {
          let fb = faceBounds.get(tr.f);
          if (!fb) { fb = { mn: [1e9, 1e9], mx: [-1e9, -1e9] }; faceBounds.set(tr.f, fb); }
          const t = tangentAxes(tr.f);
          for (const j of tr.idx) {
            const va = tr.v[6 * j + t[0]], vb = tr.v[6 * j + t[1]];
            if (va < fb.mn[0]) fb.mn[0] = va; if (va > fb.mx[0]) fb.mx[0] = va;
            if (vb < fb.mn[1]) fb.mn[1] = vb; if (vb > fb.mx[1]) fb.mx[1] = vb;
          }
        }
        for (const tr of tris) {
          const fb = faceBounds.get(tr.f);
          const t = tangentAxes(tr.f);
          const [x0, y0, x1, y1] = tr.rect;
          const w = x1 - x0, h = y1 - y0;
          const image = await imageForChunk(tr.ch);
          if (!image) return null; // Do not label a partially decoded reconstruction as successful.
          const sPts = [], dPts = [];
          for (const j of tr.idx) {
            const uN = (tr.v[6 * j + t[0]] - fb.mn[0]) / Math.max(1e-6, fb.mx[0] - fb.mn[0]);
            const vN = (tr.v[6 * j + t[1]] - fb.mn[1]) / Math.max(1e-6, fb.mx[1] - fb.mn[1]);
            const X = x0 + (flipU(tr.f) ? 1 - uN : uN) * w;
            const Y = y0 + (1 - vN) * h; // face top (v=max) -> rect top (y0), UNPACK_FLIP_Y_WEBGL=false
            sPts.push(tr.u[2 * j] * image.width, tr.u[2 * j + 1] * image.height);
            dPts.push(X, Y);
          }
          // #3577/#4039: build an EXPANDED clip triangle (each vertex pushed 4px outward from the
          // centroid) but keep the ORIGINAL dPts for the source→dest affine, so only border
          // coverage grows and triangle interiors are not shifted/stretched. The expanded clip is
          // additionally intersected with the face rect so nothing spills into neighbouring rects.
          const cx = (dPts[0] + dPts[2] + dPts[4]) / 3, cy = (dPts[1] + dPts[3] + dPts[5]) / 3;
          const ex = dPts.map((val, i) => {
            const base = i % 2 === 0 ? cx : cy;
            const d0 = val - base;
            // expand beyond the rect edge on purpose; the outer rect clip below stops the spill
            return val + (Math.abs(d0) < 1e-9 ? 0 : Math.sign(d0)) * 4;
          });
          ctx.save();
          ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
          if (drawClothTri(ctx, image, sPts, dPts, ex)) trianglesDrawn++;
          ctx.restore();
        }
      }
      return trianglesDrawn ? c.toDataURL('image/png') : null;
    } catch { return null; }
  }
  // #3424: keep the "Replace existing copies" affordance in sync as rows upgrade / thumbs land
  function updateOverwriteBtn() {
    const b = previewBar.querySelector('[data-preview-overwrite]');
    if (!b || !stagedPreview || !Array.isArray(stagedPreview.clothingReport)) return;
    const hw = (stagedPreview.harvestItems || stagedPreview.items || []).filter((x) => x && /^\d{1,16}$/.test(String(x.id || '')));
    const dupAssets = hw.filter((x) => window.CatalogPack?.byId?.(x.id) || window.CatalogCollection?.has?.('asset:' + x.id)).length;
    const dupLocal = stagedPreview.clothingReport.filter((r) => r && (r.status === 'extracted' || r.status === 'uploaded') && window.CatalogPack?.byId?.(localItemKey(r.id))).length;
    b.hidden = !(dupAssets + dupLocal > 0);
  }
  function renderClothingCard(list) {
    if (!clothingCardEl) return;
    const rows = Array.isArray(list) ? list : [];
    if (!rows.length) { clothingCardEl.hidden = true; clothingCardEl.innerHTML = ''; return; }
    clothingCardEl.hidden = false;
    clothingCardEl.innerHTML = `<h3>Imported Clothing</h3>
      <div class="avatar-clothing-list">${rows.map((r, i) => {
        const inLib = Boolean(window.CatalogCollection?.has?.('asset:' + r.id) || window.CatalogPack?.byId?.(localItemKey(r.id)));
        const status = r.status === 'imported'
          ? '<span class="cl-ok">Imported</span>'
          : r.status === 'extracted'
            ? '<span class="cl-blocked">Template blocked (Roblox 401/403)</span> — <span class="cl-ok">derived 3D preview</span> <small>(best-effort reconstruction from the avatar\'s own model, NOT the original template)</small>'
            : r.status === 'uploaded'
              ? '<span class="cl-ok">User-provided template</span>'
              : '<span class="cl-blocked">Blocked</span>';
        const thumb = (r.publicThumb ? `<span style="display:flex;flex-direction:column;align-items:center;gap:2px;width:68px;flex:none"><img class="cl-thumb" src="${esc(r.publicThumb)}" alt="Roblox item thumbnail"><small style="font-size:9px;text-align:center">Roblox item photo<br>(not template)</small></span>` : '') + (r.thumb ? `<span style="display:flex;flex-direction:column;align-items:center;gap:2px;width:68px;flex:none"><img class="cl-thumb" src="${esc(r.thumb)}" alt="${r.status === 'extracted' ? 'Derived local preview, not original template' : 'Clothing template preview'}"><small style="font-size:9px;text-align:center">${r.status === 'extracted' ? 'Derived local preview' : 'Template preview'}</small></span>` : '');
        let btn;
        if (r.status === 'blocked') btn = `<button type="button" class="as-btn ghost cl-add" data-cl-up="${i}">Upload template…</button>`;
        else if (r.status === 'extracted') btn = `<button type="button" class="as-btn ghost cl-add" data-cl-add="${i}">${inLib ? 'Replace local copy ↻' : 'Add derived preview to my Collection'}</button>`; // #3424: re-adding always overwrites the stored local copy
        else if (r.status === 'uploaded') btn = `<button type="button" class="as-btn ghost cl-add" data-cl-add="${i}">${inLib ? 'Replace local copy ↻' : 'Add uploaded template to my Collection'}</button>`;
        else btn = `<button type="button" class="as-btn ghost cl-add" data-cl-add="${i}" ${inLib ? 'disabled' : ''}>${inLib ? 'In Collection ✓' : 'Add to Catalog'}</button>`;
        return `<div class="avatar-clothing-row">${thumb}
          <div class="cl-meta"><strong>${esc(r.label || ('#' + r.id))}</strong>
          <small>${esc(LABEL[r.type] || r.type)} · #${esc(r.id)}</small>
          <small class="cl-status">${status}${r.status === 'blocked' ? ' — ' + esc(r.reason || 'unavailable') : ''}</small></div>
          ${btn}</div>`;
      }).join('')}</div>`;
  }
  const clothingUploadInput = studio.querySelector('#avatar-clothing-upload');
  let clothingUploadFor = -1;
  clothingCardEl?.addEventListener('click', (e) => {
    const upBtn = e.target.closest('[data-cl-up]');
    if (upBtn && stagedPreview && Array.isArray(stagedPreview.clothingReport)) {
      clothingUploadFor = Number(upBtn.dataset.clUp);
      clothingUploadInput?.click();
      return;
    }
    const btn = e.target.closest('[data-cl-add]');
    if (!btn || !stagedPreview || !Array.isArray(stagedPreview.clothingReport)) return;
    const row = stagedPreview.clothingReport[Number(btn.dataset.clAdd)];
    if (!row || !/^\d{1,16}$/.test(String(row.id))) return;
    if (row.status === 'extracted' || row.status === 'uploaded') {
      // persist the image itself as a LOCAL wearable item (cat:local-*) — never the shared Catalog (#2416/#2471)
      saveLocalClothingItem(row).then((ok) => {
        say(ok
          ? ('Saved ' + (row.label || ('#' + row.id)) + ' as a local wearable item (' + (row.status === 'uploaded' ? 'your uploaded template' : 'derived preview — not the original template') + '). Find it in the wardrobe to equip it.')
          : 'Could not save that item locally.');
        renderClothingCard(stagedPreview.clothingReport);
        drawOwnedWardrobe();
      });
      return;
    }
    // imported (publicly loadable) items keep the normal Add-to-Catalog behavior
    const ok = window.CatalogCollection?.ownByAssetId?.(row.id, row.type || 'Auto');
    say(ok ? ('Added ' + (row.label || ('#' + row.id)) + ' to your collection.') : 'Already in your collection.');
    renderClothingCard(stagedPreview.clothingReport);
  });
  clothingUploadInput?.addEventListener('change', () => {
    const file = clothingUploadInput.files && clothingUploadInput.files[0];
    const idx = clothingUploadFor;
    clothingUploadFor = -1;
    clothingUploadInput.value = '';
    if (!file || !stagedPreview || !Array.isArray(stagedPreview.clothingReport)) return;
    const row = stagedPreview.clothingReport[idx];
    if (!row) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (!stagedPreview || stagedPreview.clothingReport !== undefined && !stagedPreview.clothingReport.includes(row)) return;
      row.status = 'uploaded';
      row.thumb = String(reader.result || '');
      row.userProvided = true;
      renderClothingCard(stagedPreview.clothingReport);
      say('Template image loaded for ' + (row.label || ('#' + row.id)) + ' — it stays on this device unless you add it to your collection.');
    };
    reader.onerror = () => say('Could not read that image file.', true);
    reader.readAsDataURL(file);
  });
  // #2401: blocked shirt/pants whose template Roblox restricts can still be pulled out of
  // the imported character's own composite texture — upgrade the row when it lands.
  function kickClothingExtraction(charZip, report) {
    if (!charZip || !Array.isArray(report)) return;
    for (const row of report) {
      if (row.status !== 'blocked' || (row.type !== 'Shirt' && row.type !== 'Pants')) continue;
      extractClothingThumb(charZip.slice(0), row.type).then((thumb) => { // copy: parse() detaches its buffer
        if (!thumb) return;
        if (!stagedPreview || stagedPreview.clothingReport !== report) return;
        row.status = 'extracted';
        row.thumb = thumb;
        renderClothingCard(report);
        updateOverwriteBtn(); // #3424: a replaced local copy may make the overwrite affordance relevant
      }).catch(() => {});
    }
  }
  // Read-only public item pictures; pictures do not grant or contain wearable templates. (#2459/#2464/#2761)
  async function loadClothingPublicThumbs(report) {
    if (!Array.isArray(report) || !report.length) return;
    const ids = [...new Set(report.map(r => String(r.id || '')).filter(id => /^\d{1,16}$/.test(id)))].slice(0, 20);
    if (!ids.length) return;
    try {
      const r = await fetch(apiUrl('/api/avatar-thumbnails?ids=' + ids.join(',')));
      if (!r.ok) return;
      const j = await r.json();
      if (!stagedPreview || stagedPreview.clothingReport !== report) return; // late responses cannot alter a cancelled/replaced preview
      const urls = new Map((Array.isArray(j?.items) ? j.items : []).filter(x => ids.includes(String(x.id)) && /^https:\/\/[^/]+\.rbxcdn\.com\//i.test(String(x.url || ''))).map(x => [String(x.id), String(x.url)]));
      for (const row of report) if (urls.has(String(row.id))) row.publicThumb = urls.get(String(row.id));
      renderClothingCard(report);
      updateOverwriteBtn();
    } catch {} // thumbnail availability does not imply template availability
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
      const localKey = localItemKey(id);
      const wornId = window.CatalogPack?.byId?.(localKey) ? localKey : id; // worn via local item if one exists
      if (!wornIds.includes(wornId)) wornIds.push(wornId);
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
      const isMarker = equipped && !items.some((x) => String(x.id) === String(it.assetId));
      // #4478: equipped state + Adjust affordance inline on the tile; #4020/#2530: Adjust only for Hat/Auto
      const adjustable = (it.type === 'Hat' || it.type === 'Auto') && !isMarker;
      const adjustBtn = equipped && adjustable
        ? `<button type="button" class="as-btn ghost" data-tile-adjust="${esc(it.assetId)}" aria-label="Adjust ${esc(it.title)}" title="Adjust offset" style="position:absolute;top:4px;right:4px;padding:2px 7px;font-size:11px;z-index:1" ${busy ? 'disabled' : ''}>⚙</button>`
        : '';
      const common = `data-equip-owned="${esc(it.key)}" data-asset-id="${esc(it.assetId)}" aria-pressed="${equipped}" aria-label="${esc(it.title)}${equipped ? (isMarker ? ' (Worn by imported model — click to remove marker)' : ' (Equipped — click to unequip)') : ' (Click to equip)'}" title="${esc(it.title)}"`;
      const inner = `<span class="avatar-tile-thumb">${thumbInner}${checkBadge}</span>\n        <span class="avatar-tile-title">${esc(it.title)}${isMarker ? ' <small>· imported</small>' : ''}</span>${adjustBtn}`;
      if (equipped && adjustable) {
        return `<div class="avatar-tile is-equipped" role="button" tabindex="0" style="position:relative" ${common}>${inner}</div>`;
      }
      return `<button type="button" class="avatar-tile${equipped ? ' is-equipped' : ''}" ${common} ${busy ? 'disabled' : ''}>${inner}</button>`;
    }).join('');
  }

  function draw() {
    drawOwnedWardrobe(); // #4478: worn state lives on the tiles themselves (no separate card)
    if (activeTab === 'settings' && !studio.hidden) drawSettingsPanel();
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
    const metaMap = new Map(next.map((n) => [String(n.id), n]));
    items = (resolved || next).map((r) => {
      const n = metaMap.get(String(r.id));
      const ox = clampOff(r.x ?? n?.x), oy = clampOff(r.y ?? n?.y), oz = clampOff(r.z ?? n?.z), os = clampS(r.s ?? n?.s);
      if (ox || oy || oz || os !== 1) offsetMemo[String(r.id)] = { x: ox, y: oy, z: oz, s: os };
      return {
        id: String(r.id),
        type: r.type,
        ...(labelMap.get(String(r.id)) ? { label: labelMap.get(String(r.id)) } : {}),
        ...(n && n.cat ? { cat: n.cat } : {}),
        ...(ox ? { x: ox } : {}), ...(oy ? { y: oy } : {}), ...(oz ? { z: oz } : {}), ...(os !== 1 ? { s: os } : {}),
      };
    });
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
      const cand = { id, type: kind, label: candidate.label || null };
      if (candidate.cat) cand.cat = candidate.cat;
      const memo = offsetMemo[id]; // remember per-id offsets across unequip/re-equip
      const mx = clampOff(candidate.x ?? memo?.x), my = clampOff(candidate.y ?? memo?.y), mz = clampOff(candidate.z ?? memo?.z), ms = clampS(candidate.s ?? memo?.s);
      if (mx) cand.x = mx; if (my) cand.y = my; if (mz) cand.z = mz; if (ms !== 1) cand.s = ms;
      await render([...filtered, cand], { opId, snapshot });
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
    return runEquip({ id: String(catItem.assetId), label: catItem.title || null, cat: catItem.category === 'hair' ? 'hair' : null }, catItem.type || 'Auto');
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
        <button type="button" data-preview-catalog style="padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;cursor:pointer" title="Add this avatar's assets to your Catalog WITHOUT wearing them">Catalog only</button>
        <button type="button" data-preview-overwrite hidden style="padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;cursor:pointer" title="Replace existing collection/local copies of this avatar's assets with this import (two-step confirm; nothing worn)">Replace existing copies</button>
        <button type="button" data-preview-cancel style="padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;cursor:pointer">Cancel Preview</button>
      </div>`;
      say('Previewing @' + stagedPreview.username + ' — click Apply & Save to wear, or Cancel Preview.');
      renderClothingCard(clothingReport);
      loadClothingPublicThumbs(clothingReport);
      kickClothingExtraction(charZip, clothingReport);
      updateOverwriteBtn(); // #3424

      const treyOwner = isTreyUser();
      const importedTreyName = ['trey6383', 'gigachadtrey'].includes(stagedPreview.username.toLowerCase());
      if ((treyOwner || importedTreyName) && harvestWearable.length > 0 && treyCatalogModal) { // #2741 inline card
        // #2446: don't prompt when nothing new would be added
        const alreadyCount = harvestWearable.filter((x) => Boolean(window.CatalogPack?.byId?.(x.id)) || Boolean(window.CatalogCollection?.has?.('asset:' + x.id))).length;
        const newCount = harvestWearable.length - alreadyCount;
        pendingTreyHarvest = null; // #2446: never show a stale prompt
        if (newCount > 0) pendingTreyHarvest = { username: stagedPreview.username, assets: harvestWearable, sharedMode: treyOwner };
        else if (clothingCardEl) {
          // #2446: all assets already cataloged — say so under the card instead of prompting
          clothingCardEl.hidden = false;
          clothingCardEl.insertAdjacentHTML('beforeend', `<div class="as-settings-note" style="margin-top:8px">All ${harvestWearable.length} asset${harvestWearable.length === 1 ? '' : 's'} from @${esc(stagedPreview.username)} are already in the Catalog.</div>`);
        }
        if (!pendingTreyHarvest) return;
        renderTreyInlineCard({ username: stagedPreview.username, assets: harvestWearable }, newCount, alreadyCount); // #2741: inline card, no popup
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
    const catOnlyBtn = e.target.closest('[data-preview-catalog]');
    if (catOnlyBtn) {
      // #2625 + #2297/#2446: Catalog-only import still requires an explicit confirmation
      // before anything is added — first click arms the confirm row, second click adds.
      if (!stagedPreview) return;
      if (catOnlyBtn.dataset.armed === '1') {
        const assets = (Array.isArray(stagedPreview.harvestItems) && stagedPreview.harvestItems.length
          ? stagedPreview.harvestItems : (stagedPreview.items || [])).filter((a) => a && /^\d{1,16}$/.test(String(a.id || '')));
        let added = 0, already = 0;
        for (const a of assets) {
          const id = String(a.id);
          if (window.CatalogCollection?.has?.('asset:' + id) || window.CatalogPack?.byId?.(id)) { already++; continue; }
          const ok = window.CatalogCollection?.ownByAssetId?.(id, a.type || 'Auto');
          if (ok) added++; else already++;
        }
        const uname = stagedPreview.username || 'avatar';
        clearStagedPreview(true); // restores the viewer — nothing is worn or applied
        say(added
          ? `Added ${added} asset${added === 1 ? '' : 's'} from @${uname} to your Catalog only — your worn avatar and saved appearance are unchanged.${already ? ` (${already} already in Catalog.)` : ''}`
          : `All ${already} asset${already === 1 ? '' : 's'} from @${uname} were already in your Catalog — nothing worn, nothing applied.`);
        return;
      }
      const assets = (Array.isArray(stagedPreview.harvestItems) && stagedPreview.harvestItems.length
        ? stagedPreview.harvestItems : (stagedPreview.items || [])).filter((a) => a && /^\d{1,16}$/.test(String(a.id || '')));
      catOnlyBtn.dataset.armed = '1';
      catOnlyBtn.textContent = `Confirm: add ${assets.length} asset${assets.length === 1 ? '' : 's'} to Catalog (not worn)?`;
      catOnlyBtn.style.background = 'rgba(37,99,235,.35)';
      say('Confirm once more to add these assets to your Catalog without wearing them.');
      return;
    }
    const owBtn = e.target.closest('[data-preview-overwrite]');
    if (owBtn) { // #3424: explicit two-step overwrite of existing copies — never worn/applied by this path
      if (!stagedPreview) return;
      if (owBtn.dataset.armed === '1') {
        let replaced = 0, fresh = 0;
        const assets = (Array.isArray(stagedPreview.harvestItems) && stagedPreview.harvestItems.length ? stagedPreview.harvestItems : (stagedPreview.items || []))
          .filter((a) => a && /^\d{1,16}$/.test(String(a.id || '')));
        for (const a of assets) {
          const id = String(a.id);
          const existed = Boolean(window.CatalogPack?.byId?.(id) || window.CatalogCollection?.has?.('asset:' + id));
          const ok = window.CatalogCollection?.ownByAssetId?.(id, a.type || 'Auto');
          if (existed) { if (ok !== false) replaced++; } else fresh++;
        }
        for (const r of (stagedPreview.clothingReport || [])) {
          if (!r || (r.status !== 'extracted' && r.status !== 'uploaded') || !/^\d{1,16}$/.test(String(r.id || ''))) continue;
          if (!window.CatalogPack?.byId?.(localItemKey(r.id))) continue;
          saveLocalClothingItem(r).then((ok) => { if (ok && stagedPreview && stagedPreview.clothingReport) { renderClothingCard(stagedPreview.clothingReport); drawOwnedWardrobe(); } });
          replaced++;
        }
        owBtn.dataset.armed = '';
        owBtn.textContent = 'Replace existing copies';
        owBtn.style.background = 'rgba(255,255,255,.08)';
        say(`Overwrite complete for @${stagedPreview.username}: ${replaced} existing cop${replaced === 1 ? 'y' : 'ies'} replaced${fresh ? `, ${fresh} were not previously stored` : ''}. Nothing was worn or applied.`);
        return;
      }
      owBtn.dataset.armed = '1';
      owBtn.textContent = 'Confirm: replace existing copies?';
      owBtn.style.background = 'rgba(37,99,235,.35)';
      say('Confirm once more to replace the existing collection/local copies of these assets.');
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
        noteRecentUser(saveName); // #3421
        if (compactMode) renderSavedList();
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
      noteRecentUser(saveName); // #3421
      if (compactMode) renderSavedList();
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
      else if (tab === 'avatars') { activeWardrobeCat = 'all'; setBreadcrumb('Avatars', 'Import / Saved'); renderSavedList(); } // #4087: populate saved list when the Avatars tab opens in full mode too
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
  // ---- #2397/#2398/#2400 Settings tab (far right): pick an equipped asset BY NAME; XYZ sliders ----
  // Offsets use the stable per-item mechanism (#2131/#2230/#2312): the item keeps its canonical id,
  // the offset lives on the item, the renderer recomputes placements per frame (live while dragging,
  // #2505), the server clamps/sanitizes for MP sync, and the value persists in STORE_KEY.
  // No Scale slider (#2475). No unsupported-warning text (#2500/#2502) — controls shown only for
  // types with a real renderer transform (accessories); other types simply show no sliders.
  const SETTING_SLIDERS = [
    ['x', 'Position X', -0.5, 0.5, 0.05], ['y', 'Position Y (Height)', -0.5, 0.5, 0.05], ['z', 'Position Z (Depth)', -0.5, 0.5, 0.05],
  ];
  function drawSettingsPanel() {
    if (!settingsItemSel) return;
    const prev = settingsItemSel.value;
    const opts = [];
    if (baseCharacterKey) opts.push(`<option value="__base__">Base character — ${esc(baseCharacterKey)}</option>`);
    for (const it of items) {
      if (it.type !== 'Hat' && it.type !== 'Auto') continue; // #2530: shirts/pants/T-shirts/faces are not in the Settings selector
      opts.push(`<option value="${esc(it.id)}">${esc(LABEL[it.type] || it.type)} — ${esc(itemDisplayTitle(it))}</option>`);
    }
    settingsItemSel.innerHTML = opts.length ? opts.join('') : '<option value="">No equipped assets</option>';
    if (prev && Array.from(settingsItemSel.options).some((o) => o.value === prev)) settingsItemSel.value = prev;
    drawSettingsSliders();
  }
  function currentSettingId() { return settingsItemSel && settingsItemSel.value ? settingsItemSel.value : ''; }
  function drawSettingsSliders() {
    if (!settingsSlidersEl) return;
    const id = currentSettingId();
    if (!id) {
      settingsSlidersEl.innerHTML = '';
      if (settingsNoteEl) settingsNoteEl.textContent = 'Equip an asset (or import an avatar) to adjust it here.';
      return;
    }
    if (id === '__base__') {
      settingsSlidersEl.innerHTML = '';
      if (settingsNoteEl) settingsNoteEl.textContent = '';
      return;
    }
    const it = items.find((x) => String(x.id) === id);
    const adjustable = it && (it.type === 'Hat' || it.type === 'Auto'); // accessories have a real transform channel
    if (!adjustable) {
      // texture-map items (Shirt/Pants/T-Shirt/Face) have no position transform — show no sliders,
      // and per #2500/#2502 no warning text either.
      settingsSlidersEl.innerHTML = '';
      if (settingsNoteEl) settingsNoteEl.textContent = '';
      return;
    }
    settingsSlidersEl.innerHTML = SETTING_SLIDERS.map(([axis, label, min, max, step]) => {
      const val = Number(it[axis]) || 0;
      return `<label class="as-slider"><span>${label}</span><input type="range" data-adj="${axis}" min="${min}" max="${max}" step="${step}" value="${val}" aria-label="${label}"><output>${fmtOff(val)}</output></label>`;
    }).join('');
    if (settingsNoteEl) settingsNoteEl.textContent = '';
  }
  let saveThrottle = 0;
  settingsItemSel?.addEventListener('change', drawSettingsSliders);
  settingsSlidersEl?.addEventListener('input', (e) => {
    const input = e.target.closest('input[data-adj]');
    if (!input) return;
    const id = currentSettingId();
    if (!id || id === '__base__') return;
    const it = items.find((x) => String(x.id) === id);
    if (!it || !(it.type === 'Hat' || it.type === 'Auto')) return;
    const axis = input.dataset.adj;
    const v = clampOff(parseFloat(input.value));
    if (v) it[axis] = v; else delete it[axis];
    const memo = offsetMemo[id] || (offsetMemo[id] = {});
    if (v) memo[axis] = v; else delete memo[axis];
    applyOffLive(id, axis, v); // live 3D preview while dragging (#2505)
    const out = input.parentElement && input.parentElement.querySelector('output');
    if (out) out.textContent = fmtOff(v);
    const now = Date.now();
    if (now - saveThrottle > 400) { saveThrottle = now; saveState(); } // persist throttled, not per-pixel
  });
  settingsSlidersEl?.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-adj]');
    if (!input) return;
    const id = currentSettingId();
    const it = id && items.find((x) => String(x.id) === id);
    if (!it) return;
    const axis = input.dataset.adj;
    const v = clampOff(parseFloat(input.value));
    if (v) it[axis] = v; else delete it[axis];
    applyOffLive(id, axis, v);
    saveState();
    broadcastAppearance(); // MP sync (server clamps); throttled separately from persistence
    say((axis === 'z' ? 'Depth ' : axis.toUpperCase() + ' ') + fmtOff(v) + ' for ' + itemDisplayTitle(it) + '.');
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
    const adj = e.target.closest('[data-tile-adjust]'); // #4478/#2530: inline Adjust opens settings for Hat/Auto
    if (adj) {
      const it = items.find((x) => String(x.id) === String(adj.dataset.tileAdjust));
      selectTab('settings');
      if (it && settingsItemSel) {
        const opt = Array.from(settingsItemSel.options).find((o) => o.value === String(it.id));
        if (opt) { settingsItemSel.value = opt.value; drawSettingsSliders(); }
        else say('This item type has no offset sliders — only accessories do.', true);
      }
      return;
    }
    const btn = e.target.closest('[data-equip-owned]');
    if (!btn || busy) return;
    const key = btn.dataset.equipOwned;
    const aid = String(btn.dataset.assetId || '');
    const alreadyEquipped = items.some((x) => String(x.id) === aid);
    if (!alreadyEquipped && (Array.isArray(wornIds) ? wornIds : []).map(String).includes(aid)) {
      // imported worn marker: remove the marker + broadcast; the base model itself is unchanged
      wornIds = wornIds.filter((x) => String(x) !== aid);
      saveState(); broadcastAppearance(); draw();
      say('Removed #' + aid + ' from the worn list. The imported base model itself is unchanged — re-import to change it.');
      return;
    }
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

  ownedListEl.addEventListener('keydown', (e) => { // #4478: div tiles need Enter/Space
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const btn = e.target.closest('[data-equip-owned]');
    if (btn && !e.target.closest('[data-tile-adjust]')) { e.preventDefault(); btn.click(); }
  });

  async function removeWornItemAt(idx) { // #3567: single unequip path for equipped chips
    if (busy) return;
    clearStagedPreview(true);
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
  }
  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-rm]');
    if (!btn) return;
    await removeWornItemAt(Number(btn.dataset.rm));
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
    if (e.target.closest('[data-trey-skip]')) { // #2741: inline card closes only via Skip/confirm
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

  let returnToGame = false; // #2466
  function open(trigger = null, opts = null) {
    const inGame = !!document.getElementById('home-screen')?.hidden;
    compactMode = inGame && !(opts && opts.full); // #3421: in-game open = compact switcher, game stays open
    if (studio.hidden) {
      returnToGame = inGame;
      if (returnToGame && !compactMode) window.HomeScreen?.show?.();
    }
    window.__pendingAvatarOpen = false;
    document.getElementById('home-avatar-loading')?.remove();
    if (!compactMode) {
      const host = document.getElementById('home-avatar-host');
      if (host && studio.parentNode !== host) host.append(studio);
      window.HomeScreen?.showAvatar?.();
    }
    hydrateLocalItems();
    window.dispatchEvent(new Event('hud:control-suspend'));
    opener = trigger || document.activeElement;
    clearStagedPreview(false);
    syncKnownAvatarMeta();
    if (compactMode) { // #3421: small floating panel over the running game — no full-screen takeover
      studio.classList.add('compact');
      studio.hidden = false;
      renderSavedList();
      selectTab('avatars');
      draw();
      say('');
      return;
    }
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
  function close(opts = null) {
    if (studio.hidden) return;
    closeTreyModal();
    clearStagedPreview(true);
    if (compactMode) { // #3421: compact panel just hides; the game was never hidden
      compactMode = false;
      studio.classList.remove('compact');
      studio.hidden = true;
      say('');
      opener?.focus?.({ preventScroll: true });
      return;
    }
    studio.hidden = true;
    viewer?.stop();
    say('');
    window.HomeScreen?.showHome();
    const resumeGame = returnToGame && !!opts?.resumeGame; // #2466: Done/Esc from in-game returns to the running game
    returnToGame = false;
    if (resumeGame) window.HomeScreen?.hide?.();
    opener?.focus?.({ preventScroll: true });
  }
  studio.querySelector('[data-done]').addEventListener('click', () => close({ resumeGame: true }));
  // #3072: explicit, non-destructive fetch/merge of the account outfit config — local choices
  // always win and nothing local is removed; server-only entries are added (equipped when
  // resolvable on this device, otherwise kept in `deferred` so a later Save preserves them).
  studio.querySelector('[data-merge-config]')?.addEventListener('click', async () => {
    const btn = studio.querySelector('[data-merge-config]');
    btn.disabled = true;
    try {
      const r = await fetch(apiUrl('/api/avatar-config'), { cache: 'no-store' });
      if (r.status === 401) { say('Sign in to Websim to fetch your account outfit.', true); return; }
      if (!r.ok) { say('Could not fetch your account outfit (HTTP ' + r.status + ') — your local outfit is unchanged.', true); return; }
      const j = await r.json().catch(() => null);
      const cfg = j && j.config && typeof j.config === 'object' && !Array.isArray(j.config) ? j.config : null;
      if (!cfg) { say('No account outfit saved yet — nothing to merge.', true); return; }
      knownConfigUpdatedAt = j.config ? (Number(j.updatedAt) || 0) : null;
      configConflict = false; configOverwriteConsent = false;
      const locals = readLocalItems();
      const have = new Set(items.concat(deferredItems).map((it) => String(it && it.id || '')));
      let added = 0, keptLocal = 0;
      if (Array.isArray(cfg.items)) {
        for (const it of cfg.items.slice(0, 400)) {
          const id = String(it && it.id || '');
          if (!id) continue;
          if (have.has(id)) { keptLocal++; continue; }
          have.add(id);
          if (window.CatalogPack?.byId?.(id) || locals[id]) items.push(it);
          else deferredItems.push(it);
          added++;
        }
      }
      if (!colorCustomized && cfg.colors && typeof cfg.colors === 'object' && !Array.isArray(cfg.colors)) {
        colors = { ...DEFAULT, ...cfg.colors }; colorCustomized = true; window.__avatarColors = floats();
      }
      if (Array.isArray(cfg.worn)) {
        for (const w of cfg.worn) { const ws = String(w); if (!wornIds.includes(ws) && (/^\d{1,16}$/.test(ws) || /^cat:[a-z0-9-]{2,40}$/.test(ws))) wornIds.push(ws); }
      }
      if (cfg.adjust && typeof cfg.adjust === 'object' && !Array.isArray(cfg.adjust)) {
        for (const k of Object.keys(cfg.adjust)) if (!(k in adjustments)) adjustments[k] = cfg.adjust[k];
      }
      saveState();
      if (typeof broadcastAppearance === 'function') { try { broadcastAppearance(); } catch {} }
      say('Merged account outfit: added ' + added + ' item(s) from your account' + (keptLocal ? ', kept ' + keptLocal + ' local item(s) unchanged' : '') + '. Nothing local was removed; local images stay on this device.');
    } catch {
      say('Could not fetch your account outfit — your local outfit is unchanged.', true);
    } finally { btn.disabled = false; }
  });
  // #2624: explicit Save button — persist the CURRENT appearance without changing it.
  // Reuses the same CAS-guarded, non-destructive persistServerAvatar path as Apply.
  studio.querySelector('[data-save-avatar]')?.addEventListener('click', async () => {
    const btn = studio.querySelector('[data-save-avatar]');
    const rawAp = String(window.__avatarAppearanceName || '');
    const name = (baseCharacterKey && String(baseCharacterKey)) || (rawAp.startsWith('__custom__') || !rawAp ? '' : rawAp);
    const validName = !!(name && /^[A-Za-z0-9_]{1,20}$/.test(name));
    const cfgName = validName ? name : 'custom';
    if (!validName) {
      // #2943/#2940: a noob/custom look has no character ZIP, but the outfit JSON itself is
      // server-savable — save it when signed in instead of refusing with a device-only message.
      // #3021: disabled + conflict-lock + single-flight exactly like the named branch.
      btn.disabled = true;
      try {
        const cfg = await persistServerAvatarConfig(cfgName, { force: configOverwriteConsent });
        if (cfg === true) {
          say(hasLocalImageItems()
            ? 'Saved your outfit config to your account — no imported avatar ZIP needed. Items backed by local-only images stay on THIS device and are not synced. Nothing else was changed.'
            : 'Saved your outfit (items/colors/offsets) to your account — no imported avatar ZIP needed. Nothing else was changed.');
        } else if (cfg === 'conflict') {
          configOverwriteConsent = true; // arm explicit consent: next Save overwrites the account copy
          say('Your saved outfit changed on another device — the account copy was NOT overwritten and your local outfit is kept. Click Save again to explicitly overwrite the account copy, or use Merge account outfit to pull theirs non-destructively.', true);
        } else if (cfg === 'too-large') {
          say('Your outfit is too large to save as one config (' + (items.length + deferredItems.length) + ' items, cap 400) — nothing was sent to the server.', true);
        } else {
          say(items.length || colorCustomized
            ? 'Your custom items/colors/offsets are saved on this device only — sign in to Websim to save them to your account. Nothing was changed.'
            : 'Nothing server-savable right now — import or apply a Roblox avatar first. Your saved avatar is unchanged.', true);
        }
      } finally { btn.disabled = false; }
      return;
    }
    btn.disabled = true;
    say('Saving @' + name + '…');
    try {
      let zip = null;
      try {
        const c = await readAvatarCache();
        if (c && c.name && String(c.name).toLowerCase() === name.toLowerCase()) {
          zip = await cacheGetZip('zip:' + c.uid + ':' + String(c.name));
        }
      } catch {}
      const savedOk = await persistServerAvatar(name, zip || null);
      const cfg = await persistServerAvatarConfig(cfgName, { force: configOverwriteConsent }); // #2943: outfit JSON alongside the ZIP save
      if (cfg === 'conflict') {
        configOverwriteConsent = true;
        // #3072: report the partial commit honestly — the base avatar may already be saved.
        say(savedOk
          ? 'Saved @' + name + ' (base avatar) to your account, BUT your outfit config changed on another device, so the account outfit was NOT overwritten. Your local outfit is kept. Click Save again to explicitly overwrite the account outfit, or use Merge account outfit to pull theirs non-destructively.'
          : 'Your saved outfit changed on another device — the account outfit was NOT overwritten and your local outfit is kept. Click Save again to explicitly overwrite the account outfit, or use Merge account outfit to pull theirs non-destructively.', true);
      } else if (cfg === 'too-large') {
        say('Your outfit is too large to save as one config (' + (items.length + deferredItems.length) + ' items, cap 400) — nothing was sent to the server.', true);
      } else if (savedOk && (items.length || colorCustomized)) {
        say(cfg === true
          ? (hasLocalImageItems()
              ? 'Saved @' + name + ' (base avatar) and your outfit config to your account. Items backed by local-only images stay on THIS device and are not synced.'
              : 'Saved @' + name + ' (base avatar) and your outfit (items/colors/offsets) to your account.')
          : 'Saved @' + name + ' (base avatar) to your account. Your equipped items, colors and offsets are stored on this device and will not roam to other devices.');
      } else if (!savedOk && cfg === true && (items.length || colorCustomized)) {
        say('The base-avatar save did not go through, but your outfit (items/colors/offsets) was saved to your account. Your previously saved avatar is untouched.', true);
      }
    } finally {
      btn.disabled = false;
    }
  });
  studio.querySelector('[data-open-catalog]')?.addEventListener('click', () => {
    closeTreyModal();
    clearStagedPreview(true);
    studio.hidden = true;
    viewer?.stop();
    returnToGame = false;
    window.HomeScreen?.showCatalog?.();
  });
  window.addEventListener('keydown', (e) => {
    if (studio.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close({ resumeGame: true }); }
  }, true);

  // Re-apply persisted editor customizations after initial saved-character restore on reload.
  (window.JoiningScreen?.ready || Promise.resolve()).then(async () => {
    const priorColors = window.__avatarColors, priorAppearance = window.__avatarAppearanceName;
    const bootOp = opEpoch, bootSave = saveSeq; // #2560/#2572: any newer local op/save aborts the async cache path
    const bootStale = () => opEpoch !== bootOp || saveSeq !== bootSave;
    // load persisted worn ids + adjustments FIRST, and read the saved editor state once so the
    // cache path can honor an explicit local choice (base:null noob choice, or a different saved base)
    let saved0 = null;
    try {
      const raw0 = localStorage.getItem(STORE_KEY);
      if (raw0) {
        const s0 = JSON.parse(raw0);
        if (s0 && typeof s0 === 'object') {
          saved0 = s0;
          if (Array.isArray(s0.worn)) wornIds = s0.worn.map(String).filter((x) => /^\d{1,16}$/.test(x) || /^cat:[a-z0-9-]{2,40}$/.test(x)).slice(0, 64); // #2379
          if (s0.adjust && typeof s0.adjust === 'object') adjustments = s0.adjust; // #2397
          if (Array.isArray(s0.deferred)) deferredItems = s0.deferred.slice(0, 400); // #3021
        }
      }
    } catch {}
    // #2560: explicit local no-base choice (STORE_KEY present with base:null) or a different
    // saved base => the imported cache/network restore must never override it
    const explicitNoBase = !!(saved0 && Object.prototype.hasOwnProperty.call(saved0, 'base') && saved0.base === null);
    const savedBase = saved0 && typeof saved0.base === 'string' && saved0.base ? saved0.base : null;
    // #2512 migration: legacy cat:pos-* clone keys -> stable base id + x/y/z offsets on the item
    try {
      const rawM = localStorage.getItem(STORE_KEY);
      if (rawM) {
        const sM = JSON.parse(rawM);
        if (sM && typeof sM === 'object' && Array.isArray(sM.items)) {
          let changed = false;
          const itemsM = sM.items.map((it) => {
            const id = String(it && it.id || '');
            if (!id.startsWith('cat:pos-')) return it;
            const adj = adjustments[id];
            if (!adj || !adj.base || !Array.isArray(adj.pos)) return it;
            changed = true;
            const out = { ...it, id: String(adj.base) };
            delete out.label;
            const [px, py, pz] = adj.pos;
            const x = clampOff(px), y = clampOff(py), z = clampOff(pz);
            if (x) out.x = x; if (y) out.y = y; if (z) out.z = z;
            return out;
          });
          if (changed) {
            sM.items = itemsM;
            if (Array.isArray(sM.worn)) sM.worn = sM.worn.map((w) => (String(w).startsWith('cat:pos-') && adjustments[String(w)]?.base) ? String(adjustments[String(w)].base) : w);
            localStorage.setItem(STORE_KEY, JSON.stringify(sM));
          }
        }
      }
    } catch {}
    await hydrateLocalItems(); // register persisted cat:local-* items before any render() uses them
    if (bootStale()) return; // a local op/save already happened — never race it
    // #2943: when this device has NO local editor state, restore the server-saved outfit JSON
    // (colors/worn/adjustments/items). Local-only cat:local-* images resolve only if still stored
    // locally on this device; anything else is skipped — never invented, never wiped (#2358).
    if (!saved0 && !bootStale()) {
      try {
        const cm = await syncKnownAvatarConfigMeta();
        if (!bootStale() && cm.ok && cm.authenticated && knownConfigUpdatedAt !== null && knownConfigUpdatedAt !== 'anon') {
          const cr = await fetch(apiUrl('/api/avatar-config'), { cache: 'no-store' });
          if (!bootStale() && cr.ok) {
            const cj = await cr.json().catch(() => null);
            const cfg = cj && cj.config && typeof cj.config === 'object' && !Array.isArray(cj.config) ? cj.config : null;
            if (cfg && ((Array.isArray(cfg.items) && cfg.items.length) || cfg.colors || (Array.isArray(cfg.worn) && cfg.worn.length))) {
              if (cfg.colors && typeof cfg.colors === 'object' && !Array.isArray(cfg.colors)) {
                colors = { ...DEFAULT, ...cfg.colors };
                colorCustomized = true;
                window.__avatarColors = floats();
              }
              if (Array.isArray(cfg.worn)) wornIds = cfg.worn.map(String).filter((x) => /^\d{1,16}$/.test(x) || /^cat:[a-z0-9-]{2,40}$/.test(x)).slice(0, 64);
              if (cfg.adjust && typeof cfg.adjust === 'object' && !Array.isArray(cfg.adjust)) adjustments = cfg.adjust;
              if (Array.isArray(cfg.items)) {
                const locals = readLocalItems();
                // #3021: keep unresolved references in deferredItems so the next Save re-sends
                // them instead of serializing their loss; only resolvable items get equipped.
                deferredItems = cfg.items.slice(0, 64).filter((it) => !(it && it.id && (window.CatalogPack?.byId?.(String(it.id)) || locals[String(it.id)])));
                items = cfg.items.slice(0, 64).filter((it) => it && it.id && (window.CatalogPack?.byId?.(String(it.id)) || locals[String(it.id)]));
              }
              // NOTE #3021: cfg.base/appearance are intentionally NOT applied here — base avatar
              // restore stays with the /api/avatar-last ZIP path (#2358); this branch only
              // restores outfit items/colors/worn/adjustments.
              saveState();
              if (typeof broadcastAppearance === 'function') { try { broadcastAppearance(); } catch {} }
              say(deferredItems.length
                ? 'Restored your saved outfit from your account (' + deferredItems.length + ' item(s) need their source on this device and were kept unsynced).'
                : 'Restored your saved outfit from your account.');
            }
          }
        }
      } catch {}
    }
    // #2358: instant local cache first — character ZIP from CacheStorage, no network wait.
    // #2560/#2570/#2572/#2574: every awaited step is guarded; a valid explicit local choice
    // (base:null, or a different saved base) suppresses the cache entirely, and any op/save
    // that lands while we wait (renderer boot, Cache.match, loadCharacter) aborts the apply.
    let cacheBaseApplied = false;
    // #2582/#2586: an explicit no-base choice suppresses the cache entirely; a saved base only
    // suppresses it when the cached name MISMATCHES — a matching cache is the intentionally
    // chosen imported avatar and must restore (even offline).
    const cache = explicitNoBase ? null : await readAvatarCache();
    if (bootStale()) return;
    const cacheAllowed = !!(cache && cache.name && !String(cache.name).startsWith('__custom__')
        && !(savedBase && savedBase.toLowerCase() !== String(cache.name).toLowerCase()));
    if (cacheAllowed) {
      let gameR0 = null;
      for (let i = 0; i < 120 && !gameR0; i++) {
        if (bootStale()) return; // user chose something while the renderer was booting
        const r = window.__avatarRenderer;
        gameR0 = r && typeof r.loadCharacter === 'function' ? r
          : (r && r.instance && typeof r.instance.loadCharacter === 'function' ? r.instance : null);
        if (!gameR0) await new Promise((r2) => setTimeout(r2, 250));
      }
      if (bootStale()) return;
      const zip = await cacheGetZip('zip:' + cache.uid + ':' + String(cache.name));
      if (bootStale()) return; // #2572: delayed Cache.match must not clobber the user's new choice
      if (zip && gameR0?.loadCharacter) {
        try {
          await gameR0.loadCharacter(cache.name, zip);
          if (bootStale()) return; // load finished after a newer local op — do not apply
          window.__avatarAppearanceName = cache.name;
          window.__avatarBlobUrl = cache.url || null;
          window.__avatarServerUrl = cache.url || null;
          window.__avatarDisplayName = cache.name;
          cacheBaseApplied = true;
        } catch {}
      }
      if (!cacheBaseApplied && !bootStale() && gameR0?.ensure) { try { gameR0.ensure(cache.name); } catch {} }
    }
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      syncBaseFromGame(); // worn/adjust already loaded above
      if (saved.base && baseCharacterKey && saved.base.toLowerCase() !== baseCharacterKey.toLowerCase()) return;
      if (saved.base && !baseCharacterKey) {
        // desired imported base not loaded (cache mismatched/offline) — try the game renderer's
        // own restore, but HOLD rather than render/saveState with a missing base (#2586/#2590:
        // rendering items with no base would wipe STORE_KEY.base to null)
        const g0 = window.__avatarRenderer?.ensure ? window.__avatarRenderer : window.__avatarRenderer?.instance;
        if (g0 && typeof g0.ensure === 'function') { try { g0.ensure(String(saved.base)); } catch {} }
        syncBaseFromGame();
        if (!baseCharacterKey) return;
      }
      if (!saved.base && baseCharacterKey) return;
      const clean = Array.isArray(saved.items)
        ? saved.items.filter((i) => i && isValidAssetId(i.id) && LABEL[i.type]).slice(0, MAX).map((i) => {
            const x = clampOff(i.x), y = clampOff(i.y), z = clampOff(i.z), os = clampS(i.s);
            if (x || y || z || os !== 1) offsetMemo[String(i.id)] = { x, y, z, s: os };
            return { id: String(i.id), type: i.type, ...(i.label ? { label: String(i.label) } : {}), ...(i.cat === 'hair' || i.cat === 'face' ? { cat: i.cat } : {}), ...(x ? { x } : {}), ...(y ? { y } : {}), ...(z ? { z } : {}), ...(os !== 1 ? { s: os } : {}) };
          })
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
      if (explicitNoBase) return; // #2560: explicit noob/no-base choice — network restore must not override it
      try {
        const r = await fetch(apiUrl('/api/avatar-last'), { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json().catch(() => null);
        const av = j && j.avatar;
        if (!av || !av.url || !av.name || !/^\d{1,16}$|^[A-Za-z0-9_]{1,20}$/.test(String(av.name))) return;
        const serverUpdatedAt = Number(av.updatedAt) || 0;
        const cacheUpdatedAt = cache && typeof cache.updatedAt === 'number' ? cache.updatedAt : -1;
        if (cacheBaseApplied && (cacheUpdatedAt === -1 || serverUpdatedAt <= cacheUpdatedAt)) return; // -1 = local-only apply, authoritative over stale network
        // #2632/#2590/#2556: an explicitly saved base is authoritative — a conflicting (even newer)
        // server avatar must never replace it or rewrite STORE_KEY.base
        if (savedBase && String(av.name).toLowerCase() !== savedBase.toLowerCase()) return;
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
        syncBaseFromGame();
        await writeAvatarCache({ updatedAt: serverUpdatedAt, name: av.name, url: av.url }, buf);
        // #2632: re-apply the current editor items on top of the refreshed base so an equipped
        // item can never silently disappear from the render; STORE_KEY itself is never rewritten here.
        // #2688/#2689: use the LIVE in-memory items (sliders mutate them on every input event, before
        // the throttled save), never the throttled STORE snapshot — a mid-drag value must survive a
        // held server refresh.
        try {
          const its = (Array.isArray(items) ? items : [])
            .filter((i) => i && isValidAssetId(i.id) && LABEL[i.type]).slice(0, MAX)
            .map((i) => ({ id: String(i.id), type: i.type, ...(i.label ? { label: String(i.label) } : {}), ...(i.cat === 'hair' || i.cat === 'face' ? { cat: i.cat } : {}), ...(i.x ? { x: i.x } : {}), ...(i.y ? { y: i.y } : {}), ...(i.z ? { z: i.z } : {}), ...(i.s ? { s: i.s } : {}) }));
          if (its.length && (!savedBase || String(savedBase).toLowerCase() === String(av.name).toLowerCase())) {
            if (myOp !== opEpoch || mySave !== saveSeq) return;
            await render(its, { snapshot: { active: av.name, blob: av.url, base: av.name } });
          }
        } catch {}
      } catch {}
    })();
  });

  // #3421: saved-avatar quick list (current local base, account /api/avatar-last, recent imports)
  function noteRecentUser(name) {
    try {
      const n = String(name || '').trim();
      if (!/^[A-Za-z0-9_]{1,20}$/.test(n)) return;
      const raw = JSON.parse(localStorage.getItem(RECENT_USERS_KEY) || '[]');
      const list = [{ name: n, at: Date.now() }, ...(Array.isArray(raw) ? raw : []).filter((x) => x && x.name !== n)];
      localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(list.slice(0, 10)));
    } catch {}
  }
  async function renderSavedList() {
    const el = studio.querySelector('#avatar-saved-list');
    if (!el) return;
    let acct = null;
    try {
      const r = await fetch(apiUrl('/api/avatar-last'), { cache: 'no-store' });
      if (r.ok) { const j = await r.json().catch(() => null); if (j && j.avatar && j.avatar.name) acct = j.avatar; }
    } catch {}
    let recent = [];
    try { recent = (JSON.parse(localStorage.getItem(RECENT_USERS_KEY) || '[]') || []).filter((x) => x && x.name).slice(0, 8); } catch {}
    const cur = baseCharacterKey || window.__avatarAppearanceName || null;
    const rows = [`<div class="avatar-saved-row"><span class="as-saved-name">${esc(cur ? ('@' + cur) : 'Default Noob')}</span><span class="as-saved-tag">wearing now</span></div>`];
    if (acct) rows.push(`<div class="avatar-saved-row"><span class="as-saved-name">${esc('@' + acct.name)} <span class="as-saved-tag">account save</span></span><button type="button" class="as-btn ghost" data-saved-account>Switch</button></div>`);
    for (const u of recent) {
      if (acct && String(u.name).toLowerCase() === String(acct.name).toLowerCase()) continue;
      if (cur && String(u.name).toLowerCase() === String(cur).toLowerCase()) continue;
      rows.push(`<div class="avatar-saved-row"><span class="as-saved-name">${esc('@' + u.name)}</span><button type="button" class="as-btn ghost" data-saved-import="${esc(u.name)}">Import</button></div>`);
    }
    // #4087/#4358: also list the account's server-saved avatars (GET /api/user-avatars, list-only).
    // fileUrl is honored ONLY when non-null; available:false entries render as metadata-only rows.
    try {
      const r2 = await fetch(apiUrl('/api/user-avatars'), { cache: 'no-store' });
      const j2 = r2.ok ? await r2.json().catch(() => null) : null;
      const saved = j2 && j2.ok && Array.isArray(j2.avatars) ? j2.avatars : [];
      const seen = new Set([cur, acct && acct.name, ...recent.map((u) => u.name)].filter(Boolean).map((n) => String(n).toLowerCase()));
      for (const a of saved) {
        const nm = a && a.name ? String(a.name) : '';
        if (!/^[A-Za-z0-9_]{1,20}$/.test(nm) || seen.has(nm.toLowerCase())) continue;
        seen.add(nm.toLowerCase());
        const when = Number(a.updatedAt) > 0 ? new Date(Number(a.updatedAt)).toISOString().slice(0, 10) : '';
        const tag = ['saved', a.source || '', when].filter(Boolean).join(' · ');
        if (a.fileUrl) {
          rows.push(`<div class="avatar-saved-row"><span class="as-saved-name">${esc('@' + nm)} <span class="as-saved-tag">${esc(tag)}</span></span><button type="button" class="as-btn ghost" data-saved-account>Switch</button></div>`);
        } else {
          rows.push(`<div class="avatar-saved-row" style="opacity:.65"><span class="as-saved-name">${esc('@' + nm)} <span class="as-saved-tag">${esc(tag)} · stored</span></span><span class="as-saved-tag">metadata only</span></div>`);
        }
      }
      if (j2 && j2.quota && typeof j2.quota === 'object') {
        rows.push(`<div class="avatar-saved-row" style="opacity:.6"><span class="as-saved-tag">asset storage ${Math.round((j2.quota.bytes || 0) / 1024)} / ${Math.round((j2.quota.maxBytes || 0) / 1024)} KiB</span></div>`);
      }
    } catch {}
    el.innerHTML = rows.join('');
  }
  // #3421: switch the running game to the account-saved base avatar WITHOUT leaving the map
  async function switchToAccountAvatar() {
    if (busy) return;
    busy = true;
    say('Loading your saved account avatar…');
    try {
      const m = await fetch(apiUrl('/api/avatar-last'), { cache: 'no-store' });
      if (!m.ok) { say('No saved account avatar — sign in and use Save first.', true); return; }
      const j = await m.json().catch(() => null);
      const av = j && j.avatar;
      if (!av || !av.url || !av.name) { say('No saved account avatar yet.', true); return; }
      const fr = await fetch(apiUrl('/api/avatar-last?file=1'), { cache: 'no-store' });
      if (!fr.ok) { say('Could not download the saved avatar right now.', true); return; }
      const buf = await fr.arrayBuffer();
      const gameR = window.__avatarRenderer?.loadCharacter ? window.__avatarRenderer : window.__avatarRenderer?.instance;
      if (!gameR?.loadCharacter) { say('3D renderer is not ready yet — try again in a moment.', true); return; }
      const opId = ++opEpoch;
      await gameR.loadCharacter(av.name, buf);
      if (opId !== opEpoch) return;
      const prevBase = baseCharacterKey; // #4086: remember what we were wearing before the switch
      window.__avatarAppearanceName = av.name;
      window.__avatarBlobUrl = av.url;
      window.__avatarServerUrl = av.url;
      window.__avatarDisplayName = av.name;
      baseCharacterKey = av.name;
      colorCustomized = false;
      window.__avatarColors = Object.fromEntries(PARTS.map(([n]) => [n, [1, 1, 1, 1]]));
      saveState();
      syncBaseFromGame();
      syncPickers();
      broadcastAppearance();
      await writeAvatarCache({ updatedAt: Number(av.updatedAt) || 0, name: av.name, url: av.url }, buf);
      // #4086: re-applying the previous items here layered the old avatar's outfit onto the new
      // base ("merge" + wrong skin tone). Same-base refresh still re-applies items (#2632); a real
      // base switch clears items/worn instead and says so honestly.
      const sameBase = prevBase && String(prevBase).toLowerCase() === String(av.name).toLowerCase();
      if (Array.isArray(items) && items.length) {
        if (sameBase) {
          try { await render(items, { opId, snapshot: { active: av.name, blob: av.url, base: av.name } }); } catch {}
        } else {
          items = []; wornIds = [];
          try { await render([], { opId, snapshot: { active: av.name, blob: av.url, base: av.name } }); } catch {}
          say('Cleared the previous outfit so it does not merge into @' + av.name + ' — re-equip from Owned Wardrobe.');
        }
      }
      noteRecentUser(av.name);
      say('Switched to saved avatar @' + av.name + ' — still in game.');
      renderSavedList();
      draw();
    } catch {
      say('Could not switch to the saved avatar.', true);
    } finally {
      busy = false;
    }
  }
  studio.querySelector('#avatar-saved-card')?.addEventListener('click', async (e) => {
    const acc = e.target.closest('[data-saved-account]');
    if (acc) { await switchToAccountAvatar(); return; }
    const imp = e.target.closest('[data-saved-import]');
    if (imp) { userInput.value = imp.dataset.savedImport || ''; userForm.requestSubmit(); }
  });

  window.AvatarStudio = Object.freeze({ open, close, get active() { return !studio.hidden; } });
  document.getElementById('home-avatar-loading')?.remove();
  if (window.__pendingAvatarOpen) {
    window.__pendingAvatarOpen = false;
    open();
  }
})();
