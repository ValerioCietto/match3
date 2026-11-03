# Upgrade RTS — Axe Valley

Open `index.html` directly in a modern browser, or run `npm start` from the parent folder and visit `http://localhost:3000/upgradeRTS/`.

Move with WASD, arrow keys, or the touch/mouse joystick. Stand within a station ring to automatically gather or process materials. The sidebar shows the full axe recipe. Each axe sells for 20 gold. Workers and the player share an unlimited inventory.

Gold pads beside stations hire workers: axeman 50, miller 100, miner 50, smelter 100, smith 125, crafter 150, merchant 150. Standing on a pad contributes exactly 1 gold per 0.1 seconds; leaving or running out of gold pauses payment without losing contributions. Once hired, the pad buys repeatable 30% base-speed increases. Workers operate their station automatically when ingredients are available.

Sell 8, 16, and 25 axes to complete the three workshops. Walk to the expedition flag after meeting a target. Gold and inventory carry over; each new workshop has its own crew and upgrades. After the final level you can keep playing. Progress is held for the current browser session only. Pause with the button or Escape; switching away pauses automatically.

Run simulation checks with `node --test upgradeRTS/engine.test.cjs` from the parent folder.
