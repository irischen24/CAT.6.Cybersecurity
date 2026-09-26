/* ISO 27001 Certification Roadmap (stages and tasks from the CAT.6 spec).
 * Task `done` flags are DEMO values. Progress = completed tasks / total tasks — an implementation-progress
 * indicator, NOT a certification-readiness score (no scoring methodology has been supplied). */
CAT6.data.isoRoadmap = {
  source: 'CAT6_DEFAULT',
  stages: [
    { id: 1, zh: '前期盤點與導入規劃', en: 'Preparation & Gap Analysis',
      tasks: [['確認認證範圍', 1], ['成立推動團隊', 1], ['高階管理者支持', 1], ['現況盤點', 1], ['差異分析', 0], ['制定導入計畫', 0]] },
    { id: 2, zh: '建立並運行 ISMS', en: 'ISMS Implementation',
      tasks: [['資訊安全風險評估', 1], ['風險處理', 0], ['控制措施', 0], ['政策與程序', 1], ['執行紀錄', 0], ['教育訓練', 0]] },
    { id: 3, zh: '內部稽核與管理審查', en: 'Internal Audit & Management Review',
      tasks: [['內部稽核', 0], ['不符合事項', 0], ['矯正措施', 0], ['管理審查', 0], ['風險追蹤', 0], ['持續改善', 0]] },
    { id: 4, zh: '第三方驗證準備', en: 'Certification Audit Preparation',
      tasks: [['驗證申請準備', 0], ['第一階段文件審查準備', 0], ['第二階段稽核準備', 0], ['不符合事項改善', 0], ['Certification Status Tracking', 0]] }
  ]
};
