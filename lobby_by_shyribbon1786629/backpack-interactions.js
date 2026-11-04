/* DOM bridge for selected candidate Roblox BackpackScript bytecode. The Tool,
 * Humanoid, character, input and GUI services are offline mocks. The extracted
 * layouts and normal-tool selection execute the compiled candidate code. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),engine=window.RobloxBackpackResearch,program=window.RobloxBackpackProgram,data=window.LinkedSwordData;
 const host=$('rbx-backpack'),hotbar=$('rbx-hotbar'),inventory=$('rbx-backpack-inventory'),arrow=$('rbx-backpack-open');
 if(!host||!hotbar||!inventory||!arrow||!engine||!program||!data)throw Error('Backpack bridge did not load');
 const search=$('rbx-backpack-search'),arrowImg=arrow.querySelector('img');arrowImg.src=window.RobloxBackpackArrow;

 const MAX_TOTAL_ITEMS=40;
 let uidSeq=0;
 const nextUid=(prefix='tool')=>`${prefix}:${++uidSeq}`;

 if(typeof document.createElement==='function'&&document.head&&!document.getElementById('rbx-backpack-overflow-style')){
  const st=document.createElement('style');
  st.id='rbx-backpack-overflow-style';
  st.textContent=`
   .rbx-backpack-grid{position:absolute;top:40px;left:5px;right:5px;bottom:5px;display:flex;flex-wrap:wrap;align-content:flex-start;gap:5px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;}
   .rbx-backpack-grid::-webkit-scrollbar{display:none;width:0;height:0;}
   .rbx-backpack-item{position:relative;display:block;width:60px;height:60px;margin:0;padding:0;border:0;border-radius:0;color:#fff;background:rgba(31,31,31,.65);font:12px/1.1 'SourceSansArchive','Source Sans Pro',sans-serif;pointer-events:auto;cursor:pointer;flex:0 0 60px;}
   .rbx-backpack-item:hover{background:rgba(52,55,60,.8);}
   .rbx-backpack-item[aria-pressed="true"]::after{content:"";position:absolute;inset:0;border:6px solid rgb(90,142,233);pointer-events:none;}
   .rbx-backpack-item img{position:absolute;width:80%;height:80%;left:10%;top:10%;object-fit:contain;pointer-events:none;}
   .rbx-backpack-item-name{position:absolute;left:2px;right:2px;bottom:2px;font-size:10px;line-height:1.05;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000;pointer-events:none;}
   .rbx-backpack-empty{color:rgba(255,255,255,.65);font:13px/1.3 'SourceSansArchive','Source Sans Pro',sans-serif;padding:8px 6px;user-select:none;}
   .rbx-backpack-badge{position:absolute;top:-4px;right:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:rgb(90,142,233);color:#fff;font:700 11px/16px 'SourceSansArchive','Source Sans Pro',sans-serif;text-align:center;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.6);}
   .rbx-backpack-open.has-overflow:not([hidden]){display:block !important;}
   .rbx-backpack-slot.is-drop-target,.rbx-backpack-grid.is-drop-target{outline:2px dashed rgb(90,142,233);outline-offset:-2px;}
  `;
  document.head.appendChild(st);
 }

 const grid=typeof document.createElement==='function'?document.createElement('div'):null;
 if(grid){grid.id='rbx-backpack-grid';grid.className='rbx-backpack-grid';grid.setAttribute('role','list');inventory.append?.(grid);}
 const badge=typeof document.createElement==='function'?document.createElement('span'):null;
 if(badge){badge.className='rbx-backpack-badge';badge.hidden=true;arrow.append?.(badge);}

 const noTools=window.CombatMode.noTools;
 const lobbyNoSubspace=window.MapSelection?.id==='game';
 const subspaceEntry=window.SubspaceTripmineData&&!lobbyNoSubspace?[{id:'subspace',data:window.SubspaceTripmineData}]:[];
 // #4537: build tools go FIRST (left of the weapons) and are ALWAYS granted. F3X does not
 // replace them - it re-uses an equipped build tool, and the launch popup (#4536) can switch
 // you back to classic Building Tools at any time, so dropping them left players with no
 // build tools at all.
 const BT=window.BuildToolData||[];
 const starters=noTools?[]:window.MapSelection&&window.MapSelection.id==='freebuild-hostile'?[...BT,{id:'sword',data},{id:'rocket',data:window.ClassicRocketData},{id:'trowel',data:window.ClassicTrowelData},{id:'pistol',data:window.General45Data},...subspaceEntry,...(window.LegacyPlaceToolData||[]).filter(t=>t&&t.id==='superball'),...(window.ShovelData?[{id:'shovel',data:window.ShovelData}]:[]),{id:'bloxycola',data:window.BloxyColaData}]:window.CombatMode.classicCombat?[...(window.MapSelection.buildGear?BT:[]),{id:'sword',data},{id:'rocket',data:window.ClassicRocketData},{id:'trowel',data:window.ClassicTrowelData},...window.LegacyPlaceToolData.filter(t=>t.id!=='jetboots'||window.MapSelection.id==='headquarters'),...subspaceEntry,...(window.LegacyPlaceToolData||[]).filter(t=>t&&t.id==='superball'),{id:'bloxycola',data:window.BloxyColaData}]:window.CombatMode.swordOnly?[{id:'sword',data}]:[...BT,{id:'sword',data},{id:'trowel',data:window.ClassicTrowelData},{id:'rocket',data:window.ClassicRocketData},{id:'pistol',data:window.General45Data},...subspaceEntry,...(window.LegacyPlaceToolData||[]).filter(t=>t&&t.id==='superball'),...(window.ShovelData&&window.MapSelection?.id?.startsWith?.('freebuild-')?[{id:'shovel',data:window.ShovelData}]:[]),{id:'bloxycola',data:window.BloxyColaData}];
 const items=starters.filter(x=>!window.CombatMode.isWeapon(x.id)||window.CombatMode.enabled).map(x=>({uid:nextUid('starter'),id:x.id,data:x.data,extra:false}));
 if(items.some(x=>!x.data)||!window.RainbowCarpetData)throw Error('Classic tool data did not load');

 let isOpen=false,equipped=false,equippedTool=null,equippedUid=null,last=null,dragUid=null;
 const seenDropKeys=new Set();
 const coarse=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
 const hotbarSlotCount=()=>coarse()&&typeof innerWidth==='number'&&innerWidth<1024?3:10;

 function catalogItem(id){
  const all=[
   {id:'sword',data},
   {id:'trowel',data:window.ClassicTrowelData},
   {id:'rocket',data:window.ClassicRocketData},
   {id:'pistol',data:window.General45Data},
   {id:'carpet',data:window.RainbowCarpetData},
   ...(window.SubspaceTripmineData&&!lobbyNoSubspace?[{id:'subspace',data:window.SubspaceTripmineData}]:[]),
   ...(window.BloxyColaData?[{id:'bloxycola',data:window.BloxyColaData}]:[]),
   ...(window.LegacyPlaceToolData||[]),
   ...(window.BuildToolData||[]),
   ...(window.ShovelData?[{id:'shovel',data:window.ShovelData}]:[])
  ];
  return all.find(x=>x&&x.id===id&&x.data)||null;
 }

 function dims(el,size,pos){el.style.width=`calc(${size.X.Scale*100}% + ${size.X.Offset}px)`;el.style.height=`calc(${size.Y.Scale*100}% + ${size.Y.Offset}px)`;el.style.left=`calc(${pos.X.Scale*100}% + ${pos.X.Offset}px)`;el.style.top=`calc(${pos.Y.Scale*100}% + ${pos.Y.Offset}px)`}

 function emitChanged(){
  window.dispatchEvent(new CustomEvent('backpack:changed',{detail:{equipped,equippedTool,equippedUid,isOpen}}));
 }

 function swapSlots(fromUidOrIdx,toSlotIdx){
  const n=hotbarSlotCount();
  if(!Number.isInteger(toSlotIdx)||toSlotIdx<0||toSlotIdx>=n)return false;
  const fromIdx=typeof fromUidOrIdx==='number'?fromUidOrIdx:items.findIndex(x=>x&&x.uid===fromUidOrIdx);
  if(fromIdx<0||fromIdx>=items.length||fromIdx===toSlotIdx||!items[fromIdx])return false;
  // #4413 F5: the hotbar is items[0..n-1] and the backpack is items[n..]. Moving a tool must leave a
  // HOLE where it came from, not splice-and-shift every other slot, and it must land in the slot the
  // user aimed at — the old code pushed it to the end, i.e. straight back into the backpack.
  const moved=items[fromIdx];
  const fromBackpack=fromIdx>=n;
  if(fromBackpack)items.splice(fromIdx,1);else items[fromIdx]=null;
  while(items.length<toSlotIdx)items.push(null);
  const displaced=items[toSlotIdx]||null;
  items[toSlotIdx]=moved;
  if(displaced){if(fromBackpack)items.push(displaced);else items[fromIdx]=displaced}
  trimTrailing();
  syncEquipped();
  render();
  emitChanged();
  return true;
 }

 // #4413: `items` may contain null holes (empty hotbar slots). Only TRAILING holes are trimmed;
 // interior holes must survive or every later slot would shift under the player.
 function trimTrailing(){while(items.length&&!items[items.length-1])items.pop()}

 // #4413 F3: a tool that is no longer in the hotbar is not held any more.
 function syncEquipped(){
  const n=hotbarSlotCount();
  if(!equipped)return;
  const idx=equippedUid?items.findIndex(x=>x&&x.uid===equippedUid):items.findIndex(x=>x&&x.id===equippedTool);
  if(idx<0||idx>=n){equipped=false;equippedTool=null;equippedUid=null}
 }

 function moveToBackpack(uidOrIdx){
  const n=hotbarSlotCount();
  const fromIdx=typeof uidOrIdx==='number'?uidOrIdx:items.findIndex(x=>x&&x.uid===uidOrIdx);
  if(fromIdx<0||fromIdx>=items.length||fromIdx>=n||!items[fromIdx])return false;
  // #4413 F2: the old guard returned false whenever the loadout fitted the hotbar, so with a normal
  // starter set nothing could EVER be stowed. Stowing means "put it at index >= n": leave a hole in
  // the hotbar, pad up to n so the backpack region exists, then append.
  const moved=items[fromIdx];
  items[fromIdx]=null;
  while(items.length<n)items.push(null);
  items.push(moved);
  trimTrailing();
  syncEquipped();
  render();
  emitChanged();
  return true;
 }

 // #4413 F4: withdraw a backpack item into the first empty hotbar slot, or swap with the last hotbar
 // slot when it is full. This is the pointer/touch path; HTML5 drag still works on desktop.
 function withdrawToHotbar(uid){
  const n=hotbarSlotCount();
  const fromIdx=items.findIndex(x=>x&&x.uid===uid);
  if(fromIdx<0||fromIdx<n)return false;
  let target=-1;
  for(let i=0;i<n;i++)if(!items[i]){target=i;break}
  if(target<0)target=n-1;
  return swapSlots(uid,target);
 }

 function render(){
  if(noTools&&!items.length){host.hidden=true;hotbar.replaceChildren();inventory.hidden=true;arrow.hidden=true;return;}
  host.hidden=false;
  const phone=coarse()&&typeof innerWidth==='number'&&innerWidth<1024,n=phone?3:10;
  const tools=Array.from({length:n},(_,i)=>i<items.length);
  const overflowCount=Math.max(0,items.length-n);
  last=engine.layout(program,{phone,numberOfSlots:n,inventoryRows:phone?2:4,tools,extraTool:overflowCount>0,inventoryOpen:isOpen});
  dims(hotbar,last.hotbar.Size,last.hotbar.Position);
  dims(inventory,last.inventory.Size,last.inventory.Position);
  inventory.hidden=!isOpen;
  const showArrow=!!last.button.Visible||isOpen;   // #4497: overflow no longer forces the arrow
  arrow.hidden=!showArrow;
  arrow.classList?.toggle?.('has-overflow',overflowCount>0);
  arrow.style.left=`calc(${last.button.Position.X.Scale*100}% + ${last.button.Position.X.Offset}px)`;
  arrow.style.top=`calc(${last.button.Position.Y.Scale*100}% + ${last.button.Position.Y.Offset}px)`;
  if(badge){
   // #4497: cli asked for the "up arrow with the 1 on it" to go; keep the arrow, drop the count.
   badge.hidden=true;
   badge.textContent='';
  }
  const slots=[];
  for(let i=0;i<n;i++){
   const slot=last.slots[i],button=document.createElement('button');
   button.type='button';button.className='rbx-backpack-slot';button.hidden=!slot.visible;button.dataset.slot=String(i+1);
   const item=items[i];
   const isEq=!!item&&equipped&&(equippedUid?equippedUid===item.uid:equippedTool===item.id);
   button.setAttribute('aria-label',item?`Slot ${i+1}: ${item.data.toolName}${isEq?', equipped':''}`:`Empty slot ${i+1}`);
   button.setAttribute('aria-pressed',String(isEq));
   button.disabled=!item;
   button.style.width=last.iconSize+'px';button.style.height=last.iconSize+'px';
   if(slot.position){button.style.left=slot.position.X.Offset+'px';button.style.top=slot.position.Y.Offset+'px'}
   if(item){
    button.dataset.toolId=item.id;
    button.dataset.uid=item.uid;
    button.draggable=true;
    const img=document.createElement('img');img.src=window.UploadedAssetIcons?.[item.id]||item.data.iconData;img.alt='';button.append(img);
    // #4413 F4: with the backpack open a click stows instead of equipping, so touch users have a
    // path that does not depend on HTML5 drag-and-drop. Shift-click keeps the old equip behaviour.
    button.addEventListener('click',e=>{if(isOpen&&!e.shiftKey){moveToBackpack(item.uid);return}selectByUid(item.uid)});
    button.addEventListener('dragstart',e=>{dragUid=item.uid;try{e.dataTransfer?.setData('text/plain',item.uid);}catch{}});
    button.addEventListener('dragend',()=>{dragUid=null});
   }
   button.addEventListener('dragover',e=>{if(!dragUid)return;e.preventDefault();button.classList.add('is-drop-target')});
   button.addEventListener('dragleave',()=>button.classList.remove('is-drop-target'));
   button.addEventListener('drop',e=>{
    e.preventDefault();button.classList.remove('is-drop-target');
    const uid=dragUid||(e.dataTransfer&&e.dataTransfer.getData('text/plain'));
    dragUid=null;
    if(uid)swapSlots(uid,i);
   });
   if(!coarse()){const number=document.createElement('span');number.className='rbx-slot-number';number.textContent=String(i===9?0:i+1);button.append(number)}
   slots.push(button);
  }
  hotbar.replaceChildren(...slots);

  if(grid){
   const q=(search?.value||'').trim().toLowerCase();
   const pool=q?items.filter(x=>x.data.toolName.toLowerCase().includes(q)||x.id.toLowerCase().includes(q)):items.slice(n);
   const cards=[];
   if(!pool.length){
    const empty=document.createElement('div');
    empty.className='rbx-backpack-empty';
    empty.textContent=q?'No matching items in backpack.':'Empty — click a hotbar tool (or drag it here) to stow it. Click a stowed tool to take it back.';
    cards.push(empty);
   }else{
    for(const item of pool){
     const btn=document.createElement('button');
     btn.type='button';
     btn.className='rbx-backpack-item';
     btn.setAttribute('role','listitem');
     btn.dataset.backpackTool=item.id;
     btn.dataset.uid=item.uid;
     btn.draggable=true;
     const isEq=equipped&&(equippedUid?equippedUid===item.uid:equippedTool===item.id);
     btn.setAttribute('aria-pressed',String(isEq));
     btn.setAttribute('aria-label',`${item.data.toolName}${isEq?', equipped':''} (Backpack)`);
     btn.title=`${item.data.toolName} — Click to take back into the hotbar, or drag onto a slot`;
     const img=document.createElement('img');
     img.src=window.UploadedAssetIcons?.[item.id]||item.data.iconData;
     img.alt='';
     const label=document.createElement('span');
     label.className='rbx-backpack-item-name';
     label.textContent=item.data.toolName;
     btn.append(img,label);
     // #4413 F4: clicking a backpack card puts it back in the hotbar and equips it there.
     btn.addEventListener('click',()=>{if(withdrawToHotbar(item.uid))selectByUid(item.uid);else selectByUid(item.uid)});
     btn.addEventListener('dragstart',e=>{dragUid=item.uid;try{e.dataTransfer?.setData('text/plain',item.uid);}catch{}});
     btn.addEventListener('dragend',()=>{dragUid=null});
     cards.push(btn);
    }
   }
   grid.replaceChildren(...cards);
  }
 }

 if(grid){
  grid.addEventListener('dragover',e=>{if(!dragUid)return;e.preventDefault();grid.classList.add('is-drop-target')});
  grid.addEventListener('dragleave',()=>grid.classList.remove('is-drop-target'));
  grid.addEventListener('drop',e=>{
   e.preventDefault();grid.classList.remove('is-drop-target');
   const uid=dragUid||(e.dataTransfer&&e.dataTransfer.getData('text/plain'));
   dragUid=null;
   if(uid)moveToBackpack(uid);
  });
 }

 function selectByUid(uid,processed=false){
  const item=items.find(x=>x.uid===uid);
  if(!item)return;
  const id=item.id;
  const adminOk=!!window.__adminUnlockedTools?.has(id);
  if(noTools&&!adminOk)return;
  if(window.__baseplate&&window.__baseplate.getState().death?.dead)return;
  if(window.CombatMode.isWeapon(id)&&!window.CombatMode.enabled&&!adminOk)return;
  const sameEquipped=equipped&&equippedUid===item.uid;
  const result=engine.tool(program,{initial:sameEquipped?'character':'backpack',processed,hasTool:true});
  equipped=result.parent==='character';
  equippedTool=equipped?id:null;
  equippedUid=equipped?item.uid:null;
  render();
  emitChanged();
 }

 function selectTool(id,processed=false){
  if(id==='subspace'&&lobbyNoSubspace)return;
  const adminOk=!!window.__adminUnlockedTools?.has(id);
  if(noTools&&!adminOk)return;
  if(window.__baseplate&&window.__baseplate.getState().death?.dead)return;
  if(window.CombatMode.isWeapon(id)&&!window.CombatMode.enabled&&!adminOk)return;
  const item=equipped&&equippedTool===id&&equippedUid?items.find(x=>x.uid===equippedUid)||items.find(x=>x.id===id):items.find(x=>x.id===id);
  if(!item)return;
  selectByUid(item.uid,processed);
 }

 function select(processed=false){selectTool('sword',processed)}
 // Opening inventory is non-modal: do not discard a held movement key.
 function setOpen(value){isOpen=!noTools&&!!value;if(!isOpen){search.value='';if(document.activeElement===search)search.blur()}render();emitChanged();}
 function toggle(){setOpen(!isOpen)}
 arrow.addEventListener('click',toggle);
 search.addEventListener('focus',()=>window.dispatchEvent(new Event('hud:control-suspend')));
 search.addEventListener('input',render);

 document.addEventListener('keydown',e=>{
  if(noTools)return;
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  const editing=!!(e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable="true"]'));
  const menu=!!(window.__hudInteraction&&window.__hudInteraction.getState().menuOpen);
  if(e.key==='Escape'&&isOpen&&!menu){if(editing){search.value='';search.blur();render()}else setOpen(false);e.preventDefault();e.stopImmediatePropagation();return}
  if(editing||menu)return;
  if(e.code==='Backquote'){toggle();e.preventDefault();e.stopImmediatePropagation();return}
  // #4414: Backspace drops the held item, but never a building tool — those stay bound to the
  // build palette so Backspace keeps meaning "undo/delete" while building.
  if(e.code==='Backspace'){
   const building=['build','delete','paint','checker','f3x'];
   if(equipped&&equippedTool&&!building.includes(equippedTool)){
    const dropped=equippedTool;
    if(dropEquipped()){window.dispatchEvent(new CustomEvent('backpack:drop',{detail:{tool:dropped}}))}
    e.preventDefault();e.stopImmediatePropagation();return;
   }
   return;
  }
  if(/^Digit[0-9]$/.test(e.code)){
   const slotIdx=(Number(e.code.slice(-1))||10)-1;
   const focusedBp=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.uid&&document.activeElement.classList?.contains('rbx-backpack-item')?document.activeElement.dataset.uid:null;
   if(e.shiftKey&&isOpen&&focusedBp){swapSlots(focusedBp,slotIdx);e.preventDefault();e.stopImmediatePropagation();return}
   const item=items[slotIdx];
   if(item)selectByUid(item.uid);
   e.preventDefault();e.stopImmediatePropagation();
  }
 },true);

 window.addEventListener('resize',render);
 window.addEventListener('hud:menu-open',()=>{if(isOpen)setOpen(false)});

 function canPickupTool(id,allowDuplicate=false,dropKey=null){
  if(id==='subspace'&&lobbyNoSubspace)return false;
  const adminOk=!!window.__adminUnlockedTools?.has(id);
  if(noTools&&!adminOk)return false;
  if(window.CombatMode.swordOnly&&id!=='sword'&&!adminOk)return false;
  if(window.CombatMode.isWeapon(id)&&!window.CombatMode.enabled&&!adminOk)return false;
  if(dropKey&&seenDropKeys.has(dropKey))return false;
  if(items.length>=MAX_TOTAL_ITEMS)return false;
  const item=starters.find(x=>x.id===id)||catalogItem(id);
  if(!item)return false;
  if(!allowDuplicate&&items.some(x=>x&&x.id===id))return false;
  return true;
 }

 function grantTool(id,options=null){
  if(id==='subspace'&&lobbyNoSubspace)return false;
  const allowDuplicate=!!options?.allowDuplicate;
  const dropKey=typeof options?.dropKey==='string'&&options.dropKey?options.dropKey:null;
  if(!canPickupTool(id,allowDuplicate,dropKey))return false;
  const base=starters.find(x=>x.id===id)||catalogItem(id);
  if(!base)return false;
  if(dropKey){
   seenDropKeys.add(dropKey);
   if(seenDropKeys.size>256){const oldest=seenDropKeys.values().next().value;seenDropKeys.delete(oldest)}
  }
  const alreadyHas=items.some(x=>x&&x.id===id);
  items.push({uid:nextUid(allowDuplicate&&alreadyHas?'drop':'grant'),id:base.id,data:base.data,extra:!!(allowDuplicate&&alreadyHas)});
  render();
  return true;
 }

 function pickupTool(id,dropKey=null){
  return grantTool(id,{allowDuplicate:true,dropKey});
 }

 function restoreStarterTools(){
  if(noTools)return;
  for(let i=items.length-1;i>=0;i--)if(items[i]&&items[i].extra)items.splice(i,1);
  seenDropKeys.clear();
  for(let i=0;i<starters.length;i++){
   if((window.CombatMode.enabled||!window.CombatMode.isWeapon(starters[i].id))&&!items.some(x=>x&&x.id===starters[i].id)){
    items.splice(Math.min(i,items.length),0,{uid:nextUid('starter'),id:starters[i].id,data:starters[i].data,extra:false});
   }
  }
  if(equippedUid&&!items.some(x=>x&&x.uid===equippedUid)){equipped=false;equippedTool=null;equippedUid=null}
  render();
 }

 window.addEventListener('combat-mode:changed',()=>{
  restoreStarterTools();
  if(!window.CombatMode.enabled){
   for(let i=items.length-1;i>=0;i--)if(items[i]&&window.CombatMode.isWeapon(items[i].id)&&!window.__adminUnlockedTools?.has(items[i].id))items.splice(i,1);
   if(window.CombatMode.isWeapon(equippedTool)&&!window.__adminUnlockedTools?.has(equippedTool)){equipped=false;equippedTool=null;equippedUid=null}
   render();
  }
  emitChanged();
 });

 function dropEquipped(){
  if(!equippedTool)return null;
  const id=equippedTool;
  const i=equippedUid?items.findIndex(x=>x&&x.uid===equippedUid):items.findIndex(x=>x&&x.id===id);
  if(i>=0)items.splice(i,1);
  equipped=false;equippedTool=null;equippedUid=null;
  render();
  emitChanged();
  return id;
 }

 function adminGrant(id){
  const base=catalogItem(id);
  if(!base)return false;
  window.__adminUnlockedTools?.add(id);
  let target=items.find(x=>x.id===id);
  if(!target){
   if(items.length>=MAX_TOTAL_ITEMS)return false;
   target={uid:nextUid('admin'),id:base.id,data:base.data,extra:false};
   items.push(target);
  }
  equipped=true;equippedTool=id;equippedUid=target.uid;
  render();
  emitChanged();
  return true;
 }

 window.__robloxBackpack=Object.freeze({
  toggle,setOpen,select,selectTool,selectByUid,
  canPickupTool,grantTool,pickupTool,swapSlots,moveToBackpack,withdrawToHotbar,
  adminGrant,restoreStarterTools,dropEquipped,
  maxItems:MAX_TOTAL_ITEMS,
  unequip(){if(equipped){equipped=false;equippedTool=null;equippedUid=null;render();emitChanged()}},
  getState(){
   const n=hotbarSlotCount();
   return{
    isOpen,equipped,equippedTool,equippedUid,
    hotbarLimit:n,
    maxItems:MAX_TOTAL_ITEMS,
    items:items.filter(Boolean).map(x=>({uid:x.uid,id:x.id,toolName:x.data.toolName,assetId:x.data.assetId,extra:!!x.extra})),
    hotbarItems:items.slice(0,n).filter(Boolean).map(x=>({uid:x.uid,id:x.id,toolName:x.data.toolName,assetId:x.data.assetId})),
    backpackItems:items.slice(n).filter(Boolean).map(x=>({uid:x.uid,id:x.id,toolName:x.data.toolName,assetId:x.data.assetId,extra:!!x.extra})),
    toolName:data.toolName,assetId:data.assetId,iconAssetId:data.iconAssetId,
    source:'compiled BackpackScript layout/selection with locally authored extra tool integration; engine services mocked',
    owner1145ModuleHashVerified:true,original1142PatchVerified:false,layout:last
   };
  }
 });
 render();
})();
