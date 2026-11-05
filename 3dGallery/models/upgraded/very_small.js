import original from '../very_small.js';
import {builder,metal} from './parts.js';
const b=builder(original,'Armored scout cube with a pointed forward prow and a compact rear thruster.');
b.hull([1.5,1.5,1.5]);
b.mesh('pointed prow',[[-.75,-.75,.75],[.75,-.75,.75],[.75,.75,.75],[-.75,.75,.75],[0,0,1.65]],[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[3,2,1,0]],['#b34e51','#d47968',original.color,'#ad6264',metal]);
for(const side of [-1,1])b.plate('armor rail',[[side*.57,.68],[side*.78,.68],[side*.78,-.68],[side*.57,-.68]],.78,.08,metal);
b.thruster('small rear thruster',[0,0,-.75],1);
export default b.model;
