'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),E=require('../end-game-engine.js');
function save(){const s=G.defaults();s.completed=['final-1'];s.darkKingParty=G.clone(s.heroes);return s;}
function turn(b){for(const u of b.units())u.next=b.time+100;b.lord.next=b.time;}
test('reversal is locked until Dark King falls and creates all four level-20 heroes without changing save',()=>{
  assert.throws(()=>new E.Reversal(G.defaults()),/Defeat/);
  const s=save(),before=JSON.stringify(s),b=new E.Reversal(s);
  assert.deepEqual(b.allies.map(h=>h.id),['silux','lyra','grond','patch']);assert(b.allies.every(h=>h.level===20&&h.hp===h.maxHp));
  assert.deepEqual(b.allies[0].source.equipment,s.darkKingParty[0].equipment);assert.equal(JSON.stringify(s),before);assert.equal(b.actor(),b.lord);
});
test('Dark Lord commands damage, summon within cap, and spend timeline cooldown',()=>{
  const b=new E.Reversal(save(),()=>.5);assert.throws(()=>b.command('attack','invalid'),/Choose/);
  const hp=b.allies[0].hp;b.command('attack','silux');assert(b.allies[0].hp<hp);assert.equal(b.lord.next,12);
  turn(b);const before=b.allies.map(h=>h.hp);b.command('sweep');assert(b.allies.every((h,i)=>h.hp<before[i]));assert.equal(b.lord.next,18);
  for(let i=0;i<3;i++){turn(b);b.command('summon');}assert.equal(b.enemies.length,4);
  turn(b);assert.throws(()=>b.command('summon'),/Three skeletons/);
  const skeleton=b.enemies[1];turn(b);b.lord.next=100;skeleton.next=0;const total=b.allies.reduce((n,h)=>n+h.hp,0);b.autoAct();assert(b.allies.reduce((n,h)=>n+h.hp,0)<total);
});
test('Monologue lets heroes fight, defeat reaches epilogue, and winning requests a fresh attempt',()=>{
  const s=save(),snapshot=JSON.stringify(s),b=new E.Reversal(s,()=>.5);
  let actions=0;while(!b.outcome&&actions++<20000){if(b.actor()===b.lord)b.command('monologue');else if(b.actor())b.autoAct();else b.tick();}
  assert.equal(b.outcome,'ending');assert.equal(JSON.stringify(s),snapshot);
  const win=new E.Reversal(s);for(const h of win.allies)h.hp=0;win.checkOutcome();assert.equal(win.outcome,'restart');
  const restart=new E.Reversal(s);assert(restart.allies.every(h=>h.hp===h.maxHp));assert.equal(restart.time,0);
});
test('Dark Lord death ends the encounter even with living skeletons',()=>{
  const b=new E.Reversal(save());b.command('summon');b.lord.hp=0;b.checkOutcome();assert.equal(b.outcome,'ending');
});
