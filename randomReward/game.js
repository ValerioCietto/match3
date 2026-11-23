"use strict";

const pipPositions = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// Each selected face points upward before the camera tilt is applied.
const orientations = { 1: [90, 0], 2: [90, -90], 3: [0, 0], 4: [180, 0], 5: [90, 90], 6: [90, 180] };
const $ = (selector) => document.querySelector(selector);
const grid = $("#dice-grid");
const rollButton = $("#roll-button");
const result = $("#result");
const billionaire = new URLSearchParams(location.search).get("billionaire") === "true";
const SAVE_KEY = billionaire ? "randomReward.billionaire.v1" : "randomReward.save.v1";
const startingCredits = billionaire ? 1000000 : 120;
let state = loadState();
let diceViews = [];
const isRolling = () => diceViews.some(view => view.rolling);
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const rotation = ([x, y]) => `rotateX(${x}deg) rotateY(${y}deg)`;

function loadState() {
  const fresh = DiceRules.fresh(billionaire);
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || !Number.isSafeInteger(saved.credits) || saved.credits < 0) return fresh;
    for (const [key, upgrade] of Object.entries(DiceRules.upgrades)) {
      if (!Number.isInteger(saved[key]) || saved[key] < 0 || saved[key] > upgrade.cap) return fresh;
      fresh[key] = saved[key];
    }
    fresh.credits = saved.credits;
    fresh.luckyStart = saved.luckyStart === true;
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
  layoutDice();
}

function layoutDice() {
  const count = diceViews.length;
  const width = grid.clientWidth || 600;
  const height = grid.clientHeight || 300;
  let columns = 1, cell = 0;
  for (let c = 1; c <= count; c++) {
    const candidate = Math.min(width / c, height / Math.ceil(count / c));
    if (candidate > cell) { columns = c; cell = candidate; }
  }
  const size = Math.max(8, Math.min(136 / Math.pow(count, .2), cell * .48));
  grid.style.setProperty("--columns", columns);
  grid.style.setProperty("--rows", Math.ceil(count / columns));
  grid.style.setProperty("--size", `${size}px`);
  grid.style.setProperty("--half", `${size / 2}px`);
  grid.style.setProperty("--toss", `${-Math.min(45, cell * .18)}px`);
  grid.classList.toggle("dense", count > 16);
}

function refresh() {
  saveState();
  const rolling = isRolling();
  $(".game").hidden = Boolean(state.casino);
  $("#win-screen").hidden = !state.casino;
  $("#final-credits").textContent = `${state.credits.toLocaleString("it-IT", { useGrouping: "always" })} cr remaining`;
  $("#credits").innerHTML = `${state.credits.toLocaleString("it-IT", { useGrouping: "always" })} <small>cr</small>`;
  $("#stats").textContent = `${state.dice + 1}/100 dice · ${state.free}% free roll · ${state.double}% double win`;
  const totalCost = state.free === 100 ? 0 : diceViews.length * DiceRules.price(state);
  rollButton.textContent = rolling ? "Rolling…" : `Roll all ${diceViews.length} · ${totalCost.toLocaleString("it-IT", { useGrouping: "always" })} cr`;
  const blocked = !DiceRules.canRoll(state);
  rollButton.disabled = rolling || blocked || state.credits < totalCost;
  diceViews.forEach(view => { view.button.disabled = view.rolling || blocked; });
  $("#restart").disabled = rolling;
  $("#hint").textContent = state.luckyStart ? "Lucky start: your first die will land on six." : blocked && !rolling ? "Not enough credits to roll. Start a new game." : state.credits < totalCost ? "Not enough for all dice. Tap an individual die to roll." : "All dice roll six: JACKPOT × dice count. Free spins reduce the total cost.";
  $("#restart").textContent = `Start over · ${startingCredits.toLocaleString("it-IT", { useGrouping: "always" })} cr`;
  $("#try-again").textContent = `Try again · ${startingCredits.toLocaleString("it-IT", { useGrouping: "always" })} cr`;
  for (const view of upgradeViews) {
    const capped = state[view.key] >= DiceRules.upgrades[view.key].cap;
    const cost = DiceRules.cost(state, view.key);
    view.level.textContent = view.key === "casino" ? (state.casino ? "Owned" : "Final upgrade") : view.key === "dice" ? `${state.dice + 1}/100 dice` : view.key === "discount" ? `${DiceRules.price(state)} cr / roll` : `${state[view.key]}% chance`;
    view.cost.textContent = capped ? "MAX" : `${cost.toLocaleString("it-IT", { useGrouping: "always" })} cr`;
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

function fountain(slot, amount, doubled = false) {
  if (reducedMotion()) return;
  const count = Math.min(32, 12 + Math.floor(amount / (doubled ? 16 : 8))) * (doubled ? 2 : 1);
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

let latestRound = 0;
function roll(view) { return rollDice([view]); }

async function rollDice(views) {
  if (!views.length || views.some(view => view.rolling) || !DiceRules.canRoll(state)) return;
  const totalCost = state.free === 100 ? 0 : views.length * DiceRules.price(state);
  if (state.credits < totalCost) return;
  const round = ++latestRound;
  const outcomes = views.map(() => DiceRules.startRoll(state));
  const jackpot = DiceRules.jackpot(outcomes, diceViews.length);
  const totalWin = outcomes.reduce((sum, outcome) => sum + outcome.total, 0);
  const freeSpins = outcomes.filter(outcome => outcome.free).length;
  const paid = outcomes.reduce((sum, outcome) => sum + outcome.paid, 0);
  views.forEach((view, index) => {
    view.rolling = true;
    view.pendingReward = outcomes[index].total;
    view.slot.classList.remove("winner");
    view.slot.classList.add("rolling");
    view.reward.textContent = outcomes[index].free ? "Free spin" : "Rolling…";
  });
  result.textContent = "Rolling · " + paid.toLocaleString("it-IT", { useGrouping: "always" }) + " cr paid · " + freeSpins + " free spins";
  result.classList.remove("jackpot");
  refresh();
  await Promise.all(views.map(async (view, index) => {
    const die = outcomes[index].dice[0];
    const target = orientations[die.value];
    const animation = view.cube.animate([
      { transform: rotation(view.orientation) },
      { transform: rotation([target[0] + 720, target[1] + 1080]) },
    ], { duration: reducedMotion() ? 0 : 1250, easing: "cubic-bezier(.18,.65,.25,1)", fill: "forwards" });
    await animation.finished;
    view.cube.style.transform = rotation(target);
    animation.cancel();
    view.orientation = target;
    view.button.setAttribute("aria-label", "Die " + (view.index + 1) + ": top face " + die.value + ". Won " + die.reward + " credits. Roll this die");
    view.button.title = "Die " + (view.index + 1) + " · " + die.value + " · +" + die.reward + " cr";
    state.credits += die.reward;
    view.pendingReward = 0;
    view.rolling = false;
    view.slot.classList.remove("rolling");
    view.reward.textContent = die.reward ? "+" + die.reward + (die.doubled ? " ×2" : " cr") : "Rolled " + die.value;
    if (die.reward) {
      view.slot.classList.add("winner");
      fountain(view.slot, die.reward, die.doubled);
    }
    refresh();
  }));
  if (round === latestRound) {
    result.textContent = (jackpot ? "JACKPOT ×" + diceViews.length + "! " : "") + "Total win +" + totalWin.toLocaleString("it-IT", { useGrouping: "always" }) + " cr · " + freeSpins + " free spins";
    result.classList.toggle("jackpot", jackpot);
  }
}

rollButton.addEventListener("click", () => rollDice(diceViews));
$("#restart").addEventListener("click", () => {
  if (isRolling()) return;
  if (DiceRules.canRoll(state) && !confirm(`Start over with ${startingCredits.toLocaleString("it-IT", { useGrouping: "always" })} credits? Your upgrades will be reset.`)) return;
  restartGame();
});
function restartGame() {
  if (isRolling()) return;
  $("#game-over-dialog").close();
  state = DiceRules.fresh(billionaire);
  buildDice();
  result.textContent = "Lucky start! Your first roll is a six.";
  result.classList.remove("jackpot");
  refresh();
  rollButton.focus();
}
$("#play-again").addEventListener("click", restartGame);
$("#try-again").addEventListener("click", restartGame);
$("#dismiss-game-over").addEventListener("click", () => $("#game-over-dialog").close());
buildDice();
refresh();

if (typeof ResizeObserver !== "undefined") new ResizeObserver(layoutDice).observe(grid);
