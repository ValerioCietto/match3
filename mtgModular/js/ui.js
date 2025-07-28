import { state, saveState } from './state.js';
import { playCard, startGame, playTurn } from './engine.js';
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
}

export function render() {
  const handEl = document.getElementById('hand');
  const graveEl = document.getElementById('graveyard');
  const creatureZone = document.getElementById('creatureZone');
  const landZone = document.getElementById('landZone');

  handEl.innerHTML = '';
  graveEl.innerHTML = '';
  creatureZone.innerHTML = '';
  landZone.innerHTML = '';

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
}

function createCardDiv(card) {
  const div = document.createElement('div');

  let extraClass = '';
  if (card.name === 'Forest') extraClass = 'forest';
  else if (card.name === 'Swamp') extraClass = 'swamp';
  else if (card.name === 'Wastewood Verge' || card.name === 'Underground Mortuary') {
    extraClass = 'dual-black-green';
  }

  const tappedClass = card.tapped ? 'tapped' : '';
  div.className = `card ${extraClass} ${tappedClass}`.trim();

  div.innerHTML = `<strong>${card.name}</strong><br>${card.cost || '—'}`;

  if (card.type === 'creature') {
    div.innerHTML += `<div class="stats">${card.strength}/${card.constitution}</div>`;
  }

  return div;
}
