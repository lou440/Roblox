# Websim multiplayer adapter

The live room supplies Websim usernames for chat, leaderboard, and the Escape menu. Messages are masked server-side with Websim censorship plus a shared slur/hate filter (case, Unicode confusables, leetspeak, repeated letters, and spaced/punctuated spellings). Violations become `#` characters. This is not Roblox moderation and cannot guarantee detection of every language or bypass. Avoid sharing private information.

The optional public Roblox username lookup shows a thumbnail and applies matching body colors to the R6 demo. It does not authenticate ownership, rename your Websim identity, or reproduce clothing, accessories, meshes or an R15 body. The site backend may be unable to contact Roblox; an error is shown if so.

Offline chat applies the shared text filter and a local cooldown; multiplayer enforcement always runs on the backend.

## Server guards and crowd performance

- Movement consumes server-clock distance budgets (walking 18 units/s including tolerance; carpet 96 units/s) with bounded burst allowances. Every pose is checked, invalid movement is rejected and the sender corrected. A private verification heartbeat runs every 2 seconds. Carpet permission comes from reaching the map pickup or a nearby valid drop.
- Server-controlled health, hazards, shields and respawns; client health reports are ignored. Sword attacks have cooldowns and only one target per swing, with range and static obstruction checks. Pistols enforce ammo, reload, origin/range and nearest ray victim. Rockets require a recent launch and a matching direction, speed/time and one-use explosion, with damage restricted to the 14-unit blast radius (50 studs/s impulse). Real clustered blast kills remain possible.
- Chat: at least 750 ms between accepted messages and at most 5 in 8 seconds; violations start a 10-second cooldown with a private notice. Overall message budgets and avatar/emote throttles reduce flood work.
- 10 Hz quantized changed-only pose packets no longer repeat avatars, names or health. Appearance/combat changes are separate events. Reused remote collision boxes, allocation-free player-block tests, 20 Hz health/name labels, 30/15 Hz near/far remote animation, view/distance culling, instanced ribbon draws (legacy fallback), 120 Hz bounded local physics, sleeping-body skips, cached static collision bodies and sweep-and-prune broadphase for crowded brick physics reduce network, CPU and draw-call cost. Automatic graphics scales resolution down on sustained slow frames; existing Manual settings stay in control.

This is trust-but-verify, not a full server physics simulation: input positions, limb contact claims and projectile contact timing are still client-reported. The guards reject the common speed/teleport, action-flood and arbitrary kill-all reports, but cannot promise cheat-proof physics or a particular FPS on every device.

## Sign-in, sessions and bot signals

- Online play requires a Websim sign-in (`conn.identity === "user"`). Signed-out visitors are refused with close code 4001 and see a notice. Offline single-player still works.
- One live session per Websim account. A second session for the same account is refused (4009).
- One session per IP is the intended rule, but the room runtime does not expose the client IP to `server.js` (the connection object has no IP or request field). The IP check is inactive until the platform provides an IP, and the server logs a one-time warning saying so.
- Sessions are identified by the platform-authenticated connection only. No browser fingerprint is collected or sent (the old `fingerprint.js` was removed because ad blockers blocked it).
- Heat scoring: message floods, rejected movement, filtered chat, rapid fire attempts, out-of-spec rockets, metronomic movement packets, Heat decays 1 point per second. At 20 the session is logged as suspicious. At 40 it is removed (4010), and its account and fingerprint are blocked for 10 minutes.
- Three filtered chat messages within 120 s trigger a 180 s chat cooldown.
- Limits: the fingerprint is a soft bot-deterrent signal, not an identity. It changes when storage is cleared or browser settings change. Accounts can be rotated. Positions are still client-reported. Metronomic-packet detection is weak and only adds a small amount of heat.

## Public avatar assets

The optional username lookup can retrieve publicly accessible classic Shirt/Pants/TShirt textures and XML or binary-RBXM SpecialMesh head accessories through the fixed-domain `/api/avatar-asset` backend. It maps clothing to the R6 boxes and attaches supported version 1/2 head meshes approximately; other clients independently fetch the same public assets. The panel also provides download links for avatar asset files. Assets that require authentication, unsupported mesh versions, layered clothing, R15 meshes and non-head attachments are skipped; the UI reports counts and keeps the R6 body/color fallback. Roblox restricted anonymous 3D-avatar thumbnails from March 23, 2026: https://devforum.roblox.com/t/upcoming-breaking-change-preventing-logged-out-users-from-viewing-3d-thumbnails/4435303 . No Roblox cookie or API key is requested, collected, or embedded. Outbound asset delivery from Websim is not guaranteed.


## Avatar import and mobile UI updates

Ordinary swearing is allowed; racial/hate slurs and targeted hateful phrases remain masked. Spam and combat limits are unchanged. World chat bubbles/name tags now live inside the world stacking context below the HUD. Icons use direct private-use glyphs from bundled WOFF/TTF fonts rather than mobile-sensitive ligatures, with standard-symbol fallbacks on font failure.

The launch prompt offers Import avatar, Not now and Don’t show again (stored per project in this browser), reminds visitors about Esc → People/mobile menu, and asks for a like/follow without taking either action for them. The creator link is resolved from getCreator(), not the current visitor.

Asset failures were reproduced: pants 1812626 requires authentication; Pal Hair 63690008 is binary RBXM and was rejected by the old XML-only parser. The importer now reads bounded LZ4/Zstd RBXM property chunks for classic clothing/head accessories, tolerates XML prologs and numeric asset IDs, retries transient errors, evicts failed downloads, loads with three concurrent workers, and reports asset/texture failure reasons. The Zstd decoder for compressed RBXM is vendored at `vendor/fzstd.mjs`, so no third-party script loads at runtime. The same-origin backend tries Roblox direct delivery then its v2 CDN resolver, validates CDN hosts and caches public files within a 32 MB/64-file budget. RoProxy also returned 403 during diagnosis and is not used. Auth-only assets, layered clothing and unsupported mesh formats still cannot be imported.
