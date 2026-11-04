/* Bounded reader for public RBXM models: string/vector/CFrame properties (with 3x3 rotation) used by avatar assets. */
(function(root){'use strict';
const NORMALS=[[1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1]];
function orientMatrix(id){
 if(!id||id<1||id>36)return[1,0,0,0,1,0,0,0,1];
 const r0=NORMALS[Math.floor((id-1)/6)],r1=NORMALS[(id-1)%6];
 const r2=[r0[1]*r1[2]-r0[2]*r1[1],r0[2]*r1[0]-r0[0]*r1[2],r0[0]*r1[1]-r0[1]*r1[0]];
 if(!r2[0]&&!r2[1]&&!r2[2])return[1,0,0,0,1,0,0,0,1];
 return[r0[0],r0[1],r0[2],r1[0],r1[1],r1[2],r2[0],r2[1],r2[2]];
}
function reader(bytes){const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);return{bytes,p:0,take(n){if(n<0||this.p+n>bytes.length)throw Error('Truncated avatar model');const b=bytes.subarray(this.p,this.p+n);this.p+=n;return b},u8(){return this.take(1)[0]},u32(){const p=this.p;this.take(4);return v.getUint32(p,true)},f32(){const p=this.p;this.take(4);return v.getFloat32(p,true)},str(){const n=this.u32();if(n>8388608)throw Error('Model string too large');return new TextDecoder().decode(this.take(n))}}}
function lz4(b,size){const out=new Uint8Array(size);let p=0,q=0;function length(n){if(n===15){let x;do{if(p>=b.length)throw Error('Invalid model compression');x=b[p++];n+=x}while(x===255)}return n}
while(p<b.length){const token=b[p++],n=length(token>>4);if(p+n>b.length||q+n>size)throw Error('Invalid model literals');out.set(b.subarray(p,p+n),q);p+=n;q+=n;if(p===b.length)break;if(p+2>b.length)throw Error('Invalid model offset');const off=b[p++]|b[p++]<<8,count=length(token&15)+4;if(!off||off>q||q+count>size)throw Error('Invalid model match');for(let i=0;i<count;i++)out[q]=out[q++-off]}
if(q!==size)throw Error('Invalid model size');return out}
function packed(r,count,float=false){const b=r.take(count*4),out=[],view=new DataView(new ArrayBuffer(4));for(let i=0;i<count;i++){let n=(b[i]*16777216+b[count+i]*65536+b[count*2+i]*256+b[count*3+i])>>>0;if(float){n=(n>>>1)|((n&1)<<31);view.setUint32(0,n,true);out.push(view.getFloat32(0,true))}else out.push(n)}return out}
async function decode(buf){const b=new Uint8Array(buf);if(new TextDecoder().decode(b.subarray(0,8))!=='<roblox!')throw Error('Unsupported avatar model');const stream=reader(b);stream.p=32;const classes=new Map(),items=[],shared=[],wanted=new Set(['Name','MeshId','TextureId','Texture','Scale','Offset','CFrame','AttachmentPoint','ShirtTemplate','PantsTemplate','Graphic']);let expanded=0;
while(stream.p<b.length){const tag=new TextDecoder().decode(stream.take(4)),compressed=stream.u32(),size=stream.u32();stream.u32();expanded+=size;if(size>8388608||expanded>16777216)throw Error('Avatar model too large');let payload=stream.take(compressed||size);if(compressed){if(payload[0]===0x28&&payload[1]===0xb5&&payload[2]===0x2f&&payload[3]===0xfd){const z=await import('./vendor/fzstd.mjs');payload=z.decompress(payload);if(payload.length!==size)throw Error('Invalid model size')}else payload=lz4(payload,size)}const r=reader(payload);
if(tag==='INST'){const id=r.u32(),name=r.str();r.u8();const count=r.u32();if(count>2000||items.length+count>2000)throw Error('Too many avatar instances');const list=Array.from({length:count},()=>({className:name,props:{}}));classes.set(id,list);items.push(...list)}
else if(tag==='SSTR'){r.u32();const count=r.u32();if(count>2000)throw Error('Too many shared model strings');for(let i=0;i<count;i++){r.take(16);shared.push(r.str())}}
else if(tag==='PROP'){const list=classes.get(r.u32()),name=r.str(),type=r.u8();if(!list||!wanted.has(name))continue;const count=list.length;let values,rots=null;
if(type===1)values=Array.from({length:count},()=>r.str());else if(type===28)values=packed(r,count).map(i=>shared[i]||'');else if(type===14||type===16){if(type===16){rots=[];for(let i=0;i<count;i++){const rotation=r.u8();if(rotation===0)rots.push(Array.from({length:9},()=>r.f32()));else rots.push(orientMatrix(rotation))}}const x=packed(r,count,true),y=packed(r,count,true),z=packed(r,count,true);values=x.map((v,i)=>[v,y[i],z[i]])}else continue;
for(let i=0;i<count;i++){list[i].props[name]=values[i];if(rots)list[i].props[name+'Rot']=rots[i]}}
else if(tag==='END\0')break;
}return items}
const api={decode};if(typeof module==='object'&&module.exports)module.exports=api;else root.RbxAvatarModel=api;
})(globalThis);
