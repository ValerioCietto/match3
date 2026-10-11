# Strategic Battle — Air Command

An HTML5 Canvas strategy game using CSS and vanilla JavaScript. Serve the repository over HTTP (for example `python -m http.server 8000`) and open `/strategicBattle/`. No build or dependencies required. ES modules require an HTTP server rather than opening the HTML with `file://`.

Select a blue node, then another node to send the chosen percentage of population. Select the same node again, or use Manage outpost, for the radial purchase menu. Escape clears selection. Node controls below the command panel support keyboard play. Use pause and 1×/3×/10× simulation speed as needed.

Levels in `levels.json` use `[x, y, type, faction, population?]` arrays on a 1000 × 600 plane. Population defaults to 10. “battack” is interpreted as barracks. Attack groups are rendered as warplanes; each carries the sent population. All factions inherit default stats: generation 0.2/s, attack 1, defence 1, speed 15px/s, productivity 1. Enemy and Neutral have visible stat overrides. Neutral never sends attacks.

The simulation advances every 0.1 simulated seconds and preserves fractions. Casualties = attacking population × faction attack / (defending faction defence + node wall bonus). Overwhelming attacks capture the node with surviving attackers; ties leave it empty under its current owner. Friendly arrivals reinforce. Walls persist through capture.

Income per node per second: village 0.1, city 0.2, mine 0.5, multiplied by faction productivity. Tower/barracks income is zero. Barracks generate zero population. Only attacks launched from a barracks receive 1.5x faction base attack. Attack power is fixed on the aircraft at launch: later capture or conversion of its source does not change it, and owning other barracks has no effect. Reinforcements redeployed from another node use that new source type. Other types use faction population generation. Change type: 60 gold (village/tower/barracks/mine). Village to city: 100 gold. Starting treasury: 120. Capture all nodes and eliminate remaining enemy aircraft to win. Defeat requires losing all nodes and aircraft.

The campaign contains 10 missions, with difficulty shown in each mission briefing. Player starting troops fall from 20 to 10 while enemy troops rise from 20 to 98. Enemy cities increase from zero to six, and enemy territory expands from two to seven outposts. Later maps retain nearby neutral villages for expansion. Faction stats, income rules, and the 120-gold starting treasury stay consistent. Enemy cities earn gold under the normal economy rules; the current AI issues troop attacks but does not purchase upgrades.

Edit the fifth entry of a node array to set its starting population; omit it to use 10. All campaign maps and briefings are in `levels.json`.

Run simulation and campaign progression checks: `node strategicBattle/engine.test.mjs`.

Building defences:

- Towers grant a non-stacking 1.2? defence multiplier to every owned node, including themselves. Ownership and conversion changes apply immediately.
- Every tower targets the nearest hostile aircraft within 300 map pixels, dealing 1 population damage per simulated second. Each installation targets one aircraft, even if it is headed to another node; friendly aircraft are ignored. Neutral towers also fire on other factions. Damage preserves fractional population and destroyed aircraft cannot land. Lasers from separate installations can focus on the same aircraft. Select an installation to see its range; active beams and fractional aircraft counts are drawn on the map.
- Wall tier 1 costs 50 gold and adds 10 defence, shown as a dashed ring. Tier 2 costs 150 and adds another 20 defence (+30 total), shown as a solid wall with four openings and a wider dashed ring. Tier 3 costs 250 and adds a tower-style laser, retaining +30 defence. It does not grant the tower faction bonus or a second laser to an existing tower. Three tiers maximum. Wall tiers persist through captures and type changes.
