(function (root) {
  'use strict';
  const TICK_SECONDS = 1 / 50;
  const gear = typeof module !== 'undefined' ? require('./items.json') : root.RTS_ITEMS;
  const ownedSlots = ['weapon', 'feet'];
  const freshTeam = () => ({ gp: 120, inventory: { weapon: {}, feet: {} }, warriors: Array.from({ length: 3 }, () => ({ weapon: 'sword', armor: 'none', feet: 'none', training: 'standard' })) });
  const fresh = () => ({ round: 1, red: freshTeam(), blue: freshTeam() });
  // Counts include equipped copies. Recover existing loadouts when upgrading old saves.
  function normalizeInventory(state) {
    for (const team of ['red', 'blue']) {
      const roster = state[team], inventory = {};
      for (const slot of ownedSlots) {
        inventory[slot] = {};
        for (const [key, item] of Object.entries(gear[slot])) {
          if (!item.price) continue; // Free defaults are unlimited.
          const equipped = roster.warriors.filter(w => w[slot] === key).length;
          const saved = roster.inventory?.[slot]?.[key];
          const quantity = Math.max(equipped, Number.isSafeInteger(saved) && saved >= 0 ? saved : 0);
          if (quantity) inventory[slot][key] = quantity;
        }
      }
      roster.inventory = inventory;
    }
    return state;
  }
  function equipmentOffer(state, team, slot, key) {
    const item = gear[slot][key], roster = state[team];
    const persistent = ownedSlots.includes(slot) && item.price > 0;
    const used = roster.warriors.filter(w => w[slot] === key).length;
    const owned = persistent ? Math.max(roster.inventory?.[slot]?.[key] ?? 0, used) : 0;
    const available = owned - used;
    return { persistent, owned, used, available, cost: persistent && available > 0 ? 0 : item.price };
  }
  function stats(loadout) {
    const weapon = gear.weapon[loadout.weapon], armor = gear.armor[loadout.armor];
    return { hp: (100 + armor.hp + (weapon.hp ?? 0)) * (armor.hpMultiplier ?? 1), regen: armor.regen ?? 0, damage: weapon.damage * (armor.damageMultiplier ?? 1), healing: weapon.healing ?? 0, rate: weapon.rate, dps: weapon.damage * (armor.damageMultiplier ?? 1) * weapon.rate, speed: 50 * (gear.training[loadout.training ?? 'standard'].movement ?? 1) * (weapon.movement ?? 1) * armor.movement * gear.feet[loadout.feet].movement, range: weapon.range, armor: armor.name, radius: 15 * (armor.size ?? 1) };
  }
  function buy(state, team, index, slot, item) {
    const equipment = gear[slot]?.[item], warrior = state[team]?.warriors[index];
    if (!equipment || !warrior || warrior[slot] === item) return false;
    normalizeInventory(state);
    const offer = equipmentOffer(state, team, slot, item);
    if (state[team].gp < offer.cost) return false;
    if (offer.persistent && offer.available === 0) state[team].inventory[slot][item] = offer.owned + 1;
    state[team].gp -= offer.cost; warrior[slot] = item; return true;
  }
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  class Battle {
    constructor(state) {
      this.time = 0; this.done = false; this.winner = null; this.rewards = { red: 0, blue: 0 }; this.events = []; this.projectiles = []; this.debris = [];
      this.units = ['red', 'blue'].flatMap(team => state[team].warriors.map((loadout, i) => ({ training: 'standard', ...stats(loadout), ...loadout, armorName: stats(loadout).armor, team, id: `${team}-${i}`, number: i + 1, x: team === 'red' ? 100 : 1100, y: 165 + i * 85, prevX: team === 'red' ? 100 : 1100, prevY: 165 + i * 85, maxHp: stats(loadout).hp, cooldown: 0, target: null })));
    }
    hit(target, damage, team) {
      if (target.hp <= 0) return;
      target.hp = Math.max(0, target.hp - damage);
      this.events.push({ type: 'damage', x: target.x, y: target.y, damage, time: this.time });
      if (target.hp === 0) { this.rewards[team] += 10; this.events.push({ type: 'kill', team, number: target.number, time: this.time }); }
    }
    step(dt = TICK_SECONDS) {
      if (this.done) return;
      this.time += dt; this.events = this.events.filter(e => this.time - e.time < 2);
      const alive = this.units.filter(u => u.hp > 0);
      for (const u of this.units) { u.prevX = u.x; u.prevY = u.y; }
      for (const u of alive) {
        u.hp = Math.min(u.maxHp, u.hp + u.regen * dt);
      }
      for (const u of alive) {
        if (u.healing > 0) {
          const allies = alive.filter(v => v.team === u.team && v.hp < v.maxHp)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || distance(u, a) - distance(u, b));
          const target = allies[0]; u.target = target?.id; u.retreatTarget = undefined;
          u.cooldown = Math.max(0, u.cooldown - dt);
          if (target && distance(u, target) > u.range) {
            const d = distance(u, target), move = Math.min(u.speed * dt, d - u.range);
            u.x += (target.x - u.x) / d * move; u.y += (target.y - u.y) / d * move;
          }
          continue;
        }
        const enemies = alive.filter(v => v.team !== u.team).sort((a, b) => distance(u, a) - distance(u, b));
        const training = gear.training[u.training];
        const nearest = enemies[0];
        if (training.targeting === 'lowestHp') enemies.sort((a, b) => a.hp - b.hp || distance(u, a) - distance(u, b));
        if (training.targeting === 'highestHp') enemies.sort((a, b) => b.hp - a.hp || distance(u, a) - distance(u, b));
        let target = training.targeting === 'rangedFirst'
          ? enemies.find(v => ['bow', 'fastBow', 'ballista', 'catapult', 'stone throw'].includes(v.weapon)) || nearest
          : enemies[0];
        const retreatRange = Math.min(training.retreatDistance || 0, u.range);
        const incoming = nearest && retreatRange && distance(u, nearest) < retreatRange ? nearest : null;
        const tracked = enemies.find(v => v.id === u.retreatTarget && distance(u, v) <= u.range);
        const retreatTarget = incoming || tracked;
        u.retreatTarget = retreatTarget?.id;
        if (retreatTarget) target = retreatTarget;
        u.target = target?.id; u.cooldown = Math.max(0, u.cooldown - dt);
        if (!target) continue;
        const d = distance(u, target), reach = Math.max(u.range, u.radius + target.radius);
        if (retreatTarget && distance(u, retreatTarget) < retreatRange) {
          const threatDistance = distance(u, retreatTarget);
          const move = Math.min(u.speed * dt, retreatRange - threatDistance);
          u.x += (threatDistance ? (u.x - retreatTarget.x) / threatDistance : u.team === 'red' ? -1 : 1) * move;
          u.y += (threatDistance ? (u.y - retreatTarget.y) / threatDistance : 0) * move;
        } else if (d > reach) { const move = Math.min(u.speed * dt, d - reach); u.x += (target.x - u.x) / d * move; u.y += (target.y - u.y) / d * move; }
      }
      // Resolve body overlap before deciding which attacks are in range.
      for (let pass = 0; pass < 4; pass++) for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i], b = alive[j], d = distance(a, b);
        if (d < a.radius + b.radius) { const dx = d ? (b.x - a.x) / d : 1, dy = d ? (b.y - a.y) / d : 0, push = (a.radius + b.radius - d) / 2; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push; }
      }
      for (const u of alive) { u.x = Math.max(u.radius, Math.min(1200 - u.radius, u.x)); u.y = Math.max(u.radius, Math.min(500 - u.radius, u.y)); }
      const hits = [];
      for (const u of alive) {
        const target = this.units.find(v => v.id === u.target);
        if (!target || distance(u, target) > Math.max(u.range, u.radius + target.radius) + .5 || u.cooldown > 1e-8) continue;
        u.cooldown = 1 / u.rate;
        if (u.healing > 0) {
          const radius = gear.weapon[u.weapon].aoeRadius;
          this.events.push({ type: 'healPulse', x: target.x, y: target.y, radius, time: this.time });
          for (const ally of alive) if (ally.team === u.team && distance(ally, target) <= radius) {
            const amount = Math.min(u.healing, ally.maxHp - ally.hp);
            ally.hp += amount;
            if (amount > 0) this.events.push({ type: 'heal', x: ally.x, y: ally.y, amount, time: this.time });
          }
          continue;
        }
        this.events.push({ type: 'attack', from: u.id, to: target.id, time: this.time });
        if (u.weapon === 'catapult' || u.weapon === 'stone throw') {
          const weapon = gear.weapon[u.weapon];
          this.projectiles.push({ weapon: u.weapon, x: u.x, y: u.y, startX: u.x, startY: u.y,
            endX: target.x, endY: target.y, age: 0, duration: weapon.flightTime,
            radius: weapon.aoeRadius, damage: u.damage, team: u.team });
        } else if (['bow', 'fastBow', 'ballista'].includes(u.weapon)) this.projectiles.push({ weapon: u.weapon, dx: 1, dy: 0, x: u.x, y: u.y, target: target.id, damage: u.damage, team: u.team });
        else { hits.push([target, u.damage, u.team]); if (u.weapon === 'mace') for (const enemy of alive) if (enemy.team !== u.team && enemy !== target && distance(enemy, target) <= 65) hits.push([enemy, u.damage * .1, u.team]); }
      }
      this.projectiles = this.projectiles.filter(p => {
        if (p.weapon === 'catapult' || p.weapon === 'stone throw') {
          p.age += dt;
          const progress = Math.min(1, p.age / p.duration);
          p.x = p.startX + (p.endX - p.startX) * progress;
          p.y = p.startY + (p.endY - p.startY) * progress;
          if (progress < 1) return true;
          const scale = p.weapon === 'stone throw' ? .3 : 1;
          const impact = { scale, type: 'impact', x: p.endX, y: p.endY, radius: p.radius, time: this.time };
          impact.fragments = Array.from({ length: p.weapon === 'stone throw' ? 5 : 14 }, () => ({
            angle: Math.random() * Math.PI * 2,
            spread: (10 + Math.random() * 55) * scale,
            hop: (8 + Math.random() * 12) * scale,
            size: (3 + Math.random() * 3) * scale,
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - .5) * 4,
            fill: Math.random() < .5 ? '#777d78' : '#a4a395'
          }));
          this.events.push(impact); this.debris.push(impact);
          for (const enemy of alive) if (enemy.team !== p.team && distance(enemy, impact) <= p.radius) hits.push([enemy, p.damage, p.team]);
          return false;
        }
        const target = this.units.find(u => u.id === p.target);
        if (!target || target.hp <= 0) return false;
        const d = distance(p, target), move = 450 * dt;
        if (d <= move) { hits.push([target, p.damage, p.team]); return false; }
        p.dx = (target.x - p.x) / d; p.dy = (target.y - p.y) / d;
        p.x += p.dx * move; p.y += p.dy * move; return true;
      });
      for (const hit of hits) this.hit(...hit);
      const remaining = team => this.units.filter(u => u.team === team && u.hp > 0);
      if (!remaining('red').length || !remaining('blue').length) {
        this.done = true; this.winner = remaining('red').length ? 'red' : remaining('blue').length ? 'blue' : null; this.reason = 'elimination';
      } else if (this.time >= 120) {
        const fraction = team => this.units.filter(u => u.team === team).reduce((sum, u) => sum + u.hp, 0) / this.units.filter(u => u.team === team).reduce((sum, u) => sum + u.maxHp, 0);
        const difference = fraction('red') - fraction('blue'); this.done = true; this.winner = Math.abs(difference) < 1e-8 ? null : difference > 0 ? 'red' : 'blue'; this.reason = 'timeout';
      }
      if (this.done) { this.debris = []; this.projectiles = []; }
    }
  }
  const api = { TICK_SECONDS, gear, fresh, stats, buy, equipmentOffer, normalizeInventory, Battle };
  if (typeof module !== 'undefined') module.exports = api; else root.RTS = api;
})(typeof window !== 'undefined' ? window : globalThis);
