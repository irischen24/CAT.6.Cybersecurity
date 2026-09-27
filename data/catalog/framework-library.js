/* Framework Library content. Purpose / CAT.6 role come from the CAT.6 project spec; process descriptions
 * summarise the public source documents at a structural level only (no requirement text reproduced).
 * `pages` lists where each framework is used in this site. */
CAT6.data.library = {
  ISO27001: {
    overview: '國際資訊安全管理系統（ISMS）標準，以管理系統方式建立、實施、維持並持續改善資訊安全。本文為第 4–10 章要求，附錄 A 列出 93 項控制措施（組織、人員、實體、技術四大主題）。',
    purpose: '建立、實施、維持並持續改善資訊安全管理系統。',
    input: ['組織全景與利害關係者', 'ISMS 範圍', '風險評鑑準則與結果', '控制措施實施狀態', '證據與文件化資訊', '內部稽核與管理審查紀錄'],
    process: ['全景與範圍（第 4 章）', '領導與政策（第 5 章）', '風險評鑑與處理規劃、適用性聲明（第 6 章）', '支援：資源、適任、認知、文件（第 7 章）', '運作（第 8 章）', '績效評估：監督量測、內部稽核、管理審查（第 9 章）', '改善：不符合與矯正、持續改善（第 10 章）'],
    logic: 'Plan–Do–Check–Act 管理循環。標準要求組織自行定義風險準則；CAT.6 5×5 為平台自定義準則，非 ISO 指定公式。',
    output: ['風險處理計畫', 'Statement of Applicability', '差異分析結果', '稽核發現與矯正措施', 'CAT.6 Readiness Indicator（非 ISO 官方分數）'],
    improvement: '由內部稽核、管理審查與矯正措施驅動持續改善；正式驗證須由獨立驗證機構執行，CAT.6 不核發證書。',
    fields: ['Organization Context', 'ISMS Scope', 'Clause Gap Status', 'Annex A Applicability / Justification', 'Evidence', 'Finding', 'Corrective Action', 'Management Review Inputs'],
    related: ['CSF2', 'CISRAM', 'CISV81', 'SP80030'],
    pages: [['ISO 27001 Readiness', 'iso-readiness.html'], ['Gap & SoA', 'iso-gap.html'], ['Audit & Review', 'iso-audit.html'], ['Evidence', 'evidence.html']]
  },
  CSF2: {
    overview: 'NIST Cybersecurity Framework 2.0（2024）以 6 個 Functions、22 個 Categories 描述網路安全成果，用 Current / Target Profile 呈現現況與目標。',
    purpose: '提供共同結構以理解、評估、排序、溝通並改善網路安全風險。',
    input: ['各 Category 目前實施情況', '目標狀態', '業務優先順序', '改善行動與負責人'],
    process: ['界定範圍', '建立 Current Profile', '建立 Target Profile', '差距分析', '擬定並執行改善行動計畫'],
    logic: 'Gap = Target − Current；CSF 2.0 Readiness Index 0–3（平台自訂，非 NIST 官方公式），Readiness % 對應 Initial / Developing / Defined / Managed / Optimized。',
    output: ['Current / Target Profile', '差距分析', '改善行動', 'Function 進度圖'],
    improvement: '定期更新 Profile，追蹤改善行動完成度。',
    fields: ['Category', 'Current (0–3)', 'Target (0–3)', 'Gap', 'Improvement Action', 'Owner', 'Due Date'],
    related: ['ISO27001', 'CISV81'],
    pages: [['NIST CSF 2.0', 'nist-csf.html']]
  },
  SP80030: {
    overview: 'NIST SP 800-30 Rev.1 風險評鑑指引，定義威脅來源、威脅事件、弱點與前置條件、可能性、衝擊、風險判定等風險因子，並提供附錄 D–I 的評估尺度。',
    purpose: '執行資訊安全風險評鑑與風險分析。',
    input: ['Threat Source（敵意 / 非敵意）', 'Threat Event', 'Vulnerability / Predisposing Condition', '現有控制措施', '可能性（G-2 或 G-3、G-4）', '衝擊（H-3）'],
    process: ['準備評鑑（目的、範圍、假設、資訊來源、風險模型）', '識別威脅來源與事件', '識別弱點與前置條件', '判定可能性', '判定衝擊', '判定風險', '溝通結果', '維護評鑑'],
    logic: 'Overall Likelihood 依 Table G-5 查表；Level of Risk 依 Table I-2 查表（兩者皆非乘法）。',
    output: ['Risk Level', '風險分析結果', '風險矩陣', '風險登錄'],
    improvement: '依持續監控結果更新評鑑（Step 4 Maintain）。',
    fields: ['Threat Source Type', 'Threat Event', 'Vulnerability', 'Predisposing Condition', 'Initiation / Occurrence Likelihood', 'Adverse Impact Likelihood', 'Overall Likelihood', 'Impact', 'Risk'],
    related: ['CISRAM', 'ISO27001', 'FAIR'],
    pages: [['NIST SP 800-30', 'nist-800-30.html']]
  },
  CISRAM: {
    overview: 'CIS Risk Assessment Method v2.2（2025-12 發布，對應 CIS Controls v8.1），由 CIS 與 HALOCK 發展，協助組織定義可接受風險並依 CIS Safeguards 評估風險。',
    purpose: '以組織自訂的衝擊與可接受風險準則，評估處理前 / 後風險並判斷是否可接受。',
    input: ['Risk Scenario', 'Asset', 'Threat', 'Vulnerability', 'Impact', 'Existing Safeguards', '組織可接受風險定義'],
    process: ['定義風險準則與可接受風險', '建立風險情境', '評估處理前風險', '評估 Safeguard', '評估處理後風險', '判斷可接受性', '登錄風險'],
    logic: 'CAT.6 以平台 5×5 準則計算處理前 / 後分數；CIS RAM 官方衝擊與可能性準則未提供於本專案，可接受門檻須由組織輸入。',
    output: ['CIS RAM Risk Register', 'Inherent / Residual Risk', 'Risk Acceptability'],
    improvement: '不可接受之風險轉入 Risk Treatment 並對應 CIS Safeguards。',
    fields: ['Scenario', 'Asset', 'Threat', 'Vulnerability', 'Impact', 'Existing Safeguards', 'Inherent L/I', 'Safeguard Assessment', 'Residual L/I', 'Acceptability'],
    related: ['CISV81', 'SP80030', 'ISO27001'],
    pages: [['CIS RAM', 'cis-ram.html']]
  },
  CISV81: {
    overview: 'CIS Critical Security Controls v8.1：18 項控制、依實施群組 IG1 / IG2 / IG3 分層的 Safeguards。',
    purpose: '以優先排序的安全控制降低常見攻擊風險，並作為風險處理的控制來源。',
    input: ['目標 IG', '各控制之 IG 實施狀態', '（選用）官方 Safeguard 清單與狀態'],
    process: ['決定目標 IG', '評估現有控制', '找出差距', '對應風險處理', '追蹤實施'],
    logic: 'Coverage = 已實施項目數 / 評估項目數（計數，不加權）。',
    output: ['控制評估表', 'IG 覆蓋率', '控制差距', '風險處理對應'],
    improvement: '依差距擬定處理計畫並逐步提升 IG。',
    fields: ['Control', 'Target IG', 'IG1 / IG2 / IG3 Status', 'Linked Risks', 'Safeguard ID', 'Safeguard Status'],
    related: ['CISRAM', 'CSF2', 'ISO27001'],
    pages: [['CIS Controls', 'cis-controls.html']]
  },
  FAIR: {
    overview: 'Factor Analysis of Information Risk：以財務金額量化風險，將損失事件頻率與損失幅度分解後以蒙地卡羅模擬產生分布。',
    purpose: '以財務金額量化網路安全風險並支援決策。',
    input: ['CF 接觸頻率', 'PoA 行動機率', 'Susceptibility 易感性', 'Primary Loss', 'Secondary Loss'],
    process: ['界定情境', '三點估計輸入', '蒙地卡羅模擬（每次重新抽樣）', '分布與百分位', '決策分析'],
    logic: 'TEF = CF × PoA；LEF = TEF × Susceptibility；LM = PL + SL；Annual Risk = LEF × LM。',
    output: ['Annual Risk P10–P95 / Mean', '損失分布直方圖', '損失超越曲線'],
    improvement: '以處理後的輸入重新模擬，比較處理前後的年度風險。',
    fields: ['CF', 'PoA', 'Susceptibility', 'Primary Loss', 'Secondary Loss', 'Iterations', 'Seed'],
    related: ['SP80030', 'ISO27001'],
    pages: [['FAIR Analysis', 'fair-analysis.html']]
  }
};
