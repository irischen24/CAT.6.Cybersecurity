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
| FAIR 三點估計 | 頂峰科技 RS-A～RS-D 四情境（RS-B 同 FAIR 筆記 Scenario B） | CAT6_FAIR_RS-A_to_RS-D_Filled.xlsx（Assumptions 工作表說明推估理由） | 是（FAIR 頁 / 匯入） |
| FAIR 模擬 | 1,000,000 次、seed 20260926 | FAIR 筆記 | 是 |
| 幣別 | TWD | FAIR 筆記金額皆為 NT$ | 是 |
| 預設資料集 | **頂峰科技情境案例**：風險 RS-A～RS-D、處理計畫、NIST SP 800-30、CIS RAM、CIS Controls（含 18 項 Safeguard）、CSF 2.0、ISO 條款／SoA／證據／稽核發現／矯正措施、FAIR 四情境 | 專案提供之 11 份頂峰科技填寫附件（2026-09-28）；題目未提供之期限、狀態、殘餘風險、FAIR 頻率 / 機率 / 金額為 CAT.6 模擬推估 | 是（編輯或匯入即改為組織資料） |

## 如何「未輸入取預設值」
- 參數類（門檻、目標 IG、CSF Target、幣別）：留白即自動採用預設值，填入後改用組織值。
- 資料集類：Risk Assessment → 「以預設值補齊未輸入資料」，或建立新評估時勾選「未輸入的資料集先帶入 CAT.6 預設值」。只補**完全沒有資料**的資料集，已有組織資料的資料集不會被覆蓋；帶入的紀錄一經編輯即改為 USER_INPUT。

## 預設資料版本與升級
- 版本 `2026.09.28-tingfeng`（`data/defaults/meta.js`）。
- 已開過舊版網站的瀏覽器：若預設評估 AS-DEMO **完全未被修改**（所有紀錄仍為 CAT6_DEFAULT），開啟時自動換成頂峰科技資料；若曾修改或匯入，**不會覆寫**，可在 Risk Assessment →「重新載入預設資料」手動套用。
- 未由附件提供而未建立的資料：歷史季度快照（趨勢圖）、管理審查紀錄、Roadmap 手動任務狀態。稽核紀錄 AUD-2026-01 為附件 Findings 所引用之稽核（日期採證據日期 2026-09-28，稽核員未提供）。
