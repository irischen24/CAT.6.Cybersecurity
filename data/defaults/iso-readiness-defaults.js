/* Demo ISO/IEC 27001 readiness data. None of this is audit evidence or a certification result. */
CAT6.data.defaults.iso = {
  context: { id: 'ctx', issuesInternal: '示範：資訊人力有限、ERP 為核心營運系統', issuesExternal: '示範：個資法規要求、勒索軟體威脅升高',
    interestedParties: '示範：客戶、主管機關、供應商', requirements: '示範：個資保護、契約保密條款', scopeStatement: '示範：總部資訊機房與 ERP 營運服務',
    boundaries: '示範：總部實體場域與雲端檔案儲存', interfaces: '', exclusions: '' },
  clauses: { '4.1': 'IMPLEMENTED', '4.2': 'IMPLEMENTED', '4.3': 'PARTIAL', '4.4': 'PARTIAL', '5.1': 'PARTIAL', '5.2': 'IMPLEMENTED', '5.3': 'PARTIAL',
    '6.1.1': 'PARTIAL', '6.1.2': 'PARTIAL', '6.1.3': 'NOT_IMPLEMENTED', '6.2': 'NOT_IMPLEMENTED', '6.3': 'NOT_ASSESSED', '7.1': 'PARTIAL', '7.2': 'PARTIAL',
    '7.3': 'NOT_IMPLEMENTED', '7.4': 'PARTIAL', '7.5': 'PARTIAL', '8.1': 'NOT_ASSESSED', '8.2': 'PARTIAL', '8.3': 'NOT_IMPLEMENTED', '9.1': 'NOT_IMPLEMENTED',
    '9.2': 'NOT_IMPLEMENTED', '9.3': 'NOT_IMPLEMENTED', '10.1': 'NOT_ASSESSED', '10.2': 'NOT_IMPLEMENTED' },
  soa: [
    ['A.5.1', true, 'IMPLEMENTED'], ['A.5.2', true, 'PARTIAL'], ['A.5.9', true, 'PARTIAL'], ['A.5.15', true, 'PARTIAL'], ['A.5.17', true, 'PARTIAL'],
    ['A.5.23', true, 'NOT_IMPLEMENTED'], ['A.5.24', true, 'NOT_IMPLEMENTED'], ['A.5.30', true, 'NOT_IMPLEMENTED'], ['A.5.34', true, 'PARTIAL'],
    ['A.6.3', true, 'NOT_IMPLEMENTED'], ['A.7.11', true, 'IMPLEMENTED'], ['A.8.5', true, 'PARTIAL'], ['A.8.7', true, 'IMPLEMENTED'],
    ['A.8.8', true, 'PARTIAL'], ['A.8.13', true, 'PARTIAL'], ['A.8.14', true, 'NOT_IMPLEMENTED'], ['A.8.15', true, 'PARTIAL'], ['A.8.16', true, 'PARTIAL'],
    ['A.8.20', true, 'PARTIAL'], ['A.8.4', false, null, '示範：組織無自行開發之原始碼'], ['A.8.30', false, null, '示範：無委外開發']
  ],
  tasks: { plan: 'IN_PROGRESS', pol: 'IN_PROGRESS', trn: 'NOT_STARTED', assets: 'IN_PROGRESS', ci: 'NOT_STARTED', ap: 'NOT_STARTED' },
  audits: [
    { id: 'IA-001', area: '第 6 章 風險評鑑與處理', clause: '6.1.2', planned: '2026-10-15', auditor: '示範內稽員 A', status: 'Planned' },
    { id: 'IA-002', area: 'Annex A 技術控制抽樣', clause: 'A.8', planned: '2026-08-20', auditor: '示範內稽員 B', status: 'Completed' }
  ],
  findings: [
    { id: 'FD-001', auditId: 'IA-002', clause: 'A.8.13', type: 'MINOR_NC', description: '備份未執行還原測試紀錄（示範）', status: 'Open', dueDate: '2026-10-31' },
    { id: 'FD-002', auditId: 'IA-002', clause: 'A.8.8', type: 'OFI', description: '弱點修補週期可縮短（示範）', status: 'Open', dueDate: '2026-12-31' },
    { id: 'FD-003', auditId: 'IA-002', clause: 'A.5.15', type: 'MINOR_NC', description: '離職帳號未於 3 日內停用（示範）', status: 'Closed', dueDate: '2026-09-10' }
  ],
  capas: [
    { id: 'CA-001', findingId: 'FD-001', rootCause: '備份程序未要求還原測試', action: '修訂備份程序並每季執行還原演練', owner: '系統管理組', dueDate: '2026-10-31', status: 'In progress' },
    { id: 'CA-002', findingId: 'FD-003', rootCause: '人事異動未通知資訊部', action: '建立人事系統自動通知', owner: '人資部', dueDate: '2026-09-10', status: 'Closed' }
  ],
  reviews: [ { id: 'MR-001', date: '2026-07-30', chair: '示範：總經理', inputs: ['a', 'b', 'd', 'f'], decisions: '示範：核准 Firewall HA 預算', status: 'Held' } ],
  evidence: [
    { id: 'EV-001', requirement: '5.2', name: '資訊安全政策 v1.0', description: '經管理階層核定之政策（示範）', owner: '資安長', date: '2026-05-01', status: 'Accepted', relatedRisk: '', framework: 'ISO27001' },
    { id: 'EV-002', requirement: 'A.8.13', name: '備份排程設定截圖', description: '每週備份排程（示範）', owner: '系統管理組', date: '2026-08-01', status: 'Submitted', relatedRisk: 'RS-D1', framework: 'ISO27001' },
    { id: 'EV-003', requirement: '6.1.2', name: '風險評鑑報告草稿', description: 'CAT.6 產出之示範報告', owner: '資訊部主管', date: '2026-09-20', status: 'Draft', relatedRisk: 'RS-B', framework: 'ISO27001' },
    { id: 'EV-004', requirement: 'A.7.11', name: 'UPS 維護紀錄', description: '年度維護報告（示範）', owner: '總務部', date: '2026-08-31', status: 'Accepted', relatedRisk: 'RS-D2', framework: 'ISO27001' },
    { id: 'EV-005', requirement: 'CIS-06', name: 'MFA 啟用清單', description: '已啟用 MFA 之帳號清單（示範）', owner: '資訊部主管', date: '', status: 'Draft', relatedRisk: 'RS-D3', framework: 'CISV81' },
    { id: 'EV-006', requirement: '9.2', name: '內部稽核計畫', description: '年度稽核計畫（示範）', owner: '內稽', date: '2026-06-01', status: 'Rejected', relatedRisk: '', framework: 'ISO27001' }
  ]
};
