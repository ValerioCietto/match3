import * as THREE from './vendor/three/three.module.js';
import {SVGLoader} from './vendor/three/SVGLoader.js';
import {cockpitProfile} from './cockpit-revolution.js';
import {resolutionSettings} from './mesh-resolution.js';

// Reproduce the cabin section used by jared_3d_lama.html, without its hull offset.
export function exportCockpitShape(svg){
 const all=[];for(const path of new SVGLoader().parse(svg).paths){const fill=path.userData?.style?.fill||'';if(fill==='none')continue;for(const shape of SVGLoader.createShapes(path))all.push({shape,cabin:fill.includes('linearGradient661')});}
 const bounds=new THREE.Box2();for(const {shape} of all)for(const p of shape.getPoints(120))bounds.expandByPoint(p);
 const center=bounds.getCenter(new THREE.Vector2()),factor=100/Math.max(bounds.getSize(new THREE.Vector2()).x,1);
 const contours=all.filter(p=>p.cabin).map(({shape})=>new THREE.Shape(shape.getPoints(24).map(p=>new THREE.Vector2((p.x-center.x)*factor,-(p.y-center.y)*factor))).getPoints(80));
 if(!contours.length)throw Error('No cockpit silhouette found in SVG.');
 const {profile}=cockpitProfile(contours,resolutionSettings(1).cabinRows),centerY=(profile[0].y+profile.at(-1).y)/2;
 const geometry=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(p.radius,p.y)),resolutionSettings(1).radial);
 const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),vertices=[],normalSums=[],faces=[],lookup=new Map(),mapping=[];
 for(let i=0;i<p.count;i++){
   // SVG vertical axis becomes ship forward (-Z), with Y up. Millimetres -> metres.
   const point=[p.getX(i)*.001,p.getZ(i)*.001,-(p.getY(i)-centerY)*.001],key=point.map(v=>Number(v.toFixed(9))).join(',');
   let index=lookup.get(key);if(index===undefined){index=vertices.length;lookup.set(key,index);vertices.push(point);normalSums.push([0,0,0]);}mapping.push(index);
   const normal=[n.getX(i),n.getZ(i),-n.getY(i)];normal.forEach((v,j)=>normalSums[index][j]+=v);
 }
 for(let i=0;i<geometry.index.count;i+=3){const face=[0,1,2].map(j=>mapping[geometry.index.getX(i+j)]);if(new Set(face).size===3)faces.push(face);}
 const normals=normalSums.map(n=>{const length=Math.hypot(...n)||1;return n.map(v=>v/length);});geometry.dispose();
 const shape={version:1,name:'Jared cockpit',faction:'jared',type:'cockpit',resolution:1,source:'../jared1.svg',units:'meters',axes:{up:'+Y',forward:'-Z'},origin:'bounding-box center',color:'#63e7f2',vertices,faces,normals};
 const positions=new Float32Array(vertices.flat()),normalData=new Float32Array(normals.flat()),indices=new Uint16Array(faces.flat());
 const bytes=new Uint8Array(positions.byteLength+normalData.byteLength+indices.byteLength);bytes.set(new Uint8Array(positions.buffer));bytes.set(new Uint8Array(normalData.buffer),positions.byteLength);bytes.set(new Uint8Array(indices.buffer),positions.byteLength+normalData.byteLength);
 const bufferViews=[{buffer:0,byteOffset:0,byteLength:positions.byteLength,target:34962},{buffer:0,byteOffset:positions.byteLength,byteLength:normalData.byteLength,target:34962},{buffer:0,byteOffset:positions.byteLength+normalData.byteLength,byteLength:indices.byteLength,target:34963}];
 const color=new THREE.Color(shape.color);
 const gltf={asset:{version:'2.0',generator:'Starship builder cockpit shape exporter'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:shape.name,mesh:0}],meshes:[{name:shape.name,primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,material:0}]}],materials:[{name:'Cyan cockpit',pbrMetallicRoughness:{baseColorFactor:[color.r,color.g,color.b,1],metallicFactor:.2,roughnessFactor:.22}}],accessors:[{bufferView:0,componentType:5126,count:vertices.length,type:'VEC3',min:[0,1,2].map(a=>Math.min(...vertices.map(v=>v[a]))),max:[0,1,2].map(a=>Math.max(...vertices.map(v=>v[a])))},{bufferView:1,componentType:5126,count:normals.length,type:'VEC3'},{bufferView:2,componentType:5123,count:indices.length,type:'SCALAR'}],bufferViews,buffers:[{byteLength:bytes.length,uri:'data:application/octet-stream;base64,'+btoa(String.fromCharCode(...bytes))}]};
 return {shape,gltf};
}
