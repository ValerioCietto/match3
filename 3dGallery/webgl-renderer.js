import { edgesOf, normalize } from './geometry.js';

const vertexSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform vec2 uAngles;
uniform vec2 uScale;
uniform float uDistance;
uniform float uPointSize;
varying vec3 vNormal;
varying vec3 vColor;
vec3 rotate(vec3 p) {
  float cy=cos(uAngles.x), sy=sin(uAngles.x);
  float cp=cos(uAngles.y), sp=sin(uAngles.y);
  vec3 r=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);
  return vec3(r.x,r.y*cp-r.z*sp,r.y*sp+r.z*cp);
}
void main() {
  vec3 p=rotate(aPosition);
  float depth=uDistance-p.z;
  // Perspective near/far planes: 0.05 / 30. Match the original framing.
  gl_Position=vec4(p.x*uScale.x,p.y*uScale.y+0.08*depth,
    (30.05/29.95)*depth-(3.0/29.95),depth);
  gl_PointSize=uPointSize;
  vNormal=rotate(aNormal);
  vColor=aColor;
}`;
const fragmentSource = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vColor;
uniform float uLit;
uniform float uOverride;
uniform vec3 uColor;
void main() {
  float light=1.0;
  if(uLit>0.5) light=0.4+0.6*abs(dot(normalize(vNormal),normalize(vec3(-0.3,0.7,0.64))));
  gl_FragColor=vec4(mix(vColor,uColor,uOverride)*light,1.0);
}`;

function rgb(hex) {return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function vertex(target, position, normal, color) {target.push(...position,...normal,...color);}

// All catalog faces are convex polygons. Duplicate triangle vertices for flat normals.
export function meshBuffers(model) {
  const positions=normalize(model), triangles=[], lines=[], points=[];
  model.faces.forEach((face,index)=>{
    const [a,b,c]=face.map(i=>positions[i]);
    const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
    const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length=Math.hypot(...normal)||1;
    const n=normal.map(value=>value/length),color=rgb(model.faceColors?.[index]||model.color);
    for(let i=1;i<face.length-1;i++)for(const id of [face[0],face[i],face[i+1]])vertex(triangles,positions[id],n,color);
  });
  for(const edge of edgesOf(model))for(const id of edge)vertex(lines,positions[id],[0,0,1],[1,1,1]);
  for(const position of positions)vertex(points,position,[0,0,1],[1,1,1]);
  return {triangles:new Float32Array(triangles),lines:new Float32Array(lines),points:new Float32Array(points)};
}

function gridBuffer() {
  const data=[],normal=[0,1,0];
  const line=(a,b,color)=>{vertex(data,a,normal,rgb(color));vertex(data,b,normal,rgb(color));};
  for(let i=-5;i<=5;i++) {
    line([i*.28,-1.1,-1.4],[i*.28,-1.1,1.4],'#354c49');
    line([-1.4,-1.1,i*.28],[1.4,-1.1,i*.28],'#354c49');
  }
  line([0,-1.099,0],[1.4,-1.099,0],'#946a66');
  line([0,-1.099,0],[0,-1.099,1.4],'#638f9b');
  return new Float32Array(data);
}

export class WebGLRenderer {
  constructor(canvas,{onError=()=>{},onRestore=()=>{}}={}) {
    this.canvas=canvas;
    this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false});
    if(!this.gl)throw new Error('WebGL is unavailable. Enable hardware acceleration or try another browser.');
    this.lost=false;
    this.initialize();
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();this.lost=true;onError('Graphics context lost. Waiting for WebGL to recover…');
    });
    canvas.addEventListener('webglcontextrestored',()=>{
      try {this.initialize();this.lost=false;if(this.model)this.setModel(this.model);onRestore();}
      catch(error){this.lost=true;onError(error.message);}
    });
  }
  initialize() {
    const gl=this.gl;
    const compile=(type,source)=>{
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(`WebGL shader failed: ${message}`);
      }
      return shader;
    };
    const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(`WebGL link failed: ${gl.getProgramInfoLog(program)}`);
    this.program=program;
    this.attributes=['aPosition','aNormal','aColor'].map(name=>gl.getAttribLocation(program,name));
    this.uniforms=Object.fromEntries(['uAngles','uScale','uDistance','uPointSize','uLit','uOverride','uColor'].map(name=>[name,gl.getUniformLocation(program,name)]));
    this.buffers=Object.fromEntries(['triangles','lines','points','grid'].map(name=>[name,{buffer:gl.createBuffer(),count:0}]));
    this.upload('grid',gridBuffer());
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearDepth(1);
    // Source meshes include mixed face winding and an open player hull.
    gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
  }
  upload(name,data) {
    const gl=this.gl,entry=this.buffers[name];
    gl.bindBuffer(gl.ARRAY_BUFFER,entry.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);entry.count=data.length/9;
  }
  setModel(model) {
    this.model=model;if(this.lost)return;
    for(const [name,data] of Object.entries(meshBuffers(model)))this.upload(name,data);
  }
  draw(name,mode,lit,color) {
    const gl=this.gl,entry=this.buffers[name],u=this.uniforms;
    gl.bindBuffer(gl.ARRAY_BUFFER,entry.buffer);
    this.attributes.forEach((location,i)=>{gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,36,i*12);});
    gl.uniform1f(u.uLit,lit?1:0);gl.uniform1f(u.uOverride,color?1:0);gl.uniform3fv(u.uColor,color||[1,1,1]);
    gl.drawArrays(mode,0,entry.count);
  }
  render({yaw,pitch,distance,width,height,wireframe,grid}) {
    if(this.lost||!this.model)return;
    const gl=this.gl,u=this.uniforms;
    gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform2f(u.uAngles,yaw,pitch);
    const focal=Math.min(width,height)*1.86;
    gl.uniform2f(u.uScale,focal/Math.max(width,1),focal/Math.max(height,1));
    gl.uniform1f(u.uDistance,distance);gl.uniform1f(u.uPointSize,Math.min(this.canvas.width/Math.max(width,1),2)*4);
    if(!wireframe){
      gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);
      this.draw('triangles',gl.TRIANGLES,true);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      this.draw('lines',gl.LINES,false,rgb('#819c9c'));
    } else {
      // Wireframe intentionally exposes all edges; solid mode uses occlusion.
      this.draw('lines',gl.LINES,false,rgb('#c6ee9c'));
      this.draw('points',gl.POINTS,false,rgb('#e2f5d0'));
    }
    if(grid)this.draw('grid',gl.LINES,false);
  }
}
