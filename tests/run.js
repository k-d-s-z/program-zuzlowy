/* Uruchamia wszystkie testy: node tests/run.js — każdy plik *.test.js w osobnym procesie. */
const {readdirSync}=require("fs"),{spawnSync}=require("child_process"),path=require("path");
let fail=0;
for(const f of readdirSync(__dirname).filter(f=>f.endsWith(".test.js")).sort()){
  const r=spawnSync(process.execPath,[path.join(__dirname,f)],{encoding:"utf8"});
  const ok=r.status===0;if(!ok)fail++;
  console.log((ok?"OK    ":"BŁĄD ")+f);
  if(!ok)console.log((r.stderr||r.stdout||"").split("\n").slice(0,12).join("\n"));
}
console.log(fail?fail+" test(ów) nie przeszło":"Wszystkie testy przeszły");
process.exit(fail?1:0);
