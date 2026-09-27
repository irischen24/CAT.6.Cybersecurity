/* ISO/IEC 27001:2022 structure — clause and Annex A control identifiers and short titles only.
 * Requirement text is NOT reproduced (ISO copyright). Verify titles against the purchased standard.
 * Used for Gap Assessment, Statement of Applicability and report tables. */
(function (C) {
  var clauses = [
    ['4.1', '4', 'Understanding the organization and its context', '了解組織及其全景'],
    ['4.2', '4', 'Understanding the needs and expectations of interested parties', '了解利害關係者之需要與期望'],
    ['4.3', '4', 'Determining the scope of the ISMS', '決定 ISMS 範圍'],
    ['4.4', '4', 'Information security management system', '資訊安全管理系統'],
    ['5.1', '5', 'Leadership and commitment', '領導與承諾'],
    ['5.2', '5', 'Policy', '政策'],
    ['5.3', '5', 'Organizational roles, responsibilities and authorities', '組織角色、責任與權限'],
    ['6.1.1', '6', 'Actions to address risks and opportunities — General', '因應風險與機會之行動—一般要求'],
    ['6.1.2', '6', 'Information security risk assessment', '資訊安全風險評鑑'],
    ['6.1.3', '6', 'Information security risk treatment', '資訊安全風險處理'],
    ['6.2', '6', 'Information security objectives and planning to achieve them', '資訊安全目標及其達成規劃'],
    ['6.3', '6', 'Planning of changes', '變更之規劃'],
    ['7.1', '7', 'Resources', '資源'],
    ['7.2', '7', 'Competence', '適任性'],
    ['7.3', '7', 'Awareness', '認知'],
    ['7.4', '7', 'Communication', '溝通'],
    ['7.5', '7', 'Documented information', '文件化資訊'],
    ['8.1', '8', 'Operational planning and control', '運作之規劃及控制'],
    ['8.2', '8', 'Information security risk assessment', '資訊安全風險評鑑（執行）'],
    ['8.3', '8', 'Information security risk treatment', '資訊安全風險處理（執行）'],
    ['9.1', '9', 'Monitoring, measurement, analysis and evaluation', '監督、量測、分析及評估'],
    ['9.2', '9', 'Internal audit', '內部稽核'],
    ['9.3', '9', 'Management review', '管理審查'],
    ['10.1', '10', 'Continual improvement', '持續改善'],
    ['10.2', '10', 'Nonconformity and corrective action', '不符合事項及矯正措施']
  ].map(function (c) { return { id: c[0], clause: c[1], title: c[2], zh: c[3] }; });

  var A = {
    '5': ['Policies for information security', 'Information security roles and responsibilities', 'Segregation of duties', 'Management responsibilities',
      'Contact with authorities', 'Contact with special interest groups', 'Threat intelligence', 'Information security in project management',
      'Inventory of information and other associated assets', 'Acceptable use of information and other associated assets', 'Return of assets',
      'Classification of information', 'Labelling of information', 'Information transfer', 'Access control', 'Identity management',
      'Authentication information', 'Access rights', 'Information security in supplier relationships',
      'Addressing information security within supplier agreements', 'Managing information security in the ICT supply chain',
      'Monitoring, review and change management of supplier services', 'Information security for use of cloud services',
      'Information security incident management planning and preparation', 'Assessment and decision on information security events',
      'Response to information security incidents', 'Learning from information security incidents', 'Collection of evidence',
      'Information security during disruption', 'ICT readiness for business continuity',
      'Legal, statutory, regulatory and contractual requirements', 'Intellectual property rights', 'Protection of records',
      'Privacy and protection of PII', 'Independent review of information security',
      'Compliance with policies, rules and standards for information security', 'Documented operating procedures'],
    '6': ['Screening', 'Terms and conditions of employment', 'Information security awareness, education and training', 'Disciplinary process',
      'Responsibilities after termination or change of employment', 'Confidentiality or non-disclosure agreements', 'Remote working',
      'Information security event reporting'],
    '7': ['Physical security perimeters', 'Physical entry', 'Securing offices, rooms and facilities', 'Physical security monitoring',
      'Protecting against physical and environmental threats', 'Working in secure areas', 'Clear desk and clear screen',
      'Equipment siting and protection', 'Security of assets off-premises', 'Storage media', 'Supporting utilities', 'Cabling security',
      'Equipment maintenance', 'Secure disposal or re-use of equipment'],
    '8': ['User end point devices', 'Privileged access rights', 'Information access restriction', 'Access to source code', 'Secure authentication',
      'Capacity management', 'Protection against malware', 'Management of technical vulnerabilities', 'Configuration management',
      'Information deletion', 'Data masking', 'Data leakage prevention', 'Information backup',
      'Redundancy of information processing facilities', 'Logging', 'Monitoring activities', 'Clock synchronization',
      'Use of privileged utility programs', 'Installation of software on operational systems', 'Networks security',
      'Security of network services', 'Segregation of networks', 'Web filtering', 'Use of cryptography', 'Secure development life cycle',
      'Application security requirements', 'Secure system architecture and engineering principles', 'Secure coding',
      'Security testing in development and acceptance', 'Outsourced development',
      'Separation of development, test and production environments', 'Change management', 'Test information',
      'Protection of information systems during audit testing']
  };
  var THEMES = { '5': 'Organizational 組織', '6': 'People 人員', '7': 'Physical 實體', '8': 'Technological 技術' };
  var annexA = [];
  Object.keys(A).forEach(function (t) { A[t].forEach(function (title, i) { annexA.push({ id: 'A.' + t + '.' + (i + 1), theme: t, themeName: THEMES[t], title: title }); }); });

  /* Clause 9.3.2 management review inputs (a–g), paraphrased. */
  var reviewInputs = [
    { id: 'a', zh: '先前管理審查決議之行動狀態' },
    { id: 'b', zh: '與 ISMS 相關之內外部議題變更' },
    { id: 'c', zh: '利害關係者需要與期望之變更' },
    { id: 'd', zh: '資訊安全績效回饋（不符合與矯正、量測結果、稽核結果、目標達成）' },
    { id: 'e', zh: '利害關係者之回饋' },
    { id: 'f', zh: '風險評鑑結果與風險處理計畫狀態' },
    { id: 'g', zh: '持續改善之機會' }
  ];

  /* Readiness roadmap (four stages from the CAT.6 spec). `auto` items are derived from module data. */
  var roadmap = [
    { id: 1, en: 'Preparation & Gap Analysis', zh: '前期盤點與差異分析', items: [
      { id: 'context', en: 'Organization Context', zh: '組織全景', auto: 'context', href: 'iso-readiness.html#context' },
      { id: 'scope', en: 'ISMS Scope', zh: 'ISMS 範圍', auto: 'scope', href: 'iso-readiness.html#context' },
      { id: 'assets', en: 'Asset Inventory', zh: '資產清冊', href: 'risk-register.html' },
      { id: 'gap', en: 'Gap Assessment', zh: '差異分析', auto: 'gap', href: 'iso-gap.html' },
      { id: 'plan', en: 'Implementation Plan', zh: '導入計畫' } ] },
    { id: 2, en: 'ISMS Implementation', zh: '建立並運行 ISMS', items: [
      { id: 'ra', en: 'Risk Assessment', zh: '風險評鑑', auto: 'riskAssessment', href: 'risk-assessment.html' },
      { id: 'rr', en: 'Risk Register', zh: '風險登錄表', auto: 'riskRegister', href: 'risk-register.html' },
      { id: 'rt', en: 'Risk Treatment', zh: '風險處理', auto: 'riskTreatment', href: 'risk-treatment.html' },
      { id: 'cm', en: 'Control Mapping', zh: '控制對應', auto: 'controlMapping', href: 'risk-treatment.html' },
      { id: 'soa', en: 'Statement of Applicability', zh: '適用性聲明', auto: 'soa', href: 'iso-gap.html#soa' },
      { id: 'pol', en: 'Policies', zh: '政策與程序' },
      { id: 'ev', en: 'Evidence', zh: '證據', auto: 'evidence', href: 'evidence.html' },
      { id: 'trn', en: 'Training', zh: '教育訓練' } ] },
    { id: 3, en: 'Internal Audit & Management Review', zh: '內部稽核與管理審查', items: [
      { id: 'ia', en: 'Internal Audit', zh: '內部稽核', auto: 'audit', href: 'iso-audit.html' },
      { id: 'fd', en: 'Findings', zh: '稽核發現', auto: 'findings', href: 'iso-audit.html#findings' },
      { id: 'ca', en: 'Corrective Actions', zh: '矯正措施', auto: 'capa', href: 'iso-audit.html#capa' },
      { id: 'rs', en: 'Risk Status', zh: '風險追蹤', auto: 'riskStatus', href: 'risk-treatment.html' },
      { id: 'mr', en: 'Management Review', zh: '管理審查', auto: 'review', href: 'iso-audit.html#review' },
      { id: 'ci', en: 'Continual Improvement', zh: '持續改善' } ] },
    { id: 4, en: 'Certification Audit Preparation', zh: '第三方驗證準備', items: [
      { id: 'ec', en: 'Evidence Checklist', zh: '證據清單', auto: 'evidence', href: 'evidence.html' },
      { id: 'ap', en: 'Audit Preparation', zh: '稽核準備（Stage 1 / Stage 2 文件）' },
      { id: 'ft', en: 'Finding Tracking', zh: '缺失追蹤', auto: 'capa', href: 'iso-audit.html#capa' },
      { id: 'cr', en: 'Certification Readiness', zh: '驗證準備度檢視', auto: 'overall', href: 'iso-readiness.html' } ] }
  ];

  C.data.iso = { clauses: clauses, annexA: annexA, themes: THEMES, reviewInputs: reviewInputs, roadmap: roadmap,
    note: '僅列條款與 Annex A 控制編號及簡短標題；要求本文請參閱 ISO/IEC 27001:2022 正式文本。' };
})(CAT6);
