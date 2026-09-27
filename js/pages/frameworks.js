/* Framework Library — six frameworks, each: Overview, Purpose, Input, Process, Logic, Output, Improvement,
 * Website Fields, Related Frameworks, References and where it is used in CAT.6. Accessible tabs (arrow keys). */
(function (C) {
  var P = C.ui.page, D = C.util.dom, esc = D.esc, L = C.data.library, FW = C.data.frameworks;
  var REF = {}; C.data.references.forEach(function (r) { REF[r.id] = r; });
  var EXTRA_REFS = { SP80030: ['Risk_Criteria.pdf（專案提供：Table G-2 / G-3 / G-4 / G-5）'], FAIR: ['FAIR筆記-20260926-Iris.md（專案提供：Scenario B 三點估計）'] };
  function list(a, ordered) { return '<' + (ordered ? 'ol' : 'ul') + '>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</' + (ordered ? 'ol' : 'ul') + '>'; }
  function panel(f) {
    var l = L[f.id], ref = REF[f.ref];
    return '<div class="c6-stack"><div class="c6-row">' + P.chip(f.layer, 'accent') + '<span class="c6-muted" style="font-size:var(--c6-fs-sm)">CAT.6 角色：' + esc(f.role) + '</span></div>' +
      '<div class="c6-lib">' +
      '<div class="c6-lib__block"><h3>Overview 概述</h3><p>' + esc(l.overview) + '</p></div>' +
      '<div class="c6-lib__block"><h3>Purpose 目的</h3><p>' + esc(l.purpose) + '</p></div>' +
      '<div class="c6-lib__block"><h3>Input 輸入</h3>' + list(l.input) + '</div>' +
      '<div class="c6-lib__block"><h3>Process 流程</h3>' + list(l.process, true) + '</div>' +
      '<div class="c6-lib__block"><h3>Logic 計算 / 判定邏輯</h3><p>' + esc(l.logic) + '</p></div>' +
      '<div class="c6-lib__block"><h3>Output 輸出</h3>' + list(l.output) + '</div>' +
      '<div class="c6-lib__block"><h3>Improvement 改善</h3><p>' + esc(l.improvement) + '</p></div>' +
      '<div class="c6-lib__block"><h3>Website Fields 網站欄位</h3><p>' + l.fields.map(function (x) { return P.chip(x); }).join(' ') + '</p></div>' +
      '<div class="c6-lib__block"><h3>Related Frameworks 相關框架</h3><p>' + l.related.map(function (r) { return '<a class="c6-link" href="#' + r + '" data-go="' + r + '">' + esc(P.fwShort(r)) + '</a>'; }).join('、') + '</p></div>' +
      '<div class="c6-lib__block"><h3>References 參考</h3><ul>' + (ref ? '<li><a class="c6-link" href="' + ref.url + '" target="_blank" rel="noopener">' + esc(ref.title) + '</a></li>' : '') + (EXTRA_REFS[f.id] || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="c6-lib__block"><h3>在 CAT.6 中使用</h3><p>' + l.pages.map(function (p) { return '<a class="c6-btn c6-btn--secondary c6-btn--sm" href="' + p[1] + '">' + esc(p[0]) + '</a>'; }).join(' ') + '</p></div>' +
      '</div></div>';
  }
  P.boot({ nav: 'library' }, function () {
    var page = document.getElementById('page');
    var start = (location.hash || '').slice(1); if (!L[start]) start = FW[0].id;
    page.innerHTML = '<div class="c6-intro"><h2 class="c6-intro__title">Framework Library</h2><p class="c6-intro__text">六個框架是 CAT.6 的方法論層，彼此互補而非取代。內容以專案提供資料與各框架公開文件的結構摘要為主，不重製標準本文。</p></div>' +
      '<section class="c6-card" aria-label="框架內容"><div class="c6-tabs" role="tablist" aria-label="框架">' + FW.map(function (f) {
        return '<button type="button" class="c6-tab" role="tab" id="tab-' + f.id + '" aria-controls="pn-' + f.id + '" aria-selected="' + (f.id === start) + '" tabindex="' + (f.id === start ? 0 : -1) + '" data-fw="' + f.id + '">' + esc(f.short) + '</button>';
      }).join('') + '</div>' + FW.map(function (f) {
        return '<div role="tabpanel" id="pn-' + f.id + '" aria-labelledby="tab-' + f.id + '" tabindex="0"' + (f.id === start ? '' : ' hidden') + '><h2 class="c6-panel__title" style="margin:0 0 .75rem">' + esc(f.name) + '</h2>' + panel(f) + '</div>';
      }).join('') + '</section>' +
      '<p class="c6-note">CAT.6 不是驗證機構；ISO/IEC 27001 驗證須由獨立驗證機構執行。框架名稱與商標屬各自權利人所有。</p>';
    function select(id, focus) {
      page.querySelectorAll('[role="tab"]').forEach(function (t) { var on = t.getAttribute('data-fw') === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      page.querySelectorAll('[role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== 'pn-' + id; });
      history.replaceState(null, '', '#' + id);
    }
    page.addEventListener('click', function (e) {
      var t = e.target.closest('[role="tab"]'); if (t) { select(t.getAttribute('data-fw')); return; }
      var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); select(g.getAttribute('data-go'), true); }
    });
    page.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
      var tabs = Array.prototype.slice.call(page.querySelectorAll('[role="tab"]')), i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (n == null) return; e.preventDefault(); n = (n + tabs.length) % tabs.length; select(tabs[n].getAttribute('data-fw'), true);
    });
    page.removeAttribute('aria-busy');
  });
})(globalThis.CAT6);
