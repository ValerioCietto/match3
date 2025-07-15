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
