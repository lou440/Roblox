/* Restricted slice of 89079's step accumulator. Preconditions: valid object,
 * nonnegative finite accumulator/frequency/dt, no override/debug/throttle or
 * alternate ownership branches. No actual physics step or integrator is here. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.WasmWorldStepAccumulator=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict'; const f=Math.fround;
  function plan(memory,world,dt){
    const v=new DataView(memory.buffer||memory),acc=v.getFloat32(world+228,true),hz=v.getFloat32(world+1592,true);
    if(v.getUint8(22738072)!==0||v.getUint8(9113092)!==1||v.getInt32(22471100,true)!==0||v.getUint8(world+104)!==0||v.getUint8(world+452)!==1||v.getUint8(9145756)!==0||v.getUint8(9145768)!==0)throw new Error('Unsupported world-step accumulator branch');
    if(!Number.isFinite(acc)||!Number.isFinite(hz)||!Number.isFinite(dt)||acc<0||hz<0||dt<0)throw new Error('Expected nonnegative finite step inputs');
    const total=f(acc+f(hz*f(dt))),due=f(Math.floor(total));
    if(!Number.isFinite(total))throw new Error('Expected finite accumulated steps');
    const cap=f(Math.max(12,v.getInt32(9031000,true))>>>0),run=due>cap?cap:due;
    const intSat=x=>Number.isNaN(x)?0:x>=2147483648?2147483647:x<=-2147483648?-2147483648:Math.trunc(x);
    v.setInt32(world+304,intSat(due),true);
    const left=f(total-run),retained=left>f(1.99999)?f(1.99999):left;
    v.setFloat32(world+228,retained,true);v.setFloat32(world+284,f(left-retained),true);
    if(run<=0)return 0;
    const n=intSat(run);v.setInt32(world+132,n,true);return n;
  }
  return {plan};
});
