/* Node test runner: `node tests/run-tests.js`
 * Validates engines against the supplied CAT.6 examples. */
const fs = require('fs'), path = require('path'), vm = require('vm');
globalThis.window = globalThis;
const load = f => vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), { filename: f });
['js/core/namespace.js','js/core/format.js','js/core/provenance.js','data/risk-criteria.js','data/nist-likelihood.js',
 'data/defaults/fair-defaults.js','data/demo/demo-register.js','js/calculations/rng.js','js/calculations/distributions.js',
 'js/calculations/stats.js','js/calculations/fairMonteCarloEngine.js','js/calculations/riskMatrixEngine.js',
 'js/calculations/nistRiskEngine.js','js/services/csvImportService.js','js/services/fairAnalysisService.js'].forEach(load);
const C = globalThis.CAT6;
let pass = 0, fail = 0;
const t = (name, cond, info) => { cond ? pass++ : fail++; console.log((cond ? '✔' : '✘') + ' ' + name + (info ? '  ' + info : '')); };

// 5×5 CAT.6 criteria
t('5×5: 2×2=4 → LOW', C.calc.riskMatrix.assess(2,2).band.id === 'LOW');
t('5×5: 1×5=5 → MEDIUM', C.calc.riskMatrix.assess(1,5).band.id === 'MEDIUM');
t('5×5: 3×3=9 → MEDIUM', C.calc.riskMatrix.assess(3,3).band.id === 'MEDIUM');
t('5×5: 2×5=10 → HIGH', C.calc.riskMatrix.assess(2,5).band.id === 'HIGH');
t('5×5: 4×4=16 → HIGH', C.calc.riskMatrix.assess(4,4).band.id === 'HIGH');
t('5×5: 3×6 rejected', (() => { try { C.calc.riskMatrix.assess(3,6); return false; } catch (e) { return true; } })());
t('5×5: 4×5=20 → CRITICAL', C.calc.riskMatrix.assess(4,5).band.id === 'CRITICAL');

// NIST G-5 lookup (from Risk_Criteria.pdf)
const G = C.calc.nist.overallLikelihood;
t('G-5 VH×VL = L', G('VH','VL') === 'L');
t('G-5 VH×H = VH', G('VH','H') === 'VH');
t('G-5 H×M = M', G('H','M') === 'M');
t('G-5 M×VH = H', G('M','VH') === 'H');
t('G-5 L×VL = VL', G('L','VL') === 'VL');
t('G-5 VL×VH = L', G('VL','VH') === 'L');
t('G-3 value 50 → Moderate', C.calc.nist.levelFromSemiQuant('G3', 50).id === 'M');

// FAIR
const inputs = {}; C.data.fairDefaults.fields.forEach(f => inputs[f.field] = f.value);
const pe = C.calc.fair.pointEstimate(inputs);
t('FAIR point: TEF = 4×0.6 = 2.4', Math.abs(pe.TEF - 2.4) < 1e-9);
t('FAIR point: LEF = 2.4×0.75 = 1.8', Math.abs(pe.LEF - 1.8) < 1e-9);
t('FAIR point: Annual Risk = LEF × LM (not +)', Math.abs(pe.AnnualRisk - 1.8 * 4130000) < 1e-3);
t('FAIR validation catches min>ML', C.calc.fair.validate(Object.assign({}, inputs, { CF: { min: 5, mostLikely: 4, max: 6 } })).length > 0);
t('FAIR validation catches PoA > 100%', C.calc.fair.validate(Object.assign({}, inputs, { PoA: { min: .5, mostLikely: .9, max: 1.2 } })).length > 0);

// CSV import
const csv = C.services.csvImport.fairTemplate();
const imp = C.services.csvImport.importFair(csv);
t('CSV template round-trips with 0 errors', imp.errors.length === 0 && Object.keys(imp.values).length === 5);
const bad = C.services.csvImport.importFair('field,min,most_likely,max\nCF,6,4,2\nPoA,50%,abc,80%\n');
t('CSV reports row-level errors', bad.errors.length >= 2 && bad.errors.some(e => e.row === 2) && bad.errors.some(e => e.row === 3));

(async () => {
  const res = await C.services.fair.run(inputs, { iterations: 1000000, seed: 20260926 });
  const ref = C.data.fairDefaults.referenceResult;
  const p50 = res.summaries.AnnualRisk.P50, lef = res.summaries.LEF.P50;
  t('MC Annual Risk P50 within 1% of notes (NT$10.15M)', Math.abs(p50 - ref.AnnualRisk_P50) / ref.AnnualRisk_P50 < 0.01, 'P50=' + Math.round(p50));
  t('MC LEF P50 ≈ 1.79', Math.abs(lef - ref.LEF_P50) < 0.01, 'LEF P50=' + lef.toFixed(4));
  const r2 = await C.services.fair.run(inputs, { iterations: 10000, seed: 42 });
  const r3 = await C.services.fair.run(inputs, { iterations: 10000, seed: 42 });
  t('Seed is reproducible', r2.summaries.AnnualRisk.P50 === r3.summaries.AnnualRisk.P50);
  console.log('\n' + pass + ' passed, ' + fail + ' failed  (1M run: ' + res.durationMs + ' ms)');
  process.exit(fail ? 1 : 0);
})();
