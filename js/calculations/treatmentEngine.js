/* Risk treatment status helpers. `today` is injectable for tests. */
(function (C) {
  var DONE = { Completed: 1, Cancelled: 1 };
  function iso(d) { return d.toISOString().slice(0, 10); }
  function classify(t, today) {
    var now = today || iso(new Date());
    if (t.status === 'Completed') return 'COMPLETED';
    if (t.status === 'Cancelled') return 'CANCELLED';
    if (t.dueDate && t.dueDate < now) return 'OVERDUE';
    return 'OPEN';
  }
  function summary(list, today) {
    var s = { OPEN: 0, OVERDUE: 0, COMPLETED: 0, CANCELLED: 0 };
    list.forEach(function (t) { s[classify(t, today)]++; });
    return s;
  }
  C.calc.treatment = { classify: classify, summary: summary, isDone: function (t) { return !!DONE[t.status]; } };
})(globalThis.CAT6);
