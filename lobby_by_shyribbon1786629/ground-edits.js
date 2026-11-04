/* Ground digging for Free Build maps: heightfield columns over the baseplate.
 * Dirt is generated only around edits ("on demand"); unedited maps keep the
 * original single baseplate part so untouched worlds behave byte-identically.
 * Grid: 128x128 plate-aligned columns cover the 512x512 baseplate exactly
 * (column gx spans world x [gx*4, gx*4+4]); 64x64 tiles hold 2x2 columns.
 * Build blocks (centers on multiples of 4) sit on column boundaries by design.
 */
(()=>{'use strict';
const CELL=4, BEDROCK=-20, DIRT_BOTTOM=-20.5, DIG_STEP=2, BOUND=60, THICK=0.5;
const PLATE=512, PLATE_MIN=-256, TILES=PLATE/8; // 64
const GRASS=[0.46,0.65,0.43,1], DIRT=[0.384,0.255,0.176,1];
/* Spawn-zone guard. Free Build maps set buildAnywhere (cli #2883 opted OUT of
 * spawn protection there — both maps also configure spawnZones:[] server-side),
 * so digging near spawns is ALLOWED on freebuild; the defaults below only apply
 * to hypothetical protected maps, and the server re-validates authoritatively
 * from its own config-driven SPAWN_ZONES. */
const SPAWN_ZONES=[{x0:-45,x1:45,z0:-133,z1:-63},{x0:-90,x1:70,z0:-50,z1:8}];
const MAX_EDITS=20000;

const heights=new Map();       // "gx,gz" -> surface height h (<= 0)
const tileParts=new Map();     // "tx,tz" -> parts[] (current geometry per tile)
let house=null, obstacles=null, baseplatePart=null, otherParts=null, staticRef=null;
let groundParts=[], active=false, plateRemoved=false;

const key=(gx,gz)=>gx+','+gz;
const valid=(gx,gz)=>Number.isInteger(gx)&&Number.isInteger(gz)&&Math.abs(gx)<=BOUND&&Math.abs(gz)<=BOUND;
function inSpawn(gx,gz){
  if(window.MapSelection?.buildAnywhere)return false; // freebuild: no spawn protection (cli #2883)
  const x=gx*CELL+CELL/2,z=gz*CELL+CELL/2;
  return SPAWN_ZONES.some(r=>Math.hypot(Math.max(r.x0-x,0,x-r.x1),Math.max(r.z0-z,0,z-r.z1))<=40)
}
const tileOf=g=>Math.floor((g-PLATE_MIN/CELL)/2);            // column -> tile index
const tileColumn=(t,i)=>PLATE_MIN/CELL+2*t+i;                // tile + 0/1 -> column
const tileCenter=t=>PLATE_MIN+t*8+4;                          // tile center coordinate
const colCenter=g=>g*CELL+CELL/2;                             // column center coordinate

function box(cx,cy,cz,sx,sy,sz,color,tag){
  return {id:'ground:'+tag, name:'Ground', className:'Part', center:[cx,cy,cz], size:[sx,sy,sz],
    matrix:[1,0,0,0,1,0,0,0,1], color, shape:'box', canCollide:true, anchored:true, walkable:true,
    group:0, groundPart:true};
}
function columnHeight(gx,gz){return heights.get(key(gx,gz))}
function neighborEdited(gx,gz){
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    if(!dx&&!dz)continue;
    if(heights.has(key(gx+dx,gz+dz)))return true;
  }
  return false;
}
/* One tile of geometry. States:
 * EMPTY   -> no explicit parts here; intact tiles are merged into large
 *            rectangles by rebuildGroundParts (lazy chunks), so an unedited
 *            map keeps ~1-4 big boxes instead of 4096 tiles.
 * BORDER  -> grass tile box + full dirt slab below (a hole touches this tile).
 * EDITED  -> per column: edited -> dirt [h..DIRT_BOTTOM]; untouched -> grass cap
 *            [0..-0.5] + dirt column below. Hole floors sit at h; walls are the
 *            dirt sides of this or the border tile. */
function computeTile(tx,tz){
  const cx=tileCenter(tx), cz=tileCenter(tz), cols=[];
  let edited=false, border=false;
  for(let dx=0;dx<2;dx++)for(let dz=0;dz<2;dz++){
    const gx=tileColumn(tx,dx), gz=tileColumn(tz,dz);
    const h=columnHeight(gx,gz);
    cols.push({gx,gz,h});
    if(h!==undefined)edited=true;
    else if(neighborEdited(gx,gz))border=true;
  }
  if(!edited&&!border)return null;
  if(!edited){ // border: keep grass, add dirt slab underneath
    return [box(cx,-THICK/2,cz,8,THICK,8,GRASS,'tile:'+tx+','+tz),
            box(cx,(DIRT_BOTTOM-THICK)/2,cz,8,(-THICK)-DIRT_BOTTOM,8,DIRT,'slab:'+tx+','+tz)];
  }
  const parts=[];
  for(const c of cols){
    if(c.h!==undefined){
      parts.push(box(colCenter(c.gx),(c.h+DIRT_BOTTOM)/2,colCenter(c.gz),CELL,c.h-DIRT_BOTTOM,CELL,DIRT,'col:'+c.gx+','+c.gz));
    }else{
      parts.push(box(colCenter(c.gx),-THICK/2,colCenter(c.gz),CELL,THICK,CELL,GRASS,'cap:'+c.gx+','+c.gz));
      parts.push(box(colCenter(c.gx),(DIRT_BOTTOM-THICK)/2,colCenter(c.gz),CELL,(-THICK)-DIRT_BOTTOM,CELL,DIRT,'under:'+c.gx+','+c.gz));
    }
  }
  return parts;
}
function refreshTiles(list){
  for(const t of list){
    const k=t.tx+','+t.tz, p=computeTile(t.tx,t.tz);
    if(p&&p.length)tileParts.set(k,p);else tileParts.delete(k);
  }
}
/* Surface decomposition. Explicit parts only exist for EDITED/BORDER tiles;
 * every intact (EMPTY) tile is merged into maximal grass rectangles:
 * horizontal runs per tile row, then runs with identical [start,end] merge
 * vertically. One dig -> ~4 big boxes + the local cutout instead of 4096 tiles. */
let strategy='lazy';
function mergedEmptyBoxes(){
  const rows=[];
  for(let tz=0;tz<TILES;tz++){
    const runs=[];let start=null;
    for(let tx=0;tx<TILES;tx++){
      if(tileParts.has(tx+','+tz)){if(start!==null){runs.push({s:start,e:tx-1,done:false});start=null}}
      else if(start===null)start=tx;
    }
    if(start!==null)runs.push({s:start,e:TILES-1,done:false});
    rows.push(runs);
  }
  const out=[];
  for(let tz=0;tz<TILES;tz++)for(const run of rows[tz]){
    if(run.done)continue;
    let end=tz;
    while(end+1<TILES){
      const cand=rows[end+1].find(r=>!r.done&&r.s===run.s&&r.e===run.e);
      if(!cand)break;
      end++;cand.done=true;
    }
    const w=(run.e-run.s+1)*8,d=(end-tz+1)*8;
    out.push(box(PLATE_MIN+run.s*8+w/2,-THICK/2,PLATE_MIN+tz*8+d/2,w,THICK,d,GRASS,'merged:'+run.s+'-'+run.e+'/'+tz+'-'+end));
  }
  return out;
}
function naiveTiledBoxes(){
  const out=[];
  for(let tx=0;tx<TILES;tx++)for(let tz=0;tz<TILES;tz++){
    if(!tileParts.has(tx+','+tz))out.push(box(tileCenter(tx),-THICK/2,tileCenter(tz),8,THICK,8,GRASS,'tile:'+tx+','+tz));
  }
  return out;
}
function rebuildGroundParts(){
  const out=[];
  for(const p of tileParts.values())out.push(...p);
  out.push(...(strategy==='lazy'?mergedEmptyBoxes():naiveTiledBoxes()));
  groundParts=out;
  return out;
}
function syncWorld(){
  if(!house)return;
  house.parts.length=0;
  house.parts.push(...otherParts,...groundParts);
  if(obstacles)obstacles.replaceStaticParts(window.SFOTHCollision.build(house.parts));
  if(staticRef)staticRef.setParts(house.parts);
}
function activate(){
  if(active||!house)return false;
  baseplatePart=house.parts.find(p=>p&&p.size&&p.size[0]>=PLATE-0.01&&p.size[2]>=PLATE-0.01&&Math.abs(p.center[1])<=THICK);
  if(!baseplatePart)return false;
  otherParts=house.parts.filter(p=>p!==baseplatePart);
  recomputeAll();
  active=true;
  if(!plateRemoved){plateRemoved=true;window.__characterPhysics?.removeGroundPlate?.();}
  syncWorld();
  return true;
}
function recomputeAll(){
  const dirty=[];
  for(let tx=0;tx<TILES;tx++)for(let tz=0;tz<TILES;tz++)dirty.push({tx,tz});
  refreshTiles(dirty);
  rebuildGroundParts();
}
function applyEdit(gx,gz,h){
  heights.set(key(gx,gz),h);
  if(!active){if(!activate())return false}
  const dirty=[];
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const tx=tileOf(gx+dx),tz=tileOf(gz+dz);
    if(tx>=0&&tx<TILES&&tz>=0&&tz<TILES)dirty.push({tx,tz});
  }
  refreshTiles(dirty);
  rebuildGroundParts();
  syncWorld();
  return true;
}
function dig(gx,gz,opts={}){
  if(!house&&!findHouse())return {ok:false,notice:'Ground is not diggable on this map.'};
  if(!valid(gx,gz))return {ok:false,notice:'Outside the diggable area.'};
  if(inSpawn(gx,gz))return {ok:false,notice:'Too close to spawn. Move further away to dig.'};
  const cur=columnHeight(gx,gz)??0;
  if(cur<=BEDROCK)return {ok:false,notice:'You hit the bottom of the world.'};
  if(heights.size>=MAX_EDITS&&!heights.has(key(gx,gz)))return {ok:false,notice:'This world has reached its digging limit.'};
  const h=Math.max(BEDROCK,cur-DIG_STEP);
  if(!applyEdit(gx,gz,h))return {ok:false,notice:'Ground is not diggable on this map.'};
  persistLocal(opts.persist!==false);
  return {ok:true,h,dug:DIG_STEP};
}
function applyRemote(msg){
  if(!msg||!valid(msg.gx,msg.gz)||!Number.isFinite(msg.h))return false;
  if(msg.h>=0||msg.h<BEDROCK)return false;   // a real dig is below the surface and not under bedrock
  const cur=columnHeight(msg.gx,msg.gz);
  if(cur!==undefined&&msg.h>=cur)return false; // edits only deepen; stale/older updates ignored
  return applyEdit(msg.gx,msg.gz,msg.h);
}
/* Chunked server sync: the server sends {edits, reset:true} for the first
 * chunk (state is replaced) then {edits} chunks that merge in. Edits only
 * deepen, so chunk order within a sync does not matter. */
function applySync(msg){
  if(!msg||!Array.isArray(msg.edits))return {ok:false};
  if(msg.reset)heights.clear();
  let added=0;
  for(const e of msg.edits){
    if(Array.isArray(e)&&valid(e[0],e[1])&&Number.isFinite(e[2])&&e[2]<0&&e[2]>=BEDROCK){
      const cur=heights.get(key(e[0],e[1]));
      if(cur===undefined||e[2]<cur){heights.set(key(e[0],e[1]),e[2]);added++}
    }
  }
  if(!heights.size){if(active)reset();return {ok:true,edits:0,added}}
  if(!active){if(!house)findHouse();if(!activate())return {ok:false}}
  else{recomputeAll();syncWorld()}
  return {ok:true,edits:heights.size,added};
}
function applySnapshot(edits){
  heights.clear();
  if(Array.isArray(edits))for(const e of edits){
    if(Array.isArray(e)&&valid(e[0],e[1])&&Number.isFinite(e[2])&&e[2]<0&&e[2]>=BEDROCK)heights.set(key(e[0],e[1]),e[2]);
  }
  if(!heights.size){if(active)reset();return {ok:true,edits:0}} // empty snapshot fully deactivates (same as empty reset sync)
  if(!active){if(!house)findHouse();if(!activate())return {ok:false}}
  else{recomputeAll();syncWorld()}
  return {ok:true,edits:heights.size};
}
function reset(){
  heights.clear();
  if(active){
    // Full deactivation: the original baseplate part comes back byte-identically
    // (collision is restored via the map part itself; the removed direct physics
    // body stays removed, which is equivalent).
    house.parts.length=0;
    house.parts.push(...otherParts,baseplatePart);
    if(obstacles)obstacles.replaceStaticParts(window.SFOTHCollision.build(house.parts));
    if(staticRef)staticRef.setParts(house.parts);
    tileParts.clear();
    groundParts=[];
    active=false;
  }
  return true;
}
function findHouse(){
  house=window.DemoHouse||null;
  obstacles=window.DemoObstacles||null;
  return !!house;
}
/* Offline persistence (mirrors the offline build wording/limits path). */
function storeKey(){return 'groundEdits:'+(window.MapSelection?.id||'offline')}
function persistLocal(on){
  if(on!==true||!window.localStorage||!active)return false;
  try{
    const flat=[...heights.entries()].slice(0,MAX_EDITS).map(([k,h])=>{const [gx,gz]=k.split(',').map(Number);return [gx,gz,h]});
    window.localStorage.setItem(storeKey(),JSON.stringify({map:window.MapSelection?.id||null,edits:flat}));
    return true;
  }catch{return false}
}
function loadLocal(){
  if(!window.localStorage)return null;
  try{
    const raw=window.localStorage.getItem(storeKey());
    if(!raw)return null;
    const data=JSON.parse(raw);
    if(!data||data.map!==(window.MapSelection?.id||null))return null;
    return data.edits||null;
  }catch{return null}
}
function clearLocal(){try{window.localStorage?.removeItem(storeKey())}catch{}}
/* Direct offline-reload entry point (integration target): called from
 * enterOffline() next to GridWorld?.snapshot(loadOfflineBuilds()) — the same
 * real state change the offline builds use. Idempotent, so the secondary
 * mp:offline-changed listener can coexist safely. */
function reloadOffline(){return applySnapshot(loadLocal()||[])}
function columnAt(x,z){return {gx:Math.floor(x/CELL),gz:Math.floor(z/CELL)}}
function partsFor(){return groundParts.slice()}
function getState(){
  return {active,renderActive:active,edits:heights.size,parts:groundParts.length,
    bedrock:BEDROCK,digStep:DIG_STEP,bounds:BOUND,maxEdits:MAX_EDITS,
    tiles:tileParts.size,diggable:!!(house||window.DemoHouse)};
}
function attach(){findHouse()}
function adopt(sw){staticRef=sw||null;if(active)syncWorld()}
/* In-memory state clears on world reset, but the offline localStorage save is
 * kept (same contract as offline builds) and is reloaded whenever the client
 * re-enters offline mode via mp:offline-changed. */
window.addEventListener('mp:world-reset',()=>{reset()});
window.addEventListener('mp:offline-changed',e=>{if(e&&e.detail&&e.detail.offline)applySnapshot(loadLocal()||[])});
window.GroundEdits=Object.freeze({dig,applyRemote,applySnapshot,applySync,reloadOffline,reset,columnAt,partsFor,getState,attach,adopt,persistLocal,loadLocal,clearLocal,
  _test:{key,valid,inSpawn,tileOf,tileColumn,computeTile,columnHeight,activate,applyEdit,heights,tileParts,findHouse,neighborEdited,recomputeAll,rebuildGroundParts,mergedEmptyBoxes,naiveTiledBoxes,setStrategy:s=>{strategy=s},getStrategy:()=>strategy,colCenter,tileCenter,DIG_STEP,BEDROCK,DIRT_BOTTOM,BOUND,TILES,GRASS,DIRT}});
})();
