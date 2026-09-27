/* CIS RAM worksheet engine.
 * Inherent / residual scores use the CAT.6 Platform 5×5 criteria (the only scoring criteria supplied).
 * Acceptability compares the residual score with the organization-defined acceptable score.
 * If no threshold has been supplied the result is DATA_REQUIRED — CAT.6 does not assume one. */
(function (C) {
  var RM = C.calc.riskMatrix;
  function safe(l, i) { return (l >= 1 && l <= 5 && i >= 1 && i <= 5) ? RM.assess(l, i) : null; }
  function assess(row, acceptableScore) {
    var inherent = safe(row.inherentLikelihood, row.inherentImpact), residual = safe(row.residualLikelihood, row.residualImpact);
    var acceptability;
    if (!residual) acceptability = { id: 'DATA_REQUIRED', why: '缺少處理後 Likelihood / Impact' };
    else if (acceptableScore == null || acceptableScore === '') acceptability = { id: 'DATA_REQUIRED', why: '組織尚未定義可接受風險門檻' };
    else acceptability = residual.score <= acceptableScore ? { id: 'ACCEPTABLE' } : { id: 'NOT_ACCEPTABLE' };
    return { inherent: inherent, residual: residual, reduction: inherent && residual ? inherent.score - residual.score : null, acceptability: acceptability };
  }
  C.calc.cisRam = { assess: assess };
})(globalThis.CAT6);
