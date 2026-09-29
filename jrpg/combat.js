'use strict';
const G=SiluxGame,C=SiluxCombat,$=id=>document.getElementById(id);
const battleId=new URLSearchParams(location.search).get('battle')||'sewers-1';
let battle=null,mode=null,pending=null,timer=null,finished=false,savedVictory=false,drawTargets=[];
const scene=$('scene'),ctx=scene.getContext('2d');
function error(message,allowFile=false){$('loading').hidden=true;$('game').hidden=true;$('error').hidden=false;$('error-copy').textContent=message;$('local-file').hidden=!allowFile;}
function init(data){
  try{
    C.validate(data);const encounter=data.battles.find(b=>b.id===battleId);if(!encounter)throw Error('This encounter does not exist. Choose a battle from the world map.');
    const state=G.load();battle=new C.Battle(state,encounter,data);
    $('loading').hidden=true;$('error').hidden=true;$('game').hidden=false;$('battle-name').textContent=encounter.name;
    document.title=`${encounter.name} — Silux`;$('encounter-type').textContent=`${encounter.boss?'Boss encounter':'Battle'} · ${encounter.ambush?'Ambush':'Party initiative'}`;$('scene-caption').textContent=encounter.intro;
    render();pump();
  }catch(e){error(e.message);}
}
async function load(){
  try{const response=await fetch('battles.json');if(!response.ok)throw Error(`Encounter file could not be loaded (${response.status}).`);init(await response.json());}
  catch(e){error(location.protocol==='file:'?'The browser blocked automatic loading of battles.json.':`${e.message} Check that battles.json is beside combat.html, then reload.`,location.protocol==='file:');}
}
$('data-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{init(JSON.parse(await file.text()));}catch(e){error(`Invalid encounter file: ${e.message}`,true);}};
$('save-scum').onclick=()=>{clearTimeout(timer);location.href='world.html';};
$('cancel').onclick=()=>{mode=null;pending=null;render();};
document.querySelectorAll('[data-command]').forEach(button=>button.onclick=()=>{
  if(!battle||battle.actor()?.side!=='ally'||finished)return;
  const command=button.dataset.command;mode=command;pending=null;
  if(command==='dodge')perform('dodge');else if(command==='attack')choose('attack');else render();
});
function choose(action){
  const actor=battle.actor();if(!actor||actor.side!=='ally')return;
  const targets=battle.targets(action,actor),s=C.skills[action];
  if(targets.length===1){perform(action,targets[0].id);return;}
  if(!targets.length&&(s?.all||s?.kind==='flurry')){perform(action);return;}
  if(!targets.length){$('notice').textContent='There is no valid target for that action.';return;}
  pending=action;render();
}
function perform(action,target){
  try{battle.act(action,target);mode=null;pending=null;$('notice').textContent='';render();pump();}
  catch(e){$('notice').textContent=e.message;render();}
}
function pump(){
  clearTimeout(timer);if(finished)return;if(battle.outcome){finish();return;}
  const actor=battle.actor();if(actor?.side==='ally')return;
  timer=setTimeout(()=>{if(document.hidden){pump();return;}if(actor)battle.enemyAct();else battle.tick();render();pump();},actor?550:100);
}
function unitCard(unit){
  const actor=battle.actor(),valid=pending&&actor?.side==='ally'&&battle.targets(pending,actor).includes(unit);
  const card=document.createElement('button');card.className=`unit ${unit.side}${valid?' target':''}${actor===unit?' active':''}${unit.hp<=0?' ko':''}`;
  // Static status cards stay readable at full contrast; only targetable cards respond.
  card.setAttribute('aria-disabled',String(!valid));card.onclick=()=>{if(valid)perform(pending,unit.id);};
  const name=document.createElement('span');name.className='name';name.textContent=unit.name+(unit.hp<=0?' · KO':'');card.append(name);
  const hp=document.createElement('small');hp.textContent=`HP ${Math.ceil(unit.hp)} / ${unit.maxHp}${unit.side==='ally'?` · Lv ${unit.level}`:''}`;card.append(hp);
  const meter=document.createElement('div');meter.className='meter';const fill=document.createElement('span');fill.style.width=`${unit.hp/unit.maxHp*100}%`;meter.append(fill);card.append(meter);
  if(unit.side==='ally'){const stamina=document.createElement('small');stamina.textContent=`Stamina ${unit.stamina.toFixed(1)} / ${unit.maxStamina}`;card.append(stamina);const bar=document.createElement('div');bar.className='meter stamina';const f=document.createElement('span');f.style.width=`${unit.stamina/unit.maxStamina*100}%`;bar.append(f);card.append(bar);}
  const statuses=[];if(unit.dodgeUntil>battle.time)statuses.push(`Dodge ${unit.dodgeUntil-battle.time}t`);if(unit.blessUntil>battle.time)statuses.push(`Blessed ${unit.blessUntil-battle.time}t`);if(unit.guardUntil>battle.time)statuses.push('Protecting ally');if(unit.berserk)statuses.push('BERSERK');if(unit.training)statuses.push(`${unit.training} boosted attacks`);
  if(unit.revealed){const intent=battle.plan(unit);statuses.push(`${intent.name} → ${intent.special?.all?'all allies':battle.allies.find(h=>h.id===intent.target)?.name}`);}
  if(statuses.length){const status=document.createElement('small');status.textContent=statuses.join(' · ');card.append(status);}
  card.setAttribute('aria-label',`${unit.name}, ${Math.ceil(unit.hp)} of ${unit.maxHp} HP${valid?', select target':''}`);return card;
}
function render(){
  if(!battle)return;const actor=battle.actor(),player=actor?.side==='ally'&&!finished;
  $('clock').textContent=`T · ${battle.time}`;
  $('enemies').replaceChildren(...battle.enemies.map(unitCard));$('allies').replaceChildren(...battle.allies.map(unitCard));
  $('timeline').replaceChildren();for(const unit of battle.queue().slice(0,9)){const chip=document.createElement('span');chip.className='turn';const name=document.createElement('b');name.textContent=unit.name;chip.append(name,document.createTextNode(`T ${unit.next}${unit.next<=battle.time?' · NOW':''}`));$('timeline').append(chip);}
  $('prompt').textContent=battle.outcome?battle.outcome==='victory'?'Victory. Naturally.':'The prophecy needs another draft.':pending?`${actor.name} · Select ${battle.targets(pending,actor)[0]?.side==='ally'?'an ally':'an enemy'}`:player?`${actor.name} · Your move` :actor?`${actor.name} is acting…`:'Time advances…';
  document.querySelectorAll('[data-command]').forEach(button=>{button.disabled=!player;button.setAttribute('aria-pressed',String(button.dataset.command===mode));});
  $('cancel').hidden=!player||!mode;$('choices').replaceChildren();
  $('action-help').textContent=pending?(C.skills[pending]?.description||C.itemInfo[pending.slice(5)]?.description||'Tap an enemy above.'):player?'The timeline is paused. Take your time.':'Stamina regenerates as the timeline advances.';
  if(player&&!pending&&mode==='skill')for(const skill of battle.skillList(actor)){
    const button=document.createElement('button');button.className='choice';const reason=battle.skillReason(actor,skill);button.disabled=Boolean(reason);button.append(document.createTextNode(`${skill.name} · ${skill.cost} Stamina`));const help=document.createElement('small');help.textContent=reason?`${reason} · ${skill.description}`:skill.description;button.append(help);button.onclick=()=>choose(skill.id);$('choices').append(button);
  }
  if(player&&!pending&&mode==='item'){
    const items=Object.entries(C.itemInfo).map(([id,info])=>({id,...info,quantity:battle.state.inventory.filter(i=>i.id===id).reduce((n,i)=>n+i.quantity,0)}));
    for(const item of items){const button=document.createElement('button');button.className='choice';button.disabled=!item.quantity;button.textContent=`${item.name} × ${item.quantity}`;const help=document.createElement('small');help.textContent=item.description;button.append(help);button.onclick=()=>choose(`item:${item.id}`);$('choices').append(button);}
  }
  $('ledger').replaceChildren();const gold=document.createElement('strong');gold.textContent=`${battle.state.gold} Gold`;const reward=document.createElement('div');reward.textContent=`This attempt: +${battle.xp} XP each · +${battle.gold} Gold`;$('ledger').append(gold,reward);
  const log=$('log');if(log.childElementCount!==Math.min(battle.logs.length,80)||log.dataset.count!==String(battle.logs.length)){
    log.replaceChildren(...battle.logs.slice(-80).map(entry=>{const p=document.createElement('p'),time=document.createElement('time');time.textContent=`T ${entry.time}`;p.append(time,document.createTextNode(entry.message));return p;}));log.dataset.count=String(battle.logs.length);log.scrollTop=log.scrollHeight;
  }draw();
}
function finish(){
  finished=true;clearTimeout(timer);$('save-scum').hidden=true;mode=null;pending=null;render();
  const win=battle.outcome==='victory';$('result-label').textContent=win?'Encounter completed':'Save Scumming';$('result-title').textContent=win?'A completely deserved victory.':'The gods noticed.';
  if(!win){$('result-copy').textContent='Gods of gaming see your failure and despise you. Anyway by the powers of Save Scumming, you return just before the battle happening, and a little bit wiser about what you will encounter.';$('result-action').onclick=()=>location.href='world.html';}
  else{
    const result=battle.finish(),unlocks={'sewers-3':'Lyra joins your party.','countryside-2':'Cape slots unlocked.','city-3':'Grond joins your party.','desert-2':'Big swords unlocked.','swamp-2':'Father Patch joins your party.','mountain-4':'Healing Staff unlocked.','castle-2':'Heart slot unlocked.','final-1':'The Dark King is defeated. The journey is complete.'};
    $('result-copy').textContent=[result.firstClear?unlocks[battle.encounter.id]||'The next battle is now available.':'You have defeated this encounter again.',battle.encounter.boss?'Full rest: all heroes recover HP and Stamina.':'KOed heroes return at half HP.'].join(' ');
    const drops={};for(const item of result.loot)drops[item.name]=(drops[item.name]||0)+item.quantity;
    $('result-rewards').textContent=`+${result.xp} XP to each hero · +${result.gold} Gold\n${Object.entries(drops).map(([name,n])=>`${name} × ${n}`).join('\n')||'No loot this time.'}`;
    if(result.dropped.length)$('result-rewards').textContent+='\n\nunfortunately you must drop exceeding loot. what a pity. Return to this battle with a bigger purse and redo the battle\nDropped: '+result.dropped.map(i=>`${i.name} × ${i.quantity}`).join(', ');
    function commit(){try{G.save(result.state);savedVictory=true;$('save-error').textContent='Progress saved.';$('result-action').textContent='Return to the world map';}catch{$('save-error').textContent='The browser could not save your victory. Free some browser storage, then retry. Keep this page open to retain the result.';$('result-action').textContent='Retry saving victory';}}
    commit();$('result-action').onclick=()=>{if(savedVictory)location.href='world.html';else commit();};
  }
  $('result').showModal();
}
$('result').addEventListener('cancel',event=>event.preventDefault());
function draw(){
  if(!battle||!ctx)return;const w=scene.clientWidth,h=scene.clientHeight,dpr=Math.min(devicePixelRatio||1,2);scene.width=Math.round(w*dpr);scene.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const palettes={sewers:['#142b31','#385046'],countryside:['#304b50','#647557'],city:['#263a46','#56515a'],desert:['#5e4a39','#b19868'],swamp:['#253d39','#546748'],mountain:['#314554','#8c9d9e'],castle:['#221f32','#4e435d'],final:['#271e2e','#735249']};
  const colors=palettes[battle.encounter.region],gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#07172055';for(let i=0;i<8;i++){const x=i*w/7;if(['sewers','castle','final','city'].includes(battle.encounter.region)){ctx.fillRect(x,0,12,h*.72);ctx.beginPath();ctx.arc(x+w/14,h*.2,w/14,Math.PI,0);ctx.lineTo(x+w/7,h*.7);ctx.lineTo(x,h*.7);ctx.fill();}else{ctx.beginPath();ctx.moveTo(x-70,h*.7);ctx.lineTo(x+10,h*.22+(i%3)*20);ctx.lineTo(x+100,h*.7);ctx.fill();}}
  ctx.fillStyle='#0a182d66';ctx.fillRect(0,h*.75,w,h*.25);ctx.strokeStyle='#d8b97825';ctx.beginPath();ctx.moveTo(0,h*.75);ctx.lineTo(w,h*.75);ctx.stroke();
  drawTargets=[];const total=battle.enemies.length;
  battle.enemies.forEach((e,i)=>{
    const columns=Math.min(total,4),row=Math.floor(i/4),rows=Math.ceil(total/4),count=Math.min(4,total-row*4),x=(i%4+.5)*w/count,y=rows===1?h*.69:h*(row===0?.47:.83),s=Math.min(w/(columns*120),rows===1?1.3:.72)*(e.boss?1.2:.8);
    if(e.hp<=0)return;drawTargets.push({id:e.id,x,y:y-30*s,r:48*s});ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#07131655';ctx.beginPath();ctx.ellipse(0,10,40,9,0,0,Math.PI*2);ctx.fill();
    const valid=pending&&battle.actor()?.side==='ally'&&battle.targets(pending,battle.actor()).includes(e);if(valid){ctx.strokeStyle='#f1d590';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,10,44,11,0,0,Math.PI*2);ctx.stroke();}
    SiluxEnemyArt.draw(ctx,e);
    ctx.restore();
  });
}
scene.onclick=event=>{if(!pending)return;const rect=scene.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,hit=drawTargets.find(t=>Math.hypot(t.x-x,t.y-y)<Math.max(25,t.r));if(hit&&battle.targets(pending,battle.actor()).some(t=>t.id===hit.id))perform(pending,hit.id);};
new ResizeObserver(draw).observe(scene);
window.addEventListener('pagehide',()=>clearTimeout(timer));
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
load();
