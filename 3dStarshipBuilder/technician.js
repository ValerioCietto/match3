import {join,move,cylinder,sphere} from './blocks.js';

export const technicianLibrary={
 laserLine:{name:'Laser line weapon',icon:'↗',color:'#ac80ef',composite:true},
 pushOutside:{name:'Push outside weapon',icon:'⇥',color:'#a390ce',composite:true},
 gravStop:{name:'Grav stop bullet',icon:'⊙',color:'#8274ba',composite:true},
 sapRay:{name:'Sap ray',icon:'ϟ',color:'#b77bd8',composite:true},
 teleportShield:{name:'Teleport jump shield module',icon:'◇',color:'#b18bfa',composite:true},
 shieldRegen:{name:'Shield Regen module',icon:'⊕',color:'#8d9ee8',composite:true},
 nanitesSpray:{name:'Nanites spray',icon:'⁙',color:'#9fa8cb',composite:true}
};
export const technicianTypes=['hull','engine',...Object.keys(technicianLibrary),'turret'];
export const octagonalTypes=['engine','laserLine','pushOutside','gravStop','sapRay','nanitesSpray'];
export const technicianGlow=['#cfacff','#83e5ff','#a5ffd4','#ffd88b'];
export const technicianDescriptions={
 hull:'Spherical hull. Additional hull profiles will follow.',
 engine:'Omni thruster. Optional eight-way layout around the Y axis.',
 laserLine:'Automatic laser: 100-unit range, 60-degree cone, 10 DPS per module.',
 pushOutside:'Fires a wave that pushes the target opposite to the projectile direction on impact.',
 gravStop:'Heavy gravity launcher. Each projectile hit removes 10% of current speed.',
 sapRay:'Twin-prong energy siphon emitter.',
 turret:'Predictive aim turret with an elevated sensor and barrel.',
 teleportShield:'On hit, blinks 6 units in a random direction. Shared ship cooldown: 2 seconds.',
 shieldRegen:'Shield regeneration module with stacked field plates.',
 nanitesSpray:'Seeking projectiles add 10 infestation for 10 seconds per hit. Infestation damages hull by one tenth of its value every 0.1 seconds.'
};

function ring(outer,inner,depth,color){
 const vertices=[-depth/2,depth/2].flatMap(y=>[outer,inner].flatMap(r=>Array.from({length:8},(_,i)=>[r*Math.cos(i*Math.PI/4),y,r*Math.sin(i*Math.PI/4)])));
 const faces=[];for(let i=0;i<8;i++){const j=(i+1)%8;faces.push([i,j,16+j,16+i],[8+i,24+i,24+j,8+j],[i,8+i,8+j,j],[16+i,16+j,24+j,24+i]);}
 // A ring is concave: preserve inward-facing normals on its inner wall.
 return {vertices,faces:faces.map(face=>face.reverse()),faceColors:faces.map(()=>color)};
}
function rotateY(m,angle){const c=Math.cos(angle),s=Math.sin(angle);m.vertices=m.vertices.map(([x,y,z])=>[x*c+z*s,y,-x*s+z*c]);return m;}
const axial=(r,h,color,z=0)=>move(cylinder(r,h,8,color,'z'),[0,0,z]);
function emitter(type,color){
 const pieces=[axial(.19,.4,color)];
 if(type==='engine')pieces.push(axial(.28,.18,color,-.25),axial(.22,.04,'#cfacff',-.36));
 if(type==='laserLine')pieces.push(axial(.12,.75,color,-.48),axial(.085,.04,'#83e5ff',-.875));
 if(type==='pushOutside')pieces.push(axial(.34,.14,color,-.28),axial(.29,.04,'#cfacff',-.37));
 if(type==='gravStop'){
  pieces.push(axial(.12,.7,'#cfacff',-.4));
  for(const z of [-.2,-.4,-.6])pieces.push(axial(.23,.08,color,z));
 }
 if(type==='sapRay'){
  for(const x of [-.17,.17])pieces.push(move(axial(.075,.6,color,-.4),[x,0,0]));
  pieces.push(axial(.09,.5,'#a5ffd4',-.35));
 }
 if(type==='nanitesSpray'){
  pieces.push(axial(.26,.5,color,.15));
  for(const [x,y] of [[0,0],[.1,0],[-.1,0],[0,.1],[0,-.1]])pieces.push(move(axial(.035,.25,'#a5ffd4',-.3),[x,y,0]));
 }
 return type==='gravStop'?move(join(pieces),[0,0,0],[1.5,1.5,1.5]):join(pieces);
}
export function technicianGeometry(p){
 const color=p.color;
 if(p.type==='hull')return sphere(1,color);
 if(octagonalTypes.includes(p.type)){
  if(p.octagonalSymmetry===false)return emitter(p.type,color);
  const pieces=[cylinder(.58,.28,8,color),cylinder(.43,.32,8,'#cfacff')];
  for(let i=0;i<8;i++)pieces.push(rotateY(move(emitter(p.type,color),[0,0,-.7]),i*Math.PI/4));
  return join(pieces);
 }
 if(p.type==='turret')return join([cylinder(.5,.2,8,color),move(sphere(.31,color),[0,.3,0]),move(axial(.09,.8,'#83e5ff',-.4),[0,.3,0]),move(cylinder(.15,.12,8,'#ffd88b'),[0,.64,0])]);
 if(p.type==='teleportShield'){
  const cross=ring(.7,.55,.09,color);cross.vertices=cross.vertices.map(([x,y,z])=>[x,-z,y]);
  return join([ring(.7,.55,.09,color),cross,sphere(.3,'#cfacff')]);
 }
 if(p.type==='shieldRegen')return join([cylinder(.22,.65,8,'#83e5ff'),...[-.27,0,.27].map(y=>move(cylinder(.48,.1,8,color),[0,y,0]))]);
 throw Error('Unknown Technician module: '+p.type);
}
