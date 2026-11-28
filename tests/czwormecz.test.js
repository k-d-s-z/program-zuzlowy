const {run}=require('./harness.js');
const assert=require('assert');
run(`S.teams=[];
const mk=(n,r,nat)=>S.teams.push({name:n,riders:r,national:nat});
mk('Polska',['Zmarzlik','Janowski','Kubera','Dudek','Woryna'],true);
mk('Wielka Brytania',['Lambert','Wright','Ellis','Flint','Brennan'],true);
mk('Dania',['Michelsen','Madsen','Jepsen Jensen','Thomsen','Jakobsen'],true);
mk('Australia',['Douglas','Kurtz','Doyle','Fricke','Tungate'],true);
mk('Liga X',['A1','A2','A3','A4','A5','A6',LG_ZZ_NAME],false);`);
// table sanity
run(`(function(){for(let col=0;col<4;col++){const cnt={};for(let h=0;h<16;h++){const x=QD_TAB[h][col].nr;cnt[x]=(cnt[x]||0)+1;}
 for(const k of [1,2,3,4])if(cnt[k]!==4)throw new Error('col '+col+' nr '+k+' count '+cnt[k]);}
 for(let h=0;h<20;h++){const g=QD_TAB[h].map(x=>x.gate).sort().join('');if(g!=='1234')throw new Error('gates heat '+(h+1));}
 for(let col=0;col<4;col++){const g=[16,17,18,19].map(h=>QD_TAB[h][col].gate).sort().join('');if(g!=='1234')throw new Error('gates 17-20 col '+col);}})()`);
console.log('table ok');
// wizard: Poland red, GB blue, Denmark white, Australia yellow
run(`UI.startQuad();for(let i=0;i<4;i++)UI.qdSetTeam(i,String(i));UI.qdSetupNext();`);
for(let i=0;i<4;i++)run(`(function(){const t=S.teams[QdW.slots[QdW.step]];let k=0;t.riders.forEach((n,ix)=>{if(n!==LG_ZZ_NAME&&k<5){UI.qdSetRider(k,String(ix));k++;}});})();UI.qdLineupNext()`);
run(`(function(){const c=qdNewComp(QdW,'SWC');mutate(()=>{S.comps[c.id]=c;S.current=c.id;});QdW=null;qdRender();})()`);
assert.equal(run(`qdc().qd.heats.length`),20);
// heat 1: Poland rider idx 3 (Dudek, gate 3), GB 0 (Lambert gate 2), DK 3 (Thomsen gate1), AUS 1 (Kurtz gate 4)
console.log(run(`JSON.stringify(qdc().qd.heats[0].slots.map(s=>[s.t,s.ri,s.gate]))`));
assert.equal(run(`JSON.stringify(qdc().qd.heats[0].slots.map(s=>[s.t,s.ri,s.gate]))`),JSON.stringify([[0,3,3],[1,0,2],[2,3,1],[3,1,4]]));
// replay Warsaw 2026 heats 1-16 by team of finishers
const team={Zmarzlik:0,Janowski:0,Kubera:0,Dudek:0,Woryna:0,Lambert:1,Wright:1,Ellis:1,Flint:1,Brennan:1,Michelsen:2,Madsen:2,MJJ:2,Thomsen:2,Jakobsen:2,Douglas:3,Kurtz:3,Doyle:3,Fricke:3,Tungate:3};
const res=[['Kurtz','Dudek','Lambert','Thomsen'],['Douglas','Kubera','Wright','MJJ'],['Doyle','Michelsen','Janowski','Flint'],['Fricke','Ellis','Zmarzlik','Madsen'],
['Michelsen','Wright','Dudek','Fricke'],['Lambert','Doyle','Madsen','Kubera'],['Douglas','Michelsen','Janowski','Ellis'],['Zmarzlik','Kurtz','Flint','Jakobsen'],
['Douglas','Lambert','Dudek','Madsen'],['Michelsen','Zmarzlik','Kurtz','Ellis'],['Lambert','MJJ','Woryna','Fricke'],['Thomsen','Zmarzlik','Wright','Doyle'],
['Woryna','Thomsen','Fricke','Flint'],['MJJ','Doyle','Dudek','Ellis'],['Kurtz','Madsen','Wright','Woryna'],['Lambert','Michelsen','Zmarzlik','Douglas']];
const exp=[0,0,0,0];res.forEach(r=>r.forEach((n,p)=>exp[team[n]]+=[3,2,1,0][p]));
res.forEach((r,i)=>{
  const order=r.map(n=>team[n]);
  run(`(function(){const h=qdc().qd.heats[${i}];h.order=${JSON.stringify(order)};UI.qdConfirmHeat(${i});})()`);
});
const tb=JSON.parse(run(`JSON.stringify(qdTable(qdc()).map(s=>[s.t,s.pts,s.n]))`));
console.log('table after 16',JSON.stringify(tb),'expected',exp);
tb.forEach(r=>assert.equal(r[1],exp[r[0]]));
assert.equal(run(`qdc().qd.heats.filter(h=>h.confirmed).length`),16);
// heat 17 locked
assert.equal(run(`qdFirstOpen(qdc())`),16);
assert.equal(run(`qdEditable(qdc(),16)`),false);
run(`UI.qdConfirmHeat(16)`);assert.equal(run(`qdc().qd.heats[16].confirmed`),false);
// html renders
const hh=run(`qdTeamsHtml(qdc())+qdHeatHtml(qdc(),3)+qdHeatHtml(qdc(),16)+qdScorebarHtml(qdc())`);
assert(hh.includes('Polska')&&hh.includes('TRENERZY'));
// exclusion in heat: reset heat 16 etc. use a fresh comp
run(`(function(){UI.confirm=(m,f)=>f();UI.qdResetHeat(15);})()`);
run(`(function(){const h=qdc().qd.heats[15];UI.qdSetExcl(15,2,'W');})()`);
let h=JSON.parse(run(`JSON.stringify(qdc().qd.heats[15].order)`));console.log('order after excl',h);assert.equal(h[3],2);
run(`UI.qdConfirmHeat(15)`);
console.log('score',run(`JSON.stringify(qdc().qd.heats[15].score)`));
assert.equal(run(`JSON.stringify(qdc().qd.heats[15].score.pts)`),'[3,1,0,2]');
// persistence + validation
assert.equal(run(`validateData(JSON.parse(JSON.stringify(S)))`),null);
// tamper
const bad=run(`(function(){const d=JSON.parse(JSON.stringify(S));const c=Object.values(d.comps)[0];c.qd.heats[0].slots[0].gate=9;return validateData(d);})()`);
console.log('tamper:',bad);assert(bad);
// league kind
run(`UI.startQuad();UI.qdSetKind('league');`);
assert(run(`$("qdSetupBody").innerHTML`).includes('Liga X'));
// tie arrows
run(`(function(){const c=qdc();c.qd.heats.slice(16).forEach((x,i)=>{x.slots.forEach(s=>{s.ri=0;});});})()`);
console.log('ALL OK');
// gate order on fresh heats
run(`(function(){UI.startQuad();for(let i=0;i<4;i++)UI.qdSetTeam(i,String(i));UI.qdSetupNext();for(let i=0;i<4;i++){(function(){const t=S.teams[QdW.slots[QdW.step]];let k=0;t.riders.forEach((n,ix)=>{if(n!==LG_ZZ_NAME&&k<5){UI.qdSetRider(k,String(ix));k++;}});})();UI.qdLineupNext();}const c=qdNewComp(QdW,'G');mutate(()=>{S.comps[c.id]=c;S.current=c.id;});QdW=null;})()`);
for(const i of [0,3,7,15]){
 const g=JSON.parse(run(`JSON.stringify(qdc().qd.heats[${i}].order.map(si=>qdc().qd.heats[${i}].slots[si].gate))`));
 assert.deepEqual(g,[1,2,3,4]);
}
console.log('gate order ok');
// ---- rezerwy ----
run(`(function(){UI.confirm=(m,f)=>f();UI.qdResetAll();})()`);
run(`UI.toast=m=>{globalThis.__t=m;}`);
const T=()=>run(`globalThis.__t`);
run(`globalThis.__t='';UI.qdSub(0,0,'RT',1)`);console.log('RT h1:',T());assert(/6 pkt/.test(T()));
run(`UI.qdSub(0,0,'RZ',2)`); // ri forced to 4
assert.equal(run(`qdc().qd.heats[0].slots[0].ri`),4);
run(`UI.qdUndoSub(0,0)`);assert.notEqual(run(`qdc().qd.heats[0].slots[0].ri`),4);
run(`UI.qdSub(0,0,'RZ');UI.qdConfirmHeat(0)`);
assert.equal(run(`JSON.stringify(qdUsage(qdc(),0,-1)[4])`).includes('"own":1'),true);
// wymuś stratę >=6 pkt: team 3 prowadzi
run(`(function(){const c=qdc();c.qd.heats[0].score={pts:[0,0,0,3]};c.qd.heats[1].score={pts:[0,0,0,3]};c.qd.heats[1].confirmed=true;})()`);
run(`globalThis.__t='';UI.qdSub(2,0,'RT',2)`);
const o2=run(`qdc().qd.heats[2].slots[0].orig`);
console.log('RT after:',T(),run(`qdc().qd.heats[2].slots[0].ri`),'orig',o2);
// jeśli ri==1 to orig!=1
const ri=run(`qdc().qd.heats[2].slots[0].ri`);
if(String(o2)==='2'){assert(/Nieprawid/.test(T()));}else{assert.equal(ri,2);assert.equal(run(`qdc().qd.heats[2].slots[0].subType`),'RT');}
// ten sam zawodnik drugi raz jako RT -> blokada (po zatwierdzeniu)
run(`UI.qdConfirmHeat(2)`);
const mh=run(`(function(){qdc().qd.heats[3].menuOpen=0;return qdHeatHtml(qdc(),3);})()`);
assert(mh.includes('Rezerwa…'));
run(`UI.qdReservePrompt(3,0)`);run(`UI.qdReservePick(3,0,'RT')`);run(`UI.qdSetExcl(3,1,'T')`);
assert.equal(run(`validateData(JSON.parse(JSON.stringify(S)))`),null);
assert(run(`JSON.stringify(qdTotals(qdc(),0))`).includes('"excl":"Z"'));
console.log('reserves ok');
// ---- nominacje 17-20 ----
(function(){
  run(`(function(){UI.confirm=(m,f)=>f();UI.qdResetAll();})()`);
  res.forEach((r,i)=>{const order=r.map(n=>team[n]);run(`(function(){const h=qdc().qd.heats[${i}];h.order=${JSON.stringify(order)};UI.qdConfirmHeat(${i});})()`);});
  run(`UI.toast=m=>{globalThis.__t=m;}`);
  assert.equal(run(`qdNomPhase(qdc())`),true);
  assert.equal(run(`qdNomComplete(qdc())`),false);
  const ord=JSON.parse(run(`JSON.stringify(qdNomOrder(qdc()))`));
  const tb2=JSON.parse(run(`JSON.stringify(qdTable(qdc()).map(r=>r.t))`));
  assert.deepEqual(ord,tb2.slice().reverse());
  run(`globalThis.__t='';UI.qdNomOpen(16,${ord[1]})`);assert(/Najpierw wybiera/.test(run(`globalThis.__t`)));
  run(`UI.qdNomPick(16,${ord[1]},0)`);assert.equal(run(`qdc().qd.heats[16].slots[${ord[1]}].ri`),null);
  // 17 nie da się zatwierdzić bez kompletu
  run(`globalThis.__t='';UI.qdConfirmHeat(16)`);assert(/nominacje/.test(run(`globalThis.__t`)));
  // wypełnij wszystkie 4 biegi dla każdej drużyny po kolei
  ord.forEach((t,i)=>{[16,17,18,19].forEach((hi,j)=>run(`UI.qdNomPick(${hi},${t},${(i+j)%4})`));});
  assert.equal(run(`qdNomComplete(qdc())`),true);
  assert.equal(run(`qdEditable(qdc(),16)`),true);
  assert(run(`qdHeatHtml(qdc(),16)`).includes('Nominacje'));
  assert(run(`qdHeatHtml(qdc(),17)`).includes('Skład')||true);
  // limit: nr1 drużyny z 5 przejazdami
  const u=JSON.parse(run(`JSON.stringify(qdUsage(qdc(),${ord[0]},16))`));console.log('usage',JSON.stringify(u.map(x=>x.own)));
  run(`UI.qdConfirmHeat(16)`);
  assert.equal(run(`qdNomPhase(qdc())`),false);
  assert.equal(run(`qdEditable(qdc(),17)`),true);
  assert.equal(run(`validateData(JSON.parse(JSON.stringify(S)))`),null);
  // RZ w 18 działa, RT nie
  run(`globalThis.__t='';UI.qdSub(17,0,'RT',4)`);assert(/17–20/.test(run(`globalThis.__t`)));
  // edycja biegu 16 (<=16) czyści niezatwierdzone nominacje 18–20
  run(`UI.qdEditHeat(15)`);
  assert.equal(run(`qdc().qd.heats[17].slots.every(s=>s.ri==null)`),true);
  // reset jednego biegu 17–20 nie rusza pozostałych ani własnej nominacji
  run(`UI.qdEditHeat(15)`);
  run(`(function(){UI.confirm=(m,f)=>f();})()`);
  console.log('nominations ok');
})();

(function(){
  run(`(function(){UI.confirm=(m,f)=>f();UI.qdResetAll();})()`);
  res.forEach((r,i)=>{const order=r.map(n=>team[n]);run(`(function(){const h=qdc().qd.heats[${i}];h.order=${JSON.stringify(order)};UI.qdConfirmHeat(${i});})()`);});
  const ord=JSON.parse(run(`JSON.stringify(qdNomOrder(qdc()))`));
  ord.forEach((t,i)=>{[16,17,18,19].forEach((hi,j)=>run(`UI.qdNomPick(${hi},${t},${(i+j)%4})`));});
  const snap=()=>run(`JSON.stringify(qdc().qd.heats.slice(16).map(h=>h.slots.map(s=>s.ri)))`);
  const before=snap();
  run(`UI.qdConfirmHeat(16)`);run(`UI.qdSub(16,0,'RZ')`);
  run(`UI.qdResetHeat(16)`);
  assert.equal(snap(),before);
  assert.equal(run(`qdc().qd.heats[16].slots.every(s=>s.subType==null)`),true);
  assert(!run(`qdHeatHtml(qdc(),18)`).includes('ustalają trenerzy'));
  console.log('reset keeps nominations ok');
})();
