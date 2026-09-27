/* NIST CSF 2.0 — CSF 2.0 Readiness Index (platform-defined, source: 正式的_Readiness_評分方法.pdf).
 * Implementation score 0–3 per Category (0 Not / 1 Partially / 2 Largely / 3 Fully Implemented).
 * Gap = max(0, Target − Current). Readiness % = Σ Current ÷ (3 × assessed Categories) × 100, rounded to an integer,
 * then mapped to Initial 0–20 / Developing 21–40 / Defined 41–60 / Managed 61–80 / Optimized 81–100.
 * Categories without a Current score are excluded (DATA REQUIRED), never counted as 0. Not an official NIST score. */
(function (C) {
  function max() { return (C.data.csf && C.data.csf.scaleMax) || 3; }
  function valid(v) { return typeof v === 'number' && v >= 0 && v <= max() && Math.floor(v) === v; }
  /* Target entered by the organization, else the CAT.6 default target (parameters: csfDefaultTarget = 3). */
  function defaultTarget() { var P = C.data.defaults && C.data.defaults.parameters; return P ? P.value('csfDefaultTarget') : null; }
  function target(row) { return valid(row.target) ? row.target : (valid(row.current) ? defaultTarget() : null); }
  function targetIsDefault(row) { return !valid(row.target) && valid(row.current) && defaultTarget() != null; }
  function gap(row) { var t = target(row); return valid(row.current) && valid(t) ? Math.max(0, t - row.current) : null; }
  function level(pct) {
    if (pct == null) return null;
    var p = Math.round(pct);
    return C.data.csf.readinessLevels.filter(function (l) { return p >= l.min && p <= l.max; })[0] || null;
  }
  function readiness(rows) {
    var rs = (rows || []).filter(function (r) { return valid(r.current); });
    if (!rs.length) return { percent: null, level: null, assessed: 0, status: 'DATA_REQUIRED' };
    var pct = rs.reduce(function (s, r) { return s + r.current; }, 0) / (max() * rs.length) * 100;
    return { percent: Math.round(pct), level: level(pct), assessed: rs.length };
  }
  function byFunction(rows) {
    return C.data.csf.functions.map(function (f) {
      var mine = rows.filter(function (r) { return r.id.indexOf(f.id + '.') === 0; });
      var rs = mine.filter(function (r) { return valid(r.current) && valid(target(r)); });
      var avg = function (k) { return rs.length ? rs.reduce(function (s, r) { return s + (k === 'target' ? target(r) : r[k]); }, 0) / rs.length : null; };
      return { id: f.id, name: f.name, zh: f.zh, assessed: rs.length, total: f.categories.length, current: avg('current'), target: avg('target'),
        gap: rs.length ? avg('target') - avg('current') : null, readiness: readiness(mine),
        openActions: mine.filter(function (r) { return gap(r) > 0; }).length };
    });
  }
  C.calc.csf = { gap: gap, target: target, targetIsDefault: targetIsDefault, byFunction: byFunction, valid: valid, readiness: readiness, level: level, max: max };
})(globalThis.CAT6);
