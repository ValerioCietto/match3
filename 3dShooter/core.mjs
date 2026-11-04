export const COURSE_RADIUS = 40;
export const CURVATURE_STEPS=Array.from({length:10},(_,i)=>Number((2+7.9*Math.sqrt(i/9)).toFixed(3)));
export function sampleEntrance(z,radius=COURSE_RADIUS,random=Math.random){
  const angle=random()*Math.PI*2,r=Math.sqrt(random())*radius;
  return [Math.cos(angle)*r,Math.sin(angle)*r,z];
}
export const ARENA_UPGRADES = [
  {id:'always_to_the_max',name:'ALWAYS TO THE MAX',description:'Boost at 2x speed (64 m/s). Tap Boost or press Shift to toggle it on or off instead of holding.',type:'toggle',cost:40},
  {id:'curvature',name:'CURVATURE',description:'10 levels: boost multiplier rises from 2x to 9.9x along a square-root curve. Costs rise from 100 to 1,000 credits.',type:'steps',baseValue:1,values:CURVATURE_STEPS,cost:{min:100,max:1000},requiresLevel:{id:'always_to_the_max',level:1},hideUntilReady:true},
  {id:'ludicrous_speed',name:'LUDICROUS SPEED',description:'Enable a 20x boost multiplier, replacing CURVATURE. During boost: 10x tunnel length, 2x ship/enemy length, and blurred stars. Toggle freely after purchase.',type:'toggle',cost:100000,requiresLevel:{id:'curvature',level:CURVATURE_STEPS.length},hideUntilReady:true},
  {id:'first_person_view',name:'Unlock first person view',description:'Unlocks the cockpit camera in the camera selector.',type:'toggle',cost:10},
  {id:'strategic_view',name:'Unlock strategic camera view',description:'Unlocks the distant chase camera in the camera selector.',type:'toggle',cost:40},
  {id:'auto_aim_control',name:'Enable or disable auto aim',description:'Unlocks a free on/off switch here in the shop. Auto aim starts enabled.',type:'toggle',cost:50},
  {id:'hull_regen',name:'Hull regeneration',description:'Repairs 1 hull per second during flight, up to 100 hull.',type:'toggle',cost:25},
  {id:'aim_size',name:'Bigger aim circle',description:'Adds 5px to the aim circle diameter per level, capped at 100px.',type:'linear',baseValue:48,increment:5,maxValue:100,cost:{base:10,growth:1.25}},
  {id:'guided_missiles',name:'Guided missiles',description:'Automatically launches 1 homing missile every 5 seconds. Each missile deals 3 damage and targets a different enemy.',type:'toggle',cost:10,storage:{flag:'missiles unlocked'}},
  {id:'missile_rate',name:'Missile fire rate',description:'Adds 0.1 volleys per second per level. Starts at 0.2 volleys/s (one every 5 seconds).',type:'linear',requires:'missiles unlocked',baseValue:.2,increment:.1,cost:{base:10,growth:1.3}},
  {id:'missile_amount',name:'Missile amount',description:'Adds 1 missile per volley. Each needs a different living enemy without an incoming missile.',type:'linear',requires:'missiles unlocked',baseValue:1,increment:1,cost:{base:10,growth:1.3}},
  {id:'missile_damage',name:'Missile damage',description:'Adds 1 damage per missile per level.',type:'linear',requires:'missiles unlocked',baseValue:3,increment:1,cost:{base:10,growth:1.3}}
];
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
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const cubeVertices=Array.from({length:8},(_,i)=>[(i&1?.5:-.5),(i&2?.5:-.5),(i&4?.5:-.5)]);
const cubeFaces=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
function icosahedron(){
 const phi=(1+Math.sqrt(5))/2,vertices=[];
 for(const a of [-1,1])for(const b of [-1,1])vertices.push([0,a,b*phi],[a,b*phi,0],[a*phi,0,b]);
 const faces=[];
 for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++){
  const normal=cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i]));
  const distances=vertices.map(v=>dot(normal,sub(v,vertices[i])));
  if(length(normal)>1e-6&&!(distances.some(d=>d>1e-7)&&distances.some(d=>d< -1e-7)))faces.push([i,j,k]);
 }
 return {vertices:vertices.map(v=>mul(unit(v),.5)),faces};
}
function dodecahedron(){
 const phi=(1+Math.sqrt(5))/2,vertices=[];
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])vertices.push([x,y,z]);
 for(const a of [-1,1])for(const b of [-1,1])vertices.push([0,a/phi,b*phi],[a/phi,b*phi,0],[a*phi,0,b/phi]);
 const faces=[],seen=new Set();
 // Collect the twelve supporting planes, each containing five vertices.
 for(let i=0;i<20;i++)for(let j=i+1;j<20;j++)for(let k=j+1;k<20;k++){
  const normal=unit(cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i])));
  if(length(normal)<.5)continue;
  const distances=vertices.map(v=>dot(normal,sub(v,vertices[i])));
  if(distances.some(d=>d>1e-7)&&distances.some(d=>d< -1e-7))continue;
  const face=distances.flatMap((d,n)=>Math.abs(d)<1e-7?[n]:[]),key=face.join(',');
  if(face.length!==5||seen.has(key))continue;seen.add(key);
  const center=mul(face.reduce((sum,n)=>add(sum,vertices[n]),[0,0,0]),.2);
  const axis=unit(sub(vertices[face[0]],center)),side=cross(normal,axis);
  face.sort((a,b)=>Math.atan2(dot(sub(vertices[a],center),side),dot(sub(vertices[a],center),axis))-Math.atan2(dot(sub(vertices[b],center),side),dot(sub(vertices[b],center),axis)));
  faces.push(face);
 }
 return {vertices:vertices.map(v=>mul(v,.5/Math.sqrt(3))),faces};
}
export const ENEMY_MESHES={
 big_boss:icosahedron(),
 very_small:{vertices:cubeVertices,faces:cubeFaces},
 normal:{vertices:cubeVertices.map(([x,y,z])=>[(x-y)/Math.sqrt(2),(x+y)/Math.sqrt(2),z]),faces:cubeFaces},
 special_ops:{vertices:[[.5,0,0],[-.5,0,0],[0,.5,0],[0,-.5,0],[0,0,.5],[0,0,-.5]],faces:[[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]]},
 stealth:{vertices:[[-.433,-.25,-.06],[.433,-.25,-.06],[0,.5,-.06],[-.433,-.25,.06],[.433,-.25,.06],[0,.5,.06]],faces:[[0,1,2],[5,4,3],[0,3,4,1],[1,4,5,2],[2,5,3,0]]},
 boss:dodecahedron()
};
export function enemyRadius(enemy){return enemy.size*(enemy.name==='normal'||enemy.name==='very_small'?Math.sqrt(3)/2:enemy.name==='stealth'?.51:.5);}
export function segmentHitsSphere(a,b,center,radius){
 const delta=sub(b,a),squared=dot(delta,delta);
 const t=squared?Math.max(0,Math.min(1,dot(sub(center,a),delta)/squared)):0;
 return length(sub(add(a,mul(delta,t)),center))<=radius;
}
export function hitsEnemy(a,b,enemy){return enemy.name==='very_small'?segmentHitsBox(a,b,enemy.p,enemy.size/2+.15):segmentHitsSphere(a,b,enemy.p,enemyRadius(enemy)+.15);}
export function bulletDirection(direction,random=Math.random){
  const axis=unit(direction),reference=Math.abs(axis[1])<.9?[0,1,0]:[1,0,0];
  const tangent=unit(sub(reference,mul(axis,dot(reference,axis))));
  const side=[axis[1]*tangent[2]-axis[2]*tangent[1],axis[2]*tangent[0]-axis[0]*tangent[2],axis[0]*tangent[1]-axis[1]*tangent[0]];
  // Uniform solid-angle sampling within a 1-degree full cone (0.5-degree radius).
  const cosine=1-random()*(1-Math.cos(Math.PI/360)),sine=Math.sqrt(1-cosine*cosine),angle=random()*Math.PI*2;
  return add(mul(axis,cosine),add(mul(tangent,sine*Math.cos(angle)),mul(side,sine*Math.sin(angle))));
}
export function coneDirection(index,count,spread,forward,right,up){
  if(count<=1||index===0||spread<=0)return [...forward];
  // Golden-angle distribution fills the cone's solid angle, with one central shot.
  // Spread is the full opening angle, retaining the existing upgrade's width.
  const cosine=1-index/(count-1)*(1-Math.cos(spread/2));
  const sine=Math.sqrt(Math.max(0,1-cosine*cosine)),azimuth=index*Math.PI*(3-Math.sqrt(5));
  return add(mul(forward,cosine),add(mul(right,sine*Math.cos(azimuth)),mul(up,sine*Math.sin(azimuth))));
}
export function segmentHitsBox(a,b,center,half) {
  let lo=0, hi=1;
  for(let i=0;i<3;i++) {
    const d=b[i]-a[i], p=a[i]-center[i];
    if(Math.abs(d)<1e-9) { if(Math.abs(p)>half) return false; }
    else { let t1=(-half-p)/d,t2=(half-p)/d; if(t1>t2) [t1,t2]=[t2,t1]; lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return false; }
  }
  return true;
}
export function upgradeCost(u,level=0) {if(u.type==='steps')return Math.round(u.cost.min+(u.cost.max-u.cost.min)*Math.sqrt(Math.min(level,u.values.length-1)/Math.max(1,u.values.length-1)));return typeof u.cost==='number'?u.cost:Math.ceil(u.cost.base*u.cost.growth**level);}
export function upgradeValue(u,level=0) {if(u.type==='steps')return level<=0?u.baseValue:u.values[Math.min(Math.floor(level),u.values.length)-1];return Math.max(u.minValue??-Infinity,Math.min(u.maxValue??Infinity,u.baseValue+u.increment*level));}
