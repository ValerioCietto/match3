import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RADII,sampleEllipsoid,chooseEnemy,segmentHitsBox,upgradeCost,upgradeValue} from './core.mjs';
test('spawn positions fill all octants inside the ellipsoid with uniform volume density',()=>{
 let seed=12345;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 let squared=0;const octants=new Set();
 for(let i=0;i<20000;i++){const p=sampleEllipsoid(random),r2=p.reduce((s,v,j)=>s+(v/RADII[j])**2,0);assert.ok(r2<=1+1e-12);squared+=r2;octants.add(p.map(v=>v>0?1:0).join(''));}
 assert.equal(octants.size,8);assert.ok(Math.abs(squared/20000-.6)<.015);
});
test('original shooter enemy odds, health and rewards are retained',()=>{
 assert.deepEqual([0,.1999,.2,.3999,.4,.8899,.89,.9899,.99].map(x=>chooseEnemy(x).name),['very_small','very_small','stealth','stealth','normal','normal','special_ops','special_ops','boss']);
 assert.equal(chooseEnemy(.999).hp,80);assert.equal(chooseEnemy(.999).bounty,50);
});
test('swept collision catches fast bullets and rejects off-axis misses',()=>{
 assert.ok(segmentHitsBox([0,0,-10],[0,0,10],[0,0,0],1));
 assert.ok(segmentHitsBox([0,0,0],[0,0,0],[0,0,0],1));
 assert.ok(!segmentHitsBox([2,0,-10],[2,0,10],[0,0,0],1));
 assert.ok(!segmentHitsBox([0,0,-10],[0,0,-2],[0,0,0],1));
});
test('shared upgrade catalog respects costs and upper and lower bounds',async()=>{
 const {upgrades}=JSON.parse(await readFile(new URL('../shooter/upgrades.json',import.meta.url),'utf8'));
 const get=id=>upgrades.find(u=>u.id===id);
 assert.equal(upgradeValue(get('critical_chance'),100),90);
 assert.equal(upgradeValue(get('spawn_rate'),100),.1);
 assert.equal(upgradeValue(get('bullet_spread'),100),45);
 assert.equal(upgradeCost(get('fire_rate'),0),5);
 assert.equal(upgradeCost(get('critical_damage'),2),68);
});
