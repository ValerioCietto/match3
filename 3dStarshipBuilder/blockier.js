import {Shape,ExtrudeGeometry} from './vendor/three/three.module.js';
import source from './module-shapes/jared-blockier.outline.json' with {type:'json'};
import interceptor from './module-shapes/interceptor.outline.json' with {type:'json'};
import warlord from './module-shapes/warlord.outline.json' with {type:'json'};
export function blockierGeometry(color,bevel=1,profile='blockier'){
 const outline=profile==='interceptor'?interceptor.outline:profile==='warlord'?warlord.outline:source.outline;
 const shape=new Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const height=.275,edgeDepth=height*.5*bevel;
 const geometry=new ExtrudeGeometry(shape,{depth:height-2*edgeDepth,steps:1,curveSegments:1,bevelEnabled:bevel>0,bevelThickness:edgeDepth,bevelSize:.16*bevel,bevelSegments:1});
 const pos=geometry.getAttribute('position'),vertices=[],faces=[],ids=new Map(),mapping=[];
 for(let i=0;i<pos.count;i++){const v=[pos.getX(i),pos.getZ(i)-(height-2*edgeDepth)/2,-pos.getY(i)],key=v.map(n=>Number(n.toFixed(6))).join(',');if(!ids.has(key)){ids.set(key,vertices.length);vertices.push(v);}mapping.push(ids.get(key));}
 for(let i=0;i<mapping.length;i+=3){const f=mapping.slice(i,i+3);if(new Set(f).size===3)faces.push(f);}
 geometry.dispose();return {vertices,faces,faceColors:faces.map(()=>color)};
}
