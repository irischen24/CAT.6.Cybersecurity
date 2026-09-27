/* Risk Treatment — strategy, selected control, framework mappings (ISO / CSF / CIS / CIS RAM), owner, priority, due date,
 * status, and residual risk. Residual L/I is stored on the RISK record (single source of truth). */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, RM = C.calc.riskMatrix, T = C.calc.treatment, esc = D.esc;
  var STRAT = [{ value: 'Accept', label: 'Accept 接受' }, { value: 'Avoid', label: 'Avoid 避免' }, { value: 'Mitigate', label: 'Mitigate 降低' }, { value: 'Share', label: 'Share 分擔' }, { value: 'Transfer', label: 'Transfer 移轉' }];
  var STATUS = ['Planned', 'In progress', 'Completed', 'Cancelled'], PRI = [{ value: 'P1', label: 'P1 最高' }, { value: 'P2', label: 'P2' }, { value: 'P3', label: 'P3' }];
  var CLS = { OPEN: ['Open', 'warn', '◐'], OVERDUE: ['Overdue', 'bad', '⚠'], COMPLETED: ['Completed', 'ok', '✓'], CANCELLED: ['Cancelled', '', '—'] };
  function sc(l, i) { return l >= 1 && i >= 1 ? RM.assess(l, i) : null; }

  P.boot({ nav: 'treatment' }, function () {
    var page = document.getElementById('page'), tbl, d, view = D.qs('view') || 'ALL';
    page.innerHTML = '<div class="c6-intro"><h2 class="c6-intro__title">Risk Treatment 風險處理</h2><p class="c6-intro__text">策略依 NIST SP 800-30 / ISO/IEC 27005 常用分類：Accept、Avoid、Mitigate、Share、Transfer。每個處理計畫可對應 ISO/IEC 27001 Annex A、NIST CSF 2.0、CIS Controls 與 CIS RAM 情境；殘餘風險寫回風險登錄表。</p></div>' +
      '<div class="c6-stats" id="stats"></div>' +
      P.card('plans', 'Treatment Plans', '依狀態檢視', '<div class="c6-tabs" role="tablist" aria-label="處理狀態" id="views"></div><div id="tbl"></div>') +
      '<div class="c6-grid">' + P.card('res', 'Residual Risk', '○ 目前風險 · ● 殘餘風險（CAT.6 5×5）', '<div id="res-c"></div><p class="c6-chart-summary" id="res-s"></p>', { span: 2 }) +
      P.card('untreated', 'Untreated Risks', '尚無處理計畫且未決定接受', '<div id="un"></div>') + '</div>';

    function load() {
      return W.load(['treatments', 'risks', 'cisram']).then(function (x) {
        d = x; var byId = {}; x.risks.forEach(function (r) { byId[r.id] = r; }); d.byId = byId;
        P.notice(document.getElementById('c6-notice'), W.usesDefaults({ t: x.treatments }), { edit: '#plans', dataset: 'risks' });
        var s = T.summary(x.treatments);
        document.getElementById('stats').innerHTML = [['Open', s.OPEN, 'warn'], ['Overdue', s.OVERDUE, s.OVERDUE ? 'bad' : 'ok'], ['Completed', s.COMPLETED, 'ok'], ['Cancelled', s.CANCELLED, '']].map(function (q) {
          return '<div class="c6-stat c6-stat--' + q[2] + '"><span class="c6-stat__label">' + q[0] + '</span><span class="c6-stat__value">' + q[1] + '</span></div>';
        }).join('');
        document.getElementById('views').innerHTML = [['ALL', '全部', x.treatments.length], ['OPEN', 'Open', s.OPEN], ['OVERDUE', 'Overdue', s.OVERDUE], ['COMPLETED', 'Completed', s.COMPLETED]].map(function (v) {
          return '<button type="button" class="c6-tab" role="tab" aria-selected="' + (view === v[0]) + '" data-view="' + v[0] + '">' + v[1] + ' (' + v[2] + ')</button>';
        }).join('');
        var rows = x.risks.map(function (r) { var a = sc(r.likelihood, r.impact), b = sc(r.residualLikelihood, r.residualImpact); return { label: r.id, before: a ? a.score : null, after: b ? b.score : null, tipBefore: r.id + ' 目前 ' + (a ? a.score + ' ' + a.band.label : '—'), tipAfter: r.id + ' 殘餘 ' + (b ? b.score + ' ' + b.band.label : '—') }; });
        C.charts.hbars.compare(document.getElementById('res-c'), rows, { label: '目前 vs 殘餘風險', max: 25, missing: '殘餘風險 DATA REQUIRED' });
        var withRes = rows.filter(function (r) { return r.after != null && r.before != null; });
        document.getElementById('res-s').textContent = x.risks.length + ' 個風險中 ' + withRes.length + ' 個已評估殘餘風險' + (withRes.length ? '，平均由 ' + (withRes.reduce(function (a, r) { return a + r.before; }, 0) / withRes.length).toFixed(1) + ' 降至 ' + (withRes.reduce(function (a, r) { return a + r.after; }, 0) / withRes.length).toFixed(1) : '') + '；' + (rows.length - withRes.length) + ' 個缺少殘餘評估（DATA REQUIRED）。';
        var un = x.risks.filter(function (r) { return !x.treatments.some(function (t) { return t.riskId === r.id; }) && r.treatment !== 'Accept'; });
        document.getElementById('un').innerHTML = un.length ? '<ul class="c6-stage__list">' + un.map(function (r) { return '<li class="c6-stage__item"><span class="c6-stage__mark" aria-hidden="true">!</span><span><a href="risk-register.html?id=' + encodeURIComponent(r.id) + '">' + esc(r.id) + '</a> ' + esc(r.scenario) + '</span><button type="button" class="c6-btn c6-btn--secondary c6-btn--sm" data-plan="' + esc(r.id) + '">建立計畫</button></li>'; }).join('') + '</ul>' : '<p class="c6-note">所有風險皆有處理計畫或接受決策。</p>';
        var list = filtered();
        if (tbl) tbl.setRows(list); else build(list);
      });
    }
    function filtered() { return view === 'ALL' ? d.treatments : d.treatments.filter(function (t) { return T.classify(t) === view; }); }
    function build(list) {
      tbl = C.ui.table.create(document.getElementById('tbl'), {
        caption: 'Risk treatment plans', rows: list, sort: { key: 'dueDate', dir: 'asc' },
        columns: [{ key: 'id', label: 'ID' }, { key: 'riskId', label: 'Risk', render: function (t) { return '<a class="c6-link" href="risk-register.html?id=' + encodeURIComponent(t.riskId) + '">' + esc(t.riskId) + '</a>'; } },
          { key: 'scenario', label: 'Scenario', wrap: true, get: function (t) { var r = d.byId[t.riskId]; return r ? r.scenario : '(已刪除)'; } },
          { key: 'cur', label: 'Current Risk', get: function (t) { var r = d.byId[t.riskId], a = r && sc(r.likelihood, r.impact); return a ? a.score : null; }, render: function (t) { var r = d.byId[t.riskId]; return r ? P.score(r.likelihood, r.impact) : P.dataRequired(); } },
          { key: 'strategy', label: 'Strategy' }, { key: 'control', label: 'Selected Control', wrap: true },
          { key: 'refs', label: 'Mappings', get: function (t) { var f = t.refs || {}; return [].concat(f.iso || [], f.csf || [], f.cis || [], f.cisram ? [f.cisram] : []).join(' '); }, render: function (t) { var f = t.refs || {}; return [f.iso && f.iso.length ? 'ISO ' + P.chips(f.iso) : '', f.csf && f.csf.length ? 'CSF ' + P.chips(f.csf) : '', f.cis && f.cis.length ? 'CIS ' + P.chips(f.cis) : '', f.cisram ? 'RAM ' + P.chip(f.cisram) : ''].filter(Boolean).join('<br>') || '<span class="c6-muted">—</span>'; } },
          { key: 'framework', label: 'Framework', get: function (t) { return P.fwShort(t.framework); } }, { key: 'owner', label: 'Owner' }, { key: 'priority', label: 'Priority' }, { key: 'dueDate', label: 'Due' },
          { key: 'status', label: 'Status', get: function (t) { return T.classify(t); }, render: function (t) { var c = CLS[T.classify(t)]; return esc(t.status) + '<br>' + P.chip(c[2] + ' ' + c[0], c[1]); } },
          { key: 'res', label: 'Residual', get: function (t) { var r = d.byId[t.riskId], a = r && sc(r.residualLikelihood, r.residualImpact); return a ? a.score : null; }, render: function (t) { var r = d.byId[t.riskId]; return r && sc(r.residualLikelihood, r.residualImpact) ? P.score(r.residualLikelihood, r.residualImpact) : P.dataRequired('尚未評估殘餘風險'); } },
          { key: 'source', label: 'Provenance', render: function (t) { return P.prov(t.source); } }],
        filters: [{ key: 'strategy', label: 'Strategy', options: STRAT }, { key: 'priority', label: 'Priority', options: PRI }, { key: 'framework', label: 'Framework', options: P.fwOptions().map(function (o) { return { value: o.value, label: P.fwShort(o.value) }; }) }],
        actions: ['edit', 'delete'],
        toolbar: '<button type="button" class="c6-btn c6-btn--primary" data-add>' + C.ui.icons.icon('plus') + '新增處理計畫</button>' + P.exportButtons(),
        onAction: function (a, t) { if (a === 'edit') edit(t); else C.ui.form.confirm('刪除 ' + t.id + '？', '刪除').then(function (ok) { if (ok) W.remove('treatments', t.id).then(load); }); }
      });
      page.querySelector('[data-add]').addEventListener('click', function () { edit(null); });
      P.bindExport(document.getElementById('plans'), exportAs);
    }
    page.addEventListener('click', function (e) {
      var v = e.target.closest('[data-view]'); if (v) { view = v.getAttribute('data-view'); history.replaceState(null, '', '?view=' + view); load(); return; }
      var p = e.target.closest('[data-plan]'); if (p) edit(null, p.getAttribute('data-plan'));
    });
    function edit(t, riskId) {
      var isNew = !t, r0 = t ? d.byId[t.riskId] : d.byId[riskId];
      var v = t ? Object.assign({}, t, { iso: (t.refs || {}).iso || [], csf: (t.refs || {}).csf || [], cis: (t.refs || {}).cis || [], cisram: (t.refs || {}).cisram || '' }) : { riskId: riskId || '', strategy: 'Mitigate', status: 'Planned', priority: 'P2', iso: [], csf: [], cis: [] };
      if (r0) { v.residualLikelihood = r0.residualLikelihood; v.residualImpact = r0.residualImpact; }
      C.ui.form.open({ title: isNew ? '新增處理計畫' : '編輯 ' + t.id, subtitle: '殘餘 L / I 會寫回風險登錄表', values: v, fields: [
        { key: 'riskId', label: 'Risk ID', type: 'select', required: true, options: P.riskOptions(d.risks), full: true },
        { key: 'strategy', label: 'Treatment Strategy', type: 'select', required: true, options: STRAT },
        { key: 'framework', label: 'Primary Framework', type: 'select', required: true, options: P.fwOptions() },
        { key: 'control', label: 'Selected Control / Action', type: 'textarea', required: true },
        { key: 'owner', label: 'Owner', type: 'text', required: true }, { key: 'priority', label: 'Priority', type: 'select', required: true, options: PRI },
        { key: 'dueDate', label: 'Due Date', type: 'date', required: true }, { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS },
        { key: 'residualLikelihood', label: 'Residual Likelihood', type: 'int', options: P.liOptions('L'), full: true }, { key: 'residualImpact', label: 'Residual Impact', type: 'int', options: P.liOptions('I'), full: true },
        { key: 'iso', label: 'ISO/IEC 27001 Annex A', type: 'multi', filter: true, options: C.data.iso.annexA.map(function (a) { return { value: a.id, label: a.id + ' ' + a.title }; }) },
        { key: 'csf', label: 'NIST CSF 2.0 Categories', type: 'multi', filter: true, options: C.data.csf.categories.map(function (c) { return { value: c.id, label: c.id + ' ' + c.name }; }) },
        { key: 'cis', label: 'CIS Controls v8.1', type: 'multi', filter: true, options: P.cisOptions() },
        { key: 'cisram', label: 'CIS RAM 情境', type: 'select', options: d.cisram.map(function (x) { return { value: x.id, label: x.id + ' ' + x.scenario }; }) }
      ], validate: function (x) { var e = {}; if ((x.residualLikelihood == null) !== (x.residualImpact == null)) e.residualImpact = '殘餘 L 與 I 需同時填寫'; if (x.strategy === 'Mitigate' && !x.iso.length && !x.csf.length && !x.cis.length) e.cis = 'Mitigate 請至少對應一項控制（ISO / CSF / CIS）'; return e; } })
        .then(function (x) {
          if (!x) return;
          var rec = Object.assign({}, t || {}, { riskId: x.riskId, strategy: x.strategy, framework: x.framework, control: x.control, owner: x.owner, priority: x.priority, dueDate: x.dueDate, status: x.status, refs: { iso: x.iso, csf: x.csf, cis: x.cis, cisram: x.cisram || '' } });
          if (isNew) rec.id = D.nextId('TR', d.treatments);
          var r = d.byId[x.riskId], jobs = [W.save('treatments', rec, { verb: isNew ? '新增' : '更新' })];
          if (r && (r.residualLikelihood !== x.residualLikelihood || r.residualImpact !== x.residualImpact || r.treatment !== x.strategy))
            jobs.push(W.save('risks', Object.assign({}, r, { residualLikelihood: x.residualLikelihood, residualImpact: x.residualImpact, treatment: x.strategy }), { verb: '更新殘餘風險' }));
          return Promise.all(jobs).then(function () { D.toast(rec.id + ' 已儲存'); return load(); });
        });
    }
    function exportAs(kind) {
      var t = { name: 'Risk Treatment', rows: tbl.visible(), notes: P.exportNotes(d.treatments), columns: [
        { key: 'id', label: 'Treatment ID' }, { key: 'riskId', label: 'Risk ID' }, { key: 's', label: 'Scenario', get: function (t) { var r = d.byId[t.riskId]; return r ? r.scenario : ''; } },
        { key: 'cur', label: 'Current Risk', get: function (t) { var r = d.byId[t.riskId], a = r && sc(r.likelihood, r.impact); return a ? a.score + ' ' + a.band.label : 'DATA REQUIRED'; } },
        { key: 'strategy', label: 'Treatment Strategy' }, { key: 'control', label: 'Selected Control' }, { key: 'framework', label: 'Framework' },
        { key: 'iso', label: 'ISO 27001 Mapping', get: function (t) { return (t.refs || {}).iso; } }, { key: 'csf', label: 'NIST CSF Mapping', get: function (t) { return (t.refs || {}).csf; } },
        { key: 'cis', label: 'CIS Controls Mapping', get: function (t) { return (t.refs || {}).cis; } }, { key: 'cr', label: 'CIS RAM Mapping', get: function (t) { return (t.refs || {}).cisram; } },
        { key: 'owner', label: 'Owner' }, { key: 'priority', label: 'Priority' }, { key: 'dueDate', label: 'Due Date' }, { key: 'status', label: 'Status' }, { key: 'cls', label: 'View', get: function (t) { return T.classify(t); } },
        { key: 'res', label: 'Residual Risk', get: function (t) { var r = d.byId[t.riskId], a = r && sc(r.residualLikelihood, r.residualImpact); return a ? a.score + ' ' + a.band.label : 'DATA REQUIRED'; } }, { key: 'source', label: 'Data Provenance' }] };
      if (kind === 'csv') C.services.exporter.downloadCSV(t, 'CAT6_Risk_Treatment'); else C.services.exporter.downloadXLSX([t], 'CAT6_Risk_Treatment');
    }
    return load().then(function () { page.removeAttribute('aria-busy'); });
  });
})(globalThis.CAT6);
