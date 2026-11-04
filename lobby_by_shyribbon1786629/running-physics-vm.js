/* Restricted instruction interpreter for owner WebClient Running f37123 and
 * its numeric helpers. The surrounding Roblox object, contact and engine
 * operations are explicit mocks; this is not the Roblox physics engine. */
'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Running37123NumericVM=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const F=Math.fround;
 function floatConst(s){
  let neg=s[0]==='-';if(neg)s=s.slice(1);let z;
  if(s==='inf')z=Infinity;else if(s==='nan')z=NaN;else if(/^0x/i.test(s)){let [mant,exp]=s.slice(2).split('p'),[whole,frac='']=mant.split('.');z=parseInt(whole,16)+(frac?parseInt(frac,16)/Math.pow(16,frac.length):0);z*=Math.pow(2,Number(exp));}
  else z=Number(s);
  return F(neg?-z:z);
 }
 function vector(){return new Uint8Array(16)}
 function vbin(a,b,op){let z=vector(),dv=new DataView(z.buffer),da=new DataView(a.buffer,a.byteOffset,16),db=new DataView(b.buffer,b.byteOffset,16);for(let i=0;i<4;i++){let x=da.getFloat32(4*i,true),y=db.getFloat32(4*i,true);dv.setFloat32(4*i,F(op==='add'?x+y:op==='sub'?x-y:x*y),true)}return z}
 function branch(depth){return {wasmBranch:true,depth}}
 function toOffset(arg){let m=/\boffset=(\d+)/.exec(arg);return m?Number(m[1]):0}
 class Running37123NumericVM{
  constructor(buffer,program,stackPointer=9000000,hooks={}){if(!buffer||!program)throw Error('memory and program required');this.view=new DataView(buffer);this.bytes=new Uint8Array(buffer);this.program=program;this.global0=stackPointer|0;this.floatBits=new DataView(new ArrayBuffer(4));this.hooks=hooks;}
  call(index,args){
   const fn=this.program[String(index)];if(!fn)throw Error('unsupported original call '+index);
   if(args.length!==fn.params.length)throw Error('argument count for '+index);
   let locals=args.slice();for(const t of fn.locals)locals.push(t==='i64'?0n:t==='v128'?vector():0);
   const stack=[],vm=this;const pop=()=>{if(!stack.length)throw Error('operand stack underflow in '+index);return stack.pop()};
   const addr=(base,off)=>{let n=(base>>>0)+off;if(n>=vm.bytes.length)throw Error('out-of-range memory in '+index);return n};
   const finish=(start,result)=>{let r=result?pop():undefined;stack.length=start;if(result)stack.push(r)};
   function run(body){
    for(const ins of body){const op=ins[0],arg=ins[1];let a,b,c,t,pos;
     if(op==='block'||op==='if'||op==='loop'){
      let cond=op==='if'?pop():1,start=stack.length;
      for(;;){try{run(op==='if'&&!cond?ins[3]:ins[2]);finish(start,arg);break}catch(e){if(!e||!e.wasmBranch)throw e;if(e.depth>0){e.depth--;throw e}finish(start,arg);if(op==='loop')continue;break}}
      continue;
     }
     switch(op){
      case 'local.get':stack.push(locals[+arg]);break;
      case 'local.set':locals[+arg]=pop();break;
      case 'local.tee':locals[+arg]=stack[stack.length-1];break;
      case 'global.get':if(+arg!==0)throw Error('unsupported global');stack.push(vm.global0);break;
      case 'global.set':if(+arg!==0)throw Error('unsupported global');vm.global0=pop()|0;break;
      case 'i32.const':stack.push(Number(arg)|0);break;
      case 'i64.const':stack.push(BigInt(arg));break;
      case 'f32.const':stack.push(floatConst(arg));break;
      case 'v128.const':{let v=vector(),dv=new DataView(v.buffer),parts=arg.split(/\s+/);if(parts.shift()!=='i32x4'||parts.length!==4)throw Error('unsupported v128 const');for(let i=0;i<4;i++)dv.setUint32(i*4,Number(parts[i])>>>0,true);stack.push(v);break}
      case 'i32.load':case 'i32.atomic.load':stack.push(vm.view.getInt32(addr(pop(),toOffset(arg)),true));break;
      case 'i32.load8_u':case 'i32.atomic.load8_u':stack.push(vm.view.getUint8(addr(pop(),toOffset(arg))));break;
      case 'f32.load':stack.push(vm.view.getFloat32(addr(pop(),toOffset(arg)),true));break;
      case 'i64.load':stack.push(vm.view.getBigUint64(addr(pop(),toOffset(arg)),true));break;
      case 'v128.load':{pos=addr(pop(),toOffset(arg));if(pos+16>vm.bytes.length)throw Error('v128 load bounds');stack.push(vm.bytes.slice(pos,pos+16));break}
      case 'v128.load64_zero':{pos=addr(pop(),toOffset(arg));if(pos+8>vm.bytes.length)throw Error('v128 load bounds');let v=vector();v.set(vm.bytes.subarray(pos,pos+8));stack.push(v);break}
      case 'v128.load32_zero':case 'v128.load32_splat':{pos=addr(pop(),toOffset(arg));let v=vector();if(pos+4>vm.bytes.length)throw Error('v128 load bounds');if(op==='v128.load32_zero')v.set(vm.bytes.subarray(pos,pos+4));else for(let k=0;k<4;k++)v.set(vm.bytes.subarray(pos,pos+4),4*k);stack.push(v);break}
      case 'v128.load32_lane':{let src=pop();pos=addr(pop(),toOffset(arg));let v=src.slice(),lane=Number(arg.trim().split(/\s+/).at(-1));if(pos+4>vm.bytes.length||lane<0||lane>3)throw Error('v128 load lane');v.set(vm.bytes.subarray(pos,pos+4),lane*4);stack.push(v);break}
      case 'i32.store':b=pop();a=addr(pop(),toOffset(arg));vm.view.setInt32(a,b|0,true);break;
      case 'f32.store':b=pop();a=addr(pop(),toOffset(arg));vm.view.setFloat32(a,b,true);break;
      case 'i64.store':b=pop();a=addr(pop(),toOffset(arg));vm.view.setBigUint64(a,BigInt.asUintN(64,b),true);break;
      case 'v128.store':b=pop();a=addr(pop(),toOffset(arg));if(a+16>vm.bytes.length)throw Error('v128 store bounds');vm.bytes.set(b,a);break;
      case 'i32.add':b=pop();a=pop();stack.push((a+b)|0);break;
      case 'i32.sub':b=pop();a=pop();stack.push((a-b)|0);break;
      case 'i32.mul':b=pop();a=pop();stack.push(Math.imul(a,b));break;
      case 'i32.and':b=pop();a=pop();stack.push(a&b);break;
      case 'i32.or':b=pop();a=pop();stack.push(a|b);break;
      case 'i32.shl':b=pop();a=pop();stack.push(a<<(b&31));break;
      case 'i32.shr_u':b=pop();a=pop();stack.push((a>>>(b&31))|0);break;
      case 'i32.eq':b=pop();a=pop();stack.push(+(a===b));break;
      case 'i32.ne':b=pop();a=pop();stack.push(+(a!==b));break;
      case 'i32.eqz':stack.push(+(pop()===0));break;
      case 'i32.ge_u':b=pop();a=pop();stack.push(+((a>>>0)>=(b>>>0)));break;
      case 'i32.gt_u':b=pop();a=pop();stack.push(+((a>>>0)>(b>>>0)));break;
      case 'i32.le_u':b=pop();a=pop();stack.push(+((a>>>0)<=(b>>>0)));break;
      case 'i32.lt_u':b=pop();a=pop();stack.push(+((a>>>0)<(b>>>0)));break;
      case 'i32.le_s':b=pop();a=pop();stack.push(+((a|0)<=(b|0)));break;
      case 'i32.lt_s':b=pop();a=pop();stack.push(+((a|0)<(b|0)));break;
      case 'i32.gt_s':b=pop();a=pop();stack.push(+((a|0)>(b|0)));break;
      case 'f32.add':b=pop();a=pop();stack.push(F(a+b));break;
      case 'f32.sub':b=pop();a=pop();stack.push(F(a-b));break;
      case 'f32.mul':b=pop();a=pop();stack.push(F(a*b));break;
      case 'f32.div':b=pop();a=pop();stack.push(F(a/b));break;
      case 'f32.sqrt':stack.push(F(Math.sqrt(pop())));break;
      case 'f32.abs':stack.push(Math.abs(pop()));break;
      case 'f32.neg':stack.push(-pop());break;
      case 'f32.copysign':b=pop();a=pop();stack.push((b<0||Object.is(b,-0))?-Math.abs(a):Math.abs(a));break;
      case 'f32.eq':b=pop();a=pop();stack.push(+(a===b));break;
      case 'f32.ne':b=pop();a=pop();stack.push(+(a!==b));break;
      case 'f32.max':b=pop();a=pop();stack.push(F(Math.max(a,b)));break;
      case 'f32.gt':b=pop();a=pop();stack.push(+(a>b));break;
      case 'f32.lt':b=pop();a=pop();stack.push(+(a<b));break;
      case 'f32.convert_i32_s':stack.push(F(pop()|0));break;
      case 'f32.convert_i32_u':stack.push(F(pop()>>>0));break;
      case 'i32.reinterpret_f32':vm.floatBits.setFloat32(0,pop(),true);stack.push(vm.floatBits.getInt32(0,true));break;
      case 'f32.reinterpret_i32':vm.floatBits.setInt32(0,pop(),true);stack.push(vm.floatBits.getFloat32(0,true));break;
      case 'f32x4.splat':{a=pop();let v=vector(),d=new DataView(v.buffer);for(let i=0;i<4;i++)d.setFloat32(4*i,a,true);stack.push(v);break}
      case 'f32x4.extract_lane':a=pop();stack.push(new DataView(a.buffer,a.byteOffset,16).getFloat32(+arg*4,true));break;
      case 'f32x4.replace_lane':{b=pop();a=pop();let v=a.slice();new DataView(v.buffer).setFloat32(Number(arg)*4,b,true);stack.push(v);break}
      case 'f32x4.add':case 'f32x4.sub':case 'f32x4.mul':b=pop();a=pop();stack.push(vbin(a,b,op.slice(6)));break;
      case 'i8x16.shuffle':{b=pop();a=pop();let lanes=arg.trim().split(/\s+/).map(Number),v=vector();for(let i=0;i<16;i++)v[i]=lanes[i]<16?a[lanes[i]]:b[lanes[i]-16];stack.push(v);break}
      case 'select':c=pop();b=pop();a=pop();stack.push(c?a:b);break;
      case 'drop':pop();break;
      case 'unreachable':throw Error('unreachable instruction in '+index);
      case 'br':throw branch(+arg);
      case 'br_if':if(pop())throw branch(+arg);break;
      case 'br_table':{a=pop()>>>0;let labels=arg.trim().split(/\s+/).map(Number);throw branch(labels[Math.min(a,labels.length-1)])}
      case 'return':throw {wasmReturn:true,value:fn.results.length?pop():undefined};
      case 'call':{let callee=vm.program[arg]||(vm.hooks.calls||{})[arg];if(!callee)throw Error('unsupported original call '+arg);let av=new Array(callee.params.length);for(let i=av.length-1;i>=0;i--)av[i]=pop();let r=vm.program[arg]?vm.call(arg,av):callee.invoke(vm,...av);if(callee.results.length)stack.push(r);break}
      case 'call_indirect':{if(arg!=='(type 2)'||typeof vm.hooks.indirect!=='function')throw Error('unsupported indirect call '+arg);let slot=pop(),self=pop();stack.push(vm.hooks.indirect(vm,slot,self)|0);break}
      default:throw Error('unsupported opcode '+op+' in '+index);
     }
    }
   }
   try{run(fn.body)}catch(e){if(e&&e.wasmReturn)return e.value;throw e}
   if(stack.length!==fn.results.length)throw Error('unexpected result stack in '+index+': '+stack.length);
   return fn.results.length?pop():undefined;
  }
 }
 return Running37123NumericVM;
});
