/* Orchestrates a FAIR run: validation → chunked simulation (yields to the UI) → summaries → chart data.
 * Keeps the UI responsive without a Web Worker so the prototype also runs from file://.
 * Production: move the engine into a Worker (see docs/ARCHITECTURE.md). */
(function (C) {
  var CHUNK = 50000;
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function run(inputs, opts, onProgress) {
    var engine;
    try { engine = C.calc.fair.createRun(inputs, opts); }
    catch (e) { return Promise.reject(e); }
    var report = onProgress || function () {};
    var t0 = Date.now();

    function loop() {
      engine.step(CHUNK);
      report({ phase: 'simulate', progress: engine.progress() * 0.85 });
      return engine.done() ? Promise.resolve() : tick().then(loop);
    }
    return tick().then(loop).then(function () {
      var summaries = {}, keys = C.calc.fair.OUTPUT_KEYS, k = 0;
      function next() {
        if (k >= keys.length) return Promise.resolve();
        summaries[keys[k]] = engine.summarizeKey(keys[k]);
        k++;
        report({ phase: 'summarize', progress: 0.85 + 0.15 * (k / keys.length) });
        return tick().then(next);
      }
      return next().then(function () {
        var sorted = engine.arrays.AnnualRisk;
        return {
          iterations: engine.n, seed: opts.seed, durationMs: Date.now() - t0,
          summaries: summaries,
          histogram: C.calc.stats.histogram(sorted, 40, 99.5),
          exceedance: C.calc.stats.exceedance(sorted, 120),
          pointEstimate: C.calc.fair.pointEstimate(inputs),
          sortedAnnualRisk: sorted
        };
      });
    });
  }
  C.services.fair = { run: run };
})(globalThis.CAT6);
