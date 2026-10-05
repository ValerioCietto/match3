'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', 'art');
const html = fs.readFileSync(path.join(root, 'menu.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'menu.js'), 'utf8');
const sections = [...html.matchAll(/<nav aria-label="([^"]+)">([\s\S]*?)<\/nav>/g)];
const hrefs = text => [...text.matchAll(/href="([^"]+\.html)"/g)].map(m => m[1]);

test('menu categorizes every art page once and all pages use the include', () => {
  assert.deepEqual(sections.map(m => m[1]), ['Characters', 'Enemies', 'Scenery']);
  for (const enemy of ['bat.html', 'rat.html', 'lich.html', 'Scorpion-bear.html']) {
    assert(hrefs(sections[1][2]).includes(enemy), 'Enemy category: ' + enemy);
  }
  const pages = fs.readdirSync(root).filter(n => n.endsWith('.html') && n !== 'menu.html');
  assert.deepEqual(hrefs(html).sort(), pages.sort());
  for (const file of pages) {
    const page = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal((page.match(/data-art-menu/g) || []).length, 1, file);
    assert(page.includes('src="menu.js" defer'), file);
    assert(page.includes('href="menu.css"'), file);
    assert(page.includes('href="menu.html"'), 'No-JS fallback: ' + file);
    assert(!/<nav\b/.test(page), 'Duplicated menu: ' + file);
  }
});

function setup({ protocol = 'https:', failure = false, standalone = false } = {}) {
  const base = protocol === 'file:' ? 'file:///C:/art/' : 'https://example.test/jrpg/art/';
  const url = new URL(standalone ? 'menu.html?page=bat.html%3Fview%3D1%23detail' : 'bat.html?view=1#detail', base);
  const links = hrefs(html).map(href => ({
    attrs: { href }, getAttribute(k) { return this.attrs[k]; },
    setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }
  }));
  const menu = { querySelectorAll: () => links, getBoundingClientRect: () => ({ height: 174 }) };
  const host = { replaceChildren(child) { this.child = child; } };
  const listeners = {}, messages = [], frames = [];
  let fetches = 0, observer;
  const parent = { postMessage(data) { messages.push(data); } };
  const window = { parent, addEventListener(type, fn) { listeners[type] = fn; } };
  const document = {
    currentScript: { src: new URL('menu.js', base).href },
    querySelector: sel => sel === '[data-art-menu]' ? standalone ? null : host : menu,
    createElement(tag) { assert.equal(tag, 'iframe'); const frame = { style: {}, contentWindow: {} }; frames.push(frame); return frame; },
    importNode: node => node
  };
  vm.runInNewContext(script, {
    document, window, location: url, URL,
    fetch: async () => { fetches++; return { ok: !failure, status: failure ? 404 : 200, text: async () => html }; },
    DOMParser: class { parseFromString() { return { querySelector: () => menu }; } },
    ResizeObserver: class { constructor(fn) { observer = fn; } observe(node) { assert.equal(node, menu); } }
  });
  return { host, menu, links, frames, listeners, messages, resize: () => observer(), fetches: () => fetches };
}

test('HTTP include highlights the current page despite query and hash', async () => {
  const result = setup();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.host.child, result.menu);
  assert.deepEqual(result.links.filter(l => l.attrs['aria-current']).map(l => l.attrs.href), ['bat.html']);
  assert.equal(result.fetches(), 1);
});

test('direct-file include uses one HTML frame, resizes and ignores unrelated messages', () => {
  const result = setup({ protocol: 'file:' }), frame = result.frames[0];
  assert.equal(result.fetches(), 0);
  assert.equal(result.host.child, frame);
  assert.equal(new URL(frame.src).pathname, '/C:/art/menu.html');
  const data = { type: 'jrpg-art-menu-height', height: 240 };
  result.listeners.message({ source: {}, data });
  assert.equal(frame.style.height, undefined);
  result.listeners.message({ source: frame.contentWindow, data });
  assert.equal(frame.style.height, '240px');
  result.listeners.message({ source: frame.contentWindow, data: { ...data, height: -10 } });
  assert.equal(frame.style.height, '240px');
});

test('failed HTTP include retains navigation through the same menu HTML', async () => {
  const result = setup({ failure: true });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.host.child, result.frames[0]);
  assert.equal(new URL(result.frames[0].src).pathname, '/jrpg/art/menu.html');
});

test('embedded menu highlights parent page and links navigate the parent', () => {
  const result = setup({ standalone: true });
  assert(result.links.every(l => l.target === '_parent'));
  assert.deepEqual(result.links.filter(l => l.attrs['aria-current']).map(l => l.attrs.href), ['bat.html']);
  assert.equal(result.messages[0].height, 190);
  result.resize();
  assert.equal(result.messages.length, 2);
});
