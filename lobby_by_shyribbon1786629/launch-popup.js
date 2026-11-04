/* Show only the PvP mode choice. Avatar import lives in the Avatar Editor. */
(()=>{'use strict';
const popup=document.getElementById('avatar-welcome'),world=document.querySelector('.world'),modeStep=document.getElementById('welcome-mode-step');
let shown=false;
const overlayOpen=()=>!!(window.__homeOpen||window.AvatarStudio?.active||window.CharacterSwitcher?.active||(document.getElementById('home-screen')&&!document.getElementById('home-screen').hidden));
function dismiss(){
 if(!window.CombatMode.chosen)return;
 shown=false;popup.hidden=true;world.inert=false;
 if(!overlayOpen())document.getElementById('game').focus({preventScroll:true});
}
function choose(enabled){window.CombatMode.choose(enabled);dismiss()}
function presentWhenInWorld(){
 if(window.__multiplayer?.sessionReplaced)return;
 if(overlayOpen()){
  const wait=setInterval(()=>{
   if(window.__multiplayer?.sessionReplaced){clearInterval(wait);return}
   if(!overlayOpen()){clearInterval(wait);presentWhenInWorld()}
  },200);
  return;
 }
 if(window.CombatMode.chosen){dismiss();return}
 modeStep.hidden=false;shown=true;popup.hidden=false;world.inert=true;
 window.dispatchEvent(new Event('hud:control-suspend'));
 document.getElementById('welcome-weapons').focus({preventScroll:true});
}
window.addEventListener('mp:session-replaced',()=>{shown=false;popup.hidden=true;world.inert=false});
document.getElementById('welcome-weapons').addEventListener('click',()=>choose(true));
document.getElementById('welcome-peaceful').addEventListener('click',()=>choose(false));
window.addEventListener('keydown',e=>{
 if(!shown||overlayOpen())return;
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();return}
 if(e.key==='Tab'){
  const list=[...modeStep.querySelectorAll('button')].filter(el=>el.getClientRects().length&&!el.disabled),first=list[0],last=list[list.length-1];
  if(first&&last&&e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(first&&last&&!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
 e.stopPropagation();
},true);
popup.hidden=true;world.inert=true;(window.JoiningScreen?.ready||Promise.resolve()).then(presentWhenInWorld);
})();
