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
  getAvailableMana();
}

export function drawCard() {
  if (state.deck.length > 0) {
    state.hand.push(state.deck.shift());
  }
}

export function playTurn() {
  state.turn++;
  state.landsPlayed = 0;
  state.battlefield.forEach(card => {
    if (card.type === 'creature' && card.summonSickness) {
      delete card.summonSickness;
    }
  });
  drawCard();
  saveState();
}

// Gioca una carta dalla mano
export function playCard(index) {
  const card = state.hand[index];
  if (!card) return;

  // Rimuovi dalla mano
  state.hand.splice(index, 1);

  // Preparazione della carta per il battlefield
  const newCard = { ...card, tapped: false };

  if (newCard.type === 'creature') {
    newCard.summonSickness = true;
    state.battlefield.push(newCard);
  } else if (newCard.type === 'land') {
    if (state.landsPlayed >= 1) {
      throw new Error('Cannot play more than one land per turn');
      state.hand.push(card); // rimetti in mano se non valido
      return;
    }
    // Entra tappata se ha l'effetto entersTapped
    if (newCard.onEnter?.includes('entersTapped')) {
      newCard.tapped = true;
    }
    state.battlefield.push(newCard);
    state.landsPlayed++;
  }

  // 🔹 Applica effetti onEnter
  if (newCard.onEnter) {
    applyOnEnter(newCard);
  }

  // 🔹 Aggiorna stato e UI
  saveState();
  getAvailableMana();
  render();
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
    playCard(index); // usa la logica centralizzata
  }
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

export function hasCombatModifier(card, modifier) {
  return card.combatModifiers && card.combatModifiers.includes(modifier);
}

// Somma della forza di tutte le creature sul campo
export function getStrenghtTotalCreatures() {
  return state.battlefield
    .filter(c => c.type === 'creature')
    .reduce((sum, c) => sum + c.strength, 0);
}

// Forza delle creature disponibili per attacco
export function getCombatStrenght() {
  return state.battlefield
    .filter(c => c.type === 'creature' && !c.tapped)
    .filter(c => !c.combatModifiers?.includes('defender'))
    .filter(c => !c.summonSickness) // <-- Non contare le creature con summon sickness
    .reduce((total, c) => total + c.strength, 0);
}

export function getAvailableMana() {
  const mana = state.battlefield.filter(c => c.type === 'land' && !c.tapped).length;
  const span = document.getElementById('availableMana');
  if (span) {
    span.textContent = `Available mana: ${mana}`;
  }
  return mana;
}

export function untapAll() {
  state.battlefield.forEach(card => {
    card.tapped = false;
  });
  saveState();
}

export function passTurn() {
  state.turn += 1;
  state.landsPlayed = 0;
    state.battlefield.forEach(card => {
    if (card.type === 'creature' && card.summonSickness) {
      delete card.summonSickness;
    }
  });
  saveState();
}

