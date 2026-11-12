import {test} from 'node:test';
import assert from 'node:assert/strict';
import {factions,resolveFaction} from './factions.js';
import {catalogForFaction,preset} from './presets.js';
import {validateProject} from './model.js';
import {recommendedStats} from './stats.js';
test('faction links default safely and presets use their faction library',()=>{
 assert.equal(resolveFaction(null),'human');assert.equal(resolveFaction('bad'),'human');assert.equal(resolveFaction('Jared'),'jared');assert.equal(resolveFaction('__proto__'),'human');
 for(const [faction,spec] of Object.entries(factions)){
   for(const id of Object.keys(catalogForFaction(faction))){const parts=preset(id);assert.ok(parts.every(p=>spec.parts.includes(p.type)),id);const project=validateProject({version:1,name:id,faction,parts});assert.equal(project.faction,faction);assert.ok(Object.values(recommendedStats(parts)).every(Number.isFinite));}
 }
 assert.notDeepEqual(Object.keys(catalogForFaction('human')),Object.keys(catalogForFaction('jared')));
 assert.notDeepEqual(factions.jared.parts,factions.technician.parts);
});
