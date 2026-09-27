/* Interactive Framework Mapping.
 * 1) Integrated model: capability domain ↔ framework (exactly the CAT.6 spec mapping), drawn as SVG links.
 * 2) Scenario view: pick a risk scenario → applicable frameworks, inputs, method, outputs and improvement actions,
 *    all derived from the workspace records (nothing invented; missing pieces show DATA REQUIRED).
 * 3) Coverage matrix: risk × framework. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, esc = D.esc, M = C.data.mapping, FW = C.data.frameworks, L = C.data.library;
  var RM = C.calc.riskMatrix, N = C.calc.nist, CR = C.calc.cisRam, CSF = C.calc.csf, F = C.util.format;

  function applicable(r, d) {
    var out = {}, add = function (id, why) { (out[id] = out[id] || []).push(why); };
    (r.frameworks || []).forEach(function (f) { add(f, '風險登錄表標記'); });
    if (d.nist.some(function (n) { return n.riskId === r.id; })) add('SP80030', '有 SP 800-30 評估');
    if (d.cisram.some(function (n) { return n.riskId === r.id; })) add('CISRAM', '有 CIS RAM 工作表');
    if ((r.cisControls || []).length) add('CISV81', '對應 CIS Controls');
    if (r.fair) add('FAIR', '納入 FAIR 量化');
    d.treatments.filter(function (t) { return t.riskId === r.id; }).forEach(function (t) {
      if (t.refs && (t.refs.iso || []).length) add('ISO27001', '處理計畫對應 Annex A');
      if (t.refs && (t.refs.csf || []).length) add('CSF2', '處理計畫對應 CSF');
      if (t.refs && (t.refs.cis || []).length) add('CISV81', '處理計畫對應 CIS');
      if (t.refs && t.refs.cisram) add('CISRAM', '處理計畫對應 CIS RAM');
    });
    Object.keys(out).forEach(function (k) { out[k] = out[k].filter(function (x, i, a) { return a.indexOf(x) === i; }); });
    return out;
  }
  function scenarioRows(r, d) {
    var ap = applicable(r, d), tr = d.treatments.filter(function (t) { return t.riskId === r.id; }), rows = [];
    var a = r.likelihood >= 1 && r.impact >= 1 ? RM.assess(r.likelihood, r.impact) : null;
    var isoRefs = [].concat.apply([], tr.map(function (t) { return (t.refs && t.refs.iso) || []; }));
    var csfRefs = [].concat.apply([], tr.map(function (t) { return (t.refs && t.refs.csf) || []; }));
    var soa = {}; d.isoSoa.forEach(function (s) { soa[s.id] = s; });
    var csfBy = {}; d.csf.forEach(function (c) { csfBy[c.id] = c; });
    var cisBy = {}; d.cisControls.forEach(function (c) { cisBy[c.id] = c; });
    var dr = P.dataRequired;
    FW.forEach(function (f) {
      if (!ap[f.id]) return;
      var row = { fw: f, why: ap[f.id], inputs: '', method: L[f.id].logic, output: '', actions: '' };
      if (f.id === 'ISO27001') {
        row.inputs = '資產：' + esc(r.asset) + '<br>ISMS 範圍：' + esc(W.assessment.scope || '') + '<br>Annex A：' + P.chips(isoRefs);
        row.output = (a ? '風險 ' + P.score(r.likelihood, r.impact) : dr()) + '<br>SoA：' + (isoRefs.length ? isoRefs.map(function (id) { var s = soa[id]; return esc(id) + ' ' + (s ? (s.applicable === false ? '排除' : esc(s.status || '未決定')) : '未決定'); }).join('、') : dr('處理計畫尚未對應 Annex A'));
        row.actions = tr.length ? tr.map(function (t) { return esc(t.id + ' ' + t.control) + '（' + esc(t.status) + '）'; }).join('<br>') : dr('尚無處理計畫');
      } else if (f.id === 'CSF2') {
        row.inputs = 'Categories：' + (csfRefs.length ? P.chips(csfRefs) : dr('處理計畫未對應 CSF'));
        row.output = csfRefs.length ? csfRefs.map(function (id) { var c = csfBy[id]; return esc(id) + ' ' + (c && CSF.valid(c.current) ? c.current + '→' + c.target + '（gap ' + CSF.gap(c) + '）' : 'DATA REQUIRED'); }).join('<br>') : dr();
        row.actions = csfRefs.map(function (id) { var c = csfBy[id]; return c && c.action ? esc(id + '：' + c.action) : ''; }).filter(Boolean).join('<br>') || '<span class="c6-muted">—</span>';
      } else if (f.id === 'SP80030') {
        var na = d.nist.filter(function (n) { return n.riskId === r.id; });
        row.inputs = na.length ? na.map(function (n) { return esc(n.threatSource) + ' → ' + esc(n.threatEvent) + '（' + (n.sourceType === 'ADV' ? 'G-2' : 'G-3') + ' ' + n.initiation + ' · G-4 ' + n.adverseImpact + ' · H-3 ' + n.impact + '）'; }).join('<br>') : '威脅來源：' + esc(r.threatSource) + '<br>' + dr('尚無 SP 800-30 評估');
        row.output = na.length ? na.map(function (n) { var x = N.assess(n); return x.status === 'OK' ? esc(n.id) + '：G-5 ' + P.level(x.overall) + ' → 5×5 ' + x.score + ' ' + esc(x.band.nist) : dr(); }).join('<br>') : '<a class="c6-link" href="nist-800-30.html">建立 SP 800-30 評估</a>';
        row.actions = '<span class="c6-muted">依風險等級排定處理優先序（見處理計畫）</span>';
      } else if (f.id === 'CISRAM') {
        var cr = d.cisram.filter(function (x) { return x.riskId === r.id; });
        row.inputs = cr.length ? cr.map(function (x) { return 'Safeguards：' + P.chips(x.safeguards); }).join('<br>') : dr('尚無 CIS RAM 工作表');
        row.output = cr.length ? cr.map(function (x) { var z = CR.assess(x, C.data.defaults.parameters.value('cisRamAcceptableScore', W.assessment)); return esc(x.id) + '：' + (z.inherent ? z.inherent.score : '—') + ' → ' + (z.residual ? z.residual.score : '—') + ' · ' + (z.acceptability.id === 'DATA_REQUIRED' ? dr(z.acceptability.why) : z.acceptability.id); }).join('<br>') : '<a class="c6-link" href="cis-ram.html">建立 CIS RAM 情境</a>';
        row.actions = cr.map(function (x) { return x.recommended ? esc(x.recommended) : ''; }).filter(Boolean).join('<br>') || '<span class="c6-muted">—</span>';
      } else if (f.id === 'CISV81') {
        var ids = (r.cisControls || []).concat([].concat.apply([], tr.map(function (t) { return (t.refs && t.refs.cis) || []; }))).filter(function (x, i, a2) { return a2.indexOf(x) === i; });
        var ig = (W.assessment.targetIG || 'IG1').toLowerCase();
        row.inputs = 'Controls：' + P.chips(ids);
        row.output = ids.map(function (id) { var c = cisBy[id]; return esc(id) + ' ' + ig.toUpperCase() + '：' + esc(c ? c[ig] : 'NOT_ASSESSED'); }).join('<br>') || dr();
        row.actions = ids.filter(function (id) { var c = cisBy[id]; return !c || (c[ig] !== 'IMPLEMENTED' && c[ig] !== 'NOT_APPLICABLE'); }).map(function (id) { return '補強 ' + esc(id); }).join('、') || '<span class="c6-muted">目標 IG 已實施</span>';
      } else if (f.id === 'FAIR') {
        var run = d.fairRuns.filter(function (x) { return x.riskId === r.id; }).sort(function (x, y) { return (y.at || '').localeCompare(x.at || ''); })[0];
        var inp = d.fairInputs[0];
        row.inputs = inp && inp.riskId === r.id ? inp.fields.map(function (x) { return esc(x.field) + ' ' + P.prov(x.source); }).join(' ') : dr('FAIR 輸入尚未指定此情境');
        row.output = run ? 'Mean ALE ' + F.currency(run.summaries.AnnualRisk.Mean, 'TWD', { compact: true }) + ' · P90 ' + F.currency(run.summaries.AnnualRisk.P90, 'TWD', { compact: true }) + '（' + F.num(run.iterations) + ' 次，seed ' + run.seed + '）' : '<a class="c6-link" href="fair-analysis.html">尚未執行模擬 → FAIR Analysis</a>';
        row.actions = '以處理後輸入重新模擬，比較年度損失';
      }
      rows.push(row);
    });
    return rows;
  }

  P.boot({ nav: 'mapping' }, function () {
    var page = document.getElementById('page'), data, sel = { type: null, id: null };
    page.innerHTML = '<div class="c6-intro"><h2 class="c6-intro__title">Interactive Framework Mapping</h2><p class="c6-intro__text">CAT.6 整合框架模型：每個能力面向由特定框架負責。點選左側面向或右側框架，即顯示關聯；選擇風險情境可看到該情境適用的框架、輸入、方法、輸出與改善行動。</p></div>' +
      P.card('model', 'Integrated Framework Model', '點選節點以強調關聯（鍵盤可操作）', '<div class="c6-map" id="map"></div><div id="map-info" class="c6-callout" style="margin-top:1rem" aria-live="polite"></div>') +
      P.card('scn', 'Scenario Mapping', '選擇風險情境', '<label class="c6-field" style="max-width:40rem"><span class="c6-var__lbl">Risk Scenario</span><select class="c6-input" id="risk-sel"></select></label><div id="scn-out" style="margin-top:1rem"></div>') +
      P.card('cov', 'Coverage Matrix', '風險 × 框架（● 適用）', '<div id="cov-t"></div>', { head: '<div class="c6-actions">' + P.exportButtons() + '</div>' });

    function drawModel() {
      var map = document.getElementById('map');
      map.innerHTML = '<ul class="c6-map__col" aria-label="能力面向">' + M.domains.map(function (d) {
        return '<li><button type="button" class="c6-map__node" data-dom="' + d.id + '" aria-pressed="false"><strong>' + esc(d.en) + '</strong><small>' + esc(d.zh) + ' → ' + d.fw.map(P.fwShort).join(' · ') + '</small></button></li>';
      }).join('') + '</ul><svg class="c6-map__svg" aria-hidden="true"></svg><ul class="c6-map__col" aria-label="框架">' + FW.map(function (f) {
        return '<li><button type="button" class="c6-map__node" data-fw="' + f.id + '" aria-pressed="false"><strong>' + esc(f.name) + '</strong><small>' + esc(f.layer) + '</small></button></li>';
      }).join('') + '</ul>';
      links(); info();
    }
    function links() {
      var map = document.getElementById('map'), svg = map.querySelector('svg'); if (!svg) return;
      var box = svg.getBoundingClientRect(); if (!box.width) { svg.innerHTML = ''; return; }
      svg.setAttribute('width', box.width); svg.setAttribute('height', map.getBoundingClientRect().height);
      var top = box.top, h = '';
      M.domains.forEach(function (d) {
        var a = map.querySelector('[data-dom="' + d.id + '"]').getBoundingClientRect(), y1 = a.top + a.height / 2 - top;
        d.fw.forEach(function (f) {
          var b = map.querySelector('[data-fw="' + f + '"]').getBoundingClientRect(), y2 = b.top + b.height / 2 - top;
          var hot = (sel.type === 'dom' && sel.id === d.id) || (sel.type === 'fw' && sel.id === f);
          h += '<path d="M0 ' + y1 + ' C' + box.width / 2 + ' ' + y1 + ' ' + box.width / 2 + ' ' + y2 + ' ' + box.width + ' ' + y2 + '"' + (hot ? ' data-hot="true"' : '') + '/>';
        });
      });
      svg.innerHTML = h;
    }
    function info() {
      var el = document.getElementById('map-info'), map = document.getElementById('map');
      map.setAttribute('data-active', String(!!sel.type));
      map.querySelectorAll('.c6-map__node').forEach(function (n) {
        var dom = n.getAttribute('data-dom'), fw = n.getAttribute('data-fw'), pressed = (sel.type === 'dom' && dom === sel.id) || (sel.type === 'fw' && fw === sel.id);
        var hot = !pressed && ((sel.type === 'dom' && fw && M.domains.filter(function (d) { return d.id === sel.id; })[0].fw.indexOf(fw) >= 0) || (sel.type === 'fw' && dom && M.domains.filter(function (d) { return d.id === dom; })[0].fw.indexOf(sel.id) >= 0));
        n.setAttribute('aria-pressed', String(pressed)); n.setAttribute('data-hot', String(hot));
      });
      if (!sel.type) { el.innerHTML = '七個能力面向對應至六個框架。選一個節點查看細節。'; return; }
      if (sel.type === 'dom') {
        var d = M.domains.filter(function (x) { return x.id === sel.id; })[0];
        el.innerHTML = '<strong>' + esc(d.en) + '（' + esc(d.zh) + '）</strong> → ' + d.fw.map(function (f) { return '<a class="c6-link" href="frameworks.html#' + f + '">' + esc(P.fwShort(f)) + '</a>：' + esc(L[f].purpose); }).join('；');
      } else {
        var f = FW.filter(function (x) { return x.id === sel.id; })[0], ds = M.domains.filter(function (x) { return x.fw.indexOf(f.id) >= 0; });
        el.innerHTML = '<strong>' + esc(f.name) + '</strong> 負責：' + ds.map(function (x) { return esc(x.en); }).join('、') + '。輸出：' + esc(L[f.id].output.join('、')) + '。<a class="c6-link" href="frameworks.html#' + f.id + '">查看框架說明</a>';
      }
      links();
    }
    document.getElementById('map').addEventListener('click', function (e) {
      var n = e.target.closest('.c6-map__node'); if (!n) return;
      var type = n.hasAttribute('data-dom') ? 'dom' : 'fw', id = n.getAttribute('data-' + type);
      sel = sel.type === type && sel.id === id ? { type: null, id: null } : { type: type, id: id }; info();
    });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { links(); }).observe(document.getElementById('map'));
    drawModel();

    function scenario() {
      var id = document.getElementById('risk-sel').value, r = data.risks.filter(function (x) { return x.id === id; })[0], out = document.getElementById('scn-out');
      if (!r) { out.innerHTML = '<div class="c6-empty">尚無風險情境。請先在 <a class="c6-link" href="risk-register.html">Risk Register</a> 新增。</div>'; return; }
      var rows = scenarioRows(r, data);
      history.replaceState(null, '', '?risk=' + encodeURIComponent(r.id));
      out.innerHTML = '<div class="c6-stack"><p class="c6-note"><strong>' + esc(r.id) + '</strong> ' + esc(r.scenario) + ' · 資產 ' + esc(r.asset) + ' · ' + P.prov(r.source) + '</p>' +
        '<div class="c6-row"><span class="c6-var__lbl">Applicable Frameworks：</span>' + (rows.length ? rows.map(function (x) { return '<span class="c6-chip c6-chip--accent" title="' + esc(x.why.join('、')) + '">' + esc(x.fw.short) + '</span>'; }).join('') : P.dataRequired('此情境尚未對應任何框架')) + '</div>' +
        (rows.length ? '<div class="c6-table-wrap"><table class="c6-table c6-table--data"><caption class="c6-sr-only">情境框架對應</caption><thead><tr><th scope="col">Framework</th><th scope="col">Inputs</th><th scope="col">Method</th><th scope="col">Outputs</th><th scope="col">Improvement Actions</th></tr></thead><tbody>' +
          rows.map(function (x) { return '<tr><th scope="row" class="c6-table__rh">' + esc(x.fw.short) + '<br><span class="c6-muted" style="font-weight:400">' + esc(x.why.join('、')) + '</span></th><td class="c6-t-wrap">' + x.inputs + '</td><td class="c6-t-wrap">' + esc(x.method) + '</td><td class="c6-t-wrap">' + x.output + '</td><td class="c6-t-wrap">' + x.actions + '</td></tr>'; }).join('') + '</tbody></table></div>' : '') + '</div>';
      var hot = rows.map(function (x) { return x.fw.id; });
      document.getElementById('map').querySelectorAll('[data-fw]').forEach(function (n) { if (!sel.type) n.setAttribute('data-hot', String(hot.indexOf(n.getAttribute('data-fw')) >= 0)); });
      document.getElementById('map').setAttribute('data-active', String(!!sel.type || hot.length > 0));
    }
    function coverage() {
      document.getElementById('cov-t').innerHTML = '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">風險 × 框架覆蓋</caption><thead><tr><th scope="col">Risk</th>' + FW.map(function (f) { return '<th scope="col" style="text-align:center">' + esc(f.short) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        data.risks.map(function (r) { var ap = applicable(r, data); return '<tr><th scope="row" class="c6-table__rh"><a class="c6-link" href="?risk=' + encodeURIComponent(r.id) + '">' + esc(r.id) + '</a></th>' + FW.map(function (f) { return '<td style="text-align:center">' + (ap[f.id] ? '<span title="' + esc(ap[f.id].join('、')) + '">●<span class="c6-sr-only">適用</span></span>' : '<span class="c6-muted">·<span class="c6-sr-only">不適用</span></span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }
    P.bindExport(document.getElementById('cov'), function (kind) {
      var t = { name: 'Framework Mapping', rows: data.risks, notes: P.exportNotes(data.risks).concat(['Mapping model: ' + M.source]), columns: [{ key: 'id', label: 'Risk ID' }, { key: 'scenario', label: 'Scenario' }].concat(FW.map(function (f) {
        return { key: f.id, label: f.short, get: function (r) { var ap = applicable(r, data); return ap[f.id] ? 'Y (' + ap[f.id].join('; ') + ')' : ''; } };
      })) };
      var model = { name: 'Model', sheet: 'Model', rows: M.domains, columns: [{ key: 'en', label: 'Domain' }, { key: 'zh', label: '面向' }, { key: 'fw', label: 'Frameworks', get: function (d) { return d.fw.map(P.fwShort); } }] };
      if (kind === 'csv') C.services.exporter.downloadCSV(t, 'CAT6_Framework_Mapping'); else C.services.exporter.downloadXLSX([t, model], 'CAT6_Framework_Mapping');
    });
    return W.load(['risks', 'treatments', 'nist', 'cisram', 'cisControls', 'csf', 'isoSoa', 'fairRuns', 'fairInputs']).then(function (d) {
      data = d;
      P.notice(document.getElementById('c6-notice'), W.usesDefaults({ risks: d.risks }), { edit: 'risk-register.html', dataset: 'risks' });
      var s = document.getElementById('risk-sel'), want = D.qs('risk');
      s.innerHTML = d.risks.map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === want ? ' selected' : '') + '>' + esc(r.id + ' · ' + r.scenario) + '</option>'; }).join('');
      s.addEventListener('change', scenario); scenario(); coverage();
      page.removeAttribute('aria-busy');
    });
  });
})(globalThis.CAT6);
