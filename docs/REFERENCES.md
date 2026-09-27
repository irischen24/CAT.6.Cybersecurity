# 參考資料

## 專案提供（最高優先）
1. `CAT_6_web_prompt.txt` — CAT.6 產品規格、設計 token、資訊架構
2. `FAIR筆記-20260926-Iris.md` — FAIR 公式、Scenario B 預設值、蒙地卡羅引擎
3. `Risk_Criteria.pdf` — CAT.6 5×5 分級、NIST SP 800-30 Table G-2 / G-3 / G-4 / G-5
4. `web_樣式-2.webp` — Dashboard 版型參考
5. `5_5_各等級_L__I_的文字描述.pdf` — Likelihood / Impact 五級文字描述
6. `確認_NIST_Table_I-2_與_H-3.pdf` — NIST SP 800-30 風險判定（平台 5×5 半定量矩陣）
7. `CIS_RAM_可接受風險門檻.pdf` — CIS RAM 可接受準則（門檻 9）
8. `CIS_Controls_v8_1_Safeguard_清單.pdf` — CIS Controls v8.1 十八項控制與中文名稱
9. `正式的_Readiness_評分方法.pdf` — CSF 2.0 Implementation Tiers、Readiness Index 與 Readiness Level
10. https://www.blackpanda.com/ — 氛圍與動態參考（未複製品牌、素材、文字或版面）

## 官方框架來源
- ISO/IEC 27001:2022 — https://www.iso.org/standard/27001
- NIST Cybersecurity Framework 2.0（NIST CSWP 29, 2024）— https://www.nist.gov/cyberframework
- NIST SP 800-30 Rev.1, Guide for Conducting Risk Assessments（2012）— https://csrc.nist.gov/pubs/sp/800/30/r1/final
- CIS RAM v2.2 for CIS Controls v8.1（CIS 於 2025-12-05 發布此文件家族：Core、IG1、IG2、IG3 與 Companion Workbook）— https://www.cisecurity.org/insights/white-papers/cis-ram-risk-assessment-method
- CIS Critical Security Controls v8.1 — https://www.cisecurity.org/controls/v8-1
- FAIR：The Open Group Risk Taxonomy (O-RT) / Risk Analysis (O-RA) Standards；FAIR Institute — https://www.fairinstitute.org/

## 設計與無障礙
- WCAG 2.2（對比、焦點可見、非僅以顏色傳達）— https://www.w3.org/TR/WCAG22/
- MDN `prefers-reduced-motion` — https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion
- Robert Bringhurst, *The Elements of Typographic Style*（行長、字級比例）

## 實作參考
- 三角分布反函數抽樣：numpy.random.Generator.triangular 文件
- 百分位數：與 numpy.percentile 預設（linear interpolation）一致
- sfc32 / splitmix32：PractRand 測試通過的小型 PRNG（Chris Doty-Humphrey）
- Office Open XML（ECMA-376）SpreadsheetML 與 ZIP 格式 — CAT.6 以自製讀寫器處理 .xlsx，不依賴 SheetJS
- CSS Paged Media Module Level 3（@page、margin boxes、named pages）— https://www.w3.org/TR/css-page-3/
- MDN DecompressionStream（deflate-raw）— https://developer.mozilla.org/docs/Web/API/DecompressionStream
- MDN Web Workers API — https://developer.mozilla.org/docs/Web/API/Web_Workers_API
- Supabase Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security
