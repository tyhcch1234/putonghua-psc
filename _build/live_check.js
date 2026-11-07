const { JSDOM, VirtualConsole } = require('jsdom');
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
JSDOM.fromURL('https://tyhcch1234.github.io/putonghua-psc/', {
  runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.HTMLMediaElement.prototype.play = function () { w.__played = this.src; return Promise.resolve(); };
    w.HTMLMediaElement.prototype.pause = function () {};
    w.HTMLMediaElement.prototype.load = function () {};
  },
}).then(async dom => {
  const w = dom.window;
  await new Promise(r => setTimeout(r, 4000));
  console.log('PSCAudio entries:', w.PSCAudio && w.PSCAudio.count);
  w.location.hash = '#/lesson/3';
  w.dispatchEvent(new w.Event('hashchange'));
  await new Promise(r => setTimeout(r, 300));
  const nodes = [...w.document.querySelectorAll('[data-say]')];
  console.log('lesson/3 words:', nodes.length);
  nodes[0].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  console.log('click:', nodes[0].dataset.say, '→', w.__played);
  const head = await fetch(w.__played);
  console.log('audio fetch:', head.status, head.headers.get('content-type'), (await head.arrayBuffer()).byteLength + 'B');
  const slow = w.document.getElementById('speedBtn');
  console.log('speed btn:', slow.textContent);
  slow.click(); console.log('after toggle:', slow.textContent);
  console.log('errors:', errs.length ? errs : 'none');
  w.close();
});
