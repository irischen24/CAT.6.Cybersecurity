/* CAT.6 global namespace.
 * Classic scripts (not ES modules) so the prototype runs from file:// without a server.
 * Layers are kept separate: data → calc (pure) → services (orchestration) → charts/ui → pages. */
(function (g) {
  var C = g.CAT6 || {};
  C.data = C.data || {};
  C.calc = C.calc || {};
  C.services = C.services || {};
  C.charts = C.charts || {};
  C.ui = C.ui || {};
  C.util = C.util || {};
  g.CAT6 = C;
})(typeof window !== 'undefined' ? window : globalThis);
