/* CAT.6 DEMO / ASSUMED dataset for the Dashboard.
 * Every value here is CAT6_DEFAULT demonstration data — NOT organization data, NOT audit evidence.
 * Scenario B text is taken from the FAIR notes; other scenario names are illustrative placeholders. */
CAT6.data.demo = {
  notice: 'No organization-specific data was provided. CAT.6 default assumptions are being used.',
  register: [
    { id: 'RS-B', name: '資料外洩：外部攻擊者利用 Firewall 重啟空窗', method: 'CAT6', frameworks: ['SP80030', 'FAIR', 'CISV81', 'ISO27001'],
      likelihood: { value: 4, source: 'CAT6_DEFAULT' }, impact: { value: 5, source: 'CAT6_DEFAULT' }, status: 'In review' },
    { id: 'RS-D1', name: '勒索軟體加密營運系統（示範）', method: 'CISRAM', frameworks: ['CISRAM', 'CISV81'],
      likelihood: { value: 3, source: 'CAT6_DEFAULT' }, impact: { value: 5, source: 'CAT6_DEFAULT' }, status: 'Draft' },
    { id: 'RS-D2', name: '電力 / UPS 中斷導致服務停擺（示範）', method: 'SP80030', frameworks: ['SP80030', 'CSF2'],
      likelihood: { value: 3, source: 'CAT6_DEFAULT' }, impact: { value: 4, source: 'CAT6_DEFAULT' }, status: 'Assessed' },
    { id: 'RS-D3', name: '釣魚郵件竊取帳號憑證（示範）', method: 'CAT6', frameworks: ['CSF2', 'CISV81'],
      likelihood: { value: 4, source: 'CAT6_DEFAULT' }, impact: { value: 3, source: 'CAT6_DEFAULT' }, status: 'Assessed' },
    { id: 'RS-D4', name: '雲端儲存權限設定錯誤（示範）', method: 'CISRAM', frameworks: ['CISRAM', 'ISO27001'],
      likelihood: { value: 2, source: 'CAT6_DEFAULT' }, impact: { value: 4, source: 'CAT6_DEFAULT' }, status: 'Draft' },
    { id: 'RS-D5', name: '內部人員誤刪共用資料（示範）', method: 'SP80030', frameworks: ['SP80030'],
      likelihood: { value: 2, source: 'CAT6_DEFAULT' }, impact: { value: 2, source: 'CAT6_DEFAULT' }, status: 'Assessed' }
  ],
  /* Demo snapshots of the register (count of HIGH + CRITICAL per quarter). Illustrative only. */
  trend: { labels: ['2025 Q4', '2026 Q1', '2026 Q2', '2026 Q3'], values: [6, 5, 5, 4], source: 'CAT6_DEFAULT' },
  /* System events for this session — describes where values came from; no fictional users. */
  activity: [
    { who: 'CAT.6 示範資料集', what: '載入 6 個示範風險情境（Likelihood / Impact 皆為假設值）', source: 'CAT6_DEFAULT' },
    { who: 'riskMatrixEngine', what: '依 CAT.6 Platform Risk Criteria 計算 6 筆 5×5 風險分數', source: 'CALCULATED' },
    { who: 'FAIR 預設值', what: 'Scenario B 的 CF / PoA / Susceptibility / PL / SL 取自 FAIR 筆記', source: 'CAT6_DEFAULT' },
    { who: '組織資料', what: '尚未輸入或匯入 — 上傳範本後此處會顯示 USER_INPUT / FILE_IMPORT 紀錄', source: 'USER_INPUT', pending: true }
  ]
};
