/* NIST SP 800-30 Rev.1 risk engine.
 * Table G-5 is a LOOKUP MATRIX exactly as supplied in Risk_Criteria.pdf — never multiplication.
 * Risk determination (source: 確認_NIST_Table_I-2_與_H-3.pdf): CAT.6 5×5 semi-quantitative matrix built on NIST
 * risk-assessment concepts — Overall Likelihood (from G-5) and Impact mapped VL..VH → 1..5, Score = L × I,
 * bands Low 1–4 / Moderate 5–9 / High 10–16 / Very High 17–25. Platform-defined, NOT an official NIST score.
 * Table I-2 (data/catalog/nist-impact-risk.js) is kept as a reference lookup only (riskI2). */
(function (C) {
  var LEVELS = ['VL', 'L', 'M', 'H', 'VH'];
  function overallLikelihood(initiationLevel, impactLikelihood) {
    var g5 = C.data.nist.G5;
    var r = g5.rows.indexOf(initiationLevel), c = g5.cols.indexOf(impactLikelihood);
    if (r < 0 || c < 0) throw new Error('G-5 lookup requires VL / L / M / H / VH');
    return g5.matrix[r][c];
  }
  function levelFromSemiQuant(table, value) {
    var rows = C.data.nist[table].levels;
    for (var i = 0; i < rows.length; i++) if (value >= rows[i].range[0] && value <= rows[i].range[1]) return rows[i];
    return null;
  }
  function riskLevel(overall, impact) {
    var i2 = C.data.nist.I2;
    if (!i2) throw new Error('Table I-2 not loaded');
    var r = i2.rows.indexOf(overall), c = i2.cols.indexOf(impact);
    if (r < 0 || c < 0) throw new Error('I-2 lookup requires VL / L / M / H / VH');
    return i2.matrix[r][c];
  }
  /* Which likelihood table applies to the first step. */
  function initiationTable(sourceType) { return sourceType === 'ADV' ? 'G2' : 'G3'; }
  /* Full chain for one assessment row. Missing inputs → DATA_REQUIRED instead of a guess. */
  function assess(e) {
    var missing = [];
    if (e.sourceType !== 'ADV' && e.sourceType !== 'NONADV') missing.push('sourceType');
    ['initiation', 'adverseImpact', 'impact'].forEach(function (k) { if (LEVELS.indexOf(e[k]) < 0) missing.push(k); });
    if (missing.length) return { status: 'DATA_REQUIRED', missing: missing };
    var overall = overallLikelihood(e.initiation, e.adverseImpact);
    var l5 = LEVELS.indexOf(overall) + 1, i5 = LEVELS.indexOf(e.impact) + 1, a = C.calc.riskMatrix.assess(l5, i5);
    return { status: 'OK', table: initiationTable(e.sourceType), overall: overall, likelihood5: l5, impact5: i5, score: a.score, band: a.band,
      levelName: a.band.nist, risk: riskLevel(overall, e.impact), riskI2: riskLevel(overall, e.impact) };
  }
  /* VL..VH → 1..5 for the platform matrix. */
  function toFive(level) { var i = LEVELS.indexOf(level); return i < 0 ? null : i + 1; }
  C.calc.nist = { LEVELS: LEVELS, overallLikelihood: overallLikelihood, levelFromSemiQuant: levelFromSemiQuant,
    riskLevel: riskLevel, initiationTable: initiationTable, assess: assess, toFive: toFive };
})(globalThis.CAT6);
