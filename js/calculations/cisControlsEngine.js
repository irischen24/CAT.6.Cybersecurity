/* CIS Controls v8.1 coverage — plain counts, no weighting (no weighting method supplied). */
(function (C) {
  var IGS = ['ig1', 'ig2', 'ig3'];
  function igsUpTo(target) { return IGS.slice(0, ({ IG1: 1, IG2: 2, IG3: 3 })[target] || 1); }
  function count(rows, key) {
    var c = { NOT_ASSESSED: 0, NOT_IMPLEMENTED: 0, PARTIAL: 0, IMPLEMENTED: 0, NOT_APPLICABLE: 0 };
    rows.forEach(function (r) { c[r[key] || 'NOT_ASSESSED']++; });
    var assessed = c.NOT_IMPLEMENTED + c.PARTIAL + c.IMPLEMENTED;
    return { counts: c, assessed: assessed, coverage: assessed ? c.IMPLEMENTED / assessed : null };
  }
  function coverageByIG(rows) { var o = {}; IGS.forEach(function (k) { o[k] = count(rows, k); }); return o; }
  /* Gap = any control whose status for the target IG (or a lower IG) is not IMPLEMENTED / NOT_APPLICABLE. */
  function gaps(rows, target) {
    var keys = igsUpTo(target);
    return rows.filter(function (r) { return keys.some(function (k) { var s = r[k] || 'NOT_ASSESSED'; return s !== 'IMPLEMENTED' && s !== 'NOT_APPLICABLE'; }); })
      .map(function (r) { return { id: r.id, missing: keys.filter(function (k) { var s = r[k] || 'NOT_ASSESSED'; return s !== 'IMPLEMENTED' && s !== 'NOT_APPLICABLE'; }) }; });
  }
  /* Safeguard catalog (imported) coverage per IG. */
  function safeguardCoverage(sg) {
    var o = {};
    IGS.forEach(function (k) {
      var inIg = sg.filter(function (s) { return s[k]; });
      var c = count(inIg, 'status');
      o[k] = { total: inIg.length, implemented: c.counts.IMPLEMENTED, assessed: c.assessed, coverage: c.coverage };
    });
    return o;
  }
  C.calc.cisControls = { IGS: IGS, igsUpTo: igsUpTo, coverageByIG: coverageByIG, gaps: gaps, safeguardCoverage: safeguardCoverage, count: count };
})(globalThis.CAT6);
