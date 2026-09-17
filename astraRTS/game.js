'use strict';
const { TICK_SECONDS, gear, fresh, stats, buy, Battle } = RTS;
const $ = id => document.getElementById(id);
let simulationSpeed = 1, paused = false;
document.querySelectorAll('input[name="battleSpeed"]').forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) simulationSpeed = Number(input.value);
  });
});
let state = fresh(), battle = null, shopTeam = 'red', accumulator = 0, last = performance.now();
try {
  const saved = JSON.parse(localStorage.getItem('three-warriors-v1'));
  for (const team of ['red', 'blue']) {
    if (Array.isArray(saved?.[team]?.warriors)) for (const warrior of saved[team].warriors) {
      if (warrior && warrior.training === undefined) warrior.training = 'standard';
    }
  }
  if (saved && Number.isInteger(saved.round) && saved.round > 0 && ['red', 'blue'].every(t => Number.isFinite(saved[t]?.gp) && saved[t].gp >= 0 && saved[t].warriors?.length === 3 && saved[t].warriors.every(w => Object.keys(gear).every(slot => Object.hasOwn(gear[slot], w[slot]))))) state = saved;
} catch (_) { /* Fresh state when storage is unavailable or invalid. */ }
function save() { try { localStorage.setItem('three-warriors-v1', JSON.stringify(state)); } catch (_) { $('result').textContent += ' Browser storage unavailable; progress lasts for this session.'; } }
function refresh() {
  $('pause').disabled = !battle || battle.done;
  $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('pause').setAttribute('aria-pressed', String(paused));
  $('round').textContent = `Battle ${state.round}`;
  for (const team of ['red', 'blue']) {
    const living = battle ? battle.units.filter(u => u.team === team && u.hp > 0).length : 3;
    $(team + 'Score').textContent = `${team.toUpperCase()} / ${state[team].gp} GP / ${living} alive`;
    $(team + 'Roster').innerHTML = state[team].warriors.map((w, i) => { const s = stats(w); return `<div class="rosterRow"><strong>0${i + 1} · ${gear.weapon[w.weapon].name}</strong><small>${gear.armor[w.armor].name} / ${gear.feet[w.feet].name} / ${gear.training[w.training].name} · ${s.hp} HP</small></div>`; }).join('');
  }
  for (const id of ['redShop', 'blueShop', 'start', 'reset']) $(id).disabled = !!battle && !battle.done;
}
function renderShop() {
  $('shop').dataset.team = shopTeam;
  $('shopTitle').textContent = `${shopTeam === 'red' ? 'Red' : 'Blue'} Team · ${state[shopTeam].gp} GP`;
  $('shopCards').innerHTML = state[shopTeam].warriors.map((w, i) => { const s = stats(w); return `<article class="warriorCard"><h3>Warrior ${i + 1}</h3><div class="stats">HP <b>${s.hp}</b> · Regen <b>${s.regen}/s</b>${s.healing ? ` · Heal <b>${s.healing}/cast</b>` : ''}<br>Damage <b>${s.damage}</b><br>DPS <b>${s.dps.toFixed(1)}</b> · Speed <b>${s.speed.toFixed(1)}</b><br>Range <b>${s.range}</b> · Armor <b>${s.armor}</b></div>${Object.entries(gear).map(([slot, options]) => `<label>${slot === 'feet' ? 'Feet / Mount' : slot[0].toUpperCase() + slot.slice(1)}<select data-warrior="${i}" data-slot="${slot}">${Object.entries(options).map(([key, item]) => `<option value="${key}" ${w[slot] === key ? 'selected' : ''} ${item.price > state[shopTeam].gp && w[slot] !== key ? 'disabled' : ''}>${item.name} · ${item.price} GP${w[slot] === key ? ' (equipped)' : ''}</option>`).join('')}</select></label>`).join('')}</article>`; }).join('');
}
for (const team of ['red', 'blue']) $(team + 'Shop').onclick = () => { shopTeam = team; $('shopMessage').textContent = ''; renderShop(); $('shop').showModal(); };
$('closeShop').onclick = () => $('shop').close();
$('shopCards').onchange = e => {
  const { warrior, slot } = e.target.dataset;
  if (slot && buy(state, shopTeam, Number(warrior), slot, e.target.value)) { $('shopMessage').textContent = 'Equipment updated.'; battle = null; save(); refresh(); }
  renderShop();
};
$('reset').onclick = () => { if (confirm('Reset both teams, equipment, and GP?')) { state = fresh(); battle = null; save(); refresh(); $('result').textContent = 'New sandbox ready. Each team starts with 120 GP.'; } };
$('pause').onclick = () => {
  if (!battle || battle.done) return;
  paused = !paused; last = performance.now();
  $('result').textContent = paused ? 'Battle paused. Press Resume to continue.' : 'Battle in progress. Warriors follow their equipped training.';
  refresh();
};
$('start').onclick = () => { paused = false; battle = new Battle(state); accumulator = 0; last = performance.now(); $('result').textContent = 'Battle in progress. Warriors follow their equipped training.'; refresh(); };
const ctx = $('field').getContext('2d');
function stone(x, y, size, rotation, fill = '#a6a59b') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  ctx.fillStyle = fill; ctx.strokeStyle = '#555b58'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-size, -size * .35); ctx.lineTo(-size * .4, -size);
  ctx.lineTo(size * .65, -size * .7); ctx.lineTo(size, size * .25);
  ctx.lineTo(size * .2, size * .8); ctx.lineTo(-size * .75, size * .65);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#dedbc7'; ctx.beginPath(); ctx.moveTo(-size * .4, -size * .7);
  ctx.lineTo(size * .15, -size * .15); ctx.lineTo(size * .7, size * .15); ctx.stroke(); ctx.restore();
}
function draw(alpha) {
  ctx.fillStyle = '#14232a'; ctx.fillRect(0, 0, 1200, 500);
  ctx.strokeStyle = '#ffffff06'; ctx.lineWidth = 1;
  for (let x = 0; x <= 1200; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke(); }
  for (let y = 0; y <= 500; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
  ctx.fillStyle = '#ff737306'; ctx.fillRect(0, 0, 250, 500); ctx.fillStyle = '#65acff06'; ctx.fillRect(950, 0, 250, 500);
  ctx.setLineDash([5, 10]); ctx.strokeStyle = '#74888a40'; ctx.beginPath(); ctx.moveTo(600, 25); ctx.lineTo(600, 475); ctx.stroke(); ctx.setLineDash([]);
  const scene = battle || new Battle(state);
  const effectTime = scene.time + (scene.done && scene.finishedAt ? (performance.now() - scene.finishedAt) / 1000 : 0);
  for (const impact of scene.debris) {
    const age = Math.max(0, effectTime - impact.time), scatter = Math.min(1, age / .4);
    ctx.fillStyle = '#080e1438'; ctx.beginPath(); ctx.ellipse(impact.x, impact.y, 22 * impact.scale, 12 * impact.scale, 0, 0, Math.PI * 2); ctx.fill();
    for (const fragment of impact.fragments) {
      const spread = fragment.spread * scatter;
      const hop = Math.sin(scatter * Math.PI) * fragment.hop;
      stone(impact.x + Math.cos(fragment.angle) * spread,
        impact.y + Math.sin(fragment.angle) * spread * .65 - hop,
        fragment.size, fragment.rotation + scatter * fragment.spin, fragment.fill);
    }
  }
  for (const impact of scene.events.filter(e => e.type === 'impact')) {
    const age = effectTime - impact.time;
    if (age < 0 || age >= .7) continue;
    const opacity = (1 - age / .7) * .8;
    const flash = ctx.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, impact.radius);
    flash.addColorStop(0, `rgba(255,248,209,${opacity})`);
    flash.addColorStop(.4, `rgba(244,198,115,${opacity * .65})`);
    flash.addColorStop(1, 'rgba(244,198,115,0)');
    ctx.fillStyle = flash; ctx.beginPath(); ctx.arc(impact.x, impact.y, impact.radius, 0, Math.PI * 2); ctx.fill();
  }
  const positions = Object.fromEntries(scene.units.map(u => [u.id, { x: u.prevX + (u.x - u.prevX) * alpha, y: u.prevY + (u.y - u.prevY) * alpha }]));
  if ($('targets').checked) for (const u of scene.units.filter(u => u.hp > 0 && u.target)) {
    const t = scene.units.find(t => t.id === u.target && t.hp > 0); if (!t) continue;
    ctx.strokeStyle = u.team === 'red' ? '#ff85851b' : '#7db9ff1b'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(positions[u.id].x, positions[u.id].y); ctx.lineTo(positions[t.id].x, positions[t.id].y); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const u of scene.units) {
    const { x, y } = positions[u.id];
    if (u.hp <= 0) { ctx.strokeStyle = '#75808c50'; ctx.beginPath(); ctx.moveTo(x - 7, y - 7); ctx.lineTo(x + 7, y + 7); ctx.moveTo(x + 7, y - 7); ctx.lineTo(x - 7, y + 7); ctx.stroke(); continue; }
    ctx.save(); const scale = u.radius / 15; ctx.translate(x, y); ctx.scale(scale, scale); ctx.translate(-x, -y);
    const color = u.team === 'red' ? '#ff8585' : '#7db9ff';
    if (u.feet === 'horse') { ctx.fillStyle = '#806443'; ctx.beginPath(); ctx.ellipse(x, y + 7, 23, 12, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(x, y + 16, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = u.team === 'red' ? '#743c48' : '#30597c'; ctx.strokeStyle = color; ctx.lineWidth = u.armor === 'plate' ? 5 : u.armor === 'heavy' ? 3 : 2; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 12px system-ui'; ctx.fillText(u.number, x, y + 4);
    const side = u.team === 'red' ? 1 : -1; ctx.strokeStyle = '#d8e2e8'; ctx.lineWidth = 2; ctx.beginPath();
    if (u.weapon === 'bow' || u.weapon === 'fastBow') ctx.arc(x + side * 19, y, 11, -Math.PI / 2, Math.PI / 2, side < 0);
    else if (u.weapon === 'healer') {
      ctx.strokeStyle = '#c9ac70'; ctx.moveTo(x + side * 24, y + 18); ctx.lineTo(x + side * 24, y - 24); ctx.stroke();
      ctx.strokeStyle = '#91e8aa'; ctx.beginPath();
      ctx.moveTo(x + side * 29, y - 20);
      ctx.bezierCurveTo(x + side * 10, y - 25, x + side * 13, y - 7, x + side * 24, y - 6);
      ctx.bezierCurveTo(x + side * 36, y - 5, x + side * 34, y + 10, x + side * 18, y + 8);
    }
    else if (u.weapon === 'shield') { ctx.moveTo(x + side * 18, y - 14); ctx.lineTo(x + side * 29, y - 9); ctx.lineTo(x + side * 27, y + 10); ctx.lineTo(x + side * 18, y + 17); ctx.closePath(); }
    else if (u.weapon === 'spear') { ctx.moveTo(x + side * 12, y + 12); ctx.lineTo(x + side * 44, y - 20); ctx.lineTo(x + side * 33, y - 17); ctx.moveTo(x + side * 44, y - 20); ctx.lineTo(x + side * 41, y - 9); }
    else if (u.weapon === 'catapult') { ctx.rect(x + side * 22 - 12, y - 9, 24, 18); ctx.moveTo(x + side * 15, y + 8); ctx.lineTo(x + side * 32, y - 20); ctx.arc(x + side * 32, y - 20, 5, 0, Math.PI * 2); }
    else if (u.weapon === 'ballista') { ctx.moveTo(x + side * 22, y - 16); ctx.lineTo(x + side * 22, y + 16); ctx.moveTo(x + side * 10, y); ctx.lineTo(x + side * 38, y); }
    else if (u.weapon !== 'stone throw') { ctx.moveTo(x + side * 17, y + 8); ctx.lineTo(x + side * 24, y - 13); } ctx.stroke();
    if (u.weapon === 'stone throw') stone(x + side * 23, y - 2, 7, .3);
    if (u.weapon === 'mace') { ctx.fillStyle = '#a4adb7'; ctx.fillRect(x + side * 24 - 4, y - 17, 8, 8); }
    ctx.fillStyle = '#071017'; ctx.fillRect(x - 23, y - 33, 46, 5); ctx.fillStyle = color; ctx.fillRect(x - 23, y - 33, 46 * u.hp / u.maxHp, 5);
    ctx.font = '10px system-ui'; ctx.fillText(`${Math.ceil(u.hp)} / ${u.maxHp}`, x, y - 40);
    ctx.restore();
  }
  for (const p of scene.projectiles) {
    if (p.weapon === 'catapult' || p.weapon === 'stone throw') {
      const scale = p.weapon === 'stone throw' ? .4 : 1;
      const t = Math.max(0, Math.min(1, (p.age - TICK_SECONDS + alpha * TICK_SECONDS) / p.duration));
      const arc = 4 * t * (1 - t), x = p.startX + (p.endX - p.startX) * t, y = p.startY + (p.endY - p.startY) * t;
      ctx.fillStyle = `rgba(0,0,0,${.3 - arc * .15})`; ctx.beginPath(); ctx.ellipse(x, y, (8 + arc * 7) * scale, (4 + arc * 3) * scale, 0, 0, Math.PI * 2); ctx.fill();
      stone(x, y - arc * 95 * scale, (6 + arc * 13) * scale, t * 3);
    } else if (p.weapon === 'ballista') {
      ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 32, p.y - p.dy * 32); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 9 - p.dy * 6, p.y - p.dy * 9 + p.dx * 6);
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(p.x - p.dx * 9 + p.dy * 6, p.y - p.dy * 9 - p.dx * 6); ctx.stroke();
    } else { ctx.fillStyle = '#f3db9c'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); }
  }
  for (const e of scene.events) {
    const age = scene.time - e.time;
    if (e.type === 'healPulse' && age < .6) { ctx.fillStyle = `rgba(100,245,160,${(1 - age / .6) * .18})`; ctx.strokeStyle = `rgba(100,245,160,${1 - age / .6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    if (e.type === 'heal' && age < 1) { ctx.fillStyle = `rgba(120,255,180,${1 - age})`; ctx.font = 'bold 13px system-ui'; ctx.fillText(`+${Number(e.amount.toFixed(1))}`, e.x - 20, e.y - 20 - age * 35); }
    if (e.type === 'damage' && age < 1) { ctx.fillStyle = `rgba(255,225,168,${1 - age})`; ctx.font = 'bold 13px system-ui'; ctx.fillText(`−${Number(e.damage.toFixed(1))}`, e.x + 20, e.y - 18 - age * 35); }
    if (e.type === 'attack' && age < .2) { const a = positions[e.from], b = positions[e.to]; ctx.strokeStyle = '#fff8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); const d = Math.hypot(b.x - a.x, b.y - a.y) || 1; ctx.lineTo(a.x + (b.x - a.x) / d * 26, a.y + (b.y - a.y) / d * 26); ctx.stroke(); }
    if (e.type === 'kill') { ctx.fillStyle = e.team === 'red' ? '#ff8585' : '#7db9ff'; ctx.font = '12px system-ui'; ctx.fillText(`${e.team.toUpperCase()} +10 GP · Enemy ${e.number} eliminated`, 600, 30 + scene.events.filter(v => v.type === 'kill').indexOf(e) * 20); }
  }
  const seconds = Math.floor(scene.time); $('timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')} / 02:00`;
}
function frame(now) {
  if (!paused) accumulator += Math.min((now - last) / 1000, .25) * simulationSpeed;
  last = now;
  let advanced = false;
  while (!paused && accumulator >= TICK_SECONDS) {
    accumulator -= TICK_SECONDS;
    if (battle && !battle.done) {
      battle.step();
      advanced = true;
      if (battle.done) { battle.finishedAt = performance.now(); for (const team of ['red', 'blue']) state[team].gp += battle.rewards[team]; state.round++; $('result').textContent = `${battle.winner ? battle.winner.toUpperCase() + ' wins' : 'Draw'} · ${battle.reason === 'timeout' ? 'Time limit: compared total HP remaining percentages' : 'Both sides resolved their final attacks'} · Red earned ${battle.rewards.red} GP / Blue earned ${battle.rewards.blue} GP. Upgrade and battle again.`; save(); }
    }
  }
  if (advanced) refresh();
  draw(battle?.done ? 1 : accumulator / TICK_SECONDS); requestAnimationFrame(frame);
}
refresh(); requestAnimationFrame(frame);
