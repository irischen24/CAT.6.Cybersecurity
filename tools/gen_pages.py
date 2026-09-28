# Generates the static app/*.html shells (GitHub Pages friendly, relative paths only).
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CORE=['js/core/namespace.js','js/config.js','js/core/format.js','js/core/provenance.js','js/core/dom.js','js/core/repository.js',
 'data/risk-criteria.js','data/frameworks.js','data/references.js','data/nist-likelihood.js',
 'data/catalog/iso27001.js','data/catalog/csf2.js','data/catalog/cis-controls.js','data/catalog/nist-impact-risk.js','data/catalog/framework-library.js','data/catalog/framework-mapping.js',
 'data/defaults/meta.js','data/defaults/workspace-defaults.js','data/defaults/risk-defaults.js','data/defaults/nist-defaults.js','data/defaults/cis-ram-defaults.js',
 'data/defaults/cis-controls-defaults.js','data/defaults/nist-csf-defaults.js','data/defaults/iso-readiness-defaults.js','data/defaults/fair-defaults.js','data/defaults/parameters.js',
 'js/calculations/rng.js','js/calculations/distributions.js','js/calculations/stats.js','js/calculations/riskMatrixEngine.js','js/calculations/nistRiskEngine.js','js/calculations/cisRamEngine.js',
 'js/calculations/cisControlsEngine.js','js/calculations/csfEngine.js','js/calculations/treatmentEngine.js','js/calculations/isoReadinessEngine.js','js/calculations/fairMonteCarloEngine.js',
 'js/services/workspace.js','js/services/xlsx.js','js/services/exportService.js',
 'js/charts/svg.js','js/charts/hbars.js','js/ui/icons.js','js/ui/shell.js','js/ui/table.js','js/ui/form.js','js/ui/page.js']
PAGES=[
 # file, title, ctx, extra css, extra js, page js
 ('dashboard','Dashboard','組織目前的資安風險態勢',['dashboard'],['js/charts/barChart.js','js/charts/lineChart.js','js/charts/riskMatrix.js','js/charts/gauge.js'],'dashboard'),
 ('risk-assessment','Risk Assessment','Assessment Setup · Workflow 01',[],[],'risk-assessment'),
 ('risk-register','Risk Register','風險登錄表',[],[],'risk-register'),
 ('nist-800-30','NIST SP 800-30','Threat · Vulnerability · Likelihood · Impact · Risk',[],[],'nist-800-30'),
 ('cis-ram','CIS RAM','Inherent / Residual Risk · Acceptability',[],[],'cis-ram'),
 ('cis-controls','CIS Controls v8.1','IG1 · IG2 · IG3 Coverage & Gap',[],[],'cis-controls'),
 ('nist-csf','NIST CSF 2.0','Current / Target Profile · Gap',[],[],'nist-csf'),
 ('frameworks','Framework Library','六個方法論框架',[],[],'frameworks'),
 ('framework-mapping','Framework Mapping','整合框架模型',[],[],'framework-mapping'),
 ('fair-analysis','FAIR Analysis','',['fair'],['js/services/fairAnalysisService.js','js/services/csvImportService.js','js/charts/fairCharts.js'],'fair-analysis'),
 ('iso-readiness','ISO 27001 Readiness','Certification Readiness · 非驗證機構',[],['js/charts/gauge.js'],'iso-readiness'),
 ('iso-gap','ISO 27001 Gap & SoA','Clause 4–10 · Annex A',[],[],'iso-gap'),
 ('iso-audit','ISO 27001 Audit & Review','Internal Audit · Findings · CAPA · Management Review',[],[],'iso-audit'),
 ('evidence','Evidence Management','證據管理',[],[],'evidence'),
 ('risk-treatment','Risk Treatment','處理計畫 · 殘餘風險',[],[],'risk-treatment'),
 ('data-import','Data Import','CSV / XLSX Import Center',[],['js/services/csvImportService.js','js/services/importCenter.js'],'data-import'),
 ('reports','Reports','Report Center · PDF / CSV / XLSX',['report'],['js/charts/reportCharts.js','js/services/reportBuilder.js','js/services/reportRenderer.js'],'reports'),
]
TPL='''<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · CAT.6 Cybersecurity</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="../assets/css/tokens.css">
<link rel="stylesheet" href="../assets/css/foundation.css">
<link rel="stylesheet" href="../assets/css/app-shell.css">
<link rel="stylesheet" href="../assets/css/dashboard.css">
<link rel="stylesheet" href="../assets/css/components.css">
{css}</head>
<body>
<div class="c6-root c6-app">
  <a class="c6-skip" href="#main">跳至主要內容</a>
  <div class="c6-bg" aria-hidden="true"><div class="c6-bg__blob c6-bg__blob--a"></div><div class="c6-bg__grid"></div><div class="c6-bg__noise"></div></div>
  <aside class="c6-side" id="c6-side" data-open="false" aria-label="側邊導覽"></aside>
  <div class="c6-scrim" data-open="false"></div>
  <div class="c6-main">
    <header class="c6-topbar">
      <button class="c6-iconbtn c6-topbar__menu" type="button" aria-controls="c6-side" aria-expanded="false" aria-label="開啟選單"></button>
      <h1 class="c6-topbar__title">{title}</h1>
      <span class="c6-topbar__ctx" id="c6-ctx">{ctx}</span>
      <div class="c6-topbar__tools">
        <label class="c6-search"><span class="c6-sr-only">搜尋風險情境</span><span class="c6-search__icon" data-icon="search"></span><input class="c6-input" type="search" placeholder="搜尋情境、資產、控制…"></label>
      </div>
    </header>
    <main id="main" class="c6-workspace" tabindex="-1">
      <div id="c6-subnav"></div>
      <section id="c6-notice" class="c6-notice" hidden></section>
      <div id="page" class="c6-page" aria-busy="true"><p class="c6-muted">載入中…</p></div>
    </main>
  </div>
</div>
{extra}
{scripts}
</body>
</html>
'''
def build():
  for f,title,ctx,css,js,page in PAGES:
    if f=='fair-analysis': continue  # hand-maintained markup, script list patched separately
    extra='<div id="c6-print-root" class="c6-print-root" aria-hidden="true"></div>' if f=='reports' else ''
    scripts='\n'.join('<script src="../%s"></script>'%s for s in CORE+js+['js/pages/%s.js'%page])
    cssl=''.join('<link rel="stylesheet" href="../assets/css/%s.css">\n'%c for c in css if c!='dashboard')
    open(os.path.join(ROOT,'app',f+'.html'),'w',encoding='utf-8').write(TPL.format(title=title,ctx=ctx,css=cssl,extra=extra,scripts=scripts))
  return CORE
if __name__=='__main__':
  build(); print('ok')
subprocess_ok = __import__("subprocess").run(["python3", os.path.join(ROOT, "tools", "cachebust.py")])
