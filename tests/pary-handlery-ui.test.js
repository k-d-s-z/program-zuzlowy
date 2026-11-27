const {run,els}=require('./harness.js');const assert=require('assert');
// CALL regex & arg parser check: collect all data-onclick strings produced by pm renders and verify they parse
run(`S.teams=[];for(let i=0;i<8;i++)S.teams.push({name:'T'+i,riders:['A'+i+' X','B'+i+' Y','C'+i+' Z'],national:true});`);
run(`UI.startPairs(8);for(let i=0;i<8;i++)UI.pmSetTeam(i,String(i));UI.pmSetupNext();`);
let html=[];
html.push(els['pmSetupBody'].innerHTML);
run(`renderPmLineup()`);html.push(els['pmLineupBody'].innerHTML);
run(`(function(){const w=PmW;const c=pmNewComp(w,'X');mutate(()=>{S.comps[c.id]=c;S.current=c.id;});PmW=null;})();pmRender();UI.pmSetExcl(0,0,'U/-');`);
html.push(els['pmHeatsWrap'].innerHTML,els['pmTeamsWrap'].innerHTML,els['pmScorebar'].innerHTML);
const all=html.join('\n');
const calls=[...all.matchAll(/data-on(?:click|change)='([^']*)'/g)].map(m=>m[1]);
console.log('handlers',calls.length);
const src=require('fs').readFileSync(require('path').join(__dirname,'..','app.js'),'utf8');
const callRe=src.match(/const CALL=(\/.*\/\w*);/);console.log('CALL',callRe&&callRe[1]);
const CALL=eval(callRe[1]);
let bad=0;const names=new Set();
calls.forEach(c=>{const m=CALL.exec(c.trim());if(!m){bad++;console.log('NO MATCH',c);return;}names.add(m[1]);
  const ok=run(`typeof UI[${JSON.stringify(m[1])}]==='function'`);if(!ok){bad++;console.log('MISSING UI fn',m[1]);}
  m[2].trim()&&m[2].split(',').forEach(a=>{const t=a.trim();if(!(/^-?\d+(\.\d+)?$/.test(t)||/^'[^']*'$/.test(t)||/^"[^"]*"$/.test(t)||['this','this.value','null','true','false'].includes(t))){bad++;console.log('BAD ARG',c,'->',t);}});});
console.log('functions used:',[...names].join(' '));
assert.equal(bad,0);
// reload from storage
run(`const keep=Object.keys(S.comps).length;S=DB.loadAll();`);
console.log('reloaded comps',run(`Object.keys(S.comps).length`),'pm ok',run(`(function(){const c=Object.values(S.comps).find(x=>x.pairs);return !!c&&c.pm.heats.length})()`));
// full round trip via export-like validate with all comps
console.log('validate reload',run(`validateData({riders:S.riders,teams:S.teams,juniors:[],rosters:{},comps:S.comps})`));
// tamper test
run(`(function(){const c=Object.values(S.comps).find(x=>x.pairs);c.pm.heats[0].slots[0].ri=7;})()`);
console.log('validate tampered:',run(`validateData({riders:S.riders,teams:S.teams,juniors:[],rosters:{},comps:S.comps})`));
console.log('OK');
