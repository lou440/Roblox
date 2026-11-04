/* Local collision prediction owns locomotion. Server audits speed/authority,
 * not an incompatible bounding-box version of the mesh world. Exceptional
 * recovery is a single 90ms no-collision translation, NEVER a persistent force. */
(()=>{'use strict';window.PoseReconciliation={create(){let pending=null,lastSeq=0;const sent=new Map();return {
 note(seq,pose){sent.set(seq,{...pose});if(sent.size>128)sent.delete(sent.keys().next().value)},
 receive(m,p){if(m.hard){pending=null;sent.clear();lastSeq=0;return 'hard'}if(!m.ref||!['movement','bounds'].includes(m.reason)){return 'ignored'}
 const seq=m.ref.seq||0;if(seq<=lastSeq)return 'stale';lastSeq=seq;const ref=sent.get(seq)||m.ref;
 if(![m.x,m.y,m.z,ref.x,ref.y,ref.z].every(Number.isFinite))return 'stale';
 const delta=[m.x-ref.x,m.y-ref.y,m.z-ref.z];if(Math.hypot(...delta)<.35){p.recoveryId=m.recovery;p.recoveryDone=true;return 'grazing'}
 pending={delta,remaining:.09,id:m.recovery};p.recovering=true;if(p.freeSeated)p.freeSeated.recovering=true;return 'recover';
 },step(p,physics,dt){if(!pending)return;const k=Math.min(1,dt/pending.remaining),d=pending.delta.map(v=>v*k);p.x+=d[0];p.y+=d[1];p.z+=d[2];if(p.freeSeated)physics.rebase(p.freeSeated,d);pending.delta=pending.delta.map((v,i)=>v-d[i]);pending.remaining-=dt;
 if(pending.remaining<=1e-6){p.recovering=false;if(p.freeSeated)p.freeSeated.recovering=false;p.recoveryId=pending.id;p.recoveryDone=true;pending=null;physics.reset()}
 },clear(){pending=null;lastSeq=0;sent.clear()},getError:()=>pending?pending.delta.slice():[0,0,0]
 }}}})();
