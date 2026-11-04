/* Bounded character ZIP / OBJ reader. Supports R6 and named R15 exports, material splits and nested folders. */
(function(root){'use strict';
const decoder=new TextDecoder(),base=s=>s.replace(/\\/g,'/').split('/').pop().toLowerCase();
async function unzip(buffer){
 if(buffer.byteLength>32*1024*1024)throw Error('ZIP exceeds 32 MB');
 const d=new DataView(buffer),a=new Uint8Array(buffer);let end=-1;
 for(let p=a.length-22;p>=Math.max(0,a.length-65557);p--)if(d.getUint32(p,true)===0x06054b50){end=p;break}
 if(end<0)throw Error('Not a complete ZIP archive. Re-download it; do not upload the download webpage.');
 const count=d.getUint16(end+10,true);if(count===65535)throw Error('ZIP64 archives are not supported');if(count>128)throw Error('Too many files in ZIP (128 maximum)');
 let p=d.getUint32(end+16,true),total=0;const files=Object.create(null);
 for(let i=0;i<count;i++){
  if(p+46>a.length||d.getUint32(p,true)!==0x02014b50)throw Error('Truncated ZIP directory');
  const flags=d.getUint16(p+8,true),method=d.getUint16(p+10,true),size=d.getUint32(p+20,true),length=d.getUint32(p+24,true),n=d.getUint16(p+28,true),extra=d.getUint16(p+30,true),comment=d.getUint16(p+32,true),at=d.getUint32(p+42,true);if(p+46+n+extra+comment>a.length)throw Error('Truncated ZIP filename');
  const name=decoder.decode(a.subarray(p+46,p+46+n));p+=46+n+extra+comment;
  if(!/\.(obj|mtl|png|jpe?g|webp)$/i.test(name)||name.startsWith('__MACOSX/'))continue;
  total+=length;if(total>96*1024*1024||length>48*1024*1024)throw Error(name+': unpacked character exceeds safe size limits');
  if(flags&1)throw Error(name+': password-protected ZIPs are not supported');
  if(at+30>a.length||d.getUint32(at,true)!==0x04034b50)throw Error(name+': damaged ZIP header');
  const start=at+30+d.getUint16(at+26,true)+d.getUint16(at+28,true);if(start+size>a.length)throw Error(name+': truncated ZIP data');
  let bytes=a.slice(start,start+size);
  if(method===8){try{bytes=root.fflate.inflateSync(bytes,{out:new Uint8Array(length)})}catch(e){throw Error(name+': DEFLATE decoding failed ('+e.message+')')}}else if(method!==0)throw Error(name+': ZIP compression method '+method+' is not supported. Repack as standard ZIP.');
  if(bytes.length!==length)throw Error(name+': incorrect unpacked size');files[base(name)]=bytes;
 }return files;
}
function parseMtl(text){const materials=Object.create(null);let m=null;for(const line of text.split(/\r?\n/)){const s=line.trim().split(/\s+/),key=s.shift();if(key==='newmtl')materials[s.join(' ')]=m={color:[1,1,1,1]};else if(m&&key==='Kd')m.color=s.slice(0,3).map(Number).concat(1);else if(m&&key==='map_Kd'){const match=line.match(/([^"\s]+\.(?:png|jpe?g|webp))"?\s*$/i);m.texture=base(match?match[1]:s.join(' ').replace(/^"|"$/g,''))}}return materials}
function parseObj(text){const positions=[],normals=[],uvs=[],groups=[];let group=null,material='',groupName='body';const idx=(s,len)=>{const n=Number(s);return n<0?len+n:n-1};let triangles=0;
 const fresh=()=>{group={name:groupName,v:[],u:[],material,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};groups.push(group)};
 for(const line of text.split(/\r?\n/)){const s=line.split('#')[0].trim().split(/\s+/),key=s.shift();
  if(key==='v')positions.push(s.slice(0,3).map(Number));else if(key==='vn')normals.push(s.slice(0,3).map(Number));else if(key==='vt')uvs.push(s.slice(0,2).map(Number));
  else if(key==='g'||key==='o'){groupName=s.join(' ');group=null}
  else if(key==='usemtl'){material=s.join(' ');group=null}
  else if(key==='f'){
   if(!group)fresh();const points=s.map(v=>{const q=v.split('/');return {p:positions[idx(q[0],positions.length)],n:normals[idx(q[2],normals.length)],u:uvs[idx(q[1],uvs.length)]}});
   for(let i=1;i<points.length-1;i++){if(++triangles>300000)throw Error('Character mesh exceeds 300,000 triangles');const t=[points[0],points[i],points[i+1]];if(t.some(q=>!q.p||q.p.some(x=>!Number.isFinite(x))))throw Error('OBJ contains invalid vertices');const e=t[1].p.map((v,k)=>v-t[0].p[k]),f=t[2].p.map((v,k)=>v-t[0].p[k]),cross=[e[1]*f[2]-e[2]*f[1],e[2]*f[0]-e[0]*f[2],e[0]*f[1]-e[1]*f[0]],length=Math.hypot(...cross)||1;
    for(const q of t){group.v.push(...q.p,...(q.n||cross.map(x=>x/length)));group.u.push(q.u?.[0]||0,1-(q.u?.[1]||0));for(let k=0;k<3;k++){group.min[k]=Math.min(group.min[k],q.p[k]);group.max[k]=Math.max(group.max[k],q.p[k])}}
   }
  }
 }return groups.filter(g=>g.v.length);
}
const bounds=groups=>{const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const g of groups)for(let i=0;i<3;i++){min[i]=Math.min(min[i],g.min[i]);max[i]=Math.max(max[i],g.max[i])}return {min,max,center:min.map((v,i)=>(v+max[i])/2),volume:min.reduce((a,v,i)=>a*(max[i]-v),1)}};
function namedPart(name){const n=name.split(/[.:|]/).pop().toLowerCase().replace(/[^a-z0-9]/g,'');if(n==='head')return 'Head';if(n==='torso'||n==='uppertorso'||n==='lowertorso')return 'Torso';for(const side of ['left','right']){if([side+'arm',side+'upperarm',side+'lowerarm',side+'hand'].includes(n))return (side==='left'?'Left':'Right')+' Arm';if([side+'leg',side+'upperleg',side+'lowerleg',side+'foot'].includes(n))return (side==='left'?'Left':'Right')+' Leg'}return null}
async function build(buffer){const files=await unzip(buffer),objects=Object.keys(files).filter(n=>n.endsWith('.obj')).sort((a,b)=>files[b].length-files[a].length);if(!objects.length)throw Error('No character OBJ in this ZIP. Use Character Downloader, not a Roblox place/project ZIP.');const materials=Object.create(null);for(const n of Object.keys(files).filter(n=>n.endsWith('.mtl')))Object.assign(materials,parseMtl(decoder.decode(files[n])));
 const obj=objects[0],groups=parseObj(decoder.decode(files[obj])),byName=new Map();for(const g of groups){if(!byName.has(g.name))byName.set(g.name,[]);byName.get(g.name).push(g)}
 const entities=[...byName].map(([name,chunks])=>({name,chunks,...bounds(chunks),part:namedPart(name)}));let body=entities.filter(g=>g.part);
 if(new Set(body.map(g=>g.part)).size!==6){body=entities.filter(g=>/^Player[ _-]?\d+$/i.test(g.name));
  if(body.length===6){const sorted=body.slice().sort((a,b)=>a.center[1]-b.center[1]),legs=sorted.slice(0,2).sort((a,b)=>a.center[0]-b.center[0]),upper=sorted.slice(2),cx=(legs[0].center[0]+legs[1].center[0])/2,central=upper.slice().sort((a,b)=>Math.abs(a.center[0]-cx)-Math.abs(b.center[0]-cx)).slice(0,2).sort((a,b)=>a.center[1]-b.center[1]),arms=upper.filter(g=>!central.includes(g)).sort((a,b)=>a.center[0]-b.center[0]);central[0].part='Torso';central[1].part='Head';arms[0].part='Left Arm';arms[1].part='Right Arm';legs[0].part='Left Leg';legs[1].part='Right Leg'}
  else if(root.R15Rig.infer(body)){for(const g of body)g.part=root.R15Rig.classic[g.segment]}
  else throw Error('Unrecognized character body: '+body.length+' Player groups, '+entities.length+' objects. Export R6 or R15 from Character Downloader; OBJ must retain its body-part group names.');
 }
 const isR15=root.R15Rig.infer(body);
 const partGroups=Object.fromEntries(['Head','Torso','Left Arm','Right Arm','Left Leg','Right Leg'].map(n=>[n,body.filter(g=>g.part===n)]));if(Object.values(partGroups).some(g=>!g.length))throw Error('Character is missing a recognizable body part. Export as R6 and retry.');
 // One uniform scale and one bind space for the whole body. Independent recentering
 // discarded custom body proportions and separated R15/layered pieces.
 const centers=Object.fromEntries(Object.entries(partGroups).map(([n,es])=>[n,bounds(es).center]));
 const bodyBounds=bounds([...partGroups.Head,...partGroups['Left Leg'],...partGroups['Right Leg']]),scale=5/Math.max(.1,bodyBounds.max[1]-bodyBounds.min[1]),torso=[centers.Torso[0],bodyBounds.min[1]+3/scale,centers.Torso[2]];
 const bind={Torso:[0,0,0],Head:[0,1.5,0],'Left Arm':[-1.5,0,0],'Right Arm':[1.5,0,0],'Left Leg':[-.5,-2,0],'Right Leg':[.5,-2,0]};
 const origins=Object.fromEntries(Object.entries(bind).map(([n,p])=>[n,p.map((v,k)=>torso[k]+v/scale)]));
 const rig=isR15?root.R15Rig.build(body,torso,scale):null;
 const encode=(g,origin)=>{const v=new Float32Array(g.v);for(let i=0;i<v.length;i+=6)for(let k=0;k<3;k++)v[i+k]=(v[i+k]-origin[k])*scale;const material=materials[g.material]||{color:[.7,.7,.7,1]};if(material.texture&&!files[material.texture])throw Error('Missing texture '+material.texture+' (material '+g.material+'). Keep the OBJ, MTL and textures together in the ZIP.');return {vertices:v,uvs:new Float32Array(g.u),count:v.length/6,material}};
 const parts=Object.fromEntries(Object.entries(partGroups).map(([n,es])=>[n,es.flatMap(e=>e.chunks.map(g=>({...encode(g,origins[n]),rigPart:e.segment,bindOffset:rig?rig.nodes[e.segment].center.map((v,k)=>v-bind[n][k]):null})))]));
 // Layered exports have no skin weights. Partition their triangles in bind space
 // once at import time, then attach each chunk to its animated body segment.
 const segmentOf=p=>rig?(p==='Head'?'Head':p==='Torso'?'UpperTorso':p.split(' ')[0]+(p.includes('Arm')?'UpperArm':'UpperLeg')):null;
 const torsoB=bounds(partGroups.Torso),headB=bounds(partGroups.Head);
 const targets=rig?Object.entries(rig.nodes).filter(([n])=>n!=='Head').map(([seg,b])=>({seg,part:root.R15Rig.classic[seg],...b})):body.filter(e=>e.part!=='Head').map(e=>({seg:null,part:e.part,min:e.min.map((v,k)=>(v-torso[k])*scale),max:e.max.map((v,k)=>(v-torso[k])*scale),center:e.center.map((v,k)=>(v-torso[k])*scale)}));
 const nearest=p=>targets.reduce((best,b)=>{const distance=p.reduce((s,v,k)=>s+Math.max(b.min[k]-v,0,v-b.max[k])**2,0)+.002*p.reduce((s,v,k)=>s+(v-b.center[k])**2,0);return !best||distance<best.distance?{b,distance}:best},null).b;
 const accessories=entities.filter(e=>!body.includes(e)&&!/humanoidrootpart/i.test(e.name)).flatMap(e=>{
  const torsoHalf=(torsoB.max[0]-torsoB.min[0])/2;
  const sideways=Math.abs(e.center[0]-centers.Torso[0])>torsoHalf*.9&&e.center[1]<centers.Head[1]-.2;
  const garment=!sideways&&(e.max[1]-e.min[1])>(bodyBounds.max[1]-bodyBounds.min[1])*.3&&Math.abs(e.center[2]-centers.Torso[2])<(torsoB.max[2]-torsoB.min[2])/2+.15;
  const near=sideways?['Left Arm','Right Arm'].sort((a,b)=>Math.abs(e.center[0]-centers[a][0])-Math.abs(e.center[0]-centers[b][0]))[0]:garment?'Torso':e.max[1]>=headB.min[1]-.15?'Head':Object.keys(centers).sort((a,b)=>Math.hypot(...e.center.map((v,k)=>v-centers[a][k]))-Math.hypot(...e.center.map((v,k)=>v-centers[b][k])))[0];
  return e.chunks.flatMap(g=>{
   const pieces=new Map();
   for(let i=0;i<g.v.length;i+=18){
    const p=[0,1,2].map(k=>((g.v[i+k]+g.v[i+6+k]+g.v[i+12+k])/3-torso[k])*scale);
    const target=garment?nearest(p):{part:near,seg:segmentOf(near)},key=target.seg||target.part;
    if(!pieces.has(key))pieces.set(key,{...g,v:[],u:[],part:target.part,seg:target.seg});
    const piece=pieces.get(key);piece.v.push(...g.v.slice(i,i+18));piece.u.push(...g.u.slice(i/3,i/3+6));
   }
   return [...pieces.values()].map(piece=>({...encode(piece,e.center),part:piece.part,rigPart:piece.seg,rigOffset:rig?e.center.map((v,k)=>(v-torso[k])*scale-rig.nodes[piece.seg].center[k]):null,offset:e.center.map((v,k)=>(v-origins[piece.part][k])*scale)}));
  });
 });
 return {rig,parts,accessories,textures:Object.fromEntries(Object.entries(files).filter(([n])=>/\.(png|jpe?g|webp)$/.test(n))),name:obj.slice(0,-4)};
}
root.CharacterMesh={build};})(globalThis);