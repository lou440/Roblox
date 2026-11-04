/* Explicit JavaScript ports of the embedded place scripts. Never evaluates uploaded Lua. */
/* Source-faithful touch edges: a resting support does not retrigger an armed mine. */
function createMineContactTracker(){
 const states=new WeakMap();
 return {observe(mine,contacts){
  let previous=states.get(mine);if(!previous){previous=new Map();states.set(mine,previous)}
  const current=new Map(),entered=[];
  for(const contact of contacts){if(!contact||typeof contact.key!=='string')continue;const old=previous.get(contact.key);current.set(contact.key,contact);if(!old||(contact.token!==undefined&&old.token!==contact.token))entered.push(contact)}
  states.set(mine,current);return entered;
 },forget(mine){states.delete(mine)}};
}
function minePartTouches(mine,part){
 if(!part||part.removed||!Array.isArray(part.center)||!Array.isArray(part.size))return false;
 return [0,1,2].every(k=>Number.isFinite(part.center[k])&&Number.isFinite(part.size[k])&&Math.abs(mine.pos[k]-part.center[k])<=mine.radius+Math.max(0,part.size[k])/2+.02);
}
function mineSparkleTargets(parts,players,pos,radius){
 const out=[],seen=new Set();
 const add=(id,center,size,playerId)=>{if(out.length>=64||!Array.isArray(center)||!Array.isArray(size)||!center.every(Number.isFinite)||!size.every(Number.isFinite))return;const volume=size.reduce((a,b)=>a*Math.max(0,b),1);if(volume>=300)return;const distance=Math.hypot(...center.map((v,k)=>Math.max(0,Math.abs(v-pos[k])-size[k]/2)));if(distance>=radius)return;const key=String(id);if(seen.has(key))return;seen.add(key);out.push({id:key,center:center.slice(),size:size.slice(),...(playerId?{playerId}:{})})};
 for(const p of parts||[]){if(p.removed)continue;const id=p.contactKey||(p.id!==undefined?'part:'+p.id:p.buildKey?'build:'+p.buildKey+':'+p.center.join(','):'');if(id)add(id,p.center,p.size)}
 for(const p of players||[]){if(!p.dead)add('player:'+p.id,[p.x,p.y+2.5,p.z],[2,5,2],p.id)}
 return out;
}
function createPlaceScriptEngine(rules,api){
 const mineContacts=createMineContactTracker();
 const triggers=rules.triggers||[],cooldowns=new Map(),activeElevators=new Map(),projectiles=new Map(),bots=new Map();let serial=0,start=api.now(),last=start,diff=8,nextEase=start+180000,nextRegen=start+(rules.regenTime||300)*1000,nextBroadcast=0;let roundWarned=false,roundEnding=0;const armorRestore=new Map(),regens=rules.kind==='crossroads'?[['LostTemple'],['BlackrockCastle'],['Trees','Overhead Ramp'],['Tower'],['Hideout']].map(names=>({names,at:start+(.2+Math.random()*.8)*(rules.regenTime||120)*1000,restoring:0})):[];const spawnLoops=[{x:-136,z:6,spread:6,div:1,i:1,count:12,next:start+2000},{x:-18,z:6,spread:40,div:10/7,i:1,count:12,next:start+2000}];
 const random=(a,b)=>a+Math.random()*(b-a),color=()=>[Math.random(),Math.random(),Math.random(),1],norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n)},players=()=>[...api.players()].filter(p=>!p.dead);
 function touching(p,t){return Math.abs(p.x-t.center[0])<=t.size[0]/2+.65&&Math.abs(p.z-t.center[2])<=t.size[2]/2+.65&&p.y+5>=t.center[1]-t.size[1]/2&&p.y<=t.center[1]+t.size[1]/2+.12}
 function ready(key,ms,now){if((cooldowns.get(key)||0)>now)return false;cooldowns.set(key,now+ms);return true}
 function message(text,p=null){api.message?.(text,p)}
 function spawn(kind,pos,velocity,owner=null,extra={}){if(projectiles.size>=160)return null;const now=api.now(),q={id:++serial,kind,pos:pos.slice(),velocity:velocity.slice(),born:now,owner:owner?.id||null,color:color(),life:11000,radius:kind==='teapot'?1.4:kind==='superball'||kind==='cannon'||kind==='bomb'||kind==='subspace'?1:.5,damage:kind==='paintball'?20:kind==='pellet'?8:kind==='superball'?40:50,...extra};projectiles.set(q.id,q);return q}
 function summon(team,pos){if(bots.size>=5)return;const q={id:++serial,kind:'killbot',team,pos:pos.slice(),goal:pos.slice(),next:0,fireAt:0,color:team==='Red Hawks'?[.8,.15,.1,1]:team==='Blue Falcons'?[.1,.35,.8,1]:[1,.8,.1,1]};bots.set(q.id,q)}
 if(rules.killbot)summon(null,rules.killbot.center);
 function touch(p,now=api.now()){
  for(const t of triggers){if(!touching(p,t))continue;if(api.partActive&&!api.partActive(t.id))continue;const key=t.kind+':'+t.id;
   if(t.kind==='kill'){api.kill(p);return}
   if(t.kind==='checkpoint'&&t.stage>(p.stage||0)){p.stage=t.stage;api.checkpoint?.(p,t);message(t.spawn.name==='Winners'?'You win!':'Checkpoint: '+t.spawn.name,p)}
   if(t.kind==='bounce'&&ready(key+':'+p.id,800,now))api.boost?.(p,t.speed,t.duration);
   if(t.kind==='armor'&&(p.maxHealth||100)<200&&ready(key,60000,now)){api.armor?.(p,200);api.patch?.([{id:t.id,removed:true}]);armorRestore.set(t.id,now+60000);message('You found Battle Armor! Max Health Doubled!',p)}
   if(t.kind==='beacon'){if(p.team&&p.team!==t.team){api.kill(p);return}if(!p.team){p.team=t.team;message("You're now on the "+t.team+' team!',p)}if(ready('beacon-heal:'+t.team,5000,now))api.heal?.(p,50);api.team?.(p,t.team)}
   if(t.kind==='elevator'&&!activeElevators.has(t.id)){activeElevators.set(t.id,{trigger:t,at:now,y:0});api.elevatorStart?.(t,now)}
   if(t.kind==='finish'&&ready(key,3000,now)){diff+=3;message(p.username+' reached the end! Teapot difficulty: '+diff);api.teleport?.(p,t.target)}
   if(t.kind==='cannon'&&ready(key,4000,now)){for(let j=0;j<4;j++){const barrel=t.barrels[j%Math.max(1,t.barrels.length)];if(!barrel||(api.partActive&&!api.partActive(barrel.id)))continue;const m=barrel.matrix,v=[m[0],m[3],m[6]],pos=barrel.center.map((n,k)=>n+v[k]*6);spawn('cannon',pos,v.map(n=>n*random(180,260)),p,{born:now+j*200,life:5000})}}
   if(t.kind==='summon'&&ready(key,3000,now)){summon(t.team,[random(-60,60),random(40,60)-rules.offset,random(-60,60)]);message('You have summoned a '+t.team+' killbot!',p)}
  }
 }
 function activate(p,tool,target){const now=api.now();if(!target||!target.every(Number.isFinite))return false;if(rules.kind==='freebuild'&&(tool!=='subspace'||p.weapons===false))return false;const times={paintball:500,slingshot:200,superball:2000,timebomb:6000,jetboots:14000,subspace:3000};if(!times[tool]||!ready('tool:'+p.id+':'+tool,times[tool],now))return false;
  const head=[p.x,p.y+4.5,p.z],dir=norm(target.map((v,k)=>v-head[k]));
  if(tool==='paintball')spawn('paintball',head.map((v,k)=>v+dir[k]*3),dir.map(v=>v*200),p,{life:8000,gravity:0});
  if(tool==='slingshot'){const pos=head.map((v,k)=>v+dir[k]*3),delta=target.map((v,k)=>v-pos[k]),dx=Math.max(.001,Math.hypot(delta[0],delta[2])),v=85,g=196.2,root=v**4-g*(g*dx*dx+2*delta[1]*v*v),theta=root<=0?Math.PI/4:Math.atan((v*v-Math.sqrt(root))/(g*dx));spawn('pellet',pos,[delta[0]/dx*Math.cos(theta)*v,Math.sin(theta)*v,delta[2]/dx*Math.cos(theta)*v],p,{life:2000})}
  if(tool==='superball')spawn('superball',head.map((v,k)=>v+dir[k]*3),dir.map((v,k)=>v*200+(k===1?8:0)),p,{life:5000,elasticity:1});
  if(tool==='timebomb')spawn('bomb',[p.x,p.y+8.5,p.z],[0,0,0],p,{life:3200,fuse:3200});
  // Port of Roblox gear 11999247; only the authority simulates the device.
  if(tool==='subspace'){
   const owned=[...projectiles.values()].filter(q=>q.kind==='subspace'&&q.owner===p.id);
   while(owned.length>=8){const oldest=owned.shift();projectiles.delete(oldest.id)}
   spawn('subspace',[p.x+Math.sin(p.yaw||0)*1.6,p.y+3,p.z-Math.cos(p.yaw||0)*1.6],[0,0,0],p,{life:300000,radius:1,resting:false,stillAt:null,armingAt:null,armedAt:null,expiresAt:null,triggeredAt:null,blastAt:null,expirePulseUntil:null,pulseStart:0,pulseUntil:0,nextPulseCheck:now+2500,ownerKey:p.key||null,ownerName:p.username||null,color:[1,0,.75,1]});
   nextBroadcast=0;
  }
  if(tool==='jetboots')api.jetboots?.(p,now,6000);
  return true;
 }
 function serializeObj(q,now){
  if(q.kind==='subspace'){
   const clamp=v=>Math.max(0,Math.min(1,v));
   const stage=q.triggeredAt!==null?'triggered':q.armedAt===null?(q.armingAt!==null?'arming':'calibrating'):(now<q.pulseUntil?'pulse':'armed');
   const step=(t,n)=>Math.max(0,Math.min(n,Math.floor(Math.max(0,t)/50)));
   const pulse=i=>i<5?(i+1)*.1:Math.max(0,(10-i)*.1);
   const alpha=stage==='triggered'?step(now-q.triggeredAt,5)*.2:stage==='arming'?1-step(now-q.armingAt,10)*.1:stage==='calibrating'?1:stage==='pulse'?pulse(step(now-q.pulseStart,10)):0;
   return {id:q.id,kind:q.kind,pos:q.pos,velocity:q.velocity||[0,0,0],resting:!!q.resting,alpha,stage,phaseAt:stage==='arming'?q.armingAt:stage==='triggered'?q.triggeredAt:stage==='pulse'?q.pulseStart:null,pulseUntil:q.pulseUntil,color:[1,.16,.65,alpha]};
  }
  return {id:q.id,kind:q.kind,pos:q.pos,velocity:q.velocity||[0,0,0],resting:!!q.resting,color:q.kind==='bomb'?(Math.floor((now-q.born)/Math.max(100,400*(.9**Math.floor((now-q.born)/300))))%2?[.8,.1,.1,1]:[.1,.1,.1,1]):q.color};
 }
 function subspaceTouch(q,now){
  const contacts=[];
  for(const part of api.contactParts?.(q.pos,q.radius)||[])if(minePartTouches(q,part))contacts.push({key:part.contactKey||String(part.id),token:part.contactToken});
  for(const p of players())if(Math.abs(p.x-q.pos[0])<=q.radius+.8&&Math.abs(p.z-q.pos[2])<=q.radius+.8&&p.y<=q.pos[1]+q.radius+.02&&p.y+5>=q.pos[1]-q.radius-.02)contacts.push({key:'player:'+p.id});
  const entered=mineContacts.observe(q,contacts);
  if(q.armedAt!==null&&entered.length){q.triggeredAt=now;q.blastAt=now+300;nextBroadcast=0;return true}
  if(q.armedAt===null&&entered.length){q.stillAt=null;if(q.armingAt!==null){q.armingAt=null;nextBroadcast=0}}
  return false;
 }
 function tick(now=api.now()){
  const dt=Math.min(.15,Math.max(0,(now-last)/1000));last=now;for(const [id,at]of armorRestore)if(now>=at){api.patch?.([{id,removed:false}]);armorRestore.delete(id)}for(const p of players())touch(p,now);
  for(const [id,e] of activeElevators){const t=(now-e.at)/1000,r=e.trigger;let dy=t<2?0:t<4?(t-2)/2*r.rise:t<12?r.rise:t<14?r.rise*(1-(t-12)/2):0;api.movePlatform?.(r,dy-e.y,dy);e.y=dy;if(t>=18)activeElevators.delete(id)}
  if(rules.kind==='teapots'){
   if(now>=nextEase){nextEase=now+180000;if(diff>4){diff-=3;message('Making the teapots less evil… Difficulty: '+diff)}}
   for(const loop of spawnLoops){if(now<loop.next)continue;spawn('teapot',[loop.x+random(-4,4),20-rules.offset+random(-4,4),loop.z+random(-loop.spread,loop.spread)],[random(75,100),random(-100,50),random(loop.spread===6?-1:-10,loop.spread===6?1:10)],null,{lethal:true,half:[7,3,4],elasticity:.9});loop.next=now+loop.i/diff*loop.div*1000;loop.i++;if(loop.i>loop.count){loop.next+=1000;loop.i=1;loop.count=Math.floor(random(10,16))}}
  }
  for(const [id,q] of projectiles){
   if(now<q.born)continue;
   if(q.kind==='subspace'&&q.triggeredAt!==null){
    if(q.expirePulseUntil!==null&&now>=q.expirePulseUntil&&q.expirePulseUntil<=q.blastAt){mineContacts.forget(q);projectiles.delete(id);nextBroadcast=0}
    else if(now>=q.blastAt){api.explode?.(q.pos,q.owner,16,'subspace',mineSparkleTargets(api.blastParts?.(q.pos,16),players(),q.pos,16));mineContacts.forget(q);projectiles.delete(id);nextBroadcast=0}
    continue;
   }
   if(q.kind==='subspace'&&q.armedAt!==null&&q.expiresAt!==null&&now>=q.expiresAt){
    if(q.expirePulseUntil===null){q.pulseStart=now;q.pulseUntil=now+550;q.expirePulseUntil=q.pulseUntil;nextBroadcast=0}
    else if(now>=q.expirePulseUntil){mineContacts.forget(q);projectiles.delete(id);nextBroadcast=0;continue}
   }
   if(now-q.born>q.life){if(q.kind==='bomb')api.explode?.(q.pos,q.owner,12);projectiles.delete(id);if(q.kind==='subspace')nextBroadcast=0;continue}
   const g=q.gravity??196.2,postVy=(['bomb','subspace'].includes(q.kind)&&q.resting)?0:q.velocity[1]-g*dt;
   const maxSpd=Math.hypot(q.velocity[0],postVy,q.velocity[2]);
   const steps=Math.max(1,Math.ceil(maxSpd*dt/(q.kind==='subspace'?.5:.8))),h=dt/steps;let gone=false;
   for(let n=0;n<steps&&!gone;n++){
    const old=q.pos.slice();
    if(q.kind==='subspace'){
     if(q.resting){
      if(api.groundTop){
       const sup=api.groundTop(q.pos[0],q.pos[1]-q.radius,q.pos[2],q.radius);
       if(sup!==null&&Math.abs((q.pos[1]-q.radius)-sup)<=.18){q.pos[1]=sup+q.radius}
       else{q.resting=false;if(q.armedAt===null)q.stillAt=null}
      }else{
       const probe=api.projectileHit?.(q.pos,[q.pos[0],q.pos[1]-.12,q.pos[2]],q.radius);
       if(!probe||(probe.axis??1)!==1){q.resting=false;if(q.armedAt===null)q.stillAt=null}
      }
     }
     if(!q.resting&&h>0){
      q.velocity[1]-=g*h;
      let hx=old[0]+q.velocity[0]*h,hz=old[2]+q.velocity[2]*h;
      if((q.velocity[0]||q.velocity[2])&&api.projectileHit?.(old,[hx,old[1],hz],q.radius)){hx=old[0];hz=old[2];q.velocity[0]*=-.25;q.velocity[2]*=-.25}
      let hy=old[1]+q.velocity[1]*h;
      if(api.groundTop){
       const sup=api.groundTop(hx,old[1]-q.radius,hz,q.radius);
       if(q.velocity[1]<=0&&sup!==null&&hy-q.radius<=sup+.02){hy=sup+q.radius;q.velocity=[0,0,0];q.resting=true}
       else if(q.velocity[1]>0&&api.projectileHit?.([hx,old[1],hz],[hx,hy,hz],q.radius)){hy=old[1];q.velocity[1]=0}
      }else{
       const vhit=api.projectileHit?.([hx,old[1],hz],[hx,hy,hz],q.radius);
       if(vhit&&(vhit.axis??1)===1){if(q.velocity[1]<=0){hy=vhit.top!==undefined?vhit.top+q.radius:old[1];q.velocity=[0,0,0];q.resting=true}else{hy=old[1];q.velocity[1]=0}}
      }
      q.pos=[hx,hy,hz];
     }
    }else if(q.kind!=='bomb'||!q.resting){
     q.velocity[1]-=g*h;q.pos=q.pos.map((v,k)=>v+q.velocity[k]*h);
    }
    if(q.kind==='subspace'){gone=subspaceTouch(q,now);if(gone)continue}
    if(q.kind==='subspace')continue;
    const owner=api.player?.(q.owner);for(const p of players()){
     if(p.id===q.owner&&(q.kind!=='superball'||now-q.born<1000))continue;if(owner?.team&&p.team===owner.team)continue;if(Math.abs(p.x-q.pos[0])<(q.half?.[0]||q.radius)+.8&&Math.abs(p.z-q.pos[2])<(q.half?.[2]||q.radius)+.8&&p.y<q.pos[1]+(q.half?.[1]||q.radius)&&p.y+5>q.pos[1]-(q.half?.[1]||q.radius)){if(q.lethal&&now-q.born<1000)continue;if(q.lethal)api.kill(p);else if(q.kind!=='bomb')api.damage?.(p,q.damage,owner);if(q.kind==='cannon'&&Math.random()<1/3)api.explode?.(q.pos,q.owner,12);if(q.kind!=='bomb'){projectiles.delete(id);gone=true;break}}}
    if(gone||q.kind==='subspace')continue;
    const hit=api.projectileHit?.(old,q.pos,q.radius);if(hit){if(q.kind==='paintball'){api.paintPart?.(hit.id,q.color);projectiles.delete(id);gone=true;break}if(q.kind==='botrocket'){api.explode?.(q.pos,null,12);projectiles.delete(id);gone=true;break}if(q.kind==='bomb'){q.pos=old;q.velocity=[0,0,0];q.resting=true}else{q.pos=old;const axis=hit.axis??1;q.velocity[axis]=-q.velocity[axis]*(q.elasticity??.5);if(!q.lastContact||now-q.lastContact>100){q.damage*=.5;q.lastContact=now}if(q.kind==='cannon'&&Math.random()<1/3){api.explode?.(q.pos,q.owner,12);projectiles.delete(id);gone=true;break}if(q.damage<1&&q.kind==='pellet'){projectiles.delete(id);gone=true}}}
   }
   if(q.kind==='subspace'&&!gone){
    if(!q.resting||Math.hypot(...q.velocity)>.05){if(q.armedAt===null){if(q.armingAt!==null)nextBroadcast=0;q.armingAt=null;q.stillAt=null}}
    else if(q.armingAt!==null&&q.armedAt===null){
     if(now-q.armingAt>=550){q.armedAt=now;q.expiresAt=(q.stillAt??now)+120000;nextBroadcast=0}
    }else if(q.armedAt===null){if(q.stillAt===null)q.stillAt=now;else if(now-q.stillAt>=2500){q.armingAt=now;nextBroadcast=0}}
    else if(q.expirePulseUntil===null&&now>=q.nextPulseCheck){q.nextPulseCheck=now+500;if(Math.random()<.05){q.pulseStart=now;q.pulseUntil=now+550;nextBroadcast=0}}
   }
   if(q.pos[1]<(rules.killY||-100)){mineContacts.forget(q);projectiles.delete(id)}
  }
  for(const bot of bots.values()){const opponents=players().filter(p=>!bot.team||p.team!==bot.team),target=opponents.sort((a,b)=>Math.hypot(a.x-bot.pos[0],a.z-bot.pos[2])-Math.hypot(b.x-bot.pos[0],b.z-bot.pos[2]))[0];if(now>=bot.next){bot.next=now+random(1500,3500);const bias=target?norm([target.x-bot.pos[0],0,target.z-bot.pos[2]]):[0,0,0],d=norm([random(-100,100)+bias[0]*80,random(-40,40),random(-100,100)+bias[2]*80]);bot.goal=bot.pos.map((v,k)=>k===1?Math.max(10-rules.offset,Math.min(80-rules.offset,v+d[k]*40)):v+d[k]*40)}bot.pos=bot.pos.map((v,k)=>v+(bot.goal[k]-v)*(1-Math.exp(-dt)));if(target&&now>=bot.fireAt){bot.fireAt=now+random(2500,5500);const d=norm([target.x-bot.pos[0],target.y+2.5-bot.pos[1],target.z-bot.pos[2]]);spawn('botrocket',bot.pos.map((v,k)=>v+d[k]*8),d.map(v=>v*60),null,{life:6000,gravity:0,damage:1000})}for(const p of opponents)if(Math.hypot(p.x-bot.pos[0],p.y+2.5-bot.pos[1],p.z-bot.pos[2])<5)api.kill(p)}
  for(const r of regens){if(r.restoring&&now>=r.restoring){api.regenerate?.(r.names);r.restoring=0;r.at=now+random(.2,1)*(rules.regenTime||120)*1000}else if(!r.restoring&&now>=r.at){api.removeGroups?.(r.names);r.restoring=now+(rules.regenDelay||4)*1000;message('Regenerating '+r.names.join(' and ')+'…')}}
  if(rules.kind==='glass-houses'){if(!roundWarned&&now>=nextRegen-30000){roundWarned=true;message('30 seconds left until end of game!')}if(!roundEnding&&now>=nextRegen){roundEnding=now+2000;const totals={Red:0,Blue:0};for(const p of api.players())totals[p.team==='Red Hawks'?'Red':'Blue']+=p.kos||0;message(totals.Red===totals.Blue?'Red and Blue tied!':(totals.Red>totals.Blue?'Red':'Blue')+' won the match by '+Math.abs(totals.Red-totals.Blue)+' points!')}if(roundEnding&&now>=roundEnding){nextRegen=now+307000;roundEnding=0;roundWarned=false;api.regenerate?.(['RedTeamRegen','BlueTeamRegen']);bots.clear();if(rules.killbot)summon(null,rules.killbot.center);message('Rebalancing teams and launching new game…')}}
  if(now>=nextBroadcast){nextBroadcast=now+200;api.effects?.({now,difficulty:diff,objects:[...projectiles.values(),...bots.values()].filter(q=>!q.born||q.born<=now).map(q=>serializeObj(q,now))})}
 }
 function mineSegmentHit(a,b,r=.5){let best=null;for(const q of projectiles.values()){if(q.kind!=='subspace')continue;const half=q.radius+r;let lo=0,hi=1;for(let k=0;k<3;k++){const d=b[k]-a[k],mn=q.pos[k]-half,mx=q.pos[k]+half;if(Math.abs(d)<1e-9){if(a[k]<mn||a[k]>mx){hi=-1;break}}else{let x=(mn-a[k])/d,y=(mx-a[k])/d;if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y)}}if(lo<=hi&&lo>=0&&lo<=1&&(!best||lo<best.t))best={id:q.id,t:lo,pos:a.map((v,k)=>v+(b[k]-v)*lo)}}return best}
 function blastTrigger(pos,radius,now=api.now()){let n=0;for(const q of projectiles.values()){if(q.kind!=='subspace'||q.armedAt===null||q.blastAt!==null)continue;const d=Math.hypot(...q.pos.map((v,k)=>Math.max(0,Math.abs(v-pos[k])-q.radius)));if(d<radius){if(q.triggeredAt===null)q.triggeredAt=now;q.blastAt=now+300;nextBroadcast=0;n++}}return n}
 return {tick,touch,activate,touching,rocketHit:mineSegmentHit,blastTrigger,destroyBot(id){return bots.delete(id)},snapshot(){const now=api.now();return {now,difficulty:diff,objects:[...projectiles.values(),...bots.values()].filter(q=>!q.born||q.born<=now).map(q=>serializeObj(q,now))}},getState:()=>({difficulty:diff,projectiles:projectiles.size,bots:bots.size})};
}
if(typeof window!=='undefined'){window.CreatePlaceScriptEngine=createPlaceScriptEngine;window.MineSparkleTargets=mineSparkleTargets;}
