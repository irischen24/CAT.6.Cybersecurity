/* Dashboard page controller: reads data → calls engines → hands results to charts. No calculations inline. */
(function (C) {
  C.ui.shell.init('dashboard');
  var D = C.data.demo, RM = C.calc.riskMatrix, F = C.util.format, P = C.util.provenance, I = C.ui.icons;
  var fwById = {}; C.data.frameworks.forEach(function (f) { fwById[f.id] = f; });

  /* ---- Derived (CALCULATED) data ---- */
  var scored = D.register.map(function (r) {
    var a = RM.assess(r.likelihood.value, r.impact.value);
    return Object.assign({}, r, { score: a.score, band: a.band });
  }).sort(function (a, b) { return b.score - a.score; });
  var counts = RM.countByLevel(D.register);
  var tasks = [].concat.apply([], C.data.isoRoadmap.stages.map(function (s) { return s.tasks; }));
  var done = tasks.filter(function (t) { return t[1]; }).length;

  function sev(band) { return '<span class="c6-sev c6-sev--' + band.id.toLowerCase() + '"><span class="c6-sev__shape" aria-hidden="true"></span>' + band.label + '</span>'; }

  /* ---- KPI cards ---- */
  var kpis = [
    { label: 'Critical Risks', value: counts.CRITICAL, meta: '分數 17–25', src: 'CALCULATED', featured: true, href: '#matrix' },
    { label: 'High Risks', value: counts.HIGH, meta: '分數 10–16', src: 'CALCULATED', href: '#matrix' },
    { label: 'Active Assessments', value: D.register.filter(function (r) { return r.status !== 'Assessed'; }).length, meta: '草稿 + 審閱中', src: 'CAT6_DEFAULT', href: '#status' },
    { label: 'Control Coverage', empty: 'DATA REQUIRED', meta: '需匯入 CIS Safeguards 實施狀態', src: 'USER_INPUT' },
    { label: 'Open Findings', empty: 'DATA REQUIRED', meta: '需內部稽核紀錄', src: 'USER_INPUT' },
    { label: 'ISMS 任務完成', value: F.pct(done / tasks.length), meta: done + ' / ' + tasks.length + ' 任務', src: 'CAT6_DEFAULT', href: '#gauge' }
  ];
  document.getElementById('kpis').innerHTML = kpis.map(function (k) {
    return '<article class="c6-kpi' + (k.featured ? ' c6-kpi--featured' : '') + '">' +
      '<h3 class="c6-kpi__label">' + k.label + '</h3>' +
      (k.empty ? '<p class="c6-kpi__value c6-kpi__value--empty">' + k.empty + '</p>' : '<p class="c6-kpi__value">' + k.value + '</p>') +
      '<p class="c6-kpi__meta">' + (k.empty ? '<span>' + k.meta + '</span>' : P.badge(k.src) + '<span>' + k.meta + '</span>') + '</p>' +
      (k.href ? '<a class="c6-kpi__go" href="' + k.href + '" aria-label="查看 ' + k.label + '">' + I.icon('arrow') + '</a>' : '') +
      '</article>';
  }).join('');

  /* ---- Bar: scores by scenario ---- */
  C.charts.bar.render(document.getElementById('bar'), scored.map(function (r) {
    return { label: r.id, value: r.score, tip: '<strong>' + r.id + '</strong> ' + r.name + '<br>L ' + r.likelihood.value + ' × I ' + r.impact.value + ' = ' + r.score + '（' + r.band.label + '）' };
  }), { label: '各風險情境的 5×5 分數', max: 25, height: 260, guides: [{ at: 16.5, label: 'Critical ≥17' }, { at: 9.5, label: 'High ≥10' }, { at: 4.5, label: 'Medium ≥5' }] });
  document.getElementById('bar-prov').innerHTML = P.badge('CALCULATED');
  document.getElementById('bar-sum').textContent = '最高分為 ' + scored[0].id + '（' + scored[0].score + '，' + scored[0].band.label + '）。共 ' + counts.CRITICAL + ' 個 Critical、' + counts.HIGH + ' 個 High、' + counts.MEDIUM + ' 個 Medium、' + counts.LOW + ' 個 Low。';

  /* ---- Trend ---- */
  C.charts.line.render(document.getElementById('trend'), D.trend, { label: '風險趨勢', seriesName: 'High + Critical', height: 210 });
  document.getElementById('trend-prov').innerHTML = P.badge('CAT6_DEFAULT');
  document.getElementById('trend-sum').textContent = '示範快照：' + D.trend.labels.map(function (l, i) { return l + ' ' + D.trend.values[i]; }).join('，') + '。';

  /* ---- Matrix + top list ---- */
  C.charts.riskMatrix.render(document.getElementById('matrix'), D.register);
  document.getElementById('top').innerHTML = scored.slice(0, 5).map(function (r, i) {
    return '<li class="c6-toplist__item"><span class="c6-toplist__rank">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<div style="min-width:0"><p class="c6-toplist__name" title="' + r.name + '">' + r.name + '</p><span class="c6-toplist__meta">' + r.id + ' · 分數 ' + r.score + '</span></div>' + sev(r.band) + '</li>';
  }).join('');

  /* ---- Framework coverage ---- */
  var fwCount = {}; D.register.forEach(function (r) { r.frameworks.forEach(function (f) { fwCount[f] = (fwCount[f] || 0) + 1; }); });
  document.getElementById('cov').innerHTML = C.data.frameworks.map(function (f) {
    var ratio = (fwCount[f.id] || 0) / D.register.length;
    return '<li class="c6-cov__row"><span>' + f.short + '</span><span class="c6-cov__track" role="img" aria-label="' + f.name + ' ' + F.pct(ratio) + '"><span class="c6-cov__fill" style="display:block;width:' + (ratio * 100) + '%"></span></span><span class="c6-cov__pct">' + F.pct(ratio) + '</span></li>';
  }).join('');
  document.getElementById('cov-prov').innerHTML = P.badge('CALCULATED');

  /* ---- Data source status ---- */
  var values = [];
  D.register.forEach(function (r) { values.push(r.likelihood, r.impact, { source: 'CALCULATED' }); });
  C.data.fairDefaults.fields.forEach(function (f) { values.push({ source: f.source }); });
  tasks.forEach(function () { values.push({ source: C.data.isoRoadmap.source }); });
  var tally = P.tally(values), total = values.length;
  var srcbar = document.getElementById('srcbar');
  srcbar.setAttribute('aria-label', Object.keys(tally).map(function (k) { return P.SOURCES[k].label + ' ' + tally[k]; }).join('，'));
  srcbar.innerHTML = Object.keys(tally).map(function (k) { return tally[k] ? '<span class="c6-srcbar__seg c6-srcbar__seg--' + k.toLowerCase() + '" style="width:' + (tally[k] / total * 100) + '%"></span>' : ''; }).join('');
  document.getElementById('srclegend').innerHTML = Object.keys(tally).map(function (k) {
    return '<li class="c6-srclegend__item">' + P.badge(k) + '<span class="c6-srclegend__n">' + tally[k] + '</span><span>' + P.SOURCES[k].label + ' · ' + F.pct(tally[k] / total) + '</span></li>';
  }).join('');

  /* ---- ISMS gauge ---- */
  C.charts.gauge.render(document.getElementById('gauge'), done / tasks.length, { label: 'ISMS 任務完成率', caption: done + ' / ' + tasks.length + ' 任務' });
  document.getElementById('iso-prov').innerHTML = P.badge('CAT6_DEFAULT');

  /* ---- Feed ---- */
  document.getElementById('feed').innerHTML = D.activity.map(function (a) {
    return '<li class="c6-feed__item"><span class="c6-feed__avatar" aria-hidden="true">' + P.SOURCES[a.source].icon + '</span><div>' +
      '<p class="c6-feed__who">' + a.who + '</p><p class="c6-feed__what">' + a.what + '</p>' +
      (a.pending ? '<span class="c6-badge">待提供</span>' : P.badge(a.source)) + '</div></li>';
  }).join('');

  /* ---- Assessment status ---- */
  var st = {}; D.register.forEach(function (r) { st[r.status] = (st[r.status] || 0) + 1; });
  document.getElementById('status').innerHTML = ['Draft', 'In review', 'Assessed'].map(function (k) {
    var n = st[k] || 0;
    return '<li class="c6-cov__row"><span>' + k + '</span><span class="c6-cov__track"><span class="c6-cov__fill" style="display:block;width:' + (n / D.register.length * 100) + '%"></span></span><span class="c6-cov__pct">' + n + '</span></li>';
  }).join('');

  /* ---- FAIR quick card (deterministic point estimate for traceability) ---- */
  var inputs = {}; C.data.fairDefaults.fields.forEach(function (f) { inputs[f.field] = f.value; });
  var pe = C.calc.fair.pointEstimate(inputs);
  document.getElementById('fq-prov').innerHTML = P.badge('CALCULATED');
  document.getElementById('fairq').innerHTML =
    '<p class="c6-kpi__value" style="margin:0">' + F.currency(pe.AnnualRisk, 'TWD', { compact: true }) + '<span style="font-size:.875rem;color:var(--c6-fg-muted);font-weight:400"> / 年</span></p>' +
    '<p class="c6-panel__sub" style="margin:.5rem 0 1rem">LEF ' + pe.LEF.toFixed(2) + ' 次/年 × LM ' + F.currency(pe.LM, 'TWD', { compact: true }) + '。點估計會低估尾端風險，請執行蒙地卡羅模擬查看 P90 / P95。</p>' +
    '<a class="c6-btn c6-btn--primary" href="fair-analysis.html">Run Monte Carlo Simulation</a>';
})(globalThis.CAT6);
