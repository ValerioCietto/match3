import {Shape,ExtrudeGeometry} from './vendor/three/three.module.js';
import source from './module-shapes/spike-blade.shape.json' with {type:'json'};
export const spikeBladeTraces=source.traces;
export function spikeBladeGeometry(color){
 const shape=new Shape();source.outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const geometry=new ExtrudeGeometry(shape,{depth:.08,steps:1,bevelEnabled:false,curveSegments:1});
 const pos=geometry.getAttribute('position'),vertices=[],faces=[],ids=new Map(),mapping=[];
 for(let i=0;i<pos.count;i++){
  const v=[pos.getX(i),pos.getZ(i)-.04,-pos.getY(i)],key=v.map(n=>n.toFixed(6)).join(',');
  if(!ids.has(key)){ids.set(key,vertices.length);vertices.push(v);}mapping.push(ids.get(key));
 }
 for(let i=0;i<mapping.length;i+=3){const face=mapping.slice(i,i+3);if(new Set(face).size===3)faces.push(face);}
 geometry.dispose();return {vertices,faces,faceColors:faces.map(face=>face.every(i=>vertices[i][1]>.039)||face.every(i=>vertices[i][1]<-.039)?color:'#575c68')};
}
