import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const c={console,window:null};c.window=c;vm.createContext(c);for(const f of ['arena-contacts.js','sfoth-collision.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const g=JSON.parse(fs.readFileSync('sword-map.json','utf8')),offset=g.spawns[1].center[1];for(const p of g.parts)p.center[1]-=offset;
c.DemoHouse={collisionParts:c.SFOTHCollision.build(g.parts),stepHeight:c.SFOTHCollision.stepHeight,maxStepHeight:c.SFOTHCollision.maxStepHeight,stairs:[],seats:[],platform:{},carpetPickup:{},climbables:[]};vm.runInContext(fs.readFileSync('demo-obstacles.js','utf8'),c);const O=c.DemoObstacles;
function walk(points,y){let [x,z]=points[0];for(const [nx,nz] of points.slice(1)){const count=Math.ceil(Math.hypot(nx-x,nz-z)/.1),sx=x,sz=z;for(let i=1;i<=count;i++){const tx=sx+(nx-sx)*i/count,tz=sz+(nz-sz)*i/count;assert(!O.blocked(tx,tz,y,true,x,z),'Blocked at '+[tx,y,tz]);x=tx;z=tz;const top=O.stairTop(x,z,y,true);if(top!==null&&top>y&&top-y<=O.maxStepHeight&&O.ceiling(x,z,y,top)===null)y=top;}}return y;}
const main=walk([[-30,0],[-49,0]],0);assert(main>9&&main<10);
const snake=walk([[14.5,-103],[14.5,-102],[-11,-102],[-11,-112],[21,-112],[21,-137]],.8);assert(snake>30);
assert(O.blocked(110.1,0,-10,true,109.1,0),'Tall tower must remain blocked');assert(!O.blocked(-33.1,0,0,true,-32.9,0),'First stair should be walkable');assert(O.stairTop(-35,0,0,false)<1,'Airborne players must not auto-step');
console.log('PASS: real SFOTH main staircase and turning tower staircase walked without jumping; tall walls blocked; no airborne step-up.');
