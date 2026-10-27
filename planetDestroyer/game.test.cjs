// Run with: node planetDestroyer/game.test.cjs
// Exercise the actual simulation with a minimal DOM; browser rendering is separate.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const data=JSON.parse(readFileSync(path.join(__dirname,'weapons.json'),'utf8'));
function configuredDrone(level,key){const d=data.weapons.find(w=>w.id==='mining_drones');let value=d.baseStats[key];for(const u of d.upgrades.filter(u=>u.level<=level)){value+=u.modifiers.add?.[key]||0;value*=u.modifiers.multiply?.[key]??1;}return value;}
const elements=new Map(),storage=new Map();
const context2d=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function element(id){
  if(!elements.has(id))elements.set(id,{id,hidden:true,style:{},dataset:{},classList:{toggle(){}},addEventListener(){},setAttribute(){},focus(){},blur(){},querySelector(){return null;},querySelectorAll(){return [];},getContext(){return context2d;},getBoundingClientRect(){return {width:1000,height:800,left:0,top:0};}});
  return elements.get(id);
}
const sandbox={console,Math,Map,Set,JSON,Number,Object,Array,String,Infinity,Error,SyntaxError,
  document:{getElementById:element,addEventListener(){},activeElement:null},
  window:{addEventListener(){},confirm:()=>true,devicePixelRatio:1},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},
};
let source=readFileSync(path.join(__dirname,'game.js'),'utf8');
source=source.replace('  init();',`globalThis.test={shockwaveMultiplier,pushLiquid,updateShockwaves,visitLevel,openGalaxy,unlockedLevel,generatePlanet,rayBlocks,damage,stats,fire,update,save,load,draw,resize,renderShop,completeLevel,nextLevel,compactMantle,collides,guideMissile,advanceNuke,detonateNuke,syncDrones,assignDroneTargets,fireDroneLaser,updateDrones,interceptAttack,hexSector,regenerateBlocks,reflectProjectile,updateCoreWaves,pushShip,infectBlock,updateSnow,updatePlague,
  setup(data,index=0){definitions=data.weapons;byId=Object.fromEntries(definitions.map(d=>[d.id,d]));state=freshState();state.level=index;planet=generatePlanet(index,state.seed);resetFlight();auto=false;mode='play';},
  get state(){return state;},get planet(){return planet;},get ship(){return ship;},get mode(){return mode;},get bullets(){return bullets;},get effects(){return effects;},get drones(){return drones;},get shells(){return shells;},get blades(){return blades;},get cooldowns(){return cooldowns;},get waves(){return waves;},get shockwaves(){return shockwaves;},get snow(){return snow;},get plagueContacts(){return plagueContacts;},
  equip(id){state.owned[id]=1;state.slots=[id,null,null];},fireOn(){auto=true;},stop(){auto=false;},
  aimAt(x,y){pointer={x,y,moved:true};ship.angle=Math.atan2(y-ship.y,x-ship.x);}
};`);
vm.runInNewContext(source,sandbox,{filename:'game.js'});
const game=sandbox.test;
game.setup(data);
let previousHP=0;
for(let level=0;level<10;level++){
  const p=game.generatePlanet(level),counts=[1000,1200,1400,1600,1800,2000,2250,2500,2750,3000];
  if(level===6)assert.ok(p.total<counts[level],'Turtle hollow rows contain no blocks');else assert.equal(p.total,counts[level]);assert.equal(p.grid.size,p.total);
  const total=p.blocks.reduce((sum,b)=>sum+b.max,0);if(![3,5].includes(level))assert.ok(total>previousHP);previousHP=total;
  assert.ok(new Set(p.blocks.map(b=>b.name)).size>=([3,6].includes(level)?2:3));
  for(const b of p.blocks)assert.ok(p.grid.has(`${-b.i-1},${-b.j-1}`),'Central symmetry');
  const visited=new Set(),queue=[p.blocks[0]];
  while(queue.length){const b=queue.pop();if(visited.has(b.id))continue;visited.add(b.id);for(const [di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const neighbor=p.grid.get(`${b.i+di},${b.j+dj}`);if(neighbor&&!visited.has(neighbor.id))queue.push(neighbor);}}
  assert.equal(visited.size,level===6?p.coreTotal:p.total,level===6?'Turtle core is separated from the shell':'Connected planet');
  console.log(`Level ${level+1}: ${p.total} blocks, ${level===6?'separate shell/core':'connected'}, ${total} total HP`);
}
const block=game.planet.blocks[0],before=game.state.credits;
game.damage(block,999);const after=game.state.credits;assert.ok(after>before);
game.damage(block,999);assert.equal(game.state.credits,after,'No double credit');
assert.equal(game.planet.remaining,999);
for(const d of data.weapons){
  game.setup(data);game.equip(d.id);
  if(d.behavior==='orbiting_blade')game.ship.y=-game.planet.radius-28;
  game.aimAt(0,0);game.fireOn();
  for(let frame=0;frame<240;frame++)game.update(1/60);
  assert.ok(game.planet.blocks.some(b=>b.hp<b.max),`${d.name} deals damage`);
  game.stop();game.state.owned[d.id]=5;
  const s=game.stats(d.id);assert.equal(s.damage,d.behavior==='mining_drones'?configuredDrone(5,'damage'):d.behavior==='plague'?5:d.behavior==='shockwave'?d.baseStats.damage:d.baseStats.damage*2);
  const timing=d.baseStats.cooldown?'cooldown':d.baseStats.cycleDuration?'cycleDuration':'contactInterval';
  assert.ok(Math.abs(s[timing]-d.baseStats[timing]*(['mining_drones','plague','shockwave'].includes(d.behavior)?1:.92**4))<1e-9);
  game.resize();game.draw();game.renderShop();
  console.log(`${d.name}: damage, upgrades, and render paths passed`);
}
game.setup(data);
const hits=game.rayBlocks(0,-600,0,600);assert.ok(hits.length>20,'Swept ray intersects thin rows');
game.damage(hits[0],1);game.state.credits=123;game.save();game.load();
assert.equal(game.state.credits,123);assert.equal(game.planet.remaining,999,'Damage survives reload');
for(const b of game.planet.blocks)game.damage(b,100);
const credits=game.state.credits;game.completeLevel();assert.equal(game.state.credits,credits+200);
game.completeLevel();assert.equal(game.state.credits,credits+200,'Bonus awarded once');
game.nextLevel();assert.equal(game.state.level,1);assert.equal(game.planet.remaining,1200);
console.log('Save/resume, swept collision, level transition, and one-time completion bonus passed.');

game.setup(data);
for(const b of game.planet.blocks){
  const depth=(game.planet.radius-Math.hypot(b.x,b.y))/16;
  if(depth<1){assert.equal(b.name,'Gas');assert.equal(b.max,1);}
  else if(depth<3){assert.equal(b.name,'Crust');assert.equal(b.max,4);}
  else if(b.core){assert.equal(b.max,20);assert.equal(b.phase,'solid');}
  else {assert.equal(b.max,6);assert.equal(b.phase,'liquid');}
}
const liquid=game.planet.blocks.find(b=>b.phase==='liquid'&&game.planet.blocks.some(n=>n.phase==='liquid'&&Math.abs(n.i-b.i)<=1&&Math.abs(n.j-b.j)<=1&&Math.hypot(n.x,n.y)>Math.hypot(b.x,b.y)));
game.damage(liquid,999);
const oldPositions=game.planet.blocks.map(b=>[b.i,b.j]);
for(let i=0;i<59;i++)game.update(1/60);
assert.ok(game.planet.blocks.every((b,i)=>b.i===oldPositions[i][0]&&b.j===oldPositions[i][1]),'No early compaction');
game.update(1/60);
assert.ok(game.planet.blocks.some((b,i)=>b.i!==oldPositions[i][0]||b.j!==oldPositions[i][1]),'Liquid settles after one second');
for(const b of game.planet.blocks){const [i,j]=oldPositions[b.id];if(b.phase!=='liquid')assert.deepEqual([b.i,b.j],[i,j]);else assert.ok(Math.hypot(b.i+.5,b.j+.5)<=Math.hypot(i+.5,j+.5));}
assert.equal(new Set(game.planet.blocks.filter(b=>b.hp>0).map(b=>`${b.i},${b.j}`)).size,game.planet.remaining,'Liquid cells never overlap');
const compacted=JSON.stringify(game.planet.blocks.map(b=>[b.i,b.j,b.hp]));game.save();game.load();
assert.equal(JSON.stringify(game.planet.blocks.map(b=>[b.i,b.j,b.hp])),compacted,'Liquid positions and damage persist');
for(const index of [0,1]){
  game.setup(data,index);
  if(index===1)for(const b of game.planet.blocks){const depth=(game.planet.radius-Math.hypot(b.x,b.y))/16;if(depth<5){assert.equal(b.core,false);assert.equal(b.max,b.name==='Polar weakness'?5:50);}else {assert.equal(b.max,30);assert.ok(b.core);}}
  const cores=game.planet.blocks.filter(b=>b.core);
  cores.slice(0,-1).forEach(b=>game.damage(b,999));assert.equal(game.planet.collapse,null,'Core must be entirely destroyed');
  game.damage(cores.at(-1),999);assert.equal(game.planet.collapse,0);assert.ok(game.planet.remaining>0);
  game.update(.5);game.save();game.load();assert.equal(game.planet.collapse,.5,'Collapse resumes from saved progress');
  const expected=game.state.credits+game.planet.blocks.filter(b=>b.hp>0).reduce((sum,b)=>sum+b.reward,0)+[200,250][index];
  game.update(1);assert.equal(game.planet.remaining,0);assert.equal(game.state.credits,expected);assert.equal(game.mode,'complete');
  game.completeLevel();assert.equal(game.state.credits,expected,'Collapse pays only once');
}
game.setup(data,2);
const gold=game.planet.blocks.filter(b=>b.gold);assert.equal(gold.length,100);
assert.ok(gold.every(b=>b.reward===10));assert.equal(game.planet.coreTotal,0);
const goldIds=gold.map(b=>b.id).join(',');game.save();game.load();assert.equal(game.planet.blocks.filter(b=>b.gold).map(b=>b.id).join(','),goldIds);
const alternate=game.generatePlanet(2,game.state.seed+1);assert.notEqual(alternate.blocks.filter(b=>b.gold).map(b=>b.id).join(','),goldIds,'New seed scatters new gold locations');
const currentGold=game.planet.blocks.find(b=>b.gold);game.damage(currentGold,999);const goldCredits=game.state.credits;assert.equal(goldCredits,10);game.damage(currentGold,999);assert.equal(game.state.credits,10);
console.log('Terra materials/settling/save, Bedrock shell/poles, core collapse/rewards/resume, and exactly 100 seeded Cinder gold blocks passed.');

game.setup(data);game.equip('guided_missiles');game.aimAt(0,0);game.fire('guided_missiles');
assert.equal(game.bullets.length,6,'Six missiles per base flurry');
game.update(1/60);
assert.equal(game.bullets.filter(m=>!m.pending).length,1,'Missiles launch sequentially');
const missile=game.bullets[0];assert.notEqual(missile.targetId,null,'Missile acquires a surface target');
const firstTarget=missile.targetId;game.damage(game.planet.blocks[firstTarget],999);
for(let i=0;i<10;i++)game.update(1/60);
assert.notEqual(missile.targetId,firstTarget,'Destroyed targets are reacquired');
assert.ok(missile.trail.length<=12,'Trails remain bounded');
// A stationary homing probe tests turn limits independently of impact timing.
const probe={...missile,trail:[],targetId:null,seekTimer:0,x:game.ship.x,y:game.ship.y,vx:350,vy:0,left:1000,pending:false};
game.guideMissile(probe,1/60);
const heading=Math.atan2(probe.vy,probe.vx);
assert.ok(heading>0&&heading<=probe.s.turnRateDegrees*Math.PI/180/60+1e-9,'Homing turns toward the target at a bounded rate');
assert.ok(Math.abs(Math.hypot(probe.vx,probe.vy)-350)<1e-6);
for(let i=0;i<250;i++)game.update(1/60);
assert.equal(game.bullets.length,0,'Released-trigger flurry finishes and expires');
assert.ok(game.planet.remaining<1000,'Flurry destroys blocks without holding the trigger');
game.state.owned.guided_missiles=5;assert.equal(game.stats('guided_missiles').missileCount,10);assert.equal(game.stats('guided_missiles').damage,6);
game.save();game.load();assert.equal(game.state.owned.guided_missiles,5);assert.equal(game.state.slots[0],'guided_missiles');
console.log('Guided flurry: staggered launch, homing turn limit, retargeting, expiry, damage, upgrades, and persistence passed.');

game.setup(data,2);game.equip('guided_laser');game.aimAt(0,-2000);
const nearestBlock=()=>game.planet.blocks.filter(b=>b.hp>0).sort((a,b)=>Math.hypot(a.x-game.ship.x,a.y-game.ship.y)-Math.hypot(b.x-game.ship.x,b.y-game.ship.y)||a.id-b.id)[0];
let laserTarget=nearestBlock(),hpBefore=laserTarget.hp;
game.fire('guided_laser');assert.equal(laserTarget.hp,hpBefore-.75,'Laser hits nearest block while aiming away');
assert.equal(game.effects.filter(e=>e.type==='line').length,1);
for(let level=2;level<=5;level++){
  game.state.owned.guided_laser=level;
  const stats=game.stats('guided_laser');assert.equal(stats.rayCount,level,'Each upgrade adds exactly one ray');
  laserTarget=nearestBlock();hpBefore=laserTarget.hp;
  const expectedTargets=game.planet.blocks.filter(b=>b.hp>0).sort((a,b)=>Math.hypot(a.x-game.ship.x,a.y-game.ship.y)-Math.hypot(b.x-game.ship.x,b.y-game.ship.y)||a.id-b.id).slice(0,level);
  const hpSnapshot=game.planet.blocks.map(b=>b.hp);
  const raysBefore=game.effects.filter(e=>e.type==='line').length;
  game.fire('guided_laser');assert.equal(laserTarget.hp,Math.max(0,hpBefore-stats.damage),'Nearest block takes one ray, not all rays');
  for(const b of game.planet.blocks)assert.equal(b.hp,expectedTargets.includes(b)?Math.max(0,hpSnapshot[b.id]-stats.damage):hpSnapshot[b.id],'Each ray damages a different nearest block');
  assert.equal(game.effects.filter(e=>e.type==='line').length-raysBefore,level);
  const endpoints=game.effects.filter(e=>e.type==='line').slice(-level).map(e=>`${e.points[1].x},${e.points[1].y}`);
  assert.equal(new Set(endpoints).size,level,'Every rendered ray has a distinct target');
}
game.damage(laserTarget,999);const nextLaserTarget=nearestBlock();hpBefore=nextLaserTarget.hp;game.fire('guided_laser');assert.ok(nextLaserTarget.hp<hpBefore,'Destroyed target is replaced on the next pulse');
game.ship.x=5000;game.ship.y=5000;
const totalHP=game.planet.blocks.reduce((sum,b)=>sum+b.hp,0),effectCount=game.effects.length;
game.fire('guided_laser');assert.equal(game.planet.blocks.reduce((sum,b)=>sum+b.hp,0),totalHP);assert.equal(game.effects.length,effectCount,'No beam outside range');
game.setup(data,2);game.equip('guided_laser');game.fireOn();
for(let frame=0;frame<60;frame++)game.update(1/60);
const damageDone=game.planet.blocks.reduce((sum,b)=>sum+b.max-b.hp,0);assert.ok(damageDone>=7.5&&damageDone<=9,'High-rate fire delivers around eleven pulses per second');
game.stop();game.update(.2);const releasedHP=game.planet.blocks.reduce((sum,b)=>sum+b.hp,0);game.update(.2);assert.equal(game.planet.blocks.reduce((sum,b)=>sum+b.hp,0),releasedHP,'Release stops laser fire');
game.state.owned.guided_laser=5;game.save();game.load();assert.equal(game.state.owned.guided_laser,5);assert.equal(game.state.slots[0],'guided_laser');
game.setup(data,2);game.equip('guided_laser');game.state.owned.guided_laser=5;
game.planet.blocks.slice(2).forEach(b=>b.hp=0);game.ship.x=0;game.ship.y=0;
const survivors=game.planet.blocks.slice(0,2),remainingHP=survivors.map(b=>b.hp);
game.fire('guided_laser');assert.equal(game.effects.filter(e=>e.type==='line').length,2,'Surplus rays idle when only two targets remain');
survivors.forEach((b,i)=>assert.equal(b.hp,remainingHP[i]-game.stats('guided_laser').damage));
console.log('Guided laser: distinct nearest targets, one ray per block, idle surplus rays, range, high fire rate, release, and save passed.');

game.setup(data,2);game.equip('piercing_nuke');
for(let level=1;level<=5;level++){game.state.owned.piercing_nuke=level;const stats=game.stats('piercing_nuke');assert.equal(stats.drillBlocks,5*level);assert.equal(stats.blastRadiusBlocks,4*level);}
game.state.owned.piercing_nuke=1;game.aimAt(75,-500);game.fire('piercing_nuke');
const aimedNuke=game.bullets[0];assert.equal(aimedNuke.tx,75);assert.equal(aimedNuke.ty,-500);
game.aimAt(-100,100);game.advanceNuke(aimedNuke,10);assert.equal(aimedNuke.x,75);assert.equal(aimedNuke.y,-500);assert.ok(aimedNuke.exploded,'Mouse target is captured at launch, even in empty space');

// A high-HP line verifies exact drill count, swept collision, radius edges, and no duplicate detonation.
game.setup(data,2);game.equip('piercing_nuke');
const template=game.planet.blocks[0];game.planet.blocks=Array.from({length:12},(_,i)=>({...template,id:i,i,j:0,x:(i+.5)*16,y:8,hp:100,max:100,reward:1,core:false}));
game.planet.grid.clear();for(const b of game.planet.blocks)game.planet.grid.set(`${b.i},0`,b);game.planet.remaining=12;game.planet.total=12;
game.ship.x=-40;game.ship.y=8;game.aimAt(120,8);game.fire('piercing_nuke');const nuke=game.bullets[0];
game.advanceNuke(nuke,.16);assert.equal(nuke.drilled.size,1);assert.equal(nuke.exploded,false,'Does not explode at first contact');
game.advanceNuke(nuke,.24);assert.equal(nuke.drilled.size,5);assert.equal(nuke.exploded,false,'Using all drilling capacity does not detonate early');
game.advanceNuke(nuke,1);assert.equal(nuke.drilled.size,5);assert.equal(nuke.exploded,true);assert.equal(nuke.x,120);assert.equal(nuke.y,8);
for(let i=0;i<5;i++)assert.equal(game.planet.blocks[i].hp,0,'Drill destroys even high-HP blocks');
assert.equal(game.planet.blocks[11].hp,80,'Four-block radius includes its edge');assert.equal(game.planet.blocks[5].hp,80,'After drill budget is used, remaining material takes only blast damage');
const credited=game.state.credits,hpAfter=game.planet.blocks.map(b=>b.hp).join(',');game.detonateNuke(nuke,nuke.x,nuke.y);assert.equal(game.state.credits,credited);assert.equal(game.planet.blocks.map(b=>b.hp).join(','),hpAfter);
game.setup(data,2);game.equip('piercing_nuke');game.aimAt(game.ship.x,game.ship.y);game.fire('piercing_nuke');const zeroDistance=game.bullets[0];game.advanceNuke(zeroDistance,1/60);assert.ok(zeroDistance.exploded);assert.ok(Number.isFinite(zeroDistance.x),'Zero-distance aim detonates safely');
game.state.owned.piercing_nuke=5;game.save();game.load();assert.equal(game.state.owned.piercing_nuke,5);assert.equal(game.state.slots[0],'piercing_nuke');
console.log('Piercing nuke: mouse targeting, target lock, exact arrival, drill budget, blast radius, empty-space/zero-distance shots, one-time detonation, and save passed.');

game.setup(data,2);game.equip('mining_drones');game.syncDrones();
assert.equal(game.drones.length,1);const initialDrone=game.drones[0];
assert.ok(Math.hypot(initialDrone.x-game.ship.x,initialDrone.y-game.ship.y)>=30);
assert.ok(Math.hypot(initialDrone.x-game.ship.x,initialDrone.y-game.ship.y)<=70);
const startPosition={x:initialDrone.x,y:initialDrone.y};
for(let frame=0;frame<180;frame++)game.update(1/60);
assert.ok(game.planet.blocks.some(b=>b.hp<b.max),'Drone fires with Space released and auto OFF');
assert.ok(Math.hypot(initialDrone.x-startPosition.x,initialDrone.y-startPosition.y)>1,'Drone roams independently');
for(let level=1;level<=5;level++){
  game.state.owned.mining_drones=level;game.syncDrones();const s=game.stats('mining_drones');
  assert.equal(s.damage,configuredDrone(level,'damage'));assert.equal(s.penetration,configuredDrone(level,'penetration'));assert.equal(s.droneCount,configuredDrone(level,'droneCount'));assert.equal(game.drones.length,s.droneCount);
}
assert.equal(game.drones[0],initialDrone,'Upgrade retains existing drones');
game.syncDrones();assert.equal(game.drones.length,configuredDrone(5,'droneCount'),'Sync never duplicates drones');

// Equal-position drones reserve different nearest visible blocks, then idle when targets run out.
const droneTemplate=game.planet.blocks[0];
game.planet.blocks=[[2,0],[0,-3],[-3,0],[0,2],[2,2]].map(([i,j],id)=>({...droneTemplate,id,i,j,x:(i+.5)*16,y:(j+.5)*16,hp:100,max:100,core:false}));
game.planet.grid.clear();for(const b of game.planet.blocks)game.planet.grid.set(`${b.i},${b.j}`,b);
for(const drone of game.drones){drone.x=0;drone.y=0;}
game.assignDroneTargets(game.stats('mining_drones'));
assert.equal(game.drones.filter(d=>d.targetId!==null).map(d=>d.targetId).join(','),'0,1,2,3,4','Distinct nearest target reservations');
game.planet.blocks.slice(1).forEach(b=>b.hp=0);game.assignDroneTargets(game.stats('mining_drones'));
assert.equal(game.drones.filter(d=>d.targetId!==null).length,1,'Extra drones idle instead of sharing one target');

game.setup(data,2);game.equip('mining_drones');game.state.owned.mining_drones=3;game.syncDrones();
game.planet.blocks=Array.from({length:5},(_,i)=>({...droneTemplate,id:i,i,j:0,x:(i+.5)*16,y:8,hp:100,max:100,core:false}));
game.planet.grid.clear();for(const b of game.planet.blocks)game.planet.grid.set(`${b.i},0`,b);
const miner=game.drones[0];miner.x=-16;miner.y=8;miner.targetId=0;
assert.ok(game.fireDroneLaser(miner,game.stats('mining_drones')));
assert.equal(game.planet.blocks.map(b=>b.hp).join(','),[0,1,2,3,4].map(i=>i<configuredDrone(3,'penetration')?100-configuredDrone(3,'damage'):100).join(','),'Drone beam uses configured penetration and damage');
game.state.slots=[null,null,null];game.updateDrones(.1);assert.equal(game.drones.length,0,'Unequipping removes all drones');
game.setup(data,2);game.equip('mining_drones');game.state.owned.mining_drones=5;game.syncDrones();game.save();game.load();
assert.equal(game.state.owned.mining_drones,5);assert.equal(game.drones.length,configuredDrone(5,'droneCount'),'Reload respawns the correct purchased fleet');
game.state.paid.push(game.state.level);game.nextLevel();assert.equal(game.drones.length,configuredDrone(5,'droneCount'),'Next planet retains the fleet size');
console.log('Mining drones: independent fire, random nearby spawn, roaming, exact level scaling, unique nearest targets, idle surplus, piercing damage, unequip, reload, and next level passed.');

function defenseFixture(weapon){
  game.setup(data,3);if(weapon)game.equip(weapon);
  const turret=game.planet.turrets[0],r=Math.hypot(turret.x,turret.y);
  game.planet.turrets.forEach((t,i)=>t.cooldown=i?999:0);
  game.ship.x=turret.x+turret.x/r*60;game.ship.y=turret.y+turret.y/r*60;game.aimAt(0,0);
  return turret;
}
let turret=defenseFixture();
assert.equal(game.planet.turrets.length,30);assert.equal(new Set(game.planet.turrets.map(t=>t.blockId)).size,30);
for(const b of game.planet.blocks){const depth=(game.planet.radius-Math.hypot(b.x,b.y))/16;if(depth<2){assert.equal(b.max,100);assert.equal(b.phase,'solid');}else {assert.equal(b.max,10);assert.equal(b.phase,'liquid');}}
assert.ok(game.planet.turrets.every(t=>game.planet.blocks[t.blockId].max===100));
assert.equal(game.interceptAttack({x:turret.x,y:turret.y-200}),false,'Finite defense range');
assert.equal(game.interceptAttack({x:turret.x-200,y:turret.y-30},{x:turret.x+200,y:turret.y-30}),true,'Swept defense catches fast crossing shots');
assert.equal(game.interceptAttack(game.ship),false,'One interception per recharge');
game.update(.36);assert.equal(game.interceptAttack(game.ship),true,'Turret recharges');
for(const id of ['double_parallel_shot','shotgun','chain_lightning','guided_laser','railgun','guided_missiles','piercing_nuke','mortar','yoyo','boomerang']){
  turret=defenseFixture(id);
  const hp=()=>game.planet.blocks.reduce((n,b)=>n+b.hp,0),before=hp();
  game.fire(id);const beforeCount=game.bullets.length;
  const nuke=id==='piercing_nuke'?game.bullets[0]:null;
  if(id==='railgun')assert.equal(hp(),before,'Railgun blocked before applying instant damage');
  else if(['chain_lightning','guided_laser'].includes(id)){assert.ok(hp()<before,`${id} bypasses point defense`);assert.equal(turret.cooldown,0);continue;}
  else {
    game.update(.016);
    if(['double_parallel_shot','shotgun','guided_missiles','piercing_nuke'].includes(id))assert.ok(game.bullets.length<beforeCount,`${id} intercepted`);
    if(id==='mortar')assert.equal(game.shells.length,0,'Mortar removed without explosion');
    if(['yoyo','boomerang'].includes(id))assert.equal(game.blades.length,0,`${id} intercepted`);
    if(nuke){assert.ok(nuke.neutralized);assert.equal(nuke.exploded,false);assert.equal(nuke.drilled.size,0);game.advanceNuke(nuke,10);assert.equal(nuke.exploded,false);}
    assert.equal(hp(),before,'Intercepted attack does not damage material');
  }
  assert.ok(turret.cooldown>0);
}
turret=defenseFixture('orbiting_buzzsaw');game.fireOn();game.update(.016);assert.ok(game.cooldowns.orbiting_buzzsaw>.9,'Buzzsaw neutralized for one second');game.stop();
turret=defenseFixture('mining_drones');game.syncDrones();const victim=game.drones[0];victim.x=game.ship.x;victim.y=game.ship.y;victim.goal={x:victim.x,y:victim.y};
game.updateDrones(.016);assert.equal(victim.respawn,3);assert.equal(victim.targetId,null);game.syncDrones();assert.equal(game.drones[0],victim,'No immediate replacement bypasses shot-down timer');
game.planet.turrets.forEach(t=>t.cooldown=999);game.updateDrones(3.1);assert.equal(victim.respawn,0,'Drone rebuilds after delay');
turret=defenseFixture();const mount=game.planet.blocks[turret.blockId];game.damage(mount,100);assert.equal(game.interceptAttack(game.ship),false,'Destroying mount disables turret');game.save();game.load();assert.equal(game.planet.blocks[turret.blockId].hp,0,'Destroyed turret mount remains destroyed on reload');
game.setup(data,3);const liquidBlock=game.planet.blocks.find(b=>b.phase==='liquid'&&Math.hypot(b.x,b.y)<32);game.damage(liquidBlock,10);
const beforeLiquid=game.planet.blocks.map(b=>[b.x,b.y]);game.update(1);
assert.ok(game.planet.blocks.some((b,i)=>b.phase==='liquid'&&(b.x!==beforeLiquid[i][0]||b.y!==beforeLiquid[i][1])),'Basalt liquid compacts');
game.resize();game.draw();
console.log('Basalt: 30 unique turret mounts, two-layer 100 HP crust, 10 HP liquid, all interception types, laser/lightning immunity, recharge/range, drone recovery, disabled mounts/save, and compaction passed.');

game.setup(data,4);
assert.equal(game.planet.total,1800);assert.equal(game.planet.turrets.length,6);assert.equal(new Set(game.planet.turrets.map(t=>t.blockId)).size,6);
assert.ok(game.planet.turrets.every(t=>t.range===320));assert.equal(game.generatePlanet(3).turrets[0].range,150);
assert.equal(game.planet.collapseOnCore,false);assert.equal(game.planet.coreTotal,0);
assert.ok(game.planet.blocks.every(b=>b.civilized&&b.sectorId));
const sectors=new Set(game.planet.blocks.filter(b=>b.phase==='liquid').map(b=>b.sectorId));assert.ok(sectors.size>12,'Multiple hex sectors span the planet');
assert.ok(game.planet.blocks.some(b=>Math.hypot(b.x,b.y)<32&&b.civilized),'Civilization reaches the center');
assert.ok(game.planet.blocks.some(b=>Math.hypot(b.x,b.y)<150&&b.name==='Hex sector wall'),'Sector walls extend into the deep interior');
for(const b of game.planet.blocks){
  const depth=(game.planet.radius-Math.hypot(b.x,b.y))/16;
  if(depth<2){assert.equal(b.name,'City crust');assert.equal(b.max,200);}
  else if(b.phase==='liquid')assert.equal(b.max,15);else {assert.equal(b.name,'Hex sector wall');assert.equal(b.max,250);}
  if(b.phase==='liquid')for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
    const neighbor=game.planet.grid.get(`${b.i+di},${b.j+dj}`);
    if(neighbor?.phase==='liquid')assert.equal(neighbor.sectorId,b.sectorId,'Intact walls separate neighboring liquid sectors, including diagonals');
  }
}
const sectorPositions=JSON.stringify(game.planet.blocks.map(b=>[b.i,b.j]));game.compactMantle();assert.equal(JSON.stringify(game.planet.blocks.map(b=>[b.i,b.j])),sectorPositions,'Full enclosed sectors stay stable');
const liquidCenter=game.planet.blocks.find(b=>b.phase==='liquid'&&Math.hypot(b.x,b.y)<25);game.damage(liquidCenter,15);game.compactMantle();
assert.notEqual(JSON.stringify(game.planet.blocks.map(b=>[b.i,b.j])),sectorPositions,'Excavated liquid settles inside its sector');
const ironTurret=game.planet.turrets[0];game.planet.turrets.forEach((t,i)=>t.cooldown=i?999:0);
const norm=Math.hypot(ironTurret.x,ironTurret.y),outward=d=>({x:ironTurret.x+ironTurret.x/norm*d,y:ironTurret.y+ironTurret.y/norm*d});
assert.equal(game.interceptAttack(outward(321)),false);assert.equal(game.interceptAttack(outward(240)),true,'Ironheart intercepts beyond Basalt range');
game.damage(game.planet.blocks[ironTurret.blockId],200);game.save();const ironSaved=JSON.stringify(game.planet.blocks.map(b=>[b.i,b.j,b.hp]));game.load();
assert.equal(JSON.stringify(game.planet.blocks.map(b=>[b.i,b.j,b.hp])),ironSaved);assert.equal(game.planet.blocks[ironTurret.blockId].hp,0);assert.equal(game.planet.turrets.length,6);
game.resize();game.draw();
console.log('Ironheart: 1,800 civilized blocks, enclosed hex sectors to the center, hard walls/liquid, six wider-range turrets, compaction, and save passed.');

game.setup(data,5);
assert.equal(game.planet.total,2000);assert.equal(game.planet.turrets.length,8);assert.equal(game.planet.collapseOnCore,false);
assert.ok(game.planet.turrets.every(t=>t.wave&&t.range===600&&game.planet.blocks[t.blockId].core));
assert.equal(new Set(game.planet.turrets.map(t=>t.blockId)).size,8);
for(const b of game.planet.blocks){const depth=(game.planet.radius-Math.hypot(b.x,b.y))/16;if(depth<3){assert.equal(b.max,10);assert.equal(b.regen,10);}else if(b.core)assert.equal(b.max,80);else {assert.equal(b.phase,'liquid');assert.ok(b.reflective);}}
const shellBlock=game.planet.blocks.find(b=>b.regen);game.damage(shellBlock,7);game.regenerateBlocks(.25);assert.equal(shellBlock.hp,5.5);game.regenerateBlocks(1);assert.equal(shellBlock.hp,10);
game.damage(shellBlock,10);const regenCredit=game.state.credits;game.regenerateBlocks(5);assert.equal(shellBlock.hp,0);assert.equal(game.state.credits,regenCredit,'Destroyed shell never regenerates or pays again');
const mirror=game.planet.blocks.find(b=>b.reflective),mirrorHP=mirror.hp;
for(const extras of [{},{guided:true,trail:[],s:{projectileSpeed:300}},{nuke:true}]){
  const shot={x:mirror.x-30,y:mirror.y,vx:300,vy:0,left:200,...extras};
  assert.ok(game.reflectProjectile(shot,mirror));assert.ok(shot.vx<0);assert.equal(shot.vy,0);assert.equal(mirror.hp,mirrorHP);assert.ok(shot.x<mirror.x-8);assert.ok(shot.left<200);
  if(shot.guided){const heading=shot.vx;game.guideMissile(shot,.016);assert.equal(shot.vx,heading,'Deflected missile does not immediately home back');}
  if(shot.nuke)assert.ok(shot.tx<shot.x,'Nuke destination is deflected with velocity');
}
// Full nuke path must reflect before drilling liquid, even with exhausted drilling allowance.
game.equip('piercing_nuke');game.planet.turrets.forEach(t=>t.cooldown=999);game.ship.x=mirror.x-12;game.ship.y=mirror.y;game.aimAt(mirror.x+40,mirror.y);game.fire('piercing_nuke');
const reflectedNuke=game.bullets[0];reflectedNuke.drilled=new Set([9000,9001,9002,9003,9004]);game.advanceNuke(reflectedNuke,.1);assert.ok(reflectedNuke.reflected);assert.equal(reflectedNuke.exploded,false);assert.equal(mirror.hp,mirrorHP);
game.setup(data,5);game.updateCoreWaves(.1);assert.equal(game.waves.length,0,'Intact terrain blocks waves at the starting ship');
const waveTurret=game.planet.turrets[0],mountId=waveTurret.blockId;
for(const b of game.planet.blocks)if(b.id!==mountId)b.hp=0;
game.planet.grid.clear();const waveMount=game.planet.blocks[mountId];game.planet.grid.set(`${waveMount.i},${waveMount.j}`,waveMount);
const waveNorm=Math.hypot(waveTurret.x,waveTurret.y),ux=waveTurret.x/waveNorm,uy=waveTurret.y/waveNorm;
game.ship.x=waveTurret.x+ux*601;game.ship.y=waveTurret.y+uy*601;game.updateCoreWaves(.1);assert.equal(game.waves.length,0,'Wave range is limited to 600');
game.ship.x=waveTurret.x+ux*100;game.ship.y=waveTurret.y+uy*100;game.ship.vx=0;game.ship.vy=0;
game.updateCoreWaves(.01);assert.equal(game.waves.length,1,'Clear sight launches a wave');assert.ok(waveTurret.waveCooldown>0);
const shipRadius=Math.hypot(game.ship.x,game.ship.y);for(let i=0;i<30;i++)game.updateCoreWaves(.016);
assert.ok(Math.hypot(game.ship.x,game.ship.y)>shipRadius+50,'Wave pushes the ship outward');assert.equal(game.waves.length,0,'Wave is consumed once on impact');
waveMount.hp=0;game.updateCoreWaves(2);assert.equal(game.waves.length,0,'Destroyed core mount cannot fire');
game.setup(data,5);const hurtShell=game.planet.blocks.find(b=>b.regen);game.damage(hurtShell,4);game.planet.turrets[0].waveCooldown=1.2;game.save();game.load();
assert.equal(game.planet.blocks[hurtShell.id].hp,6);assert.equal(game.planet.turrets[0].waveCooldown,1.2);assert.equal(game.waves.length,0);
game.resize();game.draw();console.log('Anvil: shell regeneration/no resurrection, reflective shots/missiles/nukes, eight core turrets, wave sight/range/collision/pushback, disabled mounts, and save passed.');

game.setup(data,5);game.state.slots=[null,null,null];const bounceBlock=game.planet.blocks.find(b=>b.reflective);
for(const b of game.planet.blocks)if(b!==bounceBlock)b.hp=0;
game.bullets.push({x:bounceBlock.x-30,y:bounceBlock.y,vx:300,vy:0,left:600,damage:3,color:'#fff'});
game.update(.1);assert.equal(game.bullets.length,1);assert.ok(game.bullets[0].reflected);assert.ok(game.bullets[0].vx<0);assert.equal(bounceBlock.hp,10);
game.shells.push({x:bounceBlock.x-50,y:bounceBlock.y,tx:bounceBlock.x,ty:bounceBlock.y,age:0,duration:.01,s:{damage:40,blastRadius:48},color:'#fff'});
game.update(.02);assert.equal(game.shells.length,0);assert.ok(game.bullets.some(b=>b.reflected&&b.blastRadius===48));assert.equal(bounceBlock.hp,10,'Mortar bounces instead of exploding into liquid');
console.log('Anvil projectile-loop reflection and mortar rebound integration passed.');

function plagueFixture(level=1){
  game.setup(data,2);game.equip('plague');game.state.owned.plague=level;
  const template=game.planet.blocks[0];
  game.planet.blocks=[[0,0],[1,0],[2,0],[1,1]].map(([i,j],id)=>({...template,id,i,j,x:(i+.5)*16,y:(j+.5)*16,hp:100,max:100,reward:1,core:false,plagued:false}));
  game.planet.grid.clear();game.planet.blocks.forEach(b=>game.planet.grid.set(`${b.i},${b.j}`,b));game.planet.remaining=4;game.planet.total=4;
  return game.planet.blocks;
}
for(let level=1;level<=5;level++){
  const blocks=plagueFixture(level),s=game.stats('plague');assert.equal(s.damage,level);assert.ok(Math.abs(s.spreadSeconds-5/level)<1e-10);
  game.infectBlock(blocks[0]);game.updatePlague(s.spreadSeconds-.01);
  assert.equal(blocks[1].plagued,false,'Contact must last the full interval');assert.ok(Math.abs(blocks[0].hp-(100-level*(s.spreadSeconds-.01)))<1e-8);
  game.updatePlague(.01);assert.ok(blocks[1].plagued);assert.equal(blocks[2].plagued,false,'No same-step chain infection');assert.equal(blocks[3].plagued,false,'Diagonal contact does not spread');
}
let plagueBlocks=plagueFixture();game.infectBlock(plagueBlocks[0]);game.updatePlague(3);
const movedTarget=plagueBlocks[1];game.planet.grid.delete('1,0');movedTarget.i=8;movedTarget.x=136;game.planet.grid.set('8,0',movedTarget);game.updatePlague(.1);
game.planet.grid.delete('8,0');movedTarget.i=1;movedTarget.x=24;game.planet.grid.set('1,0',movedTarget);game.updatePlague(2.1);assert.equal(movedTarget.plagued,false,'Breaking contact resets its timer');game.updatePlague(2.9);assert.ok(movedTarget.plagued);
plagueBlocks=plagueFixture();plagueBlocks[0].hp=.5;game.infectBlock(plagueBlocks[0]);game.updatePlague(5);assert.equal(plagueBlocks[0].hp,0);assert.equal(plagueBlocks[1].plagued,false,'Dead source cannot spread after death');const plagueCredits=game.state.credits;game.updatePlague(5);assert.equal(game.state.credits,plagueCredits);
plagueBlocks=plagueFixture(3);game.infectBlock(plagueBlocks[0]);game.infectBlock(plagueBlocks[0]);game.state.slots=[null,null,null];game.updatePlague(1);assert.equal(plagueBlocks[0].hp,97,'Reinfection does not stack; damage persists after unequip');
game.setup(data,2);game.equip('plague');game.fire('plague');assert.equal(game.snow.length,game.stats('plague').particleCount);
const flake=game.snow[0];flake.x=0;flake.y=-game.planet.radius-100;flake.vx=80;flake.vy=0;const oldVy=flake.vy;game.updateSnow(.1);assert.ok(flake.vy>oldVy,'Snow accelerates toward center');
game.snow.length=0;const snowTarget=game.planet.blocks.find(b=>b.hp>0&&b.x>0&&b.y>0);
game.snow.push({x:snowTarget.x,y:snowTarget.y,vx:0,vy:0,life:7,gravity:170,maxSpeed:340,size:2});game.updateSnow(.016);assert.ok(snowTarget.plagued);assert.equal(game.snow.length,0);
const neighbor=game.planet.grid.get(`${snowTarget.i+1},${snowTarget.j}`);game.updatePlague(2);game.save();const partial=game.plagueContacts.get(`${snowTarget.id}:${neighbor.id}`);game.load();
assert.ok(game.planet.blocks[snowTarget.id].plagued);assert.equal(game.plagueContacts.get(`${snowTarget.id}:${neighbor.id}`),partial);game.updatePlague(3);assert.ok(game.planet.blocks[neighbor.id].plagued,'Saved contact resumes at remaining time');
game.state.paid.push(2);game.nextLevel();assert.ok(game.planet.blocks.every(b=>!b.plagued));assert.equal(game.plagueContacts.size,0);
console.log('Plague: gravity/contact, level damage and spread delay, distinct contact timers, broken contact/dead sources, no stacking, persistence after unequip/save, and new-planet reset passed.');

game.setup(data,3);
const basaltLiquids=game.planet.blocks.filter(b=>b.phase==='liquid');
assert.equal(game.planet.liquidRemaining,basaltLiquids.length);
basaltLiquids.slice(0,-1).forEach(b=>game.damage(b,b.hp));
assert.equal(game.planet.liquidRemaining,1);assert.equal(game.planet.collapse,null,'One liquid block prevents collapse');
game.save();game.load();assert.equal(game.planet.liquidRemaining,1,'Liquid objective is restored from surviving material');
const lastBasaltLiquid=game.planet.blocks.find(b=>b.phase==='liquid'&&b.hp>0);game.damage(lastBasaltLiquid,lastBasaltLiquid.hp);
assert.equal(game.planet.liquidRemaining,0);assert.equal(game.planet.collapse,0);assert.ok(game.planet.remaining>0);
const basaltReward=game.state.credits+game.planet.blocks.filter(b=>b.hp>0).reduce((sum,b)=>sum+b.reward,0)+350;
game.update(.6);game.save();game.load();assert.equal(game.planet.collapse,.6);
game.update(.9);assert.equal(game.mode,'complete');assert.equal(game.planet.remaining,0);assert.equal(game.state.credits,basaltReward);
assert.ok(game.planet.turrets.every(t=>game.planet.blocks[t.blockId].hp===0),'Collapse removes all turret mounts');
game.completeLevel();game.save();game.load();assert.equal(game.state.credits,basaltReward,'Reload and repeat completion cannot duplicate rewards');
console.log('Basalt liquid-clear collapse: last-block condition, restored count, resumed animation, crust/turret cleanup, and one-time rewards passed.');

game.setup(data,6);const turtle=game.planet;
assert.equal(turtle.turrets.length,10);assert.equal(new Set(turtle.turrets.map(t=>t.blockId)).size,10);assert.ok(turtle.turrets.every(t=>turtle.blocks[t.blockId].core));
assert.ok(turtle.collapseOnCore);
for(const b of turtle.blocks){
  const depth=(turtle.radius-Math.hypot(b.x,b.y))/16;
  if(depth<5){assert.equal(b.max,50);assert.ok(b.reflective);assert.equal(b.regenStep,5);assert.equal(b.regenInterval,.1);assert.equal(b.core,false);}
  else {assert.ok(depth>=7);assert.ok(b.core);assert.equal(b.max,10);assert.ok(!b.regen&&!b.regenStep);}
}
let hollowCells=0;const extent=Math.ceil(turtle.radius/16);
for(let i=-extent;i<extent;i++)for(let j=-extent;j<extent;j++){const depth=(turtle.radius-Math.hypot(i+.5,j+.5)*16)/16;if(depth>=5&&depth<7){assert.equal(turtle.grid.has(`${i},${j}`),false);hollowCells++;}}
assert.ok(hollowCells>0);assert.equal(turtle.total+hollowCells,2250,'Hollow cells are removed from original footprint');
const turtleShell=turtle.blocks.find(b=>!b.core),turtleCore=turtle.blocks.find(b=>b.core);game.damage(turtleShell,20);game.damage(turtleCore,4);
game.regenerateBlocks(.09);assert.equal(turtleShell.hp,30,'No healing before the tick');game.save();game.load();game.regenerateBlocks(.01);
assert.equal(game.planet.blocks[turtleShell.id].hp,35,'Five HP at the 0.1s tick, preserved across save');assert.equal(game.planet.blocks[turtleCore.id].hp,6);
game.regenerateBlocks(.31);assert.equal(game.planet.blocks[turtleShell.id].hp,50);game.damage(game.planet.blocks[turtleShell.id],50);game.regenerateBlocks(1);assert.equal(game.planet.blocks[turtleShell.id].hp,0);
game.setup(data,6);game.equip('railgun');game.planet.turrets.forEach(t=>t.cooldown=999);game.aimAt(0,0);
const railPath=game.rayBlocks(game.ship.x,game.ship.y,0,game.planet.radius),shellHits=railPath.filter(b=>!b.core);game.fire('railgun');
assert.ok(shellHits.filter(b=>b.hp<b.max).length>=5,'Railgun pierces all five reflective shell layers');
const reflectedShell=shellHits[0],probeShell={x:reflectedShell.x,y:reflectedShell.y-24,vx:0,vy:300,left:500};assert.ok(game.reflectProjectile(probeShell,reflectedShell));assert.ok(probeShell.vy<0);
game.setup(data,6);game.equip('plague');game.state.owned.plague=5;game.planet.blocks.filter(b=>!b.core).forEach(game.infectBlock);
for(let tick=0;tick<100;tick++){game.regenerateBlocks(.1);game.updatePlague(.1);}
assert.ok(game.planet.blocks.filter(b=>b.core).every(b=>!b.plagued),'Plague cannot spread across the hollow gap');
game.setup(data,6);const turtleCores=game.planet.blocks.filter(b=>b.core);turtleCores.slice(0,-1).forEach(b=>game.damage(b,10));assert.equal(game.planet.collapse,null);
game.damage(turtleCores.at(-1),10);assert.equal(game.planet.collapse,0);const turtleReward=game.state.credits+game.planet.blocks.filter(b=>b.hp>0).reduce((sum,b)=>sum+b.reward,0)+500;
game.update(.6);game.save();game.load();assert.equal(game.planet.collapse,.6);game.update(.9);assert.equal(game.planet.remaining,0);assert.equal(game.state.credits,turtleReward);game.completeLevel();assert.equal(game.state.credits,turtleReward);
console.log('Turtle: rename/layout, five reflective shell layers, discrete saved regen ticks, non-regenerating defended core, true two-row plague barrier, railgun piercing, and core-collapse rewards passed.');

game.setup(data,7);
const chaos=game.planet;
assert.equal(chaos.total,2500);assert.equal(chaos.turrets.length,0);assert.equal(chaos.collapseOnCore,false);
assert.equal(Math.min(...chaos.blocks.map(b=>b.max)),1);assert.equal(Math.max(...chaos.blocks.map(b=>b.max)),250);
assert.equal(new Set(chaos.blocks.map(b=>b.name)).size,3);
for(const b of chaos.blocks){
  const expected=1+Math.round(249*(chaos.radius-Math.hypot(b.x,b.y))/(chaos.radius-16/Math.sqrt(2)));
  assert.equal(b.max,expected);
  if(b.name==='Turtle blocks'){assert.ok(b.reflective);assert.equal(b.regenStep,5);assert.equal(b.regenInterval,.1);}
  else if(b.name==='Liquid'){assert.equal(b.phase,'liquid');assert.ok(!b.reflective);}
  else {assert.ok(b.gold);assert.equal(b.reward,10);}
}
assert.deepEqual(chaos.blocks,game.generatePlanet(7,game.state.seed).blocks,'Same seed preserves materials');
assert.ok(chaos.blocks.some((b,i)=>b.name!==game.generatePlanet(7,game.state.seed+1).blocks[i].name),'Different seeds vary materials');
const chaosShell=chaos.blocks.find(b=>b.regenStep&&b.max>20);
game.damage(chaosShell,10);game.regenerateBlocks(.1);assert.equal(chaosShell.hp,chaosShell.max-5);
const chaosLiquid=chaos.blocks.find(b=>b.phase==='liquid'&&b.max>1);
game.damage(chaosLiquid,1);game.damage(chaos.blocks[0],999);game.compactMantle();game.save();
const chaosSnapshot=JSON.stringify(game.planet.blocks.map(b=>[b.name,b.hp,b.i,b.j]));game.load();
assert.equal(JSON.stringify(game.planet.blocks.map(b=>[b.name,b.hp,b.i,b.j])),chaosSnapshot,'Chaos saves preserve damage and settled materials');
const oldTitan=JSON.parse(storage.get('planetDestroyer.demo.v1'));delete oldTitan.chaosRevision;oldTitan.hp=oldTitan.hp.map(()=>0);
storage.set('planetDestroyer.demo.v1',JSON.stringify(oldTitan));game.load();
assert.equal(game.planet.remaining,2500);assert.equal(game.state.credits,oldTitan.credits);assert.deepEqual(game.state.owned,oldTitan.owned);
console.log('Chaos: seeded mix, 1–250 radial HP, Turtle regeneration, liquid persistence, gold rewards, and Titan save migration passed.');

game.setup(data,1);game.state.paid=[0];game.equip('plague');
game.damage(game.planet.blocks[0],1);game.infectBlock(game.planet.blocks[1]);game.save();
const frontier=JSON.stringify(game.planet.blocks.map(b=>[b.hp,!!b.plagued,b.i,b.j]));
game.visitLevel(9);assert.equal(game.state.level,1,'Locked planets cannot be visited');
game.openGalaxy();assert.equal(game.mode,'galaxy');
game.visitLevel(0);assert.equal(game.planet.remaining,1000);assert.equal(game.state.replaying,true);
game.damage(game.planet.blocks[0],2);game.save();game.load();assert.equal(game.planet.blocks[0].hp,18,'Replay damage survives reload despite prior completion');
game.state.owned.plague=2;const replayCredits=game.state.credits;
game.visitLevel(1);assert.equal(JSON.stringify(game.planet.blocks.map(b=>[b.hp,!!b.plagued,b.i,b.j])),frontier,'Campaign damage and infection resume');
assert.equal(game.state.owned.plague,2);assert.equal(game.state.credits,replayCredits);
game.visitLevel(0);assert.equal(game.planet.blocks[0].hp,18,'Unfinished replay resumes');
game.planet.blocks.forEach(b=>game.damage(b,999));const earned=game.state.credits;game.completeLevel();assert.equal(game.state.credits,earned,'Replay does not repeat first-clear bonus');
assert.equal(element('bonus').textContent,'Replay complete');game.nextLevel();assert.equal(game.mode,'galaxy');
game.visitLevel(0);assert.equal(game.planet.remaining,1000,'Completed replay can be started again');
game.visitLevel(1);assert.equal(JSON.stringify(game.planet.blocks.map(b=>[b.hp,!!b.plagued,b.i,b.j])),frontier);
console.log('Galaxy: locked destinations, paused selector, replay reload/resume, retained equipment/credits, saved campaign progress, and one-time bonuses passed.');

{
assert.equal(game.shockwaveMultiplier({x:50,y:0},{x:100,y:0}),2);
assert.equal(game.shockwaveMultiplier({x:150,y:0},{x:100,y:0}),.5);
assert.equal(game.shockwaveMultiplier({x:100,y:50},{x:100,y:0}),1);
assert.ok(Math.abs(game.shockwaveMultiplier({x:50,y:-50},{x:100,y:0})-2**Math.SQRT1_2)<1e-12);
game.setup(data,6);game.equip('shockwave');const shockStats=game.stats('shockwave');
game.fire('shockwave');const origin={x:game.ship.x,y:game.ship.y};
const shellHit=game.planet.blocks.find(b=>b.reflective&&Math.hypot(b.x-origin.x,b.y-origin.y)<200);
const beforeShock=shellHit.hp;game.updateShockwaves(.7);
assert.ok(Math.abs(shellHit.hp-(beforeShock-shockStats.damage*game.shockwaveMultiplier(origin,shellHit)))<1e-9,'Reflective shell cannot deflect damage');
const afterShock=shellHit.hp;game.updateShockwaves(.05);assert.equal(shellHit.hp,afterShock,'One hit per ring');
game.updateShockwaves(1);assert.equal(game.shockwaves.length,0,'Ring expires at maximum range');
game.state.owned.shockwave=5;assert.equal(game.stats('shockwave').range,560);assert.equal(game.stats('shockwave').damage,8);
game.setup(data,5);game.equip('shockwave');
const liquid=game.planet.blocks.find(b=>b.phase==='liquid'&&b.x>80&&Math.abs(b.y)<10);
const originalI=liquid.i,originalJ=liquid.j;
for(let step=1;step<=2;step++){const obstacle=game.planet.grid.get(`${originalI+step},${originalJ}`);if(obstacle)game.damage(obstacle,999);}
game.pushLiquid(liquid,{x:liquid.x-40,y:liquid.y},2);
assert.equal(liquid.i,originalI+2);assert.equal(liquid.j,originalJ);assert.equal(game.planet.grid.get(`${liquid.i},${liquid.j}`),liquid);
const position=liquid.i;game.pushLiquid(liquid,{x:liquid.x-40,y:liquid.y},2);assert.equal(liquid.i,position,'Liquid cannot pass through occupied cells');
game.save();game.load();assert.equal(game.planet.blocks[liquid.id].i,position,'Displacement persists');
game.fire('shockwave');game.save();game.load();assert.equal(game.shockwaves.length,0,'In-flight rings do not duplicate after reload');
game.setup(data,3);game.equip('shockwave');const defense=game.planet.turrets[0];game.ship.x=defense.x+30;game.ship.y=defense.y;
game.fire('shockwave');const mount=game.planet.blocks[defense.blockId],mountHP=mount.hp;game.updateShockwaves(.5);assert.ok(mount.hp<mountHP,'Point defense cannot intercept ring');
console.log('Shockwave: angle scaling, one-hit swept ring, reflection/defense immunity, range upgrades, liquid collision and saved displacement passed.');
}

{
for(const lastMaterial of ['Gold','Liquid']){
  game.setup(data,7);
  const targets=game.planet.blocks.filter(b=>b.gold||b.phase==='liquid');
  const last=targets.find(b=>b.name===lastMaterial);
  for(const b of targets)if(b!==last)game.damage(b,999);
  assert.equal(game.planet.chaosRemaining,1);assert.equal(game.planet.collapse,null,'Either gold or liquid prevents collapse');
  game.save();game.load();assert.equal(game.planet.chaosRemaining,1);
  game.damage(game.planet.blocks[last.id],999);assert.equal(game.planet.chaosRemaining,0);assert.equal(game.planet.collapse,0);
  assert.ok(game.planet.blocks.filter(b=>b.hp>0).every(b=>b.name==='Turtle blocks'));
  const expected=game.state.credits+game.planet.blocks.filter(b=>b.hp>0).reduce((sum,b)=>sum+b.reward,0)+550;
  game.update(.6);game.save();game.load();assert.equal(game.planet.collapse,.6);
  game.update(.9);assert.equal(game.planet.remaining,0);assert.equal(game.state.credits,expected);
  game.completeLevel();assert.equal(game.state.credits,expected,'No repeated collapse rewards');
}
game.setup(data,7);game.save();const onlyTurtle=JSON.parse(storage.get('planetDestroyer.demo.v1'));
onlyTurtle.hp=game.planet.blocks.map(b=>b.name==='Turtle blocks'?b.hp:0);delete onlyTurtle.collapse;
storage.set('planetDestroyer.demo.v1',JSON.stringify(onlyTurtle));game.load();assert.equal(game.planet.collapse,0,'Older Turtle-only save starts collapse');
console.log('Chaos collapse: final gold or liquid, objective reload, resumed collapse, remaining rewards, and older saves passed.');
}
