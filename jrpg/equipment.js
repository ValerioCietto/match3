(function (root) {
  'use strict';
  const slots = {
    weapon: 'Hand 1', offhand: 'Hand 2', head: 'Head', torso: 'Torso',
    legs: 'Legs', feet: 'Feet', ring1: 'Ring 1', ring2: 'Ring 2',
    cape: 'Cape', backpack: 'Backpack', belt: 'Belt', heart: 'Heart'
  };
  const items = [
    {id:'rusty-sword',name:'Rusty Sword',slots:['weapon'],classes:['silux','grond'],stats:{attack:2},description:'Chosen by the village budget committee.'},
    {id:'dagger',name:'Dagger',slots:['weapon'],classes:['lyra','silux'],stats:{},description:'For secrets best delivered at close range.'},
    {id:'heavy-axe',name:'Heavy Axe',slots:['weapon'],classes:['grond'],stats:{},description:'Grond considers this a conversational aid.'},
    {id:'walking-stick',name:'Walking Stick',slots:['weapon'],classes:['patch','lyra'],stats:{},description:'The basic plan. Miracles billed separately.'},
    {id:'big-sword',name:'Big Sword',slots:['weapon'],classes:['silux','grond'],boss:'desert-2',hands:2,stats:{attack:6,cooldown:2},description:'Occupies both hands. Subtlety sold separately.'},
    {id:'healing-staff',name:'Healing Staff',slots:['weapon'],classes:['lyra','patch'],boss:'mountain-4',stats:{attack:2},description:'Enables staff-dependent healing skills at their required levels.'},
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
    {id:'borrowed-courage',name:'Borrowed Courage',slots:['heart'],level:12,stats:{maxHp:20},description:'A little extra heart, recovered from someone without one.'}
  ];
  const byId = Object.fromEntries(items.map(item=>[item.id,item]));
  function starting(id,weapon) {
    return {weapon,offhand:null,head:null,torso:{silux:'Worn Shirt',lyra:'Travel Robe',grond:'Padded Armor',patch:'Clerical Robe'}[id],legs:id==='silux'?'Old Trousers':null,feet:{silux:'Leather Shoes',lyra:'Soft Boots',grond:'Work Boots',patch:'Sandals'}[id],ring1:null,ring2:null,cape:null,backpack:4,belt:0,heart:null};
  }
  function itemInSlot(hero,slot) {
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
    if(slot==='offhand'&&itemInSlot(hero,'weapon')?.hands===2)return 'Your Big Sword occupies both hands. Change Hand 1 first.';
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
  const api={slots,items,byId,starting,itemInSlot,bonuses,slotReason,reason,describe};
  root.SiluxEquipment=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
