/* Selected producer operations of the WebClient main-loop event ring.
 * They are single-threaded ports of functions 550, 552, 566, 165748, and
 * 165750, operating on a pre-seeded WASM-style memory image. They do not
 * translate event meanings, the dispatcher, or actual player input. A
 * separate queue-control loop accepts an explicitly supplied dispatcher. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.WasmMainEventQueue=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const BASE=20550400,WRITE=20591376,READ=20591400,DROPPED=20550384,STRIDE=40,MASK=1023;
  class MainEventQueue{
    constructor(buffer){
      this.buffer=(typeof WebAssembly!=='undefined'&&buffer instanceof WebAssembly.Memory)?buffer.buffer:buffer;
      this.view=new DataView(this.buffer);this.bytes=new Uint8Array(this.buffer);
    }
    _slot(){
      const write=this.view.getInt32(WRITE,true),next=(write+1)&MASK;
      if(next===this.view.getInt32(READ,true)){
        this.view.setInt32(DROPPED,(this.view.getInt32(DROPPED,true)+1)|0,true);return null;
      }
      return {address:BASE+Math.imul(write,STRIDE),next};
    }
    _empty(tag){
      const slot=this._slot();if(!slot)return null;
      this.bytes.fill(0,slot.address,slot.address+STRIDE);this.view.setUint8(slot.address,tag);return slot;
    }
    // 550: tag 10, one byte at +4.
    pushByte(value){const slot=this._empty(10);if(!slot)return;this.view.setUint8(slot.address+4,value);this.view.setInt32(WRITE,slot.next,true)}
    // 552: tag 11, f32 at +4.
    pushFloat(value){const slot=this._empty(11);if(!slot)return;this.view.setFloat32(slot.address+4,value,true);this.view.setInt32(WRITE,slot.next,true)}
    // 165748: a one-byte tag with zeroed payload.
    pushTag(tag){const slot=this._empty(tag);if(!slot)return;this.view.setInt32(WRITE,slot.next,true)}
    // 165750: one-byte tag and an i32 payload at +4.
    pushWord(value,tag){const slot=this._empty(tag);if(!slot)return;this.view.setInt32(slot.address+4,value|0,true);this.view.setInt32(WRITE,slot.next,true)}
    // Queue-control portion of main_loop_iteration (485). The dispatcher is
    // supplied by the caller, so this is not a port of event handling itself.
    drain(dispatch){
      if(typeof dispatch!=='function')throw new TypeError('dispatch must be a function');
      let read=this.view.getInt32(READ,true);const head=this.view.getInt32(WRITE,true);
      if(read===head)return;
      do {
        const address=BASE+Math.imul(read,STRIDE);
        dispatch(address,this.bytes.subarray(address,address+STRIDE));
        read=(this.view.getInt32(READ,true)+1)&MASK;
        this.view.setInt32(READ,read,true);
      }while(read!==head);
    }
    // Restricted 430 -> 566 path: keyboard record is a separate, zeroed
    // local 40-byte value. The original advances the write index before copy.
    pushKeyboard(code,down,repeat){
      const slot=this._slot();if(!slot)return false;
      this.view.setInt32(WRITE,slot.next,true);
      this.bytes.fill(0,slot.address,slot.address+STRIDE);
      this.view.setUint8(slot.address+4,down);this.view.setInt32(slot.address+8,code,true);this.view.setUint8(slot.address+12,repeat);
      return true;
    }
    // 566 advances the write index first, then copies 8/16/16-byte chunks.
    // Chunk ordering matters if source overlaps the destination.
    pushRecord(sourceAddress){
      const slot=this._slot();if(!slot)return;const from=sourceAddress>>>0;
      this.view.setInt32(WRITE,slot.next,true);
      for(const [offset,length] of [[32,8],[16,16],[0,16]]){
        const copy=this.bytes.slice(from+offset,from+offset+length);if(copy.length!==length)throw new RangeError('source record out of bounds');this.bytes.set(copy,slot.address+offset);
      }
    }
  }
  MainEventQueue.layout=Object.freeze({BASE,WRITE,READ,DROPPED,STRIDE,capacity:1024,usable:1023});
  return MainEventQueue;
});
