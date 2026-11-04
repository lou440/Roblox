/* Small adapters for numeric rules in the public 1142 BaseCamera source.
 * The active patch, full input scaling, occlusion and Roblox camera spring are not reconstructed. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RobloxClassicCameraAdapter=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const source=Object.freeze({version:'1142 public archive; runtime patch not verified',baseCameraSha256:'8d405cd459ed30064e6639902c9b16f194b7a823125f93f2b89e87292c0621d5',headOffset:1.5,requestedFocusOffset:1.1,defaultDistance:12.5,firstPersonThreshold:1,firstPersonDistance:.5,pitchLimit:80*Math.PI/180,zoomCurvature:.5});
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function focus(player,rootHeight){return [player.x,player.y+rootHeight+source.requestedFocusOffset,player.z]}
 function zoom(distance,delta,min=.5,max=128){let z;if(delta>0)z=Math.max(distance+delta*(1+distance*source.zoomCurvature),source.firstPersonThreshold);else if(delta<0)z=Math.max((distance+delta)/(1-delta*source.zoomCurvature),source.firstPersonDistance);else z=distance;z=clamp(z,min,max);return z<source.firstPersonThreshold?source.firstPersonDistance:z}
 return Object.freeze({source,focus,zoom});
});
