'use strict';
const {items,levels,createGame,tick,pad,canProduce}=AxeGame;
const state=createGame(),canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const keys=new Set(),joystick=document.getElementById('joystick'),stick=document.getElementById('stick');
const analog={x:0,y:0};let pointer=null,paused=false,last=0,width=0,height=0;
const inventory=document.getElementById('inventory');
for(const [id,[name,icon]] of Object.entries(items)){const el=document.createElement('div');el.className='item';el.innerHTML=`<span>${icon}</span>${name}<strong id="bag-${id}">0</strong>`;inventory.append(el);}
function resize(){const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
new ResizeObserver(resize).observe(canvas);
function release(){keys.clear();pointer=null;analog.x=analog.y=0;stick.style.transform='';}
function setPaused(value){paused=value;release();document.getElementById('pause').textContent=paused?'Resume':'Pause';document.getElementById('paused').hidden=!paused;}
document.getElementById('pause').onclick=()=>setPaused(!paused);
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);}if(key==='escape'&&!e.repeat)setPaused(!paused);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>setPaused(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPaused(true);});
function drag(e){const r=joystick.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const length=Math.hypot(x,y),factor=length>38?38/length:1;x*=factor;y*=factor;analog.x=x/38;analog.y=y/38;stick.style.transform=`translate(${x}px, ${y}px)`;}
joystick.addEventListener('pointerdown',e=>{if(paused||pointer!==null)return;pointer=e.pointerId;joystick.setPointerCapture(pointer);drag(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointer)drag(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,e=>{if(e.pointerId===pointer)release();});
function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function rect(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function label(text,x,y,size=12,color='#304632',weight=600){ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x,y);}
function tree(x,y,size=1){ctx.save();ctx.translate(x,y);ctx.scale(size,size);rect(-5,0,10,30,2,'#775739');circle(0,-10,26,'#47784b');circle(-13,-1,18,'#59894d');circle(9,-16,19,'#6b9957');ctx.restore();}
function person(x,y,color,time,working=false){ctx.save();ctx.translate(x,y);const step=working?Math.sin(time*8)*3:0;ctx.fillStyle='#28432525';ctx.beginPath();ctx.ellipse(0,15,14,6,0,0,Math.PI*2);ctx.fill();rect(-9,0,7,16+step,3,'#374739');rect(2,0,7,16-step,3,'#374739');rect(-12,-17,24,24,8,color);circle(0,-24,10,'#f3c896');rect(-11,-34,22,9,3,color);ctx.restore();}
function station(s,time){
  const active=state.active===s.id;
  circle(s.x,s.y,61,active?'#f9f6d477':'#e4ecc955',active?'#fff9cc':'#f3f6d899');
  if(s.id==='tree'){tree(s.x-19,s.y-12,1);tree(s.x+22,s.y-23,0.8);}
  else if(s.id==='mine'){ctx.fillStyle='#77877a';ctx.beginPath();ctx.moveTo(s.x-38,s.y+10);ctx.lineTo(s.x-22,s.y-32);ctx.lineTo(s.x+8,s.y-47);ctx.lineTo(s.x+38,s.y+10);ctx.closePath();ctx.fill();circle(s.x,s.y-2,16,'#3c5148');label('◆',s.x+23,s.y-5,20,'#ced9d2');}
  else {rect(s.x-34,s.y-22,68,41,7,'#745a3d');rect(s.x-38,s.y-26,76,13,4,s.id==='market'?'#dfbd65':s.id==='furnace'?'#b66c4c':'#d6b47a');rect(s.x-28,s.y+10,8,17,2,'#5e513b');rect(s.x+20,s.y+10,8,17,2,'#5e513b');label(s.icon,s.x,s.y+5,29);}
  label(s.name,s.x,s.y-69,15,'#304632',800);
  const recipe=s.output?`${Object.keys(s.inputs).map(k=>items[k][0]).join(' + ')}${Object.keys(s.inputs).length?' → ':''}${items[s.output][0]}`:'Axe → 20 gold';
  label(recipe,s.x,s.y+46,10,'#4d6546');
  if(active||s.worker){const fraction=(active?s.progress:s.workerProgress)/(s.duration/(1+s.rank*.3));ctx.beginPath();ctx.arc(s.x,s.y,61,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,fraction));ctx.lineWidth=5;ctx.strokeStyle=canProduce(state,s)?'#fff7ae':'#a7b699';ctx.stroke();}
  const p=pad(s),paying=state.paying===s.id;
  rect(p.x-63,p.y-27,126,54,12,paying?'#fbe4a0':'#e8d9a8');ctx.strokeStyle=paying?'#fff9d7':'#b69c57';ctx.lineWidth=2;ctx.stroke();
  label(s.worker?`↑ Speed ${s.rank+1}`:`+ ${s.workerName}`,p.x,p.y-7,11,'#6f551e',800);
  label(`${s.paid} / ${s.cost} G`,p.x,p.y+9,11,'#79612b');
  rect(p.x-48,p.y+16,96,4,2,'#c9b77f');if(s.paid)rect(p.x-48,p.y+16,96*s.paid/s.cost,4,2,'#729447');
  if(s.worker){person(s.x+43,s.y+5,'#e5c974',time,canProduce(state,s));label('CREW',s.x+44,s.y-38,8,'#57714b');}
}
function draw(time){
  if(!width||!height)return;
  ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
  ctx.fillStyle=['#acc68a','#c1bd89','#a5bda1'][state.level];ctx.fillRect(0,0,width,height);
  const zoom=Math.max(.68,Math.min(width/1160,(height-100)/730,1.25));
  const visibleW=width/zoom,visibleH=height/zoom;
  const cameraX=visibleW>=1160?(1160-visibleW)/2:Math.max(0,Math.min(1160-visibleW,state.player.x-visibleW/2));
  const cameraY=visibleH>=730?(730-visibleH)/2:Math.max(-60,Math.min(730-visibleH,state.player.y-visibleH/2));
  ctx.scale(zoom,zoom);ctx.translate(-cameraX,-cameraY+25);
  // Deterministic meadow details and paths keep the workshop easy to read.
  for(let i=0;i<100;i++){const x=(i*173+21)%1160,y=(i*137+53)%730;ctx.strokeStyle='#75985840';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-3,y-3);ctx.lineTo(x,y);ctx.lineTo(x+2,y-5);ctx.stroke();}
  ctx.lineCap='round';ctx.strokeStyle='#d8d3a5';ctx.lineWidth=39;ctx.beginPath();ctx.moveTo(150,320);ctx.lineTo(990,320);ctx.moveTo(300,180);ctx.lineTo(300,550);ctx.moveTo(575,180);ctx.lineTo(575,550);ctx.moveTo(855,180);ctx.lineTo(855,550);ctx.stroke();
  for(const [x,y,s] of [[55,55,.7],[1100,80,1],[60,640,1],[760,665,.8],[1070,660,.7]])tree(x,y,s);
  label('AXE VALLEY  /  WORKSHOP '+(state.level+1),580,45,12,'#567346',800);
  for(const s of state.stations)station(s,time);
  const ready=state.sold>=levels[state.level].target;
  circle(990,550,53,ready?'#fff5be':'#d0dbb8',ready?'#fffbee':'#a9b992');
  label(state.won?'★':'⚑',990,552,38,ready?'#937329':'#7a8f69');
  label(state.won?'Valley master':state.level===2?'Finish workshop':'Next valley',990,625,14,'#385431',800);
  label(ready?'Walk here to continue':`Sell ${levels[state.level].target} axes to unlock`,990,644,10,'#58704c');
  const moving=keys.size>0||Math.hypot(analog.x,analog.y)>.1;
  circle(state.player.x,state.player.y,19,'#ffffff30','#fff8d1');person(state.player.x,state.player.y,'#5688ac',time,moving);
  label('YOU',state.player.x,state.player.y-45,9,'#fffdf1',800);
}
function frame(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;if(!paused){tick(state,dt,{x:analog.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y:analog.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)});}draw(paused?0:now/1000);
  document.getElementById('gold').textContent=state.gold;
  for(const id of Object.keys(items))document.getElementById('bag-'+id).textContent=state.bag[id];
  document.getElementById('level-name').textContent=levels[state.level].name;
  document.getElementById('objective').textContent=state.won?'All workshops complete!':`Sell axes · ${Math.min(state.sold,levels[state.level].target)} / ${levels[state.level].target}`;
  const progress=document.getElementById('level-progress');progress.max=levels[state.level].target;progress.value=state.sold;
  document.getElementById('message').textContent=state.message;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
