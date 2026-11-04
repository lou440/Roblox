/* Authored TrussPart locomotion with face-relative contact, latch hysteresis
 * and swept motion. The uploaded archives contain no native climbing solver. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HumanoidClimbing=factory();})(globalThis,function(){'use strict';
 function torsoProbe(p,latched){const yaw=p.yaw||0,s=Math.sin(yaw),c=Math.cos(yaw),reach=latched?.9:.65;return {center:[p.x+s*reach,p.y+3,p.z+c*reach],size:latched?[2.4,6,1.8]:[2,2,.65],matrix:[c,0,s,0,1,0,-s,0,c]}}
 function frontContact(p,part,latched=false){return globalThis.ContactVolumes.overlap(torsoProbe(p,latched),{center:part.center,size:part.size,matrix:part.matrix})}
 function contact(p,part){const m=part.matrix||[1,0,0,0,1,0,0,0,1],d=[p.x-part.center[0],p.y+2.5-part.center[1],p.z-part.center[2]];
  const lx=m[0]*d[0]+m[3]*d[1]+m[6]*d[2],ly=m[1]*d[0]+m[4]*d[1]+m[7]*d[2],lz=m[2]*d[0]+m[5]*d[1]+m[8]*d[2],hx=part.size[0]/2,hz=part.size[2]/2;
  if(Math.abs(ly)>part.size[1]/2+2.8||Math.abs(lx)>hx+1.25||Math.abs(lz)>hz+1.25)return null;
  const ax=Math.abs(lx)-hx,az=Math.abs(lz)-hz,useX=ax>az,sign=Math.sign(useX?lx:lz)||1;
  const nx=sign*m[useX?0:2],nz=sign*m[useX?6:8],n=Math.hypot(nx,nz)||1;
  return {part,distance:Math.max(ax,az),nx:nx/n,nz:nz/n,top:part.center[1]+part.size[1]/2,bottom:part.center[1]-part.size[1]/2};
 }
 function ignoreGeometry(part){return p=>!!p&&(p===part||p.id===part.id&&part.id!==undefined||Math.abs(p.center[0]-part.center[0])<=part.size[0]/2+.05&&Math.abs(p.center[2]-part.center[2])<=part.size[2]/2+.05&&Math.abs(p.center[1]-part.center[1])<=part.size[1]/2&&p.size[1]<.4);}
 function step(p,input,dt,parts){if(p.climbCooldown>0||p.seated){p.climbing=false;p.climbSpeed=0;p.climbContact=null;return false}
  const f=input.forward||0,s=input.side||0,yaw=input.cameraYaw||0,wx=-Math.sin(yaw)*f+Math.cos(yaw)*s,wz=-Math.cos(yaw)*f-Math.sin(yaw)*s;
  let hit=p.climbContact&&contact(p,p.climbContact.part);if(!hit||!frontContact(p,hit.part,true)){hit=null;for(const part of parts||[]){if(part.type!=='TrussPart'||part.canCollide===false)continue;const c=contact(p,part);if(c&&frontContact(p,part,false)&&(!hit||c.distance<hit.distance))hit=c}}
  if(!hit){p.climbing=false;p.climbSpeed=0;p.climbContact=null;return false}
  const toward=-(wx*hit.nx+wz*hit.nz),lateral=wx*hit.nz-wz*hit.nx;
  if(p.climbExit){if(p.grounded||p.y<hit.top-.8)p.climbExit=false;else return false}
  if(!p.climbing&&(toward<.15||p.y>=hit.top-.05||Math.sin(p.yaw||0)*hit.nx+Math.cos(p.yaw||0)*hit.nz>-.35)){p.climbSpeed=0;return false}
  if(p.climbing&&Math.abs(s)>.35&&Math.abs(lateral)>.5){p.climbing=false;p.climbSpeed=0;p.climbContact=null;p.climbCooldown=.2;return false}
  p.climbing=true;p.climbContact=hit;p.grounded=false;p.vy=0;
  const desired=f*(input.walkSpeed||16)*.7;p.climbSpeed=Number.isFinite(p.climbSpeed)?p.climbSpeed:0;p.climbSpeed+=(desired-p.climbSpeed)*(1-Math.exp(-16*dt));if(Math.abs(p.climbSpeed)<.02)p.climbSpeed=0;p.moving=Math.abs(p.climbSpeed)>.05;
  let dy=p.climbSpeed*dt;dy=Math.max(hit.bottom-p.y,Math.min(hit.top-p.y,dy));
  const physics=input.physics;
  if(physics){const oldY=p.y;physics.sweep(p,0,dy,0,ignoreGeometry(hit.part));if(Math.abs(p.y-oldY)<.0001&&Math.abs(dy)>.001)p.climbSpeed=0}else p.y+=dy;
  if(p.y>=hit.top-.025&&f>0){p.y=Math.max(p.y,hit.top);p.climbing=false;p.climbExit=true;p.climbSpeed=0;p.climbContact=null;if(physics)physics.sweep(p,-hit.nx*.18,0,-hit.nz*.18);return false}
  if(p.y<=hit.bottom+.001&&f<0){p.climbing=false;p.climbSpeed=0;p.climbContact=null;return false}
  return true;
 }
 function jump(p,parts,power=50){if(!p.climbing)return false;const h=p.climbContact;p.climbVX=(h?.nx||0)*10;p.climbVZ=(h?.nz||1)*10;p.climbCooldown=.45;p.climbing=false;p.climbContact=null;p.climbSpeed=0;p.climbExit=false;p.grounded=false;p.vy=power;p.jumpTime=.3;return true}
 return Object.freeze({step,jump,contact,torsoProbe,frontContact});
});
