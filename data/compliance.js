/* CAT.6 Trust & Security — compliance / assurance program records (production-ready data model).
 * Every record below is a DEMONSTRATION: isDemo = true, no issuer, no certificate / report number, no verification by a
 * third party. The UI only allows the badges DEMO / PLANNED / ROADMAP for demo records; CERTIFIED / VERIFIED / PASSED
 * can only ever appear for a production record (isDemo = false) that has an issuer, issue & expiry date and an
 * independent verification URL (see C.data.compliance.canClaim).
 * type: CERTIFICATION (ISO certificate) · ASSESSMENT (security testing — never a certification) ·
 *       ATTESTATION_REPORT (SOC 2 examination report — not a certificate). */
(function (C) {
  var items = [
    { id: 'iso27001', name: 'ISO/IEC 27001', type: 'CERTIFICATION', subtitle: 'Information Security Management System (ISMS)', icon: 'shield',
      status: 'PLANNED', badges: ['DEMO', 'PLANNED'], statusLabel: 'DEMO / PLANNED CERTIFICATION',
      description: 'CAT.6 以 ISO/IEC 27001 為資訊安全管理制度的重要基礎，涵蓋資訊安全治理、風險管理、控制措施、持續改善與 ISMS 管理生命週期。',
      scope: 'CAT.6 Cybersecurity Risk Assessment Platform', points: ['資訊安全治理', '風險評鑑與處理', 'Annex A 控制措施', '內部稽核與管理審查', 'PDCA 持續改善'],
      issueDate: null, expiryDate: null, issuer: null, documentId: 'DEMO-ISO27001-CAT6-001', documentTitle: 'ISO/IEC 27001 Demo Certificate', verificationUrl: null, isDemo: true, lastUpdated: '2026-09-28' },
    { id: 'vapt', name: 'Vulnerability Assessment & Penetration Testing (VAPT)', shortName: 'VAPT', type: 'ASSESSMENT', subtitle: 'Security Testing Program', icon: 'target',
      status: 'DEMO', badges: ['DEMO'], statusLabel: 'SECURITY TESTING PROGRAM — DEMO',
      description: 'CAT.6 規劃定期執行弱點掃描與滲透測試，透過弱點識別、風險分級、修補與重新驗證，持續改善平台安全性。',
      scope: 'CAT.6 web application, APIs and hosting infrastructure', points: ['Vulnerability Assessment', 'Penetration Testing', 'Web Application Security', 'Infrastructure Security', 'Remediation Verification'],
      issueDate: null, expiryDate: null, issuer: null, documentId: 'DEMO-VAPT-CAT6-001', documentTitle: 'VAPT Demo Security Assessment Summary', verificationUrl: null, isDemo: true, lastUpdated: '2026-09-28' },
    { id: 'iso27017', name: 'ISO/IEC 27017', type: 'CERTIFICATION', subtitle: 'Cloud Security Controls', icon: 'cloud',
      status: 'PLANNED', badges: ['PLANNED', 'DEMO'], statusLabel: 'PLANNED / DEMO',
      description: 'CAT.6 規劃將 ISO/IEC 27017 Cloud Security Controls 納入平台雲端安全治理架構，強化 Cloud Service Customer / Provider 相關安全責任與控制。',
      scope: 'Cloud Security Controls for the CAT.6 Cybersecurity Platform', points: ['雲端共享責任', 'Cloud Service Customer 控制', 'Cloud Service Provider 控制', '虛擬環境隔離', '雲端資產移除與回收'],
      issueDate: null, expiryDate: null, issuer: null, documentId: 'DEMO-ISO27017-CAT6-001', documentTitle: 'ISO/IEC 27017 Demo Certificate', verificationUrl: null, isDemo: true, lastUpdated: '2026-09-28' },
    { id: 'soc2', name: 'SOC 2 Type II', type: 'ATTESTATION_REPORT', subtitle: 'Security & Assurance', icon: 'report',
      status: 'ROADMAP', badges: ['ROADMAP', 'DEMO'], statusLabel: 'ROADMAP / DEMO',
      description: 'CAT.6 Production Roadmap 規劃導入適用的控制與稽核準備，並以持續性控制證據與營運有效性作為 Assurance 架構的一部分。SOC 2 Type II 為獨立會計師的檢查報告（Examination Report），不是證書。',
      scope: 'Trust Services Criteria: Security, Availability, Confidentiality', points: ['Security', 'Availability', 'Confidentiality', '控制設計與營運有效性', '持續性控制證據'],
      issueDate: null, expiryDate: null, issuer: null, documentId: 'DEMO-SOC2-CAT6-001', documentTitle: 'SOC 2 Type II Demo Assurance Report Cover', verificationUrl: null, isDemo: true, lastUpdated: '2026-09-28' }
  ];
  var DEMO_BADGES = ['DEMO', 'PLANNED', 'ROADMAP'];
  /* A claim such as CERTIFIED / VERIFIED / PASSED needs real, independently verifiable evidence. */
  function canClaim(it) { return !!(it && it.isDemo === false && it.issuer && it.issueDate && it.expiryDate !== undefined && it.verificationUrl && /^https:\/\//.test(it.verificationUrl)); }
  function badges(it) { return canClaim(it) ? (it.badges || []) : (it.badges || []).filter(function (b) { return DEMO_BADGES.indexOf(b) >= 0; }); }
  var DISCLAIMER = 'Demonstration document — not an official certification.';
  C.data.compliance = { items: items, canClaim: canClaim, badges: badges, DEMO_BADGES: DEMO_BADGES, DISCLAIMER: DISCLAIMER,
    DOC_BANNER: 'SAMPLE · DEMO ONLY · NOT A REAL CERTIFICATION', DOC_BANNER_ZH: '模擬文件 · 僅供 CAT.6 專題展示 · 非正式認證／稽核文件' };
})(globalThis.CAT6);
