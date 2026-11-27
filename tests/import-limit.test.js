const {run}=require('./harness.js');const assert=require('assert');
const J=c=>JSON.parse(run(`JSON.stringify(${c})`));
// limit zawodników: plan ma zwrócić błąd, nie rzucić wyjątku
run(`S.riders=[];S.juniors=[];S.teams=[];S.rosters={SGP:[],SEC:[],IMP:[],INNE:[]};`);
let csv="Imię;Nazwisko\n";for(let i=0;i<IMPORT_N();i++)csv+="A"+i+";B"+i+"\n";
function IMPORT_N(){return JSON.parse(run('JSON.stringify(IMPORT_LIMITS.riders+5)'));}
const P=J(`bdPlan(bdParseTable(${JSON.stringify(csv)}),true)`);
console.log(P.errors);assert(P.errors.some(e=>/limit/.test(e)));
console.log('limit ok');
