/* Multiplayer: shares poses and sword swings through the project's realtime room.
 * Remote characters are drawn by game.js; this module only tracks them. */
(() => {
  'use strict';
  const SEND_MS = 100;        // at most 10 pose updates per second
  const LAG_RATE = 14;        // how quickly remote characters catch up to their latest pose
  const remotes = new Map();  // id -> { id, username, x,y,z,yaw,ph,mv,eq,gr, rx,ry,rz,ryaw, view }
  const tags = new Map(),bubbles = new Map();     // id -> name-tag element
  const blasts=[],trowelHistory=new Map();
  let offlinePreferredInit = false;
  try {
    offlinePreferredInit = new URLSearchParams(location.search).get('offline') === '1' || sessionStorage.getItem('roblox-offline-mode') === '1';
  } catch {}
  const mp = {
    remotes, trowelHistory, counts: null,
    requestCounts: () => { if (mp.selfId && mp.connected) send({ type: 'counts' }); },
    social: (action, to) => { if (mp.selfId && mp.connected) send({ type: 'social', map: selectedMap, action, to }); },
    selfId: null, selfUsername: 'LocalPlayer',
    connected: false, offlineMode: false, offlinePreferred: offlinePreferredInit, reconnecting: false, offlineReason: '',
    sessionReplaced: false,
    enterOffline, reconnect, setOfflinePreferred, applyOfflineBuild, clearOfflineBuilds,
    sendPlaceTool, sendPlaceRelease, sendPose, sendBuild, sendBuildGrants, sendSwing, sendChat, sendEmote, sendAvatar,
    sendGunShot, sendGunReload, sendDropPickup, sendHit, sendRocket, sendOwnership, sendPhysics, sendTrowel,
    sendExplosion, sendDeath, sendHealth, sendUseCola, sendFinishCola, sendCancelCola,
    remoteBoxes, remoteParts, blocksPlayer, effects, update, drawLabels
  };
  let resolveRoomReady, roomReadySettled = false;
  function settleRoomReady(val) { if (roomReadySettled) return; roomReadySettled = true; resolveRoomReady(val); }
  mp.ready = new Promise(resolve => resolveRoomReady = resolve);
  window.JoiningScreen?.trackRoom(mp.ready);
  window.__multiplayer = mp;window.__placeWire={patches:new Map(),effects:null,spawn:null};

  const style = document.createElement('style');
  style.textContent =
    '#mp-tags{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2}' +
    '#mp-offline-bar{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:32;display:flex;align-items:center;gap:8px;padding:5px 7px 5px 12px;border-radius:999px;background:rgba(20,24,33,.92);border:1px solid rgba(245,158,11,.65);color:#fef3c7;font:600 12px/1 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:auto;max-width:94vw;white-space:nowrap}' +
    '#mp-offline-bar[hidden]{display:none!important}' +
    '#mp-offline-bar strong{white-space:nowrap;letter-spacing:.02em}' +
    '#mp-offline-bar .mp-offline-dot{width:8px;height:8px;border-radius:50%;background:#f59e0b;flex:0 0 auto}' +
    '#mp-offline-bar .mp-offline-sub{color:#cbd5e1;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#mp-offline-bar button{height:24px;padding:0 11px;border-radius:999px;border:1px solid #60a5fa;background:#1d4ed8;color:#fff;font:700 11px/1 system-ui,sans-serif;cursor:pointer;flex:0 0 auto}' +
    '#mp-offline-bar button:disabled{opacity:.65;cursor:default}';
  document.head.append(style);
  const worldEl = document.querySelector('.world');
  const layer = document.createElement('div');
  layer.id = 'mp-tags';
  worldEl.append(layer);layer.append(document.getElementById('rbx-local-chat-bubble'));layer.append(document.getElementById('rbx-dummy-overhead'));

  const offlineBar = document.createElement('div');
  offlineBar.id = 'mp-offline-bar';
  offlineBar.setAttribute('role', 'status');
  offlineBar.hidden = true;
  offlineBar.innerHTML = '<span class="mp-offline-dot" aria-hidden="true"></span><strong>OFFLINE MODE</strong><span class="mp-offline-sub">Solo local play · Local browser only</span><button type="button" id="mp-reconnect-btn">Reconnect</button>';
  worldEl.append(offlineBar);
  const offlineSubEl = offlineBar.querySelector('.mp-offline-sub');
  const reconnectBtn = offlineBar.querySelector('#mp-reconnect-btn');
  reconnectBtn.addEventListener('click', () => { reconnect(); });

  let poseSequence=0;let localAfkUntil=0,serverOffset=0,away=document.hidden,buildRevision=-1,socket = null, connectTimer = 0, connectAttemptId = 0, noticeTimer = 0, lastSent = null, lastSentAt = 0, forcePose=false, chatUntil=0, labelsAt=0;
  // Sessions are authenticated by the platform connection; no browser fingerprint is sent.
  const selectedMap=window.MapSelection.id;
  let offlineOwner = typeof window.websim?.getUser === 'function' ? null : 'anon';
  let offlineEditEpoch = 0;
  function offlineStorageKey(owner = offlineOwner || 'anon') {
    return 'offline-grid-builds:' + selectedMap + ':' + owner;
  }

  if (offlineOwner === null) {
    Promise.race([
      Promise.resolve(window.websim.getUser()).then(u => (u && u.id && !u.is_anonymous ? 'user:' + String(u.id) : 'anon'), () => 'anon'),
      new Promise(r => setTimeout(() => r('anon'), 1500))
    ]).then(resolvedOwner => {
      offlineOwner = resolvedOwner;
      if (mp.offlineMode && !mp.connected) {
        if (offlineEditEpoch === 0) {
          window.GridWorld?.snapshot(loadOfflineBuilds(offlineOwner));
        } else {
          saveOfflineBuilds(offlineOwner);
        }
      }
    });
  }

  function loadOfflineBuilds(owner = offlineOwner) {
    if (!owner) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(offlineStorageKey(owner)) || 'null');
      if (!parsed || parsed.user !== owner || parsed.map !== selectedMap || !Array.isArray(parsed.blocks)) return [];
      return parsed.blocks.slice(0, 500).filter(b => b && typeof b.key === 'string' && Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.z));
    } catch {
      return [];
    }
  }
  function saveOfflineBuilds(owner = offlineOwner) {
    if (!owner) return false;
    try {
      const list = [...(window.GridWorld?.blocks?.values() || [])].slice(0, 500);
      localStorage.setItem(offlineStorageKey(owner), JSON.stringify({
        user: owner,
        map: selectedMap,
        updatedAt: Date.now(),
        blocks: list
      }));
      return true;
    } catch {
      return false;
    }
  }
  function clearOfflineBuilds() {
    try { if (offlineOwner) localStorage.removeItem(offlineStorageKey(offlineOwner)); } catch {}
    if (mp.offlineMode && !mp.connected) window.GridWorld?.snapshot([]);
  }
  function applyOfflineBuild(m) {
    if (!mp.offlineMode || mp.connected || !window.GridWorld || !m || typeof m !== 'object') {
      return { ok: false, notice: 'Offline building is not active.' };
    }
    const W = window.GridWorld;
    if (!['build', 'paint', 'delete'].includes(m.action)) return { ok: false };
    const x = Number(m.x), y = Number(m.y), z = Number(m.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || Math.abs(x) > 60 || Math.abs(z) > 60 || y < 0 || y > 255) {
      return { ok: false, notice: 'Outside the build grid.' };
    }
    const key = W.key(x, y, z);
    const existing = W.blocks.get(key);
    if (m.action === 'delete') {
      if (!existing) return { ok: false };
      W.apply({ action: 'delete', key });
    } else if (m.action === 'paint') {
      if (!existing || typeof m.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(m.color)) return { ok: false };
      W.apply({ action: 'paint', key, block: { ...existing, color: m.color.toLowerCase() } });
    } else {
      if (existing) return { ok: false, notice: 'That grid cell is already occupied.' };
      if (W.blocks.size >= 500) return { ok: false, notice: 'Offline sandbox reached its 500-block browser limit.' };
      let color = typeof m.color === 'string' && /^#[0-9a-f]{6}$/i.test(m.color) ? m.color.toLowerCase() : '#418ac9';
      if (Array.isArray(m.source) && m.source.length === 3) {
        const srcBlk = W.blocks.get(W.key(m.source[0], m.source[1], m.source[2]));
        if (srcBlk?.color && /^#[0-9a-f]{6}$/i.test(srcBlk.color)) color = srcBlk.color.toLowerCase();
      }
      const block = {
        key, x, y, z, color,
        variant: typeof m.variant === 'string' ? m.variant : 'block',
        orientation: Number.isInteger(m.orientation) && m.orientation >= 0 && m.orientation < 24 ? m.orientation : 0,
        owner: offlineOwner || 'offline-local',
        username: 'Offline (Local)'
      };
      W.apply({ action: 'build', key, block });
    }
    offlineEditEpoch++;
    const persisted = offlineOwner ? saveOfflineBuilds(offlineOwner) : false;
    return {
      ok: true,
      persisted,
      notice: persisted
        ? 'Offline Mode: saved in this browser only'
        : 'Offline Mode: session only (browser storage unavailable)'
    };
  }

  function updateOfflineUi() {
    if (mp.sessionReplaced || mp.connected || !mp.offlineMode) {
      offlineBar.hidden = true;
      return;
    }
    offlineBar.hidden = false;
    reconnectBtn.disabled = !!mp.reconnecting;
    reconnectBtn.textContent = mp.reconnecting ? 'Reconnecting…' : (mp.offlinePreferred ? 'Go Online' : 'Reconnect');
    offlineSubEl.textContent = mp.reconnecting
      ? 'Connecting to live server…'
      : 'Solo local play · Local browser only';
  }

  function send(message){if(mp.connected&&socket)socket.send({...message,map:selectedMap});}
  function sendHello() { if(socket)socket.send({type:'hello',map:selectedMap,clientVersion:'places-4',fp:window.__deviceFp||undefined}); }
  function detachSocket() {
    clearTimeout(connectTimer);
    connectTimer = 0;
    if (!socket) return;
    const old = socket;
    socket = null;
    try {
      old.onmessage = null;
      old.onclose = null;
      old.onerror = null;
      old.onreconnect = null;
      old.close?.();
    } catch {}
  }

  function enterOffline(reason = 'Multiplayer unavailable — playing offline solo') {
    if (mp.sessionReplaced) return false;
    connectAttemptId++;
    detachSocket();
    const wasConnected = mp.connected;
    const wasOffline = mp.offlineMode;
    mp.connected = false;
    mp.reconnecting = false;
    mp.selfId = null;
    mp.offlineMode = true;
    mp.offlineReason = String(reason || 'Offline solo mode');
    lastSent = null;
    avatarPending = null;
    clearTimeout(avatarTimer);
    window.dispatchEvent(new CustomEvent('mp:cola-result', { detail: { accepted: false, reason: 'offline' } }));
    clearRemotes();
    // Switch GridWorld to isolated offline local builds (never mixing online room builds with offline edits)
    if (!wasOffline || wasConnected) {
      window.GridWorld?.snapshot(loadOfflineBuilds());
    }
    updateOfflineUi();
    emitRoster();
    settleRoomReady({ online: false, offline: true, reason: mp.offlineReason });
    window.dispatchEvent(new CustomEvent('mp:offline-changed', {
      detail: { offline: true, preferred: mp.offlinePreferred, reason: mp.offlineReason }
    }));
    if (reason) showNotice(reason, 3400);
    return true;
  }

  function setOfflinePreferred(flag) {
    const next = !!flag;
    mp.offlinePreferred = next;
    try {
      if (next) sessionStorage.setItem('roblox-offline-mode', '1');
      else sessionStorage.removeItem('roblox-offline-mode');
      const u = new URL(location.href);
      if (next) u.searchParams.set('offline', '1');
      else u.searchParams.delete('offline');
      history.replaceState(null, '', u.href);
    } catch {}
    if (next) {
      enterOffline('Offline mode enabled · Solo local play');
    } else {
      reconnect();
    }
  }

  // Close codes from the server: 4001 needs a Websim sign-in; the others explain why the room refused us.
  function closeReasonText(e) {
    const code = e && e.code, reason = String((e && (e.reason || e.message)) || '');
    if (code === 4001 || /sign in/i.test(reason)) return 'Not signed in — playing in Offline Mode';
    if (code === 4003 || code === 4012 || code === 4008 || code === 4009 || code === 4010 || code === 4029) return reason || 'Disconnected — playing in Offline Mode';
    return 'Multiplayer unavailable — playing in Offline Mode';
  }
  function markReplaced(reason){if(mp.sessionReplaced)return;detachSocket();mp.sessionReplaced=true;mp.connected=false;mp.offlineMode=false;mp.selfId=null;updateOfflineUi();clearRemotes();emitRoster();settleRoomReady({online:false});window.JoiningScreen?.cancel();window.dispatchEvent(new CustomEvent('mp:session-replaced',{detail:{reason}}))}
  function showNotice(text, autoHideMs = 4500) {
    let el = document.getElementById('mp-notice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mp-notice';
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;top:48px;transform:translateX(-50%);z-index:50;background:rgba(0,0,0,.82);color:#fff;font:600 13px/1.3 system-ui,sans-serif;padding:7px 14px;border-radius:6px;pointer-events:none;max-width:90vw';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.hidden = false;
    clearTimeout(noticeTimer);
    if (autoHideMs > 0) noticeTimer = setTimeout(() => { el.hidden = true; }, autoHideMs);
  }
  let boxCache=[];const gameCanvas=document.getElementById('game');
  const round = (v) => Math.round(v * 100) / 100;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function addRemote(p) {
    if(p.map!==selectedMap)return null;
    const r = { id: p.id, username: window.ChatText.clean(p.username || 'guest',48), x: p.x, y: p.y, z: p.z, yaw: p.yaw,
      bodyRotation:p.bodyRotation||null,freeSit:!!p.freeSit,ph: p.ph, mv: p.mv, eq: p.eq, gr: p.gr, tool:p.tool||null, fly:!!p.fly, pitch:p.pitch||0, rpitch:p.pitch||0,renderRotation:p.bodyRotation?.slice()||null, health:p.health??100,maxHealth:p.maxHealth||100,kos:p.kos||0,wipeouts:p.wipeouts||0,team:p.team||null, shieldUntil:p.shieldUntil||0, dead:!!p.dead, colors:p.colors||null, uid:p.uid||null, avatarName:p.avatarName||null, avatarUrl:p.avatarUrl||null, avatarAssets:Array.isArray(p.avatarAssets)?p.avatarAssets:null, colaDrink:!!p.colaDrink, colaDrinkToken:p.colaDrinkToken||null, weapons:!!p.weapons, missing:p.missing||[],afkUntil:p.afkUntil||0, rx: p.x, ry: p.y, rz: p.z, ryaw: p.yaw, view: null };
    remotes.set(p.id, r);
    return r;
  }
  function removeRemote(id) {
    remotes.delete(id);const bubble=bubbles.get(id);if(bubble){window.ChatBubbles.clear(bubble.el);bubble.el.remove();bubbles.delete(id)}
    const el = tags.get(id);
    if (el) { el.remove(); tags.delete(id); }
  }
  function applyPose(p) {
    if(p.map!==selectedMap)return;
    if (p.id === mp.selfId) return;
    const r = remotes.get(p.id) || addRemote(p);if(!r)return;
    if(r.ph!=='jump'&&p.ph==='jump')window.dispatchEvent(new CustomEvent('mp:jump',{detail:{point:[p.x,p.y+2.5,p.z]}}));
    Object.assign(r, { x: p.x, y: p.y, z: p.z, yaw: p.yaw, ph: p.ph, mv: p.mv, eq: p.eq, gr: p.gr, tool:p.tool||null, fly:!!p.fly, pitch:p.pitch||0,bodyRotation:p.bodyRotation||null,freeSit:!!p.freeSit, health:p.health??r.health, shieldUntil:p.shieldUntil??r.shieldUntil, dead:p.dead??r.dead, colors:p.colors===undefined?r.colors:p.colors,avatarName:p.avatarName===undefined?r.avatarName:p.avatarName,missing:p.missing??r.missing });
    if(r.dead||!r.eq||r.tool!=='bloxycola')r.colaDrink=false;
  }

  function emitRoster(){const players=mp.connected?[{id:mp.selfId,username:mp.selfUsername,self:true,weapons:!!window.CombatMode?.enabled,kos:mp.selfStats?.kos||0,wipeouts:mp.selfStats?.wipeouts||0,team:mp.selfStats?.team||null},...[...remotes.values()].map(r=>({id:r.id,uid:r.uid||null,username:r.username,self:false,weapons:!!r.weapons,kos:r.kos||0,wipeouts:r.wipeouts||0,team:r.team||null}))]:[{id:'local',username:'LocalPlayer',self:true,weapons:!!window.CombatMode?.enabled}];window.dispatchEvent(new CustomEvent('mp:roster',{detail:{connected:mp.connected,map:selectedMap,players}}))}
  function onMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if(msg.type==='updateRequired'){detachSocket();mp.connected=false;mp.offlineMode=false;mp.reconnecting=false;updateOfflineUi();settleRoomReady({online:false});showNotice(msg.reason||'Open the latest project version to play.',0);window.dispatchEvent(new CustomEvent('mp:update-required',{detail:msg}));return;}if(msg.type==='counts'){mp.counts=msg.counts;window.dispatchEvent(new CustomEvent('mp:counts',{detail:msg.counts}));return;}if(mp.sessionReplaced||msg.map&&msg.map!==selectedMap)return;
    // Never render gameplay from another map or from an old unscoped server.
    if(msg.type!=='sessionReplaced'&&msg.map!==selectedMap)return;
    switch (msg.type) {
      case 'physics':window.dispatchEvent(new CustomEvent('mp:physics',{detail:msg}));break;
      case 'placeParts':for(const p of msg.patches||[])if(p.reset)window.__placeWire.patches.delete(p.id);else window.__placeWire.patches.set(p.id,{...window.__placeWire.patches.get(p.id),...p});window.dispatchEvent(new CustomEvent('mp:place-parts',{detail:msg}));break;
      case 'placeEffects':window.__placeWire.effects=msg;window.dispatchEvent(new CustomEvent('mp:place-effects',{detail:msg}));break;
      case 'placeCheckpoint':window.__placeWire.spawn=msg.spawn;window.dispatchEvent(new CustomEvent('mp:place-checkpoint',{detail:msg}));break;
      case 'placeBoost':window.dispatchEvent(new CustomEvent('mp:place-boost',{detail:msg}));break;
      case 'placeRide':window.dispatchEvent(new CustomEvent('mp:place-ride',{detail:msg}));break;
      case 'placeJet':window.dispatchEvent(new CustomEvent('mp:place-jet',{detail:msg}));break;
      case 'presence':serverOffset=msg.serverNow-Date.now();if(msg.id===mp.selfId)localAfkUntil=msg.afkUntil;else if(remotes.has(msg.id))remotes.get(msg.id).afkUntil=msg.afkUntil;break;
      case 'pvpOff':window.dispatchEvent(new Event('mp:pvp-off'));break;
      case 'sessionReplaced':markReplaced(msg.reason||'This session has been replaced.');break;
      case 'buildSnapshot': buildRevision=msg.revision??buildRevision;if(msg.reset)window.GridWorld.snapshot(msg.blocks);else window.GridWorld.appendSnapshot(msg.blocks);break;
      case 'buildUpdate':if(msg.revision!==undefined&&msg.revision<=buildRevision)break;if(msg.revision!==undefined&&buildRevision>=0&&msg.revision>buildRevision+1){window.GridWorld.apply(msg);send({type:'buildSync',revision:-1});break;}window.GridWorld.apply(msg);buildRevision=msg.revision??buildRevision;break;
      case 'buildError':window.dispatchEvent(new CustomEvent('mp:build-error',{detail:msg}));break;
      case 'buildGrants':window.dispatchEvent(new CustomEvent('mp:build-grants',{detail:msg}));break;
      case 'welcome': {
        clearTimeout(connectTimer); connectTimer = 0;
        const wasOffline = mp.offlineMode;
        mp.offlineMode = false; mp.offlinePreferred = false; mp.reconnecting = false; mp.offlineReason = '';
        try { sessionStorage.removeItem('roblox-offline-mode'); } catch {}
        serverOffset=(msg.serverNow||Date.now())-Date.now();localAfkUntil=0;buildRevision=-1;window.__placeWire.patches.clear();window.__placeWire.effects=null;window.__placeWire.spawn=null;window.GridWorld.snapshot([]);trowelHistory.clear();window.dispatchEvent(new Event('mp:world-reset'));clearRemotes();
        mp.selfId = msg.id;lastSent=null;lastSentAt=0;forcePose=true;
        mp.connected = true;mp.serverPose=msg.players.find(p=>p.id===msg.id);mp.selfStats=mp.serverPose;mp.selfUsername=msg.players.find(p=>p.id===msg.id)?.username||'guest';
        updateOfflineUi();
        window.dispatchEvent(new CustomEvent('mp:offline-changed', { detail: { offline: false, preferred: false, reason: '' } }));
        if (wasOffline) showNotice('Connected online · Live room active', 2600);
        for (const p of msg.players) if (p.id !== msg.id) addRemote(p);sendCombatMode();sendPresence();emitRoster();const self=msg.players.find(p=>p.id===msg.id);if(self){window.dispatchEvent(new CustomEvent('mp:combat',{detail:{...self,type:'combat'}}));window.dispatchEvent(new CustomEvent('mp:correction',{detail:{...self,hard:true,reason:'welcome'}}));}
        settleRoomReady({online:true,offline:false});break;
      }
      case 'join':
        if (msg.player.id !== mp.selfId) addRemote(msg.player);emitRoster();
        break;
      case 'left':
        removeRemote(msg.id);emitRoster();
        break;
      case 'correction':
        mp.serverPose=msg;lastSent=null;forcePose=true;window.dispatchEvent(new CustomEvent('mp:correction',{detail:msg}));break;
      case 'verify': forcePose=true;break;
      case 'combatMode': {const r=remotes.get(msg.id);if(r)r.weapons=!!msg.enabled;emitRoster();break;}
      case 'appearance': {const r=remotes.get(msg.id);if(r){r.colors=msg.colors;r.avatarName=msg.avatarName;r.avatarUrl=msg.avatarUrl||null;r.avatarAssets=Array.isArray(msg.avatarAssets)?msg.avatarAssets:null;window.__avatarRenderer?.preload(r.avatarUrl||r.avatarName)}break;}
      case 'chatCooldown': chatUntil=performance.now()+msg.remaining;window.dispatchEvent(new CustomEvent('mp:chat-cooldown',{detail:msg}));break;
      case 'poses':
        for (const p of msg.players) applyPose(p);
        break;
      case 'rocketSound':window.dispatchEvent(new CustomEvent('mp:rocket-sound',{detail:msg}));break;
      case 'gunshot': {window.dispatchEvent(new CustomEvent('mp:gunshot',{detail:msg}));break;}
      case 'gunhit': {const r=remotes.get(msg.id);if(r&&msg.severed&&!r.missing.includes(msg.part))r.missing.push(msg.part);if(r&&msg.dropped){r.tool=null;r.eq=0}window.dispatchEvent(new CustomEvent('mp:gunhit',{detail:msg}));break;}
      case 'gunpickup': {window.dispatchEvent(new CustomEvent('mp:gunpickup',{detail:msg}));break;}
      case 'emote': {const r=remotes.get(msg.id);if(r){r.emote=msg.name;r.emoteStarted=performance.now()/1000}break;}
      case 'notice': window.dispatchEvent(new CustomEvent('mp:notice',{detail:msg}));break;
      case 'announcement': window.dispatchEvent(new CustomEvent('mp:announcement',{detail:msg}));break;
      case 'chat': {msg.text=window.ChatText.clean(msg.text);msg.username=window.ChatText.clean(msg.username,48);if(!msg.text)break;if(msg.id!==mp.selfId&&remotes.has(msg.id)){let b=bubbles.get(msg.id);if(!b){const el=document.createElement('div');el.className='rbx-local-chat-bubble mp-bubble';layer.append(el);b={el,expires:0};bubbles.set(msg.id,b)}window.ChatBubbles.push(b.el,msg.text);b.expires=performance.now()+7000}window.dispatchEvent(new CustomEvent('mp:chat',{detail:msg}));break;}
      case 'colaResult':window.dispatchEvent(new CustomEvent('mp:cola-result',{detail:msg}));break;
      case 'colaSip':{const r=remotes.get(msg.id);if(r){if(msg.drinking){r.colaDrink=true;r.colaDrinkToken=msg.token||null}else if(!msg.token||!r.colaDrinkToken||msg.token===r.colaDrinkToken){r.colaDrink=false;r.colaDrinkToken=null}}break;}
      case 'combat': {const r=remotes.get(msg.id);if(r&&r.dead&&!msg.dead)r.missing=[];if(r)Object.assign(r,{health:msg.health,maxHealth:msg.maxHealth||100,kos:msg.kos||0,wipeouts:msg.wipeouts||0,team:msg.team||null,shieldUntil:msg.shieldUntil,dead:msg.dead,impulse:msg.impulse||null,blastCenter:msg.blastCenter||null});if(msg.id===mp.selfId)mp.selfStats=msg;window.dispatchEvent(new CustomEvent('mp:combat',{detail:msg}));if(window.MapSelection?.combat)emitRoster();break;}
      case 'trowelSnapshot': {for(const wall of msg.walls||[]){trowelHistory.set(wall.wallId,wall);window.dispatchEvent(new CustomEvent('mp:trowel',{detail:wall}));}break;}
      case 'trowel': {for(const [k,w] of trowelHistory)if(w.expiresAt<Date.now())trowelHistory.delete(k);trowelHistory.set(msg.wallId,msg);window.dispatchEvent(new CustomEvent('mp:trowel',{detail:msg}));break;}
      case 'blast': {const now=performance.now()/1000;blasts.push({center:[msg.x,msg.y,msg.z],startedAt:now,expiresAt:now+1.35});window.dispatchEvent(new CustomEvent('mp:blast',{detail:msg}));break;}
      case 'adminToolGranted': window.dispatchEvent(new CustomEvent('mp:admin-tool-granted',{detail:msg})); break;
      case 'swing':
        window.dispatchEvent(new CustomEvent('mp:swing', { detail: msg }));
        break;
    }
  }
  function clearRemotes() {
    for (const id of [...remotes.keys()]) removeRemote(id);boxCache.length=0;blasts.length=0;
  }

  async function connect(opts = {}) {
    if (mp.sessionReplaced) return false;
    if (mp.offlinePreferred && !opts.manualReconnect) {
      enterOffline('Offline mode enabled · Solo local play');
      return false;
    }
    if (typeof WebsimSocket === 'undefined') {
      enterOffline('Multiplayer unavailable — playing in Offline Mode');
      return false;
    }
    detachSocket();
    const myAttempt = ++connectAttemptId;
    connectTimer = setTimeout(() => {
      if (myAttempt !== connectAttemptId || mp.connected || mp.sessionReplaced) return;
      enterOffline(opts.manualReconnect ? 'Server unreachable — staying in Offline Mode' : 'Connection timed out — playing in Offline Mode');
    }, 4000);

    try {
      const sock = await WebsimSocket.joinRoom();
      if (myAttempt !== connectAttemptId || mp.sessionReplaced) {
        try { sock?.close?.(); } catch {}
        return false;
      }
      socket = sock;
      socket.onmessage = (e) => { if (myAttempt === connectAttemptId) onMessage(e.data); };
      socket.onerror = () => {
        if (myAttempt !== connectAttemptId || mp.sessionReplaced || mp.connected) return;
        enterOffline(opts.manualReconnect ? 'Reconnect failed — staying in Offline Mode' : 'WebSocket failed — playing in Offline Mode');
      };
      socket.onreconnect = () => {
        if (myAttempt !== connectAttemptId || mp.sessionReplaced) return;
        enterOffline('Connection interrupted — playing in Offline Mode');
      };
      socket.onclose = (e) => {
        if (myAttempt !== connectAttemptId || mp.sessionReplaced) return;
        const code = e && e.code, reason = String((e && (e.reason || e.message)) || '');
        if (code === 4009 && /replaced|another session/i.test(reason)) {
          markReplaced(reason);
          return;
        }
        enterOffline(closeReasonText(e));
      };
      sendHello();
      return true;
    } catch (err) {
      if (myAttempt !== connectAttemptId || mp.sessionReplaced) return false;
      console.warn('Multiplayer unavailable:', err);
      enterOffline(opts.manualReconnect ? 'Reconnect failed — staying in Offline Mode' : closeReasonText(err));
      return false;
    }
  }

  function reconnect() {
    if (mp.sessionReplaced || mp.reconnecting) return Promise.resolve(false);
    mp.offlinePreferred = false;
    mp.reconnecting = true;
    try {
      sessionStorage.removeItem('roblox-offline-mode');
      const u = new URL(location.href);
      if (u.searchParams.has('offline')) {
        u.searchParams.delete('offline');
        history.replaceState(null, '', u.href);
      }
    } catch {}
    updateOfflineUi();
    window.dispatchEvent(new CustomEvent('mp:offline-changed', {
      detail: { offline: mp.offlineMode, preferred: false, reconnecting: true, reason: mp.offlineReason }
    }));
    return connect({ manualReconnect: true });
  }

  function sameQuantized(a, b) {
    return a.x === b.x && a.y === b.y && a.z === b.z && a.yaw === b.yaw &&
      a.ph === b.ph && a.mv === b.mv && a.eq === b.eq && a.gr === b.gr && a.tool===b.tool && a.fly===b.fly && a.pitch===b.pitch && a.recoveryId===b.recoveryId && a.recoveryDone===b.recoveryDone && JSON.stringify(a.bodyRotation)===JSON.stringify(b.bodyRotation);
  }
  // Called every frame with the local character; sends only when it changed and the throttle allows.
  function sendPose(p) {
    if (!socket || !mp.selfId) return;
    const q = { x: round(p.x), y: round(p.y), z: round(p.z), yaw: round(p.yaw),
      ph: p.ph, mv: p.mv ? 1 : 0, eq: p.eq ? 1 : 0, gr: p.gr === 'Out' ? 'Out' : 'Up',tool:p.tool||null,fly:p.fly?1:0,pitch:round(p.pitch||0),stateSerial:p.stateSerial,recoveryId:p.recoveryId,recoveryDone:!!p.recoveryDone,bodyRotation:p.bodyRotation||null,freeSit:!!p.freeSit };
    if (!forcePose && lastSent && sameQuantized(q, lastSent) && performance.now()-lastSentAt<2000) return;
    const now = performance.now();
    if (lastSent && now - lastSentAt < SEND_MS) return;
    const seq=++poseSequence;window.__poseReconciliation?.note(seq,q);send({type:'pose',...q,seq});forcePose=false;
    lastSent = q;
    lastSentAt = now;
  }
  function flushActionPose(){sendEquip();if(!socket||!lastSent)return;const bp=window.__robloxBackpack?.getState();if(bp&&(lastSent.tool!==bp.equippedTool||lastSent.eq!==+!!bp.equipped)){lastSent={...lastSent,tool:bp.equippedTool,eq:+!!bp.equipped};send({type:'pose',...lastSent,seq:++poseSequence});lastSentAt=performance.now()}}
  function sendSwing(ta) {
    flushActionPose();
    if (socket && mp.selfId) send({ type: 'swing', ta });
  }

  function sendPresence(){if(socket&&mp.selfId)send({type:'presence',away})}
  document.addEventListener('visibilitychange',()=>{away=document.hidden;sendPresence()});
  window.addEventListener('blur',()=>{away=true;sendPresence()});
  window.addEventListener('focus',()=>{away=document.hidden;sendPresence()});
  function sendCombatMode(){if(socket&&mp.selfId&&window.CombatMode?.chosen)send({type:'combatMode',enabled:window.CombatMode.enabled})}
  window.addEventListener('combat-mode:changed',()=>{sendCombatMode();emitRoster()});
  let avatarSentAt=-Infinity,avatarTimer=0,avatarPending=null;
  function sendAvatar(colors,username=null,assets=null,options=null){const noob=typeof options?.noob==='boolean'?options.noob:(colors===null?true:undefined);avatarPending={type:'avatar',colors,username,...(typeof noob==='boolean'?{noob}:{}),...(Array.isArray(assets)&&assets.length?{assets}:{})};clearTimeout(avatarTimer);const delay=Math.max(0,1100-(performance.now()-avatarSentAt));const flush=()=>{if(!socket||!mp.selfId||mp.sessionReplaced||!avatarPending)return;send(avatarPending);avatarPending=null;avatarSentAt=performance.now()};if(delay)avatarTimer=setTimeout(flush,delay);else flush()}
  function sendGunShot(a,b,target,part,kind){if(remotes.get(target)?.weapons===false)window.PVPToast.show();flushActionPose();if(socket&&mp.selfId)send({type:'gunshot',a,b,target,part,kind})}
  function sendGunReload(){if(socket&&mp.selfId)send({type:'gunreload'})}
  function sendDropPickup(key){if(socket&&mp.selfId&&key)send({type:'gunpickup',key})}
  function sendEmote(name){if(socket&&mp.selfId)send({type:'emote',name})}
  function sendChat(text,quick=false){if(performance.now()<chatUntil){window.dispatchEvent(new CustomEvent('mp:chat-cooldown',{detail:{remaining:chatUntil-performance.now()}}));return false}if(socket&&mp.selfId){send({type:'chat',text:window.ChatText.clean(text),quick:!!quick});return true}return false}
  function sendHit(target){if(remotes.get(target)?.weapons===false)window.PVPToast.show();if(socket&&mp.selfId)send({type:'hit',target})}
  function sendRocket(p,target){flushActionPose();const d=[target.x-p[0],target.y-p[1],target.z-p[2]],n=Math.hypot(...d)||1;if(socket&&mp.selfId)send({type:'rocket',x:p[0],y:p[1],z:p[2],dir:d.map(v=>v/n)})}
  function sendEquip(){const bp=window.__robloxBackpack?.getState();if(socket&&mp.selfId&&bp)send({type:'equip',tool:bp.equippedTool,eq:+!!bp.equipped})}
  window.addEventListener('backpack:changed',sendEquip);
  function sendPlaceTool(target){sendEquip();if(socket&&mp.selfId)send({type:'placeTool',target})}
  function sendPlaceRelease(){if(socket&&mp.selfId)send({type:'placeToolRelease'})}
  function sendBuild(m){sendEquip();if(socket&&mp.selfId)send({type:'buildEdit',...m})}
  mp.sendAdminGrantTool=function(tool){if(socket&&mp.selfId&&mp.connected)send({type:'adminGrantTool',tool})};
  function sendBuildGrants(action,target){if(!socket||!mp.selfId||!mp.connected)return false;if(action==='list')send({type:'buildGrants',action});else if(action==='grant')send({type:'buildGrants',action,target});else if(action==='revoke')send({type:'buildGrants',action,grantee:target});else return false;return true}
  setInterval(()=>{if(socket&&mp.selfId&&!mp.sessionReplaced)send({type:'buildSync',revision:buildRevision})},8000);
  function sendOwnership(wallId){if(socket&&mp.selfId)send({type:'physicsTouch',wallId})}
  function sendPhysics(data){if(socket&&mp.selfId)send({type:'physicsState',...data})}
  function sendTrowel(){sendEquip();if(socket&&mp.selfId)send({type:'trowel'})}
  function sendExplosion(p){if(socket&&mp.selfId)send({type:'explosion',x:p[0],y:p[1],z:p[2]})}
  function sendDeath(){if(socket&&mp.selfId)send({type:'death'})}
  function sendHealth(health){if(socket&&mp.selfId)send({type:'health',health})}
  function sendUseCola(reqId){if(!socket||!mp.selfId||mp.sessionReplaced)return false;send({type:'useCola',...(Number.isInteger(reqId)?{reqId}:{})});return true}
  function sendFinishCola(token,reqId){if(!socket||!mp.selfId||mp.sessionReplaced||typeof token!=='string'||!token)return false;send({type:'finishCola',token,...(Number.isInteger(reqId)?{reqId}:{})});return true}
  function sendCancelCola(reqId,token){if(!socket||!mp.selfId||mp.sessionReplaced)return false;send({type:'cancelCola',...(Number.isInteger(reqId)?{reqId}:{}),...(typeof token==='string'?{token}:{})});return true}
  function remoteBoxes(){return boxCache}
  function remoteParts(){const A=window.ArchivedR6Animation,P=window.ArchivedR6Parts,out=[];for(const r of remotes.values()){if(r.dead||!r.view?.m)continue;const root=A.yawFrame(r.rx,r.ry+3,r.rz,r.ryaw+Math.PI);for(const name of window.R6Death.names){if((r.missing||[]).includes(name))continue;const m=A.multiply(root,r.view.m[name]);out.push({id:r.id,name,center:m.slice(12,15),size:P.parts[name].size.slice(),rotation:A.quat(m)})}}return out}
  function blocksPlayer(x,z,y,ox,oz){for(const r of remotes.values())if(r.dead&&r.view?.death)r.view.death.pushPlayer(x,z,y,ox,oz);for(const r of remotes.values()){if(r.dead||y>=r.ry+5-.02||y+5<=r.ry+.02||Math.abs(x-r.rx)>1.8||Math.abs(z-r.rz)>1.8)continue;const d=(x-r.rx)**2+(z-r.rz)**2,old=(ox-r.rx)**2+(oz-r.rz)**2;if(d<3.24&&d<=old)return true}return false}
  function effects(){const now=performance.now()/1000;while(blasts.length&&blasts[0].expiresAt<now)blasts.shift();return blasts}
  // Smooths remote characters toward their latest received pose.
  function update(dt) {
    const k = 1 - Math.exp(-dt * LAG_RATE);boxCache.length=0;
    for (const r of remotes.values()) {
      if (Math.hypot(r.x - r.rx, r.y - r.ry, r.z - r.rz) > 12) { r.rx = r.x; r.ry = r.y; r.rz = r.z; }
      else { r.rx += (r.x - r.rx) * k; r.ry += (r.y - r.ry) * k; r.rz += (r.z - r.rz) * k; }
      if(r.freeSit&&r.bodyRotation){if(!r.renderRotation)r.renderRotation=r.bodyRotation.slice();const dot=r.renderRotation.reduce((s,v,i)=>s+v*r.bodyRotation[i],0),sign=dot<0?-1:1;r.renderRotation=r.renderRotation.map((v,i)=>v+(r.bodyRotation[i]*sign-v)*k);const n=Math.hypot(...r.renderRotation)||1;r.renderRotation=r.renderRotation.map(v=>v/n)}else r.renderRotation=null;
      r.ryaw += wrap(r.yaw - r.ryaw) * k;
      if(!r.dead){if(!r.box)r.box={id:r.id,center:[0,0,0],size:[2.4,5,2.4]};r.box.center[0]=r.rx;r.box.center[1]=r.ry+2.5;r.box.center[2]=r.rz;boxCache.push(r.box)} r.rpitch += (r.pitch - r.rpitch) * k;
    }
  }

  // Positions a name tag above each remote character (vp is the column-major view-projection matrix).
  function updateAfk(el,until){let badge=el.querySelector('.mp-afk');if(!badge){badge=document.createElement('span');badge.className='mp-afk';const title=document.createElement('strong'),timer=document.createElement('small');title.textContent='AFK';badge.append(title,timer);el.append(badge)}badge.hidden=!until;if(until){const seconds=Math.max(0,Math.ceil((until-Date.now()-serverOffset)/1000)),text='Will be kicked in '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(badge.lastChild.textContent!==text)badge.lastChild.textContent=text}}
  let selfAfkTag;
  function drawLabels(vp, heightOffset, localPlayer, localHead) {
    const now=performance.now(),refresh=now-labelsAt>=250;if(refresh)labelsAt=now;
    const c = gameCanvas;
    if (!c) return;
    const attach=window.BillboardAttachments;
    if(!selfAfkTag){selfAfkTag=document.createElement('div');selfAfkTag.className='rbx-dummy-overhead mp-tag';layer.append(selfAfkTag)}if(refresh)updateAfk(selfAfkTag,localAfkUntil);if(localHead)attach.frame(selfAfkTag,vp,localHead,!!localAfkUntil&&mp.connected,1.2);
    for (const r of remotes.values()) {
      let el = tags.get(r.id);
      if (!el) {
        el=document.createElement('div');el.className='rbx-dummy-overhead mp-tag';const name=document.createElement('span'),health=document.createElement('span'),fill=document.createElement('span');name.className='rbx-dummy-name';health.className='rbx-dummy-health';health.setAttribute('role','progressbar');health.setAttribute('aria-valuemin','0');health.setAttribute('aria-valuemax','100');fill.className='rbx-dummy-health-fill';health.append(fill);el.append(name,health);layer.append(el);tags.set(r.id,el);
      }
      if(refresh||!el.dataset.hp){updateAfk(el,r.afkUntil);let peaceful=el.querySelector('.mp-peaceful');if(!peaceful){peaceful=document.createElement('span');peaceful.className='mp-peaceful';peaceful.textContent='PVP OFF';el.append(peaceful)}peaceful.hidden=!window.CombatMode?.enabled||r.weapons;if(el.firstChild.textContent!==r.username)el.firstChild.textContent=r.username;const hp=Math.max(0,Math.min(100,Number(r.health??100)/(r.maxHealth||100)*100)),bar=el.children[1],fill=bar.firstChild;if(el.dataset.hp!==String(hp)){el.dataset.hp=String(hp);bar.hidden=hp>=100;bar.setAttribute('aria-valuenow',String(hp));fill.style.width=hp+'%';const color=window.RobloxHealthResearch.colorForPercent(hp/100);fill.style.backgroundColor=`rgb(${color.map(v=>Math.round(v*255)).join(',')})`;}
      }const head=r.dead&&r.view?.death?.getParts().find(p=>p.name==='Head');
      const bubble=bubbles.get(r.id);if(bubble&&bubble.expires<=now){bubble.el.remove();bubbles.delete(r.id)}
      const active=!!r.view&&r.visible&&(!r.dead||!!head);
      if(head){attach.point(el,vp,head.center[0],head.center[1]+1.05,head.center[2],active);if(bubble)attach.point(bubble.el,vp,head.center[0],head.center[1]+1.05,head.center[2],active&&bubble.expires>now,-12)}
      else if(r.labelHead){attach.frame(el,vp,r.labelHead,active,1.2);if(bubble)attach.frame(bubble.el,vp,r.labelHead,active&&bubble.expires>now,1.2,-12)}
      else{el.hidden=true;if(bubble)bubble.el.hidden=true}


    }
  }

  connect();
})();
