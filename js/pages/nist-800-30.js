/* NIST SP 800-30 Rev.1 assessment.
 * Initiation / occurrence likelihood: G-2 (adversarial) or G-3 (non-adversarial).
 * Likelihood of adverse impact: G-4. Overall likelihood: G-5 LOOKUP (never multiplied).
 * Risk determination: CAT.6 5×5 platform matrix on Overall Likelihood × Impact (VL..VH → 1..5), bands
 * Low / Moderate / High / Very High (source: 確認_NIST_Table_I-2_與_H-3.pdf). Table I-2 is shown as reference only. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, N = C.data.nist, E = C.calc.nist, esc = D.esc;
  var LV = ['VL', 'L', 'M', 'H', 'VH'];
  function lvOpts(table) { return N[table].levels.slice().reverse().map(function (l) { return { value: l.id, label: l.id + ' · ' + l.name + ' — ' + l.criterion }; }); }
  function matrix(t, hot) {
    return '<div class="c6-table-wrap"><table class="c6-lookup"><caption class="c6-sr-only">' + esc(t.title) + '</caption><thead><tr><th scope="col"></th>' + t.cols.map(function (c) { return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      t.rows.map(function (r, i) { return '<tr><th scope="row">' + r + '</th>' + t.matrix[i].map(function (v, j) { var h = hot && hot[0] === r && hot[1] === t.cols[j]; return '<td class="c6-lv--' + v + '"' + (h ? ' data-hot="true"' : '') + '>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function nsev(r) { return r && r.band ? P.sev(r.band).replace('>' + r.band.label + '<', '>' + r.band.nist + '<') : P.dataRequired(); }
  /* 5×5 platform score matrix (I5 on top) with the selected cell highlighted. */
  function matrix5(hot) {
    var B = C.calc.riskMatrix;
    return '<div class="c6-table-wrap"><table class="c6-lookup"><caption class="c6-sr-only">CAT.6 5×5 Risk Matrix</caption><thead><tr><th scope="col">I \\ L</th>' + [1, 2, 3, 4, 5].map(function (l) { return '<th scope="col">L' + l + ' ' + C.data.riskCriteria.cat6.likelihood[l - 1].zh + '</th>'; }).join('') + '</tr></thead><tbody>' +
      [5, 4, 3, 2, 1].map(function (i) { return '<tr><th scope="row">I' + i + ' ' + C.data.riskCriteria.cat6.impact[i - 1].zh + '</th>' + [1, 2, 3, 4, 5].map(function (l) { var a = B.assess(l, i), cls = { LOW: 'L', MEDIUM: 'M', HIGH: 'H', CRITICAL: 'VH' }[a.band.id], h = hot && hot[0] === l && hot[1] === i; return '<td class="c6-lv--' + cls + '"' + (h ? ' data-hot="true"' : '') + ' title="' + a.band.nist + '">' + a.score + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function levels(t) {
    return '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">' + esc(N[t].title) + '</caption><thead><tr><th scope="col">Level</th><th scope="col">Semi-Quant.</th><th scope="col" class="c6-t-num">Rep.</th><th scope="col">Description</th></tr></thead><tbody>' +
      N[t].levels.map(function (l) { return '<tr><td>' + P.level(l.id) + '</td><td>' + l.range[0] + '–' + l.range[1] + '</td><td class="c6-t-num">' + l.representative + '</td><td class="c6-t-wrap">' + esc(l.criterion) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  var FIELDS = function (risks) {
    return [
      { key: 'riskId', label: 'Risk Scenario（登錄表）', type: 'select', options: P.riskOptions(risks), full: true, help: '可留白；連結後可在 Framework Mapping 與報告中彙整' },
      { key: 'sourceType', label: 'Threat Source Type', type: 'select', required: true, options: [{ value: 'ADV', label: 'Adversarial 敵意（使用 Table G-2）' }, { value: 'NONADV', label: 'Non-Adversarial 非敵意（使用 Table G-3）' }] },
      { key: 'threatSource', label: 'Threat Source 威脅來源', type: 'text', required: true },
      { key: 'threatEvent', label: 'Threat Event 威脅事件', type: 'text', required: true, full: true },
      { key: 'vulnerability', label: 'Vulnerability 弱點', type: 'text' },
      { key: 'vulnSeverity', label: 'Vulnerability Severity', type: 'select', options: LV.map(function (l) { return { value: l, label: l + ' · ' + N.NAMES[l] }; }).reverse(), help: '記錄用；SP 800-30 未以此值直接計算風險' },
      { key: 'predisposing', label: 'Predisposing Condition 先決條件', type: 'text' },
      { key: 'controls', label: 'Existing Controls 現有控制', type: 'text' },
      { key: 'initiation', label: 'Likelihood of Initiation (G-2) / Occurrence (G-3)', type: 'select', required: true, options: N.G2.levels.slice().reverse().map(function (l, i) { var g3 = N.G3.levels.slice().reverse()[i]; return { value: l.id, label: l.id + ' · ' + l.name + ' — G-2：' + l.criterion + '｜G-3：' + g3.criterion }; }), full: true, help: 'Adversarial 依 G-2 描述判斷；Non-Adversarial 依 G-3（頻率描述見下方參考表）' },
      { key: 'adverseImpact', label: 'Likelihood of Adverse Impact (G-4)', type: 'select', required: true, options: lvOpts('G4'), full: true },
      { key: 'impact', label: 'Level of Impact (H-3)', type: 'select', required: true, options: lvOpts('H3'), full: true, help: 'VL→I1、L→I2、M→I3、H→I4、VH→I5 進入 CAT.6 5×5 計分；等級描述參考 NIST SP 800-30 H-3' }
    ];
  };

  P.boot({ nav: 'nist', group: 'assessment' }, function () {
    var page = document.getElementById('page'), tbl, data;
    page.innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">NIST SP 800-30 Rev.1 Risk Determination</h2><p class="c6-intro__text">流程：威脅來源（敵意 / 非敵意）→ 威脅事件 → 弱點與先決條件 → 發起 / 發生可能性（G-2 / G-3）→ 造成不利影響可能性（G-4）→ <strong>Overall Likelihood 以 Table G-5 查表</strong> → 衝擊（H-3）→ <strong>Risk 以 CAT.6 5×5 半定量矩陣判定</strong>。所有判定皆為查表，不使用 Likelihood × Impact。</p></div>' +
      '<div class="c6-callout">Table G-2 / G-3 / G-4 / G-5 取自專案提供之 Risk_Criteria.pdf，Overall Likelihood 以 G-5 查表。風險判定依專案提供之「NIST SP 800-30 的風險判定」：Overall Likelihood 與 Impact 依 VL→1 … VH→5 換算後以 <strong>CAT.6 5×5 半定量矩陣</strong>計分（Low 1–4、Moderate 5–9、High 10–16、Very High 17–25）。' + esc(C.data.riskCriteria.cat6.disclaimer) + ' Table I-2 僅列為 NIST 參考，不用於計分。</div>' +
      P.card('assess', 'Assessments', '每列顯示查表路徑；Overall Likelihood 與 Risk 為 CALCULATED', '<div id="tbl"></div>') +
      '<div class="c6-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr))">' +
      P.card('g5', 'Table G-5 · Overall Likelihood', '列：發起 / 發生可能性 · 欄：造成不利影響可能性', '<div id="g5m"></div><p class="c6-chart-summary" id="g5s"></p>') +
      P.card('i2', 'CAT.6 5×5 Risk Matrix', '列：Impact（I5 在上）· 欄：Overall Likelihood · 平台自訂，非 NIST 官方分數', '<div id="i2m"></div><p class="c6-chart-summary" id="i2s"></p>') +
      P.card('conv', '半定量換算', '0–100 分數 → 等級（依各表區間）', '<div class="c6-stack"><label class="c6-field"><span class="c6-var__lbl">表格</span><select class="c6-input" id="cv-t"><option value="G2">G-2 Initiation</option><option value="G3">G-3 Occurrence</option><option value="G4">G-4 Adverse Impact</option><option value="H3">H-3 Impact</option></select></label><label class="c6-field"><span class="c6-var__lbl">Semi-quantitative value (0–100)</span><input class="c6-input" id="cv-v" type="number" min="0" max="100" step="1" inputmode="numeric" value="85"></label><p id="cv-o" aria-live="polite"></p></div>') +
      '</div>' +
      '<details class="c6-details"><summary>參考表：G-2 · G-3 · G-4 · H-3 等級描述</summary><div class="c6-lib">' +
      ['G2', 'G3', 'G4', 'H3'].map(function (t) { return '<div class="c6-lib__block"><h3>' + esc(N[t].title) + '</h3>' + levels(t) + (N[t].source ? '<p class="c6-note">' + esc(N[t].source) + '</p>' : '') + '</div>'; }).join('') +
      '<div class="c6-lib__block"><h3>Table I-2 · Level of Risk（NIST 參考，未用於計分）</h3>' + matrix(N.I2, null) + '</div>' +
      '<div class="c6-lib__block"><h3>Risk Score → Risk Level（CAT.6 平台自訂）</h3><div class="c6-table-wrap"><table class="c6-table"><thead><tr><th scope="col">Risk Score</th><th scope="col">Risk Level</th><th scope="col">中文</th><th scope="col">建議處理原則</th></tr></thead><tbody>' +
      C.data.riskCriteria.cat6.bands.map(function (b) { return '<tr><td>' + b.min + '–' + b.max + '</td><td>' + b.nist + '</td><td>' + b.zh + '</td><td>' + esc(b.action) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div></details>';
    function showLookup(n) {
      var r = n ? E.assess(n) : null, ok = r && r.status === 'OK';
      document.getElementById('g5m').innerHTML = matrix(N.G5, ok ? [n.initiation, n.adverseImpact] : null);
      document.getElementById('i2m').innerHTML = matrix5(ok ? [r.likelihood5, r.impact5] : null);
      document.getElementById('g5s').textContent = ok ? n.id + '：G-5[' + n.initiation + ', ' + n.adverseImpact + '] = ' + r.overall + '（' + N.NAMES[r.overall] + '）' : '點選評估列的「檢視」可在矩陣中標示查表位置。';
      document.getElementById('i2s').textContent = ok ? n.id + '：L' + r.likelihood5 + '（' + r.overall + '）× I' + r.impact5 + '（' + n.impact + '）= ' + r.score + ' → ' + r.band.nist + '（' + r.band.zh + '）；' + r.band.action + '。' : '每格顯示分數，滑鼠停留顯示等級；等級同時以文字標示於評估表。';
    }
    function conv() {
      var t = document.getElementById('cv-t').value, v = parseFloat(document.getElementById('cv-v').value), o = document.getElementById('cv-o');
      if (isNaN(v) || v < 0 || v > 100) { o.innerHTML = '<span class="c6-dr">請輸入 0–100</span>'; return; }
      var l = E.levelFromSemiQuant(t, v); o.innerHTML = l ? P.level(l.id) + ' <span class="c6-muted">代表值 ' + l.representative + ' · ' + esc(l.criterion) + '</span>' : P.dataRequired();
    }
    page.addEventListener('input', function (e) { if (e.target.id === 'cv-v' || e.target.id === 'cv-t') conv(); });
    page.addEventListener('change', function (e) { if (e.target.id === 'cv-t') conv(); });
    conv();

    function load() {
      return W.load(['nist', 'risks']).then(function (d) {
        data = d; P.notice(document.getElementById('c6-notice'), W.usesDefaults({ nist: d.nist }), { edit: '#assess', dataset: 'nist' });
        if (tbl) tbl.setRows(d.nist); else build();
        showLookup(d.nist[0]);
      });
    }
    function res(n) { return E.assess(n); }
    function build() {
      tbl = C.ui.table.create(document.getElementById('tbl'), {
        caption: 'NIST SP 800-30 assessments', rows: data.nist,
        columns: [
          { key: 'id', label: 'ID' }, { key: 'riskId', label: 'Risk ID', render: function (n) { return n.riskId ? '<a class="c6-link" href="risk-register.html?id=' + encodeURIComponent(n.riskId) + '">' + esc(n.riskId) + '</a>' : '<span class="c6-muted">—</span>'; } },
          { key: 'sourceType', label: 'Type', render: function (n) { return P.chip(n.sourceType === 'ADV' ? 'Adversarial · G-2' : 'Non-Adv. · G-3', n.sourceType === 'ADV' ? 'bad' : ''); } },
          { key: 'threatEvent', label: 'Threat Source / Event', wrap: true, get: function (n) { return n.threatSource + ' ' + n.threatEvent + ' ' + (n.vulnerability || ''); }, render: function (n) { return '<strong>' + esc(n.threatEvent) + '</strong><br><span class="c6-muted">' + esc(n.threatSource) + (n.vulnerability ? ' · 弱點：' + esc(n.vulnerability) : '') + '</span>'; } },
          { key: 'initiation', label: 'Init./Occur.', get: function (n) { return LV.indexOf(n.initiation); }, render: function (n) { return P.level(n.initiation); } },
          { key: 'adverseImpact', label: 'Adverse (G-4)', get: function (n) { return LV.indexOf(n.adverseImpact); }, render: function (n) { return P.level(n.adverseImpact); } },
          { key: 'overall', label: 'Overall (G-5)', get: function (n) { var r = res(n); return r.status === 'OK' ? LV.indexOf(r.overall) : -1; }, render: function (n) { var r = res(n); return r.status === 'OK' ? P.level(r.overall) : P.dataRequired('缺少：' + r.missing.join(', ')); } },
          { key: 'impact', label: 'Impact (H-3)', get: function (n) { return LV.indexOf(n.impact); }, render: function (n) { return P.level(n.impact); } },
          { key: 'risk', label: 'Risk（CAT.6 5×5）', get: function (n) { var r = res(n); return r.status === 'OK' ? r.score : -1; }, render: function (n) { var r = res(n); return r.status === 'OK' ? '<span class="c6-num">' + r.likelihood5 + '×' + r.impact5 + '=' + r.score + '</span> ' + nsev(r) : P.dataRequired('缺少：' + r.missing.join(', ')); } },
          { key: 'i2', label: 'I-2 參考', get: function (n) { var r = res(n); return r.status === 'OK' ? LV.indexOf(r.riskI2) : -1; }, render: function (n) { var r = res(n); return r.status === 'OK' ? P.level(r.riskI2) : '—'; } },
          { key: 'source', label: 'Provenance', render: function (n) { return P.prov(n.source); } }
        ],
        filters: [{ key: 'sourceType', label: 'Type', options: [{ value: 'ADV', label: 'Adversarial' }, { value: 'NONADV', label: 'Non-Adversarial' }] },
          { key: 'riskLevel', label: 'Risk', get: function (n) { var r = res(n); return r.status === 'OK' ? r.band.id : 'DR'; }, options: C.data.riskCriteria.cat6.bands.slice().reverse().map(function (b) { return { value: b.id, label: b.nist }; }).concat([{ value: 'DR', label: 'DATA REQUIRED' }]) }],
        actions: ['view', 'edit', 'delete'],
        toolbar: '<button type="button" class="c6-btn c6-btn--primary" data-add>' + C.ui.icons.icon('plus') + '新增評估</button><a class="c6-btn c6-btn--secondary" href="data-import.html?ds=nist">' + C.ui.icons.icon('upload') + '匯入</a>' + P.exportButtons(),
        onAction: function (a, n) { if (a === 'view') detail(n); else if (a === 'edit') edit(n); else del(n); }
      });
      page.querySelector('[data-add]').addEventListener('click', function () { edit(null); });
      P.bindExport(page, exportAs);
    }
    function detail(n) {
      var r = res(n); showLookup(n);
      C.ui.form.detail({ title: n.id + ' · ' + n.threatEvent, subtitle: P.prov(n.source), rows: [
        ['Risk Scenario', n.riskId ? '<a class="c6-link" href="risk-register.html?id=' + encodeURIComponent(n.riskId) + '">' + esc(n.riskId) + '</a>' : ''],
        ['Threat Source', esc(n.threatSource) + ' ' + P.chip(n.sourceType === 'ADV' ? 'Adversarial' : 'Non-Adversarial')], ['Threat Event', esc(n.threatEvent)],
        ['Vulnerability', esc(n.vulnerability) + (n.vulnSeverity ? ' · Severity ' + P.level(n.vulnSeverity) : '')], ['Predisposing Condition', esc(n.predisposing)], ['Existing Controls', esc(n.controls)],
        ['Step 1 · ' + (n.sourceType === 'ADV' ? 'G-2 Initiation' : 'G-3 Occurrence'), P.level(n.initiation)], ['Step 2 · G-4 Adverse Impact', P.level(n.adverseImpact)],
        ['Step 3 · G-5 Overall Likelihood', r.status === 'OK' ? 'G-5[' + n.initiation + ', ' + n.adverseImpact + '] → ' + P.level(r.overall) + ' ' + P.prov('CALCULATED') : P.dataRequired()],
        ['Step 4 · H-3 Impact', P.level(n.impact)],
        ['Step 5 · CAT.6 5×5 Risk', r.status === 'OK' ? 'L' + r.likelihood5 + ' × I' + r.impact5 + ' = ' + r.score + ' → ' + nsev(r) + ' ' + P.prov('CALCULATED') + '<br><span class="c6-muted">' + esc(r.band.action) + '</span>' : P.dataRequired()],
        ['參考 · NIST Table I-2', r.status === 'OK' ? 'I-2[' + r.overall + ', ' + n.impact + '] → ' + P.level(r.riskI2) + ' <span class="c6-muted">（未用於計分）</span>' : '—']
      ], actions: [{ label: '編輯', primary: true, onClick: function () { edit(n); } }] });
    }
    function edit(n) {
      var isNew = !n;
      C.ui.form.open({ title: isNew ? '新增 NIST SP 800-30 評估' : '編輯 ' + n.id, fields: FIELDS(data.risks), values: n || { sourceType: 'ADV' } }).then(function (v) {
        if (!v) return;
        var rec = Object.assign({}, n || {}, v); if (isNew) rec.id = D.nextId('NA', data.nist);
        return W.save('nist', rec, { verb: isNew ? '新增' : '更新' }).then(function () { var r = E.assess(rec); D.toast(rec.id + ' 已儲存 · Risk ' + (r.status === 'OK' ? r.score + ' ' + r.band.nist : 'DATA REQUIRED')); return load(); });
      });
    }
    function del(n) { C.ui.form.confirm('刪除 ' + n.id + '？', '刪除').then(function (ok) { if (ok) W.remove('nist', n.id).then(load); }); }
    function exportAs(kind) {
      var t = { name: 'NIST SP 800-30', rows: tbl.visible(), notes: P.exportNotes(data.nist).concat(['Overall Likelihood = Table G-5 lookup; Risk = CAT.6 5x5 semi-quantitative matrix (VL..VH -> 1..5, Score = L x I; Low 1-4, Moderate 5-9, High 10-16, Very High 17-25). Platform-defined, not an official NIST score. I-2 shown for reference only.']), columns: [
        { key: 'id', label: 'Assessment ID' }, { key: 'riskId', label: 'Risk ID' }, { key: 'sourceType', label: 'Source Type' }, { key: 'threatSource', label: 'Threat Source' }, { key: 'threatEvent', label: 'Threat Event' },
        { key: 'vulnerability', label: 'Vulnerability' }, { key: 'vulnSeverity', label: 'Vulnerability Severity' }, { key: 'predisposing', label: 'Predisposing Condition' }, { key: 'controls', label: 'Existing Controls' },
        { key: 'initiation', label: 'Initiation / Occurrence Likelihood' }, { key: 'adverseImpact', label: 'Adverse Impact Likelihood' },
        { key: 'overall', label: 'Overall Likelihood (G-5)', get: function (n) { var r = res(n); return r.status === 'OK' ? r.overall : 'DATA REQUIRED'; } }, { key: 'impact', label: 'Impact Level' },
        { key: 'l5', label: 'L (1-5)', get: function (n) { var r = res(n); return r.status === 'OK' ? r.likelihood5 : 'DATA REQUIRED'; } }, { key: 'i5', label: 'I (1-5)', get: function (n) { var r = res(n); return r.status === 'OK' ? r.impact5 : 'DATA REQUIRED'; } },
        { key: 'score', label: 'Risk Score', get: function (n) { var r = res(n); return r.status === 'OK' ? r.score : 'DATA REQUIRED'; } }, { key: 'risk', label: 'Risk Level', get: function (n) { var r = res(n); return r.status === 'OK' ? r.band.nist : 'DATA REQUIRED'; } },
        { key: 'i2', label: 'NIST I-2 (reference)', get: function (n) { var r = res(n); return r.status === 'OK' ? r.riskI2 : ''; } }, { key: 'source', label: 'Data Provenance' }] };
      if (kind === 'csv') C.services.exporter.downloadCSV(t, 'CAT6_NIST_SP80030'); else C.services.exporter.downloadXLSX([t], 'CAT6_NIST_SP80030');
    }
    return load().then(function () { page.removeAttribute('aria-busy'); });
  });
})(globalThis.CAT6);
