// Run with: node planetDestroyer/game.test.cjs
// Exercise the actual simulation with a minimal DOM; browser rendering is separate.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const data=JSON.parse(readFileSync(path.join(__dirname,'weapons.json'),'utf8'));
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
source=source.replace('  init();',`globalThis.test={generatePlanet,rayBlocks,damage,stats,fire,update,save,load,draw,resize,renderShop,completeLevel,nextLevel,compactMantle,collides,guideMissile,advanceNuke,detonateNuke,syncDrones,assignDroneTargets,fireDroneLaser,updateDrones,
  setup(data,index=0){definitions=data.weapons;byId=Object.fromEntries(definitions.map(d=>[d.id,d]));state=freshState();state.level=index;planet=generatePlanet(index,state.seed);resetFlight();auto=false;mode='play';},
  get state(){return state;},get planet(){return planet;},get ship(){return ship;},get mode(){return mode;},get bullets(){return bullets;},get effects(){return effects;},get drones(){return drones;},
  equip(id){state.owned[id]=1;state.slots=[id,null,null];},fireOn(){auto=true;},stop(){auto=false;},
  aimAt(x,y){pointer={x,y,moved:true};ship.angle=Math.atan2(y-ship.y,x-ship.x);}
};`);
vm.runInNewContext(source,sandbox,{filename:'game.js'});
const game=sandbox.test;
game.setup(data);
let previousHP=0;
for(let level=0;level<10;level++){
  const p=game.generatePlanet(level),counts=[1000,1200,1400,1600,1800,2000,2250,2500,2750,3000];
  assert.equal(p.total,counts[level]);assert.equal(p.grid.size,p.total);
  const total=p.blocks.reduce((sum,b)=>sum+b.max,0);assert.ok(total>previousHP);previousHP=total;
  assert.ok(new Set(p.blocks.map(b=>b.name)).size>=3);
  for(const b of p.blocks)assert.ok(p.grid.has(`${-b.i-1},${-b.j-1}`),'Central symmetry');
  const visited=new Set(),queue=[p.blocks[0]];
  while(queue.length){const b=queue.pop();if(visited.has(b.id))continue;visited.add(b.id);for(const [di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const neighbor=p.grid.get(`${b.i+di},${b.j+dj}`);if(neighbor&&!visited.has(neighbor.id))queue.push(neighbor);}}
  assert.equal(visited.size,p.total,'Connected planet');
  console.log(`Level ${level+1}: ${p.total} connected blocks, ${total} total HP`);
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
  const s=game.stats(d.id);assert.equal(s.damage,d.behavior==='mining_drones'?5:d.baseStats.damage*2);
  const timing=d.baseStats.cooldown?'cooldown':d.baseStats.cycleDuration?'cycleDuration':'contactInterval';
  assert.ok(Math.abs(s[timing]-d.baseStats[timing]*(d.behavior==='mining_drones'?1:.92**4))<1e-9);
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
  const raysBefore=game.effects.filter(e=>e.type==='line').length;
  game.fire('guided_laser');assert.equal(laserTarget.hp,Math.max(0,hpBefore-stats.damage*level),'All rays focus on one block');
  assert.equal(game.effects.filter(e=>e.type==='line').length-raysBefore,level);
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
console.log('Guided laser: nearest-target auto aim, one added ray per upgrade, focused damage, range, high fire rate, release, and save passed.');

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
  assert.equal(s.damage,level);assert.equal(s.penetration,level);assert.equal(s.droneCount,level);assert.equal(game.drones.length,level);
}
assert.equal(game.drones[0],initialDrone,'Upgrade retains existing drones');
game.syncDrones();assert.equal(game.drones.length,5,'Sync never duplicates drones');

// Equal-position drones reserve different nearest visible blocks, then idle when targets run out.
const droneTemplate=game.planet.blocks[0];
game.planet.blocks=[[2,0],[0,-3],[-3,0],[0,2],[2,2]].map(([i,j],id)=>({...droneTemplate,id,i,j,x:(i+.5)*16,y:(j+.5)*16,hp:100,max:100,core:false}));
game.planet.grid.clear();for(const b of game.planet.blocks)game.planet.grid.set(`${b.i},${b.j}`,b);
for(const drone of game.drones){drone.x=0;drone.y=0;}
game.assignDroneTargets(game.stats('mining_drones'));
assert.equal(game.drones.map(d=>d.targetId).join(','),'0,1,2,3,4','Distinct nearest target reservations');
game.planet.blocks.slice(1).forEach(b=>b.hp=0);game.assignDroneTargets(game.stats('mining_drones'));
assert.equal(game.drones.filter(d=>d.targetId!==null).length,1,'Extra drones idle instead of sharing one target');

game.setup(data,2);game.equip('mining_drones');game.state.owned.mining_drones=3;game.syncDrones();
game.planet.blocks=Array.from({length:5},(_,i)=>({...droneTemplate,id:i,i,j:0,x:(i+.5)*16,y:8,hp:100,max:100,core:false}));
game.planet.grid.clear();for(const b of game.planet.blocks)game.planet.grid.set(`${b.i},0`,b);
const miner=game.drones[0];miner.x=-16;miner.y=8;miner.targetId=0;
assert.ok(game.fireDroneLaser(miner,game.stats('mining_drones')));
assert.equal(game.planet.blocks.map(b=>b.hp).join(','),'97,97,97,100,100','Level three pierces three blocks for three damage each');
game.state.slots=[null,null,null];game.updateDrones(.1);assert.equal(game.drones.length,0,'Unequipping removes all drones');
game.setup(data,2);game.equip('mining_drones');game.state.owned.mining_drones=5;game.syncDrones();game.save();game.load();
assert.equal(game.state.owned.mining_drones,5);assert.equal(game.drones.length,5,'Reload respawns the correct purchased fleet');
game.nextLevel();assert.equal(game.drones.length,5,'Next planet retains the fleet size');
console.log('Mining drones: independent fire, random nearby spawn, roaming, exact level scaling, unique nearest targets, idle surplus, piercing damage, unequip, reload, and next level passed.');
