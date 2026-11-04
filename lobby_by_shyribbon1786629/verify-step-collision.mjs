import { createPhysics } from './box3d-physics.mjs';
function mk(parts){for(const p of parts){p.top=p.center[1]+p.size[1]/2;p.bottom=p.center[1]-p.size[1]/2;}return {collisionParts:parts};}
async function run(parts, start, move, frames=300){
  const phys=await createPhysics({obstacles:mk(parts)});
  const p={x:start[0],y:start[1],z:start[2],vy:0,grounded:true};
  for(let i=0;i<30;i++)phys.step(p,0,0,1/60,196.2);
  p.maxY=p.y; p.maxDrop=0; let lastY=p.y;
  for(let i=0;i<frames;i++){
    phys.step(p,move[0]/60,move[1]/60,1/60,196.2);
    p.maxY=Math.max(p.maxY,p.y); p.maxDrop=Math.max(p.maxDrop,lastY-p.y); lastY=p.y;
  }
  return p;
}
const floor={center:[0,-.5,0],size:[400,1,400]};
let pass=0,fail=0;
const check=(name,cond,extra='')=>{console.log((cond?'  PASS  ':'! FAIL  ')+name+'   '+extra); cond?pass++:fail++;};

let p=await run([floor,{center:[0,1.5,-20],size:[20,3,6]}],[0,0,0],[0,-16]);
check('3-stud ledge blocks', p.z>-18.0 && p.y<0.5, `z=${p.z.toFixed(2)} y=${p.y.toFixed(2)}`);

p=await run([floor,{center:[0,1,-20],size:[20,2,6]}],[0,0,0],[0,-16],200);
check('2-stud ledge climbs', p.maxY>1.9, `peakY=${p.maxY.toFixed(2)} finalY=${p.y.toFixed(2)}`);

p=await run([floor,{center:[0,.25,-20],size:[20,.5,4]}],[0,0,0],[0,-16],200);
check('0.5 kerb climbs', p.maxY>0.45, `peakY=${p.maxY.toFixed(2)}`);

p=await run([floor,{center:[0,.5,-20],size:[20,1,4]}],[0,0,0],[0,-16],200);
check('1-stud step climbs', p.maxY>0.95, `peakY=${p.maxY.toFixed(2)}`);

// 5 x 1-stud stair case
const stairs=[];for(let i=0;i<5;i++){const top=(i+1);stairs.push({center:[-10+i*2,top/2,-30],size:[2,top,6]});}
p=await run([floor,...stairs],[-13,0,-30],[16,0],300);
check('1-stud staircase climbs all 5', p.maxY>4.9 && p.x>0, `peakY=${p.maxY.toFixed(2)} x=${p.x.toFixed(2)}`);

// ramp of stacked boxes
const ramp=[];for(let i=0;i<12;i++)ramp.push({center:[-6+i*1, .25+i*.5, -60], size:[1.2, .5+i, 8]});
p=await run([floor,...ramp],[-20,0,-60],[16,0],300);
check('ramp walkable', p.maxY>3, `peakY=${p.maxY.toFixed(2)} x=${p.x.toFixed(2)}`);

// jump arc
{
  const phys=await createPhysics({obstacles:mk([floor])});
  const j={x:0,y:0,z:0,vy:0,grounded:true};
  for(let i=0;i<30;i++)phys.step(j,0,0,1/60,196.2);
  j.vy=50;j.grounded=false;
  let peak=0,air=0;
  for(let i=0;i<180;i++){phys.step(j,0,0,1/60,196.2);peak=Math.max(peak,j.y);if(!j.grounded)air++;}
  check('jump apex ≈6.4 studs (v=50, g=196.2)', Math.abs(peak-6.37)<0.5, `peak=${peak.toFixed(2)} airtime=${(air/60).toFixed(2)}s`);
  check('lands back on floor', Math.abs(j.y)<0.06 && j.grounded, `y=${j.y.toFixed(3)} grounded=${j.grounded}`);
}
// falling from height settles
{
  const phys=await createPhysics({obstacles:mk([floor])});
  const f={x:0,y:40,z:0,vy:0,grounded:false};
  for(let i=0;i<240;i++)phys.step(f,0,0,1/60,196.2);
  check('fall from 40 settles on floor', Math.abs(f.y)<0.06 && f.grounded, `y=${f.y.toFixed(3)}`);
}
// walking off a ledge then down stairs (descend without bouncing)
{
  const down=[];for(let i=0;i<5;i++){const top=5-i;down.push({center:[10+i*2,top/2,-80],size:[2,top,6]});}
  const phys=await createPhysics({obstacles:mk([floor,...down])});
  const d={x:0,y:5,z:-80,vy:0,grounded:true};
  for(let i=0;i<20;i++)phys.step(d,0,0,1/60,196.2);
  let maxDrop=0,lastY=d.y,peak=d.y;
  for(let i=0;i<200;i++){phys.step(d,16/60,0,1/60,196.2);maxDrop=Math.max(maxDrop,lastY-d.y);lastY=d.y;peak=Math.max(peak,d.y);}
  check('descends stairs smoothly', d.y<0.6 && maxDrop<1.2, `finalY=${d.y.toFixed(2)} maxFrameDrop=${maxDrop.toFixed(2)}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);

if(fail) process.exitCode=1;
