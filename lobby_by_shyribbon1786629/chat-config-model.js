/* Execute the owner-matched 1145 ExpChat Config initializer slice in the
 * restricted research VM. Roblox constructors and the surrounding engine
 * configuration are mocked; this is not a full ExpChat runtime. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports={create:factory};else root.RobloxChatConfigResearch=factory(root.RobloxRecoveredUI.core,root.RobloxChatConfigProgram)})(typeof globalThis!=='undefined'?globalThis:this,function(core,program){
 'use strict';const u=(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}});
 const globals={Enum:{Font:{BuilderSansMedium:'BuilderSansMedium'},FontWeight:{Medium:'Medium'},FontStyle:{Normal:'Normal'},KeyCode:{Slash:'Slash'}},Font:{new:(...args)=>({args})},Color3:{fromRGB:(r,g,b)=>({R:r/255,G:g/255,B:b/255})},Vector2:{new:(x,y)=>({X:x,Y:y})},UDim2:{new:u,fromScale:(x,y)=>u(x,0,y,0)}};
 const result=core.run(program,0,[],[],globals,{}, {startPc:36,stopAt:195}).registers[7];
 return Object.freeze(result);
});
