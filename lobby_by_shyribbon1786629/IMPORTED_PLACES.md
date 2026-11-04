# Uploaded places

The Home screen now opens five independently scoped games, built from the supplied places rather than the discarded generated Obby:

| Game ID | Source | Workspace parts | Script instances |
|---|---|---:|---:|
| obby | uploads/Obby.rbxl | 78 | 4 |
| crossroads | uploads/Classic_Crossroads.rbxl | 1678 | 44 |
| headquarters | uploads/ROBLOX_World_Headquarters__1_.rbxl | 8077 | 22 |
| glass-houses | uploads/Glass_Houses.rbxl | 2503 | 46 |
| teapots | uploads/Universal_-_Dodge_the_Teapots_of_Doom.rbxl | 45 | 8 |

The existing Lobby and Sword Fight game remain available. Obby and Teapots have no tools or PvP. Classic brickbattle maps start with their corresponding weapons. Headquarters adds Jet Boots. Geometry, colors, transforms and spawn placements come from the uploads; the generated cover pictures are illustrative thumbnails, not replacements for the actual maps.

## Behavior ports

- Obby: original lethal touched bricks; seven spawn/checkpoint stages, monotonically advancing checkpoint progress, checkpoint respawns and Winners notice. Spawn protection does not cancel lethal touched bricks. No random late-stage respawns after dying at the beginning.
- Teapots: both original spawner locations and velocity ranges; burst scheduling based on difficulty; initial difficulty 8; easing every 180 seconds; 1-second initial nonlethal grace and 11-second removal; lethal teapots and original Bounce kill parts; finish increases difficulty by 3 and teleports to the original finish-return location, adjusted for the engine's foot origin.
- Crossroads: classic paintball, slingshot, superball, timebomb, sword, rocket and trowel; paint recoloring; projectile cooldowns and gravity; blast destruction; team beacon joining/enemy touch kills/shared healing cooldown; armor doubles maximum health and returns after 60 seconds; trampoline boost; randomized per-model regeneration with the source regeneration delay; accelerated clock-driven sky; KOs/Wipeouts in the existing player list.
- Glass Houses: corresponding classic brickbattle tools, team-aware respawns, switches fire four alternating cannon shots from the actual two barrels (duplicate model names resolved by instance hierarchy), cannon bounce/explosion behavior, delayed 67.2-stud elevators with passenger transport, armor pickups, gold and summonable team killbots, 30-second round warning, winning-team announcement, environment regeneration and team rebalance. Match length is 300 seconds plus the source's transition interval.
- Headquarters: source building geometry, classic-tool fallback ports, Jet Boots with a 6-second thrust ramp and cooldown, destructive blasts, KOs/Wipeouts, shared wall-building/cleanup equivalent using the existing trowel implementation.

All multiplayer triggers, projectiles, health, checkpoints, boosts, elevators, part destruction and regeneration run in the map's backend controller. Part/effect packets are scoped to that map, including initial snapshots. The browser shares the same explicit JS script controller for signed-out/offline play. No uploaded Lua is evaluated. Protocol places-4 rejects old client handshakes.

## Fidelity limits (not a native Roblox interpreter)

This is a translation to the existing browser engine, not Roblox running in a web page. Source Lua and instance data remain archived under maps/source/ and in the compiled map JSON.

- Headquarters contains 19 and Glass Houses 21 linked script instances with no embedded Source. Their LinkedSource URLs are preserved. The Roblox asset-delivery endpoint tested during inspection returned 401, so those linked scripts cannot be claimed as recovered. Equivalent classic-tool behavior is reused from the embedded Crossroads scripts, and UI/leaderboard equivalents use the existing browser HUD.
- The teapot mesh refers to an unavailable local Roblox installation path (shareddata/fonts/teapotdodge.mesh). Flying teapots use an explicit low-poly 3D replacement; they are not the original mesh. Some other Roblox mesh/material/surface details, particles, original sounds and effect animations are not reproduced exactly.
- There is no full Roblox joint/BodyMover solver. Imported rotated parts render with their transforms but collision uses conservative bounds. Destruction removes affected pieces rather than simulating every loose brick and joint. Elevators use deterministic interpolation instead of BodyPosition spring dynamics. Killbot steering and contact/projectile physics are approximations. Beacon vertical BodyMover animation is not ported; its team/heal/kill gameplay is.
- Linked weapon details unavailable in Headquarters/Glass Houses use the Crossroads equivalents; exact original linked versions may differ. Existing sword/rocket/trowel implementations are reused rather than emulating every Roblox Tool or RemoteEvent implementation detail. The existing engine has a simplified damage, impulse and shield model.
- Teapots' obsolete HtmlService script opens an external website in a native Roblox window. That deprecated popup is intentionally not executed. No Roblox analytics/shared death database hooks or native service calls are emulated.
- Headquarters has no SpawnLocation in the upload; its fallback spawn is the central clear ground, not an invented building or an invented obstacle course.

## Rebuilding and verification

Use extract-places.py to extract the uploads, compile-places.py to compile map assets, then sync-place-server.py to embed the controller/configs into server.js. These are build-time helpers only. The backend is self-contained and does not import or read workspace files.

Passed: verify-imported-places.mjs, verify-crossroads.mjs, verify-map-room.mjs, verify-obby-isolation.mjs, verify-sfoth-stairs.mjs. The new harness exercises five-map isolation and tool restrictions, kill/checkpoint behavior, waves/difficulty/finish, boost/beacon/elevator behavior, killbot startup, cannon barrel binding, tool cooldowns and bomb fuse. This is code-level verification, not a complete playthrough of every source level or signed-in realtime browser session.
