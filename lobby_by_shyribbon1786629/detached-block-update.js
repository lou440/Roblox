/* Restricted normal path through primitive function 114374 in WebClient.wasm.
 * Only an unconnected kind-2 Block with no custom shape or attached observer
 * is covered. Allocation, deallocation and locking are supplied by the caller.
 * This is not a full primitive, world update, or collision/physics engine. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./block-geometry.js'),require('./material-properties.js'),require('./primitive-chain.js'));
  else root.WasmDetachedBlockUpdate=factory(root.WasmBlockGeometry,root.WasmMaterialProperties,root.WasmPrimitiveChain);
})(typeof globalThis!=='undefined'?globalThis:this,function(Block,Material,Chain){
  'use strict';
  function apply(buffer,primitiveAddress,hooks){
    const bytes=(typeof WebAssembly!=='undefined'&&buffer instanceof WebAssembly.Memory)?buffer.buffer:buffer;
    const view=new DataView(bytes),p=primitiveAddress>>>0,node=p+64;
    if(!hooks||typeof hooks.mutex!=='function'||typeof hooks.alloc!=='function'||typeof hooks.free!=='function')throw new TypeError('mutex, alloc and free hooks are required');
    if(view.getUint32(p+388,true)||view.getUint32(p+84,true)||view.getUint32(p+400,true)||view.getUint8(p+339)!==2)
      throw new Error('only unconnected kind-2 Block primitives without custom shape/observer are supported');
    view.setFloat32(p+452,Material.primitiveValue(bytes,p),true);
    Chain.mark(bytes,node);
    const token=hooks.mutex(hooks.lockHandle|0);
    try{
      const size=[0,1,2].map(i=>view.getFloat32(p+344+4*i,true));
      const center=Block.volumeAndCenter(size).slice(1);
      const existing=view.getUint32(node+24,true),count=view.getInt32(node+8,true);
      if(center.every(v=>v===0)&&count<=0){
        if(existing){hooks.free(existing);view.setUint32(node+24,0,true)}
      }else if(!existing){
        const record=hooks.alloc(60)>>>0;
        view.setUint32(record,node,true);view.setUint8(record+4,1);
        new Uint8Array(bytes,record+8,16).fill(0);
        for(let i=0;i<8;i++)view.setUint32(record+24+4*i,i===0||i===4?0x3f800000:0,true);
        view.setUint32(record+56,0x3f800000,true);
        view.setUint32(node+24,record,true);
      }
    }finally{hooks.mutex(token)}
  }
  return {apply};
});
