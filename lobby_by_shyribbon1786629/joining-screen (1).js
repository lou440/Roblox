/* Joining progress is driven by completed resource/GPU/room/avatar work. */
(()=>{'use strict';
const overlay=document.getElementById('joining-screen'),status=document.getElementById('joining-status'),bar=document.getElementById('joining-progress'),percent=document.getElementById('joining-percent'),world=document.querySelector('.world');
const weights={files:14,shaders:18,textures:18,fonts:5,local:10,room:5,avatars:25,frame:5},progress=Object.fromEntries(Object.keys(weights).map(k=>[k,0]));let started=false,active=true,fatal=false,lastPercent=0,resolveReady,resolveGraphics;
const ready=new Promise(r=>resolveReady=r),graphics=new Promise(r=>resolveGraphics=r),images=[];let imageDone=0,localReady=Promise.resolve(),roomReady=Promise.resolve({online:false}),shaderTimer,resolveOfflineSkip;
const offlineSkip=new Promise(r=>resolveOfflineSkip=r);
world.inert=true;const screenStarted=performance.now();
const cover=document.getElementById('joining-icon'),musicChoice=document.getElementById('joining-music-toggle'),place=window.MapSelection?.entry;
if(place){document.getElementById('joining-title').textContent=place.title||'Lobby';const thumb=String(place.thumb||'img/lobby.jpg');if(/^img\/[a-z0-9_.-]+$/i.test(thumb)){cover.src=thumb;overlay.style.setProperty('--joining-image','url("'+thumb+'")')}}
const offlineBtn=document.createElement('button');
offlineBtn.id='joining-offline-btn';
offlineBtn.type='button';
offlineBtn.textContent='Play Offline';
offlineBtn.style.cssText='margin-left:auto;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(15,23,42,.65);color:#f8fafc;font:600 12px/1 system-ui,sans-serif;cursor:pointer;pointer-events:auto';
document.querySelector('#joining-screen .joining-bottom')?.appendChild(offlineBtn);
let skippedToOffline=false;
function playOfflineNow(){
 if(!active||fatal)return;
 skippedToOffline=true;
 status.textContent='Entering offline solo mode…';
 offlineBtn.disabled=true;
 offlineBtn.textContent='Offline Mode';
 window.__multiplayer?.enterOffline?.('Playing in Offline Mode · Solo local play');
 resolveOfflineSkip({online:false,offline:true});
}
offlineBtn.addEventListener('click',playOfflineNow);
window.addEventListener('mp:offline-changed',e=>{if(e.detail?.offline){status.textContent='Entering offline solo mode…';offlineBtn.textContent='Offline Mode';setTimeout(()=>resolveOfflineSkip({online:false,offline:true}),300)}});
try{musicChoice.checked=localStorage.getItem('roblox-music-enabled')!=='false'}catch{}
musicChoice.addEventListener('change',()=>{try{localStorage.setItem('roblox-music-enabled',String(musicChoice.checked))}catch{}window.__music?.setEnabled?.(musicChoice.checked)});
function update(label){if(!active||fatal)return;const value=Math.min(100,Math.round(Object.entries(weights).reduce((sum,[k,w])=>sum+w*progress[k],0)));lastPercent=Math.max(lastPercent,value);bar.value=lastPercent;percent.textContent=lastPercent+'%';}
function complete(group,label){progress[group]=1;update(label)}
function bounded(promise,ms){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Loading timed out')),ms);Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)})})}
function fail(message){if(!active)return;fatal=true;clearTimeout(shaderTimer);overlay.classList.add('join-failed');document.getElementById('joining-title').textContent='Unable to join';status.textContent=String(message);bar.removeAttribute('value');}
const ownScript=s=>{const raw=s.getAttribute('src')||'';return /\.jsx?(\?|$)/.test(raw)&&!/^(https?:|\/\/|\/)/.test(raw)};const scripts=[...document.querySelectorAll('script[src]')].filter(s=>ownScript(s)&&!s.src.endsWith('/joining-screen.js')),loaded=new Set();
document.addEventListener('load',e=>{if(e.target.tagName==='SCRIPT'&&scripts.includes(e.target)){loaded.add(e.target);progress.files=loaded.size/Math.max(1,scripts.length);update('Loading game files · '+loaded.size+' / '+scripts.length)}},true);
document.addEventListener('error',async e=>{const script=e.target;if(script.tagName!=='SCRIPT'||!scripts.includes(script))return;const url=new URL(script.src,location.href),file=url.pathname.split('/').pop();fail(file+' could not load. Checking the response…');try{const r=await fetch(url.href,{cache:'no-store'}),type=r.headers.get('content-type')||'';fail(file+': '+(!r.ok?'HTTP '+r.status+' '+r.statusText:!/(javascript|ecmascript)/i.test(type)?'Invalid script content type: '+(type||'missing'):'The file is reachable, but the browser refused to execute it. Check the console for CSP or syntax details.')+' Refresh to retry.')}catch(err){fail(file+': '+(err.message||'Network request failed')+'. Check your connection and refresh.')}},true);
window.addEventListener('error',e=>{if(e.message&&e.filename){const file=e.filename.split('/').pop();fail(file+(e.lineno?':'+e.lineno+':'+e.colno:'')+' — '+e.message)}});
window.addEventListener('load',()=>complete('files'));
function trackImage(label,img){const p=new Promise(resolve=>{let settled=false;const done=()=>{if(settled)return;settled=true;img.removeEventListener('load',done);img.removeEventListener('error',done);imageDone++;progress.textures=imageDone/Math.max(1,images.length);update('Loading textures · '+imageDone+' / '+images.length);resolve()};img.addEventListener('load',done);img.addEventListener('error',done);if(img.src&&img.complete)queueMicrotask(done)});images.push(p);return p}
window.JoiningScreen={get active(){return active},ready,trackImage,playOffline:playOfflineNow,cancel(){if(!active)return;active=false;fatal=true;clearTimeout(shaderTimer);overlay.hidden=true;world.inert=false;resolveReady()},graphicsStart(){clearTimeout(shaderTimer);shaderTimer=setTimeout(()=>fail('Graphics initialization did not finish. Please refresh to retry.'),120000)},graphicsReady(){clearTimeout(shaderTimer);complete('shaders','Shaders compiled');resolveGraphics()},trackLocal(p){if(!started)localReady=Promise.resolve(p)},trackRoom(p){if(!started)roomReady=Promise.resolve(p)},fail,getState:()=>({active,fatal,skippedToOffline,percent:lastPercent,progress:{...progress},textures:{loaded:imageDone,total:images.length}})};
// Prevent hidden gameplay or startup choices receiving keyboard input while joining, without blocking active text inputs.
window.addEventListener('keydown',e=>{if(!active)return;if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation()},true);
// Only Roblox-style names and this site's character blob URLs are fetched; anything else a peer sends uses the default avatar.
const trustedAvatar=v=>/^[A-Za-z0-9_]{1,20}$/.test(v)||/^https:\/\/api\.websim\.com\/blobs\/[A-Za-z0-9_./-]{1,200}$/.test(v);
async function avatars(){
 const renderer=window.__avatarRenderer,seen=new Set(),pending=new Set(),pinned=new Set();let done=0,failed=0,deadline=Date.now()+120000;
 if(!renderer||(window.__multiplayer?.offlineMode&&!(window.__multiplayer?.remotes?.size))){complete('avatars');return}
 const collect=()=>{for(const r of window.__multiplayer?.remotes?.values()||[]){const raw=String(r.avatarUrl||r.avatarName||'').trim(),name=trustedAvatar(raw)?raw:'',key=name.toLowerCase();if(!name||seen.has(key))continue;seen.add(key);pinned.add(key);renderer.pinPreload(pinned);const p=bounded(renderer.preload(name),Math.max(1,deadline-Date.now())).then(result=>{if(result.status!=='ready')failed++},()=>{failed++}).finally(()=>{done++;pending.delete(p);progress.avatars=done/Math.max(1,seen.size);update('Loading avatars · '+done+' / '+seen.size)});pending.add(p)}
  if(!seen.size)progress.avatars=0;update('Loading avatars · '+done+' / '+seen.size)
 };
 collect();while(Date.now()<deadline){if(window.__multiplayer?.offlineMode&&!pending.size)break;if(pending.size){await Promise.race([...pending,new Promise(r=>setTimeout(r,250))]);collect();continue}await new Promise(r=>setTimeout(r,250));const count=seen.size;collect();if(seen.size===count)break}
 // Timed-out avatars resolve to defaults rather than trapping the player in a loader.
 if(pending.size)await Promise.allSettled([...pending]);renderer.pinPreload([]);complete('avatars',failed?'Ready · '+failed+' unavailable avatar'+(failed===1?'':'s')+' using defaults':'Ready');
}
async function start(){started=true;
 
 try{
  const fonts=(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>complete('fonts'));
  await graphics;clearTimeout(shaderTimer);if(fatal)return;
  complete('files');
  const textures=Promise.all([Promise.race([Promise.all(images),offlineSkip])]).then(()=>complete('textures'));
  const saved=Promise.race([bounded(localReady,12000),offlineSkip]).catch(()=>{}).then(()=>complete('local','Your avatar is ready'));
  const room=Promise.race([bounded(roomReady,4500),offlineSkip]).catch(()=>({online:false,offline:true})).then(info=>{
   if(!info?.online&&!window.__multiplayer?.connected&&!window.__multiplayer?.offlineMode&&!window.__multiplayer?.sessionReplaced){
    window.__multiplayer?.enterOffline?.('WebSocket timed out — playing in Offline Mode');
   }
   complete('room',info?.online?'Connected to room':'Offline solo mode ready');
  });
  await Promise.all([fonts,textures,saved,room]);if(fatal)return;
  await avatars();if(fatal)return;
  window.__warmGraphics?.();complete('shaders');
  // Flush the prepared frame to the display before uncovering the game.
  await new Promise(requestAnimationFrame);if(fatal)return;complete('frame');
  const minHold = skippedToOffline || window.__multiplayer?.offlineMode ? 220 : 1200;
  await new Promise(r=>setTimeout(r,Math.max(0,minHold-(performance.now()-screenStarted))));if(fatal)return;
  for(const key of Object.keys(progress))progress[key]=1;update();
  overlay.classList.add('is-ready');setTimeout(()=>{active=false;overlay.hidden=true;world.inert=false;resolveReady();window.dispatchEvent(new Event('joining:ready'))},180);
 }catch(e){fail(e.message||'The game could not be prepared.')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else queueMicrotask(start);
})();
