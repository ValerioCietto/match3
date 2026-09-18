const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const RTS = require('./simulation.js');
const adventure = require('./adventure.js');

test('20 valid enemy teams grow by at most one victory reward per level', () => {
  assert.equal(adventure.data.levels.length, 20);
  let previous = 0;
  for (const level of adventure.data.levels) {
    const cost = adventure.loadoutCost(level.blue.warriors);
    assert.equal(cost, level.equipmentCost);
    assert.ok(cost > previous && cost - previous <= 60);
    assert.ok(cost <= 120 + (level.id - 1) * 60);
    previous = cost;
  }
});

test('losses, draws and unfinished battles never unlock levels or give GP', () => {
  const state = adventure.fresh();
  for (const result of [{ done: false, winner: 'red' }, { done: true, winner: 'blue' }, { done: true, winner: null }]) {
    assert.equal(adventure.finish(state, result), 0);
    assert.equal(adventure.advance(state), false);
    assert.equal(state.red.gp, 120);
    assert.equal(state.adventure.cleared, 0);
  }
});

test('campaign awards exactly 60 GP once per victory and stops after level 20', () => {
  let state = adventure.fresh();
  RTS.buy(state, 'red', 0, 'weapon', 'bow');
  for (let level = 1; level <= 20; level++) {
    assert.equal(state.adventure.level, level);
    assert.deepEqual(state.blue.warriors, adventure.data.levels[level - 1].blue.warriors);
    assert.equal(adventure.finish(state, { done: true, winner: 'red', rewards: { red: 30 } }), 60);
    assert.equal(adventure.finish(state, { done: true, winner: 'red' }), 0);
    state = adventure.restore(JSON.parse(JSON.stringify(state)));
    assert.equal(adventure.canFight(state), false);
    assert.equal(state.red.gp, 90 + level * 60);
    assert.equal(state.red.inventory.weapon.bow, 1);
    assert.equal(adventure.advance(state), level < 20);
  }
  assert.equal(adventure.complete(state), true);
  assert.equal(state.adventure.level, 20);
});

test('restoring uses authoritative enemies and rejects inconsistent progression', () => {
  const state = adventure.fresh();
  state.blue.warriors[0].weapon = 'catapult';
  assert.equal(adventure.restore(state).blue.warriors[0].weapon, 'spear');
  state.adventure = { level: 8, cleared: 1 };
  assert.equal(adventure.restore(state).adventure.level, 1);
  assert.equal(adventure.restore(null).adventure.level, 1);
});

test('a legal upgrade path clears all 20 simulated battles using only campaign income', () => {
  const state = adventure.fresh();
  const upgrades = [
    ...[0, 1, 2].map(i => [i, 'weapon', 'bow']),
    ...[0, 1, 2].map(i => [i, 'training', 'sniper']),
    ...[0, 1, 2].map(i => [i, 'armor', 'carbon fiber plate']),
    ...[0, 1, 2].map(i => [i, 'weapon', 'fastBow']),
    ...[0, 1, 2].map(i => [i, 'feet', 'horse']),
    ...[0, 1, 2].map(i => [i, 'weapon', 'catapult'])
  ];
  let next = 0;
  for (let level = 1; level <= 20; level++) {
    while (next < upgrades.length && RTS.buy(state, 'red', ...upgrades[next])) next++;
    assert.ok(state.red.gp >= 0);
    const battle = new RTS.Battle(state);
    for (let tick = 0; tick < 6002 && !battle.done; tick++) battle.step();
    assert.equal(battle.winner, 'red', `Level ${level} must be beatable`);
    adventure.finish(state, battle);
    adventure.advance(state);
  }
  assert.equal(adventure.complete(state), true);
});

function loadGame(storage = new Map(), campaign = true) {
  const elements = new Map();
  const element = id => {
    if (campaign && id === 'blueShop') return null;
    if (!elements.has(id)) elements.set(id, { dataset: {}, textContent: '', innerHTML: '', hidden: false, disabled: false, setAttribute() {}, querySelectorAll: () => [], showModal() { this.open = true; }, close() { this.open = false; }, getContext: () => ({}) });
    return elements.get(id);
  };
  const context = vm.createContext({ RTS, ...(campaign ? { RTS_ADVENTURE: adventure } : {}), document: { getElementById: element, querySelectorAll: () => [] }, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, performance: { now: () => 0 }, requestAnimationFrame() {}, confirm: () => true });
  vm.runInContext(fs.readFileSync(`${__dirname}/game.js`, 'utf8'), context);
  return { element, read: expression => vm.runInContext(expression, context) };
}

test('campaign UI gates next/start, survives reload, keeps sandbox saves and resets independently', () => {
  const sandbox = JSON.stringify(RTS.fresh());
  const storage = new Map([['three-warriors-v1', sandbox]]);
  let game = loadGame(storage);
  assert.equal(game.element('nextBattle').hidden, true);
  game.element('nextBattle').onclick();
  assert.equal(game.read('state.adventure.level'), 1);
  game.element('start').onclick();
  assert.equal(game.element('redShop').disabled, true);
  game.read("battle.done = true; battle.winner = 'blue'; finishBattle(); refresh();");
  assert.equal(game.element('start').textContent, 'Retry battle');
  assert.equal(game.read('state.red.gp'), 120);
  game.element('start').onclick();
  game.read("battle.done = true; battle.winner = 'red'; finishBattle(); refresh();");
  assert.equal(game.read('state.red.gp'), 180);
  assert.equal(game.element('nextBattle').hidden, false);
  assert.equal(game.element('start').disabled, true);
  game = loadGame(storage);
  assert.equal(game.element('nextBattle').hidden, false);
  game.element('start').onclick();
  assert.equal(game.read('battle'), null);
  game.element('nextBattle').onclick();
  assert.equal(game.read('state.adventure.level'), 2);
  assert.equal(game.element('start').disabled, false);
  assert.equal(storage.get('three-warriors-v1'), sandbox);
  game.element('reset').onclick();
  assert.equal(game.read('state.adventure.level'), 1);
  assert.equal(game.read('state.red.gp'), 120);
  assert.equal(storage.get('three-warriors-v1'), sandbox);
});

test('sandbox retains kill rewards and editable blue team', () => {
  const game = loadGame(new Map(), false);
  game.element('blueShop').onclick();
  assert.equal(game.read('shopTeam'), 'blue');
  game.read("battle = new Battle(state); battle.done = true; battle.winner = 'red'; battle.rewards = { red: 30, blue: 10 }; finishBattle(); refresh();");
  assert.equal(game.read('state.red.gp'), 150);
  assert.equal(game.read('state.blue.gp'), 130);
  assert.equal(game.read('state.round'), 2);
});
