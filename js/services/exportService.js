/* Table export: CSV (UTF-8 BOM so Excel shows Chinese correctly) and XLSX. Provenance columns are kept. */
(function (C) {
  function cell(v) { if (v == null) return ''; var s = Array.isArray(v) ? v.join('; ') : String(v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function toCSV(rows) { return '\uFEFF' + rows.map(function (r) { return r.map(cell).join(','); }).join('\r\n'); }
  function normalize(v) { return Array.isArray(v) ? v.join('; ') : v; }
  /* table = { name, columns: [{ key, label, get? }], rows: [obj], notes: [string] } */
  function matrix(table) {
    var head = table.columns.map(function (c) { return c.label; });
    var body = table.rows.map(function (r) { return table.columns.map(function (c) { return normalize(c.get ? c.get(r) : r[c.key]); }); });
    return [head].concat(body);
  }
  function csv(table) {
    var notes = (table.notes || []).map(function (n) { return ['# ' + n]; });
    return toCSV(notes.concat(notes.length ? [[]] : [], matrix(table)));
  }
  function xlsx(tables) {
    var sheets = tables.map(function (t) {
      var m = matrix(t);
      if (t.notes && t.notes.length) m = m.concat([[]], t.notes.map(function (n) { return [n]; }));
      return { name: t.sheet || t.name, rows: m };
    });
    return new Blob([C.services.xlsx.write(sheets)], { type: C.services.xlsx.MIME });
  }
  function stamp() { return new Date().toISOString().slice(0, 10); }
  function downloadCSV(table, file) { C.util.dom.download((file || table.name) + '_' + stamp() + '.csv', csv(table), 'text/csv;charset=utf-8'); }
  function downloadXLSX(tables, file) { C.util.dom.download(file + '_' + stamp() + '.xlsx', xlsx(tables)); }
  C.services.exporter = { csv: csv, xlsx: xlsx, matrix: matrix, toCSV: toCSV, downloadCSV: downloadCSV, downloadXLSX: downloadXLSX };
})(globalThis.CAT6);
