/* FAIR Monte Carlo Web Worker. Runs the SAME engine files as the main thread (importScripts), so a given
 * seed produces identical results in the Worker and in the main-thread fallback.
 * Messages in:  { type: 'run', jobId, inputs, iterations, seed } — every message out echoes jobId
 * Messages out: { type: 'progress', phase, progress } · { type: 'done', result } · { type: 'error', message, errors } */
importScripts('../core/namespace.js', '../calculations/rng.js', '../calculations/distributions.js', '../calculations/stats.js', '../calculations/fairMonteCarloEngine.js');
var CHUNK = 50000;
self.onmessage = function (e) {
  var msg = e.data || {};
  if (msg.type !== 'run') return;
  var C = self.CAT6, t0 = Date.now(), engine, post = function (m) { m.jobId = msg.jobId; self.postMessage(m); };
  try { engine = C.calc.fair.createRun(msg.inputs, { iterations: msg.iterations, seed: msg.seed }); }
  catch (err) { post({ type: 'error', message: err.message, errors: err.errors || null }); return; }
  try {
    var lastPost = 0;
    while (!engine.done()) {
      engine.step(CHUNK);
      var now = Date.now();
      if (now - lastPost > 40 || engine.done()) { post({ type: 'progress', phase: 'simulate', progress: engine.progress() * 0.85 }); lastPost = now; }
    }
    var summaries = {}, keys = C.calc.fair.OUTPUT_KEYS;
    keys.forEach(function (k, i) {
      summaries[k] = engine.summarizeKey(k);
      post({ type: 'progress', phase: 'summarize', progress: 0.85 + 0.15 * ((i + 1) / keys.length) });
    });
    var sorted = engine.arrays.AnnualRisk;
    post({ type: 'done', result: {
      iterations: engine.n, seed: msg.seed, durationMs: Date.now() - t0, engine: 'worker',
      summaries: summaries, histogram: C.calc.stats.histogram(sorted, 40, 99.5), exceedance: C.calc.stats.exceedance(sorted, 120),
      pointEstimate: C.calc.fair.pointEstimate(msg.inputs)
    } });
  } catch (err2) { post({ type: 'error', message: err2.message }); }
};
