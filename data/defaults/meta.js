/* Shared metadata for every CAT.6 default / demo dataset. Every record seeded from data/defaults/*
 * carries source = CAT6_DEFAULT and is shown in the UI as "CAT.6 DEFAULT / ASSUMED VALUE". */
CAT6.data.defaults = CAT6.data.defaults || {};
CAT6.data.defaults._meta = {
  source: 'CAT6_DEFAULT', version: '2026.09.28-tingfeng', lastUpdated: '2026-09-28', organization: '頂峰科技',
  assumption: '頂峰科技情境案例（附件填寫）',
  reason: '頂峰科技情境案例資料（依專案提供之 11 份填寫附件）；題目未提供之頻率、機率、金額、期限與狀態為 CAT.6 模擬推估。不是企業真實財務或稽核資料、不是框架官方數值、不是驗證結果。',
  notice: 'No organization-specific data was provided. CAT.6 default assumptions are being used.'
};
