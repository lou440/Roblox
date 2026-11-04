/* A world-space cloud plane: camera rotation exposes different clouds, and
 * translation gives parallax. No screen-fixed cloud artwork or camera parent. */
(()=>{'use strict';window.WorldSky={create(gl){
 const vs='attribute vec2 aPosition;varying vec2 vScreen;void main(){vScreen=aPosition;gl_Position=vec4(aPosition,1.0,1.0);}';
 const fs=
 'precision highp float;varying vec2 vScreen;uniform vec3 uEye;uniform vec2 uAngles;uniform float uAspect,uTime,uDay;'+
 'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
 'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}'+
 'float fbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(17.7,41.2);a*=.5;}return v;}'+
 'void main(){float sy=sin(uAngles.x),cy=cos(uAngles.x),sp=sin(uAngles.y),cp=cos(uAngles.y);vec3 right=vec3(cy,0,-sy),up=vec3(-sy*sp,cp,-cy*sp),forward=vec3(-sy*cp,-sp,-cy*cp);vec3 ray=normalize(forward+right*vScreen.x*uAspect*.5773503+up*vScreen.y*.5773503);'+
 'float horizon=pow(1.0-max(ray.y,0.0),3.0);vec3 sky=mix(vec3(.22,.49,.74),vec3(.71,.80,.85),horizon);vec3 sunDir=normalize(vec3(-.424,.795,.434));float sun=max(dot(ray,sunDir),0.0);sky+=vec3(1,.8,.51)*(.16*pow(sun,12.0)+.75*pow(sun,900.0));'+
 'if(ray.y>.025){float travel=(190.0-uEye.y)/ray.y;vec2 world=(uEye.xz+ray.xz*travel+vec2(-uTime*3.0,0.0))*.0038;float field=fbm(world);float cloud=smoothstep(.47,.67,field);float detail=fbm(world*2.0+vec2(3.1));float shade=smoothstep(.45,.7,detail);vec3 cloudColor=mix(vec3(.70,.77,.81),vec3(1,.97,.91),shade);float fade=smoothstep(.025,.13,ray.y);sky=mix(sky,cloudColor,cloud*fade*.95);}'+
 'sky*=uDay;gl_FragColor=vec4(sky,1.0);}';
 function shader(type,s){const sh=gl.createShader(type);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
 const pr=gl.createProgram();gl.attachShader(pr,shader(gl.VERTEX_SHADER,vs));gl.attachShader(pr,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));const a=gl.getAttribLocation(pr,'aPosition'),l={};for(const n of ['uEye','uAngles','uAspect','uTime','uDay'])l[n]=gl.getUniformLocation(pr,n);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 return {draw(eye,camera,aspect,time,restore){gl.useProgram(pr);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,8,0);gl.uniform3fv(l.uEye,eye);gl.uniform2f(l.uAngles,camera.yaw,camera.pitch);gl.uniform1f(l.uAspect,aspect);gl.uniform1f(l.uTime,time);gl.uniform1f(l.uDay,window.Atmosphere.daylight);gl.drawArrays(gl.TRIANGLES,0,3);gl.disableVertexAttribArray(a);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.useProgram(restore)}};
 }}})();
