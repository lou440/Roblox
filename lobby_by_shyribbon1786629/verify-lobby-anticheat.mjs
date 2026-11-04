import fs from 'node:fs';import assert from 'node:assert/strict';
const source=fs.readFileSync('server.js','utf8');
const {room}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let now=1000000;Date.now=()=>now;const sql=[],updates=[];
const stmt={bind(){return this},async first(){return null},async all(){return {results:[]}},async run(){return {}}};
const env={DB:{async exec(s){sql.push(s)},prepare(){return Object.create(stmt)},async batch(){}}};
const host={censor:s=>s,broadcast(m){updates.push(m)}};
const c={id:'tester',userId:'tester',username:'tester',identity:'user',messages:[],send(m){this.messages.push(structuredClone(m))},close(code,reason){throw Error('closed '+code+' '+reason)}};
await room.onConnect(c,host,env);let seq=0;
async function send(m,ms=0){now+=ms;await room.onMessage(c,JSON.stringify({map:'game',...m}),host,env)}
await send({type:'hello',clientVersion:'places-4'});
await send({type:'pose',seq:++seq,x:0,y:0,z:0,yaw:0,ph:'ground'});
// Five seconds of 16-stud/sec walking, delivered as a rapid burst after a network stall.
for(let i=1;i<=50;i++)await send({type:'pose',seq:++seq,x:0,y:0,z:1.6*i,yaw:0,ph:'ground',mv:1},i===1?5000:0);
assert.equal(c.messages.filter(m=>m.type==='correction').length,0,'normal walk should not be rolled back after delayed burst');
await send({type:'equip',tool:'build',eq:1},100);
await send({type:'buildEdit',action:'build',x:0,y:0,z:22},100);
assert(c.messages.some(m=>m.type==='buildUpdate'&&m.action==='build'),'build just outside protected area must be accepted');
assert(!sql.some(s=>/^\s*DELETE\s+FROM\s+world_builds\b/i.test(s)),'loading builds must not bulk-delete persisted work');
await send({type:'pose',seq:++seq,x:500,y:0,z:80,yaw:0,ph:'ground'},100);
assert(c.messages.some(m=>m.type==='correction'&&m.reason==='movement'),'large instantaneous teleport must still be rejected');
const correction=c.messages.findLast(m=>m.type==='correction');
// After a correction, a player may have continued moving while the response
// travelled over the network. A 30-stud / 25-stud drift must acknowledge once.
await send({type:'pose',seq:++seq,x:0,y:25,z:110,yaw:0,ph:'jump',recoveryId:correction.recovery,recoveryDone:true},500);
await send({type:'pose',seq:++seq,x:0,y:25,z:111,yaw:0,ph:'ground'},100);
assert.equal(c.messages.filter(m=>m.type==='correction').length,1,'legitimate recovery acknowledgement must not cause a correction loop');
await send({type:'pose',seq:++seq,x:500,y:25,z:111,yaw:0,ph:'ground'},100);
const next=c.messages.findLast(m=>m.type==='correction');
await send({type:'pose',seq:++seq,x:500,y:25,z:111,yaw:0,ph:'ground',recoveryId:next.recovery,recoveryDone:true},100);
await room.onTick(host,env);
const update=c.messages.findLast(m=>m.type==='poses');
assert(update&&update.players.some(p=>p.id==='tester'&&p.x===0),'recovery acknowledgement must not admit a 500-stud warp');
// A stalled connection may coalesce the entire five seconds into a single pose.
const c2={id:'coalesced',userId:'coalesced',username:'coalesced',identity:'user',messages:[],send(m){this.messages.push(structuredClone(m))},close(code,reason){throw Error('closed '+code+' '+reason)}};
await room.onConnect(c2,host,env);
async function send2(m,ms=0){now+=ms;await room.onMessage(c2,JSON.stringify({map:'game',...m}),host,env)}
await send2({type:'hello',clientVersion:'places-4'});
await send2({type:'pose',seq:1,x:0,y:0,z:0,yaw:0,ph:'ground'});
await send2({type:'pose',seq:2,x:0,y:0,z:80,yaw:0,ph:'ground',mv:1},5000);
assert.equal(c2.messages.filter(m=>m.type==='correction').length,0,'coalesced normal walk must not be rolled back');
// A very slow or stalled connection can lose a longer stretch of updates.
const c3={id:'slow',userId:'slow',username:'slow',identity:'user',messages:[],send(m){this.messages.push(structuredClone(m))},close(code,reason){throw Error('closed '+code+' '+reason)}};
await room.onConnect(c3,host,env);
async function send3(m,ms=0){now+=ms;await room.onMessage(c3,JSON.stringify({map:'game',...m}),host,env)}
await send3({type:'hello',clientVersion:'places-4'});
await send3({type:'pose',seq:1,x:0,y:0,z:0,yaw:0,ph:'ground'});
await send3({type:'pose',seq:2,x:0,y:0,z:240,yaw:0,ph:'ground',mv:1},15000);
assert.equal(c3.messages.filter(m=>m.type==='correction').length,0,'15-second slow-network walk must not be rolled back');
console.log('PASS slow-network and burst walking, lobby building, no bulk delete, bounded recovery, large teleport rejection');
