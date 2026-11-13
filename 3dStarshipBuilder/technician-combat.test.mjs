import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part} from './model.js';
import {pilot,fire,drive,damage,advanceBullets,advanceLasers,worldMount} from './flight25.js';
import {tickStatuses,onHit,specialHit,infestation,seek,combatStatus} from './technician-combat.js';
const tech=type=>({...part(type),designStyle:'technician',octagonalSymmetry:false});
const target=()=>pilot([part('hull'),part('engine')]);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('laser automatically deals 10 DPS only within 100 units and its cone',()=>{
 const shooter=pilot([part('hull'),tech('laserLine')]),victim=target(),m=worldMount(shooter,shooter.weapons[0]);
 victim.x=m.x;victim.z=m.z-50;const hp=victim.hull;
 for(let i=0;i<20;i++)assert.equal(advanceLasers([shooter,victim],.05).length,1);
 near(victim.hull,hp-10);
 victim.z=m.z-100.01;assert.equal(advanceLasers([shooter,victim],.05).length,0);
 victim.z=m.z-100;assert.equal(advanceLasers([shooter,victim],.05).length,1);
 victim.x=m.x+50;victim.z=m.z;assert.equal(advanceLasers([shooter,victim],.05).length,0);
 shooter.yaw=Math.PI/2;victim.x=50;victim.z=0;assert.equal(advanceLasers([shooter,victim],.05).length,1);
 assert.equal(advanceLasers([shooter,null],.05).length,0);
 const bullets=[];fire(shooter,0,bullets);assert.equal(bullets.length,0);
});
test('octagonal laser coverage does not multiply DPS in overlapping cones',()=>{
 const shooter=pilot([part('hull'),{...tech('laserLine'),octagonalSymmetry:true}]),victim=target();
 assert.equal(shooter.weapons.length,8);victim.x=20;victim.z=-50;
 const hp=victim.hull;assert.equal(advanceLasers([shooter,victim],1).length,1);near(victim.hull,hp-10);
 const mirrored=pilot([part('hull'),{...tech('laserLine'),mirror:true,position:[2,0,0]}]);
 victim.x=0;victim.z=-50;assert.equal(advanceLasers([mirrored,victim],.1).length,2);
});
test('gravity bullet collision removes ten percent of current velocity without lowering the speed cap',()=>{
 for(const omni of [false,true]){
  const victim=omni?pilot([part('hull'),tech('engine')]):target();victim.speed=20;victim.vx=12;victim.vz=16;
  const max=victim.stats.maxSpeed;
  const bullets=[{x:0,z:5,vx:0,vz:-100,life:1,owner:0,kind:'gravStop',damage:0}];
  assert.equal(advanceBullets(bullets,[target(),victim],.1).length,0);
  near(victim.speed,18);near(victim.vx,10.8);near(victim.vz,14.4);assert.equal(victim.stats.maxSpeed,max);
  specialHit(victim,{kind:'gravStop'});near(victim.speed,16.2);
 }
});
test('push waves displace stationary ships opposite to projectile travel',()=>{
 const victim=target();const hp=victim.hull;
 specialHit(victim,{kind:'pushOutside',vx:0,vz:-35});
 drive(victim,{},.05);assert.ok(victim.z>0);near(victim.x,0);near(victim.hull,hp);
});
test('jump shield blinks six units on hit, has a shared two-second cooldown and resets',()=>{
 const victim=pilot([part('hull'),tech('teleportShield'),tech('teleportShield')]);
 onHit(victim,()=>0);near(victim.x,6);near(victim.z,0);near(victim.blinkCooldown,2);
 onHit(victim,()=>.5);near(victim.x,6);
 tickStatuses(victim,1.99);onHit(victim,()=>.5);near(victim.x,6);
 tickStatuses(victim,.01);onHit(victim,()=>.5);near(victim.x,0);near(victim.blinkCooldown,2);
 const before=victim.shield;damage(victim,5);near(victim.shield,before-5);near(victim.x,0);
 assert.equal(pilot([part('hull'),tech('teleportShield')]).blinkCooldown,0);
 const unprotected=target();onHit(unprotected,()=>0);near(unprotected.x,0);
});
test('nanites seek, tick hull damage every 0.1s, stack and expire independently at ten seconds',()=>{
 const victim=target(),hp=victim.hull;victim.shield=100;
 const bullet={kind:'nanitesSpray',x:0,z:10,vx:30,vz:0};seek(bullet,victim,.1);assert.ok(bullet.vz<0);near(Math.hypot(bullet.vx,bullet.vz),30);
 specialHit(victim,bullet);assert.equal(infestation(victim),10);
 tickStatuses(victim,.09);near(victim.hull,hp);tickStatuses(victim,.01);near(victim.hull,hp-1);near(victim.shield,100);
 tickStatuses(victim,.9);specialHit(victim,bullet);assert.equal(infestation(victim),20);
 assert.match(combatStatus(victim),/Nanite infestation 20/);
 tickStatuses(victim,9);assert.equal(infestation(victim),10);near(victim.hull,hp-190);
 tickStatuses(victim,1);assert.equal(infestation(victim),0);near(victim.hull,hp-200);
 tickStatuses(victim,5);near(victim.hull,hp-200);
});
test('special projectiles fire from all eight emitters and apply nanites on collision',()=>{
 for(const type of ['gravStop','nanitesSpray','pushOutside']){
  const ship=pilot([part('hull'),{...tech(type),octagonalSymmetry:true}]),bullets=[];
  fire(ship,0,bullets);fire(ship,0,bullets);assert.equal(bullets.length,8);assert.ok(bullets.every(b=>b.kind===type&&b.damage===0));
 }
 const victim=target(),bullet={x:0,z:2,vx:0,vz:-30,life:1,owner:0,kind:'nanitesSpray',damage:0};
 advanceBullets([bullet],[target(),victim],.1);assert.equal(infestation(victim),10);
 assert.equal(infestation(target()),0);
});
