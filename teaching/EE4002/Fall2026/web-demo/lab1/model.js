/* EE4002 educational model. Not a vendor IC emulator. No physical I/O. */
(function(root){
  'use strict';
  const rates=[5,20,100,1000], gains=[1,2,4,8];
  const hex=(n,w=2)=>'0x'+n.toString(16).toUpperCase().padStart(w,'0');
  class Workbench {
    constructor(){this.events=[];this.samples=[];this.saved=[];this.time=0;this.level=1;this.pot=1;this.assumedRef=3.3;this.spiMode=0;this.fault='none';this.heldCurrent=12;this.reset();}
    event(type,detail){this.events.push({event_id:this.events.length+1,sim_time_ms:+this.time.toFixed(3),type,...detail});}
    reset(){this.config=0;this.dac=0;this.code=0;this.ready=false;this.latched=0;this.live=0;this.remaining=3;this.sourceTime=null;this.sampleTime=null;this.lastInput=0;this.event('RESET',{config:'0x00',dac_code:0});}
    get gain(){return gains[(this.config>>4)&3];} get channel(){return (this.config>>2)&3;} get rate(){return rates[this.config&3];} get enabled(){return !!(this.config&128);}
    get ref(){return this.fault==='reference'?2.5:3.3;}
    get current(){return this.fault==='freeze'?this.heldCurrent:4+8*this.level;}
    get status(){return (this.ready?1:0)|this.live|this.latched;}
    setFault(f){if(f==='freeze'&&this.fault!=='freeze')this.heldCurrent=4+8*this.level;this.fault=f;this.remaining=3;this.event('FAULT_SELECT',{fault:f});}
    transfer(tx,rx){this.event('SPI',{mode:this.spiMode,tx:tx.map(x=>hex(x)).join(' '),rx:rx.map(x=>hex(x)).join(' '),transport:'simulated SPI mode 0, MSB first'});}
    read(addr){if(this.spiMode!==0){this.latched|=16;this.transfer([addr,0],[255,255]);return 255;}let value=addr===0?0x42:addr===1?this.config:addr===2?this.status:addr===3?(this.code>>8)&15:addr===4?this.code&255:addr===5?(this.dac>>8)&15:addr===6?this.dac&255:0;this.transfer([addr,0],[0,value]);if(addr===4)this.ready=false;return value;}
    write(addr,value){if(!Number.isInteger(value)||value<0||value>255)throw Error('Enter one byte from 0x00 to 0xFF.');this.transfer([0x80|addr,value],[0,0]);if(this.spiMode!==0){this.latched|=16;return false;}if(this.fault==='drop'){this.event('WRITE_DROPPED',{address:hex(addr)});return false;}if(addr===1){if(value&64){this.latched|=16;this.event('RESERVED_BIT_REJECTED',{value:hex(value)});return false;}if(this.config!==value){this.remaining=3;this.ready=false;}this.config=value;}else if(addr===5)this.dac=((value&15)<<8)|(this.dac&255);else if(addr===6)this.dac=(this.dac&0xF00)|value;else if(addr===2)this.latched&=~(value&48);return true;}
    writeDac(d){if(!Number.isInteger(d)||d<0||d>4095)throw Error('DAC code must be an integer from 0 to 4095.');this.write(5,d>>8);this.write(6,d&255);}
    get inputVoltage(){return [this.current*0.15,this.pot,this.fault==='open'?0:this.dac*3.3/4096,0][this.channel];}
    step(){
      this.time+=1000/this.rate;
      if(!this.enabled){this.event('NO_CONVERSION',{reason:'EN=0'});return null;}
      if(this.ready)this.latched|=32;
      const voltage=this.inputVoltage;
      if(this.fault!=='freeze'||this.channel!==0)this.sourceTime=this.time;
      else if(this.sourceTime===null)this.sourceTime=this.time;
      this.remaining=Math.max(0,this.remaining-1);
      const settling=this.remaining>0;
      const vin=settling?(this.lastInput+voltage)/2:voltage;
      this.lastInput=vin;
      const overrange=vin*this.gain>=this.ref||vin<0;
      this.live=(settling?4:0)|(overrange?2:0);
      this.code=Math.max(0,Math.min(4095,Math.floor(vin*this.gain/this.ref*4096+1e-10)));
      this.ready=true;this.sampleTime=this.time;
      const reconstructed=this.code*this.assumedRef/4096/this.gain;
      const s={sample_id:this.samples.length+1,sim_time_ms:+this.time.toFixed(3),source_time_ms:+this.sourceTime.toFixed(3),config:hex(this.config),channel:this.channel,gain:this.gain,sps:this.rate,physical_level_m:this.level,source_current_mA:+this.current.toFixed(6),shunt_voltage_V:+(this.current*0.15).toFixed(6),input_voltage_V:+voltage.toFixed(6),raw_code:this.code,status:hex(this.status),settled:!settling,source_age_ms:+(this.time-this.sourceTime).toFixed(3),assumed_reference_V:this.assumedRef,reconstructed_voltage_V:+reconstructed.toFixed(6),tag:this.channel===0?'LT-201.PV':this.channel===2?'DAC-01.Feedback':'ADC-01.Voltage',tag_level_m:this.channel===0?+((reconstructed/0.15-4)/8).toFixed(6):null,fault:this.fault};
      this.samples.push(s);this.event('CONVERSION',{sample_id:s.sample_id,raw_code:s.raw_code,status:s.status});return s;
    }
    save(label){if(!this.samples.length||this.sampleTime===null)throw Error('Generate a sample before saving a checkpoint.');const s=this.samples[this.samples.length-1];if(s.sim_time_ms!==+this.time.toFixed(3)||s.config!==hex(this.config)||s.fault!==this.fault||s.physical_level_m!==this.level||s.assumed_reference_V!==this.assumedRef||s.input_voltage_V!==+this.inputVoltage.toFixed(6))throw Error('Settings changed: generate a new sample before saving a checkpoint.');const record={...s,label,configuration_at_save:hex(this.config),status_at_save:hex(this.status),saved_at:new Date().toISOString()};this.saved.push(record);return record;}
  }
  root.EE4002={Workbench,hex,rates,gains};if(typeof module!=='undefined')module.exports=root.EE4002;
})(typeof window!=='undefined'?window:globalThis);
