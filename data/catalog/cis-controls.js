/* CIS Critical Security Controls v8.1 — the 18 Controls (titles only) and Implementation Groups.
 * Safeguard-level text is not bundled: import the official CIS workbook via the Data Import Center
 * (template: CAT6_CIS_Safeguards_Template). */
(function (C) {
  var titles = ['Inventory and Control of Enterprise Assets', 'Inventory and Control of Software Assets', 'Data Protection',
    'Secure Configuration of Enterprise Assets and Software', 'Account Management', 'Access Control Management',
    'Continuous Vulnerability Management', 'Audit Log Management', 'Email and Web Browser Protections', 'Malware Defenses',
    'Data Recovery', 'Network Infrastructure Management', 'Network Monitoring and Defense', 'Security Awareness and Skills Training',
    'Service Provider Management', 'Application Software Security', 'Incident Response Management', 'Penetration Testing'];
  /* Chinese concept names supplied by the project (CIS_Controls_v8_1_Safeguard_清單.pdf — lists the 18 Controls). */
  var zh = ['企業資產盤點與控制', '軟體資產盤點與控制', '資料保護', '安全組態', '帳號管理', '存取控制', '持續弱點管理', '稽核日誌管理', 'Email／瀏覽器保護',
    '惡意程式防禦', '資料復原', '網路基礎設施管理', '網路監控與防禦', '資安意識與技能訓練', '服務供應商管理', '應用程式安全', '事件回應管理', '滲透測試'];
  var controls = titles.map(function (t, i) { var n = i + 1; return { id: 'CIS-' + (n < 10 ? '0' : '') + n, num: n, title: t, zh: zh[i] }; });
  var igs = [
    { id: 'IG1', zh: '基本網路衛生（Essential Cyber Hygiene）' },
    { id: 'IG2', zh: 'IG1 + 較複雜環境與較敏感資料' },
    { id: 'IG3', zh: 'IG1 + IG2 + 面對進階攻擊者之組織' }
  ];
  var statuses = [
    { id: 'NOT_ASSESSED', zh: '未評估', shape: '○' },
    { id: 'NOT_IMPLEMENTED', zh: '未實施', shape: '✕' },
    { id: 'PARTIAL', zh: '部分實施', shape: '◐' },
    { id: 'IMPLEMENTED', zh: '已實施', shape: '●' },
    { id: 'NOT_APPLICABLE', zh: '不適用', shape: '—' }
  ];
  C.data.cis = { controls: controls, igs: igs, statuses: statuses };
})(CAT6);
