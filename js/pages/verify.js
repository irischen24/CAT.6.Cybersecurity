/* CAT.6 Report Verification Page (/verify/?id=REP-YYYYMMDD-XXXXX&v=1.0).
 * Looks the report up in the Report Registry and evaluates it — a record merely existing is never VERIFIED:
 *   NOT FOUND · INVALID (registry record or supplied document does not match) · REVOKED · SUPERSEDED ·
 *   NOT VERIFIED (record intact, document in hand not compared yet) · VERIFIED (record intact AND document matches).
 * Registry providers:
 *   SUPABASE — public RPC cat6_verify_report (supabase/schema.sql); returns metadata + server-recomputed SHA-256 only,
 *              never the report content. PRODUCTION REQUIREMENT: deploy the SQL and set organizationId.
 *   LOCAL DEMO — this browser's localStorage registry (only the browser that generated the report can verify). */
(function (C) {
  var RI = C.services.reportIntegrity, esc = C.util.dom.esc;
  var state = { provider: null, rows: [], rec: null, latest: null, provided: null };

  function provider() {
    var sb = (C.config && C.config.supabase) || {};
    if (C.config && C.config.backend === 'supabase' && sb.url && sb.anonKey && sb.organizationId) {
      var root = String(sb.url).replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
      return { kind: 'SUPABASE', lookup: function (id) {
        return fetch(root + '/rest/v1/rpc/cat6_verify_report', { method: 'POST', headers: { apikey: sb.anonKey, Authorization: 'Bearer ' + sb.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_report_id: id }) })
          .then(function (r) { if (!r.ok) throw new Error('Registry 無法連線（HTTP ' + r.status + '）'); return r.json(); })
          .then(function (rows) { return (rows || []).map(function (x) { return { reportId: x.report_id, reportUuid: x.report_uuid, reportVersion: x.report_version, organization: x.organization, assessmentName: x.assessment_name,
            classification: x.classification, generatedAt: x.generated_at, generatedAtLocal: x.generated_at_local, sha256: x.sha256, recomputedSha256: x.recomputed_sha256, status: x.status, supersededBy: x.superseded_by,
            signature: { label: x.signature_label }, timestamp: { label: x.timestamp_label }, registry: 'SUPABASE' }; }); });
      } };
    }
    var repo = C.data.repository.LocalRepository((C.config && C.config.storagePrefix) || 'cat6:v2:');
    return { kind: 'LOCAL_DEMO', lookup: function (id) { return repo.list(RI.COLLECTION).then(function (l) { return l.filter(function (r) { return r.reportId === id; }); }); } };
  }
  function vnum(v) { return parseFloat(v) || 0; }
  var TONE = { VERIFIED: 'ok', 'NOT VERIFIED': 'warn', SUPERSEDED: 'warn', REVOKED: 'bad', INVALID: 'bad', 'NOT FOUND': 'bad', 'REGISTRY UNAVAILABLE': 'bad' };

  function show(result, errMsg) {
    var r = state.rec, box = document.getElementById('result'), local = state.provider.kind === 'LOCAL_DEMO';
    var banner = '<p class="c6-callout' + (local ? ' c6-callout--warn' : '') + '">' + (local
      ? '<strong>LOCAL DEMO REGISTRY</strong>：此網站目前沒有連接正式的 Report Registry（Supabase）。只能查到<strong>在這個瀏覽器</strong>產生的報告，不是獨立的第三方驗證。<br>PRODUCTION REQUIREMENT：部署 supabase/schema.sql 的 Report Registry 與 cat6_verify_report，並設定 organizationId。'
      : '<strong>Supabase Report Registry</strong>：登錄紀錄的 SHA-256 由伺服器從保存的內容重新計算；本頁不會取得報告內容。') + '</p>';
    var status = errMsg ? 'REGISTRY UNAVAILABLE' : result.status;
    var head = '<div class="c6-vstatus c6-vstatus--' + (TONE[status] || 'warn') + '" role="status"><span class="c6-vstatus__k">Verification Status</span><strong class="c6-vstatus__v">' + esc(status) + '</strong></div>';
    if (errMsg || !r) { box.innerHTML = banner + head + '<p class="c6-note">' + esc(errMsg || '登錄處查無此 Report ID / 版本。請確認報告最後一頁的 Report ID 與版本。') + '</p>'; return; }
    var rows = [['Report ID', r.reportId], ['Organization', r.organization], ['Assessment Name', r.assessmentName], ['Report Version', r.reportVersion + (state.latest && state.latest.reportUuid !== r.reportUuid ? '（最新版本：' + state.latest.reportVersion + '）' : '')],
      ['Generated At', r.generatedAtLocal || r.generatedAt], ['Classification', r.classification], ['SHA-256', r.sha256], ['Signature Status', (r.signature && r.signature.label) || 'NOT SIGNED — REQUIRES BACKEND'],
      ['Timestamp Status', (r.timestamp && r.timestamp.label) || 'DEMO / TSA NOT CONNECTED'], ['Registry Status', r.status]];
    box.innerHTML = banner + head +
      '<dl class="c6-vkv">' + rows.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd' + (x[0] === 'SHA-256' ? ' class="c6-vmono"' : '') + '>' + esc(x[1] == null ? '—' : x[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<h2 class="c6-vh2">檢查項目</h2><ul class="c6-vchecks">' + result.checks.map(function (c) { return '<li class="' + (c.ok === true ? 'ok' : c.ok === false ? 'bad' : 'wait') + '"><span aria-hidden="true">' + (c.ok === true ? '✓' : c.ok === false ? '✕' : '…') + '</span>' + esc(c.text) + '</li>'; }).join('') + '</ul>' +
      '<h2 class="c6-vh2">比對手上的報告</h2><p class="c6-note">輸入報告「Report Verification」頁上的 SHA-256，或上傳報告的 Manifest（.cat6report.json，由 Report Center 下載）。Manifest 會在您的瀏覽器中重新計算 SHA-256，不會上傳。</p>' +
      '<form class="c6-vform" id="doc"><label class="c6-field" style="flex:2"><span class="c6-var__lbl">報告上的 SHA-256</span><input class="c6-input c6-vmono" id="d-hash" pattern="[0-9a-fA-F]{64}" placeholder="64 個十六進位字元"></label>' +
      '<label class="c6-field"><span class="c6-var__lbl">或上傳 Manifest</span><input class="c6-input" type="file" id="d-file" accept=".json,application/json"></label><button class="c6-btn c6-btn--secondary" type="submit">比對</button></form>' +
      '<p class="c6-note c6-vfoot">Visual seal（圖章）僅為視覺標記，不是數位簽章。數位簽章與 RFC 3161 時戳需後端（HSM / KMS、TSA），未連接時本頁不會顯示為有效。</p>';
    document.getElementById('doc').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = document.getElementById('d-file').files[0], h = document.getElementById('d-hash').value.trim();
      (f ? f.text().then(function (t) { return { canonical: t }; }) : Promise.resolve(h ? { sha256: h } : null)).then(function (p) { state.provided = p; return evaluate(); });
    });
  }
  function evaluate() { return RI.evaluate(state.rec, state.latest, state.provided).then(function (res) { show(res); }); }

  function lookup(id, v) {
    state.provided = null; state.rec = null; state.latest = null;
    document.getElementById('result').innerHTML = '<p class="c6-muted">查詢中…</p>';
    return state.provider.lookup(id).then(function (rows) {
      rows = rows.slice().sort(function (a, b) { return vnum(b.reportVersion) - vnum(a.reportVersion); });
      state.latest = rows.filter(function (r) { return r.status !== 'REVOKED'; })[0] || rows[0] || null;
      state.rec = v ? rows.filter(function (r) { return String(r.reportVersion) === String(v); })[0] || null : rows[0] || null;
      return evaluate();
    }).catch(function (e) { show(null, e.message); });
  }

  state.provider = provider();
  var q = new URLSearchParams(location.search), id = (q.get('id') || '').trim().toUpperCase(), v = (q.get('v') || '').trim();
  document.getElementById('q-id').value = id; document.getElementById('q-v').value = v;
  document.getElementById('lookup').addEventListener('submit', function (e) {
    e.preventDefault();
    var nid = document.getElementById('q-id').value.trim().toUpperCase(), nv = document.getElementById('q-v').value.trim();
    history.replaceState(null, '', '?id=' + encodeURIComponent(nid) + (nv ? '&v=' + encodeURIComponent(nv) : ''));
    lookup(nid, nv);
  });
  if (id) lookup(id, v); else document.getElementById('result').innerHTML = '<p class="c6-note">請輸入報告上的 Report ID，或掃描報告最後一頁的 QR Code。</p>';
})(globalThis.CAT6);
