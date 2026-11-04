# Game implementation notes

These comments were moved from game.js to keep the owner’s structured-write payload below 60,000 characters.

    // The layout below is a demo scene, not an extracted place file. Staging
    // uses the traced inline-file port; snapshot readback is ordinary JS.
    // This is only the detached Block path with mocked host services. The
    // linked/world branches and surrounding simulation are not reconstructed.
        // 113691 returns zero for this deliberately unlinked primitive; the
        // nonzero branch of 114418 still needs the surrounding engine.
    // The target-height calculation executes nine recovered WASM functions in
    // a restricted JS VM. The R6 branch, floor, offset and object image are
    // synthetic inputs; collision and the resulting movement remain demo glue.
    // Corners, face order and normals are recovered Block geometry. Splitting
    // each quad into triangles here is a demo-renderer choice, not a traced shader.
    // The archived R6 model references a different head than the separately
    // provided owner head. The linked public asset is the displayed mesh.
    // Actual client tile, decoded offline from DXT1. Repeat/mipmap are WebGL glue.
    // Linked Sword mesh, texture, Grip and R6 RightGripAttachment are from
    // public Roblox assets. This weld and the renderer are still adapters.
    // The ring and restricted 3213 path use a private single-threaded image.
    // Resolution, locking and the adapter from records to movement are demo glue.
    // Synthetic per-key objects stand in for 99505's untraced lookup and
    // ownership. Setter side effects and notification/signal hooks are mocked.
    // Source: downloaded 1145 content/avatar/characterR6NoFace.rbxm Humanoid.
    // Gravity is the documented Workspace default, not recovered from this place.
    // The airborne glide factor and all integration/contact logic are demo choices.
      // Consuming/resetting the vector here is demo glue, not a traced consumer.
      // Primary button is only the Tool activation; it never rotates the view.
        // Authored heading easing: the historical Animate scripts do not recover the Humanoid turn controller.
      // In Shift Lock the whole avatar follows camera yaw even while idle.
      // Authored smooth traversal of a nearby step in either direction; a drop
      // larger than one step still falls. This is not the Roblox contact solver.
      // The source sword uses a capped vertical BodyVelocity, not an instant
      // velocity assignment. We have not recovered the mover/contact solver:
      // honour the reported no-ground-launch behavior and use only a modest,
      // explicitly authored reduction of downward gravity in the air.
      // Seat activation/welding is an authored proximity adapter, not Seat code.
      // Community-observed R6 weld convention; not traced in this WASM.
      // Authored swept-line contact; this does NOT reproduce Roblox Touched.
      // User-requested focus near the lower edge of the 1-stud-tall R6 head.
      // The archived script used root + 1.5; this lower 1.1 offset is an adapter.
      // Screen projection is browser glue; exact Roblox name occlusion,
      // scaling and health color have not been recovered.
      // Authored stationary R6-shaped target. The original place was not recovered.
        // Six independent browser-simulated parts after death. No claim of
        // Roblox joint, rigid-body, floor or inter-part solver equivalence.
      // Archived R6 Motor6D C0/C1 and decoded keyframes drive every part.
      // Matrix interpolation/blending and moving-speed input are demo adapters.
      // Archived R6 faces -Z; demo heading zero points +Z.
    // Only the normal 89079 accumulator is recovered. Its selected flag and
    // object state are seeded here; the 240 Hz rate and 0 cap value are demo
    // choices, not proven defaults of the target build. Every scheduled tick
    // still runs the independently written, approximate character update.
