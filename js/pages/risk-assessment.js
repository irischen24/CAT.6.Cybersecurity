/* Risk Assessment — Assessment Setup, assessment list, Workflow 01 pipeline, methodology status, workspace & backend. */
(function (C) {
  var P = C.ui.page, W = C.services.workspace, D = C.util.dom, F = C.util.format, esc = D.esc, REPO = C.data.repository;
  var TYPES = [{ value: 'RISK', label: 'Cybersecurity Risk Assessment & Analysis' }, { value: 'ISO', label: 'ISO/IEC 27001 Certification Readiness' }, { value: 'COMBINED', label: 'Combined（兩項核心服務）' }];
  var SRC = [{ value: 'MANUAL', label: 'Manual Input 手動輸入' }, { value: 'CSV', label: 'CSV' }, { value: 'XLSX', label: 'XLSX' }, { value: 'CAT6_DEFAULT', label: 'CAT.6 Default（示範 / 假設值）' }];
  var FIELDS = [
    { key: 'organization', label: 'Organization 組織', type: 'text', required: true }, { key: 'name', label: 'Assessment Name 評估名稱', type: 'text', required: true },
    { key: 'type', label: 'Assessment Type', type: 'select', required: true, options: TYPES }, { key: 'date', label: 'Assessment Date', type: 'date', required: true },
    { key: 'scope', label: 'Scope 範圍', type: 'textarea', required: true }, { key: 'assessor', label: 'Assessor 評估者', type: 'text', required: true },
    { key: 'dataSource', label: 'Data Source 資料來源', type: 'select', required: true, options: SRC, help: 'CSV / XLSX 請於 Data Import 匯入；紀錄會標示 FILE_IMPORT' },
    { key: 'targetIG', label: 'CIS 目標 Implementation Group', type: 'select', options: ['IG1', 'IG2', 'IG3'] },
    { key: 'frameworks', label: 'Framework Selection 框架', type: 'multi', required: true, options: C.ui.page.fwOptions() },
    { key: 'cisRamAcceptableScore', label: 'CIS RAM 可接受風險門檻（5×5 分數）', type: 'int', min: 1, max: 25, help: '組織自訂；留白 = CAT.6 預設 9（Risk ≤ 9 Accept、≥ 10 Treatment Required）' },
    { key: 'csfTierCurrent', label: 'CSF Implementation Tier · Current', type: 'select', options: C.data.csf.tiers.map(function (t) { return { value: t.id, label: 'Tier ' + t.id + ' ' + t.en + ' — ' + t.text }; }), help: '治理成熟度描述（選填），不作為分數' },
    { key: 'csfTierTarget', label: 'CSF Implementation Tier · Target', type: 'select', options: C.data.csf.tiers.map(function (t) { return { value: t.id, label: 'Tier ' + t.id + ' ' + t.en }; }) }
  ];
  var PR = C.data.defaults.parameters;
  function tier(v) { var t = C.data.csf.tiers.filter(function (x) { return String(x.id) === String(v); })[0]; return t ? 'Tier ' + t.id + ' ' + t.en : null; }
  function lbl(list, v) { return (list.filter(function (x) { return x.value === v; })[0] || {}).label || v || ''; }

  P.boot({ nav: 'assessment', group: 'assessment' }, function () {
    var page = document.getElementById('page');
    page.innerHTML = '<div class="c6-intro"><h2 class="c6-intro__title">Cybersecurity Risk Assessment & Analysis</h2><p class="c6-intro__text">設定評估（組織、範圍、評估者、資料來源與框架），依 Workflow 01 從組織資料到報告逐步完成。每一步都連到實際功能頁，狀態由目前評估的資料自動判斷。</p></div>' +
      '<div class="c6-grid">' + P.card('setup', 'Assessment Setup', '目前評估', '<div id="setup-b"></div>', { span: 2 }) + P.card('ws', 'Workspace & Data', '儲存模式 · 後端', '<div id="ws-b"></div>') + '</div>' +
      P.card('wf1', 'Workflow 01 · Cybersecurity Risk Assessment & Analysis', '✓ 完成 · 數字 = 未開始 · 黃框 = 進行中', '<ol class="c6-pipe" id="pipe"></ol>') +
      P.card('list', 'Assessments', '切換或建立評估；資料依評估分開保存', '<div id="as-t"></div>') + P.card('method', '預設值與採用依據', '組織輸入優先；未輸入時以 CAT.6 預設值計算並標示 CAT6_DEFAULT', '<div id="dr-b"></div>');

    function render() {
      return W.load(['assessments', 'risks', 'treatments', 'nist', 'cisram', 'cisControls', 'cisSafeguards', 'csf', 'fairRuns', 'importLog']).then(function (d) {
        var a = W.assessment;
        P.notice(document.getElementById('c6-notice'), a.source === 'CAT6_DEFAULT' || W.usesDefaults({ r: d.risks }), { edit: '#setup', dataset: 'risks' });
        document.getElementById('setup-b').innerHTML = '<div class="c6-stack"><dl class="c6-kv">' +
          [['Organization', esc(a.organization)], ['Assessment Name', esc(a.name)], ['Assessment Type', esc(lbl(TYPES, a.type))], ['Scope', esc(a.scope)], ['Assessment Date', esc(a.date)], ['Assessor', esc(a.assessor)],
            ['Data Source', esc(lbl(SRC, a.dataSource))], ['Frameworks', P.chips((a.frameworks || []).map(P.fwShort), 'accent')], ['CIS Target IG', esc(PR.value('targetIG', a)) + ' ' + P.prov(PR.resolve('targetIG', a).source)],
            ['CIS RAM 可接受門檻', 'Risk ≤ ' + esc(PR.value('cisRamAcceptableScore', a)) + ' → Accept ' + P.prov(PR.resolve('cisRamAcceptableScore', a).source)],
            ['CSF Tier', a.csfTierCurrent ? esc(tier(a.csfTierCurrent)) + (a.csfTierTarget ? ' → ' + esc(tier(a.csfTierTarget)) : '') : '<span class="c6-muted">未填（選填）</span>'], ['Provenance', P.prov(a.source)]]
            .map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
          '<div class="c6-actions"><button type="button" class="c6-btn c6-btn--primary" id="edit-as">' + C.ui.icons.icon('edit') + '編輯設定</button><button type="button" class="c6-btn c6-btn--secondary" id="new-as">' + C.ui.icons.icon('plus') + '建立新評估</button><button type="button" class="c6-btn c6-btn--ghost" id="fill-def">以預設值補齊未輸入資料</button><a class="c6-btn c6-btn--ghost" href="reports.html">產生報告</a></div></div>';
        document.getElementById('edit-as').addEventListener('click', function () {
          C.ui.form.open({ title: '編輯評估設定', subtitle: a.source === 'CAT6_DEFAULT' ? '儲存後設定來源改為 USER_INPUT（其他紀錄的來源不變）' : '', fields: FIELDS, values: a }).then(function (v) {
            if (v) return W.saveAssessment(Object.assign({}, a, v, { source: 'USER_INPUT' })).then(function () { D.toast('已更新評估設定'); location.reload(); });
          });
        });
        document.getElementById('new-as').addEventListener('click', function () {
          C.ui.form.open({ title: '建立新評估', subtitle: '組織輸入的資料優先；未輸入的欄位與資料集可用 CAT.6 預設值計算（標示 CAT6_DEFAULT，可逐筆覆寫）。', fields: FIELDS.concat([{ key: 'prefill', label: '未輸入的資料集先帶入 CAT.6 預設值', type: 'bool', help: '勾選後，風險、CIS、CSF、ISO、FAIR 等資料集先放入示範值；匯入或編輯後即改為組織資料' }]), values: { date: D.today(), type: 'COMBINED', dataSource: 'MANUAL', targetIG: 'IG1', frameworks: ['ISO27001', 'CSF2', 'SP80030', 'CISRAM', 'CISV81', 'FAIR'], prefill: true } }).then(function (v) {
            if (!v) return; var pre = v.prefill; delete v.prefill;
            return W.createAssessment(v).then(function (rec) { return (pre ? W.fillDefaults() : Promise.resolve()).then(function () { D.toast('已建立並切換至 ' + rec.id); location.reload(); }); });
          });
        });
        document.getElementById('fill-def').addEventListener('click', function () {
          C.ui.form.confirm('對目前評估中「沒有任何資料」的資料集帶入 CAT.6 預設值？已有資料的資料集不會變動。', '帶入預設值').then(function (ok) {
            if (ok) return W.fillDefaults().then(function (t) { D.toast(t.length ? '已補齊：' + t.join('、') : '所有資料集皆已有資料'); location.reload(); });
          });
        });

        /* Workflow 01 */
        var rs = d.risks, n = rs.length, f = function (k) { return n ? rs.filter(function (r) { return r[k] && String(r[k]).trim() !== ''; }).length / n : 0; };
        var lik = n ? rs.filter(function (r) { return r.likelihood >= 1; }).length / n : 0, imp = n ? rs.filter(function (r) { return r.impact >= 1; }).length / n : 0;
        var det = n ? rs.filter(function (r) { return r.likelihood >= 1 && r.impact >= 1; }).length / n : 0;
        var nistOk = d.nist.filter(function (x) { return C.calc.nist.assess(x).status === 'OK'; }).length;
        var treated = n ? rs.filter(function (r) { return d.treatments.some(function (t) { return t.riskId === r.id; }) || r.treatment === 'Accept'; }).length / n : 0;
        var resid = n ? rs.filter(function (r) { return r.residualLikelihood >= 1 && r.residualImpact >= 1; }).length / n : 0;
        var steps = [
          ['Enterprise / Organization Data', 'risk-assessment.html#setup', a.organization ? 1 : 0, a.source === 'CAT6_DEFAULT' ? 'CAT.6 示範組織' : esc(a.organization)],
          ['Manual / Excel / CSV / Default', 'data-import.html', n ? 1 : 0, esc(lbl(SRC, a.dataSource))],
          ['Validation', 'data-import.html', d.importLog.length || n ? 1 : 0, d.importLog.length ? d.importLog.length + ' 次匯入' : '表單即時驗證'],
          ['Normalization', 'data-import.html', n ? 1 : 0, 'NIST 等級 / 日期 / 列表正規化'],
          ['Risk Scenario', 'risk-register.html', n ? 1 : 0, n + ' 個情境'], ['Asset', 'risk-register.html', f('asset')], ['Threat Source', 'risk-register.html', f('threatSource')],
          ['Threat Event', 'risk-register.html', f('threatEvent')], ['Vulnerability', 'risk-register.html', f('vulnerability')], ['Existing Controls', 'risk-register.html', f('existingControls')],
          ['Assessment Method', 'risk-register.html', f('method')], ['Likelihood', 'risk-register.html', lik], ['Impact', 'risk-register.html', imp],
          ['Risk Determination', 'nist-800-30.html', det, '5×5：' + F.pct(det) + ' · SP 800-30：' + nistOk + ' 筆'],
          ['Framework Mapping', 'framework-mapping.html', n ? rs.filter(function (r) { return (r.frameworks || []).length; }).length / n : 0],
          ['Optional FAIR Quantification', 'fair-analysis.html', d.fairRuns.length ? 1 : rs.some(function (r) { return r.fair; }) ? 0.5 : null, d.fairRuns.length ? d.fairRuns.length + ' 次模擬' : '選用'],
          ['CIS Controls / Safeguard Mapping', 'cis-controls.html', n ? rs.filter(function (r) { return (r.cisControls || []).length; }).length / n : 0, d.cisSafeguards.length ? d.cisSafeguards.length + ' safeguards' : 'Safeguards 未匯入'],
          ['Risk Treatment', 'risk-treatment.html', treated], ['Residual Risk', 'risk-treatment.html#res', resid],
          ['Tables & Charts', 'dashboard.html', n ? 1 : 0], ['Report', 'reports.html', n ? 1 : 0], ['PDF / CSV / XLSX Export', 'reports.html', n ? 1 : 0]
        ];
        document.getElementById('pipe').innerHTML = steps.map(function (s) {
          var v = s[2], st = v == null ? '' : v >= 1 ? 'done' : v > 0 ? 'partial' : '';
          return '<li><a class="c6-pipe__step" href="' + s[1] + '" data-state="' + st + '"><strong>' + s[0] + '</strong><span>' + (v == null ? '選用' : st === 'done' ? '完成' : st === 'partial' ? '進行中 ' + F.pct(v) : '未開始') + (s[3] ? ' · ' + s[3] : '') + '</span></a></li>';
        }).join('');

        /* Assessments list */
        C.ui.table.create(document.getElementById('as-t'), {
          caption: 'Assessments', rows: d.assessments, search: false,
          columns: [{ key: 'id', label: 'ID' }, { key: 'organization', label: 'Organization' }, { key: 'name', label: 'Name', wrap: true }, { key: 'type', label: 'Type' }, { key: 'date', label: 'Date' },
            { key: 'cur', label: '目前', render: function (x) { return x.id === a.id ? P.chip('● 目前', 'ok') : ''; } }, { key: 'source', label: 'Provenance', render: function (x) { return P.prov(x.source || 'USER_INPUT'); } }],
          actions: [{ id: 'switch', icon: 'arrow', label: '切換至' }],
          onAction: function (act, x) { if (x.id === a.id) return; W.switchAssessment(x.id).then(function () { location.reload(); }); }
        });

        /* Defaults & basis (採用依據) + remaining data requests */
        document.getElementById('dr-b').innerHTML = '<p class="c6-note">組織輸入的資料優先；未輸入時以下列 CAT.6 預設值計算，並標示 CAT6_DEFAULT。</p><ul class="c6-stage__list">' +
          PR.list.map(function (p) {
            var r = p.assessmentKey ? PR.resolve(p.key, a) : { value: p.value, source: 'CAT6_DEFAULT', isDefault: true };
            return '<li class="c6-stage__item"><span class="c6-stage__mark" aria-hidden="true">' + (r.isDefault ? '◇' : '✓') + '</span><span><strong>' + esc(p.label) + '</strong>：' + esc(String(r.value)) + (p.unit ? ' ' + esc(p.unit) : '') +
              '<br><span class="c6-muted">依據：' + esc(p.basis) + '（' + esc(p.doc) + '）</span></span>' + P.prov(r.source) + '</li>';
          }).join('') + '</ul><h3 class="c6-panel__title" style="margin-top:1rem">仍需組織提供</h3><ul class="c6-stage__list">' +
          [[!d.cisSafeguards.length, 'CIS Controls v8.1 Safeguard 清單（如 1.1、1.2…共 153 項與 IG 對應）', 'Safeguard 層級覆蓋率', 'data-import.html?ds=cisSafeguards'],
           [a.source === 'CAT6_DEFAULT' || W.usesDefaults({ r: d.risks }), '組織實際資料（風險情境、L / I、控制狀態）', '所有頁面（目前含示範值）', 'data-import.html']].map(function (i) {
            return '<li class="c6-stage__item"><span class="c6-stage__mark" aria-hidden="true">' + (i[0] ? '!' : '✓') + '</span><span><a href="' + i[3] + '">' + i[1] + '</a><br><span class="c6-muted">影響：' + i[2] + '</span></span>' + (i[0] ? '<span class="c6-dr">DATA REQUIRED</span>' : P.chip('已提供', 'ok')) + '</li>';
          }).join('') + '</ul>';
      });
    }

    function workspace() {
      var s = REPO.session(), cfg = (C.config && C.config.supabase) || {};
      var box = document.getElementById('ws-b');
      box.innerHTML = '<div class="c6-stack"><dl class="c6-kv"><dt>模式</dt><dd>' + (W.mode === 'supabase' ? P.chip('SUPABASE', 'accent') : P.chip('LOCAL / DEMO', '')) + '</dd>' +
        '<dt>儲存位置</dt><dd>' + (W.mode === 'supabase' ? 'Supabase（組織 ' + esc(cfg.organizationId) + '，RLS 保護）' : W.mode === 'memory' ? '記憶體（瀏覽器封鎖 localStorage；重新整理後遺失）' : '此瀏覽器 localStorage（不會上傳）') + '</dd>' +
        (W.reason ? '<dt>說明</dt><dd>' + esc(W.reason) + '</dd>' : '') + (s ? '<dt>登入</dt><dd>' + esc(s.email) + '</dd>' : '') + '</dl>' +
        (W.canSignIn ? '<form class="c6-stack" id="sb-form" novalidate><label class="c6-field"><span class="c6-var__lbl">Email</span><input class="c6-input" name="email" type="email" autocomplete="username" required></label><label class="c6-field"><span class="c6-var__lbl">Password</span><input class="c6-input" name="password" type="password" autocomplete="current-password" required></label><button class="c6-btn c6-btn--primary" type="submit">登入 Supabase</button><p class="c6-note" id="sb-err" role="alert"></p></form>' : '') +
        '<div class="c6-actions">' + (s ? '<button type="button" class="c6-btn c6-btn--secondary" id="sb-out">登出 Supabase</button>' : '') +
        '<button type="button" class="c6-btn c6-btn--secondary" id="reset">重新載入預設資料（頂峰科技情境案例）</button><button type="button" class="c6-btn c6-btn--ghost" id="clear">清除本機所有資料</button></div>' +
        '<p class="c6-note">前端只使用 Supabase 公開 anon key；service_role key 或密碼不會出現在程式碼中。設定方式見 docs/BACKEND.md。</p></div>';
      var form = document.getElementById('sb-form');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault(); var em = form.elements.email.value.trim(), pw = form.elements.password.value, err = document.getElementById('sb-err');
        if (!em || !pw) { err.textContent = '請輸入 Email 與密碼'; return; }
        REPO.signIn(em, pw).then(function () { location.reload(); }, function (x) { err.textContent = '登入失敗：' + x.message; });
      });
      var out = document.getElementById('sb-out'); if (out) out.addEventListener('click', function () { REPO.signOut(); location.reload(); });
      document.getElementById('reset').addEventListener('click', function () {
        C.ui.form.confirm('以預設資料（頂峰科技情境案例）覆寫 AS-DEMO 評估？（其他評估不受影響；AS-DEMO 中的修改與模擬紀錄會遺失）', '重新載入').then(function (ok) { if (ok) W.resetDemo().then(function () { location.reload(); }); });
      });
      document.getElementById('clear').addEventListener('click', function () {
        C.ui.form.confirm('清除此瀏覽器中所有 CAT.6 資料？下次開啟會重新載入預設資料（頂峰科技情境案例）。', '清除').then(function (ok) { if (ok) W.clearAll().then(function () { sessionStorage.removeItem('cat6:notice-ack'); location.reload(); }); });
      });
    }
    workspace();
    return render().then(function () { page.removeAttribute('aria-busy'); if (location.hash) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); } });
  });
})(globalThis.CAT6);
