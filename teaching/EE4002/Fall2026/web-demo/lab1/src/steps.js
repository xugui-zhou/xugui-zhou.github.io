if(!isTour){
 document.body.classList.add('step-workflow');
 const main=document.querySelector('main'), plans=LabSteps.plans;
 // Evidence remains intact when upgrading an older local draft.
 if(lab.workflow?.version!==LabConfig.workflowSchema)lab.workflow={version:LabConfig.workflowSchema,seq:0,actions:[],tasks:{}};
 lab.responses=lab.responses||[];
 const state=lab.workflow;
 const toolbar=$('group').closest('.toolbar');toolbar.id='sessionTools';
 const downloadNote=document.createElement('p');downloadNote.className='notice';downloadNote.textContent='Download report (HTML) for reading and Download evidence (JSON) for the original records. Open the HTML report; use Print → Save as PDF if preferred. Upload the report (HTML or PDF) and JSON to Moodle yourself. Nothing is submitted by this page. Download both again after making changes.';toolbar.prepend(downloadNote);
 const taskOverview=document.createElement('details');taskOverview.id='taskOverview';taskOverview.innerHTML='<summary>Learning goal and task overview</summary>';
 for(const id of ['taskGoal','taskSteps','taskPass'])taskOverview.append($(id));
 $('taskTitle').after(taskOverview);
 $('guided').querySelector('.section-title').hidden=true;
 $('guided').querySelector('.section-title').nextElementSibling.hidden=true;
 
 const coach=document.createElement('section');coach.id='stepCoach';coach.innerHTML='<div class="step-heading"><span id="stepNumber"></span><h2 id="stepName" tabindex="-1"></h2></div><p id="stepDo"></p><p class="step-observe"><strong>LOOK HERE</strong><br><span id="stepLook"></span></p><details><summary>Why this step matters</summary><p id="stepWhy"></p></details><button id="stepPrepare" class="primary" hidden>Prepare fields for this practice</button><p id="stepPrepared" role="status"></p>';
 const workspace=document.createElement('div');workspace.id='stepWorkspace';
 const bottom=document.createElement('section');bottom.id='stepNavigation';bottom.innerHTML='<p id="stepFeedback" role="status" aria-live="polite"></p><div class="toolbar"><button id="previousStep">← Previous step</button><button id="continueStep" class="primary">Next step →</button></div><p class="small">Step checks verify procedure, not the correctness of your explanation or an assignment grade. References and earlier tasks remain available.</p>';
 $('guided').after(coach,workspace,bottom);
 const discussion=document.createElement('section');discussion.id='pairDiscussion';coach.before(discussion);
 const responsePanel=document.createElement('section');responsePanel.id='stepResponse';responsePanel.innerHTML='<h2>Your explanation</h2><p id="responsePrompt"></p><pre id="responseEvidence"></pre><label>Reasoning and evidence<textarea id="responseText" rows="4" placeholder="Use values, units and your reasoning. Do not only write “it worked”."></textarea></label><button id="saveResponse">Save explanation</button><p id="responseSaved" role="status"></p>';
 main.append(responsePanel);
 const stageIds=['bench','registers','measurement','records','predictionBox','stepResponse'];
 const homes=new Map(stageIds.map(id=>{const node=$(id),anchor=document.createComment('home '+id);node.before(anchor);return[id,anchor];}));
 const learning=document.createElement('details');learning.id='learningMap';learning.innerHTML='<summary>What you should be able to explain after Lab 1</summary><ol><li>Trace a physical input through a sensor, shunt, converter and software tag; locate the controller and actuator in the wider loop.</li><li>Calculate level → mA → V → ADC code, including units and quantization.</li><li>Distinguish proposed fields, a sent write, accepted configuration and measured feedback.</li><li>Recognize settling and saturation; justify a usable gain.</li><li>Use a baseline, failed read-back and corrected measurement to document recovery.</li></ol><p>This simulator does not establish competence in wiring real hardware, SPI waveforms, vendor drivers, PID tuning or network diagnosis.</p>';
 $('guided').append(learning);
 // The optional visualization is observation only; there is one set of student controls.
 $('extraVisual').querySelector('summary').textContent='Optional observation: linked tank, current, ADC bits and history (no controls)';
 $('tankTouch').onpointerdown=null;$('tankTouch').onpointerup=null;$('tankTouch').onpointercancel=null;
 $('liveBench').classList.add('read-only-visual');
 $('liveBench').querySelector('.tank-panel p').textContent='Known input and last CH0 estimate. Change inputs only in the current task step.';
 $('liveBench').querySelector('.signal-panel>.visual-small').textContent='Samples advance only when you use the task’s conversion button. The chart shows simulated samples, not a physical waveform.';
 $('copy').textContent='① Copy encoder to write box';$('write').textContent='② Write CONFIG';$('configRead').textContent='③ Read CONFIG';
 $('recordPrediction').textContent='Record prediction';
 $('watchTour').textContent='Optional: button demonstration';
 $('notes').closest('label').firstChild.textContent='Final discussion and simulation limitation (task explanations are saved separately)';
 $('notes').placeholder='State your discussion conclusion and one limitation. Saved task explanations are included automatically; no need to copy them here.';
 $('taskTitle').textContent=taskData[activeTask].title;
 function logAction(id){
  const lastEvents=lab.events.slice(-4);
  state.actions.push({seq:++state.seq,id,task:activeTask,step:position(),request:Number($('config').value),config:lab.config,dac:lab.dac,readback:$('readback').textContent,dropped:lastEvents.some(e=>e.type==='WRITE_DROPPED'),sample_count:lab.samples.length});
 }
 function taskState(){return state.tasks[activeTask]||(state.tasks[activeTask]={index:0,entries:{}});}
 function position(){return taskState().index;}
 function current(){return plans[activeTask]?.steps[position()];}
 function entry(){const t=taskState();return t.entries[t.index]||(t.entries[t.index]={action:state.seq,sample:lab.samples.at(-1)?.sample_id||0,saved:lab.saved.length});}
 function check(){const s=current();return !!s&&LabSteps.evaluate(s,{lab,task:activeTask,actions:state.actions,entry:entry(),proposed:encoded(),writeBox:Number($('config').value),predictions:lab.predictions,responses:lab.responses});}
 function refresh(){
  if(!current())return;
  const okay=check();$('continueStep').disabled=!okay;
  $('stepFeedback').className=okay?'step-pass':'step-wait';
  $('stepFeedback').textContent=okay?'Step conditions met. Read the observation prompt, then continue.':hint(current().gate);
  if(!okay&&['input','nominal'].includes(current().gate)){
   const issues=LabSteps.inputIssues(current(),lab);
   $('stepFeedback').textContent=issues.length?issues.join(' '):'Click Prepare fields for this practice.';
  }
  if(!okay&&$('message').classList.contains('error'))$('stepFeedback').textContent=$('message').textContent+' '+hint(current().gate);
  $('stepPrepared').textContent=$('prepared').textContent;
 }
 function hint(gate){return ({config:'Waiting: choose fields → copy → write → read back. If values differ, repeat the sequence after checking the fields.',rejected:'Waiting: with the dropped-write fault selected, copy the CH1 request, write it, and read back the unchanged configuration.',sample:'Waiting: acquire three conversions for the current settings. Settling must end; saturation may be the intended observation.',prediction:'Waiting: record a prediction for this task before sampling.',response:'Waiting: save your explanation below. Text is retained with your evidence; it is not automatically graded.',save:'Waiting: save a new checkpoint for this task. If settings changed, go back and acquire a new sample.',dac:'Waiting: write the specified DAC code, then read its registers.',input:'Waiting: set the task’s known input and nominal reference/fault conditions. Practice begins with Prepare fields.',id:'Waiting: click Read ID and check the returned identity.',fault:'Waiting: select the stated fault condition and test voltage.',nominal:'Waiting: set nominal fault/reference conditions.',prepared:'Waiting: click Prepare fields. No IC registers will be written.'})[gate]||'Complete the operation above.';}
 function keepOnly(section,ids){
  const roots=ids.map(id=>$(id)).filter(Boolean).map(el=>el.matches('input,select,textarea')?el.closest('label')||el:el.matches('td')?el.closest('tr'):el.id==='encoded'?el.closest('strong'):el.parentElement.matches('.readout>span')?el.parentElement:el);
  const walk=node=>{for(const child of node.children){if(roots.some(r=>r===child||r.contains(child)))continue;if(roots.some(r=>child.contains(r)))walk(child);else child.classList.add('step-pruned');}};
  walk(section);
 }
 function paint(focus=false){
  document.querySelectorAll('.step-pruned').forEach(el=>el.classList.remove('step-pruned'));
  for(const id of stageIds){const node=$(id);homes.get(id).after(node);node.classList.add('step-inactive');}
  const s=current(),submit=activeTask==='Submit';
  discussion.hidden=!(submit||activeTask==='E'&&position()===0);
  discussion.textContent=submit?'PAIR DISCUSSION · 3 minutes: Does matching register read-back prove the measured physical quantity is correct? Give one counterexample and record a simulation limitation in final Notes.':'PAIR DISCUSSION · 3 minutes: Sketch level → sensor → shunt → ADC → software tag. Add the controller and actuator to close the loop. Which parts are actually simulated here? Use this sketch for your two asset rows and one flow row at submission.';
  coach.hidden=bottom.hidden=submit;toolbar.hidden=!submit;
  document.body.dataset.stepArea=s?.area||'submit';
  document.body.dataset.stepGate=s?.gate||'submit';
  $('extraVisual').hidden=submit||s?.area==='prediction';
  $('predictionBox').hidden=true;
  if(submit){$('records').classList.remove('step-inactive');workspace.append($('records'));$('records').querySelector('[data-inventory]').open=true;updateSubmission();return;}
  entry();
  $('stepNumber').textContent=(plans[activeTask]?.phase==='independent'?'INDEPENDENT':'PRACTICE')+' · STEP '+(position()+1)+' / '+plans[activeTask].steps.length;
  $('stepName').textContent=s.name;$('stepDo').textContent=s.instruction;$('stepLook').textContent=s.observe;$('stepWhy').textContent=s.reason;
  $('stepPrepare').hidden=!s.prepare;$('stepPrepared').textContent='';
  $('previousStep').disabled=position()===0;
  $('continueStep').textContent=position()===plans[activeTask].steps.length-1?'Finish task →':'Next step →';
  const id=s.area==='prediction'?'predictionBox':s.area==='response'?'stepResponse':s.area,node=$(id);
  node.classList.remove('step-inactive');node.hidden=false;workspace.append(node);
  if(s.area==='prediction'){$('predictionText').placeholder=s.responsePrompt;node.querySelector('h3').textContent=s.responsePrompt;}
  else if(s.area==='response'){
   $('responsePrompt').textContent=s.responsePrompt;$('responseText').value=taskState().drafts?.[s.responseKey]??lab.responses.filter(r=>r.task===activeTask&&r.key===s.responseKey).at(-1)?.text??'';$('responseSaved').textContent='';
   const sample=lab.samples.at(-1);$('responseEvidence').textContent='Latest read-back: '+$('readback').textContent+'\n'+(sample?'Last sample #'+sample.sample_id+' · '+sample.config+' · CH'+sample.channel+' · gain ×'+sample.gain+'\nRaw '+sample.raw_code+' · STATUS '+sample.status+' · '+(sample.settled?'settled':'transient')+'\nReconstructed voltage '+sample.reconstructed_voltage_V+' V'+(sample.channel===0?' · level '+sample.tag_level_m+' m':''):'No measurement yet.');
  }else{if(s.gate==='save'&&!entry().labelPrepared){$('label').value=s.label;entry().labelPrepared=true;}keepOnly(node,s.allow);for(const d of node.querySelectorAll('details'))if(!d.classList.contains('step-pruned'))d.open=true;}
  refresh();render();
  if(focus){$('stepName').focus({preventScroll:true});$('stepCoach').scrollIntoView({block:'start',behavior:'instant'});}
 }
 hooks.action.push(id=>{
  if(!['prepare','copy','write','configRead','idRead','three','dacWrite','dacRead','save','recordPrediction','saveResponse'].includes(id))return;
  logAction(id);
  if(id==='recordPrediction'&&lab.predictions.at(-1)?.task===activeTask)lab.predictions.at(-1).action_seq=state.seq;
  if(id==='saveResponse'&&lab.responses.at(-1)?.task===activeTask)lab.responses.at(-1).action_seq=state.seq;
  refresh();
 });
 $('saveResponse').onclick=safe(()=>{if(!current()?.responseKey)return;const text=$('responseText').value.trim();if(!text){$('responseSaved').textContent='Write an explanation first.';throw Error('Write an explanation first.');}lab.responses.push({task:activeTask,key:current().responseKey,text,action_seq:state.seq,event_count:lab.events.length,sample_id:lab.samples.at(-1)?.sample_id||null,recorded_at:new Date().toISOString()});$('responseSaved').textContent='Explanation saved for export.';});
 $('stepPrepare').onclick=()=>runAction('prepare',()=>prepare(activeTask));
 $('previousStep').onclick=()=>{taskState().index=Math.max(0,position()-1);paint(true);update();};
 $('continueStep').onclick=()=>{if(!check()){refresh();return;}if(position()<plans[activeTask].steps.length-1){taskState().index++;paint(true);}else{taskState().finished=true;const order=[...LabSteps.taskKeys(),'Submit'];showTask(order[order.indexOf(activeTask)+1]);}update();};
 function updateSubmission(){
  const lines=LabSteps.taskKeys('independent').map(key=>{const n=lab.saved.filter(s=>s.assignment===key&&s.learning_phase==='independent').length;const rs=lab.responses.filter(r=>r.task===key).length;const ps=lab.predictions.filter(p=>p.task===key).length;return taskData[key].title+': '+n+' checkpoint(s), '+rs+' explanation(s)'+(!LabSteps.expectations()[key].prediction_required?'':', '+ps+' prediction(s)');});
  let report=$('submissionReview');if(!report){report=document.createElement('pre');report.id='submissionReview';$('records').prepend(report);}report.textContent=lines.join('\n')+'\nCounts indicate presence, not correctness. Check names, explanations, two assets, one flow and a limitation before exporting.';
 }
 let initialShow=true;
 hooks.task.push(function(key){$('taskGoal').textContent=plans[key]?.learn||taskData[key].goal;const phase=key==='Submit'?2:plans[key]?.phase==='independent'?1:0;$('guided').querySelectorAll('.task-nav button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===phase)));paint(!initialShow);if(key==='Submit'&&!initialShow)$('guided').scrollIntoView({block:'start'});initialShow=false;});
 hooks.update.push(()=>{refresh();if(activeTask==='Submit')updateSubmission();});
 // Keep incomplete writing across reloads without counting it as submitted evidence.
 $('responseText').addEventListener('input',()=>{const s=current();if(!s?.responseKey)return;taskState().drafts=taskState().drafts||{};taskState().drafts[s.responseKey]=$('responseText').value;});
 
 document.querySelector('footer').textContent='EE4002 · Lab 1 · v'+LabConfig.appVersion+' · Offline simulation';
}
