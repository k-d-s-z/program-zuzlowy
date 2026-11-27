const {run}=require('./harness.js');
const assert=require('assert');
const J=c=>JSON.parse(run(`JSON.stringify(${c})`));
run(`S.riders=['Maciej Janowski','Bartosz Zmarzlik'];S.juniors=[];S.rosters={SGP:['Bartosz Zmarzlik'],SEC:[],IMP:[],INNE:[]};
S.teams=[{name:'Sparta Wrocław',riders:[LG_ZZ_NAME,'Maciej Janowski']},{name:'Polska',riders:['Maciej Janowski'],national:true}];`);
const csv="﻿Imię;Nazwisko;J/S;Drużyna ligowa;Drużyna narodowa;Rozgrywki\r\n"+
"Maciej;Janowski;S;Unia Leszno;Polska;IMP, SGP, SEC\r\n"+
"jan;KOWALSKI;j;Unia Leszno;Polska;IMP\r\n"+
"Łukasz;Nowak;S;Włókniarz;brak;brak\r\n"+
"Bartosz;Zmarzlik;;;;sgp; MEMPJ\r\n"+
";;;;;\r\n"+
"Jan;Kowalski;;;;SEC\r\n"+
"Ala;Bez;X;Klub;;\r\n";
run(`globalThis.CSV=${JSON.stringify(csv)};globalThis.P=bdPlan(bdParseTable(CSV));`);
const P=J(`P`);
console.log(JSON.stringify(P,null,1).slice(0,1800));
assert.equal(P.errors.length,0);
assert.deepEqual(P.newRiders.sort(),['Jan Kowalski','Łukasz Nowak','Ala Bez'].sort());
assert(P.leagueMoves.some(x=>/Janowski: Sparta Wrocław → Unia Leszno/.test(x)));
assert.deepEqual(P.newSeries,['MEMPJ']);
assert(P.warns.some(w=>/występuje ponownie/.test(w)));
assert(P.warns.some(w=>/nieznana kategoria/.test(w)));
run(`bdApply(P)`);
assert.equal(J(`S.riders.length`),5);
assert.deepEqual(J(`S.juniors`),['Jan Kowalski']);
assert.deepEqual(J(`S.teams.find(t=>t.name==='Sparta Wrocław').riders`),['Zawodnik zastępowany']);
assert.deepEqual(J(`S.teams.find(t=>t.name==='Unia Leszno').riders`),['Zawodnik zastępowany','Maciej Janowski','Jan Kowalski']);
assert.deepEqual(J(`S.teams.find(t=>t.name==='Polska'&&t.national).riders`),['Maciej Janowski','Jan Kowalski']);
assert.deepEqual(J(`S.rosters.IMP`),['Maciej Janowski','Jan Kowalski']);
assert.deepEqual(J(`S.rosters.SEC.sort()`),['Jan Kowalski','Maciej Janowski']);
assert.deepEqual(J(`S.rosters.MEMPJ`),['Bartosz Zmarzlik']);
// ponowny import = brak zmian
run(`globalThis.P2=bdPlan(bdParseTable(CSV))`);
assert.equal(J(`P2.ops.length`),0);
console.log('P2',JSON.stringify(J(`P2.ops`)));
// TSV, cp1250-like quotes, comma
const tsv="Imię\tNazwisko\tJ/S\tDrużyna ligowa\tRozgrywki 1\tRozgrywki 2\nAdam\t\"Kowal, Jr\"\tS\tKlub\tIMP\tbrak\n";
assert.deepEqual(J(`bdParseTable(${JSON.stringify(tsv)})[1]`),['Adam','Kowal, Jr','S','Klub','IMP','brak']);
// błędy
assert.equal(J(`bdPlan(bdParseTable('A;B\\n1;2')).errors.length`),1);
assert.equal(J(`bdPlan(bdParseTable('Imię;Nazwisko')).errors.length`),1);
// export/template nie rzucają
run(`UI.baseExportSheet=UI.baseExportSheet;`);
console.log('bd ok');
