import {test} from 'node:test';
import assert from 'node:assert/strict';
import {library,presetCatalog,part,preset,validateProject,gltf,objFiles} from './model.js';
import {moduleVolume,moduleStats,recommendedStats,statFields} from './stats.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('standalone cores are retired from the library and every preset, but old saves load',()=>{
  assert.equal(library.nozzle.legacy,true);
  for(const id of Object.keys(presetCatalog))assert.ok(preset(id).every(p=>p.type!=='nozzle'),id);
  const saved=validateProject({version:1,name:'Legacy',parts:[part('nozzle')]});assert.equal(saved.parts[0].type,'nozzle');assert.ok(recommendedStats(saved.parts).thrust>0);
});
test('role presets supply their advertised modules and roundtrip with usable exports',()=>{
  const count=(parts,type)=>parts.filter(p=>p.type===type).reduce((sum,p)=>sum+(p.mirror?2:1),0);
  for(const id of ['interceptor','carrier','megaCargo','explorer','cruise']){
    const parts=preset(id),stats=recommendedStats(parts),saved=validateProject({version:1,name:presetCatalog[id].name,parts});
    assert.deepEqual(recommendedStats(saved.parts),stats);assert.ok(stats.acceleration>0&&stats.turnAcceleration>0);assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
    const doc=gltf(parts);assert.equal(doc.meshes.length,parts.reduce((sum,p)=>sum+(p.mirror?2:1),0));assert.equal(Buffer.from(doc.buffers[0].uri.split(',')[1],'base64').length,doc.buffers[0].byteLength);assert.ok(objFiles(parts).obj.includes('f '));
    if(id==='carrier'){assert.equal(count(parts,'fighterBay'),4);near(stats.fighterSlots,4);assert.equal(count(parts,'turret'),4);}
    if(id==='interceptor'){assert.equal(count(parts,'engine'),6);assert.equal(count(parts,'nozzle'),0);assert.equal(count(parts,'wing'),4);assert.ok(parts.filter(p=>p.type==='engine'||p.type==='nozzle').every(p=>p.scale.every(v=>v<1)));assert.ok(parts.some(p=>p.type==='wing'&&p.wingDihedral>0)&&parts.some(p=>p.type==='wing'&&p.wingDihedral<0));}
    if(id==='megaCargo'){assert.equal(count(parts,'cargo'),8);assert.equal(count(parts,'fuelPod'),4);assert.ok(stats.massFull>recommendedStats(preset('hauler')).massFull);}
    if(id==='explorer'){assert.equal(count(parts,'fuelPod'),4);assert.ok(parts.filter(p=>p.type==='engine').every(p=>p.scale.every(v=>v>1)));assert.ok(stats.shieldMax>0);}
    if(id==='cruise'){assert.equal(count(parts,'passengerModule'),8);near(stats.maxPassengers,96);assert.ok(stats.shieldMax>0);}
    parts[0].scale[0]=99;assert.notEqual(preset(id)[0].scale[0],99,'Each load creates fresh parts');
  }
});
test('every module contribution scales by volume, with mirrors counted twice',()=>{
  for(const type of Object.keys(library)){
    const p=part(type),base=moduleStats(p),small=moduleStats({...p,scale:[.5,.5,.5]}),nonuniform=moduleStats({...p,scale:[.5,2,3]}),mirror=moduleStats({...p,mirror:true});
    assert.ok(base.volume>0&&base.massEmpty>0&&base.expectedCost>0&&base.hullMax>0,type);
    for(const key of Object.keys(base)){near(small[key],base[key]/8);near(nonuniform[key],base[key]*3);if(type!=='passengerModule')near(mirror[key],base[key]*2);}
    near(moduleVolume({...p,position:[90,-50,20],rotation:[73,-140,25]}),base.volume);
  }
});
test('actual geometry volume excludes bay opening and reflects hull/wing edits',()=>{
  near(moduleVolume(part('fighterBay')),3*Math.sqrt(3)/2*(1-.75**2)*1.6);
  const wing=part('wing');near(moduleVolume({...wing,wingThickness:.08}),moduleVolume(wing)/2);
  near(moduleVolume({...wing,wingSweep:35,wingDihedral:-45}),moduleVolume(wing));
  const hull=part('hull');assert.ok(moduleVolume({...hull,deckTaper:.35})<moduleVolume(hull));
  near(moduleVolume({...hull,hullProfile:'freighter'}),1.8*3.3*.65);
});
test('module roles supply capacities, shields, repair and loaded mass',()=>{
  near(moduleStats(part('cannon')).gunSlots,1);near(moduleStats(part('turret')).turretSlots,1);near(moduleStats(part('fighterBay')).fighterSlots,1);near(moduleStats(part('passengerModule')).maxPassengers,8);
  for(const type of ['fuelPod','cargo','fighterBay','passengerModule'])assert.ok(moduleStats(part(type)).massFull>moduleStats(part(type)).massEmpty);
  assert.ok(moduleStats(part('shieldGenerator')).shieldRegen>0);assert.ok(moduleStats(part('shieldGenerator')).shieldMax>0);assert.ok(moduleStats(part('hull')).hullRegen>0);
  assert.equal(recommendedStats([part('hull')]).maxSpeed,0);
});
test('ship totals and mobility respond to engines, wings and payload',()=>{
  const ship=preset('fighter'),base=recommendedStats(ship),engine=recommendedStats([...ship,part('engine')]),heavy=recommendedStats([...ship,part('cargo')]),wings=recommendedStats([...ship,part('wing')]);
  near(base.inertia,ship.reduce((sum,p)=>sum+moduleVolume(p),0));
  assert.ok(engine.acceleration>base.acceleration&&engine.maxSpeed>base.maxSpeed);
  assert.ok(heavy.massFull>base.massFull&&heavy.acceleration<base.acceleration);
  assert.ok(wings.turnAcceleration>base.turnAcceleration&&wings.turnMaxSpeed>base.turnMaxSpeed&&wings.turnInertia<base.turnInertia);
  const restored=validateProject(JSON.parse(JSON.stringify({version:1,name:'Ship',parts:ship})));assert.deepEqual(recommendedStats(restored.parts),base);
  for(const [id] of statFields){assert.equal(recommendedStats([])[id],0);assert.ok(Number.isFinite(base[id])&&base[id]>=0);}
});
