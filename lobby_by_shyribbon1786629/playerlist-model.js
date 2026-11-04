/* Selected PlayerList layout programs from the owner-matched 1145 patch.
 * Roblox engine objects, React hooks, feature experiments and services below
 * are supplied as mocks; the DOM adapter is not the original renderer. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports={create:factory};else root.RobloxPlayerListResearch=factory(root.RobloxRecoveredUI.core,root.RobloxPlayerListPrograms)})(typeof globalThis!=='undefined'?globalThis:this,function(core,programs){
 'use strict';
 const {run}=core,enumMock={Enum:{SelectionBehavior:{Stop:'Stop',Escape:'Escape'}}};
 const constants=run(programs.constants,0,[],[],enumMock,{}, {startPc:1}).value;
 const globals={math:{min:Math.min,max:Math.max,clamp:(x,a,b)=>Math.max(a,Math.min(x,b))},Vector2:{new:(x,y)=>({X:x,Y:y})}};
 function desktopHeight(height,desired,minimum){return run(programs.desktopHeight,0,[height,desired,minimum],[constants],globals).value}
 function mobileSize(viewport,min,max,bottom){return run(programs.mobileSize,1,[viewport,min,max,bottom],[constants],globals).value}
 function layout(o={}){
  const scale=o.scale??1,viewport={X:o.width??innerWidth,Y:o.height??innerHeight},size200=o.size200??8*scale,body=o.bodyHeight??30;
  const tokens={Config:{UI:{Scale:scale}},Size:{Size_200:size200}},mobile=o.mobileOverride||mobileSize;
  const up=[()=>viewport,()=>tokens,{useContext:()=>({TopBarOffset:o.topBarOffset??8})},{},{useSignalState:()=>body},{getBodyContentHeight:()=>body},constants,n=>n*scale,()=>o.bottomInset??0,mobile,!!o.reskin,o.fixPlatformSizing!==false,desktopHeight];
  return run(programs.layout,0,[!!o.small,o.statCount??0,!!o.platform],up,globals).value;
 }
 return Object.freeze({constants,desktopHeight,mobileSize,layout,source:'selected PlayerList 1145 compiled prototypes; hooks, services and renderer mocked'});
});
