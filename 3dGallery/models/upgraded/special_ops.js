import original from '../special_ops.js';
import {builder} from './parts.js';
const b=builder(original,'A flattened special-ops hull with a compact cockpit, a frontal gun and twin aft thrusters.');
b.hull([3,.65,3.4]);
b.cockpit([0,.24,.05],.8);
b.gun('frontal gun',[0,0,1.4],[0,0,1],1);
for(const side of [-1,1]){
  b.plate('engine strake',[[.25,.2],[.85,-.6],[.65,-1.25],[.25,-1.1]].map(([x,z])=>[side*x,z]),-.06,.16,'#4d70c8');
  b.thruster('aft thruster',[side*.5,-.06,-1.1],.9);
}
export default b.model;
