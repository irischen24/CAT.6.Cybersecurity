/* FAIR charts: Annual Risk Distribution Histogram + Annual Loss Exceedance Curve.
 * Both mark P50 / P90 / P95 with labeled lines (text, not color alone). */
(function (C) {
  var S = C.charts.svg, F = C.util.format;
  function markers(svg, xs, H, m, sum) {
    [['P50', sum.P50, '#B9A6FF'], ['P90', sum.P90, '#E0864E'], ['P95', sum.P95, '#E5566B']].forEach(function (p, i) {
      var x = xs(p[1]); if (x == null) return;
      S.el('line', { x1: x, x2: x, y1: m.t, y2: H - m.b, stroke: p[2], 'stroke-dasharray': '4 4', 'stroke-width': 1.5 }, svg);
      S.text(svg, x + 4, m.t + 12 + i * 14, p[0] + ' ' + F.currency(p[1], 'TWD', { compact: true }), { fill: p[2], 'font-size': 10, 'font-weight': 600 });
    });
  }
  function histogram(container, h, sum) {
    S.mount(container, function (box, W) {
      var H = 280, m = { t: 12, r: 12, b: 40, l: 44 };
      var svg = S.el('svg', { class: 'c6-chart', width: W, height: H, role: 'img', 'aria-label': 'Annual Risk 分布直方圖' }, box);
      var iw = W - m.l - m.r, ih = H - m.t - m.b, maxC = Math.max.apply(null, h.counts);
      var xs = function (v) { return v < h.lo || v > h.hi ? null : m.l + ((v - h.lo) / (h.hi - h.lo)) * iw; };
      var bw = iw / h.counts.length;
      [0, 0.5, 1].forEach(function (f) {
        var y = m.t + ih - f * ih;
        S.el('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: 'rgba(255,255,255,0.06)' }, svg);
        S.text(svg, m.l - 6, y + 4, (f * maxC / h.n * 100).toFixed(1) + '%', { 'text-anchor': 'end', 'font-size': 10 });
      });
      h.counts.forEach(function (c, i) {
        var bh = (c / maxC) * ih, x = m.l + i * bw;
        var lo = h.lo + i * h.width, hi = lo + h.width;
        var r = S.el('rect', { x: x + 0.75, y: m.t + ih - bh, width: Math.max(1, bw - 1.5), height: bh, rx: 2, fill: 'rgba(124,92,252,0.55)' }, svg);
        S.interactive(r, F.currency(lo, 'TWD', { compact: true }) + ' – ' + F.currency(hi, 'TWD', { compact: true }) + '<br>' + (c / h.n * 100).toFixed(2) + '% 的模擬年度');
      });
      var ticks = 4;
      for (var t = 0; t <= ticks; t++) {
        var v = h.lo + (h.hi - h.lo) * t / ticks;
        S.text(svg, m.l + iw * t / ticks, H - m.b + 16, F.currency(v, 'TWD', { compact: true }), { 'text-anchor': t === 0 ? 'start' : t === ticks ? 'end' : 'middle', 'font-size': 10 });
      }
      S.text(svg, m.l + iw / 2, H - 4, '年度損失 Annual Risk (NT$)', { 'text-anchor': 'middle', 'font-size': 10 });
      markers(svg, xs, H, m, sum);
    });
  }
  function exceedance(container, pts, sum) {
    S.mount(container, function (box, W) {
      var H = 280, m = { t: 12, r: 12, b: 40, l: 44 };
      var svg = S.el('svg', { class: 'c6-chart', width: W, height: H, role: 'img', 'aria-label': 'Annual Loss Exceedance Curve' }, box);
      var iw = W - m.l - m.r, ih = H - m.t - m.b, x0 = 0, xmax = pts[pts.length - 1].x, step = S.niceMax(xmax / 5), x1 = Math.ceil(xmax / step) * step;
      var xs = function (v) { return m.l + ((v - x0) / (x1 - x0)) * iw; }, ys = function (p) { return m.t + ih - p * ih; };
      [0, .25, .5, .75, 1].forEach(function (p) {
        S.el('line', { x1: m.l, x2: W - m.r, y1: ys(p), y2: ys(p), stroke: 'rgba(255,255,255,0.06)' }, svg);
        S.text(svg, m.l - 6, ys(p) + 4, (p * 100) + '%', { 'text-anchor': 'end', 'font-size': 10 });
      });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + xs(p.x) + ' ' + ys(p.p); }).join(' ');
      S.el('path', { d: d, fill: 'none', stroke: '#9B87FF', 'stroke-width': 2.25 }, svg);
      for (var t = 0; t <= 4; t++) S.text(svg, m.l + iw * t / 4, H - m.b + 16, C.util.format.currency(x1 * t / 4, 'TWD', { compact: true }), { 'text-anchor': t === 0 ? 'start' : t === 4 ? 'end' : 'middle', 'font-size': 10 });
      S.text(svg, m.l + iw / 2, H - 4, '年度損失超過此金額的機率', { 'text-anchor': 'middle', 'font-size': 10 });
      pts.filter(function (_, i) { return i % 6 === 0; }).forEach(function (p) {
        var c = S.el('circle', { cx: xs(p.x), cy: ys(p.p), r: 5, fill: 'transparent' }, svg);
        S.interactive(c, '年度損失 > ' + C.util.format.currency(p.x, 'TWD', { compact: true }) + '<br>機率 ' + (p.p * 100).toFixed(1) + '%');
      });
      markers(svg, xs, H, m, sum);
    });
  }
  C.charts.fair = { histogram: histogram, exceedance: exceedance };
})(globalThis.CAT6);
