# Sun Killer

Three levels, available on desktop and mobile. All stats and prices are configured in `weapons.json`.

Projectiles are cyan. A direct projectile hit on either Last Sun material (Solar liquid or Solar core, including newly grown blocks) creates a cyan explosion centered on that block. Each hit independently rolls an integer radius uniformly from **10–100 / 20–150 / 30–200** at levels 1 / 2 / 3. Each upgrade adds 10 to the minimum and 50 to the maximum.

Explosion damage equals the rolled radius and is applied as physical damage to each living block whose center is within that radius, without distance falloff. It does not heal solar material. A direct hit can explode even if it kills the block or exhausts the projectile; the blast does not consume additional projectile damage. Collateral blast kills do not trigger further blasts. Overkill projectiles skip blocks already destroyed by their explosion before continuing, so they never detonate on empty cells. Non-solar impacts keep their existing behavior. Prices and listed potential DPS remain based on direct projectile damage; the solar-only blast bonus is additional.

| Level | Projectiles | Damage each | Cooldown | Range | Potential DPS | Unlock / upgrade cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 100 | 0.1 s | 1,000 | 1,000 | 42,000 |
| 2 | 3 | 150 | 0.1 s | 1,250 | 4,500 | 189,000 |
| 3 | 5 | 200 | 0.1 s | 1,500 | 10,000 | 420,000 |

Projectiles travel at 1,100 world units/second and deal physical damage. On destroying a block, the projectile subtracts its remaining HP from the damage budget and continues with any excess damage. A nonlethal or exact-lethal hit exhausts the projectile. Multiple blocks can be hit within one simulation step; travel continues consuming range. They damage Last Sun instead of healing it. Standard projectile rules apply: point defense can intercept them and reflective materials can bounce them. The weapon has no special defense immunity. Reflections preserve its remaining damage budget.

Every projectile gets an independent random offset between **−1° and +1°**. The nominal spread remains **5° between neighboring projectiles**, centered on the aim direction: level 2 uses -5° / 0° / +5°; level 3 uses -10° / -5° / 0° / +5° / +10°.

Potential DPS is `projectileCount × damage / cooldown`, assuming all shots hit. Prices use the base mortar's existing anchor: 140 credits for `4 / 1.2` potential DPS, equivalent to 42 credits per potential DPS. Each listed price is the purchase price for that unlock or upgrade, not a cumulative total. Buying all levels costs 651,000 credits. Range is not included in the DPS calculation; misses and defenses reduce real damage.

The armory and save validation derive maximum level from each weapon's upgrade list. Sun Killer stops at level 3 while existing five-level weapons retain their limits.
