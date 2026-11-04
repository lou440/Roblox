(()=>{'use strict';window.CharacterCamera={create(canvas,camera,classic){let first=false,lockedByFirst=false,blocked=false;
 const settings=()=>window.__localSettings?.getState()||{},isFirst=()=>camera.distance<classic.source.firstPersonThreshold;
 function request(){if(!canvas.requestPointerLock||document.pointerLockElement===canvas||blocked)return;try{const p=canvas.requestPointerLock();p?.catch?.(()=>{blocked=true})}catch{blocked=true}}
 function refresh(gesture=false){const next=isFirst();if(next!==first){first=next;blocked=false;if(first){lockedByFirst=!settings().shiftLocked;if(gesture)request()}else{if(document.pointerLockElement===canvas&&lockedByFirst)document.exitPointerLock();lockedByFirst=false}}if(first&&gesture){blocked=false;request()}return first}
 document.addEventListener('pointerlockchange',()=>{if(first&&document.pointerLockElement!==canvas)blocked=true});
 return {refresh,zoom(delta){camera.distance=classic.zoom(camera.distance,delta);refresh(true)},firstPerson:isFirst,aligned:()=>isFirst()||!!settings().shiftLocked,face(p){if((isFirst()||settings().shiftLocked)&&!p.seated&&!p.climbing)p.yaw=camera.yaw-Math.PI},opacity(){const d=camera.distance;if(isFirst())return 0;const t=Math.max(0,Math.min(1,(d-classic.source.firstPersonThreshold)/2));return t*t*(3-2*t)}}
 }}})();
