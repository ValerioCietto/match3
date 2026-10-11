export const TYPES = {
  village: { label: 'Village', income: .1, icon: '⌂' },
  tower: { label: 'Tower', income: 0, icon: '♜' },
  city: { label: 'City', income: .2, icon: '▥' },
  barracks: { label: 'Barracks', income: 0, icon: '⚑' },
  mine: { label: 'Mine', income: .5, icon: '◆' }
};
const defaults = { generation: .2, attack: 1, defence: 1, speed: 15, productivity: 1 };
export const FACTIONS = {
  Player: { ...defaults, color: '#63b8ff' },
  Enemy: { ...defaults, generation: .22, attack: 1.15, defence: .9, speed: 16.5, productivity: .9, color: '#fa7778' },
  Neutral: { ...defaults, generation: .1, productivity: 0, color: '#98a6af' }
};
export const WALL_UPGRADES = [
  { cost: 50, defence: 10, label: 'Raise wall', detail: '+10 DEF' },
  { cost: 150, defence: 20, label: 'Fortify wall', detail: '+20 DEF' },
  { cost: 250, defence: 0, label: 'Install laser', detail: '1 DPS / 300 px' }
];
export const LASER_RANGE = 300;
export const LASER_DPS = 1;
export let LEVELS = [];
export function setLevels(levels) {
  if (!Array.isArray(levels) || levels.length === 0) throw new Error('Levels must be a non-empty array.');
  for (const level of levels) {
    if (typeof level.name !== 'string' || typeof level.description !== 'string' || !Array.isArray(level.nodes) || !level.nodes.length) throw new Error('Each level needs a name, description, and nodes.');
    for (const node of level.nodes) {
      if (!Array.isArray(node)) throw new Error('Each node must be an array.');
      const [x, y, type, faction, population = 10] = node;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Object.hasOwn(TYPES, type) || !Object.hasOwn(FACTIONS, faction) || !Number.isFinite(population) || population < 0) throw new Error('Invalid level node.');
    }
    if (!level.nodes.some(node => node[3] === 'Player')) throw new Error('Each level needs a Player node.');
  }
  LEVELS = levels;
}
export class Battle {
  constructor(level = 0) {
    this.level = level; this.time = 0; this.aiClock = 0; this.flights = []; this.beams = []; this.result = null;
    this.gold = { Player: 120, Enemy: 120, Neutral: 0 };
    this.nodes = LEVELS[level].nodes.map(([x,y,type,faction,population = 10], id) => ({ id,x,y,type,faction,population,wall: 0,wallLevel: 0 }));
  }
  attack(node) { return FACTIONS[node.faction].attack * (node.type === 'barracks' ? 1.5 : 1); }
  defence(node) { return (FACTIONS[node.faction].defence + node.wall) * (this.nodes.some(n => n.faction === node.faction && n.type === 'tower') ? 1.2 : 1); }
  generation(node) { return node.type === 'barracks' ? 0 : FACTIONS[node.faction].generation; }
  hasLaser(node) { return node.type === 'tower' || node.wallLevel >= 3; }
  nextWall(node) { return node ? WALL_UPGRADES[node.wallLevel] : undefined; }
  income(faction) { return this.nodes.filter(n => n.faction === faction).reduce((sum,n) => sum + TYPES[n.type].income * FACTIONS[faction].productivity, 0); }
  send(fromId,toId,fraction = .5) {
    const from = this.nodes[fromId], to = this.nodes[toId];
    if (this.result || !from || !to || from === to || from.faction === 'Neutral') return false;
    const count = Math.floor(from.population * Math.max(0,Math.min(1,fraction)));
    if (!count) return false;
    from.population -= count;
    this.flights.push({ x: from.x, y: from.y, from: from.id, target: to.id, faction: from.faction, count, attack: this.attack(from) });
    return true;
  }
  arrive(flight) {
    const node = this.nodes[flight.target];
    if (node.faction === flight.faction) { node.population += flight.count; return; }
    const attack = flight.attack ?? FACTIONS[flight.faction].attack;
    const defence = this.defence(node);
    const damage = flight.count * attack / defence;
    if (damage > node.population) {
      const survivors = flight.count - node.population * defence / attack;
      node.faction = flight.faction; node.population = survivors;
    } else node.population = Math.max(0,node.population - damage);
  }
  buy(id, action, type) {
    const node = this.nodes[id];
    if (this.result || !node || node.faction !== 'Player') return false;
    const wallUpgrade = this.nextWall(node);
    if (action === 'wall' && !wallUpgrade) return false;
    const cost = action === 'wall' ? wallUpgrade.cost : action === 'city' ? 100 : 60;
    if (this.gold.Player < cost) return false;
    if (action === 'city' && node.type !== 'village') return false;
    if (action === 'type' && (!TYPES[type] || type === 'city' || node.type === type)) return false;
    if (!['wall','city','type'].includes(action)) return false;
    this.gold.Player -= cost;
    if (action === 'wall') { node.wall += wallUpgrade.defence; node.wallLevel++; }
    else node.type = action === 'city' ? 'city' : type;
    return true;
  }
  tick(dt = .1) {
    if (this.result) return;
    this.time += dt;
    for (const n of this.nodes) {
      n.population += this.generation(n) * dt;
      this.gold[n.faction] += TYPES[n.type].income * FACTIONS[n.faction].productivity * dt;
    }
    // Each installation fires at one nearest hostile aircraft, regardless of its destination.
    // Damage removes population directly and retains fractions between simulation ticks.
    this.beams = [];
    for (const node of this.nodes.filter(n => this.hasLaser(n))) {
      let target, nearest = LASER_RANGE;
      for (const flight of this.flights) {
        if (flight.faction === node.faction || flight.count <= 1e-9) continue;
        const distance = Math.hypot(flight.x-node.x,flight.y-node.y);
        if (distance <= nearest) { target = flight; nearest = distance; }
      }
      if (target) {
        target.count = Math.max(0,target.count - LASER_DPS * dt);
        this.beams.push({ node, flight: target });
      }
    }
    this.flights = this.flights.filter(f => {
      if (f.count <= 1e-9) return false;
      const target = this.nodes[f.target], dx = target.x-f.x, dy = target.y-f.y, distance = Math.hypot(dx,dy), step = FACTIONS[f.faction].speed * dt;
      if (distance <= step) { this.arrive(f); return false; }
      f.x += dx/distance*step; f.y += dy/distance*step; return true;
    });
    this.aiClock += dt;
    if (this.aiClock >= 8) { this.aiClock = 0; this.enemyTurn(); }
    const alive = faction => this.nodes.some(n => n.faction === faction) || this.flights.some(f => f.faction === faction);
    if (!alive('Player')) this.result = 'defeat';
    else if (this.nodes.every(n => n.faction === 'Player') && !alive('Enemy')) this.result = 'victory';
  }
  enemyTurn() {
    for (const from of this.nodes.filter(n => n.faction === 'Enemy' && n.population >= 14)) {
      const targets = this.nodes.filter(n => n.faction !== 'Enemy' && !this.flights.some(f => f.faction === 'Enemy' && f.target === n.id));
      targets.sort((a,b) => (a.population*this.defence(a)+Math.hypot(from.x-a.x,from.y-a.y)*.035) - (b.population*this.defence(b)+Math.hypot(from.x-b.x,from.y-b.y)*.035));
      if (targets[0]) this.send(from.id,targets[0].id,.7);
    }
  }
}
