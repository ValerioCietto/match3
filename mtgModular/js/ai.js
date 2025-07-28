import { state } from './state.js';
import { drawCards, getAvailableMana, playCard, untapAll, passTurn } from './engine.js';
import { render } from './ui.js';

export const strategy = {
  turnActions: ['start', 'playLand', 'playCreature', 'combat', 'end'],
  startActions: 'normal',
  playLand: 'any',
  playCreature: 'strongest'
};

export function runTurn() {
  logReasoning(`--- AI TURN ${state.turn} ---`);

  for (const action of strategy.turnActions) {
    if (action === 'start' && strategy.startActions === 'normal') {
      logReasoning(`Start phase: untap and draw`);
      state.battlefield.forEach(c => (c.tapped = false));
      drawCards(1);
      render();
    }

    if (action === 'playLand' && strategy.playLand === 'any') {
      const index = state.hand.findIndex(c => c.type === 'land');
      if (index !== -1) {
        logReasoning(`Playing land: ${state.hand[index].name}`);
        playCard(index);
        render();
      }
    }

    if (action === 'playCreature' && strategy.playCreature === 'strongest') {
      const mana = getAvailableMana();
      const candidates = state.hand
        .map((c, i) => ({ ...c, index: i }))
        .filter(c => c.type === 'creature' && c.cmc <= mana);

      if (candidates.length) {
        const best = candidates.sort((a, b) => b.strength - a.strength)[0];
        logReasoning(`Playing creature: ${best.name}`);
        playCard(best.index);
        tapAvailableLands(best.cmc);
        render();
      }
    }

    if (action === 'combat') {
      logReasoning(`Combat phase: (not implemented)`);
    }

    if (action === 'end') {
      logReasoning(`End phase`);
      passTurn();
      render();
    }
  }
}

function tapAvailableLands(n) {
  const lands = state.battlefield.filter(c => c.type === 'land' && !c.tapped);
  for (let i = 0; i < n && i < lands.length; i++) {
    lands[i].tapped = true;
  }

}

function logReasoning(text) {
  const zone = document.getElementById('reasoningZone');
  const log = document.getElementById('reasoningLog');
  zone.style.display = 'block';
  log.textContent += text + '\n';
}
