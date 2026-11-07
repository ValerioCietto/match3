import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {preset,presetCatalog,validateProject} from './model.js';
test('each preset comes from its own importable JSON and loads independent parts',async()=>{
  const folder=new URL('./presets/',import.meta.url),files=await readdir(folder);
  assert.equal(files.filter(f=>f.endsWith('.json')).length,Object.keys(presetCatalog).length);
  const withoutIds=parts=>parts.map(({id,...p})=>p);
  for(const [id,meta] of Object.entries(presetCatalog)){
    const source=JSON.parse(await readFile(new URL(id+'.json',folder),'utf8')),loaded=preset(id);
    assert.equal(source.name,meta.name);assert.deepEqual(withoutIds(loaded),withoutIds(source.parts));assert.deepEqual(withoutIds(validateProject(source).parts),withoutIds(source.parts));
    if(loaded.length){assert.notEqual(loaded[0].id,preset(id)[0].id);loaded[0].position[0]=99;assert.deepEqual(withoutIds(preset(id)),withoutIds(source.parts));}
  }
});
