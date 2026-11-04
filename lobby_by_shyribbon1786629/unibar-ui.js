/* Browser bridge for a selected 1145 Chrome submenu branch. The active
 * experiment, layout host, theme and complete integration list are unknown. */
(()=>{
 'use strict';const source=window.RobloxUnibarResearch,panel=document.getElementById('rbx-more-panel'),inventory=panel?.querySelector('[data-rbx-more=inventory]');if(!source||!panel||!inventory)return;
 let last;function render(){
  last=source.geometry({scale:innerWidth<=620?1:1.1,count:panel.querySelectorAll('[data-rbx-more]').length,height:innerHeight,topInset:36});
  panel.style.boxSizing='border-box';panel.style.width=`min(${last.width}px, calc(100vw - 16px))`;panel.style.padding='0';panel.style.maxHeight='calc(100vh - 72px)';panel.style.overflowY='auto';panel.style.borderRadius=last.radius+'px';panel.style.backgroundColor='rgba(19,21,25,.95)';panel.style.boxShadow='none';
  for(const row of panel.querySelectorAll('[data-rbx-more]')){row.style.boxSizing='border-box';row.style.height=last.rowHeight+'px';row.style.padding='0 14px 0 20px';row.style.gap='18px';row.style.borderRadius=last.radius+'px';row.style.fontFamily="'BuilderSans1145',sans-serif";row.style.fontSize='16px';row.style.fontWeight='700';const icon=row.querySelector('.rbx-more-symbol');if(icon){const size=innerWidth<=620?22:24;icon.style.width=size+'px';icon.style.height=size+'px';icon.style.fontSize=size+'px';icon.style.lineHeight=size+'px';icon.style.flex=`0 0 ${size}px`}}
 }
 function syncInventory(){inventory.setAttribute('aria-checked',String(!!window.__robloxBackpack?.getState().isOpen))}
 window.addEventListener('resize',render);window.addEventListener('backpack:changed',syncInventory);render();syncInventory();
 window.__unibarResearch=Object.freeze({getState:()=>({geometry:last,source:source.source,items:Array.from(panel.querySelectorAll('[data-rbx-more]'),x=>x.dataset.rbxMore),position:'browser adapter',activeClientBranch:'unknown'})});
})();
