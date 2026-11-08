import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part} from './model.js';
import {pilot,drive,fire,damage,advanceBullets} from './flight25.js';
const parts=[part('hull'),part('engine'),part('wing'),part('cannon')];
test('car handling requires motion, reverses steering, and brakes',()=>{
 const s=pilot(parts);drive(s,{steer:1},.05);assert.equal(s.yaw,0);
 for(let i=0;i<100;i++)drive(s,{throttle:1},.05);assert.ok(s.speed>0&&s.z<0);drive(s,{steer:1},.05);assert.ok(s.yaw>0);
 const speed=s.speed;for(let i=0;i<20;i++)drive(s,{brake:true},.05);assert.ok(s.speed<speed*.01);
 s.speed=-4;s.yaw=0;drive(s,{steer:1},.05);assert.ok(s.yaw<0);
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
