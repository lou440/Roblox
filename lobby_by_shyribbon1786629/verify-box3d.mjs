import {createPhysics} from './box3d-physics.mjs';
import assert from 'node:assert/strict';
const floor={center:[0,-.5,0],size:[100,1,100]},dt=1/60;
const player=()=>({x:0,y:0,z:0,vy:0,grounded:true});
async function run(name,parts,frames,input,check){
 const p=player(),sim=await createPhysics({obstacles:{collisionParts:[floor,...parts]}});let rise=0;
 try{for(let i=0;i<frames;i++){const y=p.y,[dx,dz]=input(i,p);sim.step(p,dx,dz,dt,196.2);rise=Math.max(rise,p.y-y);assert(Number.isFinite(p.y))}check(p,rise);console.log('PASS',name)}finally{sim.destroy()}
}
await run('smooth .6-stud stairs',Array.from({length:8},(_,i)=>({center:[0,(i+1)*.6/2,-3-i*1.5],size:[5,(i+1)*.6,1.5]})),70,()=>[0,-16*dt],(p,r)=>{assert(p.y>4.6&&p.z<-13);assert(r<.2)});
await run('2-stud obstacle blocks without a snap or wall climbing',[{center:[0,1,-3],size:[8,2,1.5]}],100,()=>[0,-16*dt],p=>{assert(p.z>-2&&Math.abs(p.y)<.06)});
await run('diagonal wall sliding',[{center:[0,6,-3],size:[80,12,1]}],100,()=>[.18,-.18],p=>{assert(p.x>17&&p.z>-1.8)});
await run('ceiling stops a jump, then lands',[{center:[0,6,0],size:[30,.5,30]}],100,(i,p)=>{if(i===4){p.vy=50;p.grounded=false}return[0,0]},p=>{assert(Math.abs(p.y)<.06&&p.grounded)});
await run('unobstructed jump is not pulled down by ground adhesion',[],12,(i,p)=>{if(i===1){p.vy=50;p.grounded=false}return[0,0]},p=>{assert(p.y>4&&!p.grounded)});
{
 const obstacle={center:[0,5,-3],size:[20,10,1]},o={collisionParts:[floor,obstacle]},sim=await createPhysics({obstacles:o}),p=player();
 try{for(let i=0;i<15;i++)sim.step(p,0,-16*dt,dt,196.2);assert(p.z>-1.8);o.collisionParts=[floor];o.collisionParts.contactVersion=1;for(let i=0;i<15;i++)sim.step(p,0,-16*dt,dt,196.2);assert(p.z<-4);console.log('PASS incremental collider removal')}finally{sim.destroy()}
}
