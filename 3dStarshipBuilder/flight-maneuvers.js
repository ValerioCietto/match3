import {startRoll} from './barrel-roll.js';

export const sequenceDefaults={window:280,dashDuration:.22,dashDistance:4,dashCooldown:.8,loopDuration:1.2,loopCooldown:3,afterburnDuration:1,afterburnCooldown:2,emergencyBrakeCooldown:2};
const canonical={KeyW:'W',KeyA:'A',KeyS:'S',KeyD:'D',ArrowUp:'W',ArrowLeft:'A',ArrowDown:'S',ArrowRight:'D'};
const sequences={WW:'afterburner',SS:'emergencyBrake',AA:'leftDash',DD:'rightDash',WS:'backwardLoop',AD:'rightRoll',DA:'leftRoll'};
export function sequenceState(){return {last:null,time:0,released:false,down:new Set()};}
export function resetSequence(state){state.last=null;state.time=0;state.released=false;state.down.clear();}
export function sequenceInput(state,code,time,{up=false,repeat=false,shift=false,window=sequenceDefaults.window}={}){
 const key=canonical[code];if(!key)return null;
 if(up){state.down.delete(key);if(state.last===key)state.released=true;return null;}
 if(repeat||state.down.has(key))return null;
 // A sequence requires a fresh press after releasing the previous key, not a chord.
 const chord=state.down.size>0;state.down.add(key);
 const action=!chord&&state.released&&time-state.time>=0&&time-state.time<=window?sequences[state.last+key]:null;
 state.last=action||chord?null:key;state.time=time;state.released=false;
 return action?{action,drift:shift&&(action==='leftDash'||action==='rightDash')}:null;
}
export function maneuverState(){return {maneuver:null,maneuverCooldown:0,afterburn:0,afterburnCooldown:0,emergencyBrake:false,emergencyBrakeCooldown:0,altitude:0,pitch:0};}
export function startManeuver(ship,command){
 if(!command||ship.hull<=0||ship.maneuver||ship.dodge)return false;
 const {action,drift=false}=command;
 if(action==='emergencyBrake'){
  if(ship.emergencyBrake||ship.emergencyBrakeCooldown>1e-9||!(ship.stats.acceleration>0||ship.stats.reverseEngineAcceleration>0))return false;
  ship.emergencyBrake=true;ship.emergencyBrakeCooldown=sequenceDefaults.emergencyBrakeCooldown;ship.afterburn=0;return true;
 }
 if(ship.emergencyBrake)return false;
 if(action==='afterburner'){
  if(ship.afterburnCooldown>1e-9||ship.stats.thrust<=0)return false;
  ship.afterburn=sequenceDefaults.afterburnDuration;ship.afterburnCooldown=sequenceDefaults.afterburnCooldown;return true;
 }
 if(action==='leftRoll'||action==='rightRoll')return startRoll(ship,action==='leftRoll'?-1:1);
 if(ship.maneuverCooldown>1e-9)return false;
 if(action==='leftDash'||action==='rightDash'){
  const direction=action==='leftDash'?-1:1;
  ship.maneuver={type:'dash',elapsed:0,duration:sequenceDefaults.dashDuration,dx:Math.cos(ship.yaw)*direction,dz:Math.sin(ship.yaw)*direction,drift};
  ship.maneuverCooldown=sequenceDefaults.dashCooldown;return true;
 }
 if(action==='backwardLoop'){
  ship.maneuver={type:'loop',elapsed:0,duration:sequenceDefaults.loopDuration,fx:Math.sin(ship.yaw),fz:-Math.cos(ship.yaw),radius:Math.max(3,ship.radius*1.25)};
  ship.maneuverCooldown=sequenceDefaults.loopCooldown;return true;
 }
 return false;
}
export function stepManeuver(ship,dt){
 ship.emergencyBrakeCooldown=Math.max(0,ship.emergencyBrakeCooldown-dt);
 ship.afterburn=Math.max(0,ship.afterburn-dt);ship.afterburnCooldown=Math.max(0,ship.afterburnCooldown-dt);ship.maneuverCooldown=Math.max(0,ship.maneuverCooldown-dt);
 const m=ship.maneuver;if(!m)return;
 const old=m.elapsed/m.duration;m.elapsed=Math.min(m.duration,m.elapsed+dt);const t=m.elapsed/m.duration;
 if(m.type==='dash'){
  const travel=(t-old)*sequenceDefaults.dashDistance;ship.x+=m.dx*travel;ship.z+=m.dz*travel;
 }else{
  const previous=Math.sin(old*Math.PI*2)*m.radius,next=Math.sin(t*Math.PI*2)*m.radius;
  ship.x-=(next-previous)*m.fx;ship.z-=(next-previous)*m.fz;
  ship.altitude=(1-Math.cos(t*Math.PI*2))*m.radius;ship.pitch=t*Math.PI*2;
 }
 if(t>=1-1e-9){
  if(m.type==='dash'&&m.drift){const speed=sequenceDefaults.dashDistance/m.duration;ship.vx+=m.dx*speed;ship.vz+=m.dz*speed;}
  ship.maneuver=null;ship.altitude=0;ship.pitch=0;
 }
}
export const weaponsBlocked=ship=>ship.maneuver?.type==='loop';
export function maneuverStatus(ship){const action=ship.emergencyBrake?' · Emergency brake':ship.maneuver?` · ${ship.maneuver.type==='loop'?'Backward loop — weapons offline':ship.maneuver.drift?'Drift':'Dash'}`:ship.afterburn>0?' · Afterburner':'';return action+(!ship.emergencyBrake&&ship.emergencyBrakeCooldown>0?` · Brake ready in ${ship.emergencyBrakeCooldown.toFixed(1)}s`:'');}
