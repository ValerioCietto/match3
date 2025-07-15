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
    // Placeholder: effetto fittizio
    console.log("✨ Charm effect activated!");
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
