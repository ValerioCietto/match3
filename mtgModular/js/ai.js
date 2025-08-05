import { state } from './state.js';
import { drawCards, getAvailableMana, getCombatStrenght, playCard, untapAll, passTurn, tapAvailableLands } from './engine.js';
import { render } from './ui.js';

export const strategy = {
  turnActions: ['start', 'playLand', 'playCreature', 'combat', 'end'],

  // Play style is a high-level heuristic that influences decisions
  // Possible values:
  // - "normal": default, play creatures, attack, reduce opponent hp to zero
  // - "reanimator": fill graveyard with creatures, then use resurrection effects
  // - "landfall": prioritize playing lands and triggering landfall abilities
  // - "millOpponent": focus on milling opponent's library to zero cards
  playStyle: 'normal', 
  playLand: 'any',
  playCreature: 'strongest'
};

export function runTurn() {
  logReasoning(`--- AI TURN ${state.turn} ---`);

  for (const action of strategy.turnActions) {
    switch (action) {
      case 'start':
        _startPhase();
        break;
      case 'playLand':
        _playLandPhase();
        break;
      case 'playCreature':
        _playCreaturePhase();
        break;
      case 'combat':
        _combatPhase();
        break;
      case 'end':
        _endPhase();
        break;
    }
  }
}

/* === Private Turn Phases === */

function _startPhase() {
  if (strategy.playStyle !== 'normal') return;
  // In future, different play styles could modify start behavior:
  // - reanimator: prefer drawing & discarding or milling effects here
  // - landfall: might prioritize ramp spells to play multiple lands
  // - millOpponent: could hold creatures and focus on setup spells

  logReasoning(`Start phase: untap and draw`);
  untapAll();
  drawCards(1);
  render();
}

function _playLandPhase() {
  if (strategy.playLand !== 'any') return;

  const index = state.hand.findIndex(c => c.type === 'land');
  if (index !== -1) {
    logReasoning(`Playing land: ${state.hand[index].name}`);
    try {
      playCard(index);
    } catch (err) {
      logReasoning(`AI failed to play land: ${err.message}`);
    }
    render();
  }
}

function _playCreaturePhase() {
  if (strategy.playCreature !== 'strongest') return;

  const mana = getAvailableMana();
  const candidates = state.hand
    .map((c, i) => ({ ...c, index: i }))
    .filter(c => c.type === 'creature' && c.cmc <= mana);

  if (!candidates.length) return;

  const best = candidates.sort((a, b) => b.strength - a.strength)[0];
  logReasoning(`Playing creature: ${best.name}`);

  try {
    playCard(best.index);
    tapAvailableLands(best.cmc);
  } catch (err) {
    logReasoning(`AI failed to play creature: ${err.message}`);
  }
  render();
}

function _combatPhase() {
  const combatPower = getCombatStrenght();
  logReasoning(`Combat phase: total attacking power ${combatPower}`);
}

function _endPhase() {
  logReasoning(`End phase`);
  passTurn();
  render();
}

/* === Logging === */

function logReasoning(text) {
  const zone = document.getElementById('reasoningZone');
  const log = document.getElementById('reasoningLog');
  zone.style.display = 'block';
  log.textContent += text + '\n';
}
