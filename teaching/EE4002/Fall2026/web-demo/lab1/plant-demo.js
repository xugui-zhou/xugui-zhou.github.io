/* Isolated teaching demonstration, SI units. Never writes student evidence. */
(function(root){class Lab1Plant{
constructor(){this.h1=.9;this.h2=.6;this.pump=70;this.valve=65;this.t=0;this.running=false;this.qin=0;this.q12=0;this.qout=0;}
step(dt){if(!this.running)return;dt=Math.max(0,Math.min(.1,dt));const area=.025;this.qin=.004*this.pump/100;this.q12=.0018*Math.sqrt(Math.max(0,this.h1));this.qout=.0018*this.valve/100*Math.sqrt(Math.max(0,this.h2));this.h1=Math.max(0,Math.min(2,this.h1+(this.qin-this.q12)*dt/area));this.h2=Math.max(0,Math.min(2,this.h2+(this.q12-this.qout)*dt/area));this.t+=dt;}
get snapshot(){const current=4+8*this.h2,voltage=current*.15,code=Math.min(4095,Math.floor(4096*voltage/3.3));return{level:this.h2,current,voltage,config:129,code,sample:{channel:0,tag_level_m:(code*3.3/4096/.15-4)/8},time:this.t*1000,saved:0};}
}root.Lab1Plant=Lab1Plant;if(typeof module!=='undefined')module.exports=Lab1Plant;})(globalThis);
