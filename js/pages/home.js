/* Home: constellation (one orchestrated entrance), scroll-linked lifecycle, parallax, spotlight.
 * Everything degrades to a static, fully readable page under prefers-reduced-motion. */
(function (C) {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FW = C.data.frameworks, LIFE = C.data.lifecycle, REF = {};
  C.data.references.forEach(function (r) { REF[r.id] = r; });
  document.querySelectorAll('[data-mark]').forEach(function (n) { n.innerHTML = C.ui.icons.mark(); n.style.display = 'inline-flex'; n.firstChild.style.width = '100%'; n.firstChild.style.height = '100%'; });
  C.ui.shell.spotlight();

  /* ---- Constellation ---- */
  var box = document.getElementById('const'), cap = document.getElementById('const-cap'), R = 38;
  var pts = FW.map(function (f, i) { var a = (-90 + i * 60) * Math.PI / 180; return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) }; });
  var svg = '<svg class="c6-const__svg" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="c6-spoke" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9A6FF"/><stop offset="1" stop-color="#5E6AD2"/></linearGradient></defs>' +
    '<circle class="c6-const__halo" cx="50" cy="50" r="22"/><circle class="c6-const__halo" cx="50" cy="50" r="47" style="opacity:.5"/>' +
    '<polygon class="c6-const__ring" points="' + pts.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '"/>' +
    pts.map(function (p, i) { return '<line class="c6-const__spoke" x1="50" y1="50" x2="' + p.x + '" y2="' + p.y + '" style="animation-delay:' + (-i * 0.4) + 's"/>'; }).join('') + '</svg>';
  var core = '<div class="c6-const__core c6-enter" style="--d:200ms"><div><span class="c6-const__core-t">CAT.6</span><span class="c6-const__core-s">ONE RISK VIEW</span></div></div>';
  var nodes = FW.map(function (f, i) {
    return '<button type="button" class="c6-const__node c6-enter" data-i="' + i + '" style="left:' + pts[i].x + '%;top:' + pts[i].y + '%;--d:' + (320 + i * 90) + 'ms" aria-describedby="const-cap">' +
      '<span class="c6-const__name">' + f.name + '</span><span class="c6-const__layer">' + f.layer + '</span></button>';
  }).join('');
  box.innerHTML = svg + core + nodes;
  var defaultCap = cap.textContent;
  function activate(i) {
    box.querySelectorAll('.c6-const__node').forEach(function (n) { n.setAttribute('data-active', String(+n.dataset.i === i)); });
    cap.textContent = i == null ? defaultCap : FW[i].name + ' · ' + FW[i].layer + '：' + FW[i].role;
  }
  box.addEventListener('pointerover', function (e) { var n = e.target.closest('.c6-const__node'); if (n) activate(+n.dataset.i); });
  box.addEventListener('pointerleave', function () { activate(null); });
  box.addEventListener('focusin', function (e) { var n = e.target.closest('.c6-const__node'); if (n) activate(+n.dataset.i); });
  box.addEventListener('focusout', function () { activate(null); });

  /* ---- Lifecycle steps (sequence → numbered) ---- */
  var short = {}; FW.forEach(function (f) { short[f.id] = f.short; });
  document.getElementById('steps').innerHTML = LIFE.map(function (s, i) {
    return '<li class="c6-step" data-i="' + i + '"><h3 class="c6-step__t">' + s.id.charAt(0) + s.id.slice(1).toLowerCase() + '<small>' + s.zh + '</small></h3>' +
      '<p class="c6-body">' + s.text + '</p><div class="c6-step__fw">' + s.fw.map(function (f) { return '<span class="c6-badge">' + short[f] + '</span>'; }).join('') + '</div></li>';
  }).join('');

  var ring = document.getElementById('ring'), rr = 128, html = '<circle cx="200" cy="200" r="' + rr + '" fill="none" stroke="rgba(255,255,255,0.08)"/>' +
    '<circle id="ring-prog" cx="200" cy="200" r="' + rr + '" fill="none" stroke="#7C5CFC" stroke-width="2" stroke-linecap="round" transform="rotate(-90 200 200)" stroke-dasharray="' + (2 * Math.PI * rr) + '" stroke-dashoffset="' + (2 * Math.PI * rr) + '" style="transition:stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)"/>';
  LIFE.forEach(function (s, i) {
    var a = (-90 + i * 360 / LIFE.length) * Math.PI / 180, x = 200 + rr * Math.cos(a), y = 200 + rr * Math.sin(a);
    html += '<g class="ring-node" data-i="' + i + '"><circle cx="' + x + '" cy="' + y + '" r="7" fill="#0A0A0C" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>' +
      '<text x="' + (200 + (rr + 34) * Math.cos(a)) + '" y="' + (200 + (rr + 34) * Math.sin(a) + 4) + '" text-anchor="middle" font-size="11" fill="#8A8F98" font-family="Inter,system-ui">' + s.id + '</text></g>';
  });
  html += '<text id="ring-t" x="200" y="196" text-anchor="middle" font-size="30" font-weight="600" fill="#EDEDEF" font-family="Inter,system-ui"></text>' +
    '<text id="ring-s" x="200" y="224" text-anchor="middle" font-size="13" fill="#8A8F98" font-family="Inter,system-ui"></text>';
  ring.innerHTML = html;
  function setStep(i) {
    document.querySelectorAll('.c6-step').forEach(function (n) { n.setAttribute('data-active', String(+n.dataset.i === i)); });
    ring.querySelectorAll('.ring-node').forEach(function (g) {
      var on = +g.dataset.i <= i, c = g.querySelector('circle'), t = g.querySelector('text');
      c.setAttribute('fill', on ? '#7C5CFC' : '#0A0A0C'); c.setAttribute('stroke', on ? '#B9A6FF' : 'rgba(255,255,255,0.25)');
      t.setAttribute('fill', +g.dataset.i === i ? '#EDEDEF' : '#8A8F98');
    });
    var L = 2 * Math.PI * rr; document.getElementById('ring-prog').setAttribute('stroke-dashoffset', L - L * (i / LIFE.length));
    document.getElementById('ring-t').textContent = LIFE[i].zh;
    document.getElementById('ring-s').textContent = (i + 1) + ' / ' + LIFE.length + ' · ' + LIFE[i].id;
  }
  setStep(0);
  /* Active step = the one whose centre is nearest the viewport centre (updated in the shared scroll loop). */
  var stepEls = [].slice.call(document.querySelectorAll('.c6-step')), current = 0;
  function syncStep() {
    var mid = innerHeight / 2, best = 0, bestD = Infinity;
    stepEls.forEach(function (n, i) { var r = n.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
    if (best !== current) { current = best; setStep(best); }
  }

  /* ---- Frameworks grid ---- */
  document.getElementById('fw-grid').innerHTML = FW.map(function (f) {
    var r = REF[f.ref];
    return '<article class="c6-card c6-card--spot c6-card--lift c6-fw"><div class="c6-fw__top"><h3 class="c6-fw__name">' + f.name + '</h3><span class="c6-badge">' + f.layer + '</span></div>' +
      '<p class="c6-fw__role">' + f.role + '</p><a class="c6-fw__ref" href="' + r.url + '" target="_blank" rel="noopener">官方來源：' + r.title + '<span class="c6-sr-only">（另開新視窗）</span></a></article>';
  }).join('');

  /* ---- Nav state + scroll-linked parallax (rAF, transform only) ---- */
  var nav = document.getElementById('hnav'), layers = [].slice.call(document.querySelectorAll('[data-parallax]')), ticking = false;
  function onScroll() {
    var y = window.scrollY; nav.setAttribute('data-scrolled', String(y > 8)); syncStep();
    if (!reduce) layers.forEach(function (l) { l.style.transform = 'translate3d(0,' + (y * parseFloat(l.dataset.parallax)).toFixed(1) + 'px,0)'; });
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})(globalThis.CAT6);
