# Module shapes

Reusable module geometry, separate from assembled ship presets.

## Jared cockpit — resolution 1/10

- `jared-cockpit-lod1.shape.json`: indexed vertices, triangle faces, smooth vertex normals and cyan material color.
- `jared-cockpit-lod1.gltf`: self-contained glTF 2.0 with embedded geometry and cyan material.

Generated from the blue contours in `../jared1.svg`, using the same section and resolution settings as `jared_3d_lama.html`. The overlapping SVG cabin contours produce one solid of revolution. Eight radial segments and eight longitudinal intervals; duplicate seam/pole vertices are welded and zero-area pole triangles omitted. Result: **58 vertices, 112 triangles** (the preview submits 128 triangles including 16 degenerate pole triangles).

Coordinates use **metres**, **+Y up**, **−Z forward**, with the bounding-box centre at the origin. No hull-relative translation is baked in. The source SVG is scaled to a 100 mm ship width, as in the preview. JSON geometry is a module asset, not a ship project for the editor's Open project button.

To regenerate in the browser console on `jared_3d_lama.html`:

```js
const {exportCockpitShape} = await import('./export-cockpit-shape.js');
const assets = exportCockpitShape(await (await fetch('./jared1.svg')).text());
// Save JSON.stringify(assets.shape, null, 2) and JSON.stringify(assets.gltf, null, 2).
```

## Jared Blockier hull

`jared-blockier.svg` supplies the angular hull silhouette. `jared-blockier.outline.json` stores its centred X/Z polygon, scaled to 3.4 editor units long. The Jared parts library includes **Blockier hull**; it is a hull for flight readiness and statistics. `jaredHullProfile: "blockier"` and `moduleBevel` (0–0.5, default 0.15) persist in project JSON. The bevel chamfers both faces and perimeter; scale, rotation, mirror and color apply to the entire module. Geometry is generated in `../blockier.js`.
