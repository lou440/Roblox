/* Contact primitives imported from uploads/arena-source-snapshot-df6a19f6e2.zip: demo-obstacles.js. */
(()=>{'use strict';
function inside(x,z,part){return Math.abs(x-part.center[0])<=part.size[0]/2&&Math.abs(z-part.center[2])<=part.size[2]/2}
function planarDistance(x,z,part){return Math.hypot(Math.max(0,Math.abs(x-part.center[0])-part.size[0]/2),Math.max(0,Math.abs(z-part.center[2])-part.size[2]/2))}
window.ArenaContactModel=Object.freeze({inside,planarDistance,stepHeight:2.401,radius:.8,height:5});
})();
