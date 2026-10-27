// Optional real-browser smoke test. Set CHROME_PATH if Chrome is installed elsewhere.
// Run: node planetDestroyer/browser-smoke.cjs
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'planet-destroyer-browser-'));
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');
  if(!['game.html','game.js','weapons.json'].includes(name)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',name.endsWith('.html')?'text/html':name.endsWith('.js')?'text/javascript':'application/json');
  res.end(fs.readFileSync(path.join(__dirname,name)));
});
let browser,ws;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/game.html`;
  const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1440,1000','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  const debug=await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(Error('Browser startup timeout')),20000);
    browser.on('error',error=>{clearTimeout(timer);reject(error);});
    browser.stderr.on('data',chunk=>{output+=chunk;const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  });
  const pages=await (await fetch(`http://${new URL(debug).host}/json/list`)).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Browser WebSocket timeout')),10000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Browser WebSocket failed'));},{once:true});});
  let sequence=0;const pending=new Map(),errors=[];
  ws.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error(`Browser command timeout: ${method}`));},10000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
  const until=async expression=>{for(let n=0;n<100;n++){if(await evaluate(expression))return;await sleep(100);}throw Error(`Timed out: ${expression}`);};
  console.log('Browser connected; loading demo.');
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url});
  await until("!!document.getElementById('startBtn') && !document.getElementById('startBtn').disabled");
  await evaluate("document.getElementById('startBtn').click()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await sleep(2200);
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  assert.notEqual(await evaluate("document.getElementById('remaining').textContent"),'1,000 blocks');
  await evaluate("document.getElementById('pauseBtn').click()");
  const damaged=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1')).hp.filter(x=>x>0).length");
  assert.ok(damaged<1000);
  // Fund QA purchases without adding a cheat path to the game itself.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:"{const s=JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'));if(s){s.credits=10000;localStorage.setItem('planetDestroyer.demo.v1',JSON.stringify(s));}}"});
  await evaluate('window.__beforeReload=true');
  await send('Page.reload');await until("!window.__beforeReload && !!document.getElementById('startBtn') && !document.getElementById('startBtn').disabled");
  assert.equal(await evaluate("parseInt(document.getElementById('remaining').textContent.replaceAll(',',''))"),damaged);
  await evaluate("document.getElementById('startBtn').click();document.getElementById('shopBtn').click()");
  for(const id of ['shotgun','chain_lightning','orbiting_buzzsaw','mortar','yoyo','boomerang','railgun','guided_missiles','guided_laser','piercing_nuke','mining_drones','plague','shockwave'])await evaluate(`document.querySelector('[data-buy="${id}"]').click()`);
  await evaluate("document.querySelector('[data-slot=\"1\"]').click();document.querySelector('[data-equip=\"chain_lightning\"]').click();document.querySelector('[data-slot=\"2\"]').click();document.querySelector('[data-equip=\"mortar\"]').click();document.querySelector('[data-upgrade=\"mortar\"]').click()");
  const saved=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");
  assert.equal(Object.keys(saved.owned).length,14);assert.equal(saved.slots.filter(Boolean).length,3);assert.equal(saved.owned.mortar,2);
  await evaluate("document.querySelector('[data-equip=\"guided_missiles\"]').click();document.querySelector('[data-upgrade=\"guided_missiles\"]').click()");
  const missileSave=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");assert.equal(missileSave.slots[2],'guided_missiles');assert.equal(missileSave.owned.guided_missiles,2);
  await evaluate("document.querySelector('[data-slot=\"1\"]').click();document.querySelector('[data-equip=\"guided_laser\"]').click()");
  for(let level=2;level<=5;level++)await evaluate("document.querySelector('[data-upgrade=\"guided_laser\"]').click()");
  const laserSave=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");assert.equal(laserSave.slots[1],'guided_laser');assert.equal(laserSave.owned.guided_laser,5);
  assert.ok(await evaluate("document.querySelector('[data-equip=\"guided_laser\"]').closest('article').textContent.includes('5 rays on different blocks')"));
  await evaluate("document.querySelector('[data-slot=\"0\"]').click();document.querySelector('[data-equip=\"piercing_nuke\"]').click();document.querySelector('[data-upgrade=\"piercing_nuke\"]').click()");
  const nukeSave=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");assert.equal(nukeSave.slots[0],'piercing_nuke');assert.equal(nukeSave.owned.piercing_nuke,2);
  assert.ok(await evaluate("document.querySelector('[data-equip=\"piercing_nuke\"]').closest('article').textContent.includes('10 blocks drilled · 8-block blast radius')"));
  await evaluate("document.querySelector('[data-slot=\"2\"]').click();document.querySelector('[data-equip=\"mining_drones\"]').click()");
  for(let level=2;level<=5;level++)await evaluate("document.querySelector('[data-upgrade=\"mining_drones\"]').click()");
  const droneDefinition=JSON.parse(fs.readFileSync(path.join(__dirname,'weapons.json'),'utf8')).weapons.find(w=>w.id==='mining_drones');
  const droneStats={...droneDefinition.baseStats};for(const u of droneDefinition.upgrades){for(const [key,value] of Object.entries(u.modifiers.add||{}))droneStats[key]+=value;for(const [key,value] of Object.entries(u.modifiers.multiply||{}))droneStats[key]*=value;}
  assert.ok(await evaluate(`document.querySelector('[data-equip="mining_drones"]').closest('article').textContent.includes('${droneStats.droneCount} drones · ${droneStats.penetration} blocks pierced · autonomous')`));
  assert.ok(await evaluate("!document.querySelector('[data-equip=\"mining_drones\"]').closest('article').textContent.includes('8% faster')"));
  await evaluate("document.getElementById('closeShop').click()");
  await evaluate("document.getElementById('pauseBtn').click()");
  assert.equal(await evaluate("document.getElementById('pause').hidden"),false);
  const dronePaused=await evaluate("document.getElementById('credits').textContent");await sleep(400);assert.equal(await evaluate("document.getElementById('credits').textContent"),dronePaused,'Pause freezes autonomous mining');
  await evaluate("document.getElementById('resumeBtn').click()");
  const beforeDrones=await evaluate("Number(document.getElementById('credits').textContent.replaceAll(',',''))");
  await sleep(1800);
  assert.ok(await evaluate(`Number(document.getElementById('credits').textContent.replaceAll(',',''))>${beforeDrones}`),'Drones mine without trigger or AUTO');
  await evaluate("document.getElementById('shopBtn').click()");
  const screenshotDir=path.join(os.tmpdir(),'planet-destroyer-preview');fs.mkdirSync(screenshotDir,{recursive:true});
  const shopImage=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,'armory.png'),Buffer.from(shopImage.data,'base64'));
  await evaluate("document.getElementById('closeShop').click();document.getElementById('autoBtn').click()");await sleep(2500);
  const flightImage=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,'flight.png'),Buffer.from(flightImage.data,'base64'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
  assert.ok(await evaluate("!document.getElementById('pause').hidden || !document.getElementById('complete').hidden"),'Flight is paused or the combined loadout has completed Terra');
  const paused=await evaluate("document.getElementById('remaining').textContent");await sleep(500);assert.equal(await evaluate("document.getElementById('remaining').textContent"),paused);
  async function reloadWithSave(save){
    const injected=await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('planetDestroyer.demo.v1',${JSON.stringify(JSON.stringify(save))});`});
    await evaluate('window.__beforeReload=true');await send('Page.reload');
    await until("!window.__beforeReload && !!document.getElementById('startBtn') && !document.getElementById('startBtn').disabled");
    await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});
  }
  const galaxySave={...saved,level:1,paid:[0],auto:false,slots:['double_parallel_shot',null,null]};
  for(const key of ['hp','positions','ship','collapse','compaction','visits','replaying'])delete galaxySave[key];
  await reloadWithSave(galaxySave);
  await evaluate("document.getElementById('startBtn').click();document.getElementById('galaxyBtn').click()");
  assert.ok(await evaluate("!document.getElementById('galaxy').hidden && document.querySelector('[data-planet=\"9\"]').disabled"));
  const galaxyRemaining=await evaluate("document.getElementById('remaining').textContent");await sleep(300);
  assert.equal(await evaluate("document.getElementById('remaining').textContent"),galaxyRemaining);
  const galaxyShot=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,'galaxy.png'),Buffer.from(galaxyShot.data,'base64'));
  await evaluate("document.querySelector('[data-planet=\"0\"]').click();document.getElementById('pauseBtn').click()");
  assert.equal(await evaluate("document.getElementById('planetName').textContent"),'Terra');
  assert.equal(await evaluate("document.getElementById('remaining').textContent.replace(/[^0-9]/g,'')"),'1000');
  const replaySave=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");assert.ok(replaySave.replaying);
  await reloadWithSave(replaySave);await evaluate("document.getElementById('startBtn').click();document.getElementById('galaxyBtn').click();document.querySelector('[data-planet=\"1\"]').click();document.getElementById('pauseBtn').click()");
  assert.equal(await evaluate("document.getElementById('planetName').textContent"),'Bedrock');
  assert.equal(await evaluate("document.getElementById('remaining').textContent"),galaxyRemaining);
  console.log('Galaxy browser checks passed: selector, locked destinations, replay, reload, and campaign return.');
  for(const level of [0,1,2,3,4,5,6,7]){
    const seeded={...saved,level,paid:[],auto:false};delete seeded.hp;delete seeded.positions;delete seeded.ship;delete seeded.collapse;delete seeded.compaction;
    await reloadWithSave(seeded);await evaluate("document.getElementById('startBtn').click();document.getElementById('pauseBtn').click()");
    const composition=await evaluate("document.getElementById('composition').textContent");
    assert.ok(composition.includes(['Liquid mantle','Polar weakness','Gold','Armored crust','Hex sector wall','Regenerative shell','Reflective shell','Turtle blocks'][level]));
    await evaluate("document.getElementById('resumeBtn').click()");
    await sleep(100);
    const shot=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,`${['terra','bedrock','cinder','basalt','ironheart','anvil','turtle','chaos'][level]}.png`),Buffer.from(shot.data,'base64'));
    await evaluate("document.getElementById('pauseBtn').click()");
    if(level<2||level===6){
      const collapsing=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");
      const radius=Math.max(...collapsing.positions.map(([i,j])=>Math.hypot(i+.5,j+.5)*16));
      if(level===6){assert.equal(await evaluate("document.getElementById('planetName').textContent"),'Turtle');assert.ok(composition.includes('50 HP')&&composition.includes('10 HP'));assert.ok((await evaluate("document.getElementById('planetObjective').textContent")).includes('10 / 10'));}
      collapsing.hp=collapsing.hp.map((hp,i)=>{const [x,y]=collapsing.positions[i],r=Math.hypot(x+.5,y+.5)*16;return (level===0?r/radius<=.27:(radius-r)/16>=(level===6?7:5))?0:hp;});
      collapsing.collapse=0;
      await reloadWithSave(collapsing);await evaluate("document.getElementById('startBtn').click()");
      await until("document.getElementById('complete').hidden===false");
      assert.equal(await evaluate("document.getElementById('remaining').textContent"),'0 blocks');
    }else if(level===2)assert.ok((await evaluate("document.getElementById('planetObjective').textContent")).includes('100 / 100'));
    else if(level===7){
      assert.equal(await evaluate("document.getElementById('planetName').textContent"),'Chaos');
      assert.ok(composition.includes('Gold')&&composition.includes('Liquid'));
    }else {
      assert.ok((await evaluate("document.getElementById('planetObjective').textContent")).includes(level===3?'30 / 30':level===4?'6 / 6':'8 / 8'));
      assert.ok(level===3?composition.includes('100 HP')&&composition.includes('10 HP'):level===4?composition.includes('200 HP')&&composition.includes('250 HP')&&composition.includes('15 HP'):composition.includes('10 HP')&&composition.includes('80 HP'));
      await evaluate("document.getElementById('resumeBtn').click();document.getElementById('autoBtn').click()");await sleep(1200);
      const defenseShot=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,level===3?'basalt-defense.png':level===4?'ironheart-defense.png':'anvil-defense.png'),Buffer.from(defenseShot.data,'base64'));
      if(level===3){
        await evaluate("document.getElementById('pauseBtn').click()");
        const emptyInterior=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");emptyInterior.auto=false;
        const radius=Math.max(...emptyInterior.positions.map(([i,j])=>Math.hypot(i+.5,j+.5)*16));
        emptyInterior.hp=emptyInterior.hp.map((hp,i)=>(radius-Math.hypot(emptyInterior.positions[i][0]+.5,emptyInterior.positions[i][1]+.5)*16)/16>=2?0:hp);
        emptyInterior.collapse=0;await reloadWithSave(emptyInterior);await evaluate("document.getElementById('startBtn').click()");
        await until("document.getElementById('complete').hidden===false");assert.equal(await evaluate("document.getElementById('remaining').textContent"),'0 blocks');
      }
      if(level===5){
        await evaluate("document.getElementById('pauseBtn').click()");
        const exposed=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");exposed.auto=false;
        const radius=Math.max(...exposed.positions.map(([i,j])=>Math.hypot(i+.5,j+.5)*16));
        exposed.hp=exposed.hp.map((hp,i)=>Math.hypot(exposed.positions[i][0]+.5,exposed.positions[i][1]+.5)*16>radius*.28?0:hp);
        await reloadWithSave(exposed);await evaluate("document.getElementById('startBtn').click()");await sleep(700);
        const waveShot=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,'anvil-waves.png'),Buffer.from(waveShot.data,'base64'));
      }
    }
  }
  const shockSave={...saved,level:0,paid:[],auto:false,credits:20000,slots:['shockwave',null,null]};
  for(const key of ['hp','positions','ship','collapse','compaction','visits','replaying'])delete shockSave[key];
  await reloadWithSave(shockSave);await evaluate("document.getElementById('startBtn').click();document.getElementById('shopBtn').click()");
  for(let level=2;level<=5;level++)await evaluate("document.querySelector('[data-upgrade=\"shockwave\"]').click()");
  assert.ok(await evaluate("document.querySelector('[data-equip=\"shockwave\"]').closest('article').textContent.includes('560 range')"));
  await evaluate("document.getElementById('closeShop').click();document.getElementById('autoBtn').click()");await sleep(900);
  await evaluate("document.getElementById('pauseBtn').click()");
  const shockResult=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");
  assert.equal(shockResult.owned.shockwave,5);assert.ok(shockResult.credits>1500,'Shockwave damages blocks in flight');
  await evaluate("document.getElementById('resumeBtn').click()");
  const shockShot=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,'shockwave.png'),Buffer.from(shockShot.data,'base64'));
  console.log('Shockwave browser checks passed: purchase, five levels, range display, electric-ring rendering, and damage.');
  const plagueDefinition=JSON.parse(fs.readFileSync(path.join(__dirname,'weapons.json'),'utf8')).weapons.find(w=>w.id==='plague');
  const plagueSave={...saved,credits:plagueDefinition.upgrades.reduce((sum,u)=>sum+u.cost,0),level:2,paid:[],auto:false,slots:['plague',null,null]};delete plagueSave.hp;delete plagueSave.positions;delete plagueSave.ship;
  await reloadWithSave(plagueSave);await evaluate("document.getElementById('startBtn').click();document.getElementById('shopBtn').click()");
  for(let level=2;level<=5;level++)await evaluate("document.querySelector('[data-upgrade=\"plague\"]').click()");
  assert.ok(await evaluate("document.querySelector('[data-equip=\"plague\"]').closest('article').textContent.includes('5 damage/s · 1s contact to spread')"));
  await evaluate("document.getElementById('closeShop').click();document.getElementById('autoBtn').click()");await sleep(2200);
  assert.ok((await evaluate("document.getElementById('planetObjective').textContent")).includes('plagued'));
  const plagueShot=await send('Page.captureScreenshot');fs.writeFileSync(path.join(screenshotDir,'plague.png'),Buffer.from(plagueShot.data,'base64'));
  await evaluate("document.getElementById('pauseBtn').click()");
  const infectedSave=await evaluate("JSON.parse(localStorage.getItem('planetDestroyer.demo.v1'))");assert.ok(infectedSave.plagued.length>0);assert.equal(infectedSave.owned.plague,5);
  await reloadWithSave(infectedSave);assert.ok((await evaluate("document.getElementById('planetObjective').textContent")).includes('plagued'));
  assert.deepEqual(errors,[]);
  console.log('Browser passed: firing, purchases/upgrades, save/reload, auto/pause, eight planet materials including Chaos, Turtle name/gap/core collapse, defenses, Anvil waves, and Plague; no runtime exceptions.');
  console.log(`Screenshots: ${screenshotDir}`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});
