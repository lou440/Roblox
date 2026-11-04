/* The sensitivity conversions follow CameraSensitivityEntry.lua from the
 * matching-WASM archive. Applying them to this demo camera is an adapter. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RobloxUiSettingsResearch=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const clamp=x=>Math.max(0,Math.min(10,x));
 return Object.freeze({guiToEngine(value){if(!Number.isFinite(value))throw new RangeError('finite sensitivity required');return clamp(value<=5?0.198*value+0.01:0.6*value-2)},engineToGui(value){if(!Number.isFinite(value))throw new RangeError('finite sensitivity required');const v=value<=1?(value-0.01)/0.198:(value+2)/0.6;return clamp(Math.floor(v/0.01+0.5)*0.01)}});
});
