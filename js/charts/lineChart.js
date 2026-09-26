/* Area/line trend chart (low motion: a single stroke reveal). */
(function (C) {
  var S = C.charts.svg;
  function render(container, series, opts) {
    S.mount(container, function (box, W) {
      var H = opts.height || 200, m = { t: 18, r: 14, b: 28, l: 28 };
      var svg = S.el('svg', { class: 'c6-chart', width: W, height: H, role: 'img', 'aria-label': opts.label }, box);
      var defs = S.el('defs', {}, svg), g = S.el('linearGradient', { id: 'c6-area', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      S.el('stop', { offset: '0%', 'stop-color': 'rgba(124,92,252,0.45)' }, g); S.el('stop', { offset: '100%', 'stop-color': 'rgba(124,92,252,0)' }, g);
      var iw = W - m.l - m.r, ih = H - m.t - m.b, max = S.niceMax(Math.max.apply(null, series.values) * 1.2);
      var x = function (i) { return m.l + (i / (series.values.length - 1)) * iw; };
      var y = function (v) { return m.t + ih - (v / max) * ih; };
      [0, max / 2, max].forEach(function (t) {
        S.el('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), stroke: 'rgba(255,255,255,0.06)' }, svg);
        S.text(svg, m.l - 8, y(t) + 4, t, { 'text-anchor': 'end', 'font-size': 10 });
      });
      var d = series.values.map(function (v, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(v); }).join(' ');
      S.el('path', { d: d + ' L' + x(series.values.length - 1) + ' ' + (m.t + ih) + ' L' + m.l + ' ' + (m.t + ih) + ' Z', fill: 'url(#c6-area)' }, svg);
      var line = S.el('path', { d: d, fill: 'none', stroke: '#9B87FF', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches && line.getTotalLength) {
        var L = line.getTotalLength(); line.style.strokeDasharray = L; line.style.strokeDashoffset = L;
        line.getBoundingClientRect(); line.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)'; line.style.strokeDashoffset = 0;
      }
      series.values.forEach(function (v, i) {
        var c = S.el('circle', { cx: x(i), cy: y(v), r: 4.5, fill: '#050506', stroke: '#B9A6FF', 'stroke-width': 2 }, svg);
        S.interactive(c, '<strong>' + series.labels[i] + '</strong><br>' + opts.seriesName + '：' + v);
        S.text(svg, x(i), H - 8, series.labels[i], { 'text-anchor': i === 0 ? 'start' : i === series.values.length - 1 ? 'end' : 'middle', 'font-size': 10 });
      });
    });
  }
  C.charts.line = { render: render };
})(globalThis.CAT6);
