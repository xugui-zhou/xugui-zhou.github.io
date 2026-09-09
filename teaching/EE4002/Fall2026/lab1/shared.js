'use strict';
// One Workbench instance owns all three Lab 1 views, including their evidence.
if(!isTour){
if(new URLSearchParams(location.search).has('embedded'))document.body.classList.add('shared-embedded');
function publishLab(){const s=lab.samples.at(-1);parent.postMessage({type:'ee4002-shared-state',level:lab.level,current:lab.current,voltage:lab.current*.15,reference:lab.ref,assumed:lab.assumedRef,config:lab.config,proposed:encoded(),channel:lab.channel,gain:lab.gain,rate:lab.rate,code:lab.code,status:lab.status,time:lab.time,fault:lab.fault,readback:$('readback').textContent,sample:lab.sampleTime===null?null:s,saved:lab.saved.length},'*');}
const priorRender=render;render=function(){priorRender();publishLab();};
window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='ee4002-shared-command')return;const {action,value}=e.data;try{
if(action==='level'){const n=Number(value);if(!Number.isFinite(n)||n<0||n>2)return;$('level').value=n;$('level').dispatchEvent(new Event('input',{bubbles:true}));}
else if(action==='fault'){if(![...$('fault').options].some(o=>o.value===value))return;$('fault').value=value;$('fault').dispatchEvent(new Event('change',{bubbles:true}));}
else if(action==='reference'){if(!['3.3','2.5'].includes(String(value)))return;$('assumed').value=value;$('assumed').dispatchEvent(new Event('change',{bubbles:true}));}
else if(action==='prepare'){$('prepare').click();}
else if(action==='sample'){$('step').click();$('statusRead').click();$('dataRead').click();}
else if(action==='settle')$('three').click();
else if(action==='write'){$('copy').click();$('write').click();}
else if(action==='read')$('configRead').click();
else if(action==='task'){if(['A','B','C','D','E','F','G','H','Submit'].includes(value))showTask(value);}
else if(action==='show'){}else return;
render();update();publishLab();
}catch(err){message(err.message);render();}});
document.addEventListener('input',()=>queueMicrotask(publishLab));document.addEventListener('change',()=>queueMicrotask(publishLab));document.addEventListener('click',()=>queueMicrotask(publishLab));publishLab();
}
