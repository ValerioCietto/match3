import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { catalog, upgrades } from './catalog.js';
import { edgesOf, normalize, rotate } from './geometry.js';
import { WebGLRenderer } from './webgl-renderer.js';
import { mockGL } from './webgl-test-helper.mjs';

test('viewer renders every model and supports search, orbit, zoom, presets and toggles',async()=>{
  let frame;
  const context=mockGL();
  class Element {
    constructor(){this.children=[];this.events={};this.attributes={};this.value='';this.checked=false;this.style={setProperty(){}};}
    append(...children){this.children.push(...children);}
    replaceChildren(){this.children=[];}
    setAttribute(key,value){this.attributes[key]=value;}
    addEventListener(key,handler){this.events[key]=handler;}
    getContext(){return context;}
    getBoundingClientRect(){return {width:900,height:550};}
    setPointerCapture(){}
    focus(){}
  }
  const elements=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const buttons=['perspective','front','side','top'].map(view=>Object.assign(new Element(),{dataset:{view}}));
  const sandbox=vm.createContext({
    catalog,upgrades,edgesOf,normalize,rotate,WebGLRenderer,Math,Map,String,devicePixelRatio:2,
    document:{getElementById:get,querySelectorAll:()=>buttons,createElement:()=>new Element(),hidden:false},
    history:{replaceState(){}},location:{hash:'#big_boss'},addEventListener(){},
    ResizeObserver:class {constructor(callback){this.callback=callback;}observe(){this.callback();}},
    requestAnimationFrame:callback=>{frame=callback;}
  });
  const source=(await readFile(new URL('./viewer.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
  vm.runInContext(source,sandbox);frame(16);
  assert.equal(get('name').textContent,'Silver D20');assert.equal(get('catalog').children.length,7);assert.ok(context.calls.some(([name])=>name==='drawArrays'));
  assert.equal(get('renderError').textContent,undefined);
  for(let i=0;i<catalog.length;i++){get('catalog').children[i].onclick();frame(32+i*16);assert.equal(get('name').textContent,catalog[i].name);}
  get('search').value='stealth';get('search').events.input();assert.equal(get('catalog').children.length,1);
  get('search').value='no such model';get('search').events.input();assert.equal(get('empty').hidden,false);
  get('search').value='';get('search').events.input();
  buttons[2].onclick();assert.equal(vm.runInContext('yaw',sandbox),Math.PI/2);
  for(let i=0;i<catalog.length;i++){
    get('catalog').children[i].onclick();buttons[2].onclick();
    get('upgraded').checked=true;get('upgraded').onchange();frame(150+i);
    assert.equal(get('name').textContent,upgrades[catalog[i].id].name);
    assert.equal(get('faces').textContent,upgrades[catalog[i].id].faces.length);
    assert.equal(get('source').href,`models/upgraded/${catalog[i].id}.js`);
    assert.equal(vm.runInContext('yaw',sandbox),Math.PI/2);
    assert.equal(get('catalog').children[i].attributes['aria-pressed'],'true');
    get('upgraded').checked=false;get('upgraded').onchange();frame(160+i);
    assert.equal(get('name').textContent,catalog[i].name);
  }
  get('upgraded').checked=true;get('upgraded').onchange();
  get('catalog').children[0].onclick();get('catalog').children[6].onclick();
  assert.equal(get('upgraded').checked,true);
  const initial=vm.runInContext('distance',sandbox);get('zoomIn').onclick();assert.ok(vm.runInContext('distance',sandbox)<initial);
  const event={preventDefault(){},pointerId:1,clientX:0,clientY:0};
  get('scene').events.pointerdown(event);get('scene').events.pointermove({...event,clientX:30});
  assert.notEqual(vm.runInContext('yaw',sandbox),Math.PI/2);get('scene').events.pointerup(event);
  get('scene').events.keydown({...event,key:'0'});assert.equal(vm.runInContext('distance',sandbox),4.2);
  get('wireframe').checked=true;get('wireframe').onchange();frame(200);
  get('rotate').checked=true;const yaw=vm.runInContext('yaw',sandbox);frame(216);assert.ok(vm.runInContext('yaw',sandbox)>yaw);
  get('reset').onclick();assert.equal(get('rotate').checked,false);
  get('grid').checked=true;get('grid').onchange();
  for(let i=0;i<100;i++)get('zoomIn').onclick();
  frame(232);assert.equal(vm.runInContext('distance',sandbox),2.3);
});
