/* Demo document viewer (/trust/doc.html?id=iso27001). The whole document is one SVG with the SAMPLE / DEMO marks drawn
 * inside it (see js/services/demoDocs.js); this page only adds the toolbar, which is hidden when printing. */
(function (C) {
  var CP = C.data.compliance, D = C.services.demoDocs, id = new URLSearchParams(location.search).get('id');
  document.querySelectorAll('[data-brand]').forEach(function (n) { n.innerHTML = C.ui.brand.lockup(); });
  var it = CP.items.filter(function (x) { return x.id === id; })[0], box = document.getElementById('doc');
  if (!it) { box.innerHTML = '<p class="c6-tdisc">查無此示範文件。</p>'; document.getElementById('print').disabled = true; document.getElementById('pdf').remove(); return; }
  document.title = it.documentId + ' (SAMPLE) · CAT.6 Trust Center';
  document.getElementById('doc-h').textContent = it.documentTitle + ' — ' + it.documentId + '（SAMPLE / DEMO ONLY，非正式認證）';
  document.getElementById('disc').textContent = CP.DISCLAIMER + '　示範文件，非正式認證／稽核文件。';
  document.getElementById('back').href = './#' + it.id;
  document.getElementById('pdf').href = 'docs/' + it.documentId + '.pdf';
  box.innerHTML = D.svg(it.id, { base: new URL('./', location.href).href });
  document.getElementById('print').addEventListener('click', function () { window.print(); });
})(globalThis.CAT6);
