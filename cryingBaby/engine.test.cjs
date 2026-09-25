const assert=require('node:assert/strict');
const {Game,calendar,DAY,END}=require('./engine.js');
for(let seed=1;seed<=100;seed++){
  const plan=calendar(seed);
  for(let d=0;d<7;d++){
    const count=type=>plan.events.filter(e=>e.type===type&&Math.floor(e.at/DAY)===d).length;
    assert.ok(count('feed')>=10&&count('feed')<=20);
    assert.ok(count('diaper')>=10&&count('diaper')<=14);
    assert.ok(count('nose')<=2);assert.equal(count('tummy'),1);assert.equal(count('vitamin'),1);
  }
  for(const f of plan.events.filter(e=>e.type==='feed'&&e.at<END))assert.ok(plan.events.some(e=>e.type==='diaper'&&e.at>=f.at+30&&e.at<=f.at+120));
}
function empty(){const g=new Game(42);g.queue=[];return g;}
let g=empty();g.add('cuddle');assert.equal(g.level(),1);g.advance(10);assert.equal(g.level(),2);g.add('sleep');g.advance(10);assert.equal(g.level(),3);g.advance(15);assert.equal(g.level(),3);
g=empty();g.add('diaper');g.advance(30);assert.ok(!g.needs.some(n=>n.type==='belly'));g.advance(.1);assert.ok(g.needs.some(n=>n.type==='belly'));g.choose('diaper');g.advance(3);assert.ok(g.needs.some(n=>n.type==='belly'));g.choose('belly');g.advance(4);assert.ok(g.needs.some(n=>n.type==='belly'));g.choose('legs');g.advance(3);assert.equal(g.needs.length,0);assert.equal(g.level(),0);
g=empty();g.add('vitamin');g.add('tummy');assert.equal(g.level(),0);g.advance(480);assert.equal(g.time,DAY);assert.equal(g.stats.missed,1);assert.equal(g.needs[0].type,'tummy');g.advance(480*6);assert.equal(g.time,END);assert.ok(g.done);
g=empty();g.add('bath');assert.equal(g.active().length,0);g.advance(200);assert.equal(g.active().length,1);g.advance(160);assert.equal(g.active().length,0);
g=empty();g.suitLimit=3;for(let i=0;i<3;i++){g.add('diaper');g.choose('diaper');g.advance(3);}assert.ok(g.needs.some(n=>n.type==='suit'));
g=empty();g.add('feed',{duration:12,burpDuration:5});g.choose('feed');g.advance(4);assert.equal(g.needs[0].type,'burp');assert.ok(g.queue.some(e=>e.type==='diaper'&&e.at>=30&&e.at<=120));
console.log('OK: 100 calendari settimanali, quote, finestre pannolino, irritazione, pancino, mezzanotte, bagnetto, tutina e ruttino.');
