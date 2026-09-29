(() => {
  'use strict';
  const $=id=>document.getElementById(id),G=SiluxGame,E=SiluxEndGame;
  const endingKey='true ending unlocked';
  let saved,battle,timer,pending=false,experienced=false;
  function unlocked(){try{return localStorage.getItem(endingKey)==='true';}catch{return false;}}
  function returnToMap(){
    try{if(experienced)localStorage.setItem(endingKey,'true');location.href='world.html';}
    catch{$('return-error').textContent='Could not save the true ending unlock. Allow browser storage, then try again.';}
  }
  function offerReturn(){clearTimeout(timer);$('return-error').textContent='';$('return-stay').textContent=battle?.outcome?'Stay here':'Keep fighting';if(!$('return-world').open)$('return-world').showModal();}
  function trueEnding(){
    $('story-title').textContent='Congratulations!';
    $('story-copy').replaceChildren(...[
      'You have truly defeated the Dark King’s essence, and you could not really do it without feeling for yourself what it means to experience the darkness.',
      'Now you have become The Light King!',
      'Everybody is happy and Lyra becomes Queen!',
      'Grond the big warrior opens a martial arts school for your barbarians and barbarianettes.',
      'Father Patch becomes the holy Pope of the Light King.',
      'Now go congratulate yourself somewhere else. Silux and Lyra have started kissing and soon they will need some privacy.'
    ].map(text=>node('p',text)));
    const button=node('button','Return to the world map');button.onclick=()=>{location.href='world.html';};$('story-choices').replaceChildren(button);
  }
  function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
  function story(second=false){
    $('story-title').textContent=second?'Twenty years later':'The dark heart';
    const paragraphs=second?[
      'As you put the dark heart above your chest, a dark wave of energy blasts from you and kills all your teammates.',
      'Your appearance changes. You have become the Dark Lord.',
      '20 years pass and an adventurer team comes to your door.',
      'Maybe they can break the cycle?',
      'They attack you.'
    ]:[
      'After defeating the Dark King, you realize he has messed up the fabric of reality so much that you either have to take his place as Dark King or everyone, including you, will die.',
      'The dark heart of the defeated Dark King speaks to you in your mind:',
      'PUT ME OVER YOUR CHEST OR EVERYBODY WILL DIE'
    ];
    $('story-copy').replaceChildren(...paragraphs.map(text=>node('p',text)));
    $('story-choices').replaceChildren();
    for(let i=0;i<(second?1:2);i++){const refuse=!second&&i===1&&unlocked();const button=node('button',second?'BATTLE':refuse?'No thank you':'DO AS THE HEART SAYS');button.onclick=()=>{if(refuse)trueEnding();else if(second){$('story').close();start();}else story(true);};$('story-choices').append(button);}
    if(!$('story').open)$('story').showModal();
  }
  function start(){clearTimeout(timer);battle=new E.Reversal(saved);pending=false;$('restart').close();$('battle').hidden=false;$('epilogue').hidden=true;render();pump();}
  function command(action,target){try{battle.command(action,target);experienced=true;pending=false;render();pump();}catch(e){$('prompt').textContent=e.message;}}
  function render(){
    const yours=battle.actor()===battle.lord&&!battle.outcome;
    $('clock').textContent=`Timeline · ${battle.time}t`;
    $('prompt').textContent=pending?'Choose a hero to attack.':yours?'Your turn. The world waits.':battle.outcome?'The battle is over.':'The heroes are acting…';
    $('heroes').replaceChildren();
    battle.allies.forEach((hero,i)=>{
      const card=node('button');card.className=`unit${hero.hp<=0?' ko':''}${pending&&hero.hp>0?' target':''}${battle.actor()===hero?' active':''}`;
      card.disabled=!pending||!yours||hero.hp<=0;card.onclick=()=>command('attack',hero.id);
      card.append(node('strong',hero.name),node('small','Level 20'));
      const canvas=node('canvas');canvas.width=300;canvas.height=200;canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');
      if(ctx){ctx.translate(150,170);ctx.scale(1.8,1.8);SiluxEnemyArt.draw(ctx,{shape:'humanoid',color:['#88a5be','#bb94bd','#bba486','#b5c39f'][i]});}card.append(canvas);
      card.append(node('small',`${Math.ceil(hero.hp)} / ${hero.maxHp} HP · ${hero.hp<=0?'KO':`${hero.stamina.toFixed(0)} Stamina`}`));
      const hp=node('progress');hp.max=hero.maxHp;hp.value=hero.hp;hp.setAttribute('aria-label',`${hero.name} health`);card.append(hp);
      card.append(node('small',`ATK ${hero.attack} · DEF ${hero.defense}% · ACC ${hero.accuracy}% · ${hero.cooldown}t`));
      if(pending&&hero.hp>0)card.append(node('small',`${battle.damageAmount(battle.lord,hero)} damage · ${battle.lord.accuracy}% accuracy (before Dodge or interception)`));
      $('heroes').append(card);
    });
    const hp=node('progress');hp.max=battle.lord.maxHp;hp.value=battle.lord.hp;hp.setAttribute('aria-label','Dark Lord health');
    $('lord').replaceChildren(node('p',`${Math.ceil(battle.lord.hp)} / ${battle.lord.maxHp} HP · Attack ${battle.lord.attack} · Defense ${battle.lord.defense}%`),hp);
    $('skeletons').textContent=battle.enemies.filter(e=>e!==battle.lord&&e.hp>0).map(e=>`${e.name}: ${e.hp} HP`).join(' · ')||'No skeletons summoned.';
    $('commands').replaceChildren();
    for(const [id,action] of Object.entries(E.actions)){const button=node('button',action.name);button.append(node('small',action.description));button.disabled=!yours||(id==='summon'&&battle.enemies.filter(e=>e!==battle.lord&&e.hp>0).length>=3);button.onclick=()=>{if(id==='attack'){const targets=battle.living('ally');if(targets.length===1)command(id,targets[0].id);else{pending=true;render();}}else command(id);};$('commands').append(button);}
    $('cancel').hidden=!pending;
    $('log').replaceChildren(...battle.logs.slice(-60).map(entry=>node('p',`T ${entry.time} · ${entry.message}`)));$('log').scrollTop=$('log').scrollHeight;
  }
  function pump(){
    clearTimeout(timer);
    if($('return-world').open)return;
    if(battle.outcome==='ending'){$('battle').hidden=true;$('epilogue').hidden=false;offerReturn();return;}
    if(battle.outcome==='restart'){$('restart').showModal();return;}
    if(battle.actor()===battle.lord)return;
    timer=setTimeout(()=>{if(document.hidden){pump();return;}if(battle.actor())battle.autoAct();else battle.tick();render();pump();},battle.actor()?450:65);
  }
  $('cancel').onclick=()=>{pending=false;render();};$('restart-battle').onclick=start;
  $('return-confirm').onclick=returnToMap;
  $('return-stay').onclick=()=>{$('return-world').close();if(battle&&!battle.outcome)pump();};
  $('restart-return').onclick=offerReturn;
  document.querySelectorAll('a[href="world.html"]').forEach(link=>link.addEventListener('click',event=>{if(experienced){event.preventDefault();offerReturn();}}));
  $('return-world').addEventListener('cancel',event=>{event.preventDefault();$('return-stay').click();});
  for(const id of ['story','restart'])$(id).addEventListener('cancel',event=>event.preventDefault());
  window.addEventListener('pagehide',()=>clearTimeout(timer));
  window.addEventListener('pageshow',event=>{if(event.persisted&&battle)pump();});
  try{saved=G.load();if(!saved.completed.includes('final-1'))throw Error('Defeat the Dark King on the world map to unlock The End?.');story();}
  catch(e){$('error').hidden=false;$('error').textContent=e.message;}
})();
