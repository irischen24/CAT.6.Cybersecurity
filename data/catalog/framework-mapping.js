/* CAT.6 integrated framework model — conceptual mapping exactly as given in the CAT.6 spec. */
CAT6.data.mapping = {
  domains: [
    { id: 'GOV', en: 'Governance', zh: '治理', fw: ['ISO27001', 'CSF2'] },
    { id: 'POS', en: 'Cybersecurity Posture', zh: '資安態勢', fw: ['CSF2'] },
    { id: 'RA', en: 'Risk Assessment', zh: '風險評鑑', fw: ['SP80030', 'CISRAM'] },
    { id: 'QNT', en: 'Quantification', zh: '量化', fw: ['FAIR'] },
    { id: 'CTL', en: 'Security Controls', zh: '安全控制', fw: ['CISV81'] },
    { id: 'TRT', en: 'Risk Treatment', zh: '風險處理', fw: ['ISO27001', 'CISRAM', 'CISV81'] },
    { id: 'IMP', en: 'Continual Improvement', zh: '持續改善', fw: ['ISO27001', 'CSF2'] }
  ],
  source: 'CAT.6 spec — Integrated Framework Model'
};
