/* Minimal QR Code encoder (ISO/IEC 18004) — byte mode, versions 1–40, error correction L/M/Q/H, automatic mask.
 * Port of the reference algorithm by Project Nayuki (MIT licence). Used only to encode the report verification URL.
 * Output: C.services.qr.encode(text, 'M') → { size, get(x, y) } · C.services.qr.svg(text, opts) → SVG string. */
(function (C) {
  var ECC = { L: [0, 1], M: [1, 0], Q: [2, 3], H: [3, 2] }; // [table index, format bits]
  var ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]];
  var NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]];

  function numRawDataModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) { var na = Math.floor(ver / 7) + 2; r -= (25 * na - 10) * na - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  function numDataCodewords(ver, e) { return Math.floor(numRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[e][ver] * NUM_ERROR_CORRECTION_BLOCKS[e][ver]; }
  function rsMul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function rsDivisor(degree) {
    var result = []; for (var i = 0; i < degree - 1; i++) result.push(0); result.push(1);
    var root = 1;
    for (var i2 = 0; i2 < degree; i2++) {
      for (var j = 0; j < result.length; j++) { result[j] = rsMul(result[j], root); if (j + 1 < result.length) result[j] ^= result[j + 1]; }
      root = rsMul(root, 0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ result.shift(); result.push(0);
      divisor.forEach(function (coef, i) { result[i] ^= rsMul(coef, factor); });
    });
    return result;
  }
  function utf8(s) { return Array.from(new TextEncoder().encode(s)); }

  function encode(text, level) {
    var e = ECC[level || 'M'][0], fmt = ECC[level || 'M'][1], data = utf8(text), ver, cap;
    for (ver = 1; ver <= 40; ver++) {
      cap = numDataCodewords(ver, e) * 8;
      var used = 4 + (ver < 10 ? 8 : 16) + data.length * 8;
      if (used <= cap) break;
    }
    if (ver > 40) throw new Error('QR: data too long');
    /* bit stream: byte mode */
    var bb = [], push = function (val, len) { for (var i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    push(4, 4); push(data.length, ver < 10 ? 8 : 16); data.forEach(function (b) { push(b, 8); });
    push(0, Math.min(4, cap - bb.length)); push(0, (8 - bb.length % 8) % 8);
    for (var pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);
    var dataCw = []; for (var i = 0; i < bb.length; i += 8) { var v = 0; for (var k = 0; k < 8; k++) v = (v << 1) | bb[i + k]; dataCw.push(v); }
    /* interleave with error correction */
    var numBlocks = NUM_ERROR_CORRECTION_BLOCKS[e][ver], blockEcc = ECC_CODEWORDS_PER_BLOCK[e][ver], rawCw = Math.floor(numRawDataModules(ver) / 8);
    var numShort = numBlocks - rawCw % numBlocks, shortLen = Math.floor(rawCw / numBlocks), blocks = [], div = rsDivisor(blockEcc);
    for (var b = 0, pos = 0; b < numBlocks; b++) {
      var dat = dataCw.slice(pos, pos + shortLen - blockEcc + (b < numShort ? 0 : 1)); pos += dat.length;
      var ecc = rsRemainder(dat, div); if (b < numShort) dat.push(0); blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (var c = 0; c < blocks[0].length; c++) blocks.forEach(function (blk, bi) { if (c !== shortLen - blockEcc || bi >= numShort) all.push(blk[c]); });

    var size = ver * 4 + 17, mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, y2, dark) { mod[y2][x] = dark; fn[y2][x] = true; }
    function finder(x, y2) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y2 + dy; if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4); } }
    function align(x, y2) { for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(x + dx, y2 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
    for (var t = 0; t < size; t++) { set(6, t, t % 2 === 0); set(t, 6, t % 2 === 0); }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = []; if (ver > 1) { var na = Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2; ap = [6]; for (var p = size - 7; ap.length < na; p -= step) ap.splice(1, 0, p); }
    ap.forEach(function (ax, ai) { ap.forEach(function (ay, aj) { if (!((ai === 0 && aj === 0) || (ai === 0 && aj === ap.length - 1) || (ai === ap.length - 1 && aj === 0))) align(ax, ay); }); });
    function drawFormat(mask) {
      var d = fmt << 3 | mask, rem = d; for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = (d << 10 | rem) ^ 0x5412, g = function (i) { return ((bits >>> i) & 1) !== 0; };
      for (var i1 = 0; i1 <= 5; i1++) set(8, i1, g(i1));
      set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8));
      for (var i2 = 9; i2 < 15; i2++) set(14 - i2, 8, g(i2));
      for (var i3 = 0; i3 < 8; i3++) set(size - 1 - i3, 8, g(i3));
      for (var i4 = 8; i4 < 15; i4++) set(8, size - 15 + i4, g(i4));
      set(8, size - 8, true);
    }
    function drawVersion() {
      if (ver < 7) return;
      var rem = ver; for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var bits = ver << 12 | rem;
      for (var j = 0; j < 18; j++) { var bit = ((bits >>> j) & 1) !== 0, a = size - 11 + j % 3, bq = Math.floor(j / 3); set(a, bq, bit); set(bq, a, bit); }
    }
    drawFormat(0); drawVersion();
    /* place data (zig-zag) */
    var bitIdx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j2 = 0; j2 < 2; j2++) {
        var x2 = right - j2, up = ((right + 1) & 2) === 0, y3 = up ? size - 1 - vert : vert;
        if (!fn[y3][x2] && bitIdx < all.length * 8) { mod[y3][x2] = ((all[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0; bitIdx++; }
      }
    }
    function applyMask(m) {
      for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) {
        if (fn[yy][xx]) continue;
        var inv = [(xx + yy) % 2 === 0, yy % 2 === 0, xx % 3 === 0, (xx + yy) % 3 === 0, (Math.floor(xx / 3) + Math.floor(yy / 2)) % 2 === 0,
          xx * yy % 2 + xx * yy % 3 === 0, (xx * yy % 2 + xx * yy % 3) % 2 === 0, ((xx + yy) % 2 + xx * yy % 3) % 2 === 0][m];
        if (inv) mod[yy][xx] = !mod[yy][xx];
      }
    }
    function penalty() {
      var res = 0, dark = 0;
      function runs(get) {
        for (var a = 0; a < size; a++) {
          var color = false, run = 0, hist = [0, 0, 0, 0, 0, 0, 0];
          var addHist = function (r) { if (hist[0] === 0) r += size; hist.pop(); hist.unshift(r); };
          var count = function () { var n = hist[1], core = n > 0 && hist[2] === n && hist[3] === n * 3 && hist[4] === n && hist[5] === n; return (core && hist[0] >= n * 4 && hist[6] >= n ? 1 : 0) + (core && hist[6] >= n * 4 && hist[0] >= n ? 1 : 0); };
          for (var bq = 0; bq < size; bq++) {
            if (get(a, bq) === color) { run++; if (run === 5) res += 3; else if (run > 5) res++; }
            else { addHist(run); if (!color) res += count() * 40; color = get(a, bq); run = 1; }
          }
          /* terminate */
          if (color) { addHist(run); run = 0; }
          run += size; addHist(run); res += count() * 40;
        }
      }
      runs(function (a, bq) { return mod[a][bq]; });
      runs(function (a, bq) { return mod[bq][a]; });
      for (var yy = 0; yy < size - 1; yy++) for (var xx = 0; xx < size - 1; xx++) { var cc = mod[yy][xx]; if (cc === mod[yy][xx + 1] && cc === mod[yy + 1][xx] && cc === mod[yy + 1][xx + 1]) res += 3; }
      mod.forEach(function (row) { row.forEach(function (v) { if (v) dark++; }); });
      var total = size * size, k2 = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      return res + k2 * 10;
    }
    var best = 0, min = Infinity;
    for (var m = 0; m < 8; m++) { applyMask(m); drawFormat(m); var pen = penalty(); if (pen < min) { min = pen; best = m; } applyMask(m); }
    applyMask(best); drawFormat(best);
    return { size: size, version: ver, get: function (x, yq) { return x >= 0 && x < size && yq >= 0 && yq < size && mod[yq][x]; } };
  }
  function svg(text, opts) {
    opts = opts || {};
    var q = encode(text, opts.level || 'M'), border = 4, n = q.size + border * 2, path = [];
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.get(x, y)) path.push('M' + (x + border) + ',' + (y + border) + 'h1v1h-1z');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" class="' + (opts.cls || 'c6r-qr') + '" role="img" aria-label="' + C.util.dom.esc(opts.label || 'QR code') + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="#fff"/><path d="' + path.join('') + '" fill="#111"/></svg>';
  }
  C.services.qr = { encode: encode, svg: svg };
})(globalThis.CAT6);
