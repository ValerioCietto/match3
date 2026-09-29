'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),C=require('../combat-engine.js'),D=require('../battles.json');
function battle(id,gold=101){
  const state=G.defaults();state.gold=gold;state.completed=['sewers-3','city-3','swamp-2'];G.recruit(state);
  const b=new C.Battle(state,{id:'sewers-1',region:'sewers',name:'Special test',enemies:[id]},D,()=>.5);
  return {b,state,e:b.enemies[0]};
}
function enemyTurn(b,special=true){
  const e=b.enemies[0];for(const a of b.allies)a.next=b.time+1000;
  e.next=b.time;e.turns=special?e.special.every-1:0;e.intent=null;b.enemyAct();
}
function advance(b,n){for(const u of b.units())u.next=b.time+n+1;for(let i=0;i<n;i++)assert(b.tick());}

test('catalogue contains the requested renames, stats, and valid special effects',()=>{
  C.validate(D);
  for(const [id,values] of Object.entries({
    'field-wolf':{name:'Speed Wolf',cooldown:5},'tax-collector':{attack:5,cooldown:6},
    'city-guard':{attack:25,cooldown:15,defense:30},apache:{hp:300,attack:10,cooldown:7},
    'sand-scorpion':{attack:12},'scorpion-centaur':{attack:30,cooldown:17},
    slime:{hp:180,defense:-100},'bog-wisp':{name:'Alcohol Spirit'}
  }))for(const [key,value] of Object.entries(values))assert.equal(D.enemies[id][key],value);
  for(const special of [{kind:'poison',duration:0,poisonDamage:1},{kind:'heal',heal:-20},{kind:'steal',goldFraction:2},{kind:'unknown'}]){
    const data=G.clone(D);Object.assign(data.enemies['sewer-bat'].special,special);assert.throws(()=>C.validate(data),/special/);
  }
});
test('Vampiric Bite replaces every second action and heals only actual damage, with no healing on misses',()=>{
  const {b,e}=battle('sewer-bat');e.hp=1;
  enemyTurn(b,false);assert.equal(e.hp,1);assert.equal(e.turns,1);assert.equal(b.plan(e).name,'Vampiric Bite');
  for(const a of b.allies)a.hp=3;
  enemyTurn(b);assert.equal(e.hp,4,'overkill does not increase life drain');
  b.random=()=>.99;enemyTurn(b);assert.equal(e.hp,4,'miss does not heal');
});
test('Royal Bite deals 500% to one hero; flower drains total damage from all heroes',()=>{
  const {b,e}=battle('rat-king');for(const a of b.allies){a.hp=1000;a.defense=0;}
  enemyTurn(b);assert.equal(b.allies.reduce((n,a)=>n+1000-a.hp,0),e.attack*5);
  const f=battle('happy-flower');f.e.hp=1;const before=f.b.allies.map(a=>a.hp);
  enemyTurn(f.b);const lost=f.b.allies.reduce((n,a,i)=>n+before[i]-a.hp,0);
  assert(lost>0);assert(f.b.allies.every((a,i)=>a.hp<before[i]));assert.equal(f.e.hp,1+lost);
});
test('Sunbathing restores 20 HP up to maximum; nap and Blurp cause no damage',()=>{
  const {b,e}=battle('angry-sprout');e.hp=1;const hp=b.allies.map(a=>a.hp);
  enemyTurn(b);assert.equal(e.hp,21);enemyTurn(b);assert.equal(e.hp,e.maxHp);assert.deepEqual(b.allies.map(a=>a.hp),hp);
  for(const id of ['city-guard','slime']){const {b,e}=battle(id),hp=b.units().map(u=>u.hp);enemyTurn(b);assert.deepEqual(b.units().map(u=>u.hp),hp);assert.equal(e.next,e.cooldown);}
});
test('tax rounds up and theft clamps to available Gold, saves on victory, and leaves input state untouched',()=>{
  for(const [id,start,loss] of [['tax-collector',101,11],['tax-collector',1,1],['tax-collector',0,0],['sand-bandit',101,10],['sand-bandit',3,3]]){
    const {b,state,e}=battle(id,start),snapshot=JSON.stringify(state),hp=b.allies.map(a=>a.hp);
    enemyTurn(b);assert.equal(b.state.gold,start-loss);assert.equal(b.gold,0-loss);assert.deepEqual(b.allies.map(a=>a.hp),hp);assert.equal(JSON.stringify(state),snapshot);
    b.damage(b.allies[0],e,{sure:true,flat:10000});b.checkOutcome();
    assert.equal(b.finish().state.gold,start-loss+e.gold);assert.equal(b.finish().gold,e.gold-loss);
  }
});
test('poison has no initial damage, ticks through 50 units, refreshes without stacking, and pauses on player turns',()=>{
  const {b}=battle('sand-scorpion');for(const a of b.allies)a.hp=1000;
  enemyTurn(b);const target=b.allies.find(a=>a.poison);assert(target);assert.equal(target.hp,1000);assert.equal(b.allies.filter(a=>a.poison).length,1);
  target.next=b.time;assert.equal(b.tick(),false);assert.equal(target.hp,1000);
  advance(b,10);assert.equal(target.hp,990);enemyTurn(b);advance(b,50);
  assert.equal(target.hp,940);assert.equal(target.poison,null);advance(b,1);assert.equal(target.hp,940);
});
test('Poison Sing hits all heroes; Terms and Conditions cleanses; poison KO ends battle',()=>{
  const {b}=battle('scorpion-centaur');enemyTurn(b);assert(b.allies.every(a=>a.poison));
  const target=b.allies[0],patch=b.allies.find(a=>a.id==='patch');patch.next=b.time;patch.stamina=patch.maxStamina;
  b.act('terms',target.id);assert.equal(target.poison,null);assert(b.allies[1].poison);
  for(const a of b.allies){a.hp=1;a.poison={damage:1,next:b.time+1,until:b.time+50};a.next=b.time+100;}
  b.enemies[0].next=b.time+100;b.tick();assert.equal(b.outcome,'defeat');assert(b.allies.every(a=>a.poison===null));
});
test('negative defense doubles damage and Alcohol Spirit burns itself while damaging every hero',()=>{
  const slime=battle('slime');slime.b.damage(slime.b.allies[0],slime.e,{sure:true,crit:0});assert.equal(slime.e.hp,180-slime.b.allies[0].attack*2);
  const {b,e}=battle('bog-wisp');for(const a of b.allies)a.defense=0;
  const hp=b.allies.map(a=>a.hp);e.hp=20;enemyTurn(b);
  assert(b.allies.every((a,i)=>a.hp===hp[i]-e.attack*.5));assert.equal(e.hp,0);assert.equal(b.outcome,'victory');assert.equal(b.gold,e.gold);
});
