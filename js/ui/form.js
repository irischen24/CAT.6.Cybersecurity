/* Modal form / detail / confirm dialogs built on <dialog>. Validation is explicit and accessible:
 * each invalid field gets aria-invalid + a described-by message, and focus moves to the first error.
 * Field: { key, label, type: text|textarea|number|int|select|date|multi|bool|info, required, options,
 *          min, max, step, unit, help, full, placeholder, filter (multi), showIf(values) } */
(function (C) {
  var esc = function (v) { return C.util.dom.esc(v); };
  var uid = 0;
  function opts(f) { return (typeof f.options === 'function' ? f.options() : f.options || []).map(function (o) { return typeof o === 'object' ? o : { value: o, label: o }; }); }
  function control(f, v, id) {
    var req = f.required ? ' required aria-required="true"' : '', desc = ' aria-describedby="' + id + '-h ' + id + '-e"';
    switch (f.type) {
      case 'textarea': return '<textarea class="c6-input c6-textarea" id="' + id + '" name="' + f.key + '"' + req + desc + ' rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(v == null ? '' : v) + '</textarea>';
      case 'select': case 'int':
        var o = f.type === 'int' && !f.options ? range(f.min, f.max) : opts(f);
        return '<select class="c6-input" id="' + id + '" name="' + f.key + '"' + req + desc + '><option value="">' + (f.required ? '請選擇…' : '（未填）') + '</option>' +
          o.map(function (x) { return '<option value="' + esc(x.value) + '"' + (String(v) === String(x.value) ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join('') + '</select>';
      case 'multi':
        var sel = Array.isArray(v) ? v : [];
        return '<div class="c6-multi" id="' + id + '" role="group" aria-labelledby="' + id + '-l"' + desc + '>' +
          (f.filter ? '<input class="c6-input c6-multi__filter" type="search" placeholder="篩選…" aria-label="篩選 ' + esc(f.label) + '">' : '') +
          '<div class="c6-multi__list">' + opts(f).map(function (x, i) {
            return '<label class="c6-multi__opt" data-text="' + esc((x.value + ' ' + x.label).toLowerCase()) + '"><input type="checkbox" name="' + f.key + '" value="' + esc(x.value) + '"' + (sel.indexOf(x.value) >= 0 ? ' checked' : '') + '><span>' + esc(x.label) + '</span></label>';
          }).join('') + '</div></div>';
      case 'bool': return '<label class="c6-check"><input type="checkbox" id="' + id + '" name="' + f.key + '"' + (v ? ' checked' : '') + desc + '><span>' + esc(f.checkLabel || '是') + '</span></label>';
      case 'info': return '<div class="c6-note" id="' + id + '">' + (f.html || '') + '</div>';
      default:
        var t = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
        return '<input class="c6-input" id="' + id + '" name="' + f.key + '" type="' + t + '"' + req + desc + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') +
          (t === 'number' ? ' inputmode="decimal"' : '') + ' value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(f.placeholder || '') + '">';
    }
  }
  function range(a, b) { var o = []; for (var i = a; i <= b; i++) o.push({ value: i, label: String(i) }); return o; }
  function read(form, fields) {
    var out = {};
    fields.forEach(function (f) {
      if (f.type === 'info') return;
      if (f.type === 'multi') { out[f.key] = Array.prototype.map.call(form.querySelectorAll('input[name="' + f.key + '"]:checked'), function (c) { return c.value; }); return; }
      var el = form.elements[f.key]; if (!el) return;
      if (f.type === 'bool') { out[f.key] = el.checked; return; }
      var v = el.value.trim();
      if (f.type === 'number') out[f.key] = v === '' ? null : Number(v);
      else if (f.type === 'int') out[f.key] = v === '' ? null : parseInt(v, 10);
      else if (f.type === 'select' && f.boolValues) out[f.key] = v === '' ? null : v === 'true';
      else out[f.key] = v;
    });
    return out;
  }
  function check(fields, values, extra) {
    var errs = {};
    fields.forEach(function (f) {
      if (f.showIf && !f.showIf(values)) return;
      var v = values[f.key];
      var empty = v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'number' && isNaN(v));
      if (f.required && empty) { errs[f.key] = '必填：' + f.label; return; }
      if (!empty && (f.type === 'number' || f.type === 'int')) {
        if (isNaN(v)) errs[f.key] = '請輸入數字';
        else if (f.min != null && v < f.min) errs[f.key] = '不可小於 ' + f.min;
        else if (f.max != null && v > f.max) errs[f.key] = '不可大於 ' + f.max;
      }
      if (!empty && f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errs[f.key] = '日期格式 YYYY-MM-DD';
    });
    if (extra) Object.assign(errs, extra(values) || {});
    return errs;
  }
  function dialogShell(title, sub) {
    var d = document.createElement('dialog'); d.className = 'c6-dialog'; d.setAttribute('aria-labelledby', 'dlg' + (++uid));
    d.innerHTML = '<div class="c6-dialog__head"><div><h2 class="c6-dialog__title" id="dlg' + uid + '">' + esc(title) + '</h2>' + (sub ? '<p class="c6-panel__sub">' + sub + '</p>' : '') + '</div>' +
      '<button type="button" class="c6-iconbtn" data-close aria-label="關閉">' + C.ui.icons.icon('close') + '</button></div><div class="c6-dialog__body"></div>';
    document.querySelector('.c6-root').appendChild(d);
    var opener = document.activeElement;
    d.addEventListener('close', function () { d.remove(); if (opener && opener.focus && document.contains(opener)) opener.focus(); });
    d.querySelector('[data-close]').addEventListener('click', function () { d.close(); });
    return d;
  }
  /* open({ title, subtitle, fields, values, submitLabel, validate }) → Promise<values|null> */
  function open(o) {
    return new Promise(function (resolve) {
      var d = dialogShell(o.title, o.subtitle), result = null, values = Object.assign({}, o.values || {});
      var form = document.createElement('form'); form.className = 'c6-form'; form.noValidate = true;
      form.innerHTML = '<div class="c6-form__grid">' + o.fields.map(function (f, i) {
        var id = 'f' + uid + '-' + i;
        return '<div class="c6-form__field' + (f.full || f.type === 'textarea' || f.type === 'multi' ? ' c6-form__field--full' : '') + '" data-key="' + f.key + '">' +
          (f.type === 'bool' || f.type === 'info' ? '<span class="c6-form__label" id="' + id + '-l">' + esc(f.label) + '</span>' : '<label class="c6-form__label" id="' + id + '-l" for="' + id + '">' + esc(f.label) + '</label>') +
          '<span class="c6-form__req">' + (f.required ? '必填' : f.type === 'info' ? '' : '選填') + (f.unit ? ' · ' + esc(f.unit) : '') + '</span>' +
          control(f, values[f.key], id) +
          '<p class="c6-form__help" id="' + id + '-h">' + (f.help || '') + '</p><p class="c6-form__err" id="' + id + '-e" role="alert"></p></div>';
      }).join('') + '</div><div class="c6-form__foot"><button type="button" class="c6-btn c6-btn--ghost" data-cancel>取消</button><button type="submit" class="c6-btn c6-btn--primary">' + esc(o.submitLabel || '儲存') + '</button></div>';
      d.querySelector('.c6-dialog__body').appendChild(form);
      function applyShowIf() {
        var v = read(form, o.fields);
        o.fields.forEach(function (f) { if (f.showIf) form.querySelector('[data-key="' + f.key + '"]').hidden = !f.showIf(v); });
      }
      form.addEventListener('change', applyShowIf); applyShowIf();
      form.addEventListener('input', function (e) {
        if (e.target.classList.contains('c6-multi__filter')) {
          var q = e.target.value.toLowerCase();
          e.target.parentNode.querySelectorAll('.c6-multi__opt').forEach(function (l) { l.hidden = q && l.getAttribute('data-text').indexOf(q) < 0; });
        }
      });
      form.querySelector('[data-cancel]').addEventListener('click', function () { d.close(); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = read(form, o.fields), errs = check(o.fields, v, o.validate), first = null;
        o.fields.forEach(function (f) {
          var box = form.querySelector('[data-key="' + f.key + '"]'), ctl = box.querySelector('.c6-input, .c6-multi, input');
          box.querySelector('.c6-form__err').textContent = errs[f.key] || '';
          if (ctl) { if (errs[f.key]) ctl.setAttribute('aria-invalid', 'true'); else ctl.removeAttribute('aria-invalid'); }
          if (errs[f.key] && !first) first = ctl;
        });
        if (first) { first.focus(); return; }
        result = v; d.close();
      });
      d.addEventListener('close', function () { resolve(result); });
      d.showModal();
      var f0 = form.querySelector('.c6-input, input'); if (f0) f0.focus();
    });
  }
  /* detail({ title, subtitle, rows: [[label, html]], actions: [{ label, primary, onClick }] }) */
  function detail(o) {
    var d = dialogShell(o.title, o.subtitle);
    d.querySelector('.c6-dialog__body').innerHTML = '<dl class="c6-dl">' + o.rows.map(function (r) { return '<div class="c6-dl__row"><dt>' + esc(r[0]) + '</dt><dd>' + (r[1] == null || r[1] === '' ? '<span class="c6-muted">—</span>' : r[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="c6-form__foot">' + (o.actions || []).map(function (a, i) { return '<button type="button" class="c6-btn ' + (a.primary ? 'c6-btn--primary' : 'c6-btn--secondary') + '" data-a="' + i + '">' + esc(a.label) + '</button>'; }).join('') + '<button type="button" class="c6-btn c6-btn--ghost" data-x>關閉</button></div>';
    d.querySelector('[data-x]').addEventListener('click', function () { d.close(); });
    (o.actions || []).forEach(function (a, i) { d.querySelector('[data-a="' + i + '"]').addEventListener('click', function () { d.close(); a.onClick(); }); });
    d.showModal();
    d.querySelector('[data-x]').focus();
  }
  function confirm(message, okLabel) {
    return new Promise(function (resolve) {
      var d = dialogShell('請確認'), ok = false;
      d.querySelector('.c6-dialog__body').innerHTML = '<p class="c6-body">' + esc(message) + '</p><div class="c6-form__foot"><button type="button" class="c6-btn c6-btn--ghost" data-no>取消</button><button type="button" class="c6-btn c6-btn--primary" data-yes>' + esc(okLabel || '確定') + '</button></div>';
      d.querySelector('[data-no]').addEventListener('click', function () { d.close(); });
      d.querySelector('[data-yes]').addEventListener('click', function () { ok = true; d.close(); });
      d.addEventListener('close', function () { resolve(ok); });
      d.showModal(); d.querySelector('[data-no]').focus();
    });
  }
  C.ui.form = { open: open, detail: detail, confirm: confirm, check: check };
})(globalThis.CAT6);
