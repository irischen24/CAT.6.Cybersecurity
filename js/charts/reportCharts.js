/* Static SVG strings for printed reports (fixed viewBox, scales to the column width, prints crisply).
 * Light palette for paper; severity keeps shape + text so charts survive greyscale printing. */
(function (C) {
  var esc = function (v) { return C.util.dom.esc(v); };
  var SEV = { LOW: '#2F8F7A', MEDIUM: '#B8860B', HIGH: '#C8561E', CRITICAL: '#B3203A' };
  var FILL = { LOW: '#E3F3EE', MEDIUM: '#FBF1D6', HIGH: '#FCE3D3', CRITICAL: '#F8D7DD' };
  function marker(shape, cx, cy, r, color) {
    if (shape === 'circle') return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '"/>';
    if (shape === 'square') return '<rect x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" fill="' + color + '"/>';
    if (shape === 'triangle') return '<path d="M' + cx + ' ' + (cy - r * 1.1) + ' L' + (cx + r * 1.1) + ' ' + (cy + r) + ' L' + (cx - r * 1.1) + ' ' + (cy + r) + ' Z" fill="' + color + '"/>';
    return '<path d="M' + cx + ' ' + (cy - r * 1.25) + ' L' + (cx + r * 1.25) + ' ' + cy + ' L' + cx + ' ' + (cy + r * 1.25) + ' L' + (cx - r * 1.25) + ' ' + cy + ' Z" fill="' + color + '"/>';
  }
  function matrix(risks, title) {
    var RM = C.calc.riskMatrix, cell = 64, m = { l: 46, t: 10, b: 44 }, W = m.l + cell * 5 + 10, H = m.t + cell * 5 + m.b, s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="c6r-svg c6r-svg--matrix" role="img" aria-label="' + esc(title || '5×5 risk matrix') + '">');
    for (var L = 1; L <= 5; L++) for (var I = 1; I <= 5; I++) {
      var a = RM.assess(L, I), x = m.l + (I - 1) * cell, y = m.t + (5 - L) * cell;
      s.push('<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (cell - 2) + '" height="' + (cell - 2) + '" fill="' + FILL[a.band.id] + '" stroke="#fff"/><text x="' + (x + 5) + '" y="' + (y + 13) + '" font-size="9" fill="#777">' + a.score + '</text>');
    }
    for (var k = 1; k <= 5; k++) {
      s.push('<text x="' + (m.l + (k - 0.5) * cell) + '" y="' + (m.t + 5 * cell + 14) + '" font-size="10" text-anchor="middle" fill="#444">' + k + '</text>');
      s.push('<text x="' + (m.l - 10) + '" y="' + (m.t + (5 - k + 0.5) * cell + 4) + '" font-size="10" text-anchor="middle" fill="#444">' + k + '</text>');
    }
    s.push('<text x="' + (m.l + 2.5 * cell) + '" y="' + (H - 8) + '" font-size="10" text-anchor="middle" fill="#444">Impact 衝擊 →</text>');
    s.push('<text transform="rotate(-90 12 ' + (m.t + 2.5 * cell) + ')" x="12" y="' + (m.t + 2.5 * cell) + '" font-size="10" text-anchor="middle" fill="#444">Likelihood 可能性 →</text>');
    var occ = {};
    risks.filter(function (r) { return r.likelihood >= 1 && r.impact >= 1; }).forEach(function (r) {
      var key = r.likelihood + '-' + r.impact, n = occ[key] = (occ[key] || 0) + 1, a = RM.assess(r.likelihood, r.impact);
      var cx = m.l + (r.impact - 1) * cell + 12 + ((n - 1) % 3) * 18, cy = m.t + (5 - r.likelihood) * cell + 30 + Math.floor((n - 1) / 3) * 18;
      s.push(marker(a.band.shape, cx, cy, 5, SEV[a.band.id]) + '<text x="' + (cx - 8) + '" y="' + (cy + 15) + '" font-size="7" fill="#333">' + esc(r.id) + '</text>');
    });
    s.push('</svg>');
    return s.join('');
  }
  /* rows: [{ label, value (0..1 or null), text }] */
  function hbars(rows, opts) {
    opts = opts || {};
    var W = 640, lw = 190, row = 24, H = rows.length * row + 12, iw = W - lw - 70, s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" class="c6r-svg" role="img" aria-label="' + esc(opts.label || '') + '">'];
    rows.forEach(function (r, i) {
      var y = 6 + i * row;
      s.push('<text x="' + (lw - 8) + '" y="' + (y + 13) + '" font-size="10" text-anchor="end" fill="#333">' + esc(r.label) + '</text>');
      s.push('<rect x="' + lw + '" y="' + (y + 3) + '" width="' + iw + '" height="12" fill="#EEE"/>');
      if (r.value == null) s.push('<text x="' + (lw + 6) + '" y="' + (y + 13) + '" font-size="9" fill="#8A6A00">DATA REQUIRED</text>');
      else s.push('<rect x="' + lw + '" y="' + (y + 3) + '" width="' + Math.max(1, iw * Math.min(1, r.value / (opts.max || 1))) + '" height="12" fill="' + (r.color || '#5B45D6') + '"/>');
      s.push('<text x="' + (W - 64) + '" y="' + (y + 13) + '" font-size="10" fill="#111">' + esc(r.text != null ? r.text : r.value == null ? '—' : Math.round(r.value / (opts.max || 1) * 100) + '%') + '</text>');
    });
    return s.join('') + '</svg>';
  }
  /* before/after per row on 0..max */
  function compare(rows, opts) {
    opts = opts || {};
    var W = 640, lw = 170, row = 22, H = rows.length * row + 30, max = opts.max || 25, iw = W - lw - 20, X = function (v) { return lw + iw * v / max; };
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" class="c6r-svg" role="img" aria-label="' + esc(opts.label || '') + '">'];
    (opts.ticks || [0, 5, 10, 15, 20, 25]).forEach(function (t) { s.push('<line x1="' + X(t) + '" x2="' + X(t) + '" y1="2" y2="' + (H - 22) + '" stroke="#DDD"/><text x="' + X(t) + '" y="' + (H - 8) + '" font-size="9" text-anchor="middle" fill="#555">' + t + '</text>'); });
    rows.forEach(function (r, i) {
      var y = 12 + i * row;
      s.push('<text x="' + (lw - 8) + '" y="' + (y + 4) + '" font-size="10" text-anchor="end" fill="#333">' + esc(r.label) + '</text>');
      if (r.before != null && r.after != null) s.push('<line x1="' + X(r.before) + '" x2="' + X(r.after) + '" y1="' + y + '" y2="' + y + '" stroke="#9C8CE8" stroke-width="3"/>');
      if (r.before != null) s.push('<circle cx="' + X(r.before) + '" cy="' + y + '" r="5" fill="#fff" stroke="#C8561E" stroke-width="2"/>');
      if (r.after != null) s.push('<circle cx="' + X(r.after) + '" cy="' + y + '" r="5" fill="#5B45D6"/>');
      else s.push('<text x="' + (X(r.before || 0) + 10) + '" y="' + (y + 4) + '" font-size="9" fill="#8A6A00">DATA REQUIRED</text>');
    });
    return s.join('') + '</svg>';
  }
  /* FAIR scenario comparison: per row a P50→P95 band, P90 tick, Mean diamond, P50 circle (currency axis from 0). */
  function ranges(rows, opts) {
    opts = opts || {};
    var W = 640, lw = 150, row = 30, top = 8, H = top + rows.length * row + 48, iw = W - lw - 24;
    var max = Math.max.apply(null, rows.map(function (r) { return r.p95 || 0; }).concat([1]));
    var nice = C.charts.svg && C.charts.svg.niceMax ? C.charts.svg.niceMax(max) : max, X = function (v) { return lw + iw * v / nice; };
    var cur = function (v) { return C.util.format.currency(v, 'TWD', { compact: true }); };
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" class="c6r-svg" role="img" aria-label="' + esc(opts.label || 'FAIR scenario comparison') + '">'];
    for (var k = 0; k <= 4; k++) { var v = nice * k / 4; s.push('<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + top + '" y2="' + (top + rows.length * row) + '" stroke="#E2E2EA"/><text x="' + X(v) + '" y="' + (top + rows.length * row + 14) + '" font-size="9" text-anchor="middle" fill="#555">' + cur(v) + '</text>'); }
    rows.forEach(function (r, i) {
      var y = top + i * row + row / 2;
      s.push('<text x="' + (lw - 8) + '" y="' + (y + 4) + '" font-size="10" text-anchor="end" fill="#333">' + esc(r.label) + '</text>');
      s.push('<rect x="' + X(r.p50) + '" y="' + (y - 6) + '" width="' + Math.max(1, X(r.p95) - X(r.p50)) + '" height="12" fill="#DCD6FF" stroke="#8C7BFF"/>');
      s.push('<line x1="' + X(r.p90) + '" x2="' + X(r.p90) + '" y1="' + (y - 9) + '" y2="' + (y + 9) + '" stroke="#C8561E" stroke-width="2"/>');
      s.push('<circle cx="' + X(r.p50) + '" cy="' + y + '" r="4" fill="#fff" stroke="#3D2FA0" stroke-width="1.5"/>');
      s.push(marker('diamond', X(r.mean), y, 4.5, '#3D2FA0'));
    });
    var ly = top + rows.length * row + 32;
    s.push('<circle cx="' + lw + '" cy="' + (ly - 3) + '" r="4" fill="#fff" stroke="#3D2FA0" stroke-width="1.5"/><text x="' + (lw + 8) + '" y="' + ly + '" font-size="9" fill="#333">P50</text>');
    s.push(marker('diamond', lw + 52, ly - 3, 4.5, '#3D2FA0') + '<text x="' + (lw + 60) + '" y="' + ly + '" font-size="9" fill="#333">Mean (ALE)</text>');
    s.push('<line x1="' + (lw + 134) + '" x2="' + (lw + 134) + '" y1="' + (ly - 10) + '" y2="' + (ly + 3) + '" stroke="#C8561E" stroke-width="2"/><text x="' + (lw + 140) + '" y="' + ly + '" font-size="9" fill="#333">P90</text>');
    s.push('<rect x="' + (lw + 176) + '" y="' + (ly - 8) + '" width="18" height="10" fill="#DCD6FF" stroke="#8C7BFF"/><text x="' + (lw + 199) + '" y="' + ly + '" font-size="9" fill="#333">P50–P95 區間</text>');
    return s.join('') + '</svg>';
  }
  function histogram(h, summary) {
    var W = 640, H = 200, m = { l: 40, r: 10, t: 10, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b, max = Math.max.apply(null, h.counts), bw = iw / h.counts.length;
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" class="c6r-svg" role="img" aria-label="Annual risk distribution">'];
    h.counts.forEach(function (c, i) { var bh = ih * c / max; s.push('<rect x="' + (m.l + i * bw + 1) + '" y="' + (m.t + ih - bh) + '" width="' + (bw - 2) + '" height="' + bh + '" fill="#8C7BFF"/>'); });
    var X = function (v) { return m.l + iw * (v - h.lo) / (h.hi - h.lo); };
    [['P50', summary.P50], ['P90', summary.P90], ['P95', summary.P95]].forEach(function (p) {
      if (p[1] > h.hi) return;
      s.push('<line x1="' + X(p[1]) + '" x2="' + X(p[1]) + '" y1="' + m.t + '" y2="' + (m.t + ih) + '" stroke="#222" stroke-dasharray="3 3"/><text x="' + (X(p[1]) + 3) + '" y="' + (m.t + 10) + '" font-size="9" fill="#222">' + p[0] + '</text>');
    });
    for (var k = 0; k <= 4; k++) { var v = h.lo + (h.hi - h.lo) * k / 4; s.push('<text x="' + X(v) + '" y="' + (H - 10) + '" font-size="9" text-anchor="middle" fill="#555">' + C.util.format.currency(v, 'TWD', { compact: true }) + '</text>'); }
    return s.join('') + '</svg>';
  }
  function exceedance(pts) {
    var W = 640, H = 200, m = { l: 40, r: 10, t: 10, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b, hi = pts[pts.length - 1].x, lo = pts[0].x;
    var X = function (v) { return m.l + iw * (v - lo) / (hi - lo || 1); }, Y = function (p) { return m.t + ih * (1 - p); };
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.p).toFixed(1); }).join(' ');
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" class="c6r-svg" role="img" aria-label="Loss exceedance curve"><path d="' + d + '" fill="none" stroke="#5B45D6" stroke-width="2"/>'];
    [0, 0.25, 0.5, 0.75, 1].forEach(function (p) { s.push('<text x="' + (m.l - 4) + '" y="' + (Y(p) + 3) + '" font-size="9" text-anchor="end" fill="#555">' + Math.round(p * 100) + '%</text>'); });
    for (var k = 0; k <= 4; k++) { var v = lo + (hi - lo) * k / 4; s.push('<text x="' + X(v) + '" y="' + (H - 10) + '" font-size="9" text-anchor="middle" fill="#555">' + C.util.format.currency(v, 'TWD', { compact: true }) + '</text>'); }
    return s.join('') + '</svg>';
  }
  C.charts.report = { ranges: ranges, matrix: matrix, hbars: hbars, compare: compare, histogram: histogram, exceedance: exceedance, SEV: SEV };
})(globalThis.CAT6);
