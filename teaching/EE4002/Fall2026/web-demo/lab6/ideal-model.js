/* Lecture-only P-controlled ideal integrator. Separate from the assessed PI tank. */
(function(root){'use strict';
 function response(g=.8,d=1){
  g=Number(g);d=Number(d);if(!Number.isFinite(g)||g<0||g>3||![0,1].includes(d))throw Error('Use 0 ≤ g ≤ 3 and d = 0 or 1.');
  const values=[1];let previous=1;
  for(let k=0;k<30;k++){const current=values[k];values.push(current-g*(d?previous:current));previous=current;}
  const discriminant=1-4*g;
  const poles=d===0?[{re:1-g,im:0}]:discriminant>=0?[{re:(1+Math.sqrt(discriminant))/2,im:0},{re:(1-Math.sqrt(discriminant))/2,im:0}]:[{re:.5,im:Math.sqrt(-discriminant)/2},{re:.5,im:-Math.sqrt(-discriminant)/2}];
  const radius=Math.max(...poles.map(p=>Math.hypot(p.re,p.im)));
  return {g,d,values,poles,radius,stable:g>0&&g<(d===0?2:1)};
 }
 const api={response};if(typeof module!=='undefined')module.exports=api;root.Lab6Ideal=api;
})(globalThis);
