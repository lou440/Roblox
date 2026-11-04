/* Selected Linked Sword 125013769 SwordScript behavior, adapted to offline JS.
 * Roblox services, stepped scheduling, welds, contacts and damage are not
 * implemented here; timestamps are provided by the browser adapter. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LinkedSwordScript=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const GRIPS=Object.freeze({
  Up:{position:[0,0,-1.5],rotation:[0,0,1,1,0,0,0,1,0]},
  Out:{position:[0,0,-1.5],rotation:[0,-1,0,-1,0,0,0,0,-1]}
 });
 function create(seed={}){
  const state={equipped:!!seed.equipped,enabled:seed.enabled!==false,damage:5,lastAttack:seed.lastAttack??0,grip:'Up',action:null,started:null};
  if(!Number.isFinite(state.lastAttack))throw new RangeError('finite prior timestamp required');
  function tick(now){
   if(!Number.isFinite(now))throw new RangeError('finite timestamp required');
   if(state.action==='Lunge'){
    const elapsed=now-state.started;
    if(elapsed>=1){state.grip='Up';state.damage=5;state.lastAttack=state.started;state.action=null;state.started=null;state.enabled=true}
    else if(elapsed>=.25)state.grip='Out';
   }
   return {...state,forceUp:state.action==='Lunge'&&now-state.started<.5};
  }
  function equip(value){const changed=state.equipped!==!!value;state.equipped=!!value;return changed&&state.equipped?'unsheath':null}
  function activate(now,alive=true){
   tick(now);if(!state.enabled||!state.equipped||!alive)return {accepted:false};
   state.enabled=false;
   if(now-state.lastAttack<.2){state.action='Lunge';state.started=now;state.damage=30;return {accepted:true,action:'Lunge',damage:30,sound:'lunge',toolanim:'Lunge'}}
   state.damage=10;const result={accepted:true,action:'Slash',damage:10,sound:'slash',toolanim:'Slash'};
   state.damage=5;state.lastAttack=now;state.enabled=true;return result;
  }
  function reset(){Object.assign(state,{equipped:false,enabled:true,damage:5,lastAttack:0,grip:'Up',action:null,started:null})}
  return Object.freeze({equip,activate,tick,getState:()=>({...state}),reset});
 }
 return Object.freeze({grips:GRIPS,create});
});
