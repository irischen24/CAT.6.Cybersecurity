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

## 未提供而刻意留白的項目
- **Control Coverage、Open Findings**：需 CIS Safeguards 實施狀態與內部稽核資料 → Dashboard 顯示 `DATA REQUIRED`。
- **ISO Readiness 分數**：未提供計分方法 → 只顯示「ISMS 任務完成率」並標註「不是認證準備度分數」。
- **CIS Safeguard ID**：未在專案資料中提供 → 未產生任何 Safeguard 編號。
