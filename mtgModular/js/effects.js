import { state } from './state.js';

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
  }

  entersTapped(card) {
    // Quando la carta entra in gioco, viene tappata automaticamente
    card.tapped = true;
    saveState();
    render();
  }
};

// Esegue la lista di effetti onEnter di una carta
export function triggerOnEnter(card) {
  if (!card.onEnter) return;
  card.onEnter.forEach(effectName => {
    if (effects[effectName]) {
      effects[effectName](card);
    }
  });
}
