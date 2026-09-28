/* Repository abstraction. Every page talks to the same async interface:
 *   list(col) · upsert(col, rec) · upsertMany(col, recs) · remove(col, id) · replaceAll(col, recs) · clearAll()
 * LocalRepository  → localStorage (falls back to in-memory if storage is blocked)
 * SupabaseRepository → PostgREST on table cat6_records (see supabase/schema.sql), RLS by organization. */
(function (C) {
  /* Accept either the project URL or the REST URL (…/rest/v1/). */
  function root(u) { return String(u || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, ''); }
  function key(r) { return (r.assessmentId || '') + '\u0000' + r.id; }
  function LocalRepository(prefix) {
    var mem = {}, ok = true;
    try { localStorage.setItem(prefix + '__probe', '1'); localStorage.removeItem(prefix + '__probe'); } catch (e) { ok = false; }
    function read(col) {
      if (!ok) return (mem[col] || []).slice();
      try { return JSON.parse(localStorage.getItem(prefix + col) || '[]'); } catch (e) { return []; }
    }
    function write(col, arr) {
      if (!ok) { mem[col] = arr.slice(); return; }
      try { localStorage.setItem(prefix + col, JSON.stringify(arr)); }
      catch (e) { var err = new Error('瀏覽器儲存空間不足，資料未儲存：' + e.message); err.code = 'QUOTA'; throw err; }
    }
    function wrap(fn) { return function () { var a = arguments; return new Promise(function (res) { res(fn.apply(null, a)); }); }; }
    return {
      kind: ok ? 'local' : 'memory',
      list: wrap(function (col) { return read(col); }),
      /* Records are keyed by (assessmentId, id): the same ID (e.g. ISO clause 4.1, FAIR 'fair') can exist in several assessments. */
      upsert: wrap(function (col, rec) {
        var arr = read(col), i = arr.findIndex(function (r) { return key(r) === key(rec); });
        if (i >= 0) arr[i] = rec; else arr.push(rec);
        write(col, arr); return rec;
      }),
      upsertMany: wrap(function (col, recs) {
        var arr = read(col), idx = {};
        arr.forEach(function (r, i) { idx[key(r)] = i; });
        recs.forEach(function (rec) { var k = key(rec); if (idx[k] != null) arr[idx[k]] = rec; else { idx[k] = arr.length; arr.push(rec); } });
        write(col, arr); return recs;
      }),
      remove: wrap(function (col, id, assessmentId) { write(col, read(col).filter(function (r) { return !(r.id === id && (assessmentId === undefined || (r.assessmentId || '') === (assessmentId || ''))); })); return true; }),
      replaceAll: wrap(function (col, recs) { write(col, recs); return recs; }),
      clearAll: wrap(function () {
        if (!ok) { mem = {}; return true; }
        Object.keys(localStorage).filter(function (k) { return k.indexOf(prefix) === 0; }).forEach(function (k) { localStorage.removeItem(k); });
        return true;
      })
    };
  }

  function SupabaseRepository(cfg, token) {
    var base = root(cfg.url) + '/rest/v1/cat6_records', org = cfg.organizationId;
    function headers(extra) { return Object.assign({ apikey: cfg.anonKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, extra || {}); }
    function check(r) { if (!r.ok) return r.text().then(function (t) { throw new Error('Supabase ' + r.status + ': ' + t); }); return r; }
    function q(col, id, asId) { return '?organization_id=eq.' + encodeURIComponent(org) + '&collection=eq.' + encodeURIComponent(col) + (id ? '&id=eq.' + encodeURIComponent(id) : '') + (asId !== undefined ? '&assessment_id=eq.' + encodeURIComponent(asId || '') : ''); }
    function row(col, rec) { return { organization_id: org, collection: col, id: rec.id, assessment_id: rec.assessmentId || '', source: rec.source || null, data: rec }; }
    function upsertRows(col, recs) {
      return fetch(base, { method: 'POST', headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(recs.map(function (r) { return row(col, r); })) }).then(check).then(function () { return recs; });
    }
    return {
      kind: 'supabase',
      list: function (col) { return fetch(base + q(col) + '&select=data', { headers: headers() }).then(check).then(function (r) { return r.json(); }).then(function (rows) { return rows.map(function (x) { return x.data; }); }); },
      upsert: function (col, rec) { return upsertRows(col, [rec]).then(function () { return rec; }); },
      upsertMany: upsertRows,
      remove: function (col, id, asId) { return fetch(base + q(col, id, asId), { method: 'DELETE', headers: headers() }).then(check).then(function () { return true; }); },
      replaceAll: function (col, recs) {
        return fetch(base + q(col), { method: 'DELETE', headers: headers() }).then(check).then(function () { return recs.length ? upsertRows(col, recs) : recs; });
      },
      clearAll: function () { return fetch(base + '?organization_id=eq.' + encodeURIComponent(org), { method: 'DELETE', headers: headers() }).then(check).then(function () { return true; }); }
    };
  }

  /* Supabase email + password sign-in (GoTrue REST). The access token is kept in sessionStorage only. */
  var SESSION_KEY = 'cat6:sb-session';
  function session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; } }
  function signIn(email, password) {
    var sb = C.config.supabase;
    return fetch(root(sb.url) + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: sb.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error_description || j.msg || ('HTTP ' + r.status)); return j; }); })
      .then(function (j) { var s = { token: j.access_token, email: email, expiresAt: Date.now() + (j.expires_in || 3600) * 1000 }; sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); return s; });
  }
  function signOut() { sessionStorage.removeItem(SESSION_KEY); }

  /* Decide which repository to use. Never throws: any missing setting → local mode with a reason. */
  function create() {
    var cfg = C.config || {}, sb = cfg.supabase || {}, prefix = cfg.storagePrefix || 'cat6:v2:';
    if (cfg.backend === 'supabase') {
      var missing = ['url', 'anonKey', 'organizationId'].filter(function (k) { return !sb[k]; });
      var s = session();
      if (missing.length) return { repo: LocalRepository(prefix), mode: 'local', reason: 'Supabase 未設定：' + missing.join(', ') + '，改用本機模式。' };
      if (!s || s.expiresAt < Date.now()) return { repo: LocalRepository(prefix), mode: 'local', reason: 'Supabase 已設定但尚未登入，改用本機模式。', canSignIn: true };
      return { repo: SupabaseRepository(sb, s.token), mode: 'supabase', reason: '' };
    }
    return { repo: LocalRepository(prefix), mode: 'local', reason: '' };
  }
  C.data.repository = { create: create, LocalRepository: LocalRepository, SupabaseRepository: SupabaseRepository, signIn: signIn, signOut: signOut, session: session };
})(globalThis.CAT6);
