'use strict';
const G=SiluxGame,E=SiluxEquipment,$=id=>document.getElementById(id);
let state,heroId=new URLSearchParams(location.search).get('hero')||'silux',selectedSlot='weapon';
const roles={silux:'The Hero',lyra:'The Mysterious Girl',grond:'The Big Warrior',patch:'The Healer'};
const quotes={silux:'“Does the prophecy cover equipment expenses?”',lyra:'“My accessories contain several important spoilers.”',grond:'“If it takes both hands, it must be good.”',patch:'“The gods recommend sensible footwear.”'};
const statLabels={maxHp:'Maximum HP',attack:'Attack',defense:'Defense',accuracy:'Accuracy',crit:'Critical Chance',critDamage:'Critical Damage',cooldown:'Action Cooldown',maxStamina:'Maximum Stamina'};
function format(stat,value){return `${Number(value.toFixed(1))}${['defense','accuracy','crit','critDamage'].includes(stat)?'%':''}`;}
function message(text){$('notice').textContent=text;}
function changeEquipment(itemId){
  try{
    // Read again so another page's newer rewards or HP are not overwritten.
    const latest=G.load(),next=G.equip(latest,heroId,selectedSlot,itemId);
    G.save(next);state=next;
    message(itemId?`${E.byId[itemId].name} equipped. Changes saved.`:'Item returned to the shared inventory. Changes saved.');render();
    const focus=document.querySelector(`#slots [data-slot="${selectedSlot}"]`);focus?.focus();
  }catch(error){message(error.message);}
}
function preview(hero,itemId){try{return {next:G.equip(state,hero.id,selectedSlot,itemId)};}catch(error){return {error:error.message};}}
function comparison(hero,next){
  const before=G.stats(hero),after=G.stats(next.heroes.find(h=>h.id===hero.id)),box=document.createElement('div');box.className='compare';
  for(const stat of Object.keys(statLabels)){const diff=after[stat]-before[stat];if(!diff)continue;const line=document.createElement('div');line.textContent=`${statLabels[stat]} ${format(stat,before[stat])} → ${format(stat,after[stat])}`;if(stat==='cooldown'?diff>0:diff<0)line.className='down';box.append(line);}
  const cap=G.capacity(next);if(cap!==G.capacity(state)){const line=document.createElement('div');line.textContent=`Shared slots ${G.capacity(state)} → ${cap}`;if(cap<G.capacity(state))line.className='down';box.append(line);}return box;
}
function render(){
  const hero=state.heroes.find(h=>h.id===heroId)||state.heroes[0];heroId=hero.id;const stats=G.stats(hero);
  $('manager').hidden=false;$('capacity').textContent=`${state.inventory.length} / ${G.capacity(state)} slots`;$('gold').textContent=`${state.gold} Gold`;
  $('roster').replaceChildren();for(const h of state.heroes){const button=document.createElement('button');button.className='hero-tab';button.setAttribute('aria-pressed',String(h.id===hero.id));button.textContent=G.roster[h.id].name;const sub=document.createElement('small');sub.textContent=`${roles[h.id]} · Level ${G.level(h.xp)}`;button.append(sub);button.onclick=()=>{heroId=h.id;render();};$('roster').append(button);}
  $('hero-role').textContent=roles[hero.id];$('hero-name').textContent=stats.name;$('hero-quote').textContent=quotes[hero.id];$('vitals').textContent=`HP ${Math.ceil(hero.hp)} / ${stats.maxHp} · Stamina ${hero.stamina.toFixed(1)} / ${stats.maxStamina}`;
  $('stats').replaceChildren();for(const [stat,label] of Object.entries(statLabels)){const row=document.createElement('div');row.className='stat';const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=format(stat,stats[stat]);row.append(dt,dd);$('stats').append(row);}
  $('slots').replaceChildren();for(const [slot,label] of Object.entries(E.slots)){
    const item=E.itemInSlot(hero,slot),locked=E.slotReason(state,slot),twoHands=slot==='offhand'&&E.itemInSlot(hero,'weapon')?.hands===2;
    const button=document.createElement('button');button.className=`slot${locked?' locked':''}`;button.dataset.slot=slot;button.setAttribute('aria-pressed',String(selectedSlot===slot));
    const name=document.createElement('span');name.className='label';name.textContent=label;
    const value=document.createElement('strong');value.textContent=locked?'Locked':twoHands?'Big Sword · Hand 2':item?.name||'Empty';
    const detail=document.createElement('small');detail.textContent=locked||(twoHands?'Occupied by your two-handed weapon':item?E.describe(item):'Select to add equipment');button.append(name,value,detail);
    button.onclick=()=>{selectedSlot=slot;render();};$('slots').append(button);
  }
  $('inventory-title').textContent=`Equipment for ${E.slots[selectedSlot]}`;
  const current=E.itemInSlot(hero,selectedSlot),slotReason=E.reason(state,hero,selectedSlot,null),removal=preview(hero,null);
  $('unequip').disabled=!current||Boolean(removal.error);$('unequip').title=removal.error||'Return the equipped item to inventory';$('unequip').onclick=()=>changeEquipment(null);
  $('slot-help').textContent=slotReason||(current?`Currently equipped: ${current.name}. ${E.describe(current)}.`:'Choose an item below to equip this slot.');
  $('items').replaceChildren();
  if(current&&removal.error&&!slotReason){const note=document.createElement('p');note.className='muted';note.textContent=removal.error;$('items').append(note);}
  const stocked=new Map();for(const stack of state.inventory){const item=E.byId[stack.id];if(item?.slots.includes(selectedSlot))stocked.set(item.id,(stocked.get(item.id)||0)+stack.quantity);}
  if(!stocked.size){const empty=document.createElement('div');empty.className='empty';empty.textContent=slotReason||'No spare equipment for this slot. Find equipment in battle loot, or unequip an item from another hero to share it.';$('items').append(empty);}
  for(const [id,quantity] of stocked){
    const item=E.byId[id],result=preview(hero,id),card=document.createElement('article');card.className='item';
    const content=document.createElement('div'),title=document.createElement('h3'),bonus=document.createElement('p'),description=document.createElement('p');title.textContent=`${item.name} × ${quantity}`;bonus.className='bonuses';bonus.textContent=E.describe(item);description.textContent=item.description;content.append(title,bonus,description);
    const requirement=document.createElement('p');requirement.textContent=`Level ${item.level||1}+${item.classes?' · '+item.classes.map(id=>G.roster[id].name).join(', '):' · All heroes'}`;content.append(requirement);
    if(result.error){const reason=document.createElement('p');reason.className='restriction';reason.textContent=result.error;content.append(reason);}else content.append(comparison(hero,result.next));
    const button=document.createElement('button');button.textContent='Equip';button.disabled=Boolean(result.error);button.setAttribute('aria-label',`Equip ${item.name} on ${stats.name}`);button.onclick=()=>changeEquipment(id);card.append(content,button);$('items').append(card);
  }
}
function load(){try{state=G.load();$('error').hidden=true;render();}catch(error){$('manager').hidden=true;$('error').hidden=false;$('error').textContent=`Could not load your team: ${error.message}. Return to the title screen to start a new journey.`;}}
window.addEventListener('pageshow',event=>{if(event.persisted)load();});
window.addEventListener('storage',event=>{if(event.key===G.KEY){load();message('Your team was updated in another tab. The latest equipment is shown.');}});
load();
