# Planet Destroyer demo

The playable demo is `game.html`; all game logic is in `game.js`. Weapon base statistics and upgrade definitions load from `weapons.json`.

From the repository directory (`match3`, containing `package.json`), run:

```powershell
npm.cmd run dev
```

Open [the demo](http://localhost:3000/match3/planetDestroyer/game.html). Use the HTTP server rather than opening the HTML directly, because the browser needs to fetch the JSON file.

## Controls

- **WASD:** fly; **mouse:** aim independently.
- **Space:** hold to fire all equipped weapons.
- **F:** toggle automatic fire.
- **U:** open the armory; select a slot, then equip a purchased weapon.
- **Escape:** pause/resume or close the armory.

Start with double parallel shot. Destroy blocks for credits, buy any of the thirteen weapons, and equip up to three at once. Each weapon has four purchasable upgrades. There are ten planets, from 1,000 to 3,000 blocks.

**Guided missile flurry:** unlock for 200 credits. Fires six homing missiles in a rapid staggered salvo, with small impact explosions. They favor exposed blocks near your aim, spread across targets, and reacquire destroyed targets. Levels 3 and 5 add two missiles and improve steering, reaching ten missiles at level 5. A launched salvo finishes after you release the trigger.

**Guided laser:** unlock for 160 credits. Each ray automatically selects a different surviving block within 600 units, nearest first, independently of mouse aim. Fires about 11 pulses per second for 0.75 base damage per ray. Every upgrade adds one simultaneous ray (one to five), increases damage, and reduces cooldown. Targets are selected afresh each pulse; each receives at most one ray. Surplus rays idle when fewer blocks are available. Works with held Space or auto fire.

**Piercing nuke:** unlock for 320 credits. Aims at the mouse position captured when fired and detonates exactly there, including in empty space. At level L, it destroys up to **5 × L distinct blocks** along the path; after that allowance is used, it passes through remaining material without drilling damage until arrival. Its explosion radius is **4 × L block widths** (64–320 world units). A destination ring shows the blast area. Base explosion damage is 20 and cooldown is 3.2 seconds. Every upgrade adds five drilled blocks and four block widths of radius, increases blast damage, and reduces cooldown.

Terra is blue: 1 HP gas, two 4 HP crust layers, 6 HP liquid mantle that compacts each second, and a 20 HP core. Bedrock has a five-block-thick red 50 HP shell, blue 5 HP polar weaknesses, and a 30 HP core. Destroy either planet's entire core to collapse it. Cinder is ash grey with stronger layers and exactly 100 gold blocks worth 10 credits each. Cinder and later planets require every block to be cleared. See `levels.md` for all material values.

The armory is a paused screen inside `game.html` for this demo. Progress saves in this browser, including damaged blocks, purchases, equipment, and completion rewards. Losing focus pauses flight. The pause menu includes reduced motion and a confirmed new-campaign reset. Audio and mobile touch controls are not implemented.

**Mining drones:** unlock for 240 credits and equip in one weapon slot. Deploys one autonomous drone per weapon level (one to five). Drones spawn randomly 30–70 units from the ship, wander freely around it, and mine with Space released and auto fire OFF. At level L, each laser pierces L blocks and deals L damage per block. Each drone reserves a different nearest visible block within 450 units; surplus drones idle if there are not enough targets. Piercing tails can incidentally hit another drone's target. Drones fire every 0.55 seconds. Each upgrade adds exactly one drone, one damage, and one penetration. Unequipping recalls them; pause freezes them. Reloading and entering another planet respawn the purchased fleet near the ship.

Basalt has 30 crust-mounted laser defense turrets, two layers of 100 HP crust, and a 10 HP liquid interior that settles once per second. Destroy a turret's crust mount to disable it. The defenses intercept physical weapons and railguns, and shoot down mining drones; guided laser and chain lightning bypass them. Shot-down drones rebuild after three seconds. Destroy all Basalt liquid blocks to trigger collapse and clear the remaining crust and turrets. Existing unfinished Basalt saves rebuild with this layout while keeping credits and equipment.

Ironheart is developed to the center, with lit hexagonal compartments enclosing liquid. Initial balance: 200 HP city crust, 250 HP sector walls, and 15 HP liquid. Six surface turrets have a 320-unit interception range (Basalt: 150). Liquid settles when cavities are opened; destroy all blocks to finish. Existing unfinished Ironheart saves rebuild once while retaining equipment and credits. See `levels.md` for the full specification.

Anvil has three shell layers with 10 HP and 10 HP/s regeneration, reflective liquid mantle, and eight core turrets. Their lasers intercept incoming shots; their violet waves push the ship away only when it is within 600 units and visible through cleared terrain. Destroyed shell blocks stay gone. Initial mantle/core values are 10/80 HP. Anvil saves preserve damage and defense recharge; older unfinished saves rebuild once without losing equipment or credits.

**Plague:** unlock for 1,000 credits. Fire snow-like flakes pulled toward the planet center. Contact infects a block; at level L, infected blocks take L damage per second and infect edge-touching neighbors after 5/L seconds of uninterrupted contact. Multiple infected neighbors do not accelerate the timer, and infection never stacks damage on one block. Surviving infection continues after firing stops or the weapon is unequipped, and upgrades improve existing infections. Pause freezes it; save/reload preserves infections and partial contact times. Destroyed blocks cannot transmit plague. Snow and infection bypass projectile defenses and liquid reflection. Levels 2–5 cost 10,000 / 100,000 / 1,000,000 / 10,000,000 credits respectively.

**Turtle replaces Crucible:** five layers of reflective 50 HP shell regenerate 5 HP every 0.1 seconds. Railgun can pierce the shell. Two empty radial layers separate it from the non-regenerating 10 HP core, stopping plague from spreading across the gap. Ten core turrets defend the interior; destroying the entire core collapses the planet. The hollow layout has 1,990 blocks. Older unfinished Crucible saves rebuild as Turtle while keeping equipment and credits.

**Chaos replaces Titan:** 2,500 blocks randomly mix regenerating, reflective Turtle blocks (40%), liquid (40%), and gold (20%). All materials range from 1 HP at the surface to 250 HP at the center. Liquid settles each second; gold pays 10 credits. Saves preserve the random layout. Old Titan saves rebuild while keeping equipment and credits.

Use **Galaxy** in the header, pause screen, or completion screen to replay completed planets or resume an unfinished destination. Weapons, upgrades, and credits travel with you. Each destination keeps its damage and liquid/infection state while you are away, including across reloads. Replays award block credits; the first-clear bonus is paid only once. Future planets remain locked until the previous planet is cleared.

**Shockwave:** an expanding electric ring that cannot be deflected or intercepted. Damage scales smoothly with direction: 2× away from the planet center, 1× perpendicular, 0.5× toward the center. Surviving liquid blocks are pushed up to two cells away from the wave origin when space is free. Upgrades extend range from 240 to 560 units.

**Obsidian:** 2,750 scattered violet liquid blocks become denser toward the center, with random 10–50 HP and regeneration of 10% maximum HP/s. Two optional Turtle-block moons have 200 blocks / 4 turrets and 400 blocks / 6 turrets. Clear the liquid planet to win; the moons can remain intact.

**Last Sun:** all-liquid body with 300 initial core blocks. Lasers, lightning, and Shockwave heal blocks instead of damaging them; plague has no effect. Each core rolls every second to grow a core (1%) and normal liquid (5%), pushing occupied lines outward. Living core blocks are capped at 1,000. Growth and displacement persist across saves and Galaxy visits.

Mobile entry point: **`game-mobile.html`**, with its own `game-mobile.js` and separate save. Use the left thumbstick to move, touch the arena to aim/fire, or use HOLD FIRE and Auto. Portrait and landscape are supported. See [MOBILE.md](MOBILE.md) for controls, maintenance notes, and alternative-control proposals. Run `node planetDestroyer/browser-mobile-smoke.cjs` for the mobile browser checks.

**Buzzsaw upgrades:** unlock for 200 credits; each level adds another saw on a separate, alternating-direction orbit. Successive saws are 10% larger, slower, and stronger. Upgrade prices scale with total sustained-contact DPS. See [BUZZSAW.md](BUZZSAW.md) for the formulas and price table. Implemented on desktop and mobile.

**Yoyo:** automatically performs Surface Dance along exposed edges or String Storm in cavities. Hold fire or Auto to repeat; upgrades extend contour routes and add figure-eight passes. See [YOYO.md](YOYO.md) for details. Available on desktop and mobile.

**Chain lightning:** branches into a tree on impact. Upgrades add fork tiers and longer randomized branches, with each block hit at most once per discharge. See [LIGHTNING.md](LIGHTNING.md) for the level table. Available on desktop and mobile.

**Mortar:** upgraded shells scatter secondary mortars, with three-way and five-way midair splits at levels 4 and 5. Secondary shots explode once without further branching. Prices scale with theoretical total blast DPS. See [MORTAR.md](MORTAR.md) for counts, angles, and prices. Available on desktop and mobile.

**Charged shot:** distance controls charge duration and physical piercing damage. Upgrades raise the charge limit to 1 / 2 / 4 / 6 / 10 seconds. Shots over 50 damage ignore point defense; all shots bypass reflection. A rising glow, charge meter, and lightning trail show its state. See [CHARGED-SHOT.md](CHARGED-SHOT.md) for exact scaling and controls. Available on desktop and mobile.

**Sun Killer:** three levels with 1 / 3 / 5 physical projectiles dealing 100 / 150 / 200 damage each, always on a 0.1-second cooldown. Range is 1,000 / 1,250 / 1,500, with random ±1° spread. Leftover damage carries through destroyed blocks. Prices scale with potential DPS; see [SUN-KILLER.md](SUN-KILLER.md) for the table and spread interpretation. Available on desktop and mobile.

Sun Killer now fires cyan projectiles. Direct hits on Solar liquid or Solar core create physical explosions with random radius **10–100 / 20–150 / 30–200**, by weapon level. Damage per affected block equals the rolled radius. Overkill remains active; collateral kills do not create recursive explosions.

## Checks

```powershell
node planetDestroyer/game.test.cjs
node planetDestroyer/browser-smoke.cjs
```

The simulation checks cover exact counts, connectivity, symmetry, rising total HP, all weapon damage paths, upgrades, swept collision, liquid movement and persistence, core collapse/rewards, and seeded gold placement. Older saves preserve purchases and credits but rebuild an unfinished planet with the new materials.

The optional browser check uses locally installed Chrome and no extra npm dependencies. Override `CHROME_PATH` for another installation. It starts a temporary localhost server and isolated browser profile, checks the core UI flow, writes screenshots under the system temporary directory, then stops its browser and server. Some restricted execution environments require running the browser check outside their sandbox.

See [DESIGN.md](DESIGN.md) and [levels.md](levels.md) for the broader design and balance targets.
