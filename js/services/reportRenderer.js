/* Report Renderer — Report Model → print-ready HTML (A4).
 * The PDF is produced by the browser's print engine from this HTML (window.print → "Save as PDF"):
 *   · @page A4 with running header / footer margin boxes and "page X / Y" counters
 *   · <thead> repeats on every page; rows and figures never split; long text wraps inside cells
 *   · charts are static SVG with a fixed viewBox scaled to the column width, so they are never clipped
 *   · provenance badges are printed as text (icon + code), so they survive greyscale printing
 * No screenshot of the dashboard is involved. */
(function (C) {
  var esc = function (v) { return C.util.dom.esc(v); };
  var PROV = { USER_INPUT: '✎', FILE_IMPORT: '⇪', CAT6_DEFAULT: '◇', CALCULATED: '∑' };
  var DR = 'DATA REQUIRED';

  function cell(v, col) {
    if (col.prov) return v ? '<span class="c6r-prov c6r-prov--' + esc(v) + '">' + (PROV[v] || '') + ' ' + esc(v === 'CAT6_DEFAULT' ? 'CAT6_DEFAULT' : v) + '</span>' : '—';
    if (v == null || v === '') return '—';
    var s = String(v);
    if (s.indexOf(DR) === 0) return '<span class="c6r-dr">' + esc(s) + '</span>';
    return esc(s);
  }
  function block(b) {
    switch (b.kind) {
      case 'h': return '<h3 class="c6r-h3">' + esc(b.text) + '</h3>';
      case 'p': return '<p>' + esc(b.text).replace(/DATA REQUIRED/g, '<span class="c6r-dr">DATA REQUIRED</span>') + '</p>';
      case 'callout': return '<p class="c6r-callout c6r-callout--' + b.tone + '"><strong>' + (b.tone === 'warn' ? '⚠ ' : 'ⓘ ') + '</strong>' + esc(b.text) + '</p>';
      case 'list': return '<ul class="c6r-list">' + b.items.map(function (i) { return '<li>' + esc(i).replace(/DATA REQUIRED/g, '<span class="c6r-dr">DATA REQUIRED</span>') + '</li>'; }).join('') + '</ul>';
      case 'kv': return '<dl class="c6r-kv">' + b.rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + cell(r[1], {}) + '</dd></div>'; }).join('') + '</dl>';
      case 'chart': return '<figure class="c6r-fig">' + b.svg + '<figcaption><strong>' + esc(b.caption) + '</strong>' + (b.summary ? '<span class="c6r-fig__sum">' + esc(b.summary) + '</span>' : '') + '</figcaption></figure>';
      case 'table':
        if (!b.rows.length) return '<p class="c6r-muted">' + esc(b.caption) + '：無資料</p>';
        /* The caption is a sibling paragraph kept with the table (a <caption> makes Chromium push the whole table to the next page). */
        return '<p class="c6r-cap">' + esc(b.caption) + '</p><table class="c6r-table' + (b.wide ? ' c6r-table--wide' : '') + '" aria-label="' + esc(b.caption) + '"><thead><tr>' +
          b.columns.map(function (c) { return '<th scope="col"' + (c.num ? ' class="c6r-num"' : '') + '>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          b.rows.map(function (r) { return '<tr>' + b.columns.map(function (c) { return '<td' + (c.num ? ' class="c6r-num"' : c.wrap ? ' class="c6r-wrap"' : /date|due|planned|^at$|^level$|^id$/i.test(c.key) ? ' class="c6r-nowrap"' : '') + '>' + cell(r[c.key], c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    }
    return '';
  }

  /* @page rules are generated per report so the running header carries the report title. */
  function pageCss(report) {
    var q = function (s) { return '"' + String(s).replace(/["\\]/g, '').replace(/\n/g, ' ') + '"'; };
    var org = report.assessment.organization || '';
    var boxes = ' @top-left { content: "CAT.6 Cybersecurity"; font: 600 8pt/1.2 system-ui, sans-serif; color: #4B3FB8; }' +
      ' @top-right { content: ' + q(report.title) + '; font: 8pt/1.2 system-ui, sans-serif; color: #555; }' +
      ' @bottom-left { content: ' + q(org + (report.defaultsUsed ? ' · Contains CAT.6 default / assumed values' : '')) + '; font: 7pt/1.2 system-ui, sans-serif; color: #666; }' +
      ' @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 8pt/1.2 system-ui, sans-serif; color: #333; }';
    /* Wide registers print on A4 landscape pages (named page "wide") so 15+ columns stay legible. */
    return '@page wide { size: A4 landscape; margin: 18mm 12mm 16mm 12mm;' + boxes + ' } ' +
      '@page { size: A4 portrait; margin: 20mm 14mm 18mm 14mm;' +
      ' @top-left { content: "CAT.6 Cybersecurity"; font: 600 8pt/1.2 system-ui, sans-serif; color: #4B3FB8; }' +
      ' @top-right { content: ' + q(report.title) + '; font: 8pt/1.2 system-ui, sans-serif; color: #555; }' +
      ' @bottom-left { content: ' + q(org + (report.defaultsUsed ? ' · Contains CAT.6 default / assumed values' : '')) + '; font: 7pt/1.2 system-ui, sans-serif; color: #666; }' +
      ' @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 8pt/1.2 system-ui, sans-serif; color: #333; } }' +
      ' @page :first { @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } }';
  }

  function render(report) {
    var n = 0, secs = report.sections.filter(function (s) { return s.status !== 'NOT_APPLICABLE' && s.id !== 'cover'; });
    var cover = report.sections.filter(function (s) { return s.id === 'cover'; })[0];
    var html = '<article class="c6r" lang="zh-Hant-TW" aria-label="' + esc(report.title) + '">' +
      '<section class="c6r-cover">' +
        '<div class="c6r-brand"><span class="c6r-brand__mark" aria-hidden="true">◆</span> CAT.6 Cybersecurity</div>' +
        '<p class="c6r-eyebrow">' + esc(report.subtitle) + '</p>' +
        '<h1 class="c6r-title">' + esc(report.title) + '</h1>' +
        (cover ? cover.blocks.map(block).join('') : '') +
        '<nav class="c6r-toc" aria-label="目錄"><h2>Contents 目錄</h2><ol>' + secs.map(function (s) { return '<li><span>' + esc(s.title) + '</span>' + (s.status === 'PARTIAL' ? '<em class="c6r-dr">含 DATA REQUIRED</em>' : '') + '</li>'; }).join('') + '</ol></nav>' +
      '</section>';
    secs.forEach(function (s) {
      n++;
      html += '<section class="c6r-sec c6r-sec--' + s.id + '" id="r-' + s.id + '"><h2 class="c6r-h2"><span class="c6r-h2__n">' + n + '</span>' + esc(s.title) + '</h2>' + s.blocks.map(block).join('') + '</section>';
    });
    html += '<footer class="c6r-end">— End of report · 產生於 ' + esc(report.generatedAt.replace('T', ' ').slice(0, 16)) + ' · CAT.6 Cybersecurity —</footer></article>';
    return html;
  }

  /* Print: mount into #c6-print-root, add the per-report @page style, call window.print, clean up afterwards. */
  function print(report, root) {
    root = root || document.getElementById('c6-print-root');
    var style = document.getElementById('c6r-page-style');
    if (!style) { style = document.createElement('style'); style.id = 'c6r-page-style'; document.head.appendChild(style); }
    style.textContent = '@media print {' + pageCss(report) + '}';
    root.innerHTML = render(report);
    var prevTitle = document.title;
    document.title = 'CAT6_' + report.type + '_' + (report.generatedAt || '').slice(0, 10);
    document.documentElement.classList.add('c6-printing');
    var done = function () { document.documentElement.classList.remove('c6-printing'); document.title = prevTitle; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }

  C.services.reportRenderer = { render: render, pageCss: pageCss, print: print, block: block };
})(globalThis.CAT6);
