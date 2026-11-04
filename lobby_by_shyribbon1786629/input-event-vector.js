/* Partial direct port of WebClient.wasm 3038: append one 12-byte input
 * record to a vector at [begin,end,capacityEnd]. Only valid, non-wrapping
 * vector storage is supported. Allocation/free are explicit host callbacks;
 * allocation failures and engine exceptions are not reconstructed. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WasmInputEventVector=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function append(buffer,vector,source,host){
    const view=new DataView(buffer),bytes=new Uint8Array(buffer);
    const begin=view.getInt32(vector,true),end=view.getInt32(vector+4,true),capacity=view.getInt32(vector+8,true);
    const copyRecord=destination=>{bytes.set(bytes.slice(source+8,source+12),destination+8);bytes.set(bytes.slice(source,source+8),destination)};
    if((end>>>0)<(capacity>>>0)){copyRecord(end);view.setInt32(vector+4,(end+12)|0,true);return}
    const oldBytes=(end-begin)|0,oldCount=Math.trunc(oldBytes/12),required=oldCount+1;
    if((required>>>0)>=357913942)throw new RangeError('input event vector exceeds the original limit');
    const oldCapacity=Math.trunc(((capacity-begin)|0)/12);
    const next=(oldCapacity>>>0)>178956969?357913941:Math.max(required,oldCapacity*2);
    if((next>>>0)>=357913942)throw new RangeError('input event vector capacity exceeds the original limit');
    const byteLength=next*12,allocated=host.alloc(byteLength)|0,destination=(allocated+oldBytes)|0;
    copyRecord(destination);
    const start=(destination+Math.trunc(oldBytes/-12)*12)|0;
    if(oldBytes)bytes.copyWithin(start,begin,begin+oldBytes);
    const newEnd=(destination+12)|0;
    view.setInt32(vector+4,newEnd,true);view.setInt32(vector,start,true);view.setInt32(vector+8,(allocated+byteLength)|0,true);
    if(begin)host.free(begin);
    view.setInt32(vector+4,newEnd,true);
  }
  return Object.freeze({append});
});
