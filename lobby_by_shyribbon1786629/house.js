/* Player-scaled social park: one storey, generous clearances, batched boxes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DemoHouse=factory()})(globalThis,function(){'use strict';
const parts=[],collisionParts=[],seats=[],stairs=[],climbables=[],floor=.15;
const C={cream:[.91,.88,.79,1],wood:[.48,.30,.20,1],teal:[.12,.43,.45,1],blue:[.19,.48,.71,1],orange:[.94,.48,.22,1],yellow:[.99,.76,.27,1],grass:[.39,.59,.39,1],path:[.78,.78,.70,1]};
function add(center,size,color=C.cream,solid=true){const p={center,size,color,walkable:true};parts.push(p);if(solid)collisionParts.push(p);return p}
function rounded(center,size,color,shape='sphere',solid=false){const p=add(center,size,color,solid);p.shape=shape;return p}
function tree(x,z,h=10){rounded([x,h*.28,z],[.8,h*.56,.8],C.wood,'cylinder',true);rounded([x,h*.76,z],[7.5,h*.63,7],[.24,.43,.29,1]);rounded([x-1.8,h*.64,z+.4],[5,h*.4,5],[.30,.51,.34,1]);rounded([x+1.6,h*.8,z-1],[4.8,h*.45,4.8],[.36,.56,.36,1]);rounded([x,.014,z],[8,.025,7.5],[.32,.50,.32,1],'cylinder')}
function bench(x,z,facing){add([x,1.85,z],[8,.3,2],C.wood);for(const a of [-3,3])add([x+a,.9,z],[.4,1.8,1.7],[.16,.22,.23,1]);for(let i=0;i<3;i++)add([x,2.55+i*.38,z-facing*.9],[8,.23,.24],C.wood);for(const a of [-2.5,0,2.5])seats.push({center:[x+a,z],seatTop:2,yaw:facing>0?0:Math.PI,triggerHalf:[1.1,1.9],floor:0})}
// A continuous pale promenade, circular planting beds and warm timber furniture.
add([0,.015,-33],[9,.03,62],[.83,.80,.72,1],false);add([-29,.018,-18],[58,.035,7],[.83,.80,.72,1],false);add([29,.018,-18],[58,.035,7],[.83,.80,.72,1],false);
rounded([0,.035,-18],[23,.035,23],[.83,.80,.72,1],'ring');rounded([0,.055,-18],[17,.05,17],[.39,.58,.38,1],'cylinder');rounded([0,.08,-18],[9,.06,9],[.27,.46,.30,1],'cylinder');
for(const [x,z]of [[-17,-48],[17,-48],[-22,-3],[22,-3],[-87,-15],[-37,-48]])tree(x,z,10);
for(const x of [-12,12])for(const z of [-54,-3]){rounded([x,2.6,z],[.23,5.2,.23],[.14,.20,.20,1],'cylinder');rounded([x,5.25,z],[.9,1.05,.9],[.96,.89,.65,1])}
add([0,.075,-98],[88,.15,68],[.66,.55,.42,1]);
// 88 x 68 house, 24-stud clear ceiling, 16-stud open entrance.
add([-26,12,-64],[36,24,.8]);add([26,12,-64],[36,24,.8]);add([0,21,-64],[16,6,.8]);
add([0,12,-132],[88,24,.8]);
for(const x of [-44,44]){add([x,2,-98],[.8,4,68]);add([x,21,-98],[.8,6,68]);for(const z of [-129,-98,-67])add([x,11,z],[.8,14,6]);}
add([0,24.6,-98],[90,1.2,70],[.17,.28,.32,1]);
for(const x of [-8.7,8.7])add([x,8.7,-63.3],[.7,17.4,1.2],C.wood);add([0,17.5,-63.3],[18.1,.7,1.2],C.wood);
// Window mullions and ceiling lights: visual-only trim never snags players.
for(const x of [-43.5,43.5])for(const z of [-114,-82]){add([x,11,z],[.18,14,.25],C.wood,false);add([x,11,z],[.18,.25,25],C.wood,false)}
for(const x of [-23,23])for(const z of [-82,-113])add([x,23.85,z],[10,.15,4],[1,.93,.66,1],false);
function chair(x,z,targetX,targetZ,color=C.teal){const yaw=Math.atan2(targetX-x,targetZ-z);add([x,1.88,z],[1.9,.24,1.9],color);for(const a of [-.72,.72])for(const b of [-.72,.72])add([x+a,.85,z+b],[.18,1.7,.18],C.wood,false);const sx=Math.sin(yaw),cz=Math.cos(yaw);add([x-sx*.85,3.05,z-cz*.85],[Math.abs(cz)> .7?1.9:.24,2.1,Math.abs(sx)>.7?1.9:.24],color);seats.push({center:[x,z],seatTop:2,yaw,triggerHalf:[2.05,2.05],floor});}
// Meeting table: 12 chairs around a long table, room to walk around every side.
add([-23,3.2,-99],[13,.5,28],C.wood);for(const x of [-27.8,-18.2])for(const z of [-110,-88])add([x,1.5,z],[.7,3,.7],C.wood);
for(const z of [-109,-102,-95,-88]){chair(-33,z,-23,z);chair(-13,z,-23,z)}for(const x of [-26,-20]){chair(x,-116,x,-99);chair(x,-82,x,-99)}
// TV lounge: a huge shared picture screen with two rows of seats.
add([23,7.6,-127.4],[26,15.1,.8],[.055,.08,.10,1]);add([23,7.6,-126.94],[24,13.5,.06],[.10,.18,.23,1],false);
add([23,1.1,-127.5],[20,2.2,2.8],C.wood);
for(const z of [-113,-105])for(const x of [14,20,26,32])chair(x,z,x,-127,C.blue);
// Playground rubber court (scaled to five-stud-tall avatars).
rounded([-62,.04,-19],[47,.08,53],[.76,.72,.62,1],'cylinder');
// Climb-up play tower, steps .6 high and 1.5 deep; wide slide in small steps.
add([-65,5.8,-25],[9,.4,9],C.orange);for(const x of [-68.5,-61.5])for(const z of [-28.5,-21.5])add([x,4.8,z],[.5,9.6,.5],C.wood);
for(let i=0;i<10;i++){const h=(i+1)*.6,p=add([-65,h/2,-5-i*1.5],[5,h,1.5],C.wood);p.stair=true;stairs.push(p)}
add([-65,5.85,-20.1],[5,.3,2.2],C.orange);
for(const x of [-69.5,-60.5])add([x,7,-25],[.25,2.4,9],C.blue);
for(let i=0;i<20;i++){const h=6-i*.3,p=add([-65,h-.15,-29.9-i*.85],[5,.3,.85],C.orange);parts.pop();p.stair=true;collisionParts.pop()}
const pitch=Math.atan2(6,17),c=Math.cos(pitch),s=Math.sin(pitch),tilt=[1,0,0,0,c,s,0,-s,c];for(const x of [-67.65,-62.35]){const rail=add([x,3.4,-38.2],[.23,.6,18.1],[.77,.30,.20,1],false);rail.matrix=tilt}const slide=add([-65,3.15,-38.2],[5,.18,18.1],[.88,.39,.26,1]);slide.matrix=tilt;slide.collisionMatrix=tilt;slide.sitOnTouch=true;
for(const side of [-1,1]){const angle=-side*.34,cs=Math.cos(angle),sn=Math.sin(angle),roof=add([-65+side*2.4,10.4,-25],[5.4,.35,10.5],C.teal,false);roof.matrix=[cs,-sn,0,sn,cs,0,0,0,1]}add([-65,11.28,-25],[.35,.32,10.6],C.teal,false);
// Monkey bars with a climbable entry and a traversable top.
for(const x of [-48,-42])for(const z of [-10,-26])add([x,3.5,z],[.35,7,.35],C.blue);for(const x of [-48,-42])add([x,7,-18],[.35,.35,16],C.blue);for(let i=0;i<9;i++)add([-45,7,-10-i*2],[6,.25,.3],C.yellow);
for(let i=0;i<8;i++)add([-45,.4+i*.85,-10],[6,.18,.35],C.yellow);climbables.push({type:'TrussPart',center:[-45,3.5,-10],size:[6,7,.35],canCollide:true});
// Swing seats: full-size seats and walk-through clearances, not doll furniture.
for(const x of [-76,-62])for(const z of [6,10])add([x,4,z],[.55,8,.55],C.wood);add([-69,8,8],[14,.65,.65],C.wood);
for(const x of [-72,-66]){for(const a of [-.9,.9])add([x+a,5,8],[.08,5,.08],[.35,.37,.38,1],false);add([x,2.45,8],[2.3,.3,1.6],C.orange);seats.push({center:[x,8],seatTop:2.6,yaw:Math.PI,triggerHalf:[1.9,1.9],floor:0})}
// Sandbox and shady park benches opposite the playground.
rounded([53,.06,-18],[26,.12,26],[.91,.82,.63,1],'cylinder');rounded([53,.09,-18],[28,.18,28],C.wood,'ring');
for(const x of [38,68])for(const z of [-35,-1])tree(x,z,11);bench(53,-36,1);bench(53,1,-1);
const platform={center:[-65,5.8,-25],size:[9,.4,9],top:6},carpetPickup={center:[-65,6.4,-25],radius:2.6};
return {parts,collisionParts,seats,stairs,climbables,beds:[],upper:[],center:[0,-98],entry:[0,-64],ground:floor,upstairs:null,platform,carpetPickup,tv:{center:[23,7.6,-126.87],size:[24,13.5]},source:'Authored single-floor social park; avatar height 5 studs'};
});