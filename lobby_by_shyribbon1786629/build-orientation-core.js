/* Draft: discrete, right-handed quarter-turn orientations for pre-placement builds.
 * The ID list is deterministic: do not reorder it after any blocks are saved. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuildOrientation=factory()})(globalThis,function(){'use strict';
 const I=[1,0,0,0,1,0,0,0,1];
 const turns={x:[1,0,0,0,0,-1,0,1,0],y:[0,0,1,0,1,0,-1,0,0],z:[0,-1,0,1,0,0,0,0,1]};
 const mul=(a,b)=>Array.from({length:9},(_,i)=>{const r=Math.floor(i/3),c=i%3;return a[3*r]*b[c]+a[3*r+1]*b[3+c]+a[3*r+2]*b[6+c]});
 const vec=(m,v)=>[0,1,2].map(r=>m[3*r]*v[0]+m[3*r+1]*v[1]+m[3*r+2]*v[2]);
 const matrices=[I],index=new Map([[I.join(','),0]]);
 for(let n=0;n<matrices.length;n++)for(const axis of ['x','y','z']){const m=mul(turns[axis],matrices[n]),key=m.join(',');if(!index.has(key)){index.set(key,matrices.length);matrices.push(m)}}
 if(matrices.length!==24)throw Error('Invalid orientation group');
 const valid=id=>Number.isInteger(id)&&id>=0&&id<24;
 function matrix(id){if(!valid(id))throw new RangeError('Invalid orientation');return matrices[id].slice()}
 function advance(id,axis){if(!valid(id)||!Object.hasOwn(turns,axis))throw new RangeError('Invalid rotation');return index.get(mul(turns[axis],matrices[id]).join(','))}
 function orientedParts(parts,id){if(!valid(id))throw new RangeError('Invalid orientation');if(!Array.isArray(parts)||!parts.length)return[];if(id===0)return parts.map(p=>({...p}));const m=matrices[id],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of parts){for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p.center[k]-p.size[k]/2);hi[k]=Math.max(hi[k],p.center[k]+p.size[k]/2)}}const pivot=lo.map((v,i)=>(v+hi[i])/2),out=parts.map(p=>{const offset=p.center.map((v,i)=>v-pivot[i]),rotated=vec(m,offset);return {...p,center:rotated.map((v,i)=>v+pivot[i]),matrix:p.matrix?mul(m,p.matrix):m.slice()}});let bottom=Infinity;for(const p of out){const a=p.matrix,half=(Math.abs(a[3])*p.size[0]+Math.abs(a[4])*p.size[1]+Math.abs(a[5])*p.size[2])/2;bottom=Math.min(bottom,p.center[1]-half)}const dy=lo[1]-bottom;for(const p of out)p.center[1]+=dy;return out}
 return Object.freeze({matrix,advance,orientedParts,valid,count:24});
});
