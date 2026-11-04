# Partial HUD research build

This page is **not a reconstruction of the complete Roblox HUD or engine**. It currently demonstrates only a small, explicitly selected Chrome-branch subset from Roblox source, on top of an independent demo renderer and character. Selected candidate compiled UI instructions run in a restricted JavaScript interpreter; menu, overflow and chat interactions still use offline browser adapters, not recovered Roblox services.

## Sources and confidence

- A public archive for WebClient build `0.745.0.7451142`, upload `version-f4a4dba57f874ad0`, contains a WebClient.wasm with the exact same SHA-256 and byte count as the supplied binary. The archive's `HealthBar.lua` is `33bdf524b4bbddb3fd5cb801a53a66812ef6ad233ec328f47c74c67b97840c49`. Selected archive source paths and hashes are retained in the research workspace manifests.
- All 30,566 ordered paths in the archive and original 1142 owner metadata match; two recorded sizes differ, and the original 1142 patch was absent. The owner’s later 1145 download contains an InExperience patch with SHA256 `5db5363e4dbb07444b11f4a01915a7731f6dffbc5369120190196f92e7e0d5e0`, matching the public 1145 patch. The selected legacy BackpackScript, SettingsHub, Theme and GameSettings module hashes also match the candidate archive modules. This does not establish the user’s active branch or the contents of the missing original patch.
- `HealthBarBaseTV.png` and `HealthBarTV.png` were read from the owner's directory and SHA-256-verified; the BuilderIcons Regular and Filled fonts are from the matching-WASM archive and the current official CDN, not hash-verified owner copies. The Filled font has SHA256 `f0c2f6d3617f86a401569c6a0021050c53beb3f5c43b252b7fb6090ee0744a9f`.
- The target's active Chrome, side-sheet, topbar-refactor and icon migration flags were not established. This page **selects** the Chrome/non-side-sheet/tilt branches for demonstration; it does not claim they were active. Layout positioning, drawing and event adaptation are a browser implementation, not recovered engine rendering.

## Present and absent

- The logo, overflow and chat glyphs use archived BuilderIcons fonts and source-specified ligature names (`tilt`, `three-bars-horizontal`, and `speech-bubble-align-center`). The candidate compiled chat visual configuration selects Regular/Filled for inactive/active. Its availability and the target branch are unverified.
- The archive's `MenuIcon.lua` activates the settings/in-game menu, `ChatIcon.lua` calls `ChatSelector:ToggleVisibility()`, and `MoreMenu.lua` toggles a menu with leaderboard/inventory entries. The new DOM adapter implements corresponding local interactions: a menu with People, Settings and Help; reset confirmation and resume; local-only chat; and a candidate-code backpack. Unsupported leaderboard and emote panels are omitted. It does not implement Roblox menu services, account/player lists, emotes, moderation, remote messaging, networking or exact UI behavior. Chat is explicitly local to the current session and messages are not filtered or sent to other players.
- The selected legacy SettingsHub branch executes candidate `GameSettings` instructions for the shift-lock, volume, fullscreen, graphics and performance rows. Row creation and selected values matched the same candidate bytecode in native Luau in 512 mocked cases; callbacks and Roblox settings services are not reconstructed. Unavailable settings are disabled; fullscreen uses the browser API, Volume controls embedded sword audio, and sensitivity controls the demo camera. Camera and Movement Mode rows show source labels/defaults but are disabled placeholders. Row geometry is a partial DOM translation, not the Roblox GUI renderer.
- Its selected sensitivity functions execute candidate `GameSettings` bytecode: for slider values at most 5, `max(0.2, 0.16*x+0.2)`; above 5, `0.6*x-2`. GUI-to-engine and engine-to-GUI functions matched native Luau over 20,402 tested values. The demo camera applies the result through independent glue. The separate `ui-settings-model.js` preserves an older comparison for the *different* newer InGameMenu branch and is no longer the active adapter.
- The health state, dimensions and color interpolation follow the archived `HealthBar.lua` and have been differentially tested against both its extracted formula and selected compiled Luau v9 instructions from the archive patch, with mocked float32 Roblox types and iteration order. It hides at full health; a demo health value can be set through `window.__robloxHudResearch.setHealth(value, maximum, isDead, enabled)` in the browser console. It is not yet connected to a recovered Humanoid. The canvas uses the verified PNGs and a browser nine-slice adapter; exact engine rasterization, especially at tiny fill widths, is unverified.
- The complete Roblox chat, player list, menus, other HUD controls, Roblox's full runtime and the physics solver are not implemented. The earlier research notice, custom mini-panels and standalone Reset control have been removed.

## Candidate compiled UI and limits

The browser’s `ui-bytecode-*.js` files contain selected Luau v9 instructions from the archived InExperience patch, interpreted by a restricted JavaScript VM. Mocked differential tests against archived source or native Luau covered IconButton (3,072), SettingsHub/Theme (192), ChatWindow (64), SettingsPageFactory (128), ChatInputBarV2 (1,024), ScrollingView (8), BottomLockedScrollViewV3 (128), and selected GameSettings row instructions (512). Hooks, layout contexts, services, effects, policies and flags are mocked; the chat composer's custom-send branch is untested. Matching these restricted cases does not prove the real engine, target UI branch, active theme, complete settings page or chat service.

The candidate SettingsHub does not register a Record tab; Captures depends on policy and is not represented here. Page bodies, controls, player list, reset, chat transport, and overall visual rendering remain partial DOM adapters. The archive patch is a different size from the missing owner patch; none of these comparisons establishes that this UI is the owner’s exact version.

## Backpack and source-derived menu details

Selected candidate BackpackScript instructions are interpreted for layout, visibility and normal Tool selection/equip; GUI/services are mocked. The reset confirmation and partial Help page use source text from the matching-WASM archive, but their DOM rendering and branch selection are adapters. More → Inventory opens the backpack; unsupported menu services are omitted or disabled. See `BACKPACK_PROVENANCE.md` for hashes, tests, controls, public Linked Sword assets and the limited training-dummy combat adapter.

## Updated settings asset and bytecode evidence

A read-only owner scan matched the 1145 BuilderSans Regular, Medium and Bold font bytes and seven Settings slider/bottom-key icon PNGs to the public 1145 files. The page embeds Latin subsets of those fonts and the matched icons. The current patch's `AppFonts` default selects BuilderSans; `Settings.Utility` contains the 50px row, 40/60 split, selector textures and ten-step slider instructions. This page uses the ungrouped legacy branch and a DOM implementation; it is not pixel-accurate or an execution of Roblox's GUI engine. Small-touch slider spacing is adapted for usability. The experiment-controlled grouping, newer menu/backpack, policy and input branches have not been established.

## Legacy Escape-menu animation (1145)

The matched `SettingsHub` prototype 138 calls `TweenPositionInternal` on its Shield for the legacy branch. Its matched `Theme` places the inactive shield at `UDim2.new(0,0,1,36)` and matched `InGameMenu/Resources/Constants` specifies 0.5 seconds to open and 0.4 seconds to close. The call sites use Quart InOut for opening and Quart Out for closing. `menu-animation.js` uses these values to animate the browser dialog and a dimming layer; its interpolation, backdrop, reduced-motion behavior and DOM are browser adaptations, not the Roblox renderer or engine TweenService. Side-sheet, VR, reduced-motion, newer-client and experiment branches can differ, and the active session has not been verified.

## Candidate tokenized Chrome submenu (1145)

The matching 1145 `UnibarStyle` compiled prototype 0 is interpreted with mocked Foundation Dark tokens, and its 22 selected output values at each of three scales were compared with the original prototype in native Luau. At scale 1 it gives 44px icon cells, 36px icons, 56px submenu rows, 8px padding/radius and a 20px Bold TitleLarge font. The matching `SubMenu` prototype 16 gives a 192px panel and 20px bottom padding in a mocked non-VR case; its row prototype 5 uses those dimensions. `buildMenuOrder` places leaderboard before backpack in 16 mocked combinations. The archive BuilderIcons migration maps the source's leaderboard off/on assets to Regular/Filled `trophy` and inventory to `backpack`.

The panel, backgrounds, cursor behavior and positioning are a browser adapter with mocked theme and integrations; unsupported rows are omitted. The user's actual icon migration, experiment flags, scale, theme, other integrations and side-sheet branch are unknown. This is not a capture of the running session and may differ substantially from it.

## Candidate legacy desktop PlayerList (1145)

The desktop now selects the 1145 legacy branch because its reskin flag defaults off; the active session/IXP override is not known. It executes the matched `CreateLayoutValues` prototype with mocked objects and uses a browser translation of the desktop app's sizing. For a wide display at UI scale 1, a 36px mocked top-bar offset, no leaderstats and no active platform leaderboard, native-Luau tests give a 166px container, 150×40px player entry and 14px SourceSans name. The matching `PlayerListDisplayView` omits its stat title when the stat count is zero, and its separate tabs component returns no tabs when no platform leaderboard is active. The source uses a 16px Small close icon; rounded cap/spacing and the single offline `LocalPlayer` row remain DOM adaptations.

The legacy-layout slice was checked against native Luau in 108 mocked values; the app sizing slice was checked in 36 wide-desktop cases, and the title/tab conditions were inspected with mocked services. The mobile implementation still uses the previous partial model. None of this verifies the running session's flags, player names, actual top-bar inset, stat data, font rasterization or complete leaderboard.

## Escape opening viewport fix (827)

A browser regression showed that `scrollIntoView()` on the still-offscreen animated tab scrolled the hidden world container by about 200px. Tab selection now adjusts only the tab strip's horizontal scroll position, and confirmation focus prevents scrolling. Desktop, short and mobile viewport tests verified that the canvas remains fixed while the menu slides. Browser-default scrollbar chrome is hidden; wheel/touch and programmatic scrolling remain available. This fixes browser behavior, not the unknown live Roblox menu's visual branch.


### Owner-provided WebClient screenshot (event 864)
The screenshot shows the Here/Global chat tabs, a dark pill composer and two separate capsule sections in the top-left control group. The visible button is approximately 60.5 image pixels wide; the unibar logical cell is 44, so this browser presentation uses a provisional desktop multiplier of 1.1; the separately recovered menu-icon frame was 36 and is enlarged to match the screenshot. A paired screenshot of this demo was 25% wider in physical pixels than the reference after the earlier 1.375 scaling; 1.1 corrects that observed ratio, without asserting an exact OS DPI. This is a measurement for the provided image, not a recovered system DPI setting. The screenshot's leaderboard is aligned with the chat below the top controls; that alignment and the provisional scale are used for the offline rendering even though the selected unscaled source model measured a 40-pixel top offset. The current session's screenshot includes an experience-specific Cash column; the offline demo has no Cash data and does not fabricate it. Global chat, microphone and shortcuts are unavailable offline. A blue send state and inactive microphone-shaped icon are browser renderings based on the user's description; the screenshot does not show a typed message.

The owner-matched legacy PlayerListApp Luau bytecode specifies a position motor with dampingRatio 1, frequency 7, opening from .2 of parent width toward 0 and closing toward 1.1. The browser's critically damped transform is an adapter, not the Roblox Otter runtime; the actual open/close timing and active branch still need the requested recording for comparison.


### Local settings and leave adapters
The controls remain browser-only: Shift requests the browser Pointer Lock API and displays the supplied 1145 MouseLockedCursor while locked. The browser may deny lock or release it on Escape; shoulder offset and camera response remain adaptations. Follow eases the camera behind movement after a pause, while Click to Move walks toward a clicked ground-plane point and stops at obstacles (no Roblox pathfinding). Manual quality adjusts local render resolution, not Roblox quality tiers; statistics show local FPS/resolution. Leave ends this local session and Rejoin resets it. These are interactive substitutes, not recovered engine implementations or network services. Fullscreen depends on browser permissions.


The normal arrow and hand-hover cursors are the owner's 1145 `content/textures/Cursors/KeyboardMouse/ArrowFarCursor.png` (SHA256 `1f8e6a409757a8bec250a2517c6e67564d84f552f63f69d911eafe6f18023d46`) and `ArrowCursor.png` (SHA256 `4cb1e49b03ea5d6657788dc178aacffc4e0b976217428708e1327545598efbe3`), both 64x64 with hotspot (32,32). The equipped Linked Sword still overrides the canvas cursor with the separately documented archived GunCursor. The user-requested hidden inventory chevron does not disable the backquote or hamburger inventory controls.


### Owner 1145 character sounds and settings interactions
Jump uses `content/sounds/action_jump.mp3` (SHA256 `0962d7ee2ad7c59ff101f9bac1419202f7bc46ff4aaebd43ef522a06db9d9a3d`); a dummy death or local fall uses `content/sounds/oof.ogg` (SHA256 `79416ffe76b7f0e0469fe5cce17f47e97b434364dcaa17c6c3d25123b60e39c1`). Both were read from the supplied owner folder, embedded without modifying it, and obey the local volume control. Autoplay depends on browser permission. Selectors wrap as requested and two-choice values can be clicked; these behaviors are browser adapters, not evidence of the active Roblox settings branch.

Left and right arrow keys turn the browser camera at an authored angular speed; A/D remain strafe controls. This is a requested browser input adaptation, not recovered camera input code.


### Resizable local chat and Quick Words
The taller default and drag/keyboard resize handle are browser adaptations requested by the owner. Quick Words reproduces the ten visible General phrases in the owner's screenshot; Coordination's two examples are from the 1145 studio-debug catalog, not the unknown live catalog. `GetPresetsAsync` supplies the real dynamic catalog online and is not available in this offline recreation. Choosing a phrase creates a local message and projected bubble only; there is no Roblox chat service or other player. The orange `LocalPlayer` name, bubble and placement are screenshot-inspired approximations.


### Screenshot-based Settings/menu presentation
The four tabs, Leave/Respawn/Resume footer, and grouped Audio and Chat & Language presentation are transcribed from the owner's screenshot; DOM size, spacing, colors and animation are browser approximations. The original 1145 bytecode-derived legacy settings rows remain available below those groups and are not claimed to be the active branch. Output Device represents only the default browser output. Chat summaries, message rephrasing, and automatic translation toggle local preferences but cannot run their online Roblox services in an offline session; their descriptions explicitly disclose this. Report is similarly unavailable offline.


### Screenshot-inspired More and local profile
The nine More rows, People grid/list controls, and left-anchored profile card follow the owner's screenshots; exact active 1145 layout/theme and live accounts remain unverified. The only profile action opens an offline diagram of the demo R6 avatar, not the owner's live avatar. Friends chat, shop, avatar switching, music, emotes, invitations and reporting require online services and show an explicit offline notice or page. Leaderboard, inventory and the local respawn confirmation are connected.

Mobile input is an authored browser adapter: a touch thumbstick supports movement, a jump button queues a jump, a drag pans the camera, and a tap activates the equipped tool. It is not recovered Roblox mobile CoreGui or its touch controller.
