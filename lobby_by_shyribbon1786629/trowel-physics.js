/* Bounded, inelastic trowel simulation. Bricks start at rest; no 120 Hz SAT stack solver. */
(()=>{'use strict';const cache=new WeakMap();
function index(parts){const grid=new Map();for(const p of parts){const e=p.rotation?extent(p):p.size.map(v=>v/2);p._extent=e;for(let x=Math.floor((p.center[0]-e[0])/8);x<=Math.floor((p.center[0]+e[0])/8);x++)for(let z=Math.floor((p.center[2]-e[2])/8);z<=Math.floor((p.center[2]+e[2])/8);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p)}}return grid}
function extent(p){const y=p.yaw||0,c=Math.abs(Math.cos(y)),s=Math.abs(Math.sin(y));return [(c*p.size[0]+s*p.size[2])/2,p.size[1]/2,(s*p.size[0]+c*p.size[2])/2]}
function query(grid,x,z){return grid.get(Math.floor(x/8)+','+Math.floor(z/8))||[]}
function planarHit(p,q){const delta=[p.center[0]-q.center[0],p.center[2]-q.center[2]],pa=p.yaw||0,qa=q.yaw||0,axes=[[Math.cos(pa),-Math.sin(pa)],[Math.sin(pa),Math.cos(pa)],[Math.cos(qa),-Math.sin(qa)],[Math.sin(qa),Math.cos(qa)]],radius=(body,yaw,n)=>Math.abs(n[0]*Math.cos(yaw)-n[1]*Math.sin(yaw))*body.size[0]/2+Math.abs(n[0]*Math.sin(yaw)+n[1]*Math.cos(yaw))*body.size[2]/2;let depth=Infinity,normal;
for(const n of axes){const d=delta[0]*n[0]+delta[1]*n[1],overlap=radius(p,pa,n)+radius(q,qa,n)-Math.abs(d);if(overlap<=.001)return null;if(overlap<depth){depth=overlap;normal=n.map(v=>v*Math.sign(d||1))}}return{depth,normal}}
function step(parts,dt,geometry){if(!dt||!parts.length)return;let saved=cache.get(geometry);if(!saved||saved.version!==(geometry.contactVersion||0)){saved={version:geometry.contactVersion||0,grid:index(geometry)};cache.set(geometry,saved)}const tail=parts[parts.length-1]?.id;if(saved.count===parts.length&&saved.tail===tail&&parts.every(p=>p.asleep))return;saved.count=parts.length;saved.tail=tail;const bricks=index(parts),h=Math.min(dt,1/20);
for(const p of parts){const e=p._extent,old=p.center.slice(),bottom=old[1]-e[1];let floor=Math.abs(old[0])<256&&Math.abs(old[2])<256?0:-100;
 const nearby=new Set([...query(saved.grid,old[0],old[2]),...query(bricks,old[0],old[2])]);
 for(const q of nearby){if(q===p)continue;const f=q._extent,top=q.center[1]+f[1],yaw=q.yaw||0,dx=old[0]-q.center[0],dz=old[2]-q.center[2],lx=dx*Math.cos(yaw)-dz*Math.sin(yaw),lz=dx*Math.sin(yaw)+dz*Math.cos(yaw);if(top<=bottom+.06&&Math.abs(lx)<q.size[0]/2+Math.min(.4,e[0])&&Math.abs(lz)<q.size[2]/2+Math.min(.4,e[2]))floor=Math.max(floor,top)}
 if(p.asleep){if(bottom>floor+.08)p.asleep=false;else continue}
 p.velocity[1]-=80*h;for(let i=0;i<3;i++)p.center[i]+=p.velocity[i]*h;
 // Resolve only nearby world/wall AABBs, once, without rotational impulses.
 for(const q of nearby){if(q===p)continue;const vertical=e[1]+q._extent[1]-Math.abs(p.center[1]-q.center[1]);if(vertical<=.001)continue;const hit=planarHit(p,q);if(!hit)continue;if(vertical<hit.depth){p.center[1]+=Math.sign(p.center[1]-q.center[1]||1)*(vertical+.001);p.velocity[1]=0}else{const [nx,nz]=hit.normal;p.center[0]+=nx*(hit.depth+.001);p.center[2]+=nz*(hit.depth+.001);const closing=p.velocity[0]*nx+p.velocity[2]*nz;if(closing<0){if(q.velocity&&-closing>.6){q.asleep=false;q.velocity[0]-=nx*(-closing)*.35;q.velocity[2]-=nz*(-closing)*.35}p.velocity[0]-=nx*closing;p.velocity[2]-=nz*closing}}}
 if(p.center[1]-e[1]<=floor+.02){p.center[1]=floor+e[1];p.velocity[1]=0;p.velocity[0]*=Math.exp(-6*h);p.velocity[2]*=Math.exp(-6*h);if(Math.hypot(...p.velocity)<.12){p.velocity.fill(0);p.asleep=true}}
 p.angular.fill(0);p.velocity[0]*=Math.exp(-2*h);p.velocity[2]*=Math.exp(-2*h);
}}
window.TrowelPhysics={step};})();
