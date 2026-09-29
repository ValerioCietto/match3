(function(root){
  'use strict';
  const G=root.SiluxGame||(typeof require!=='undefined'?require('./game.js'):null);
  const E=root.SiluxEquipment||(typeof require!=='undefined'?require('./equipment.js'):null);
  function validateShops(data){
    if(data?.version!==1||!Array.isArray(data.shops)||data.shops.length!==3)throw Error('shops.json must define the three shops.');
    const expected={sewers:'sewers-3',city:'city-3',castle:'castle-2'},ids=new Set();
    for(const shop of data.shops){
      if(!Object.hasOwn(expected,shop.id)||ids.has(shop.id)||shop.region!==shop.id||shop.unlockBattle!==expected[shop.id])throw Error('Invalid shop or regional boss unlock.');
      ids.add(shop.id);
      for(const field of ['name','unlockBoss','merchant','tagline','description','greeting','receipt','priceNote'])if(typeof shop[field]!=='string'||!shop[field].trim())throw Error(`Missing ${field} for shop ${shop.id}.`);
      if(!/^#[0-9a-f]{6}$/i.test(shop.accent))throw Error('Invalid shop accent color.');
    }return data;
  }
  function validateItems(data,shops){
    if(data?.version!==1||!Array.isArray(data.items))throw Error('Invalid shop.json item catalogue.');
    const ids=new Set();for(const item of data.items){
      if(typeof item.id!=='string'||!/^shop-[a-z0-9-]+$/.test(item.id)||ids.has(item.id)||!shops.shops.some(s=>s.id===item.shop))throw Error('Duplicate item or unknown shop.');ids.add(item.id);
      for(const field of ['name','description','rarity','condition'])if(typeof item[field]!=='string'||!item[field].trim())throw Error(`Missing ${field} for item ${item.id}.`);
      if(!Number.isSafeInteger(item.price)||item.price<1)throw Error(`Invalid price for ${item.name}.`);
      if(item.stock!==null&&(!Number.isSafeInteger(item.stock)||item.stock<0))throw Error(`Invalid stock for ${item.name}.`);
      if(item.type==='equipment')E.validateShopItem(item);
      else if(item.type!=='consumable'||!Object.hasOwn(G.consumables,item.itemId))throw Error(`Invalid item type: ${item.name}.`);
    }
    for(const shop of shops.shops)if(!data.items.some(i=>i.shop===shop.id))throw Error(`No stock defined for ${shop.name}.`);
    return data;
  }
  function unlocked(state,shop){return state.completed.includes(shop.unlockBattle);}
  function remaining(state,item){return item.stock===null?Infinity:Math.max(0,item.stock-(state.shopPurchases?.[item.id]||0));}
  function buy(state,shopId,itemId,quantity,shops,catalogue){
    const shop=shops.shops.find(s=>s.id===shopId);if(!shop||!unlocked(state,shop))throw Error('This shop is locked. Defeat its regional boss first.');
    const item=catalogue.items.find(i=>i.id===itemId&&i.shop===shopId);if(!item)throw Error('This item is not sold here.');
    if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw Error('Choose a quantity from 1 to 99.');
    if(remaining(state,item)<quantity)throw Error('Not enough stock remains.');
    const cost=item.price*quantity;if(!Number.isSafeInteger(cost)||state.gold<cost)throw Error(`You need ${cost} Gold for this purchase.`);
    const next=G.clone(state),inventoryId=item.type==='equipment'?item.id:item.itemId;
    const savedDefinition=item.type==='equipment'?state.shopEquipment?.find(e=>e.id===item.id):null;
    if(G.addLoot(next,[{id:inventoryId,name:savedDefinition?.name||item.name,quantity}]).length)throw Error('Not enough shared inventory space. Equip a larger Backpack or Belt first.');
    next.gold-=cost;next.shopPurchases={...next.shopPurchases,[item.id]:(next.shopPurchases?.[item.id]||0)+quantity};
    if(item.type==='equipment'){
      // Purchased definitions travel with the save, including across file:// pages.
      // A later catalogue edit does not silently alter gear already owned.
      next.shopEquipment=next.shopEquipment||[];
      if(!next.shopEquipment.some(e=>e.id===item.id))next.shopEquipment.push(G.clone(item));
    }
    return next;
  }
  const api={validateShops,validateItems,unlocked,remaining,buy};root.SiluxShops=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
