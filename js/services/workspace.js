/* Workspace service — the single entry point pages use for data.
 * Scopes records to the current assessment, stamps provenance + timestamps, seeds the CAT.6 demo dataset
 * on first visit, keeps an activity log and quarterly register snapshots. */
(function (C) {
  var META = '__meta';
  var GLOBAL = { assessments: 1, reportRegistry: 1 };   /* report registry is organization-wide */
  var COLS = ['risks', 'treatments', 'nist', 'cisram', 'cisControls', 'cisSafeguards', 'csf', 'isoContext', 'isoClauses', 'isoSoa', 'isoTasks',
    'audits', 'findings', 'capas', 'reviews', 'evidence', 'fairInputs', 'fairRuns', 'snapshots', 'activity', 'importLog'];
  var W = { repo: null, mode: 'local', reason: '', meta: null, assessment: null, COLS: COLS };

  function stamp(rec, source) {
    var r = Object.assign({}, rec);
    r.assessmentId = r.assessmentId || W.meta.current;
    if (source) r.source = source;
    if (!r.source) r.source = 'USER_INPUT';
    r.updatedAt = new Date().toISOString();
    return r;
  }

  function demoRecords(asId) {
    var D = C.data.defaults, iso = D.iso, def = function (r) { return Object.assign({}, r, { source: 'CAT6_DEFAULT', assessmentId: asId, updatedAt: D._meta.lastUpdated }); };
    var out = {};
    out.risks = D.risks.map(def);
    out.treatments = D.treatments.map(def);
    out.nist = D.nist.map(def);
    out.cisram = D.cisram.map(def);
    out.cisControls = D.cisControls.map(def);
    out.csf = D.csf.map(def);
    out.isoContext = [def(iso.context)];
    out.isoClauses = C.data.iso.clauses.map(function (c) { return def({ id: c.id, status: iso.clauses[c.id] || 'NOT_ASSESSED', gapNote: '', owner: '', dueDate: '' }); });
    out.isoSoa = iso.soa.map(function (s) { return def({ id: s[0], applicable: s[1], status: s[2], justification: s[3] || (s[1] ? '示範：對應已識別風險' : ''), linkedRisks: [] }); });
    out.isoTasks = Object.keys(iso.tasks).map(function (k) { return def({ id: k, status: iso.tasks[k] }); });
    out.audits = iso.audits.map(def); out.findings = iso.findings.map(def); out.capas = iso.capas.map(def);
    out.reviews = iso.reviews.map(def); out.evidence = iso.evidence.map(def);
    out.fairInputs = [def({ id: 'fair', riskId: 'RS-B', fields: C.data.fairDefaults.fields.map(function (f) { return { field: f.field, value: Object.assign({}, f.value), source: 'CAT6_DEFAULT' }; }) })];
    out.snapshots = D.workspace.snapshots.map(def);
    out.activity = [def({ id: 'AC-0001', at: new Date().toISOString(), who: 'CAT.6', what: '載入 CAT.6 示範資料集（所有數值標示 CAT6_DEFAULT）' })];
    return out;
  }

  function seedDemo() {
    var a = Object.assign({}, C.data.defaults.workspace.assessment, { updatedAt: new Date().toISOString() });
    var recs = demoRecords(a.id), jobs = [W.repo.upsert('assessments', a)];
    Object.keys(recs).forEach(function (col) {
      jobs.push(W.repo.list(col).then(function (existing) {
        return W.repo.replaceAll(col, existing.filter(function (r) { return r.assessmentId !== a.id; }).concat(recs[col]));
      }));
    });
    return Promise.all(jobs).then(function () { return setMeta({ seeded: true, current: a.id }); });
  }

  function setMeta(patch) {
    W.meta = Object.assign({}, W.meta || { id: 'meta' }, patch, { id: 'meta' });
    return W.repo.upsert(META, W.meta);
  }

  function init() {
    if (W._ready) return W._ready;
    var r = C.data.repository.create();
    W.repo = r.repo; W.mode = r.mode === 'supabase' ? 'supabase' : r.repo.kind; W.reason = r.reason; W.canSignIn = !!r.canSignIn;
    W._ready = W.repo.list(META).then(function (m) {
      W.meta = m[0] || null;
      return W.meta && W.meta.seeded ? null : seedDemo();
    }).then(function () { return W.repo.list('assessments'); }).then(function (list) {
      /* Stored data from an older build (meta without assessments): re-seed the demo instead of failing. */
      if (!list.length) return seedDemo().then(function () { return W.repo.list('assessments'); });
      return list;
    }).then(function (list) {
      W.meta = W.meta || { current: list[0] && list[0].id };
      W.assessments = list;
      W.assessment = list.filter(function (a) { return a.id === W.meta.current; })[0] || list[0] || null;
      if (W.assessment && W.meta.current !== W.assessment.id) return setMeta({ current: W.assessment.id });
    }).then(function () { return W; });
    return W._ready;
  }

  function load(cols) {
    return Promise.all(cols.map(function (c) { return W.repo.list(c); })).then(function (lists) {
      var out = {};
      var issues = [];
      cols.forEach(function (c, i) {
        var raw = (Array.isArray(lists[i]) ? lists[i] : []).filter(function (r) { return r && (GLOBAL[c] || r.assessmentId === W.meta.current); });
        /* One normalization layer for every source (local, Supabase JSONB, imports, legacy CAT.6) — returns copies. */
        var n = C.util.normalize ? C.util.normalize.collection(c, raw) : { records: raw, issues: [] };
        out[c] = n.records; issues = issues.concat(n.issues);
      });
      /* Issues travel with the result of THIS load (a concurrent load of other collections cannot erase them). */
      Object.defineProperty(out, '__formatIssues', { value: issues, enumerable: false });
      W.formatIssues = issues;
      return out;
    });
  }

  function log(what, source) {
    return W.repo.list('activity').then(function (list) {
      var mine = list.filter(function (r) { return r.assessmentId === W.meta.current; });
      var rec = stamp({ id: C.util.dom.nextId('AC', mine, 4), at: new Date().toISOString(), who: W.mode === 'supabase' ? 'Supabase user' : '本機使用者', what: what }, source || 'USER_INPUT');
      var others = list.filter(function (r) { return r.assessmentId !== W.meta.current; });
      return W.repo.replaceAll('activity', others.concat(mine.concat(rec).slice(-200)));
    });
  }

  function quarter(d) { return d.getFullYear() + '-Q' + (Math.floor(d.getMonth() / 3) + 1); }
  function snapshot() {
    return load(['risks']).then(function (d) {
      var n = d.risks.filter(function (r) { if (!(r.likelihood >= 1 && r.impact >= 1)) return false; var b = C.calc.riskMatrix.assess(r.likelihood, r.impact).band.id; return b === 'HIGH' || b === 'CRITICAL'; }).length;
      var q = quarter(new Date());
      return W.repo.upsert('snapshots', stamp({ id: q, label: q.replace('-', ' '), highCritical: n }, 'CALCULATED'));
    });
  }

  /* Save one record. opts.source overrides provenance (e.g. FILE_IMPORT); editing a demo record makes it USER_INPUT. */
  function save(col, rec, opts) {
    opts = opts || {};
    var r = stamp(rec, opts.source || (rec.source === 'CAT6_DEFAULT' && !opts.keepSource ? 'USER_INPUT' : null));
    return W.repo.upsert(col, r).then(function () {
      var p = opts.silent ? null : log((opts.verb || '更新') + ' ' + col + ' / ' + r.id, r.source);
      return Promise.all([p, col === 'risks' ? snapshot() : null]);
    }).then(function () { return r; });
  }
  function saveMany(col, recs, opts) {
    opts = opts || {};
    var rs = recs.map(function (r) { return stamp(r, opts.source || (r.source === 'CAT6_DEFAULT' && !opts.keepSource ? 'USER_INPUT' : null)); });
    return W.repo.upsertMany(col, rs).then(function () {
      return Promise.all([opts.silent ? null : log((opts.verb || '批次更新') + ' ' + col + '（' + rs.length + ' 筆）', opts.source || 'USER_INPUT'), col === 'risks' ? snapshot() : null]);
    }).then(function () { return rs; });
  }
  function remove(col, id) {
    return W.repo.remove(col, id, col === 'assessments' ? undefined : (W.assessment ? W.assessment.id : undefined)).then(function () { return Promise.all([log('刪除 ' + col + ' / ' + id), col === 'risks' ? snapshot() : null]); });
  }

  function saveAssessment(a) {
    var rec = Object.assign({}, a, { updatedAt: new Date().toISOString() });
    return W.repo.upsert('assessments', rec).then(function () { W.assessment = rec; return log('更新評估設定 ' + rec.id); }).then(function () { return rec; });
  }
  function createAssessment(a) {
    var rec = Object.assign({}, a, { id: C.util.dom.nextId('AS', W.assessments || []), source: 'USER_INPUT', updatedAt: new Date().toISOString() });
    return W.repo.upsert('assessments', rec).then(function () { return setMeta({ current: rec.id }); }).then(function () { W.assessment = rec; return log('建立新評估 ' + rec.id); }).then(function () { return rec; });
  }
  /* "未輸入值取平台默認值": for every dataset that has no organization records in the current assessment,
   * insert the CAT.6 default records (source CAT6_DEFAULT). Datasets that already hold data are never touched. */
  function fillDefaults() {
    var recs = demoRecords(W.assessment.id), cols = Object.keys(recs).filter(function (c) { return c !== 'activity' && c !== 'snapshots'; });
    return load(cols).then(function (d) {
      var todo = cols.filter(function (c) { return !(d[c] || []).length; });
      return Promise.all(todo.map(function (c) { return W.repo.upsertMany(c, recs[c]); })).then(function () {
        return log(todo.length ? '以 CAT.6 預設值補齊未輸入的資料集：' + todo.join(', ') : '所有資料集皆已有資料，未帶入預設值', 'CAT6_DEFAULT');
      }).then(function () { return todo; });
    });
  }
  function switchAssessment(id) { return setMeta({ current: id }); }
  function resetDemo() { return seedDemo().then(function () { return setMeta({ current: 'AS-DEMO' }); }); }
  function clearAll() { return W.repo.clearAll().then(function () { W.meta = null; W._ready = null; }); }

  /* Does any record in these collections still carry CAT.6 default values? */
  function usesDefaults(data) {
    return Object.keys(data).some(function (k) {
      return (data[k] || []).some(function (r) { return r.source === 'CAT6_DEFAULT' || (r.fields && r.fields.some(function (f) { return f.source === 'CAT6_DEFAULT'; })); });
    });
  }

  Object.assign(W, { init: init, load: load, save: save, saveMany: saveMany, remove: remove, log: log, usesDefaults: usesDefaults,
    saveAssessment: saveAssessment, createAssessment: createAssessment, switchAssessment: switchAssessment, resetDemo: resetDemo, clearAll: clearAll, demoRecords: demoRecords, fillDefaults: fillDefaults });
  C.services.workspace = W;
})(globalThis.CAT6);
