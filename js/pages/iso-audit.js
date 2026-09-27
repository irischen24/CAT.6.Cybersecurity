/* ISO/IEC 27001 Internal Audit (9.2), Findings, Corrective Actions (10.2), Management Review (9.3) and continual improvement tracking. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, esc = D.esc, ISO = C.data.iso;
  var FT = [{ value: 'MAJOR_NC', label: 'Major nonconformity 主要不符合' }, { value: 'MINOR_NC', label: 'Minor nonconformity 次要不符合' }, { value: 'OFI', label: 'Opportunity for improvement 改善機會' }, { value: 'OBSERVATION', label: 'Observation 觀察' }];
  var FTN = { MAJOR_NC: '▲ Major NC', MINOR_NC: '■ Minor NC', OFI: '● OFI', OBSERVATION: '○ Observation' };
  var AS = ['Planned', 'In progress', 'Completed', 'Cancelled'], FS = ['Open', 'In progress', 'Closed'], CS = ['Planned', 'In progress', 'Closed'], RS = ['Planned', 'Held'];
  var REQ = ISO.clauses.map(function (c) { return { value: c.id, label: c.id + ' ' + c.title }; }).concat(ISO.annexA.map(function (a) { return { value: a.id, label: a.id + ' ' + a.title }; }));
  function overdue(r, done) { return r.dueDate && r.dueDate < D.today() && done.indexOf(r.status) < 0; }
  function due(r, done) { return r.dueDate ? esc(r.dueDate) + (overdue(r, done) ? ' ' + P.chip('⚠ 逾期', 'bad') : '') : '<span class="c6-muted">—</span>'; }

  P.boot({ nav: 'iso-audit', group: 'iso' }, function () {
    var page = document.getElementById('page'), d, t = {};
    page.innerHTML = '<div class="c6-intro"><h2 class="c6-intro__title">Internal Audit · Findings · Corrective Action · Management Review</h2><p class="c6-intro__text">第 9.2 條內部稽核、第 10.2 條不符合與矯正措施、第 9.3 條管理審查。此處紀錄為組織內部準備資料，不是驗證機構的稽核結果。</p></div>' +
      '<div class="c6-stats" id="stats"></div>' +
      P.card('audits', 'Internal Audit Programme', '稽核計畫與執行狀態', '<div id="t-a"></div>') +
      P.card('findings', 'Findings 稽核發現', '不符合事項與改善機會', '<div id="t-f"></div>') +
      P.card('capa', 'Corrective Actions 矯正措施', '根因、行動、負責人、期限 → 持續改善', '<div id="t-c"></div>') +
      P.card('review', 'Management Review 管理審查', '9.3.2 輸入 a–g 涵蓋情形', '<div id="t-r"></div><details class="c6-details" style="margin-top:1rem"><summary>9.3.2 管理審查輸入（摘要）</summary><ul class="c6-note">' + ISO.reviewInputs.map(function (i) { return '<li>(' + i.id + ') ' + esc(i.zh) + '</li>'; }).join('') + '</ul></details>');

    var DEF = {
      audits: { el: 't-a', prefix: 'IA', title: '內部稽核', ds: null, fields: function () { return [
        { key: 'area', label: '稽核範圍 / 主題', type: 'text', required: true, full: true }, { key: 'clause', label: '主要條款 / 控制', type: 'select', options: REQ },
        { key: 'planned', label: '計畫日期', type: 'date', required: true }, { key: 'auditor', label: '稽核員', type: 'text', required: true, help: '應具客觀與公正性（不稽核自己的工作）' },
        { key: 'status', label: 'Status', type: 'select', required: true, options: AS }]; },
        columns: [{ key: 'id', label: 'Audit ID' }, { key: 'area', label: 'Area', wrap: true }, { key: 'clause', label: 'Clause' }, { key: 'planned', label: 'Planned' }, { key: 'auditor', label: 'Auditor' }, { key: 'status', label: 'Status', render: function (r) { return P.chip(r.status, r.status === 'Completed' ? 'ok' : r.status === 'Cancelled' ? '' : 'warn'); } }, { key: 'nf', label: 'Findings', num: true, get: function (r) { return d.findings.filter(function (f) { return f.auditId === r.id; }).length; } }] },
      findings: { el: 't-f', prefix: 'FD', title: '稽核發現', ds: 'findings', fields: function () { return [
        { key: 'auditId', label: '來源稽核', type: 'select', options: d.audits.map(function (a) { return { value: a.id, label: a.id + ' ' + a.area }; }) },
        { key: 'clause', label: '條款 / 控制', type: 'select', required: true, options: REQ }, { key: 'type', label: '類型', type: 'select', required: true, options: FT },
        { key: 'description', label: '描述', type: 'textarea', required: true }, { key: 'status', label: 'Status', type: 'select', required: true, options: FS }, { key: 'dueDate', label: 'Due Date', type: 'date' }]; },
        columns: [{ key: 'id', label: 'Finding ID' }, { key: 'auditId', label: 'Audit' }, { key: 'clause', label: 'Clause' }, { key: 'type', label: 'Type', render: function (r) { return P.chip(FTN[r.type] || r.type, r.type === 'MAJOR_NC' ? 'bad' : r.type === 'MINOR_NC' ? 'warn' : ''); } },
          { key: 'description', label: 'Description', wrap: true }, { key: 'status', label: 'Status' }, { key: 'dueDate', label: 'Due', render: function (r) { return due(r, ['Closed']); } },
          { key: 'capa', label: 'CAPA', get: function (r) { return d.capas.filter(function (c) { return c.findingId === r.id; }).map(function (c) { return c.id; }).join(' '); }, render: function (r) { var c = d.capas.filter(function (x) { return x.findingId === r.id; }); return c.length ? P.chips(c.map(function (x) { return x.id; })) : (r.type === 'MAJOR_NC' || r.type === 'MINOR_NC') && r.status !== 'Closed' ? P.chip('需矯正措施', 'warn') : '<span class="c6-muted">—</span>'; } }] },
      capas: { el: 't-c', prefix: 'CA', title: '矯正措施', ds: 'capas', fields: function () { return [
        { key: 'findingId', label: '對應發現', type: 'select', required: true, options: d.findings.map(function (f) { return { value: f.id, label: f.id + ' ' + f.description }; }) },
        { key: 'rootCause', label: '根因', type: 'textarea', required: true }, { key: 'action', label: '矯正行動', type: 'textarea', required: true },
        { key: 'owner', label: 'Owner', type: 'text', required: true }, { key: 'dueDate', label: 'Due Date', type: 'date', required: true }, { key: 'status', label: 'Status', type: 'select', required: true, options: CS },
        { key: 'effectiveness', label: '有效性確認', type: 'textarea', help: '結案前確認行動有效（10.2）' }]; },
        columns: [{ key: 'id', label: 'CAPA ID' }, { key: 'findingId', label: 'Finding' }, { key: 'rootCause', label: 'Root Cause', wrap: true }, { key: 'action', label: 'Action', wrap: true }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due', render: function (r) { return due(r, ['Closed']); } }, { key: 'status', label: 'Status' }] },
      reviews: { el: 't-r', prefix: 'MR', title: '管理審查', ds: null, fields: function () { return [
        { key: 'date', label: '日期', type: 'date', required: true }, { key: 'chair', label: '主持人', type: 'text', required: true },
        { key: 'inputs', label: '已涵蓋之 9.3.2 輸入', type: 'multi', options: ISO.reviewInputs.map(function (i) { return { value: i.id, label: '(' + i.id + ') ' + i.zh }; }) },
        { key: 'decisions', label: '決議（9.3.3：改善機會、ISMS 變更需求）', type: 'textarea' }, { key: 'status', label: 'Status', type: 'select', required: true, options: RS }]; },
        columns: [{ key: 'id', label: 'Review ID' }, { key: 'date', label: 'Date' }, { key: 'chair', label: 'Chair' }, { key: 'inputs', label: 'Inputs (a–g)', get: function (r) { return (r.inputs || []).length; }, render: function (r) { var have = r.inputs || []; return ISO.reviewInputs.map(function (i) { return have.indexOf(i.id) >= 0 ? P.chip('✓ ' + i.id, 'ok') : P.chip('✕ ' + i.id, 'bad'); }).join(''); } }, { key: 'decisions', label: 'Decisions', wrap: true }, { key: 'status', label: 'Status' }] }
    };
    function load() {
      return W.load(['audits', 'findings', 'capas', 'reviews']).then(function (x) {
        d = x;
        P.notice(document.getElementById('c6-notice'), W.usesDefaults(x), { edit: '#audits', dataset: 'findings' });
        var openNC = x.findings.filter(function (f) { return f.status !== 'Closed' && (f.type === 'MAJOR_NC' || f.type === 'MINOR_NC'); }).length;
        var od = x.capas.filter(function (c) { return overdue(c, ['Closed']); }).length;
        document.getElementById('stats').innerHTML = [['已完成稽核', x.audits.filter(function (a) { return a.status === 'Completed'; }).length + ' / ' + x.audits.length, ''], ['未結不符合事項', openNC, openNC ? 'warn' : 'ok'], ['逾期矯正措施', od, od ? 'bad' : 'ok'], ['管理審查', x.reviews.filter(function (r) { return r.status === 'Held'; }).length + ' 次', '']].map(function (s) {
          return '<div class="c6-stat' + (s[2] ? ' c6-stat--' + s[2] : '') + '"><span class="c6-stat__label">' + s[0] + '</span><span class="c6-stat__value">' + s[1] + '</span></div>';
        }).join('');
        Object.keys(DEF).forEach(function (col) {
          if (t[col]) { t[col].setRows(x[col]); return; }
          var def = DEF[col];
          t[col] = C.ui.table.create(document.getElementById(def.el), {
            caption: def.title, rows: x[col], columns: def.columns.concat([{ key: 'source', label: 'Provenance', render: function (r) { return P.prov(r.source); } }]),
            actions: ['edit', 'delete'],
            toolbar: '<button type="button" class="c6-btn c6-btn--primary" data-add="' + col + '">' + C.ui.icons.icon('plus') + '新增' + def.title + '</button>' + (def.ds ? '<a class="c6-btn c6-btn--secondary" href="data-import.html?ds=' + def.ds + '">' + C.ui.icons.icon('upload') + '匯入</a>' : '') + '<button type="button" class="c6-btn c6-btn--ghost" data-exp="' + col + '">' + C.ui.icons.icon('download') + '匯出 CSV</button>',
            onAction: function (a, r) { if (a === 'edit') edit(col, r); else C.ui.form.confirm('刪除 ' + r.id + '？', '刪除').then(function (ok) { if (ok) W.remove(col, r.id).then(load); }); }
          });
        });
      });
    }
    function edit(col, r) {
      var def = DEF[col], isNew = !r;
      C.ui.form.open({ title: (isNew ? '新增' : '編輯 ') + (isNew ? def.title : r.id), fields: def.fields(), values: r || { status: def.fields().filter(function (f) { return f.key === 'status'; })[0].options[0], inputs: [] },
        validate: col === 'capas' ? function (v) { return v.status === 'Closed' && !v.effectiveness ? { effectiveness: '結案前請記錄有效性確認' } : {}; } : null })
        .then(function (v) { if (!v) return; var rec = Object.assign({}, r || {}, v); if (isNew) rec.id = D.nextId(def.prefix, d[col]); return W.save(col, rec, { verb: isNew ? '新增' : '更新' }).then(function () { D.toast(rec.id + ' 已儲存'); return load(); }); });
    }
    page.addEventListener('click', function (e) {
      var a = e.target.closest('[data-add]'); if (a) { edit(a.getAttribute('data-add'), null); return; }
      var x = e.target.closest('[data-exp]'); if (x) { var col = x.getAttribute('data-exp'), def = DEF[col];
        C.services.exporter.downloadCSV({ name: def.title, rows: t[col].visible(), notes: P.exportNotes(d[col]), columns: def.columns.map(function (c) { return { key: c.key, label: c.label, get: c.get }; }).concat([{ key: 'source', label: 'Data Provenance' }]) }, 'CAT6_ISO_' + col); }
    });
    return load().then(function () { page.removeAttribute('aria-busy'); if (location.hash) { var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); } });
  });
})(globalThis.CAT6);
