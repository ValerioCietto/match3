(function(){
  'use strict';
  let definitions;
  const element=id=>document.getElementById(id);
  window.renderWorldShops=function(){
    if(!definitions)return;
    element('world-shops').replaceChildren();
    for(const shop of definitions.shops){
      const open=SiluxShops.unlocked(state,shop),button=document.createElement('button');button.className='shop-card';button.disabled=!open||!canSave;
      const label=document.createElement('span');label.className='label';label.textContent=`${shop.region} shop · ${open?'Open':'Locked'}`;
      const title=document.createElement('strong');title.textContent=shop.name;
      const description=document.createElement('small');description.textContent=shop.tagline;
      const action=document.createElement('span');action.className='shop-action';action.textContent=open?'Browse wares →':`Defeat ${shop.unlockBoss} to unlock`;
      button.append(label,title,description,action);button.onclick=()=>{if(persist())location.href=`shop.html?shop=${encodeURIComponent(shop.id)}`;};element('world-shops').append(button);
    }
  };
  function accept(data){definitions=SiluxShops.validateShops(data);element('shop-status').textContent='';element('shop-file-label').hidden=true;window.renderWorldShops();}
  function fail(error){element('shop-status').textContent=`The shop directory could not be loaded: ${error.message}`;element('shop-file-label').hidden=location.protocol!=='file:';}
  element('world-shops-file').onchange=async event=>{try{const file=event.target.files[0];if(file)accept(JSON.parse(await file.text()));}catch(error){fail(error);}};
  fetch('shops.json').then(response=>{if(!response.ok)throw Error(`shops.json returned ${response.status}`);return response.json();}).then(accept).catch(fail);
})();
