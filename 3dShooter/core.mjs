export const RADII = [100, 65, 130];
export const ARENA_UPGRADES = [
  {id:'hull_regen',name:'Hull regeneration',description:'Repairs 1 hull per second during flight, up to 100 hull.',type:'toggle',cost:25},
  {id:'aim_size',name:'Bigger aim circle',description:'Adds 5px to the aim circle diameter per level, capped at 100px.',type:'linear',baseValue:48,increment:5,maxValue:100,cost:{base:10,growth:1.25}},
  {id:'guided_missiles',name:'Guided missiles',description:'Automatically launches 1 homing missile every 5 seconds. Each missile deals 3 damage and targets a different enemy.',type:'toggle',cost:10,storage:{flag:'missiles unlocked'}},
  {id:'missile_rate',name:'Missile fire rate',description:'Adds 0.1 volleys per second per level. Starts at 0.2 volleys/s (one every 5 seconds).',type:'linear',requires:'missiles unlocked',baseValue:.2,increment:.1,cost:{base:10,growth:1.3}},
  {id:'missile_amount',name:'Missile amount',description:'Adds 1 missile per volley. Each needs a different living enemy without an incoming missile.',type:'linear',requires:'missiles unlocked',baseValue:1,increment:1,cost:{base:10,growth:1.3}},
  {id:'missile_damage',name:'Missile damage',description:'Adds 1 damage per missile per level.',type:'linear',requires:'missiles unlocked',baseValue:3,increment:1,cost:{base:10,growth:1.3}}
];
// Uniform volume sampling: uniform direction and cube-root radial distribution.
export function sampleEllipsoid(random = Math.random) {
  const z = random() * 2 - 1, a = random() * Math.PI * 2, r = Math.cbrt(random());
  const t = Math.sqrt(1 - z * z);
  return [r * t * Math.cos(a) * RADII[0], r * z * RADII[1], r * t * Math.sin(a) * RADII[2]];
}
export const enemyTypes = [
  {name:'very_small', threshold:.2, size:1, hp:1, speed:2.5, color:'#9c303c', bounty:1},
  {name:'stealth', threshold:.4, size:2.4, hp:2, speed:1.75, color:'#171e2c', bounty:3},
  {name:'normal', threshold:.89, size:3, hp:3, speed:1.25, color:'#8b96a9', bounty:2},
  {name:'special_ops', threshold:.99, size:4, hp:5, speed:0.75, color:'#324fa5', bounty:4},
  {name:'boss', threshold:1, size:10, hp:80, speed:0.5, color:'#ecf4ff', bounty:50}
];
export const chooseEnemy = (roll = Math.random()) => enemyTypes.find(t => roll < t.threshold) || enemyTypes[4];
export const add = (a,b) => a.map((v,i)=>v+b[i]);
export const sub = (a,b) => a.map((v,i)=>v-b[i]);
export const mul = (a,s) => a.map(v=>v*s);
export const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
export const length = a => Math.hypot(...a);
export const unit = a => mul(a,1/(length(a)||1));
export function segmentHitsBox(a,b,center,half) {
  let lo=0, hi=1;
  for(let i=0;i<3;i++) {
    const d=b[i]-a[i], p=a[i]-center[i];
    if(Math.abs(d)<1e-9) { if(Math.abs(p)>half) return false; }
    else { let t1=(-half-p)/d,t2=(half-p)/d; if(t1>t2) [t1,t2]=[t2,t1]; lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return false; }
  }
  return true;
}
export function upgradeCost(u,level=0) {return typeof u.cost==='number'?u.cost:Math.ceil(u.cost.base*u.cost.growth**level);}
export function upgradeValue(u,level=0) {return Math.max(u.minValue??-Infinity,Math.min(u.maxValue??Infinity,u.baseValue+u.increment*level));}
