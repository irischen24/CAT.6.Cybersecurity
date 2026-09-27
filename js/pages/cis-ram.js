/* CIS RAM worksheet — Inherent (before) and Residual (after) risk per scenario, safeguard assessment and acceptability.
 * Scores use the CAT.6 5×5 platform criteria (the only scoring criteria supplied). CAT.6 does NOT reproduce or invent the
 * CIS RAM official scoring formula. Acceptability: residual ≤ threshold (organization value, else CAT.6 default 9 from CIS_RAM_可接受風險門檻.pdf). */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, E = C.calc.cisRam, esc = D.esc;
  var FIELDS = function (risks) {
    return [
      { key: 'riskId', label: 'Risk Scenario（登錄表）', type: 'select', options: P.riskOptions(risks), full: true },
      { key: 'scenario', label: 'Risk Scenario 風險情境', type: 'text', required: true, full: true },
      { key: 'asset', label: 'Asset 資產', type: 'text', required: true }, { key: 'threat', label: 'Threat 威脅', type: 'text' },
      { key: 'vulnerability', label: 'Vulnerability 弱點', type: 'text' }, { key: 'impact', label: 'Impact 衝擊描述', type: 'text' },
      { key: 'safeguards', label: 'Existing Safeguards（CIS Controls）', type: 'multi', options: P.cisOptions(), filter: true },
      { key: 'inherentLikelihood', label: 'Inherent Likelihood（處理前）', type: 'int', options: P.liOptions('L'), full: true, required: true, help: 'CAT.6 5×5 平台準則' },
      { key: 'inherentImpact', label: 'Inherent Impact（處理前）', type: 'int', options: P.liOptions('I'), full: true, required: true },
      { key: 'safeguardAssessment', label: 'Safeguard Assessment 保護措施評估', type: 'textarea', full: true },
      { key: 'residualLikelihood', label: 'Residual Likelihood（處理後）', type: 'int', options: P.liOptions('L'), full: true },
      { key: 'residualImpact', label: 'Residual Impact（處理後）', type: 'int', options: P.liOptions('I'), full: true },
      { key: 'recommended', label: 'Recommended Safeguards 建議措施', type: 'textarea', full: true }
    ];
  };
  function accChip(a) {
    if (a.id === 'ACCEPTABLE') return '<span class="c6-st c6-st--done"><span class="c6-st__g" aria-hidden="true">✓</span>Accept（符合接受準則）</span>';
    if (a.id === 'NOT_ACCEPTABLE') return '<span class="c6-st c6-st--todo"><span class="c6-st__g" aria-hidden="true">✕</span>Treatment Required（不符合接受準則）</span>';
    return P.dataRequired(a.why);
  }

  P.boot({ nav: 'cisram', group: 'assessment' }, function (Wk) {
    var page = document.getElementById('page'), tbl, data;
    page.innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">CIS RAM Risk Register</h2><p class="c6-intro__text">Risk Scenario → Asset / Threat / Vulnerability → Impact → Existing Safeguards → Inherent（處理前）風險 → Safeguard Assessment → Residual（處理後）風險 → Risk Acceptability。</p></div>' +
      '<div class="c6-callout c6-callout--warn"><strong>方法說明：</strong>專案未提供 CIS RAM 官方計分公式，CAT.6 不自行創造。處理前 / 處理後分數以 <strong>CAT.6 5×5 平台準則</strong>（L × I）表示；可接受性 = 處理後分數 ≤ 組織自訂之可接受風險門檻。門檻未定義時顯示 DATA REQUIRED。</div>' +
      '<div class="c6-grid">' + P.card('crit', 'Risk Acceptance Criteria', '由組織定義（CIS RAM 要求組織自訂）', '<div id="crit-b"></div>') +
      P.card('cmp', 'Inherent → Residual', '○ 處理前 · ● 處理後（0–25）', '<div id="cmp-c"></div><p class="c6-chart-summary" id="cmp-s"></p>', { span: 2 }) + '</div>' +
      P.card('reg', 'CIS RAM Worksheet', '可搜尋、篩選、排序', '<div id="tbl"></div>');

    function load() {
      return W.load(['cisram', 'risks']).then(function (d) {
        data = d; P.notice(document.getElementById('c6-notice'), W.usesDefaults({ cisram: d.cisram }), { edit: '#reg', dataset: 'cisram' });
        var TR = C.data.defaults.parameters.resolve('cisRamAcceptableScore', W.assessment), thr = TR.value;
        document.getElementById('crit-b').innerHTML = '<div class="c6-stack"><dl class="c6-kv"><dt>Risk Acceptance Threshold</dt><dd><strong class="c6-num">Risk ≤ ' + thr + '</strong> → Accept；Risk ≥ ' + (+thr + 1) + ' → Treatment Required ' + P.prov(TR.source) + '</dd>' +
          '<dt>計分準則</dt><dd>CAT.6 5×5（L × I，平台自定義）</dd></dl>' +
          '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">Risk level handling</caption><thead><tr><th scope="col">Risk Score</th><th scope="col">等級</th><th scope="col">處理方式</th></tr></thead><tbody>' +
          C.data.riskCriteria.cat6.bands.map(function (b) { return '<tr><td>' + b.min + '–' + b.max + '</td><td>' + b.label + '</td><td>' + b.handling + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<button type="button" class="c6-btn c6-btn--secondary" id="set-thr">設定組織門檻</button>' +
          (TR.isDefault ? '<p class="c6-note">目前使用 CAT.6 預設門檻 9。採用依據：' + esc(TR.basis) + '</p>' : '') + '</div>';
        document.getElementById('set-thr').addEventListener('click', setThreshold);
        var rows = d.cisram.map(function (r) { var a = E.assess(r, thr); return { label: r.id + ' ' + r.scenario, before: a.inherent ? a.inherent.score : null, after: a.residual ? a.residual.score : null, tipBefore: 'Inherent ' + (a.inherent ? a.inherent.score : '—'), tipAfter: 'Residual ' + (a.residual ? a.residual.score : '—') }; });
        C.charts.hbars.compare(document.getElementById('cmp-c'), rows, { label: 'CIS RAM 處理前後風險分數', max: 25, bands: thr != null && thr !== '' ? [{ from: 0, to: +thr, fill: 'rgba(111,183,166,0.08)' }] : [] });
        var red = d.cisram.map(function (r) { return E.assess(r, thr).reduction; }).filter(function (x) { return x != null; });
        document.getElementById('cmp-s').textContent = d.cisram.length ? d.cisram.length + ' 個情境；' + (red.length ? '平均降低 ' + (red.reduce(function (s, x) { return s + x; }, 0) / red.length).toFixed(1) + ' 分。' : '尚無處理後分數。') + (thr != null && thr !== '' ? '綠色區域為可接受範圍（≤ ' + thr + '）。' : '未設定可接受門檻。') : '尚無資料。';
        if (tbl) tbl.setRows(d.cisram); else build();
      });
    }
    function setThreshold() {
      C.ui.form.open({ title: 'Risk Acceptance Criteria', subtitle: '以 CAT.6 5×5 分數表示（1–25）。留白 = 使用 CAT.6 預設門檻 9（Risk ≤ 9 Accept、≥ 10 Treatment Required）。', fields: [
        { key: 'cisRamAcceptableScore', label: '可接受之最高處理後分數', type: 'int', min: 1, max: 25, help: '留白 = 使用 CAT.6 預設值 9' }], values: { cisRamAcceptableScore: W.assessment.cisRamAcceptableScore } })
        .then(function (v) { if (!v) return; var a = Object.assign({}, W.assessment, { cisRamAcceptableScore: v.cisRamAcceptableScore }); return W.saveAssessment(a).then(function () { D.toast('已更新可接受門檻'); return load(); }); });
    }
    function build() {
      var thr = function () { return C.data.defaults.parameters.value('cisRamAcceptableScore', W.assessment); };
      tbl = C.ui.table.create(document.getElementById('tbl'), {
        caption: 'CIS RAM worksheet', rows: data.cisram,
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'scenario', label: 'Scenario / Asset', wrap: true, get: function (r) { return r.scenario + ' ' + r.asset + ' ' + (r.threat || '') + ' ' + (r.vulnerability || ''); }, render: function (r) { return '<strong>' + esc(r.scenario) + '</strong><br><span class="c6-muted">' + esc(r.asset) + (r.threat ? ' · ' + esc(r.threat) : '') + '</span>'; } },
          { key: 'safeguards', label: 'Safeguards', get: function (r) { return (r.safeguards || []).join(' '); }, render: function (r) { return P.chips(r.safeguards); } },
          { key: 'inherent', label: 'Inherent', get: function (r) { var a = E.assess(r); return a.inherent ? a.inherent.score : null; }, render: function (r) { return P.score(r.inherentLikelihood, r.inherentImpact); } },
          { key: 'residual', label: 'Residual', get: function (r) { var a = E.assess(r); return a.residual ? a.residual.score : null; }, render: function (r) { return r.residualLikelihood ? P.score(r.residualLikelihood, r.residualImpact) : P.dataRequired('尚未評估處理後風險'); } },
          { key: 'reduction', label: 'Δ', num: true, get: function (r) { return E.assess(r).reduction; } },
          { key: 'acc', label: 'Acceptability', get: function (r) { return E.assess(r, thr()).acceptability.id; }, render: function (r) { return accChip(E.assess(r, thr()).acceptability); } },
          { key: 'source', label: 'Provenance', render: function (r) { return P.prov(r.source); } }
        ],
        filters: [{ key: 'acc', label: 'Acceptability', get: function (r) { return E.assess(r, thr()).acceptability.id; }, options: [{ value: 'ACCEPTABLE', label: 'Accept' }, { value: 'NOT_ACCEPTABLE', label: 'Treatment Required' }, { value: 'DATA_REQUIRED', label: 'DATA REQUIRED' }] },
          { key: 'sg', label: 'Safeguard', get: function (r) { return r.safeguards || []; }, options: C.data.cis.controls.map(function (c) { return c.id; }) }],
        actions: ['view', 'edit', 'delete'],
        toolbar: '<button type="button" class="c6-btn c6-btn--primary" data-add>' + C.ui.icons.icon('plus') + '新增情境</button><a class="c6-btn c6-btn--secondary" href="data-import.html?ds=cisram">' + C.ui.icons.icon('upload') + '匯入</a>' + P.exportButtons(),
        onAction: function (a, r) { if (a === 'view') detail(r); else if (a === 'edit') edit(r); else C.ui.form.confirm('刪除 ' + r.id + '？', '刪除').then(function (ok) { if (ok) W.remove('cisram', r.id).then(load); }); }
      });
      page.querySelector('[data-add]').addEventListener('click', function () { edit(null); });
      P.bindExport(page, exportAs);
    }
    function detail(r) {
      var a = E.assess(r, C.data.defaults.parameters.value('cisRamAcceptableScore', W.assessment));
      C.ui.form.detail({ title: r.id + ' · ' + r.scenario, subtitle: P.prov(r.source), rows: [
        ['Risk ID', r.riskId ? '<a class="c6-link" href="risk-register.html?id=' + encodeURIComponent(r.riskId) + '">' + esc(r.riskId) + '</a>' : ''], ['Asset', esc(r.asset)], ['Threat', esc(r.threat)],
        ['Vulnerability', esc(r.vulnerability)], ['Impact', esc(r.impact)], ['Existing Safeguards', P.chips(r.safeguards)],
        ['Inherent Risk', a.inherent ? r.inherentLikelihood + ' × ' + r.inherentImpact + ' = ' + P.score(r.inherentLikelihood, r.inherentImpact) : P.dataRequired()],
        ['Safeguard Assessment', esc(r.safeguardAssessment)],
        ['Residual Risk', a.residual ? r.residualLikelihood + ' × ' + r.residualImpact + ' = ' + P.score(r.residualLikelihood, r.residualImpact) : P.dataRequired()],
        ['Acceptability', accChip(a.acceptability)], ['Recommended Safeguards', esc(r.recommended)]
      ], actions: [{ label: '編輯', primary: true, onClick: function () { edit(r); } }] });
    }
    function edit(r) {
      var isNew = !r;
      C.ui.form.open({ title: isNew ? '新增 CIS RAM 情境' : '編輯 ' + r.id, fields: FIELDS(data.risks), values: r || { safeguards: [] }, validate: function (v) {
        return (v.residualLikelihood == null) !== (v.residualImpact == null) ? { residualImpact: '處理後 L 與 I 需同時填寫' } : {};
      } }).then(function (v) {
        if (!v) return; var rec = Object.assign({}, r || {}, v); if (isNew) rec.id = D.nextId('CR', data.cisram);
        return W.save('cisram', rec, { verb: isNew ? '新增' : '更新' }).then(function () { D.toast(rec.id + ' 已儲存'); return load(); });
      });
    }
    function exportAs(kind) {
      var TR = C.data.defaults.parameters.resolve('cisRamAcceptableScore', W.assessment), thr = TR.value;
      var t = { name: 'CIS RAM Risk Register', rows: tbl.visible(), notes: P.exportNotes(data.cisram).concat(['Inherent / Residual scores use CAT.6 5×5 platform criteria (not the CIS RAM official formula).', 'Risk acceptance threshold: Risk <= ' + thr + ' Accept; Risk >= ' + (+thr + 1) + ' Treatment Required (' + TR.source + ')']), columns: [
        { key: 'id', label: 'CIS RAM ID' }, { key: 'riskId', label: 'Risk ID' }, { key: 'scenario', label: 'Scenario' }, { key: 'asset', label: 'Asset' }, { key: 'threat', label: 'Threat' }, { key: 'vulnerability', label: 'Vulnerability' },
        { key: 'impact', label: 'Impact Description' }, { key: 'safeguards', label: 'Existing Safeguards' }, { key: 'inherentLikelihood', label: 'Inherent Likelihood' }, { key: 'inherentImpact', label: 'Inherent Impact' },
        { key: 'inh', label: 'Inherent Score', get: function (r) { var a = E.assess(r); return a.inherent ? a.inherent.score : 'DATA REQUIRED'; } }, { key: 'safeguardAssessment', label: 'Safeguard Assessment' },
        { key: 'residualLikelihood', label: 'Residual Likelihood' }, { key: 'residualImpact', label: 'Residual Impact' },
        { key: 'res', label: 'Residual Score', get: function (r) { var a = E.assess(r); return a.residual ? a.residual.score : 'DATA REQUIRED'; } },
        { key: 'acc', label: 'Acceptability', get: function (r) { var z = E.assess(r, thr).acceptability.id; return z === 'ACCEPTABLE' ? 'Accept' : z === 'NOT_ACCEPTABLE' ? 'Treatment Required' : 'DATA REQUIRED'; } }, { key: 'recommended', label: 'Recommended Safeguards' }, { key: 'source', label: 'Data Provenance' }] };
      if (kind === 'csv') C.services.exporter.downloadCSV(t, 'CAT6_CIS_RAM'); else C.services.exporter.downloadXLSX([t], 'CAT6_CIS_RAM');
    }
    return load().then(function () { page.removeAttribute('aria-busy'); });
  });
})(globalThis.CAT6);
