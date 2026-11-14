
import {factions,resolveFaction} from './factions.js';
import {catalogForFaction} from './presets.js';
import {WebGLRenderer} from './webgl-renderer.js';
import {openTestFlight} from './flight.js';
import {openFlight25} from './flight25.js';
import {recommendedStats,statFields} from './stats.js';
import {library,armorProfiles,hullProfiles,wingProfiles,thrusterProfiles,cockpitProfiles,finProfiles,cannonOptions,part,preset,combined,validateProject,objFiles,gltf} from './model.js';
import {octagonalTypes,technicianDescriptions,technicianHullProfiles,hasAnimatedTechnician} from './technician.js';
const faction=resolveFaction(new URL(location.href).searchParams.get('faction')),factionSpec=factions[faction],presetCatalog=catalogForFaction(faction);
const $=id=>document.getElementById(id),key=faction==='human'?'orbital-foundry-v1':'starship-builder-'+faction;
document.documentElement.dataset.faction=faction;
const factionField=document.createElement('label');factionField.className='field toolbar-faction';factionField.textContent='Faction';
const factionSelect=document.createElement('select');factionSelect.id='faction';
for(const [id,spec] of Object.entries(factions))factionSelect.add(new Option(spec.name,id));
factionSelect.value=faction;factionField.append(factionSelect);$('shipName').closest('label').after(factionField);
factionSelect.onchange=()=>{persist();const url=new URL(location.href);url.searchParams.set('faction',factionSelect.value);location.assign(url.href);};
const starter=faction==='human'?'fighter':Object.keys(presetCatalog)[0];
let project={version:1,name:presetCatalog[starter].name,faction,parts:preset(starter)},selected,undo=[],redo=[],renderer,dirty=true,yaw=-.65,pitch=.55,distance=3.5;
const canvas=$('scene'),pointers=new Map();let width=1,height=1,last=0;
const status=message=>{$('status').textContent=message;};
try{const saved=localStorage.getItem(key);if(saved)project=validateProject(JSON.parse(saved));}catch{status('Could not restore autosave. A starter ship is ready.');}
try{renderer=new WebGLRenderer(canvas,{onError:message=>{$('renderError').hidden=false;$('renderError').textContent=message;},onRestore:()=>{$('renderError').hidden=true;dirty=true;}});}catch(error){$('renderError').hidden=false;$('renderError').textContent=error.message;}
project.faction=faction;
const current=()=>project.parts.find(p=>p.id===selected);
document.head.append(Object.assign(document.createElement('link'),{rel:'stylesheet',href:new URL('./flight.css',import.meta.url).href}));
const testFlightButton=document.createElement('button');testFlightButton.id='testFlight';testFlightButton.textContent='Test Flight';$('export').before(testFlightButton);
testFlightButton.onclick=()=>{
  const dialog=document.createElement('dialog');dialog.className='flight-mode-dialog';dialog.setAttribute('aria-labelledby','flightModeTitle');
  dialog.innerHTML='<h2 id="flightModeTitle">Choose flight mode</h2><button id="chooseFlight3D"><strong>3D flight</strong><span>Current mode · free flight with pitch and yaw</span></button><button id="chooseFlight25"><strong>2.5D flight</strong><span>Top-down view · car-like steering · battle presets</span></button><button id="cancelFlightMode">Cancel</button>';
  document.body.append(dialog);let mode;
  dialog.querySelector('#chooseFlight3D').onclick=()=>{mode='3d';dialog.close();};
  dialog.querySelector('#chooseFlight25').onclick=()=>{mode='25';dialog.close();};
  dialog.querySelector('#cancelFlightMode').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{dialog.remove();if(mode==='3d')openTestFlight(project);else if(mode==='25')openFlight25(project);else testFlightButton.focus();},{once:true});dialog.showModal();
};
const presetDescription=document.createElement('p');presetDescription.id='presetDescription';presetDescription.className='hint';$('preset').after(presetDescription);
$('preset').replaceChildren();for(const [id,spec] of Object.entries(presetCatalog)){const option=document.createElement('option');option.value=id;option.textContent=spec.label;$('preset').append(option);}
$('preset').onchange=()=>presetDescription.textContent=presetCatalog[$('preset').value].description;$('preset').onchange();
const statsPanel=document.createElement('details');statsPanel.open=true;statsPanel.id='recommendedStats';statsPanel.className='recommended-stats';statsPanel.setAttribute('aria-labelledby','recommendedStatsTitle');
statsPanel.innerHTML='<summary id="recommendedStatsTitle">Recommended stats</summary><p class="stats-subtitle">VOLUME-BASED ESTIMATES</p><dl id="recommendedStatsValues"></dl><details><summary>How stats work</summary><p>Module contributions scale with volume. Half size on all three axes means ⅛ the contribution. Mirrored copies count twice.</p><p>Movement uses full mass. Wings add steering power and reduce turn inertia. Fuel, cargo, fighters and passengers add loaded mass.</p><p>Fractional capacities are slot or passenger equivalents, not whole occupants. These are game-balance recommendations. Composite volumes sum their solids, including overlaps.</p></details>';
document.querySelector('.library').prepend(statsPanel);
for(const [id,label,unit] of statFields){const row=document.createElement('div'),term=document.createElement('dt'),value=document.createElement('dd');term.textContent=label;value.id='stat-'+id;value.dataset.unit=unit;row.append(term,value);$('recommendedStatsValues').append(row);}
const statsNumber=new Intl.NumberFormat('en',{maximumFractionDigits:2});
function updateStats(){const values=recommendedStats(project.parts);for(const [id,,unit] of statFields){const value=values[id],text=value>0&&value<.01?value.toPrecision(2):statsNumber.format(value);$('stat-'+id).textContent=text+(unit?' '+unit:'');$('stat-'+id).dataset.value=String(value);}}
const armorOptions=document.createElement('div');armorOptions.id='armorOptions';armorOptions.hidden=true;
armorOptions.innerHTML='<p class="eyebrow">ARMOR OPTIONS</p><label class="field">Armor type<select id="armorProfile"></select></label><p id="armorDescription" class="hint"></p>';
$('partProperties').append(armorOptions);
for(const [value,profile] of Object.entries(armorProfiles)){const option=document.createElement('option');option.value=value;option.textContent=profile.name;$('armorProfile').append(option);}
$('armorProfile').onchange=()=>{if(current()?.type==='armor')change(()=>{const p=current();p.armorProfile=$('armorProfile').value;p.color=armorProfiles[p.armorProfile].color;});};
const hullOptions=document.createElement('div');hullOptions.id='hullOptions';hullOptions.hidden=true;
hullOptions.innerHTML='<p class="eyebrow">HULL OPTIONS</p><label class="field">Hull shape<select id="hullProfile"></select></label><label class="field">Upper deck taper<input id="deckTaper" type="range" min="0.35" max="1" step="0.05"><output id="deckTaperValue"></output></label><p class="hint">Lower values slope the armor inward. Use Scale below to adjust width (X), height (Y) and length (Z).</p>';
$('partProperties').append(hullOptions);
for(const [value,profile] of Object.entries(hullProfiles).filter(([,profile])=>!profile.legacy)){const option=document.createElement('option');option.value=value;option.textContent=profile.name;$('hullProfile').append(option);}
$('hullProfile').onchange=()=>{if(current()?.type==='hull')change(()=>current().hullProfile=$('hullProfile').value);};
$('deckTaper').oninput=()=>{$('deckTaperValue').textContent=Math.round(Number($('deckTaper').value)*100)+'% upper deck';};
$('deckTaper').onchange=()=>{if(current()?.type==='hull')change(()=>current().deckTaper=Number($('deckTaper').value));};
for(const [id,title] of [['upperChamfer','Upper chamfer'],['lowerChamfer','Lower chamfer']]){
  const label=document.createElement('label');label.className='field';label.textContent=title;
  const input=document.createElement('input');input.id=id;input.type='range';input.min=0;input.max=.4;input.step=.02;
  const output=document.createElement('output');output.id=id+'Value';input.oninput=()=>output.textContent=Math.round(Number(input.value)*100)+'%';
  input.onchange=()=>{if(current()?.type==='hull')change(()=>current()[id]=Number(input.value));};label.append(input,output);hullOptions.querySelector('.hint').before(label);
}
const wingOptions=document.createElement('div');wingOptions.id='wingOptions';wingOptions.hidden=true;
const cannonPanel=document.createElement('div');cannonPanel.id='cannonOptions';cannonPanel.hidden=true;cannonPanel.innerHTML='<p class="eyebrow">CANNON OPTIONS</p>';$('partProperties').append(cannonPanel);
for(const [id,title] of [['cannonBarrel','Barrel'],['cannonMuzzle','Muzzle'],['cannonReceiver','Receiver']]){
  const label=document.createElement('label');label.className='field';label.textContent=title;const select=document.createElement('select');select.id=id;
  for(const [value,text] of Object.entries(cannonOptions[id])){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
  select.onchange=()=>{if(current()?.type!=='cannon')return;change(()=>{const p=current();p[id]=select.value;if(id!=='cannonBarrel'&&(!p.cannonBarrel||p.cannonBarrel==='classic'))p.cannonBarrel='hexagonal';});};label.append(select);cannonPanel.append(label);
}
const cannonHint=document.createElement('p');cannonHint.className='hint';cannonHint.textContent='Combine barrel, muzzle and receiver shapes. Scale and mirror affect the complete cannon.';cannonPanel.append(cannonHint);
const finOptions=document.createElement('div');finOptions.id='finOptions';finOptions.hidden=true;
finOptions.innerHTML='<p class="eyebrow">DORSAL FIN OPTIONS</p><label class="field">Fin shape<select id="finProfile"></select></label><p class="hint">Sweep moves the tip forward or back; cant leans it sideways. The root stays fixed. Scale Y adjusts height and Z adjusts length.</p>';
$('partProperties').append(finOptions);
for(const [value,profile] of Object.entries(finProfiles)){const option=document.createElement('option');option.value=value;option.textContent=profile.name;$('finProfile').append(option);}
$('finProfile').onchange=()=>{if(current()?.type==='fin')change(()=>current().finProfile=$('finProfile').value);};
const finFields=[['finSweep','Additional sweep',-35,35,5,0,'°'],['finCant','Sideways cant',-45,45,5,0,'°'],['finThickness','Thickness',.04,.4,.02,.16,' units']];
for(const [id,label,min,max,step,,unit] of finFields){const field=document.createElement('label');field.className='field';field.textContent=label;const input=document.createElement('input');input.type='range';input.id=id;input.min=min;input.max=max;input.step=step;const output=document.createElement('output');output.id=id+'Value';input.oninput=()=>output.textContent=input.value+unit;input.onchange=()=>{if(current()?.type==='fin')change(()=>current()[id]=Number(input.value));};field.append(input,output);finOptions.append(field);}
const cockpitOptions=document.createElement('div');cockpitOptions.id='cockpitOptions';cockpitOptions.hidden=true;
cockpitOptions.innerHTML='<p class="eyebrow">COCKPIT OPTIONS</p><label class="field">Cockpit shape<select id="cockpitProfile"></select></label><p class="hint">Scale and rotate the complete cockpit below. Surface color changes the glazing; structural trim retains its accent color.</p>';
$('partProperties').append(cockpitOptions);
for(const [value,profile] of Object.entries(cockpitProfiles).filter(([,profile])=>!profile.legacy)){const option=document.createElement('option');option.value=value;option.textContent=profile.name;$('cockpitProfile').append(option);}
$('cockpitProfile').onchange=()=>{if(current()?.type==='cockpit')change(()=>current().cockpitProfile=$('cockpitProfile').value);};
const bevelField=document.createElement('label');bevelField.className='field';bevelField.innerHTML='Bevel<input id="cockpitBevel" type="range" min="0" max="0.4" step="0.02"><output id="cockpitBevelValue"></output>';cockpitOptions.querySelector('.hint').before(bevelField);
$('cockpitBevel').oninput=()=>$('cockpitBevelValue').textContent=Math.round(Number($('cockpitBevel').value)*100)+'%';
$('cockpitBevel').onchange=()=>{if(current()?.type==='cockpit')change(()=>current().cockpitBevel=Number($('cockpitBevel').value));};
const thrusterOptions=document.createElement('div');thrusterOptions.id='thrusterOptions';thrusterOptions.hidden=true;
thrusterOptions.innerHTML='<p class="eyebrow">THRUSTER MODULE</p><label class="field">Complete module<select id="thrusterProfile"></select></label><p class="hint">Changes the housing and every exhaust together. Scale, rotate, mirror and recolor the complete assembly below. Reverse drone faces forward for mounting at the nose. Separate legacy thruster cores remain independent parts.</p>';
$('partProperties').append(thrusterOptions);
for(const [value,profile] of Object.entries(thrusterProfiles)){const option=document.createElement('option');option.value=value;option.textContent=profile.name;$('thrusterProfile').append(option);}
$('thrusterProfile').onchange=()=>{if(current()?.type==='engine')change(()=>current().thrusterProfile=$('thrusterProfile').value);};
wingOptions.innerHTML='<p class="eyebrow">WING OPTIONS</p><label class="field">Wing shape<select id="wingProfile"></select></label><p class="hint">Sweep moves the tip forward or back. Dihedral raises or lowers it. Use Scale X for span and Z for chord. Enable Mirror for a matching pair.</p>';
$('partProperties').append(wingOptions);
for(const [value,profile] of Object.entries(wingProfiles)){const option=document.createElement('option');option.value=value;option.textContent=profile.name;$('wingProfile').append(option);}
$('wingProfile').onchange=()=>{if(current()?.type==='wing')change(()=>current().wingProfile=$('wingProfile').value);};
const wingFields=[['wingSweep','Additional sweep',-35,35,5,0,'°'],['wingDihedral','Dihedral / tip angle',-45,45,5,0,'°'],['wingThickness','Thickness',.04,.6,.02,.16,' units']];
for(const [id,label,min,max,step,,unit] of wingFields){const field=document.createElement('label');field.className='field';field.textContent=label;const input=document.createElement('input');input.type='range';input.id=id;input.min=min;input.max=max;input.step=step;const output=document.createElement('output');output.id=id+'Value';input.oninput=()=>output.textContent=input.value+unit;input.onchange=()=>{if(current()?.type==='wing')change(()=>current()[id]=Number(input.value));};field.append(input,output);wingOptions.append(field);}
const jaredHullOptions=document.createElement('div');jaredHullOptions.hidden=true;jaredHullOptions.innerHTML='<label class="field">Jared hull shape<select id="jaredHullProfile"><option value="blockier">Runner</option><option value="interceptor">Interceptor</option><option value="warlord">Warlord</option></select></label><label class="field" id="moduleBevelField">Bevel<input id="moduleBevel" type="range" min="0" max="1" step="0.01"><output id="moduleBevelValue"></output></label>';$('partProperties').append(jaredHullOptions);
const bladeOptions=document.createElement('div');bladeOptions.hidden=true;bladeOptions.innerHTML='<label class="field">Blade variant<select id="bladeProfile"><option value="standard">Standard</option><option value="sustained">Sustained turn</option></select></label><p class="hint">Sustained turn: longer, narrower blades. Higher maximum turn speed, with only 35% of standard turning torque. Takes longer to build up or reverse a turn.</p>';$('partProperties').append(bladeOptions);
$('bladeProfile').onchange=()=>{if(current()?.type==='wing'&&current()?.designStyle==='jared')change(()=>current().bladeProfile=$('bladeProfile').value);};
$('jaredHullProfile').onchange=()=>{if(current()?.type==='hull'&&current()?.designStyle==='jared')change(()=>current().jaredHullProfile=$('jaredHullProfile').value);};
$('moduleBevel').oninput=()=>$('moduleBevelValue').textContent=Math.round(Number($('moduleBevel').value)*100)+'%';
$('moduleBevel').onchange=()=>{if(current()?.type==='hull'&&current()?.designStyle==='jared')change(()=>current().moduleBevel=Number($('moduleBevel').value));};
const spikeField=document.createElement('label');spikeField.className='field';spikeField.hidden=true;spikeField.innerHTML='Spike length<input id="spikeLength" type="range" min="0.2" max="5" step="0.1"><output id="spikeLengthValue"></output>';$('partProperties').append(spikeField);
const technicianOptions=document.createElement('div');technicianOptions.hidden=true;technicianOptions.innerHTML='<p class="eyebrow">TECHNICIAN MODULE</p><p id="technicianDescription" class="hint"></p><label id="octagonalField"><input id="octagonalSymmetry" type="checkbox"> Octagonal symmetry (8 directions)</label><p class="hint">Laser, push wave, gravity, nanites and blink effects are active in 2.5D. Sap ray and predictive targeting are not simulated yet.</p>';$('partProperties').append(technicianOptions);
$('octagonalSymmetry').onchange=()=>{if(current()?.designStyle==='technician'&&octagonalTypes.includes(current().type))change(()=>current().octagonalSymmetry=$('octagonalSymmetry').checked);};
const technicianHullField=document.createElement('label');technicianHullField.className='field';technicianHullField.innerHTML='Hull shape<select id="technicianHullProfile"><option value="sphere">Sphere</option><option value="rockShell">Half rock shell</option></select>';technicianOptions.prepend(technicianHullField);
$('technicianHullProfile').replaceChildren(...Object.entries(technicianHullProfiles).map(([value,label])=>new Option(label,value)));
$('technicianHullProfile').onchange=()=>{if(current()?.designStyle==='technician'&&current().type==='hull')change(()=>current().technicianHullProfile=$('technicianHullProfile').value);};
$('spikeLength').oninput=()=>$('spikeLengthValue').textContent=$('spikeLength').value+' units';
$('spikeLength').onchange=()=>{if(current()?.designStyle==='jared'&&current().type==='cannon')change(()=>current().spikeLength=Number($('spikeLength').value));};
function remember(){undo.push(JSON.stringify(project));if(undo.length>60)undo.shift();redo=[];}
function persist(){try{localStorage.setItem(key,JSON.stringify(project));status('All changes saved locally.');}catch{status('Autosave unavailable. Use Save project to keep your work.');}}
function refresh(){
  const missing=['hull','engine'].filter(type=>!project.parts.some(p=>p.type===type));
  $('flightReady').dataset.ready=String(!missing.length);
  $('flightReady').textContent=missing.length?'○ Not ready — needs '+missing.join(' and '):'✓ Ready to fly';
  testFlightButton.disabled=!project.parts.length;
  updateStats();
  if(!current())selected=project.parts[0]?.id;
  const model=combined(project.parts);if(model.vertices.length)renderer?.setModel(model);else if(renderer)renderer.model=null;
  $('empty').hidden=project.parts.length>0;$('stats').textContent=`${model.faces.reduce((sum,f)=>sum+f.length-2,0)} TRIANGLES`;$('partCount').textContent=`${project.parts.length} parts`;
  $('shipName').value=project.name;$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;$('export').disabled=$('obj').disabled=!project.parts.length;
  $('assembly').replaceChildren();for(const p of project.parts){const button=document.createElement('button');button.textContent=`${p.name}${p.mirror?' ×2':''}`;button.setAttribute('aria-pressed',String(p.id===selected));button.onclick=()=>{selected=p.id;refresh();};$('assembly').append(button);}
  const p=current();$('controls').hidden=!p;$('selectedName').textContent=p?.name||'Select a part';
  armorOptions.hidden=p?.type!=='armor';if(p?.type==='armor'){$('armorProfile').value=p.armorProfile||'darkAlloy';$('armorDescription').textContent=armorProfiles[p.armorProfile||'darkAlloy'].description;}
  hullOptions.hidden=p?.type!=='hull';
  wingOptions.hidden=p?.type!=='wing';
  cannonPanel.hidden=p?.type!=='cannon';if(p?.type==='cannon')for(const [id,fallback] of [['cannonBarrel','hexagonal'],['cannonMuzzle','none'],['cannonReceiver','square']])$(id).value=p[id]??fallback;
  finOptions.hidden=p?.type!=='fin';if(p?.type==='fin'){$('finProfile').value=p.finProfile||'classic';for(const [id,,,,,fallback,unit] of finFields){$(id).value=p[id]??fallback;$(id+'Value').textContent=(p[id]??fallback)+unit;}}
  cockpitOptions.hidden=p?.type!=='cockpit';
  $('cockpitProfile').querySelector('[data-legacy]')?.remove();
  if(p?.type==='cockpit'){
    if(cockpitProfiles[p.cockpitProfile]?.legacy){const option=document.createElement('option');option.value=p.cockpitProfile;option.textContent=cockpitProfiles[p.cockpitProfile].name+' (legacy)';option.disabled=true;option.dataset.legacy='true';$('cockpitProfile').append(option);}
    $('cockpitProfile').value=p.cockpitProfile||'classic';
  }
  if(p?.type==='cockpit'){$('cockpitBevel').value=p.cockpitBevel??0;$('cockpitBevelValue').textContent=Math.round((p.cockpitBevel??0)*100)+'%';}
  thrusterOptions.hidden=p?.type!=='engine';if(p?.type==='engine')$('thrusterProfile').value=!p.thrusterProfile||p.thrusterProfile==='classic'?'drone':p.thrusterProfile;
  $('deckTaper').closest('label').hidden=p?.type==='hull'&&!!hullProfiles[p.hullProfile||'standard'].composite;
  for(const id of ['upperChamfer','lowerChamfer']){$(id).closest('label').hidden=p?.type==='hull'&&!!hullProfiles[p.hullProfile||'standard'].composite;if(p?.type==='hull'){$(id).value=p[id]??0;$(id+'Value').textContent=Math.round((p[id]??0)*100)+'%';}}
  if(p?.type==='wing'){$('wingProfile').value=p.wingProfile||'swept';for(const [id,,,,,fallback,unit] of wingFields){$(id).value=p[id]??fallback;$(id+'Value').textContent=(p[id]??fallback)+unit;}}
  $('hullProfile').querySelector('[data-legacy]')?.remove();
  if(p?.type==='hull'){
    if(hullProfiles[p.hullProfile]?.legacy){const option=document.createElement('option');option.value=p.hullProfile;option.textContent=hullProfiles[p.hullProfile].name+' (legacy)';option.disabled=true;option.dataset.legacy='true';$('hullProfile').append(option);}
    $('hullProfile').value=p.hullProfile||'standard';$('deckTaper').value=p.deckTaper??1;$('deckTaperValue').textContent=Math.round((p.deckTaper??1)*100)+'% upper deck';
  }
  if(p){$('partName').value=p.name;$('color').value=p.color;$('mirror').checked=p.mirror;document.querySelectorAll('[data-axis]').forEach(input=>input.value=p[input.dataset.field][Number(input.dataset.axis)]);}
  if(p?.designStyle==='jared')for(const panel of [hullOptions,cockpitOptions,thrusterOptions,wingOptions,cannonPanel])panel.hidden=true;
  technicianOptions.hidden=p?.designStyle!=='technician';
  if(!technicianOptions.hidden){
    technicianHullField.hidden=p.type!=='hull';$('technicianHullProfile').value=p.technicianHullProfile||'sphere';
    for(const panel of [hullOptions,cockpitOptions,thrusterOptions,wingOptions,cannonPanel])panel.hidden=true;
    $('technicianDescription').textContent=technicianDescriptions[p.type]||'';
    $('octagonalField').hidden=!octagonalTypes.includes(p.type);$('octagonalSymmetry').checked=p.octagonalSymmetry!==false;
  }
  bladeOptions.hidden=!(p?.type==='wing'&&p?.designStyle==='jared');if(!bladeOptions.hidden)$('bladeProfile').value=p.bladeProfile||'standard';
  jaredHullOptions.hidden=!(p?.type==='hull'&&p?.designStyle==='jared');if(!jaredHullOptions.hidden){$('jaredHullProfile').value=p.jaredHullProfile&&p.jaredHullProfile!=='curved'?p.jaredHullProfile:'blockier';$('moduleBevelField').hidden=false;$('moduleBevel').value=p.moduleBevel??1;$('moduleBevelValue').textContent=Math.round((p.moduleBevel??1)*100)+'%';}
  spikeField.hidden=!(p?.designStyle==='jared'&&p?.type==='cannon');if(!spikeField.hidden){$('spikeLength').value=p.spikeLength??1.6;$('spikeLengthValue').textContent=(p.spikeLength??1.6)+' units';}
  dirty=true;
}
function change(fn){remember();fn();refresh();persist();}
for(const [type,spec] of Object.entries(library).filter(([type,spec])=>!spec.legacy&&factionSpec.parts.includes(type))){const button=document.createElement('button'),icon=document.createElement('strong'),name=document.createElement('small');icon.textContent=spec.icon;name.textContent=factionSpec.defaults[type]?.name||spec.name;button.append(icon,name);button.onclick=()=>{if(project.parts.length>=150)return status('Maximum 150 parts.');change(()=>{const p=part(type,type==='cockpit'?(faction==='jared'?[0,.3,-.3]:[0,.5,-.5]):type==='wing'?[.6,0,0]:faction==='jared'&&type==='shieldGenerator'?[0,.3,0]:[0,0,0],[1,1,1],type==='wing');Object.assign(p,factionSpec.defaults[type]);project.parts.push(p);selected=p.id;});};$('parts').append(button);}
for(const field of ['position','rotation','scale']){const group=document.createElement('details');group.className='transform';group.open=true;const label=document.createElement('summary');label.textContent=field.toUpperCase()+(field==='rotation'?' / DEGREES':'');const axes=document.createElement('div');axes.className='axes';['X','Y','Z'].forEach((axis,i)=>{const wrap=document.createElement('label');wrap.textContent=axis;const input=document.createElement('input');input.type='number';input.step=field==='rotation'?'5':'.1';input.min=field==='scale'?'.05':field==='rotation'?'-360':'-100';input.max=field==='rotation'?'360':'100';input.dataset.field=field;input.dataset.axis=i;input.setAttribute('aria-label',`${field} ${axis}`);input.onchange=()=>{const value=Number(input.value);if(input.value===''||!Number.isFinite(value)||value<Number(input.min)||value>Number(input.max)){refresh();return status('Transform is outside its allowed range.');}change(()=>current()[field][i]=value);};wrap.append(input);axes.append(wrap);});group.append(label,axes);$('transforms').append(group);}
$('shipName').onchange=()=>change(()=>project.name=$('shipName').value.trim()||'Untitled ship');
$('partName').onchange=()=>change(()=>current().name=$('partName').value.trim()||library[current().type].name);
$('color').onchange=()=>change(()=>current().color=$('color').value);
$('mirror').onchange=()=>change(()=>current().mirror=$('mirror').checked);
$('duplicate').onclick=()=>{if(project.parts.length>=150)return status('Maximum 150 parts.');change(()=>{const p=structuredClone(current());p.id=crypto.randomUUID();p.position[0]=Math.min(100,p.position[0]+.3);p.name+=' copy';project.parts.push(p);selected=p.id;});};
$('delete').onclick=()=>change(()=>project.parts=project.parts.filter(p=>p.id!==selected));
$('build').onclick=()=>change(()=>{project.parts=preset($('preset').value);project.name=presetCatalog[$('preset').value].name;});
function historyStep(from,to){if(!from.length)return;to.push(JSON.stringify(project));project=JSON.parse(from.pop());refresh();persist();}
$('undo').onclick=()=>historyStep(undo,redo);$('redo').onclick=()=>historyStep(redo,undo);
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
const filename=()=>project.name.replace(/[^a-z0-9_-]/gi,'_')||'starship';
const configExport=document.createElement('button');configExport.id='exportConfig';configExport.textContent='Export configuration JSON';configExport.title='Download all editable parts and settings; restore with Open project';$('obj').before(configExport);
configExport.onclick=()=>{download(filename()+'.starship.json',JSON.stringify(project,null,2),'application/json');status('Configuration JSON exported. Use Open project to import it into this editor.');};
const copyConfig=document.createElement('button');copyConfig.id='copyConfig';copyConfig.textContent='Copy JSON configuration';configExport.before(copyConfig);
copyConfig.onclick=async()=>{
  const json=JSON.stringify(project,null,2);copyConfig.disabled=true;
  try{await navigator.clipboard.writeText(json);status('JSON configuration copied to clipboard.');}
  catch{
    const dialog=document.createElement('dialog');dialog.className='copy-json-dialog';dialog.id='copyConfigDialog';dialog.setAttribute('aria-labelledby','copyConfigTitle');
    dialog.innerHTML='<h2 id="copyConfigTitle">Copy JSON configuration</h2><p>Clipboard access is unavailable. Select and copy the configuration below (Ctrl+C / ⌘C).</p><textarea aria-label="Editable project JSON" readonly></textarea><button>Close</button>';
    dialog.querySelector('textarea').value=json;dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();copyConfig.focus();},{once:true});document.body.append(dialog);dialog.showModal();dialog.querySelector('textarea').focus();dialog.querySelector('textarea').select();
    status('Select and copy the JSON in the dialog.');
  }finally{copyConfig.disabled=false;}
};
$('load').title='Import an editable project or .starship.json configuration';
$('save').onclick=()=>{download(filename()+'.json',JSON.stringify(project,null,2),'application/json');status('Project downloaded.');};
$('export').onclick=()=>{download(filename()+'.gltf',JSON.stringify(gltf(project.parts)),'model/gltf+json');status('glTF exported with materials and separate part meshes.');};
$('obj').onclick=()=>{const files=objFiles(project.parts);download(filename()+'.obj',files.obj,'text/plain');download('starship.mtl',files.mtl,'text/plain');status('OBJ + MTL exported. Keep both files together; allow multiple downloads if prompted.');};
$('load').onclick=()=>$('file').click();$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>1000000)throw Error('Project must be smaller than 1 MB.');const incoming=validateProject(JSON.parse(await file.text()));change(()=>project={...incoming,faction});status('Project loaded.');}catch(error){status('Could not open project: '+error.message);}finally{$('file').value='';}};
const views={perspective:[-.65,.55],top:[0,Math.PI/2],front:[Math.PI,0],side:[Math.PI/2,0]};
function view(name){[yaw,pitch]=views[name];distance=3.5;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));dirty=true;}
function free(){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));dirty=true;}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view(b.dataset.view);});$('reset').onclick=()=>view('perspective');
function zoom(factor){distance=Math.max(1.05,Math.min(10,distance*factor));dirty=true;}
canvas.onwheel=e=>{e.preventDefault();zoom(Math.exp(Math.max(-100,Math.min(100,e.deltaY))*.002));};
canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);};
canvas.onpointermove=e=>{const prev=pointers.get(e.pointerId);if(!prev)return;const next=[e.clientX,e.clientY];if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1],before=Math.hypot(prev[0]-other[0],prev[1]-other[1]),after=Math.hypot(next[0]-other[0],next[1]-other[1]);if(before&&after)zoom(before/after);}else{yaw+=(next[0]-prev[0])*.008;pitch=Math.max(-1.57,Math.min(1.57,pitch+(next[1]-prev[1])*.008));free();}pointers.set(e.pointerId,next);};
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>pointers.delete(e.pointerId));
canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'].includes(e.key))return;e.preventDefault();if(e.key==='0')view('perspective');else if(['+','=','-'].includes(e.key))zoom(e.key==='-'?1.1:.9);else{yaw+=e.key==='ArrowLeft'?-.1:e.key==='ArrowRight'?.1:0;pitch=Math.max(-1.57,Math.min(1.57,pitch+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0)));free();}};
for(const id of ['triangles','wireframe'])$(id).onchange=()=>dirty=true;
new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);dirty=true;}).observe(canvas);

let lastModuleFrame=0;
function frame(now){if(!document.hidden&&renderer?.model&&now-lastModuleFrame>=50&&hasAnimatedTechnician(project.parts)){renderer.setModel(combined(project.parts,now/1000));lastModuleFrame=now;dirty=true;}if(dirty){if(renderer?.model)renderer.render({yaw,pitch,distance,width,height,wireframe:$('wireframe').checked,triangleLines:$('triangles').checked});else if(renderer){renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT|renderer.gl.DEPTH_BUFFER_BIT);}dirty=false;}requestAnimationFrame(frame);}
refresh();view('perspective');requestAnimationFrame(frame);
