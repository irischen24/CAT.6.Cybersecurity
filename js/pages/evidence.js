/* Evidence Management. Local / demo mode stores FILE METADATA only (name, size, type, last modified, SHA-256) —
 * file contents never leave the browser. With Supabase configured the same records go through the repository
 * abstraction; binary upload to Supabase Storage is documented in docs/BACKEND.md. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, esc = D.esc, ISO = C.data.iso;
  var STATUS = ['Draft', 'Submitted', 'Accepted', 'Rejected', 'Expired'];
  var TONE = { Accepted: 'ok', Submitted: 'warn', Rejected: 'bad', Expired: 'bad' };
  var REQ = ISO.clauses.map(function (c) { return { value: c.id, label: 'ISO ' + c.id + ' ' + c.title }; })
    .concat(ISO.annexA.map(function (a) { return { value: a.id, label: 'ISO ' + a.id + ' ' + a.title }; }))
    .concat(C.data.cis.controls.map(function (c) { return { value: c.id, label: c.id + ' ' + c.title }; }))
    .concat(C.data.csf.categories.map(function (c) { return { value: c.id, label: 'CSF ' + c.id + ' ' + c.name }; }));
  function size(n) { return n == null ? '' : n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function hash(file) {
    if (!(window.crypto && crypto.subtle && file.arrayBuffer)) return Promise.resolve(null);
    return file.arrayBuffer().then(function (b) { return crypto.subtle.digest('SHA-256', b); }).then(function (h) { return Array.prototype.map.call(new Uint8Array(h), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }).catch(function () { return null; });
  }

  P.boot({ nav: 'evidence', group: 'iso' }, function () {
    var page = document.getElementById('page'), tbl, d, pending = null;
    page.innerHTML = '<div class="c6-intro"><h2 class="c6-intro__title">Evidence Management 證據管理</h2><p class="c6-intro__text">為條款、Annex A 控制、CIS Controls 或 CSF Categories 建立證據紀錄，追蹤負責人、日期與審查狀態，並關聯風險。</p></div>' +
      '<div class="c6-callout" id="mode"></div><div class="c6-stats" id="stats"></div>' +
      P.card('ev', 'Evidence Register', '搜尋、篩選、排序', '<div id="tbl"></div>') +
      '<input type="file" id="file" class="c6-sr-only" tabindex="-1" aria-hidden="true">';
    document.getElementById('mode').innerHTML = W.mode === 'supabase'
      ? '<strong>Supabase 模式：</strong>證據紀錄儲存於組織資料庫（受 RLS 保護）。檔案本體上傳需設定 Storage bucket（見 docs/BACKEND.md），此頁僅記錄檔案中繼資料與雜湊值。'
      : '<strong>本機 / 示範模式：</strong>僅記錄檔案中繼資料（名稱、大小、類型、修改時間、SHA-256），檔案本體不會上傳或保存。請將正本存放於組織文件系統，並在「位置」欄註明路徑。';

    function load() {
      return W.load(['evidence', 'risks']).then(function (x) {
        d = x; P.notice(document.getElementById('c6-notice'), W.usesDefaults({ e: x.evidence }), { edit: '#ev', dataset: 'evidence' });
        var c = {}; STATUS.forEach(function (s) { c[s] = 0; }); x.evidence.forEach(function (e) { c[e.status] = (c[e.status] || 0) + 1; });
        var noDate = x.evidence.filter(function (e) { return !e.date; }).length;
        document.getElementById('stats').innerHTML = [['已接受', c.Accepted, 'ok'], ['待審 (Submitted)', c.Submitted, 'warn'], ['草稿', c.Draft, ''], ['退回 / 過期', c.Rejected + c.Expired, c.Rejected + c.Expired ? 'bad' : '']].map(function (s) {
          return '<div class="c6-stat' + (s[2] ? ' c6-stat--' + s[2] : '') + '"><span class="c6-stat__label">' + s[0] + '</span><span class="c6-stat__value">' + s[1] + '</span></div>';
        }).join('') + (noDate ? '<p class="c6-note">' + noDate + ' 筆證據缺少日期。</p>' : '');
        if (tbl) tbl.setRows(x.evidence); else build();
      });
    }
    function build() {
      tbl = C.ui.table.create(document.getElementById('tbl'), {
        caption: 'Evidence register', rows: d.evidence,
        columns: [{ key: 'id', label: 'Evidence ID' }, { key: 'requirement', label: 'Requirement / Control' },
          { key: 'name', label: 'Evidence', wrap: true, get: function (e) { return e.name + ' ' + (e.description || ''); }, render: function (e) { return '<strong>' + esc(e.name) + '</strong><br><span class="c6-muted">' + esc(e.description || '') + '</span>'; } },
          { key: 'owner', label: 'Owner' }, { key: 'date', label: 'Date', render: function (e) { return e.date ? esc(e.date) : P.dataRequired('缺少日期'); } },
          { key: 'status', label: 'Status', render: function (e) { return P.chip(e.status, TONE[e.status]); } },
          { key: 'relatedRisk', label: 'Risk', render: function (e) { return e.relatedRisk ? '<a class="c6-link" href="risk-register.html?id=' + encodeURIComponent(e.relatedRisk) + '">' + esc(e.relatedRisk) + '</a>' : '<span class="c6-muted">—</span>'; } },
          { key: 'framework', label: 'Framework', get: function (e) { return P.fwShort(e.framework); } },
          { key: 'file', label: 'File metadata', get: function (e) { return e.file ? e.file.name : ''; }, render: function (e) { return e.file ? esc(e.file.name) + '<br><span class="c6-muted">' + size(e.file.size) + (e.file.sha256 ? ' · SHA-256 ' + e.file.sha256.slice(0, 12) + '…' : '') + '</span>' : '<span class="c6-muted">未附</span>'; } },
          { key: 'source', label: 'Provenance', render: function (e) { return P.prov(e.source); } }],
        filters: [{ key: 'status', label: 'Status', options: STATUS }, { key: 'framework', label: 'Framework', options: P.fwOptions().map(function (o) { return { value: o.value, label: P.fwShort(o.value) }; }) }],
        actions: ['view', { id: 'attach', icon: 'upload', label: '附加檔案中繼資料' }, 'edit', 'delete'],
        toolbar: '<button type="button" class="c6-btn c6-btn--primary" data-add>' + C.ui.icons.icon('plus') + '新增證據</button><a class="c6-btn c6-btn--secondary" href="data-import.html?ds=evidence">' + C.ui.icons.icon('upload') + '匯入</a>' + P.exportButtons(),
        onAction: function (a, e) { if (a === 'view') detail(e); else if (a === 'edit') edit(e); else if (a === 'attach') attach(e); else C.ui.form.confirm('刪除 ' + e.id + '？', '刪除').then(function (ok) { if (ok) W.remove('evidence', e.id).then(load); }); }
      });
      page.querySelector('[data-add]').addEventListener('click', function () { edit(null); });
      P.bindExport(page, exportAs);
    }
    var FIELDS = function () {
      return [{ key: 'requirement', label: 'Requirement / Control', type: 'select', required: true, options: REQ, full: true },
        { key: 'name', label: 'Evidence Name', type: 'text', required: true }, { key: 'owner', label: 'Owner', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS },
        { key: 'relatedRisk', label: 'Related Risk', type: 'select', options: P.riskOptions(d.risks) }, { key: 'framework', label: 'Related Framework', type: 'select', required: true, options: P.fwOptions() },
        { key: 'location', label: '正本位置（路徑 / 連結）', type: 'text', full: true, help: '本機模式不保存檔案本體' }];
    };
    function edit(e) {
      var isNew = !e;
      C.ui.form.open({ title: isNew ? '新增證據' : '編輯 ' + e.id, fields: FIELDS(), values: e || { status: 'Draft', framework: 'ISO27001', date: D.today() } }).then(function (v) {
        if (!v) return; var rec = Object.assign({}, e || {}, v); if (isNew) rec.id = D.nextId('EV', d.evidence);
        return W.save('evidence', rec, { verb: isNew ? '新增' : '更新' }).then(function () { D.toast(rec.id + ' 已儲存'); return load(); });
      });
    }
    function attach(e) { pending = e; var f = document.getElementById('file'); f.value = ''; f.click(); }
    document.getElementById('file').addEventListener('change', function (ev) {
      var file = ev.target.files[0], e = pending; if (!file || !e) return;
      D.toast('計算 SHA-256…');
      hash(file).then(function (h) {
        var meta = { name: file.name, size: file.size, type: file.type || 'application/octet-stream', lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : '', sha256: h, attachedAt: new Date().toISOString(), stored: W.mode === 'supabase' ? 'metadata (storage upload not configured)' : 'metadata only (local mode)' };
        return W.save('evidence', Object.assign({}, e, { file: meta }), { verb: '附加檔案中繼資料' });
      }).then(function () { D.toast('已記錄 ' + file.name + ' 的中繼資料'); return load(); });
    });
    function detail(e) {
      var f = e.file;
      C.ui.form.detail({ title: e.id + ' · ' + e.name, subtitle: P.prov(e.source), rows: [
        ['Requirement / Control', esc(e.requirement) + ' ' + esc((REQ.filter(function (r) { return r.value === e.requirement; })[0] || {}).label || '')], ['Description', esc(e.description)],
        ['Owner', esc(e.owner)], ['Date', e.date ? esc(e.date) : P.dataRequired()], ['Status', P.chip(e.status, TONE[e.status])], ['Related Risk', esc(e.relatedRisk)], ['Framework', esc(P.fwShort(e.framework))], ['正本位置', esc(e.location)],
        ['File name', f ? esc(f.name) : ''], ['File size / type', f ? size(f.size) + ' · ' + esc(f.type) : ''], ['Last modified', f ? esc(f.lastModified) : ''], ['SHA-256', f && f.sha256 ? '<code style="word-break:break-all">' + f.sha256 + '</code>' : f ? '無法計算（瀏覽器不支援）' : ''], ['儲存方式', f ? esc(f.stored) : '']
      ], actions: [{ label: '編輯', primary: true, onClick: function () { edit(e); } }, { label: '附加檔案中繼資料', onClick: function () { attach(e); } }] });
    }
    function exportAs(kind) {
      var t = { name: 'Evidence', rows: tbl.visible(), notes: P.exportNotes(d.evidence).concat(['File contents are not stored in local mode; only metadata and SHA-256.']), columns: [
        { key: 'id', label: 'Evidence ID' }, { key: 'requirement', label: 'Requirement / Control' }, { key: 'name', label: 'Evidence Name' }, { key: 'description', label: 'Description' }, { key: 'owner', label: 'Owner' },
        { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'relatedRisk', label: 'Related Risk' }, { key: 'framework', label: 'Framework' }, { key: 'location', label: 'Location' },
        { key: 'fn', label: 'File Name', get: function (e) { return e.file ? e.file.name : ''; } }, { key: 'fs', label: 'File Size (bytes)', get: function (e) { return e.file ? e.file.size : ''; } },
        { key: 'fh', label: 'SHA-256', get: function (e) { return e.file ? e.file.sha256 : ''; } }, { key: 'source', label: 'Data Provenance' }] };
      if (kind === 'csv') C.services.exporter.downloadCSV(t, 'CAT6_Evidence'); else C.services.exporter.downloadXLSX([t], 'CAT6_Evidence');
    }
    return load().then(function () { page.removeAttribute('aria-busy'); });
  });
})(globalThis.CAT6);
