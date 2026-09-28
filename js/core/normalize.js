/* CAT.6 data normalization layer — applied once, when records are read through the workspace
 * (LocalStorage, Supabase JSONB, CSV / XLSX imports, demo defaults, older CAT.6 versions all pass through here).
 * Stored data is never rewritten by this layer: every function returns a normalized COPY.
 *
 * Root cause this layer addresses: Treatment `refs` was written with mixed types — refs.iso / csf / cis as arrays,
 * but refs.cisram as a single string from the Treatment form (a <select>). Consumers that assumed every refs[k] is an
 * array (e.g. `refs[k].join(', ')` in the Report Builder) crashed as soon as a CIS RAM mapping was selected.
 *
 * Canonical shapes after normalization:
 *   treatments.refs = { iso: string[], csf: string[], cis: string[], cisram: string[] }
 *   risks.frameworks, risks.cisControls, cisram.safeguards, reviews.inputs, evidence.relatedControls = string[]
 * Values that cannot be interpreted become [] and are reported as Data Format Errors
 * { collection, recordId, field, receivedType, received } — the record itself is kept. */
(function (C) {
  var REF_KEYS = ['iso', 'csf', 'cis', 'cisram'];
  var SPLIT = /\s*[;,|\n\r]\s*|\s+\/\s+/;
  function typeOf(v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }

  /* Any value → string[] (trimmed, non-empty, de-duplicated). Returns { value, ok }. */
  function toList(v) {
    var t = typeOf(v), out;
    if (t === 'undefined' || t === 'null') return { value: [], ok: true, changed: false };
    if (t === 'array') out = [].concat.apply([], v.map(function (x) { var r = toList(x); return r.ok ? r.value : []; }));
    else if (t === 'string') {
      var s = v.trim();
      if (!s) return { value: [], ok: true, changed: true };
      if (s.charAt(0) === '[' || s.charAt(0) === '{') { try { return Object.assign(toList(JSON.parse(s)), { changed: true }); } catch (e) { /* plain text */ } }
      out = s.split(SPLIT);
    } else if (t === 'number') out = [String(v)];
    else if (t === 'object') {
      if (v.id != null) out = [String(v.id)];
      else if (v.value != null) return toList(v.value);
      else {
        var keys = Object.keys(v);
        if (keys.length && keys.every(function (k) { return typeof v[k] === 'boolean'; })) out = keys.filter(function (k) { return v[k]; });            // { "A.5.1": true }
        else if (keys.every(function (k) { return /^\d+$/.test(k); })) out = keys.map(function (k) { return v[k]; }).filter(function (x) { return typeof x === 'string' || typeof x === 'number'; }).map(String); // array-like
        else return { value: [], ok: false, changed: true };
      }
    } else return { value: [], ok: false, changed: true };
    var seen = {}, clean = out.map(function (x) { return String(x).trim(); }).filter(function (x) { if (!x || seen[x]) return false; seen[x] = 1; return true; });
    return { value: clean, ok: true, changed: t !== 'array' || clean.length !== v.length };
  }

  /* Guess which framework a bare reference belongs to (legacy flat lists). */
  function classify(ref) {
    if (/^A\.\d+(\.\d+)?$/i.test(ref) || /^ISO/i.test(ref)) return 'iso';
    if (/^(GV|ID|PR|DE|RS|RC)\.[A-Z]{2}/.test(ref)) return 'csf';
    if (/^CIS[- ]?\d+/i.test(ref)) return 'cis';
    if (/^CR-/i.test(ref)) return 'cisram';
    return null;
  }

  /* Treatment refs in any historical shape → { iso, csf, cis, cisram } of string[]. */
  function refs(v, issue) {
    var out = { iso: [], csf: [], cis: [], cisram: [] }, t = typeOf(v);
    if (t === 'string') { var s = v.trim(); if (s.charAt(0) === '{' || s.charAt(0) === '[') { try { v = JSON.parse(s); t = typeOf(v); } catch (e) { /* fall through */ } } }
    if (t === 'undefined' || t === 'null') return out;
    if (t === 'object') {
      REF_KEYS.forEach(function (k) {
        var r = toList(v[k]);
        if (!r.ok && issue) issue('refs.' + k, v[k]);
        out[k] = r.value;
      });
      return out;
    }
    if (t === 'array' || t === 'string') {                         // legacy flat list: ["A.8.20", "PR.IR", "CIS-12", "CR-001"]
      var r2 = toList(v), unknown = [];
      r2.value.forEach(function (ref) { var k = classify(ref); if (k) out[k].push(ref); else unknown.push(ref); });
      if (unknown.length && issue) issue('refs', unknown.join(', '));
      return out;
    }
    if (issue) issue('refs', v);
    return out;
  }

  /* Per-collection list fields. */
  var LIST_FIELDS = { risks: ['frameworks', 'cisControls'], cisram: ['safeguards'], reviews: ['inputs'], evidence: ['relatedControls'] };

  /* FAIR simulation records from the single-scenario era carry no scenarioId: they are grouped per risk. */
  function fairRun(r) {
    if (r.scenarioId) return r;
    return Object.assign({}, r, { scenarioId: 'LEGACY-' + (r.riskId || 'UNASSIGNED'), legacyScenario: true });
  }

  /* Normalize one record of a collection → { record, issues }. */
  function record(collection, rec) {
    var issues = [], id = rec && rec.id != null ? String(rec.id) : '(no id)';
    var issue = function (field, value) { issues.push({ collection: collection, recordId: id, field: field, receivedType: typeOf(value), received: String(JSON.stringify(value)).slice(0, 80) }); };
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) { issue('(record)', rec); return { record: null, issues: issues }; }
    var out = rec;
    if (collection === 'treatments' && 'refs' in rec) out = Object.assign({}, out, { refs: refs(rec.refs, issue) });
    (LIST_FIELDS[collection] || []).forEach(function (f) {
      if (!(f in rec)) return;
      var r = toList(rec[f]);
      if (!r.ok) issue(f, rec[f]);
      if (r.changed || !r.ok) { if (out === rec) out = Object.assign({}, rec); out[f] = r.value; }
    });
    if (collection === 'fairRuns') out = fairRun(out);
    if (collection === 'fairInputs' && !rec.scenarioId) out = Object.assign({}, out, { scenarioId: rec.id });
    return { record: out, issues: issues };
  }
  function collection(name, list) {
    var issues = [], out = [];
    (Array.isArray(list) ? list : []).forEach(function (r) { var n = record(name, r); issues = issues.concat(n.issues); if (n.record) out.push(n.record); });
    return { records: out, issues: issues };
  }

  C.util.normalize = { toList: toList, refs: refs, classify: classify, record: record, collection: collection, fairRun: fairRun, typeOf: typeOf, REF_KEYS: REF_KEYS };
})(globalThis.CAT6);
