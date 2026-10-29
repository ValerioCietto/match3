# Mobile demo and control proposals

Open `game-mobile.html` through the same local web server as the desktop demo. It loads `game-mobile.js` and shares `weapons.json`. All ten planets, sixteen weapons, upgrades, Galaxy replays, and growth mechanics are included. Mobile has its own local save (`planetDestroyer.mobile.v1`), so desktop progress is not overwritten. The mobile script is a separate copy of the simulation; future gameplay changes must be applied to both scripts.

## Implemented controls

- Left thumbstick: analog movement with a small dead zone.
- Touch or drag anywhere in the arena: aim at that world position and fire while held. This preserves precise mortar and nuke destinations.
- Hold FIRE: fire at the last aimed position without covering the arena.
- Auto fire: keep firing after releasing your fingers; tap again to stop.
- Galaxy, Pause, and Armory: large touch buttons. Loadout and material details are in the pause screen.

Both portrait and landscape work. Landscape gives the arena more width, with controls outside its edges. Pointer capture supports moving and aiming simultaneously. Releasing, canceling touches, opening menus, rotating, or leaving the app clears touch input. Keyboard controls remain available. Rendering caps pixel density at 1.5 to reduce mobile GPU load.

## Alternative control proposals

| Scheme | How it works | Benefit | Tradeoff |
| --- | --- | --- | --- |
| Twin sticks | Left stick moves; right stick aims and fires in a direction. | Comfortable continuous combat; thumbs stay in fixed locations. | Mortar/nuke targeting needs a separate distance control or tap override. |
| One-hand auto-target | One floating stick moves; weapons automatically aim at the nearest block. | Easiest portrait play; good for short sessions. | Less control over weak points and explosive destinations; energy weapons need care on Last Sun. |
| Tap destination | Tap a flight destination; drag a reticle to aim; toggle auto fire. | Less continuous thumb pressure. | Needs obstacle-aware navigation so the ship does not get stuck on solid blocks. |
| Aim stick + cruise | Right stick aims/fires; swipe the ship's course and keep moving until stopped. | Frees a thumb and suits orbital movement. | Harder to brake precisely around turrets or narrow tunnels. |

Recommended next experiment: **twin sticks with a tap-to-target override** for mortar and nukes. The alternatives above are proposals, not implemented modes.
