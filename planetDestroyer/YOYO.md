# Automatic yoyo combos

Hold fire or enable Auto. No trick buttons, timing windows, or manual combos are required. Desktop and mobile use the same behaviors and `weapons.json` tuning.

At launch, the yoyo samples eight directions around the ship within weapon range. Blocks in five or more directions select **String Storm**; otherwise it selects **Surface Dance**. The selection stays fixed until the yoyo returns. Only one yoyo may be active. A started combo finishes even after the trigger is released; holding fire starts the next combo and re-evaluates terrain.

## Surface Dance

1. **Sleeper:** automatically throw to the nearest exposed block and hold a spinning yoyo there.
2. **Walk the Dog:** trace a preplanned route of connected exposed boundary blocks, staying within launch range.
3. **Around the World:** swing away in a wide arc and loop back toward the launch point.
4. **Snap Return:** chase the ship's current position and catch the yoyo.

## String Storm

1. **Trapeze:** throw to a string anchor between the ship and nearby terrain.
2. **Figure Eight:** sweep crossing loops oriented toward the nearest terrain. Loop size adapts to the cavity distance within the weapon's range budget. The glowing string forms a triangle between ship, anchor, and yoyo.
3. **Snap Return:** pull back to the ship's current position.

Both combos use swept collision, deal physical damage, and remain vulnerable to point defense. Reflective materials interrupt the combo into a return. Each trick/figure-eight pass can hit a block once, avoiding frame-rate-dependent damage. Menus pause animation; switching weapons or destinations clears the active yoyo.

## Upgrades and presentation

Existing unlock price, upgrade costs, damage, and cycle modifiers remain. Base duration is three times the configured `cycleDuration`, followed by the final catch; a six-second lifetime prevents a lost yoyo. Base contour length is 10 steps, adding four each upgrade (26 at level 5). Levels 3 and 5 each add one figure-eight pass, reaching three. These additions expand the actual route and combo rather than only increasing damage.

The yoyo is drawn as a spool with a glowing string, distinct from bladed weapons. Gameplay does not display combo or trick text beside the yoyo or in the arena status. Trajectories are transient and are freshly selected after page reload.
