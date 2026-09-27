/* Demo NIST SP 800-30 assessments. Levels use VL/L/M/H/VH; G-5 and I-2 results are CALCULATED, not stored. */
CAT6.data.defaults.nist = [
  { id: 'NA-001', riskId: 'RS-B', sourceType: 'ADV', threatSource: '外部攻擊者（組織化犯罪）', threatEvent: '利用 Firewall 重啟空窗滲透並外洩客戶資料',
    vulnerability: 'Firewall 重啟期間無替代過濾', vulnSeverity: 'H', predisposing: 'UPS 電力事件導致網路設備頻繁重啟', controls: 'SIEM 告警（部分覆蓋）', initiation: 'H', adverseImpact: 'H', impact: 'H' },
  { id: 'NA-002', riskId: 'RS-D2', sourceType: 'NONADV', threatSource: '電力供應異常（結構性失效）', threatEvent: 'UPS 失效造成主機斷電',
    vulnerability: 'UPS 電池老化', vulnSeverity: 'M', predisposing: '機房僅單一供電迴路', controls: 'UPS 年度檢查', initiation: 'M', adverseImpact: 'H', impact: 'M' },
  { id: 'NA-003', riskId: 'RS-D5', sourceType: 'NONADV', threatSource: '內部人員誤操作', threatEvent: '誤刪共用資料夾',
    vulnerability: '共用資料夾權限過寬', vulnSeverity: 'L', predisposing: '多部門共用同一資料夾', controls: '每日備份', initiation: 'M', adverseImpact: 'L', impact: 'L' }
];
