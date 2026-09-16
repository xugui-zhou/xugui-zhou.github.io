'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {Tank}=require('../lab2/model.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const start=m=>{m.start=true;m.control();m.start=false;m.control();};
let m=new Tank();m.h=.6;m.control();start(m);m.advance(10);near(m.h,.8);assert.equal(m.state,'AUTO');
m=new Tank();start(m);m.h=.8;m.control();assert.equal(m.u,100);m.h=1;m.control();assert.equal(m.u,100);m.h=1.2;m.control();assert.equal(m.u,0);m.h=1;m.control();assert.equal(m.u,0);
m=new Tank();m.h=.7;m.start=true;m.control();m.h=1.6;m.control();assert.equal(m.state,'TRIPPED');m.reset=true;m.control();assert.equal(m.state,'TRIPPED');m.h=.7;m.control();m.reset=true;m.control();assert.equal(m.state,'IDLE');m.advance(10);assert.equal(m.u,0);m.start=false;m.control();m.start=true;m.control();assert.equal(m.state,'AUTO');assert.equal(m.u,100);
for(const k of ['source','valid']){m=new Tank();start(m);m[k]=false;m.control();assert.equal(m.state,'TRIPPED');m[k]=true;m.control();assert.equal(m.state,'TRIPPED');}
m=new Tank();m.h=.6;start(m);m.blocked=true;m.advance(10);near(m.h,.4);assert.equal(m.u,100);near(m.snapshot().qin,0);
m=new Tank({low:.75,high:1.25,qout:.012});m.h=.65;start(m);m.advance(10);near(m.h,.81);
for(const [h,expected]of [[.74,100],[.75,100],[.76,0]]){m.h=1.3;m.control();m.h=h;m.control();assert.equal(m.u,expected);}
for(const [h,expected]of [[1.24,100],[1.25,0],[1.26,0]]){m.h=.7;m.control();m.h=h;m.control();assert.equal(m.u,expected);}
m=new Tank();m.start=true;m.stop=true;m.control();assert.equal(m.state,'IDLE');
m=new Tank({mode:'p'});m.h=.8;start(m);near(m.u,60);
m=new Tank({mode:'pi'});m.h=.8;start(m);near(m.J,0);m.control();near(m.J,0);m.tick();near(m.J,.04);
m=new Tank({mode:'pi',kp:200,ki:10});m.h=.1;start(m);m.tick();near(m.J,0);assert.equal(m.u,100);
m=new Tank();m.h=.7;start(m);assert.equal(m.demand,true);m.valid=false;m.control();assert.equal(m.demand,false);assert.equal(m.u,0);assert.equal(m.state,'TRIPPED');m.h=1;m.valid=true;m.control();assert.equal(m.demand,false);m.reset=true;m.control();start(m);assert.equal(m.u,0);
const root=path.resolve(__dirname,'../lab2');for(const name of ['model.js','evidence.js','support.js','app.js'])new vm.Script(fs.readFileSync(path.join(root,name),'utf8'),{filename:name});
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'support.js'),'utf8'),context);const support=context.Lab2Support;assert.equal(support.checkpoints.I1.length,7);assert.equal(support.missing('P2',[]).length,2);assert.equal(support.missing('P2',[{checkpoint:support.checkpoints.P2[0]}]).length,1);assert.equal(support.missing('P2',[{label:'old untyped capture'}]).length,2);assert.equal(support.missing('P2',support.checkpoints.P2.map(checkpoint=>({checkpoint}))).length,0);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<!--[\s\S]*?-->/g,'');for(const [,ref]of html.matchAll(/(?:src|href)="([^"<>]+)"/g))if(!/^(https?:|#)/.test(ref))assert.ok(fs.existsSync(path.join(root,ref)),ref);
console.log('PASS: dynamics, inclusive thresholds, memory, source/sensor trips, active-cause reset, held Start, Stop priority, blocked flow, changed case, P/PI timing, anti-windup, script syntax and local references.');
