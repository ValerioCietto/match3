# Void Wing

A mobile-first, third-person 3D starship arena. Uses a dependency-free Canvas perspective renderer with world-space cubes, a chase camera and an ellipsoid arena measuring 200 × 130 × 260 world units.

From the repository root run `npm start`, then open `http://localhost:3000/3dShooter/`. Use HTTP so the shared `../shooter/upgrades.json` catalog can load.

- Touch: left stick steers yaw and pitch; hold Boost or Brake to change speed. Weapons fire automatically along the ship's heading. Orange bearing arrows indicate nearby off-screen enemies.
- Keyboard: WASD or arrow keys steer (W/up pitches up, S/down pitches down, A/left turns left, D/right turns right). Shift boosts, Ctrl brakes, Space deploys an unlocked bomb, P pauses. Q/E strafing is available immediately; the movement upgrade is removed from the arena shop.
- Five cube enemy classes preserve the probabilities, health, bounties and relative speeds from `shooter/game.js`. Positions sample the entire ellipsoid volume uniformly. Enemies pursue the player, causing contact damage.
- The arena extends the shooter catalog with its own upgrades in `core.mjs`, preserving prerequisites, capped stats, repeatable purchases, cosmetics, bomb selection and New Game Plus. Screen fires 90 radial projectiles; Smart spawns 50 enemies as described in the catalog. Active hostiles are limited to 140 for mobile performance.
- Credits and upgrades persist under `void-wing.arena.v1`; original shooter saves are untouched. Defeat resets the flight, retaining upgrades and credits. The hangar, tab switching and loss of window focus pause gameplay.
- Sound is optional and uses the shooter folder's music and effects.
- Auto aim: enemies whose centers project inside the aim circle can be targeted. Its diameter starts at 48px; Bigger Aim Circle adds 5px per level, clamped to 100px (the final level adds 2px). The enemy closest to the reticle center wins; normal shots, including upgraded volleys, aim at its center at firing time. The reticle shows TARGET LOCK when acquired. Without a target, shots retain their usual forward/spread pattern.
- Hull regeneration costs 25 credits and repairs 1 hull per second of active flight, capped at 100 hull.
- Guided missiles cost 10 credits to unlock and start at one missile every 5 seconds, dealing 3 damage. Separate upgrades add 0.1 volleys/second, 1 missile/volley, or 1 damage/missile per level; each starts at 10 credits with 1.3× cost growth. Missiles home on different living enemies, reserving targets across active volleys. If there are fewer available targets, fewer missiles launch. A missile expires if its target dies or after 8 seconds.

Run logic and simulated-DOM runtime checks with `node --test 3dShooter/core.test.mjs 3dShooter/runtime.test.mjs`.
