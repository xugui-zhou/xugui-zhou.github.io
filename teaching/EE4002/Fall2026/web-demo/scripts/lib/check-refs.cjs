const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const activeHtml=html=>html.replace(/<!--[\s\S]*?-->/g,'');
function checkReferences(html,dir,file='HTML'){
 for(const [,raw] of activeHtml(html).matchAll(/(?:href|src)\s*=\s*["']([^"'<>]+)["']/gi)){
  if(/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(raw)||raw.includes('+')||raw.includes('${'))continue;
  const ref=decodeURIComponent(raw.split(/[?#]/)[0]);
  if(ref)assert(fs.existsSync(path.resolve(dir,ref)),`Missing reference: ${file} ${ref}`);
 }
}
module.exports={activeHtml,checkReferences};
