Varie prove di demo fatte con vibe coding.
Quiz, mini giochi, test di animazioni, e altre cose varie.
https://valeriocietto.github.io/match3/

## Local development

Requires Node.js 22 or newer. From this directory:

```sh
npm install
npm run dev
```cd 

Open http://localhost:3000/match3/. The `/match3/` prefix matches GitHub Pages;
the shooter shop is at http://localhost:3000/match3/shooter/upgrades.html.
The server also supports URLs without the prefix.
BrowserSync reloads the page when HTML, JavaScript, or assets change, and
injects CSS changes without a full reload. Reloading a page resets game state.
Changes to `server.cjs` automatically restart the development server.

On Windows, use `npm.cmd install` and `npm.cmd run dev` if PowerShell blocks
`npm.ps1`. Stop the server with Ctrl+C. Set the `PORT` environment variable
to use a different port (for example, `$env:PORT = '3005'` in PowerShell).

`npm start` runs the same local server without watching the server script.
This server is intended for local development.
