/* DOM + misc helpers shared by every page. */
(function (C) {
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(v) { return v == null ? '' : String(v).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var toastEl;
  function toast(msg, kind) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'c6-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.querySelector('.c6-root').appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.setAttribute('data-kind', kind || 'ok'); toastEl.setAttribute('data-show', 'true');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.setAttribute('data-show', 'false'); }, 3600);
  }
  function download(name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function nextId(prefix, list, pad) {
    var max = 0, re = new RegExp('^' + prefix + '-(\\d+)$');
    list.forEach(function (r) { var m = re.exec(r.id); if (m) max = Math.max(max, +m[1]); });
    return prefix + '-' + String(max + 1).padStart(pad || 3, '0');
  }
  C.util.dom = { esc: esc, $: $, $$: $$, today: today, toast: toast, download: download, qs: qs, nextId: nextId };
})(globalThis.CAT6);
