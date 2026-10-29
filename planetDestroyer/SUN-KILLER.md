# Sun Killer

Three levels, available on desktop and mobile. All stats and prices are configured in `weapons.json`.

| Level | Projectiles | Damage each | Cooldown | Range | Potential DPS | Unlock / upgrade cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 100 | 0.1 s | 500 | 1,000 | 42,000 |
| 2 | 3 | 150 | 0.1 s | 750 | 4,500 | 189,000 |
| 3 | 5 | 200 | 0.1 s | 1,000 | 10,000 | 420,000 |

Projectiles travel at 1,100 world units/second and deal physical damage on their first impact. They damage Last Sun instead of healing it. Standard projectile rules apply: point defense can intercept them and reflective materials can bounce them. The weapon has no piercing or special defense immunity.

Spread is interpreted as **5° between neighboring projectiles**, centered on the aim direction: level 2 uses -5° / 0° / +5°; level 3 uses -10° / -5° / 0° / +5° / +10°.

Potential DPS is `projectileCount × damage / cooldown`, assuming all shots hit. Prices use the base mortar's existing anchor: 140 credits for `4 / 1.2` potential DPS, equivalent to 42 credits per potential DPS. Each listed price is the purchase price for that unlock or upgrade, not a cumulative total. Buying all levels costs 651,000 credits. Range is not included in the DPS calculation; misses and defenses reduce real damage.

The armory and save validation derive maximum level from each weapon's upgrade list. Sun Killer stops at level 3 while existing five-level weapons retain their limits.
