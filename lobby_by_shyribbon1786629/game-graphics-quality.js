/* Graphics quality policy; dependencies passed explicitly by the game. */
(() => { 'use strict';
  function create(getAutoLevel){
    function qualityLevel(){const s=window.__localSettings&&window.__localSettings.getState(),cap=Math.max(1,Math.min(10,Math.round(Number(s&&s.graphicsQuality)||10)));return s&&s.graphicsMode==='Manual'?cap:Math.min(cap,getAutoLevel())}
    function renderScale(){return .35+(qualityLevel()-1)*.0722}
    function minFrameMs(){if(window.__homeOpen)return 250;const L=qualityLevel();return L<=3?33:L<=6?20:0}
    return Object.freeze({qualityLevel,renderScale,minFrameMs});
  }
  window.GameGraphicsQuality=Object.freeze({create});
})();
