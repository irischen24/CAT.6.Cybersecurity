# 設計理由（逐元素）

## 0. 整體原則

| 決策 | 理由 |
|---|---|
| **Dashboard 版型沿用 web_樣式-2，但顏色改用 CAT.6 紫** | 附件的綠色是它自己的品牌色；規格已指定 CAT.6 token（#7C5CFC / #5E6AD2 / #A855F7）。所以借用的是「結構」：左側欄、頂部搜尋列、第一張 KPI 高亮 + 右上角圓形箭頭、斜紋長條圖、面積趨勢線、活動紀錄、半圓儀表。 |
| **唯一的「大膽點」是六角形** | CAT.6 = 六套框架 → 六角形。它出現在 Logo、Hero 核心、框架星座的排列方式，其他地方保持安靜。只讓一個元素被記住。 |
| **背景強度分級**（`--c6-bg-strength`） | 規格要求 Home/Services 最強、Dashboard/表單/報告最弱。同一套四層背景，用一個變數調整：Home = 1，App = 0.35。避免兩套背景程式碼。 |
| **全部 scoped class、無 `*`、不動 body** | 所有規則都掛在 `.c6-*` 下，token 定義在 `.c6-root` 而不是 `:root`，方便嵌入到既有網站而不污染宿主樣式。因為不能重設 body 的預設 8px margin，深色底改由 `position: fixed` 的 `.c6-bg` 鋪滿整個視窗，視覺上不會露白。 |
| **Mobile-first 斷點** | 基礎樣式 = 手機單欄；`768px` 兩欄；`1200px` 三欄（`.c6-grid`）。320px 以 Playwright 實測無水平捲軸。 |
| **風險等級不只靠顏色** | 規格要求「顏色 + 文字 + 位置 + 形狀」。Low ● 圓、Medium ■ 方、High ▲ 三角、Critical ◆ 菱形；chip 內一定有文字；矩陣位置本身也是資訊。色盲使用者只看形狀即可判讀。 |
| **資料來源徽章（provenance）四種樣式** | USER_INPUT ✎ 藍、FILE_IMPORT ⇪ 青、CAT6_DEFAULT ◇ 金色**虛線框**、CALCULATED ∑ 淡紫。預設值用虛線，暗示「尚未確認」；圖示 + 文字讓它在黑白列印時仍可辨識。 |

## 1. Design tokens（`assets/css/tokens.css`）
- **色彩**：完全照規格。另外新增兩組規格未定義、但功能必需的色：
  - 風險等級色（青綠 / 琥珀 / 橘 / 珊瑚紅）：刻意降低飽和度，避免在深色底上刺眼，也避免與品牌紫競爭。
  - 來源色：四色分屬不同色相，彼此與風險色不重疊，防止「金色 = 預設」被誤讀成「Medium 風險」— 因此預設值再加上虛線做第二重區分。
- **字體**：規格指定 Inter / Geist Sans。加入 `Noto Sans TC / PingFang TC / Microsoft JhengHei` 作中文 fallback，否則中文會掉到瀏覽器預設字型、字重不一致。數字一律 `tabular-nums`，表格與 KPI 對齊不跳動。
- **陰影**：三層（內框亮線 + 近距離硬陰影 + 遠距離柔陰影），模擬「表面浮在環境光中」。hover 時多一層紫色光暈，只出現在可互動卡片上（避免規格反模式「每個元素都發光」）。
- **動態**：200 / 300 / 600 / 9000 ms 與 `cubic-bezier(0.16, 1, 0.3, 1)` 照規格；沒有任何彈跳。

## 2. Home（`index.html`）— 高度電影感
| 元素 | 設計理由 |
|---|---|
| 置頂導覽列（捲動後才出現毛玻璃底） | 首屏讓 Hero 完整呈現；開始捲動後需要可讀性，才加上背景與分隔線。 |
| 膠囊標籤「CAT.6 Cybersecurity」 | 規格 Hero 第一行文字；用膠囊 + Logo 取代大寫 eyebrow，避免模板感。 |
| 主標「Six Frameworks. / One Risk View.」 | 規格原文。漸層只用在行銷頁大標（規格：漸層字主要用於 Home / Services）。兩行斷句讓「六」與「一」形成對比 — 這正是產品價值。 |
| 副標中英並列 | 英文是產品定位（規格原文），中文一句話說明「做什麼」，讓 10–20 秒內理解。 |
| 三個 CTA 的層級 | Primary（紫實心）= Start Risk Assessment（主要服務）；Secondary（半透明）= ISO 27001 Readiness；Ghost = Explore Frameworks。視覺權重對應規格的 Primary / Secondary / Additional。 |
| CTA 下方小字「不核發認證」 | 規格明訂不得暗示發證；放在 CTA 旁，在使用者點下去之前就釐清。 |
| **框架星座** | 規格：「CAT.6 在中心，六框架環繞，細微動畫連線」。六節點排成正六角形；中心是六角形核心；連線是流動虛線（資料流向中心的隱喻），動得很慢。節點是 `<button>`，hover / focus / 點擊都會在下方說明框顯示該框架在 CAT.6 的角色 — 裝飾同時是資訊。 |
| 一次性進場編排 | 核心先出現，六個節點依序 90ms 錯開浮現。整頁只有這一個編排過的進場，其他區塊不做「每段淡入」（那是生成式網頁最常見的破綻）。 |
| 視差（`data-parallax`） | 背景網格 -0.04、星座 +0.06，只用 transform + rAF，捲動時產生層次深度；`prefers-reduced-motion` 時完全停用。 |
| 生命週期捲動敘事 | 規格：捲動時展示 GOVERN → … → IMPROVE。桌機左側 sticky 圓環顯示目前步驟與進度弧，右側步驟卡片依捲動點亮；這是真正的序列，所以使用 1–7 編號。手機不做 sticky，改為一般清單（小螢幕上 sticky 圖會擋內容）。每步只列相關框架，呼應「不要每次都套六套」。 |
| 雙服務卡 | 同一卡片元件（共用系統），用頂部色條區分：Service 01 紫、Service 02 靛藍。流程用膠囊串列（› 連接），最後一步高亮代表「產出」。Service 02 附中文正式名稱與不發證聲明。 |
| 六框架卡 | 由 `data/frameworks.js` 產生（不重複寫死）。每卡有層級徽章（Governance / Posture…）與官方來源連結，符合「不捏造、可追溯」。 |

## 3. App Shell（`assets/css/app-shell.css`, `js/ui/shell.js`）
| 元素 | 設計理由 |
|---|---|
| 側欄三態：手機抽屜 / 平板圖示軌道 76px / 桌機 248px | 規格：Mobile drawer、Tablet adaptive sidebar、Desktop full。平板保留圖示讓導覽仍一鍵可達，又不佔掉圖表寬度。 |
| 選單由單一設定陣列產生 | 規格要求可重用、避免重複。新增頁面只改 `NAV`。 |
| 目前頁面：紫色漸層底 + 左側 3px 光條 + `aria-current` | 規格：紫色用於 Active Navigation。光條給不靠顏色的位置線索；`aria-current` 給螢幕閱讀器。 |
| 未完成頁面顯示「規劃中」且不可點 | 不放假連結、不做空殼頁；誠實呈現進度。 |
| 抽屜可 Esc 關閉、開啟時焦點移入、關閉時回到按鈕 | 鍵盤可操作性。 |
| Top Context Bar：標題 + 情境說明 + 搜尋 + DEMO 徽章 | 規格的 Top Context Bar。DEMO 徽章常駐，讓使用者任何時候都知道看的是示範資料；320px 時縮成「DEMO」避免溢出。 |

## 4. Dashboard（`app/dashboard.html`）— 低動態、資料優先
| 元素 | 對應參考圖 | 設計理由 |
|---|---|---|
| 預設值提示框（金色虛線） | — | 規格要求原文「No organization-specific data was provided…」與三個按鈕 [Use CAT.6 Default Values] [Edit Values] [Import Organization Data]。放在最上方：在看任何數字之前先知道它是假設。 |
| KPI 列（6 張） | 參考圖 4 張 KPI | 第一張 Critical Risks 用高亮漸層（參考圖第一張為亮綠實心）— 最嚴重的指標最先被看到。右上角圓形箭頭沿用參考圖，實際連到頁內對應圖表。斷點：手機 1 欄 → 480px 2 欄 → 1200px 3 欄 → 1440px 6 欄一列。 |
| Control Coverage / Open Findings 顯示 `DATA REQUIRED` | — | 專案未提供 CIS Safeguard 實施狀態與稽核資料；規格反模式禁止假的覆蓋率 / 合規分數。空狀態同時告訴使用者需要什麼資料。 |
| 「ISMS 任務完成」而非「ISO Readiness %」 | 參考圖 Performance Status 儀表 | 沒有提供 readiness 計分方法，所以只算「路線圖任務完成數 / 總數」並在卡片明寫「不是認證準備度分數」。 |
| 斜紋長條圖：各情境 5×5 分數 | 參考圖 Rent Collection 斜紋長條，最高月份為實心漸層 | 斜紋保留參考圖的質感，同時是非顏色線索；最高分那一根用實心漸層（對應參考圖的高亮月份）。加上 17 / 10 / 5 虛線門檻，一眼看出落在哪一級。窄螢幕時標籤旋轉、門檻說明移到圖下。 |
| 風險趨勢面積圖 | 參考圖 Project Progress 波形 | 規格要求 Risk Trend。只在載入時畫一次線（低動態）。資料標示 CAT6_DEFAULT。 |
| 5×5 風險矩陣 | — | 每格顯示分數；情境以形狀標記；軸標「可能性 / 衝擊」。hover 與鍵盤 focus 顯示同一個 tooltip。 |
| Top Risk Scenarios | 參考圖 Activity Feed 的列表節奏 | 排序 + 等級 chip（形狀 + 文字 + 色）。 |
| Framework Coverage 橫條 | — | 由示範登錄表**計算**而來（CALCULATED），不是手填百分比。 |
| Data Source Status 堆疊條 | — | 規格新增需求。四種來源的筆數與比例；預設值段落用斜紋，與其他來源在灰階下也能區分。目前組織輸入 = 0，這個「0」本身就是最重要的訊息。 |
| 資料活動紀錄 | 參考圖 Activity Feed（人像 + 動作） | 參考圖是人名；CAT.6 沒有真實使用者，所以改為「系統事件 + 來源徽章」，不捏造人物。 |
| FAIR 快速卡 | — | 顯示最可能值點估計並說明「會低估尾端風險」，引導到 FAIR 頁執行模擬 — Dashboard 本身不跑重運算。 |

## 5. FAIR Analysis（`app/fair-analysis.html`）— 資料驅動動態
| 元素 | 設計理由 |
|---|---|
| 五個變數卡（Min / Most Likely / Max） | 規格輸入欄位。每卡有：標籤、英文代號、單位、必填、來源徽章、假設理由、驗證錯誤（⚠ 圖示 + 文字 + 紅框，不只變色）。機率以 % 輸入（人比較習慣「60%」），內部存 0–1。 |
| 使用者修改後徽章變 USER_INPUT | 可追溯：一眼看出哪些值還是預設。 |
| 模擬設定：分段按鈕 10k / 100k / 1M + Seed | 規格 presets 與可重現 seed。分段按鈕讓三個選項同時可見，比下拉選單少一次點擊。 |
| 公式區塊（等寬字） | 在按下執行前就把計算方式攤開：TEF、LEF、LM、Annual Risk = LEF × LM。 |
| 進度條 + 文字 + `aria-live` | 規格：不可凍結 UI、需顯示進度。以 50,000 筆為一批讓出主執行緒；1,000,000 次約 1–2 秒。 |
| 6 張結果 KPI | 規格：TEF、LEF、Mean Annual Risk、P50、P90、P95。每張附白話說明（例如 P90 = 「10 年約 1 次超過」），讓非技術主管看得懂 — 呼應筆記「高階主管溝通語言」。Mean 與 P90 用紫框強調，因為它們分別對應預算（ALE）與風險胃納。 |
| 直方圖 + 超越機率曲線 | 規格兩張必要圖。P50 / P90 / P95 以不同線型 + 文字標籤標示；直方圖截在 P99.5 並用文字說明溢出比例，避免長尾把主體壓扁卻不告知。 |
| 損失組成（實心 vs 斜紋） | 再次用紋理 + 文字，不只靠顏色。 |
| 計算追溯卡 | 逐步列出點估計，並說明與筆記 Step 2（NT$7.11M）的差異原因 — 規格「Maintain calculation traceability」。 |
| Percentile / Input Assumptions 表 | 規格三張表。表頭 sticky、橫向捲動在自己的容器內、數字右對齊。假設表完整列出每個預設值的來源、假設與理由（「Default values must always be inspectable」）。 |
| CSV 匯入 + 範本下載 + 錯誤表 | 規格 Mode 02。錯誤表欄位完全照規格：Row / Column / Value / Error / Expected Format / Suggested Correction；錯誤資料不會被靜默略過，未匯入的變數保留原值與原來源。 |
| 匯出 CSV 含來源欄與預設值聲明 | 報告必須保留 provenance，且含預設值時必須聲明。 |

## 6. 無障礙
- 所有互動元素最小 40–44px 觸控目標；`:focus-visible` 紫色外框 3px offset。
- 圖表 SVG 有 `role="img"` + `aria-label`，每張圖下方有文字摘要（accessible summary）。
- 圖表資料點可用 Tab 聚焦並顯示與 hover 相同的 tooltip。
- `prefers-reduced-motion`：停用背景漂移、流動虛線、進場、視差、卡片位移；所有功能照常運作。
- 跳至主要內容連結；`lang="zh-Hant-TW"`。

## Phase 05–08 補充
- **報告採「紙本」配色**：預覽與 PDF 使用同一份淺色 HTML，所見即所得；深色 UI 不直接列印（碳粉與可讀性）。
- **寬表改橫式頁面**：登錄表與處理計畫有 15+ 欄，直式會把文字擠成單字換行；以具名頁面只讓這兩章橫印。
- **來源標示印成文字**：`◇ CAT6_DEFAULT` 等以符號 + 代碼 + 虛線框呈現，灰階列印仍可辨識。
- **DATA REQUIRED 用虛線黃框**：與實際數值在視覺上明顯不同，避免被誤讀為結果。
- **匯入確認需勾選**：有錯誤列時必須明確確認「只匯入有效列」，避免使用者以為整個檔案都已匯入。
- **FAIR 可取消**：1,000,000 次在慢速裝置可能需要數秒，提供取消與引擎說明，讓使用者理解等待原因。
