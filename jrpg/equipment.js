(function (root) {
  'use strict';
  const slots = {
    weapon: 'Hand 1', offhand: 'Hand 2', head: 'Head', torso: 'Torso',
    legs: 'Legs', feet: 'Feet', ring1: 'Ring 1', ring2: 'Ring 2',
    cape: 'Cape', backpack: 'Backpack', belt: 'Belt', heart: 'Heart'
  };
  const items = [
    {id:'rusty-sword',name:'Rusty Sword',slots:['weapon'],classes:['silux','grond'],stats:{attack:2},description:'Chosen by the village budget committee.'},
    {id:'dagger',name:'Dagger',slots:['weapon'],classes:['lyra','silux'],stats:{attack:1,cooldown:-2},description:'For quick strikes.'},
    {id:'heavy-axe',name:'Heavy Axe',slots:['weapon'],classes:['grond'],stats:{attack:4,cooldown:2},description:'Grond considers this a conversational aid.'},
    {id:'walking-stick',name:'Walking Stick',slots:['weapon'],classes:['patch','lyra'],stats:{},description:'The basic plan. Miracles billed separately.'},
    {id:'big-sword',name:'Big Sword',slots:['weapon'],classes:['silux','grond'],boss:'desert-2',hands:2,stats:{attack:15,cooldown:3},description:'Occupies both hands. Only for mighty warriors that have something to compensate.'},
    {id:'healing-staff',name:'Healing Staff',slots:['weapon'],classes:['lyra','patch'],boss:'mountain-4',stats:{attack:2,cooldown:-2,defense:10},description:'Enables staff-dependent healing skills at their required levels. Plus looks cool, all sparkling and stuff.'},
    {id:'wooden-buckler',name:'Wooden Buckler',slots:['offhand'],stats:{defense:3},description:'A small, portable disagreement with incoming damage.'},
    {id:'leather-cap',name:'Leather Cap',slots:['head'],stats:{defense:1},description:'Marginally better than protagonist hair.'},
    {id:'dark-crown',name:'Dark Crown',slots:['head'],level:15,stats:{attack:5,defense:5},description:'Previously owned. Ominous aura included.'},
    {id:'worn-shirt',name:'Worn Shirt',slots:['torso'],stats:{defense:1},description:'The original one-percent survival plan.'},
    {id:'travel-robe',name:'Travel Robe',slots:['torso'],stats:{},description:'Mysterious, but not particularly protective.'},
    {id:'padded-armor',name:'Padded Armor',slots:['torso'],stats:{},description:'Comfort is its own reward.'},
    {id:'clerical-robe',name:'Clerical Robe',slots:['torso'],stats:{},description:'Official uniform of divine technical support.'},
    {id:'chain-shirt',name:'Chain Shirt',slots:['torso'],level:4,stats:{defense:5,cooldown:1},description:'More protection. Slightly less enthusiasm for running.'},
    {id:'old-trousers',name:'Old Trousers',slots:['legs'],stats:{defense:1},description:'A legendary hero should at least wear trousers.'},
    {id:'reinforced-trousers',name:'Reinforced Trousers',slots:['legs'],level:3,stats:{defense:3},description:'Knees reinforced against dramatic kneeling.'},
    {id:'leather-shoes',name:'Leather Shoes',slots:['feet'],stats:{cooldown:-1},description:'One timeline unit ahead of bare feet.'},
    {id:'soft-boots',name:'Soft Boots',slots:['feet'],stats:{},description:'Quiet enough to conceal an obvious backstory.'},
    {id:'work-boots',name:'Work Boots',slots:['feet'],stats:{},description:'Made for honest work. Somehow ended up here.'},
    {id:'sandals',name:'Sandals',slots:['feet'],stats:{},description:'Not covered by the mountain travel policy.'},
    {id:'lucky-ring',name:'Lucky Ring',slots:['ring1','ring2'],level:3,stats:{crit:5},description:'Luck, conveniently quantified.'},
    {id:'vigor-ring',name:'Vigor Ring',slots:['ring1','ring2'],level:5,stats:{maxStamina:5},description:'For when saving the world feels like physical labor.'},
    {id:'travel-cape',name:'Travel Cape',slots:['cape'],stats:{defense:2},description:'Flutters heroically, even in inconvenient weather.'},
    {id:'small-backpack',name:'Small Backpack',slots:['backpack'],value:4,stats:{},description:'Adds 4 slots to the shared inventory.'},
    {id:'travel-backpack',name:'Travel Backpack',slots:['backpack'],value:6,level:4,stats:{},description:'Adds 6 slots to the shared inventory.'},
    {id:'large-backpack',name:'Large Backpack',slots:['backpack'],value:8,level:8,stats:{},description:'Adds 8 slots. Your companions may now overpack collectively.'},
    {id:'simple-belt',name:'Simple Belt',slots:['belt'],value:1,stats:{},description:'Adds 1 shared inventory slot. Also holds up trousers.'},
    {id:'utility-belt',name:'Utility Belt',slots:['belt'],value:2,level:5,stats:{},description:'Adds 2 shared inventory slots.'},
    {id:'borrowed-courage',name:'Borrowed Courage',slots:['heart'],level:12,stats:{maxHp:20,maxStamina:10},description:'A little extra heart, recovered from someone without one. You feel braver already.'},
    {id:'dark-heart',name:'Dark Heart',slots:['heart'],level:20,stats:{maxHp:-50,maxStamina:-50,attack:200},description:'What sacrifices are you willing to make for power?'},
    {id:'epic-cape',name:'Epic Cape',slots:['cape'],stats:{attack:5,defense:5,cooldown:-1,maxHp:10,maxStamina:5,accuracy:5,crit:5},description:'Somehow this cape improves all stats, but by great capes comes great washing responsibility.'}
  ];
  const byId = Object.fromEntries(items.map(item=>[item.id,item]));
  function validateShopItem(item) {
    const stats=['attack','defense','accuracy','crit','critDamage','cooldown','maxHp','maxStamina'];
    if(!item||typeof item.id!=='string'||!/^shop-[a-z0-9-]+$/.test(item.id)||typeof item.name!=='string'||!item.name.trim()||!Array.isArray(item.slots)||!item.slots.length||item.slots.some(slot=>!slots[slot])||!item.stats||typeof item.stats!=='object'||Array.isArray(item.stats))throw Error('Invalid shop equipment definition.');
    if(Object.entries(item.stats).some(([key,value])=>!stats.includes(key)||!Number.isFinite(value)||Math.abs(value)>1000))throw Error(`Invalid equipment bonuses: ${item.name}`);
    if(item.classes&&(!Array.isArray(item.classes)||!item.classes.length||item.classes.some(id=>!['silux','lyra','grond','patch'].includes(id))))throw Error(`Invalid equipment classes: ${item.name}`);
    if(item.level!==undefined&&(!Number.isInteger(item.level)||item.level<1||item.level>20))throw Error(`Invalid equipment level: ${item.name}`);
    if(item.hands!==undefined&&item.hands!==2)throw Error(`Invalid hand requirement: ${item.name}`);
    if(item.hands===2&&!item.slots.includes('weapon'))throw Error('Two-handed equipment must be a weapon.');
    if(item.weaponType&&!['Big Sword','Healing Staff'].includes(item.weaponType))throw Error(`Invalid weapon type: ${item.name}`);
    if(item.slots.includes('backpack')&&(!Number.isInteger(item.value)||item.value<4||item.value>8))throw Error('Backpacks must add 4–8 slots.');
    if(item.slots.includes('belt')&&(!Number.isInteger(item.value)||item.value<0||item.value>2))throw Error('Belts must add 0–2 slots.');
    return item;
  }
  function registerShopItems(definitions) {
    if(!Array.isArray(definitions))throw Error('Invalid saved shop equipment.');
    definitions.forEach(validateShopItem);
    for(const definition of definitions){const item=JSON.parse(JSON.stringify(definition)),index=items.findIndex(existing=>existing.id===item.id);if(index<0)items.push(item);else items[index]=item;byId[item.id]=item;}
  }
  function starting(id,weapon) {
    return {weapon,offhand:null,head:null,torso:{silux:'Worn Shirt',lyra:'Travel Robe',grond:'Padded Armor',patch:'Clerical Robe'}[id],legs:id==='silux'?'Old Trousers':null,feet:{silux:'Leather Shoes',lyra:'Soft Boots',grond:'Work Boots',patch:'Sandals'}[id],ring1:null,ring2:null,cape:null,backpack:4,belt:0,heart:null};
  }
  function itemInSlot(hero,slot) {
    const exact=byId[hero.equipment?.itemIds?.[slot]];
    if(exact&&exact.slots.includes(slot))return exact;
    const value=hero.equipment?.[slot];
    return items.find(item=>item.slots.includes(slot)&&(slot==='backpack'||slot==='belt'?item.value===value:item.name===value))||null;
  }
  function bonuses(hero) {
    const total={};for(const slot of Object.keys(slots)){const item=itemInSlot(hero,slot);if(item)for(const [stat,n] of Object.entries(item.stats))total[stat]=(total[stat]||0)+n;}return total;
  }
  function slotReason(state,slot) {
    if(slot==='cape'&&!state.completed.includes('countryside-2'))return 'Defeat Giant Happy Flower in Countryside 2 to unlock Cape slots.';
    if(slot==='heart'&&!state.completed.includes('castle-2'))return 'Defeat the Lich in Castle 2 to unlock the Heart slot.';
    return '';
  }
  function reason(state,hero,slot,item) {
    if(!slots[slot])return 'Unknown equipment slot.';
    const locked=slotReason(state,slot);if(locked)return locked;
    if(slot==='offhand'&&itemInSlot(hero,'weapon')?.hands===2)return 'Your weapon occupies both hands. Change Hand 1 first.';
    if(!item)return '';
    if(!item.slots.includes(slot))return 'This item does not fit this slot.';
    if(item.classes&&!item.classes.includes(hero.id))return 'This hero cannot use this equipment.';
    if(item.boss&&!state.completed.includes(item.boss))return `Complete ${item.boss.replace('-', ' ')} to unlock this equipment.`;
    const level=Math.min(20,Math.floor(Math.sqrt(hero.xp/100))+1);
    if(level<(item.level||1))return `Requires level ${item.level}.`;
    return '';
  }
  function describe(item) {
    if(!item)return 'No equipment bonuses.';
    const labels={attack:'Attack',defense:'Defense',accuracy:'Accuracy',crit:'Critical Chance',critDamage:'Critical Damage',cooldown:'Action Cooldown',maxHp:'maximum HP',maxStamina:'maximum Stamina'};
    const bonuses=Object.entries(item.stats).map(([stat,value])=>`${value>0?'+':''}${value}${['defense','accuracy','crit','critDamage'].includes(stat)?'%':''} ${labels[stat]}`);
    if(item.value)bonuses.push(`+${item.value} shared inventory slots`);
    if(item.hands===2)bonuses.push('Two-handed');
    return bonuses.join(' · ')||'No stat bonuses';
  }
  function hasWeaponType(hero,type){const item=itemInSlot(hero,'weapon');return item?.weaponType===type||item?.name===type;}
  const api={slots,items,byId,starting,itemInSlot,bonuses,slotReason,reason,describe,validateShopItem,registerShopItems,hasWeaponType};
  root.SiluxEquipment=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
