# Silux — Characters

Companion identities and recruitment below are confirmed. Silux's starting stats and three starting skills come from [design.md](design.md). Other stats, growth, equipment, and skills below are **proposed design values**, ready for review and balancing.

## Shared rules

- Maximum party: four characters. The player controls every ally's actions.
- Action Cooldown is measured in timeline units; lower values mean more frequent actions. Time pauses during player decisions.
- All available characters receive XP when an enemy dies, including KOed characters. Full versus divided XP rewards and starting XP for new recruits remain undecided.
- Level cap: 20. Level-ups increase stats, unlock skills, and allow level-restricted equipment.
- Stamina regenerates at 0.1 per timeline unit. Every character has Attack, Dodge, Skill, and Item commands.
- Attacks and skills cancel Dodge, except healing skills. Items and healing preserve it.
- KO lasts until battle end. Ordinary victories revive KOed allies at half maximum HP; boss victories fully restore the party. No skill resurrects a character during combat.
- Backpack and Belt capacity bonuses contribute to the shared inventory, up to 60 slots total.

## Roster and recruitment

| Character | Archetype | Recruitment | Proposed role |
|---|---|---|---|
| Silux | The Hero | Available from the start | Versatile single-target attacker and boss damage |
| Lyra | The Mysterious Girl | Defeat Rat King, Sewers 3 | Fast support and precise attacks |
| Grond | The Big Warrior | Defeat Apache helicopter, City 3 | Durable attacker who protects allies |
| Father Patch | The Healer | Defeat Giant Slime, Swamp 2 | Efficient healing and status removal |

The Swamp remains accessible after choosing the Desert. Skipping it leaves the team at three characters, including the mirrored party in the final reversal.

## Base stats and proposed growth

These are level-1 values before equipment. Companion values and all growth values are proposals.

| Statistic | Silux | Lyra | Grond | Father Patch |
|---|---:|---:|---:|---:|
| HP | 50 | 40 | 80 | 45 |
| Attack | 10 | 8 | 14 | 6 |
| Defense | 5% | 3% | 10% | 4% |
| Accuracy | 90% | 95% | 85% | 90% |
| Critical Chance | 10% | 15% | 5% | 5% |
| Critical Damage | 120% | 150% | 150% | 120% |
| Action Cooldown | 10 | 8 | 13 | 11 |
| Maximum Stamina | 30 | 30 | 25 | 40 |
| HP per level | +8 | +6 | +12 | +7 |
| Attack per level | +2 | +1.5 | +3 | +1 |
| Maximum Stamina per level | +1 | +2 | +1 | +2 |

Proposed growth formula: `base + growth × (level - 1)`. Other base stats remain constant with level; equipment and skills modify them. Damage and fractional stat rounding remain to be finalized.

## Silux — The Hero

An ordinary young adult chosen because he was available. His increasingly practical questions expose the world's absurd rules.

Confirmed starting equipment: Rusty Sword, Worn Shirt, Old Trousers, Leather Shoes, and Small Backpack. See design.md for bonuses.

| Skill | Availability | Stamina | Effect |
|---|---|---:|---|
| Strong Attack | Start | 10 | 150% normal attack damage |
| Double Attack | Start | 15 | Two independent normal-damage attacks, each with 75% Accuracy |
| Heart-piercer | Start | 20 | One attack with 80% Critical Chance and 500% Critical Damage |
| Heroic Second Wind | Level 5 | 10 | Heal self for 30% maximum HP; preserves Dodge |
| Mandatory Training Arc | Level 10 | 15 | Next two basic attacks deal 150% damage; does not stack with itself |
| Flurry of Normal Attacks | Level 20 and big sword equipped | 30 | Thirty attacks at random enemies, 80% damage, 75% accuracy. |

Heart-piercer is deliberately powerful against bosses and inefficient against weak enemies that fall in two normal hits.

Proposed line: “Could the prophecy have included a travel allowance?”

## Lyra — The Mysterious Girl

Lyra knows suspiciously much about the plot and treats obvious revelations as confidential information. Her fast actions let her alternate offense, support, and items.

Proposed starting equipment: Dagger, Travel Robe, Soft Boots, Small Backpack. Exact equipment bonuses remain to be defined.

| Skill | Proposed availability | Stamina | Proposed effect |
|---|---|---:|---|
| Suspicious Precision | Recruitment | 8 | One 100%-Accuracy attack for normal damage; target Dodge still applies |
| Foreshadow | Recruitment | 10 | Reveal a target's next intended action and target until it acts |
| Plot Armor | Level 6 | 12 | One ally gets Blessed status: takes 25% less damage for 20 timeline units; refreshes instead of stacking |
| Healing Footnote | Level 10 and Healing Staff equipped | 12 | Heal a living ally for 25% maximum HP; preserves Dodge |
| Overpowered Healing | Level 20 and Healing Staff equipped | 30 | Revives all allies, Heal all allies fully, gives blessed to all team |

Healing Staff access requires defeating the Mountain 4 Yeti. Lyra offers backup healing without replacing Father Patch's stronger healing role.

Proposed line: “I cannot tell you my secret yet. We have not reached the appropriate chapter.”

## Grond — The Big Warrior

Grond takes genre conventions literally and asks the questions everyone else avoids. He hits hard, acts slowly, and can protect a fragile teammate.

Proposed starting equipment: Heavy Axe, Padded Armor, Work Boots, Small Backpack. Exact equipment bonuses remain to be defined.

| Skill | Proposed availability | Stamina | Proposed effect |
|---|---|---:|---|
| Heavy Swing | Recruitment | 10 | One attack for 175% normal damage, using Grond's Accuracy |
| Stand Behind Me | Recruitment | 10 | Redirect single-target attacks against one chosen living ally to Grond for 20 timeline units; excludes area attacks and ends if Grond is KOed |
| Unreasonably Large Swing | Level 8 | 18 | Attack every living enemy for 75% normal damage, resolving hit and critical checks separately |
| Structural Damage | Level 14 | 20 | One attack for 200% normal damage, ignoring half the target's Defense |
| BERSERK | Level 20 and big sword equipped | 30 | Attacks all enemies with sure hit and from now until the end of battle Grond deals double damage |

Defeating the Desert boss unlocks big swords for both Grond and Silux. Big swords occupy both Hand slots.

Proposed line: “If the door is locked, why do we keep attacking the things that are not the door?”

## Father Patch — The Healer

Father Patch interprets balance changes as divine intervention. He specializes in keeping living allies alive; even his faith cannot revive someone before the battle ends.

Proposed starting equipment: Walking Stick, Clerical Robe, Sandals, Small Backpack. His basic healing skills do not require a Healing Staff, so he can heal immediately after recruitment.

| Skill | Proposed availability | Stamina | Proposed effect |
|---|---|---:|---|
| Minor Miracle | Recruitment | 8 | Heal one living ally for 35% maximum HP; preserves Dodge |
| Terms and Conditions | Recruitment | 6 | Remove one removable negative status from a living ally; cancels Dodge because it is not HP healing |
| Group Therapy | Level 10 | 20 | Heal every living ally for 25% maximum HP; preserves Dodge |
| Extended Coverage | Level 14 and Healing Staff equipped | 18 | Heal one living ally for 70% maximum HP; preserves Dodge |
| Overpowered Double Edge | Level 20 and Healing Staff equipped | 30 | Revives all to 1hp, heal all fully, attacks every enemy once dealing 1 damge for every hp healed. |

Healing Staff access unlocks after defeating the Mountain boss. Status-removal priority remains to be defined with the status catalogue.

Proposed line: “The gods have heard your prayers. They are adjusting the numbers.”

## Confirmed equipment progression

| Boss defeated | Unlock |
|---|---|
| Countryside 2 — Giant Happy Flower | Cape slots |
| Desert 2 — Giant Scorpion Centaur | Big swords for Silux and Grond |
| Mountain 4 — Yeti | Healing Staff for Lyra and Father Patch |
| Castle 2 — Lich | Heart equipment slot |

Exact equipment catalogue, class restrictions beyond these unlocks, and level requirements remain to be defined.

## Silux — The New Dark King

Confirmed final reversal rules:

- The player controls Silux wearing overpowered dark equipment.
- The opposing heroes mirror the equipment the original team used against the Dark King. If Father Patch was never recruited, there are only three heroes.
- Defeating the heroes displays **SAVE SCUMMING IN PROGRESS** and restarts the battle.
- Monologue takes a long timeline delay and cannot change the outcome.
- Losing is a valid ending.
- Selecting **finish the game** goes directly to the ending screen.

Dark equipment values, boss skills beyond Monologue and finish the game, and the opposing heroes' AI remain to be designed.
