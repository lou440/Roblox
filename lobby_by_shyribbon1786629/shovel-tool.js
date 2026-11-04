/* Shovel tool: dig ground holes in Free Build maps. Mirrors the BuildTools
 * controller shape (create(context) -> {activate,draw,getState}) so game.js
 * integration is one dispatch line. Ground state and geometry live in
 * ground-edits.js; server-authoritative digs ride the existing buildEdit
 * message with action 'groundDig' (validated + broadcast by the server patch).
 */
(()=>{'use strict';
window.ShovelTool={create(context){
 const G=window.GroundEdits, T=window.ClassicToolsSim, canvas=context().canvas;
 const world=document.querySelector('.world');
 const notice=document.createElement('div');
 notice.className='build-notice'; notice.hidden=true; notice.setAttribute('role','status');
 if(world)world.append(notice);
 let cursor=null, hover=null, noticeUntil=0, lastHover=0, lastSend=0, cooldownUntil=0;
 const COOLDOWN=0.45;

 const diggableMap=()=>typeof window.MapSelection?.id==='string'&&window.MapSelection.id.startsWith('freebuild-');
 const equipped=()=>window.__robloxBackpack?.getState().equippedTool==='shovel';

 canvas.addEventListener('pointermove',e=>{cursor={x:e.clientX,y:e.clientY};lastHover=0});
 canvas.addEventListener('pointerleave',()=>{cursor=null;hover=null});
 function message(text){notice.textContent=text;notice.hidden=false;noticeUntil=performance.now()+2800}
 window.addEventListener('mp:build-error',e=>{if(equipped()&&e.detail?.error)message(e.detail.error)});
 window.addEventListener('backpack:changed',()=>{if(!equipped()){hover=null}});

 function aim(x,y){
  const c=context(), rect=canvas.getBoundingClientRect();
  if(c.centered?.()||document.pointerLockElement===canvas||!Number.isFinite(x)||!Number.isFinite(y)){x=rect.left+rect.width/2;y=rect.top+rect.height/2}
  const p=T.aimTarget(x,y,rect,c.eye,c.camera,null,c.obstacles,c.tools.getState(performance.now()/1000).walls,c.mp.remoteBoxes());
  return {p,screen:{x,y}};
 }
 function target(x,y){
  const c=context(), {p,screen}=aim(x,y);
  if(!diggableMap())return {diggable:false,screen};
  if(p.y>0.3||p.y<G.getState().bedrock-1)return {diggable:false,screen,reason:'Aim at the ground to dig.'};
  const col=G.columnAt(p.x,p.z);
  const inRange=Math.hypot(p.x-c.player.x,p.y-(c.player.y+2.5),p.z-c.player.z)<=32;
  return {diggable:true,col,inRange,screen,p};
 }
 function update(force=false,x=cursor?.x,y=cursor?.y){
  const now=performance.now();
  if(noticeUntil&&now>noticeUntil){notice.hidden=true;noticeUntil=0}
  if(!equipped()||window.__hudInteraction?.getState().menuOpen||window.JoiningScreen?.active){hover=null;return}
  if(!force&&now-lastHover<60)return;
  lastHover=now;
  hover=target(x,y);
 }
 function activate(x,y){
  update(true,x,y);
  const c=context();
  if(!diggableMap())return true;
  if(!hover||!hover.diggable){if(hover?.reason)message(hover.reason);return true}
  if(!hover.inRange){message('Move within 32 studs of where you are digging.');return true}
  if(performance.now()<cooldownUntil)return true;
  if(!c.mp.connected&&!c.mp.offlineMode){message('Sign in and join the room to dig.');return true}
  const {gx,gz}=hover.col;
  if(c.mp.connected){
   if(performance.now()-lastSend<150)return true;
   lastSend=performance.now();
   if(c.mp.sendBuild({action:'groundDig',gx,gz})===false)message('Dig request could not be confirmed. Check your connection and try again.');
  }else if(c.mp.offlineMode){
   const res=G.dig(gx,gz,{persist:true});
   if(res.ok)message(res.h<=G.getState().bedrock?'You hit the bottom of the world.':'Dug 2 studs.');
   else if(res.notice)message(res.notice);
  }
  cooldownUntil=performance.now()+COOLDOWN*1000;
  return true;
 }

 let lineProgram,lineBuffer,linePos,lineVP,lineColor;
 function drawLines(gl,boxes,vp,restore,pos,normal,color){
  if(!lineProgram){
   const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(gl,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
   lineProgram=gl.createProgram();
   gl.attachShader(lineProgram,shader(gl.VERTEX_SHADER,'attribute vec3 p;uniform mat4 vp;void main(){gl_Position=vp*vec4(p,1.0);}'));
   gl.attachShader(lineProgram,shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform vec4 color;void main(){gl_FragColor=color;}'));
   gl.linkProgram(lineProgram);linePos=gl.getAttribLocation(lineProgram,'p');lineVP=gl.getUniformLocation(lineProgram,'vp');lineColor=gl.getUniformLocation(lineProgram,'color');lineBuffer=gl.createBuffer();
  }
  const data=[];
  for(const b of boxes){
   const corners=Array.from({length:8},(_,i)=>b.center.map((n,k)=>n+((i>>k)&1?1:-1)*(b.size[k]/2+.035)));
   for(let i=0;i<8;i++)for(let k=0;k<3;k++)if(!(i&(1<<k)))data.push(...corners[i],...corners[i|(1<<k)]);
  }
  gl.useProgram(lineProgram);gl.bindBuffer(gl.ARRAY_BUFFER,lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(linePos);gl.vertexAttribPointer(linePos,3,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(lineVP,false,vp);gl.uniform4fv(lineColor,color);
  gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.LINES,0,data.length/3);gl.enable(gl.DEPTH_TEST);
  gl.disableVertexAttribArray(linePos);gl.useProgram(restore);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(normal);
 }
 function draw(gl,vertices,vp,eye,program,pos,normal){
  update();
  if(!hover||!hover.diggable)return;
  const h=window.GroundEdits._test.columnHeight(hover.col.gx,hover.col.gz)??0;
  const bedrock=G.getState().bedrock;
  const bottom=Math.max(bedrock,h-G.getState().digStep);
  const size=[4,Math.max(.5,h-bottom),4];
  const box={center:[hover.col.gx*4+2,(h+bottom)/2,hover.col.gz*4+2],size};
  const ok=hover.inRange;
  drawLines(gl,[box],vp,program,pos,normal,ok?[0.55,0.36,0.2,1]:[1,.25,.2,1]);
 }
 G.attach();
 return {activate,draw,getState:()=>({equipped:equipped(),diggable:diggableMap(),hover:hover?{col:hover.col,inRange:hover.inRange}:null,cooldownRemaining:Math.max(0,cooldownUntil-performance.now())})};
}};
})();
