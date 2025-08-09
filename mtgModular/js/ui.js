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

export function drawStatsGraph() {
  const stats = loadStats();
  const ctx = document.getElementById('statsGraph').getContext('2d');
  ctx.clearRect(0,0,300,150);

  const maxTurn = 20;
  const winCounts = Array(maxTurn).fill(0);
  const lossCounts = Array(maxTurn).fill(0);

  stats.forEach(s => {
    if (s.turn <= maxTurn) {
      if (s.won) winCounts[s.turn-1]++;
      else lossCounts[s.turn-1]++;
    }
  });

  ctx.strokeStyle = "green";
  ctx.beginPath();
  winCounts.forEach((v,i) => {
    const x = (i/(maxTurn-1))*300;
    const y = 150 - (v * 10); // scale: 10px per game
    if (i === 0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.strokeStyle = "red";
  ctx.beginPath();
  lossCounts.forEach((v,i) => {
    const x = (i/(maxTurn-1))*300;
    const y = 150 - (v * 10);
    if (i === 0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();
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
