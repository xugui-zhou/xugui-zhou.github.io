'use strict';
const Lab4Learning={init({get:$,model:M,setLatest,notice}){
 let transaction=null,step=0;
 const response=[0,42,0,0,0,5,1,3,2,2,238];
 function clear(){transaction=null;$('byteButtons').innerHTML='';$('byteWave').innerHTML='Run an RTU read, then select a byte.';$('byteMeaning').textContent='';}
 function selectByte(direction,index){
  if(!transaction||transaction.config.transport!=='rtu')return;
  const r=direction==='request'?transaction.link:transaction.returnLink;
  if(!r)return;
  const start=r.signal.starts[index],count=r.signal.charBits,bits=r.wire.slice(start,start+count),x=k=>50+k*850/count,y=b=>b?40:105;
  let path=`M 50 ${y(bits[0])}`;bits.forEach((b,k)=>{path+=` H ${x(k+1)}`;if(k+1<bits.length)path+=` V ${y(bits[k+1])}`;});
  const dots=r.frames.flatMap(f=>f.samples).filter(s=>s.t*r.tx.baud>=start&&s.t*r.tx.baud<start+count).map(s=>`<circle cx="${x(s.t*r.tx.baud-start)}" cy="${y(s.bit)}" r="5" fill="#bd6d14"><title>${s.label}: ${s.bit}</title></circle>`).join('');
  $('byteWave').innerHTML=`<svg viewBox="0 0 960 185" role="img" aria-label="Selected UART character with receiver sample points"><text x="10" y="45">1</text><text x="10" y="110">0</text><path d="${path}" fill="none" stroke="#176d78" stroke-width="3"/>${dots}${bits.map((b,k)=>`<text x="${x(k+.5)}" y="140" text-anchor="middle">${r.signal.labels[start+k]}</text><text x="${x(k+.5)}" y="166" text-anchor="middle">${b}</text>`).join('')}</svg>`;
  const bytes=transaction[direction],byte=bytes[index],field=index===0?'Unit ID':index===1?'Function code':index>=bytes.length-2?'CRC: low byte first':direction==='request'?(index<4?'Starting address: high byte first':'Quantity: high byte first'):transaction.exception?'Exception code':index===2?'Byte count':'Register data: high byte first';
  $('byteMeaning').textContent=`${direction} byte ${index+1}: ${M.hex([byte])}. ${field}. UART sends D0 first: ${Array.from({length:8},(_,j)=>(byte>>j)&1).join(' ')}. One character = ${count} bits, ${(count/r.tx.baud*1000).toFixed(3)} ms. Amber dots are actual receiver samples from this transaction.`;
  $('byteButtons').querySelectorAll?.('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.direction===direction&&+b.dataset.byte===index));
 }
 function show(r){clear();transaction=r;if(r.config.transport!=='rtu'){$('byteWave').textContent='TCP has no UART character wrapper. Use the TCP walkthrough below.';return;}
  $('byteButtons').innerHTML=['request','response'].map(d=>`<p>${d.toUpperCase()}</p>`+r[d].map((b,j)=>`<button data-direction="${d}" data-byte="${j}" aria-pressed="false">${M.hex([b])}</button>`).join('')).join('');selectByte('request',1);
 }
 $('byteButtons').onclick=e=>{const b=e.target.closest('[data-byte]');if(b)selectByte(b.dataset.direction,+b.dataset.byte);};
 function renderTCP(){
  const events=['Client → Server: SYN, Seq 100','Server → Client: SYN + ACK, Seq 500, Ack 101','Client → Server: ACK, Seq 101, Ack 501. Connected.','Read 1: 00 2A 00 00 00','Read 2: 05 01 03 02 02 EE'];
  $('tcpEvents').textContent=events.slice(0,step).join('\n')||'Click Connect to start the fixed teaching trace.';
  const bytes=step<4?[]:step===4?response.slice(0,5):response,result=M.tcpBuffer(bytes);
  $('tcpBuffer').textContent=`Buffered: ${M.hex(bytes)||'(empty)'}\n${step<4?'No application bytes yet.':result.message}${result.total?' Length = 5; total = 6 + 5 = 11 bytes.':''}${result.complete?'\nDecoded: transaction 42, Unit 1, FC03, raw 750 = 0.750 m.':''}`;
  $('tcpNext').disabled=step>=5;$('tcpNext').textContent=step===0?'Connect':step<3?'Next handshake step':'Receive next chunk';$('tcpCapture').disabled=step!==5||!$('tcpAnswer').value;
 }
 function changed(){setLatest(null);$('capture').disabled=true;renderTCP();}
 $('tcpNext').onclick=()=>{step=Math.min(5,step+1);changed();};
 $('tcpReset').onclick=()=>{step=0;$('tcpAnswer').value='';changed();};
 $('tcpAnswer').onchange=changed;
 $('tcpCapture').onclick=()=>{if(step!==5||!$('tcpAnswer').value)return;setLatest({kind:'tcp',data:{complete:true,reads:[response.slice(0,5),response.slice(5)],ackAnswer:$('tcpAnswer').value,transactionId:42,raw:750,display:.75}});$('capture').disabled=false;notice('TCP walkthrough ready. Add a checkpoint label and capture below. Your ACK answer is saved as evidence.');};
 renderTCP();clear();return {show,clear,reset:()=>{clear();step=0;$('tcpAnswer').value='';renderTCP();}};
}};
