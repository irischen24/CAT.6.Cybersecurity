/* Data Import Center — Select Service → Select Assessment → Upload CSV / XLSX → Parse → Validate → Preview →
 * Column Mapping → Error Review → Confirm → Import. Invalid rows are listed (Row / Column / Current Value / Error /
 * Expected Format / Suggested Correction) and are never silently dropped: importing with errors requires explicit consent. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, IC = C.services.importCenter, esc = D.esc;
  var STEPS = ['Select Service', 'Select Assessment', 'Upload', 'Parse', 'Column Mapping', 'Validate', 'Preview', 'Error Review', 'Confirm', 'Import'];
  var SERVICES = [{ id: 'RA', label: 'Core Service 01 · Cybersecurity Risk Assessment & Analysis' }, { id: 'ISO', label: 'Core Service 02 · ISO/IEC 27001 Certification Readiness' }];
  var S = { service: null, ds: null, file: null, sheets: null, sheet: 0, parsed: null, map: null, result: null, done: null, ack: false, step: 0 };

  P.boot({ nav: 'import' }, function () {
    var page = document.getElementById('page');
    var want = D.qs('ds'); if (want && IC.DATASETS[want]) { S.ds = want; S.service = IC.DATASETS[want].service; }
    page.innerHTML = '<div class="c6-intro"><h2 class="c6-intro__title">Data Import Center</h2><p class="c6-intro__text">以 CSV 或 XLSX 匯入組織資料。所有列都會逐欄驗證；有錯誤的列會完整列出，不會被默默略過。匯入成功的紀錄標示 <strong>FILE_IMPORT</strong>，相同 ID 會更新既有紀錄。</p></div>' +
      '<section class="c6-card" aria-labelledby="wiz-h"><div class="c6-panel__head"><div><h2 class="c6-panel__title" id="wiz-h">Import Wizard</h2><p class="c6-panel__sub" id="wiz-sub"></p></div></div><ol class="c6-steps" id="steps" aria-label="匯入步驟"></ol><div id="wiz" class="c6-stack"></div></section>' +
      '<div class="c6-grid">' + P.card('tpl', 'Templates 範本', 'CSV 為單一資料集；XLSX 範本含 Instructions 工作表', '<div id="tpl-b"></div>', { span: 2 }) + P.card('log', 'Import Log', '目前評估的匯入紀錄', '<div id="log-b"></div>') + '</div>';

    function stepsHtml() {
      document.getElementById('steps').innerHTML = STEPS.map(function (s, i) { return '<li' + (i < S.step ? ' data-state="done"' : '') + (i === S.step ? ' aria-current="step"' : '') + '>' + (i < S.step ? '✓ ' : (i + 1) + '. ') + s + '</li>'; }).join('');
      document.getElementById('wiz-sub').textContent = '步驟 ' + (S.step + 1) + ' / ' + STEPS.length + '：' + STEPS[S.step];
    }
    function section(title, body) { return '<section class="c6-stack" style="border-top:1px solid var(--c6-border);padding-top:1rem"><h3 class="c6-panel__title" style="font-size:var(--c6-fs-base)">' + title + '</h3>' + body + '</section>'; }
    function render() {
      var h = '';
      h += section('1. Select Service', '<div class="c6-row" role="radiogroup" aria-label="服務">' + SERVICES.map(function (s) { return '<label class="c6-check"><input type="radio" name="svc" value="' + s.id + '"' + (S.service === s.id ? ' checked' : '') + '><span>' + esc(s.label) + '</span></label>'; }).join('') + '</div>');
      if (S.service) {
        h += section('2. Select Assessment', '<div class="c6-row"><label class="c6-field c6-field--inline"><span class="c6-var__lbl">目標評估</span><select class="c6-input" id="as-sel">' + (W.assessments || []).map(function (a) { return '<option value="' + esc(a.id) + '"' + (a.id === W.assessment.id ? ' selected' : '') + '>' + esc(a.id + ' · ' + a.organization + ' · ' + a.name) + '</option>'; }).join('') + '</select></label>' +
          '<label class="c6-field c6-field--inline"><span class="c6-var__lbl">資料集</span><select class="c6-input" id="ds-sel"><option value="">請選擇…</option>' + Object.keys(IC.DATASETS).filter(function (k) { return IC.DATASETS[k].service === S.service; }).map(function (k) { return '<option value="' + k + '"' + (S.ds === k ? ' selected' : '') + '>' + esc(IC.DATASETS[k].label) + '</option>'; }).join('') + '</select></label></div>' +
          (W.assessment.id === 'AS-DEMO' ? '<p class="c6-note">目前為預設評估 AS-DEMO（頂峰科技情境案例）；匯入的資料會與預設資料並存（相同 ID 會覆寫）。正式使用建議先於 Risk Assessment 建立新評估。</p>' : ''));
      }
      if (S.ds) {
        var ds = IC.DATASETS[S.ds];
        h += section('3. Upload CSV / XLSX', '<div class="c6-drop" id="drop"><p>拖放 .csv 或 .xlsx 檔案至此，或</p><label class="c6-btn c6-btn--primary" for="file">' + C.ui.icons.icon('upload') + '選擇檔案</label><input class="c6-sr-only" type="file" id="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><p class="c6-note">範本：' + esc(ds.template) + '　必填欄位：' + ds.columns.filter(function (c) { return c.required; }).map(function (c) { return esc(c.label); }).join('、') + '</p></div>' +
          (S.file ? '<p class="c6-note">已選擇：<strong>' + esc(S.file.name) + '</strong>（' + (S.file.size / 1024).toFixed(1) + ' KB）</p>' : '') + (S.parseError ? '<div class="c6-alert" role="alert">' + esc(S.parseError) + '</div>' : ''));
      }
      if (S.sheets) {
        h += section('4. Parse', '<p class="c6-note">解析完成：' + S.sheets.length + ' 個工作表。' + (S.parsed ? '標題列為第 ' + S.parsed.headerRow + ' 列，資料 ' + S.parsed.rows.length + ' 列' + (S.parsed.blank ? '（另有 ' + S.parsed.blank + ' 列空白列未計入）' : '') + '。以 # 開頭的列視為註解。' : '') + '</p>' +
          (S.sheets.length > 1 ? '<label class="c6-field c6-field--inline"><span class="c6-var__lbl">工作表</span><select class="c6-input" id="sheet-sel">' + S.sheets.map(function (s, i) { return '<option value="' + i + '"' + (i === S.sheet ? ' selected' : '') + '>' + esc(s.name) + '（' + s.rows.length + ' 列）</option>'; }).join('') + '</select></label>' : ''));
      }
      if (S.parsed && S.map) {
        var ds2 = IC.DATASETS[S.ds];
        h += section('5. Column Mapping', '<p class="c6-note">系統已依欄名與別名自動對應；請確認或調整。未對應的必填欄位會列為錯誤。</p><div class="c6-mapgrid">' + ds2.columns.map(function (c) {
          return '<label class="c6-field"><span class="c6-var__lbl">' + esc(c.label) + (c.required ? ' *' : '') + '</span><select class="c6-input" data-map="' + c.key + '"' + (c.required && S.map[c.key] == null ? ' aria-invalid="true"' : '') + '><option value="">（不匯入）</option>' + S.parsed.header.map(function (hd, i) { return '<option value="' + i + '"' + (S.map[c.key] === i ? ' selected' : '') + '>' + esc(hd || '(第 ' + (i + 1) + ' 欄)') + '</option>'; }).join('') + '</select></label>';
        }).join('') + '</div><div class="c6-actions"><button type="button" class="c6-btn c6-btn--primary" id="validate">驗證資料</button></div>');
      }
      if (S.result) {
        var r = S.result, ds3 = IC.DATASETS[S.ds];
        h += section('6. Validate', '<div class="c6-stats"><div class="c6-stat"><span class="c6-stat__label">資料列</span><span class="c6-stat__value">' + r.total + '</span></div><div class="c6-stat c6-stat--ok"><span class="c6-stat__label">可匯入</span><span class="c6-stat__value">' + r.valid.length + '</span></div><div class="c6-stat' + (r.invalidRows ? ' c6-stat--bad' : '') + '"><span class="c6-stat__label">有錯誤的列</span><span class="c6-stat__value">' + r.invalidRows + '</span></div><div class="c6-stat' + (r.errors.length ? ' c6-stat--warn' : '') + '"><span class="c6-stat__label">錯誤數</span><span class="c6-stat__value">' + r.errors.length + '</span></div></div>');
        var cols = ds3.columns.filter(function (c) { return S.map[c.key] != null; });
        h += section('7. Preview（可匯入的前 20 列）', r.valid.length ? '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">預覽</caption><thead><tr><th scope="col">Row</th>' + cols.map(function (c) { return '<th scope="col">' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          r.valid.slice(0, 20).map(function (v) { return '<tr><td>' + v.rowNo + '</td>' + cols.map(function (c) { var x = v.record[c.key]; return '<td>' + esc(Array.isArray(x) ? x.join('; ') : x == null ? '' : x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '<div class="c6-empty">沒有可匯入的列。</div>');
        h += section('8. Error Review', r.errors.length ? '<div class="c6-table-wrap"><table class="c6-table c6-errtable"><caption>⚠ 以下 ' + r.errors.length + ' 個問題（' + r.invalidRows + ' 列）不會被匯入，請修正檔案後重新上傳</caption><thead><tr><th scope="col">Row</th><th scope="col">Column</th><th scope="col">Current Value</th><th scope="col">Error</th><th scope="col">Expected Format</th><th scope="col">Suggested Correction</th></tr></thead><tbody>' +
          r.errors.map(function (e) { return '<tr class="c6-rowstate--bad"><td>' + esc(e.row) + '</td><td>' + esc(e.column) + '</td><td>' + esc(e.value) + '</td><td>' + esc(e.error) + '</td><td class="c6-t-wrap">' + esc(e.expected) + '</td><td class="c6-t-wrap">' + esc(e.suggestion) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="c6-actions"><button type="button" class="c6-btn c6-btn--ghost" id="err-csv">' + C.ui.icons.icon('download') + '下載錯誤清單 CSV</button></div>' : '<p class="c6-note">✓ 沒有錯誤。</p>');
        h += section('9. Confirm', r.valid.length ? (r.errors.length ? '<label class="c6-check"><input type="checkbox" id="ack"' + (S.ack ? ' checked' : '') + '><span>我了解有 ' + r.invalidRows + ' 列因錯誤不會匯入，只匯入 ' + r.valid.length + ' 列有效資料。</span></label>' : '') +
          '<p class="c6-note">將匯入 <strong>' + r.valid.length + '</strong> 列至 ' + esc(W.assessment.id) + ' · ' + esc(ds3.label) + '，來源標示 FILE_IMPORT。</p><div class="c6-actions"><button type="button" class="c6-btn c6-btn--primary" id="commit"' + (r.errors.length && !S.ack ? ' disabled aria-disabled="true"' : '') + '>確認匯入</button><button type="button" class="c6-btn c6-btn--ghost" id="restart">重新選擇檔案</button></div>' : '<p class="c6-note">沒有有效資料可匯入，請修正後重新上傳。</p><button type="button" class="c6-btn c6-btn--ghost" id="restart">重新選擇檔案</button>');
      }
      if (S.done != null) {
        var ds4 = IC.DATASETS[S.ds], back = { risks: 'risk-register.html', nist: 'nist-800-30.html', cisram: 'cis-ram.html', cisControls: 'cis-controls.html', cisSafeguards: 'cis-controls.html#sg', csf: 'nist-csf.html', fair: 'fair-analysis.html', isoClauses: 'iso-gap.html', isoSoa: 'iso-gap.html#soa', evidence: 'evidence.html', findings: 'iso-audit.html#findings', capas: 'iso-audit.html#capa' }[S.ds];
        h += section('10. Import', '<div class="c6-callout" role="status">✓ 已匯入 ' + S.done + ' 筆「' + esc(ds4.label) + '」（FILE_IMPORT）。' + (S.result.invalidRows ? ' ' + S.result.invalidRows + ' 列因錯誤未匯入，已記錄於匯入紀錄。' : '') + '</div><div class="c6-actions"><a class="c6-btn c6-btn--primary" href="' + back + '">查看匯入的資料</a><button type="button" class="c6-btn c6-btn--ghost" id="restart">匯入另一個檔案</button></div>');
      }
      document.getElementById('wiz').innerHTML = h;
      S.step = S.done != null ? 9 : S.result ? (S.result.errors.length ? 7 : 8) : S.map ? 4 : S.sheets ? 3 : S.ds ? 2 : S.service ? 1 : 0;
      stepsHtml();
    }
    function parse() {
      var ds = IC.DATASETS[S.ds]; S.parseError = null; S.sheets = null; S.parsed = null; S.map = null; S.result = null; S.done = null; S.ack = false;
      IC.parseFile(S.file).then(function (sheets) {
        S.sheets = sheets.filter(function (s) { return s.rows.length; });
        if (!S.sheets.length) throw new Error('檔案沒有任何資料列。');
        var want = ds.sheet || (ds.special === 'fair' ? 'Data' : 'Data'), idx = S.sheets.findIndex(function (s) { return s.name.toLowerCase() === String(want).toLowerCase(); });
        S.sheet = idx >= 0 ? idx : 0; pick();
      }).catch(function (e) { S.parseError = '無法解析 ' + S.file.name + '：' + e.message; render(); });
    }
    function pick() {
      var ds = IC.DATASETS[S.ds];
      S.parsed = IC.dataRows(S.sheets[S.sheet].rows); S.map = IC.autoMap(ds, S.parsed.header); S.result = null; S.done = null; S.ack = false;
      render(); var m = document.querySelector('[data-map]'); if (m) m.focus();
    }
    function validate() {
      return W.load(['risks']).then(function (d) {
        S.result = IC.validate(IC.DATASETS[S.ds], S.parsed, S.map, { risks: d.risks.map(function (r) { return r.id; }) });
        S.ack = false; render(); var t = document.getElementById('validate'); if (t) t.focus();
      });
    }
    page.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'svc') { S.service = t.value; if (S.ds && IC.DATASETS[S.ds].service !== S.service) S.ds = null; S.file = null; S.sheets = null; S.parsed = null; S.map = null; S.result = null; S.done = null; render(); }
      else if (t.id === 'as-sel') { W.switchAssessment(t.value).then(function () { location.href = 'data-import.html' + (S.ds ? '?ds=' + S.ds : ''); }); }
      else if (t.id === 'ds-sel') { S.ds = t.value || null; S.file = null; S.sheets = null; S.parsed = null; S.map = null; S.result = null; S.done = null; history.replaceState(null, '', S.ds ? '?ds=' + S.ds : 'data-import.html'); render(); }
      else if (t.id === 'file') { if (t.files[0]) { S.file = t.files[0]; parse(); } }
      else if (t.id === 'sheet-sel') { S.sheet = +t.value; pick(); }
      else if (t.hasAttribute('data-map')) { S.map[t.getAttribute('data-map')] = t.value === '' ? null : +t.value; S.result = null; S.done = null; render(); var again = document.querySelector('[data-map="' + t.getAttribute('data-map') + '"]'); if (again) again.focus(); }
      else if (t.id === 'ack') { S.ack = t.checked; var b = document.getElementById('commit'); if (b) { b.disabled = !S.ack; b.setAttribute('aria-disabled', String(!S.ack)); } }
    });
    page.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.id === 'validate') validate();
      else if (t.id === 'restart') { S.file = null; S.sheets = null; S.parsed = null; S.map = null; S.result = null; S.done = null; S.ack = false; render(); }
      else if (t.id === 'err-csv') C.services.exporter.downloadCSV({ name: 'Import errors', rows: S.result.errors, notes: ['File: ' + S.file.name, 'Dataset: ' + S.ds], columns: [{ key: 'row', label: 'Row' }, { key: 'column', label: 'Column' }, { key: 'value', label: 'Current Value' }, { key: 'error', label: 'Error' }, { key: 'expected', label: 'Expected Format' }, { key: 'suggestion', label: 'Suggested Correction' }] }, 'CAT6_Import_Errors');
      else if (t.id === 'commit') {
        if (S.result.errors.length && !S.ack) return;
        t.disabled = true; t.textContent = '匯入中…';
        IC.commit(IC.DATASETS[S.ds], S.result, S.file.name).then(function (n) { S.done = n; render(); log(); D.toast('已匯入 ' + n + ' 筆'); })
          .catch(function (err) { D.toast('匯入失敗：' + err.message, 'error'); t.disabled = false; t.textContent = '確認匯入'; });
      } else if (t.hasAttribute('data-tpl')) {
        var name = t.getAttribute('data-tpl'), kind = t.getAttribute('data-kind');
        if (kind === 'xlsx') D.download(name + '.xlsx', new Blob([C.services.xlsx.write(IC.templateSheets(name))], { type: C.services.xlsx.MIME }));
        else D.download(name.replace('_Template', '') + '_' + t.getAttribute('data-ds') + '_Template.csv', IC.templateCSV(IC.DATASETS[t.getAttribute('data-ds')]), 'text/csv;charset=utf-8');
      }
    });
    var drop = function (e) { var z = e.target.closest && e.target.closest('#drop'); if (!z) return; e.preventDefault(); z.setAttribute('data-over', String(e.type === 'dragover')); if (e.type === 'drop' && e.dataTransfer.files[0]) { S.file = e.dataTransfer.files[0]; parse(); } };
    ['dragover', 'dragleave', 'drop'].forEach(function (ev) { page.addEventListener(ev, drop); });

    function templates() {
      var byTpl = {}; Object.keys(IC.DATASETS).forEach(function (k) { var t = IC.DATASETS[k].template; (byTpl[t] = byTpl[t] || []).push(k); });
      document.getElementById('tpl-b').innerHTML = '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">匯入範本</caption><thead><tr><th scope="col">Template</th><th scope="col">資料集</th><th scope="col">下載</th></tr></thead><tbody>' +
        Object.keys(byTpl).map(function (t) { return '<tr><td>' + esc(t) + '</td><td class="c6-t-wrap">' + byTpl[t].map(function (k) { return esc(IC.DATASETS[k].label); }).join('<br>') + '</td><td><div class="c6-row"><button type="button" class="c6-btn c6-btn--secondary c6-btn--sm" data-tpl="' + t + '" data-kind="xlsx">XLSX</button>' +
          byTpl[t].map(function (k) { return '<button type="button" class="c6-btn c6-btn--ghost c6-btn--sm" data-tpl="' + t + '" data-kind="csv" data-ds="' + k + '">CSV · ' + esc(IC.DATASETS[k].sheet || k) + '</button>'; }).join('') + '</div></td></tr>'; }).join('') + '</tbody></table></div><p class="c6-note">靜態範本檔亦位於專案 templates/ 目錄。</p>';
    }
    function log() {
      W.load(['importLog']).then(function (d) {
        var l = d.importLog.slice().sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
        document.getElementById('log-b').innerHTML = l.length ? '<ul class="c6-feed">' + l.slice(0, 12).map(function (x) {
          return '<li class="c6-feed__item"><span class="c6-feed__avatar" aria-hidden="true">⇪</span><div><p class="c6-feed__what">' + esc(x.file) + ' → ' + esc(x.dataset) + '</p><p class="c6-feed__who">' + esc((x.at || '').slice(0, 16).replace('T', ' ')) + ' · 匯入 ' + x.imported + ' / ' + x.total + (x.invalidRows ? ' · ' + x.invalidRows + ' 列錯誤未匯入' : '') + '</p></div></li>';
        }).join('') + '</ul>' : '<p class="c6-note">此評估尚無匯入紀錄。</p>';
      });
    }
    render(); templates(); log(); page.removeAttribute('aria-busy');
  });
})(globalThis.CAT6);
