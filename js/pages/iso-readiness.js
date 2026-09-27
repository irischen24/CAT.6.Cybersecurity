/* ISO/IEC 27001 Certification Readiness (Workflow 02).
 * CAT.6 is NOT a certification body. The overall figure is the "CAT.6 Readiness Indicator" — a transparent,
 * unweighted mean of area completion ratios — never an ISO score or a prediction of certification. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, E = C.calc.isoReadiness, F = C.util.format, esc = D.esc, ISO = C.data.iso;
  var CTX = [
    { key: 'issuesInternal', label: '內部議題（4.1）', type: 'textarea' }, { key: 'issuesExternal', label: '外部議題（4.1）', type: 'textarea' },
    { key: 'interestedParties', label: '利害關係者（4.2）', type: 'textarea' }, { key: 'requirements', label: '利害關係者要求（4.2）', type: 'textarea' },
    { key: 'scopeStatement', label: 'ISMS 範圍聲明（4.3）', type: 'textarea' }, { key: 'boundaries', label: '範圍邊界', type: 'textarea' },
    { key: 'interfaces', label: '介面與相依性', type: 'textarea' }, { key: 'exclusions', label: '排除項目與理由', type: 'textarea', help: '選填；不列入完成度計算' }
  ];
  var TASK = [{ value: 'NOT_STARTED', label: '○ 未開始' }, { value: 'IN_PROGRESS', label: '◐ 進行中' }, { value: 'DONE', label: '● 完成' }];
  function mark(v) {
    if (v == null) return '<span class="c6-st c6-st--dr"><span class="c6-st__g" aria-hidden="true">?</span>DATA REQUIRED</span>';
    if (v >= 1) return '<span class="c6-st c6-st--done"><span class="c6-st__g" aria-hidden="true">●</span>完成</span>';
    if (v > 0) return '<span class="c6-st c6-st--partial"><span class="c6-st__g" aria-hidden="true">◐</span>' + F.pct(v) + '</span>';
    return '<span class="c6-st c6-st--todo"><span class="c6-st__g" aria-hidden="true">○</span>未開始</span>';
  }
  function autoValue(key, R, d) { return C.calc.isoReadiness.autoValue(key, R, d); }

  P.boot({ nav: 'iso', group: 'iso' }, function () {
    var page = document.getElementById('page'), d;
    page.innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">ISO/IEC 27001 Certification Readiness</h2><p class="c6-intro__text">CAT.6 協助組織檢視 ISMS 導入進度與驗證準備度（Readiness Assessment）。<strong>CAT.6 不是驗證機構</strong>，不核發證書，也不預測驗證結果；正式驗證須由經認證之驗證機構執行。</p></div>' +
      '<div class="c6-grid">' +
      P.card('ind', 'CAT.6 Readiness Indicator', '非 ISO 官方評分 · 等權平均', '<div id="gauge"></div><p class="c6-chart-summary" id="g-s"></p>') +
      P.card('areas', 'Readiness by Area', '各面向完成比例（無資料 = DATA REQUIRED，不計入）', '<div id="area-c"></div><p class="c6-chart-summary" id="area-s"></p>', { span: 2 }) + '</div>' +
      '<div class="c6-callout" id="disc"></div>' +
      P.card('roadmap', 'Certification Readiness Roadmap', '四階段 · 自動項目由模組資料推導，手動項目可直接更新', '<div class="c6-roadmap" id="rm"></div>') +
      P.card('wf2', 'Workflow 02 · ISO 27001 Certification Readiness', '每一步連到對應功能；狀態由資料推導', '<ol class="c6-pipe" id="pipe2"></ol>') +
      P.card('context', 'Organization Context & ISMS Scope', 'Clause 4.1 – 4.3', '<div id="ctx-b"></div>');

    function load() {
      return W.load(['isoContext', 'isoClauses', 'isoSoa', 'isoTasks', 'risks', 'treatments', 'evidence', 'audits', 'findings', 'capas', 'reviews']).then(function (x) {
        d = { ctx: x.isoContext[0] || { id: 'ctx' }, clauses: x.isoClauses, soa: x.isoSoa, tasks: x.isoTasks, risks: x.risks, treatments: x.treatments, evidence: x.evidence, audits: x.audits, findings: x.findings, capas: x.capas, reviews: x.reviews, raw: x };
        P.notice(document.getElementById('c6-notice'), W.usesDefaults({ a: x.isoContext, b: x.isoClauses, c: x.isoSoa, e: x.evidence, f: x.audits }), { edit: '#context', dataset: 'isoClauses' });
        var R = E.compute({ context: d.ctx, clauses: d.clauses, soa: d.soa, risks: d.risks, treatments: d.treatments, evidence: d.evidence, audits: d.audits, findings: d.findings, capas: d.capas, reviews: d.reviews });
        d.R = R;
        if (R.overall == null) document.getElementById('gauge').innerHTML = '<div class="c6-empty">' + P.dataRequired('所有面向皆無資料') + '</div>';
        else C.charts.gauge.render(document.getElementById('gauge'), R.overall, { label: 'CAT.6 Readiness Indicator', caption: 'CAT.6 Readiness Indicator' });
        document.getElementById('g-s').innerHTML = R.overall == null ? '尚無足夠資料。' : '依據 ' + R.basedOn + ' / ' + R.of + ' 個有資料之面向計算，等權平均為 ' + F.pct(R.overall) + '。' + P.prov('CALCULATED');
        var keys = Object.keys(R.areas);
        C.charts.hbars.bars(document.getElementById('area-c'), keys.map(function (k) { var a = R.areas[k]; return { label: E.LABELS[k], value: a.value, text: a.value == null ? null : F.pct(a.value), tip: E.LABELS[k] + '：' + a.detail + ' ' + a.done + ' / ' + a.total }; }), { label: 'ISO readiness 各面向' });
        document.getElementById('area-s').textContent = keys.map(function (k) { var a = R.areas[k]; return E.LABELS[k] + ' ' + (a.value == null ? 'DATA REQUIRED（' + a.detail + '）' : F.pct(a.value) + '（' + a.detail + ' ' + a.done + '/' + a.total + '）'); }).join('；') + '。';
        document.getElementById('disc').innerHTML = '<strong>' + E.label + '</strong>：' + esc(E.disclaimer) + ' 計算方式：Scope = 全景欄位填寫比例；Gap = 已評估條款 / 25；Risk Assessment = 已有 L×I 的風險比例；Treatment = 已有處理計畫或接受決策比例；Controls = SoA 適用控制中已實施比例；Evidence = 已接受證據比例；Audit = 已完成稽核比例；Review = 最近一次管理審查涵蓋之 9.3.2 輸入（a–g）比例；CAPA = 已結案矯正措施比例。';
        renderRoadmap(R); renderPipe(R); renderContext();
      });
    }
    function taskStatus(id) { var t = d.tasks.filter(function (x) { return x.id === id; })[0]; return t ? t.status : 'NOT_STARTED'; }
    function renderRoadmap(R) {
      document.getElementById('rm').innerHTML = ISO.roadmap.map(function (s) {
        var vals = s.items.map(function (it) { return it.auto ? autoValue(it.auto, R, d) : ({ NOT_STARTED: 0, IN_PROGRESS: 0.5, DONE: 1 })[taskStatus(it.id)]; }), have = vals.filter(function (v) { return v != null; });
        var pct = have.length ? have.reduce(function (a, b) { return a + b; }, 0) / have.length : null;
        return '<section class="c6-stage" aria-labelledby="st' + s.id + '"><span class="c6-stage__n">STAGE 0' + s.id + '</span><h3 class="c6-stage__title" id="st' + s.id + '">' + esc(s.en) + '</h3><p class="c6-note">' + esc(s.zh) + '</p>' +
          '<div class="c6-mini"><span class="c6-mini__track" role="img" aria-label="Stage ' + s.id + ' 完成 ' + (pct == null ? 'DATA REQUIRED' : F.pct(pct)) + '"><span class="c6-mini__fill" style="width:' + ((pct || 0) * 100) + '%"></span></span><span>' + (pct == null ? '—' : F.pct(pct)) + '</span></div>' +
          '<ul class="c6-stage__list">' + s.items.map(function (it, i) {
            var name = it.href ? '<a href="' + it.href + '">' + esc(it.en) + '</a>' : esc(it.en);
            var ctl = it.auto ? mark(vals[i]) : '<label><span class="c6-sr-only">' + esc(it.en) + ' 狀態</span><select class="c6-input c6-inline-select" data-task="' + it.id + '">' + TASK.map(function (o) { return '<option value="' + o.value + '"' + (taskStatus(it.id) === o.value ? ' selected' : '') + '>' + o.label + '</option>'; }).join('') + '</select></label>';
            return '<li class="c6-stage__item"><span class="c6-stage__mark" aria-hidden="true">' + (it.auto ? '∑' : '✎') + '</span><span>' + name + '<br><span class="c6-muted">' + esc(it.zh) + (it.auto ? ' · 自動' : ' · 手動') + '</span></span>' + ctl + '</li>';
          }).join('') + '</ul></section>';
      }).join('');
    }
    document.getElementById('rm').addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-task'); if (!id) return;
      var prev = d.tasks.filter(function (x) { return x.id === id; })[0] || { id: id };
      W.save('isoTasks', Object.assign({}, prev, { status: e.target.value })).then(function () { D.toast('已更新路線圖項目'); return load(); }).then(function () { var s = document.querySelector('[data-task="' + id + '"]'); if (s) s.focus(); });
    });
    function renderPipe(R) {
      var A = R.areas, steps = [
        ['Organization Data', 'data-import.html', W.assessment ? 1 : 0, '組織資料來源：' + (W.assessment.dataSource || '')],
        ['Validation', 'data-import.html', d.raw.isoClauses.length ? 1 : 0, 'Import Center 逐列驗證'],
        ['Organization Context', 'iso-readiness.html#context', A.scope.value], ['ISMS Scope', 'iso-readiness.html#context', autoValue('scope', R, d)],
        ['Gap Assessment', 'iso-gap.html', A.gap.value], ['Risk Assessment', 'risk-assessment.html', A.riskAssessment.value], ['Risk Register', 'risk-register.html', d.risks.length ? 1 : 0],
        ['Risk Treatment', 'risk-treatment.html', A.riskTreatment.value], ['Control Implementation', 'iso-gap.html#soa', A.controls.value], ['Statement of Applicability', 'iso-gap.html#soa', R.soaDecided / ISO.annexA.length],
        ['Evidence Management', 'evidence.html', A.evidence.value], ['Internal Audit', 'iso-audit.html', A.audit.value], ['Findings', 'iso-audit.html#findings', autoValue('findings', R, d)],
        ['Corrective Action', 'iso-audit.html#capa', A.capa.value], ['Management Review', 'iso-audit.html#review', A.review.value], ['Continual Improvement', 'iso-audit.html#capa', ({ NOT_STARTED: 0, IN_PROGRESS: 0.5, DONE: 1 })[taskStatus('ci')]],
        ['Certification Readiness', 'iso-readiness.html#ind', R.overall], ['Readiness Dashboard', 'iso-readiness.html#areas', R.overall == null ? null : 1], ['Report', 'reports.html?type=iso-readiness', 1], ['PDF / CSV / XLSX Export', 'reports.html?type=iso-readiness', 1]
      ];
      document.getElementById('pipe2').innerHTML = steps.map(function (s) {
        var v = s[2], state = v == null ? '' : v >= 1 ? 'done' : v > 0 ? 'partial' : '';
        return '<li><a class="c6-pipe__step" href="' + s[1] + '" data-state="' + state + '"><strong>' + esc(s[0]) + '</strong><span>' + (v == null ? 'DATA REQUIRED' : state === 'done' ? '完成' : state === 'partial' ? '進行中 ' + F.pct(v) : '未開始') + (s[3] ? ' · ' + esc(s[3]) : '') + '</span></a></li>';
      }).join('');
    }
    function renderContext() {
      var c = d.ctx;
      document.getElementById('ctx-b').innerHTML = '<div class="c6-stack"><dl class="c6-kv">' + CTX.map(function (f) { return '<dt>' + esc(f.label) + '</dt><dd>' + (c[f.key] ? esc(c[f.key]) : (f.key === 'exclusions' ? '<span class="c6-muted">—</span>' : P.dataRequired())) + '</dd>'; }).join('') +
        '<dt>來源</dt><dd>' + P.prov(c.source || 'USER_INPUT') + '</dd></dl><div class="c6-actions"><button type="button" class="c6-btn c6-btn--primary" id="ctx-edit">' + C.ui.icons.icon('edit') + '編輯組織全景與範圍</button><a class="c6-btn c6-btn--ghost" href="reports.html?type=iso-readiness">產生 Readiness 報告</a></div></div>';
      document.getElementById('ctx-edit').addEventListener('click', function () {
        C.ui.form.open({ title: 'Organization Context & ISMS Scope', subtitle: '儲存後來源為 USER_INPUT', fields: CTX, values: c }).then(function (v) {
          if (v) return W.save('isoContext', Object.assign({ id: 'ctx' }, c, v)).then(function () { D.toast('已更新組織全景'); return load(); });
        });
      });
    }
    return load().then(function () { page.removeAttribute('aria-busy'); if (location.hash) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); } });
  });
})(globalThis.CAT6);
