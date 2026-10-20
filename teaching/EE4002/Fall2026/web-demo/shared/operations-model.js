'use strict';
(function(root){
 const num=(v,d,lo,hi)=>Number.isFinite(+v)?Math.min(hi,Math.max(lo,+v)):d;
 function scada(input={}){
  const c={profile:['normal','stale','scale','chatter','sustained'].includes(input.profile)?input.profile:'normal',scale:num(input.scale,.001,.0001,.01),high:num(input.high,1.2,.5,1.8),deadband:num(input.deadband,.05,0,.3),delay:num(input.delay,2,0,10),ageLimit:num(input.ageLimit,3,1,10)};
  let active=false,acked=false,pending=null,lastTime=0,lastRaw=800,count=0;const samples=[],events=[];
  for(let t=0;t<=60;t++){
   const h=c.profile==='chatter'?1.2+(t%2?.02:-.02):c.profile==='sustained'?(t<10?.8:t<40?1.4:.9):.8+.005*t;
   if(!(c.profile==='stale'&&t>=20&&t<35)){lastTime=t;lastRaw=Math.round(h*1000);}
   const value=lastRaw*c.scale,age=t-lastTime,quality=age>c.ageLimit?'STALE':'GOOD';
   if(quality==='GOOD'){
    if(!active&&value>=c.high){if(pending===null)pending=t;if(t-pending>=c.delay){active=true;acked=false;count++;events.push({t,event:'HIGH active',value});}}
    else if(!active)pending=null;
    if(active&&value<=c.high-c.deadband){active=false;pending=null;events.push({t,event:'Returned to normal',value});}
   }else pending=null;
   if(t===25&&active){acked=true;events.push({t,event:'Operator acknowledged HIGH',value});}
   samples.push({t,h,value,raw:lastRaw,source:lastTime,age,quality,active,acked,state:active?(acked?'ACTIVE / acknowledged':'ACTIVE / unacknowledged'):(acked?'NORMAL / acknowledged':'NORMAL')});
  }
  return {kind:'scada',config:c,samples,events,metrics:{alarmActivations:count,firstAlarmSeconds:events.find(e=>e.event==='HIGH active')?.t??null,staleSeconds:samples.filter(s=>s.t<60&&s.quality==='STALE').length,maxDisplayErrorM:Math.max(...samples.map(s=>Math.abs(s.value-s.h)))},scope:'Scripted sensor profiles at 1 s intervals, not a hydraulic or vendor SCADA simulation. HMI = raw × scale. HIGH asserts after delay, clears at high − deadband. At t=25 s a scripted acknowledgement marks an active alarm. Stale data pauses new alarm evaluation and retains an existing active alarm. GOOD only describes modeled freshness.'};
 }
 const traffic=[{t:1,source:'HMI',operation:'read',tag:'LT101',value:null},{t:2,source:'Historian',operation:'read',tag:'LT101',value:null},{t:3,source:'Office',operation:'write',tag:'SP',value:1.6},{t:4,source:'HMI',operation:'write',tag:'SP',value:1.1},{t:5,source:'Engineering',operation:'write',tag:'SP',value:1.2},{t:6,source:'HMI',operation:'read',tag:'LT101',value:null}];
 function security(input={}){
  const c={policy:['open','readOnly','leastPrivilege','isolate'].includes(input.policy)?input.policy:'open',maintenance:!!input.maintenance,logging:input.logging!==false};let sp=1;const events=[];
  for(const p of traffic){const allow=c.policy==='open'||c.policy==='readOnly'&&p.operation==='read'||c.policy==='leastPrivilege'&&(p.operation==='read'&&['HMI','Historian'].includes(p.source)||p.operation==='write'&&p.source==='Engineering'&&c.maintenance);
   const before=sp;if(allow&&p.operation==='write')sp=p.value;
   events.push({...p,decision:allow?'ALLOW':'DENY',before,after:sp});
  }
  return {kind:'security',config:c,events,samples:events.map(e=>({t:e.t,value:e.after})),log:c.logging?events.map(e=>({...e})):[],metrics:{allowedReads:events.filter(e=>e.operation==='read'&&e.decision==='ALLOW').length,allowedWrites:events.filter(e=>e.operation==='write'&&e.decision==='ALLOW').length,finalSetpointM:sp,logRecords:c.logging?events.length:0},scope:'Six fictional messages through a semantic policy model. Source labels are assumed identities, not authenticated credentials. No real packets, firewall, exploit or network connection. LeastPrivilege permits HMI/Historian reads and Engineering writes during maintenance. Setpoint trace is not a simulated physical level.'};
 }
 function diagnose(input={}){
  const c={caseId:['A','B','C'].includes(input.caseId)?input.caseId:'A',repair:['none','scaling','link','permission'].includes(input.repair)?input.repair:'none'};
  const fault={A:'scaling',B:'link',C:'permission'}[c.caseId],fixed=c.repair===fault,remaining=fixed?'none':fault;
  const rows=[750,1000].map(raw=>({raw,referenceM:raw/1000,displayM:remaining==='scaling'?raw*.01:raw/1000,sourceTime:remaining==='link'?0:10,receiveTime:10,ageS:remaining==='link'?10:0,quality:remaining==='link'?'STALE':'GOOD'}));
  const permission=remaining!=='permission';
  const checks=[{requirement:'R1: two-point display error ≤ 0.01 m',pass:rows.every(r=>Math.abs(r.displayM-r.referenceM)<=.01)},{requirement:'R2: source age ≤ 2 s',pass:rows.every(r=>r.ageS<=2)},{requirement:'R3: healthy Start permits the pump',pass:permission},{requirement:'R4: pressed Stop blocks the pump',pass:true},{requirement:'R5: held Start does not restart after reset',pass:true}];
  return {kind:'diagnosis',config:c,rows,checks,events:[{t:0,event:'Fixture loaded',case:c.caseId},{t:10,event:'Read-only diagnostic observations',pumpEnabled:permission},{t:11,event:'Pressed Stop regression',pumpEnabled:false},{t:12,event:'Reset with Start held',pumpEnabled:false}],samples:[],metrics:{checksPassed:checks.filter(r=>r.pass).length,checksTotal:checks.length},scope:'Deterministic one-fault teaching fixtures. A proposed repair runs a fresh fixture with the same case. R4/R5 are fixed supervisor regression checks, not proofs of hardware safety. Case mappings are inspectable in source and are not secure assessment secrets. No physical plant is controlled.'};
 }
 const api={scada,security,diagnose};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OperationsModel=api;
})(typeof window==='undefined'?globalThis:window);
