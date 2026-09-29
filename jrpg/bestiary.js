/* The bestiary reads the same catalogue as combat and never touches save data. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let entries = [];
  const regionName = id => id === 'final' ? 'Final Boss' : id.charAt(0).toUpperCase() + id.slice(1);
  const percent = value => `${Number((value * 100).toFixed(2))}%`;
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function card({id, enemy, encounters}) {
    const article = element('article', undefined, `monster${enemy.boss ? ' boss' : ''}`);
    article.dataset.enemy = id;
    article.append(element('div', enemy.boss ? 'Boss' : 'Regular monster', 'label'), element('h2', enemy.name));
    const stats = element('dl');
    for (const [label, value] of [['HP', enemy.hp], ['Attack', enemy.attack], ['Defense', `${enemy.defense}%`], ['Accuracy', `${enemy.accuracy}%`], ['Action cooldown', `${enemy.cooldown}t`], ['XP', enemy.xp], ['Gold', enemy.gold]]) {
      const pair = element('div');
      pair.append(element('dt', label), element('dd', value));
      stats.append(pair);
    }
    article.append(stats, element('h3', 'Special attack'));
    const s = enemy.special;
    article.append(element('p', s ? `${s.name} · Every ${s.every} actions · ${percent(s.multiplier)} damage · ${s.all ? 'All heroes' : 'One hero'}` : 'None — basic attacks only.'));
    article.append(element('h3', 'Found in'), element('p', encounters.map(b => b.name).join(' · ') || 'No current encounters.'));
    article.append(element('h3', 'Loot'));
    const loot = element('ul');
    for (const drop of enemy.loot) loot.append(element('li', `${drop.name} ×${drop.quantity} · ${percent(drop.chance)}`));
    article.append(enemy.loot.length ? loot : element('p', 'No loot drops.'));
    return article;
  }
  function render() {
    const query = $('search').value.trim().toLowerCase();
    const visible = entries.filter(({enemy, encounters}) =>
      (!query || [enemy.name, ...encounters.map(b => b.name)].join(' ').toLowerCase().includes(query)) &&
      (!$('region').value || encounters.some(b => b.region === $('region').value)) &&
      (!$('type').value || Boolean(enemy.boss) === ($('type').value === 'boss')));
    $('catalogue').replaceChildren(...visible.map(card));
    $('status').textContent = visible.length ? `${visible.length} of ${entries.length} monsters` : 'No monsters match. Try another search or filter.';
  }
  function init(data) {
    SiluxCombat.validate(data);
    const next = Object.entries(data.enemies).map(([id, enemy]) => ({id, enemy, encounters: data.battles.filter(b => b.enemies.includes(id))}));
    // Build before changing the page so a malformed imported entry can be retried.
    next.forEach(card);
    entries = next;
    $('region').replaceChildren(new Option('All regions', ''), ...[...new Set(data.battles.map(b => b.region))].map(id => new Option(regionName(id), id)));
    $('error').hidden = true;
    $('controls').hidden = false;
    render();
  }
  function error(message) {
    $('error-copy').textContent = message;
    $('error').hidden = false;
    $('status').textContent = entries.length ? 'The new catalogue could not be loaded. Previous entries are still shown.' : 'Bestiary unavailable until battles.json is loaded.';
  }
  async function load() {
    try {
      const response = await fetch('battles.json');
      if (!response.ok) throw Error(`Could not load battles.json (${response.status}).`);
      init(await response.json());
    } catch (e) { error(`${e.message} Retry, or select battles.json below if opening the game directly.`); }
  }
  $('search').addEventListener('input', render);
  $('region').addEventListener('change', render);
  $('type').addEventListener('change', render);
  $('retry').addEventListener('click', load);
  $('data-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try { init(JSON.parse(await file.text())); } catch (e) { error(`Invalid catalogue: ${e.message}`); }
    event.target.value = '';
  });
  load();
})();
