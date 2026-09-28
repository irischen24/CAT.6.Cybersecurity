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

  /* Identity metadata: finalized reports carry report.meta (frozen in the canonical artifact); drafts get a
   * DRAFT identity with the chosen classification and no Report ID. */
  function metaOf(report) {
    var m = report.meta || {};
    return {
      draft: !m.reportId, reportId: m.reportId || null, reportUuid: m.reportUuid || null, reportVersion: m.reportVersion || null,
      classification: m.classification || report.classification || 'CONFIDENTIAL', organization: m.organization || (report.assessment && report.assessment.organization) || '',
      assessmentName: m.assessmentName || (report.assessment && report.assessment.name) || '', generatedBy: m.generatedBy || report.generatedBy || '',
      generatedAtLocal: m.generatedAtLocal || (C.services.reportIntegrity ? C.services.reportIntegrity.localStamp(report.generatedAt) : report.generatedAt), platform: 'CAT.6 Cybersecurity'
    };
  }
  function clsTone(c) { return { 'TOP SECRET': 'ts', CONFIDENTIAL: 'conf', 'INTERNAL ONLY': 'int', PUBLIC: 'pub' }[c] || 'conf'; }
  function clsBadge(c) { return '<span class="c6r-cls c6r-cls--' + clsTone(c) + '">' + esc(c) + '</span>'; }

  /* @page rules are generated per report: header = CAT.6 · organization · classification,
   * footer = classification + Report ID · Page X of Y · CAT.6 Cybersecurity. Cover page: no running header / footer
   * (its identity block already shows all of it), but it is counted in "of Y". */
  function pageCss(report) {
    var q = function (s) { return '"' + String(s).replace(/["\\]/g, '').replace(/\n/g, ' ') + '"'; }, m = metaOf(report);
    var clsLine = m.classification;
    var idLine = m.draft ? 'DRAFT — NOT FINALIZED' : m.reportId + ' v' + m.reportVersion;
    var f = function (w) { return 'font: ' + (w || 400) + ' 7.5pt/1.2 system-ui, sans-serif;'; };
    var boxes = ' @top-left { content: "CAT.6 Cybersecurity"; ' + f(600) + ' color: #4B3FB8; }' +
      ' @top-center { content: ' + q(m.organization) + '; ' + f() + ' color: #555; }' +
      ' @top-right { content: ' + q(m.classification) + '; ' + f(700) + ' color: ' + (m.classification === 'PUBLIC' ? '#2F6B3A' : '#8A1C2B') + '; letter-spacing: .06em; }' +
      ' @bottom-left { content: ' + q(clsLine + ' · ' + idLine) + '; ' + f(600) + ' color: #444; }' +
      ' @bottom-center { content: "Page " counter(page) " of " counter(pages); ' + f() + ' color: #333; }' +
      ' @bottom-right { content: "CAT.6 Cybersecurity"; ' + f() + ' color: #666; }';
    /* Wide registers print on A4 landscape pages (named page "wide") so 15+ columns stay legible. */
    return '@page wide { size: A4 landscape; margin: 18mm 12mm 16mm 12mm;' + boxes + ' } ' +
      '@page { size: A4 portrait; margin: 20mm 14mm 18mm 14mm;' + boxes + ' }' +
      ' @page :first { @top-left { content: none; } @top-center { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-center { content: none; } @bottom-right { content: none; } }';
  }

  /* Logo from the shared Brand component (official asset when installed, else the existing CAT.6 mark). */
  function brandMark() { return C.ui && C.ui.brand ? C.ui.brand.mark('c6r-logo') : '<svg class="c6r-logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2l12 7v14l-12 7-12-7V9z" fill="#4B3FB8"/><path d="M16 9l6 3.5v7L16 23l-6-3.5v-7z" fill="#fff"/></svg>'; }
  function identityBlock(report, m) {
    var rows = [['Platform', m.platform], ['Organization 組織', m.organization || 'DATA REQUIRED'], ['Assessment 評估', m.assessmentName || 'DATA REQUIRED'],
      ['Report Type 報告類型', report.title + ' · ' + report.subtitle], ['Report ID', m.draft ? 'DRAFT — 未定稿（定稿後產生）' : m.reportId], ['Version', m.draft ? '—' : m.reportVersion],
      ['Classification', m.classification], ['Generated By', m.generatedBy || '—'], ['Generated At', m.generatedAtLocal]];
    return '<div class="c6r-id">' +
      '<div class="c6r-id__top"><div class="c6r-brand">' + brandMark() + '<span>CAT.6 CYBERSECURITY</span></div>' + clsBadge(m.classification) + '</div>' +
      '<p class="c6r-eyebrow">' + esc(report.subtitle) + '</p><h1 class="c6r-title">' + esc(report.title) + '</h1>' +
      (m.draft ? '<p class="c6r-draft">DRAFT — NOT FINALIZED · 草稿預覽：尚未定稿、無 Report ID、未計算 SHA-256，不可作為正式文件</p>' : '') +
      '<dl class="c6r-kv c6r-kv--id">' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + (r[0] === 'Classification' ? clsBadge(r[1]) : cell(r[1], {})) + '</dd></div>'; }).join('') + '</dl></div>';
  }

  /* Final verification page — rendered from the registry record, outside the hashed content. */
  function verificationPage(report, m) {
    var rec = report.record, RI = C.services.reportIntegrity;
    if (m.draft || !rec) return '<section class="c6r-sec c6r-sec--verification" id="r-verification"><h2 class="c6r-h2"><span class="c6r-h2__n">✓</span>Report Verification 報告驗證</h2>' +
      '<p class="c6r-callout c6r-callout--warn"><strong>⚠ </strong>草稿（DRAFT）沒有 Report ID、SHA-256、驗證 QR Code 與登錄紀錄。請於 Report Center 按「定稿並登錄」產生正式報告。</p></section>';
    var url = RI.verifyUrl(m), sig = rec.signature || {}, ts = rec.timestamp || {}, local = rec.registry !== 'SUPABASE';
    var row = function (k, v, cls) { return '<tr><th scope="row">' + esc(k) + '</th><td' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</td></tr>'; };
    return '<section class="c6r-sec c6r-sec--verification" id="r-verification"><h2 class="c6r-h2"><span class="c6r-h2__n">✓</span>Report Verification 報告驗證</h2>' +
      '<div class="c6r-verify"><div class="c6r-verify__qr">' + C.services.qr.svg(url, { label: 'Verification URL QR code' }) + '<p>掃描開啟 CAT.6 Verification Page</p></div>' +
      '<table class="c6r-vt"><tbody>' +
        row('Report ID', esc(m.reportId)) + row('Report UUID', esc(m.reportUuid), 'c6r-mono') + row('Version', esc(m.reportVersion)) + row('Classification', clsBadge(m.classification)) +
        row('Generated At', esc(m.generatedAtLocal)) + row('Verification URL', esc(url), 'c6r-mono c6r-break') +
        row('SHA-256', esc(rec.sha256), 'c6r-mono c6r-break') + row('Hash scope', '整份報告內容與身分資料的 canonical JSON（' + esc(rec.hashScope) + '）；不含本驗證頁。Manifest 可由 Report Center 下載後自行重算。') +
      '</tbody></table></div>' +
      '<div class="c6r-grid2">' +
        '<div class="c6r-box"><h3 class="c6r-h3">Digital Signature 數位簽章</h3><table class="c6r-vt"><tbody>' +
          row('Signature Status', '<strong>' + esc(sig.label || 'NOT SIGNED — REQUIRES BACKEND') + '</strong>') + row('Signer', esc(sig.signer || '—')) + row('Organization', esc(sig.organization || '—')) +
          row('Certificate Serial', esc(sig.certificateSerial || '—'), 'c6r-mono') + row('Signing Time', esc(sig.signingTime || '—')) + row('Algorithm', esc(sig.algorithm || '—')) + row('Certificate Status', esc(sig.certificateStatus || 'N/A')) +
        '</tbody></table></div>' +
        '<div class="c6r-box"><h3 class="c6r-h3">Trusted Timestamp 可信時戳</h3><table class="c6r-vt"><tbody>' +
          row('Timestamp', esc(ts.genTime || m.generatedAtLocal) + (ts.genTime ? '' : ' <span class="c6r-muted">（用戶端時鐘，非可信時間）</span>')) + row('Timestamp Standard', 'RFC 3161') +
          row('Timestamp Authority', esc(ts.tsa || '— (not connected)')) + row('Token / Serial', esc(ts.serial || (ts.token ? String(ts.token).slice(0, 24) + '…' : '—')), 'c6r-mono') +
          row('Status', '<strong>' + esc(ts.label || 'DEMO / TSA NOT CONNECTED') + '</strong>') +
        '</tbody></table></div>' +
      '</div>' +
      '<div class="c6r-seal"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="#8C7BFF" stroke-width="3" stroke-dasharray="4 3"/><circle cx="60" cy="60" r="44" fill="none" stroke="#8C7BFF" stroke-width="1.5"/>' +
        '<text x="60" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#4B3FB8">CAT.6</text><text x="60" y="66" text-anchor="middle" font-size="8" fill="#4B3FB8">VISUAL SEAL</text><text x="60" y="78" text-anchor="middle" font-size="7" fill="#8A1C2B">DEMO ONLY</text></svg>' +
        '<p><strong>DEMO / VISUAL SEAL ONLY</strong> — 此圖章僅為視覺標記，<strong>不是數位簽章或電子印章</strong>，不具任何法律或密碼學效力。報告真偽請以 Verification Page 的 SHA-256 比對為準。</p></div>' +
      '<p class="c6r-callout' + (local ? ' c6r-callout--warn' : '') + '"><strong>' + (local ? '⚠ ' : 'ⓘ ') + '</strong>Registry：' + (local ? 'LOCAL DEMO REGISTRY — 登錄紀錄保存在產生報告的瀏覽器中，只能在同一瀏覽器驗證，不是獨立的第三方驗證。正式驗證需部署 Supabase Report Registry（PRODUCTION REQUIREMENT）。' : 'Supabase Report Registry（組織資料庫）。') + '</p>' +
      '</section>';
  }

  function render(report) {
    var n = 0, secs = report.sections.filter(function (s) { return s.status !== 'NOT_APPLICABLE' && s.id !== 'cover' && s.id !== 'verification'; });
    var cover = report.sections.filter(function (s) { return s.id === 'cover'; })[0], m = metaOf(report);
    var html = '<article class="c6r" lang="zh-Hant-TW" aria-label="' + esc(report.title) + '">' +
      '<section class="c6r-cover">' + identityBlock(report, m) +
        (cover ? cover.blocks.map(block).join('') : '') +
        '<nav class="c6r-toc" aria-label="目錄"><h2>Contents 目錄</h2><ol>' + secs.map(function (s) { return '<li><span>' + esc(s.title) + '</span>' + (s.status === 'PARTIAL' ? '<em class="c6r-dr">含 DATA REQUIRED</em>' : '') + '</li>'; }).join('') + '<li><span>Report Verification 報告驗證</span></li></ol></nav>' +
      '</section>';
    secs.forEach(function (s) {
      n++;
      html += '<section class="c6r-sec c6r-sec--' + s.id + '" id="r-' + s.id + '"><h2 class="c6r-h2"><span class="c6r-h2__n">' + n + '</span>' + esc(s.title) + '</h2>' + s.blocks.map(block).join('') + '</section>';
    });
    html += verificationPage(report, m);
    html += '<footer class="c6r-end">— End of report · ' + esc(m.draft ? 'DRAFT' : m.reportId + ' v' + m.reportVersion) + ' · ' + esc(m.classification) + ' · CAT.6 Cybersecurity —</footer></article>';
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
    var mm = metaOf(report);
    document.title = mm.draft ? 'CAT6_DRAFT_' + report.type + '_' + (report.generatedAt || '').slice(0, 10) : mm.reportId + '_v' + mm.reportVersion + '_' + report.type;
    document.documentElement.classList.add('c6-printing');
    var done = function () { document.documentElement.classList.remove('c6-printing'); document.title = prevTitle; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }

  C.services.reportRenderer = { render: render, pageCss: pageCss, print: print, block: block, metaOf: metaOf };
})(globalThis.CAT6);
