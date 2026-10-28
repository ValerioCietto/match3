# Planet Destroyer — Game Design

Status: initial design, before implementation.

Revision: planet-specific materials and completion rules in [levels.md](levels.md) supersede the original shared layer table below. Terra now has blue gas/crust/liquid mantle and a 20 HP core; Bedrock has a red 50 HP shell, blue 5 HP poles, and a 30 HP core. Both collapse when their entire core is destroyed. Cinder is ash grey with increasing HP/rewards and exactly 100 gold deposits worth 10 credits each. Later planets scale from Cinder. The original 1–10 HP cap and universal clear-every-block requirement no longer apply.

Playable demo: [game.html](game.html), with logic in `game.js` and weapon data in `weapons.json`. For this demo, the upgrade page is an in-game paused armory screen. See [README.md](README.md) for launching and checks. The proposed multi-file structure below remains a future organization option.

## Concept

A small neon spaceship dismantles a planet built from approximately 1,000 destructible square blocks. Fly around it, carve tunnels through its layers, and combine three weapons to turn an intact black sphere into glowing rubble. Earn credits from destruction and spend them on new weapons and upgrades on a dedicated upgrade page.

The visual reference is classic Asteroids: a dark starfield, a crisp outlined ship, bright projectiles, and readable arcade effects. The planet is the main target and the centerpiece of the screen.

## Scope and assumptions

- Desktop browser game using Canvas 2D and plain JavaScript, fitting the existing static-site repository.
- The campaign has 10 planet levels of increasing difficulty, specified in [levels.md](levels.md). Level 1 is a normal circular planet containing exactly 1,000 blocks.
- Weapon base statistics and available upgrades live in [weapons.json](weapons.json), shared by gameplay and the upgrade page.
- WASD moves the ship; the mouse aims independently. These are proposed control details where the request leaves room for interpretation.
- Hold Space to fire all equipped weapons; toggle automatic fire with F or a HUD button.
- Up to three distinct weapons can be equipped. Each has an independent cooldown.
- First release focuses on satisfying destruction and equipment combinations. Enemy ships, ship health, fuel, ammunition, and timed failure are outside the initial scope.
- Weapon statistics and prices below are starting values for playtesting, not fixed balance requirements.

## Core loop

1. Start with a double parallel shot equipped and a fresh planet.
2. Fly around the planet, shoot exposed blocks, and excavate toward its tougher interior.
3. Receive credits immediately when a block is destroyed.
4. Open the upgrade page at any time to buy weapons, improve them, and change the three-slot loadout. Gameplay pauses and progress is preserved.
5. Resume the same planet with the new equipment.
6. Destroy the entire core on Terra or Bedrock, or every liquid block on Basalt, to collapse the planet; clear every block on the other planets. Receive the planet's completion bonus.
7. Launch the next unlocked planet, retaining credits, purchases, and loadout. Completing level 10 finishes the campaign.

The first version has no loss condition. Its challenge is choosing positions and combinations that clear a planet efficiently. The ten levels increase block count and material HP, with liquid compaction, polar weaknesses, and gold deposits giving early planets distinct mechanics. See `levels.md` for authoritative generation, material HP, rewards, progression, and difficulty targets.

## Flight and controls

The **Galaxy** button opens a paused destination selector, also reachable from pause and completion screens. Completed planets can be replayed with the current loadout and shared credits. Each unfinished visit keeps its damage, material positions, infection, and timers when switching planets or reloading. Replays pay normal block rewards, with first-clear bonuses awarded once per campaign. Unvisited planets unlock by clearing their predecessor.

| Input | Action |
| --- | --- |
| W / A / S / D | Accelerate up / left / down / right relative to the screen |
| Mouse | Aim the ship and directional weapons |
| Space, held | Fire every equipped weapon as its cooldown allows |
| F or AUTO button | Toggle continuous firing |
| U or UPGRADES button | Pause and open the upgrade page |
| Escape | Pause or resume |

Diagonal movement is normalized. Gentle drag and a speed cap give flight a little inertia without making positioning difficult. The ship faces its aim direction, independently of movement. Until the mouse moves, aim points toward the planet center.

The entire planet and surrounding flight space fit in a fixed world viewed through a responsive, letterboxed canvas. The ship stays inside the arena. Surviving planet blocks are solid: collision slides or gently pushes the ship away without damage. Cleared tunnels are navigable if wide enough for the ship. No gravity or screen wrapping in the first version.

Opening menus or losing window focus pauses simulation and clears held inputs. Space must not scroll the page during gameplay. Controls are inactive while interacting with upgrade-page buttons.

## Planet construction

Last Sun is an all-liquid growing planet with 300 initial central core blocks and 2,700 normal blocks. Energy attacks heal both materials, and plague cannot infect them. Each living core independently rolls every second for 1% core reproduction and 5% normal-liquid reproduction, inserting outward and displacing occupied blocks. Core population is capped at 1,000 living blocks; victory requires clearing all liquid. Dynamic topology, growth timing, and randomness persist in saves and Galaxy visits. See `levels.md` for weapon classification and initial balance.

Obsidian has 2,750 seeded, randomly scattered violet liquid blocks with density increasing inward, random 10–50 maximum HP, and regeneration of 10% maximum HP per second. Two optional stationary Turtle-material moons have 200 blocks with four turrets and 400 blocks with six turrets. Destroying the liquid body completes the level regardless of surviving moons; progress and Galaxy completion use that objective. See `levels.md` for layout, regeneration, rewards, and save migration details.

Level 8 is **Chaos**, replacing Titan: 2,500 seeded random blocks, mixing Turtle-style reflective regenerating solids, liquid, and gold. HP increases linearly from 1 at the surface to 250 at the center for every material. Turtle blocks heal 5 HP per 0.1 seconds; liquid settles once per second. See `levels.md` for mix probabilities, rewards, and save migration.

Level 7 is now **Turtle**, replacing Crucible: five reflective shell layers with 50 HP and discrete 5 HP healing every 0.1 seconds, two genuinely empty radial layers, and a non-regenerating 10 HP core defended by ten turrets. Railgun pierces the shell. The gap prevents contact-based plague spread. Destroying the entire core triggers collapse. The former 2,250-cell footprint now contains 1,990 destructible blocks after removing the hollow band. See `levels.md` for rewards, turret tuning, migration, and regeneration timing.

Anvil now uses `levels.md`'s custom layout: three 10 HP shell layers regenerating 10 HP/s while alive, reflective 10 HP liquid mantle, and an 80 HP core with eight turrets. Core turrets combine projectile interception with visible pushback waves requiring clear sight and a ship within 600 units. Regeneration never resurrects destroyed blocks. All blocks must be cleared; see `levels.md` for reflection, wave collision, tuning, and persistence rules.

Ironheart's current design is a fully developed 1,800-block world: a two-layer 200 HP city crust surrounding a honeycomb of 250 HP hex-sector walls and 15 HP liquid compartments, extending to the center. Six surface turrets use 320-unit range. The planet uses square destructible cells to construct hexagonal sector boundaries, city-window details, and one-second liquid settling. No core collapse; all blocks must be cleared. These material values are initial balance choices. `levels.md` contains generation and persistence requirements.

Basalt now uses the authoritative custom layout in `levels.md`: 30 point-defense turrets on unique crust mounts, two 100 HP crust layers, and a 10 HP liquid interior. It has no collapse core: destroying every liquid block triggers collapse, clears the remaining crust and turret mounts, and pays their normal rewards exactly once. Defenses intercept the listed physical weapons and railgun beams, destroy drones temporarily, and can be disabled by destroying their mount. Guided laser and chain lightning bypass interception. See `levels.md` for range, recharge, recovery, and save behavior; these supersede Basalt's original generic layers.

Use a square grid with a circular silhouette. Level 1 contains exactly 1,000 cells, selected by distance from the planet center with deterministic boundary tie-breaking as specified in `levels.md`. A proposed cell size is 16 world units, making the first planet approximately 576 units across in a 1,200 × 900 world. Larger levels expand the world and fit the camera to preserve surrounding flight space.

Each block stores its stable ID, grid position, material, phase, reward, color tint, core membership, maximum HP, and remaining HP. Material is assigned at generation. Liquid movement preserves it and its damage. The following table documents the original prototype only; use `levels.md` for the current values.

| Layer | Normalized radius | HP per block | Credits per destroyed block |
| --- | --- | ---: | ---: |
| Crust | 0.85 < r ≤ 1.00 | 1 | 1 |
| Upper mantle | 0.65 < r ≤ 0.85 | 3 | 2 |
| Lower mantle | 0.40 < r ≤ 0.65 | 5 | 3 |
| Outer core | 0.20 < r ≤ 0.40 | 7 | 4 |
| Inner core | 0.00 ≤ r ≤ 0.20 | 10 | 6 |

Solid blocks remain fixed. Terra's liquid mantle settles inward once each second into adjacent vacant cells, avoiding the ship. Detached islands remain targets until destroyed or cleared by core collapse. Debris is cosmetic and cannot block shots or award credits.

On Terra and Bedrock, destroying the entire core starts an animated implosion/crumble that clears and rewards the remaining blocks exactly once. Basalt collapses when its last liquid block is destroyed. Other planets require every block to be destroyed. Completion awards the level's bonus once; Terra awards 200 credits. See `levels.md` for details.

## Damage and color

Intact blocks use their planet/material hue: blue Terra, red Bedrock with blue poles, ash-grey Cinder with gold deposits. Damage blends from that base tint into red/orange and bright yellow. Color changes represent permanent damage, not temporary heat. The black start below is the original prototype palette; material tint now replaces its 0% stop.

Compute damage fraction as `1 - remainingHP / maximumHP`, clamped to 0–1. Interpolate through these stops:

| Damage fraction | Color |
| --- | --- |
| 0% | Black, `#050508` |
| 25% | Dark red, `#591018` |
| 50% | Red-orange, `#D43A12` |
| 75% | Orange, `#FF9500` |
| 100% | Bright yellow, `#FFF36A` |

A destroyed block immediately stops participating in collision, then flashes bright yellow and emits short-lived fragments. This flash makes 1 HP crust blocks visibly reach yellow even though they die in one hit. Damaged blocks retain their color; they do not regenerate.

Every damage source uses one shared damage function. It ignores already destroyed blocks, clamps HP at zero, and awards destruction credits only once. Fractional damage is permitted for continuous-contact weapons.

## Weapons

**Shockwave** emits a circular thunder ring from the ship's launch position. Each block is hit once as the expanding front crosses its square, regardless of intervening material, reflection, or point defense. Let `c` be the dot product of the normalized propagation direction (origin to block) and local outward radial direction (center to block). Damage is `baseDamage * 2^c`: 2× outward, 1× perpendicular, 0.5× inward, smoothly interpolated. At an undefined direction, use 1×.

Initial balance in `weapons.json`: 8 base damage, 1.5-second cooldown, 300 units/second expansion, 240 range. Each upgrade adds 80 range, reaching 560 at level 5; damage and cooldown remain fixed. Unlock costs 750 credits; upgrades cost 1,000 / 2,500 / 5,000 / 10,000. Surviving liquid is pushed up to two grid cells along the dominant propagation axis, stopping at other blocks or the ship. Liquids may move up to 96 units beyond the initial planet radius and later settle inward. Positions persist in saves and Galaxy visits; airborne rings are transient. Reduced motion keeps a simple ring without flickering lightning.

`weapons.json` is the authoritative balance data. Each entry contains a stable `id`, display name, `behavior` registry key, unlock cost, `baseStats`, and an `upgrades` array listing every available upgrade's target level, cost, and stat modifiers. JavaScript supplies behavior implementations only; gameplay and the store load the same JSON rather than duplicating statistics or upgrade lists.

Upgrade modifiers are cumulative: `add` adds to the current stat and `multiply` multiplies the current stat. Apply purchased upgrades in ascending level order. Damage upgrades add 25% of level-1 damage each time; timing upgrades multiply the relevant interval by 0.92. Milestone bonuses are explicit entries in each weapon's upgrade, not hard-coded weapon-name checks. Units are seconds, world units, and degrees. Validate unique IDs, known behavior keys, sequential upgrade levels, nonnegative costs, and valid numeric stats before starting play. Invalid data shows a loading error instead of silently using different defaults.

All weapons use unlimited ammunition. Firing activates each equipped weapon according to its own cooldown. Directional weapons use the current aim at launch. Existing shots and returning weapons finish their motion after the trigger is released; no new attacks start until firing resumes.

| Weapon | Initial behavior | Initial timing and damage | Role |
| --- | --- | --- | --- |
| Shotgun | Seven pellets in a 36° cone; each stops at the first block; short range | 1 damage per pellet, volley every 0.65 s | Strip crust and widen openings |
| Double parallel shot | Two parallel projectiles from separated ship-side muzzles, without spread | 1 damage per projectile, pair every 0.22 s | Reliable starting weapon and narrow excavation |
| Chain lightning | Acquire the nearest exposed block in a 500-unit aim cone; arc to up to four nearby surviving blocks | 2 damage per target, discharge every 0.65 s | Clear connected clusters |
| Orbiting buzzsaw | Deploy one blade orbiting 52 units from the ship; blade can overlap blocks while the ship remains outside | 1 damage per contacted block per 0.12 s; active while firing | Close-range cutting |
| Mortar | Launch a visible lob toward the aim point, clamped to 600 units; explode at landing | 4 damage within 48 units, shell every 1.2 s | Blast dense areas and reach beyond the surface |
| Yoyo | Launch a tethered blade up to 240 units along the firing direction, then retract to the ship | 2 damage per block on each outward/return leg; 0.9 s cycle | Cut a deep straight channel |
| Boomerang | Follow a curved outward path up to 330 units, then home back to the moving ship | 2 damage per block on each outward/return leg; 1.1 s cycle | Carve broad curved paths |
| Railgun | Instant narrow beam that pierces up to 12 blocks in distance order | 4 damage per block, beam every 1.4 s | Drill toward the core |
| Guided missile flurry | Six staggered homing missiles; favor exposed blocks near the cursor, reacquire lost targets, explode on collision | 3 damage in a 24-unit radius, 0.07 s launch spacing, salvo every 1.4 s | Seek and bombard exposed material while maneuvering |
| Guided laser | Each ray selects a different living block within 600 units, nearest first and independently of mouse aim | 0.75 damage per ray, pulse every 0.09 s; starts with one ray | Rapid close-range precision fire while maneuvering |
| Piercing nuke | Flies to the mouse position captured at launch; drills up to 5 × level blocks and detonates only at the target coordinates | 20 base blast damage, 4 × level block-width radius, 3.2 s base cooldown | Place a penetrating explosion precisely |
| Mining drones | One autonomous roaming drone per weapon level; each selects a different nearest visible block | Level L: L damage per block and L pierced blocks, pulse every 0.55 s per drone | Independent mining without trigger input |
| Plague | Snow pulled toward the center infects blocks and spreads through sustained edge contact | Level L: L damage/s per infected block; 5/L seconds to spread | Persistent damage and infection across connected material |

### Interaction rules

- Plague emits six snow-like particles per 0.25-second volley, with a starting speed of 90 units/s, 80-degree spread, inward gravity of 170 units/s², speed cap of 340 units/s, seven-second lifetime, and a 400-particle cap. A swept collision infects the first living block. Snow bypasses projectile interception and liquid reflection. Infection deals weapon-level HP/s continuously; repeated exposure does not stack. Each infected-source/healthy-neighbor pair tracks continuous shared-edge contact, with spread after 5 / weapon level seconds. Diagonals do not count, multiple sources do not combine timers, and broken contact resets that pair. Newly infected blocks begin spreading on the next simulation step. A dying source contributes only the time it remains alive. Infections remain attached to moving liquid blocks. Existing infection continues after unequip and uses current purchased upgrades. Saves retain infected block IDs and partial contact timers; free-flying snow is transient. New planets clear all infections. Regeneration and plague damage both apply, so Anvil's shell can outheal low-level infection. Initial interpretation of unspecified plague damage: 1 damage/s per weapon level.
- Mining drones operate whenever equipped, independently of Space and AUTO. Level L deploys L drones (1–5). Each spawns at a random point 30–70 units from the ship, wanders toward changing random destinations within 220 units of the ship at 85 units/s, and flies above material without physical collision. Each picks the nearest visible, unreserved living block within 450 units; targets are reserved once per drone in a shared assignment pass. Surplus drones idle. A laser hits its assigned block first and up to L blocks total along the same ray, dealing L damage to each. Piercing tails can incidentally hit another drone's target; primary target reservations never overlap. Reassign destroyed targets on the next simulation step. Pause/armory freeze movement and firing. Unequip removes drones immediately; upgrades add only the missing drones. Reload and level transitions recreate the correct fleet near the ship. This weapon's four upgrades add one drone, one damage, and one penetration each; its cooldown remains 0.55 s rather than using the default 8% speed upgrade.
- Piercing nuke (320-credit unlock, 140-credit base upgrade cost): captures the mouse coordinates at launch and detonates exactly at that point, even in empty space. Later mouse movement does not redirect it. At weapon level L, it destroys up to 5 × L distinct living blocks on the way. Exhausting that allowance does not trigger an early explosion: the missile continues through remaining material without additional drilling damage. Blast radius is 4 × L block widths (16 world units per block). Base blast damage is 20, cooldown 3.2 s, and speed 300 units/s. There is no range-based detonation. Every upgrade adds 5 drill blocks, 4 radius blocks, 5 blast damage, and multiplies cooldown by 0.92 in weapons.json. A target ring shows the blast radius. Holes do not consume drilling allowance. Arrival is clamped to the destination to prevent overshoot, including zero-distance shots. Each blast damages blocks whose centers lie within its radius once; standard rewards and core collapse still apply.
- Guided laser selects up to one distinct surviving block per ray each pulse, nearest first within 600 units. Each selected block takes one ray of damage, never the combined damage of the whole volley. Every upgrade adds one ray, from one at level 1 to five at level 5, alongside the existing damage/cooldown improvements. If there are fewer available blocks than rays, extra rays idle. Selection refreshes each pulse; overkill is discarded. Green beams fan out toward their separate targets. Releasing the trigger stops new pulses unless auto fire is enabled.
- Guided missiles travel at 350 units/s with a 1,000-unit path limit, acquire visible exposed targets within 700 units, and turn at up to 300 degrees/s. They use swept collision, cannot pass through blocks, and finish an already launched salvo after trigger release. No target means straight flight until acquisition or range expiry. Pause freezes the salvo. Pink missile bodies and curved trails distinguish them from ordinary shots; reduced motion hides trails.
- Ordinary projectiles hit the first solid square along their swept path, including when crossing multiple cells in one frame.
- Lightning's first target requires line of sight. Subsequent jumps may reach through material within 48 units of the last target. Each discharge visits a block at most once and never arcs back to the ship.
- The mortar's arc represents flight above the planet plane, so it ignores blocks until landing. Its landing marker and blast radius communicate this exception. Blast damage applies once to blocks whose centers lie within the radius, including buried blocks.
- Yoyo and boomerang blades pass through blocks, recording hit IDs separately for outward and return travel. The yoyo's tether is visual only.
- Returning blades seek the ship's current position and have a maximum lifetime, preventing lost weapons from occupying a slot indefinitely. Only one active blade per yoyo or boomerang weapon is allowed initially.
- Buzzsaw contact uses a per-block time interval, not render frames. Releasing fire retracts it with a short visual fade and stops its damage immediately.
- Railgun visits cells along a ray and consumes one penetration count per living block hit, whether or not that block is destroyed.
- Different weapons may damage the same block in the same simulation step. Reward and completion logic must still execute only once.

## Upgrade page and economy

Provide a dedicated `upgrades.html` page with the same neon visual style. Show credits, the three equipment slots, and cards for all thirteen weapons. Every card shows ownership, level, behavior, current statistics, next-level changes, and price.

| Weapon | Unlock cost | Base upgrade cost |
| --- | ---: | ---: |
| Double parallel shot | Free; equipped initially | 40 |
| Shotgun | 60 | 50 |
| Chain lightning | 120 | 70 |
| Orbiting buzzsaw | 100 | 60 |
| Mortar | 140 | 80 |
| Yoyo | 90 | 55 |
| Boomerang | 110 | 65 |
| Railgun | 180 | 100 |
| Guided missile flurry | 200 | 90 |
| Guided laser | 160 | 80 |
| Piercing nuke | 320 | 140 |
| Mining drones | 240 | 100 |
| Plague | 1,000 | Level 2: 10,000; level 3: 100,000; level 4: 1,000,000; level 5: 10,000,000 (fixed prices, exempt from the base-cost formula) |

Purchases unlock level 1. Each weapon has five levels initially. Buying level `L` costs `base upgrade cost × (L - 1)`. At level `L`, base damage is multiplied by `1 + 0.25 × (L - 1)` and cooldown by `0.92^(L - 1)`. For the buzzsaw, cooldown scaling applies to the contact interval. For returning blades it applies to cycle duration. Display fractional damage honestly.

At level 3 and again at level 5, apply the following weapon-specific improvement:

| Weapon | Improvement at each milestone |
| --- | --- |
| Shotgun | +2 pellets, maintaining the cone angle |
| Double parallel shot | +15% projectile speed and range relative to level 1 |
| Chain lightning | +1 chain target |
| Orbiting buzzsaw | +15% blade diameter relative to level 1 |
| Mortar | +8 units blast radius |
| Yoyo | +40 units reach |
| Boomerang | +40 units outward reach |
| Railgun | +4 penetrated blocks |
| Guided missile flurry | +2 missiles and +45 degrees/s turning speed |
| Guided laser | +1 ray at **every** upgrade (levels 2, 3, 4, and 5), not only milestones |
| Piercing nuke | +5 drilled blocks and +4 block widths of blast radius at **every** upgrade |
| Mining drones | +1 drone, +1 damage, +1 penetration at **every** upgrade; fixed cooldown |
| Plague | +1 damage/s and spread delay reduced to 5 / new level at **every** upgrade; fixed firing cooldown |

Owned weapons can be equipped or removed freely. Do not allow duplicate weapons across slots. When all three slots are occupied, equipping a weapon asks which slot to replace. Buying a weapon does not silently replace equipment. Empty slots are allowed, including an empty loadout; the HUD points the player toward upgrades if no weapon is equipped.

Disable unaffordable purchases and show the missing credit amount. Apply purchases atomically and save immediately. No selling, refunds, ammunition costs, or paid repair in the initial version. Aim for the first unlock within roughly 30–60 seconds; tune prices and fire rates after a playable build exists.

## Presentation and feedback

- Black/navy starfield with restrained parallax; cyan outlined ship and engine trail.
- Weapon effects use distinct shapes as well as colors: pellet fan, paired streaks, jagged lightning, toothed circle, arcing shell, tether, curved blade, and straight beam.
- Warm damage colors dominate the planet; weapon effects favor cyan, violet, and white for separation.
- Compact HUD: credits, blocks remaining, percentage destroyed, three weapon icons with cooldown indicators, AUTO state, and upgrades/pause controls.
- Start overlay explains WASD, mouse aim, Space, and F in one short instruction strip.
- Layer legend explains HP values. A small aim readout can show the targeted block's layer and current/max HP.
- Use short impact flashes and restrained screen shake. Provide mute and reduced-motion settings; avoid full-screen lightning flashes.
- Procedural sound can distinguish weapon types and destruction without external assets. Audio starts only after a user gesture.
- Completion overlay shows time, blocks destroyed, credits earned, and buttons for upgrades or the next planet.

## State and implementation structure

Proposed files in `planetDestroyer/`:

```text
index.html          Game canvas and HUD
upgrades.html       Weapon store and equipment management
styles.css          Shared layout and neon styling
weapons.json        Weapon base stats, unlock costs, and available upgrades
levels.md           Ten-level campaign design and generation rules
js/main.js          Game lifecycle, input, and fixed-step loop
js/planet.js        Grid generation, damage, layers, collision queries
js/weapons.js       JSON loading, stat resolution, and behavior registry
js/render.js        Canvas drawing and bounded visual effects
js/save.js          Save validation, migration, and storage
js/upgrades.js      Store interactions and loadout editing
```

Use a fixed 60 Hz simulation with elapsed-time accumulation and a capped catch-up budget. Rendering can run at display refresh rate. Paused or hidden tabs do not accrue simulated attacks or cooldown time.

Use the planet grid directly for collision lookup instead of testing every projectile against every block. Sweep fast projectiles through cells to avoid tunneling. Cap particle counts and projectile lifetimes, and reuse objects where useful. Initial performance target: smooth 60 FPS on a typical desktop with approximately 1,000 blocks and three active weapons; profile lightning, explosions, and contact weapons together.

Define weapons in `weapons.json` and map their behavior identifiers to JavaScript factory/update hooks. JSON contains no executable code. Adding a weapon with an existing behavior needs only a JSON entry; a new attack mechanic also requires a registered behavior. Neither requires editing the store or core firing loop. Keep transient attack state separate from purchased levels. Fetch the JSON over the existing local/static HTTP server before enabling gameplay or purchases.

Persist a versioned save under a unique localStorage key, containing credits, weapon ownership and levels, loadout, settings, planet seed/index, surviving block HP, ship position, active play time, and completion/reward state. Save periodically, after purchases, on pause, and before page navigation. Do not save transient projectiles or effects; resume with a short firing delay to prevent reload-driven burst exploits.

Visiting upgrades pauses and saves before navigation. Returning loads the same damaged planet. A fresh save starts with the free double shot. Validate stored values and loadout IDs; recover from corrupt saves with a visible message. If storage is unavailable, keep the session playable and explain that cross-page progress cannot be retained; use an in-page shop fallback to avoid losing that session.

## Delivery sequence

1. Flight, aiming, responsive canvas, approximately 1,000 layered squares, shared damage/color logic, and the starting double shot.
2. All thirteen weapons, collision exceptions, individual cooldowns, and three-slot firing with manual/auto modes.
3. Upgrade page, purchase and equipment rules, persistence, and resume behavior.
4. Completion loop, audiovisual polish, accessibility settings, balance pass, and performance checks.

## Acceptance checks

- WASD movement remains consistent across refresh rates; diagonal movement is not faster.
- Level 1 contains exactly 1,000 blocks in a circular silhouette. All ten levels use the material HP, movement, rewards, and completion conditions in `levels.md`.
- Gameplay and the store derive weapon stats and available upgrades from `weapons.json`; every upgrade resolves to the same values in both screens.
- Damage colors follow remaining-HP fraction. Lethal hits, including crust hits, visibly flash yellow.
- Destroyed squares cease blocking shots and movement, award credits once, and leave permanent holes.
- Each of the thirteen weapons has its specified distinct behavior. Fast shots cannot skip thin layers.
- At most three distinct weapons can be equipped, and each fires on its own timing under held Space or AUTO.
- Releasing Space stops new manual attacks. Pause, focus loss, and upgrade navigation cannot leave a held trigger stuck.
- Buying and improving weapons deducts the correct amount, rejects insufficient funds, and updates displayed statistics.
- Upgrade navigation and reload preserve planet damage, credits, ownership, loadout, and the completion bonus state.
- Clearing the last block completes the planet exactly once. A new planet retains purchased equipment and credits.
- Dense combinations such as lightning, mortar, and buzzsaw remain responsive, with bounded particles and projectiles.
- Adding a test weapon definition and registered behavior makes it available to the store and equipment system without changes to the firing loop.

## Future additions

Additional weapons, alternate planet shapes, material resistances, challenge objectives, enemy defenders, controller support, and mobile controls can build on the same grid and weapon registry. These should follow a playable and balanced destruction loop rather than delay it.
