'use strict';
(function(root){
 const Engine=typeof module!=='undefined'?require('./engine.js'):root.Lab3;
 class PIDDemo{
  constructor(){this.gains={kp:100,ki:0,kd:0,bias:0};this.restart();}
  reset(){this.gains={kp:100,ki:0,kd:0,bias:0};this.restart();}
  source(g){return Engine.DEFAULT.replace('MODE := PI;','MODE := PID;').replace('Kp := 50;',`Kp := ${g.kp};`).replace('Ki := 2;',`Ki := ${g.ki};`).replace('Kd := 0;',`Kd := ${g.kd};`);}
  apply(g){g={...g,bias:g.bias??this.gains.bias};if(![0,50].includes(g.bias))throw Error('Bias must be 0 or 50 percent.');for(const [key,max] of Object.entries({kp:200,ki:10,kd:100}))if(typeof g[key]!=='number'||!Number.isFinite(g[key])||g[key]<0||g[key]>max)throw Error(`${key} must be between 0 and ${max}.`);const program=Engine.compile(this.source(g));this.gains={...g};this.plc.program=program;this.plc.bias=g.bias;this.mark('Gains applied');}
  restart(){this.plc=new Engine.PLC({bias:this.gains.bias});this.plc.download(this.source(this.gains));this.plc.runCPU();this.plc.start=true;this.rows=[this.plc.snapshot()];this.marks=[];this.peak=this.plc.h;this.iae=0;}
  mark(label){this.marks.push({t:this.plc.t,label});if(this.marks.length>100)this.marks.shift();}
  supply(value){if(![1,.65].includes(value))throw Error('Invalid supply setting.');this.plc.supply=value;this.mark(value===1?'Supply 100%':'Supply 65%');}
  step(){const s=this.plc.step();this.peak=Math.max(this.peak,s.h);this.iae+=.1*Math.abs(s.sp-s.h);this.rows.push(s);if(this.rows.length>3001)this.rows.shift();return s;}
 }
 if(typeof module!=='undefined')module.exports=PIDDemo;else root.PIDDemo=PIDDemo;
})(globalThis);
