/* Report Data Builder — Structured Result Data → Report Model.
 * Pure function of the workspace data: no DOM, no screenshots. The renderer (reportRenderer.js) turns the
 * model into print-ready HTML; the same model feeds CSV / XLSX export, so every format shows the same numbers.
 *
 * Model: { type, title, subtitle, generatedAt, assessment, defaultsUsed, sections: [
 *   { id, title, status: 'READY' | 'PARTIAL' | 'NOT_APPLICABLE', blocks: [block] } ] }
 * Blocks: p · callout{tone} · kv{rows} · list{items} · table{caption, columns[{key,label,num,wrap}], rows, provKey} · chart{svg, caption, summary}
 * Every table row that comes from a record keeps its provenance (source) column. Nothing here invents a score:
 * where the methodology or organization data is missing the block says DATA REQUIRED. */
(function (C) {
  var F = C.util.format;
  var TYPES = [
    { id: 'executive', en: 'Executive Risk Report', zh: '高階主管風險報告' },
    { id: 'cat6-risk', en: 'CAT.6 Risk Assessment Report', zh: 'CAT.6 風險評估報告' },
    { id: 'nist', en: 'NIST SP 800-30 Report', zh: 'NIST SP 800-30 風險評鑑報告' },
    { id: 'cisram', en: 'CIS RAM Risk Register', zh: 'CIS RAM 風險登錄表' },
    { id: 'fair', en: 'FAIR Quantitative Risk Report', zh: 'FAIR 量化風險報告' },
    { id: 'mapping', en: 'Framework Mapping Report', zh: '框架對應報告' },
    { id: 'iso-gap', en: 'ISO 27001 Gap Assessment Report', zh: 'ISO/IEC 27001 差異分析報告' },
    { id: 'iso-readiness', en: 'ISO 27001 Certification Readiness Report', zh: 'ISO/IEC 27001 驗證準備度報告' },
    { id: 'combined', en: 'Combined CAT.6 Cyber Risk Report', zh: 'CAT.6 綜合資安風險報告' }
  ];
  /* Section order is fixed; each report type picks which optional sections it carries. Core sections appear in every report. */
  var ORDER = ['cover', 'summary', 'scope', 'methodology', 'sources', 'assumptions', 'provenance', 'overview', 'matrix', 'register',
    'framework', 'fair', 'treatment', 'residual', 'iso', 'recommendations', 'references', 'disclaimer'];
  var TITLES = { verification: 'Report Verification 報告驗證', cover: 'Cover', summary: 'Executive Summary 執行摘要', scope: 'Assessment Scope 評估範圍', methodology: 'Methodology 方法論',
    sources: 'Data Sources 資料來源', assumptions: 'Assumptions 假設', provenance: 'Data Provenance 資料來源標示', overview: 'Risk Overview 風險概況',
    matrix: 'Risk Matrix 風險矩陣', register: 'Risk Register 風險登錄表', framework: 'Framework Analysis 框架分析', fair: 'FAIR Results 量化結果',
    treatment: 'Risk Treatment 風險處理', residual: 'Residual Risk 殘餘風險', iso: 'ISO/IEC 27001 Readiness 驗證準備度',
    recommendations: 'Recommendations 建議', references: 'References 參考文獻', disclaimer: 'Disclaimer, Methodology Boundary & Copyright 免責聲明與版權' };
  var FW_REF = { ISO27001: 'iso27001', CSF2: 'csf2', SP80030: 'sp80030', CISRAM: 'cisram', CISV81: 'cisv81', FAIR: 'fair' };
  var TYPE_FW = { executive: null, 'cat6-risk': null, combined: null, nist: ['SP80030'], cisram: ['CISRAM', 'CISV81'], fair: ['FAIR'],
    mapping: null, 'iso-gap': ['ISO27001'], 'iso-readiness': ['ISO27001'] };
  var DEFAULT_SENTENCE = 'This analysis contains CAT.6 default / assumed values.';
  var DR = 'DATA REQUIRED';
  var PR = function () { return C.data.defaults.parameters; };

  /* ---------- helpers ---------- */
  function typeInfo(id) { return TYPES.filter(function (t) { return t.id === id; })[0]; }
  function fwName(id) { var f = C.data.frameworks.filter(function (x) { return x.id === id; })[0]; return f ? f.name : id; }
  function money(v) { return v == null ? DR : F.currency(v); }
  function pct(v) { return v == null ? DR : F.pct(v); }
  function scoreOf(l, i) { return l >= 1 && l <= 5 && i >= 1 && i <= 5 ? C.calc.riskMatrix.assess(l, i) : null; }
  function isDefault(r) { return r && (r.source === 'CAT6_DEFAULT' || (r.fields || []).some(function (f) { return f.source === 'CAT6_DEFAULT'; })); }
  function p(text) { return { kind: 'p', text: text }; }
  function callout(text, tone) { return { kind: 'callout', text: text, tone: tone || 'info' }; }
  function table(caption, columns, rows, o) { return Object.assign({ kind: 'table', caption: caption, columns: columns, rows: rows }, o || {}); }
  function chart(svg, caption, summary) { return { kind: 'chart', svg: svg, caption: caption, summary: summary }; }
  function kv(rows) { return { kind: 'kv', rows: rows }; }
  function list(items) { return { kind: 'list', items: items }; }
  var SRC = { key: 'source', label: 'Provenance 來源', prov: true };
  function hasDR(blocks) { return blocks.some(function (b) { return JSON.stringify(b).indexOf(DR) >= 0; }); }
  /* Latest saved simulation for every risk scenario (one row per scenario). */
  function latestPerRisk(d) {
    var by = {};
    (d.fairRuns || []).forEach(function (r) { var k = r.riskId || '—'; if (!by[k] || (r.at || '') > (by[k].at || '')) by[k] = r; });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.summaries.AnnualRisk.Mean - a.summaries.AnnualRisk.Mean; });
  }
  function latestRun(d) { return (d.fairRuns || []).slice().sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); })[0] || null; }
  function lvlName(id) { return id ? (C.ui && C.ui.page ? C.ui.page.NIST_NAME[id] : id) : DR; }

  function riskRows(d) {
    var tr = d.treatments || [];
    return (d.risks || []).map(function (r) {
      var a = scoreOf(r.likelihood, r.impact), res = scoreOf(r.residualLikelihood, r.residualImpact);
      var plans = tr.filter(function (t) { return t.riskId === r.id; });
      return { id: r.id, scenario: r.scenario, asset: r.asset, threatSource: r.threatSource, threatEvent: r.threatEvent, vulnerability: r.vulnerability,
        existingControls: r.existingControls, likelihood: r.likelihood || DR, impact: r.impact || DR, score: a ? a.score : DR, level: a ? a.band.label : DR,
        band: a ? a.band.id : null, treatment: r.treatment || (plans[0] ? plans[0].strategy : '—'), owner: r.owner || '—', dueDate: r.dueDate || '—', status: r.status || '—',
        residual: res ? res.score + ' · ' + res.band.label : DR, residualScore: res ? res.score : null, frameworks: (r.frameworks || []).map(fwName).join(', '),
        cis: (r.cisControls || []).join(', '), source: r.source || 'USER_INPUT', _raw: r };
    });
  }
  function sevCounts(rows) {
    var c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
    rows.forEach(function (r) { c[r.band || 'NONE']++; });
    return c;
  }
  function tallyProvenance(d) {
    var cols = ['risks', 'treatments', 'nist', 'cisram', 'cisControls', 'cisSafeguards', 'csf', 'isoContext', 'isoClauses', 'isoSoa', 'audits', 'findings', 'capas', 'reviews', 'evidence', 'fairInputs', 'fairRuns'];
    return cols.filter(function (c) { return (d[c] || []).length; }).map(function (c) {
      var t = { dataset: c, USER_INPUT: 0, FILE_IMPORT: 0, CAT6_DEFAULT: 0, CALCULATED: 0 };
      d[c].forEach(function (r) { t[r.source || 'USER_INPUT'] = (t[r.source || 'USER_INPUT'] || 0) + 1; });
      t.total = d[c].length; return t;
    });
  }
  function defaultsUsed(d) {
    return Object.keys(d).some(function (k) { return Array.isArray(d[k]) && k !== 'activity' && k !== 'importLog' && k !== 'snapshots' && d[k].some(isDefault); }) || isDefault(d.assessment);
  }

  /* ---------- section builders ---------- */
  var B = {};
  /* Organization, assessment, report type, Report ID, version, classification and generation data are printed by the
   * renderer's Document Identity Block (from the frozen metadata); the cover section keeps the assessment context. */
  B.cover = function (ctx) {
    var a = ctx.a;
    return [kv([['Assessment Date 評估日期', a.date || DR], ['Assessor 評估者', a.assessor || DR], ['Scope 範圍', a.scope || DR], ['Data Source 資料來源', a.dataSource || DR]])]
      .concat(ctx.defaults ? [callout(DEFAULT_SENTENCE + ' 標示 CAT6_DEFAULT 的數值為示範 / 假設值，不代表組織實際狀況。', 'warn')] : []);
  };
  B.summary = function (ctx) {
    var rows = ctx.risks, c = sevCounts(rows), tr = C.calc.treatment.summary(ctx.d.treatments || [], ctx.today), out = [];
    out.push(p('本報告涵蓋 ' + rows.length + ' 個風險情境：Critical ' + c.CRITICAL + '、High ' + c.HIGH + '、Medium ' + c.MEDIUM + '、Low ' + c.LOW +
      (c.NONE ? '，另有 ' + c.NONE + ' 個情境尚缺 Likelihood / Impact（DATA REQUIRED）' : '') + '。風險等級依 CAT.6 5×5 平台準則判定（非 ISO 官方公式）。'));
    out.push(p('風險處理：進行中 ' + tr.OPEN + '、逾期 ' + tr.OVERDUE + '、已完成 ' + tr.COMPLETED + '。' +
      (rows.filter(function (r) { return (r.band === 'HIGH' || r.band === 'CRITICAL') && !(ctx.d.treatments || []).some(function (t) { return t.riskId === r.id; }) && r._raw.treatment !== 'Accept'; }).length
        ? '仍有 High / Critical 風險尚無處理計畫。' : '所有 High / Critical 風險皆已有處理計畫或接受決策。')));
    var run = ctx.fairRun, per = latestPerRisk(ctx.d);
    if (per.length > 1 && ctx.wants('fair')) out.push(p('FAIR 量化共 ' + per.length + ' 個情境（各取最新一次模擬）；年化預期損失最高為 ' + per[0].riskId + '：Mean ' + money(per[0].summaries.AnnualRisk.Mean) + '，P90 ' + money(per[0].summaries.AnnualRisk.P90) + '；各情境 ALE 合計 ' + money(per.reduce(function (t, r) { return t + r.summaries.AnnualRisk.Mean; }, 0)) + '（平均值可直接加總；P90 / P95 不可相加）。'));
    if (run && ctx.wants('fair')) out.push(p('FAIR 量化' + (per.length > 1 ? '詳細情境' : '') + '（' + run.riskId + '，' + F.num(run.iterations) + ' 次模擬，seed ' + run.seed + '）：年化預期損失 Mean ' + money(run.summaries.AnnualRisk.Mean) + '，P90 ' + money(run.summaries.AnnualRisk.P90) + '。'));
    if (ctx.wants('iso')) {
      var R = ctx.iso();
      out.push(p(C.calc.isoReadiness.label + '：' + (R.overall == null ? DR : F.pct(R.overall)) + '（依 ' + R.basedOn + ' / ' + R.of + ' 個有資料的領域等權平均；非 ISO 官方評分，不預測驗證結果）。'));
    }
    var t5 = top(rows, 5);
    if (t5.length) out.push(table('前五大風險（依分數）', [{ key: 'id', label: 'Risk ID' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'score', label: 'Score', num: true }, { key: 'level', label: 'Level' }, { key: 'treatment', label: 'Treatment' }, { key: 'owner', label: 'Owner' }, SRC], t5));
    if (ctx.defaults) out.push(callout(DEFAULT_SENTENCE, 'warn'));
    return out;
  };
  function top(rows, n) { return rows.filter(function (r) { return typeof r.score === 'number'; }).sort(function (a, b) { return b.score - a.score; }).slice(0, n); }
  B.scope = function (ctx) {
    var a = ctx.a, fw = (a.frameworks || []).map(fwName);
    var out = [kv([['Scope 範圍', a.scope || DR], ['Assessment Type 類型', a.type || DR], ['Frameworks 框架', fw.length ? fw.join('、') : DR],
      ['CIS Target IG', PR().value('targetIG', a) + (PR().resolve('targetIG', a).isDefault ? '（CAT6_DEFAULT）' : '')],
      ['CIS RAM Risk Acceptance Threshold', 'Risk ≤ ' + PR().value('cisRamAcceptableScore', a) + ' → Accept' + (PR().resolve('cisRamAcceptableScore', a).isDefault ? '（CAT6_DEFAULT）' : '')],
      ['CSF Implementation Tier', a.csfTierCurrent ? 'Tier ' + a.csfTierCurrent + (a.csfTierTarget ? ' → Tier ' + a.csfTierTarget : '') : '未填（選填）'], ['Currency 幣別', PR().value('currency', a)]])];
    var ctxRec = (ctx.d.isoContext || [])[0];
    if (ctxRec && ctx.wants('iso')) out.push(kv([['ISMS Scope Statement', ctxRec.scopeStatement || DR], ['Boundaries 邊界', ctxRec.boundaries || DR], ['Interfaces 介面', ctxRec.interfaces || DR], ['Exclusions 排除', ctxRec.exclusions || '—']]));
    return out;
  };
  B.methodology = function (ctx) {
    var rc = C.data.riskCriteria.cat6, out = [];
    out.push(p('CAT.6 5×5 半定量矩陣：' + rc.formula + '。' + rc.disclaimer));
    out.push(table('Risk Score → Risk Level 與建議處理原則', [{ key: 'range', label: 'Risk Score' }, { key: 'label', label: 'Risk Level' }, { key: 'nist', label: 'NIST 用語' }, { key: 'zh', label: '中文' }, { key: 'action', label: '建議處理原則', wrap: true }, { key: 'handling', label: '處理方式' }],
      rc.bands.map(function (b) { return { range: b.min + '–' + b.max, label: b.label, nist: b.nist, zh: b.zh, action: b.action, handling: b.handling }; })));
    out.push(table('Likelihood（L）與 Impact（I）五級文字描述', [{ key: 'lv', label: '等級' }, { key: 'l', label: 'Likelihood', wrap: true }, { key: 'i', label: 'Impact', wrap: true }],
      rc.likelihood.map(function (l, k) { var im = rc.impact[k]; return { lv: String(l.v), l: 'L' + l.v + ' ' + l.en + ' ' + l.zh + '：' + l.text, i: 'I' + im.v + ' ' + im.en + ' ' + im.zh + '：' + im.text }; })));
    var fws = ctx.fws;
    if (fws.indexOf('SP80030') >= 0) out.push(p('NIST SP 800-30 Rev.1：Likelihood of Initiation（G-2 對抗性 / G-3 非對抗性）與 Likelihood of Adverse Impact（G-4）以 Table G-5 查表取得 Overall Likelihood（不相乘）；風險判定將 Overall Likelihood 與 Impact 依 VL→1 … VH→5 換算，以 CAT.6 5×5 矩陣計分：Low 1–4、Moderate 5–9、High 10–16、Very High 17–25（平台自訂，非 NIST 官方分數；Table I-2 僅列為參考）。'));
    if (fws.indexOf('CISRAM') >= 0) out.push(p('CIS RAM：以 CAT.6 5×5 準則記錄處理前（Inherent）與處理後（Residual）風險；Risk Acceptance Threshold = ' + PR().value('cisRamAcceptableScore', ctx.a) + '：Residual ≤ 門檻 → Accept（符合接受準則），高於門檻 → Treatment Required。CAT.6 不代替 CIS RAM 官方計分公式。'));
    if (fws.indexOf('CISV81') >= 0) out.push(p('CIS Controls v8.1：於控制層級依 IG1 / IG2 / IG3 記錄實施狀態；Coverage = 已實施 ÷ 已評估（不含未評估與不適用）。Safeguard 層級資料需匯入 CAT6_CIS_Safeguards_Template。'));
    if (fws.indexOf('CSF2') >= 0) out.push(p('NIST CSF 2.0：22 個 Category 以 CSF 2.0 Readiness Index 評分（0 Not / 1 Partially / 2 Largely / 3 Fully Implemented）；Readiness % = Σ Current ÷ (3 × 已評分 Categories)，對應 Initial 0–20、Developing 21–40、Defined 41–60、Managed 61–80、Optimized 81–100（平台自訂 Index，非 NIST 官方分數）。Gap = max(0, Target − Current)，Target 未輸入時以 3 計。Implementation Tier 1–4 僅作治理描述。'));
    if (fws.indexOf('FAIR') >= 0) out.push(p('FAIR：TEF = CF × PoA；LEF = TEF × Susceptibility；LM = Primary + Secondary Loss；Annual Risk = LEF × LM。各輸入以三角分布 Triangular(min, mode, max) 進行蒙地卡羅模擬（可重現 seed）。'));
    if (fws.indexOf('ISO27001') >= 0) out.push(p('ISO/IEC 27001：條款 4–10 差異狀態與 Annex A（93 項）適用性聲明。' + C.calc.isoReadiness.disclaimer));
    return out;
  };
  B.sources = function (ctx) {
    var logs = (ctx.d.importLog || []).slice(-10).reverse();
    var out = [p('評估設定之資料來源：' + (ctx.a.dataSource || DR) + '。資料在 ' + (ctx.mode === 'supabase' ? 'Supabase（組織資料庫）' : '本機瀏覽器（LOCAL 模式）') + ' 保存。')];
    out.push(logs.length ? table('最近的匯入紀錄', [{ key: 'at', label: 'Time' }, { key: 'dataset', label: 'Dataset' }, { key: 'file', label: 'File', wrap: true }, { key: 'rows', label: 'Rows', num: true }, { key: 'errors', label: 'Errors', num: true }],
      logs.map(function (l) { return { at: (l.at || '').replace('T', ' ').slice(0, 16), dataset: l.dataset || l.ds || '—', file: l.file || '—', rows: l.imported != null ? l.imported : (l.rows != null ? l.rows : '—'), errors: l.errors != null ? (Array.isArray(l.errors) ? l.errors.length : l.errors) : '—' }; }))
      : p('尚無檔案匯入紀錄；資料來自手動輸入或 CAT.6 預設值。'));
    return out;
  };
  B.assumptions = function (ctx) {
    var items = [];
    if (ctx.defaults) items.push(DEFAULT_SENTENCE + ' 預設值版本 ' + C.data.defaults._meta.version + '：' + C.data.defaults._meta.reason);
    items.push('資料優先順序：組織輸入（USER_INPUT）與檔案匯入（FILE_IMPORT）優先；未輸入時以下表 CAT.6 預設值計算並標示 CAT6_DEFAULT。');
    var fi = (ctx.d.fairInputs || [])[0];
    if (fi && ctx.fws.indexOf('FAIR') >= 0) (fi.fields || []).filter(function (f) { return f.source === 'CAT6_DEFAULT'; }).forEach(function (f) {
      var dfl = C.data.fairDefaults.fields.filter(function (x) { return x.field === f.field; })[0];
      items.push('FAIR ' + f.field + '（CAT6_DEFAULT）：' + (dfl ? dfl.reason : '示範假設'));
    });
    return [list(items), table('預設值與採用依據', [{ key: 'label', label: '項目' }, { key: 'value', label: '本報告採用值', wrap: true }, { key: 'source', label: '來源', prov: true }, { key: 'basis', label: '採用依據', wrap: true }, { key: 'doc', label: '依據文件', wrap: true }],
      PR().list.map(function (q) { var r = q.assessmentKey ? PR().resolve(q.key, ctx.a) : { value: q.value, source: 'CAT6_DEFAULT' }; return { label: q.label, value: String(r.value) + (q.unit ? ' ' + q.unit : ''), source: r.source, basis: q.basis, doc: q.doc }; }), { wide: true })];
  };
  B.provenance = function (ctx) {
    var t = tallyProvenance(ctx.d);
    return [p('四種來源：USER_INPUT（組織輸入）、FILE_IMPORT（檔案匯入）、CAT6_DEFAULT（CAT.6 DEFAULT / ASSUMED VALUE）、CALCULATED（系統計算）。所有計算結果（分數、等級、覆蓋率、差距、模擬結果）皆為 CALCULATED。'),
      table('各資料集的來源統計', [{ key: 'dataset', label: 'Dataset' }, { key: 'USER_INPUT', label: 'USER_INPUT', num: true }, { key: 'FILE_IMPORT', label: 'FILE_IMPORT', num: true },
        { key: 'CAT6_DEFAULT', label: 'CAT6_DEFAULT', num: true }, { key: 'CALCULATED', label: 'CALCULATED', num: true }, { key: 'total', label: 'Total', num: true }], t)];
  };
  B.overview = function (ctx) {
    var c = sevCounts(ctx.risks), total = ctx.risks.length || 1;
    var rows = [['CRITICAL', 'Critical'], ['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low']].map(function (b) { return { label: b[1], value: c[b[0]], text: c[b[0]] + ' 件', color: C.charts.report.SEV[b[0]] }; });
    if (c.NONE) rows.push({ label: '未評估', value: null, text: c.NONE + ' 件' });
    return [chart(C.charts.report.hbars(rows, { max: total, label: '風險等級分布' }), 'Figure · 風險等級分布（CAT.6 5×5）',
      '共 ' + ctx.risks.length + ' 個情境：Critical ' + c.CRITICAL + '、High ' + c.HIGH + '、Medium ' + c.MEDIUM + '、Low ' + c.LOW + (c.NONE ? '、未評估 ' + c.NONE : '') + '。')];
  };
  B.matrix = function (ctx) {
    var raw = ctx.risks.map(function (r) { return r._raw; });
    var plotted = raw.filter(function (r) { return r.likelihood >= 1 && r.impact >= 1; });
    return [chart(C.charts.report.matrix(raw, 'CAT.6 5×5 risk matrix'), 'Figure · CAT.6 5×5 Risk Matrix（形狀 + 文字標示等級，不只依賴顏色）',
      '矩陣標示 ' + plotted.length + ' 個已評估情境；' + (raw.length - plotted.length ? (raw.length - plotted.length) + ' 個缺少 L / I 未標示（DATA REQUIRED）。' : '所有情境皆已標示。'))];
  };
  B.register = function (ctx) {
    var full = ctx.type !== 'executive';
    var cols = full ? [{ key: 'id', label: 'Risk ID' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'asset', label: 'Asset', wrap: true }, { key: 'threatSource', label: 'Threat Source', wrap: true },
      { key: 'threatEvent', label: 'Threat Event', wrap: true }, { key: 'vulnerability', label: 'Vulnerability', wrap: true }, { key: 'existingControls', label: 'Existing Controls', wrap: true },
      { key: 'likelihood', label: 'L', num: true }, { key: 'impact', label: 'I', num: true }, { key: 'score', label: 'Score', num: true }, { key: 'level', label: 'Level' },
      { key: 'treatment', label: 'Treatment' }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due' }, { key: 'status', label: 'Status' }, { key: 'residual', label: 'Residual' }, SRC]
      : [{ key: 'id', label: 'Risk ID' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'score', label: 'Score', num: true }, { key: 'level', label: 'Level' }, { key: 'treatment', label: 'Treatment' }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status' }, { key: 'residual', label: 'Residual' }, SRC];
    var rows = ctx.risks.slice().sort(function (a, b) { return (typeof b.score === 'number' ? b.score : -1) - (typeof a.score === 'number' ? a.score : -1); });
    return rows.length ? [table('Risk Register（' + rows.length + ' 筆，依分數排序）', cols, rows, { wide: full })] : [callout('尚無風險情境：' + DR + '（請於 Risk Register 新增或匯入）', 'warn')];
  };

  /* Framework analysis varies by report type. */
  B.framework = function (ctx) {
    var out = [], d = ctx.d, t = ctx.type;
    var show = function (k) { return t === 'combined' || t === 'cat6-risk' || t === 'executive' || t === k || (t === 'mapping' && k === 'mapping'); };
    if (show('nist')) out = out.concat(fwNist(ctx, t === 'nist'));
    if (show('cisram')) out = out.concat(fwCisRam(ctx, t === 'cisram'));
    if (t !== 'nist' && t !== 'fair' && t !== 'iso-gap' && t !== 'iso-readiness' && (show('cisram') || t === 'mapping' || t === 'combined' || t === 'cat6-risk' || t === 'executive')) out = out.concat(fwCis(ctx, t !== 'executive'));
    if (t === 'combined' || t === 'cat6-risk' || t === 'executive' || t === 'mapping') out = out.concat(fwCsf(ctx, t !== 'executive'));
    if (t === 'mapping' || t === 'combined' || t === 'cat6-risk') out = out.concat(fwMapping(ctx));
    if (t === 'iso-gap' || t === 'combined') out = out.concat(isoGap(ctx, t === 'iso-gap'));
    if (t === 'fair') out.push(p('本報告聚焦 FAIR 財務量化；對應框架：' + (ctx.fairRun ? '已量化情境 ' + latestPerRisk(d).map(function (r) { return r.riskId; }).join('、') + ' 皆列於 Risk Register 及其處理計畫。' : '尚無模擬紀錄。')));
    if (t === 'iso-readiness') out.push(p('ISO/IEC 27001 準備度依模組資料推導（條款差異、SoA、風險評鑑與處理、證據、內部稽核、矯正措施與管理審查），詳見 ISO Readiness 章節。'));
    return out.length ? out : [callout(DR, 'warn')];
  };
  function fwNist(ctx, full) {
    var rows = (ctx.d.nist || []).map(function (e) {
      var r = C.calc.nist.assess(e);
      return { id: e.id, riskId: e.riskId || '—', type: e.sourceType === 'ADV' ? 'Adversarial' : e.sourceType === 'NONADV' ? 'Non-adversarial' : DR,
        threatSource: e.threatSource, threatEvent: e.threatEvent, vulnerability: e.vulnerability, predisposing: e.predisposing || '—', controls: e.controls || '—',
        initiation: (r.table || (e.sourceType === 'ADV' ? 'G2' : 'G3')) + ' · ' + lvlName(e.initiation), adverse: 'G-4 · ' + lvlName(e.adverseImpact),
        overall: r.status === 'OK' ? 'G-5 · ' + lvlName(r.overall) : DR, impact: lvlName(e.impact), risk: r.status === 'OK' ? r.likelihood5 + '×' + r.impact5 + '=' + r.score + ' · ' + r.band.nist : DR + '（' + r.missing.join(', ') + '）', i2: r.status === 'OK' ? lvlName(r.riskI2) : '—', source: e.source };
    });
    if (!rows.length) return [callout('NIST SP 800-30：尚無評鑑紀錄（' + DR + '）', 'warn')];
    var cols = full ? [{ key: 'id', label: 'ID' }, { key: 'riskId', label: 'Risk' }, { key: 'type', label: 'Source Type' }, { key: 'threatSource', label: 'Threat Source', wrap: true }, { key: 'threatEvent', label: 'Threat Event', wrap: true },
      { key: 'vulnerability', label: 'Vulnerability', wrap: true }, { key: 'predisposing', label: 'Predisposing Condition', wrap: true }, { key: 'controls', label: 'Existing Controls', wrap: true },
      { key: 'initiation', label: 'Likelihood of Initiation' }, { key: 'adverse', label: 'Likelihood of Adverse Impact' }, { key: 'overall', label: 'Overall Likelihood' }, { key: 'impact', label: 'Impact' }, { key: 'risk', label: 'Risk (CAT.6 5×5)' }, { key: 'i2', label: 'I-2 參考' }, SRC]
      : [{ key: 'id', label: 'ID' }, { key: 'riskId', label: 'Risk' }, { key: 'threatEvent', label: 'Threat Event', wrap: true }, { key: 'overall', label: 'Overall Likelihood' }, { key: 'impact', label: 'Impact' }, { key: 'risk', label: 'Risk (CAT.6 5×5)' }, SRC];
    var out = [{ kind: 'h', text: 'NIST SP 800-30 Rev.1' }, table('NIST SP 800-30 評鑑（G-5 查表與 5×5 分數為 CALCULATED）', cols, rows, { wide: full })];
    if (full) {
      var g5 = C.data.nist.G5;
      out.push(table('Table G-5 Overall Likelihood（列：Likelihood of Initiation；欄：Likelihood of Adverse Impact）', [{ key: 'row', label: 'Initiation \\ Adverse' }].concat(g5.cols.map(function (c) { return { key: c, label: lvlName(c) }; })),
        g5.rows.map(function (r, i) { var o = { row: lvlName(r) }; g5.cols.forEach(function (c, j) { o[c] = lvlName(g5.matrix[i][j]); }); return o; })));
      var i2 = C.data.nist.I2;
      if (i2) out.push(table('Table I-2 Level of Risk（列：Overall Likelihood；欄：Impact）· NIST 參考，未用於計分', [{ key: 'row', label: 'Likelihood \\ Impact' }].concat(i2.cols.map(function (c) { return { key: c, label: lvlName(c) }; })),
        i2.rows.map(function (r, i) { var o = { row: lvlName(r) }; i2.cols.forEach(function (c, j) { o[c] = lvlName(i2.matrix[i][j]); }); return o; })));
    }
    return out;
  }
  function fwCisRam(ctx, full) {
    var TR = PR().resolve('cisRamAcceptableScore', ctx.a), thr = TR.value, rows = (ctx.d.cisram || []).map(function (r) {
      var a = C.calc.cisRam.assess(r, thr);
      return { id: r.id, riskId: r.riskId || '—', scenario: r.scenario, asset: r.asset, threat: r.threat, vulnerability: r.vulnerability, impactText: r.impact,
        safeguards: (r.safeguards || []).join(', ') || '—', inherent: a.inherent ? a.inherent.score + ' · ' + a.inherent.band.label : DR, assessment: r.safeguardAssessment || '—',
        residual: a.residual ? a.residual.score + ' · ' + a.residual.band.label : DR, acceptability: a.acceptability.id === 'ACCEPTABLE' ? 'Accept' : a.acceptability.id === 'NOT_ACCEPTABLE' ? 'Treatment Required' : DR + '（' + a.acceptability.why + '）',
        recommended: r.recommended || '—', _in: a.inherent ? a.inherent.score : null, _res: a.residual ? a.residual.score : null, source: r.source };
    });
    if (!rows.length) return [callout('CIS RAM：尚無工作表紀錄（' + DR + '）', 'warn')];
    var cols = full ? [{ key: 'id', label: 'ID' }, { key: 'riskId', label: 'Risk' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'asset', label: 'Asset', wrap: true }, { key: 'threat', label: 'Threat', wrap: true },
      { key: 'vulnerability', label: 'Vulnerability', wrap: true }, { key: 'impactText', label: 'Impact', wrap: true }, { key: 'safeguards', label: 'Existing Safeguards' }, { key: 'inherent', label: 'Inherent' },
      { key: 'assessment', label: 'Safeguard Assessment', wrap: true }, { key: 'residual', label: 'Residual' }, { key: 'acceptability', label: 'Acceptability', wrap: true }, { key: 'recommended', label: 'Recommended', wrap: true }, SRC]
      : [{ key: 'id', label: 'ID' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'inherent', label: 'Inherent' }, { key: 'residual', label: 'Residual' }, { key: 'acceptability', label: 'Acceptability', wrap: true }, SRC];
    var out = [{ kind: 'h', text: 'CIS RAM' }, p('Risk Acceptance Threshold：Residual ≤ ' + thr + ' → Accept；≥ ' + (+thr + 1) + ' → Treatment Required（' + (TR.isDefault ? 'CAT6_DEFAULT，依據：' + TR.doc : '組織設定') + '）。'), table('CIS RAM 工作表', cols, rows, { wide: full })];
    if (full) out.push(chart(C.charts.report.compare(rows.map(function (r) { return { label: r.id, before: r._in, after: r._res }; }), { label: 'Inherent → Residual' }),
      'Figure · Inherent（空心）→ Residual（實心），CAT.6 5×5 分數', rows.map(function (r) { return r.id + ' ' + (r._in != null ? r._in : '?') + ' → ' + (r._res != null ? r._res : '?'); }).join('；') + '。'));
    return out;
  }
  function fwCis(ctx, full) {
    var rows = ctx.d.cisControls || [], target = PR().value('targetIG', ctx.a), cov = C.calc.cisControls.coverageByIG(rows), out = [{ kind: 'h', text: 'CIS Controls v8.1' }];
    if (!rows.length) return out.concat([callout('CIS Controls：尚無控制評估（' + DR + '）', 'warn')]);
    out.push(chart(C.charts.report.hbars(C.calc.cisControls.IGS.map(function (k) { var c = cov[k]; return { label: k.toUpperCase() + '（已評估 ' + c.assessed + '）', value: c.coverage, text: c.coverage == null ? DR : F.pct(c.coverage) }; }), { max: 1, label: 'CIS IG coverage' }),
      'Figure · CIS Controls 控制層級覆蓋率（已實施 ÷ 已評估）', C.calc.cisControls.IGS.map(function (k) { return k.toUpperCase() + ' ' + (cov[k].coverage == null ? DR : F.pct(cov[k].coverage)); }).join('、') + '。'));
    var gaps = C.calc.cisControls.gaps(rows, target);
    if (full) {
      var title = {}; C.data.cis.controls.forEach(function (c) { title[c.id] = c.title + (c.zh ? '（' + c.zh + '）' : ''); });
      out.push(gaps.length ? table('Target ' + target + ' 缺口（' + gaps.length + ' 項控制）', [{ key: 'id', label: 'Control' }, { key: 'title', label: 'Title', wrap: true }, { key: 'missing', label: 'Missing IG' }, { key: 'status', label: 'Status' }],
        gaps.map(function (g) { var r = rows.filter(function (x) { return x.id === g.id; })[0] || {}; return { id: g.id, title: title[g.id], missing: g.missing.map(function (m) { return m.toUpperCase(); }).join(', '), status: g.missing.map(function (m) { return m.toUpperCase() + ' ' + (r[m] || 'NOT_ASSESSED'); }).join('；') }; }))
        : p('Target ' + target + ' 無缺口。'));
      var sg = ctx.d.cisSafeguards || [];
      out.push(sg.length ? p('Safeguard 層級：已匯入 ' + sg.length + ' 筆 Safeguard 紀錄。') : callout('Safeguard 層級覆蓋率：' + DR + '（需匯入 CIS Controls v8.1 Safeguard 清單 CAT6_CIS_Safeguards_Template）', 'warn'));
    } else out.push(p('Target ' + target + ' 共 ' + gaps.length + ' 項控制仍有缺口。'));
    return out;
  }
  function fwCsf(ctx, full) {
    var rows = ctx.d.csf || [], out = [{ kind: 'h', text: 'NIST CSF 2.0' }];
    if (!rows.length) return out.concat([callout('CSF：尚無 Profile 資料（' + DR + '）', 'warn')]);
    var fn = C.calc.csf.byFunction(rows), RD = C.calc.csf.readiness(rows);
    out.push(kv([['CSF 2.0 Readiness', RD.percent == null ? DR : RD.percent + '% · ' + RD.level.en + '（' + RD.level.text + '）'], ['Based on', RD.assessed + ' / 22 Categories'],
      ['Implementation Tier', ctx.a.csfTierCurrent ? 'Tier ' + ctx.a.csfTierCurrent + (ctx.a.csfTierTarget ? ' → Tier ' + ctx.a.csfTierTarget : '') : '未填（選填，治理描述）']]));
    out.push(table('CSF 2.0 Readiness by Function', [{ key: 'fn', label: 'Function' }, { key: 'pct', label: 'Readiness', num: true }, { key: 'lv', label: 'Level' }, { key: 'ct', label: 'Current → Target' }],
      fn.map(function (f) { return { fn: f.id + ' ' + f.name, pct: f.readiness.percent == null ? DR : f.readiness.percent + '%', lv: f.readiness.level ? f.readiness.level.en : DR, ct: f.current == null ? DR : f.current.toFixed(1) + ' → ' + f.target.toFixed(1) }; })));
    out.push(chart(C.charts.report.compare(fn.map(function (f) { return { label: f.id + ' ' + f.zh, before: f.current, after: f.target }; }), { max: 3, ticks: [0, 1, 2, 3], label: 'CSF current vs target' }),
      'Figure · CSF Function Current（空心）→ Target（實心），Readiness Index 0–3', fn.map(function (f) { return f.id + ' ' + (f.current == null ? DR : f.current.toFixed(1)) + ' → ' + (f.target == null ? DR : f.target.toFixed(1)); }).join('；') + '。'));
    if (full) {
      var name = {}; C.data.csf.categories.forEach(function (c) { name[c.id] = c.name; });
      out.push(table('CSF 2.0 Category Profile', [{ key: 'id', label: 'Category' }, { key: 'name', label: 'Name', wrap: true }, { key: 'current', label: 'Current', num: true }, { key: 'target', label: 'Target', num: true }, { key: 'gap', label: 'Gap', num: true }, { key: 'action', label: 'Improvement Action', wrap: true }, SRC],
        rows.map(function (r) { var g = C.calc.csf.gap(r); return { id: r.id, name: name[r.id] || '', current: C.calc.csf.valid(r.current) ? r.current : DR, target: C.calc.csf.target(r) == null ? DR : C.calc.csf.target(r) + (C.calc.csf.targetIsDefault(r) ? '（預設）' : ''), gap: g == null ? DR : g, action: r.action || (g ? DR : '—'), source: r.source }; })));
    }
    return out;
  }
  function fwMapping(ctx) {
    var M = C.data.mapping, out = [{ kind: 'h', text: 'Framework Mapping — CAT.6 Integrated Mapping' }, p('以下對應為 CAT.6 Integrated Mapping（CAT.6 自行建立之整合模型），非各框架官方對照表。')];
    out.push(table('CAT.6 Integrated Mapping：領域 → 框架', [{ key: 'domain', label: 'Domain' }, { key: 'zh', label: '中文' }, { key: 'fw', label: 'Frameworks', wrap: true }],
      M.domains.map(function (dm) { return { domain: dm.en, zh: dm.zh, fw: dm.fw.map(fwName).join('、') }; })));
    var tr = ctx.d.treatments || [];
    out.push(table('風險情境對應（框架 / 控制 / 處理對應）', [{ key: 'id', label: 'Risk' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'frameworks', label: 'Frameworks', wrap: true }, { key: 'cis', label: 'CIS Controls' },
      { key: 'iso', label: 'ISO Annex A' }, { key: 'csf', label: 'CSF' }, { key: 'nist', label: 'SP 800-30' }, { key: 'fair', label: 'FAIR' }, SRC],
      ctx.risks.map(function (r) {
        var ts = tr.filter(function (t) { return t.riskId === r.id; }), refs = function (k) { var s = []; ts.forEach(function (t) { ((t.refs || {})[k] || []).forEach(function (x) { if (s.indexOf(x) < 0) s.push(x); }); }); return s.join(', ') || '—'; };
        var cis = (r._raw.cisControls || []).slice(); ts.forEach(function (t) { ((t.refs || {}).cis || []).forEach(function (x) { if (cis.indexOf(x) < 0) cis.push(x); }); });
        return { id: r.id, scenario: r.scenario, frameworks: r.frameworks || '—', cis: cis.join(', ') || '—', iso: refs('iso'), csf: refs('csf'),
          nist: (ctx.d.nist || []).filter(function (n) { return n.riskId === r.id; }).map(function (n) { return n.id; }).join(', ') || '—',
          fair: (ctx.d.fairRuns || []).some(function (x) { return x.riskId === r.id; }) ? '已量化' : (r._raw.fair ? '已標記' : '—'), source: r.source };
      }), { wide: true }));
    return out;
  }
  function isoGap(ctx, full) {
    var d = ctx.d, st = {}; (d.isoClauses || []).forEach(function (c) { st[c.id] = c; });
    var out = [{ kind: 'h', text: 'ISO/IEC 27001 Gap Assessment' }];
    var count = { IMPLEMENTED: 0, PARTIAL: 0, NOT_IMPLEMENTED: 0, NOT_ASSESSED: 0 };
    C.data.iso.clauses.forEach(function (c) { var s = (st[c.id] || {}).status || 'NOT_ASSESSED'; count[s] = (count[s] || 0) + 1; });
    out.push(p('條款 4–10 共 ' + C.data.iso.clauses.length + ' 項：已實施 ' + count.IMPLEMENTED + '、部分實施 ' + count.PARTIAL + '、未實施 ' + count.NOT_IMPLEMENTED + '、未評估 ' + count.NOT_ASSESSED + '。'));
    out.push(table('Clause Gap Assessment', [{ key: 'id', label: 'Clause' }, { key: 'title', label: 'Title', wrap: true }, { key: 'status', label: 'Status' }, { key: 'gap', label: 'Gap Note', wrap: true }, { key: 'owner', label: 'Owner' }, { key: 'due', label: 'Due' }, SRC],
      C.data.iso.clauses.map(function (c) { var r = st[c.id] || {}; return { id: c.id, title: c.title + ' · ' + c.zh, status: r.status || 'NOT_ASSESSED', gap: r.gapNote || '—', owner: r.owner || '—', due: r.dueDate || '—', source: r.source || 'USER_INPUT' }; })));
    var soa = {}; (d.isoSoa || []).forEach(function (s) { soa[s.id] = s; });
    var rows = C.data.iso.annexA.map(function (a) { var s = soa[a.id] || {}; return { id: a.id, theme: a.themeName, title: a.title, applicable: s.applicable === true ? 'Yes' : s.applicable === false ? 'No' : '未決定', status: s.applicable === true ? (s.status || 'NOT_ASSESSED') : '—', justification: s.justification || (s.applicable === false ? DR : '—'), source: s.source || '—' }; });
    var decided = rows.filter(function (r) { return r.applicable !== '未決定'; }).length;
    out.push(p('Statement of Applicability：Annex A 93 項中已決定適用性 ' + decided + ' 項；未決定者列為「未決定」。排除之控制必須提供理由。'));
    out.push(table('Statement of Applicability' + (full ? '（Annex A 93 項）' : '（已決定項目）'), [{ key: 'id', label: 'Control' }, { key: 'theme', label: 'Theme' }, { key: 'title', label: 'Title', wrap: true }, { key: 'applicable', label: 'Applicable' }, { key: 'status', label: 'Status' }, { key: 'justification', label: 'Justification', wrap: true }, SRC],
      full ? rows : rows.filter(function (r) { return r.applicable !== '未決定'; })));
    return out;
  }

  B.fair = function (ctx) {
    var run = ctx.fairRun, fi = (ctx.d.fairInputs || [])[0];
    if (!run) {
      var out = [callout('尚未執行 FAIR 蒙地卡羅模擬：' + DR + '（請於 FAIR Analysis 執行並保存模擬）', 'warn')];
      if (fi) { var inp = {}; fi.fields.forEach(function (f) { inp[f.field] = f.value; }); var pe = C.calc.fair.pointEstimate(inp); out.push(p('點估計（Most Likely 值）：Annual Risk ≈ ' + money(pe.AnnualRisk) + '；點估計會低估尾端風險。')); }
      return out;
    }
    var s = run.summaries, cols = ['P10', 'P25', 'P50', 'Mean', 'P75', 'P90', 'P95'], MONEY = { PrimaryLoss: 1, SecondaryLoss: 1, LM: 1, AnnualRisk: 1 };
    /* 1) Multi-scenario summary: latest simulation of every scenario */
    var per = latestPerRisk(ctx.d), rname = {}; (ctx.d.risks || []).forEach(function (r) { rname[r.id] = r.scenario; });
    var o = [{ kind: 'h', text: '各情境比較（每個情境取最新一次模擬）' }];
    o.push(table('FAIR 情境彙總：年化風險（Annual Risk）', [{ key: 'riskId', label: 'Risk ID' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'run', label: 'Run' }, { key: 'at', label: 'Date' },
      { key: 'iters', label: 'Iterations', num: true }, { key: 'seed', label: 'Seed', num: true }, { key: 'mean', label: 'ALE Mean', num: true }, { key: 'p50', label: 'P50', num: true }, { key: 'p90', label: 'P90', num: true }, { key: 'p95', label: 'P95', num: true }, { key: 'inputs', label: 'Inputs', prov: true }],
      per.map(function (r) { var a = r.summaries.AnnualRisk; return { riskId: r.riskId || '—', scenario: rname[r.riskId] || '（不在目前的 Risk Register）', run: r.id + (r.id === run.id ? ' ◀ 詳細' : ''), at: (r.at || '').slice(0, 10),
        iters: F.num(r.iterations), seed: String(r.seed), mean: money(a.Mean), p50: money(a.P50), p90: money(a.P90), p95: money(a.P95), inputs: r.defaultsUsed ? 'CAT6_DEFAULT' : 'Organization' }; }), { wide: true }));
    if (per.length > 1) o.push(chart(C.charts.report.ranges(per.map(function (r) { var a = r.summaries.AnnualRisk; return { label: r.riskId, p50: a.P50, mean: a.Mean, p90: a.P90, p95: a.P95 }; }), { label: 'FAIR scenario comparison' }),
      'Figure · 各情境年化風險比較（P50–P95 區間、Mean、P90）', per.map(function (r) { return r.riskId + ' Mean ' + money(r.summaries.AnnualRisk.Mean) + ' / P90 ' + money(r.summaries.AnnualRisk.P90); }).join('；') + '。'));
    o.push(p('各情境為獨立模擬；合計值僅為平均值（ALE）的加總，百分位（P90 / P95）不能直接相加。'));
    if (per.some(function (r) { return r.defaultsUsed; })) o.push(callout(DEFAULT_SENTENCE + '（標示 CAT6_DEFAULT 的情境使用預設輸入）', 'warn'));
    /* 2) Detail of the selected (default: latest) simulation */
    o.push({ kind: 'h', text: '情境詳細：' + (run.riskId || '—') + (rname[run.riskId] ? ' · ' + rname[run.riskId] : '') });
    o.push(kv([['Risk Scenario', run.riskId || '—'], ['Run', run.id + ' · ' + (run.at || '').replace('T', ' ').slice(0, 16)], ['Iterations', F.num(run.iterations)], ['Random Seed', String(run.seed)], ['Engine', run.engine === 'worker' ? 'Web Worker' : 'Main thread'],
      ['Annual Risk Mean (ALE)', money(s.AnnualRisk.Mean)], ['Annual Risk P90', money(s.AnnualRisk.P90)], ['Annual Risk P95', money(s.AnnualRisk.P95)]]));
    if (run.defaultsUsed) o.push(callout(DEFAULT_SENTENCE + '（FAIR 輸入含 CAT6_DEFAULT）', 'warn'));
    o.push(table('FAIR 輸入（三點估計）', [{ key: 'field', label: 'Input' }, { key: 'min', label: 'Min', num: true }, { key: 'ml', label: 'Most Likely', num: true }, { key: 'max', label: 'Max', num: true }, { key: 'unit', label: 'Unit' }, SRC],
      (run.inputs || []).map(function (f) { return { field: f.field, min: f.value.min, ml: f.value.mostLikely, max: f.value.max, unit: f.unit || '', source: f.source }; })));
    o.push(table('模擬結果百分位（CALCULATED）', [{ key: 'k', label: 'Output' }].concat(cols.map(function (c) { return { key: c, label: c, num: true }; })),
      C.calc.fair.OUTPUT_KEYS.map(function (k) { var r = { k: k }; cols.forEach(function (c) { r[c] = MONEY[k] ? F.currency(s[k][c]) : (+s[k][c]).toFixed(3); }); return r; })));
    if (run.histogram) o.push(chart(C.charts.report.histogram(run.histogram, s.AnnualRisk), 'Figure · Annual Risk 分布（顯示至 P99.5）', '中位數 ' + money(s.AnnualRisk.P50) + '，平均 ' + money(s.AnnualRisk.Mean) + '，P95 ' + money(s.AnnualRisk.P95) + '。'));
    if (run.exceedance) o.push(chart(C.charts.report.exceedance(run.exceedance), 'Figure · Loss Exceedance Curve', '年度損失超過 ' + money(s.AnnualRisk.P90) + ' 的機率約 10%。'));
    return o;
  };
  B.treatment = function (ctx) {
    var list0 = ctx.d.treatments || [], sum = C.calc.treatment.summary(list0, ctx.today), risk = {};
    ctx.risks.forEach(function (r) { risk[r.id] = r; });
    var rows = list0.map(function (t) {
      var r = risk[t.riskId] || {}, refs = t.refs || {};
      return { id: t.id, riskId: t.riskId, scenario: r.scenario || '—', current: r.score != null ? r.score + (r.level && r.level !== DR ? ' · ' + r.level : '') : DR, strategy: t.strategy, control: t.control, framework: fwName(t.framework),
        mapping: ['iso', 'csf', 'cis', 'cisram'].filter(function (k) { return (refs[k] || []).length; }).map(function (k) { return k.toUpperCase() + ': ' + refs[k].join(', '); }).join('；') || '—',
        owner: t.owner || '—', priority: t.priority || '—', dueDate: t.dueDate || '—', status: t.status + (C.calc.treatment.classify(t, ctx.today) === 'OVERDUE' ? '（逾期）' : ''), residual: r.residual || DR, source: t.source };
    });
    var untreated = ctx.risks.filter(function (r) { return !list0.some(function (t) { return t.riskId === r.id; }) && r._raw.treatment !== 'Accept'; });
    var out = [p('處理計畫 ' + list0.length + ' 項：進行中 ' + sum.OPEN + '、逾期 ' + sum.OVERDUE + '、已完成 ' + sum.COMPLETED + '、取消 ' + sum.CANCELLED + '。')];
    out.push(rows.length ? table('Risk Treatment Plan', [{ key: 'id', label: 'ID' }, { key: 'riskId', label: 'Risk' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'current', label: 'Current Risk' }, { key: 'strategy', label: 'Strategy' },
      { key: 'control', label: 'Selected Control', wrap: true }, { key: 'framework', label: 'Framework' }, { key: 'mapping', label: 'Mapping', wrap: true }, { key: 'owner', label: 'Owner' }, { key: 'priority', label: 'Priority' },
      { key: 'dueDate', label: 'Due' }, { key: 'status', label: 'Status' }, { key: 'residual', label: 'Residual' }, SRC], rows, { wide: true }) : callout('尚無處理計畫', 'warn'));
    if (untreated.length) out.push(p('尚無處理計畫的風險：' + untreated.map(function (r) { return r.id + '（' + r.level + '）'; }).join('、') + '。'));
    return out;
  };
  B.residual = function (ctx) {
    var rows = ctx.risks.map(function (r) { return { label: r.id, before: typeof r.score === 'number' ? r.score : null, after: r.residualScore }; });
    if (!rows.length) return [callout(DR, 'warn')];
    var have = rows.filter(function (r) { return r.after != null; }).length;
    return [chart(C.charts.report.compare(rows, { label: 'Current vs residual risk' }), 'Figure · Current（空心）→ Residual（實心），CAT.6 5×5 分數',
      have + ' / ' + rows.length + ' 個情境已記錄殘餘風險' + (have < rows.length ? '；其餘標示 DATA REQUIRED。' : '。')),
      table('Residual Risk', [{ key: 'id', label: 'Risk' }, { key: 'scenario', label: 'Scenario', wrap: true }, { key: 'current', label: 'Current' }, { key: 'residual', label: 'Residual' }, { key: 'reduction', label: 'Reduction', num: true }, SRC],
        ctx.risks.map(function (r) { return { id: r.id, scenario: r.scenario, current: typeof r.score === 'number' ? r.score + ' · ' + r.level : DR, residual: r.residual, reduction: typeof r.score === 'number' && r.residualScore != null ? r.score - r.residualScore : DR, source: r.source }; }))];
  };
  B.iso = function (ctx) {
    var R = ctx.iso(), E = C.calc.isoReadiness, d = ctx.d, out = [];
    out.push(callout(E.disclaimer + ' CAT.6 不是驗證機構（Certification Body），不核發證書。', 'info'));
    out.push(kv([[E.label, R.overall == null ? DR : F.pct(R.overall)], ['Based on', R.basedOn + ' / ' + R.of + ' areas with data']]));
    var keys = Object.keys(R.areas);
    out.push(chart(C.charts.report.hbars(keys.map(function (k) { var a = R.areas[k]; return { label: E.LABELS[k], value: a.value, text: a.value == null ? DR : F.pct(a.value) }; }), { max: 1, label: 'Readiness areas' }),
      'Figure · ' + E.label + ' 各領域完成比例', keys.map(function (k) { return E.LABELS[k] + ' ' + (R.areas[k].value == null ? DR : F.pct(R.areas[k].value)); }).join('、') + '。'));
    out.push(table('Readiness Areas', [{ key: 'area', label: 'Area' }, { key: 'value', label: 'Completion', num: true }, { key: 'detail', label: 'Basis', wrap: true }],
      keys.map(function (k) { var a = R.areas[k]; return { area: E.LABELS[k], value: a.value == null ? DR : F.pct(a.value) + '（' + a.done + ' / ' + a.total + '）', detail: a.detail }; })));
    var tasks = {}; (d.isoTasks || []).forEach(function (t) { tasks[t.id] = t.status; });
    var ad = { ctx: (d.isoContext || [])[0] || {}, risks: d.risks || [], treatments: d.treatments || [], audits: d.audits || [] };
    var TS = { NOT_STARTED: '未開始', IN_PROGRESS: '進行中', DONE: '完成' };
    out.push(table('Certification Readiness Roadmap（四階段）', [{ key: 'stage', label: 'Stage' }, { key: 'item', label: 'Item', wrap: true }, { key: 'status', label: 'Status' }, { key: 'kind', label: 'Basis' }],
      [].concat.apply([], C.data.iso.roadmap.map(function (s) { return s.items.map(function (it) {
        var v = it.auto ? E.autoValue(it.auto, R, ad) : null;
        return { stage: 'Stage ' + s.id + ' · ' + s.en, item: it.en + ' · ' + it.zh, status: it.auto ? (v == null ? DR : v >= 1 ? '完成' : v > 0 ? F.pct(v) : '未開始') : (TS[tasks[it.id]] || '未開始'), kind: it.auto ? 'CALCULATED（模組資料）' : '手動狀態' };
      }); }))));
    if (ctx.type === 'iso-readiness' || ctx.type === 'combined') {
      out.push(table('Internal Audits', [{ key: 'id', label: 'ID' }, { key: 'area', label: 'Area', wrap: true }, { key: 'clause', label: 'Clause' }, { key: 'planned', label: 'Planned' }, { key: 'auditor', label: 'Auditor' }, { key: 'status', label: 'Status' }, SRC], d.audits || []));
      out.push(table('Findings', [{ key: 'id', label: 'ID' }, { key: 'auditId', label: 'Audit' }, { key: 'clause', label: 'Clause' }, { key: 'type', label: 'Type' }, { key: 'description', label: 'Description', wrap: true }, { key: 'status', label: 'Status' }, { key: 'dueDate', label: 'Due' }, SRC], d.findings || []));
      out.push(table('Corrective Actions', [{ key: 'id', label: 'ID' }, { key: 'findingId', label: 'Finding' }, { key: 'rootCause', label: 'Root Cause', wrap: true }, { key: 'action', label: 'Action', wrap: true }, { key: 'owner', label: 'Owner' }, { key: 'dueDate', label: 'Due' }, { key: 'status', label: 'Status' }, SRC], d.capas || []));
      out.push(table('Management Reviews', [{ key: 'id', label: 'ID' }, { key: 'date', label: 'Date' }, { key: 'chair', label: 'Chair' }, { key: 'inputs', label: '9.3.2 Inputs' }, { key: 'decisions', label: 'Decisions', wrap: true }, { key: 'status', label: 'Status' }, SRC],
        (d.reviews || []).map(function (r) { return Object.assign({}, r, { inputs: (r.inputs || []).join(', ') }); })));
      var ev = d.evidence || [];
      out.push(table('Evidence（' + ev.length + ' 筆）', [{ key: 'id', label: 'ID' }, { key: 'requirement', label: 'Requirement / Control' }, { key: 'name', label: 'Evidence', wrap: true }, { key: 'owner', label: 'Owner' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'relatedRisk', label: 'Risk' }, SRC], ev));
    }
    return out;
  };
  B.recommendations = function (ctx) {
    var items = [], d = ctx.d;
    var hc = ctx.risks.filter(function (r) { return (r.band === 'HIGH' || r.band === 'CRITICAL') && !(d.treatments || []).some(function (t) { return t.riskId === r.id; }) && r._raw.treatment !== 'Accept'; });
    if (hc.length) items.push('為尚無處理計畫的 High / Critical 風險建立處理計畫：' + hc.map(function (r) { return r.id; }).join('、') + '。');
    var od = (d.treatments || []).filter(function (t) { return C.calc.treatment.classify(t, ctx.today) === 'OVERDUE'; });
    if (od.length) items.push('追蹤逾期處理計畫並重新排定期限：' + od.map(function (t) { return t.id + '（' + t.dueDate + '）'; }).join('、') + '。');
    var nr = ctx.risks.filter(function (r) { return r.residualScore == null; });
    if (nr.length) items.push('記錄殘餘風險（Residual L / I）：' + nr.map(function (r) { return r.id; }).join('、') + '。');
    if (ctx.wants('framework')) {
      var gaps = C.calc.cisControls.gaps(d.cisControls || [], ctx.a.targetIG || 'IG1');
      if (gaps.length && ctx.fws.indexOf('CISV81') >= 0) items.push('CIS Controls ' + (ctx.a.targetIG || 'IG1') + ' 缺口 ' + gaps.length + ' 項，優先處理：' + gaps.slice(0, 6).map(function (g) { return g.id; }).join('、') + (gaps.length > 6 ? ' 等' : '') + '。');
      var big = (d.csf || []).filter(function (r) { var g = C.calc.csf.gap(r); return g != null && g >= 2; });
      if (big.length && ctx.fws.indexOf('CSF2') >= 0) items.push('CSF 差距 ≥ 2 的 Category：' + big.map(function (r) { return r.id; }).join('、') + '，請確認改善行動與負責人。');
      var noAct = (d.csf || []).filter(function (r) { return C.calc.csf.gap(r) > 0 && !r.action; });
      if (noAct.length && ctx.fws.indexOf('CSF2') >= 0) items.push('以下 CSF Category 有差距但未填改善行動：' + noAct.map(function (r) { return r.id; }).join('、') + '。');
    }
    if (PR().resolve('cisRamAcceptableScore', ctx.a).isDefault && ctx.fws.indexOf('CISRAM') >= 0) items.push('CIS RAM 目前使用 CAT.6 預設門檻 9；請由管理階層確認是否符合組織的風險接受準則。');
    if (ctx.wants('iso')) {
      var R = ctx.iso(), low = Object.keys(R.areas).filter(function (k) { return R.areas[k].value != null && R.areas[k].value < 0.5; });
      if (low.length) items.push('ISO 準備度完成比例低於 50% 的領域：' + low.map(function (k) { return C.calc.isoReadiness.LABELS[k]; }).join('、') + '。');
      var nd = C.data.iso.annexA.length - R.soaDecided;
      if (nd > 0) items.push('SoA 尚有 ' + nd + ' 項 Annex A 控制未決定適用性。');
      var openNc = (d.findings || []).filter(function (f) { return f.type !== 'OFI' && f.status !== 'Closed'; });
      if (openNc.length) items.push('完成不符合事項之矯正措施：' + openNc.map(function (f) { return f.id; }).join('、') + '。');
    }
    if (ctx.wants('fair') && !latestRun(d)) items.push('執行 FAIR 蒙地卡羅模擬以取得 P90 / P95 財務風險。');
    if (ctx.defaults) items.push('以組織實際資料取代 CAT.6 預設值（CAT6_DEFAULT），再重新產生報告。');
    if (!items.length) items.push('目前資料未觸發任何規則式建議；請持續依 PDCA 週期更新評估。');
    return [p('以下建議由資料規則產生（非外部基準或官方要求）：'), list(items)];
  };
  B.references = function (ctx) {
    var ids = ctx.fws.map(function (f) { return FW_REF[f]; });
    return [list(C.data.references.filter(function (r) { return ids.indexOf(r.id) >= 0; }).map(function (r) { return r.title + ' — ' + r.url; }).concat(['CAT.6 Risk_Criteria.pdf（5×5 平台準則、NIST G-2 / G-3 / G-4 / G-5）']))];
  };
  B.disclaimer = function (ctx) {
    var year = new Date(ctx.generatedAt).getFullYear() || new Date().getFullYear(), a = ctx.a;
    return [
      { kind: 'h', text: 'Disclaimer 免責聲明' },
      list([
        '本報告結果依據組織輸入資料（USER_INPUT）、檔案匯入資料（FILE_IMPORT）、CAT.6 預設 / 假設值（CAT6_DEFAULT）與報告產生時間點之資料計算（CALCULATED）而得。',
        '凡使用 CAT.6 DEFAULT / ASSUMED VALUE 之處，均已於封面、假設章節、資料來源表與各表格的來源欄明確揭露' + (ctx.defaults ? '；本報告含有此類數值。' : '；本報告未使用預設值。'),
        '評估結果僅反映報告所載 Scope（' + (a.scope || DR) + '）與 Assessment Date（' + (a.date || DR) + '）當時之狀態。',
        '本報告不代表 ISO/IEC、NIST、CIS、The Open Group（FAIR）或任何標準組織之官方認證、驗證或背書。',
        'ISO/IEC 27001 Readiness（CAT.6 Readiness Indicator）不等同正式 ISO/IEC 27001 Certification Audit；CAT.6 不是驗證機構，不核發證書，亦不預測驗證結果。',
        'FAIR 蒙地卡羅模擬為風險量化分析，呈現損失的機率分布，不應表述為確定會發生的財務損失。',
        'Framework Mapping 為 CAT.6 Integrated Mapping（CAT.6 自行建立之整合模型），非各框架官方對照表。',
        '本報告不得超出原始 Assessment Scope 解讀或引用。'
      ]),
      { kind: 'h', text: 'Methodology Boundary 方法論邊界' },
      p('CAT.6 5×5 半定量矩陣、CSF 2.0 Readiness Index（0–3）、CIS RAM 門檻預設值與 CAT.6 Readiness Indicator 為平台自訂方法；NIST SP 800-30 之 G-5 為查表、風險分數為平台 5×5 計分。各方法之依據與預設值見「方法論」與「假設」章節。'),
      { kind: 'h', text: 'Data Validity 資料有效性' },
      p('資料之正確性與完整性由提供資料之組織負責。報告定稿後內容即凍結（以 SHA-256 保護）；其後任何資料異動不會改變本報告，須建立新版本（Report Version）。'),
      { kind: 'h', text: 'Copyright 版權' },
      p('© ' + year + ' CAT.6 Cybersecurity. All rights reserved.')
    ].concat(ctx.defaults ? [callout(DEFAULT_SENTENCE + ' 標示 CAT6_DEFAULT 的值不代表組織實際狀況。', 'warn')] : []);
  };

  /* Which sections a report type carries (core sections are always present). */
  var OPTIONAL = {
    fair: { executive: 'ifData', 'cat6-risk': 'ifData', fair: 1, combined: 1 },
    iso: { executive: 'ifIso', 'iso-gap': 'ifIso', 'iso-readiness': 1, combined: 1 }
  };

  function build(type, d, o) {
    o = o || {};
    var info = typeInfo(type);
    if (!info) throw new Error('Unknown report type: ' + type);
    var a = d.assessment || {}, isoCache = null;
    var fws = TYPE_FW[type] || (a.frameworks && a.frameworks.length ? a.frameworks.slice() : C.data.frameworks.map(function (f) { return f.id; }));
    if (type === 'cat6-risk' || type === 'executive') fws = fws.filter(function (f) { return f !== 'ISO27001' || type === 'executive'; });
    var ctx = { type: type, info: info, d: d, a: a, fws: fws, mode: o.mode || 'local', today: o.today, generatedAt: o.generatedAt || new Date().toISOString(),
      risks: riskRows(d), defaults: defaultsUsed(d),
      fairRun: (o.fairRunId && (d.fairRuns || []).filter(function (r) { return r.id === o.fairRunId; })[0]) || latestRun(d),
      iso: function () { return isoCache || (isoCache = C.calc.isoReadiness.compute({ context: (d.isoContext || [])[0], clauses: d.isoClauses, soa: d.isoSoa, risks: d.risks, treatments: d.treatments, evidence: d.evidence, audits: d.audits, findings: d.findings, capas: d.capas, reviews: d.reviews })); } };
    ctx.wants = function (sec) {
      var rule = OPTIONAL[sec] ? OPTIONAL[sec][type] : 1;
      if (!rule) return false;
      if (rule === 'ifData') return !!latestRun(d) || (a.frameworks || []).indexOf('FAIR') >= 0;
      if (rule === 'ifIso') return (a.frameworks || []).indexOf('ISO27001') >= 0 || type === 'iso-gap';
      return true;
    };
    if (ctx.wants('fair') && fws.indexOf('FAIR') < 0) fws.push('FAIR');
    if (ctx.wants('iso') && fws.indexOf('ISO27001') < 0) fws.push('ISO27001');
    var sections = ORDER.map(function (id) {
      var applicable = OPTIONAL[id] ? ctx.wants(id) : true;
      if (!applicable) return { id: id, title: TITLES[id], status: 'NOT_APPLICABLE', blocks: [] };
      var blocks = B[id](ctx);
      return { id: id, title: TITLES[id], status: hasDR(blocks) ? 'PARTIAL' : 'READY', blocks: blocks };
    });
    return { type: type, title: info.en, subtitle: info.zh, generatedAt: ctx.generatedAt, assessment: a, defaultsUsed: ctx.defaults,
      defaultSentence: DEFAULT_SENTENCE, sections: sections, frameworks: fws, fairRunId: ctx.fairRun ? ctx.fairRun.id : null, hasFair: ctx.wants('fair') };
  }

  /* Every table block → exporter tables (CSV / XLSX). Keeps provenance columns and the defaults sentence. */
  function toTables(report) {
    var out = [], notes = ['CAT.6 Cybersecurity · ' + report.title + ' · ' + (report.assessment.organization || '') + ' · ' + report.generatedAt.slice(0, 10)];
    if (report.defaultsUsed) notes.push(DEFAULT_SENTENCE);
    out.push({ name: 'Summary', sheet: 'Summary', notes: notes, rows: report.sections.map(function (s) { return { section: s.title, status: s.status, text: s.blocks.filter(function (b) { return b.kind === 'p'; }).map(function (b) { return b.text; }).join(' ') }; }),
      columns: [{ key: 'section', label: 'Section' }, { key: 'status', label: 'Status' }, { key: 'text', label: 'Text' }] });
    report.sections.forEach(function (s) {
      s.blocks.forEach(function (b) {
        if (b.kind === 'table') out.push({ name: b.caption, sheet: sheetName(b.caption, out), notes: notes, rows: b.rows, columns: b.columns.map(function (c) { return { key: c.key, label: c.label }; }) });
        if (b.kind === 'kv') out.push({ name: s.title, sheet: sheetName(s.title, out), notes: notes, rows: b.rows.map(function (r) { return { k: r[0], v: r[1] }; }), columns: [{ key: 'k', label: 'Field' }, { key: 'v', label: 'Value' }] });
      });
    });
    return out;
  }
  function sheetName(t, existing) {
    var base = String(t).replace(/[\\\/\?\*\[\]:]/g, ' ').replace(/[（(].*$/, '').trim().slice(0, 28) || 'Sheet', n = base, i = 2;
    while (existing.some(function (x) { return x.sheet === n; })) n = base.slice(0, 26) + ' ' + (i++);
    return n;
  }

  C.services.reportBuilder = { latestPerRisk: latestPerRisk, TYPES: TYPES, ORDER: ORDER, TITLES: TITLES, build: build, toTables: toTables, DEFAULT_SENTENCE: DEFAULT_SENTENCE,
    COLLECTIONS: ['risks', 'treatments', 'nist', 'cisram', 'cisControls', 'cisSafeguards', 'csf', 'isoContext', 'isoClauses', 'isoSoa', 'isoTasks', 'audits', 'findings', 'capas', 'reviews', 'evidence', 'fairInputs', 'fairRuns', 'importLog'] };
})(globalThis.CAT6);
