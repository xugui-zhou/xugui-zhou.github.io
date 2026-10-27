'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {response}=require('../lab6/ideal-model.js'),{control}=require('../shared/timing-model.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const [g,d,stable] of [[0,0,false],[2,0,false],[1.2,0,true],[1.2,1,false],[1,1,false],[.8,1,true],[.3,1,true]])assert.equal(response(g,d).stable,stable);
near(response(.3,1).values[7],-.0119);near(response(.3,1).radius,Math.sqrt(.3));near(response(.8,1).values[2],-.6);near(response(.8,0).values[2],.04);
assert(response(.3,1).poles.every(p=>p.im!==0));assert.throws(()=>response(NaN,1));
const hold=control({burst:true,delay:.2,limit:3}),stop=control({burst:true,delay:.2,limit:3,fallback:'stop'});
for(const r of [hold,stop]){near(r.recovery.burstEndAtS,48);near(r.recovery.firstPostBurstArrivalAtS,48.2);near(r.recovery.firstPostBurstSourceAtS,48);near(r.recovery.usablePostBurstAtS,48.2);assert(r.recovery.firstStaleDuringFaultAtS>42.8-1e-8);r.samples.forEach(s=>near(s.source+s.age,s.t));}
near(hold.recovery.processInBandBeforeLoadAtS,48);near(stop.recovery.processInBandBeforeLoadAtS,53.96);
assert.notEqual(stop.recovery.processInBandBeforeLoadAtS,stop.metrics.recoveryAfterLoadS);
assert.equal(control({burst:false}).recovery.burstEndAtS,null);
const slow=control({burst:true,delay:4,limit:.2});assert.equal(slow.recovery.usablePostBurstAtS,null);near(slow.recovery.firstPostBurstArrivalAtS,52);
const noRecovery=control({kp:0,ki:0,fallback:'stop',burst:true,delay:.2,limit:3});assert.equal(noRecovery.recovery.processInBandBeforeLoadAtS,null);
const held=hold.samples.filter(s=>s.t>=43.2&&s.t<=48);assert(held.every(s=>s.integral===held[0].integral&&s.u===held[0].u));
// Optional demo executes with actual HTML IDs and responds to every control.
const html=fs.readFileSync(path.join(__dirname,'../lab6/index.html'),'utf8'),els=new Map(),labels=[];
const ctx=new Proxy({fillText:t=>labels.push(t)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
for(const m of html.matchAll(/id="([^"]+)"/g))els.set(m[1],{value:'',checked:false,textContent:'',width:1000,height:330,getContext:()=>ctx});
const $=id=>{assert(els.has(id),id);return els.get(id)};$('idealGain').value='0.8';$('idealDelay').value='1';
const sandbox={document:{getElementById:$},Lab6Ideal:{response}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../lab6/ideal-demo.js'),'utf8'),sandbox);
$('idealGain').value='1.2';$('idealGain').onchange();assert($('idealResult').textContent.includes('Not asymptotically stable'));
$('idealDelay').value='0';$('idealDelay').onchange();assert($('idealResult').textContent.includes('Asymptotically stable'));
$('idealGain').value='0.3';$('idealDelay').value='1';$('idealZoom').checked=true;$('idealZoom').onchange();assert($('idealResult').textContent.includes('−0.0119'));assert($('idealResult').textContent.includes('clipped'));
$('idealReset').onclick();assert.equal($('idealGain').value,'0.8');assert.equal($('idealDelay').value,'1');assert.equal($('idealZoom').checked,false);assert(labels.includes('Level deviation x (m)'));
console.log('PASS: lecture recurrence, strict stability boundaries, micro-oscillation, demo controls, distinct burst/load recovery, source age and frozen integral.');
