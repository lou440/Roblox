/* Imported map visuals, Free Build PvP Subspace mines, offline script ports and authoritative room events. */
(()=>{'use strict';window.PlaceRuntime={create(data,context){
const freeBuild=!data?.rules&&!window.MapSelection?.isSword&&!window.MapSelection?.noTools;
if(!data?.rules&&!freeBuild)return {step(){},draw(){},activate(){return false},renderParts:p=>p};
const rules=data?.rules||{kind:'freebuild',triggers:[],groups:{},killY:-40},rawParts=data?.parts||[];
const c=context(),O=c.obstacles,original=new Map(rawParts.map(p=>[p.id,{...p,center:p.center.slice(),color:p.color.slice()}])),parts=new Map(rawParts.map(p=>[p.id,{...p,center:p.center.slice(),color:p.color.slice()}])),moving=new Set((rules.triggers||[]).filter(t=>t.kind==='elevator').map(t=>t.id));
let revision=0,drawRevision=-1,objects=[],effectsAt=Date.now(),effectServerAt=Date.now(),effectMesh=null,elevatorMesh=null,localScripts=null,jet=null;
const collision=()=>window.SFOTHCollision.build([...parts.values()].filter(p=>!p.removed&&!p.path?.startsWith('Workspace/Killbot/')));
function rebuild(){if(!freeBuild)O.replaceStaticParts(collision());}
function patch(patches){if(freeBuild)return;let structural=false;for(const m of patches){const p=parts.get(m.id);if(!p)continue;if(m.reset){parts.set(m.id,{...original.get(m.id),center:original.get(m.id).center.slice(),color:original.get(m.id).color.slice()});structural=true}else{if(m.removed!==undefined){p.removed=m.removed;structural=true}if(m.color)p.color=m.color;if(m.center){p.center=m.center.slice();for(const q of O.collisionParts)if(q.id===m.id){q.center[1]=p.center[1];q.top=p.center[1]+q.size[1]/2;q.bottom=p.center[1]-q.size[1]/2;window.__characterPhysics?.syncPart(q)}}}if(!moving.has(m.id)||m.removed!==undefined||m.color||m.reset)revision++}if(structural)rebuild()}
function checkpoint(spawn){Object.assign(window.MapSelection.spawn,spawn)}
function effects(e){objects=e.objects||[];effectsAt=Date.now();effectServerAt=Number.isFinite(e.now)?e.now:effectsAt;c.onPlaceObjects?.(objects);if(Array.isArray(e.paint))c.subspaceController?.syncPaint?.(e.paint,performance.now()/1000)}
window.addEventListener('mp:world-reset',()=>{c.subspaceController?.clearEffects?.();if(!freeBuild)patch([...parts.keys()].map(id=>({id,reset:true})));objects=[];c.onPlaceObjects?.(objects)});
window.addEventListener('mp:place-parts',e=>patch(e.detail.patches||[]));window.addEventListener('mp:place-effects',e=>effects(e.detail));window.addEventListener('mp:place-checkpoint',e=>checkpoint(e.detail.spawn));window.addEventListener('mp:paint-splatter',e=>c.subspaceController?.addPaintEvent?.(e.detail,performance.now()/1000));
window.addEventListener('mp:place-boost',e=>{c.player.vy=e.detail.speed;c.player.grounded=false;c.player.scriptBoostUntil=performance.now()+e.detail.duration*1000;c.player.scriptBoostSpeed=e.detail.speed});
window.addEventListener('mp:place-ride',e=>{c.player.y+=e.detail.delta;c.player.grounded=true});window.addEventListener('mp:place-jet',e=>{jet=e.detail.active?{at:performance.now(),duration:e.detail.duration}:null});
const wire=window.__placeWire;if(wire){if(!freeBuild&&wire.patches)patch([...wire.patches.values()]);if(wire.effects)effects(wire.effects);if(wire.spawn)checkpoint(wire.spawn)}
function toast(text){window.dispatchEvent(new CustomEvent('mp:notice',{detail:{kind:'info',text}}))}
const localPlayer=()=>{const p=c.player;p.id='local';p.username='LocalPlayer';p.weapons=window.CombatMode?.enabled!==false;p.dead=c.dead();p.ph=p.grounded?'ground':'fall';return p};
function partTop(p,x,z){if(p.shape==='wedge'&&Array.isArray(p.size))return p.center[1]-p.size[1]/2+p.size[1]*Math.max(0,Math.min(1,(z-p.center[2]+p.size[2]/2)/p.size[2]));return(p.top!==undefined)?p.top:(p.center[1]+p.size[1]/2)}
function contactParts(pos,radius){const found=new Set();for(const dx of [-1,0,1])for(const dz of [-1,0,1])for(const p of O.nearby(pos[0]+dx*radius,pos[2]+dz*radius))found.add(p);return [...found].filter(p=>!p.removed).map(p=>({...p,contactKey:p.id!==undefined?'part:'+p.id:p.buildKey?'build:'+p.buildKey+':'+p.center.join(','):'local:'+p.center.join(',')}))}
function blastParts(){return O.collisionParts.filter(p=>!p.removed)}
function resolveSparkleTarget(target){
 if(target.playerId){const p=target.playerId==='local'||target.playerId===window.__multiplayer?.selfId?c.player:window.__multiplayer?.remotes.get(target.playerId);if(!p)return null;const x=p.x??p.rx,y=p.y??p.ry,z=p.z??p.rz;return Number.isFinite(x)?{center:[x,y+2.5,z],size:target.size}:null}
 const candidates=freeBuild?O.collisionParts:[...parts.values()];const match=candidates.find(p=>!p.removed&&(target.id.startsWith('part:')?String(p.id)===target.id.slice(5):target.id.startsWith('build:')&&p.buildKey===target.id.slice(6).split(':').slice(0,-1).join(':')&&p.center.every((v,k)=>Math.abs(v-target.center[k])<.05)));
 return match||null;
}
c.subspaceController?.setSparkleResolver?.(resolveSparkleTarget);
function groundTop(x,oldBottomY,z,r){
 let best=freeBuild&&Math.abs(x)<=256&&Math.abs(z)<=256&&0<=oldBottomY+.35?0:-Infinity;
 for(const p of O.nearby(x,z)){
  if(p.removed||p.collide===false)continue;
  if(Math.abs(x-p.center[0])>p.size[0]/2+r*.7||Math.abs(z-p.center[2])>p.size[2]/2+r*.7)continue;
  const t=partTop(p,x,z);
  if(t<=oldBottomY+.35&&t>best)best=t;
 }
 return Number.isFinite(best)?best:null;
}
localScripts=window.CreatePlaceScriptEngine(rules,{now:()=>Date.now(),players:()=>[localPlayer()],player:id=>id==='local'?localPlayer():null,kill:()=>c.kill(),damage:(p,n)=>c.damage(n),patch,paintPart:(id,color)=>patch([{id,color}]),message:toast,partActive:id=>!parts.get(id)?.removed,
 checkpoint:(p,t)=>checkpoint({x:t.spawn.center[0],y:t.spawn.center[1],z:t.spawn.center[2],yaw:t.spawn.yaw}),boost:(p,speed,duration)=>{p.vy=speed;p.grounded=false;p.scriptBoostUntil=performance.now()+duration*1000;p.scriptBoostSpeed=speed},heal:(p,n)=>c.heal(n),armor:(p,n)=>c.armor(n),team:(p,t)=>p.team=t,
 teleport:(p,pos)=>{[p.x,p.y,p.z]=pos;p.vy=0;p.grounded=false},jetboots:(p,at,duration)=>jet={at:performance.now(),duration},effects,groundTop,contactParts,blastParts,
 movePlatform:(t,delta,dy)=>{const p=parts.get(t.id);if(!p)return;const player=c.player;if(Math.abs(player.y-(p.center[1]+p.size[1]/2))<.8&&Math.abs(player.x-p.center[0])<p.size[0]/2+.4&&Math.abs(player.z-p.center[2])<p.size[2]/2+.4)player.y+=delta;patch([{id:t.id,center:[t.center[0],t.center[1]+dy,t.center[2]]}])},
 projectileHit:(a,b,r)=>{for(const p of O.nearby(b[0],b[2]))if(!p.removed&&p.collide!==false&&Math.abs(b[0]-p.center[0])<p.size[0]/2+r&&Math.abs(b[1]-p.center[1])<p.size[1]/2+r&&Math.abs(b[2]-p.center[2])<p.size[2]/2+r){const axis=[0,1,2].sort((i,j)=>Math.abs(b[j]-p.center[j])/p.size[j]-Math.abs(b[i]-p.center[i])/p.size[i])[0];return{id:p.id,axis,top:partTop(p,b[0],b[2])}}return null},
 explode:(pos,owner,r,kind,sparkleParts)=>{const rad=kind==='subspace'?16:(r||12);localScripts?.blastTrigger?.(pos,rad);const paintParts=kind==='subspace'?blastParts().filter(p=>!p.removed&&Math.hypot(...p.center.map((v,k)=>Math.max(0,Math.abs(v-pos[k])-p.size[k]/2)))<rad).slice(0,64).map(p=>({id:p.contactKey||(p.id!==undefined?'part:'+p.id:p.buildKey?'build:'+p.buildKey+':'+p.center.join(','):'local:'+p.center.join(',')),center:p.center,size:p.size})):[];window.dispatchEvent(new CustomEvent('mp:blast',{detail:{x:pos[0],y:pos[1],z:pos[2],radius:rad,...(kind?{kind}:{}),...(kind==='subspace'?{sparkleParts:(sparkleParts||window.MineSparkleTargets(blastParts(),[localPlayer()],pos,rad)).slice(0,64),paintEvent:{id:'local-paint-'+Date.now(),expiresAt:Date.now()+90000,parts:paintParts,cells:[]}}:{})}}));if(Math.hypot(c.player.x-pos[0],c.player.y+2.5-pos[1],c.player.z-pos[2])<rad)c.kill();if(!freeBuild){const patches=[];for(const p of parts.values()){if(p.removed)continue;const d=Math.hypot(...p.center.map((v,k)=>Math.max(0,Math.abs(v-pos[k])-p.size[k]/2)));if(d>=rad)continue;if(p.destructible)patches.push({id:p.id,removed:true});else if(kind==='subspace'&&p.size[0]*p.size[1]*p.size[2]<300){}}if(patches.length)patch(patches)}},removeGroups:names=>{const groups=new Set(names.map(n=>rules.groups[n]));patch([...parts.values()].filter(p=>groups.has(p.group)).map(p=>({id:p.id,removed:true})))},regenerate:names=>{const groups=new Set((names||Object.keys(rules.groups)).map(n=>rules.groups[n]));patch([...parts.values()].filter(p=>groups.has(p.group)).map(p=>({id:p.id,reset:true})))}});
window.addEventListener('pointerup',()=>{if(jet){jet=null;window.__multiplayer?.sendPlaceRelease?.()}});
function renderParts(){return freeBuild?[]:[...parts.values()].filter(p=>!p.removed&&!moving.has(p.id)&&!p.path?.startsWith('Workspace/Killbot/'))}
function step(){if(!window.__multiplayer?.connected)localScripts.tick();if(c.player.scriptBoostUntil>performance.now()){c.player.vy=c.player.scriptBoostSpeed;c.player.grounded=false}if(jet){const elapsed=(performance.now()-jet.at)/1000;if(elapsed>jet.duration/1000)jet=null;else{c.player.vy=3+30*elapsed/6;c.player.grounded=false}}}
function activate(tool,target){if(tool==='subspace'&&window.MapSelection?.id==='game')return false;if(freeBuild&&tool!=='subspace')return false;if(!['paintball','slingshot','superball','timebomb','jetboots','subspace'].includes(tool))return false;if(tool==='subspace'&&!window.CombatMode?.enabled&&!window.__adminUnlockedTools?.has('subspace'))return false;if(tool==='subspace'&&c.subspaceController&&!c.subspaceController.isReady(performance.now()/1000))return false;if(window.__multiplayer?.connected)window.__multiplayer.sendPlaceTool(target);else if(!localScripts.activate(localPlayer(),tool,target))return false;if(tool==='subspace')c.subspaceController?.markActivated(performance.now()/1000);return true}
function draw(gl,vertices,vp,eye,program,pos,normal,base){if(!freeBuild&&drawRevision!==revision){drawRevision=revision;base.setParts(renderParts())}if(!effectMesh)effectMesh=window.StaticWorld.create(gl,vertices,[]);if(!freeBuild&&!elevatorMesh)elevatorMesh=window.StaticWorld.create(gl,vertices,[]);const geometry=[],t=Math.min(.25,(Date.now()-effectsAt)/1000),add=(center,size,color,shape='sphere',matrix)=>geometry.push({center,size,color,shape,matrix});
for(const o of objects){
 const noGrav=o.resting||['killbot','paintball','botrocket'].includes(o.kind);
 const p=o.pos.map((v,k)=>v+(o.resting?0:(o.velocity?.[k]||0)*t)-(k===1&&!noGrav?98.1*t*t:0));
 if(o.kind==='subspace'){let alpha=typeof o.alpha==='number'?o.alpha:(o.color?.[3]??1);const tNow=effectServerAt+Math.max(0,Math.min(1000,Date.now()-effectsAt)),phase=Number(o.phaseAt);if(o.phaseAt!==null&&Number.isFinite(phase)){const step=n=>Math.max(0,Math.min(n,Math.floor(Math.max(0,tNow-phase)/50)));if(o.stage==='arming')alpha=1-step(10)*.1;else if(o.stage==='triggered')alpha=step(5)*.2;else if(o.stage==='pulse'){const i=step(10);alpha=i<5?(i+1)*.1:Math.max(0,(10-i)*.1)}}if(alpha>0.01)c.drawSubspace?.(p,alpha,o);continue}
 const color=o.color||[1,.3,.1,1];
 if(o.kind==='teapot'){add(p,[3.1,1.9,2.4],color);add([p[0],p[1]+1.05,p[2]],[2.4,.25,1.8],color,'cylinder');add([p[0],p[1]+1.4,p[2]],[.5,.5,.5],color);add([p[0]+2,p[1]+.25,p[2]],[2.1,.6,.6],color,'wedge');add([p[0]-1.65,p[1],p[2]],[1.6,1.6,.35],color,'ring',[1,0,0,0,0,1,0,1,0])}else if(o.kind==='killbot'){add(p,[8,8,8],color);add([p[0],p[1],p[2]-3.8],[4,1,.5],[1,.1,.1,1])}else add(p,o.kind==='bomb'?[2,2,2]:o.kind==='superball'||o.kind==='cannon'?[2,2,2]:[1,1,1],color,o.kind==='botrocket'?'box':'sphere')
}
if(geometry.length){effectMesh.setParts(geometry);effectMesh.draw(vp,eye,program,pos,normal)}
if(!freeBuild){elevatorMesh.setParts([...parts.values()].filter(p=>moving.has(p.id)&&!p.removed));elevatorMesh.draw(vp,eye,program,pos,normal)}
}
rebuild();return {step,draw,activate,renderParts};
}}})();
