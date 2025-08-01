import { CARD_LIBRARY, composition } from './state.js';

export async function loadCards() {
  const res = await fetch('../mtgModular/cards_tifa_landfall.json');
  const data = await res.json();

  Object.assign(CARD_LIBRARY, data.library);
  Object.assign(composition, data.composition);
}
