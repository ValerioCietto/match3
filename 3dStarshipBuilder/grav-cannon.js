import {Shape,ExtrudeGeometry} from './vendor/three/three.module.js';
import {join} from './blocks.js';
import source from './module-shapes/grav-cannon.shape.json' with {type:'json'};
export const gravCannonTraces=source.traces;
export function gravCannonDepth(x,z){
 let depth=.04;
 for(const region of source.regions){
  let inside=false;const poly=region.outline;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  if(inside)depth=Math.max(depth,region.thickness/2);
 }return depth;
}
export function gravCannonGeometry(color){
 return join(source.regions.map(region=>{
  const shape=new Shape();region.outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geometry=new ExtrudeGeometry(shape,{depth:region.thickness,steps:1,bevelEnabled:false,curveSegments:1}),pos=geometry.getAttribute('position');
  const vertices=[],faces=[],ids=new Map(),mapping=[];
  for(let i=0;i<pos.count;i++){
   const v=[pos.getX(i),pos.getZ(i)-region.thickness/2,-pos.getY(i)],key=v.map(n=>n.toFixed(6)).join(',');
   if(!ids.has(key)){ids.set(key,vertices.length);vertices.push(v);}mapping.push(ids.get(key));
  }
  for(let i=0;i<mapping.length;i+=3){const face=mapping.slice(i,i+3);if(new Set(face).size===3)faces.push(face);}
  geometry.dispose();return {vertices,faces,faceColors:faces.map(()=>color)};
 }));
}
