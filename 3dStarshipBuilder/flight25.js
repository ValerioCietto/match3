import {hasAnimatedTechnician} from './technician.js';

import {catalogForFaction} from './presets.js';
import {factions} from './factions.js';
import {combined,preset,mesh} from './model.js';
import {recommendedStats,moduleStats} from './stats.js';
import {meshBuffers} from './webgl-renderer.js';
import {specialWeapons,combatState,tickStatuses,onHit,specialHit,seek,infestation,combatStatus} from './technician-combat.js';

function shipBounds(parts){
 const model=combined(parts),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const v of model.vertices)v.forEach((n,i)=>{min[i]=Math.min(min[i],n);max[i]=Math.max(max[i],n);});
 const center=min.map((n,i)=>(n+max[i])/2);let radius=0;for(const v of model.vertices)radius=Math.max(radius,Math.hypot(...v.map((n,i)=>n-center[i])));radius=radius||1;
 return {center,radius};
}
export function weaponMounts(parts,stats){
 const {center,radius}=shipBounds(parts);
 const mounts=[];
 for(const p of parts){if(!['cannon','turret',...Object.keys(specialWeapons)].includes(p.type))continue;
  const kind=p.type,value=moduleStats({...p,mirror:false})[kind==='turret'?'turretSlots':'gunSlots'];
  const count=specialWeapons[p.type]&&p.octagonalSymmetry!==false?8:1;
  for(let emitter=0;emitter<count;emitter++){
  const radial=emitter*Math.PI/4;let [x,y,z]=[-Math.sin(radial),0,-Math.cos(radial)];const [rx,ry,rz]=p.rotation.map(v=>v*Math.PI/180);
  [y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];[x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];[x,y]=[x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz)];
  for(const reflected of p.mirror?[false,true]:[false]){
   const direction=[reflected?-x:x,y,z],vertices=mesh(p,reflected).vertices;
   const dot=v=>v.reduce((s,n,i)=>s+n*direction[i],0),front=Math.max(...vertices.map(dot)),tip=vertices.filter(v=>front-dot(v)<1e-5);
   const origin=[0,1,2].map(i=>(tip.reduce((sum,v)=>sum+v[i],0)/tip.length-center[i])/radius);
   const lengthFactor=p.type==='cannon'&&p.designStyle==='jared'?(p.spikeLength??1.6)/1.6:1;
   mounts.push({kind,origin,direction,slots:value,projectileSpeed:65*lengthFactor,range:162.5*lengthFactor,reloadTime:.3*lengthFactor,cooldown:0,damage:25*value,...specialWeapons[kind],group:p.id+':'+reflected});
  }
 }
 }
 // Distribute support-module slot bonuses without multiplying damage by barrel count twice.
 const specialSlots=parts.filter(p=>['laserLine','pushOutside','gravStop','sapRay'].includes(p.type)).reduce((sum,p)=>sum+moduleStats(p).gunSlots,0);
 for(const kind of ['cannon','turret']){const group=mounts.filter(m=>m.kind===kind),sum=group.reduce((s,m)=>s+m.slots,0),total=kind==='turret'?stats.turretSlots:stats.gunSlots-specialSlots;if(sum)for(const mount of group){mount.slots*=total/sum;mount.damage=25*mount.slots;}}
 return mounts;
}
export function shotColor(kind,owner){return ({laserLine:[.3,.9,1],pushOutside:[.75,.45,1],gravStop:[1,.7,.2],nanitesSpray:[.3,1,.55]})[kind]||(kind==='turret'?(owner?[1,.35,.85]:[.7,.55,1]):(owner?[1,.35,.2]:[.4,1,.8]));}
export function worldMount(ship,mount){
 const cr=Math.cos(ship.roll||0),sr=Math.sin(ship.roll||0),c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 const transform=([x,y,z])=>{const rx=x*cr-y*sr;return [rx*c-z*s,rx*s+z*c];};
 const [ox,oz]=transform(mount.origin),[dx,dz]=transform(mount.direction),length=Math.hypot(dx,dz)||1;
 return {x:ship.x+ox*ship.radius,z:ship.z+oz*ship.radius,dx:dx/length,dz:dz/length};
}
export function advanceLasers(ships,dt){
 const beams=[];
 if(dt<=0)return beams;
 ships.forEach((ship,owner)=>{
  const target=ships[1-owner];if(!ship||ship.hull<=0||!target||target.hull<=0)return;
  const fired=new Set();
  for(const mount of ship.weapons){
   if(mount.kind!=='laserLine'||fired.has(mount.group))continue;
   const muzzle=worldMount(ship,mount),dx=target.x-muzzle.x,dz=target.z-muzzle.z,distance=Math.hypot(dx,dz);
   if(distance>mount.range||distance<1e-9||(dx*muzzle.dx+dz*muzzle.dz)/distance<mount.coneCos)continue;
   beams.push({x:muzzle.x,z:muzzle.z,endX:target.x,endZ:target.z,kind:'laserLine',owner});
   fired.add(mount.group);damage(target,mount.dps*dt);
   if(target.hull<=0)break;
  }
 });
 return beams;
}
export function pilot(parts,x=0,z=0){
  const stats=recommendedStats(parts),engines=parts.filter(p=>p.type==='engine');
  const hasOmni=engines.some(p=>p.designStyle==='technician'),instantCar=hasOmni&&engines.reduce((sum,p)=>sum+(p.mirror?2:1),0)===1;
  // Undo meshBuffers' normalization exactly: one editor unit is one arena unit.
  return {...combatState(parts),renderParts:parts,animated:hasAnimatedTechnician(parts),x,z,yaw:0,roll:0,speed:0,vx:0,vz:0,omni:hasOmni&&!instantCar,instantCar,stats,weapons:weaponMounts(parts,stats),hull:stats.hullMax,shield:stats.shieldMax,radius:shipBounds(parts).radius,hitAgo:99};
}
export function arenaMotion(stats){
 const forward=Math.min(40*stats.propulsionBonus,stats.maxSpeed),acceleration=Math.min(18*stats.propulsionBonus,stats.acceleration);
 return {forward,acceleration,reverse:.3*forward+Math.min(80,stats.reverseEngineMaxSpeed),reverseAcceleration:acceleration+Math.min(36,stats.reverseEngineAcceleration)};
}
export function drive(ship,input,dt){
  dt=Math.max(0,Math.min(.05,dt));
  const s=ship.stats,motion=arenaMotion(s),limit=motion.forward,accel=(input.throttle||0)<0?motion.reverseAcceleration:motion.acceleration;
  if(ship.omni){
    // Screen/world directions: north is -Z, east is +X, independent of ship heading.
    let dx=input.steer||0,dz=-(input.throttle||0);const magnitude=Math.hypot(dx,dz);
    if(magnitude>1){dx/=magnitude;dz/=magnitude;}
    ship.vx+=(dx*motion.acceleration-ship.vx*.35)*dt;
    ship.vz+=(dz*motion.acceleration-ship.vz*.35)*dt;
    if(input.brake){ship.vx*=Math.exp(-8*dt);ship.vz*=Math.exp(-8*dt);}
    const speed=Math.hypot(ship.vx,ship.vz);
    if(speed>limit){ship.vx*=limit/speed;ship.vz*=limit/speed;}
    ship.speed=Math.hypot(ship.vx,ship.vz);
    ship.x+=ship.vx*dt;ship.z+=ship.vz*dt;
    ship.roll*=Math.exp(-8*dt);ship.yawRate=0;
  }else{
  if(ship.instantCar&&input.throttle&&!input.brake)ship.speed=Math.max(-1,Math.min(1,input.throttle))*limit;
  else ship.speed+=((input.throttle||0)*accel-ship.speed*.35)*dt;
  if(input.brake)ship.speed*=Math.exp(-8*dt);
  ship.speed=Math.max(-(ship.instantCar?limit:motion.reverse),Math.min(limit,ship.speed));
  // Steering is independent of translational speed, including at rest and in reverse.
  const targetRate=(input.steer||0)*Math.min(2.4*s.turnSpeedBonus,s.turnMaxSpeed*Math.PI/180),rateStep=s.turnAcceleration*Math.PI/180*dt;
  const rate=ship.yawRate||0;ship.yawRate=rate+Math.max(-rateStep,Math.min(rateStep,targetRate-rate));
  ship.yaw+=ship.yawRate*dt;
  const targetRoll=-Math.max(-1,Math.min(1,input.steer||0))*Math.PI/12;
  ship.roll=(ship.roll||0)+(targetRoll-(ship.roll||0))*(1-Math.exp(-8*dt));
  ship.x+=Math.sin(ship.yaw)*ship.speed*dt;ship.z-=Math.cos(ship.yaw)*ship.speed*dt;
  }
  for(const mount of ship.weapons)mount.cooldown=Math.max(0,mount.cooldown-dt);ship.hitAgo+=dt;
  if(ship.hitAgo>3&&ship.hull>0){ship.shield=Math.min(s.shieldMax,ship.shield+s.shieldRegen*dt);ship.hull=Math.min(s.hullMax,ship.hull+s.hullRegen*dt);}
  tickStatuses(ship,dt);
}
export function damage(ship,amount){const absorbed=Math.min(ship.shield,amount);ship.shield-=absorbed;ship.hull=Math.max(0,ship.hull-amount+absorbed);onHit(ship);}
export function fire(ship,owner,bullets){
  if(!ship.weapons.length||ship.hull<=0)return;
  const cr=Math.cos(ship.roll||0),sr=Math.sin(ship.roll||0),c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
  const transform=([x,y,z])=>{const rolledX=x*cr-y*sr;return [rolledX*c-z*s,rolledX*s+z*c];};
  for(const mount of ship.weapons){
   if(mount.kind==='laserLine'||mount.cooldown>1e-9)continue;
   const [ox,oz]=transform(mount.origin),[dx,dz]=transform(mount.direction),length=Math.hypot(dx,dz);if(length<1e-6)continue;
   bullets.push({x:ship.x+ox*ship.radius,z:ship.z+oz*ship.radius,vx:dx/length*mount.projectileSpeed,vz:dz/length*mount.projectileSpeed,owner,kind:mount.kind,life:mount.range/mount.projectileSpeed,damage:mount.damage,hitRadius:mount.hitRadius||0});
   mount.cooldown=mount.reloadTime;
  }
}
export function advanceBullets(bullets,ships,dt){
  for(const b of bullets){if(b.life<=0)continue;const target=ships[1-b.owner];seek(b,target,Math.min(dt,b.life));const oldX=b.x,oldZ=b.z,travelTime=Math.min(dt,b.life);b.x+=b.vx*travelTime;b.z+=b.vz*travelTime;b.life-=dt;
    if(!target||target.hull<=0)continue;
    const dx=b.x-oldX,dz=b.z-oldZ,len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((target.x-oldX)*dx+(target.z-oldZ)*dz)/len)):0;
    if(Math.hypot(oldX+dx*t-target.x,oldZ+dz*t-target.z)<target.radius+(b.hitRadius||0)){if(!specialHit(target,b))damage(target,b.damage);b.life=0;}
  }
  return bullets.filter(b=>b.life>0);
}

// Dedicated orthographic WebGL renderer: world X/Z form the flight plane, Y supplies depth.
function arenaRenderer(canvas){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true});if(!gl)throw Error('WebGL is unavailable.');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const vs=shader(gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;uniform vec4 uShip;uniform vec4 uView;uniform float uRoll;varying vec3 color;void main(){float cr=cos(uRoll),sr=sin(uRoll);vec3 q=vec3(aPosition.x*cr-aPosition.y*sr,aPosition.x*sr+aPosition.y*cr,aPosition.z);vec3 n=vec3(aNormal.x*cr-aNormal.y*sr,aNormal.x*sr+aNormal.y*cr,aNormal.z);float c=cos(uShip.z),s=sin(uShip.z);vec2 p=vec2(q.x*c-q.z*s,q.x*s+q.z*c)*uShip.w+uShip.xy;gl_Position=vec4((p.x-uView.x)/uView.z,-(p.y-uView.y)/uView.w,-q.y*.1,1.);gl_PointSize=5.;color=aColor*(length(aNormal)<.01?1.:(.55+.45*abs(n.y)));}`);
  const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 color;void main(){gl_FragColor=vec4(color,1.);}`);
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Could not link flight renderer.');
  const attrs=['aPosition','aNormal','aColor'].map(n=>gl.getAttribLocation(program,n)),shipLoc=gl.getUniformLocation(program,'uShip'),viewLoc=gl.getUniformLocation(program,'uView'),rollLoc=gl.getUniformLocation(program,'uRoll'),buffers=new Set();
  function upload(data){const buffer=gl.createBuffer();buffers.add(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer,count:data.length/9};}
  function draw(mesh,ship,mode=gl.TRIANGLES){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);attrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12);});gl.uniform4f(shipLoc,ship.x,ship.z,ship.yaw,ship.radius);gl.uniform1f(rollLoc,ship.roll||0);gl.drawArrays(mode,0,mesh.count);}
  const shots=upload([]),grid=upload([]),effects=upload([]);
  return {load:(parts,time=0)=>upload(meshBuffers(combined(parts,time)).triangles),update:(model,parts,time)=>{const data=meshBuffers(combined(parts,time)).triangles;gl.bindBuffer(gl.ARRAY_BUFFER,model.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);model.count=data.length/9;},release:m=>{if(m){gl.deleteBuffer(m.buffer);buffers.delete(m.buffer);}},
    render(player,enemy,models,bullets,viewRange,beams=[]){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.025,.05,.085,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(program);const aspect=canvas.width/canvas.height;gl.uniform4f(viewLoc,player.x,player.z,viewRange*aspect,viewRange);
      const lines=[],cx=Math.floor(player.x/10)*10,cz=Math.floor(player.z/10)*10,extent=Math.ceil(Math.max(viewRange*aspect,viewRange)/10)*10+20;
      for(let offset=-extent;offset<=extent;offset+=10)for(const [x,z] of [[cx+offset,cz-extent],[cx+offset,cz+extent],[cx-extent,cz+offset],[cx+extent,cz+offset]])lines.push(x,-5,z,0,1,0,.07,.13,.19);
      gl.bindBuffer(gl.ARRAY_BUFFER,grid.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lines),gl.DYNAMIC_DRAW);grid.count=lines.length/9;draw(grid,{x:0,z:0,yaw:0,radius:1},gl.LINES);
      draw(models[0],player);if(enemy?.hull>0)draw(models[1],enemy);
      const vertices=bullets.flatMap(b=>[b.x,0,b.z,0,1,0,...shotColor(b.kind,b.owner)]);gl.bindBuffer(gl.ARRAY_BUFFER,shots.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);shots.count=vertices.length/9;gl.disable(gl.DEPTH_TEST);draw(shots,{x:0,z:0,yaw:0,radius:1},gl.POINTS);
      const fx=[],line=(x,z,ex,ez,color)=>fx.push(x,0,z,0,0,0,...color,ex,0,ez,0,0,0,...color);
      const arc=(x,z,r,start,end,color)=>{for(let i=0;i<16;i++){const a=start+(end-start)*i/16,b=start+(end-start)*(i+1)/16;line(x+Math.cos(a)*r,z+Math.sin(a)*r,x+Math.cos(b)*r,z+Math.sin(b)*r,color);}};
      for(const beam of beams)line(beam.x,beam.z,beam.endX,beam.endZ,shotColor('laserLine',beam.owner));
      for(const b of bullets){const color=shotColor(b.kind,b.owner),angle=Math.atan2(b.vz,b.vx);
        if(b.kind==='pushOutside')arc(b.x,b.z,1.5,angle-Math.PI/2,angle+Math.PI/2,color);
        if(b.kind==='gravStop')arc(b.x,b.z,.6,0,Math.PI*2,color);
        if(b.kind==='nanitesSpray'){const speed=Math.hypot(b.vx,b.vz)||1;line(b.x,b.z,b.x-b.vx/speed*.7,b.z-b.vz/speed*.7,color);}
      }
      for(const ship of [player,enemy])if(ship){
        if(infestation(ship)>0)arc(ship.x,ship.z,ship.radius*1.1,0,Math.PI*2,[.3,1,.55]);
        if(ship.blinkFlash>0){arc(ship.x,ship.z,ship.radius+.5,0,Math.PI*2,[.8,.5,1]);if(ship.blinkFrom)arc(...ship.blinkFrom,ship.radius,0,Math.PI*2,[.8,.5,1]);}
      }
      gl.bindBuffer(gl.ARRAY_BUFFER,effects.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(fx),gl.DYNAMIC_DRAW);effects.count=fx.length/9;draw(effects,{x:0,z:0,yaw:0,radius:1},gl.LINES);
    },
    destroy(){for(const b of buffers)gl.deleteBuffer(b);gl.deleteProgram(program);}
  };
}
export function openFlight25(project){
  const dialog=document.createElement('dialog');dialog.className='flight-dialog';dialog.id='flight25Dialog';dialog.setAttribute('aria-label','2.5D test flight');
  dialog.innerHTML=`<div class="flight-header"><h2>2.5D flight</h2><label>Opponent <select id="opponentTemplate" aria-label="Opponent template"></select></label><button id="startBattle">Battle / restart</button><button id="exit25">Back to builder</button></div><div class="flight-stage"><canvas id="arena25" tabindex="0" aria-label="Top down flight. W/S accelerate and reverse, A/D steer, Space fires, Shift brakes."></canvas><div class="flight-hud"><span id="playerHealth"></span><span id="opponentHealth"></span></div><p id="battleStatus" role="status"></p></div><div class="flight-controls"><button id="pause25">Pause</button><button id="reset25">Free flight / reset</button><div class="flight-steering"><button data-drive="throttle" data-value="1">Forward</button><button data-drive="throttle" data-value="-1">Reverse</button><button data-drive="steer" data-value="-1">Left</button><button data-drive="steer" data-value="1">Right</button><button data-drive="fire" data-value="1">Fire</button><button data-drive="brake" data-value="1">Brake</button></div><p>W/S or ↑/↓ accelerate and reverse · A/D or ←/→ steer · Space fires · Shift brakes · Scroll to zoom · Esc exits. You can turn while stationary. Weapons require gun or turret slots. Cannons: cyan / orange. Turrets: violet / pink (you / opponent).</p></div>`;
  document.body.append(dialog);const $=id=>dialog.querySelector('#'+id),canvas=$('arena25');
  const flightStats=document.createElement('div');flightStats.id='flight25Stats';
  dialog.querySelector('.flight-hud').append(flightStats);
  for(const [faction,spec] of Object.entries(factions)){
    const group=document.createElement('optgroup');group.label=spec.name;
    for(const [id,p] of Object.entries(catalogForFaction(faction)))if(id!=='empty')group.append(new Option(p.label,id));
    if(group.children.length)$('opponentTemplate').append(group);
  }
  let player=pilot(project.parts),enemy=null,bullets=[],beams=[],models=[],renderer,paused=false,last=0,frame=0,closed=false,result='',viewRange=40;
  const keys=new Set(),held=new Map(),abort=new AbortController(),opts={signal:abort.signal};
  const say=text=>$('battleStatus').textContent=text;
  function clear(){keys.clear();held.clear();}
  function pause(value){paused=value;clear();$('pause25').textContent=value?'Resume':'Pause';}
  function reset(battle){clear();player=pilot(project.parts);enemy=null;bullets=[];beams=[];result='';renderer.release(models[1]);models[1]=null;
    const cannons=player.weapons.filter(m=>m.kind==='cannon').length,turrets=player.weapons.filter(m=>m.kind==='turret').length;
    const salvoDamage=player.weapons.reduce((sum,m)=>sum+m.damage,0);
    const laserDps=new Set(player.weapons.filter(m=>m.kind==='laserLine').map(m=>m.group)).size*10;
    const motion=arenaMotion(player.stats);
    if(player.omni){
      canvas.setAttribute('aria-label','Omni flight. WASD or arrow combinations move north, northeast, east, southeast, south, southwest, west and northwest. Space fires. Shift brakes.');
      dialog.querySelector('.flight-controls p').textContent='W / ↑ north · S / ↓ south · A / ← west · D / → east · Combine keys for diagonals · Space fires · Shift brakes · Scroll to zoom · Esc exits. Same speed limit in every direction; diagonals are normalized.';
      for(const button of dialog.querySelectorAll('[data-drive]')){
        const labels={throttle:{1:'North','-1':'South'},steer:{1:'East','-1':'West'}};
        if(labels[button.dataset.drive])button.textContent=labels[button.dataset.drive][button.dataset.value];
      }
    }
    flightStats.replaceChildren(...[
      `Max speed ${motion.forward.toFixed(1)} m/s`,
      ...(player.omni?['Omni · 8 directions']:[`Reverse max ${motion.reverse.toFixed(1)} m/s`]),
      `Acceleration ${motion.acceleration.toFixed(1)} m/s²`,
      `Damage / salvo ${salvoDamage.toFixed(1)} HP`,
      ...(laserDps?[`Laser ${laserDps} DPS · auto · range 100`]:[]),
      `Cannons ${cannons}`,`Turrets ${turrets}`
    ].map(text=>{const item=document.createElement('span');item.textContent=text;return item;}));
    if(battle){const parts=preset($('opponentTemplate').value);enemy=pilot(parts,0,-28);enemy.yaw=Math.PI;models[1]=renderer.load(parts);}
    pause(false);say(!player.stats.thrust?'No propulsion: add engines.':!player.weapons.length?'No weapons: add a cannon or turret to deal damage.':battle?'Battle started.':'Free flight');canvas.focus();}
  $('exit25').onclick=()=>dialog.close();$('pause25').onclick=()=>pause(!paused);
  const hasOpponents=$('opponentTemplate').options.length>0;
  if(!hasOpponents){$('opponentTemplate').add(new Option('No opponent presets',''));$('opponentTemplate').disabled=true;$('startBattle').disabled=true;}
  $('startBattle').onclick=()=>{if(hasOpponents)reset(true);};$('reset25').onclick=()=>reset(false);
  for(const button of dialog.querySelectorAll('[data-drive]')){button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);held.set(button,Number(button.dataset.value));};for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>held.delete(button),opts);}
  const codes=['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'];
  dialog.addEventListener('keydown',e=>{if(e.target.matches('select,input')||!codes.includes(e.code))return;e.preventDefault();keys.add(e.code);},opts);dialog.addEventListener('keyup',e=>keys.delete(e.code),opts);
  window.addEventListener('blur',()=>pause(true),opts);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);},opts);
  canvas.addEventListener('wheel',e=>{e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);viewRange=Math.max(10,Math.min(160,viewRange*Math.exp(Math.max(-1,Math.min(1,delta*.001)))));},{...opts,passive:false});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause(true);say('Graphics context lost. Close and reopen flight.');$('pause25').disabled=$('startBattle').disabled=$('reset25').disabled=true;},opts);
  const observer=new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));});
  dialog.addEventListener('close',()=>{closed=true;cancelAnimationFrame(frame);observer.disconnect();abort.abort();renderer?.destroy();dialog.remove();document.getElementById('testFlight')?.focus();},{once:true});
  dialog.showModal();observer.observe(canvas);canvas.focus();
  try{renderer=arenaRenderer(canvas);models[0]=renderer.load(project.parts);reset(false);}catch(error){say(error.message);$('startBattle').disabled=$('reset25').disabled=$('pause25').disabled=true;return;}
  let animationTime=0,lastModuleTime=-1;
  const down=(...codes)=>codes.some(c=>keys.has(c));
  function tick(now){if(closed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(!paused&&!result){const input={throttle:Number(down('KeyW','ArrowUp'))-Number(down('KeyS','ArrowDown')),steer:Number(down('KeyD','ArrowRight'))-Number(down('KeyA','ArrowLeft')),brake:down('ShiftLeft','ShiftRight'),fire:down('Space')};for(const [button,value] of held)input[button.dataset.drive]=value;
      drive(player,input,dt);if(input.fire)fire(player,0,bullets);
      if(enemy){const dx=player.x-enemy.x,dz=player.z-enemy.z,target=Math.atan2(dx,-dz),angle=Math.atan2(Math.sin(target-enemy.yaw),Math.cos(target-enemy.yaw));
        if(enemy.omni){
          const distance=Math.hypot(dx,dz)||1,throttle=distance>16?.8:.25;
          enemy.yaw=target;drive(enemy,{throttle:-dz/distance*throttle,steer:dx/distance*throttle},dt);fire(enemy,1,bullets);
        }else{drive(enemy,{throttle:Math.abs(angle)>1?.35:Math.hypot(dx,dz)>16?.8:.25,steer:Math.max(-1,Math.min(1,angle*2))},dt);if(Math.abs(angle)<.18)fire(enemy,1,bullets);}
      }
      bullets=advanceBullets(bullets,[player,enemy],dt);beams=advanceLasers([player,enemy],dt);if(enemy&&(player.hull<=0||enemy.hull<=0)){result=player.hull<=0?'Defeat — restart to try again.':'Victory — opponent destroyed.';say(result);clear();}
    }
    
    if(!paused&&!result){animationTime+=dt;if(animationTime-lastModuleTime>=.05){for(const [i,ship] of [player,enemy].entries())if(ship?.animated&&models[i])renderer.update(models[i],ship.renderParts,animationTime);lastModuleTime=animationTime;}}
    renderer.render(player,enemy,models,bullets,viewRange,beams);
    $('playerHealth').textContent=`YOU · Hull ${Math.ceil(player.hull)} · Shield ${Math.ceil(player.shield)} · ${player.speed.toFixed(1)} m/s${combatStatus(player)}`;
    $('opponentHealth').textContent=enemy?`ENEMY · Hull ${Math.ceil(enemy.hull)} · Shield ${Math.ceil(enemy.shield)} · ${Math.hypot(enemy.x-player.x,enemy.z-player.z).toFixed(0)} m${combatStatus(enemy)}`:'';
    frame=requestAnimationFrame(tick);
  }frame=requestAnimationFrame(tick);
}
