/* Camera matrix utilities, extracted unchanged from game.js. */
(() => { 'use strict';
    function perspective(fovy, aspect, near, far) {
      const f=1/Math.tan(fovy/2), out=new Float32Array(16);
      out[0]=f/aspect; out[5]=f; out[10]=(far+near)/(near-far); out[11]=-1; out[14]=2*far*near/(near-far); return out;
    }
    function lookAt(eye, center) {
      let zx=eye[0]-center[0], zy=eye[1]-center[1], zz=eye[2]-center[2];
      let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
      let xx=zz, xy=0, xz=-zx; l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
      const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
      return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
        -(xx*eye[0]+xy*eye[1]+xz*eye[2]), -(yx*eye[0]+yy*eye[1]+yz*eye[2]), -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1]);
    }
    function multiply(a,b) {
      const o=new Float32Array(16);
      for(let col=0;col<4;col++) for(let row=0;row<4;row++)
        o[col*4+row]=a[row]*b[col*4]+a[4+row]*b[col*4+1]+a[8+row]*b[col*4+2]+a[12+row]*b[col*4+3];
      return o;
    }
  window.GameCameraMath=Object.freeze({perspective,lookAt,multiply});
})();
