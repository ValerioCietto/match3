import {blockierGeometry} from './blockier.js';
import {solid,join,move,cylinder,sphere} from './blocks.js';
export const jaredTypes=['hull','cockpit','engine','wing','shieldGenerator','cannon','passengerModule'];
const yellow='#ffe55c',plasma='#ffba54';
function orb(color,scale,center=[0,0,0]){return move(sphere(1,color),center,scale);}
function ring(radius,tube,color,axis='y'){
 const vertices=[],faces=[],n=24,m=6;
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*2*Math.PI/n,b=j*2*Math.PI/m,r=radius+tube*Math.cos(b);const v=[r*Math.cos(a),tube*Math.sin(b),r*Math.sin(a)];if(axis==='z')[v[1],v[2]]=[v[2],v[1]];vertices.push(v);}
 for(let i=0;i<n;i++)for(let j=0;j<m;j++)faces.push([i*m+j,((i+1)%n)*m+j,((i+1)%n)*m+(j+1)%m,i*m+(j+1)%m]);
 // Analytic outward orientation; torus faces cannot use a single convex centroid.
 if(axis==='y')faces.forEach(f=>f.reverse());
 return {vertices,faces,faceColors:faces.map(()=>color)};
}
function crystal(){
 const vertices=[[0,.85,0],...[-.25,.45].flatMap(y=>Array.from({length:6},(_,i)=>[.43*Math.cos(i*Math.PI/3),y,.43*Math.sin(i*Math.PI/3)])),[0,-.55,0]],faces=[];
 for(let i=0;i<6;i++){const j=(i+1)%6;faces.push([0,7+i,7+j],[1+i,1+j,7+j,7+i],[13,1+j,1+i]);}
 const m=solid(vertices,faces,yellow);m.faceColors=m.faces.map((_,i)=>i%3===0?'#fff5af':yellow);return m;
}
export function jaredGeometry(p,time=0){
 const color=p.color;
 if(p.type==='hull'&&p.jaredHullProfile==='blockier')return blockierGeometry(color,p.moduleBevel??.15);
 if(p.type==='hull')return join([orb(color,[.85,.42,1.7]),orb('#6e273d',[.72,.18,1.3],[0,-.24,.2])]);
 if(p.type==='cockpit'){
   const shell=orb(color,[.4,.32,.8]);for(const v of shell.vertices)v[0]*=1+v[2]*.3;
   return join([shell,orb('#301224',[.48,.11,.85],[0,-.22,.04])]);
 }
 if(p.type==='engine'){
   const bob=Math.sin(time*.8)*.09;
   return join([move(cylinder(.55,.16,16,color),[0,-.65,0]),ring(.75,.055,'#9c465f','z'),orb(plasma,[.4,.4,.4],[0,bob,0]),orb('#fff5af',[.16,.16,.16],[Math.sin(time*.45)*.48,bob+Math.cos(time*.45)*.48,0])]);
 }
 if(p.type==='wing'){
   const blade=orb(color,[1.3,.09,.4],[1.15,0,.2]);
   for(const v of blade.vertices){v[2]+=.28*v[0]*v[0];v[1]+=.06*v[0];}
   blade.faces=blade.faces.flatMap(f=>Array.from({length:f.length-2},(_,i)=>[f[0],f[i+1],f[i+2]]));blade.faceColors=blade.faces.map(()=>color);return blade;
 }
 if(p.type==='shieldGenerator')return join([move(cylinder(.55,.12,6,color),[0,-.45,0]),crystal()]);
 if(p.type==='cannon'){
   const length=p.spikeLength??1.6,vertices=[[0,0,-length],...Array.from({length:12},(_,i)=>[.24*Math.cos(i*Math.PI/6),.24*Math.sin(i*Math.PI/6),0])],faces=[Array.from({length:12},(_,i)=>i+1)];
   for(let i=0;i<12;i++)faces.push([0,i+1,(i+1)%12+1]);
   return join([cylinder(.38,.35,16,color,'z'),solid(vertices,faces,'#f2a7b0')]);
 }
 if(p.type==='passengerModule'){
   const pieces=[orb(color,[.85,.85,.85])];
   for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]]){pieces.push(orb('#391829',x?[.10,.26,.26]:[.26,.26,.10],[x*.83,0,z*.83]));pieces.push(orb('#ffc76e',x?[.08,.19,.19]:[.19,.19,.08],[x*.91,0,z*.91]));}
   return join(pieces);
 }
 throw Error('Unknown Jared part: '+p.type);
}
export function hasJaredPlasma(parts){return parts.some(p=>p.designStyle==='jared'&&p.type==='engine');}
