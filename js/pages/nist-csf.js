/* NIST CSF 2.0 — Current / Target profile per Category, gap, improvement actions and progress by Function.
 * Ratings use the CSF 2.0 Readiness Index 0–3 (platform-defined, not an official NIST score). Gap = Target − Current;
 * Target not entered → CAT.6 default 3 (Fully Implemented). Readiness % and Level from 正式的_Readiness_評分方法.pdf. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, E = C.calc.csf, CSF = C.data.csf, esc = D.esc;
  var CAT = {}; CSF.categories.forEach(function (c) { CAT[c.id] = c; });
  var SCALE = CSF.scale.map(function (s) { return { value: s.v, label: s.v + ' · ' + s.zh + '（' + s.en + '）' }; });
  function scaleTxt(v) { var s = CSF.scale[v]; return s != null && v != null ? v + ' ' + s.zh : null; }

  P.boot({ nav: 'csf', group: 'assessment' }, function () {
    var page = document.getElementById('page'), tbl, data;
    page.innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">NIST Cybersecurity Framework 2.0 Profile</h2><p class="c6-intro__text">GOVERN · IDENTIFY · PROTECT · DETECT · RESPOND · RECOVER 共 22 個 Categories，分別記錄 Current Profile、Target Profile、差距與改善行動。</p></div>' +
      '<div class="c6-callout">' + esc(CSF.scaleNote) + ' 差距 = Target − Current（純差值）；Function 數值為已評估 Categories 的平均。</div>' +
      '<div class="c6-grid">' + P.card('rdy', 'CSF 2.0 Readiness', '平台自訂 Index，非 NIST 官方分數', '<div id="rdy-b"></div>') + P.card('tier', 'Implementation Tiers', '治理成熟度描述（不作為分數）', '<div id="tier-b"></div>', { span: 2 }) + '</div>' +
      '<div class="c6-fcards" id="fcards"></div>' +
      '<div class="c6-grid">' + P.card('prof', 'Current → Target by Function', '○ Current · ● Target（0–3）', '<div id="cmp"></div><p class="c6-chart-summary" id="cmp-s"></p>', { span: 2 }) +
      P.card('prog', 'Progress', '已達目標之 Categories 比例', '<div id="prog-c"></div><p class="c6-chart-summary" id="prog-s"></p>') + '</div>' +
      P.card('cats', 'Category Profile & Improvement Actions', '篩選 Function、只看有差距者', '<div id="tbl"></div>');

    function load() {
      return W.load(['csf']).then(function (d) {
        var have = {}; d.csf.forEach(function (r) { have[r.id] = r; });
        data = CSF.categories.map(function (c) { return have[c.id] || { id: c.id, current: null, target: null, action: '', owner: '', dueDate: '', _virtual: true }; });
        P.notice(document.getElementById('c6-notice'), W.usesDefaults({ csf: d.csf }), { edit: '#cats', dataset: 'csf' });
        var fn = E.byFunction(data), R = E.readiness(data), a = W.assessment;
        var tierName = function (v) { var t = CSF.tiers.filter(function (x) { return String(x.id) === String(v); })[0]; return t ? 'Tier ' + t.id + ' ' + t.en : null; };
        document.getElementById('rdy-b').innerHTML = R.percent == null ? P.dataRequired('尚無 Current 評分') :
          '<p class="c6-kpi__value"><span class="c6-num">' + R.percent + '%</span> <span class="c6-chip c6-chip--accent">' + R.level.en + '</span></p><p class="c6-note">' + esc(R.level.text) + '。依 ' + R.assessed + ' / 22 個已評分 Categories：Σ Current ÷ (3 × ' + R.assessed + ')。</p>' +
          '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">Readiness levels</caption><thead><tr><th scope="col">Readiness</th><th scope="col">Level</th><th scope="col">意義</th></tr></thead><tbody>' +
          CSF.readinessLevels.map(function (l) { return '<tr' + (l.id === R.level.id ? ' aria-current="true" style="font-weight:600"' : '') + '><td>' + l.min + '–' + l.max + '%</td><td>' + (l.id === R.level.id ? '▶ ' : '') + l.en + '</td><td>' + esc(l.text) + '</td></tr>'; }).join('') + '</tbody></table></div>';
        document.getElementById('tier-b').innerHTML = '<p class="c6-note">組織 Tier：' + (a.csfTierCurrent ? esc(tierName(a.csfTierCurrent)) + (a.csfTierTarget ? ' → 目標 ' + esc(tierName(a.csfTierTarget)) : '') : '未填（於 <a class="c6-link" href="risk-assessment.html#setup">Assessment Setup</a> 選填）') + '</p>' +
          '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">CSF 2.0 Implementation Tiers</caption><thead><tr><th scope="col">Tier</th><th scope="col">官方名稱</th><th scope="col">評估意義</th></tr></thead><tbody>' +
          CSF.tiers.map(function (t) { return '<tr><td>Tier ' + t.id + '</td><td>' + t.en + '</td><td>' + esc(t.text) + '</td></tr>'; }).join('') + '</tbody></table></div>';
        document.getElementById('fcards').innerHTML = fn.map(function (f) {
          var at = data.filter(function (r) { return r.id.indexOf(f.id + '.') === 0 && E.valid(r.current) && r.current >= E.target(r); }).length;
          return '<article class="c6-fcard"><h3>' + f.name + ' <span class="c6-muted">' + f.zh + '</span></h3>' +
            (f.current == null ? '<p>' + P.dataRequired('尚未評估') + '</p>' : '<p>Readiness <strong class="c6-num">' + f.readiness.percent + '%</strong> ' + (f.readiness.level ? f.readiness.level.en : '') + '</p><p>Current <strong class="c6-num">' + f.current.toFixed(1) + '</strong> → Target <strong class="c6-num">' + f.target.toFixed(1) + '</strong> · Gap <strong class="c6-num">' + f.gap.toFixed(1) + '</strong></p>') +
            '<div class="c6-mini"><span class="c6-mini__track" role="img" aria-label="' + f.name + ' 已達目標 ' + at + ' / ' + f.total + '"><span class="c6-mini__fill" style="width:' + (at / f.total * 100) + '%"></span></span><span>' + at + '/' + f.total + '</span></div>' +
            '<p>已評估 ' + f.assessed + ' / ' + f.total + ' · 待改善 ' + f.openActions + '</p></article>';
        }).join('');
        C.charts.hbars.compare(document.getElementById('cmp'), fn.map(function (f) { return { label: f.name, before: f.current, after: f.target, tipBefore: 'Current ' + (f.current == null ? '—' : f.current.toFixed(2)), tipAfter: 'Target ' + (f.target == null ? '—' : f.target.toFixed(2)) }; }), { label: 'CSF Current vs Target', max: 3, ticks: [0, 1, 2, 3] });
        var biggest = fn.filter(function (f) { return f.gap != null; }).sort(function (a, b) { return b.gap - a.gap; })[0];
        document.getElementById('cmp-s').textContent = fn.map(function (f) { return f.name + ' ' + (f.current == null ? 'DATA REQUIRED' : f.current.toFixed(1) + '→' + f.target.toFixed(1)); }).join('；') + (biggest ? '。差距最大：' + biggest.name + '（' + biggest.gap.toFixed(1) + '）。' : '。');
        C.charts.hbars.bars(document.getElementById('prog-c'), fn.map(function (f) {
          var at = data.filter(function (r) { return r.id.indexOf(f.id + '.') === 0 && E.valid(r.current) && r.current >= E.target(r); }).length;
          return { label: f.name, value: f.assessed ? at / f.total : null, text: at + '/' + f.total };
        }), { label: '各 Function 已達目標比例' });
        var tot = data.filter(function (r) { return E.valid(r.current) && r.current >= E.target(r); }).length;
        document.getElementById('prog-s').textContent = '22 個 Categories 中 ' + tot + ' 個已達 Target Profile。';
        if (tbl) tbl.setRows(data); else build();
      });
    }
    function build() {
      tbl = C.ui.table.create(document.getElementById('tbl'), {
        caption: 'CSF 2.0 categories', rows: data,
        columns: [
          { key: 'id', label: 'Category' }, { key: 'name', label: 'Name', wrap: true, get: function (r) { return CAT[r.id].name; } },
          { key: 'current', label: 'Current', get: function (r) { return r.current; }, render: function (r) { return scaleTxt(r.current) ? esc(scaleTxt(r.current)) : P.dataRequired(); } },
          { key: 'target', label: 'Target', get: function (r) { return E.target(r); }, render: function (r) { var t = E.target(r); return t == null ? P.dataRequired() : esc(scaleTxt(t)) + (E.targetIsDefault(r) ? ' ' + P.prov('CAT6_DEFAULT') : ''); } },
          { key: 'gap', label: 'Gap', num: true, get: function (r) { return E.gap(r); }, render: function (r) { var g = E.gap(r); return g == null ? '—' : g > 0 ? '<span class="c6-chip c6-chip--warn">▲ ' + g + '</span>' : '<span class="c6-chip c6-chip--ok">✓ 0</span>'; } },
          { key: 'action', label: 'Improvement Action', wrap: true }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due' },
          { key: 'source', label: 'Provenance', render: function (r) { return r._virtual ? P.dataRequired('尚未評估') : P.prov(r.source); } }
        ],
        filters: [{ key: 'fn', label: 'Function', get: function (r) { return r.id.slice(0, 2); }, options: CSF.functions.map(function (f) { return { value: f.id, label: f.name }; }) },
          { key: 'g', label: 'Gap', get: function (r) { var g = E.gap(r); return g == null ? 'NA' : g > 0 ? 'GAP' : 'MET'; }, options: [{ value: 'GAP', label: '有差距' }, { value: 'MET', label: '已達目標' }, { value: 'NA', label: '未評估' }] }],
        actions: ['edit'],
        toolbar: '<a class="c6-btn c6-btn--secondary" href="data-import.html?ds=csf">' + C.ui.icons.icon('upload') + '匯入</a>' + P.exportButtons(),
        onAction: function (a, r) { edit(r); }
      });
      P.bindExport(document.getElementById('cats'), exportAs);
    }
    function edit(r) {
      C.ui.form.open({ title: r.id + ' · ' + CAT[r.id].name, subtitle: 'CSF 2.0 Readiness Index 0–3（平台自訂，非 NIST 官方分數）；Target 留白 = 預設 3 完整實施', fields: [
        { key: 'current', label: 'Current Profile', type: 'select', options: SCALE, required: true }, { key: 'target', label: 'Target Profile', type: 'select', options: SCALE },
        { key: 'action', label: 'Improvement Action 改善行動', type: 'textarea' }, { key: 'owner', label: 'Owner', type: 'text' }, { key: 'dueDate', label: 'Due Date', type: 'date' }
      ], values: r, validate: function (v) { var t = v.target == null || v.target === '' ? 3 : +v.target; return v.current != null && v.current !== '' && t > +v.current && !v.action ? { action: '有差距時請填寫改善行動' } : {}; } }).then(function (v) {
        if (!v) return; v.current = v.current === '' || v.current == null ? null : +v.current; v.target = v.target === '' || v.target == null ? null : +v.target;
        var rec = Object.assign({}, r, v); delete rec._virtual; return W.save('csf', rec).then(function () { D.toast(r.id + ' 已更新'); return load(); });
      });
    }
    function exportAs(kind) {
      var t = { name: 'NIST CSF 2.0 Profile', rows: tbl.visible(), notes: P.exportNotes(data).concat([CSF.scaleNote, 'Gap = Target - Current.']), columns: [
        { key: 'id', label: 'Category ID' }, { key: 'fn', label: 'Function', get: function (r) { return CSF.functions.filter(function (f) { return f.id === r.id.slice(0, 2); })[0].name; } },
        { key: 'name', label: 'Category', get: function (r) { return CAT[r.id].name; } }, { key: 'current', label: 'Current (0-3)' }, { key: 'target', label: 'Target (0-3)', get: function (r) { return E.target(r); } }, { key: 'tdef', label: 'Target Source', get: function (r) { return E.targetIsDefault(r) ? 'CAT6_DEFAULT' : ''; } },
        { key: 'gap', label: 'Gap', get: function (r) { var g = E.gap(r); return g == null ? 'DATA REQUIRED' : g; } }, { key: 'action', label: 'Improvement Action' }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due Date' },
        { key: 'source', label: 'Data Provenance', get: function (r) { return r._virtual ? 'NOT_ASSESSED' : r.source; } }] };
      if (kind === 'csv') C.services.exporter.downloadCSV(t, 'CAT6_NIST_CSF'); else C.services.exporter.downloadXLSX([t], 'CAT6_NIST_CSF');
    }
    return load().then(function () { page.removeAttribute('aria-busy'); });
  });
})(globalThis.CAT6);
