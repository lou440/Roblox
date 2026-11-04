/* Browser touch-stick adapter; it is not Roblox's original mobile controller. */
(function(root){'use strict';
 function create(stick,onGrab){const base=stick.querySelector('.touch-stick-base'),knob=stick.querySelector('.touch-stick-knob'),move={side:0,forward:0};let id=null,origin=null;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));function clear(){move.side=move.forward=0;knob.style.transform='translate(0,0)';id=null;origin=null;base.style.left=base.style.top='50%'}
  stick.addEventListener('pointerdown',e=>{if(id!==null||root.__hudInteraction?.blocksGameplay(e.target))return;const r=stick.getBoundingClientRect();origin={x:e.clientX,y:e.clientY};base.style.left=clamp(e.clientX-r.left,42,r.width-42)+'px';base.style.top=clamp(e.clientY-r.top,42,r.height-42)+'px';id=e.pointerId;stick.setPointerCapture(id);onGrab();e.preventDefault()});
  stick.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;let x=e.clientX-origin.x,y=e.clientY-origin.y,n=Math.hypot(x,y),limit=48;if(n>limit){x*=limit/n;y*=limit/n}move.side=x/limit;move.forward=-y/limit;if(Math.hypot(move.side,move.forward)<.1)move.side=move.forward=0;knob.style.transform=`translate(${x}px,${y}px)`;e.preventDefault()});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,e=>{if(e.pointerId===id)clear()});return Object.assign(move,{clear});
 }
 root.MobileInput=Object.freeze({create});
})(globalThis);
