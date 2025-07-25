import { state, CARD_LIBRARY, composition, saveState } from './state.js';
import { applyOnEnter } from './effects.js';

export function buildDeck() {
  const deck = [];
  for (const [cardName, count] of Object.entries(composition)) {
    for (let i = 0; i < count; i++) {
      deck.push({ name: cardName, ...CARD_LIBRARY[cardName] });
    }
  }
  shuffle(deck);
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function startGame() {
  state.deck = buildDeck();
  state.hand = [];
  state.battlefield = [];
  state.graveyard = [];
  state.turn = 1;
  state.landsPlayed = 0;
  state.selectedCardIndex = null;
  for (let i = 0; i < 7; i++) {
    drawCard();
  }
  shadowMulligan();
  saveState();
}

export function drawCard() {
  if (state.deck.length > 0) {
    state.hand.push(state.deck.shift());
  }
}

export function playTurn() {
  state.turn++;
  state.landsPlayed = 0;
  drawCard();
  saveState();
}

export function playCard(index) {
  const card = state.hand[index];
  if (!card) return;
  state.hand.splice(index, 1);
  state.battlefield.push({ ...card, tapped: false });
  if (card.onEnter) applyOnEnter(card);
  saveState();
  getAvailableMana()
}

function shadowMulligan() {
  const lands = state.hand.filter(c => c.type === 'land').length;
  if (lands === 0 || lands === state.hand.length) {
    state.deck.push(...state.hand);
    shuffle(state.deck);
    state.hand = [];
    for (let i = 0; i < 7; i++) {
      drawCard();
    }
  }
}

// Gioca la prima carta con quel nome dalla mano
export function playCardName(name) {
  const index = state.hand.findIndex(c => c.name === name);
  if (index !== -1) {
    const card = state.hand.splice(index, 1)[0];
    state.battlefield.push({ ...card, tapped: false });
    if (card.onEnter) applyOnEnter(card);
    saveState();
  }
  getAvailableMana()
}

// Pesca un numero di carte
export function drawCards(number) {
  for (let i = 0; i < number; i++) {
    if (state.deck.length > 0) {
      state.hand.push(state.deck.shift());
    }
  }
  saveState();
}

// Macina carte dal mazzo al cimitero
export function millCards(number) {
  for (let i = 0; i < number; i++) {
    if (state.deck.length > 0) {
      state.graveyard.push(state.deck.shift());
    }
  }
  saveState();
}

// Scarta una carta dalla mano per indice
export function discardCard(indexOrName) {
  if (typeof indexOrName === 'number') {
    const card = state.hand.splice(indexOrName, 1)[0];
    if (card) state.graveyard.push(card);
  } else if (typeof indexOrName === 'string') {
    const idx = state.hand.findIndex(c => c.name === indexOrName);
    if (idx !== -1) {
      const card = state.hand.splice(idx, 1)[0];
      state.graveyard.push(card);
    }
  }
  saveState();
}

// Somma della forza di tutte le creature in gioco
export function getStrengthTotalCreatures() {
  return state.battlefield
    .filter(c => c.type === 'creature')
    .reduce((sum, c) => sum + (c.strength || 0), 0);
}

// Somma della forza di tutte le creature non tappate e senza "defender"
export function getCombatStrength() {
  return state.battlefield
    .filter(c =>
      c.type === 'creature' &&
      !c.tapped &&
      !(c.abilities || []).includes('defender')
    )
    .reduce((sum, c) => sum + (c.strength || 0), 0);
}

export function getAvailableMana() {
  const mana = state.battlefield.filter(c => c.type === 'land' && !c.tapped).length;
  const span = document.getElementById('availableMana');
  if (span) {
    span.textContent = `Available mana: ${mana}`;
  }
  return mana;
}

