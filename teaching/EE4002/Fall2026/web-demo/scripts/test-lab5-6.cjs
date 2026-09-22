'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),{network,control}=require('../shared/timing-model.js'),{checkReferences}=require('./lib/check-refs.cjs');
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
let r=network({mode:'can',rate:500,bg:4,id:384,base:0});near(r.frames[0].end,.26);assert.equal(r.frames[0].kind,'sensor');
r=network({mode:'can',rate:500,bg:4,id:768,base:0});near(r.frames.find(f=>f.kind==='sensor').delay,1.3);
near(network({rate:100,bg:8,base:2}).metrics.maxDeliveryMs,2.972);
near(network({rate:100,bg:8,base:2,qos:true}).metrics.maxDeliveryMs,2.012);
assert(network({rate:10,bg:12,deadline:5}).metrics.deadlineMisses>0);
assert.equal(network({rate:100,bg:12,deadline:5,qos:true}).metrics.deadlineMisses,0);
const outage={rate:100,bg:4,base:2,outage:40,qos:true};
near(network({...outage,period:10}).metrics.freshSourceReceivedMs,82.012);
near(network({...outage,period:15}).metrics.freshSourceReceivedMs,92.012);
assert.equal(network({rate:.1,bg:30,period:2}).samples.length,401);
const base=control({delay:4,limit:30}),candidate=control({delay:4,limit:30,kp:3,ki:.12});
assert.deepEqual(base,control({delay:4,limit:30}));assert.equal(base.samples.length,1201);
assert(candidate.metrics.peakLevelM<base.metrics.peakLevelM);assert(candidate.metrics.iaeMS<base.metrics.iaeMS*1.1);
assert.notDeepEqual(control({delay:0}).samples,base.samples);
assert(control({ki:0}).metrics.finalErrorM>.02);
const burst=control({delay:.2,burst:true,limit:3});assert(burst.metrics.staleSeconds>0);assert(burst.metrics.losses>0);
// A stale threshold crossing is acted on at the next controller tick, not between ticks.
const stopped=control({delay:.2,burst:true,limit:3,fallback:'stop'});assert(stopped.samples.filter(s=>s.stale&&Math.abs(s.t/.2-Math.round(s.t/.2))<1e-8).every(s=>s.u===0));
assert(control({jitter:3,delay:3}).metrics.rejectedOldPackets>0);
assert.equal(control({fallback:'bad',ts:99}).config.fallback,'hold');

// Execute the real UI against HTML-derived IDs. Unknown IDs must fail, not auto-create.
for(const lab of [5,6]){
 const html=fs.readFileSync(path.join(root,`lab${lab}/index.html`),'utf8');checkReferences(html,path.join(root,`lab${lab}`));
 const elements=new Map(),saved=new Map();const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 function add(id){if(elements.has(id))return;let markup='';elements.set(id,{value:'',checked:false,disabled:false,dataset:{},textContent:'',focus(){},setAttribute(){},getContext(){return ctx;},get innerHTML(){return markup;},set innerHTML(v){markup=v;for(const m of v.matchAll(/id="([^"]+)"/g))add(m[1]);}});}
 for(const m of html.matchAll(/id="([^"]+)"/g))add(m[1]);
 const $=id=>{assert(elements.has(id),'Unknown DOM ID '+id);return elements.get(id);};
 const sandbox={console,document:{body:{dataset:{lab:String(lab)}},getElementById:$,querySelectorAll:()=>[],createElement:()=>({click(){}})},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},cancelAnimationFrame(){},requestAnimationFrame(){return 1;},confirm:()=>true,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){},Date};sandbox.window=sandbox;vm.createContext(sandbox);
 for(const file of ['timing-model.js','timing-tasks.js','timing-workbench.js'])vm.runInContext(fs.readFileSync(path.join(root,'shared',file),'utf8'),sandbox,{filename:file});
 $('overlay').value='';$('run').onclick();assert.equal($('capture').disabled,false);
 $('capture').onclick();assert($('status').textContent.includes('prediction'));
 $('prediction').value='My prediction';$('prediction').oninput();$('label').value='Baseline';$('capture').onclick();
 const setting=lab===5?'id':'delay';$('c-'+setting).value=lab===5?'768':'4';$('settings').oninput();assert.equal($('capture').disabled,true);
 $('overlay').value='';$('run').onclick();$('label').value='Comparison';$('capture').onclick();
 $('explanation').value='Evidence and interpretation';$('explanation').oninput();$('reviewButton').onclick();assert($('summary').innerHTML.includes('Required comparison and writing present'));
 $('report').onclick();$('json').onclick();
 const data=JSON.parse(saved.values().next().value);assert.equal(data.tasks.P1.captures.length,2);assert(data.tasks.P1.captures.every(c=>c.samples.length<=241));
 $('nav').onclick({target:{dataset:{task:'P2'}}});assert.equal($('capture').disabled,true);assert($('readout').textContent.includes('No run yet'));
}
console.log('Lab 5–6 PASS: queue/arbitration timing, outage recovery, bounded storage traces, delayed PI comparisons, fault policies, references and UI workflow.');
