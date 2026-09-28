"""Append ?v=<version> to every local .js / .css reference in index.html and app/*.html so browsers
(and the GitHub Pages CDN, max-age 600s) never mix files from two deployments.  python3 tools/cachebust.py [version]"""
import os, re, sys, glob, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
V = sys.argv[1] if len(sys.argv) > 1 else datetime.date.today().strftime('%Y%m%d')
pat = re.compile(r'((?:src|href)=")((?!https?:|//)[^"?#]+\.(?:js|css))(?:\?v=[^"]*)?(")')
for f in [os.path.join(ROOT, 'index.html')] + glob.glob(os.path.join(ROOT, 'app', '*.html')):
    s = open(f, encoding='utf-8').read(); n = pat.sub(lambda m: m.group(1) + m.group(2) + '?v=' + V + m.group(3), s)
    if n != s: open(f, 'w', encoding='utf-8').write(n)
print('cache version', V)
