# Orbiting buzzsaw

Desktop and mobile share the configuration in `weapons.json`.

Unlock costs **200 credits**. Each upgrade adds one blade, reaching five at level 5. The original blade keeps its base stats; each successive blade is 10% larger, rotates 10% slower, and deals 10% more damage than the preceding blade. Both orbital motion and visual blade rotation alternate direction.

For blade index `i` starting at zero:

- Damage: `1 × 1.1^i`.
- Diameter: `28 × 1.1^i` units.
- Orbital angular speed: `240 × 0.9^i` degrees/second, alternating clockwise/counterclockwise.
- First orbit: 52 units. Each next orbit is the previous orbit plus both blade radii plus a 4-unit gap. The entire swept bands are separate, so blades never overlap even when aligned.
- Contact interval: 0.12 seconds, tracked separately for each blade and block.

Upgrade purchase price is `round(200 × total contact DPS / base contact DPS)`. Contact DPS assumes every blade stays against material; it is a balance estimate, not a guarantee against one target. Slower orbits and larger blades change coverage and contact duration rather than this sustained-contact estimate.

| Level | Blades | Contact DPS | Unlock / upgrade cost |
| --- | ---: | ---: | ---: |
| 1 | 1 | 8.33 | 200 |
| 2 | 2 | 17.50 | 420 |
| 3 | 3 | 27.58 | 662 |
| 4 | 4 | 38.68 | 928 |
| 5 | 5 | 50.88 | 1,221 |

Existing purchased levels automatically receive the corresponding blade count. Existing credits are not recalculated. Point defenses retain the weapon's existing one-second interruption behavior.
