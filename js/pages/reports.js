/* Report Center (Phase 08). Structured data → reportBuilder → reportRenderer → PDF (browser print) / CSV / XLSX. */
(function (C) {
  var P = C.ui.page, RB = C.services.reportBuilder, RR = C.services.reportRenderer, X = C.services.exporter, esc = P.esc, I = C.ui.icons;
  var state = { type: 'combined', data: null, report: null, W: null, run: null };

  function runParam() { return new URLSearchParams(location.search).get('run'); }
  function params() { var t = new URLSearchParams(location.search).get('type'); return RB.TYPES.some(function (x) { return x.id === t; }) ? t : 'combined'; }

  function layout() {
    document.getElementById('page').innerHTML =
      '<div class="c6-intro"><h2 class="c6-intro__title">Report Center 報告中心</h2><p class="c6-intro__text">報告由結構化結果資料產生（Report Data Builder → Report Renderer），不是儀表板截圖。PDF 透過瀏覽器列印產生：A4、頁首頁尾、頁碼、跨頁重複表頭，並保留每一筆資料的來源標示。</p></div>' +
      '<div class="c6-grid">' +
      P.card('rt', '1 · 選擇報告類型', '9 種報告 · 目前評估：<span id="r-as"></span>', '<ul class="c6-rtypes" id="types"></ul>' +
        '<div class="c6-row" id="fair-pick" hidden style="margin-top:1rem;gap:.75rem;flex-wrap:wrap;align-items:flex-end"><label class="c6-field" style="min-width:18rem;flex:1"><span class="c6-var__lbl">FAIR 詳細情境（報告中的百分位、分布圖與超越曲線）</span><select class="c6-input" id="fair-run"></select></label>' +
        '<p class="c6-note" style="flex:1 1 18rem;margin:0">情境比較表一律列出每個情境的最新一次模擬；此處只決定哪一筆模擬顯示詳細內容。</p></div>', { span: 'full' }) +
      P.card('rs', '2 · 章節完整度', '● 已就緒　◐ 含 DATA REQUIRED　— 此報告不適用', '<ul class="c6-rsecs" id="secs"></ul><p class="c6-note" id="r-def" style="margin-top:.75rem"></p>', { span: 'full' }) +
      P.card('ra', '3 · 匯出', 'PDF：在列印對話框選擇「另存為 PDF」，紙張 A4，並勾選「背景圖形」', '<div class="c6-ractions">' +
        '<button type="button" class="c6-btn c6-btn--primary" id="pdf">' + I.icon('download') + '列印 / 儲存 PDF</button>' + P.exportButtons() +
        '<span class="c6-note" id="r-status" role="status" aria-live="polite"></span></div>', { span: 'full' }) +
      P.card('rp', '4 · 預覽', '與 PDF 使用同一份 HTML；列印時另加頁首、頁尾與頁碼', '<div class="c6-rpreview-wrap" tabindex="0" aria-label="報告預覽（可捲動）"><div class="c6-rpreview" id="preview"></div></div>', { span: 'full' }) +
      '</div>';
    document.getElementById('page').removeAttribute('aria-busy');
  }

  function renderTypes() {
    document.getElementById('types').innerHTML = RB.TYPES.map(function (t, i) {
      return '<li><button type="button" class="c6-rtype" data-type="' + t.id + '" aria-pressed="' + (t.id === state.type) + '"><span class="c6-rtype__n">Report ' + (i + 1) + '</span><span class="c6-rtype__t">' + esc(t.en) + '</span><span class="c6-rtype__z">' + esc(t.zh) + '</span></button></li>';
    }).join('');
  }

  function build() {
    var W = state.W, d = Object.assign({ assessment: W.assessment }, state.data);
    state.report = RB.build(state.type, d, { mode: W.mode, fairRunId: state.run });
    var r = state.report;
    renderRunPicker();
    document.getElementById('secs').innerHTML = r.sections.map(function (s) {
      var cls = s.status === 'READY' ? 'is-ready' : s.status === 'PARTIAL' ? 'is-partial' : 'is-na';
      var g = s.status === 'READY' ? '●' : s.status === 'PARTIAL' ? '◐' : '—';
      var lbl = s.status === 'READY' ? '已就緒' : s.status === 'PARTIAL' ? '含 DATA REQUIRED' : '不適用';
      return '<li class="' + cls + '"><span class="g" aria-hidden="true">' + g + '</span><span>' + esc(s.title) + '<span class="c6-sr-only">：' + lbl + '</span></span></li>';
    }).join('');
    document.getElementById('r-def').innerHTML = r.defaultsUsed ? P.chip('CAT.6 DEFAULT / ASSUMED VALUE', 'warn') + ' <strong>' + esc(r.defaultSentence) + '</strong> 報告封面、摘要、假設章節與頁尾都會註明。' : P.chip('組織資料', 'ok') + ' 本報告未使用 CAT.6 預設值。';
    document.getElementById('preview').innerHTML = RR.render(r);
    history.replaceState(null, '', '?type=' + state.type + (state.run ? '&run=' + encodeURIComponent(state.run) : ''));
    document.getElementById('r-status').textContent = r.title + ' · ' + r.sections.filter(function (s) { return s.status !== 'NOT_APPLICABLE'; }).length + ' 個章節';
  }

  /* Every saved simulation (newest first); the latest run of each scenario is marked. */
  function renderRunPicker() {
    var box = document.getElementById('fair-pick'), runs = (state.data.fairRuns || []).slice().sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
    box.hidden = !(state.report && state.report.hasFair && runs.length);
    if (box.hidden) return;
    var latest = {}; RB.latestPerRisk(state.data).forEach(function (r) { latest[r.id] = true; });
    var name = {}; (state.data.risks || []).forEach(function (r) { name[r.id] = r.scenario; });
    var sel = state.report.fairRunId, F = C.util.format;
    document.getElementById('fair-run').innerHTML = runs.map(function (r) {
      return '<option value="' + esc(r.id) + '"' + (r.id === sel ? ' selected' : '') + '>' + esc((r.riskId || '—') + ' · ' + (name[r.riskId] || '') + ' — ' + r.id + ' · ' + (r.at || '').replace('T', ' ').slice(0, 16) + ' · ' + F.num(r.iterations) + ' 次 · seed ' + r.seed + (latest[r.id] ? ' · 該情境最新' : '')) + '</option>';
    }).join('');
  }
  function exportCSV() {
    var tables = RB.toTables(state.report), rows = [];
    tables[0].notes.forEach(function (n) { rows.push(['# ' + n]); });
    tables.forEach(function (t) { rows.push([]); rows.push(['## ' + t.name]); X.matrix(t).forEach(function (m) { rows.push(m); }); });
    C.util.dom.download('CAT6_' + state.type + '_report_' + new Date().toISOString().slice(0, 10) + '.csv', X.toCSV(rows), 'text/csv;charset=utf-8');
  }

  P.boot({ nav: 'reports' }, function (W) {
    state.W = W; state.type = params(); state.run = runParam();
    layout();
    document.getElementById('r-as').textContent = W.assessment ? W.assessment.organization + ' · ' + W.assessment.name : '—';
    renderTypes();
    return W.load(RB.COLLECTIONS).then(function (d) {
      state.data = d;
      build();
      P.notice(document.getElementById('c6-notice'), state.report.defaultsUsed, { edit: 'risk-assessment.html', dataset: '' });
      document.getElementById('types').addEventListener('click', function (e) {
        var b = e.target.closest('[data-type]'); if (!b) return;
        state.type = b.getAttribute('data-type'); renderTypes(); build();
        var nb = document.querySelector('[data-type="' + state.type + '"]'); if (nb) nb.focus();
      });
      document.getElementById('fair-run').addEventListener('change', function (e) { state.run = e.target.value; build(); });
      document.getElementById('pdf').addEventListener('click', function () { RR.print(state.report); W.log('產生 PDF 報告：' + state.report.title, 'CALCULATED'); });
      P.bindExport(document.getElementById('ra'), function (kind) {
        if (kind === 'csv') exportCSV(); else X.downloadXLSX(RB.toTables(state.report), 'CAT6_' + state.type + '_report');
        W.log('匯出 ' + kind.toUpperCase() + ' 報告：' + state.report.title, 'CALCULATED');
      });
    });
  });
})(globalThis.CAT6);
