/* ISO/IEC 27001:2022 Gap Assessment (Clauses 4–10) and Statement of Applicability (Annex A, 93 controls).
 * Only identifiers and short titles are shown — requirement text is not reproduced. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, F = C.util.format, esc = D.esc, ISO = C.data.iso;
  var CST = [{ value: 'NOT_ASSESSED', label: '○ 未評估' }, { value: 'NOT_IMPLEMENTED', label: '✕ 未實施' }, { value: 'PARTIAL', label: '◐ 部分實施' }, { value: 'IMPLEMENTED', label: '● 已實施' }];
  var IST = [{ value: 'NOT_IMPLEMENTED', label: '✕ 未實施' }, { value: 'PARTIAL', label: '◐ 部分實施' }, { value: 'IMPLEMENTED', label: '● 已實施' }];
  var SH = { NOT_ASSESSED: ['○', '未評估'], NOT_IMPLEMENTED: ['✕', '未實施'], PARTIAL: ['◐', '部分實施'], IMPLEMENTED: ['●', '已實施'] };
  function st(id) { var s = SH[id || 'NOT_ASSESSED']; return '<span class="c6-st c6-st--' + (id || 'NOT_ASSESSED') + '"><span class="c6-st__g" aria-hidden="true">' + s[0] + '</span>' + s[1] + '</span>'; }
  var CLS = ISO.clauses.map(function (c) { return [c.id, c.clause, c.title, c.zh]; });
  var CL = {}; CLS.forEach(function (c) { CL[c[0]] = c; });
  var AX = {}; ISO.annexA.forEach(function (a) { AX[a.id] = a; });

  P.boot({ nav: 'iso-gap', group: 'iso' }, function () {
    var page = document.getElementById('page'), d, ct, st2;
    page.innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">Gap Assessment & Statement of Applicability</h2><p class="c6-intro__text">第 4–10 章條款的差異評估，以及 Annex A 93 項控制的適用性聲明（適用 / 排除、排除理由、實施狀態、關聯風險）。' + esc(ISO.note) + '</p></div>' +
      '<div class="c6-grid">' + P.card('gsum', 'Gap by Chapter', '已實施條款 / 條款數', '<div id="gc"></div><p class="c6-chart-summary" id="gs"></p>') +
      P.card('ssum', 'SoA Summary', '依主題：已決定 / 適用 / 已實施', '<div id="sc"></div><p class="c6-chart-summary" id="ss"></p>', { span: 2 }) + '</div>' +
      P.card('clauses', 'Clause Gap Assessment（4–10）', '篩選章節與狀態', '<div id="ct"></div>') +
      P.card('soa', 'Statement of Applicability（Annex A）', '未決定之控制顯示為「未決定」，不預設為適用', '<div id="st"></div>');

    function load() {
      return W.load(['isoClauses', 'isoSoa', 'risks', 'treatments']).then(function (x) {
        d = x;
        var cBy = {}; x.isoClauses.forEach(function (c) { cBy[c.id] = c; });
        d.clauseRows = CLS.map(function (c) { return cBy[c[0]] || { id: c[0], status: 'NOT_ASSESSED', gapNote: '', owner: '', dueDate: '', _virtual: true }; });
        var sBy = {}; x.isoSoa.forEach(function (s) { sBy[s.id] = s; });
        /* Annex A controls referenced by treatments → linked risks (derived, not stored). */
        var link = {}; x.treatments.forEach(function (t) { ((t.refs && t.refs.iso) || []).forEach(function (a) { (link[a] = link[a] || []).push(t.riskId); }); });
        d.link = link;
        d.soaRows = ISO.annexA.map(function (a) { return sBy[a.id] || { id: a.id, applicable: null, status: null, justification: '', linkedRisks: [], _virtual: true }; });
        P.notice(document.getElementById('c6-notice'), W.usesDefaults({ a: x.isoClauses, b: x.isoSoa }), { edit: '#clauses', dataset: 'isoClauses' });
        var chapters = ['4', '5', '6', '7', '8', '9', '10'];
        C.charts.hbars.bars(document.getElementById('gc'), chapters.map(function (ch) {
          var rs = d.clauseRows.filter(function (r) { return CL[r.id][1] === ch; }), done = rs.filter(function (r) { return r.status === 'IMPLEMENTED'; }).length;
          return { label: '第 ' + ch + ' 章', value: done / rs.length, text: done + '/' + rs.length };
        }), { label: '各章已實施條款比例' });
        var cnt = {}; d.clauseRows.forEach(function (r) { cnt[r.status] = (cnt[r.status] || 0) + 1; });
        document.getElementById('gs').textContent = '25 個條款：已實施 ' + (cnt.IMPLEMENTED || 0) + '、部分 ' + (cnt.PARTIAL || 0) + '、未實施 ' + (cnt.NOT_IMPLEMENTED || 0) + '、未評估 ' + (cnt.NOT_ASSESSED || 0) + '。';
        C.charts.hbars.bars(document.getElementById('sc'), Object.keys(ISO.themes).map(function (t) {
          var rs = d.soaRows.filter(function (r) { return AX[r.id].theme === t; }), dec = rs.filter(function (r) { return r.applicable === true || r.applicable === false; }).length;
          return { label: ISO.themes[t], value: dec / rs.length, text: dec + '/' + rs.length, tip: '已決定 ' + dec + '，適用 ' + rs.filter(function (r) { return r.applicable === true; }).length + '，已實施 ' + rs.filter(function (r) { return r.applicable === true && r.status === 'IMPLEMENTED'; }).length };
        }), { label: 'SoA 各主題已決定比例' });
        var ap = d.soaRows.filter(function (r) { return r.applicable === true; }), ex = d.soaRows.filter(function (r) { return r.applicable === false; });
        document.getElementById('ss').textContent = '93 項控制：已決定 ' + (ap.length + ex.length) + '（適用 ' + ap.length + '、排除 ' + ex.length + '），適用中已實施 ' + ap.filter(function (r) { return r.status === 'IMPLEMENTED'; }).length + '；未決定 ' + (93 - ap.length - ex.length) + '。';
        if (ct) { ct.setRows(d.clauseRows); st2.setRows(d.soaRows); } else build();
      });
    }
    function build() {
      ct = C.ui.table.create(document.getElementById('ct'), {
        caption: 'ISO 27001 clause gap assessment', rows: d.clauseRows,
        columns: [{ key: 'id', label: 'Clause', get: function (r) { return r.id.split('.').map(function (n) { return String(n).padStart(2, '0'); }).join('.'); }, render: function (r) { return esc(r.id); } },
          { key: 'title', label: 'Title', wrap: true, get: function (r) { return CL[r.id][2] + ' ' + CL[r.id][3]; }, render: function (r) { return esc(CL[r.id][2]) + '<br><span class="c6-muted">' + esc(CL[r.id][3]) + '</span>'; } },
          { key: 'status', label: 'Status', render: function (r) { return st(r.status); } }, { key: 'gapNote', label: 'Gap Note', wrap: true }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due' },
          { key: 'source', label: 'Provenance', render: function (r) { return r._virtual ? P.dataRequired('尚未評估') : P.prov(r.source); } }],
        filters: [{ key: 'ch', label: 'Chapter', get: function (r) { return CL[r.id][1]; }, options: ['4', '5', '6', '7', '8', '9', '10'].map(function (c) { return { value: c, label: '第 ' + c + ' 章' }; }) }, { key: 'status', label: 'Status', options: CST }],
        actions: ['edit'], sort: { key: 'id', dir: 'asc' },
        toolbar: '<a class="c6-btn c6-btn--secondary" href="data-import.html?ds=isoClauses">' + C.ui.icons.icon('upload') + '匯入</a>' + P.exportButtons(),
        onAction: function (a, r) {
          C.ui.form.open({ title: r.id + ' ' + CL[r.id][2], subtitle: esc(CL[r.id][3]), fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: CST }, { key: 'gapNote', label: 'Gap Note 差距說明', type: 'textarea' }, { key: 'owner', label: 'Owner', type: 'text' }, { key: 'dueDate', label: 'Due Date', type: 'date' }], values: r })
            .then(function (v) { if (!v) return; var rec = Object.assign({}, r, v); delete rec._virtual; return W.save('isoClauses', rec).then(load); });
        }
      });
      st2 = C.ui.table.create(document.getElementById('st'), {
        caption: 'Statement of Applicability', rows: d.soaRows,
        columns: [{ key: 'id', label: 'Control', get: function (r) { var p = r.id.split('.'); return +p[1] * 100 + +p[2]; }, render: function (r) { return esc(r.id); } },
          { key: 'title', label: 'Title', wrap: true, get: function (r) { return AX[r.id].title; } },
          { key: 'theme', label: 'Theme', get: function (r) { return AX[r.id].themeName; } },
          { key: 'applicable', label: 'Applicable', get: function (r) { return r.applicable === true ? 'Y' : r.applicable === false ? 'N' : '?'; }, render: function (r) { return r.applicable === true ? P.chip('✓ 適用', 'ok') : r.applicable === false ? P.chip('— 排除', '') : '<span class="c6-st c6-st--dr">? 未決定</span>'; } },
          { key: 'status', label: 'Implementation', render: function (r) { return r.applicable === true ? (r.status ? st(r.status) : P.dataRequired()) : '<span class="c6-muted">—</span>'; } },
          { key: 'justification', label: 'Justification', wrap: true, render: function (r) { return r.applicable === false && !r.justification ? P.dataRequired('排除必須說明理由') : esc(r.justification || ''); } },
          { key: 'risks', label: 'Linked Risks', get: function (r) { return (d.link[r.id] || []).concat(r.linkedRisks || []).join(' '); }, render: function (r) { var l = (d.link[r.id] || []).concat(r.linkedRisks || []).filter(function (x, i, a) { return a.indexOf(x) === i; }); return l.length ? l.map(function (x) { return '<a class="c6-link" href="risk-register.html?id=' + encodeURIComponent(x) + '">' + esc(x) + '</a>'; }).join(' ') : '<span class="c6-muted">—</span>'; } },
          { key: 'source', label: 'Provenance', render: function (r) { return r._virtual ? '<span class="c6-muted">—</span>' : P.prov(r.source); } }],
        filters: [{ key: 'theme', label: 'Theme', get: function (r) { return AX[r.id].theme; }, options: Object.keys(ISO.themes).map(function (t) { return { value: t, label: ISO.themes[t] }; }) },
          { key: 'app', label: 'Applicable', get: function (r) { return r.applicable === true ? 'Y' : r.applicable === false ? 'N' : 'U'; }, options: [{ value: 'Y', label: '適用' }, { value: 'N', label: '排除' }, { value: 'U', label: '未決定' }] },
          { key: 'status', label: 'Implementation', options: IST }],
        actions: ['edit'], sort: { key: 'id', dir: 'asc' },
        toolbar: '<a class="c6-btn c6-btn--secondary" href="data-import.html?ds=isoSoa">' + C.ui.icons.icon('upload') + '匯入 SoA</a>' + P.exportButtons(),
        onAction: function (a, r) {
          C.ui.form.open({ title: r.id + ' ' + AX[r.id].title, subtitle: esc(AX[r.id].themeName), values: Object.assign({}, r, { applicable: r.applicable == null ? '' : String(r.applicable) }), fields: [
            { key: 'applicable', label: 'Applicable 適用性', type: 'select', required: true, boolValues: true, options: [{ value: 'true', label: '適用' }, { value: 'false', label: '排除' }] },
            { key: 'status', label: 'Implementation Status', type: 'select', options: IST, showIf: function (v) { return v.applicable === true; } },
            { key: 'justification', label: 'Justification 納入 / 排除理由', type: 'textarea', help: '排除時必填（ISO/IEC 27001 6.1.3 d）' },
            { key: 'linkedRisks', label: 'Linked Risks', type: 'multi', options: P.riskOptions(d.risks) }],
            validate: function (v) { return v.applicable === false && !v.justification ? { justification: '排除控制必須填寫理由' } : {}; } })
            .then(function (v) { if (!v) return; if (v.applicable !== true) v.status = null; var rec = Object.assign({}, r, v); delete rec._virtual; return W.save('isoSoa', rec).then(load); });
        }
      });
      P.bindExport(document.getElementById('clauses'), function (k) { exp(k, 'clauses'); });
      P.bindExport(document.getElementById('soa'), function (k) { exp(k, 'soa'); });
    }
    function exp(kind, which) {
      var gap = { name: 'Gap Assessment', rows: d.clauseRows, notes: P.exportNotes(d.clauseRows), columns: [{ key: 'id', label: 'Clause' }, { key: 't', label: 'Title', get: function (r) { return CL[r.id][2]; } }, { key: 'status', label: 'Status' }, { key: 'gapNote', label: 'Gap Note' }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due Date' }, { key: 'source', label: 'Data Provenance', get: function (r) { return r._virtual ? 'NOT_ASSESSED' : r.source; } }] };
      var soa = { name: 'SoA', rows: d.soaRows, notes: P.exportNotes(d.soaRows).concat(['Annex A identifiers and short titles only; refer to ISO/IEC 27001:2022 for requirement text.']), columns: [{ key: 'id', label: 'Control' }, { key: 't', label: 'Title', get: function (r) { return AX[r.id].title; } }, { key: 'th', label: 'Theme', get: function (r) { return AX[r.id].themeName; } },
        { key: 'applicable', label: 'Applicable', get: function (r) { return r.applicable === true ? 'Y' : r.applicable === false ? 'N' : 'UNDECIDED'; } }, { key: 'status', label: 'Implementation Status' }, { key: 'justification', label: 'Justification' },
        { key: 'lr', label: 'Linked Risks', get: function (r) { return (d.link[r.id] || []).concat(r.linkedRisks || []); } }, { key: 'source', label: 'Data Provenance', get: function (r) { return r._virtual ? '' : r.source; } }] };
      if (kind === 'csv') C.services.exporter.downloadCSV(which === 'soa' ? soa : gap, which === 'soa' ? 'CAT6_ISO27001_SoA' : 'CAT6_ISO27001_Gap'); else C.services.exporter.downloadXLSX([gap, soa], 'CAT6_ISO27001_Gap_SoA');
    }
    return load().then(function () { page.removeAttribute('aria-busy'); if (location.hash) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); } });
  });
})(globalThis.CAT6);
