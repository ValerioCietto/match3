const { test } = require('node:test');
const assert = require('node:assert/strict');
const rules = require('./rules.js');
function normalStart() { return { ...rules.fresh(), luckyStart: false }; }
function sequence(...values) {
  return (min, max) => {
    const value = values.shift();
    assert.ok(value >= min && value <= max, `Expected value within ${min}–${max}, got ${value}`);
    return value;
  };
}
test('starts with 120 credits; a losing roll costs exactly 10', () => {
  const state = normalStart();
  assert.equal(state.credits, 120);
  const roll = rules.startRoll(state, sequence(100, 1));
  assert.equal(roll.total, 0);
  assert.equal(state.credits, 110);
});
test('each six pays independently, including both payout bounds', () => {
  const state = { ...normalStart(), dice: 2 };
  const first = rules.startRoll(state, sequence(100, 6, 10, 100));
  const second = rules.startRoll(state, sequence(100, 6, 120, 100));
  const third = rules.startRoll(state, sequence(100, 5));
  assert.equal(first.total + second.total + third.total, 130);
  assert.equal(state.credits, 90, 'Each die pays its own fee');
  state.credits += first.total + second.total;
  assert.equal(state.credits, 220);
});
test('1% free roll boundary is inclusive and does not charge credits', () => {
  const state = { ...normalStart(), free: 1 };
  assert.equal(rules.startRoll(state, sequence(1, 2)).paid, 0);
  assert.equal(state.credits, 120);
  assert.equal(rules.startRoll(state, sequence(2, 2)).paid, 10);
});
test('double win doubles a six, but not every payout', () => {
  const state = { ...normalStart(), double: 1, dice: 1 };
  const roll = rules.startRoll(state, sequence(100, 6, 120, 1));
  const second = rules.startRoll(state, sequence(100, 6, 10, 2));
  assert.equal(roll.dice[0].reward, 240);
  assert.equal(roll.dice[0].doubled, true);
  assert.equal(second.dice[0].reward, 10);
  assert.equal(roll.total + second.total, 250);
});
test('upgrade prices increase; unaffordable and unknown upgrades do nothing', () => {
  const state = normalStart();
  assert.equal(rules.buy(state, 'free'), true);
  assert.equal(state.credits, 95);
  assert.equal(state.free, 1);
  assert.equal(rules.cost(state, 'free'), 30);
  const before = { ...state };
  assert.equal(rules.buy(state, 'dice'), false);
  assert.equal(rules.buy(state, 'unknown'), false);
  assert.deepEqual(state, before);
});
test('dice and chance caps and minimum roll price cannot be exceeded', () => {
  for (const [key, upgrade] of Object.entries(rules.upgrades)) {
    const state = { ...normalStart(), credits: 1000000 };
    for (let i = 0; i < upgrade.cap; i++) assert.equal(rules.buy(state, key), true);
    const credits = state.credits;
    assert.equal(rules.buy(state, key), false);
    assert.equal(state.credits, credits);
    assert.equal(state[key], upgrade.cap);
    if (key === 'discount') assert.equal(rules.price(state), 1);
    if (key === 'dice') {
      assert.equal(state.dice + 1, 100);
      assert.equal(rules.startRoll(state, () => 1).dice.length, 1, 'Only the selected die rolls');
    }
  }
});
test('insufficient funds do not allow free-roll fishing; guaranteed free rolls still work', () => {
  const state = { ...normalStart(), credits: 9, free: 99 };
  assert.equal(rules.startRoll(state, () => { throw Error('Should not draw randomness'); }), null);
  assert.equal(state.credits, 9);
  state.free = 100;
  state.credits = 0;
  assert.equal(rules.startRoll(state, sequence(1, 1)).paid, 0);
  assert.equal(state.credits, 0);
});
test('casino costs exactly a million, can be bought once, and ends the game', () => {
  const state = { ...normalStart(), credits: 999999, free: 100 };
  assert.equal(rules.buy(state, 'casino'), false);
  assert.equal(state.credits, 999999);
  assert.equal(state.casino, 0);
  state.credits = 1000050;
  assert.equal(rules.buy(state, 'casino'), true);
  assert.equal(state.credits, 50);
  assert.equal(state.casino, 1);
  assert.equal(rules.buy(state, 'casino'), false);
  assert.equal(rules.buy(state, 'double'), false);
  assert.equal(rules.startRoll(state), null);
  assert.equal(state.credits, 50);
});
test('lucky start guarantees exactly the first successful roll; restart re-arms it', () => {
  const state = rules.fresh();
  const first = rules.startRoll(state, sequence(100, 60, 100));
  assert.equal(first.dice[0].value, 6);
  assert.equal(first.total, 60);
  assert.equal(state.luckyStart, false);
  assert.equal(rules.startRoll(state, sequence(100, 2)).dice[0].value, 2);
  assert.equal(rules.fresh().luckyStart, true);
  assert.equal(rules.fresh(true).credits, 1000000);
});
test('jackpot multiplies all payouts including doubles only for a full all-six roll', () => {
  const outcome = (value, reward) => ({dice:[{value,reward}],total:reward});
  const wins = [outcome(6, 20), outcome(6, 240), outcome(6, 10)];
  assert.equal(rules.jackpot(wins, 3), true);
  assert.equal(wins.reduce((n, win) => n + win.total, 0), 810);
  assert.equal(wins[1].dice[0].reward, 720);
  assert.equal(rules.jackpot([outcome(6, 20)], 3), false);
  assert.equal(rules.jackpot([outcome(6, 20), outcome(5, 0)], 2), false);
  assert.equal(rules.jackpot([outcome(6, 20)], 1), false);
});
