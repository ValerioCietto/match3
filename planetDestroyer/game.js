/* Planet Destroyer — buildless Canvas demo. Weapon balance lives in weapons.json. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const CELL = 16, SAVE_KEY = 'planetDestroyer.demo.v1', TAU = Math.PI * 2;
  const levels = [
    ['Terra',1000,[.85,.65,.40,.20],200], ['Bedrock',1200,[.87,.68,.43,.22],250],
    ['Cinder',1400,[.88,.71,.46,.24],300], ['Basalt',1600,[.89,.73,.49,.27],350],
    ['Ironheart',1800,[.90,.75,.52,.30],400], ['Anvil',2000,[.91,.77,.55,.33],450],
    ['Crucible',2250,[.92,.79,.58,.36],500], ['Titan',2500,[.93,.81,.61,.39],550],
    ['Obsidian',2750,[.94,.83,.64,.42],600], ['Last Sun',3000,[.95,.85,.67,.45],1000]
  ];
  const layerNames=['Crust','Upper mantle','Lower mantle','Outer core','Inner core'];
  const cinderHP=[15,30,60,90,120], cinderCredits=[2,4,6,8,12];
  const material=(name,hp,reward,tint,phase='solid',core=false)=>({name,max:hp,hp,reward,tint,phase,core});
  function planetMaterial(index,r,depth,x,y,layer){
    if(index===0){
      if(depth<1)return material('Gas',1,1,[22,64,112],'gas');
      if(depth<3)return material('Crust',4,2,[20,48,90]);
      if(r>.27)return material('Liquid mantle',6,3,[22,65,125],'liquid');
      return material('Solid core',20,6,[36,90,160],'solid',true);
    }
    if(index===1){
      if(depth<5){
        const polar=Math.abs(x)<=Math.abs(y)*Math.tan(Math.PI/9);
        return polar?material('Polar weakness',5,3,[35,110,200]):material('Solid shell',50,6,[110,28,32]);
      }
      return material('Solid core',30,8,[145,45,40],'solid',true);
    }
    // Later planets retain their radial layout and scale beyond Cinder's new HP.
    const scale=index===2?1:1+(index-2)*.2;
    return material(layerNames[layer],Math.round(cinderHP[layer]*scale),cinderCredits[layer]+Math.max(0,index-2),index===2?[68,70,76]:[26,30,42]);
  }
  const colors=['#7afce1','#ffb76b','#c19aff','#f58bbe','#b2baff','#79dbff','#ffe080','#e6faff','#ff7dce','#adff73','#ff963e','#65caff'];
  const icons=['Ⅱ','⋰','ϟ','◉','⌒','↕','◔','⟶','⋙','⌖','☢','✥'];
  const descriptions={
    parallel_projectiles:'Two straight shots. A dependable tool for carving tunnels.',
    spread_projectiles:'A wide pellet fan that shreds crust and opens up the surface.',
    chain_lightning:'Jumps through five nearby blocks. Great for dense clusters.',
    orbiting_blade:'A close-orbit blade. Fly alongside an edge to chew through it.',
    lobbed_explosion:'Lobs over the surface and detonates at your cursor.',
    tethered_blade:'A tethered blade cuts outward, then hits again on its return.',
    returning_blade:'A curved cutting pass, followed by a return to your ship.',
    piercing_beam:'An instant beam that drills through multiple layers.',
    guided_missiles:'A rapid flurry of homing missiles. Seeks exposed blocks near your aim and explodes on impact.',
    guided_laser:'Rapidly locks onto the nearest block, regardless of aim. Every upgrade adds one ray focused on that block.',
    piercing_nuke:'Flies to your mouse position and detonates there. Drills up to 5 × level blocks on the way; blast radius is 4 × level block widths.',
    mining_drones:'Autonomous miners roam near the ship and reserve different nearest blocks. Each level adds a drone, one pierced block, and one laser damage.'
  };
  let definitions=[], byId={}, state, planet, ship, mode='welcome', auto=false;
  let bullets=[], blades=[], shells=[], effects=[], particles=[], cooldowns={};
  let drones=[];
  let simTime=0, last=0, accumulator=0, saveTimer=0, hudTimer=0, selectedSlot=0, shopReturn='play';
  let view={w:1,h:1,scale:1,ox:0,oy:0}, pointer={x:0,y:0,moved:false};
  let keys=new Set(), toastTimer, storageOK=true, lastFocus=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const format=n=>Math.round(n).toLocaleString();
  const key=(i,j)=>`${i},${j}`;

  function generatePlanet(index,seed=12345+index*997) {
    const spec=levels[index], extent=Math.ceil(Math.sqrt(spec[1]))+2, groups=[];
    // One representative per opposite pair guarantees an exact, symmetric disk.
    for(let i=0;i<extent;i++) for(let j=-extent;j<extent;j++) {
      const x=i+.5,y=j+.5; groups.push({i,j,d:x*x+y*y});
    }
    groups.sort((a,b)=>a.d-b.d||a.i-b.i||a.j-b.j);
    const selected=groups.slice(0,spec[1]/2), radius=Math.sqrt(selected.at(-1).d)*CELL;
    const blocks=[], grid=new Map();
    for(const g of selected) for(const [i,j] of [[g.i,g.j],[-g.i-1,-g.j-1]]) {
      const x=(i+.5)*CELL,y=(j+.5)*CELL,r=Math.hypot(x,y)/radius;
      let layer=0; while(layer<4 && r<=spec[2][layer]) layer++;
      const b={id:blocks.length,i,j,x,y,layer,...planetMaterial(index,r,(radius-Math.hypot(x,y))/CELL,x,y,layer)};
      blocks.push(b); grid.set(key(i,j),b);
    }
    if(index===2){
      let randomState=seed>>>0;
      const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
      const shuffled=[...blocks];
      for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
      for(const b of shuffled.slice(0,100)){b.name='Gold';b.gold=true;b.reward=10;b.tint=[175,127,20];}
    }
    const coreTotal=blocks.filter(b=>b.core).length;
    return {blocks,grid,radius,remaining:blocks.length,total:blocks.length,coreTotal,coreRemaining:coreTotal,collapseOnCore:index<2,collapse:null,compaction:0,halfW:Math.max(600,radius+220),halfH:Math.max(450,radius+170)};
  }
  function freshState(){return {version:2,seed:Math.floor(Math.random()*4294967296),level:0,credits:0,owned:{double_parallel_shot:1},slots:['double_parallel_shot',null,null],paid:[],auto:false,reduced:false,time:0};}
  function load() {
    state=freshState();
    try {
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw){
        const s=JSON.parse(raw);
        if(![1,2].includes(s.version)||!Number.isInteger(s.level)||s.level<0||s.level>=10||!Number.isFinite(s.credits)||s.credits<0||!s.owned||!Array.isArray(s.slots)||s.slots.length!==3||!Array.isArray(s.paid)) throw Error('Invalid save');
        for(const [id,level] of Object.entries(s.owned)) if(!byId[id]||!Number.isInteger(level)||level<1||level>5) throw Error('Invalid weapon level');
        const equipped=s.slots.filter(Boolean);
        if(new Set(equipped).size!==equipped.length||equipped.some(id=>!s.owned[id])) throw Error('Invalid loadout');
        if(s.paid.some(i=>!Number.isInteger(i)||i<0||i>=10)) throw Error('Invalid completion state');
        state={...state,...s,time:Number.isFinite(s.time)?Math.max(0,s.time):0};
        if(s.version===1){delete state.hp;delete state.positions;delete state.ship;state.version=2;toast('Planet materials updated. Equipment and credits kept; the current planet has been rebuilt.');}
        if(!Number.isInteger(state.seed))state.seed=12345;
        $('welcomeNote').textContent='Flight log found. Resume your damaged planet with all equipment and credits intact.';
      }
    }catch(error){
      if(error instanceof SyntaxError||error.message.startsWith('Invalid')) toast('Unreadable flight log. Starting a fresh campaign.');
      else {storageOK=false; $('saveStatus').textContent='Session only · storage unavailable';}
    }
    planet=generatePlanet(state.level,state.seed);
    if(Array.isArray(state.hp)&&state.hp.length===planet.total&&state.hp.every((hp,i)=>Number.isFinite(hp)&&hp>=0&&hp<=planet.blocks[i].max)){
      planet.blocks.forEach((b,i)=>b.hp=state.hp[i]); planet.remaining=planet.blocks.filter(b=>b.hp>0).length;
    }
    if(Array.isArray(state.positions)&&state.positions.length===planet.total){
      const occupied=new Set();
      const valid=state.positions.every((p,i)=>{
        const b=planet.blocks[i];
        if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||Math.hypot(p[0]+.5,p[1]+.5)*CELL>planet.radius+.01)return false;
        if(b.phase!=='liquid'&&(p[0]!==b.i||p[1]!==b.j))return false;
        if(b.hp>0){const k=key(...p);if(occupied.has(k))return false;occupied.add(k);}return true;
      });
      if(valid)planet.blocks.forEach((b,i)=>{[b.i,b.j]=state.positions[i];b.x=(b.i+.5)*CELL;b.y=(b.j+.5)*CELL;});
    }
    if(state.paid.includes(state.level))planet.blocks.forEach(b=>b.hp=0);
    rebuildGrid();
    planet.coreRemaining=planet.blocks.filter(b=>b.core&&b.hp>0).length;
    planet.remaining=planet.blocks.filter(b=>b.hp>0).length;
    planet.compaction=Number.isFinite(state.compaction)?clamp(state.compaction,0,.999):0;
    if(planet.collapseOnCore&&planet.coreRemaining===0&&planet.remaining>0)planet.collapse=Number.isFinite(state.collapse)?clamp(state.collapse,0,1.4):0;
    ship={x:0,y:-planet.radius-90,vx:0,vy:0,angle:Math.PI/2};
    if(state.ship&&Number.isFinite(state.ship.x)&&Number.isFinite(state.ship.y)){
      ship.x=clamp(state.ship.x,-planet.halfW+20,planet.halfW-20); ship.y=clamp(state.ship.y,-planet.halfH+20,planet.halfH-20);
      if(collides(ship.x,ship.y)){ship.x=0;ship.y=-planet.radius-90;}
    }
    auto=!!state.auto;
    $('reducedMotion').checked=!!state.reduced;
    cooldowns={}; for(const d of definitions) cooldowns[d.id]=.3;
    drones=[];syncDrones();
    updateHUD();
  }
  function save(){
    if(!state||!planet)return;
    state.hp=planet.blocks.map(b=>b.hp);state.ship={x:ship.x,y:ship.y};state.auto=auto;
    state.positions=planet.blocks.map(b=>[b.i,b.j]);state.collapse=planet.collapse;state.compaction=planet.compaction;
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
    catch{storageOK=false;$('saveStatus').textContent='Session only · storage unavailable';}
  }
  function stats(id){
    const d=byId[id], result={...d.baseStats};
    for(const upgrade of d.upgrades){if(upgrade.level>(state.owned[id]||1))break;
      for(const [k,v] of Object.entries(upgrade.modifiers.add||{}))result[k]+=v;
      for(const [k,v] of Object.entries(upgrade.modifiers.multiply||{}))result[k]*=v;
    } return result;
  }
  function toast(message){$('toast').textContent=message;$('toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity=0,3200);}
  function setMode(next){
    const previous=mode;mode=next;keys.clear();
    if(previous==='play'&&next!=='play')lastFocus=document.activeElement;
    for(const id of ['welcome','shop','pause','complete'])$(id).hidden=next!==id;
    if(next!=='play') {save(); const first=$(next)?.querySelector('button:not(:disabled)'); first?.focus();}
    else if(lastFocus){lastFocus.blur();lastFocus=null;}
    $('pauseBtn').textContent=next==='pause'?'Resume ESC':'Pause ESC';
  }
  function updateHUD(){
    if(!planet)return;
    const spec=levels[state.level], percentage=(1-planet.remaining/planet.total)*100;
    $('credits').textContent=format(state.credits);$('planetName').textContent=spec[0];
    $('planetLabel').textContent=`${spec[0]} · ${format(planet.total)} destructible blocks`;
    $('levelLabel').textContent=`Sector ${String(state.level+1).padStart(2,'0')} / 10`;
    $('progress').style.width=`${percentage}%`;$('percent').textContent=`${percentage.toFixed(1)}% cleared`;
    $('remaining').textContent=`${format(planet.remaining)} blocks`;
    $('planetObjective').textContent=planet.collapseOnCore?`Destroy the core: ${planet.coreRemaining} / ${planet.coreTotal} blocks left${planet.collapse!==null?' · COLLAPSING':''}`:state.level===2?`Gold remaining: ${planet.blocks.filter(b=>b.gold&&b.hp>0).length} / 100 · 10 credits each`:'Destroy every block to advance';
    const materials=new Map();for(const b of planet.blocks){const entry=materials.get(b.name)||{min:b.max,max:b.max};entry.min=Math.min(entry.min,b.max);entry.max=Math.max(entry.max,b.max);materials.set(b.name,entry);}
    $('composition').innerHTML=[...materials].map(([name,hp])=>`<span>${name}</span><b>${hp.min===hp.max?hp.min:`${hp.min}–${hp.max}`} HP</b>`).join('');
    $('autoBtn').classList.toggle('active',auto);$('autoBtn').setAttribute('aria-pressed',String(auto));$('autoBtn').innerHTML=`Auto fire: ${auto?'ON':'OFF'} <small>F</small>`;
    $('loadout').innerHTML=state.slots.map((id,i)=>{
      if(!id)return `<div class="slot"><small>0${i+1} / EMPTY SLOT</small><div>Visit the armory</div></div>`;
      const s=stats(id),period=s.cooldown||s.cycleDuration||s.contactInterval;
      const ready=clamp(1-(cooldowns[id]||0)/period,0,1)*100;
      return `<div class="slot"><small>0${i+1} / LEVEL ${state.owned[id]}${s.droneCount?' · AUTONOMOUS':''}</small><div>${byId[id].name}</div><div class="bar"><i style="width:${ready}%"></i></div></div>`;
    }).join('');
  }
  function openShop(){if(!state||mode==='welcome')return;shopReturn=planet.remaining===0?'complete':'play';selectedSlot=Math.max(0,state.slots.indexOf(null));setMode('shop');renderShop();}
  function renderShop(){
    $('shopCredits').textContent=format(state.credits);
    $('shopSlots').innerHTML=state.slots.map((id,i)=>`<button class="shop-slot ${selectedSlot===i?'selected':''}" data-slot="${i}"><small>SLOT 0${i+1}${selectedSlot===i?' · SELECTED':''}</small>${id?byId[id].name:'Empty slot'}</button>`).join('');
    $('weaponGrid').innerHTML=definitions.map((d,i)=>{
      const owned=state.owned[d.id]||0,s=stats(d.id),next=d.upgrades.find(u=>u.level===owned+1),equipped=state.slots.includes(d.id);
      const timing=s.cooldown||s.cycleDuration||s.contactInterval;
      const special=s.droneCount?`${s.droneCount} drones · ${s.penetration} blocks pierced · autonomous`:s.drillBlocks?`${s.drillBlocks} blocks drilled · ${s.blastRadiusBlocks}-block blast radius`:s.rayCount?`${s.rayCount} ${s.rayCount===1?'ray':'rays'} per block · ${(1/s.cooldown).toFixed(1)} pulses/s`:s.missileCount?`${s.missileCount} guided missiles · ${s.blastRadius} blast radius`:s.pelletCount?`${s.pelletCount} pellets`:s.maxTargets?`${s.maxTargets} targets`:s.penetration?`${s.penetration} blocks pierced`:s.blastRadius?`${s.blastRadius} blast radius`:s.orbitRadius?`${s.orbitRadius} orbit radius`:`${Math.round(s.range)} range`;
      let preview='';
      if(next)preview=Object.entries(next.modifiers.add).map(([k,v])=>`+${Number(v.toFixed(2))} ${k.replace(/([A-Z])/g,' $1').toLowerCase()}`).join(' · ')+(Object.values(next.modifiers.multiply||{}).some(v=>v===.92)?' · 8% faster':'');
      return `<article class="weapon-card"><div class="weapon-icon" style="color:${colors[i]}">${icons[i]}</div><div><h3>${d.name}</h3><div class="badge">${owned?`LEVEL ${owned} / 5${equipped?' · EQUIPPED':''}`:'LOCKED'}</div></div><p>${descriptions[d.behavior]}</p><div class="numbers">${Number(s.damage.toFixed(2))} damage · ${timing.toFixed(2)}s<br>${special}</div><div class="actions">${!owned?`<button class="primary" data-buy="${d.id}" ${state.credits<d.unlockCost?'disabled':''}>Unlock · ${d.unlockCost} ◈</button>`:`<button data-upgrade="${d.id}" ${!next||state.credits<next.cost?'disabled':''}>${next?`Upgrade · ${next.cost} ◈`:'Maximum level'}</button><button data-equip="${d.id}">${equipped?'Unequip':`Equip in slot ${selectedSlot+1}`}</button>`}</div>${owned&&next?`<small class="eyebrow" style="letter-spacing:0;text-transform:none">Next: ${preview}</small>`:''}</article>`;
    }).join('');
    $('shopMessage').textContent=`Slot ${selectedSlot+1} selected. ${state.slots[selectedSlot]?'Equipping another weapon replaces this slot.':'Ready for a weapon.'}`;
  }
  $('shop').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.slot!==undefined){selectedSlot=Number(button.dataset.slot);renderShop();return;}
    const {buy,upgrade,equip}=button.dataset;
    if(buy){const d=byId[buy];if(state.owned[buy]||state.credits<d.unlockCost)return;state.credits-=d.unlockCost;state.owned[buy]=1;toast(`${d.name} unlocked. Equip it in a slot.`);}
    if(upgrade){const next=byId[upgrade].upgrades.find(u=>u.level===state.owned[upgrade]+1);if(!next||state.credits<next.cost)return;state.credits-=next.cost;state.owned[upgrade]=next.level;}
    if(equip&&state.owned[equip]){const existing=state.slots.indexOf(equip);if(existing>=0)state.slots[existing]=null;else state.slots[selectedSlot]=equip;blades=[];cooldowns[equip]=.2;}
    if(buy||upgrade||equip){syncDrones();save();renderShop();updateHUD();}
  });

  function blockAt(x,y){return planet.grid.get(key(Math.floor(x/CELL),Math.floor(y/CELL)));}
  function nearby(x,y,r){
    const found=[];
    for(let i=Math.floor((x-r)/CELL);i<=Math.floor((x+r)/CELL);i++)for(let j=Math.floor((y-r)/CELL);j<=Math.floor((y+r)/CELL);j++){
      const b=planet.grid.get(key(i,j));if(b&&b.hp>0)found.push(b);
    }return found;
  }
  function collides(x,y){
    return nearby(x,y,12).some(b=>b.phase!=='gas'&&Math.hypot(x-clamp(x,b.x-8,b.x+8),y-clamp(y,b.y-8,b.y+8))<11);
  }
  function rebuildGrid(){planet.grid.clear();for(const b of planet.blocks)if(b.hp>0)planet.grid.set(key(b.i,b.j),b);}
  function compactMantle(){
    // Inner cells settle first, letting outer cells fill the space they leave.
    const liquid=planet.blocks.filter(b=>b.phase==='liquid'&&b.hp>0).sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y)||a.id-b.id);
    for(const b of liquid){
      const options=[];
      for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
        if(!di&&!dj)continue;const i=b.i+di,j=b.j+dj,x=(i+.5)*CELL,y=(j+.5)*CELL;
        const occupant=planet.grid.get(key(i,j));
        if(occupant&&occupant.hp>0||Math.hypot(x,y)>=Math.hypot(b.x,b.y)-.01)continue;
        if(Math.hypot(ship.x-clamp(ship.x,x-8,x+8),ship.y-clamp(ship.y,y-8,y+8))<12)continue;
        options.push({i,j,x,y,r:Math.hypot(x,y)});
      }
      options.sort((a,c)=>a.r-c.r||a.i-c.i||a.j-c.j);
      if(options.length){if(planet.grid.get(key(b.i,b.j))===b)planet.grid.delete(key(b.i,b.j));const p=options[0];b.i=p.i;b.j=p.j;b.x=p.x;b.y=p.y;planet.grid.set(key(b.i,b.j),b);}
    }
  }
  // Grid DDA visits every crossed square, even for very fast shots and beams.
  function rayBlocks(x1,y1,x2,y2){
    let i=Math.floor(x1/CELL),j=Math.floor(y1/CELL);const endI=Math.floor(x2/CELL),endJ=Math.floor(y2/CELL);
    const dx=x2-x1,dy=y2-y1,sx=Math.sign(dx),sy=Math.sign(dy),tx=dx?CELL/Math.abs(dx):Infinity,ty=dy?CELL/Math.abs(dy):Infinity;
    let mx=dx?((sx>0?(i+1)*CELL:i*CELL)-x1)/dx:Infinity,my=dy?((sy>0?(j+1)*CELL:j*CELL)-y1)/dy:Infinity;
    const found=[];
    for(let n=0;n<2048;n++){
      const b=planet.grid.get(key(i,j));if(b&&b.hp>0)found.push(b);
      if(i===endI&&j===endJ)break;
      if(mx<my){i+=sx;mx+=tx;}else if(my<mx){j+=sy;my+=ty;}else{i+=sx;j+=sy;mx+=tx;my+=ty;}
    }return found;
  }
  function spark(x,y,color,count=3){
    if(state.reduced)count=Math.min(count,1);
    for(let n=0;n<count&&particles.length<650;n++){const a=Math.random()*TAU,speed=25+Math.random()*110;particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.2+Math.random()*.35,max:.55,color});}
  }
  function damage(b,amount){
    if(!b||b.hp<=0)return;b.hp=Math.max(0,b.hp-amount);
    if(b.hp===0){planet.remaining--;state.credits+=b.reward;if(b.core)planet.coreRemaining--;effects.push({type:'flash',x:b.x,y:b.y,life:.16,max:.16});spark(b.x,b.y,'#ffe080',4);
      if(planet.collapseOnCore&&planet.coreRemaining===0&&planet.collapse===null){planet.collapse=0;bullets=[];shells=[];blades=[];toast(state.level===0?'Core destroyed. Terra is collapsing!':'Core destroyed. Bedrock is crumbling!');}
    }
    else spark(b.x,b.y,'#ffad45',1);
  }
  function lineEffect(points,color,life=.17){effects.push({type:'line',points,color,life,max:life});}
  function aim(){return pointer.moved?{x:pointer.x,y:pointer.y}:{x:0,y:0};}
  function fire(id){
    const d=byId[id],s=stats(id),a=ship.angle,color=colors[definitions.indexOf(d)],target=aim();
    const direction={x:Math.cos(a),y:Math.sin(a)};
    switch(d.behavior){
      case 'mining_drones':return; // Drone lasers have their own autonomous firing loop.
      case 'piercing_nuke':{
        const heading=Math.atan2(target.y-ship.y,target.x-ship.x);
        bullets.push({nuke:true,x:ship.x,y:ship.y,tx:target.x,ty:target.y,vx:Math.cos(heading)*s.projectileSpeed,vy:Math.sin(heading)*s.projectileSpeed,left:distance(target,ship),damage:s.damage,color,s,drilled:new Set(),trail:[],exploded:false});
        break;
      }
      case 'guided_laser':{
        let nearest=null,best=s.range*s.range;
        for(const b of planet.blocks){
          if(b.hp<=0)continue;
          const squared=(b.x-ship.x)**2+(b.y-ship.y)**2;
          if(squared<best||(!nearest&&squared===best)){nearest=b;best=squared;}
        }
        if(nearest){
          const angle=Math.atan2(nearest.y-ship.y,nearest.x-ship.x);
          for(let ray=0;ray<s.rayCount;ray++){
            const offset=(ray-(s.rayCount-1)/2)*5;
            lineEffect([{x:ship.x-Math.sin(angle)*offset,y:ship.y+Math.cos(angle)*offset},{x:nearest.x,y:nearest.y}],color,Math.min(.06,s.cooldown*.7));
          }
          // One pulse focuses every ray on this block; overkill does not spill to others.
          damage(nearest,s.damage*s.rayCount);
        }
        break;
      }
      case 'guided_missiles':
        for(let n=0;n<s.missileCount;n++)bullets.push({guided:true,pending:true,delay:n*s.burstInterval,spread:(n/Math.max(1,s.missileCount-1)-.5)*s.spreadDegrees*Math.PI/180,index:n,x:ship.x,y:ship.y,vx:0,vy:0,left:s.range,damage:s.damage,color,s,trail:[],seekTimer:0,targetId:null});
        break;
      case 'parallel_projectiles': case 'spread_projectiles':{
        const spread=d.behavior==='spread_projectiles',count=spread?s.pelletCount:s.projectileCount;
        for(let n=0;n<count;n++){
          const angle=spread?a+(n/(count-1)-.5)*s.spreadDegrees*Math.PI/180:a;
          const offset=spread?0:(n-(count-1)/2)*s.muzzleSpacing;
          bullets.push({x:ship.x+direction.x*17-direction.y*offset,y:ship.y+direction.y*17+direction.x*offset,vx:Math.cos(angle)*s.projectileSpeed,vy:Math.sin(angle)*s.projectileSpeed,left:s.range,damage:s.damage,color});
        }break;
      }
      case 'chain_lightning':{
        const candidates=planet.blocks.filter(b=>b.hp>0&&distance(b,ship)<=s.range&&Math.abs(Math.atan2(Math.sin(Math.atan2(b.y-ship.y,b.x-ship.x)-a),Math.cos(Math.atan2(b.y-ship.y,b.x-ship.x)-a)))<=s.aimConeDegrees*Math.PI/360).sort((b,c)=>distance(b,ship)-distance(c,ship));
        let b=candidates.find(b=>rayBlocks(ship.x,ship.y,b.x,b.y)[0]===b);
        const visited=new Set(),points=[{x:ship.x,y:ship.y}];
        while(b&&visited.size<s.maxTargets){points.push({x:b.x,y:b.y});visited.add(b.id);damage(b,s.damage);const previous=b;b=nearby(b.x,b.y,s.jumpRange).filter(c=>!visited.has(c.id)&&distance(c,previous)<=s.jumpRange).sort((c,e)=>distance(c,previous)-distance(e,previous))[0];}
        if(points.length>1)lineEffect(points,color,.23);
        else lineEffect([{x:ship.x,y:ship.y},{x:ship.x+direction.x*45,y:ship.y+direction.y*45}],color,.08);
        break;
      }
      case 'lobbed_explosion':{
        const dist=Math.min(distance(target,ship),s.range);
        shells.push({x:ship.x,y:ship.y,tx:ship.x+direction.x*dist,ty:ship.y+direction.y*dist,age:0,duration:s.flightDuration,s,color});break;
      }
      case 'piercing_beam':{
        const end={x:ship.x+direction.x*s.range,y:ship.y+direction.y*s.range},hits=rayBlocks(ship.x,ship.y,end.x,end.y).slice(0,s.penetration);
        hits.forEach(b=>damage(b,s.damage));
        const lastHit=hits.length===s.penetration?hits.at(-1):end;
        lineEffect([{x:ship.x,y:ship.y},{x:lastHit.x,y:lastHit.y}],color,.24);break;
      }
      case 'tethered_blade':case 'returning_blade':
        if(blades.some(b=>b.id===id))return;
        blades.push({id,x:ship.x,y:ship.y,ox:ship.x,oy:ship.y,angle:a,age:0,returning:false,hits:new Set(),s,color,behavior:d.behavior});break;
      case 'orbiting_blade': return;
    }
    cooldowns[id]=s.cooldown||s.cycleDuration||.1;
  }
  const sawHits=new Map();
  function droneWaypoint(s,minRadius=0,maxRadius=s.roamRadius){
    const angle=Math.random()*TAU,radius=Math.sqrt(minRadius*minRadius+Math.random()*(maxRadius*maxRadius-minRadius*minRadius));
    return {x:clamp(ship.x+Math.cos(angle)*radius,-planet.halfW+15,planet.halfW-15),y:clamp(ship.y+Math.sin(angle)*radius,-planet.halfH+15,planet.halfH-15)};
  }
  function syncDrones(){
    if(!state.slots.includes('mining_drones')){drones=[];return;}
    const s=stats('mining_drones');
    drones.length=Math.min(drones.length,s.droneCount);
    while(drones.length<s.droneCount){
      const position=droneWaypoint(s,s.spawnMinRadius,s.spawnMaxRadius);
      drones.push({...position,goal:droneWaypoint(s),wander:1+Math.random()*2,cooldown:.2+Math.random()*.2,targetId:null,angle:Math.random()*TAU});
    }
  }
  function assignDroneTargets(s){
    const reserved=new Set();
    for(const drone of drones){
      const candidates=planet.blocks.filter(b=>b.hp>0&&!reserved.has(b.id)&&distance(b,drone)<=s.range);
      candidates.sort((a,b)=>distance(a,drone)-distance(b,drone)||a.id-b.id);
      // A clear first hit ensures a drone really shoots its own assigned block.
      const target=candidates.find(b=>rayBlocks(drone.x,drone.y,b.x,b.y)[0]===b);
      drone.targetId=target?target.id:null;
      if(target)reserved.add(target.id);
    }
  }
  function fireDroneLaser(drone,s){
    const target=drone.targetId===null?null:planet.blocks[drone.targetId];
    if(!target||target.hp<=0||distance(target,drone)>s.range)return false;
    const angle=Math.atan2(target.y-drone.y,target.x-drone.x);
    const end={x:drone.x+Math.cos(angle)*s.range,y:drone.y+Math.sin(angle)*s.range};
    const hits=rayBlocks(drone.x,drone.y,end.x,end.y).slice(0,s.penetration);
    if(hits[0]!==target)return false;
    drone.angle=angle;
    for(const b of hits)damage(b,s.damage);
    const lastHit=hits.at(-1);lineEffect([{x:drone.x,y:drone.y},{x:lastHit.x,y:lastHit.y}],'#65caff',.12);
    return true;
  }
  function updateDrones(dt){
    syncDrones();if(!drones.length)return;
    const s=stats('mining_drones');
    for(const drone of drones){
      drone.wander-=dt;drone.cooldown=Math.max(0,drone.cooldown-dt);
      if(drone.wander<=0||distance(drone,drone.goal)<8||distance(drone,ship)>s.roamRadius*1.5){drone.goal=droneWaypoint(s);drone.wander=1+Math.random()*2;}
      const dist=distance(drone,drone.goal),step=Math.min(s.moveSpeed*dt,dist);
      if(dist>0){drone.x+=(drone.goal.x-drone.x)/dist*step;drone.y+=(drone.goal.y-drone.y)/dist*step;}
    }
    assignDroneTargets(s);
    for(const drone of drones){
      if(planet.collapse!==null)break;
      if(drone.cooldown<=0&&fireDroneLaser(drone,s))drone.cooldown=s.cooldown;
    }
    // Drop dead reservations immediately, including targets hit by another laser's piercing tail.
    for(const drone of drones)if(drone.targetId!==null&&planet.blocks[drone.targetId].hp<=0)drone.targetId=null;
  }
  function detonateNuke(m,x,y){
    if(m.exploded)return;m.exploded=true;m.left=0;m.x=x;m.y=y;
    const radius=m.s.blastRadiusBlocks*CELL;
    for(const b of nearby(x,y,radius))if(distance(b,{x,y})<=radius)damage(b,m.damage);
    effects.push({type:'blast',x,y,r:radius,color:m.color,life:.65,max:.65});spark(x,y,m.color,24);
  }
  function advanceNuke(m,dt){
    if(m.exploded)return;
    const remaining=Math.hypot(m.tx-m.x,m.ty-m.y),travel=Math.min(m.s.projectileSpeed*dt,remaining),arrived=travel>=remaining;
    const nx=arrived?m.tx:m.x+(m.tx-m.x)/remaining*travel,ny=arrived?m.ty:m.y+(m.ty-m.y)/remaining*travel;
    m.trail.push({x:m.x,y:m.y});if(m.trail.length>16)m.trail.shift();
    for(const b of rayBlocks(m.x,m.y,nx,ny)){
      if(m.drilled.size>=m.s.drillBlocks)break;
      if(m.drilled.has(b.id)||b.hp<=0)continue;
      m.drilled.add(b.id);damage(b,b.hp);
    }
    m.x=nx;m.y=ny;m.left-=travel;
    if(arrived)detonateNuke(m,m.tx,m.ty);
  }
  function missileTarget(m){
    const target=aim();
    const candidates=planet.blocks.filter(b=>b.hp>0&&distance(b,m)<=m.s.seekRange&&[[1,0],[-1,0],[0,1],[0,-1]].some(([di,dj])=>{const neighbor=planet.grid.get(key(b.i+di,b.j+dj));return !neighbor||neighbor.hp<=0;}));
    candidates.sort((a,b)=>(distance(a,target)+distance(a,m)*.35)-(distance(b,target)+distance(b,m)*.35));
    const visible=[];
    for(const b of candidates){if(rayBlocks(m.x,m.y,b.x,b.y)[0]===b)visible.push(b);if(visible.length>=12)break;}
    return visible.length?visible[m.index%visible.length]:null;
  }
  function guideMissile(m,dt){
    if(m.pending){
      m.delay-=dt;if(m.delay>0)return false;
      m.pending=false;const angle=ship.angle+m.spread;
      m.x=ship.x+Math.cos(ship.angle)*17;m.y=ship.y+Math.sin(ship.angle)*17;
      m.vx=Math.cos(angle)*m.s.projectileSpeed;m.vy=Math.sin(angle)*m.s.projectileSpeed;
    }
    m.seekTimer-=dt;
    let target=m.targetId===null?null:planet.blocks[m.targetId];
    if(target&&(target.hp<=0||distance(target,m)>m.s.seekRange))target=null;
    if(!target&&m.seekTimer<=0){target=missileTarget(m);m.targetId=target?target.id:null;m.seekTimer=.15;}
    if(target){
      const angle=Math.atan2(m.vy,m.vx),desired=Math.atan2(target.y-m.y,target.x-m.x);
      const difference=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));
      const limit=m.s.turnRateDegrees*Math.PI/180*dt,heading=angle+clamp(difference,-limit,limit);
      m.vx=Math.cos(heading)*m.s.projectileSpeed;m.vy=Math.sin(heading)*m.s.projectileSpeed;
    }
    m.trail.push({x:m.x,y:m.y});if(m.trail.length>12)m.trail.shift();return true;
  }
  function update(dt){
    simTime+=dt;state.time+=dt;
    if(planet.collapse!==null){
      planet.collapse+=dt;
      if(planet.collapse>=1.4){
        // Collapse awards each surviving block once, using the same reward path.
        for(const b of planet.blocks)if(b.hp>0)damage(b,b.hp);
        effects=effects.slice(-450);particles=particles.slice(-650);completeLevel();
      }else updateHUD();
      return;
    }
    if(state.level===0){planet.compaction+=dt;if(planet.compaction>=1){planet.compaction-=1;compactMantle();}}
    const ax=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),ay=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0),length=Math.hypot(ax,ay)||1;
    ship.vx+=ax/length*850*dt;ship.vy+=ay/length*850*dt;
    const drag=Math.exp(-3.3*dt);ship.vx*=drag;ship.vy*=drag;
    const speed=Math.hypot(ship.vx,ship.vy);if(speed>260){ship.vx*=260/speed;ship.vy*=260/speed;}
    let x=clamp(ship.x+ship.vx*dt,-planet.halfW+20,planet.halfW-20),y=clamp(ship.y+ship.vy*dt,-planet.halfH+20,planet.halfH-20);
    if(!collides(x,ship.y))ship.x=x;else ship.vx=0;
    if(!collides(ship.x,y))ship.y=y;else ship.vy=0;
    const target=aim();ship.angle=Math.atan2(target.y-ship.y,target.x-ship.x);
    updateDrones(dt);
    const firing=keys.has('Space')||auto;
    for(const id of state.slots.filter(Boolean)){
      cooldowns[id]=Math.max(0,(cooldowns[id]||0)-dt);
      if(!firing)continue;
      const d=byId[id],s=stats(id);
      if(d.behavior==='mining_drones')continue;
      if(d.behavior==='orbiting_blade'){
        const angle=simTime*s.orbitSpeedDegrees*Math.PI/180,bx=ship.x+Math.cos(angle)*s.orbitRadius,by=ship.y+Math.sin(angle)*s.orbitRadius;
        for(const b of nearby(bx,by,s.bladeDiameter/2+8))if(distance(b,{x:bx,y:by})<s.bladeDiameter/2+8&&(sawHits.get(b.id)||0)<=simTime){damage(b,s.damage);sawHits.set(b.id,simTime+s.contactInterval);}
      }else if(cooldowns[id]<=0)fire(id);
    }
    for(const b of bullets){
      if(b.nuke){advanceNuke(b,dt);continue;}
      if(b.guided&&!guideMissile(b,dt))continue;
      const speed=Math.hypot(b.vx,b.vy),travel=Math.min(speed*dt,b.left),nx=b.x+b.vx/speed*travel,ny=b.y+b.vy/speed*travel;
      const hit=rayBlocks(b.x,b.y,nx,ny)[0];if(hit){
        if(b.guided){for(const block of nearby(hit.x,hit.y,b.s.blastRadius))if(distance(block,hit)<=b.s.blastRadius)damage(block,b.damage);effects.push({type:'blast',x:hit.x,y:hit.y,r:b.s.blastRadius,color:b.color,life:.25,max:.25});}
        else damage(hit,b.damage);
        b.left=0;
      }else b.left-=travel;
      b.x=nx;b.y=ny;
    }bullets=bullets.filter(b=>b.left>0);
    for(const shell of shells){shell.age+=dt;if(shell.age>=shell.duration){
      for(const b of nearby(shell.tx,shell.ty,shell.s.blastRadius))if(distance(b,{x:shell.tx,y:shell.ty})<=shell.s.blastRadius)damage(b,shell.s.damage);
      effects.push({type:'blast',x:shell.tx,y:shell.ty,r:shell.s.blastRadius,color:shell.color,life:.38,max:.38});spark(shell.tx,shell.ty,shell.color,15);
    }}shells=shells.filter(s=>s.age<s.duration);
    for(const b of blades){
      const old={x:b.x,y:b.y};b.age+=dt;
      if(!b.returning){
        const t=clamp(b.age/(b.s.cycleDuration*.5),0,1),curve=b.behavior==='returning_blade'?Math.sin(t*Math.PI)*(b.s.curveWidth||0):0;
        b.x=b.ox+Math.cos(b.angle)*b.s.range*t-Math.sin(b.angle)*curve;b.y=b.oy+Math.sin(b.angle)*b.s.range*t+Math.cos(b.angle)*curve;
        sweepBlade(b,old);
        if(t===1){b.returning=true;b.hits.clear();}
      }else{
        const dist=distance(b,ship),step=b.s.range/(b.s.cycleDuration*.5)*dt;
        b.x+=(ship.x-b.x)/Math.max(dist,.001)*Math.min(step,dist);b.y+=(ship.y-b.y)/Math.max(dist,.001)*Math.min(step,dist);
        sweepBlade(b,old);if(dist<=step+10)b.done=true;
      }
      if(b.age>b.s.maxLifetime)b.done=true;
    }blades=blades.filter(b=>!b.done);
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}particles=particles.filter(p=>p.life>0);
    for(const e of effects)e.life-=dt;effects=effects.filter(e=>e.life>0).slice(-450);
    saveTimer+=dt;hudTimer+=dt;
    if(saveTimer>3){saveTimer=0;save();}
    if(hudTimer>.1){hudTimer=0;updateHUD();}
    if(planet.remaining===0)completeLevel();
  }
  function sweepBlade(b,old){
    const steps=Math.max(1,Math.ceil(distance(old,b)/6));
    for(let n=1;n<=steps;n++){
      const x=old.x+(b.x-old.x)*n/steps,y=old.y+(b.y-old.y)*n/steps;
      for(const block of nearby(x,y,b.s.bladeDiameter/2+8))if(!b.hits.has(block.id)&&distance(block,{x,y})<b.s.bladeDiameter/2+8){b.hits.add(block.id);damage(block,b.s.damage);}
    }
  }
  function completeLevel(){
    const spec=levels[state.level];
    if(!state.paid.includes(state.level)){state.credits+=spec[3];state.paid.push(state.level);}
    $('completeEyebrow').textContent=state.level===9?'All ten planets cleared':'Demolition complete';
    $('completeTitle').textContent=state.level===9?'A quieter universe.':`${spec[0]} dismantled.`;
    $('bonus').textContent=`+${format(spec[3])} ◈`;
    $('completeText').textContent=`${format(spec[1])} blocks cleared. First-clear bonus recorded. ${state.level===9?'Campaign complete! Start again to try a new arsenal.':`Next destination: ${levels[state.level+1][0]}. Your equipment travels with you.`}`;
    $('nextBtn').textContent=state.level===9?'New campaign':'Next planet →';updateHUD();setMode('complete');
  }
  function nextLevel(){
    if(state.level===9){newCampaign();return;}
    state.level++;delete state.hp;delete state.ship;delete state.positions;delete state.collapse;delete state.compaction;planet=generatePlanet(state.level,state.seed);resetFlight();save();setMode('play');updateHUD();resize();
  }
  function resetFlight(){ship={x:0,y:-planet.radius-90,vx:0,vy:0,angle:Math.PI/2};bullets=[];blades=[];shells=[];effects=[];particles=[];cooldowns={};drones=[];sawHits.clear();pointer.moved=false;syncDrones();}
  function newCampaign(){if(!window.confirm('Start a new campaign? This resets all planets, credits, and weapon upgrades.'))return;state=freshState();auto=false;planet=generatePlanet(0);resetFlight();save();$('reducedMotion').checked=false;setMode('play');resize();updateHUD();}

  const stops=[[5,5,8],[89,16,24],[212,58,18],[255,149,0],[255,243,106]];
  function blockColor(b){const t=clamp((1-b.hp/b.max)*4,0,3.999),i=Math.floor(t),f=t-i,start=i===0?b.tint:stops[i];return `rgb(${start.map((v,k)=>Math.round(v+(stops[i+1][k]-v)*f)).join(',')})`;}
  const stars=Array.from({length:190},(_,i)=>({x:((i*7919)%1009)/1009,y:((i*3571)%1013)/1013,r:i%11===0?1.5:.65}));
  function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);view.w=rect.width;view.h=rect.height;view.dpr=dpr;view.scale=planet?Math.min(view.w/(planet.halfW*2),view.h/(planet.halfH*2)):1;view.ox=view.w/2;view.oy=view.h/2;}
  function drawBlade(x,y,r,color){
    ctx.save();ctx.translate(x,y);ctx.rotate(simTime*9);ctx.beginPath();for(let n=0;n<24;n++){const a=n/24*TAU,rr=n%2?r*.7:r;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;n?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle='#15222c';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.3,0,TAU);ctx.stroke();ctx.restore();
  }
  function draw(){
    const {w,h,dpr,scale,ox,oy}=view;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080c17';ctx.fillRect(0,0,w,h);
    for(const star of stars){ctx.fillStyle=star.r>1?'#465c78':'#25354d';ctx.fillRect(star.x*w,star.y*h,star.r,star.r);}
    if(!planet)return;
    ctx.translate(ox,oy);ctx.scale(scale,scale);
    ctx.strokeStyle='#172337';ctx.lineWidth=1/scale;ctx.setLineDash([3,12]);ctx.beginPath();ctx.arc(0,0,planet.radius+55,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#18273b';ctx.strokeRect(-planet.halfW+12,-planet.halfH+12,planet.halfW*2-24,planet.halfH*2-24);
    ctx.save();
    const collapseFraction=planet.collapse===null?0:clamp(planet.collapse/1.4,0,1);
    if(collapseFraction){const shrink=state.reduced?1:Math.max(.02,1-collapseFraction*collapseFraction);ctx.scale(shrink,shrink);ctx.globalAlpha=1-collapseFraction;}
    for(const b of planet.blocks){if(b.hp<=0)continue;const jitter=state.level===1&&collapseFraction&&!state.reduced?Math.sin(b.id*13+simTime*23)*collapseFraction*10:0;ctx.fillStyle=blockColor(b);ctx.fillRect(b.x-7.3+jitter,b.y-7.3-jitter,14.6,14.6);if(b.hp===b.max){ctx.strokeStyle=b.gold?'#ffd65f':b.phase==='gas'?'#386b99':'#364158';ctx.lineWidth=b.gold?1.2:.6;ctx.strokeRect(b.x-7.3+jitter,b.y-7.3-jitter,14.6,14.6);}if(b.gold){ctx.fillStyle='#ffdf75';ctx.fillRect(b.x-2,b.y-2,4,4);}}
    ctx.restore();
    for(const e of effects){ctx.globalAlpha=e.life/e.max;if(e.type==='flash'){ctx.fillStyle='#fff36a';ctx.fillRect(e.x-8,e.y-8,16,16);}else if(e.type==='blast'){ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1.3-e.life/e.max*.3),0,TAU);ctx.stroke();}else{
      ctx.strokeStyle=e.color;ctx.lineWidth=e.points.length>2?2:3;ctx.shadowColor=e.color;ctx.shadowBlur=state.reduced?0:12;ctx.beginPath();ctx.moveTo(e.points[0].x,e.points[0].y);
      for(let i=1;i<e.points.length;i++){const p=e.points[i-1],q=e.points[i];if(e.points.length>2){ctx.lineTo((p.x+q.x)/2+Math.sin(i*17+e.life*90)*9,(p.y+q.y)/2+Math.cos(i*11+e.life*60)*9);}ctx.lineTo(q.x,q.y);}ctx.stroke();ctx.shadowBlur=0;
    }}ctx.globalAlpha=1;
    for(const b of bullets){
      if(b.pending)continue;
      if(b.nuke){
        ctx.save();ctx.strokeStyle=b.color;ctx.lineWidth=3;
        ctx.globalAlpha=.3;ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.tx,b.ty,b.s.blastRadiusBlocks*CELL,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=3;
        if(!state.reduced){ctx.globalAlpha=.4;ctx.beginPath();b.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.globalAlpha=1;}
        ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.fillStyle='#402016';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(3,-6);ctx.lineTo(-10,-6);ctx.lineTo(-7,0);ctx.lineTo(-10,6);ctx.lineTo(3,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff0a0';ctx.fillRect(-17,-2,8,4);ctx.restore();continue;
      }
      if(b.guided){
        if(!state.reduced){ctx.strokeStyle='#ff7dce55';ctx.lineWidth=2;ctx.beginPath();b.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
        ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.fillStyle=b.color;ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-3);ctx.lineTo(-3,0);ctx.lineTo(-5,3);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe3a0';ctx.fillRect(-9,-1,5,2);ctx.restore();
      }else{ctx.strokeStyle=b.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.015,b.y-b.vy*.015);ctx.stroke();}
    }
    for(const s of shells){const t=s.age/s.duration,x=s.x+(s.tx-s.x)*t,y=s.y+(s.ty-s.y)*t-Math.sin(t*Math.PI)*60;ctx.strokeStyle=s.color;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(s.tx,s.ty,s.s.blastRadius,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(x,y,5+Math.sin(t*Math.PI)*3,0,TAU);ctx.fill();}
    for(const b of blades){if(b.behavior==='tethered_blade'){ctx.strokeStyle='#79dbff66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ship.x,ship.y);ctx.lineTo(b.x,b.y);ctx.stroke();}drawBlade(b.x,b.y,b.s.bladeDiameter/2,b.color);}
    if(mode==='play'&&(auto||keys.has('Space')))for(const id of state.slots.filter(Boolean)){if(byId[id].behavior==='orbiting_blade'){const s=stats(id),a=simTime*s.orbitSpeedDegrees*Math.PI/180;ctx.strokeStyle='#f58bbe22';ctx.beginPath();ctx.arc(ship.x,ship.y,s.orbitRadius,0,TAU);ctx.stroke();drawBlade(ship.x+Math.cos(a)*s.orbitRadius,ship.y+Math.sin(a)*s.orbitRadius,s.bladeDiameter/2,'#f58bbe');}}
    for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-1,p.y-1,2.5,2.5);}ctx.globalAlpha=1;
    for(const drone of drones){
      ctx.save();ctx.translate(drone.x,drone.y);ctx.rotate(drone.angle);ctx.strokeStyle='#65caff';ctx.fillStyle='#122b40';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(3,-6);ctx.lineTo(-6,-5);ctx.lineTo(-6,5);ctx.lineTo(3,6);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#b9edff';ctx.fillRect(-2,-2,4,4);ctx.strokeRect(-7,-9,8,3);ctx.strokeRect(-7,6,8,3);ctx.restore();
    }
    const target=aim();
    if(mode==='play'){ctx.strokeStyle='#7afce144';ctx.lineWidth=1;ctx.beginPath();ctx.arc(target.x,target.y,9,0,TAU);ctx.moveTo(target.x-14,target.y);ctx.lineTo(target.x-6,target.y);ctx.moveTo(target.x+6,target.y);ctx.lineTo(target.x+14,target.y);ctx.moveTo(target.x,target.y-14);ctx.lineTo(target.x,target.y-6);ctx.moveTo(target.x,target.y+6);ctx.lineTo(target.x,target.y+14);ctx.stroke();}
    ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);
    if(Math.hypot(ship.vx,ship.vy)>20){ctx.fillStyle='#7afce1';ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(-18-(state.reduced?0:Math.sin(simTime*55)*5),0);ctx.lineTo(-8,4);ctx.fill();ctx.globalAlpha=1;}
    ctx.shadowColor='#7afce1';ctx.shadowBlur=state.reduced?0:12;ctx.strokeStyle='#9affea';ctx.fillStyle='#142e35';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-10);ctx.lineTo(-5,0);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.restore();
    const b=blockAt(target.x,target.y);$('targetInfo').textContent=b&&b.hp>0?`${b.name} · ${Number(b.hp.toFixed(2))} / ${b.max} HP · ${b.reward} credits`:`${state.slots.some(Boolean)?'WASD to fly · Mouse to aim':'No weapons equipped · Open the armory'}${auto?' · AUTO ACTIVE':''}`;
  }
  function frame(now){const delta=Math.min((now-last)/1000||0,.1);last=now;if(mode==='play'){accumulator+=delta;while(accumulator>=1/60&&mode==='play'){update(1/60);accumulator-=1/60;}}else accumulator=0;draw();requestAnimationFrame(frame);}
  function toggleAuto(){if(!state||mode!=='play')return;auto=!auto;save();updateHUD();}
  function togglePause(){if(mode==='play')setMode('pause');else if(mode==='pause')setMode('play');else if(mode==='shop')setMode(shopReturn);}
  window.addEventListener('keydown',event=>{
    if(['Space','KeyW','KeyA','KeyS','KeyD','KeyF','KeyU','Escape'].includes(event.code)&&!['INPUT','TEXTAREA'].includes(event.target.tagName)){
      if(event.code==='Space'&&mode!=='play')return;
      event.preventDefault();if(event.repeat)return;
      if(event.code==='Escape'){togglePause();return;}if(event.code==='KeyU'){if(mode==='shop')setMode(shopReturn);else if(mode==='play'||mode==='pause')openShop();return;}if(event.code==='KeyF'){toggleAuto();return;}
      if(mode==='play')keys.add(event.code);
    }
    if(event.code==='Tab'&&mode!=='play'){
      const panel=$(mode),focusable=[...panel.querySelectorAll('button:not(:disabled),input')];if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  canvas.addEventListener('pointermove',event=>{const rect=canvas.getBoundingClientRect();pointer={x:(event.clientX-rect.left-view.ox)/view.scale,y:(event.clientY-rect.top-view.oy)/view.scale,moved:true};});
  window.addEventListener('blur',()=>{keys.clear();if(mode==='play')setMode('pause');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(mode==='play')setMode('pause');save();}});
  window.addEventListener('pagehide',save);window.addEventListener('resize',resize);
  $('startBtn').onclick=()=>{if(planet.remaining===0)completeLevel();else setMode('play');};
  $('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=()=>setMode('play');$('shopBtn').onclick=openShop;
  $('closeShop').onclick=()=>setMode(shopReturn);$('autoBtn').onclick=toggleAuto;$('restartBtn').onclick=newCampaign;
  $('completeShop').onclick=openShop;$('nextBtn').onclick=nextLevel;
  $('reducedMotion').onchange=event=>{state.reduced=event.target.checked;save();};
  async function init(){
    try{
      const response=await fetch('weapons.json');if(!response.ok)throw Error(`Weapon data returned HTTP ${response.status}`);
      const data=await response.json();if(data.schemaVersion!==1||!Array.isArray(data.weapons)||!data.weapons.length)throw Error('Invalid weapons.json');
      for(const d of data.weapons){if(!/^[a-z_]+$/.test(d.id)||byId[d.id]||!descriptions[d.behavior]||typeof d.name!=='string'||!d.baseStats||!Array.isArray(d.upgrades)||!Number.isFinite(d.unlockCost)||d.unlockCost<0)throw Error('Invalid weapon definition');
        // Text is inserted into the armory markup, so require plain display names.
        if(/[<>&"']/.test(d.name))throw Error('Weapon names must be plain text');
        for(const v of Object.values(d.baseStats))if(!Number.isFinite(v)||v<=0)throw Error('Invalid base statistic');
        d.upgrades.forEach((u,i)=>{if(u.level!==i+2||!Number.isFinite(u.cost)||u.cost<0||!u.modifiers)throw Error('Invalid upgrade');for(const operation of ['add','multiply'])for(const [k,v] of Object.entries(u.modifiers[operation]||{}))if(!(k in d.baseStats)||!Number.isFinite(v)||v<0||(operation==='multiply'&&v===0))throw Error('Invalid upgrade modifier');});
        byId[d.id]=d;
      }
      if(!byId.double_parallel_shot)throw Error('Missing starter weapon');
      definitions=data.weapons;load();resize();$('startBtn').disabled=false;$('startBtn').textContent=state.hp?'Resume flight →':'Launch ship →';$('startBtn').focus();requestAnimationFrame(frame);
    }catch(error){$('welcomeTitle').textContent='Flight systems offline';$('welcomeNote').textContent=`${error.message}. Open this demo through the project's local web server so weapons.json can load.`;$('startBtn').textContent='Unable to load weapons';console.error(error);}
  }
  init();
})();
