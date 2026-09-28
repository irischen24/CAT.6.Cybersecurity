/* Shared metadata for every CAT.6 default / demo dataset. Every record seeded from data/defaults/*
 * carries source = CAT6_DEFAULT and is shown in the UI as "CAT.6 DEFAULT / ASSUMED VALUE". */
CAT6.data.defaults = CAT6.data.defaults || {};
CAT6.data.defaults._meta = {
  source: 'CAT6_DEFAULT', version: '2026.09.27', lastUpdated: '2026-09-27',
  assumption: 'Demonstration scenario only',
  reason: '未提供組織資料時的示範值；不是組織實際狀況、不是框架官方數值、不是稽核證據或驗證結果。',
  notice: 'No organization-specific data was provided. CAT.6 default assumptions are being used.'
};
