/* Shared hemispheric ambient, warm sun and distance/height haze for every
 * world material. Not a recovered Roblox Lighting implementation. */
(()=>{'use strict';const cache=new WeakMap();let daylight=1;
const glsl=
'uniform vec3 uSunDirection,uSunLight,uSkyAmbient,uGroundAmbient,uHaze;uniform float uHazeDensity;'+
'vec3 atmosphere(vec3 color,vec3 normal,vec3 world,vec3 eye){vec3 n=normalize(normal);float hemi=n.y*.5+.5;vec3 ambient=mix(uGroundAmbient,uSkyAmbient,hemi);float sun=max(dot(n,uSunDirection),0.0);vec3 lit=color*(ambient+uSunLight*sun);float distanceToEye=length(world-eye);float haze=1.0-exp(-distanceToEye*uHazeDensity);haze*=mix(1.0,.65,smoothstep(0.0,90.0,world.y));return mix(lit,uHaze,clamp(haze,0.0,.9));}';
window.Atmosphere={glsl,update(time){const rules=window.MapSelection?.rules;daylight=window.MapSelection?.isSword?.2:rules?.kind==='crossroads'?.35+.65*Math.max(0,Math.sin(((time/4)%24-6)/24*Math.PI*2)):1},get daylight(){return daylight},
 apply(gl,program){let l=cache.get(program);if(!l){l={};for(const n of ['uSunDirection','uSunLight','uSkyAmbient','uGroundAmbient','uHaze','uHazeDensity'])l[n]=gl.getUniformLocation(program,n);cache.set(program,l)}
 gl.uniform3f(l.uSunDirection,-.424,.795,.434);gl.uniform3f(l.uSunLight,.65*daylight,.59*daylight,.48*daylight);
 gl.uniform3f(l.uSkyAmbient,.46*daylight+.1,.54*daylight+.1,.65*daylight+.1);gl.uniform3f(l.uGroundAmbient,.25*daylight+.05,.25*daylight+.05,.22*daylight+.05);
 gl.uniform3f(l.uHaze,.71*daylight,.80*daylight,.85*daylight);gl.uniform1f(l.uHazeDensity,window.MapSelection?.isSword?.0026:.0016);
 }};})();
