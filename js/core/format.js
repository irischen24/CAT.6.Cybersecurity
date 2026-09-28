/* Number / currency formatting. Currency is a parameter so more currencies can be added later. */
(function (C) {
  var CURRENCIES = {
    TWD: { symbol: 'NT$', locale: 'zh-TW', decimals: 0 },
    USD: { symbol: 'US$', locale: 'en-US', decimals: 0 },
    EUR: { symbol: '€', locale: 'de-DE', decimals: 0 },
    JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0 }
  };
  function currency(value, code, opts) {
    var cur = CURRENCIES[code || 'TWD'] || { symbol: String(code) + ' ', locale: 'en-US', decimals: 0 };
    if (value == null || isNaN(value)) return '—';
    if (opts && opts.compact) {
      var abs = Math.abs(value);
      if (abs >= 1e6) return cur.symbol + (value / 1e6).toFixed(2) + 'M';
      if (abs >= 1e3) return cur.symbol + (value / 1e3).toFixed(0) + 'K';
    }
    return cur.symbol + Math.round(value).toLocaleString(cur.locale);
  }
  function num(value, digits) {
    if (value == null || isNaN(value)) return '—';
    return Number(value).toLocaleString('zh-TW', { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
  }
  function pct(value, digits) {
    if (value == null || isNaN(value)) return '—';
    return (value * 100).toFixed(digits == null ? 0 : digits) + '%';
  }
  C.util.format = { currency: currency, num: num, pct: pct, CURRENCIES: CURRENCIES };
})(globalThis.CAT6);
