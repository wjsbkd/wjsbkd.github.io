/* ============================================================
   scrollytelling 驱动
   实测依据（本机 Chrome，1280x720 / 24fps / H.264）：
     原始 主视频.mp4 只有 2 个关键帧 -> seek p50 55.7ms / p90 101ms，画面刷新上限 ~17 次/秒
     重编码 GOP6（61 个关键帧）      -> seek p50  5.6ms / p90  7.7ms，可持续 ~169 次/秒
   所以：一次只允许一个 seek 在飞，并把目标时间量化到整帧，避免同一帧重复解码。
   ============================================================ */
(function () {
  'use strict';

  var main = document.getElementById('v-main');
  var intro = document.getElementById('v-intro');
  var layers = {
    intro: document.getElementById('layer-intro'),
    main: document.getElementById('layer-main'),
    outro: document.getElementById('layer-outro')
  };
  var caps = {
    intro: document.getElementById('cap-intro'),
    1: document.getElementById('cap-1'),
    2: document.getElementById('cap-2'),
    3: document.getElementById('cap-3'),
    outro: document.getElementById('cap-outro')
  };
  var navItems = [].slice.call(document.querySelectorAll('.nav-item'));
  var barFill = document.getElementById('bar-fill');
  var readout = document.getElementById('readout');
  var cue = document.getElementById('cue');

  var FPS = 24;                       // 素材实测帧率
  var FRAME = 1 / FPS;
  var EPS_TOP = 0.007;                // 首屏保留约 10vh 的滚动余量，滚一格鼠标不会把 hero 直接抹掉
  var EPS_OUTRO = 0.98;               // 规格：0.98 之后进尾屏
  var ACT_1 = 6.8 / 15.072;           // 实测明度台阶：6.5-7.0s 处由特写切到椅上办公
  var ACT_2 = 11.6 / 15.072;          // 11.4-12.0s 处由腾空落到地面
  var SEEK_STALL = 400;               // seeked 迟迟不回来就解锁，防止卡死

  var duration = 0;
  var targetP = 0, smoothP = 0;
  var seeking = false, issuedFrame = -1, seekStartedAt = 0;
  var capKey = 'intro';
  var stage = 'intro';
  var mx = 0, my = 0, pmx = 0, pmy = 0;
  var fine = window.matchMedia('(pointer:fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 首屏循环是「自己会动」的装饰性运动，reduced-motion 下停在首帧当静态海报；
     滚动 seek 由用户驱动，属于保留项。摘掉 autoplay 属性是为了防止
     浏览器在回到前台时自作主张续播。 */
  if (reduce) {
    intro.removeAttribute('autoplay');
    /* 光在脚本里 pause() 不够：autoplay 的启动是排队任务，会跑在这次 pause() 之后。
       钉在 play 事件上，任何一次起播都立刻被按回去，首帧保持静止。 */
    intro.addEventListener('play', function () { intro.pause(); intro.currentTime = 0; });
    intro.pause();
  }

  /* ── 时间读数 ─────────────────────────────────────────── */
  function fmt(t) {
    var m = Math.floor(t / 60), s = t - m * 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }

  /* ── 轨道高度 = 主视频秒数 x 100vh ─────────────────────── */
  function setScreens() {
    if (!(duration > 0)) return;
    document.documentElement.style.setProperty('--screens', duration.toFixed(3));
  }

  function onMeta() {
    duration = main.duration;
    if (!(duration > 0)) return;
    setScreens();
    readout.textContent = '00:00.0 / ' + fmt(duration);
    main.pause();
  }
  if (main.readyState >= 1) onMeta();
  main.addEventListener('loadedmetadata', onMeta);
  main.addEventListener('canplay', function () { main.pause(); });

  /* ── 滚动进度 ─────────────────────────────────────────── */
  function readScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    targetP = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', function () { readScroll(); setScreens(); }, { passive: true });

  /* ── 分段判定 ─────────────────────────────────────────── */
  function resolveStage(p) {
    if (p <= EPS_TOP) return 'intro';
    if (p >= EPS_OUTRO) return 'outro';
    return 'main';
  }
  function resolveAct(t) {
    if (t < ACT_1 * duration) return '1';
    if (t < ACT_2 * duration) return '2';
    return '3';
  }

  function applyStage(next) {
    if (next === stage) return;
    stage = next;
    layers.intro.classList.toggle('is-on', stage === 'intro');
    layers.main.classList.toggle('is-on', stage === 'main');
    layers.outro.classList.toggle('is-on', stage === 'outro');
    /* 隐藏的循环层停掉解码，省一份常驻开销；显示时再续上 */
    if (stage === 'intro') { if (!reduce && intro.paused) intro.play().catch(function () {}); }
    else if (!intro.paused) intro.pause();
    /* 交棒给 main 时才把它的 preload 从 metadata 提到 auto：
       HTML 里写 metadata 是为了「用户一次滚动都没有时别下整份 3.5 MB」，
       但一旦真的开始往 main 走，就必须让它提前下，否则滚到中段才从零起缓冲。
       提前点选在 intro→main 这一跳（而不是更早），是因为那是用户意图最明确的位置。
       幂等：preload 已是 auto 时再赋值不产生新请求。 */
    if (stage === 'main' && main.preload !== 'auto') main.preload = 'auto';
  }

  function applyCaption(key) {
    if (key === capKey) return;
    capKey = key;
    for (var k in caps) if (caps[k]) caps[k].classList.toggle('is-on', k === key);
    var idx = { intro: 0, 1: 1, 2: 2, 3: 3, outro: 4 }[key];
    navItems.forEach(function (el, i) { el.classList.toggle('is-on', i === idx); });
  }

  /* ── 主循环 ───────────────────────────────────────────── */
  function tick(now) {
    requestAnimationFrame(tick);

    smoothP += (targetP - smoothP) * 0.45;
    if (Math.abs(targetP - smoothP) < 0.00015) smoothP = targetP;

    barFill.style.transform = 'scaleX(' + smoothP.toFixed(4) + ')';
    cue.classList.toggle('is-gone', smoothP > 0.01);

    var next = resolveStage(smoothP);
    applyStage(next);

    if (duration > 0) {
      var t = next === 'intro' ? 0 : next === 'outro' ? duration - FRAME : smoothP * duration;
      var capKey = next === 'intro' ? 'intro' : next === 'outro' ? 'outro' : resolveAct(t);
      applyCaption(capKey);
      readout.textContent = fmt(t) + ' / ' + fmt(duration);

      var f = Math.round(t * FPS);
      if (f !== issuedFrame && (!seeking || now - seekStartedAt > SEEK_STALL)) {
        issuedFrame = f; seeking = true; seekStartedAt = now;
        try { main.currentTime = f / FPS; } catch { seeking = false; }
      }
    }

    if (fine && !reduce && stage === 'intro') {
      pmx += (mx - pmx) * 0.08; pmy += (my - pmy) * 0.08;
      intro.style.transform =
        'translate3d(' + (-pmx * 26).toFixed(2) + 'px,' + (-pmy * 18).toFixed(2) + 'px,0) scale(1.08)';
    }
  }

  main.addEventListener('seeked', function () { seeking = false; }, { passive: true });
  main.addEventListener('error', function () { seeking = false; });

  /* ── 首屏跟随鼠标 ─────────────────────────────────────── */
  if (fine) {
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  /* 标签页切回来时 rAF 停了很久，强制重新对齐一次，避免画面停在离开前的帧 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    readScroll();
    issuedFrame = -1; seeking = false;
  });

  /* ── 跳转 ─────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-jump]') : null;
    if (!el) return;
    e.preventDefault();
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = parseFloat(el.getAttribute('data-jump'));
    window.scrollTo({ top: max * p, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ── 天光带上的数字雨已随第三轮点阵语言退役（第四轮）：
     参考图的装饰只有药丸、微标签、发丝线三样，画面上不再叠字形层。 ── */

  function boot() {
    readScroll();
    intro.play().catch(function () {});
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
