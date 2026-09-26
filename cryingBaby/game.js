'use strict';

const { Game, definitions: D, DAY, END } = CryingBaby;
const $ = id => document.getElementById(id);

let game = null;
let running = false;
let last = 0;
let focusId = null;
let choices = [];
let deadline = 0;
let revealed = false;
let wrongPenalty = 0;
let mode = 'intro';
let calmKey = null;
let activityVersion = 0;

const clock = t =>
  `${String(Math.floor(t % DAY / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

const countdown = t => {
  const s = Math.ceil(Math.max(0, t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Avvio, pausa e riepilogo.
function modal(title, text, button) {
  $('modalTitle').textContent = title;
  $('modalText').textContent = text;
  $('start').textContent = button;

  if (!$('overlay').open) {
    $('overlay').showModal();
  }
}

function start() {
  if (mode === 'intro' || mode === 'end') {
    try {
      game = new Game();
    } catch (e) {
      $('modalText').textContent = e.message;
      return;
    }

    focusId = null;
    choices = [];
    calmKey = null;
    activityVersion = 0;
    $('summary').textContent = '';
    $('feedback').textContent = 'Osserva gli indizi e scegli un intervento.';
  }

  mode = 'playing';
  running = true;
  last = performance.now();
  $('overlay').close();
  $('pause').disabled = false;
  render();
}

function pause() {
  if (!running) return;

  running = false;
  mode = 'pause';
  $('modalEyebrow').textContent = 'UN PICCOLO RESPIRO';
  $('modalNote').textContent = 'Il tempo della giornata e l’irritazione sono fermi.';

  modal(
    'La settimana può aspettare.',
    'Riprendi quando vuoi: il bambino e il diario restano qui.',
    'Riprendi la partita →'
  );
}

function finish() {
  running = false;
  mode = 'end';
  $('pause').disabled = true;
  $('modalEyebrow').textContent = 'SETTIMANA COMPLETATA';
  $('modalNote').textContent = 'I bisogni ancora aperti non sono automaticamente errori.';

  const s = game.stats;
  const mean = s.responses.length
    ? s.responses.reduce((a, b) => a + b, 0) / s.responses.length
    : 0;

  $('summary').textContent = `${s.resolved} bisogni risolti · ${s.errors} tentativi errati · ${s.timeouts} aiuti per tempo scaduto · ${s.missed} promemoria mancati · ${game.needs.length} bisogni aperti · ${mean.toFixed(1)} s di risposta media`;

  modal(
    'Sette giorni insieme.',
    'Hai concluso la tua piccola grande settimana. Ogni attenzione ha fatto la differenza.',
    'Gioca una nuova settimana →'
  );
}

// Scelta del bisogno e preparazione delle risposte.
function selectFocus() {
  const active = game.active();

  return (
    active.find(n => n.id === game.job?.id) ||
    active.find(n => n.id === focusId) ||
    active.find(n =>
      n.type === 'belly' || (n.type === 'diaper' && game.time - n.since > 90)
    ) ||
    active.find(n => !['tummy', 'vitamin'].includes(n.type)) ||
    active[0]
  );
}

function makeChoices(n) {
  const correct = game.actions(n)[0];
  const pool = Object.keys(D).filter(k =>
    k !== correct && !['tummy', 'vitamin', 'shower', 'shopping'].includes(k)
  );
  const wrong = [];

  while (wrong.length < 2) {
    const k = pool[game.int(0, pool.length - 1)];
    if (!wrong.includes(k)) wrong.push(k);
  }

  choices = [correct, ...wrong];

  for (let i = choices.length - 1; i > 0; i--) {
    const j = game.int(0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  $('answers').replaceChildren();

  for (const action of choices) {
    const b = document.createElement('button');
    b.className = 'answer';
    b.dataset.action = action;

    const icon = document.createElement('span');
    icon.className = 'emoji';
    icon.textContent = D[action][2];
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = D[action][1];

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '→';
    b.append(icon, label, arrow);

    b.onclick = () => {
      if (!running || game.job) return;

      const ok = game.choose(action);

      if (ok) {
        $('feedback').textContent = 'Bene, ti stai prendendo cura di un bisogno attivo.';
      } else {
        wrongPenalty += 3;
        $('feedback').textContent = 'Questo intervento non serve ora. Rileggi gli indizi. −3 secondi';
      }

      render();
    };

    $('answers').append(b);
  }
}

// Le attività volontarie compaiono solo nei momenti di calma.
function renderCalmActivities() {
  const actions = ['tummy', 'vitamin', 'shower', 'shopping'];
  const day = Math.min(6, Math.floor(game.time / DAY));
  const key = JSON.stringify([
    day, game.routines[day], actions.map(action => game.calmAvailable(action))
  ]);

  if (calmKey === key) return;
  calmKey = key;
  $('answers').replaceChildren();

  for (const action of actions) {
    const button = document.createElement('button');
    button.className = 'answer';
    button.disabled = !running || !game.calmAvailable(action);
    button.dataset.calmAction = action;

    const completed = game.routines[day][action];
    const suffix = completed ? ' · ✓ fatto oggi' : action === 'shopping' ? ' · 09:00–20:00' : '';
    button.textContent = `${D[action][2]} ${D[action][1]}${suffix}`;
    button.onclick = () => {
      if (!running || !game.startCalmActivity(action)) return;
      $('feedback').textContent = `${D[action][1]}… Se il bambino ha bisogno di te, l’attività si interrompe.`;
      render();
    };
    $('answers').append(button);
  }
}

// Aggiornamento dell'interfaccia dallo stato del motore.
function render() {
  if (!game) return;

  const day = Math.min(7, Math.floor(game.time / DAY) + 1);
  const level = game.level();

  // Orologio e avanzamento settimanale.
  $('day').textContent = `GIORNO ${day} / 7`;
  $('clock').textContent = game.done ? '24:00' : clock(game.time);
  $('remaining').textContent = `${countdown(game.done ? 0 : (DAY - game.time % DAY) / 3)} rimanenti`;
  $('dayProgress').value = game.done ? 480 : game.time % DAY / 3;

  if (!$('week').children.length) {
    for (let i = 0; i < 7; i++) {
      $('week').append(document.createElement('i'));
    }
  }

  [...$('week').children].forEach((el, i) =>
    el.className = i < day - 1 || game.done
      ? 'complete'
      : i === day - 1 ? 'current' : ''
  );

  // Irritazione e scena del bambino.
  document.querySelectorAll('[data-level]').forEach(el => {
    if (el.parentElement.id === 'levels') {
      el.classList.toggle('lit', Number(el.dataset.level) <= level);
    }
  });

  $('baby').dataset.level = level;
  $('mood').textContent = [
    'Un momento di calma',
    'Piccoli versetti',
    'C’è qualcosa che non va',
    'Ha proprio bisogno di te'
  ][level];

  $('escalation').textContent = level === 0
    ? 'Tutto tranquillo'
    : level === 3
      ? 'Livello massimo'
      : `Sale tra ${Math.ceil(10 - (game.time - game.episode) / 3 % 10)} s`;

  $('pending').textContent = `${game.active().length} bisogni attivi`;
  $('score').textContent = `${game.stats.resolved} risolti`;
  $('cluster').textContent = game.plan.clusters.some(
    ([a, b]) => game.time >= a && game.time < b
  ) ? '☾ CLUSTER FEEDING' : 'IL TUO PICCOLO MONDO';

  // Domanda, indizi e conto alla rovescia.
  const n = selectFocus();

  if (
    n?.id !== focusId ||
    (n && choices.every(k => !game.actions(n).includes(k)))
  ) {
    focusId = n?.id;
    deadline = game.time / 3 + 25;
    wrongPenalty = 0;
    revealed = false;

    if (n) {
      calmKey = null;
      makeChoices(n);
    } else {
      calmKey = null;
      $('answers').replaceChildren();
    }
  }

  $('question').textContent = n ? 'Di cosa ha bisogno?' : 'Un momento tutto vostro.';
  $('clues').textContent = n
    ? D[n.type][3] + (
      n.type === 'belly' && (n.belly || n.legs)
        ? `; ${n.belly ? 'massaggio' : 'sgambettamento'} già completato`
        : ''
    )
    : 'Il bambino è tranquillo: scegli un’attività per lui o un momento per te.';
  $('sceneCue').textContent = n ? D[n.type][2] : '💤';

  const left = n ? Math.max(0, deadline - game.time / 3 - wrongPenalty) : 0;

  if (n && !game.job && left === 0 && !revealed) {
    revealed = true;
    game.stats.timeouts++;
    $('feedback').textContent = `Un aiuto: ${D[game.actions(n)[0]][1].toLowerCase()}. ${D[n.type][3]}.`;
  }

  $('quizTime').textContent = game.job
    ? 'In corso'
    : n
      ? (revealed ? 'Aiuto disponibile' : `${Math.ceil(left)} s`)
      : 'In attesa';

  for (const b of $('answers').children) {
    b.disabled = b.dataset.calmAction
      ? !running || !game.calmAvailable(b.dataset.calmAction)
      : !!game.job || !running;
  }

  if (!n) renderCalmActivities();

  if (activityVersion !== game.activityVersion) {
    activityVersion = game.activityVersion;
    $('feedback').textContent = game.activityMessage;
  }

  // Azione in corso e rituali quotidiani.
  $('activity').hidden = !game.job;

  if (game.job) {
    $('activityLabel').textContent = D[game.job.action][1] + '…';
    $('activityProgress').value =
      (game.time - game.job.start) / (game.job.end - game.job.start);
  }

  for (const type of ['vitamin', 'tummy']) {
    const label = type === 'vitamin' ? '☀️ Vitamina D' : '🌿 Tummy time';
    const completed = game.routines[day - 1][type];
    $(type).textContent = `${label} · ${completed ? '✓ fatto' : 'a tua scelta'}`;
  }

  // Ricostruisce il diario solo quando cambia la sua versione.
  if (
    $('log').dataset.version !==
    String(game.log.length) + ':' + game.log[0]?.time + ':' + game.stats.resolved
  ) {
    $('log').replaceChildren();

    for (const item of game.log) {
      const li = document.createElement('li');
      li.textContent = `G${Math.min(7, Math.floor(item.time / DAY) + 1)} ${clock(item.time)} · ${item.text}`;
      $('log').append(li);
    }

    $('log').dataset.version =
      String(game.log.length) + ':' + game.log[0]?.time + ':' + game.stats.resolved;
  }
}

// Eventi della pagina e ciclo di animazione.
$('start').onclick = start;
$('pause').onclick = pause;

$('overlay').addEventListener('cancel', e => e.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});

function frame(now) {
  if (running) {
    game.advance((now - last) / 1000);
    render();
    if (game.done) finish();
  }

  last = now;
  requestAnimationFrame(frame);
}

$('overlay').showModal();
requestAnimationFrame(frame);
