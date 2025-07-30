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
  const combatEl = document.getElementById('combatStrength');

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

  // Aggiorna Combat Strength
  if (combatEl) {
    combatEl.textContent = `Combat Strength: ${getCombatStrenght()}`;
  }
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
