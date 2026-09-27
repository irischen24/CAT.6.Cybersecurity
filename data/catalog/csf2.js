/* NIST CSF 2.0 (CSWP 29, 2024) — Functions and Categories. Identifiers and names only. */
(function (C) {
  var F = [
    ['GV', 'GOVERN', '治理', [['GV.OC', 'Organizational Context'], ['GV.RM', 'Risk Management Strategy'], ['GV.RR', 'Roles, Responsibilities, and Authorities'], ['GV.PO', 'Policy'], ['GV.OV', 'Oversight'], ['GV.SC', 'Cybersecurity Supply Chain Risk Management']]],
    ['ID', 'IDENTIFY', '識別', [['ID.AM', 'Asset Management'], ['ID.RA', 'Risk Assessment'], ['ID.IM', 'Improvement']]],
    ['PR', 'PROTECT', '保護', [['PR.AA', 'Identity Management, Authentication, and Access Control'], ['PR.AT', 'Awareness and Training'], ['PR.DS', 'Data Security'], ['PR.PS', 'Platform Security'], ['PR.IR', 'Technology Infrastructure Resilience']]],
    ['DE', 'DETECT', '偵測', [['DE.CM', 'Continuous Monitoring'], ['DE.AE', 'Adverse Event Analysis']]],
    ['RS', 'RESPOND', '回應', [['RS.MA', 'Incident Management'], ['RS.AN', 'Incident Analysis'], ['RS.CO', 'Incident Response Reporting and Communication'], ['RS.MI', 'Incident Mitigation']]],
    ['RC', 'RECOVER', '復原', [['RC.RP', 'Incident Recovery Plan Execution'], ['RC.CO', 'Incident Recovery Communication']]]
  ];
  var functions = F.map(function (f) { return { id: f[0], name: f[1], zh: f[2], categories: f[3].map(function (c) { return { id: c[0], name: c[1], fn: f[0] }; }) }; });
  var categories = [].concat.apply([], functions.map(function (f) { return f.categories; }));
  /* CAT.6-defined ordinal scale. CSF 2.0 does not prescribe numeric scores for categories; Tiers describe
   * governance/management practices, so they are not reused here. */
  /* CSF 2.0 Readiness Index (source: 正式的_Readiness_評分方法.pdf). Platform-defined 0–3 implementation score —
   * NOT an official NIST CSF 2.0 score. Tiers are shown separately as a governance description, never as a score. */
  var scale = [
    { v: 0, zh: '尚未實施', en: 'Not Implemented' },
    { v: 1, zh: '部分實施', en: 'Partially Implemented' },
    { v: 2, zh: '大部分實施', en: 'Largely Implemented' },
    { v: 3, zh: '完整實施', en: 'Fully Implemented' }
  ];
  var readinessLevels = [
    { id: 'INITIAL', en: 'Initial', min: 0, max: 20, text: '大部分 outcomes 尚未實施' },
    { id: 'DEVELOPING', en: 'Developing', min: 21, max: 40, text: '已開始建立相關控制與流程' },
    { id: 'DEFINED', en: 'Defined', min: 41, max: 60, text: '多項要求已建立，但仍有明顯 Gap' },
    { id: 'MANAGED', en: 'Managed', min: 61, max: 80, text: '多數適用 outcomes 已有效實施' },
    { id: 'OPTIMIZED', en: 'Optimized', min: 81, max: 100, text: '大部分適用 outcomes 已完整實施並持續改善' }
  ];
  var tiers = [
    { id: 1, en: 'Partial', text: '資安風險治理與管理實務較為臨時、反應式或不完整' },
    { id: 2, en: 'Risk Informed', text: '已具風險意識，但相關實務可能尚未形成全組織一致的政策與流程' },
    { id: 3, en: 'Repeatable', text: '已建立正式政策、流程及一致性的風險管理實務，並定期更新' },
    { id: 4, en: 'Adaptive', text: '組織會依經驗、威脅環境與預測性資訊持續調整資安實務' }
  ];
  C.data.csf = { functions: functions, categories: categories, scale: scale, readinessLevels: readinessLevels, tiers: tiers, scaleMax: 3,
    scaleNote: 'CSF 2.0 Readiness Index：0 尚未實施、1 部分實施、2 大部分實施、3 完整實施（平台自訂 Index，非 NIST 官方公式）。Readiness % = Σ Current ÷ (3 × 已評估 Categories)，Readiness Level 為平台定義之實施指標，非 NIST CSF 2.0 官方分數。' };
})(CAT6);
