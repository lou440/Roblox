/* A small SpawnLocation property-state port derived from WebClient.wasm.
 * It does not implement spawning, teams, physics, replication, or rendering.
 * Tested in a single-threaded harness with the optional instrumentation flag off.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.WasmSpawnLocationState=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const descriptors=Object.freeze({Enabled:23193560,TeamColor:23193408,Duration:23194040,AllowTeamChangeOnTouch:23194200,Neutral:23193264});
  class SpawnLocationState {
    constructor(hooks={}) {
      this._state={Enabled:1,TeamColor:194,Duration:10,AllowTeamChangeOnTouch:0,Neutral:1};
      this._hooks=hooks;
    }
    _access(name) { if(this._hooks.access)this._hooks.access(name); }
    _notify(name) { if(this._hooks.call145297)this._hooks.call145297(name,descriptors[name]); }
    _refresh(name) { if(this._hooks.virtualRefresh)this._hooks.virtualRefresh(name); }
    _set(name,value) {
      const isBool=name==='Enabled'||name==='AllowTeamChangeOnTouch'||name==='Neutral';
      const next=isBool?(value?1:0):(value|0), previous=this._state[name];
      this._access(name);
      // The traced TeamColor setter stores and calls 145297 even if unchanged.
      if(name!=='TeamColor' && previous===next)return;
      this._state[name]=next;
      if(name==='AllowTeamChangeOnTouch')this._refresh(name);
      this._notify(name);
      if(name==='Enabled')this._refresh(name);
    }
    get Enabled(){return !!this._state.Enabled} set Enabled(v){this._set('Enabled',v)}
    get TeamColor(){return this._state.TeamColor} set TeamColor(v){this._set('TeamColor',v)}
    get Duration(){return this._state.Duration} set Duration(v){this._set('Duration',v)}
    get AllowTeamChangeOnTouch(){return !!this._state.AllowTeamChangeOnTouch} set AllowTeamChangeOnTouch(v){this._set('AllowTeamChangeOnTouch',v)}
    get Neutral(){return !!this._state.Neutral} set Neutral(v){this._set('Neutral',v)}
    snapshot(){return {...this._state}}
  }
  SpawnLocationState.descriptors=descriptors;
  return SpawnLocationState;
});
