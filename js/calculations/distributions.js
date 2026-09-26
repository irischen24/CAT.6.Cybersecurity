/* Triangular distribution (CAT.6 demonstration methodology, per FAIR筆記 numpy.triangular).
 * Inverse-CDF sampling. The notes mention Beta-PERT as common practice, but the supplied engine
 * uses triangular, so only triangular is implemented. */
(function (C) {
  function validateTriangular(t) {
    var errs = [];
    if ([t.min, t.mostLikely, t.max].some(function (v) { return typeof v !== 'number' || !isFinite(v); }))
      errs.push({ code: 'NOT_NUMBER', expected: 'Min / Most Likely / Max 皆須為數字' });
    else {
      if (t.min > t.mostLikely) errs.push({ code: 'MIN_GT_ML', expected: 'Min ≤ Most Likely' });
      if (t.mostLikely > t.max) errs.push({ code: 'ML_GT_MAX', expected: 'Most Likely ≤ Max' });
      if (t.min >= t.max) errs.push({ code: 'MIN_GE_MAX', expected: 'Min < Max' });
    }
    return errs;
  }
  function triangularSample(u, a, c, b) {
    var fc = (c - a) / (b - a);
    return u < fc ? a + Math.sqrt(u * (b - a) * (c - a))
                  : b - Math.sqrt((1 - u) * (b - a) * (b - c));
  }
  function triangularMean(t) { return (t.min + t.mostLikely + t.max) / 3; }
  C.calc.distributions = { validateTriangular: validateTriangular, triangularSample: triangularSample, triangularMean: triangularMean };
})(globalThis.CAT6);
