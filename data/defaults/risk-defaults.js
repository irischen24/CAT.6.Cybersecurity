/* Demo Risk Register + Treatments. Scenario B text comes from the FAIR notes; other scenarios are illustrative. */
CAT6.data.defaults.risks = [
  { id: 'RS-B', scenario: '資料外洩：外部攻擊者利用 Firewall 重啟空窗', asset: '客戶個資資料庫', threatSource: '外部攻擊者', threatEvent: '於 Firewall 重啟期間滲透並外洩資料',
    vulnerability: 'Firewall 重啟期間無替代過濾', existingControls: 'SIEM 告警（部分覆蓋）', method: 'SP80030', frameworks: ['SP80030', 'FAIR', 'CISV81', 'ISO27001'],
    likelihood: 4, impact: 5, treatment: 'Mitigate', owner: '資訊部主管', dueDate: '2026-12-31', status: 'In review', residualLikelihood: 2, residualImpact: 4, cisControls: ['CIS-12', 'CIS-13'], fair: true },
  { id: 'RS-D1', scenario: '勒索軟體加密營運系統（示範）', asset: 'ERP 營運伺服器', threatSource: '勒索軟體集團', threatEvent: '加密營運資料並勒索',
    vulnerability: '遠端存取服務未即時修補', existingControls: '端點防毒、每週備份', method: 'CISRAM', frameworks: ['CISRAM', 'CISV81'],
    likelihood: 3, impact: 5, treatment: 'Mitigate', owner: '系統管理組', dueDate: '2026-09-15', status: 'Treatment planned', residualLikelihood: 2, residualImpact: 4, cisControls: ['CIS-07', 'CIS-10', 'CIS-11'] },
  { id: 'RS-D2', scenario: '電力 / UPS 中斷導致服務停擺（示範）', asset: '資訊機房', threatSource: '電力供應異常', threatEvent: 'UPS 失效造成主機斷電',
    vulnerability: 'UPS 電池老化', existingControls: 'UPS 年度檢查', method: 'SP80030', frameworks: ['SP80030', 'CSF2'],
    likelihood: 3, impact: 4, treatment: 'Mitigate', owner: '總務部', dueDate: '2026-11-30', status: 'Assessed', residualLikelihood: 2, residualImpact: 3, cisControls: [] },
  { id: 'RS-D3', scenario: '釣魚郵件竊取帳號憑證（示範）', asset: '員工郵件帳號', threatSource: '外部攻擊者', threatEvent: '釣魚郵件誘導輸入密碼',
    vulnerability: '未全面啟用多因子驗證', existingControls: '郵件過濾', method: 'CAT6', frameworks: ['CSF2', 'CISV81'],
    likelihood: 4, impact: 3, treatment: 'Mitigate', owner: '資訊部主管', dueDate: '2026-10-31', status: 'Assessed', residualLikelihood: 2, residualImpact: 3, cisControls: ['CIS-06', 'CIS-09', 'CIS-14'] },
  { id: 'RS-D4', scenario: '雲端儲存權限設定錯誤（示範）', asset: '雲端檔案儲存', threatSource: '內部人員（非蓄意）', threatEvent: '共享連結公開導致資料外流',
    vulnerability: '缺乏共享權限定期檢視', existingControls: '無', method: 'CISRAM', frameworks: ['CISRAM', 'ISO27001'],
    likelihood: 2, impact: 4, treatment: 'Mitigate', owner: '資訊部主管', dueDate: '2027-01-31', status: 'Draft', residualLikelihood: null, residualImpact: null, cisControls: ['CIS-03'] },
  { id: 'RS-D5', scenario: '內部人員誤刪共用資料（示範）', asset: '檔案伺服器', threatSource: '內部人員（非蓄意）', threatEvent: '誤刪共用資料夾',
    vulnerability: '共用資料夾權限過寬', existingControls: '每日備份', method: 'SP80030', frameworks: ['SP80030'],
    likelihood: 2, impact: 2, treatment: 'Accept', owner: '各部門主管', dueDate: '', status: 'Assessed', residualLikelihood: 2, residualImpact: 2, cisControls: [] }
];
CAT6.data.defaults.treatments = [
  { id: 'TR-001', riskId: 'RS-B', strategy: 'Mitigate', control: '建置 Firewall HA 並於重啟期間啟用備援過濾', framework: 'CISV81', refs: { iso: ['A.8.20', 'A.8.14'], csf: ['PR.IR'], cis: ['CIS-12', 'CIS-13'] }, owner: '資訊部主管', priority: 'P1', dueDate: '2026-12-31', status: 'In progress' },
  { id: 'TR-002', riskId: 'RS-D1', strategy: 'Mitigate', control: '離線備份與季度還原演練', framework: 'CISV81', refs: { iso: ['A.8.13'], csf: ['PR.DS', 'RC.RP'], cis: ['CIS-11'] }, owner: '系統管理組', priority: 'P1', dueDate: '2026-09-15', status: 'In progress' },
  { id: 'TR-003', riskId: 'RS-D3', strategy: 'Mitigate', control: '全員啟用多因子驗證', framework: 'ISO27001', refs: { iso: ['A.5.17', 'A.8.5'], csf: ['PR.AA'], cis: ['CIS-06'] }, owner: '資訊部主管', priority: 'P2', dueDate: '2026-10-31', status: 'Planned' },
  { id: 'TR-004', riskId: 'RS-D2', strategy: 'Mitigate', control: '更換 UPS 電池並建立雙迴路供電', framework: 'ISO27001', refs: { iso: ['A.7.11'], csf: ['PR.IR'], cis: [] }, owner: '總務部', priority: 'P2', dueDate: '2026-08-31', status: 'Completed' }
];
