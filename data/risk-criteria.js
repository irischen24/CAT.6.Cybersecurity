/* Source: Risk_Criteria.pdf (supplied by the CAT.6 project).
 * The 5×5 method is a CAT.6 platform-defined criterion — do NOT present it as an ISO/IEC 27001 formula. */
CAT6.data.riskCriteria = {
  cat6: {
    label: 'CAT.6 Platform Risk Criteria',
    disclaimer: '此 5×5 方法為 CAT.6 平台自定義之 Risk Criteria，並非 ISO/IEC 27001 官方指定公式。',
    formula: 'Risk Score = Likelihood (1–5) × Impact (1–5)',
    bands: [
      { id: 'LOW',      label: 'Low',      zh: '低',   min: 1,  max: 4,  shape: 'circle'   },
      { id: 'MEDIUM',   label: 'Medium',   zh: '中',   min: 5,  max: 9,  shape: 'square'   },
      { id: 'HIGH',     label: 'High',     zh: '高',   min: 10, max: 16, shape: 'triangle' },
      { id: 'CRITICAL', label: 'Critical', zh: '極高', min: 17, max: 25, shape: 'diamond'  }
    ],
    version: '1.0', lastUpdated: '2026-09-26'
  }
};
