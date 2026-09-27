/* Demo CIS RAM worksheet rows. Inherent / residual use CAT.6 5×5 criteria (platform-defined).
 * Acceptable-risk threshold is intentionally NOT defaulted: CIS RAM requires the organization to define it. */
CAT6.data.defaults.cisram = [
  { id: 'CR-001', riskId: 'RS-D1', scenario: '勒索軟體加密營運系統', asset: 'ERP 營運伺服器', threat: '勒索軟體集團', vulnerability: '遠端存取服務未即時修補',
    impact: '營運中斷、訂單延遲、還原成本', safeguards: ['CIS-07', 'CIS-10', 'CIS-11'], inherentLikelihood: 4, inherentImpact: 5,
    safeguardAssessment: 'CIS 11 部分實施：離線備份未定期還原測試；CIS 7 修補週期 30 天以上', residualLikelihood: 2, residualImpact: 4, recommended: '季度還原演練、修補週期縮短至 14 天' },
  { id: 'CR-002', riskId: 'RS-D4', scenario: '雲端儲存權限設定錯誤', asset: '雲端檔案儲存', threat: '內部人員（非蓄意）', vulnerability: '缺乏共享權限定期檢視',
    impact: '個資外洩、法遵責任', safeguards: ['CIS-03', 'CIS-06'], inherentLikelihood: 3, inherentImpact: 4,
    safeguardAssessment: '尚未建立共享連結稽核', residualLikelihood: 2, residualImpact: 3, recommended: '每月共享連結檢視、預設禁止公開連結' },
  { id: 'CR-003', riskId: 'RS-B', scenario: '資料外洩：Firewall 重啟空窗', asset: '客戶個資資料庫', threat: '外部攻擊者', vulnerability: 'Firewall 重啟期間無替代過濾',
    impact: '個資外洩通報、商譽損失', safeguards: ['CIS-12', 'CIS-13'], inherentLikelihood: 4, inherentImpact: 5,
    safeguardAssessment: 'CIS 13 網路監控部分實施', residualLikelihood: 3, residualImpact: 4, recommended: 'Firewall HA、重啟期間備援過濾' }
];
