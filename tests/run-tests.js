/* Node test runner: `node tests/run-tests.js` (Node 18+).
 * Engines, workspace (in-memory repository), import validation, XLSX round-trip, report builder/renderer,
 * and Web Worker ⇄ main-thread determinism for the FAIR Monte Carlo engine. Browser/UI flows are covered by
 * tests/e2e.py (Playwright). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
globalThis.window = globalThis;
const load = f => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
/* Same script order as the app pages (tools/gen_pages.py CORE) minus pure-DOM UI modules. */
[
  'js/core/namespace.js', 'js/config.js', 'js/core/format.js', 'js/core/provenance.js', 'js/core/dom.js', 'js/core/repository.js',
  'data/risk-criteria.js', 'data/frameworks.js', 'data/references.js', 'data/nist-likelihood.js',
  'data/catalog/iso27001.js', 'data/catalog/csf2.js', 'data/catalog/cis-controls.js', 'data/catalog/nist-impact-risk.js', 'data/catalog/framework-library.js', 'data/catalog/framework-mapping.js',
  'data/defaults/meta.js', 'data/defaults/workspace-defaults.js', 'data/defaults/risk-defaults.js', 'data/defaults/nist-defaults.js', 'data/defaults/cis-ram-defaults.js',
  'data/defaults/cis-controls-defaults.js', 'data/defaults/nist-csf-defaults.js', 'data/defaults/iso-readiness-defaults.js', 'data/defaults/fair-defaults.js', 'data/defaults/parameters.js',
  'js/calculations/rng.js', 'js/calculations/distributions.js', 'js/calculations/stats.js', 'js/calculations/riskMatrixEngine.js', 'js/calculations/nistRiskEngine.js', 'js/calculations/cisRamEngine.js',
  'js/calculations/cisControlsEngine.js', 'js/calculations/csfEngine.js', 'js/calculations/treatmentEngine.js', 'js/calculations/isoReadinessEngine.js', 'js/calculations/fairMonteCarloEngine.js',
  'js/services/workspace.js', 'js/services/xlsx.js', 'js/services/exportService.js', 'js/services/csvImportService.js', 'js/services/importCenter.js',
  'js/services/fairAnalysisService.js', 'js/charts/svg.js', 'js/charts/reportCharts.js', 'js/services/reportBuilder.js', 'js/services/reportRenderer.js'
].forEach(load);
const C = globalThis.CAT6;
let pass = 0, fail = 0;
const t = (name, cond, info) => { cond ? pass++ : fail++; console.log((cond ? '✔' : '✘') + ' ' + name + (info ? '  ' + info : '')); };
const throws = fn => { try { fn(); return false; } catch (e) { return true; } };
const ab = b => (b instanceof Uint8Array ? b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) : b);

// ---- CAT.6 5×5 criteria
t('5×5: 2×2=4 → LOW', C.calc.riskMatrix.assess(2, 2).band.id === 'LOW');
t('5×5: 1×5=5 → MEDIUM', C.calc.riskMatrix.assess(1, 5).band.id === 'MEDIUM');
t('5×5: 3×3=9 → MEDIUM', C.calc.riskMatrix.assess(3, 3).band.id === 'MEDIUM');
t('5×5: 2×5=10 → HIGH', C.calc.riskMatrix.assess(2, 5).band.id === 'HIGH');
t('5×5: 4×4=16 → HIGH', C.calc.riskMatrix.assess(4, 4).band.id === 'HIGH');
t('5×5: 3×6 rejected', throws(() => C.calc.riskMatrix.assess(3, 6)));
t('5×5: 4×5=20 → CRITICAL', C.calc.riskMatrix.assess(4, 5).band.id === 'CRITICAL');
t('5×5 labels: Moderate / Very High (NIST) + handling', C.calc.riskMatrix.assess(3, 3).band.label === 'Moderate' && C.calc.riskMatrix.assess(5, 5).band.nist === 'Very High' && C.calc.riskMatrix.assess(4, 3).band.handling === 'Treatment Required');
t('L / I descriptors: 5 levels each', C.data.riskCriteria.cat6.likelihood.length === 5 && C.data.riskCriteria.cat6.impact[4].en === 'Severe / Catastrophic');

// ---- NIST SP 800-30: G-5 and I-2 are lookups (never L × I)
const G = C.calc.nist.overallLikelihood;
t('G-5 VH×VL = L', G('VH', 'VL') === 'L');
t('G-5 VH×H = VH', G('VH', 'H') === 'VH');
t('G-5 H×M = M', G('H', 'M') === 'M');
t('G-5 M×VH = H', G('M', 'VH') === 'H');
t('G-5 L×VL = VL', G('L', 'VL') === 'VL');
t('G-5 VL×VH = L', G('VL', 'VH') === 'L');
t('G-5 rejects non-level input', throws(() => G('X', 'H')));
t('G-3 value 50 → Moderate', C.calc.nist.levelFromSemiQuant('G3', 50).id === 'M');
const I2 = C.data.nist.I2;
t('I-2 loaded as 5×5 lookup', I2 && I2.matrix.length === 5 && I2.matrix.every(r => r.length === 5));
t('I-2 every cell is a level', I2.matrix.every(r => r.every(v => C.calc.nist.LEVELS.includes(v))));
t('I-2 monotone in impact', I2.matrix.every(r => r.every((v, j) => !j || C.calc.nist.LEVELS.indexOf(v) >= C.calc.nist.LEVELS.indexOf(r[j - 1]))));
t('I-2 lookup = table cell', C.calc.nist.riskLevel('H', 'VH') === I2.matrix[I2.rows.indexOf('H')][I2.cols.indexOf('VH')]);
const na = C.calc.nist.assess({ sourceType: 'ADV', initiation: 'H', adverseImpact: 'H', impact: 'H' });
t('NIST chain: ADV uses G-2, overall from G-5', na.status === 'OK' && na.table === 'G2' && na.overall === G('H', 'H'));
t('NIST risk = 5×5 on G-5 overall × impact (H,H → M overall=3 × 4 = 12 High)', na.likelihood5 === C.calc.nist.LEVELS.indexOf(na.overall) + 1 && na.impact5 === 4 && na.score === na.likelihood5 * 4 && na.band.id === C.calc.riskMatrix.classify(na.score).id);
t('NIST VH×VH → 25 Very High', (() => { const r = C.calc.nist.assess({ sourceType: 'NONADV', initiation: 'VH', adverseImpact: 'VH', impact: 'VH' }); return r.score === 25 && r.levelName === 'Very High'; })());
t('NIST chain: missing input → DATA_REQUIRED', C.calc.nist.assess({ sourceType: 'ADV', initiation: 'H' }).status === 'DATA_REQUIRED');

// ---- CIS RAM: no invented threshold
const cr = { inherentLikelihood: 4, inherentImpact: 5, residualLikelihood: 2, residualImpact: 4 };
t('CIS RAM inherent 20 / residual 8', C.calc.cisRam.assess(cr, 9).inherent.score === 20 && C.calc.cisRam.assess(cr, 9).residual.score === 8);
t('CIS RAM threshold null → DATA_REQUIRED', C.calc.cisRam.assess(cr, null).acceptability.id === 'DATA_REQUIRED');
t('CIS RAM residual ≤ threshold → ACCEPTABLE', C.calc.cisRam.assess(cr, 8).acceptability.id === 'ACCEPTABLE');
t('CIS RAM residual > threshold → NOT_ACCEPTABLE', C.calc.cisRam.assess(cr, 6).acceptability.id === 'NOT_ACCEPTABLE');
const PRm = C.data.defaults.parameters;
t('CIS RAM default threshold = 9 (CAT6_DEFAULT with basis)', PRm.value('cisRamAcceptableScore', { cisRamAcceptableScore: null }) === 9 && PRm.resolve('cisRamAcceptableScore', {}).source === 'CAT6_DEFAULT' && /CIS_RAM/.test(PRm.resolve('cisRamAcceptableScore', {}).doc));
t('CIS RAM organization threshold overrides default', PRm.resolve('cisRamAcceptableScore', { cisRamAcceptableScore: 6, source: 'USER_INPUT' }).value === 6 && PRm.resolve('cisRamAcceptableScore', { cisRamAcceptableScore: 6, source: 'USER_INPUT' }).source === 'USER_INPUT');
t('CIS RAM 9 → Accept, 10 → Treatment Required', C.calc.cisRam.assess({ residualLikelihood: 3, residualImpact: 3 }, 9).acceptability.id === 'ACCEPTABLE' && C.calc.cisRam.assess({ residualLikelihood: 2, residualImpact: 5 }, 9).acceptability.id === 'NOT_ACCEPTABLE');
t('Every default parameter documents its basis', PRm.list.every(p => p.basis && p.doc));
t('CIS catalog has Chinese names for 18 controls', C.data.cis.controls.length === 18 && C.data.cis.controls.every(c => c.zh));
t('CIS RAM missing residual → DATA_REQUIRED', C.calc.cisRam.assess({ inherentLikelihood: 3, inherentImpact: 3 }, 8).acceptability.id === 'DATA_REQUIRED');

// ---- CIS Controls coverage
const cc = [{ id: 'CIS-01', ig1: 'IMPLEMENTED', ig2: 'PARTIAL', ig3: 'NOT_ASSESSED' }, { id: 'CIS-02', ig1: 'NOT_IMPLEMENTED', ig2: 'NOT_APPLICABLE', ig3: 'NOT_ASSESSED' }];
const cov = C.calc.cisControls.coverageByIG(cc);
t('CIS IG1 coverage = 1/2', cov.ig1.coverage === 0.5);
t('CIS IG3 not assessed → coverage null (not 0)', cov.ig3.coverage === null);
t('CIS gap to IG2 lists CIS-01 (ig2) and CIS-02 (ig1)', (() => { const g = C.calc.cisControls.gaps(cc, 'IG2'); return g.length === 2 && g[0].missing.join() === 'ig2' && g[1].missing.join() === 'ig1'; })());

// ---- CSF
t('CSF gap = target − current', C.calc.csf.gap({ current: 1, target: 3 }) === 2);
t('CSF gap never negative', C.calc.csf.gap({ current: 3, target: 2 }) === 0);
t('CSF 0–3 scale: 4 is invalid', C.calc.csf.gap({ current: 4, target: 3 }) === null && !C.calc.csf.valid(4));
t('CSF target missing → CAT.6 default 3', C.calc.csf.gap({ current: 1 }) === 2 && C.calc.csf.targetIsDefault({ current: 1 }));
t('CSF no current → gap null (not 0)', C.calc.csf.gap({ target: 3 }) === null);
const rd = C.calc.csf.readiness([{ current: 3 }, { current: 3 }, { current: 0 }, {}]);
t('CSF Readiness % = ΣCurrent ÷ (3 × assessed) = 67% → Managed', rd.percent === 67 && rd.level.id === 'MANAGED' && rd.assessed === 3);
t('CSF Readiness bands 20→Initial, 21→Developing, 81→Optimized', C.calc.csf.level(20).id === 'INITIAL' && C.calc.csf.level(21).id === 'DEVELOPING' && C.calc.csf.level(81).id === 'OPTIMIZED' && C.calc.csf.level(100).id === 'OPTIMIZED');
t('CSF Readiness without data → DATA_REQUIRED', C.calc.csf.readiness([{}]).status === 'DATA_REQUIRED');
t('CSF byFunction covers 6 functions', C.calc.csf.byFunction(C.data.defaults.csf).length === 6);

// ---- Treatment
t('Treatment overdue', C.calc.treatment.classify({ status: 'Planned', dueDate: '2026-01-01' }, '2026-09-27') === 'OVERDUE');
t('Treatment completed', C.calc.treatment.classify({ status: 'Completed', dueDate: '2026-01-01' }, '2026-09-27') === 'COMPLETED');
t('Treatment summary', JSON.stringify(C.calc.treatment.summary([{ status: 'Planned', dueDate: '2030-01-01' }, { status: 'Cancelled' }], '2026-09-27')) === JSON.stringify({ OPEN: 1, OVERDUE: 0, COMPLETED: 0, CANCELLED: 1 }));

// ---- ISO readiness indicator (not an ISO score)
const R0 = C.calc.isoReadiness.compute({});
t('ISO readiness: areas without data → DATA_REQUIRED and excluded', R0.areas.evidence.status === 'DATA_REQUIRED' && R0.areas.audit.value === null && R0.basedOn === 2);
const R1 = C.calc.isoReadiness.compute({ evidence: [{ status: 'Accepted' }, { status: 'Draft' }], audits: [{ status: 'Completed' }] });
const have = Object.keys(R1.areas).filter(k => R1.areas[k].value != null);
t('ISO readiness: unweighted mean of areas with data', Math.abs(R1.overall - have.reduce((s, k) => s + R1.areas[k].value, 0) / have.length) < 1e-9 && R1.areas.evidence.value === 0.5 && R1.areas.audit.value === 1);
t('ISO readiness label is CAT.6 Readiness Indicator', C.calc.isoReadiness.label === 'CAT.6 Readiness Indicator');
t('ISO roadmap autoValue scope', C.calc.isoReadiness.autoValue('scope', R0, { ctx: { scopeStatement: 'x' } }) === 0.5);

// ---- FAIR
const inputs = {}; C.data.fairDefaults.fields.forEach(f => inputs[f.field] = f.value);
const pe = C.calc.fair.pointEstimate(inputs);
t('FAIR point: TEF = 4×0.6 = 2.4', Math.abs(pe.TEF - 2.4) < 1e-9);
t('FAIR point: LEF = 2.4×0.75 = 1.8', Math.abs(pe.LEF - 1.8) < 1e-9);
t('FAIR point: Annual Risk = LEF × LM (not +)', Math.abs(pe.AnnualRisk - 1.8 * 4130000) < 1e-3);
t('FAIR validation catches min>ML', C.calc.fair.validate(Object.assign({}, inputs, { CF: { min: 5, mostLikely: 4, max: 6 } })).length > 0);
t('FAIR validation catches PoA > 100%', C.calc.fair.validate(Object.assign({}, inputs, { PoA: { min: .5, mostLikely: .9, max: 1.2 } })).length > 0);

// ---- FAIR CSV
const csv = C.services.csvImport.fairTemplate();
const imp = C.services.csvImport.importFair(csv);
t('FAIR CSV template round-trips with 0 errors', imp.errors.length === 0 && Object.keys(imp.values).length === 5);
const bad = C.services.csvImport.importFair('field,min,most_likely,max\nCF,6,4,2\nPoA,50%,abc,80%\n');
t('FAIR CSV reports row-level errors', bad.errors.length >= 2 && bad.errors.some(e => e.row === 2) && bad.errors.some(e => e.row === 3));

// ---- Import Center validation (CSV rows)
const IC = C.services.importCenter, DSr = IC.DATASETS.risks;
const parsed = IC.dataRows(C.services.csvImport.parseCSV('# comment\nRisk ID,Scenario,Asset,Likelihood,Impact\nRS-X1,Test,Server,3,4\nRS-X2,,Laptop,9,2\nRS-X1,Dup,Server,1,1\n'));
const map = IC.autoMap(DSr, parsed.header);
const vr = IC.validate(DSr, parsed, map, { risks: [] });
t('Import: header auto-mapped', map.scenario === 1 && map.asset === 2);
t('Import: 1 valid row', vr.valid.length === 1 && vr.valid[0].record.likelihood === 3);
t('Import: invalid rows are reported, not ignored', vr.invalidRows === 2 && vr.errors.length >= 3, vr.invalidRows + ' rows / ' + vr.errors.length + ' errors');
t('Import: error has Row/Column/Value/Error/Expected/Suggestion', vr.errors.every(e => ['row', 'column', 'value', 'error', 'expected', 'suggestion'].every(k => e[k] != null && e[k] !== '')));
t('Import: keeps original spreadsheet row numbers', vr.errors.some(e => e.row === 4) && vr.errors.some(e => e.row === 5));
const miss = IC.validate(DSr, IC.dataRows([['Risk ID', 'Asset'], ['RS-1', 'A']]), IC.autoMap(DSr, ['Risk ID', 'Asset']), {});
t('Import: missing required column blocks import', miss.valid.length === 0 && miss.errors.length > 0);

(async () => {
  // ---- XLSX round-trip (own writer + reader)
  const sheets = [{ name: '風險 Risks', rows: [['Risk ID', 'Scenario', 'L'], ['RS-1', '資料外洩 "quoted" & <tag>', 4], ['RS-2', '', 2.5]] }, { name: 'Second', rows: [['a'], ['b']] }];
  const back = await C.services.xlsx.read(ab(C.services.xlsx.write(sheets)));
  t('XLSX round-trip: 2 sheets', back.length === 2 && back[0].name === '風險 Risks');
  t('XLSX round-trip: CJK + escaping', back[0].rows[1][1] === '資料外洩 "quoted" & <tag>');
  t('XLSX round-trip: numbers', +back[0].rows[1][2] === 4 && +back[0].rows[2][2] === 2.5);
  const tback = await C.services.xlsx.read(ab(C.services.xlsx.write(IC.templateSheets('CAT6_Risk_Assessment_Template'))));
  const tsheet = tback.find(s => IC.dataRows(s.rows).header.includes('Scenario')) || tback[0];
  const tp = IC.dataRows(tsheet.rows), tm = IC.autoMap(DSr, tp.header);
  t('XLSX template → every column auto-maps', DSr.columns.every(c => tm[c.key] != null));
  const sample = { id: 'RS-T1', scenario: 'XLSX 測試情境', asset: '伺服器', likelihood: 3, impact: 4 };
  tsheet.rows.push(tp.header.map((h, i) => { const c = DSr.columns.find(k => tm[k.key] === i); return c && sample[c.key] != null ? sample[c.key] : ''; }));
  const filled = await C.services.xlsx.read(ab(C.services.xlsx.write([tsheet])));
  const fp = IC.dataRows(filled[0].rows), fv = IC.validate(DSr, fp, IC.autoMap(DSr, fp.header), { risks: [] });
  t('XLSX filled template → validate', fv.valid.length === 1 && fv.valid[0].record.scenario === 'XLSX 測試情境', fv.valid.length + ' valid, ' + fv.errors.map(e => e.column + ':' + e.error).join('; '));

  // ---- Workspace (in-memory repository) seeds demo with provenance
  const W = C.services.workspace;
  await W.init();
  t('Workspace mode (node) = memory', W.mode === 'memory');
  const d = await W.load(C.services.reportBuilder.COLLECTIONS);
  t('Demo data seeded and marked CAT6_DEFAULT', d.risks.length >= 6 && d.risks.every(r => r.source === 'CAT6_DEFAULT'));
  t('usesDefaults detects demo', W.usesDefaults({ risks: d.risks }) === true);
  await W.save('risks', Object.assign({}, d.risks[0], { owner: 'X' }));
  const d2 = await W.load(['risks']);
  await W.createAssessment({ organization: 'Test Org', name: 'Empty' });
  const filledCols = await W.fillDefaults();
  const fd = await W.load(['risks', 'csf', 'fairInputs']);
  t('fillDefaults fills empty datasets of a new assessment with CAT6_DEFAULT', filledCols.includes('risks') && fd.risks.length > 0 && fd.risks.every(r => r.source === 'CAT6_DEFAULT' && r.assessmentId === W.assessment.id));
  t('fillDefaults leaves datasets that already have data', (await W.fillDefaults()).length === 0);
  await W.switchAssessment('AS-DEMO'); W.assessment = (await W.repo.list('assessments')).find(a => a.id === 'AS-DEMO');
  t('Editing a default record → USER_INPUT', d2.risks.find(r => r.id === d.risks[0].id).source === 'USER_INPUT');

  // ---- Reports: every type builds, renders, exports; defaults sentence is carried
  const RB = C.services.reportBuilder, RR = C.services.reportRenderer;
  const data = Object.assign({ assessment: W.assessment }, await W.load(RB.COLLECTIONS));
  const required = ['cover', 'summary', 'scope', 'methodology', 'sources', 'assumptions', 'provenance', 'overview', 'matrix', 'register', 'framework', 'treatment', 'residual', 'recommendations', 'references', 'disclaimer'];
  RB.TYPES.forEach(ty => {
    const rep = RB.build(ty.id, data, { today: '2026-09-27' });
    const html = RR.render(rep);
    const present = rep.sections.filter(s => s.status !== 'NOT_APPLICABLE').map(s => s.id);
    t('Report ' + ty.id + ': core sections present', required.every(id => present.includes(id)));
    t('Report ' + ty.id + ': no undefined/NaN/[object', !/undefined|NaN|\[object/.test(html), (html.match(/.{40}(undefined|NaN|\[object).{20}/) || [''])[0]);
    t('Report ' + ty.id + ': defaults sentence', html.includes(RB.DEFAULT_SENTENCE));
    const tabs = RB.toTables(rep);
    t('Report ' + ty.id + ': CSV/XLSX tables', tabs.length > 2 && C.services.exporter.csv(tabs[1]).length > 10 && C.services.xlsx.write(tabs.map(x => ({ name: x.sheet, rows: C.services.exporter.matrix(x) }))).byteLength > 1000);
  });
  const comb = RB.build('combined', data, {});
  t('Combined report includes FAIR + ISO sections', comb.sections.find(s => s.id === 'fair').status !== 'NOT_APPLICABLE' && comb.sections.find(s => s.id === 'iso').status !== 'NOT_APPLICABLE');
  t('NIST report shows G-5 table', RR.render(RB.build('nist', data, {})).includes('Table G-5'));
  t('CIS RAM report uses threshold 9 + Treatment Required', (() => { const h = RR.render(RB.build('cisram', data, {})); return h.includes('Residual ≤ 9') && h.includes('Treatment Required'); })());
t('Reports list defaults with basis', RR.render(RB.build('combined', data, {})).includes('預設值與採用依據'));
  t('ISO readiness report disclaims certification', RR.render(RB.build('iso-readiness', data, {})).includes('不是驗證機構'));
  t('@page CSS: A4 + page counter', /size: A4/.test(RR.pageCss(comb)) && /counter\(pages\)/.test(RR.pageCss(comb)));

  // ---- FAIR Monte Carlo: reference result + seed reproducibility
  const res = await C.services.fair.run(inputs, { iterations: 1000000, seed: 20260926 });
  const ref = C.data.fairDefaults.referenceResult;
  t('MC Annual Risk P50 within 1% of notes (NT$10.15M)', Math.abs(res.summaries.AnnualRisk.P50 - ref.AnnualRisk_P50) / ref.AnnualRisk_P50 < 0.01, 'P50=' + Math.round(res.summaries.AnnualRisk.P50));
  t('MC LEF P50 ≈ 1.79', Math.abs(res.summaries.LEF.P50 - ref.LEF_P50) < 0.01, 'LEF P50=' + res.summaries.LEF.P50.toFixed(4));
  const r2 = await C.services.fair.run(inputs, { iterations: 10000, seed: 42 });
  const r3 = await C.services.fair.run(inputs, { iterations: 10000, seed: 42 });
  t('Seed is reproducible', r2.summaries.AnnualRisk.P50 === r3.summaries.AnnualRisk.P50);

  // ---- FAIR report: multi-scenario summary + selectable detail run
  {
    const RB = C.services.reportBuilder, RR = C.services.reportRenderer;
    const base = { iterations: 10000, seed: 42, summaries: r2.summaries, histogram: r2.histogram, exceedance: r2.exceedance, inputs: [], defaultsUsed: false, engine: 'main' };
    const big = JSON.parse(JSON.stringify(r2.summaries)); Object.keys(big.AnnualRisk).forEach(k => big.AnnualRisk[k] *= 2);
    const runs = [Object.assign({}, base, { id: 'RUN-A1', riskId: 'RS-A', at: '2026-09-01T00:00:00Z' }), Object.assign({}, base, { id: 'RUN-B1', riskId: 'RS-B', at: '2026-09-02T00:00:00Z', summaries: big }),
      Object.assign({}, base, { id: 'RUN-A2', riskId: 'RS-A', at: '2026-09-03T00:00:00Z' })];
    const dd = Object.assign({ assessment: W.assessment }, await W.load(RB.COLLECTIONS), { fairRuns: runs });
    const per = RB.latestPerRisk(dd);
    t('FAIR summary: one row per scenario, latest run each, sorted by ALE', per.length === 2 && per[0].id === 'RUN-B1' && per[1].id === 'RUN-A2');
    const rep = RB.build('fair', dd, {}), h = RR.render(rep);
    t('FAIR report lists every scenario with Mean/P50/P90/P95 + comparison chart', h.includes('FAIR 情境彙總') && h.includes('RUN-B1') && h.includes('RUN-A2') && !h.includes('RUN-A1') && h.includes('各情境年化風險比較') && h.includes('P95'));
    t('FAIR detail defaults to newest run', rep.fairRunId === 'RUN-A2' && h.includes('情境詳細：RS-A'));
    const rep2 = RB.build('fair', dd, { fairRunId: 'RUN-B1' });
    t('FAIR detail follows the selected run', rep2.fairRunId === 'RUN-B1' && RR.render(rep2).includes('情境詳細：RS-B'));
    t('FAIR selected run unknown → falls back to newest', RB.build('fair', dd, { fairRunId: 'NOPE' }).fairRunId === 'RUN-A2');
    t('FAIR summary exported to CSV/XLSX tables', RB.toTables(rep).some(x => /FAIR 情境彙總/.test(x.name) && x.rows.length === 2));
  }

  // ---- Worker ⇄ main thread determinism: execute js/workers/fair.worker.js in a worker-like sandbox
  const workerResult = await new Promise((resolve, reject) => {
    const sandbox = { console };
    sandbox.self = sandbox;
    sandbox.importScripts = (...files) => files.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/workers', f), 'utf8'), sandbox, { filename: f }));
    sandbox.postMessage = m => { if (m.type === 'done') resolve(m.result); if (m.type === 'error') reject(new Error(m.message)); };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/workers/fair.worker.js'), 'utf8'), sandbox, { filename: 'fair.worker.js' });
    sandbox.onmessage({ data: { type: 'run', inputs, iterations: 10000, seed: 42 } });
  });
  t('Worker engine = main-thread engine (same seed → identical percentiles)', C.calc.fair.OUTPUT_KEYS.every(k => ['P10', 'P50', 'P90', 'P95', 'Mean'].every(p => workerResult.summaries[k][p] === r2.summaries[k][p])));
  t('Worker reports engine=worker', workerResult.engine === 'worker');

  console.log('\n' + pass + ' passed, ' + fail + ' failed  (1M run: ' + res.durationMs + ' ms)');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
