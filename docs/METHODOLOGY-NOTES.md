# 方法論註記：FAIR筆記-20260926-Iris.md 的不一致處

CAT.6 以使用者提供的筆記為最高優先來源，但筆記內部有四處互相矛盾。以下列出 CAT.6 的處理方式，
**請確認後再定版**，任何修改只需改 `data/defaults/fair-defaults.js`，UI 與引擎不需改。

| # | 位置 | 筆記內容 | CAT.6 採用 | 理由 |
|---|---|---|---|---|
| 1 | Step 3 文字 vs. Python 程式 | 文字：PL ~ Triangular(**1,125,000**, 1,530,000, 2,600,000)；程式：`left=1_425_000` | **1,425,000** | 用 numpy 重跑（seed 20260926, N=1,000,000）：1,425,000 → P50 = NT$10,148,294，與筆記「NT$10.15M」相符；1,125,000 → NT$9,969,132，不相符。 |
| 2 | Step 2 PL 點估計 | PL = NT$1,350,000 | 顯示但不使用 | 1,350,000 低於三角分布最小值 1,425,000，無法同時成立。FAIR 頁「計算追溯」卡片同時列出兩者。 |
| 3 | Step 3 公式 | `Risk_i = LEF_i + LM_i` | **Risk_i = LEF_i × LM_i** | 筆記其他段落、Python 程式與 CAT.6 規格皆為乘法；加法為筆誤。測試 `FAIR point: Annual Risk = LEF × LM` 防止回歸。 |
| 4 | 公式區 | `Risk = LFE × LM`、`Sueceptibility` | LEF、Susceptibility | 拼字修正，不影響計算。 |

## 亂數引擎差異
筆記用 numpy `default_rng`（PCG64）；瀏覽器端無 PCG64，CAT.6 使用 sfc32（splitmix32 播種）+ 反函數抽樣。
同一 seed 不會產生與 numpy 逐筆相同的樣本，但統計結果一致：

| 指標 | numpy（筆記引擎） | CAT.6 JS |
|---|---|---|
| Annual Risk P50 | 10,148,294 | 10,152,296（+0.04%） |
| LEF P50 | 1.7933 | 1.7941 |

若需與 Python 位元級一致（例如稽核要求），請在後端以 Python 執行（見 BACKEND.md 的 Edge Function 選項）。

## 分布選擇
筆記提到 Beta-PERT 常用於非對稱估計，但實際引擎與範例皆使用三角分布，且規格註明
「Current CAT.6 demonstration methodology supports: Triangular Distribution」。
因此僅實作三角分布；四點估計中的 Confidence 參數（決定 PERT 陡峭度）目前沒有輸入欄位，避免暗示未實作的方法。

## 各框架的實作決策（2026-09-27 依專案補充資料更新）

| 框架 | CAT.6 做法 | 依據 | 刻意不做 |
|---|---|---|---|
| CAT.6 5×5 | L × I；1–4 Low、5–9 Moderate、10–16 High、17–25 Critical（NIST 用語 Very High）；每級附建議處理原則與處理方式 | Risk_Criteria.pdf、確認_NIST_Table_I-2_與_H-3.pdf、CIS_RAM_可接受風險門檻.pdf | 不稱為 ISO / NIST 官方公式 |
| L / I 描述 | L1 Rare … L5 Almost Certain；I1 Insignificant … I5 Severe / Catastrophic；表單下拉直接顯示描述 | 5_5_各等級_L__I_的文字描述.pdf | — |
| NIST SP 800-30 | G-2 / G-3 / G-4 → **G-5 查表**得 Overall Likelihood；風險判定：Overall Likelihood 與 Impact 依 VL→1 … VH→5 換算後套用 5×5（Low / Moderate / High / Very High） | Risk_Criteria.pdf、確認_NIST_Table_I-2_與_H-3.pdf | G-5 不相乘；I-2 僅列為參考、不計分 |
| CIS RAM | Inherent / Residual 以 5×5；Residual ≤ 門檻 → Accept，否則 Treatment Required；門檻預設 9，可由組織覆寫 | CIS_RAM_可接受風險門檻.pdf | 不仿造 CIS RAM 官方 Duty of Care 計分 |
| CIS Controls v8.1 | 18 項控制（含中文名稱）、各 IG 狀態；覆蓋 = 已實施 ÷ 已評估 | CIS Controls v8.1；CIS_Controls_v8_1_Safeguard_清單.pdf（中文名稱） | 不自行產生 Safeguard 內容 |
| NIST CSF 2.0 | Readiness Index 0–3；Readiness % = Σ Current ÷ (3 × 已評分 Categories)，四捨五入後對應 Initial 0–20 / Developing 21–40 / Defined 41–60 / Managed 61–80 / Optimized 81–100；Gap = max(0, Target − Current)，Target 未填以 3 計；Tier 1–4 為治理描述 | 正式的_Readiness_評分方法.pdf | 不把 Tier 當分數；非 NIST 官方分數 |
| ISO/IEC 27001 | Readiness Indicator = 九領域完成比例等權平均 | CAT.6 平台方法（未提供 ISO 專用方法） | 不重製標準本文；不預測驗證結果 |
| FAIR | 三角分布蒙地卡羅（見上） | FAIR 筆記 | 不實作 PERT / Confidence |

## 對補充資料的解讀（請確認）
1. **「確認_NIST_Table_I-2_與_H-3.pdf」** 內容不是 I-2 / H-3 表，而是平台 5×5 風險判定方法。CAT.6 因此把 NIST 頁的風險判定改為：G-5 查表 → VL..VH 換算 1..5 → 5×5 計分；原轉錄的 I-2 保留為「NIST 參考」欄，不影響分數。若希望改回以 I-2 判定，只需在 `nistRiskEngine.assess` 改回傳欄位。
2. **等級名稱**：兩份補充文件在 17–25 分分別使用 Very High（NIST 文件）與 Critical（CIS RAM 文件）。CAT.6 在一般頁面與 CIS RAM 使用 Critical，NIST 頁與 NIST 報告使用 Very High；5–9 分統一改為 Moderate（原為 Medium）。
3. **「CIS_Controls_v8_1_Safeguard_清單.pdf」** 列的是 18 項 Controls 與中文名稱，不是 Safeguard（1.1、1.2…共 153 項與 IG 對應）。已加入中文名稱；Safeguard 層級覆蓋率仍需匯入 Safeguard 清單。
4. **「正式的_Readiness_評分方法.pdf」** 定義的是 CSF 2.0 Readiness Index，已套用到 CSF。文件未定義 ISO 27001 的評分，因此 ISO Readiness Indicator 維持原方法；若要把同一 0–3 與五級 Readiness Level 套用到 ISO 條款 / SoA，請告知。
5. **CSF Readiness % 公式**：文件列出 0–3 分與五個百分比區間，未寫出百分比公式；CAT.6 採 Σ Current ÷ (3 × 已評分 Categories)（未評分者不計入、不當 0）。

## 未提供而刻意留白的項目
- 情境本身的值（某風險的 L / I、資產、負責人）沒有通用預設值；新評估可選擇「以預設值補齊未輸入資料」帶入示範資料集（標示 CAT6_DEFAULT）。
- 報告的建議事項由資料規則產生（逾期、無處理計畫、缺口、差距 ≥ 2 等），不引用外部基準。
- ISO Readiness 領域沒有資料時不計入整體指標（不當作 0）。
