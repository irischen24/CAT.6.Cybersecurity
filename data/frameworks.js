/* Six CAT.6 frameworks and their roles (from the CAT.6 project spec). Complementary, not competing. */
CAT6.data.frameworks = [
  { id: 'ISO27001', name: 'ISO/IEC 27001', short: 'ISO 27001', layer: 'Governance',
    role: 'ISMS 建立、治理、風險處理、控制管理、持續改善、認證準備', ref: 'iso27001' },
  { id: 'CSF2',  name: 'NIST CSF 2.0', short: 'CSF 2.0', layer: 'Posture',
    role: 'Current / Target Profile、差距分析、改善規劃（Govern · Identify · Protect · Detect · Respond · Recover）', ref: 'csf2' },
  { id: 'SP80030', name: 'NIST SP 800-30 Rev.1', short: 'SP 800-30', layer: 'Assessment',
    role: 'Threat Source / Event、Vulnerability、Likelihood、Impact、風險判定', ref: 'sp80030' },
  { id: 'CISRAM', name: 'CIS RAM v2.2', short: 'CIS RAM', layer: 'Assessment',
    role: 'Risk Scenario、Inherent / Residual Risk、風險可接受性、Safeguard 對應', ref: 'cisram' },
  { id: 'CISV81', name: 'CIS Controls v8.1', short: 'CIS v8.1', layer: 'Controls',
    role: 'Safeguards、現有控制評估、IG1 / IG2 / IG3 對應、控制差距', ref: 'cisv81' },
  { id: 'FAIR', name: 'FAIR', short: 'FAIR', layer: 'Quantification',
    role: '財務化量化風險、蒙地卡羅模擬、風險分布、決策支援', ref: 'fair' }
];
CAT6.data.lifecycle = [
  { id: 'GOVERN',   zh: '治理', fw: ['ISO27001', 'CSF2'], text: '界定 ISMS 範圍、角色與風險準則。' },
  { id: 'IDENTIFY', zh: '識別', fw: ['CSF2', 'SP80030', 'CISRAM'], text: '盤點資產、威脅來源、威脅事件與弱點。' },
  { id: 'ASSESS',   zh: '評估', fw: ['SP80030', 'CISRAM'], text: '判定可能性與衝擊，得出風險等級。' },
  { id: 'QUANTIFY', zh: '量化', fw: ['FAIR'], text: '以損失頻率 × 損失幅度估算年度財務風險。' },
  { id: 'TREAT',    zh: '處理', fw: ['ISO27001', 'CISRAM', 'CISV81'], text: '選擇處理方式並對應 Safeguards。' },
  { id: 'MONITOR',  zh: '監控', fw: ['CSF2', 'CISV81'], text: '追蹤控制實施與殘餘風險。' },
  { id: 'IMPROVE',  zh: '改善', fw: ['ISO27001', 'CSF2'], text: '稽核、矯正措施與管理審查，回到治理。' }
];
