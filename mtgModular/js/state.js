export const CARD_LIBRARY = {};
export const composition = {};

export let state = {
  turn: 0,
  life: 20,
  opponentHp: 20,
  deck: [],
  hand: [],
  battlefield: [],
  graveyard: [],
  landsPlayed: 0,
  gameEnded: false,
  selectedCardIndex: null
};

export function saveState() {
  localStorage.setItem('mtgSimulatorState', JSON.stringify(state));
}

export function loadState() {
  const saved = localStorage.getItem('mtgSimulatorState');
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  }
}
