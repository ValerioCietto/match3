'use strict';
const G=SiluxGame,E=SiluxEquipment,S=SiluxShops,$=id=>document.getElementById(id);
let shopsData,itemsData,state,selected=new URLSearchParams(location.search).get('shop')||'sewers';
function showError(message){$('loading').hidden=true;$('store').hidden=true;$('error').hidden=false;$('error-copy').textContent=message;$('file-loader').hidden=location.protocol!=='file:';}
function initialize(definitions,catalogue){
  try{shopsData=S.validateShops(definitions);itemsData=S.validateItems(catalogue,shopsData);state=G.load();if(!shopsData.shops.some(s=>s.id===selected))throw Error('This shop does not exist. Choose one from the world map.');$('loading').hidden=true;$('error').hidden=true;$('store').hidden=false;render();}
  catch(error){showError(error.message);}
}
async function load(){try{const responses=await Promise.all(['shops.json','shop.json'].map(async file=>{const response=await fetch(file);if(!response.ok)throw Error(`Could not load ${file} (${response.status}).`);return response.json();}));initialize(...responses);}catch(error){showError(location.protocol==='file:'?'Your browser blocked automatic loading of the JSON files.':error.message);}}
async function readFiles(){try{const shops=$('shops-file').files[0],items=$('items-file').files[0];if(shops&&items)initialize(JSON.parse(await shops.text()),JSON.parse(await items.text()));}catch(error){showError(`Invalid JSON: ${error.message}`);}}
$('shops-file').onchange=readFiles;$('items-file').onchange=readFiles;$('filter').onchange=()=>renderItems();
function buy(item,quantity){
  try{const latest=G.load(),next=S.buy(latest,selected,item.id,quantity,shopsData,itemsData);G.save(next);state=G.load();const shop=shopsData.shops.find(s=>s.id===selected);render();$('notice').textContent=`Purchased ${quantity} × ${item.name} for ${item.price*quantity} Gold. ${shop.receipt}`;}
  catch(error){$('notice').textContent=error.message;}
}
function render(){
  const shop=shopsData.shops.find(s=>s.id===selected);document.documentElement.style.setProperty('--accent',shop.accent);document.title=`${shop.name} — Silux`;
  $('gold').textContent=`${state.gold} Gold`;$('capacity').textContent=`Inventory ${state.inventory.length} / ${G.capacity(state)} slots`;
  $('shops').replaceChildren();for(const entry of shopsData.shops){const button=document.createElement('button');button.textContent=`${entry.region[0].toUpperCase()+entry.region.slice(1)}${S.unlocked(state,entry)?'':' · Locked'}`;button.setAttribute('aria-pressed',String(entry.id===selected));button.onclick=()=>{selected=entry.id;$('notice').textContent='';render();};$('shops').append(button);}
  $('shop-label').textContent=`${shop.region} shop · ${S.unlocked(state,shop)?'Open for business':'Locked'}`;$('shop-name').textContent=shop.name;$('tagline').textContent=shop.tagline;$('description').textContent=shop.description;$('merchant').textContent=shop.merchant;$('greeting').textContent=`“${shop.greeting}”`;$('price-note').textContent=shop.priceNote;
  $('locked').hidden=S.unlocked(state,shop);$('lock-title').textContent=`Defeat ${shop.unlockBoss} to unlock this shop.`;$('catalogue').hidden=!S.unlocked(state,shop);renderItems();
}
function renderItems(){
  $('items').replaceChildren();const shop=shopsData.shops.find(s=>s.id===selected);if(!S.unlocked(state,shop))return;
  const filter=$('filter').value;
  for(const listing of itemsData.items.filter(i=>i.shop===selected&&(filter==='all'||i.type===filter))){
    // Keep an already purchased equipment definition consistent with the save.
    const item=listing.type==='equipment'?{...listing,...state.shopEquipment?.find(e=>e.id===listing.id),price:listing.price,stock:listing.stock}:listing;
    const card=document.createElement('article');card.className='card';card.dataset.rarity=item.rarity;
    const rarity=document.createElement('div');rarity.className='label';rarity.textContent=`${item.rarity} · ${item.type==='equipment'?'Equipment':'Consumable'}`;
    const title=document.createElement('h3');title.textContent=item.name;const condition=document.createElement('div');condition.className='muted';condition.textContent=item.condition;
    const description=document.createElement('p');description.className='description';description.textContent=item.description;card.append(rarity,title,condition,description);
    if(item.type==='equipment'){const bonuses=document.createElement('p');bonuses.className='bonuses';bonuses.textContent=E.describe(item);const restrictions=document.createElement('p');restrictions.className='restrictions';restrictions.textContent=`${item.slots.map(slot=>E.slots[slot]).join(' / ')} · Level ${item.level||1}+ · ${item.classes?item.classes.map(id=>G.roster[id].name).join(', '):'All heroes'}${item.boss?' · Requires '+item.boss.replace('-',' '):''}`;card.append(bonuses,restrictions);}
    const purchase=document.createElement('div');purchase.className='purchase';const info=document.createElement('div'),price=document.createElement('div'),stock=document.createElement('div');price.className='price';price.textContent=`${item.price} Gold`;stock.className='stock';const left=S.remaining(state,listing);stock.textContent=Number.isFinite(left)?`${left} remaining`:'In stock';info.append(price,stock);
    const label=document.createElement('label');label.className='quantity';label.textContent='Qty';const quantity=document.createElement('input');quantity.type='number';quantity.min='1';quantity.max=String(Math.min(99,Number.isFinite(left)?Math.max(1,left):99));quantity.step='1';quantity.value='1';quantity.setAttribute('aria-label',`Quantity of ${item.name}`);label.append(quantity);
    const button=document.createElement('button');button.className='buy';const reason=document.createElement('p');reason.className='reason';
    function update(){const count=Number(quantity.value);button.textContent=`Buy · ${Number.isInteger(count)&&count>0?item.price*count:item.price} Gold`;try{S.buy(state,selected,listing.id,count,shopsData,itemsData);button.disabled=false;reason.textContent='';}catch(error){button.disabled=true;reason.textContent=error.message;}}
    quantity.oninput=update;button.onclick=()=>buy(listing,Number(quantity.value));update();purchase.append(info,label,button,reason);card.append(purchase);$('items').append(card);
  }
}
window.addEventListener('pageshow',event=>{if(event.persisted&&shopsData&&itemsData){try{state=G.load();render();}catch(error){showError(error.message);}}});
window.addEventListener('storage',event=>{if(event.key===G.KEY&&shopsData&&itemsData){try{state=G.load();render();$('notice').textContent='Gold and stock updated from your latest save.';}catch(error){showError(error.message);}}});
load();
