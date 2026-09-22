'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {PLC,compile,evaluate,DEFAULT}=require('../lab3/engine.js');
assert.equal(compile(DEFAULT).mode,'PI');
for(const bad of [DEFAULT+'\nalert(1);',DEFAULT.replace('Kp := 50;','Kp := NaN;'),DEFAULT.replace('Ts := 0.1;','Ts := 0.3;'),DEFAULT.replace('Auto AND StopOK AND NOT Trip','Auto || StopOK'),DEFAULT.replace('MODE := PI;','MODE := SECRET;')])assert.throws(()=>compile(bad));
const p=compile(DEFAULT);assert.equal(evaluate(p.PumpEnable,{Auto:true,StopOK:true,Trip:false}),true);assert.equal(evaluate(p.PumpEnable,{Auto:true,StopOK:false,Trip:false}),false);
assert.throws(()=>new PLC().step(true),/RUN/);
let m=new PLC();m.download(DEFAULT);m.runCPU();assert.throws(()=>m.download(DEFAULT));m.start=true;m.step();assert.equal(m.state,'AUTO');assert.ok(Math.abs(m.command-60.04)<1e-8);assert.ok(m.q>0&&m.q<.020*m.command/100);m.stopOK=false;m.step();assert.equal(m.command,0);assert.equal(m.state,'IDLE');
m=new PLC();m.download(DEFAULT);m.runCPU();m.held=true;m.start=true;m.step();m.h=1.7;m.step();assert.equal(m.state,'TRIPPED');m.reset=true;m.step();assert.equal(m.state,'TRIPPED');m.h=.7;m.reset=true;m.step();assert.equal(m.state,'IDLE');m.step();assert.equal(m.command,0);m.start=false;m.held=false;m.step();m.start=true;m.step();assert.equal(m.state,'AUTO');m.valid=false;m.step();assert.equal(m.state,'TRIPPED');assert.equal(m.command,0);
m=new PLC();m.start=true;m.download(DEFAULT);m.runCPU();m.step();assert.equal(m.state,'IDLE','held Start on startup must not run');
for(const mode of ['P','PI','PID','CASCADE']){m=new PLC();m.download(DEFAULT.replace('MODE := PI;',`MODE := ${mode};`));m.runCPU();m.start=true;for(let i=0;i<1200;i++){if(i===600)m.supply=.65;m.step();assert.ok(Number.isFinite(m.h)&&Number.isFinite(m.command));assert.ok(m.command>=0&&m.command<=100);}assert.equal(m.snapshot().t,120);}
m=new PLC();m.download(DEFAULT.replace('Auto AND StopOK AND NOT Trip','Auto AND NOT StopOK AND NOT Trip'));m.runCPU();m.start=true;m.step();assert.equal(m.state,'AUTO');assert.equal(m.command,0);m.stopCPU();m.download(DEFAULT);m.runCPU();m.start=true;m.step();assert.ok(m.command>0);
const root=path.resolve(__dirname,'../lab3');for(const f of ['engine.js','studio.js'])new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
require('./lib/check-refs.cjs').checkReferences(fs.readFileSync(path.join(root,'index.html'),'utf8'),root);
console.log('PASS: restricted compiler, invalid syntax/parameters, Boolean expressions, STOP-only download, PI first update, actuator lag, Stop/trip/held-Start recovery, all four algorithms, repair regression, syntax and assets.');
