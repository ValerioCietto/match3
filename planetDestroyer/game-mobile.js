/* Planet Destroyer — buildless Canvas demo. Weapon balance lives in weapons.json. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const CELL = 16, SAVE_KEY = 'planetDestroyer.mobile.v1', TAU = Math.PI * 2;
  const touchControls={x:0,y:0,moveId:null,aimId:null,fireId:null};
  function clearTouchControls(){touchControls.x=0;touchControls.y=0;touchControls.moveId=null;touchControls.aimId=null;touchControls.fireId=null;$('moveKnob').style.transform='translate(-50%,-50%)';$('fireTouch').classList.toggle('active',false);}
  function touchFiring(){return touchControls.aimId!==null||touchControls.fireId!==null;}
  const levels = [
    ['Terra',1000,[.85,.65,.40,.20],200], ['Bedrock',1200,[.87,.68,.43,.22],250],
    ['Cinder',1400,[.88,.71,.46,.24],300], ['Basalt',1600,[.89,.73,.49,.27],350],
    ['Ironheart',1800,[.90,.75,.52,.30],400], ['Anvil',2000,[.91,.77,.55,.33],450],
    ['Turtle',2250,[.92,.79,.58,.36],500], ['Chaos',2500,[.93,.81,.61,.39],550],
    ['Obsidian',2750,[.94,.83,.64,.42],600], ['Last Sun',3000,[.95,.85,.67,.45],1000]
  ];
  const layerNames=['Crust','Upper mantle','Lower mantle','Outer core','Inner core'];
  const cinderHP=[15,30,60,90,120], cinderCredits=[2,4,6,8,12];
  const material=(name,hp,reward,tint,phase='solid',core=false)=>({name,max:hp,hp,reward,tint,phase,core});
  const HEX_SIZE=72;
  function hexSector(x,y){
    const q=(Math.sqrt(3)/3*x-y/3)/HEX_SIZE,r=2*y/3/HEX_SIZE;
    let a=Math.round(q),b=Math.round(-q-r),c=Math.round(r);
    const da=Math.abs(a-q),db=Math.abs(b+q+r),dc=Math.abs(c-r);
    if(da>db&&da>dc)a=-b-c;else if(db>dc)b=-a-c;else c=-a-b;
    const cx=HEX_SIZE*Math.sqrt(3)*(a+c/2),cy=HEX_SIZE*1.5*c,dx=x-cx,dy=y-cy;
    const face=Math.max(Math.abs(dx),Math.abs(dx*.5+dy*Math.sqrt(3)/2),Math.abs(-dx*.5+dy*Math.sqrt(3)/2));
    return {id:`${a}:${c}`,q:a,r:c,x:cx,y:cy,wall:HEX_SIZE*Math.sqrt(3)/2-face<CELL*.85};
  }
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
    if(index===3)return depth<2?material('Armored crust',100,8,[65,43,48]):material('Liquid interior',10,4,[101,58,34],'liquid');
    if(index===4){
      const sector=hexSector(x,y);
      const m=depth<2?material('City crust',200,10,[32,73,90]):sector.wall?material('Hex sector wall',250,12,[44,98,114]):material('Sector liquid',15,5,[20,37,68],'liquid');
      return {...m,sectorId:sector.id,civilized:true};
    }
    if(index===5){
      if(depth<3)return {...material('Regenerative shell',10,4,[38,100,67]),regen:10};
      if(r>.28)return {...material('Reflective liquid',10,5,[30,107,122],'liquid'),reflective:true};
      return material('Fortified core',80,10,[107,78,130],'solid',true);
    }
    if(index===6)return depth<5?{...material('Reflective shell',50,8,[55,104,62]),reflective:true,regenStep:5,regenInterval:.1}:material('Turtle core',10,5,[113,92,55],'solid',true);
    if(index===9)return sunMaterial(false);
    // Later planets retain their radial layout and scale beyond Cinder's new HP.
    const scale=index===2?1:1+(index-2)*.2;
    return material(layerNames[layer],Math.round(cinderHP[layer]*scale),cinderCredits[layer]+Math.max(0,index-2),index===2?[68,70,76]:[26,30,42]);
  }
  const colors=['#7afce1','#ffb76b','#c19aff','#f58bbe','#b2baff','#79dbff','#ffe080','#e6faff','#ff7dce','#adff73','#ff963e','#65caff','#e8fff1','#99ecff','#fff4b4','#ff784f'];
  const icons=['Ⅱ','⋰','ϟ','◉','⌒','↕','◔','⟶','⋙','⌖','☢','✥','❄','◎','✦','☀'];
  const descriptions={
    parallel_projectiles:'Two straight shots. A dependable tool for carving tunnels.',
    spread_projectiles:'A wide pellet fan that shreds crust and opens up the surface.',
    chain_lightning:'Hits exposed terrain, then grows a branching lightning tree. Upgrades add forks and longer branches. Each block is hit once per discharge.',
    orbiting_blade:'Upgrades add alternating-direction saws on separate orbits. Each successive saw is 10% larger, 10% slower, and deals 10% more damage.',
    lobbed_explosion:'Lobs to your aim point. Upgrades add scattered secondary mortars and midair splits. Secondary shots explode once without further branching.',
    tethered_blade:'Automatic tricks: Surface Dance follows exposed edges; String Storm performs figure eights inside cavities. Every combo ends with a snap return.',
    returning_blade:'A curved cutting pass, followed by a return to your ship.',
    piercing_beam:'An instant beam that drills through multiple layers.',
    guided_missiles:'A rapid flurry of homing missiles. Seeks exposed blocks near your aim and explodes on impact.',
    guided_laser:'Rapidly locks onto nearby blocks, regardless of aim. Each ray hits a different block, nearest first. Every upgrade adds one ray.',
    piercing_nuke:'Flies to your mouse position and detonates there. Drills up to 5 × level blocks on the way; blast radius is 4 × level block widths.',
    mining_drones:'Autonomous miners roam near the ship and reserve different nearest blocks. Each level adds a drone, one pierced block, and one laser damage.',
    plague:'Infectious snow falls toward the planet center. Infected blocks take damage every second and spread infection through sustained edge contact.',
    sun_killer:'Rapid physical projectiles. Upgrades add more powerful shots in a fan with 5° spacing. Ten volleys per second.',
    charged_shot:'Hold fire to charge toward your focus. Farther aim means more damage and a longer charge. Pierces without bouncing; shots over 50 damage ignore point defense.',
    shockwave:'Expanding thunder ring. Deals 2× outward, 1× sideways, and 0.5× inward damage, smoothly by angle. Pushes liquid; cannot be deflected. Upgrades increase range.'
  };
  let definitions=[], byId={}, state, planet, ship, mode='welcome', auto=false;
  let bullets=[], blades=[], shells=[], effects=[], particles=[], cooldowns={};
  let drones=[];
  let waves=[];
  let shockwaves=[];
  let snow=[],plagueContacts=new Map();
  let simTime=0, last=0, accumulator=0, saveTimer=0, hudTimer=0, selectedSlot=0, shopReturn='play';
  let view={w:1,h:1,scale:1,ox:0,oy:0}, pointer={x:0,y:0,moved:false};
  let keys=new Set(), toastTimer, storageOK=true, lastFocus=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const format=n=>Math.round(n).toLocaleString();
  const key=(i,j)=>`${i},${j}`;

  function generatePlanet(index,seed=12345+index*997) {
    if(index===8)return generateObsidian(seed);
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
      const depth=(radius-Math.hypot(x,y))/CELL;
      if(index===6&&depth>=5&&depth<7)continue; // Real empty space: no collision, reward, or plague bridge.
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
    if(index===7){
      let randomState=seed>>>0;
      const innerRadius=CELL/Math.sqrt(2);
      for(const b of blocks){
        randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;
        const roll=randomState/4294967296;
        const hp=1+Math.round(249*clamp((radius-Math.hypot(b.x,b.y))/(radius-innerRadius),0,1));
        if(roll<.4)Object.assign(b,material('Turtle blocks',hp,8,[55,104,62]),{reflective:true,regenStep:5,regenInterval:.1});
        else if(roll<.8)Object.assign(b,material('Liquid',hp,5,[30,107,122],'liquid'));
        else Object.assign(b,material('Gold',hp,10,[175,127,20]),{gold:true});
      }
    }
    if(index===9)for(const b of blocks.slice(0,300))Object.assign(b,sunMaterial(true));
    const chaosTotal=index===7?blocks.filter(b=>b.phase==='liquid'||b.gold).length:0;
    const coreTotal=blocks.filter(b=>b.core).length;
    const liquidTotal=blocks.filter(b=>b.phase==='liquid').length;
    const turrets=[];
    if([3,4,5,6].includes(index)){
      const turretCount=index===6?10:index===5?8:index===4?6:30,turretRange=index===5?600:index===3?150:320;
      const surface=blocks.filter(b=>index>=5?b.core:(radius-Math.hypot(b.x,b.y))/CELL<1),used=new Set();
      for(let n=0;n<turretCount;n++){
        const angle=n/turretCount*TAU-Math.PI/2,mountRadius=index===6?radius-7*CELL:index===5?radius*.28:radius,target={x:Math.cos(angle)*mountRadius,y:Math.sin(angle)*mountRadius};
        const anchor=surface.filter(b=>!used.has(b.id)).sort((a,b)=>distance(a,target)-distance(b,target)||a.id-b.id)[0];
        used.add(anchor.id);anchor.turret=true;
        const r=Math.hypot(anchor.x,anchor.y);
        turrets.push({blockId:anchor.id,x:anchor.x+anchor.x/r*13,y:anchor.y+anchor.y/r*13,cooldown:0,angle,range:turretRange,wave:index===5,waveCooldown:0});
      }
    }
    return {blocks,grid,radius,turrets,remaining:blocks.length,total:blocks.length,coreTotal,coreRemaining:coreTotal,liquidTotal,liquidRemaining:liquidTotal,chaosTotal,chaosRemaining:chaosTotal,collapseOnTurtleOnly:index===7,collapseOnLiquid:index===3,collapseOnCore:index<2||index===6,collapse:null,compaction:0,regenAccumulator:0,growthTimer:0,growthSeed:seed>>>0,halfW:index===9?1200:Math.max(600,radius+220),halfH:index===9?1000:Math.max(450,radius+170)};
  }
  function sunMaterial(core){return {...material(core?'Solar core':'Solar liquid',core?150:50,core?12:6,core?[200,100,20]:[150,55,18],'liquid',core),energyHealing:true,plagueImmune:true};}
  function growSunBlock(source,core,di,dj){
    if(source.hp<=0||!source.core||(core&&planet.coreRemaining>=1000)||(!di&&!dj))return false;
    const chain=[];let i=source.i+di,j=source.j+dj;
    while(planet.grid.get(key(i,j))?.hp>0){chain.push(planet.grid.get(key(i,j)));i+=di;j+=dj;}
    const x=(i+.5)*CELL,y=(j+.5)*CELL;
    if(Math.abs(x)>planet.halfW-32||Math.abs(y)>planet.halfH-32)return false;
    for(const b of chain)if(Math.hypot(ship.x-(b.x+di*CELL),ship.y-(b.y+dj*CELL))<24)return false;
    if(Math.hypot(ship.x-(source.x+di*CELL),ship.y-(source.y+dj*CELL))<24)return false;
    for(const b of chain.reverse()){planet.grid.delete(key(b.i,b.j));b.i+=di;b.j+=dj;b.x=(b.i+.5)*CELL;b.y=(b.j+.5)*CELL;planet.grid.set(key(b.i,b.j),b);}
    const b={id:planet.blocks.length,i:source.i+di,j:source.j+dj,x:source.x+di*CELL,y:source.y+dj*CELL,layer:0,...sunMaterial(core)};
    planet.blocks.push(b);planet.grid.set(key(b.i,b.j),b);planet.total++;planet.remaining++;planet.liquidTotal++;planet.liquidRemaining++;if(core){planet.coreTotal++;planet.coreRemaining++;}return true;
  }
  function updateSunGrowth(dt){
    if(state.level!==9)return;planet.growthTimer+=dt;
    const random=()=>{planet.growthSeed=(Math.imul(planet.growthSeed,1664525)+1013904223)>>>0;return planet.growthSeed/4294967296;};
    while(planet.growthTimer>=1){planet.growthTimer-=1;
      const sources=planet.blocks.filter(b=>b.hp>0&&b.core);
      for(const source of sources){
        const coreRoll=random(),liquidRoll=random();
        for(const [core,roll,chance] of [[true,coreRoll,.01],[false,liquidRoll,.05]])if(roll<chance){
          const directions=[];for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++)if((di||dj)&&source.x*di+source.y*dj>=0)directions.push([di,dj]);
          const [di,dj]=directions[Math.floor(random()*directions.length)];growSunBlock(source,core,di,dj);
        }
      }
    }
  }
  function freshState(){return {version:2,seed:Math.floor(Math.random()*4294967296),level:0,credits:0,owned:{double_parallel_shot:1},slots:['double_parallel_shot',null,null],paid:[],auto:false,reduced:false,time:0};}
  function generateObsidian(seed){
    let randomState=seed>>>0;
    const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return (randomState+.5)/4294967296;};
    const radius=600,blocks=[],grid=new Map(),turrets=[],moons=[];
    const add=(i,j,m)=>{const b={id:blocks.length,i,j,x:(i+.5)*CELL,y:(j+.5)*CELL,layer:0,...m};blocks.push(b);grid.set(key(i,j),b);return b;};
    const candidates=[];
    for(let i=-38;i<38;i++)for(let j=-38;j<38;j++){
      const r=Math.hypot(i+.5,j+.5)*CELL/radius;if(r>1)continue;
      candidates.push({i,j,score:-Math.log(random())/(.12+.88*(1-r)**2)});
    }
    candidates.sort((a,b)=>a.score-b.score);
    for(const cell of candidates.slice(0,2750)){const hp=10+Math.floor(random()*41);add(cell.i,cell.j,{...material('Violet liquid',hp,8,[90,35,145],'liquid'),regen:hp*.1});}
    for(const [moonIndex,count,turretCount,offset] of [[0,200,4,-54],[1,400,6,56]]){
      const cells=[];for(let i=-16;i<16;i++)for(let j=-16;j<16;j++)cells.push({i,j,d:Math.hypot(i+.5,j+.5)});
      cells.sort((a,b)=>a.d-b.d||a.i-b.i||a.j-b.j);
      const moon={x:offset*CELL,y:0,radius:cells[count-1].d*CELL,count,turretCount};moons.push(moon);
      const members=cells.slice(0,count).map(c=>add(c.i+offset,c.j,{...material('Moon Turtle blocks',50,8,[55,104,62]),optional:true,moon:moonIndex,reflective:true,regenStep:5,regenInterval:.1}));
      const used=new Set();
      for(let n=0;n<turretCount;n++){
        const angle=n/turretCount*TAU,target={x:moon.x+Math.cos(angle)*moon.radius,y:moon.y+Math.sin(angle)*moon.radius};
        const anchor=members.filter(b=>!used.has(b.id)).sort((a,b)=>distance(a,target)-distance(b,target))[0];used.add(anchor.id);anchor.turret=true;
        const r=distance(anchor,moon),dx=(anchor.x-moon.x)/r,dy=(anchor.y-moon.y)/r;
        turrets.push({blockId:anchor.id,x:anchor.x+dx*13,y:anchor.y+dy*13,cooldown:0,angle,range:320,wave:false,waveCooldown:0,moon:moonIndex});
      }
    }
    return {blocks,grid,radius,turrets,moons,total:blocks.length,remaining:blocks.length,coreTotal:0,coreRemaining:0,liquidTotal:2750,liquidRemaining:2750,chaosTotal:0,chaosRemaining:0,collapse:null,compaction:0,regenAccumulator:0,halfW:1200,halfH:770};
  }
  function levelCleared(){return state.level===8?planet.liquidRemaining===0:planet.remaining===0;}
  function load(incoming) {
    chargedShot=null;
    state=freshState();
    try {
      const raw=incoming?JSON.stringify(incoming):localStorage.getItem(SAVE_KEY);
      if(raw){
        const s=JSON.parse(raw);
        if(![1,2].includes(s.version)||!Number.isInteger(s.level)||s.level<0||s.level>=10||!Number.isFinite(s.credits)||s.credits<0||!s.owned||!Array.isArray(s.slots)||s.slots.length!==3||!Array.isArray(s.paid)) throw Error('Invalid save');
        for(const [id,level] of Object.entries(s.owned)) if(!byId[id]||!Number.isInteger(level)||level<1||level>byId[id].upgrades.length+1) throw Error('Invalid weapon level');
        const equipped=s.slots.filter(Boolean);
        if(new Set(equipped).size!==equipped.length||equipped.some(id=>!s.owned[id])) throw Error('Invalid loadout');
        if(s.paid.some(i=>!Number.isInteger(i)||i<0||i>=10)) throw Error('Invalid completion state');
        state={...state,...s,time:Number.isFinite(s.time)?Math.max(0,s.time):0};
        if(s.level===3&&s.basaltRevision!==1){delete state.hp;delete state.positions;delete state.ship;delete state.turretCooldowns;toast('Basalt defenses updated. Equipment and credits kept; this planet has been rebuilt.');}
        if(s.level===4&&s.ironheartRevision!==1){delete state.hp;delete state.positions;delete state.ship;delete state.turretCooldowns;toast('Ironheart sectors updated. Equipment and credits kept; this planet has been rebuilt.');}
        if(s.level===5&&s.anvilRevision!==1){delete state.hp;delete state.positions;delete state.ship;delete state.turretCooldowns;delete state.waveCooldowns;toast('Anvil updated. Equipment and credits kept; this planet has been rebuilt.');}
        if(s.level===6&&s.turtleRevision!==1){delete state.hp;delete state.positions;delete state.ship;delete state.plagued;delete state.plagueContacts;delete state.collapse;delete state.turretCooldowns;delete state.regenAccumulator;toast('Crucible is now Turtle. Equipment and credits kept; the planet has been rebuilt.');}
        if(s.level===7&&s.chaosRevision!==1){for(const field of ['hp','positions','ship','plagued','plagueContacts','collapse','compaction','regenAccumulator'])delete state[field];toast('Titan is now Chaos. Equipment and credits kept; the planet has been rebuilt.');}
        if(s.level===8&&s.obsidianRevision!==1){for(const field of ['hp','positions','ship','plagued','plagueContacts','collapse','compaction','regenAccumulator','turretCooldowns'])delete state[field];toast('Obsidian and its moons updated. Equipment and credits kept.');}
        if(s.version===1){delete state.hp;delete state.positions;delete state.ship;state.version=2;toast('Planet materials updated. Equipment and credits kept; the current planet has been rebuilt.');}
        if(!Number.isInteger(state.seed))state.seed=12345;
        $('welcomeNote').textContent='Flight log found. Resume your damaged planet with all equipment and credits intact.';
      }
    }catch(error){
      if(error instanceof SyntaxError||error.message.startsWith('Invalid')) toast('Unreadable flight log. Starting a fresh campaign.');
      else {storageOK=false; $('saveStatus').textContent='Session only · storage unavailable';}
    }
    planet=generatePlanet(state.level,state.seed);
    if(state.level===9){
      if(state.sunRevision!==1){for(const field of ['hp','positions','ship','plagued','plagueContacts','collapse'])delete state[field];}
      else if(Array.isArray(state.sunBlocks)&&state.sunBlocks.length>=3000){
        const occupied=new Set();let cores=0;
        const valid=state.sunBlocks.every(b=>{if(!Array.isArray(b)||b.length!==4)return false;const [i,j,core,hp]=b;if(!Number.isInteger(i)||!Number.isInteger(j)||typeof core!=='boolean'||!Number.isFinite(hp)||hp<0||hp>(core?150:50)||Math.abs((i+.5)*CELL)>planet.halfW-16||Math.abs((j+.5)*CELL)>planet.halfH-16)return false;if(hp>0){if(occupied.has(key(i,j)))return false;occupied.add(key(i,j));if(core)cores++;}return true;});
        if(valid&&cores<=1000){planet.blocks=state.sunBlocks.map(([i,j,core,hp],id)=>({id,i,j,x:(i+.5)*CELL,y:(j+.5)*CELL,layer:0,...sunMaterial(core),hp}));planet.total=planet.blocks.length;planet.coreTotal=planet.blocks.filter(b=>b.core).length;planet.liquidTotal=planet.total;}
        delete state.hp;delete state.positions;
      }
      planet.growthTimer=Number.isFinite(state.sunTimer)?clamp(state.sunTimer,0,.999999):0;planet.growthSeed=Number.isInteger(state.sunSeed)?state.sunSeed>>>0:state.seed>>>0;
    }
    if(Array.isArray(state.hp)&&state.hp.length===planet.total&&state.hp.every((hp,i)=>Number.isFinite(hp)&&hp>=0&&hp<=planet.blocks[i].max)){
      planet.blocks.forEach((b,i)=>b.hp=state.hp[i]); planet.remaining=planet.blocks.filter(b=>b.hp>0).length;
    }
    if(Array.isArray(state.positions)&&state.positions.length===planet.total){
      const occupied=new Set();
      const valid=state.positions.every((p,i)=>{
        const b=planet.blocks[i];
        if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||(!b.optional&&Math.hypot(p[0]+.5,p[1]+.5)*CELL>planet.radius+(b.phase==='liquid'?96:.01)))return false;
        if(b.phase!=='liquid'&&(p[0]!==b.i||p[1]!==b.j))return false;
        if(b.hp>0){const k=key(...p);if(occupied.has(k))return false;occupied.add(k);}return true;
      });
      if(valid)planet.blocks.forEach((b,i)=>{[b.i,b.j]=state.positions[i];b.x=(b.i+.5)*CELL;b.y=(b.j+.5)*CELL;});
    }
    if(state.paid.includes(state.level)&&!state.replaying)planet.blocks.forEach(b=>{if(!b.optional)b.hp=0;});
    rebuildGrid();
    planet.coreRemaining=planet.blocks.filter(b=>b.core&&b.hp>0).length;
    planet.liquidRemaining=planet.blocks.filter(b=>b.phase==='liquid'&&b.hp>0).length;
    planet.chaosRemaining=planet.collapseOnTurtleOnly?planet.blocks.filter(b=>b.hp>0&&(b.phase==='liquid'||b.gold)).length:0;
    planet.remaining=planet.blocks.filter(b=>b.hp>0).length;
    plagueContacts=new Map();
    if(state.owned.plague&&Array.isArray(state.plagued)&&state.plagueLevel===state.level){
      for(const id of state.plagued)if(Number.isInteger(id)&&planet.blocks[id]?.hp>0&&!planet.blocks[id].plagueImmune)planet.blocks[id].plagued=true;
      if(Array.isArray(state.plagueContacts))for(const contact of state.plagueContacts){
        if(!Array.isArray(contact)||contact.length!==3)continue;
        const [sourceId,targetId,elapsed]=contact,source=planet.blocks[sourceId],target=planet.blocks[targetId];
        if(source?.plagued&&source.hp>0&&target?.hp>0&&!target.plagued&&Math.abs(source.i-target.i)+Math.abs(source.j-target.j)===1&&Number.isFinite(elapsed)&&elapsed>=0)plagueContacts.set(`${sourceId}:${targetId}`,Math.min(elapsed,stats('plague').spreadSeconds));
      }
    }
    planet.turrets.forEach((t,i)=>{const cd=state.turretCooldowns?.[i],wcd=state.waveCooldowns?.[i];t.cooldown=Number.isFinite(cd)?clamp(cd,0,.35):0;t.waveCooldown=Number.isFinite(wcd)?clamp(wcd,0,1.6):0;});
    planet.compaction=Number.isFinite(state.compaction)?clamp(state.compaction,0,.999):0;
    planet.regenAccumulator=Number.isFinite(state.regenAccumulator)?clamp(state.regenAccumulator,0,.099999):0;
    if(collapseReady()&&planet.remaining>0)planet.collapse=Number.isFinite(state.collapse)?clamp(state.collapse,0,1.4):0;
    ship={x:0,y:-planet.radius-90,vx:0,vy:0,angle:Math.PI/2};
    if(state.ship&&Number.isFinite(state.ship.x)&&Number.isFinite(state.ship.y)){
      ship.x=clamp(state.ship.x,-planet.halfW+20,planet.halfW-20); ship.y=clamp(state.ship.y,-planet.halfH+20,planet.halfH-20);
      if(collides(ship.x,ship.y)){ship.x=0;ship.y=-planet.radius-90;}
    }
    auto=!!state.auto;
    $('reducedMotion').checked=!!state.reduced;
    cooldowns={}; for(const d of definitions) cooldowns[d.id]=.3;
    drones=[];waves=[];snow=[];shockwaves=[];syncDrones();
    updateHUD();
  }
  function save(){
    if(!state||!planet)return;
    state.hp=planet.blocks.map(b=>b.hp);state.ship={x:ship.x,y:ship.y};state.auto=auto;
    if(state.level===9){state.sunRevision=1;state.sunBlocks=planet.blocks.map(b=>[b.i,b.j,!!b.core,b.hp]);state.sunTimer=planet.growthTimer;state.sunSeed=planet.growthSeed;}
    state.positions=planet.blocks.map(b=>[b.i,b.j]);state.collapse=planet.collapse;state.compaction=planet.compaction;
    state.basaltRevision=1;state.turretCooldowns=planet.turrets.map(t=>t.cooldown);
    state.ironheartRevision=1;
    state.anvilRevision=1;state.waveCooldowns=planet.turrets.map(t=>t.waveCooldown);
    state.turtleRevision=1;state.chaosRevision=1;state.obsidianRevision=1;state.regenAccumulator=planet.regenAccumulator;
    state.plagueLevel=state.level;state.plagued=planet.blocks.filter(b=>b.hp>0&&b.plagued).map(b=>b.id);
    state.plagueContacts=[...plagueContacts].map(([key,elapsed])=>[...key.split(':').map(Number),elapsed]);
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
    if(next!=='play')chargedShot=null;
    clearTouchControls();$('touchDeck').hidden=next!=='play';
    const previous=mode;mode=next;keys.clear();
    if(previous==='play'&&next!=='play')lastFocus=document.activeElement;
    for(const id of ['welcome','shop','pause','complete','galaxy'])$(id).hidden=next!==id;
    if(next!=='play') {save(); const first=$(next)?.querySelector('button:not(:disabled)'); first?.focus();}
    else if(lastFocus){lastFocus.blur();lastFocus=null;}
    $('pauseBtn').textContent=next==='pause'?'Resume':'Pause';
  }
  function updateHUD(){
    if(!planet)return;
    const spec=levels[state.level], objectiveRemaining=state.level===8?planet.liquidRemaining:planet.remaining,objectiveTotal=state.level===8?planet.liquidTotal:planet.total,percentage=(1-objectiveRemaining/objectiveTotal)*100;
    $('credits').textContent=format(state.credits);$('planetName').textContent=spec[0];
    $('planetLabel').textContent=`${spec[0]} · ${format(planet.total)} destructible blocks`;
    $('levelLabel').textContent=`Sector ${String(state.level+1).padStart(2,'0')} / 10`;
    $('progress').style.width=`${percentage}%`;$('percent').textContent=`${percentage.toFixed(1)}% cleared`;
    $('remaining').textContent=`${format(objectiveRemaining)} blocks`;
    $('planetObjective').textContent=planet.collapseOnCore?`Destroy the core: ${planet.coreRemaining} / ${planet.coreTotal} blocks left${planet.collapse!==null?' · COLLAPSING':''}`:state.level===2?`Gold remaining: ${planet.blocks.filter(b=>b.gold&&b.hp>0).length} / 100 · 10 credits each`:planet.turrets.length?`Point defense: ${planet.turrets.filter(t=>planet.blocks[t.blockId].hp>0).length} / ${planet.turrets.length} · ${state.level===5?'Core waves · Shell regenerates 10 HP/s':state.level===4?'Long-range sector defenses':'Destroy their crust mounts'}`:'Destroy every block to advance';
    if(planet.collapseOnTurtleOnly)$('planetObjective').textContent=`Liquid + gold: ${planet.chaosRemaining} / ${planet.chaosTotal} · ${planet.collapse!==null?'COLLAPSING':'Destroy both to collapse Chaos'}`;
    if(state.level===8)$('planetObjective').textContent=`Violet liquid: ${planet.liquidRemaining} / ${planet.liquidTotal} · Regen 10% max HP/s · Moons optional · Defenses: ${planet.turrets.filter(t=>planet.blocks[t.blockId].hp>0).length} / 10`;
    if(state.level===9)$('planetObjective').textContent=`Growing core: ${planet.coreRemaining} / 1,000 · Energy heals · Plague immune · Clear all liquid`;
    const plagueCount=planet.blocks.filter(b=>b.hp>0&&b.plagued).length;if(plagueCount)$('planetObjective').textContent+=` · ${plagueCount} plagued`;
    if(planet.collapseOnLiquid)$('planetObjective').textContent=`Liquid: ${planet.liquidRemaining} / ${planet.liquidTotal} · ${planet.collapse!==null?'COLLAPSING · ':''}`+$('planetObjective').textContent;
    if(state.level===6)$('planetObjective').textContent+=` · Defense: ${planet.turrets.filter(t=>planet.blocks[t.blockId].hp>0).length} / 10 · Shell +5 HP / 0.1s`;
    const materials=new Map();for(const b of planet.blocks){const entry=materials.get(b.name)||{min:b.max,max:b.max};entry.min=Math.min(entry.min,b.max);entry.max=Math.max(entry.max,b.max);materials.set(b.name,entry);}
    $('composition').innerHTML=[...materials].map(([name,hp])=>`<span>${name}</span><b>${hp.min===hp.max?hp.min:`${hp.min}–${hp.max}`} HP</b>`).join('');
    $('autoBtn').classList.toggle('active',auto);$('autoBtn').setAttribute('aria-pressed',String(auto));$('autoBtn').innerHTML=`Auto fire: ${auto?'ON':'OFF'} `;
    $('loadout').innerHTML=state.slots.map((id,i)=>{
      if(!id)return `<div class="slot"><small>0${i+1} / EMPTY SLOT</small><div>Visit the armory</div></div>`;
      const s=stats(id),period=s.cooldown||s.cycleDuration||s.contactInterval;
      const ready=s.maxCharge?(chargedShot?.id===id&&chargedShot.shot?clamp(chargedShot.elapsed/chargedShot.shot.duration,0,1)*100:0):clamp(1-(cooldowns[id]||0)/period,0,1)*100;
      return `<div class="slot"><small>0${i+1} / LEVEL ${state.owned[id]}${s.droneCount?' · AUTONOMOUS':''}</small><div>${byId[id].name}</div><div class="bar"><i style="width:${ready}%"></i></div></div>`;
    }).join('');
  }
  function openShop(){if(!state||mode==='welcome')return;shopReturn=levelCleared()?'complete':'play';selectedSlot=Math.max(0,state.slots.indexOf(null));setMode('shop');renderShop();}
  function renderShop(){
    $('shopCredits').textContent=format(state.credits);
    $('shopSlots').innerHTML=state.slots.map((id,i)=>`<button class="shop-slot ${selectedSlot===i?'selected':''}" data-slot="${i}"><small>SLOT 0${i+1}${selectedSlot===i?' · SELECTED':''}</small>${id?byId[id].name:'Empty slot'}</button>`).join('');
    $('weaponGrid').innerHTML=definitions.map((d,i)=>{
      const owned=state.owned[d.id]||0,s=stats(d.id),next=d.upgrades.find(u=>u.level===owned+1),equipped=state.slots.includes(d.id);
      const timing=s.cooldown||s.cycleDuration||s.contactInterval;
      const special=d.behavior==="sun_killer"?`${s.projectileCount} projectiles · ${s.range} range<br>${format(s.damage*s.projectileCount/s.cooldown)} potential DPS${s.projectileCount>1?" · 5° spacing":""}`:s.maxCharge?`1–${s.damage*s.maxCharge} damage · ${s.minCooldown}–${s.maxCharge}s charge<br>${s.range} max range · physical piercing`:s.blastCount?`${s.splitCount} primary ${s.splitCount===1?"shot":"shots"} · ${s.blastCount-1} secondaries each<br>${s.blastCount>1?s.secondaryRange+" scatter range":"No secondary explosions"}`:s.rootBranches?`${s.rootBranches} initial ${s.rootBranches===1?"branch":"branches"} · ${s.branchDepth} tiers<br>${Array.from({length:s.branchDepth},(_,i)=>`T${i+1}: ${s[`tier${i+1}Min`]}–${s[`tier${i+1}Max`]} blocks`).join(" · ")}`:s.contourSteps?`2 automatic combos · ${s.contourSteps} contour steps · ${s.loopCount} figure-eight ${s.loopCount===1?"pass":"passes"}`:s.sawCount?`${s.sawCount} saws · ${buzzsawDPS(s).toFixed(1)} contact DPS · alternating orbits`:s.spreadSeconds?`${s.damage} damage/s · ${Number(s.spreadSeconds.toFixed(2))}s contact to spread`:s.droneCount?`${s.droneCount} drones · ${s.penetration} blocks pierced · autonomous`:s.drillBlocks?`${s.drillBlocks} blocks drilled · ${s.blastRadiusBlocks}-block blast radius`:s.rayCount?`${s.rayCount} ${s.rayCount===1?'ray':'rays'} on different blocks · ${(1/s.cooldown).toFixed(1)} pulses/s`:s.missileCount?`${s.missileCount} guided missiles · ${s.blastRadius} blast radius`:s.pelletCount?`${s.pelletCount} pellets`:s.maxTargets?`${s.maxTargets} targets`:s.penetration?`${s.penetration} blocks pierced`:s.blastRadius?`${s.blastRadius} blast radius`:s.orbitRadius?`${s.orbitRadius} orbit radius`:`${Math.round(s.range)} range`;
      let preview='';
      if(next)preview=Object.entries(next.modifiers.add).map(([k,v])=>`+${Number(v.toFixed(2))} ${k.replace(/([A-Z])/g,' $1').toLowerCase()}`).join(' · ')+(Object.values(next.modifiers.multiply||{}).some(v=>v===.92)?' · 8% faster':'')+(next.modifiers.multiply?.spreadSeconds?` · ${(s.spreadSeconds*next.modifiers.multiply.spreadSeconds).toFixed(2)}s spread`:'');
      return `<article class="weapon-card"><div class="weapon-icon" style="color:${colors[i]}">${icons[i]}</div><div><h3>${d.name}</h3><div class="badge">${owned?`LEVEL ${owned} / ${d.upgrades.length+1}${equipped?' · EQUIPPED':''}`:'LOCKED'}</div></div><p>${descriptions[d.behavior]}</p><div class="numbers">${Number(s.damage.toFixed(2))} ${s.spreadSeconds ? "damage/s" : "damage"} · ${timing.toFixed(2)}s<br>${special}</div><div class="actions">${!owned?`<button class="primary" data-buy="${d.id}" ${state.credits<d.unlockCost?'disabled':''}>Unlock · ${d.unlockCost} ◈</button>`:`<button data-upgrade="${d.id}" ${!next||state.credits<next.cost?'disabled':''}>${next?`Upgrade · ${next.cost} ◈`:'Maximum level'}</button><button data-equip="${d.id}">${equipped?'Unequip':`Equip in slot ${selectedSlot+1}`}</button>`}</div>${owned&&next?`<small class="eyebrow" style="letter-spacing:0;text-transform:none">Next: ${preview}</small>`:''}</article>`;
    }).join('');
    $('shopMessage').textContent=`Slot ${selectedSlot+1} selected. ${state.slots[selectedSlot]?'Equipping another weapon replaces this slot.':'Ready for a weapon.'}`;
  }
  $('shop').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.slot!==undefined){selectedSlot=Number(button.dataset.slot);renderShop();return;}
    const {buy,upgrade,equip}=button.dataset;
    if(buy){const d=byId[buy];if(state.owned[buy]||state.credits<d.unlockCost)return;state.credits-=d.unlockCost;state.owned[buy]=1;toast(`${d.name} unlocked. Equip it in a slot.`);}
    if(upgrade){const next=byId[upgrade].upgrades.find(u=>u.level===state.owned[upgrade]+1);if(!next||state.credits<next.cost)return;state.credits-=next.cost;state.owned[upgrade]=next.level;}
    if(equip&&state.owned[equip]){const existing=state.slots.indexOf(equip);if(existing>=0)state.slots[existing]=null;else state.slots[selectedSlot]=equip;blades=[];chargedShot=null;cooldowns[equip]=.2;}
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
  function collapseReady(){return (planet.collapseOnCore&&planet.coreRemaining===0)||(planet.collapseOnLiquid&&planet.liquidRemaining===0)||(planet.collapseOnTurtleOnly&&planet.chaosRemaining===0);}
  function damage(b,amount,type='physical'){
    if(!b||b.hp<=0)return;
    if(type==='energy'&&b.energyHealing){b.hp=Math.min(b.max,b.hp+amount);spark(b.x,b.y,'#ffef8a',1);return;}
    b.hp=Math.max(0,b.hp-amount);
    if(b.hp===0){planet.remaining--;state.credits+=b.reward;if(b.core)planet.coreRemaining--;if(b.phase==='liquid')planet.liquidRemaining--;effects.push({type:'flash',x:b.x,y:b.y,life:.16,max:.16});spark(b.x,b.y,'#ffe080',4);
      if(planet.collapseOnTurtleOnly&&(b.phase==='liquid'||b.gold))planet.chaosRemaining--;
      if(collapseReady()&&planet.collapse===null){planet.collapse=0;bullets=[];shells=[];blades=[];shockwaves=[];toast(planet.collapseOnTurtleOnly?'Only Turtle blocks remain. Chaos is collapsing!':planet.collapseOnLiquid?'Liquid interior destroyed. Basalt is collapsing!':`Core destroyed. ${levels[state.level][0]} is collapsing!`);}
    }
    else spark(b.x,b.y,'#ffad45',1);
  }
  function lineEffect(points,color,life=.17){effects.push({type:'line',points,color,life,max:life});}
  function aim(){return pointer.moved?{x:pointer.x,y:pointer.y}:{x:0,y:0};}
  function fire(id){
    const d=byId[id],s=stats(id),a=ship.angle,color=colors[definitions.indexOf(d)],target=aim();
    const direction={x:Math.cos(a),y:Math.sin(a)};
    switch(d.behavior){
      case 'charged_shot':if(!chargedShot)chargedShot={id,elapsed:0};return;
      case 'shockwave':shockwaves.push({x:ship.x,y:ship.y,radius:0,s,color,hits:new Set()});break;
      case 'plague':
        for(let n=0;n<s.particleCount&&snow.length<400;n++){
          const heading=a+(Math.random()-.5)*s.spreadDegrees*Math.PI/180;
          snow.push({x:ship.x+direction.x*17,y:ship.y+direction.y*17,vx:Math.cos(heading)*s.projectileSpeed,vy:Math.sin(heading)*s.projectileSpeed,life:s.lifetime,gravity:s.gravity,maxSpeed:s.maxSpeed,size:1.5+Math.random()*2});
        }break;
      case 'mining_drones':return; // Drone lasers have their own autonomous firing loop.
      case 'piercing_nuke':{
        const heading=Math.atan2(target.y-ship.y,target.x-ship.x);
        bullets.push({nuke:true,x:ship.x,y:ship.y,tx:target.x,ty:target.y,vx:Math.cos(heading)*s.projectileSpeed,vy:Math.sin(heading)*s.projectileSpeed,left:distance(target,ship),damage:s.damage,color,s,drilled:new Set(),trail:[],exploded:false});
        break;
      }
      case 'guided_laser':{
        const targets=planet.blocks.filter(b=>b.hp>0&&distance(b,ship)<=s.range)
          .sort((a,b)=>distance(a,ship)-distance(b,ship)||a.id-b.id).slice(0,s.rayCount);
        for(const [ray,block] of targets.entries()){
          const angle=Math.atan2(block.y-ship.y,block.x-ship.x),offset=(ray-(targets.length-1)/2)*5;
          lineEffect([{x:ship.x-Math.sin(angle)*offset,y:ship.y+Math.cos(angle)*offset},{x:block.x,y:block.y}],color,Math.min(.06,s.cooldown*.7));
          damage(block,s.damage,'energy');
        }
        break;
      }
      case 'guided_missiles':
        for(let n=0;n<s.missileCount;n++)bullets.push({guided:true,pending:true,delay:n*s.burstInterval,spread:(n/Math.max(1,s.missileCount-1)-.5)*s.spreadDegrees*Math.PI/180,index:n,x:ship.x,y:ship.y,vx:0,vy:0,left:s.range,damage:s.damage,color,s,trail:[],seekTimer:0,targetId:null});
        break;
      case 'sun_killer':
        for(let n=0;n<s.projectileCount;n++){
          const angle=a+(n-(s.projectileCount-1)/2)*s.spreadDegrees*Math.PI/180;
          bullets.push({x:ship.x+Math.cos(angle)*17,y:ship.y+Math.sin(angle)*17,vx:Math.cos(angle)*s.projectileSpeed,vy:Math.sin(angle)*s.projectileSpeed,left:s.range,damage:s.damage,color});
        }break;
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
        const root=candidates.find(b=>rayBlocks(ship.x,ship.y,b.x,b.y)[0]===b);
        if(root){
          const tree=lightningTree(root,s);
          lightningEffect([{x:ship.x,y:ship.y},{x:root.x,y:root.y}],color);
          for(const branch of tree){
            const points=[{x:branch.start.x,y:branch.start.y},...branch.targets.map(b=>({x:b.x,y:b.y}))];
            lightningEffect(points,color,branch.tier);for(const b of branch.targets)damage(b,s.damage,'energy');
          }
        }else lineEffect([{x:ship.x,y:ship.y},{x:ship.x+direction.x*45,y:ship.y+direction.y*45}],color,.08);
        break;
      }
      case 'lobbed_explosion':{
        const dist=Math.min(distance(target,ship),s.range);
        shells.push({x:ship.x,y:ship.y,tx:ship.x+direction.x*dist,ty:ship.y+direction.y*dist,age:0,duration:s.flightDuration,canSplit:true,secondary:false,s,color});break;
      }
      case 'piercing_beam':{
        const end={x:ship.x+direction.x*s.range,y:ship.y+direction.y*s.range},hits=rayBlocks(ship.x,ship.y,end.x,end.y).slice(0,s.penetration);
        const reach=hits.length===s.penetration?hits.at(-1):end;
        if(interceptAttack(ship,reach)){cooldowns[id]=s.cooldown;return;}
        hits.forEach(b=>damage(b,s.damage));
        const lastHit=hits.length===s.penetration?hits.at(-1):end;
        lineEffect([{x:ship.x,y:ship.y},{x:lastHit.x,y:lastHit.y}],color,.24);break;
      }
      case 'tethered_blade':
        if(blades.some(b=>b.id===id))return;
        blades.push({id,x:ship.x,y:ship.y,age:0,returning:false,hits:new Set(),s,color,behavior:d.behavior,...planYoyo(s)});break;
      case 'returning_blade':
        if(blades.some(b=>b.id===id))return;
        blades.push({id,x:ship.x,y:ship.y,ox:ship.x,oy:ship.y,angle:a,age:0,returning:false,hits:new Set(),s,color,behavior:d.behavior});break;
      case 'orbiting_blade': return;
    }
    cooldowns[id]=s.cooldown||s.cycleDuration||.1;
  }
  let chargedShot=null;
  function chargedShotStats(s,focus=aim()){
    const range=Math.min(distance(ship,focus),s.range),seconds=range/s.chargeRange;
    return {range,duration:Math.max(s.minCooldown,Math.min(s.maxCharge,seconds)),damage:Math.max(s.minDamage,s.damage*Math.min(s.maxCharge,seconds)),width:1+Math.floor(Math.log2(Math.max(1,seconds)))};
  }
  function dischargeChargedShot(s,shot,focus=aim()){
    const angle=Math.atan2(focus.y-ship.y,focus.x-ship.x),end={x:ship.x+Math.cos(angle)*shot.range,y:ship.y+Math.sin(angle)*shot.range};
    if(shot.damage<=s.interceptThreshold&&interceptAttack(ship,end))return;
    const hits=new Map();
    for(const offset of [-shot.width/2,0,shot.width/2]){
      const dx=-Math.sin(angle)*offset,dy=Math.cos(angle)*offset;
      for(const b of rayBlocks(ship.x+dx,ship.y+dy,end.x+dx,end.y+dy))hits.set(b.id,b);
    }
    for(const b of hits.values())damage(b,shot.damage);
    effects.push({type:'line',points:[{x:ship.x,y:ship.y},end],color:'#fff4b4',width:shot.width,life:.25,max:.25});
    const points=[{x:ship.x,y:ship.y}],segments=Math.max(2,Math.ceil(shot.range/35));
    for(let n=1;n<segments;n++){const t=n/segments,jitter=(Math.random()-.5)*14;points.push({x:ship.x+(end.x-ship.x)*t-Math.sin(angle)*jitter,y:ship.y+(end.y-ship.y)*t+Math.cos(angle)*jitter});}points.push(end);
    effects.push({type:'line',points,color:'#a5dfff',width:1,life:.4,max:.4});spark(ship.x,ship.y,'#fff4b4',8);
  }
  function updateChargedShot(id,dt,firing){
    if(!firing){chargedShot=null;return;}
    const s=stats(id),shot=chargedShotStats(s);
    if(!chargedShot||chargedShot.id!==id)chargedShot={id,elapsed:0};
    chargedShot.elapsed+=dt;chargedShot.shot=shot;
    if(chargedShot.elapsed+1e-9>=shot.duration){dischargeChargedShot(s,shot);chargedShot=null;}
  }
  function mortarPosition(shell,t){return {x:shell.x+(shell.tx-shell.x)*t,y:shell.y+(shell.ty-shell.y)*t-Math.sin(t*Math.PI)*(shell.arcHeight??60)};}
  function updateMortars(dt){
    const queue=shells.map(shell=>({shell,dt})),survivors=[];
    for(const item of queue){
      const shell=item.shell,s=shell.s,split=shell.canSplit&&s.splitCount>1;
      const eventAge=split?shell.duration*.5:shell.duration,advance=Math.min(item.dt,Math.max(0,eventAge-shell.age));
      const from=mortarPosition(shell,clamp(shell.age/shell.duration,0,1));shell.age+=advance;
      const to=mortarPosition(shell,clamp(shell.age/shell.duration,0,1));
      if(interceptAttack(from,to))continue;
      if(shell.age<eventAge-1e-9){survivors.push(shell);continue;}
      const remaining=Math.max(0,item.dt-advance);
      if(split){
        const heading=Math.atan2(shell.ty-to.y,shell.tx-to.x),reach=Math.hypot(shell.tx-to.x,shell.ty-to.y);
        for(let n=0;n<s.splitCount;n++){
          const a=heading+(n-(s.splitCount-1)/2)*s.splitAngleDegrees*Math.PI/180;
          queue.push({shell:{x:to.x,y:to.y,tx:to.x+Math.cos(a)*reach,ty:to.y+Math.sin(a)*reach,age:0,duration:shell.duration*.5,arcHeight:25,canSplit:false,secondary:false,s,color:shell.color},dt:remaining});
        }
        spark(to.x,to.y,shell.color,6);continue;
      }
      const landing=blockAt(shell.tx,shell.ty);
      if(landing?.hp>0&&landing.reflective){
        const norm=Math.hypot(shell.tx,shell.ty)||1,vx=shell.tx/norm*260,vy=shell.ty/norm*260;
        bullets.push({x:shell.tx+vx/260*18,y:shell.ty+vy/260*18,vx,vy,left:600,damage:s.damage,color:shell.color,guided:false,reflected:true,bounces:1,blastRadius:s.blastRadius});spark(shell.tx,shell.ty,'#78edff',5);continue;
      }
      for(const b of nearby(shell.tx,shell.ty,s.blastRadius))if(distance(b,{x:shell.tx,y:shell.ty})<=s.blastRadius)damage(b,s.damage);
      effects.push({type:'blast',x:shell.tx,y:shell.ty,r:s.blastRadius,color:shell.color,life:.38,max:.38});spark(shell.tx,shell.ty,shell.color,8);
      if(!shell.secondary)for(let n=1;n<(s.blastCount||1);n++){
        const a=Math.random()*TAU,r=Math.sqrt(Math.random())*s.secondaryRange;
        queue.push({shell:{x:shell.tx,y:shell.ty,tx:shell.tx+Math.cos(a)*r,ty:shell.ty+Math.sin(a)*r,age:0,duration:s.secondaryFlightDuration,arcHeight:35,canSplit:false,secondary:true,s,color:shell.color},dt:remaining});
      }
    }
    shells=planet.collapse===null?survivors:[];
  }
  function lightningTree(root,s,random=Math.random){
    const visited=new Set(),branches=[],heading=Math.atan2(root.y-ship.y,root.x-ship.x);
    let frontier=Array.from({length:s.rootBranches},(_,n)=>({start:root,angle:heading+(n-(s.rootBranches-1)/2)*1.2,parent:null}));
    for(let tier=1;tier<=s.branchDepth;tier++){
      const children=[];
      for(const fork of frontier){
        const min=s[`tier${tier}Min`],max=s[`tier${tier}Max`],length=min+Math.floor(random()*(max-min+1));
        const branch={tier,parent:fork.parent,start:fork.start,angle:fork.angle,length,targets:[]};let previous=fork.start;
        for(let n=0;n<length;n++){
          let target;
          if(tier===1&&branches.length===0&&n===0)target=root;
          else target=nearby(previous.x,previous.y,s.jumpRange).filter(b=>b.hp>0&&!visited.has(b.id)&&distance(b,previous)<=s.jumpRange).sort((b,c)=>{
            const score=v=>{const d=distance(v,previous)||1;return ((v.x-previous.x)*Math.cos(fork.angle)+(v.y-previous.y)*Math.sin(fork.angle))/d*2-d/s.jumpRange;};
            return score(c)-score(b)||b.id-c.id;
          })[0];
          if(!target)break;visited.add(target.id);branch.targets.push(target);previous=target;
        }
        if(!branch.targets.length)continue;
        const parent=branches.length;branches.push(branch);
        if(tier<s.branchDepth)for(const side of [-1,1])children.push({start:previous,angle:fork.angle+side*.7,parent});
      }
      frontier=children;
    }
    return branches;
  }
  function lightningEffect(points,color,tier=0){
    const jagged=[points[0]];
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,offset=(Math.random()-.5)*Math.min(12,d*.35);
      jagged.push({x:(a.x+b.x)/2-dy/d*offset,y:(a.y+b.y)/2+dx/d*offset},b);
    }
    lineEffect(jagged,color,.32-tier*.035);
  }
  function planYoyo(s){
    const origin={x:ship.x,y:ship.y},directions=8;
    let occupied=0;for(let n=0;n<directions;n++){const a=n/directions*TAU;if(rayBlocks(ship.x,ship.y,ship.x+Math.cos(a)*s.range,ship.y+Math.sin(a)*s.range).length)occupied++;}
    const nearbyBlocks=planet.blocks.filter(b=>b.hp>0&&distance(b,ship)<=s.range).sort((a,b)=>distance(a,ship)-distance(b,ship)||a.id-b.id);
    const exposed=b=>[[1,0],[-1,0],[0,1],[0,-1]].some(([di,dj])=>!(planet.grid.get(key(b.i+di,b.j+dj))?.hp>0));
    const target=nearbyBlocks.find(exposed)||nearbyBlocks[0];
    const angle=target?Math.atan2(target.y-ship.y,target.x-ship.x):ship.angle;
    const reach=target?distance(target,ship):s.range*.6;
    const anchor={x:ship.x+Math.cos(angle)*Math.min(reach*.55,s.range*.4),y:ship.y+Math.sin(angle)*Math.min(reach*.55,s.range*.4)};
    const path=[target?{x:target.x,y:target.y,id:target.id}:{x:ship.x+Math.cos(angle)*reach,y:ship.y+Math.sin(angle)*reach}];
    const visited=new Set(target?[target.id]:[]);
    for(let n=1;target&&n<s.contourSteps;n++){
      const last=path.at(-1),normal=Math.atan2(last.y,last.x),tangent={x:-Math.sin(normal),y:Math.cos(normal)};
      const next=nearbyBlocks.filter(b=>!visited.has(b.id)&&exposed(b)&&distance(b,last)<=CELL*1.5).sort((a,b)=>((b.x-last.x)*tangent.x+(b.y-last.y)*tangent.y)-((a.x-last.x)*tangent.x+(a.y-last.y)*tangent.y)||a.id-b.id)[0];
      if(!next)break;visited.add(next.id);path.push({x:next.x,y:next.y,id:next.id});
    }
    const end=path.at(-1),normal=Math.atan2(end.y,end.x);
    return {combo:occupied>=5?'String Storm':'Surface Dance',origin,anchor,path,angle,loopRadius:Math.min(s.range*.4,Math.max(s.loopRadius,reach*.6)),control:{x:end.x+Math.cos(normal)*s.loopRadius*2,y:end.y+Math.sin(normal)*s.loopRadius*2},phase:'',duration:s.cycleDuration*3};
  }
  function updateYoyo(b,dt){
    const old={x:b.x,y:b.y};b.age+=dt;
    const t=b.age/b.duration,lerp=(a,c,u)=>({x:a.x+(c.x-a.x)*u,y:a.y+(c.y-a.y)*u});let next,phase;
    if(b.returning||t>=1){
      phase='Snap Return';const d=distance(b,ship),step=b.s.range*3*dt;next=lerp(b,ship,Math.min(1,step/Math.max(d,.001)));if(d<=step+5)b.done=true;
    }else if(b.combo==='Surface Dance'){
      if(t<.2){phase='Sleeper';next=lerp(b.origin,b.path[0],t/.2);}
      else if(t<.35){phase='Sleeper';next=b.path[0];}
      else if(t<.75){phase='Walk the Dog';const progress=(t-.35)/.4*(b.path.length-1),index=Math.floor(progress);next=lerp(b.path[index],b.path[Math.min(index+1,b.path.length-1)],progress-index);}
      else {phase='Around the World';const u=(t-.75)/.25,start=b.path.at(-1);next={x:(1-u)**2*start.x+2*(1-u)*u*b.control.x+u*u*b.origin.x,y:(1-u)**2*start.y+2*(1-u)*u*b.control.y+u*u*b.origin.y};}
    }else{
      if(t<.25){phase='Trapeze';next=lerp(b.origin,b.anchor,t/.25);}
      else {const turn=(t-.25)/.75*b.s.loopCount,theta=turn*TAU;phase=`Figure Eight ${Math.floor(turn)+1}`;const x=Math.sin(theta)*b.loopRadius,y=Math.sin(theta*2)*b.loopRadius*.6;next={x:b.anchor.x+Math.cos(b.angle)*x-Math.sin(b.angle)*y,y:b.anchor.y+Math.sin(b.angle)*x+Math.cos(b.angle)*y};}
    }
    if(phase!==b.phase){b.hits.clear();b.phase=phase;}
    b.x=next.x;b.y=next.y;sweepBlade(b,old);
    if(b.age>b.s.maxLifetime)b.done=true;
  }
  function buzzsaws(s,time=simTime){
    const result=[];
    for(let index=0;index<s.sawCount;index++){
      const size=s.bladeDiameter/2*s.sizeMultiplier**index,direction=index%2?-1:1,speed=s.speedMultiplier**index;
      const radius=index?result[index-1].radius+result[index-1].size+size+s.orbitGap:s.orbitRadius;
      const angle=time*s.orbitSpeedDegrees*Math.PI/180*speed*direction;
      result.push({index,size,radius,direction,speed,angle,x:ship.x+Math.cos(angle)*radius,y:ship.y+Math.sin(angle)*radius,damage:s.damage*s.damageMultiplier**index});
    }
    return result;
  }
  function buzzsawDPS(s){return buzzsaws(s,0).reduce((sum,saw)=>sum+saw.damage/s.contactInterval,0);}
  const sawHits=new Map();
  function shockwaveMultiplier(origin,block){
    const dx=block.x-origin.x,dy=block.y-origin.y;
    const length=Math.hypot(dx,dy)*Math.hypot(block.x,block.y);
    return length?2**clamp((dx*block.x+dy*block.y)/length,-1,1):1;
  }
  function pushLiquid(block,origin,cells){
    if(block.hp<=0||block.phase!=='liquid')return;
    const dx=block.x-origin.x,dy=block.y-origin.y;
    const di=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0,dj=di?0:Math.sign(dy);
    if(!di&&!dj)return;
    for(let step=0;step<cells;step++){
      const i=block.i+di,j=block.j+dj,x=(i+.5)*CELL,y=(j+.5)*CELL;
      if(planet.grid.get(key(i,j))?.hp>0||Math.hypot(x,y)>planet.radius+96||Math.hypot(ship.x-clamp(ship.x,x-8,x+8),ship.y-clamp(ship.y,y-8,y+8))<12)break;
      if(planet.grid.get(key(block.i,block.j))===block)planet.grid.delete(key(block.i,block.j));
      Object.assign(block,{i,j,x,y});planet.grid.set(key(i,j),block);
    }
  }
  function updateShockwaves(dt){
    for(const wave of shockwaves){
      const previous=wave.radius;wave.radius=Math.min(wave.s.range,previous+wave.s.waveSpeed*dt);
      const touched=planet.blocks.filter(b=>{
        if(b.hp<=0||wave.hits.has(b.id))return false;
        const near=Math.hypot(wave.x-clamp(wave.x,b.x-8,b.x+8),wave.y-clamp(wave.y,b.y-8,b.y+8));
        const far=Math.hypot(Math.abs(wave.x-b.x)+8,Math.abs(wave.y-b.y)+8);
        return near<=wave.radius&&far>=previous;
      });
      for(const b of touched){wave.hits.add(b.id);damage(b,wave.s.damage*shockwaveMultiplier(wave,b),'energy');}
      touched.sort((a,b)=>distance(b,wave)-distance(a,wave)).forEach(b=>pushLiquid(b,wave,wave.s.pushCells));
    }
    shockwaves=shockwaves.filter(w=>w.radius<w.s.range);
  }
  function infectBlock(b){if(b&&b.hp>0&&!b.plagueImmune)b.plagued=true;}
  function updateSnow(dt){
    for(const flake of snow){
      flake.life-=dt;if(flake.life<=0)continue;
      const radius=Math.hypot(flake.x,flake.y);
      if(radius>0){flake.vx-=flake.x/radius*flake.gravity*dt;flake.vy-=flake.y/radius*flake.gravity*dt;}
      const speed=Math.hypot(flake.vx,flake.vy);if(speed>flake.maxSpeed){flake.vx*=flake.maxSpeed/speed;flake.vy*=flake.maxSpeed/speed;}
      const nx=flake.x+flake.vx*dt,ny=flake.y+flake.vy*dt,hit=rayBlocks(flake.x,flake.y,nx,ny)[0];
      if(hit){infectBlock(hit);flake.life=0;}flake.x=nx;flake.y=ny;
    }
    snow=snow.filter(f=>f.life>0);
  }
  function updatePlague(dt){
    if(!state.owned.plague)return;
    const s=stats('plague'),infected=planet.blocks.filter(b=>b.hp>0&&b.plagued&&!b.plagueImmune),nextContacts=new Map(),newInfections=new Set();
    // Snapshot sources so a newly infected block cannot spread again in the same step.
    for(const source of infected){
      const activeTime=Math.min(dt,source.hp/s.damage);
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const target=planet.grid.get(key(source.i+di,source.j+dj));if(!target||target.hp<=0||target.plagued||target.plagueImmune)continue;
        const pair=`${source.id}:${target.id}`,elapsed=(plagueContacts.get(pair)||0)+activeTime;
        if(elapsed+1e-9>=s.spreadSeconds)newInfections.add(target.id);else if(source.hp>s.damage*dt)nextContacts.set(pair,elapsed);
      }
    }
    for(const source of infected)damage(source,s.damage*dt);
    for(const id of newInfections)infectBlock(planet.blocks[id]);
    plagueContacts=nextContacts;
  }
  function regenerateBlocks(dt){
    planet.regenAccumulator+=dt;
    const ticks=Math.floor((planet.regenAccumulator+1e-9)/.1);planet.regenAccumulator=Math.max(0,planet.regenAccumulator-ticks*.1);
    for(const b of planet.blocks)if(b.hp>0&&b.hp<b.max){if(b.regen)b.hp=Math.min(b.max,b.hp+b.regen*dt);if(b.regenStep&&ticks)b.hp=Math.min(b.max,b.hp+b.regenStep*ticks);}
  }
  function reflectProjectile(m,block){
    if(!block.reflective)return false;
    const speed=Math.hypot(m.vx,m.vy);if(!speed)return false;
    // Slab entry point supplies the true face normal, including oblique impacts.
    let entry=-Infinity,exit=Infinity,normal={x:0,y:0};
    for(const axis of ['x','y']){
      const velocity=m[axis==='x'?'vx':'vy'],origin=m[axis],lo=block[axis]-8,hi=block[axis]+8;
      if(!velocity)continue;
      const a=(lo-origin)/velocity,b=(hi-origin)/velocity,near=Math.min(a,b);
      if(near>entry){entry=near;normal={x:0,y:0};normal[axis]=velocity>0?-1:1;}exit=Math.min(exit,Math.max(a,b));
    }
    if(entry<0||entry>exit){const norm=Math.hypot(block.x,block.y)||1;normal={x:block.x/norm,y:block.y/norm};entry=0;}
    const traveled=Math.max(0,entry)*speed;
    m.x+=m.vx*Math.max(0,entry);m.y+=m.vy*Math.max(0,entry);
    const dot=m.vx*normal.x+m.vy*normal.y;
    m.vx-=2*dot*normal.x;m.vy-=2*dot*normal.y;
    m.x+=normal.x*.5;m.y+=normal.y*.5;m.left=Math.max(0,m.left-traveled);
    m.reflected=true;m.targetId=null;m.bounces=(m.bounces||0)+1;
    if(m.bounces>=6)m.left=0;
    if(m.nuke){m.tx=m.x+m.vx/speed*m.left;m.ty=m.y+m.vy/speed*m.left;if(m.left===0)m.neutralized=true;}
    spark(m.x,m.y,'#78edff',5);return true;
  }
  function pushShip(dx,dy){
    const length=Math.hypot(dx,dy)||1,nx=dx/length,ny=dy/length;
    for(let step=0;step<14;step++){
      const x=clamp(ship.x+nx*6,-planet.halfW+20,planet.halfW-20),y=clamp(ship.y+ny*6,-planet.halfH+20,planet.halfH-20);
      if(collides(x,y))break;ship.x=x;ship.y=y;
    }
    ship.vx+=nx*400;ship.vy+=ny*400;
  }
  function updateCoreWaves(dt){
    for(const turret of planet.turrets){
      if(!turret.wave||planet.blocks[turret.blockId].hp<=0)continue;
      turret.waveCooldown=Math.max(0,turret.waveCooldown-dt);
      if(turret.waveCooldown>0||distance(turret,ship)>600)continue;
      if(rayBlocks(turret.x,turret.y,ship.x,ship.y).some(b=>b.id!==turret.blockId))continue;
      const a=Math.atan2(ship.y-turret.y,ship.x-turret.x);
      waves.push({x:turret.x,y:turret.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,left:600,sourceId:turret.blockId});
      turret.waveCooldown=1.6;turret.angle=a;
    }
    for(const wave of waves){
      const travel=Math.min(260*dt,wave.left),nx=wave.x+wave.vx/260*travel,ny=wave.y+wave.vy/260*travel;
      if(rayBlocks(wave.x,wave.y,nx,ny).some(b=>b.id!==wave.sourceId)){wave.left=0;continue;}
      const dx=nx-wave.x,dy=ny-wave.y,t=clamp(((ship.x-wave.x)*dx+(ship.y-wave.y)*dy)/(dx*dx+dy*dy||1),0,1);
      if(Math.hypot(ship.x-(wave.x+dx*t),ship.y-(wave.y+dy*t))<=27){pushShip(wave.vx,wave.vy);wave.left=0;spark(ship.x,ship.y,'#d5a1ff',8);}
      else wave.left-=travel;
      wave.x=nx;wave.y=ny;
    }
    waves=waves.filter(w=>w.left>0);
  }
  function interceptAttack(start,end=start){
    const dx=end.x-start.x,dy=end.y-start.y,length2=dx*dx+dy*dy;
    for(const turret of planet.turrets){
      if(turret.cooldown>0||planet.blocks[turret.blockId].hp<=0)continue;
      const fraction=length2?clamp(((turret.x-start.x)*dx+(turret.y-start.y)*dy)/length2,0,1):0;
      const hit={x:start.x+dx*fraction,y:start.y+dy*fraction};
      if(distance(turret,hit)>turret.range)continue;
      if(rayBlocks(turret.x,turret.y,hit.x,hit.y).some(b=>b.id!==turret.blockId))continue;
      turret.cooldown=.35;turret.angle=Math.atan2(hit.y-turret.y,hit.x-turret.x);
      lineEffect([{x:turret.x,y:turret.y},hit],'#ff4765',.15);spark(hit.x,hit.y,'#ff8d9d',5);return true;
    }return false;
  }
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
      if(drone.respawn>0){drone.targetId=null;continue;}
      const candidates=planet.blocks.filter(b=>b.hp>0&&!reserved.has(b.id)&&distance(b,drone)<=s.range);
      candidates.sort((a,b)=>distance(a,drone)-distance(b,drone)||a.id-b.id);
      // A clear first hit ensures a drone really shoots its own assigned block.
      const target=candidates.find(b=>rayBlocks(drone.x,drone.y,b.x,b.y)[0]===b);
      drone.targetId=target?target.id:null;
      if(target)reserved.add(target.id);
    }
  }
  function fireDroneLaser(drone,s){
    if(drone.respawn>0)return false;
    const target=drone.targetId===null?null:planet.blocks[drone.targetId];
    if(!target||target.hp<=0||distance(target,drone)>s.range)return false;
    const angle=Math.atan2(target.y-drone.y,target.x-drone.x);
    const end={x:drone.x+Math.cos(angle)*s.range,y:drone.y+Math.sin(angle)*s.range};
    const hits=rayBlocks(drone.x,drone.y,end.x,end.y).slice(0,s.penetration);
    if(hits[0]!==target)return false;
    drone.angle=angle;
    for(const b of hits)damage(b,s.damage,'energy');
    const lastHit=hits.at(-1);lineEffect([{x:drone.x,y:drone.y},{x:lastHit.x,y:lastHit.y}],'#65caff',.12);
    return true;
  }
  function updateDrones(dt){
    syncDrones();if(!drones.length)return;
    const s=stats('mining_drones');
    for(const drone of drones){
      if(drone.respawn>0){drone.respawn=Math.max(0,drone.respawn-dt);if(drone.respawn===0){Object.assign(drone,droneWaypoint(s,s.spawnMinRadius,s.spawnMaxRadius));drone.goal=droneWaypoint(s);drone.cooldown=.3;}continue;}
      const old={x:drone.x,y:drone.y};
      drone.wander-=dt;drone.cooldown=Math.max(0,drone.cooldown-dt);
      if(drone.wander<=0||distance(drone,drone.goal)<8||distance(drone,ship)>s.roamRadius*1.5){drone.goal=droneWaypoint(s);drone.wander=1+Math.random()*2;}
      const dist=distance(drone,drone.goal),step=Math.min(s.moveSpeed*dt,dist);
      if(dist>0){drone.x+=(drone.goal.x-drone.x)/dist*step;drone.y+=(drone.goal.y-drone.y)/dist*step;}
      if(interceptAttack(old,drone)){drone.respawn=3;drone.targetId=null;}
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
    if(m.exploded||m.neutralized)return;
    const remaining=Math.hypot(m.tx-m.x,m.ty-m.y),travel=Math.min(m.s.projectileSpeed*dt,remaining),arrived=travel>=remaining;
    const nx=arrived?m.tx:m.x+(m.tx-m.x)/remaining*travel,ny=arrived?m.ty:m.y+(m.ty-m.y)/remaining*travel;
    if(interceptAttack(m,{x:nx,y:ny})){m.left=0;m.neutralized=true;return;}
    m.trail.push({x:m.x,y:m.y});if(m.trail.length>16)m.trail.shift();
    for(const b of rayBlocks(m.x,m.y,nx,ny)){
      if(reflectProjectile(m,b))return;
      if(m.drilled.size>=m.s.drillBlocks)continue;
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
    if(m.reflected){m.trail.push({x:m.x,y:m.y});if(m.trail.length>12)m.trail.shift();return true;}
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
    for(const turret of planet.turrets)turret.cooldown=Math.max(0,turret.cooldown-dt);
    regenerateBlocks(dt);
    updateSunGrowth(dt);
    if([0,3,4,5,7,8].includes(state.level)){planet.compaction+=dt;if(planet.compaction>=1){planet.compaction-=1;compactMantle();}}
    updateSnow(dt);updatePlague(dt);updateShockwaves(dt);
    const ax=touchControls.x+(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),ay=touchControls.y+(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0),length=Math.max(1,Math.hypot(ax,ay));
    ship.vx+=ax/length*850*dt;ship.vy+=ay/length*850*dt;
    const drag=Math.exp(-3.3*dt);ship.vx*=drag;ship.vy*=drag;
    const speed=Math.hypot(ship.vx,ship.vy);if(speed>260){ship.vx*=260/speed;ship.vy*=260/speed;}
    let x=clamp(ship.x+ship.vx*dt,-planet.halfW+20,planet.halfW-20),y=clamp(ship.y+ship.vy*dt,-planet.halfH+20,planet.halfH-20);
    if(!collides(x,ship.y))ship.x=x;else ship.vx=0;
    if(!collides(ship.x,y))ship.y=y;else ship.vy=0;
    updateCoreWaves(dt);
    const target=aim();ship.angle=Math.atan2(target.y-ship.y,target.x-ship.x);
    updateDrones(dt);
    const firing=(touchFiring()||keys.has('Space'))||auto;
    for(const id of state.slots.filter(Boolean)){
      cooldowns[id]=Math.max(0,(cooldowns[id]||0)-dt);
      if(byId[id].behavior==='charged_shot'){updateChargedShot(id,dt,firing);continue;}
      if(!firing)continue;
      const d=byId[id],s=stats(id);
      if(d.behavior==='mining_drones')continue;
      if(d.behavior==='orbiting_blade'){
        if(cooldowns[id]>0)continue;
        for(const saw of buzzsaws(s)){
          if(interceptAttack(saw)){cooldowns[id]=1;break;}
          for(const b of nearby(saw.x,saw.y,saw.size+8)){
            const hitKey=`${saw.index}:${b.id}`;
            if(distance(b,saw)<saw.size+8&&(sawHits.get(hitKey)||0)<=simTime){damage(b,saw.damage);sawHits.set(hitKey,simTime+s.contactInterval);}
          }
        }
      }else if(cooldowns[id]<=0)fire(id);
    }
    for(const b of bullets){
      if(b.nuke){advanceNuke(b,dt);continue;}
      if(b.guided&&!guideMissile(b,dt))continue;
      const speed=Math.hypot(b.vx,b.vy),travel=Math.min(speed*dt,b.left),nx=b.x+b.vx/speed*travel,ny=b.y+b.vy/speed*travel;
      if(interceptAttack(b,{x:nx,y:ny})){b.left=0;continue;}
      const hit=rayBlocks(b.x,b.y,nx,ny)[0];if(hit){
        if(reflectProjectile(b,hit))continue;
        if(b.guided||b.blastRadius){const radius=b.blastRadius||b.s.blastRadius;for(const block of nearby(hit.x,hit.y,radius))if(distance(block,hit)<=radius)damage(block,b.damage);effects.push({type:'blast',x:hit.x,y:hit.y,r:radius,color:b.color,life:.25,max:.25});}
        else damage(hit,b.damage);
        b.left=0;
      }else b.left-=travel;
      b.x=nx;b.y=ny;
    }bullets=bullets.filter(b=>b.left>0);
    updateMortars(dt);
    for(const b of blades){
      if(b.behavior==='tethered_blade'){updateYoyo(b,dt);continue;}
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
    if(levelCleared())completeLevel();
  }
  function sweepBlade(b,old){
    if(interceptAttack(old,b)){b.done=true;return;}
    const steps=Math.max(1,Math.ceil(distance(old,b)/6));
    for(let n=1;n<=steps;n++){
      const x=old.x+(b.x-old.x)*n/steps,y=old.y+(b.y-old.y)*n/steps;
      const liquid=nearby(x,y,b.s.bladeDiameter/2+8).find(block=>block.reflective&&distance(block,{x,y})<b.s.bladeDiameter/2+8);
      if(liquid){b.x=old.x;b.y=old.y;b.returning=true;b.hits.clear();spark(x,y,'#78edff',4);return;}
      for(const block of nearby(x,y,b.s.bladeDiameter/2+8))if(!b.hits.has(block.id)&&distance(block,{x,y})<b.s.bladeDiameter/2+8){b.hits.add(block.id);damage(block,b.s.damage);}
    }
  }
  let galaxyReturn='play';
  const visitFields=['hp','positions','ship','collapse','compaction','turretCooldowns','waveCooldowns','regenAccumulator','plagueLevel','plagued','plagueContacts','replaying','obsidianRevision','sunRevision','sunBlocks','sunTimer','sunSeed'];
  function unlockedLevel(index){return Number.isInteger(index)&&index>=0&&index<levels.length&&(index===0||index===state.level||state.paid.includes(index)||state.paid.includes(index-1));}
  function openGalaxy(){
    if(!state||mode==='welcome'||mode==='galaxy')return;
    galaxyReturn=mode;setMode('galaxy');
    $('galaxyGrid').innerHTML=levels.map((spec,index)=>{
      const current=index===state.level,active=current&&!levelCleared(),visited=state.visits?.[index],cleared=state.paid.includes(index),unlocked=unlockedLevel(index);
      const action=active||visited?'Resume':cleared?'Replay':'Launch';
      return `<article class="weapon-card"><div class="eyebrow">Sector ${String(index+1).padStart(2,'0')}</div><h3>${spec[0]}</h3><div class="badge">${current?'Current destination':cleared?'Completed':unlocked?'Available':'Locked'}</div><button data-planet="${index}" ${unlocked?'':'disabled'}>${unlocked?action:'Clear previous planet'}</button></article>`;
    }).join('');
    $('galaxyGrid').querySelectorAll('[data-planet]').forEach(button=>button.onclick=()=>visitLevel(Number(button.dataset.planet)));
  }
  function visitLevel(index){
    if(!unlockedLevel(index))return;
    if(index===state.level&&!levelCleared()){setMode('play');return;}
    save();
    if(!state.visits||typeof state.visits!=='object'||Array.isArray(state.visits))state.visits={};
    if(!levelCleared())state.visits[state.level]=Object.fromEntries(visitFields.filter(k=>state[k]!==undefined).map(k=>[k,state[k]]));
    else delete state.visits[state.level];
    const destination=state.visits[index];
    for(const field of visitFields)delete state[field];
    state.level=index;state.replaying=state.paid.includes(index);
    if(destination&&typeof destination==='object')for(const field of visitFields)if(destination[field]!==undefined)state[field]=destination[field];
    delete state.visits[index];
    resetFlight();load(state);save();setMode('play');resize();
  }
  function completeLevel(){
    const spec=levels[state.level];
    if(!state.paid.includes(state.level)){state.credits+=spec[3];state.paid.push(state.level);}
    $('completeEyebrow').textContent=state.level===9?'All ten planets cleared':'Demolition complete';
    $('completeTitle').textContent=state.level===9?'A quieter universe.':`${spec[0]} dismantled.`;
    $('bonus').textContent=state.replaying?'Replay complete':`+${format(spec[3])} ◈`;
    $('completeText').textContent=`${format(state.level===8?planet.liquidTotal:planet.total)} blocks cleared. First-clear bonus recorded. ${state.level===9?'Campaign complete! Start again to try a new arsenal.':`Next destination: ${levels[state.level+1][0]}. Your equipment travels with you.`}`;
    if(state.replaying)$('completeText').textContent=`${format(state.level===8?planet.liquidTotal:planet.total)} blocks cleared. Block credits earned; the first-clear bonus was already collected. Choose another destination in Galaxy.`;
    $('nextBtn').textContent=state.replaying?'Choose planet':state.level===9?'New campaign':'Next planet →';updateHUD();setMode('complete');
  }
  function nextLevel(){
    if(state.replaying){openGalaxy();return;}
    if(state.level===9){newCampaign();return;}
    visitLevel(state.level+1);
  }
  function resetFlight(){chargedShot=null;ship={x:0,y:-planet.radius-90,vx:0,vy:0,angle:Math.PI/2};bullets=[];blades=[];shells=[];effects=[];particles=[];cooldowns={};drones=[];waves=[];snow=[];shockwaves=[];plagueContacts=new Map();sawHits.clear();pointer.moved=false;syncDrones();}
  function newCampaign(){if(!window.confirm('Start a new campaign? This resets all planets, credits, and weapon upgrades.'))return;state=freshState();auto=false;planet=generatePlanet(0);resetFlight();save();$('reducedMotion').checked=false;setMode('play');resize();updateHUD();}

  const stops=[[5,5,8],[89,16,24],[212,58,18],[255,149,0],[255,243,106]];
  function blockColor(b){const t=clamp((1-b.hp/b.max)*4,0,3.999),i=Math.floor(t),f=t-i,start=i===0?b.tint:stops[i];return `rgb(${start.map((v,k)=>Math.round(v+(stops[i+1][k]-v)*f)).join(',')})`;}
  const stars=Array.from({length:190},(_,i)=>({x:((i*7919)%1009)/1009,y:((i*3571)%1013)/1013,r:i%11===0?1.5:.65}));
  function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);view.w=rect.width;view.h=rect.height;view.dpr=dpr;view.scale=planet?Math.min(view.w/(planet.halfW*2),view.h/(planet.halfH*2)):1;view.ox=view.w/2;view.oy=view.h/2;}
  function drawBlade(x,y,r,color,rotation=simTime*9){
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.beginPath();for(let n=0;n<24;n++){const a=n/24*TAU,rr=n%2?r*.7:r;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;n?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle='#15222c';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.3,0,TAU);ctx.stroke();ctx.restore();
  }
  function draw(){
    const {w,h,dpr,scale,ox,oy}=view;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080c17';ctx.fillRect(0,0,w,h);
    for(const star of stars){ctx.fillStyle=star.r>1?'#465c78':'#25354d';ctx.fillRect(star.x*w,star.y*h,star.r,star.r);}
    if(!planet)return;
    ctx.translate(ox,oy);ctx.scale(scale,scale);
    ctx.strokeStyle='#172337';ctx.lineWidth=1/scale;ctx.setLineDash([3,12]);ctx.beginPath();ctx.arc(0,0,planet.radius+55,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#18273b';ctx.strokeRect(-planet.halfW+12,-planet.halfH+12,planet.halfW*2-24,planet.halfH*2-24);
    for(const moon of planet.moons||[]){ctx.strokeStyle='#355448';ctx.beginPath();ctx.arc(moon.x,moon.y,moon.radius+24,0,TAU);ctx.stroke();ctx.fillStyle='#8e9db5';ctx.font=`${11/scale}px monospace`;ctx.textAlign='center';ctx.fillText(`OPTIONAL MOON · ${moon.count} BLOCKS`,moon.x,moon.y+moon.radius+55);ctx.textAlign='left';}
    ctx.save();
    const collapseFraction=planet.collapse===null?0:clamp(planet.collapse/1.4,0,1);
    if(collapseFraction){const shrink=state.reduced?1:Math.max(.02,1-collapseFraction*collapseFraction);ctx.scale(shrink,shrink);ctx.globalAlpha=1-collapseFraction;}
    for(const b of planet.blocks){if(b.hp<=0)continue;const jitter=state.level===1&&collapseFraction&&!state.reduced?Math.sin(b.id*13+simTime*23)*collapseFraction*10:0;ctx.fillStyle=blockColor(b);ctx.fillRect(b.x-7.3+jitter,b.y-7.3-jitter,14.6,14.6);if(b.hp===b.max){ctx.strokeStyle=b.gold?'#ffd65f':b.phase==='gas'?'#386b99':'#364158';ctx.lineWidth=b.gold?1.2:.6;ctx.strokeRect(b.x-7.3+jitter,b.y-7.3-jitter,14.6,14.6);}if(b.gold){ctx.fillStyle='#ffdf75';ctx.fillRect(b.x-2,b.y-2,4,4);}}
    ctx.restore();
    for(const b of planet.blocks)if(b.hp>0&&b.plagued){ctx.strokeStyle='#baffdc';ctx.lineWidth=1;ctx.strokeRect(b.x-6,b.y-6,12,12);ctx.fillStyle='#edfff6';ctx.fillRect(b.x-3,b.y-3,2,2);ctx.fillRect(b.x+2,b.y+2,2,2);}
    for(const flake of snow){ctx.fillStyle='#f2fff9';ctx.fillRect(flake.x-flake.size/2,flake.y-flake.size/2,flake.size,flake.size);if(!state.reduced){ctx.strokeStyle='#d5ffe7';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(flake.x-3,flake.y);ctx.lineTo(flake.x+3,flake.y);ctx.moveTo(flake.x,flake.y-3);ctx.lineTo(flake.x,flake.y+3);ctx.stroke();}}
    if(state.level===4){
      for(const b of planet.blocks){
        if(b.hp<=0||b.phase==='liquid')continue;
        ctx.fillStyle=b.hp<b.max?'#dca769':'#a2e8ef';
        const height=2+(b.id%3);ctx.fillRect(b.x-4,b.y-height/2,2,height);ctx.fillRect(b.x+2,b.y-height/2,2,height);
      }
    }
    for(const e of effects){ctx.globalAlpha=e.life/e.max;if(e.type==='flash'){ctx.fillStyle='#fff36a';ctx.fillRect(e.x-8,e.y-8,16,16);}else if(e.type==='blast'){ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1.3-e.life/e.max*.3),0,TAU);ctx.stroke();}else{
      ctx.strokeStyle=e.color;ctx.lineWidth=e.width??(e.points.length>2?2:3);ctx.shadowColor=e.color;ctx.shadowBlur=state.reduced?0:12;ctx.beginPath();ctx.moveTo(e.points[0].x,e.points[0].y);
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
    for(const wave of shockwaves){
      ctx.save();ctx.strokeStyle=wave.color;ctx.globalAlpha=.8;ctx.lineWidth=2;ctx.shadowColor=wave.color;ctx.shadowBlur=state.reduced?0:14;
      ctx.beginPath();ctx.arc(wave.x,wave.y,wave.radius,0,TAU);ctx.stroke();
      if(!state.reduced){ctx.strokeStyle='#efffff';ctx.lineWidth=1.5;ctx.beginPath();const segments=Math.max(40,Math.ceil(wave.radius/4));
        for(let n=0;n<=segments;n++){const a=n/segments*TAU,r=wave.radius+Math.sin(n*17+Math.floor(simTime*18))*6,x=wave.x+Math.cos(a)*r,y=wave.y+Math.sin(a)*r;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}
      ctx.restore();
    }
    for(const s of shells){const t=s.age/s.duration,x=s.x+(s.tx-s.x)*t,y=s.y+(s.ty-s.y)*t-Math.sin(t*Math.PI)*(s.arcHeight??60);ctx.strokeStyle=s.color;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(s.tx,s.ty,s.s.blastRadius,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(x,y,5+Math.sin(t*Math.PI)*3,0,TAU);ctx.fill();}
    for(const b of blades){if(b.behavior==='tethered_blade'){ctx.strokeStyle='#79dbffaa';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ship.x,ship.y);if(b.combo==='String Storm'&&!b.returning)ctx.lineTo(b.anchor.x,b.anchor.y);ctx.lineTo(b.x,b.y);if(b.combo==='String Storm'&&!b.returning)ctx.lineTo(ship.x,ship.y);ctx.stroke();ctx.strokeStyle=b.color;ctx.fillStyle='#173449';ctx.beginPath();ctx.arc(b.x,b.y,b.s.bladeDiameter/2,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,4,0,TAU);ctx.stroke();}else drawBlade(b.x,b.y,b.s.bladeDiameter/2,b.color);}
    if(mode==='play'&&(auto||(touchFiring()||keys.has('Space'))))for(const id of state.slots.filter(Boolean)){if(byId[id].behavior==='orbiting_blade'&&!(cooldowns[id]>0)){const s=stats(id);for(const saw of buzzsaws(s)){ctx.strokeStyle='#f58bbe22';ctx.beginPath();ctx.arc(ship.x,ship.y,saw.radius,0,TAU);ctx.stroke();drawBlade(saw.x,saw.y,saw.size,'#f58bbe',simTime*9*saw.speed*saw.direction);}}}
    for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-1,p.y-1,2.5,2.5);}ctx.globalAlpha=1;
    for(const drone of drones){
      if(drone.respawn>0)continue;
      ctx.save();ctx.translate(drone.x,drone.y);ctx.rotate(drone.angle);ctx.strokeStyle='#65caff';ctx.fillStyle='#122b40';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(3,-6);ctx.lineTo(-6,-5);ctx.lineTo(-6,5);ctx.lineTo(3,6);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#b9edff';ctx.fillRect(-2,-2,4,4);ctx.strokeRect(-7,-9,8,3);ctx.strokeRect(-7,6,8,3);ctx.restore();
    }
    for(const turret of planet.turrets){
      const mount=planet.blocks[turret.blockId];if(mount.hp<=0)continue;
      if(state.level===4){ctx.strokeStyle='#ff476520';ctx.lineWidth=1;ctx.setLineDash([4,10]);ctx.beginPath();ctx.arc(turret.x,turret.y,turret.range,0,TAU);ctx.stroke();ctx.setLineDash([]);}
      ctx.strokeStyle='#ff4765';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mount.x,mount.y);ctx.lineTo(turret.x,turret.y);ctx.stroke();
      ctx.save();ctx.translate(turret.x,turret.y);ctx.rotate(turret.angle);ctx.fillStyle=turret.cooldown>0?'#5f2435':'#ff4765';ctx.fillRect(-6,-6,12,12);ctx.strokeStyle='#ffd2d9';ctx.strokeRect(-6,-6,12,12);ctx.fillStyle='#ffb2bc';ctx.fillRect(4,-2,12,4);ctx.restore();
    }
    for(const wave of waves){ctx.save();ctx.translate(wave.x,wave.y);ctx.rotate(Math.atan2(wave.vy,wave.vx));ctx.strokeStyle='#d6a2ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-8,0,22,-Math.PI/3,Math.PI/3);ctx.stroke();ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(-15,0,22,-Math.PI/3,Math.PI/3);ctx.stroke();ctx.restore();}
    const target=aim();
    if(mode==='play'){ctx.strokeStyle='#7afce144';ctx.lineWidth=1;ctx.beginPath();ctx.arc(target.x,target.y,9,0,TAU);ctx.moveTo(target.x-14,target.y);ctx.lineTo(target.x-6,target.y);ctx.moveTo(target.x+6,target.y);ctx.lineTo(target.x+14,target.y);ctx.moveTo(target.x,target.y-14);ctx.lineTo(target.x,target.y-6);ctx.moveTo(target.x,target.y+6);ctx.lineTo(target.x,target.y+14);ctx.stroke();}
    if(mode==='play'&&chargedShot?.shot){
      const progress=clamp(chargedShot.elapsed/chargedShot.shot.duration,0,1);
      ctx.save();ctx.strokeStyle='#fff4b4';ctx.fillStyle='#fff4b4';ctx.globalAlpha=.15+progress*.65;ctx.shadowColor='#ffe080';ctx.shadowBlur=state.reduced?0:8+progress*30;ctx.lineWidth=1+progress*3;
      ctx.beginPath();ctx.arc(ship.x,ship.y,17+progress*15,0,TAU);ctx.stroke();ctx.globalAlpha=.1+progress*.35;ctx.beginPath();ctx.arc(ship.x,ship.y,8+progress*10,0,TAU);ctx.fill();ctx.restore();
    }
    ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);
    if(Math.hypot(ship.vx,ship.vy)>20){ctx.fillStyle='#7afce1';ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(-8,-4);ctx.lineTo(-18-(state.reduced?0:Math.sin(simTime*55)*5),0);ctx.lineTo(-8,4);ctx.fill();ctx.globalAlpha=1;}
    ctx.shadowColor='#7afce1';ctx.shadowBlur=state.reduced?0:12;ctx.strokeStyle='#9affea';ctx.fillStyle='#142e35';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-10);ctx.lineTo(-5,0);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.restore();
    const b=blockAt(target.x,target.y);$('targetInfo').textContent=b&&b.hp>0?`${b.plagued?'PLAGUED · ':''}${b.turret?'Turret mount / ':''}${b.name} · ${Number(b.hp.toFixed(2))} / ${b.max} HP · ${b.reward} credits`:`${state.slots.some(Boolean)?'Left stick to fly · Touch arena to aim and fire':'No weapons equipped · Open the armory'}${auto?' · AUTO ACTIVE':''}`;
  }
  function frame(now){const delta=Math.min((now-last)/1000||0,.1);last=now;if(mode==='play'){accumulator+=delta;while(accumulator>=1/60&&mode==='play'){update(1/60);accumulator-=1/60;}}else accumulator=0;draw();requestAnimationFrame(frame);}
  function toggleAuto(){if(!state||mode!=='play')return;auto=!auto;save();updateHUD();}
  function togglePause(){if(mode==='play')setMode('pause');else if(mode==='pause')setMode('play');else if(mode==='shop')setMode(shopReturn);else if(mode==='galaxy')setMode(galaxyReturn);}
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
  function touchAim(event){const rect=canvas.getBoundingClientRect();pointer={x:(event.clientX-rect.left-view.ox)/view.scale,y:(event.clientY-rect.top-view.oy)/view.scale,moved:true};}
  canvas.addEventListener('pointerdown',event=>{if(mode!=='play'||touchControls.aimId!==null)return;event.preventDefault();touchControls.aimId=event.pointerId;canvas.setPointerCapture(event.pointerId);touchAim(event);});
  canvas.addEventListener('pointermove',event=>{if(mode==='play'&&(touchControls.aimId===event.pointerId||event.pointerType==='mouse'))touchAim(event);});
  const stopAim=event=>{if(touchControls.aimId===event.pointerId)touchControls.aimId=null;};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,stopAim);
  const stick=$('moveStick');
  function moveStick(event){const rect=stick.getBoundingClientRect(),radius=rect.width*.34,dx=(event.clientX-rect.left-rect.width/2)/radius,dy=(event.clientY-rect.top-rect.height/2)/radius,n=Math.max(1,Math.hypot(dx,dy));touchControls.x=dx/n;touchControls.y=dy/n;if(Math.hypot(dx,dy)<.12){touchControls.x=0;touchControls.y=0;}$('moveKnob').style.transform=`translate(calc(-50% + ${touchControls.x*radius}px),calc(-50% + ${touchControls.y*radius}px))`;}
  stick.addEventListener('pointerdown',event=>{if(mode!=='play'||touchControls.moveId!==null)return;event.preventDefault();touchControls.moveId=event.pointerId;stick.setPointerCapture(event.pointerId);moveStick(event);});
  stick.addEventListener('pointermove',event=>{if(touchControls.moveId===event.pointerId)moveStick(event);});
  const stopMove=event=>{if(touchControls.moveId===event.pointerId){touchControls.moveId=null;touchControls.x=0;touchControls.y=0;$('moveKnob').style.transform='translate(-50%,-50%)';}};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,stopMove);
  $('fireTouch').addEventListener('pointerdown',event=>{if(mode!=='play'||touchControls.fireId!==null)return;event.preventDefault();touchControls.fireId=event.pointerId;$('fireTouch').setPointerCapture(event.pointerId);$('fireTouch').classList.toggle('active',true);});
  const stopFire=event=>{if(touchControls.fireId===event.pointerId){touchControls.fireId=null;$('fireTouch').classList.toggle('active',false);}};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])$('fireTouch').addEventListener(type,stopFire);
  window.addEventListener('resize',clearTouchControls);
  window.addEventListener('blur',clearTouchControls);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTouchControls();});
  window.addEventListener('blur',()=>{keys.clear();if(mode==='play')setMode('pause');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(mode==='play')setMode('pause');save();}});
  window.addEventListener('pagehide',save);window.addEventListener('resize',resize);
  $('startBtn').onclick=()=>{if(levelCleared())completeLevel();else setMode('play');};
  $('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=()=>setMode('play');$('shopBtn').onclick=openShop;
  $('closeShop').onclick=()=>setMode(shopReturn);$('autoBtn').onclick=toggleAuto;$('restartBtn').onclick=newCampaign;
  $('completeShop').onclick=openShop;$('nextBtn').onclick=nextLevel;
  $('galaxyBtn').onclick=openGalaxy;$('pauseGalaxy').onclick=openGalaxy;$('completeGalaxy').onclick=openGalaxy;$('closeGalaxy').onclick=()=>setMode(galaxyReturn);
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
  $('mobileAuto').appendChild($('autoBtn'));
  document.querySelectorAll('.sidebar > .section').forEach(section=>$('mobileDetails').appendChild(section));
  init();
})();
