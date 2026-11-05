import original from '../player.js';
import {builder,metal} from './parts.js';
const b=builder(original,'Void Wing refit: solid swept wings, a glazed cockpit, a nose-mounted gun and twin rear engines.');
b.plate('fuselage',[[0,2.7],[.5,.1],[.42,-1.8],[-.42,-1.8],[-.5,.1]],0,.42,original.color);
for(const side of [-1,1]){
  b.plate(`${side<0?'port':'starboard'} wing`,[[.3,1],[2.5,-1.3],[2.45,-1.8],[.3,-1.1]].map(([x,z])=>[x*side,z]),-.08,.16,metal);
  b.plate('wing stripe',[[1.25,-.1],[2.25,-1.28],[2.05,-1.35],[1.05,-.1]].map(([x,z])=>[x*side,z]),.01,.018,'#b5e9d0');
  b.thruster('rear engine',[side*.55,-.04,-1.45],1.3);
}
b.cockpit([0,.27,.3],1.3);
b.gun('frontal gun',[0,-.1,2.35],[0,0,1],.8);
export default b.model;
