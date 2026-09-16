'use strict';
(function(root){
function summarize(samples,snapshot){
 const a=samples||[];return {duration_s:snapshot.t,minimum_m:a.length?Math.min(...a.map(s=>s.level)):snapshot.level,maximum_m:a.length?Math.max(...a.map(s=>s.level)):snapshot.level,output_transitions:snapshot.switches,final_error_m:1-snapshot.level};
}
function review(task,key,config,snapshot,events,samples){
 const w=[],near=(a,b)=>Math.abs(a-b)<.00001,has=s=>events.some(e=>e.action.includes(s));
 const warn=(condition,message)=>{if(!condition)w.push(message);};
 if(task==='P1'||task==='I1'||task==='P2')warn(snapshot.state==='AUTO','Confirm AUTO before interpreting the control test.');
 if(key==='After 10 s filling'){warn(near(snapshot.t,10),'Capture at exactly 10 simulated seconds after loading the baseline.');warn(!snapshot.blocked&&snapshot.source&&snapshot.valid,'Use a healthy inlet and valid level for this baseline calculation.');warn(has('Start pressed'),'A Start action should precede the filling test.');}
 if(key==='Blocked inlet: command and flow'){warn(snapshot.blocked,'Inject the blocked-inlet fault for this checkpoint.');warn(snapshot.t>=20,'Advance another 10 s after the first filling observation.');}
 if(task==='P2'){warn(near(snapshot.level,1),'Set the final test level to 1.00 m.');const jumps=events.filter(e=>e.action.startsWith('Test fixture sets level'));const prior=jumps.at(-2)?.action||'';warn(prior.includes(key.includes('LOW')?'0.8 m':'1.2 m'),'Repeat the stated approach from the appropriate boundary before returning to 1.00 m.');}
 if(task==='I1'&&key!=='After 10 s filling'){
  const low=key.includes('LOW'),base=low?config.low:config.high,target=base+(key.includes('−')?-.01:key.includes('+')?.01:0);
  warn(near(snapshot.level,target),'The captured level does not match the selected boundary case.');
  const jumps=events.filter(e=>e.action.startsWith('Test fixture sets level'));warn((jumps.at(-2)?.action||'').includes(low?'1.3 m':'0.7 m'),'Initialize demand from the opposite side before EACH boundary case.');
 }
 if(task==='P3'){
  if(key==='Source-loss trip')warn(!snapshot.source,'Inject source loss before capturing.');
  if(key==='Cause clear before Reset')warn(snapshot.source&&!has('Reset pressed'),'Clear source loss and capture before Reset.');
  if(key==='After Reset')warn(has('Reset pressed'),'Perform Reset before capturing.');
  if(key==='After fresh Start')warn(events.filter(e=>e.action==='Start pressed').length>=2,'Capture after the new Start following Reset.');
 }
 if(task==='I2'){
  if(key.includes('Start held'))warn(snapshot.start,'Keep the Start checkbox selected.');
  if(key==='High-high with Start held')warn(snapshot.level>=config.hh,'Set the level to the high-high threshold.');
  if(key==='After Reset + 10 s with Start held'){warn(has('Reset pressed')&&snapshot.t>=10,'Perform Reset and advance 10 s before capturing.');warn(!has('Start released'),'Do not release Start before this held-Start checkpoint.');}
  if(key==='After release and fresh Start')warn(has('Start released')&&has('Start pressed'),'Release the held input, then make a fresh Start press.');
  if(key==='Reset with trip cause active')warn(snapshot.level>=config.hh&&events.at(-1)?.action==='Reset pressed','Recreate high-high, then press Reset while the cause remains active.');
 }
 if(task==='X1'||task==='I3'){
  warn(near(snapshot.t,120),'Use exactly 120 simulated seconds for comparable runs.');
  warn(!events.some(e=>e.t>0&&!e.action.includes(' → ')),'An operator or fixture change occurred after time zero. Reload and repeat an unchanged run.');
  warn(snapshot.valid&&snapshot.source&&!snapshot.blocked,'Use healthy process conditions for the comparison.');
 }
 if(task==='X1')warn(config.mode===(key==='P at 120 s'?'p':'pi'),'The selected checkpoint and active algorithm differ.');
 if(task==='I3')warn(near(config.qout,key.includes('0.014')?.014:.010),'Set the outlet flow specified by this checkpoint.');
 return w;
}
const api={summarize,review};if(typeof module!=='undefined')module.exports=api;else root.Lab2Evidence=api;
})(globalThis);
