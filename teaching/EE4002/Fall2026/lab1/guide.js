'use strict';
// Guided workflow and persistence. The animation always runs in a separate frame.
const isTour=new URLSearchParams(location.search).has('tour');
const storageKey='ee4002-lab1-workbench-v3';
const fields=['group','notes','assets','flows','en','gain','mux','rate','config','spi','level','pot','assumed','fault','dac','label'];
let activeTask='A',saveTimer=null,storageAvailable=true,resetting=false;
const taskData={
 A:{title:'A · One known input, end to end',goal:'Practice the complete measurement sequence at 1.00 m.',steps:['Prepare the 1.00 m input, then Read ID.','Copy fields to the write box, Write CONFIG and Read CONFIG.','Acquire three conversions and compare code, status and reconstructed level.','Explain the evidence and save P1-practice.'],pass:'One guided CH0 example, with accepted configuration, settled data and an explanation.',target:'registers'},
 B:{title:'B · Gain and validity',goal:'Show why gain ×2 fails for the 1.00 m input.',steps:['Prepare B. Predict whether 1.8 V × 2 fits the 3.3 V range.','Write CONFIG and Read CONFIG. Advance 1 conversion; inspect SETTLING.','Advance 3, read each. Inspect code 4095 and OVERRANGE.','Save checkpoint B-saturation. Explain why a number can still be unusable.'],pass:'One settled CH0 gain-2 saturation checkpoint with OVERRANGE.',target:'registers'},
 C:{title:'C · One DAC loopback',goal:'Distinguish a sent command, read-back and measured feedback.',steps:['Prepare C. Predict the voltage for DAC code 2048.','Write CONFIG and Read CONFIG. Open DAC output configuration.','Write DAC code 2048 and Read DAC registers. Advance 3, read each.','Save checkpoint C-loopback. State what shared-reference agreement cannot prove.'],pass:'One settled nominal CH2 checkpoint at code 2048.',target:'registers'},
 D:{title:'D · Lost write and recovery',goal:'Use read-back to detect a write that never took effect.',steps:['Prepare D. Write nominal 0x81, read back and acquire settled data.','Choose “Configuration writes disappear”. Select CH1, copy fields, write and read back.','Explain why TX can change while read-back stays 0x81. Record the event in Notes.','Select None. Write CH1 again, read back 0x85, acquire settled data and save D-recovery.'],pass:'A dropped-write event and a later settled CH1 recovery checkpoint.',target:'registers'},
 Submit:{title:'Submit · Minimum evidence',goal:'Export one JSON file. CSV and additional cases are optional.',steps:['Check the five saved checkpoints below. Labels should identify each test.','Complete two asset rows and one flow row with evidence references.','In Notes: record one calculation, saturation explanation, fault/recovery and limitation.','Export evidence JSON and open the downloaded file. Check group name and records.'],pass:'Five checkpoints, a diagnosis note, two assets and one flow.',target:'records'}
};
installLabAssignments(taskData);
const panel=document.createElement('section');panel.id='guided';panel.innerHTML=`<div class="section-title"><span>START</span><h2>60-minute core · 15-minute buffer</h2></div><p>First practice with guidance, then complete four changed assignments independently. References remain available. Advanced SPI waveforms, vendor firmware, PID tuning and network diagnosis are outside this lab.</p><div class="toolbar"><button id="watchTour" class="primary">Watch operation walkthrough</button><a href="student-guide.html" target="_blank">Student guide</a><span id="draftState" role="status">Local draft</span></div><div class="task-nav" role="group" aria-label="Lab tasks">${Object.keys(taskData).map(k=>`<button data-task="${k}" aria-pressed="${k==='A'}">${k==='Submit'?k:'Task '+k}</button>`).join('')}</div><h3 id="taskTitle"></h3><p id="taskGoal"></p><ol id="taskSteps"></ol><p id="taskPass"></p><div class="toolbar"><button id="prepare">Prepare A fields</button><button id="jumpTask">Go to controls</button><span id="prepared" role="status"></span></div>`;
document.querySelector('main').prepend(panel);
const ev=document.createElement('div');ev.id='checkpointReview';ev.innerHTML='<h3>Saved checkpoints</h3><p id="coreProgress" role="status"></p><div class="table-wrap"><table><thead><tr><th>Label</th><th>CH / gain</th><th>Code</th><th>Valid settling?</th></tr></thead><tbody id="savedRows"></tbody></table></div>';
$('records').append(ev);
const feedback=document.createElement('p');feedback.id='localFeedback';feedback.setAttribute('role','status');$('registers').append(feedback);
const measureFeedback=document.createElement('p');measureFeedback.id='measureFeedback';measureFeedback.setAttribute('role','status');$('measurement').querySelector('.toolbar').after(measureFeedback);
const actions=document.createElement('div');actions.className='toolbar';actions.innerHTML='<button id="newSession">Start new session…</button><span>Local drafts survive reload on this browser when storage is available. JSON export is your portable copy.</span>';$('records').append(actions);
function showTask(key){activeTask=key;const t=taskData[key];$('taskTitle').textContent=t.title;$('taskGoal').textContent=t.goal;$('taskSteps').replaceChildren(...t.steps.map(x=>{const li=document.createElement('li');li.textContent=x;return li;}));$('taskPass').textContent='Done when: '+t.pass;$('prepare').hidden=key==='Submit';$('prepare').textContent='Prepare '+key+' fields';document.querySelectorAll('[data-task]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.task===key)));}
function prepare(key){
 const values={A:{mux:0,gain:0},B:{mux:0,gain:1},C:{mux:2,gain:0},D:{mux:0,gain:0}}[key];
 if(!values)return;
 $('en').value='1';$('gain').value=String(values.gain);$('mux').value=String(values.mux);$('rate').value='1';$('spi').value='0';lab.spiMode=0;$('assumed').value='3.3';lab.assumedRef=3.3;$('level').value='1';lab.level=1;$('pot').value='1';lab.pot=1;$('fault').value='none';lab.setFault('none');$('dac').value='2048';$('config').value=hex(encoded());$('label').value={A:'P1 · practice 1.00 m',B:'B · saturation',C:'C · loopback',D:'D · recovery'}[key];
 if(key==='C')$('dacWrite').closest('details').open=true;
 $('prepared').textContent='Fields prepared. Now Write CONFIG and Read CONFIG. No register was written.';render();update();
}
function update(){
 const saved=lab.saved;
 const matches=[saved.some(s=>s.channel===0&&s.gain===1&&s.physical_level_m===1&&s.fault==='none'&&s.settled),saved.some(s=>s.channel===0&&s.gain===1&&s.physical_level_m===0&&s.fault==='none'&&s.settled),saved.some(s=>s.channel===0&&s.gain===2&&s.raw_code===4095&&s.settled&&(parseInt(s.status,16)&2)),saved.some(s=>s.channel===2&&s.gain===1&&s.raw_code===2048&&s.fault==='none'&&s.settled),saved.some(s=>s.channel===1&&s.fault==='none'&&s.settled&&lab.events.some(e=>e.type==='WRITE_DROPPED'&&e.sim_time_ms<=s.sim_time_ms))];
 $('coreProgress').textContent=matches.filter(Boolean).length+'/5 core evidence checks present. This checks records, not your explanation.';
 $('savedRows').replaceChildren(...saved.map(s=>row([s.label,s.channel+' / ×'+s.gain,s.raw_code,s.settled?'Settled':'Transient'])));
 $('localFeedback').textContent=$('message').textContent+' Latest register read: '+$('readback').textContent;
 $('measureFeedback').textContent=$('message').textContent;
 if(!isTour&&!resetting){clearTimeout(saveTimer);saveTimer=setTimeout(persist,120);}
 if(window.parent!==window)parent.postMessage({type:'ee4002-lab1-height',height:document.documentElement.scrollHeight},'*');
}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({schema:3,task:activeTask,model:lab,fields:Object.fromEntries(fields.map(id=>[id,$(id).value]))}));$('draftState').textContent='Draft saved on this browser';}catch(e){storageAvailable=false;$('draftState').textContent='Storage unavailable: export JSON before leaving';}}
function restore(){if(isTour)return;try{const st=JSON.parse(localStorage.getItem(storageKey)||'null');if(st?.schema===3&&Array.isArray(st.model?.samples)&&Array.isArray(st.model?.saved)&&Array.isArray(st.model?.events)){Object.assign(lab,st.model);for(const id of fields)if(typeof st.fields?.[id]==='string')$(id).value=st.fields[id];if(taskData[st.task])activeTask=st.task;$('message').textContent='Restored your local draft. Check settings before continuing.';}}catch(e){$('draftState').textContent='No restorable draft; export JSON to keep evidence.';}}
document.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{showTask(b.dataset.task);update();});$('prepare').onclick=()=>prepare(activeTask);$('jumpTask').onclick=()=>$(taskData[activeTask].target).scrollIntoView({behavior:'smooth',block:'start'});
$('newSession').onclick=()=>{if(!confirm('Start a new session? Export your current evidence first. This clears only this Lab 1 draft.'))return;resetting=true;clearTimeout(saveTimer);try{localStorage.removeItem(storageKey);}catch(e){}location.reload();};
// Observe after the existing event handlers have changed model and UI.
document.addEventListener('click',()=>queueMicrotask(update));document.addEventListener('input',()=>queueMicrotask(update));document.addEventListener('change',()=>queueMicrotask(update));
window.addEventListener('pagehide',()=>{if(!isTour&&storageAvailable&&!resetting)persist();});
const dialog=document.createElement('dialog');dialog.id='tourDialog';dialog.innerHTML='<div class="toolbar"><strong>Operation walkthrough · separate practice run</strong><button id="closeTour">Close and return to my experiment</button></div><iframe title="Animated Lab 1 operation walkthrough" id="tourFrame"></iframe>';document.body.append(dialog);
$('watchTour').onclick=()=>{$('tourFrame').src='tutorial.html';dialog.showModal();if(parent!==window)parent.postMessage({type:'ee4002-tour-open'},'*');};
function stopTour(){dialog.close();$('tourFrame').src='about:blank';$('watchTour').focus();if(parent!==window)parent.postMessage({type:'ee4002-tour-close'},'*');}
window.addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='ee4002-host-viewport'){const h=Number(e.data.height);if(Number.isFinite(h)&&h>100){document.documentElement.style.setProperty('--host-height',h+'px');dialog.classList.add('embedded-tour');}}});
$('closeTour').onclick=stopTour;dialog.addEventListener('cancel',e=>{e.preventDefault();stopTour();});
if(isTour){document.body.classList.add('tour-practice');panel.hidden=true;actions.hidden=true;dialog.remove();}
restore();showTask(activeTask);render();update();
new ResizeObserver(()=>{if(window.parent!==window)parent.postMessage({type:'ee4002-lab1-height',height:document.documentElement.scrollHeight},'*');}).observe(document.body);
// Only the walkthrough parent can control this isolated practice instance.
const tourSteps=[
 ()=>{prepare('A');return 'config';},
 ()=>{$('idRead').click();return 'readback';},
 ()=>{$('copy').click();return 'config';},
 ()=>{$('write').click();return 'write';},
 ()=>{$('configRead').click();return 'readback';},
 ()=>{$('three').click();return 'raw';},
 ()=>{$('notes').value='Example: Prepare only fills suggestions. Read CONFIG confirms acceptance. 1 m gives 12 mA and 1.8 V; the floored 12-bit code is 2234. The reconstructed level differs slightly because of quantization. In the student task, use Save explanation.';return 'notes';},
 ()=>{$('label').value='Walkthrough example (not student evidence)';$('save').click();return 'savedCount';}
];
window.addEventListener('message',event=>{
 if(!isTour||event.source!==parent||event.data?.type!=='ee4002-tour-step')return;
 const index=Number(event.data.index);if(!Number.isInteger(index)||index<0||index>=tourSteps.length)return;
 Object.assign(lab,new Workbench());$('notes').value='';$('group').value='Walkthrough practice';lab.samples=[];lab.saved=[];lab.events=[];lab.time=0;lab.reset();
 let id;for(let i=0;i<=index;i++)id=tourSteps[i]();render();update();
 document.querySelectorAll('.tour-focus').forEach(el=>el.classList.remove('tour-focus'));
 const target=$(id);target.classList.add('tour-focus');target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 parent.postMessage({type:'ee4002-tour-done',index},'*');
});
if(isTour)parent.postMessage({type:'ee4002-tour-ready'},'*');
