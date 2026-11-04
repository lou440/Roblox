# R15 reference

Requested username: **judahsfriendtrey**. ZIP obtained from the public Character Downloader POST endpoint at tools.nicolinoo.eu and stored as `avatars/judahsfriendtrey.zip`. OBJ/MTL/PNG files are the returned avatar assets, not newly fabricated textures. No ownership or freely reusable license is asserted.

The returned OBJ has 14 anonymous Player groups: head, six arm/hand groups, six leg/foot groups, and one torso group. The importer infers spatial identities and inserts a non-rendered lower torso joint. Five accessory groups retain their texture materials. All geometry uses one shared five-stud body scale, with the source world offset removed.

`r15-rig.js` is authored approximation: anatomical pivots inferred from mesh bounds, existing R6 rotations retargeted into an articulated hierarchy, and procedural elbow/knee bends. OBJ does not supply Roblox attachment/Motor6D/skin-weight data. Clothing is rigidly attached; six-group combat/death behavior remains for compatibility.
