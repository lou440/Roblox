# Offline Baseplate — research build

This is a **partial research demo**, not a JavaScript recreation of the complete WebClient engine. It combines a few bytecode-derived routines with the earlier independent demo. The renderer, movement, player, physics, lighting, and scene layout are still approximations. The demo baseplate configuration is hand-authored; it is not a place recovered from the WASM.

## Run

Open `index.html` in a recent Chrome, Edge, or Firefox with WebGL enabled. Everything is local: no server, npm, network connection, external assets, or running WebAssembly is required.

## What is connected

- **HUD (partial):** selected candidate compiled menu/chat/settings instructions run through a restricted interpreter alongside a health-bar model. Selected Settings and Backpack modules also match the owner’s updated 1145 patch; the original 1142 owner patch was absent. Menu pages, reset, unsupported settings and local-only chat are partial browser adapters—not reconstructed Roblox services. The active target branch and original complete menu behavior are unknown; the health bar is not connected to a recovered Humanoid. See `HUD_PROVENANCE.md`.

- **R6 appearance (partial):** the seven static part sizes, relative positions, and referenced head scale come from the public archive associated with the exact same WASM. The displayed head is the current public response for the archive model's MeshId, and its face texture matches the archive and an official WebClient package. The original 1142 folder lacked the model and face; the updated 1145 download contains matching hashes. Six candidate archive Motor6D frames and referenced walk/idle/jump/fall/sit/tool keyframes drive limb motion, with browser interpolation. Noob colors, heading, renderer, movement and physics remain demo choices. The separately supplied head mesh remains available for research but is not displayed. See `R6_PROVENANCE.md`.

- **R6 Running height fragment:** nine recovered WASM functions execute as JavaScript instructions to calculate a target using a synthetic R6 object image and the demo floor. Their 3-stud result is used by the demo's ground cutoff. Ground detection and response, walking motion and the physics solver remain approximations—not Roblox physics. See `R6_PROVENANCE.md`.
- **Backpack and item (partial):** selected `BackpackScript` bytecode matching the owner’s updated 1145 patch drives a hotbar and one public Linked Sword. Click slot 1 or press **1** to equip, then click or tap the scene to swing; two quick activations trigger a lunge. The sword can hit an authored training dummy, whose name and damaged health appear overhead; on death its six parts fall apart and respawn. Sword contact, damage, weld, animation and rendering are browser adapters, not Roblox physics or multiplayer combat. Grounded lunges do not launch the player; the small airborne glide is an authored approximation. Drop and replication are not implemented. See `BACKPACK_PROVENANCE.md`.
- **Studs and camera:** the floor uses a tile decoded from the downloaded 1145 `studs.dds`; its shader and UV scale are approximations. The R6 camera uses a user-requested near-bottom-of-head focus and selected constants from an archived 1142 script, not a fully recovered camera. See `R6_PROVENANCE.md`.
- **Block geometry:** corner positions, face order and normals, half-diagonal, and rotated half-extents are translated from traced instructions and data. A restricted projection-inside-Block-face query is also translated and used for the top-face footprint check. The height test, contact response, quad-to-triangle conversion and WebGL shader are independent demo choices, not recovered collisions.
- **Part dimensions and material:** the detached-primitive size rules, Block volume/center, material selection, and a restricted normal update path are translated. One callback is handled only for this unlinked primitive; locking and allocation are mocked, and attached-world, custom-shape and other engine branches are not implemented.
- **SpawnLocation:** constructor property defaults and selected property-state behavior are translated. The demo does not reproduce actual spawning or team logic.
- **Keyboard input:** key-code mapping, keyboard record creation, ring control, a restricted normal dispatcher/vector path and modifier-mask updates use traced instructions. The pre-resolved object-update tail of 99505 is also translated, with synthetic per-key objects and mocked setters, notifications and signals. Lookup, ownership, locking and the later record-to-demo-controls adapter are demo choices; touch input and movement are not the original gameplay consumer.
- **Frame-step accounting:** a restricted normal branch of target function 89079 calculates the number of demo updates, retained fractional steps and dropped backlog. The page selects a 240 Hz demo frequency and zero for the cap setting; these are demo inputs, not verified target defaults. Each tick still runs the approximate character physics, not WebClient physics.
- **Asset staging:** the local, hand-authored scene description is staged with a partial port of the original inline-file/asset registry routines. Reading it back through the port's JavaScript snapshot is demo glue, not a recovered file-read function.

See `ANALYSIS.md` for function numbers, test scope, and limitations. The original WASM is not included or executed by the page.

## Controls

- **W A S D** or arrow keys: move relative to the camera
- **Space**: jump
- **Right-drag** the scene: orbit the camera (left-click does not pan)
- **Mouse wheel** or **I/O**: zoom, including a first-person approximation
- **Escape**, then **R** or **Reset Character**: confirm a reset to the starting point
- **1** or hotbar slot 1: equip/unequip the Linked Sword
- **Left click/tap**: swing; two quick clicks: lunge. An archived Roblox tool cursor is shown while equipped. Walk near the gray dummy to test hits.
- Walk into the chair to sit; **Space** stands up. Walk up the stairs.
- Settings → **Volume** controls the embedded sword sounds.
- **`** or More → Inventory: open/close the backpack
- **Escape**: open or close the local menu; **/**: open local chat
- **Chat** sends messages only to this local session—there is no server or other player.

Touch controls appear on touch-first devices. Walking off the demo plate resets the character; this behavior is not claimed to match WebClient.

The leaderboard shows only the local player; press Tab or use More → Leaderboard to toggle it. Its selected sizing routines come from the matched WebClient 1145 PlayerList; UI rendering and data are browser adapters.

The local chat window follows selected 1145 ExpChat sizing and idle timing values; the browser composition is an approximation and does not connect to Roblox chat.

The Escape transition uses the matched 1145 legacy SettingsHub slide timing and direction in a browser adapter. The active session may use a different experiment or client version.

## New controls and adaptations

- Press **4** or select the revolver for The General’s .45; click/tap to shoot and press **R** (or the on-screen Reload button) to reload. It uses the public tool’s six rounds, 40 damage, 0.5-second firing interval and 3.7-second reload. A hit to an R6 left arm or either leg detaches it for ten seconds; a player’s right-arm hit drops its equipped tool. The browser raycasts and physics are approximations, missing legs do not change the controller, and hats/accessories are not rendered.
- Press **.** for the emote wheel, or type `/e wave`, `/e point`, `/e dance`, `/e dance1`, `/e dance2`, `/e dance3`, `/e laugh`, or `/e cheer`. Decoded public R6 animation keyframes are blended by a browser adapter. Moving cancels an emote.
- A trowel brick can support a standing player and remains pushable; rotated contact and the other physics are not the original Roblox solver. Empty-chat Enter unfocuses the input.
- See `RUNNING_EXPORT.md` in the offline copy for an opt-in local DevTools exporter. It requires an already-running debug-enabled browser, and a live Roblox session is not yet verified.
