/* Billboards are render attachments, not separately simulated followers.
 * Project once per drawn frame; compositor transforms never change layout. */
(()=>{'use strict';let width=1,height=1;
window.BillboardAttachments={begin(canvas){width=canvas.clientWidth;height=canvas.clientHeight},
 point(el,vp,x,y,z,active=true,offset=0,scale=1){
  if(!active){if(!el.hidden)el.hidden=true;return}
  const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15],nx=(vp[0]*x+vp[4]*y+vp[8]*z+vp[12])/w,ny=(vp[1]*x+vp[5]*y+vp[9]*z+vp[13])/w;
  const visible=w>0&&Math.abs(nx)<1.1&&Math.abs(ny)<1.1;if(el.hidden===visible)el.hidden=!visible;if(!visible)return;
  const transform='translate3d('+((nx*.5+.5)*width)+'px,'+((.5-ny*.5)*height+offset)+'px,0) translate(-50%,-100%)'+(scale===1?'':' scale('+scale+')');
  if(el.style.transform!==transform)el.style.transform=transform;
  if(!el.classList.contains('billboard-attached')){el.classList.add('billboard-attached');el.style.left='0';el.style.top='0'}
 },
 frame(el,vp,m,active=true,lift=1.1,offset=0){this.point(el,vp,m[12]+m[4]*lift,m[13]+m[5]*lift,m[14]+m[6]*lift,active,offset)}
};})();
