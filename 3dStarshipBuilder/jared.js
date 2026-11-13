import {blockierGeometry} from './blockier.js';
import {solid,join,move,cylinder,sphere} from './blocks.js';
export const jaredTypes=['hull','cockpit','engine','wing','shieldGenerator','cannon','passengerModule'];
const yellow='#ffe55c',plasma='#ffba54';
function orb(color,scale,center=[0,0,0]){return move(sphere(1,color),center,scale);}
function crystal(){
 const vertices=[[0,.85,0],...[-.45,.45].flatMap(y=>Array.from({length:6},(_,i)=>[.43*Math.cos(i*Math.PI/3),y,.43*Math.sin(i*Math.PI/3)])),[0,-.85,0]],faces=[];
 for(let i=0;i<6;i++){const j=(i+1)%6;faces.push([0,7+i,7+j],[1+i,1+j,7+j,7+i],[13,1+j,1+i]);}
 return solid(vertices.map(([x,y,z])=>[x*.5,-z*.5,y*.5]),faces,yellow);
}
export function jaredGeometry(p,time=0){
 const color=p.color;
 if(p.type==='hull')return blockierGeometry(color,p.moduleBevel??1,p.jaredHullProfile);

 if(p.type==='cockpit'){
   const shell=orb(color,[.4,.32,.8]);for(const v of shell.vertices)v[0]*=1+v[2]*.3;
   shell.vertices=shell.vertices.map(([x,y,z])=>[x*.64,-z*.25,y*1.6]);
   return shell;
 }
 if(p.type==='engine'){

   const ball=orb(plasma,[.36,.36,.36]);
   ball.vertices=ball.vertices.map(([x,y,z])=>[x*.6,-z*.6,y]);
   // Yellow marks the forward (-Z) pole; orange marks the rear (+Z) pole.
   ball.faceColors=ball.faces.map(face=>{
     const z=face.reduce((sum,i)=>sum+ball.vertices[i][2],0)/face.length;
     return z<-.12?'#fff5af':z<.12?'#ffe55c':plasma;
   });
   return ball;
 }
 if(p.type==='wing'){
   const blade=orb(color,[1.3,.09,.4],[1.15,0,.2]);
   for(const v of blade.vertices){v[2]+=.28*v[0]*v[0];v[1]+=.06*v[0];}
   // A longer, narrower swept blade with the same volume as the standard blade.
   if(p.bladeProfile==='sustained')for(const v of blade.vertices){v[0]*=1.4;v[2]/=1.4;}
   for(const v of blade.vertices){v[0]*=.5;v[2]*=.5;}
   blade.faces=blade.faces.flatMap(f=>Array.from({length:f.length-2},(_,i)=>[f[0],f[i+1],f[i+2]]));blade.faceColors=blade.faces.map(()=>color);return blade;
 }
 if(p.type==='shieldGenerator')return crystal();
 if(p.type==='cannon'){
   const length=p.spikeLength??1.6,vertices=[[0,0,-length],...Array.from({length:12},(_,i)=>[.24*Math.cos(i*Math.PI/6),.24*Math.sin(i*Math.PI/6),0])],faces=[Array.from({length:12},(_,i)=>i+1)];
   for(let i=0;i<12;i++)faces.push([0,i+1,(i+1)%12+1]);
   const base=cylinder(.24+.1,.35,16,color,'z');
   // Continue the rear rim into a pointed cap, sharing its vertices with the cylinder.
   base.faces.splice(1,1);
   const tip=base.vertices.length;base.vertices.push([0,0,.55]);
   for(let i=0;i<16;i++)base.faces.push([16+i,16+(i+1)%16,tip]);
   return move(join([solid(base.vertices,base.faces,color),solid(vertices,faces,'#f2a7b0')]),[0,0,0],[.5,.5,.5]);
 }
 if(p.type==='passengerModule'){
   const pieces=[orb(color,[.85,.85,.85])];
   for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]]){pieces.push(orb('#391829',x?[.10,.26,.26]:[.26,.26,.10],[x*.83,0,z*.83]));pieces.push(orb('#ffc76e',x?[.08,.19,.19]:[.19,.19,.08],[x*.91,0,z*.91]));}
   return join(pieces);
 }
 throw Error('Unknown Jared part: '+p.type);
}

