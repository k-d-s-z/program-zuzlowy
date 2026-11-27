const {run,els}=require('./harness.js');const assert=require('assert');
run(`S.teams=[{name:'Klub A',riders:[LG_ZZ_NAME,'Jan K']},{name:'Polska',riders:['Z B'],national:true}];`);
run(`UI.openTeams('league')`);let t=els['teamList'].innerHTML;assert(t.includes('Klub A')&&!t.includes('Polska'));assert.equal(els['teamsTitle'].textContent,'DRUŻYNY LIGOWE');
run(`UI.openTeams('national')`);t=els['teamList'].innerHTML;assert(t.includes('Polska')&&!t.includes('Klub A'));assert.equal(els['teamsTitle'].textContent,'DRUŻYNY NARODOWE');
// pairs wizard lists only national
run(`UI.startPairs(7)`);const b=els['pmSetupBody'].innerHTML;assert(b.includes('Polska')&&!b.includes('Klub A'));
// league picker excludes national
run(`UI.startLeague()`);const l=els['lgTeamList'].innerHTML;assert(l.includes('Klub A')&&!l.includes('Polska'));
// add national team: no ZZ
run(`TeamKind='national';UI.addTeam();$('tn').value='Dania';`);
console.log('ok; people html check');
const fs=require('fs');const h=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
console.log(h.match(/<h3>DRUŻYNY<\/h3>[\s\S]{0,260}/)[0]);
