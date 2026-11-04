import {COURSE_RADIUS,ARENA_UPGRADES,ENEMY_MESHES,enemyRadius,hitsEnemy,segmentHitsSphere,sampleEntrance,chooseEnemy,add,sub,mul,dot,length,unit,bulletDirection,coneDirection,upgradeCost,upgradeValue} from './core.mjs';
const $=id=>document.getElementById(id), canvas=$('space'), ctx=canvas.getContext('2d');
const KEY='void-wing.arena.v1';
let save={money:0,levels:{},bombs:[],bomb:'screen',best:0,autoAimEnabled:true,ludicrousEnabled:false};
try { const s=JSON.parse(localStorage.getItem(KEY)); if(s&&Number.isFinite(s.money)&&s.money>=0) save={...save,...s}; }catch{}
save.levels=save.levels&&typeof save.levels==='object'?save.levels:{};
if(save.levels.curvature!==undefined)save.levels.curvature=Math.min(10,Math.max(0,Math.floor(Number(save.levels.curvature)||0)));
save.bombs=Array.isArray(save.bombs)?save.bombs:[];
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch{toast('Storage unavailable · progress lasts this session');}}
let catalog=[...ARENA_UPGRADES], running=false, started=false, dead=false, sound=false, sorted=false;
let missileClock=5;
let boostToggled=false;
let encounter='idle',ludicrousTime=0,warningTime=0;
function resetEncounter(){encounter='idle';ludicrousTime=0;warningTime=0;$('bossAlert').hidden=true;$('bossHud').hidden=true;}
function updateEncounter(dt){
 if(encounter==='idle'){
  ludicrousTime=ludicrousActive()?ludicrousTime+dt:0;
  if(ludicrousTime>=10-1e-9){encounter='warning';warningTime=0;$('bossAlert').hidden=false;}
 }else if(encounter==='warning'){
  warningTime+=dt;$('bossAlert').style.opacity=String(.2+.8*(.5-.5*Math.cos(warningTime*Math.PI*2)));
  if(warningTime>=5-1e-9)startBigBoss();
 }
}
function startBigBoss(){
 encounter='fight';boostToggled=false;boost=false;clearInput();syncBoostControl();
 enemies=[{name:'big_boss',p:[0,0,player[2]+90],size:22,hp:1000,maxHp:1000,speed:0,bounty:10000,color:'#dce5ed',age:0,flash:0,rollClock:2,spinRemaining:0,rotation:0,roll:null}];
 bullets=[];enemyShots=[];$('bossAlert').hidden=true;$('bossHud').hidden=false;
}
function updateBigBoss(e,dt){
 e.rollClock-=dt;
 if(e.spinRemaining>0){
  const spinStep=Math.min(dt,e.spinRemaining);e.rotation+=spinStep*Math.PI*2;e.spinRemaining-=spinStep;
  if(e.spinRemaining<=1e-9){
   e.spinRemaining=0;e.roll=1+Math.floor(Math.random()*20);
   const origin=add(e.p,[0,0,-e.size/2]),axis=unit(sub(player,origin));
   const side=unit([axis[2],0,-axis[0]]),vertical=[axis[1]*side[2],axis[2]*side[0]-axis[0]*side[2],-axis[1]*side[0]];
   for(let i=0;i<e.roll;i++)enemyShots.push({p:[...origin],v:mul(coneDirection(i,e.roll,Math.PI/9,axis,side,vertical),40),life:8,cube:false,size:.6,damage:5,color:'#ff3030'});
  }
 }
 if(e.rollClock<=1e-9){e.rollClock+=2;e.spinRemaining=1;e.roll=null;}
}
function defeatBigBoss(){
 encounter='done';running=false;boostToggled=false;clearInput();syncBoostControl();syncMusic();enemyShots=[];bullets=[];enemies=enemies.filter(e=>e.hp>0);
 $('bossHud').hidden=true;$('overlay').hidden=false;$('overlay').setAttribute('data-boss-result','true');
 $('overlay').querySelector('h1').textContent='BOSS DEFEATED';
 $('overlay').querySelector('p').textContent='Are you happy now!?';
 $('bossMessage').hidden=false;
 $('launch').textContent='NAH KEEP PLAYING';
}
let player=[0,0,0],hp=100,kills=0,elapsed=0,spawnClock=0,fireClock=0,bombClock=0,invincible=0;
let enemies=[],bullets=[],enemyShots=[],particles=[],keys={},steer=[0,0],boost=false,brake=false;
let width=0,height=0,focal=0,camera=[0,0,-32],forward=[0,0,1],right=[1,0,0],up=[0,1,0];
let cameraMode='third',viewForward=[0,0,1],viewRight=[1,0,0],viewUp=[0,1,0];
function newStar(z){const angle=Math.random()*Math.PI*2,r=45+Math.random()*160;return [Math.cos(angle)*r,Math.sin(angle)*r,z];}
const stars=Array.from({length:550},()=>newStar(Math.random()*420));
function updateStars(){for(let i=0;i<stars.length;i++)if(stars[i][2]<player[2]-10)stars[i]=newStar(player[2]+400+Math.random()*20);}
const music=new Audio('../shooter/battle_music.mp3');music.loop=true;music.volume=.16;
const sounds={shot:new Audio('../shooter/shoot.wav'),hit:new Audio('../shooter/explosion_small.wav'),boss:new Audio('../shooter/explosion_big.wav'),buy:new Audio('../shooter/blip.wav')};
Object.values(sounds).forEach(a=>a.volume=.16);
function play(name){if(sound){const a=sounds[name];a.currentTime=0;a.play().catch(()=>{});}}
function syncMusic(){if(sound&&running)music.play().catch(()=>{});else music.pause();}
let toastTimer;
function toast(t){$('toast').textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',2400);}
const level=id=>Math.max(0,Number(save.levels[id])||0);
const has=id=>level(id)>0;
function value(id,fallback){const u=catalog.find(u=>u.id===id);return u?upgradeValue(u,level(id)):fallback;}
function syncAimCircle(){const size=value('aim_size',48);$('reticle').style.width=$('reticle').style.height=`${size}px`;}
syncAimCircle();
async function loadCatalog(){
  try{const res=await fetch('../shooter/upgrades.json');if(!res.ok)throw Error(res.status);catalog=[...(await res.json()).upgrades.filter(u=>u.id!=='ad_movement'),...ARENA_UPGRADES];syncAimCircle();$('loading').textContent='Systems ready. Your course awaits.';}
  catch{$('loading').textContent='Upgrade catalog unavailable. Serve this folder over HTTP and reload.';}
}
loadCatalog();
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);focal=Math.min(width,height)*.95;}
addEventListener('resize',resize);resize();
function basis(){
 forward=[0,0,1];right=[1,0,0];up=[0,1,0];
 viewRight=[1,0,0];
 if(cameraMode==='strategic'){
  camera=add(player,[0,9,-45]);viewForward=[0,0,1];viewUp=[0,1,0];
 }else{
  camera=add(player,cameraMode==='first'?[0,.4,1]:[0,3,-12]);viewForward=[0,0,1];viewUp=[0,1,0];
 }
}
function project(p){
 const x=p[0]-camera[0],y=p[1]-camera[1],depth=p[2]-camera[2];
 const z=x*viewForward[0]+y*viewForward[1]+depth*viewForward[2];
 if(z<=.3)return null;
 const scale=focal/z;
 return {x:width/2+(x*viewRight[0]+y*viewRight[1]+depth*viewRight[2])*scale,y:height/2-(x*viewUp[0]+y*viewUp[1]+depth*viewUp[2])*scale,z};
}
function cameraUnlocked(mode){return mode==='third'||(mode==='first'&&has('first_person_view'))||(mode==='strategic'&&has('strategic_view'));}
function autoAimEnabled(){return !has('auto_aim_control')||save.autoAimEnabled!==false;}
function syncCameraUnlocks(){
 for(const [mode,id,price] of [['first','first_person_view',10],['strategic','strategic_view',40]]){
  const option=$(mode==='first'?'cameraFirst':'cameraStrategic');option.disabled=!has(id);
  option.textContent=(mode==='first'?'1st person':'strategic')+(has(id)?'':` (${price} cr)`);
 }
 if(!cameraUnlocked(cameraMode))cameraMode='third';
 $('cameraMode').value=cameraMode;$('cockpit').hidden=cameraMode!=='first';basis();
}
$('cameraMode').onchange=()=>{
 const selected=$('cameraMode').value;
 if(!cameraUnlocked(selected)){syncCameraUnlocks();return;}
 cameraMode=selected;$('cockpit').hidden=cameraMode!=='first';clearInput();basis();$('cameraMode').blur?.();
};
syncCameraUnlocks();
function aimTarget(){
 if(!autoAimEnabled())return null;
 let target=null,best=(value('aim_size',48)/2)**2,depth=Infinity;
 for(const e of enemies){
  if(e.hp<=0||dot(sub(e.p,player),forward)<=0)continue;
  const p=project(e.p);if(!p)continue;
  const distance=(p.x-width/2)**2+(p.y-height/2)**2;
  if(distance<best||(distance===best&&p.z<depth)){target=e;best=distance;depth=p.z;}
 }
 return target;
}
function spawn(){if(encounter==='fight'||enemies.length>=140)return;const t=chooseEnemy(),z=player[2]+(180+Math.random()*40)*tunnelStretch();enemies.push({...t,p:sampleEntrance(z,COURSE_RADIUS-t.size),maxHp:t.hp,flash:0,age:0});}
function launch(){resetEncounter();boostToggled=false;syncBoostControl();player=[0,0,0];hp=100;kills=0;elapsed=0;spawnClock=0;fireClock=0;bombClock=0;missileClock=1/value('missile_rate',.2);invincible=2;enemies=[];bullets=[];enemyShots=[];particles=[];for(let i=0;i<stars.length;i++)stars[i]=newStar(Math.random()*420);for(let i=0;i<16;i++)spawn();started=true;dead=false;resume();}
function clearInput(){keys={};steer=[0,0];boost=false;brake=false;$('knob').style.transform='';}
function resume(){running=true;$('bossMessage').hidden=true;$('overlay').setAttribute('data-boss-result','false');$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');clearInput();syncMusic();}
function pause(){if(!running)return;running=false;clearInput();syncMusic();$('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');$('overlay').hidden=false;$('overlay').querySelector('h1').innerHTML='Flight<br><em>paused.</em>';$('launch').innerHTML='RESUME FLIGHT <span>↗</span>';}
$('launch').onclick=()=>started&&!dead?resume():launch();
$('pause').onclick=()=>{if(!started||dead||$('hangar').open)return;running?pause():resume();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
addEventListener('blur',()=>{clearInput();pause();});
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'SOUND ON':'SOUND OFF';syncMusic();};
function gameOver(){running=false;dead=true;save.best=Math.max(save.best,kills);persist();clearInput();syncMusic();$('overlay').hidden=false;$('overlay').querySelector('h1').innerHTML='Signal<br><em>lost.</em>';$('overlay').querySelector('p').textContent=`${kills} enemies eliminated · Best ${save.best}. Credits and upgrades retained.`;$('launch').innerHTML='RELAUNCH STARSHIP <span>↗</span>';}
const stick=$('stick');let stickPointer=null;
function moveStick(e){const r=stick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/42,y=(e.clientY-r.top-r.height/2)/42,m=Math.max(1,Math.hypot(x,y));steer=[x/m,y/m];$('knob').style.transform=`translate(${steer[0]*34}px,${steer[1]*34}px)`;}
stick.onpointerdown=e=>{if(!running||stickPointer!==null)return;stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);};
stick.onpointermove=e=>{if(e.pointerId===stickPointer)moveStick(e);};
function releaseStick(e){if(e.pointerId===stickPointer){stickPointer=null;steer=[0,0];$('knob').style.transform='';}}
stick.onpointerup=releaseStick;stick.onpointercancel=releaseStick;stick.onlostpointercapture=releaseStick;
for(const id of ['boost','brake']){const b=$(id);b.onpointerdown=e=>{if(!running)return;b.setPointerCapture(e.pointerId);if(id==='boost'){if(has('always_to_the_max'))toggleBoost();else boost=true;}else brake=true;};const release=()=>{if(id==='boost')boost=false;else brake=false;};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;}
addEventListener('keydown',e=>{if(e.target?.tagName==='SELECT')return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)&&!$('hangar').open)e.preventDefault();keys[e.code]=true;if(e.repeat)return;if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&has('always_to_the_max'))toggleBoost();if(e.code==='KeyP')$('pause').click();if(e.code==='Space'&&!$('hangar').open)bomb();});
addEventListener('keyup',e=>{keys[e.code]=false;});
function shoot(direction=forward,origin=add(player,mul(direction,3))){const critical=has('critical_ability')&&Math.random()*100<value('critical_chance',20);bullets.push({p:origin,v:mul(bulletDirection(direction),Math.max(100,shipSpeed()+100*(shipSpeed()>100?1:0))),life:2.8,critical,damage:3*(critical?1+value('critical_damage',100)/100:1)});}
function fireVolley(){
 const target=aimTarget(),count=value('bullet_number',1),spread=value('bullet_spread',0)*Math.PI/180;
 for(let i=0;i<count;i++){
  const direction=coneDirection(i,count,spread,forward,right,up);
  const origin=spread>0?add(player,mul(forward,3)):add(add(player,mul(direction,3)),mul(right,(i-(count-1)/2)*.45));
  // Resolve auto aim before adding the same baseline cone spread to every bullet.
  shoot(target?unit(sub(target.p,origin)):direction,origin);
 }
}
function boostActive(){if(encounter==='fight')return false;return has('always_to_the_max')?boostToggled:!!(boost||keys.ShiftLeft||keys.ShiftRight);}
function syncBoostControl(){
 const toggle=has('always_to_the_max');$('boost').disabled=encounter==='fight';
 $('boost').querySelector('small').textContent=toggle?(boostToggled?'BOOST ON':'BOOST OFF'):'BOOST';
 $('boost').setAttribute('aria-label',toggle?(boostToggled?'Turn boost off':'Turn boost on'):'Hold to boost');
 $('boost').setAttribute('aria-pressed',String(toggle&&boostToggled));if(encounter==='fight')$('boost').querySelector('small').textContent='LOCKED';
}
function toggleBoost(){if(!running||encounter==='fight')return;boostToggled=!boostToggled;syncBoostControl();}
function ludicrousEnabled(){return has('ludicrous_speed')&&save.ludicrousEnabled===true&&requirementMet(catalog.find(u=>u.id==='ludicrous_speed'));}
function ludicrousActive(){return ludicrousEnabled()&&boostActive()&&!(brake||keys.ControlLeft||keys.ControlRight);}
function tunnelStretch(){return ludicrousActive()?10:1;}
function modelStretch(){return ludicrousActive()?2:1;}
function boostMultiplier(){return ludicrousEnabled()?20:has('always_to_the_max')?value('curvature',1):1;}
function shipSpeed(){if(encounter==='fight')return 12;return brake||keys.ControlLeft||keys.ControlRight?2:boostActive()?(has('always_to_the_max')?64:32)*boostMultiplier():12;}
function hitsStretchedEnemy(a,b,e){
 const unstretch=p=>[p[0],p[1],e.p[2]+(p[2]-e.p[2])/modelStretch()];
 return hitsEnemy(unstretch(a),unstretch(b),e);
}
syncBoostControl();
function fireMissiles(){
 const reserved=new Set(bullets.filter(b=>b.missile&&b.life>0).map(b=>b.target));
 const targets=enemies.filter(e=>e.hp>0&&e.p[2]>player[2]&&!reserved.has(e)).sort((a,b)=>length(sub(a.p,player))-length(sub(b.p,player))).slice(0,value('missile_amount',1));
 for(const target of targets){
  const p=add(player,mul(forward,2));
  bullets.push({missile:true,target,p,v:mul(forward,shipSpeed()*2),age:0,life:8,damage:value('missile_damage',3)});
 }
 if(targets.length)play('shot');
}
function updateSystems(dt){
 if(has('hull_regen')&&hp>0)hp=Math.min(100,hp+dt);
 if(has('guided_missiles')){
  missileClock-=dt;
  if(missileClock<=0){fireMissiles();missileClock=1/value('missile_rate',.2);}
 }
}
function updateEnemyWeapons(dt){
 for(const e of enemies){
  if(e.name==='big_boss'){if(e.hp>0)updateBigBoss(e,dt);continue;}
  const boss=e.name==='boss';
  if(e.hp<=0||e.p[2]<=player[2]||(!boss&&e.name!=='special_ops'&&e.name!=='stealth'))continue;
  const interval=boss?2:3;
  e.fireClock=(e.fireClock??interval)-dt;
  if(e.fireClock>1e-9)continue;
  e.fireClock+=interval;
  const p=add(e.p,[0,0,-e.size/2-.5]),direction=boss?unit(sub(player,p)):[0,0,-1];
  enemyShots.push({p,v:mul(direction,boss?25:35),life:12,cube:boss,size:boss?1.6:.35,damage:boss?20:10,color:boss?'#ff3535':e.name==='special_ops'?'#ffb65c':'#e68cff'});
 }
}
function updateEnemyShots(dt,previousPlayer=player){
 for(const shot of enemyShots){
  const previous=shot.p;shot.p=add(shot.p,mul(shot.v,dt));shot.life-=dt;
  // Relative swept collision catches both fast projectiles and a strafing ship.
  if(segmentHitsSphere(sub(previous,previousPlayer),sub(shot.p,player),[0,0,0],1.2+shot.size/2)){
   shot.life=0;
   if(invincible<=0){hp=Math.max(0,hp-shot.damage);invincible=1.2;burst(player,shot.color,12);if(hp===0){gameOver();return;}}
  }
 }
 enemyShots=enemyShots.filter(s=>s.life>0&&s.p[2]>player[2]-12);
}
function bomb(){if(!running)return;if(!save.bombs.length){toast('Unlock a bomb in the upgrade hangar');return;}if(bombClock>0)return;bombClock=18;if(save.bomb==='smart'){for(let i=0;i<50;i++)spawn();toast('Smart bomb · 50 hostiles deployed');}else{for(let i=0;i<90;i++){const z=1-2*(i+.5)/90,a=i*2.399963;shoot([Math.sqrt(1-z*z)*Math.cos(a),z,Math.sqrt(1-z*z)*Math.sin(a)]);}toast('Screen bomb · radial barrage');}play('boss');}
$('bomb').onclick=bomb;
function burst(p,color,n=10){for(let i=0;i<n;i++)particles.push({p:[...p],v:mul(unit([Math.random()-.5,Math.random()-.5,Math.random()-.5]),8+Math.random()*10),life:.7,color});}
function update(dt){
 updateEncounter(dt);
 const previousPlayer=[...player];
 elapsed+=dt;invincible=Math.max(0,invincible-dt);
 const strafe=[steer[0]+((keys.ArrowRight||keys.KeyD||keys.KeyE)?1:0)-((keys.ArrowLeft||keys.KeyA||keys.KeyQ)?1:0),-steer[1]+((keys.ArrowUp||keys.KeyW)?1:0)-((keys.ArrowDown||keys.KeyS)?1:0)];
 const inputLength=Math.max(1,Math.hypot(...strafe));
 const speed=shipSpeed();
 const bombRechargeRate=speed>12?2:1;
 bombClock=Math.max(0,bombClock-dt*bombRechargeRate);
 player=add(player,[strafe[0]/inputLength*18*dt,strafe[1]/inputLength*18*dt,speed*dt]);
 const radius=Math.hypot(player[0],player[1]);if(radius>COURSE_RADIUS-3){player[0]*=(COURSE_RADIUS-3)/radius;player[1]*=(COURSE_RADIUS-3)/radius;toastBoundary();}
 basis();updateStars();
 $('courseDistance').textContent=`${Math.floor(player[2]).toLocaleString()} m`;
 spawnClock-=dt*(speed===12?1:2);if(spawnClock<=0){spawn();spawnClock+=Math.max(.1,value('spawn_rate',1.2));}
 updateSystems(dt);
 fireClock-=dt;if(fireClock<=0){
   fireVolley();
   fireClock=1/value('fire_rate',.5);play('shot');
 }
 for(const e of enemies){e.age+=dt;e.flash=Math.max(0,e.flash-dt);const enemyPrevious=[...e.p];if(e.name==='big_boss')e.p[2]=player[2]+90;else e.p[2]-=e.speed*dt;const relativeStart=sub(previousPlayer,enemyPrevious),relativeEnd=sub(player,e.p);relativeStart[2]/=modelStretch();relativeEnd[2]/=modelStretch();if(e.age>.8&&segmentHitsSphere(relativeStart,relativeEnd,[0,0,0],enemyRadius(e)+1.2)&&invincible<=0){hp-=e.name==='boss'?35:15;invincible=1.2;burst(player,'#ff886d');if(hp<=0){hp=0;gameOver();return;}}}
 updateEnemyWeapons(dt);
 updateEnemyShots(dt,previousPlayer);if(!running)return;
 for(const b of bullets){
  if(b.missile){
   if(b.target.hp<=0||b.target.p[2]<player[2]-8||!enemies.includes(b.target)){b.life=0;continue;}
   // Clear the launcher straight ahead before gradually steering toward the target.
   if(b.age>=.2){
    const heading=unit(b.v),desired=unit(sub(b.target.p,b.p));
    const cosine=Math.max(-1,Math.min(1,dot(heading,desired))),angle=Math.acos(cosine);
    let direction=desired;
    if(angle>3*dt){
     let tangent=sub(desired,mul(heading,cosine));
     if(length(tangent)<1e-6){const axis=Math.abs(heading[1])<.9?[0,1,0]:[1,0,0];tangent=sub(axis,mul(heading,dot(axis,heading)));}
     direction=add(mul(heading,Math.cos(3*dt)),mul(unit(tangent),Math.sin(3*dt)));
    }
    b.v=mul(direction,length(b.v)+(Math.max(55,shipSpeed()*2)-length(b.v))*(1-Math.exp(-2*dt)));
   }
   b.age+=dt;
  }
  const previous=b.p;b.p=add(b.p,mul(b.v,dt));b.life-=dt;
  for(const e of enemies){if(e.hp<=0||(b.missile&&e!==b.target))continue;if(hitsStretchedEnemy(previous,b.p,e)){b.life=0;e.hp-=b.damage;e.flash=.14;burst(b.p,b.missile?'#ffb65c':b.critical?'#ff6477':'#b4ffe3',b.missile?12:3);if(e.hp<=0){kills++;save.money+=e.bounty;burst(e.p,e.color,e.name==='boss'?40:15);play(e.name==='boss'||e.name==='big_boss'?'boss':'hit');persist();if(e.name==='big_boss'){defeatBigBoss();return;}}break;}}
 }
 enemies=enemies.filter(e=>e.hp>0&&e.p[2]>player[2]-8);bullets=bullets.filter(b=>b.life>0);
 for(const p of particles){p.life-=dt;p.p=add(p.p,mul(p.v,dt));}particles=particles.filter(p=>p.life>0);
 $('health').textContent=`${Math.ceil(hp)}%`;$('healthBar').style.width=`${hp}%`;$('healthBar').style.background=hp<35?'#ff886d':'#a7f9d7';
 $('kills').textContent=`${kills} ELIMINATED`;$('position').textContent=player.map((v,i)=>`${'XYZ'[i]} ${Math.round(v)}`).join(' / ');$('speed').textContent=`${ludicrousActive()?'LUDICROUS':speed>12?'BOOST':speed===2?'BRAKE':'CRUISE'} · ${speed} m/s`;
 $('bomb').querySelector('small').textContent=bombClock>0?`${Math.ceil(bombClock/bombRechargeRate)}s`:'BOMB';
}
let boundaryTime=0;function toastBoundary(){if(elapsed-boundaryTime>3){toast('Tunnel wall · strafe toward the center');boundaryTime=elapsed;}}
function line(a,b,color){const p=project(a),q=project(b);if(!p||!q)return;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
function polygon(points,fill,stroke){if(points.some(p=>!p))return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.stroke();}
function renderStars(warp,speed){
 const trail=speed*.3;
 ctx.beginPath();
 for(const s of stars){
  const head=project(s);if(!head)continue;
  const tail=project([s[0],s[1],s[2]+trail]);if(!tail)continue;
  // Skip segments wholly outside the screen; retain trails crossing its edges.
  if((head.x< -8&&tail.x< -8)||(head.x>width+8&&tail.x>width+8)||(head.y< -8&&tail.y< -8)||(head.y>height+8&&tail.y>height+8))continue;
  ctx.moveTo(head.x,head.y);ctx.lineTo(tail.x,tail.y);
 }
 ctx.strokeStyle='#acc6e4';
 if(warp){ctx.filter='blur(2px)';ctx.globalAlpha=.4;ctx.lineWidth=3;ctx.stroke();}
 ctx.filter='none';ctx.globalAlpha=.65;ctx.lineWidth=1.2;ctx.stroke();
 ctx.globalAlpha=1;ctx.lineWidth=1;
}
function render(){
 const warp=ludicrousActive(),speed=shipSpeed(),stretch=warp?2:1,courseStretch=warp?10:1,visibleEnemies=has('better_visible');
 ctx.fillStyle='#060c19';ctx.fillRect(0,0,width,height);
 if(has('beautiful_universe')){const g=ctx.createRadialGradient(width*.7,height*.35,0,width*.6,height*.4,width*.8);g.addColorStop(0,'#3a235566');g.addColorStop(.5,'#10394444');g.addColorStop(1,'#060c1900');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);}
 renderStars(warp,speed);
 const near=Math.max(0,player[2]-(cameraMode==='strategic'?60:5)),far=player[2]+240*courseStretch,ringSpacing=30*courseStretch;
 const ring=(z,color)=>{for(let j=0;j<48;j++){const point=a=>[COURSE_RADIUS*Math.cos(a),COURSE_RADIUS*Math.sin(a),z];line(point(j*Math.PI/24),point((j+1)*Math.PI/24),color);}};
 for(let z=Math.ceil(near/ringSpacing)*ringSpacing;z<=far;z+=ringSpacing)ring(z,'#5799b04a');
 for(let j=0;j<12;j++){const a=j*Math.PI/6,x=COURSE_RADIUS*Math.cos(a),y=COURSE_RADIUS*Math.sin(a);line([x,y,near],[x,y,far],'#467f9138');}
 const meshes=[];
 for(const e of [...enemies,...enemyShots.filter(s=>s.cube).map(s=>({...s,name:'very_small',flash:0}))]){
  const mesh=ENEMY_MESHES[e.name]||ENEMY_MESHES.very_small,verts=mesh.vertices.map(v=>{
   let [x,y,z]=v;
   if(e.name==='big_boss'){const a=e.rotation||0,c=Math.cos(a),s=Math.sin(a);[x,z]=[x*c-z*s,x*s+z*c];const c2=Math.cos(a*.5),s2=Math.sin(a*.5);[x,y]=[x*c2-y*s2,x*s2+y*c2];}
   return project([e.p[0]+x*e.size,e.p[1]+y*e.size,e.p[2]+z*e.size*(e.cube?1:stretch)]);
  });
  for(let f=0;f<mesh.faces.length;f++){
   const pts=mesh.faces[f].map(i=>verts[i]);if(pts.some(p=>!p))continue;
   if(pts.every(p=>p.x<0)||pts.every(p=>p.x>width)||pts.every(p=>p.y<0)||pts.every(p=>p.y>height))continue;
   const silver=e.name==='big_boss'?Math.round(130+115*Math.pow(Math.max(0,Math.cos(f*1.7+(e.rotation||0))),4)):0;
   meshes.push({pts,z:pts.reduce((s,p)=>s+p.z,0)/pts.length,color:e.flash?'#d7fff0':e.name==='big_boss'?`rgb(${silver},${Math.min(255,silver+5)},${Math.min(255,silver+12)})`:e.color,stroke:e.name==='big_boss'?'#f1f7ff':visibleEnemies?'#ffb58c':e.name==='stealth'?'#4c5a70':'#aabed16b',shade:e.name==='big_boss'?1:.5+(f%5)*.09});
  }
 }
 meshes.sort((a,b)=>b.z-a.z);for(const f of meshes){polygon(f.pts,f.color,f.stroke);ctx.globalAlpha=1-f.shade;polygon(f.pts,'#020814','#00000000');ctx.globalAlpha=1;}
 for(const e of enemies){if(e.name!=='big_boss'||e.hp<=0)continue;const p=project(add(e.p,[0,0,-e.size/2]));if(p){ctx.save();ctx.font=`bold ${Math.max(16,Math.min(40,focal*8/p.z))}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle='#122033';ctx.fillStyle='#ffffff';const label=e.spinRemaining>0?'?':String(e.roll??'D20');ctx.strokeText(label,p.x,p.y);ctx.fillText(label,p.x,p.y);ctx.restore();}}
 for(const s of enemyShots){if(s.cube)continue;line(s.p,sub(s.p,mul(unit(s.v),2)),s.color);const p=project(s.p);if(p){ctx.fillStyle=s.color;ctx.fillRect(p.x-2,p.y-2,4,4);}}
 for(const b of bullets){line(b.p,sub(b.p,mul(unit(b.v),b.missile?5:2.3)),b.missile?'#ffb65c':b.critical?'#ff5069':'#b3ffdf');const p=project(b.p);if(p){ctx.fillStyle=b.missile?'#ffe0a0':b.critical?'#ff5069':'#ddfff0';ctx.fillRect(p.x-1,p.y-1,b.missile?5:3,b.missile?5:3);}}
 for(const p of particles){const q=project(p.p);if(q){ctx.globalAlpha=Math.max(0,p.life/.7);ctx.fillStyle=p.color;ctx.fillRect(q.x,q.y,Math.min(5,30/q.z),Math.min(5,30/q.z));}}ctx.globalAlpha=1;
 // The ship always faces the cylinder's exit; controls only translate its position.
 const shipPoint=(x,y,z)=>project([player[0]+x,player[1]+y,player[2]+z*stretch]);
 const ship=[shipPoint(0,.2,2.7),shipPoint(-1.9,-.1,-1.3),shipPoint(0,.6,-.7),shipPoint(1.9,-.1,-1.3),shipPoint(0,-.3,-1.8)];
 if(cameraMode!=='first'&&(invincible<=0||Math.floor(elapsed*12)%2===0)){polygon([ship[0],ship[1],ship[2]],has('fancy_ship')?'#8bffe2':'#597786','#c0ffef');polygon([ship[0],ship[2],ship[3]],'#284b61','#9be7dc');polygon([ship[1],ship[4],ship[3],ship[2]],'#233a52','#79a9ba');polygon([shipPoint(-.45,-.05,-1.4),shipPoint(.45,-.05,-1.4),shipPoint(0,-.1,-2.5-(shipSpeed()>12?2:0)-Math.random()*.6)],'#a7ffdf','#ccffea');if(has('fancy_ship')){line(add(player,mul(right,-2.2)),add(player,mul(forward,1.5)),'#8effe0');line(add(player,mul(right,2.2)),add(player,mul(forward,1.5)),'#8effe0');}}
 const target=aimTarget();
 $('reticle').querySelector('span').textContent=target?'TARGET LOCK':autoAimEnabled()?'AUTO FIRE':'AIM OFF';
 $('reticle').style.borderColor=target?'#a7f9d7':'';
 $('target').textContent=target?`${target.name.replaceAll('_',' ').toUpperCase()} · ${Math.ceil(target.hp)} HP · ${Math.round(length(sub(target.p,player)))} m`:'';
 // Bearing hints keep enemies discoverable even when behind the ship.
 const nearest=[...enemies].sort((a,b)=>length(sub(a.p,player))-length(sub(b.p,player))).slice(0,5);
 for(const e of nearest){const p=project(e.p);if(p&&p.x>30&&p.x<width-30&&p.y>185&&p.y<height-180)continue;const v=sub(e.p,camera),angle=Math.atan2(-dot(v,viewUp),dot(v,viewRight));const x=width/2+Math.cos(angle)*(width*.42),y=height/2+Math.sin(angle)*(height*.27);ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#f5a08288';ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-3,-3);ctx.lineTo(-3,3);ctx.fill();ctx.restore();}
 const bigBoss=enemies.find(e=>e.name==='big_boss'&&e.hp>0);if(bigBoss){$('bossHealth').textContent=`${Math.ceil(bigBoss.hp)} / 1000 HP`;$('bossRoll').textContent=bigBoss.spinRemaining>0?'ROLLING?':bigBoss.roll===null?'D20':String(bigBoss.roll);}
 $('money').textContent=save.money.toLocaleString();$('enemyCount').textContent=`${enemies.length} HOSTILES`;
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(running)update(dt);basis();render();requestAnimationFrame(frame);}basis();requestAnimationFrame(frame);
let resumeAfterShop=false;
$('shop').onclick=()=>{resumeAfterShop=running;running=false;clearInput();syncMusic();renderShop();$('hangar').showModal();};
$('closeShop').onclick=()=>$('hangar').close();$('hangar').addEventListener('close',()=>{if(resumeAfterShop)resume();});
$('sort').onclick=()=>{sorted=!sorted;renderShop();};
function requirementMet(u){if(!u)return false;if(u.requiresLevel&&level(u.requiresLevel.id)<u.requiresLevel.level)return false;if(!u.requires)return true;return catalog.some(item=>item.storage?.flag===u.requires&&has(item.id));}
function renderShop(){
 $('shopMoney').textContent=`${save.money.toLocaleString()} credits`;$('sort').hidden=!has('sort_shop');$('catalog').replaceChildren();
 if(!catalog.length){$('catalog').textContent='Catalog could not load. Run the game through the local server and reload.';return;}
 const list=[...catalog];if(sorted)list.sort((a,b)=>(a.type==='multi'?50:upgradeCost(a,level(a.id)))-(b.type==='multi'?50:upgradeCost(b,level(b.id))));
 for(const u of list){
  if(u.hideUntilReady&&!requirementMet(u))continue;
  if(u.type==='multi'){for(const option of u.options)addCard(u,option);continue;}addCard(u);
 }
}
function addCard(u,option){
 const lv=level(u.id),owned=option?save.bombs.includes(option.id):u.type==='toggle'&&lv>0;
 const maxed=(u.type==='linear'||u.type==='steps')&&upgradeValue(u,lv)===upgradeValue(u,lv+1);
 const cost=option?option.cost:upgradeCost(u,lv),locked=!requirementMet(u);
 const row=document.createElement('div');row.className='upgrade';const info=document.createElement('div'),title=document.createElement('h3'),desc=document.createElement('p'),meta=document.createElement('small'),button=document.createElement('button');
 title.textContent=option?`${u.name} · ${option.name}`:u.name;desc.textContent=option?option.description:u.description;
 meta.textContent=locked?`Requires ${catalog.find(item=>item.storage?.flag===u.requires)?.name||u.requires}`:u.type==='linear'?`LEVEL ${lv} · ${Number(upgradeValue(u,lv).toFixed(2))}`:owned?'UNLOCKED':'';
 if(u.type==='steps')meta.textContent=`LEVEL ${lv}/${u.values.length} · ${upgradeValue(u,lv)}x boost`+(maxed?'':` → ${upgradeValue(u,lv+1)}x`);
 info.append(title,desc,meta);button.textContent=option&&owned?(save.bomb===option.id?'Selected':'Equip'):owned?'Installed':maxed?'Maximum':`${cost.toLocaleString()} cr`;
 button.disabled=!!(locked||maxed||(!option&&owned)||(!owned&&save.money<cost)||(option&&owned&&save.bomb===option.id));
 if(u.id==='auto_aim_control'&&owned){
  button.disabled=false;button.textContent=autoAimEnabled()?'Disable':'Enable';
  button.setAttribute('aria-pressed',String(autoAimEnabled()));meta.textContent=autoAimEnabled()?'AUTO AIM ON':'AUTO AIM OFF';
 }
 if(u.id==='ludicrous_speed'&&owned){button.disabled=false;button.textContent=ludicrousEnabled()?'Disable':'Enable';button.setAttribute('aria-pressed',String(ludicrousEnabled()));meta.textContent=ludicrousEnabled()?'20x BOOST ENABLED':'DISABLED';}
 button.onclick=()=>{
   if(u.id==='ludicrous_speed'&&owned){save.ludicrousEnabled=!ludicrousEnabled();persist();renderShop();return;}
   if(u.id==='auto_aim_control'&&owned){save.autoAimEnabled=!autoAimEnabled();persist();renderShop();return;}
   if(option&&owned){save.bomb=option.id;persist();renderShop();return;}
   if(save.money<cost||!requirementMet(u)||maxed||(!option&&owned))return;
   save.money-=cost;
   if(option){save.bombs.push(option.id);save.bomb=option.id;}
   else if(u.type==='special'){save={money:1000000,levels:{},bombs:[],bomb:'screen',best:save.best,autoAimEnabled:true,ludicrousEnabled:false};}
   else save.levels[u.id]=lv+1;
   if(u.id==='ludicrous_speed')save.ludicrousEnabled=true;
   if(u.id==='guided_missiles'||u.id==='missile_rate'||u.type==='special')missileClock=1/value('missile_rate',.2);
   if(u.type==='special')bullets=bullets.filter(b=>!b.missile);
   if(u.id==='always_to_the_max'||u.type==='special')boostToggled=false;
   syncBoostControl();syncAimCircle();syncCameraUnlocks();persist();play('buy');renderShop();
 };row.append(info,button);$('catalog').append(row);
}
