# Planet Destroyer — Planet Levels

The campaign contains ten planets. Terra, Bedrock, and Cinder now have distinct materials and mechanics. These specifications replace the original shared 1–10 HP model. Terra still starts with exactly 1,000 square blocks arranged in a circle.

## Terra — blue planet

1,000 blocks with a blue hue. Damage transitions through red/orange to a yellow destruction flash.

| Material | Region | HP | Credits | Behavior |
| --- | --- | ---: | ---: | --- |
| Gas | Outermost one block of radial depth | 1 | 1 | Destructible; ship can pass through it |
| Crust | Next two blocks of radial depth | 4 | 2 | Solid and stationary |
| Mantle | Below crust, outside core | 6 | 3 | Liquid; settles inward every second |
| Core | Inner 27% of the original radius | 20 | 6 | Solid; destroy every core block to collapse Terra |

Depth is measured inward from the farthest starting block center, in units of the 16-unit block size. Circular layer boundaries are stepped on the square grid. Both crust layers have 4 HP per block.

### Liquid compaction

Once per second of active gameplay, surviving mantle blocks are processed from the inside outward. Each can move one adjacent grid cell into a vacant position strictly closer to the original center. Diagonal movement is allowed. Surviving blocks obstruct flow: liquid cannot teleport through crust or core, duplicate, regenerate, or enter the ship's collision area. Moving blocks retain their HP, identity, material, and reward.

Pause and the armory stop the compaction timer. Positions, damage, and partial tick progress are saved. Excavated cavities draw liquid inward on subsequent ticks.

### Core collapse

The HUD tracks surviving core blocks. Destroying the last one triggers a 1.4-second implosion: surviving material contracts into the center, then all remaining blocks clear. Each pays its normal reward once, followed by the 200-credit first-clear bonus. Collapse progress survives reloads; rewards cannot repeat. Reduced-motion mode fades the planet instead of shrinking it.

The core radius, rewards, and animation duration are implementation balance choices; the material HP and core destruction condition are requirements.

## Bedrock — red shell, blue poles

1,200 blocks. A red, solid shell is five blocks deep, with visibly blue weak regions at both poles.

| Material | Region | HP | Credits | Behavior |
| --- | --- | ---: | ---: | --- |
| Shell | Outermost five blocks of radial depth | 50 | 6 | Solid and stationary |
| Polar weaknesses | Both caps through the shell's full depth | 5 | 3 | Solid blue entry routes |
| Core | Entire interior below the shell | 30 | 8 | Solid and stationary |

The polar caps extend 20 degrees to either side of the vertical axis. Cap width and rewards are balance choices. Every other shell block has 50 HP; every interior core block has 30 HP.

Destroy all core blocks to trigger a 1.4-second inward crumble. The surviving shell clears and pays its normal rewards once, followed by a 250-credit first-clear bonus. There is no need to manually destroy the remaining armored shell. Reduced-motion mode removes crumble jitter and uses a fade. No material settles before collapse.

## Cinder — ash and gold

1,400 blocks with an ash-grey hue. HP and regular rewards increase inward. These values are initial balance choices because exact Cinder HP and regular rewards were not specified:

| Material | Normalized radius | HP | Credits |
| --- | --- | ---: | ---: |
| Ash crust | 0.88 < r <= 1.00 | 15 | 2 |
| Upper mantle | 0.71 < r <= 0.88 | 30 | 4 |
| Lower mantle | 0.46 < r <= 0.71 | 60 | 6 |
| Outer core | 0.24 < r <= 0.46 | 90 | 8 |
| Inner core | 0.00 <= r <= 0.24 | 120 | 12 |

Exactly **100 existing blocks** are chosen randomly without replacement as gold deposits. They are included in the 1,400 total, not added on top. They have a gold tint, bright border, and center glint. Each retains the HP of its layer but awards **exactly 10 credits**, replacing the ordinary layer reward. Gold can occur anywhere, including the core.

A saved campaign seed controls placement. Reloads retain deposit positions and damage; a new campaign creates a new arrangement. Cinder is solid and has no compaction or core-collapse mechanic. Clear every block for its 300-credit first-clear bonus.

## Basalt — defended crust and liquid interior

1,600 blocks. The outer **two radial block layers have 100 HP**; every interior block is **10 HP liquid**. There is no solid core. Destroying every liquid block triggers a 1.4-second inward collapse that clears the remaining crust and turret mounts. Collapsed blocks award their normal credits once, followed by the 350-credit first-clear bonus. The HUD tracks surviving liquid blocks; both the objective and an in-progress collapse survive reloads. Liquid settles inward into neighboring empty cells once per active second using Terra's compaction rules. Crust blocks pay 8 credits, liquid blocks pay 4, and the first-clear bonus is 350 credits; these rewards are initial balance choices.

Exactly **30 laser point-defense turrets** are evenly distributed around the outer crust. Each is attached to a different existing crust block, without adding blocks to the planet count. Destroying that 100 HP mount disables its turret permanently; targeting a mount shows its label in the HUD. Turrets are drawn above the surface and fire red interception beams. The HUD displays remaining defenses.

Each active turret neutralizes one attack within 150 world units, then recharges for 0.35 seconds. Surviving terrain obstructs its line of sight, except its own mount. Fast attacks are checked across their traveled path. Turrets can intercept double parallel shots, shotgun pellets, orbiting buzzsaws, mortar shells, yoyos, boomerangs, railgun beams, guided missile flurries, piercing nukes, and mining drones. Intercepted missiles and shells vanish without exploding; blocked railgun beams do no damage. Buzzsaws redeploy after one second. Shot-down mining drones disappear for three active seconds before rebuilding near the ship. These range, recharge, and recovery times are initial balance choices.

Guided laser and chain lightning are not intercepted. They can destroy turret mounts, while volleys can also exhaust the finite interception capacity. Turrets do not attack the player ship. Turret mounts, block damage, liquid positions, and recharge progress survive saving. Earlier unfinished Basalt saves rebuild with the new geometry while retaining equipment and credits.

## Campaign roster

The later planets use their custom material, defense, and objective rules below. Basalt uses the rules above; Obsidian has optional moons, and Last Sun has a growing liquid core.

| Level | Planet | Exact blocks | Layer boundaries | HP scale | Credit increment | Bonus |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| 1 | Terra | 1,000 | Custom materials | — | — | 200 |
| 2 | Bedrock | 1,200 | Custom materials | — | — | 250 |
| 3 | Cinder | 1,400 | .88 / .71 / .46 / .24 | 1.0 | 0 | 300 |
| 4 | Basalt | 1,600 | Two-layer crust / liquid inside | Custom | Custom | 350 |
| 5 | Ironheart | 1,800 | City crust / hex sector walls / contained liquid | Custom | Custom | 400 |
| 6 | Anvil | 2,000 | Regenerating shell / reflective liquid / defended core | Custom | Custom | 450 |
| 7 | Turtle | 1,990 | Five-layer shell / two-layer hollow / core | Custom | Custom | 500 |
| 8 | Chaos | 2,500 | Random Turtle / liquid / gold mix | 1–250 by depth | Custom | 550 |
| 9 | Obsidian | 2,750 + 600 optional | Scattered liquid + two moons | 10–50 liquid / 50 moons | 8 | 600 |
| 10 | Last Sun | 3,000 initially, grows | 300 liquid core + 2,700 liquid | 150 core / 50 liquid | 12 core / 6 liquid | 1,000 |

Boundaries list crust / upper mantle / lower mantle / outer core inner edges. Basalt's difficulty comes from point defense rather than increased total HP: its soft interior gives it less total HP than Cinder. Bedrock rewards attacking its poles instead of its armor. These values need playtesting against weapon upgrades, especially on later planets.

## Ironheart — civilization to the center

Exactly 1,800 destructible square blocks form a developed world with a honeycomb of **hexagonal sectors throughout the interior, including the central region**. The squares remain the damage/collision units; hexes are structural compartments built from those squares. City lights and teal industrial walls make the developed layers visible throughout its depth. There is no natural core that can trigger a planet-wide collapse: every block must be cleared.

| Material | Layout | HP | Credits |
| --- | --- | ---: | ---: |
| City crust | Two outer radial block layers | 200 | 10 |
| Hex sector walls | Very hard boundaries of interior hexagonal compartments | 250 | 12 |
| Sector liquid | Contained inside each compartment | 15 | 5 |

These HP/reward values and the two-cell crust are initial balance choices. Hexes use a 72-world-unit side length, with rasterized boundaries thick enough to separate adjacent liquid cells even diagonally. The crust seals sectors clipped by the circular surface. Full sectors cannot move while packed; after excavation, liquid settles inward once per active second, preserving HP and identity. Intact walls obstruct flow; breaking a wall can connect neighboring compartments. There is no automatic wall repair or liquid regeneration.

Exactly **six point-defense turrets** are spaced around the outer crust on distinct city-crust mounts. Their interception range is **320 world units**, compared with Basalt's 150. Faint range rings show their larger coverage. They retain Basalt's 0.35-second recharge, terrain line-of-sight checks, interception list, and drone/buzzsaw recovery behavior. Guided laser and chain lightning bypass interception. Destroying the 200 HP mount disables the turret.

The first-clear bonus is 400 credits. Saves retain sector damage, liquid positions, disabled mounts, and turret recharge. Older unfinished Ironheart saves rebuild the planet once with its new layout, retaining equipment and credits. Ironheart has more initial HP than Anvil; balance should compare defenses, regeneration, and clear times rather than require strictly increasing total HP.

## Anvil — regeneration, reflective liquid, and core defenses

Exactly 2,000 blocks. The three outer radial layers form a **10 HP shell that regenerates 10 HP per second**. Only surviving shell blocks heal, up to their 10 HP maximum; destroyed blocks never regrow. Regeneration runs in active simulation time and stops while paused or in the armory. Damage colors cool as HP recovers.

| Material | Region | HP | Credits | Behavior |
| --- | --- | ---: | ---: | --- |
| Regenerative shell | Three outer radial block layers | 10 | 4 | Heals 10 HP/s while alive |
| Reflective liquid | Between shell and core | 10 | 5 | Settles inward each second and deflects physical projectiles |
| Fortified core | Inner 28% of the original radius | 80 | 10 | Solid; carries eight defense turrets |

Mantle/core HP, core radius, and rewards are initial balance choices. Clear every block for a 450-credit first-clear bonus; destroying the core does not clear the shell automatically.

### Reflective mantle

Liquid reflects double shots, shotgun pellets, guided missiles, and piercing nukes at the contacted block face without impact damage. Reflected guided missiles continue along the reflected heading instead of immediately homing back. A reflected nuke's destination changes with its deflected heading; it keeps its remaining travel allowance and detonates at the new endpoint. Drilling cannot bypass the liquid, even after the nuke uses up its drill allowance.

Mortars landing on liquid rebound outward as physical shells instead of detonating into it; a subsequent solid impact can explode. Yoyo and boomerang blades turn back on liquid contact. Beam weapons, lightning, and buzzsaw contact remain ways to excavate the mantle. Reflections preserve remaining range and are capped at six to prevent endless bouncing. These reflected player attacks do not damage the ship.

### Eight core turrets

Exactly eight turrets are evenly spaced around the core perimeter on distinct 80 HP core mounts. They have two independent systems:

- **Interception laser:** destroys incoming projectile-based attacks using the existing point-defense rules, 600-unit range, 0.35-second recharge, and terrain line of sight. Guided laser and chain lightning bypass interception. Intercepted missiles/shells do not explode.
- **Pushback wave:** fires only if the ship is within 600 units and the path to it is clear of surviving terrain, ignoring the turret's own mount. The visible violet wave travels at 260 units/s and has a 1.6-second firing cooldown. It does not home. Terrain blocks the traveling wave. Contact pushes the ship along the outgoing wave direction, moving it up to 84 units plus a velocity impulse; collision checks prevent pushing through blocks or outside the arena. A wave hits once, then disappears. It does not deal ship damage.

Wave speed, cooldown, and push strength are initial balance choices. Turrets are initially buried behind mantle and shell; excavating sight lines exposes their offensive capability. Destroying a mount disables both systems. Existing fired waves finish traveling. Pause freezes waves and recharge.

Saving preserves block HP, liquid positions, destroyed mounts, and both turret cooldowns. Reload does not grant offline healing; transient waves are cleared like other projectiles. Older unfinished Anvil saves rebuild once with the new materials while retaining credits and equipment.

## Last Sun

The final planet is entirely liquid: **300 core blocks at the center and 2,700 ordinary liquid blocks** initially. Initial balance is 150 HP / 12 credits per core block and 50 HP / 6 credits per normal block. All blocks are immune to plague, including direct snow contact, spread, and restored infections.

Energy hits heal the struck block by the damage they would otherwise deal, capped at its maximum HP; destroyed blocks never revive. Energy weapons are guided laser, chain lightning, mining-drone lasers, and Shockwave. Railgun, projectiles, explosions, and blades still deal damage normally. Shockwave still pushes liquid even when its energy heals it.

Every second, each living core makes two independent rolls: **1% to spawn a core block**, **5% to spawn a normal liquid block**. Newly created cores start rolling the following second. Each successful roll picks a random outward grid direction, inserts the new block adjacent to the source, and pushes the entire occupied line one cell outward to create room. Growth stops at the arena boundary or a ship obstruction rather than overlapping blocks or the ship. Last Sun expands instead of compacting inward automatically.

At most **1,000 living core blocks** may exist simultaneously; normal liquid growth can continue at the cap. Destroyed cores stop reproducing. Core and normal blocks both remain liquid. Clear every surviving block to finish; destroying the core alone stops growth but does not collapse the remaining liquid. The first-clear bonus is 1,000 credits.

Saves and Galaxy visits preserve added blocks, displaced positions, damage, the fractional growth timer, and deterministic random state. The dynamic block count updates progress. Older Last Sun saves rebuild with the new materials and retain equipment and credits. HP, healing amount, credits, and bounded outward insertion are initial implementation choices.

## Obsidian

Obsidian has **2,750 violet liquid blocks**, randomly scattered with increasing density toward the center. Seeded weighted sampling favors inner cells while preserving the exact count; gaps are actual empty space. Each block has a seeded random integer maximum HP from **10 to 50**, regenerates **10% of its maximum HP per second** while alive, and pays 8 credits. Liquid settles inward once per second; its HP cap does not change when it moves.

Two stationary, separate moons flank the main planet:

| Moon | Blocks | Point-defense turrets |
| --- | ---: | ---: |
| Small | 200 | 4 |
| Large | 400 | 6 |

Moon blocks use Turtle material: 50 HP, reflection (railgun can pierce), and 5 HP regeneration every 0.1 seconds. They pay 8 credits. Turrets have 320-unit range and use the existing interception rules; destroying their mount disables them. Moons are optional and have no collapse objective. **Destroying all 2,750 liquid blocks wins immediately, even with both moons intact.** Progress measures the liquid body only. Surviving moons do not award free destruction credits; the first-clear bonus remains 600 credits.

The 3,350-block layout, HP, damage, moon mounts, and settled liquid positions survive saves and Galaxy visits. Older Obsidian saves rebuild using the new design while preserving equipment and credits. Density curve, rewards, moon positions, and turret range are initial balance choices.

## Galaxy travel and replays

The Galaxy selector lists all ten planets. Completed planets can be rebuilt and replayed; the next campaign planet unlocks after clearing its predecessor. Unfinished destinations resume their saved block damage, liquid positions, infection, regeneration timers, and turret cooldowns. Equipment and credits are shared across visits. Replays award normal block credits but never repeat the first-clear bonus. Finishing a replay offers the Galaxy selector to choose where to go next.

## Chaos (formerly Titan)

The eighth planet has 2,500 blocks randomly mixed throughout its circular footprint. Each block has a 40% chance of being a Turtle block, 40% liquid, and 20% gold. These proportions are initial balance choices. Generation uses the campaign seed, so reloading preserves material identities.

All three materials start with HP increasing linearly by radial depth: 1 HP at the outermost block centers, up to 250 HP at the innermost block centers, rounded to whole HP. Turtle blocks reflect projectiles (railgun pierces) and regenerate 5 HP every 0.1 seconds, capped at their individual maximum. Liquid compacts toward the center once per second and retains its original HP cap when moving. Gold is solid and awards 10 credits; Turtle and liquid blocks award 8 and 5 respectively.

Destroy all liquid and gold blocks to collapse Chaos: once only Turtle blocks remain, the standard 1.4-second collapse clears them and awards their block credits. Chaos has no turrets. The first-clear bonus is 550 credits, paid once even on Galaxy replays. The HUD tracks surviving liquid and gold blocks. Saves restore the objective from surviving materials and resume an interrupted collapse; existing Chaos saves already containing only Turtle blocks collapse on load. Old unfinished Titan saves rebuild as Chaos while preserving equipment and credits.

## Turtle (formerly Crucible)

The seventh planet is renamed **Turtle**. Its original 2,250-cell circular footprint now contains **1,990 destructible blocks and 260 genuinely empty cells** forming the hollow separation. Empty cells are absent from collision, rewards, progress counts, and plague contact.

| Region | Depth inward from original surface | HP | Behavior |
| --- | --- | ---: | --- |
| Reflective shell | First five radial block layers | 50 | Heals exactly 5 HP every 0.1 seconds while alive; reflects physical projectiles |
| Hollow gap | Next two radial block layers | — | Empty space; no blocks or infection bridge |
| Core | Everything deeper than seven block widths | 10 | Solid, no regeneration; carries ten defense turrets |

Healing is discrete, not a continuous 50 HP/s approximation. It caps at 50 HP and never recreates destroyed shell blocks. Pause freezes the tick timer; saves preserve its partial progress. Railgun rays pierce and damage shell blocks normally, while conventional shots, missiles, nukes, and thrown blades encounter the existing reflection rules. Core defenses can still intercept railgun attacks when the actual beam path enters their coverage.

Exactly ten turrets are evenly spaced around the core perimeter, each mounted on a different 10 HP core block. Initial defense tuning uses the existing interception laser, 320-unit range, and 0.35-second recharge, with no pushback waves. Destroying a mount disables its turret. Turrets do not create block contacts across the gap.

Plague can spread within either region, but cannot jump the hollow gap because shell and core blocks do not share edges. Independently delivered plague particles can still infect the core through a breached shell; this is direct infection, not spread across empty space.

Destroy every core block to trigger the standard 1.4-second collapse, clearing the surviving shell and all turret mounts. Shell blocks pay 8 credits and core blocks pay 5; collapse awards remaining rewards and the 500-credit first-clear bonus once. Reward values and turret tuning are balance choices. Save/reload preserves damage, regeneration ticks, disabled turrets, and in-progress collapse. Existing unfinished Crucible saves rebuild as Turtle while retaining equipment and credits.

## Generation, progression, and saving

- Generate the circular footprint by sorting opposite cell pairs by distance from center, with deterministic tie-breaking. Starting silhouettes are centrally symmetric. Turtle then removes its two-layer hollow band, leaving a connected shell and a separate connected core.
- Cell centers are `(i + 0.5, j + 0.5)` times 16 world units. Material is assigned at generation, never recalculated after liquid movement.
- Larger planets expand the arena and fit the camera, keeping flight clearance around the body.
- Credits, equipment, and upgrades carry forward. Clearing each planet unlocks the next; level 10 ends the campaign.
- Every block and first-clear bonus pays once. Collapse cleanup uses the normal material reward rules.
- Saves include campaign seed, block HP and positions, compaction timing, collapse progress, and paid bonus IDs.
- Older demo saves keep credits, equipment, and current level, but rebuild an unfinished planet with the new materials. Already cleared planets remain cleared. A notice explains the migration.

## Acceptance checks

- Terra starts with 1,000 blocks: one 1 HP gas layer, two 4 HP crust layers, 6 HP liquid mantle, and 20 HP solid core.
- Liquid moves inward only on one-second ticks, respects occupancy and ship collision, and preserves identity, damage, and positions across reloads.
- Bedrock has a five-cell radial shell: 50 HP red material, 5 HP blue polar routes, and a 30 HP solid interior core.
- Only destroying the entire core triggers collapse. It clears surviving material and pays rewards exactly once, including across reloads.
- Cinder contains exactly 100 seeded gold deposits; each pays 10 credits exactly once.
- Basalt has exactly 30 unique turret mounts, a two-layer 100 HP crust, and a 10 HP liquid interior. Every listed intercepted weapon is neutralized before damage, turrets recharge, destroyed mounts stay disabled, and drones cannot instantly bypass their rebuild delay.
- Ironheart has 1,800 blocks, enclosed hex liquid sectors to the center, 200 HP city crust, 250 HP sector walls, 15 HP liquid, and six 320-unit defense turrets. Sector walls remain fixed; liquid positions and disabled mounts persist across reloads.
- Anvil has a three-layer 10 HP shell healing at 10 HP/s without resurrection, reflective liquid, and eight core turrets. Waves require clear sight and 600-unit range, push without crossing solid terrain, and are consumed on impact. Projectile reflection causes no liquid impact damage; shot-down missiles never explode. Saves retain shell damage and both defense cooldowns.
- Turtle has five reflective 50 HP shell layers healing 5 HP per 0.1-second tick, a real two-layer hollow gap, a non-regenerating 10 HP core, and ten core turrets. Plague cannot spread across the gap; railgun pierces the shell; destroying the whole core collapses the remainder exactly once.
- Starting counts follow the roster; Turtle intentionally has two disconnected material regions. Total HP need not rise strictly between custom planet types. All thirteen weapons use the common damage and collision paths.
