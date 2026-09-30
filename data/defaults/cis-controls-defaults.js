/* CIS Controls v8.1 — 頂峰科技 case (CAT6_CIS_Controls_Filled.xlsx, CAT6_CIS_Safeguards_Filled.xlsx).
 * Control-level status per IG; safeguards are the subset listed in the attachment (not the full 153-item catalogue). */
CAT6.data.defaults.cisControls = [
  {"id": "CIS-01", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "情境未說明完整資產盤點；以部分實施估計。"},
  {"id": "CIS-02", "ig1": "NOT_ASSESSED", "ig2": "NOT_ASSESSED", "ig3": "NOT_ASSESSED", "notes": "題目未提供軟體資產管理證據。"},
  {"id": "CIS-03", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "存在敏感資料但備份/保護不足，資料管理成熟度偏低。"},
  {"id": "CIS-04", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "已有防火牆與伺服器，但重啟形成防禦盲區，安全設定韌性不足。"},
  {"id": "CIS-05", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "有安全憑證但未證明帳號生命週期管理成熟。"},
  {"id": "CIS-06", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "攻擊者能繞過憑證進入 CRM，推估存取控制僅部分有效。"},
  {"id": "CIS-07", "ig1": "NOT_ASSESSED", "ig2": "NOT_ASSESSED", "ig3": "NOT_ASSESSED", "notes": "題目未提供弱點掃描/修補資訊。"},
  {"id": "CIS-08", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "題目未描述集中日誌與告警；依事件未即時阻擋推估僅部分實施。"},
  {"id": "CIS-09", "ig1": "NOT_ASSESSED", "ig2": "NOT_ASSESSED", "ig3": "NOT_ASSESSED", "notes": "題目未涉及郵件/瀏覽器防護。"},
  {"id": "CIS-10", "ig1": "NOT_ASSESSED", "ig2": "NOT_ASSESSED", "ig3": "NOT_ASSESSED", "notes": "題目未提供惡意程式防護證據。"},
  {"id": "CIS-11", "ig1": "NOT_IMPLEMENTED", "ig2": "NOT_IMPLEMENTED", "ig3": "NOT_IMPLEMENTED", "notes": "明確指出工程師未養成定期備份習慣，核心資料僅存本機。"},
  {"id": "CIS-12", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "已有網路設備/防火牆，但停電重啟產生安全盲區。"},
  {"id": "CIS-13", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "駭客已潛伏網路邊緣且未被提前發現，監控能力不足。"},
  {"id": "CIS-14", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "題目指出核心部門缺乏嚴謹資安規範，推估訓練/意識僅部分實施。"},
  {"id": "CIS-15", "ig1": "NOT_ASSESSED", "ig2": "NOT_ASSESSED", "ig3": "NOT_ASSESSED", "notes": "題目未提供服務供應商管理資訊。"},
  {"id": "CIS-16", "ig1": "NOT_ASSESSED", "ig2": "NOT_ASSESSED", "ig3": "NOT_ASSESSED", "notes": "題目未提供應用程式安全開發證據。"},
  {"id": "CIS-17", "ig1": "PARTIAL", "ig2": "PARTIAL", "ig3": "PARTIAL", "notes": "事件發生後組織陷入混亂，顯示事件應變與演練不足。"},
  {"id": "CIS-18", "ig1": "NOT_ASSESSED", "ig2": "NOT_ASSESSED", "ig3": "NOT_ASSESSED", "notes": "題目未提供滲透測試資訊。"}
];
CAT6.data.defaults.cisSafeguards = [
  {"id": "3.1", "title": "Establish and Maintain a Data Management Process", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "3.3", "title": "Configure Data Access Control Lists", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "3.11", "title": "Encrypt Sensitive Data at Rest", "ig1": false, "ig2": true, "ig3": true, "status": "NOT_ASSESSED"},
  {"id": "4.1", "title": "Establish and Maintain a Secure Configuration Process", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "6.3", "title": "Require MFA for Externally-Exposed Applications", "ig1": true, "ig2": true, "ig3": true, "status": "NOT_IMPLEMENTED"},
  {"id": "6.5", "title": "Require MFA for Administrative Access", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "8.2", "title": "Collect Audit Logs", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "11.1", "title": "Establish and Maintain a Data Recovery Process", "ig1": true, "ig2": true, "ig3": true, "status": "NOT_IMPLEMENTED"},
  {"id": "11.2", "title": "Perform Automated Backups", "ig1": true, "ig2": true, "ig3": true, "status": "NOT_IMPLEMENTED"},
  {"id": "11.3", "title": "Protect Recovery Data", "ig1": true, "ig2": true, "ig3": true, "status": "NOT_IMPLEMENTED"},
  {"id": "11.4", "title": "Establish and Maintain an Isolated Instance of Recovery Data", "ig1": false, "ig2": true, "ig3": true, "status": "NOT_IMPLEMENTED"},
  {"id": "12.1", "title": "Ensure Network Infrastructure is Up-to-Date", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "13.1", "title": "Centralize Security Event Alerting", "ig1": false, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "13.6", "title": "Deploy a Network Intrusion Detection Solution", "ig1": false, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "17.1", "title": "Designate Personnel to Manage Incident Handling", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "17.4", "title": "Establish and Maintain an Incident Response Process", "ig1": true, "ig2": true, "ig3": true, "status": "PARTIAL"},
  {"id": "17.7", "title": "Conduct Routine Incident Response Exercises", "ig1": false, "ig2": true, "ig3": true, "status": "NOT_IMPLEMENTED"},
  {"id": "18.1", "title": "Establish and Maintain a Penetration Testing Program", "ig1": false, "ig2": true, "ig3": true, "status": "NOT_ASSESSED"}
];
