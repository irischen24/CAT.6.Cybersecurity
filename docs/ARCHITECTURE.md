# CAT.6 架構說明（ARCHITECTURE）

## 1. Sitemap（11 頁）

| # | 頁面 | 路徑 | 服務 | 本版狀態 |
|---|---|---|---|---|
| 01 | Home | `index.html` | — | ✅ 完成 |
| 02 | Assessment Setup（組織資料 / 範圍 / 預設值確認） | `app/setup.html` | 共用 | 規劃中 |
| 03 | Dashboard | `app/dashboard.html` | 共用 | ✅ 完成 |
| 04 | Risk Register（5×5 風險登錄表） | `app/risk-register.html` | 風險評估 | 規劃中 |
| 05 | NIST SP 800-30 Assessment（G-2～G-5 查表） | `app/nist-assessment.html` | 風險評估 | 規劃中（引擎已完成：`nistRiskEngine.js`） |
| 06 | CIS Controls / CIS RAM | `app/cis.html` | 風險評估 | 規劃中 |
| 07 | FAIR Analysis | `app/fair-analysis.html` | 風險評估 | ✅ 完成 |
| 08 | NIST CSF 2.0 Profile（Current / Target） | `app/csf.html` | 風險評估 | 規劃中 |
| 09 | ISO 27001 Readiness Roadmap | `app/iso-roadmap.html` | 認證準備 | 規劃中（資料已建：`iso-roadmap.js`） |
| 10 | Evidence & Findings（證據、缺失、矯正措施） | `app/evidence.html` | 認證準備 | 規劃中（需後台） |
| 11 | Reports（匯出 PDF / CSV / XLSX） | `app/reports.html` | 共用 | 規劃中 |

## 2. 資料夾結構

```
cat6/
├─ index.html                 首頁
├─ app/                       應用頁面（每頁一個 HTML）
├─ assets/css/                tokens → foundation → app-shell → 頁面專屬 CSS
├─ js/
│  ├─ core/                   namespace、格式化、provenance
│  ├─ calculations/           純函式引擎（不碰 DOM，可在 Node / Worker 執行）
│  ├─ services/               協調引擎與資料（run、import、export）
│  ├─ charts/                 SVG 圖表元件（只負責繪圖）
│  ├─ ui/                     icon、app shell
│  └─ pages/                  每頁的 DOM 綁定
├─ data/
│  ├─ defaults/               CAT6_DEFAULT 預設值（可版本化）
│  └─ demo/                   示範資料（UI 全部標示 DEMO）
├─ templates/                 CSV 匯入範本
├─ tests/                     Node 測試（無相依套件）
├─ docs/                      文件
└─ supabase/schema.sql        正式版資料庫草案
```

分層規則：`calculations/` 絕不讀寫 DOM；`pages/` 絕不自己做數學。這讓同一份引擎可以在瀏覽器、Web Worker、Node 測試或伺服器端重複使用。

## 3. 預設值資料格式

每一個預設值都以同一結構描述，UI 的 provenance 標籤與報告的假設表都從這裡產生：

```js
{
  field: "PL",                    // 欄位代碼
  label: "Primary Loss",
  value: { min: 1425000, ml: 1530000, max: 2600000 },
  unit: "TWD",
  distribution: "triangular",
  source: "CAT6_DEFAULT",         // USER_INPUT | FILE_IMPORT | CAT6_DEFAULT | CALCULATED
  assumption: "情境 B 資料外洩之主要損失",
  reason: "依 FAIR 筆記 Python 程式碼設定",
  version: "2026.09-B",
  lastUpdated: "2026-09-26"
}
```

值被使用者修改時 `source` 切換為 `USER_INPUT`；CSV 匯入則為 `FILE_IMPORT`；引擎輸出一律 `CALCULATED`。

## 4. 計算架構

```
輸入（含 provenance） → validate() → createRun()（分批 50k 次）→ stats.summarize / histogram / exceedance → 圖表 + 表格 + 匯出
```

- FAIR：`Risk = LEF × LM`，`LEF = CF × PoA × Susceptibility`，`LM = PL + SL`，每次迭代重新抽樣。
- 5×5：`score = L × I`，1–4 Low、5–9 Medium、10–16 High、17–25 Critical（平台自訂，非 ISO 公式）。
- NIST：G-2/G-3 × G-4 → G-5 查表。
- **Web Worker 遷移**：`fairMonteCarloEngine.js` 已是純函式，改成 Worker 只需在 worker 檔 `importScripts()` 引擎，主執行緒以 `postMessage` 收發進度與結果；目前以 `setTimeout` 分批避免畫面凍結。

## 5. 匯入架構

- CSV：`csvImportService.parseCSV` → `importFair` → 錯誤表（Row / Column / Value / Error / Expected / Suggestion），任何錯誤都不會部分套用。
- XLSX（下一階段）：以 SheetJS（`xlsx.full.min.js`，本地檔引入）讀成二維陣列後，走同一條驗證管線。
- 正式版：檔案存入 Supabase Storage，`import_jobs` / `import_errors` 記錄結果。

## 6. 報告架構

- 目前：CSV 結果匯出（含 provenance 與預設值聲明）。
- 下一階段：列印樣式表（`@media print`）→ 瀏覽器另存 PDF；正式版可由伺服器端產生 PDF 並存入 `reports`。
- 所有報告固定附上：資料來源、預設值聲明、方法論限制、「非認證結果」聲明。

## 7. 路線圖

| 階段 | 內容 |
|---|---|
| 01–04 ✅ | Design tokens、App shell、Home、Dashboard、FAIR 引擎與頁面、測試 |
| 05 | Setup、Risk Register（5×5）、NIST 800-30 頁面 |
| 06 | CIS Controls / CIS RAM、NIST CSF 2.0 Profile、XLSX 匯入 |
| 07 | ISO 27001 Roadmap、Evidence & Findings、Supabase 接入（Auth、RLS、Storage） |
| 08 | Reports（PDF）、稽核日誌、Worker 化、效能與無障礙稽核 |
