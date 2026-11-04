/* Function 115128 from WebClient.wasm: walk a node's parent links and set
 * specific flags. This is not a full implementation of the surrounding
 * primitive update, physics, or object lifecycle. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.WasmPrimitiveChain=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function mark(buffer,address){
    const bytes=(typeof WebAssembly!=='undefined' && buffer instanceof WebAssembly.Memory)?buffer.buffer:buffer;
    const view=new DataView(bytes),shared=typeof SharedArrayBuffer!=='undefined'&&bytes instanceof SharedArrayBuffer;
    function visit(node){
      const marker=view.getUint32(node+24,true);
      if(marker && view.getUint8(marker+4))return;
      const parent=view.getUint32(node,true);
      if(parent)visit(parent);
      else {
        const rootState=view.getUint32(node+192,true);
        if(rootState){
          if(rootState&3)throw new RangeError('unaligned atomic store');
          if(shared)Atomics.store(new Int32Array(bytes,rootState,1),0,2);
          else view.setInt32(rootState,2,true);
        }
      }
      if(marker)view.setUint8(marker+4,1);
    }
    visit(address>>>0);
  }
  return {mark};
});
