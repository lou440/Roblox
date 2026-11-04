# Client archive research and physics changes

Inspected uploads: robloxweb.zip (76 files) and arena-source-snapshot-df6a19f6e2.zip (146 files). Neither includes .wasm/.wat, native C/C++ headers or sources, Lua/Luau source files, or nested source ZIPs. The embedded Box3D module in this project is a separately vendored open-source solver, not a recovered Roblox physics engine.

Recoverable client material includes R6 animation assets/pose data, running-height-program.js, running-physics-vm.js, and camera-classic-model.js. See R6_PROVENANCE.md and ANALYSIS.md for existing recovery notes. The snapshot's humanoid-climbing.js itself acknowledges that its native solver was not recovered. Consequently there is no evidence for a full native Humanoid/Animator/camera/climbing port; do not describe the authored adaptations here as 1:1 Roblox source.

## Implementation
- Render-frame billboard attachment projection uses the rendered head matrices.
- One Box3D world contains anchored geometry and light, rotation-unlocked trowel bricks. Capsule movement uses collide/solve/cast queries against that same world. Trowel bricks no longer advance in the old separate rigid-body solver. The floor/environment retains static bodies; dynamically edited parts synchronize incrementally. Existing ragdolls still use their prior adapter.
- Movement now uses client-authoritative Box3D contact prediction with server-authoritative kinematic budgets, action validation, sequences, and a recovery acknowledgement. The old server AABB geometry rejection and hover correction were removed: these coarse proxies cannot accurately certify arbitrary client meshes. Gross movement failures produce one bounded 90 ms noclip translation; no persistent force or blocked correction accumulator remains. Spawn/teleport events are explicitly hard. This is trust-but-verify locomotion, NOT a full server-side replay of the native physics engine.
- HumanoidController provides debounced reachable seat attachment, jump exit, same-seat reattachment lockout, and coherent animation phase/state epochs. Held jump is re-requested every fixed tick. Truss climbing uses oriented face contacts, smooth acceleration, sweeps, summit handoff and jump-off cooldown. These are authored browser implementations.
- Equal glow billboard dimensions preserve a circular forcefield. Shader clouds are sampled on a world-space plane, not from camera-fixed CSS art. All scene material paths share sun, hemispheric ambient and distance/height haze. These are authored atmospheric effects, not a native Lighting port.

## Regressions
node verify-box3d.mjs
node verify-humanoid.mjs
node verify-map-room.mjs

These cover bounded stair motion, wall/ceiling collisions, ground adhesion, incremental removal, seat exit/no immediate reseat, correction ordering/stale epochs/blocked expiry, ladder sweep/summit/jump release, light brick mass and off-center explosive tipping. They are deterministic local simulations and do not prove flawless behavior under every map, latency or multiplayer collision scenario.

## Latest locomotion and ownership revision

- Grounded descent follows a downward capsule sweep against real geometry, with a short contact/state hysteresis interval. Explicit jumps disable ground adhesion. Animation speed and remote walking flags use the same support grace.
- Ladder acquisition requires the forward torso contact volume; a larger oriented forward sensor retains the latch. Turning away or leaving that sensor releases climbing.
- The authored slide now uses an actual inclined collider and an explicit sit-on-touch property. Free seating freezes the R6 seated joint transforms into one convex rigid body with unlocked rotation; it does not create socket joints or a seated weld to the slide. Chairs still use their separate attachment lifecycle. Jump exits destroy the free body.
- Camera-facing yaw is set once per render without a competing movement spring. Proximity fades local body/accessory opacity. Minimum zoom enters first person and requests Pointer Lock from the zoom/click gesture. Browsers may require a click before allowing Pointer Lock.
- Trowel assemblies have server-issued ownership epochs, proximity-validated contact handoff, nearest-player fallback, expiry, late-join snapshots and reconnect reset. Only the lease holder simulates an assembly; others use interpolated kinematic replicas in the shared world. Owner state packets are checked for identity, epoch, finite values, speed, quaternion length and plausible displacement. This is client-owned shared physics, not server-side Box3D simulation.
- Rockets intersect updated oriented wall body snapshots server-side. Authoritative blast events apply distance-falloff impulses at closest points on owned Box3D bodies, plus capsule impulse locomotion. Non-owning replicas do not apply duplicate forces. Legacy dead ragdolls and several scripted projectiles retain their older adapters.

New regressions: verify-locomotion.mjs, verify-network-motion.mjs, verify-camera-controller.mjs. They supplement verify-humanoid.mjs, verify-box3d.mjs and verify-map-room.mjs; these tests are evidence for the enumerated cases, not proof of perfection across arbitrary geometry or real network conditions.
