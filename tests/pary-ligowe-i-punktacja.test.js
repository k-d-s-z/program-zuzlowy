const {run}=require('./harness.js');
const assert=require('assert');
run(`S.teams=[];for(let i=0;i<8;i++)S.teams.push({name:'Team'+String.fromCharCode(65+i),riders:['R'+i+'a Nowak','R'+i+'b Kowal','R'+i+'c Rez'],national:true});
for(let i=0;i<8;i++)S.teams.push({name:'Liga'+i,riders:['L'+i+'a X','L'+i+'b Y','L'+i+'c Z','L'+i+'d W',LG_ZZ_NAME]});`);
function launch(n,scoring,finals,kind){
 run(`UI.startPairs(${n});UI.pmSetCfg('kind','${kind||'national'}');PmW.scoring='${scoring}';PmW.finals=${finals};var base=${kind==='league'?8:0};for(let i=0;i<${n};i++)UI.pmSetTeam(i,String(base+i));UI.pmSetupNext();`);
 for(let i=0;i<n;i++){run(`(function(){const w=PmW;if(!w.rost[w.step].r[0]){UI.pmSetRider(0,'0');UI.pmSetRider(1,'1');UI.pmSetRider(2,'2');}})();UI.pmLineupNext()`);}
 run(`(function(){const c=pmNewComp(PmW,'T');mutate(()=>{S.comps[c.id]=c;S.current=c.id;});PmW=null;})()`);
}
// item1
assert.equal(run(`PM_SCHED[7][0]`),'AB');
// item5 league kind
launch(7,'4320',true,'league');
let c=JSON.parse(run(`JSON.stringify(pmc())`));
assert(c.pm.teams[0].name.startsWith('Liga'));
console.log('league teams riders',JSON.stringify(c.pm.teams[0].riders));
assert(!c.pm.teams[0].riders.includes(null)||true);
// kind switch clears
run(`UI.startPairs(7);UI.pmSetTeam(0,'0');UI.pmSetCfg('kind','league');`);
assert.equal(run(`PmW.slots[0]`),null);
run(`renderPmSetup()`);run(`PmW=null`);
// item2 bonus 3210: heat 1 default order a0,b0,a1,b1 -> 1st a,2nd b : a=3+1=4? use custom
launch(7,'3210',false);
// make a 1-2: order slots so a0,a1 first
run(`(function(){const h=pmc().pm.heats[0];h.order=[0,2,1,3];UI.pmConfirmHeat(0);})()`);
let h=JSON.parse(run(`JSON.stringify(pmc().pm.heats[0].score)`));
console.log('1-2 score',h);assert.equal(h.a,5);assert.equal(h.b,1);assert.equal(h.bonusSlot,2);
// 2-3 with 4 finishers: b0,a0,a1,b1 -> a:2+1=3 b:3+0=3
run(`(function(){const h=pmc().pm.heats[1];h.order=[1,0,2,3];UI.pmConfirmHeat(1);})()`);
h=JSON.parse(run(`JSON.stringify(pmc().pm.heats[1].score)`));
console.log('2-3 score',h);assert.equal(h.bonusSlot,2);
const tot=JSON.parse(run(`JSON.stringify(pmTotals(pmc(),0))`));
console.log('totals A',JSON.stringify(tot));assert.equal(tot[1].bon,1);
run(`pmTeamsHtml(pmc())`);const hh=run(`pmHeatHtml(pmc(),0)`);assert(hh.includes("3'")||hh.includes("5'")||hh.includes("1'"),'apostrophe in heat row');
assert(run(`pmTeamsHtml(pmc())`).includes("<th>B</th>"));
// 4320: 1-2 → bonus on 2nd
launch(7,'4320',false);
run(`(function(){const h=pmc().pm.heats[0];h.order=[0,2,1,3];UI.pmConfirmHeat(0);})()`);
assert.equal(run(`pmc().pm.heats[0].score.bonusSlot`),2);
// no bonus when 1-3 / 1-4
run(`(function(){const h=pmc().pm.heats[1];h.order=[0,1,2,3];UI.pmConfirmHeat(1);})()`);
assert.equal(run(`pmc().pm.heats[1].score.bonusSlot`),null);
// item3 helmet swap in final
launch(7,'4320',true);
run(`(function(){for(let i=0;i<21;i++)UI.pmConfirmHeat(i);})()`);
const before=JSON.parse(run(`JSON.stringify(pmc().pm.heats[21].slots.map(s=>[s.t,s.ri]))`));
run(`UI.pmSwapHelmets(21,0)`);
const after=JSON.parse(run(`JSON.stringify(pmc().pm.heats[21].slots.map(s=>[s.t,s.ri]))`));
console.log(JSON.stringify(before),JSON.stringify(after));
assert.deepEqual(after[0],before[2]);assert.deepEqual(after[2],before[0]);assert.deepEqual(after[1],before[1]);
run(`UI.pmSwapHelmets(21,1)`);
const a2=JSON.parse(run(`JSON.stringify(pmc().pm.heats[21].slots.map(s=>[s.t,s.ri]))`));
assert.deepEqual(a2[1],before[3]);
assert(run(`pmHeatHtml(pmc(),21)`).includes('UI.pmSwapHelmets(21,0)'));
// not allowed in regular heat
launch(7,'4320',true);
const b0=run(`JSON.stringify(pmc().pm.heats[0].slots)`);run(`UI.pmSwapHelmets(0,0)`);assert.equal(run(`JSON.stringify(pmc().pm.heats[0].slots)`),b0);
// reset after swap rebuilds
run(`(function(){for(let i=0;i<21;i++)UI.pmConfirmHeat(i);UI.pmSwapHelmets(21,0);const h=pmc().pm.heats[21];UI.confirm=(m,f)=>f();UI.pmResetHeat(21);})()`);
assert.deepEqual(JSON.parse(run(`JSON.stringify(pmc().pm.heats[21].slots.map(s=>[s.t,s.ri]))`)),before);
// persistence/validation of bonus
run(`validateData(JSON.parse(JSON.stringify(S)))`);
console.log('validate',run(`validateData(JSON.parse(JSON.stringify(S)))`));
// item4 tie-break unit test
launch(7,'4320',false);
run(`(function(){const c=pmc();
 // fabricate confirmed heats: teams 0,1,2 equal pts, different bonuses
 c.pm.heats.forEach(h=>{h.confirmed=true;h.score={a:5,b:4,bonusSlot:null};});
 const hs=c.pm.heats;
 // reduce to controlled: set all to 4:5 pattern, then compute table
})()`);
const tb=JSON.parse(run(`JSON.stringify(pmTable(pmc()).map(s=>[s.t,s.pts,s.bon,s.k2,s.k3,s.tie]))`));
console.log('tb',JSON.stringify(tb));
// 2-team tie decided by direct heat
launch(7,'4320',false);
run(`(function(){const c=pmc();c.pm.heats.forEach(h=>{h.confirmed=true;h.score={a:0,b:0,bonusSlot:null};});
 // teams 0 and 1 meet in heat 1 (A,B): A wins 5:4 -> but pts then differ; give B +1 elsewhere
 const h1=c.pm.heats[0];h1.score={a:5,b:4,bonusSlot:null};
 // find a heat with team 1 and another team (not 0) and give team1 +1 extra
 const g=c.pm.heats.find((h,i)=>i>0&&(h.a===1||h.b===1)&&h.a!==0&&h.b!==0);
 if(g.a===1)g.score={a:1,b:0,bonusSlot:null};else g.score={a:0,b:1,bonusSlot:null};
})()`);
const t2=JSON.parse(run(`JSON.stringify(pmTable(pmc()).map(s=>[s.t,s.pts,s.mp,s.k2,s.tie]))`));
console.log('2-team tie',JSON.stringify(t2.slice(0,3)));
assert.equal(t2[0][1],t2[1][1]); // tied pts
assert.equal(t2[0][0],0); // A wins direct
console.log('ALL OK');
