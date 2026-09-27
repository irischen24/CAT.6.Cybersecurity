/* Demo Current / Target profile on the CSF 2.0 Readiness Index (0–3). */
CAT6.data.defaults.csf = [
  ['GV.OC', 2, 3], ['GV.RM', 1, 3], ['GV.RR', 2, 3], ['GV.PO', 2, 3], ['GV.OV', 1, 3], ['GV.SC', 0, 2],
  ['ID.AM', 2, 3], ['ID.RA', 1, 3], ['ID.IM', 1, 2],
  ['PR.AA', 2, 3], ['PR.AT', 1, 3], ['PR.DS', 2, 3], ['PR.PS', 2, 3], ['PR.IR', 1, 3],
  ['DE.CM', 1, 3], ['DE.AE', 1, 2],
  ['RS.MA', 1, 3], ['RS.AN', 1, 2], ['RS.CO', 1, 2], ['RS.MI', 1, 2],
  ['RC.RP', 1, 3], ['RC.CO', 0, 2]
].map(function (r) { return { id: r[0], current: r[1], target: r[2], action: r[1] < r[2] ? '示範改善行動：提升至目標層級' : '', owner: '', dueDate: '' }; });
