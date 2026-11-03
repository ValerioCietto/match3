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
 get('launch').click();assert.equal(get('overlay').hidden,true);
 for(let i=1;i<=300;i++)callback(i*16.667);
 assert.match(get('enemyCount').textContent,/HOSTILES/);
 assert.ok(vm.runInContext('elapsed',sandbox)>4);
 get('stick').onpointerdown({pointerId:1,clientX:100,clientY:30});callback(5020);
 assert.notEqual(vm.runInContext('yaw',sandbox),0);
 get('stick').onpointercancel({pointerId:1});
 get('pause').click();const elapsed=vm.runInContext('elapsed',sandbox);callback(5100);
 assert.equal(vm.runInContext('elapsed',sandbox),elapsed);
 get('launch').click();assert.equal(vm.runInContext('running',sandbox),true);
 vm.runInContext('save.money=100',sandbox);
 get('shop').click();assert.equal(vm.runInContext('running',sandbox),false);
 assert.equal(get('catalog').children.length,20);
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
  player=[0,0,0];yaw=0;pitch=0;basis();
  function enemyAtPixel(x,y,z=80){return {hp:3,p:add(camera,add(mul(forward,z),add(mul(right,x*z/focal),mul(up,-y*z/focal))))};}
  enemies=[enemyAtPixel(23,0)];
 `,sandbox);
 assert.equal(get('reticle').style.width,'48px');
 assert.equal(vm.runInContext('aimTarget()===enemies[0]',sandbox),true);
 vm.runInContext('enemies=[enemyAtPixel(24.1,0),enemyAtPixel(18,18),enemyAtPixel(0,0,-80)]',sandbox);
 assert.equal(vm.runInContext('aimTarget()',sandbox),null);
 vm.runInContext('enemies=[enemyAtPixel(20,0),enemyAtPixel(5,0),enemyAtPixel(0,0)];enemies[2].hp=0',sandbox);
 assert.equal(vm.runInContext('aimTarget()===enemies[1]',sandbox),true);
 // Every upgraded projectile must point exactly at the selected center from its own origin.
 vm.runInContext('save.levels.bullet_number=2;save.levels.bullet_spread=5;bullets=[];fireVolley()',sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),3);
 assert.equal(vm.runInContext('bullets.every(b=>dot(unit(b.v),unit(sub(enemies[1].p,b.p)))>1-1e-12)',sandbox),true);
 assert.equal(vm.runInContext('bullets.every(b=>Math.abs(length(b.v)-100)<1e-9)',sandbox),true);
 vm.runInContext('enemies=[];bullets=[];fireVolley()',sandbox);
 assert.equal(vm.runInContext('dot(unit(bullets[1].v),forward)',sandbox),1);
 assert.equal(vm.runInContext('dot(unit(bullets[0].v),forward)<1',sandbox),true);
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
 assert.equal(vm.runInContext('dot(unit(bullets[0].v),unit(sub(bullets[0].target.p,bullets[0].p)))>1-1e-9',sandbox),true);
 vm.runInContext('bullets[0].target.hp=0;update(.04)',sandbox);
 assert.equal(vm.runInContext('bullets.length',sandbox),2);
 vm.runInContext(`
  bullets=[];enemies=[{...chooseEnemy(.5),p:add(player,[0,0,8]),speed:0,hp:4,age:0,flash:0}];
  fireMissiles();for(let i=0;i<5;i++)update(.04);
 `,sandbox);
 assert.equal(vm.runInContext('enemies.length',sandbox),0);
 assert.equal(vm.runInContext('bullets.length',sandbox),0);
 // Pausing freezes regeneration and the missile clock; restarting clears projectiles.
 get('pause').click();
 vm.runInContext('hp=70;missileClock=2',sandbox);callback(6000);
 assert.equal(vm.runInContext('hp',sandbox),70);
 assert.equal(vm.runInContext('missileClock',sandbox),2);
 vm.runInContext('gameOver()',sandbox);get('launch').click();
 assert.equal(vm.runInContext('bullets.length',sandbox),0);
});
