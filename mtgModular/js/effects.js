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
    // Placeholder: non implementato, ma riconosciuto
    console.log("👁️ Surveil triggered");
  }
};

// Applica tutti gli effetti definiti in card.onEnter
export function applyOnEnter(card) {
  (card.onEnter || []).forEach(effectName => {
    const effect = effects[effectName];
    if (typeof effect === 'function') {
      effect();
    }
  });
}
