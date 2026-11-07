/* Smoke test: load the site in jsdom, render every route, verify
 * 1) no runtime errors, 2) every [data-say] text has a bundled mp3,
 * 3) clicking a word asks the player for the right file. */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
  url: 'https://example.test/',
  runScripts: 'dangerously',
  resources: undefined,
  virtualConsole: vc,
  beforeParse(win) {
    // jsdom has no media stack: record play() calls instead
    win.HTMLMediaElement.prototype.play = function () {
      win.__played = (win.__played || []).concat(this.src);
      return Promise.resolve();
    };
    win.HTMLMediaElement.prototype.pause = function () {};
    win.HTMLMediaElement.prototype.load = function () {};
    win.scrollTo = () => {};
    win.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  },
});

// load scripts manually in document order (jsdom does not fetch subresources here)
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
for (const s of srcs) {
  const code = fs.readFileSync(path.join(root, s), 'utf8');
  dom.window.eval(code);
}

const win = dom.window;
console.log('audio entries:', win.PSCAudio.count);
if (!win.PSCAudio.count) errors.push('audio pack empty');

const routes = ['/', '/exam', '/plan', '/mock', '/lesson/0', '/lesson/1', '/lesson/2', '/lesson/3',
  '/lesson/4', '/lesson/5', '/lesson/6', '/lesson/7', '/lesson/8'];

const missing = new Map();
for (const r of routes) {
  win.location.hash = '#' + r;
  win.dispatchEvent(new win.Event('hashchange'));
  const nodes = [...win.document.querySelectorAll('[data-say]')];
  for (const n of nodes) {
    const t = n.dataset.say.replace(/\s+/g, ' ').trim();
    if (!win.PSCAudio.has(t)) {
      if (!missing.has(t)) missing.set(t, r);
    }
  }
  console.log(`${r.padEnd(12)} data-say=${nodes.length}`);
}

// click behaviour on lesson 1
win.location.hash = '#/lesson/1';
win.dispatchEvent(new win.Event('hashchange'));
const first = win.document.querySelector('[data-say]');
const sayText = first.dataset.say.trim();
first.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
const played = win.__played || [];
const map = win.PSC_AUDIO.map;
const want = new win.URL('assets/audio/' + map[sayText] + '.mp3', 'https://example.test/').href;
console.log('clicked:', sayText, '→', played[played.length - 1]);
if (played[played.length - 1] !== want) errors.push(`play src mismatch: ${played[played.length - 1]} != ${want}`);
if (!first.classList.contains('saying')) errors.push('clicked node not highlighted');

// every manifest file exists
let missingFiles = 0;
for (const [t, h] of Object.entries(map)) {
  if (!fs.existsSync(path.join(root, 'assets/audio', h + '.mp3'))) { missingFiles++; console.log('missing file for', t); }
}
if (missingFiles) errors.push(missingFiles + ' audio files missing');

if (missing.size) {
  console.log('\nspoken texts without bundled audio:');
  for (const [t, r] of missing) console.log('  ', JSON.stringify(t), 'on', r);
}

console.log('\nERRORS:', errors.length ? errors : 'none');
process.exit(errors.length ? 1 : 0);
