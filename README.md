# CAT.6 Cybersecurity

整合 ISO/IEC 27001、NIST CSF 2.0、NIST SP 800-30、CIS RAM、CIS Controls v8.1 與 FAIR 的資安風險評估與 ISO 27001 認證準備平台。
純 vanilla HTML / CSS / JavaScript（classic scripts，無框架、無建置工具、無外部 JS 套件），可直接部署到 GitHub Pages。

## 兩項核心服務
| 服務 | 起點 | 流程 |
|---|---|---|
| Cyber Risk Assessment（Workflow 01） | `app/risk-assessment.html` | Setup → 資料匯入 / 輸入 → 驗證 → 風險登錄 → SP 800-30 / CIS RAM / CIS Controls / CSF → 選用 FAIR → 處理 → 殘餘風險 → 報告 |
| ISO/IEC 27001 Certification Readiness（Workflow 02） | `app/iso-readiness.html` | 全景與範圍 → 差異分析 → 風險評鑑與處理 → SoA → 證據 → 內部稽核 → 矯正措施 → 管理審查 → Readiness Indicator → 報告 |

CAT.6 **不是**驗證機構，不核發證書；CAT.6 Readiness Indicator 為平台自定義完成比例，非 ISO 官方評分。

## 頁面（側欄 10 項，全部可用）
Dashboard · Risk Assessment（Setup、NIST SP 800-30、CIS RAM、CIS Controls v8.1、NIST CSF 2.0）· Risk Register · Frameworks · Framework Mapping · FAIR Analysis · ISO 27001 Readiness（Gap & SoA、Audit & Review、Evidence）· Risk Treatment · Data Import · Reports

## 快速開始
```bash
# 本機預覽（建議，Web Worker 需要 http）
python3 -m http.server 8000     # 然後開 http://localhost:8000/
# 也可直接雙擊 index.html（file://）：一切可用，FAIR 會自動改用主執行緒分段計算並顯示原因
```
組織輸入的資料優先；未輸入時以 CAT.6 預設值計算（見 `docs/DEFAULTS.md`）。首次開啟會載入 CAT.6 示範資料集，所有值標示 `CAT6_DEFAULT`（CAT.6 DEFAULT / ASSUMED VALUE）。
到 Risk Assessment → Workspace 可「重設示範資料」或「清除全部資料」後匯入組織資料。

## 部署到 GitHub Pages
1. 將本資料夾內容推到 repository 根目錄（`index.html` 在根目錄）。
2. GitHub → Settings → Pages → Build and deployment → Source：**Deploy from a branch**；Branch：`main` / `/ (root)` → Save。
3. 約 1 分鐘後開啟 `https://<帳號>.github.io/<repo>/`。
4. 全部路徑皆為相對路徑、無建置步驟；Web Worker 在 Pages（https）上直接可用。
5. 若 repository 是私人的，Pages 需要付費方案；否則改用任何靜態主機（Netlify、Cloudflare Pages、內部 Nginx）。

## Supabase（選用，多人 / 多組織保存）
預設 `backend: 'local'`：資料只存在該瀏覽器 localStorage。改用 Supabase：
1. 建立 Supabase 專案 → SQL Editor 執行 `supabase/schema.sql`（建立 `organizations`、`memberships`、`cat6_records`、`audit_log`、RLS 與私有 `evidence` bucket）。
2. Authentication → Users 建立使用者；依 schema 檔末「Onboarding」建立組織並加入 membership。
3. 編輯 `js/config.js`：`backend: 'supabase'`，填入 `url`、`anonKey`（**只能是 anon public key**）與 `organizationId`。
4. 開啟 Risk Assessment → Workspace & Data → 登入。未設定或未登入時會自動回到本機模式並說明原因。
詳見 `docs/BACKEND.md`。

## 測試
```bash
node tests/run-tests.js      # 157 項：引擎、匯入驗證、XLSX、Workspace、9 種報告、Worker 決定性
python3 tests/e2e.py         # 276 項（Playwright + Chromium）：17 頁 × 3 寬度、連結、CRUD、匯入、匯出、Worker、PDF
```
e2e 產物（截圖、範例 PDF、結果 JSON）寫到 `$E2E_OUT`（預設系統暫存資料夾的 `cat6-e2e/`）。

## 維護工具
- `python3 tools/gen_pages.py` — 重新產生 `app/*.html` 外殼（FAIR 頁為手動維護）
- `node tools/gen-templates.js` — 重新產生 `templates/` 匯入範本（XLSX + 每個資料集的 CSV）

## 文件
`docs/ARCHITECTURE.md`（架構、資料模型、匯入 / 報告管線）· `docs/METHODOLOGY-NOTES.md`（方法論決策、待確認事項）·
`docs/REPORT-INTEGRITY.md`（正式報告：分級、Report ID、SHA-256、驗證）· `docs/DEFAULTS.md`（預設值與採用依據）· `docs/BACKEND.md`（Supabase）· `docs/DESIGN-RATIONALE.md` · `docs/REFERENCES.md`
