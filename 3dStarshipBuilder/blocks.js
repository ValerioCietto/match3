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
function prism(outline,height,color){
  const n=outline.length,vertices=[-height/2,height/2].flatMap(y=>outline.map(([x,z])=>[x,y,z]));
  const faces=[Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n)];
  for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);return solid(vertices,faces,color);
}
function reflect(m){m.vertices=m.vertices.map(([x,y,z])=>[-x,y,z]);m.faces.forEach(f=>f.reverse());return m;}
function facetedCabin(outline,height,inset,color){
  const n=outline.length,vertices=[...outline.map(([x,z])=>[x,-.08,z]),...outline.map(([x,z])=>[x*inset,height,z*inset])];
  const faces=[Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n)];
  for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);return solid(vertices,faces,color);
}
export function cockpitGeometry(profile,color){
  const frame='#445969',gold='#d6b66e';
  if(profile==='capsule')return join([move(sphere(.5,color),[0,.15,0],[.85,.65,1.7]),move(cylinder(.43,.12,12,frame),[0,-.12,0],[1,1,1.8])]);
  if(profile==='fighterCanopy'){
    // A closed elongated canopy seated through a tapered armored sill.
    const canopy=sphere(1,color);canopy.vertices=canopy.vertices.map(([x,y,z])=>[x*.34*(1-z*.18),y*.48+.08,z*.95]);
    return join([prism([[-.37,.8],[.37,.8],[.32,-.55],[0,-1.08],[-.32,-.55]],.16,frame),canopy,move(box(.025,.025,.85,frame),[0,.56,0])]);
  }
  if(profile==='almond'){
    const outline=[[0,-1.1],[.28,-.65],[.43,0],[.28,.65],[0,1.1],[-.28,.65],[-.43,0],[-.28,-.65]],vertices=outline.map(([x,z])=>[x,0,z]);vertices.push([0,.34,0],[0,-.14,0]);
    const faces=[];for(let i=0;i<8;i++)faces.push([i,(i+1)%8,8],[(i+1)%8,i,9]);return solid(vertices,faces,color);
  }
  if(profile==='industrialDiamond'){
    const outline=[[0,-.95],[.65,0],[0,.95],[-.65,0]];
    return join([prism(outline,.2,frame),facetedCabin(outline,.48,.35,color),move(box(.055,.055,.72,frame),[0,.5,0]),move(box(.5,.055,.055,frame),[0,.5,0])]);
  }
  if(profile==='luxuryDiamond'){
    const outline=[[0,-1.15],[.48,-.65],[.72,0],[.48,.65],[0,1.15],[-.48,.65],[-.72,0],[-.48,-.65]];
    return join([prism(outline,.12,gold),facetedCabin(outline,.5,.45,color),move(prism(outline,.04,gold),[0,.52,0],[.46,1,.46])]);
  }
  throw Error('Unknown cockpit profile: '+profile);
}
export function specialHullGeometry(profile,color){
  if(profile==='research')return join([
    move(sphere(.8,color),[0,0,0],[1,1,1.3]),
    ...[-1,1].flatMap(side=>[move(box(.65,.15,.15,'#637b8b'),[side*.8,0,0]),move(sphere(.65,color),[side*1.35,0,0])]),
    move(cylinder(.2,1.5,12,'#637b8b','z'),[0,0,-1.05]),move(sphere(.58,color),[0,0,-1.6]),move(sphere(.5,color),[0,0,1.3])]);
  if(profile==='swan'){
    const pieces=[move(sphere(.7,color),[0,0,.35],[.85,.7,1.65])];
    for(const [y,z,r] of [[.25,-.65,.3],[.55,-.9,.25],[.85,-.95,.23],[1.12,-1.1,.25],[1.2,-1.42,.32]])pieces.push(move(sphere(r,color),[0,y,z]));
    pieces.push(move(prism([[-.18,0],[.18,0],[0,-.65]],.15,'#d1a15a'),[0,1.18,-1.55]));
    for(const side of [-1,1]){
      let wing=prism([[.35,-.4],[1.25,-.8],[2.6,-.3],[2.8,.2],[1.7,1.25],[.4,.9]],.16,color);
      wing.vertices.forEach(v=>v[1]+=.12+v[0]*.18);if(side<0)wing=reflect(wing);pieces.push(wing);
      for(let i=0;i<4;i++){
        let feather=prism([[1.05+i*.32,.3],[1.32+i*.32,.3],[1.3+i*.32,1.55-i*.17]],.12,color);
        feather.vertices.forEach(v=>v[1]+=.12+v[0]*.18);if(side<0)feather=reflect(feather);pieces.push(feather);
      }
    }
    pieces.push(move(prism([[-.3,0],[.3,0],[0,.9]],.18,color),[0,0,1.2]));return join(pieces);
  }
  if(profile==='axe'){
    const pieces=[move(box(.2,.2,1.65,color),[0,0,.65]),move(cylinder(.4,.5,12,'#738795'),[0,0,-.4])];
    for(const side of [-1,1])for(let i=0;i<12;i++){
      const a=(-70+i*140/12)*Math.PI/180,b=(-70+(i+1)*140/12)*Math.PI/180;
      let blade=prism([[.15,-.4],[.15+2.2*Math.cos(a),-.4+2.2*Math.sin(a)],[.15+2.2*Math.cos(b),-.4+2.2*Math.sin(b)]],.25,color);
      if(side<0)blade=reflect(blade);pieces.push(blade);
    }
    return join(pieces);
  }
  throw Error('Unknown hull profile: '+profile);
}
export const thrusterLayouts={
  drone:{halfSize:[.4,.32,.45],exhausts:[[0,0]],radius:.23,length:.48},
  reverseDrone:{halfSize:[.4,.32,.45],exhausts:[[0,0]],radius:.23,length:.48,reverse:true},
  speeder:{halfSize:[.55,.3,1.3],exhausts:[[-.28,0],[.28,0]],radius:.2,length:.7},
  hauler:{halfSize:[.95,.85,.85],exhausts:[[0,.4],[-.44,-.35],[.44,-.35]],radius:.29,length:.65},
  carrier:{halfSize:[.95,.85,1.65],exhausts:[[-.43,-.37],[.43,-.37],[-.43,.37],[.43,.37]],radius:.29,length:.75}
};
export function thrusterGeometry(profile,color){
  const spec=thrusterLayouts[profile], [x,y,z]=spec.halfSize;
  const pieces=[box(x,y,z,color),move(box(x*1.04,y*1.04,.12,'#344756'),[0,0,z-.15])];
  for(const [ex,ey] of spec.exhausts){
    const cone=cylinder(spec.radius,spec.length,12,'#8297a6','z');
    // A flared conical bell; the narrow end is mounted inside the housing.
    for(const v of cone.vertices)if(v[2]<0){v[0]*=.6;v[1]*=.6;}
    pieces.push(move(cone,[ex,ey,z+spec.length/2-.06]));
    pieces.push(move(cylinder(spec.radius*.87,.025,12,'#182e3c','z'),[ex,ey,z+spec.length-.045]));
    pieces.push(move(cylinder(spec.radius*.58,.028,12,'#7ce9ec','z'),[ex,ey,z+spec.length-.025]));
  }
  const result=join(pieces);
  if(spec.reverse)result.vertices=result.vertices.map(([vx,vy,vz])=>[-vx,vy,-vz]);
  return result;
}
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
