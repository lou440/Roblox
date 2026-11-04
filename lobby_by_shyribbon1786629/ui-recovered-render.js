/* DOM bridge for selected candidate WebClient GUI bytecode outputs.
 * This is not Roblox's GUI renderer. The candidate archive patch is a different
 * size from the missing target patch. Runtime flags, services, hooks and active
 * style are mocked; page content/interaction adapters remain partial. */
(() => {
 'use strict';
 const p=window.RobloxRecoveredUIPrograms,ui=window.RobloxRecoveredUI,config=window.RobloxChatConfigResearch;
 if(!p||!ui){console.error('Candidate UI bytecode programs were not loaded');return}
 const $=id=>document.getElementById(id),menu=$('rbx-menu-button'),overlay=$('rbx-menu-overlay'),dialog=overlay.querySelector('.rbx-menu-dialog');
 const bar=dialog.querySelector('.rbx-tabs'),pages=dialog.querySelector('.rbx-menu-pages'),actions=dialog.querySelector('.rbx-menu-actions');
 const chat=$('rbx-chat-panel'),chatWindow=$('rbx-chat-window'),messages=$('rbx-chat-messages'),chatInput=$('rbx-chat-input'),chatForm=$('rbx-chat-form'),send=chatForm.querySelector('button');
 const rgba=(c,t=0)=>`rgba(${Math.round((c.R??c.r)*255)},${Math.round((c.G??c.g)*255)},${Math.round((c.B??c.b)*255)},${Math.max(0,Math.min(1,1-t))})`;
 const C=(r,g,b)=>({kind:'Color3',r,g,b});
 // Archived UIBlox DarkTheme; whether this is the owner's active style is unknown.
 const dark={Theme:{BackgroundUIContrast:{Color:C(0,0,0),Transparency:.3},IconEmphasis:{Color:C(1,1,1),Transparency:0},BackgroundOnPress:{Color:C(0,0,0),Transparency:.7},BackgroundOnHover:{Color:C(1,1,1),Transparency:.9}},Settings:{PreferredTransparency:1}};
 let iconState='Default',last=null,lastError=null,settingsRows=[];
 // Selected GameSettings row-creation instructions execute in the restricted
 // VM. DOM controls/services are adapters, not Roblox's Instance renderer.
 // Only the seven font/icon files have been independently hash-matched to the
 // owner's 1145 download. The active settings experiment is still unknown.
 const localSettings={shiftLock:true,shiftLocked:false,cameraMode:'Default (Classic)',movementMode:'Default (Keyboard)',graphicsMode:'Automatic',graphicsQuality:10,performance:false,chatSummaries:false,chatRephrased:true,chatTranslations:true};
 function setLocalSetting(key,value){localSettings[key]=value;if(key==='shiftLock'&&!value)localSettings.shiftLocked=false;window.dispatchEvent(new CustomEvent('hud:local-settings',{detail:{...localSettings}}))}
 window.__localSettings=Object.freeze({getState:()=>({...localSettings}),setShiftLocked(value){setLocalSetting('shiftLocked',!!value&&localSettings.shiftLock)}});
 let masterVolume=.5;
 window.__localAudio=Object.freeze({get volume(){return masterVolume},setVolume(value){masterVolume=Math.max(0,Math.min(1,Number(value)||0));window.dispatchEvent(new CustomEvent('hud:volume-changed',{detail:{volume:masterVolume}}))}});
 function makeSegmentSlider(label,range,enabled){
  const control=document.createElement('div');control.className='rbx-recovered-slider';
  const less=document.createElement('button'),more=document.createElement('button'),steps=document.createElement('div');
  less.type=more.type='button';less.className='rbx-segment-arrow rbx-less';more.className='rbx-segment-arrow rbx-more';
  less.setAttribute('aria-label','Decrease '+label);more.setAttribute('aria-label','Increase '+label);steps.className='rbx-slider-steps';steps.setAttribute('aria-hidden','true');
  const count=Number(range.max);for(let i=1;i<=count;i++){const part=document.createElement('span');part.className='rbx-slider-step';steps.append(part)}
  range.disabled=!enabled;range.setAttribute('aria-label',label);
  function refresh(){const n=Number(range.value);Array.from(steps.children).forEach((part,i)=>part.classList.toggle('is-on',i<n));less.disabled=!enabled||n<=Number(range.min);more.disabled=!enabled||n>=Number(range.max)}
  function change(delta){range.value=String(Math.max(Number(range.min),Math.min(Number(range.max),Number(range.value)+delta)));range.dispatchEvent(new Event('input',{bubbles:true}))}
  less.addEventListener('click',()=>change(-1));more.addEventListener('click',()=>change(1));range.addEventListener('input',refresh);control.append(less,steps,range,more);refresh();
  return {control,refresh,setEnabled(value){enabled=!!value;range.disabled=!enabled;refresh()}};
 }
 function buildSettingsRows(){
  const section=$('rbx-page-settings'),sensitivity=section.querySelector('.rbx-setting-row'),sensitivityLabel=sensitivity.firstElementChild;
  sensitivity.dataset.layoutOrder='50';sensitivity.dataset.setting='Camera Sensitivity';sensitivityLabel.querySelector('small')?.remove();
  const sensRange=$('rbx-sensitivity'),sensOutput=$('rbx-sensitivity-value'),sensSlider=makeSegmentSlider('Camera Sensitivity',sensRange,true);
  const sensControl=document.createElement('div');sensControl.className='rbx-sensitivity-control';
  const entry=document.createElement('input');entry.type='text';entry.inputMode='decimal';entry.className='rbx-sensitivity-entry';entry.id='rbx-sensitivity-entry';entry.setAttribute('aria-label','Camera sensitivity value');entry.value='1';
  sensOutput.className='sr-only';sensControl.append(sensSlider.control,entry,sensOutput);sensitivity.replaceChildren(sensitivityLabel,sensControl);
  entry.addEventListener('blur',()=>window.dispatchEvent(new CustomEvent('hud:sensitivity-input',{detail:{text:entry.value}})));
  entry.addEventListener('keydown',e=>{if(e.key==='Enter'){entry.blur();e.preventDefault()}});
  window.addEventListener('hud:sensitivity-changed',e=>{entry.value=String(Number(e.detail.value.toFixed(3)));sensSlider.refresh()});
  const touch=matchMedia('(pointer:coarse)').matches;
  // The selected GameSettings branch creates mouse sensitivity only when a mouse is present.
  sensitivity.hidden=touch;
  const modeRows=[{name:'Camera Mode',kind:'Selector',options:[touch?'Default (Follow)':'Default (Classic)','Classic','Follow'],initial:1,layoutOrder:11},
   {name:'Movement Mode',kind:'Selector',options:[touch?'Default (Dynamic Thumbstick)':'Default (Keyboard)','Click to Move'],initial:1,layoutOrder:12}];
  localSettings.cameraMode=modeRows[0].options[0];localSettings.movementMode=modeRows[1].options[0];
  const rows=[ui.graphics.shift(p.graphics,{locked:true}),...modeRows,ui.graphics.volume(p.graphics,{level:.5,rename:false}),...ui.graphics.model(p.graphics,{fullscreen:!!document.fullscreenElement,manual:false}),ui.graphics.performance(p.graphics,{visible:false})];
  const elements=[];let qualitySlider=null;
  for(const row of rows){
   const outer=document.createElement('div');outer.className='rbx-setting-row rbx-recovered-setting';outer.dataset.layoutOrder=String(row.layoutOrder);outer.dataset.setting=row.name;
   if(touch&&row.name==='Shift Lock Switch')outer.hidden=true;
   const label=document.createElement('div');label.className='rbx-setting-label';const strong=document.createElement('strong');strong.textContent=row.name;label.append(strong);outer.append(label);
   if(row.kind==='Selector'){
    const control=document.createElement('div');control.className='rbx-recovered-selector';const left=document.createElement('button'),value=document.createElement('span'),right=document.createElement('button');
    left.type=right.type='button';left.className='rbx-previous';right.className='rbx-next';left.setAttribute('aria-label',row.name+' previous');right.setAttribute('aria-label',row.name+' next');
    let index=row.initial-1;const fullscreen=row.name==='Fullscreen',usable=fullscreen?(!!document.fullscreenEnabled&&typeof document.documentElement.requestFullscreen==='function'):['Shift Lock Switch','Camera Mode','Movement Mode','Graphics Mode','Performance Stats'].includes(row.name);
    function refreshSelector(){value.textContent=row.options[index];left.disabled=!usable;right.disabled=!usable}
    function applySelection(){const v=row.options[index];if(row.name==='Shift Lock Switch')setLocalSetting('shiftLock',v==='On');else if(row.name==='Camera Mode')setLocalSetting('cameraMode',v);else if(row.name==='Movement Mode')setLocalSetting('movementMode',v);else if(row.name==='Graphics Mode'){setLocalSetting('graphicsMode',v)}else if(row.name==='Performance Stats')setLocalSetting('performance',v==='On');refreshSelector()}
    async function change(delta){if(!usable)return;const next=(index+delta+row.options.length)%row.options.length;if(next===index)return;if(fullscreen){try{if(row.options[next]==='On'&&!document.fullscreenElement)await document.documentElement.requestFullscreen();else if(row.options[next]==='Off'&&document.fullscreenElement)await document.exitFullscreen()}catch(e){control.dataset.adapterNote='Fullscreen unavailable in this browser'}index=document.fullscreenElement?row.options.indexOf('On'):row.options.indexOf('Off');refreshSelector()}else{index=next;applySelection()}}
    if(row.options.length===1){left.style.visibility='hidden';right.style.visibility='hidden'}if(!usable)control.dataset.adapterNote='This setting is unavailable in this browser';else if(!fullscreen)control.dataset.adapterNote='Offline browser adaptation; not a Roblox service';
    left.addEventListener('click',()=>change(-1));right.addEventListener('click',()=>change(1));if(usable&&row.options.length===2){value.setAttribute('role','button');value.setAttribute('tabindex','0');value.setAttribute('aria-label','Toggle '+row.name);value.addEventListener('click',()=>change(1));value.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();change(1)}})}if(fullscreen)document.addEventListener('fullscreenchange',()=>{index=row.options.indexOf(document.fullscreenElement?'On':'Off');refreshSelector()});refreshSelector();
    control.append(left,value,right);outer.append(control);
   }else{
    const range=document.createElement('input');range.type='range';range.min='0';range.max=String(row.options);range.step='1';range.value=String(row.initial);
    const volume=row.name==='Volume',quality=row.name==='Graphics Quality';if(quality){range.min='1';range.max='10';range.value=String(localSettings.graphicsQuality)}const slider=makeSegmentSlider(row.name,range,volume||quality);if(volume){range.id='rbx-volume';slider.control.dataset.adapterNote='Controls the embedded sword sounds';range.addEventListener('input',()=>window.__localAudio.setVolume(Number(range.value)/10));window.__localAudio.setVolume(Number(range.value)/10)}else if(quality){range.id='rbx-graphics-quality';qualitySlider=slider;slider.control.dataset.adapterNote='Caps render resolution, frame rate and remote detail (1-10)';range.addEventListener('input',()=>setLocalSetting('graphicsQuality',Number(range.value)))}else slider.control.dataset.adapterNote='This Roblox setting is not implemented in the offline adapter';outer.append(slider.control);
   }
   elements.push(outer);
  }
  elements.push(sensitivity);elements.sort((a,b)=>Number(a.dataset.layoutOrder)-Number(b.dataset.layoutOrder));
  const byName=new Map(elements.map(element=>[element.dataset.setting,element]));
  function heading(text){const h=document.createElement('h3');h.className='rbx-setting-group-title';h.textContent=text;return h}
  function outputRow(){const outer=document.createElement('div'),label=document.createElement('div'),strong=document.createElement('strong'),control=document.createElement('div'),left=document.createElement('button'),value=document.createElement('span'),right=document.createElement('button');outer.className='rbx-setting-row rbx-recovered-setting';outer.dataset.setting='Output Device';label.className='rbx-setting-label';strong.textContent='Output Device';label.append(strong);control.className='rbx-recovered-selector';left.type=right.type='button';left.className='rbx-previous';right.className='rbx-next';left.setAttribute('aria-label','Output Device previous');right.setAttribute('aria-label','Output Device next');value.textContent='Default (Browser Audio)';control.title='Only the default browser output is available in this offline adapter';control.append(left,value,right);outer.append(label,control);return outer}
  function preference(name,description,key){const outer=document.createElement('div'),label=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small'),control=document.createElement('div'),left=document.createElement('button'),value=document.createElement('span'),right=document.createElement('button');outer.className='rbx-setting-row rbx-recovered-setting rbx-chat-preference';outer.dataset.setting=name;label.className='rbx-setting-label';strong.textContent=name;small.textContent=description+' Online service unavailable offline.';label.append(strong,small);control.className='rbx-recovered-selector';control.title='Local preference only; the Roblox online service is unavailable';left.type=right.type='button';left.className='rbx-previous';right.className='rbx-next';left.setAttribute('aria-label',name+' previous');right.setAttribute('aria-label',name+' next');value.setAttribute('role','button');value.setAttribute('tabindex','0');value.setAttribute('aria-label','Toggle '+name);function refresh(){value.textContent=localSettings[key]?'On':'Off'}function toggle(){setLocalSetting(key,!localSettings[key]);refresh()}left.addEventListener('click',toggle);right.addEventListener('click',toggle);value.addEventListener('click',toggle);value.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});refresh();control.append(left,value,right);outer.append(label,control);return outer}
  const arranged=[heading('Audio'),byName.get('Volume'),outputRow(),heading('Chat & Language'),preference('Chat summaries','Roblox auto-generates summaries of player messages.','chatSummaries'),preference('Rephrased messages','Roblox may rephrase messages that break safety rules.','chatRephrased'),preference('Automatic Translations','Automatically translate experiences when your selected language is not supported.','chatTranslations'),heading('Controls'),byName.get('Shift Lock Switch'),byName.get('Camera Mode'),byName.get('Movement Mode'),byName.get('Camera Sensitivity'),heading('Graphics'),byName.get('Graphics Mode'),byName.get('Graphics Quality'),byName.get('Fullscreen'),byName.get('Performance Stats')].filter(Boolean);
  section.replaceChildren(...arranged);
  settingsRows=rows.map(r=>({name:r.name,kind:r.kind,options:r.options,initial:r.initial,layoutOrder:r.layoutOrder,source:modeRows.includes(r)?'current patch strings/order; browser mode adapter':'selected candidate GameSettings instructions'}));
 }
 try{buildSettingsRows()}catch(e){lastError=String(e&&e.stack||e);console.error('Candidate settings rows failed:',e)}
 const referenceScale=()=>innerWidth<=620?1:1.1;
 function renderMenuIcon(){
  const tree=ui.core.model(p.icon,{tilt:true,icon:'tilt',state:iconState,style:dark});const v=tree.props,icon=tree.children.Icon.props,overlayTree=tree.children.StateOverlayRound;
  const size=v.Size;menu.style.width=Math.max(size.xo,44)*referenceScale()+'px';menu.style.height=Math.max(size.yo,44)*referenceScale()+'px';menu.style.backgroundColor=rgba(v.BackgroundColor3,v.BackgroundTransparency);menu.style.borderRadius='50%';
  const span=menu.querySelector('.rbx-icon');span.style.fontSize=icon.Size.xo*referenceScale()+'px';span.style.color=rgba(icon.ImageColor3,icon.ImageTransparency);
  let wash=menu.querySelector('.rbx-recovered-icon-overlay');if(!wash){wash=document.createElement('span');wash.className='rbx-recovered-icon-overlay';wash.setAttribute('aria-hidden','true');menu.append(wash)}
  wash.style.backgroundColor=overlayTree?rgba(overlayTree.props.BackgroundColor3,overlayTree.props.BackgroundTransparency):'transparent';
  return {size:size.xo,iconSize:icon.Size.xo,backgroundTransparency:v.BackgroundTransparency};
 }
 function applyLayout(){
  try{
   const small=(navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches)&&(innerWidth<700||innerHeight<500),portrait=innerHeight>innerWidth;
   const hub=ui.settings.model(p.settings,{small,width:innerWidth,height:innerHeight}),hv=hub.self.HubBar.Size,bv=hub.self.BottomButtonFrame.Size,cv=hub.self.PageViewClipper.Size,mp=hub.theme.menuPosition,pad=hub.theme.padding;
   const width=Math.max(1,hv.X.Offset),pageHeight=Math.max(96,Math.min(innerHeight*.5+cv.Y.Offset,innerHeight-hv.Y.Offset-bv.Y.Offset-pad.PaddingBottom.Offset-24));
   dialog.style.width=(width+pad.PaddingLeft.Offset+pad.PaddingRight.Offset)+'px';dialog.style.maxWidth='calc(100vw - 16px)';dialog.style.maxHeight='calc(100vh - 12px)';
   dialog.style.padding=`${pad.PaddingTop.Offset}px ${pad.PaddingRight.Offset}px ${pad.PaddingBottom.Offset}px ${pad.PaddingLeft.Offset}px`;
   dialog.style.left=`calc(${mp.Position.X.Scale*100}% + ${mp.Position.X.Offset}px)`;dialog.style.top=`calc(${mp.Position.Y.Scale*100}% + ${mp.Position.Y.Offset}px)`;
   dialog.style.transform=`translate(${-100*mp.AnchorPoint.X}%,${-100*mp.AnchorPoint.Y}%)`;
   dialog.style.backgroundColor=rgba(hub.self.MenuContainer.BackgroundColor3,hub.self.MenuContainer.BackgroundTransparency);
   bar.style.height=hv.Y.Offset+'px';bar.style.justifyContent=small&&252>width?'flex-start':'center';pages.style.height=pageHeight+'px';actions.style.height=bv.Y.Offset+'px';
   const layout=ui.tabs.build(p.tabs,{small,portrait,transparency:0});
   const find=n=>{const o=layout.objects.find(x=>x.Name===n);if(!o)throw Error('tab instance missing: '+n);return o.__values};
   const header=find('Header'),icon=find('Icon'),title=find('Title'),list=find('Layout'),selection=find('TabSelection');
   for(const button of bar.querySelectorAll('[data-rbx-tab]')){
    const slot=header.Size.X;button.style.flex=slot.Scale?`0 0 ${slot.Scale*100}%`:`0 0 ${slot.Offset}px`;button.style.flexDirection=list.FillDirection==='Vertical'?'column':'row';button.style.gap=list.Padding.Offset+'px';
    const si=button.querySelector('.rbx-tab-icon'),st=button.querySelector('.rbx-tab-title'),line=button.querySelector('.rbx-tab-selection');
    si.style.width=icon.Size.X.Offset+'px';si.style.height=icon.Size.Y.Offset+'px';si.style.fontSize=icon.Size.Y.Offset+'px';st.style.fontSize=title.TextSize+'px';line.style.height=selection.Size.Y.Offset+'px';line.style.left=selection.Position.X.Offset+'px';line.style.width=`calc(100% + ${selection.Size.X.Offset}px)`;
   }
   // Screenshot-based new-menu host; the legacy bytecode values above remain research only.
   const compact=innerWidth<=620;dialog.style.boxSizing='border-box';dialog.style.width=Math.max(1,Math.min(920,innerWidth-16))+'px';dialog.style.height=Math.max(1,Math.min(580,innerHeight-16))+'px';dialog.style.padding=compact?'0 10px 10px':'0 24px 16px';dialog.style.left='50%';dialog.style.top='50%';dialog.style.transform='translate(-50%,-50%)';bar.style.height=compact?'52px':'64px';bar.style.justifyContent='space-between';pages.style.height='auto';pages.style.flex='1 1 auto';actions.style.height=compact?'46px':'52px';
   for(const button of bar.querySelectorAll('[data-rbx-tab]')){button.style.flex='1 1 25%';button.style.flexDirection='row';button.style.gap=compact?'4px':'10px';const si=button.querySelector('.rbx-tab-icon'),st=button.querySelector('.rbx-tab-title'),line=button.querySelector('.rbx-tab-selection');si.style.width=si.style.height=si.style.fontSize=(compact?18:22)+'px';st.style.fontSize=(compact?13:16)+'px';line.style.left='0';line.style.width='100%'}
   const windowTree=ui.chat.model(p.chat,{maxWidth:config.ChatWindowMaxWidth,maxHeight:config.ChatWindowMaxHeight,hideThreshold:config.ChatWindowMessageHideRootFadeThreshold,backgroundColor:config.ChatWindowBackgroundColor3,transparency:config.ChatWindowBackgroundTransparency});
   const max=windowTree.children.uiSizeConstraint.props.MaxSize,scrollTree=ui.scroll.model(p.scroll,{v2:true});
   const gui=referenceScale(),capW=Math.max(1,innerWidth-16),capH=Math.max(1,innerHeight-80),defaultW=Math.min(capW,Math.min(max.X,innerWidth*config.ChatWindowSize.X.Scale)*gui),defaultH=Math.min(capH,Math.max(240*gui,Math.min(340,innerHeight*.32)*gui)),w=Math.max(Math.min(240,capW),Math.min(capW,Number(chat.dataset.userWidth)||defaultW)),h=Math.max(Math.min(160,capH),Math.min(capH,Number(chat.dataset.userHeight)||defaultH));chat.style.width=w+'px';chat.style.height=h+'px';chat.style.setProperty('--chat-background',rgba(windowTree.props.BackgroundColor3,windowTree.props.BackgroundTransparency));chat.style.left=config.ChatLayoutPosition.X.Offset*gui+'px';chatWindow.style.height='auto';chatWindow.style.backgroundColor='transparent';
   chatWindow.dataset.scrollingComponent=scrollTree.children.bottomLockedScrollView.type;
   const bottomTree=ui.bottom_scroll.model(p['bottom-scroll'],{}),scrollbar=bottomTree.children.scrollView.props,scrollPadding=bottomTree.children.padding.props;
   messages.style.padding=`${scrollPadding.PaddingTop.Offset}px ${scrollPadding.PaddingRight.Offset}px ${scrollPadding.PaddingBottom.Offset}px ${scrollPadding.PaddingLeft.Offset}px`;messages.style.setProperty('--rbx-scrollbar-width',scrollbar.ScrollBarThickness+'px');
   const chatResult=applyComposer();last={small,portrait,hubWidth:width,hubHeight:hv.Y.Offset,pageHeight,tabIconSize:icon.Size.X.Offset,tabTitleSize:title.TextSize,chatWidth:w,chatHeight:h,chatMaxWidth:max.X,chatMaxHeight:max.Y,chatBackgroundIdleSeconds:config.ChatWindowBackgroundFadeOutTime,chatTextIdleSeconds:config.ChatWindowTextFadeOutTime,chatConfigSource:config.ChatWindowTextSize===18?'owner-matched 1145 Config fallback; documented engine text default 14':'unknown',scrollbarWidth:scrollbar.ScrollBarThickness,scrollPadding:scrollPadding.PaddingLeft.Offset,composer:chatResult,icon:renderMenuIcon()};lastError=null;
  }catch(e){lastError=String(e&&e.stack||e);console.error('Candidate UI bridge failed:',e)}
 }
 function applyComposer(){
  const tree=ui.composer.model(p.composer,{archiveDefaults:true,cornerFix:true,empty:chatInput.value.length===0,showPlaceholder:chatInput.value.length===0});
  const group=tree.children.Container.children.InputGroup,stroke=group.children.UIStroke.props,pad=group.children.TextContainer.children.UIPadding.props,text=group.children.TextContainer.children.TextBoxContainer.children.TextBox.props,submit=group.children.SendButtonContainer.children.SendButton.props;
  chatForm.style.backgroundColor=rgba(group.props.BackgroundColor3,group.props.BackgroundTransparency);chatForm.style.borderColor=rgba(stroke.Color,stroke.Transparency);chatForm.style.borderRadius=group.children.UICorner.props.CornerRadius.Scale?'999px':group.children.UICorner.props.CornerRadius.Offset+'px';
  chatInput.style.fontSize=text.TextSize*referenceScale()+'px';chatInput.style.color=rgba(text.TextColor3,text.TextTransparency);chatInput.style.padding=`${pad.PaddingTop.Offset*referenceScale()}px ${pad.PaddingRight.Offset*referenceScale()}px ${pad.PaddingBottom.Offset*referenceScale()}px ${pad.PaddingLeft.Offset*referenceScale()}px`;chatInput.placeholder='To chat click here or press Slash key';send.disabled=!!submit.isDisabled||chatInput.disabled||!chatInput.value.trim();send.querySelector('.rbx-icon').textContent=send.disabled?'microphone':'arrow-medium-up';
  return {backgroundTransparency:group.props.BackgroundTransparency,textSize:text.TextSize,strokeTransparency:stroke.Transparency,sendDisabled:!!submit.isDisabled};
 }
 menu.addEventListener('pointerenter',()=>{iconState='Hover';renderMenuIcon()});menu.addEventListener('pointerleave',()=>{iconState='Default';renderMenuIcon()});menu.addEventListener('pointerdown',()=>{iconState='Pressed';renderMenuIcon()});menu.addEventListener('pointerup',()=>{iconState='Hover';renderMenuIcon()});
 window.addEventListener('hud:chat-channel-changed',()=>{try{applyComposer()}catch(e){lastError=String(e)}});
 chatInput.addEventListener('input',()=>{try{applyComposer()}catch(e){lastError=String(e);console.error(e)}});chatForm.addEventListener('submit',()=>setTimeout(()=>{try{applyComposer()}catch(e){lastError=String(e)}},0));
 window.addEventListener('resize',applyLayout);applyLayout();
 window.__recoveredUiResearch=Object.freeze({getState:()=>({source:'selected Settings and Backpack modules match owner 1145 patch; original 1142 patch unknown',branch:'legacy settings / candidate chat V2; flags mocked',services:'mocked; chat local only',renderer:'partial DOM bridge',settingsRows,layout:last,error:lastError})});
})();
