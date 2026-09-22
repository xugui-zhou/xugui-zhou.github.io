'use strict';
(function(root){
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 const finite=(x,d,a,b)=>Number.isFinite(+x)?clamp(+x,a,b):d;
 function network(input={}){
  const c={mode:input.mode==='can'?'can':'ethernet',rate:finite(input.rate,100,0.1,1000),bg:Math.round(finite(input.bg,8,0,30)),qos:!!input.qos,id:Math.round(finite(input.id,384,1,2047)),period:finite(input.period,10,2,50),base:finite(input.base,2,0,20),outage:finite(input.outage,0,0,50),deadline:finite(input.deadline,5,.1,50)};
  // CAN rate is kbit/s. Ethernet rate is Mbit/s. Frame lengths are explicit teaching assumptions.
  const bitsPerMs=c.mode==='can'?c.rate:c.rate*1000,frameBits=c.mode==='can'?130:12000,sensorBits=c.mode==='can'?130:1200;
  const jobs=[];let serial=0;
  for(let t=0;t<100;t+=c.period){
   for(let j=0;j<c.bg;j++)jobs.push({seq:serial++,source:t,kind:'background',id:512+j,bits:frameBits});
   jobs.push({seq:serial++,source:t,kind:'sensor',id:c.id,bits:sensorBits});
  }
  let time=0;const frames=[];
  while(jobs.length){
   const ready=jobs.filter(j=>j.source<=time+1e-8);if(!ready.length){time=Math.min(...jobs.map(j=>j.source));continue;}
   ready.sort((a,b)=>c.mode==='can'?(a.id-b.id||a.seq-b.seq):c.qos?((a.kind==='sensor'?0:1)-(b.kind==='sensor'?0:1)||a.seq-b.seq):a.seq-b.seq);
   const j=ready[0];jobs.splice(jobs.indexOf(j),1);const start=time,end=time+j.bits/bitsPerMs,arrival=end+c.base;
   const dropped=c.outage>0&&arrival>=40&&arrival<40+c.outage;
   frames.push({...j,start,end,arrival,delay:arrival-j.source,dropped});time=end;
  }
  const sensors=frames.filter(f=>f.kind==='sensor'),delivered=sensors.filter(f=>!f.dropped).sort((a,b)=>a.arrival-b.arrival),end=Math.max(120,time+c.base+1);
  let src=null,n=0;const samples=[];
  for(let i=0;i<=400;i++){const t=end*i/400;while(n<delivered.length&&delivered[n].arrival<=t){src=delivered[n++].source;}samples.push({t,age:src===null?null:t-src});}
  const delays=delivered.map(f=>f.delay),ages=samples.map(s=>s.age).filter(v=>v!==null),fresh=c.outage?delivered.find(f=>f.source>=40+c.outage):null;
  return {kind:'network',config:c,frames,samples,metrics:{delivered:delivered.length,lost:sensors.length-delivered.length,deadlineMisses:sensors.filter(f=>f.dropped||f.delay>c.deadline).length,maxDeliveryMs:Math.max(0,...delays),maxAgeMs:Math.max(0,...ages),linkRestoredMs:c.outage?40+c.outage:null,freshSourceReceivedMs:fresh?.arrival??null},scope:'Ideal non-preemptive single shared CAN bus or single Ethernet output queue. Assumed on-wire lengths. No electrical layer, stuffing, CRC, TCP or MRP implementation. Outage drops arrivals in [40,40+duration) ms. Observations run beyond final acquisition to show held-value age.'};
 }
 function control(input={}){
  const c={kp:finite(input.kp,4,0,10),ki:finite(input.ki,.12,0,1),delay:finite(input.delay,0,0,10),jitter:finite(input.jitter,0,0,3),loss:finite(input.loss,0,0,.5),burst:!!input.burst,ts:[.1,.2,.5,1].includes(+input.ts)?+input.ts:.2,limit:finite(input.limit,3,.2,30),fallback:['hold','stop','local'].includes(input.fallback)?input.fallback:'hold',seed:Math.round(finite(input.seed,42,1,99999))};
  let seed=c.seed;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const dt=.02,ticks=Math.round(c.ts/dt),pending=[],samples=[];let h=.6,u=.5,pv=.6,src=0,integral=0,iae=0,peak=0,staleSeconds=0,saturatedSeconds=0,maxAge=0,losses=0,rejected=0;
  for(let k=0;k<=6000;k++){
   const t=k*dt;
   if(k%ticks===0){const lost=(c.burst&&t>=40&&t<48)||random()<c.loss;if(lost)losses++;else pending.push({source:t,value:h,arrival:t+Math.max(0,c.delay+(2*random()-1)*c.jitter)});}
   pending.sort((a,b)=>a.arrival-b.arrival);
   while(pending.length&&pending[0].arrival<=t+1e-8){const p=pending.shift();if(p.source>=src){src=p.source;pv=p.value;}else rejected++;}
   const age=t-src,stale=age>c.limit;
   if(k%ticks===0){
    if(stale&&c.fallback==='stop')u=0;
    else if(!(stale&&c.fallback==='hold')){
     const measured=stale&&c.fallback==='local'?h:pv,e=1-measured,proposal=integral+c.ki*c.ts*e,raw=.5+c.kp*e+proposal;
     // Conditional integration: reject increments that drive farther into saturation.
     if(!((raw>1&&e>0)||(raw<0&&e<0)))integral=proposal;
     u=clamp(.5+c.kp*e+integral,0,1);
    }
   }
   if(k<6000){iae+=Math.abs(1-h)*dt;if(stale)staleSeconds+=dt;if(u<=0||u>=1)saturatedSeconds+=dt;}
   maxAge=Math.max(maxAge,age);peak=Math.max(peak,h);
   if(k%5===0)samples.push({t,h,u,age,pv,stale});
   if(k<6000)h=Math.max(0,h+dt*(.04*u-.02*h-(t>=60?.008:0)));
  }
  // Recovery after the common outlet-load step at 60 s, sustained through the observation end.
  let lastOutside=-1;for(let i=0;i<samples.length;i++)if(samples[i].t>=60&&Math.abs(samples[i].h-1)>.02)lastOutside=i;
  const recovery=lastOutside===samples.length-1?null:lastOutside<0?0:samples[lastOutside+1].t-60;
  return {kind:'control',config:c,samples,metrics:{peakLevelM:peak,iaeMS:iae,finalErrorM:1-h,maxAgeS:maxAge,staleSeconds,saturatedSeconds,losses,rejectedOldPackets:rejected,recoveryAfterLoadS:recovery},scope:'Euler step 0.02 s. A=1 m², inlet=0.04u m³/s, outlet=0.02h m³/s plus 0.008 m³/s after 60 s. SP=1 m. Bias=0.5 balances nominal outlet at SP. Initial h=PV=0.6 m at t=0. P/PI output 0–1, conditional anti-windup. Receiver rejects older source timestamps. Local fallback assumes an additional available local sensor/control path. No actual network or PLC hardware.'};
 }
 const api={network,control};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.TimingModel=api;
})(typeof window==='undefined'?globalThis:window);
