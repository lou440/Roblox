/* Tool frame/weld calculations; dependencies are injected by the game. */
(() => { 'use strict';
  function create({R6Animation,SwordData,SwordScript,TrowelData,carpetData,RocketData}){
    function weaponFrameFor(rootFrame,m,equipped,gripName){
      if(!equipped)return null;
      const arm=R6Animation.multiply(rootFrame,m.RightGrip||m['Right Arm']);
      // R6 weld convention as in the parent revision; physics remains approximate.
      const attachment=R6Animation.fromCFrame(SwordData.rightGripAttachment);
      const weld=R6Animation.fromCFrame({position:[0,0,0],rotation:[1,0,0,0,0,1,0,-1,0]});
      const hand=R6Animation.multiply(attachment,weld),grip=R6Animation.inverseRigid(R6Animation.fromCFrame(SwordScript.grips[gripName]));
      return R6Animation.multiply(R6Animation.multiply(arm,hand),grip);
    }
    function classicFrameFor(rootFrame,matrices,type,colaDrink=false){const arm=R6Animation.multiply(rootFrame,matrices.RightGrip||matrices['Right Arm']),attachment=R6Animation.fromCFrame(SwordData.rightGripAttachment),weld=R6Animation.fromCFrame({position:[0,0,0],rotation:[1,0,0,0,0,1,0,-1,0]}),grip=R6Animation.inverseRigid(R6Animation.fromCFrame(type==='trowel'?TrowelData.grip:type==='carpet'?carpetData.grip:type==='pistol'?window.General45Data.grip:type==='rocket'?RocketData.grip:type==='subspace'&&window.SubspaceTripmineData?window.SubspaceTripmineData.grip:type==='bloxycola'?(colaDrink?window.BloxyColaData.gripDrinkCFrame:window.BloxyColaData.grip):{position:[0,0,0],rotation:[1,0,0,0,1,0,0,0,1]}));return R6Animation.multiply(R6Animation.multiply(arm,R6Animation.multiply(attachment,weld)),grip)}
    return Object.freeze({weaponFrameFor,classicFrameFor});
  }
  window.GameToolFrames=Object.freeze({create});
})();
