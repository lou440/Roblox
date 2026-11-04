# R6 appearance: sources and boundaries

This page is a partial, offline research demo, **not** a reconstruction of the Roblox humanoid or its physics. The public archive cited below contains a byte-identical copy of the original 1142 `WebClient.wasm`; that original owner folder lacked the referenced model, face and animations. A later read-only scan of the owner's updated 1145 download found the R6 model and face with hashes matching the archive. The public animation responses and candidate rig remain separately sourced.

## Static part data

`archived-r6-parts.js` is generated from `content/avatar/characterR6NoFace.rbxm` in the matching-WASM public archive, SHA256 `705d99fba99384fb21b701774072f9f40f7edd674585348c9baf07ca3c9d2b26`. It contains the following torso-relative positions and sizes. The archived root is invisible and all four limbs have `CanCollide = false`; the head and torso have `CanCollide = true` in the static model. The demo does **not** simulate those part collisions.

| Part | Size | Torso-relative position |
| --- | --- | --- |
| Head | (2, 1, 1) | (0, 1.5, 0) |
| Torso | (2, 2, 1) | (0, 0, 0) |
| Left Arm | (1, 2, 1) | (-1.5, 0, 0) |
| Right Arm | (1, 2, 1) | (1.5, 0, 0) |
| Left Leg | (1, 2, 1) | (-0.5, -2, 0) |
| Right Leg | (1, 2, 1) | (0.5, -2, 0) |
| HumanoidRootPart | (2, 2, 1) | (0, 0, 0) |

The part offsets are computed in the archived torso's local coordinate frame, not assumed from its world coordinates. The model contains **no Motor6D joints**. It uses BrickColor 194, not the classic noob palette; the demo's yellow, blue and green colors are an explicit appearance choice.

## Head and face

The model's `Head` has a `SpecialMesh` with MeshId `18446596298`, scale `(1, 1, 1)` and texture `rbxasset://textures/face.png`. `linked-r6-head-mesh.js` embeds the current public GET response for that MeshId, SHA256 `ecdbdfd9aa91ce26d87d382a3653738cf6d5a81fc5b7aff1b02e8a403451be98` (426 vertices, 720 triangles). The response is linked by the archived model, but is not an individually verified owner file or proof of the asset's bytes at the original build date. Its positions, normals, UVs and indices were compared with the downloaded binary.

`archived-r6-face.js` embeds the archived 128×128 `face.png`, SHA256 `a45ca21d310953cb2bb68608f02b6a24a4ad6f6e833a328cbd4e13328475d692`; the same hash also appeared in an official Player package and at the current official WebClient CDN. The separate `assets/face.png` is the identical image. The renderer uses those UVs and image, but its shading, composition and heading are demo choices, not the recovered WebClient renderer.

The owner's distinct `content/avatar/heads/head.mesh` remains embedded in `target-head-mesh.js` and was independently compared against the provided file; it has SHA256 `c192daeba6265e9ab13a6d5132e9f1e496532e51708b1a5cb13e5ae917673976`, 517 vertices, and 846 triangles. It is **not** the head currently displayed.

## Candidate rig, animation and movement

A separate matching-WASM public archive file, `content/avatar/morpherEditorR6.rbxmx`, SHA256 `a68019d9b9b34e74fba246aec5510249cb69599029df3eb3cb5eee96dcbfc98e`, supplies six `Motor6D` parent/child links and their `C0`/`C1` coordinate frames. It was not present at the checked owner path. `r6-animation-data.js` and `r6-animation-walk-data.js` embed those frames and the decoded poses. For each joint, the browser composes `Part1 = Part0 * C0 * PoseTransform * inverse(C1)`; a separate NumPy check compared 154 part matrices across all 22 walk frames against the archived XML and decoded raw poses. Rest-pose part centers also match the archived part layout.

The archived `content/avatar/unification/humanoidAnimateR6WithFace.rbxm` contains an Animate LocalScript whose source SHA256 is `aed38fe1363162a352140be6db861fdcf41ba5383f2ac7f268df0dd93ff4b4ca`. Its `onRunning` chooses walk when speed divided by rig scale is greater than `0.01`, uses a `0.1`-second transition, and adjusts the standard `180426354` walk track by `(speed / rig scale) / 14.5`. Otherwise it chooses idle unless an emote is active. The selected rule matched the archived source under official Luau 0.745 in 40,016 mocked cases. The demo uses rig scale 1 and feeds 16 to the walk animation while moving. The value 16 is the `WalkSpeed` serialized in the owner’s downloaded 1145 `characterR6NoFace.rbxm` Humanoid, not evidence that the browser adapter reproduces the Humanoid controller.

The displayed walk uses current public asset `180426354`, SHA256 `b4d5cca77daaac4c3e28629f7bff0bbb97a67ca4ad150ee78a767c99bac57a44`: 22 keyframes over approximately 0.667 seconds. Idle uses asset `180435571`, SHA256 `ce4d11f42a49d4697fb44e4a32d7334684d58d0f5e6db31d031390df2e3707a4`: 21 keyframes over 1 second. The source also randomly selects a second idle asset, which this demo does not implement. Current public asset bytes cannot be proven to be the original historical bytes or the owner’s active animation branch.

The browser adapter linearly interpolates positions and uses quaternion slerp and a `0.1`-second crossfade. These interpolation, blend, looping and renderer implementations have **not** been compared with Roblox Animator. The referenced jump, fall, sit, tool-hold, slash and lunge clips are also sampled by the adapter; full Humanoid animation states are not implemented. Keyboard/touch movement, speed, gravity, jump, collision response and locomotion physics remain independently authored approximations; using archived walk poses does **not** recover Roblox walking physics.

## Isolated Running-state height calculation

The supplied WASM's `37108` Running-state path calls `37075`, which calls `37057` and seven small helpers. The page's `running-height-program.js` retains those nine original instruction streams and `running-physics-vm.js` interprets their restricted instruction set in JavaScript. Against an isolated module of the nine extracted WASM functions, 100,000 randomized synthetic-memory cases matched, including root/leg pointers, sentinel values, special floats and both `owner+308` branches; there were no mocked calls in that comparison.

The separate `running-height-adapter.js` constructs a **synthetic** R6-shaped object image using the archived root and leg sizes, selects `owner+308=0`, chooses offset `owner+264=0`, and supplies the demo's floor height. In that selected branch, the calculation combines half the root part's clamped Y size with the larger leg Y size and the offset; for a floor at zero and the archived dimensions it yields 3 studs. The demo compares its root reference to that target when applying its existing ground cutoff. This does not identify the owner's runtime flags or prove that the synthetic object image matches the real engine state.

A broader research-only chain containing 25 extracted functions, including `37108`, `37123`, `37036` and `37075`, matched 40,000 synthetic cases with collision identity, frame-cache updates, slope limit, alternate surface, ground lookup, virtual call and initialization locks **mocked**. That chain is not connected to the demo. Ground detection, contact impulses, solver, character controller, horizontal motion, gravity, jump and the animation system remain unrecovered; the demo's grounded decision and response are independently authored.

## Additional action clips and authored scene

The current public clips are jump `14464997074` (19 frames, 0.625 s), fall `14464364913` (14, 0.65 s), sit `178130996` (2, 2 s), hold `182393478` (3, 0.5 s), slash `129967390` (4, 0.5 s), and lunge `129967478` (3, 1.5 s). Tests checked 258 decoded pose samples. The script-derived selected transitions use a 0.3 s jump timer, 0.3 s fall transition, 0.5 s sit transition and 0.3 s toolanim timeout; blending and priority are browser approximations, not verified Animator behavior. The six-step staircase, chair, automatic sit/stand proximity logic and gray training dummy are authored scene elements. Contacts, step-up, seat welding and target health are not recovered Roblox physics.

## Default parameters and sword motion correction

A read-only check of the owner's 1145 `content/avatar/characterR6NoFace.rbxm` confirmed SHA256 `705d99fba99384fb21b701774072f9f40f7edd674585348c9baf07ca3c9d2b26`. Its `Humanoid` explicitly serializes `WalkSpeed = 16`, `JumpPower = 50`, and `HipHeight = 0`. The demo now uses the first two values. It uses `196.2` studs/s² from the [documented Workspace gravity default](https://robloxapi.github.io/ref/class/Workspace.html); the original place's gravity was not recovered and can differ. The 240 Hz semi-implicit integration, immediate horizontal control, stairs, collision and character contact remain independently written approximations, **not** the WebClient physics solver.

The selected public Linked Sword script requests a `BodyVelocity` of `(0,10,0)` with `MaxForce = (0,4000,0)` for 0.5 s. A target velocity is not a direct instantaneous velocity assignment. The previous demo incorrectly clamped vertical velocity to 10 even on the ground. The corrected demo never launches or adds horizontal force from sword activation while grounded; while falling in the air during the source-script lunge window it applies an authored 0.8 gravity factor for a small glide. That factor is a user-directed approximation, **not** recovered Roblox BodyVelocity, mass, contact or Humanoid physics. Different published sword scripts vary; this is not proof of the owner's original item or behavior.

## Head-height camera, baseplate studs and equipped-tool cursor (827/838)

The public archive associated with the original 1142 WASM contains `PlayerModule/CameraModule/BaseCamera.lua`, SHA256 `8d405cd459ed30064e6639902c9b16f194b7a823125f93f2b89e87292c0621d5`. For a living R6 humanoid, its subject calculation follows the HumanoidRootPart plus `HEAD_OFFSET = (0,1.5,0)`—the R6 head's rest height. Its default distance is 12.5, first-person threshold is 1 and minimum is 0.5, with pitch limited to ±80°. Following the user's correction, the demo aims at root + 1.1, about 0.1 stud above the lower edge of the rest head, rather than the archived script's root + 1.5 center; this offset is user-directed, not recovered. The demo uses the remaining constants and selected zoom arithmetic. Its input scaling, zoom smoothing, occlusion, first-person body hiding and pointer behavior are browser adapters; the archive's camera code has not been matched to the actual active 1145 session.

The downloaded 1145 `PlatformContent/pc/textures/studs.dds` is a 128×2048 DXT1 atlas, SHA256 `a4e806a643c9fc4a35cf9c9ca31b2907ea039f122d9cf297b2d563e9fa649230`. The demo uses a losslessly decoded 64×64 tile from the top-left stud pattern (`studs-texture.js`, PNG SHA256 `7b6919c26447eae2f971324ce764308ca6316912cc8ada91377ad8efc931adb7`). The original asset pixels are real; the one-stud repeat scale, floor material, lighting, mipmapping and shader are browser approximations, not a recovered Roblox renderer.

The public Linked Sword 125013769 `MouseIcon` LocalScript explicitly selects `rbxasset://textures/GunCursor.png` while enabled and `GunWaitCursor.png` while disabled. Those PNGs were not listed in either WebClient metadata. The demo therefore uses the files of those names from the public 2009 Roblox client archive, hashes `60d45fd6e89b6b3e21bdb492685967a52d07bda7e950555e84c9afe4282b4167` and `eefc7b4b99ebe9f6afdc4460fb3dd72e255e35334177953f115c9f9d7881cba1`; their equivalence to the active session's cursor is unverified. Left mouse activates the sword and does not pan; right-drag rotates the camera. Source: https://github.com/MaximumADHD/Roblox-2009-Client/tree/4c78cd9/content/textures


### Requested smooth movement and dummy contacts
The browser adapter eases heading and stair rises rather than snapping. A radial obstacle prevents walking through the living dummy; disconnected pieces are pushed by the kinematic player. A fresh accepted sword activation may re-register a continuous overlap. These are usability approximations, not recovered Humanoid turning, contact or physics behavior. The selected public Linked Sword script still controls its original 5/10/30 damage states; the exact timing and engine Touched scheduling are not reconstructed.


### Owner 1145 floor-reaction research (function 37977)
`solid-floor-1145.js` is a research-only JavaScript transcription of the 115-byte body of function 37977 from the owner's 1145 WASM (body SHA256 `756adaf38f8aeccdb38181a12f3be413b0f8014372dbe90a612d67c8a696d76d`). A sliced instance of the original instructions matched the transcription in 24,000 cases including signed thresholds, infinities, NaN, null pointers and branch flags. Object layouts, the three called helpers, and the flag value were synthetic inputs. An owner-supplied research note identifies this branch as a solid-floor mass comparison; the helper meanings and the flag's live value were not independently established. It is not connected to the kinematic demo floor and does not recover ground detection, forces, reactions, movement or the solver.


## Classic R6 death (research update)

Roblox documents that zero health transitions a Humanoid to Dead and the default `BreakJointsOnDeath` is true; the default `Players.RespawnTime` is five seconds. References: https://robloxapi.github.io/ref/class/Humanoid.html and https://robloxapi.github.io/ref/class/Players.html#member-RespawnTime . The owner 1145 WebClient WASM contains `CharacterBreakJointsOnDeath`, `ClassicDeath`, `RequiresNeck`, and `Died` in passive data segment 1; this string scan does **not** identify the engine implementation or recover the solver.

The local player now remains dead for five seconds, renders six loose parts from the current animated R6 pose, prevents attacks while dead, plays the supplied death audio once, and follows the detached head with the camera. Torques, collision, gravity integration, floor/part contact, camera response, and respawn location are authored browser approximations, not recovered Roblox code. The demo Reset Character invokes this same death path; the research reset/rejoin hook still resets the demo immediately. Actual games may override these defaults.


## Death, spawn protection and combat-input revision

The earlier five-second death behavior above has been replaced at the user's request by a three-second respawn. Both the player and dummy now use independently rotated box colliders, SAT overlap tests, angular impulses and floor friction; the selected initial kick, contact impulses, kinematic player collisions, gravity integration and friction remain authored approximations. The 1145 string/xref scan did not recover Roblox's death or rigid-body solver.

Spawn protection lasts 10 seconds on join and respawn, matching the documented default SpawnLocation Duration. It blocks this demo's explosion and Humanoid-style damage, but not explicit Reset, falling out of the world or a direct-health kill brick. The blue sphere is a browser rendering approximation. Source: https://robloxapi.github.io/ref/class/ForceField.html and https://robloxapi.github.io/ref/class/SpawnLocation.html .

The public Linked Sword script disables the tool for a one-second lunge and ignores inputs while disabled. To address reported lost clicks, this demo buffers one click during that cooldown and executes it when ready; this is an intentional input accommodation, not a transcription. Accepted slashes and lunges preserve their public damage values during the browser's short contact window. The swept-blade contact generation is not the recovered engine Touched event.


## Ladder, platform and Rainbow Magic Carpet

The platform and climb-trigger ladder are authored level geometry and controls, not recovered place content or Roblox's climbing state. The flying carpet uses public gear 225921000, original texture 223080038, main mesh 223079737 and four source piece meshes 223079795/223079835/223079888/223079981. Version-1 mesh coordinates and normals are quantized for local transfer; the original texture is lossless. Its local script specifies camera-relative forward speed 90 and sideways speed 60, sit animation and a one-second seven-color trail. This browser implementation adapts those behaviors; BodyGyro/BodyVelocity physics, animated welds, sit blending, collision and trail geometry are not recovered. Sources: https://assetdelivery.roblox.com/v1/asset/?id=225921000 and https://roblox.fandom.com/wiki/Catalog:Rainbow_Magic_Carpet .

The carpet is visibly placed on the raised platform and is added to slot 4 when the local character approaches it. The proximity pickup, persistence in the offline backpack and platform placement are authored demo behavior; the public gear asset itself was not recovered from the user’s place.

The flying pose now uses the public carpet gear's R6 sit animation 225279725 (source SHA256 e27806c08fc3bb63898f1a84dc397f91e4adaf8ceff9c47cd5b9c6cd2216476e), rather than the generic chair-sit clip. Its keyframes are decoded from the public KeyframeSequence; interpolation and the flight physics remain browser adapters.

After the user reported visible gaps and bouncing, the flying carpet now renders the single continuous original 223079737 mesh, held at a fixed offset beneath the rider. The four extra source mesh assets remain bundled but are not used for the flying display.

Following the user’s screenshot, the rider and continuous carpet now pitch and yaw together with the camera. The carpet sits immediately beneath the public R6 carpet-sit pose. The seven-colour trail uses the public gear script’s 0.5 × 0.5 strip cross-sections, segment length distance + 3.5 and one-second lifetime, rotated in three dimensions. Orientation math, network interpolation and physics remain browser adapters.

The public 225921000 gear script samples every 0.1 seconds, uses Transparency 0.1 for the trail blocks, and individually schedules each segment for removal after one second; it does not fade the blocks from birth. At the user’s request the demo extends the lifetime to three seconds, retains the 0.1 transparency, and lets older segments expire independently even after flight stops. The longer lifetime is a deliberate user-requested change, not an original-gear claim.

Classic R6 climb animation 180436334 is decoded from its public KeyframeSequence (SHA256 32c66711effecfcf9da185c03577258814371dc8f5ee469ee5f7ac789f409c4e). Animation speed follows the classic Animate speed/12 convention. Ladder contact, holding still and walking off its top continuously are browser approximations, not recovered Humanoid physics.

At the user’s correction, ladders are inert scene objects. A general player-side climbing adapter checks contact with any supplied TrussPart volume and input; it does not move the player forward automatically. Roblox documentation describes TrussPart and Humanoid Climbing, while the actual engine detection, forces and contacts have not been recovered. See https://create.roblox.com/docs/parts and https://create.roblox.com/docs/reference/engine/enums/HumanoidStateType.


## Websim multiplayer combat

The live room relays local positions, tools, approximate sword contacts and rocket explosions. A room process tracks health, checks range and cooldown, applies 10-second spawn protection and 3-second respawn, and sends remote damage/death events. The hit detection and projectile paths are client-reported approximations with basic validation, not a secure authoritative Roblox server or recovered engine replication. A disconnected/offline copy remains single-player.

Platform and TrussPart volumes now block character sides, and the platform has an underside ceiling. A jump request while climbing exits the player-side climb state, applies JumpPower 50 and a small authored outward velocity, then gravity continues normally. Humanoid documentation describes Climbing at 70% of WalkSpeed, applied here as 11.2 studs/s for WalkSpeed 16 (https://robloxapi.github.io/ref/class/Humanoid.html). The public API does not expose the native collision/jump solver; these contacts and the outward impulse are browser approximations.

The dummy now remains broken for 15 seconds; player respawn remains 3 seconds. The browser rigid-body approximation uses inelastic low-speed support, friction and explicit sleeping/waking for resting stacked and detached parts to prevent perpetual bounce and spin. These heuristics are authored, not recovered Roblox contact or sleep rules.

Classic R6 emote clips wave 128777973, point 128853357, laugh 129423131, cheer 129423030 and dance1/2/3 182435998/182436842/182436935 are decoded from public KeyframeSequence assets. Rotations were rounded to six decimal places; interpolation, wheel and movement cancellation are browser adapters.

Forcefield glow and sparkle imagery are decoded from files independently hash-matched to the owner's 1145 content. The camera-facing composition, transparency, sparkle positions and timing are authored approximations; the Roblox forcefield shader/emitter has not been recovered.
