const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {checkReferences}=require('./lib/check-refs.cjs'),E=require('../lab3/evidence-storage.js');
checkReferences('<!-- <a href="missing"> --><a href="https://example.org"><a href="mailto:a@b"><a href="#x"><script src="test-shared.cjs?v=1#x"></script>',__dirname);
assert.throws(()=>checkReferences('<a href="missing?x=1">',__dirname),/Missing reference/);
const samples=Array.from({length:6000},(_,i)=>({t:i*.02,h:i===3001?1.99:1,sp:1,command:i===4021?100:50,q:.01,cascadeTarget:.01,unused:'large redundant state'}));
const r={samples,metrics:{peakLevel:1.99,saturatedSeconds:.02},events:[{t:30,text:'trip'}]};
const c=E.compact(r);assert(c.samples.length<=400);assert(c.samples.some(s=>s.h===1.99));assert(c.samples.some(s=>s.command===100));assert.deepEqual(c.metrics,r.metrics);assert.deepEqual(c.events,r.events);assert.equal(c.samples[0].t,0);assert.equal(c.samples.at(-1).t,119.98);
const work=Object.fromEntries(['P1','P2','I1','I2','X1'].map(id=>[id,{prediction:'test',records:Array.from({length:12},()=>r)}]));
const json=E.serialize('test',work);assert(json.length<=750000);assert.equal(JSON.parse(json).work.X1.records.length,12);assert.equal(JSON.parse(json).work.I1.records[0].traceInfo.originalCount,6000);
assert.deepEqual(E.compact(c).metrics,r.metrics);assert.throws(()=>E.serialize('x'.repeat(750001),{}),/budget/);
const demo=fs.readFileSync(path.join(__dirname,'../demo.html'),'utf8'),alias=demo.match(/const normalizeModuleId=([^;]+);/)[1];const normalize=vm.runInNewContext('('+alias+')');assert.equal(normalize('m2'),'l1');assert.equal(normalize('m3'),'l3');assert.equal(normalize('m4'),'l4');
assert.equal(normalize('m5'),'l5');assert.equal(normalize('m6'),'l6');
for(const [n,archive] of [[5,'archive-network'],[6,'archive-control']]){
 assert(demo.includes(`id: "l${n}", idx: "L${n}"`));
 assert(!demo.includes(`id: "m${n}"`),'Legacy ID must be an alias, not a navigation entry');
 assert(demo.includes(`data-goto="${archive}"`),'Archive must have a visible home link');
 assert(demo.includes(`wire['${archive}']=wire.m${n}`),'Archive must use the retained legacy wiring');
 assert(demo.includes(`+build.m${n}()`),'Archive must render the retained legacy builder');
 assert.equal(normalize(archive),archive);
}
assert(demo.includes('[["l5",5,"Network Timing and Recovery"],["l6",6,"Networked Control"]]'));
assert(!demo.includes('index.html?v='),'Do not add an isolated iframe cache token');
const stale=/id: "m2"|\bm2:\s*function|build\.m2|wire\.m2|labCommand/;
assert(!stale.test('({m2:"l1"})'));for(const x of ['m2: function(){}','build.m2=','wire.m2=','labCommand'])assert(stale.test(x));
// Height reporter grows and shrinks, deduplicates measurements, does nothing standalone.
const heightScript=fs.readFileSync(path.join(__dirname,'../shared/embedded-height.js'),'utf8');
let height=900,resize,queued=[],messages=[];const parent={postMessage:m=>messages.push(m)},win={parent,addEventListener(){}};
vm.runInNewContext(heightScript,{window:win,parent,document:{body:{getBoundingClientRect:()=>({height})}},requestAnimationFrame:fn=>queued.push(fn),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}}});
queued.shift()();assert.equal(messages.at(-1).height,932);resize();queued.shift()();assert.equal(messages.length,1);height=300;resize();queued.shift()();assert.equal(messages.at(-1).height,332);
const standalone={};standalone.parent=standalone;vm.runInNewContext(heightScript,{window:standalone});
const handler=demo.match(/window.addEventListener\("message", function \(event\) \{([\s\S]*?)\n  const frame = document.getElementById\("icFrame"\);/)[1];
const frame={contentWindow:{},getAttribute:()=> 'lab3/index.html',style:{}};
function message(event){vm.runInNewContext('(function(event){'+handler+'})(event)',{event,document:{querySelectorAll:()=>[frame]},location:{origin:'https://example.test',protocol:'https:'}});}
message({source:frame.contentWindow,origin:'https://example.test',data:{type:'ee4002-lab-height',height:950}});assert.equal(frame.style.height,'950px');
for(const e of [{source:{},origin:'https://example.test',height:500},{source:frame.contentWindow,origin:'https://wrong.test',height:500},{source:frame.contentWindow,origin:'https://example.test',height:Infinity}])message({...e,data:{type:'ee4002-lab-height',height:e.height}});
assert.equal(frame.style.height,'950px');
console.log('PASS: shared references, aliases, bounded traces/extrema/metrics/events, storage budget, iframe growth/shrink and source/origin validation. Draft chars: '+json.length);
