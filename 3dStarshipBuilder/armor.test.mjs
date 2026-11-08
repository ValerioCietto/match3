import {test} from 'node:test';
import assert from 'node:assert/strict';
import {armorProfiles,part,mesh,validateProject,gltf,objFiles} from './model.js';
import {moduleStats,recommendedStats} from './stats.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const armor=profile=>({...part('armor'),armorProfile:profile,color:armorProfiles[profile].color});
test('armor profiles have closed surfaces, retain options and export',()=>{
  for(const profile of Object.keys(armorProfiles))for(const reflected of [false,true]){
    const p=armor(profile),m=mesh(p,reflected),edges=new Map();
    for(const f of m.faces)for(let i=0;i<f.length;i++){
      const a=f[i],b=f[(i+1)%f.length],key=[a,b].sort((a,b)=>a-b).join(',');
      const edge=edges.get(key)||[0,0];edge[0]++;edge[1]+=a<b?1:-1;edges.set(key,edge);
    }
    for(const edge of edges.values())assert.deepEqual(edge,[2,0]);
    assert.ok(m.vertices.flat().every(Number.isFinite));
    const saved=validateProject({version:1,name:'Armor',parts:[p]}).parts[0];
    assert.equal(saved.armorProfile,profile);assert.deepEqual(mesh(saved).vertices,mesh(p).vertices);
    assert.ok(gltf([p]).meshes[0].primitives.length);assert.ok(objFiles([p]).obj.includes('f '));
    if(profile!=='solar'){
      const bottom=m.vertices.filter(v=>v[1]===-.12),shoulder=m.vertices.filter(v=>v[1]===.04);
      assert.equal(bottom.length,4);assert.equal(shoulder.length,4);
      assert.deepEqual(bottom.map(v=>[v[0],v[2]]),shoulder.map(v=>[v[0],v[2]]));
    }
  }
  const solar=mesh(armor('solar'));
  assert.equal(solar.faceColors.filter(c=>c==='#1769be').length,7*8);
  assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...armor('solar'),armorProfile:'invalid'}]}));
});
test('armor bonuses scale, combine and give High Tech half of specialist rates',()=>{
  const stats=Object.fromEntries(Object.keys(armorProfiles).map(k=>[k,moduleStats(armor(k))]));
  for(const [profile,fields] of [['stealth',['radarReduction']],['solar',['energyGeneration']],['shield',['shieldMax','shieldRegen']]])
    for(const field of fields)near(stats.highTech[field]/stats.highTech.volume,.5*stats[profile][field]/stats[profile].volume);
  near(stats.highTech.hullMax/stats.highTech.volume,.5*(stats.darkAlloy.hullMax/stats.darkAlloy.volume+stats.shield.hullMax/stats.shield.volume));
  for(const profile of Object.keys(armorProfiles)){
    const small=moduleStats({...armor(profile),scale:[.5,.5,.5],mirror:true});
    for(const [key,value] of Object.entries(stats[profile]))near(small[key],value/4);
    assert.ok(Number.isFinite(recommendedStats([armor(profile)]).energyGeneration));
  }
  assert.ok(stats.highTech.gunSlots>0&&stats.highTech.turretSlots>0&&stats.highTech.fighterSlots>0);
  assert.ok(stats.highTech.expectedCost>stats.shield.expectedCost*3);
  assert.ok(stats.darkAlloy.massEmpty>stats.stealth.massEmpty);
});
