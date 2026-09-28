'use strict';
// DOM-contract tests only: not a substitute for browser layout/download QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../lab3'),elements=new Map(),downloads=[],sections=new Map();
class Element{
 constructor(){this.children=[];this.value='';this.checked=false;this.hidden=false;this.textContent='';this.style={};}
 set innerHTML(v){this.html=v;}get innerHTML(){return this.html||'';}
 append(e){this.children.push(e);}setAttribute(k,v){this[k]=v;}click(){this.onclick?.();}scrollIntoView(){}querySelectorAll(){return [];}
}
for(const [,id]of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element());
const get=id=>{assert.ok(elements.has(id),'Missing element '+id);return elements.get(id);};
const document={getElementById:get,createElement:()=>new Element(),addEventListener(){},querySelector(s){if(!sections.has(s))sections.set(s,new Element());return sections.get(s);},querySelectorAll:s=>s==='#tasknav button'?get('tasknav').children:[]};
const ctx=vm.createContext({document,console,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},Blob:class{constructor(a){this.text=a.join('');}},URL:{createObjectURL(b){downloads.push(b.text);return 'test:download';},revokeObjectURL(){}}});
for(const f of ['ladder.js','engine.js','ladder-editor.js','task-guide.js','evidence-storage.js','studio.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const click=id=>get(id).click(),check=(id,v)=>{get(id).checked=v;get(id).onchange({target:get(id)});};
click('report');
assert.match(downloads.at(-1),/Evidence self-check/);
assert.match(downloads.at(-1),/Missing saved items: 13/);
assert.match(downloads.at(-1),/I2 · Captures: 0 \/ 6 minimum/);
assert(!downloads.at(-1).split('</aside>')[0].includes('X1 · Captures'));
assert(downloads.at(-1).indexOf('Evidence self-check')<downloads.at(-1).indexOf('<section>'));
function data(){click('evidence');return JSON.parse(downloads.at(-1));}
function start(){click('compile');click('download');click('run');click('start');}
assert.equal(get('tasknav').children.length,6);click('run');assert.match(get('message').textContent,/Download/);
click('compile');assert.match(get('message').textContent,/branch needs/);for(const [button,tag]of [['addNO','Auto'],['addNO','StopOK'],['addNC','Trip']]){click(button);get('ladTag').value=tag;click('applyProperties');}click('deleteComponent');click('ladUndo');start();click('step');click('capture');assert.ok(Math.abs(data().tasks[0].records[0].snapshot.command-60.04)<1e-8);assert.match(get('onlineLadder').innerHTML,/powered/);
get('paramKp').value='80';click('applyParameters');click('download');assert.match(get('message').textContent,/STOP/);click('capture');assert.equal(data().tasks[0].records[1].dirty,true);
check('stopInput',true);click('step');click('capture');assert.equal(data().tasks[0].records[2].snapshot.command,0);
get('tasknav').children[1].click();click('download');assert.match(get('message').textContent,/Load this task/);click('baseline');get('paramMode').value='P';click('applyParameters');start();for(let i=0;i<12;i++)click('advance');click('capture');assert.equal(data().tasks[1].records[0].snapshot.t,120);
get('tasknav').children[2].click();click('baseline');start();for(let i=0;i<6;i++)click('advance');get('supply').value='0.65';get('supply').onchange({target:get('supply')});for(let i=0;i<6;i++)click('advance');click('capture');assert.equal(data().tasks[2].records[0].snapshot.supply,.65);assert.match(get('flowValues').innerHTML,/65%/);
get('tasknav').children[3].click();click('baseline');start();click('step');click('capture');assert.equal(data().tasks[3].records[0].snapshot.command,0);click('stop');get('ladCanvas').onclick({target:{closest:()=>({dataset:{ladN:'1',ladB:'0',ladC:'1'}})}});get('ladType').value='NO';get('ladType').onchange();get('ladTag').value='StopOK';click('applyProperties');start();click('step');click('capture');assert.ok(data().tasks[3].records[1].snapshot.command>0);
check('held',true);get('fixtureLevel').value='1.6';click('fixture');click('step');get('fixtureLevel').value='.7';click('fixture');click('reset');click('step');click('step');click('capture');assert.equal(data().tasks[3].records[2].snapshot.state,'IDLE');check('held',false);click('step');click('start');click('step');click('capture');assert.equal(data().tasks[3].records[3].snapshot.state,'AUTO');
get('tasknav').children[5].click();assert.equal(get('review').hidden,false);assert.equal(get('studio').hidden,true);click('report');assert.match(downloads.at(-1),/<svg/);assert.match(downloads.at(-1),/Repair a permission defect/);assert.equal(data().tasks[4].required,false);
const host=fs.readFileSync(path.resolve(root,'../demo.html'),'utf8');assert.match(host,/build\.l3=/);assert.match(host,/data-goto="l3"/);for(const [,script]of host.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script);
get('tasknav').children[1].click();click('baseline');click('addTON');get('ladPT').value='1';click('applyProperties');assert.equal(JSON.parse(get('code').value).networks[1].branches[0].at(-1).pt,1);start();click('step');click('capture');assert.equal(data().tasks[1].records.at(-1).snapshot.command,0);click('advance');click('capture');assert.ok(data().tasks[1].records.at(-1).snapshot.command>0);
click('stop');click('addNetwork');click('addNO');get('ladTag').value='Start';click('applyProperties');get('ladCanvas').onclick({target:{closest:()=>({dataset:{ladN:'2',ladB:'0'}})}});get('ladCoilType').value='SET';get('ladCoilTag').value='M1';click('applyProperties');click('addBranch');click('addNC');get('ladTag').value='LevelValid';click('applyProperties');click('compile');assert.match(get('message').textContent,/checks passed/);assert.equal(JSON.parse(get('code').value).networks[2].branches.length,2);click('networkUp');assert.equal(JSON.parse(get('code').value).networks[1].coil.tag,'M1');click('ladUndo');click('deleteBranch');assert.equal(JSON.parse(get('code').value).networks[0].branches.length,2);click('ladUndo');
click('saveProject');const project=JSON.parse(downloads.at(-1));assert.equal(project.schema,1);assert.equal(JSON.parse(project.source).format,'EE4002-LAD-1');
const recorded=data();
assert.ok(recorded.tasks[1].records[0].samples.length<=400);
assert.ok(recorded.tasks[1].records[0].events.length>0,'Events survive trace projection');
assert.equal(recorded.tasks[1].records[0].traceInfo.originalCount,1200);
assert.equal(recorded.tasks[0].records[0].settings.bias,50);
assert.equal(recorded.tasks[0].records[0].settings.mode,'PI');
assert.equal(recorded.tasks[0].records[0].settings.Ts,.1);
assert.match(recorded.tasks[3].expectedEvidence,/six captures/);
assert.match(get('captures').innerHTML,/Captured running conditions/);
get('tasknav').children[1].click();assert.match(get('instructions').innerHTML,/steady|120 s/);assert.match(get('expectedEvidence').textContent,/identical initial/);
for(const grouping of ['left','right'])for(const a of [false,true])for(const b of [false,true])for(const c of [false,true]){
 get('logicGrouping').value=grouping;get('logicA').checked=a;get('logicB').checked=b;get('logicC').checked=c;get('logicGrouping').onchange();
 const expected=grouping==='left'?(a&&b)||c:a&&(b||c);
 assert.ok(get('logicDrawing').innerHTML.endsWith(' '+expected+'</strong>'));
}
assert.deepEqual(data().tasks,recorded.tasks,'Isolated logic practice must not change assessment evidence');
click('report');assert.match(downloads.at(-1),/<table class="comparison">/);assert.match(downloads.at(-1),/Bias \/ Ts/);assert.match(downloads.at(-1),/snapshot, not proof of steady state/);
// Restore pre-refinement captures: retain evidence, recover gains, never invent Bias.
const legacy=JSON.parse(JSON.stringify(recorded));for(const task of legacy.tasks)for(const r of task.records)delete r.settings;
const saved={schema:1,student:'Legacy student',work:Object.fromEntries(legacy.tasks.map(t=>[t.id,t]))};
get('tasknav').children=[];ctx.localStorage.getItem=()=>JSON.stringify(saved);
vm.runInContext(fs.readFileSync(path.join(root,'studio.js'),'utf8'),ctx,{filename:'studio-restore.js'});
assert.equal(data().tasks[0].records.length,legacy.tasks[0].records.length);
assert.match(get('captures').innerHTML,/—% \/ 0.10 s/);click('report');assert.match(downloads.at(-1),/Legacy student/);
// Exercise the actual debounced persistence callback under quota failure, then recovery.
ctx.setTimeout=fn=>{fn();return 1;};ctx.localStorage.setItem=()=>{throw Error('QuotaExceededError');};
get('prediction').oninput({target:{value:'quota regression'}});assert.match(get('draftStatus').textContent,/Download evidence now/);
let storedDraft;ctx.localStorage.setItem=(k,v)=>{storedDraft=JSON.parse(v);};
get('prediction').oninput({target:{value:'saved regression'}});assert.equal(storedDraft.work.P1.prediction,'saved regression');assert.match(get('draftStatus').textContent,/saved locally/);
console.log('PASS: initialization, download guards, P1 first scan, draft mismatch, field Stop, P2 equal-time trial, I1 disturbance, I2 repair/held-Start recovery, final review, JSON/HTML SVG reports, capture settings, task guidance, isolated logic truth tables and host syntax. DOM-contract only.');
