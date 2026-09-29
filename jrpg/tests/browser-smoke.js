// Dependency-free Chromium smoke check. Set CHROME_PATH if Chrome is elsewhere.
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),tempRoot=path.resolve(os.tmpdir()),profile=fs.mkdtempSync(path.join(tempRoot,'silux-browser-'));
const browserPath=process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser,ws,server,seq=0;const pending=new Map(),errors=[];
async function until(fn,description,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await pause(80);}throw Error('Timed out: '+description);}
function command(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},10000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+': '+JSON.stringify(r.exceptionDetails.exception));return r.result.value;}
(async()=>{
 try{
  server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path.relative(root,file).startsWith('..')){res.writeHead(403);res.end();return;}try{const body=fs.readFileSync(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  browser=spawn(browserPath,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
  browser.on('error',e=>errors.push(e.message));
  await until(()=>fs.existsSync(path.join(profile,'DevToolsActivePort')),'browser startup');
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const request=pending.get(data.id);pending.delete(data.id);if(data.error)request?.reject(Error(data.error.message));else request?.resolve(data.result);}else if(data.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(data.params.exceptionDetails));};
  await command('Page.enable');await command('Runtime.enable');console.log('Headless browser connected.');
  async function navigate(file){await command('Page.navigate',{url:`${base}/${file}`});await until(()=>evaluate(`document.readyState==='complete' && location.href===${JSON.stringify(base+'/'+file)}`),'navigation');}
  await navigate('index.html');console.log('Title loaded.');await evaluate(`document.getElementById('new-game').click();document.getElementById('enter-world').click()`);
  await until(()=>evaluate(`location.pathname.endsWith('/world.html')&&document.querySelectorAll('.battle').length===3`),'title to map');
  assert.equal(await evaluate(`document.querySelectorAll('.battle:not(:disabled)').length`),1);
  const catalogue=JSON.parse(fs.readFileSync(path.join(root,'battles.json'),'utf8'));
  const mapSave=await evaluate(`localStorage.getItem('silux.journey.v1')`);
  await evaluate(`document.querySelector('a[href="bestiary.html"]').click()`);
  await until(()=>evaluate(`document.querySelectorAll('.monster').length>0`),'world map to bestiary');
  assert.equal(await evaluate(`document.querySelectorAll('.monster').length`),Object.keys(catalogue.enemies).length);
  await evaluate(`document.getElementById('type').value='boss';document.getElementById('type').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.querySelectorAll('.monster').length`),Object.values(catalogue.enemies).filter(e=>e.boss).length);
  await evaluate(`document.getElementById('type').value='';document.getElementById('region').value='sewers';document.getElementById('region').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.querySelectorAll('.monster').length`),new Set(catalogue.battles.filter(b=>b.region==='sewers').flatMap(b=>b.enemies)).size);
  await evaluate(`document.getElementById('search').value='Rat King';document.getElementById('search').dispatchEvent(new Event('input'))`);
  assert(await evaluate(`document.querySelector('[data-enemy="rat-king"]').textContent.includes('HP')`));
  await evaluate(`document.getElementById('search').value='no-such-monster';document.getElementById('search').dispatchEvent(new Event('input'))`);
  assert.equal(await evaluate(`document.querySelectorAll('.monster').length`),0);
  await evaluate(`document.getElementById('search').value='';document.getElementById('search').dispatchEvent(new Event('input'))`);
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'bestiary mobile horizontal overflow');
  assert.equal(await evaluate(`localStorage.getItem('silux.journey.v1')`),mapSave,'bestiary preserves saved progress');
  await evaluate(`document.querySelector('a[href="world.html"]').click()`);
  await until(()=>evaluate(`location.pathname.endsWith('/world.html')&&document.querySelector('.battle')!==null`),'bestiary to world map');
  await command('Emulation.clearDeviceMetricsOverride');
  await evaluate(`document.querySelector('.battle').click()`);await until(()=>evaluate(`location.pathname.endsWith('/combat.html')&&typeof battle!=='undefined'&&battle!==null`),'map to battle');
  assert.equal(await evaluate(`battle.actor().id`),'silux');assert.equal(await evaluate(`document.querySelectorAll('#enemies .unit').length`),2);
  const before=await evaluate(`localStorage.getItem('silux.journey.v1')`);
  await evaluate(`document.querySelector('[data-command="attack"]').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('#enemies .damage-preview').length`),2);
  assert.match(await evaluate(`document.querySelector('#enemies .damage-preview').textContent`),/damage.*90% hit chance/);
  await evaluate(`document.getElementById('cancel').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('.damage-preview').length`),0);
  await evaluate(`document.querySelector('[data-command="skill"]').click();[...document.querySelectorAll('#choices button')].find(b=>b.textContent.includes('Heart-piercer')).click()`);
  assert.match(await evaluate(`document.querySelector('#enemies .target').textContent`),/80% of hits/);
  await evaluate(`document.getElementById('cancel').click()`);
  await evaluate(`document.querySelector('[data-command="dodge"]').click()`);
  await until(()=>evaluate(`battle.actor()?.side==='ally'`),'next ally action');
  await evaluate(`document.querySelector('[data-command="item"]').click();document.querySelector('#choices button').click()`);
  await evaluate(`document.getElementById('save-scum').click()`);
  await until(()=>evaluate(`location.pathname.endsWith('/world.html')&&document.querySelector('.battle')!==null`),'save scum map');
  assert.equal(await evaluate(`localStorage.getItem('silux.journey.v1')`),before,'SAVE SCUM must preserve exact saved state');
  await evaluate(`document.querySelector('.battle').click()`);await until(()=>evaluate(`location.pathname.endsWith('/combat.html')&&typeof battle!=='undefined'&&battle!==null`),'second battle entry');
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'mobile horizontal overflow');
  const screenshot=await command('Page.captureScreenshot',{format:'png'});const shot=path.join(tempRoot,'silux-combat-mobile.png');fs.writeFileSync(shot,Buffer.from(screenshot.data,'base64'));console.log('Screenshot: '+shot);
  await evaluate(`Math.random=()=>0; battle.random=()=>0`);
  let actions=0;while(!await evaluate(`Boolean(battle.outcome)`)&&actions++<12){await until(()=>evaluate(`Boolean(battle.outcome)||battle.actor()?.side==='ally'`),'player turn');if(await evaluate(`Boolean(battle.outcome)`))break;await evaluate(`document.querySelector('[data-command="attack"]').click();document.querySelector('#enemies .target')?.click()`);}
  await until(()=>evaluate(`document.getElementById('result').open`),'victory dialog');assert.equal(await evaluate(`battle.outcome`),'victory');assert(await evaluate(`JSON.parse(localStorage.getItem('silux.journey.v1')).completed.includes('sewers-1')`));
  await evaluate(`document.getElementById('result-action').click()`);await until(()=>evaluate(`location.pathname.endsWith('/world.html')&&document.querySelectorAll('.battle').length===3`),'victory to map');
  assert.equal(await evaluate(`document.querySelectorAll('.battle:not(:disabled)').length`),2);
  await navigate('combat.html?battle=final-1');await until(()=>evaluate(`!document.getElementById('error').hidden`),'locked route guard');assert.match(await evaluate(`document.getElementById('error-copy').textContent`),/locked/);
  assert.deepEqual(errors,[]);console.log('Browser checks passed: title → map → combat, mobile layout, SAVE SCUM rollback, victory save, next battle unlock, locked URLs, no runtime errors.');
 }finally{
  if(ws?.readyState===WebSocket.OPEN){try{await command('Browser.close');}catch{}ws.close();}
  if(browser&&!browser.killed)browser.kill();if(server)server.close();
  await pause(600);
  const relative=path.relative(tempRoot,path.resolve(profile));if(relative.startsWith('silux-browser-')&&!relative.includes(path.sep))try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});}catch{}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
