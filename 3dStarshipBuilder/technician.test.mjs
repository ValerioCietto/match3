import {test} from 'node:test';
import assert from 'node:assert/strict';
import {factions} from './factions.js';
import {part,mesh,validateProject,gltf,objFiles} from './model.js';
import {moduleStats,recommendedStats} from './stats.js';
import {octagonalTypes,technicianHullProfiles,technicianGlow} from './technician.js';
const make=type=>({...part(type),...factions.technician.defaults[type]});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('shield regen is a pearl sphere with a rotating surface and stable geometry and stats',()=>{
 const p=make('shieldRegen'),saved=JSON.stringify(p),a=mesh(p,false,0),b=mesh(p,false,3),stats=moduleStats(p);
 for(const v of a.vertices)near(Math.hypot(...v),.52);
 assert.deepEqual(a.vertices,b.vertices);assert.notDeepEqual(a.faceColors,b.faceColors);
 assert.ok(new Set(a.faceColors).size>10);assert.equal(JSON.stringify(p),saved);
 assert.deepEqual(moduleStats(p),stats);assert.ok(stats.shieldRegen>0);
});

test('Technician library has only the requested modules and roundtrips and exports closed solids',()=>{
 assert.deepEqual(new Set(factions.technician.parts),new Set(['hull','engine','laserLine','pushOutside','gravStop','sapRay','turret','teleportShield','shieldRegen','nanitesSpray']));
 for(const p of [...factions.technician.parts.map(make),...Object.keys(technicianHullProfiles).map(technicianHullProfile=>({...make('hull'),technicianHullProfile}))]){
  const type=p.type,m=mesh(p),edges=new Map();
  assert.ok(m.vertices.length&&m.faces.length,type);
  for(const face of m.faces)for(let i=0;i<face.length;i++){
   const a=face[i],b=face[(i+1)%face.length],key=[a,b].sort((a,b)=>a-b).join(','),edge=edges.get(key)||[0,0];edge[0]++;edge[1]+=a<b?1:-1;edges.set(key,edge);
  }
  for(const edge of edges.values())assert.deepEqual(edge,[2,0],type);
  const restored=validateProject(JSON.parse(JSON.stringify({version:1,faction:'technician',name:type,parts:[p]})));
  assert.deepEqual(mesh(restored.parts[0]).vertices,m.vertices);
  assert.ok(gltf([p]).meshes.length);assert.ok(objFiles([p]).obj.includes('f '));
  const stats=moduleStats(p),small=moduleStats({...p,scale:[.5,.5,.5]});
  assert.ok(stats.volume>0&&stats.massEmpty>0&&stats.hullMax>0,type);
  for(const key of Object.keys(stats))near(small[key],stats[key]/8);
 }
});
test('ancient hulls have cyan orbs, purple energy and distinct metal silhouettes',()=>{
 const profiles=['reliquary','octolith','riftArk'],counts=new Set();
 for(const technicianHullProfile of profiles){
  const p={...make('hull'),technicianHullProfile},m=mesh(p);counts.add(m.vertices.length);
  assert.ok(m.faceColors.includes('#65eff1'));assert.ok(m.faceColors.includes('#bc65ff'));assert.ok(m.faceColors.includes('#a4abb1'));
  const materials=gltf([p]).materials;assert.ok(materials.some(m=>m.emissiveFactor));
  assert.ok(technicianGlow.includes('#bc65ff'));
 }
 assert.equal(counts.size,3);
 const shell=mesh({...make('hull'),technicianHullProfile:'rockShell'});
 assert.ok(shell.faceColors.includes('#655f58'));assert.ok(shell.faceColors.includes('#d9c8ee'));
});
test('half-rock hull has a hollow underside, stable facets and a saved profile',()=>{
 const p={...make('hull'),technicianHullProfile:'rockShell'},m=mesh(p);
 assert.ok(m.vertices.every(v=>v[1]>=-1e-10));
 const rim=m.vertices.filter(v=>Math.abs(v[1])<1e-10);
 assert.equal(rim.length,32);assert.ok(rim.every(v=>Math.hypot(v[0],v[2])>.6));
 assert.ok(new Set(m.faceColors).size>3);assert.deepEqual(mesh(p),m);
 assert.ok(moduleStats(p).volume<moduleStats(make('hull')).volume);
 const restored=validateProject({version:1,name:'Rock',parts:[p]});assert.equal(restored.parts[0].technicianHullProfile,'rockShell');
 assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...p,technicianHullProfile:'invalid'}]}));
});
test('octagonal checkbox produces eightfold symmetry around Y and persists off state',()=>{
 const key=v=>v.map(n=>Math.round(n*1e6)).join(',');
 for(const type of octagonalTypes){
  const p=make(type),m=mesh(p),vertices=new Set(m.vertices.map(key));
  for(const [x,y,z] of m.vertices)assert.ok(vertices.has(key([(x+z)/Math.sqrt(2),y,(z-x)/Math.sqrt(2)])),type);
  const single={...p,octagonalSymmetry:false};assert.ok(mesh(single).vertices.length<m.vertices.length);
  const restored=validateProject({version:1,name:type,parts:[single]});assert.equal(restored.parts[0].octagonalSymmetry,false);
 }
 assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...make('engine'),octagonalSymmetry:'yes'}]}));
});
test('Technician modules supply propulsion, weapons, shields and repairs',()=>{
 const hull=mesh(make('hull'));for(const v of hull.vertices)near(Math.hypot(...v),.7);
 assert.equal(hull.vertices.length,642);assert.equal(hull.faces.length,1280);
 assert.ok(hull.faces.every(f=>f.length===3));
 assert.ok(new Set(hull.faceColors).size>3);
 assert.ok(recommendedStats([make('hull'),make('engine')]).acceleration>0);
 for(const type of ['laserLine','pushOutside','gravStop','sapRay'])assert.ok(moduleStats(make(type)).gunSlots>0);
 assert.ok(moduleStats(make('turret')).turretSlots>0);
 assert.ok(moduleStats(make('teleportShield')).shieldMax>0);
 assert.ok(moduleStats(make('shieldRegen')).shieldRegen>0);
 assert.equal(moduleStats(make('nanitesSpray')).hullRegen,0);
});
