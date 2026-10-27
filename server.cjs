const browserSync = require('browser-sync').create('match3');

browserSync.init({
  server: {
    baseDir: __dirname,
    routes: { '/match3': __dirname },
  },
  startPath: '/match3/',
  cwd: __dirname,
  files: ['**/*.{html,css,js,mjs,json,svg,png,jpg,jpeg,gif,webp,ico,wasm}'],
  watchOptions: { ignored: ['**/node_modules/**', '**/.git/**'] },
  watchEvents: ['add', 'change', 'unlink'],
  listen: '127.0.0.1',
  port: Number(process.env.PORT || 3000),
  open: false,
  online: false,
  ui: false,
  notify: false,
  ghostMode: false,
});
