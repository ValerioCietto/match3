# Void Wing

Rendering performance: star trails are batched into one path, with one blurred glow pass plus one sharp pass during ludicrous boost. Offscreen trails/faces are skipped, mesh vertices are projected once per frame, and camera projection avoids temporary vector arrays. Gameplay timing and star count are unchanged.

**Silver D20 encounter:** after 10 continuous seconds of active LUDICROUS SPEED, a large red BIG BOSS INCOMING warning fades in and out for 5 seconds. Pausing freezes the timer. The ship then returns to 12 m/s and boost is locked until the boss is defeated. Regular spawning stops during the fight. The shiny silver icosahedron is larger than the white bosses, has 1,000 HP, and stays ahead of the ship. Every 2 seconds it begins a 1-second rotation, then displays a random roll from 1 to 20 and fires that many red projectiles in a 20-degree cone toward the player. Each projectile deals 5 hull damage, subject to normal hit invulnerability.

Defeating it shows BOSS DEFEATED, Are you happy now!?, and the requested go-play-outside message. NAH KEEP PLAYING resumes the endless race and releases the boost lock. The encounter occurs once per run; restarting after death resets it.

Boost doubles bomb recharge speed: an 18-second cooldown takes 9 seconds while continuously boosting, including upgraded boost modes. Braking or turning boost off restores normal recharge. The bomb button shows the remaining time at the current recharge rate.

**CURVATURE** appears only after buying ALWAYS TO THE MAX. Its 10 levels multiply boost speed from 2x to 9.9x using `2 + 7.9 * sqrt((level - 1) / 9)`, rounded to three decimal places. The shop shows current/next multiplier and the level cap. Purchase costs follow `round(100 + 900 * sqrt((level - 1) / 9))`, from 100 to 1,000 credits. Previous saves above level 10 are capped at 10; LUDICROUS SPEED unlocks at level 10.

At maximum CURVATURE, **LUDICROUS SPEED** becomes visible for 100,000 credits. Purchase enables it; its shop button then toggles it for free. Its 20x multiplier replaces CURVATURE, yielding 1,280 m/s with boost active. While boosting, tunnel ring spacing, visible course length and spawn distance stretch 10x; ship and enemy meshes stretch 2x along the flight axis, with corresponding enemy collision approximation. Stars receive blur and speed streaks. Braking or turning boost off suspends these effects. Disabling the upgrade restores the CURVATURE multiplier. Purchases and the mode preference persist; New Game Plus resets them. Projectiles stay faster than the ship and swept contact checks prevent tunneling at high speeds.

**ALWAYS TO THE MAX** costs 40 credits. It doubles boost speed from 32 to 64 m/s and changes the Boost button and Shift key into on/off toggles. The button displays BOOST ON/OFF. Brake temporarily overrides boost; releasing it restores the selected boost state. New runs start with boost off. The upgrade is saved.

Shop unlocks: **Unlock first person view** costs 10 credits; **Unlock strategic camera view** costs 40 credits. Third-person is always available and remains the default. Locked camera options show their prices in the selector. **Enable or disable auto aim** costs 50 credits and then provides free Enable/Disable buttons in its shop row. Auto aim stays on by default; the purchased toggle preference and camera unlocks persist across runs and reloads. New Game Plus resets these upgrades.

The upper-right camera selector offers **3rd person** (default chase camera, 12 m behind), **strategic** (a more distant chase camera, 45 m behind and 9 m above the ship, looking forward), and **1st person** (cockpit viewpoint). Switching views preserves the run and fixed forward flight direction. Auto-aim uses the visible reticle in the selected view.

A mobile-first, third-person 3D starship race shooter. Fly automatically down an endless cylindrical course with a 40 m radius. The camera and ship always face forward. A distance counter tracks total travel; the race continues until the hull is destroyed. Uses a dependency-free Canvas perspective renderer.

From the repository root run `npm start`, then open `http://localhost:3000/3dShooter/`. Use HTTP so the shared `../shooter/upgrades.json` catalog can load.

- Touch: left stick strafes horizontally and vertically; hold Boost or Brake to change speed. Weapons fire automatically along the ship's heading. Orange bearing arrows indicate nearby off-screen enemies.
- Keyboard: WASD or arrow keys strafe (W/up moves up, S/down moves down, A/left moves left, D/right moves right). Heading is fixed along the cylinder axis. Shift boosts, Ctrl brakes (either doubles the enemy spawn rate while held; they do not stack), Space deploys an unlocked bomb, P pauses. Q/E strafing is available immediately; the movement upgrade is removed from the arena shop.
- Five enemy classes preserve the probabilities, health, bounties and relative speeds from `shooter/game.js`. Enemies enter from the forward end of the visible course, 180-220 m ahead, uniformly distributed across the circular cross-section. They travel toward the entrance along the cylinder axis and cause contact damage. Passed enemies are removed. Their speed remains 75% slower than the initial arena implementation.
- The arena extends the shooter catalog with its own upgrades in `core.mjs`, preserving prerequisites, capped stats, repeatable purchases, cosmetics, bomb selection and New Game Plus. Screen fires 90 radial projectiles; Smart spawns 50 enemies as described in the catalog. Active hostiles are limited to 140 for mobile performance.
- Credits and upgrades persist under `void-wing.arena.v1`; original shooter saves are untouched. Defeat resets the flight, retaining upgrades and credits. The hangar, tab switching and loss of window focus pause gameplay.
- World-space stars stream outward and past the camera as the player advances, with speed-dependent streaks. Passed stars recycle ahead. Tunnel rings stay anchored to course distance, making forward motion visible. Strafing is clamped inside the circular wall.
- Sound is optional and uses the shooter folder's music and effects.
- Auto aim: enemies whose centers project inside the aim circle can be targeted. Its diameter starts at 48px; Bigger Aim Circle adds 5px per level, clamped to 100px (the final level adds 2px). The enemy closest to the reticle center wins; normal shots, including upgraded volleys, aim at its center at firing time. The reticle shows TARGET LOCK when acquired. Without a target, shots retain their usual forward/spread pattern.
- Hull regeneration costs 25 credits and repairs 1 hull per second of active flight, capped at 100 hull.
- Guided missiles cost 10 credits to unlock and start at one missile every 5 seconds, dealing 3 damage. Separate upgrades add 0.1 volleys/second, 1 missile/volley, or 1 damage/missile per level; each starts at 10 credits with 1.3× cost growth. Missiles home on different living enemies, reserving targets across active volleys. If there are fewer available targets, fewer missiles launch. A missile expires if its target dies or after 8 seconds.

Bullet spread fills a 3D cone around the ship's forward direction, with one central shot and the remaining bullets distributed horizontally and vertically through its area. The spread upgrade controls the cone's full opening angle. Auto-aim centers the volley on a locked enemy before baseline dispersion. Every bullet, including single shots, critical shots and bomb bullets, receives a random 1-degree full cone of dispersion (up to 0.5 degrees off its intended direction). Guided missiles retain their homing behavior.

Missiles launch along the ship's forward heading at twice its current forward speed: 24 m/s cruising, 64 m/s boosting, or 4 m/s braking. They fly straight for 0.2 seconds, then turn toward their reserved target at up to 3 radians/second while approaching a 55 m/s homing speed.

Run logic and simulated-DOM runtime checks with `node --test 3dShooter/core.test.mjs 3dShooter/runtime.test.mjs`.

Enemy silhouettes: small red cubes, grey cubes rolled 45 degrees around the forward axis, blue octahedra, black triangular prisms, and large white dodecahedra with twelve pentagonal faces. Red cubes use box hitboxes; the other shapes use enclosing sphere approximations.

Enemy weapons: blue octahedra and black triangles fire straight along their forward direction (toward the tunnel entrance) every 3 seconds, dealing 10 hull damage. White dodecahedron bosses fire one red cube every 2 seconds, aimed at the player's position at launch, dealing 20 hull damage. Boss cubes travel on a fixed trajectory. Shots respect the ship's brief invulnerability after a hit, pause with the game, and clear on restart or after passing the player.
