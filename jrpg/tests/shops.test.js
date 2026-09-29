'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../game.js'),E=require('../equipment.js'),S=require('../shop-core.js'),C=require('../combat-engine.js');
const shops=require('../shops.json'),catalogue=require('../shop.json'),battles=require('../battles.json');
function stateFor(shop,gold=5000){const s=G.defaults();s.completed=[shops.shops.find(s=>s.id===shop).unlockBattle];s.gold=gold;return s;}
function buy(state,shop,id,quantity=1){return S.buy(state,shop,id,quantity,shops,catalogue);}
test('human-editable JSON defines exactly three shops with 28 valid offers',()=>{
 S.validateShops(shops);S.validateItems(catalogue,shops);assert.equal(shops.shops.length,3);assert.equal(catalogue.items.length,28);
 assert.deepEqual(shops.shops.map(s=>s.unlockBattle),['sewers-3','city-3','castle-2']);
 const broken=G.clone(catalogue);broken.items[0].price=-1;assert.throws(()=>S.validateItems(broken,shops),/price/);
 const duplicate=G.clone(catalogue);duplicate.items.push(duplicate.items[0]);assert.throws(()=>S.validateItems(duplicate,shops),/Duplicate/);
});
test('shops unlock only after the regional boss, including direct shop access',()=>{
 const s=G.defaults();s.gold=1000;s.completed=['sewers-1','sewers-2'];assert(!S.unlocked(s,shops.shops[0]));assert.throws(()=>buy(s,'sewers','shop-sewers-ring'),/locked/);
 s.completed.push('sewers-3');assert(S.unlocked(s,shops.shops[0]));assert(!S.unlocked(s,shops.shops[1]));assert.throws(()=>buy(s,'city','shop-city-sword'),/locked/);
 s.completed.push('city-3','castle-2');assert(shops.shops.every(shop=>S.unlocked(s,shop)));
});
test('buying deducts exact Gold and adds owned equipment without mutating the original',()=>{
 const s=stateFor('sewers',20),before=JSON.stringify(s),next=buy(s,'sewers','shop-sewers-ring',2);
 assert.equal(next.gold,2);assert.equal(next.inventory.find(i=>i.id==='shop-sewers-ring').quantity,2);assert.equal(next.shopEquipment.length,1);assert.equal(next.shopPurchases['shop-sewers-ring'],2);assert.equal(JSON.stringify(s),before);
});
test('insufficient Gold, invalid quantities, and another shop’s items cannot be purchased',()=>{
 const s=stateFor('sewers',5),before=JSON.stringify(s);assert.throws(()=>buy(s,'sewers','shop-sewers-ring'),/Gold/);
 for(const n of [0,-1,1.5,100,NaN])assert.throws(()=>buy(s,'sewers','shop-sewers-ring',n),/quantity/);
 assert.throws(()=>buy(s,'sewers','shop-city-sword'),/not sold/);assert.equal(JSON.stringify(s),before);
});
test('full inventory rejects purchases atomically but permits stacking existing consumables',()=>{
 const s=stateFor('city');s.inventory=Array.from({length:24},(_,i)=>({id:`junk-${i}`,name:`Junk ${i}`,quantity:99}));const original=JSON.stringify(s);
 assert.throws(()=>buy(s,'city','shop-city-sword'),/inventory space/);assert.equal(JSON.stringify(s),original);
 s.inventory[0]={id:'healing-potion',name:'Healing Potion',quantity:98};const next=buy(s,'city','shop-city-healing');assert.equal(next.inventory[0].quantity,99);assert.equal(next.inventory.length,24);
 assert.throws(()=>buy(s,'city','shop-city-healing',2),/inventory space/);
});
test('castle stock is finite and persists across save/load; common supplies remain repeatable',()=>{
 let s=buy(stateFor('castle'),'castle','shop-castle-sword');const offer=catalogue.items.find(i=>i.id==='shop-castle-sword');assert.equal(S.remaining(s,offer),0);assert.throws(()=>buy(s,'castle',offer.id),/stock/);
 let raw;const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};G.save(s,storage);s=G.load(storage);assert.equal(S.remaining(s,offer),0);
 s=buy(s,'castle','shop-castle-healing',5);s=buy(s,'castle','shop-castle-healing',5);assert.equal(S.remaining(s,catalogue.items.find(i=>i.id==='shop-castle-healing')),Infinity);
});
test('purchased item definitions survive reload and apply in the hero manager and combat',()=>{
 let s=stateFor('city');s.heroes[0]=G.newHero('silux',1600);s=G.normalize(buy(s,'city','shop-city-sword'));s=G.equip(s,'silux','weapon','shop-city-sword');s=G.normalize(s);
 assert.equal(E.itemInSlot(s.heroes[0],'weapon').id,'shop-city-sword');assert.equal(G.stats(s.heroes[0]).attack,24);assert.equal(G.stats(s.heroes[0]).accuracy,93);
 const battle=new C.Battle(s,battles.battles[0],battles);assert.equal(battle.allies[0].attack,24);assert.equal(battle.allies[0].accuracy,93);
 const copy=G.equip(s,'silux','weapon',null);assert(copy.inventory.some(i=>i.id==='shop-city-sword'));assert(!E.itemInSlot(copy.heroes[0],'weapon'));
});
test('shop backpacks retain their identity even when their capacity matches another bag',()=>{
 let s=G.normalize(buy(stateFor('sewers'),'sewers','shop-sewers-backpack'));s=G.equip(s,'silux','backpack','shop-sewers-backpack');assert.equal(G.capacity(s),28);
 s=G.normalize(s);assert.equal(E.itemInSlot(s.heroes[0],'backpack').name,'Patched Sack with Ambitions');s=G.equip(s,'silux','backpack',null);assert(s.inventory.some(i=>i.id==='shop-sewers-backpack'));assert.equal(G.capacity(s),24);
});
test('epic specialist weapons obey two-hand rules and satisfy existing skill gates',()=>{
 let s=stateFor('castle');s.completed.push('desert-2','mountain-4','sewers-3');s.heroes[0]=G.newHero('silux',36100);G.recruit(s);
 s=G.normalize(buy(s,'castle','shop-castle-greatsword'));s=G.equip(s,'silux','weapon','shop-castle-greatsword');assert(E.hasWeaponType(s.heroes[0],'Big Sword'));assert.throws(()=>G.equip(s,'silux','offhand','wooden-buckler'),/both hands/);
 let battle=new C.Battle(s,battles.battles[0],battles);assert.equal(battle.skillReason(battle.allies[0],C.skills.flurry),'');
 s=G.normalize(buy(s,'castle','shop-castle-staff'));s=G.equip(s,'lyra','weapon','shop-castle-staff');battle=new C.Battle(s,battles.battles[0],battles);assert.equal(battle.skillReason(battle.allies.find(h=>h.id==='lyra'),C.skills.overHeal),'');
});
test('saving a purchase failure does not charge Gold or deplete stock',()=>{
 const s=stateFor('castle'),raw=JSON.stringify(s),next=buy(s,'castle','shop-castle-sword');const storage={setItem:()=>{throw Error('Storage full');},getItem:()=>raw};assert.throws(()=>G.save(next,storage),/Storage full/);assert.equal(G.load(storage).gold,s.gold);assert.equal(S.remaining(G.load(storage),catalogue.items.find(i=>i.id==='shop-castle-sword')),1);
});
test('existing saves remain readable and purchased equipment survives another battle reward',()=>{
 let s=G.normalize(buy(stateFor('sewers'),'sewers','shop-sewers-ring'));s=G.equip(s,'silux','ring1','shop-sewers-ring');const battle=new C.Battle(s,battles.battles[0],battles,()=>.1);
 for(const enemy of battle.enemies)battle.damage(battle.allies[0],enemy,{sure:true,flat:999});battle.checkOutcome();s=G.normalize(battle.finish().state);assert.equal(G.stats(s.heroes[0]).crit,11);assert.equal(s.shopPurchases['shop-sewers-ring'],1);
 assert.equal(G.normalize({version:1,completed:[],selected:'sewers'}).heroes[0].equipment.weapon,'Rusty Sword');
});
test('catalogue edits do not change the saved bonuses of already purchased gear',()=>{
 let s=G.normalize(buy(stateFor('city'),'city','shop-city-sword'));const altered=G.clone(catalogue);altered.items.find(i=>i.id==='shop-city-sword').stats.attack=50;
 s=S.buy(s,'city','shop-city-sword',1,shops,altered);s=G.normalize(s);assert.equal(s.shopEquipment.find(i=>i.id==='shop-city-sword').stats.attack,6);assert.equal(s.shopEquipment.length,1);
});
