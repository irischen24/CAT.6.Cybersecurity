/* NIST SP 800-30 Rev.1 Appendix G tables, transcribed from Risk_Criteria.pdf (supplied).
 * Semi-quantitative ranges and representative values as given there. */
(function (C) {
  var ORDER = ['VH', 'H', 'M', 'L', 'VL'];
  var NAMES = { VH: 'Very High', H: 'High', M: 'Moderate', L: 'Low', VL: 'Very Low' };
  function lv(id, range, rep, criterion) { return { id: id, name: NAMES[id], range: range, representative: rep, criterion: criterion }; }
  C.data.nist = {
    ORDER: ORDER, NAMES: NAMES,
    G2: { title: 'Table G-2 · Likelihood of Threat Event Initiation (Adversarial)', levels: [
      lv('VH', [96, 100], 10, '攻擊者幾乎確定會發起事件'),
      lv('H',  [80, 95],  8,  '攻擊者高度可能發起事件'),
      lv('M',  [21, 79],  5,  '攻擊者有一定可能發起事件'),
      lv('L',  [5, 20],   2,  '攻擊者不太可能發起事件'),
      lv('VL', [0, 4],    0,  '攻擊者極不可能發起事件')
    ]},
    G3: { title: 'Table G-3 · Likelihood of Threat Event Occurrence (Non-Adversarial)', levels: [
      lv('VH', [96, 100], 10, '幾乎確定發生；或 >100 次/年'),
      lv('H',  [80, 95],  8,  '高度可能發生；或 10–100 次/年'),
      lv('M',  [21, 79],  5,  '有一定可能發生；或 1–10 次/年'),
      lv('L',  [5, 20],   2,  '不太可能；<1 次/年，但 >1 次/10年'),
      lv('VL', [0, 4],    0,  '極不可能；<1 次/10年')
    ]},
    G4: { title: 'Table G-4 · Likelihood of Threat Event Resulting in Adverse Impact', levels: [
      lv('VH', [96, 100], 10, '幾乎確定造成不利影響'),
      lv('H',  [80, 95],  8,  '高度可能造成不利影響'),
      lv('M',  [21, 79],  5,  '有一定可能造成不利影響'),
      lv('L',  [5, 20],   2,  '不太可能造成不利影響'),
      lv('VL', [0, 4],    0,  '極不可能造成不利影響')
    ]},
    /* Rows: likelihood of initiation/occurrence. Cols: likelihood of adverse impact. Lookup only. */
    G5: {
      title: 'Table G-5 · Overall Likelihood',
      rows: ORDER,
      cols: ['VL', 'L', 'M', 'H', 'VH'],
      matrix: [
        ['L',  'M',  'H',  'VH', 'VH'],  // VH
        ['L',  'M',  'M',  'H',  'VH'],  // H
        ['L',  'L',  'M',  'M',  'H' ],  // M
        ['VL', 'L',  'L',  'M',  'M' ],  // L
        ['VL', 'VL', 'L',  'L',  'L' ]   // VL
      ]
    }
  };
})(CAT6);
