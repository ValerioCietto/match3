import original from '../boss.js';
import {builder} from './parts.js';
const b=builder(original,'Dodecahedron siege refit with an oversized frontal cannon and a bank of four rear thrusters.');
b.hull([3,3,3]);
b.tube('siege mounting collar',[0,0,1],[0,0,1],.35,.67,.55,'#546979',10);
b.gun('heavy siege gun',[0,0,1.3],[0,0,1],2.6);
for(const [x,y] of [[-.55,-.55],[.55,-.55],[-.55,.55],[.55,.55]])b.thruster('rear drive',[x,y,-1.05],1.25);
export default b.model;
