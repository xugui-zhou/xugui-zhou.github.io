'use strict';
// Lightweight DOM-contract unit test, not a browser/layout/download integration test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../lab2'),elements=new Map(),downloads=[];
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.checked=false;this.classList={toggle(){}};}
 set id(v){this._id=v;elements.set(v,this);}get id(){return this._id;}
 set innerHTML(v){this.html=v;for(const m of v.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);e.id=m[2];const value=m[0].match(/\bvalue="([^"]*)"/);if(value)e.value=value[1];}}
 get innerHTML(){return this.html||'';}
 append(...e){this.children.push(...e);if(this.tag==='select'&&!this.value&&e[0])this.value=e[0].value;}
 before(){}after(){}replaceChildren(...e){this.children=[];this.value='';this.append(...e);}
 setAttribute(k,v){this[k]=v;}getContext(){return new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
 click(){if(!this.disabled)this.onclick?.();}
}
const page=new Element();page.innerHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');
const get=id=>{assert.ok(elements.has(id),'Missing DOM element '+id);return elements.get(id);};
const document={getElementById:get,createElement:t=>new Element(t),addEventListener(){},querySelector:s=>{assert.equal(s,'.workspace');return new Element();},querySelectorAll:s=>s==='#tasks button'?get('tasks').children:['play','advance','fixedRun','speed','start','stop','reset','held','low','high','qout','apply','level','setlevel','source','invalid','blocked','mode','kp','ki','applypi'].map(get)};
const ctx=vm.createContext({document,console,localStorage:{getItem(){return null;},setItem(){}},performance:{now:()=>0},requestAnimationFrame(){},scrollTo(){},setTimeout(){return 1;},clearTimeout(){},Blob:class{constructor(parts){this.text=parts.join('');}},URL:{createObjectURL(blob){downloads.push(blob.text);return 'test:download';},revokeObjectURL(){}}});
for(const name of ['model.js','evidence.js','support.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
function click(id){get(id).click();}function input(id,v){get(id).value=String(v);get(id).oninput?.({target:get(id)});}function task(i){get('tasks').children[i].click();click('prepare');}function setlevel(h){input('level',h);click('setlevel');}function check(id,v){get(id).checked=v;get(id).onchange({target:get(id)});}function exportData(){click('json');return JSON.parse(downloads.at(-1));}
assert.equal(get('tasks').children.length,8);assert.equal(get('capture').disabled,true);
task(0);input('prediction','QA prediction');click('start');click('advance');click('capture');let data=exportData();assert.ok(Math.abs(data.tasks[0].records[0].snapshot.level-.8)<1e-8);assert.equal(data.tasks[0].records[0].conditionWarnings.length,0);
check('blocked',true);click('advance');click('capture');assert.equal(exportData().tasks[0].records[1].conditionWarnings.length,0);
task(1);click('start');setlevel(.8);setlevel(1);click('capture');setlevel(1.2);setlevel(1);click('capture');data=exportData();assert.deepEqual(data.tasks[1].records.map(r=>r.snapshot.command),[100,0]);assert.ok(data.tasks[1].records.every(r=>r.conditionWarnings.length===0));
task(3);click('advance');click('capture');assert.ok(exportData().tasks[3].records[0].conditionWarnings.length>0);
task(4);check('held',true);setlevel(1.6);click('capture');setlevel(.7);click('reset');click('advance');click('capture');check('held',false);click('start');click('capture');setlevel(1.6);click('reset');click('capture');data=exportData();assert.ok(data.tasks[4].records.every(r=>r.conditionWarnings.length===0));assert.equal(data.tasks[4].records[1].snapshot.state,'IDLE');
task(5);click('fixedRun');assert.match(get('notice').textContent,/Press Start/);click('start');click('fixedRun');click('capture');data=exportData();assert.equal(data.tasks[5].required,false);assert.equal(data.tasks[5].records[0].snapshot.t,120);assert.equal(data.tasks[5].records[0].conditionWarnings.length,0);
task(6);click('start');click('fixedRun');click('capture');data=exportData();assert.equal(data.tasks[6].required,false);assert.equal(data.tasks[6].records[0].snapshot.t,120);
click('reviewButton');assert.equal(get('taskWorkspace').hidden,true);assert.equal(get('submission').hidden,false);assert.equal(get('reviewSummary').children.length,7);
click('report');assert.match(downloads.at(-1),/conditionWarnings/);assert.match(downloads.at(-1),/Design and justify/);
get('reviewSummary').children[0].children[1].click();assert.equal(get('taskWorkspace').hidden,false);assert.equal(get('submission').hidden,true);assert.equal(exportData().tasks[0].records.length,2);
console.log('PASS: UI-script initialization, task navigation, P1/P2/I2 sequences, wrong-condition reminders, optional I3/X1, 120 s control and JSON/HTML generation (DOM-contract unit test only).');
