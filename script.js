const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// Recent training — auto-scrolling compact ticker + "show more". Progressive
// enhancement: without JS the full static list renders (no scroll, no clip).
// With JS, if the list overflows the compact window we clone it for a seamless
// vertical marquee and reveal a toggle to expand the full static list.
(function () {
  const viewport = document.querySelector('.training-viewport');
  const track = document.querySelector('.training-track');
  const groups = document.querySelector('.training-groups');
  const btn = document.querySelector('.training-more');
  if (!viewport || !track || !groups || !btn) return;

  const COMPACT_PX = 9.5 * 14; // matches .is-compact max-height (rem × 14px root)
  if (groups.scrollHeight <= COMPACT_PX + 4) return; // fits — leave full, no button

  // Duplicate the list so translateY(-50%) loops seamlessly.
  const clone = groups.cloneNode(true);
  clone.classList.add('training-clone');
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
  track.appendChild(clone);

  // ~40px/sec, so longer lists scroll proportionally (min 20s).
  track.style.setProperty('--marquee-dur', Math.max(20, Math.round(groups.scrollHeight / 40)) + 's');

  viewport.classList.add('is-compact');
  btn.hidden = false;
  btn.addEventListener('click', () => {
    const compact = viewport.classList.toggle('is-compact');
    btn.textContent = compact ? 'show more' : 'show less';
    // Collapsing from a long expanded list leaves the viewport far down the
    // page — scroll the training group back into view (scroll-margin-top on
    // .cert-group clears the sticky nav).
    if (compact) {
      viewport.closest('.cert-group').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();

// Hero phone terminal — maps the CSS screen layer onto the phone render's screen
// glass and plays a randomized mobile-security scan. No-ops if [data-phone-terminal]
// isn't on the page.
(function () {
  // corners of the phone's screen, as fractions of the PNG. measured off the
  // 3D scene the render came from — don't eyeball new numbers, re-measure.
  var QUAD = [[0.12428, 0.09708], [0.87572, 0.09708], [0.87572, 0.90292], [0.12428, 0.90292]];
  var SW = 560, SH = 1201;
  var PACE = 1;          // >1 faster, <1 slower
  var MAX_LINES = 15;

  function homography(d) {
    var x0 = d[0][0], y0 = d[0][1], x1 = d[1][0], y1 = d[1][1],
        x2 = d[2][0], y2 = d[2][1], x3 = d[3][0], y3 = d[3][1];
    var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    var dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    var den = dx1 * dy2 - dx2 * dy1;
    if (!den) return null;
    var a13 = (dx3 * dy2 - dx2 * dy3) / den, a23 = (dx1 * dy3 - dx3 * dy1) / den;
    return [x1 - x0 + a13 * x1, y1 - y0 + a13 * y1, 0, a13,
            x3 - x0 + a23 * x3, y3 - y0 + a23 * y3, 0, a23,
            0, 0, 1, 0, x0, y0, 0, 1];
  }

  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  function shuffle(a) { var b = a.slice(), i, j; for (i = b.length - 1; i > 0; i--) { j = rnd(i + 1); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function hex() { return '0x' + (0x1000000 + rnd(0xefffff)).toString(16) + pick(['a0', 'f8', '2c', '44', 'd0']); }

  function scenario() {
    var pkg = pick(['com.acme.wallet', 'com.northwind.bank', 'io.vertex.rides', 'com.helio.health', 'app.ledgerly.pay']);
    var host = pick(['api.acme-pay.io', 'gw.northwind.dev', 'edge.vertex.sh', 'api.helio.health']);
    var kind = pick(['teardown', 'intercept', 'keystore']);
    var head = { teardown: 'apk teardown', intercept: 'mitm session', keystore: 'keystore audit' }[kind];
    var core = {
      teardown: [
        ['dim', '$ apktool d ' + pkg + '.apk'], ['dim', '[*] decoding resources ...'],
        ['ok', '[+] 1,284 smali classes'], ['warn', '[!] debuggable=true in manifest'],
        ['dim', '    android:allowBackup=true'], ['warn', '[!] root check at ' + hex()],
        ['dim', '    patched -> return-void'], ['ok', '[+] rebuilt + signed']
      ],
      intercept: [
        ['dim', '$ frida -U -f ' + pkg], ['dim', '[*] attaching  pid ' + (2000 + rnd(7000))],
        ['ok', '[+] runtime hooked · art bridge'], ['warn', '[!] ssl pinning bypassable'],
        ['dim', '    okhttp certpinner stub'], ['dim', '[*] proxying ' + host],
        ['warn', '[!] bearer token in query string'], ['ok', '[+] ' + (40 + rnd(90)) + ' requests captured']
      ],
      keystore: [
        ['dim', '$ adb shell su -c frida-server'], ['dim', '[*] target ' + pkg],
        ['ok', '[+] keystore dump ....... ' + (4 + rnd(12))], ['warn', '[!] key exported, no strongbox'],
        ['dim', '    alias: refresh_token_v2'], ['warn', '[!] token in shared_prefs'],
        ['dim', '    /data/data/' + pkg + '/prefs'], ['ok', '[+] material recovered']
      ]
    }[kind];
    return {
      target: '/ ' + head,
      lines: [['dim', '$ recon --target ' + pkg]]
        .concat(shuffle(core.slice(1, core.length - 1)))
        .concat([core[core.length - 1], ['ok', '[+] pwning for fun and profit...']])
    };
  }

  function mount(root) {
    var el = {
      box: root, img: root.querySelector('.pt-img'), screen: root.querySelector('.pt-screen'),
      target: root.querySelector('[data-pt-target]'), log: root.querySelector('[data-pt-log]'),
      typed: root.querySelector('[data-pt-typed]'), findings: root.querySelector('[data-pt-findings]'),
      critical: root.querySelector('[data-pt-critical]'), bars: root.querySelectorAll('.pt-bars > div > i')
    };

    function fit() {
      var w = root.clientWidth;
      // derive height from the image's own aspect, not clientHeight — during a
      // resize the box can still report the previous height for a frame
      var ar = (el.img.naturalWidth && el.img.naturalHeight)
        ? el.img.naturalHeight / el.img.naturalWidth : 1500 / 750;
      var h = w * ar;
      if (!w || !h) return;
      var m = homography(QUAD.map(function (p) { return [p[0] * w, p[1] * h]; }));
      if (m) el.screen.style.transform = 'matrix3d(' + m.join(',') + ') scale(' + (1 / SW) + ',' + (1 / SH) + ')';
    }
    fit();
    var lastW = 0;
    if (window.ResizeObserver) { root._ptRO = new ResizeObserver(fit); root._ptRO.observe(root); }
    window.addEventListener('resize', fit);
    if (!el.img.complete) el.img.addEventListener('load', fit);
    // last resort: intervals keep running in a hidden/throttled frame, rAF does not
    setInterval(function () { if (root.clientWidth !== lastW) { lastW = root.clientWidth; fit(); } }, 300);

    var q, li, ci, phase, nextAt = 0, findings = 0, critical = 0, bars = [0, 0, 0, 0];

    function load() {
      var s = scenario();
      q = s.lines; li = 0; ci = 0; phase = 'type';
      findings = 0; critical = 0; bars = [0, 0, 0, 0];
      el.target.textContent = s.target;
      el.log.textContent = '';
      el.typed.innerHTML = '<span class="pt-caret"></span>';
      el.findings.textContent = '0 findings';
      el.critical.textContent = '0 critical';
      for (var i = 0; i < el.bars.length; i++) el.bars[i].style.width = '0%';
    }

    // append a finished line to the log and advance the counters/bars
    function commit(kind, text) {
      var line = document.createElement('div');
      line.className = kind === 'dim' ? '' : kind;
      line.textContent = text;
      el.log.appendChild(line);
      while (el.log.children.length > MAX_LINES) el.log.removeChild(el.log.firstChild);
      el.typed.innerHTML = '<span class="pt-caret"></span>';

      if (kind === 'warn' || kind === 'ok') el.findings.textContent = (++findings) + ' findings';
      if (kind === 'warn') el.critical.textContent = (++critical) + ' critical';
      for (var i = 0; i < bars.length; i++) {
        bars[i] = Math.min(0.97, bars[i] + (kind === 'warn' ? 0.16 : 0.07) * (1 - i * 0.18));
        el.bars[i].style.width = (bars[i] * 100).toFixed(1) + '%';
      }
    }

    function step(due) {
      var k = 1 / PACE;
      if (phase === 'reset') { load(); nextAt = due + 700 * k; phase = 'type'; return; }
      var cur = q[li];
      if (!cur) { phase = 'reset'; nextAt = due + 2600 * k; return; }
      var kind = cur[0], text = cur[1];

      if (phase === 'type') {
        ci++;
        el.typed.innerHTML = '';
        el.typed.appendChild(document.createTextNode(text.slice(0, ci)));
        el.typed.insertAdjacentHTML('beforeend', '<span class="pt-caret"></span>');
        if (ci >= text.length) { phase = 'commit'; nextAt = due + 90 * k; }
        else nextAt = due + (text.charAt(ci - 1) === ' ' ? 26 : 15 + Math.random() * 22) * k;
        return;
      }

      commit(kind, text);
      li++; ci = 0; phase = 'type';
      nextAt = due + (Math.random() < 0.22 ? 1100 + Math.random() * 1400 : 260 + Math.random() * 340) * k;
    }

    load();

    // Reduced motion: render one completed scan and stop. No typing, no loop.
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      for (var n = 0; n < q.length; n++) commit(q[n][0], q[n][1]);
      el.typed.textContent = '';
      return;
    }

    // The hero scrolls out of view for most of the page — don't burn frames
    // animating a phone nobody can see. Defaults to true and lets the observer's
    // first callback correct it: if IO never reports, we degrade to always-on
    // rather than a permanently frozen screen.
    var visible = true;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
      }).observe(root);
    }

    // two drivers: rAF for smoothness, an interval for frames that never
    // composite (rAF is never serviced there). pump() no-ops if it just ran.
    var lastPump = 0;
    function pump(t) {
      if (!visible) return;
      if (lastPump && t - lastPump < 8) return;
      lastPump = t;
      if (nextAt < t - 2000) nextAt = t;           // rejoin the clock after a gap
      var guard = 0;
      while (t >= nextAt && guard++ < 400) step(nextAt);
    }
    (function frame(t) { pump(t); requestAnimationFrame(frame); })(0);
    setInterval(function () { pump(performance.now()); }, 100);
  }

  var nodes = document.querySelectorAll('[data-phone-terminal]');
  for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
})();
