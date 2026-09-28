/* Shared save and character rules. No combat changes are saved until victory. */
(function (root) {
  'use strict';
  const KEY = 'silux.journey.v1';
  const regions = {
    sewers: {count:3,requires:[]}, countryside:{count:2,requires:['sewers-3']},
    city:{count:3,requires:['countryside-2']}, desert:{count:2,requires:['city-3']},
    swamp:{count:2,requires:['city-3']}, mountain:{count:4,requires:['desert-2','swamp-2'],any:true},
    castle:{count:2,requires:['mountain-4']}, final:{count:1,requires:['castle-2']}
  };
  const roster = {
    silux:{name:'Silux',hp:50,attack:10,defense:5,accuracy:90,crit:10,critDamage:120,cooldown:10,stamina:30,hpGrowth:8,attackGrowth:2,staminaGrowth:1,weapon:'Rusty Sword'},
    lyra:{name:'Lyra',hp:40,attack:8,defense:3,accuracy:95,crit:15,critDamage:150,cooldown:8,stamina:30,hpGrowth:6,attackGrowth:1.5,staminaGrowth:2,weapon:'Dagger'},
    grond:{name:'Grond',hp:80,attack:14,defense:10,accuracy:85,crit:5,critDamage:150,cooldown:13,stamina:25,hpGrowth:12,attackGrowth:3,staminaGrowth:1,weapon:'Heavy Axe'},
    patch:{name:'Father Patch',hp:45,attack:6,defense:4,accuracy:90,crit:5,critDamage:120,cooldown:11,stamina:40,hpGrowth:7,attackGrowth:1,staminaGrowth:2,weapon:'Walking Stick'}
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const level = xp => Math.min(20, Math.floor(Math.sqrt(Math.max(0,xp)/100))+1);
  const finite = (v,fallback,min=0,max=1e9) => Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
  function stats(hero) {
    const b=roster[hero.id],l=level(hero.xp)-1;
    const weapon=hero.equipment?.weapon,bonus=weapon==='Big Sword'?6:weapon==='Healing Staff'?2:weapon==='Rusty Sword'?2:0;
    return {name:b.name,level:l+1,maxHp:b.hp+b.hpGrowth*l,attack:b.attack+b.attackGrowth*l+bonus,defense:b.defense+(hero.id==='silux'?2:0),accuracy:b.accuracy,crit:b.crit,critDamage:b.critDamage,cooldown:b.cooldown-(hero.id==='silux'?1:0)+(weapon==='Big Sword'?2:0),maxStamina:b.stamina+b.staminaGrowth*l};
  }
  function newHero(id,xp=0) {
    const hero={id,xp,equipment:{weapon:roster[id].weapon,backpack:4,belt:0}};
    const s=stats(hero);return {...hero,hp:s.maxHp,stamina:s.maxStamina};
  }
  function defaults(){return {version:1,completed:[],selected:'sewers',gold:0,inventory:[{id:'healing-potion',name:'Healing Potion',quantity:3},{id:'stamina-potion',name:'Stamina Potion',quantity:1}],heroes:[newHero('silux')]};}
  function validBattle(id){if(typeof id!=='string')return false;const [region,n,...extra]=id.split('-');return !extra.length&&regions[region]&&Number.isInteger(Number(n))&&Number(n)>=1&&Number(n)<=regions[region].count;}
  function available(state,id){
    if(!validBattle(id))return false;
    const [region,n]=id.split('-'),r=regions[region],has=key=>state.completed.includes(key);
    return (r.any?r.requires.some(has):r.requires.every(has))&&(Number(n)===1||has(`${region}-${Number(n)-1}`));
  }
  function recruit(state){
    for(const [boss,id] of [['sewers-3','lyra'],['city-3','grond'],['swamp-2','patch']])
      if(state.completed.includes(boss)&&!state.heroes.some(h=>h.id===id))state.heroes.push(newHero(id,state.heroes[0]?.xp||0));
    return state;
  }
  function normalize(raw){
    const s=defaults();if(raw?.version!==1)return s;
    s.completed=[...new Set((Array.isArray(raw.completed)?raw.completed:[]).filter(validBattle))];
    s.selected=regions[raw.selected]?raw.selected:'sewers';s.gold=finite(raw.gold,0);
    if(Array.isArray(raw.heroes)){
      s.heroes=Object.keys(roster).filter(id=>id==='silux'||s.completed.includes({lyra:'sewers-3',grond:'city-3',patch:'swamp-2'}[id])).map(id=>{
        const old=raw.heroes.find(h=>h?.id===id),h=newHero(id,finite(old?.xp,0));
        if(old){h.equipment={...h.equipment,...old.equipment};h.equipment.backpack=finite(h.equipment.backpack,4,0,8);h.equipment.belt=finite(h.equipment.belt,0,0,2);const st=stats(h);h.hp=finite(old.hp,st.maxHp,0,st.maxHp);h.stamina=finite(old.stamina,st.maxStamina,0,st.maxStamina);}return h;
      });
    }
    if(Array.isArray(raw.inventory))s.inventory=raw.inventory.filter(i=>i&&typeof i.id==='string'&&typeof i.name==='string'&&Number.isInteger(i.quantity)&&i.quantity>0).map(i=>({id:i.id,name:i.name,quantity:Math.min(99,i.quantity)})).slice(0,60);
    if(raw.darkKingParty)s.darkKingParty=clone(raw.darkKingParty);
    return recruit(s);
  }
  function load(storage=root.localStorage){const raw=storage.getItem(KEY);return normalize(raw?JSON.parse(raw):null);}
  function save(state,storage=root.localStorage){storage.setItem(KEY,JSON.stringify(state));}
  function rest(state){for(const hero of state.heroes){const s=stats(hero);hero.hp=s.maxHp;hero.stamina=s.maxStamina;}return state;}
  function capacity(state){return Math.min(60,20+state.heroes.reduce((n,h)=>n+(h.equipment.backpack||0)+(h.equipment.belt||0),0));}
  function addLoot(state,items){
    const dropped=[];
    for(const item of items){let remaining=item.quantity;for(const stack of state.inventory.filter(s=>s.id===item.id&&s.quantity<99)){const amount=Math.min(99-stack.quantity,remaining);stack.quantity+=amount;remaining-=amount;}
      while(remaining>0&&state.inventory.length<capacity(state)){const amount=Math.min(99,remaining);state.inventory.push({...item,quantity:amount});remaining-=amount;}
      if(remaining)dropped.push({...item,quantity:remaining});
    }return dropped;
  }
  const api={KEY,regions,roster,clone,level,stats,newHero,defaults,normalize,validBattle,available,recruit,load,save,rest,capacity,addLoot};
  root.SiluxGame=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
