/* Axis-aligned RBX::Block face query derived from 144431 and 144433, restricted
 * to moderate finite points and positive finite dimensions. Not raycasting,
 * collision detection, contact generation, response, or character physics. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.WasmBlockFaceQuery=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';const f=Math.fround;
  function inputs(size,point){
    if(!size||size.length!==3||!point||point.length!==3)throw new TypeError('Expected two 3-vectors');
    const d=Array.from(size,f),p=Array.from(point,f);
    if(d.some(x=>!Number.isFinite(x)||x<=0)||p.some(x=>!Number.isFinite(x))||d.some(x=>x>4096)||p.some(x=>Math.abs(x)>100000))throw new RangeError('Only bounded finite points and positive bounded dimensions are supported');
    return {d,p};
  }
  function insidePrepared(d,p,face){
    const axis=face%3;
    for(let a=0;a<3;a++)if(a!==axis){const h=f(d[a]*0.5);if(p[a]>h||p[a]<-h)return false;}
    return true;
  }
  function projectionInside(size,face,point){
    if(!Number.isInteger(face)||face<0||face>=6)throw new RangeError('Block face index must be 0..5');
    const {d,p}=inputs(size,point);return insidePrepared(d,p,face);
  }
  function nearestProjectedFace(size,point){
    const {d,p}=inputs(size,point);let best=1000000,answer=-1;
    for(let face=0;face<6;face++){
      if(!insidePrepared(d,p,face))continue;
      const axis=face%3,normal=face<3?1:-1,dist=f(d[axis]*0.5);
      // 144433's dot-product grouping, including float32 rounding.
      const x=f(p[0]*(axis===0?normal:0)),y=f(p[1]*(axis===1?normal:0)),z=f(p[2]*(axis===2?normal:0));
      const distance=Math.abs(f(f(z+f(x+y))-dist));
      if(best>distance){best=distance;answer=face;}
    }
    return answer;
  }
  return {projectionInside,nearestProjectedFace};
});
