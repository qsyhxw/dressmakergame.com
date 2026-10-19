// Run with Node and Playwright installed. All ad/network traffic is mocked.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function htmlFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e =>
    e.name.startsWith('.') || e.name === 'node_modules' ? [] :
    e.isDirectory() ? htmlFiles(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir,e.name)] : []);
}
(async () => {
  let pages = 0, doubles = 0;
  for (const file of htmlFiles(root)) {
    const html = fs.readFileSync(file, 'utf8');
    assert(!/bauval\.org|data-adsterra|adsterra-native\.js/.test(html), file);
    const ids = [...html.matchAll(/id="(dressmaker_content_\d+)"/g)].map(m=>m[1]);
    assert.equal(ids.length, new Set(ids).size, file);
    if (ids.length) {
      pages++; if(ids.length===2)doubles++;
      assert(ids.length<=2, file);
      assert.equal((html.match(/s\.nitropay\.com\/ads-2491\.js/g)||[]).length,1,file);
      assert(html.indexOf('ads-2491.js') < html.indexOf('</head>'),file);
    }
  }
  assert.equal(pages,34); assert.equal(doubles,6);
  for(const file of ['404.html','privacy.html','terms.html','official-links.html','_template.html'])
    assert(!/s\.nitropay|data-nitro-slot|nitropay\.js/.test(read(file)),file);
  assert(!fs.existsSync(path.join(root,'ads.txt')));
  assert(read('_redirects').indexOf('/ads.txt  https://api.nitropay.com/v1/ads-2491.txt  301') >= 0);
  const browser = await chromium.launch({headless:true, channel:'chrome'});
  try {
    for(const width of [375,1280]) {
      const page = await browser.newPage({viewport:{width,height:800}});
      await page.route('**/*',route=>route.abort());
      const slot = id => `<section class="nitro-slot" data-nitro-slot aria-hidden="true"><p class="nitro-slot-label">Advertisement</p><div class="nitro-slot-target" id="${id}"></div></section>`;
      await page.setContent(`<style>${read('nitropay.css')}</style><p>Intro</p>${slot('dressmaker_content_1')}<div style="height:2000px">Body</div>${slot('dressmaker_content_2')}`);
      await page.evaluate(()=>{window.calls=[];window.nitroAds={createAd:(id,options)=>{window.calls.push({id,options});return Promise.resolve({});}};});
      await page.addScriptTag({content:read('nitropay.js')});
      await page.waitForFunction(()=>window.calls.length===1);
      assert.equal(await page.locator('[data-nitro-slot]').first().evaluate(e=>e.getBoundingClientRect().height),0);
      assert(await page.evaluate(()=>window.calls[0].options.sizes.every(s=>s[0]<=document.querySelector('[data-nitro-slot]').getBoundingClientRect().width)));
      const render = type => page.evaluate(type=>{
        const target=document.getElementById('dressmaker_content_1');
        target.innerHTML='<div style="height:250px;background:#ddd">Mock ad</div>';
        document.dispatchEvent(new CustomEvent('nitroAds.rendered',{detail:{type,adInfo:{adUnitCode:target.id}}}));
      },type);
      await render('blank');
      assert.equal(await page.locator('[data-nitro-slot]').first().evaluate(e=>e.getBoundingClientRect().height),0);
      await render('test-bidder');
      assert(await page.locator('[data-nitro-slot]').first().evaluate(e=>e.getBoundingClientRect().height)>250);
      await page.addScriptTag({content:read('nitropay.js')});
      assert.equal(await page.evaluate(()=>window.calls.length),1);
      await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
      await page.waitForFunction(()=>window.calls.length===2);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
      await page.close();
    }
    console.log('PASS: 34 pages, 6 double placements, 5 exclusions; mobile/desktop no-fill, late-fill, lazy loading, duplicate guard, no overflow. Mock ads only.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
