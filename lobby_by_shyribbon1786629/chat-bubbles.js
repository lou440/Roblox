/* Three independently expiring balloons per speaker, oldest above newest. */
(()=>{'use strict';const states=new WeakMap();function prune(el,state){const now=performance.now();while(state.items.length&&state.items[0].expires<=now)state.items.shift().node.remove();clearTimeout(state.timer);el.dataset.active=String(state.items.length>0);if(!state.items.length)el.hidden=true;else state.timer=setTimeout(()=>prune(el,state),Math.max(0,state.items[0].expires-now)+10)}
window.ChatBubbles={push(el,text,mark){let state=states.get(el);if(!state){state={items:[],timer:0};states.set(el,state);el.replaceChildren();el.classList.add('bubble-stack')}const node=document.createElement('div');node.className='chat-balloon';node.textContent=window.ChatText.clean(text);node.dir='auto';if(mark)node.append(mark);el.append(node);state.items.push({node,expires:performance.now()+7000});while(state.items.length>3)state.items.shift().node.remove();prune(el,state);el.hidden=false},clear(el){const state=states.get(el);if(state)clearTimeout(state.timer);states.delete(el);el.replaceChildren();el.dataset.active='false';el.hidden=true}};

// #3431: make server chat rate limits visible to the sender instead of silent drops.
let rateEl=null,rateTimer=0,rateUntil=0;
function rateNotice(remaining){
  const ms=Number(remaining);if(!Number.isFinite(ms)||ms<=0)return;
  rateUntil=Math.max(rateUntil,performance.now()+ms);
  if(!rateEl){rateEl=document.createElement('div');rateEl.id='chat-rate-limit-notice';rateEl.setAttribute('role','status');rateEl.setAttribute('aria-live','polite');rateEl.style.cssText='position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:60;max-width:min(92vw,420px);padding:8px 12px;border-radius:8px;background:rgba(20,20,24,.92);color:#fff;font:600 13px/1.35 system-ui,sans-serif;text-align:center;pointer-events:none;box-shadow:0 2px 10px rgba(0,0,0,.35)';document.body.appendChild(rateEl)}
  const render=()=>{const left=Math.max(0,rateUntil-performance.now());if(left<=0){rateEl.hidden=true;clearInterval(rateTimer);rateTimer=0;return}rateEl.hidden=false;rateEl.textContent='Chat paused: you’re sending messages too quickly. Try again in '+Math.ceil(left/1000)+'s.'};
  render();if(!rateTimer)rateTimer=setInterval(render,250);
}
window.addEventListener('mp:chat-cooldown',e=>rateNotice(e.detail&&e.detail.remaining));

})();
