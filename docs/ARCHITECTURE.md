# CAT.6 架構說明（ARCHITECTURE）

## 1. Sitemap
| 側欄 | 頁面 | 路徑 |
|---|---|---|
| Dashboard | 總覽（KPI、矩陣、趨勢、框架覆蓋、FAIR、活動） | `app/dashboard.html` |
| Risk Assessment | Setup & Workflow 01、Workspace（Local / Supabase） | `app/risk-assessment.html` |
| └ NIST SP 800-30 | G-2 / G-3 / G-4 → G-5 查表 → I-2 查表 | `app/nist-800-30.html` |
| └ CIS RAM | Inherent / Residual、可接受性 | `app/cis-ram.html` |
| └ CIS Controls v8.1 | IG1 / IG2 / IG3 覆蓋與缺口、Safeguard（匯入後） | `app/cis-controls.html` |
| └ NIST CSF 2.0 | Current / Target / Gap（22 Category） | `app/nist-csf.html` |
| Risk Register | 風險登錄 CRUD | `app/risk-register.html` |
| Frameworks | 六框架知識庫 | `app/frameworks.html` |
| Framework Mapping | 領域 ↔ 框架、情境對應、覆蓋矩陣 | `app/framework-mapping.html` |
| FAIR Analysis | 三點估計、Web Worker 蒙地卡羅 | `app/fair-analysis.html` |
| ISO 27001 Readiness | Readiness Indicator、四階段 Roadmap、Workflow 02、全景範圍 | `app/iso-readiness.html` |
| └ Gap & SoA | 條款 4–10、Annex A 93 項 | `app/iso-gap.html` |
| └ Audit & Review | 內部稽核、Findings、CAPA、管理審查 | `app/iso-audit.html` |
| └ Evidence | 證據管理（檔案 metadata + SHA-256） | `app/evidence.html` |
| Risk Treatment | 處理計畫、框架對應、殘餘風險 | `app/risk-treatment.html` |
| Data Import | 10 步驟匯入精靈（CSV / XLSX） | `app/data-import.html` |
| Reports | 9 種報告、PDF / CSV / XLSX | `app/reports.html` |

## 2. 資料夾與分層
```
index.html                首頁
app/*.html                頁面外殼（tools/gen_pages.py 產生；FAIR 頁手動維護）
assets/css/               tokens → foundation → app-shell → dashboard → components → 頁面 CSS（fair / report）
js/core/                  namespace、config、format、provenance、dom、repository（Local / Supabase）
js/calculations/          純函式引擎：riskMatrix、nist、cisRam、cisControls、csf、treatment、isoReadiness、fair、rng、stats
js/services/              workspace（唯一資料入口）、importCenter、csvImport、xlsx、exporter、fair（Worker 協調）、reportBuilder、reportRenderer
js/workers/fair.worker.js 與主執行緒共用同一份引擎（importScripts）
js/charts/                SVG 圖表（畫面）與 reportCharts（列印用靜態 SVG）
js/ui/                    shell（側欄 / 搜尋）、table、form（<dialog>）、page（boot 與共用元件）、icons
js/pages/                 每頁控制器：只做 DOM 綁定，不做數學
data/catalog/             框架目錄（ISO 條款 / Annex A 編號與短標題、CSF 22 Category、CIS 18 Controls、G/H/I 表）
data/defaults/            CAT6_DEFAULT 示範資料（版本 + 理由）
templates/                匯入範本（tools/gen-templates.js 產生）
tests/                    run-tests.js（Node）、e2e.py（Playwright）
supabase/schema.sql       Supabase 資料庫
```
規則：`calculations/` 不碰 DOM；`pages/` 不做數學；所有資料經 `services/workspace`。

## 3. 資料模型
每筆紀錄 = `{ id, assessmentId, source, updatedAt, ...欄位 }`，依 collection 存放：
`assessments`（全域）、`risks`、`treatments`、`nist`、`cisram`、`cisControls`、`cisSafeguards`、`csf`、`isoContext`、`isoClauses`、`isoSoa`、`isoTasks`、`audits`、`findings`、`capas`、`reviews`、`evidence`、`fairInputs`、`fairRuns`、`snapshots`、`activity`、`importLog`。
`source` ∈ `USER_INPUT | FILE_IMPORT | CAT6_DEFAULT | CALCULATED`：編輯預設值紀錄 → `USER_INPUT`；匯入 → `FILE_IMPORT`；分數、等級、覆蓋率、差距、模擬結果 → `CALCULATED`（不儲存衍生值，每次由引擎重算，除 FAIR 模擬摘要與季度快照）。

Repository 介面：`list / upsert / upsertMany / remove / replaceAll / clearAll`。LocalRepository（localStorage，封鎖時退回記憶體）與 SupabaseRepository（PostgREST `cat6_records`）實作相同介面，頁面不需知道後端。

## 4. 計算
- CAT.6 5×5：`L × I`，1–4 Low、5–9 Moderate、10–16 High、17–25 Critical（NIST 頁稱 Very High），L / I 各級有文字描述。
- SP 800-30：Initiation（G-2 ADV / G-3 NON-ADV）× Adverse Impact（G-4）→ **G-5 查表**；Overall × Impact 依 VL..VH → 1..5 以 5×5 計分；I-2 僅參考。缺值 → DATA_REQUIRED。
- CIS RAM：Inherent / Residual 以 5×5；Residual ≤ 門檻 → Accept，否則 Treatment Required；門檻 = 組織值或預設 9。
- 預設值：`data/defaults/parameters.js` 集中管理預設值與採用依據（見 `docs/DEFAULTS.md`）。
- CIS Controls：各 IG 覆蓋 = 已實施 ÷ 已評估；目標 IG 缺口列表。
- CSF：Readiness Index 0–3，Readiness % = Σ Current ÷ (3 × 已評分)，五級 Readiness Level；Gap = max(0, Target − Current)，Target 未填以 3 計。
- ISO Readiness：九個領域完成比例，整體 = 有資料領域的等權平均。
- FAIR：TEF = CF × PoA；LEF = TEF × Susc.；LM = PL + SL；Risk = LEF × LM；三角分布、sfc32 seed。10k / 100k / 1M 在 Web Worker 執行，50k 一批回報進度，可取消；file:// 或 Worker 失敗 → 主執行緒分段（同一引擎、同 seed 結果相同，測試已驗證）。

## 5. 匯入管線（Import Center）
選服務 → 選評估與資料集 → 上傳（拖放）→ 解析（CSV / XLSX，自製 ZIP + XML 讀取器，使用瀏覽器 DecompressionStream）→ 選工作表 → 欄位對應（自動 + 手動）→ 驗證 → 預覽 → 錯誤檢視（Row / Column / Current Value / Error / Expected Format / Suggested Correction，可下載錯誤 CSV）→ 確認（有錯誤時需勾選確認只匯入有效列）→ 匯入並記錄 importLog。以 `#` 開頭的列與空白列略過，保留原始列號。

## 6. 報告管線
`reportBuilder.build(type, data)` 產生結構化模型（章節 + 區塊：段落、提示、鍵值、清單、表格、SVG 圖），`reportRenderer.render()` 轉為 HTML，同一份模型也輸出 CSV / XLSX（`toTables`）。
PDF：`reportRenderer.print()` 把 HTML 掛到 `#c6-print-root`，加入依報告產生的 `@page` 規則，呼叫 `window.print()`：A4 直式、寬表章節（登錄表、處理計畫）A4 橫式具名頁面；頁首（CAT.6 / 報告名）、頁尾（組織、預設值聲明、`Page X / Y`）；`thead` 跨頁重複；列與圖不跨頁切斷；儲存格內換行。
頁首頁尾使用 CSS Paged Media margin boxes（Chromium 131+ 支援）；其他瀏覽器仍可列印，但可能沒有頁首頁尾，建議用 Chrome / Edge 產生 PDF。

## 7. 無障礙
語意地標、skip link、`<dialog>` 表單（焦點管理、`aria-invalid` + 說明文字）、可鍵盤操作的 tabs、表格 caption / scope、狀態以形狀 + 文字表示（不只顏色）、`aria-live` 進度、`prefers-reduced-motion`。
