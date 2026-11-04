# Crowded-room changes

Static map boxes are uploaded once and rendered in one colored draw. Undetailed remote boxes share an instanced batch when supported. Closest avatars retain full imported detail (six on desktop, three on mobile); distant/crowded avatars remain visible as low-poly R6 characters. Remote animation, effects and label updates are throttled. Avatar download concurrency is two and old GPU appearances are evicted beyond sixteen cached entries. Physics integration is 60 Hz; house contacts use an 8-stud broad-phase grid and swept horizontal tests.

The house doorway is at [8,-38], facing +Z toward spawn. Its center is [1,-56]. Stair contacts evaluate the feet rather than blocking against later treads. Backend shot-obstruction boxes match the translated physical map.

Weapon participation is chosen at session start, once per connection. Default is protected until choice. The server gates weapon activation, damage, pistol severing and weapon pickups; trowel remains available to peaceful users. Environmental hazards remain active. Leaderboard viewport is ten rows, with a styled native scrollbar. Each speaker's balloons retain up to three independently expiring messages.


## Grid tools and avatar joining
- Build, Delete, Paint, and Build Checker are non-weapons. Four-stud cubes snap to cells; grid edits are validated/broadcast by the room. Blocks are room-lifetime, not durable DB records. Paint/delete affect only your own blocks. Limits: 300/user, 2000/room; spawn/map/player overlaps and unsupported floating placement are rejected.
- Built geometry uses a single reusable GPU buffer/draw and joins the existing broad-phase collision index. Checker components are cached by author and recomputed only after edits; face, edge, and corner contacts connect, and one bounding-box outline represents each cluster (including any empty space inside its bounds).
- Saved avatar ZIP URLs come from the trusted account DB row, are included in the joining roster, and are used directly by remote clients instead of treating ZIP filenames as Roblox usernames. Joining initializes remote animation views/detail selection before its warm frame. Ready nearby body meshes stay textured; accessory/animation LOD budgets remain.
- ZIP reader accepts named R6/R15, classic Player groups, nested folders, and material splits. Worker-blocked browsers can use a fallback reader; errors identify affected archive entries. Runtime resource errors report filenames and response status or browser/network reason.
- Import startup prompt skips saved accounts, including those whose saved archive temporarily fails to restore; Reset clears that skip. PVP choice remains required each session.
- verify-grid.js uses only mock room/DB state for authority tests; it also parses a downloaded character ZIP and generated OBJ ZIP fixtures. No live player data is modified by those tests.


## Collision repair from supplied arena snapshot
- Imported `inside` and `planarDistance` from `demo-obstacles.js` in `uploads/arena-source-snapshot-df6a19f6e2.zip` into `arena-contacts.js`. Adopted its rounded .8-stud planar contact boundary, .751-stud step allowance, 5-stud character height and 10-stud/sec stair lift. Indexed house/build contacts remain; unrelated avatar/build/PVP features were not reverted to the old snapshot.
- Closed actual entrance/upstairs landing gaps with visible geometry and matching server occlusion solids.
- World contacts carry a structural revision. Loose-body collision caches refresh after build/delete, and sleeping bodies wake when supporting geometry changes. Painting does not invalidate collision geometry.
- Removed the obsolete server 23-stud restriction; roof and built-platform jumps use a world-dependent height ceiling and an 8-stud vertical burst for seat/jump transitions. Descending from a deleted high build remains valid. Server-time speed/burst validation is retained.
- Protected attacks display the requested bottom-right toast, with local sword/pistol feedback and authoritative sword/pistol/rocket notices; damage protection is unchanged.
- `verify-collision.js` numerically exercises full extracted player movement on all stair runs, rounded corners, dynamic rigid-body cache removal, protected-attack notices, and roof/seat movement admission. It uses mock room state only, not a live multiplayer room.


## Shared builds, trowel budget, custom bodies and supplied home
- Independent equip messages remove movement-validation coupling from build/trowel actions. Grid edits carry ordered revisions with gap recovery and periodic conditional snapshots.
- Connected trowel use is server-confirmed, broadcast to its builder too, and included in late-join history. Local history buffers early delivery.
- Replaced trowel SAT stack solver with bounded 30 Hz inelastic nearby-box contacts, sleeping fast path, 240-brick cap, 8x mass, reduced impulses and no angular jitter. Instanced brick rendering; no per-frame deep copies in rendering.
- Avatar import waits for Websim blob save before announcing appearance. Remote renderer uses saved blob URLs only; source website is reserved for explicit local imports.
- Custom OBJ body pieces share a uniform scale and bind space, retain R15 segment alignment, remove exported world offset, and ground feet. Existing six-joint animation remains; this is not arbitrary skeletal skinning.
- Extracted 1,906 visible pieces and wedges from user place house Model 240, 520 merged collision boxes mirrored server-side, and 15 seats. No embedded code executed. See HOUSE_PROVENANCE.md and house-extracted.json.
- Verified mock shared build/paint delivery, rejected-pose equip recovery, trowel sender/viewer delivery and late join, DB reload, 240-brick stability/finite blast recovery, and custom-proportion R15 bind-space fixture. Page check has no project exceptions. Actual two-account published-room behavior not verified by these tests.


## Social park redesign
- Active map replaced with an authored 88x68 one-storey house, 24-stud ceiling, 12 meeting chairs, 8 TV chairs, sandbox/park benches, player-sized tower stairs/slide, monkey bars and swing seats. 292 rendered boxes, 156 colliders; old extracted source retained separately.
- Shared TV selects one allowlisted web photo in D1; all clients receive the same server image endpoint. Real metadata and photo requests returned 200.
- AFK visibility/focus events set a server-clock five-minute deadline, displayed above avatars. Repeated away packets do not extend it; server onTick closes expired sessions; returning before expiry clears it. Browser visibility itself cannot be cryptographically proven.
- Removed browser fingerprint session enforcement and its extra canvas/WebGL contexts. Auth is the platform connection identity. Added swept map/grid movement rejection, server-validated seating, occupied-seat protection and bounded unsupported flight. No claim of bot-proof authentication beyond platform identity.
- Spatial audio attenuates existing sword, gun, rocket, trowel, jump, death and explosion assets with distance, updates while playing, and caps simultaneous voices.
- Trowel mass adjusted from 8x original to 3x, walking wakes/pushes sleeping bricks, sword/blast nudges increased; yaw-only narrowphase removes rotated-box phantom walls. No bounce-heavy angular solver.
- Detached body/world collisions now have spatial broadphase; hidden tabs suspend rendering and local simulation.
- Verified mock AFK deadlines/cancel, spoofed fingerprint and unknown-connection rejection, teleport correction, new-map doors/ceiling/landing/seats, pushable trowel bricks, durable/shared builds, custom body regression. Live crowded-room feel/AFK appearance is not verified by mocks.
- Persistent builds attributed to user_id for moderation while preserving existing ownership and rows.


## Park polish, false positives and Unicode chat
- Preserved house/social functions. Outdoors now use low-poly rounded tree crowns, circular planted courts, warm timber benches/frame/swing supports, a covered tower and a continuous visual slide over existing collision steps. Cylinder/sphere/ring geometry is still batched in StaticWorld. 296 visual parts and 156 colliders.
- Removed automatic heuristic bans, metronomic packet checks, filtered-message punishment, restrictive shared-IP gate, server swept-wall/hover/seat checks that diverged from local physics. Retained signed-in socket identity, per-account session replacement, finite position/coarse movement budgets, authoritative ownership/ranges, damage and cooldowns, bounded packet/chat rates, and AFK timeout. Large teleports correct without bans; this is deliberately less restrictive, not a claim of wallhack-proof client physics.
- Increased jitter/burst tolerance and connection-retry allowance. Formatting changes no longer create cheat strikes or a three-message long mute.
- Shared cleanChatText caps combining marks, strips bidi/control characters, bounds Unicode input, and preserves normal accents, CJK, Arabic, Hindi and emoji ZWJ sequences. Applied before server chat broadcast and client bubble/log rendering; paint containment/overflow bounds keep glyphs inside rows. Plain text rendering retained.
- verify-chat-movement.mjs passes Unicode/server-browser agreement, long jittery walk/jump session, burst tolerance, safe Zalgo chat and teleport rejection without banning. Park/shared-build/AFK tests also pass. Page check and rendered screenshot show no project exceptions; live crowded-room behavior still needs real users.


## R15 reference character
- Downloaded the requested judahsfriendtrey character from Character Downloader, bundled as avatars/judahsfriendtrey.zip. Actual export has 14 Player body groups, five Handle accessories and nine PNG textures; one torso body mesh is absent.
- Added r15-rig.js for named and spatially inferred R15 segments, a virtual lower torso when hidden/missing, joint pivots derived from bind bounds, and proportion-aware retargeting of existing motion with elbow/knee hinge bends. Worker and compatible readers use the same rig module. Shared five-stud normalization and old six-part geometry remain intact for R6/fallback/death rendering.
- Living avatars render separate upper/lower limbs, hands and feet; body garments follow upper torso, masks/hair follow head, and tools follow the right hand. Same parser/renderer supports local and blob-shared remote avatars. Bundled judahsfriendtrey is an explicitly allowlisted local remote fallback, not a return to provider downloads.
- The creator is switched to the requested reference once; other saved avatars remain restored. New visitors without a saved avatar use the reference, and Reset still preserves the classic avatar choice on subsequent visits. Avatar UI reports R6/R15 body type and uses the bundled ZIP when applying this username.
- verify-r15.mjs uses the actual downloaded ZIP and passes bind reconstruction/grounding, connected finite walk/sit/jump/fall/climb/carpet joints, accessory attachment classification and legacy named R6 import. Custom-proportion and shared-build regressions pass; page checks report no project exceptions. These are numerical/loader checks, not live multiplayer playtests.
- This is inferred rigid-part R15 articulation, not recovered Roblox R15 Animator/Motor6Ds, weighted layered-clothing skinning, or fifteen-part ragdoll/combat collision. Existing combat/death groups remain six-part.

## Session fixes (latest)
- Leaderboard click: the `#avatar-welcome` overlay kept `display:grid` after dismissal, so its hidden state never applied and it blocked clicks across the page. Added `.avatar-welcome[hidden]{display:none}` in `launch-popup.css`.
- Shoulder accessories: torso garments split at the waist (UpperTorso/LowerTorso); side pads bind to the nearer arm segment (`LeftUpperArm`/`RightUpperArm` in R15).
- Emote wheel closes on chat open, menu open, movement, airborne, seated or climbing.
- Chat icon badge: white circle with black count, capped at 99+, cleared when chat opens.
- Slide: zone-based sit phase while sliding.
- Movement: horizontal moves are sub-stepped (0.2 studs) so players can't cross colliders in one step.
- Swing: tool overlay eases in and out over the held pose.
- Roblox characters: fetched ZIPs are stored in Websim blobs and indexed in D1 (`avatar_characters`, keyed by lowercase username). Later requests from any user reuse the stored copy before contacting the provider.

Verification: verify-r15, verify-avatar-binding, verify-shared-builds, verify-park, verify-chat-movement pass. Backend cache checked with one live request (row written, blob URL stored). Not verified live: rendering, animation feel, collision feel, badge/emote/swing/slide behavior, and the leaderboard click after the overlay fix.

## Spawn protection and mobile rendering (latest)
- Startup: `loadBuilds` deletes every `world_builds` row within 30 blocks (120 studs) of spawn before loading, on every boot. It runs on the first connection after boot (lazy via `ensureBuilds`).
- Placement: builds within 10 blocks (40 studs) of spawn are refused by the server ("Too close to spawn. Move further away to build."). The message reaches the player through the existing build-error toast.
- Spawn zones (studs): clubhouse x[-45,45] z[-133,-63]; park, playground, sandbox x[-90,70] z[-50,8]. Constants: `SPAWN_ZONES` in server.js.
- Phones (coarse pointer): WebGL MSAA is off; `gl.getParameter(CURRENT_PROGRAM)` is answered from a tracked value, since the forcefield and explosion renderers called it every frame (a GPU sync point on iOS).
- Not verified on a device. The 1 FPS report on iPhone 16 Pro is not confirmed fixed.


## Mobile performance, quality, paint drag, home screen (latest)
- Graphics Quality (1-10) is now live. The slider is enabled in both modes. Manual uses the value as a cap. Automatic lowers the level while frames run slow, with a ceiling set by the slider. The level sets render scale (0.35-1.0 of DPR), a frame gap (≤3: 30 fps, 4-6: ~50 fps, 7+: uncapped), and remote-avatar detail budget. Carpet fly detail is off at level 3 or lower. The Performance overlay shows the level as Q#.
- Removed the fixed 30 fps touch cap and the touch-only adaptive thresholds. Physics ticks per frame are capped at 4 so a slow frame cannot spiral.
- Paint tool drag: on touch, one-finger drag paints when Paint is equipped (two-finger pinch still moves the camera). On mouse, left-button drag paints. Right-button drag still rotates the camera. Each new cell is sent once; the server paint limit is 30 ms (other build actions remain 150 ms).
- Spawn: placement refused within 40 studs of the protected zones. The build tool shows the ghost red and the toast "Too close to spawn. Move further away to build."
- Home screen (home-screen.js / home-screen.css): opens on load over the game. Friends are the online players from the roster, excluding yourself. One "game" card closes the home screen and reveals the sandbox. While the home screen is open the game renders at about 4 fps so loading still progresses.
- Not verified on an iPhone. Ask for Performance overlay numbers (the Q# shows the active level).



## Server-side rockets, offline block deletion, anti-float (latest)
- Rockets are simulated on the server: `spawnRocket` on fire, `stepRockets` each tick, segment tests against solid boxes, build solids and live non-owner player bodies. Detonation damages players within BLAST_RADIUS (8) and broadcasts `blast`. Client `explosion` reports are ignored and the client no longer sends them.
- Fire rate: rockets need a 3 s cooldown (`rocketAt`); direction must be a unit vector and origin within 10 studs of the player.
- Blocks: a non-owner may delete a block only when its owner is offline (not in `liveAccounts`). Non-owners can never paint over another player's block.
- Anti-float: non-fly players more than 12 studs above the highest surface under them are snapped to that surface with a correction. Falls from above 12 studs are therefore cut short; tune if it feels wrong.
- Fly: still driven by the client `fly` flag, gated on `carpetOwned` (set at the carpet pickup) and the carpet tool. Server-authoritative fly redesign is pending a decision.
- Verification: rocket path checked with a Node harness (victim hit and killed by a rocket on the server). `verify-collision.js` fails at the `DemoObstacles.stairTop` assertion (client module, not changed here); `verify-grid.js` fails on a missing `R15Rig` global. Neither loads server.js, so the server edits did not cause them; whether they predate this session is unverified.

## Avatar binding correction
- Downloaded gigachadtrey’s saved ZIP from the existing avatar_last database reference (read-only). Shoulder pads now take side-arm priority over the large-garment heuristic.
- Layered garment triangles are partitioned once on import by nearest body-segment bind bounds, preserving positions and UVs; R15 sleeves and trouser sections follow their animated limbs instead of the torso.
- Parser regression verified judahsfriendtrey has both upper/lower arm and leg garment bindings; gigachadtrey has 12,000 accessory vertices on each arm. No server, combat, or database writes changed.

## iOS inputs, Switch Character, and selectable RBXL map
- Native-size text inputs prevent Safari focus zoom; a stable canvas height and visual-viewport-sized dialogs keep the keyboard from resizing the world. Touch controls suspend during text editing. Pinch zoom is not disabled.
- Moved the existing character importer out of Esc → People into a standalone Switch Character modal, opened by the hamburger menu. Username download, upload, reset, saved avatars, and startup importing reuse the existing flow.
- Added rbxl-parser.js: bounded binary INST/PROP/PRNT parsing, LZ4/Zstd, XML fallback, CFrames, legacy BrickColor colors, collision flags, hierarchy filtering, and SpawnLocations. Embedded Luau is never executed.
- Added Sword Fight on the Heights to Home, sourced from uploads/Sword_Fight_in_the_Dark-2.rbxl (201 world parts, 6 spawns, midnight sky). Uses original geometry at one stud per world unit, with an altitude offset of 246.400003 studs; source scripts/moving mechanisms and decals are not emulated.
- Logical per-map server closures isolate players, weapons, chat, builds, collision geometry, and broadcasts within the platform's single room. Sandbox persistence and startup protection remain unchanged; arena builds are ephemeral. No database schema migration or manual data changes.
- Fixed an existing undefined chat-state variable surfaced in backend logs.
- Verified source parser/colors/truncation handling and logical room roster/chat/pose isolation with verify-rbxl.mjs and verify-map-room.mjs. Both preview paths loaded without uncaught errors; iOS hardware keyboard behavior still needs an actual device check.

## Map admission and SFOTH stair collision
- Removed implicit sandbox admission from arbitrary first packets. A connection must send a valid hello/map selection, and its map remains immutable until disconnect. All client gameplay packets carry the selected map; mismatched packets are ignored server-side.
- Public player and pose records carry their map too. The client drops unscoped or mismatched gameplay messages and records, clearing remote collision/effect caches on reset. Existing independent server map states remain in place; no database changes.
- Imported SFOTH collision uses a 1.251-stud basic step allowance. Connected stair-tread geometry gets a bounded 2.401-stud allowance for the source tower's larger risers; rails and tall walls retain normal blocking. Sandbox stepping stays at 0.751 studs.
- Grounded SFOTH players resolve step-up after each horizontal collision substep, with ceiling clearance, rather than walking into the next riser while the previous rise is still interpolating. Airborne players do not auto-step.
- verify-map-room.mjs covers explicit admission, immutable selection, nested map tags, and wrong-map packets. verify-sfoth-stairs.mjs walks the actual west staircase and turning tower staircase without jumping and checks wall/airborne behavior. Both passed; preview has no uncaught page errors.
