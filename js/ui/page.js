/* Page bootstrap + shared presentation helpers (chips, notice, sub-navigation, KPI cards). */
(function (C) {
  var esc = function (v) { return C.util.dom.esc(v); };
  var BAND = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };
  var NIST_BAND = { VL: 'low', L: 'low', M: 'medium', H: 'high', VH: 'critical' };
  var NIST_NAME = { VL: 'Very Low', L: 'Low', M: 'Moderate', H: 'High', VH: 'Very High' };

  function sev(band) { return band ? '<span class="c6-sev c6-sev--' + BAND[band.id] + '"><span class="c6-sev__shape" aria-hidden="true"></span>' + band.label + '</span>' : dataRequired(); }
  function score(l, i) {
    if (!(l >= 1 && l <= 5 && i >= 1 && i <= 5)) return dataRequired('需 L 與 I');
    var a = C.calc.riskMatrix.assess(l, i);
    return '<span class="c6-score"><span class="c6-num">' + a.score + '</span>' + sev(a.band) + '</span>';
  }
  function level(id, prefix) { return id ? '<span class="c6-sev c6-sev--' + NIST_BAND[id] + '"><span class="c6-sev__shape" aria-hidden="true"></span>' + (prefix || '') + NIST_NAME[id] + '</span>' : dataRequired(); }
  function dataRequired(why) { return '<span class="c6-dr" title="' + esc(why || '缺少必要資料') + '">DATA REQUIRED</span>'; }
  function chip(text, tone) { return '<span class="c6-chip' + (tone ? ' c6-chip--' + tone : '') + '">' + esc(text) + '</span>'; }
  function prov(source) { return source ? C.util.provenance.badge(source) : ''; }

  /* Default-values notice. Acknowledging collapses it but never hides the fact that defaults are in use. */
  function notice(el, using, o) {
    o = o || {};
    if (!el) return;
    if (!using) { el.hidden = true; return; }
    var ack = sessionStorage.getItem('cat6:notice-ack') === '1';
    el.hidden = false; el.className = 'c6-notice' + (ack ? ' c6-notice--compact' : '');
    el.setAttribute('aria-label', '資料來源提示');
    el.innerHTML = ack
      ? '<p class="c6-notice__text"><strong>本頁含 CAT.6 DEFAULT / ASSUMED VALUE。</strong> 標示 CAT6_DEFAULT 的數值為示範假設，非組織實際狀況。</p><div class="c6-notice__actions"><a class="c6-btn c6-btn--ghost" href="' + (o.edit || '#') + '">Edit Values</a><a class="c6-btn c6-btn--secondary" href="data-import.html' + (o.dataset ? '?ds=' + o.dataset : '') + '">Import Organization Data</a></div>'
      : '<p class="c6-notice__text"><strong>' + C.data.defaults._meta.notice + '</strong><br>尚未提供組織資料的欄位使用 CAT.6 示範 / 假設值（CAT6_DEFAULT），不代表任何組織的實際評估、稽核或驗證結果。</p>' +
        '<div class="c6-notice__actions"><button class="c6-btn c6-btn--secondary" type="button" data-ack>Use CAT.6 Default Values</button><a class="c6-btn c6-btn--ghost" href="' + (o.edit || '#') + '">Edit Values</a><a class="c6-btn c6-btn--primary" href="data-import.html' + (o.dataset ? '?ds=' + o.dataset : '') + '">Import Organization Data</a></div>';
    var b = el.querySelector('[data-ack]');
    if (b) b.addEventListener('click', function () { sessionStorage.setItem('cat6:notice-ack', '1'); notice(el, using, o); C.util.dom.toast('已確認使用 CAT.6 預設值；所有預設值仍會標示 CAT6_DEFAULT。'); });
  }

  function subnav(el, items, active) {
    if (!el) return;
    el.innerHTML = '<nav class="c6-subnav" aria-label="本節頁面"><ul>' + items.map(function (i) {
      return '<li><a href="' + i.href + '"' + (i.id === active ? ' aria-current="page"' : '') + '>' + esc(i.label) + '</a></li>';
    }).join('') + '</ul></nav>';
  }
  var GROUPS = {
    assessment: [{ id: 'assessment', label: 'Setup & Workflow', href: 'risk-assessment.html' }, { id: 'nist', label: 'NIST SP 800-30', href: 'nist-800-30.html' }, { id: 'cisram', label: 'CIS RAM', href: 'cis-ram.html' }, { id: 'cis', label: 'CIS Controls v8.1', href: 'cis-controls.html' }, { id: 'csf', label: 'NIST CSF 2.0', href: 'nist-csf.html' }],
    iso: [{ id: 'iso', label: 'Readiness & Roadmap', href: 'iso-readiness.html' }, { id: 'iso-gap', label: 'Gap & SoA', href: 'iso-gap.html' }, { id: 'iso-audit', label: 'Audit & Review', href: 'iso-audit.html' }, { id: 'evidence', label: 'Evidence', href: 'evidence.html' }]
  };

  function kpi(k) {
    return '<article class="c6-kpi' + (k.featured ? ' c6-kpi--featured' : '') + '">' +
      '<h3 class="c6-kpi__label">' + esc(k.label) + '</h3>' +
      (k.empty ? '<p class="c6-kpi__value c6-kpi__value--empty">' + esc(k.empty) + '</p>' : '<p class="c6-kpi__value">' + k.value + '</p>') +
      '<p class="c6-kpi__meta">' + (k.src ? prov(k.src) : '') + '<span>' + (k.meta || '') + '</span></p>' +
      (k.href ? '<a class="c6-kpi__go" href="' + k.href + '" aria-label="查看 ' + esc(k.label) + '">' + C.ui.icons.icon('arrow') + '</a>' : '') + '</article>';
  }

  function context(W) {
    var ctx = document.getElementById('c6-ctx');
    if (ctx && W.assessment) ctx.textContent = W.assessment.organization + ' · ' + W.assessment.name;
    var tools = document.querySelector('.c6-topbar__tools');
    if (tools && !document.getElementById('c6-mode')) {
      var b = document.createElement('span');
      b.id = 'c6-mode'; b.className = 'c6-badge';
      var demo = W.assessment && W.assessment.id === 'AS-DEMO';
      b.title = (W.mode === 'supabase' ? 'Supabase 模式' : '本機模式：資料只存在此瀏覽器') + (W.reason ? '。' + W.reason : '');
      b.innerHTML = (demo ? 'DEMO' : 'ORG') + '<span class="c6-topbar__demo-long">&nbsp;· ' + (W.mode === 'supabase' ? 'SUPABASE' : 'LOCAL') + '</span>';
      tools.appendChild(b);
    }
  }

  /* boot({ nav, group }, fn(W)) — shell, workspace, context, sub-nav, then the page. Errors are shown, not swallowed. */
  function boot(opts, fn) {
    C.ui.shell.init(opts.nav);
    if (opts.group) subnav(document.getElementById('c6-subnav'), GROUPS[opts.group], opts.nav);
    return C.services.workspace.init().then(function (W) { context(W); return fn(W); }).catch(function (err) {
      console.error(err);
      var m = document.getElementById('main');
      if (m) m.insertAdjacentHTML('afterbegin', '<div class="c6-alert" role="alert"><strong>無法載入資料：</strong>' + esc(err.message) + '</div>');
    });
  }


  /* Framework + record helpers shared by pages */
  function fwShort(id) { var f = (C.data.frameworks || []).filter(function (x) { return x.id === id; })[0]; return f ? f.short : id; }
  function fwOptions() { return C.data.frameworks.map(function (f) { return { value: f.id, label: f.short + ' · ' + f.name }; }); }
  function riskOptions(risks) { return risks.map(function (r) { return { value: r.id, label: r.id + ' · ' + r.scenario }; }); }
  /* 5×5 Likelihood / Impact options with the supplied level descriptors (5_5_各等級_L__I_的文字描述.pdf). */
  function liOptions(kind) { var K = kind === 'I' ? 'impact' : 'likelihood'; return C.data.riskCriteria.cat6[K].map(function (x) { return { value: x.v, label: kind + x.v + ' ' + x.en + ' ' + x.zh + ' — ' + x.text }; }); }
  function cisOptions() { return C.data.cis.controls.map(function (c) { return { value: c.id, label: c.id + ' ' + c.title + (c.zh ? '（' + c.zh + '）' : '') }; }); }
  function chips(list, tone) { return (list || []).length ? (list || []).map(function (x) { return chip(x, tone); }).join(' ') : '<span class="c6-muted">—</span>'; }
  /* Export toolbar markup: two buttons wired by the caller through data-export="csv|xlsx". */
  function exportButtons() { return '<button type="button" class="c6-btn c6-btn--ghost" data-export="csv">' + C.ui.icons.icon('download') + '匯出 CSV</button><button type="button" class="c6-btn c6-btn--ghost" data-export="xlsx">' + C.ui.icons.icon('download') + '匯出 XLSX</button>'; }
  function bindExport(root, fn) {
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-export]'); if (b) fn(b.getAttribute('data-export')); });
  }
  /* Generic provenance note for exported tables. */
  function exportNotes(rows) {
    var n = ['CAT.6 Cybersecurity export · ' + new Date().toISOString().slice(0, 10)];
    if ((rows || []).some(function (r) { return r.source === 'CAT6_DEFAULT'; })) n.push('This export contains CAT.6 default / assumed values (source = CAT6_DEFAULT). They are NOT organization data.');
    return n;
  }
  /* Card helper */
  function card(id, title, sub, body, o) {
    o = o || {};
    return '<section class="c6-card' + (o.span ? ' c6-span-' + o.span : '') + '"' + (id ? ' id="' + id + '"' : '') + ' aria-labelledby="' + (id || title) + '-h"><div class="c6-panel__head"><div><h2 class="c6-panel__title" id="' + (id || title) + '-h">' + title + '</h2>' + (sub ? '<p class="c6-panel__sub">' + sub + '</p>' : '') + '</div>' + (o.head || '') + '</div>' + body + '</section>';
  }

  C.ui.page = { liOptions: liOptions, fwShort: fwShort, fwOptions: fwOptions, riskOptions: riskOptions, cisOptions: cisOptions, chips: chips, exportButtons: exportButtons, bindExport: bindExport, exportNotes: exportNotes, card: card, boot: boot, sev: sev, score: score, level: level, dataRequired: dataRequired, chip: chip, prov: prov, notice: notice, subnav: subnav, kpi: kpi, GROUPS: GROUPS, NIST_NAME: NIST_NAME, esc: esc };
})(globalThis.CAT6);
