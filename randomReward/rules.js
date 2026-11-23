"use strict";

// Pure game rules shared by the browser and the automated checks.
const DiceRules = (() => {
  const upgrades = {
    free: { name: "Free roll", description: "+1% chance to roll without paying", cap: 100, base: 25, step: 5 },
    double: { name: "Double win", description: "+1% chance to double each six's payout", cap: 100, base: 25, step: 5 },
    dice: { name: "Extra die", description: "+1 independent die · maximum 100 dice", cap: 99, base: 100, step: 100 },
    discount: { name: "Cheaper rolls", description: "−1 cr per roll · minimum price 1 cr", cap: 9, base: 60, step: 40 },
    casino: { name: "Buy the casino", description: "Own the house. Complete the game.", cap: 1, base: 1000000, step: 0 },
  };
  function fresh(billionaire = false) { return { credits: billionaire ? 1000000 : 120, free: 0, double: 0, dice: 0, discount: 0, casino: 0, luckyStart: true }; }
  function price(state) { return 10 - state.discount; }
  function cost(state, key) { return upgrades[key].base + state[key] * upgrades[key].step; }
  function canRoll(state) { return !state.casino && (state.free === 100 || state.credits >= price(state)); }
  function buy(state, key) {
    if (state.casino || !Object.hasOwn(upgrades, key) || state[key] >= upgrades[key].cap || state.credits < cost(state, key)) return false;
    state.credits -= cost(state, key);
    state[key]++;
    return true;
  }
  function randomInt(min, max) {
    const range = max - min + 1;
    const limit = Math.floor(4294967296 / range) * range;
    const buffer = new Uint32Array(1);
    do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
    return min + buffer[0] % range;
  }
  function startRoll(state, random = randomInt) {
    if (!canRoll(state)) return null;
    const free = random(1, 100) <= state.free;
    const paid = free ? 0 : price(state);
    const dice = Array.from({ length: 1 }, () => {
      const value = state.luckyStart ? 6 : random(1, 6);
      if (value !== 6) return { value, reward: 0, doubled: false };
      const base = random(10, 120);
      const doubled = random(1, 100) <= state.double;
      return { value, reward: base * (doubled ? 2 : 1), doubled };
    });
    state.credits -= paid;
    state.luckyStart = false;
    return { free, paid, dice, total: dice.reduce((sum, die) => sum + die.reward, 0) };
  }
  function jackpot(outcomes, ownedDice) {
    const won = ownedDice > 1 && outcomes.length === ownedDice && outcomes.every(outcome => outcome.dice[0].value === 6);
    if (won) for (const outcome of outcomes) {
      outcome.total *= ownedDice;
      outcome.dice[0].reward *= ownedDice;
    }
    return won;
  }
  return { upgrades, fresh, price, cost, canRoll, buy, randomInt, startRoll, jackpot };
})();
if (typeof module !== "undefined") module.exports = DiceRules;
