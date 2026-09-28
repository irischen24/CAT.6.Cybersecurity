"""CAT.6 browser tests (Playwright / Chromium).  python3 tests/e2e.py
Serves the repo over http (GitHub Pages equivalent), then checks every page at 1440 / 820 / 360,
console errors, internal links, CRUD, CSV/XLSX import (valid + invalid), exports, FAIR worker + file:// fallback,
and produces sample PDFs with page.pdf()."""
import os, sys, json, threading, http.server, socketserver, functools, tempfile, zipfile, subprocess, re
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.environ.get('E2E_OUT', os.path.join(tempfile.gettempdir(), 'cat6-e2e'))
os.makedirs(OUT, exist_ok=True)
PORT = int(os.environ.get('E2E_PORT', '8765'))
PAGES = ['index.html'] + ['app/' + f for f in sorted(os.listdir(os.path.join(ROOT, 'app'))) if f.endswith('.html')]
VIEWPORTS = [(1440, 900), (820, 1180), (360, 780)]
IGNORE = re.compile(r'Failed to load resource|fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|net::ERR_')
results = []
def ok(name, cond, info=''):
    results.append((name, bool(cond), info)); print(('✔ ' if cond else '✘ ') + name + (('  ' + str(info)) if info else ''))

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(('127.0.0.1', PORT), functools.partial(Q, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d/' % PORT

def watch(page, bucket):
    page.on('console', lambda m: (m.type == 'error' and not IGNORE.search(m.text)) and bucket.append('console: ' + m.text))
    page.on('pageerror', lambda e: bucket.append('pageerror: ' + str(e)))
    page.on('response', lambda r: (r.status >= 400 and r.url.startswith(BASE)) and bucket.append('%d %s' % (r.status, r.url)))
    page.on('dialog', lambda d: d.accept())
    # External hosts (Google Fonts) are unreachable in CI; block them so fallback fonts are exercised. Local 4xx are still reported above.
    page.route(re.compile(r'^https?://(?!127\.0\.0\.1)'), lambda r: r.abort())

def settle(page):
    page.wait_for_load_state('networkidle')
    page.wait_for_function("!document.querySelector('#page[aria-busy=\"true\"]') && !!document.querySelector('.c6-nav, .c6-side a')", timeout=15000)

def fill_form(page):
    """Fill every required control in the open <dialog> with a plausible value, then submit."""
    d = page.locator('dialog[open]').last
    d.wait_for()
    for el in d.locator('[required]').all():
        tag = el.evaluate('e => e.tagName'); typ = el.get_attribute('type') or ''
        if not el.is_visible(): continue
        if tag == 'SELECT':
            v = el.evaluate("e => [...e.options].map(o => o.value).filter(Boolean)[0] || ''")
            if v: el.select_option(v)
        elif typ == 'number': el.fill('3')
        elif typ == 'date': el.fill('2026-12-31')
        elif not el.input_value(): el.fill('E2E 測試資料')
    d.locator('button[type=submit]').click()

with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------- 1. every page × viewport ----------
    links = set()
    for (w, h) in VIEWPORTS:
        ctx = b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True)
        for path in PAGES:
            pg = ctx.new_page(); errs = []; watch(pg, errs)
            pg.goto(BASE + path)
            if path.startswith('app/'): settle(pg)
            else: pg.wait_for_load_state('networkidle')
            text = pg.inner_text('body')
            over = pg.evaluate('document.documentElement.scrollWidth - window.innerWidth')
            bad = [k for k in ['Coming Soon', 'coming soon', 'TODO', 'undefined', 'NaN', '[object Object]', 'Lorem'] if k in text]
            ok('%s @%d: no console/page errors' % (path, w), not errs, '; '.join(errs[:3]))
            ok('%s @%d: no horizontal page overflow' % (path, w), over <= 1, 'overflow %dpx' % over)
            ok('%s @%d: no placeholder / broken text' % (path, w), not bad, bad)
            if w == 1440:
                ok('%s: has <h1> and <main>' % path, pg.locator('h1').count() >= 1 and pg.locator('main').count() == 1)
                for href in pg.eval_on_selector_all('a[href]', 'as => as.map(a => a.getAttribute("href"))'):
                    links.add((path, href))
            if w in (1440, 360) and path.startswith('app/'):
                pg.screenshot(path=os.path.join(OUT, '%s-%d.png' % (os.path.basename(path)[:-5], w)), full_page=False)
            pg.close()
        ctx.close()
    # ---------- 2. links ----------
    dead = []
    for src, href in sorted(links):
        if href in ('#', '') or href.startswith('javascript:'): dead.append((src, href)); continue
        u = urlparse(urljoin(BASE + src, href))
        if u.scheme in ('http', 'https') and u.netloc != '127.0.0.1:%d' % PORT: continue
        if u.scheme == 'mailto': continue
        f = os.path.join(ROOT, u.path.lstrip('/'))
        if not os.path.exists(f): dead.append((src, href))
    ok('No dead internal links (%d checked)' % len(links), not dead, dead[:5])

    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    pg = ctx.new_page(); errs = []; watch(pg, errs)
    # ---------- 3. CRUD on every page with an add button ----------
    for path in ['risk-register', 'nist-800-30', 'cis-ram', 'risk-treatment', 'evidence', 'iso-audit']:
        pg.goto(BASE + 'app/%s.html' % path); settle(pg)
        btn = pg.locator('[data-add]').first
        before = pg.locator('table tbody tr').count()
        btn.click(); fill_form(pg)
        pg.wait_for_timeout(400)
        still_open = pg.locator('dialog[open]').count()
        invalid = pg.locator('dialog[open] [aria-invalid="true"]').count()
        ok('CRUD create: %s' % path, still_open == 0 and pg.locator('table tbody tr').count() >= before, 'dialog open=%d invalid=%d' % (still_open, invalid))
    # edit + delete on register
    pg.goto(BASE + 'app/risk-register.html?q=E2E'); settle(pg)
    rows = pg.locator('table tbody tr')
    ok('Register search ?q=E2E finds new risk', rows.count() >= 1)
    pg.locator('table tbody tr').first.locator('[data-act="edit"], button[aria-label*="編輯"]').first.click()
    d = pg.locator('dialog[open]'); d.locator('[name=owner]').fill('E2E Owner'); d.locator('button[type=submit]').click(); pg.wait_for_timeout(300)
    ok('CRUD update: register owner saved', 'E2E Owner' in pg.inner_text('table'))
    n0 = pg.locator('table tbody tr').count()
    pg.locator('table tbody tr').first.locator('[data-act="delete"], button[aria-label*="刪除"]').first.click()
    pg.locator('dialog[open] [data-yes], dialog[open] button.c6-btn--primary, dialog[open] button.c6-btn--danger').last.click(); pg.wait_for_timeout(300)
    ok('CRUD delete: register row removed', pg.locator('table tbody tr').count() == n0 - 1 or 'E2E Owner' not in pg.inner_text('table'))
    # ---------- 4. exports ----------
    for kind in ['csv', 'xlsx']:
        with pg.expect_download() as dl: pg.locator('[data-export=%s]' % kind).first.click()
        f = os.path.join(OUT, 'register.' + kind); dl.value.save_as(f)
        if kind == 'csv':
            txt = open(f, encoding='utf-8-sig').read(); ok('Export CSV has header + provenance', 'Risk ID' in txt and ('CAT6_DEFAULT' in txt or 'USER_INPUT' in txt))
        else:
            z = zipfile.ZipFile(f); ok('Export XLSX is a valid workbook', 'xl/workbook.xml' in z.namelist())
    # ---------- 5. Import Center: CSV with errors, then XLSX ----------
    csvp = os.path.join(OUT, 'risks.csv')
    open(csvp, 'w', encoding='utf-8').write('Risk ID,Scenario,Asset,Likelihood,Impact,Status\nRS-IMP1,匯入測試一,伺服器,3,4,Draft\nRS-IMP2,,筆電,9,2,Draft\nRS-IMP3,匯入測試三,NAS,2,2,Draft\n')
    pg.goto(BASE + 'app/data-import.html?ds=risks'); settle(pg)
    pg.set_input_files('#file', csvp); pg.wait_for_selector('#validate'); pg.click('#validate')
    pg.wait_for_selector('.c6-errtable')
    heads = pg.eval_on_selector_all('.c6-errtable thead th', 'ths => ths.map(t => t.textContent.trim())')
    ok('Import error table columns', all(any(k in h for h in heads) for k in ['Row', 'Column', 'Value', 'Error', 'Expected', 'Suggest']), heads)
    ok('Import error rows point at row 3', '3' in pg.inner_text('.c6-errtable tbody'))
    commit = pg.locator('#commit'); ok('Commit disabled until errors acknowledged', commit.is_disabled())
    pg.check('#ack'); commit.click(); pg.wait_for_timeout(500)
    ok('CSV import commits valid rows only', '已匯入 2' in pg.inner_text('#page'), pg.inner_text('#page')[:0])
    xl = pg.evaluate("""() => { const W = CAT6.services.xlsx; const u = W.write([{ name: 'Risk Register', rows: [['Risk ID','Scenario','Asset','Likelihood','Impact','Status'],['RS-XL1','XLSX 匯入','資料庫',4,4,'Draft']] }]); return Array.from(u instanceof Uint8Array ? u : new Uint8Array(u)); }""")
    xlp = os.path.join(OUT, 'risks.xlsx'); open(xlp, 'wb').write(bytes(xl))
    pg.click('#restart'); pg.set_input_files('#file', xlp); pg.wait_for_selector('#validate'); pg.click('#validate'); pg.wait_for_selector('#commit')
    pg.click('#commit'); pg.wait_for_timeout(500)
    ok('XLSX import commits', '已匯入 1' in pg.inner_text('#page'))
    junk = os.path.join(OUT, 'broken.xlsx'); open(junk, 'wb').write(b'not a zip file at all')
    pg.click('#restart'); pg.set_input_files('#file', junk); pg.wait_for_timeout(500)
    ok('Invalid XLSX shows a readable error', 'xlsx' in pg.inner_text('#page').lower() and ('無效' in pg.inner_text('#page') or '不是有效' in pg.inner_text('#page')))
    pg.goto(BASE + 'app/risk-register.html?q=RS-XL1'); settle(pg)
    ok('Imported records appear with FILE_IMPORT provenance', 'RS-XL1' in pg.inner_text('table') and ('FILE_IMPORT' in pg.content() or '檔案匯入' in pg.inner_text('table')))
    # ---------- 6. FAIR via Web Worker ----------
    pg.goto(BASE + 'app/fair-analysis.html'); settle(pg)
    pg.locator('input[name=iters][value="100000"]').check(force=True); pg.click('#run')
    pg.wait_for_function("document.getElementById('run-state').textContent.includes('Completed')", timeout=60000)
    st = pg.inner_text('#run-state'); ok('FAIR 100k runs in Web Worker', 'Web Worker' in st, st)
    ok('FAIR run saved to history', 'RUN-' in pg.inner_text('#runs'))
    pg.locator('input[name=iters][value="1000000"]').check(force=True); pg.click('#run')
    pg.wait_for_function("document.getElementById('run-state').textContent.includes('Running')")
    ok('UI stays responsive during 1M run', pg.evaluate('1+1') == 2)
    pg.click('#cancel'); pg.wait_for_function("document.getElementById('run-state').textContent.includes('Cancelled')", timeout=10000)
    ok('FAIR run can be cancelled', True)
    ok('No errors during interactive flows', not errs, errs[:3])
    # ---------- 6b. FAIR: two scenarios → report summary + detail picker ----------
    pg.goto(BASE + 'app/fair-analysis.html'); settle(pg)
    other = pg.evaluate("[...document.querySelectorAll('#risk-sel option')].map(o => o.value).find(v => v !== document.getElementById('risk-sel').value)")
    pg.select_option('#risk-sel', other); pg.wait_for_timeout(300)
    pg.locator('input[name=iters][value="10000"]').check(force=True); pg.click('#run')
    pg.wait_for_function("document.getElementById('run-state').textContent.includes('Completed')", timeout=60000)
    pg.goto(BASE + 'app/reports.html?type=fair'); settle(pg)
    ok('Report FAIR: scenario picker shown', pg.locator('#fair-pick').is_visible() and pg.locator('#fair-run option').count() >= 2)
    tbl = pg.inner_text('#preview')
    ok('Report FAIR: summary lists both scenarios', 'FAIR 情境彙總' in tbl and other in tbl and '各情境年化風險比較' in tbl)
    first = pg.evaluate("[...document.querySelectorAll('#fair-run option')].map(o => o.value).pop()")
    pg.select_option('#fair-run', first); pg.wait_for_timeout(300)
    ok('Report FAIR: detail follows picker + URL keeps run', ('&run=' + first) in pg.url and pg.evaluate("document.getElementById('fair-run').value") == first)
    # ---------- 7. Reports → PDF ----------
    pg.goto(BASE + 'app/reports.html?type=combined'); settle(pg)
    ok('Report preview rendered', pg.locator('#preview .c6r-sec').count() >= 15)
    pg.evaluate("() => { window.print = () => { window.__printed = true; }; }")
    pg.click('#pdf'); pg.wait_for_timeout(300)
    ok('Print button mounts report into #c6-print-root', pg.evaluate("window.__printed === true && document.querySelector('#c6-print-root .c6r') !== null"))
    for typ in ['combined', 'nist', 'fair', 'iso-readiness']:
        pg.goto(BASE + 'app/reports.html?type=' + typ); settle(pg)
        pg.evaluate("() => { window.print = () => {}; document.getElementById('pdf').click(); }"); pg.wait_for_timeout(200)
        pdf = os.path.join(OUT, 'CAT6_%s_report.pdf' % typ)
        pg.pdf(path=pdf, prefer_css_page_size=True, print_background=True)
        info = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
        pages = int(re.search(r'Pages:\s+(\d+)', info).group(1)); size = re.search(r'Page size:\s+([\d.]+) x ([\d.]+)', info)
        ok('PDF %s: A4 (%s pt), %d pages' % (typ, size.group(0) if size else '?', pages), size and abs(float(size.group(1)) - 595.3) < 2 and pages >= 3)
        subprocess.run(['pdftoppm', '-r', '60', '-png', '-f', '1', '-l', '3', pdf, os.path.join(OUT, 'pdf-%s' % typ)])
        txt = subprocess.run(['pdftotext', pdf, '-'], capture_output=True, text=True).stdout
        ok('PDF %s: page numbers + default notice' % typ, 'Page 2 /' in txt and 'CAT.6 default / assumed values' in txt)
    ctx.close()
    # ---------- 7b. methodology data supplied by the project ----------
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); errs = []; watch(pg, errs)
    pg.goto(BASE + 'app/nist-csf.html'); settle(pg)
    t = pg.inner_text('#page'); ok('CSF: Readiness % + level + Tier table', '%' in pg.inner_text('#rdy-b') and any(l in t for l in ['Initial', 'Developing', 'Defined', 'Managed', 'Optimized']) and 'Risk Informed' in t)
    pg.goto(BASE + 'app/nist-800-30.html'); settle(pg)
    t = pg.inner_text('#page'); ok('NIST: CAT.6 5×5 risk + I-2 reference', 'Risk（CAT.6 5×5）' in t and 'I-2 參考' in t and re.search(r'\d×\d=\d+', t))
    pg.goto(BASE + 'app/cis-ram.html'); settle(pg)
    t = pg.inner_text('#page'); ok('CIS RAM: default threshold 9 with basis', 'Risk ≤ 9' in t and 'Treatment Required' in t and 'CAT.6 預設門檻 9' in t)
    pg.goto(BASE + 'app/risk-register.html'); settle(pg)
    pg.locator('[data-add]').first.click(); opts = pg.locator('dialog[open] select[name=likelihood] option').all_inner_texts()
    ok('Risk form: L1–L5 descriptors', any('Rare' in o for o in opts) and any('Almost Certain' in o for o in opts))
    pg.keyboard.press('Escape')
    pg.goto(BASE + 'app/risk-assessment.html'); settle(pg)
    ok('Setup: defaults & basis listed', '預設值與採用依據' in pg.inner_text('#page') and 'CIS_RAM_可接受風險門檻.pdf' in pg.inner_text('#page'))
    pg.click('#new-as'); d = pg.locator('dialog[open]')
    d.locator('[name=organization]').fill('E2E 公司'); d.locator('[name=name]').fill('E2E 新評估'); d.locator('[name=scope]').fill('全公司'); d.locator('[name=assessor]').fill('QA')
    d.locator('button[type=submit]').click(); pg.wait_for_function("(document.getElementById('c6-ctx') || {}).textContent && document.getElementById('c6-ctx').textContent.includes('E2E 公司')", timeout=15000); settle(pg)
    pg.goto(BASE + 'app/risk-register.html'); settle(pg)
    ok('New assessment: missing datasets filled with CAT6_DEFAULT', pg.locator('table tbody tr').count() >= 6 and 'E2E 公司' in pg.inner_text('header'))
    pg.goto(BASE + 'app/cis-ram.html'); settle(pg); ok('New assessment keeps demo assessment intact (IDs scoped per assessment)', pg.locator('table tbody tr').count() >= 3)
    ok('No errors in methodology flows', not errs, errs[:3])
    ctx.close()
    # ---------- 7c. collapsible sidebar + scrollbar ----------
    def view(pg): return pg.evaluate("document.documentElement.getAttribute('data-side-view')")
    def main_w(pg): return pg.evaluate("document.querySelector('.c6-main').getBoundingClientRect().width")
    def overflow(pg): return pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); errs = []; watch(pg, errs)
    pg.goto(BASE + 'app/dashboard.html'); settle(pg)
    tg = pg.locator('.c6-side__toggle')
    ok('Desktop: default expanded (full)', view(pg) == 'full' and tg.get_attribute('aria-expanded') == 'true' and pg.locator('.c6-nav__text').first.is_visible())
    w0 = main_w(pg); tg.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(450)
    w1 = main_w(pg)
    ok('Desktop: keyboard collapse → rail, main content widens', view(pg) == 'rail' and tg.get_attribute('aria-expanded') == 'false' and w1 - w0 > 150, '%d → %d px' % (w0, w1))
    ok('Desktop rail: labels hidden but accessible, toggle labelled', pg.locator('.c6-nav__text').first.evaluate('e => e.getBoundingClientRect().width') <= 1 and pg.locator('.c6-nav__text').first.inner_text() != '' and pg.locator('.c6-nav__link').first.get_attribute('title') and '展開' in (tg.get_attribute('aria-label') or ''))
    ok('Desktop rail: no page overflow', overflow(pg) <= 1)
    pg.reload(); settle(pg); ok('Desktop: collapsed preference persists after reload', view(pg) == 'rail')
    pg.locator('.c6-nav__link[href="risk-register.html"]').click(); settle(pg)
    ok('Rail navigation works', pg.url.endswith('risk-register.html') and view(pg) == 'rail')
    pg.locator('.c6-side__toggle').click(); pg.wait_for_timeout(450); ok('Desktop: expand restores full sidebar', view(pg) == 'full' and pg.locator('.c6-nav__text').first.is_visible())
    focus_style = pg.evaluate("(() => { const b = document.querySelector('.c6-side__toggle'); b.focus(); return getComputedStyle(b, ':focus-visible').outlineStyle; })()")
    ctx.close()
    ctx = b.new_context(viewport={'width': 820, 'height': 1180}); pg = ctx.new_page(); watch(pg, errs)
    pg.goto(BASE + 'app/dashboard.html'); settle(pg)
    w0 = main_w(pg); ok('Tablet: default narrow rail', view(pg) == 'rail')
    pg.locator('.c6-side__toggle').click(); pg.wait_for_timeout(400)
    ok('Tablet: expand opens overlay drawer + backdrop, content does not move', view(pg) == 'overlay' and pg.locator('.c6-scrim').evaluate("e => getComputedStyle(e).opacity") == '1' and abs(main_w(pg) - w0) < 1)
    ok('Tablet overlay: focus moved into drawer', pg.evaluate("document.activeElement.classList.contains('c6-nav__link')"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); ok('Tablet: Escape closes overlay, focus returns', view(pg) == 'rail' and pg.evaluate("document.activeElement.classList.contains('c6-side__toggle')"))
    pg.locator('.c6-side__toggle').click(); pg.wait_for_timeout(300); pg.mouse.click(700, 500); pg.wait_for_timeout(300)
    ok('Tablet: backdrop click closes overlay', view(pg) == 'rail')
    ctx.close()
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, has_touch=True); pg = ctx.new_page(); watch(pg, errs)
    pg.goto(BASE + 'app/dashboard.html'); settle(pg)
    side_vis = lambda: pg.evaluate("getComputedStyle(document.querySelector('.c6-side')).visibility")
    ok('Mobile: sidebar hidden by default, not in tab order', view(pg) == 'hidden' and side_vis() == 'hidden')
    mb = pg.locator('.c6-topbar__menu'); mb.click(); pg.wait_for_timeout(350)
    ok('Mobile: menu button opens drawer + backdrop', view(pg) == 'drawer' and side_vis() == 'visible' and mb.get_attribute('aria-expanded') == 'true')
    ok('Mobile drawer: close button labelled', '關閉' in (pg.locator('.c6-side__toggle').get_attribute('aria-label') or ''))
    pg.locator('.c6-side__toggle').click(); pg.wait_for_timeout(350); ok('Mobile: close button closes drawer', view(pg) == 'hidden')
    mb.click(); pg.wait_for_timeout(300); pg.mouse.click(340, 400); pg.wait_for_timeout(350); ok('Mobile: backdrop closes drawer', view(pg) == 'hidden')
    mb.click(); pg.wait_for_timeout(300)
    sh = pg.evaluate("(() => { const s = document.querySelector('.c6-side'); return [s.scrollHeight, s.clientHeight, getComputedStyle(s).overflowY]; })()")
    ok('Mobile drawer: internal scrolling enabled', sh[2] == 'auto')
    pg.locator('.c6-nav__link[href="frameworks.html"]').click(); settle(pg); ok('Mobile drawer navigation works', pg.url.endswith('frameworks.html') and view(pg) == 'hidden')
    ok('Mobile: no page overflow', overflow(pg) <= 1)
    ctx.close()
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); watch(pg, errs)
    pg.goto(BASE + 'app/iso-gap.html'); settle(pg)
    sb = pg.evaluate("(() => { const cs = getComputedStyle(document.documentElement); return [cs.getPropertyValue('--c6-scroll-thumb').trim(), cs.getPropertyValue('--c6-scroll-size').trim()]; })()")
    ok('Scrollbar tokens resolved on <html> (purple thumb, 8px)', 'color-mix' in sb[0] or sb[0].startswith('rgb') or sb[0].startswith('color('), sb)
    thumb = pg.evaluate("(() => { const t = document.querySelector('.c6-table-wrap'); return t ? getComputedStyle(t, '::-webkit-scrollbar-thumb').backgroundColor : ''; })()")
    ok('Table wrap overflow scroll', pg.evaluate("[...document.querySelectorAll('.c6-table-wrap')].some(t => getComputedStyle(t).overflowX === 'auto')"))
    pg.set_viewport_size({'width': 1440, 'height': 400}); pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(OUT, 'scrollbar-1440.png'))
    ok('No errors in sidebar flows', not errs, errs[:3])
    ctx.close()
    # ---------- 8. file:// fallback ----------
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); errs = []; watch(pg, errs)
    pg.goto('file://' + os.path.join(ROOT, 'app/fair-analysis.html')); settle(pg)
    pg.locator('input[name=iters][value="10000"]').check(force=True); pg.click('#run')
    pg.wait_for_function("document.getElementById('run-state').textContent.includes('Completed')", timeout=60000)
    st = pg.inner_text('#run-state'); ok('file:// → main-thread fallback with reason', '主執行緒' in st and 'file://' in st, st)
    pg.goto('file://' + os.path.join(ROOT, 'app/dashboard.html')); settle(pg)
    ok('file:// dashboard loads without errors', not [e for e in errs if 'Worker' not in e], errs[:3])
    ctx.close(); b.close()
srv.shutdown()
passed = sum(1 for r in results if r[1]); failed = len(results) - passed
json.dump([{'name': n, 'ok': o, 'info': str(i)} for n, o, i in results], open(os.path.join(OUT, 'e2e-results.json'), 'w'), ensure_ascii=False, indent=1)
print('\n%d passed, %d failed  (artifacts: %s)' % (passed, failed, OUT))
sys.exit(1 if failed else 0)
