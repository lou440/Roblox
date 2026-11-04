/* Selected archived R6 Animate.onRunning rules plus an offline keyframe/rig
 * adapter. Clip data and Motor6D C0/C1 are recovered; interpolation, blending,
 * engine Animator integration, body contacts and physics are not recovered. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArchivedR6Animation=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 function multiply(a,b){const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
 function fromCFrame(f){const r=f.rotation,p=f.position;return [r[0],r[3],r[6],0,r[1],r[4],r[7],0,r[2],r[5],r[8],0,p[0],p[1],p[2],1]}
 function inverseRigid(a){const o=[a[0],a[4],a[8],0,a[1],a[5],a[9],0,a[2],a[6],a[10],0,0,0,0,1];for(let i=0;i<3;i++)o[12+i]=-(o[i]*a[12]+o[4+i]*a[13]+o[8+i]*a[14]);return o}
 function normalize(q){const n=Math.hypot(...q)||1;return q.map(x=>x/n)}
 function quat(m){const a=m[0],b=m[5],c=m[10],trace=a+b+c;let x,y,z,w,s;if(trace>0){s=Math.sqrt(trace+1)*2;w=s/4;x=(m[6]-m[9])/s;y=(m[8]-m[2])/s;z=(m[1]-m[4])/s}else if(a>b&&a>c){s=Math.sqrt(1+a-b-c)*2;w=(m[6]-m[9])/s;x=s/4;y=(m[4]+m[1])/s;z=(m[8]+m[2])/s}else if(b>c){s=Math.sqrt(1+b-a-c)*2;w=(m[8]-m[2])/s;x=(m[4]+m[1])/s;y=s/4;z=(m[9]+m[6])/s}else{s=Math.sqrt(1+c-a-b)*2;w=(m[1]-m[4])/s;x=(m[8]+m[2])/s;y=(m[9]+m[6])/s;z=s/4}return normalize([x,y,z,w])}
 function qmatrix(q,p){const [x,y,z,w]=normalize(q),xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;return [1-2*(yy+zz),2*(xy+wz),2*(xz-wy),0,2*(xy-wz),1-2*(xx+zz),2*(yz+wx),0,2*(xz+wy),2*(yz-wx),1-2*(xx+yy),0,p[0],p[1],p[2],1]}
 function slerp(a,b,t){let d=a.reduce((x,v,i)=>x+v*b[i],0),bb=b;if(d<0){bb=b.map(v=>-v);d=-d}d=Math.min(1,Math.max(-1,d));if(d>.9995)return normalize(a.map((v,i)=>v+t*(bb[i]-v)));const theta=Math.acos(d),sin=Math.sin(theta),x=Math.sin((1-t)*theta)/sin,y=Math.sin(t*theta)/sin;return normalize(a.map((v,i)=>v*x+bb[i]*y))}
 function blend(a,b,t){const pa=[a[12],a[13],a[14]],pb=[b[12],b[13],b[14]];return qmatrix(slerp(quat(a),quat(b),t),pa.map((x,i)=>x+(pb[i]-x)*t))}
 function prepare(clip){const tracks={};for(const frame of clip.frames)for(const [name,f] of Object.entries(frame.poses))(tracks[name]||=[]).push({time:frame.time,matrix:fromCFrame(f)});return {duration:clip.duration,loop:clip.loop,tracks}}
 function sampleTrack(track,time,duration,loop){if(!track||!track.length)return I();if(track.length===1)return track[0].matrix.slice();let t=loop?((time%duration)+duration)%duration:Math.max(0,Math.min(duration,time));let before=track[0],after=track[0];for(let i=0;i<track.length;i++){if(track[i].time<=t)before=track[i];if(track[i].time>=t){after=track[i];break}after=null}if(!after){if(!loop)return before.matrix.slice();after={time:track[0].time+duration,matrix:track[0].matrix}}if(t<before.time)t+=duration;const span=after.time-before.time,alpha=span>0?Math.max(0,Math.min(1,(t-before.time)/span)):0;return blend(before.matrix,after.matrix,alpha)}
 function sample(clip,time){const out={};for(const [name,track] of Object.entries(clip.tracks))out[name]=sampleTrack(track,time,clip.duration,clip.loop);return out}
 function mixPoses(a,b,t){const out={};for(const name of new Set([...Object.keys(a),...Object.keys(b)]))out[name]=blend(a[name]||I(),b[name]||I(),t);return out}
 // Motor6D invariant: Part0 * C0 * Transform = Part1 * C1.
 function compose(motors,poses){const result={HumanoidRootPart:I()},pending=motors.slice();while(pending.length){let progressed=false;for(let i=pending.length-1;i>=0;i--){const j=pending[i];if(!result[j.part0])continue;result[j.part1]=multiply(multiply(multiply(result[j.part0],fromCFrame(j.C0)),poses[j.part1]||I()),inverseRigid(fromCFrame(j.C1)));pending.splice(i,1);progressed=true}if(!progressed)throw Error('Disconnected R6 Motor6D hierarchy')}return result}
 // Extracted onRunning(speed), with actual Animator/LoadedAnimation replaced by
 // explicit state: Figure:GetScale(), 0.01 threshold, walk ID and /14.5 rule.
 function runningDecision(speed,rigScale=1,isStandardWalk=true,isEmote=false){if(!Number.isFinite(speed)||!Number.isFinite(rigScale)||rigScale<=0)throw new RangeError('finite speed and positive rig scale required');const v=speed/rigScale;if(v>.01)return {pose:'Running',clip:'walk',transition:.1,animationSpeed:isStandardWalk?v/14.5:null};if(!isEmote)return {pose:'Standing',clip:'idle',transition:.1,animationSpeed:null};return {pose:null,clip:null,transition:null,animationSpeed:null}}
 // Air/seat selection mirrors archived Animate's named transitions when the
 // caller supplies phase. Tool overlays are approximate per-joint blends of
 // the actual referenced keyframes, not a recovered Roblox Animator.
 function phaseDecision(speed,rigScale,phase){
  if(phase==='jump')return {pose:'Jumping',clip:'jump',transition:.1,animationSpeed:1};
  if(phase==='fall')return {pose:'FreeFall',clip:'fall',transition:.3,animationSpeed:1};
  if(phase==='climb')return {pose:'Climbing',clip:'climb',transition:.1,animationSpeed:Math.abs(speed)/12};
  if(phase==='sit')return {pose:'Seated',clip:'sit',transition:.5,animationSpeed:1};
  if(phase==='carpet')return {pose:'Seated',clip:'carpetsit',transition:.12,animationSpeed:1};
  if(phase!==undefined&&phase!=='ground')throw new RangeError('invalid R6 phase');
  return runningDecision(speed,rigScale);
 }
 function create(data){
  const clips=Object.fromEntries(Object.entries({...data.clips,...(globalThis.R6EmoteData||{}),...(globalThis.General45Clips||{})}).map(([name,clip])=>[name,prepare(clip)]));
  if(!clips.walk||!clips.idle)throw new Error('walk and idle clips are required');
  const state={clip:'idle',time:0,fade:1,from:null,basePoses:sample(clips.idle,0),poses:sample(clips.idle,0),decision:runningDecision(0),tool:{clip:null,time:0,action:null,remaining:0}};
  function clearTool(){state.tool={clip:null,time:0,action:null,remaining:0}}
  return {
   step(dt,speed,rigScale=1,options={}){
    if(!Number.isFinite(dt)||dt<0)throw new RangeError('nonnegative finite delta required');
    const d=options.emote&&clips[options.emote]&&options.phase==='ground'&&speed<.01?{pose:'Emoting',clip:options.emote,transition:.15,animationSpeed:1}:phaseDecision(speed,rigScale,options.phase);
    if(!clips[d.clip])throw new Error('R6 animation clip not loaded: '+d.clip);
    if(d.clip!==state.clip){state.from=state.basePoses;state.clip=d.clip;state.time=0;state.fade=0}
    state.decision=d;state.time+=dt*(d.animationSpeed??1);
    const target=sample(clips[state.clip],state.time);
    state.fade=Math.min(1,state.fade+dt/d.transition);
    state.basePoses=state.from&&state.fade<1?mixPoses(state.from,target,state.fade):target;
    if(state.fade>=1)state.from=null;
    state.poses={...state.basePoses};
    if(options.equipped&&options.phase!=='sit'&&options.phase!=='carpet'&&options.phase!=='climb'&&clips.toolnone){
     const t=state.tool,desired=t.remaining>0?t.action:'toolnone';
     if(desired!==t.clip){t.clip=desired;t.time=0}
     t.time+=dt;
     const overlay=sample(clips[desired],t.time),ease=x=>x*x*(3-2*x),swinging=t.remaining>0,w=swinging?ease(Math.min(1,t.time/.07))*ease(Math.min(1,t.remaining/.12)):1;
     const names=desired==='toollunge'?['Torso','Head','Left Arm','Right Arm','Left Leg','Right Leg']:['Right Arm'];
     const mixed=w>=1?overlay:mixPoses(sample(clips.toolnone,t.time),overlay,w);for(const name of names)if(mixed[name])state.poses[name]=mixed[name];
     if(t.remaining>0){t.remaining=Math.max(0,t.remaining-dt);if(t.remaining===0)t.action=null}
    }else clearTool();
    if(options.gun&&clips[options.gun.clip]){const overlay=sample(clips[options.gun.clip],options.gun.time);for(const [name,m] of Object.entries(overlay))state.poses[name]=m}
    return compose(data.motors,state.poses);
   },
   triggerToolAction(action){
    const name=action==='Slash'?'toolslash':action==='Lunge'?'toollunge':null;
    if(!name||!clips[name])throw new RangeError('unknown or unloaded tool action');
    state.tool.action=name;state.tool.remaining=.36;state.tool.clip=null;state.tool.time=0;
   },
   state(){return {clip:state.clip,time:state.time,fade:state.fade,decision:{...state.decision},tool:{...state.tool}}},
   reset(){state.clip='idle';state.time=0;state.fade=1;state.from=null;state.basePoses=sample(clips.idle,0);state.poses=state.basePoses;state.decision=runningDecision(0);clearTool()}
  };
 }
 function yawFrame(x,y,z,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);return [c,0,-s,0,0,1,0,0,s,0,c,0,x,y,z,1]}
 return Object.freeze({identity:I,multiply,fromCFrame,inverseRigid,quat,qmatrix,slerp,blend,prepare,sample,compose,runningDecision,phaseDecision,create,yawFrame});
});
