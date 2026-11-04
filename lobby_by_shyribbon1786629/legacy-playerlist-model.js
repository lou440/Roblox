/* 1145 legacy PlayerList layout prototype with mocked engine values.
 * The active PlayerList branch/experiment and its rendering are unverified. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports={create:factory};else root.RobloxLegacyPlayerListResearch=factory(root.RobloxRecoveredUI.core,root.RobloxLegacyPlayerListProgram)})(typeof globalThis!=='undefined'?globalThis:this,function(core,program){
 'use strict';
 const u=(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}}),globals={UDim2:{new:u,fromOffset:(x,y)=>u(0,x,0,y)},Vector2:{new:(x,y)=>({X:x,Y:y})},Color3:{fromRGB:(r,g,b)=>({R:r/255,G:g/255,B:b/255})},BrickColor:{new:s=>({Name:s})},Rect:{new:(...v)=>v},Enum:{Font:{SourceSans:'SourceSans',SourceSansBold:'SourceSansBold'},FriendStatus:{Friend:'Friend',FriendRequestReceived:'Pending'},MembershipType:{Premium:'Premium'}}};
 function layout(topBarHeight=36){return core.run(program,0,[false,{TopBarHeight:topBarHeight}],[{},false,{}],globals).value}
 // Translation of the legacy desktop PlayerListApp's selected sizing slice;
 // wide viewports, no active platform leaderboard. Differential-tested against
 // the native 1145 slice. Actual player data and UI services are not present.
 function geometry({width=1365,scale=1,topBarHeight=36,statCount=0}={}){
  const l=layout(topBarHeight),count=Math.min(Math.max(0,statCount),l.MaxLeaderstats),extraStats=count*(l.StatEntrySizeX+l.EntryPadding),baseWidth=l.ExtraContainerPadding+extraStats,entryBeforeClamp=l.EntryBaseSizeX+Math.min(4,count)*l.EntrySizeIncreasePerStat;
  const dropdown=l.PlayerDropDownSizeX+l.PlayerDropDownOffset,needed=baseWidth+l.ContainerPadding*2+dropdown,entry=width<needed?width-needed:entryBeforeClamp,panelWidth=baseWidth+entry;
  return{panelWidth,entryWidth:entry,statCount:count,topOffset:l.ContainerPosition.Y.Offset+l.TopBarOffset*scale,rightOffset:-l.ContainerPosition.X.Offset,rowHeight:l.PlayerEntrySizeY,iconSize:l.PlayerIconSize.X.Offset,nameSize:l.PlayerNameTextSize,nameStart:l.InitalPlayerEntryPadding+l.PlayerIconSize.X.Offset+l.PlayerEntryPadding,headerHeight:18,columnHeaderHeight:0,bottomCapHeight:7,panelHeight:18+l.PlayerEntrySizeY+7};
 }
 return Object.freeze({layout,geometry,source:'selected 1145 legacy desktop PlayerList with mocked layout/services; no active stats/platform leaderboard'});
});
