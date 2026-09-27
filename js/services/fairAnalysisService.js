/* FAIR run orchestration.
 * Preferred path: Web Worker (js/workers/fair.worker.js) — the UI never freezes, even at 1,000,000 iterations.
 * Fallback path: chunked main-thread run (setTimeout between 50k-iteration chunks). Used automatically when a
 * Worker cannot start — e.g. pages opened via file://, where browsers block Worker scripts.
 * Both paths call the same engine, so the same seed gives identical results. */
(function (C) {
  var CHUNK = 50000;
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function runMainThread(inputs, opts, onProgress) {
    var engine;
    try { engine = C.calc.fair.createRun(inputs, opts); }
    catch (e) { return Promise.reject(e); }
    var report = onProgress || function () {}, t0 = Date.now();
    function loop() {
      engine.step(CHUNK);
      report({ phase: 'simulate', progress: engine.progress() * 0.85 });
      return engine.done() ? Promise.resolve() : tick().then(loop);
    }
    return tick().then(loop).then(function () {
      var summaries = {}, keys = C.calc.fair.OUTPUT_KEYS, k = 0;
      function next() {
        if (k >= keys.length) return Promise.resolve();
        summaries[keys[k]] = engine.summarizeKey(keys[k]); k++;
        report({ phase: 'summarize', progress: 0.85 + 0.15 * (k / keys.length) });
        return tick().then(next);
      }
      return next().then(function () {
        var sorted = engine.arrays.AnnualRisk;
        return { iterations: engine.n, seed: opts.seed, durationMs: Date.now() - t0, engine: 'main-thread', summaries: summaries,
          histogram: C.calc.stats.histogram(sorted, 40, 99.5), exceedance: C.calc.stats.exceedance(sorted, 120), pointEstimate: C.calc.fair.pointEstimate(inputs) };
      });
    });
  }

  function workerUrl() { return (C.config && C.config.workerBase || '../js/workers/') + 'fair.worker.js'; }

  /* Returns { promise, cancel, engine } so the page can show "Running / Cancel". */
  function start(inputs, opts, onProgress) {
    var report = onProgress || function () {}, worker = null, settled = false, api = { engine: 'worker' };
    var errs = C.calc.fair.validate(inputs);
    if (errs.length) { var e = new Error('FAIR input validation failed'); e.errors = errs; api.promise = Promise.reject(e); api.cancel = function () {}; return api; }
    var rejectFn;
    api.promise = new Promise(function (resolve, reject) {
      rejectFn = reject;
      function fallback(reason) {
        if (settled) return;
        if (worker) { try { worker.terminate(); } catch (x) {} worker = null; }
        api.engine = 'main-thread'; api.fallbackReason = reason;
        report({ phase: 'fallback', progress: 0, reason: reason });
        runMainThread(inputs, opts, report).then(function (r) { settled = true; r.fallbackReason = reason; resolve(r); }, function (er) { settled = true; reject(er); });
      }
      if (typeof Worker === 'undefined') return fallback('此瀏覽器不支援 Web Worker');
      if (location.protocol === 'file:') return fallback('以 file:// 開啟時瀏覽器不允許 Worker，改用主執行緒分段計算');
      try { worker = new Worker(workerUrl()); }
      catch (err) { return fallback('無法啟動 Worker：' + err.message); }
      var started = false;
      worker.onmessage = function (ev) {
        var m = ev.data; started = true;
        if (m.type === 'progress') report(m);
        else if (m.type === 'done') { settled = true; worker.terminate(); resolve(m.result); }
        else if (m.type === 'error') { settled = true; worker.terminate(); var er = new Error(m.message); er.errors = m.errors; reject(er); }
      };
      worker.onerror = function (ev) { ev.preventDefault(); if (!started) fallback('Worker 載入失敗'); else if (!settled) { settled = true; reject(new Error('Worker 錯誤：' + (ev.message || ''))); } };
      worker.postMessage({ type: 'run', inputs: inputs, iterations: opts.iterations, seed: opts.seed });
    });
    api.cancel = function () { if (worker && !settled) { worker.terminate(); settled = true; var c = new Error('已取消模擬'); c.cancelled = true; rejectFn(c); } };
    return api;
  }
  /* Backwards-compatible promise API used by earlier code and tests. */
  function run(inputs, opts, onProgress) { return runMainThread(inputs, opts, onProgress); }
  C.services.fair = { run: run, runMainThread: runMainThread, start: start };
})(globalThis.CAT6);
