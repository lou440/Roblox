/* Authored training dummy and approximate swept-segment contact adapter.
 * Its location, geometry, respawn and collision tests are NOT WebClient data. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./linked-sword-hit'),require('./r6-death'));else root.DemoTarget=factory(root.LinkedSwordHit,root.R6Death);})(typeof globalThis!=='undefined'?globalThis:this,function(Hit,Death){
 'use strict';
 const center=[10,0,-5],maxHealth=100,DUMMY_RESPAWN_SECONDS=15;
 const parts=[
  {name:'Torso',center:[10,3,-5],size:[2,2,1]},
  {name:'Head',center:[10,4.5,-5],size:[2,1,1]},
  {name:'Left Arm',center:[8.5,3,-5],size:[1,2,1]},
  {name:'Right Arm',center:[11.5,3,-5],size:[1,2,1]},
  {name:'Left Leg',center:[9.5,1,-5],size:[1,2,1]},
  {name:'Right Leg',center:[10.5,1,-5],size:[1,2,1]}
 ];
 function point(m,p){return [0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i])}
 // Conservative half-stud expansion approximates the public Handle Size X=1;
 // rotated box contacts and Roblox physics are not recovered.
 function segmentBox(a,b,part,radius=.5){
  let lo=0,hi=1;for(let i=0;i<3;i++){
   const min=part.center[i]-part.size[i]/2-radius,max=part.center[i]+part.size[i]/2+radius,d=b[i]-a[i];
   if(Math.abs(d)<1e-9){if(a[i]<min||a[i]>max)return false;continue}
   let t0=(min-a[i])/d,t1=(max-a[i])/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;
  }return true;
 }
 function create(enabled=true){
  if(!enabled)return Object.freeze({step(){return false},reset(){},blocksPlayer(){return false},explode(){return false},damage(){return false},shot(){return false},getState:()=>({health:100,maxHealth:100,center:[0,-9999,0],overhead:[0,-9999,0],parts:[],fallenParts:[]})});
  const state={health:maxHealth,hits:0,lastDamage:0,lastContactTime:null,creatorExpires:null,respawnAt:null,deadAt:null,overlap:false,lastBlade:null};
  let previous=null,tag=null,now=0,pieces=null,piecesAt=null,lastHitAttackSerial=-1,missing=new Set(),loose=[];
  // The detached body uses the same authored rotating-box adapter as the player.
  function breakApart(t){
   const kick=[[.2,0,-.5],[.7,.6,2.3],[-2.8,.3,.4],[2.8,.3,-.4],[-1,.2,-.5],[1,.2,.5]];
   const spin=[[2,.3,1.8],[1,1.2,.7],[1,-.5,-4],[1,.5,4],[2,.3,-3],[2,-.3,3]];
   pieces=Death.create(parts.map((p,i)=>({...p,center:p.center.slice(),size:p.size.slice(),rotation:[0,1,0,0],velocity:kick[i],angular:spin[i]})).filter(p=>!missing.has(p.name)),[0,0,0],true);piecesAt=t;state.deadAt=t;
  }
  function advancePieces(t,player){if(!pieces)return;const dt=Math.max(0,Math.min(.1,t-piecesAt));piecesAt=t;pieces.step(dt,()=>0,[],player)}
  const owner={Neutral:true,TeamColor:'local'},handle={},arm={},grip={Part0:arm,Part1:handle};
  arm.FindFirstChild=n=>n==='RightGrip'?grip:null;
  const humanoid={GetChildren:()=>tag?[tag]:[],TakeDamage(n){const alive=state.health>0;state.health=Math.max(0,state.health-n);state.lastDamage=n;state.hits++;state.lastContactTime=now;if(alive&&state.health===0){state.respawnAt=now+DUMMY_RESPAWN_SECONDS;breakApart(now)}}};
  const target={FindFirstChild:n=>n==='Humanoid'?humanoid:null};
  const ctx={hit:{Parent:target},CheckIfAlive:()=>true,Character:{FindFirstChild:n=>n==='Right Arm'?arm:null},Handle:handle,Player:owner,Players:{GetPlayerFromCharacter:()=>null},Damage:5,
   Instance:{new:()=>{const v={IsA:n=>n==='ObjectValue',Destroy(){if(tag===v)tag=null},SetParent(h){if(h!==humanoid)throw Error('invalid demo humanoid');tag=v}};return v}},
   Debris:{AddItem:(value,t)=>{state.creatorExpires=now+t}}};
  function reset(){Object.assign(state,{health:maxHealth,hits:0,lastDamage:0,lastContactTime:null,creatorExpires:null,respawnAt:null,deadAt:null,overlap:false,lastBlade:null});previous=null;tag=null;pieces=null;piecesAt=null;lastHitAttackSerial=-1;missing.clear();loose=[]}
  function explode(t,pos,radius,damage=60){if(state.health<=0){if(!pieces)return false;const near=pieces.getParts().some(p=>Math.hypot(...p.center.map((v,i)=>Math.max(0,Math.abs(v-pos[i])-p.size[i]/2)))<=radius);if(near)pieces.blast(pos,50,radius);return near}const near=parts.some(p=>Math.hypot(...p.center.map((v,i)=>Math.max(0,Math.abs(v-pos[i])-p.size[i]/2)))<=radius);if(!near)return false;now=t;humanoid.TakeDamage(damage);if(pieces)pieces.blast(pos,50,radius);return true}
  function damage(t,amount){if(state.health<=0)return false;now=t;humanoid.TakeDamage(amount);return true}
  function shot(t,name){if(state.health<=0)return false;const p=parts.find(p=>p.name===name&&!missing.has(name));if(!p)return false;if(['Left Leg','Right Leg','Left Arm'].includes(name)){missing.add(name);const sim=Death.create([{...p,rotation:[0,1,0,0],velocity:[0,0,0],angular:[0,0,0]}],[0,0,0],true);loose.push({sim,at:t,expires:t+10})}return damage(t,40)}
  function blocksPlayer(x,z,footY,oldX,oldZ){for(const v of loose)v.sim.pushPlayer(x,z,footY,oldX,oldZ);if(state.health<=0){if(pieces)pieces.pushPlayer(x,z,footY,oldX,oldZ);return false}if(footY>=5)return false;const d=Math.hypot(x-center[0],z-center[2]),old=Math.hypot(oldX-center[0],oldZ-center[2]);return d<1.8&&d<=old}
  function step(t,frame,sword,player){
   now=t;loose=loose.filter(v=>t<v.expires);for(const v of loose){const dt=Math.max(0,Math.min(.1,t-v.at));v.at=t;v.sim.step(dt,()=>0,[],player)}if(state.creatorExpires!==null&&t>=state.creatorExpires){tag=null;state.creatorExpires=null}
   if(state.respawnAt!==null&&t>=state.respawnAt)reset();else if(state.health<=0)advancePieces(t,player);
   if(!frame||!sword||!sword.equipped||state.health<=0){state.overlap=false;previous=null;state.lastBlade=null;return false}
   // The blade occupies approximately z=-1.98..2.39 in the public mesh.
   const a=point(frame,[0,0,-1.98]),b=point(frame,[0,0,2.39]);
   const overlaps=(x,y)=>parts.some(part=>!missing.has(part.name)&&segmentBox(x,y,part));
   const direct=overlaps(a,b),swept=!!previous&&(overlaps(previous.a,a)||overlaps(previous.b,b));
   // Browser contact events can remain overlapped through an entire swing. Permit
   // a fresh accepted activation to register once even without an intervening exit.
   const serial=Number.isFinite(sword.attackSerial)?sword.attackSerial:0;
   const newlyTouching=(direct||swept)&&(!state.overlap||(direct&&serial>lastHitAttackSerial));previous={a,b};state.lastBlade={a,b};state.overlap=direct;
   if(newlyTouching){lastHitAttackSerial=serial;ctx.Damage=sword.damage;return Hit.blow(ctx)}return false;
  }
  function overhead(){const h=pieces?.getParts().find(p=>p.name==='Head');return h?[h.center[0],h.center[1]+1.05,h.center[2]]:[center[0],5.4,center[2]]}
  return Object.freeze({step,reset,blocksPlayer,explode,damage,shot,getState:()=>({...state,center:[...center],overhead:overhead(),parts:parts.filter(p=>!missing.has(p.name)).map(p=>({name:p.name,center:[...p.center],size:[...p.size]})),missingParts:[...missing],fallenParts:loose.flatMap(v=>v.sim.getParts()).concat(pieces?pieces.getParts():[]),maxHealth,source:'authored dummy; swept blade/AABB and per-activation contacts, rotating-box contacts, detached-piece physics and respawn are browser approximations'})});
 }
 return Object.freeze({center,parts,maxHealth,point,segmentBox,create});
});
