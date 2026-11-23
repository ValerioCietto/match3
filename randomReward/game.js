"use strict";

const pipPositions = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// Each selected face points upward before the camera tilt is applied.
const orientations = { 1: [90, 0], 2: [90, -90], 3: [0, 0], 4: [180, 0], 5: [90, 90], 6: [90, 180] };
const $ = (selector) => document.querySelector(selector);
const grid = $("#dice-grid");
const rollButton = $("#roll-button");
const result = $("#result");
const SAVE_KEY = "randomReward.save.v1";
let state = loadState();
let diceViews = [];
const isRolling = () => diceViews.some(view => view.rolling);
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const rotation = ([x, y]) => `rotateX(${x}deg) rotateY(${y}deg)`;

function loadState() {
  const fresh = DiceRules.fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || !Number.isSafeInteger(saved.credits) || saved.credits < 0) return fresh;
    for (const [key, upgrade] of Object.entries(DiceRules.upgrades)) {
      if (!Number.isInteger(saved[key]) || saved[key] < 0 || saved[key] > upgrade.cap) return fresh;
      fresh[key] = saved[key];
    }
    fresh.credits = saved.credits;
    return fresh;
  } catch {
    return fresh;
  }
}

function saveState() {
  // Include already-determined winnings so closing mid-animation loses no payout.
  const credits = state.credits + diceViews.reduce((total, view) => total + (view.pendingReward || 0), 0);
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, credits }));
  } catch {
    // Keep the game playable when browser storage is unavailable or full.
  }
}

const upgradeViews = Object.entries(DiceRules.upgrades).map(([key, upgrade]) => {
  const button = document.createElement("button");
  button.className = "upgrade";
  if (key === "casino") button.classList.add("casino-upgrade");
  button.innerHTML = `<span class="upgrade-name">${upgrade.name}</span><span class="upgrade-description">${upgrade.description}</span><span class="upgrade-bottom"><span class="upgrade-level"></span><strong class="upgrade-cost"></strong></span>`;
  button.addEventListener("click", () => {
    if (isRolling() || !DiceRules.buy(state, key)) return;
    if (key === "dice") buildDice();
    result.textContent = `${upgrade.name} upgraded.`;
    refresh();
    if (key === "casino") $("#win-title").focus();
  });
  $("#upgrade-list").append(button);
  return { key, button, level: button.querySelector(".upgrade-level"), cost: button.querySelector(".upgrade-cost") };
});

function buildDice() {
  grid.replaceChildren();
  grid.classList.toggle("multiple", state.dice > 0);
  diceViews = Array.from({ length: state.dice + 1 }, (_, index) => {
    const slot = document.createElement("div");
    slot.className = "die-slot";
    slot.innerHTML = '<div class="shadow" aria-hidden="true"></div><button class="dice-button"><span class="lift"><span class="view"><span class="dice" aria-hidden="true"></span></span></span></button><span class="die-reward"></span>';
    const button = slot.querySelector("button");
    button.setAttribute("aria-label", `Die ${index + 1}. Tap to roll this die`);
    button.addEventListener("click", () => roll(diceViews[index]));
    const cube = slot.querySelector(".dice");
    for (let value = 1; value <= 6; value++) {
      const face = document.createElement("span");
      face.className = `face face-${value}`;
      for (const position of pipPositions[value]) {
        const pip = document.createElement("span");
        pip.className = "pip";
        pip.style.gridRow = Math.ceil(position / 3);
        pip.style.gridColumn = (position - 1) % 3 + 1;
        face.append(pip);
      }
      cube.append(face);
    }
    grid.append(slot);
    return { slot, button, cube, index, rolling: false, orientation: [0, 0], reward: slot.querySelector(".die-reward") };
  });
}

function refresh() {
  saveState();
  const rolling = isRolling();
  $(".game").hidden = Boolean(state.casino);
  $("#win-screen").hidden = !state.casino;
  $("#final-credits").textContent = `${state.credits.toLocaleString()} cr remaining`;
  $("#credits").innerHTML = `${state.credits.toLocaleString()} <small>cr</small>`;
  $("#stats").textContent = `${state.dice + 1}/10 dice · ${state.free}% free roll · ${state.double}% double win`;
  const idle = diceViews.filter(view => !view.rolling).length;
  const affordable = state.free === 100 ? idle : Math.min(idle, Math.floor(state.credits / DiceRules.price(state)));
  rollButton.textContent = !idle ? "Rolling…" : state.free === 100 ? `Roll ${idle} · Free` : `Roll ${affordable || 1} · ${DiceRules.price(state)} cr each`;
  const blocked = !DiceRules.canRoll(state);
  rollButton.disabled = !idle || blocked;
  diceViews.forEach(view => { view.button.disabled = view.rolling || blocked; });
  $("#restart").disabled = rolling;
  $("#hint").textContent = blocked && !rolling ? "Not enough credits to roll. Start over for 120 cr." : "Tap a die to roll it independently. Each die has its own cost and prize.";
  for (const view of upgradeViews) {
    const capped = state[view.key] >= DiceRules.upgrades[view.key].cap;
    const cost = DiceRules.cost(state, view.key);
    view.level.textContent = view.key === "casino" ? (state.casino ? "Owned" : "Final upgrade") : view.key === "dice" ? `${state.dice + 1}/10 dice` : view.key === "discount" ? `${DiceRules.price(state)} cr / roll` : `${state[view.key]}% chance`;
    view.cost.textContent = capped ? "MAX" : `${cost.toLocaleString("it-IT")} cr`;
    view.button.disabled = Boolean(state.casino) || rolling || capped || state.credits < cost;
  }
  const gameOver = $("#game-over-dialog");
  // A pending six may restore the balance, so wait for every die to settle.
  if (blocked && !rolling && !state.casino) {
    if (!gameOver.open) gameOver.showModal();
  } else if (gameOver.open) {
    gameOver.close();
  }
}

function fountain(slot, amount) {
  if (reducedMotion()) return;
  const count = Math.min(32, 12 + Math.floor(amount / 8));
  for (let i = 0; i < count; i++) {
    const coin = document.createElement("span");
    coin.className = "coin";
    coin.textContent = "✦";
    coin.setAttribute("aria-hidden", "true");
    slot.append(coin);
    const spread = (Math.random() - .5) * 220;
    const height = 90 + Math.random() * 120;
    const spin = (Math.random() - .5) * 720;
    const animation = coin.animate([
      { transform: "translate(-50%, 0) rotate(0deg)", opacity: 0 },
      { transform: `translate(calc(-50% + ${spread * .45}px), ${-height}px) rotate(${spin * .5}deg)`, opacity: 1, offset: .45 },
      { transform: `translate(calc(-50% + ${spread}px), 65px) rotate(${spin}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 400, delay: i * 20, easing: "linear", fill: "both" });
    animation.finished.then(() => coin.remove());
  }
}

async function roll(view) {
  if (view.rolling) return;
  const outcome = DiceRules.startRoll(state);
  if (!outcome) return;
  view.rolling = true;
  view.pendingReward = outcome.total;
  result.textContent = `Die ${view.index + 1} · ${outcome.free ? "Free roll!" : `Rolling · ${outcome.paid} cr`}`;
  view.slot.classList.remove("winner");
  view.reward.textContent = outcome.free ? "Free roll!" : "Rolling…";
  view.slot.classList.add("rolling");
  refresh();
  const die = outcome.dice[0];
  const target = orientations[die.value];
  const animation = view.cube.animate([
    { transform: rotation(view.orientation) },
    { transform: rotation([target[0] + 720, target[1] + 1080]) },
  ], { duration: reducedMotion() ? 0 : 1250, easing: "cubic-bezier(.18,.65,.25,1)", fill: "forwards" });
  await animation.finished;
  view.cube.style.transform = rotation(target);
  animation.cancel();
  view.orientation = target;
  view.button.setAttribute("aria-label", `Die ${view.index + 1}: top face ${die.value}. Roll this die`);
  state.credits += outcome.total;
  view.pendingReward = 0;
  view.slot.classList.remove("rolling");
  view.reward.textContent = `Rolled ${die.value}`;
  if (die.reward) {
    view.slot.classList.add("winner");
    view.reward.textContent = `+${die.reward} cr${die.doubled ? " · DOUBLE!" : ""}`;
    fountain(view.slot, die.reward);
  }
  result.textContent = `Die ${view.index + 1}: ${die.value}${outcome.free ? " · Free roll" : ""}${outcome.total ? ` — Won ${outcome.total} cr!` : " — No six this time."}`;
  view.rolling = false;
  refresh();
}

rollButton.addEventListener("click", () => {
  // Reserve one fee per die synchronously before any animations finish.
  const idle = diceViews.filter(view => !view.rolling);
  const count = state.free === 100 ? idle.length : Math.min(idle.length, Math.floor(state.credits / DiceRules.price(state)));
  idle.slice(0, count).forEach(view => roll(view));
});
$("#restart").addEventListener("click", () => {
  if (isRolling()) return;
  if (DiceRules.canRoll(state) && !confirm("Start over with 120 credits? Your upgrades will be reset.")) return;
  restartGame();
});
function restartGame() {
  if (isRolling()) return;
  $("#game-over-dialog").close();
  state = DiceRules.fresh();
  buildDice();
  result.textContent = "Fresh start. Ready to roll?";
  refresh();
  rollButton.focus();
}
$("#play-again").addEventListener("click", restartGame);
$("#try-again").addEventListener("click", restartGame);
$("#dismiss-game-over").addEventListener("click", () => $("#game-over-dialog").close());
buildDice();
refresh();
