/* CAT.6 FAIR default / assumed values — Risk Scenario B (資料外洩) demonstration.
 * Source: FAIR筆記-20260926-Iris.md, Python engine block. These are DEMO assumptions,
 * not organization data and not official FAIR values. Inspectable in the UI. */
CAT6.data.fairDefaults = {
  scenario: { id: 'RS-B', name: 'Risk Scenario B · 資料外洩', source: 'CAT6_DEFAULT' },
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
  /* Reference output from the notes' numpy run (seed 20260926, N = 1,000,000) — used by tests only. */
  referenceResult: { AnnualRisk_P50: 10148294, LEF_P50: 1.7933 }
};
