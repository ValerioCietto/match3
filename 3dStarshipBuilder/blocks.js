// Composite parts use convex faces, including separate wall segments around openings.
function solid(vertices,faces,color){
  const center=[0,1,2].map(a=>vertices.reduce((s,v)=>s+v[a],0)/vertices.length);
  for(const f of faces){const [a,b,c]=f.map(i=>vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(n.reduce((s,v,i)=>s+v*(a[i]-center[i]),0)<0)f.reverse();}
  return {vertices,faces,faceColors:faces.map(()=>color)};
}
function join(items){const out={vertices:[],faces:[],faceColors:[]};for(const item of items){const offset=out.vertices.length;out.vertices.push(...item.vertices);out.faces.push(...item.faces.map(f=>f.map(i=>i+offset)));out.faceColors.push(...item.faceColors);}return out;}
function move(m,center,scale=[1,1,1]){m.vertices=m.vertices.map(v=>v.map((n,i)=>n*scale[i]+center[i]));return m;}
function cylinder(radius,height,sides,color,axis='y'){
  const vertices=[-height/2,height/2].flatMap(y=>Array.from({length:sides},(_,i)=>[radius*Math.cos(i*2*Math.PI/sides),y,radius*Math.sin(i*2*Math.PI/sides)]));
  if(axis==='z')for(const v of vertices)[v[1],v[2]]=[v[2],v[1]];
  const faces=[Array.from({length:sides},(_,i)=>i),Array.from({length:sides},(_,i)=>i+sides)];for(let i=0;i<sides;i++){const j=(i+1)%sides;faces.push([i,j,j+sides,i+sides]);}return solid(vertices,faces,color);
}
function sphere(radius,color){
  const sides=12,rings=6,vertices=[[0,radius,0]],faces=[];
  for(let j=1;j<rings;j++)for(let i=0;i<sides;i++){const a=j*Math.PI/rings,b=i*2*Math.PI/sides;vertices.push([radius*Math.sin(a)*Math.cos(b),radius*Math.cos(a),radius*Math.sin(a)*Math.sin(b)]);}
  const bottom=vertices.length;vertices.push([0,-radius,0]);
  for(let i=0;i<sides;i++){const next=(i+1)%sides;faces.push([0,1+i,1+next],[bottom,1+(rings-2)*sides+next,1+(rings-2)*sides+i]);}
  for(let j=0;j<rings-2;j++)for(let i=0;i<sides;i++){const a=1+j*sides+i,b=1+j*sides+(i+1)%sides;faces.push([a,b,b+sides,a+sides]);}
  return solid(vertices,faces,color);
}
function box(x,y,z,color){return solid([[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],[[0,1,2,3],[4,5,6,7],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]],color);}
export function blockGeometry(type,color){
  const dark='#344756',metal='#b7c8d2',glass='#73e3ed';
  if(type==='turret')return join([cylinder(.65,.22,8,color),move(cylinder(.42,.16,12,dark),[0,.15,0]),move(sphere(.44,color),[0,.48,0]),move(cylinder(.12,1.15,12,metal,'z'),[0,.5,-.75]),move(cylinder(.16,.16,12,dark,'z'),[0,.5,-1.3])]);
  if(type==='fighterBay'){
    const walls=[];
    for(let i=0;i<6;i++){const a=i*Math.PI/3,b=(i+1)*Math.PI/3;const vertices=[-.8,.8].flatMap(z=>[[Math.cos(a),Math.sin(a),z],[Math.cos(b),Math.sin(b),z],[.75*Math.cos(b),.75*Math.sin(b),z],[.75*Math.cos(a),.75*Math.sin(a),z]]);const m=solid(vertices,[[0,1,2,3],[4,5,6,7],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]],color);m.faceColors[4]=dark;walls.push(m);}
    return join(walls);
  }
  if(type==='fuelPod')return join([cylinder(.42,1.45,16,color,'z'),move(sphere(.42,color),[0,0,-.725]),move(sphere(.42,color),[0,0,.725]),...[-.5,.5].map(z=>move(cylinder(.455,.14,16,dark,'z'),[0,0,z])),move(cylinder(.15,.25,8,metal,'z'),[0,0,-1.19]),move(box(.16,.09,.22,dark),[0,.45,-.72])]);
  if(type==='shieldGenerator')return join([cylinder(.85,.25,20,color),move(cylinder(.69,.07,20,dark),[0,.16,0]),move(cylinder(.56,.09,20,glass),[0,.23,0]),move(sphere(.22,color),[0,.27,0])]);
  if(type==='passengerModule')return join([box(.65,.48,1.25,color),...[-1,1].flatMap(side=>[-.8,0,.8].flatMap(z=>[move(sphere(.23,dark),[side*.64,0,z],[.5,1,1]),move(sphere(.18,glass),[side*.72,0,z],[.5,1,1])]))]);
  throw Error('Unknown composite block: '+type);
}
