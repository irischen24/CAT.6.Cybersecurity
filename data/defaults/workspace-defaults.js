/* Default assessment — 頂峰科技（TingFeng）case study, from the project's filled templates (頂峰科技情境案例附件（2026-09-28）).
 * All seeded values carry source CAT6_DEFAULT: they are case-study / simulated values, not verified company records. */
CAT6.data.defaults.workspace = {
  assessment: {
    id: 'AS-DEMO', organization: '頂峰科技', name: '頂峰科技 2026 年整合式資訊安全風險評估', type: 'COMBINED',
    scope: '總部、CRM 客戶管理系統、研發資料、網路／伺服器及關鍵營運流程（依 ISO 條款 4.3 差異說明）',
    date: '2026-09-28', assessor: 'CAT.6 情境案例（附件填寫）', dataSource: 'CAT6_DEFAULT（頂峰科技情境案例附件）',
    frameworks: ['ISO27001', 'CSF2', 'SP80030', 'CISRAM', 'CISV81', 'FAIR'],
    targetIG: 'IG1', cisRamAcceptableScore: null, currency: 'TWD', source: 'CAT6_DEFAULT'
  },
  /* No historical quarter data was provided for 頂峰科技, so no trend snapshots are seeded. */
  snapshots: []
};
