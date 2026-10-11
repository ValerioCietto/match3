const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const catalog = JSON.parse(read('upgrades.json'));
const saveKey = 'vscroll.shooter.v1';

function environment(save = {}) {
  const storage = new Map([[saveKey, JSON.stringify(save)]]);
  const fills = [];
  const context = new Proxy({
    fill() { fills.push(this.fillStyle); }
  }, { get: (target, key) => target[key] ?? (() => {}) });
  function element() {
    return {
      children: [], style: {}, clientWidth: 400, clientHeight: 600,
      addEventListener() {}, getContext: () => context,
      appendChild(child) { this.children.push(child); },
      querySelector() { return this.actions ??= element(); },
      set innerHTML(value) { this.html = value; this.children = []; },
      get innerHTML() { return this.html; }
    };
  }
  const nodes = new Map();
  const sandbox = vm.createContext({
    window: { addEventListener() {} },
    document: {
      addEventListener() {}, createElement: element,
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, element());
        return nodes.get(id);
      }
    },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) },
    performance: { now: () => 0 }, requestAnimationFrame() {},
    Audio: class { pause() {} }, alert() {},
    Math: Object.create(Math), console,
    fetch: async () => ({ ok: true, json: async () => catalog })
  });
  return { sandbox, storage, fills, nodes };
}

function game(save) {
  const env = environment(save);
  const source = read('game.js').replace(/\}\)\(\);\s*$/, 'window.test = { state, addBullet, maybeShoot, shootFan, update, draw }; })();');
  vm.runInContext(source, env.sandbox);
  return { ...env, ...env.sandbox.window.test };
}

test('old saves remain non-critical; unlocked crits have an exact 20% threshold', () => {
  const g = game({ money: 7 });
  g.sandbox.Math.random = () => 0;
  g.addBullet({});
  assert.equal(g.state.bullets.pop().damage, 1);
  assert.equal(g.state.save.money, 7);
  g.state.save['critical unlocked'] = true;
  g.sandbox.Math.random = () => 0.1999;
  g.addBullet({});
  assert.equal(g.state.bullets.pop().damage, 2);
  g.sandbox.Math.random = () => 0.2;
  g.addBullet({});
  assert.equal(g.state.bullets.pop().critical, false);
  g.state.save['critical chance'] = 100;
  g.sandbox.Math.random = () => 0.9;
  g.addBullet({});
  assert.equal(g.state.bullets.pop().critical, false);
});

test('regular shots and bomb fans roll independently and draw critical bullets red', () => {
  const g = game({ 'critical unlocked': true, 'bullet number': 2 });
  let index = 0;
  g.sandbox.Math.random = () => index++ % 2 ? 0.5 : 0;
  g.state.t = 3;
  g.maybeShoot();
  g.shootFan(100, 100, 2, 1);
  assert.deepEqual(Array.from(g.state.bullets, b => b.critical), [true, false, true, false]);
  g.fills.length = 0;
  g.draw();
  assert.deepEqual(g.fills.slice(-4), ['#ff3030', '#f5f7ff', '#ff3030', '#f5f7ff']);
});

test('upgraded critical damage applies on impact, including fractional damage and bounty', () => {
  const g = game({ 'critical unlocked': true, 'critical damage bonus': 120 });
  g.sandbox.Math.random = () => 0;
  g.state.enemies.push({ x: 100, y: 100, size: 20, speed: 0, hp: 4.4, bounty: 3, color: 'grey' });
  const shot = () => g.addBullet({ x: 100, y: 100, vx: 0, vy: 0, r: 4 });
  shot();
  assert.equal(g.state.bullets[0].damage, 2.2);
  g.update();
  assert.equal(g.state.enemies[0].hp, 2.2);
  shot();
  g.update();
  assert.equal(g.state.enemies.length, 0);
  assert.equal(g.state.save.money, 3);
});

test('shop enforces unlock, chance cap, exponential damage cost, persistence and reset', async () => {
  const env = environment({ money: 1e12 });
  const script = read('upgrades.html').match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(script, env.sandbox);
  await new Promise(resolve => setImmediate(resolve));
  const card = id => env.nodes.get('upgradesGrid').children[catalog.upgrades.findIndex(u => u.id === id)];
  const button = id => card(id).actions.children[0];
  const save = env.sandbox.window.upg.save;
  assert.equal(button('critical_chance').disabled, true);
  button('critical_damage').onclick();
  assert.equal(save()['critical damage bonus'], undefined);
  button('critical_ability').onclick();
  assert.equal(save()['critical unlocked'], true);
  for (let i = 0; i < 14; i++) button('critical_chance').onclick();
  assert.equal(save()['critical chance'], 90);
  assert.equal(button('critical_chance').disabled, true);
  button('critical_chance').onclick();
  assert.equal(save()['critical chance'], 90);
  for (let level = 0; level < 50; level++) {
    const before = save().money;
    assert.equal(button('critical_damage').disabled, false);
    button('critical_damage').onclick();
    assert.equal(before - save().money, Math.round(30 * 1.5 ** level));
    assert.equal(save()['critical damage bonus'], 100 + (level + 1) * 20);
  }
  assert.equal(JSON.parse(env.storage.get(saveKey))['critical damage bonus'], 1100);
  const reloaded = game(JSON.parse(env.storage.get(saveKey)));
  reloaded.sandbox.Math.random = () => 0;
  reloaded.addBullet({});
  assert.equal(reloaded.state.bullets[0].damage, 12);
  button('new_game_plus').onclick();
  assert.equal(save()['critical unlocked'], false);
  assert.equal(save()['critical chance'], 20);
  assert.equal(save()['critical damage bonus'], 100);
});
