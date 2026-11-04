/* Browser right-drag pointer lock. A fixed overlay replaces the OS cursor while
 * the browser hides it under Pointer Lock; this is not Roblox engine code. */
(function(root){'use strict';
 const arrow='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2218%22 height=%2225%22 viewBox=%220 0 18 25%22%3E%3Cpath d=%22M1 1 L1 20 L5.4 15.8 L8.8 23.3 L12 21.9 L8.6 14.8 L15 14.8 Z%22 fill=%22white%22 stroke=%22black%22 stroke-width=%221.4%22/%3E%3C/svg%3E',defaultCursor=`url("${arrow}") 0 0, default`;
 function create(canvas){let held=false,rightLook=false,spot={x:0,y:0};const cursor=document.createElement('div');cursor.id='rbx-locked-cursor';cursor.hidden=true;Object.assign(cursor.style,{position:'fixed',zIndex:'2147483647',pointerEvents:'none',backgroundRepeat:'no-repeat',backgroundSize:'contain'});document.body.append(cursor);
  function hide(){cursor.hidden=true;cursor.replaceChildren();cursor.style.backgroundImage=''}
  function show(){const css=canvas.style.cursor||defaultCursor,m=css.match(/^url\(["']?(.*?)["']?\)\s+(\d+)\s+(\d+)/);cursor.hidden=false;if(m){const normal=m[1]===arrow;cursor.style.width=normal?'18px':'80px';cursor.style.height=normal?'25px':'80px';cursor.style.left=(spot.x-Number(m[2]))+'px';cursor.style.top=(spot.y-Number(m[3]))+'px';cursor.style.backgroundImage=`url("${m[1]}")`;cursor.replaceChildren()}}
  function release(){held=false;hide();if(rightLook&&document.pointerLockElement===canvas){rightLook=false;document.exitPointerLock()}}
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==2||!canvas.requestPointerLock||(document.pointerLockElement===canvas&&!rightLook))return;spot={x:e.clientX,y:e.clientY};if(document.pointerLockElement===canvas){held=true;show();return}held=rightLook=true;try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{held=rightLook=false;hide()})}catch(_){held=rightLook=false;hide()}});
  if(!canvas.style.cursor)canvas.style.cursor=defaultCursor;new MutationObserver(()=>{if(!canvas.style.cursor){canvas.style.cursor=defaultCursor;return}if(held&&document.pointerLockElement===canvas)show()}).observe(canvas,{attributes:true,attributeFilter:['style']});
  root.addEventListener('mouseup',e=>{if(e.button===2)release()});root.addEventListener('pointercancel',release);root.addEventListener('blur',release);
  document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement){rightLook=false;held=false;hide()}else if(rightLook&&!held&&document.pointerLockElement===canvas){hide();document.exitPointerLock()}else if(rightLook&&held&&document.pointerLockElement===canvas)show()});
  document.addEventListener('pointerlockerror',()=>{held=rightLook=false;hide()});
  return Object.freeze({isRightLook:()=>rightLook,release});
 }
 root.RightCameraLock=Object.freeze({create});
})(globalThis);
