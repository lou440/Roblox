/* 1145 UnibarStyle prototype, with mocked Foundation tokens. Roblox UI
 * instances, branch selection and the host renderer remain independent. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports={create:factory};else root.RobloxUnibarResearch=factory(root.RobloxRecoveredUI.core,root.RobloxUnibarStyleProgram)})(typeof globalThis!=='undefined'?globalThis:this,function(core,program){
 'use strict';
 // Native execution of the matching 1145 Dark token generator established
 // these values; the owner's active theme and UI scale are not established.
 function tokens(scale){return{Size:{Size_50:2*scale,Size_700:28*scale,Size_800:32*scale,Size_900:36*scale,Size_1100:44*scale,Size_1400:56*scale},Gap:{XXLarge:24*scale,Small:8*scale},Padding:{XSmall:4*scale,Small:8*scale,XLarge:20*scale},Radius:{Medium:8*scale},Typography:{TitleLarge:{FontSize:20*scale,Font:{Weight:'Bold'}}}}}
 function style(scale=1){if(!Number.isFinite(scale)||scale<=0)throw RangeError('scale must be positive');const UDim2={new:(xs,xo,ys,yo)=>({X:{Scale:xs,Offset:xo},Y:{Scale:ys,Offset:yo}})};return core.run(program,0,[],[()=>tokens(scale)],{UDim2}).value}
 // Translation of selected SubMenu prototype 16's non-VR sizing. Tested
 // against that prototype in native Luau with mocked hooks and services.
 function geometry({scale=1,count=2,height=768,topInset=36}={}){const s=style(scale),canvasHeight=count*s.SUB_MENU_ROW_HEIGHT,available=height-topInset-s.ICON_CELL_WIDTH,half=s.SUB_MENU_ROW_HEIGHT*.5;let minHeight=Math.min(available,canvasHeight);if(available<canvasHeight){const rows=Math.floor(available/s.SUB_MENU_ROW_HEIGHT);minHeight=rows*s.SUB_MENU_ROW_HEIGHT+(rows*s.SUB_MENU_ROW_HEIGHT+half<=available?half:-half)}return{width:4*s.ICON_CELL_WIDTH+s.UNIBAR_LEFT_MARGIN+2*s.UNIBAR_END_PADDING,relativeX:-topInset-2+s.UNIBAR_LEFT_MARGIN,canvasHeight,minHeight,bottomPadding:s.SUBMENU_BOTTOM_PADDING,rowHeight:s.SUB_MENU_ROW_HEIGHT,radius:s.SUBMENU_CORNER_RADIUS,labelFontSize:s.SUBMENU_ROW_LABEL_FONT.FontSize,iconSize:s.ICON_SIZE,rowPadding:s.SUBMENU_ROW_PADDING,paddingLeft:s.SUBMENU_PADDING_LEFT,paddingRight:s.SUBMENU_PADDING_RIGHT}}
 return Object.freeze({style,geometry,source:'selected 1145 tokenized UnibarStyle; non-VR SubMenu geometry, mocked theme/hooks and independent browser renderer'});
});
