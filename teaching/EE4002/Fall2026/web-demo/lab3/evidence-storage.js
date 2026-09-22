'use strict';
// Bounded display traces; metrics must be calculated before this projection.
(function(root){
 const fields=['t','h','sp','command','q','cascadeTarget'];
 function compact(record,limit=400){
  const a=record.samples||[],chosen=new Set();
  if(a.length<=limit)a.forEach((_,i)=>chosen.add(i));
  else{
   chosen.add(0);chosen.add(a.length-1);
   const buckets=Math.max(1,Math.floor((limit-2)/10));
   for(let b=0;b<buckets;b++){
    const lo=Math.floor(b*a.length/buckets),hi=Math.floor((b+1)*a.length/buckets);
    for(const key of fields.slice(1)){
     let min=lo,max=lo;
     for(let i=lo;i<hi;i++){if(a[i][key]<a[min][key])min=i;if(a[i][key]>a[max][key])max=i;}
     chosen.add(min);chosen.add(max);
    }
   }
  }
  const samples=[...chosen].sort((a,b)=>a-b).map(i=>Object.fromEntries(fields.filter(k=>Number.isFinite(a[i][k])).map(k=>[k,a[i][k]])));
  return {...record,samples,traceInfo:{method:'bucket extrema; t/h/sp/command/q/cascadeTarget',originalCount:record.traceInfo?.originalCount??a.length,retainedCount:samples.length,metrics:'computed before display-trace reduction; cover retained engine history'}};
 }
 function compactWork(work,limit=400){return Object.fromEntries(Object.entries(work).map(([id,w])=>[id,{...w,records:(w.records||[]).map(r=>compact(r,limit))}]));}
 function serialize(student,work){
  for(const limit of [400,160,80]){const json=JSON.stringify({schema:1,student,work:compactWork(work,limit)});if(json.length<=750000)return json;}
  throw Error('Draft exceeds the Lab 3 storage budget. Download evidence now.');
 }
 const api={compact,compactWork,serialize};if(typeof module!=='undefined')module.exports=api;else root.Lab3Evidence=api;
})(typeof globalThis!=='undefined'?globalThis:this);
