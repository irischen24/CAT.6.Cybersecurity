# 是否需要後台？（BACKEND）

## 結論

| 情境 | 需要後台？ | 原因 |
|---|---|---|
| 目前原型（Phase 01–04） | **不需要** | 所有計算在瀏覽器執行，資料來自 `data/*.js`，匯入匯出皆為本機檔案 |
| 單人試用、不需保存 | 不需要 | 可加 localStorage 暫存草稿 |
| 正式上線（多人、多組織、需保存評估） | **需要，建議 Supabase** | 見下 |

## 為何正式版需要後台

1. **資料保存與版本**：評估、情境、每次 FAIR 執行結果都要可回溯（稽核要求）。
2. **多使用者與權限**：不同組織的資料必須隔離 → Postgres Row Level Security。
3. **證據檔案**：ISO 27001 準備需要上傳政策、紀錄、截圖 → Supabase Storage（私有 bucket + signed URL）。
4. **稽核軌跡**：誰在何時修改了哪個值、來源從 CAT6_DEFAULT 變成 USER_INPUT → `audit_log`。
5. **報告**：伺服器端產生 PDF 並保存。

## 為何選 Supabase

- Postgres：關聯資料（組織 → 評估 → 情境 → 輸入值 → 執行結果）天然適合。
- RLS：以 `organization_id` 在資料庫層做隔離，前端 bug 也不會洩漏別家資料。
- Auth + Storage 內建，前端可用官方 `supabase-js`（可直接用 CDN 的 UMD 版，不需要 React 或建置工具）。
- Edge Functions：可放 PDF 產生或排程工作。若需要與 numpy **逐位元一致**的蒙地卡羅結果，可另設 Python 服務（numpy PCG64）；否則瀏覽器引擎已在 1% 內吻合。

## 資料表（詳見 `supabase/schema.sql`）

`organizations`、`memberships`、`assessments`、`risk_scenarios`、`assessment_values`（含 provenance）、`fair_runs`、`import_jobs`、`import_errors`、`iso_tasks`、`evidence`、`findings`、`corrective_actions`、`reports`、`audit_log`。

## 安全注意

- 前端只放 `anon key`；`service_role key` 絕不可放進前端。
- 每張表都啟用 RLS；政策以 `memberships` 判斷使用者是否屬於該組織。
- Storage bucket 設為 private，路徑以 `{organization_id}/...` 開頭並套用政策。
