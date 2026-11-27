const {run}=require('./harness.js');const assert=require('assert');
const J=c=>JSON.parse(run(`JSON.stringify(${c})`));
run(`globalThis.RT=[];rtShow=(t,u)=>{RT.push(t);globalThis.UNDO=u;}`);
// ---- pary 7 ----
run(`S.teams=[];for(let i=0;i<8;i++)S.teams.push({name:'Team'+String.fromCharCode(65+i),riders:['R'+i+'a Nowak','R'+i+'b Kowal','R'+i+'c Rez'],national:true});
for(let i=0;i<8;i++)S.teams.push({name:'Liga'+i,riders:['L'+i+'a X','L'+i+'b Y','L'+i+'c Z','L'+i+'d W',LG_ZZ_NAME]});`);
function launch(n,scoring,finals,kind){
 run(`UI.startPairs(${n});UI.pmSetCfg('kind','${kind||'national'}');PmW.scoring='${scoring}';PmW.finals=${finals};var base=${kind==='league'?8:0};for(let i=0;i<${n};i++)UI.pmSetTeam(i,String(base+i));UI.pmSetupNext();`);
 for(let i=0;i<n;i++){run(`(function(){const w=PmW;if(!w.rost[w.step].r[0]){UI.pmSetRider(0,'0');UI.pmSetRider(1,'1');UI.pmSetRider(2,'2');}})();UI.pmLineupNext()`);}
 run(`(function(){const c=pmNewComp(PmW,'T');mutate(()=>{S.comps[c.id]=c;S.current=c.id;});PmW=null;})()`);
}

launch(7,'3210',true);
run(`UI.pmConfirmHeat(0)`);console.log('pairs h1:',J('RT'));
assert(/^Team[A-H]$/.test(J('RT')[0].rows[0][0])&&J('RT')[0].rows.length==2&&J('RT')[0].rows.every(r=>r[2]!==''));
run(`(function(){for(let i=1;i<21;i++)UI.pmConfirmHeat(i);})()`);
console.log('pairs h21:',J('RT[RT.length-1]'));
run(`RT.length=0;UI.pmConfirmHeat(21)`);console.log('pairs semi:',J('RT'));
run(`for(let i=22;i<pmc().pm.heats.length;i++)UI.pmConfirmHeat(i)`);console.log('pairs last:',J('RT[RT.length-1]'));
// cofnij
run(`UNDO()`);

assert(/^Koniec zawodów · /.test(J('RT[RT.length-1].title')));
run(`UNDO()`);assert.equal(run(`pmc().pm.heats[pmc().pm.heats.length-1].confirmed`),false);
console.log('pairs ok');
// ---- czwórmecz ----
run(`UI.confirm=(m,f)=>f();RT.length=0`);
run(`S.teams=[];S.riders=[];['Polska','Szwecja','Dania','Australia'].forEach((n,i)=>S.teams.push({name:n,riders:['P'+i+'a Nowak','P'+i+'b Kowal','P'+i+'c Z','P'+i+'d W','P'+i+'e R'],national:true}));
UI.startQuad();for(let i=0;i<4;i++)UI.qdSetTeam(i,String(i));UI.qdSetupNext();for(let i=0;i<4;i++)UI.qdLineupNext();`);
run(`(function(){const c=qdNewComp(QdW,'G');mutate(()=>{S.comps[c.id]=c;S.current=c.id;});QdW=null;})()`);
run(`UI.qdConfirmHeat(0)`);console.log('quad h1:',J('RT'));
assert.equal(J('RT')[0].rows.length,4);assert(J('RT')[0].rows.every(r=>r.length==3&&typeof r[2]=='number'));
console.log('quad ok');
// ---- liga ----
run(`RT.length=0`);
const nums=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
run(`(function(){const lu=n=>{const o={};for(let i=1;i<=15;i++)o[i]='R'+n+'-'+i+' Nowak';return o;};
 const c=newLeagueComp({home:{name:'Motor',lineup:lu('H')},away:{name:'Sparta',lineup:lu('A')}});
 mutate(()=>{S.comps[c.id]=c;S.current=c.id;});})()`);
run(`UI.lgConfirmHeat(0)`);console.log('liga h1:',J('RT'));
assert.deepEqual(J('RT')[0].rows.map(r=>r[0]),['Motor','Sparta']);
run(`(function(){for(let i=1;i<13;i++)UI.lgConfirmHeat(i);const m=lgm();[13,14].forEach(i=>{m.heats[i].confirmed=true;m.heats[i].score={home:3,away:3};});rtLeague(m,cur(),14);})()`);
console.log('liga last:',J('RT[RT.length-1]'));
assert(/^Koniec zawodów · /.test(J('RT[RT.length-1].title')));
run(`UNDO()`);assert.equal(run(`lgm().heats[14].confirmed`),false);
console.log('liga ok');
// ---- indywidualne ----
run(`RT.length=0;S.comps={};`);
run(`(function(){UI.newComp(20);const c=cur();for(let i=1;i<=16;i++)c.mapping[i]=(i===2?'Maciej Woryna':i===3?'Wiktor Woryna':'Z'+i+' Nowak'+i);})()`);
run(`UI.confirmHeat(1)`);console.log('ind h1:',J('RT'));
assert(J('RT')[0].rows.length>=3&&J('RT')[0].rows.every(r=>r.length==3));
const t=J('RT')[0];console.log(t);
console.log('ind ok');
