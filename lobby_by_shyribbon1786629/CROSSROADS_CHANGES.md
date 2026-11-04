# Crossroads update

- Client protocol: `crossroads-3`. Admission requires this exact hello version before map initialization. Missing-version clients are sent `updateRequired` and closed with 4008 (a code the previous client already displays). Unhandshaken connections expire after 8 seconds.
- This is compatibility admission, NOT authentication or a ban replacement: the public version string can be copied. Existing platform room admission and server account/IP/device moderation remain responsible for bans. Archived pages running archived backends cannot be edited or forcibly redirected by current project code. Publish to apply these room changes to the live project.
- Step clearance is global (2.401 studs) through ArenaContactModel and the backend twin. No inferred per-tread flags are needed. Ascending steps snap only within clearance with headroom; descending ledges use gravity. Height-based floor teleport was removed. Server validates swept body paths against map/build solids and checks prolonged unsupported stationary poses; this is still a predictive/coarse validator, not a full authoritative Humanoid simulation. Imported rotated geometry still uses conservative AABBs.
- Carpet meshes no longer depend on remote avatar detail distance; airborne remotes render to 600 studs, trails use visible remotes. Flight uses subdivided solid contacts, and stopping flight preserves height and clears grounded state.
- Obby Crossroads: separate scoped map, shared hub and four signed routes (Easy, Normal, Hard, Insane); no baseplate, each finish labeled, falling respawns at hub. `obby-world.js` generator is duplicated verbatim in the self-contained backend.
- Build shapes: block, tiny, shiny, stairs, wedge, slab, pillar, ball. Shape variants persisted in `world_build_shapes`, attributed by `user_id`. Legacy blocks default to normal block. Shape-aware previews and picking. Shiny uses a static specular highlight. Grid cells are still 4 studs.
- Tool palettes: build on left with custom draggable scrollbar; paint bottom-left with presets and custom color field. Opening chat via the chat button no longer focuses input; explicit text entry stays available.
- Regression script: `node verify-crossroads.mjs`; existing `node verify-sfoth-stairs.mjs` also passed. Page console check on obby had no uncaught game exceptions; signed-out social/admin API refusals are expected.

## Map isolation and tool-free Obby follow-up

- `map-selection.js` resolves map identity before combat, backpack and multiplayer scripts; the later map loader only loads geometry, never changes room identity. Previously multiplayer fell back to Lobby before the map loader ran.
- Normal chat is now sent through the map-scoped broadcast, not relabeled and delivered into every game. Per-game rosters, poses, collisions and effects retain their existing isolation; aggregate game counts remain global.
- Obby has empty starters, hidden backpack, no inventory shortcut interception, and denied tool grants/restores. Server Obby configuration has `noTools`, an empty gear allowlist and a locked peaceful combat mode. Equip/pose/flight/pickup cannot grant obby tools.
- Airborne swept collision follows a bounded gravity arc between accepted snapshots rather than treating the straight snapshot chord as the path of a jump. Walking and teleport budgets and wall rejection remain enabled. This also avoids feeding Obby movement into Lobby collision geometry.
- Protocol advanced to crossroads-3 so pre-fix clients that select the wrong room must update.
- Regression checks: verify-obby-isolation.mjs, verify-map-room.mjs, verify-crossroads.mjs passed; Obby anonymous page check had no uncaught game exceptions.
