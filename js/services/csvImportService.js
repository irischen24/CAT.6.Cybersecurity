/* Minimal CSV import for the FAIR template. Never silently ignores bad data:
 * each error reports Row / Column / Value / Error / Expected Format / Suggested Correction.
 * .xlsx parsing is planned via SheetJS in the Data Import Center (see docs). */
(function (C) {
  var REQUIRED = ['field', 'min', 'most_likely', 'max'];
  var KNOWN = { CF: 'count', PoA: 'prob', Susceptibility: 'prob', PrimaryLoss: 'money', SecondaryLoss: 'money' };

  function parseCSV(text) {
    var rows = [], row = [], cell = '', q = false;
    text = text.replace(/^\uFEFF/, '');
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
  }

  function toNumber(raw, kind) {
    var s = String(raw).trim().replace(/[,NT$\s]/g, '');
    var isPct = /%$/.test(s); s = s.replace('%', '');
    if (s === '' || isNaN(Number(s))) return null;
    var n = Number(s);
    if (kind === 'prob' && (isPct || n > 1)) n = n / 100;
    return n;
  }

  function importFair(text) {
    var rows = parseCSV(text), errors = [], values = {};
    if (!rows.length) return { values: values, errors: [{ row: '-', column: '-', value: '', error: '檔案為空', expected: 'CSV 標題列 + 資料列', suggestion: '下載範本後填寫' }], rowCount: 0 };
    var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var missing = REQUIRED.filter(function (h) { return header.indexOf(h) < 0; });
    if (missing.length) {
      errors.push({ row: 1, column: missing.join(', '), value: rows[0].join(','), error: '缺少必要欄位', expected: REQUIRED.join(','), suggestion: '使用 CAT6_FAIR_Template.csv 的標題列' });
      return { values: values, errors: errors, rowCount: rows.length - 1 };
    }
    var idx = {}; REQUIRED.forEach(function (h) { idx[h] = header.indexOf(h); });
    rows.slice(1).forEach(function (r, i) {
      var rowNo = i + 2, field = (r[idx.field] || '').trim();
      if (!KNOWN[field]) { errors.push({ row: rowNo, column: 'field', value: field, error: '未知欄位', expected: Object.keys(KNOWN).join(' / '), suggestion: '修正欄位名稱（大小寫需一致）' }); return; }
      var t = {}, ok = true;
      [['min', 'min'], ['most_likely', 'mostLikely'], ['max', 'max']].forEach(function (p) {
        var n = toNumber(r[idx[p[0]]] || '', KNOWN[field]);
        if (n == null) { ok = false; errors.push({ row: rowNo, column: p[0], value: r[idx[p[0]]] || '(空白)', error: '不是數字', expected: KNOWN[field] === 'prob' ? '0–1 或 0%–100%' : '數字', suggestion: '移除文字與單位' }); }
        else t[p[1]] = n;
      });
      if (!ok) return;
      C.calc.distributions.validateTriangular(t).forEach(function (e) {
        ok = false; errors.push({ row: rowNo, column: 'min/most_likely/max', value: [t.min, t.mostLikely, t.max].join(' / '), error: e.code, expected: e.expected, suggestion: '檢查三點估計的大小順序' });
      });
      if (ok) values[field] = t;
    });
    Object.keys(KNOWN).forEach(function (f) {
      if (!values[f] && !errors.some(function (e) { return e.value === f; }))
        errors.push({ row: '-', column: 'field', value: f, error: 'DATA REQUIRED', expected: '每個 FAIR 變數一列', suggestion: '補上此列，或保留 CAT.6 預設值' });
    });
    return { values: values, errors: errors, rowCount: rows.length - 1 };
  }

  function fairTemplate() {
    var d = C.data.fairDefaults.fields;
    var lines = ['field,min,most_likely,max,unit,note'];
    d.forEach(function (f) { lines.push([f.field, f.value.min, f.value.mostLikely, f.value.max, f.unit, 'CAT6_DEFAULT demo value — replace with organization data'].join(',')); });
    return lines.join('\n');
  }
  C.services.csvImport = { parseCSV: parseCSV, importFair: importFair, fairTemplate: fairTemplate };
})(globalThis.CAT6);
