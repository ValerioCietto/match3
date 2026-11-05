// Shared mesh construction. Ships face +Z; thrusters exhaust toward -Z.
export const metal = '#718b9a', dark = '#253746', glass = '#71d9e8', glow = '#ffba70';
export const add = (a,b) => a.map((v,i)=>v+b[i]);
export const mul = (a,s) => a.map(v=>v*s);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit = v => mul(v,1/(Math.hypot(...v)||1));
export function builder(original, description) {
  const model = {id:original.id, name:`${original.name} · Upgraded`, category:original.category,
    description, color:original.color, vertices:[], faces:[], faceColors:[], parts:[]};
  function mesh(name, vertices, faces, color=original.color) {
    const offset=model.vertices.length;
    model.parts.push({name, firstFace:model.faces.length, faceCount:faces.length});
    model.vertices.push(...vertices);
    model.faces.push(...faces.map(face=>face.map(i=>i+offset)));
    model.faceColors.push(...faces.map((_,i)=>Array.isArray(color)?color[i]:color));
  }
  function hull(scale=[1,1,1]) {mesh('hull',original.vertices.map(v=>v.map((n,i)=>n*scale[i])),original.faces);}
  // Closed extrusion of an X/Z outline, with thickness along Y.
  function plate(name, outline, y, thickness, color) {
    const count=outline.length;
    const vertices=[-1,1].flatMap(sign=>outline.map(([x,z])=>[x,y+sign*thickness/2,z]));
    const faces=[Array.from({length:count},(_,i)=>count-1-i),Array.from({length:count},(_,i)=>i+count)];
    for(let i=0;i<count;i++)faces.push([i,(i+1)%count,(i+1)%count+count,i+count]);
    mesh(name,vertices,faces,color);
  }
  // A capped tapered barrel or canopy, oriented along any outward axis.
  function tube(name, origin, axis, length, radius, tipRadius=radius, color=metal, sides=8) {
    const n=unit(axis),u=unit(cross(n,Math.abs(n[1])<.9?[0,1,0]:[1,0,0])),v=cross(n,u);
    const ring=(r,d)=>Array.from({length:sides},(_,i)=>add(add(origin,mul(n,d)),add(mul(u,r*Math.cos(i*2*Math.PI/sides)),mul(v,r*Math.sin(i*2*Math.PI/sides)))));
    const vertices=ring(radius,0),faces=[Array.from({length:sides},(_,i)=>sides-1-i)];
    if(tipRadius===0){vertices.push(add(origin,mul(n,length)));for(let i=0;i<sides;i++)faces.push([i,(i+1)%sides,sides]);}
    else {vertices.push(...ring(tipRadius,length));faces.push(Array.from({length:sides},(_,i)=>sides+i));for(let i=0;i<sides;i++)faces.push([i,(i+1)%sides,(i+1)%sides+sides,i+sides]);}
    mesh(name,vertices,faces,color);
  }
  function gun(name,origin,axis=[0,0,1],size=1) {
    tube(`${name} mount`,origin,axis,.22*size,.18*size,.14*size,dark);
    tube(`${name} barrel`,add(origin,mul(axis,.17*size)),axis,.65*size,.095*size,.095*size,metal);
    tube(`${name} muzzle`,add(origin,mul(axis,.78*size)),axis,.1*size,.13*size,.13*size,dark);
    tube(`${name} bore`,add(origin,mul(axis,.885*size)),axis,.006*size,.075*size,.075*size,'#080e15');
  }
  function thruster(name,origin,size=1) {
    tube(`${name} housing`,origin,[0,0,-1],.32*size,.18*size,.25*size,metal);
    tube(`${name} nozzle`,add(origin,[0,0,-.32*size]),[0,0,-1],.06*size,.21*size,.21*size,dark);
    tube(`${name} core`,add(origin,[0,0,-.385*size]),[0,0,-1],.015*size,.14*size,.14*size,glow);
  }
  function cockpit(origin,size=1) {
    plate('cockpit frame',[[-.32*size,.45*size],[0,.8*size],[.32*size,.45*size],[.28*size,-.55*size],[-.28*size,-.55*size]].map(([x,z])=>[x+origin[0],z+origin[2]]),origin[1],.15*size,dark);
    mesh('cockpit canopy',[
      [-.27,0,-.5],[.27,0,-.5],[.29,0,.4],[0,0,.73],[-.29,0,.4],[-.14,.32,-.25],[.14,.32,-.25],[0,.22,.38]
    ].map(v=>add(origin,mul(v,size))),[[0,1,6,5],[1,2,7,6],[2,3,7],[3,4,7],[4,0,5,7],[5,6,7],[0,4,3,2,1]],glass);
  }
  return {model,mesh,hull,plate,tube,gun,thruster,cockpit};
}
