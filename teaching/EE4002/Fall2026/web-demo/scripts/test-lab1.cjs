const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'lab1');
require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'build-lab1.cjs'),'--check'],{stdio:'inherit'});
for(const dir of [root,lab])for(const name of fs.readdirSync(dir)){
 const file=path.join(dir,name);
 if(name.endsWith('.js'))new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
 if(!name.endsWith('.html'))continue;
 const html=fs.readFileSync(file,'utf8');
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1],{filename:file});
 for(const m of html.matchAll(/(?:href|src)="([^"<>]+)"/g)){
  if(/^(?:https?:|data:|#|about:)/.test(m[1])||m[1].includes("'+"))continue;
  const ref=decodeURIComponent(m[1].split(/[?#]/)[0]);if(ref)assert(fs.existsSync(path.resolve(dir,ref)),'Missing reference: '+file+' '+ref);
 }
}
const steps=require(path.join(lab,'step-plan.js')),report=require(path.join(lab,'report.js'));
assert.deepEqual(steps.taskKeys('practice'),['A','B','C','D']);
assert.deepEqual(steps.taskKeys('independent'),['E','F','G','H']);
assert.equal(steps.expectations().H.prediction_required,false);
assert.deepEqual(steps.expectations().F.responses.map(r=>r.key),['failure','recovery']);
// A future response and a nonalphabetical task must propagate without report-specific edits.
steps.plans.G.steps.push({gate:'response',responseKey:'additional',responsePrompt:'Additional feedback explanation'});
steps.plans.Z={phase:'practice',title:'Extra practice',steps:[]};
steps.plans.Q={phase:'independent',title:'<script>New independent task</script>',steps:[{gate:'response',responseKey:'new',responsePrompt:'New reasoning'}]};
const evidence={task_expectations:steps.expectations(),group:'<script>student</script>',explanations:[],predictions:[],checkpoints:[]};
let html=report.build(evidence);
assert(html.includes('Additional feedback explanation'));
assert(html.includes('I3 · DAC feedback: additional explanation'));
assert(html.includes('&lt;script&gt;New independent task&lt;/script&gt;'));
assert(!html.includes('<script>'));assert(!html.includes('<h2>Extra practice</h2>'));
evidence.explanations.push({task:'G',key:'additional',text:'Added evidence'});
html=report.build(evidence);assert(html.includes('Added evidence'));assert(!html.includes('I3 · DAC feedback: additional explanation'));
assert(report.build({}).includes('completeness cannot be assessed'));
const runtime=fs.readFileSync(path.join(lab,'runtime.js'),'utf8');
assert.equal((runtime.match(/'use strict';/g)||[]).length,1);
assert(!/previousUpdate|previousShow|originalRender|priorRender|checkInputSettings|jumpTask|nextLessonTask/.test(runtime));
const demo=fs.readFileSync(path.join(root,'demo.html'),'utf8');assert(!/id: "m2"|\bm2:|build\.m2|wire\.m2|labCommand/.test(demo));
assert(!fs.readFileSync(path.join(lab,'index.html'),'utf8').includes('Workbench sections'));
assert(!fs.readFileSync(path.join(lab,'steps.css'),'utf8').includes('main>nav'));
console.log('PASS: syntax, local references, source parity, explicit phases, future report requirements, escaped content, legacy route cleanup.');
