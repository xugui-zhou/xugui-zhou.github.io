'use strict';
(function(root){
const Ladder=typeof module!=='undefined'?require('./ladder.js'):root.LadderCore;
const VERSION='1.1.0',DEFAULT=`MODE := PI;
Kp := 50;
Ki := 2;
Kd := 0;
Tf := 0.2;
Ts := 0.1;
TripCause := HighHigh OR NOT LevelValid OR NOT SourceOK;
PumpEnable := Auto AND StopOK AND NOT Trip;`;
const tags=['HighHigh','LevelValid','SourceOK','Auto','StopOK','Trip'];
function expression(text){
 const tokens=text.match(/[A-Za-z_]+|[()]/g)||[];if(tokens.join('')!==text.replace(/\s/g,''))throw Error('Only Boolean tags, TRUE/FALSE, AND/OR/NOT and parentheses are supported.');if(tokens.length>100)throw Error('Expression is too long.');let i=0;
 function atom(){const t=tokens[i++];if(t==='NOT')return {op:'NOT',a:atom()};if(t==='('){const n=or();if(tokens[i++]!==')')throw Error('Missing closing parenthesis.');return n;}if(t==='TRUE'||t==='FALSE')return {value:t==='TRUE'};if(tags.includes(t))return {tag:t};throw Error('Unknown or missing Boolean tag: '+t);}
 function and(){let n=atom();while(tokens[i]==='AND'){i++;n={op:'AND',a:n,b:atom()};}return n;}function or(){let n=and();while(tokens[i]==='OR'){i++;n={op:'OR',a:n,b:and()};}return n;}const n=or();if(i!==tokens.length)throw Error('Unexpected token '+tokens[i]);return n;
}
function evaluate(n,t){if(n.tag)return !!t[n.tag];if('value'in n)return n.value;if(n.op==='NOT')return !evaluate(n.a,t);return n.op==='AND'?evaluate(n.a,t)&&evaluate(n.b,t):evaluate(n.a,t)||evaluate(n.b,t);}
function compile(source){
 if(typeof source==='string'&&source.trim().startsWith('{')){if(source.length>50000)throw Error('LAD project exceeds 50,000 characters.');return Ladder.compile(source);}
 if(typeof source!=='string'||source.length>8000)throw Error('Program must be text, at most 8,000 characters.');const lines=source.split('\n'),c={},seen=new Set();
 for(let j=0;j<lines.length;j++){const line=lines[j].replace(/\/\/.*$/,'').trim();if(!line)continue;const m=line.match(/^(MODE|Kp|Ki|Kd|Tf|Ts|TripCause|PumpEnable)\s*:=\s*(.+);$/);if(!m)throw Error('Line '+(j+1)+': expected one supported assignment ending in ;');const [_,k,v]=m;if(seen.has(k))throw Error('Duplicate assignment: '+k);seen.add(k);if(k==='MODE'){if(!['P','PI','PID','CASCADE'].includes(v))throw Error('MODE must be P, PI, PID or CASCADE.');c.mode=v;}else if(['TripCause','PumpEnable'].includes(k))c[k]=expression(v);else{const x=Number(v);const range={Kp:[0,200],Ki:[0,10],Kd:[0,100],Tf:[.05,5],Ts:[.02,.5]}[k];if(!Number.isFinite(x)||x<range[0]||x>range[1])throw Error(k+' must be '+range.join(' to '));c[k]=x;}}
 if(seen.size!==8)throw Error('All eight assignments are required.');if(![.02,.05,.1,.2,.5].includes(c.Ts))throw Error('Ts must be 0.02, 0.05, 0.1, 0.2 or 0.5 seconds.');return {...c,source};
}
const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
class PLC{
 constructor({bias=50}={}){if(!Number.isFinite(bias)||bias<0||bias>100)throw Error('Bias must be 0 to 100 percent.');this.bias=bias;this.program=compile(DEFAULT);this.revision=1;this.cpu='STOP';this.resetPlant();}
 resetPlant(){this.t=0;this.h=.8;this.q=0;this.qout=.01;this.supply=1;this.sp=1;this.source=true;this.valid=true;this.stopOK=true;this.start=false;this.held=false;this.previous=false;this.reset=false;this.state='IDLE';this.J=0;this.innerJ=0;this.filtered=0;this.previousPV=this.h;this.command=0;this.raw=0;this.target=0;this.samples=[];this.events=[];this.scan=null;this.cpu='STOP';this.ladMemory=Ladder.memory();}
 log(text){this.events.push({t:this.t,text});if(this.events.length>500)this.events.shift();}
 download(source){if(this.cpu!=='STOP')throw Error('Switch the CPU to STOP before download.');const p=compile(source);this.program=p;this.revision++;this.state='IDLE';this.previous=this.start;this.J=0;this.innerJ=0;this.filtered=0;this.previousPV=this.h;this.command=0;this.scan=null;this.ladMemory=Ladder.memory();this.log('Downloaded revision '+this.revision);}
 stopCPU(){this.cpu='STOP';this.command=0;this.state='IDLE';this.J=0;this.innerJ=0;this.previous=this.start;this.scan=null;this.ladMemory=Ladder.memory();this.log('CPU STOP');}
 runCPU(){this.cpu='RUN';this.previous=this.start;this.previousPV=this.h;this.log('CPU RUN; fresh Start required');}
 step(single=false){if(single&&this.cpu!=='RUN')throw Error('Select CPU RUN before a paused single scan.');const p=this.program,dt=p.Ts,inputs={HighHigh:this.h>=1.6,LevelValid:this.valid,SourceOK:this.source,StopOK:this.stopOK,Auto:this.state==='AUTO',Trip:this.state==='TRIPPED',Start:this.start,Reset:this.reset},edge=this.start&&!this.previous;this.previous=this.start;const before=this.state;
  if(this.cpu==='RUN'||single){const pre=p.ladder?Ladder.scanPhase(p.ladder,'before',inputs,this.ladMemory,dt):null,cause=pre?!!pre.tags.TripCause:evaluate(p.TripCause,inputs);if(cause)this.state='TRIPPED';else if(this.state==='TRIPPED'){if(this.reset)this.state='IDLE';}else if(!this.stopOK)this.state='IDLE';else if(this.state==='IDLE'&&edge)this.state='AUTO';
   const updated={...inputs,Auto:this.state==='AUTO',Trip:this.state==='TRIPPED'},post=p.ladder?Ladder.scanPhase(p.ladder,'after',updated,this.ladMemory,dt):null,permit=post?!!post.tags.PumpEnable:evaluate(p.PumpEnable,updated),e=this.sp-this.h;
   const deriv=-(this.h-this.previousPV)/dt;this.filtered=(p.Tf*this.filtered+dt*deriv)/(p.Tf+dt);this.previousPV=this.h;
   if(permit){const delta=p.mode==='P'?0:p.Ki*dt*e,d=p.mode==='PID'?p.Kd*this.filtered:0;let candidate=this.bias+p.Kp*e+this.J+delta+d;if(!((candidate>100&&delta>0)||(candidate<0&&delta<0)))this.J+=delta;this.raw=this.bias+p.Kp*e+this.J+d;this.target=clamp(this.raw);
    if(p.mode==='CASCADE'){const ef=this.target-this.q/.02*100,di=.8*dt*ef,u=this.target+ef+this.innerJ+di;if(!((u>100&&di>0)||(u<0&&di<0)))this.innerJ+=di;this.command=clamp(this.target+ef+this.innerJ);}else this.command=this.target;
   }else{this.command=0;this.raw=0;this.target=0;this.J=0;this.innerJ=0;}
   this.scan={time:this.t,inputLevel:this.h,inputs,stateBefore:before,stateAfter:this.state,tripCause:cause,permit,output:this.command,revision:this.revision,ladder:pre?[...pre.traces,...post.traces]:null,memory:JSON.parse(JSON.stringify(this.ladMemory))};
  }else this.command=0;
  if(before!==this.state)this.log(before+' → '+this.state);
  this.reset=false;if(!this.held)this.start=false;
  // Exact first-order actuator update, followed by a rectangular tank-volume update.
  const flowTarget=this.source ? 0.02*this.command/100*this.supply : 0;
  this.q=flowTarget+(this.q-flowTarget)*Math.exp(-dt/2);
  this.h=clamp(this.h+dt*(this.q-this.qout)/.5,0,2);this.t+=dt;
  const s=this.snapshot();this.samples.push(s);if(this.samples.length>6000)this.samples.shift();return s;
 }
 snapshot(){return {t:+this.t.toFixed(3),h:this.h,sp:this.sp,q:this.q,qout:this.qout,command:this.command,raw:this.raw,J:this.J,flowTarget:this.target*.0002,cascadeTarget:this.program.mode==='CASCADE'?this.target*.0002:null,cpu:this.cpu,state:this.state,revision:this.revision,supply:this.supply,valid:this.valid,source:this.source,held:this.held};}
}
const api={VERSION,DEFAULT,compile,evaluate,PLC};if(typeof module!=='undefined')module.exports=api;else root.Lab3=api;
})(globalThis);
