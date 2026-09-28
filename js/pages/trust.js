/* CAT.6 Trust Center (/trust/). Renders every compliance record from data/compliance.js.
 * ?doc=<Document ID> (from a demo document's QR) → states plainly that the ID belongs to a SAMPLE document. */
(function (C) {
  var CP = C.data.compliance, I = C.ui.icons, B = C.ui.brand;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  document.querySelectorAll('[data-brand]').forEach(function (n) { n.innerHTML = B.lockup(); });
  var TYPE = { CERTIFICATION: 'Certification（ISO 管理系統驗證）', ASSESSMENT: 'Security Assessment（安全測試，非認證）', ATTESTATION_REPORT: 'Attestation / Examination Report（檢查報告，非證書）' };
  document.getElementById('items').innerHTML = CP.items.map(function (it) {
    var rows = [['Status', CP.badges(it).map(function (b) { return '<span class="c6-tbadge c6-tbadge--' + b.toLowerCase() + '">' + b + '</span>'; }).join(' ') + ' <span class="c6-tmono">' + esc(it.statusLabel) + '</span>'],
      ['Type', esc(TYPE[it.type] || it.type)], ['Scope', esc(it.scope)], ['Issuer', it.issuer ? esc(it.issuer) : '— 尚無（未由任何機構核發 / 執行）'],
      ['Issue / Expiry', it.issueDate ? esc(it.issueDate + ' / ' + (it.expiryDate || '—')) : '— 不適用（示範）'], ['Last Updated', esc(it.lastUpdated)]];
    return '<article class="c6-titem" id="' + it.id + '" tabindex="-1"><div class="c6-titem__head"><div class="c6-trust__icon" aria-hidden="true">' + I.icon(it.icon) + '</div><div><h2 class="c6-titem__name">' + esc(it.name) + '</h2><p class="c6-titem__sub">' + esc(it.subtitle) + '</p></div></div>' +
      '<p class="c6-titem__desc">' + esc(it.description) + '</p><ul class="c6-titem__pts">' + it.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      '<dl class="c6-titem__kv">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="c6-titem__doc"><div><strong>Demo Document</strong>：' + esc(it.documentTitle) + '<br><span class="c6-tmono">' + esc(it.documentId) + '</span></div>' +
      '<div class="c6-titem__actions"><a class="c6-btn c6-btn--secondary" href="doc.html?id=' + it.id + '">View Demo Document</a><a class="c6-btn c6-btn--ghost" href="docs/' + esc(it.documentId) + '.pdf" download>PDF</a></div>' +
      '<p class="c6-tdisc">' + esc(CP.DISCLAIMER) + ' <span lang="zh-Hant-TW">示範文件，非正式認證／稽核文件。</span></p></div></article>';
  }).join('');
  var q = new URLSearchParams(location.search).get('doc');
  if (q) {
    var it = CP.items.filter(function (x) { return x.documentId === q; })[0], box = document.getElementById('lookup');
    box.innerHTML = it
      ? '<div class="c6-tlookup" role="status"><strong>SAMPLE DOCUMENT · DEMO ONLY</strong><p>' + esc(q) + ' 是 CAT.6 專題展示用的模擬文件（' + esc(it.documentTitle) + '）。它<strong>不是</strong>正式認證、稽核報告或安全測試結果；不存在對應的有效證書或報告。</p><a href="#' + it.id + '">查看此項目 →</a></div>'
      : '<div class="c6-tlookup c6-tlookup--bad" role="status"><strong>NOT FOUND</strong><p>查無文件編號 ' + esc(q) + '。CAT.6 目前只有示範文件，沒有任何正式證書或報告。</p></div>';
    if (it) { var el = document.getElementById(it.id); el.setAttribute('data-hl', 'true'); }
  }
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) { t.setAttribute('data-hl', 'true'); t.focus({ preventScroll: false }); } }
})(globalThis.CAT6);
