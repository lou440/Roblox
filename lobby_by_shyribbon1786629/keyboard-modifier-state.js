/* Extracted modifier mask update in WebClient.wasm 3107, for a prebuilt
 * 12-byte input record and device object. Other input consumers, event
 * dispatch and gameplay are not implemented here. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WasmKeyboardModifierState=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MASKS=Object.freeze({224:64,225:1,226:256,227:1024,228:128,229:2,230:512,231:2048,57:8192,83:4096,257:16384});
  function apply(buffer,device,record){
    const v=new DataView(buffer),down=v.getUint8(record),code=v.getInt32(record+8,true),bit=MASKS[code];
    if(bit!==undefined){const old=v.getInt32(device+176,true);v.setInt32(device+176,down&1?old|bit:old&~bit,true)}
  }
  return Object.freeze({apply});
});
