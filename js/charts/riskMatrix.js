/* CAT.6 5×5 Risk Matrix. Severity is encoded by color + band text + marker shape + position. */
(function (C) {
  var S = C.charts.svg;
  var FILL = { LOW: 'rgba(111,183,166,0.16)', MEDIUM: 'rgba(217,180,90,0.16)', HIGH: 'rgba(224,134,78,0.20)', CRITICAL: 'rgba(229,86,107,0.24)' };
  var STROKE = { LOW: '#6FB7A6', MEDIUM: '#D9B45A', HIGH: '#E0864E', CRITICAL: '#E5566B' };
  function marker(parent, shape, cx, cy, r, color) {
    if (shape === 'circle') return S.el('circle', { cx: cx, cy: cy, r: r, fill: color }, parent);
    if (shape === 'square') return S.el('rect', { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, fill: color }, parent);
    if (shape === 'triangle') return S.el('path', { d: 'M' + cx + ' ' + (cy - r * 1.1) + ' L' + (cx + r * 1.1) + ' ' + (cy + r) + ' L' + (cx - r * 1.1) + ' ' + (cy + r) + ' Z', fill: color }, parent);
    return S.el('path', { d: 'M' + cx + ' ' + (cy - r * 1.25) + ' L' + (cx + r * 1.25) + ' ' + cy + ' L' + cx + ' ' + (cy + r * 1.25) + ' L' + (cx - r * 1.25) + ' ' + cy + ' Z', fill: color }, parent);
  }
  function render(container, register) {
    var RM = C.calc.riskMatrix;
    S.mount(container, function (box, W) {
      var size = Math.min(W, 420), m = { t: 8, r: 8, b: 40, l: 40 };
      var cell = (size - m.l - m.r) / 5, H = m.t + cell * 5 + m.b;
      var svg = S.el('svg', { class: 'c6-chart', width: size, height: H, role: 'img', 'aria-label': 'CAT.6 5×5 風險矩陣' }, box);
      for (var L = 1; L <= 5; L++) for (var I = 1; I <= 5; I++) {
        var a = RM.assess(L, I), x = m.l + (I - 1) * cell, y = m.t + (5 - L) * cell;
        S.el('rect', { x: x + 1.5, y: y + 1.5, width: cell - 3, height: cell - 3, rx: 6, fill: FILL[a.band.id], stroke: 'rgba(255,255,255,0.04)' }, svg);
        S.text(svg, x + 7, y + 15, a.score, { 'font-size': 10, fill: 'rgba(255,255,255,0.45)' });
      }
      for (var k = 1; k <= 5; k++) {
        S.text(svg, m.l + (k - 0.5) * cell, m.t + 5 * cell + 16, k, { 'text-anchor': 'middle' });
        S.text(svg, m.l - 12, m.t + (5 - k + 0.5) * cell + 4, k, { 'text-anchor': 'middle' });
      }
      S.text(svg, m.l + 2.5 * cell, H - 4, '衝擊 Impact →', { 'text-anchor': 'middle', 'font-size': 10 });
      var yl = S.text(svg, 10, m.t + 2.5 * cell, '可能性 Likelihood →', { 'text-anchor': 'middle', 'font-size': 10 });
      yl.setAttribute('transform', 'rotate(-90 10 ' + (m.t + 2.5 * cell) + ')');
      var occ = {};
      register.forEach(function (r) {
        var L = r.likelihood.value, I = r.impact.value, key = L + '-' + I, n = occ[key] = (occ[key] || 0) + 1;
        var a = RM.assess(L, I), cx = m.l + (I - 0.5) * cell + (n - 1) * 12 - 4, cy = m.t + (5 - L + 0.55) * cell;
        var g = S.el('g', {}, svg);
        marker(g, a.band.shape, cx, cy, 6, STROKE[a.band.id]);
        S.interactive(g, '<strong>' + r.id + '</strong> ' + r.name + '<br>L ' + L + ' × I ' + I + ' = ' + a.score + '（' + a.band.label + '）');
      });
    });
  }
  C.charts.riskMatrix = { render: render, marker: marker };
})(globalThis.CAT6);
