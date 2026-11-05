# 3D Gallery

Run `npm start` from the repository root, then visit http://localhost:3000/3dGallery/.
The viewer uses raw WebGL with a depth buffer, without external libraries.
Solid surfaces and their outlines are depth-tested so overlapping parts occlude
correctly. Wireframe intentionally shows all mesh edges. Lighting, face colors,
camera controls and the grid are rendered on the GPU. Context loss is reported
in the viewer and GPU resources are rebuilt when the browser restores WebGL.

Drag or use arrow keys to orbit. Scroll, pinch, or use +/− to zoom. Choose a camera
preset, auto-rotate, toggle wireframe or the ground grid, and reset the camera.
Search filters the catalog; the URL hash links directly to the selected model.

Use **Upgraded model** to switch each model to its detailed refit. The choice is
remembered per model while the page is open, and toggling preserves the camera.
Links such as `#player/upgraded` open an upgraded version directly. Each refit
has a separate file in `models/upgraded/`; `parts.js` provides shared geometry
builders for wings, cockpits, guns and thrusters. Ships face +Z. Statistics and
the source link follow the selected version. Original meshes are unchanged.

Each model is a separate ES module in `models/`, exporting a default object:

```js
export default {
  id: 'my_model', name: 'My model', category: 'Ships',
  description: 'A description.', color: '#8b96a9',
  vertices: [[0,1,0], [-1,0,0], [1,0,0]],
  faces: [[0,1,2]]
};
```

Faces contain vertex indices. Optional `faceColors` assigns a color to each face.
Import new models into `catalog.js` and add them to its array. Use the model ID
as its filename so the source link works. Geometry is centered and fitted to the
viewer automatically without changing the exported vertices.

The initial catalog copies all six enemy meshes from `3dShooter/core.mjs` and
the player hull from `3dShooter/game.js`. These files are independent, editable
snapshots. Flight effects such as exhaust, bullets and particles are not models.

Run checks with `node --test 3dGallery/*.test.mjs`.
Open `webgl.browser-test.html` through the local server to run actual WebGL
pixel checks for depth occlusion and every model in solid and wireframe modes.
