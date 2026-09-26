/* Summary statistics matching numpy.percentile default (linear interpolation). */
(function (C) {
  function percentileSorted(sorted, p) {
    var n = sorted.length; if (!n) return NaN;
    var idx = (p / 100) * (n - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }
  function mean(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s / arr.length; }
  /* Sorts the typed array in place. Returns P10, P25, P50, Mean, P75, P90, P95. */
  function summarize(arr) {
    var m = mean(arr);
    arr.sort();
    return {
      P10: percentileSorted(arr, 10), P25: percentileSorted(arr, 25), P50: percentileSorted(arr, 50),
      Mean: m,
      P75: percentileSorted(arr, 75), P90: percentileSorted(arr, 90), P95: percentileSorted(arr, 95),
      min: arr[0], max: arr[arr.length - 1]
    };
  }
  function histogram(sorted, bins, upperPct) {
    var lo = sorted[0], hi = percentileSorted(sorted, upperPct || 99.5);
    var w = (hi - lo) / bins, counts = new Array(bins).fill(0), overflow = 0;
    for (var i = 0; i < sorted.length; i++) {
      var v = sorted[i];
      if (v > hi) { overflow++; continue; }
      counts[Math.min(bins - 1, Math.floor((v - lo) / w))]++;
    }
    return { lo: lo, hi: hi, width: w, counts: counts, overflow: overflow, n: sorted.length };
  }
  /* Loss exceedance: P(Annual Risk > x), sampled up to the 99.9th percentile. */
  function exceedance(sorted, points) {
    var n = sorted.length, out = [];
    for (var i = 0; i <= points; i++) {
      var idx = Math.floor((i / points) * 0.999 * (n - 1));
      out.push({ x: sorted[idx], p: 1 - idx / (n - 1) });
    }
    return out;
  }
  C.calc.stats = { percentileSorted: percentileSorted, mean: mean, summarize: summarize, histogram: histogram, exceedance: exceedance };
})(globalThis.CAT6);
