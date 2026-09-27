/* Data provenance model. Every assessment value is wrapped as { value, unit, source, note }.
 * source ∈ USER_INPUT | FILE_IMPORT | CAT6_DEFAULT | CALCULATED */
(function (C) {
  var SOURCES = {
    USER_INPUT:   { label: '組織輸入', en: 'USER_INPUT',   icon: '✎' },
    FILE_IMPORT:  { label: '檔案匯入', en: 'FILE_IMPORT',  icon: '⇪' },
    CAT6_DEFAULT: { label: 'CAT.6 預設', en: 'CAT6_DEFAULT', icon: '◇' },
    CALCULATED:   { label: '系統計算', en: 'CALCULATED',   icon: '∑' }
  };
  function wrap(value, source, unit, note) {
    if (!SOURCES[source]) throw new Error('Unknown provenance source: ' + source);
    return { value: value, source: source, unit: unit || '', note: note || '' };
  }
  /* Count values by source — feeds the Dashboard "Data Source Status" bar. */
  function tally(items) {
    var out = { USER_INPUT: 0, FILE_IMPORT: 0, CAT6_DEFAULT: 0, CALCULATED: 0 };
    items.forEach(function (it) { if (out[it.source] != null) out[it.source]++; });
    return out;
  }
  /* Accessible badge markup: icon + text, never color alone. */
  function badge(source) {
    var s = SOURCES[source];
    return '<span class="c6-prov c6-prov--' + source.toLowerCase() + '" title="資料來源：' + (source === 'CAT6_DEFAULT' ? 'CAT.6 DEFAULT / ASSUMED VALUE — 示範假設值，非組織實際狀況' : s.label) + '">' +
      '<span class="c6-prov__icon" aria-hidden="true">' + s.icon + '</span>' + (source === 'CAT6_DEFAULT' ? 'CAT.6 DEFAULT / ASSUMED' : s.en) + '</span>';
  }
  C.util.provenance = { SOURCES: SOURCES, wrap: wrap, tally: tally, badge: badge };
})(globalThis.CAT6);
