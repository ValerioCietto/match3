(function(root){
  'use strict';
  const G=root.SiluxGame||(typeof require!=='undefined'?require('./game.js'):null);
  const C=root.SiluxCombat||(typeof require!=='undefined'?require('./combat-engine.js'):null);
  const actions={attack:{name:'Attack',description:'Strike one hero for 100% damage. 12t cooldown.'},monologue:{name:'Monologue',description:'Explain the cycle. The heroes keep fighting. 40t cooldown.'},sweep:{name:'Sweep Attack',description:'Strike every living hero for 75% damage. 18t cooldown.'},summon:{name:'Summon skeleton',description:'Summon a skeleton that fights automatically. Up to 3 living skeletons. 12t cooldown.'}};
  class Reversal extends C.Battle{
    constructor(saved,random=Math.random){
      if(!saved.completed.includes('final-1'))throw Error('Defeat the Dark King before entering The End?.');
      const state=G.clone(saved),snapshot=Array.isArray(saved.darkKingParty)?saved.darkKingParty:saved.heroes;
      state.heroes=Object.keys(G.roster).map(id=>{
        const previous=snapshot.find(h=>h.id===id),hero=G.newHero(id,36100);
        if(previous?.equipment)hero.equipment=G.clone(previous.equipment);
        else hero.equipment.weapon=id==='silux'||id==='grond'?'Big Sword':'Healing Staff';
        const stats=G.stats(hero);hero.hp=stats.maxHp;hero.stamina=stats.maxStamina;return hero;
      });
      const lord={name:'Silux, the Dark Lord',hp:1800,attack:160,defense:35,accuracy:95,cooldown:12,xp:0,gold:0,loot:[],boss:true,shape:'humanoid',color:'#ac86c4'};
      super(state,{id:'sewers-1',region:'final',name:'Twenty years later',enemies:['dark-lord']},{enemies:{'dark-lord':lord}},random);
      this.lord=this.enemies[0];this.lord.next=0;this.lord.order=-1;this.summons=0;
      this.log('You occupy the throne. Four familiar faces stand at your door.');
    }
    reward(){} // The reversal never awards or saves campaign rewards.
    checkOutcome(){if(this.enemies[0].hp<=0)this.outcome='ending';else if(!this.living('ally').length)this.outcome='restart';}
    command(action,targetId){
      if(this.actor()!==this.lord)throw Error('Wait for your turn.');
      if(!actions[action])throw Error('Unknown Dark Lord action.');
      const target=this.allies.find(h=>h.id===targetId&&h.hp>0);
      if(action==='attack'&&!target)throw Error('Choose a living hero.');
      if(action==='summon'&&this.enemies.filter(e=>e!==this.lord&&e.hp>0).length>=3)throw Error('Three skeletons already serve you.');
      this.log(`${this.lord.name} uses ${actions[action].name}.`);
      if(action==='attack')this.damage(this.lord,target);
      if(action==='sweep')for(const hero of this.living('ally'))this.damage(this.lord,hero,{power:.75,all:true});
      if(action==='monologue')this.log('“The heart does not save the world. It only chooses who must carry it…” Nobody waits for you to finish.');
      if(action==='summon'){
        const id=++this.summons;
        this.enemies.push({id:`skeleton-${id}`,name:`Skeleton ${id}`,side:'enemy',order:20+id,hp:100,maxHp:100,attack:24,defense:10,accuracy:85,crit:5,critDamage:150,cooldown:14,next:this.time+14,turns:0,dodgeUntil:0,blessUntil:0,shape:'humanoid',color:'#c9c8b6'});
      }
      this.lord.next=this.time+(action==='monologue'?40:action==='sweep'?18:12);this.lord.turns++;this.checkOutcome();
    }
    autoAct(){
      const actor=this.actor();if(!actor||actor===this.lord)return;
      if(actor.side==='enemy'){this.enemyAct();return;}
      const usable=id=>C.heroSkills[actor.id].includes(id)&&!this.skillReason(actor,C.skills[id]);
      const low=this.living('ally').sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
      const ko=this.allies.find(a=>a.hp<=0),enemy=this.living('enemy').sort((a,b)=>a.hp-b.hp)[0];
      if(usable('overHeal')&&(ko||low.hp<low.maxHp*.3))return this.act('overHeal');
      if(usable('armor')&&(ko||low.hp<low.maxHp*.4))return this.act('armor',(ko||low).id);
      if(usable('doubleEdge')&&ko)return this.act('doubleEdge');
      if(usable('miracle')&&low.hp<low.maxHp*.6)return this.act('miracle',low.id);
      if(usable('footnote')&&this.living('ally').some(a=>a.poison||a.hp<a.maxHp*.5))return this.act('footnote');
      if(usable('wind')&&actor.hp<actor.maxHp*.5)return this.act('wind',actor.id);
      if(usable('strong'))return this.act('strong');
      if(usable('precision'))return this.act('precision',enemy.id);
      if(usable('piercer'))return this.act('piercer',enemy.id);
      if(usable('heavy'))return this.act('heavy',enemy.id);
      return this.act('attack',enemy.id);
    }
  }
  const api={Reversal,actions};root.SiluxEndGame=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
