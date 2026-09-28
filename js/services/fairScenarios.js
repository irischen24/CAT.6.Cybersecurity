/* FAIR multi-scenario model (1…N scenarios per assessment — no fixed count).
 *
 * Scenario  = one `fairInputs` record:
 *   { id = scenarioId, scenarioId, scenarioName, riskId, currency, iterations, seed,
 *     fields: [{ field: CF|PoA|Susceptibility|PrimaryLoss|SecondaryLoss, value: {min, mostLikely, max}, source }],
 *     dataSource, assumptionStatus, source }
 * Result    = one `fairRuns` record per simulation (each scenario is simulated independently, its own seed & worker):
 *   { id, scenarioId, scenarioName, riskId, currency, at, iterations, seed, engine,
 *     summaries (all FAIR outputs), results: { mean, median, p10, p50, p90, p95, max } (Annual Risk),
 *     histogram / distributionData, exceedance / exceedanceCurveData, inputs (snapshot with provenance),
 *     dataSource, assumptionStatus, defaultsUsed }
 * Legacy data (single-scenario era): the record id 'fair' becomes scenario 'fair'; runs without scenarioId are matched
 * to the scenario of the same risk, otherwise grouped as LEGACY-<riskId>. Nothing stored is rewritten. */
(function (C) {
  function fieldsSource(fields) {
    var s = (fields || []).map(function (f) { return f.source; });
    return s.indexOf('CAT6_DEFAULT') >= 0 ? (s.every(function (x) { return x === 'CAT6_DEFAULT'; }) ? 'CAT6_DEFAULT' : 'MIXED') : s.indexOf('FILE_IMPORT') >= 0 ? 'FILE_IMPORT' : 'USER_INPUT';
  }
  function assumptionStatus(fields) {
    var n = (fields || []).filter(function (f) { return f.source === 'CAT6_DEFAULT'; }).length;
    return n === 0 ? 'ORGANIZATION_DATA' : n === (fields || []).length ? 'CAT6_ASSUMPTION' : 'PARTIAL_ASSUMPTION';
  }
  var ASSUMPTION_LABEL = { ORGANIZATION_DATA: 'Organization data（USER INPUT / FILE IMPORT）', CAT6_ASSUMPTION: 'CAT.6 ASSUMPTION / SIMULATED VALUE', PARTIAL_ASSUMPTION: 'Partially CAT.6 ASSUMPTION / SIMULATED VALUE' };

  function scenario(rec) {
    return Object.assign({}, rec, { scenarioId: rec.scenarioId || rec.id, currency: rec.currency || 'TWD',
      dataSource: rec.dataSource || fieldsSource(rec.fields), assumptionStatus: assumptionStatus(rec.fields) });
  }
  function scenarioOf(run, scenarios) {
    if (run.scenarioId && !run.legacyScenario) return run.scenarioId;
    var s = (scenarios || []).filter(function (x) { return x.riskId === run.riskId; })[0];
    return s ? (s.scenarioId || s.id) : 'LEGACY-' + (run.riskId || 'UNASSIGNED');
  }
  function results(summaries) {
    var a = summaries && summaries.AnnualRisk; if (!a) return null;
    return { mean: a.Mean, median: a.P50, p10: a.P10, p50: a.P50, p90: a.P90, p95: a.P95, max: a.max != null ? a.max : null };
  }
  /* Latest run of every scenario, one row per scenario (sorted by expected loss, highest first). */
  function latestPerScenario(runs, scenarios, override) {
    var by = {};
    (runs || []).forEach(function (r) {
      var k = scenarioOf(r, scenarios);
      if (!by[k] || (r.at || '') > (by[k].at || '')) by[k] = r;
    });
    if (override) { var o = (runs || []).filter(function (r) { return r.id === override; })[0]; if (o) by[scenarioOf(o, scenarios)] = o; }
    return Object.keys(by).map(function (k) {
      var r = by[k], s = (scenarios || []).filter(function (x) { return (x.scenarioId || x.id) === k; })[0];
      return Object.assign({}, r, { scenarioId: k, scenarioName: r.scenarioName || (s && s.scenarioName) || null, currency: r.currency || (s && s.currency) || 'TWD',
        results: r.results || results(r.summaries), dataSource: r.dataSource || fieldsSource(r.inputs), assumptionStatus: r.assumptionStatus || assumptionStatus(r.inputs) });
    }).sort(function (a, b) { return b.summaries.AnnualRisk.Mean - a.summaries.AnnualRisk.Mean; });
  }
  function sameCurrency(list) { var c = {}; (list || []).forEach(function (r) { c[r.currency || 'TWD'] = 1; }); return Object.keys(c).length <= 1; }
  function nextId(scenarios) {
    var n = 0; (scenarios || []).forEach(function (s) { var m = /^FS-(\d+)$/.exec(s.scenarioId || s.id); if (m) n = Math.max(n, +m[1]); });
    return 'FS-' + String(n + 1).padStart(3, '0');
  }
  C.services.fairScenarios = { scenario: scenario, scenarioOf: scenarioOf, results: results, latestPerScenario: latestPerScenario, sameCurrency: sameCurrency, nextId: nextId,
    fieldsSource: fieldsSource, assumptionStatus: assumptionStatus, ASSUMPTION_LABEL: ASSUMPTION_LABEL };
})(globalThis.CAT6);
