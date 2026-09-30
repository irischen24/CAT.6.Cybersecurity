/* CAT.6 FAIR default / assumed values. `fields` = template for a new scenario (頂峰科技 RS-B values, identical to the FAIR notes' Scenario B);
 * `scenarios` = the four 頂峰科技 scenarios seeded as the default dataset.
 * Source: FAIR筆記-20260926-Iris.md, Python engine block. These are DEMO assumptions,
 * not organization data and not official FAIR values. Inspectable in the UI. */
CAT6.data.fairDefaults = {
  scenario: { id: 'RS-B', name: 'RS-B · 防火牆重啟盲區遭駭客利用，CRM 資料外洩並勒索', source: 'CAT6_DEFAULT' },
  version: '2026.09.26', lastUpdated: '2026-09-26', currency: 'TWD',
  simulation: { iterations: 1000000, seed: 20260926 },
  presets: [
    { id: 'QUICK', label: 'Quick', iterations: 10000 },
    { id: 'STANDARD', label: 'Standard', iterations: 100000 },
    { id: 'HIGH', label: 'High precision', iterations: 1000000 }
  ],
  fields: [
    { field: 'CF', label: '接觸頻率 Contact Frequency', unit: 'events/year', kind: 'count',
      value: { min: 2, mostLikely: 4, max: 6 }, source: 'CAT6_DEFAULT',
      assumption: 'Demonstration scenario only',
      reason: '個案未提供實際資料；筆記註明應以 UPS、Firewall、SIEM 與電力事件紀錄校正。' },
    { field: 'PoA', label: '威脅行動機率 Probability of Action', unit: 'probability', kind: 'prob',
      value: { min: 0.50, mostLikely: 0.60, max: 0.80 }, source: 'CAT6_DEFAULT',
      assumption: 'Demonstration scenario only',
      reason: '外部攻擊者已持續觀察目標，行動機率假設高於隨機掃描。' },
    { field: 'Susceptibility', label: '易感性 Susceptibility', unit: 'probability', kind: 'prob',
      value: { min: 0.60, mostLikely: 0.75, max: 0.80 }, source: 'CAT6_DEFAULT',
      assumption: 'Demonstration scenario only',
      reason: 'Threat Capability 高（可捕捉 Firewall 重啟空窗）；Resistance Strength 弱。' },
    { field: 'PrimaryLoss', label: '主要損失 Primary Loss', unit: 'TWD', kind: 'money',
      value: { min: 1425000, mostLikely: 1530000, max: 2600000 }, source: 'CAT6_DEFAULT',
      assumption: 'Demonstration scenario only',
      reason: '採筆記 Python 引擎值。筆記 Step 3 文字寫 1,125,000，與程式不一致，詳見 docs/METHODOLOGY-NOTES.md。' },
    { field: 'SecondaryLoss', label: '次要損失 Secondary Loss', unit: 'TWD', kind: 'money',
      value: { min: 600000, mostLikely: 2600000, max: 9200000 }, source: 'CAT6_DEFAULT',
      assumption: 'Demonstration scenario only',
      reason: '以台灣法規與實際個資外洩案件為錨點（筆記 Step 2）。' }
  ],
  /* 頂峰科技 FAIR scenarios RS-A…RS-D (CAT6_FAIR_RS-A_to_RS-D_Filled.xlsx). Frequencies, probabilities and amounts are
   * CAT.6 ASSUMPTION / SIMULATED VALUES (attachment 'Assumptions' sheet) — not 頂峰科技 financial data, not FAIR official values. */
  scenarioNote: "所有題目未提供的頻率、條件機率與金額均為網站模擬推估，不代表頂峰科技真實財務資料，也不是 FAIR 官方預設值。正式使用時應由企業以事件紀錄、財務資料、保險/法遵成本與專家估計替換。",
  scenarios: [
    {"scenarioId": "FS-001", "riskId": "RS-A", "scenarioName": "區域電網過載造成總部停電與營運中斷", "reason": "題目未提供停電年頻率與財務損失。CF 以每年 1–4 次有效電力中斷接觸推估；PoA/Susceptibility 偏高，因總部高度依賴電力且備援不足。Primary Loss 估停機、復原、設備與人工作業成本；Secondary Loss 估 SLA、客戶影響與延遲等後續損失。", "values": {"CF": {"min": 1, "mostLikely": 2, "max": 4}, "PoA": {"min": 0.7, "mostLikely": 0.85, "max": 0.95}, "Susceptibility": {"min": 0.55, "mostLikely": 0.7, "max": 0.85}, "PrimaryLoss": {"min": 300000, "mostLikely": 900000, "max": 2500000}, "SecondaryLoss": {"min": 50000, "mostLikely": 250000, "max": 1000000}}},
    {"scenarioId": "FS-002", "riskId": "RS-B", "scenarioName": "防火牆重啟盲區遭駭客利用，CRM 資料外洩並勒索", "reason": "沿用先前 CAT.6 RS-B FAIR demo 值。此事件最符合 FAIR 的威脅事件/損失事件量化；已成功入侵且外洩敏感資料，因此 Susceptibility 與 Secondary Loss 設為偏高。", "values": {"CF": {"min": 2, "mostLikely": 4, "max": 6}, "PoA": {"min": 0.5, "mostLikely": 0.6, "max": 0.8}, "Susceptibility": {"min": 0.6, "mostLikely": 0.75, "max": 0.8}, "PrimaryLoss": {"min": 1425000, "mostLikely": 1530000, "max": 2600000}, "SecondaryLoss": {"min": 600000, "mostLikely": 2600000, "max": 9200000}}},
    {"scenarioId": "FS-003", "riskId": "RS-C", "scenarioName": "未定期備份，硬碟損壞造成研發核心資料遺失", "reason": "題目未提供硬碟故障率與研發資料財務價值。因缺乏備份且資料已不可復原，Susceptibility 設為極高；Primary Loss 主要估資料重建、研發延誤與復原成本，Secondary Loss 估產品上市延誤與商業影響。", "values": {"CF": {"min": 1, "mostLikely": 2, "max": 4}, "PoA": {"min": 0.65, "mostLikely": 0.8, "max": 0.95}, "Susceptibility": {"min": 0.75, "mostLikely": 0.9, "max": 0.98}, "PrimaryLoss": {"min": 500000, "mostLikely": 1800000, "max": 5000000}, "SecondaryLoss": {"min": 100000, "mostLikely": 700000, "max": 2500000}}},
    {"scenarioId": "FS-004", "riskId": "RS-D", "scenarioName": "人力調度失衡與長期勞動壓力引發罷工，造成營運停擺", "reason": "FAIR 原生較適合資訊/網路風險，RS-D 屬營運/人力風險，因此此列僅作 CAT.6 跨框架情境模擬。CF 設較低；損失估停工、復原延遲、替代人力與客戶/聲譽後續影響。", "values": {"CF": {"min": 0.5, "mostLikely": 1, "max": 2}, "PoA": {"min": 0.45, "mostLikely": 0.65, "max": 0.85}, "Susceptibility": {"min": 0.55, "mostLikely": 0.75, "max": 0.9}, "PrimaryLoss": {"min": 800000, "mostLikely": 2500000, "max": 7000000}, "SecondaryLoss": {"min": 300000, "mostLikely": 1500000, "max": 5000000}}}
  ],
  /* Reference output from the notes' numpy run (seed 20260926, N = 1,000,000) — used by tests only. */
  referenceResult: { AnnualRisk_P50: 10148294, LEF_P50: 1.7933 }
};
