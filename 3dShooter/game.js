import {RADII,ARENA_UPGRADES,sampleEllipsoid,chooseEnemy,add,sub,mul,dot,length,unit,segmentHitsBox,upgradeCost,upgradeValue} from './core.mjs';
const $=id=>document.getElementById(id), canvas=$('space'), ctx=canvas.getContext('2d');
const KEY='void-wing.arena.v1';
let save={money:0,levels:{},bombs:[],bomb:'screen',best:0};
try { const s=JSON.parse(localStorage.getItem(KEY)); if(s&&Number.isFinite(s.money)&&s.money>=0) save={...save,...s}; }catch{}
save.levels=save.levels&&typeof save.levels==='object'?save.levels:{};
save.bombs=Array.isArray(save.bombs)?save.bombs:[];
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch{toast('Storage unavailable · progress lasts this session');}}
let catalog=[...ARENA_UPGRADES], running=false, started=false, dead=false, sound=false, sorted=false;
let missileClock=5;
let player=[0,0,-20],yaw=0,pitch=0,hp=100,kills=0,elapsed=0,spawnClock=0,fireClock=0,bombClock=0,invincible=0;
let enemies=[],bullets=[],particles=[],keys={},steer=[0,0],boost=false,brake=false;
let width=0,height=0,focal=0,camera=[0,0,-32],forward=[0,0,1],right=[1,0,0],up=[0,1,0];
const stars=Array.from({length:550},()=>mul(unit([Math.random()-.5,Math.random()-.5,Math.random()-.5]),600));
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
  try{const res=await fetch('../shooter/upgrades.json');if(!res.ok)throw Error(res.status);catalog=[...(await res.json()).upgrades.filter(u=>u.id!=='ad_movement'),...ARENA_UPGRADES];syncAimCircle();$('loading').textContent='Systems ready. Your arena awaits.';}
  catch{$('loading').textContent='Upgrade catalog unavailable. Serve this folder over HTTP and reload.';}
}
loadCatalog();
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);focal=Math.min(width,height)*.95;}
addEventListener('resize',resize);resize();
function basis(){forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];right=[Math.cos(yaw),0,-Math.sin(yaw)];up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch)];camera=add(sub(player,mul(forward,12)),mul(up,3));}
function project(p){const v=sub(p,camera),z=dot(v,forward);return z>.3?{x:width/2+dot(v,right)*focal/z,y:height/2-dot(v,up)*focal/z,z}:null;}
function aimTarget(){
 let target=null,best=(value('aim_size',48)/2)**2,depth=Infinity;
 for(const e of enemies){
  if(e.hp<=0||dot(sub(e.p,player),forward)<=0)continue;
  const p=project(e.p);if(!p)continue;
  const distance=(p.x-width/2)**2+(p.y-height/2)**2;
  if(distance<best||(distance===best&&p.z<depth)){target=e;best=distance;depth=p.z;}
 }
 return target;
}
function spawn(){if(enemies.length>=140)return;const t=chooseEnemy();enemies.push({...t,p:sampleEllipsoid(),maxHp:t.hp,flash:0,age:0});}
function launch(){player=[0,0,-20];yaw=0;pitch=0;hp=100;kills=0;elapsed=0;spawnClock=0;fireClock=0;bombClock=0;missileClock=1/value('missile_rate',.2);invincible=2;enemies=[];bullets=[];particles=[];for(let i=0;i<16;i++)spawn();started=true;dead=false;resume();}
function clearInput(){keys={};steer=[0,0];boost=false;brake=false;$('knob').style.transform='';}
function resume(){running=true;$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');clearInput();syncMusic();}
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
for(const id of ['boost','brake']){const b=$(id);b.onpointerdown=e=>{if(!running)return;b.setPointerCapture(e.pointerId);if(id==='boost')boost=true;else brake=true;};const release=()=>{if(id==='boost')boost=false;else brake=false;};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)&&!$('hangar').open)e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyP')$('pause').click();if(e.code==='Space'&&!$('hangar').open)bomb();});
addEventListener('keyup',e=>{keys[e.code]=false;});
function shoot(direction=forward){const critical=has('critical_ability')&&Math.random()*100<value('critical_chance',20);bullets.push({p:add(player,mul(direction,3)),v:mul(direction,100),life:2.8,critical,damage:3*(critical?1+value('critical_damage',100)/100:1)});}
function fireVolley(){
 const target=aimTarget(),count=value('bullet_number',1),spread=value('bullet_spread',0)*Math.PI/180;
 for(let i=0;i<count;i++){
  const angle=count===1?0:(i/(count-1)-.5)*spread;
  const direction=unit(add(forward,mul(right,Math.tan(angle))));
  shoot(direction);
  const bullet=bullets[bullets.length-1];
  bullet.p=add(bullet.p,mul(right,(i-(count-1)/2)*.45));
  // Aim from each actual muzzle position so even upgraded volleys converge on the center.
  if(target)bullet.v=mul(unit(sub(target.p,bullet.p)),100);
 }
}
function shipSpeed(){return brake||keys.ControlLeft||keys.ControlRight?2:boost||keys.ShiftLeft||keys.ShiftRight?32:12;}
function fireMissiles(){
 const reserved=new Set(bullets.filter(b=>b.missile&&b.life>0).map(b=>b.target));
 const targets=enemies.filter(e=>e.hp>0&&!reserved.has(e)).sort((a,b)=>length(sub(a.p,player))-length(sub(b.p,player))).slice(0,value('missile_amount',1));
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
function bomb(){if(!running)return;if(!save.bombs.length){toast('Unlock a bomb in the upgrade hangar');return;}if(bombClock>0)return;bombClock=18;if(save.bomb==='smart'){for(let i=0;i<50;i++)spawn();toast('Smart bomb · 50 hostiles deployed');}else{for(let i=0;i<90;i++){const z=1-2*(i+.5)/90,a=i*2.399963;shoot([Math.sqrt(1-z*z)*Math.cos(a),z,Math.sqrt(1-z*z)*Math.sin(a)]);}toast('Screen bomb · radial barrage');}play('boss');}
$('bomb').onclick=bomb;
function burst(p,color,n=10){for(let i=0;i<n;i++)particles.push({p:[...p],v:mul(unit([Math.random()-.5,Math.random()-.5,Math.random()-.5]),8+Math.random()*10),life:.7,color});}
function update(dt){
 elapsed+=dt;invincible=Math.max(0,invincible-dt);bombClock=Math.max(0,bombClock-dt);
 yaw+=(steer[0]+((keys.ArrowRight||keys.KeyD)?1:0)-((keys.ArrowLeft||keys.KeyA)?1:0))*dt*1.6;
 pitch=Math.max(-1.4,Math.min(1.4,pitch+(-steer[1]+((keys.ArrowUp||keys.KeyW)?1:0)-((keys.ArrowDown||keys.KeyS)?1:0))*dt*1.25));basis();
 const speed=shipSpeed();
 player=add(player,mul(forward,speed*dt));
 player=add(player,mul(right,((keys.KeyE?1:0)-(keys.KeyQ?1:0))*18*dt));
 const radius=Math.hypot(...player.map((v,i)=>v/RADII[i]));if(radius>.97){player=mul(player,.97/radius);toastBoundary();}basis();
 spawnClock-=dt;if(spawnClock<=0){spawn();spawnClock=Math.max(.1,value('spawn_rate',1.2));}
 updateSystems(dt);
 fireClock-=dt;if(fireClock<=0){
   fireVolley();
   fireClock=1/value('fire_rate',.5);play('shot');
 }
 for(const e of enemies){e.age+=dt;e.flash=Math.max(0,e.flash-dt);e.p=add(e.p,mul(unit(sub(player,e.p)),e.speed*dt));if(e.age>.8&&length(sub(e.p,player))<e.size*.87+1.2&&invincible<=0){hp-=e.name==='boss'?35:15;invincible=1.2;burst(player,'#ff886d');if(hp<=0){hp=0;gameOver();return;}}}
 for(const b of bullets){
  if(b.missile){
   if(b.target.hp<=0||!enemies.includes(b.target)){b.life=0;continue;}
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
    b.v=mul(direction,length(b.v)+(55-length(b.v))*(1-Math.exp(-2*dt)));
   }
   b.age+=dt;
  }
  const previous=b.p;b.p=add(b.p,mul(b.v,dt));b.life-=dt;
  for(const e of enemies){if(e.hp<=0||(b.missile&&e!==b.target))continue;if(segmentHitsBox(previous,b.p,e.p,e.size/2+.15)){b.life=0;e.hp-=b.damage;e.flash=.14;burst(b.p,b.missile?'#ffb65c':b.critical?'#ff6477':'#b4ffe3',b.missile?12:3);if(e.hp<=0){kills++;save.money+=e.bounty;burst(e.p,e.color,e.name==='boss'?40:15);play(e.name==='boss'?'boss':'hit');persist();}break;}}
 }
 enemies=enemies.filter(e=>e.hp>0);bullets=bullets.filter(b=>b.life>0);
 for(const p of particles){p.life-=dt;p.p=add(p.p,mul(p.v,dt));}particles=particles.filter(p=>p.life>0);
 $('health').textContent=`${Math.ceil(hp)}%`;$('healthBar').style.width=`${hp}%`;$('healthBar').style.background=hp<35?'#ff886d':'#a7f9d7';
 $('kills').textContent=`${kills} ELIMINATED`;$('position').textContent=player.map((v,i)=>`${'XYZ'[i]} ${Math.round(v)}`).join(' / ');$('speed').textContent=`${speed===32?'BOOST':speed===2?'BRAKE':'CRUISE'} · ${speed} m/s`;
 $('bomb').querySelector('small').textContent=bombClock>0?`${Math.ceil(bombClock)}s`:'BOMB';
}
let boundaryTime=0;function toastBoundary(){if(elapsed-boundaryTime>3){toast('Arena boundary · steer back toward the center');boundaryTime=elapsed;}}
const faces=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
function line(a,b,color){const p=project(a),q=project(b);if(!p||!q)return;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
function polygon(points,fill,stroke){if(points.some(p=>!p))return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.stroke();}
function render(){
 ctx.fillStyle='#060c19';ctx.fillRect(0,0,width,height);
 if(has('beautiful_universe')){const g=ctx.createRadialGradient(width*.7,height*.35,0,width*.6,height*.4,width*.8);g.addColorStop(0,'#3a235566');g.addColorStop(.5,'#10394444');g.addColorStop(1,'#060c1900');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);}
 for(const s of stars){const p=project(s);if(!p)continue;ctx.fillStyle='#acc6e4';ctx.globalAlpha=.25+(p.z/750)*.6;ctx.fillRect(p.x,p.y,p.z>400?1:1.5,p.z>400?1:1.5);}ctx.globalAlpha=1;
 for(let latitude=-2;latitude<=2;latitude++){const lat=latitude*Math.PI/6;for(let j=0;j<64;j++){const point=a=>[RADII[0]*Math.cos(lat)*Math.cos(a),RADII[1]*Math.sin(lat),RADII[2]*Math.cos(lat)*Math.sin(a)];line(point(j*Math.PI/32),point((j+1)*Math.PI/32),'#467f9126');}}
 for(let j=0;j<12;j++){const a=j*Math.PI/6;for(let i=0;i<32;i++){const point=t=>[RADII[0]*Math.cos(t)*Math.cos(a),RADII[1]*Math.sin(t),RADII[2]*Math.cos(t)*Math.sin(a)];line(point(i*Math.PI/32-Math.PI/2),point((i+1)*Math.PI/32-Math.PI/2),'#467f911c');}}
 const meshes=[];
 for(const e of enemies){const verts=Array.from({length:8},(_,i)=>add(e.p,[(i&1?1:-1)*e.size/2,(i&2?1:-1)*e.size/2,(i&4?1:-1)*e.size/2]));for(let f=0;f<6;f++){const pts=faces[f].map(i=>project(verts[i]));if(pts.some(p=>!p))continue;meshes.push({pts,z:pts.reduce((s,p)=>s+p.z,0)/4,color:e.flash?'#d7fff0':e.color,stroke:has('better_visible')?'#ffb58c':e.name==='stealth'?'#283547':'#aabed16b',shade:.45+f*.085});}}
 meshes.sort((a,b)=>b.z-a.z);for(const f of meshes){polygon(f.pts,f.color,f.stroke);ctx.globalAlpha=1-f.shade;polygon(f.pts,'#020814','#00000000');ctx.globalAlpha=1;}
 for(const b of bullets){line(b.p,sub(b.p,mul(unit(b.v),b.missile?5:2.3)),b.missile?'#ffb65c':b.critical?'#ff5069':'#b3ffdf');const p=project(b.p);if(p){ctx.fillStyle=b.missile?'#ffe0a0':b.critical?'#ff5069':'#ddfff0';ctx.fillRect(p.x-1,p.y-1,b.missile?5:3,b.missile?5:3);}}
 for(const p of particles){const q=project(p.p);if(q){ctx.globalAlpha=Math.max(0,p.life/.7);ctx.fillStyle=p.color;ctx.fillRect(q.x,q.y,Math.min(5,30/q.z),Math.min(5,30/q.z));}}ctx.globalAlpha=1;
 // A model in world space, viewed by the chase camera, follows pitch and yaw.
 const shipPoint=(x,y,z)=>project(add(player,add(mul(right,x),add(mul(up,y),mul(forward,z)))));
 const ship=[shipPoint(0,.2,2.7),shipPoint(-1.9,-.1,-1.3),shipPoint(0,.6,-.7),shipPoint(1.9,-.1,-1.3),shipPoint(0,-.3,-1.8)];
 if(invincible<=0||Math.floor(elapsed*12)%2===0){polygon([ship[0],ship[1],ship[2]],has('fancy_ship')?'#8bffe2':'#597786','#c0ffef');polygon([ship[0],ship[2],ship[3]],'#284b61','#9be7dc');polygon([ship[1],ship[4],ship[3],ship[2]],'#233a52','#79a9ba');polygon([shipPoint(-.45,-.05,-1.4),shipPoint(.45,-.05,-1.4),shipPoint(0,-.1,-2.5-(boost||keys.ShiftLeft||keys.ShiftRight?2:0)-Math.random()*.6)],'#a7ffdf','#ccffea');if(has('fancy_ship')){line(add(player,mul(right,-2.2)),add(player,mul(forward,1.5)),'#8effe0');line(add(player,mul(right,2.2)),add(player,mul(forward,1.5)),'#8effe0');}}
 const target=aimTarget();
 $('reticle').querySelector('span').textContent=target?'TARGET LOCK':'AUTO FIRE';
 $('reticle').style.borderColor=target?'#a7f9d7':'';
 $('target').textContent=target?`${target.name.replaceAll('_',' ').toUpperCase()} · ${Math.ceil(target.hp)} HP · ${Math.round(length(sub(target.p,player)))} m`:'';
 // Bearing hints keep enemies discoverable even when behind the ship.
 const nearest=[...enemies].sort((a,b)=>length(sub(a.p,player))-length(sub(b.p,player))).slice(0,5);
 for(const e of nearest){const p=project(e.p);if(p&&p.x>30&&p.x<width-30&&p.y>185&&p.y<height-180)continue;const v=sub(e.p,camera),angle=Math.atan2(-dot(v,up),dot(v,right));const x=width/2+Math.cos(angle)*(width*.42),y=height/2+Math.sin(angle)*(height*.27);ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#f5a08288';ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-3,-3);ctx.lineTo(-3,3);ctx.fill();ctx.restore();}
 $('money').textContent=save.money.toLocaleString();$('enemyCount').textContent=`${enemies.length} HOSTILES`;
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(running)update(dt);basis();render();requestAnimationFrame(frame);}basis();requestAnimationFrame(frame);
let resumeAfterShop=false;
$('shop').onclick=()=>{resumeAfterShop=running;running=false;clearInput();syncMusic();renderShop();$('hangar').showModal();};
$('closeShop').onclick=()=>$('hangar').close();$('hangar').addEventListener('close',()=>{if(resumeAfterShop)resume();});
$('sort').onclick=()=>{sorted=!sorted;renderShop();};
function requirementMet(u){if(!u.requires)return true;return catalog.some(item=>item.storage?.flag===u.requires&&has(item.id));}
function renderShop(){
 $('shopMoney').textContent=`${save.money.toLocaleString()} credits`;$('sort').hidden=!has('sort_shop');$('catalog').replaceChildren();
 if(!catalog.length){$('catalog').textContent='Catalog could not load. Run the game through the local server and reload.';return;}
 const list=[...catalog];if(sorted)list.sort((a,b)=>(a.type==='multi'?50:upgradeCost(a,level(a.id)))-(b.type==='multi'?50:upgradeCost(b,level(b.id))));
 for(const u of list){
  if(u.type==='multi'){for(const option of u.options)addCard(u,option);continue;}addCard(u);
 }
}
function addCard(u,option){
 const lv=level(u.id),owned=option?save.bombs.includes(option.id):u.type==='toggle'&&lv>0;
 const maxed=u.type==='linear'&&upgradeValue(u,lv)===upgradeValue(u,lv+1);
 const cost=option?option.cost:upgradeCost(u,lv),locked=!requirementMet(u);
 const row=document.createElement('div');row.className='upgrade';const info=document.createElement('div'),title=document.createElement('h3'),desc=document.createElement('p'),meta=document.createElement('small'),button=document.createElement('button');
 title.textContent=option?`${u.name} · ${option.name}`:u.name;desc.textContent=option?option.description:u.description;
 meta.textContent=locked?`Requires ${catalog.find(item=>item.storage?.flag===u.requires)?.name||u.requires}`:u.type==='linear'?`LEVEL ${lv} · ${Number(upgradeValue(u,lv).toFixed(2))}`:owned?'UNLOCKED':'';
 info.append(title,desc,meta);button.textContent=option&&owned?(save.bomb===option.id?'Selected':'Equip'):owned?'Installed':maxed?'Maximum':`${cost.toLocaleString()} cr`;
 button.disabled=!!(locked||maxed||(!option&&owned)||(!owned&&save.money<cost)||(option&&owned&&save.bomb===option.id));
 button.onclick=()=>{
   if(option&&owned){save.bomb=option.id;persist();renderShop();return;}
   if(save.money<cost||!requirementMet(u)||maxed||(!option&&owned))return;
   save.money-=cost;
   if(option){save.bombs.push(option.id);save.bomb=option.id;}
   else if(u.type==='special'){save={money:1000000,levels:{},bombs:[],bomb:'screen',best:save.best};}
   else save.levels[u.id]=lv+1;
   if(u.id==='guided_missiles'||u.id==='missile_rate'||u.type==='special')missileClock=1/value('missile_rate',.2);
   if(u.type==='special')bullets=bullets.filter(b=>!b.missile);
   syncAimCircle();persist();play('buy');renderShop();
 };row.append(info,button);$('catalog').append(row);
}
