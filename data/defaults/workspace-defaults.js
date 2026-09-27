/* Demo assessment setup. */
CAT6.data.defaults.workspace = {
  assessment: {
    id: 'AS-DEMO', organization: 'CAT.6 示範組織（Demo Org）', name: 'CAT.6 綜合示範評估', type: 'COMBINED',
    scope: '示範範圍：總部資訊機房、ERP 營運系統、雲端檔案儲存與員工端點（僅供示範）',
    date: '2026-09-26', assessor: 'CAT.6 Demo', dataSource: 'CAT6_DEFAULT',
    frameworks: ['ISO27001', 'CSF2', 'SP80030', 'CISRAM', 'CISV81', 'FAIR'],
    targetIG: 'IG1', cisRamAcceptableScore: null, currency: 'TWD', source: 'CAT6_DEFAULT'
  },
  /* Demo register snapshots (High + Critical count). */
  snapshots: [
    { id: '2025-Q4', label: '2025 Q4', highCritical: 6 }, { id: '2026-Q1', label: '2026 Q1', highCritical: 5 },
    { id: '2026-Q2', label: '2026 Q2', highCritical: 5 }
  ]
};
