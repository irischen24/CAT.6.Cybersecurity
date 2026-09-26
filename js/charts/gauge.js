/* Semicircle progress gauge (reference: "Performance Status"). Value shown as text in the middle. */
(function (C) {
  var S = C.charts.svg;
  function arc(cx, cy, r, a0, a1) {
    var p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    return 'M' + p0[0] + ' ' + p0[1] + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1];
  }
  function render(container, ratio, opts) {
    S.mount(container, function (box, W) {
      var w = Math.min(W, 300), H = w * 0.62, cx = w / 2, cy = H - 12, r = w * 0.38;
      var svg = S.el('svg', { class: 'c6-chart', width: w, height: H, style: 'margin-inline:auto', role: 'img', 'aria-label': opts.label + '：' + Math.round(ratio * 100) + '%' }, box);
      S.el('path', { d: arc(cx, cy, r, Math.PI, 2 * Math.PI), stroke: 'rgba(255,255,255,0.08)', 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round' }, svg);
      if (ratio > 0) S.el('path', { d: arc(cx, cy, r, Math.PI, Math.PI + Math.PI * Math.min(ratio, 0.999)), stroke: '#8B6EFF', 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round' }, svg);
      S.text(svg, cx, cy - 14, Math.round(ratio * 100) + '%', { 'text-anchor': 'middle', fill: '#EDEDEF', 'font-size': 28, 'font-weight': 600 });
      S.text(svg, cx, cy + 4, opts.caption, { 'text-anchor': 'middle', 'font-size': 11 });
    });
  }
  C.charts.gauge = { render: render };
})(globalThis.CAT6);
