# Charged shot

Hold fire or enable Auto to charge. Current focus distance determines damage, range, and charging time. Moving the focus or ship changes the target charge time while charging. Once elapsed charge reaches that time, the shot fires automatically; the next charge starts on the following update while firing remains active. There is no additional cooldown after discharge. Releasing fire, opening a menu, changing equipment, or traveling cancels the current charge. Charges do not survive page reloads.

| Focus distance | Damage | Charge time | Beam width |
| ---: | ---: | ---: | ---: |
| 400 | 20 | 1 s | 1 |
| 800 | 40 | 2 s | 2 |
| 1,600 | 80 | 4 s | 3 |
| 3,200 | 160 | 8 s | 4 |

Distance and damage scale continuously at 400 range and 20 damage per second of charge. Minimum damage is 1 and minimum charge time is 0.1 seconds. Beam width rises by one at each doubling from 400 range; it remains 4 at the maximum 4,000 range. These are game-coordinate widths, scaled with the arena view.

Upgrade charge caps are **1 / 2 / 4 / 6 / 10 seconds**, corresponding to **400 / 800 / 1,600 / 2,400 / 4,000 range** and **20 / 40 / 80 / 120 / 200 maximum damage**. Focusing beyond the cap fires a capped shot. Very close focus still obeys the damage/time minimums, without extending its range beyond the focus.

The beam pierces all blocks along its path once each, including reflective materials, and never bounces. It is physical damage: Last Sun takes damage rather than healing. Shots of **50 damage or less** can be intercepted; shots **strictly above 50** bypass point defense. Nearby parallel traces account for beam width without duplicating block damage.

The ship's glow and loadout meter build as the shot charges. Discharge draws a bright beam followed by a fading jagged lightning trail. Reduced motion removes glow blur.

Stats and upgrades live in `weapons.json`. Initial unlock price is 500 credits, with upgrade costs 750 / 1,500 / 2,200 / 4,000. Desktop and mobile use the same mechanics; mobile focus is the last arena touch position.
