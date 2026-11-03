const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGame,tick,pad,levels}=require('./engine.js');
const advance=(g,seconds)=>{for(let i=0;i<Math.round(seconds*100);i++)tick(g,.01);};
const visit=(g,id,seconds)=>{const s=g.stations.find(s=>s.id===id);g.player={x:s.x,y:s.y};advance(g,seconds);};
test('player completes the full axe chain and sells for 20 gold',()=>{
  const g=createGame();visit(g,'tree',1.2);visit(g,'sawmill',1.6);visit(g,'mine',1.4);visit(g,'furnace',1.8);visit(g,'forge',1.8);visit(g,'table',1.9);
  assert.equal(g.bag.axe,1);visit(g,'market',.8);assert.equal(g.gold,20);assert.equal(g.bag.axe,0);assert.equal(g.sold,1);
});
test('crafting never creates output without all ingredients',()=>{
  const g=createGame();g.bag.stick=1;visit(g,'table',5);assert.equal(g.bag.stick,1);assert.equal(g.bag.axe,0);
});
test('payments take one gold per tenth second, pause away, and retain partial funding',()=>{
  const g=createGame(),s=g.stations[0];g.gold=12;g.player=pad(s);advance(g,.09);assert.equal(g.gold,12);advance(g,.01);assert.equal(g.gold,11);advance(g,.9);assert.equal(s.paid,10);
  g.player={x:300,y:320};advance(g,1);assert.equal(s.paid,10);g.player=pad(s);advance(g,1);assert.equal(s.paid,12);assert.equal(g.gold,0);assert.equal(s.worker,false);
  g.gold=38;advance(g,3.8);assert.equal(s.worker,true);assert.equal(g.gold,0);assert.equal(s.paid,0);
});
test('hired workers gather and refine without player proximity',()=>{
  const g=createGame();g.stations[0].worker=true;g.stations[1].worker=true;advance(g,10);assert.ok(g.bag.stick>0);assert.equal(g.gold,0);
});
test('speed upgrades complete separately from worker hire',()=>{
  const g=createGame(),s=g.stations[0];s.worker=true;s.cost=80;g.gold=80;g.player=pad(s);advance(g,8);assert.equal(s.rank,1);assert.equal(g.gold,0);assert.equal(s.paid,0);
});
test('diagonal movement is normalized and world edges constrain movement',()=>{
  const a=createGame(),b=createGame();tick(a,.1,{x:1,y:0});tick(b,.1,{x:1,y:1});assert.ok(Math.abs(Math.hypot(b.player.x-300,b.player.y-320)-(a.player.x-300))<1e-9);
  a.player={x:1115,y:665};tick(a,.1,{x:1,y:1});assert.deepEqual(a.player,{x:1115,y:665});
});
test('level exit requires sales and retains inventory and gold',()=>{
  const g=createGame();g.player={x:990,y:550};tick(g,.1);assert.equal(g.level,0);g.sold=levels[0].target;g.gold=47;g.bag.stick=3;tick(g,.1);assert.equal(g.level,1);assert.equal(g.sold,0);assert.equal(g.gold,47);assert.equal(g.bag.stick,3);
  g.sold=levels[1].target;g.player={x:990,y:550};tick(g,.1);assert.equal(g.level,2);g.sold=levels[2].target;g.player={x:990,y:550};tick(g,.1);assert.equal(g.won,true);
});
