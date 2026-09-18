(function (root) {
  'use strict';
  const RTS = typeof module !== 'undefined' ? require('./simulation.js') : root.RTS;
  const data = typeof module !== 'undefined' ? require('./battles.json') : root.RTS_BATTLES;
  const storageKey = 'three-warriors-adventure-v1';
  const loadoutCost = warriors => warriors.reduce((sum, warrior) => sum + Object.keys(RTS.gear).reduce((cost, slot) => cost + RTS.gear[slot][warrior[slot]].price, 0), 0);
  function validateBattles() {
    if (data.startingGP !== 120 || data.victoryReward !== 60 || data.levels?.length !== 20) throw new Error('Invalid adventure settings');
    let previousCost = 0;
    data.levels.forEach((level, i) => {
      if (level.id !== i + 1 || typeof level.name !== 'string' || typeof level.description !== 'string' || level.blue?.warriors?.length !== 3 || !level.blue.warriors.every(w => Object.keys(RTS.gear).every(slot => Object.hasOwn(RTS.gear[slot], w[slot])))) throw new Error(`Invalid adventure level ${i + 1}`);
      const cost = loadoutCost(level.blue.warriors);
      if (cost !== level.equipmentCost || cost <= previousCost || cost - previousCost > 60 || cost > data.startingGP + i * data.victoryReward) throw new Error(`Invalid equipment budget for level ${i + 1}`);
      previousCost = cost;
    });
  }
  validateBattles();
  const currentLevel = state => data.levels[state.adventure.level - 1];
  function setEnemies(state) {
    state.blue = { gp: 0, inventory: { weapon: {}, feet: {} }, warriors: currentLevel(state).blue.warriors.map(w => ({ ...w })) };
    state.round = state.adventure.level;
    RTS.normalizeInventory(state);
    return state;
  }
  function fresh() {
    const state = RTS.fresh();
    state.red.gp = data.startingGP;
    state.adventure = { level: 1, cleared: 0 };
    return setEnemies(state);
  }
  function restore(saved) {
    const progress = saved?.adventure, red = saved?.red;
    if (!progress || !Number.isInteger(progress.level) || progress.level < 1 || progress.level > data.levels.length || !Number.isInteger(progress.cleared) || ![progress.level - 1, progress.level].includes(progress.cleared) || !Number.isFinite(red?.gp) || red.gp < 0 || red.warriors?.length !== 3 || !red.warriors.every(w => w && Object.keys(RTS.gear).every(slot => Object.hasOwn(RTS.gear[slot], w[slot])))) return fresh();
    return setEnemies({ round: progress.level, red, adventure: { level: progress.level, cleared: progress.cleared } });
  }
  const canFight = state => state.adventure.cleared < state.adventure.level;
  const complete = state => state.adventure.cleared === data.levels.length;
  function finish(state, battle) {
    if (!battle.done || battle.winner !== 'red' || !canFight(state)) return 0;
    state.adventure.cleared = state.adventure.level;
    state.red.gp += data.victoryReward;
    return data.victoryReward;
  }
  function advance(state) {
    if (canFight(state) || complete(state)) return false;
    state.adventure.level++;
    setEnemies(state);
    return true;
  }
  const api = { data, storageKey, loadoutCost, currentLevel, fresh, restore, canFight, complete, finish, advance };
  if (typeof module !== 'undefined') module.exports = api; else root.RTS_ADVENTURE = api;
})(typeof window !== 'undefined' ? window : globalThis);
