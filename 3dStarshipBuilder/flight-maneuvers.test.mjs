import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part} from './model.js';
import {pilot,drive,fire,advanceBullets,advanceLasers,arenaMotion} from './flight25.js';
import {sequenceState,sequenceInput,resetSequence,startManeuver,stepManeuver,weaponsBlocked} from './flight-maneuvers.js';
const make=()=>pilot([part('hull'),part('engine'),part('cannon')]);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('all supported sequences require releases, reject chords/repeats, and respect configurable window',()=>{
 const table={WW:'afterburner',SS:'emergencyBrake',AA:'leftDash',DD:'rightDash',WS:'backwardLoop',AD:'rightRoll',DA:'leftRoll'};
 for(const [keys,action] of Object.entries(table)){
  const s=sequenceState();assert.equal(sequenceInput(s,'Key'+keys[0],0),null);
  sequenceInput(s,'Key'+keys[0],50,{up:true});assert.deepEqual(sequenceInput(s,'Key'+keys[1],200),{action,drift:false});
 }
 for(const keys of ['SW','AW','DW','SA','SD']){const s=sequenceState();sequenceInput(s,'Key'+keys[0],0);sequenceInput(s,'Key'+keys[0],50,{up:true});assert.equal(sequenceInput(s,'Key'+keys[1],150),null);}
 const s=sequenceState();sequenceInput(s,'KeyA',0);assert.equal(sequenceInput(s,'KeyA',100,{repeat:true}),null);assert.equal(sequenceInput(s,'KeyD',120),null);
 resetSequence(s);sequenceInput(s,'KeyA',0);sequenceInput(s,'KeyA',10,{up:true});assert.equal(sequenceInput(s,'KeyA',300),null);
 resetSequence(s);sequenceInput(s,'KeyA',0);sequenceInput(s,'KeyA',10,{up:true});assert.deepEqual(sequenceInput(s,'KeyA',300,{window:400,shift:true}),{action:'leftDash',drift:true});
 resetSequence(s);assert.equal(sequenceInput(s,'KeyA',350),null);
});
test('Shift preserves independent velocity while turning and main thrust still accelerates',()=>{
 const ship=make();ship.vx=8;ship.vz=-10;
 for(let i=0;i<40;i++)drive(ship,{inertialOff:true,steer:1},.05);
 near(ship.vx,8);near(ship.vz,-10);assert.ok(ship.yaw>0);near(ship.x,16);near(ship.z,-20);
 ship.yaw=0;ship.yawRate=0;drive(ship,{inertialOff:true,throttle:1},.05);assert.ok(ship.vz< -10);near(ship.vx,8);
 const before=ship.speed;for(let i=0;i<1000;i++)drive(ship,{},.05);assert.ok(before>0);near(ship.speed,0);
 const unpowered=pilot([part('hull')]);unpowered.vx=8;drive(unpowered,{},.05);near(unpowered.vx,8);
});
test('afterburner increases acceleration without increasing speed cap',()=>{
 const regular=make(),boosted=make();assert.ok(startManeuver(boosted,{action:'afterburner'}));
 drive(regular,{throttle:1},.05);drive(boosted,{throttle:1},.05);near(boosted.speed,regular.speed*3);
 assert.equal(startManeuver(boosted,{action:'afterburner'}),false);
 for(let i=0;i<1000;i++)drive(boosted,{throttle:1},.05);assert.ok(boosted.speed<=arenaMotion(boosted.stats).forward+1e-8);
});
test('SS brakes all momentum with fourfold thrust, overrides Shift and throttle, and respects cooldown',()=>{
 for(const ship of [make(),pilot([part('hull'),{...part('engine'),designStyle:'technician'}]),pilot([part('hull'),{...part('engine'),designStyle:'technician',mirror:true},{...part('engine'),designStyle:'technician'}])]){
  ship.vx=24;ship.vz=-32;ship.speed=40;ship.afterburn=1;
  assert.ok(startManeuver(ship,{action:'emergencyBrake'}));assert.equal(ship.afterburn,0);
  assert.equal(startManeuver(ship,{action:'emergencyBrake'}),false);
  const motion=arenaMotion(ship.stats),expected=40-Math.max(motion.acceleration,motion.reverseAcceleration)*8*.05;
  drive(ship,{inertialOff:true,throttle:-1},.05);near(ship.speed,Math.max(0,expected));
  if(ship.speed>0)near(ship.vx/ship.vz,-.75);
  for(let i=0;i<2000&&ship.emergencyBrake;i++)drive(ship,{inertialOff:true,throttle:1},.05);
  near(ship.speed,0);near(ship.vx,0);near(ship.vz,0);assert.equal(ship.emergencyBrake,false);
  for(let i=0;i<40;i++)drive(ship,{inertialOff:true},.05);
  assert.ok(startManeuver(ship,{action:'emergencyBrake'}));
 }
 assert.equal(startManeuver(pilot([part('hull')]),{action:'emergencyBrake'}),false);
 assert.equal(make().emergencyBrake,false);assert.equal(make().emergencyBrakeCooldown,0);
});
test('dash is lateral displacement; Shift dash leaves persistent momentum until compensation returns',()=>{
 for(const drift of [false,true]){
  const ship=make();startManeuver(ship,{action:'rightDash',drift});
  stepManeuver(ship,.22);near(ship.x,4);assert.equal(ship.maneuver,null);
  const speed=ship.vx;assert.equal(speed>0,drift);
  for(let i=0;i<40;i++)drive(ship,{inertialOff:true},.05);near(ship.vx,speed);near(ship.x,4+speed*2);
  for(let i=0;i<1000;i++)drive(ship,{},.05);near(ship.speed,0);
 }
});
test('backward loop leaves the combat plane, disables all weapons and remains hittable near the plane',()=>{
 const ship=make(),enemy=make();startManeuver(ship,{action:'backwardLoop'});assert.ok(weaponsBlocked(ship));
 const shots=[];fire(ship,0,shots);assert.equal(shots.length,0);
 stepManeuver(ship,.6);assert.ok(ship.altitude>ship.radius);near(ship.pitch,Math.PI);
 const shot=()=>({x:ship.x,z:ship.z+2,vx:0,vz:-50,life:1,owner:1,kind:'cannon',damage:25});
 const hp=ship.hull;assert.equal(advanceBullets([shot()],[ship,enemy],.1).length,1);near(ship.hull,hp);
 const laser=pilot([part('hull'),part('laserLine')]);laser.z=ship.z+20;laser.x=ship.x;assert.equal(advanceLasers([laser,ship],.05).length,0);
 stepManeuver(ship,.6);near(ship.altitude,0);near(ship.pitch,0);assert.equal(weaponsBlocked(ship),false);
 assert.equal(advanceBullets([shot()],[ship,enemy],.1).length,0);near(ship.hull,hp-25);fire(ship,0,shots);assert.ok(shots.length>0);
 startManeuver(laser,{action:'backwardLoop'});assert.equal(advanceLasers([laser,enemy],.05).length,0);
});
test('roll retains approved parameters; maneuvers cannot overlap and reset clears state',()=>{
 const ship=make();assert.ok(startManeuver(ship,{action:'rightRoll'}));assert.ok(ship.dodge);assert.equal(ship.dodgeCooldown,1.5);assert.equal(weaponsBlocked(ship),false);
 assert.equal(startManeuver(ship,{action:'backwardLoop'}),false);assert.equal(make().maneuver,null);
});
