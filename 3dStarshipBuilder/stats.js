import {library,mesh} from './model.js';

// Game-balance coefficients per cubic unit. Mass is in tonnes; cost is credits.
// Missing capabilities contribute zero. Every module contributes mass, hull and cost.
export const moduleRates = {
  armor: {mass: 1.4, hull: 1200, cost: 650},
  hull: {mass: .65, hull: 300, repair: 1.5, cost: 200, torque: 2},
  wing: {mass: .25, hull: 100, cost: 260, torque: 60},
  engine: {mass: 1.2, hull: 150, cost: 1200, thrust: 45, torque: 8},
  cockpit: {mass: .45, hull: 120, cost: 1000, torque: 4},
  cannon: {mass: 1.1, hull: 180, cost: 1400},
  cargo: {mass: .35, payload: 1.5, hull: 140, cost: 160},
  fin: {mass: .3, hull: 100, cost: 180, torque: 20},
  nozzle: {mass: .6, hull: 90, cost: 800, thrust: 20, torque: 5},
  turret: {mass: 1.2, hull: 250, cost: 2000},
  fighterBay: {mass: .5, payload: 2, hull: 180, cost: 900},
  fuelPod: {mass: .2, payload: .8, hull: 90, cost: 300},
  shieldGenerator: {mass: .9, hull: 120, shield: 800, shieldRegen: 20, cost: 2400},
  passengerModule: {mass: .4, hull: 180, cost: 450}
};
const neutral = {position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],mirror:false};
export const armorRates={
  darkAlloy:moduleRates.armor,
  stealth:{mass:.65,hull:160,cost:1800,radarReduction:40},
  solar:{mass:.3,hull:100,cost:1400,energy:60},
  shield:{mass:.7,hull:120,cost:2400,shield:800,shieldRegen:20},
  highTech:{mass:.7,hull:660,cost:12000,radarReduction:20,energy:30,shield:400,shieldRegen:10,slots:.1}
};

// Signed tetrahedra measure the actual closed surfaces, not the bounding box.
// For composite blocks this sums component solids, including intersecting components.
export function moduleVolume(p){
  const m=mesh({...p,...neutral,mirror:!!p.mirror});let volume=0;
  for(const face of m.faces)for(let i=1;i<face.length-1;i++){
    const [a,b,c]=[face[0],face[i],face[i+1]].map(index=>m.vertices[index]);
    volume+=a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]);
  }
  return Math.abs(volume/6)*p.scale.reduce((a,b)=>a*b,1)*(p.mirror?2:1);
}
const defaultVolumes=Object.fromEntries(Object.keys(library).map(type=>[type,moduleVolume({type,name:type,color:library[type].color,...neutral})]));
const mirroredPassengerVolume=moduleVolume({type:'passengerModule',name:'Cabin',color:library.passengerModule.color,...neutral,mirror:true})/2;

export function moduleStats(p){
  const volume=moduleVolume(p),r=p.type==='armor'?armorRates[p.armorProfile||'darkAlloy']:p.designStyle==='jared'&&p.type==='passengerModule'?{...moduleRates.passengerModule,payload:1.5}:moduleRates[p.type],capacity=volume/(p.type==='passengerModule'&&p.mirror&&p.designStyle!=='jared'?mirroredPassengerVolume:defaultVolumes[p.type]);
  const passengers=p.type==='passengerModule'?capacity*8:0;
  const sustained=p.type==='wing'&&p.designStyle==='jared'&&p.bladeProfile==='sustained';
  // Compact Jared blades keep their original handling contribution at one quarter volume.
  const handlingVolume=volume*(p.type==='wing'&&p.designStyle==='jared'?4:1);
  return {
    volume,massEmpty:volume*r.mass,massFull:volume*(r.mass+(r.payload||0))+passengers*.1,
    thrust:volume*(r.thrust||0)*(p.type==='engine'&&p.designStyle==='jared'?2:1),torque:handlingVolume*(r.torque||0)*(sustained?.35:1),wingVolume:p.type==='wing'?handlingVolume:0,
    shieldRegen:volume*(r.shieldRegen||0),shieldMax:volume*(r.shield||0),
    hullRegen:volume*(r.repair||0),hullMax:volume*r.hull,
    energyGeneration:volume*(r.energy||0),radarReduction:volume*(r.radarReduction||0),
    maxPassengers:passengers,gunSlots:p.type==='cannon'?capacity:volume*(r.slots||0),
    turretSlots:p.type==='turret'?capacity:volume*(r.slots||0),fighterSlots:p.type==='fighterBay'?capacity:volume*(r.slots||0),
    expectedCost:volume*r.cost
  };
}
export function recommendedStats(parts){
  const totals={volume:0,massEmpty:0,massFull:0,thrust:0,torque:0,wingVolume:0,shieldRegen:0,shieldMax:0,hullRegen:0,hullMax:0,maxPassengers:0,gunSlots:0,turretSlots:0,fighterSlots:0,expectedCost:0,energyGeneration:0,radarReduction:0};
  let baseThrust=0,forwardThrust=0,reverseThrust=0,speedTorque=0,baseTorque=0;
  for(const p of parts){
    const stats=moduleStats(p),sustained=p.type==='wing'&&p.designStyle==='jared'&&p.bladeProfile==='sustained',jaredEngine=p.type==='engine'&&p.designStyle==='jared';
    baseTorque+=stats.torque/(sustained?.35:1);speedTorque+=stats.torque*(sustained?4/.35:1);
    // Local -Z is forward. X/Y rotations project thrust onto the ship's longitudinal axis.
    const projection=jaredEngine?Math.cos(p.rotation[0]*Math.PI/180)*Math.cos(p.rotation[1]*Math.PI/180):1;
    const longitudinal=Math.abs(projection)<1e-10?0:projection;
    forwardThrust+=stats.thrust*Math.max(0,longitudinal);
    reverseThrust+=stats.thrust*Math.max(0,-longitudinal);
    baseThrust+=stats.thrust*Math.max(0,longitudinal)/(jaredEngine?2:1);
    for(const [key,value] of Object.entries(stats))totals[key]+=value;
  }
  // Mixed fleets receive the bonus only in proportion to their Jared propulsion.
  const propulsionBonus=baseThrust?forwardThrust/baseThrust:1;
  const inertia=totals.volume;
  const turnInertia=inertia?inertia/(1+6*totals.wingVolume/inertia):0;
  const acceleration=totals.massFull?forwardThrust/totals.massFull:0;
  // Arcade damping gives a useful finite cruise-speed recommendation in space.
  const maxSpeed=totals.massFull?forwardThrust/(.08*totals.massFull+.02*inertia):0;
  const reverseEngineMaxSpeed=totals.massFull?reverseThrust/(.08*totals.massFull+.02*inertia):0;
  const reverseEngineAcceleration=totals.massFull?reverseThrust/totals.massFull:0;
  const reverseMaxSpeed=.3*maxSpeed+reverseEngineMaxSpeed;
  const turnAcceleration=turnInertia?2*totals.torque/turnInertia:0;
  const turnMaxSpeed=turnInertia?Math.sqrt(speedTorque/turnInertia)*12:0;
  const turnSpeedBonus=baseTorque?Math.sqrt(speedTorque/baseTorque):1;
  return {...totals,acceleration,maxSpeed,inertia,turnAcceleration,turnMaxSpeed,turnInertia,propulsionBonus,turnSpeedBonus,forwardThrust,reverseThrust,reverseEngineMaxSpeed,reverseEngineAcceleration,reverseMaxSpeed};
}

export const statFields=[
  ['energyGeneration','Energy generation','EU/s'],['radarReduction','Radar signature reduction','pts'],
  ['acceleration','Acceleration','m/s²'],['maxSpeed','Max speed','m/s'],['inertia','Inertia','vol'],
  ['reverseMaxSpeed','Reverse max speed','m/s'],
  ['massFull','Mass full','t'],['massEmpty','Mass empty','t'],
  ['turnAcceleration','Turn acceleration','°/s²'],['turnMaxSpeed','Turn max speed','°/s'],['turnInertia','Turn inertia','idx'],
  ['shieldRegen','Shield regen','HP/s'],['shieldMax','Shield max','HP'],
  ['hullRegen','Hull regen','HP/s'],['hullMax','Hull max','HP'],
  ['maxPassengers','Max passengers',''],['gunSlots','Gun slots',''],['turretSlots','Turret slots',''],['fighterSlots','Fighter slots',''],
  ['expectedCost','Expected cost','cr']
];
