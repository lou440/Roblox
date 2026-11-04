/* Camera-directed flight and blocky rainbow trail inspired by public gear
 * 225921000. Body movers, collision and interpolation are browser adapters. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RainbowCarpet=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const colors=[[1,0,0,1],[1,.5,0,1],[1,1,0,1],[0,1,0,1],[0,1,1,1],[0,0,1,1],[.5,0,1,1]],IDENTITY=[1,0,0,0,1,0,0,0,1],ROOT_HEIGHT=3,CARPET_OFFSET=-1.86;
 const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d)};
 function rootFrame(A,p,rootOffset=ROOT_HEIGHT){const a=-(p.flightPitch||0),c=Math.cos(a),s=Math.sin(a),root=A.yawFrame(p.x,p.y+rootOffset,p.z,p.yaw+Math.PI),tilt=A.fromCFrame({position:[0,0,0],rotation:[1,0,0,0,c,-s,0,s,c]});return A.multiply(root,tilt)}
 function carpetFrame(A,p,rootOffset=ROOT_HEIGHT){return A.multiply(rootFrame(A,p,rootOffset),A.fromCFrame({position:[0,CARPET_OFFSET,0],rotation:IDENTITY}))}
 function carpetCenter(p){const yaw=p.yaw+Math.PI,pitch=p.flightPitch||0,z=-CARPET_OFFSET*Math.sin(pitch);return[p.x+Math.sin(yaw)*z,p.y+ROOT_HEIGHT+CARPET_OFFSET*Math.cos(pitch),p.z+Math.cos(yaw)*z]}
 function create(){let active=false,trail=[],last=null,stamp=0;
  function stop(p){const wasActive=active;active=false;last=null;if(p&&wasActive){p.vy=0;p.grounded=false;p.seated=false;p.flightPitch=0}}
  function toggle(p){if(active){stop(p);return false}active=true;p.seated=false;p.grounded=false;p.vy=0;p.y+=.45;p.flightPitch=0;last=null;return true}
  function track(p,t,moving=true){const pos=carpetCenter(p);trail=trail.filter(x=>t-x.at<3);if(!last){last=pos.slice();stamp=t;return}const distance=Math.hypot(...sub(pos,last));if(moving&&distance>.05&&t-stamp>=.1){trail.push({a:last,b:pos,at:t});last=pos.slice();stamp=t}else if(!moving){last=pos.slice();stamp=t}}
  function step(dt,p,camera,held,t,contacts){if(!active)return;let f=(held.has('KeyW')||held.has('ArrowUp')?1:0)-(held.has('KeyS')||held.has('ArrowDown')?1:0),s=(held.has('KeyD')?1:0)-(held.has('KeyA')?1:0),n=Math.hypot(f,s)||1;f/=n;s/=n;const cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch),sy=Math.sin(camera.yaw),cy=Math.cos(camera.yaw),v=[-sy*cp*f*90+cy*s*60,-sp*f*90,-cy*cp*f*90-sy*s*60];
   const count=Math.max(1,Math.ceil(Math.hypot(...v)*dt/.2));for(let i=0;i<count;i++){const dx=v[0]*dt/count,dy=v[1]*dt/count,dz=v[2]*dt/count;if(!contacts){p.x+=dx;p.y+=dy;p.z+=dz;continue}const oldY=p.y;let ny=oldY+dy;if(dy>0){const ceiling=contacts.ceiling(p.x,p.z,oldY,ny);if(ceiling!==null)ny=ceiling}else if(dy<0){const top=contacts.stairTop(p.x,p.z,oldY,false);if(top!==null&&ny<top)ny=top}p.y=ny;const pass=(x,z)=>!contacts.blocked(x,z,p.y,false,p.x,p.z);if(pass(p.x+dx,p.z+dz)){p.x+=dx;p.z+=dz}else if(pass(p.x+dx,p.z))p.x+=dx;else if(pass(p.x,p.z+dz))p.z+=dz;}p.vy=0;p.grounded=false;p.gliding=false;p.moving=Math.hypot(...v)>1;p.yaw=camera.yaw-Math.PI;p.flightPitch=camera.pitch;track(p,t,p.moving);
  }
  function frames(A,p){return [{type:'carpet0',frame:carpetFrame(A,p)}]}
  function ribbons(t){trail=trail.filter(x=>t-x.at<3);return trail.flatMap(seg=>{const delta=sub(seg.b,seg.a),len=Math.hypot(...delta);if(len<.01)return [];const forward=norm(delta),reference=Math.abs(dot(forward,[0,1,0]))>.98?[1,0,0]:[0,1,0],right=norm(cross(reference,forward)),up=norm(cross(forward,right)),mid=seg.a.map((v,i)=>(v+seg.b[i])/2);return colors.map((c,i)=>{const center=mid.map((v,k)=>v+right[k]*(i-3)*.5),frame=[...right,0,...up,0,...forward,0,...center,1];return {size:[.5,.5,len+3.5],frame,color:[...c.slice(0,3),.9]}})})}
  return Object.freeze({toggle,stop,step,track,frames,ribbons,rootFrame,carpetFrame,carpetCenter,get active(){return active}});
 }
 return Object.freeze({create,rootFrame,carpetFrame,carpetCenter});
});
