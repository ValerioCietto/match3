(() => {
  'use strict';
  const host = document.querySelector('[data-art-menu]');
  const menuURL = new URL('menu.html', document.currentScript.src);

  function highlight(menu, pageURL) {
    for (const link of menu.querySelectorAll('a[href]')) {
      const target = new URL(link.getAttribute('href'), menuURL);
      link.removeAttribute('aria-current');
      if (target.pathname === pageURL.pathname) link.setAttribute('aria-current', 'page');
    }
  }

  // The menu is also a standalone page and a file:// compatible include.
  if (!host) {
    const menu = document.querySelector('.art-menu');
    if (!menu) return;
    const current = new URL(location.href).searchParams.get('page');
    highlight(menu, new URL(current || location.href, menuURL));
    if (window.parent !== window) {
      for (const link of menu.querySelectorAll('a[href]')) link.target = '_parent';
      const resize = () => window.parent.postMessage({
        type: 'jrpg-art-menu-height',
        height: Math.ceil(menu.getBoundingClientRect().height + 16)
      }, '*');
      new ResizeObserver(resize).observe(menu);
      resize();
    }
    return;
  }

  function embedLocalMenu() {
    const frame = document.createElement('iframe');
    frame.className = 'art-menu-frame';
    frame.title = 'JRPG art: Characters, Enemies and Scenery';
    const source = new URL(menuURL);
    source.searchParams.set('page', location.href);
    window.addEventListener('message', event => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'jrpg-art-menu-height') return;
      const height = event.data.height;
      if (Number.isFinite(height) && height > 0) frame.style.height = `${height}px`;
    });
    frame.src = source.href;
    host.replaceChildren(frame);
  }

  if (location.protocol === 'file:') {
    // Browsers block fetch(file://); an HTML frame retains a single link source.
    embedLocalMenu();
    return;
  }

  async function includeMenu() {
    try {
      const response = await fetch(menuURL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Menu request failed: ${response.status}`);
      const source = new DOMParser().parseFromString(await response.text(), 'text/html');
      const menu = source.querySelector('.art-menu');
      if (!menu) throw new Error('Menu markup is missing');
      highlight(menu, new URL(location.href));
      host.replaceChildren(document.importNode(menu, true));
    } catch {
      // Keep navigation usable if the HTML include cannot be fetched.
      embedLocalMenu();
    }
  }
  includeMenu();
})();
