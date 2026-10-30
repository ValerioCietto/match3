'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');

module.exports=async function checkLanguages({evaluate,send,until,mobile}){
  const choose=language=>evaluate(`{const select=document.querySelector('[data-language]');select.value='${language}';select.dispatchEvent(new Event('change',{bubbles:true}));}`);
  const reload=async()=>{
    await evaluate('window.__languageReload=true');
    await send('Page.reload');
    await until("!window.__languageReload && !!document.getElementById('startBtn') && !document.getElementById('startBtn').disabled");
  };
  // URL selection overrides legacy saved preferences; absent/unknown languages default to English.
  await evaluate("localStorage.setItem('planetDestroyer.language','it')");
  for(const [query,expected] of [['?lang=it','it'],['?lang=en','en'],['','en'],['?lang=fr','en'],['?lang=','en']]){
    await evaluate(`history.replaceState(null,'',location.pathname+${JSON.stringify(query)})`);
    await reload();
    assert.equal(await evaluate('document.documentElement.lang'),expected,`Language for ${query||'no query'}`);
    assert.equal(await evaluate("document.querySelector('[data-language]').value"),expected);
  }
  await evaluate("history.replaceState(null,'',location.pathname+'?test=keep#arena')");
  await choose('it');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('lang')"),'it');
  assert.equal(await evaluate("new URLSearchParams(location.search).get('test')"),'keep');
  assert.equal(await evaluate('location.hash'),'#arena');
  assert.equal(await evaluate('document.documentElement.lang'),'it');
  assert.equal(await evaluate("document.getElementById('welcomeTitle').textContent"),'Fatti un po’ di spazio.');
  assert.equal(await evaluate("document.getElementById('shopBtn').textContent.trim().startsWith('Armeria')"),true);
  assert.ok(await evaluate("document.getElementById('planetObjective').textContent.includes('Distruggi il nucleo')"));
  assert.ok(await evaluate("document.getElementById('remaining').textContent.endsWith('blocchi')"));
  assert.equal(await evaluate("document.querySelector('[data-language]').getAttribute('aria-label')"),'Lingua');
  await reload();
  assert.equal(await evaluate('document.documentElement.lang'),'it','Language survives reload');
  await evaluate("document.getElementById('startBtn').click();document.getElementById('shopBtn').click()");
  assert.equal(await evaluate("document.getElementById('shopTitle').textContent"),'L’armeria');
  assert.equal(await evaluate("document.querySelector('[data-buy=\"sun_killer\"]').closest('article').querySelector('h3').textContent"),'Distruttore di soli');
  assert.ok(await evaluate("document.querySelector('[data-buy=\"sun_killer\"]').closest('article').textContent.includes('Esplosioni solari: 10–100 raggio / danni')"));
  assert.ok(await evaluate("document.querySelector('[data-buy=\"guided_laser\"]').closest('article').textContent.includes('1 raggio su blocchi diversi')"));
  const descriptions=await evaluate("[...document.querySelectorAll('.weapon-card p')].map(p=>p.textContent)");
  assert.equal(descriptions.length,16);
  assert.ok(descriptions.every(s=>!/(Upgrades|Each |Your |Hold |Hits |Lobs |Automatic tricks|physical projectiles)/.test(s)),'Weapon descriptions translated');
  const image=await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(os.tmpdir(),`planet-destroyer-italian-${mobile?'mobile':'desktop'}.png`),Buffer.from(image.data,'base64'));
  const saveKey=mobile?'planetDestroyer.mobile.v1':'planetDestroyer.demo.v1';
  const saved=await evaluate(`localStorage.getItem('${saveKey}')`);
  await choose('en');
  assert.equal(await evaluate(`localStorage.getItem('${saveKey}')`),saved,'Language changes do not modify the campaign');
  assert.equal(await evaluate("document.querySelector('[data-buy=\"sun_killer\"]').closest('article').querySelector('h3').textContent"),'Sun Killer');
  const original=await evaluate("document.getElementById('welcome').textContent");
  // Switching repeatedly restores originals, including text containing numbers and punctuation.
  for(let i=0;i<3;i++){await choose('it');await choose('en');}
  assert.equal(await evaluate("document.getElementById('welcome').textContent"),original);
  await evaluate("document.getElementById('closeShop').click();document.getElementById('pauseBtn').click()");
  await evaluate("{const select=document.querySelector('#pause [data-language]');select.value='it';select.dispatchEvent(new Event('change',{bubbles:true}));}");
  assert.equal(await evaluate("document.getElementById('pauseTitle').textContent"),'Volo in pausa');
  assert.equal(await evaluate("document.querySelector('#pause [data-language]').value"),'it');
  await evaluate("window.__confirmMessage='';window.confirm=message=>{window.__confirmMessage=message;return false;};document.getElementById('restartBtn').click()");
  assert.ok((await evaluate('window.__confirmMessage')).startsWith('Iniziare una nuova campagna?'));
  await evaluate("document.getElementById('pauseGalaxy').click()");
  assert.equal(await evaluate("document.getElementById('galaxyTitle').textContent"),'Galassia');
  assert.equal(await evaluate("document.querySelector('[data-planet=\"9\"]').textContent"),'Completa il pianeta precedente');
  if(mobile){
    assert.equal(await evaluate("document.querySelector('.stick-label').textContent"),'MUOVI');
    assert.equal(await evaluate("document.getElementById('fireTouch').getAttribute('aria-label')"),'Tieni premuto per sparare all’ultimo bersaglio');
  }
  await choose('en');
  // Restore a fresh campaign for the existing gameplay checks.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.removeItem('${saveKey}')`}).then(async script=>{
    await reload();
    await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  });
  console.log('English/Italian passed: live UI, descriptions, accessibility, repeated switching, persistence, confirmation and unchanged campaign.');
};
