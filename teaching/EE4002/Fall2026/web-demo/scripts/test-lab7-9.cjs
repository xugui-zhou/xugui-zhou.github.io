'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../shared/operations-model.js'),{checkReferences}=require('./lib/check-refs.cjs'),root=path.resolve(__dirname,'..');
assert.equal(M.scada({profile:'sustained',delay:3}).metrics.firstAlarmSeconds,13);
let r=M.scada({profile:'sustained'});assert(r.samples[25].active&&r.samples[25].acked);assert(!r.samples[40].active);
r=M.scada({profile:'stale'});assert.equal(r.samples[23].quality,'STALE');assert.equal(r.samples[35].age,0);
assert(M.scada({scale:.01}).metrics.maxDisplayErrorM>5);
assert(M.scada({profile:'chatter',deadband:.05}).metrics.alarmActivations<M.scada({profile:'chatter',deadband:0,delay:0}).metrics.alarmActivations);
assert.equal(M.security({policy:'leastPrivilege'}).metrics.allowedReads,3);assert.equal(M.security({policy:'leastPrivilege'}).metrics.allowedWrites,0);
assert.equal(M.security({policy:'leastPrivilege',maintenance:true}).metrics.allowedWrites,1);
assert.equal(M.security({policy:'isolate'}).metrics.allowedReads,0);assert.equal(M.security({logging:false}).log.length,0);assert.equal(M.security({logging:false}).events.length,6);
for(const [caseId,repair]of [['A','scaling'],['B','link'],['C','permission']]){assert.equal(M.diagnose({caseId}).metrics.checksPassed,4);assert.equal(M.diagnose({caseId,repair}).metrics.checksPassed,5);}
for(const lab of [7,8,9]){
 const html=fs.readFileSync(path.join(root,`lab${lab}/${lab===7?'legacy-experiments':'index'}.html`),'utf8');checkReferences(html,path.join(root,`lab${lab}`));
 const elements=new Map(),saved=new Map(),downloads=[],ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 function add(id){if(elements.has(id))return;let markup='';elements.set(id,{value:'',checked:false,disabled:false,dataset:{},textContent:'',focus(){},setAttribute(){},getContext(){return ctx;},get innerHTML(){return markup;},set innerHTML(v){markup=v;for(const m of v.matchAll(/id="([^"]+)"/g))add(m[1]);}});}
 for(const m of html.matchAll(/id="([^"]+)"/g))add(m[1]);
 const $=id=>{assert(elements.has(id),'Unknown DOM ID '+id);return elements.get(id);};
 const sandbox={console,document:{body:{dataset:{lab:String(lab)}},getElementById:$,querySelectorAll:()=>[],createElement:()=>({click(){}})},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},cancelAnimationFrame(){},requestAnimationFrame(){return 1;},confirm:()=>true,Blob:class{constructor(parts){this.text=parts.join('');}},URL:{createObjectURL:b=>{downloads.push(b.text);return '';},revokeObjectURL(){}},setTimeout(){},Date};sandbox.window=sandbox;vm.createContext(sandbox);
 if(lab===7){sandbox.ScadaModel=require('../lab7/studio-model.js');vm.runInContext(fs.readFileSync(path.join(root,'lab7/evidence.js'),'utf8'),sandbox);const project=sandbox.ScadaModel.starter();const cap=(age,active,acked)=>({label:'Observation',project,state:{t:10,h:1.4,pv:1.4,age,active,acked,pump:true},trace:[{t:0,h:.8,pv:.8},{t:10,h:1.4,pv:1.4}],events:[]});saved.set('ee4002-lab7-studio-v1',JSON.stringify({schema:1,project,captures:[cap(0,false,false),cap(0,true,true),cap(3,true,true)]}));}
 for(const f of ['operations-model.js','operations-tasks.js','operations-workbench.js'])vm.runInContext(fs.readFileSync(path.join(root,'shared',f),'utf8'),sandbox,{filename:f});
 $('report').onclick();assert(downloads.at(-1).includes('Evidence self-check'));assert(downloads.at(-1).includes('Missing / check'));
 $('run').onclick();$('capture').onclick();assert($('status').textContent.includes('prediction'));
 for(const t of sandbox.OperationsTasks[lab].tasks){
  $('nav').onclick({target:{dataset:{task:t.id}}});assert($('capture').disabled);
  $('prediction').value='<script>hypothesis</script>';$('prediction').oninput();$('label').value='baseline';$('run').onclick();$('capture').onclick();
  const k=t.change[0],el=$('c-'+k);if(k==='maintenance'||k==='logging')el.checked=!el.checked;else el.value=({profile:'stale',delay:3,scale:.001,deadband:.05,policy:'readOnly',repair:({A:'scaling',B:'link',C:'permission'})[t.setup.caseId]})[k];
  $('settings').oninput();assert($('capture').disabled);$('run').onclick();$('label').value='revised';$('capture').onclick();
  if(t.verify){$('c-profile').value=t.verify;$('settings').oninput();$('run').onclick();$('label').value='verification';$('capture').onclick();}
  $('explanation').value='Test evidence and limitation';$('explanation').oninput();
 }
 $('reviewButton').onclick();$('student').value='Student';$('student').oninput();assert($('summary').innerHTML.includes('Required saved items are present'));
 $('report').onclick();assert(downloads.at(-1).includes('&lt;script&gt;hypothesis'));assert(!downloads.at(-1).includes('<script>hypothesis'));
 $('json').onclick();const data=JSON.parse(downloads.at(-1));if(lab===7){assert.equal(data.studio.captures.length,3);assert(downloads.at(-2).includes('Static reconstruction'));}assert.equal(data.tasks.length,4);assert(data.tasks.every(t=>t.captures.length>=2));assert(saved.values().next().value.length<400000);
 sandbox.localStorage.setItem=()=>{throw Error('quota');};$('student').oninput();assert($('status').textContent.includes('Download now'));
}
const demo=fs.readFileSync(path.join(root,'demo.html'),'utf8');for(const [,s]of demo.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(s);
for(const n of [7,8,9])assert(demo.includes(`id: "l${n}", idx: "L${n}"`));
console.log('PASS: Labs 7–9 alarm states, freshness, policy/logging, diagnosis regression, all task comparisons, report self-check, escaping, bounded drafts and quota warnings. DOM-contract tests, not browser layout QA.');
