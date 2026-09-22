'use strict';
(()=>{
 if(window.parent===window)return;
 let previous=0,pending=false;
 function send(){pending=false;const h=Math.ceil(document.body.getBoundingClientRect().height+32);if(h!==previous){previous=h;parent.postMessage({type:'ee4002-lab-height',height:h},'*');}}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(send);}}
 new ResizeObserver(schedule).observe(document.body);
 window.addEventListener('load',schedule);window.addEventListener('resize',schedule);schedule();
})();
