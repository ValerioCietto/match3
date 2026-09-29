(function(root){
  'use strict';
  const G=root.SiluxGame||(typeof require!=='undefined'?require('./game.js'):null);
  const E=root.SiluxEquipment||(typeof require!=='undefined'?require('./equipment.js'):null);
  const skills={
    strong:{name:'Dramatic Entry',cost:10,level:1,kind:'entry',random:true,once:true,description:'Once per battle: 150% damage to a random enemy, or 200% to all enemies with a Big Sword equipped.'},
    double:{name:'Ignorant Attack',cost:15,level:1,kind:'randomHits',random:true,hits:2,description:'Two attacks against independently random living enemies, then cleanse your debuffs.'},
    piercer:{name:'Heart-piercer',cost:20,level:1,kind:'hit',crit:80,critDamage:500,description:'80% critical chance, 500% critical damage.'},
    wind:{name:'Heroic Second Wind',cost:10,level:5,kind:'heal',self:true,heal:.3,cancelDodge:true,description:'Heal yourself for 30% maximum HP. Cancels Dodge.'},
    training:{name:'Mandatory Training Arc',cost:15,level:10,kind:'training',self:true,description:'Next two basic attacks deal 150% damage.'},
    flurry:{name:'Flurry of Normal Attacks',cost:30,level:20,weapon:'Big Sword',kind:'flurry',description:'30 attacks on random enemies, 80% damage, 75% accuracy.'},
    precision:{name:'Slay like a Queen',cost:5,level:1,kind:'hit',accuracy:100,cooldown:2,description:'100% accuracy; next action in 2t instead of your normal cooldown. Targets can still Dodge.'},
    foreshadow:{name:'Regal Intimidation',cost:10,level:1,kind:'intimidate',all:true,once:true,description:'Once per battle: delay all enemy actions by 20t and increase their cooldowns by 20t for this battle.'},
    armor:{name:'Plot Armor',cost:1,level:6,kind:'rescue',ally:true,once:true,description:'Once per battle: revive one KOed ally to 1 HP, then fully heal them. Also fully heals a living ally.'},
    footnote:{name:'Friendship Power',cost:15,level:10,weapon:'Healing Staff',kind:'heal',all:true,heal:.1,cleanse:true,description:'Heal all living allies by 10% maximum HP and remove their debuffs.'},
    overHeal:{name:'Overpowered Healing',cost:40,level:20,kind:'revive',all:true,once:true,attackAll:true,description:'Once per battle: revive and fully heal all allies, deal 100% attack damage to all enemies, and Bless all allies for 20t.'},
    heavy:{name:'Heavy Swing',cost:10,level:1,kind:'hit',power:1.75,description:'175% attack damage.'},
    guard:{name:'Stand Behind Me',cost:10,level:1,kind:'guard',ally:true,description:'Intercept attacks on one ally for 20 timeline units.'},
    sweep:{name:'Unreasonably Large Swing',cost:18,level:8,kind:'hit',all:true,power:.75,description:'Attack every enemy for 75% normal damage.'},
    structural:{name:'Structural Damage',cost:20,level:14,kind:'hit',power:2,pierce:.5,description:'200% damage; ignore half of Defense.'},
    berserk:{name:'BERSERK',cost:30,level:20,weapon:'Big Sword',kind:'berserk',all:true,description:'Hit every enemy. Double damage for the rest of battle.'},
    miracle:{name:'Minor Miracle',cost:8,level:1,kind:'heal',ally:true,heal:.35,description:'Heal a living ally for 35% maximum HP.'},
    terms:{name:'Terms and Conditions',cost:6,level:1,kind:'cleanse',ally:true,description:'Remove one negative status. Cancels Dodge.'},
    therapy:{name:'Group Therapy',cost:20,level:10,kind:'heal',all:true,heal:.25,description:'Heal all living allies for 25% maximum HP.'},
    coverage:{name:'Extended Coverage',cost:18,level:14,weapon:'Healing Staff',kind:'heal',ally:true,heal:.7,description:'Heal one living ally for 70% maximum HP.'},
    doubleEdge:{name:'Overpowered Double Edge',cost:30,level:20,weapon:'Healing Staff',kind:'revive',all:true,edge:true,description:'Revive and fully heal allies, then deal total HP restored to every enemy.'}
  };
  const heroSkills={silux:['strong','double','piercer','wind','training','flurry'],lyra:['precision','foreshadow','armor','footnote','overHeal'],grond:['heavy','guard','sweep','structural','berserk'],patch:['miracle','terms','therapy','coverage','doubleEdge']};
  const itemInfo={'healing-potion':{name:'Healing Potion',description:'Restore 50% of a living ally’s maximum HP.'},'stamina-potion':{name:'Stamina Potion',description:'Restore a living ally’s Stamina completely.'}};
  function validate(data){
    if(data?.version!==1||!data.enemies||!Array.isArray(data.battles))throw Error('Unsupported encounter data.');
    const ids=new Set();
    for(const b of data.battles){
      if(!G.validBattle(b.id)||ids.has(b.id)||typeof b.name!=='string'||b.region!==b.id.split('-')[0]||!Array.isArray(b.enemies)||b.enemies.length<1||b.enemies.length>8)throw Error('Invalid or duplicate battle.');
      ids.add(b.id);
      for(const id of b.enemies){const e=data.enemies[id];if(!e||typeof e.name!=='string')throw Error(`Unknown enemy: ${id}`);
        for(const stat of ['hp','attack','defense','accuracy','cooldown','xp','gold'])if(!Number.isFinite(e[stat])||e[stat]<(stat==='defense'?-100:0))throw Error(`Invalid ${stat}: ${id}`);
        if(e.hp<1||e.cooldown<1||e.defense>100||e.accuracy>100)throw Error(`Invalid combat stats: ${id}`);
        if(e.special&&(!Number.isInteger(e.special.every)||e.special.every<1||!Number.isFinite(e.special.multiplier)||e.special.multiplier<0||typeof e.special.name!=='string'))throw Error(`Invalid special: ${id}`);
        if(e.special){const s=e.special;
          if(!['hit','drain','heal','steal','wait','poison'].includes(s.kind||'hit'))throw Error(`Invalid special kind: ${id}`);
          for(const field of ['heal','gold','goldFraction','selfDamage','poisonDamage','duration'])if(s[field]!==undefined&&(!Number.isFinite(s[field])||s[field]<0))throw Error(`Invalid special ${field}: ${id}`);
          if(s.kind==='heal'&&!(s.heal>0)||s.kind==='steal'&&!(s.gold>0||s.goldFraction>0)||s.goldFraction>1||s.kind==='poison'&&(!(s.poisonDamage>0)||!Number.isInteger(s.duration)||s.duration<1))throw Error(`Invalid special effect: ${id}`);
        }
        if(!Array.isArray(e.loot)||e.loot.some(l=>typeof l.id!=='string'||typeof l.name!=='string'||!Number.isFinite(l.chance)||l.chance<0||l.chance>1||!Number.isInteger(l.quantity)||l.quantity<1))throw Error(`Invalid loot: ${id}`);
      }
      if(Boolean(b.boss)!==b.enemies.some(id=>data.enemies[id].boss))throw Error(`Boss flag mismatch: ${b.id}`);
    }
    const expected=Object.values(G.regions).reduce((n,r)=>n+r.count,0);if(ids.size!==expected)throw Error('Encounter data must cover the entire journey.');
    return data;
  }
  class Battle {
    constructor(state,encounter,data,random=Math.random){
      if(!G.available(state,encounter.id))throw Error('This battle is still locked. Complete its preceding battles first.');
      this.state=G.clone(state);this.encounter=encounter;this.random=random;this.time=0;this.outcome=null;this.logs=[];this.loot=[];this.xp=0;this.gold=0;
      this.allies=this.state.heroes.map((h,i)=>({...G.stats(h),id:h.id,side:'ally',order:i,hp:h.hp,stamina:h.stamina,next:encounter.ambush?G.stats(h).cooldown:0,dodgeUntil:0,blessUntil:0,turns:0,source:h}));
      this.enemies=encounter.enemies.map((id,i)=>{const e=data.enemies[id];return {...G.clone(e),id:`enemy-${i}`,type:id,side:'enemy',order:10+i,maxHp:e.hp,crit:5,critDamage:150,next:encounter.ambush?0:e.cooldown,dodgeUntil:0,blessUntil:0,turns:0};});
      this.log(encounter.intro||encounter.name);if(encounter.ambush)this.log('AMBUSH — enemies have the initial initiative.');
    }
    log(message){this.logs.push({time:this.time,message});}
    units(){return [...this.allies,...this.enemies];}
    living(side){return (side==='ally'?this.allies:this.enemies).filter(u=>u.hp>0);}
    queue(){return this.units().filter(u=>u.hp>0).sort((a,b)=>a.next-b.next||a.order-b.order);}
    actor(){if(this.outcome)return null;return this.queue().find(u=>u.next<=this.time)||null;}
    tick(){
      if(this.outcome||this.actor())return false;
      const next=this.queue()[0];if(!next)return false;
      const dt=Math.min(1,next.next-this.time);this.time+=dt;
      for(const ally of this.allies)ally.stamina=Math.min(ally.maxStamina,ally.stamina+dt*.1);
      for(const unit of this.units()){
        const poison=unit.poison;
        if(!poison||unit.hp<=0)continue;
        while(poison.next<=this.time&&poison.next<=poison.until&&unit.hp>0){
          this.loseHp(unit,poison.damage,'Poison');poison.next++;
        }
        if(this.time>=poison.until)unit.poison=null;
      }
      this.checkOutcome();
      return true;
    }
    skillList(actor){return (heroSkills[actor.id]||[]).map(id=>({id,...skills[id]}));}
    skillReason(actor,s){if(s.once&&actor.usedSkills?.includes(s.name))return 'Already used this battle';if(actor.level<s.level)return `Level ${s.level}`;if(s.weapon&&!E.hasWeaponType(actor.source,s.weapon))return `Equip ${s.weapon}`;if(actor.stamina+1e-8<s.cost)return `${s.cost} Stamina required`;return '';}
    targets(action,actor){
      if(action==='attack')return this.living('enemy');
      if(action.startsWith('item:'))return this.living('ally');
      const s=skills[action];if(!s)return [];
      if(s.kind==='rescue')return this.allies;
      if(s.self)return [actor];if(s.all||s.random||s.kind==='flurry')return [];
      return this.living(s.ally?'ally':'enemy').filter(u=>s.kind!=='guard'||u!==actor);
    }
    plan(enemy){
      if(enemy.intent&&this.allies.some(a=>a.id===enemy.intent.target&&a.hp>0))return enemy.intent;
      const targets=this.living('ally'),special=enemy.special&&(enemy.turns+1)%enemy.special.every===0?enemy.special:null;
      enemy.intent={target:targets[Math.floor(this.random()*targets.length)]?.id,name:special?.name||'Attack',special};return enemy.intent;
    }
    damage(attacker,target,options={}){
      if(target.hp<=0)return 0;
      let victim=target;
      if(target.side==='ally'&&!options.all){const guard=this.allies.find(a=>a.hp>0&&a.guardTarget===target.id&&a.guardUntil>this.time);if(guard){victim=guard;this.log(`${guard.name} intercepts the attack on ${target.name}.`);}}
      if(!options.sure&&(this.random()*100>=(options.accuracy??attacker.accuracy)||(victim.dodgeUntil>this.time&&this.random()<.9))){this.log(`${attacker.name} misses ${victim.name}.`);return 0;}
      const critical=!options.flat&&this.random()*100<(options.crit??attacker.crit??0);
      let raw=options.flat??attacker.attack*(options.power??1)*(attacker.berserk?2:1)*(critical?(options.critDamage??attacker.critDamage)/100:1);
      if(options.flat===undefined)raw*=1-victim.defense*(1-(options.pierce||0))/100;
      if(victim.blessUntil>this.time)raw*=.75;
      const amount=options.flat===0?0:Math.max(1,Math.round(raw)),dealt=Math.min(victim.hp,amount);victim.hp=Math.max(0,victim.hp-amount);
      this.log(`${attacker.name} → ${victim.name}: ${amount} damage${critical?' · CRITICAL':''}.`);
      if(victim.hp===0){this.log(`${victim.name} is ${victim.side==='ally'?'KOed':'defeated'}.`);if(victim.side==='enemy')this.reward(victim);}
      if(victim.hp===0)victim.poison=null;
      return dealt;
    }
    loseHp(unit,amount,label){
      if(unit.hp<=0)return;
      unit.hp=Math.max(0,unit.hp-amount);this.log(`${label}: ${unit.name} loses ${amount} HP.`);
      if(unit.hp===0){unit.poison=null;this.log(`${unit.name} is ${unit.side==='ally'?'KOed':'defeated'}.`);if(unit.side==='enemy')this.reward(unit);}
    }
    restoreHp(unit,amount){
      if(unit.hp<=0)return;
      const restored=Math.min(unit.maxHp-unit.hp,amount);unit.hp+=restored;this.log(`${unit.name} restores ${restored} HP.`);
    }
    reward(enemy){
      if(enemy.rewarded)return;enemy.rewarded=true;this.xp+=enemy.xp;this.gold+=enemy.gold;this.state.gold+=enemy.gold;
      for(const ally of this.allies){const previous=ally.level;ally.source.xp+=enemy.xp;Object.assign(ally,G.stats(ally.source));if(ally.level>previous)this.log(`${ally.name} reaches level ${ally.level}!`);}
      for(const drop of enemy.loot)if(this.random()<drop.chance)this.loot.push({id:drop.id,name:drop.name,quantity:drop.quantity});
      this.log(`+${enemy.xp} XP to every hero · +${enemy.gold} Gold.`);
    }
    heal(target,fraction){if(target.hp<=0)return 0;const amount=Math.min(target.maxHp-target.hp,Math.ceil(target.maxHp*fraction));target.hp+=amount;this.log(`${target.name} restores ${amount} HP.`);return amount;}
    cleanse(target){target.poison=null;target.negativeStatus=null;this.log(`${target.name} is free of removable negative statuses.`);}
    act(action,targetId){
      const a=this.actor();if(!a||a.side!=='ally')throw Error('Wait for an ally’s turn.');
      const target=this.units().find(u=>u.id===targetId),s=skills[action],isItem=action.startsWith('item:');
      if(!['attack','dodge'].includes(action)&&!s&&!isItem)throw Error('Unknown action.');
      if(s&&(!heroSkills[a.id].includes(action)||this.skillReason(a,s)))throw Error(s?this.skillReason(a,s)||'Skill unavailable.':'Skill unavailable.');
      const valid=this.targets(action,a);if(valid.length&&!valid.includes(target))throw Error(s?.kind==='rescue'?'Choose an ally, living or KOed.':'Choose a living valid target.');
      if(s?.kind==='guard'&&!valid.length)throw Error('No living ally to protect.');
      const itemId=isItem?action.slice(5):null,stack=isItem?this.state.inventory.find(i=>i.id===itemId&&i.quantity>0):null;
      if(isItem&&(!itemInfo[itemId]||!stack))throw Error('That item is not available.');
      if(s){a.stamina=Math.max(0,a.stamina-s.cost);if(s.once)(a.usedSkills??=[]).push(s.name);}
      if(action==='attack'||s?.cancelDodge||(s&&!['heal','revive','rescue'].includes(s.kind)))a.dodgeUntil=0;
      this.log(`${a.name} uses ${s?.name||itemInfo[itemId]?.name||action}.`);
      if(action==='dodge')a.dodgeUntil=this.time+20;
      else if(action==='attack'){this.damage(a,target,{power:a.training>0?1.5:1});if(a.training>0)a.training--;}
      else if(isItem){if(itemId==='healing-potion')this.heal(target,.5);else{target.stamina=target.maxStamina;this.log(`${target.name} restores all Stamina.`);}stack.quantity--;this.state.inventory=this.state.inventory.filter(i=>i.quantity>0);}
      else if(s.kind==='hit'){const targets=s.all?this.living('enemy'):[target];for(const victim of targets)for(let i=0;i<(s.hits||1);i++)this.damage(a,victim,{...s});}
      else if(s.kind==='entry'){
        const live=this.living('enemy'),big=E.hasWeaponType(a.source,'Big Sword');
        for(const victim of big?live:[live[Math.floor(this.random()*live.length)]])this.damage(a,victim,{power:big?2:1.5,all:big});
      }
      else if(s.kind==='randomHits'){
        for(let i=0;i<s.hits&&this.living('enemy').length;i++){const live=this.living('enemy');this.damage(a,live[Math.floor(this.random()*live.length)]);}
        this.cleanse(a);
      }
      else if(s.kind==='heal'){for(const ally of s.all?this.living('ally'):s.self?[a]:[target]){this.heal(ally,s.heal);if(s.cleanse)this.cleanse(ally);}}
      else if(s.kind==='intimidate'){for(const enemy of this.living('enemy')){enemy.cooldown+=20;enemy.next+=20;}this.log('All enemy cooldowns and next actions increase by 20t.');}
      else if(s.kind==='rescue'){if(target.hp===0){target.hp=1;target.next=this.time+target.cooldown;}this.restoreHp(target,target.maxHp);}
      else if(s.kind==='training')a.training=2;
      else if(s.kind==='bless')target.blessUntil=this.time+20;
      else if(s.kind==='guard'){a.guardTarget=target.id;a.guardUntil=this.time+20;}
      else if(s.kind==='cleanse')this.cleanse(target);
      else if(s.kind==='reveal'){const intent=this.plan(target);target.revealed=true;this.log(`${target.name} plans ${intent.name} → ${intent.special?.all?'all allies':this.allies.find(h=>h.id===intent.target)?.name}.`);}
      else if(s.kind==='flurry'){for(let i=0;i<30&&this.living('enemy').length;i++){const live=this.living('enemy');this.damage(a,live[Math.floor(this.random()*live.length)],{power:.8,accuracy:75});}}
      else if(s.kind==='berserk'){for(const victim of this.living('enemy'))this.damage(a,victim,{sure:true,all:true});a.berserk=true;}
      else if(s.kind==='revive'){let healed=0;for(const ally of this.allies){healed+=ally.maxHp-ally.hp;if(ally.hp===0)ally.next=this.time+ally.cooldown;ally.hp=ally.maxHp;if(!s.edge)ally.blessUntil=this.time+20;}this.log(`The party restores ${healed} HP.`);if(s.edge)for(const victim of this.living('enemy'))this.damage(a,victim,{flat:healed,sure:true,all:true});if(s.attackAll)for(const victim of this.living('enemy'))this.damage(a,victim,{power:1,all:true});}
      a.next=this.time+(s?.cooldown??a.cooldown);a.turns++;this.checkOutcome();
    }
    enemyAct(){
      const a=this.actor();if(!a||a.side!=='enemy')return;
      const intent=this.plan(a),s=intent.special,targets=s?.all?this.living('ally'):[this.allies.find(h=>h.id===intent.target)];
      this.log(`${a.name} uses ${intent.name}.`);
      const kind=s?.kind||'hit';
      if(kind==='heal')this.restoreHp(a,s.heal);
      else if(kind==='steal'){
        const lost=Math.min(this.state.gold,s.goldFraction?Math.ceil(this.state.gold*s.goldFraction):s.gold);
        this.state.gold-=lost;this.gold-=lost;this.log(`The party loses ${lost} Gold.`);
      }else if(kind==='wait')this.log(`${a.name} does nothing.`);
      else if(kind==='poison'){
        for(const victim of targets)if(victim?.hp>0){
          victim.poison={damage:s.poisonDamage,until:this.time+s.duration,next:victim.poison?.next??this.time+1};
          this.log(`${victim.name} is poisoned: ${s.poisonDamage} HP per timeline unit for ${s.duration}t.`);
        }
      }else{
        let dealt=0;
        for(const victim of targets)if(victim)dealt+=this.damage(a,victim,{power:s?.multiplier??1,all:Boolean(s?.all)});
        if(kind==='drain')this.restoreHp(a,dealt);
        if(s?.selfDamage)this.loseHp(a,s.selfDamage,s.name);
      }
      a.turns++;a.next=this.time+a.cooldown;a.intent=null;a.revealed=false;this.checkOutcome();
    }
    checkOutcome(){if(!this.living('enemy').length)this.outcome='victory';else if(!this.living('ally').length)this.outcome='defeat';}
    finish(){
      if(this.outcome!=='victory')throw Error('Only victories can be saved.');if(this.result)return this.result;
      for(const ally of this.allies){ally.source.hp=ally.hp>0?ally.hp:Math.ceil(ally.maxHp/2);ally.source.stamina=ally.stamina;}
      const firstClear=!this.state.completed.includes(this.encounter.id);if(firstClear)this.state.completed.push(this.encounter.id);
      this.state.selected=this.encounter.region;
      if(this.encounter.id==='final-1')this.state.darkKingParty=G.clone(this.state.heroes);
      G.recruit(this.state);if(this.encounter.boss)G.rest(this.state);
      const dropped=G.addLoot(this.state,this.loot);
      this.result={state:this.state,dropped,firstClear,xp:this.xp,gold:this.gold,loot:this.loot};return this.result;
    }
  }
  const api={Battle,skills,heroSkills,itemInfo,validate};root.SiluxCombat=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
