/* Synthetic bridge to the complete nine-function WebClient 37075 calculation.
 * This constructs only the memory fields needed by that calculation; floor
 * input, branch choice and R6 parts are adapter inputs. It is not Humanoid,
 * contact detection, a solver, or a general Roblox walking-physics engine. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./running-physics-vm.js'),require('./running-height-program.js'));
 else root.RunningHeightAdapter=factory(root.Running37123NumericVM,root.RunningHeightProgram);
})(typeof globalThis==='object'?globalThis:this,function(VM,program){
 'use strict';
 if(!VM||!program)throw new Error('Running-height research dependencies missing');
 function create(parts){
  const buffer=new ArrayBuffer(140*65536),v=new DataView(buffer),vm=new VM(buffer,program,9000000,{});
  const put=(a,n)=>v.setUint32(a,n,true),f=(a,n)=>v.setFloat32(a,n,true);
  const state=4096,owner=8192,holder=16000,root=30000,left=32000,right=34000,rootPrimitive=40000,leftPrimitive=42000,rightPrimitive=44000;
  put(state+36,owner);put(owner+308,0);put(owner+804,root);put(owner+844,left);put(owner+836,right);put(owner+996,holder);
  for(const [object,primitive,name] of [[root,rootPrimitive,'HumanoidRootPart'],[left,leftPrimitive,'Left Leg'],[right,rightPrimitive,'Right Leg']]){
   const p=parts[name];if(!p||!Array.isArray(p.size)||p.size.length!==3||p.size.some(n=>!Number.isFinite(n)||n<=0))throw new TypeError('Expected finite positive R6 part sizes: '+name);
   put(object+260,primitive);p.size.forEach((n,k)=>f(primitive+344+4*k,n));
  }
  f(8870472,-Infinity); // synthetic non-finite sentinel; no target flag inferred
  function target(floor,offset=0){
   if(!Number.isFinite(floor)||!Number.isFinite(offset))throw new RangeError('Expected finite demo floor and offset');
   f(holder+64,floor);f(owner+264,offset);return vm.call('37075',[state]);
  }
  return Object.freeze({target,source:'owner WebClient functions 37075/37057 and seven helpers; synthetic R6 memory and floor',branch:'owner+308=0, offset=0 in demo; runtime flags and actual owner object state unknown'});
 }
 return {create};
});
