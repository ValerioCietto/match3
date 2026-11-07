# Starship builder

Cargo pods use container-style geometry: corrugated walls and roof, reinforced rails, eight corner blocks, twin doors with locking rods and hinges, identification plates and visibility markings. Details retain the original 1.1 × 0.85 × 1.8 footprint before scaling, so existing placements remain compatible. Body color applies to the panels and ribs; framing and hardware retain accent colors. All details are included in mirrored copies, exports and Test Flight, with volume-based stats recalculated from the detailed mesh.

## Cannon options

Select a Cannon to combine **Barrel** (hexagonal, square, octagonal), **Muzzle** (none, hexagonal, octagonal, square) and **Receiver** (square, beveled square, beveled parallelepiped, cylinder). All 48 combinations are complete assemblies pointing along −Z, with the receiver at the rear. Color, transforms and mirroring apply to the assembly; muzzle trim and the dark bore face retain accent colors. Options update volume-based stats and persist through JSON, glTF/OBJ, duplication and undo/redo. Classic preserves the original cannon geometry for older projects; changing muzzle or receiver automatically activates a hexagonal modular barrel if Classic was selected.

Hull Options includes independent **Upper chamfer** and **Lower chamfer** sliders (0–40%) for the six extruded hull profiles. Each adds a band of beveled faces and insets its cap; the percentage controls the band's share of hull height, with proportional cap inset. They combine with upper-deck taper, update volume-based stats, and persist through saves, JSON/glTF/OBJ exports and undo/redo. Zero preserves the original hull geometry. Like taper, these controls are hidden for the sculpted Research, Swan and Axe hulls.

## Dorsal fin options

Select a Dorsal fin to choose **Classic**, **Swept**, **Shark**, **Delta**, **Clipped** or **Sail**. Adjust additional sweep (−35° to +35°), sideways cant (−45° to +45°), and thickness (0.04–0.4 units before scaling). Sweep and cant keep the root fixed; Scale Y changes height and Z changes length. Options persist through configuration exports, saves, duplication and undo/redo, and update geometry, stats and Test Flight. Existing presets keep the Classic shape until edited.

## Editable configuration export

**Copy JSON configuration**, beside the export controls, copies the current editable project to the clipboard. If the browser blocks clipboard access, a dialog provides selected JSON for manual copying.

Each starting preset now lives in its own file under `presets/`: `fighter.json`, `interceptor.json`, `hauler.json`, `scout.json`, `carrier.json`, `megaCargo.json`, `explorer.json`, `cruise.json`, and `empty.json`. Edit the relevant JSON to update a preset; its `name`, `label`, and `description` populate the editor menu. Each file is also directly importable through **Open project**. `presets.js` imports the files and clones their parts with fresh IDs on every load. Geometry and preset configuration are kept separate.

Click **Export configuration JSON** beneath Ship assembly to download `<ship-name>.starship.json`. It contains the project name and all editable modules, including their shapes, transforms, colors, mirroring and custom hull/wing/cockpit/thruster settings. Use **Open project** in this editor to import the file and continue editing. Import replaces the current assembly and can be undone. **Save project** also downloads compatible editable JSON; glTF and OBJ remain geometry exports.

## Cockpit options

The **Bevel** slider (0–40%) adds actual beveled edges and closed corner faces to any cockpit profile, including the framing. Zero preserves the original mesh. Bevel scales proportionally with each face and is included in configuration files, geometry exports, volume-based stats and undo/redo.

Select a Cockpit in Ship assembly to choose **Capsule**, **Fighter jet canopy**, **Almond shape**, **Industrial diamond**, or **Luxury diamond**, alongside the original Classic cockpit. Capsule is a rounded elongated pod; the canopy has a narrow armored sill; Almond has pointed ends and a raised central ridge; Industrial diamond has heavy structural framing; Luxury diamond has additional facets and gold trim. The complete cockpit follows scale, rotation and mirroring, with surface color applied to the glazing. Shapes persist through saves, duplication and undo/redo, update volume-based stats, and appear in exports and Test Flight.

## Sculpted hulls and complete thrusters

Hull Options also includes **Research ship** (connected spherical laboratories), **Swan** (body, curved neck, head and spread feathered wings, no legs), and **Axe** (a flat double round blade and handle). These are composite solids; the upper-deck taper control is hidden for them. Transform and color controls still apply to the whole hull.

Select an **Engine** in the assembly to open **Thruster Module** options:

- **Drone:** compact octagonal housing and one flared conical exhaust.
- **Reverse drone:** the entire Drone assembly turned 180° for front mounting.
- **Speeder:** elongated housing with two parallel exhausts.
- **Hauler:** broad, tall housing with three exhausts in a triangle.
- **Carrier:** a longer heavy housing with four exhausts in a square.

All five thruster variants have octagonal housings and collars when viewed along Z. Their housings are 40% shorter along Z, with exhausts attached to the shortened rear face; widths, heights and exhaust lengths are preserved. Volume-based stats update accordingly. Changing a thruster profile replaces the complete selected engine mesh, including its housing, collars, bells and exhaust faces. Scaling, rotation and mirroring transform all of it together. Body color changes the housing while exhaust trim keeps its accent colors. Standalone thruster cores are no longer available in the parts library or any preset. Saved projects containing legacy cores still load without losing those parts. New profiles persist in saves, duplicates, undo/redo, exports and Test Flight. Their recommended stats use their full composite volume. The handling sandbox still aggregates engine thrust without simulating individual thrust directions.

## Test Flight

Click **Test Flight** between **Save project** and **Export glTF** to launch the current ship in a modal flight sandbox. The ship uses WebGL rendering against a moving starfield. Arrow keys steer, W/S adjust throttle, and Space brakes; on-screen controls also support touch. Pause, restart, or return with **Back to builder** / Escape. Switching away pauses the simulation. Empty ships cannot launch; ships without propulsion show a message and remain stationary.

Flight uses the recommended full-load acceleration, terminal speed, turn acceleration and turn-rate limit. Throttle sets the target cruise speed; arcade damping eases toward it, with stronger damping for braking. Steering rates accelerate toward their limits. This is a handling preview without combat or collisions. The ship model is fitted to the preview camera, and the design is never edited by flight. Run `node --test 3dStarshipBuilder/flight.test.mjs` for movement checks.

## Example ships

Choose a ship under **Starting point**, then click **Load preset**. Loading is undoable.

| Preset | Layout |
| --- | --- |
| Kestrel / Interceptor | Six small thrusters, four wings in an X configuration, a tapered arrowhead hull and paired cannons. |
| Bastion / Carrier | Four side-facing fighter bays, four defense turrets, shields and paired engines. |
| Mammoth / Mega Cargo | Eight enlarged cargo pods, four fuel canisters and heavy engines around a long box hull. |
| Odyssey / Deep Space Explorer | Four enlarged fuel tanks, oversized engines, shields and a crew cabin. |
| Aurora / Luxury Cruise | Eight enlarged passenger modules (96 passenger equivalents), shields, fuel and gold-trimmed wings. |

These join the original Peregrine fighter, Atlas hauler and Wisp scout. Every preset is made from editable modules and automatically populates the Recommended stats panel.

## Recommended stats

The panel above Ship name recalculates after every edit, import, preset and undo/redo. These are tunable arcade-game recommendations, not a physical flight simulation. The per-volume balance coefficients live in `stats.js` (`moduleRates`). All modules contribute empty mass, hull HP and credits. Engines and thruster cores supply thrust; hulls supply hull repair; shield generators supply shield capacity/regen. Wings supply steering torque and reduce effective turn inertia. Cargo, fuel pods and fighter bays add loaded mass; passengers add 0.1 t per passenger equivalent.

Volume is measured from the closed mesh triangles and multiplied by scale X × Y × Z and the mirrored-copy count. Profile, taper and thickness edits therefore affect stats too. Fighter bay voids are excluded. Intersecting component solids and overlapping modules are counted independently, consistent with kitbash construction rather than a boolean union. Position/rotation do not change stats.

- Acceleration = total thrust / full mass, in m/s².
- Max speed = thrust / (0.08 × full mass + 0.02 × volume), in m/s; this uses an arcade damping model.
- Inertia = total volume. Turn inertia = volume / (1 + 6 × wing volume / total volume).
- Turn acceleration = total steering torque / turn inertia, in °/s². Turn max speed = 12 × square root of turn acceleration, in °/s.
- Mass, HP, regen, thrust, torque and cost are sums of per-volume module contributions. Empty ships report zero for every stat.
- A default-size cannon, turret or fighter bay contributes one corresponding slot; a default passenger module contributes eight passenger equivalents. Their capacities scale with volume. Fractional values remain visible so scaling does not silently round away capacity. A game requiring whole occupants/slots can floor the final total.

Half scale on all axes yields one-eighth of each module's contributions. Derived ship ratios such as acceleration need not fall by the same factor, since both thrust and mass change.

Run `node --test 3dStarshipBuilder/model.test.mjs 3dStarshipBuilder/stats.test.mjs` from the parent folder for geometry, export, volume and balance checks. `browser-test.html` checks the live panel, editing and WebGL rendering.

Run `npm start` from the parent `match3` folder and open http://localhost:3000/3dStarshipBuilder/. No build step or external runtime dependencies. The folder is self-contained and can be served by any static HTTP server.

Native WebGL renders flat-shaded procedural kitbash geometry. Choose a preset, add parts, select an assembly chip, and edit position, rotation, scale, color and X-axis mirroring in the inspector. Drag to orbit; scroll or pinch to zoom. The canvas supports arrow keys, +/−, and 0 to reset. Undo/redo covers modeling, presets and project imports.

Additional blocks: an octagonal turret mount with spherical turret and cylindrical barrel; an open hexagonal fighter bay; a purple air-cylinder fuel pod with rounded ends, straps and valve; a 20-sided shield generator; and a rectangular passenger module with six spherical portholes. The color control changes the main surface while trim and glass retain their accent colors. Both glTF and OBJ/MTL preserve these materials. The fighter bay opening runs along Z and has real inner walls, with no faces covering the opening.

Selecting a Hull opens Hull Options in the inspector: Classic, Arrowhead, Wedge, Box, Diamond and Capsule profiles, plus an upper-deck taper slider for sloped armor. Scale X/Y/Z controls width/height/length. Hull choices are included in undo/redo, duplicates, autosaves, project files and geometry exports. Older projects retain the classic hull shape.

Selecting a Swept wing opens Wing Options: Swept, Straight, Delta, Forward swept, Tapered and Clipped profiles. Additional sweep shifts the tip forward/back (−35° to +35°); dihedral lowers/raises it (−45° to +45°); thickness ranges from 0.04 to 0.6 units before scaling. These controls keep the wing root fixed. Scale X adjusts span and Z adjusts chord. Mirroring creates a matching opposite wing. All options persist in projects, duplicates, undo/redo and exports; older projects retain their original swept wings.

Projects autosave in browser local storage. Save/Open project downloads and restores editable JSON. Export glTF downloads a glTF 2.0 file with an embedded geometry buffer, flat normals, materials and a mesh per part (including mirrored copies). OBJ export downloads both OBJ and MTL; keep them together and allow multiple downloads in your browser. Coordinates are Y-up, −Z-forward; one unit can be treated as one meter. Display fitting does not change export dimensions.

Parts are separate intersecting solids, not a boolean-unioned mesh. No UVs, textures, collision meshes, rigs or LODs are generated. Imports accept up to 150 parts and 1 MB. Save important work to a project file; browser storage can be cleared.

`node --test 3dStarshipBuilder/model.test.mjs` from the parent folder checks mirrored geometry, export buffers, normals and project validation. The renderer and its geometry helpers were adapted from this repository's 3D Gallery.
