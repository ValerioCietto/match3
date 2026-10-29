# Branching chain lightning

Implemented in both desktop and mobile. A discharge first finds exposed terrain within the existing aim cone and range. A bright trunk connects the ship to that impact; lightning then grows through nearby living blocks as a tree.

| Weapon level | First tier | Second tier | Third tier |
| --- | --- | --- | --- |
| 1 | 1 branch, 3–5 blocks | — | — |
| 2 | 2 branches, 6–8 blocks each | — | — |
| 3 | 2 branches, 6–8 blocks each | Each splits into 2: 4 branches, 4–6 blocks each | — |
| 4 | 2 branches, 6–8 blocks each | 4 branches, 4–6 blocks each | Each splits into 2: 8 branches, 1–3 blocks each |
| 5 | 2 branches, 7–13 blocks each | 4 branches, 5–11 blocks each | 8 branches, 2–8 blocks each |

Every branch independently rolls a uniformly random integer length in its tier's range. The impact block counts toward the first branch. Child branches begin at their parent's endpoint; shared fork points are not damaged again or counted as new child hits. Branch directions diverge at forks, with target selection favoring forward nearby blocks. The existing 48-unit maximum jump distance applies to every link. Branches stop early when they run out of unvisited blocks; disconnected material beyond jump range is not reached.

One shared visited set prevents duplicate hits anywhere in the discharge. Full populated terrain permits 3–5 / 12–16 / 28–40 / 36–64 / 50–134 distinct hits at levels 1–5. Jagged electric paths draw every branch separately. Energy classification is preserved: point defense cannot intercept it, and Last Sun blocks heal instead of taking damage.

All branching counts and length ranges are configured in `weapons.json` through base stats and upgrade modifiers. Existing damage, cooldown, range, unlock price, and upgrade prices remain unchanged. Existing owned levels automatically gain the new tree structure.
