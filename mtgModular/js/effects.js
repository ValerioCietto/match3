import { state, saveState } from './state.js';
import { render } from './ui.js';

// Mappa di effetti attivabili da onEnter, ecc.
export const effects = {
  millThree() {
    for (let i = 0; i < 3; i++) {
      if (state.deck.length > 0) {
        state.graveyard.push(state.deck.shift());
      }
    }
  },

  charmEffect() {
    // Add offspring to battlefield
    const offspring = {
      name: "Fountainport Charmer's offspring",
      type: "creature",
      cost: "0",
      cmc: 0,
      color: "green",
      strength: 1,
      constitution: 1,
      tapped: false
    };
    state.battlefield.push(offspring);

    // Reduce cost of creatures in hand
    state.hand.forEach(card => {
      if (card.type === 'creature') {
        let originalCost = card.cost || "";
        let generic = parseInt(originalCost) || 0;
        let colored = originalCost.replace(/\d+/g, "");
        let reducedGeneric = Math.max(0, generic - 2);
        card.cost = (reducedGeneric > 0 ? reducedGeneric : "") + colored;

        // Recalculate CMC: generic + number of colored symbols
        let cmc = reducedGeneric + colored.length;
        card.cmc = cmc;
      }
    });
  },

  surveil() {
    if (state.deck.length === 0) return;
    const topCard = state.deck[0];
    if (topCard.type === 'creature') {
      state.graveyard.push(state.deck.shift());
      console.log(`Surveil: ${topCard.name} was a creature and was put into graveyard.`);
    } else {
      console.log(`Surveil: ${topCard.name} was kept on top.`);
    }
  },

  entersTapped(card) {
    // Quando la carta entra in gioco, viene tappata automaticamente
    console.log('card enters tapped', card);
    card.tapped = true;
    saveState();
    render();
  }
};

// Esegue la lista di effetti onEnter di una carta
export function applyOnEnter(card) {
  if (!card.onEnter) return;
  card.onEnter.forEach(effectName => {
    if (effects[effectName]) {
      effects[effectName](card);
    }
  });
}

// Esegue tutti i trigger onLandfall per le carte in gioco
export function applyOnLandfall() {
  const triggers = state.battlefield.filter(c => Array.isArray(c.onLandfall));

  if (triggers.length === 0) return;

  console.log(`executing trigger landfall on [${triggers.map(c => `"${c.name}"`).join(', ')}]`);

  triggers.forEach(card => {
    card.onLandfall.forEach(effect => {
      executeLandfallEffect(card, effect);
    });
  });
}

// Funzione per gestire singolo effetto Landfall
function executeLandfallEffect(card, effect) {
  // Puoi espandere qui la logica dei diversi tipi di effetti
  switch (effect) {
    case '11_counter':
      console.log(`${card.name} gains a +1/+1 counter (Landfall)`);
      if (card.strength !== undefined && card.constitution !== undefined) {
        card.strength += 1;
        card.constitution += 1;
      }
      break;

    case 'double_11_counters':
      console.log(`${card.name} doubles its +1/+1 counters (Landfall)`);
      // Qui potresti implementare logica per raddoppiare i segnalini reali
      if (card.strength !== undefined && card.constitution !== undefined) {
        card.strength *= 2;
        card.constitution *= 2;
      }
      break;

    case 'double_power':
      console.log(`${card.name} doubles its power (Landfall)`);
      if (card.strength !== undefined) {
        card.strength *= 2;
      }
      break;

    case 'landfall_trigger':
      console.log(`${card.name} triggers its landfall ability`);
      // Qui puoi mettere un effetto generico o un placeholder
      break;

    default:
      console.warn(`Unknown Landfall effect: ${effect} on ${card.name}`);
  }
}
