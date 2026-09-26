/* App shell: builds the sidebar from one config (no duplicated nav markup), drawer behaviour, spotlight. */
(function (C) {
  var I = C.ui.icons;
  var NAV = [
    { id: 'dashboard', label: 'Dashboard', zh: '總覽', icon: 'dashboard', href: 'dashboard.html' },
    { id: 'assessment', label: 'Risk Assessment', zh: '風險評估', icon: 'assess' },
    { id: 'library', label: 'Frameworks', zh: '框架庫', icon: 'library' },
    { id: 'mapping', label: 'Framework Mapping', zh: '框架對應', icon: 'mapping' },
    { id: 'fair', label: 'FAIR Analysis', zh: '財務量化分析', icon: 'fair', href: 'fair-analysis.html' },
    { id: 'iso', label: 'ISO 27001 Readiness', zh: '認證準備', icon: 'iso' },
    { id: 'treatment', label: 'Risk Treatment', zh: '風險處理', icon: 'treat' },
    { id: 'import', label: 'Data Import', zh: '資料匯入', icon: 'import' },
    { id: 'reports', label: 'Reports', zh: '報告中心', icon: 'report' }
  ];
  function buildSidebar(el, active) {
    var items = NAV.map(function (n) {
      var inner = I.icon(n.icon, 'c6-nav__icon') + '<span class="c6-nav__text">' + n.label + '</span>';
      if (!n.href) return '<li><span class="c6-nav__link" aria-disabled="true" title="' + n.label + ' · ' + n.zh + '（規劃中）">' + inner + '<span class="c6-nav__soon">規劃中</span></span></li>';
      return '<li><a class="c6-nav__link" href="' + n.href + '" title="' + n.label + ' · ' + n.zh + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + inner + '</a></li>';
    }).join('');
    el.innerHTML =
      '<a class="c6-brand" href="../index.html">' + I.mark('c6-brand__mark') + '<span class="c6-brand__text">CAT.6 Cybersecurity</span></a>' +
      '<nav aria-label="主選單"><ul class="c6-nav">' + items + '</ul></nav>' +
      '<p class="c6-side__foot">CAT.6 不核發 ISO/IEC 27001 證書；正式驗證須由獨立驗證機構執行。</p>';
  }
  function drawer(side, scrim, btn) {
    function set(open) {
      side.setAttribute('data-open', open); scrim.setAttribute('data-open', open);
      btn.setAttribute('aria-expanded', open);
      if (open) { var f = side.querySelector('a'); if (f) f.focus(); } else btn.focus();
    }
    btn.addEventListener('click', function () { set(side.getAttribute('data-open') !== 'true'); });
    scrim.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && side.getAttribute('data-open') === 'true') set(false); });
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
  function init(active) {
    var side = document.querySelector('.c6-side'), scrim = document.querySelector('.c6-scrim'), btn = document.querySelector('.c6-topbar__menu');
    buildSidebar(side, active);
    if (btn) { btn.innerHTML = I.icon('menu'); drawer(side, scrim, btn); }
    document.querySelectorAll('[data-icon]').forEach(function (n) { n.innerHTML = I.icon(n.getAttribute('data-icon')); });
    spotlight();
  }
  C.ui.shell = { init: init, spotlight: spotlight, NAV: NAV };
})(globalThis.CAT6);
