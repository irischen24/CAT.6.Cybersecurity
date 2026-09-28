/* CAT.6 demo compliance documents — each document is ONE A4 SVG (595 × 842 pt).
 * The SAMPLE / DEMO ONLY / NOT A REAL CERTIFICATION marks (header strip, bilingual banner, diagonal watermark drawn ON TOP
 * of the content, footer statement) are part of the SVG drawing itself, so no stylesheet, print setting ("background
 * graphics" off) or PDF export can remove them. No certification-body, accreditation, ISO, AICPA or CPA-firm names,
 * logos or signatures are used; issuer fields state that nothing was issued. The QR code only links to CAT.6's own
 * Trust Center demo lookup. */
(function (C) {
  var W = 595, H = 842, NAVY = '#12132A', PURPLE = '#7C5CFC', INK = '#16161D', MUTED = '#5A5F6B', RED = '#8A1C2B';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var FONT = "Inter, 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif";
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  /* Approximate text width (CJK ≈ 1 em, Latin ≈ 0.55 em) → greedy wrap into lines of maxWidth pt. */
  function width(t, size) { var w = 0; for (var i = 0; i < t.length; i++) w += /[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(t[i]) ? 1 : /[A-Z0-9]/.test(t[i]) ? 0.64 : 0.54; return w * size; }
  function wrap(t, size, max) {
    var out = [], line = '', tokens = String(t).match(/[\u2E80-\u9FFF\uFF00-\uFFEF]|[^\s\u2E80-\u9FFF\uFF00-\uFFEF]+|\s+/g) || [];
    tokens.forEach(function (tok) { var next = line + tok; if (width(next.trim(), size) > max && line.trim()) { out.push(line.trim()); line = tok.trim() ? tok : ''; } else line = next; });
    if (line.trim()) out.push(line.trim());
    return out;
  }
  function text(x, y, t, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-size="' + (o.size || 10) + '" font-weight="' + (o.weight || 400) + '" fill="' + (o.fill || INK) + '"' +
      (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + '>' + esc(t) + '</text>';
  }
  function para(x, y, t, o) { o = o || {}; var lines = wrap(t, o.size || 10, o.max || 480), lh = o.lh || (o.size || 10) * 1.45; return { svg: lines.map(function (l, i) { return text(x, y + i * lh, l, o); }).join(''), h: lines.length * lh }; }
  function brand(x, y) {
    var a = (C.data.brand && C.data.brand.assets) || {};
    if (a.logo && C.ui.brand) return '<image href="' + esc(C.ui.brand.url(a.horizontal || a.logo)) + '" x="' + x + '" y="' + (y - 20) + '" height="28" preserveAspectRatio="xMinYMid meet" width="200"/>';
    var mark = C.ui.icons && C.ui.icons.mark ? C.ui.icons.mark('').replace('<svg ', '<svg x="' + x + '" y="' + (y - 20) + '" width="28" height="28" ').replace(/class="[^"]*"/, '') : '';
    return mark + text(x + 38, y, 'CAT.6 CYBERSECURITY', { size: 12, weight: 700, fill: '#FFFFFF', ls: 1.6 });
  }
  function kv(x, y, rows, o) {
    o = o || {}; var s = '', yy = y, lw = o.lw || 150, max = o.max || 330;
    rows.forEach(function (r) {
      var p = para(x + lw, yy, r[1], { size: 10.5, weight: r[2] ? 700 : 500, fill: r[2] || INK, max: max });
      s += text(x, yy, r[0], { size: 9, fill: MUTED, weight: 600, ls: 0.4 }) + p.svg + '<line x1="' + x + '" x2="' + (x + lw + max) + '" y1="' + (yy + p.h - 5) + '" y2="' + (yy + p.h - 5) + '" stroke="#E4E4EC"/>';
      yy += p.h + 9;
    });
    return { svg: s, h: yy - y };
  }
  function qr(url, x, y, size) {
    if (!C.services.qr) return '';
    var q = C.services.qr.encode(url, 'M'), n = q.size + 8, k = size / n, p = [];
    for (var yy = 0; yy < q.size; yy++) for (var xx = 0; xx < q.size; xx++) if (q.get(xx, yy)) p.push('M' + (x + (xx + 4) * k).toFixed(2) + ',' + (y + (yy + 4) * k).toFixed(2) + 'h' + k.toFixed(2) + 'v' + k.toFixed(2) + 'h-' + k.toFixed(2) + 'z');
    return '<rect x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + p.join('') + '" fill="#111"/>';
  }
  function lookupUrl(it, base) { return (base || new URL('./', location.href).href.replace(/trust\/.*$/, 'trust/')) + '?doc=' + encodeURIComponent(it.documentId); }

  /* Shared frame: header band, demo banners, footer statement + QR, watermark on top. */
  function frame(it, body, o) {
    var CP = C.data.compliance, gen = o.date || today(), s = [];
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" class="c6-demodoc" role="img" aria-label="' + esc(it.documentTitle + ' — SAMPLE, DEMO ONLY, NOT A REAL CERTIFICATION') + '">');
    s.push('<rect width="' + W + '" height="' + H + '" fill="#FFFFFF"/>');
    s.push('<rect x="14" y="14" width="' + (W - 28) + '" height="' + (H - 28) + '" fill="none" stroke="#D6D1F5" stroke-width="1"/>');
    s.push('<rect x="0" y="0" width="' + W + '" height="74" fill="' + NAVY + '"/><rect x="0" y="74" width="' + W + '" height="3" fill="' + PURPLE + '"/>');
    s.push(brand(40, 44));
    s.push(text(W - 40, 36, 'DEMO DOCUMENT', { size: 9, weight: 700, fill: '#CFC6FF', anchor: 'end', ls: 2 }) + text(W - 40, 52, it.documentId, { size: 9, fill: '#FFFFFF', anchor: 'end', ls: 0.6 }));
    /* Demo banner (bilingual) */
    s.push('<rect x="40" y="90" width="' + (W - 80) + '" height="38" fill="' + RED + '"/>');
    s.push(text(W / 2, 106, CP.DOC_BANNER, { size: 11, weight: 800, fill: '#FFFFFF', anchor: 'middle', ls: 1.5 }) + text(W / 2, 121, CP.DOC_BANNER_ZH, { size: 9.5, weight: 600, fill: '#FFFFFF', anchor: 'middle' }));
    s.push(body);
    /* Footer */
    var fy = H - 150;
    s.push('<line x1="40" x2="' + (W - 40) + '" y1="' + fy + '" y2="' + fy + '" stroke="#D6D1F5"/>');
    var st = para(40, fy + 20, o.statement, { size: 9, weight: 600, fill: RED, max: 390 });
    s.push(st.svg);
    s.push(para(40, fy + 26 + st.h, o.statementZh, { size: 8.5, fill: MUTED, max: 390 }).svg);
    s.push(text(40, H - 52, 'Document ID ' + it.documentId + '  ·  Generated ' + gen, { size: 7.5, fill: MUTED }));
    s.push(text(40, H - 41, CP.DISCLAIMER, { size: 7.5, weight: 700, fill: RED }));
    s.push(qr(lookupUrl(it, o.base), W - 40 - 84, fy + 8, 84) + text(W - 40 - 42, fy + 102, 'Scan: CAT.6 demo lookup', { size: 6.5, fill: MUTED, anchor: 'middle' }));
    /* Watermark — drawn last so it sits on top of every element */
    s.push('<g transform="rotate(-32 ' + W / 2 + ' ' + H / 2 + ')" opacity="0.10" pointer-events="none">' + text(W / 2, H / 2 - 10, 'SAMPLE', { size: 118, weight: 800, fill: PURPLE, anchor: 'middle', ls: 8 }) +
      text(W / 2, H / 2 + 62, 'DEMO ONLY', { size: 52, weight: 800, fill: RED, anchor: 'middle', ls: 6 }) + '</g>');
    s.push(text(W / 2, H - 24, 'SAMPLE · DEMO ONLY · NOT A REAL CERTIFICATION · 模擬文件 · 非正式認證／稽核文件', { size: 7.5, weight: 700, fill: RED, anchor: 'middle', ls: 0.6 }));
    s.push('</svg>');
    return s.join('');
  }

  function isoCert(it, o, std) {
    var y = 180, s = '';
    s += text(W / 2, y, it.name, { size: 34, weight: 800, fill: NAVY, anchor: 'middle', ls: 0.5 });
    s += text(W / 2, y + 26, std, { size: 13, weight: 500, fill: PURPLE, anchor: 'middle' });
    s += text(W / 2, y + 56, 'DEMO CERTIFICATE LAYOUT — SAMPLE', { size: 10, weight: 700, fill: RED, anchor: 'middle', ls: 2 });
    s += para(70, y + 90, 'This sample shows how a certificate record could be presented on the CAT.6 platform. It does not state or imply that any organization has been certified.', { size: 10, fill: MUTED, max: 455 }).svg;
    s += kv(70, y + 140, [
      ['Organization', 'CAT.6 Cybersecurity'],
      ['Scope', it.scope],
      [it.type === 'CERTIFICATION' && it.id === 'iso27001' ? 'Demo Certificate ID' : 'Document ID', it.documentId],
      ['Issue Date', (o.date || today()) + '（generated date of this demo）'],
      ['Status', 'SAMPLE / DEMO ONLY', RED],
      ['Issuer', 'None — not issued by any certification body'],
      ['Accreditation', 'None'],
      ['Certificate validity', 'Not applicable — this is not a certificate']
    ], { lw: 130, max: 325 }).svg;
    return s;
  }
  function iso27001(it, o) {
    return frame(it, isoCert(it, o, 'Information Security Management System'), Object.assign({
      statement: 'This document is a CAT.6 project demonstration. It is not issued by an accredited certification body and does not constitute ISO/IEC 27001 certification.',
      statementZh: '本文件為 CAT.6 專題展示用模擬文件，並非由經認證之驗證機構核發，不構成 ISO/IEC 27001 認證。' }, o));
  }
  function iso27017(it, o) {
    return frame(it, isoCert(it, o, 'Cloud Security Controls'), Object.assign({
      statement: 'This document is a CAT.6 project demonstration. It is not a certificate issued by a certification body and does not constitute ISO/IEC 27017 certification or conformity.',
      statementZh: '此文件不是由認證機構核發的正式證書；僅供 CAT.6 專題展示，不代表符合 ISO/IEC 27017。' }, o));
  }
  function vapt(it, o) {
    var y = 165, s = '', SIM = 'SIMULATED DATA';
    s += text(40, y, 'Vulnerability Assessment & Penetration Testing', { size: 17, weight: 800, fill: NAVY });
    s += text(40, y + 22, 'Demo Security Assessment Summary', { size: 12, weight: 600, fill: PURPLE });
    s += text(W - 40, y + 22, 'Security testing program — not a certification', { size: 8.5, fill: MUTED, anchor: 'end' });
    s += kv(40, y + 50, [['Report ID', it.documentId], ['Assessment Date', (o.date || today()) + '（demo generated date）'], ['Assessment Scope', it.scope + '（demo scope）'],
      ['Methodology', 'Reference approach: OWASP Web Security Testing Guide, NIST SP 800-115 — demo description only'], ['Tester', 'None — no test was performed']], { lw: 110, max: 405 }).svg;
    var by = y + 205;
    s += text(40, by, 'Finding Summary — Severity Distribution', { size: 11, weight: 700, fill: NAVY }) + text(W - 40, by, SIM, { size: 8.5, weight: 800, fill: RED, anchor: 'end', ls: 1.2 });
    var sev = [['Critical', 0, '#B3203A'], ['High', 2, '#C8561E'], ['Medium', 5, '#B8860B'], ['Low', 8, '#2F8F7A']];
    sev.forEach(function (r, i) {
      var yy = by + 18 + i * 22, bw = r[1] * 32;
      s += text(40, yy + 11, r[0], { size: 10, weight: 600 }) + '<rect x="110" y="' + yy + '" width="300" height="14" fill="#F1F1F5"/>' + (bw ? '<rect x="110" y="' + yy + '" width="' + bw + '" height="14" fill="' + r[2] + '"/>' : '') +
        text(420, yy + 11, String(r[1]), { size: 10, weight: 700 }) + text(W - 40, yy + 11, SIM, { size: 7.5, weight: 700, fill: RED, anchor: 'end' });
    });
    var ty = by + 118;
    s += text(40, ty, 'Findings & Remediation Status', { size: 11, weight: 700, fill: NAVY }) + text(W - 40, ty, SIM, { size: 8.5, weight: 800, fill: RED, anchor: 'end', ls: 1.2 });
    var rows = [['V-01', 'High', 'Outdated TLS configuration on test host', 'Remediated · retest pending'], ['V-02', 'High', 'Missing rate limiting on login endpoint', 'Open'],
      ['V-03', 'Medium', 'Missing Content-Security-Policy header', 'Remediated · retest pending'], ['V-04', 'Medium', 'Verbose error messages', 'Open'], ['V-05', 'Low', 'Cookie without SameSite attribute', 'Accepted (demo)']];
    s += '<rect x="40" y="' + (ty + 10) + '" width="' + (W - 80) + '" height="18" fill="#EEEBFF"/>';
    ['ID', 'Severity', 'Finding (simulated)', 'Remediation status (simulated)'].forEach(function (h, i) { s += text([46, 90, 150, 380][i], ty + 23, h, { size: 8.5, weight: 700, fill: '#1E1A4D' }); });
    rows.forEach(function (r, i) { var yy = ty + 42 + i * 17; [r[0], r[1], r[2], r[3]].forEach(function (c, j) { s += text([46, 90, 150, 380][j], yy, c, { size: 8.5 }); }); s += '<line x1="40" x2="' + (W - 40) + '" y1="' + (yy + 5) + '" y2="' + (yy + 5) + '" stroke="#ECECF2"/>'; });
    s += para(40, ty + 140, 'No overall pass / fail result is given. All counts, findings and statuses above are simulated for UI demonstration and are not the result of a real security test of the CAT.6 platform.', { size: 9, weight: 600, fill: RED, max: 515 }).svg;
    return frame(it, s, Object.assign({
      statement: 'This is a CAT.6 project demonstration. It is not a real vulnerability assessment or penetration test report, and it is not a certification.',
      statementZh: '本文件為模擬的安全測試摘要，所有數據皆為 SIMULATED DATA，不代表 CAT.6 平台的真實測試結果，亦非認證。' }, o));
  }
  function soc2(it, o) {
    var y = 170, s = '';
    s += text(W / 2, y, 'SOC 2 Type II', { size: 32, weight: 800, fill: NAVY, anchor: 'middle' });
    s += text(W / 2, y + 26, 'Demo Assurance Report Cover', { size: 13, weight: 600, fill: PURPLE, anchor: 'middle' });
    s += text(W / 2, y + 46, 'An examination report — not a certificate', { size: 9.5, fill: MUTED, anchor: 'middle' });
    s += kv(70, y + 80, [['Service Organization', 'CAT.6 Cybersecurity'], ['Trust Services Categories', 'Security · Availability · Confidentiality（demo selection）'],
      ['Examination Period', 'Not applicable — no examination has been performed'], ['Service Auditor', 'None — no CPA firm has been engaged'],
      ['Auditor Opinion', 'NO INDEPENDENT AUDITOR OPINION', RED], ['Status', 'SAMPLE / DEMO ONLY', RED], ['Document ID', it.documentId], ['Generated', o.date || today()]], { lw: 145, max: 310 }).svg;
    var by = y + 330;
    ['Security', 'Availability', 'Confidentiality'].forEach(function (c, i) {
      var x = 70 + i * 155;
      s += '<rect x="' + x + '" y="' + by + '" width="140" height="44" fill="none" stroke="' + PURPLE + '" stroke-dasharray="3 2"/>' + text(x + 70, by + 20, c, { size: 11, weight: 700, fill: NAVY, anchor: 'middle' }) + text(x + 70, by + 34, 'demo category — not examined', { size: 7.5, fill: MUTED, anchor: 'middle' });
    });
    return frame(it, s, Object.assign({
      statement: 'This is a CAT.6 project demonstration and is not an independent SOC 2 examination report. It contains no auditor opinion.',
      statementZh: '本文件為 CAT.6 專題展示用封面範本，不是獨立的 SOC 2 檢查報告，亦不含任何會計師意見。' }, o));
  }
  var GEN = { iso27001: iso27001, iso27017: iso27017, vapt: vapt, soc2: soc2 };
  function svg(id, o) { var it = C.data.compliance.items.filter(function (x) { return x.id === id; })[0]; if (!it || !GEN[id]) return null; return GEN[id](it, o || {}); }
  C.services.demoDocs = { svg: svg, lookupUrl: lookupUrl, ids: Object.keys(GEN) };
})(globalThis.CAT6);
