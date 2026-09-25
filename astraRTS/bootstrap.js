// Keep the startup script and its modules on the same release in browser caches.
const moduleVersion = new URL(import.meta.url).search;
function disableControls() {
  for (const id of ['redShop', 'blueShop', 'start', 'reset', 'nextBattle']) {
    const control = document.getElementById(id);
    if (control) control.disabled = true;
  }
}
disableControls();
try {
  const response = await fetch('./items.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Equipment request failed: ${response.status}`);
  window.RTS_ITEMS = await response.json();
  await import(`./simulation.js${moduleVersion}`);
  if (document.body.dataset.mode === 'adventure') {
    const battles = await fetch('./battles.json', { cache: 'no-store' });
    if (!battles.ok) throw new Error(`Adventure request failed: ${battles.status}`);
    window.RTS_BATTLES = await battles.json();
    await import(`./adventure.js${moduleVersion}`);
  }
  await import(`./game.js${moduleVersion}`);
} catch (error) {
  disableControls();
  document.getElementById('result').textContent = 'Unable to load the game data. Check items.json and, for adventure mode, battles.json, then reload.';
  console.error(error);
}
