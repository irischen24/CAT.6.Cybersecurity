/* Formal report integrity: identity, classification, Report ID / UUID, canonical artifact + SHA-256, registry,
 * verification, and the interfaces for PDF digital signature and RFC 3161 timestamping.
 *
 * What the SHA-256 covers (the "canonical artifact"):
 *   canonical JSON of { schema, meta, sections } — the frozen report content (every table, text block and chart
 *   SVG) plus its identity metadata — with object keys sorted, no whitespace, UTF-8. It does NOT cover the
 *   verification page, the hash itself, signature / timestamp results or registry status, so printing the hash on
 *   the PDF never changes what was hashed. The PDF is a rendering of this artifact; the artifact can be downloaded
 *   (.cat6report.json) and re-hashed by anyone. Hashing the PDF bytes themselves needs server-side PDF generation
 *   (REQUIRES BACKEND) because a browser's print engine does not expose the PDF bytes to the page.
 *
 * Nothing here signs or timestamps anything by itself: without a configured backend the status is reported as
 * NOT SIGNED / TSA NOT CONNECTED. No private key, secret or fake RFC 3161 token exists in this file. */
(function (C) {
  var CLASSIFICATIONS = [
    { id: 'TOP SECRET', zh: '絕對機密', tone: 'ts' },
    { id: 'CONFIDENTIAL', zh: '機密', tone: 'conf' },
    { id: 'INTERNAL ONLY', zh: '限內部使用', tone: 'int' },
    { id: 'PUBLIC', zh: '公開', tone: 'pub' }
  ];
  var DEFAULT_CLASSIFICATION = 'CONFIDENTIAL';
  var COLLECTION = 'reportRegistry';
  var SCHEMA = 'cat6.report.v1';
  var PLATFORM = 'CAT.6 Cybersecurity';
  var ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (no I, L, O, U)

  function cfg() { return (C.config && C.config.reportSecurity) || {}; }
  function rand(n) { var a = new Uint8Array(n); (globalThis.crypto || window.crypto).getRandomValues(a); return a; }
  function uuid() {
    var c = globalThis.crypto || window.crypto;
    if (c.randomUUID) return c.randomUUID();
    var b = rand(16); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.from(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* Local wall-clock time with offset, e.g. 2026-09-28 15:51:07 +08:00 (client clock — not a trusted time source). */
  function localStamp(d) {
    d = d ? new Date(d) : new Date();
    var off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-', a = Math.abs(off);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' ' + sign + pad(Math.floor(a / 60)) + ':' + pad(a % 60);
  }
  /* Human-readable ID REP-YYYYMMDD-XXXXX (5 random Crockford chars ≈ 33.5M per day), unique within the registry.
   * It is a reference, not a security token: verification always relies on the SHA-256 comparison. */
  function newReportId(existing, date) {
    var d = date ? new Date(date) : new Date(), day = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()), taken = {};
    (existing || []).forEach(function (r) { taken[r.reportId] = 1; });
    for (var tries = 0; tries < 50; tries++) {
      var bytes = rand(5), s = ''; for (var i = 0; i < 5; i++) s += ALPHABET[bytes[i] & 31];
      var id = 'REP-' + day + '-' + s; if (!taken[id]) return id;
    }
    throw new Error('無法產生唯一的 Report ID');
  }
  /* Deterministic JSON: sorted keys, no whitespace; undefined dropped; numbers as JSON. */
  function canonicalize(v) {
    if (v === null || typeof v !== 'object') return v === undefined ? 'null' : JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(function (x) { return x === undefined ? 'null' : canonicalize(x); }).join(',') + ']';
    return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort().map(function (k) { return JSON.stringify(k) + ':' + canonicalize(v[k]); }).join(',') + '}';
  }
  function sha256Hex(text) {
    var subtle = (globalThis.crypto || window.crypto).subtle;
    if (!subtle) return Promise.reject(new Error('此瀏覽器環境不支援 Web Crypto（SHA-256）'));
    return subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) { return Array.from(new Uint8Array(buf), function (b) { return (b + 256).toString(16).slice(1); }).join(''); });
  }

  /* The canonical artifact for a report model + identity metadata. */
  function artifact(report, meta) {
    return { schema: SCHEMA, meta: meta, sections: report.sections.filter(function (s) { return s.id !== 'verification'; }),
      frameworks: report.frameworks || [], fairRunId: report.fairRunId || null, defaultsUsed: !!report.defaultsUsed };
  }
  function verifyUrl(meta, base) {
    var root = base || cfg().verifyBaseUrl || new URL('../verify/', location.href).href;
    return root + (root.indexOf('?') >= 0 ? '&' : '?') + 'id=' + encodeURIComponent(meta.reportId) + '&v=' + encodeURIComponent(meta.reportVersion);
  }
  function nextVersion(v) { var n = parseInt(String(v || '0'), 10); return (isNaN(n) ? 1 : n + 1) + '.0'; }

  /* ---------------- Registry ----------------
   * LOCAL DEMO registry: the workspace collection `reportRegistry` in this browser (or Supabase when the app runs in
   * Supabase mode). A local registry can only be verified in the same browser and is labelled accordingly. */
  function registryKind() { return C.services.workspace && C.services.workspace.mode === 'supabase' ? 'SUPABASE' : 'LOCAL_DEMO'; }
  function list() { return C.services.workspace.load([COLLECTION]).then(function (d) { return d[COLLECTION]; }); }

  /* Finalization pipeline (browser part):
   *   report model (already built from assessment data: content, charts, tables, defaults disclosure)
   *   → identity metadata (Report ID, UUID, version, classification, generated by / at)
   *   → canonical artifact → SHA-256
   *   → signature request (backend, optional) → RFC 3161 request over the SHA-256 (backend, optional)
   *   → registry record → verification URL → QR → rendered PDF (verification page printed from the record). */
  function finalize(opts) {
    var W = C.services.workspace, report = opts.report, a = W.assessment || {}, now = opts.now ? new Date(opts.now) : new Date();
    return list().then(function (existing) {
      var prev = opts.previous || null;
      var meta = {
        platform: PLATFORM, reportId: prev ? prev.reportId : newReportId(existing, now), reportUuid: uuid(),
        reportVersion: prev ? nextVersion(prev.reportVersion) : '1.0', previousUuid: prev ? prev.reportUuid : null,
        assessmentId: a.id || null, organizationId: (C.config && C.config.supabase && C.config.supabase.organizationId) || 'LOCAL',
        organization: a.organization || '', assessmentName: a.name || '', reportType: report.type, reportTitle: report.title, reportSubtitle: report.subtitle,
        classification: opts.classification || DEFAULT_CLASSIFICATION, generatedBy: opts.generatedBy || '', generatedAt: now.toISOString(), generatedAtLocal: localStamp(now)
      };
      var art = artifact(report, meta), canonical = canonicalize(art);
      return sha256Hex(canonical).then(function (hash) {
        var rec = { id: meta.reportUuid, reportId: meta.reportId, reportUuid: meta.reportUuid, reportVersion: meta.reportVersion, assessmentId: meta.assessmentId,
          organizationId: meta.organizationId, organization: meta.organization, assessmentName: meta.assessmentName, reportType: meta.reportType, reportTitle: meta.reportTitle,
          classification: meta.classification, generatedBy: meta.generatedBy, generatedAt: meta.generatedAt, generatedAtLocal: meta.generatedAtLocal,
          hashAlgorithm: 'SHA-256', hashScope: 'canonical-json:' + SCHEMA, sha256: hash, canonical: canonical, registry: registryKind(), status: 'ACTIVE', supersededBy: null };
        return signature(rec).then(function (sig) { rec.signature = sig; return timestamp(rec); }).then(function (ts) { rec.timestamp = ts; return rec; });
      });
    }).then(function (rec) {
      var W2 = C.services.workspace, jobs = [W2.save(COLLECTION, rec, { source: 'CALCULATED', verb: '定稿報告 ' + rec.reportId + ' v' + rec.reportVersion })];
      if (opts.previous) jobs.push(W2.save(COLLECTION, Object.assign({}, opts.previous, { status: 'SUPERSEDED', supersededBy: rec.reportUuid }), { source: 'CALCULATED', keepSource: true, verb: '取代舊版 ' + opts.previous.reportId + ' v' + opts.previous.reportVersion }));
      return Promise.all(jobs).then(function () { return rec; });
    });
  }
  function revoke(rec, reason) {
    return C.services.workspace.save(COLLECTION, Object.assign({}, rec, { status: 'REVOKED', revokedAt: new Date().toISOString(), revokeReason: reason || '' }), { source: 'CALCULATED', keepSource: true, verb: '撤銷報告 ' + rec.reportId + ' v' + rec.reportVersion });
  }
  /* The frozen report model of a finalized record (re-download never rebuilds from live data). */
  function reportFromRecord(rec) {
    var art = JSON.parse(rec.canonical);
    return { type: art.meta.reportType, title: art.meta.reportTitle, subtitle: art.meta.reportSubtitle, generatedAt: art.meta.generatedAt,
      assessment: { organization: art.meta.organization, name: art.meta.assessmentName }, defaultsUsed: art.defaultsUsed, defaultSentence: C.services.reportBuilder.DEFAULT_SENTENCE,
      sections: art.sections, frameworks: art.frameworks, fairRunId: art.fairRunId, meta: art.meta, record: rec };
  }

  /* ---------------- Digital signature (interface) ----------------
   * Production: a backend endpoint holding the key in an HSM / KMS signs the PDF (PAdES, ETSI EN 319 142) or, at
   * minimum, the SHA-256 of the canonical artifact (CMS / JWS). The browser never sees a key. Contract:
   *   POST {signingEndpoint} { reportUuid, reportId, version, sha256 }
   *   → { signer, organization, certificateSerial, certificateIssuer, certificateStatus, signingTime, algorithm, signature }
   * The response is shown as "reported by backend"; certificate-chain validation is also a backend task. */
  function signature(rec) {
    var ep = cfg().signingEndpoint;
    if (!ep) return Promise.resolve({ status: 'NOT_SIGNED', label: 'NOT SIGNED — REQUIRES BACKEND', signer: null, organization: null, certificateSerial: null, signingTime: null, algorithm: null, certificateStatus: 'N/A' });
    return fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportUuid: rec.reportUuid, reportId: rec.reportId, version: rec.reportVersion, sha256: rec.sha256 }) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || !j.signature || !j.algorithm || !j.certificateSerial) throw new Error('簽章服務回應缺少必要欄位');
        return Object.assign({ status: 'SIGNED_BY_BACKEND', label: 'SIGNED BY BACKEND — CERTIFICATE VALIDATED SERVER-SIDE' }, j);
      })
      .catch(function (e) { return { status: 'SIGNING_FAILED', label: 'SIGNING FAILED — ' + e.message, certificateStatus: 'N/A' }; });
  }
  /* ---------------- RFC 3161 trusted timestamp (interface) ----------------
   * A TimeStampReq (SHA-256 message imprint) must be sent to a TSA through a backend proxy (TSAs do not allow browser
   * CORS and the TimeStampResp / token must be validated against the TSA certificate). Contract:
   *   POST {tsaEndpoint} { sha256 } → { tsa, genTime, serialNumber, policy, token (base64 DER), verified: true|false }
   * Without an endpoint the status is TSA NOT CONNECTED — no token is invented. */
  function timestamp(rec) {
    var ep = cfg().tsaEndpoint;
    if (!ep) return Promise.resolve({ status: 'TSA_NOT_CONNECTED', label: 'DEMO / TSA NOT CONNECTED', standard: 'RFC 3161', tsa: null, token: null, serial: null, genTime: null });
    return fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sha256: rec.sha256 }) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || !j.token || !j.genTime || !j.tsa) throw new Error('TSA 服務回應缺少必要欄位');
        return { status: j.verified === true ? 'VALID' : 'NOT_VERIFIED', label: j.verified === true ? 'VALID (verified by backend)' : 'NOT VERIFIED', standard: 'RFC 3161', tsa: j.tsa, token: j.token, serial: j.serialNumber || null, genTime: j.genTime, policy: j.policy || null };
      })
      .catch(function (e) { return { status: 'TSA_ERROR', label: 'TSA ERROR — ' + e.message, standard: 'RFC 3161', tsa: null, token: null, serial: null, genTime: null }; });
  }

  /* ---------------- Verification ----------------
   * Never VERIFIED because a record exists. Steps: record found → not revoked → registry record intact
   * (SHA-256 recomputed from the stored canonical artifact) → the document in hand matches (SHA-256 printed on the
   * report, or the downloaded manifest re-hashed). Returns { status, checks[] }. */
  function evaluate(rec, latest, provided) {
    var checks = [];
    if (!rec) return Promise.resolve({ status: 'NOT FOUND', checks: [{ ok: false, text: '登錄處查無此 Report ID / 版本' }] });
    /* Local registry: recompute from the stored canonical artifact. Supabase: the server recomputes (the artifact
     * itself is never sent to the public verification page) and returns recomputedSha256. */
    var recompute = rec.canonical != null ? sha256Hex(rec.canonical) : Promise.resolve(rec.recomputedSha256 || null);
    return recompute.then(function (recomputed) {
      var intact = recomputed === rec.sha256;
      checks.push({ ok: intact, text: intact ? '登錄紀錄完整：由保存的 canonical artifact 重新計算 SHA-256 與紀錄一致' : recomputed == null ? '無法重新計算登錄紀錄的 SHA-256' : '登錄紀錄不一致：重新計算的 SHA-256 與紀錄不同' });
      if (!intact) return { status: 'INVALID', checks: checks, recomputed: recomputed };
      if (rec.status === 'REVOKED') { checks.push({ ok: false, text: '此報告已撤銷' + (rec.revokeReason ? '：' + rec.revokeReason : '') }); return { status: 'REVOKED', checks: checks }; }
      var superseded = rec.status === 'SUPERSEDED' || (latest && latest.reportUuid !== rec.reportUuid);
      var docCheck = provided ? (provided.canonical != null ? sha256Hex(provided.canonical) : Promise.resolve(String(provided.sha256 || '').trim().toLowerCase())) : Promise.resolve(null);
      return docCheck.then(function (docHash) {
        if (docHash == null) checks.push({ ok: null, text: '尚未比對手上的文件：請輸入報告驗證頁上的 SHA-256，或上傳報告 Manifest（.cat6report.json）' });
        else checks.push({ ok: docHash === rec.sha256, text: docHash === rec.sha256 ? '文件比對一致：提供的 SHA-256 / Manifest 與登錄紀錄相同' : '文件比對不一致：提供的 SHA-256 / Manifest 與登錄紀錄不同' });
        if (docHash != null && docHash !== rec.sha256) return { status: 'INVALID', checks: checks };
        if (superseded) { checks.push({ ok: false, text: '已有較新版本' + (latest ? '（v' + latest.reportVersion + '）' : '') + '，此版本已被取代' }); return { status: 'SUPERSEDED', checks: checks }; }
        return { status: docHash == null ? 'NOT VERIFIED' : 'VERIFIED', checks: checks };
      });
    });
  }

  C.services.reportIntegrity = { CLASSIFICATIONS: CLASSIFICATIONS, DEFAULT_CLASSIFICATION: DEFAULT_CLASSIFICATION, COLLECTION: COLLECTION, SCHEMA: SCHEMA, PLATFORM: PLATFORM,
    uuid: uuid, newReportId: newReportId, canonicalize: canonicalize, sha256Hex: sha256Hex, artifact: artifact, localStamp: localStamp, verifyUrl: verifyUrl, nextVersion: nextVersion,
    registryKind: registryKind, list: list, finalize: finalize, revoke: revoke, reportFromRecord: reportFromRecord, signature: signature, timestamp: timestamp, evaluate: evaluate };
})(globalThis.CAT6);
