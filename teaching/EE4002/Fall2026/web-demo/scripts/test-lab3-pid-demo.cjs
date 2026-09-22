'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Demo=require('../lab3/pid-demo-model.js'),{PLC}=require('../lab3/engine.js');
const assessed=new PLC(),d=new Demo();for(let i=0;i<50;i++)d.step();
assert.equal(assessed.bias,50);assert.equal(d.plc.bias,0);
for(const [ki,bias,target] of [[0,0,.5],[2,0,1],[0,50,1]]){const trial=new Demo();trial.apply({kp:100,ki,kd:0,bias});trial.restart();for(let i=0;i<6000;i++)trial.step();assert(Math.abs(trial.plc.h-target)<1e-5);if(ki===2)assert(Math.abs(trial.plc.J-50)<.001);}
assert.throws(()=>d.apply({kp:100,ki:0,kd:0,bias:25}));
const before={h:d.plc.h,q:d.plc.q,J:d.plc.J,t:d.plc.t};d.apply({kp:180,ki:3.44,kd:50,bias:50});for(const k of Object.keys(before))assert.equal(d.plc[k],before[k]);assert.equal(assessed.t,0);assert.equal(assessed.program.Kp,50);d.step();assert.equal(d.plc.program.Kp,180);assert(d.plc.command>0);
for(const bad of [NaN,Infinity,-1,201])assert.throws(()=>d.apply({kp:bad,ki:2,kd:0}));assert.equal(d.gains.kp,180);assert.throws(()=>d.supply(.4));
d.restart();assert.equal(d.plc.h,.8);assert.equal(d.plc.J,0);assert.equal(d.plc.q,0);assert.equal(d.plc.t,0);assert.equal(d.plc.program.Kp,180);for(let i=0;i<1200;i++)d.step();assert(Math.abs(d.plc.h-1.009015451)<1e-6);assert(Math.abs(d.peak-1.038082829)<1e-6);assert(d.rows.length<=1201);
d.restart();for(let i=0;i<1200;i++){if(i===600)d.supply(.65);d.step();}assert(Math.abs(d.plc.h-.924384241)<1e-6);
// Execute the actual UI against a minimal DOM and animation clock.
const root=path.join(__dirname,'../lab3'),html=fs.readFileSync(path.join(root,'pid-demo.html'),'utf8'),ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',style:{},textContent:'',innerHTML:''}]));for(const [id,value]of Object.entries({kp:'100',ki:'0',kd:'0',bias:'0',speed:'4',supply:'1',window:'120',levelScale:'full',plotSize:'175'})){nodes[id].value=value;Object.defineProperty(nodes[id],'valueAsNumber',{get(){return Number(this.value);}});}

let raf,visibleHandler,live;
class ObservedDemo extends Demo{constructor(){super();live=this;}}
const doc={hidden:false,getElementById:id=>{assert(nodes[id],id);return nodes[id];},querySelectorAll:()=>[],addEventListener(name,fn){if(name==='visibilitychange')visibleHandler=fn;}};
vm.runInNewContext(fs.readFileSync(path.join(root,'pid-demo.js'),'utf8'),{PIDDemo:ObservedDemo,document:doc,requestAnimationFrame:f=>raf=f});
let clock=0;const tick=n=>{for(let i=0;i<n;i++){clock+=100;raf(clock);}};
nodes.gains.onsubmit({preventDefault(){}});tick(100);
assert(parseFloat(nodes.time.textContent)>30);assert(nodes.levelPlot.innerHTML.includes('<svg'));
nodes.kp.value='150';nodes.kp.oninput();assert(nodes.draft.textContent.includes('Unapplied'));
nodes.gains.onsubmit({preventDefault(){}});assert(nodes.active.textContent.includes('Kp 150'));assert(nodes.draft.textContent.includes('match'));
nodes.restart.onclick();assert.equal(nodes.time.textContent,'0.0 s');
nodes.supply.value='.65';nodes.supply.onchange();tick(400);
assert(parseFloat(nodes.time.textContent)>150,'Must keep running past 120 s');
assert.equal(nodes.runState.textContent,'RUNNING');
assert(nodes.windowInfo.textContent.includes('120 s sliding'));
nodes.zoomIn.onclick();assert.equal(nodes.window.value,'60');nodes.zoomIn.onclick();assert.equal(nodes.window.value,'30');assert(nodes.zoomIn.disabled);
nodes.zoomOut.onclick();assert.equal(nodes.window.value,'60');
nodes.window.value='300';nodes.window.onchange();assert(nodes.zoomOut.disabled);
nodes.levelScale.value='auto';nodes.levelScale.onchange();assert(nodes.windowInfo.textContent.includes('fits visible'));assert(!nodes.levelPlot.innerHTML.includes('NaN'));
nodes.plotSize.value='300';nodes.plotSize.onchange();assert(nodes.levelPlot.innerHTML.includes('790 340'));
nodes.pause.onclick();const stopped=nodes.time.textContent;tick(20);assert.equal(nodes.time.textContent,stopped);
nodes.resetDemo.onclick();assert.equal(nodes.time.textContent,'0.0 s');assert.equal(nodes.kp.value,'100');assert.equal(nodes.ki.value,'0');assert.equal(nodes.kd.value,'0');assert.equal(nodes.bias.value,'0');assert.equal(nodes.supply.value,'1');assert.equal(nodes.window.value,'120');assert.equal(nodes.levelScale.value,'full');assert.equal(nodes.plotSize.value,'175');assert.equal(nodes.runState.textContent,'PAUSED');tick(20);assert.equal(nodes.time.textContent,'0.0 s');
nodes.kp.value='';nodes.gains.onsubmit({preventDefault(){}});assert(nodes.status.textContent.includes('Enter all'));assert.equal(live.gains.kp,100);nodes.kp.value='100';
nodes.pause.onclick();tick(5);doc.hidden=true;visibleHandler();const hiddenTime=nodes.time.textContent;tick(10);assert.equal(nodes.time.textContent,hiddenTime);assert.equal(nodes.runState.textContent,'PAUSED');doc.hidden=false;
live.plc.h=1.7;nodes.pause.onclick();tick(4);assert.equal(nodes.runState.textContent,'TRIPPED');assert.equal(live.plc.command,0);
nodes.gains.onsubmit({preventDefault(){}});assert(nodes.status.textContent.includes('Trip remains latched'));
nodes.restart.onclick();assert.equal(nodes.runState.textContent,'RUNNING');assert.equal(live.plc.h,.8);
for(let i=0;i<12000;i++)d.step();assert(d.rows.length<=3001);assert(d.plc.samples.length<=6000);assert(Number.isFinite(d.iae));
d.reset();assert.deepEqual(d.gains,{kp:100,ki:0,kd:0,bias:0});assert.equal(d.rows.length,1);assert.equal(d.iae,0);
console.log('PASS: continuous playback, bounded history, sliding-window zoom, auto-fit, plot size, reset/restart, draft gains, pause/visibility/trip, numerical references and isolation.');
