/* Restricted JavaScript port of WebClient.wasm 430 -> 569 -> 566 keyboard
 * queueing, using the DOM field layout in WebClient.js. The logging helper is
 * omitted and memory is observed single-threaded. The engine's 485/795/3213
 * input dispatcher, focus behavior, character movement and physics are NOT
 * implemented by this module. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./keyboard-code.js'));else root.WasmKeyboardInput=factory(root.WasmKeyboardCode)})(typeof globalThis!=='undefined'?globalThis:this,function(Keyboard){
  'use strict';
  const BLOCK=8803184,INPUT_GATE=20549784,MODIFIER=20550120;
  class KeyboardInput{
    constructor(queue){
      if(!Keyboard||!queue||!queue.bytes||typeof queue.pushKeyboard!=='function')throw new TypeError('A keyboard code port and event queue are required');
      this.queue=queue;this.bytes=queue.bytes;
    }
    handle(eventType,event){
      if(this.bytes[BLOCK])return 1;
      const down=(eventType|0)===2?1:0,code=Keyboard.fromLoaderDomCode(event.code);
      const repeat=Number(event.repeat)&255,ctrl=Number(event.ctrlKey)&255,shift=Number(event.shiftKey)&255,alt=Number(event.altKey)&255,meta=Number(event.metaKey)&255;
      if((code&-5)===224)this.bytes[MODIFIER]=down;
      if(code===12&&((ctrl===1&&shift!==0)||(meta===1&&alt!==0)))return 0;
      if(this.bytes[INPUT_GATE])return 0;
      if(code!==0)this.queue.pushKeyboard(code,down,repeat);
      return 1;
    }
  }
  KeyboardInput.layout=Object.freeze({BLOCK,INPUT_GATE,MODIFIER});
  return KeyboardInput;
});
