const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const RTS = require('./simulation.js');
const { fresh, buy, equipmentOffer, normalizeInventory } = RTS;

for (const [slot, item, baseline, price] of [['weapon', 'bow', 'sword', 30], ['feet', 'boots', 'none', 15], ['feet', 'horse', 'none', 40]]) {
  test(`${item}: quantities, paid extra copies, free reuse and team isolation`, () => {
    const state = fresh();
    assert.equal(buy(state, 'red', 0, slot, item), true);
    assert.equal(buy(state, 'red', 0, slot, item), false);
    assert.equal(state.red.inventory[slot][item], 1);
    assert.equal(buy(state, 'red', 1, slot, item), true);
    assert.equal(state.red.inventory[slot][item], 2);
    assert.equal(state.red.gp, 120 - 2 * price);
    buy(state, 'red', 0, slot, baseline);
    assert.equal(equipmentOffer(state, 'red', slot, item).available, 1);
    state.red.gp = 0;
    assert.equal(buy(state, 'red', 2, slot, item), true);
    assert.equal(state.red.gp, 0);
    assert.equal(state.red.inventory[slot][item], 2);
    assert.equal(buy(state, 'red', 0, slot, item), false);
    assert.equal(equipmentOffer(state, 'blue', slot, item).owned, 0);
    assert.equal(equipmentOffer(state, 'blue', slot, item).cost, price);
  });
}

test('armor and training still charge on every replacement', () => {
  for (const [slot, item, baseline, price] of [['armor', 'light', 'none', 20], ['training', 'ranged', 'standard', 30]]) {
    const state = fresh();
    buy(state, 'red', 0, slot, item);
    buy(state, 'red', 0, slot, baseline);
    buy(state, 'red', 0, slot, item);
    assert.equal(state.red.gp, 120 - 2 * price);
    assert.equal(state.red.inventory[slot], undefined);
  }
});

test('migration preserves equipped copies and repairs invalid counts without losing valid stock', () => {
  const state = fresh();
  delete state.red.inventory;
  state.red.warriors[0].weapon = state.red.warriors[1].weapon = 'bow';
  state.red.warriors[2].feet = 'horse';
  normalizeInventory(state);
  assert.equal(state.red.inventory.weapon.bow, 2);
  assert.equal(state.red.inventory.feet.horse, 1);
  state.red.inventory.weapon = { bow: -1, mace: 3, spear: 1.5, ballista: '2' };
  normalizeInventory(state);
  assert.deepEqual(state.red.inventory.weapon, { bow: 2, mace: 3 });
  const restored = normalizeInventory(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
});

function loadGame(saved) {
  const elements = new Map();
  let storage = saved;
  const element = id => {
    if (!elements.has(id)) elements.set(id, { dataset: {}, textContent: '', innerHTML: '', setAttribute() {}, querySelectorAll: () => [], showModal() {}, getContext: () => ({}) });
    return elements.get(id);
  };
  const context = vm.createContext({ RTS, document: { getElementById: element, querySelectorAll: () => [] }, localStorage: { getItem: () => storage, setItem: (_, value) => { storage = value; } }, performance: { now: () => 0 }, requestAnimationFrame() {} });
  vm.runInContext(fs.readFileSync(`${__dirname}/game.js`, 'utf8'), context);
  return { element, saved: () => storage, click: dataset => element('shopCards').onclick({ target: { closest: () => ({ dataset }) } }) };
}

test('armory previews are free and owned stock survives browser save/reload', () => {
  let game = loadGame(null);
  game.element('redShop').onclick();
  game.click({ item: 'bow' });
  assert.equal(JSON.parse(game.saved()).red.gp, 120);
  assert.match(game.element('shopCards').innerHTML, /Buy & equip for 30 GP/);
  game.click({ equip: 'bow' });
  game.click({ equip: 'sword' });
  game = loadGame(game.saved());
  game.element('redShop').onclick();
  game.click({ warrior: '1' });
  game.click({ item: 'bow' });
  assert.match(game.element('shopCards').innerHTML, /1 owned by team/);
  assert.match(game.element('shopCards').innerHTML, /Equip owned copy/);
  game.click({ equip: 'bow' });
  const state = JSON.parse(game.saved());
  assert.equal(state.red.gp, 90);
  assert.equal(state.red.inventory.weapon.bow, 1);
  assert.equal(state.red.warriors[1].weapon, 'bow');
  game.click({ warrior: '2' });
  game.click({ item: 'bow' });
  assert.match(game.element('shopCards').innerHTML, /Buy & equip for 30 GP/);
});
