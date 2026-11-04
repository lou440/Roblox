/* Restricted pre-resolved 99505 input-object tail; actual 86260/86280 behavior
 * is represented with state/logical setters, property notification and signal
 * mocked by hooks. Lookup, ownership, position and 92288 are not ported. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.WasmInputObjectUpdateTail=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function update(memory,object,down,repeat,physical,logical,mask,hooks){
    const v=new DataView(memory.buffer||memory),state=down?0:2,r=repeat&255;
    const previous=v.getInt32(object+112,true),shouldDispatch=r!==0||previous!==state;
    if(previous!==state){
      hooks.setState(v,object+92,state);
      hooks.notify(v,object,v.getInt32(4125024,true));
      hooks.signal(v,object+212,v.getInt32(object+112,true));
    }
    v.setInt32(object+176,r,true);
    if((physical|0)!==v.getInt32(object+172,true))v.setInt32(object+172,physical,true);
    if((logical|0)!==v.getInt32(object+108,true)){
      hooks.setLogical(v,object+92,logical|0);
      hooks.notify(v,object,v.getInt32(4125344,true));
    }
    if((mask|0)!==v.getInt32(object+156,true))v.setInt32(object+156,mask,true);
    return shouldDispatch?1:0; // 99505's later-dispatch gate, not its return value
  }
  return {update};
});
