/* Hatched bar chart (pattern echoes the reference design and adds a non-color cue).
 * Used for CAT.6 5×5 risk scores per scenario, with the criteria bands drawn as horizontal guides. */
(function (C) {
  var S = C.charts.svg;
  function render(container, data, opts) {
    S.mount(container, function (box, W) {
      var narrow = W < 520, H = opts.height || 260, m = { t: 16, r: narrow ? 8 : 84, b: narrow ? 46 : 34, l: 30 };
      var svg = S.el('svg', { class: 'c6-chart', width: W, height: H, role: 'img', 'aria-label': opts.label }, box);
      var defs = S.el('defs', {}, svg);
      var pat = S.el('pattern', { id: 'c6-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      S.el('rect', { width: 6, height: 6, fill: 'rgba(124,92,252,0.18)' }, pat);
      S.el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: 'rgba(185,166,255,0.85)', 'stroke-width': 2 }, pat);
      var g = S.el('linearGradient', { id: 'c6-barhot', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      S.el('stop', { offset: '0%', 'stop-color': '#A855F7' }, g); S.el('stop', { offset: '100%', 'stop-color': '#5E6AD2' }, g);

      var iw = W - m.l - m.r, ih = H - m.t - m.b, max = opts.max || 25;
      var y = function (v) { return m.t + ih - (v / max) * ih; };
      (opts.guides || []).forEach(function (gd) {
        S.el('line', { x1: m.l, x2: W - m.r + 4, y1: y(gd.at), y2: y(gd.at), stroke: 'rgba(255,255,255,0.08)', 'stroke-dasharray': '3 4' }, svg);
        if (!narrow) S.text(svg, W - m.r + 8, y(gd.at) + 4, gd.label, { 'text-anchor': 'start', 'font-size': 10 });
      });
      [0, 5, 10, 15, 20, 25].forEach(function (t) { S.text(svg, m.l - 8, y(t) + 4, t, { 'text-anchor': 'end', 'font-size': 10 }); });
      var bw = iw / data.length, peak = Math.max.apply(null, data.map(function (d) { return d.value; }));
      data.forEach(function (d, i) {
        var x = m.l + i * bw + bw * 0.14, w = bw * 0.72, top = y(d.value);
        var r = S.el('rect', { x: x, y: top, width: w, height: m.t + ih - top, rx: 3,
          fill: d.value === peak ? 'url(#c6-barhot)' : 'url(#c6-hatch)', stroke: 'rgba(185,166,255,0.35)' }, svg);
        S.interactive(r, d.tip);
        S.text(svg, x + w / 2, top - 6, d.value, { 'text-anchor': 'middle', fill: '#EDEDEF', 'font-size': 11, 'font-weight': 600 });
        var lx = x + w / 2, ly = narrow ? H - 30 : H - 12;
        var lab = S.text(svg, lx, ly, d.label, { 'text-anchor': narrow ? 'end' : 'middle', 'font-size': 10 });
        if (narrow) lab.setAttribute('transform', 'rotate(-40 ' + lx + ' ' + ly + ')');
      });
      if (narrow && opts.guides) S.text(svg, m.l, H - 4, '虛線：' + opts.guides.map(function (g) { return g.label; }).join(' · '), { 'font-size': 10 });
    });
  }
  C.charts.bar = { render: render };
})(globalThis.CAT6);
