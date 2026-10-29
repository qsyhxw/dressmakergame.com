"""Read-only release gate for the hand-authored static HTML source tree."""
from pathlib import Path
import argparse, subprocess,sys,xml.etree.ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(root/'scripts/check_integrations.py'),'--root',str(root),'--config',str(root/'config/integrations.json'),'--baseline',a.baseline],check=True)
assert (root/'ads.txt').read_text().splitlines().count('google.com, pub-8830315294299920, DIRECT, f08c47fec0942fa0')==1
tree=ET.parse(root/'sitemap.xml');urls=[n.text for n in tree.findall('.//{*}loc')];assert len(urls)==len(set(urls))
for u in urls:
 path=u.removeprefix('https://dressmakergame.com/');f=root/(path+'index.html' if path.endswith('/') or not path else path+'.html')
 assert f.exists(),u
print('PASS: static HTML source, ads.txt and sitemap; run browser QA separately. No remote required-check enforcement configured.')
