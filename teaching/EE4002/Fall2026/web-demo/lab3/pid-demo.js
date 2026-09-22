'use strict';
(()=>{
 const $=id=>document.getElementById(id),demo=new PIDDemo();
 const windows=[30,60,120,300];let playing=false,last=null,acc=0,lastRender=0;
 function status(t){$('status').textContent=t;}
 function range(){const span=Number($('window').value);return {span,start:Math.max(0,demo.plc.t-span),end:Math.max(span,demo.plc.t)};}
 function chart(field,color){
  const {start,end}=range(),rows=demo.rows.filter(r=>r.t>=start-1e-7);
  let low=0,high=field==='h'?2:100;
  if(field==='h'&&$('levelScale').value==='auto'){
   const values=rows.map(r=>r.h),min=Math.min(1,...values),max=Math.max(1,...values);
   low=Math.max(0,Math.floor((min-.05)*100)/100);high=Math.min(2,Math.ceil((max+.05)*100)/100);
  }
  const bottom=Number($('plotSize').value),x=t=>58+(t-start)/(end-start)*702,y=v=>bottom-(v-low)/(high-low)*(bottom-20);
  const title=field==='h'?'Water level (m)':'Pump command (%)';
  let svg='<svg viewBox="0 0 790 '+(bottom+40)+'" role="img" aria-label="'+title+' versus time in seconds"><title>'+title+'. Displayed range '+low.toFixed(2)+' to '+high.toFixed(2)+'.</title>';
  for(let n=0;n<=4;n++){const v=low+(high-low)*n/4;svg+='<path d="M58 '+y(v)+'H760" stroke="#dce5ed"/><text x="49" y="'+(y(v)+4)+'" text-anchor="end" font-size="12" fill="#526477">'+v.toFixed(field==='h'?2:0)+'</text>';}
  for(let n=0;n<=6;n++){const t=start+(end-start)*n/6;svg+='<text x="'+x(t)+'" y="'+(bottom+19)+'" text-anchor="middle" font-size="12" fill="#526477">'+t.toFixed(start===0?0:1)+'</text>';}
  if(field==='h')svg+='<path d="M58 '+y(1)+'H760" stroke="#795492" stroke-width="2" stroke-dasharray="6 4"/>';
  for(const m of demo.marks.filter(m=>m.t>=start&&m.t<=end))svg+='<path d="M'+x(m.t)+' 20V'+bottom+'" stroke="#b78432" stroke-dasharray="2 5"><title>'+m.label+' at '+m.t.toFixed(1)+' s</title></path>';
  svg+='<path d="'+rows.map((r,i)=>(i?'L':'M')+x(r.t).toFixed(2)+' '+y(r[field]).toFixed(2)).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2.5"/>';
  const latest=rows[rows.length-1];if(latest)svg+='<circle cx="'+x(latest.t)+'" cy="'+y(latest[field])+'" r="4" fill="'+color+'"/>';
  return svg+'<text x="760" y="'+(bottom+36)+'" text-anchor="end" font-size="12" fill="#526477">Time (s)</text></svg>';
 }
 function pending(){const dirty=['kp','ki','kd','bias'].some(k=>$(k).value.trim()===''||Number($(k).value)!==demo.gains[k]);$('draft').textContent=dirty?'Unapplied changes. Click Apply & run.':'Inputs match the applied gains.';}
 function render(){
  const p=demo.plc,{start,end,span}=range();
  $('water').style.height=p.h/2*100+'%';$('tankSetpoint').style.bottom=p.sp/2*100+'%';$('level').textContent=p.h.toFixed(3)+' m';$('time').textContent=p.t.toFixed(1)+' s';
  $('error').textContent=(p.sp-p.h).toFixed(3)+' m';$('command').textContent=p.command.toFixed(1)+'%';$('peak').textContent=Math.max(0,demo.peak-1).toFixed(3)+' m';$('iae').textContent=demo.iae.toFixed(2)+' m·s';
  $('flows').textContent='Inlet '+(p.q*1000).toFixed(2)+' L/s · Outlet 10.00 L/s';
  $('active').textContent='Applied: Kp '+demo.gains.kp+' · Ki '+demo.gains.ki+' · Kd '+demo.gains.kd+' · Bias '+demo.gains.bias+'%';
  $('pause').textContent=playing?'Pause':'Resume';$('runState').textContent=p.state==='TRIPPED'?'TRIPPED':playing?'RUNNING':'PAUSED';
  $('limitState').textContent=p.state==='TRIPPED'?'High-high trip: output blocked.':p.command>=99.99?'Upper output limit: 100%.':p.command<=.01&&p.t>0?'Lower output limit: 0%.':'Output within limits.';
  $('windowInfo').textContent='Time axis '+start.toFixed(1)+'–'+end.toFixed(1)+' s · '+span+' s sliding window · '+($('levelScale').value==='auto'?'level axis fits visible data':'fixed level axis 0–2 m');
  $('zoomIn').disabled=span===windows[0];$('zoomOut').disabled=span===windows[windows.length-1];
  $('levelPlot').innerHTML=chart('h','#2476b2');$('commandPlot').innerHTML=chart('command','#147a75');
  $('lastChange').textContent=demo.marks.length?'Last change: '+demo.marks[demo.marks.length-1].label+' at '+demo.marks[demo.marks.length-1].t.toFixed(1)+' s.':'No live changes yet.';pending();
 }
 function setPlaying(value){playing=value;acc=0;last=null;}
 $('gains').onsubmit=e=>{e.preventDefault();try{
  if(['kp','ki','kd'].some(k=>$(k).value.trim()===''))throw Error('Enter all three gains.');
  demo.apply({kp:$('kp').valueAsNumber,ki:$('ki').valueAsNumber,kd:$('kd').valueAsNumber,bias:Number($('bias').value)});
  setPlaying(demo.plc.state!=='TRIPPED');status(playing?'Applied. Running with the existing level and integral memory.':'Applied. Trip remains latched. Restart or Reset to begin again.');render();
 }catch(e){status(e.message);}};
 ['kp','ki','kd'].forEach(k=>$(k).oninput=pending);$('bias').onchange=pending;
 document.querySelectorAll('[data-gains]').forEach(b=>b.onclick=()=>{b.dataset.gains.split(',').forEach((v,i)=>$( ['kp','ki','kd','bias'][i]).value=v);status('Preset loaded into inputs. Click Apply & run.');pending();});
 $('restart').onclick=()=>{demo.restart();demo.supply(Number($('supply').value));setPlaying(true);status('Restarted with applied gains and selected supply. Level, time, memory and statistics cleared.');render();};
 $('resetDemo').onclick=()=>{demo.reset();for(const [id,value]of Object.entries({kp:'100',ki:'0',kd:'0',bias:'0',supply:'1',speed:'4',window:'120',levelScale:'full',plotSize:'175'}))$(id).value=value;setPlaying(false);status('Reset to defaults. Paused at 0 s. Click Apply & run when ready.');render();};
 $('pause').onclick=()=>{if(demo.plc.state==='TRIPPED'){status('Trip remains latched. Use Restart or Reset.');return;}setPlaying(!playing);status(playing?'Running continuously. The plots follow the latest data.':'Paused. Zoom the plots or edit the gains.');render();};
 $('supply').onchange=()=>{demo.supply(Number($('supply').value));status('Supply changed. Observe the level and pump response.');render();};
 ['window','levelScale','plotSize'].forEach(k=>$(k).onchange=render);
 function zoom(direction){const i=windows.indexOf(Number($('window').value));$('window').value=String(windows[Math.max(0,Math.min(windows.length-1,i+direction))]);render();}
 $('zoomIn').onclick=()=>zoom(-1);$('zoomOut').onclick=()=>zoom(1);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){setPlaying(false);status('Paused while this page is hidden.');render();}});
 function frame(now){const dt=last===null?0:Math.min((now-last)/1000,.1);last=now;
  if(playing){acc+=dt*Number($('speed').value);while(acc>=.1){acc-=.1;demo.step();if(demo.plc.state==='TRIPPED'){setPlaying(false);status('High-high trip. Pump stopped and simulation paused. Use Restart or Reset.');render();break;}}
   // Bound chart rendering independently of simulation and playback speed.
   if(now-lastRender>=100){render();lastRender=now;}
  }requestAnimationFrame(frame);
 }
 render();requestAnimationFrame(frame);
})();
