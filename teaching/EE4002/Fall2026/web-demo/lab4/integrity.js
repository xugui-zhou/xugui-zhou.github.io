'use strict';
const Lab4Integrity={init({get:$,model:Lab4,setLatest,notice}){
// This comparison isolates payload corruption: original check fields are unchanged.
const crcHex=n=>n.toString(16).toUpperCase().padStart(4,'0');
function checkIntegrity(){try{
 const d=Lab4.integrity(Lab4.parse($('checkTX').value,'hex'),Lab4.parse($('checkRX').value,'hex'));
 $('checkResult').innerHTML=`<p><strong>${d.changed?'Payload changed in transit.':'Payload unchanged.'}</strong> Original check fields are kept unchanged for this comparison.</p><table><tr><th>Check</th><th>Sender value</th><th>Receiver recalculation</th><th>Comparison</th></tr><tr><td>Even parity per byte</td><td>${d.txParity.join(' ')}</td><td>${d.rxParity.join(' ')}</td><td>${d.parityOK?'MATCH':'MISMATCH'}</td></tr><tr><td>8-bit sum (Σ bytes mod 256)</td><td>${Lab4.hex([d.txSum])}</td><td>${Lab4.hex([d.rxSum])}</td><td>${d.sumOK?'MATCH':'MISMATCH'}</td></tr><tr><td>CRC-16 / MODBUS</td><td>0x${crcHex(d.txCRC)}</td><td>0x${crcHex(d.rxCRC)}</td><td>${d.crcOK?'MATCH':'MISMATCH'}</td></tr></table><p>Original RTU frame: <strong>${Lab4.hex([...d.sent,d.txCRC&255,d.txCRC>>>8])}</strong><br>Received payload + original CRC: <strong>${Lab4.hex([...d.received,d.txCRC&255,d.txCRC>>>8])}</strong><br>CRC over that received frame: <strong>0x${crcHex(d.residue)}</strong> (${d.residue===0?'zero residue: CRC passes':'nonzero residue: CRC fails'}).</p><p>${d.changed&&d.parityOK?'Parity missed this change. ':''}${d.changed&&d.sumOK?'The simple sum missed this change. ':''}A matching check does not prove the measurement is accurate, fresh or authentic.</p>`;
 setLatest({kind:'integrity',data:d});$('capture').disabled=false;notice('Check comparison ready. Label and capture it below to include it in your report.');
 }catch(e){setLatest(null);$('capture').disabled=true;$('checkResult').textContent=e.message;notice(e.message);}}
$('checkRun').onclick=checkIntegrity;
for(const id of ['checkTX','checkRX'])$(id).addEventListener('input',()=>{setLatest(null);$('capture').disabled=true;$('checkResult').textContent='Bytes changed. Click Compare checks again.';});
$('checkPreset').onchange=()=>{const tx=[1,3,0,0,0,1],rx=tx.slice();switch($('checkPreset').value){case 'single':rx[0]^=1;break;case 'double':rx[0]^=3;break;case 'balanced':rx[0]-=1;rx[1]+=1;break;}$('checkTX').value=Lab4.hex(tx);$('checkRX').value=Lab4.hex(rx);checkIntegrity();};

}};
