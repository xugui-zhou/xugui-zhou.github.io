'use strict';
// Teaching model only. No PLC runtime, real I/O, or safety certification.
(function(root){
const DEFAULTS={area:0.5,qmax:0.02,qout:0.01,low:0.8,high:1.2,hh:1.6,Ts:0.1,mode:'onoff',sp:1,kp:50,ki:2,bias:50};
class Tank {
 constructor(config={}){this.c={...DEFAULTS,...config};this.t=0;this.h=1;this.state='IDLE';this.demand=false;this.start=false;this.previousStart=false;this.stop=false;this.reset=false;this.source=true;this.valid=true;this.blocked=false;this.J=0;this.u=0;this.raw=0;this.switches=0;this.events=[];this.samples=[];this.acc=0;this.control();}
 log(action){this.events.push({t:this.t,action});if(this.events.length>1000)this.events.shift();}
 control(integrate=false){
  const c=this.c,edge=this.start&&!this.previousStart,old=this.state,oldU=this.u;
  this.previousStart=this.start;
  this.cause=!this.valid?'Invalid level':!this.source?'Source lost':this.h>=c.hh?'High-high level':'';
  if(this.cause)this.state='TRIPPED';
  else if(this.state==='TRIPPED'){if(this.reset)this.state='IDLE';}
  else if(this.stop)this.state='IDLE';
  else if(this.state==='IDLE'&&edge)this.state='AUTO';
  if(!this.valid)this.demand=false;
  else if(this.h<=c.low)this.demand=true;else if(this.h>=c.high)this.demand=false;
  if(this.state!=='AUTO'){this.u=0;this.raw=0;this.J=0;}
  else if(c.mode==='onoff'){this.u=this.demand?100:0;this.raw=this.u;}
  else {
   const e=c.sp-this.h,delta=c.mode==='pi'&&integrate?c.ki*c.Ts*e:0,trial=this.J+delta;
   const candidate=c.bias+c.kp*e+trial;
   // Conditional integration: retain updates that unwind saturation.
   if(!((candidate>100&&delta>0)||(candidate<0&&delta<0)))this.J=trial;
   this.raw=c.bias+c.kp*e+this.J;this.u=Math.max(0,Math.min(100,this.raw));
  }
  this.reset=false;
  if(old!==this.state)this.log(old+' → '+this.state+(this.cause?' · '+this.cause:''));
  if((oldU>0)!==(this.u>0))this.switches++;
 }
 tick(){this.control(true);const c=this.c;const qin=this.blocked?0:c.qmax*this.u/100;const dh=c.Ts*(qin-c.qout)/c.area;this.h=Math.max(0,Math.min(2,this.h+dh));this.t+=c.Ts;this.samples.push(this.snapshot());if(this.samples.length>6000)this.samples.shift();}
 advance(seconds){this.acc+=seconds;while(this.acc+1e-9>=this.c.Ts){this.tick();this.acc-=this.c.Ts;}}
 snapshot(){return {t:+this.t.toFixed(3),level:this.h,state:this.state,demand:this.demand,command:this.u,raw:this.raw,integral:this.J,qin:this.blocked?0:this.c.qmax*this.u/100,qout:this.c.qout,source:this.source,valid:this.valid,blocked:this.blocked,start:this.start,cause:this.cause,switches:this.switches};}
}
const api={Tank,DEFAULTS,version:'1.3.0'};if(typeof module!=='undefined')module.exports=api;else root.Lab2=api;
})(globalThis);
