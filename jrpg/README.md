# Silux prototype

Open `index.html` to begin, then choose a battle on `world.html`. `combat.html?battle=sewers-1` is the first encounter. All 19 journey battles and eight bosses are defined in `battles.json`; enemy definitions are shared by encounter lineups.

For automatic JSON loading, serve this directory with any static web server. For example, from the repository root, if Python is installed:

```sh
python -m http.server 8080 --directory jrpg
```

Visit `http://localhost:8080`. No application backend or build step is required. If opening the HTML files directly, the battle screen offers a file picker for `battles.json` when the browser blocks automatic loading. Browser storage must be available to move between pages and retain progress.

## Combat

The world map links to `bestiary.html`, which lists every monster and boss from `battles.json`, including combat stats, special attacks, encounter locations, and loot chances. Search by name or encounter and filter by region or boss status. All entries are visible from the start, and browsing does not change saved progress. Direct-file access offers a JSON file picker if automatic loading is blocked.

- The timeline pauses on every player-controlled turn, including target selection. Tap the enemy artwork or its card to target it; a single valid target is selected automatically.
- Attack, Dodge, skills, and shared healing/Stamina potions are available. Allies are selected directly for healing and support. Enemy special attacks use their catalogue-defined action intervals. Specials include life drain, self-healing, poison, Gold theft, skipped actions, and self-damaging attacks.
- Enemies grant XP and Gold immediately on death. Loot is rolled independently on death and collected on victory. All changes remain local to the attempt until victory is saved.
- SAVE SCUM, defeat, reloading, or leaving an unfinished battle discard the attempt. Normal victories revive KOed heroes at half HP; boss wins fully rest the party, including replays.
- World-map resting costs 10 Gold. Defeating regional bosses recruits companions and unlocks equipment choices. The world-map party cards link to `hero-manager.html` for equipping items.

## Hero manager

Select a recruited hero, then one of the 12 equipment slots. The manager lists suitable items in the shared inventory, previews stat and capacity changes, and saves equip/unequip actions immediately. Equipped items leave the inventory; removed or replaced items return to it. Copies cannot be shared simultaneously by different heroes or ring slots.

Gear bonuses are defined in `equipment.js` and used by both the manager and combat. Existing saves retain their weapons, bags, and resource values while gaining explicit starter armor slots. Big swords automatically return offhand equipment to inventory. Changes that cannot fit all returned items, or would shrink capacity below the occupied slot count, are rejected without changing the save. Changing equipment never restores HP or Stamina.

Equipment is obtained through `battles.json` loot tables: early enemies can drop caps and shields; bosses award additional gear, including two Big Swords at the Desert boss and two Healing Staffs at the Mountain boss. Previously completed battles can be replayed to collect these drops. Cape and Heart slots, specialist weapons, hero restrictions, and equipment level requirements are enforced.

## Shops

Three shop entrances appear on the world map. The Sewer shop opens after Rat King (`sewers-3`), the City shop after Apache Helicopter (`city-3`), and the Castle shop after Lich (`castle-2`). Unlocked shops remain accessible on return visits. `shop.html?shop=sewers` opens a shop; direct links also enforce the unlock rule.

- `shops.json` defines the three merchants, dialogue, themes, and regional boss requirements.
- `shop.json` defines all 28 offers, including prices, quantities in stock, descriptions, equipment bonuses, and level/class restrictions. Both files use expanded, two-space JSON formatting.
- Sewer merchandise is cheap and barely functional, city merchandise is new and dependable, and castle merchandise is rare salvage from fallen heroes. Castle prices include the blood-polishing service.
- `stock: null` means unlimited supply. Castle equipment has limited quantities that persist in the save. Gold is deducted only when the complete purchase fits the inventory and the save succeeds. Consumables stack to 99; purchases never discard overflow.
- Purchased equipment definitions are stored with the save. The hero manager and combat therefore recognize purchases without needing to fetch the shop catalogue again. Existing purchases retain their equipment bonuses when the catalogue is edited. Epic Big Swords and Healing Staffs count toward the corresponding skill requirements.

If direct `file://` access blocks JSON loading, the map offers a picker for `shops.json`, and the shop offers pickers for both JSON files. A static server loads them automatically.

## First balance pass

Enemy stats, encounters, and rewards are initial tuning values. Full enemy XP goes to each recruited hero, including KOed heroes. Recruits join at Silux's cumulative XP. Damage rounds to the nearest integer with a minimum of 1; half-HP recovery and healing round up. Same-time actions use party order, then enemy order. All actions use the actor's Action Cooldown.

The starting shared inventory includes three Healing Potions and one Stamina Potion. Healing Potions restore 50% maximum HP; Stamina Potions restore all Stamina. Characters use the growth proposals from `characters.md`. Big Sword gives +6 Attack and +2 Action Cooldown; Healing Staff gives +2 Attack. Other companion starting weapons currently have no stat bonuses. Skills with weapon requirements require the specified equipped weapon, and their explicit resurrection effects override ordinary KO rules.

The complete standard journey is playable through the Dark King. The subsequent playable Dark King reversal is not implemented yet. Poison deals direct HP damage each timeline unit, refreshes without stacking, expires after 50 units, and clears on KO or battle end. Terms and Conditions removes poison. Gold theft rounds percentage losses up, cannot take more Gold than the party owns, and is committed only on victory. The equipment snapshot for the reversal is saved on defeating the Dark King.

## Checks

```sh
node --test jrpg/tests/combat.test.js jrpg/tests/equipment.test.js jrpg/tests/shops.test.js jrpg/tests/enemy-specials.test.js jrpg/tests/hero-skills.test.js
```

Run the command from the repository root. Tests cover encounter validation, progression, combat timing, rewards, rollback, inventory capacity, KO recovery, recruitment, skills, and a simulated full journey.

`node jrpg/tests/browser-smoke.js` additionally exercises the page flow with an installed headless Chrome. It uses an isolated temporary browser profile; set `CHROME_PATH` when Chrome is installed elsewhere. This check requires permission to launch a working browser renderer.

Silux?s Dramatic Entry and Lyra?s Regal Intimidation, Plot Armor, and Overpowered Healing can each be used once per battle. Used skills remain visible with an explanation. Heroic Second Wind cancels Dodge. Regal Intimidation increases both the next action time and subsequent cooldown of every living enemy by 20t for that battle. Friendship Power requires a Healing Staff; Overpowered Healing only requires level 20.
