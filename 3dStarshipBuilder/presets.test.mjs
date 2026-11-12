import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {preset,presetCatalog,validateProject} from './model.js';
import {catalogForFaction} from './presets.js';
test('each preset comes from its own importable JSON and loads independent parts',async()=>{
  const root=new URL('./presets/',import.meta.url);
  assert.deepEqual((await readdir(root)).sort(),['human','jared','technician']);
  const withoutIds=parts=>parts.map(({id,...p})=>p);
  for(const faction of ['human','jared','technician'])for(const [id,meta] of Object.entries(catalogForFaction(faction))){
    const folder=new URL((id==='empty'?'human':faction)+'/',root);
    const source=JSON.parse(await readFile(new URL(id+'.json',folder),'utf8')),loaded=preset(id);
    assert.equal(source.name,meta.name);assert.deepEqual(withoutIds(loaded),withoutIds(source.parts));assert.deepEqual(withoutIds(validateProject({...source,parts:loaded}).parts),withoutIds(validateProject(source).parts));
    if(loaded.length){assert.notEqual(loaded[0].id,preset(id)[0].id);loaded[0].position[0]=99;assert.deepEqual(withoutIds(preset(id)),withoutIds(source.parts));}
  }
});
