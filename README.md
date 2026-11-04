Varie prove di demo fatte con vibe coding.
Quiz, mini giochi, test di animazioni, e altre cose varie.
https://valeriocietto.github.io/match3/

## Showcase catalog

Edit `showcase-projects.js` to change project titles, links, or numeric `weight`
values. Higher weights appear first. Missing or invalid weights count as `0`;
equal weights keep their order in the file. All projects initially have weight `0`.
Set `"category": "quiz"` to place a project in the Quizzes section. Other projects
appear in Games showcase. Weight ordering applies within each section.

For multiple versions, use one project entry with a `versions` array of
`{ "label": "v2", "href": "folder/game_v2.html" }` objects. Each version appears
as a link inside the same card. Keep the project's `href` as its default URL;
that URL also determines the presentation image folder. The project's `weight`
controls the whole card's position.

Add an optional `presentation-image.png` beside a project's HTML file (or inside
its folder for directory links). Projects sharing a folder share that image;
root-level HTML projects use the root image. External projects look for the image
at their own URL. Missing images show a colored initials placeholder instead.

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
