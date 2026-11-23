const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(storage = new Map(), extraDice = true) {
  const animations = [];
  function element() {
    const children = new Map();
    const classes = new Set();
    return { style: {}, disabled: false, textContent: '', open: false,
    showModal() { this.open = true; }, close() { this.open = false; }, classList: {
      add: c => classes.add(c), remove: c => classes.delete(c), toggle() {}, contains: c => classes.has(c),
    }, querySelector(s) { if (!children.has(s)) children.set(s, element()); return children.get(s); },
    append() {}, replaceChildren() {}, setAttribute() {}, focus() { this.focused = true; }, addEventListener(event, fn) { this[event] = fn; },
    animate() { let finish; const finished = new Promise(resolve => { finish = resolve; }); animations.push(finish); return { finished, cancel() {} }; },
    };
  }
  const root = element();
  const context = vm.createContext({ document: { querySelector: s => root.querySelector(s), createElement: element },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    crypto: { getRandomValues: buffer => { buffer[0] = 0; } }, matchMedia: () => ({matches: true}), confirm: () => true });
  for (const file of ['rules.js', 'game.js']) vm.runInContext(fs.readFileSync(`${__dirname}/${file}`, 'utf8'), context);
  const run = source => vm.runInContext(source, context);
  if (extraDice) run('state.dice = 2; buildDice(); refresh()');
  return { run, animations, storage };
}
test('dice roll concurrently; each locks only itself and settles separately', async () => {
  const {run, animations} = setup();
  const first = run('roll(diceViews[0])');
  assert.equal(run('state.credits'), 110);
  assert.equal(run('diceViews[1].button.disabled'), false);
  assert.equal(run('diceViews[1].slot.classList.contains("rolling")'), false);
  await run('roll(diceViews[0])');
  assert.equal(run('state.credits'), 110);
  const second = run('roll(diceViews[1])');
  assert.equal(run('state.credits'), 100);
  animations[1](); await second;
  assert.equal(run('diceViews[0].rolling'), true);
  assert.equal(run('diceViews[1].rolling'), false);
  assert.equal(run('diceViews[2].cube.style.transform'), undefined);
  animations[0](); await first;
  assert.equal(run('isRolling()'), false);
});
test('batch button rolls only affordable idle dice and cannot overspend', async () => {
  const {run, animations} = setup();
  run('state.credits = 15; refresh(); rollButton.click(); rollButton.click()');
  assert.equal(animations.length, 1);
  assert.equal(run('state.credits'), 5);
  await run('roll(diceViews[1])');
  assert.equal(animations.length, 1);
  animations[0](); await Promise.resolve();
});
test('casino purchase opens the win screen, stops play, and new game resets it', () => {
  const {run} = setup();
  run('state.credits = 1000000; refresh()');
  assert.equal(run('$("#win-screen").hidden'), true);
  assert.equal(run('upgradeViews.find(v => v.key === "casino").cost.textContent'), '1.000.000 cr');
  run('upgradeViews.find(v => v.key === "casino").button.click()');
  assert.equal(run('state.credits'), 0);
  assert.equal(run('$("#win-screen").hidden'), false);
  assert.equal(run('$(".game").hidden'), true);
  assert.equal(run('$("#win-title").focused'), true);
  assert.equal(run('rollButton.disabled'), true);
  run('$("#play-again").click()');
  assert.equal(run('state.casino'), 0);
  assert.equal(run('state.credits'), 120);
  assert.equal(run('$("#win-screen").hidden'), true);
  assert.equal(run('$(".game").hidden'), false);
});
test('casino cannot be purchased while a die is resolving', async () => {
  const {run, animations} = setup();
  run('state.credits = 1000100; refresh()');
  const pending = run('roll(diceViews[0])');
  run('upgradeViews.find(v => v.key === "casino").button.click()');
  assert.equal(run('state.casino'), 0);
  animations[0](); await pending;
  run('upgradeViews.find(v => v.key === "casino").button.click()');
  assert.equal(run('state.casino'), 1);
});
test('balance and purchased upgrades survive reload; restart replaces the save', () => {
  const {run, storage} = setup();
  run('upgradeViews.find(v => v.key === "free").button.click()');
  const reloaded = setup(storage, false);
  assert.equal(reloaded.run('state.credits'), 95);
  assert.equal(reloaded.run('state.free'), 1);
  assert.equal(reloaded.run('diceViews.length'), 3);
  reloaded.run('restartGame()');
  const restarted = setup(storage, false);
  assert.equal(restarted.run('state.credits'), 120);
  assert.equal(restarted.run('state.free'), 0);
  assert.equal(restarted.run('diceViews.length'), 1);
});
test('zero balance is restored and invalid saves fall back safely', () => {
  const valid = {credits: 0, free: 0, double: 0, dice: 0, discount: 0, casino: 0};
  const storage = new Map([['randomReward.save.v1', JSON.stringify(valid)]]);
  assert.equal(setup(storage, false).run('state.credits'), 0);
  for (const raw of ['broken JSON', 'null', JSON.stringify({...valid, credits: -10}), JSON.stringify({...valid, dice: 100})]) {
    storage.set('randomReward.save.v1', raw);
    assert.equal(setup(storage, false).run('state.credits'), 120);
  }
});
test('reload mid-roll preserves fees and pending winnings exactly once', async () => {
  const {run, storage, animations} = setup();
  run('DiceRules.startRoll = s => { s.credits -= 10; return {free:false, paid:10, dice:[{value:6,reward:50,doubled:false}], total:50}; }');
  const first = run('roll(diceViews[0])');
  const second = run('roll(diceViews[1])');
  assert.equal(run('state.credits'), 100);
  assert.equal(setup(new Map(storage), false).run('state.credits'), 200);
  animations[1](); await second;
  assert.equal(setup(new Map(storage), false).run('state.credits'), 200);
  animations[0](); await first;
  assert.equal(setup(storage, false).run('state.credits'), 200);
});
test('unavailable localStorage does not prevent playing', () => {
  const storage = {get() {throw Error('Blocked');}, set() {throw Error('Full');}};
  const {run} = setup(storage, false);
  assert.equal(run('state.credits'), 120);
  run('upgradeViews.find(v => v.key === "free").button.click()');
  assert.equal(run('state.credits'), 95);
});
test('last losing spin opens game-over only after settling; retry resets saved progress', async () => {
  const {run, animations, storage} = setup();
  run('state.credits = 10; refresh()');
  const pending = run('roll(diceViews[0])');
  assert.equal(run('state.credits'), 0);
  assert.equal(run('$("#game-over-dialog").open'), false);
  animations[0](); await pending;
  assert.equal(run('$("#game-over-dialog").open'), true);
  run('$("#try-again").click()');
  assert.equal(run('$("#game-over-dialog").open'), false);
  assert.equal(run('state.credits'), 120);
  assert.equal(run('diceViews.length'), 1);
  assert.equal(setup(storage, false).run('state.credits'), 120);
});
test('pending winnings prevent premature game-over across concurrent rolls', async () => {
  const {run, animations} = setup();
  run('state.credits = 20; DiceRules.startRoll = s => { s.credits -= 10; return {free:false,paid:10,dice:[{value:6,reward:50,doubled:false}],total:50}; }');
  const first = run('roll(diceViews[0])');
  const second = run('roll(diceViews[1])');
  assert.equal(run('$("#game-over-dialog").open'), false);
  animations[0](); await first;
  assert.equal(run('$("#game-over-dialog").open'), false);
  animations[1](); await second;
  assert.equal(run('$("#game-over-dialog").open'), false);
});
test('insufficient saved balance shows dialog, while free rolls and victory do not', () => {
  const saved = {credits: 5, free: 0, double: 0, dice: 0, discount: 0, casino: 0};
  const reload = state => setup(new Map([['randomReward.save.v1', JSON.stringify(state)]]), false);
  const broke = reload(saved);
  assert.equal(broke.run('$("#game-over-dialog").open'), true);
  broke.run('$("#dismiss-game-over").click()');
  assert.equal(broke.run('$("#game-over-dialog").open'), false);
  assert.equal(broke.run('state.credits'), 5);
  assert.equal(reload({...saved, free: 100}).run('$("#game-over-dialog").open'), false);
  assert.equal(reload({...saved, casino: 1}).run('$("#game-over-dialog").open'), false);
  assert.equal(reload({...saved, discount: 9}).run('$("#game-over-dialog").open'), false);
});
