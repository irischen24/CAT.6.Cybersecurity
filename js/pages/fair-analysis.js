/* FAIR Analysis page controller — multi-scenario (1…N `fairInputs` records, each simulated independently).
 * State lives here; all math is in calc/ + services/ (fairScenarios.js documents the data model). */
(function (C) {
  var DEF = C.data.fairDefaults, F = C.util.format, P = C.util.provenance, PG = C.ui.page, esc = PG.esc;
  var W = null, risks = [], runs = [], saved = null, job = null, scenarios = [], FS = C.services.fairScenarios;
  var $ = function (id) { return document.getElementById(id); };
  var state = { fields: [], riskId: DEF.scenario.id, scn: 'fair', name: '', currency: 'TWD', iterations: DEF.simulation.iterations, seed: DEF.simulation.seed, result: null };
  var LABELS = { TEF: 'TEF（次/年）', LEF: 'LEF（次/年）', PrimaryLoss: 'Primary Loss', SecondaryLoss: 'Secondary Loss', LM: 'Loss Magnitude', AnnualRisk: 'Annual Risk' };
  var MONEY = { PrimaryLoss: 1, SecondaryLoss: 1, LM: 1, AnnualRisk: 1 };

  function resetDefaults() {
    state.fields = DEF.fields.map(function (f) { return Object.assign({}, f, { value: Object.assign({}, f.value), error: null }); });
  }
  /* Merge a stored fairInputs record (field, value, source) onto the default field metadata (labels, units, reasons). */
  function fromRecord(rec) {
    resetDefaults();
    if (!rec) return;
    if (rec.riskId) state.riskId = rec.riskId;
    state.scn = rec.scenarioId || rec.id; state.name = rec.scenarioName || ''; state.currency = rec.currency || 'TWD';
    (rec.fields || []).forEach(function (sf) {
      var f = state.fields.filter(function (x) { return x.field === sf.field; })[0];
      if (f && sf.value) { f.value = Object.assign({}, sf.value); f.source = sf.source || rec.source || 'USER_INPUT'; }
    });
  }
  function toRecord() {
    var fields = state.fields.map(function (f) { return { field: f.field, value: Object.assign({}, f.value), source: f.source }; });
    return Object.assign({}, saved || {}, { id: state.scn, scenarioId: state.scn, scenarioName: state.name || riskName(state.riskId), riskId: state.riskId, currency: state.currency,
      iterations: state.iterations, seed: state.seed, fields: fields, dataSource: FS.fieldsSource(fields), assumptionStatus: FS.assumptionStatus(fields),
      source: usesDefaults() ? 'CAT6_DEFAULT' : (state.fields.some(function (f) { return f.source === 'FILE_IMPORT'; }) ? 'FILE_IMPORT' : 'USER_INPUT') });
  }
  function persist(msg) {
    var rec = toRecord();
    return W.save('fairInputs', rec, { source: rec.source, keepSource: true, verb: '更新 FAIR 輸入' }).then(function (r) {
      saved = r; scenarios = scenarios.filter(function (x) { return (x.scenarioId || x.id) !== r.id; }).concat([FS.scenario(r)]); renderScenarioSel();
      $('save-status').textContent = msg || ('已儲存 ' + r.id + ' · ' + new Date().toLocaleTimeString('zh-TW'));
      $('in-prov').innerHTML = P.badge(r.source);
    });
  }
  function riskName(id) { var r = risks.filter(function (x) { return x.id === id; })[0]; return r ? r.id + ' · ' + r.scenario : id === DEF.scenario.id ? DEF.scenario.name : id || '—'; }
  function inputsObj() { var o = {}; state.fields.forEach(function (f) { o[f.field] = f.value; }); return o; }
  function usesDefaults() { return state.fields.some(function (f) { return f.source === 'CAT6_DEFAULT'; }); }
  var toView = function (f, v) { return f.kind === 'prob' ? +(v * 100).toFixed(4) : v; };
  var fromView = function (f, v) { return f.kind === 'prob' ? v / 100 : v; };


  /* ---- Notice ---- */
  function renderNotice() {
    var d = usesDefaults();
    $('default-notice').style.borderStyle = d ? 'dashed' : 'solid';
    $('notice-text').innerHTML = d
      ? '<strong>This analysis contains CAT.6 default / assumed values.</strong><br>標示 CAT6_DEFAULT 的欄位為示範假設，非組織實際資料、非 FAIR 官方數值。'
      : '<strong>所有輸入皆為組織提供或匯入的資料。</strong><br>結果仍需由風險負責人審閱後才可用於決策。';
  }

  /* ---- Inputs ---- */
  function renderInputs() {
    $('fair-form').innerHTML = state.fields.map(function (f, i) {
      var unit = f.kind === 'prob' ? '%' : f.kind === 'money' ? 'NT$' : f.unit;
      var cells = [['min', 'Min'], ['mostLikely', 'Most Likely'], ['max', 'Max']].map(function (p) {
        var id = 'f' + i + p[0];
        return '<label class="c6-field" for="' + id + '"><span class="c6-var__lbl">' + p[1] + '（' + unit + '）</span>' +
          '<input class="c6-input" id="' + id + '" data-i="' + i + '" data-k="' + p[0] + '" type="number" inputmode="decimal" step="any" required value="' + toView(f, f.value[p[0]]) + '"' +
          (f.error ? ' aria-invalid="true" aria-describedby="err' + i + '"' : '') + '></label>';
      }).join('');
      return '<fieldset class="c6-var" style="margin:0;min-width:0"' + (f.error ? ' data-invalid="true"' : '') + '>' +
        '<legend class="c6-sr-only">' + f.label + '</legend>' +
        '<div class="c6-var__head"><p class="c6-var__name">' + f.label + ' <span class="c6-var__unit">' + f.field + ' · ' + f.unit + ' · 必填</span></p>' + P.badge(f.source) + '</div>' +
        '<div class="c6-var__row">' + cells + '</div>' +
        (f.error ? '<p class="c6-var__err" id="err' + i + '"><span aria-hidden="true">⚠</span>' + f.error + '</p>' : '') +
        '<p class="c6-var__reason">' + (f.source === 'CAT6_DEFAULT' ? '假設理由：' + f.reason : f.source === 'FILE_IMPORT' ? '由 CSV 匯入' : '由使用者輸入') + '</p></fieldset>';
    }).join('');
  }
  $('fair-form').addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || t.dataset.i == null) return;
    var f = state.fields[+t.dataset.i], v = parseFloat(t.value);
    f.value[t.dataset.k] = isNaN(v) ? NaN : fromView(f, v);
    f.source = 'USER_INPUT';
    validateFields(); renderInputs(); renderNotice(); renderAssumptions();
    if (validateFields()) persist();
    var again = document.getElementById(t.id); if (again) again.focus();
  });
  function validateFields() {
    state.fields.forEach(function (f) { f.error = null; });
    C.calc.fair.validate(inputsObj()).forEach(function (e) {
      var f = state.fields.filter(function (x) { return x.field === e.field; })[0];
      if (f && !f.error) f.error = e.expected;
    });
    return state.fields.every(function (f) { return !f.error; });
  }
  $('use-defaults').addEventListener('click', function () { resetDefaults(); renderAll(); persist('已還原為 CAT.6 預設值（CAT6_DEFAULT）'); });

  /* ---- Simulation settings ---- */
  $('presets').innerHTML = DEF.presets.map(function (p) {
    return '<label class="c6-seg__opt"><input type="radio" name="iters" value="' + p.iterations + '"' + (p.iterations === state.iterations ? ' checked' : '') + '>' +
      '<span class="c6-seg__lab"><strong>' + F.num(p.iterations) + '</strong>' + p.label + '</span></label>';
  }).join('');
  $('presets').addEventListener('change', function (e) { state.iterations = +e.target.value; });
  $('seed').value = state.seed;
  $('seed').addEventListener('change', function () { state.seed = parseInt($('seed').value, 10) || 0; });

  /* ---- Run (Web Worker via C.services.fair.start; main-thread fallback on file://) ---- */
  function setState(kind, text) {
    var map = { idle: ['NOT_ASSESSED', 'Idle'], running: ['PARTIAL', 'Running'], done: ['IMPLEMENTED', 'Completed'], error: ['NOT_IMPLEMENTED', 'Error'], cancel: ['NOT_ASSESSED', 'Cancelled'] }[kind];
    $('run-state').innerHTML = '<span class="c6-st c6-st--' + map[0] + '">' + map[1] + '</span> ' + esc(text || '');
  }
  $('run').addEventListener('click', function () {
    if (!validateFields()) { renderInputs(); var bad = document.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); setState('error', '輸入值未通過驗證，請修正標示的欄位'); return; }
    var btn = $('run'), prog = $('progress'), bar = prog.querySelector('.c6-progress__bar'), txt = prog.querySelector('.c6-progress__text'), track = prog.querySelector('[role="progressbar"]');
    btn.disabled = true; btn.textContent = '模擬中…'; prog.hidden = false; $('cancel').hidden = false;
    bar.style.width = '0%'; track.setAttribute('aria-valuenow', 0);
    var snapshot = JSON.parse(JSON.stringify(state.fields)), iters = state.iterations, seed = state.seed;
    /* Scenario identity is captured when the run STARTS, so switching scenarios during a run can never attach this
     * result to another scenario. Each run has its own Worker (fairAnalysisService) and job id. */
    var ident = { scenarioId: state.scn, scenarioName: state.name || riskName(state.riskId), riskId: state.riskId, currency: state.currency };
    job = C.services.fair.start(inputsObj(), { iterations: iters, seed: seed }, function (p) {
      if (p.phase === 'fallback') { setState('running', '主執行緒模式：' + p.reason); return; }
      var pc = Math.round(p.progress * 100);
      bar.style.width = pc + '%'; track.setAttribute('aria-valuenow', pc);
      txt.textContent = (p.phase === 'simulate' ? '抽樣中 ' : '計算百分位 ') + pc + '%';
    });
    setState('running', F.num(iters) + ' 次 · seed ' + seed + ' · 引擎：' + (job.engine === 'worker' ? 'Web Worker' : '主執行緒'));
    job.promise.then(function (res) {
      res.inputs = snapshot; Object.assign(res, ident);
      if (state.scn === ident.scenarioId) state.result = res;
      var eng = res.engine === 'worker' ? 'Web Worker' : '主執行緒分段計算';
      bar.style.width = '100%'; track.setAttribute('aria-valuenow', 100);
      txt.textContent = '完成：' + F.num(res.iterations) + ' 次，' + (res.durationMs / 1000).toFixed(1) + ' 秒';
      setState('done', F.num(res.iterations) + ' 次 · ' + (res.durationMs / 1000).toFixed(1) + ' 秒 · 引擎：' + eng + (res.fallbackReason ? '（' + res.fallbackReason + '）' : ''));
      if (state.scn === ident.scenarioId) renderResults();
      return saveRun(res);
    }).catch(function (err) {
      if (err.cancelled) { setState('cancel', '已取消，未保存結果'); txt.textContent = '已取消'; return; }
      setState('error', err.errors ? err.errors.map(function (e) { return e.field + ' ' + e.expected; }).join('；') : err.message);
      txt.textContent = '無法執行';
    }).then(function () { btn.disabled = false; btn.textContent = 'Run Monte Carlo Simulation'; $('cancel').hidden = true; job = null; });
  });
  $('cancel').addEventListener('click', function () { if (job) job.cancel(); });

  function saveRun(res) {
    var rec = { id: C.util.dom.nextId('RUN', runs, 4), scenarioId: res.scenarioId, scenarioName: res.scenarioName, riskId: res.riskId, currency: res.currency, at: new Date().toISOString(), iterations: res.iterations, seed: res.seed, engine: res.engine,
      results: FS.results(res.summaries), distributionData: res.histogram, exceedanceCurveData: res.exceedance,
      dataSource: FS.fieldsSource(res.inputs), assumptionStatus: FS.assumptionStatus(res.inputs),
      durationMs: res.durationMs, summaries: res.summaries, histogram: res.histogram, exceedance: res.exceedance, pointEstimate: res.pointEstimate,
      inputs: res.inputs.map(function (f) { return { field: f.field, value: f.value, source: f.source, unit: f.unit }; }),
      defaultsUsed: res.inputs.some(function (f) { return f.source === 'CAT6_DEFAULT'; }) };
    return W.save('fairRuns', rec, { source: 'CALCULATED', verb: '完成 FAIR 模擬' }).then(function (r) {
      runs.push(r); renderRuns();
    }).catch(function (e) { C.util.dom.toast('模擬結果未能保存：' + e.message, 'bad'); });
  }

  function renderRuns() {
    var list = runs.slice().sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
    $('runs').innerHTML = list.length ? '<div class="c6-table-wrap"><table class="c6-table"><caption class="c6-sr-only">FAIR 模擬紀錄</caption><thead><tr><th scope="col">Run</th><th scope="col">時間</th><th scope="col">Scenario</th><th scope="col">風險</th><th scope="col" class="c6-t-num">Iterations</th><th scope="col" class="c6-t-num">Seed</th><th scope="col">引擎</th><th scope="col" class="c6-t-num">ALE Mean</th><th scope="col" class="c6-t-num">P90</th><th scope="col">來源</th><th scope="col">操作</th></tr></thead><tbody>' +
      list.map(function (r) {
        var ar = r.summaries.AnnualRisk;
        return '<tr><td>' + esc(r.id) + '</td><td>' + esc((r.at || '').replace('T', ' ').slice(0, 16)) + '</td><td>' + esc(FS.scenarioOf(r, scenarios) + (r.scenarioName ? ' · ' + r.scenarioName : '')) + '</td><td>' + esc(r.riskId || '—') + '</td><td class="c6-t-num">' + F.num(r.iterations) + '</td><td class="c6-t-num">' + r.seed + '</td><td>' + (r.engine === 'worker' ? 'Web Worker' : '主執行緒') + '</td><td class="c6-t-num">' + F.currency(ar.Mean) + '</td><td class="c6-t-num">' + F.currency(ar.P90) + '</td><td>' + P.badge('CALCULATED') + (r.defaultsUsed ? ' ' + PG.chip('含預設值', 'warn') : '') + '</td><td><button type="button" class="c6-btn c6-btn--ghost c6-btn--sm" data-show="' + esc(r.id) + '">顯示</button> <button type="button" class="c6-btn c6-btn--ghost c6-btn--sm" data-del="' + esc(r.id) + '" aria-label="刪除 ' + esc(r.id) + '">刪除</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="c6-empty">尚無模擬紀錄。執行一次模擬後會自動保存摘要。</div>';
  }
  $('runs').addEventListener('click', function (e) {
    var sh = e.target.closest('[data-show]'), dl = e.target.closest('[data-del]');
    if (sh) {
      var r = runs.filter(function (x) { return x.id === sh.getAttribute('data-show'); })[0]; if (!r) return;
      state.result = Object.assign({}, r, { inputs: r.inputs.map(function (i) { var d = DEF.fields.filter(function (f) { return f.field === i.field; })[0] || {}; return Object.assign({}, d, i); }) });
      renderResults(); setState('done', '顯示已保存的 ' + r.id + '（' + F.num(r.iterations) + ' 次 · seed ' + r.seed + '）');
      document.getElementById('kpi-h').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    if (dl) {
      var id = dl.getAttribute('data-del');
      C.ui.form.confirm('刪除模擬紀錄 ' + id + '？', '刪除').then(function (ok) {
        if (!ok) return;
        return W.remove('fairRuns', id).then(function () { runs = runs.filter(function (x) { return x.id !== id; }); renderRuns(); });
      });
    }
  });

  /* ---- Results ---- */
  function renderResults() {
    var r = state.result, s = r.summaries, ar = s.AnnualRisk, money = function (v) { return F.currency(v, 'TWD', { compact: true }); };
    $('run-meta').textContent = (r.scenarioId ? r.scenarioId + ' ' + (r.scenarioName || '') + ' · ' : '') + riskName(r.riskId) + ' · ' + F.num(r.iterations) + ' 次 · seed ' + r.seed + (r.engine ? ' · ' + (r.engine === 'worker' ? 'Web Worker' : '主執行緒') : '') + (r.inputs.some(function (f) { return f.source === 'CAT6_DEFAULT'; }) ? ' · 含 CAT.6 預設值' : '');
    $('res-prov').innerHTML = P.badge('CALCULATED');
    var k = [
      ['TEF · P50', s.TEF.P50.toFixed(2), '次/年', false], ['LEF · P50', s.LEF.P50.toFixed(2), '次/年', false],
      ['Mean Annual Risk', money(ar.Mean), 'ALE 年化預期損失', true], ['Annual Risk · P50', money(ar.P50), '一半年度低於此值', false],
      ['Annual Risk · P90', money(ar.P90), '10 年約 1 次超過', true], ['Annual Risk · P95', money(ar.P95), '20 年約 1 次超過', false]
    ];
    $('kpis').innerHTML = '<div class="c6-fair-kpis">' + k.map(function (x) {
      return '<div class="c6-fair-kpi' + (x[3] ? ' c6-fair-kpi--key' : '') + '"><span class="c6-fair-kpi__label">' + x[0] + '</span><span class="c6-fair-kpi__value">' + x[1] + '</span><span class="c6-fair-kpi__unit">' + x[2] + '</span></div>';
    }).join('') + '</div>';

    C.charts.fair.histogram($('hist'), r.histogram, ar);
    $('hist-sum').textContent = '中位數 ' + money(ar.P50) + '，平均 ' + money(ar.Mean) + '（右偏：平均高於中位數，因 Secondary Loss 上限拉長尾端）。' + (r.histogram.overflow ? '另有 ' + F.pct(r.histogram.overflow / r.histogram.n, 1) + ' 的模擬年度高於圖表上限 ' + money(r.histogram.hi) + '。' : '');
    C.charts.fair.exceedance($('exc'), r.exceedance, ar);
    $('exc-sum').textContent = '年度損失超過 ' + money(ar.P90) + ' 的機率約 10%，超過 ' + money(ar.P95) + ' 約 5%。';

    var lm = s.LM.Mean, plShare = s.PrimaryLoss.Mean / lm;
    $('components').innerHTML =
      '<div class="c6-srcbar" role="img" aria-label="Primary ' + F.pct(plShare) + '，Secondary ' + F.pct(1 - plShare) + '" style="height:14px;margin-bottom:1rem"><span class="c6-srcbar__seg" style="width:' + plShare * 100 + '%;background:#8B6EFF"></span><span class="c6-srcbar__seg" style="width:' + (1 - plShare) * 100 + '%;background:repeating-linear-gradient(45deg,#5E6AD2 0 4px,rgba(94,106,210,.45) 4px 8px)"></span></div>' +
      table(['項目', 'Mean', 'P90', '佔比'], [
        ['PL（實心）', money(s.PrimaryLoss.Mean), money(s.PrimaryLoss.P90), F.pct(plShare)],
        ['SL（斜紋）', money(s.SecondaryLoss.Mean), money(s.SecondaryLoss.P90), F.pct(1 - plShare)],
        ['LM', money(s.LM.Mean), money(s.LM.P90), '100%']
      ]) + '<p class="c6-note" style="margin-top:.75rem">' + (plShare < 0.5 ? 'Secondary Loss' : 'Primary Loss') + ' 佔單次損失平均值的多數（' + F.pct(Math.max(plShare, 1 - plShare)) + '）。</p>';

    var pe = r.pointEstimate;
    $('point').innerHTML = table(['步驟', '值'], [
      ['TEF = CF × PoA', pe.TEF.toFixed(2) + ' 次/年'], ['LEF = TEF × Susc.', pe.LEF.toFixed(2) + ' 次/年'],
      ['LM = PL + SL', F.currency(pe.LM)], ['Risk = LEF × LM', F.currency(pe.AnnualRisk)]
    ]) + (r.inputs.some(function (f) { return f.source === 'CAT6_DEFAULT'; }) ? '<p class="c6-note" style="margin-top:.75rem">筆記 Step 2 以 PL = NT$1,350,000 得 NT$7,110,000；此處採程式引擎的 PL 最可能值 NT$1,530,000。模擬 P50 高於點估計，因 SL 分布右偏。</p>' : '<p class="c6-note" style="margin-top:.75rem">點估計使用各變數 Most Likely 值；與模擬 P50 的差異來自分布的偏態。</p>');

    var cols = ['P10', 'P25', 'P50', 'Mean', 'P75', 'P90', 'P95'];
    $('ptable').innerHTML = table(['變數'].concat(cols), C.calc.fair.OUTPUT_KEYS.map(function (key) {
      return [LABELS[key]].concat(cols.map(function (c) { return MONEY[key] ? F.currency(s[key][c]) : s[key][c].toFixed(3); }));
    }), true);
    $('export').disabled = false; $('export-x').disabled = false;
  }

  function table(head, rows, numeric) {
    return '<div class="c6-table-wrap"><table class="c6-table"><thead><tr>' + head.map(function (h, i) { return '<th scope="col"' + (i && numeric !== false ? ' class="c6-t-num"' : '') + '>' + h + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i ? '<td class="c6-t-num">' + c + '</td>' : '<th scope="row" style="font-weight:500;text-align:left;padding:.625rem .75rem;border-bottom:1px solid var(--c6-border);white-space:nowrap">' + c + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }

  function renderAssumptions() {
    $('atable').innerHTML = '<div class="c6-table-wrap"><table class="c6-table"><thead><tr><th scope="col">欄位</th><th scope="col" class="c6-t-num">Min</th><th scope="col" class="c6-t-num">Most Likely</th><th scope="col" class="c6-t-num">Max</th><th scope="col">單位</th><th scope="col">來源</th><th scope="col">假設 / 理由</th></tr></thead><tbody>' +
      state.fields.map(function (f) {
        var fmt = function (v) { return f.kind === 'money' ? F.currency(v) : f.kind === 'prob' ? F.pct(v, 0) : v; };
        return '<tr><td>' + f.field + '</td><td class="c6-t-num">' + fmt(f.value.min) + '</td><td class="c6-t-num">' + fmt(f.value.mostLikely) + '</td><td class="c6-t-num">' + fmt(f.value.max) + '</td><td>' + f.unit + '</td><td>' + P.badge(f.source) + '</td><td style="white-space:normal;min-width:18rem">' + (f.source === 'CAT6_DEFAULT' ? f.assumption + '：' + f.reason : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="c6-note" style="margin-top:.75rem">預設值版本 ' + DEF.version + '（' + DEF.lastUpdated + '）。來源：FAIR筆記-20260926-Iris.md。</p>';
  }

  /* ---- CSV import & template ---- */
  function download(name, text, type) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: type || 'text/csv' }));
    a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }
  $('dl-template').addEventListener('click', function () { download('CAT6_FAIR_Template.csv', C.services.csvImport.fairTemplate()); });
  $('csv').addEventListener('change', function (e) {
    var file = e.target.files[0]; if (!file) return;
    file.text().then(function (text) {
      var res = C.services.csvImport.importFair(text), n = 0;
      state.fields.forEach(function (f) { if (res.values[f.field]) { f.value = res.values[f.field]; f.source = 'FILE_IMPORT'; n++; } });
      $('imp-status').textContent = file.name + '：' + res.rowCount + ' 列，匯入 ' + n + ' 個變數，' + res.errors.length + ' 個問題。' + (n < 5 ? ' 未匯入的變數保留原值與原來源標示。' : '');
      $('imp-errors').innerHTML = res.errors.length ? '<div class="c6-table-wrap" style="margin-top:1rem"><table class="c6-table c6-errtable"><caption>⚠ 以下資料未被匯入，請修正後重新上傳</caption><thead><tr><th scope="col">Row</th><th scope="col">Column</th><th scope="col">Value</th><th scope="col">Error</th><th scope="col">Expected Format</th><th scope="col">Suggested Correction</th></tr></thead><tbody>' +
        res.errors.map(function (er) { return '<tr><td>' + er.row + '</td><td>' + er.column + '</td><td>' + String(er.value).replace(/</g, '&lt;') + '</td><td>' + er.error + '</td><td>' + er.expected + '</td><td>' + er.suggestion + '</td></tr>'; }).join('') + '</tbody></table></div>' : '';
      validateFields(); renderAll(); e.target.value = '';
      if (n) persist('已匯入並儲存（FILE_IMPORT）');
    });
  });
  function exportTables() {
    var r = state.result, cols = ['P10', 'P25', 'P50', 'Mean', 'P75', 'P90', 'P95'], defs = r.inputs.some(function (f) { return f.source === 'CAT6_DEFAULT'; });
    var notes = ['CAT.6 FAIR Quantitative Risk — ' + riskName(r.riskId), 'iterations=' + r.iterations + ', seed=' + r.seed + ', engine=' + (r.engine || ''),
      defs ? 'This analysis contains CAT.6 default / assumed values.' : 'Inputs provided by organization'];
    return [
      { name: 'Inputs', sheet: 'Inputs', notes: notes, rows: r.inputs, columns: [{ key: 'field', label: 'input' }, { key: 'min', label: 'min', get: function (f) { return f.value.min; } }, { key: 'ml', label: 'most_likely', get: function (f) { return f.value.mostLikely; } }, { key: 'max', label: 'max', get: function (f) { return f.value.max; } }, { key: 'unit', label: 'unit' }, { key: 'source', label: 'provenance' }] },
      { name: 'Outputs', sheet: 'Outputs', notes: notes, rows: C.calc.fair.OUTPUT_KEYS.map(function (k) { return Object.assign({ output: k, provenance: 'CALCULATED' }, r.summaries[k]); }),
        columns: [{ key: 'output', label: 'output' }].concat(cols.map(function (c) { return { key: c, label: c, get: function (row) { return +(+row[c]).toFixed(4); } }; })).concat([{ key: 'provenance', label: 'provenance' }]) }
    ];
  }
  $('export').addEventListener('click', function () {
    var t = exportTables(), X = C.services.exporter;
    var rows = t[0].notes.map(function (n) { return ['# ' + n]; }).concat([[]], X.matrix(t[0]), [[]], X.matrix(t[1]));
    C.util.dom.download('CAT6_FAIR_Result_seed' + state.result.seed + '.csv', X.toCSV(rows), 'text/csv;charset=utf-8');
  });
  $('export-x').addEventListener('click', function () { C.services.exporter.downloadXLSX(exportTables(), 'CAT6_FAIR_Result_seed' + state.result.seed); });

  /* ---- Scenario selector ---- */
  function renderRiskSel() {
    var opts = risks.map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === state.riskId ? ' selected' : '') + '>' + esc(r.id + ' · ' + r.scenario) + '</option>'; });
    if (!risks.some(function (r) { return r.id === state.riskId; })) opts.unshift('<option value="' + esc(state.riskId) + '" selected>' + esc(riskName(state.riskId)) + '（不在目前的 Risk Register）</option>');
    $('risk-sel').innerHTML = opts.join('');
    $('risk-link').href = 'risk-register.html?id=' + encodeURIComponent(state.riskId);
  }
  $('risk-sel').addEventListener('change', function (e) { state.riskId = e.target.value; renderRiskSel(); persist('已將 ' + state.scn + ' 指派到 ' + state.riskId); });
  $('scn-name').addEventListener('change', function (e) { state.name = e.target.value.trim(); persist(); });
  $('scn-cur').addEventListener('change', function (e) { state.currency = e.target.value; persist('幣別已改為 ' + state.currency + '（僅影響顯示與情境比較，不換算金額）'); });

  /* ---- Scenarios (1…N) ---- */
  function renderScenarioSel() {
    var list = scenarios.slice().sort(function (a, b) { return String(a.scenarioId).localeCompare(String(b.scenarioId)); });
    $('scn-sel').innerHTML = list.map(function (x) { var id = x.scenarioId || x.id; return '<option value="' + esc(id) + '"' + (id === state.scn ? ' selected' : '') + '>' + esc(id + ' · ' + (x.scenarioName || riskName(x.riskId)) + ' · ' + (x.riskId || '—')) + '</option>'; }).join('') ||
      '<option value="' + esc(state.scn) + '" selected>' + esc(state.scn + '（尚未儲存）') + '</option>';
    $('scn-name').value = state.name || ''; $('scn-cur').value = state.currency || 'TWD';
    $('scn-del').disabled = scenarios.length === 0;
  }
  function latestRunOf(id) { return runs.filter(function (r) { return FS.scenarioOf(r, scenarios) === id; }).sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); })[0]; }
  function showRun(r) { state.result = Object.assign({}, r, { inputs: (r.inputs || []).map(function (i) { var df = DEF.fields.filter(function (f) { return f.field === i.field; })[0] || {}; return Object.assign({}, df, i); }) }); renderResults(); }
  function selectScenario(id) {
    var rec = scenarios.filter(function (x) { return (x.scenarioId || x.id) === id; })[0];
    saved = rec || null; fromRecord(rec); validateFields(); renderAll(); renderRiskSel(); renderScenarioSel();
    $('in-prov').innerHTML = P.badge(rec ? rec.source : 'CAT6_DEFAULT');
    var last = latestRunOf(id);
    if (last) { showRun(last); setState('done', '顯示 ' + id + ' 最近一次保存的 ' + last.id); } else { state.result = null; ['kpis', 'hist', 'hist-sum', 'components', 'exc', 'exc-sum', 'point', 'ptable', 'run-meta'].forEach(function (k) { var el = $(k); if (el) el.innerHTML = ''; }); $('export').disabled = true; $('export-x').disabled = true; setState('idle', id + ' 尚未執行模擬'); }
    history.replaceState(null, '', '?scenario=' + encodeURIComponent(id));
  }
  $('scn-sel').addEventListener('change', function (e) { if (job) { C.util.dom.toast('模擬進行中；結果仍會保存到原情境。'); } selectScenario(e.target.value); });
  $('scn-add').addEventListener('click', function () {
    var used = {}; scenarios.forEach(function (x) { used[x.riskId] = 1; });
    var r = risks.filter(function (x) { return !used[x.id]; })[0] || risks[0], id = FS.nextId(scenarios);
    resetDefaults(); saved = null; state.scn = id; state.riskId = r ? r.id : DEF.scenario.id; state.name = r ? r.scenario : ''; state.currency = 'TWD';
    persist('已新增情境 ' + id + '（輸入值為 CAT.6 預設值，請改為組織資料）').then(function () { selectScenario(id); });
  });
  $('scn-del').addEventListener('click', function () {
    var id = state.scn, mine = runs.filter(function (r) { return FS.scenarioOf(r, scenarios) === id; });
    C.ui.form.confirm('刪除情境 ' + id + ' 及其 ' + mine.length + ' 筆模擬紀錄？', '刪除').then(function (ok) {
      if (!ok) return;
      return Promise.all([W.remove('fairInputs', id)].concat(mine.map(function (r) { return W.remove('fairRuns', r.id); }))).then(function () {
        scenarios = scenarios.filter(function (x) { return (x.scenarioId || x.id) !== id; }); runs = runs.filter(function (r) { return mine.indexOf(r) < 0; });
        renderRuns(); if (scenarios.length) selectScenario(scenarios[0].scenarioId || scenarios[0].id); else { resetDefaults(); state.scn = FS.nextId([]); renderAll(); renderScenarioSel(); }
      });
    });
  });
  /* Run every scenario in sequence — one independent Worker / seed per scenario; results are keyed by scenarioId. */
  $('run-all').addEventListener('click', function () {
    var list = scenarios.slice(), btn = $('run-all'), done = 0, failed = [];
    if (!list.length) return;
    btn.disabled = true; $('run').disabled = true;
    list.reduce(function (p, sc) {
      return p.then(function () {
        var inp = {}; (sc.fields || []).forEach(function (f) { inp[f.field] = f.value; });
        var seed = sc.seed != null ? sc.seed : state.seed, iters = state.iterations;
        var ident = { scenarioId: sc.scenarioId || sc.id, scenarioName: sc.scenarioName || riskName(sc.riskId), riskId: sc.riskId, currency: sc.currency || 'TWD' };
        setState('running', '執行 ' + ident.scenarioId + '（' + (done + 1) + ' / ' + list.length + '）· ' + F.num(iters) + ' 次 · seed ' + seed);
        var j = C.services.fair.start(inp, { iterations: iters, seed: seed }, function () {});
        return j.promise.then(function (res) {
          res.inputs = (sc.fields || []).map(function (f) { var df = DEF.fields.filter(function (x) { return x.field === f.field; })[0] || {}; return Object.assign({}, df, f); });
          Object.assign(res, ident); done++; return saveRun(res);
        }, function (e) { failed.push(ident.scenarioId + '：' + (e.errors ? e.errors.map(function (x) { return x.field; }).join(', ') : e.message)); });
      });
    }, Promise.resolve()).then(function () {
      btn.disabled = false; $('run').disabled = false;
      selectScenario(state.scn);
      setState(failed.length ? 'error' : 'done', '已完成 ' + done + ' / ' + list.length + ' 個情境' + (failed.length ? '；失敗：' + failed.join('；') : '') + '；目前顯示 ' + state.scn);
    });
  });
  $('save-inputs').addEventListener('click', function () { if (!validateFields()) { renderInputs(); $('save-status').textContent = '輸入值有誤，未儲存。'; return; } persist(); });

  function renderAll() { renderNotice(); renderInputs(); renderAssumptions(); }

  PG.boot({ nav: 'fair' }, function (w) {
    W = w;
    return W.load(['risks', 'fairInputs', 'fairRuns']).then(function (d) {
      risks = d.risks; runs = d.fairRuns; scenarios = d.fairInputs.map(FS.scenario);
      var q = new URLSearchParams(location.search), qs = q.get('scenario'), qr = q.get('risk');
      var pick = scenarios.filter(function (x) { return (x.scenarioId || x.id) === qs; })[0] || (qr && scenarios.filter(function (x) { return x.riskId === qr; })[0]) || scenarios[0];
      renderRuns();
      if (pick) selectScenario(pick.scenarioId || pick.id);
      else { fromRecord(null); state.scn = 'fair'; if (qr && risks.some(function (r) { return r.id === qr; })) state.riskId = qr; $('in-prov').innerHTML = P.badge('CAT6_DEFAULT'); validateFields(); renderAll(); renderRiskSel(); renderScenarioSel(); setState('idle', '尚未執行'); }
    });
  });
})(globalThis.CAT6);
