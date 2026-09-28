/* Minimal, dependency-free XLSX reader / writer (Office Open XML SpreadsheetML).
 * Writer: STORE-only ZIP (no compression) + inline strings + bold header style → opens in Excel / LibreOffice / Numbers.
 * Reader: ZIP central directory + DEFLATE via the browser's DecompressionStream('deflate-raw')
 *         (Chrome 103+, Edge 103+, Firefox 113+, Safari 16.4+). Reads values only (no formulas / formatting).
 * Scope: import templates and data exports. Not a general spreadsheet engine. */
(function (C) {
  var enc = new TextEncoder();
  /* ---------- CRC32 ---------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  /* ---------- ZIP (store) writer ---------- */
  function zip(files) {
    var parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true);
      h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
    var all = parts.concat(central, [new Uint8Array(e.buffer)]), len = all.reduce(function (s, p) { return s + p.length; }, 0), out = new Uint8Array(len), o = 0;
    all.forEach(function (p) { out.set(p, o); o += p.length; });
    return out;
  }

  /* ---------- XLSX writer ---------- */
  function xmlEsc(s) { return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function colName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function sheetName(n, used) {
    var s = String(n || 'Sheet').replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31) || 'Sheet', base = s, k = 2;
    while (used[s.toLowerCase()]) { s = base.slice(0, 28) + ' ' + k++; }
    used[s.toLowerCase()] = 1; return s;
  }
  function sheetXml(rows, opts) {
    var widths = (rows[0] || []).map(function (_, c) {
      var w = rows.reduce(function (m, r) { var v = r[c] == null ? '' : String(r[c]); var len = 0; for (var i = 0; i < Math.min(v.length, 80); i++) len += v.charCodeAt(i) > 255 ? 2 : 1; return Math.max(m, len); }, 6);
      return Math.min(60, w + 2);
    });
    var cols = widths.length ? '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>' : '';
    var data = rows.map(function (r, ri) {
      return '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) {
        var ref = colName(ci) + (ri + 1), s = ri < (opts.headerRows || 1) ? ' s="1"' : '';
        if (v == null || v === '') return '';
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + s + '><v>' + v + '</v></c>';
        if (typeof v === 'boolean') return '<c r="' + ref + '"' + s + ' t="b"><v>' + (v ? 1 : 0) + '</v></c>';
        return '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>';
      }).join('') + '</row>';
    }).join('');
    var freeze = (opts.headerRows || 1) ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + (opts.headerRows || 1) + '" topLeftCell="A' + ((opts.headerRows || 1) + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + freeze + cols + '<sheetData>' + data + '</sheetData></worksheet>';
  }
  /* sheets: [{ name, rows: [[...]], headerRows }] → Uint8Array */
  function write(sheets) {
    var used = {}, names = sheets.map(function (s) { return sheetName(s.name, used); });
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        names.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        names.map(function (n, i) { return '<sheet name="' + xmlEsc(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        names.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (names.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }
    ];
    sheets.forEach(function (s, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s.rows, s) }); });
    return zip(files);
  }

  /* ---------- ZIP reader ---------- */
  function inflateRaw(u8) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('此瀏覽器不支援 DecompressionStream，無法讀取 .xlsx；請改用 CSV 或更新瀏覽器。'));
    var stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function unzip(buf) {
    var u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return Promise.reject(new Error('不是有效的 .xlsx（找不到 ZIP 目錄）。'));
    var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), dec = new TextDecoder(), jobs = {}, names = [];
    for (var n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) return Promise.reject(new Error('ZIP 目錄損毀。'));
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true),
        elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      var start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), data = u8.subarray(start, start + csize);
      names.push(name);
      jobs[name] = method === 0 ? Promise.resolve(data) : method === 8 ? inflateRaw(data) : Promise.reject(new Error('不支援的壓縮方式 ' + method));
      p += 46 + nlen + elen + clen;
    }
    return Promise.all(names.map(function (k) { return jobs[k]; })).then(function (vals) { var o = {}; names.forEach(function (k, i) { o[k] = vals[i]; }); return o; });
  }

  /* ---------- XLSX reader ---------- */
  function unesc(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (_, e) {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e];
    });
  }
  function attr(s, name) { var m = new RegExp('(?:^|\\s)' + name + '="([^"]*)"').exec(s); return m ? unesc(m[1]) : null; }
  function texts(xml) { var out = '', re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, m; xml = xml.replace(/<rPh[\s\S]*?<\/rPh>/g, ''); while ((m = re.exec(xml))) out += unesc(m[1]); return out; }
  function colIndex(ref) { var m = /^([A-Z]+)/.exec(ref || ''); if (!m) return -1; var n = 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64); return n - 1; }
  function parseSheet(xml, shared) {
    var rows = [], rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, m, next = 0;
    while ((m = rowRe.exec(xml))) {
      var rAttr = attr(m[1], 'r'), ri = rAttr ? +rAttr - 1 : next; next = ri + 1;
      var row = [], cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, c, ci = 0;
      while ((c = cellRe.exec(m[2] || ''))) {
        var ref = attr(c[1], 'r'), idx = ref ? colIndex(ref) : ci; ci = idx + 1;
        var t = attr(c[1], 't'), body = c[2] || '', vm = /<v>([\s\S]*?)<\/v>/.exec(body), v;
        if (t === 's') v = vm ? shared[+vm[1]] : '';
        else if (t === 'inlineStr') v = texts(body);
        else if (t === 'str' || t === 'e') v = vm ? unesc(vm[1]) : '';
        else if (t === 'b') v = vm ? vm[1] === '1' : '';
        else v = vm ? Number(vm[1]) : '';
        row[idx] = v;
      }
      for (var k = 0; k < row.length; k++) if (row[k] === undefined) row[k] = '';
      rows[ri] = row;
    }
    for (var r = 0; r < rows.length; r++) if (!rows[r]) rows[r] = [];
    return rows;
  }
  function read(buf) {
    var dec = new TextDecoder();
    return unzip(buf).then(function (files) {
      /* Some producers (Open XML SDK / .NET, some online converters) write prefixed element names such as
       * <x:workbook>, <x:sheet>, <x:c>. Strip element prefixes so the same parser handles both forms; also drop a BOM.
       * Attribute prefixes (r:id) are left untouched. Part names are matched case-insensitively. */
      var lower = {}; Object.keys(files).forEach(function (k) { lower[k.toLowerCase()] = k; });
      var get = function (p) { var k = files[p] ? p : lower[String(p).toLowerCase()]; return k && files[k] ? dec.decode(files[k]).replace(/^\uFEFF/, '').replace(/<(\/?)[A-Za-z_][\w.-]*:(?=[A-Za-z_])/g, '<$1') : null; };
      var wb = get('xl/workbook.xml'); if (!wb) throw new Error('不是有效的 .xlsx（缺少 xl/workbook.xml）。');
      var rels = get('xl/_rels/workbook.xml.rels') || '', relMap = {}, rm, relRe = /<Relationship\b([^>]*)\/?>/g;
      while ((rm = relRe.exec(rels))) relMap[attr(rm[1], 'Id')] = attr(rm[1], 'Target');
      var sst = get('xl/sharedStrings.xml'), shared = [];
      if (sst) { var si, siRe = /<si>([\s\S]*?)<\/si>/g; while ((si = siRe.exec(sst))) shared.push(texts(si[1])); }
      var sheets = [], sm, shRe = /<sheet\b([^>]*?)\/?>/g;
      while ((sm = shRe.exec(wb))) {
        var rid = attr(sm[1], 'r:id') || (/\s[\w.-]+:id="([^"]*)"/.exec(sm[1]) || [])[1];
        var target = relMap[rid] || '', path = target.charAt(0) === '/' ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
        var xml = get(path);
        if (xml) sheets.push({ name: attr(sm[1], 'name'), rows: parseSheet(xml, shared) });
      }
      if (!sheets.length) throw new Error('活頁簿中沒有工作表。');
      return sheets;
    });
  }
  /* Excel serial date → YYYY-MM-DD (1900 date system). */
  function serialToISO(n) { var ms = Math.round((n - 25569) * 86400000); var d = new Date(ms); return isNaN(d) ? null : d.toISOString().slice(0, 10); }
  C.services.xlsx = { write: write, read: read, serialToISO: serialToISO, crc32: crc32, colName: colName,
    MIME: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
})(globalThis.CAT6);
