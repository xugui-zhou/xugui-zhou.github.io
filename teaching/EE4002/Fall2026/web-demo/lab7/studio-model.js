/* Original offline teaching model; no PLC, OPC UA or vendor project compatibility. */
(function(root){'use strict';
const tags={LT101:{unit:'m',max:2},P101:{unit:'',max:1},FLOW101:{unit:'m³/s',max:.06}};
for(const [tag,def] of Object.entries({...tags}))tags[tag.replace('101','102')]={...def};
const types=['tank','number','lamp','trend','button','alarms'];
const clone=x=>JSON.parse(JSON.stringify(x));
function starter(){return {schema:1,name:'Tank station',alarm:{high:1.2,deadband:.1,delay:3},components:[
{id:1,type:'tank',label:'Tank level',tag:'LT101',x:40,y:50,w:190,h:300},
{id:2,type:'number',label:'LT101',tag:'LT101',x:270,y:50,w:200,h:120},
{id:3,type:'button',label:'Pump command',tag:'P101',x:270,y:310,w:200,h:110},
{id:4,type:'trend',label:'Level history · last 120 s',tag:'LT101',x:500,y:50,w:450,h:280},
{id:5,type:'alarms',label:'Alarm status',tag:'LT101',x:40,y:440,w:910,h:150}]};}
function station(p,tag='101'){return String(tag).includes('102')?p.second:p;}
function tank(s,tag='101'){return String(tag).includes('102')?s.second:s;}
function dual(p=starter()){p=clone(p);if(p.second)return p;p.second={schema:1,name:'TK102',input:{profile:'manual',scale:.001},alarm:{high:1.3,deadband:.1,delay:3},components:[]};const size=canvas(p),offset=size.h;p.canvas={w:Math.max(1000,size.w),h:Math.min(1600,offset+600)};let id=Math.max(0,...p.components.map(c=>c.id));for(const c of starter().components)p.components.push({...c,id:++id,station:'102',y:c.y+offset,tag:c.tag.replace('101','102'),label:c.label.replace('101','102')+' · TK102'});return validate(p);}
function canvas(p){return p?.canvas||{w:1000,h:600};}
function freePosition(p,c){const size=canvas(p);for(let y=10;y<=size.h-c.h;y+=10)for(let x=10;x<=size.w-c.w;x+=10)if(p.components.every(o=>o.id===c.id||x+c.w+10<=o.x||x>=o.x+o.w+10||y+c.h+10<=o.y||y>=o.y+o.h+10))return {x,y};return null;}
function validate(p){
 if(!p||p.schema!==1||typeof p.name!=='string'||p.name.length>80||!Array.isArray(p.components)||p.components.length>30)throw Error('Invalid project: schema 1, name ≤80 characters and ≤30 components required.');
 if(p.input&&(!['manual','normal','stale','scale','chatter','sustained'].includes(p.input.profile)||!Number.isFinite(p.input.scale)||p.input.scale<.0001||p.input.scale>.01))throw Error('Invalid test input or scale.');
 if(p.second){if(p.second.second)throw Error('Only two independent stations supported.');validate(p.second);}
 const size=canvas(p);if(![size.w,size.h].every(Number.isInteger)||size.w<600||size.w>2400||size.h<400||size.h>1600)throw Error('Canvas: width 600–2400 px; height 400–1600 px (whole numbers).');
 const a=p.alarm;if(!a||![a.high,a.deadband,a.delay].every(Number.isFinite)||a.high<.2||a.high>1.9||a.deadband<0||a.deadband>=a.high||a.delay<0||a.delay>20)throw Error('Alarm: high 0.2–1.9 m, 0 ≤ deadband < high, delay 0–20 s.');
 const ids=new Set();for(const c of p.components){if(!Number.isInteger(c.id)||ids.has(c.id)||!types.includes(c.type)||typeof c.label!=='string'||c.label.length>100||!tags[c.tag]||(c.tag.endsWith('102')&&!p.second))throw Error('Invalid component or tag binding.');ids.add(c.id);if(![c.x,c.y,c.w,c.h].every(Number.isFinite)||c.x<0||c.y<0||c.w<100||c.h<70||c.x+c.w>size.w||c.y+c.h>size.h)throw Error('Components must fit the canvas (minimum 100 × 70). Enlarge the canvas or move/resize components before shrinking it.');if(c.type==='button'&&!['P101','P102'].includes(c.tag))throw Error('Pump command buttons must bind to a pump tag.');if(['tank','trend','alarms'].includes(c.type)&&!['LT101','LT102'].includes(c.tag))throw Error('Tank, trend and alarm components must bind to a level tag.');}return clone(p);
}
function initial(p){const h=p?.input?.profile==='scale'?.75:p?.input?.profile==='chatter'?1.18:.8;return {t:0,h,pv:h*(p?.input?.scale??.001)/.001,raw:Math.round(h/.001),source:0,pump:false,freeze:false,active:false,acked:false,pending:0,firstAlarm:null,activations:0,history:[],events:[],...(p?.second?{second:initial(p.second)}:{})};}
function event(s,message){s.events.push({t:+s.t.toFixed(1),message});s.events=s.events.slice(-80);}
function step(s,p,dt=.1){
 if(p.second&&s.second)step(s.second,p.second,dt);
 if(!(dt>0&&dt<=1))throw Error('Invalid time step');s.t=+(s.t+dt).toFixed(6);const profile=p.input?.profile||'manual';
 // A=1 m²; inlet=0.06 m³/s when on; outlet=0.025 h m³/s.
 if(profile==='manual')s.h=Math.max(0,Math.min(2,s.h+dt*((s.pump?.06:0)-.025*s.h)));
 else if(profile==='sustained')s.h=s.t<10?.8:s.t<40?1.4:.9;
 else if(profile==='chatter')s.h=1.2+(Math.floor(s.t)%2?.02:-.02);
 else if(profile==='scale')s.h=.75+.01*s.t;
 else s.h=.8+.005*s.t;
 const frozen=s.freeze||(profile==='stale'&&s.t>=20&&s.t<35);
 if(!frozen){s.raw=Math.round(s.h/.001);s.pv=profile==='manual'&&!p.input?s.h:s.raw*(p.input?.scale??.001);s.source=s.t;}const fresh=s.t-s.source<=2;
 if(fresh){if(!s.active&&s.pv>=p.alarm.high){if(s.pending===0)s.aboveSince=s.t;s.pending+=dt;if(s.t-s.aboveSince+1e-8>=p.alarm.delay){s.active=true;s.acked=false;s.activations++;if(s.firstAlarm===null)s.firstAlarm=s.t;event(s,'HIGH activated');}}else s.pending=0;if(s.active&&s.pv<=p.alarm.high-p.alarm.deadband){s.active=false;event(s,'HIGH returned to normal');}}
 else s.pending=0;
 s.history.push({t:+s.t.toFixed(2),pv:s.pv,h:s.h,raw:s.raw,source:s.source,age:s.t-s.source,stale:!fresh,active:s.active,acked:s.acked});s.history=s.history.filter(r=>r.t>=s.t-120).slice(-1201);return s;
}
function ack(s){if(s.active&&!s.acked){s.acked=true;event(s,'Operator acknowledged HIGH');}}
function values(s){return {LT101:s.pv,P101:Number(s.pump),FLOW101:s.pump?.06:0,...(s.second?{LT102:s.second.pv,P102:Number(s.second.pump),FLOW102:s.second.pump?.06:0}:{})};}
const api={tags,types,station,tank,dual,canvas,freePosition,starter,validate,initial,step,ack,event,values};if(typeof module!=='undefined')module.exports=api;else root.ScadaModel=api;
})(globalThis);
