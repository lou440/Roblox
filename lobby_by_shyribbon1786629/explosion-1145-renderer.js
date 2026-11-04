/* Billboard adaptation of textures hash-matched to the owner's 1145 client.
 * Particle emission, durations and sizes below are authored, not recovered. */
(function(root){'use strict';
 function create(gl,data){
  const vs='attribute vec2 aPos;attribute vec2 aUV;uniform mat4 uVP;uniform vec3 uCenter,uRight,uUp;uniform float uSize;varying vec2 vUV;void main(){vUV=aUV;vec3 p=uCenter+(uRight*aPos.x+uUp*aPos.y)*uSize;gl_Position=uVP*vec4(p,1.0);}',fs='precision mediump float;uniform sampler2D uTexture;uniform float uAlpha;varying vec2 vUV;void main(){vec4 t=texture2D(uTexture,vUV);gl_FragColor=vec4(t.rgb,t.a*uAlpha);}';
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  const pos=gl.getAttribLocation(program,'aPos'),uv=gl.getAttribLocation(program,'aUV'),names=['uVP','uCenter','uRight','uUp','uSize','uAlpha','uTexture'],l={};for(const name of names)l[name]=gl.getUniformLocation(program,name);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,-.5,0,1,.5,-.5,1,1,.5,.5,1,0,-.5,-.5,0,1,.5,.5,1,0,-.5,.5,0,0]),gl.STATIC_DRAW);
  const tex={};for(const [name,uri] of [['core',data.core()],['smoke',data.smoke],['shockwave',data.shockwave]]){const t=gl.createTexture();tex[name]=t;gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const img=new Image();img.onload=()=>{gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img)};img.src=uri}
  function draw(vp,camera,effects,now){if(!effects.length)return;const old=gl.getParameter(gl.CURRENT_PROGRAM),sy=Math.sin(camera.yaw),cy=Math.cos(camera.yaw),sp=Math.sin(camera.pitch),cp=Math.cos(camera.pitch);gl.useProgram(program);gl.uniformMatrix4fv(l.uVP,false,new Float32Array(vp));gl.uniform3fv(l.uRight,[cy,0,-sy]);gl.uniform3fv(l.uUp,[-sy*sp,cp,-cy*sp]);gl.uniform1i(l.uTexture,2);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,16,8);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
   function layer(name,center,size,alpha){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,tex[name]);gl.uniform3fv(l.uCenter,center);gl.uniform1f(l.uSize,size);gl.uniform1f(l.uAlpha,Math.max(0,alpha));gl.drawArrays(gl.TRIANGLES,0,6)}
   const K=1;/* matches the reduced 8-stud demo blast radius */for(const e of effects){const age=Math.max(0,now-e.startedAt),fade=Math.max(0,1-age/1.35);layer('smoke',[e.center[0],e.center[1]+age*1.4,e.center[2]],(3+age*5)*K,fade*.9);layer('shockwave',e.center,(2+Math.min(age*14,9))*K,Math.max(0,1-age*2));layer('core',e.center,(3+Math.min(age*12,6))*K,Math.max(0,1-age*1.25))}
   gl.depthMask(true);gl.disable(gl.BLEND);gl.useProgram(old);
  }
  return Object.freeze({draw});
 }
 root.ExplosionRenderer1145=Object.freeze({create});
})(globalThis);
