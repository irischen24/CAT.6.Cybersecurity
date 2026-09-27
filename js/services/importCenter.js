/* Data Import Center — one pipeline for CSV and XLSX:
 *   parseFile → pickSheet → autoMap (column mapping) → validate (row-level errors) → preview → commit.
 * Invalid rows are never dropped silently: every problem becomes an error row with
 * Row / Column / Current Value / Error / Expected Format / Suggested Correction, and commit requires
 * explicit acknowledgement when errors exist. Imported records carry source = FILE_IMPORT. */
(function (C) {
  var LEVELS = ['VL', 'L', 'M', 'H', 'VH'];
  var LEVEL_ALIASES = { 'VERY LOW': 'VL', 'LOW': 'L', 'MODERATE': 'M', 'MEDIUM': 'M', 'HIGH': 'H', 'VERY HIGH': 'VH', '極低': 'VL', '低': 'L', '中': 'M', '高': 'H', '極高': 'VH' };
  var FW = ['ISO27001', 'CSF2', 'SP80030', 'CISRAM', 'CISV81', 'FAIR'];
  var STATUS_IMPL = ['NOT_ASSESSED', 'NOT_IMPLEMENTED', 'PARTIAL', 'IMPLEMENTED', 'NOT_APPLICABLE'];
  var CIS_IDS = function () { return C.data.cis.controls.map(function (c) { return c.id; }); };

  /* Column definition helpers */
  function col(key, label, type, o) { return Object.assign({ key: key, label: label, type: type, aliases: [] }, o || {}); }
  var DATASETS = {
    risks: { service: 'RA', label: 'Risk Register 風險登錄表', collection: 'risks', idPrefix: 'RS', template: 'CAT6_Risk_Assessment_Template', columns: [
      col('id', 'Risk ID', 'id', { aliases: ['risk_id', '風險編號'], help: '留白則自動編號；與現有 ID 相同則更新' }),
      col('scenario', 'Scenario', 'text', { required: true, aliases: ['risk_scenario', '情境', '風險情境'] }),
      col('asset', 'Asset', 'text', { required: true, aliases: ['資產'] }),
      col('threatSource', 'Threat Source', 'text', { aliases: ['threat_source', '威脅來源'] }),
      col('threatEvent', 'Threat Event', 'text', { aliases: ['threat_event', '威脅事件'] }),
      col('vulnerability', 'Vulnerability', 'text', { aliases: ['弱點'] }),
      col('existingControls', 'Existing Controls', 'text', { aliases: ['existing_controls', '現有控制'] }),
      col('likelihood', 'Likelihood', 'int', { required: true, min: 1, max: 5, aliases: ['l', '可能性'] }),
      col('impact', 'Impact', 'int', { required: true, min: 1, max: 5, aliases: ['i', '衝擊'] }),
      col('treatment', 'Treatment', 'enum', { options: ['Accept', 'Avoid', 'Mitigate', 'Share', 'Transfer'], aliases: ['處理方式', 'treatment_strategy'] }),
      col('owner', 'Owner', 'text', { aliases: ['負責人'] }),
      col('dueDate', 'Due Date', 'date', { aliases: ['due_date', '到期日'] }),
      col('status', 'Status', 'enum', { options: ['Draft', 'In review', 'Assessed', 'Treatment planned', 'Closed'], aliases: ['狀態'] }),
      col('residualLikelihood', 'Residual Likelihood', 'int', { min: 1, max: 5, aliases: ['residual_likelihood', '殘餘可能性'] }),
      col('residualImpact', 'Residual Impact', 'int', { min: 1, max: 5, aliases: ['residual_impact', '殘餘衝擊'] }),
      col('frameworks', 'Frameworks', 'list', { options: FW, aliases: ['框架'] }),
      col('cisControls', 'CIS Controls', 'list', { optionsFn: CIS_IDS, aliases: ['cis_controls'] })
    ] },
    nist: { service: 'RA', label: 'NIST SP 800-30 評估', collection: 'nist', idPrefix: 'NA', template: 'CAT6_NIST_SP80030_Template', columns: [
      col('id', 'Assessment ID', 'id', { aliases: ['assessment_id'] }),
      col('riskId', 'Risk ID', 'ref', { ref: 'risks', aliases: ['risk_id'] }),
      col('sourceType', 'Source Type', 'enum', { required: true, options: ['ADV', 'NONADV'], aliases: ['source_type', 'adversarial'], help: 'ADV = 敵意（G-2）；NONADV = 非敵意（G-3）' }),
      col('threatSource', 'Threat Source', 'text', { required: true, aliases: ['threat_source'] }),
      col('threatEvent', 'Threat Event', 'text', { required: true, aliases: ['threat_event'] }),
      col('vulnerability', 'Vulnerability', 'text', {}),
      col('vulnSeverity', 'Vulnerability Severity', 'level', { aliases: ['vuln_severity'] }),
      col('predisposing', 'Predisposing Condition', 'text', { aliases: ['predisposing_condition'] }),
      col('controls', 'Existing Controls', 'text', { aliases: ['existing_controls'] }),
      col('initiation', 'Initiation / Occurrence Likelihood', 'level', { required: true, aliases: ['initiation', 'occurrence', 'likelihood_initiation'] }),
      col('adverseImpact', 'Adverse Impact Likelihood', 'level', { required: true, aliases: ['adverse_impact', 'likelihood_adverse_impact'] }),
      col('impact', 'Impact Level', 'level', { required: true, aliases: ['impact', 'impact_level'] })
    ] },
    cisram: { service: 'RA', label: 'CIS RAM Risk Register', collection: 'cisram', idPrefix: 'CR', template: 'CAT6_CIS_RAM_Template', columns: [
      col('id', 'CIS RAM ID', 'id', { aliases: ['cis_ram_id'] }),
      col('riskId', 'Risk ID', 'ref', { ref: 'risks', aliases: ['risk_id'] }),
      col('scenario', 'Scenario', 'text', { required: true }), col('asset', 'Asset', 'text', { required: true }),
      col('threat', 'Threat', 'text', {}), col('vulnerability', 'Vulnerability', 'text', {}), col('impact', 'Impact Description', 'text', { aliases: ['impact_description'] }),
      col('safeguards', 'Existing Safeguards', 'list', { optionsFn: CIS_IDS, aliases: ['existing_safeguards'] }),
      col('inherentLikelihood', 'Inherent Likelihood', 'int', { required: true, min: 1, max: 5, aliases: ['inherent_likelihood'] }),
      col('inherentImpact', 'Inherent Impact', 'int', { required: true, min: 1, max: 5, aliases: ['inherent_impact'] }),
      col('safeguardAssessment', 'Safeguard Assessment', 'text', { aliases: ['safeguard_assessment'] }),
      col('residualLikelihood', 'Residual Likelihood', 'int', { min: 1, max: 5, aliases: ['residual_likelihood'] }),
      col('residualImpact', 'Residual Impact', 'int', { min: 1, max: 5, aliases: ['residual_impact'] }),
      col('recommended', 'Recommended Safeguards', 'text', { aliases: ['recommended_safeguards'] })
    ] },
    cisControls: { service: 'RA', label: 'CIS Controls 控制評估', collection: 'cisControls', template: 'CAT6_CIS_Controls_Template', columns: [
      col('id', 'Control ID', 'enum', { required: true, optionsFn: CIS_IDS, aliases: ['control_id', 'control'] }),
      col('ig1', 'IG1 Status', 'enum', { options: STATUS_IMPL, aliases: ['ig1_status'] }),
      col('ig2', 'IG2 Status', 'enum', { options: STATUS_IMPL, aliases: ['ig2_status'] }),
      col('ig3', 'IG3 Status', 'enum', { options: STATUS_IMPL, aliases: ['ig3_status'] }),
      col('notes', 'Notes', 'text', {})
    ] },
    cisSafeguards: { service: 'RA', label: 'CIS Safeguard 清單（官方活頁簿）', collection: 'cisSafeguards', template: 'CAT6_CIS_Safeguards_Template', columns: [
      col('id', 'Safeguard ID', 'safeguard', { required: true, aliases: ['safeguard_id', 'safeguard'], help: '例如 1.1、4.12' }),
      col('title', 'Title', 'text', { required: true, aliases: ['safeguard_title'] }),
      col('ig1', 'IG1', 'bool', {}), col('ig2', 'IG2', 'bool', {}), col('ig3', 'IG3', 'bool', {}),
      col('status', 'Status', 'enum', { options: STATUS_IMPL, aliases: ['implementation_status'] })
    ] },
    csf: { service: 'RA', label: 'NIST CSF 2.0 Profile', collection: 'csf', template: 'CAT6_NIST_CSF_Template', columns: [
      col('id', 'Category ID', 'enum', { required: true, optionsFn: function () { return C.data.csf.categories.map(function (c) { return c.id; }); }, aliases: ['category_id', 'category'] }),
      col('current', 'Current (0-3)', 'int', { required: true, min: 0, max: 3, aliases: ['current_profile', 'current', 'current (0-4)'] }),
      col('target', 'Target (0-3)', 'int', { required: true, min: 0, max: 3, aliases: ['target_profile', 'target', 'target (0-4)'] }),
      col('action', 'Improvement Action', 'text', { aliases: ['improvement_action'] }), col('owner', 'Owner', 'text', {}), col('dueDate', 'Due Date', 'date', { aliases: ['due_date'] })
    ] },
    fair: { service: 'RA', label: 'FAIR 輸入（三點估計）', special: 'fair', template: 'CAT6_FAIR_Template', columns: [
      col('field', 'field', 'enum', { required: true, options: ['CF', 'PoA', 'Susceptibility', 'PrimaryLoss', 'SecondaryLoss'] }),
      col('min', 'min', 'fairnum', { required: true }), col('mostLikely', 'most_likely', 'fairnum', { required: true, aliases: ['most_likely', 'mode'] }),
      col('max', 'max', 'fairnum', { required: true })
    ] },
    isoClauses: { service: 'ISO', label: 'ISO 27001 條款差異分析', collection: 'isoClauses', template: 'CAT6_ISO27001_Readiness_Template', sheet: 'Gap Assessment', columns: [
      col('id', 'Clause', 'enum', { required: true, optionsFn: function () { return C.data.iso.clauses.map(function (c) { return c.id; }); }, aliases: ['clause_id'] }),
      col('status', 'Status', 'enum', { required: true, options: ['NOT_ASSESSED', 'NOT_IMPLEMENTED', 'PARTIAL', 'IMPLEMENTED'] }),
      col('gapNote', 'Gap Note', 'text', { aliases: ['gap_note', 'gap'] }), col('owner', 'Owner', 'text', {}), col('dueDate', 'Due Date', 'date', { aliases: ['due_date'] })
    ] },
    isoSoa: { service: 'ISO', label: 'Statement of Applicability', collection: 'isoSoa', template: 'CAT6_ISO27001_Readiness_Template', sheet: 'SoA', columns: [
      col('id', 'Control', 'enum', { required: true, optionsFn: function () { return C.data.iso.annexA.map(function (c) { return c.id; }); }, aliases: ['control_id', 'annex_a'] }),
      col('applicable', 'Applicable', 'bool', { required: true }),
      col('justification', 'Justification', 'text', { requiredIf: function (r) { return r.applicable === false; }, help: '排除（Applicable = N）時必填' }),
      col('status', 'Implementation Status', 'enum', { options: ['NOT_IMPLEMENTED', 'PARTIAL', 'IMPLEMENTED'], aliases: ['implementation_status'] })
    ] },
    evidence: { service: 'ISO', label: 'Evidence 證據清冊', collection: 'evidence', idPrefix: 'EV', template: 'CAT6_ISO27001_Readiness_Template', sheet: 'Evidence', columns: [
      col('id', 'Evidence ID', 'id', { aliases: ['evidence_id'] }),
      col('requirement', 'Requirement / Control', 'text', { required: true, aliases: ['control', 'clause'] }),
      col('name', 'Evidence Name', 'text', { required: true, aliases: ['evidence_name'] }), col('description', 'Description', 'text', {}),
      col('owner', 'Owner', 'text', {}), col('date', 'Date', 'date', {}),
      col('status', 'Status', 'enum', { options: ['Draft', 'Submitted', 'Accepted', 'Rejected', 'Expired'] }),
      col('relatedRisk', 'Related Risk', 'ref', { ref: 'risks', aliases: ['related_risk'] }),
      col('framework', 'Framework', 'enum', { options: FW })
    ] },
    findings: { service: 'ISO', label: 'Audit Findings 稽核發現', collection: 'findings', idPrefix: 'FD', template: 'CAT6_ISO27001_Readiness_Template', sheet: 'Findings', columns: [
      col('id', 'Finding ID', 'id', { aliases: ['finding_id'] }), col('auditId', 'Audit ID', 'text', { aliases: ['audit_id'] }), col('clause', 'Clause / Control', 'text', {}),
      col('type', 'Type', 'enum', { required: true, options: ['MAJOR_NC', 'MINOR_NC', 'OFI', 'OBSERVATION'] }),
      col('description', 'Description', 'text', { required: true }), col('status', 'Status', 'enum', { options: ['Open', 'Closed'] }), col('dueDate', 'Due Date', 'date', { aliases: ['due_date'] })
    ] },
    capas: { service: 'ISO', label: 'Corrective Actions 矯正措施', collection: 'capas', idPrefix: 'CA', template: 'CAT6_ISO27001_Readiness_Template', sheet: 'Corrective Actions', columns: [
      col('id', 'CAPA ID', 'id', { aliases: ['capa_id'] }), col('findingId', 'Finding ID', 'ref', { ref: 'findings', required: true, aliases: ['finding_id'] }),
      col('rootCause', 'Root Cause', 'text', { aliases: ['root_cause'] }), col('action', 'Action', 'text', { required: true }),
      col('owner', 'Owner', 'text', {}), col('dueDate', 'Due Date', 'date', { aliases: ['due_date'] }), col('status', 'Status', 'enum', { options: ['Planned', 'In progress', 'Closed'] })
    ] }
  };
  Object.keys(DATASETS).forEach(function (k) { DATASETS[k].id = k; });

  /* ---------- Parsing ---------- */
  function parseFile(file) {
    var name = file.name.toLowerCase();
    if (/\.xls$/.test(name)) return Promise.reject(new Error('不支援舊版 .xls，請在 Excel 另存為 .xlsx 或 .csv。'));
    if (/\.xlsx$/.test(name)) return file.arrayBuffer().then(C.services.xlsx.read);
    if (/\.csv$/.test(name) || file.type === 'text/csv') return file.text().then(function (t) { return [{ name: 'CSV', rows: C.services.csvImport.parseCSV(t) }]; });
    return Promise.reject(new Error('僅支援 .csv 與 .xlsx 檔案。'));
  }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/\[.*?\]|\(.*?\)|（.*?）/g, '').replace(/[\s_\-\/\.]+/g, ''); }
  /* Drop comment rows ("# …") and fully blank rows; keep original spreadsheet row numbers. */
  function dataRows(rows) {
    var out = [], blank = 0, headerIdx = -1;
    rows.forEach(function (r, i) {
      var cells = (r || []).map(function (c) { return c == null ? '' : c; });
      if (!cells.some(function (c) { return String(c).trim() !== ''; })) { if (headerIdx >= 0) blank++; return; }
      if (String(cells[0]).trim().charAt(0) === '#') return;
      if (headerIdx < 0) { headerIdx = i; out.push({ rowNo: i + 1, cells: cells, header: true }); return; }
      out.push({ rowNo: i + 1, cells: cells });
    });
    return { header: out[0] ? out[0].cells.map(function (h) { return String(h).trim(); }) : [], headerRow: out[0] ? out[0].rowNo : 1, rows: out.slice(1), blank: blank };
  }
  function autoMap(ds, header) {
    var map = {}, used = {};
    ds.columns.forEach(function (c) {
      var keys = [c.key, c.label].concat(c.aliases).map(norm);
      var idx = header.findIndex(function (h, i) { return !used[i] && keys.indexOf(norm(h)) >= 0; });
      if (idx >= 0) { map[c.key] = idx; used[idx] = 1; }
    });
    return map;
  }

  /* ---------- Validation ---------- */
  function options(c) { return c.optionsFn ? c.optionsFn() : c.options || []; }
  function convert(c, raw, row) {
    var s = raw == null ? '' : typeof raw === 'string' ? raw.trim() : raw;
    if (s === '') return { empty: true };
    switch (c.type) {
      case 'text': case 'ref': case 'id': return { value: String(s) };
      case 'int': {
        var n = typeof s === 'number' ? s : Number(String(s).replace(/,/g, ''));
        if (!isFinite(n) || Math.round(n) !== n) return { error: '不是整數', expected: '整數 ' + c.min + '–' + c.max, suggestion: '輸入 ' + c.min + '–' + c.max + ' 的整數，不要加單位或小數' };
        if (n < c.min || n > c.max) return { error: '超出範圍', expected: c.min + '–' + c.max, suggestion: '改為 ' + c.min + '–' + c.max + ' 之間的值' };
        return { value: n };
      }
      case 'date': {
        if (typeof s === 'number') { var iso = C.services.xlsx.serialToISO(s); return iso ? { value: iso } : { error: '無效日期', expected: 'YYYY-MM-DD', suggestion: '使用 YYYY-MM-DD 格式' }; }
        var m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.exec(String(s));
        if (!m) return { error: '日期格式錯誤', expected: 'YYYY-MM-DD', suggestion: '例如 2026-12-31' };
        var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        if (d.getUTCMonth() !== +m[2] - 1) return { error: '日期不存在', expected: 'YYYY-MM-DD', suggestion: '檢查月份與日期' };
        return { value: d.toISOString().slice(0, 10) };
      }
      case 'enum': {
        var opts = options(c), up = String(s).trim(), hit = opts.filter(function (o) { return o.toLowerCase() === up.toLowerCase() || o.toLowerCase().replace(/[_ ]/g, '') === up.toLowerCase().replace(/[_ ]/g, ''); })[0];
        if (!hit && /^\d+$/.test(up) && c.key === 'id' && opts[0] && opts[0].indexOf('CIS-') === 0) hit = opts[+up - 1];
        return hit ? { value: hit } : { error: '不在允許值中', expected: opts.length > 8 ? opts.slice(0, 6).join(' / ') + ' …（共 ' + opts.length + ' 項）' : opts.join(' / '), suggestion: '改用允許值之一（大小寫不拘）' };
      }
      case 'level': {
        var u = String(s).trim().toUpperCase(), lv = LEVELS.indexOf(u) >= 0 ? u : LEVEL_ALIASES[u] || LEVEL_ALIASES[String(s).trim()];
        return lv ? { value: lv } : { error: '不是 NIST 等級', expected: 'VL / L / M / H / VH', suggestion: '可填 Very Low / Low / Moderate / High / Very High 或縮寫' };
      }
      case 'bool': {
        var b = String(s).trim().toLowerCase();
        if (s === true || ['y', 'yes', 'true', '1', 'x', '是', '✓'].indexOf(b) >= 0) return { value: true };
        if (s === false || ['n', 'no', 'false', '0', '否', '-'].indexOf(b) >= 0) return { value: false };
        return { error: '不是是 / 否', expected: 'Y / N', suggestion: '填 Y 或 N' };
      }
      case 'list': {
        var items = String(s).split(/[;,，、\n]+/).map(function (x) { return x.trim(); }).filter(Boolean), allowed = options(c), bad = [], out = [];
        items.forEach(function (it) {
          var hit2 = allowed.filter(function (o) { return o.toLowerCase() === it.toLowerCase(); })[0];
          if (!hit2 && /^\d+$/.test(it) && allowed[0] && allowed[0].indexOf('CIS-') === 0) hit2 = allowed[+it - 1];
          if (hit2) out.push(hit2); else bad.push(it);
        });
        return bad.length ? { error: '含未知項目：' + bad.join(', '), expected: '以分號分隔：' + allowed.slice(0, 4).join('; ') + ' …', suggestion: '移除或更正未知項目' } : { value: out };
      }
      case 'safeguard': return /^\d{1,2}\.\d{1,2}$/.test(String(s)) ? { value: String(s) } : { error: 'Safeguard ID 格式錯誤', expected: '控制編號.序號，例如 4.12', suggestion: '使用官方活頁簿的 Safeguard 編號' };
      case 'fairnum': {
        var kind = row && (row.field === 'PoA' || row.field === 'Susceptibility') ? 'prob' : 'num';
        var t = String(s).replace(/[,NT$\s]/g, ''), pct = /%$/.test(t); t = t.replace('%', '');
        if (t === '' || isNaN(Number(t))) return { error: '不是數字', expected: kind === 'prob' ? '0–1 或 0%–100%' : '數字', suggestion: '移除文字與單位' };
        var v = Number(t); if (kind === 'prob' && (pct || v > 1)) v = v / 100;
        return { value: v };
      }
    }
    return { value: s };
  }

  function validate(ds, parsed, map, existing) {
    existing = existing || {};
    var errors = [], valid = [], seen = {}, header = parsed.header;
    ds.columns.filter(function (c) { return c.required && map[c.key] == null; }).forEach(function (c) {
      errors.push({ row: parsed.headerRow, column: c.label, value: '（未對應）', error: '缺少必要欄位', expected: '標題列需有「' + c.label + '」', suggestion: '在欄位對應中指定來源欄，或使用範本 ' + ds.template });
    });
    if (errors.length) return { valid: [], errors: errors, invalidRows: parsed.rows.length, total: parsed.rows.length, blank: parsed.blank };
    parsed.rows.forEach(function (r) {
      var rec = {}, rowErr = [];
      /* enum 'field' first so FAIR numbers know their kind */
      var ordered = ds.columns.slice().sort(function (a, b) { return (a.type === 'fairnum') - (b.type === 'fairnum'); });
      ordered.forEach(function (c) {
        if (map[c.key] == null) return;
        var raw = r.cells[map[c.key]], res = convert(c, raw, rec), colName = header[map[c.key]] || c.label;
        if (res.error) rowErr.push({ row: r.rowNo, column: colName, value: raw === '' || raw == null ? '（空白）' : String(raw), error: res.error, expected: res.expected, suggestion: res.suggestion });
        else if (res.empty) { if (c.required) rowErr.push({ row: r.rowNo, column: colName, value: '（空白）', error: '必填欄位空白', expected: c.label, suggestion: '填入' + c.label }); }
        else rec[c.key] = res.value;
      });
      ds.columns.forEach(function (c) {
        if (c.requiredIf && c.requiredIf(rec) && (rec[c.key] == null || rec[c.key] === ''))
          rowErr.push({ row: r.rowNo, column: c.label, value: '（空白）', error: '條件必填', expected: c.help || c.label, suggestion: '補上' + c.label });
        if (c.type === 'ref' && rec[c.key] && existing[c.ref] && existing[c.ref].indexOf(rec[c.key]) < 0)
          rowErr.push({ row: r.rowNo, column: c.label, value: rec[c.key], error: '參照不存在', expected: '現有 ' + c.ref + ' 的 ID', suggestion: '先匯入 / 建立該筆資料，或留白' });
      });
      if (ds.special === 'fair' && rec.min != null && rec.mostLikely != null && rec.max != null) {
        C.calc.distributions.validateTriangular(rec).forEach(function (e) { rowErr.push({ row: r.rowNo, column: 'min / most_likely / max', value: [rec.min, rec.mostLikely, rec.max].join(' / '), error: e.code, expected: e.expected, suggestion: '檢查三點估計的大小順序' }); });
        if ((rec.field === 'PoA' || rec.field === 'Susceptibility') && (rec.min < 0 || rec.max > 1)) rowErr.push({ row: r.rowNo, column: 'max', value: rec.max, error: '機率超出範圍', expected: '0–1 或 0%–100%', suggestion: '改為百分比或 0–1 小數' });
      }
      var key = rec.id || rec.field;
      if (key) { if (seen[key]) rowErr.push({ row: r.rowNo, column: 'ID', value: key, error: '檔案內重複', expected: '每個 ID 僅一列', suggestion: '合併或刪除重複列（第 ' + seen[key] + ' 列）' }); else seen[key] = r.rowNo; }
      if (rowErr.length) errors = errors.concat(rowErr); else valid.push({ rowNo: r.rowNo, record: rec });
    });
    var bad = {}; errors.forEach(function (e) { if (typeof e.row === 'number' && e.row !== parsed.headerRow) bad[e.row] = 1; });
    return { valid: valid, errors: errors, invalidRows: Object.keys(bad).length, total: parsed.rows.length, blank: parsed.blank };
  }

  /* ---------- Commit ---------- */
  function commit(ds, result, fileName) {
    var W = C.services.workspace;
    if (ds.special === 'fair') {
      return W.load(['fairInputs']).then(function (d) {
        var rec = d.fairInputs[0] || { id: 'fair', fields: C.data.fairDefaults.fields.map(function (f) { return { field: f.field, value: Object.assign({}, f.value), source: 'CAT6_DEFAULT' }; }) };
        result.valid.forEach(function (v) { rec.fields.forEach(function (f) { if (f.field === v.record.field) { f.value = { min: v.record.min, mostLikely: v.record.mostLikely, max: v.record.max }; f.source = 'FILE_IMPORT'; } }); });
        return W.save('fairInputs', rec, { source: 'FILE_IMPORT', verb: '匯入' });
      }).then(function () { return finish(ds, result, fileName, result.valid.length); });
    }
    return W.load([ds.collection]).then(function (d) {
      var list = d[ds.collection], byId = {}; list.forEach(function (r) { byId[r.id] = r; });
      var working = list.slice();
      var recs = result.valid.map(function (v) {
        var r = v.record;
        if (!r.id && ds.idPrefix) { r.id = C.util.dom.nextId(ds.idPrefix, working); }
        var merged = Object.assign({}, byId[r.id] || {}, r);
        working.push(merged); return merged;
      });
      return W.saveMany(ds.collection, recs, { source: 'FILE_IMPORT', verb: '匯入 ' + fileName + ' →' }).then(function () { return finish(ds, result, fileName, recs.length); });
    });
  }
  function finish(ds, result, fileName, n) {
    var W = C.services.workspace;
    return W.load(['importLog']).then(function (d) {
      var rec = { id: C.util.dom.nextId('IM', d.importLog), at: new Date().toISOString(), file: fileName, dataset: ds.id, total: result.total, imported: n, errors: result.errors.length, invalidRows: result.invalidRows };
      return W.save('importLog', rec, { source: 'FILE_IMPORT', silent: true });
    }).then(function () { return n; });
  }

  /* ---------- Templates ---------- */
  function instructionRows(ds) {
    return [['Column', 'Required', 'Type', 'Allowed / Expected', 'Note']].concat(ds.columns.map(function (c) {
      var exp = c.type === 'int' ? c.min + '–' + c.max : c.type === 'date' ? 'YYYY-MM-DD' : c.type === 'level' ? 'VL / L / M / H / VH' : c.type === 'bool' ? 'Y / N' :
        c.type === 'enum' || c.type === 'list' ? options(c).join(' / ') : c.type === 'fairnum' ? 'number（PoA / Susceptibility 可填 60%）' : c.type === 'ref' ? '現有 ' + c.ref + ' ID' : 'text';
      return [c.label, c.required ? 'Yes' : c.requiredIf ? 'Conditional' : 'No', c.type, exp, c.help || ''];
    }));
  }
  function templateSheets(tplName) {
    var sets = Object.keys(DATASETS).map(function (k) { return DATASETS[k]; }).filter(function (d) { return d.template === tplName; });
    var sheets = [];
    sets.forEach(function (ds) {
      var head = ds.columns.map(function (c) { return c.label; });
      var rows = [head];
      if (ds.special === 'fair') C.data.fairDefaults.fields.forEach(function (f) { rows.push([f.field, f.value.min, f.value.mostLikely, f.value.max]); });
      sheets.push({ name: ds.sheet || 'Data', rows: rows });
    });
    sets.forEach(function (ds) { sheets.push({ name: (ds.sheet ? ds.sheet.slice(0, 18) + ' ' : '') + 'Instructions', rows: instructionRows(ds) }); });
    sheets.push({ name: 'About', rows: [['CAT.6 Cybersecurity import template'], [tplName], ['Delete the example rows (if any) and fill with organization data.'], ['FAIR rows are CAT6_DEFAULT demo values — replace them.'], ['Imported values are labelled FILE_IMPORT.']] });
    return sheets;
  }
  function templateCSV(ds) {
    var head = ds.columns.map(function (c) { return c.label; }), lines = [['# CAT.6 ' + ds.label + ' — 以 # 開頭的列會被忽略'], head];
    if (ds.special === 'fair') C.data.fairDefaults.fields.forEach(function (f) { lines.push([f.field, f.value.min, f.value.mostLikely, f.value.max]); });
    return C.services.exporter.toCSV(lines);
  }
  function templates() { var o = {}; Object.keys(DATASETS).forEach(function (k) { o[DATASETS[k].template] = 1; }); return Object.keys(o); }

  C.services.importCenter = { DATASETS: DATASETS, LEVELS: LEVELS, parseFile: parseFile, dataRows: dataRows, autoMap: autoMap, validate: validate, commit: commit,
    templateSheets: templateSheets, templateCSV: templateCSV, templates: templates, instructionRows: instructionRows, convert: convert };
})(globalThis.CAT6);
