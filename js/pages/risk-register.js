/* Risk Register — add / edit / delete / search / filter / sort / detail / import / export.
 * Risk Score = L × I on the CAT.6 5×5 platform criteria (CALCULATED, not stored). */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, RM = C.calc.riskMatrix, esc = D.esc;
  var TREAT = ['Accept', 'Avoid', 'Mitigate', 'Share', 'Transfer'];
  var STATUS = ['Draft', 'In review', 'Assessed', 'Treatment planned', 'Closed'];
  var METHOD = [{ value: 'CAT6', label: 'CAT.6 5×5 Platform Criteria' }, { value: 'SP80030', label: 'NIST SP 800-30 Rev.1' }, { value: 'CISRAM', label: 'CIS RAM' }];
  var LI_HELP = '依 CAT.6 5×5 L / I 等級文字描述選擇；Risk Score = L × I（平台自定義，1–4 Low、5–9 Moderate、10–16 High、17–25 Critical）。';

  function scoreOf(r) { return r.likelihood >= 1 && r.impact >= 1 ? RM.assess(r.likelihood, r.impact) : null; }
  function residualOf(r) { return r.residualLikelihood >= 1 && r.residualImpact >= 1 ? RM.assess(r.residualLikelihood, r.residualImpact) : null; }

  var FIELDS = function (risks) {
    return [
      { key: 'scenario', label: 'Risk Scenario 風險情境', type: 'text', required: true, full: true },
      { key: 'asset', label: 'Asset 資產', type: 'text', required: true },
      { key: 'threatSource', label: 'Threat Source 威脅來源', type: 'text' },
      { key: 'threatEvent', label: 'Threat Event 威脅事件', type: 'text', full: true },
      { key: 'vulnerability', label: 'Vulnerability 弱點', type: 'text' },
      { key: 'existingControls', label: 'Existing Controls 現有控制', type: 'text' },
      { key: 'method', label: 'Assessment Method 評估方法', type: 'select', options: METHOD, help: 'SP 800-30 / CIS RAM 的詳細判定在各自頁面完成' },
      { key: 'likelihood', label: 'Likelihood 可能性', type: 'int', options: P.liOptions('L'), required: true, full: true, help: LI_HELP },
      { key: 'impact', label: 'Impact 衝擊', type: 'int', options: P.liOptions('I'), required: true, full: true, help: LI_HELP },
      { key: 'treatment', label: 'Treatment 處理方式', type: 'select', options: TREAT },
      { key: 'owner', label: 'Owner 負責人', type: 'text' },
      { key: 'dueDate', label: 'Due Date 到期日', type: 'date' },
      { key: 'status', label: 'Status 狀態', type: 'select', options: STATUS, required: true },
      { key: 'residualLikelihood', label: 'Residual Likelihood 殘餘可能性', type: 'int', options: P.liOptions('L'), full: true, help: '處理後預估；留白 = 尚未評估' },
      { key: 'residualImpact', label: 'Residual Impact 殘餘衝擊', type: 'int', options: P.liOptions('I'), full: true },
      { key: 'frameworks', label: 'Frameworks 使用框架', type: 'multi', options: P.fwOptions() },
      { key: 'cisControls', label: 'CIS Controls 對應', type: 'multi', options: P.cisOptions(), filter: true },
      { key: 'fair', label: 'FAIR 量化', type: 'bool', checkLabel: '此情境納入 FAIR 量化分析' }
    ];
  };
  function validate(v) {
    var e = {};
    if ((v.residualLikelihood == null) !== (v.residualImpact == null)) e[v.residualLikelihood == null ? 'residualLikelihood' : 'residualImpact'] = '殘餘 L 與 I 需同時填寫或同時留白';
    return e;
  }

  P.boot({ nav: 'register' }, function () {
    var page = document.getElementById('page'), tbl, data;
    page.innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">Risk Register 風險登錄表</h2><p class="c6-intro__text">每筆風險情境記錄資產、威脅來源 / 事件、弱點、現有控制、可能性與衝擊。分數以 <strong>CAT.6 5×5 平台準則</strong>（L × I）計算，並非 ISO/IEC 27001 指定公式；NIST SP 800-30 的查表判定請見 <a class="c6-link" href="nist-800-30.html">NIST SP 800-30</a>。</p></div>' +
      '<div class="c6-stats" id="stats"></div>' +
      P.card('reg', '風險情境', '搜尋、篩選、排序；點欄位標題排序', '<div id="tbl"></div>', { head: '<span id="reg-prov"></span>' });
    function load() {
      return W.load(['risks', 'treatments', 'nist', 'cisram', 'evidence']).then(function (d) {
        data = d; P.notice(document.getElementById('c6-notice'), W.usesDefaults({ risks: d.risks }), { edit: '#reg', dataset: 'risks' });
        var c = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }, dr = 0;
        d.risks.forEach(function (r) { var a = scoreOf(r); if (a) c[a.band.id]++; else dr++; });
        document.getElementById('stats').innerHTML = [['Critical', c.CRITICAL, 'bad'], ['High', c.HIGH, 'warn'], ['Medium + Low', c.MEDIUM + c.LOW, ''], ['總情境數', d.risks.length, '']].map(function (s) {
          return '<div class="c6-stat' + (s[2] ? ' c6-stat--' + s[2] : '') + '"><span class="c6-stat__label">' + s[0] + '</span><span class="c6-stat__value">' + s[1] + '</span></div>';
        }).join('') + (dr ? '<p class="c6-note">' + dr + ' 筆缺少 L / I，分數為 DATA REQUIRED。</p>' : '');
        if (tbl) tbl.setRows(d.risks); else build();
        var id = D.qs('id'); if (id && !load.opened) { load.opened = 1; var r = d.risks.filter(function (x) { return x.id === id; })[0]; if (r) detail(r); }
      });
    }
    function build() {
      tbl = C.ui.table.create(document.getElementById('tbl'), {
        caption: 'Risk Register', rows: data.risks, query: D.qs('q') || '', sort: { key: 'score', dir: 'desc' },
        searchPlaceholder: '情境、資產、威脅、弱點、負責人…',
        columns: [
          { key: 'id', label: 'Risk ID' },
          { key: 'scenario', label: 'Scenario / Asset', wrap: true, get: function (r) { return [r.scenario, r.asset, r.threatSource, r.threatEvent, r.vulnerability, r.existingControls].join(' '); },
            render: function (r) { return '<strong>' + esc(r.scenario) + '</strong><br><span class="c6-muted">' + esc(r.asset) + (r.threatSource ? ' · ' + esc(r.threatSource) : '') + '</span>'; } },
          { key: 'likelihood', label: 'L', num: true }, { key: 'impact', label: 'I', num: true },
          { key: 'score', label: 'Score / Level', get: function (r) { var a = scoreOf(r); return a ? a.score : null; }, render: function (r) { return P.score(r.likelihood, r.impact); } },
          { key: 'treatment', label: 'Treatment' }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due' }, { key: 'status', label: 'Status' },
          { key: 'residual', label: 'Residual', get: function (r) { var a = residualOf(r); return a ? a.score : null; }, render: function (r) { return residualOf(r) ? P.score(r.residualLikelihood, r.residualImpact) : P.dataRequired('尚未評估殘餘風險'); } },
          { key: 'source', label: 'Provenance', render: function (r) { return P.prov(r.source); } }
        ],
        filters: [
          { key: 'level', label: 'Level', get: function (r) { var a = scoreOf(r); return a ? a.band.id : 'DATA_REQUIRED'; }, options: [{ value: 'CRITICAL', label: 'Critical' }, { value: 'HIGH', label: 'High' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'LOW', label: 'Low' }, { value: 'DATA_REQUIRED', label: 'DATA REQUIRED' }] },
          { key: 'status', label: 'Status', options: STATUS },
          { key: 'treatment', label: 'Treatment', options: TREAT },
          { key: 'source', label: 'Source', options: ['USER_INPUT', 'FILE_IMPORT', 'CAT6_DEFAULT'] }
        ],
        actions: ['view', 'edit', 'delete'],
        toolbar: '<button type="button" class="c6-btn c6-btn--primary" data-add>' + C.ui.icons.icon('plus') + '新增風險</button><a class="c6-btn c6-btn--secondary" href="data-import.html?ds=risks">' + C.ui.icons.icon('upload') + '匯入 CSV / XLSX</a>' + P.exportButtons(),
        onAction: function (a, r) { if (a === 'view') detail(r); else if (a === 'edit') edit(r); else if (a === 'delete') del(r); }
      });
      document.getElementById('reg-prov').innerHTML = P.prov('CALCULATED');
      page.querySelector('[data-add]').addEventListener('click', function () { edit(null); });
      P.bindExport(page, exportAs);
    }
    function edit(r) {
      var isNew = !r, v = r ? Object.assign({}, r) : { status: 'Draft', method: 'CAT6', frameworks: [], cisControls: [] };
      C.ui.form.open({ title: isNew ? '新增風險情境' : '編輯 ' + r.id, subtitle: isNew ? '儲存後來源標示為 USER_INPUT' : (r.source === 'CAT6_DEFAULT' ? '編輯後此筆的來源會由 CAT6_DEFAULT 改為 USER_INPUT' : ''), fields: FIELDS(data.risks), values: v, validate: validate }).then(function (out) {
        if (!out) return;
        var rec = Object.assign({}, r || {}, out);
        if (isNew) rec.id = D.nextId('RS', data.risks);
        return W.save('risks', rec, { verb: isNew ? '新增' : '更新' }).then(function () { D.toast((isNew ? '已新增 ' : '已更新 ') + rec.id); return load(); });
      });
    }
    function del(r) {
      var linked = data.treatments.filter(function (t) { return t.riskId === r.id; });
      C.ui.form.confirm('刪除 ' + r.id + '「' + r.scenario + '」？' + (linked.length ? '將一併刪除 ' + linked.length + ' 筆關聯處理計畫（' + linked.map(function (t) { return t.id; }).join(', ') + '）。' : '') + '此動作無法復原。', '刪除').then(function (ok) {
        if (!ok) return;
        return linked.reduce(function (p, t) { return p.then(function () { return W.remove('treatments', t.id); }); }, Promise.resolve())
          .then(function () { return W.remove('risks', r.id); }).then(function () { D.toast('已刪除 ' + r.id); return load(); });
      });
    }
    function detail(r) {
      var a = scoreOf(r), tr = data.treatments.filter(function (t) { return t.riskId === r.id; }), na = data.nist.filter(function (n) { return n.riskId === r.id; }),
        cr = data.cisram.filter(function (x) { return x.riskId === r.id; }), ev = data.evidence.filter(function (x) { return x.relatedRisk === r.id; });
      var link = function (list, href) { return list.length ? list.map(function (x) { return '<a class="c6-link" href="' + href + '">' + esc(x.id) + '</a>'; }).join('、') : ''; };
      C.ui.form.detail({ title: r.id + ' · ' + r.scenario, subtitle: 'Data Provenance：' + P.prov(r.source), rows: [
        ['Asset', esc(r.asset)], ['Threat Source', esc(r.threatSource)], ['Threat Event', esc(r.threatEvent)], ['Vulnerability', esc(r.vulnerability)],
        ['Existing Controls', esc(r.existingControls)], ['Assessment Method', esc((METHOD.filter(function (m) { return m.value === r.method; })[0] || {}).label || '')],
        ['Likelihood × Impact', a ? r.likelihood + ' × ' + r.impact + ' = ' + P.score(r.likelihood, r.impact) + ' ' + P.prov('CALCULATED') : P.dataRequired()],
        ['Treatment', esc(r.treatment)], ['Owner', esc(r.owner)], ['Due Date', esc(r.dueDate)], ['Status', esc(r.status)],
        ['Residual Risk', residualOf(r) ? r.residualLikelihood + ' × ' + r.residualImpact + ' = ' + P.score(r.residualLikelihood, r.residualImpact) : P.dataRequired('尚未評估殘餘風險')],
        ['Frameworks', P.chips((r.frameworks || []).map(P.fwShort), 'accent')], ['CIS Controls', P.chips(r.cisControls)], ['FAIR', r.fair ? '<a class="c6-link" href="fair-analysis.html">納入 FAIR 量化</a>' : ''],
        ['處理計畫', link(tr, 'risk-treatment.html')], ['NIST SP 800-30', link(na, 'nist-800-30.html')], ['CIS RAM', link(cr, 'cis-ram.html')], ['證據', link(ev, 'evidence.html')],
        ['最後更新', esc((r.updatedAt || '').slice(0, 19).replace('T', ' '))]
      ], actions: [{ label: '編輯', primary: true, onClick: function () { edit(r); } }, { label: '框架對應', onClick: function () { location.href = 'framework-mapping.html?risk=' + encodeURIComponent(r.id); } }] });
    }
    function table() {
      return { name: 'Risk Register', sheet: 'Risk Register', rows: tbl.visible(), notes: P.exportNotes(data.risks).concat(['Risk Score = Likelihood × Impact (CAT.6 5×5 platform criteria, not an ISO/IEC 27001 formula).']), columns: [
        { key: 'id', label: 'Risk ID' }, { key: 'scenario', label: 'Scenario' }, { key: 'asset', label: 'Asset' }, { key: 'threatSource', label: 'Threat Source' }, { key: 'threatEvent', label: 'Threat Event' },
        { key: 'vulnerability', label: 'Vulnerability' }, { key: 'existingControls', label: 'Existing Controls' }, { key: 'likelihood', label: 'Likelihood' }, { key: 'impact', label: 'Impact' },
        { key: 'score', label: 'Risk Score', get: function (r) { var a = scoreOf(r); return a ? a.score : 'DATA REQUIRED'; } }, { key: 'level', label: 'Risk Level', get: function (r) { var a = scoreOf(r); return a ? a.band.label : 'DATA REQUIRED'; } },
        { key: 'treatment', label: 'Treatment' }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due Date' }, { key: 'status', label: 'Status' },
        { key: 'residualLikelihood', label: 'Residual Likelihood' }, { key: 'residualImpact', label: 'Residual Impact' }, { key: 'residual', label: 'Residual Score', get: function (r) { var a = residualOf(r); return a ? a.score + ' ' + a.band.label : 'DATA REQUIRED'; } },
        { key: 'frameworks', label: 'Frameworks' }, { key: 'cisControls', label: 'CIS Controls' }, { key: 'source', label: 'Data Provenance' }] };
    }
    function exportAs(kind) { var t = table(); if (kind === 'csv') C.services.exporter.downloadCSV(t, 'CAT6_Risk_Register'); else C.services.exporter.downloadXLSX([t], 'CAT6_Risk_Register'); }
    return load().then(function () { page.removeAttribute('aria-busy'); });
  });
})(globalThis.CAT6);
