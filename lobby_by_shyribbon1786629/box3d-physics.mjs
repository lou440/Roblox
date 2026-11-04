/* Box3D capsule mover — Roblox-accurate Humanoid locomotion.
 *
 * Single-frame swept step-up (lift -> sweep -> drop -> tread/headroom check)
 * with multi-ray foot-pad ground probing, zero-drift wedge standing, downhill
 * stair/slope attachment, and static-world Poppercam camera occlusion.
 */
import Box3D from './vendor/box3d.inline.mjs';

export async function createPhysics({obstacles, baseplate=null}) {
  const b3=await Box3D(),worldDef=b3.b3DefaultWorldDef();worldDef.gravity=[0,-196.2,0];
  const world=b3.b3CreateWorld(worldDef);
  const filter=b3.b3DefaultQueryFilter(), identity=[0,0,0,1];

  const capsule={center1:[0,.8,0],center2:[0,4.2,0],radius:.8};
  const camCapsule={center1:[0,0,0],center2:[0,0,0],radius:.22};
  const STEP_HEIGHT=2.05;
  const HEAD_PROBE=0.05;
  const GROUND_RAY=2.4;
  const SNAP_DOWN=1.35;
  const MIN_WALK_SLOPE=0.20;
  const FOOT_PADS=[[0.42,0],[-0.42,0],[0,0.42],[0,-0.42],[0.68,0],[-0.68,0],[0,0.68],[0,-0.68]];

  const pos=[0,0,0],target=[0,0,0],delta=[0,0,0],vel=[0,0,0],rayOrigin=[0,0,0],down=[0,-1.9,0];
  const planes=[],pool=[],planeResult=b3.createPlaneResult();
  const staticBodies=new Map(),staticBodyIds=new Set(),extraBodies=new Map(),dynamicBodies=new Map(),dynamicShapes=new Map(),bodyParts=new Map(),pushed=new Set();
  let version=-1,pogo=0;

  const raised=[0,0,0],up=[0,0,0],across=[0,0,0],drop=[0,0,0];
  const actual=[0,0,0],stepTest=[0,0,0],camDelta=[0,0,0];

  function quaternion(p){
    if(p.rotation)return p.rotation;
    const m=p.collisionMatrix||p.matrix;if(!m)return identity;
    const a=m[0],d=m[4],f=m[8],t=a+d+f;let x,y,z,w,s;
    if(t>0){s=Math.sqrt(t+1)*2;w=s/4;x=(m[7]-m[5])/s;y=(m[2]-m[6])/s;z=(m[3]-m[1])/s}
    else if(a>d&&a>f){s=Math.sqrt(1+a-d-f)*2;w=(m[7]-m[5])/s;x=s/4;y=(m[1]+m[3])/s;z=(m[2]+m[6])/s}
    else if(d>f){s=Math.sqrt(1+d-a-f)*2;w=(m[2]-m[6])/s;x=(m[1]+m[3])/s;y=s/4;z=(m[5]+m[7])/s}
    else{s=Math.sqrt(1+f-a-d)*2;w=(m[3]-m[1])/s;x=(m[2]+m[6])/s;y=(m[5]+m[7])/s;z=s/4}
    return [x,y,z,w];
  }
  function add(p,map,key=p,dynamic=false,isStaticMap=false){
    const size=p.collisionSize||p.size,q=quaternion(p),def=b3.b3DefaultBodyDef();def.position=p.center;def.rotation=q;
    if(dynamic){def.type=p.networkOwned===false?b3.b3BodyType.b3_kinematicBody:b3.b3BodyType.b3_dynamicBody;def.linearDamping=.08;def.angularDamping=.12;def.linearVelocity=p.velocity||[0,0,0];def.angularVelocity=p.angular||[0,0,0];}
    const body=b3.b3CreateBody(world,def);bodyParts.set(body.index1,p);if(isStaticMap)staticBodyIds.add(body.index1);
    const sd=b3.b3DefaultShapeDef();
    sd.baseMaterial.friction=p.kind==='humanoid'?.12:dynamic?.35:0.55;sd.baseMaterial.restitution=dynamic?.035:0;sd.density=p.kind==='humanoid'?4:dynamic?.15:1000;
    const hx=size[0]/2,hy=size[1]/2,hz=size[2]/2;
    let shape;
    if(p.hull){const h=b3.b3CreateHull(p.hull);shape=b3.b3CreateHullShape(body,sd,h);b3.b3DestroyHull(h)}else if(p.shape==='wedge'){
      const hull=b3.b3CreateHull([-hx,-hy,-hz,hx,-hy,-hz,-hx,-hy,hz,hx,-hy,hz,-hx,hy,hz,hx,hy,hz]);
      shape=b3.b3CreateHullShape(body,sd,hull);b3.b3DestroyHull(hull);
    }else if(p.shape==='sphere'){
      if(Math.abs(hx-hy)<1e-4&&Math.abs(hy-hz)<1e-4){
        shape=b3.b3CreateSphereShape(body,sd,{center:[0,0,0],radius:Math.max(.001,hx)});
      }else{
        const points=[0,-Math.max(.001,hy),0,0,Math.max(.001,hy),0];
        for(let j=1;j<5;j++){const lat=-Math.PI/2+j*Math.PI/5;for(let i=0;i<10;i++){const a=i*Math.PI/5;points.push(Math.cos(lat)*Math.cos(a)*hx,Math.sin(lat)*hy,Math.cos(lat)*Math.sin(a)*hz)}}
        const hull=b3.b3CreateHull(points);shape=b3.b3CreateHullShape(body,sd,hull);b3.b3DestroyHull(hull);
      }
    }else if(p.shape==='cylinder'){
      const hull=b3.b3CreateHull(Array.from({length:32},(_,i)=>{const a=(i%16)*Math.PI/8;return [Math.cos(a)*hx,i<16?-hy:hy,Math.sin(a)*hz]}).flat());
      shape=b3.b3CreateHullShape(body,sd,hull);b3.b3DestroyHull(hull);
    }else {shape=b3.b3CreateBoxShape(body,sd,Math.max(.001,hx),Math.max(.001,hy),Math.max(.001,hz));}
    if(dynamic)dynamicShapes.set(shape.index1,{body,part:p});
    const r={body,shape,owned:p.networkOwned!==false,x:p.center[0],y:p.center[1],z:p.center[2],q:q.slice(),sx:size[0],sy:size[1],sz:size[2],sh:p.shape||'box',hasHull:!!p.hull,seen:0};if(dynamic){r.v=[...(p.velocity||[0,0,0])];r.a=[...(p.angular||[0,0,0])];r.mass=b3.b3Body_GetMass(body)||size[0]*size[1]*size[2]*.15;p.invMass=1/r.mass;}map.set(key,r);return r;
  }
  function update(p,r,map=null,key=p,dynamic=false,isStaticMap=false){
    const size=p.collisionSize||p.size,sh=p.shape||'box';
    if(map&&(r.sx!==size[0]||r.sy!==size[1]||r.sz!==size[2]||r.sh!==sh||r.hasHull!==!!p.hull)){
      if(isStaticMap)staticBodyIds.delete(r.body.index1);
      for(const [id,s] of dynamicShapes)if(s.body===r.body)dynamicShapes.delete(id);
      bodyParts.delete(r.body.index1);b3.b3DestroyBody(r.body);map.delete(key);
      const next=add(p,map,key,dynamic,isStaticMap);next.seen=r.seen;return next;
    }
    const q=quaternion(p);if(r.x===p.center[0]&&r.y===p.center[1]&&r.z===p.center[2]&&q.every((v,i)=>v===r.q[i]))return r;
    b3.b3Body_SetTransform(r.body,p.center,q);[r.x,r.y,r.z]=p.center;r.q[0]=q[0];r.q[1]=q[1];r.q[2]=q[2];r.q[3]=q[3];return r;
  }
  function syncStatic(){const v=obstacles.collisionParts.contactVersion||0;if(v===version)return;version=v;
    const active=new Set(obstacles.collisionParts.filter(p=>!p.removed&&p.canCollide!==false));for(const [p,r] of staticBodies)if(!active.has(p)){staticBodyIds.delete(r.body.index1);bodyParts.delete(r.body.index1);b3.b3DestroyBody(r.body);staticBodies.delete(p)}
    for(const p of active)if(!p.removed&&p.canCollide!==false){const r=staticBodies.get(p);if(r)update(p,r,staticBodies,p,false,true);else add(p,staticBodies,p,false,true)}
  }
  let generation=0;
  function syncExtras(parts){generation++;for(const p of parts){const key=p.physicsKey||p;let r=extraBodies.get(key);if(!r)r=add(p,extraBodies,key);else r=update(p,r,extraBodies,key);r.seen=generation}
    for(const [key,r] of extraBodies)if(r.seen!==generation){bodyParts.delete(r.body.index1);b3.b3DestroyBody(r.body);extraBodies.delete(key)}
  }

  function collect(_shape,buf){
    const dyn=dynamicShapes.get(_shape.index1);
    if(dyn&&dyn.part.networkOwned===false&&Math.hypot(vel[0],vel[2])>.1)globalThis.NetworkPhysics?.touch(dyn.part);
    if(dyn&&b3.getNumPlaneResults(buf)>0&&dyn.part.networkOwned!==false&&!pushed.has(dyn.body)&&Math.hypot(vel[0],vel[2])>.1){
      pushed.add(dyn.body);const mass=b3.b3Body_GetMass(dyn.body),n=Math.hypot(vel[0],vel[2]);
      b3.getPlaneResultAt(planeResult,buf,0);const pt=planeResult.point;
      b3.b3Body_GetLinearVelocity(impulseScratch,dyn.body);const speedAlong=(impulseScratch[0]*vel[0]+impulseScratch[2]*vel[2])/n,
        push=Math.max(0,Math.min(8,n*1.05-speedAlong));
      b3.b3Body_ApplyLinearImpulse(dyn.body,[mass*vel[0]/n*push,0,mass*vel[2]/n*push],
        [pos[0]+pt[0],pos[1]+pt[1],pos[2]+pt[2]],true);
    }
    for(let i=0,n=b3.getNumPlaneResults(buf);i<n;i++){
      b3.getPlaneResultAt(planeResult,buf,i);const j=planes.length;let p=pool[j];
      if(!p)p=pool[j]={plane:{normal:[0,0,0],offset:0},rawNy:0,bodyIdx:0,pushLimit:3.4e38,push:0,clipVelocity:true};
      const nrm=planeResult.plane.normal;
      p.rawNy=nrm[1];p.bodyIdx=b3.b3Shape_GetBody(_shape).index1;
      p.plane.normal[0]=nrm[0];p.plane.normal[1]=nrm[1];p.plane.normal[2]=nrm[2];
      p.plane.offset=planeResult.plane.offset;
      if(nrm[1]>0&&nrm[1]<MIN_WALK_SLOPE){const h=Math.hypot(nrm[0],nrm[2]);if(h>.001){
        p.plane.normal[0]/=h;p.plane.normal[1]=0;p.plane.normal[2]/=h;p.plane.offset/=h}}
      p.push=0;planes.push(p);
    }
    return true
  }
  const accept=()=>true;
  const acceptStaticOnly=shape=>staticBodyIds.has(b3.b3Shape_GetBody(shape).index1);

  function castMover(from,dir){return b3.b3World_CastMover(world,from,capsule,dir,filter,accept)}

  function rayDown(x,y,z,rayLen){
    rayOrigin[0]=x;rayOrigin[1]=y;rayOrigin[2]=z;
    down[1]=-rayLen;
    return b3.b3World_CastRayClosest(world,rayOrigin,down,filter);
  }

  function groundAt(at,rayLen=GROUND_RAY){
    const REST=capsule.radius,TOL=.08;
    const raw=rayDown(at[0],at[1]+REST,at[2],rayLen);
    const centerOk=!!raw.hit&&raw.normal[1]>=MIN_WALK_SLOPE;
    const centerDist=centerOk?raw.fraction*rayLen:Infinity;
    const centerRest=centerOk?REST/raw.normal[1]:REST;
    if(centerOk&&centerDist<=centerRest+TOL){
      return {ok:true,fraction:raw.fraction,raw,rayLen,rest:centerRest};
    }
    let best=centerOk?{ok:true,fraction:raw.fraction,raw,rayLen,rest:centerRest,gap:centerDist-centerRest}:null;
    for(let i=0;i<FOOT_PADS.length;i++){
      const ox=FOOT_PADS[i][0],oz=FOOT_PADS[i][1],r2=ox*ox+oz*oz;
      const sphereDrop=Math.sqrt(Math.max(0,REST*REST-r2));
      const r=rayDown(at[0]+ox,at[1]+REST,at[2]+oz,rayLen);
      if(!r.hit||r.normal[1]<0.7)continue;
      const d=r.fraction*rayLen;
      if(d<sphereDrop-.06)continue;
      const padRest=sphereDrop/r.normal[1];
      const gap=d-padRest;
      if(gap<=TOL&&(!best||gap<best.gap)){
        best={ok:true,fraction:d/rayLen,raw:r,rayLen,rest:d-Math.max(0,gap),gap};
      }
    }
    if(best)return best;
    return {ok:false,fraction:1,raw,rayLen,rest:REST};
  }

  function tryStep(origin,dx,dz){
    const maxLift=STEP_HEIGHT+HEAD_PROBE;
    up[0]=0;up[1]=maxLift;up[2]=0;
    const fUp=castMover(origin,up);
    if(fUp<=0.0001)return -1;
    const lift=maxLift*fUp;
    if(lift<0.02)return -1;
    raised[0]=origin[0];raised[1]=origin[1]+lift;raised[2]=origin[2];

    across[0]=dx;across[1]=0;across[2]=dz;
    const fAcross=castMover(raised,across);
    if(fAcross<=0.0001)return -1;
    stepTest[0]=raised[0]+dx*fAcross;stepTest[1]=raised[1];stepTest[2]=raised[2]+dz*fAcross;

    const maxDrop=lift+0.08;
    drop[0]=0;drop[1]=-maxDrop;drop[2]=0;
    const fDown=castMover(stepTest,drop);
    if(fDown>=0.9999)return -1;
    stepTest[1]+=drop[1]*fDown;

    const rise=stepTest[1]-origin[1];
    if(rise<0.005||rise>STEP_HEIGHT+0.02)return -1;

    planes.length=0;
    b3.b3World_CollideMover(world,stepTest,capsule,filter,collect);
    for(let i=0;i<planes.length;i++){
      if(planes[i].plane.normal[1]<-0.5&&planes[i].plane.offset<-0.01)return -1;
    }

    const g=groundAt(stepTest);
    if(!g.ok||g.fraction*g.rayLen>g.rest+.12){
      const len=Math.hypot(dx,dz)||1,ux=dx/len,uz=dz/len;
      const lead=rayDown(stepTest[0]+ux*.72,stepTest[1]+capsule.radius+.25,stepTest[2]+uz*.72,capsule.radius+.45);
      if(!lead.hit||lead.normal[1]<MIN_WALK_SLOPE)return -1;
    }
    return fAcross;
  }

  function step(player,dx,dz,dt,gravity){
    syncStatic();pushed.clear();
    pos[0]=player.x;pos[1]=player.y;pos[2]=player.z;
    const wasGrounded=player.grounded,ascending=player.vy>1;
    const travel=Math.hypot(dx,dz);
    vel[0]=dt>0?dx/dt:0;vel[2]=dt>0?dz/dt:0;

    const canStep=travel>.0001&&wasGrounded&&!ascending;

    const supportProbe=wasGrounded&&player.vy<=.1?groundAt(pos):null;
    const resting=!!(supportProbe?.ok&&supportProbe.fraction*supportProbe.rayLen<=supportProbe.rest+.015);
    if(!resting)player.vy-=gravity*dt;
    else if(player.vy<0)player.vy=0;
    if(player.vy<-240)player.vy=-240;

    if(resting&&travel<.0001&&!ascending&&Math.abs(player.vy)<.001){
      player.grounded=true;
      player.groundGrace=.10;
      player.stepLift=0;
      player.support=supportProbe.raw?.hit?{
        normal:Array.from(supportProbe.raw.normal).slice(),
        part:bodyParts.get(b3.b3Shape_GetBody(supportProbe.raw.shapeId).index1),
        distance:supportProbe.fraction*supportProbe.rayLen-supportProbe.rest
      }:null;
      return;
    }

    const startX=pos[0],startY=pos[1],startZ=pos[2];
    target[0]=pos[0]+dx;target[1]=pos[1]+dt*player.vy;target[2]=pos[2]+dz;

    let usedStep=false,lifted=0;
    for(let iter=0;iter<6;iter++){
      planes.length=0;b3.b3World_CollideMover(world,pos,capsule,filter,collect);
      delta[0]=target[0]-pos[0];delta[1]=target[1]-pos[1];delta[2]=target[2]-pos[2];
      if(Math.abs(delta[0])+Math.abs(delta[1])+Math.abs(delta[2])<1e-7)break;
      const solved=b3.b3SolvePlanes(delta,planes).delta;
      const f=b3.b3World_CastMover(world,pos,capsule,solved,filter,accept);
      pos[0]+=solved[0]*f;pos[1]+=solved[1]*f;pos[2]+=solved[2]*f;
      if(solved[0]*f*solved[0]*f+solved[1]*f*solved[1]*f+solved[2]*f*solved[2]*f<1e-9)break;
    }

    if(canStep){
      actual[0]=pos[0]-startX;actual[2]=pos[2]-startZ;
      const gotLen=Math.hypot(actual[0],actual[2]);
      if(gotLen<travel*.985){
        const fStep=tryStep([startX,startY,startZ],dx,dz);
        if(fStep>0){
          const gain=Math.hypot(stepTest[0]-startX,stepTest[2]-startZ);
          if(gain>gotLen+.002){
            pos[0]=stepTest[0];pos[1]=stepTest[1];pos[2]=stepTest[2];
            lifted=Math.max(0,pos[1]-startY);
            usedStep=lifted>.001;
            player.vy=0;pogo=0;
          }
        }
      }
    }

    if(!usedStep){
      planes.length=0;b3.b3World_CollideMover(world,pos,capsule,filter,collect);
      vel[1]=player.vy;
      const clipped=b3.b3ClipVector(vel,planes);
      player.vy=clipped[1];
    }

    player.x=pos[0];player.y=pos[1];player.z=pos[2];

    const ON_GROUND_TOL=.08;
    const snapReach=Math.max(SNAP_DOWN,travel*2.25);
    let probe=groundAt(pos,GROUND_RAY+snapReach);
    let dist=probe.ok?probe.fraction*probe.rayLen:Infinity;
    let grounded=usedStep||(player.vy<=.1&&probe.ok&&dist<=probe.rest+ON_GROUND_TOL);

    const canSnapDown=(wasGrounded||(player.groundGrace||0)>0)&&!ascending&&!usedStep;
    if(!grounded&&canSnapDown&&probe.ok&&dist<=probe.rest+snapReach){
      drop[0]=0;drop[1]=-Math.max(0,dist-probe.rest+.02);drop[2]=0;
      const f=castMover(pos,drop);
      pos[1]+=drop[1]*f;player.y=pos[1];
      probe=groundAt(pos,GROUND_RAY+snapReach);
      dist=probe.ok?probe.fraction*probe.rayLen:Infinity;
      grounded=probe.ok&&player.vy<=.1&&dist<=probe.rest+ON_GROUND_TOL;
    }
    let edgePart=null,edgeNormal=null;
    if(!grounded&&player.vy<=.1){
      const hasStepBelow=canSnapDown&&probe.ok&&dist<=probe.rest+snapReach;
      const minEdgeNy=hasStepBelow?MIN_WALK_SLOPE:0.55;
      stepTest[0]=pos[0];stepTest[1]=pos[1]-.06;stepTest[2]=pos[2];
      planes.length=0;b3.b3World_CollideMover(world,stepTest,capsule,filter,collect);
      for(let i=0;i<planes.length;i++){
        if(planes[i].rawNy>=minEdgeNy&&planes[i].plane.offset<=0.03){
          grounded=true;edgeNormal=planes[i].plane.normal.slice();edgePart=bodyParts.get(planes[i].bodyIdx);break;
        }
      }
    }

    player.grounded=grounded;
    player.groundGrace=grounded?.10:Math.max(0,(player.groundGrace||0)-dt);
    if(ascending&&!usedStep)player.groundGrace=0;
    player.support=probe.raw&&probe.raw.hit?{normal:Array.from(probe.raw.normal).slice(),
      part:bodyParts.get(b3.b3Shape_GetBody(probe.raw.shapeId).index1),
      distance:dist-probe.rest}:edgeNormal?{normal:edgeNormal,part:edgePart,distance:0}:null;
    const rawDelta=pos[1]-startY;
    player.stepLift=usedStep?lifted:(grounded&&wasGrounded&&!ascending&&rawDelta>travel*1.15?rawDelta:0);
    player.stepDelta=usedStep?lifted:(grounded&&wasGrounded&&!ascending&&Math.abs(rawDelta)>travel*1.15?rawDelta:0);
    if(usedStep||(player.grounded&&player.vy<0))player.vy=0;
  }

  function clipCamera(focus,desiredEye,ignoreBuildKey=null){
    syncStatic();
    camDelta[0]=desiredEye[0]-focus[0];camDelta[1]=desiredEye[1]-focus[1];camDelta[2]=desiredEye[2]-focus[2];
    const len=Math.hypot(camDelta[0],camDelta[1],camDelta[2]);
    if(len<1e-4)return 1;
    return b3.b3World_CastMover(world,focus,camCapsule,camDelta,filter,ignoreBuildKey?shape=>{const id=b3.b3Shape_GetBody(shape).index1;return staticBodyIds.has(id)&&bodyParts.get(id)?.buildKey!==ignoreBuildKey}:acceptStaticOnly);
  }

  let dynGeneration=0;
  const impulseScratch=[0,0,0],pointScratch=[0,0,0];
  function tick(dt,parts=[]){
    syncStatic();dynGeneration++;
    for(const p of parts){let r=dynamicBodies.get(p);if(!r)r=add(p,dynamicBodies,p,true);r.seen=dynGeneration;
      const owned=p.networkOwned!==false&&!p.recovering;if(r.owned!==owned){b3.b3Body_SetType(r.body,owned?b3.b3BodyType.b3_dynamicBody:b3.b3BodyType.b3_kinematicBody);r.owned=owned;r.mass=b3.b3Body_GetMass(r.body)||r.mass;}
      if(!owned||p.handoff){b3.b3Body_SetTransform(r.body,p.center,p.rotation);b3.b3Body_SetLinearVelocity(r.body,owned?p.velocity:[0,0,0]);b3.b3Body_SetAngularVelocity(r.body,owned?p.angular:[0,0,0]);p.handoff=false;for(let i=0;i<3;i++){r.v[i]=p.velocity[i];r.a[i]=p.angular[i]}if(!owned)continue;}
      if(p.velocity.some((v,i)=>Math.abs(v-r.v[i])>.0001)){
        for(let i=0;i<3;i++){impulseScratch[i]=(p.velocity[i]-r.v[i])*r.mass;pointScratch[i]=p.pushPoint?.[i]??p.center[i]}
        b3.b3Body_ApplyLinearImpulse(r.body,impulseScratch,pointScratch,true);delete p.pushPoint;
      }
      if(p.angular.some((v,i)=>Math.abs(v-r.a[i])>.0001))b3.b3Body_SetAngularVelocity(r.body,p.angular);
    }
    for(const [p,r] of dynamicBodies)if(r.seen!==dynGeneration){for(const [key,s] of dynamicShapes)if(s.body===r.body)dynamicShapes.delete(key);bodyParts.delete(r.body.index1);b3.b3DestroyBody(r.body);dynamicBodies.delete(p)}
    if(dynamicBodies.size)b3.b3World_Step(world,dt,4);
    for(const [p,r] of dynamicBodies){
      b3.b3Body_GetPosition(p.center,r.body);b3.b3Body_GetRotation(p.rotation,r.body);
      b3.b3Body_GetLinearVelocity(p.velocity,r.body);b3.b3Body_GetAngularVelocity(p.angular,r.body);
      for(let i=0;i<3;i++){r.v[i]=p.velocity[i];r.a[i]=p.angular[i]}p.asleep=!b3.b3Body_IsAwake(r.body);
    }
  }
  function sweep(player,dx,dy,dz,ignorePart=null){
    syncStatic();pos[0]=player.x;pos[1]=player.y;pos[2]=player.z;delta[0]=dx;delta[1]=dy;delta[2]=dz;
    const ignoreRecord=ignorePart?staticBodies.get(ignorePart):null;
    const f=b3.b3World_CastMover(world,pos,capsule,delta,filter,shape=>{if(!ignorePart)return true;const body=b3.b3Shape_GetBody(shape);return typeof ignorePart==='function'?!ignorePart(bodyParts.get(body.index1)):body.index1!==ignoreRecord?.body.index1});
    player.x+=dx*f;player.y+=dy*f;player.z+=dz*f;return f;
  }
  function release(part){const r=dynamicBodies.get(part);if(!r)return;for(const [id,s]of dynamicShapes)if(s.body===r.body)dynamicShapes.delete(id);bodyParts.delete(r.body.index1);b3.b3DestroyBody(r.body);dynamicBodies.delete(part)}
  function rebase(part,d){const r=dynamicBodies.get(part);if(!r)return;for(let i=0;i<3;i++)part.center[i]+=d[i];b3.b3Body_SetTransform(r.body,part.center,part.rotation)}
  function rigidCharacter(player,hull,rotation,rootHeight){const part={kind:'humanoid',hull,center:[player.x,player.y+rootHeight,player.z],size:[2,4,3],rotation:rotation.slice(),velocity:[0,player.vy,0],angular:[0,0,0],networkOwned:true};add(part,dynamicBodies,part,true);return part}
  function explode(center,radius=8,power=50){syncStatic();let affected=0;for(const [part,r]of dynamicBodies){if(part.networkOwned===false)continue;b3.b3Shape_GetClosestPoint(pointScratch,r.shape,center);const d=Math.hypot(...pointScratch.map((v,i)=>v-center[i]));if(d>=radius)continue;const delta=part.center.map((v,i)=>v-center[i]);delta[1]+=radius*.12;const n=Math.hypot(...delta)||1,strength=power*Math.pow(1-d/radius,2);for(let i=0;i<3;i++)impulseScratch[i]=delta[i]/n*strength*r.mass;b3.b3Body_ApplyLinearImpulse(r.body,impulseScratch,pointScratch,true);part.asleep=false;affected++}return affected}

  syncStatic();if(baseplate)add(baseplate,new Map(),baseplate,false,true);
  return {
    step,tick,sweep,syncExtras,explode,rigidCharacter,release,rebase,clipCamera,
    syncPart(p){const r=staticBodies.get(p);if(r)update(p,r,staticBodies,p,false,true)},
    invalidate(){version=-1},
    metrics:{stepHeight:STEP_HEIGHT,radius:capsule.radius,height:5,gravity:196.2},
    reset(){pogo=0},
    destroy(){b3.b3DestroyWorld(world)},
    getStats:()=>({engine:'Box3D',staticBodies:staticBodies.size,extraBodies:extraBodies.size,dynamicBodies:dynamicBodies.size})
  };
}
