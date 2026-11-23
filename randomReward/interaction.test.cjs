const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(storage = new Map(), extraDice = true, search = "") {
  const animations = [];
  function element() {
    const children = new Map();
    const classes = new Set();
    return { style: { setProperty(key, value) { this[key] = value; } }, disabled: false, textContent: '', open: false,
    showModal() { this.open = true; }, close() { this.open = false; }, classList: {
      add: c => classes.add(c), remove: c => classes.delete(c), toggle() {}, contains: c => classes.has(c),
    }, querySelector(s) { if (!children.has(s)) children.set(s, element()); return children.get(s); },
    append() {}, replaceChildren() {}, setAttribute() {}, focus() { this.focused = true; }, addEventListener(event, fn) { this[event] = fn; },
    animate() { let finish; const finished = new Promise(resolve => { finish = resolve; }); animations.push(finish); return { finished, cancel() {} }; },
    };
  }
  const root = element();
  const context = vm.createContext({ URLSearchParams, location: { search }, document: { querySelector: s => root.querySelector(s), createElement: element },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    crypto: { getRandomValues: buffer => { buffer[0] = 0; } }, matchMedia: () => ({matches: true}), confirm: () => true });
  for (const file of ['rules.js', 'game.js']) vm.runInContext(fs.readFileSync(`${__dirname}/${file}`, 'utf8'), context);
  const run = source => vm.runInContext(source, context);
  if (extraDice) run('state.dice = 2; state.luckyStart = false; buildDice(); refresh()');
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
test('roll-all requires the total cost; individual rolls remain affordable', async () => {
  const {run, animations} = setup();
  run('state.credits = 15; refresh(); rollButton.click(); rollButton.click()');
  assert.equal(animations.length, 0);
  assert.equal(run('rollButton.disabled'), true);
  run('roll(diceViews[0])');
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
test('billionaire URL starts a separate million-credit save and restart restores it', () => {
  const storage = new Map();
  const normal = setup(storage, false);
  normal.run('state.credits = 321; refresh()');
  const cheat = setup(storage, false, '?billionaire=true');
  assert.equal(cheat.run('state.credits'), 1000000);
  cheat.run('state.credits = 999000; state.luckyStart = false; refresh()');
  assert.equal(setup(storage, false, '?billionaire=true').run('state.credits'), 999000);
  assert.equal(setup(storage, false).run('state.credits'), 321);
  cheat.run('restartGame()');
  assert.equal(cheat.run('state.credits'), 1000000);
  assert.equal(cheat.run('state.luckyStart'), true);
});
test('lucky start is consumed before animation and survives reload correctly', async () => {
  const {run, storage, animations} = setup(new Map(), false);
  const pending = run('roll(diceViews[0])');
  assert.equal(run('state.luckyStart'), false);
  assert.equal(setup(new Map(storage), false).run('state.luckyStart'), false);
  animations[0](); await pending;
  assert.equal(run('diceViews[0].orientation[0]'), 90);
  assert.equal(run('diceViews[0].orientation[1]'), 180);
  run('restartGame()');
  assert.equal(run('state.luckyStart'), true);
});
test('roll-all reports total price, jackpot gain and free spins and persists multiplier', async () => {
  const {run, storage, animations} = setup();
  assert.equal(run('rollButton.textContent'), 'Roll all 3 · 30 cr');
  run('DiceRules.startRoll = s => ({free:true,paid:0,dice:[{value:6,reward:20,doubled:true}],total:20})');
  const pending = run('rollDice(diceViews)');
  assert.equal(setup(new Map(storage), false).run('state.credits'), 300);
  animations.forEach(finish => finish()); await pending;
  assert.equal(run('state.credits'), 300);
  assert.equal(run('result.textContent'), 'JACKPOT ×3! Total win +180 cr · 3 free spins');
});
test('100 dice fit the computed grid and cannot be upgraded further', () => {
  const {run} = setup();
  run('state.dice = 99; state.credits = 1000000; grid.clientWidth = 360; grid.clientHeight = 300; buildDice(); refresh()');
  assert.equal(run('diceViews.length'), 100);
  assert.equal(run('upgradeViews.find(v=>v.key === "dice").button.disabled'), true);
  assert.equal(run('rollButton.textContent'), 'Roll all 100 · 1.000 cr');
  assert.ok(run('Number(grid.style["--columns"]) * Number(grid.style["--rows"]) >= 100'));
  assert.ok(run('parseFloat(grid.style["--size"]) < 20'));
});
test('double wins launch twice as many coins for the same base reward', () => {
  const {run, animations} = setup();
  run('matchMedia = () => ({matches:false}); fountain(diceViews[0].slot, 80, false)');
  const normalCount = animations.length;
  run('fountain(diceViews[0].slot, 160, true)');
  assert.equal(animations.length - normalCount, normalCount * 2);
});
