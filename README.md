# CAT.6 Cybersecurity — Phase 01–04 基礎版

純 vanilla HTML / CSS / JS（無 Tailwind、Bootstrap、React、無建置工具）。
直接雙擊 `index.html` 即可在瀏覽器執行（file:// 可用），也可放到任何靜態主機。

## 本版包含
| 頁面 | 檔案 | 狀態 |
|---|---|---|
| 01 Home | `index.html` | ✅ 完成（電影感 Hero、框架星座、生命週期捲動敘事、雙服務、六框架） |
| 03 Dashboard | `app/dashboard.html` | ✅ 完成（依附件 web_樣式-2 版型，CAT.6 紫色 token） |
| 07 FAIR Analysis | `app/fair-analysis.html` | ✅ 完成（可執行 10k / 100k / 1M 蒙地卡羅、CSV 匯入、CSV 匯出） |
| 其餘 8 頁 | — | 側欄標示「規劃中」，見 `docs/ARCHITECTURE.md` 路線圖 |

## 驗證
```
node tests/run-tests.js
```
24 項測試：5×5 分級邊界、NIST G-5 查表、FAIR 公式（Risk = LEF × LM）、CSV 錯誤回報、
以及 1,000,000 次模擬的 P50 與筆記 numpy 結果（NT$10,148,294）誤差 < 1%。

## 文件
- `docs/DESIGN-RATIONALE.md` — 每個元素的設計理由
- `docs/ARCHITECTURE.md` — 資料夾、資料模型、計算 / 匯入 / 報告架構、實作路線圖
- `docs/BACKEND.md` + `supabase/schema.sql` — 何時需要後台、Supabase 設計
- `docs/METHODOLOGY-NOTES.md` — FAIR 筆記中發現的不一致與處理方式
- `docs/REFERENCES.md` — 參考資料
