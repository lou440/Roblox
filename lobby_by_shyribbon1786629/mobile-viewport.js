/* Separate the stable game viewport from the keyboard's visual viewport. */
(()=>{'use strict';if(!matchMedia('(pointer:coarse)').matches)return;
 const root=document.documentElement,vv=window.visualViewport;let stableHeight=innerHeight,pending=0,settlingUntil=0;
 const editing=()=>document.activeElement?.matches('input:not([type=range]):not([type=file]),textarea,[contenteditable=true]');
 function update(){pending=0;const focused=editing(),height=vv?.height||innerHeight,top=vv?.offsetTop||0;
 if(!focused&&performance.now()>settlingUntil)stableHeight=innerHeight;
 root.style.setProperty('--game-height',stableHeight+'px');root.style.setProperty('--visible-height',height+'px');root.style.setProperty('--visible-top',top+'px');
 document.body.classList.toggle('keyboard-open',!!focused);}
 function schedule(){if(!pending)pending=requestAnimationFrame(update)}
 document.addEventListener('focusin',e=>{if(!(window.__chatSlashOpening&&e.target?.id==='rbx-chat-input'))window.dispatchEvent(new Event('hud:control-suspend'));schedule()});
 document.addEventListener('focusout',()=>{settlingUntil=performance.now()+500;schedule();setTimeout(()=>{if(!editing()){window.scrollTo(0,0);schedule()}},550)});
 vv?.addEventListener('resize',schedule);vv?.addEventListener('scroll',schedule);window.addEventListener('resize',schedule);
 window.addEventListener('orientationchange',()=>setTimeout(()=>{stableHeight=innerHeight;schedule()},350));update();
})();