"""Regenerates trust/docs/<Document ID>.pdf from trust/doc.html (Playwright + Chromium).
The SAMPLE / DEMO marks are part of each document's SVG, so they are in the PDF as vector content.
QR codes point at the public CAT.6 Trust Center:  python3 tools/gen_demo_docs.py [site_base_url]"""
import os, sys, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SITE = (sys.argv[1] if len(sys.argv) > 1 else 'https://irischen24.github.io/CAT.6.Cybersecurity/').rstrip('/') + '/'
socketserver.TCPServer.allow_reuse_address = True
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 8791), functools.partial(Q, directory=ROOT)); threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    for it in ['iso27001', 'iso27017', 'vapt', 'soc2']:
        pg.goto('http://127.0.0.1:8791/trust/doc.html?id=' + it); pg.wait_for_selector('#doc svg')
        doc_id = pg.evaluate("(b) => { const it = CAT6.data.compliance.items.find(x => x.id === '" + it + "'); document.getElementById('doc').innerHTML = CAT6.services.demoDocs.svg(it.id, { base: b }); return it.documentId; }", SITE + 'trust/')
        out = os.path.join(ROOT, 'trust', 'docs', doc_id + '.pdf'); pg.pdf(path=out, prefer_css_page_size=True, print_background=True); print(out)
    b.close()
srv.shutdown()
