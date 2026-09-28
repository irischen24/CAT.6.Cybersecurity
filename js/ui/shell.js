/* App shell: builds the sidebar from one config (no duplicated nav markup), drawer behaviour, spotlight,
 * and the top-bar search (Enter → Risk Register filtered by the query). */
(function (C) {
  var I = C.ui.icons;
  var NAV = [
    { id: 'dashboard', label: 'Dashboard', zh: '總覽', icon: 'dashboard', href: 'dashboard.html' },
    { id: 'assessment', label: 'Risk Assessment', zh: '風險評估', icon: 'assess', href: 'risk-assessment.html', children: [
      { id: 'nist', label: 'NIST SP 800-30', href: 'nist-800-30.html' },
      { id: 'cisram', label: 'CIS RAM', href: 'cis-ram.html' },
      { id: 'cis', label: 'CIS Controls v8.1', href: 'cis-controls.html' },
      { id: 'csf', label: 'NIST CSF 2.0', href: 'nist-csf.html' } ] },
    { id: 'register', label: 'Risk Register', zh: '風險登錄表', icon: 'register', href: 'risk-register.html' },
    { id: 'library', label: 'Frameworks', zh: '框架庫', icon: 'library', href: 'frameworks.html' },
    { id: 'mapping', label: 'Framework Mapping', zh: '框架對應', icon: 'mapping', href: 'framework-mapping.html' },
    { id: 'fair', label: 'FAIR Analysis', zh: '財務量化分析', icon: 'fair', href: 'fair-analysis.html' },
    { id: 'iso', label: 'ISO 27001 Readiness', zh: '認證準備', icon: 'iso', href: 'iso-readiness.html', children: [
      { id: 'iso-gap', label: 'Gap & SoA', href: 'iso-gap.html' },
      { id: 'iso-audit', label: 'Audit & Review', href: 'iso-audit.html' },
      { id: 'evidence', label: 'Evidence', href: 'evidence.html' } ] },
    { id: 'treatment', label: 'Risk Treatment', zh: '風險處理', icon: 'treat', href: 'risk-treatment.html' },
    { id: 'import', label: 'Data Import', zh: '資料匯入', icon: 'import', href: 'data-import.html' },
    { id: 'reports', label: 'Reports', zh: '報告中心', icon: 'report', href: 'reports.html' }
  ];
  function parentOf(id) { var p = null; NAV.forEach(function (n) { (n.children || []).forEach(function (c) { if (c.id === id) p = n; }); }); return p; }
  function buildSidebar(el, active) {
    var parent = parentOf(active);
    var items = NAV.map(function (n) {
      var cur = n.id === active, inGroup = parent && parent.id === n.id;
      var inner = I.icon(n.icon, 'c6-nav__icon') + '<span class="c6-nav__text">' + n.label + '</span>';
      var kids = n.children ? '<ul class="c6-nav__sub">' + n.children.map(function (c) {
        return '<li><a class="c6-nav__sublink" href="' + c.href + '"' + (c.id === active ? ' aria-current="page"' : '') + '>' + c.label + '</a></li>';
      }).join('') + '</ul>' : '';
      return '<li><a class="c6-nav__link' + (inGroup ? ' c6-nav__link--group' : '') + '" href="' + n.href + '" title="' + n.label + ' · ' + n.zh + '"' + (cur ? ' aria-current="page"' : '') + '>' + inner + '</a>' + kids + '</li>';
    }).join('');
    el.innerHTML =
      '<div class="c6-side__head"><a class="c6-brand" href="../index.html">' + I.mark('c6-brand__mark') + '<span class="c6-brand__text">CAT.6 Cybersecurity</span></a>' +
      '<button type="button" class="c6-iconbtn c6-side__toggle" aria-controls="c6-side" aria-expanded="true">' + I.icon('sidebar') + '<span class="c6-sr-only">收合側邊選單</span></button></div>' +
      '<nav aria-label="主選單"><ul class="c6-nav">' + items + '</ul></nav>' +
      '<p class="c6-side__foot">CAT.6 不核發 ISO/IEC 27001 證書；正式驗證須由獨立驗證機構執行。</p>';
  }
  /* Sidebar views (one component, three behaviours):
   *   Desktop ≥ 1200px: 'full' (default) ⇄ 'rail' — preference kept in localStorage; main content takes the freed width.
   *   Tablet 768–1199px: 'rail' (icons) ⇄ 'overlay' (full labels drawn over the content with a backdrop).
   *   Mobile < 768px:    'hidden' ⇄ 'drawer' (menu button in the top bar, backdrop, close button).
   * The initial view is set by an inline <head> script (html[data-side-view]) before first paint, so there is no layout jump. */
  var BP_TABLET = 768, BP_DESKTOP = 1200, PREF = 'cat6:ui:side';
  function pref(v) { try { if (v === undefined) return localStorage.getItem(PREF); localStorage.setItem(PREF, v); } catch (e) { return null; } }
  function device() { var w = window.innerWidth; return w >= BP_DESKTOP ? 'desktop' : w >= BP_TABLET ? 'tablet' : 'mobile'; }
  function baseView(dev) { return dev === 'desktop' ? (pref() === 'collapsed' ? 'rail' : 'full') : dev === 'tablet' ? 'rail' : 'hidden'; }
  function sidebar(side, scrim, menuBtn) {
    var root = document.documentElement, toggle = side.querySelector('.c6-side__toggle'), dev = device(), lastFocus = null;
    function view() { return root.getAttribute('data-side-view') || baseView(dev); }
    function expanded(v) { return v === 'full' || v === 'overlay' || v === 'drawer'; }
    function sync() {
      var v = view(), open = expanded(v), temp = v === 'overlay' || v === 'drawer';
      var label = temp ? '關閉側邊選單' : open ? '收合側邊選單' : '展開側邊選單';
      toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', label); toggle.title = label;
      toggle.querySelector('.c6-sr-only').textContent = label;
      if (menuBtn) { menuBtn.setAttribute('aria-expanded', String(v === 'drawer')); menuBtn.setAttribute('aria-label', v === 'drawer' ? '關閉選單' : '開啟選單'); }
      side.setAttribute('data-open', String(temp)); scrim.setAttribute('data-open', String(temp));
      if (temp) side.setAttribute('aria-modal', 'true'); else side.removeAttribute('aria-modal');
    }
    function set(v, focusBack) {
      var wasTemp = view() === 'overlay' || view() === 'drawer';
      root.setAttribute('data-side-view', v); sync();
      if (v === 'overlay' || v === 'drawer') { lastFocus = document.activeElement; var f = side.querySelector('.c6-nav__link'); if (f) f.focus({ preventScroll: true }); }
      else if (wasTemp && focusBack !== false) { var back = (lastFocus && document.contains(lastFocus) && lastFocus.offsetParent) ? lastFocus : (dev === 'mobile' ? menuBtn : toggle); if (back) back.focus({ preventScroll: true }); }
    }
    toggle.addEventListener('click', function () {
      var v = view();
      if (dev === 'desktop') { var nv = v === 'full' ? 'rail' : 'full'; pref(nv === 'rail' ? 'collapsed' : 'expanded'); set(nv); }
      else if (dev === 'tablet') set(v === 'overlay' ? 'rail' : 'overlay');
      else set('hidden');
    });
    if (menuBtn) menuBtn.addEventListener('click', function () { set(view() === 'drawer' ? 'hidden' : 'drawer'); });
    scrim.addEventListener('click', function () { set(baseView(dev)); });
    document.addEventListener('keydown', function (e) {
      var v = view();
      if (v !== 'overlay' && v !== 'drawer') return;
      if (e.key === 'Escape') { e.preventDefault(); set(baseView(dev)); return; }
      if (e.key === 'Tab') { /* keep focus inside the open drawer */
        var f = [].slice.call(side.querySelectorAll('a[href], button:not([disabled])')).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    /* Crossing a breakpoint resets temporary drawers and applies that device's default / saved preference. */
    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t); t = setTimeout(function () { var d = device(); if (d !== dev) { dev = d; set(baseView(dev), false); } }, 100);
    });
    if (!root.getAttribute('data-side-view')) root.setAttribute('data-side-view', baseView(dev));
    sync();
    /* Enable the width transition only after first paint so the initial render never animates. */
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('c6-side-ready'); }); });
  }
  /* Mouse-tracking spotlight for .c6-card--spot (pointer devices only). */
  function spotlight(scope) {
    if (!matchMedia('(hover: hover)').matches) return;
    (scope || document).addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.c6-card--spot'); if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--c6-mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--c6-my', (e.clientY - r.top) + 'px');
    });
  }
  function search() {
    var input = document.querySelector('.c6-search input');
    if (!input) return;
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && input.value.trim()) location.href = 'risk-register.html?q=' + encodeURIComponent(input.value.trim());
    });
  }
  function init(active) {
    var side = document.querySelector('.c6-side'), scrim = document.querySelector('.c6-scrim'), btn = document.querySelector('.c6-topbar__menu');
    buildSidebar(side, active);
    if (btn) btn.innerHTML = I.icon('menu') + '<span class="c6-sr-only">開啟選單</span>';
    sidebar(side, scrim, btn);
    document.querySelectorAll('[data-icon]').forEach(function (n) { n.innerHTML = I.icon(n.getAttribute('data-icon')); });
    spotlight(); search();
  }
  C.ui.shell = { init: init, spotlight: spotlight, NAV: NAV };
})(globalThis.CAT6);
