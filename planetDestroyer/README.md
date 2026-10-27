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

Start with double parallel shot. Destroy blocks for credits, buy any of the twelve weapons, and equip up to three at once. Each weapon has four purchasable upgrades. There are ten planets, from 1,000 to 3,000 blocks.

**Guided missile flurry:** unlock for 200 credits. Fires six homing missiles in a rapid staggered salvo, with small impact explosions. They favor exposed blocks near your aim, spread across targets, and reacquire destroyed targets. Levels 3 and 5 add two missiles and improve steering, reaching ten missiles at level 5. A launched salvo finishes after you release the trigger.

**Guided laser:** unlock for 160 credits. Automatically targets the nearest surviving block within 600 units, independently of mouse aim. Fires about 11 pulses per second for 0.75 damage per ray. Every upgrade adds one simultaneous ray focused on that same block (one to five rays), increases damage, and reduces cooldown. It picks a new nearest target each pulse; excess damage does not jump to another block. Works with held Space or auto fire.

**Piercing nuke:** unlock for 320 credits. Aims at the mouse position captured when fired and detonates exactly there, including in empty space. At level L, it destroys up to **5 × L distinct blocks** along the path; after that allowance is used, it passes through remaining material without drilling damage until arrival. Its explosion radius is **4 × L block widths** (64–320 world units). A destination ring shows the blast area. Base explosion damage is 20 and cooldown is 3.2 seconds. Every upgrade adds five drilled blocks and four block widths of radius, increases blast damage, and reduces cooldown.

Terra is blue: 1 HP gas, two 4 HP crust layers, 6 HP liquid mantle that compacts each second, and a 20 HP core. Bedrock has a five-block-thick red 50 HP shell, blue 5 HP polar weaknesses, and a 30 HP core. Destroy either planet's entire core to collapse it. Cinder is ash grey with stronger layers and exactly 100 gold blocks worth 10 credits each. Cinder and later planets require every block to be cleared. See `levels.md` for all material values.

The armory is a paused screen inside `game.html` for this demo. Progress saves in this browser, including damaged blocks, purchases, equipment, and completion rewards. Losing focus pauses flight. The pause menu includes reduced motion and a confirmed new-campaign reset. Audio and mobile touch controls are not implemented.

**Mining drones:** unlock for 240 credits and equip in one weapon slot. Deploys one autonomous drone per weapon level (one to five). Drones spawn randomly 30–70 units from the ship, wander freely around it, and mine with Space released and auto fire OFF. At level L, each laser pierces L blocks and deals L damage per block. Each drone reserves a different nearest visible block within 450 units; surplus drones idle if there are not enough targets. Piercing tails can incidentally hit another drone's target. Drones fire every 0.55 seconds. Each upgrade adds exactly one drone, one damage, and one penetration. Unequipping recalls them; pause freezes them. Reloading and entering another planet respawn the purchased fleet near the ship.

## Checks

```powershell
node planetDestroyer/game.test.cjs
node planetDestroyer/browser-smoke.cjs
```

The simulation checks cover exact counts, connectivity, symmetry, rising total HP, all weapon damage paths, upgrades, swept collision, liquid movement and persistence, core collapse/rewards, and seeded gold placement. Older saves preserve purchases and credits but rebuild an unfinished planet with the new materials.

The optional browser check uses locally installed Chrome and no extra npm dependencies. Override `CHROME_PATH` for another installation. It starts a temporary localhost server and isolated browser profile, checks the core UI flow, writes screenshots under the system temporary directory, then stops its browser and server. Some restricted execution environments require running the browser check outside their sandbox.

See [DESIGN.md](DESIGN.md) and [levels.md](levels.md) for the broader design and balance targets.
