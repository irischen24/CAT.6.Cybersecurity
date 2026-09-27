/* Data table with search, filters, sortable headers, row actions and an accessible caption.
 * Columns: { key, label, get(row) → sort/search value, render(row) → HTML, num, wrap, sortable }. */
(function (C) {
  var esc = function (v) { return C.util.dom.esc(v); }, I = C.ui.icons;
  var ACT = { view: ['eye', '檢視'], edit: ['edit', '編輯'], delete: ['trash', '刪除'] };
  var uid = 0;
  function create(el, o) {
    var id = 'tbl' + (++uid), state = { q: o.query || '', filters: {}, sort: o.sort || null, rows: o.rows || [] };
    function val(c, r) { return c.get ? c.get(r) : r[c.key]; }
    function visible() {
      var q = state.q.trim().toLowerCase();
      var rows = state.rows.filter(function (r) {
        if (q && !o.columns.some(function (c) { var v = val(c, r); return v != null && String(Array.isArray(v) ? v.join(' ') : v).toLowerCase().indexOf(q) >= 0; })) return false;
        return (o.filters || []).every(function (f) { var fv = state.filters[f.key]; if (!fv) return true; var v = f.get ? f.get(r) : r[f.key]; return Array.isArray(v) ? v.indexOf(fv) >= 0 : String(v) === fv; });
      });
      if (state.sort) {
        var c = o.columns.filter(function (x) { return x.key === state.sort.key; })[0], dir = state.sort.dir === 'asc' ? 1 : -1;
        if (c) rows = rows.slice().sort(function (a, b) {
          var x = val(c, a), y = val(c, b);
          if (x == null || x === '') return 1; if (y == null || y === '') return -1;
          return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'zh-Hant')) * dir;
        });
      }
      return rows;
    }
    function toolbar() {
      var f = (o.filters || []).map(function (fl) {
        return '<label class="c6-field c6-field--inline"><span class="c6-var__lbl">' + esc(fl.label) + '</span><select class="c6-input" data-filter="' + fl.key + '"><option value="">全部</option>' +
          fl.options.map(function (op) { var v = typeof op === 'string' ? op : op.value, l = typeof op === 'string' ? op : op.label; return '<option value="' + esc(v) + '"' + (state.filters[fl.key] === v ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></label>';
      }).join('');
      return '<div class="c6-toolbar">' +
        (o.search !== false ? '<label class="c6-field c6-field--inline c6-toolbar__search"><span class="c6-var__lbl">搜尋</span><input class="c6-input" type="search" data-q placeholder="' + esc(o.searchPlaceholder || '輸入關鍵字…') + '" value="' + esc(state.q) + '"></label>' : '') +
        f + '<span class="c6-toolbar__count" aria-live="polite" data-count></span>' + (o.toolbar ? '<div class="c6-toolbar__extra">' + o.toolbar + '</div>' : '') + '</div>';
    }
    function body() {
      var rows = visible();
      el.querySelector('[data-count]').textContent = '顯示 ' + rows.length + ' / ' + state.rows.length + ' 筆';
      if (!rows.length) return '<tr><td colspan="' + (o.columns.length + (o.actions ? 1 : 0)) + '" class="c6-table__empty">' + (state.rows.length ? '沒有符合條件的資料，請調整搜尋或篩選。' : esc(o.empty || '尚無資料，使用「新增」或 Data Import 建立。')) + '</td></tr>';
      return rows.map(function (r) {
        return '<tr data-id="' + esc(r[o.rowKey || 'id']) + '">' + o.columns.map(function (c, i) {
          var html = c.render ? c.render(r) : esc(val(c, r) == null ? '' : val(c, r));
          var cls = (c.num ? 'c6-t-num' : '') + (c.wrap ? ' c6-t-wrap' : '');
          return i === 0 && o.rowHeader !== false ? '<th scope="row" class="c6-table__rh ' + cls + '">' + html + '</th>' : '<td' + (cls.trim() ? ' class="' + cls.trim() + '"' : '') + '>' + html + '</td>';
        }).join('') + (o.actions ? '<td class="c6-t-actions">' + o.actions.map(function (a) {
          var d = ACT[a] || [a.icon, a.label], key = typeof a === 'string' ? a : a.id;
          return '<button type="button" class="c6-iconbtn c6-iconbtn--sm" data-act="' + key + '" aria-label="' + d[1] + ' ' + esc(r[o.rowKey || 'id']) + '" title="' + d[1] + '">' + I.icon(d[0]) + '</button>';
        }).join('') + '</td>' : '') + '</tr>';
      }).join('');
    }
    function head() {
      return o.columns.map(function (c) {
        var s = state.sort && state.sort.key === c.key ? state.sort.dir : null;
        var aria = s ? ' aria-sort="' + (s === 'asc' ? 'ascending' : 'descending') + '"' : '';
        return '<th scope="col"' + aria + (c.num ? ' class="c6-t-num"' : '') + (c.width ? ' style="min-width:' + c.width + '"' : '') + '>' +
          (c.sortable === false ? esc(c.label) : '<button type="button" class="c6-sortbtn" data-sort="' + c.key + '">' + esc(c.label) + '<span aria-hidden="true" class="c6-sortbtn__ind">' + (s === 'asc' ? '▲' : s === 'desc' ? '▼' : '↕') + '</span></button>') + '</th>';
      }).join('') + (o.actions ? '<th scope="col"><span class="c6-sr-only">操作</span></th>' : '');
    }
    function render() {
      el.innerHTML = toolbar() + '<div class="c6-table-wrap"><table class="c6-table c6-table--data" id="' + id + '"><caption class="c6-sr-only">' + esc(o.caption || '') + '</caption><thead><tr>' + head() + '</tr></thead><tbody></tbody></table></div>';
      el.querySelector('tbody').innerHTML = body();
    }
    el.addEventListener('input', function (e) { if (e.target.hasAttribute('data-q')) { state.q = e.target.value; el.querySelector('tbody').innerHTML = body(); } });
    el.addEventListener('change', function (e) { var k = e.target.getAttribute('data-filter'); if (k != null) { state.filters[k] = e.target.value; el.querySelector('tbody').innerHTML = body(); } });
    el.addEventListener('click', function (e) {
      var sb = e.target.closest('[data-sort]');
      if (sb) { var k = sb.getAttribute('data-sort'); state.sort = { key: k, dir: state.sort && state.sort.key === k && state.sort.dir === 'asc' ? 'desc' : 'asc' }; el.querySelector('thead tr').innerHTML = head(); el.querySelector('tbody').innerHTML = body(); var again = el.querySelector('[data-sort="' + k + '"]'); if (again) again.focus(); return; }
      var ab = e.target.closest('[data-act]');
      if (ab && o.onAction) { var rid = ab.closest('tr').getAttribute('data-id'); var row = state.rows.filter(function (r) { return String(r[o.rowKey || 'id']) === rid; })[0]; o.onAction(ab.getAttribute('data-act'), row, ab); }
    });
    render();
    return { setRows: function (rows) { state.rows = rows; el.querySelector('tbody').innerHTML = body(); }, visible: visible, el: el };
  }
  C.ui.table = { create: create };
})(globalThis.CAT6);
