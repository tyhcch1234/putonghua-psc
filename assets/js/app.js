/* ==========================================================
   普通話水平測試 · 由零開始
   app.js — 路由、進度、測驗、語音、模擬考試
   ========================================================== */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var drawer = document.getElementById('drawer');
  var mask = document.getElementById('mask');
  var menuBtn = document.getElementById('menuBtn');
  var STORE_KEY = 'psc-progress-v1';

  /* ---------------- state ---------------- */
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        return { done: o.done || {}, quiz: o.quiz || {}, mock: o.mock || null };
      }
    } catch (e) { /* ignore */ }
    return { done: {}, quiz: {}, mock: null };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------------- utils ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }
  function pick(a, n) { return shuffle(a).slice(0, n); }

  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1c1917;color:#fff;' +
        'padding:10px 18px;border-radius:10px;font-size:14px;z-index:200;opacity:0;transition:opacity .25s;max-width:86vw;text-align:center';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.style.opacity = '0'; }, 2200);
  }

  /* ---------------- speech ---------------- */
  /* 發音交由 assets/js/audio.js 的發音元件處理：
     先播站內音檔，缺檔才退回瀏覽器語音。 */
  function speak(text, node) {
    if (window.PSCAudio) { window.PSCAudio.speak(text, node); return; }
    toast('發音元件未載入，請重新整理頁面');
  }

  /* ---------------- navigation ---------------- */
  var NAV = [
    { href: '#/', label: '首頁', n: '◆' },
    { href: '#/exam', label: '考試全貌', n: '?' }
  ];

  function buildDrawer(route) {
    var html = '<h4>開始</h4>';
    html += '<a href="#/" class="' + (route === '/' ? 'active' : '') + '"><span class="n">◆</span>首頁與進度</a>';
    html += '<a href="#/exam" class="' + (route === '/exam' ? 'active' : '') + '"><span class="n">?</span>考試全貌</a>';
    html += '<h4>課程模組</h4>';
    LESSONS.modules.forEach(function (m) {
      var done = state.done[m.id] ? ' done' : '';
      var active = route === '/lesson/' + m.id ? ' active' : '';
      html += '<a href="#/lesson/' + m.id + '" class="' + (active + done).trim() + '">' +
        '<span class="n">' + (state.done[m.id] ? '✓' : m.id) + '</span>' + esc(m.title) + '</a>';
    });
    html += '<h4>工具</h4>';
    html += '<a href="#/plan" class="' + (route === '/plan' ? 'active' : '') + '"><span class="n">8</span>60 天學習計劃</a>';
    html += '<a href="#/mock" class="' + (route === '/mock' ? 'active' : '') + '"><span class="n">⏱</span>模擬考試</a>';
    drawer.innerHTML = html;
  }

  function openDrawer() {
    drawer.classList.add('on'); mask.classList.add('on');
    menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    drawer.classList.remove('on'); mask.classList.remove('on');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', function () {
    drawer.classList.contains('on') ? closeDrawer() : openDrawer();
  });
  mask.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeDrawer();
  });

  /* ---------------- progress ---------------- */
  function progressPct() {
    var total = LESSONS.modules.length;
    var n = Object.keys(state.done).filter(function (k) { return state.done[k]; }).length;
    return { n: n, total: total, pct: Math.round(n / total * 100) };
  }

  function ringHTML() {
    var p = progressPct();
    var r = 32, c = 2 * Math.PI * r;
    var off = c * (1 - p.pct / 100);
    return '<div class="ring"><svg width="78" height="78" viewBox="0 0 78 78">' +
      '<circle cx="39" cy="39" r="' + r + '" fill="none" stroke="#efe8dc" stroke-width="7"/>' +
      '<circle cx="39" cy="39" r="' + r + '" fill="none" stroke="#b23a2f" stroke-width="7" stroke-linecap="round" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<div class="pct">' + p.pct + '%</div></div>';
  }

  /* ---------------- views ---------------- */
  function viewHome() {
    var p = progressPct();
    var cards = LESSONS.modules.map(function (m) {
      return '<a class="card" href="#/lesson/' + m.id + '">' +
        '<div class="num">' + esc(m.kicker) + (state.done[m.id] ? ' · 已完成' : '') + '</div>' +
        '<h3>' + esc(m.title) + '</h3><p>' + esc(m.lead) + '</p>' +
        '<div style="margin-top:10px">' + (m.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '</a>';
    }).join('');

    return '' +
      '<section class="hero">' +
      '<span class="kicker">PSC · 2024 新綱</span>' +
      '<h1>由零開始，考到<span>普通話基準</span></h1>' +
      '<p class="lead" style="max-width:34em">五個考試部分，逐部分由發音教起：聲韻調 → 單音節 → 多音節 → 詞彙語序 → 朗讀 → 說話。每一部分都有教學、練習與測驗。</p>' +
      '<div class="hero-actions"><a class="btn" href="#/lesson/0">由第一課開始</a><a class="btn ghost" href="#/exam">先看考試內容</a></div>' +
      '</section>' +
      '<section class="card progress-card" style="margin-top:26px">' + ringHTML() +
      '<div style="flex:1;min-width:200px">' +
      '<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><b>學習進度</b><span class="small">' + p.n + ' / ' + p.total + ' 個模組</span></div>' +
      '<div class="bar"><i style="width:' + p.pct + '%"></i></div>' +
      '<p class="small" style="margin:10px 0 0">進度只存在這部裝置的瀏覽器，不會上傳。</p>' +
      '</div></section>' +
      '<h2>課程模組</h2><div class="grid two">' + cards + '</div>' +
      '<h2>三個數字，決定你的策略</h2>' +
      '<div class="grid three">' +
      '<div class="card"><div class="num">60 / 100</div><h3>朗讀＋說話</h3><p>兩部分合共 60 分，是最需要時間、也最能拉開等級的部分。</p></div>' +
      '<div class="card"><div class="num">30 / 100</div><h3>卷一＋卷二</h3><p>字詞 30 分，可靠背誦與錄音回聽穩定拿分。</p></div>' +
      '<div class="card"><div class="num">10 / 100</div><h3>卷三</h3><p>詞彙語序 10 分，題型固定，是最容易一分不丟的部分。</p></div>' +
      '</div>';
  }

  function viewExam() {
    var e = LESSONS.exam;
    var facts = e.facts.map(function (f) {
      return '<tr><th style="width:90px">' + esc(f.k) + '</th><td>' + esc(f.v) + '</td></tr>';
    }).join('');
    var parts = e.parts.map(function (p) {
      return '<tr><td>' + p.n + '</td><td><b>' + esc(p.t) + '</b></td><td>' + esc(p.q) + '</td>' +
        '<td class="num">' + esc(p.m) + '</td><td>' + esc(p.time) + '</td><td>' + esc(p.focus) + '</td></tr>';
    }).join('');
    var grades = e.grades.map(function (g) {
      return '<tr><td><b>' + esc(g.g) + '</b></td><td class="num">' + esc(g.s) + '</td><td>' + esc(g.d) + '</td></tr>';
    }).join('');

    return '<section class="mod-head"><div class="crumb"><a href="#/">首頁</a> / 考試全貌</div>' +
      '<h1>這場考試，考五個部分</h1>' +
      '<p class="lead">總分 100 分，全程口試錄音。朗讀與說話佔 60 分，其餘 40 分是可以用準備拿穩的。</p>' +
      '<div class="meta"><span class="tag red">2021 綱要</span><span class="tag">2024 年 1 月實施</span><span class="tag teal">三級六等</span></div>' +
      '</section>' +
      '<h2>基本資料</h2><div class="tbl-wrap"><table>' + facts + '</table></div>' +
      '<h2>五個部分</h2><div class="tbl-wrap"><table><thead><tr><th>#</th><th>題型</th><th>題量</th><th class="num">分值</th><th>限時</th><th>考什麼</th></tr></thead><tbody>' + parts + '</tbody></table></div>' +
      '<div class="note tip"><b>先守 40 分，再攻 60 分</b><p>卷三 10 分＋卷一 10 分＋卷二 20 分，全部有明確範圍，是可以練到接近滿分的。朗讀 30 分與說話 30 分需要長期輸入，但 50 篇、50 題都是公開的，同樣可以準備。</p></div>' +
      '<h2>等級與分數</h2><div class="tbl-wrap"><table><thead><tr><th>等級</th><th class="num">分數</th><th>官方描述</th></tr></thead><tbody>' + grades + '</tbody></table></div>' +
      '<h2>下一步</h2>' +
      '<div class="grid two"><a class="card" href="#/lesson/0"><div class="num">模組 0</div><h3>先看懂這場考試</h3><p>考試邏輯、評分方式、你的起點。</p></a>' +
      '<a class="card" href="#/lesson/1"><div class="num">模組 1</div><h3>語音基礎</h3><p>21 聲母、39 韻母、四聲與變調。</p></a></div>';
  }

  function lessonByRoute(id) {
    for (var i = 0; i < LESSONS.modules.length; i++) if (LESSONS.modules[i].id === id) return LESSONS.modules[i];
    return null;
  }

  function viewLesson(id) {
    var m = lessonByRoute(id);
    if (!m) return '<p>找不到這一課。</p>';
    var idx = LESSONS.modules.indexOf(m);
    var prev = LESSONS.modules[idx - 1], next = LESSONS.modules[idx + 1];

    var nav = '<div class="grid two no-print" style="margin:36px 0 10px">' +
      (prev ? '<a class="card" href="#/lesson/' + prev.id + '"><div class="num">上一課</div><h3>' + esc(prev.title) + '</h3></a>' : '<span></span>') +
      (next ? '<a class="card" href="#/lesson/' + next.id + '"><div class="num">下一課</div><h3>' + esc(next.title) + '</h3></a>' : '<a class="card" href="#/mock"><div class="num">下一步</div><h3>做一次模擬考試</h3></a>') +
      '</div>';

    var quiz = '';
    var qs = (window.QUIZ_BANK && QUIZ_BANK[id]) ? QUIZ_BANK[id] : null;
    if (qs) quiz = '<h2>測驗</h2><p class="small">選出答案後按「核對答案」。分數會記錄在進度裏。</p><div id="quizHost"></div>';

    return '<section class="mod-head"><div class="crumb"><a href="#/">首頁</a> / ' + esc(m.kicker) + '</div>' +
      '<div class="meta">' + (m.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<h1>' + esc(m.title) + '</h1><p class="lead">' + esc(m.lead) + '</p></section>' +
      '<article class="lesson">' + m.body + '</article>' +
      quiz +
      '<div id="doneHost"></div>' + nav;
  }

  function viewPlan() {
    var rows = LESSONS.plan.map(function (p) {
      return '<tr><td><b>' + esc(p.w) + '</b><br><span class="small">' + esc(p.t) + '</span></td><td>' + esc(p.d) + '</td><td class="small">' + esc(p.goal) + '</td></tr>';
    }).join('');
    var daily = LESSONS.daily.map(function (d) {
      return '<tr><td class="num" style="white-space:nowrap">' + esc(d.t) + '</td><td>' + esc(d.d) + '</td></tr>';
    }).join('');
    return '<section class="mod-head"><div class="crumb"><a href="#/">首頁</a> / 學習計劃</div>' +
      '<h1>60 天，由零到應考</h1><p class="lead">每天約 60 分鐘。順序是：基礎 → 拿穩的分 → 朗讀 → 說話 → 整合。</p></section>' +
      '<div class="tbl-wrap"><table><thead><tr><th>週次</th><th>做甚麼</th><th>完成指標</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<h2>每天 65 分鐘的分配</h2><div class="tbl-wrap"><table><tbody>' + daily + '</tbody></table></div>' +
      '<div class="note tip"><b>如果時間不夠</b><p>保底方案（每天 25 分鐘）：10 分鐘字詞 + 10 分鐘朗讀一篇 + 5 分鐘說話一題。卷三用零碎時間看對照表即可。</p></div>';
  }

  /* ---------------- quiz engine ---------------- */
  function quizInstance(host, key, qs) {
    var sel = {};
    var submitted = false;

    function paint() {
      var html = '<div class="quiz"><div class="quiz-head"><b>' + esc(key.title || '測驗') + '</b><span class="score">共 ' + qs.length + ' 題</span></div>';
      qs.forEach(function (q, i) {
        html += '<div class="q" data-i="' + i + '"><div class="stem"><span class="idx">' + (i + 1) + '</span>' + q.q + '</div><div class="opts">';
        q.o.forEach(function (o, j) {
          var cls = 'opt';
          if (submitted) {
            if (j === q.a) cls += ' correct';
            else if (sel[i] === j) cls += ' wrong';
          } else if (sel[i] === j) cls += ' sel';
          html += '<div class="' + cls + '" data-i="' + i + '" data-j="' + j + '"><span class="k">' + 'ABCD'[j] + '</span><span>' + o + '</span></div>';
        });
        html += '</div>';
        html += '<div class="exp' + (submitted ? ' on' : '') + '">' + (submitted ? '正確答案：' + 'ABCD'[q.a] + '。' + q.e : '') + '</div>';
        html += '</div>';
      });
      html += '<div class="quiz-foot">';
      if (!submitted) {
        html += '<button class="btn sm" id="qSubmit">核對答案</button><span class="small" id="qCount"></span>';
      } else {
        var correct = qs.reduce(function (n, q, i) { return n + (sel[i] === q.a ? 1 : 0); }, 0);
        var pct = Math.round(correct / qs.length * 100);
        var cls = pct >= 85 ? 'ok' : pct >= 60 ? 'mid' : 'bad';
        html += '<span class="verdict ' + cls + '">' + correct + ' / ' + qs.length + '　' + pct + '%</span>';
        html += '<button class="btn sm ghost" id="qRetry">再做一次</button>';
      }
      html += '</div></div>';
      host.innerHTML = html;

      host.querySelectorAll('.opt').forEach(function (el) {
        el.onclick = function () {
          if (submitted) return;
          var i = +el.dataset.i, j = +el.dataset.j;
          sel[i] = j;
          paint();
        };
      });
      var c = host.querySelector('#qCount');
      if (c) c.textContent = '已選 ' + Object.keys(sel).length + ' / ' + qs.length;
      var sb = host.querySelector('#qSubmit');
      if (sb) sb.onclick = function () {
        if (Object.keys(sel).length < qs.length) { toast('還有 ' + (qs.length - Object.keys(sel).length) + ' 題未選'); return; }
        submitted = true;
        var correct = qs.reduce(function (n, q, i) { return n + (sel[i] === q.a ? 1 : 0); }, 0);
        state.quiz[key.id] = { score: correct, total: qs.length };
        save();
        paint();
        window.scrollTo({ top: host.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      };
      var rb = host.querySelector('#qRetry');
      if (rb) rb.onclick = function () { sel = {}; submitted = false; paint(); };
    }
    paint();
  }

  /* ---------------- data-driven blocks ---------------- */
  function mount(selector, html) {
    var el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function mountPinyin() {
    mount('#pinyinInitials', '<div class="grid three">' + PY.initials.map(function (x) {
      return '<div class="card" data-say="' + x.ex + '" style="cursor:pointer;padding:14px">' +
        '<div style="display:flex;align-items:baseline;gap:8px"><span class="py" style="font-size:20px">' + x.p + '</span>' +
        '<span class="han">' + x.ex + '</span><span class="small">' + x.py + '</span></div>' +
        '<p style="margin:6px 0 0;font-size:12.5px">' + x.tip + '</p></div>';
    }).join('') + '</div>');

    var f = '';
    Object.keys(PY.finals).forEach(function (g) {
      f += '<h3>' + g + '</h3><div class="words">' + PY.finals[g].map(function (x) {
        return '<div class="word" data-say="' + x.ex + '"><span class="w">' + x.ex + '</span><span class="p">' + x.p + '</span></div>';
      }).join('') + '</div>';
    });
    f += '<div class="note"><b>還有三個特殊韻母</b><p>' + PY.specialFinals.map(function (x) {
      return '<span class="py">' + x.p + '</span>　' + x.ex + '　<span class="small">' + x.tip + '</span>';
    }).join('<br>') + '</p></div>';
    mount('#pinyinFinals', f);

    mount('#pinyinTones', '<div class="tones">' + PY.tones.map(function (t) {
      return '<button class="tone-chip" data-say="' + t.ex.split(' ')[0] + '">' + t.name + '　' + t.ex + '</button>';
    }).join('') + '</div>' +
      '<div class="tbl-wrap"><table><thead><tr><th>聲調</th><th>符號</th><th>調值</th><th>怎樣讀</th></tr></thead><tbody>' +
      PY.tones.map(function (t) {
        return '<tr><td>' + t.name + '</td><td style="font-size:18px">' + t.mark + '</td><td>' + t.contour + '</td><td>' + t.desc + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    mount('#pinyinSpelling', '<div class="tbl-wrap"><table><thead><tr><th>規則</th><th>例</th><th>說明</th></tr></thead><tbody>' +
      PY.spelling.map(function (s) {
        return '<tr><td>' + s.r + '</td><td class="py">' + s.ex + '</td><td class="small">' + s.note + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    mount('#tonePractice', '<div class="words">' + [
      ['媽', 'mā'], ['麻', 'má'], ['馬', 'mǎ'], ['罵', 'mà'],
      ['八', 'bā'], ['拔', 'bá'], ['把', 'bǎ'], ['爸', 'bà'],
      ['貓', 'māo'], ['毛', 'máo'], ['卯', 'mǎo'], ['帽', 'mào']
    ].map(function (x) {
      return '<div class="word" data-say="' + x[0] + '"><span class="w">' + x[0] + '</span><span class="p">' + x[1] + '</span></div>';
    }).join('') + '</div>');
  }

  function mountTraps() {
    mount('#trapList', PY.traps.map(function (t, i) {
      return '<details class="acc"' + (i < 2 ? ' open' : '') + '><summary>' + t.h + '</summary><div class="body">' +
        '<p><b style="color:#b91c1c">✗</b> ' + t.bad + '　　<b style="color:#15803d">✓</b> ' + t.good + '</p>' +
        '<p class="small">' + t.tip + '</p></div></details>';
    }).join(''));
    mount('#ruleList', PY.rules.map(function (r) {
      return '<details class="acc"><summary>' + r.t + '</summary><div class="body"><p>' + r.b + '</p></div></details>';
    }).join(''));
  }

  function mountP1() {
    mount('#p1Traps', '<div class="tbl-wrap"><table><thead><tr><th>字</th><th>讀音</th><th>辨析</th></tr></thead><tbody>' +
      P1.traps.map(function (t) {
        return '<tr><td class="han" style="font-size:20px">' + t.w + '</td><td class="py">' + t.p + '</td><td>' + t.note + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    function words(list) {
      mount('#p1Words', '<div class="words">' + list.map(function (x) {
        return '<div class="word" data-say="' + x.w + '"><span class="w">' + x.w + '</span><span class="p">' + x.p + '</span></div>';
      }).join('') + '</div>');
    }
    words(P1.wordList);
    var btn = document.getElementById('shuffleP1');
    if (btn) btn.onclick = function () { words(shuffle(P1.wordList)); toast('已重新排列'); };
  }

  function mountP2() {
    function block(sel, list, cls) {
      mount(sel, '<div class="words">' + list.map(function (x) {
        return '<div class="word" data-say="' + x.w + '"><span class="w">' + x.w + '</span><span class="p">' + x.p + '</span>' +
          (cls && x.n ? '<span class="p" style="color:#b45309">' + x.n + '</span>' : '') + '</div>';
      }).join('') + '</div>');
    }
    block('#p2Biandiao', P2.biandiao, true);
    block('#p2Qingsheng', P2.qingsheng, false);
    block('#p2Erhua', P2.erhua, false);
    block('#p2Words', P2.words, true);
  }

  function mountP3() {
    mount('#p3Vocab', '<div class="tbl-wrap"><table><thead><tr><th>粵語</th><th>普通話</th></tr></thead><tbody>' +
      P3.vocab.map(function (x) {
        return '<tr><td>' + x.y + '</td><td><b>' + x.p + '</b></td></tr>';
      }).join('') + '</tbody></table></div>');

    mount('#p3Liangci', '<div class="tbl-wrap"><table><thead><tr><th>量詞</th><th>搭配名詞</th><th>例</th></tr></thead><tbody>' +
      P3.liangci.map(function (x) {
        return '<tr><td class="han" style="font-size:18px">' + x.lc + '</td><td>' + x.n + '</td><td class="small">' + x.ex + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    mount('#p3Yuxu', '<div class="tbl-wrap"><table><thead><tr><th style="color:#b91c1c">✗ 粵語式</th><th style="color:#15803d">✓ 普通話</th><th>說明</th></tr></thead><tbody>' +
      P3.yuxu.map(function (x) {
        return '<tr><td>' + x.bad + '</td><td><b>' + x.good + '</b></td><td class="small">' + x.note + '</td></tr>';
      }).join('') + '</tbody></table></div>');
  }

  function mountP4() {
    mount('#p4Dims', '<div class="tbl-wrap"><table><thead><tr><th>維度</th><th>要求</th></tr></thead><tbody>' +
      P4.dims.map(function (d) { return '<tr><td><b>' + d.t + '</b></td><td>' + d.d + '</td></tr>'; }).join('') +
      '</tbody></table></div>');

    mount('#p4Works', '<div class="tbl-wrap"><table><thead><tr><th class="num">#</th><th>作品</th><th>作者</th><th>難點提示</th></tr></thead><tbody>' +
      P4.works.map(function (w) {
        return '<tr><td class="num">' + w.n + '</td><td>' + w.t + '</td><td class="small">' + (w.a || '—') + '</td>' +
          '<td class="small" style="color:#0f766e">' + (w.k || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    mount('#p4Method', '<ol>' + P4.method.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>');

    mount('#p4Samples', P4.samples.map(function (s) {
      return '<div class="card" style="margin:14px 0"><h3 style="margin-top:0">' + s.t + '</h3>' +
        '<p class="zh" style="font-size:17px;line-height:2">' + s.txt + '</p>' +
        '<p class="small"><b>難點：</b>' + s.keys + '</p>' +
        '<p class="small"><b>處理：</b>' + s.tip + '</p>' +
        '<button class="btn sm ghost" data-say="' + s.txt.replace(/"/g, '') + '">聽示範</button></div>';
    }).join(''));
  }

  function mountP5() {
    mount('#p5Dims', '<div class="tbl-wrap"><table><thead><tr><th>維度</th><th>要求</th></tr></thead><tbody>' +
      P5.dims.map(function (d) { return '<tr><td><b>' + d.t + '</b></td><td>' + d.d + '</td></tr>'; }).join('') + '</tbody></table></div>');

    mount('#p5Structure', P5.structure.map(function (s) {
      return '<div class="card" style="margin:12px 0"><h3 style="margin-top:0;font-size:16px">' + s.t + '</h3>' +
        '<p style="margin-bottom:8px">' + s.d + '</p><p class="small" style="margin:0"><b>例：</b>' + s.ex + '</p></div>';
    }).join(''));

    mount('#p5Pitfalls', '<ul>' + P5.pitfalls.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>');

    mount('#p5Universal', '<div class="grid two">' + P5.universal.map(function (u) {
      return '<div class="card"><h3 style="margin-top:0;font-size:16px">' + u.t + '</h3><p style="margin:0">' + u.d + '</p></div>';
    }).join('') + '</div>');

    mount('#p5Topics', '<div class="tbl-wrap"><table><thead><tr><th class="num">#</th><th>話題</th><th>三個支點</th></tr></thead><tbody>' +
      P5.topics.map(function (t) {
        return '<tr><td class="num">' + t.n + '</td><td><b>' + t.t + '</b></td><td class="small">' + t.h + '</td></tr>';
      }).join('') + '</tbody></table></div>');
  }

  /* ---------------- done button ---------------- */
  function bindDone(m) {
    var host = document.getElementById('doneHost');
    if (!host) return;
    var done = !!state.done[m.id];
    host.innerHTML = '<div class="no-print" style="margin:26px 0;padding:16px;border:1px dashed #d9d0c2;border-radius:14px;' +
      'display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between">' +
      '<span class="small">' + (done ? '已標記為完成。可以繼續下一課。' : '讀完這一課，可以標記為完成。') + '</span>' +
      '<button class="btn ' + (done ? 'ghost' : 'teal') + ' sm" id="doneBtn">' + (done ? '取消完成標記' : '標記為完成') + '</button></div>';
    document.getElementById('doneBtn').onclick = function () {
      state.done[m.id] = !state.done[m.id];
      save();
      if (state.done[m.id]) toast('已記錄：模組 ' + m.id + ' 完成');
      render();
    };
  }

  /* ---------------- mock exam ---------------- */
  var mock = null;

  function mockInit() {
    return {
      step: 0,
      p1: { errors: 0 },
      p2: { errors: 0 },
      p3: { sel: {}, done: false, qs: pick(P3.quiz, 10) },
      p4: { voice: 22, flow: 4, tone: 4 },
      p5: { voice: 20, words: 5, flow: 5, topics: pick(P5.topics, 2), chosen: -1 },
      scores: null
    };
  }

  function mockScores() {
    var p1 = Math.max(0, 10 - mock.p1.errors * 0.1);
    var p2 = Math.max(0, 20 - mock.p2.errors * 0.2);
    var p3 = 0;
    mock.p3.qs.forEach(function (q, i) {
      if (mock.p3.sel[i] === q.a) p3 += 1;
    });
    var p4 = mock.p4.voice + mock.p4.flow + mock.p4.tone;
    var p5 = mock.p5.voice + mock.p5.words + mock.p5.flow;
    return { p1: p1, p2: p2, p3: p3, p4: p4, p5: p5, total: p1 + p2 + p3 + p4 + p5 };
  }

  function gradeOf(t) {
    if (t >= 97) return '一級甲等';
    if (t >= 92) return '一級乙等';
    if (t >= 87) return '二級甲等';
    if (t >= 80) return '二級乙等';
    if (t >= 70) return '三級甲等';
    if (t >= 60) return '三級乙等';
    return '不入級';
  }

  function viewMock() {
    if (!mock) mock = mockInit();
    var s = mockScores();
    var stepNames = ['卷一 單音節', '卷二 多音節', '卷三 選擇判斷', '卷四 朗讀', '卷五 說話', '成績'];
    var tabs = '<div class="pill-row no-print">' + stepNames.map(function (n, i) {
      return '<button class="pill' + (mock.step === i ? ' on' : '') + '" data-step="' + i + '">' + n + '</button>';
    }).join('') + '</div>';

    var body = '';
    if (mock.step === 0) {
      var words = pick(P1.wordList, 40);
      body = '<div class="part-card"><h4>卷一 · 讀單音節字詞<span class="marks">40 字練習 · 滿分 10</span></h4>' +
        '<p class="small">出聲讀出下面 40 個字（正式考試 100 個），計時 90 秒。讀完後輸入你認為讀錯的數目。</p>' +
        '<div class="words">' + words.map(function (w) {
          return '<div class="word" data-say="' + w.w + '"><span class="w">' + w.w + '</span><span class="p" style="opacity:.35">' + w.p + '</span></div>';
        }).join('') + '</div>' +
        '<div class="note warn"><b>練習提示</b><p>拼音已調淡，先不看拼音讀。真的不確定才點字聽音。</p></div>' +
        '<div class="slider-row"><label class="small" style="width:90px">讀錯數目</label>' +
        '<input type="range" min="0" max="20" value="' + mock.p1.errors + '" id="p1err"><b id="p1errv">' + mock.p1.errors + '</b></div>' +
        '<p class="small">得分：<b id="p1score">' + s.p1.toFixed(1) + '</b> / 10（每錯一字扣 0.1，按 100 字比例估算）</p>' +
        '<button class="btn sm" data-step="1">下一步</button></div>';
    } else if (mock.step === 1) {
      var words2 = pick(P2.words, 20);
      body = '<div class="part-card"><h4>卷二 · 讀多音節詞語<span class="marks">20 詞練習 · 滿分 20</span></h4>' +
        '<p class="small">讀出下面 20 個詞，注意變調、輕聲、兒化。計時 60 秒。</p>' +
        '<div class="words">' + words2.map(function (w) {
          return '<div class="word" data-say="' + w.w + '"><span class="w">' + w.w + '</span><span class="p" style="opacity:.35">' + w.p + '</span></div>';
        }).join('') + '</div>' +
        '<div class="slider-row"><label class="small" style="width:90px">讀錯音節</label>' +
        '<input type="range" min="0" max="20" value="' + mock.p2.errors + '" id="p2err"><b id="p2errv">' + mock.p2.errors + '</b></div>' +
        '<p class="small">得分：<b id="p2score">' + s.p2.toFixed(1) + '</b> / 20</p>' +
        '<button class="btn sm" data-step="2">下一步</button></div>';
    } else if (mock.step === 2) {
      var qs = mock.p3.qs;
      body = '<div class="part-card"><h4>卷三 · 選擇判斷<span class="marks">10 題 · 滿分 10</span></h4>' +
        '<p class="small">限時 3 分鐘。做完按「交卷」。</p>';
      qs.forEach(function (q, i) {
        body += '<div class="q"><div class="stem"><span class="idx">' + (i + 1) + '</span>' + q.q + '</div><div class="opts">';
        q.o.forEach(function (o, j) {
          var cls = 'opt' + (mock.p3.sel[i] === j ? ' sel' : '');
          body += '<div class="' + cls + '" data-p3="' + i + '" data-j="' + j + '"><span class="k">' + 'ABCD'[j] + '</span><span>' + o + '</span></div>';
        });
        body += '</div></div>';
      });
      body += '<div class="quiz-foot"><button class="btn sm" id="p3submit">交卷</button>' +
        '<span class="small">已答 ' + Object.keys(mock.p3.sel).length + ' / 10</span></div></div>';
    } else if (mock.step === 3) {
      body = '<div class="part-card"><h4>卷四 · 朗讀短文<span class="marks">滿分 30</span></h4>' +
        '<p class="small">從 50 篇中隨機抽一篇（見模組 6 清單），讀 400 個音節，計時 4 分鐘。錄音後回聽，按四個維度自評。</p>' +
        '<div class="note"><b>自評基準</b><p>語音 0–20：每錯一個音節約扣 0.1–0.2；系統性缺陷再扣 1–2。<br>停連 0–4、語調 0–4、流暢 0–2。</p></div>' +
        '<div class="slider-row"><label class="small" style="width:110px">語音 0–20</label><input type="range" min="0" max="20" value="' + mock.p4.voice + '" id="p4a"><b>' + mock.p4.voice + '</b></div>' +
        '<div class="slider-row"><label class="small" style="width:110px">停連 0–4</label><input type="range" min="0" max="4" value="' + mock.p4.flow + '" id="p4b"><b>' + mock.p4.flow + '</b></div>' +
        '<div class="slider-row"><label class="small" style="width:110px">語調 0–4</label><input type="range" min="0" max="4" value="' + mock.p4.tone + '" id="p4c"><b>' + mock.p4.tone + '</b></div>' +
        '<p class="small">合計：<b id="p4sum">' + (mock.p4.voice + mock.p4.flow + mock.p4.tone) + '</b> / 30</p>' +
        '<button class="btn sm" data-step="4">下一步</button></div>';
    } else if (mock.step === 4) {
      body = '<div class="part-card"><h4>卷五 · 命題說話<span class="marks">滿分 30</span></h4>' +
        '<p class="small">抽到以下兩題，選一題，準備 10 秒，說 3 分鐘並錄音。</p>' +
        mock.p5.topics.map(function (t, i) {
          return '<div class="opt" data-topic="' + i + '" style="margin:8px 0' + (mock.p5.chosen === i ? ';border-color:#b23a2f;background:#fbeceb' : '') + '">' +
            '<span class="k">' + (i + 1) + '</span><span><b>' + t.t + '</b><br><span class="small">' + t.h + '</span></span></div>';
        }).join('') +
        '<div style="display:flex;gap:10px;align-items:center;margin:12px 0" class="no-print">' +
        '<button class="btn sm ghost" id="speakTimer">開始 3 分鐘計時</button><span class="timer" id="p5timer">03:00</span></div>' +
        '<div class="slider-row"><label class="small" style="width:120px">語音 0–20</label><input type="range" min="0" max="20" value="' + mock.p5.voice + '" id="p5a"><b>' + mock.p5.voice + '</b></div>' +
        '<div class="slider-row"><label class="small" style="width:120px">詞彙語法 0–5</label><input type="range" min="0" max="5" value="' + mock.p5.words + '" id="p5b"><b>' + mock.p5.words + '</b></div>' +
        '<div class="slider-row"><label class="small" style="width:120px">流暢 0–5</label><input type="range" min="0" max="5" value="' + mock.p5.flow + '" id="p5c"><b>' + mock.p5.flow + '</b></div>' +
        '<p class="small">合計：<b id="p5sum">' + (mock.p5.voice + mock.p5.words + mock.p5.flow) + '</b> / 30</p>' +
        '<button class="btn sm" data-step="5">看成績</button></div>';
    } else {
      var g = gradeOf(s.total);
      var rows = [
        ['卷一 單音節', s.p1, 10], ['卷二 多音節', s.p2, 20], ['卷三 選擇判斷', s.p3, 10],
        ['卷四 朗讀', s.p4, 30], ['卷五 說話', s.p5, 30]
      ];
      body = '<div class="part-card"><h4>成績<span class="marks">' + g + '</span></h4>' +
        '<div style="display:flex;align-items:baseline;gap:12px;margin:8px 0 18px">' +
        '<span style="font-family:var(--serif);font-size:52px;font-weight:700">' + s.total.toFixed(1) + '</span><span class="small">/ 100</span>' +
        '<span class="tag red" style="margin-left:auto;font-size:14px">' + g + '</span></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>部分</th><th class="num">得分</th><th class="num">滿分</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td>' + r[0] + '</td><td class="num">' + r[1].toFixed(1) + '</td><td class="num">' + r[2] + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="small" style="margin-top:14px">這是自評分數，主要用來看各部分的比例是否失衡。若總分低於目標 5 分以上，回到最弱的一項加練。</p>' +
        '<div class="quiz-foot"><button class="btn sm ghost" id="mockAgain">重新開始</button>' +
        '<a class="btn sm" href="#/plan">看學習計劃</a></div></div>';
      state.mock = { at: Date.now(), total: s.total, grade: g, parts: s };
      save();
    }

    return '<section class="mod-head"><div class="crumb"><a href="#/">首頁</a> / 模擬考試</div>' +
      '<h1>模擬考試</h1><p class="lead">按正式流程走一次。每一部分自評後計分，最後給出估算等級。建議每兩週做一次。</p>' +
      '<div class="meta"><span class="tag">約 16 分鐘</span><span class="tag teal">自評</span></div></section>' +
      tabs + body + '<p class="small no-print" style="margin-top:20px">提示：時間到不會自動停止，請自行計時。正式考試由系統錄音，這裏只做流程與自評練習。</p>';
  }

  function bindMock() {
    var host = app;

    host.querySelectorAll('[data-step]').forEach(function (el) {
      el.addEventListener('click', function () {
        mock.step = +el.dataset.step;
        render();
      });
    });

    var p1 = host.querySelector('#p1err');
    if (p1) p1.oninput = function () {
      mock.p1.errors = +p1.value;
      host.querySelector('#p1errv').textContent = p1.value;
      var s = 10 - p1.value * 0.1;
      if (s < 0) s = 0;
      host.querySelector('#p1score').textContent = s.toFixed(1);
    };
    var p2 = host.querySelector('#p2err');
    if (p2) p2.oninput = function () {
      mock.p2.errors = +p2.value;
      host.querySelector('#p2errv').textContent = p2.value;
      var s = 20 - p2.value * 0.2;
      if (s < 0) s = 0;
      host.querySelector('#p2score').textContent = s.toFixed(1);
    };
    host.querySelectorAll('[data-p3]').forEach(function (el) {
      el.onclick = function () {
        var i = +el.dataset.p3, j = +el.dataset.j;
        mock.p3.sel[i] = j;
        el.parentNode.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('sel'); });
        el.classList.add('sel');
        var f = host.querySelector('#p3submit');
        if (f) f.parentNode.querySelector('.small').textContent = '已答 ' + Object.keys(mock.p3.sel).length + ' / 10';
      };
    });
    var p3s = host.querySelector('#p3submit');
    if (p3s) p3s.onclick = function () {
      if (Object.keys(mock.p3.sel).length < 10) { toast('還有題目未答'); return; }
      var correct = 0;
      mock.p3.qs.forEach(function (q, i) { if (mock.p3.sel[i] === q.a) correct++; });
      toast('卷三答對 ' + correct + ' / 10');
      mock.step = 3;
      render();
    };

    ['p4a', 'p4b', 'p4c'].forEach(function (id, k) {
      var el = host.querySelector('#' + id);
      if (!el) return;
      el.oninput = function () {
        var v = +el.value;
        if (k === 0) mock.p4.voice = v;
        if (k === 1) mock.p4.flow = v;
        if (k === 2) mock.p4.tone = v;
        el.nextElementSibling.textContent = v;
        host.querySelector('#p4sum').textContent = mock.p4.voice + mock.p4.flow + mock.p4.tone;
      };
    });

    host.querySelectorAll('[data-topic]').forEach(function (el) {
      el.onclick = function () { mock.p5.chosen = +el.dataset.topic; render(); };
    });
    ['p5a', 'p5b', 'p5c'].forEach(function (id, k) {
      var el = host.querySelector('#' + id);
      if (!el) return;
      el.oninput = function () {
        var v = +el.value;
        if (k === 0) mock.p5.voice = v;
        if (k === 1) mock.p5.words = v;
        if (k === 2) mock.p5.flow = v;
        el.nextElementSibling.textContent = v;
        host.querySelector('#p5sum').textContent = mock.p5.voice + mock.p5.words + mock.p5.flow;
      };
    });

    var timerBtn = host.querySelector('#speakTimer');
    if (timerBtn) timerBtn.onclick = function () {
      if (timerBtn._running) return;
      timerBtn._running = true;
      var left = 180;
      var out = host.querySelector('#p5timer');
      var iv = setInterval(function () {
        left--;
        var m = Math.floor(left / 60), sec = left % 60;
        out.textContent = (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
        if (left <= 30) out.classList.add('warn');
        if (left <= 0) { clearInterval(iv); timerBtn._running = false; out.textContent = '時間到'; }
      }, 1000);
    };

    var again = host.querySelector('#mockAgain');
    if (again) again.onclick = function () { mock = mockInit(); render(); };
  }

  /* ---------------- render ---------------- */
  function render() {
    var hash = location.hash.replace(/^#/, '') || '/';
    document.querySelectorAll('[data-say]').forEach(function () { });
    var html = '';

    if (hash === '/' || hash === '') {
      html = viewHome();
    } else if (hash === '/exam') {
      html = viewExam();
    } else if (hash === '/plan') {
      html = viewPlan();
    } else if (hash === '/mock') {
      html = viewMock();
    } else if (/^\/lesson\/\d+$/.test(hash)) {
      var id = +hash.split('/')[2];
      html = viewLesson(id);
    } else {
      html = '<p>找不到頁面。<a href="#/">回首頁</a></p>';
    }

    app.innerHTML = html;
    buildDrawer(hash);

    /* mount dynamic blocks */
    if (hash === '/lesson/1') { mountPinyin(); }
    if (hash === '/lesson/2') { mountTraps(); }
    if (hash === '/lesson/3') { mountP1(); }
    if (hash === '/lesson/4') { mountP2(); }
    if (hash === '/lesson/5') { mountP3(); }
    if (hash === '/lesson/6') { mountP4(); }
    if (hash === '/lesson/7') { mountP5(); }

    if (/^\/lesson\/\d+$/.test(hash)) {
      var m = lessonByRoute(+hash.split('/')[2]);
      if (m) bindDone(m);
      var qs = window.QUIZ_BANK && QUIZ_BANK[m.id];
      var host = document.getElementById('quizHost');
      if (qs && host) quizInstance(host, { id: 'm' + m.id, title: m.kicker + ' 測驗' }, qs);
    }
    if (hash === '/mock') bindMock();

    /* speech delegation */
    app.querySelectorAll('[data-say]').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        speak(el.dataset.say, el);
      });
    });

    if (window.PSCAudio) window.PSCAudio.prefetch(4);

    window.scrollTo(0, 0);
  }

  /* ---------------- boot ---------------- */
  window.addEventListener('hashchange', function () {
    closeDrawer();
    if (window.PSCAudio) window.PSCAudio.stop();
    render();
  });
  document.getElementById('yr').textContent = new Date().getFullYear();
  var speedBtn = document.getElementById('speedBtn');
  if (speedBtn && window.PSCAudio) {
    window.PSCAudio.paintSpeedBtn(speedBtn);
    speedBtn.addEventListener('click', function () { window.PSCAudio.toggleSpeed(); });
  }
  render();
})();
