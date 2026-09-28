'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),E=require('../equipment.js'),C=require('../combat-engine.js'),D=require('../battles.json');
function give(state,id,quantity=1){state.inventory.push({id,name:E.byId[id].name,quantity});return state;}
test('starting loadout retains the documented stats and all 12 slots',()=>{
 const state=G.defaults(),hero=state.heroes[0];assert.equal(Object.keys(E.slots).length,12);assert.equal(G.stats(hero).attack,12);assert.equal(G.stats(hero).defense,7);assert.equal(G.stats(hero).cooldown,9);assert.equal(G.capacity(state),24);
 assert.equal(E.itemInSlot(hero,'torso').id,'worn-shirt');assert.equal(E.itemInSlot(hero,'legs').id,'old-trousers');
});
test('equipping consumes one owned item; unequipping returns it and removes combat bonuses',()=>{
 const state=give(G.defaults(),'wooden-buckler',2),original=JSON.stringify(state);
 const equipped=G.equip(state,'silux','offhand','wooden-buckler');assert.equal(equipped.inventory.find(i=>i.id==='wooden-buckler').quantity,1);assert.equal(G.stats(equipped.heroes[0]).defense,10);assert.equal(JSON.stringify(state),original);
 const unequipped=G.equip(equipped,'silux','offhand',null);assert.equal(unequipped.inventory.find(i=>i.id==='wooden-buckler').quantity,2);assert.equal(G.stats(unequipped.heroes[0]).defense,7);
 const shirt=G.equip(state,'silux','torso',null);assert.equal(G.stats(shirt.heroes[0]).defense,6);assert.equal(E.itemInSlot(shirt.heroes[0],'torso'),null);
});
test('swaps are atomic and enforce ownership, slots, hero classes and level requirements',()=>{
 let s=G.defaults();assert.throws(()=>G.equip(s,'silux','head','leather-cap'),/not in/);give(s,'leather-cap');assert.throws(()=>G.equip(s,'silux','feet','leather-cap'),/fit/);
 give(s,'heavy-axe');assert.throws(()=>G.equip(s,'silux','weapon','heavy-axe'),/cannot use/);give(s,'dark-crown');assert.throws(()=>G.equip(s,'silux','head','dark-crown'),/level 15/);
 assert.throws(()=>G.equip(s,'lyra','head','leather-cap'),/not joined/);assert.throws(()=>G.equip(s,'silux','imaginary',null),/Unknown equipment slot/);
 const before=JSON.stringify(s);assert.throws(()=>G.equip(s,'silux','head','dark-crown'));assert.equal(JSON.stringify(s),before);
});
test('two-handed swords return offhand gear; offhand slot cannot be used until the sword is removed',()=>{
 let s=G.defaults();s.completed=['desert-2'];give(s,'big-sword');give(s,'wooden-buckler');s=G.equip(s,'silux','offhand','wooden-buckler');s=G.equip(s,'silux','weapon','big-sword');
 assert.equal(s.heroes[0].equipment.offhand,null);assert(s.inventory.some(i=>i.id==='wooden-buckler'));assert(s.inventory.some(i=>i.id==='rusty-sword'));assert.equal(G.stats(s.heroes[0]).attack,16);assert.equal(G.stats(s.heroes[0]).cooldown,11);
 assert.throws(()=>G.equip(s,'silux','offhand','wooden-buckler'),/both hands/);
 s=G.equip(s,'silux','weapon','rusty-sword');s=G.equip(s,'silux','offhand','wooden-buckler');assert.equal(G.stats(s.heroes[0]).defense,10);
});
test('locked cape, heart and specialist weapons enforce regional progression',()=>{
 const s=G.defaults();give(s,'travel-cape');give(s,'borrowed-courage');give(s,'big-sword');
 assert.throws(()=>G.equip(s,'silux','cape','travel-cape'),/Giant Happy Flower/);assert.throws(()=>G.equip(s,'silux','heart','borrowed-courage'),/Lich/);assert.throws(()=>G.equip(s,'silux','weapon','big-sword'),/desert/);
 s.completed=['countryside-2'];assert.equal(G.stats(G.equip(s,'silux','cape','travel-cape').heroes[0]).defense,9);
});
test('shared equipment transfers between recruited heroes without duplication',()=>{
 let s=G.defaults();s.completed=['sewers-3'];G.recruit(s);s=G.equip(s,'silux','feet',null);s=G.equip(s,'lyra','feet','leather-shoes');
 assert.equal(s.heroes[0].equipment.feet,null);assert.equal(s.heroes[1].equipment.feet,'Leather Shoes');assert(!s.inventory.some(i=>i.id==='leather-shoes'));assert(s.inventory.some(i=>i.id==='soft-boots'));assert.equal(G.stats(s.heroes[1]).cooldown,7);
});
test('each ring slot needs an owned copy and both bonuses apply',()=>{
 let s=G.defaults();s.heroes[0]=G.newHero('silux',400);give(s,'lucky-ring');s=G.equip(s,'silux','ring1','lucky-ring');assert.throws(()=>G.equip(s,'silux','ring2','lucky-ring'),/not in/);
 give(s,'lucky-ring');s=G.equip(s,'silux','ring2','lucky-ring');assert.equal(G.stats(s.heroes[0]).crit,20);
});
test('capacity reductions and two-hand swaps fail without dropping any items',()=>{
 const s=G.defaults();s.inventory=Array.from({length:24},(_,i)=>({id:`junk-${i}`,name:`Junk ${i}`,quantity:1}));const original=JSON.stringify(s);
 assert.throws(()=>G.equip(s,'silux','backpack',null),/inventory space/);assert.equal(JSON.stringify(s),original);
 s.completed=['desert-2'];s.heroes[0].equipment.offhand='Wooden Buckler';s.inventory[0]={id:'big-sword',name:'Big Sword',quantity:1};
 const before=JSON.stringify(s);assert.throws(()=>G.equip(s,'silux','weapon','big-sword'),/inventory space/);assert.equal(JSON.stringify(s),before);
});
test('larger bags make room for returned equipment and belts contribute to shared capacity',()=>{
 let s=G.defaults();s.heroes[0]=G.newHero('silux',4900);s.inventory=Array.from({length:24},(_,i)=>({id:`junk-${i}`,name:`Junk ${i}`,quantity:1}));s.inventory[0]={id:'large-backpack',name:'Large Backpack',quantity:1};
 s=G.equip(s,'silux','backpack','large-backpack');assert.equal(G.capacity(s),28);assert.equal(s.inventory.length,24);assert(s.inventory.some(i=>i.id==='small-backpack'));
 give(s,'utility-belt');s=G.equip(s,'silux','belt','utility-belt');assert.equal(G.capacity(s),30);
});
test('gear changes cannot heal; removing max-HP and Stamina gear clamps current resources',()=>{
 let s=G.defaults();s.completed=['castle-2'];s.heroes[0]=G.newHero('silux',12100);const initial=s.heroes[0].hp;give(s,'borrowed-courage');s=G.equip(s,'silux','heart','borrowed-courage');assert.equal(s.heroes[0].hp,initial);
 G.rest(s);assert.equal(s.heroes[0].hp,initial+20);s=G.equip(s,'silux','heart',null);assert.equal(s.heroes[0].hp,initial);
 give(s,'vigor-ring');const stamina=s.heroes[0].stamina;s=G.equip(s,'silux','ring1','vigor-ring');assert.equal(s.heroes[0].stamina,stamina);G.rest(s);s=G.equip(s,'silux','ring1',null);assert.equal(s.heroes[0].stamina,stamina);
});
test('old save migration retains gear; new empty slots stay empty after saving and combat uses the gear',()=>{
 const old={version:1,completed:[],selected:'sewers',gold:27,inventory:[],heroes:[{id:'silux',xp:0,hp:23,stamina:7,equipment:{weapon:'Rusty Sword',backpack:4,belt:0}}]};
 let s=G.normalize(old);assert.equal(G.stats(s.heroes[0]).defense,7);assert.equal(s.heroes[0].hp,23);s=G.equip(s,'silux','torso',null);give(s,'wooden-buckler');s=G.equip(s,'silux','offhand','wooden-buckler');
 let raw;const storage={setItem:(k,v)=>raw=v,getItem:()=>raw};G.save(s,storage);s=G.load(storage);assert.equal(s.heroes[0].equipment.torso,null);assert.equal(s.heroes[0].hp,23);assert.equal(s.gold,27);
 const b=new C.Battle(s,D.battles[0],D);assert.equal(b.allies[0].defense,9);assert.equal(b.allies[0].hp,23);
});
test('all equipment loot IDs and display names resolve in the catalogue',()=>{
 for(const enemy of Object.values(D.enemies))for(const drop of enemy.loot){if(E.byId[drop.id])assert.equal(E.byId[drop.id].name,drop.name);}
 assert(D.enemies['scorpion-centaur'].loot.some(i=>i.id==='big-sword'&&i.quantity===2));assert(D.enemies.yeti.loot.some(i=>i.id==='healing-staff'&&i.quantity===2));
});
