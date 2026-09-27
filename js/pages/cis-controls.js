/* CIS Controls v8.1 — control-level assessment per Implementation Group, coverage, gaps, safeguard mapping
 * (official safeguard list must be imported), and links to risks / treatments. Coverage = implemented / assessed (plain counts). */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, E = C.calc.cisControls, F = C.util.format, esc = D.esc;
  var ST = {}; C.data.cis.statuses.forEach(function (s) { ST[s.id] = s; });
  var IGS = ['ig1', 'ig2', 'ig3'];
  function st(id) { var s = ST[id || 'NOT_ASSESSED']; return '<span class="c6-st c6-st--' + s.id + '"><span class="c6-st__g" aria-hidden="true">' + s.shape + '</span>' + s.zh + '</span>'; }
  function title(id) { var c = C.data.cis.controls.filter(function (x) { return x.id === id; })[0]; return c ? c.title + (c.zh ? '（' + c.zh + '）' : '') : id; }
  var OPTS = C.data.cis.statuses.map(function (s) { return { value: s.id, label: s.shape + ' ' + s.zh + '（' + s.id + '）' }; });

  P.boot({ nav: 'cis', group: 'assessment' }, function () {
    var page = document.getElementById('page'), tbl, sgTbl, data;
    page.innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">CIS Critical Security Controls v8.1</h2><p class="c6-intro__text">以 18 項控制為單位，分別評估 IG1 / IG2 / IG3 的實施狀態。覆蓋率 = 已實施 ÷ 已評估（不含未評估與不適用），為單純計數、無加權。Safeguard 層級請匯入 CIS 官方活頁簿。</p></div>' +
      '<div class="c6-grid">' +
      P.card('cov', 'Coverage by Implementation Group', '已實施 / 已評估', '<div id="cov-c"></div><p class="c6-chart-summary" id="cov-s"></p>') +
      P.card('gap', 'Gap（目標 IG）', '目標 IG 及其以下未達「已實施」的控制', '<div id="gap-b"></div>', { span: 2 }) + '</div>' +
      P.card('ctl', 'Control Assessment', '點狀態可直接修改；形狀 + 文字表示狀態', '<div id="tbl"></div>') +
      P.card('sg', 'Safeguard Mapping', 'CIS 官方 Safeguard 清單（匯入）', '<div id="sg-b"></div>');

    function load() {
      return W.load(['cisControls', 'cisSafeguards', 'risks', 'treatments', 'cisram']).then(function (d) {
        data = d;
        /* Make sure all 18 controls are present (missing ones are NOT_ASSESSED, not implied). */
        var have = {}; d.cisControls.forEach(function (r) { have[r.id] = r; });
        data.rows = C.data.cis.controls.map(function (c) { return have[c.id] || { id: c.id, ig1: 'NOT_ASSESSED', ig2: 'NOT_ASSESSED', ig3: 'NOT_ASSESSED', notes: '', source: 'USER_INPUT', _virtual: true }; });
        P.notice(document.getElementById('c6-notice'), W.usesDefaults({ c: d.cisControls }), { edit: '#ctl', dataset: 'cisControls' });
        var cov = E.coverageByIG(data.rows);
        C.charts.hbars.bars(document.getElementById('cov-c'), IGS.map(function (k) {
          var c = cov[k]; return { label: k.toUpperCase(), value: c.coverage, text: c.coverage == null ? null : F.pct(c.coverage), tip: k.toUpperCase() + '：已實施 ' + c.counts.IMPLEMENTED + ' / 已評估 ' + c.assessed };
        }), { label: 'CIS Controls 各 IG 覆蓋率' });
        document.getElementById('cov-s').textContent = IGS.map(function (k) { var c = cov[k]; return k.toUpperCase() + ' ' + (c.coverage == null ? 'DATA REQUIRED' : F.pct(c.coverage) + '（' + c.counts.IMPLEMENTED + '/' + c.assessed + '，部分 ' + c.counts.PARTIAL + '，未實施 ' + c.counts.NOT_IMPLEMENTED + '，未評估 ' + c.counts.NOT_ASSESSED + '）'); }).join('；') + '。';
        renderGap();
        if (tbl) tbl.setRows(data.rows); else build();
        renderSafeguards();
      });
    }
    function renderGap() {
      var target = W.assessment.targetIG || 'IG1', g = E.gaps(data.rows, target);
      document.getElementById('gap-b').innerHTML = '<div class="c6-stack"><div class="c6-row"><label class="c6-field c6-field--inline"><span class="c6-var__lbl">目標 IG</span><select class="c6-input" id="tig">' +
        C.data.cis.igs.map(function (i) { return '<option value="' + i.id + '"' + (i.id === target ? ' selected' : '') + '>' + i.id + ' · ' + esc(i.zh) + '</option>'; }).join('') + '</select></label>' +
        '<span class="c6-chip c6-chip--' + (g.length ? 'warn' : 'ok') + '">' + g.length + ' / 18 控制有差距</span></div>' +
        (g.length ? '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">差距清單</caption><thead><tr><th scope="col">Control</th><th scope="col">未達 IG</th><th scope="col">關聯風險</th><th scope="col">處理計畫</th></tr></thead><tbody>' +
          g.map(function (x) {
            var rk = data.risks.filter(function (r) { return (r.cisControls || []).indexOf(x.id) >= 0; }), tr = data.treatments.filter(function (t) { return t.refs && (t.refs.cis || []).indexOf(x.id) >= 0; });
            return '<tr><td class="c6-t-wrap"><strong>' + x.id + '</strong> ' + esc(title(x.id)) + '</td><td>' + x.missing.map(function (k) { var row = data.rows.filter(function (r) { return r.id === x.id; })[0]; return k.toUpperCase() + ' ' + st(row[k]); }).join('<br>') + '</td><td>' + (rk.length ? rk.map(function (r) { return '<a class="c6-link" href="risk-register.html?id=' + r.id + '">' + r.id + '</a>'; }).join(' ') : '<span class="c6-muted">—</span>') + '</td><td>' + (tr.length ? tr.map(function (t) { return '<a class="c6-link" href="risk-treatment.html">' + t.id + '</a>'; }).join(' ') : '<span class="c6-chip c6-chip--warn">無處理計畫</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="c6-note">目標 IG 內所有控制皆已實施或不適用。</p>') + '</div>';
      document.getElementById('tig').addEventListener('change', function (e) {
        W.saveAssessment(Object.assign({}, W.assessment, { targetIG: e.target.value })).then(function () { D.toast('目標 IG 已設為 ' + e.target.value); renderGap(); });
      });
    }
    function build() {
      tbl = C.ui.table.create(document.getElementById('tbl'), {
        caption: 'CIS Controls v8.1 assessment', rows: data.rows,
        columns: [
          { key: 'id', label: 'Control' },
          { key: 'title', label: 'Title', wrap: true, get: function (r) { return title(r.id); } },
          { key: 'ig1', label: 'IG1', render: function (r) { return '<button type="button" class="c6-st c6-st--' + (r.ig1 || 'NOT_ASSESSED') + '" data-cell="ig1" aria-label="修改 ' + r.id + ' IG1 狀態">' + ST[r.ig1 || 'NOT_ASSESSED'].shape + ' ' + ST[r.ig1 || 'NOT_ASSESSED'].zh + '</button>'; } },
          { key: 'ig2', label: 'IG2', render: function (r) { return '<button type="button" class="c6-st c6-st--' + (r.ig2 || 'NOT_ASSESSED') + '" data-cell="ig2" aria-label="修改 ' + r.id + ' IG2 狀態">' + ST[r.ig2 || 'NOT_ASSESSED'].shape + ' ' + ST[r.ig2 || 'NOT_ASSESSED'].zh + '</button>'; } },
          { key: 'ig3', label: 'IG3', render: function (r) { return '<button type="button" class="c6-st c6-st--' + (r.ig3 || 'NOT_ASSESSED') + '" data-cell="ig3" aria-label="修改 ' + r.id + ' IG3 狀態">' + ST[r.ig3 || 'NOT_ASSESSED'].shape + ' ' + ST[r.ig3 || 'NOT_ASSESSED'].zh + '</button>'; } },
          { key: 'map', label: 'Risks / Treatments', get: function (r) { return data.risks.filter(function (x) { return (x.cisControls || []).indexOf(r.id) >= 0; }).length; }, render: function (r) {
            var rk = data.risks.filter(function (x) { return (x.cisControls || []).indexOf(r.id) >= 0; }).map(function (x) { return x.id; }), tr = data.treatments.filter(function (t) { return t.refs && (t.refs.cis || []).indexOf(r.id) >= 0; }).map(function (t) { return t.id; }),
              cr = data.cisram.filter(function (x) { return (x.safeguards || []).indexOf(r.id) >= 0; }).map(function (x) { return x.id; });
            return (rk.concat(tr, cr).length ? P.chips(rk, 'accent') + ' ' + P.chips(tr) + ' ' + P.chips(cr) : '<span class="c6-muted">—</span>'); } },
          { key: 'source', label: 'Provenance', render: function (r) { return r._virtual ? P.dataRequired('尚未評估') : P.prov(r.source); } }
        ],
        filters: [{ key: 'gapf', label: '狀態（任一 IG）', get: function (r) { return [r.ig1, r.ig2, r.ig3]; }, options: OPTS }],
        actions: ['edit'],
        toolbar: '<a class="c6-btn c6-btn--secondary" href="data-import.html?ds=cisControls">' + C.ui.icons.icon('upload') + '匯入</a>' + P.exportButtons(),
        onAction: function (a, r) { edit(r); }
      });
      document.getElementById('tbl').addEventListener('click', function (e) {
        var b = e.target.closest('[data-cell]'); if (!b) return;
        var id = b.closest('tr').getAttribute('data-id'), r = data.rows.filter(function (x) { return x.id === id; })[0], k = b.getAttribute('data-cell');
        C.ui.form.open({ title: id + ' · ' + k.toUpperCase(), subtitle: esc(title(id)), fields: [{ key: k, label: k.toUpperCase() + ' 實施狀態', type: 'select', required: true, options: OPTS }], values: r }).then(function (v) {
          if (!v) return; var rec = Object.assign({}, r, v); delete rec._virtual; return W.save('cisControls', rec).then(load);
        });
      });
      P.bindExport(document.getElementById('ctl'), exportAs);
    }
    function edit(r) {
      C.ui.form.open({ title: '編輯 ' + r.id, subtitle: esc(title(r.id)), fields: [
        { key: 'ig1', label: 'IG1', type: 'select', required: true, options: OPTS }, { key: 'ig2', label: 'IG2', type: 'select', required: true, options: OPTS },
        { key: 'ig3', label: 'IG3', type: 'select', required: true, options: OPTS }, { key: 'notes', label: '備註 / 證據位置', type: 'textarea' }], values: r }).then(function (v) {
        if (!v) return; var rec = Object.assign({}, r, v); delete rec._virtual; return W.save('cisControls', rec).then(function () { D.toast(r.id + ' 已更新'); return load(); });
      });
    }
    function renderSafeguards() {
      var box = document.getElementById('sg-b'), sg = data.cisSafeguards;
      if (!sg.length) {
        box.innerHTML = '<div class="c6-callout c6-callout--warn"><strong>DATA REQUIRED：CIS v8.1 Safeguard 清單</strong><br>CAT.6 未內建 Safeguard 條文（CIS 授權內容）。請自 CIS 官網下載 v8.1 官方活頁簿，整理成 CAT6_CIS_Safeguards_Template（Safeguard ID、Title、IG1、IG2、IG3、Status）後匯入；匯入後本區會顯示 Safeguard 層級覆蓋率與搜尋。</div><div class="c6-actions" style="margin-top:.75rem"><a class="c6-btn c6-btn--primary" href="data-import.html?ds=cisSafeguards">匯入 Safeguards</a><a class="c6-btn c6-btn--ghost" href="frameworks.html#CISV81">CIS Controls 說明</a></div>';
        return;
      }
      var cov = E.safeguardCoverage(sg);
      box.innerHTML = '<div class="c6-stats">' + IGS.map(function (k) { var c = cov[k]; return '<div class="c6-stat"><span class="c6-stat__label">' + k.toUpperCase() + ' Safeguards（' + c.total + '）</span><span class="c6-stat__value">' + (c.coverage == null ? '—' : F.pct(c.coverage)) + '</span><span class="c6-note">已實施 ' + c.implemented + ' / 已評估 ' + c.assessed + '</span></div>'; }).join('') + '</div><div id="sg-t" style="margin-top:1rem"></div>';
      sgTbl = C.ui.table.create(document.getElementById('sg-t'), {
        caption: 'CIS Safeguards', rows: sg.slice().sort(function (a, b) { var x = a.id.split('.'), y = b.id.split('.'); return x[0] - y[0] || x[1] - y[1]; }),
        columns: [{ key: 'id', label: 'Safeguard' }, { key: 'title', label: 'Title', wrap: true }, { key: 'ig', label: 'IG', get: function (s) { return IGS.filter(function (k) { return s[k]; }).map(function (k) { return k.toUpperCase(); }).join(' '); } },
          { key: 'status', label: 'Status', render: function (s) { return st(s.status); } }, { key: 'source', label: 'Provenance', render: function (s) { return P.prov(s.source); } }],
        filters: [{ key: 'ctl', label: 'Control', get: function (s) { var n = +s.id.split('.')[0]; return 'CIS-' + (n < 10 ? '0' : '') + n; }, options: C.data.cis.controls.map(function (c) { return c.id; }) },
          { key: 'igf', label: 'IG', get: function (s) { return IGS.filter(function (k) { return s[k]; }).map(function (k) { return k.toUpperCase(); }); }, options: ['IG1', 'IG2', 'IG3'] },
          { key: 'status', label: 'Status', options: C.data.cis.statuses.map(function (s) { return s.id; }) }],
        actions: ['edit'],
        onAction: function (a, s) { C.ui.form.open({ title: s.id + ' ' + s.title, fields: [{ key: 'status', label: '實施狀態', type: 'select', required: true, options: OPTS }], values: s }).then(function (v) { if (v) W.save('cisSafeguards', Object.assign({}, s, v)).then(load); }); }
      });
    }
    function exportAs(kind) {
      var tables = [{ name: 'CIS Controls', rows: data.rows, notes: P.exportNotes(data.rows).concat(['Coverage = implemented / assessed (plain counts, no weighting).']), columns: [
        { key: 'id', label: 'Control ID' }, { key: 'title', label: 'Title', get: function (r) { return title(r.id); } }, { key: 'ig1', label: 'IG1 Status' }, { key: 'ig2', label: 'IG2 Status' }, { key: 'ig3', label: 'IG3 Status' }, { key: 'notes', label: 'Notes' },
        { key: 'source', label: 'Data Provenance', get: function (r) { return r._virtual ? 'NOT_ASSESSED' : r.source; } }] }];
      if (data.cisSafeguards.length) tables.push({ name: 'CIS Safeguards', rows: data.cisSafeguards, columns: [{ key: 'id', label: 'Safeguard ID' }, { key: 'title', label: 'Title' }, { key: 'ig1', label: 'IG1' }, { key: 'ig2', label: 'IG2' }, { key: 'ig3', label: 'IG3' }, { key: 'status', label: 'Status' }, { key: 'source', label: 'Data Provenance' }] });
      if (kind === 'csv') C.services.exporter.downloadCSV(tables[0], 'CAT6_CIS_Controls'); else C.services.exporter.downloadXLSX(tables, 'CAT6_CIS_Controls');
    }
    return load().then(function () { page.removeAttribute('aria-busy'); });
  });
})(globalThis.CAT6);
