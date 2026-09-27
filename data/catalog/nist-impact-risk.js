/* NIST SP 800-30 Rev.1 — Appendix H (Table H-3, impact scale) and Appendix I (Table I-2, level of risk).
 * IMPORTANT: these two tables are NOT in the supplied Risk_Criteria.pdf. They were transcribed from the
 * public NIST publication so that "Risk Determination" does not fall back to Likelihood × Impact.
 * Flagged for confirmation in docs/METHODOLOGY-NOTES.md. Lookup only — never multiplication. */
(function (C) {
  var N = C.data.nist;
  N.H3 = { title: 'Table H-3 · Impact of Threat Events', source: 'NIST SP 800-30 Rev.1 Appendix H（非 Risk_Criteria.pdf 提供，待確認）', levels: [
    { id: 'VH', name: 'Very High', range: [96, 100], representative: 10, criterion: '對組織營運、資產、個人等造成多重嚴重或災難性不利影響' },
    { id: 'H',  name: 'High',      range: [80, 95],  representative: 8,  criterion: '造成嚴重或災難性不利影響' },
    { id: 'M',  name: 'Moderate',  range: [21, 79],  representative: 5,  criterion: '造成嚴重（serious）不利影響' },
    { id: 'L',  name: 'Low',       range: [5, 20],   representative: 2,  criterion: '造成有限（limited）不利影響' },
    { id: 'VL', name: 'Very Low',  range: [0, 4],    representative: 0,  criterion: '造成可忽略之不利影響' }
  ]};
  /* Rows: overall likelihood (G-5 output). Cols: level of impact (VL..VH). */
  N.I2 = { title: 'Table I-2 · Level of Risk (Combination of Likelihood and Impact)',
    source: 'NIST SP 800-30 Rev.1 Appendix I（非 Risk_Criteria.pdf 提供，待確認）',
    rows: ['VH', 'H', 'M', 'L', 'VL'], cols: ['VL', 'L', 'M', 'H', 'VH'],
    matrix: [
      ['VL', 'L',  'M',  'H', 'VH'], // VH
      ['VL', 'L',  'M',  'H', 'VH'], // H
      ['VL', 'L',  'M',  'M', 'H' ], // M
      ['VL', 'L',  'L',  'L', 'M' ], // L
      ['VL', 'VL', 'VL', 'L', 'L' ]  // VL
    ]};
})(CAT6);
