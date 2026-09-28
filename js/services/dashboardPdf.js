/* Dashboard Analysis Snapshot → PDF (direct download; not window.print, not a screenshot of the page).
 *
 * Pipeline:  View Model (the object the Dashboard is showing) → A4 page layout (flowing blocks with page breaks,
 *            header / footer, "Page X of Y") → one SVG per page (print-friendly light CAT.6 theme, vector charts drawn
 *            from the View Model with the report chart library) → rasterized per page at ~190 dpi (2.6× of A4 points)
 *            → JPEG → minimal PDF 1.4 writer (one image per page) → Blob download.
 * Chinese text is drawn by the browser's own fonts during rasterization, so no multi-MB CJK font has to be embedded.
 * Only View Model data enters the PDF — never configuration, tokens or keys. Temporary canvases / object URLs are
 * released after each page. */
(function (C) {
  var PW = 595.28, PH = 841.89, M = 40, TOP = 74, BOTTOM = 790, CW = PW - 2 * M;
  var FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Noto Sans CJK TC", "Heiti TC", system-ui, sans-serif';
  var INK = '#16161D', MUTED = '#5B5B66', LINE = '#E2E2EA', ACCENT = '#4B3FB8', ACCENT_BG = '#F3F1FF';
  var measureCtx = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ctx() { if (!measureCtx) { var c = document.createElement('canvas'); c.width = c.height = 1; measureCtx = c.getContext('2d'); } return measureCtx; }
  function width(text, size, weight) { var c = ctx(); c.font = (weight || 400) + ' ' + size + 'px ' + FONT; return c.measureText(String(text)).width; }
  /* Greedy wrap that works for CJK (break anywhere) and Latin (prefer spaces). */
  function wrap(text, maxW, size, weight) {
    var out = [], line = '', words = String(text == null ? '' : text).split(/(\s+)/);
    words.forEach(function (w) {
      if (width(line + w, size, weight) <= maxW) { line += w; return; }
      if (line.trim()) { out.push(line.replace(/\s+$/, '')); line = ''; }
      w = w.replace(/^\s+/, '');
      while (width(w, size, weight) > maxW) { var k = 1; while (k < w.length && width(w.slice(0, k + 1), size, weight) <= maxW) k++; out.push(w.slice(0, k)); w = w.slice(k); }
      line = w;
    });
    if (line.trim() || !out.length) out.push(line);
    return out;
  }
  function textLines(lines, x, y, size, opts) {
    opts = opts || {};
    return lines.map(function (l, i) { return '<text x="' + x + '" y="' + (y + i * size * 1.45) + '" font-size="' + size + '" font-weight="' + (opts.weight || 400) + '" fill="' + (opts.color || INK) + '"' + (opts.anchor ? ' text-anchor="' + opts.anchor + '"' : '') + '>' + esc(l) + '</text>'; }).join('');
  }
  function snapshotId(d) {
    var a = new Uint8Array(5), AL = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', s = ''; crypto.getRandomValues(a); for (var i = 0; i < 5; i++) s += AL[a[i] & 31];
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'DASH-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + s;
  }

  /* ---------- blocks: { h, draw(y) → svg } ; table blocks can split across pages ---------- */
  function heading(t, sub) {
    var h = 26 + (sub ? 14 : 0);
    return { h: h, keepWithNext: true, draw: function (y) { return '<rect x="' + M + '" y="' + (y + 2) + '" width="3" height="16" fill="' + ACCENT + '"/>' + textLines([t], M + 10, y + 15, 13, { weight: 700 }) + (sub ? textLines([sub], M + 10, y + 31, 8.5, { color: MUTED }) : ''); } };
  }
  function para(t, opts) {
    opts = opts || {}; var size = opts.size || 9.5, lines = wrap(t, CW - (opts.box ? 20 : 0), size), h = lines.length * size * 1.45 + (opts.box ? 16 : 6);
    return { h: h, draw: function (y) {
      return (opts.box ? '<rect x="' + M + '" y="' + y + '" width="' + CW + '" height="' + (h - 4) + '" fill="' + (opts.warn ? '#FFF7E0' : ACCENT_BG) + '" stroke="' + (opts.warn ? '#B8860B' : '#D6D1F5') + '" rx="3"/>' : '') +
        textLines(lines, M + (opts.box ? 10 : 0), y + (opts.box ? 8 : 0) + size, size, { color: opts.color || INK, weight: opts.weight });
    } };
  }
  function kvBlock(rows) {
    var colW = CW / 2, lh = 12, items = rows.map(function (r) { return { k: r[0], lines: wrap(r[1], colW - 14, 9.5) }; });
    var rowsH = []; for (var i = 0; i < items.length; i += 2) rowsH.push(Math.max(items[i].lines.length, items[i + 1] ? items[i + 1].lines.length : 1) * lh + 18);
    return { h: rowsH.reduce(function (a, b) { return a + b; }, 0) + 4, draw: function (y) {
      var out = '', yy = y;
      for (var i = 0; i < items.length; i += 2) {
        [items[i], items[i + 1]].forEach(function (it, j) { if (!it) return; var x = M + j * colW; out += textLines([it.k], x, yy + 9, 7.5, { color: MUTED }) + textLines(it.lines, x, yy + 21, 9.5, { weight: 500 }); });
        yy += rowsH[i / 2]; out += '<line x1="' + M + '" x2="' + (M + CW) + '" y1="' + (yy - 3) + '" y2="' + (yy - 3) + '" stroke="' + LINE + '"/>';
      }
      return out;
    } };
  }
  function kpiGrid(kpis) {
    var cols = 3, gap = 8, w = (CW - gap * (cols - 1)) / cols, h = 64, rows = Math.ceil(kpis.length / cols);
    return { h: rows * (h + gap), draw: function (y) {
      return kpis.map(function (k, i) {
        var x = M + (i % cols) * (w + gap), yy = y + Math.floor(i / cols) * (h + gap), empty = !!k.empty;
        return '<rect x="' + x + '" y="' + yy + '" width="' + w + '" height="' + h + '" rx="4" fill="' + (k.featured ? ACCENT_BG : '#FFFFFF') + '" stroke="' + (k.featured ? '#B8AEF5' : LINE) + '"/>' +
          textLines([k.label], x + 10, yy + 15, 8, { color: MUTED, weight: 600 }) +
          textLines([k.text], x + 10, yy + 38, empty ? 11 : 19, { weight: 700, color: empty ? '#8A6A00' : INK }) +
          textLines(wrap(k.meta || '', w - 20, 7).slice(0, 1), x + 10, yy + 53, 7, { color: MUTED }) +
          (k.src ? textLines([k.src === 'CAT6_DEFAULT' ? '◇ CAT6_DEFAULT' : k.src === 'CALCULATED' ? '∑ CALCULATED' : k.src], x + w - 8, yy + 15, 6.5, { color: k.src === 'CAT6_DEFAULT' ? '#8A6A00' : ACCENT, anchor: 'end', weight: 600 }) : '');
      }).join('');
    } };
  }
  /* Embed a report-chart SVG string, scaled to the content width (vector, never cropped). */
  function chartBlock(svg, caption, maxW) {
    var vb = /viewBox="([\d.\s-]+)"/.exec(svg), dims = vb ? vb[1].trim().split(/\s+/).map(Number) : [0, 0, 640, 200];
    var w = Math.min(maxW || CW, CW), h = w * dims[3] / dims[2], capLines = caption ? wrap(caption, CW, 8) : [];
    var inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return { h: h + 8 + capLines.length * 11.6 + 6, draw: function (y) {
      var x = M + (CW - w) / 2;
      return '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="' + dims.join(' ') + '" overflow="visible">' + inner + '</svg>' + textLines(capLines, M, y + h + 16, 8, { color: MUTED });
    } };
  }
  function table(cols, rows) {
    var fs = 8, lh = 11, pad = 5, total = cols.reduce(function (a, c) { return a + c.w; }, 0), ws = cols.map(function (c) { return c.w / total * CW; });
    var headH = 18, rowH = rows.map(function (r) { return Math.max.apply(null, cols.map(function (c, i) { return wrap(r[c.key], ws[i] - 2 * pad, fs).length; })) * lh + 2 * pad; });
    function draw(y, from, to) {
      var out = '<rect x="' + M + '" y="' + y + '" width="' + CW + '" height="' + headH + '" fill="#EEEBFF"/>', x = M;
      cols.forEach(function (c, i) { out += textLines([c.label], x + pad, y + 12, 7.5, { weight: 700, color: '#1E1A4D' }); x += ws[i]; });
      var yy = y + headH;
      for (var r = from; r < to; r++) {
        x = M; if ((r - from) % 2) out += '<rect x="' + M + '" y="' + yy + '" width="' + CW + '" height="' + rowH[r] + '" fill="#FAFAFD"/>';
        cols.forEach(function (c, i) { out += textLines(wrap(rows[r][c.key], ws[i] - 2 * pad, fs), x + pad, yy + pad + 8, fs, { color: c.color ? c.color(rows[r]) : INK, weight: c.bold ? 600 : 400 }); x += ws[i]; });
        yy += rowH[r]; out += '<line x1="' + M + '" x2="' + (M + CW) + '" y1="' + yy + '" y2="' + yy + '" stroke="' + LINE + '"/>';
      }
      return out;
    }
    function block(from, to) {
      var h = headH + rowH.slice(from, to).reduce(function (a, b) { return a + b; }, 0) + 8;
      return { h: h, draw: function (y) { return draw(y, from, to); },
        split: function (avail) { var used = headH, k = from; while (k < to && used + rowH[k] <= avail - 8) { used += rowH[k]; k++; } if (k === from || k === to) return null; return [block(from, k), block(k, to)]; } };
    }
    return block(0, rows.length);
  }
  function lineChart(points, label) {
    var W = 640, H = 200, m = { l: 40, r: 16, t: 14, b: 34 }, iw = W - m.l - m.r, ih = H - m.t - m.b, max = Math.max.apply(null, points.map(function (p) { return p.v; }).concat([1]));
    var X = function (i) { return m.l + (points.length > 1 ? iw * i / (points.length - 1) : iw / 2); }, Y = function (v) { return m.t + ih * (1 - v / max); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">';
    for (var k = 0; k <= 4; k++) { var v = max * k / 4; s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#E6E6EE"/><text x="' + (m.l - 6) + '" y="' + (Y(v) + 3) + '" font-size="9" text-anchor="end" fill="#555">' + Math.round(v * 10) / 10 + '</text>'; }
    s += '<path d="' + points.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' ') + '" fill="none" stroke="#5B45D6" stroke-width="2.5"/>';
    points.forEach(function (p, i) { s += '<circle cx="' + X(i) + '" cy="' + Y(p.v) + '" r="4" fill="#5B45D6"/><text x="' + X(i) + '" y="' + (Y(p.v) - 8) + '" font-size="9" text-anchor="middle" fill="#222">' + p.v + '</text><text x="' + X(i) + '" y="' + (H - 12) + '" font-size="9" text-anchor="middle" fill="#444">' + esc(p.label) + '</text>'; });
    return s + '</svg>';
  }

  /* ---------- content from the View Model ---------- */
  function blocks(vm, sid) {
    var RC = C.charts.report, F = C.util.format, SEV = RC.SEV, B = [];
    var m = vm.meta;
    B.push({ h: 58, draw: function (y) { return textLines(['Dashboard Analysis Snapshot'], M, y + 24, 22, { weight: 700 }) + textLines(['資安風險儀表板分析快照 · Visual analytics snapshot of the CAT.6 Dashboard（非正式評估報告）'], M, y + 44, 9, { color: MUTED }); } });
    B.push(kvBlock([['Organization 組織', m.organization || '—'], ['Assessment 評估', m.assessmentName || '—'], ['Assessment Scope 範圍', m.scope || '—'], ['Assessment Date 評估日期', m.assessmentDate || '—'],
      ['Generated 產生時間', m.generatedAtLocal], ['Snapshot ID', sid]]));
    if (vm.usesDefaults) B.push(para('This analysis contains CAT.6 default / assumed values. 標示 CAT6_DEFAULT 的數值為 CAT.6 示範 / 假設值，不代表組織實際狀況。', { box: true, warn: true, size: 8.5 }));
    B.push(heading('Risk Summary 風險摘要'));
    var c = vm.counts;
    B.push(para('共 ' + vm.total + ' 個風險情境，已評分 ' + vm.scored.length + ' 個：Critical ' + c.CRITICAL + '、High ' + c.HIGH + '、Moderate ' + c.MEDIUM + '、Low ' + c.LOW + (vm.unscored ? '；' + vm.unscored + ' 個缺少 Likelihood / Impact（DATA REQUIRED）' : '') + '。' +
      (vm.scored.length ? '最高風險為 ' + vm.scored[0].id + '（' + vm.scored[0].score + '，' + vm.scored[0].band.label + '）。' : '') + ' 風險等級依 CAT.6 5×5 平台準則（L × I，非 ISO / NIST 官方分數）。'));
    B.push(heading('KPI Cards 關鍵指標'));
    B.push(kpiGrid(vm.kpis));
    if (vm.scored.length) {
      B.push(heading('Risk Matrix 5×5 風險矩陣', '形狀與文字標示等級（● Low · ■ Moderate · ▲ High · ◆ Critical），不只依賴顏色'));
      B.push(chartBlock(RC.matrix(vm.scored, '5×5 risk matrix'), vm.scored.map(function (r) { return r.id + ' L' + r.likelihood + '×I' + r.impact + ' ' + r.band.label; }).join('；'), 300));
      B.push(heading('Risk Distribution 風險等級分布'));
      B.push(chartBlock(RC.hbars([['CRITICAL', 'Critical'], ['HIGH', 'High'], ['MEDIUM', 'Moderate'], ['LOW', 'Low']].map(function (b) { return { label: b[1], value: c[b[0]], text: c[b[0]] + ' 件', color: SEV[b[0]] }; }), { max: Math.max(1, vm.scored.length), label: 'Risk distribution' })));
      B.push(heading('Risk Scores 風險情境分數', 'Risk Score = Likelihood × Impact（1–25）'));
      B.push(chartBlock(RC.hbars(vm.scored.map(function (r) { return { label: r.id, value: r.score, text: r.score + ' · ' + r.band.label, color: SEV[r.band.id] }; }), { max: 25, label: 'Risk scores' })));
      B.push(heading('Top Risk Scenarios'));
      B.push(table([{ key: 'id', label: 'Risk ID', w: 12, bold: true }, { key: 'scenario', label: 'Scenario', w: 46 }, { key: 'li', label: 'L × I', w: 10 }, { key: 'score', label: 'Score', w: 9 }, { key: 'level', label: 'Level', w: 11, color: function (r) { return SEV[r.band]; } }, { key: 'owner', label: 'Owner', w: 12 }],
        vm.scored.slice(0, 10).map(function (r) { return { id: r.id, scenario: r.scenario || '', li: r.likelihood + ' × ' + r.impact, score: String(r.score), level: r.band.label, band: r.band.id, owner: r.owner || '—' }; })));
    } else B.push(para('尚無已評分的風險情境（DATA REQUIRED）。', { box: true, warn: true }));
    if (vm.snapshots.length >= 2) { B.push(heading('Risk Trend 風險趨勢', 'High + Critical 情境數 / 季' + (vm.trendSource === 'CAT6_DEFAULT' ? '（含 CAT.6 示範快照）' : ''))); B.push(chartBlock(lineChart(vm.snapshots.map(function (s) { return { label: s.label, v: s.highCritical }; }), 'Risk trend'))); }
    B.push(heading('Framework Coverage 框架覆蓋', '有使用該框架評估的風險情境比例'));
    B.push(chartBlock(RC.hbars(vm.coverage.map(function (f) { return { label: f.short, value: f.ratio, text: F.pct(f.ratio) + '（' + f.n + ' / ' + vm.total + '）' }; }), { max: 1, label: 'Framework coverage' })));
    B.push(heading('Risk Treatment Summary 風險處理摘要'));
    var ts = vm.treatment.summary;
    B.push(chartBlock(RC.hbars([['OPEN', '進行中'], ['OVERDUE', '逾期'], ['COMPLETED', '已完成'], ['CANCELLED', '取消']].map(function (k) { return { label: k[1], value: ts[k[0]], text: ts[k[0]] + ' 項', color: k[0] === 'OVERDUE' ? SEV.CRITICAL : k[0] === 'COMPLETED' ? SEV.LOW : '#5B45D6' }; }), { max: Math.max(1, vm.treatment.total), label: 'Treatment status' })));
    B.push(para('處理計畫 ' + vm.treatment.total + ' 項（' + Object.keys(vm.treatment.byStrategy).map(function (k) { return k + ' ' + vm.treatment.byStrategy[k]; }).join('、') + '）。' + (vm.treatment.untreatedHigh.length ? '尚無處理計畫的 High / Critical 風險：' + vm.treatment.untreatedHigh.join('、') + '。' : '所有 High / Critical 風險皆已有處理計畫或接受決策。')));
    B.push(heading('Assessment Status 風險情境狀態'));
    B.push(chartBlock(RC.hbars(vm.status.map(function (s) { return { label: s.status, value: s.n, text: String(s.n) }; }), { max: Math.max(1, vm.total), label: 'Assessment status' })));
    var FR = vm.fair;
    if (FR.mode === 'runs') {
      B.push(heading('FAIR Summary 量化摘要', FR.scenarios.length + ' 個情境 · 各取最新一次蒙地卡羅模擬（Annual Risk）'));
      B.push(table([{ key: 'id', label: 'Scenario', w: 12, bold: true }, { key: 'name', label: 'Name', w: 26 }, { key: 'risk', label: 'Risk', w: 9 }, { key: 'mean', label: 'Mean ALE', w: 14 }, { key: 'p50', label: 'P50', w: 13 }, { key: 'p90', label: 'P90', w: 13 }, { key: 'src', label: 'Data', w: 13, color: function (r) { return r.src === 'CAT6_DEFAULT' ? '#8A6A00' : INK; } }],
        FR.scenarios.map(function (r) { var a = r.summaries.AnnualRisk; return { id: r.scenarioId, name: r.scenarioName || '—', risk: r.riskId || '—', mean: F.currency(a.Mean, r.currency), p50: F.currency(a.P50, r.currency), p90: F.currency(a.P90, r.currency), src: r.assumptionStatus === 'ORGANIZATION_DATA' ? r.dataSource : 'CAT6_DEFAULT' }; })));
      if (FR.scenarios.length > 1) B.push(FR.sameCurrency ? chartBlock(RC.ranges(FR.scenarios.map(function (r) { var a = r.summaries.AnnualRisk; return { label: r.scenarioId, p50: a.P50, mean: a.Mean, p90: a.P90, p95: a.P95 }; }), { label: 'FAIR comparison' }), 'P50–P95 區間、Mean（菱形）、P90（直線）· ' + FR.scenarios[0].currency)
        : para('Currency normalization required. 各情境幣別不一致，未繪製比較圖。', { box: true, warn: true }));
      if (FR.scenarios.some(function (r) { return r.assumptionStatus !== 'ORGANIZATION_DATA'; })) B.push(para('CAT.6 ASSUMPTION / SIMULATED VALUE：標示 CAT6_DEFAULT 的情境，其頻率、機率或金額為 CAT.6 推估值，不是企業實際財務資料。模擬結果為損失機率分布，不代表確定會發生的損失。', { box: true, warn: true, size: 8.5 }));
    }
    var R = vm.readiness;
    B.push(heading('CAT.6 Readiness Indicator', 'ISO/IEC 27001 導入進度 · 非 ISO 官方評分，不預測驗證結果'));
    B.push(chartBlock(RC.hbars(Object.keys(R.areas).map(function (k) { var a = R.areas[k]; return { label: C.calc.isoReadiness.LABELS[k], value: a.value, text: a.value == null ? 'DATA REQUIRED' : F.pct(a.value) }; }), { max: 1, label: 'Readiness areas' }), 'Overall：' + (R.overall == null ? 'DATA REQUIRED' : F.pct(R.overall)) + '（' + R.basedOn + ' / ' + R.of + ' 面向有資料，等權平均）'));
    B.push(heading('Data Source & Assumption Notice 資料來源與假設'));
    var PV = C.util.provenance, tot = vm.sourceTotal || 1;
    B.push(chartBlock(RC.hbars(Object.keys(vm.sourceTally).map(function (k) { return { label: k, value: vm.sourceTally[k], text: vm.sourceTally[k] + '（' + F.pct(vm.sourceTally[k] / tot) + '）', color: k === 'CAT6_DEFAULT' ? '#B8860B' : k === 'CALCULATED' ? '#5B45D6' : k === 'FILE_IMPORT' ? '#4B8BD6' : '#2F8F7A' }; }), { max: tot, label: 'Data sources' })));
    B.push(para('USER_INPUT = 組織輸入；FILE_IMPORT = 檔案匯入；CAT6_DEFAULT = CAT.6 DEFAULT / ASSUMED VALUE；CAT6_DEFAULT 以外的分數、等級、覆蓋率與模擬結果皆為 CALCULATED。本快照為 Dashboard 在產生當下的視覺化分析，不是正式評估報告；正式報告請至 Report Center 產生（含 Report ID 與 SHA-256）。', { size: 8.5, color: MUTED }));
    return B;
  }

  function paginate(B) {
    var pages = [[]], y = TOP;
    function push(b) { pages[pages.length - 1].push({ b: b, y: y }); y += b.h + 6; }
    for (var i = 0; i < B.length; i++) {
      var b = B[i], nx = B[i + 1], need = b.h + (b.keepWithNext && nx ? (nx.split ? Math.min(nx.h, 60) : Math.min(nx.h, BOTTOM - TOP - b.h)) + 12 : 0);   /* a heading never ends a page alone */
      if (y + need > BOTTOM && y > TOP) {
        if (b.split) { var parts = b.split(BOTTOM - y); if (parts) { push(parts[0]); pages.push([]); y = TOP; B.splice(i + 1, 0, parts[1]); continue; } }
        pages.push([]); y = TOP;
      }
      if (b.h > BOTTOM - TOP && b.split) { var p2 = b.split(BOTTOM - y); if (p2) { push(p2[0]); pages.push([]); y = TOP; B.splice(i + 1, 0, p2[1]); continue; } }
      push(b);
    }
    return pages.filter(function (p) { return p.length; });
  }
  function pageSvg(items, n, total, vm, sid, logo) {
    var m = vm.meta, mark = logo ? '<image href="' + logo + '" x="' + M + '" y="20" height="20" width="20" preserveAspectRatio="xMidYMid meet"/>'
      : '<path transform="translate(' + M + ' 20) scale(0.625)" d="M16 2l12 7v14l-12 7-12-7V9z" fill="' + ACCENT + '"/><path transform="translate(' + M + ' 20) scale(0.625)" d="M16 9l6 3.5v7L16 23l-6-3.5v-7z" fill="#fff"/>';
    var foot = [m.organization, m.assessmentName].filter(Boolean).join(' · ');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + PW + '" height="' + PH + '" viewBox="0 0 ' + PW + ' ' + PH + '" font-family=\'' + FONT.replace(/'/g, '') + '\'>' +
      '<rect width="100%" height="100%" fill="#FFFFFF"/>' + mark +
      textLines(['CAT.6 Cybersecurity'], M + 26, 35, 10.5, { weight: 700, color: ACCENT }) + textLines(['Dashboard Analysis Snapshot'], PW - M, 35, 9, { color: MUTED, anchor: 'end', weight: 600 }) +
      '<line x1="' + M + '" x2="' + (PW - M) + '" y1="50" y2="50" stroke="' + ACCENT + '" stroke-width="1.2"/>' +
      items.map(function (it) { return it.b.draw(it.y); }).join('') +
      '<line x1="' + M + '" x2="' + (PW - M) + '" y1="806" y2="806" stroke="' + LINE + '"/>' +
      textLines(wrap(foot, 400, 7.5).slice(0, 1), M, 819, 7.5, { color: MUTED }) + textLines(['Generated ' + m.generatedAtLocal + ' · ' + sid], M, 830, 7, { color: MUTED }) +
      textLines(['Page ' + n + ' of ' + total], PW - M, 824, 8.5, { anchor: 'end', weight: 600 }) + '</svg>';
  }

  /* SVG page → JPEG bytes. */
  function raster(svg, scale) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
      img.onload = function () {
        var cv = document.createElement('canvas'); cv.width = Math.round(PW * scale); cv.height = Math.round(PH * scale);
        var g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob(function (b) {
          var w = cv.width, h = cv.height; cv.width = cv.height = 0;   // release pixel memory
          if (!b) return reject(new Error('無法將頁面轉為影像'));
          b.arrayBuffer().then(function (buf) { resolve({ bytes: new Uint8Array(buf), w: w, h: h }); }, reject);
        }, 'image/jpeg', 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('頁面 SVG 無法繪製')); };
      img.src = url;
    });
  }

  /* Minimal PDF 1.4: one full-page JPEG (DCTDecode) per page, A4 MediaBox. */
  function pdf(images, info) {
    var enc = new TextEncoder(), parts = [], offsets = [], len = 0;
    function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(n, body) { offsets[n] = len; add(n + ' 0 obj\n'); body.forEach(add); add('\nendobj\n'); }
    var n = images.length, pagesId = 2, first = 3, str = function (s) { return '(' + String(s).replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?') + ')'; };
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    var kids = []; for (var i = 0; i < n; i++) kids.push((first + i * 3) + ' 0 R');
    obj(pagesId, ['<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>']);
    images.forEach(function (im, i) {
      var p = first + i * 3, c = p + 1, x = p + 2, content = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im0 Do Q';
      obj(p, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + x + ' 0 R >> >> /Contents ' + c + ' 0 R >>']);
      obj(c, ['<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream']);
      obj(x, ['<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.bytes.length + ' >>\nstream\n', im.bytes, '\nendstream']);
    });
    var infoId = first + n * 3;
    obj(infoId, ['<< /Title ' + str(info.title) + ' /Subject ' + str(info.subject) + ' /Creator (CAT.6 Cybersecurity) /Producer (CAT.6 Dashboard PDF) >>']);
    var xref = len, size = infoId + 1, x2 = ['xref\n0 ' + size + '\n0000000000 65535 f \n'];
    for (var k = 1; k < size; k++) x2.push(String(offsets[k]).padStart(10, '0') + ' 00000 n \n');
    add(x2.join('')); add('trailer\n<< /Size ' + size + ' /Root 1 0 R /Info ' + infoId + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    var out = new Uint8Array(len), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; });
    return out;
  }
  function logoDataUrl() {
    var B = C.ui && C.ui.brand; if (!B || !B.official || !B.official()) return Promise.resolve(null);
    var a = (C.data.brand || {}).assets || {}, path = a.mark || a.logo; if (!path) return Promise.resolve(null);
    return fetch(B.url(path)).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { return b ? new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); }) : null; }).catch(function () { return null; });
  }
  var tick = function () { return new Promise(function (r) { setTimeout(r, 0); }); };

  /* Build (without downloading) — used by export() and by tests. */
  function build(vm, opts) {
    opts = opts || {};
    var sid = opts.snapshotId || snapshotId(new Date(vm.meta.generatedAt)), scale = opts.scale || (window.innerWidth < 768 ? 2 : 2.6);
    return logoDataUrl().then(function (logo) {
      var pages = paginate(blocks(vm, sid)), imgs = [], svgs = pages.map(function (p, i) { return pageSvg(p, i + 1, pages.length, vm, sid, logo); });
      return svgs.reduce(function (pr, svg, i) {
        return pr.then(function () { if (opts.onProgress) opts.onProgress(i + 1, svgs.length); return tick().then(function () { return raster(svg, scale); }); }).then(function (im) { imgs.push(im); });
      }, Promise.resolve()).then(function () {
        measureCtx = null;
        return { snapshotId: sid, pages: pages.length, svgs: svgs, bytes: pdf(imgs, { title: 'CAT.6 Dashboard Analysis Snapshot ' + sid, subject: 'Dashboard Analysis Snapshot' }) };
      });
    });
  }
  function exportPdf(vm, opts) {
    return build(vm, opts).then(function (r) {
      var name = r.snapshotId + '_CAT6_Dashboard.pdf', url = URL.createObjectURL(new Blob([r.bytes], { type: 'application/pdf' })), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
      return { fileName: name, pages: r.pages, snapshotId: r.snapshotId, size: r.bytes.length };
    });
  }
  C.services.dashboardPdf = { build: build, export: exportPdf, paginate: paginate, blocks: blocks, wrap: wrap };
})(globalThis.CAT6);
