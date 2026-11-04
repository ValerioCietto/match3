import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COURSE_RADIUS,sampleEntrance,chooseEnemy,segmentHitsBox,upgradeCost,upgradeValue,coneDirection,bulletDirection,dot,length} from './core.mjs';
import {ENEMY_MESHES,enemyRadius,hitsEnemy,segmentHitsSphere} from './core.mjs';
import {ARENA_UPGRADES,CURVATURE_STEPS} from './core.mjs';

test('CURVATURE follows all multiplier steps and square-root costs between 100 and 1000',()=>{
 const u=ARENA_UPGRADES.find(u=>u.id==='curvature');
 assert.equal(upgradeValue(u,0),1);
 CURVATURE_STEPS.forEach((value,i)=>assert.equal(upgradeValue(u,i+1),value));
 assert.equal(CURVATURE_STEPS.length,10);
 assert.equal(upgradeValue(u,1),2);
 assert.equal(upgradeValue(u,2),4.633);
 assert.equal(upgradeValue(u,1000),9.9);
 const costs=CURVATURE_STEPS.map((_,i)=>upgradeCost(u,i));
 assert.equal(costs[0],100);assert.equal(costs.at(-1),1000);
 assert.ok(costs.every((cost,i)=>cost>=100&&cost<=1000&&(i===0||cost>costs[i-1])));
 assert.equal(costs[4],700);
});

test('enemy meshes have the requested faces and fit their approximate hitboxes',()=>{
 const meshes=ENEMY_MESHES;
 assert.equal(meshes.big_boss.vertices.length,12);
 assert.equal(meshes.big_boss.faces.length,20);
 assert.ok(meshes.big_boss.faces.every(f=>f.length===3));
 assert.equal(meshes.very_small.faces.length,6);
 assert.equal(meshes.normal.faces.length,6);
 assert.ok(Math.abs(meshes.normal.vertices[0][0])<1e-12);
 assert.ok(Math.abs(meshes.normal.vertices[0][1]+Math.SQRT1_2)<1e-12);
 assert.equal(meshes.special_ops.faces.length,8);
 assert.ok(meshes.special_ops.faces.every(f=>f.length===3));
 assert.equal(meshes.stealth.faces.filter(f=>f.length===3).length,2);
 assert.equal(meshes.boss.vertices.length,20);
 assert.equal(meshes.boss.faces.length,12);
 assert.ok(meshes.boss.faces.every(f=>f.length===5));
 const edges=new Map();
 for(const face of meshes.boss.faces)for(let i=0;i<5;i++){
  const key=[face[i],face[(i+1)%5]].sort((a,b)=>a-b).join(',');edges.set(key,(edges.get(key)||0)+1);
 }
 assert.equal(edges.size,30);assert.ok([...edges.values()].every(n=>n===2));
 const lengths=[...edges.keys()].map(key=>{const [a,b]=key.split(',').map(Number);return Math.hypot(...meshes.boss.vertices[a].map((v,i)=>v-meshes.boss.vertices[b][i]));});
 assert.ok(Math.max(...lengths)-Math.min(...lengths)<1e-12);
 for(const [name,mesh] of Object.entries(meshes))for(const v of mesh.vertices)assert.ok(length(v)<=enemyRadius({name,size:1})+1e-12);
});

test('sphere hitboxes catch fast shots and rotated-cube edges, rejecting distant misses',()=>{
 assert.ok(segmentHitsSphere([0,0,-10],[0,0,10],[0,0,0],1));
 assert.ok(segmentHitsSphere([0,0,0],[0,0,0],[0,0,0],1));
 assert.ok(!segmentHitsSphere([2,0,-10],[2,0,10],[0,0,0],1));
 assert.ok(hitsEnemy([.7,0,-2],[.7,0,2],{name:'normal',size:1,p:[0,0,0]}));
 assert.ok(!hitsEnemy([.7,0,-2],[.7,0,2],{name:'very_small',size:1,p:[0,0,0]}));
});

test('baseline bullet spread stays inside a one-degree cone for every heading',()=>{
 for(const axis of [[0,0,1],[0,0,-1],[0,1,0],[0,-1,0],[1,0,0]]){
  for(let i=0;i<32;i++){
   let sample=0;const d=bulletDirection(axis,()=>sample++===0?1:i/32);
   assert.ok(Math.abs(length(d)-1)<1e-12);
   assert.ok(Math.abs(dot(d,axis)-Math.cos(Math.PI/360))<1e-12);
   assert.ok(dot(d,axis)<1);
  }
 }
});

test('spread fills a 3D cone in the ship basis and respects its opening angle',()=>{
 const forward=[1,0,0],right=[0,0,-1],up=[0,1,0],spread=Math.PI/4;
 const directions=Array.from({length:101},(_,i)=>coneDirection(i,101,spread,forward,right,up));
 const quadrants=new Set();
 for(const d of directions){
  assert.ok(Math.abs(length(d)-1)<1e-12);
  assert.ok(dot(d,forward)>=Math.cos(spread/2)-1e-12);
  if(Math.abs(dot(d,right))>1e-6&&Math.abs(dot(d,up))>1e-6)quadrants.add(`${dot(d,right)>0},${dot(d,up)>0}`);
 }
 assert.equal(quadrants.size,4);
 assert.deepEqual(directions[0],forward);
 assert.ok(dot(directions[30],forward)>dot(directions[90],forward));
 assert.deepEqual(coneDirection(0,1,spread,forward,right,up),forward);
 assert.deepEqual(coneDirection(4,5,0,forward,right,up),forward);
});
test('enemy entrance fills the cylinder cross-section at its forward end',()=>{
 let seed=12345;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 let squared=0;const quadrants=new Set();
 for(let i=0;i<20000;i++){const p=sampleEntrance(200,COURSE_RADIUS,random),r2=(p[0]**2+p[1]**2)/COURSE_RADIUS**2;assert.equal(p[2],200);assert.ok(r2<=1+1e-12);squared+=r2;quadrants.add(p.slice(0,2).map(v=>v>0?1:0).join(''));}
 assert.equal(quadrants.size,4);assert.ok(Math.abs(squared/20000-.5)<.015);
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
