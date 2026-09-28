/* Dashboard View Model — the single object both the on-screen Dashboard and the Dashboard PDF are drawn from.
 *   Raw records → workspace.load (normalization layer) → build(d, assessment) → View Model → UI  /  PDF
 * The PDF export receives the SAME object the Dashboard rendered (C.services.dashboardModel.current), so the two can never
 * show different numbers. No engine logic lives here: it only calls the existing calculators and counts. */
(function (C) {
  var RM = C.calc.riskMatrix, F = C.util.format;
  var COLS = ['risks', 'treatments', 'cisControls', 'findings', 'capas', 'snapshots', 'activity', 'fairRuns', 'fairInputs', 'isoContext', 'isoClauses', 'isoSoa', 'evidence', 'audits', 'reviews', 'nist', 'cisram', 'csf'];
  function srcOf(rows) { var l = rows.map(function (r) { return r.source; }); return l.indexOf('CAT6_DEFAULT') >= 0 ? 'CAT6_DEFAULT' : l.indexOf('FILE_IMPORT') >= 0 ? 'FILE_IMPORT' : 'USER_INPUT'; }

  function build(d, a, opts) {
    opts = opts || {};
    a = a || {};
    var risks = d.risks || [];
    var scored = risks.filter(function (r) { return r.likelihood >= 1 && r.impact >= 1; }).map(function (r) { var x = RM.assess(r.likelihood, r.impact); return Object.assign({}, r, { score: x.score, band: x.band }); }).sort(function (x, y) { return y.score - x.score; });
    var counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }; scored.forEach(function (r) { counts[r.band.id]++; });
    var target = String(C.data.defaults && C.data.defaults.parameters ? C.data.defaults.parameters.value('targetIG', a) : (a.targetIG || 'IG1')).toLowerCase();
    var cov = C.calc.cisControls.coverageByIG(d.cisControls || [])[target];
    var openF = (d.findings || []).filter(function (f) { return f.status !== 'Closed'; });
    var R = C.calc.isoReadiness.compute({ context: (d.isoContext || [])[0], clauses: d.isoClauses, soa: d.isoSoa, risks: risks, treatments: d.treatments, evidence: d.evidence, audits: d.audits, findings: d.findings, capas: d.capas, reviews: d.reviews });
    var tsum = C.calc.treatment.summary(d.treatments || [], opts.today);
    var kpis = [
      { id: 'critical', label: 'Critical Risks', value: counts.CRITICAL, text: String(counts.CRITICAL), meta: '分數 17–25', src: 'CALCULATED', featured: true, href: 'risk-register.html' },
      { id: 'high', label: 'High Risks', value: counts.HIGH, text: String(counts.HIGH), meta: '分數 10–16', src: 'CALCULATED', href: 'risk-register.html' },
      (function () { var n = risks.filter(function (r) { return r.status === 'Draft' || r.status === 'In review'; }).length; return { id: 'active', label: 'Active Assessments', value: n, text: String(n), meta: '草稿 + 審閱中 · 逾期處理 ' + tsum.OVERDUE, src: risks.length ? srcOf(risks) : 'USER_INPUT', href: 'risk-treatment.html?view=OVERDUE' }; })(),
      cov.coverage == null ? { id: 'coverage', label: 'Control Coverage', empty: 'DATA REQUIRED', text: 'DATA REQUIRED', meta: '尚未評估 CIS Controls ' + target.toUpperCase(), href: 'cis-controls.html' }
        : { id: 'coverage', label: 'Control Coverage', value: cov.coverage, text: F.pct(cov.coverage), meta: 'CIS ' + target.toUpperCase() + ' 已實施 ' + cov.counts.IMPLEMENTED + ' / ' + cov.assessed, src: 'CALCULATED', href: 'cis-controls.html' },
      (function () { var nc = openF.filter(function (f) { return f.type === 'MAJOR_NC' || f.type === 'MINOR_NC'; }).length, ofi = openF.filter(function (f) { return f.type === 'OFI' || f.type === 'OBSERVATION'; }).length;
        return { id: 'findings', label: 'Open Findings', value: openF.length, text: String(openF.length), meta: nc + ' 不符合 · ' + ofi + ' 改善機會', src: (d.findings || []).length ? srcOf(d.findings) : 'USER_INPUT', href: 'iso-audit.html' }; })(),
      R.overall == null ? { id: 'readiness', label: 'CAT.6 Readiness Indicator', empty: 'DATA REQUIRED', text: 'DATA REQUIRED', meta: 'ISO 資料不足', href: 'iso-readiness.html' }
        : { id: 'readiness', label: 'CAT.6 Readiness Indicator', value: R.overall, text: F.pct(R.overall), meta: R.basedOn + ' / ' + R.of + ' 面向 · 非 ISO 分數', src: 'CALCULATED', href: 'iso-readiness.html' }
    ];
    var snaps = (d.snapshots || []).slice().sort(function (x, y) { return x.id.localeCompare(y.id); }).slice(-6);
    var fwCount = {}; risks.forEach(function (r) { (r.frameworks || []).forEach(function (f) { fwCount[f] = (fwCount[f] || 0) + 1; }); });
    var coverage = C.data.frameworks.map(function (f) { return { id: f.id, short: f.short, name: f.name, n: fwCount[f.id] || 0, ratio: risks.length ? (fwCount[f.id] || 0) / risks.length : 0 }; });
    var values = []; Object.keys(d).forEach(function (k) { if (k === 'activity' || k === 'snapshots') return; (d[k] || []).forEach(function (r) { if (r.fields) r.fields.forEach(function (f) { values.push({ source: f.source }); }); else values.push({ source: r.source }); }); });
    scored.forEach(function () { values.push({ source: 'CALCULATED' }); });
    var tally = C.util.provenance.tally(values);
    var st = {}; risks.forEach(function (r) { st[r.status || 'Draft'] = (st[r.status || 'Draft'] || 0) + 1; });
    var status = ['Draft', 'In review', 'Assessed', 'Treatment planned', 'Closed'].map(function (k) { return { status: k, n: st[k] || 0 }; });
    var strat = {}; (d.treatments || []).forEach(function (t) { strat[t.strategy || '—'] = (strat[t.strategy || '—'] || 0) + 1; });
    var FS = C.services.fairScenarios, scenarios = (d.fairInputs || []).map(FS.scenario), fairLatest = FS.latestPerScenario(d.fairRuns || [], scenarios);
    var fair;
    if (fairLatest.length) fair = { mode: 'runs', scenarios: fairLatest, sameCurrency: FS.sameCurrency(fairLatest), totalMean: fairLatest.reduce(function (t, r) { return t + r.summaries.AnnualRisk.Mean; }, 0), latest: (d.fairRuns || []).slice().sort(function (x, y) { return (y.at || '').localeCompare(x.at || ''); })[0] };
    else {
      var inp = {}; (((d.fairInputs || [])[0] && d.fairInputs[0].fields) || C.data.fairDefaults.fields).forEach(function (f) { inp[f.field] = f.value; });
      fair = { mode: 'point', point: C.calc.fair.pointEstimate(inp), scenarios: [] };
    }
    var now = opts.now ? new Date(opts.now) : new Date();
    return {
      meta: { organization: a.organization || '', assessmentName: a.name || '', assessmentId: a.id || '', scope: a.scope || '', assessmentDate: a.date || '', generatedAt: now.toISOString(),
        generatedAtLocal: C.services.reportIntegrity ? C.services.reportIntegrity.localStamp(now) : now.toISOString() },
      usesDefaults: C.services.workspace ? C.services.workspace.usesDefaults(d) : false,
      counts: counts, total: risks.length, scored: scored, unscored: risks.length - scored.length, kpis: kpis, target: target.toUpperCase(),
      snapshots: snaps, trendSource: snaps.length ? srcOf(snaps) : null, coverage: coverage, sourceTally: tally, sourceTotal: values.length,
      readiness: R, activity: (d.activity || []).slice().sort(function (x, y) { return (y.at || '').localeCompare(x.at || ''); }).slice(0, 6), status: status,
      treatment: { summary: tsum, total: (d.treatments || []).length, byStrategy: strat, untreatedHigh: scored.filter(function (r) { return (r.band.id === 'HIGH' || r.band.id === 'CRITICAL') && !(d.treatments || []).some(function (t) { return t.riskId === r.id; }) && r.treatment !== 'Accept'; }).map(function (r) { return r.id; }) },
      fair: fair
    };
  }
  C.services.dashboardModel = { COLLECTIONS: COLS, build: build, current: null };
})(globalThis.CAT6);
