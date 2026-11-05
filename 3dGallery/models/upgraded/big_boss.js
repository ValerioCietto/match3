import original from '../big_boss.js';
import {builder,add,mul,unit,glass} from './parts.js';
const b=builder(original,'Silver D20 fortress: every one of its twenty faces carries an outward-facing gun and a glazed cockpit.');
b.hull([4,4,4]);
original.faces.forEach((face,index)=>{
  const points=face.map(i=>mul(original.vertices[i],4));
  const center=mul(points.reduce(add,[0,0,0]),1/3);
  const normal=unit(center), tangent=unit(points[1].map((v,i)=>v-points[0][i]));
  const gunOrigin=add(center,mul(tangent,-.23));
  const cockpitOrigin=add(center,mul(tangent,.23));
  b.gun(`face ${index+1} gun`,gunOrigin,normal,.5);
  b.tube(`face ${index+1} cockpit rim`,cockpitOrigin,normal,.06,.18,.18,'#4b637a',6);
  b.tube(`face ${index+1} cockpit`,add(cockpitOrigin,mul(normal,.06)),normal,.21,.16,.07,glass,6);
});
export default b.model;
