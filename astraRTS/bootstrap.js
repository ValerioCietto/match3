const controls = ['redShop', 'blueShop', 'start', 'reset', 'nextBattle'].map(id => document.getElementById(id)).filter(Boolean);
controls.forEach(control => control.disabled = true);
try {
  const response = await fetch('./items.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Equipment request failed: ${response.status}`);
  window.RTS_ITEMS = await response.json();
  await import('./simulation.js');
  if (document.body.dataset.mode === 'adventure') {
    const battles = await fetch('./battles.json', { cache: 'no-store' });
    if (!battles.ok) throw new Error(`Adventure request failed: ${battles.status}`);
    window.RTS_BATTLES = await battles.json();
    await import('./adventure.js');
  }
  await import('./game.js');
} catch (error) {
  controls.forEach(control => control.disabled = true);
  document.getElementById('result').textContent = 'Unable to load the game data. Check items.json and, for adventure mode, battles.json, then reload.';
  console.error(error);
}
