import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part,combined} from './model.js';
import {meshBuffers} from './webgl-renderer.js';
import {pilot,drive,fire,damage,advanceBullets,shotColor,arenaMotion} from './flight25.js';
import {moduleStats} from './stats.js';
const parts=[part('hull'),part('engine'),part('wing'),part('cannon')];
test('spike length scales range, speed and independent reload from 1.6 units',()=>{
 const spike=length=>({...part('cannon'),designStyle:'jared',spikeLength:length});
 for(const length of [.2,.8,1.6,3.2,5]){
  const ship=pilot([part('hull'),spike(length)]),shots=[];fire(ship,0,shots);
  const shot=shots[0],speed=Math.hypot(shot.vx,shot.vz),factor=length/1.6;
  assert.ok(Math.abs(speed-65*factor)<1e-8);
  assert.ok(Math.abs(ship.weapons[0].cooldown-.3*factor)<1e-8);
  const start=[shot.x,shot.z];advanceBullets(shots,[ship,null],3);
  assert.ok(Math.abs(Math.hypot(shot.x-start[0],shot.z-start[1])-162.5*factor)<1e-8);
 }
 const mixed=pilot([part('hull'),spike(.8),spike(3.2),part('cannon'),part('turret')]),shots=[];
 fire(mixed,0,shots);assert.equal(shots.length,4);
 for(let i=0;i<3;i++)drive(mixed,{},.05);
 fire(mixed,0,shots);assert.equal(shots.length,5);
 for(let i=0;i<3;i++)drive(mixed,{},.05);
 fire(mixed,0,shots);assert.equal(shots.length,8);
 assert.ok(Math.abs(mixed.weapons[1].cooldown-.3)<1e-8);
});
test('arena preserves editor dimensions for small and large ships and weapon offsets',()=>{
 const base=[part('hull'),{...part('cannon'),position:[2,0,0],mirror:true}];
 const reference=pilot(base),referenceShots=[];fire(reference,0,referenceShots);
 for(const scale of [.1,1,10]){
  const scaled=base.map(p=>({...p,scale:p.scale.map(n=>n*scale),position:p.position.map(n=>n*scale)}));
  const ship=pilot(scaled),model=combined(scaled),buffer=meshBuffers(model).triangles,shots=[];
  assert.ok(Math.abs(ship.radius-reference.radius*scale)<1e-8);
  for(const axis of [0,1,2]){
   const source=model.vertices.map(v=>v[axis]),rendered=[];
   for(let i=axis;i<buffer.length;i+=9)rendered.push(buffer[i]*ship.radius);
   assert.ok(Math.abs((Math.max(...source)-Math.min(...source))-(Math.max(...rendered)-Math.min(...rendered)))<1e-5);
  }
  fire(ship,0,shots);shots.forEach((shot,i)=>{
   assert.ok(Math.abs(shot.x-referenceShots[i].x*scale)<1e-8);
   assert.ok(Math.abs(shot.z-referenceShots[i].z*scale)<1e-8);
  });
 }
});
test('spike shots follow arbitrary Y angles with mirrored spread and ship heading',()=>{
 for(const angle of [-45,-25,0,25,45,180])for(const yaw of [0,.7]){
  const cannon={...part('cannon'),designStyle:'jared',rotation:[0,angle,0],position:[.5,0,0],mirror:true};
  const ship=pilot([part('hull'),cannon]),shots=[];ship.yaw=yaw;fire(ship,0,shots);
  assert.equal(shots.length,2);
  shots.forEach((shot,i)=>{
   const localAngle=angle*Math.PI/180*(i===0?1:-1),heading=yaw-localAngle;
   assert.ok(Math.abs(shot.vx-65*Math.sin(heading))<1e-8);
   assert.ok(Math.abs(shot.vz+65*Math.cos(heading))<1e-8);
  });
 }
});
test('Jared engine direction allocates thrust to forward or reverse, including mirrors and angled mounts',()=>{
 const hull=part('hull'),engine={...part('engine'),designStyle:'jared',mirror:true};
 const forward=pilot([hull,engine]);
 for(const rotation of [[180,0,0],[0,180,0]]){
  const reverse=pilot([hull,{...engine,rotation}]);
  assert.equal(reverse.stats.maxSpeed,0);assert.equal(reverse.stats.acceleration,0);
  assert.ok(Math.abs(reverse.stats.reverseEngineMaxSpeed-forward.stats.maxSpeed)<1e-8);
  drive(reverse,{throttle:-1},.05);assert.ok(reverse.speed<0);
  assert.ok(arenaMotion(reverse.stats).reverse>0);
 }
 const sideways=pilot([hull,{...engine,rotation:[0,90,0]}]);
 assert.equal(sideways.stats.forwardThrust,0);assert.equal(sideways.stats.reverseThrust,0);
 const angled=pilot([hull,{...engine,rotation:[0,60,0]}]);
 assert.ok(Math.abs(angled.stats.forwardThrust/forward.stats.forwardThrust-.5)<1e-8);
 const mixed=pilot([hull,engine,{...engine,rotation:[180,0,0]}]),motion=arenaMotion(mixed.stats);
 assert.ok(motion.reverse>.3*motion.forward);
 for(let i=0;i<2000;i++)drive(mixed,{throttle:-1},.05);
 assert.ok(-mixed.speed>.3*motion.forward);assert.ok(-mixed.speed<=motion.reverse);
 const human=pilot([hull,part('engine')]);assert.equal(arenaMotion(human.stats).reverse,.3*arenaMotion(human.stats).forward);
});
test('sustained blades turn more slowly initially but reach a higher turn rate in arena',()=>{
 const blade={...part('wing'),designStyle:'jared',mirror:true};
 const standard=pilot([part('hull'),blade]),sustained=pilot([part('hull'),{...blade,bladeProfile:'sustained'}]);
 drive(standard,{steer:1},.05);drive(sustained,{steer:1},.05);
 assert.ok(sustained.yawRate<standard.yawRate);
 for(let i=0;i<4000;i++){drive(standard,{steer:1},.05);drive(sustained,{steer:1},.05);}
 assert.ok(sustained.yawRate>standard.yawRate);
});
test('salvos fire from each mirrored cannon and turret with volume-scaled damage',()=>{
 const cannon={...part('cannon'),position:[2,0,0],mirror:true};
 const small={...part('cannon'),position:[0,0,-1],scale:[.5,.5,.5]};
 const turret={...part('turret'),position:[0,1,1]};
 const ship=pilot([part('hull'),cannon,small,turret]),shots=[];
 fire(ship,0,shots);fire(ship,0,shots);
 assert.equal(shots.length,4);
 assert.ok(shots[0].x>0&&shots[1].x<0);
 assert.ok(Math.abs(shots[0].x+shots[1].x)<1e-8);
 assert.ok(Math.abs(shots[2].damage/shots[0].damage-1/8)<1e-8);
 assert.equal(shots[3].kind,'turret');
 assert.ok(Math.abs(shots[3].damage-25*moduleStats(turret).turretSlots)<1e-8);
 assert.ok(Math.abs(shots.reduce((n,b)=>n+b.damage,0)-25*(ship.stats.gunSlots+ship.stats.turretSlots))<1e-8);
 assert.notDeepEqual(shotColor('cannon',0),shotColor('turret',0));
 assert.notDeepEqual(shotColor('cannon',1),shotColor('turret',1));
});
test('rotated mirrored Jared cannons fire in opposite directions and follow ship heading',()=>{
 const cannon={...part('cannon'),designStyle:'jared',position:[2,0,0],rotation:[0,90,0],mirror:true};
 const ship=pilot([part('hull'),cannon]),shots=[];
 fire(ship,0,shots);assert.equal(shots.length,2);
 assert.ok(shots[0].vx< -64&&shots[1].vx>64);
 ship.weapons.forEach(m=>m.cooldown=0);ship.yaw=Math.PI/2;const turned=[];fire(ship,0,turned);
 assert.ok(turned[0].vz< -64&&turned[1].vz>64);
 assert.ok(Math.abs(turned[0].vx)<1e-8);
});
test('support slot bonuses boost real weapons without creating extra barrels',()=>{
 const armor={...part('armor'),armorProfile:'highTech'};
 const unarmed=pilot([part('hull'),armor]),none=[];fire(unarmed,0,none);assert.equal(none.length,0);
 const ship=pilot([part('hull'),armor,part('cannon')]),shots=[];fire(ship,0,shots);
 assert.equal(shots.length,1);assert.equal(shots[0].damage,25*ship.stats.gunSlots);
});
test('steering works at rest and in reverse, while acceleration and braking work',()=>{
 const s=pilot(parts);drive(s,{steer:1},.05);assert.ok(s.yaw>0);assert.equal(s.x,0);assert.equal(s.z,0);
 for(let i=0;i<100;i++)drive(s,{throttle:1},.05);assert.ok(s.speed>0&&s.z<0);drive(s,{steer:1},.05);assert.ok(s.yaw>0);
 const speed=s.speed;for(let i=0;i<20;i++)drive(s,{brake:true},.05);assert.ok(s.speed<speed*.01);
 s.speed=-4;s.yaw=0;drive(s,{steer:1},.05);assert.ok(s.yaw>0);
 const noEngine=pilot([part('hull')]);drive(noEngine,{throttle:1},.05);assert.equal(noEngine.speed,0);
});
test('weapons respect slots, cooldown, swept collision and shield absorption',()=>{
 const s=pilot(parts),target=pilot(parts,0,-10),bullets=[];fire(s,0,bullets);fire(s,0,bullets);assert.equal(bullets.length,1);
 const hp=target.hull;let active=bullets;for(let i=0;i<8;i++)active=advanceBullets(active,[s,target],.05);assert.equal(active.length,0);assert.ok(target.hull<hp);
 const unarmed=pilot([part('hull')]);fire(unarmed,0,bullets);assert.equal(bullets.length,1);
 target.shield=10;const before=target.hull;damage(target,15);assert.equal(target.shield,0);assert.equal(target.hull,before-5);
 damage(target,1e9);assert.equal(target.hull,0);
 assert.equal(advanceBullets([{x:0,z:0,vx:0,vz:-1,life:.01,owner:0,damage:1}],[s,null],.05).length,0);
});

test('steering banks locally by 15 degrees and levels smoothly on release',()=>{
 const s=pilot(parts);assert.equal(s.roll,0);
 for(let i=0;i<60;i++)drive(s,{steer:-1},.05);
 assert.ok(Math.abs(s.roll-Math.PI/12)<1e-8);assert.equal(s.x,0);assert.equal(s.z,0);
 for(let i=0;i<60;i++)drive(s,{steer:1},.05);
 assert.ok(Math.abs(s.roll+Math.PI/12)<1e-8);
 drive(s,{},.05);assert.ok(s.roll<0&&s.roll>-Math.PI/12);
 for(let i=0;i<60;i++)drive(s,{},.05);
 assert.ok(Math.abs(s.roll)<1e-8);
});
