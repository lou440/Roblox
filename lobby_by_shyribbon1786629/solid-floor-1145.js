/* Research-only JS transcription of function 37977 from the owner's 1145
 * WebClient.wasm. Memory images, flag and the three helper calls are supplied
 * by the caller; this does not implement the Roblox physics/contact solver. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Roblox1145SolidFloor=factory();})(globalThis,function(){'use strict';
 function evaluate(memory,owner,floor,helpers){const view=memory instanceof DataView?memory:new DataView(memory.buffer||memory);if(!floor||(view.getUint8(floor+338)&2))return 1;const assembly=helpers.f115645(floor);if(!assembly||!view.getUint8(assembly+256))return 1;view.getUint32(owner+36,true);const a=Math.fround(helpers.f37753(view.getUint32(floor+84,true))),body=helpers.f37764(view.getUint32(owner+36,true));view.getUint32(owner+36,true);const b=Math.fround(helpers.f37753(body)),factor=Math.fround(Math.fround(view.getInt32(7957924,true))/10),limit=Math.fround(b*factor);return a<limit?0:1}
 return Object.freeze({evaluate,source:'owner 1145 WASM function 37977; helper semantics and object layouts mocked',wasmSha256:'d72c52618f5c153c9b17a97e644914d43918c7122d754d96f79e8323acc6a15d'});
});
