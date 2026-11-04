import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as core from './core.mjs';

test('launch, game loop, touch steering, pause, shop purchase and persistence',async()=>{
 const elements=new Map(),storage=new Map(),events={};let callback;
 const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 class Element {
  constructor(){this.style={};this.children=[];this.listeners={};this.hidden=false;this.open=false;}
  querySelector(s){return this[s]??=new Element();}
  append(...children){this.children.push(...children);}
  replaceChildren(){this.children=[];}
  addEventListener(n,f){this.listeners[n]=f;}
  getContext(){return context;}
  getBoundingClientRect(){return {left:0,top:0,width:116,height:116};}
  setPointerCapture(){}
  setAttribute(k,v){this[k]=v;}
  showModal(){this.open=true;}
  close(){this.open=false;this.listeners.close?.();}
  click(){this.onclick?.();}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const catalog=JSON.parse(await readFile(new URL('../shooter/upgrades.json',import.meta.url),'utf8'));
 const sandbox=vm.createContext({
  ...core, console, Math, performance:{now:()=>0}, innerWidth:390,innerHeight:844,devicePixelRatio:1,
  document:{getElementById:get,createElement:()=>new Element(),addEventListener:(n,f)=>events[n]=f},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
  Audio:class{play(){return Promise.resolve();}pause(){}},
  fetch:async()=>({ok:true,json:async()=>catalog}),
  addEventListener:(n,f)=>events[n]=f,requestAnimationFrame:f=>callback=f,setTimeout:()=>1,clearTimeout:()=>{}
 });
 const source=(await readFile(new URL('./game.js',import.meta.url),'utf8')).replace(/^import .*?;\r?\n/,'');
 vm.runInContext(source,sandbox);await new Promise(resolve=>setImmediate(resolve));
 assert.match(get('loading').textContent,/Systems ready/);
 assert.equal(vm.runInContext('cameraMode',sandbox),'third');
 assert.equal(get('cameraFirst').disabled,true);
 assert.equal(get('cameraStrategic').disabled,true);
 get('cameraMode').value='first';get('cameraMode').onchange();
 assert.equal(vm.runInContext('cameraMode',sandbox),'third');
 get('launch').click();assert.equal(get('overlay').hidden,true);
 for(let i=1;i<=300;i++)callback(i*16.667);
 assert.match(get('enemyCount').textContent,/HOSTILES/);
 assert.ok(vm.runInContext('elapsed',sandbox)>4);
 get('stick').onpointerdown({pointerId:1,clientX:100,clientY:30});callback(5020);
 assert.ok(vm.runInContext('player[0]>0&&player[1]>0',sandbox));
 assert.equal(vm.runInContext('forward.join(",")',sandbox),'0,0,1');
 get('stick').onpointercancel({pointerId:1});
 get('pause').click();const elapsed=vm.runInContext('elapsed',sandbox);callback(5100);
 assert.equal(vm.runInContext('elapsed',sandbox),elapsed);
 get('launch').click();assert.equal(vm.runInContext('running',sandbox),true);
 vm.runInContext('save.money=100',sandbox);
 get('shop').click();assert.equal(vm.runInContext('running',sandbox),false);
 assert.equal(get('catalog').children.length,24);
 assert.ok(!get('catalog').children.some(row=>['CURVATURE','LUDICROUS SPEED'].includes(row.children[0].children[0].textContent)));
 assert.equal(vm.runInContext("catalog.some(u=>u.id==='ad_movement')",sandbox),false);
 const fireRate=get('catalog').children.find(row=>row.children[0].children[0].textContent==='Frequenza di fuoco');
 fireRate.children[1].click();assert.equal(vm.runInContext('save.money',sandbox),95);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).levels.fire_rate,1);
 get('closeShop').click();assert.equal(vm.runInContext('running',sandbox),true);
 vm.runInContext('gameOver()',sandbox);assert.equal(get('overlay').hidden,false);
 get('launch').click();assert.equal(vm.runInContext('hp',sandbox),100);
 assert.equal(vm.runInContext('save.money',sandbox),95);
 // Select by the visible circle, including its enlarged outer band, not a world-space cone.
 vm.runInContext(`
  player=[0,0,0];basis();
  function enemyAtPixel(x,y,z=80){return {hp:3,p:add(camera,add(mul(forward,z),add(mul(right,x*z/focal),mul(up,-y*z/focal))))};}
  enemies=[enemyAtPixel(23,0)];
 `,sandbox);
 assert.equal(get('reticle').style.width,'48px');
 assert.equal(vm.runInContext('aimTarget()===enemies[0]',sandbox),true);
 vm.runInContext('enemies=[enemyAtPixel(24.1,0),enemyAtPixel(18,18),enemyAtPixel(0,0,-80)]',sandbox);
 assert.equal(vm.runInContext('aimTarget()',sandbox),null);
 vm.runInContext('enemies=[enemyAtPixel(20,0),enemyAtPixel(5,0),enemyAtPixel(0,0)];enemies[2].hp=0',sandbox);
 assert.equal(vm.runInContext('aimTarget()===enemies[1]',sandbox),true);
 // Auto-aimed shots retain only the baseline half-degree deviation from the target center.
 vm.runInContext('save.levels.bullet_number=2;save.levels.bullet_spread=5;bullets=[];fireVolley()',sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),3);
 assert.equal(vm.runInContext('bullets.every(b=>dot(unit(b.v),unit(sub(enemies[1].p,b.p)))>=Math.cos(Math.PI/360)-1e-12)',sandbox),true);
 assert.equal(vm.runInContext('bullets.every(b=>Math.abs(length(b.v)-100)<1e-9)',sandbox),true);
 vm.runInContext('enemies=[];bullets=[];fireVolley()',sandbox);
 assert.ok(vm.runInContext('dot(unit(bullets[0].v),forward)>=Math.cos(Math.PI/360)-1e-12',sandbox));
 assert.equal(vm.runInContext('dot(unit(bullets[1].v),forward)<1',sandbox),true);
 assert.equal(vm.runInContext('bullets.some(b=>Math.abs(dot(b.v,up))>1)',sandbox),true);
 // Buy new upgrades through the shop, including prerequisite checks and persistence.
 vm.runInContext('save.money=10000;renderShop()',sandbox);
 const card=name=>get('catalog').children.find(row=>row.children[0].children[0].textContent===name);
 assert.equal(card('Missile amount').children[1].disabled,true);
 card('Guided missiles').children[1].click();
 assert.equal(vm.runInContext('save.money',sandbox),9990);
 assert.equal(card('Missile amount').children[1].disabled,false);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).levels.guided_missiles,1);
 card('Hull regeneration').children[1].click();
 vm.runInContext('hp=50;missileClock=5;updateSystems(1)',sandbox);
 assert.equal(vm.runInContext('hp',sandbox),51);
 vm.runInContext('hp=99.8;updateSystems(1)',sandbox);
 assert.equal(vm.runInContext('hp',sandbox),100);
 vm.runInContext('hp=0;updateSystems(1)',sandbox);
 assert.equal(vm.runInContext('hp',sandbox),0);
 card('Bigger aim circle').children[1].click();
 assert.equal(get('reticle').style.width,'53px');
 vm.runInContext('enemies=[enemyAtPixel(26,0)]',sandbox);
 assert.equal(vm.runInContext('aimTarget()===enemies[0]',sandbox),true);
 for(let i=0;i<10;i++)card('Bigger aim circle').children[1].click();
 assert.equal(get('reticle').style.width,'100px');
 assert.equal(card('Bigger aim circle').children[1].disabled,true);
 vm.runInContext('enemies=[enemyAtPixel(50.1,0)]',sandbox);
 assert.equal(vm.runInContext('aimTarget()',sandbox),null);
 // Default cadence is five seconds, and each active missile has a distinct target.
 vm.runInContext(`
  hp=100;bullets=[];missileClock=5;
  enemies=Array.from({length:3},(_,i)=>({...chooseEnemy(.5),p:[10+i*8,3,60],hp:30,age:0,flash:0}));
  updateSystems(4.9);
 `,sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),0);
 vm.runInContext('updateSystems(.11)',sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),1);
 assert.equal(vm.runInContext('bullets[0].damage',sandbox),3);
 assert.equal(vm.runInContext('length(bullets[0].v)',sandbox),24);
 assert.equal(vm.runInContext('dot(unit(bullets[0].v),forward)',sandbox),1);
 card('Missile amount').children[1].click();
 card('Missile amount').children[1].click();
 card('Missile damage').children[1].click();
 card('Missile fire rate').children[1].click();
 assert.ok(Math.abs(vm.runInContext('missileClock',sandbox)-1/.3)<1e-9);
 vm.runInContext('fireMissiles()',sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),3);
 assert.equal(vm.runInContext('new Set(bullets.map(b=>b.target)).size',sandbox),3);
 assert.equal(vm.runInContext('bullets[1].damage',sandbox),4);
 vm.runInContext('fireMissiles()',sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),3);
 // Homing follows a moving target, and loss of a target safely removes its missile.
 vm.runInContext('bullets[0].target.p[0]+=15;spawnClock=100;fireClock=100;update(.04)',sandbox);
 assert.equal(vm.runInContext('length(bullets[0].v)',sandbox),24);
 assert.equal(vm.runInContext('dot(unit(bullets[0].v),forward)',sandbox),1);
 vm.runInContext('for(let i=0;i<15;i++)update(.04)',sandbox);
 assert.equal(vm.runInContext('dot(unit(bullets[0].v),unit(sub(bullets[0].target.p,bullets[0].p)))>.99',sandbox),true);
 vm.runInContext('bullets[0].target.hp=0;update(.04)',sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),2);
 vm.runInContext(`
  bullets=[];enemies=[{...chooseEnemy(.5),p:add(player,[0,0,8]),speed:0,hp:4,age:0,flash:0}];
  fireMissiles();for(let i=0;i<5;i++)update(.04);
 `,sandbox);
 assert.equal(vm.runInContext('enemies.length',sandbox),0);
 assert.equal(vm.runInContext('bullets.length',sandbox),0);
 // Launch speed uses current thrust, always heading toward the end of the cylinder.
 vm.runInContext(`
  basis();
  enemies=[{...chooseEnemy(.5),p:add(player,[0,0,60])}];boost=true;fireMissiles();
 `,sandbox);
 assert.ok(Math.abs(vm.runInContext('length(bullets[0].v)',sandbox)-64)<1e-9);
 assert.ok(vm.runInContext('dot(unit(bullets[0].v),forward)',sandbox)>1-1e-9);
 vm.runInContext('bullets=[];boost=false;brake=true;fireMissiles()',sandbox);
 assert.ok(Math.abs(vm.runInContext('length(bullets[0].v)',sandbox)-4)<1e-9);
 vm.runInContext('brake=false',sandbox);
 // Pausing freezes regeneration and the missile clock; restarting clears projectiles.
 get('pause').click();
 vm.runInContext('hp=70;missileClock=2',sandbox);callback(6000);
 assert.equal(vm.runInContext('hp',sandbox),70);
 assert.equal(vm.runInContext('missileClock',sandbox),2);
 vm.runInContext('gameOver()',sandbox);get('launch').click();
 assert.equal(vm.runInContext('bullets.length',sandbox),0);
 // Forward progress is independent of strafe input and has no finish limit.
 vm.runInContext('enemies=[];bullets=[];spawnClock=100;fireClock=100;missileClock=100;keys={KeyD:true,KeyW:true};const beforeStrafe=[...player];update(.04)',sandbox);
 assert.ok(vm.runInContext('player[0]>beforeStrafe[0]&&player[1]>beforeStrafe[1]&&player[2]>beforeStrafe[2]',sandbox));
 assert.equal(vm.runInContext('forward.join(",")',sandbox),'0,0,1');
 vm.runInContext('player=[COURSE_RADIUS-3,0,150];keys={KeyD:true};update(.04)',sandbox);
 assert.ok(vm.runInContext('Math.hypot(player[0],player[1])<=COURSE_RADIUS-3+1e-9&&player[2]>150',sandbox));
 // Stars approach the camera as the ship advances and recycle ahead after passing.
 vm.runInContext('keys={};stars[0]=[10,10,player[2]+100];const starDepth=project(stars[0]).z;update(.04)',sandbox);
 assert.ok(vm.runInContext('project(stars[0]).z<starDepth',sandbox));
 vm.runInContext('stars[0]=[10,10,player[2]-20];update(.04)',sandbox);
 assert.ok(vm.runInContext('stars[0][2]>player[2]+390',sandbox));
 // All enemies enter ahead, fly toward the entrance, and are discarded after passing.
 vm.runInContext('enemies=[];spawn();const enemyStart=[...enemies[0].p]',sandbox);
 assert.ok(vm.runInContext('enemyStart[2]>=player[2]+180&&Math.hypot(enemyStart[0],enemyStart[1])<COURSE_RADIUS',sandbox));
 vm.runInContext('update(.04)',sandbox);
 assert.ok(vm.runInContext('enemies[0].p[2]<enemyStart[2]&&enemies[0].p[0]===enemyStart[0]&&enemies[0].p[1]===enemyStart[1]',sandbox));
 vm.runInContext('enemies[0].p[2]=player[2]-10;update(.04)',sandbox);
 assert.equal(vm.runInContext('enemies.length',sandbox),0);
 for(const distance of [1200,12000,120000]){
  vm.runInContext(`player=[0,0,${distance}-.1];enemies=[];update(.04);spawn();render()`,sandbox);
  assert.ok(vm.runInContext('player[2]',sandbox)>distance);
  assert.equal(vm.runInContext('running',sandbox),true);
  assert.equal(get('overlay').hidden,true);
  assert.ok(vm.runInContext('enemies.length>0&&enemies.every(e=>e.p[2]>player[2])',sandbox));
  assert.equal(get('courseDistance').textContent,`${distance.toLocaleString()} m`);
 }
 vm.runInContext('gameOver()',sandbox);get('launch').click();assert.equal(vm.runInContext('player[2]',sandbox),0);
 // Both thrust controls accelerate spawning, for touch and keyboard, without stacking.
 for(const input of ['boost=true','brake=true','keys={ShiftLeft:true}','keys={ControlLeft:true}','boost=true;brake=true']){
  vm.runInContext(`clearInput();${input};enemies=[];bullets=[];spawnClock=.07;fireClock=100;missileClock=100;update(.04)`,sandbox);
  assert.equal(vm.runInContext('enemies.length',sandbox),1);
 }
 vm.runInContext('clearInput();enemies=[];spawnClock=.07;update(.04)',sandbox);
 assert.equal(vm.runInContext('enemies.length',sandbox),0);
 // Enemy weapons: boss fires every two seconds; blue and black fire forward every three.
 vm.runInContext(`
  player=[5,4,0];enemyShots=[];enemies=[.3,.9,.999,.5,.1].map((roll,i)=>({...chooseEnemy(roll),p:[i*6,0,100]}));
  updateEnemyWeapons(1.99);
 `,sandbox);
 assert.equal(vm.runInContext('enemyShots.length',sandbox),0);
 vm.runInContext('updateEnemyWeapons(.01)',sandbox);
 assert.equal(vm.runInContext('enemyShots.length',sandbox),1);
 assert.equal(vm.runInContext('enemyShots[0].cube',sandbox),true);
 assert.ok(vm.runInContext('dot(unit(enemyShots[0].v),unit(sub(player,enemyShots[0].p)))>1-1e-12',sandbox));
 vm.runInContext('updateEnemyWeapons(1)',sandbox);
 assert.equal(vm.runInContext('enemyShots.length',sandbox),3);
 assert.ok(vm.runInContext('enemyShots.filter(s=>!s.cube).every(s=>s.v[0]===0&&s.v[1]===0&&s.v[2]===-35)',sandbox));
 vm.runInContext('updateEnemyWeapons(1);render()',sandbox);
 assert.equal(vm.runInContext('enemyShots.filter(s=>s.cube).length',sandbox),2);
 // Aimed cubes keep their launch trajectory; pause freezes projectile movement and cadence.
 vm.runInContext('const cubeVelocity=[...enemyShots[0].v];player[0]+=8;updateEnemyShots(.04)',sandbox);
 assert.ok(vm.runInContext('enemyShots[0].v.every((v,i)=>v===cubeVelocity[i])',sandbox));
 get('pause').click();
 const shotsBefore=vm.runInContext('JSON.stringify(enemyShots)',sandbox);
 const clockBefore=vm.runInContext('enemies[2].fireClock',sandbox);callback(7000);
 assert.equal(vm.runInContext('JSON.stringify(enemyShots)',sandbox),shotsBefore);
 assert.equal(vm.runInContext('enemies[2].fireClock',sandbox),clockBefore);
 get('launch').click();
 // Hits damage once, respect invulnerability, and can end a run. Strafe sweeps are included.
 vm.runInContext(`
  player=[0,0,0];hp=100;invincible=0;
  function incoming(damage=10){return {p:[0,0,2],v:[0,0,-100],life:3,size:.35,damage,color:'#ff3535'};}
  enemyShots=[incoming(),incoming()];updateEnemyShots(.04);
 `,sandbox);
 assert.equal(vm.runInContext('hp',sandbox),90);
 assert.equal(vm.runInContext('enemyShots.length',sandbox),0);
 vm.runInContext('invincible=0;enemyShots=[{...incoming(20),p:[0,0,0],v:[0,0,0]}];player=[3,0,0];updateEnemyShots(.04,[-3,0,0])',sandbox);
 assert.equal(vm.runInContext('hp',sandbox),70);
 vm.runInContext('player=[0,0,0];invincible=0;hp=10;enemyShots=[incoming(20)];updateEnemyShots(.04)',sandbox);
 assert.equal(vm.runInContext('hp',sandbox),0);
 assert.equal(vm.runInContext('running',sandbox),false);
 get('launch').click();assert.equal(vm.runInContext('enemyShots.length',sandbox),0);
 vm.runInContext('enemyShots=[{...incoming(),p:[0,0,100],life:.01},{...incoming(),p:[0,0,-20]}];updateEnemyShots(.04)',sandbox);
 assert.equal(vm.runInContext('enemyShots.length',sandbox),0);
 // Camera changes leave the ship heading, position and run state untouched.
 vm.runInContext('save.money=100;renderShop()',sandbox);
 card('Unlock first person view').children[1].click();
 assert.equal(vm.runInContext('save.money',sandbox),90);
 assert.equal(get('cameraFirst').disabled,false);
 card('Unlock strategic camera view').children[1].click();
 assert.equal(vm.runInContext('save.money',sandbox),50);
 assert.equal(get('cameraStrategic').disabled,false);
 card('Enable or disable auto aim').children[1].click();
 assert.equal(vm.runInContext('save.money',sandbox),0);
 assert.equal(card('Enable or disable auto aim').children[1].textContent,'Disable');
 vm.runInContext('player=[7,4,100];basis();const cameraPlayer=[...player];enemies=[]',sandbox);
 for(const mode of ['strategic','first','third']){
  get('cameraMode').value=mode;get('cameraMode').onchange();
  assert.equal(vm.runInContext('cameraMode',sandbox),mode);
  assert.equal(vm.runInContext('forward.join(",")',sandbox),'0,0,1');
  assert.ok(vm.runInContext('player.every((v,i)=>v===cameraPlayer[i])',sandbox));
  assert.equal(vm.runInContext('running',sandbox),true);
  assert.equal(get('cockpit').hidden,mode!=='first');
  if(mode==='strategic'){
   assert.equal(vm.runInContext('camera[2]-player[2]',sandbox),-45);
   assert.equal(vm.runInContext('viewForward.join(",")',sandbox),'0,0,1');
   assert.equal(vm.runInContext('viewUp.join(",")',sandbox),'0,1,0');
   vm.runInContext('enemies=[{...chooseEnemy(.5),p:add(camera,[0,0,100])}]',sandbox);
  }else{
   if(mode==='first')assert.ok(vm.runInContext('length(sub(camera,player))<2',sandbox));
   else assert.equal(vm.runInContext('camera[2]-player[2]',sandbox),-12);
   vm.runInContext('enemies=[{...chooseEnemy(.5),p:add(camera,[0,0,80])}]',sandbox);
  }
  assert.ok(vm.runInContext('aimTarget()===enemies[0]',sandbox));
  vm.runInContext('bullets=[];fireVolley();render()',sandbox);
  assert.ok(vm.runInContext('bullets.every(b=>dot(unit(b.v),unit(sub(enemies[0].p,b.p)))>=Math.cos(Math.PI/360)-1e-12)',sandbox));
 }
 card('Enable or disable auto aim').children[1].click();
 assert.equal(vm.runInContext('aimTarget()',sandbox),null);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).autoAimEnabled,false);
 assert.equal(card('Enable or disable auto aim').children[1].textContent,'Enable');
 card('Enable or disable auto aim').children[1].click();
 assert.ok(vm.runInContext('aimTarget()===enemies[0]',sandbox));
 assert.equal(vm.runInContext('save.money',sandbox),0);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).levels.first_person_view,1);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).levels.strategic_view,1);
 vm.runInContext('save.money=40;renderShop()',sandbox);
 card('ALWAYS TO THE MAX').children[1].click();
 assert.equal(vm.runInContext('save.money',sandbox),0);
 assert.equal(vm.runInContext('shipSpeed()',sandbox),12);
 get('boost').onpointerdown({pointerId:5});get('boost').onpointerup();
 assert.equal(vm.runInContext('shipSpeed()',sandbox),64);
 assert.equal(get('boost').querySelector('small').textContent,'BOOST ON');
 vm.runInContext('clearInput()',sandbox);
 assert.equal(vm.runInContext('shipSpeed()',sandbox),64);
 get('brake').onpointerdown({pointerId:6});
 assert.equal(vm.runInContext('shipSpeed()',sandbox),2);
 get('brake').onpointerup();assert.equal(vm.runInContext('shipSpeed()',sandbox),64);
 get('boost').onpointerdown({pointerId:7});get('boost').onpointerup();
 assert.equal(vm.runInContext('shipSpeed()',sandbox),12);
 events.keydown({code:'ShiftLeft',repeat:false});events.keydown({code:'ShiftLeft',repeat:true});events.keyup({code:'ShiftLeft'});
 assert.equal(vm.runInContext('shipSpeed()',sandbox),64);
 events.keydown({code:'ShiftLeft',repeat:false});events.keyup({code:'ShiftLeft'});
 assert.equal(vm.runInContext('shipSpeed()',sandbox),12);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).levels.always_to_the_max,1);
 assert.ok(card('CURVATURE'));assert.equal(card('LUDICROUS SPEED'),undefined);
 vm.runInContext('save.money=1000000;renderShop()',sandbox);
 for(let i=0;i<core.CURVATURE_STEPS.length;i++){
  const balance=vm.runInContext('save.money',sandbox);
  const cost=core.upgradeCost(core.ARENA_UPGRADES.find(u=>u.id==='curvature'),i);
  card('CURVATURE').children[1].click();
  assert.equal(vm.runInContext('save.money',sandbox),balance-cost);
  vm.runInContext('boostToggled=true',sandbox);
  assert.equal(vm.runInContext('shipSpeed()',sandbox),64*core.CURVATURE_STEPS[i]);
  if(i<core.CURVATURE_STEPS.length-1)assert.equal(card('LUDICROUS SPEED'),undefined);
 }
 assert.equal(card('CURVATURE').children[1].disabled,true);
 const maxBalance=vm.runInContext('save.money',sandbox);card('CURVATURE').children[1].click();
 assert.equal(vm.runInContext('save.money',sandbox),maxBalance);
 assert.equal(card('LUDICROUS SPEED').children[1].textContent,`${(100000).toLocaleString()} cr`);
 card('LUDICROUS SPEED').children[1].click();
 assert.equal(vm.runInContext('save.money',sandbox),maxBalance-100000);
 assert.equal(vm.runInContext('shipSpeed()',sandbox),1280);
 assert.equal(vm.runInContext('tunnelStretch()',sandbox),10);
 assert.equal(vm.runInContext('modelStretch()',sandbox),2);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).ludicrousEnabled,true);
 vm.runInContext('enemies=[];spawn();render()',sandbox);
 assert.ok(vm.runInContext('enemies[0].p[2]-player[2]>=1800',sandbox));
 assert.equal(context.filter,'none');
 // Fast projectiles still overtake the ship, and crossing an enemy cannot skip a collision.
 vm.runInContext('bullets=[];shoot()',sandbox);
 assert.ok(vm.runInContext('bullets[0].v[2]>shipSpeed()',sandbox));
 vm.runInContext('clearInput();player=[0,0,0];hp=100;invincible=0;save.levels.hull_regen=0;enemyShots=[];bullets=[];enemies=[{...chooseEnemy(.5),p:[0,0,20],speed:0,age:2,flash:0}];spawnClock=100;fireClock=100;missileClock=100;update(.04)',sandbox);
 assert.equal(vm.runInContext('hp',sandbox),85);
 vm.runInContext('brake=true',sandbox);
 assert.equal(vm.runInContext('shipSpeed()',sandbox),2);
 assert.equal(vm.runInContext('tunnelStretch()',sandbox),1);
 vm.runInContext('brake=false',sandbox);
 card('LUDICROUS SPEED').children[1].click();
 assert.equal(vm.runInContext('shipSpeed()',sandbox),64*9.9);
 assert.equal(vm.runInContext('modelStretch()',sandbox),1);
 assert.equal(JSON.parse(storage.get('void-wing.arena.v1')).ludicrousEnabled,false);
 // Boost doubles bomb recharge; braking restores normal recharge even with boost toggled on.
 vm.runInContext('enemies=[];bullets=[];enemyShots=[];spawnClock=100;fireClock=100;missileClock=100;bombClock=18;boostToggled=true;update(.04)',sandbox);
 assert.ok(Math.abs(vm.runInContext('bombClock',sandbox)-17.92)<1e-9);
 assert.equal(get('bomb').querySelector('small').textContent,'9s');
 vm.runInContext('bombClock=18;brake=true;update(.04)',sandbox);
 assert.ok(Math.abs(vm.runInContext('bombClock',sandbox)-17.96)<1e-9);
 vm.runInContext('bombClock=18;brake=false;boostToggled=false;update(.04)',sandbox);
 assert.ok(Math.abs(vm.runInContext('bombClock',sandbox)-17.96)<1e-9);
 vm.runInContext('bombClock=.01;boostToggled=true;update(.04)',sandbox);
 assert.equal(vm.runInContext('bombClock',sandbox),0);
 assert.equal(get('bomb').querySelector('small').textContent,'BOMB');
 // Ten continuous ludicrous seconds, then exactly five seconds of warning.
 vm.runInContext('resetEncounter();save.ludicrousEnabled=true;boostToggled=true;updateEncounter(9.9)',sandbox);
 assert.equal(vm.runInContext('encounter',sandbox),'idle');
 vm.runInContext('boostToggled=false;updateEncounter(.1)',sandbox);
 assert.equal(vm.runInContext('ludicrousTime',sandbox),0);
 vm.runInContext('boostToggled=true;updateEncounter(10)',sandbox);
 assert.equal(vm.runInContext('encounter',sandbox),'warning');
 assert.equal(get('bossAlert').hidden,false);
 vm.runInContext('updateEncounter(.25)',sandbox);const alertOpacity=get('bossAlert').style.opacity;
 vm.runInContext('updateEncounter(.25)',sandbox);assert.notEqual(get('bossAlert').style.opacity,alertOpacity);
 get('pause').click();callback(10000);
 assert.equal(vm.runInContext('warningTime',sandbox),.5);
 get('launch').click();
 vm.runInContext('updateEncounter(4.49)',sandbox);assert.equal(vm.runInContext('encounter',sandbox),'warning');
 vm.runInContext('updateEncounter(.01)',sandbox);assert.equal(vm.runInContext('encounter',sandbox),'fight');
 assert.equal(get('bossAlert').hidden,true);
 assert.equal(vm.runInContext('enemies[0].hp',sandbox),1000);
 assert.equal(vm.runInContext('shipSpeed()',sandbox),12);
 assert.equal(get('boost').disabled,true);
 vm.runInContext('toggleBoost();boost=true;keys.ShiftLeft=true;spawn()',sandbox);
 assert.equal(vm.runInContext('shipSpeed()',sandbox),12);
 assert.equal(vm.runInContext('enemies.length',sandbox),1);
 vm.runInContext('updateEnemyWeapons(1.99)',sandbox);
 assert.equal(vm.runInContext('enemies[0].spinRemaining',sandbox),0);
 vm.runInContext('updateEnemyWeapons(.01)',sandbox);
 assert.equal(vm.runInContext('enemies[0].spinRemaining',sandbox),1);
 vm.runInContext('updateEnemyWeapons(.5);render()',sandbox);
 assert.ok(vm.runInContext('enemies[0].rotation>0',sandbox));
 assert.equal(vm.runInContext('enemyShots.length',sandbox),0);
 vm.runInContext('updateEnemyWeapons(.5);render()',sandbox);
 assert.ok(vm.runInContext('enemies[0].roll>=1&&enemies[0].roll<=20',sandbox));
 assert.equal(vm.runInContext('enemyShots.length',sandbox),vm.runInContext('enemies[0].roll',sandbox));
 assert.ok(vm.runInContext('enemyShots.every(s=>s.damage===5&&s.color==="#ff3030"&&dot(unit(s.v),unit(sub(player,s.p)))>=Math.cos(Math.PI/18)-1e-9)',sandbox));
 vm.runInContext('enemyShots=[];updateEnemyWeapons(1);updateEnemyWeapons(1)',sandbox);
 assert.equal(vm.runInContext('enemyShots.length',sandbox),vm.runInContext('enemies[0].roll',sandbox));
 // Boss tracks the course so it cannot be passed, and projectile damage completes the fight.
 vm.runInContext('clearInput();enemyShots=[];bullets=[];fireClock=100;missileClock=100;update(.04)',sandbox);
 assert.ok(Math.abs(vm.runInContext('enemies[0].p[2]-player[2]',sandbox)-90)<1e-9);
 vm.runInContext('bullets=[{p:add(enemies[0].p,[0,0,-12]),v:[0,0,100],damage:1000,life:1}];update(.04)',sandbox);
 assert.equal(vm.runInContext('encounter',sandbox),'done');
 assert.equal(vm.runInContext('running',sandbox),false);
 assert.equal(get('overlay').querySelector('h1').textContent,'BOSS DEFEATED');
 assert.equal(get('overlay').querySelector('p').textContent,'Are you happy now!?');
 assert.equal(get('launch').textContent,'NAH KEEP PLAYING');
 assert.equal(get('boost').disabled,false);
 get('launch').click();assert.equal(vm.runInContext('running',sandbox),true);
 vm.runInContext('boostToggled=true;updateEncounter(30)',sandbox);
 assert.equal(vm.runInContext('encounter',sandbox),'done');
 // Warp stars use one blurred batch and one sharp batch, independent of star count.
 const starPasses=[];
 context.stroke=()=>starPasses.push(context.filter);
 vm.runInContext('renderStars(true,1280)',sandbox);
 assert.deepEqual(starPasses,['blur(2px)','none']);
 assert.equal(context.filter,'none');assert.equal(context.globalAlpha,1);assert.equal(context.lineWidth,1);
 starPasses.length=0;
 vm.runInContext('renderStars(false,12)',sandbox);
 assert.deepEqual(starPasses,['none']);
});
