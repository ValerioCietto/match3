import { catalog, upgrades } from './catalog.js';
import { edgesOf } from './geometry.js';
import { WebGLRenderer } from './webgl-renderer.js';

const $ = id => document.getElementById(id);
const canvas = $('scene');
let renderer;
function rendererError(message) { $('renderError').hidden=false; $('renderError').textContent=message; }
try {
  renderer=new WebGLRenderer(canvas,{onError:rendererError,onRestore:()=>{ $('renderError').hidden=true; dirty=true; }});
} catch(error) { rendererError(error.message); }
let model, edges, yaw = -.55, pitch = .35, distance = 4.2;
let selected;
const upgradedModels = new Set();
let width = 1, height = 1, dirty = true, last = 0;
const pointers = new Map();
const presets = { perspective: [-.55,.35], front: [0,0], side: [Math.PI/2,0], top: [0,Math.PI/2] };

function setView(name) {
  [yaw,pitch] = presets[name]; distance = 4.2;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
  dirty = true;
}
function freeView() {
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed','false'));
  dirty = true;
}
function select(base, resetCamera = true) {
  selected = base;
  const upgraded = upgradedModels.has(base.id);
  const item = upgraded ? upgrades[base.id] : base;
  model = item; edges = edgesOf(item); renderer?.setModel(item);
  $('upgraded').checked = upgraded;
  $('variant').textContent = upgraded ? 'Upgraded' : 'Original';
  $('name').textContent = item.name;
  $('description').textContent = item.description;
  $('category').textContent = `${item.category.toUpperCase()} / ${item.id.toUpperCase().replaceAll('_',' ')}`;
  $('vertices').textContent = item.vertices.length;
  $('faces').textContent = item.faces.length;
  $('edges').textContent = edges.length;
  $('modelNumber').textContent = `MODEL ${String(catalog.indexOf(base)+1).padStart(2,'0')} / ${String(catalog.length).padStart(2,'0')}`;
  $('source').href = `models/${upgraded ? 'upgraded/' : ''}${item.id}.js`;
  canvas.setAttribute('aria-label', `${item.name}, 3D model. Drag or use arrow keys to orbit; scroll or use plus and minus to zoom.`);
  history.replaceState(null, '', `#${item.id}${upgraded ? '/upgraded' : ''}`);
  if (resetCamera) setView('perspective');
  dirty = true; renderCatalog();
}
function renderCatalog() {
  const query = $('search').value.trim().toLowerCase();
  const matches = catalog.filter(item => `${item.name} ${item.id} ${item.category}`.toLowerCase().includes(query));
  $('catalog').replaceChildren();
  $('count').textContent = `${matches.length} / ${catalog.length}`;
  $('empty').hidden = matches.length > 0;
  for (const item of matches) {
    const button = document.createElement('button'); button.className = 'model';
    button.setAttribute('aria-pressed', String(item === selected));
    const icon = document.createElement('span'); icon.className = 'model-icon'; icon.textContent = item.category === 'Ships' ? '➤' : '◇';
    icon.style.setProperty('--swatch', item.id === 'stealth' ? '#71829e' : item.color);
    const label = document.createElement('span'), title = document.createElement('strong'), detail = document.createElement('small');
    title.textContent = item.name; detail.textContent = `${item.category} · ${item.faces.length} faces`;
    label.append(title, detail);
    const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '↗';
    button.append(icon, label, arrow); button.onclick = () => select(item); $('catalog').append(button);
  }
}
function render() {
  renderer?.render({yaw,pitch,distance,width,height,wireframe:$('wireframe').checked,grid:$('grid').checked});
}
function zoom(factor) {distance=Math.max(2.3,Math.min(10,distance*factor));dirty=true;}
canvas.addEventListener('wheel',event=>{event.preventDefault();zoom(Math.exp(Math.max(-100,Math.min(100,event.deltaY))*.002));},{passive:false});
canvas.addEventListener('pointerdown',event=>{canvas.focus();canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,[event.clientX,event.clientY]);});
canvas.addEventListener('pointermove',event=>{
  const previous=pointers.get(event.pointerId);if(!previous)return;
  const next=[event.clientX,event.clientY];
  if(pointers.size===2) {
    const other=[...pointers.entries()].find(([id])=>id!==event.pointerId)[1];
    const before=Math.hypot(previous[0]-other[0],previous[1]-other[1]);
    const after=Math.hypot(next[0]-other[0],next[1]-other[1]);
    if(before>0&&after>0)zoom(before/after);
  } else {yaw+=(next[0]-previous[0])*.008;pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch+(next[1]-previous[1])*.008));freeView();}
  pointers.set(event.pointerId,next);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>pointers.delete(e.pointerId));
canvas.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'].includes(event.key))return;
  event.preventDefault();
  if(event.key==='0')setView('perspective');
  else if(event.key==='+'||event.key==='=')zoom(.9);
  else if(event.key==='-')zoom(1.1);
  else {yaw+=event.key==='ArrowLeft'?-.12:event.key==='ArrowRight'?.12:0;pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch+(event.key==='ArrowUp'?-.12:event.key==='ArrowDown'?.12:0)));freeView();}
});
$('search').addEventListener('input',renderCatalog);
$('upgraded').onchange=()=>{
  if($('upgraded').checked)upgradedModels.add(selected.id);else upgradedModels.delete(selected.id);
  select(selected,false);
};
$('zoomIn').onclick=()=>zoom(.85);$('zoomOut').onclick=()=>zoom(1/.85);
$('reset').onclick=()=>{$('rotate').checked=false;setView('perspective');};
for(const id of ['rotate','wireframe','grid'])$(id).onchange=()=>{dirty=true;};
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{$('rotate').checked=false;setView(button.dataset.view);});
new ResizeObserver(()=>{
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);dirty=true;
}).observe(canvas);
function fromHash(){
  const [id,variant]=location.hash.slice(1).split('/');
  const item=catalog.find(item=>item.id===id)||catalog[0];
  if(variant==='upgraded')upgradedModels.add(item.id);else upgradedModels.delete(item.id);
  select(item);
}
addEventListener('hashchange',fromHash);fromHash();
function frame(now) {
  if($('rotate').checked&&!pointers.size&&!document.hidden){yaw+=Math.min((now-last)/1000,.05)*.4;freeView();}
  last=now;if(dirty){render();dirty=false;}requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
