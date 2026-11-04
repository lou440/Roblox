/* Direct port of three traced BasePart getters in WebClient.wasm.
 * This is a view of an already-constructed WASM-style memory image, not a
 * constructor, renderer, collision solver, or general-purpose Part object.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.WasmBasePartMemoryView=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  class BasePartMemoryView {
    constructor(buffer,address){
      this.buffer=(typeof WebAssembly!=='undefined' && buffer instanceof WebAssembly.Memory)?buffer.buffer:buffer;
      if(!(this.buffer instanceof ArrayBuffer) && !(typeof SharedArrayBuffer!=='undefined' && this.buffer instanceof SharedArrayBuffer))throw new TypeError('expected an ArrayBuffer or WebAssembly.Memory');
      this.bytes=new DataView(this.buffer);this.address=address>>>0;
    }
    _primitive(){return this.bytes.getUint32(this.address+260,true)}
    get anchored(){return ((this.bytes.getUint8(this._primitive()+338)&2)>>>1)!==0}
    get canCollide(){return ((this.bytes.getUint8(this._primitive()+338)&8)>>>3)!==0}
    get size(){const p=this._primitive()+344;return [this.bytes.getFloat32(p,true),this.bytes.getFloat32(p+4,true),this.bytes.getFloat32(p+8,true)]}
    copySizeBytes(output,offset=0){
      const src=new Uint8Array(this.buffer,this._primitive()+344,12);
      if(!(output instanceof Uint8Array))throw new TypeError('output must be Uint8Array');
      output.set(src,offset);
    }
    // Port of the detached-primitive branch of function 114423. Its four
    // engine/geometry calls remain explicit hooks rather than guessed behavior.
    setPrimitiveSizeDetached(values,force=0,hooks={}){
      if(!values || values.length!==3)throw new TypeError('expected three dimensions');
      const p=this._primitive();
      if(this.bytes.getUint32(p+388,true)!==0)throw new Error('attached-world size updates are not implemented');
      const min=Math.fround(0.05),tiny=Math.fround(0.001);
      const clamp=value=>{
        let x=Math.fround(value);
        x=x<2048?x:2048;
        return x>tiny?x:tiny;
      };
      const next=Array.from(values,clamp),shape=next.map(x=>x>min?x:min),old=this.size;
      const changed=old.some((x,i)=>(x>min?x:min)!==shape[i]);
      const update=changed || (force|0)!==0;
      if(update && !['geometrySet','geometryMeasure','call114418','call114374'].every(k=>typeof hooks[k]==='function'))
        throw new TypeError('detached update requires explicit geometry and engine hooks');
      for(let i=0;i<3;i++)this.bytes.setFloat32(p+344+4*i,next[i],true);
      if(update){
        const geometry=this.bytes.getUint32(p+396,true);
        hooks.geometrySet(geometry,shape);
        this.bytes.setFloat32(p+356,hooks.geometryMeasure(geometry,shape),true);
        hooks.call114418(p);
        hooks.call114374(p);
      }
    }
  }
  return BasePartMemoryView;
});
