# Silux — Game Design Document

## 1. Overview

**Genre:** Satirical JRPG  
**Combat:** Turn-based timeline combat  
**Platform:** Web, mobile-first  
**Party size:** 1–4 characters  
**Enemy party size:** 1–8 enemies  
**Maximum level:** 20

The prototype covers the whole journey, including the final battle reversal.

Silux is a turn-based JRPG that deliberately embraces and mocks classic JRPG conventions.

The player begins alone as **Silux**, an otherwise ordinary protagonist who is sent on an increasingly important quest with suspiciously inadequate starting equipment.

The game initially presents a conventional structure:

- travel to new regions;
- fight monsters;
- gain XP and Gold;
- find equipment;
- recruit party members;
- defeat regional bosses;
- reach the Dark Lord's castle;
- save the world.

The characters gradually become increasingly aware of how absurd the conventions governing their world are.

---

# 2. Main Screens

The game contains five primary screens.

## Travel

World progression and destination selection.

Used to:

- select available stages;
- revisit completed stages;
- inspect destinations;
- read party comments about the selected destination;
- begin encounters.

## Battle

Turn-based timeline combat.

Used to:

- Attack;
- Dodge;
- use Skills;
- use Items;
- select targets;
- monitor HP, Stamina, statuses and timeline.

## Equipment

Manage character equipment.

Equipment slots:

1. Hand 1
2. Hand 2
3. Head
4. Torso
5. Legs
6. Feet
7. Ring 1
8. Ring 2
9. Cape
10. Backpack
11. Belt
12. Heart (unlocked by defeating the Castle 2 Lich)

Cape slots unlock after defeating the Countryside 2 boss.

## Team Management

Manage the active party.

Maximum active party:

**4 characters**

## Shop

Buy equipment and consumables using Gold.

---

# 3. Starting Character

## Silux

Starting base statistics:

| Statistic | Value |
|---|---:|
| HP | 50 |
| Attack | 10 |
| Defense | 5% |
| Accuracy | 90% |
| Critical Chance | 10% |
| Critical Damage | 120% |
| Action Cooldown | 10 |
| Maximum Stamina | 30 |

These are **base statistics before equipment bonuses**.

---

# 4. Starting Equipment

Silux starts with intentionally mediocre equipment.

| Slot | Item | Effect |
|---|---|---|
| Hand 1 | Rusty Sword | +2 Attack |
| Hand 2 | Empty | — |
| Head | Empty | — |
| Torso | Worn Shirt | +1% Defense |
| Legs | Old Trousers | +1% Defense |
| Feet | Leather Shoes | -1 Action Cooldown |
| Ring 1 | Empty | — |
| Ring 2 | Empty | — |
| Cape | Empty | — |
| Backpack | Small Backpack | +4 inventory slots |
| Belt | Empty | — |

Effective starting combat statistics therefore include:

- Attack: **12**
- Defense: **7%**
- Effective Action Cooldown: **9**

Equipment cooldown reductions reduce the time between actions.

---

# 5. Combat System

Combat uses a continuous numerical timeline rather than traditional rounds.

Every combatant occupies a position on the timeline.

When a character performs an action, their next action is scheduled according to their effective Action Cooldown.

The player chooses actions for Silux and all active allies. Timeline time pauses while the player chooses an action or target.

Example:

Silux has a base Action Cooldown of 10 (before equipment).

If Silux acts at:

`T = 20`

his next normal action occurs at:

`T = 30`

A fast enemy with Action Cooldown 5 acting at T=20 acts again at:

`T = 25`

Therefore:

**lower Action Cooldown = more frequent actions**

Equipment that provides `-1 Action Cooldown` reduces this delay by 1 timeline unit.

---

# 6. Timeline Animation

When nobody can currently act, game time advances rapidly toward the next scheduled action.

Each timeline unit takes approximately:

**0.1 real seconds**

Example:

If the next character acts in 5 timeline units, approximately 0.5 seconds passes visually.

The timeline should remain visible during combat so the player can anticipate upcoming actions.

---

# 7. Initiative

Normally the player's team receives the initial initiative.

Special encounters can have:

**Ambush**

During an Ambush, enemies receive the initial initiative instead.

After initial initiative, normal timeline rules determine action order.

---

# 8. Basic Actions

Every player character has four primary commands:

- Attack
- Dodge
- Skill
- Item

---

# 9. Attack

A standard Attack uses the character's Attack, Accuracy and Critical statistics.

Default Silux accuracy:

**90%**

Therefore a normal attack has a 90% chance to hit before other modifiers.

## Damage

Defense represents percentage damage reduction.

Basic formula:

`Damage = Attack × (1 - Defense / 100)`

Example:

10 Attack against 5% Defense:

`10 × 0.95 = 9.5 damage`

Final rounding rules remain to be defined.

---

# 10. Critical Hits

Default critical chance:

**10%**

Default critical damage:

**120%**

A successful critical hit therefore deals:

`Normal Damage × 1.20`

unless a skill or equipment effect overrides these values.

---

# 11. Dodge

Dodge consumes the character's current action.

It applies the status:

**Dodge**

Duration:

**20 timeline units**

While Dodge is active, the character has:

**90% chance to avoid an incoming attack**

The status expires according to absolute timeline time, not according to the number of turns taken.

Example:

Dodge activated at:

`T = 30`

expires at:

`T = 50`

A character can attack while Dodge is active, but attacking or using a skill cancels the Dodge status. Using items does not cancel Dodge. Healing also preserves Dodge, including healing skills (an exception to the general skill rule).

---

# 12. Stamina

Stamina represents **physical fatigue**, not magic or mana.

Maximum Silux Stamina:

**30**

Stamina persists between encounters.

It regenerates continuously during battle at:

`0.1 Stamina / timeline unit`

Therefore a character waiting 10 timeline units regenerates:

`1 Stamina`

Stamina can also be completely restored through:

- Long Rest;
- specific Stamina-restoring potions.

Stamina cannot exceed its maximum value.

## Long Rest

Completing an area grants a Long Rest. On the world map, the player can also pay **10 Gold (gp)** to spend a night in the area and receive a full rest.

A full rest restores HP and Stamina completely.

Defeating a boss again also grants a full rest.

---

# 13. Silux Skills

Selecting **Skill** opens the Skill menu.

## Strong Attack

Cost:

**10 Stamina**

Effect:

`150% normal attack damage`

---

## Double Attack

Cost:

**15 Stamina**

Effect:

Perform two attacks.

Each attack has:

**75% Accuracy**

Each attack is resolved independently.

---

## Heart-piercer

Cost:

**20 Stamina**

Critical Chance:

**80%**

Critical Damage:

**500%**

Heart-piercer temporarily replaces the normal critical parameters for that attack.

Heart-piercer is unlocked from the start. Its high power is intended for bosses; spending 20 Stamina on a small enemy that could be defeated in two normal hits wastes resources.

---

# 14. Items

Selecting **Item** opens the shared party inventory.

Items can include:

- healing consumables;
- Stamina consumables;
- status-removal items;
- combat items;
- special/key items.

The shared inventory has **20 base slots**, with similar items stacking up to **99 per stack**. Each stack occupies one slot.

Equipped Backpacks add **4–8 slots** each; Belts add **0–2 slots** each. Their bonuses are cumulative and shared across the team. Four characters can contribute up to 10 slots each, unlocking **40 additional slots** for a maximum capacity of **60 slots**.

`Inventory capacity = min(60, 20 + sum(equipped Backpack and Belt slot bonuses))`

Silux's starting Small Backpack adds 4 slots, giving an initial capacity of **24 slots**.

Excess loot must be dropped. Display:

> "unfortunately you must drop exceeding loot. what a pity. Return to this battle with a bigger purse and redo the battle"

---

# 15. Target Selection

Offensive actions require a target.

When multiple valid enemies exist, the player selects the target by clicking/tapping the enemy directly.

When exactly **one valid enemy remains**, target selection is automatic.

Defeated enemies cannot be targeted.

---

# 16. Enemy Rewards

Each enemy independently defines:

- XP reward;
- Gold reward;
- loot table.

Rewards are processed when that individual enemy is defeated.

The battle does **not** need to end first.

Example:

A battle contains four enemies.

After killing Enemy #1:

- its XP is immediately awarded;
- its Gold is immediately awarded;
- its loot rolls are generated.

The remaining three enemies continue fighting.

---

# 17. Experience

XP is awarded to all available team characters immediately when an enemy dies, including knocked-out characters, rather than only to the active party. Whether each character receives the full reward or a divided share remains to be defined.

Level-ups increase character-specific stats, unlock skills, and enable equipment with level requirements. Growth values and unlock levels remain to be defined for each character.

Character level is calculated from cumulative XP.

Formula:

`Level = min(20, floor(sqrt(totalXP / 100)) + 1)`

Equivalent XP threshold:

`XP required for Level L = 100 × (L - 1)²`

Examples:

| Level | Total XP Required | XP Since Previous Level |
|---:|---:|---:|
| 1 | 0 | — |
| 2 | 100 | 100 |
| 3 | 400 | 300 |
| 4 | 900 | 500 |
| 5 | 1,600 | 700 |
| 6 | 2,500 | 900 |
| 10 | 8,100 | 1,700 |
| 20 | 36,100 | 3,700 |

Maximum level:

**20**

Characters at Level 20 no longer gain useful levels from XP, but enemies continue providing Gold and loot.

---

# 18. Gold

Gold is the game's primary currency.

Each enemy has an individual Gold reward.

Gold is awarded **immediately when the enemy dies**.

Gold can be spent in the Shop.

This deliberately allows the JRPG convention where wild monsters inexplicably carry universally accepted currency.

---

# 19. Loot System

Every enemy type has its own loot table.

Loot entries are **independent probability checks**.

Probabilities do not need to total 100%.

Example:

## Rat

| Item | Chance |
|---|---:|
| Fur | 50% |
| Silver Key | 1% |

When a Rat dies, the game independently rolls:

`Fur → 50% check`

and:

`Silver Key → 1% check`

Therefore a Rat can drop:

- nothing;
- Fur;
- Silver Key;
- Fur + Silver Key.

When multiple enemies of the same type are defeated, each enemy performs its own independent rolls.

Loot is generated when enemies die but presented to the player collectively at the end of the battle.

---

# 20. Travel System

The Travel screen represents world progression as interconnected stages.

Each world location has a button for each battle. Completing a battle unlocks the next battle in sequence. Defeating the area's boss unlocks the next area, following the Desert / Swamp branch rules below.

Current progression:

```text
Sewers 1
   ↓
Sewers 2
   ↓
Sewers 3 — BOSS
   ↓
Countryside 1
   ↓
Countryside 2 — BOSS
   ↓
City 1
   ↓
City 2
   ↓
City 3 — BOSS
   ↓
 ┌───────────────┐
 ↓               ↓
Desert 1       Swamp 1
 ↓               ↓
Desert 2       Swamp 2
 BOSS            BOSS
 └───────┬───────┘
         ↓
Mountain 1
         ↓
Mountain 2
         ↓
Mountain 3
         ↓
Mountain 4 — BOSS
         ↓
Castle 1
         ↓
Castle 2 — BOSS
         ↓
FINAL BOSS
```

---

# 21. Regional Bosses

The playable roster, confirmed recruitment rules, and proposed character stats and skills are documented in [characters.md](characters.md).

The final chapter of every region contains a boss.
- The Mysterious Girl;
- The Big Warrior;
- The Healer.

Boss stages:

- Sewers 3 Rat King - unlocks Mysterious Girl
- Countryside 2 Giant Happy Flower - unlock cape slots
- City 3 Apache elicopter unlocks Big warrior
- Desert 2 Giant scorpion centaur - unlock big swords for the Hero and big warriors
- Swamp 2 Giant slime unlocks Healer
- Mountain 4 Yety - unlocks Healing staff for Mysterious girl and healer
- Castle 2 Lich - heart equipment slot
- Final Boss - Dark king

Bosses can have unique:

- statistics;
- skills;
- AI;
- equipment;
- status effects;
- Gold rewards;
- XP rewards;
- loot tables.

---

# 22. Desert / Swamp Branch

After completing City 3, two routes become available:

- Desert
- Swamp

The player can initially choose either route.

Completing either regional route is sufficient to unlock the Mountain.

The other route remains available.

Father Patch is recruited only by defeating the Swamp boss. If the player never returns to complete the Swamp, the team remains at three characters. The final reversal likewise uses three opposing heroes if the original team had only three; it does not add a missing Healer.

Therefore the player can later return and complete the alternative region for:

- XP;
- Gold;
- loot;
- equipment;
- additional dialogue;
- optional content.

The choice changes progression order but does not permanently remove content.

---

# 23. Revisiting Areas

Previously completed stages remain accessible.

Players can revisit them to:

- fight enemies again;
- gain XP;
- earn Gold;
- obtain missing drops;
- test new equipment;
- complete optional content.

Travel progression and completed stages are persistent.

---

# 24. Travel Dialogue

Every active party member has a destination-specific comment.

When the player selects a stage on the Travel screen, the party comments on the destination before travel begins.

Example:

## Sewers 1

**Silux:**

> "The fate of the world depends on us. Naturally, we begin in the sewers."

## Castle 1

**Silux:**

> "Finally, the Dark Lord's castle."

**Grond:**

> "So we're almost finished?"

**Father Patch:**

> "At least two boss transformations remain."

**Lyra:**

> "Three if the game sells well."

These comments are a major vehicle for the game's satire.

---

# 25. Narrative Tone

The game is intentionally:

- ironic;
- irreverent;
- self-aware;
- satirical toward JRPG conventions.

The game should not merely make jokes *about* JRPGs.

Whenever possible, the joke should emerge from **actual gameplay mechanics**.

Examples:

- monsters carrying Gold;
- merchants refusing to help save the world without payment;
- NPCs waiting indefinitely for the protagonist;
- increasingly ridiculous equipment upgrades;
- mysterious characters with extremely predictable secrets;
- characters commenting on boss phases;
- game balance treated as a law of physics.

---

# 26. Story Premise

Silux lives in **Starting Village**.

A Dark Lord threatens the world.

Silux is identified as the Chosen One, primarily because he is the only conveniently available young adult.

He receives mediocre equipment and is sent to save civilization.

The adventure initially follows the expected JRPG structure.

Silux eventually recruits additional companions and travels through increasingly dangerous regions toward the Dark Lord's castle.

Over time, the party notices that the world seems suspiciously structured around heroic adventures.

---

# 27. The Dark Lord

The Dark Lord is eventually revealed to be the **previous hero**.

He previously completed essentially the same journey as Silux.

After defeating the previous Dark Lord, he discovered that the world continuously recreates the same narrative cycle:

```text
Unknown Hero
    ↓
Weak Monsters
    ↓
Regional Problems
    ↓
Evil Kingdom / Empire
    ↓
Ancient Revelation
    ↓
Dark Lord
    ↓
World Saved
    ↓
New Dark Lord
    ↓
New Hero
```

The current Dark Lord wants to break this cycle.

His intimidating title is largely propaganda.

His actual name may simply be:

**Kevin**

---

# 28. Ending

If Silux defeats the final boss, the game initially presents a conventional JRPG ending.

The Dark Lord falls.

The world celebrates.

Silux becomes a legendary hero.

Credits may even begin or appear to begin.

Then:

**20 YEARS LATER**

Silux is sitting on the Dark Throne.

He has become the new Dark Lord.

Not necessarily because Silux became evil.

The world simply requires someone to occupy the narrative role.

Eventually a new group of adventurers reaches his castle.

The new party mirrors the recruited team and contains recognizable archetypes:

- The Hero;
- The Mysterious Girl;
- The Big Warrior;
- The Healer (only if Father Patch was recruited).

The game returns to the Battle screen.

But this time:

**the player controls Silux as the boss.**

---

# 29. Final Battle Reversal

Silux must fight the new player-character party.

The opposing party uses the exact equipment Silux's team wore in the battle against the Dark King. Silux instead wears overpowered dark equipment.

As the new Dark King, Silux can easily kill the heroes. If he defeats them, display **"SAVE SCUMMING IN PROGRESS"** and restart the battle.

Losing this reversal battle is a valid ending, rather than triggering the normal defeat rollback.

Mechanically, the encounter reverses the relationship the player experienced throughout the game.

The heroes may:

- heal themselves;
- use consumables;
- Dodge;
- exploit status effects;
- use powerful equipment;
- coordinate attacks.

Silux experiences the same behavior previously inflicted on every boss.

A special boss action is:

## Monologue

Silux attempts to explain the true nature of the endless heroic cycle.

The action requires a long timeline delay.

The heroes are under no obligation to politely wait for him to finish.

Monologue cannot change the outcome.

## Finish the Game

Selecting the skill **"finish the game"** goes directly to the ending screen.

---

# 30. Epilogue

The reversal can end through Silux's defeat or by selecting **"finish the game"**. Defeating the heroes restarts the reversal battle instead of ending the game.

The epilogue continues the cycle:

Then somewhere else, another ordinary young person receives:

**Rusty Sword**

A new adventure begins.

The cycle continues.

---

# 31. Technical Direction

The prototype should be implemented as a single:

**HTML + CSS + JavaScript page**

Requirements:

- mobile-first interface;
- HTML Canvas for interactive battle/travel graphics;
- touch and mouse controls;
- persistent save data through `localStorage`;
- no backend required for the prototype.

Persistent data should include at minimum:

- character XP;
- character levels;
- current HP;
- current Stamina;
- Gold;
- inventory;
- equipment;
- recruited characters;
- active party;
- completed stages;
- unlocked stages;
- Desert/Swamp progression;
- collected items.
- pre-battle state for defeat rollback;
- the team's equipment from the Dark King battle for the final reversal.

## Defeat and Save Scumming

On a normal party defeat, display:

> "Gods of gaming see your failure and despise you. Anyway by the powers of Save Scumming, you return just before the battle happening, and a little bit wiser about what you will encounter."

Restore the game to just before the battle, rolling back combat changes and rewards earned during that attempt. The player's knowledge of the encounter is retained naturally.

There is no escape command. During normal battles, the player can select **SAVE SCUM** to return to the world map in the exact state from before the battle started. This rolls back HP, Stamina, consumables, XP, Gold, loot, level-ups, and any other changes from that attempt.

## Knockout and Recovery

A character at 0 HP is knocked out and remains so until the battle ends; there is no in-battle resurrection. Knocked-out characters still receive XP.

After an ordinary victory, knocked-out characters revive with **half their maximum HP**. After a boss victory, they revive with **full HP**, and the boss's full rest restores the team's HP and Stamina. Half-HP rounding remains to be defined.

Normal party defeat restores the pre-battle state instead of applying victory recovery.

The final reversal uses its own restart and ending rules from section 29.

---

# 32. Systems Still To Define

The following systems require further design before the game specification is complete:

- review and balance the proposed character stats and skills in characters.md;
- enemy roster;
- regional boss stats, skills, and encounter mechanics (identities and unlocks are defined in section 21);
- finalize character growth and skill unlock levels proposed in characters.md;
- exact damage rounding;
- equipment catalogue;
- equipment stat system;
- excess-loot selection and capacity reduction when changing equipment;
- shop inventory and prices;
- enemy AI;
- status-effect catalogue;
- individual stage encounters;
- save/load/reset UI;
- detailed story events and dialogue.
- minimum Action Cooldown and initiative tie-breaking;
- XP reward division and recruitment starting XP;
- SAVE SCUM availability during the final reversal.
