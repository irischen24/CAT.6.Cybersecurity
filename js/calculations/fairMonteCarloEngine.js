/* FAIR Monte Carlo engine — pure calculation, no DOM.
 * Formulas (supplied CAT.6 methodology, FAIR筆記-20260926):
 *   TEF = CF × PoA
 *   LEF = TEF × Susceptibility
 *   LM  = PL + SL
 *   Annual Risk = LEF × LM        (multiplication — never LEF + LM)
 * Every iteration re-samples every input (notes, Step 3).
 * Chunk-driven so the service layer can yield to the UI between chunks. */
(function (C) {
  var D = C.calc.distributions, S = C.calc.stats;
  var VARS = ['CF', 'PoA', 'Susceptibility', 'PrimaryLoss', 'SecondaryLoss'];

  function validate(inputs) {
    var errors = [];
    VARS.forEach(function (k) {
      var t = inputs[k];
      if (!t) { errors.push({ field: k, code: 'DATA_REQUIRED', expected: '需提供 Min / Most Likely / Max' }); return; }
      D.validateTriangular(t).forEach(function (e) { errors.push({ field: k, code: e.code, expected: e.expected }); });
      if (k === 'PoA' || k === 'Susceptibility') {
        if (t.min < 0 || t.max > 1) errors.push({ field: k, code: 'OUT_OF_RANGE', expected: '機率需介於 0%–100%' });
      } else if (t.min < 0) errors.push({ field: k, code: 'NEGATIVE', expected: '不可為負值' });
    });
    return errors;
  }

  function createRun(inputs, opts) {
    var errs = validate(inputs);
    if (errs.length) { var e = new Error('FAIR input validation failed'); e.errors = errs; throw e; }
    var n = opts.iterations, rand = C.calc.rng.create(opts.seed);
    var out = {
      TEF: new Float64Array(n), LEF: new Float64Array(n),
      PrimaryLoss: new Float64Array(n), SecondaryLoss: new Float64Array(n),
      LM: new Float64Array(n), AnnualRisk: new Float64Array(n)
    };
    var i = 0, cf = inputs.CF, poa = inputs.PoA, su = inputs.Susceptibility, pl = inputs.PrimaryLoss, sl = inputs.SecondaryLoss;
    var T = D.triangularSample;
    return {
      n: n,
      done: function () { return i >= n; },
      progress: function () { return i / n; },
      step: function (chunk) {
        var end = Math.min(n, i + chunk);
        for (; i < end; i++) {
          var CF = T(rand(), cf.min, cf.mostLikely, cf.max);
          var PoA = T(rand(), poa.min, poa.mostLikely, poa.max);
          var Su = T(rand(), su.min, su.mostLikely, su.max);
          var PL = T(rand(), pl.min, pl.mostLikely, pl.max);
          var SL = T(rand(), sl.min, sl.mostLikely, sl.max);
          var TEF = CF * PoA, LEF = TEF * Su, LM = PL + SL;
          out.TEF[i] = TEF; out.LEF[i] = LEF; out.PrimaryLoss[i] = PL; out.SecondaryLoss[i] = SL;
          out.LM[i] = LM; out.AnnualRisk[i] = LEF * LM;
        }
      },
      /* Sorts that output array in place; AnnualRisk stays sorted for the charts. */
      summarizeKey: function (k) { return S.summarize(out[k]); },
      arrays: out
    };
  }

  /* Deterministic most-likely point estimate — traceability against the notes' Step 2. */
  function pointEstimate(inputs) {
    var TEF = inputs.CF.mostLikely * inputs.PoA.mostLikely;
    var LEF = TEF * inputs.Susceptibility.mostLikely;
    var LM = inputs.PrimaryLoss.mostLikely + inputs.SecondaryLoss.mostLikely;
    return { TEF: TEF, LEF: LEF, LM: LM, AnnualRisk: LEF * LM };
  }

  C.calc.fair = { VARS: VARS, validate: validate, createRun: createRun, pointEstimate: pointEstimate,
    OUTPUT_KEYS: ['TEF', 'LEF', 'PrimaryLoss', 'SecondaryLoss', 'LM', 'AnnualRisk'] };
})(globalThis.CAT6);
