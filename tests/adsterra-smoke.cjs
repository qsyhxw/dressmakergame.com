// Local checks only: no provider requests, real impressions or ad clicks.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const key = 'e650c65aadd95134c827779b7170fa6e';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function htmlFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e =>
    e.name.startsWith('.') || e.name === 'node_modules' ? [] :
      e.isDirectory() ? htmlFiles(path.join(dir,e.name)) : e.name.endsWith('.html') ? [path.join(dir,e.name)] : []);
}
let pages = 0;
for (const file of htmlFiles(root)) {
  const html = fs.readFileSync(file, 'utf8');
  assert(!/nitropay|nitro-slot|dressmaker_content_/.test(html), file);
  if (!html.includes('data-adsterra-native')) continue;
  pages++;
  assert.equal(html.split(`src="https://bauval.org/21/${key}"`).length - 1,1,file);
  assert.equal(html.split(`id="container-${key}"`).length - 1,1,file);
  assert.equal(html.split('/adsterra-native.js?v=20261022').length - 1,1,file);
  assert(!/data-adsterra-native[^>]*\shidden(?:\s|>|=)|<iframe/.test(html.match(/<section class="adsterra-slot"[\s\S]*?<\/section>/)[0]),file);
}
assert.equal(pages,34);
for (const file of ['404.html','privacy.html','terms.html','official-links.html','_template.html'])
  assert(!/bauval\.org|data-adsterra-native|adsterra-native\.js/.test(read(file)),file);
assert(!read('_redirects').includes('api.nitropay.com'));
const css = read('adsterra-native.css');
assert(!/visibility:\s*hidden|display:\s*none|max-height|pointer-events/.test(css));
const code = read('adsterra-native.js');
assert(!/window\.open|preventDefault|stopPropagation|sandbox|top\.location/.test(code));
let cards=[], images=[], links=[], update, observed=0;
const container = {
  id:`container-${key}`,
  getElementsByClassName:()=>cards,
  querySelectorAll:selector=>selector==='img'?images:links,
  addEventListener:()=>{}
};
const wrapper={dataset:{},querySelector:()=>container,setAttribute:()=>{}};
const context={document:{querySelectorAll:()=>[wrapper]},MutationObserver:class {
  constructor(fn){update=fn;} observe(){observed++;}
}};
vm.runInNewContext(code,context);
assert.equal(wrapper.dataset.filled,'false','empty scaffolding must stay collapsed');
images=[{complete:true,naturalWidth:1,naturalHeight:1}];update();
assert.equal(wrapper.dataset.filled,'false','tracking pixel is not a creative');
cards=[{textContent:'Mock native title'}];update();
assert.equal(wrapper.dataset.filled,'true','late native background-image card reveals slot');
cards=[];images=[];update();assert.equal(wrapper.dataset.filled,'false');
images=[{complete:true,naturalWidth:300,naturalHeight:250}];update();
assert.equal(wrapper.dataset.filled,'true','later recovery can reveal slot');
vm.runInNewContext(code,context);assert.equal(observed,1,'no duplicate initialization');
console.log('PASS: 34 direct placements; 5 exclusions; no Nitro leftovers, sandbox or click interception; empty/late/recovery/tracking-pixel/duplicate checks. Real ads not tested.');
