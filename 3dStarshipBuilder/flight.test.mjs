import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flightState,stepFlight,flightBasis} from './flight.js';
import {recommendedStats} from './stats.js';
import {preset,part} from './model.js';
test('flight accelerates to the recommended throttle speed and brakes',()=>{
  const stats=recommendedStats(preset('interceptor')),state=flightState();state.throttle=1;
  for(let i=0;i<6000;i++)stepFlight(state,stats,{},.05);
  assert.ok(Math.abs(state.speed-stats.maxSpeed)<.001);assert.ok(state.position[2]<0&&state.distance>0);
  const speed=state.speed;for(let i=0;i<100;i++)stepFlight(state,stats,{brake:true},.05);assert.ok(state.speed<speed*.1);
});
test('steering respects turn acceleration and rate, and restart state is independent',()=>{
  const stats=recommendedStats(preset('interceptor')),state=flightState();stepFlight(state,stats,{yaw:1,pitch:1},.01);
  assert.ok(state.yawRate<=stats.turnAcceleration*Math.PI/180*.01+1e-9);
  for(let i=0;i<500;i++)stepFlight(state,stats,{yaw:1},.05);
  assert.ok(state.yaw>0&&state.yawRate<=stats.turnMaxSpeed*Math.PI/180);assert.notDeepEqual(flightBasis(state).forward,[0,0,-1]);assert.equal(flightState().speed,0);
});
test('unpowered ships remain stationary; throttle and pitch are bounded',()=>{
  const state=flightState(),stats=recommendedStats([part('hull')]);for(let i=0;i<1000;i++)stepFlight(state,stats,{throttle:1,pitch:1},.05);
  assert.equal(state.speed,0);assert.deepEqual(state.position,[0,0,0]);assert.equal(state.throttle,1);assert.ok(state.pitch<=1.4);
});
