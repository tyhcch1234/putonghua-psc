/* 發音元件 · Pronunciation player
 * 1) 優先播放隨網站附帶的普通話音檔（assets/audio/*.mp3），毋須裝置語音
 * 2) 找不到音檔時退回瀏覽器內建語音（zh-CN）
 * 3) 全部失敗才提示安裝中文語音
 */
window.PSCAudio = (function () {
  var PACK = window.PSC_AUDIO || {};
  var MAP = PACK.map || {};
  var DIR = PACK.dir || 'assets/audio/';
  var SPEED_KEY = 'psc.speed';
  var RATES = { normal: 1, slow: 0.7 };

  var audio = null;
  var pending = null;        // { text, node }
  var failed = {};           // text -> true（音檔讀不到，改用語音合成）
  var speed = 'normal';
  var ttsVoice = null, ttsLocked = false;

  try { if (localStorage.getItem(SPEED_KEY) === 'slow') speed = 'slow'; } catch (e) {}

  function el() {
    if (audio) return audio;
    audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.addEventListener('ended', function () { clearMark(); pending = null; });
    audio.addEventListener('error', function () {
      if (!pending) return;
      failed[pending.text] = true;
      var p = pending;
      pending = null;
      clearMark();
      if (p.node) p.node.classList.add('saying');
      speakTTS(p.text, p.node);
    });
    return audio;
  }

  function clearMark() {
    var on = document.querySelectorAll('[data-say].saying');
    for (var i = 0; i < on.length; i++) on[i].classList.remove('saying');
  }

  function norm(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  }

  /* ---- 瀏覽器語音（後備） ---- */
  function pickVoice() {
    if (ttsLocked || !('speechSynthesis' in window)) return null;
    if (ttsVoice) return ttsVoice;
    var vs = speechSynthesis.getVoices() || [];
    var zh = vs.filter(function (v) {
      return /zh[-_]?(CN|Hans|SG)/i.test(v.lang) || /cmn|Chinese|普通話|普通话/i.test(v.name);
    });
    ttsVoice = zh[0] || vs.filter(function (v) { return /^zh/i.test(v.lang); })[0] || null;
    return ttsVoice;
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.addEventListener('voiceschanged', function () { ttsVoice = null; });
  }

  function speakTTS(text, node) {
    if (!('speechSynthesis' in window) || !pickVoice()) {
      toast('發音音檔未能載入，此裝置亦未安裝中文語音。請檢查網絡，或在系統設定加入「中文（普通話）」語音。');
      return;
    }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.voice = pickVoice();
    u.rate = speed === 'slow' ? 0.7 : 0.92;
    u.onend = clearMark;
    speechSynthesis.speak(u);
  }

  /* ---- 主入口 ---- */
  function speak(text, node) {
    text = norm(text);
    if (!text) return;
    stop();
    clearMark();
    if (node) node.classList.add('saying');

    var hash = MAP[text];
    if (hash && !failed[text]) {
      var a = el();
      pending = { text: text, node: node || null };
      a.src = DIR + hash + '.mp3';
      a.playbackRate = RATES[speed];
      a.currentTime = 0;
      var p = a.play();
      if (p && p.catch) {
        p.catch(function (err) {
          if (err && err.name === 'AbortError') return;       // 被下一次點擊打斷，屬正常
          if (pending && pending.text === text) {
            failed[text] = true;
            pending = null;
            speakTTS(text, node);
          }
        });
      }
      return;
    }
    speakTTS(text, node);
  }

  function stop() {
    clearMark();
    if (audio) { try { audio.pause(); } catch (e) {} }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    pending = null;
  }

  /* ---- 速度 ---- */
  function setSpeed(mode) {
    speed = mode === 'slow' ? 'slow' : 'normal';
    try { localStorage.setItem(SPEED_KEY, speed); } catch (e) {}
    if (audio) { try { audio.playbackRate = RATES[speed]; } catch (e) {} }
    document.querySelectorAll('[data-speed-btn]').forEach(function (b) { paintSpeedBtn(b); });
    return speed;
  }
  function toggleSpeed() { return setSpeed(speed === 'slow' ? 'normal' : 'slow'); }
  function paintSpeedBtn(b) {
    b.textContent = speed === 'slow' ? '0.7×' : '1.0×';
    b.title = speed === 'slow' ? '慢速示範（點按切回正常）' : '正常速度（點按轉慢速）';
    b.setAttribute('aria-pressed', speed === 'slow' ? 'true' : 'false');
  }

  /* ---- 預載：畫面頭幾個字詞先抓音檔，點下去即出聲 ---- */
  var warm = [];
  function prefetch(limit) {
    var nodes = document.querySelectorAll('[data-say]');
    var n = Math.min(limit || 4, nodes.length);
    warm = [];
    for (var i = 0; i < n; i++) {
      var t = norm(nodes[i].dataset.say);
      var h = MAP[t];
      if (!h || failed[t]) continue;
      var pre = new Audio();
      pre.preload = 'auto';
      pre.src = DIR + h + '.mp3';
      warm.push(pre);                    // 保留參考，否則下載可能被中止
    }
  }

  function has(text) { return !!MAP[norm(text)]; }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#1c1917;color:#fff;' +
      'padding:10px 16px;border-radius:10px;font-size:13px;line-height:1.6;z-index:300;max-width:84vw;text-align:center';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 6000);
  }

  return {
    speak: speak,
    stop: stop,
    has: has,
    prefetch: prefetch,
    setSpeed: setSpeed,
    toggleSpeed: toggleSpeed,
    paintSpeedBtn: paintSpeedBtn,
    speed: function () { return speed; },
    count: Object.keys(MAP).length
  };
})();
