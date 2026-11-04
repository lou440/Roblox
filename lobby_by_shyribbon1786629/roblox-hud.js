/* Partial HUD research integration. The Chrome-branch selection and this DOM
 * adapter are assumptions, not recovered target runtime state. Health rules
 * follow matching-build archived CoreScripts; the two source images are the
 * hash-verified files from the owner's directory. The rest is not the HUD. */
(() => {
  'use strict';
  const health = document.getElementById('rbx-healthbar');
  const api = window.RobloxHealthResearch;
  if (!health || !api) return;
  const chatIcon=document.getElementById('rbx-chat-icon');
  if(chatIcon && window.RobloxChatVisualResearch)chatIcon.textContent=window.RobloxChatVisualResearch.inactiveMigration.name;
  const state = {health:100, maxHealth:100, isDead:false, enabled:true};
  const images = {base:new Image(), fill:new Image()};
  const loaded = {base:false, fill:false};
  const layer = document.createElement('canvas');
  let drawError = null;

  // ImageLabel's SliceCenter is Rect.new(8,8,9,9) on 17x16 images.
  // For destinations smaller than both borders this adapter scales borders
  // proportionally; the engine's exact tiny-destination rasterizer is unverified.
  function drawNine(ctx, image, width, height) {
    const sx=[0,8,9,17], sy=[0,8,9,16];
    const rx=Math.min(1,width/16), ry=Math.min(1,height/15);
    const dx=[0,8*rx,width-8*rx,width], dy=[0,8*ry,height-7*ry,height];
    for(let y=0;y<3;y++) for(let x=0;x<3;x++) {
      const dw=dx[x+1]-dx[x], dh=dy[y+1]-dy[y];
      if(dw>0 && dh>0) ctx.drawImage(image,sx[x],sy[y],sx[x+1]-sx[x],sy[y+1]-sy[y],dx[x],dy[y],dw,dh);
    }
  }

  function describe() {
    return api.describeHealth({...state,viewportWidth:window.innerWidth,chrome:true,tenFoot:false});
  }
  function render() {
    const m=describe();
    health.hidden=!m.visible;
    health.setAttribute('aria-valuenow',String(state.health));
    health.setAttribute('aria-valuemax',String(state.maxHealth));
    health.setAttribute('aria-label',`Health ${state.health} of ${state.maxHealth}`);
    const [w,h]=m.size, dpr=Math.min(window.devicePixelRatio||1,2);
    health.style.width=w+'px'; health.style.height=h+'px';
    health.width=Math.max(1,Math.round(w*dpr)); health.height=Math.max(1,Math.round(h*dpr));
    if(!m.visible || !loaded.base || !loaded.fill) return;
    try {
      const ctx=health.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);drawNine(ctx,images.base,w,h);
      const fw=w*m.percent;
      if(fw>0) {
        layer.width=health.width;layer.height=health.height;
        const c=layer.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
        drawNine(c,images.fill,fw,h);
        // The source fill image is white wherever alpha is nonzero, so
        // source-in gives the same tint multiplication for its RGB channels.
        c.globalCompositeOperation='source-in';
        c.fillStyle=`rgb(${m.color.map(v=>Math.round(v*255)).join(',')})`;c.fillRect(0,0,fw,h);
        c.globalCompositeOperation='source-over';ctx.drawImage(layer,0,0,w,h);
      }
      drawError=null;
    } catch(e) { drawError=String(e); console.error('Health-bar drawing failed:',e); }
  }
  images.base.onload=()=>{loaded.base=true;render();};
  images.fill.onload=()=>{loaded.fill=true;render();};
  images.base.onerror=()=>{drawError='health bar base image failed to load';};
  images.fill.onerror=()=>{drawError='health bar fill image failed to load';};
  images.base.src='assets/HealthBarBaseTV.png';
  images.fill.src='assets/HealthBarTV.png';
  window.addEventListener('resize',render);
  window.__robloxHudResearch=Object.freeze({
    setHealth(value,maximum=100,isDead=false,enabled=true) {
      if(!Number.isFinite(value)||!Number.isFinite(maximum))throw new RangeError('finite health required');
      Object.assign(state,{health:value,maxHealth:maximum,isDead:!!isDead,enabled:!!enabled});render();
    },
    getState() { return {...state,layout:describe(),texturesLoaded:{...loaded},drawError,
      branch:'Chrome demonstration; target flag not recovered',implementation:'partial'}; }
  });
  render();
})();
