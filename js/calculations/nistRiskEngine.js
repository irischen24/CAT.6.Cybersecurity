/* NIST SP 800-30 Rev.1 likelihood engine.
 * Table G-5 is a LOOKUP MATRIX exactly as supplied in Risk_Criteria.pdf — never multiplication. */
(function (C) {
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
  C.calc.nist = { overallLikelihood: overallLikelihood, levelFromSemiQuant: levelFromSemiQuant };
})(globalThis.CAT6);
