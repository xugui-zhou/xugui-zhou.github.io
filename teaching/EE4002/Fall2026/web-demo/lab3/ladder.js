'use strict';
(function(root){
const INPUTS=['HighHigh','LevelValid','SourceOK','Auto','StopOK','Trip','Start','Reset','TRUE','FALSE'];
const MEMORY=['M1','M2','M3','M4'],TIMERS=['T1','T2','T3','T4'];
const TAGS=[...INPUTS,...MEMORY,...TIMERS.map(x=>x+'.Q')];
const copy=x=>JSON.parse(JSON.stringify(x));
function validate(g){
 if(!g||g.format!=='EE4002-LAD-1'||!g.params||!Array.isArray(g.networks)||g.networks.length<2||g.networks.length>12)throw Error('LAD project needs 2–12 networks.');
 const p=g.params;if(!['P','PI','PID','CASCADE'].includes(p.mode))throw Error('Select a supported control mode.');
 for(const [k,lo,hi]of [['Kp',0,200],['Ki',0,10],['Kd',0,100],['Tf',.05,5],['Ts',.02,.5]])if(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw Error(k+' must be '+lo+'–'+hi+'.');
 if(![.02,.05,.1,.2,.5].includes(p.Ts))throw Error('Ts must be 0.02, 0.05, 0.1, 0.2 or 0.5 s.');
 const ids=new Set(),timers=new Set(),writes={};
 function id(x){if(typeof x!=='string'||x.length>40||ids.has(x))throw Error('Every network and component needs a unique ID.');ids.add(x);}
 for(const [i,n]of g.networks.entries()){
  id(n.id);if(!['before','after'].includes(n.phase))throw Error('Network '+(i+1)+': select its scan phase.');
  if(!n.coil||!['COIL','SET','RESET'].includes(n.coil.type)||![...MEMORY,'TripCause','PumpEnable'].includes(n.coil.tag))throw Error('Network '+(i+1)+': invalid output coil.');
  const {tag,type}=n.coil;(writes[tag]||(writes[tag]=[])).push(type);
  if(tag==='TripCause'&&(n.phase!=='before'||type!=='COIL'))throw Error('TripCause must be a normal coil before the state update.');
  if(tag==='PumpEnable'&&(n.phase!=='after'||type!=='COIL'))throw Error('PumpEnable must be a normal coil after the state update.');
  if(!Array.isArray(n.branches)||!n.branches.length||n.branches.length>4)throw Error('Network '+(i+1)+': use 1–4 parallel branches.');
  for(const b of n.branches){if(!Array.isArray(b)||!b.length||b.length>8)throw Error('Network '+(i+1)+': each branch needs 1–8 components. Empty branches are not wires.');for(const c of b){id(c.id);if(!['NO','NC','TON'].includes(c.type))throw Error('Unsupported component.');if(c.type==='TON'){if(!TIMERS.includes(c.tag)||timers.has(c.tag))throw Error('Each TON instance T1–T4 can appear once.');timers.add(c.tag);if(typeof c.pt!=='number'||!Number.isFinite(c.pt)||c.pt<0||c.pt>60)throw Error('TON preset must be 0–60 seconds.');}else if(!TAGS.includes(c.tag))throw Error('Unknown contact tag: '+c.tag);}}
 }
 for(const key of ['TripCause','PumpEnable'])if(writes[key]?.length!==1)throw Error('Exactly one '+key+' coil is required.');
 for(const key of MEMORY){const w=writes[key]||[];if(w.filter(t=>t==='COIL').length&&(w.length!==1)||w.filter(t=>t==='SET').length>1||w.filter(t=>t==='RESET').length>1)throw Error(key+': use one normal coil or at most one SET and one RESET.');}
 return copy(g);
}
function compile(source){let g;try{g=JSON.parse(source);}catch{throw Error('Invalid LAD project JSON.');}g=validate(g);return {...g.params,ladder:g,source};}
function memory(){return {bits:Object.fromEntries(MEMORY.map(x=>[x,false])),timers:{}};}
function scanPhase(graph,phase,inputs,mem,dt){
 const tags={...mem.bits,...Object.fromEntries(TIMERS.map(t=>[t+'.Q',!!mem.timers[t]?.q])),TRUE:true,FALSE:false,...inputs},traces=[];
 for(const n of graph.networks.filter(n=>n.phase===phase)){
  const branches=n.branches.map(b=>{let power=true;const components=b.map(c=>{let test,detail={};if(c.type==='TON'){const t=mem.timers[c.tag]||(mem.timers[c.tag]={et:0,q:false});t.et=power?Math.min(c.pt,t.et+dt):0;t.q=power&&t.et+1e-9>=c.pt;tags[c.tag+'.Q']=t.q;test=t.q;detail={et:t.et,pt:c.pt};}else{test=c.type==='NO'?!!tags[c.tag]:!tags[c.tag];}power=power&&test;return {id:c.id,tag:c.tag,type:c.type,test,power,...detail};});return {components,power};});
  const power=branches.some(b=>b.power),{tag,type}=n.coil;
  if(type==='COIL')tags[tag]=power;else if(power)tags[tag]=type==='SET';
  if(MEMORY.includes(tag))mem.bits[tag]=!!tags[tag];
  traces.push({id:n.id,phase,branches,power,coil:{...n.coil,value:!!tags[tag]}});
 }
 return {tags,traces};
}
function fromLegacy(p){let count=0;const id=()=> 'c'+(++count);
 function dnf(n,neg=false){if(n.op==='NOT')return dnf(n.a,!neg);if(n.tag||'value'in n)return [[{id:id(),type:neg?'NC':'NO',tag:n.tag||(n.value?'TRUE':'FALSE')}]];const a=dnf(n.a,neg),b=dnf(n.b,neg),isAnd=(n.op==='AND')!==neg;let out=isAnd?a.flatMap(x=>b.map(y=>[...x,...y])):[...a,...b];if(out.length>4||out.some(x=>x.length>8))throw Error('This expression is too large for the teaching LAD editor.');return out;}
 const networks=[['TripCause',p.TripCause,'before'],['PumpEnable',p.PumpEnable,'after']].map(([tag,expr,phase],i)=>({id:'n'+i,phase,branches:dnf(expr).map(b=>b.map(c=>({...c,id:id()}))),coil:{type:'COIL',tag}}));
 return validate({format:'EE4002-LAD-1',params:Object.fromEntries(['mode','Kp','Ki','Kd','Tf','Ts'].map(k=>[k,p[k]])),networks});
}
const api={INPUTS,MEMORY,TIMERS,TAGS,validate,compile,memory,scanPhase,fromLegacy};if(typeof module!=='undefined')module.exports=api;else root.LadderCore=api;
})(globalThis);
