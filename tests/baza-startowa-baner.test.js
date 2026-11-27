const {run}=require('./harness.js');
const assert=require('assert');
const J=c=>JSON.parse(run(`JSON.stringify(${c})`));
const csv="Imię;Nazwisko;J/S;Drużyna ligowa;Drużyna narodowa;Rozgrywki\r\nMaciej;Janowski;S;Sparta;Polska;IMP\r\n";
const buf=Buffer.from("﻿"+csv,'utf8');
run(`globalThis.BUF=${JSON.stringify(Array.from(buf))};
 globalThis.fetch=()=>Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve(new Uint8Array(BUF).buffer)});
 globalThis.log=[];bdBanner=(b,h)=>log.push('banner:'+h);bdPreview=(b,t,s,h)=>log.push('preview:'+h);
 S.riders=['Ktoś Inny'];S.comps={};S.teams=[];S.rosters={SGP:[],SEC:[],IMP:[],INNE:[]};S.juniors=[];`);
const wait=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
  run(`bdCheckStarter()`);await wait();
  let l=J('log');console.log(l);assert(l.length===1&&l[0].startsWith('banner:'));
  run(`bdCheckStarter()`);await wait();   // niezamknięty baner pokazuje się znów
  assert.equal(J('log.length'),2);
  const hh=l[0].slice(7);run(`S.settings.starterSeen='${hh}';log.length=0;bdCheckStarter()`);await wait();   // po zamknięciu (×) — cisza
  assert.equal(J('log.length'),0);
  // pusta aplikacja → preview raz
  run(`log.length=0;S.riders=[];S.settings.starterSeen=null;S.settings.starterAsked=false;bdCheckStarter()`);await wait();
  l=J('log');assert(l.length===1&&l[0].startsWith('preview:'));
  // po imporcie hash zapisany → brak banera
  run(`log.length=0;bdApply(bdPlan(bdParseTable(bdDecode(new Uint8Array(BUF).buffer))));S.settings.starterSeen=null;bdCheckStarter()`);await wait();
  assert.equal(J('log.length'),0);
  assert.notEqual(J('S.settings.starterApplied'),null);
  console.log('starter flow ok');
})();
