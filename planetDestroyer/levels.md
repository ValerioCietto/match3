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

## Campaign roster

Levels 4–10 retain their concentric layouts. Their HP scales from Cinder so the campaign remains progressively tougher. Round each Cinder layer's HP times the listed scale to the nearest integer; add the listed credit increment to its regular layer reward. These later planets have no gold or core-triggered collapse yet.

| Level | Planet | Exact blocks | Layer boundaries | HP scale | Credit increment | Bonus |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| 1 | Terra | 1,000 | Custom materials | — | — | 200 |
| 2 | Bedrock | 1,200 | Custom materials | — | — | 250 |
| 3 | Cinder | 1,400 | .88 / .71 / .46 / .24 | 1.0 | 0 | 300 |
| 4 | Basalt | 1,600 | .89 / .73 / .49 / .27 | 1.2 | 1 | 350 |
| 5 | Ironheart | 1,800 | .90 / .75 / .52 / .30 | 1.4 | 2 | 400 |
| 6 | Anvil | 2,000 | .91 / .77 / .55 / .33 | 1.6 | 3 | 450 |
| 7 | Crucible | 2,250 | .92 / .79 / .58 / .36 | 1.8 | 4 | 500 |
| 8 | Titan | 2,500 | .93 / .81 / .61 / .39 | 2.0 | 5 | 550 |
| 9 | Obsidian | 2,750 | .94 / .83 / .64 / .42 | 2.2 | 6 | 600 |
| 10 | Last Sun | 3,000 | .95 / .85 / .67 / .45 | 2.4 | 7 | 1,000 |

Boundaries list crust / upper mantle / lower mantle / outer core inner edges. Initial total HP increases each level. Bedrock rewards attacking its poles instead of its armor. These new values need playtesting against weapon upgrades, especially on later planets.

## Generation, progression, and saving

- Generate the exact number of square cells by sorting opposite cell pairs by distance from center, with deterministic tie-breaking. The starting silhouette is connected and centrally symmetric.
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
- All ten starting counts are exact and connected, and total initial HP increases. All twelve weapons continue using the common damage and collision paths.
