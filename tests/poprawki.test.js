const {run,els}=require('./harness.js');const assert=require('assert');
const J=c=>JSON.parse(run(`JSON.stringify(${c})`));
// pisownia nazwisk: mieszana wielkość zostaje, całe małe/DUŻE → Wielka+małe
assert.equal(J(`normName('michell McDiarmid')`),'Michell McDiarmid');
assert.equal(J(`normName('JAN kowalski')`),'Jan Kowalski');
assert.equal(J(`normName("  anna o'brien-nowak ")`),"Anna O'Brien-Nowak".replace('Brien','Brien'));
// kaski w biegu 1 par 8 zespołów: czerwony↔biały, niebieski↔żółty; reszta bez zmian
run(`globalThis.c8={format:'pary8'};globalThis.c7={format:'pary7'};`);
const H=J(`[pmHelm(c8,{n:1,extra:false}),pmHelm(c8,{n:2,extra:false}),pmHelm(c7,{n:1,extra:false}),pmHelm(c8,{n:1,extra:true})]`);
assert.deepEqual(H[0],['#f8fafc','#ef4444','#eab308','#3b82f6']);
assert.deepEqual(H[1],['#ef4444','#f8fafc','#3b82f6','#eab308']);
assert.deepEqual(H[2],H[1]);assert.deepEqual(H[3],H[1]);
// kreator par: skład nie jest uzupełniany automatycznie (3 zawodników w drużynie → puste numery)
run(`S.teams=[];S.riders=[];for(let i=0;i<8;i++)S.teams.push({name:'C'+i,riders:['A'+i+' Zet','B'+i+' Ceh','C'+i+' Abe'],national:true});`);
run(`UI.startPairs(8);for(let i=0;i<8;i++)UI.pmSetTeam(i,String(i));UI.pmSetupNext();`);
assert.deepEqual(J(`PmW.rost[0].r`),[null,null,null]);
// lista rozwijalna wg nazwiska
run(`renderPmLineup()`);
const html=els['pmLineupBody'].innerHTML;
const names=[...html.matchAll(/<option value='\d+'>([^<]+)<\/option>/g)].map(m=>m[1]);
assert.deepEqual(names.slice(0,3),['C0 Abe','B0 Ceh','A0 Zet']);
console.log('poprawki ok');
// liga: pod numerami 8 (goście) i 16 (gospodarze) mogą startować tylko juniorzy
run(`S.riders=['S Senior','J Junior'];S.juniors=['J Junior'];S.teams=[{name:'A',riders:[LG_ZZ_NAME,'S Senior','J Junior']},{name:'B',riders:[LG_ZZ_NAME,'S Senior','J Junior']}];`);
run(`UI.toast=m=>{globalThis.__t=m;};LgW={home:{name:'A',teamIdx:0,lineup:{9:null,10:null,11:null,12:null,13:null,14:null,15:null,16:null}},away:{name:'B',teamIdx:1,lineup:{1:null,2:null,3:null,4:null,5:null,6:null,7:null,8:null}},side:'away'};`);
for(const [step,num] of [['away',8],['home',16]]){
  run(`LgLineupStep='${step}';globalThis.__t='';UI.lgSetLineup(${num},'1')`);       // 1 = S Senior
  assert(/wyłącznie juniora/.test(run('globalThis.__t')),'senior pod '+num);
  assert.equal(run(`LgW['${step}'].lineup[${num}]`),null);
  run(`UI.lgSetLineup(${num},'2')`);                                                   // 2 = J Junior
  assert.equal(run(`LgW['${step}'].lineup[${num}]`),'J Junior');
}
console.log('liga junior 8/16 ok');
// ekran drużyny: wiersz = nazwisko (+J); kategoria/usuwanie w menu zawodnika
run(`S.riders=['Adam Zet','Jan Abe','Ola Cez'];S.juniors=['Ola Cez'];S.teams=[{name:'T',riders:[LG_ZZ_NAME,'Adam Zet','Jan Abe','Ola Cez']}];S.uiTeam=0;`);
run(`renderTeamDetail()`);
const th=els['teamRiderList'].innerHTML;
assert(!/data-rm|data-cat-s/.test(th));
const order=[...th.matchAll(/data-trm='([^']+)'/g)].map(m=>m[1]);
assert.deepEqual(order,['Jan Abe','Ola Cez','Adam Zet']);   // wg nazwiska: Abe, Cez, Zet
assert(th.includes('rl-j')&&th.includes('Zawodnik zastępowany'));
run(`UI.teamRiderMenu('Adam Zet');$('catJ').onclick()`);
assert.deepEqual(J('S.juniors.sort()'),['Adam Zet','Ola Cez']);
run(`$('catS').onclick()`);
assert.deepEqual(J('S.juniors'),['Ola Cez']);
run(`UI.confirm=(m,f)=>f();$('trRm').onclick()`);
assert.deepEqual(J('S.teams[0].riders.includes("Adam Zet")'),false);
assert.deepEqual(J('S.riders.includes("Adam Zet")'),true);   // zostaje w bazie
console.log('ekran drużyny ok');
