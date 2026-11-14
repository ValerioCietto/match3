import {solid,join,move,cylinder,sphere} from './blocks.js';
import {spikeBladeGeometry,spikeBladeTraces} from './spike-blade.js';
import {gravCannonGeometry,gravCannonTraces,gravCannonDepth} from './grav-cannon.js';
import {icosphere} from './icosphere.js';
export const technicianHullProfiles={sphere:'Opaline icosphere / subdivision 3',rockShell:'Half rock shell',reliquary:'Orb Reliquary',octolith:'Octolith',riftArk:'Rift Ark'};
const metal='#a4abb1',darkMetal='#575c68',energy='#bc65ff',orbColor='#65eff1';
const rockColors=['#655f58','#77716a','#494846','#8b8175','#56534f'];
const opalColors=['#e4e8e5','#bce4df','#d9c8ee','#b8d4eb','#eee0cb','#c7e4d2'];

export const technicianLibrary={
 laserLine:{name:'Laser line weapon',icon:'↗',color:metal,composite:true},
 pushOutside:{name:'Push outside weapon',icon:'⇥',color:metal,composite:true},
 gravStop:{name:'Grav stop bullet',icon:'⊙',color:metal,composite:true},
 sapRay:{name:'Sap ray',icon:'ϟ',color:metal,composite:true},
 teleportShield:{name:'Teleport jump shield module',icon:'◇',color:metal,composite:true},
 shieldRegen:{name:'Shield Regen module',icon:'⊕',color:metal,composite:true},
 nanitesSpray:{name:'Nanites spray',icon:'⁙',color:metal,composite:true}
};
export const technicianTypes=['hull','engine',...Object.keys(technicianLibrary),'turret'];
export const octagonalTypes=['engine','laserLine','pushOutside','gravStop','sapRay','nanitesSpray'];
export const technicianGlow=['#cfacff','#83e5ff','#a5ffd4','#ffd88b',energy,orbColor];
export const hasAnimatedTechnician=parts=>parts.some(p=>p.type==='shieldRegen');
export const technicianDescriptions={
 hull:'Ancient angular metal, cyan orbs and purple energy channels. Eightfold radial structures or an asymmetric ark; the rock shell has an opaline interior.',
 engine:'Omni thruster. Optional eight-way layout around the Y axis.',
 laserLine:'Automatic laser: 100-unit range, 60-degree cone, 10 DPS per module.',
 pushOutside:'Spike-blade SVG profile with purple energy traces. Fires a wave that pushes opposite to the projectile direction.',
 gravStop:'SVG gravity cannon with symmetric depth-map thickness and purple power lines. Each hit removes 10% of current speed.',
 sapRay:'Twin-prong energy siphon emitter.',
 turret:'Predictive aim turret with an elevated sensor and barrel.',
 teleportShield:'On hit, blinks 6 units in a random direction. Shared ship cooldown: 2 seconds.',
 shieldRegen:'Slowly rotating pearl sphere that regenerates shields.',
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
export function rockShell(color){
 const sides=16,rings=4,outer=[[0,1.08,0]],faces=[];
 for(let j=1;j<=rings;j++)for(let i=0;i<sides;i++){
  const a=j*Math.PI/(2*rings),b=i*Math.PI*2/sides;
  const rough=1+.09*Math.sin(i*2.37+j*1.71)+.04*Math.cos(i*4.13-j);
  outer.push([Math.sin(a)*Math.cos(b)*rough,Math.cos(a)*rough,Math.sin(a)*Math.sin(b)*rough]);
 }
 for(let i=0;i<sides;i++)faces.push([0,1+i,1+(i+1)%sides]);
 for(let j=0;j<rings-1;j++)for(let i=0;i<sides;i++){
  const a=1+j*sides+i,b=1+j*sides+(i+1)%sides;
  faces.push([a,b,b+sides],[a,b+sides,a+sides]);
 }
 // Orient the outside radially, then reverse the corresponding inside faces.
 for(const f of faces){const [a,b,c]=f.map(i=>outer[i]),u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
  const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(normal.reduce((sum,n,i)=>sum+n*a[i],0)<0)f.reverse();
 }
 const offset=outer.length,vertices=[...outer,...outer.map(v=>v.map(n=>n*.78))];
 const allFaces=[...faces,...faces.map(f=>f.map(i=>i+offset).reverse())];
 const rim=1+(rings-1)*sides;
 for(let i=0;i<sides;i++){const a=rim+i,b=rim+(i+1)%sides;allFaces.push([a,b+offset,a+offset],[a,b,b+offset]);}
 return {vertices,faces:allFaces,faceColors:allFaces.map((_,i)=>i<faces.length?rockColors[(i*7)%rockColors.length]:i<faces.length*2?opalColors[(i*11)%opalColors.length]:rockColors[1])};
}
function strut(a,b,width,color){
 const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz);
 const up=[dx/length,dy/length,dz/length],ref=Math.abs(up[1])<.9?[0,1,0]:[1,0,0];
 let side=[up[1]*ref[2]-up[2]*ref[1],up[2]*ref[0]-up[0]*ref[2],up[0]*ref[1]-up[1]*ref[0]];
 const norm=Math.hypot(...side);side=side.map(n=>n/norm);
 const front=[side[1]*up[2]-side[2]*up[1],side[2]*up[0]-side[0]*up[2],side[0]*up[1]-side[1]*up[0]];
 const beam=cylinder(width,length,4,color);beam.vertices=beam.vertices.map(v=>v.map((_,i)=>(a[i]+b[i])/2+v[0]*side[i]+v[1]*up[i]+v[2]*front[i]));return beam;
}
function ancientHull(profile,color){
 const pieces=[],orb=(r,pos)=>move(sphere(r,orbColor),pos);
 if(profile==='reliquary'){
  pieces.push(orb(.62,[0,.12,0]),ring(.97,.83,.18,color),move(ring(.78,.72,.055,energy),[0,.2,0]));
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,c=Math.cos(a),s=Math.sin(a);
   pieces.push(strut([c*.88,-.25,s*.88],[c*.32,.85,s*.32],.095,color),strut([c*.84,-.22,s*.84],[c*.3,.86,s*.3],.022,energy),orb(.14,[c*1.1,0,s*1.1]));
  }
  pieces.push(move(cylinder(.4,.18,8,darkMetal),[0,.85,0]));
 }else if(profile==='octolith'){
  pieces.push(cylinder(.72,.65,8,darkMetal),move(cylinder(.58,.1,8,energy),[0,.35,0]),orb(.38,[0,.53,0]));
  for(let i=0;i<8;i++){
   const wedge=solid([[-.2,-.18,-.5],[.2,-.18,-.5],[.24,-.12,-1.12],[0,0,-1.52],[-.24,-.12,-1.12],[-.16,.25,-.55],[.16,.25,-.55],[0,.16,-1.2]],[[0,4,3,2,1],[0,1,6,5],[1,2,7,6],[2,3,7],[3,4,7],[4,0,5,7],[5,6,7]],color);
   pieces.push(rotateY(wedge,i*Math.PI/4),rotateY(strut([0,.27,-.57],[0,.18,-1.18],.025,energy),i*Math.PI/4),rotateY(orb(.12,[0,.18,-1.32]),i*Math.PI/4));
  }
 }else{
  pieces.push(move(cylinder(.55,2.5,8,color,'z'),[-.25,0,0]),move(ring(.76,.61,.18,darkMetal),[.52,.1,.2]),orb(.48,[.55,.18,.2]),orb(.23,[-.5,.35,-1.02]));
  const route=[[-.55,.5,-1.1],[-.1,.5,-.65],[-.1,.5,.45],[.45,.5,.9],[.45,.5,1.3]];
  for(let i=1;i<route.length;i++)pieces.push(strut(route[i-1],route[i],.035,energy));
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,c=Math.cos(a),s=Math.sin(a);
   pieces.push(strut([.52+c*.67,.12,.2+s*.67],[.52+c*.35,.75,.2+s*.35],.065,color));
  }
  pieces.push(move(cylinder(.3,1.3,8,darkMetal,'z'),[-.9,-.1,.62]),strut([-.9,.22,.15],[-.9,.22,1.2],.025,energy));
 }
 const result=join(pieces);
 // Tarnish selected metal facets without touching the emissive channels.
 result.faceColors=result.faceColors.map((c,i)=>c===color&&i%7===0?darkMetal:c);
 return result;
}
function emitter(type,color){
 if(type==='gravStop'){
  const pieces=[gravCannonGeometry(color)];
  for(const trace of gravCannonTraces)for(let i=1;i<trace.length;i++)for(const side of [-1,1]){
   const a=trace[i-1],b=trace[i],depth=gravCannonDepth((a[0]+b[0])/2,(a[1]+b[1])/2)+.009;
   pieces.push(strut([a[0],side*depth,a[1]],[b[0],side*depth,b[1]],.009,energy));
  }
  return join(pieces);
 }
 if(type==='pushOutside'){
  const pieces=[spikeBladeGeometry(color)];
  for(const trace of spikeBladeTraces)for(let i=1;i<trace.length;i++)for(const y of [-.046,.046]){
   const a=[trace[i-1][0],y,trace[i-1][1]],b=[trace[i][0],y,trace[i][1]];
   pieces.push(strut(a,b,.008,energy));
  }
  return join(pieces);
 }
 const pieces=[axial(.19,.4,color)];
 if(type==='engine')pieces.push(axial(.28,.18,color,-.25),axial(.22,.04,energy,-.36));
 if(type==='laserLine')pieces.push(axial(.12,.75,color,-.48),axial(.085,.04,energy,-.875));
 if(type==='sapRay'){
  for(const x of [-.17,.17])pieces.push(move(axial(.075,.6,color,-.4),[x,0,0]));
  pieces.push(axial(.09,.5,energy,-.35));
 }
 if(type==='nanitesSpray'){
  pieces.push(axial(.26,.5,color,.15));
  for(const [x,y] of [[0,0],[.1,0],[-.1,0],[0,.1],[0,-.1]])pieces.push(move(axial(.035,.25,energy,-.3),[x,y,0]));
 }
 return join(pieces);
}
export function technicianGeometry(p,time=0){
 const color=p.color==='#9274b8'?metal:p.color;
 if(p.type==='hull'){
  const profile=p.technicianHullProfile||'sphere';
  if(profile==='sphere'){
   const hull=icosphere(.7,opalColors[0],3);
   hull.faceColors=hull.faces.map((_,i)=>opalColors[Math.floor(i/3)%opalColors.length]);
   return hull;
  }
  return profile==='rockShell'?rockShell(color):ancientHull(profile,color);
 }
 if(octagonalTypes.includes(p.type)){
  if(p.octagonalSymmetry===false)return emitter(p.type,color);
  const pieces=[cylinder(.58,.28,8,color),cylinder(.43,.32,8,energy)];
  for(let i=0;i<8;i++)pieces.push(rotateY(move(emitter(p.type,color),[0,0,-.7]),i*Math.PI/4));
  return join(pieces);
 }
 if(p.type==='turret')return join([cylinder(.5,.2,8,color),move(sphere(.31,color),[0,.3,0]),move(axial(.09,.8,energy,-.4),[0,.3,0]),move(cylinder(.15,.12,8,energy),[0,.64,0])]);
 if(p.type==='teleportShield'){
  const cross=ring(.7,.55,.09,color);cross.vertices=cross.vertices.map(([x,y,z])=>[x,-z,y]);
  return join([ring(.7,.55,.09,color),cross,sphere(.3,energy)]);
 }
 if(p.type==='shieldRegen'){
  const pearl=sphere(.52,'#ede8ed'),palette=['#f5eee7','#d5e9e5','#ded3ed','#cbdde9','#ecd5df','#f1ebd6'];
  // Rotate the pearl surface around Y; the spherical envelope stays fixed.
  // Keeping the envelope fixed prevents animation from changing ship framing or collision size.
  pearl.faceColors=pearl.faces.map(face=>{
   const center=[0,1,2].map(axis=>face.reduce((sum,i)=>sum+pearl.vertices[i][axis],0)/face.length);
   const phase=((Math.atan2(center[2],center[0])-time*.4+center[1]*3)/(Math.PI*2)%1+1)%1*palette.length;
   const a=palette[Math.floor(phase)],b=palette[(Math.floor(phase)+1)%palette.length],t=phase%1;
   return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
  });
  pearl.vertices=pearl.vertices.map(([x,y,z])=>[-y,x,z]);
  return pearl;
 }
 throw Error('Unknown Technician module: '+p.type);
}
