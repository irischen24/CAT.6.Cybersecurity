/* CAT.6 Readiness Indicator — NOT an ISO/IEC 27001 score and not a certification prediction.
 * No readiness scoring methodology was supplied, so each area is a transparent completion ratio
 * (completed items / applicable items) and the overall indicator is the unweighted mean of the areas
 * that have data. Areas without data return DATA_REQUIRED and are excluded (never counted as 0 or 100). */
(function (C) {
  var CONTEXT_FIELDS = ['issuesInternal', 'issuesExternal', 'interestedParties', 'requirements', 'scopeStatement', 'boundaries', 'interfaces'];
  function ratio(done, total, detail) { return total ? { value: done / total, done: done, total: total, detail: detail } : { value: null, done: 0, total: 0, detail: detail, status: 'DATA_REQUIRED' }; }
  function filled(v) { return v != null && String(v).trim() !== ''; }
  function compute(d) {
    var ctx = d.context || {}, risks = d.risks || [], tr = d.treatments || [], clauses = d.clauses || [], soa = d.soa || [],
      ev = d.evidence || [], audits = d.audits || [], capas = d.capas || [], findings = d.findings || [], reviews = d.reviews || [];
    var areas = {};
    areas.scope = ratio(CONTEXT_FIELDS.filter(function (k) { return filled(ctx[k]); }).length, CONTEXT_FIELDS.length, '組織全景與範圍欄位已填寫');
    var assessedClauses = clauses.filter(function (c) { return c.status && c.status !== 'NOT_ASSESSED'; }).length;
    areas.gap = ratio(assessedClauses, C.data.iso.clauses.length, '條款已完成差異評估');
    areas.riskAssessment = risks.length ? ratio(risks.filter(function (r) { return r.likelihood >= 1 && r.impact >= 1; }).length, risks.length, '風險已評估 L × I') : ratio(0, 0, '尚無風險情境');
    var treated = risks.filter(function (r) { return tr.some(function (t) { return t.riskId === r.id; }) || r.treatment === 'Accept'; }).length;
    areas.riskTreatment = risks.length ? ratio(treated, risks.length, '風險已有處理計畫或接受決策') : ratio(0, 0, '尚無風險情境');
    var applicable = soa.filter(function (s) { return s.applicable === true; });
    areas.controls = applicable.length ? ratio(applicable.filter(function (s) { return s.status === 'IMPLEMENTED'; }).length, applicable.length, '適用控制已實施') : ratio(0, 0, 'SoA 尚未決定適用控制');
    areas.evidence = ev.length ? ratio(ev.filter(function (e) { return e.status === 'Accepted'; }).length, ev.length, '證據已接受') : ratio(0, 0, '尚無證據紀錄');
    areas.audit = audits.length ? ratio(audits.filter(function (a) { return a.status === 'Completed'; }).length, audits.length, '稽核計畫已完成') : ratio(0, 0, '尚無內部稽核計畫');
    var lastReview = reviews.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); })[0];
    areas.review = lastReview ? ratio((lastReview.inputs || []).length, C.data.iso.reviewInputs.length, '最近一次管理審查涵蓋 9.3.2 輸入') : ratio(0, 0, '尚無管理審查紀錄');
    areas.capa = capas.length ? ratio(capas.filter(function (c) { return c.status === 'Closed'; }).length, capas.length, '矯正措施已結案') :
      (findings.some(function (f) { return f.type !== 'OFI'; }) ? ratio(0, 1, '有不符合事項但無矯正措施') : ratio(0, 0, '尚無矯正措施'));
    var have = Object.keys(areas).filter(function (k) { return areas[k].value != null; });
    var overall = have.length ? have.reduce(function (s, k) { return s + areas[k].value; }, 0) / have.length : null;
    return { areas: areas, overall: overall, basedOn: have.length, of: Object.keys(areas).length,
      soaDecided: soa.filter(function (s) { return s.applicable === true || s.applicable === false; }).length };
  }
  /* Roadmap item progress derived from module data (d.ctx, d.risks, d.treatments, d.audits). null = no data. */
  function autoValue(key, R, d) {
    d = Object.assign({ ctx: {}, risks: [], treatments: [], audits: [] }, d); d.ctx = d.ctx || {};
    var A = R.areas, filled = function (k) { return d.ctx[k] && String(d.ctx[k]).trim() !== ''; };
    switch (key) {
      case 'context': return A.scope.value;
      case 'scope': return filled('scopeStatement') && filled('boundaries') ? 1 : filled('scopeStatement') || filled('boundaries') ? 0.5 : 0;
      case 'gap': return A.gap.value; case 'riskAssessment': return A.riskAssessment.value; case 'riskTreatment': return A.riskTreatment.value;
      case 'riskRegister': return d.risks.length ? 1 : 0;
      case 'controlMapping': return d.treatments.length ? d.treatments.filter(function (t) { return t.refs && ((t.refs.iso || []).length || (t.refs.cis || []).length || (t.refs.csf || []).length); }).length / d.treatments.length : null;
      case 'soa': return R.soaDecided / C.data.iso.annexA.length;
      case 'evidence': return A.evidence.value; case 'audit': return A.audit.value; case 'capa': return A.capa.value; case 'review': return A.review.value;
      case 'findings': return d.audits.some(function (a) { return a.status === 'Completed'; }) ? 1 : d.audits.length ? 0 : null;
      case 'riskStatus': return d.risks.length ? d.risks.filter(function (r) { return r.status && r.status !== 'Draft'; }).length / d.risks.length : null;
      case 'overall': return R.overall;
    }
    return null;
  }
  var LABELS = { scope: 'Scope Completion', gap: 'Gap Assessment', riskAssessment: 'Risk Assessment', riskTreatment: 'Risk Treatment',
    controls: 'Control Implementation', evidence: 'Evidence Completion', audit: 'Internal Audit', review: 'Management Review', capa: 'Corrective Actions' };
  C.calc.isoReadiness = { compute: compute, autoValue: autoValue, LABELS: LABELS, CONTEXT_FIELDS: CONTEXT_FIELDS,
    label: 'CAT.6 Readiness Indicator', disclaimer: 'CAT.6 Readiness Indicator 為平台自定義之完成比例（等權平均），非 ISO/IEC 27001 官方評分，亦不預測驗證結果。' };
})(globalThis.CAT6);
