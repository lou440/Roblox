// Restricted candidate WebClient Luau v9 interpreter and mocked adapters.
(function(root){
const core=(function(){
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
   case 'FASTCALL1':case 'FASTCALL2':case 'FASTCALL3':break; // use the ordinary fallback path
   case 'NOT':r[a]=!truth(r[b]);break;case 'OR':r[a]=truth(r[b])?r[b]:r[c];break;case 'ORK':r[a]=truth(r[b])?r[b]:k[c];break;case 'MUL':r[a]=r[b]*r[c];break;case 'ADD':r[a]=r[b]+r[c];break;case 'ADDK':r[a]=r[b]+k[c];break;case 'MULK':r[a]=r[b]*k[c];break;case 'SUB':r[a]=r[b]-r[c];break;case 'SUBK':r[a]=r[b]-k[c];break;case 'SUBRK':r[a]=k[b]-r[c];break;case 'DIVK':r[a]=r[b]/k[c];break;case 'MINUS':r[a]=-r[b];break;
   case 'JUMP':next=pc+1+d;break;case 'JUMPIF':if(truth(r[a]))next=pc+1+d;break;case 'JUMPIFNOT':if(!truth(r[a]))next=pc+1+d;break;
   case 'JUMPIFEQ':if(r[a]===r[aux])next=pc+1+d;break;   case 'JUMPIFNOTEQ':if(r[a]!==r[aux])next=pc+1+d;break;case 'JUMPIFLT':if(r[a]<r[aux])next=pc+1+d;break;case 'JUMPIFNOTLT':if(!(r[a]<r[aux]))next=pc+1+d;break;case 'JUMPIFNOTLE':if(!(r[a]<=r[aux]))next=pc+1+d;break;
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

})();
const settings=(function(){
/* Selected original compiled SettingsHub creation and Theme instructions.
 * Missing Roblox services, layout engine, event handlers and flags are mocked.
 * This is a candidate archive patch, not the owner's verified patch. */
'use strict';
const {run}=core;
function model(program,options={},coverage={}){
 const small=!!options.small,tenFoot=!!options.tenFoot,mouse=options.mouse!==false,width=options.width||1024,inset=options.topInset||0;
 const UDim=(Scale,Offset)=>({Scale,Offset});
 const UDim2=(xs,xo,ys,yo)=>({X:UDim(xs,xo),Y:UDim(ys,yo)});
 const V2=(X,Y)=>({X,Y});const Color3=(R,G,B)=>({R,G,B});
 const globals={UDim2:{new:UDim2,fromScale:(x,y)=>UDim2(x,0,y,0)},Vector2:{new:V2},Enum:{AutomaticSize:{XY:'AutomaticSize.XY'},SelectionBehavior:{Stop:'SelectionBehavior.Stop',Escape:'SelectionBehavior.Escape'},ScrollingDirection:{Y:'ScrollingDirection.Y'},ScrollBarInset:{ScrollBar:'ScrollBarInset.ScrollBar'}}};
 const colorKeys={SETTINGS_SHIELD:'IGM_Background',SETTINGS_SHIELD_TRANSPARENCY:'IGM_Background',HubBarContainer:'IGM_Background',HubBarContainerTransparency:'IGM_Background',MenuContainer:'BackgroundUIContrast'};
 const appTheme={IGM_Background:{Color:Color3(0,0,0),Transparency:1},BackgroundUIContrast:{Color:Color3(0,0,0),Transparency:.3}};
 const t=program.modules.theme,h=program.modules.hub;
 const color=(key,fallback)=>run(t,8,[key,fallback],[colorKeys,appTheme,Color3(0,0,0)],globals,coverage).value;
 const transparency=(key,fallback)=>run(t,9,[key,fallback],[colorKeys,appTheme],globals,coverage).value;
 const desktop={AnchorPoint:V2(.5,.5),Position:UDim2(.5,0,.5,10),Size:UDim2(0,0,0,0),AutomaticSize:'AutomaticSize.XY'};
 const mobile={AnchorPoint:V2(.5,1),Position:UDim2(.5,0,1,8),Size:UDim2(0,0,0,0),AutomaticSize:'AutomaticSize.XY'};
 const padDesktop={PaddingTop:UDim(0,0),PaddingLeft:UDim(0,20),PaddingRight:UDim(0,20),PaddingBottom:UDim(0,14)},padMobile={PaddingTop:UDim(0,0),PaddingLeft:UDim(0,12),PaddingRight:UDim(0,12),PaddingBottom:UDim(0,12)};
 const theme={color,transparency,DefaultScrollBarThickness:1,MenuContainerPosition:delegate=>run(t,6,[delegate],[false,small,mobile,desktop],globals,coverage).value,HubPadding:()=>run(t,5,[],[false,0,null,null,padMobile,padDesktop,small],globals,coverage).value};
 const utility={IsSmallTouchScreen:()=>small};const root={Name:'RobloxGui',AbsoluteSize:{X:width,Y:options.height||768}};
 const Create=kind=>props=>Object.assign({ClassName:kind},props);
 const self={ReactPage:{Name:'ReactPage'}};const up=Array(65).fill(undefined);Object.assign(up,{0:utility,1:self,2:Create,3:UDim2(1,0,1,inset),4:UDim2(0,0,0,-inset),5:root,6:UDim2(0,0,1,36),7:transparency('SETTINGS_SHIELD_TRANSPARENCY',.2),8:color('SETTINGS_SHIELD',Color3(41/255,41/255,41/255)),11:theme,12:tenFoot,42:{MouseEnabled:mouse}});
 let regs;
 function slice(a,b){const o=run(h,75,[],up,globals,coverage,{startPc:a,stopAt:b,registers:regs});regs=o.registers;return regs}
 slice(0,75);slice(1179,1296);regs[12]=self.Page;slice(1424,1463);slice(1851,1937);slice(2260,2390);slice(2432,2540);slice(2597,2648);slice(2648,2742);
 return {self,theme:{padding:theme.HubPadding(),menuPosition:theme.MenuContainerPosition(),shieldColor:up[8],shieldTransparency:up[7]},root};
}
function summarize(m){const keys=['ClippingShield','CanvasGroup','Shield','MenuContainer','Page','HubBar','PageViewClipper','PageView','PageViewInnerFrame','BottomButtonFrame'];const result={};for(const k of keys){const x=m.self[k],v={};for(const [key,value] of Object.entries(x)){if(key==='Parent')v.Parent=value&&value.Name||null;else v[key]=value}result[k]=v}return {instances:result,theme:m.theme};}
return {model,summarize};

})();
const tabs=(function(){
'use strict';
// Candidate patch's SettingsPageFactory Initialize/resize bytecode in a
// restricted VM. Roblox Instances, services, flags, and theme are mocks.
const {run}=core;
function build(program,opts={},coverage={}){
 const objects=[],signals=new Set(['Activated','SelectionGained','MouseButton1Click','Event']);
 const sig={connect:(self,fn)=>({Disconnect(){}})};
 function object(className,props={}){
  const v={ClassName:className},o=new Proxy(v,{get(t,k){if(k==='__values')return t;if(k in t)return t[k];if(signals.has(k))return sig;return undefined},set(t,k,value){if(k==='Parent'){const old=t.Parent;if(old&&old[t.Name]===o)delete old[t.Name];t.Parent=value;if(value&&t.Name)value[t.Name]=o;return true}t[k]=value;return true}});
  objects.push(o);for(const [k,x] of Object.entries(props))o[k]=x;return o;
 }
 const UDim2={new:(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}}),fromOffset:(x,y)=>({X:{Scale:0,Offset:x},Y:{Scale:0,Offset:y}})},UDim={new:(Scale,Offset)=>({Scale,Offset})};
 const E={Font:{SourceSansBold:'SourceSansBold'},TextXAlignment:{Left:'Left'},FillDirection:{Horizontal:'Horizontal',Vertical:'Vertical'},VerticalAlignment:{Center:'Center',Top:'Top'},HorizontalAlignment:{Center:'Center'},SortOrder:{LayoutOrder:'LayoutOrder'},AutomaticSize:{XY:'XY',Y:'Y'},FontSize:{Size14:'Size14',Size18:'Size18'}};
 const theme={TabHeaderIconPadding:5,font:()=>opts.font||'@font',textSize:x=>x*.794*(opts.uiScale||1),fontSize:x=>({Size14:'Size11',Size18:'Size14'}[x]),getIconSize:()=>opts.iconSize||24,IconSize:{Medium:'Medium'},color:()=>opts.color||{R:1,G:1,B:1},transparency:()=>opts.transparency==null?.25:opts.transparency};
 const util={IsSmallTouchScreen:()=>!!opts.small,IsPortrait:()=>!!opts.portrait,OnResized:(self,obj,fn)=>{if(opts.runResize!==false)fn()}};
 const create=(className)=>props=>object(className,props),signal={new:()=>({})};
 const up=[!!opts.sideSheet,signal,!!opts.tabFocus,create,util,!!opts.tenFoot,theme,{},!!opts.groups,!!opts.newButtons,{}, {},()=>false,{}];
 const globals={UDim2,UDim,Color3:{new:(R,G,B)=>({R,G,B})},Enum:E,Instance:{new:className=>object(className)}};
 const result=run(program,22,[],up,globals,coverage).value;return {result,objects};
}
return {build};

})();
const chat=(function(){
/* Candidate compiled ExpChat ChatWindow component on a restricted Luau VM.
 * React hooks, Roblox settings, feature flags and chat services are mocked. */
'use strict';const {run}=core;
function model(program,opts={},coverage={}){
 const udim2=(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}}),V2=(X,Y)=>({X,Y});
 const globals={type:x=>x===null||x===undefined?'nil':typeof x==='object'?'table':typeof x,UDim2:{fromScale:(x,y)=>udim2(x,0,y,0)},Vector2:{new:V2}};
 const no=()=>false;
 const React={useEffect:()=>{},useRef:x=>({current:x}),useCallback:fn=>fn,Change:{AbsoluteSize:'@AbsoluteSize',AbsolutePosition:'@AbsolutePosition'},Event:{MouseEnter:'@MouseEnter',MouseLeave:'@MouseLeave'},createElement:(type,props,children)=>{let o={type,props};if(children!==undefined&&children!==null)o.children=children;return o}};
 const dictionary={join:(a,b)=>Object.assign({},a||{},b||{})};const signal={useSignalState:x=>typeof x==='function'?x():x};const status={getChatStatus:()=>opts.chatStatus||'Enabled'},tooltip={getIsGlobalChatTooltipEligible:()=>!!opts.tooltip};
 const binding={value:opts.textTransparency||0,map:(self,fn)=>fn(self.value)};
 const defaults={size:udim2(1,0,1,0),messages:{},transparencyValue:opts.transparency||0,textTransparency:binding,visible:opts.visible!==false,chatWindowSettings:{BackgroundTransparency:opts.backgroundTransparency===undefined?.3:opts.backgroundTransparency,BackgroundColor3:opts.backgroundColor||{R:0,G:0,B:0}},onFocus:'@focus',onUnfocus:'@unfocus',onHovered:'@hover',onUnhovered:'@unhover'};
 const config={ChatWindowMaxWidth:opts.maxWidth||600,ChatWindowMaxHeight:opts.maxHeight||800,ChatWindowMessageHideRootFadeThreshold:opts.hideThreshold===undefined?1:opts.hideThreshold};
 const getStatus=()=>status,getTooltip=()=>tooltip,settings=x=>x,universe=no,optimization=no;
 const up=[dictionary,defaults,settings,false,false,no,getStatus,signal,()=>true,false,()=>({}),getTooltip,React,no,false,()=>({}),{},universe,no,()=>false,'ReportingIXP',optimization,false,{},false,false,config,false,no,'TopBanner','ScrollingView',{},'GlobalChatTooltip'];
 return run(program,20,[opts.props||{}],up,globals,coverage).value;
}
return {model};

})();
const composer=(function(){
'use strict';
// Candidate ChatInputBarV2 prototype; Foundation, React, flags, service props mocked.
const {run}=core;
function model(program,opts={},coverage={}){
 const U2=(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}}),udim=(Scale,Offset)=>({Scale,Offset});
 const E={AutomaticSize:{XY:'XY',Y:'Y'},ApplyStrokeMode:{Border:'Border'},TextTruncate:{AtEnd:'AtEnd'},TextXAlignment:{Left:'Left'},TextYAlignment:{Top:'Top'},HorizontalAlignment:{Center:'Center'},VerticalAlignment:{Center:'Center'}};
 const globals={UDim2:{new:U2,fromScale:(x,y)=>U2(x,0,y,0)},UDim:{new:udim},Vector2:{new:(X,Y)=>({X,Y})},Enum:E};
 const React={createElement:(type,props,children)=>{let x={type,props};if(children!==undefined&&children!==null)x.children=children;return x},Event:{Focused:'@Focused',FocusLost:'@FocusLost',ReturnPressedFromOnScreenKeyboard:'@KeyboardReturn'},Change:{Text:'@Text'}};
 const C={R:1,G:1,B:1},BG=opts.archiveDefaults?{R:25/255,G:27/255,B:29/255}:{R:0,G:0,B:0},P={R:178/255,G:178/255,B:178/255};
 const stroke=opts.archiveDefaults?{R:.815686,G:.85098,B:.984314}:C,content=opts.archiveDefaults?{R:.835294,G:.843137,B:.866667}:C;
 const tokens={Color:{Stroke:{Default:{Color3:stroke,Transparency:opts.archiveDefaults?.88:.2}}},DarkMode:{Content:{Default:{Color3:content}}}};
 const Foundation={Hooks:{useTokens:()=>tokens},IconButton:'FoundationIconButton',Enums:{IconName:{ArrowMediumUp:'arrow-medium-up'},ButtonVariant:{Standard:'Standard',Emphasis:'Emphasis'},InputSize:{Small:'Small'}}};
 const bind=(v)=>({value:v,map:(self,fn)=>fn(self.value)}),transparency=bind(opts.transparency||0),width=bind(opts.channelWidth||0);
 const props={setTransparency:(base,b)=>base+(1-base)*b.value,chatInputBarSettings:{BackgroundColor3:BG,TextColor3:C,PlaceholderColor3:P,TextSize:opts.archiveDefaults?14:18,SpatialPanelTextSize:18,FontFace:'BuilderSansMedium',TextStrokeTransparency:opts.archiveDefaults?.5:.8,TextStrokeColor3:BG},chatInputBarBackgroundTransparency:opts.archiveDefaults?.2:.3,isSpatialUIEnabled:!!opts.spatial,canLocalUserChatDerived:opts.canChat!==false,targetChannelWidth:width,showPlaceholderText:opts.showPlaceholder!==false,hasEmptyInputText:opts.empty!==false,cursor:'@cursor',placeholderRef:'@placeholderRef',textBoxRef:'@textBoxRef',customTextBoxRef:'@customRef',onAbsoluteSizeChanged:'@size',onFocused:'@focused',onFocusLost:'@blur',onTextChanged:'@change',onReturnPressedFromOnScreenKeyboard:'@return',onSendActivated:'@send',transparencyValue:transparency,sendButtonContainerWidth:32,targetTextChannelDisplayName:'',isChannelBarVisible:false,developerChannelTabsEnabled:false,resetTargetChannel:'@reset',disabledChatPlaceholderText:'Chat unavailable',placeholderText:'To chat click here or press / key',shouldTruncatePlaceholder:true};
 const config={ChatInputBarFont:'BuilderSansMedium',ChatInputBarPlaceholderColor:P};
 const up=[Foundation,React,!!opts.cornerFix,'ChannelChip',!!opts.fixBackspace,config,!!opts.preset,!!opts.console,!!opts.parity,false,null,!!opts.gamepad];
 return run(program,4,[props],up,globals,coverage).value;
}
return {model};

})();
const scroll=(function(){
'use strict';
// Candidate ScrollingView render prototype. Child scroll service is mocked.
const {run}=core;
function model(program,opts={},coverage={}){
 const U2=(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}}),globals={UDim2:{fromScale:(x,y)=>U2(x,0,y,0)}};
 const React={createElement:(type,props,children)=>{let x={type,props};if(children!==undefined&&children!==null)x.children=children;return x}},dict={join:(a,b)=>Object.assign({},a||{},b||{})};
 const self={props:{size:U2(1,0,1,0),isChannelBarVisible:false,scrollResetKey:'@reset',scrollToTopOnReset:false,onCanvasPositionChanged:'@scroll',contentTopPadding:0,showTranslationButton:false,chatWindowSettings:{},textTransparency:0,onTextMessageLabelButtonActivated:'@activate',isSpatialUIEnabled:false,chatWindowTransparencyBindable:0,visible:true,selectedChannelName:'',historicalMessageCountSignal:0,messageComponentsSignal:opts.messages||{}}};
 const up=[!!opts.v2,()=>!!opts.universe,React,'BottomLockedScrollViewV3',dict,!!opts.friends];return run(program,0,[self],up,globals,coverage).value;
}
return {model};

})();
const bottom_scroll=(function(){
'use strict';
// Candidate BottomLockedScrollViewV3 render prototype. Effects, Roblox services,
// Signals and UI style are mocked, so interaction behavior is not reproduced.
const {run}=core;
function model(program,opts={},coverage={}){
 const U2=(xs=0,xo=0,ys=0,yo=0)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}}),udim=(Scale,Offset)=>({Scale,Offset}),V2=(X,Y)=>({X,Y});
 const globals={type:x=>x===null||x===undefined?'nil':typeof x==='object'?'table':typeof x,UDim:{new:udim},UDim2:{new:U2,fromScale:(x,y)=>U2(x,0,y,0)},Vector2:{new:V2},Enum:{AutomaticSize:{Y:'Y'},ScrollBarInset:{Always:'Always'},ScrollingDirection:{Y:'Y'}}};
 const bind=(v)=>({value:v,map:(self,fn)=>fn(self.value)});
 const React={useRef:x=>({current:x}),useBinding:x=>({__luauMulti:true,values:[bind(x),'@setBinding']}),useCallback:fn=>fn,useEffect:()=>{},createElement:(type,props,children)=>{let x={type,props};if(children!==undefined&&children!==null)x.children=children;return x},Event:{InputBegan:'@InputBegan',InputEnded:'@InputEnded'},Change:{CanvasPosition:'@CanvasPosition',AbsoluteWindowSize:'@AbsoluteWindowSize'},Fragment:'Fragment'};
 const signal={useSignalState:x=>x},style=()=>({Theme:{UIEmphasis:{Color:{R:1,G:1,B:1}}}});
 const input={PreferredInput:'Keyboard'},config={ChatWindowScrollBarThickness:8};
 const up=[style,React,!!opts.osa,signal,input,{},false,.9,()=>false,()=>{},!!opts.friends,!!opts.historical,()=>{},config,!!opts.inset,!!opts.limit,!!opts.warm];
 const props={Size:U2(1,0,1,0),scrollToTopOnReset:false,onCanvasPositionChanged:'@scroll',scrollResetKey:'@reset',selectedChannelName:'',isChannelBarVisible:false,historicalMessageCountSignal:0,messageComponentsSignal:{},contentTopPadding:opts.padding===undefined?0:opts.padding};
 return run(program,15,[props],up,globals,coverage).value;
}
return {model};

})();
const graphics=(function(){
/* Candidate GameSettings.createGraphicsOptions prefix. Controls, event
 * connections, settings service and target flags are mocked; callbacks and
 * engine graphics behavior are outside this restricted adapter. */
'use strict';const {run}=core;
function model(program,opts={},coverage={}){
 const signal={connect:()=>({})},page={},rows=[];
 const settings={InFullScreen:()=>!!opts.fullscreen,SavedQualityLevel:opts.manual?'Manual':'Automatic',FullscreenChanged:signal};
 const utility={AddNewRow:(self,page,name,kind,options,initial)=>{const frame={},control={IndexChanged:signal,SetMinStep:(self,min)=>{control.minStep=min}};rows.push({name,kind,options:typeof options==='number'?options:[options[1],options[2]],initial,frame,control});return {__luauMulti:true,values:[frame,{},control]}}};
 const base=opts.offset||0,orders={FullScreenFrame:70+base,GraphicsEnablerFrame:71+base,GraphicsQualityFrame:72+base};
 const up=[settings,page,utility,orders,{},...Array(17).fill({})],globals={Enum:{SavedQualitySetting:{Automatic:'Automatic'}}};
 run(program,23,[],up,globals,coverage,{stopAt:143});return rows.map(r=>({name:r.name,kind:r.kind,options:r.options,initial:r.initial,layoutOrder:r.frame.LayoutOrder,...(r.control.minStep!==undefined?{minStep:r.control.minStep}:{})}));
}

function oneRow(program,id,up,globals,args,stopAt,coverage){
 const rows=[],utility={AddNewRow:(self,page,name,kind,options,initial)=>{const frame={},control={ValueChanged:{connect:(self,fn)=>{globals.connected=true}}};rows.push({name,kind,options:typeof options==='number'?options:[options[1],options[2]],initial,frame});return {__luauMulti:true,values:[frame,{},control]}}};up[2]=utility;
 run(program,id,args,up,globals,coverage,{stopAt});return rows.map(r=>({name:r.name,kind:r.kind,options:r.options,initial:r.initial,layoutOrder:r.frame.LayoutOrder}));
}
function shift(program,opts={},coverage={}){
 const page={},up=[page,{ControlMode:opts.locked?'MouseLockSwitch':'Classic'},null,{ShiftLockFrame:10+(opts.offset||0)},{}],globals={Enum:{ControlMode:{MouseLockSwitch:'MouseLockSwitch'}}};return oneRow(program,85,up,globals,[false],62,coverage)[0];
}
function performance(program,opts={},coverage={}){
 const page={},up=[page,{PerformanceStatsVisible:!!opts.visible},null,{PerformanceStatsFrame:80+(opts.offset||0)}],globals={};return oneRow(program,46,up,globals,[],54,coverage)[0];
}
function volume(program,opts={},coverage={}){
 const page={},settings={MasterVolume:opts.level==null?0:opts.level},translator={FormatByKey:()=>"Main Volume"},up=[settings,page,null,!!opts.rename,translator,{VolumeFrame:62+(opts.offset||0)},{},{},{}],globals={math:{floor:Math.floor},Instance:{new:()=>({})},game:{GetService:()=>({RobloxGui:{Sounds:{}}})}};
 const result=oneRow(program,110,up,globals,[],undefined,coverage)[0];result.connected=!!globals.connected;return result;
}
function guiToEngine(program,value,coverage={}){return run(program,126,[value],[],{},coverage).value}
function engineToGui(program,value,coverage={}){return run(program,125,[value],[],{math:{floor:Math.floor}},coverage).value}
return {model,shift,volume,performance,guiToEngine,engineToGui};

})();
root.RobloxRecoveredUI=Object.freeze({core,settings,tabs,chat,composer,scroll,bottom_scroll,graphics,source:"candidate archive patch; not verified as the owner patch"});
})(window);
