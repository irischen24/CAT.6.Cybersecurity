/* Reusable CAT.6 Brand component — the single place that renders the logo.
 *   C.ui.brand.mark(cls)            square symbol (img when assets.mark is set, else the existing SVG mark)
 *   C.ui.brand.lockup({ cls, text }) symbol + wordmark for nav bars / headers (uses assets.horizontal when set)
 *   C.ui.brand.logo(cls)            full logo for cover pages (assets.logo, else mark + wordmark)
 *   C.ui.brand.url(path)            resolves a root-relative asset path from any page depth (/, /app/, /trust/…)
 *   C.ui.brand.favicon()            installs <link rel="icon"> (assets.favicon, else an SVG data URI of the mark)
 * Images keep their aspect ratio (height fixed, width auto, object-fit: contain) and are never stretched. */
(function (C) {
  var script = document.currentScript, ROOT = script ? new URL('../../', script.src).href : '';
  var B = function () { return C.data.brand || { name: 'CAT.6 Cybersecurity', short: 'CAT.6', assets: {} }; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function url(p) { return p ? new URL(p, ROOT || location.href).href : ''; }
  function svgMark(cls) { return C.ui.icons && C.ui.icons.mark ? C.ui.icons.mark(cls) : ''; }
  function img(path, cls, alt) { return '<img class="c6-brand-img ' + (cls || '') + '" src="' + esc(url(path)) + '" alt="' + esc(alt || '') + '" decoding="async">'; }
  function mark(cls) { var a = B().assets || {}; return a.mark ? img(a.mark, cls, '') : svgMark(cls); }
  function lockup(o) {
    o = o || {}; var a = B().assets || {}, name = o.text || B().name;
    if (a.horizontal) return '<span class="c6-brand-lockup ' + (o.cls || '') + '">' + img(a.horizontal, 'c6-brand-lockup__img', name) + '</span>';
    return '<span class="c6-brand-lockup ' + (o.cls || '') + '">' + mark('c6-brand-lockup__mark') + '<span class="c6-brand-lockup__text">' + esc(name) + '</span></span>';
  }
  function logo(cls) { var a = B().assets || {}; return a.logo ? img(a.logo, cls, B().name) : lockup({ cls: cls }); }
  function favicon() {
    var a = B().assets || {}, href = a.favicon ? url(a.favicon) : 'data:image/svg+xml,' + encodeURIComponent(svgMark('').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/class="[^"]*"/, ''));
    var l = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }));
    l.href = href; if (a.favicon) l.type = 'image/png';
  }
  C.ui.brand = { mark: mark, lockup: lockup, logo: logo, url: url, favicon: favicon, root: function () { return ROOT; }, official: function () { var a = B().assets || {}; return !!(a.mark || a.horizontal || a.logo); } };
  if (document.head) favicon();
})(globalThis.CAT6);
