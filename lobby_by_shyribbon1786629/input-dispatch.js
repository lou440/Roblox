/* Restricted normal path of WebClient.wasm 3213 -> 3023 -> 3038.
 * This includes the exact repeat-key filter and 12-byte input record, but
 * object resolution, locking, allocation and release are host callbacks.
 * The auxiliary listener at context+3896, alternate context+160 path,
 * exceptional paths and all subsequent game behavior are not implemented. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./input-event-vector.js'));else root.WasmInputDispatch=factory(root.WasmInputEventVector)})(typeof globalThis!=='undefined'?globalThis:this,function(Vector){
  'use strict';
  const NAME=22438780, FEATURE=8805976;
  const REPEAT_ALLOWED=new Set([40,42,75,76,78,79,80,81,82]);
  function dispatch(buffer,context,scratch,down,physical,logical,repeat,host){
    const view=new DataView(buffer),bytes=new Uint8Array(buffer);down|=0;physical|=0;logical|=0;repeat|=0;
    // The original function writes these scratch fields before filtering.
    view.setUint8(scratch+71,down);view.setInt32(scratch+36,physical,true);view.setUint8(scratch+23,repeat);
    if(repeat!==0&&!REPEAT_ALLOWED.has(physical))return false;
    // 3213 first stores the logical code at +24; the later byte stores
    // replace only its low two bytes, leaving its high bytes in the record.
    view.setInt32(scratch+24,logical,true);
    if(view.getUint32(context+3896,true)!==0)throw new Error('3213 auxiliary listener path is not implemented');
    if(view.getUint32(context+160,true)!==0&&(bytes[FEATURE]&1))throw new Error('3213 alternate path is not implemented');
    view.setInt32(scratch+32,physical,true);view.setUint8(scratch+24,down);view.setInt32(scratch+28,logical,true);view.setUint8(scratch+25,repeat);
    const lock=context+40;host.lock(lock);
    try{const object=host.resolve(context,NAME);Vector.append(buffer,object+136,scratch+24,host)}finally{host.unlock(lock)}
    return true;
  }
  return Object.freeze({dispatch,NAME});
});
