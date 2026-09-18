'use strict';
const { TICK_SECONDS, gear, fresh, stats, buy, equipmentOffer, normalizeInventory, Battle } = RTS;
const $ = id => document.getElementById(id);
const adventure = typeof RTS_ADVENTURE !== 'undefined' ? RTS_ADVENTURE : null;
const storageKey = adventure ? adventure.storageKey : 'three-warriors-v1';
let simulationSpeed = 1, paused = false;
document.querySelectorAll('input[name="battleSpeed"]').forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) simulationSpeed = Number(input.value);
  });
});
let state = adventure ? adventure.fresh() : fresh(), battle = null, shopTeam = 'red', accumulator = 0, last = performance.now();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  for (const team of ['red', 'blue']) {
    if (Array.isArray(saved?.[team]?.warriors)) for (const warrior of saved[team].warriors) {
      if (warrior && warrior.training === undefined) warrior.training = 'standard';
    }
  }
  if (saved && Number.isInteger(saved.round) && saved.round > 0 && ['red', 'blue'].every(t => Number.isFinite(saved[t]?.gp) && saved[t].gp >= 0 && saved[t].warriors?.length === 3 && saved[t].warriors.every(w => Object.keys(gear).every(slot => Object.hasOwn(gear[slot], w[slot]))))) state = saved;
  if (adventure) state = adventure.restore(saved);
} catch (_) { /* Fresh state when storage is unavailable or invalid. */ }
normalizeInventory(state);
save();
function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) { $('result').textContent += ' Browser storage unavailable; progress lasts for this session.'; } }
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
  for (const id of ['redShop', 'blueShop', 'start', 'reset']) if ($(id)) $(id).disabled = !!battle && !battle.done;
  if (adventure) refreshAdventure();
}
function refreshAdventure() {
  const level = adventure.currentLevel(state), progress = state.adventure;
  const active = !!battle && !battle.done;
  $('round').textContent = `Level ${level.id} / ${adventure.data.levels.length} - ${level.name}`;
  $('levelDescription').textContent = level.description;
  $('enemyBudget').textContent = `${level.equipmentCost} GP enemy loadout`;
  $('campaignProgress').textContent = `${progress.cleared} / ${adventure.data.levels.length} cleared`;
  $('levelTrail').innerHTML = adventure.data.levels.map(l => `<li class="${l.id <= progress.cleared ? 'cleared' : l.id === progress.level ? 'current' : 'locked'}" ${l.id === progress.level ? 'aria-current="step"' : ''} title="${escapeHTML(l.name)}"><span>${String(l.id).padStart(2, '0')}</span><small>${l.id <= progress.cleared ? 'Cleared' : l.id === progress.level ? 'Current' : 'Locked'}</small></li>`).join('');
  $('start').disabled = active || !adventure.canFight(state);
  $('start').textContent = adventure.complete(state) ? 'Adventure complete' : !adventure.canFight(state) ? 'Level cleared' : battle?.done ? 'Retry battle' : 'Start battle';
  $('nextBattle').hidden = adventure.canFight(state) || adventure.complete(state);
  $('nextBattle').disabled = active || adventure.canFight(state) || adventure.complete(state);
  const living = battle ? battle.units.filter(u => u.team === 'blue' && u.hp > 0).length : 3;
  $('blueScore').textContent = `ENEMY / LEVEL ${progress.level} / ${living} alive`;
}
function adventureReadyMessage() {
  return adventure.complete(state) ? 'Adventure complete! All 20 battles won. Your team and final reward are saved.' : !adventure.canFight(state) ? 'Victory saved. Upgrade your red team, then continue to the next battle.' : 'Upgrade your red team and defeat the enemy to advance. Each first victory awards 60 GP; defeats and draws can be retried for free.';
}
let shopWarrior = 0, shopSlot = 'weapon', previewItem = null;
const slotNames = { weapon: 'Weapon', armor: 'Armor', feet: 'Boots & mounts', training: 'Training' };
const slotIcons = { weapon: '↗', armor: '◇', feet: '➜', training: '◎' };
const statNames = { hp: 'Max HP', damage: 'Damage', dps: 'DPS', speed: 'Speed', range: 'Range', regen: 'Regen / s', healing: 'Heal / cast' };
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const statValue = value => Number(value.toFixed(1));
function itemAvailability(key, warrior) {
  const offer = equipmentOffer(state, shopTeam, shopSlot, key);
  const equipped = warrior[shopSlot] === key;
  if (offer.persistent) return `${equipped ? 'Equipped · ' : ''}${offer.owned} owned · ${offer.available} available`;
  return equipped ? 'Equipped' : offer.cost > state[shopTeam].gp ? `${offer.cost - state[shopTeam].gp} GP needed` : 'Available';
}
function renderShop(focusKey) {
  const team = state[shopTeam], warrior = team.warriors[shopWarrior];
  const selected = previewItem ?? warrior[shopSlot], item = gear[shopSlot][selected];
  const current = stats(warrior), next = stats({ ...warrior, [shopSlot]: selected });
  const offer = equipmentOffer(state, shopTeam, shopSlot, selected);
  const equipped = selected === warrior[shopSlot], affordable = offer.cost <= team.gp;
  $('shop').dataset.team = shopTeam;
  $('shopTitle').textContent = `${shopTeam === 'red' ? 'Red' : 'Blue'} Team`;
  $('shopBudget').textContent = `${team.gp} GP available`;
  $('shopCards').innerHTML = `
    <nav class="warriorPicker" aria-label="Choose warrior">${team.warriors.map((w, i) => `<button class="warriorChoice ${i === shopWarrior ? 'active' : ''}" data-warrior="${i}" data-focus="warrior-${i}" aria-pressed="${i === shopWarrior}"><span class="warriorNumber">0${i + 1}</span><span><strong>Warrior ${i + 1}</strong><small>${escapeHTML(gear.weapon[w.weapon].name)} · ${stats(w).hp} HP</small></span></button>`).join('')}</nav>
    <div class="armoryLayout"><aside class="loadout"><p class="eyebrow">WARRIOR 0${shopWarrior + 1} / LOADOUT</p><nav class="slotPicker" aria-label="Equipment slot">${Object.keys(gear).map(slot => `<button class="slotChoice ${slot === shopSlot ? 'active' : ''}" data-slot="${slot}" data-focus="slot-${slot}" aria-pressed="${slot === shopSlot}"><span class="slotIcon" aria-hidden="true">${slotIcons[slot]}</span><span><small>${slotNames[slot]}</small><strong>${escapeHTML(gear[slot][warrior[slot]].name)}</strong></span></button>`).join('')}</nav><p class="loadoutHint">Select a slot to explore its equipment.</p></aside>
    <section class="equipmentCatalog" aria-label="${slotNames[shopSlot]} options"><div class="catalogHeading"><h3>${slotNames[shopSlot]}</h3><span>${Object.keys(gear[shopSlot]).length} options</span></div><div class="itemGrid">${Object.entries(gear[shopSlot]).map(([key, option]) => `<button class="itemCard ${key === selected ? 'selected' : ''}" data-item="${escapeHTML(key)}" data-focus="item-${escapeHTML(key)}" aria-pressed="${key === selected}"><span class="itemTop"><strong>${escapeHTML(option.name)}</strong><span class="price">${option.price ? `${option.price} GP` : 'Free'}</span></span><span class="itemDescription">${escapeHTML(option.description ?? '')}</span><span class="itemState ${key === warrior[shopSlot] ? 'isEquipped' : ''}">${itemAvailability(key, warrior)}</span></button>`).join('')}</div></section>
    <aside class="itemPreview" aria-label="Item preview"><p class="eyebrow">${equipped ? 'CURRENTLY EQUIPPED' : 'PREVIEW / WARRIOR 0' + (shopWarrior + 1)}</p><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description ?? '')}</p><p class="ownershipInfo">${offer.persistent ? `${offer.owned} owned by team / ${offer.used} equipped / ${offer.available} available. ${!equipped && offer.available === 0 ? 'Equipping buys another copy.' : 'Unequip a copy to make it available to another warrior.'}` : item.price === 0 ? 'Free option. Always available.' : 'Each replacement costs full price.'}</p><h4>Warrior stats <span>${equipped ? 'Current' : 'With this item'}</span></h4><dl class="statComparison">${Object.entries(statNames).filter(([key]) => !['regen', 'healing'].includes(key) || current[key] || next[key]).map(([key, label]) => { const delta = statValue(next[key] - current[key]); return `<div><dt>${label}</dt><dd>${statValue(next[key])}<span class="statDelta ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}">${delta ? `${delta > 0 ? '+' : ''}${delta}` : '—'}</span></dd></div>`; }).join('')}</dl>${!equipped ? '<p class="comparisonHint">Changes compared with current equipment.</p>' : ''}<button id="equipItem" class="primary equipButton" data-equip="${escapeHTML(selected)}" data-focus="equip" ${equipped || !affordable ? 'disabled' : ''}>${equipped ? '✓ Equipped' : !affordable ? `Need ${offer.cost - team.gp} more GP` : offer.cost ? `${offer.persistent ? 'Buy & equip' : 'Equip'} for ${offer.cost} GP` : offer.persistent ? 'Equip owned copy' : 'Equip for free'}</button><p class="balanceAfter">${equipped ? 'Choose another item to compare.' : affordable ? `${team.gp - offer.cost} GP remaining after equipping` : adventure ? 'Win this level to earn 60 GP.' : 'Earn 10 GP for each kill in battle.'}</p></aside></div>`;
  if (focusKey) [...$('shopCards').querySelectorAll('[data-focus]')].find(el => el.dataset.focus === focusKey)?.focus({ preventScroll: true });
}
for (const team of adventure ? ['red'] : ['red', 'blue']) $(team + 'Shop').onclick = () => {
  if (battle && !battle.done) return;
  shopTeam = team; shopWarrior = 0; shopSlot = 'weapon'; previewItem = null;
  $('shopMessage').textContent = ''; renderShop(); $('shop').showModal();
};
$('closeShop').onclick = () => $('shop').close();
$('shopCards').onclick = e => {
  const button = e.target.closest('button');
  if (!button || button.disabled) return;
  const { warrior, slot, item, equip, focus } = button.dataset;
  if (warrior !== undefined) { shopWarrior = Number(warrior); previewItem = null; }
  else if (slot) { shopSlot = slot; previewItem = null; }
  else if (item !== undefined) previewItem = item;
  else if (equip !== undefined) {
    if ((battle && !battle.done) || (adventure && shopTeam !== 'red')) return;
    if (buy(state, shopTeam, shopWarrior, shopSlot, equip)) {
      $('shopMessage').textContent = `${gear[shopSlot][equip].name} equipped on Warrior ${shopWarrior + 1}. ${state[shopTeam].gp} GP available.`;
      battle = null; save(); refresh();
    }
    renderShop(`item-${equip}`); return;
  }
  $('shopMessage').textContent = '';
  renderShop(focus);
};
$('reset').onclick = () => { if (confirm(adventure ? 'Restart the adventure? All campaign progress, red equipment and GP will be reset. Sandbox progress is kept.' : 'Reset both teams, equipment, and GP?')) { state = adventure ? adventure.fresh() : fresh(); battle = null; paused = false; save(); refresh(); $('result').textContent = adventure ? adventureReadyMessage() : 'New sandbox ready. Each team starts with 120 GP.'; } };
$('pause').onclick = () => {
  if (!battle || battle.done) return;
  paused = !paused; last = performance.now();
  $('result').textContent = paused ? 'Battle paused. Press Resume to continue.' : 'Battle in progress. Warriors follow their equipped training.';
  refresh();
};
$('start').onclick = () => {
  if ((battle && !battle.done) || (adventure && !adventure.canFight(state))) return;
  if (adventure) state = adventure.restore(state);
  paused = false; battle = new Battle(state); accumulator = 0; last = performance.now(); $('result').textContent = 'Battle in progress. Warriors follow their equipped training.'; refresh();
};
if (adventure) $('nextBattle').onclick = () => {
  if ((battle && !battle.done) || !adventure.advance(state)) return;
  battle = null; paused = false; accumulator = 0;
  save(); refresh(); $('result').textContent = adventureReadyMessage();
};
function finishBattle() {
  battle.finishedAt = performance.now();
  if (adventure) {
    const reward = adventure.finish(state, battle);
    $('result').textContent = reward ? adventure.complete(state) ? 'Adventure complete! All 20 levels cleared. Final victory: +60 GP. Your progress is saved.' : `Victory! Level ${state.adventure.level} cleared. +60 GP. Upgrade your red team, then continue to the next battle.` : `${battle.winner ? 'Defeat' : 'Draw'}. No GP lost. Adjust your equipment and retry this level.`;
  } else {
    for (const team of ['red', 'blue']) state[team].gp += battle.rewards[team];
    state.round++;
    $('result').textContent = `${battle.winner ? battle.winner.toUpperCase() + ' wins' : 'Draw'} · ${battle.reason === 'timeout' ? 'Time limit: compared total HP remaining percentages' : 'Both sides resolved their final attacks'} · Red earned ${battle.rewards.red} GP / Blue earned ${battle.rewards.blue} GP. Upgrade and battle again.`;
  }
  save();
}
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
    if (e.type === 'kill') { ctx.fillStyle = e.team === 'red' ? '#ff8585' : '#7db9ff'; ctx.font = '12px system-ui'; ctx.fillText(`${e.team.toUpperCase()}${adventure ? '' : ' +10 GP'} · Enemy ${e.number} eliminated`, 600, 30 + scene.events.filter(v => v.type === 'kill').indexOf(e) * 20); }
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
      if (battle.done) finishBattle();
    }
  }
  if (advanced) refresh();
  draw(battle?.done ? 1 : accumulator / TICK_SECONDS); requestAnimationFrame(frame);
}
if (adventure) $('result').textContent = adventureReadyMessage();
refresh(); requestAnimationFrame(frame);
