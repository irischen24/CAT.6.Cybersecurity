/* Tiny SVG helpers + shared tooltip + resize-aware rendering. Charts render at real pixel width
 * so text stays legible at 320px (no viewBox down-scaling of labels). */
(function (C) {
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, attrs) {
    var t = el('text', Object.assign({ x: x, y: y, fill: '#8A8F98', 'font-size': 11, 'font-family': 'Inter, system-ui, sans-serif' }, attrs || {}), parent);
    t.textContent = str; return t;
  }
  var tip;
  function tooltip() {
    if (!tip) { tip = document.createElement('div'); tip.className = 'c6-tooltip'; tip.setAttribute('role', 'status'); document.querySelector('.c6-root').appendChild(tip); }
    return {
      show: function (html, evt) {
        tip.innerHTML = html; tip.setAttribute('data-show', 'true');
        var x = evt.clientX + 14, y = evt.clientY + 14, w = tip.offsetWidth, h = tip.offsetHeight;
        if (x + w > innerWidth - 8) x = evt.clientX - w - 14;
        if (y + h > innerHeight - 8) y = evt.clientY - h - 14;
        tip.style.left = x + 'px'; tip.style.top = y + 'px';
      },
      hide: function () { tip.setAttribute('data-show', 'false'); }
    };
  }
  /* Bind hover + keyboard focus to the same tooltip content. */
  function interactive(node, html) {
    var t = tooltip();
    node.setAttribute('tabindex', '0');
    node.setAttribute('class', (node.getAttribute('class') || '') + ' c6-focus');
    node.addEventListener('pointermove', function (e) { t.show(html, e); });
    node.addEventListener('pointerleave', t.hide);
    node.addEventListener('focus', function () { var r = node.getBoundingClientRect(); t.show(html, { clientX: r.right, clientY: r.top }); });
    node.addEventListener('blur', t.hide);
  }
  function mount(container, render) {
    function draw() { container.innerHTML = ''; render(container, Math.max(260, container.clientWidth)); }
    draw();
    if ('ResizeObserver' in window) {
      var last = container.clientWidth;
      new ResizeObserver(function () { if (Math.abs(container.clientWidth - last) > 8) { last = container.clientWidth; draw(); } }).observe(container);
    }
  }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))); var m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  C.charts.svg = { el: el, text: text, interactive: interactive, mount: mount, niceMax: niceMax, tooltip: tooltip };
})(globalThis.CAT6);
