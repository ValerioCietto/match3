import { Battle, LEVELS, FACTIONS, TYPES, LASER_RANGE, setLevels } from './engine.mjs';
const $ = id => document.getElementById(id), canvas = $('map'), ctx = canvas.getContext('2d');
try {
  const response = await fetch(new URL('./levels.json', import.meta.url));
  if (!response.ok) throw new Error(`Level request failed: ${response.status}`);
  setLevels(await response.json());
} catch (error) {
  $('message').textContent = 'Unable to load levels.json. Check the JSON file and serve the game over HTTP, then reload.';
  throw error;
}
let battle, selected = null, paused = false, accumulator = 0, last = performance.now(), hover = null;
const colors = Object.fromEntries(Object.entries(FACTIONS).map(([k,v]) => [k,v.color]));
LEVELS.forEach((level,i) => $('level').add(new Option(`${String(i+1).padStart(2,'0')} / ${level.name}`,i)));
$('faction-stats').innerHTML = Object.entries(FACTIONS).map(([name,s]) => `<div class="faction-line" style="color:${s.color}"><b>${name}</b><br>Generation ${s.generation}/s · Attack ${s.attack}<br>Defence ${s.defence} · Speed ${s.speed} px/s<br>Productivity ${s.productivity}</div>`).join('');
function message(text) { $('message').textContent = text; }
function closePie() { $('pie').hidden = true; $('type-options').hidden = true; }
function reset() {
  battle = new Battle(Number($('level').value)); selected = null; paused = false; accumulator = 0; closePie();
  $('pause').textContent = 'Ⅱ Pause'; $('result').hidden = true;
  $('title').textContent = LEVELS[battle.level].name; $('subtitle').textContent = LEVELS[battle.level].description;
  $('operation').textContent = String(battle.level+1).padStart(2,'0');
  $('node-list').replaceChildren(...battle.nodes.map(n => { const b = document.createElement('button'); b.onclick = () => choose(n.id); b.dataset.node = n.id; return b; }));
  message('Awaiting orders. Select a blue outpost to begin.'); updateUI();
}
function choose(id) {
  if (battle.result) return;
  const node = battle.nodes[id], source = battle.nodes[selected];
  if (source && source.faction === 'Player' && selected !== id) {
    const count = Math.floor(source.population * Number($('amount').value)/100);
    if (battle.send(selected,id,Number($('amount').value)/100)) message(`${count} troops airborne → ${TYPES[node.type].label} ${id+1}.`);
    else message('Not enough population to deploy.');
    selected = null; closePie();
  } else if (selected === id && node.faction === 'Player') openPie();
  else { selected = id; closePie(); message(`${node.faction} ${TYPES[node.type].label} selected.${node.faction === 'Player' ? ' Choose a destination, or click again to manage.' : ' Select a blue outpost to issue orders.'}`); }
  updateUI();
}
function openPie() {
  const node = battle.nodes[selected]; if (!node || node.faction !== 'Player' || battle.result) return;
  const box = $('canvas-wrap').getBoundingClientRect();
  $('pie').style.left = `${Math.max(128,Math.min(box.width-128,node.x/1000*box.width))}px`;
  $('pie').style.top = `${Math.max(100,Math.min(box.height-120,node.y/600*box.height))}px`;
  $('pie').hidden = false; updateUI();
}
function purchase(action,type) {
  const upgrade = battle.nextWall(battle.nodes[selected]);
  if (battle.buy(selected,action,type)) { message(action === 'wall' ? `Wall tier ${battle.nodes[selected].wallLevel} complete. ${upgrade.detail}.` : 'Construction complete.'); closePie(); }
  else message('Order unavailable. Check ownership, gold, and node type.');
  updateUI();
}
$('wall').onclick = () => purchase('wall'); $('city').onclick = () => purchase('city');
$('change').onclick = () => { $('type-options').hidden = !$('type-options').hidden; };
Object.entries(TYPES).filter(([type]) => type !== 'city').forEach(([type,info]) => {
  const b = document.createElement('button'); b.textContent = `${info.icon} ${info.label}`; b.dataset.type = type; b.onclick = () => purchase('type',type); $('type-options').append(b);
});
const cancelType = document.createElement('button'); cancelType.textContent = '← Back'; cancelType.onclick = () => { $('type-options').hidden = true; }; $('type-options').append(cancelType);
$('close-pie').onclick = closePie; $('upgrades').onclick = openPie;
$('level').onchange = reset; $('restart').onclick = reset; $('again').onclick = reset;
$('amount').oninput = () => { $('amount-label').textContent = `${$('amount').value}%`; };
$('pause').onclick = () => { paused = !paused; $('pause').textContent = paused ? '▶ Resume' : 'Ⅱ Pause'; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { selected = null; closePie(); updateUI(); } });
document.addEventListener('visibilitychange', () => { last = performance.now(); accumulator = 0; });
function point(event) { const r = canvas.getBoundingClientRect(); return { x: (event.clientX-r.left)/r.width*1000, y: (event.clientY-r.top)/r.height*600 }; }
function hit(p) { return battle.nodes.find(n => Math.hypot(n.x-p.x,n.y-p.y)<37); }
canvas.addEventListener('pointerdown',e => { const node = hit(point(e)); if (node) choose(node.id); else { selected = null; closePie(); updateUI(); } });
canvas.addEventListener('pointermove',e => { hover = point(e); }); canvas.addEventListener('pointerleave',() => { hover = null; });
function updateUI() {
  const own = battle.nodes.filter(n => n.faction === 'Player');
  $('gold').textContent = Math.floor(battle.gold.Player); $('income').textContent = `+${battle.income('Player').toFixed(2)} / s`;
  $('territory').textContent = `${own.length} / ${battle.nodes.length}`;
  $('population').textContent = Math.floor(own.reduce((s,n) => s+n.population,0) + battle.flights.filter(f => f.faction === 'Player').reduce((s,f) => s+f.count,0));
  $('timer').textContent = `${String(Math.floor(battle.time/60)).padStart(2,'0')}:${String(Math.floor(battle.time%60)).padStart(2,'0')}`;
  const n = battle.nodes[selected], managed = n?.faction === 'Player' && !battle.result;
  $('selected-name').textContent = n ? `${TYPES[n.type].label} ${n.id+1}` : 'Choose an outpost';
  $('selected-detail').textContent = n ? `${n.faction} territory · ${n.x}, ${n.y}` : 'Select a blue node to inspect your forces and issue orders.';
  $('node-stats').innerHTML = n ? `<div>POPULATION<b>${n.population.toFixed(1)}</b></div><div>DEFENCE<b>${battle.defence(n).toFixed(1)}</b></div><div>GROWTH<b>+${battle.generation(n)}/s</b></div><div>GOLD OUTPUT<b>+${(TYPES[n.type].income*FACTIONS[n.faction].productivity).toFixed(2)}/s</b></div><div>LAUNCH ATTACK<b>${battle.attack(n).toFixed(2)}</b></div><div>WALL TIER<b>${n.wallLevel} / 3</b></div><div>ANTI-AIR<b>${battle.hasLaser(n) ? '1 DPS' : 'None'}</b></div><div>LASER RANGE<b>${battle.hasLaser(n) ? '300 px' : '—'}</b></div>` : '';
  const wallUpgrade = battle.nextWall(n);
  $('upgrades').disabled = !managed; $('wall').disabled = !managed || !wallUpgrade || battle.gold.Player < wallUpgrade.cost;
  $('wall').querySelector('strong').textContent = wallUpgrade?.label ?? 'Fully fortified';
  $('wall').querySelector('small').textContent = wallUpgrade ? `${wallUpgrade.cost} gold · ${wallUpgrade.detail}` : 'Maximum tier';
  $('city').disabled = !managed || n.type !== 'village' || battle.gold.Player < 100;
  $('change').disabled = !managed || battle.gold.Player < 60;
  for (const b of $('type-options').children) if (b.dataset.type) b.disabled = !managed || n.type === b.dataset.type || battle.gold.Player < 60;
  if (!managed) closePie();
  for (const b of $('node-list').children) { const node = battle.nodes[Number(b.dataset.node)]; b.textContent = `${node.id+1}. ${TYPES[node.type].label} · ${node.faction} · ${Math.floor(node.population)}`; b.style.color = colors[node.faction]; }
  if (battle.result) {
    $('result').hidden = false; $('result-title').textContent = battle.result === 'victory' ? 'Air superiority achieved.' : 'Command lost.';
    $('result-copy').textContent = battle.result === 'victory' ? 'Every outpost is yours. Choose the next battlefield to continue.' : 'Your last forces have fallen. Regroup and try another approach.';
  }
}
function line(points,stroke,width=1) { ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
function plane(x,y,angle,color,size=1) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(size,size); ctx.fillStyle=color;
  ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(2,-3); ctx.lineTo(-5,-13); ctx.lineTo(-9,-13); ctx.lineTo(-5,-2); ctx.lineTo(-12,-5); ctx.lineTo(-14,-4); ctx.lineTo(-11,0); ctx.lineTo(-14,4); ctx.lineTo(-12,5); ctx.lineTo(-5,2); ctx.lineTo(-9,13); ctx.lineTo(-5,13); ctx.lineTo(2,3); ctx.closePath(); ctx.fill(); ctx.restore();
}
function draw() {
  const dpr = Math.min(window.devicePixelRatio||1,2), rect = canvas.getBoundingClientRect();
  const w = Math.round(rect.width*dpr), h = Math.round(rect.height*dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
  ctx.setTransform(w/1000,0,0,h/600,0,0); ctx.fillStyle='#172b30'; ctx.fillRect(0,0,1000,600);
  // Topographic contours and a river are drawn in the same coordinates as the level arrays.
  for (let i=0;i<18;i++) {
    ctx.beginPath(); ctx.ellipse(130,150,100+i*32,60+i*24,-.55,0,Math.PI*2); ctx.strokeStyle='#29403b';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath(); ctx.ellipse(850,540,80+i*26,50+i*21,.5,0,Math.PI*2);ctx.stroke();
  }
  const river = [[520,-30],[550,90],[510,185],[545,270],[470,360],[450,465],[510,630]];
  ctx.lineJoin='round'; line(river,'#304b4d',35);line(river,'#1c363e',29);line(river,'#294952',1);
  ctx.strokeStyle='#7290980b';ctx.lineWidth=1;for(let x=0;x<1000;x+=50)line([[x,0],[x,600]],'#7290980d');for(let y=0;y<600;y+=50)line([[0,y],[1000,y]],'#7290980d');
  // Deterministic map texture.
  for(let i=0;i<95;i++){const x=(i*173+33)%990,y=(i*97+44)%590;ctx.fillStyle='#49635530';ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x-4,y+4);ctx.lineTo(x+4,y+4);ctx.fill();}
  for(const n of battle.nodes){
    const nearest = battle.nodes.filter(o=>o.id>n.id && Math.hypot(o.x-n.x,o.y-n.y)<330);
    ctx.setLineDash([3,7]);for(const other of nearest)line([[n.x,n.y],[other.x,other.y]],'#7b93852a');ctx.setLineDash([]);
  }
  const source = battle.nodes[selected];
  if(source && battle.hasLaser(source)){
    ctx.beginPath();ctx.arc(source.x,source.y,LASER_RANGE,0,Math.PI*2);ctx.fillStyle=`${colors[source.faction]}08`;ctx.fill();ctx.setLineDash([8,8]);ctx.strokeStyle=`${colors[source.faction]}65`;ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  }
  if(source?.faction === 'Player' && hover && $('pie').hidden){ctx.setLineDash([6,6]);line([[source.x,source.y],[hover.x,hover.y]],'#63b8ff80');ctx.setLineDash([]);}
  for(const {node,flight} of battle.beams){
    const points=[[node.x,node.y],[flight.x,flight.y]], color=colors[node.faction];
    ctx.save();ctx.shadowColor=color;ctx.shadowBlur=12;line(points,`${color}55`,7);line(points,color,2);line(points,'#f2fbff',.8);ctx.restore();
    ctx.beginPath();ctx.arc(flight.x,flight.y,3,0,Math.PI*2);ctx.fillStyle='#fff2c9';ctx.fill();
  }
  for(const f of battle.flights){const t=battle.nodes[f.target],a=Math.atan2(t.y-f.y,t.x-f.x);line([[f.x-Math.cos(a)*30,f.y-Math.sin(a)*30],[f.x,f.y]],`${colors[f.faction]}60`,2);plane(f.x,f.y,a,colors[f.faction],.7);ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e6edf1';ctx.fillText(Number(f.count.toFixed(1)),f.x,f.y+23);}
  for(const n of battle.nodes){
    const color=colors[n.faction], active=selected===n.id;
    ctx.beginPath();ctx.arc(n.x,n.y,active?39:34,0,Math.PI*2);ctx.fillStyle=`${color}0c`;ctx.fill();ctx.strokeStyle=active?color:`${color}45`;ctx.lineWidth=active?2:1;ctx.stroke();
    if(n.wallLevel){
      ctx.strokeStyle='#e7c47e';ctx.lineWidth=2;
      if(n.wallLevel>=2){
        // Four solid quarters with openings at north, east, south, and west.
        for(let quarter=0;quarter<4;quarter++){ctx.beginPath();ctx.arc(n.x,n.y,31,quarter*Math.PI/2+.14,(quarter+1)*Math.PI/2-.14);ctx.stroke();}
      }
      ctx.beginPath();ctx.arc(n.x,n.y,n.wallLevel>=2?41:31,0,Math.PI*2);ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.beginPath();ctx.arc(n.x,n.y,25,0,Math.PI*2);ctx.fillStyle='#15242d';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=color;ctx.textAlign='center';ctx.font='23px sans-serif';ctx.fillText(TYPES[n.type].icon,n.x,n.y+7);
    if(battle.hasLaser(n)){ctx.fillStyle='#b4faff';ctx.fillRect(n.x-4,n.y-24,8,5);line([[n.x,n.y-24],[n.x,n.y-32]],'#b4faff',2);}
    ctx.fillStyle=color;ctx.fillRect(n.x-17,n.y+20,34,21);ctx.fillStyle='#10212a';ctx.font='bold 14px sans-serif';ctx.fillText(Math.floor(n.population),n.x,n.y+35);
    ctx.font='9px sans-serif';ctx.fillStyle='#adbbc0';ctx.fillText(`${TYPES[n.type].label.toUpperCase()} ${n.id+1}`,n.x,n.y+57);
  }
  ctx.textAlign='right';ctx.font='10px monospace';ctx.fillStyle='#8aabaf';ctx.fillText('N',970,32);line([[967,62],[967,40]],'#8aabaf');line([[962,46],[967,40],[972,46]],'#8aabaf');
}
let uiTime = 0;
function frame(now) {
  const elapsed = Math.min((now-last)/1000,.25); last=now;
  if(!paused && !document.hidden && !battle.result){ accumulator += elapsed*Number($('speed').value); while(accumulator>=.1){battle.tick(.1);accumulator-=.1;} }
  uiTime+=elapsed;if(uiTime>=.1){updateUI();uiTime=0;}draw();requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
