'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const files=fs.readdirSync(__dirname).filter(f=>/^test-.*\.cjs$/.test(f)&&f!=='test-all.cjs').sort();let failures=0;
for(const file of files){console.log('\n'+file);const r=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit'});if(r.status!==0)failures++;}
console.log(`\n${files.length-failures}/${files.length} test scripts passed.`);process.exitCode=failures?1:0;
