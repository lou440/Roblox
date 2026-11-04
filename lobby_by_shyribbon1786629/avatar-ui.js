/* #2257: the old in-game "Switch Character" avatar-import popup is REMOVED.
 * The real Avatar editor (window.AvatarStudio, avatar-editor.js) is the single UI now.
 * This file remains as a compatibility stub so existing entry points
 * (HUD menu action "avatar", overlay-open checks) keep working unchanged. */
(() => { 'use strict';
  window.CharacterSwitcher = Object.freeze({
    get active() { return !!window.AvatarStudio?.active; },
    open() {
      if (window.AvatarStudio?.open) window.AvatarStudio.open();
      else window.__pendingAvatarOpen = true; /* editor not loaded yet: it opens when ready */
    },
    close() { window.AvatarStudio?.close?.(); },
  });
})();
