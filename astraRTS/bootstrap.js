const controls = ['redShop', 'blueShop', 'start', 'reset'].map(id => document.getElementById(id));
controls.forEach(control => control.disabled = true);
try {
  const response = await fetch('./items.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Equipment request failed: ${response.status}`);
  window.RTS_ITEMS = await response.json();
  await import('./simulation.js');
  await import('./game.js');
} catch (error) {
  controls.forEach(control => control.disabled = true);
  document.getElementById('result').textContent = 'Unable to load the game equipment. Check items.json and reload.';
  console.error(error);
}
