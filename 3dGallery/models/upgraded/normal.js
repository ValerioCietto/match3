import original from '../normal.js';
import {builder,metal} from './parts.js';
const b=builder(original,'A rhomboid fighter with a raised cockpit, swept wings and four forward cannons.');
b.plate('rhomboid hull',[[0,1.8],[1,0],[0,-1.5],[-1,0]],0,.4,original.color);
b.cockpit([0,.23,.15],1);
for(const side of [-1,1]){
  b.plate('swept wing',[[.55,.7],[2,-.55],[1.75,-1.15],[.55,-.6]].map(([x,z])=>[x*side,z]),-.02,.15,metal);
  for(const x of [.9,1.5])b.gun('cannon',[side*x,.04,x===.9?.48:-.05],[0,0,1],.8);
  b.thruster('rear engine',[side*.43,-.02,-.9],.8);
}
export default b.model;
