# Cluster mortar

Desktop and mobile share all mortar stats and upgrade prices through `weapons.json`.

| Level | Primary impacts | Secondary shots per impact | Scatter radius | Total possible explosions | Unlock / upgrade price |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 0 | — | 1 | 140 |
| 2 | 1 | 2 | 50 | 3 | 420 |
| 3 | 1 | 5 | 100 | 6 | 840 |
| 4 | 3 | 7 | 150 | 24 | 3,360 |
| 5 | 5 | 9 | 200 | 50 | 7,000 |

The primary shell flies toward the aimed point. At levels 4 and 5 it splits halfway through its flight, replacing the parent with three or five shells. Level 4 uses -15°, 0°, +15° relative to the remaining flight direction; level 5 uses -30°, -15°, 0°, +15°, +30°. The middle shell retains the original target. Children start at the parent's visible midair position and finish the remaining flight time.

On each primary impact, random secondary mortar shots launch from that impact point. Targets are uniformly distributed over a disk of the specified scatter radius. Each secondary flies a visible arc for 0.5 seconds and explodes once. Secondary shots never split or spawn further shots. An impact can occur over empty space, just like the original mortar.

All shells remain interceptable by point defense. Landing on reflective material produces the existing reflected projectile instead of an explosion or a secondary volley. Damage remains physical, including against Last Sun.

## Damage and pricing

Every explosion uses the original **4 damage** and **48-unit blast radius**, with a **1.2-second firing interval** at every level. Previous flat damage, blast-radius, and firing-rate upgrades are replaced by the cluster mechanics.

Theoretical total blast DPS is `4 × primaryCount × (1 + secondaryCount) / 1.2`. Prices are `round(140 × upgraded DPS / base DPS)`, giving the table above. This assumes every blast finds material; empty space, scattered targets, reflections, and defenses reduce real damage. Damage can overlap when separate explosions hit the same block.

Level 5 means five total primary shells, not five recursive splitting generations. Existing purchased levels automatically receive the new behavior; previous purchases are not refunded or charged again.
