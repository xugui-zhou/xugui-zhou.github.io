// Guided workflow and persistence. The animation always runs in a separate frame.
const isTour=new URLSearchParams(location.search).has('tour');
const storageKey=LabConfig.storageKey;
const fields=['group','notes','assets','flows','en','gain','mux','rate','config','spi','level','pot','assumed','fault','dac','label'];
let activeTask='A',saveTimer=null,storageAvailable=true,resetting=false;
const taskData=LabSteps.tasks;
const panel=document.createElement('section');panel.id='guided';panel.innerHTML=`<div class="section-title"><span>START</span><h2>60-minute core · 15-minute buffer</h2></div><p>First practice with guidance, then complete four changed assignments independently. References remain available. Advanced SPI waveforms, vendor firmware, PID tuning and network diagnosis are outside this lab.</p><div class="toolbar"><button id="watchTour" class="primary">Watch operation walkthrough</button><a id="deviceReference" href="reference.html" target="_blank" rel="noopener">Device reference ↗</a><a href="student-guide.html" target="_blank" rel="noopener">Student guide</a><span id="draftState" role="status">Local draft</span></div><p id="restoreNotice" role="status" hidden></p><div class="task-nav" role="group" aria-label="Lab tasks"></div><h3 id="taskTitle"></h3><p id="taskGoal"></p><ol id="taskSteps"></ol><p id="taskPass"></p><div class="toolbar"><span id="prepared" role="status" hidden></span></div>`;
document.querySelector('main').prepend(panel);
const ev=document.createElement('div');ev.id='checkpointReview';ev.innerHTML='<h3>Saved checkpoints</h3><p id="coreProgress" role="status"></p><div class="table-wrap"><table><thead><tr><th>Label</th><th>CH / gain</th><th>Code</th><th>Valid settling?</th></tr></thead><tbody id="savedRows"></tbody></table></div>';
$('records').append(ev);
const feedback=document.createElement('p');feedback.id='localFeedback';feedback.setAttribute('role','status');$('registers').append(feedback);
const measureFeedback=document.createElement('p');measureFeedback.id='measureFeedback';measureFeedback.setAttribute('role','status');$('measurement').querySelector('.toolbar').after(measureFeedback);
const actions=document.createElement('div');actions.className='toolbar';actions.innerHTML='<button id="newSession">Start new session…</button><span>Local drafts survive reload on this browser when storage is available. JSON export is your portable copy.</span>';$('records').append(actions);
function showTask(key){if(!taskData[key])return;activeTask=key;const t=taskData[key];$('taskTitle').textContent=t.title;$('taskGoal').textContent=t.goal;$('taskSteps').replaceChildren(...t.steps.map(x=>{const li=document.createElement('li');li.textContent=x;return li;}));$('taskPass').textContent=t.pass;emit('task',key);update();}
function prepare(key){
 const values=LabSteps.plans[key]?.prepare;
 if(!values)return;
 $('en').value='1';$('gain').value=String(values.gain);$('mux').value=String(values.mux);$('rate').value='1';$('spi').value='0';lab.spiMode=0;$('assumed').value='3.3';lab.assumedRef=3.3;$('level').value='1';lab.level=1;$('pot').value='1';lab.pot=1;$('fault').value='none';lab.setFault('none');$('dac').value='2048';$('config').value=hex(encoded());$('label').value=LabSteps.plans[key].label;
 if(key==='C')$('dacWrite').closest('details').open=true;
 $('prepared').textContent='Fields prepared. Now Write CONFIG and Read CONFIG. No register was written.';render();update();
}
function update(){render();if(!isTour&&!resetting){clearTimeout(saveTimer);saveTimer=setTimeout(persist,800);}}
let previousSaved=-1;
hooks.update.push(()=>{
 const count=LabSteps.taskKeys('independent').filter(k=>lab.saved.some(s=>s.learning_phase==='independent'&&s.assignment===k)).length;
 $('coreProgress').textContent=count+'/'+LabSteps.taskKeys('independent').length+' independent tasks have records. Presence is not correctness or a grade.';
 if(previousSaved!==lab.saved.length){$('savedRows').replaceChildren(...lab.saved.slice(-50).map(s=>row([s.label,s.channel+' / ×'+s.gain,s.raw_code,s.settled?'Settled':'Transient'])));previousSaved=lab.saved.length;}
 $('localFeedback').textContent=$('message').textContent+' Latest read: '+$('readback').textContent;
 $('measureFeedback').textContent=$('message').textContent;
});
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({schema:LabConfig.storageSchema,app_version:LabConfig.appVersion,task:activeTask,model:lab,fields:Object.fromEntries(fields.map(id=>[id,$(id).value]))}));$('draftState').textContent='Draft saved on this browser';}catch(e){storageAvailable=false;$('draftState').textContent='Storage unavailable: export JSON before leaving';}}
function restore(){if(isTour)return;try{const st=JSON.parse(localStorage.getItem(storageKey)||'null');if(st?.schema===LabConfig.storageSchema&&Array.isArray(st.model?.samples)&&Array.isArray(st.model?.saved)&&Array.isArray(st.model?.events)){Object.assign(lab,st.model);for(const [key,fallback]of Object.entries({level:1,pot:1,assumedRef:3.3,config:0,dac:0,code:0,time:0})){if(!Number.isFinite(lab[key]))lab[key]=Number.isFinite(Number(lab[key]))?Number(lab[key]):fallback;}const corrected=[];if(!['none','reference','drop','freeze','open'].includes(lab.fault)){lab.fault='none';corrected.push('fault → None / nominal');}if(![0,1].includes(lab.spiMode)){lab.spiMode=0;corrected.push('interface mode → 0');}if(corrected.length){$('restoreNotice').hidden=false;$('restoreNotice').textContent='Draft settings repaired: '+corrected.join('; ')+'. Existing records were preserved. Check settings and take a new measurement before continuing.';}for(const id of fields)if(typeof st.fields?.[id]==='string')$(id).value=st.fields[id];for(const [id,key]of Object.entries({level:'level',pot:'pot',assumed:'assumedRef',fault:'fault',spi:'spiMode'}))$(id).value=String(lab[key]);if(taskData[st.task])activeTask=st.task;$('message').textContent='Restored your local draft. Check settings before continuing.';}}catch(e){$('draftState').textContent='No restorable draft; export JSON to keep evidence.';}}
$('newSession').onclick=()=>{if(!confirm('Start a new session? Export your current evidence first. This clears only this Lab 1 draft.'))return;resetting=true;clearTimeout(saveTimer);try{localStorage.removeItem(storageKey);}catch(e){}location.reload();};
// Observe after the existing event handlers have changed model and UI.
document.addEventListener('input',e=>{if(['group','notes','assets','flows','label','config','predictionText','responseText'].includes(e.target.id))update();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!isTour&&!resetting)persist();});
window.addEventListener('pagehide',()=>{if(!isTour&&storageAvailable&&!resetting)persist();});
const dialog=document.createElement('dialog');dialog.id='tourDialog';dialog.innerHTML='<div class="toolbar"><strong>Operation walkthrough · separate practice run</strong><button id="closeTour">Close and return to my experiment</button></div><iframe title="Animated Lab 1 operation walkthrough" id="tourFrame"></iframe>';document.body.append(dialog);
$('watchTour').onclick=()=>{$('tourFrame').src='tutorial.html';dialog.showModal();if(parent!==window)parent.postMessage({type:'ee4002-tour-open'},'*');};
function stopTour(){dialog.close();$('tourFrame').src='about:blank';$('watchTour').focus();if(parent!==window)parent.postMessage({type:'ee4002-tour-close'},'*');}
window.addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='ee4002-host-viewport'){const h=Number(e.data.height);if(Number.isFinite(h)&&h>100){document.documentElement.style.setProperty('--host-height',h+'px');dialog.classList.add('embedded-tour');}}});
$('closeTour').onclick=stopTour;dialog.addEventListener('cancel',e=>{e.preventDefault();stopTour();});
if(isTour){document.body.classList.add('tour-practice');panel.hidden=true;actions.hidden=true;dialog.remove();}
restore();
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
