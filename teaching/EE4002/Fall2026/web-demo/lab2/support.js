'use strict';
// Explicit checkpoint expectations, shared by the UI and both export formats.
globalThis.Lab2Support={
 checkpoints:{
  P1:['After 10 s filling','Blocked inlet: command and flow'],
  P2:['1.00 m approached from LOW','1.00 m approached from HIGH'],
  P3:['Source-loss trip','Cause clear before Reset','After Reset','After fresh Start'],
  I1:['After 10 s filling','LOW − 0.01 m','Exactly LOW','LOW + 0.01 m','HIGH − 0.01 m','Exactly HIGH','HIGH + 0.01 m'],
  I2:['High-high with Start held','After Reset + 10 s with Start held','After release and fresh Start','Reset with trip cause active'],
  I3:['Candidate A · 0.010','Candidate A · 0.014','Candidate B · 0.010','Candidate B · 0.014'],
  X1:['P at 120 s','PI at 120 s','Changed Ki at 120 s']
 },
 missing(id,records){return this.checkpoints[id].filter(k=>!records.some(r=>r.checkpoint===k));},
 setup(){
  const capture=document.getElementById('capture'),label=document.createElement('label');
  label.textContent='Checkpoint to capture';const select=document.createElement('select');select.id='checkpoint';label.append(select);capture.before(label);
  const list=document.createElement('ul');list.id='checkpoints';capture.after(list);
  const extra=document.createElement('section');extra.className='card';extra.id='extra';extra.innerHTML='<h2>Optional observation aids</h2><details id="noiseDemo"><summary>2-minute demonstration: why hysteresis reduces switching</summary><p>This separate demonstration replays measured values 0.99 / 1.01 m. It does not move the tank or enter your evidence. Both outputs start OFF.</p><button id="noiseStep">Next measurement</button> <button id="noiseReset">Restart demonstration</button><p id="noiseResult" role="status"></p><p>Single threshold: ON below 1.00 m. Hysteresis: LOW 0.95 m, HIGH 1.05 m, retain output inside the band. Discuss: what would change if the previous demand were ON? What is the cost of a wider band?</p></details><div id="piCharts" hidden><h3>Optional P/PI: SP, level and applied command</h3><canvas id="piTrend" width="900" height="360" aria-label="Setpoint and level trend above applied command trend"></canvas><p id="piNumbers"></p><p>Blue = PV, dashed purple = SP. Lower plot: applied command (0–100%). Raw command and integral are shown numerically. Compare captures at the same elapsed time; peaks are measured only over the recorded interval.</p><div id="piCompare"></div></div>';
  document.querySelector('.workspace').after(extra);
  const comparison=document.createElement('div');comparison.id='comparison';document.getElementById('records').before(comparison);
  const boundary=document.createElement('div');boundary.id='boundary';boundary.innerHTML='<h3>I1 boundary test plan</h3><p>Keep AUTO active and playback paused. Initialize again before EVERY row. Predict the command yourself before setting the final level.</p><table><thead><tr><th>Case</th><th>Initialize at</th><th>Then test at</th></tr></thead><tbody><tr><td>LOW − 0.01</td><td>1.30 m</td><td>0.74 m</td></tr><tr><td>Exactly LOW</td><td>1.30 m</td><td>0.75 m</td></tr><tr><td>LOW + 0.01</td><td>1.30 m</td><td>0.76 m</td></tr><tr><td>HIGH − 0.01</td><td>0.70 m</td><td>1.24 m</td></tr><tr><td>Exactly HIGH</td><td>0.70 m</td><td>1.25 m</td></tr><tr><td>HIGH + 0.01</td><td>0.70 m</td><td>1.26 m</td></tr></tbody></table>';
  document.getElementById('tip').after(boundary);
  let n=0,old=false,switches=0;const paint=()=>{document.getElementById('noiseResult').textContent=n?'Reading '+n+': '+(n%2?'.99':'1.01')+' m · single-threshold '+(old?'ON':'OFF')+' ('+switches+' transitions) · hysteresis OFF (0 transitions)':'Ready. Both outputs OFF; transition counts include the first change from this initial condition.';};
  document.getElementById('noiseStep').onclick=()=>{n++;const next=n%2===1;if(next!==old)switches++;old=next;paint();};document.getElementById('noiseReset').onclick=()=>{n=0;old=false;switches=0;paint();};paint();
 },
 select(id){document.getElementById('boundary').hidden=id!=='I1';const s=document.getElementById('checkpoint');s.replaceChildren(...this.checkpoints[id].map(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;return o;}));document.getElementById('piCharts').hidden=id!=='X1';document.getElementById('noiseDemo').hidden=id!=='P2';document.getElementById('extra').hidden=!['P2','X1'].includes(id);},
 progress(id,records){
  const host=document.getElementById('comparison');host.replaceChildren();
  if(['P2','I3'].includes(id)){
   const heading=document.createElement('h3');heading.textContent=id==='P2'?'Compare the two histories':'Compare candidate runs';host.append(heading);
   const table=document.createElement('table'),head=document.createElement('tr');for(const text of ['Capture','LOW / HIGH','Outlet','Level / observed range','Command / transitions']){const cell=document.createElement('th');cell.textContent=text;head.append(cell);}table.append(head);
   for(const r of records){const s=r.snapshot,c=r.config,a=r.summary,row=document.createElement('tr');for(const value of [r.label,c.low+' / '+c.high+' m',c.qout+' m³/s',id==='P2'?s.level.toFixed(3)+' m':a?a.minimum_m.toFixed(3)+'–'+a.maximum_m.toFixed(3)+' m':'Legacy: no summary',id==='P2'?s.command+'%':s.switches+' transitions / '+s.t+' s']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}table.append(row);}host.append(table);
   if(id==='I3'){const note=document.createElement('p');note.textContent='Use identical LOW/HIGH for both flows of each candidate. All four runs need the same initial conditions and 120 s duration. Counts and ranges describe this finite window, not a universal optimum.';host.append(note);}
  }
  for(const r of records){if(r.conditionWarnings?.length){const p=document.createElement('p');p.className='tip';p.textContent=r.label+': '+r.conditionWarnings.join(' ');host.append(p);}}
const missing=this.missing(id,records),list=document.getElementById('checkpoints');list.replaceChildren(...this.checkpoints[id].map(k=>{const li=document.createElement('li');li.textContent=(missing.includes(k)?'Not captured: ':'Captured: ')+k;return li;}));
  const s=document.getElementById('checkpoint');if(!missing.includes(s.value)&&missing.length)s.value=missing[0];
  if(id==='X1'){const host=document.getElementById('piCompare');host.replaceChildren();for(const r of records){const p=document.createElement('p'),a=r.samples||[],peak=a.length?Math.max(...a.map(x=>x.level)):r.snapshot.level;p.textContent=r.label+' — t='+r.snapshot.t+' s; Kp='+r.config.kp+', Ki='+r.config.ki+'; final error='+(r.config.sp-r.snapshot.level).toFixed(3)+' m; peak level='+peak.toFixed(3)+' m; final command='+r.snapshot.command.toFixed(1)+'%. Observed interval only.';host.append(p);}}
 },
 draw(model){if(document.getElementById('piCharts').hidden)return;const c=document.getElementById('piTrend').getContext('2d'),start=Math.max(0,model.t-120),end=Math.max(120,model.t),x=t=>65+(t-start)/(end-start)*800;c.clearRect(0,0,900,360);c.font='18px system-ui';c.fillStyle='#183643';c.fillText('Level (m): 0–2',65,22);c.fillText('Command (%): 0–100',65,202);c.fillText(start.toFixed(0)+' s',65,353);c.fillText(end.toFixed(0)+' s',790,353);c.strokeStyle='#ccd9df';for(const y of [40,160,220,330]){c.beginPath();c.moveTo(65,y);c.lineTo(865,y);c.stroke();}c.setLineDash([8,6]);c.strokeStyle='#864fa3';c.beginPath();c.moveTo(65,160-model.c.sp*60);c.lineTo(865,160-model.c.sp*60);c.stroke();c.setLineDash([]);for(const [key,color,y]of [['level','#1677b8',v=>160-v*60],['command','#17736c',v=>330-v*1.1]]){c.strokeStyle=color;c.lineWidth=2;c.beginPath();let first=true;for(const s of model.samples){if(s.t<start)continue;first?c.moveTo(x(s.t),y(s[key])):c.lineTo(x(s.t),y(s[key]));first=false;}c.stroke();}document.getElementById('piNumbers').textContent='SP '+model.c.sp.toFixed(2)+' m · PV '+model.h.toFixed(3)+' m · raw command '+model.raw.toFixed(1)+'% · applied '+model.u.toFixed(1)+'% · integral J '+model.J.toFixed(2)+' percentage points';}
};
