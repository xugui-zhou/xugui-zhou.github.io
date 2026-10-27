(()=>{'use strict';const $=id=>document.getElementById(id);
 function draw(){const r=Lab6Ideal.response($('idealGain').value,$('idealDelay').value),zoom=$('idealZoom').checked,cv=$('idealChart'),c=cv.getContext('2d'),w=cv.width,h=cv.height;
  const start=zoom?4:0,end=zoom?12:30,low=zoom?-.03:Math.min(-.1,...r.values)*1.08,high=zoom?.08:Math.max(1,...r.values)*1.08;
  const X=k=>75+(w-100)*(k-start)/(end-start),Y=v=>h-45-(h-85)*(v-low)/(high-low);
  c.clearRect(0,0,w,h);c.fillStyle='#fff';c.fillRect(0,0,w,h);c.font='16px system-ui';
  for(let i=0;i<=4;i++){const v=low+(high-low)*i/4,k=start+(end-start)*i/4;c.strokeStyle='#d9e1e5';c.beginPath();c.moveTo(75,Y(v));c.lineTo(w-25,Y(v));c.stroke();c.fillStyle='#243746';c.fillText(v.toFixed(3),4,Y(v)+5);c.fillText(k.toFixed(0),X(k)-5,h-20);}
  c.strokeStyle='#888';c.setLineDash([4,4]);c.beginPath();c.moveTo(75,Y(0));c.lineTo(w-25,Y(0));c.stroke();c.setLineDash([]);
  c.save();c.beginPath();c.rect(75,40,w-100,h-85);c.clip();c.strokeStyle='#087e8b';c.lineWidth=3;c.beginPath();for(let k=start;k<=end;k++){if(k===start)c.moveTo(X(k),Y(r.values[k]));else c.lineTo(X(k),Y(r.values[k]));}c.stroke();for(let k=start;k<=end;k++){c.beginPath();c.arc(X(k),Y(r.values[k]),3,0,Math.PI*2);c.fillStyle='#087e8b';c.fill();}c.restore();
  c.fillStyle='#243746';c.fillText('Level deviation x (m)',75,25);c.fillText('Sample k',w-110,h-3);
  const poles=r.poles.map(p=>p.im===0?p.re.toFixed(4):p.re.toFixed(4)+(p.im>0?' + j':' − j')+Math.abs(p.im).toFixed(4)).join('; ');
  $('idealResult').textContent=`Poles: ${poles}. Largest |z| = ${r.radius.toFixed(4)}. ${r.stable?'Asymptotically stable for this model.':'Not asymptotically stable for this model.'} ${r.d===0?'d = 0: stable iff 0 < g < 2.':'d = 1: stable iff 0 < g < 1.'}${r.g===.3&&r.d===1?' At k = 7, x = −0.0119 m: small damped oscillation.':''}${zoom?' Zoom shows k = 4–12 and x = −0.03 to 0.08 m; values outside this range are clipped.':''}`;
 }
 for(const id of ['idealGain','idealDelay','idealZoom'])$(id).onchange=draw;
 $('idealReset').onclick=()=>{$('idealGain').value='0.8';$('idealDelay').value='1';$('idealZoom').checked=false;draw();};draw();
})();
