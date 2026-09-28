'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),C=require('../combat-engine.js'),D=require('../battles.json');
function create(id='sewers-1',state=G.defaults(),rng=()=>.1){return new C.Battle(state,D.battles.find(b=>b.id===id),D,rng);}
function heroTurn(b){let guard=0;while(b.actor()?.side!=='ally'&&!b.outcome&&guard++<500){if(b.actor())b.enemyAct();else b.tick();}}
function win(b){for(const enemy of b.enemies){enemy.hp=1;b.damage(b.allies[0],enemy,{sure:true,flat:10000});}b.checkOutcome();return b.finish();}
test('every journey battle has valid enemies and all eight bosses are present',()=>{
 C.validate(D);assert.equal(D.battles.length,19);assert.equal(D.battles.filter(b=>b.boss).length,8);
 assert.deepEqual(D.battles.filter(b=>b.boss).map(b=>D.enemies[b.enemies[0]].name),['Rat King','Giant Happy Flower','Apache Helicopter','Giant Scorpion Centaur','Giant Slime','Yeti','Lich','Dark King']);
 assert.throws(()=>C.validate({...D,battles:D.battles.slice(1)}));
});
test('locked URLs cannot start encounters; either branch unlocks Mountain',()=>{
 assert.throws(()=>create('final-1'),/locked/);const s=G.defaults();s.completed=['city-3','desert-1'];assert(G.available(s,'swamp-1'));assert(!G.available(s,'mountain-1'));s.completed.push('desert-2');assert(G.available(s,'mountain-1'));assert(G.available(s,'swamp-1'));
 s.completed=['city-3','swamp-2'];assert(G.available(s,'mountain-1'));
});
test('old map saves migrate without losing completed battles; HP and supplies survive',()=>{
 const old=G.normalize({version:1,completed:['sewers-3','city-3'],selected:'desert'});assert.equal(old.heroes.length,3);assert.equal(G.capacity(old),32);
 old.heroes[0].hp=7;old.gold=123;old.inventory[0].quantity=2;const copy=G.normalize(old);assert.equal(copy.heroes[0].hp,7);assert.equal(copy.gold,123);assert.equal(copy.inventory[0].quantity,2);
});
test('starting effective stats match the design',()=>{const s=G.stats(G.defaults().heroes[0]);assert.equal(s.attack,12);assert.equal(s.defense,7);assert.equal(s.cooldown,9);});
test('player choice pauses time; cooldown schedules and timeline regenerates Stamina',()=>{
 const b=create();assert.equal(b.actor().id,'silux');assert.equal(b.tick(),false);assert.equal(b.time,0);b.act('strong','enemy-0');assert.equal(b.allies[0].next,9);assert.equal(b.allies[0].stamina,20);
 for(let i=0;i<9;i++)b.tick();assert.equal(b.time,9);assert(Math.abs(b.allies[0].stamina-20.9)<1e-8);assert.equal(b.actor().id,'silux');
});
test('Dodge survives items and healing, and is cancelled by attacks and other skills',()=>{
 const b=create();b.act('dodge');heroTurn(b);const a=b.actor();assert.equal(a.dodgeUntil,20);b.act('item:healing-potion',a.id);assert.equal(a.dodgeUntil,20);heroTurn(b);b.act('attack','enemy-0');assert.equal(a.dodgeUntil,0);
 const s=G.defaults();s.heroes[0]=G.newHero('silux',1600);const h=create('sewers-1',s);h.allies[0].dodgeUntil=20;h.act('wind','silux');assert.equal(h.allies[0].dodgeUntil,20);
 const p=create();p.allies[0].dodgeUntil=20;p.act('strong','enemy-0');assert.equal(p.allies[0].dodgeUntil,0);
});
test('KOed characters receive full immediate XP and cannot be healed by ordinary items',()=>{
 const s=G.defaults();s.completed=['sewers-3'];G.recruit(s);const b=create('sewers-1',s);b.allies[1].hp=0;
 assert.throws(()=>b.act('item:healing-potion','lyra'),/living/);assert.equal(b.state.inventory[0].quantity,3);
 const before=b.allies[1].source.xp;b.damage(b.allies[0],b.enemies[0],{sure:true,flat:100});assert.equal(b.allies[1].source.xp,before+35);assert.equal(b.state.gold,4);assert.equal(b.allies[1].hp,0);
});
test('battle rewards, items and HP never mutate the pre-battle save',()=>{
 const state=G.defaults(),snapshot=JSON.stringify(state),b=create('sewers-1',state);
 b.act('item:healing-potion','silux');b.damage(b.allies[0],b.enemies[0],{sure:true,flat:100});assert.equal(JSON.stringify(state),snapshot);
 b.allies[0].hp=0;b.checkOutcome();assert.equal(b.outcome,'defeat');assert.throws(()=>b.finish(),/victories/);assert.equal(JSON.stringify(state),snapshot);
});
test('victory commits once, unlocks the next battle, stacks loot and revives KO at half HP',()=>{
 const s=G.defaults();s.completed=['sewers-3'];G.recruit(s);const b=create('sewers-1',s);b.allies[1].hp=0;const result=win(b);
 assert(G.available(result.state,'sewers-2'));assert.equal(result.state.heroes[1].hp,Math.ceil(G.stats(result.state.heroes[1]).maxHp/2));
 const snapshot=JSON.stringify(result);assert.equal(JSON.stringify(b.finish()),snapshot);
});
test('boss clears and replays fully rest the party; recruitment happens once',()=>{
 const s=G.defaults();s.completed=['sewers-1','sewers-2'];s.heroes[0].hp=2;s.heroes[0].stamina=0;
 const first=win(create('sewers-3',s)).state;assert.equal(first.heroes.length,2);for(const h of first.heroes){assert.equal(h.hp,G.stats(h).maxHp);assert.equal(h.stamina,G.stats(h).maxStamina);}
 first.heroes[0].hp=1;const again=win(create('sewers-3',first));assert(!again.firstClear);assert.equal(again.state.heroes.length,2);assert.equal(again.state.heroes[0].hp,G.stats(again.state.heroes[0]).maxHp);
});
test('independent loot rolls can yield both drops; stacks cap at 99, inventory at 60',()=>{
 const b=create('sewers-1',G.defaults(),()=>0);win(b);assert(b.loot.some(i=>i.id==='fur'));assert(b.loot.some(i=>i.id==='silver-key'));
 const s=G.defaults();s.completed=['sewers-3','city-3','swamp-2'];G.recruit(s);for(const h of s.heroes)h.equipment={backpack:8,belt:2};assert.equal(G.capacity(s),60);
 s.inventory=Array.from({length:60},(_,i)=>({id:`item-${i}`,name:`Item ${i}`,quantity:99}));s.inventory[0].quantity=98;
 const dropped=G.addLoot(s,[{id:'item-0',name:'Item 0',quantity:3}]);assert.equal(s.inventory[0].quantity,99);assert.equal(dropped[0].quantity,2);assert.equal(s.inventory.length,60);
});
test('skill validation does not consume a turn or Stamina',()=>{
 const b=create();assert.throws(()=>b.act('wind','silux'),/Level 5/);assert.equal(b.actor().id,'silux');assert.equal(b.allies[0].stamina,30);assert.throws(()=>b.act('attack','silux'),/target/);
 b.allies[0].stamina=0;assert.throws(()=>b.act('piercer','enemy-0'),/Stamina/);
});
test('ambush, guard interception, damage reduction and equipment gates',()=>{
 const s=G.defaults();s.completed=['sewers-3','countryside-2','city-1','city-3'];G.recruit(s);const ambush=create('city-2',s);assert.equal(ambush.actor().side,'enemy');
 const b=create('sewers-1',s),grond=b.allies.find(a=>a.id==='grond');grond.guardTarget='silux';grond.guardUntil=20;
 const hp=b.allies[0].hp;b.damage(b.enemies[0],b.allies[0],{sure:true});assert.equal(b.allies[0].hp,hp);assert(grond.hp<grond.maxHp);
 b.allies[0].level=20;assert.match(b.skillReason(b.allies[0],C.skills.flurry),/Big Sword/);
});
test('level-20 healing explicitly revives and schedules KOed allies',()=>{
 const s=G.defaults();s.completed=['sewers-3'];G.recruit(s);s.heroes=s.heroes.map(h=>G.newHero(h.id,36100));s.heroes[1].equipment.weapon='Healing Staff';
 const b=create('sewers-1',s);b.allies[0].hp=0;b.act('overHeal');assert.equal(b.allies[0].hp,b.allies[0].maxHp);assert(b.allies[0].next>0);assert.equal(b.allies[0].blessUntil,20);
});
test('complete journey is playable with an automated attack/heal strategy',()=>{
 let seed=123456;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};let state=G.defaults();
 for(const e of D.battles){let victorious=false;for(let attempt=0;attempt<8&&!victorious;attempt++){
   const b=create(e.id,state,rng);let turns=0;
   while(!b.outcome&&turns++<20000){const a=b.actor();if(!a){b.tick();continue;}if(a.side==='enemy'){b.enemyAct();continue;}
     const low=b.living('ally').sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0],enemy=b.living('enemy').sort((a,b)=>a.hp-b.hp)[0];
     const heal=b.skillList(a).find(s=>s.kind==='heal'&&!s.all&&!s.self&&!b.skillReason(a,s));
     if(low.hp<low.maxHp*.45&&heal)b.act(heal.id,low.id);
     else if(low.hp<low.maxHp*.4&&b.state.inventory.some(i=>i.id==='healing-potion'))b.act('item:healing-potion',low.id);
     else if(a.id==='silux'&&a.stamina>=20&&enemy.hp>30)b.act('piercer',enemy.id);else b.act('attack',enemy.id);
   }
   if(b.outcome==='victory'){state=b.finish().state;if(state.gold>=10){state.gold-=10;G.rest(state);}victorious=true;}
 }assert(victorious,`${e.id} could not be completed`);}
 assert.equal(state.completed.length,19);assert.equal(state.heroes.length,4);assert(state.darkKingParty);
});
