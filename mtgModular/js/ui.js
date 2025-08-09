import { state, saveState, loadStats  } from './state.js';
import { playCard, startGame, playTurn, getCombatStrenght  } from './engine.js';
import { runTurn } from './ai.js'

export function setupUI() {
  document.getElementById('btnStart').onclick = () => {
    startGame();
    render();
  };
  document.getElementById('btnTurn').onclick = () => {
    playTurn();
    render();
  };
  document.getElementById('btnAITurn').onclick = () => {
    runTurn();
    render();
  };
  document.getElementById('btnPlayAIGame').onclick = () => {
    playAIGame();
  };
}

export function playAIGame() {
  startGame();
  render();
  while(!state.gameEnded){
    runTurn();
    render();
  }
} 

export function render() {
  const handEl = document.getElementById('hand');
  const graveEl = document.getElementById('graveyard');
  const creatureZone = document.getElementById('creatureZone');
  const landZone = document.getElementById('landZone');
  const combatEl = document.getElementById('combatStrength');
  const opponentHP = document.getElementById('opponentHp')

  handEl.innerHTML = '';
  graveEl.innerHTML = '';
  creatureZone.innerHTML = '';
  landZone.innerHTML = '';
  opponentHp.innerHTML = state.opponentHp;

  // Graveyard
  state.graveyard.forEach(card => {
    const div = createCardDiv(card);
    graveEl.appendChild(div);
  });

  // Hand
  state.hand.forEach((card, index) => {
    const div = createCardDiv(card);
    div.onclick = () => {
      playCard(index);
      render();
    };
    handEl.appendChild(div);
  });

  // Battlefield
  state.battlefield.forEach((card, index) => {
    const div = createCardDiv(card);
    div.onclick = () => {
      card.tapped = !card.tapped;
      saveState();
      render();
    };
    if (card.type === 'land') {
      landZone.appendChild(div);
    } else {
      creatureZone.appendChild(div);
    }
  });

  // Aggiorna Combat Strength
  if (combatEl) {
    combatEl.textContent = `Combat Strength: ${getCombatStrenght()}`;
  }
  drawStatsGraph();
}

function drawStatsGraph() {
  const maxTurn = 20;
  const canvas = document.getElementById('statsGraph');
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // rendi il canvas nitido su schermi ad alta densità
  const cssW = canvas.clientWidth || 900;
  const cssH = canvas.clientHeight || 380;
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // coord in CSS px

  // padding grafico
  const pad = {l: 42, r: 18, t: 18, b: 30};
  const W = cssW - pad.l - pad.r;
  const H = cssH - pad.t - pad.b;

  // carica stats
  let stats = [];
  try {
    stats = JSON.parse(localStorage.getItem('mtgStats') || '[]');
  } catch(e){ stats = []; }

  // bucket 1..20
  const winCounts = Array(maxTurn).fill(0);
  const lossCounts = Array(maxTurn).fill(0);

  stats.forEach(s => {
    if (!s || typeof s.turn !== 'number') return;
    const t = Math.max(1, Math.min(maxTurn, Math.floor(s.turn)));
    if (s.won) winCounts[t-1]++; else lossCounts[t-1]++;
  });

  const totalWins  = winCounts.reduce((a,b)=>a+b,0);
  const totalLoss  = lossCounts.reduce((a,b)=>a+b,0);

  const winPerc = winCounts.map(v => totalWins ? (v/totalWins)*100 : 0);
  const lossPerc = lossCounts.map(v => totalLoss ? (v/totalLoss)*100 : 0);

  // helpers scala/coordinate
  const xForIndex = i => pad.l + (i/(maxTurn-1)) * W;
  const yForPerc = p => pad.t + (100 - p) / 100 * H;

  // sfondo
  ctx.fillStyle = '#0e0f12';
  ctx.fillRect(0,0,cssW,cssH);

  // griglia Y (0,25,50,75,100)
  ctx.strokeStyle = '#1f2329';
  ctx.lineWidth = 1;
  ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillStyle = '#9aa0a6';
  [0,25,50,75,100].forEach(p => {
    const y = yForPerc(p);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(cssW - pad.r, y); ctx.stroke();
    ctx.fillText(p+'%', 8, y+4);
  });

  // asse X (1..20) con tacche leggere
  ctx.fillStyle = '#9aa0a6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i=0;i<maxTurn;i++){
    const x = xForIndex(i);
    ctx.strokeStyle = (i%4===0) ? '#232831' : '#1a1d23';
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t+H); ctx.stroke();
    if ((i+1)%2===0) ctx.fillText(String(i+1), x, pad.t+H+6);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  // funzione per tracciare una polilinea liscia
  function drawLine(values, color){
    const pts = values.map((v,i)=>({x:xForIndex(i), y:yForPerc(v)}));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i===0) ctx.moveTo(p.x,p.y);
      else ctx.lineTo(p.x,p.y);
    });
    ctx.stroke();

    // cerchietti punti
    ctx.fillStyle = color;
    pts.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x,p.y,3,0,Math.PI*2);
      ctx.fill();
    });
  }

  // disegna linee: verde = win, rosso = loss
  drawLine(winPerc,  '#3ddc84');
  drawLine(lossPerc, '#ff5252');

  // caption conteggi totali
  ctx.fillStyle = '#9aa0a6';
  ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const caption = `Tot. Vittorie: ${totalWins} · Tot. Sconfitte: ${totalLoss}`;
  ctx.fillText(caption, pad.l, pad.t - 6);

  // messaggi "nessun dato"
  if (!totalWins && !totalLoss){
    ctx.fillStyle = '#9aa0a6';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Nessuna statistica disponibile', cssW/2, cssH/2);
  }
}

// opzionale: seed rapido per test locale
function seedDemoStats(){
  const rnd = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const arr = [];
  for (let i=0;i<60;i++) arr.push({won:true,  turn:rnd(3,18), deck:'demo'});
  for (let i=0;i<40;i++) arr.push({won:false, turn:rnd(2,20), deck:'demo'});
  localStorage.setItem('mtgStats', JSON.stringify(arr));
}


function createCardDiv(card) {
  const div = document.createElement('div');
  let extraClass =
    card.name === 'Forest' ? 'forest' :
    card.name === 'Swamp' ? 'swamp' :
    (card.name === 'Wastewood Verge' || card.name === 'Underground Mortuary') ? 'dual-black-green' :
    '';

  div.className = 'card' + (card.tapped ? ' tapped' : '') + ' ' + extraClass;
  div.innerHTML = `<strong>${card.name}</strong><br>${card.cost || '—'}`;

  if (card.type === 'creature') {
    let statsText = `${card.strength}/${card.constitution}`;
    if (card.combatModifiers && card.combatModifiers.includes('defender')) {
      statsText = `🛡${statsText}`; // aggiunge l'iconcina scudo davanti
    }
    div.innerHTML += `<div class="stats">${statsText}</div>`;
  }

  return div;
}
