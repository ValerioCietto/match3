import original from '../stealth.js';
import {builder,glass} from './parts.js';
const b=builder(original,'The original triangular body, extended with angular wings, a conical cockpit and twin rear thrusters.');
b.hull([3,2.4,3]);
for(const side of [-1,1]){
  b.plate('stealth wing',[[.7,.14],[2.1,-.6],[1.8,-1],[.65,-.65]].map(([x,z])=>[x*side,z]),-.35,.12,'#37465e');
  b.thruster('rear thruster',[side*.75,-.35,-.2],.8);
}
b.tube('cockpit collar',[0,.16,.16],[0,0,1],.12,.32,.3,'#526784');
b.tube('conical cockpit',[0,.16,.28],[0,0,1],.72,.3,0,glass,10);
export default b.model;
