'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),C=require('../combat-engine.js'),D=require('../battles.json');
function setup(hero='silux'){
  const state=G.defaults();state.completed=['sewers-3','city-3','swamp-2','mountain-4','desert-2'];G.recruit(state);
  state.heroes=state.heroes.map(h=>G.newHero(h.id,36100));
  const b=new C.Battle(state,D.battles[0],D,()=>.5),a=b.allies.find(u=>u.id===hero);
  for(const u of b.units())u.next=100;
  a.next=0;
  for(const e of b.enemies){e.hp=1000;e.maxHp=1000;e.defense=0;}
  return {b,a,state};
}
function again(b,a){for(const u of b.units())u.next=b.time+100;a.next=b.time;a.stamina=a.maxStamina;}
test('Dramatic Entry picks a random enemy, costs 10, cannot repeat, and resets in a new battle',()=>{
  const {b,a,state}=setup(),before=a.stamina;
  assert.deepEqual(b.targets('strong',a),[]);b.act('strong','enemy-0');
  assert.equal(b.enemies[0].hp,1000);assert.equal(b.enemies[1].hp,1000-Math.round(a.attack*1.5));assert.equal(a.stamina,before-10);
  again(b,a);const snapshot=JSON.stringify(b);assert.throws(()=>b.act('strong'),/Already used/);assert.equal(JSON.stringify(b),snapshot);
  const fresh=new C.Battle(state,D.battles[0],D);assert.equal(fresh.skillReason(fresh.allies[0],C.skills.strong),'');
});
test('Dramatic Entry with a Big Sword deals 200% to every enemy',()=>{
  const {b,a}=setup();a.source.equipment.weapon='Big Sword';Object.assign(a,G.stats(a.source));b.act('strong');
  assert(b.enemies.every(e=>e.hp===1000-a.attack*2));
});
test('Ignorant Attack independently retargets after a kill and cleanses even if both attacks miss',()=>{
  const {b,a}=setup();a.poison={damage:1,next:1,until:50};a.negativeStatus='test';b.enemies[1].hp=1;
  b.act('double');assert.equal(b.enemies[1].hp,0);assert(b.enemies[0].hp<1000);assert.equal(a.poison,null);assert.equal(a.negativeStatus,null);
  const miss=setup();miss.b.random=()=>.999;miss.a.poison={damage:1,next:1,until:50};miss.b.act('double');assert(miss.b.enemies.every(e=>e.hp===1000));assert.equal(miss.a.poison,null);
});
test('Second Wind heals 30% and cancels Dodge; Queen uses 5 stamina and a 2t cooldown',()=>{
  const {b,a}=setup();a.hp=1;a.dodgeUntil=20;b.act('wind',a.id);assert.equal(a.hp,1+Math.ceil(a.maxHp*.3));assert.equal(a.dodgeUntil,0);
  const q=setup('lyra'),stamina=q.a.stamina;q.a.accuracy=0;q.b.act('precision','enemy-0');
  assert.equal(q.b.enemies[0].hp,1000-Math.round(q.a.attack));assert.equal(q.a.stamina,stamina-5);assert.equal(q.a.next,2);
});
test('Regal Intimidation slows all enemies for the battle, delays queued actions, and is single-use',()=>{
  const {b,a}=setup('lyra'),before=b.enemies.map(e=>({next:e.next,cooldown:e.cooldown}));b.act('foreshadow');
  for(const [i,e] of b.enemies.entries()){assert.equal(e.next,before[i].next+20);assert.equal(e.cooldown,before[i].cooldown+20);}
  again(b,a);assert.throws(()=>b.act('foreshadow'),/Already used/);
});
test('Plot Armor targets KOed or living allies, revives and fully heals, rejects invalid targets without spending its use',()=>{
  const {b,a}=setup('lyra'),target=b.allies[0];target.hp=0;
  assert(b.targets('armor',a).includes(target));assert.throws(()=>b.act('armor','enemy-0'),/Choose an ally/);assert.equal(a.usedSkills,undefined);
  const stamina=a.stamina;b.act('armor',target.id);assert.equal(a.stamina,stamina-1);assert.equal(target.hp,target.maxHp);assert.equal(target.next,target.cooldown);
  again(b,a);assert.throws(()=>b.act('armor',a.id),/Already used/);
  const live=setup('lyra');live.a.hp=1;live.b.act('armor',live.a.id);assert.equal(live.a.hp,live.a.maxHp);
});
test('Friendship Power requires level 10 and staff, heals and cleanses all living allies without revival',()=>{
  const {b,a}=setup('lyra');assert.match(b.skillReason(a,C.skills.footnote),/Healing Staff/);
  a.source.equipment.weapon='Healing Staff';a.level=9;assert.match(b.skillReason(a,C.skills.footnote),/Level 10/);a.level=10;
  for(const u of b.allies){u.hp=1;u.poison={damage:1,next:1,until:50};}
  b.allies[0].hp=0;const stamina=a.stamina;b.act('footnote');assert.equal(a.stamina,stamina-15);assert.equal(b.allies[0].hp,0);
  for(const u of b.allies.slice(1)){assert.equal(u.hp,1+Math.ceil(u.maxHp*.1));assert.equal(u.poison,null);}
});
test('Overpowered Healing needs level 20 and 40 stamina but no staff; revives, heals, attacks, blesses, and cannot repeat',()=>{
  const {b,a}=setup('lyra');a.level=19;assert.match(b.skillReason(a,C.skills.overHeal),/Level 20/);a.level=20;a.stamina=39;assert.match(b.skillReason(a,C.skills.overHeal),/40 Stamina/);a.stamina=40;
  for(const u of b.allies)u.hp=u===a?1:0;
  b.act('overHeal');assert.equal(a.stamina,0);assert(b.allies.every(u=>u.hp===u.maxHp&&u.blessUntil===20));assert(b.enemies.every(e=>e.hp===1000-Math.round(a.attack)));
  again(b,a);assert.throws(()=>b.act('overHeal'),/Already used/);
});
