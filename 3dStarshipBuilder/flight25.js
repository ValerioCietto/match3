import {hasJaredPlasma} from './jared.js';
import {catalogForFaction} from './presets.js';
import {combined,preset} from './model.js';
import {recommendedStats} from './stats.js';
import {meshBuffers} from './webgl-renderer.js';

export function pilot(parts,x=0,z=0){
  const stats=recommendedStats(parts);
  return {x,z,yaw:0,speed:0,stats,hull:stats.hullMax,shield:stats.shieldMax,cooldown:0,radius:Math.max(1.5,Math.min(6,Math.cbrt(stats.volume))),hitAgo:99};
}
export function drive(ship,input,dt){
  dt=Math.max(0,Math.min(.05,dt));
  const s=ship.stats,limit=Math.min(40,s.maxSpeed),accel=Math.min(18,s.acceleration);
  ship.speed+=((input.throttle||0)*accel-ship.speed*.35)*dt;
  if(input.brake)ship.speed*=Math.exp(-8*dt);
  ship.speed=Math.max(-limit*.3,Math.min(limit,ship.speed));
  // Steering follows forward/reverse travel, with no lateral strafing or turning at rest.
  ship.yaw+=(input.steer||0)*Math.min(2.4,s.turnMaxSpeed*Math.PI/180)*Math.tanh(ship.speed/4)*dt;
  ship.x+=Math.sin(ship.yaw)*ship.speed*dt;ship.z-=Math.cos(ship.yaw)*ship.speed*dt;
  ship.cooldown=Math.max(0,ship.cooldown-dt);ship.hitAgo+=dt;
  if(ship.hitAgo>3){ship.shield=Math.min(s.shieldMax,ship.shield+s.shieldRegen*dt);ship.hull=Math.min(s.hullMax,ship.hull+s.hullRegen*dt);}
}
export function damage(ship,amount){const absorbed=Math.min(ship.shield,amount);ship.shield-=absorbed;ship.hull=Math.max(0,ship.hull-amount+absorbed);ship.hitAgo=0;}
export function fire(ship,owner,bullets){
  const guns=ship.stats.gunSlots+ship.stats.turretSlots;
  if(ship.cooldown>0||guns<=0||ship.hull<=0)return;
  const dx=Math.sin(ship.yaw),dz=-Math.cos(ship.yaw);
  bullets.push({x:ship.x+dx*(ship.radius+1),z:ship.z+dz*(ship.radius+1),vx:dx*65,vz:dz*65,owner,life:2.5,damage:25*guns});ship.cooldown=.3;
}
export function advanceBullets(bullets,ships,dt){
  for(const b of bullets){const oldX=b.x,oldZ=b.z;b.x+=b.vx*dt;b.z+=b.vz*dt;b.life-=dt;
    const target=ships[1-b.owner];if(!target||target.hull<=0)continue;
    const dx=b.x-oldX,dz=b.z-oldZ,len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((target.x-oldX)*dx+(target.z-oldZ)*dz)/len)):0;
    if(Math.hypot(oldX+dx*t-target.x,oldZ+dz*t-target.z)<target.radius){damage(target,b.damage);b.life=0;}
  }
  return bullets.filter(b=>b.life>0);
}

// Dedicated orthographic WebGL renderer: world X/Z form the flight plane, Y supplies depth.
function arenaRenderer(canvas){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true});if(!gl)throw Error('WebGL is unavailable.');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const vs=shader(gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;uniform vec4 uShip;uniform vec4 uView;varying vec3 color;void main(){float c=cos(uShip.z),s=sin(uShip.z);vec2 p=vec2(aPosition.x*c-aPosition.z*s,aPosition.x*s+aPosition.z*c)*uShip.w+uShip.xy;gl_Position=vec4((p.x-uView.x)/uView.z,-(p.y-uView.y)/uView.w,-aPosition.y*.1,1.);gl_PointSize=5.;color=aColor*(length(aNormal)<.01?1.:(.55+.45*abs(aNormal.y)));}`);
  const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 color;void main(){gl_FragColor=vec4(color,1.);}`);
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Could not link flight renderer.');
  const attrs=['aPosition','aNormal','aColor'].map(n=>gl.getAttribLocation(program,n)),shipLoc=gl.getUniformLocation(program,'uShip'),viewLoc=gl.getUniformLocation(program,'uView'),buffers=new Set();
  function upload(data){const buffer=gl.createBuffer();buffers.add(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer,count:data.length/9};}
  function draw(mesh,ship,mode=gl.TRIANGLES){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);attrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12);});gl.uniform4f(shipLoc,ship.x,ship.z,ship.yaw,ship.radius);gl.drawArrays(mode,0,mesh.count);}
  const shots=upload([]),grid=upload([]);
  return {load:(parts,time=0)=>upload(meshBuffers(combined(parts,time)).triangles),release:m=>{if(m){gl.deleteBuffer(m.buffer);buffers.delete(m.buffer);}},
    render(player,enemy,models,bullets,viewRange){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.025,.05,.085,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(program);const aspect=canvas.width/canvas.height;gl.uniform4f(viewLoc,player.x,player.z,viewRange*aspect,viewRange);
      const lines=[],cx=Math.floor(player.x/10)*10,cz=Math.floor(player.z/10)*10,extent=Math.ceil(Math.max(viewRange*aspect,viewRange)/10)*10+20;
      for(let offset=-extent;offset<=extent;offset+=10)for(const [x,z] of [[cx+offset,cz-extent],[cx+offset,cz+extent],[cx-extent,cz+offset],[cx+extent,cz+offset]])lines.push(x,-5,z,0,1,0,.07,.13,.19);
      gl.bindBuffer(gl.ARRAY_BUFFER,grid.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lines),gl.DYNAMIC_DRAW);grid.count=lines.length/9;draw(grid,{x:0,z:0,yaw:0,radius:1},gl.LINES);
      draw(models[0],player);if(enemy?.hull>0)draw(models[1],enemy);
      const vertices=bullets.flatMap(b=>[b.x,0,b.z,0,1,0,...(b.owner?[1,.35,.2]:[.4,1,.8])]);gl.bindBuffer(gl.ARRAY_BUFFER,shots.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);shots.count=vertices.length/9;gl.disable(gl.DEPTH_TEST);draw(shots,{x:0,z:0,yaw:0,radius:1},gl.POINTS);},
    destroy(){for(const b of buffers)gl.deleteBuffer(b);gl.deleteProgram(program);}
  };
}
export function openFlight25(project){
  const dialog=document.createElement('dialog');dialog.className='flight-dialog';dialog.id='flight25Dialog';dialog.setAttribute('aria-label','2.5D test flight');
  dialog.innerHTML=`<div class="flight-header"><h2>2.5D flight</h2><label>Opponent <select id="opponentTemplate" aria-label="Opponent template"></select></label><button id="startBattle">Battle / restart</button><button id="exit25">Back to builder</button></div><div class="flight-stage"><canvas id="arena25" tabindex="0" aria-label="Top down flight. W/S accelerate and reverse, A/D steer, Space fires, Shift brakes."></canvas><div class="flight-hud"><span id="playerHealth"></span><span id="opponentHealth"></span></div><p id="battleStatus" role="status"></p></div><div class="flight-controls"><button id="pause25">Pause</button><button id="reset25">Free flight / reset</button><div class="flight-steering"><button data-drive="throttle" data-value="1">Forward</button><button data-drive="throttle" data-value="-1">Reverse</button><button data-drive="steer" data-value="-1">Left</button><button data-drive="steer" data-value="1">Right</button><button data-drive="fire" data-value="1">Fire</button><button data-drive="brake" data-value="1">Brake</button></div><p>W/S or ↑/↓ accelerate and reverse · A/D or ←/→ steer · Space fires · Shift brakes · Scroll to zoom · Esc exits. Steering needs movement. Weapons require gun or turret slots. Cyan shots: you; orange shots: opponent.</p></div>`;
  document.body.append(dialog);const $=id=>dialog.querySelector('#'+id),canvas=$('arena25');
  for(const [id,p] of Object.entries(catalogForFaction(project.faction)))if(id!=='empty')$('opponentTemplate').add(new Option(p.label,id));
  let plasmaTime=0,lastPlasma=0;let player=pilot(project.parts),enemy=null,bullets=[],models=[],renderer,paused=false,last=0,frame=0,closed=false,result='',viewRange=40;
  const keys=new Set(),held=new Map(),abort=new AbortController(),opts={signal:abort.signal};
  const say=text=>$('battleStatus').textContent=text;
  function clear(){keys.clear();held.clear();}
  function pause(value){paused=value;clear();$('pause25').textContent=value?'Resume':'Pause';}
  function reset(battle){clear();player=pilot(project.parts);enemy=null;bullets=[];result='';renderer.release(models[1]);models[1]=null;
    if(battle){const parts=preset($('opponentTemplate').value);enemy=pilot(parts,0,-28);enemy.yaw=Math.PI;models[1]=renderer.load(parts);}
    pause(false);say(!player.stats.thrust?'No propulsion: add engines.':!player.stats.gunSlots&&!player.stats.turretSlots?'No weapons: add a cannon or turret to deal damage.':battle?'Battle started.':'Free flight');canvas.focus();}
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
  const down=(...codes)=>codes.some(c=>keys.has(c));
  function tick(now){if(closed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(!paused&&!result){const input={throttle:Number(down('KeyW','ArrowUp'))-Number(down('KeyS','ArrowDown')),steer:Number(down('KeyD','ArrowRight'))-Number(down('KeyA','ArrowLeft')),brake:down('ShiftLeft','ShiftRight'),fire:down('Space')};for(const [button,value] of held)input[button.dataset.drive]=value;
      drive(player,input,dt);if(input.fire)fire(player,0,bullets);
      if(enemy){const dx=player.x-enemy.x,dz=player.z-enemy.z,target=Math.atan2(dx,-dz),angle=Math.atan2(Math.sin(target-enemy.yaw),Math.cos(target-enemy.yaw));drive(enemy,{throttle:Math.abs(angle)>1?.35:Math.hypot(dx,dz)>16?.8:.25,steer:Math.max(-1,Math.min(1,angle*2))},dt);if(Math.abs(angle)<.18)fire(enemy,1,bullets);}
      bullets=advanceBullets(bullets,[player,enemy],dt);if(enemy&&(player.hull<=0||enemy.hull<=0)){result=player.hull<=0?'Defeat — restart to try again.':'Victory — opponent destroyed.';say(result);clear();}
    }
    if(!paused&&!result)plasmaTime+=dt;if(now-lastPlasma>80&&hasJaredPlasma(project.parts)){renderer.release(models[0]);models[0]=renderer.load(project.parts,plasmaTime);lastPlasma=now;}
    renderer.render(player,enemy,models,bullets,viewRange);
    $('playerHealth').textContent=`YOU · Hull ${Math.ceil(player.hull)} · Shield ${Math.ceil(player.shield)} · ${player.speed.toFixed(1)} m/s`;
    $('opponentHealth').textContent=enemy?`ENEMY · Hull ${Math.ceil(enemy.hull)} · Shield ${Math.ceil(enemy.shield)} · ${Math.hypot(enemy.x-player.x,enemy.z-player.z).toFixed(0)} m`:'';
    frame=requestAnimationFrame(tick);
  }frame=requestAnimationFrame(tick);
}
