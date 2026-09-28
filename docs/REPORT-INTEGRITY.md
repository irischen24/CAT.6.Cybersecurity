# Formal Report Integrity（正式報告：身分、完整性、驗證）

## 狀態總表
| 功能 | 狀態 |
|---|---|
| Document Identity Block（Logo、平台、組織、評估、報告類型、產生者、時間、Report ID、版本、分級） | IMPLEMENTED |
| Data Classification（TOP SECRET / CONFIDENTIAL / INTERNAL ONLY / PUBLIC，預設 CONFIDENTIAL；封面、頁首、頁尾、Metadata） | IMPLEMENTED |
| Report ID `REP-YYYYMMDD-XXXXX` + UUID v4；重新下載沿用同一紀錄；新版本同 Report ID、新 UUID、舊版 SUPERSEDED | IMPLEMENTED |
| Page X of Y（每頁頁尾，封面計入總頁數但不顯示頁尾） | IMPLEMENTED（Chromium 131+ 列印） |
| Disclaimer、Methodology Boundary、Data Validity、Copyright（年份動態） | IMPLEMENTED |
| SHA-256（canonical artifact）、Manifest 下載、可用 `sha256sum` 重算 | IMPLEMENTED |
| Verification URL + QR Code（只含 URL：Report ID + 版本） | IMPLEMENTED |
| Verification Page（NOT FOUND / INVALID / REVOKED / SUPERSEDED / NOT VERIFIED / VERIFIED） | IMPLEMENTED（邏輯）；LOCAL DEMO REGISTRY 僅同一瀏覽器 |
| Visual Seal | DEMO / VISUAL ONLY（明確標示不是數位簽章） |
| Report Registry（組織級、公開驗證） | REQUIRES BACKEND：Supabase `reportRegistry` + `cat6_verify_report`（SQL 已提供，未在此環境部署測試） |
| PDF Digital Signature（PAdES / X.509 / HSM・KMS） | REQUIRES BACKEND：`config.reportSecurity.signingEndpoint` 介面已預留 |
| RFC 3161 Trusted Timestamp | REQUIRES BACKEND：`config.reportSecurity.tsaEndpoint` 介面已預留；未連線顯示 DEMO / TSA NOT CONNECTED |
| PDF 位元組層級 Hash | REQUIRES BACKEND（瀏覽器列印引擎不提供 PDF bytes） |

## Report ID / UUID
- Report ID：`REP-` + 產生日（本地日期）+ `-` + 5 個 Crockford Base32 字元（`crypto.getRandomValues`，約 3,355 萬種 / 日），與 Registry 比對確保唯一。只供人閱讀與引用，不作為安全依據。
- UUID：`crypto.randomUUID()`（v4），作為系統唯一識別（紀錄主鍵）。
- 資料模型：`reportId, reportUuid, reportVersion, assessmentId, organizationId, generatedAt, classification, sha256, signature.status, timestamp.status, status`。
- 版本規則：定稿 = v1.0；「建立新版本」以目前資料重建，Report ID 不變、版本 +1（2.0、3.0…）、新 UUID，前一版標示 SUPERSEDED。重新列印 / 下載永遠使用凍結內容。

## Hash（SHA-256）
- 涵蓋範圍（canonical artifact）：`{ schema: "cat6.report.v1", meta, sections, frameworks, fairRunId, defaultsUsed }` —— 報告全部章節（文字、表格、圖表 SVG）與身分 Metadata。
- 正規化：物件鍵排序、無空白、UTF-8；`SHA-256(canonical)`，Web Crypto。
- 不涵蓋：Report Verification 頁、Hash 本身、簽章 / 時戳結果、Registry 狀態 → Hash 印在 PDF 上不會改變被 Hash 的內容，沒有「寫回後失效」問題。
- 可獨立驗證：Report Center →「Manifest」下載 `.cat6report.json`（即 canonical 字串），`sha256sum` 結果 = 報告上的 SHA-256。

## Finalization Pipeline（目前順序）
Assessment Data → Report Builder（內容、表格、圖表、預設值揭露、免責聲明）→ Identity Metadata（ID、UUID、版本、分級、產生者 / 時間）→ Canonical Artifact → SHA-256 → Signature（後端，可選）→ RFC 3161（後端，對 SHA-256）→ Registry 紀錄 → Verification URL → QR → PDF（驗證頁由紀錄產生，列印時加頁首頁尾與頁碼）。

簽章 / 時戳目前簽的是 canonical artifact 的 SHA-256（detached）。若改為 PAdES（簽 PDF 本身），順序需改為：後端以固定引擎產生 PDF → 預留簽章欄位（ByteRange）→ 計算 PDF 位元組 Hash → HSM 簽章 → 向 TSA 取得 signature timestamp（嵌入 CMS）→ 寫入 Registry。驗證頁的 QR 與資訊須在簽章前放入 PDF，因此 PDF Hash 不可印在 PDF 內（改由 Registry 保存）。

## Digital Signature Architecture（REQUIRES BACKEND）
Browser → `POST signingEndpoint {reportUuid, reportId, version, sha256}` → Serverless / Backend（驗證使用者與組織權限）→ HSM / KMS（私鑰不出 HSM）→ 回傳 `{signer, organization, certificateSerial, certificateIssuer, certificateStatus, signingTime, algorithm, signature}` → 寫入 Registry。憑證鏈與撤銷狀態（OCSP / CRL）由後端驗證。前端與 Repository 不含任何私鑰或簽章密鑰；未設定端點時狀態為 `NOT SIGNED — REQUIRES BACKEND`。

## RFC 3161 Timestamp Architecture（REQUIRES BACKEND）
Browser → `POST tsaEndpoint {sha256}` → Backend 建立 TimeStampReq（SHA-256 message imprint、nonce）→ TSA → TimeStampResp → Backend 驗證 TSA 憑證與 imprint → 回傳 `{tsa, genTime, serialNumber, policy, token, verified}`。未設定端點時狀態為 `DEMO / TSA NOT CONNECTED`，顯示的時間標示為「用戶端時鐘，非可信時間」。

## Verification QR / Registry Architecture
- QR 內容：`<site>/verify/?id=REP-…&v=1.0`（不含報告資料、個資或完整 Hash）。
- Verification Page 判定：查無 → NOT FOUND；Registry 紀錄重算 Hash 不符 → INVALID；已撤銷 → REVOKED；有較新版本 → SUPERSEDED；紀錄完整但尚未比對手上文件 → NOT VERIFIED；使用者輸入報告上的 SHA-256 或上傳 Manifest 且一致 → VERIFIED。
- LOCAL DEMO REGISTRY：紀錄在產生報告的瀏覽器 localStorage，頁面明確標示只能同瀏覽器驗證。
- PRODUCTION：Supabase `cat6_records`（collection `reportRegistry`）+ trigger（insert 時檢查 SHA-256 = 內容、內容不可修改、狀態不可回到 ACTIVE、不可刪除）+ anon RPC `cat6_verify_report`（只回傳 Metadata 與伺服器重算的 SHA-256，不回傳報告內容）。需填 `organizationId` 並在 Supabase 執行 `supabase/schema.sql`。

## Security
- 無私鑰、service_role key、簽章密鑰存在前端或 Repository（自動測試掃描 js / data / app / verify / index.html）。
- `config.js` 的 Supabase key 經測試確認為 `anon` role。
- 不產生假的 RFC 3161 token、不把 Visual Seal 稱為數位簽章、QR 不會無條件 VERIFIED。
