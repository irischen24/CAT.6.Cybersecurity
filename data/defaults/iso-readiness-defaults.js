/* ISO/IEC 27001 readiness — 頂峰科技 case (CAT6_ISO27001_Readiness_TingFeng_Filled.xlsx). Not audit evidence or a certification result.
 * Context fields are taken from the attachment's clause 4.1–4.3 gap notes. The audit record AUD-2026-01 is not in the
 * attachment as a row: it is the audit the attachment's findings reference (date = evidence date, auditor not provided).
 * No management review or roadmap task status was provided, so none are seeded. */
CAT6.data.defaults.iso = {
  context: {"id": "ctx", "issuesInternal": "已辨識停電、資安攻擊、資料遺失與勞資風險，但題目未提供正式組織情境分析程序。", "issuesExternal": "區域電網過載停電、外部駭客集團攻擊、勞資事件（工會罷工）", "interestedParties": "可辨識客戶、員工、主管機關與工會等利害關係人，但未見正式需求清單。", "requirements": "CRM 含姓名、身分證字號等個資，需 PII 與隱私保護（SoA A.5.34）", "scopeStatement": "本次模擬範圍涵蓋總部、CRM、研發資料、網路/伺服器及關鍵營運流程；未見正式 ISMS Scope 文件。", "boundaries": "總部實體場域、CRM、研發端點與網路／伺服器", "interfaces": "", "exclusions": ""},
  clauses: {"4.1": {"status": "PARTIAL", "gapNote": "已辨識停電、資安攻擊、資料遺失與勞資風險，但題目未提供正式組織情境分析程序。", "owner": "ISMS Manager", "dueDate": "2026-10-31"}, "4.2": {"status": "PARTIAL", "gapNote": "可辨識客戶、員工、主管機關與工會等利害關係人，但未見正式需求清單。", "owner": "ISMS Manager", "dueDate": "2026-10-31"}, "4.3": {"status": "PARTIAL", "gapNote": "本次模擬範圍涵蓋總部、CRM、研發資料、網路/伺服器及關鍵營運流程；未見正式 ISMS Scope 文件。", "owner": "ISMS Manager", "dueDate": "2026-10-31"}, "4.4": {"status": "NOT_IMPLEMENTED", "gapNote": "連鎖事件顯示缺乏一致、制度化且可持續運作的 ISMS 管理機制。", "owner": "ISMS Manager", "dueDate": "2026-11-30"}, "5.1": {"status": "PARTIAL", "gapNote": "管理階層有介入災後處理，但以無限制加班因應，顯示領導、資源與持續營運治理不足。", "owner": "Executive", "dueDate": "2026-10-31"}, "5.2": {"status": "PARTIAL", "gapNote": "核心研發缺乏嚴謹資安規範，推估資訊安全政策未完整落實。", "owner": "CISO", "dueDate": "2026-10-31"}, "5.3": {"status": "PARTIAL", "gapNote": "IT、客服等關鍵責任過度集中，需明確化角色、責任與替代機制。", "owner": "Executive / HR", "dueDate": "2026-10-31"}, "6.1.1": {"status": "PARTIAL", "gapNote": "已存在重大風險與改善需求，但未見制度化的風險與機會管理程序。", "owner": "Risk Owner", "dueDate": "2026-10-31"}, "6.1.2": {"status": "NOT_IMPLEMENTED", "gapNote": "題目未提供正式資訊安全風險評估方法、準則與週期。", "owner": "CISO / Risk", "dueDate": "2026-10-31"}, "6.1.3": {"status": "NOT_IMPLEMENTED", "gapNote": "未見正式風險處理計畫與 Statement of Applicability。", "owner": "CISO / Risk", "dueDate": "2026-11-15"}, "6.2": {"status": "PARTIAL", "gapNote": "未見可量測的備份、偵測、復原、事件應變與訓練目標。", "owner": "ISMS Manager", "dueDate": "2026-11-30"}, "6.3": {"status": "PARTIAL", "gapNote": "防火牆重啟形成盲區，顯示重大變更的資安風險評估與變更控制不足。", "owner": "IT Manager", "dueDate": "2026-11-30"}, "7.1": {"status": "PARTIAL", "gapNote": "IT 與客服長期超載，顯示資訊安全與營運持續資源不足。", "owner": "Executive", "dueDate": "2026-10-31"}, "7.2": {"status": "PARTIAL", "gapNote": "需補強備份、事件應變、BCP/DR 與安全操作能力。", "owner": "HR / CISO", "dueDate": "2026-11-30"}, "7.3": {"status": "PARTIAL", "gapNote": "研發人員未養成定期備份習慣，顯示資訊安全意識不足。", "owner": "HR / CISO", "dueDate": "2026-11-30"}, "7.4": {"status": "PARTIAL", "gapNote": "事件期間跨部門與對外溝通混亂，需建立通報與溝通矩陣。", "owner": "PR / CISO", "dueDate": "2026-11-30"}, "7.5": {"status": "NOT_IMPLEMENTED", "gapNote": "題目未提供受控的備份程序、事件應變程序、風險評估紀錄等文件化資訊。", "owner": "ISMS Manager", "dueDate": "2026-11-30"}, "8.1": {"status": "PARTIAL", "gapNote": "現有營運控制無法有效承受停電、資料損壞、入侵及人力中斷的連鎖影響。", "owner": "IT / BCM", "dueDate": "2026-11-30"}, "8.2": {"status": "NOT_IMPLEMENTED", "gapNote": "未見定期或重大變更後執行資訊安全風險評估的證據。", "owner": "CISO / Risk", "dueDate": "2026-11-30"}, "8.3": {"status": "NOT_IMPLEMENTED", "gapNote": "未見正式風險處理執行、追蹤與殘餘風險核准機制。", "owner": "Risk Owners", "dueDate": "2026-12-15"}, "9.1": {"status": "NOT_IMPLEMENTED", "gapNote": "未見 ISMS KPI、監控、量測、分析與成效評估機制。", "owner": "ISMS Manager", "dueDate": "2026-12-15"}, "9.2": {"status": "NOT_IMPLEMENTED", "gapNote": "題目未提供內部稽核計畫或結果。", "owner": "Internal Audit", "dueDate": "2026-12-31"}, "9.3": {"status": "NOT_IMPLEMENTED", "gapNote": "題目未提供正式管理審查紀錄。", "owner": "Executive", "dueDate": "2026-12-31"}, "10.1": {"status": "PARTIAL", "gapNote": "事件暴露多項改善需求，但未見制度化的持續改善閉環。", "owner": "ISMS Manager", "dueDate": "2026-12-31"}, "10.2": {"status": "NOT_IMPLEMENTED", "gapNote": "未見不符合、根因分析、矯正措施與成效驗證的正式流程。", "owner": "ISMS Manager", "dueDate": "2026-11-30"}},
  soa: [
    {"id": "A.5.1", "applicable": true, "justification": "需建立與落實資訊安全政策，以改善核心研發缺乏嚴謹資安規範。", "status": "PARTIAL"},
    {"id": "A.5.2", "applicable": true, "justification": "需明確定義資訊安全角色、責任與跨部門協作。", "status": "PARTIAL"},
    {"id": "A.5.24", "applicable": true, "justification": "RS-B 已發生資料外洩與勒索，需正式事件管理規劃與準備。", "status": "PARTIAL"},
    {"id": "A.5.29", "applicable": true, "justification": "停電與罷工期間仍需維持資訊安全與關鍵服務。", "status": "NOT_IMPLEMENTED"},
    {"id": "A.5.30", "applicable": true, "justification": "總部停電及人力中斷顯示需建立 ICT business continuity readiness。", "status": "NOT_IMPLEMENTED"},
    {"id": "A.5.34", "applicable": true, "justification": "CRM 含姓名、身分證字號等個資，需要 PII 與隱私保護。", "status": "PARTIAL"},
    {"id": "A.6.3", "applicable": true, "justification": "研發未定期備份，需資訊安全意識、教育與訓練。", "status": "PARTIAL"},
    {"id": "A.7.11", "applicable": true, "justification": "RS-A 顯示公用電力中斷可直接造成關鍵系統停擺。", "status": "NOT_IMPLEMENTED"},
    {"id": "A.8.2", "applicable": true, "justification": "RS-B 需限制與管理特權存取，以降低入侵後影響。", "status": "PARTIAL"},
    {"id": "A.8.5", "applicable": true, "justification": "攻擊者成功繞過安全憑證，需強化安全驗證機制。", "status": "PARTIAL"},
    {"id": "A.8.13", "applicable": true, "justification": "RS-C 關鍵研發資料因未備份而不可復原。", "status": "NOT_IMPLEMENTED"},
    {"id": "A.8.14", "applicable": true, "justification": "停電及防火牆重啟顯示關鍵資訊處理設施需具備冗餘。", "status": "NOT_IMPLEMENTED"},
    {"id": "A.8.15", "applicable": true, "justification": "需保留日誌以支援入侵偵測、調查與鑑識。", "status": "PARTIAL"},
    {"id": "A.8.16", "applicable": true, "justification": "攻擊者已潛伏網路邊緣，需持續監控異常活動。", "status": "PARTIAL"},
    {"id": "A.8.20", "applicable": true, "justification": "需強化網路安全、高可用與安全故障切換。", "status": "PARTIAL"},
    {"id": "A.8.21", "applicable": true, "justification": "需定義網路服務安全與可用性要求，避免重啟造成防禦盲區。", "status": "PARTIAL"}
  ],
  tasks: {},
  audits: [ {"id": "AUD-2026-01", "area": "事件後 ISMS 情境稽核（依附件 Findings）", "clause": "A.8.13; A.8.20; A.5.24; 7.1", "planned": "2026-09-28", "auditor": "", "status": "Completed"} ],
  findings: [
    {"id": "F-001", "auditId": "AUD-2026-01", "clause": "A.8.13", "type": "MAJOR_NC", "description": "關鍵研發資料未建立定期、自動且可驗證的備份與復原機制。", "status": "Open", "dueDate": "2026-10-15"},
    {"id": "F-002", "auditId": "AUD-2026-01", "clause": "A.8.20", "type": "MAJOR_NC", "description": "防火牆重啟期間形成防禦盲區並遭外部攻擊者利用。", "status": "Open", "dueDate": "2026-10-31"},
    {"id": "F-003", "auditId": "AUD-2026-01", "clause": "A.5.24", "type": "MINOR_NC", "description": "事件應變、通報及跨部門協調不足，事件期間組織陷入混亂。", "status": "Open", "dueDate": "2026-11-15"},
    {"id": "F-004", "auditId": "AUD-2026-01", "clause": "7.1", "type": "OFI", "description": "關鍵 IT/客服人力過度集中且長期超載，需建立替代人力與工作負荷管理。", "status": "Open", "dueDate": "2026-11-30"}
  ],
  capas: [
    {"id": "CA-001", "findingId": "F-001", "rootCause": "缺乏正式備份政策、責任分工與復原驗證要求", "action": "導入 3-2-1 自動備份、不可變/離線副本、異地備份與季度復原測試。", "owner": "IT / R&D", "dueDate": "2026-10-15", "status": "In progress"},
    {"id": "CA-002", "findingId": "F-002", "rootCause": "網路設備缺乏高可用與安全故障切換設計", "action": "部署 Firewall HA、MFA、集中式日誌/SIEM、NDR/IDS，並測試斷電與重啟情境。", "owner": "IT Security", "dueDate": "2026-10-31", "status": "Planned"},
    {"id": "CA-003", "findingId": "F-003", "rootCause": "事件應變角色、程序與通報機制未制度化", "action": "建立 IR Playbook、通報矩陣、證據保全程序及定期桌上演練。", "owner": "CISO / BCM", "dueDate": "2026-11-15", "status": "Planned"},
    {"id": "CA-004", "findingId": "F-004", "rootCause": "關鍵人力集中、工作分配失衡且缺乏災難期間替代安排", "action": "建立交叉訓練、關鍵職務替代名單、災難輪班制度、工作負荷上限與危機溝通機制。", "owner": "HR / Executive / BCM", "dueDate": "2026-11-30", "status": "Planned"}
  ],
  reviews: [],
  evidence: [
    {"id": "EV-001", "requirement": "A.8.20", "name": "現有網路防火牆與安全憑證", "description": "證明已有邊界防護，但停電重啟時形成短暫防禦盲區。", "owner": "IT Security", "date": "2026-09-28", "status": "Submitted", "relatedRisk": "RS-B", "framework": "ISO27001"},
    {"id": "EV-002", "requirement": "A.8.13", "name": "研發備份現況紀錄", "description": "工程師長期未定期備份，關鍵製程參數與原始碼僅存本機。", "owner": "R&D / IT", "date": "2026-09-28", "status": "Accepted", "relatedRisk": "RS-C", "framework": "ISO27001"},
    {"id": "EV-003", "requirement": "A.5.24", "name": "CRM 資安事件紀錄", "description": "外部駭客入侵 CRM、外洩數萬筆敏感資料並勒索。", "owner": "CISO", "date": "2026-09-28", "status": "Submitted", "relatedRisk": "RS-B", "framework": "ISO27001"},
    {"id": "EV-004", "requirement": "A.7.11", "name": "總部停電事件紀錄", "description": "區域電網過載造成總部冷氣、照明、伺服器與網路設備中斷。", "owner": "Facilities", "date": "2026-09-28", "status": "Accepted", "relatedRisk": "RS-A", "framework": "ISO27001"},
    {"id": "EV-005", "requirement": "7.1", "name": "災後人力與加班事件紀錄", "description": "IT 與客服長期超載，災後又被要求無限制加班，後續引發罷工。", "owner": "HR", "date": "2026-09-28", "status": "Submitted", "relatedRisk": "RS-D", "framework": "ISO27001"},
    {"id": "EV-006", "requirement": "6.1.3", "name": "CAT.6 Risk Treatment", "description": "已建立 RS-A～RS-D 的模擬風險處理措施與殘餘風險。", "owner": "CISO / Risk", "date": "2026-09-28", "status": "Draft", "relatedRisk": "RS-A; RS-B; RS-C; RS-D", "framework": "ISO27001"}
  ]
};
