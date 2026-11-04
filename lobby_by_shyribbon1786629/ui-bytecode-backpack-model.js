// Restricted candidate BackpackScript VM with mocked services.
(function(root){const core=(function(){
/* Research VM for the archived compiled IconButton renderWithCursor code.
 * It is not a general Luau or Roblox runtime. Its caller supplies mocked
 * Roblox values, style, React/Roact and feature flags. */
'use strict';
const truth=x=>x!==false&&x!==null&&x!==undefined;
function run(program,id,args,up,globals,coverage={},options={}){
 const p=program.protos[String(id)], k=p.constants, imap=new Map(p.instructions.map(x=>[x.pc,x]));
 const r=options.registers||Array(p.stack).fill(undefined);for(let i=0;i<args.length;i++)r[i]=args[i];let pc=options.startPc||0,top=args.length,steps=0;
 const get=(o,key)=>{if(o===undefined||o===null)throw Error('nil index '+String(key)+' proto '+id+' pc '+pc);return o[key]};
 const set=(o,key,v)=>{if(o===undefined||o===null)throw Error('nil set '+String(key)+' proto '+id+' pc '+pc);if(v===undefined||v===null)delete o[key];else o[key]=v};
 const makeTable=desc=>{const t={};if(desc.tableConstants)for(const [key,value] of desc.tableConstants)if(value>=0)t[k[key]]=k[value];return t};
 const imp=aux=>{const count=aux>>>30,idx=[(aux>>>20)&1023,(aux>>>10)&1023,aux&1023];let v=globals;for(let i=0;i<count;i++)v=get(v,k[idx[i]]);if(v===undefined)throw Error('unknown import '+idx.slice(0,count).map(i=>k[i]).join('.')+' proto '+id+' pc '+pc);return v};
 for(;;){
  if(pc===options.stopAt)return{value:undefined,registers:r,steps};if(++steps>30000)throw Error('instruction budget proto '+id);const x=imap.get(pc);if(!x)throw Error('bad pc '+pc+' proto '+id);coverage[x.op]=(coverage[x.op]||0)+1;
  const {op,a,b,c,d,aux}=x;let next=pc+(aux===undefined?1:2);
  switch(op){
   case 'LOADN':r[a]=d;break;case 'LOADK':r[a]=k[d];break;case 'LOADB':r[a]=!!b;if(c)next=pc+1+c;break;case 'LOADNIL':r[a]=undefined;break;case 'MOVE':r[a]=r[b];break;
   case 'GETUPVAL':r[a]=up[b]&&up[b].__cell?up[b].get():up[b];break;case 'SETUPVAL':if(up[b]&&up[b].__cell)up[b].set(r[a]);else up[b]=r[a];break;case 'GETTABLE':r[a]=get(r[b],r[c]);break;case 'GETTABLEKS':r[a]=get(r[b],k[aux]);break;case 'SETTABLEKS':set(r[b],k[aux],r[a]);break;case 'SETTABLE':set(r[b],r[c],r[a]);break;
   case 'DUPTABLE':r[a]=makeTable(k[d]);break;case 'NEWTABLE':r[a]={};break;case 'GETIMPORT':r[a]=imp(aux);break;case 'GETGLOBAL':r[a]=get(globals,k[aux]);break;case 'SETGLOBAL':globals[k[aux]]=r[a];break;
   case 'NAMECALL':r[a+1]=r[b];r[a]=get(r[b],k[aux]);break;
   case 'NEWCLOSURE':case 'DUPCLOSURE':{
    const child=program.protos[String(op==='NEWCLOSURE'?p.children[d]:k[d].closure)],capt=[];let q=pc+1;
    for(let i=0;i<child.upvalues;i++,q++){const cap=imap.get(q);if(!cap||cap.op!=='CAPTURE')throw Error('bad capture '+q);if(cap.a===0)capt.push(r[cap.b]);else if(cap.a===1){const slot=cap.b;capt.push({__cell:true,get:()=>r[slot],set:v=>{r[slot]=v}})}else if(cap.a===2)capt.push(up[cap.b]);else throw Error('unknown capture type')}
    r[a]=(...vals)=>run(program,child.id,vals,capt,globals,coverage).value;next=q;break;
   }
   case 'CALL':{const fn=r[a];if(typeof fn!=='function')throw Error('not callable '+String(fn)+' proto '+id+' pc '+pc);const n=b===0?top-a-1:b-1,result=fn(...r.slice(a+1,a+1+n));const vals=result&&result.__luauMulti===true?result.values:[result];const out=c===0?vals.length:c-1;for(let i=0;i<out;i++)r[a+i]=vals[i];if(c===0)top=a+out;break;}
   case 'SETLIST':{const count=c===0?top-b:c-1;for(let i=0;i<count;i++)set(r[a],aux+i,r[b+i]);break;}case 'CLOSEUPVALS':break;
   case 'FASTCALL1':break; // use the ordinary fallback path
   case 'NOT':r[a]=!truth(r[b]);break;case 'OR':r[a]=truth(r[b])?r[b]:r[c];break;case 'ORK':r[a]=truth(r[b])?r[b]:k[c];break;case 'MUL':r[a]=r[b]*r[c];break;case 'ADD':r[a]=r[b]+r[c];break;case 'ADDK':r[a]=r[b]+k[c];break;case 'MULK':r[a]=r[b]*k[c];break;case 'SUB':r[a]=r[b]-r[c];break;case 'SUBK':r[a]=r[b]-k[c];break;case 'SUBRK':r[a]=k[b]-r[c];break;case 'DIVK':r[a]=r[b]/k[c];break;case 'MINUS':r[a]=-r[b];break;
   case 'LENGTH':{const v=r[b];if(typeof v==='string')r[a]=v.length;else if(v&&Number.isInteger(v.__luaLength))r[a]=v.__luaLength;else throw Error('unsupported length proto '+id+' pc '+pc);break;}
   case 'FORNPREP':{const limit=r[a],step=r[a+1],index=r[a+2];if(!(step>0?index<=limit:limit<=index))next=pc+1+d;break;}
   case 'FORNLOOP':{const limit=r[a],step=r[a+1],index=r[a+2]+=step;if(step>0?index<=limit:limit<=index)next=pc+1+d;break;}
   case 'JUMP':next=pc+1+d;break;case 'JUMPIF':if(truth(r[a]))next=pc+1+d;break;case 'JUMPIFNOT':if(!truth(r[a]))next=pc+1+d;break;
   case 'JUMPIFEQ':if(r[a]===r[aux])next=pc+1+d;break;   case 'JUMPIFNOTEQ':if(r[a]!==r[aux])next=pc+1+d;break;case 'JUMPIFLT':if(r[a]<r[aux])next=pc+1+d;break;case 'JUMPIFLE':if(r[a]<=r[aux])next=pc+1+d;break;case 'JUMPIFNOTLE':if(!(r[a]<=r[aux]))next=pc+1+d;break;
   case 'JUMPXEQKN':case 'JUMPXEQKS':{const same=r[a]===k[aux&0xffffff],invert=!!(aux&0x80000000);if(same!==invert)next=pc+1+d;break;}
   case 'JUMPXEQKNIL':{const same=r[a]===undefined||r[a]===null,invert=!!(aux&0x80000000);if(same!==invert)next=pc+1+d;break;}case 'JUMPXEQKB':{const same=r[a]===!!(aux&1),invert=!!(aux&0x80000000);if(same!==invert)next=pc+1+d;break;}
   case 'RETURN':{const n=b===0?top-a:b-1;return{value:n===1?r[a]:r.slice(a,a+n),steps};}
   default:throw Error('unsupported '+op+' proto '+id+' pc '+pc);
  }pc=next;
 }
}
function model(program,options={},coverage={}){
 const color=(r,g,b)=>({kind:'Color3',r,g,b}),udim=(scale,offset)=>({kind:'UDim',scale,offset}),v2=(x,y)=>({kind:'Vector2',x,y});
 const udim2=(xs,xo,ys,yo)=>({kind:'UDim2',xs,xo,ys,yo});
 const globals={Color3:{new:color},UDim:{new:udim},UDim2:{new:udim2,fromScale:(x,y)=>udim2(x,0,y,0),fromOffset:(x,y)=>udim2(0,x,0,y)},Vector2:{new:v2},Enum:{ScaleType:{Slice:'Enum.ScaleType.Slice'}},Rect:{new:(...x)=>({kind:'Rect',args:x})},typeof:x=>typeof x==='number'?'number':typeof x==='string'?'string':typeof x==='boolean'?'boolean':'table',AnimatedScaleIcon:'AnimatedScaleIcon'};
 const Roact={Event:{Activated:'@Activated',SelectionChanged:'@SelectionChanged'},Ref:'@Ref',createElement:(type,props,children)=>{const o={type,props};if(children!==undefined&&children!==null)o.children=children;return o}};
 const controlState={Default:'Default',Hover:'Hover',Pressed:'Pressed'};
 const style=options.style||{Theme:{BackgroundUIContrast:{Color:color(.1,.2,.3),Transparency:.2},IconEmphasis:{Color:color(.9,.8,.7),Transparency:.1},BackgroundOnPress:{Color:color(.4,.4,.4),Transparency:.3},BackgroundOnHover:{Color:color(.5,.5,.5),Transparency:.4}},Settings:{PreferredTransparency:.75}};
 const self={state:{UiScale:options.scale===undefined?1:options.scale,controlState:options.state||'Default'},props:{icon:options.icon||'tilt',iconSize:options.structuredSize?udim2(0,24,0,24):24,backgroundTransparency:.6,backgroundColor3:options.background?color(.2,.3,.4):undefined,backgroundCornerRadius:udim(.5,1),useIconScaleAnimation:!!options.animate,enableFlashingDot:!!options.flash,onActivated:'@activated',onSelectionChanged:'@selection',nextSelectionRightRef:'@next',forwardRef:'@ref',modal:true},controlStateUpdated:'@stateChanged'};
 const cursor={getCursor:x=>'cursor:'+x};
 const up=[()=>!!options.tilt,{TopBarButtonHeight:36},fn=>fn(style),controlState,Roact,'Interactable',!!options.uiLess,options.uiLess?2:0,'SkinToneCircle',!!options.chrome,!!options.console,'ImageSetLabel',()=>!!options.asyncFlash,'FlashingDotV2','FlashingDot','circle_17'];
 return run(program,11,[self,cursor],up,globals,coverage).value;
}
return {run,model};

})();const backpack=(function(){
/* Selected compiled BackpackScript instructions from the public matching-WASM
 * archive. Roblox instances, input, humanoid and services are mocked; the
 * owner's absent InExperience patch is not verified against this candidate. */
'use strict';
const {run}=core;
const UDim2=(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}});
const globals={UDim2:{new:UDim2}};
function layout(program,options={},coverage={}){
 const n=options.numberOfSlots??(options.phone?3:10),rows=options.inventoryRows??(options.phone?2:4),iconSize=options.iconSize??60;
 const tools=options.tools||[],extra=!!options.extraTool,inv={Visible:!!options.inventoryOpen},hotbar={},scroll={ScrollBarThickness:options.scrollBarThickness??6};
 const slots={__luaLength:n+1},button={},backpack={};
 for(let i=1;i<=n;i++){
  const frame={},slot={Index:i,Frame:frame,Tool:tools[i-1]?{}:undefined};
  slot.Readjust=(self,index,total)=>{self.Indexed=index;self.Total=total;return run(program,18,[self,index,total],[hotbar,iconSize,frame],globals,coverage)};slots[i]=slot;
 }
 slots[n+1]={Index:n+1,Frame:{},Tool:extra?{}:undefined};
 const full=tools.reduce((a,b)=>a+(b?1:0),0),adjust=()=>run(program,6,[!!options.forceClose],[inv,n,full,!!options.hotbarHide,slots,button,backpack],globals,coverage);
 const adjustInventory=()=>run(program,8,[],[n,slots,()=>{}],globals,coverage);
 run(program,9,[],[hotbar,n,iconSize,inv,rows,scroll,adjust,adjustInventory],globals,coverage);
 return {hotbar,inventory:inv,scroll,slots:Array.from({length:n},(_,i)=>({visible:slots[i+1].Frame.Visible,indexed:slots[i+1].Indexed||0,total:slots[i+1].Total||0,position:slots[i+1].Frame.Position||null})),extra:slots[n+1].Frame,button,hotbarVisible:backpack.IsHotbarVisible,numberOfSlots:n,iconSize};
}
function tool(program,{initial='backpack',processed=false,hasTool=true}={},coverage={}){
 const character={},backpack={},other={};const item={Parent:initial==='character'?character:initial==='backpack'?backpack:other,IsA:(_self,name)=>name==='Tool'};
 const slot={Tool:hasTool?item:undefined},globals={};let equippedCalls=0,unequippedCalls=0;const humanoid={UnequipTools:()=>{unequippedCalls++;item.Parent=backpack}};
 function equip(tool){equippedCalls++;run(program,15,[tool],[humanoid,undefined,{},false,{},character],globals,coverage)}
 run(program,32,[slot,processed],[slot,character,false,{},humanoid,undefined,{},backpack,equip],globals,coverage);
 return {parent:item.Parent===character?'character':item.Parent===backpack?'backpack':'other',equippedCalls,unequippedCalls};
}
return {layout,tool};

})();root.RobloxBackpackResearch=Object.freeze(backpack);})(window);
