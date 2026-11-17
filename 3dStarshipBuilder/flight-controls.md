# 2.5D flight controls

Implemented in `flight25.js`, `flight-physics.js`, `flight-maneuvers.js` and `barrel-roll.js`.

Orientation and velocity are independent. Releasing thrust activates braking thrusters; there is no passive friction. Holding Shift disables inertial compensation and preserves momentum, including lateral drift. Main thrust still works with Shift. The existing on-screen Brake button explicitly activates braking thrusters.

| Input | Implemented behavior |
| --- | --- |
| W / S | Forward / reverse thrust |
| A / D | Steering |
| Shift | Inertial compensation off |
| WW | Afterburner: 3x acceleration for 1 second, unchanged speed cap, 2-second cooldown |
| SS | Emergency brake: 4x braking thrust until stopped, including lateral drift; overrides Shift and held thrust, cancels afterburner; 2-second cooldown |
| AA / DD | Left / right dash: 4 units in 0.22 seconds, 0.8-second cooldown |
| Shift + AA / DD | Dash followed by lateral momentum; keep Shift held to preserve it |
| WS | Backward loop: 1.2 seconds, 3-second cooldown, weapons disabled throughout |
| AD / DA | Right / left barrel roll: 4 units, 0.6 seconds, 1.5-second cooldown |
| Space | Fire projectile weapons; lasers acquire automatically |

The sequence window is configurable in the arena, from 100 to 600 ms (default 280 ms). Release the first key before pressing the second; holding a key, auto-repeat and simultaneous directional chords do not trigger sequences. Arrow keys have the same mappings. Pause, focus loss, reset and closing the arena clear pending sequences.

The backward loop changes actual altitude and pitch. Projectile collisions check height relative to the combat plane; the ship can still be hit while close to the plane. Laser targeting also checks altitude. A ground shadow indicates the ship's projected location. The loop returns to the combat plane without teleporting to an enemy-relative location.

Barrel rolls have no invulnerability, permit firing and have no energy cost, as confirmed. Their lateral movement is the only evasive protection. Damage and statuses continue during maneuvers.

Technician exceptions are preserved: one or two physical omni engines use car steering with instant thrust response; three or more use eight-direction movement. Mirrored engines count twice. Technician maximum turn speed retains its 10x bonus.

SW, AW, DW, SA and SD have no advanced-maneuver bindings. Ordinary key movement is preserved, but the proposed forward loop and diagonal/reverse boosts are not implemented. The separate 3D free-flight mode is unchanged.
