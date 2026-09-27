/* Horizontal bar charts (SVG, resize-aware):
 *  bars()     one value per row (coverage, readiness areas). Missing value → "DATA REQUIRED" text, never a 0 bar.
 *  compare()  before → after per row (inherent vs residual risk, current vs target profile).
 * Every chart also exposes a text summary via the caller (c6-chart-summary). */
(function (C) {
  var S = C.charts.svg;
  function labelW(W) { return W < 420 ? 96 : 150; }
  function bars(container, items, opts) {
    opts = opts || {};
    S.mount(container, function (box, W) {
      var row = 30, lw = labelW(W), vw = 64, H = items.length * row + 20, max = opts.max || 1;
      var svg = S.el('svg', { class: 'c6-chart', width: W, height: H, role: 'img', 'aria-label': opts.label || '' }, box);
      var x0 = lw, iw = W - lw - vw;
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) { S.el('line', { x1: x0 + iw * t, x2: x0 + iw * t, y1: 4, y2: H - 16, stroke: 'rgba(255,255,255,0.06)' }, svg); });
      items.forEach(function (it, i) {
        var y = 8 + i * row, lbl = S.text(svg, lw - 8, y + 14, it.label, { 'text-anchor': 'end', 'font-size': 11, fill: '#C9CCD3' });
        if (it.label.length > (lw < 120 ? 12 : 22)) { lbl.textContent = it.label.slice(0, lw < 120 ? 11 : 21) + '…'; S.el('title', {}, lbl).textContent = it.label; }
        S.el('rect', { x: x0, y: y + 4, width: iw, height: 14, rx: 7, fill: 'rgba(255,255,255,0.05)' }, svg);
        if (it.value == null) { S.text(svg, x0 + 8, y + 15, 'DATA REQUIRED', { 'font-size': 10, fill: '#D9B45A', 'font-family': 'ui-monospace, monospace' }); return; }
        var w = Math.max(2, iw * Math.min(1, it.value / max));
        var r = S.el('rect', { x: x0, y: y + 4, width: w, height: 14, rx: 7, fill: it.color || (opts.hatch ? 'url(#c6-hb-hatch)' : '#7C5CFC') }, svg);
        if (it.tip) S.interactive(r, it.tip);
        S.text(svg, W - vw + 8, y + 15, it.text != null ? it.text : Math.round(it.value / max * 100) + '%', { 'font-size': 11, fill: '#EDEDEF', 'font-weight': 600 });
      });
    });
  }
  /* items: { label, before, after, tipBefore, tipAfter } on a 0..max scale. before = hollow ring, after = solid dot. */
  function compare(container, items, opts) {
    opts = opts || {};
    S.mount(container, function (box, W) {
      var row = 32, lw = labelW(W), H = items.length * row + 36, max = opts.max || 25, x0 = lw, iw = W - lw - 24;
      var svg = S.el('svg', { class: 'c6-chart', width: W, height: H, role: 'img', 'aria-label': opts.label || '' }, box);
      var X = function (v) { return x0 + iw * (v / max); };
      (opts.ticks || [0, 5, 10, 15, 20, 25]).forEach(function (t) {
        S.el('line', { x1: X(t), x2: X(t), y1: 4, y2: H - 26, stroke: 'rgba(255,255,255,0.06)' }, svg);
        S.text(svg, X(t), H - 12, t, { 'text-anchor': 'middle', 'font-size': 10 });
      });
      (opts.bands || []).forEach(function (b) { S.el('rect', { x: X(b.from), y: 4, width: X(b.to) - X(b.from), height: H - 30, fill: b.fill }, svg); });
      items.forEach(function (it, i) {
        var y = 10 + i * row + 8;
        var lbl = S.text(svg, lw - 8, y + 4, it.label, { 'text-anchor': 'end', 'font-size': 11, fill: '#C9CCD3' });
        if (it.label.length > 16) { lbl.textContent = it.label.slice(0, 15) + '…'; S.el('title', {}, lbl).textContent = it.label; }
        if (it.before != null && it.after != null) S.el('line', { x1: X(it.before), x2: X(it.after), y1: y, y2: y, stroke: 'rgba(185,166,255,0.55)', 'stroke-width': 3 }, svg);
        if (it.before != null) { var b = S.el('circle', { cx: X(it.before), cy: y, r: 6, fill: '#0A0A0C', stroke: '#E0864E', 'stroke-width': 2 }, svg); if (it.tipBefore) S.interactive(b, it.tipBefore); }
        if (it.after != null) { var a = S.el('circle', { cx: X(it.after), cy: y, r: 6, fill: '#8B6EFF' }, svg); if (it.tipAfter) S.interactive(a, it.tipAfter); }
        if (it.after == null) S.text(svg, X(it.before || 0) + 12, y + 4, opts.missing || 'DATA REQUIRED', { 'font-size': 10, fill: '#D9B45A' });
      });
    });
  }
  C.charts.hbars = { bars: bars, compare: compare };
})(globalThis.CAT6);
