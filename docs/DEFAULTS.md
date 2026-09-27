# 預設值與採用依據（DEFAULTS）

**原則**：組織於平台輸入（USER_INPUT）或匯入（FILE_IMPORT）的資料一律優先；未輸入時，以下列 CAT.6 預設值進行計算，畫面、匯出與報告都標示 `CAT6_DEFAULT`（CAT.6 DEFAULT / ASSUMED VALUE），報告另附「預設值與採用依據」表。
程式來源：`data/defaults/parameters.js`（`resolve(key, assessment)` 回傳採用值、來源與依據）。

| 項目 | 預設值 | 採用依據 | 可由組織覆寫 |
|---|---|---|---|
| 5×5 風險計分與等級 | L × I；1–4 Low、5–9 Moderate、10–16 High、17–25 Critical / Very High | Risk_Criteria.pdf；「NIST SP 800-30 的風險判定」（平台依 NIST 概念建立之半定量矩陣，非官方分數） | 否（平台準則） |
| L / I 五級文字描述 | L1 Rare … L5 Almost Certain；I1 Insignificant … I5 Severe / Catastrophic | 5_5_各等級_L__I_的文字描述.pdf | 否 |
| NIST SP 800-30 風險判定 | G-5 查表 → VL..VH 換算 1..5 → 5×5 | Risk_Criteria.pdf（Appendix G）；確認_NIST_Table_I-2_與_H-3.pdf | 否 |
| CIS RAM Risk Acceptance Threshold | **9**：Risk ≤ 9 Accept；Risk ≥ 10 Treatment Required | CIS_RAM_可接受風險門檻.pdf；9 為 Moderate 上限，High 以上一律需處理 | 是（Setup / CIS RAM 頁） |
| CIS 目標 IG | **IG1** | CIS Controls v8.1 定義 IG1 為所有企業應達成的基本資安衛生 | 是（Setup） |
| CSF 2.0 Readiness Index | 0–3；Readiness Level 五級 | 正式的_Readiness_評分方法.pdf | 否 |
| CSF Target（未輸入時） | **3（Fully Implemented）** | Readiness Index 的完整實施點；差距即「距離完整實施」 | 是（逐項設定 Target） |
| ISO Readiness Indicator | 九領域完成比例等權平均 | 未提供 ISO 專用方法，採最透明的方式；非 ISO 官方評分 | 否 |
| FAIR 三點估計 | Scenario B（CF、PoA、Susceptibility、PL、SL） | FAIR筆記-20260926-Iris.md 與其 Python 程式 | 是（FAIR 頁 / 匯入） |
| FAIR 模擬 | 1,000,000 次、seed 20260926 | FAIR 筆記 | 是 |
| 幣別 | TWD | FAIR 筆記金額皆為 NT$ | 是 |
| 示範資料集 | CAT.6 示範組織（風險、處理、CIS、CSF、ISO、證據等） | 展示完整流程；以 FAIR 筆記 Scenario B 為核心；不代表任何組織 | 是（編輯或匯入即改為組織資料） |

## 如何「未輸入取預設值」
- 參數類（門檻、目標 IG、CSF Target、幣別）：留白即自動採用預設值，填入後改用組織值。
- 資料集類：Risk Assessment → 「以預設值補齊未輸入資料」，或建立新評估時勾選「未輸入的資料集先帶入 CAT.6 預設值」。只補**完全沒有資料**的資料集，已有組織資料的資料集不會被覆蓋；帶入的紀錄一經編輯即改為 USER_INPUT。
