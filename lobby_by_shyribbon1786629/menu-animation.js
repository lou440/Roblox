/* Legacy SettingsHub slide parameters from the owner-matched 1145 patch.
 * Browser animation/compositing is an adapter; the live experiment branch and
 * the original engine's tween implementation are not proven. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RobloxMenuAnimation=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const source=Object.freeze({patch:'owner-matched WebClient 1145',branch:'legacy SettingsHub, runtime experiment unknown',settingsSha256:'3537bd2916a8abd384d831452fb37e99fdbb7e1c41b0b8b438e3c8b9c0a38ca7',themeSha256:'a0cc389c4b12a3dbb6a59dad1e1521d7180ea16a9c982bf323a105f9b56142be',constantsSha256:'675741df9eed4cb15d91e38f524e7ffe604a1c5ea3819cc028e6bbef6d74b67a',inactiveYOffset:36,openSeconds:.5,closeSeconds:.4,reducedSeconds:.25,openEasing:'Quart InOut',closeEasing:'Quart Out'});
 const clamp=x=>Math.max(0,Math.min(1,x));
 const inOutQuart=x=>{const t=clamp(x);return t<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2};
 const outQuart=x=>1-Math.pow(1-clamp(x),4);
 const outQuad=x=>1-Math.pow(1-clamp(x),2);
 function create(overlay,dialog){
  let fraction=1,alpha=0,open=false,phase='closed',raf=0,reduced=false;
  const canTranslate=typeof CSS!=='undefined'&&CSS.supports&&CSS.supports('translate','0 1px');
  const apply=()=>{
   const px=reduced?0:fraction*(window.innerHeight+source.inactiveYOffset);
   if(canTranslate)dialog.style.translate=`0 ${px.toFixed(3)}px`;else dialog.style.marginTop=px.toFixed(3)+'px';
   dialog.style.opacity=reduced?String(alpha):'';overlay.style.backgroundColor=`rgba(0,0,0,${(.5*alpha).toFixed(5)})`;
  };
  function finish(target){fraction=target?0:1;alpha=target?1:0;phase=target?'open':'closed';apply();if(!target){overlay.hidden=true;dialog.style.opacity='';overlay.style.backgroundColor='';if(canTranslate)dialog.style.translate='';else dialog.style.marginTop=''}raf=0}
  function setOpen(value){
   const target=!!value;open=target;if(raf)cancelAnimationFrame(raf);raf=0;
   reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
   overlay.hidden=false;overlay.inert=!target;overlay.style.pointerEvents=target?'':'none';overlay.setAttribute('aria-hidden',String(!target));
   phase=target?'opening':'closing';const from=fraction,fromAlpha=alpha,to=target?0:1,toAlpha=target?1:0,duration=(reduced?source.reducedSeconds:target?source.openSeconds:source.closeSeconds)*1000,start=performance.now();
   apply();
   function tick(now){const t=clamp((now-start)/duration),ease=target?inOutQuart(t):outQuart(t),backgroundEase=target?outQuad(t):outQuart(t);fraction=from+(to-from)*ease;alpha=fromAlpha+(toAlpha-fromAlpha)*backgroundEase;apply();if(t<1)raf=requestAnimationFrame(tick);else finish(target)}
   raf=requestAnimationFrame(tick);
  }
  return Object.freeze({setOpen,getState:()=>({open,phase,fraction,alpha,reduced,source:source.branch})});
 }
 return Object.freeze({source,inOutQuart,outQuart,outQuad,create});
});
