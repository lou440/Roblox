function createObbyWorld(){
 const parts=[],signs=[],colors=[[.3,.84,.48,1],[.28,.62,1,1],[1,.57,.2,1],[.74,.32,1,1]];
 const add=(center,size,color)=>{const p={center,size,color,walkable:true};parts.push(p);return p};
 add([0,-1,0],[32,2,32],[.23,.28,.35,1]);
 const dirs=[[0,-1],[1,0],[0,1],[-1,0]],names=['Easy Obby','Normal Obby','Hard Obby','Insane Obby'];
 dirs.forEach(([dx,dz],k)=>{const c=colors[k],across=[-dz,dx];add([dx*28,-.5,dz*28],[dx?24:7,1,dz?24:7],c);add([dx*43,-.5,dz*43],[12,1,12],c);
 const post=[dx*23+across[0]*4,3,dz*23+across[1]*4];add(post,[.4,6,.4],[.28,.21,.16,1]);signs.push({center:[post[0],7,post[2]],text:names[k],color:c});
 let distance=50,height=0;const count=[18,26,34,42][k],width=[6,4,2.5,1.35][k],gap=[3,4.3,5.4,6.2][k];
 for(let i=0;i<count;i++){const len=[5,3.5,2.5,1.5][k];distance+=gap+len;const offset=k===0?Math.sin(i*.6)*2:Math.sin(i*1.7)*[0,2,2.5,2][k];height+=(i%6<3?.45:-.45);const center=[dx*distance+across[0]*offset,height-.5,dz*distance+across[1]*offset];add(center,[dx?len:width,1,dz?len:width],i%2?c:c.map((v,j)=>j===3?1:v*.8));}
 distance+=8;add([dx*distance,-.5,dz*distance],[12,1,12],c);signs.push({center:[dx*distance,4,dz*distance],text:names[k]+' • Finish!',color:c});
 });
 return {parts,collisionParts:parts,seats:[],stairs:[],climbables:[],signs,ground:0,platform:{top:-9999},carpetPickup:{center:[0,-9999,0],radius:0},tv:null};
}
window.CreateObbyWorld=createObbyWorld;