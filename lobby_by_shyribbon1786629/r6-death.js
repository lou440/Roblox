/* Browser-only detached R6 rigid bodies. BreakJointsOnDeath and part sizes are
 * documented/source-derived; the OBB contacts, impulses, kicks, friction and
 * 3-second requested respawn are authored approximations, not the Roblox solver. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.R6Death=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const names=Object.freeze(['Torso','Head','Left Arm','Right Arm','Left Leg','Right Leg']),RESPAWN_SECONDS=3,gravity=196.2,density=4;
 const plus=(a,b)=>a.map((x,i)=>x+b[i]),minus=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,s)=>a.map(x=>x*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 function axes(p){const [x,y,z,w]=p.rotation;return [[1-2*(y*y+z*z),2*(x*y+w*z),2*(x*z-w*y)],[2*(x*y-w*z),1-2*(x*x+z*z),2*(y*z+w*x)],[2*(x*z+w*y),2*(y*z-w*x),1-2*(x*x+y*y)]]}
 function halfExtents(p){const a=axes(p);return [0,1,2].map(i=>a.reduce((sum,v,j)=>sum+Math.abs(v[i])*p.size[j]/2,0))}
 function support(p,n){const a=axes(p),o=p.center.slice();for(let i=0;i<3;i++){const d=dot(a[i],n),s=Math.abs(d)<1e-7?0:Math.sign(d)*p.size[i]/2;for(let k=0;k<3;k++)o[k]+=a[i][k]*s}return o}
 function overlap(a,b){
  const aa=axes(a),bb=axes(b),d=minus(b.center,a.center);let best=Infinity,normal=null;
  for(const raw of [...aa,...bb,...aa.flatMap(x=>bb.map(y=>cross(x,y)))]){
   const l=Math.hypot(...raw);if(l<1e-7)continue;const n=scale(raw,1/l),gap=Math.abs(dot(d,n));
   const radius=(p,ax)=>ax.reduce((sum,v,i)=>sum+Math.abs(dot(v,n))*p.size[i]/2,0),depth=radius(a,aa)+radius(b,bb)-gap;
   if(depth<0)return null;if(depth<best){best=depth;normal=scale(n,dot(d,n)<0?-1:1)}
  }return {depth:best,normal};
 }
 function inverseInertia(p,torque){if(!p.invMass)return [0,0,0];const a=axes(p),s=p.size,diag=[12*p.invMass/(s[1]*s[1]+s[2]*s[2]),12*p.invMass/(s[0]*s[0]+s[2]*s[2]),12*p.invMass/(s[0]*s[0]+s[1]*s[1])];return a.reduce((v,axis,i)=>plus(v,scale(axis,dot(axis,torque)*diag[i])),[0,0,0])}
 function velAt(p,r){return plus(p.velocity,cross(p.angular,r))}
 function apply(p,r,imp){if(!p.invMass||p.asleep)return;for(let i=0;i<3;i++)p.velocity[i]+=imp[i]*p.invMass;const turn=inverseInertia(p,cross(r,imp));for(let i=0;i<3;i++)p.angular[i]+=turn[i]}
 function denominator(p,r,n){return p.asleep?0:p.invMass+dot(n,cross(inverseInertia(p,cross(r,n)),r))}
 // Contacts use a small, inelastic rest threshold. Sleeping support bodies
 // behave as fixed until struck hard or explicitly pushed/blasted.
 function collide(a,b){const ae=halfExtents(a),be=halfExtents(b);if(a.center.some((v,i)=>Math.abs(v-b.center[i])>ae[i]+be[i]+.002))return false;const hit=overlap(a,b);if(!hit||hit.depth<1e-6)return false;const n=hit.normal;
  const initial=minus(b.velocity,a.velocity),closing=dot(initial,n);if(closing < -10){if(a.asleep){a.asleep=false;a.floorAge=0}if(b.asleep){b.asleep=false;b.floorAge=0}}
  const am=a.asleep?0:a.invMass,bm=b.asleep?0:b.invMass,total=am+bm;if(!total)return false;
  if(n[1]>.55&&bm)b.contactSupport=a;else if(n[1]<-.55&&am)a.contactSupport=b;
  const correction=Math.max(0,hit.depth-.001)*.82/total;for(let k=0;k<3;k++){a.center[k]-=n[k]*correction*am;b.center[k]+=n[k]*correction*bm}
  const pa=support(a,n),pb=support(b,scale(n,-1)),contact=scale(plus(pa,pb),.5),ra=minus(contact,a.center),rb=minus(contact,b.center),relative=minus(velAt(b,rb),velAt(a,ra)),vn=dot(relative,n),den=denominator(a,ra,n)+denominator(b,rb,n);
  if(vn<0&&den>1e-8){const j=-vn/den,imp=scale(n,j);apply(a,ra,scale(imp,-1));apply(b,rb,imp);
   const tangent=minus(relative,scale(n,vn)),tl=Math.hypot(...tangent);if(tl>1e-6){const q=scale(tangent,1/tl),td=denominator(a,ra,q)+denominator(b,rb,q),jt=Math.min(j*.5,tl/(td||1));apply(a,ra,scale(q,jt));apply(b,rb,scale(q,-jt))}}
  return true;
 }
 function floorContact(p,floor){const ext=halfExtents(p);if(p.center[1]-ext[1]>=floor)return; p.center[1]=floor+ext[1];const r=minus(support(p,[0,-1,0]),p.center),v=velAt(p,r),n=[0,1,0],vn=v[1],den=denominator(p,r,n);
  if(vn<0&&den>1e-8){const j=-vn/den;apply(p,r,[0,j,0]);const tangent=[v[0],0,v[2]],l=Math.hypot(...tangent);if(l>1e-6){const t=scale(tangent,1/l),jt=Math.min(j*.55,l/(denominator(p,r,t)||1));apply(p,r,scale(t,-jt))}if(p.velocity[1]>0)p.velocity[1]=Math.min(.2,p.velocity[1])}
 }
 function spin(p,h){const [x,y,z,w]=p.rotation,[a,b,c]=p.angular;p.rotation=[x+(a*w+b*z-c*y)*h/2,y+(-a*z+b*w+c*x)*h/2,z+(a*y-b*x+c*w)*h/2,w+(-a*x-b*y-c*z)*h/2];const l=Math.hypot(...p.rotation)||1;p.rotation=p.rotation.map(v=>v/l)}
 function body(v,velocity=[0,0,0],angular=[0,0,0],fixed=false){const mass=Math.max(.2,v.size[0]*v.size[1]*v.size[2]*density);return {name:v.name||'world',center:v.center.slice(),size:v.size.slice(),rotation:(v.rotation||[0,0,0,1]).slice(),velocity:(v.velocity||velocity).slice(),angular:(v.angular||angular).slice(),invMass:fixed?0:1/mass}}
 function layOnBroadFace(p,h,floor){const basis=axes(p),m=Math.min(...p.size),choices=[0,1,2].filter(i=>p.size[i]<=m+1e-6),i=choices.reduce((best,j)=>Math.abs(basis[j][1])>Math.abs(basis[best][1])?j:best,choices[0]),from=basis[i],to=[0,from[1]<0?-1:1,0],c=cross(from,to),q=[...c,1+dot(from,to)],n=Math.hypot(...q)||1,[x,y,z,w]=q.map(v=>v/n),[a,b,d,e]=p.rotation,target=[w*a+x*e+y*d-z*b,w*b-x*d+y*e+z*a,w*d+x*b-y*a+z*e,w*e-x*a-y*b-z*d],blend=Math.min(1,3*h),mixed=p.rotation.map((v,k)=>v+(target[k]-v)*blend),length=Math.hypot(...mixed)||1;p.rotation=mixed.map(v=>v/length);p.center[1]=floor+halfExtents(p)[1]}
 function initialize(p){if(!Number.isFinite(p.invMass))p.invMass=1/Math.max(.2,p.size[0]*p.size[1]*p.size[2]*density);p.rotation||=[0,0,0,1];p.velocity||=[0,0,0];p.angular||=[0,0,0];p.rest||=0;return p}
 function pushPlayer(parts,x,z,y,ox,oz){const dx=x-ox,dz=z-oz,speed=Math.hypot(dx,dz);if(speed<1e-9)return false;const avatar={center:[x,y+2.5,z],size:[1.6,5,1.6],rotation:[0,0,0,1]},previous={...avatar,center:[ox,y+2.5,oz]};let touched=false;for(const p of parts){const radius=Math.hypot(...p.size)/2;if(Math.abs(x-p.center[0])>.8+radius||Math.abs(z-p.center[2])>.8+radius||Math.abs(y+2.5-p.center[1])>2.5+radius)continue;const hit=overlap(avatar,p);if(!hit||Math.abs(hit.normal[1])>.8)continue;const old=overlap(previous,p),nx=hit.normal[0],nz=hit.normal[2],horizontal=Math.hypot(nx,nz)||1,ux=nx/horizontal,uz=nz/horizontal;if(old&&dx*ux+dz*uz<=0)continue;initialize(p);p.asleep=false;p.rest=0;p.floorAge=0;const strength=Math.min(.65,12*p.invMass),correction=Math.min(.1,hit.depth+.002)*strength;p.center[0]+=dx*strength+ux*correction;p.center[2]+=dz*strength+uz*correction;const along=p.velocity[0]*ux+p.velocity[2]*uz,amount=Math.max(0,Math.min(1,6-along))*strength/p.invMass,up=Math.max(-p.size[1]/2,Math.min(p.size[1]/2,y+2.5-p.center[1]));apply(p,[0,up*.2,0],[ux*amount,0,uz*amount]);touched=true}return touched}
 const worldCache=new WeakMap();
 function fixedGrid(world){const grid=new Map();for(const p of world){const e=halfExtents(p);for(let x=Math.floor((p.center[0]-e[0])/8);x<=Math.floor((p.center[0]+e[0])/8);x++)for(let z=Math.floor((p.center[2]-e[2])/8);z<=Math.floor((p.center[2]+e[2])/8);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p)}}return grid}
 function contactPass(parts,world,grid,avatar){
  if(parts.length<24){for(let a=0;a<parts.length;a++)for(let b=a+1;b<parts.length;b++)if(!parts[a].asleep||!parts[b].asleep)collide(parts[a],parts[b]);}
  else{ // Sweep-and-prune: SAT only for overlapping AABBs, not every brick pair.
   const list=parts.map(p=>{const e=halfExtents(p);return{p,e,min:p.center[0]-e[0],max:p.center[0]+e[0]}}).sort((a,b)=>a.min-b.min);
   for(let i=0;i<list.length;i++){const a=list[i];for(let j=i+1;j<list.length&&list[j].min<=a.max+.01;j++){const b=list[j];if(a.p.asleep&&b.p.asleep)continue;if(Math.abs(a.p.center[1]-b.p.center[1])>a.e[1]+b.e[1]+.01||Math.abs(a.p.center[2]-b.p.center[2])>a.e[2]+b.e[2]+.01)continue;collide(a.p,b.p)}}
  }
  for(const p of parts)if(!p.asleep){const e=halfExtents(p),near=new Set();for(let x=Math.floor((p.center[0]-e[0])/8);x<=Math.floor((p.center[0]+e[0])/8);x++)for(let z=Math.floor((p.center[2]-e[2])/8);z<=Math.floor((p.center[2]+e[2])/8);z++)for(const box of grid.get(x+','+z)||[])near.add(box);for(const box of near)collide(p,box);if(avatar)collide(p,avatar)}
 }
 function stepBodies(parts,dt,surface=()=>0,obstacles=[],player=null){let remaining=Math.max(0,Math.min(.1,dt));for(const p of parts)initialize(p);let cached=worldCache.get(obstacles),version=obstacles.contactVersion||0;for(const p of parts){if(p.worldContactVersion!==version){if(p.worldContactVersion!==undefined){p.asleep=false;p.floorAge=0;p.supportBody=null}p.worldContactVersion=version}}if(!cached||cached.version!==version){cached={version,fixed:obstacles.map(o=>body(o,[0,0,0],[0,0,0],true))};cached.grid=fixedGrid(cached.fixed);worldCache.set(obstacles,cached)}const world=cached.fixed.slice(),members=new Set(parts);if(parts.every(p=>p.asleep&&(!p.supportBody||(members.has(p.supportBody)&&p.supportBody.asleep))))return;if(player)world.push(body({center:[player.x,(player.y||0)+2.5,player.z],size:[1.6,5,1.6]},[0,0,0],[0,0,0],true));
  while(remaining>1e-8){const h=Math.min(remaining,1/120);remaining-=h;for(const p of parts){if(p.asleep&&p.supportBody&&(!members.has(p.supportBody)||!p.supportBody.asleep)){p.asleep=false;p.floorAge=0}p.contactSupport=null}for(const p of parts){if(p.asleep)continue;if(p.bodyBlastRemaining>0){const elapsed=Math.min(h,p.bodyBlastRemaining);p.velocity=plus(p.velocity,scale(p.bodyBlastDirection,p.bodyBlastAcceleration*elapsed));p.bodyBlastRemaining-=elapsed}const ext=halfExtents(p),oldBottom=p.center[1]-ext[1];p.velocity[1]-=gravity*h;for(let i=0;i<3;i++)p.center[i]+=p.velocity[i]*h;spin(p,h);const floor=surface(p.center[0],p.center[2],oldBottom,halfExtents(p));if(floor!==null&&Number.isFinite(floor))floorContact(p,floor);const damp=Math.exp(-2.4*h),spinSpeed=Math.hypot(...p.angular),spinCap=spinSpeed>8?8/spinSpeed:1;for(let i=0;i<3;i++)p.angular[i]*=damp*spinCap}
   for(let iteration=0;iteration<6;iteration++)contactPass(parts,world,cached.grid,player?world[world.length-1]:null);
   for(const p of parts){if(p.asleep)continue;const floor=surface(p.center[0],p.center[2],p.center[1]-halfExtents(p)[1],halfExtents(p)),floorSupported=floor!==null&&Number.isFinite(floor)&&p.center[1]-halfExtents(p)[1]<=floor+.04;if(floorSupported)floorContact(p,floor);const supported=floorSupported||!!p.contactSupport;
    if(supported){p.supportBody=!floorSupported&&p.contactSupport?.invMass?p.contactSupport:null;p.floorAge=(p.floorAge||0)+h;const linear=Math.exp(-6*h),angular=Math.exp(-12*h);p.velocity[0]*=linear;p.velocity[2]*=linear;for(let i=0;i<3;i++)p.angular[i]*=angular;if(floorSupported&&p.floorAge>.7&&Math.hypot(p.velocity[0],p.velocity[2])<2.5)layOnBroadFace(p,h,floor);if(p.floorAge>1&&Math.hypot(p.velocity[0],p.velocity[2])<1.5&&Math.abs(p.velocity[1])<5&&(Math.hypot(...p.angular)<6||p.floorAge>3)&&(!p.supportBody||(p.supportBody.asleep&&(overlap(p,p.supportBody)?.depth??0)<.01))){p.asleep=true;p.velocity=[0,0,0];p.angular=[0,0,0]}}else{p.floorAge=0;p.supportBody=null}}

  }
 }
 function create(snapshots,velocity=[0,0,0],allowPartial=false){
  if(!Array.isArray(snapshots)||!snapshots.length||(!allowPartial&&(snapshots.length!==6||!names.every(n=>snapshots.some(p=>p.name===n)))))throw new Error('six R6 part snapshots required');
  const kicks=[[.15,.2,-.35],[.3,.6,.7],[-1.2,.4,.3],[1.2,.4,-.3],[-.6,.15,-.5],[.6,.15,.5]],spins=[[1.3,.35,1.1],[.8,.6,.55],[.8,-.5,-2.8],[.8,.5,2.8],[1.3,.3,-2],[1.3,-.3,2]];
  const parts=snapshots.map(p=>{const i=names.indexOf(p.name);return body(p,plus(velocity,kicks[i]||[0,0,0]),spins[i]||[0,0,0])});
  function blast(center,power=35,radius=Infinity){for(const p of parts){const d=minus(p.center,center),distance=Math.hypot(...d);if(distance-Math.hypot(...p.size)/2>radius)continue;p.bodyBlastDirection=distance>1e-9?scale(d,1/distance):[0,1,0];p.bodyBlastRemaining=.1;p.bodyBlastAcceleration=power/.1;p.asleep=false;p.rest=0;p.floorAge=0}}
  return Object.freeze({step:(dt,surface,obstacles,player)=>stepBodies(parts,dt,surface,obstacles,player),pushPlayer:(x,z,y,ox,oz)=>pushPlayer(parts,x,z,y,ox,oz),blast,getParts:()=>parts.map(p=>({name:p.name,size:p.size.slice(),center:p.center.slice(),rotation:p.rotation.slice(),velocity:p.velocity.slice(),angular:p.angular.slice(),asleep:!!p.asleep}))});
 }
 return Object.freeze({names,RESPAWN_SECONDS,create,halfExtents,overlap,stepBodies,pushPlayer});
});
