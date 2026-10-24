(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  /* theme */
  var toggle = $('#themeToggle');
  function paintToggle() { toggle.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; }
  paintToggle();
  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store('theme', next); paintToggle();
  });

  /* mobile menu */
  var burger = $('#burger'), links = $('#navLinks');
  burger.addEventListener('click', function () {
    burger.classList.toggle('open'); links.classList.toggle('open');
  });
  $$('a', links).forEach(function (a) {
    a.addEventListener('click', function () { burger.classList.remove('open'); links.classList.remove('open'); });
  });

  /* scroll progress + active link */
  var progress = $('#progress');
  var sections = $$('main section[id]');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    var cur = '';
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    $$('a', links).forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* cursor spotlight */
  addEventListener('pointermove', function (e) {
    root.style.setProperty('--mx', e.clientX + 'px'); root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });

  /* reveal + counters + lane lines */
  function countUp(el) {
    var end = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = end + suffix; return; }
    var t0 = performance.now(), dur = 1400;
    (function step(t) {
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      var c = $('[data-count]', en.target); if (c) countUp(c);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* typed words */
  var typedEl = $('#typed');
  var words = ['dunyo oshxonasi', 'yangi platforma', 'o\'z startapi', 'katta restoran', 'millionlab foydalanuvchi'];
  (function typeLoop(w, i, del) {
    var word = words[w];
    if (reduced) { typedEl.textContent = word; return; }
    typedEl.textContent = word.slice(0, i);
    var delay = del ? 35 : 80;
    if (!del && i === word.length) { delay = 1700; del = true; }
    else if (del && i === 0) { del = false; w = (w + 1) % words.length; delay = 350; }
    setTimeout(function () { typeLoop(w, i + (del ? -1 : 1), del); }, delay);
  })(0, 0, false);

  /* 3D tilt on profile cards */
  if (!reduced && matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .05s';
        card.style.transform = 'perspective(900px) rotateY(' + x * 8 + 'deg) rotateX(' + -y * 8 + 'deg) translateY(-6px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform .5s ease'; card.style.transform = '';
      });
    });
  }

  /* lab tabs */
  var tabs = $$('.tab'), panels = { om: $('#panel-om'), oq: $('#panel-oq') };
  var codeStarted = false;
  function show(name) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === name); t.setAttribute('aria-selected', t.dataset.tab === name); });
    Object.keys(panels).forEach(function (k) { panels[k].classList.toggle('active', k === name); });
    if (name === 'oq') { startCode(); fillStages(); }
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.tab); }); });

  var codeText = [
    '// Oqilbek — kelajak dasturchisi',
    'const oqilbek = {',
    '  yosh: 14,',
    '  maktab: "25-maktab, 9-sinf",',
    '  orzu: "katta platformalar qurish",',
    '};',
    '',
    'oqilbek.organmoqda("kompyuter savodxonligi");',
    'oqilbek.yozmoqda("birinchi dastur");',
    '',
    'while (orzu.yashaydi) {',
    '  startap.rivojlantir();',
    '}',
    '// natija: katta biznes 🚀'
  ].join('\n');

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function highlight(s) {
    return esc(s)
      .replace(/(\/\/.*$)/gm, '<span class="tc">$1</span>')
      .replace(/("[^"]*"?)/g, '<span class="ts">$1</span>')
      .replace(/\b(const|while)\b/g, '<span class="tk">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="tn">$1</span>')
      .replace(/\b(organmoqda|yozmoqda|rivojlantir)\b/g, '<span class="tf">$1</span>');
  }
  function startCode() {
    if (codeStarted) return; codeStarted = true;
    var el = $('#code'), i = 0;
    if (reduced) { el.innerHTML = highlight(codeText); return; }
    (function tick() {
      i += 1; el.innerHTML = highlight(codeText.slice(0, i));
      if (i < codeText.length) setTimeout(tick, codeText[i] === '\n' ? 160 : 28);
    })();
  }
  function fillStages() {
    var fills = [100, 62, 25, 8];
    $$('#stages .bar i').forEach(function (b, n) { setTimeout(function () { b.style.width = fills[n] + '%'; }, 200 + n * 250); });
  }

  /* confetti */
  var cv = $('#confetti'), ctx = cv.getContext('2d'), bits = [], raf = null;
  function sizeCv() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  sizeCv(); addEventListener('resize', sizeCv);
  var palette = ['#f97316', '#f43f5e', '#6366f1', '#06b6d4', '#facc15', '#10b981'];
  function burst(x, y, n) {
    if (reduced) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
      bits.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: 4 + Math.random() * 6, c: palette[i % palette.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1 });
    }
    if (!raf) raf = requestAnimationFrame(draw);
  }
  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    var d = devicePixelRatio;
    bits = bits.filter(function (b) { return b.life > 0 && b.y < innerHeight + 40; });
    bits.forEach(function (b) {
      b.vy += .35; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.life -= .008;
      ctx.save(); ctx.globalAlpha = Math.max(b.life, 0); ctx.translate(b.x * d, b.y * d); ctx.rotate(b.rot);
      ctx.fillStyle = b.c; ctx.fillRect(-b.r * d / 2, -b.r * d / 2, b.r * d, b.r * d * .6); ctx.restore();
    });
    raf = bits.length ? requestAnimationFrame(draw) : (ctx.clearRect(0, 0, cv.width, cv.height), null);
  }
  $('#celebrate').addEventListener('click', function (e) {
    var r = e.currentTarget.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, 90);
    setTimeout(function () { burst(innerWidth * .25, innerHeight * .4, 60); burst(innerWidth * .75, innerHeight * .4, 60); }, 250);
    toast('Omonjon va Oqilbekni tabriklaymiz! 🎉');
  });

  /* claps */
  var clap = $('#clap'), clapCount = $('#clapCount');
  var claps = parseInt(store('claps') || '0', 10) || 0;
  clapCount.textContent = claps;
  clap.addEventListener('click', function (e) {
    claps += 1; clapCount.textContent = claps; store('claps', String(claps));
    clap.classList.remove('pop'); void clap.offsetWidth; clap.classList.add('pop');
    var r = clap.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 24);
    if (claps === 10) toast('Rahmat! Ular buni albatta eshitadi 💙');
  });

  /* toast + copy */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }
  $$('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var num = b.dataset.copy;
      var done = function () { toast('Raqam nusxalandi: ' + num); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(num).then(done, function () { toast(num); });
      else toast(num);
    });
  });
})();

/* lightbox */
(function () {
  var lb = document.getElementById('lightbox'), img = document.getElementById('lbImg'), cap = document.getElementById('lbCap');
  var last = null;
  function open(btn) {
    last = btn; img.src = btn.dataset.full; img.alt = btn.querySelector('img').alt; cap.textContent = btn.dataset.cap || '';
    lb.classList.add('open'); document.body.style.overflow = 'hidden'; document.getElementById('lbClose').focus();
  }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; if (last) last.focus(); }
  Array.prototype.forEach.call(document.querySelectorAll('.zoomable'), function (b) { b.addEventListener('click', function () { open(b); }); });
  lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
})();
