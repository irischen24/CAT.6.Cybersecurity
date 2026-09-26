/* Seedable PRNG (sfc32 seeded via splitmix32). Pure, no DOM.
 * NOTE: numpy.default_rng uses PCG64, so draws are NOT bit-identical to the Python notebook;
 * with ≥100k iterations the percentiles agree within Monte Carlo error (see tests/). */
(function (C) {
  function splitmix32(a) {
    return function () {
      a |= 0; a = (a + 0x9e3779b9) | 0;
      var t = a ^ (a >>> 16); t = Math.imul(t, 0x21f0aaad);
      t = t ^ (t >>> 15); t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ (t >>> 15)) >>> 0);
    };
  }
  function create(seed) {
    var sm = splitmix32(Number(seed) >>> 0);
    var a = sm(), b = sm(), c = sm(), d = sm();
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }
  C.calc.rng = { create: create };
})(globalThis.CAT6);
