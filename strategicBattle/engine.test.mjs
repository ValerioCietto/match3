import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle, FACTIONS, LEVELS, setLevels } from './engine.mjs';
setLevels(JSON.parse(readFileSync(new URL('./levels.json', import.meta.url), 'utf8')));
assert.throws(() => setLevels([]), /non-empty/);
assert.throws(() => setLevels([{ name: 'Invalid', description: '', nodes: [[0,0,'unknown','Player']] }]), /Invalid level node/);
assert.equal(LEVELS.length, 10, 'campaign contains ten levels');
let previous;
for (let level = 0; level < LEVELS.length; level++) {
  const campaign = new Battle(level);
  const troops = faction => campaign.nodes.filter(n => n.faction === faction).reduce((sum,n) => sum+n.population,0);
  const cities = campaign.nodes.filter(n => n.faction === 'Enemy' && n.type === 'city').length;
  const current = { player: troops('Player'), enemy: troops('Enemy'), cities };
  if (previous) {
    assert.ok(current.player < previous.player, 'each mission starts with fewer player troops');
    assert.ok(current.enemy > previous.enemy, 'each mission starts with more enemy troops');
    assert.ok(current.cities >= previous.cities, 'enemy cities never decrease');
  }
  for (const node of campaign.nodes) {
    assert.ok(node.x >= 40 && node.x <= 960 && node.y >= 40 && node.y <= 540, 'nodes fit the battlefield');
    for (const other of campaign.nodes.filter(n => n.id > node.id)) assert.ok(Math.hypot(node.x-other.x,node.y-other.y) >= 85, 'nodes have room for labels and selection');
  }
  previous = current;
}
assert.equal(previous.cities, 6, 'final mission has six enemy cities');
const game = new Battle();
for(let i=0;i<10;i++) game.tick(.1);
assert.ok(Math.abs(game.nodes[0].population-10.2)<1e-9, 'fractional population is preserved');
assert.ok(Math.abs(game.gold.Player-120.6)<1e-9, 'village and mine income accrues');
const flightGame = new Battle();
assert.equal(flightGame.send(0,2),true); assert.equal(flightGame.nodes[0].population,5);
const flight=flightGame.flights[0], start={x:flight.x,y:flight.y};flightGame.tick(.1);
assert.ok(Math.abs(Math.hypot(flight.x-start.x,flight.y-start.y)-1.5)<1e-9, 'default speed is 15px/s');
const combat = new Battle();
combat.nodes.filter(n => n.type === 'tower').forEach(n => n.type = 'village');
FACTIONS.Player.attack=2; combat.nodes[2].population=10;combat.nodes[2].faction='Neutral';
combat.arrive({target:2,faction:'Player',count:3});assert.equal(combat.nodes[2].population,4);
combat.arrive({target:2,faction:'Player',count:3});assert.equal(combat.nodes[2].faction,'Player');assert.equal(combat.nodes[2].population,1);
FACTIONS.Player.attack=1;
const purchases=new Battle();assert.equal(purchases.buy(0,'wall'),true);assert.equal(purchases.nodes[0].wall,10);assert.equal(purchases.gold.Player,70);
assert.equal(purchases.buy(0,'city'),false);assert.equal(purchases.buy(2,'wall'),false);assert.equal(purchases.buy(0,'type','mine'),true);assert.equal(purchases.gold.Player,10);
const upgrade=new Battle();assert.equal(upgrade.buy(0,'city'),true);assert.equal(upgrade.nodes[0].type,'city');assert.equal(upgrade.gold.Player,20);assert.equal(upgrade.buy(0,'type','city'),false);
const friendly=new Battle();friendly.arrive({target:0,faction:'Player',count:4});assert.equal(friendly.nodes[0].population,14);
const exact=new Battle();exact.nodes.filter(n=>n.type==='tower').forEach(n=>n.type='village');exact.arrive({target:2,faction:'Player',count:10});assert.equal(exact.nodes[2].population,0);assert.equal(exact.nodes[2].faction,'Neutral');
const victory=new Battle();victory.nodes.forEach(n=>n.faction='Player');victory.tick();assert.equal(victory.result,'victory');
const defeat=new Battle();defeat.nodes.forEach(n=>n.faction='Enemy');defeat.tick();assert.equal(defeat.result,'defeat');
const airborne=new Battle();airborne.send(0,2);airborne.nodes.forEach(n=>n.faction='Enemy');airborne.tick();assert.equal(airborne.result,null);
// Isolate building effects from the campaign's other installations.
function fixture() {
  const battle = new Battle();
  battle.nodes.forEach(n => { n.type = 'village'; });
  return battle;
}
const near = (actual, expected, label) => assert.ok(Math.abs(actual-expected)<1e-8, label);
const barracks = fixture();
barracks.send(0,2); // A village flight must not acquire a bonus from other buildings.
barracks.nodes[1].type = 'barracks';
barracks.tick();near(barracks.nodes[1].population,10,'barracks generate no population');
near(barracks.attack(barracks.nodes[0]),1,'owning barracks does not boost village attacks');
near(barracks.attack(barracks.nodes[1]),1.5,'barracks departures receive bonus');
barracks.nodes[0].type='barracks';
barracks.nodes[2].population=20;barracks.arrive(barracks.flights[0]);near(barracks.nodes[2].population,15,'converting the source after launch does not boost an existing village flight');
barracks.send(1,2);const boosted=barracks.flights[1];near(boosted.attack,1.5,'multiple barracks do not compound bonus');
barracks.nodes[1].type='village';barracks.nodes[1].faction='Enemy';
barracks.nodes[2].population=20;barracks.arrive(boosted);near(barracks.nodes[2].population,12.5,'barracks flight retains bonus after source conversion and capture');
near(barracks.attack(barracks.nodes[1]),1.15,'enemy village has normal faction attack');
barracks.nodes[1].type='barracks';near(barracks.attack(barracks.nodes[1]),1.725,'enemy barracks apply bonus to enemy base attack');
const reinforcement=fixture();reinforcement.nodes[0].type='barracks';reinforcement.send(0,1);
reinforcement.arrive(reinforcement.flights[0]);reinforcement.send(1,2);
near(reinforcement.flights[1].attack,1,'reinforcements redeployed from a village do not retain barracks bonus');
const towers=fixture();towers.nodes[0].type='tower';
near(towers.defence(towers.nodes[1]),1.2,'tower protects other owned nodes');
towers.nodes[1].type='tower';near(towers.defence(towers.nodes[1]),1.2,'multiple towers do not stack defence');
towers.nodes[1].wall=30;near(towers.defence(towers.nodes[1]),37.2,'tower multiplier includes walls');
towers.nodes[0].faction='Enemy';towers.nodes[1].type='mine';near(towers.defence(towers.nodes[1]),31,'last tower loss removes bonus');
const walls=fixture();walls.gold.Player=450;
for (const [tier,gold,defence] of [[1,400,10],[2,250,30],[3,0,30]]) {
  assert.equal(walls.buy(0,'wall'),true);assert.equal(walls.nodes[0].wallLevel,tier);assert.equal(walls.gold.Player,gold);assert.equal(walls.nodes[0].wall,defence);
}
assert.equal(walls.hasLaser(walls.nodes[0]),true);walls.gold.Player=1000;assert.equal(walls.buy(0,'wall'),false);assert.equal(walls.gold.Player,1000,'fourth wall purchase is rejected');
walls.nodes[0].population=0;walls.arrive({target:0,faction:'Enemy',count:1});assert.equal(walls.nodes[0].faction,'Enemy');assert.equal(walls.hasLaser(walls.nodes[0]),true,'captured fortifications persist');near(walls.defence(walls.nodes[0]),30.9,'fortified village does not grant tower faction bonus');
const unaffordable=fixture();unaffordable.buy(0,'wall');assert.equal(unaffordable.buy(0,'wall'),false);assert.equal(unaffordable.nodes[0].wallLevel,1);assert.equal(unaffordable.gold.Player,70);
function laserFixture() {
  const battle=fixture();battle.nodes[0].type='tower';battle.nodes[0].x=100;battle.nodes[0].y=100;
  battle.nodes[1].x=100;battle.nodes[1].y=500;
  return battle;
}
const aircraft=(x,y,faction='Enemy',count=5) => ({x,y,faction,count,from:6,target:1});
const laser=laserFixture(), hostile=aircraft(200,100), friendlyAir=aircraft(150,100,'Player'), distant=aircraft(900,100), second=aircraft(300,100);
laser.flights=[hostile,friendlyAir,distant,second];
for(let i=0;i<10;i++)laser.tick();
near(hostile.count,4,'laser deals exactly one population damage per second');near(friendlyAir.count,5,'no friendly fire');near(distant.count,5,'no out-of-range damage');near(second.count,5,'one target per installation');assert.equal(laser.beams.length,1,'active laser is exposed to renderer');
const boundary=laserFixture();boundary.flights=[aircraft(400,100),aircraft(400.01,100)];boundary.tick();near(boundary.flights[0].count,4.9,'range includes 300px boundary');near(boundary.flights[1].count,5,'range excludes distances beyond 300px');
const kill=laserFixture();kill.nodes[1].population=0;kill.nodes[1].x=200;kill.nodes[1].y=100;kill.flights=[aircraft(200,100,'Enemy',.1)];kill.tick();assert.equal(kill.flights.length,0);assert.equal(kill.nodes[1].faction,'Player','laser kill prevents landing and capture');
const wallLaser=laserFixture();wallLaser.nodes[0].type='mine';wallLaser.nodes[0].wallLevel=3;wallLaser.flights=[aircraft(200,100)];wallLaser.tick();near(wallLaser.flights[0].count,4.9,'third wall tier provides laser');
wallLaser.nodes[0].type='tower';wallLaser.tick();near(wallLaser.flights[0].count,4.8,'tower plus tier-three wall remains one laser');
const converted=laserFixture();converted.nodes[0].type='village';converted.flights=[aircraft(200,100)];converted.tick();near(converted.flights[0].count,5,'conversion removes native tower laser');
for(let level=0;level<LEVELS.length;level++){const simulation=new Battle(level);for(let i=0;i<6000;i++)simulation.tick();assert.ok(simulation.nodes.every(n=>Number.isFinite(n.population)&&n.population>=0));assert.ok(Object.values(simulation.gold).every(Number.isFinite));}
console.log('Passed: economy, combat, campaign, live building buffs, wall tiers, laser damage/range/targeting, and 10-minute simulations of all maps.');
