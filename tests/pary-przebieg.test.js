const {run,els}=require('./harness.js');
const assert=require('assert');
// teams
run(`S.teams=[];for(let i=0;i<8;i++)S.teams.push({name:'Team'+String.fromCharCode(65+i),riders:['R'+i+'a Nowak','R'+i+'b Kowal','R'+i+'c Rez'],national:true});`);
function make(n,scoring,finals){
 run(`UI.startPairs(${n});PmW.scoring='${scoring}';PmW.finals=${finals};for(let i=0;i<${n};i++)UI.pmSetTeam(i,String(i));UI.pmSetupNext();for(let i=0;i<${n};i++){UI.pmLineupNext();}`);
 // last pmLineupNext opens name modal -> click ok
 run(`$('pmNameSkip').onclick&&$('pmNameSkip').onclick()`);
}
// onclick on stub: openModal sets innerHTML only; ids are not real. emulate launch:
function launch(n,scoring,finals){
 run(`UI.startPairs(${n});PmW.scoring='${scoring}';PmW.finals=${finals};for(let i=0;i<${n};i++)UI.pmSetTeam(i,String(i));UI.pmSetupNext();`);
 for(let i=0;i<n;i++){run(`UI.pmLineupNext()`);} // last opens modal
 run(`(function(){const w=PmW;const c=pmNewComp(w,'Test');mutate(()=>{S.comps[c.id]=c;S.current=c.id;S.settings.lastComp=c.id;});PmW=null;})()`);
}
launch(7,'4320',true);
let c=JSON.parse(run(`JSON.stringify(pmc())`));
assert.equal(c.format,'pary7');assert.equal(c.pm.heats.length,23);
// every pair exactly once
function pairsOK(n){const seen=new Set();const sc=JSON.parse(run(`JSON.stringify(PM_SCHED[${n}])`));sc.forEach(p=>{const k=[p[0],p[1]].sort().join('');assert(!seen.has(k),'dup '+k);seen.add(k)});assert.equal(seen.size,n*(n-1)/2);
 const cnt={};sc.forEach(p=>{cnt[p[0]]=(cnt[p[0]]||0)+1;cnt[p[1]]=(cnt[p[1]]||0)+1});Object.values(cnt).forEach(v=>assert.equal(v,n-1));}
pairsOK(7);pairsOK(8);
// play all RR heats: team a wins 4+3 vs 2+0 in default order (slot0,1,2,3 order -> a r0 first, b r0, a r1, b r1)
run(`(function(){const c=pmc();for(let i=0;i<21;i++){UI.pmConfirmHeat(i);}})()`);
c=JSON.parse(run(`JSON.stringify(pmc())`));
console.log('confirmed RR',c.pm.heats.filter(h=>h.confirmed).length);
// default order slots: a0(1st)=4, b0=3, a1=2, b1=0 => a=6,b=3
assert.equal(c.pm.heats[0].score.a,6);assert.equal(c.pm.heats[0].score.b,3);
console.log('table',JSON.stringify(run(`pmTable(pmc()).map(s=>[s.t,s.pts,s.played,s.tie])`)));
console.log('finals teams',JSON.stringify(run(`pmc().pm.heats.slice(21).map(h=>[h.n,h.a,h.b])`)));
// confirm baraż, final
run(`UI.pmConfirmHeat(21)`);
console.log('after baraz',JSON.stringify(run(`pmc().pm.heats.slice(21).map(h=>[h.n,h.a,h.b,h.confirmed,h.score])`)));
run(`UI.pmConfirmHeat(22)`);
console.log('places',JSON.stringify(run(`pmPlaces(pmc())`)));
// scoring 3210 and exclusion + reserve
launch(8,'3210',false);
run(`(function(){const c=pmc();UI.pmSetExcl(0,0,'T');})()`);
let h0=JSON.parse(run(`JSON.stringify(pmc().pm.heats[0])`));
console.log('heat1 order',h0.order,'excl',h0.slots.map(s=>s.excl));
run(`UI.pmPickSub(0,0)`);
h0=JSON.parse(run(`JSON.stringify(pmc().pm.heats[0])`));
console.log('after sub',h0.slots.map(s=>[s.t,s.ri,s.subType,s.excl]));
run(`UI.pmConfirmHeat(0)`);
h0=JSON.parse(run(`JSON.stringify(pmc().pm.heats[0])`));
console.log('score 3210 w/ sub',h0.score);
// excluded rider no sub: 3 finishers -> 3,2,1
launch(8,'3210',false);
run(`UI.pmSetExcl(0,2,'W');UI.pmConfirmHeat(0)`);
console.log('excl W score',JSON.stringify(run(`pmc().pm.heats[0].score`)),JSON.stringify(run(`pmTotals(pmc(),0).map(x=>x.cells)`)));
// 4320 with exclusion -> 4,3,2
launch(7,'4320',false);
run(`UI.pmSetExcl(0,3,'D');UI.pmConfirmHeat(0)`);
console.log('4320 excl score',JSON.stringify(run(`pmc().pm.heats[0].score`)));
// out of order confirm blocked
run(`UI.pmConfirmHeat(3)`);assert.equal(run(`pmc().pm.heats[3].confirmed`),false);
// render doesn't throw
run(`pmRender();renderPmSetup&&0`);
console.log('render ok, teamsHtml len',run(`pmTeamsHtml(pmc()).length`),'heatHtml len',run(`pmHeatHtml(pmc(),1).length`));
// validate export/import schema
const err=run(`validateData({riders:S.riders,teams:S.teams,juniors:[],rosters:{},comps:S.comps})`);
console.log('validate:',err);
// saved list / home
run(`renderSaved();renderHome();`);
console.log('saved html',els['savedList'].innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,200));
console.log('ALL OK');
