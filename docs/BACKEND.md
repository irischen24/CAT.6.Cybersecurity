# 後台與資料保存（BACKEND）

## 模式
| 模式 | 設定 | 資料位置 | 適用 |
|---|---|---|---|
| LOCAL（預設） | `js/config.js` → `backend: 'local'` | 該瀏覽器 localStorage（封鎖時為記憶體，重新整理即消失） | 單人試用、示範、離線 |
| SUPABASE | `backend: 'supabase'` + `url` / `anonKey` / `organizationId` | Supabase Postgres `cat6_records` | 多人、多組織、需保存與稽核軌跡 |

頂列徽章顯示 `DEMO / ORG · LOCAL / SUPABASE`；滑鼠停留可看原因（例如「Supabase 已設定但尚未登入，改用本機模式」）。

## Supabase 設定步驟
1. 建立專案 → SQL Editor 執行 `supabase/schema.sql`。
2. Authentication → Providers 啟用 Email；建立使用者。
3. 建立組織與成員（schema 檔末 Onboarding 範例）：角色 `owner` / `editor` 可寫、`viewer` 唯讀。
4. `js/config.js` 填 `url`（Project URL）、`anonKey`（Project API keys → anon public）、`organizationId`，並設 `backend: 'supabase'`。
5. 開 Risk Assessment → Workspace & Data → 以 Email / 密碼登入（token 只存 sessionStorage）。首次登入會為該組織載入示範資料，可在同一面板清除。

## 安全
- 前端只放 anon key；**service_role key 絕不可放入前端或 repository**。
- 所有表啟用 RLS：`is_member(organization_id)` 可讀、`can_edit()` 可寫。
- `audit_log` 由 security-definer trigger 寫入（誰、何時、哪筆、來源由什麼變成什麼），使用者無法修改或刪除。
- 證據檔案：目前 UI 只記錄檔名、大小、類型與 SHA-256（不上傳內容）。若要上傳，使用私有 bucket `evidence`，路徑 `<organization_id>/...`，schema 已含 storage policy。

## 尚未納入（需要時再加）
伺服器端 PDF 產生（目前由瀏覽器列印）、多評估間的權限細分、SSO。
