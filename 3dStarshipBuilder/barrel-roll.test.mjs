import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part} from './model.js';
import {pilot,drive,advanceBullets} from './flight25.js';
import {startRoll,stepRoll} from './barrel-roll.js';
const make=()=>pilot([part('hull'),part('engine')]);
test('roll moves laterally relative to ship heading, spins both ways and has a cooldown',()=>{
 for(const direction of [-1,1]){
  const ship=make();ship.yaw=Math.PI/2;assert.ok(startRoll(ship,direction));
  stepRoll(ship,.3);assert.ok(ship.roll*direction<0);assert.ok(Math.abs(ship.z-direction*2)<1e-8);assert.ok(Math.abs(ship.x)<1e-8);
  assert.equal(startRoll(ship,-direction),false);stepRoll(ship,.3);
  assert.equal(ship.dodge,null);assert.equal(ship.roll,0);assert.ok(Math.abs(ship.z-direction*4)<1e-8);
  assert.equal(startRoll(ship,direction),false);stepRoll(ship,.9);assert.ok(startRoll(ship,direction));
 }
 const dead=make();dead.hull=0;assert.equal(startRoll(dead,1),false);
});
test('barrel roll offers no immunity to normal or special projectile hits',()=>{
 for(const kind of ['cannon','gravStop','nanitesSpray','pushOutside']){
  const ship=make(),hp=ship.hull;ship.speed=10;startRoll(ship,-1);
  const shot={x:0,z:2,vx:0,vz:-50,life:1,owner:1,kind,damage:25};
  assert.equal(advanceBullets([shot],[ship,make()],.1).length,0);
  assert.equal(ship.hull,kind==='cannon'?hp-25:hp);
  if(kind==='gravStop')assert.equal(ship.speed,9);
  if(kind==='nanitesSpray')assert.equal(ship.nanites.length,1);
  if(kind==='pushOutside')assert.ok(ship.pushVz>0);
 }
 const ship=make();startRoll(ship,1);stepRoll(ship,.6);const hp=ship.hull;
 const shot={x:ship.x,z:ship.z+2,vx:0,vz:-50,life:1,owner:1,kind:'cannon',damage:25};
 assert.equal(advanceBullets([shot],[ship,make()],.1).length,0);assert.equal(ship.hull,hp-25);
});
test('normal drive completes a roll, keeps cooldown and resets with a fresh ship',()=>{
 const ship=make();startRoll(ship,1);
 for(let i=0;i<12;i++)drive(ship,{},.05);
 assert.equal(ship.dodge,null);assert.ok(Math.abs(ship.x-4)<1e-8);assert.ok(ship.dodgeCooldown>0);
 const fresh=make();assert.equal(fresh.dodge,null);assert.equal(fresh.dodgeCooldown,0);
});
