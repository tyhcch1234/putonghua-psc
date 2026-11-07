/* Collect every text the site actually speaks (data-say sources). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const files = ['pinyin', 'paper1', 'paper2', 'paper3', 'paper4', 'paper5', 'lessons', 'quizzes'];
const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of files) {
  const src = fs.readFileSync(path.join(root, 'assets/js/data', f + '.js'), 'utf8');
  vm.runInContext(src, ctx, { filename: f + '.js' });
}
const W = ctx.window;
const out = new Set();
const add = (v) => {
  if (typeof v !== 'string') return;
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t) return;
  if (!/[\u3400-\u9FFF]/.test(t)) return; // require CJK
  out.add(t);
};

const PY = W.PY || {};
(PY.initials || []).forEach((x) => add(x.ex));
Object.keys(PY.finals || {}).forEach((g) => (PY.finals[g] || []).forEach((x) => add(x.ex)));
(PY.tones || []).forEach((t) => add(String(t.ex).split(' ')[0]));

// 聲調練習（app.js 內建）
['媽', '麻', '馬', '罵', '八', '拔', '把', '爸', '貓', '毛', '卯', '帽'].forEach(add);

// lessons.js 內嵌 HTML 的 data-say
const lessonsSrc = fs.readFileSync(path.join(root, 'assets/js/data/lessons.js'), 'utf8');
for (const m of lessonsSrc.matchAll(/data-say="([^"]+)"/g)) add(m[1]);

const P1 = W.P1 || {};
(P1.wordList || []).forEach((x) => add(x.w));

const P2 = W.P2 || {};
['biandiao', 'qingsheng', 'erhua', 'words'].forEach((k) => (P2[k] || []).forEach((x) => add(x.w)));

const P4 = W.P4 || {};
(P4.samples || []).forEach((s) => add(s.txt));

const list = Array.from(out).sort();
fs.writeFileSync(path.join(__dirname, 'texts.json'), JSON.stringify(list, null, 1), 'utf8');
console.log('unique spoken texts:', list.length);
console.log('longest:', Math.max(...list.map((t) => t.length)));
list.filter((t) => t.length > 12).slice(0, 5).forEach((t) => console.log('  ', t.slice(0, 60)));
