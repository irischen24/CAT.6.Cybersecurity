/* Dashboard — reads the current assessment from the workspace, calls the engines, hands results to charts.
 * No calculations inline beyond counting. Every KPI carries its provenance. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, RM = C.calc.riskMatrix, F = C.util.format, PV = C.util.provenance, esc = D.esc;
  var COLS = ['risks', 'treatments', 'cisControls', 'findings', 'capas', 'snapshots', 'activity', 'fairRuns', 'fairInputs', 'isoContext', 'isoClauses', 'isoSoa', 'evidence', 'audits', 'reviews', 'nist', 'cisram', 'csf'];
  function sev(band) { return '<span class="c6-sev c6-sev--' + band.id.toLowerCase() + '"><span class="c6-sev__shape" aria-hidden="true"></span>' + band.label + '</span>'; }
  function srcOf(rows) { var l = rows.map(function (r) { return r.source; }); return l.indexOf('CAT6_DEFAULT') >= 0 ? 'CAT6_DEFAULT' : l.indexOf('FILE_IMPORT') >= 0 ? 'FILE_IMPORT' : 'USER_INPUT'; }

  P.boot({ nav: 'dashboard' }, function () {
    var page = document.getElementById('page');
    page.innerHTML = '<section aria-labelledby="kpi-h"><h2 id="kpi-h" class="c6-sr-only">關鍵指標</h2><div class="c6-dash-kpis" id="kpis"></div></section>' +
      '<div class="c6-grid">' +
      P.card('bar', '風險情境分數（CAT.6 5×5）', 'Risk Score = Likelihood × Impact · 平台自定義準則，非 ISO 27001 指定公式', '<div id="bar-c"></div><p class="c6-chart-summary" id="bar-sum"></p>', { span: 2, head: '<span id="bar-prov"></span>' }) +
      P.card('trend', '風險趨勢', 'High + Critical 情境數 / 季（變更風險時更新本季快照）', '<div id="trend-c"></div><p class="c6-chart-summary" id="trend-sum"></p>', { head: '<span id="trend-prov"></span>' }) +
      P.card('matrix', '5×5 風險矩陣', '形狀 ● Low · ■ Medium · ▲ High · ◆ Critical', '<div id="matrix-c"></div><p class="c6-chart-summary" id="mx-sum"></p>') +
      P.card('top', 'Top Risk Scenarios', '依分數排序', '<ol class="c6-toplist" id="top-l"></ol>') +
      P.card('cov', 'Framework Coverage', '有使用該框架評估的情境比例', '<ul class="c6-cov" id="cov-l"></ul>', { head: '<span id="cov-prov"></span>' }) +
      P.card('src', 'Data Source Status 資料來源狀態', '目前評估所有紀錄的來源分布（筆數）', '<div class="c6-srcbar" id="srcbar" role="img"></div><ul class="c6-srclegend" id="srclegend"></ul>', { span: 2 }) +
      P.card('gauge', 'CAT.6 Readiness Indicator', 'ISO 27001 導入進度 · 非 ISO 官方評分', '<div id="gauge-c"></div><p class="c6-chart-summary" id="gauge-sum"></p>', { head: '<span id="iso-prov"></span>' }) +
      P.card('feed', '資料活動紀錄', '每筆紀錄標示資料來源', '<ul class="c6-feed" id="feed-l"></ul>') +
      P.card('status', 'Assessment Status', '風險情境狀態分布', '<ul class="c6-cov" id="status-l"></ul>') +
      P.card('fq', 'FAIR 量化', '最近一次蒙地卡羅模擬', '<div id="fairq"></div>', { head: '<span id="fq-prov"></span>' }) +
      '</div>';

    return W.load(COLS).then(function (d) {
      var risks = d.risks, scored = risks.filter(function (r) { return r.likelihood >= 1 && r.impact >= 1; }).map(function (r) { var a = RM.assess(r.likelihood, r.impact); return Object.assign({}, r, { score: a.score, band: a.band }); }).sort(function (a, b) { return b.score - a.score; });
      var counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }; scored.forEach(function (r) { counts[r.band.id]++; });
      P.notice(document.getElementById('c6-notice'), W.usesDefaults(d), { edit: 'risk-assessment.html#setup', dataset: 'risks' });

      var target = (W.assessment.targetIG || 'IG1').toLowerCase(), cov = C.calc.cisControls.coverageByIG(d.cisControls)[target];
      var openF = d.findings.filter(function (f) { return f.status !== 'Closed'; });
      var R = C.calc.isoReadiness.compute({ context: d.isoContext[0], clauses: d.isoClauses, soa: d.isoSoa, risks: risks, treatments: d.treatments, evidence: d.evidence, audits: d.audits, findings: d.findings, capas: d.capas, reviews: d.reviews });
      var tsum = C.calc.treatment.summary(d.treatments);
      var kpis = [
        { label: 'Critical Risks', value: counts.CRITICAL, meta: '分數 17–25', src: 'CALCULATED', featured: true, href: 'risk-register.html' },
        { label: 'High Risks', value: counts.HIGH, meta: '分數 10–16', src: 'CALCULATED', href: 'risk-register.html' },
        { label: 'Active Assessments', value: risks.filter(function (r) { return r.status === 'Draft' || r.status === 'In review'; }).length, meta: '草稿 + 審閱中 · 逾期處理 ' + tsum.OVERDUE, src: risks.length ? srcOf(risks) : 'USER_INPUT', href: 'risk-treatment.html?view=OVERDUE' },
        cov.coverage == null ? { label: 'Control Coverage', empty: 'DATA REQUIRED', meta: '尚未評估 CIS Controls ' + target.toUpperCase(), href: 'cis-controls.html' }
          : { label: 'Control Coverage', value: F.pct(cov.coverage), meta: 'CIS ' + target.toUpperCase() + ' 已實施 ' + cov.counts.IMPLEMENTED + ' / ' + cov.assessed, src: 'CALCULATED', href: 'cis-controls.html' },
        { label: 'Open Findings', value: openF.length, meta: openF.filter(function (f) { return f.type === 'MAJOR_NC' || f.type === 'MINOR_NC'; }).length + ' 不符合 · ' + openF.filter(function (f) { return f.type === 'OFI' || f.type === 'OBSERVATION'; }).length + ' 改善機會', src: d.findings.length ? srcOf(d.findings) : 'USER_INPUT', href: 'iso-audit.html#findings' },
        R.overall == null ? { label: 'CAT.6 Readiness Indicator', empty: 'DATA REQUIRED', meta: 'ISO 資料不足', href: 'iso-readiness.html' }
          : { label: 'CAT.6 Readiness Indicator', value: F.pct(R.overall), meta: R.basedOn + ' / ' + R.of + ' 面向 · 非 ISO 分數', src: 'CALCULATED', href: 'iso-readiness.html' }
      ];
      document.getElementById('kpis').innerHTML = kpis.map(P.kpi).join('');

      if (!scored.length) {
        ['bar-c', 'matrix-c'].forEach(function (id) { document.getElementById(id).innerHTML = '<div class="c6-empty">尚無已評分的風險情境。<a class="c6-link" href="risk-register.html">新增風險</a> 或 <a class="c6-link" href="data-import.html?ds=risks">匯入</a>。</div>'; });
        document.getElementById('top-l').innerHTML = '<li class="c6-muted">尚無資料</li>';
      } else {
        C.charts.bar.render(document.getElementById('bar-c'), scored.map(function (r) {
          return { label: r.id, value: r.score, tip: '<strong>' + esc(r.id) + '</strong> ' + esc(r.scenario) + '<br>L ' + r.likelihood + ' × I ' + r.impact + ' = ' + r.score + '（' + r.band.label + '）' };
        }), { label: '各風險情境的 5×5 分數', max: 25, height: 260, guides: [{ at: 16.5, label: 'Critical ≥17' }, { at: 9.5, label: 'High ≥10' }, { at: 4.5, label: 'Medium ≥5' }] });
        document.getElementById('bar-sum').textContent = '最高分為 ' + scored[0].id + '（' + scored[0].score + '，' + scored[0].band.label + '）。共 ' + counts.CRITICAL + ' 個 Critical、' + counts.HIGH + ' 個 High、' + counts.MEDIUM + ' 個 Medium、' + counts.LOW + ' 個 Low' + (risks.length > scored.length ? '；' + (risks.length - scored.length) + ' 個缺少 L / I（DATA REQUIRED）' : '') + '。';
        C.charts.riskMatrix.render(document.getElementById('matrix-c'), scored.map(function (r) { return { id: r.id, name: r.scenario, likelihood: { value: r.likelihood }, impact: { value: r.impact } }; }));
        document.getElementById('mx-sum').textContent = scored.map(function (r) { return r.id + '：L' + r.likelihood + '×I' + r.impact + ' ' + r.band.label; }).join('，') + '。';
        document.getElementById('top-l').innerHTML = scored.slice(0, 5).map(function (r, i) {
          return '<li class="c6-toplist__item"><span class="c6-toplist__rank">' + String(i + 1).padStart(2, '0') + '</span><div style="min-width:0"><p class="c6-toplist__name" title="' + esc(r.scenario) + '"><a class="c6-link" href="risk-register.html?id=' + encodeURIComponent(r.id) + '">' + esc(r.scenario) + '</a></p><span class="c6-toplist__meta">' + esc(r.id) + ' · 分數 ' + r.score + '</span></div>' + sev(r.band) + '</li>';
        }).join('');
      }
      document.getElementById('bar-prov').innerHTML = PV.badge('CALCULATED');

      var snaps = d.snapshots.slice().sort(function (a, b) { return a.id.localeCompare(b.id); }).slice(-6);
      if (snaps.length >= 2) {
        C.charts.line.render(document.getElementById('trend-c'), { labels: snaps.map(function (s) { return s.label; }), values: snaps.map(function (s) { return s.highCritical; }) }, { label: '風險趨勢', seriesName: 'High + Critical', height: 210 });
        document.getElementById('trend-sum').textContent = snaps.map(function (s) { return s.label + ' ' + s.highCritical + (s.source === 'CAT6_DEFAULT' ? '（示範）' : ''); }).join('，') + '。';
      } else document.getElementById('trend-c').innerHTML = '<div class="c6-empty">至少需要兩季快照才能顯示趨勢。</div>';
      document.getElementById('trend-prov').innerHTML = snaps.length ? PV.badge(srcOf(snaps)) : '';

      var fwCount = {}; risks.forEach(function (r) { (r.frameworks || []).forEach(function (f) { fwCount[f] = (fwCount[f] || 0) + 1; }); });
      document.getElementById('cov-l').innerHTML = C.data.frameworks.map(function (f) {
        var ratio = risks.length ? (fwCount[f.id] || 0) / risks.length : 0;
        return '<li class="c6-cov__row"><span>' + f.short + '</span><span class="c6-cov__track" role="img" aria-label="' + f.name + ' ' + F.pct(ratio) + '"><span class="c6-cov__fill" style="display:block;width:' + (ratio * 100) + '%"></span></span><span class="c6-cov__pct">' + F.pct(ratio) + '</span></li>';
      }).join('');
      document.getElementById('cov-prov').innerHTML = PV.badge('CALCULATED');

      var values = []; Object.keys(d).forEach(function (k) { if (k === 'activity' || k === 'snapshots') return; d[k].forEach(function (r) { if (r.fields) r.fields.forEach(function (f) { values.push({ source: f.source }); }); else values.push({ source: r.source }); }); });
      scored.forEach(function () { values.push({ source: 'CALCULATED' }); });
      var tally = PV.tally(values), total = values.length || 1, bar = document.getElementById('srcbar');
      bar.setAttribute('aria-label', Object.keys(tally).map(function (k) { return PV.SOURCES[k].label + ' ' + tally[k]; }).join('，'));
      bar.innerHTML = Object.keys(tally).map(function (k) { return tally[k] ? '<span class="c6-srcbar__seg c6-srcbar__seg--' + k.toLowerCase() + '" style="width:' + (tally[k] / total * 100) + '%"></span>' : ''; }).join('');
      document.getElementById('srclegend').innerHTML = Object.keys(tally).map(function (k) { return '<li class="c6-srclegend__item">' + PV.badge(k) + '<span class="c6-srclegend__n">' + tally[k] + '</span><span>' + PV.SOURCES[k].label + ' · ' + F.pct(tally[k] / total) + '</span></li>'; }).join('');

      if (R.overall == null) document.getElementById('gauge-c').innerHTML = '<div class="c6-empty">' + P.dataRequired() + '</div>';
      else C.charts.gauge.render(document.getElementById('gauge-c'), R.overall, { label: 'CAT.6 Readiness Indicator', caption: R.basedOn + ' / ' + R.of + ' 面向' });
      document.getElementById('gauge-sum').innerHTML = esc(C.calc.isoReadiness.disclaimer) + ' <a class="c6-link" href="iso-readiness.html">查看細項</a>';
      document.getElementById('iso-prov').innerHTML = PV.badge('CALCULATED');

      var acts = d.activity.slice().sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); }).slice(0, 6);
      document.getElementById('feed-l').innerHTML = acts.length ? acts.map(function (a) {
        return '<li class="c6-feed__item"><span class="c6-feed__avatar" aria-hidden="true">' + PV.SOURCES[a.source || 'USER_INPUT'].icon + '</span><div><p class="c6-feed__who">' + esc(a.who) + ' · ' + esc((a.at || '').slice(0, 16).replace('T', ' ')) + '</p><p class="c6-feed__what">' + esc(a.what) + '</p>' + PV.badge(a.source || 'USER_INPUT') + '</div></li>';
      }).join('') : '<li class="c6-muted">尚無活動</li>';

      var st = {}; risks.forEach(function (r) { st[r.status || 'Draft'] = (st[r.status || 'Draft'] || 0) + 1; });
      document.getElementById('status-l').innerHTML = ['Draft', 'In review', 'Assessed', 'Treatment planned', 'Closed'].map(function (k) {
        var n = st[k] || 0; return '<li class="c6-cov__row"><span>' + k + '</span><span class="c6-cov__track" role="img" aria-label="' + k + ' ' + n + '"><span class="c6-cov__fill" style="display:block;width:' + (risks.length ? n / risks.length * 100 : 0) + '%"></span></span><span class="c6-cov__pct">' + n + '</span></li>';
      }).join('');

      var run = d.fairRuns.slice().sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); })[0], fq = document.getElementById('fairq');
      if (run) {
        fq.innerHTML = '<p class="c6-kpi__value" style="margin:0">' + F.currency(run.summaries.AnnualRisk.Mean, 'TWD', { compact: true }) + '<span style="font-size:.875rem;color:var(--c6-fg-muted);font-weight:400"> / 年（Mean ALE）</span></p>' +
          '<p class="c6-panel__sub" style="margin:.5rem 0 1rem">' + esc(run.riskId || '') + ' · P90 ' + F.currency(run.summaries.AnnualRisk.P90, 'TWD', { compact: true }) + ' · ' + F.num(run.iterations) + ' 次 · seed ' + run.seed + (run.defaultsUsed ? ' · 含 CAT.6 預設值' : '') + '</p><a class="c6-btn c6-btn--secondary" href="fair-analysis.html">開啟 FAIR Analysis</a>';
      } else {
        var inp = {}; ((d.fairInputs[0] && d.fairInputs[0].fields) || C.data.fairDefaults.fields).forEach(function (f) { inp[f.field] = f.value; });
        var pe = C.calc.fair.pointEstimate(inp);
        fq.innerHTML = '<p class="c6-kpi__value" style="margin:0">' + F.currency(pe.AnnualRisk, 'TWD', { compact: true }) + '<span style="font-size:.875rem;color:var(--c6-fg-muted);font-weight:400"> / 年（點估計）</span></p><p class="c6-panel__sub" style="margin:.5rem 0 1rem">尚未執行模擬。點估計會低估尾端風險，請執行蒙地卡羅模擬查看 P90 / P95。</p><a class="c6-btn c6-btn--primary" href="fair-analysis.html">Run Monte Carlo Simulation</a>';
      }
      document.getElementById('fq-prov').innerHTML = PV.badge('CALCULATED');
      page.removeAttribute('aria-busy');
    });
  });
})(globalThis.CAT6);
