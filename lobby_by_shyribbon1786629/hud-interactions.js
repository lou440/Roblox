/* Offline HUD interaction adapters inspired by archived CoreScripts. They
 * provide local behavior, not Roblox services or a verified target menu branch. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),ui=window.RobloxRecoveredUI,programs=window.RobloxRecoveredUIPrograms,visual=window.RobloxChatVisualResearch;
 document.addEventListener('contextmenu',e=>e.preventDefault(),true);
 const menuButton=$('rbx-menu-button'),moreButton=$('rbx-more-button'),chatButton=$('rbx-chat-button');
 const overlay=$('rbx-menu-overlay'),dialog=overlay.querySelector('.rbx-menu-dialog'),confirm=$('rbx-reset-confirm');
 const menuAnimation=window.RobloxMenuAnimation.create(overlay,dialog);
 const more=$('rbx-more-panel'),chat=$('rbx-chat-panel'),input=$('rbx-chat-input'),messages=$('rbx-chat-messages'),badge=$('rbx-chat-badge');let unread=0;function setUnread(n){unread=n;badge.textContent=n>99?'99+':String(n);badge.hidden=n<1}
 const quickButton=$('rbx-chat-shortcut'),quickTray=$('rbx-quick-words'),quickBody=$('rbx-quick-words-body'),chatResize=$('rbx-chat-resize'),chatBubble=$('rbx-local-chat-bubble');
 const slider=$('rbx-sensitivity'),sliderValue=$('rbx-sensitivity-value');
 if(!ui||!programs||!visual)return;
 let menuOpen=false,moreOpen=false,chatOpen=false,quickOpen=false,resetOpen=false,leaveOpen=false,leaveSubmitted=false,sessionEnded=false,replacedSession=false,page='people',messageCount=0,chatChannel='here',bubbleTimer=0;
 let sensitivity=ui.graphics.guiToEngine(programs.graphics,Number(slider.value));
 const chatConfig=window.RobloxChatConfigResearch;let backgroundTimer=0,textTimer=0;
 function clearChatTimers(){clearTimeout(backgroundTimer);clearTimeout(textTimer);backgroundTimer=textTimer=0}
 function scheduleChatFade(){
  clearChatTimers();if(!chatOpen||quickOpen||document.activeElement===input||chat.matches(':hover'))return;
  backgroundTimer=setTimeout(()=>{if(chatOpen&&document.activeElement!==input&&!chat.matches(':hover'))chat.classList.add('is-idle')},chatConfig.ChatWindowBackgroundFadeOutTime*1000);
  textTimer=setTimeout(()=>{if(chatOpen&&document.activeElement!==input&&!chat.matches(':hover'))chat.classList.add('is-text-idle')},chatConfig.ChatWindowTextFadeOutTime*1000);
 }
 function wakeChat(){chat.classList.remove('is-idle','is-text-idle');scheduleChatFade()}
 chat.addEventListener('pointerenter',wakeChat);chat.addEventListener('pointerleave',scheduleChatFade);
 input.addEventListener('blur',()=>setTimeout(scheduleChatFade,0));

 const suspend=(keepMoving)=>window.dispatchEvent(keepMoving?new CustomEvent('hud:control-suspend',{detail:{keepMoving:true}}):new Event('hud:control-suspend'))
  // Chat focus uses this one: typing must never halt someone mid-run (they stop when they let go).
  const suspendForChat=()=>suspend(true);
 function setChat(open,focus=false){
  chatOpen=!!open;if(chatOpen){setUnread(0);window.dispatchEvent(new Event('hud:chat-open'))}chat.hidden=!chatOpen;chatButton.setAttribute('aria-expanded',String(chatOpen));document.body.classList.toggle('hud-chat-open',chatOpen);
  $('rbx-chat-icon').textContent=(chatOpen?visual.activeMigration:visual.inactiveMigration).name;
  if(chatOpen&&focus){if(!window.__chatSlashOpening)suspendForChat();input.focus({preventScroll:true});wakeChat()}else if(!chatOpen){setQuick(false);clearChatTimers();chat.classList.remove('is-idle','is-text-idle');if(document.activeElement===input)input.blur()}else wakeChat()
 }
 function setMore(open){moreOpen=!!open;more.hidden=!moreOpen;moreButton.setAttribute('aria-expanded',String(moreOpen));moreButton.querySelector('.rbx-icon').textContent=moreOpen?'x':'three-bars-horizontal'}
 function setPage(name){
  if(!['people','settings','report','help'].includes(name))return;page=name;
  for(const tab of document.querySelectorAll('[data-rbx-tab]')){const selected=tab.dataset.rbxTab===name;tab.setAttribute('aria-selected',String(selected));$(tab.getAttribute('aria-controls')).hidden=!selected;if(selected){const bar=tab.parentElement,outer=bar.getBoundingClientRect(),inner=tab.getBoundingClientRect();if(inner.left<outer.left)bar.scrollLeft+=inner.left-outer.left;else if(inner.right>outer.right)bar.scrollLeft+=inner.right-outer.right}}
 }
 function showReset(open){resetOpen=!!open;confirm.hidden=!resetOpen;if(resetOpen){suspend();$('rbx-reset-cancel').focus({preventScroll:true})}else if(menuOpen)$('rbx-menu-reset').focus({preventScroll:true})}
 function showLeave(open){leaveOpen=!!open;$('rbx-leave-confirm').hidden=!leaveOpen;if(leaveOpen){suspend();leaveSubmitted=false;const leaveButton=$('rbx-leave-confirm-button');leaveButton.disabled=false;leaveButton.focus({preventScroll:true})}else if(menuOpen)$('rbx-menu-leave').focus({preventScroll:true})}
 function resetOuterScroll(){for(const node of [document.scrollingElement,document.body,document.querySelector('.world'),overlay,dialog])if(node){node.scrollTop=0;node.scrollLeft=0}}
 function setMenu(open,tab='people'){
  if(sessionEnded&&open)return;menuOpen=!!open;resetOuterScroll();menuAnimation.setOpen(menuOpen);document.body.classList.toggle('hud-menu-open',menuOpen);menuButton.setAttribute('aria-expanded',String(menuOpen));
  if(menuOpen){setQuick(false);setMore(false);setPage(tab);suspend();window.dispatchEvent(new Event('hud:menu-open'));dialog.focus({preventScroll:true})}else{showReset(false);showLeave(false);if(window.HomeScreen?.show&&window.__multiplayer&&!window.__multiplayer.inGame&&!window.__multiplayer.offlineMode)window.HomeScreen.show();else menuButton.focus({preventScroll:true})}
 }
 menuButton.addEventListener('click',()=>setMenu(!menuOpen));
 moreButton.addEventListener('click',()=>setMore(!moreOpen));
 chatButton.addEventListener('click',()=>setChat(!chatOpen,false));
 function setChatChannel(channel){chatChannel=channel;const here=channel==='here';$('rbx-chat-here').setAttribute('aria-selected',String(here));$('rbx-chat-global').setAttribute('aria-selected',String(!here));messages.hidden=!here;$('rbx-chat-global-note').hidden=here;input.disabled=!here;quickButton.disabled=!here;if(!here)setQuick(false);if(!here&&document.activeElement===input)input.blur();window.dispatchEvent(new Event('hud:chat-channel-changed'));wakeChat()}
 $('rbx-chat-here').addEventListener('click',()=>setChatChannel('here'));$('rbx-chat-global').addEventListener('click',()=>setChatChannel('global'));
 $('rbx-menu-resume').addEventListener('click',()=>setMenu(false));
 $('rbx-menu-reset').addEventListener('click',()=>showReset(true));$('rbx-reset-cancel').addEventListener('click',()=>showReset(false));
 $('rbx-reset-confirm-button').addEventListener('click',()=>{if(window.__baseplate)window.__baseplate.kill();showReset(false);setMenu(false)});
 $('rbx-menu-leave').addEventListener('click',()=>showLeave(true));$('rbx-leave-cancel').addEventListener('click',()=>showLeave(false));
 $('rbx-leave-confirm-button').addEventListener('click',event=>{if(leaveSubmitted)return;leaveSubmitted=true;event.currentTarget.disabled=true;showLeave(false);setMenu(false);if(window.__multiplayer?.leaveGame&&window.HomeScreen?.show){window.__multiplayer.leaveGame();window.HomeScreen.showHome?.();window.HomeScreen.show()}else location.assign(location.pathname)});
 $('rbx-session-rejoin').addEventListener('click',()=>{if(replacedSession){location.reload();return}sessionEnded=false;$('rbx-session-ended').hidden=true;if(window.__baseplate)window.__baseplate.reset();$('game').focus({preventScroll:true})});
 window.addEventListener('mp:session-replaced',e=>{setMenu(false);setChat(false);replacedSession=true;sessionEnded=true;const welcome=$('avatar-welcome');if(welcome)welcome.hidden=true;document.querySelector('.world').inert=false;suspend();$('rbx-session-ended-title').textContent=e.detail.reason||'This session was replaced by another session.';$('rbx-session-ended').hidden=false;$('rbx-session-rejoin').focus({preventScroll:true})});
 overlay.addEventListener('click',e=>{if(e.target===overlay)setMenu(false)});
 for(const tab of document.querySelectorAll('[data-rbx-tab]'))tab.addEventListener('click',()=>setPage(tab.dataset.rbxTab));
 let noticeTimer=0;function serviceNotice(text){const box=$('rbx-service-status');box.textContent=text;box.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{box.hidden=true},3000)}
 window.addEventListener('hud:service-notice',e=>{if(e.detail&&e.detail.text)serviceNotice(String(e.detail.text))});
 function peopleView(list){$('rbx-people-content').classList.toggle('is-list',list);$('rbx-people-grid').setAttribute('aria-pressed',String(!list));$('rbx-people-list').setAttribute('aria-pressed',String(list))}
 $('rbx-people-grid').addEventListener('click',()=>peopleView(false));$('rbx-people-list').addEventListener('click',()=>peopleView(true));
 const peopleContent=$('rbx-people-content'),peopleTemplate=$('rbx-people-avatar').cloneNode(true);peopleContent.addEventListener('click',e=>{const el=e.target.closest('.rbx-people-avatar');if(el)window.__playerList?.examineAvatar(el.dataset.username||'LocalPlayer')});
 function setPeople(list,online){const items=Array.isArray(list)&&list.length?list:[{id:'local',username:'LocalPlayer',self:true}];peopleContent.replaceChildren();for(let i=0;i<items.length;i++){const p=items[i],el=peopleTemplate.cloneNode(true),name=String(p.username||'guest');el.id=i===0?'rbx-people-avatar':'';el.dataset.username=name;el.setAttribute('aria-label','Examine '+name+' avatar');el.querySelector('strong').textContent=name;el.querySelector('small').textContent=online?(p.self?'You · Websim':'Websim user'):'Local session';peopleContent.append(el)}}
 window.addEventListener('mp:roster',e=>setPeople(e.detail.players,e.detail.connected));
 for(const button of more.querySelectorAll('[data-rbx-more]'))button.addEventListener('click',()=>{
  const action=button.dataset.rbxMore;setMore(false);
  if(action==='inventory'&&window.__robloxBackpack)window.__robloxBackpack.toggle();
  else if(action==='leaderboard'&&window.__playerList)window.__playerList.toggle();
  else if(action==='friends'){setChatChannel('here');setChat(true,true);serviceNotice('Friends chat is unavailable offline; this chat is local only.')}
  else if(action==='report')setMenu(true,'report');
  else if(action==='respawn'){setMenu(true,'people');showReset(true)}
  else if(action==='avatar')window.CharacterSwitcher?.open();
  else if(action==='music')serviceNotice('Music '+(window.__music?.toggle()?'on':'off'));else if(action==='shop'||action==='emotes')serviceNotice(({shop:'Shop',avatar:'Avatar switching',emotes:'Emotes'})[action]+' requires an online Roblox service.');
 });
 document.addEventListener('pointerdown',e=>{if(moreOpen&&!more.contains(e.target)&&!moreButton.contains(e.target))setMore(false)});
 function setSensitivity(value){sensitivity=value;sliderValue.textContent=sensitivity.toFixed(2);window.dispatchEvent(new CustomEvent('hud:sensitivity-changed',{detail:{value:sensitivity}}))}
 slider.addEventListener('input',()=>{const value=Number(slider.value);setSensitivity(ui.graphics.guiToEngine(programs.graphics,value))});
 window.addEventListener('hud:sensitivity-input',e=>{const match=String(e.detail&&e.detail.text||'').match(/[0-9.]+/),n=match?Number(match[0]):NaN;if(!Number.isFinite(n)){setSensitivity(sensitivity);return}const value=Math.max(.001,Math.min(100,Math.abs(n)));slider.value=String(Math.max(0,Math.min(10,ui.graphics.engineToGui(programs.graphics,value))));setSensitivity(value)});
 input.addEventListener('focus',()=>{if(!window.__chatSlashOpening)suspendForChat();wakeChat()});
 // The live preset catalog normally comes from GetPresetsAsync. The ten General
 // phrases below are copied from the owner's screenshot; the two Coordination
 // examples are from the 1145 studio-debug catalog, not the missing live catalog.
 const quickGroups=[{name:'General',words:['Confirm','Good game','Good luck','So close','Play again','Done','Oof','Okay','Nice one','Well played']},{name:'Coordination',words:['Follow me','This way']}];
 function quickMark(){const icon=quickButton.querySelector('svg').cloneNode(true);icon.classList.add('rbx-quick-mark');icon.setAttribute('aria-label','Quick Words');return icon}
 function positionQuick(){if(!quickOpen)return;const r=quickButton.getBoundingClientRect(),world=document.querySelector('.world').getBoundingClientRect(),w=Math.min(400,Math.max(160,innerWidth-16));quickTray.style.width=w+'px';const h=Math.min(322,Math.max(150,innerHeight-16));quickTray.style.maxHeight=h+'px';quickTray.style.left=Math.max(8,Math.min(innerWidth-w-8,r.right-world.left+8))+'px';quickTray.style.top=Math.max(8,Math.min(innerHeight-h-8,r.top-world.top-4))+'px'}
 function setQuick(open){quickOpen=!!open&&chatOpen&&chatChannel==='here';quickTray.hidden=!quickOpen;quickButton.setAttribute('aria-expanded',String(quickOpen));if(quickOpen){wakeChat();positionQuick()}else scheduleChatFade()}
 function appendChat(author,text,quick=false,isSelf=true){
  author=window.ChatText.clean(author,48);text=window.ChatText.clean(text);if(!text)return;
  const row=document.createElement('li'),name=document.createElement('span'),body=document.createElement('span');name.className='rbx-chat-author';name.textContent=author+': ';body.textContent=text;body.dir='auto';row.append(name,body);if(quick)row.append(quickMark());messages.append(row);messageCount++;if(!chatOpen)setUnread(unread+1);while(messages.children.length>81)messages.children[1].remove();messages.scrollTop=messages.scrollHeight;
  if(isSelf)window.ChatBubbles.push(chatBubble,text,quick?quickMark():null);wakeChat();
 }
 function postChat(text,quick=false){if(!text)return;if(!quick&&/^\/admin(?:\s|$)/i.test(text.trim())){window.__adminToolsMenu?.openFromChat();return}if(chatChannel!=='here')return;if(window.__emotes?.consumeChat(text))return;const mp=window.__multiplayer;if(mp?.connected&&mp.sendChat){mp.sendChat(text,quick);return}if(window.__chatSafety?.allow())appendChat('LocalPlayer',window.__chatSafety.filter(text),quick,true)}
 window.addEventListener('mp:chat-cooldown',e=>{serviceNotice('Chat cooldown: wait '+Math.ceil(e.detail.remaining/1000)+' seconds.');});
  window.addEventListener('mp:chat',e=>{const m=e.detail;appendChat(m.username,m.text,!!m.quick,m.id===window.__multiplayer?.selfId)});
 window.addEventListener('mp:roster',e=>{const system=messages.querySelector('.rbx-chat-system');if(system)system.textContent=e.detail.connected?'Filtered room chat.':'Local session only; no other players are connected.';chat.setAttribute('aria-label',e.detail.connected?'Websim room chat':'Offline local chat')});

 for(const group of quickGroups){const section=document.createElement('section'),heading=document.createElement('h3'),chips=document.createElement('div');heading.textContent=group.name;chips.className='rbx-quick-chips';for(const word of group.words){const button=document.createElement('button');button.type='button';button.textContent=word;button.addEventListener('click',()=>{postChat(word,true);setQuick(false)});chips.append(button)}section.append(heading,chips);quickBody.append(section)}
 quickButton.addEventListener('click',()=>setQuick(!quickOpen));
 document.addEventListener('pointerdown',e=>{if(quickOpen&&!quickTray.contains(e.target)&&!quickButton.contains(e.target))setQuick(false)});
 window.addEventListener('resize',positionQuick);
 function setChatSize(width,height){const r=chat.getBoundingClientRect(),maxW=Math.max(1,innerWidth-r.left-8),maxH=Math.max(1,innerHeight-r.top-8);width=Math.max(Math.min(240,maxW),Math.min(maxW,width));height=Math.max(Math.min(160,maxH),Math.min(maxH,height));chat.dataset.userWidth=String(width);chat.dataset.userHeight=String(height);chat.style.width=width+'px';chat.style.height=height+'px';wakeChat();positionQuick()}
 let resizeStart=null;
 chatResize.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();const r=chat.getBoundingClientRect();resizeStart={id:e.pointerId,x:e.clientX,y:e.clientY,width:r.width,height:r.height};chatResize.setPointerCapture(e.pointerId)});
 chatResize.addEventListener('pointermove',e=>{if(resizeStart&&e.pointerId===resizeStart.id){e.preventDefault();setChatSize(resizeStart.width+e.clientX-resizeStart.x,resizeStart.height+e.clientY-resizeStart.y)}});
 function finishResize(e){if(resizeStart&&e.pointerId===resizeStart.id)resizeStart=null}chatResize.addEventListener('pointerup',finishResize);chatResize.addEventListener('pointercancel',finishResize);chatResize.addEventListener('lostpointercapture',finishResize);
 chatResize.addEventListener('keydown',e=>{const delta={ArrowRight:[16,0],ArrowLeft:[-16,0],ArrowDown:[0,16],ArrowUp:[0,-16]}[e.key];if(!delta)return;const r=chat.getBoundingClientRect();setChatSize(r.width+delta[0],r.height+delta[1]);e.preventDefault();e.stopPropagation()});
 $('rbx-chat-form').addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(!text){input.value='';input.blur();wakeChat();return}postChat(text,false);input.value='';input.blur();wakeChat()});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&!input.value.trim()){e.preventDefault();e.stopPropagation();input.value='';input.blur();wakeChat()}});
 let openingSlash=false;input.addEventListener('beforeinput',e=>{if(openingSlash&&e.inputType==='insertText'&&e.data==='/'){e.preventDefault();openingSlash=false}});document.addEventListener('keyup',e=>{if(e.code==='Slash'||e.key==='/')openingSlash=false},true);
 document.addEventListener('keydown',e=>{
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  const typing=!!(e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable="true"]'));
  if(e.key==='Escape'){
   if(sessionEnded){e.preventDefault();return}if(window.__playerList?.getState().avatarOpen)window.__playerList.closeAvatar();else if(window.__playerList?.getState().profileOpen)window.__playerList.setProfile(false);else if(leaveOpen)showLeave(false);else if(resetOpen)showReset(false);else if(menuOpen)setMenu(false);else if(quickOpen)setQuick(false);else if(moreOpen)setMore(false);else if(typing&&chatOpen)setChat(false);else setMenu(true);
   e.preventDefault();e.stopImmediatePropagation();return;
  }
  if(menuOpen&&e.code==='KeyR'&&!typing&&!leaveOpen){showReset(true);e.preventDefault();e.stopImmediatePropagation();return}
  if(menuOpen&&e.code==='KeyL'&&!typing&&!resetOpen){showLeave(true);e.preventDefault();e.stopImmediatePropagation();return}
  if(!menuOpen&&!typing&&!window.AvatarStudio?.active&&!window.RobloxStudioEditor?.isOpen?.()&&(e.key==='/'||e.code==='Slash')){e.preventDefault();e.stopImmediatePropagation();openingSlash=true;setTimeout(()=>{openingSlash=false},500);if(chatChannel!=='here')setChatChannel('here');window.__chatSlashOpening=true;try{window.dispatchEvent(new Event('hud:chat-slash-focus'));setChat(true,true)}finally{window.__chatSlashOpening=false}setMore(false)}
 },true);
 window.__hudInteraction=Object.freeze({
  setMenu,
  blocksGameplay(target){return !!window.CharacterSwitcher?.active||!!window.AvatarStudio?.active||!!window.RobloxStudioEditor?.isOpen?.()||!!window.__homeOpen||!!window.JoiningScreen?.active||!document.getElementById('avatar-welcome')?.hidden||sessionEnded||menuOpen||!!(target&&target.closest&&target.closest('input,textarea,select,[contenteditable="true"]'))},
  get sensitivity(){return sensitivity},
  getState(){return{menuOpen,moreOpen,chatOpen,quickOpen,resetOpen,leaveOpen,sessionEnded,page,messageCount,chatChannel,sensitivity,chatTransport:window.__multiplayer?.connected?'Websim room':'local only',menuAnimation:menuAnimation.getState()}}
 });
})();
