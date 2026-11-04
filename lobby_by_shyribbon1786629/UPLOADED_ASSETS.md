# Supplied sprite sheets

Two distinct files were available: uploads/image-9.png (the gear sheet, listed twice in the attachment message) and uploads/image-10.png (loading-screen/UI sheet). Originals are preserved.

Cropped assets are in assets/uploaded/; manifest.json records each source rectangle. Cropping and black-background transparency removal were performed offline with Pillow, not page-side canvas. The artwork is the user's supplied art, not regenerated.

Used in the page:
- Matching sword, timebomb and ball icons replace their inventory images; the sword also appears in the player-list weapon indicator.
- The loading-screen sheet supplies its dark patterned background, blue loading ring, white Roblox mark and classic wordmark.
- The home-screen background uses the same supplied dark texture.
- Existing Roblox-menu and leaderboard/avatar-close controls use the supplied mark and close icon without changing behavior or accessible labels.

Other gear icons/models remain unchanged when no unambiguous matching icon is present. Cropped crossbow/turtle-launcher, red mark and light background are available but are not substituted for unrelated gear and do not add tools, settings or new gameplay. The source sheet's credit area stays in the original upload; it is not included in UI crops.
