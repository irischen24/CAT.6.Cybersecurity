/* CAT.6 Platform Risk Criteria — 5×5 semi-quantitative matrix.
 * Sources (supplied by the project):
 *   · Risk_Criteria.pdf — Risk Score = L × I, bands 1–4 / 5–9 / 10–16 / 17–25
 *   · 5_5_各等級_L__I_的文字描述.pdf — L1–L5 and I1–I5 names and descriptors
 *   · 確認_NIST_Table_I-2_與_H-3.pdf — level names Low / Moderate / High / Very High and suggested handling
 *   · CIS_RAM_可接受風險門檻.pdf — handling Accept / Accept·Monitor / Treatment Required / Immediate Treatment
 * Platform-defined: NOT an ISO/IEC 27001 formula and NOT an official NIST score. */
CAT6.data.riskCriteria = {
  cat6: {
    label: 'CAT.6 Platform Risk Criteria',
    disclaimer: '此 5×5 半定量方法為 CAT.6 平台自定義之 Risk Criteria（依 NIST 風險評估概念建立），分數區間與 L × I 計算並非 ISO/IEC 27001 或 NIST 官方公式 / 分數。',
    formula: 'Risk Score = Likelihood (1–5) × Impact (1–5)',
    bands: [
      { id: 'LOW',      label: 'Low',      nist: 'Low',       zh: '低風險',   min: 1,  max: 4,  shape: 'circle',   action: '可接受或持續監控', handling: 'Accept' },
      { id: 'MEDIUM',   label: 'Moderate', nist: 'Moderate',  zh: '中風險',   min: 5,  max: 9,  shape: 'square',   action: '評估並規劃適當控制措施', handling: 'Accept / Monitor' },
      { id: 'HIGH',     label: 'High',     nist: 'High',      zh: '高風險',   min: 10, max: 16, shape: 'triangle', action: '優先制定風險處置與控制措施', handling: 'Treatment Required' },
      { id: 'CRITICAL', label: 'Critical', nist: 'Very High', zh: '極高風險', min: 17, max: 25, shape: 'diamond',  action: '優先處理並由管理階層關注', handling: 'Immediate Treatment' }
    ],
    likelihood: [
      { v: 1, en: 'Rare', zh: '極低', text: '在正常情況下幾乎不會發生；僅在特殊或極端條件下才可能發生，過去幾乎沒有相關事件紀錄。' },
      { v: 2, en: 'Unlikely', zh: '低', text: '發生可能性偏低，但在特定條件或控制措施失效時仍可能發生；過去很少出現類似事件。' },
      { v: 3, en: 'Possible', zh: '中', text: '具有合理的發生可能性；相關威脅與弱點確實存在，且過去曾出現類似事件。' },
      { v: 4, en: 'Likely', zh: '高', text: '很可能發生；威脅來源活躍、弱點明顯，或現有控制措施不足，類似事件已有多次發生紀錄。' },
      { v: 5, en: 'Almost Certain', zh: '極高', text: '預期很可能或反覆發生；威脅持續存在且弱點容易被利用，如果沒有額外控制措施，事件發生幾乎難以避免。' }
    ],
    impact: [
      { v: 1, en: 'Insignificant', zh: '極低', text: '對營運、資訊資產或服務幾乎沒有影響；資料與系統可立即恢復，不涉及重大財務、法律或聲譽損失。' },
      { v: 2, en: 'Minor', zh: '低', text: '造成局部或短暫影響；少量使用者、系統或資料受到影響，可透過一般作業程序快速處理。' },
      { v: 3, en: 'Moderate', zh: '中', text: '對重要系統或業務造成明顯影響；可能出現服務中斷、資料損失、額外處理成本或客戶影響，需要正式事件處理。' },
      { v: 4, en: 'Major', zh: '高', text: '對核心系統、重要資料或主要業務造成重大影響；可能涉及敏感資料外洩、長時間服務中斷、重大財務損失、法規或聲譽問題。' },
      { v: 5, en: 'Severe / Catastrophic', zh: '極高', text: '對企業造成災難性影響；可能造成核心業務長時間或全面停止、大規模敏感資料外洩、重大法律與財務責任，甚至威脅企業持續營運。' }
    ],
    version: '2.0', lastUpdated: '2026-09-27'
  }
};
