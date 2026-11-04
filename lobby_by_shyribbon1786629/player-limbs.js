/* Browser approximation of the public General's .45 R6 joint/tool effects.
 * Uses the shared loose-body solver; not the Roblox humanoid or network solver. */
(()=>{'use strict';
 const cutNames=new Set(['Left Arm','Left Leg','Right Leg']);
 function create(){
  const actors=new Map();
  function actor(id){if(!actors.has(id))actors.set(id,{missing:new Set(),loose:[]});return actors.get(id)}
  function add(id,part,frame,time,tool=null,key=null){const A=window.ArchivedR6Animation,D=window.R6Death,P=window.ArchivedR6Parts;const snapshot={name:part,size:tool?[1,1,2]:P.parts[part].size.slice(),center:frame.slice(12,15),rotation:A.quat(frame),velocity:[0,0,0],angular:[0,0,0]};actor(id).loose.push({sim:D.create([snapshot],[0,0,0],true),expires:tool?Infinity:time+10,tool,key,born:time})}
  function cut(id,part,frame,time){if(!cutNames.has(part)||!frame)return false;const a=actor(id);if(a.missing.has(part))return false;a.missing.add(part);add(id,part,frame,time);return true}
  function drop(id,tool,frame,time,key){if(!tool||!frame)return false;add(id,'Tool',frame,time,tool,key);return true}
  function dropHat(id,appearance,index,frame,time){if(!frame)return;add(id,'Tool',frame,time,'hat');const x=actor(id).loose.at(-1);x.hat={appearance,index};x.tool=null}
  function reset(id){actor(id).missing.clear()}
  function sync(id,names){const a=actor(id);a.missing=new Set((names||[]).filter(n=>cutNames.has(n)))}
  function missing(id,name){return actor(id).missing.has(name)}
  function step(dt,surface,obstacles,player,time){for(const a of actors.values()){a.loose=a.loose.filter(x=>x.expires>time);for(const x of a.loose)x.sim.step(dt,surface,obstacles,player)}}
  function parts(id){return actor(id).loose.filter(x=>!x.tool&&!x.hat).flatMap(x=>x.sim.getParts())}
  function hats(){return [...actors.values()].flatMap(a=>a.loose.filter(x=>x.hat).map(x=>({...x.sim.getParts()[0],...x.hat})))}
  function drops(){return [...actors.values()].flatMap(a=>a.loose.filter(x=>x.tool).map(x=>({...x.sim.getParts()[0],tool:x.tool,born:x.born}))) }
  function findCollectable(player,time,canTake){
   for(const a of actors.values()){
    const i=a.loose.findIndex(x=>x.tool&&time-x.born>.8&&(!canTake||canTake(x.tool,x.key))&&x.sim.getParts().some(p=>Math.hypot(p.center[0]-player.x,p.center[2]-player.z)<1.4&&Math.abs(p.center[1]-(player.y+1))<2));
    if(i>=0)return{list:a.loose,index:i,entry:a.loose[i]};
   }
   return null;
  }
  function peekCollect(_id,player,time,canTake=null){const hit=findCollectable(player,time,canTake);return hit?{tool:hit.entry.tool,key:hit.entry.key}:null}
  function collect(_id,player,time,canTake=null){const hit=findCollectable(player,time,canTake);if(!hit)return null;const item=hit.list.splice(hit.index,1)[0];return{tool:item.tool,key:item.key}}
  function removeDrop(key){for(const a of actors.values())a.loose=a.loose.filter(x=>!x.tool||x.key!==key)}
  return Object.freeze({cut,drop,dropHat,reset,sync,missing,step,parts,drops,hats,peekCollect,collect,removeDrop,getState:id=>({missing:[...actor(id).missing],parts:parts(id),drops:drops()})});
 }
 window.PlayerLimbEffects=Object.freeze({create});
})();
