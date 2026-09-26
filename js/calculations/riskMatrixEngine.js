/* CAT.6 Platform Risk Criteria — 5×5 (Likelihood 1–5 × Impact 1–5).
 * Platform-defined; NOT an ISO/IEC 27001 requirement. Bands live in data/risk-criteria.js. */
(function (C) {
  function score(likelihood, impact) {
    if (!(likelihood >= 1 && likelihood <= 5 && impact >= 1 && impact <= 5))
      throw new Error('Likelihood and Impact must be integers 1–5');
    return likelihood * impact;
  }
  function classify(s) {
    var bands = C.data.riskCriteria.cat6.bands;
    for (var i = 0; i < bands.length; i++) if (s >= bands[i].min && s <= bands[i].max) return bands[i];
    return null;
  }
  function assess(likelihood, impact) { var s = score(likelihood, impact); return { score: s, band: classify(s) }; }
  function countByLevel(register) {
    var out = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    register.forEach(function (r) { out[assess(r.likelihood.value, r.impact.value).band.id]++; });
    return out;
  }
  C.calc.riskMatrix = { score: score, classify: classify, assess: assess, countByLevel: countByLevel };
})(globalThis.CAT6);
