/* Demo control-level implementation status per IG. Values: NOT_ASSESSED / NOT_IMPLEMENTED / PARTIAL / IMPLEMENTED / NOT_APPLICABLE. */
CAT6.data.defaults.cisControls = (function () {
  var P = ['IMPLEMENTED', 'PARTIAL', 'NOT_IMPLEMENTED', 'NOT_ASSESSED'];
  var demo = [[0, 1, 2], [1, 1, 2], [1, 2, 2], [1, 1, 3], [0, 1, 2], [1, 2, 2], [1, 1, 2], [1, 2, 2], [0, 1, 2],
    [0, 0, 1], [1, 2, 2], [1, 1, 2], [2, 2, 2], [1, 2, 3], [2, 2, 3], [2, 2, 3], [1, 2, 3], [2, 2, 3]];
  return demo.map(function (d, i) { var n = i + 1; return { id: 'CIS-' + (n < 10 ? '0' : '') + n, ig1: P[d[0]], ig2: P[d[1]], ig3: P[d[2]], notes: '' }; });
})();
