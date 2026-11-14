import {hasAnimatedTechnician} from './technician.js';

import {combined} from './model.js';
import {recommendedStats} from './stats.js';
import {WebGLRenderer} from './webgl-renderer.js';

export function flightState(){return {position:[0,0,0],yaw:0,pitch:0,yawRate:0,pitchRate:0,speed:0,throttle:.65,distance:0};}
export function flightBasis(state){const {yaw:y,pitch:p}=state;return {forward:[Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p)],right:[Math.cos(y),0,Math.sin(y)],up:[-Math.sin(y)*Math.sin(p),Math.cos(p),Math.cos(y)*Math.sin(p)]};}
export function stepFlight(state,stats,input,dt){
  dt=Math.max(0,Math.min(dt,.05));
  state.throttle=Math.max(0,Math.min(1,state.throttle+(input.throttle||0)*dt*.5));
  const angularAcceleration=stats.turnAcceleration*Math.PI/180,maxRate=stats.turnMaxSpeed*Math.PI/180;
  const approach=(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);
  state.yawRate=approach(state.yawRate,(input.yaw||0)*maxRate,angularAcceleration*dt);
  state.pitchRate=approach(state.pitchRate,(input.pitch||0)*maxRate,angularAcceleration*dt);
  state.yaw+=state.yawRate*dt;state.pitch=Math.max(-1.4,Math.min(1.4,state.pitch+state.pitchRate*dt));
  if(Math.abs(state.pitch)>=1.4)state.pitchRate=0;
  const damping=stats.maxSpeed>0?stats.acceleration/stats.maxSpeed:0;
  const target=input.brake?0:state.throttle*stats.maxSpeed;
  state.speed=damping?target+(state.speed-target)*Math.exp(-damping*(input.brake?12:1)*dt):0;
  const forward=flightBasis(state).forward;state.position=state.position.map((v,i)=>v+forward[i]*state.speed*dt);state.distance+=state.speed*dt;
  return state;
}

export function openTestFlight(project){
  if(!project.parts.length)return;
  const stats=recommendedStats(project.parts),dialog=document.createElement('dialog');dialog.className='flight-dialog';dialog.id='testFlightDialog';dialog.setAttribute('aria-labelledby','flightTitle');
  dialog.innerHTML='<div class="flight-header"><div><span class="eyebrow">TEST FLIGHT / HANDLING SANDBOX</span><h2 id="flightTitle"></h2></div><button id="flightClose">Back to builder ×</button></div><div class="flight-stage"><canvas id="flightStars" aria-hidden="true"></canvas><canvas id="flightShip" tabindex="0" aria-label="Test flight. Arrow keys steer; W and S change throttle; Space brakes; Escape returns to the builder."></canvas><div class="flight-hud" aria-live="off"><span id="flightSpeed"></span><span id="flightDistance"></span><span id="flightHeading"></span></div><p id="flightError" role="status"></p><span class="flight-reticle" aria-hidden="true">+</span></div><div class="flight-controls"><label>Throttle <input id="flightThrottle" aria-label="Flight throttle" type="range" min="0" max="100" value="65"><output id="flightThrottleValue">65%</output></label><button id="flightPause">Pause</button><button id="flightReset">Restart</button><div class="flight-steering" aria-label="Flight controls"><button data-flight="left" aria-label="Turn left">←</button><button data-flight="up" aria-label="Pitch up">↑</button><button data-flight="down" aria-label="Pitch down">↓</button><button data-flight="right" aria-label="Turn right">→</button><button data-flight="brake">Brake</button></div><p>Arrow keys steer · W/S throttle · Space brake · Esc exit<br>Full-load handling. Free flight only; no combat or collisions. Your design stays unchanged.</p></div>';
  document.body.append(dialog);const $=id=>dialog.querySelector('#'+id);$('flightTitle').textContent=project.name;
  let animationTime=0,lastModuleTime=-1;const animated=hasAnimatedTechnician(project.parts);
  let state=flightState(),paused=false,last=0,frameId=0,renderer,closed=false;
  const keys=new Set(),held=new Set(),abort=new AbortController(),listen={signal:abort.signal};
  const canvas=$('flightShip'),starsCanvas=$('flightStars'),ctx=starsCanvas.getContext('2d');let width=1,height=1;
  // Deterministic star positions make comparisons between ships consistent.
  let seed=3491;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stars=Array.from({length:700},()=>[(random()-.5)*1600,(random()-.5)*1600,(random()-.5)*1600]);
  try{renderer=new WebGLRenderer(canvas,{onError:message=>{if(!closed){paused=true;$('flightError').textContent=message;}},onRestore:()=>{if(!closed){$('flightError').textContent='Graphics restored. Press Resume.';$('flightPause').textContent='Resume';}}});renderer.setModel(combined(project.parts));}
  catch(error){$('flightError').textContent=error.message;paused=true;}
  if(renderer&&!stats.thrust)$('flightError').textContent='No propulsion: add engines to move. Steering is available if the ship has turning power.';
  function clearInput(){keys.clear();held.clear();}
  function setPaused(value){paused=value;clearInput();$('flightPause').textContent=paused?'Resume':'Pause';}
  function close(){if(closed)return;closed=true;cancelAnimationFrame(frameId);observer.disconnect();abort.abort();if(renderer){for(const entry of Object.values(renderer.buffers))renderer.gl.deleteBuffer(entry.buffer);renderer.gl.deleteProgram(renderer.program);}dialog.remove();document.getElementById('testFlight')?.focus();}
  $('flightClose').onclick=()=>dialog.close();dialog.addEventListener('close',close,{once:true});
  $('flightPause').onclick=()=>setPaused(!paused);
  $('flightReset').onclick=()=>{state=flightState();setPaused(false);};
  $('flightThrottle').oninput=()=>state.throttle=Number($('flightThrottle').value)/100;
  for(const button of dialog.querySelectorAll('[data-flight]')){
    button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);held.add(button.dataset.flight);};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>held.delete(button.dataset.flight),listen);
  }
  dialog.addEventListener('keydown',e=>{if(e.target.matches('input')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyS','Space'].includes(e.code))return;e.preventDefault();keys.add(e.code);},listen);
  dialog.addEventListener('keyup',e=>keys.delete(e.code),listen);
  window.addEventListener('blur',()=>setPaused(true),listen);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPaused(true);},listen);
  const observer=new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=Math.max(1,rect.width);height=Math.max(1,rect.height);for(const c of [canvas,starsCanvas]){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);}ctx?.setTransform(dpr,0,0,dpr,0,0);});
  dialog.showModal();observer.observe(canvas);canvas.focus();
  function frame(now){
    if(closed)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(!paused){animationTime+=dt;if(animated&&renderer&&!renderer.lost&&animationTime-lastModuleTime>=.05){renderer.setModel(combined(project.parts,animationTime));lastModuleTime=animationTime;}}
    const active=(key,button)=>keys.has(key)||held.has(button);
    if(!paused&&!renderer?.lost)stepFlight(state,stats,{yaw:Number(active('ArrowRight','right'))-Number(active('ArrowLeft','left')),pitch:Number(active('ArrowUp','up'))-Number(active('ArrowDown','down')),throttle:Number(keys.has('KeyW'))-Number(keys.has('KeyS')),brake:active('Space','brake')},dt);
    if(ctx){ctx.clearRect(0,0,width,height);const basis=flightBasis(state),focal=Math.min(width,height)*.9;
      for(const star of stars){const delta=star.map((v,i)=>((v-state.position[i]+800)%1600+1600)%1600-800),dot=a=>a.reduce((sum,v,i)=>sum+v*delta[i],0),depth=dot(basis.forward);if(depth<2)continue;const x=width/2+dot(basis.right)*focal/depth,y=height/2-dot(basis.up)*focal/depth;if(x<0||x>width||y<0||y>height)continue;ctx.fillStyle=`rgba(179,218,239,${Math.min(.9,.2+150/depth)})`;const size=Math.min(3,1+70/depth);ctx.fillRect(x,y,size,size);}
    }
    
    renderer?.render({yaw:-state.yawRate*.15,pitch:.22-state.pitchRate*.12,distance:3.7,width,height,wireframe:false,grid:false});
    $('flightSpeed').textContent=`${state.speed.toFixed(1)} / ${stats.maxSpeed.toFixed(1)} m/s`;$('flightSpeed').dataset.speed=state.speed;
    $('flightDistance').textContent=`${state.distance.toFixed(0)} m traveled`;$('flightHeading').textContent=`Heading ${((state.yaw*180/Math.PI%360+360)%360).toFixed(0)}°`;
    $('flightThrottle').value=Math.round(state.throttle*100);$('flightThrottleValue').textContent=Math.round(state.throttle*100)+'%';
    frameId=requestAnimationFrame(frame);
  }
  frameId=requestAnimationFrame(frame);
}
