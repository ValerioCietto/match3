import { loadState, state } from './state.js';
import { render, setupUI } from './ui.js';
import { loadCards } from './cardsLoader.js';

let initComplete = false;

// Carica dati carte da cards.json
loadCards().then(() => {
  loadState();      // Ripristina salvataggio locale
  setupUI();        // Collega i bottoni
  render();         // Mostra lo stato iniziale
  initComplete = true;
});
