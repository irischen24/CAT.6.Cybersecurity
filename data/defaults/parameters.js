/* CAT.6 default parameters and their basis (採用依據).
 * Rule: organization input (USER_INPUT / FILE_IMPORT) always wins; when a value has not been entered the platform
 * default below is used for the calculation and shown as CAT6_DEFAULT together with its basis.
 * `assessmentKey` = field on the assessment record that overrides the default.
 * Values that are scenario-specific (a risk's own Likelihood / Impact, an asset, an owner) have no generic default:
 * they stay DATA REQUIRED unless the CAT.6 demonstration dataset is loaded. */
(function (C) {
  var P = [
    { key: 'riskCriteria', label: '5×5 風險計分與等級', value: 'Score = L × I；1–4 Low · 5–9 Moderate · 10–16 High · 17–25 Critical / Very High', basis: 'Risk_Criteria.pdf 與「NIST SP 800-30 的風險判定」：平台依 NIST 風險評估概念建立之 5×5 半定量矩陣；分數區間為平台自訂，非 ISO / NIST 官方分數。', doc: 'Risk_Criteria.pdf；確認_NIST_Table_I-2_與_H-3.pdf', editable: false },
    { key: 'liDescriptors', label: 'Likelihood / Impact 五級文字描述', value: 'L1 Rare … L5 Almost Certain；I1 Insignificant … I5 Severe / Catastrophic', basis: '專案提供之 5×5 L / I 文字描述，作為評分者一致判斷的依據。', doc: '5_5_各等級_L__I_的文字描述.pdf', editable: false },
    { key: 'nistRiskDetermination', label: 'NIST SP 800-30 風險判定', value: 'G-5 查表取得 Overall Likelihood；VL..VH → 1..5 後以 5×5 計分', basis: 'G-2 / G-3 / G-4 / G-5 依 Risk_Criteria.pdf（NIST SP 800-30 Rev.1 Appendix G）；風險判定依專案提供之平台 5×5 方法。Table I-2 僅列為參考。', doc: 'Risk_Criteria.pdf；確認_NIST_Table_I-2_與_H-3.pdf', editable: false },
    { key: 'cisRamAcceptableScore', assessmentKey: 'cisRamAcceptableScore', label: 'CIS RAM Risk Acceptance Threshold', value: 9, unit: '5×5 分數', basis: '專案提供之 CIS RAM 可接受準則：Risk ≤ 9 → Accept（符合接受準則）；Risk ≥ 10 → Treatment Required。9 為 Moderate 區間上限，High 以上一律需處理。組織可於 Setup 改為自己的門檻。', doc: 'CIS_RAM_可接受風險門檻.pdf', editable: true },
    { key: 'targetIG', assessmentKey: 'targetIG', label: 'CIS Controls 目標 Implementation Group', value: 'IG1', basis: 'CIS Controls v8.1 將 IG1 定義為「基本資安衛生（essential cyber hygiene）」，是所有企業都應達到的最低基準；組織規模或資料敏感度較高時應自行提高為 IG2 / IG3。', doc: 'CIS Critical Security Controls v8.1', editable: true },
    { key: 'csfScale', label: 'CSF 2.0 Readiness Index', value: '0 Not · 1 Partially · 2 Largely · 3 Fully Implemented；Readiness % → Initial / Developing / Defined / Managed / Optimized', basis: '專案提供之 CSF 2.0 Readiness Index（平台自訂 Index，非 NIST 官方公式）；Tier 1–4 僅作治理成熟度描述，不作為分數。', doc: '正式的_Readiness_評分方法.pdf', editable: false },
    { key: 'csfDefaultTarget', label: 'CSF Target Profile（未輸入時）', value: 3, unit: '0–3', basis: 'Readiness Index 的完整實施點（3 = Fully Implemented）；未設定 Target 的 Category 以 3 計算差距，使差距代表「距離完整實施」。組織設定 Target 後即以組織值為準。', doc: '正式的_Readiness_評分方法.pdf', editable: false },
    { key: 'isoReadiness', label: 'ISO/IEC 27001 Readiness Indicator', value: '九個領域完成比例之等權平均（無資料之領域不計入）', basis: '專案未提供 ISO 27001 專用之正式評分方法（提供之 Readiness 文件為 CSF 2.0 Index），因此採最透明的等權完成比例；非 ISO 官方評分、不預測驗證結果。', doc: 'CAT.6 平台方法', editable: false },
    { key: 'fairInputs', label: 'FAIR 三點估計（CF、PoA、Susceptibility、PL、SL）', value: '頂峰科技 RS-A～RS-D 四個情境', basis: '專案提供之頂峰科技 FAIR 填寫附件；題目未提供之頻率、機率與金額為 CAT.6 模擬推估（附件 Assumptions 工作表）。RS-B 數值同 FAIR 筆記 Scenario B。', doc: 'CAT6_FAIR_RS-A_to_RS-D_Filled.xlsx；FAIR筆記-20260926-Iris.md', editable: true },
    { key: 'fairSimulation', label: 'FAIR 模擬次數 / Seed', value: '1,000,000 次 · seed 20260926', basis: 'FAIR 筆記之蒙地卡羅設定；相同 seed 可重現。', doc: 'FAIR筆記-20260926-Iris.md', editable: true },
    { key: 'currency', assessmentKey: 'currency', label: '幣別', value: 'TWD', basis: 'FAIR 筆記所有金額以新台幣（NT$）表示。', doc: 'FAIR筆記-20260926-Iris.md', editable: true },
    { key: 'demoDataset', label: '預設資料集（風險、處理、NIST、CIS、CSF、ISO、證據、FAIR）', value: '頂峰科技情境案例（RS-A～RS-D）', basis: '專案提供之頂峰科技 11 份填寫附件；每筆標示 CAT6_DEFAULT。題目未提供之期限、狀態、殘餘風險與 FAIR 數值為 CAT.6 模擬推估，不代表頂峰科技真實資料。', doc: '頂峰科技填寫附件（2026-09-28）', editable: false }
  ];
  function def(key) { return P.filter(function (p) { return p.key === key; })[0]; }
  /* → { value, source: 'USER_INPUT' | 'CAT6_DEFAULT', basis, label } */
  function resolve(key, assessment) {
    var p = def(key); if (!p) throw new Error('Unknown parameter ' + key);
    var v = p.assessmentKey && assessment ? assessment[p.assessmentKey] : null;
    var has = v != null && v !== '';
    return { key: key, label: p.label, value: has ? v : p.value, source: has ? (assessment.source === 'CAT6_DEFAULT' ? 'CAT6_DEFAULT' : 'USER_INPUT') : 'CAT6_DEFAULT', isDefault: !has, basis: p.basis, doc: p.doc, unit: p.unit };
  }
  function value(key, assessment) { return resolve(key, assessment).value; }
  C.data.defaults = C.data.defaults || {};
  C.data.defaults.parameters = { list: P, get: def, resolve: resolve, value: value };
})(globalThis.CAT6);
