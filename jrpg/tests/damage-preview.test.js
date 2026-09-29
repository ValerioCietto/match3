'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),C=require('../combat-engine.js'),D=require('../battles.json');
function setup(){const b=new C.Battle(G.defaults(),D.battles[0],D,()=>.5);return {b,a:b.allies[0],e:b.enemies[0]};}
test('previews match actual damage with defense, vulnerabilities, training, Berserk and Blessing',()=>{
  for(const defense of [-100,0,30,100])for(const action of ['attack','piercer','structural']){
    const {b,a,e}=setup();e.hp=10000;e.defense=defense;e.blessUntil=20;a.training=2;a.berserk=true;
    const p=b.attackPreview(action,a,e),options=action==='attack'?{power:1.5}:C.skills[action];
    const before=e.hp;b.damage(a,e,{...options,crit:0});assert.equal(before-e.hp,p.damage);
    const hp=e.hp;b.damage(a,e,{...options,crit:100});assert.equal(hp-e.hp,p.criticalDamage);
  }
});
test('preview shows skill accuracy and critical overrides, applies Dodge, and never consumes randomness or mutates combat',()=>{
  const {b,a,e}=setup();b.random=()=>{throw Error('Preview must not roll');};e.dodgeUntil=20;
  const snapshot=JSON.stringify(b),p=b.attackPreview('piercer',a,e);
  assert.equal(p.accuracy,9);assert.equal(p.criticalChance,80);
  assert.equal(b.attackPreview('precision',a,e).accuracy,10);
  assert.equal(JSON.stringify(b),snapshot);
});
test('non-targeted skills, support skills and KOed enemies do not produce target previews',()=>{
  const {b,a,e}=setup();for(const action of ['wind','armor','foreshadow','strong','double'])assert.equal(b.attackPreview(action,a,e),null);
  assert.equal(b.attackPreview('attack',a,a),null);e.hp=0;assert.equal(b.attackPreview('attack',a,e),null);
});
