'use strict';
(function(root){
const VERSION='1.2.0',BAUDS=[1200,2400,4800,9600,19200,38400,57600,115200];
const hex=a=>a.map(n=>n.toString(16).toUpperCase().padStart(2,'0')).join(' ');
function config(c){if(!c||!BAUDS.includes(c.baud)||!['N','E','O'].includes(c.parity)||![1,2].includes(c.stop))throw Error('Choose a supported baud rate, parity and stop-bit count.');return {...c};}
function parse(text,format){let a;if(format==='ascii'){if(!text||/[^\x20-\x7e\r\n\t]/.test(text))throw Error('Use 1–32 ASCII characters.');a=Array.from(text,c=>c.charCodeAt(0));}else{const s=text.trim();if(!/^[\da-f]{2}(?:\s+[\da-f]{2})*$/i.test(s))throw Error('Use two-digit hexadecimal bytes separated by spaces, e.g. 03 41.');a=s.split(/\s+/).map(x=>parseInt(x,16));}if(a.length>32)throw Error('Send at most 32 bytes per trial.');return a;}
function encode(bytes,c){config(c);const bits=[1],labels=['idle'],starts=[];for(const byte of bytes){starts.push(bits.length);bits.push(0);labels.push('start');let ones=0;for(let k=0;k<8;k++){const b=(byte>>k)&1;ones+=b;bits.push(b);labels.push('d'+k);}if(c.parity!=='N'){bits.push((ones%2)^(c.parity==='O'?1:0));labels.push(c.parity+' parity');}for(let k=0;k<c.stop;k++){bits.push(1);labels.push('stop');}}bits.push(1,1,1);labels.push('idle','idle','idle');return {bits,labels,starts,baud:c.baud,charBits:9+(c.parity==='N'?0:1)+c.stop};}
function serial(bytes,tx,rx,fault='none'){
 config(rx);const signal=encode(bytes,tx),wire=signal.bits.slice();if(fault==='flip')wire[2]^=1;if(fault==='disconnect')wire.fill(1);
 const at=t=>t<0||t*tx.baud>=wire.length?null:wire[Math.floor(t*tx.baud+1e-8)],frames=[];let ready=0;
 for(let k=1;k<wire.length;k++){
  const start=k/tx.baud;if(wire[k]!==0||wire[k-1]!==1||start+1e-10<ready)continue;
  if(at(start+.5/rx.baud)!==0)continue;
  const samples=[],values=[];let n=0,ones=0;
  for(let j=0;j<8;j++){const t=start+(1.5+j)/rx.baud,b=at(t);samples.push({t,bit:b,label:'d'+j});values.push(b);if(b===1){n|=1<<j;ones++;}}
  let parityOK=true,offset=9;
  if(rx.parity!=='N'){const t=start+9.5/rx.baud,b=at(t);samples.push({t,bit:b,label:'parity'});parityOK=b!==null&&b===((ones%2)^(rx.parity==='O'?1:0));offset++;}
  let framingOK=true;for(let j=0;j<rx.stop;j++){const t=start+(offset+.5+j)/rx.baud,b=at(t);samples.push({t,bit:b,label:'stop'});framingOK&&=b===1;}
  const complete=samples.every(s=>s.bit!==null);frames.push({start,byte:n,parityOK,framingOK,complete,ok:complete&&parityOK&&framingOK,samples});ready=start+(offset+rx.stop-.01)/rx.baud;
 }
 const received=frames.filter(f=>f.ok).map(f=>f.byte);
 return {signal,wire,tx:{...tx},rx:{...rx},sent:[...bytes],received,frames,fault,equal:hex(bytes)===hex(received),configMatch:tx.baud===rx.baud&&tx.parity===rx.parity&&tx.stop===rx.stop,charMs:signal.charBits/tx.baud*1000};
}
function crc(a){let c=0xFFFF;for(const b of a){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xA001:0);}return c;}
function rtu(a){const c=crc(a);return [...a,c&255,c>>>8];}
const word=n=>[n>>>8,n&255];
function transaction(c,tx,rx){
 for(const [key,min,max]of [['unit',1,247],['address',0,65535],['quantity',1,3],['level',0,2000]])if(!Number.isInteger(c[key])||c[key]<min||c[key]>max)throw Error('Invalid '+key+'.');
 if(![3,4].includes(c.fc)||!['rtu','tcp'].includes(c.transport)||![.001,.01,1].includes(c.scale))throw Error('Invalid protocol configuration.');
 const pdu=[c.fc,...word(c.address),...word(c.quantity)],requestRTU=rtu([c.unit,...pdu]);
 const request=c.transport==='tcp'?[0,42,0,0,0,6,c.unit,...pdu]:requestRTU;
 let link=null,response=[],exception=null,raw=[],reason='';
 if(c.transport==='rtu'){link=serial(requestRTU,tx,rx,c.fault);if(!link.equal||crc(link.received)!==0)reason='No valid request reached the server. Inspect UART decoding and CRC.';}
 if(!reason&&c.unit!==1)reason='No response: the teaching server listens at Unit 1.';
 if(!reason){if(c.fc!==3)exception=1;else if(c.address+c.quantity>3)exception=2;
  let rpdu;if(exception)rpdu=[c.fc|128,exception];else{raw=[c.level,1,1000].slice(c.address,c.address+c.quantity);rpdu=[c.fc,raw.length*2,...raw.flatMap(word)];}
  response=c.transport==='tcp'?[0,42,0,0,...word(1+rpdu.length),1,...rpdu]:rtu([1,...rpdu]);
 }
 let returnLink=null;if(response.length&&c.transport==='rtu'){returnLink=serial(response,rx,tx);if(!returnLink.equal){reason='Server replied, but the client UART could not decode the response.';}}
 const outcome=reason?'timeout':exception?'exception':'normal';
 return {request,response,link,returnLink,outcome,reason,exception,raw:outcome==='normal'?raw:[],display:outcome==='normal'&&c.address===0?raw[0]*c.scale:null,config:{...c},tx:{...tx},rx:{...rx}};
}
function integrity(sent,received){
 const parity=a=>a.map(b=>{let p=0;for(let i=0;i<8;i++)p^=(b>>i)&1;return p;});
 const sum=a=>a.reduce((s,b)=>(s+b)&255,0),txCRC=crc(sent),rxCRC=crc(received),txParity=parity(sent),rxParity=parity(received);
 return {sent,received,txCRC,rxCRC,txSum:sum(sent),rxSum:sum(received),txParity,rxParity,parityOK:hex(txParity)===hex(rxParity),sumOK:sum(sent)===sum(received),crcOK:txCRC===rxCRC,residue:crc([...received,txCRC&255,txCRC>>>8]),changed:hex(sent)!==hex(received)};
}
function tcpBuffer(bytes){
 if(bytes.length<6)return {complete:false,needed:6-bytes.length,message:'Waiting for the first six header bytes.'};
 const length=bytes[4]*256+bytes[5];
 if(bytes[2]||bytes[3]||length<2||length>254)return {complete:false,error:true,message:'Invalid Modbus header.'};
 const total=6+length;
 return {complete:bytes.length>=total,total,needed:Math.max(0,total-bytes.length),message:bytes.length<total?'Keep buffering.':'One complete message is available.',frame:bytes.slice(0,total),remaining:bytes.slice(total)};
}
function evidenceChecks(id,captures){
 const ds=kind=>captures.filter(c=>c.kind===kind).map(c=>c.data);
 const m=ds('modbus'),s=ds('serial'),i=ds('integrity');
 const good=m.filter(d=>d.outcome==='normal'&&d.config?.address===0&&d.config.scale===.001&&d.display===d.config.level*.001);
 if(id==='P1')return [['Matched UART trial',s.some(d=>d.equal&&d.configMatch)]];
 if(id==='P2')return [['Correct RTU read',good.some(d=>d.config.transport==='rtu')],['Correct TCP read',good.some(d=>d.config.transport==='tcp')],['Clean integrity baseline',i.some(d=>!d.changed&&d.crcOK)],['Parity misses corruption; CRC detects it',i.some(d=>d.changed&&d.parityOK&&!d.crcOK)],['TCP receive walkthrough and ACK answer',ds('tcp').some(d=>d.complete&&typeof d.ackAnswer==='string'&&d.ackAnswer.trim().length>0)]];
 if(id==='I1')return [['Faulty UART baseline',s.some(d=>!d.equal)],['Matched repaired trial',s.some(d=>d.equal&&d.configMatch)],['Regression pattern 03 55 A6',s.some(d=>d.equal&&d.configMatch&&hex(d.sent)==='03 55 A6')]];
 return [['Address exception baseline',m.some(d=>d.exception===2)],['Normal response with wrong scale',m.some(d=>d.outcome==='normal'&&d.config?.address===0&&d.config.scale!==.001)],['Correct readings at two levels',new Set(good.map(d=>d.config.level)).size>=2]];
}
const api={VERSION,BAUDS,hex,parse,encode,serial,crc,rtu,transaction,integrity,tcpBuffer,evidenceChecks};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Lab4=api;
})(globalThis);
