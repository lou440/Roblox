/*
 * Research port of the health state and colour rules in the candidate
 * Roblox TopBar/Components/Presentation/HealthBar.lua + TopBar/Constants.lua.
 * The source also comes from a public archive whose WebClient.wasm matches
 * the owner's binary SHA-256. These missing Lua files cannot be hash-compared
 * to the owner's copy; archive and target metadata differ on two other files.
 * Roblox API types are approximated by
 * float32 arithmetic; the active Chrome/legacy branch is not established.
 * No claim is made that this implements the rest of the HUD or the engine.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RobloxHealthResearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const f = Math.fround;
  const points = [
    {at:0.1, rgb:[f(255/255),f(28/255),f(0/255)]},
    {at:0.5, rgb:[f(250/255),f(235/255),f(0/255)]},
    {at:0.8, rgb:[f(27/255),f(252/255),f(107/255)]}
  ];

  function colorForPercent(percent) {
    if (!Number.isFinite(percent)) throw new RangeError('finite health percent required');
    if (percent <= 0.1) return points[0].rgb.slice();
    if (percent >= 0.8) return points[2].rgb.slice();
    let sum = [0,0,0], denominator = 0;
    for (const point of points) {
      const distance = percent - point.at;
      if (distance === 0) return point.rgb.slice();
      const weight = 1 / (distance * distance);
      for (let c=0;c<3;c++) sum[c] = f(sum[c] + f(f(weight) * point.rgb[c]));
      denominator += weight;
    }
    return sum.map(value => f(value / f(denominator)));
  }

  function describeHealth({health=100, maxHealth=100, isDead=false, enabled=true,
                           viewportWidth, chrome=false, tenFoot=false} = {}) {
    if (![health,maxHealth,viewportWidth].every(Number.isFinite))
      throw new RangeError('finite health, maxHealth and viewportWidth required');
    let percent = 1;
    if (isDead) percent = 0;
    else if (maxHealth > 0) percent = Math.max(0, Math.min(health / maxHealth, 1));
    let size;
    if (tenFoot) size = [220,16];
    else if (chrome && viewportWidth <= 320) size = [50,16];
    else if (chrome && viewportWidth <= 393) size = [80,20];
    else if (chrome) size = [125,20];
    else size = [80,6];
    return {
      visible: !!enabled && health < maxHealth,
      percent,
      color: colorForPercent(percent),
      size,
      offset: tenFoot ? 0 : 4,
      // Updated Chrome and ten-foot branches use these exact local textures.
      imageMode: chrome || tenFoot ? 'tv' : 'legacy'
    };
  }
  return Object.freeze({colorForPercent, describeHealth});
});
