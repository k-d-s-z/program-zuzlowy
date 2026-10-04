"use strict";
const T20=[
[1,2,3,4],[5,7,6,8],[10,11,9,12],[15,14,16,13],[13,1,5,9],[14,10,2,6],[11,15,7,3],[4,8,12,16],
[6,16,1,11],[12,5,15,2],[8,9,3,14],[13,4,10,7],[7,12,14,1],[2,13,8,11],[16,3,10,5],[9,6,4,15],
[1,8,15,10],[9,2,7,16],[3,12,13,6],[5,14,11,4]];
const GATES=["A","B","C","D"];
const GATE_ORDER_DISPLAY=["D","C","B","A"];
const GATE_COLOR={A:"#ef4444",B:"#3b82f6",C:"#f8fafc",D:"#eab308"};
const MARKS=["W","D","T","U","W2","U/-","-"];
/* Zastępstwo (rezerwa 17/18) dozwolone tylko przy tych kodach; W, D, U — bez zastępstwa. */
const SUB_CODES=["T","W2","U/-","-"];
const LS="zuzel.v1";
const DATA_SCHEMA=2; /* wersja formatu kopii zapasowej (brak pola = kopia sprzed wersjonowania) */

const ICON_EDIT='<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
const ICON_RESET='<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>';
const ICON_CLOCK='<svg viewBox="0 0 24 24"><path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
const ICON_LOCK_SM='<svg viewBox="0 0 24 24" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;fill:currentColor"><path d="M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1zM12 3a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z"/></svg>';
const ICON_UP='<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>';
const ICON_DOWN='<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
const ICON_FLAG='<svg viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>';
const ICON_X='<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

/* Bezpieczny dostęp do localStorage — w iframe/trybie prywatnym dostęp może rzucać wyjątkiem.
   Bez magazynu aplikacja działa w pamięci (dane znikają po zamknięciu karty). */
const store={
  get(k){try{return localStorage.getItem(k);}catch(e){return null;}},
  /* Zapis rzuca wyjątek przy błędzie (np. pełny magazyn) — wyciszenie błędu
     mogłoby suggestować udany zapis. Odbiorcy (persist/persistAll) łapią i raportują. */
  set(k,v){localStorage.setItem(k,v);},
  remove(k){try{localStorage.removeItem(k);}catch(e){}},
  keys(){try{const out=[];for(let i=0;i<localStorage.length;i++)out.push(localStorage.key(i));return out;}catch(e){return [];}}
};
/* Automatyczna kopia stanu zawodów tuż przed startem (jedna na zawody; nie trafia do eksportu). */
function prestartSnapshot(c){
  try{const k=LS+".prestart."+c.id;if(store.get(k)==null)store.set(k,JSON.stringify({savedAt:Date.now(),comp:c}));}catch(e){}
}
/* Naprawa danych zapisanych przed poprawką kodowania: uszkodzone ciągi (np. zamiast "Ż" litery obce)
   wracają do właściwej postaci. Dotyczy zapisanych zawodów, bazy zawodników i kopii. */
const MOJI_RE=/[\u00c2-\u00f4][\u0080-\u00bf]+/g;
function fixMojiStr(s){
  if(!MOJI_RE.test(s)){MOJI_RE.lastIndex=0;return s;}
  MOJI_RE.lastIndex=0;
  return s.replace(MOJI_RE,m=>{
    try{return new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(m,c=>c.charCodeAt(0)));}catch(e){return m;}
  });
}
function fixMojiDeep(v){
  if(typeof v==="string")return fixMojiStr(v);
  if(Array.isArray(v)){for(let i=0;i<v.length;i++)v[i]=fixMojiDeep(v[i]);return v;}
  if(v&&typeof v==="object"){
    Object.keys(v).forEach(k=>{const nk=fixMojiStr(k);const val=fixMojiDeep(v[k]);if(nk!==k)delete v[k];v[nk]=val;});
  }
  return v;
}
const DB={
  metaKey:LS+".meta",
  compKey:id=>LS+".c."+id,
  get(k){try{return fixMojiDeep(JSON.parse(store.get(k)));}catch(e){return null;}},
  set(k,v){return store.set(k,JSON.stringify(v));},
  /* Migracja ze starego, jednego klucza zuzel.v1 */
  migrateOld(){
    const old=this.get(LS);
    if(!old||typeof old!=="object"||!old.comps)return;
    try{
      this.set(this.metaKey,{riders:Array.isArray(old.riders)?old.riders:[],current:old.current||null});
      Object.values(old.comps).forEach(c=>{if(c&&c.id)this.set(this.compKey(c.id),c);});
      store.remove(LS);
    }catch(e){}
  },
  loadAll(){
    this.migrateOld();
    const meta=this.get(this.metaKey)||{};
    const comps={};
    store.keys().forEach(k=>{
      if(k&&k.indexOf(LS+".c.")===0){
        const c=this.get(k);
        if(c&&c.id)comps[c.id]=c;
      }
    });
    return {riders:Array.isArray(meta.riders)?meta.riders:[],comps,current:(meta.current&&comps[meta.current])?meta.current:null,
      teams:Array.isArray(meta.teams)?meta.teams:[],
      juniors:Array.isArray(meta.juniors)?meta.juniors:[],
      rosters:(meta.rosters&&typeof meta.rosters==="object")?meta.rosters:{SGP:[],SEC:[],IMP:[],INNE:[]},
      settings:Object.assign({font:"M"},(meta.settings&&typeof meta.settings==="object")?meta.settings:{})};
  },
  removeComp(id){store.remove(this.compKey(id));store.remove(LS+".prestart."+id);}
};
let S=DB.loadAll();
function persist(){
  /* Atomowość na miarę localStorage: przed zapisem pamiętamy poprzednie wartości kluczy; jeśeli którykolwiek zapis rzuci, przywracamy STARY stan w storage — dzięki temu RAM i dysk nie rozjeżdżają się po połączonym zapisie. */
  const meta={riders:S.riders,current:S.current,settings:S.settings,teams:S.teams,juniors:S.juniors,rosters:S.rosters};
  const c=cur();
  const cKey=c?DB.compKey(c.id):null;
  const oldMeta=store.get(DB.metaKey);
  const oldComp=cKey?store.get(cKey):null;
  const oldCompExisted=cKey?store.get(cKey)!==null:false;
  try{
    DB.set(DB.metaKey,meta);
    if(c)DB.set(cKey,c);
    return true;
  }catch(e){
    try{
      if(oldMeta!=null)store.set(DB.metaKey,oldMeta);else store.remove(DB.metaKey);
      if(cKey){if(oldCompExisted)store.set(cKey,oldComp);else store.remove(cKey);}
    }catch(e2){}
    UI.toast("❌ Zapis nieudany — brak miejsca w pamięci przeglądarki.");
    return false;
  }
}
function persistAll(){
  try{
    DB.set(DB.metaKey,{riders:S.riders,current:S.current,settings:S.settings,teams:S.teams,juniors:S.juniors,rosters:S.rosters});
    Object.values(S.comps).forEach(c=>DB.set(DB.compKey(c.id),c));
    return true;
  }catch(e){UI.toast("❌ Zapis nieudany — brak miejsca w pamięci przeglądarki.");return false;}
}
/* Transakcyjna mutacja: snapshot → operacja → zapis; przy błędzie operacji
   LUB nieudanym zapisie następuje rollback stanu i widoczny komunikat. */
function mutate(fn){
  const snap=JSON.stringify(S);
  try{fn();}
  catch(err){try{S=JSON.parse(snap);}catch(e2){}UI.toast("❌ Błąd operacji — zmiany cofnięte.");return false;}
  if(!persist()){
    try{S=JSON.parse(snap);}catch(e2){}
    UI.toast("❌ Zapis nieudany — zmiany cofnięte.");
    return false;
  }
  return true;
}
/* Batchowanie renderów przez requestAnimationFrame (mniej DOM thrashingu). */
let _rafPending=false;
function scheduleRenders(){
  if(_rafPending)return;_rafPending=true;
  requestAnimationFrame(()=>{_rafPending=false;
    if($("races").classList.contains("on"))renderRaces();
    if($("points").classList.contains("on"))renderPoints();
  });
}

/* Pomocnicza funkcja do sformatowania nazwy/numeru biegu (np. "21", "D1", "D2") */
function getHeatLabel(h){
  if(h.extra) return "D" + (h.n - 100);
  return String(h.n);
}

/* Formatuje liczbę milisekund jako "SS,mmm" (np. 64254 -> "64,254"). */
function fmtHeatTime(ms){
  ms=ms||0;
  return Math.floor(ms/1000)+","+String(ms%1000).padStart(3,"0");
}

function newComp(fmt){
  const heats=[];
  for(let n=1;n<=fmt;n++){
    const entries=[];
    if(n<=20){for(let g=0;g<4;g++)entries.push({gate:GATES[g],rider:T20[n-1][g],mark:null,repl:null});}
    else{for(let g=0;g<4;g++)entries.push({gate:GATES[g],rider:null,mark:null,repl:null});}
    heats.push({n,entries,order:GATE_ORDER_DISPLAY.map((_,i)=>i),confirmed:false,extra:false});
  }
  return {id:(typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():("c"+Date.now()),date:new Date().toLocaleDateString("pl-PL"),format:fmt,heats,mapping:{},overrides:{}};
}
function cur(){return S.current?S.comps[S.current]:null;}
function compHeats(c){return (c.heats.length?c.heats:c.heats0);}

function normalizeOrder(h){
  const fins=h.order.filter(i=>!h.entries[i].mark);
  const marks=h.order.filter(i=>h.entries[i].mark)
    .sort((a,b)=>(h.entries[b].markSeq||0)-(h.entries[a].markSeq||0));
  h.order=[...fins,...marks];
}

function removeRepl(h,slotIdx){
  const idx=h.entries.findIndex(x=>x.replOf===slotIdx);
  if(idx<0)return;
  h.entries.splice(idx,1);
  h.order=h.order.filter(i=>i!==idx).map(i=>i>idx?i-1:i);
}
function effRider(e){return e.repl!==null&&e.repl!==undefined?e.repl:e.rider;}

function heatResults(h){
  const res={};
  if(!h.confirmed)return res;
  h.entries.forEach(e=>{
    if(e.mark&&e.rider!==null&&e.rider!==undefined)res[e.rider]={pts:0,mark:e.mark};
  });
  let rank=0;
  h.order.forEach(ei=>{
    const e=h.entries[ei];
    if(e.mark)return;
    const fin=e.rider;
    if(fin!==null&&fin!==undefined){
      const p=[3,2,1,0][Math.min(rank,3)];rank++;
      if(res[fin])res[fin].pts=p;else res[fin]={pts:p,mark:null};
    }
  });
  return res;
}
function fmtRes(rr){return rr?((rr.mark!==null&&rr.mark!==undefined)?escq(rr.mark):rr.pts+" pkt"):"";}

function standings(c,upto){
  const st={};
  for(let n=1;n<=18;n++)if(c.mapping[n])st[n]={num:n,pts:0,c3:0,c2:0,c1:0,c0:0,x:0};
  compHeats(c).forEach(h=>{
    if(!h.confirmed || h.extra || (upto && h.n>upto)) return;
    const r=heatResults(h);
    for(const[k,v]of Object.entries(r)){
      if(!st[k])continue;
      st[k].pts+=v.pts;
      if(v.mark)st[k].x++;
      else{if(v.pts===3)st[k].c3++;else if(v.pts===2)st[k].c2++;else if(v.pts===1)st[k].c1++;else st[k].c0++;}
    }
  });
  return st;
}
function cmpGroup(a,b){
  const ra=a.num>=17&&a.pts<=0,rb=b.num>=17&&b.pts<=0;
  if(ra!==rb)return ra?1:-1;
  return b.pts-a.pts||b.c3-a.c3||b.c2-a.c2||b.c1-a.c1||b.c0-a.c0||a.x-b.x;
}
function cmpStats(a,b){return cmpGroup(a,b)||a.num-b.num;}

function heatFinishOrder(h){
  if(!h||!h.confirmed)return null;
  const res=[];
  h.order.forEach(ei=>{
    const e=h.entries[ei];
    if(e.mark)return;
    if(e.rider!==null&&e.rider!==undefined)res.push(e.rider);
  });
  return res;
}

function bracketOrder(c){
  if(c.format!==22&&c.format!==23)return null;
  const heats=compHeats(c);
  const byN=n=>heats.find(x=>x.n===n);
  const arr20=Object.values(standings(c,20)).sort(cmpStats).map(r=>r.num);
  const rank=n=>arr20.indexOf(n);
  const result={};let changed=false;

  if(c.format===23){
    const f23=heatFinishOrder(byN(23));
    const f21=heatFinishOrder(byN(21));
    const f22=heatFinishOrder(byN(22));
    if(f23&&f23.length){f23.forEach((num,i)=>{result[i+1]=num;});changed=true;}
    if(f21&&f21.length>=4&&f22&&f22.length>=4){
      [[1,5],[2,7],[3,9]].forEach(([idx,base])=>{
        const a=f21[idx],b=f22[idx];
        if(a===undefined||b===undefined)return;
        const better=rank(a)<=rank(b)?a:b;
        const worse=better===a?b:a;
        result[base]=better;result[base+1]=worse;
      });
      changed=true;
    }
  }else if(c.format===22){
    const f22=heatFinishOrder(byN(22));
    const f21=heatFinishOrder(byN(21));
    if(f22&&f22.length){f22.forEach((num,i)=>{result[i+1]=num;});changed=true;}
    if(f21&&f21.length>=4){
      result[5]=f21[2];result[6]=f21[3];changed=true;
    }
  }
  return changed?result:null;
}

/* Punkty wirtualne z bezpośrednich pojedynków między wskazanymi zawodnikami:
   w każdym zatwierdzonym (nie dodatkowym) biegu, za każdą parę z grupy, która
   ukończyła bieg, zawodnik wyżej sklasyfikowany dostaje 1 wirtualny punkt. */
function h2hPoints(c,nums){
  const set=new Set(nums);const pts={};nums.forEach(n=>pts[n]=0);
  compHeats(c).forEach(h=>{
    if(!h.confirmed||h.extra)return;
    const fins=[];
    h.order.forEach(ei=>{
      const e=h.entries[ei];
      if(e.mark)return;
      const r=e.rider;
      if(r!==null&&r!==undefined&&set.has(r))fins.push(r);
    });
    for(let i=0;i<fins.length;i++)for(let j=i+1;j<fins.length;j++)pts[fins[i]]++;
  });
  return pts;
}
/* Dzieli grupy remisowe wg punktów bezpośrednich pojedynków (gdy opcja włączona).
   Zawodnicy z równą liczbą punktów pozostają w podgrupie do ręcznego rozstrzygnięcia. */
function splitGroupsH2H(c,groups){
  if(!c.h2h)return groups;
  const out=[];
  groups.forEach(g=>{
    if(g.nums.length<2){out.push(g);return;}
    const pts=h2hPoints(c,g.nums);
    const sorted=[...g.nums].sort((a,b)=>pts[b]-pts[a]);
    let i=0;
    while(i<sorted.length){
      let j=i+1;
      while(j<sorted.length&&pts[sorted[j]]===pts[sorted[i]])j++;
      out.push({start:g.start+i,nums:sorted.slice(i,j),stats:g.stats});
      i=j;
    }
  });
  return out;
}
function placeGroups(c){
  const bracket=bracketOrder(c);
  const arr=Object.values(standings(c)).sort(cmpStats);
  if(!bracket){
    const out=[];let curG=null;
    arr.forEach((r,i)=>{
      if(curG&&cmpGroup(curG.stats,r)===0){curG.nums.push(r.num);curG.stats=r;}
      else{curG={start:i+1,nums:[r.num],stats:r};out.push(curG);}
    });
    return splitGroupsH2H(c,out);
  }
  const fixedNums=new Set(Object.values(bracket));
  const remaining=arr.filter(r=>!fixedNums.has(r.num));
  const out=[];
  let ri=0,place=1;
  const total=arr.length;
  while(place<=total){
    if(bracket[place]!==undefined){
      const num=bracket[place];
      const stat=arr.find(r=>r.num===num)||{num,pts:0,c3:0,c2:0,c1:0,c0:0,x:0};
      out.push({start:place,nums:[num],stats:stat});
      place++;
    }else{
      if(ri>=remaining.length){place++;continue;}
      let g={start:place,nums:[remaining[ri].num],stats:remaining[ri]};
      let j=ri+1;
      while(j<remaining.length&&cmpGroup(g.stats,remaining[j])===0){g.nums.push(remaining[j].num);g.stats=remaining[j];j++;}
      out.push(g);
      place+=g.nums.length;
      ri=j;
    }
  }
  return splitGroupsH2H(c,out);
}
function placeLabel(c,num,groups){
  const gs=groups||placeGroups(c);
  for(const g of gs){
    if(!g.nums.includes(num))continue;
    const end=g.start+g.nums.length-1;
    if(g.nums.length===1)return String(g.start);
    if(c.overrides[num])return String(c.overrides[num]);
    const taken=g.nums.map(n=>c.overrides[n]).filter(Boolean);
    const free=[];for(let p=g.start;p<=end;p++)if(!taken.includes(p))free.push(p);
    return free.length===1?String(free[0]):(free.length?free[0]+"–"+free[free.length-1]:g.start+"–"+end);
  }
  return "";
}

/* ================= UI ================= */
const $=id=>document.getElementById(id);
/* Przełącznik kategorii J/S w oknach „Dodaj zawodnika” — kategoria od razu
   trafia do S.juniors, dzięki czemu nowego zawodnika można od razu przypisać
   do drużyny (6-7 / 14-15 to miejsca juniorów) i do serii indywidualnych. */
function lgCatToggleHtml(){
  return "<div style='display:flex;gap:8px;margin-bottom:12px'>"+
    "<button class='btn small primary' style='flex:1' id='catS'>Senior (S)</button>"+
    "<button class='btn small secondary' style='flex:1' id='catJ'>Junior (J)</button></div>";
}
function lgBindCatToggle(){
  let jr=false;
  const paint=()=>{
    $("catS").className="btn small "+(jr?"secondary":"primary");
    $("catJ").className="btn small "+(jr?"primary":"secondary");
  };
  $("catS").onclick=()=>{jr=false;paint();};
  $("catJ").onclick=()=>{jr=true;paint();};
  return ()=>jr;
}
function lgSetJuniorFlag(name,jr){
  if(!S.juniors)S.juniors=[];
  if(jr){if(!S.juniors.includes(name))S.juniors.push(name);}
  else S.juniors=S.juniors.filter(n=>n!==name);
}
const IC={
  home:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  teams:"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  flag:"M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z",
  reset:"M15 16h4v2h-4zm0-8h7v2h-7zm0-4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z",
  sort:"M3 18h6v-2H3v2zm0-12v2h18V6H3zm0 7h12v-2H3v2z",
  next:"M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
};
function fbtn(cls,title,act,ic,id){
  return "<button class='fbtn "+cls+"'"+(id?" id='"+id+"'":"")+" title='"+title+"' data-onclick='"+act+"'><svg viewBox='0 0 24 24'><path d='"+IC[ic]+"'/></svg></button>";
}
const UI={
  screen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("on"));$(id).classList.add("on");
    if(id==="riders")renderRiderLib();if(id==="options"){renderSaved();renderSettings();}if(id==="points")renderPoints();
    if(id==="races")renderRaces();if(id==="lineup")renderLineup();if(id==="home"){S.current=null;persist();renderHome();}
    if(id==="people"){S.uiSeries=null;}
    if(id==="teams")renderTeams();if(id==="teamDetail")renderTeamDetail();
    if(id==="lgTeam")renderLgTeamPick();if(id==="lgLineup")renderLgLineup();
    if(id==="match")lgRender();
    UI.syncNavIcons();
    if(id==="races")requestAnimationFrame(scrollToCurrentHeat);
  },
  continueLast(){const id=S.settings.lastComp;if(id&&S.comps[id])UI.openComp(id);},
  /* Nawigacja ikonowa (Klasyfikacja / Wyścigi) w nagłówkach obu ekranów. */
  navScreen(id){
    if(!cur()){UI.toast("Brak otwartych zawodów.");return;}
    UI.screen(id);
  },
  syncNavIcons(){
    const on=document.querySelector(".screen.on");
    const sid=on?on.id:"";
    document.querySelectorAll(".navpts").forEach(b=>b.classList.toggle("active",sid==="points"));
    document.querySelectorAll(".navraces").forEach(b=>b.classList.toggle("active",sid==="races"));
  },
  toast(t){
    const el=$("toast");const err=/^\s*❌/.test(String(t));
    el.textContent=t;el.classList.toggle("err",err);el.style.display="block";
    clearTimeout(UI._toastT);
    UI._toastT=setTimeout(()=>{el.style.display="none";},err?4500:2200);
  },
  openModal(html,locked){
    const m=$("modal");
    if(!$("overlay").classList.contains("on"))UI._prevFocus=document.activeElement;
    UI._modalLock=!!locked; /* locked=true — okna nie zamyka kliknięcie w tło ani Esc */
    m.innerHTML=html;
    m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.tabIndex=-1;
    const h=m.querySelector("h3");
    if(h){if(!h.id)h.id="modalTitle";m.setAttribute("aria-labelledby",h.id);}
    $("overlay").classList.add("on");
    /* Fokus: pole tekstowe, jeśli jest; w przeciwnym razie sam dialog. */
    const inp=m.querySelector("input[type=text]");
    try{(inp||m).focus({preventScroll:true});}catch(e){}
    /* A11y: tło staje się nieosiągalne dla klawiatury i czytników ekranu. */
    const wrap=document.querySelector(".wrap");
    if(wrap&&"inert" in wrap){wrap.inert=true;wrap.setAttribute("aria-hidden","true");}
  },
  closeModal(){
    if(UI._timeKeyHandler){document.removeEventListener("keydown",UI._timeKeyHandler);UI._timeKeyHandler=null;}
    UI._modalLock=false;
    $("overlay").classList.remove("on");
    const wrap=document.querySelector(".wrap");
    if(wrap&&"inert" in wrap){wrap.inert=false;wrap.removeAttribute("aria-hidden");}if($("races").classList.contains("on"))renderRaces();if($("lineup").classList.contains("on"))renderLineup();
    const pf=UI._prevFocus;UI._prevFocus=null;
    if(pf&&document.contains(pf)&&pf.focus){try{pf.focus({preventScroll:true});}catch(e){}}
  },
  confirm(msg,onYes,onNo){UI.openModal("<h3>Potwierdzenie</h3><p style='margin-bottom:14px;text-align:center;'>"+msg+"</p><button class='btn primary' id='cy'>Tak</button><button class='btn' id='cn'>Nie</button>");
    $("cy").onclick=()=>{UI.closeModal();onYes&&onYes();};
    $("cn").onclick=()=>{UI.closeModal();onNo?onNo():null;};},

  addRider(num){
    UI.openModal("<h3>Dodaj zawodnika</h3><label for='nr' class='sr-label'>Imię i nazwisko</label><input type='text' id='nr' placeholder='Imię i Nazwisko' style='width:100%;margin-bottom:12px'>" + lgCatToggleHtml() + "<button class='btn primary' id='ok'>Dodaj</button><button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
    const isJr=lgBindCatToggle();
    $("ok").onclick=()=>{const v=normName(cleanText($("nr").value,100));if(!v)return;
      mutate(()=>{
        if(!S.riders.includes(v))S.riders.push(v);
        lgSetJuniorFlag(v,isJr());
        const c=cur();
        if(c){
          /* Z okna wyboru numeru: nowy zawodnik trafia dokładnie pod wskazany numer. */
          let target=(typeof num==="number"&&num>=1&&num<=18)?num:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].find(n=>!c.mapping[n]);
          if(target){
            Object.keys(c.mapping).forEach(k=>{if(+k!==target&&c.mapping[k]===v)delete c.mapping[k];});
            c.mapping[target]=v;
          }
        }
      });
      renderRiderLib();
      if($("lineup").classList.contains("on"))renderLineup();
      UI.closeModal();scheduleRenders();};
    $("nr").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();$("ok").click();}});
  },
  editRider(i){
    const old=S.riders[i];
    UI.openModal("<h3>Edycja</h3><label for='nr' class='sr-label'>Imię i nazwisko</label><input type='text' id='nr' value='"+escq(old)+"' style='width:100%;margin-bottom:12px'>" + lgCatToggleHtml() + "<button class='btn primary' id='ok'>Zapisz</button><button class='btn danger' id='del'>Usuń</button><button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
    const isJr=lgBindCatToggle();
    if((S.juniors||[]).includes(old))$("catJ").click();
    const refreshRiderViews=()=>{renderRiderLib();if($("teamDetail").classList.contains("on"))renderTeamDetail();};
    /* Zmiana nazwiska nie może po cichu przepisywać historii zapisanych zawodów. */
    const applyRename=(v,everywhere)=>{
      const snap=JSON.stringify(S);
      S.riders[i]=v;
      lgSetJuniorFlag(v,isJr());
      Object.keys(S.rosters).forEach(k=>{S.rosters[k]=S.rosters[k].map(n=>n===old?v:n);});
      if(S.juniors)S.juniors=S.juniors.map(n=>n===old?v:n);
      S.teams.forEach(t=>{t.riders=t.riders.map(n=>n===old?v:n);});
      if(everywhere)Object.values(S.comps).forEach(c=>{
        Object.keys(c.mapping).forEach(k=>{if(c.mapping[k]===old)c.mapping[k]=v;});
        if(c.league){
          [c.home,c.away].forEach(side=>{Object.keys(side.lineup).forEach(k=>{if(side.lineup[k]===old)side.lineup[k]=v;});});
        }
      });
      if(!persistAll()){try{S=JSON.parse(snap);}catch(e){}return;}
      refreshRiderViews();UI.closeModal();
    };
    $("ok").onclick=()=>{
      const v=normName(cleanText($("nr").value,100));if(!v)return;
      if(v===old){
        /* Nazwisko bez zmian — zapisujemy ewentualną tylko zmianę kategorii S/J. */
        if(!mutate(()=>{lgSetJuniorFlag(v,isJr());}))return;
        UI.closeModal();refreshRiderViews();return;}
      if(S.riders.includes(v)){UI.toast("❌ Taki zawodnik już istnieje w bazie.");return;}
      const used=Object.values(S.comps).filter(c=>Object.values(c.mapping).includes(old)).length;
      if(!used){applyRename(v,false);return;}
      UI.openModal("<h3>Zmiana nazwiska</h3><p style='text-align:center;margin:0 0 12px'>„"+escq(old)+"” występuje w zapisanych zawodach ("+used+"). Zmienić nazwisko także tam?</p>"+
        "<button class='btn primary' id='rnAll'>Tak — w bazie i we wszystkich zawodach</button>"+
        "<button class='btn' id='rnLib'>Tylko w bazie (zawody bez zmian)</button>"+
        "<button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
      $("rnAll").onclick=()=>applyRename(v,true);
      $("rnLib").onclick=()=>applyRename(v,false);
    };
    $("del").onclick=()=>{UI.closeModal();UI.confirm("Usunąć zawodnika <b>"+escq(old)+"</b> z bazy?<br><small style='color:var(--text-muted)'>Nazwisko pozostanie w już utworzonych zawodach — ich wyniki się nie zmienią.</small>",()=>{
      const snap=JSON.stringify(S);
      S.riders.splice(i,1);
      if(!persist()){try{S=JSON.parse(snap);}catch(e){}return;}
      refreshRiderViews();});};
    $("nr").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();$("ok").click();}});
  },
  startComp(){UI.screen("pick");},
  newComp(fmt){
    const c=newComp(fmt);S.comps[c.id]=c;S.current=c.id;c.launched=false;persist();
    UI.screen("lineup");
  },
  cancelLineup(){UI.confirm("Porzucić tworzenie zawodów?",()=>{const id=S.current;delete S.comps[id];S.current=null;DB.removeComp(id);persist();UI.screen("home");});},
  launch(){
    const c=cur();if(!c)return;
    if(!c.mapping[1]){UI.toast("Przypisz zawodnika nr 1.");return;}
    const go=()=>{prestartSnapshot(c);c.launched=true;S.settings.lastComp=c.id;persist();UI.screen("points");};
    if(!c.name){UI.promptName(go);return;}
    go();
  },
  promptName(cb){
    const c=cur();if(!c)return;
    UI.openModal("<h3>Nazwa zawodów</h3><input type='text' id='compName' placeholder='np. Grand Prix Polski w Lublinie' style='margin-bottom:12px'><button class='btn primary' id='nameOk'>Zapisz</button><button class='btn' id='nameSkip'>Domyślna nazwa</button>");
    const fin=(v)=>{c.name=cleanText(v,80)||("Zawody "+c.format+"-biegowe");persist();UI.closeModal();cb&&cb();};
    $("nameOk").onclick=()=>{fin($("compName").value);};
    $("nameSkip").onclick=()=>{fin("");};
  },
  renameComp(id){
    const c=S.comps[id];if(!c)return;
    UI.openModal("<h3>Zmień nazwę zawodów</h3><input type='text' id='compName2' value=\""+escq(c.name||"")+"\" style='margin-bottom:12px'><button class='btn primary' id='renOk'>Zapisz</button><button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
    $("renOk").onclick=()=>{
      const v=cleanText($("compName2").value,80);
      if(v)c.name=v;
      DB.set(DB.compKey(id),c);renderSaved();
      UI.closeModal();
    };
  },
  leave(){
    const c=cur();
    let msg="Na pewno wrócić do ekranu głównego?<br><small style='color:var(--text-muted)'>Bieżący stan zawodów zostanie automatycznie zapisany.</small>";
    if(c){
      const heats=compHeats(c).filter(h=>!h.extra);
      const openCnt=heats.filter(h=>!h.confirmed).length;
      const doneCnt=heats.filter(h=>h.confirmed).length;
      if(doneCnt>0&&openCnt>0)
        msg="<b style='color:var(--amber)'>⚠ Uwaga: zawody w toku — "+openCnt+" niezatwierdzonych biegów.</b><br><small style='color:var(--text-muted)'>Bieżący stan zostanie zapisany i można do nich wrócić z ekranu głównego.</small>";
    }
    UI.confirm(msg,()=>{UI.screen("home");});
  },
  exportData(){
    persist();
    const n=Object.keys(S.comps||{}).length;
    /* Bez zapisanych zawodów nie ma o co pytać — kopia zawiera samą bazę (zawodnicy, drużyny, listy serii). */
    if(!n){UI.doExport(false);return;}
    UI.openModal("<h3>Zapisz kopię danych</h3><p style='text-align:center;margin:0 0 14px'>Kopia zawsze zawiera zawodników, drużyny oraz listy zawodników SGP, SEC, IMP i INNE.<br>Czy dołączyć też historię zawodów ("+n+")?</p>"+
      "<button class='btn primary' id='xyes'>Z historią zawodów</button>"+
      "<button class='btn' id='xno'>Bez historii zawodów</button>"+
      "<button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
    $("xyes").onclick=()=>{UI.closeModal();UI.doExport(true);};
    $("xno").onclick=()=>{UI.closeModal();UI.doExport(false);};
  },
  doExport(withComps){
    const dt=new Date(),p2=n=>String(n).padStart(2,"0");
    const stamp=dt.getFullYear()+"-"+p2(dt.getMonth()+1)+"-"+p2(dt.getDate())+"_"+p2(dt.getHours())+p2(dt.getMinutes());
    /* Ustawienia (rozmiar czcionki) są specyficzne dla urządzenia — nie trafiają do kopii. */
    const out={schemaVersion:DATA_SCHEMA,exportedAt:dt.toISOString(),riders:S.riders,teams:S.teams,juniors:S.juniors,rosters:S.rosters};
    if(withComps)out.comps=S.comps;
    const blob=new Blob([JSON.stringify(out,null,1)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=(withComps?"program-zuzel_":"program-zuzel-baza_")+stamp+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  },
  importData(inp){
    const f=inp.files[0];if(!f)return;
    if(f.size>IMPORT_LIMITS.bytes){UI.toast("❌ Plik jest zbyt duży (limit 5 MB).");inp.value="";return;}
    const rd=new FileReader();
    rd.onload=()=>{
      let d;
      try{d=fixMojiDeep(JSON.parse(rd.result));}catch(e){UI.toast("❌ Błąd pliku — to nie jest JSON.");return;}
      /* Pełna walidacja schematu przed nadpisaniem danych — chroni pętle renderujące przed uszkodzonymi obiektami. */
      if(d&&typeof d==="object"&&typeof d.schemaVersion==="number"&&d.schemaVersion>DATA_SCHEMA){UI.toast("❌ Kopia pochodzi z nowszej wersji aplikacji — zaktualizuj aplikację.");return;}
      const err=validateData(d);
      if(err){UI.toast("❌ Nieprawidłowa kopia: "+err);return;}
      const hasComps=d.comps!==undefined;
      UI.confirm("<b>Kopia"+(d.exportedAt&&!isNaN(new Date(d.exportedAt))?" z "+escq(new Date(d.exportedAt).toLocaleString("pl-PL")):"")+":</b><br>"+d.riders.length+" zawodników · "+(Array.isArray(d.teams)?d.teams.length:0)+" drużyn · "+(hasComps?Object.keys(d.comps).length+" zawodów":"bez historii zawodów")+"<br><br>"+(hasComps?"Przywrócenie kopii zastąpi WSZYSTKIE obecne dane (zawodników, drużyny, listy SGP/SEC/IMP/INNE i historię zawodów). Kontynuować?":"Przywrócenie kopii zastąpi obecnych zawodników, drużyny i listy SGP/SEC/IMP/INNE. Historia zawodów zostanie zachowana. Kontynuować?"),()=>{
        /* Sanityzacja tekstów z pliku: znaki kontrolne i limity długości — także po walidacji. */
        d.riders=d.riders.map(r=>cleanText(r,100)).filter(Boolean);
        d.teams=(Array.isArray(d.teams)?d.teams:[]).map(t=>({...t,name:cleanText(t.name,100)||"Drużyna",riders:t.riders.map(r=>cleanText(r,100)).filter(Boolean)}));
        d.juniors=(Array.isArray(d.juniors)?d.juniors:[]).map(r=>cleanText(r,100)).filter(Boolean);
        if(d.rosters&&typeof d.rosters==="object"){const ro={};Object.keys(d.rosters).forEach(k=>{const kk=cleanText(k,10);if(!kk||kk==="__proto__"||kk==="constructor"||kk==="prototype")return;ro[kk]=d.rosters[k].map(r=>cleanText(r,100)).filter(Boolean);});d.rosters=ro;}
        if(!hasComps)d.comps={};
        Object.values(d.comps).forEach(c=>{["home","away"].forEach(k=>{if(c&&c[k]&&typeof c[k].name==="string")c[k].name=cleanText(c[k].name,100);});});
        Object.values(d.comps).forEach(c=>{
          if(c.name)c.name=cleanText(c.name,80);
          if(!c.overrides)c.overrides={};
          Object.keys(c.mapping).forEach(k=>{c.mapping[k]=cleanText(c.mapping[k],100);});
        });
        /* Zapis transakcyjny: najpierw NOWE dane, dopiero potem usunięcie starych.
           Przy błędzie (np. brak miejsca) stan sprzed importu jest w całości odtwarzany. */
        const oldS=S;
        const oldIds=Object.keys(oldS.comps||{});
        const newIds=hasComps?Object.keys(d.comps):[];
        try{
          newIds.forEach(id=>DB.set(DB.compKey(id),d.comps[id]));
          if(hasComps)oldIds.filter(id=>!d.comps[id]).forEach(id=>DB.removeComp(id));
          S={riders:d.riders,comps:hasComps?d.comps:oldS.comps,current:hasComps?null:oldS.current,settings:oldS.settings,
             teams:Array.isArray(d.teams)?d.teams:[],
             juniors:Array.isArray(d.juniors)?d.juniors:[],
             rosters:(d.rosters&&typeof d.rosters==="object")?d.rosters:{SGP:[],SEC:[],IMP:[],INNE:[]}};
          DB.set(DB.metaKey,{riders:S.riders,current:S.current,settings:S.settings,teams:S.teams,juniors:S.juniors,rosters:S.rosters});
        }catch(e){
          try{
            newIds.filter(id=>!oldS.comps[id]).forEach(id=>DB.removeComp(id));
            oldIds.forEach(id=>DB.set(DB.compKey(id),oldS.comps[id]));
            DB.set(DB.metaKey,{riders:oldS.riders,current:oldS.current,settings:oldS.settings,teams:oldS.teams,juniors:oldS.juniors,rosters:oldS.rosters});
          }catch(e2){}
          S=oldS;
          UI.toast("❌ Import nieudany — dane sprzed importu zostały zachowane.");
          renderSaved();
          return;
        }
        UI.toast("✔ Przywrócono kopię danych.");renderSaved();
      });
    };
    rd.readAsText(f);inp.value="";
  },
  setRider(num,name){
    const c=cur();if(!c)return;
    if(!mutate(()=>{
      if(name==="")delete c.mapping[num];else c.mapping[num]=name;
      Object.keys(c.mapping).forEach(k=>{if(k!=num&&c.mapping[k]===name&&name!=="")delete c.mapping[k];});
    }))return;
    UI.closeModal();
    if($("lineup").classList.contains("on"))renderLineup();
    scheduleRenders();
  },

  /* Custom picker zamiast natywnego <select> — pełnowymiarowe, dotykowe przyciski. */
  pickLineup(num){    const c=cur();if(!c)return;
    if(!S.riders.length){
      UI.openModal("<h3>Nr "+num+" — wybierz zawodnika</h3><p style='text-align:center;color:var(--text-muted)'>Brak utworzonych zawodników. Zanim rozpoczniesz zawody utwórz zawodników w sekcji</p><button class='btn secondary' data-onclick='UI.goPeople()'>Zawodnicy i drużyny</button><button class='btn danger' style='margin-top:10px' id='rpClear0'>— Brak zawodnika —</button><button class='btn' style='margin-top:10px' data-onclick='UI.closeModal()'>Anuluj</button>");
      $("rpClear0").onclick=()=>UI.clearRider(num);
      return;
    }
    riderPicker({title:"Nr "+num+" — wybierz zawodnika",names:S.riders,
      onPick:name=>UI.setRider(num,name),
      clear:{label:"— Brak zawodnika —",fn:()=>UI.clearRider(num)}});
  },
  clearRider(num){UI.setRider(num,"");},

  /* ==== Ustawienia aplikacji (globalne, niezależne od zawodów) ==== */
  setFont(sz){
    S.settings.font=sz;persist();UI.applyFont();renderSettings();
  },
  /* Sortowanie klasyfikacji: wg numerów startowych albo wg zajmowanego miejsca. */
  toggleSort(){
    S.settings.sortByPlace=!S.settings.sortByPlace;persist();renderPoints();
  },
  applyFont(){
    const map={S:"13px",M:"16px",L:"19px"};
    document.documentElement.style.fontSize=map[S.settings.font]||"16px";
  },

  /* Przełącznik rozstrzygania remisów bezpośrednimi pojedynkami — suwak, bez potwierdzenia. */
  toggleH2H(fromModal){
    const c=cur();if(!c)return;
    const reopen=()=>{if(fromModal===true)UI.tieRules();};
    const apply=()=>{
      if(mutate(()=>{c.h2h=!c.h2h;c.overrides={};})){renderLineup();renderPoints();scheduleRenders();}
    };
    if(c.overrides&&Object.keys(c.overrides).length){
      UI.confirm("Zmiana zasady usunie ręczne rozstrzygnięcia remisów w tych zawodach. Zmienić?",()=>{apply();reopen();},reopen);
    }else apply();
  },


  resolveTie(num){
    const c=cur();if(!c)return;
    const gs=placeGroups(c);
    const g=gs.find(x=>x.nums.includes(num));
    if(!g||g.nums.length<2)return;

    const end=g.start+g.nums.length-1;
    const currentPick=c.overrides[num];

    let html="<h3>Rozstrzygnięcie miejsca</h3>";
    if(c.h2h){
      const pts=h2hPoints(c,g.nums);
      const sorted=[...g.nums].sort((a,b)=>pts[b]-pts[a]);
      html+="<p style='text-align:center;color:var(--text-muted);font-size:0.78rem;margin:0 0 6px'>Bezpośrednie pojedynki — punkty wirtualne:</p>";
      html+="<div style='border:1px solid var(--border-color);border-radius:10px;margin:0 0 12px;overflow:hidden'>";
      html+=sorted.map(n=>"<div style='display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid var(--border-color);font-size:0.85rem"+(n===num?";background:rgba(56,189,248,0.12)":"")+"'><span><span class='ridernum'>"+n+"</span>"+escq(c.mapping[n]||"?")+"</span><b>"+pts[n]+" pkt</b></div>").join("");
      html+="</div>";
    }
    html+="<p style='text-align:center;'>Wybierz dokładne miejsce dla zawodnika nr <b>"+num+" ("+escq(c.mapping[num]||"?")+")</b>:</p>";
    
    for(let p=g.start;p<=end;p++){
      html+="<button class='btn "+(currentPick===p?"primary":"")+"' data-onclick='UI.setTieOverride("+num+","+p+")'>Miejsce "+p+"</button>";
    }
    if(currentPick){
      html+="<button class='btn danger' data-onclick='UI.clearTieOverride("+num+")'>Cofnij wybór (Przywróć "+g.start+"–"+end+")</button>";
    }
    html+="<button class='btn' style='margin-top:10px' data-onclick='UI.closeModal()'>Anuluj</button>";
    UI.openModal(html);
  },

  setTieOverride(num,place){
    const c=cur();if(!c)return;
    const gs=placeGroups(c);
    const g=gs.find(x=>x.nums.includes(num));
    if(!g)return;

    if(!mutate(()=>{
      c.overrides[num]=place;
      if(g.nums.length===2){
        const otherNum=g.nums.find(n=>n!==num);
        const otherPlace=(place===g.start)?(g.start+1):g.start;
        c.overrides[otherNum]=otherPlace;
      }
    }))return;
    UI.closeModal();renderPoints();
  },

  clearTieOverride(num){
    const c=cur();if(!c)return;
    const gs=placeGroups(c);
    const g=gs.find(x=>x.nums.includes(num));
    if(!mutate(()=>{
      if(g)g.nums.forEach(n=>delete c.overrides[n]);
    }))return;
    UI.closeModal();renderPoints();
  },

  moveRider(heatN,slotIdx,dir){
    const c=cur();if(!c)return;
    const h=compHeats(c).find(x=>x.n===heatN);
    const ok=mutate(()=>{
      const fins=h.order.filter(i=>!h.entries[i].mark);
      const marks=h.order.filter(i=>h.entries[i].mark);
      const idx=fins.indexOf(slotIdx);
      const newIdx=idx+dir;
      if(idx<0||newIdx<0||newIdx>=fins.length)return;
      [fins[idx],fins[newIdx]]=[fins[newIdx],fins[idx]];
      h.order=[...fins,...marks];
    });
    if(!ok)return;
    /* Celowana aktualizacja tylko tej karty biegu — bez przerysowania całej listy. */
    updateHeatCard(h);
  },

  pickOpenRider(heatN,slotIdx){
    const c=cur();if(!c)return;
    const heats=compHeats(c),h=heats.find(x=>x.n===heatN);
    const base=standings(c,20);const arr=Object.values(base).sort(cmpStats).map(r=>r.num);
    const need20=heats.filter(x=>!x.extra&&x.n<=20).every(x=>x.confirmed);
    
    if(!need20&&(c.format>20 || h.extra)){UI.toast("Zatwierdź najpierw biegi 1–20.");return;}

    let pool=[];
    if(h.extra){
      pool=arr;
    }else if(c.format===23){
      if(heatN<=22) pool=arr.slice(2,10);
      else {
        const h21=heats.find(x=>x.n===21), h22=heats.find(x=>x.n===22);
        if(!h21.confirmed||!h22.confirmed){UI.toast("Zatwierdź najpierw biegi 21 i 22.");return;}
        const w21=Number(Object.entries(heatResults(h21)).find(([,v])=>v.pts===3)?.[0]);
        const w22=Number(Object.entries(heatResults(h22)).find(([,v])=>v.pts===3)?.[0]);
        pool=[arr[0],arr[1],w21,w22].filter(Boolean);
      }
    }else if(c.format===22){
      if(heatN===21) pool=arr.slice(2,6);
      else if(heatN===22){
        const h21=heats.find(x=>x.n===21);
        if(!h21.confirmed){UI.toast("Zatwierdź najpierw bieg 21.");return;}
        const top2=(heatFinishOrder(h21)||[]).slice(0,2);
        pool=[...new Set([arr[0],arr[1],...top2])].filter(n=>n!==undefined&&n!==null);
      }
    }

    const takenInCurrent=h.entries.map(effRider).filter(r=>r!==null);
    let opts=pool.filter(n=>!takenInCurrent.includes(n));

    if(!h.extra && c.format===23 && heatN===22){
      const h21=heats.find(x=>x.n===21);
      if(h21){
        const takenIn21=h21.entries.map(effRider).filter(r=>r!==null);
        opts=opts.filter(n=>!takenIn21.includes(n));
      }
    }

    let html="<h3>Wybór zawodnika — bieg "+getHeatLabel(h)+"</h3>";
    if(!opts.length) html+="<p style='text-align:center;color:var(--text-muted)'>Brak dostępnych zawodników.</p>";
    else html+=opts.map(n=>"<button class='btn' data-onclick='UI.setOpenRider("+heatN+","+slotIdx+","+n+")'>"+n+" — "+escq(c.mapping[n]||"?")+"</button>").join("");
    html+="<button class='btn' style='margin-top:10px' data-onclick='UI.closeModal()'>Anuluj</button>";
    UI.openModal(html);
  },

  setOpenRider(heatN,slotIdx,num){
    const c=cur();const h=compHeats(c).find(x=>x.n===heatN);
    if(!mutate(()=>{
      h.entries[slotIdx].rider=num;h.entries[slotIdx].repl=null;h.entries[slotIdx].mark=null;
    }))return;
    UI.closeModal();renderRaces();
  },
  markerMenu(heatN,slotIdx){
    const c=cur();if(!c)return;
    const h=compHeats(c).find(x=>x.n===heatN);
    const e=h.entries[slotIdx];
    let html="<h3>Wykluczenie — "+escq(c.mapping[e.rider]||"?")+"</h3>";
    if(e.mark){
      html+="<p style='text-align:center;font-size:0.78rem;color:var(--text-muted);margin:0 0 10px'>Obecnie: <b>"+escq(e.mark)+"</b>"+(e.repl?" (zast. "+escq(c.mapping[e.repl]||"?")+")":"")+". Wybierz inny kod, aby go zmienić"+(SUB_CODES.includes(e.mark)?" (ten sam kod — zmiana zastępcy)":"")+".</p>";
    }
    html+=MARKS.map((m,mi)=>"<button class='btn small "+(e.mark===m?"primary":"")+"' style='margin:3px;width:auto' data-onclick='UI.setMarkIdx("+heatN+","+slotIdx+","+mi+")'>"+m+"</button>").join("");
    if(e.mark)html+="<button class='btn danger' data-onclick='UI.setMark("+heatN+","+slotIdx+",null)'>Usuń wykluczenie</button>";
    html+="<button class='btn' style='margin-top:10px' data-onclick='UI.closeModal()'>Anuluj</button>";
    UI.openModal(html);
  },
  setMarkIdx(heatN,slotIdx,mi){UI.setMark(heatN,slotIdx,MARKS[mi]);},
  setMark(heatN,slotIdx,mark){
    const c=cur();const h=compHeats(c).find(x=>x.n===heatN);
    const e=h.entries[slotIdx];
    /* Zabezpieczenie: nie wolno oznaczać wpisu zastępstwa (zagnieżdżone zastępstwo psuje model). */
    if(e.replOf!==undefined&&e.replOf!==null){UI.toast("Nie można oznaczyć zastępcy — usuń zastępstwo i oznacz ponownie.");return;}
    const hadMark=!!e.mark;
    if(!mutate(()=>{
      removeRepl(h,slotIdx);
      e.mark=mark;e.repl=null;
      if(mark!==null&&!(e.markSeq&&hadMark)){c.markSeq=(c.markSeq||0)+1;e.markSeq=c.markSeq;}
      if(mark===null)delete e.markSeq;
      normalizeOrder(h);
    }))return;
    if(mark===null){UI.closeModal();scheduleRenders();return;}
    renderRaces();
    if(!SUB_CODES.includes(mark)){UI.closeModal();return;}

    const pool=[17,18].filter(n=>c.mapping[n]&&!h.entries.some(x=>x.rider===n&&(!x.mark||x.replOf!==undefined&&x.replOf!==null)));
    let html="<h3>Wybór zastępstwa</h3><p style='text-align:center'>Oznaczenie: <b>"+escq(mark)+"</b></p>";
    if(pool.length)html+=pool.map(n=>"<button class='btn' data-onclick='UI.setRepl("+heatN+","+slotIdx+","+n+")'>Nr "+n+" ("+escq(c.mapping[n])+")</button>").join("");
    html+="<button class='btn' data-onclick='UI.setRepl("+heatN+","+slotIdx+",null)'>Bez zastępstwa</button>";
    UI.openModal(html);
  },
  setRepl(heatN,slotIdx,num){
    const c=cur();const h=compHeats(c).find(x=>x.n===heatN);
    if(!mutate(()=>{
      removeRepl(h,slotIdx);
      if(num!==null){
        h.entries[slotIdx].repl=num;
        h.entries.push({gate:h.entries[slotIdx].gate,rider:num,mark:null,repl:null,replOf:slotIdx});
        const ni=h.entries.length-1;
        h.order=[...h.order.filter(i=>!h.entries[i].mark),ni,...h.order.filter(i=>h.entries[i].mark)];
      }else{h.entries[slotIdx].repl=null;}
    }))return;
    UI.closeModal();scheduleRenders();
  },

  confirmHeat(heatN){
    const c=cur();const h=compHeats(c).find(x=>x.n===heatN);
    const isBase=e=>e.replOf===undefined||e.replOf===null;
    /* Kto faktycznie jedzie: podstawowi bez oznaczenia + zastępcy (wpisy zastępstwa).
       Oznaczony zawodnik NIE jedzie — jego jazdę reprezentuje jedynie wpis zastępstwa.
       Zastępstwo = dokładnie jedna jazda, nigdy dwie. */
    const riders=[];
    h.entries.forEach(e=>{
      if(!isBase(e)){riders.push(e.rider);return;}
      if(!e.mark)riders.push(e.rider);
    });
    if(h.entries.some(e=>isBase(e)&&e.rider===null)){UI.toast("Uzupełnij obsadę wyścigu.");return;}
    if(riders.some(r=>r===null)){UI.toast("Uzupełnij obsadę wyścigu.");return;}
    if(new Set(riders).size!==riders.length){UI.toast("Zawodnik nie może jechać dwukrotnie.");return;}

    if(!mutate(()=>{normalizeOrder(h);h.confirmed=true;}))return;
    scheduleRenders();
    /* Automatyczne przejście do następnego (otwartego) biegu po zatwierdzeniu. */
    const heats=compHeats(c);
    const next=heats.find(x=>!x.confirmed&&x.n>h.n&&!x.extra)||heats.find(x=>!x.confirmed&&!x.extra);
    if(next){
      const el=document.getElementById("heat-"+next.n);
      if(el)setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),50);
    }
  },

  editHeat(heatN){
    const c=cur();const h=compHeats(c).find(x=>x.n===heatN);
    h.confirmed=false;persist();renderRaces();renderPoints();
  },

  resetHeat(heatN){
    const c=cur();if(!c)return;
    const h=compHeats(c).find(x=>x.n===heatN);
    UI.confirm("Zresetować bieg "+getHeatLabel(h)+" do stanu sprzed wyścigu?",()=>{
      if(!mutate(()=>{
        h.entries=h.entries.filter(e=>e.replOf===undefined||e.replOf===null);
        h.entries.forEach(e=>{
          if(h.n>20 || h.extra) e.rider=null;
          e.mark=null;e.repl=null;delete e.markSeq;
        });
        h.order=h.entries.map((_,i)=>i);
        h.confirmed=false;
        delete h.time;
      }))return;
      scheduleRenders();
    });
  },

  resetAllHeats(){
    const c=cur();if(!c)return;
    UI.confirm("Zresetować WSZYSTKIE wyścigi do stanu sprzed zawodów? Wyniki, oznaczenia i biegi dodatkowe zostaną usunięte. Tej operacji nie można cofnąć.",()=>{
      if(!mutate(()=>{
        c.heats=c.heats.filter(h=>!h.extra);
        c.heats.forEach(h=>{
          h.entries=h.entries.filter(e=>e.replOf===undefined||e.replOf===null);
          h.entries.forEach(e=>{
            if(h.n>20) e.rider=null;
            e.mark=null;e.repl=null;delete e.markSeq;
          });
          h.order=h.entries.map((_,i)=>i);
          h.confirmed=false;
          delete h.time;
        });
        c.overrides={};
        delete c.markSeq;
      }))return;
      scheduleRenders();
      UI.toast("Zresetowano wszystkie wyścigi.");
    });
  },

  editHeatTime(heatN){
    const c=cur();if(!c)return;
    const h=compHeats(c).find(x=>x.n===heatN);
    /* Stan roboczy wewnątrz modułu UI (nie na window). Czas trzymany jako liczba całkowita
       milisekund — trzy ostatnie wpisane cyfry zawsze lądują po przecinku (np. 64,254). */
    UI._timeHeatN=heatN;
    UI._timeMs=h.time?Math.round(parseFloat(h.time.replace(",","."))*1000):0;
    let html="<h3>Czas biegu "+getHeatLabel(h)+"</h3>";
    html+="<p style='text-align:center;color:var(--text-muted);font-size:0.75rem;margin:0 0 10px'>Wpisz cyfry</p>";
    html+="<div class='timedisplay' id='timeVal'>"+fmtHeatTime(UI._timeMs)+"</div>";
    html+="<div class='numpad'>";
    for(let d=1;d<=9;d++)html+="<button class='btn' data-onclick='UI.timeDigit("+d+")'>"+d+"</button>";
    html+="<button class='btn secondary' data-onclick='UI.timeBackspace()'>⌫</button>";
    html+="<button class='btn' data-onclick='UI.timeDigit(0)'>0</button>";
    html+="<button class='btn danger' data-onclick='UI.timeClear()'>C</button>";
    html+="</div>";
    html+="<button class='btn primary' style='margin-top:14px' data-onclick='UI.saveHeatTime()'>Zapisz</button>";
    html+="<button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>";
    UI.openModal(html);
    /* Klawiatura fizyczna działa równolegle do numpada na ekranie — te same funkcje. */
    UI._timeKeyHandler=ev=>{
      if(ev.key>="0"&&ev.key<="9"){ev.preventDefault();UI.timeDigit(+ev.key);}
      else if(ev.key==="Backspace"||ev.key==="Delete"){ev.preventDefault();UI.timeBackspace();}
      else if(ev.key==="Enter"){ev.preventDefault();UI.saveHeatTime();}
    };
    document.addEventListener("keydown",UI._timeKeyHandler);
  },
  timeDigit(d){
    const t=(UI._timeMs||0)*10+d;
    if(t>99999)return; /* maks. 5 cyfr: 99,999 s — tyle wystarczy na realny czas biegu */
    UI._timeMs=t;
    const el=$("timeVal");if(el)el.textContent=fmtHeatTime(t);
  },
  timeBackspace(){
    UI._timeMs=Math.floor((UI._timeMs||0)/10);
    const el=$("timeVal");if(el)el.textContent=fmtHeatTime(UI._timeMs);
  },
  timeClear(){
    UI._timeMs=0;
    const el=$("timeVal");if(el)el.textContent=fmtHeatTime(0);
  },
  saveHeatTime(){
    const c=cur();if(!c)return;
    const h=compHeats(c).find(x=>x.n===UI._timeHeatN);
    if(!h){UI.closeModal();return;}
    const ms=UI._timeMs||0;
    if(!mutate(()=>{
      if(!ms)delete h.time;
      else h.time=fmtHeatTime(ms);
    }))return;
    UI.closeModal();renderRaces();
  },

  promptExtraHeat(){
    const c=cur();if(!c)return;
    const heats=compHeats(c);
    const need20=heats.filter(x=>!x.extra&&x.n<=20).every(x=>x.confirmed);
    if(!need20){UI.toast("Zatwierdź najpierw biegi 1–20.");return;}

    let html="<h3>Wyścig dodatkowy</h3>";
    html+="<p style='text-align:center;margin-bottom:12px;'>Wybierz liczbę zawodników:</p>";
    html+="<button class='btn primary' data-onclick='UI.addExtraHeat(2)'>2 zawodników</button>";
    html+="<button class='btn primary' data-onclick='UI.addExtraHeat(3)'>3 zawodników</button>";
    html+="<button class='btn primary' data-onclick='UI.addExtraHeat(4)'>4 zawodników</button>";
    html+="<button class='btn' style='margin-top:10px' data-onclick='UI.closeModal()'>Anuluj</button>";
    UI.openModal(html);
  },

  addExtraHeat(countRiders){
    const c=cur();if(!c)return;
    const count=compHeats(c).filter(h=>h.extra).length+1;

    if(!mutate(()=>{
      const heats=compHeats(c);
      const n=100+count;
      const entries=[];
      for(let g=0;g<countRiders;g++){
        entries.push({gate:GATES[g],rider:null,mark:null,repl:null});
      }
      const order=[];
      for(let i=countRiders-1;i>=0;i--)order.push(i);
      heats.push({n,extra:true,confirmed:false,order,entries});
    }))return;
    UI.closeModal();scheduleRenders();
    UI.toast("Dodano wyścig dodatkowy D"+count);
  },

  removeExtraHeat(heatN){
    const c=cur();if(!c)return;
    const idx=c.heats.findIndex(x=>x.n===heatN);
    if(idx<0||!c.heats[idx].extra)return;
    const lbl=getHeatLabel(c.heats[idx]);
    UI.confirm("Usunąć wyścig dodatkowy "+lbl+"? Wszystkie jego wyniki zostaną utracone.",()=>{
      if(!mutate(()=>{
        c.heats.splice(idx,1);
        /* Ponumerowanie pozostałych biegów dodatkowych: D1, D2, ... */
        let i=0;
        c.heats.forEach(h=>{if(h.extra){i++;h.n=100+i;}});
      }))return;
      scheduleRenders();
      UI.toast("Usunięto wyścig "+lbl+".");
    });
  }
};

UI.tieRules=function(){
  const c=cur();if(!c)return;
  const lb="font-size:0.8rem;font-weight:800;color:var(--text-muted)";
  UI.openModal("<h3>Remisy w klasyfikacji</h3>"+
    "<p style='font-size:0.75rem;color:var(--text-muted);text-align:center;margin:0 0 8px;font-weight:700;letter-spacing:0.5px'>DECYDUJĄ BEZPOŚREDNIE POJEDYNKI</p>"+
    "<div style='display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 12px'>"+
      "<span style='"+lb+"'>NIE</span>"+
      "<div class='switch"+(c.h2h?" on":"")+"' id='h2hSwitchM' role='switch' tabindex='0' aria-checked='"+(c.h2h?"true":"false")+"' aria-label='Decydują bezpośrednie pojedynki' data-onclick='UI.toggleH2H(true)'><div class='knob'></div></div>"+
      "<span style='"+lb+"'>TAK</span>"+
    "</div>"+
    "<p style='font-size:0.78rem;color:var(--text-muted);text-align:center;margin:0 0 14px'>Gdy włączone, remisy w punktach rozstrzygają wyniki biegów, w których zremisowani zawodnicy jechali razem. Można to zmienić w każdej chwili — klasyfikacja przelicza się od razu.</p>"+
    "<button class='btn primary' data-onclick='UI.closeModal()'>Gotowe</button>");
};
UI.syncH2H=function(){
  const c=cur();const on=!!(c&&c.h2h);
  const b=$("tieBtn");if(b)b.classList.toggle("active",on);
  const m=$("h2hSwitchM");if(m){m.classList.toggle("on",on);m.setAttribute("aria-checked",on?"true":"false");}
};
function renderRiderLib(){
  const el=$("riderList");
  const series=S.uiSeries;
  $("ridersTitle").textContent=series?("Zawodnicy — "+series):"Zawodnicy";
  const list=series?(S.rosters[series]||[]):S.riders;
  if(!list.length){el.innerHTML="<p style='color:var(--text-muted);text-align:center;'>Brak zawodników na liście.</p>";return;}
  el.innerHTML=list.map(name=>{
    const gi=S.riders.indexOf(name);
    const club=teamOfRider(name);
    const isJr=!!(S.juniors||[]).includes(name);
    if(gi<0)return "<div class='ri'><span>"+escq(name)+(club?" <small style='color:var(--text-muted)'>("+escq(club)+")</small>":"")+"</span><span>"+(series?"<button class='btn small danger' data-rr-name='"+escq(name)+"'>X</button>":"")+"</span></div>";
    return "<div class='ri'><span>"+escq(name)+(club?" <small style='color:var(--text-muted)'>("+escq(club)+")</small>":"")+"</span><span>"+
      "<button class='btn small "+(isJr?"secondary":"primary")+"' data-lib-s='"+gi+"'>S</button>"+
      "<button class='btn small "+(isJr?"primary":"secondary")+"' data-lib-j='"+gi+"'>J</button> "+
      "<button class='btn small' data-edit-rider='"+gi+"'>Edytuj</button>"+(series?"<button class='btn small danger' data-rr-name='"+escq(name)+"'>X</button>":"")+"</span></div>";
  }).join("");
  /* Nazwisko trafia do data-atrybutu (bezpieczny kontekst HTML) — nigdy do inline JS. */
  el.querySelectorAll("[data-edit-rider]").forEach(b=>b.onclick=()=>UI.editRider(+b.dataset.editRider));
  el.querySelectorAll("[data-rr-name]").forEach(b=>b.onclick=()=>UI.removeRosterRider(b.dataset.rrName));
  el.querySelectorAll("[data-lib-s]").forEach(b=>b.onclick=()=>{
    const n=S.riders[+b.dataset.libS];
    if((S.juniors||[]).includes(n)){if(!mutate(()=>lgSetJuniorFlag(n,false)))return;renderRiderLib();if($("teamDetail").classList.contains("on"))renderTeamDetail();}
  });
  el.querySelectorAll("[data-lib-j]").forEach(b=>b.onclick=()=>{
    const n=S.riders[+b.dataset.libJ];
    if(!(S.juniors||[]).includes(n)){if(!mutate(()=>lgSetJuniorFlag(n,true)))return;renderRiderLib();if($("teamDetail").classList.contains("on"))renderTeamDetail();}
  });
}

function renderSaved(){
  const el=$("savedList");const ids=Object.keys(S.comps||{});
  if(!ids.length){el.innerHTML="<p style='color:var(--text-muted);text-align:center;'>Brak zapisanych zawodów.</p>";return;}  el.innerHTML=ids.map(id=>{
    const c=S.comps[id];
    const title=c.league?((c.home&&c.home.name)+" – "+(c.away&&c.away.name)):(c.name||("Zawody "+c.format+"-biegowe"));
    const meta=c.league?"Mecz ligowy · 15 wyścigów":(c.format+"-biegowe");
    return "<div class='saved-item'>"+
      "<div class='saved-info'>"+
        "<span class='saved-title'>"+escq(title)+"</span>"+
        "<span class='saved-meta'>"+meta+"</span>"+
      "</div>"+
      "<div class='saved-actions'>"+
        "<button class='btn small primary' data-open=\""+escq(id)+"\">Otwórz</button>"+
        (store.get(LS+".prestart."+id)!=null?"<button class='btn small secondary' data-prestart=\""+escq(id)+"\">Sprzed startu</button>":"")+
        "<button class='btn small secondary' data-rename=\""+escq(id)+"\">Zmień nazwę</button>"+
        "<button class='btn small danger' data-del=\""+escq(id)+"\">Usuń</button>"+
      "</div>"+
    "</div>";
  }).join("");
  el.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>UI.openComp(b.dataset.open));
  el.querySelectorAll("[data-rename]").forEach(b=>b.onclick=()=>UI.renameComp(b.dataset.rename));
  el.querySelectorAll("[data-prestart]").forEach(b=>b.onclick=()=>UI.restorePrestart(b.dataset.prestart));
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>UI.delComp(b.dataset.del));
}
UI.restorePrestart=function(id){
  const snap=DB.get(LS+".prestart."+id);
  if(!snap||!snap.comp||snap.comp.id!==id){UI.toast("Brak zapisanego stanu sprzed startu.");return;}
  const when=new Date(snap.savedAt).toLocaleString("pl-PL");
  UI.confirm("Przywrócić stan zawodów sprzed startu ("+escq(when)+")?<br><small style='color:var(--text-muted)'>Wszystkie wyniki wpisane po starcie zostaną utracone.</small>",()=>{
    if(!mutate(()=>{S.comps[id]=snap.comp;}))return;
    try{DB.set(DB.compKey(id),snap.comp);}catch(e){}
    store.remove(LS+".prestart."+id);
    renderSaved();UI.toast("Przywrócono stan sprzed startu.");
  });
};
UI.openComp=function(id){S.current=id;S.settings.lastComp=id;persist();
  const c=S.comps[id];
  UI.screen(c.league?"match":(c.launched?"points":"lineup"));};
UI.delComp=function(id){
  const c=S.comps[id];const nm=c?escq(c.name||("Zawody "+c.format+"-biegowe")):"";
  UI.confirm("Usunąć zawody <b>"+nm+"</b>?<br><small style='color:var(--text-muted)'>Tej operacji nie można cofnąć.</small>",()=>{
    /* Transakcyjnie: mutate() cofnie zarówno stan w RAM, jak i (dzięki rollbackowi
       w persist) zapis w storage — przy błędzie nic nie zostaje usunięte. */
    if(!mutate(()=>{
      delete S.comps[id];DB.removeComp(id);if(S.current===id)S.current=null;
      if(S.settings.lastComp===id)delete S.settings.lastComp;
    }))return;
    renderSaved();});
};

/* Ekran główny: przycisk „Kontynuuj" dla ostatnio otwartych zawodów. */
function renderHome(){
  const b=$("continueBtn"),nb=$("newCompBtn");if(!b||!nb)return;
  const id=S.settings.lastComp;const c=id&&S.comps[id];
  if(!c){b.style.display="none";nb.classList.add("primary");return;}
  let heats,title,prog;
  if(c.league){
    heats=c.match?c.match.heats:[];
    title=(c.home&&c.home.name)+" – "+(c.away&&c.away.name);
    const last=heats.filter(h=>h.confirmed).reduce((m,h)=>Math.max(m,h.n),0);
    prog=last>0?("po wyścigu "+last+"/15"):"przed startem";
  }else{
    heats=compHeats(c);
    if(c.launched&&heats.length&&heats.every(h=>h.confirmed)){b.style.display="none";nb.classList.add("primary");return;}
    const last=heats.filter(h=>h.confirmed&&!h.extra).reduce((m,h)=>Math.max(m,h.n),0);
    title=c.name||("Zawody "+c.format+"-biegowe");
    prog=c.launched?(last>0?("po wyścigu "+last+"/"+c.format):"przed startem"):"przypisywanie numerów";
  }
  b.innerHTML="<span>▶ Kontynuuj</span><small style='text-transform:none;font-weight:600;opacity:0.8'>"+escq(title)+" · "+escq(prog)+"</small>";
  b.style.display="flex";nb.classList.remove("primary");
}
/* Przewinięcie ekranu wyścigów do pierwszego otwartego biegu (albo do końca listy, gdy wszystkie zatwierdzone). */
function scrollToCurrentHeat(){
  const c=cur();if(!c||!$("races").classList.contains("on"))return;
  const heats=compHeats(c);
  const open=heats.find(h=>!h.extra&&!h.confirmed);
  const target=open||heats.filter(h=>!h.extra).slice(-1)[0];
  const el=target&&$("heat-"+target.n);
  if(!el)return;
  if(!open&&heats.every(h=>h.confirmed)){window.scrollTo(0,0);return;}
  el.scrollIntoView({block:"start"});
}

/* Odświeża etykiety opcji aplikacji w USTAWIENIACH. */
function renderSettings(){
  ["S","M","L"].forEach(sz=>{
    const b=$("font"+sz);
    if(b)b.classList.toggle("primary",S.settings.font===sz);
  });
}

function renderLineup(){
  const c=cur();if(!c){UI.screen("home");return;}
  const sw=$("h2hSwitch");
  if(sw){sw.classList.toggle("on",!!c.h2h);sw.setAttribute("aria-checked",c.h2h?"true":"false");}
  let html="<table class='pts'><tr><th>Nr</th><th style='text-align:left'>Zawodnik</th></tr>";
  [...Array(18)].map((_,i)=>i+1).forEach(n=>{
    const name=c.mapping[n]||"";
    html+="<tr><td class='num'>"+n+"</td><td style='text-align:left'>"+
      "<button class='btn small' style='width:100%;text-transform:none;font-size:0.85rem' data-onclick='UI.pickLineup("+n+")'>"+
      (name?escq(name):"— Wybierz —")+"</button></td></tr>";
  });
  html+="</table>";
  $("lineupList").innerHTML=html;
}

function renderPoints(){
  const c=cur();if(!c){UI.screen("home");return;}
  const heats=compHeats(c);
  /* Stopień zaawansowania zawodów w nagłówku: ostatni zatwierdzony bieg zwykły. */
  const done=heats.filter(h=>h.confirmed&&!h.extra).length;
  const last=heats.filter(h=>h.confirmed&&!h.extra).reduce((m,h)=>Math.max(m,h.n),0);
  const total=c.format;
  const t=$("ptsTitle");
  if(t)t.innerHTML="<span class='fbar-t'>Klasyfikacja</span><span class='fbar-s'>po wyścigu "+last+"/"+total+"</span>";
  const sb=$("sortPts");
  if(sb)sb.classList.toggle("active",!!S.settings.sortByPlace);
  UI.syncH2H();
  heats.forEach(normalizeOrder);
  const st=standings(c);
  const groups=placeGroups(c);
  const tieSet=new Set();groups.forEach(g=>{if(g.nums.length>1)g.nums.forEach(n=>tieSet.add(n));});
  /* Kolejność wierszy: numery startowe albo realna kolejność w klasyfikacji. */
  let order=[...Array(18)].map((_,i)=>i+1).filter(n=>c.mapping[n]);
  if(S.settings.sortByPlace)order=groups.flatMap(g=>[...g.nums].sort((a,b)=>a-b));
  
  let html="<tr><th class='col-no'>Nr</th><th class='col-nm'>Zawodnik</th><th>Pkt</th><th>Msc</th>";
  heats.forEach(h=>{
    html+="<th>"+getHeatLabel(h)+"</th>";
  });
  html+="</tr>";

  order.forEach(n=>{
    const nm=String(c.mapping[n]||"—");
    const sp=nm.indexOf(" ");
    const nmHtml=sp>0?("<span style='display:block'>"+escq(nm.slice(0,sp))+"</span><span style='display:block'>"+escq(nm.slice(sp+1))+"</span>"):escq(nm);
    html+="<tr>";
    html+="<td class='col-no'>"+n+"</td><td class='col-nm'>"+nmHtml+"</td>";
    const s=st[n];
    html+="<td><b>"+(s?s.pts:0)+"</b></td>";
    
    const plcTxt=placeLabel(c,n,groups);
    html+="<td class='plc"+(tieSet.has(n)?" tie":"")+"' data-rider='"+n+"'"+(tieSet.has(n)?" role='button' tabindex='0' aria-label='Miejsce "+escq(plcTxt)+" — rozstrzygnij remis'":"")+">"+escq(plcTxt)+"</td>";
    
    heats.forEach(h=>{
      const gi=h.entries.findIndex(e=>e.rider===n||e.repl===n);
      let cell="<span class='cell' style='color:var(--text-muted)'>·</span>";
      if(gi>=0){
        const gate=h.entries[gi].gate;const cls="m"+(GATES.includes(gate)?gate:"A");
        if(h.confirmed){
          const r=heatResults(h)[n];
          const txt=r?((r.mark!==null&&r.mark!==undefined)?r.mark:r.pts):"";
          cell="<span class='cell "+cls+"'>"+escq(txt)+"</span>";
        }else{
          cell="<span class='cell "+cls+"'></span>";
        }
      }
      html+="<td>"+cell+"</td>";
    });
    html+="</tr>";
  });
  $("ptsTable").innerHTML=html;
  attachPlaceTap();
}

function attachPlaceTap(){
  document.querySelectorAll("td.plc.tie").forEach(td=>{
    td.title="Kliknij, aby rozstrzygnąć remis";
    td.addEventListener("click",()=>UI.resolveTie(+td.dataset.rider));
  });
}

function escq(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

/* ===== Wspólny wybór zawodnika z bazy: wyszukiwarka + sortowanie wg nazwisk + skok do litery ===== */
const RP_COLL=new Intl.Collator("pl");
function rpSurname(n){const p=String(n).trim().split(/\s+/);return p[p.length-1]||"";}
function rpSorted(names){
  return names.slice().sort((a,b)=>RP_COLL.compare(rpSurname(a),rpSurname(b))||RP_COLL.compare(a,b));
}
function rpNorm(s){
  return String(s).toLowerCase().replace(/ł/g,"l").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function rpLetter(n){return (rpSurname(n).charAt(0)||"#").toLocaleUpperCase("pl");}
/* opts: {title, names, onPick(name), clear:{label,fn}} */
function riderPicker(opts){
  const names=rpSorted(opts.names);
  let html="<h3>"+escq(opts.title)+"</h3>";
  if(!names.length){
    html+="<p style='text-align:center;color:var(--text-muted)'>Brak zawodników do wyboru.</p>";
  }else{
    const letters=[];names.forEach(n=>{const l=rpLetter(n);if(!letters.includes(l))letters.push(l);});
    html+="<label for='riderSearch' class='sr-label'>Szukaj zawodnika</label><input type='text' id='riderSearch' placeholder='Szukaj zawodnika…' autocomplete='off' style='margin-bottom:10px'>";
    html+="<div class='rp-wrap'><div class='rp-list' id='rpList'>"+
      names.map((n,i)=>"<button class='btn' style='text-transform:none' data-i='"+i+"' data-l='"+escq(rpLetter(n))+"' data-s='"+escq(rpNorm(n))+"'>"+escq(n)+"</button>").join("")+
      "</div><div class='rp-index' id='rpIndex'>"+
      letters.map(l=>"<button type='button' data-letter='"+escq(l)+"'>"+escq(l)+"</button>").join("")+
      "</div></div>";
    html+="<p id='riderPickEmpty' style='display:none;text-align:center;color:var(--text-muted);margin:8px 0'>Brak wyników.</p>";
  }
  if(opts.clear)html+="<button class='btn danger' id='rpClear' style='margin-top:10px'>"+escq(opts.clear.label)+"</button>";
  html+="<button class='btn' style='margin-top:10px' data-onclick='UI.closeModal()'>Anuluj</button>";
  UI.openModal(html);
  const md=$("modal");
  md.querySelectorAll("#rpList [data-i]").forEach(b=>b.onclick=()=>opts.onPick(names[+b.dataset.i]));
  const clr=md.querySelector("#rpClear");
  if(clr)clr.onclick=opts.clear.fn;
  const list=md.querySelector("#rpList");if(!list)return;
  const idx=md.querySelector("#rpIndex");
  const search=md.querySelector("#riderSearch");
  /* Skok do pierwszego zawodnika, którego nazwisko zaczyna się od wybranej litery. */
  idx.querySelectorAll("[data-letter]").forEach(lb=>lb.onclick=()=>{
    const t=[...list.querySelectorAll("[data-l]")].find(b=>b.dataset.l===lb.dataset.letter&&b.style.display!=="none");
    if(t)list.scrollTo({top:t.offsetTop-list.offsetTop,behavior:"smooth"});
  });
  search.addEventListener("input",()=>{
    const q=rpNorm(search.value.trim());
    let visible=0;const shown=new Set();
    list.querySelectorAll("[data-i]").forEach(b=>{
      const ok=!q||b.dataset.s.includes(q);
      b.style.display=ok?"":"none";
      if(ok){visible++;shown.add(b.dataset.l);}
    });
    idx.querySelectorAll("[data-letter]").forEach(lb=>{lb.style.display=shown.has(lb.dataset.letter)?"":"none";});
    list.scrollTop=0;
    const em=md.querySelector("#riderPickEmpty");if(em)em.style.display=visible?"none":"block";
  });
}

/* Sanityzacja tekstu od użytkownika: przycięcie, limit długości, usunięcie znaków kontrolnych. */
function cleanText(v,max){
  return String(v||"").replace(/[\u0000-\u001F\u007F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,"").trim().slice(0,max||100);
}
/* Normalizacja imion i nazwisk: tylko pierwsza litera każdego wyrazu wielka
   (działa też dla już zapisanych danych pisanych WIELKIMI literami). */
function normName(s){
  return String(s||"").trim().replace(/[\p{L}\p{M}]+/gu,w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
}

/* ============ Walidacja schematu importu ============ */
const IMPORT_LIMITS={bytes:5*1024*1024,riders:500,comps:200,heats:200,entries:8};
function validateData(d){
  const isInt=v=>typeof v==="number"&&Number.isInteger(v);
  const isObj=v=>v&&typeof v==="object"&&!Array.isArray(v);
  const okNum=k=>/^([1-9]|1[0-8])$/.test(k);
  if(!isObj(d))return "to nie obiekt danych";
  if(!Array.isArray(d.riders))return "brak listy zawodników";
  if(d.riders.length>IMPORT_LIMITS.riders)return "zbyt wielu zawodników";
  if(!d.riders.every(r=>typeof r==="string"&&r.length<=100))return "błędna lista zawodników";
  if(d.comps!==undefined&&!isObj(d.comps))return "błędny obiekt zawodów";
  if(d.teams!==undefined&&d.teams!==null){
    if(!Array.isArray(d.teams))return "błędna lista drużyn";
    if(d.teams.length>200)return "zbyt wiele drużyn";
    for(const t of d.teams){
      if(!isObj(t))return "drużyna nie jest obiektem";
      if(typeof t.name!=="string"||t.name.length>100)return "błędna nazwa drużyny";
      if(!Array.isArray(t.riders)||t.riders.length>100)return "błędna lista zawodników drużyny";
      if(!t.riders.every(r=>typeof r==="string"&&r.length<=100))return "błędni zawodnicy drużyny";
    }
  }
  if(d.juniors!==undefined&&d.juniors!==null){
    if(!Array.isArray(d.juniors))return "błędna lista młodzieżowców";
    if(d.juniors.length>500)return "zbyt wielu młodzieżowców";
    if(!d.juniors.every(r=>typeof r==="string"&&r.length<=100))return "błędni młodzieżowcy";
  }
  if(d.rosters!==undefined&&d.rosters!==null){
    if(!isObj(d.rosters))return "błędne składy serii";
    for(const k of Object.keys(d.rosters)){
      if(!Array.isArray(d.rosters[k])||d.rosters[k].length>500)return "błędny skład serii "+k.slice(0,10);
      if(!d.rosters[k].every(r=>typeof r==="string"&&r.length<=100))return "błędny zawodnik w serii "+k.slice(0,10);
    }
  }
  const ids=Object.keys(d.comps||{});
  if(ids.length>IMPORT_LIMITS.comps)return "zbyt wiele zawodów";
  for(const id of ids){
    if(!/^[A-Za-z0-9_-]{1,64}$/.test(id))return "zawody: niedozwolony identyfikator";
    const c=d.comps[id];
    if(!isObj(c))return "zawody "+id+": nie są obiektem";
    if(typeof c.id!=="string"||c.id!==id)return "zawody "+id+": niezgodne id";
    if(c.league!==true&&!Array.isArray(c.heats))return "zawody "+id+": brak listy biegów";
    if(c.league!==true&&c.heats.length>IMPORT_LIMITS.heats)return "zawody "+id+": zbyt wiele biegów";
    if(c.format!==20&&c.format!==22&&c.format!==23&&c.format!=="liga")return "zawody "+id+": nieznany format";
    if(c.league===true){
      /* Mecz ligowy — lekka walidacja własnego schematu; standardowe biegi nie obowiązują. */
      if(!isObj(c.home)||!isObj(c.away))return "zawody "+id+": brak drużyn meczu";
      for(const side of [c.home,c.away]){
        if(typeof side.name!=="string"||side.name.length>100)return "zawody "+id+": błędna nazwa drużyny";
        if(!isObj(side.lineup))return "zawody "+id+": brak składu drużyny";
        for(const k of Object.keys(side.lineup)){
          const v=side.lineup[k];
          if(!/^([1-9]|1[0-6])$/.test(k))return "zawody "+id+": błędny numer w składzie";
          if(v!==null&&(typeof v!=="string"||v.length>100))return "zawody "+id+": błędny zawodnik w składzie";
        }
      }
      if(!isObj(c.match)||!Array.isArray(c.match.heats))return "zawody "+id+": brak biegów meczu";
      if(c.match.heats.length>60)return "zawody "+id+": zbyt wiele biegów meczu";
      for(const h of c.match.heats){
        if(!isObj(h)||!isInt(h.n)||h.n<1||h.n>60)return "zawody "+id+": błędny bieg meczu";
        if(!Array.isArray(h.slots)||h.slots.length>8)return "zawody "+id+": bieg "+h.n+": błędne pola";
        for(const s of h.slots){
          if(!isObj(s)||(s.num!==null&&(!isInt(s.num)||s.num<1||s.num>16)))return "zawody "+id+": bieg "+h.n+": błędny zawodnik";
          if(s.subType!==null&&s.subType!==undefined&&(typeof s.subType!=="string"||!["RT","ZZ"].includes(s.subType)))return "zawody "+id+": bieg "+h.n+": błędny typ zmiany";
          if(s.excl!==null&&s.excl!==undefined&&(typeof s.excl!=="string"||s.excl.length>8))return "zawody "+id+": bieg "+h.n+": błędne oznaczenie";
        }
        if(!Array.isArray(h.order)||h.order.length!==h.slots.length||new Set(h.order).size!==h.slots.length||h.order.some(i=>!isInt(i)||i<0||i>=h.slots.length))return "zawody "+id+": bieg "+h.n+": łędna kolejność";
        if(h.time!==undefined&&h.time!==null&&(typeof h.time!=="string"||h.time.length>12))return "zawody "+id+": bieg "+h.n+": błędny czas";
      }
      continue;
    }
    if(c.name!==undefined&&c.name!==null&&(typeof c.name!=="string"||c.name.length>200))return "zawody "+id+": błędna nazwa";
    if(!isObj(c.mapping))return "zawody "+id+": brak mapowania";
    for(const k of Object.keys(c.mapping)){
      if(!okNum(k))return "zawody "+id+": błędny numer w mapowaniu ("+k.slice(0,10)+")";
      if(typeof c.mapping[k]!=="string"||c.mapping[k].length>100)return "zawody "+id+": błędne mapowanie nr "+k;
    }
    if(c.overrides!==undefined&&c.overrides!==null){
      if(!isObj(c.overrides))return "zawody "+id+": błędne nadpisania remisów";
      for(const k of Object.keys(c.overrides)){
        if(!okNum(k)||!isInt(c.overrides[k])||c.overrides[k]<1||c.overrides[k]>18)return "zawody "+id+": błędne nadpisanie remisu";
      }
    }
    if(c.h2h!==undefined&&c.h2h!==null&&typeof c.h2h!=="boolean")return "zawody "+id+": błędna flaga pojedynków";
    if(c.markSeq!==undefined&&!isInt(c.markSeq))return "zawody "+id+": błędny licznik oznaczeń";
    for(const h of c.heats){
      if(!isObj(h))return "zawody "+id+": bieg nie jest obiektem";
      const n=h.n;
      if(!isInt(n)||n<1||n>200||(n>60&&n<101))return "zawody "+id+": błędny numer biegu";
      if(typeof h.extra!=="boolean"&&h.extra!==undefined)return "zawody "+id+": bieg "+n+": błędna flaga extra";
      if(typeof h.confirmed!=="boolean"&&h.confirmed!==undefined)return "zawody "+id+": bieg "+n+": błędna flaga zatwierdzenia";
      if(!Array.isArray(h.entries)||h.entries.length>IMPORT_LIMITS.entries)return "zawody "+id+": bieg "+n+": błędne wpisy";
      if(!Array.isArray(h.order))return "zawody "+id+": bieg "+n+": brak kolejności";
      if(h.order.some(i=>!isInt(i)||i<0||i>=h.entries.length))return "zawody "+id+": bieg "+n+": błędna kolejność";
      for(const e of h.entries){
        if(!isObj(e))return "zawody "+id+": bieg "+n+": wpis nie jest obiektem";
        if(!GATES.includes(e.gate))return "zawody "+id+": bieg "+n+": błędny tor";
        if(e.rider!==null&&(!isInt(e.rider)||e.rider<1||e.rider>18))return "zawody "+id+": bieg "+n+": błędny numer zawodnika";
        if(e.mark!==null&&(typeof e.mark!=="string"||e.mark.length>8))return "zawody "+id+": bieg "+n+": błędne oznaczenie";
        if(e.repl!==null&&e.repl!==undefined&&(!isInt(e.repl)||e.repl<1||e.repl>18))return "zawody "+id+": bieg "+n+": błędny zastępca";
        if(e.replOf!==null&&e.replOf!==undefined&&(!isInt(e.replOf)||e.replOf<0||e.replOf>=h.entries.length))return "zawody "+id+": bieg "+n+": błędne odwołanie zastępstwa";
        if(e.markSeq!==undefined&&!isInt(e.markSeq))return "zawody "+id+": bieg "+n+": błędny numer oznaczenia";
      }
      if(h.time!==undefined&&h.time!==null&&(typeof h.time!=="string"||h.time.length>12))return "zawody "+id+": bieg "+n+": błędny czas";
    }
  }
  return null;
}

function renderRaces(){
  const c=cur();if(!c){UI.screen("home");return;}
  const heats=compHeats(c);
  heats.forEach(normalizeOrder);
  const firstOpen=heats.find(h=>!h.extra&&!h.confirmed);
  $("racesTitle").textContent="Wyścigi";
  $("heatList").innerHTML=heats.map(h=>heatCardHtml(c,h,firstOpen)).join("");
}
/* Karta pojedynczego biegu — pozwala aktualizować tylko jeden bieg bez przerysowania całej listy. */
function heatCardHtml(c,h,firstOpen){
    let html="";
    const active=(!h.confirmed&&(!firstOpen||h.n===firstOpen.n||h.extra));
    const dim=!h.confirmed&&!active;
    const heatLabel=getHeatLabel(h);
    html+="<div id='heat-"+h.n+"' class='heat "+(h.confirmed?"done":"")+(active?" active":"")+(dim?" dim":"")+"'>";
    html+="<div class='heathead'><span class='heatnum'>BIEG "+heatLabel+(h.time?"<span class='heattime'>"+escq(h.time)+"</span>":"")+"</span>";
    html+="<div class='heatactions'>";
    html+="<button class='iconbtn sm' title='Czas wyścigu' data-onclick='UI.editHeatTime("+h.n+")'>"+ICON_CLOCK+"</button>";
    if(h.extra){
      html+="<button class='iconbtn sm' title='Usuń wyścig dodatkowy' style='color:var(--danger-fg)' data-onclick='UI.removeExtraHeat("+h.n+")'>"+ICON_X+"</button>";
    }
    if(h.confirmed){
      html+="<button class='iconbtn sm' title='Edytuj' data-onclick='UI.editHeat("+h.n+")'>"+ICON_EDIT+"</button>";
      html+="<button class='iconbtn sm' title='Reset biegu' data-onclick='UI.resetHeat("+h.n+")'>"+ICON_RESET+"</button>";
    }
    else if(active)html+="<button class='btn small primary' style='margin:0' data-onclick='UI.confirmHeat("+h.n+")'>✔ Zatwierdź</button>";
    else html+="<span style='color:var(--text-muted);font-size:0.8rem'>"+ICON_LOCK_SM+"Zablokowany</span>";
    html+="</div></div><div class='hrows'>";
    const rowOf=(e,r,extraCls,inner)=>"<div class='rcard "+(extraCls||"")+"' style='border-left:4px solid "+GATE_COLOR[e.gate]+"'>"+inner+"</div>";
    if(h.confirmed){
      const r=heatResults(h);let pos=0;
      h.order.forEach(ei=>{
        const e=h.entries[ei];
        if(e.mark&&e.rider!==null&&e.rider!==undefined){
          html+=rowOf(e,0,"ex locked","<span class='name'>"+escq(c.mapping[e.rider]||"?")+(e.repl?" <small>(zast. "+escq(c.mapping[e.repl]||"?")+")</small>":"")+"</span><span class='mk'>"+escq(e.mark)+"</span>");
          return;
        }
        const fin=e.rider;
        if(fin!==null&&fin!==undefined){
          pos++;
          const rr=r[fin];
          html+=rowOf(e,0,"","<span class='name'>"+escq(c.mapping[fin]||"?")+"</span><span class='pos'>"+pos+". — "+fmtRes(rr)+"</span>");
        }
      });
    }else{
      let pos=0;
      const finsCount=h.order.filter(i=>!h.entries[i].mark).length;
      h.order.forEach(ei=>{
        const e=h.entries[ei];const hasRepl=e.repl!==null&&e.repl!==undefined;
        const col=GATE_COLOR[e.gate];
        const r=hasRepl?e.repl:e.rider;
        if(e.mark){
          html+="<div class='rcard ex locked' style='border-left:4px solid "+col+"'><span class='name'>"+escq(c.mapping[e.rider]||"?")+"<span class='mk'>"+escq(e.mark)+"</span>"+(hasRepl?" <small>(zast. "+escq(c.mapping[e.repl]||"?")+")</small>":"")+"</span>"+
            "<div class='rcardbtns'><button class='cardbtn flag on' title='Zmień lub usuń wykluczenie' data-onclick='UI.markerMenu("+h.n+","+ei+")'>"+ICON_FLAG+"</button></div></div>";
        }else if(r===null||r===undefined){
          html+="<div class='slotmark' role='button' tabindex='0' data-onclick='UI.pickOpenRider("+h.n+","+ei+")'>+ Wybierz zawodnika</div>";
        }else{
          pos++;
          const isSub=(e.replOf!==undefined&&e.replOf!==null);
          const upDis=(pos===1)?"disabled":"";
          const downDis=(pos===finsCount)?"disabled":"";
          const canReassign=(h.n>20||h.extra)&&!isSub;
          const subNote=isSub?"<small style='color:var(--text-muted)'> (za "+escq(c.mapping[h.entries[e.replOf].rider]||"?")+")</small>":"";
          const nameAttrs=canReassign?" style='cursor:pointer;text-decoration:underline dotted' title='Zmień zawodnika' data-onclick='UI.pickOpenRider("+h.n+","+ei+")'":"";
          html+="<div class='rcard' data-heat='"+h.n+"' data-slot='"+ei+"' data-pos='"+(pos-1)+"' style='border-left:4px solid "+col+"'>"+
            ""+
            "<span class='name'"+nameAttrs+">"+escq(c.mapping[r]||"?")+subNote+"</span>"+
            "<span class='pos'>"+pos+".</span>"+
            "<div class='rcardbtns'>"+
              "<button class='cardbtn' "+upDis+" title='Przesuń w górę' data-onclick='UI.moveRider("+h.n+","+ei+",-1)'>"+ICON_UP+"</button>"+
              "<button class='cardbtn' "+downDis+" title='Przesuń w dół' data-onclick='UI.moveRider("+h.n+","+ei+",1)'>"+ICON_DOWN+"</button>"+
              (!isSub?"<button class='cardbtn flag' title='Wykluczenie' data-onclick='UI.markerMenu("+h.n+","+ei+")'>"+ICON_FLAG+"</button>":"")+
            "</div>"+
          "</div>";
        }
      });
    }
    html+="</div></div>";
  return html;
}
/* Delegowana obsługa zdarzeń — zastępuje atrybuty onclick/onchange, dzięki czemu CSP nie potrzebuje 'unsafe-inline' w script-src.
   Bez eval: dozwolone są wyłącznie wywołania UI.metoda(literaly) na własnych metodach obiektu UI. */
(function(){
  const CALL=/^UI\.([A-Za-z_]\w*)\((.*)\)$/;
  function arg(t,el){
    t=t.trim();
    if(t==="this")return el;
    if(t==="this.value")return el.value;
    if(t==="S.uiTeam")return S.uiTeam;
    if(t==="null")return null;
    if(t==="true")return true;
    if(t==="false")return false;
    if(/^-?\d+(\.\d+)?$/.test(t))return +t;
    const m=t.match(/^'([^']*)'$/)||t.match(/^"([^"]*)"$/);
    if(m)return m[1];
    throw new Error("Niedozwolony argument");
  }
  function run(code,el){
    const m=CALL.exec(code.trim());if(!m)return;
    const fn=Object.prototype.hasOwnProperty.call(UI,m[1])?UI[m[1]]:null;
    if(typeof fn!=="function")return;
    const raw=m[2].trim();
    fn.apply(UI,raw===""?[]:raw.split(",").map(x=>arg(x,el)));
  }
  UI.pickImportFile=function(){document.getElementById("impFile").click();};
  ["click","change"].forEach(type=>document.addEventListener(type,ev=>{
    const attr="data-on"+type;
    for(let el=ev.target;el&&el.nodeType===1;el=el.parentElement){
      const code=el.getAttribute(attr);
      if(code){try{run(code,el);}catch(e){}}
    }
  }));
  document.getElementById("overlay").addEventListener("click",ev=>{if(ev.target===ev.currentTarget&&!UI._modalLock)UI.closeModal();});
})();
/* Rejestracja Service Workera — włącza pełną instalowalność (PWA) i pracę offline,
   ale tylko gdy plik jest hostowany przez http/https razem z sw.js. Otwarty lokalnie
   (file://) po prostu nic nie robi — błąd jest wyciszony. */
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}
/* Dostępność: etykiety aria dla przycisków z samym title, Esc/Tab w oknach, Enter/Spacja na role="button"/"switch". */
(function(){
  const label=root=>{
    if(!root||root.nodeType!==1)return;
    const list=root.matches&&root.matches("button[title]:not([aria-label])")?[root]:[];
    root.querySelectorAll&&root.querySelectorAll("button[title]:not([aria-label])").forEach(b=>list.push(b));
    list.forEach(b=>b.setAttribute("aria-label",b.getAttribute("title")));
  };
  label(document.body);
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(label))).observe(document.body,{childList:true,subtree:true});
  document.addEventListener("keydown",ev=>{
    const ov=$("overlay");
    if(ov&&ov.classList.contains("on")){
      if(ev.key==="Escape"){ev.preventDefault();if(!UI._modalLock)UI.closeModal();return;}
      if(ev.key==="Tab"){
        const f=[...$("modal").querySelectorAll("button:not([disabled]),input,[tabindex]:not([tabindex='-1'])")].filter(x=>x.offsetParent!==null);
        if(!f.length){ev.preventDefault();return;}
        const first=f[0],last=f[f.length-1],a=document.activeElement;
        if(ev.shiftKey&&(a===first||a===$("modal"))){ev.preventDefault();last.focus();}
        else if(!ev.shiftKey&&a===last){ev.preventDefault();first.focus();}
        return;
      }
    }
    if((ev.key==="Enter"||ev.key===" ")&&ev.target&&ev.target.matches&&ev.target.matches("[role='button'],[role='switch']")){
      ev.preventDefault();ev.target.click();
    }
  });
})();
/* ===================== DRUŻYNY I MECZE LIGOWE ===================== */
/* Model danych: jedna wspólna baza zawodników (S.riders) + przypisanie do klubu
   jako członkostwo w drużynie (S.teams). Składy serii indywidualnych (S.rosters)
   to podzbiory tej samej bazy — edycja nazwiska działa wszędzie. */
function teamOfRider(name){
  const t=S.teams.find(t=>t.riders.includes(name));
  return t?t.name:null;
}
UI.openRoster=function(series){S.uiSeries=series;UI.screen("riders");};
UI.addRosterRider=function(){
  const series=S.uiSeries;
  UI.openModal("<h3>Dodaj zawodnika</h3><input type='text' id='nr' placeholder='Imię i Nazwisko' style='width:100%;margin-bottom:12px'>" + lgCatToggleHtml() + "<button class='btn primary' id='ok'>Dodaj</button><button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
  const isJr=lgBindCatToggle();
  $("ok").onclick=()=>{
    const v=normName(cleanText($("nr").value,100));if(!v)return;
    if(!mutate(()=>{
      if(!S.riders.includes(v))S.riders.push(v);
      lgSetJuniorFlag(v,isJr());
      if(series&&!S.rosters[series].includes(v))S.rosters[series].push(v);
    }))return;
    UI.closeModal();renderRiderLib();
  };
  $("nr").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();$("ok").click();}});
};
UI.removeRosterRider=function(name){
  const series=S.uiSeries;if(!series)return;
  UI.confirm("Usunąć <b>"+escq(name)+"</b> z listy „"+escq(series)+"”?",()=>{
    mutate(()=>{S.rosters[series]=S.rosters[series].filter(n=>n!==name);});
    renderRiderLib();
  });
};
UI.assignRosterRider=function(){
  const series=S.uiSeries;
  if(!series){UI.toast("Najpierw wybierz serię (np. SGP, SEC).");return;}
  const pool=S.riders.filter(n=>!(S.rosters[series]||[]).includes(n));
  if(!pool.length){UI.toast("Wszyscy zawodnicy bazy są już na tej liście.");return;}
  riderPicker({title:"Przypisz z bazy",names:pool,onPick:nm=>{
    if(!mutate(()=>{if(!S.rosters[series].includes(nm))S.rosters[series].push(nm);}))return;
    UI.closeModal();renderRiderLib();
  }});
};
UI.addTeam=function(fromLeague){
  UI.openModal("<h3>Dodaj drużynę</h3><p style='text-align:center;font-size:0.78rem;color:var(--text-muted);margin:0 0 10px'>Do nowej drużyny automatycznie zostanie dopisany <b>Zawodnik zastępowany</b> (ZZ).</p><label for='tn' class='sr-label'>Nazwa drużyny</label><input type='text' id='tn' placeholder='Nazwa drużyny' style='width:100%;margin-bottom:12px'><button class='btn primary' id='ok'>Dodaj</button><button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
  $("ok").onclick=()=>{
    const v=cleanText($("tn").value,100);if(!v)return;
    if(S.teams.some(t=>t.name===v)){UI.toast("❌ Taka drużyna już istnieje.");return;}
    if(!mutate(()=>{S.teams.push({name:v,riders:[LG_ZZ_NAME]});}))return;
    UI.closeModal();
    if(fromLeague){S.uiTeam=S.teams.length-1;LgFromLeague=true;UI.screen("teamDetail");}
    else renderTeams();
  };
  $("tn").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();$("ok").click();}});
};
UI.teamDetailBack=function(){
  if(LgFromLeague&&LgW){LgFromLeague=false;UI.screen("lgTeam");}
  else UI.screen("teams");
};
UI.editTeam=function(idx){
  const old=S.teams[idx].name;
  UI.openModal("<h3>Edycja drużyny</h3><input type='text' id='tn' value='"+escq(old)+"' style='width:100%;margin-bottom:12px'><button class='btn primary' id='ok'>Zapisz</button><button class='btn danger' id='del'>Usuń</button><button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
  const refresh=()=>{
    if(LgFromLeague&&LgW){LgFromLeague=false;UI.screen("lgTeam");}
    else if($("teamDetail").classList.contains("on"))renderTeamDetail();
    else renderTeams();
  };
  $("ok").onclick=()=>{
    const v=cleanText($("tn").value,100);if(!v)return;
    if(v!==old&&S.teams.some(t=>t.name===v)){UI.toast("❌ Taka drużyna już istnieje.");return;}
    mutate(()=>{S.teams[idx].name=v;});
    UI.closeModal();refresh();
  };
  $("del").onclick=()=>{
    UI.closeModal();
    UI.confirm("Usunąć drużynę <b>"+escq(old)+"</b>?<br><small style='color:var(--text-muted)'>Zawodnicy zostaną w bazie; zapisane mecze się nie zmienią.</small>",()=>{
      mutate(()=>{S.teams.splice(idx,1);});refresh();
    });
  };
  $("tn").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();$("ok").click();}});
};
UI.openTeam=function(idx){S.uiTeam=idx;UI.screen("teamDetail");};
function renderTeams(){
  const el=$("teamList");
  if(!S.teams.length){el.innerHTML="<p style='color:var(--text-muted);text-align:center;'>Brak drużyn — dodaj pierwszą.</p>";return;}
  el.innerHTML=S.teams.map((t,i)=>"<div class='ri'><span>"+escq(t.name)+" <small style='color:var(--text-muted)'>("+t.riders.length+")</small></span><span><button class='btn small' data-open='"+i+"'>Zawodnicy</button><button class='btn small' data-edit='"+i+"'>Edytuj</button></span></div>").join("");
  el.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>UI.openTeam(+b.dataset.open));
  el.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>UI.editTeam(+b.dataset.edit));
}
function renderTeamDetail(){
  const t=S.teams[S.uiTeam];if(!t){UI.screen("teams");return;}
  $("teamDetailTitle").textContent=t.name.toUpperCase();
  const el=$("teamRiderList");
  if(!t.riders.length){el.innerHTML="<p style='color:var(--text-muted);text-align:center;'>Brak zawodników w drużynie.</p>";return;}
  el.innerHTML="<div style='font-size:0.72rem;color:var(--text-muted);text-align:right;margin:0 0 6px;font-weight:700'>S — senior · J — junior</div>"+t.riders.map(name=>{
    if(name===LG_ZZ_NAME)return "<div class='ri'><span>"+escq(name)+" <span class='mk'>ZZ</span></span></div>";
    const isJr=!!(S.juniors||[]).includes(name);
    const gi=S.riders.indexOf(name);
    return "<div class='ri'><span>"+escq(name)+"</span><span>"+
      "<button class='btn small "+(isJr?"secondary":"primary")+"' data-cat-s='"+escq(name)+"'>S</button>"+
      "<button class='btn small "+(isJr?"primary":"secondary")+"' data-cat-j='"+escq(name)+"'>J</button> "+
      (gi>=0?"<button class='btn small' data-tedit='"+gi+"'>Edytuj</button>":"")+
      "<button class='btn small danger' data-rm='"+escq(name)+"'>Usuń</button></span></div>";
  }).join("");
  const setCat=(nm,jr)=>mutate(()=>{if(!S.juniors)S.juniors=[];S.juniors=jr?S.juniors.concat(nm):S.juniors.filter(n=>n!==nm);});
  el.querySelectorAll("[data-tedit]").forEach(b=>b.onclick=()=>UI.editRider(+b.dataset.tedit));
  el.querySelectorAll("[data-cat-s]").forEach(b=>b.onclick=()=>{if(S.juniors.includes(b.dataset.catS)){setCat(b.dataset.catS,false);renderTeamDetail();}});
  el.querySelectorAll("[data-cat-j]").forEach(b=>b.onclick=()=>{if(!S.juniors.includes(b.dataset.catJ)){setCat(b.dataset.catJ,true);renderTeamDetail();}});
  el.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{
    const nm=b.dataset.rm;
    mutate(()=>{t.riders=t.riders.filter(n=>n!==nm);});
    renderTeamDetail();
  });
}
UI.addTeamRider=function(){
  const t=S.teams[S.uiTeam];if(!t)return;
  UI.openModal("<h3>Dodaj zawodnika</h3><p style='text-align:center;font-size:0.78rem;color:var(--text-muted);margin:0 0 10px'>Drużyna: <b>"+escq(t.name)+"</b> — zawodnik trafi też do wspólnej bazy. Kategorię ustaw przyciskami poniżej: S (senior) lub J (junior).</p>"+
    "<label for='tnr' class='sr-label'>Imię i nazwisko</label><input type='text' id='tnr' placeholder='Imię i Nazwisko' style='width:100%;margin-bottom:12px'>"+lgCatToggleHtml()+
    "<button class='btn primary' id='ok'>Dodaj</button><button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>");
  const isJr=lgBindCatToggle();
  $("ok").onclick=()=>{
    const v=normName(cleanText($("tnr").value,100));if(!v)return;
    if(!mutate(()=>{
      if(!S.riders.includes(v))S.riders.push(v);
      lgSetJuniorFlag(v,isJr());
      if(!t.riders.includes(v))t.riders.push(v);
    }))return;
    UI.closeModal();renderTeamDetail();
  };
  $("tnr").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();$("ok").click();}});
};
UI.assignTeamRider=function(){
  const t=S.teams[S.uiTeam];if(!t)return;
  const pool=S.riders.filter(n=>!t.riders.includes(n));
  if(!pool.length){UI.toast("Wszyscy zawodnicy bazy są już w tej drużynie.");return;}
  riderPicker({title:"Przypisz z bazy",names:pool,onPick:nm=>{
    if(!mutate(()=>{if(!t.riders.includes(nm))t.riders.push(nm);}))return;
    UI.closeModal();renderTeamDetail();
  }});
};

/* ===== Kreator meczu ligowego ===== */
let LgW=null; /* kreator: {side:'home'|'away', home:{...}, away:{...}} */
let LgFromLeague=false; /* edycja drużyny otwarta z kreatora meczu — powrót do wyboru drużyn */
let LgLineupStep=null;
UI.startLeague=function(){LgW={side:"home",home:null,away:null};LgLineupStep=null;UI.screen("lgTeam");};
UI.cancelLeague=function(){UI.confirm("Porzucić tworzenie meczu?",()=>{LgW=null;LgLineupStep=null;UI.screen("home");});};
function renderLgTeamPick(){
  if(!LgW){UI.screen("home");return;}
  const isHome=LgW.side==="home";
  $("lgTeamTitle").textContent=(isHome?"GOSPODARZE":"GOŚCIE")+" — WYBÓR DRUŻYNY";
  const el=$("lgTeamList");
  if(!S.teams.length){el.innerHTML="<p style='color:var(--text-muted);text-align:center;'>Brak utworzonych drużyn. Zanim rozpoczniesz zawody, utwórz drużyny wraz z zawodnikami w sekcji</p><button class='btn secondary' data-onclick='UI.goPeople()'>Zawodnicy i drużyny</button>";return;}
  /* Drużyna wybrana jako gospodarz nie może być jednocześnie gościem. */
  const taken=(!isHome&&LgW.home)?LgW.home.teamIdx:-1;
  el.innerHTML=S.teams.map((t,i)=>i===taken?"":"<div style='display:flex;gap:6px;margin-bottom:6px'>"+
    "<button class='btn' style='flex:1;text-transform:none' data-pick='"+i+"'>"+escq(t.name)+" <small style='opacity:0.7'>("+t.riders.length+")</small></button>"+
    "<button class='btn small' style='align-self:center' data-tedit='"+i+"'>Edytuj</button></div>").join("");
  if(!el.innerHTML)el.innerHTML="<p style='color:var(--text-muted);text-align:center;'>Do wyboru gości potrzebna jest druga drużyna. Dodaj ją w sekcji Zawodnicy i drużyny.</p>";
  el.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>UI.lgPickTeam(+b.dataset.pick));
  el.querySelectorAll("[data-tedit]").forEach(b=>b.onclick=()=>{LgFromLeague=true;S.uiTeam=+b.dataset.tedit;UI.screen("teamDetail");});
}
UI.lgPickTeam=function(idx){
  const t=S.teams[idx];if(!t||!LgW)return;
  if(LgW.side==="away"&&LgW.home&&LgW.home.teamIdx===idx){UI.toast("Ta drużyna jest już gospodarzem");return;}
  /* Starsze drużyny mogą nie mieć „Zawodnika zastępowanego” — dodajemy go automatycznie. */
  if(!t.riders.includes(LG_ZZ_NAME))mutate(()=>{t.riders.push(LG_ZZ_NAME);});
  const nums=LgW.side==="home"?[9,10,11,12,13,14,15,16]:[1,2,3,4,5,6,7,8];
  const lineup={};nums.forEach(n=>lineup[n]=null); /* skład startuje pusty — „Brak zawodnika” */
  LgW[LgW.side]={name:t.name,lineup,teamIdx:idx};
  if(LgW.side==="home"){LgW.side="away";renderLgTeamPick();}
  else UI.screen("lgLineup");
};
function renderLgLineup(){
  if(!LgW||!LgW.home){UI.screen("home");return;}
  if(!LgLineupStep)LgLineupStep="home";
  if(LgLineupStep==="away"&&!LgW.away)LgLineupStep="home";
  const side=LgW[LgLineupStep];
  const nums=LgLineupStep==="home"?[9,10,11,12,13,14,15,16]:[1,2,3,4,5,6,7,8];
  $("lgLineupTitle").textContent=(LgLineupStep==="home"?"GOSPODARZE":"GOŚCIE")+": "+side.name.toUpperCase();
  const team=S.teams[side.teamIdx];
  const all=team?team.riders:[];
  let html="";
  nums.forEach(n=>{
    const cur=side.lineup[n];
    const juniorOnly=(LgLineupStep==="home"&&(n===14||n===15))||(LgLineupStep==="away"&&(n===6||n===7));
    /* Wybrani zawodnicy znikają z list; 6-7 / 14-15 — tylko juniorzy. */
    const pool=all.filter(name=>{
      if(name===cur)return true;
      if(Object.values(side.lineup).includes(name))return false;
      if(juniorOnly&&!(S.juniors||[]).includes(name))return false;
      return true;
    });
    html+="<div class='lg-lineuprow'><span class='no'>"+n+"</span>"+
      "<select style='flex:1' "+(cur?"disabled":"")+" data-onchange='UI.lgSetLineup("+n+",this.value)'>"+
      "<option value='-1'>Brak zawodnika</option>"+
      pool.map(name=>"<option value='"+all.indexOf(name)+"'"+(cur===name?" selected":"")+">"+escq(name)+"</option>").join("")+
      "</select>"+
      (cur?"<button class='btn small danger' title='Zdejmij zawodnika z pozycji "+n+"' data-onclick='UI.lgClearLineup("+n+")'>X</button>":"")+
      "</div>";
  });
  html+="<div class='lg-hints' style='margin-top:8px'>"+
    "<div>Jeżeli drużyna będzie korzystać z zastępstwa zawodnika (ZZ), umieść w składzie pozycję „Zawodnik zastępowany” na wybranym numerze.</div>"+
    "<div>Numery 6–7 / 14–15 mogą zajmować wyłącznie juniorzy.</div></div>";
  $("lgLineupList").innerHTML=html;
}
UI.lgSetLineup=function(num,val){
  const side=LgW[LgLineupStep];if(!side)return;
  const team=S.teams[side.teamIdx];
  if(val==="-1"||!team){side.lineup[num]=null;renderLgLineup();return;}
  const name=team.riders[+val];
  /* Każdy zawodnik (także Zawodnik zastępowany) tylko raz w składzie. */
  const dup=Object.keys(side.lineup).some(k=>+k!==num&&side.lineup[k]===name);
  if(dup){UI.toast("❌ Ten zawodnik jest już w składzie pod innym numerem.");renderLgLineup();return;}
  /* 6-7 (goście) i 14-15 (gospodarze) — wyłącznie juniorzy. */
  const juniorOnly=(LgLineupStep==="home"&&(num===14||num===15))||(LgLineupStep==="away"&&(num===6||num===7));
  if(juniorOnly&&!(S.juniors||[]).includes(name)){UI.toast("❌ Pod numer "+num+" można wpisać wyłącznie juniora.");renderLgLineup();return;}
  side.lineup[num]=name;
  renderLgLineup();
};
UI.lgClearLineup=function(num){
  const side=LgW&&LgW[LgLineupStep];if(!side)return;
  side.lineup[num]=null;
  renderLgLineup();
};
UI.lgLineupNext=function(){
  if(LgLineupStep==="home"){
    if(!LgW.home.lineup[9]){UI.toast("Przypisz zawodnika nr 9.");return;}
    LgLineupStep="away";
    if(!LgW.away)UI.screen("lgTeam");else UI.screen("lgLineup");
    return;
  }
  if(!LgW.away.lineup[1]){UI.toast("Przypisz zawodnika nr 1.");return;}
  /* Walidacja: 6-7 / 14-15 tylko juniorzy (jeśli obsadzone). */
  const badJr=[["home",14],["home",15],["away",6],["away",7]].find(([tk,n])=>{
    const nm=LgW[tk].lineup[n];
    return nm&&!(S.juniors||[]).includes(nm);
  });
  if(badJr){UI.toast("❌ Nr "+badJr[1]+" ("+(badJr[0]==="home"?"gospodarze":"goście")+") — wyłącznie junior.");LgLineupStep=badJr[0];UI.screen("lgLineup");return;}
  const c=newLeagueComp(LgW);
  if(!mutate(()=>{
    S.comps[c.id]=c;S.current=c.id;S.settings.lastComp=c.id;
  }))return;
  prestartSnapshot(c);
  LgW=null;LgLineupStep=null;
  UI.screen("match");
};

/* Zestawy startowe meczu ligowego (numery: goście 1-8, gospodarze 9-16). Kolejność
   w wierszu = pole startowe; kaski: C czerwony i N niebieski = gospodarze, B biały i Ż żółty = goście. */
const LG_SET1=[
[[1,"Ż"],[9,"C"],[3,"B"],[11,"N"]],
[[15,"C"],[6,"B"],[14,"N"],[7,"Ż"]],
[[5,"Ż"],[12,"N"],[2,"B"],[13,"C"]],
[[14,"N"],[4,"Ż"],[10,"C"],[6,"B"]],
[[11,"C"],[3,"B"],[12,"N"],[4,"Ż"]],
[[13,"C"],[2,"B"],[15,"N"],[1,"Ż"]],
[[7,"B"],[10,"N"],[5,"Ż"],[9,"C"]],
[[3,"B"],[13,"C"],[4,"Ż"],[14,"N"]],
[[9,"C"],[1,"Ż"],[10,"N"],[2,"B"]],
[[6,"B"],[11,"C"],[5,"Ż"],[12,"N"]],
[[12,"N"],[4,"B"],[9,"C"],[1,"Ż"]],
[[2,"Ż"],[15,"N"],[7,"B"],[11,"C"]],
[[10,"N"],[5,"Ż"],[13,"C"],[3,"B"]],
[["Ż"],["C"],["B"],["N"]],
[["C"],["Ż"],["N"],["B"]]
];
const LG_SET2=[
[[9,"C"],[1,"Ż"],[11,"N"],[3,"B"]],
[[6,"B"],[15,"C"],[7,"Ż"],[14,"N"]],
[[12,"N"],[5,"Ż"],[13,"C"],[2,"B"]],
[[4,"Ż"],[14,"N"],[6,"B"],[10,"C"]],
[[3,"B"],[11,"C"],[4,"Ż"],[12,"N"]],
[[2,"B"],[13,"C"],[1,"Ż"],[15,"N"]],
[[10,"N"],[7,"B"],[9,"C"],[5,"Ż"]],
[[13,"C"],[3,"B"],[14,"N"],[4,"Ż"]],
[[1,"Ż"],[9,"C"],[2,"B"],[10,"N"]],
[[11,"C"],[6,"B"],[12,"N"],[5,"Ż"]],
[[4,"B"],[12,"N"],[1,"Ż"],[9,"C"]],
[[15,"N"],[2,"Ż"],[11,"C"],[7,"B"]],
[[5,"Ż"],[10,"N"],[3,"B"],[13,"C"]],
[["C"],["Ż"],["N"],["B"]],
[["Ż"],["C"],["B"],["N"]]
];
const LG_SETS={1:LG_SET1,2:LG_SET2};
const LG_EXCL_CODES=["W","D","T","U","W2","U/-","-"];
const LG_RZ_CODES=["T","W2","U/-","-"];
/* „Zawodnik zastępowany” — ficzer ZZ: stoi w składzie, sam nie jeździ; przed każdym
   jego biegiem (1–13) pojawia się okienko wyboru, kto pojedzie jako ZZ. */
const LG_ZZ_NAME="Zawodnik zastępowany";

/* Zawodnicy dodani w drużinach zasilają wspólną bazę (S.riders) — są dzięki temu
   od razu widoczni w „Przypisz z bazy” serii indywidualnych (SGP, SEC...). */
(function(){
  let added=false;
  (S.teams||[]).forEach(t=>(t.riders||[]).forEach(n=>{
    if(n!==LG_ZZ_NAME&&!S.riders.includes(n)){S.riders.push(n);added=true;}
  }));
  if(added)persist();
})();

function lgSlotFromSrc(s){const isNum=typeof s[0]==="number";return {num:isNum?s[0]:null,helmet:isNum?s[1]:s[0],excl:null,subType:null,origNum:isNum?s[0]:null};}
function newLeagueComp(w){
  const m={set1_13:1,set14_15:1,heats:[]};
  const a=LG_SETS[m.set1_13],b=LG_SETS[m.set14_15];
  for(let i=0;i<15;i++){
    const src=i<13?a[i]:b[i];
    m.heats.push({n:i+1,slots:src.map(lgSlotFromSrc),
      order:[0,1,2,3],confirmed:false,score:null,menuOpen:null,subListFor:null,time:null});
  }
  return {id:(typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():("c"+Date.now()),
    date:new Date().toLocaleDateString("pl-PL"),format:"liga",league:true,launched:true,
    name:w.home.name+" – "+w.away.name,
    home:{name:w.home.name,lineup:Object.assign({},w.home.lineup)},
    away:{name:w.away.name,lineup:Object.assign({},w.away.lineup)},
    match:m,mapping:{},overrides:{}};
}

/* ===== Silnik meczu ligowego ===== */
function lgm(){const c=cur();return c&&c.league?c.match:null;}
function lgFirstOpenIdx(m){for(let i=0;i<m.heats.length;i++)if(!m.heats[i].confirmed)return i;return -1;}
function lgHeatEditable(heatIdx){const m=lgm();return !!m&&heatIdx===lgFirstOpenIdx(m);}
function lgTeamUsed(m,teamKey,type){const u=m[type==="RT"?"rtUsed":"zzUsed"];return !!(u&&u[teamKey]);}
function lgSideOfNum(num){return num<=8?"away":"home";}
function lgRiderName(num){
  const c=cur();
  const side=lgSideOfNum(num)==="home"?c.home:c.away;
  return side.lineup[num]||("Brak zawodnika");
}
function lgLineup(teamKey){
  const c=cur();
  return teamKey==="home"?c.home:c.away;
}
function lgTeamOfHelmet(h){return (h==="C"||h==="N")?"home":"away";}
function lgDotClass(h){return {C:"lg-dC",N:"lg-dN",B:"lg-dB","Ż":"lg-dZ"}[h];}
function lgFinishers(h){
  return h.order.filter(i=>{const s=h.slots[i];return !s.excl&&s.num!=null;});
}
/* Punktacja: 3-2-1-0 wg kolejności mety. Bonus (apostrof) tylko przy 5:1/1:5 (2. miejsce)
   i przy 3:3 — wyłącznie gdy bieg ukończyły wszystkie 4 osoby (3. miejsce). */
function lgComputeScore(h){
  const fins=lgFinishers(h);
  const present=fins.map(i=>h.slots[i]);
  let home=0,away=0;
  const pts=present.map((_,i)=>Math.max(3-i,0));
  present.forEach((slot,i)=>{
    if(lgTeamOfHelmet(slot.helmet)==="home")home+=pts[i];else away+=pts[i];
  });
  let bonusSlot=null;
  if((home===5&&away===1)||(home===1&&away===5))bonusSlot=fins[1];
  else if(home===3&&away===3&&fins.length===4)bonusSlot=fins[2];
  return {home,away,bonusSlot};
}
function lgCumulative(m,beforeHeatIdx){
  let home=0,away=0;
  for(let i=0;i<beforeHeatIdx;i++){
    const h=m.heats[i];
    if(h.confirmed&&h.score){home+=h.score.home;away+=h.score.away;}
  }
  return {home,away};
}
/* Limity startów liczone od nowa ze stanu biegów: 5 bazowo, +1 za RT, +1 za ZZ (max 7). */
function lgUsage(m){
  const us={};
  const rec=n=>{if(!us[n])us[n]={starts:0,usedRT:false,usedZZ:false};return us[n];};
  m.heats.forEach(h=>{
    h.slots.forEach(s=>{
      if(s.num==null)return;
      if(s.subType==="RT")rec(s.num).usedRT=true;
      if(s.subType==="ZZ")rec(s.num).usedZZ=true;
    });
    if(h.confirmed)lgFinishers(h).forEach(i=>rec(h.slots[i].num).starts++);
  });
  return us;
}
function lgRiderTotals(teamKey,upto){
  /* upto — liczba biegów branych pod uwagę (nominacje 14/15 liczą punkty z biegów 1-13) */
  const m=lgm();if(!m)return{};
  const side=lgLineup(teamKey);
  const totals={};
  Object.keys(side.lineup).forEach(n=>totals[+n]={pts:0,bon:0,cells:[]});
  m.heats.forEach(h=>{
    if(h.n>(upto||15))return;
    if(!h.confirmed||!h.score)return;
    lgFinishers(h).forEach((slotIdx,pos)=>{
      const slot=h.slots[slotIdx];
      if(slot.num==null)return;
      if(lgTeamOfHelmet(slot.helmet)!==teamKey)return;
      const pts=Math.max(3-pos,0);
      if(!totals[slot.num])totals[slot.num]={pts:0,bon:0,cells:[]};
      totals[slot.num].pts+=pts;
      const isBonus=h.score.bonusSlot===slotIdx;
      if(isBonus)totals[slot.num].bon+=1;
      totals[slot.num].cells.push({heat:h.n,pts,bonus:isBonus});
    });
    h.slots.forEach(slot=>{
      if(!slot.excl||slot.num==null)return;
      if(lgTeamOfHelmet(slot.helmet)!==teamKey)return;
      if(!totals[slot.num])totals[slot.num]={pts:0,bon:0,cells:[]};
      totals[slot.num].cells.push({heat:h.n,excl:slot.excl});
    });
  });
  Object.values(totals).forEach(t=>t.cells.sort((a,b)=>a.heat-b.heat));
  return totals;
}
/* Zastępstwa (cały mecz, biegi 1-15): RZ — rezerwa zwykła: za pozycje
   seniorskie 1-5 / 9-13 mogą wjechać rezerwowi 6-7 / 14-15 oraz 8 / 16;
   rezerwowy 8 / 16 jako junior (J) może dodatkowo zastąpić pozycje juniorskie
   6-7 / 14-15 (w RZ i RT). Junior wystawiony na pozycji seniorskiej jest traktowany
   jak senior (również w RT: nie ogranicza zastępującego do juniorów).
   RT — rezerwa taktyczna (każdy z 1-16, tylko przy stracie 6+ pkt, raz na mecz
   drużyny, każdy zawodnik tylko raz jako RT). ZZ obsługuje „Zawodnik zastępowany”
   (zob. niżej) — z menu wykluczeń opcja ZZ zniknęła. */function lgIsJunior(num,teamKey){
  const side=lgLineup(teamKey);
  const name=side&&side.lineup[num];
  return !!(name&&S.juniors&&S.juniors.includes(name));
}
function lgEligible(teamKey,exclNum,type,heatIdx){
  const m=lgm();if(!m)return[];
  const side=lgLineup(teamKey);
  const nums=Object.keys(side.lineup).map(Number);
  const reserves=teamKey==="home"?[14,15,16]:[6,7,8];
  const us=lgUsage(m);
  const isMain=teamKey==="home"?(exclNum>=9&&exclNum<=13):(exclNum>=1&&exclNum<=5);
  const isRes=teamKey==="home"?(exclNum===14||exclNum===15):(exclNum===6||exclNum===7);
  const jrNum=teamKey==="home"?16:8;
  let cands=[];
  if(type==="RZ"){
    /* RZ: rezerwowy 8/16 może zastępować również pozycje seniorskie 1-5 / 9-13;
       jako junior (J) dodatkowo zastępuje juniorów 6-7 / 14-15 (RZ i RT). */
    if(isMain)cands=reserves.slice();
    else if(isRes&&lgIsJunior(jrNum,teamKey))cands=[jrNum];
  }else if(type==="RT"){
    /* RT za juniora (6-7 / 14-15) — wyłącznie junior z rezerw (6-8 / 14-16). */
    if(isRes)cands=reserves.filter(n=>n!==exclNum&&lgIsJunior(n,teamKey));
    else cands=nums.filter(n=>n!==exclNum);
  }
  const inHeat=new Set(m.heats[heatIdx].slots.map(s=>s.num));
  return cands.filter(n=>{
    if(side.lineup[n]==null)return false; /* miejsce nieobsadzone — nie ma kto jechać */
    if(side.lineup[n]===LG_ZZ_NAME)return false; /* Zawodnik zastępowany nikogo nie zastępuje */
    if(inHeat.has(n))return false;
    const rec=us[n]||{starts:0,usedRT:false,usedZZ:false};
    const limit=5+(rec.usedRT?1:0)+(rec.usedZZ?1:0);
    if(rec.starts>=limit)return false;
    if(type==="RT"&&rec.usedRT)return false;
    return true;
  });
}
function lgRtAllowed(teamKey,heatIdx){
  const m=lgm();if(!m)return false;
  const c=lgCumulative(m,heatIdx);
  const diff=teamKey==="home"?(c.away-c.home):(c.home-c.away);
  return diff>=6;
}
/* ===== „Zawodnik zastępowany” (ZZ) =====
   Stoi w składzie na wybranym numerze, ale sam nie jeździ. Gdy najbliższy (aktywny)
   bieg 1–13 jest rozgrywany z jego udziałem, automatycznie pojawia się okienko:
   trzeba wybrać, kto pojedzie jako ZZ. Każdy zawodnik może pojechać jako ZZ tylko
   raz w meczu. W biegach nominowanych (14–15) nie można go wybrać. */
let lgZZAsked={}; /* klucz heatIdx_slotIdx — okienko pokazane, nie powtarzamy */
function lgIsZZRider(num,teamKey){
  const side=lgLineup(teamKey);
  return !!(side&&side.lineup[num]===LG_ZZ_NAME);
}
function lgZZCandidates(teamKey,heatIdx){
  const m=lgm();if(!m)return[];
  const side=lgLineup(teamKey);
  const nums=Object.keys(side.lineup).map(Number);
  const inHeat=new Set(m.heats[heatIdx].slots.filter(s=>s.num!=null).map(s=>s.num));
  const us=lgUsage(m);
  return nums.filter(n=>{
    if(side.lineup[n]==null||side.lineup[n]===LG_ZZ_NAME)return false;
    if(inHeat.has(n))return false;
    const rec=us[n]||{starts:0,usedRT:false,usedZZ:false};
    if(rec.usedZZ)return false; /* każdy zawodnik tylko raz jako ZZ */
    const limit=5+(rec.usedRT?1:0)+1; /* pojechanie jako ZZ daje +1 do limitu startów */
    if(rec.starts>=limit)return false;
    return true;
  });
}
/* Okno z zapowiedzią: NIE znika samo — użytkownik zamyka je przyciskiem „Dalej”,
   żeby zdążyć przeczytać, co zaraz nastąpi. locked=true → nie zamknie go też
   kliknięcie w tło ani Esc. */
UI.announce=function(title,msg,cb){
  UI.openModal("<h3>"+title+"</h3><p style='text-align:center;font-size:0.85rem;margin:0 0 12px'>"+msg+"</p>"+
    "<button class='btn primary' id='annOk'>Dalej &#10132;</button>",true);
  $("annOk").onclick=()=>{UI.closeModal();cb&&cb();};
};
function lgMaybePromptZZ(){
  const m=lgm();if(!m)return;
  const hi=lgFirstOpenIdx(m);if(hi<0)return;
  const h=m.heats[hi];if(h.confirmed||h.n>13)return;
  for(let slotIdx=0;slotIdx<h.slots.length;slotIdx++){
    const slot=h.slots[slotIdx];
    if(slot.num==null||slot.excl||slot.subType)continue;
    const teamKey=lgTeamOfHelmet(slot.helmet);
    if(!lgIsZZRider(slot.num,teamKey))continue;
    const key=hi+"_"+slotIdx;
    if(lgZZAsked[key])continue;
    lgZZAsked[key]=true;
    const cands=lgZZCandidates(teamKey,hi);
    const rt=lgZZRtCandidates(teamKey,hi,slot.num);
    if(cands.length||rt.length)UI.lgPromptZZ(hi,slotIdx,teamKey,cands,rt);
    return; /* jedno okienko naraz — kolejny slot ZZ dostanie prompt po obsłużeniu tego */
  }
}
/* RT za Zawodnika zastępowanego: tylko przy stracie 6+ pkt. Pozwala wstawić także kogoś,
   kto już raz pojechał jako ZZ (i dlatego nie ma go na liście ZZ). */
function lgZZRtCandidates(teamKey,heatIdx,zzNum){
  if(!lgRtAllowed(teamKey,heatIdx))return [];
  return lgEligible(teamKey,zzNum,"RT",heatIdx);
}
UI.lgPromptZZ=function(heatIdx,slotIdx,teamKey,cands,rt){
  rt=rt||[];
  const m=lgm();const h=m.heats[heatIdx];
  const zzNum=h.slots[slotIdx].num;
  UI.announce("Zastępstwo — ZZ",
    "Bieg "+h.n+": w składzie pod numerem <b>"+zzNum+"</b> jedzie <b>Zawodnik zastępowany</b>."+
    " Za chwilę wybierzesz, kto pojedzie w jego miejsce."+(rt.length?" Drużyna przegrywa o 6+ pkt, więc dostępna jest też <b>RT</b>.":""),
    ()=>{
      const us=lgUsage(m);
      const lab=t=>"<div style='font-size:0.72rem;color:var(--text-muted);text-align:center;margin:8px 0 4px'>"+t+"</div>";
      let html="<h3>Zastępstwo — Bieg "+h.n+"</h3><p style='text-align:center;font-size:0.78rem;color:var(--text-muted);margin:0 0 6px'><b>Zawodnik zastępowany</b> (nr "+zzNum+") — wybierz, kto pojedzie w jego miejsce.</p>";
      if(cands.length){
        if(rt.length)html+=lab("ZZ — zastępstwo zawodnika");
        cands.forEach(n=>{
          const rec=us[n]||{starts:0,usedRT:false,usedZZ:false};
          const left=5+(rec.usedRT?1:0)+1-rec.starts;
          html+="<button class='btn' style='text-transform:none' data-zz='"+n+"' data-t='ZZ'>"+escq(lgRiderName(n))+" <small style='opacity:0.7'>(pozostałe starty: "+left+")</small></button>";
        });
      }
      if(rt.length){
        html+=lab("RT — rezerwa taktyczna (strata 6+ pkt)");
        rt.forEach(n=>{
          const rec=us[n]||{starts:0,usedRT:false,usedZZ:false};
          const left=5+(rec.usedZZ?1:0)-rec.starts;
          html+="<button class='btn' style='text-transform:none' data-zz='"+n+"' data-t='RT'>"+escq(lgRiderName(n))+" <small style='opacity:0.7'>(pozostałe starty: "+left+""+")</small></button>";
        });
      }
      /* „Anuluj” zamyka okno bez wyboru: bieg pozostaje nieobsadzony pod tym numerem,
         a zatwierdzenie biegu z ZZ bez zastępstwa nadal blokuje lgConfirmHeat (toast).
         Prompt nie wyskoczy ponownie sam (lgZZAsked już odhaczone). */
      html+="<button class='btn' style='margin-top:10px' data-onclick='UI.closeModal()'>Anuluj</button>";
      UI.openModal(html,true);
      $("modal").querySelectorAll("[data-zz]").forEach(b=>b.onclick=()=>UI.lgPickZZ(heatIdx,slotIdx,teamKey,+b.dataset.zz,b.dataset.t));
    });
};
UI.lgPickZZ=function(heatIdx,slotIdx,teamKey,n,type){
  const m=lgm();if(!m)return;
  const h=m.heats[heatIdx];
  if(!mutate(()=>{h.slots[slotIdx].num=n;h.slots[slotIdx].subType=type||"ZZ";lgReorder(h);}))return;
  UI.closeModal();lgRender();
};
/* Biegi nominowane 14/15: do 14 nie można wybrać dwóch najlepszych (bonusy się nie liczą). */
/* Biegi nominowane 14/15: przy ustalaniu składów NIE uwzględniamy rezerw 6-8/14-16
   (one mogą w nich wystąpić wg normalnych zasad rezerw). Bieg 15: jeździ najlepszy
   zawodnik podstawowego składu (1-5 / 9-13) plus jeden dowolnie wybrany; pozostali
   — w biegu 14. Zawodnik nie może wystąpić w obu biegach nominowanych. */
function lgNomMainNums(teamKey){
  const side=lgLineup(teamKey);
  const nums=Object.keys(side.lineup).map(Number)
    .filter(n=>side.lineup[n]!=null&&side.lineup[n]!==LG_ZZ_NAME);
  return teamKey==="home"?nums.filter(n=>n>=9&&n<=13):nums.filter(n=>n>=1&&n<=5);
}
function lgNomPlan(tk){
  /* Plan nominacji 14/15 (punkty BEZ bonusów, po biegach 1-13; ZZ nigdy nie jedzie).
     v1 = punkty 2. zawodnika. locked = ściśle powyżej v1 (pewni do biegu 15, ukryci w 14).
     tie = równo v1 (remis o miejsca w 15); free = ile miejsc w 15 zostaje do obsadzenia.
     Jeśli tie mieści się w free, wszyscy z tie jadą w 15 (forced). W przeciwnym razie
     trener w biegu 14 może wziąć z tie najwyżej cap = tie-free osób. */
  const totals=lgRiderTotals(tk,13);
  const pts=n=>((totals[n]||{}).pts||0);
  const avail=lgEligibleNominated(tk,13).slice().sort((x,y)=>pts(y)-pts(x));
  if(!avail.length)return {avail,locked:[],tie:[],below:[],forced:[],free:0,cap:0};
  const v1=pts(avail[Math.min(1,avail.length-1)]);
  const locked=avail.filter(n=>pts(n)>v1);
  const tie=avail.filter(n=>pts(n)===v1);
  const below=avail.filter(n=>pts(n)<v1);
  const free=Math.max(0,2-locked.length);
  const forced=tie.length<=free?locked.concat(tie):locked.slice();
  return {avail,locked,tie,below,forced,free,cap:Math.max(0,tie.length-free)};
}
function lgEligibleNominated(teamKey,heatIdx){
  /* Biegi nominowane 14/15: przy ustalaniu składów brani są pod uwagę wyłącznie
     zawodnicy pozycji seniorskich 1-5 / 9-13 — junior wystawiony na pozycji seniorskiej
     liczy się jak senior. Rezerwi 6-8 / 14-16 nie są brani pod uwagę przy ustalaniu
     składów, ale mogą w nich wystąpić jako rezerwy wg zwykłych zasad. Bieg 15 —
     tylko czołówka punktacyjna (lgNomTopGroup). */
  const m=lgm();if(!m)return[];
  const us=lgUsage(m);
  const h=m.heats[heatIdx];
  const inHeat=new Set(h.slots.filter(s=>s.num!=null).map(s=>s.num));
  const other=m.heats[h.n===14?heatIdx+1:heatIdx-1];
  /* Wyjątek regulaminowy: rezerwa taktyczna (RT) w drugim biegu nominowanym
     NIE blokuje jazdy zasadniczej w tym biegu — zawodnik przydzielony z urzędu
     do 15 może pojechać w 14 jako RT i nadal jechać w 15. */
  const inOther=new Set(other&&other.slots.filter(s=>s.num!=null&&!s.subType).map(s=>s.num));
  let cands=lgNomMainNums(teamKey);
  return cands.filter(n=>{
    if(inHeat.has(n))return false;
    if(inOther.has(n))return false;
    const rec=us[n]||{starts:0,usedRT:false,usedZZ:false};
    return rec.starts<5+(rec.usedRT?1:0)+(rec.usedZZ?1:0);
  });
}
/* ===== Panel nominacji: po biegu 13 trenerzy OBU drużyn wybierają — od razu,
   w jednym miejscu — składy na biegi 14 i 15 (najpierw 15, potem 14). Decyzje
   zapisujemy dopiero po zakończeniu całego panelu. ===== */
let lgNomAsked={}; /* klucz: id zawodów — panel pokazujemy raz na mecz */
let LgNom=null;
let LgNomPre=null; /* snapshot stanu meczu sprzed panelu nominacji — rollback po „Anuluj” */
function lgMaybeNominate(){
  const m=lgm();if(!m)return;
  const c=cur();if(!c)return;
  if(lgNomAsked[c.id])return;
  const hi=lgFirstOpenIdx(m);if(hi<0)return;
  if(m.heats[hi].n!==14)return;
  if(m.nom)return; /* pula już wybrana */
  if(m.heats[hi].slots.some(s=>s.num!=null)||m.heats[hi+1].slots.some(s=>s.num!=null))return;
  lgNomAsked[c.id]=true;
  UI.lgNominatePanel(); /* ścieżka automatyczna — snapshot bierze bieżący (pusty) stan */
}
UI.lgNominatePanel=function(preSnap){
  const m=lgm();if(!m)return;
  /* Snapshot stanu meczu sprzed panelu: przy „Anuluj” przywracamy całość
     (m.nom + obsady biegów 14/15). Dla ponownych nominacji (lgRenominate)
     snapshot musi zostać zrobiony PRZED wyczyszczeniem biegów — dlatego
     przyjmujemy go jako argument; w ścieżce automatycznej wystarczy bieżący stan. */
  LgNomPre=(typeof preSnap==="string")?preSnap:JSON.stringify(m);
  UI.announce("Nominacje — biegi 14 i 15",
    "Zatwierdzono biegi 1–13. Trenerzy <b>obu drużyn</b> wybiorą teraz zawodników nominowanych"+
    " — najpierw do biegu 14, potem do biegu 15 (w nim jadą dwaj najlepsi punktowo).",
    ()=>{
      /* KOLEJNOŚĆ KROKÓW: najpierw bieg 14 (gospodarze i goście), dopiero potem
         bieg 15 (gospodarze i goście).
         — Bieg 14: na liście wyboru pojawiają się WSZYSCY zawodnicy z pozycji
           zasadniczych 1–5 / 9–13 (bez ograniczeń punktowych). Nad listą widnieje
           jednak komentarz, że do biegu 15 nominuje się dwóch najlepszych
           punktowo zawodników drużyny.
         — Bieg 15: na liście pojawiają się wyłącznie dwaj najlepsi punktowi
           (wg klasyfikacji po biegach 1–13, remisy rozstrzyga trener), ALE z
           wykluczeniem zawodników już nominowanych do biegu 14 — bo kto jedzie
           w 14, NIE może jechać w 15 (jedyny wyjątek: start w ramach rezerwy
           taktycznej RT).
         Dzięki tej kolejności trener od razu widzi pełną listę na bieg 14,
         a przy wyborze do 15 system sam pilnuje wykluczenia dublowanych startów. */
      LgNom={steps:[["home",14],["away",14],["home",15],["away",15]],i:0,picks:[],sel:[]};
      UI.lgNominateShow();
    });
};
UI.lgNominateShow=function(){
  const m=lgm();if(!m||!LgNom)return;
  const st=LgNom.steps[LgNom.i];
  const tk=st[0],n=st[1];
  const plan=lgNomPlan(tk);
  const nm=x=>x+" "+lgRiderName(x);
  let cands,need,note="";
  LgNom.lock=[];LgNom.tieSet=[];LgNom.cap=0;
  if(n===14){
    /* Bieg 14: bez pewniaków do 15; z remisu o 2. miejsce max cap osób. */
    cands=plan.avail.filter(x=>!plan.forced.includes(x));
    need=Math.min(2,plan.cap+plan.below.length);
    LgNom.tieSet=plan.tie.slice();LgNom.cap=plan.cap;
    if(plan.forced.length)note=(plan.forced.length===1?"Zawodnik przydzielony z urzędu do biegu 15: ":"Zawodnicy przydzieleni z urzędu do biegu 15: ")+plan.forced.map(nm).join(", ")+".";
    if(plan.cap>0)note+=" Remis punktowy "+plan.tie.length+" zawodników ("+plan.tie.join(", ")+"). Do biegu 14 możesz nominować "+plan.cap+" z nich.";
  }else{
    const ch=LgNom.picks.filter(p=>p.tk===tk&&p.n===14).map(p=>p.riders).flat();
    cands=plan.avail.filter(x=>(plan.locked.includes(x)||plan.tie.includes(x))&&!ch.includes(x));
    need=Math.min(2,cands.length);
    LgNom.lock=plan.locked.filter(x=>cands.includes(x));
    LgNom.lock.forEach(x=>{if(!LgNom.sel.includes(x))LgNom.sel.unshift(x);});
    if(LgNom.lock.length)note=(LgNom.lock.length===1?"Zawodnik przydzielony z urzędu: ":"Zawodnicy przydzieleni z urzędu: ")+LgNom.lock.map(nm).join(", ")+".";
  }
  if(cands.length<=need)LgNom.lock=cands.slice(); /* brak wyboru — wszyscy jadą */
  LgNom.lock.forEach(x=>{if(!LgNom.sel.includes(x))LgNom.sel.unshift(x);});
  LgNom.tk=tk;LgNom.n=n;LgNom.cands=cands;LgNom.need=need;
  /* Zabezpieczenie: gdyby w danym kroku nie było ani jednego kandydata,
     krok pomijamy automatycznie (okno jest zablokowane — nie może utknąć). */
  if(!cands.length){UI.lgNominateNext();return;}
  const sub="font-size:0.72rem;color:var(--text-muted);text-align:center;margin:0 0 8px";
  let html="<h3>Nominacja — bieg "+n+"</h3>"+
    "<p style='"+sub+"'>"+escq(lgLineup(tk).name)+" — wybierz "+LgNom.need+(LgNom.need===1?" zawodnika.":" zawodników.")+"</p>"+
    (note?"<p style='"+sub+"'>"+escq(note.trim())+"</p>":"")+
    "<p style='"+sub+"'>Kolory kasków ustalisz na karcie wyścigu.</p>";
  cands.forEach(x=>{
    const on=LgNom.sel.includes(x);
    const dim=(LgNom.lock||[]).includes(x)||(!on&&n===14&&LgNom.tieSet.includes(x)&&LgNom.sel.filter(v=>LgNom.tieSet.includes(v)).length>=LgNom.cap);
    html+="<button class='btn "+(on?"primary":"secondary")+"' style='text-transform:none;justify-content:flex-start"+(dim?";opacity:0.45":"")+"' data-onclick='UI.lgNominateToggle("+x+")'><span style='flex:1;text-align:left'>"+x+" — "+escq(lgRiderName(x))+"</span></button>";
  });
  html+="<div style='display:flex;gap:8px;justify-content:center;margin-top:12px'>"+
    (LgNom.i>0
      ?"<button class='btn secondary' data-onclick='UI.lgNominateBack()'>&#10094; Wstecz</button>"
      :"")+
    (LgNom.sel.length===LgNom.need
      ?"<button class='btn primary' data-onclick='UI.lgNominateNext()'>Dalej &#10132;</button>"
      :"<button class='btn' disabled style='opacity:0.4'>Dalej &#10132;</button>")+
    "<button class='btn danger' data-onclick='UI.lgNominateCancel()'>Anuluj</button>"+
    "</div>";
  /* Okno nominacji jest ZABLOKOWANE (locked): nie zamknie go kliknięcie w tło
     ani Esc. Zamyka się automatycznie dopiero po zapisaniu WSZYSTKICH czterech
     decyzji (2× bieg 14, 2× bieg 15) — nie ma przycisku „Anuluj”. */
  UI.openModal(html,true);
};
UI.lgNominateToggle=function(x){
  if(!LgNom)return;
  if((LgNom.lock||[]).includes(x))return; /* dwaj najlepsi — z urzędu w 15 */
  if(LgNom.sel.includes(x))LgNom.sel=LgNom.sel.filter(v=>v!==x);
  else if(LgNom.sel.length<LgNom.need){
    if(LgNom.n===14&&LgNom.tieSet.includes(x)&&LgNom.sel.filter(v=>LgNom.tieSet.includes(v)).length>=LgNom.cap){
      UI.toast("Z remisu możesz nominować do biegu 14 najwyżej "+LgNom.cap+".");return;
    }
    LgNom.sel=[...LgNom.sel,x];
  }
  UI.lgNominateShow();
};
UI.lgNominateNext=function(){
  const m=lgm();if(!m||!LgNom)return;
  if(LgNom.sel.length!==LgNom.need)return;
  LgNom.picks.push({tk:LgNom.tk,n:LgNom.n,riders:LgNom.sel.slice()});
  LgNom.sel=[];
  LgNom.i++;
  if(LgNom.i>=LgNom.steps.length){
    /* wszystkie cztery decyzje zapadły — zapisujemy jednym zapisem stanu */
    const picks=LgNom.picks;LgNom=null;
    if(!mutate(()=>{
      m.nom={};
      picks.forEach(p=>{(m.nom[p.n]=m.nom[p.n]||{})[p.tk]=p.riders.slice();});
    }))return;
    UI.closeModal();lgRender();return;
  }
  UI.lgNominateShow();
};
/* Anulowanie panelu nominacji: przywraca stan meczu sprzed panelu (rollback
   m.nom i obsad biegów 14/15 zapisany w LgNomPre) i zamyka okno. */
UI.lgNominateCancel=function(){
  const m=lgm();
  const pre=LgNomPre;
  LgNom=null;LgNomPre=null;
  if(m&&typeof pre==="string"){
    let restored=null;
    try{restored=fixMojiDeep(JSON.parse(pre));}catch(e){}
    if(restored&&typeof restored==="object"){
      if(!mutate(()=>{Object.keys(restored).forEach(k=>m[k]=restored[k]);}))return;
    }
  }
  UI.closeModal();lgRender();
};
/* Cofnięcie do poprzedniego kroku kreatora nominacji (bez utraty wcześniejszych wyborów). */
UI.lgNominateBack=function(){
  if(!LgNom||LgNom.i===0)return;
  LgNom.i--;
  LgNom.picks.pop();
  LgNom.sel=[];
  UI.lgNominateShow();
};
/* Ponowne nominacje: wraca do momentu wyboru zawodników na biegi 14 i 15.
   Dostępne, dopóki biegi 14 i 15 nie są zatwierdzone — czyści oba składy
   i otwiera panel od nowa (dla obu drużyn). */
UI.lgRenominate=function(){
  const c=cur();const m=lgm();if(!c||!m)return;
  const h14=m.heats[13],h15=m.heats[14];
  if(!m.heats.slice(0,13).every(h=>h.confirmed)){UI.toast("Nominacje są dostępne po zatwierdzeniu biegów 1–13.");return;}
  if(h14.confirmed||h15.confirmed){UI.toast("Najpierw zresetuj bieg 14 i 15 — nominacje można zmienić tylko przed ich zatwierdzeniem.");return;}
  UI.confirm("Ponownie wybrać nominowanych zawodników do biegów 14 i 15?<br><small style='color:var(--text-muted)'>Obecne obsady tych biegów zostaną wyczyszczone.</small>",()=>{
    const preMatch=JSON.stringify(m); /* stan sprzed czyszczenia — rollback dla „Anuluj” */
    if(!mutate(()=>{
      delete m.nom;
      [h14,h15].forEach(h=>{
        h.slots.forEach(s=>{s.num=null;s.excl=null;s.subType=null;delete s.exclSeq;delete s.exclWas;});
        h.order=[0,1,2,3];h.confirmed=false;h.score=null;h.menuOpen=null;h.subListFor=null;h.time=null;
      });
    }))return;
    UI.closeModal();
    lgNomAsked[c.id]=true; /* panel otwieramy ręcznie; po anulowaniu niech nie wyskakuje sam */
    UI.lgNominatePanel(preMatch);
  });
};

/* ===== Interakcje meczu ===== */
let lgExclSeq=0;
function lgReorder(h){
  /* Dopóki w biegu nominowanym są nieobsadzone pola — zachowujemy układ pól startowych;
     przestawianie (meta/wykluczenia) zaczyna działać dopiero po obsadzeniu całego biegu. */
  if(h.slots.some(s=>s.num==null))return;
  const fins=h.order.filter(i=>{const s=h.slots[i];return !s.excl&&s.num!=null;});
  const excluded=h.slots.map((s,i)=>i).filter(i=>h.slots[i].excl&&h.slots[i].num!=null)
    .sort((a,b)=>(h.slots[b].exclSeq||0)-(h.slots[a].exclSeq||0));
  const pending=h.slots.map((s,i)=>i).filter(i=>h.slots[i].num==null);
  h.order=[...fins,...excluded,...pending];
}
UI.lgMoveSlot=function(heatIdx,slotIdx,dir){
  const h=lgm().heats[heatIdx];if(h.confirmed||!lgHeatEditable(heatIdx))return;
  const fins=lgFinishers(h);
  const rest=h.order.filter(i=>!fins.includes(i));
  const idx=fins.indexOf(slotIdx),nidx=idx+dir;
  if(idx<0||nidx<0||nidx>=fins.length)return;
  [fins[idx],fins[nidx]]=[fins[nidx],fins[idx]];
  if(!mutate(()=>{h.order=[...fins,...rest];}))return;
  lgRenderHeatOnly(heatIdx);
};
UI.lgConfirmHeat=function(heatIdx){
  const m=lgm();const h=m.heats[heatIdx];
  const fo=lgFirstOpenIdx(m);
  if(fo!==heatIdx&&fo>=0){UI.toast("Najpierw zatwierdź bieg "+m.heats[fo].n+".");return;}
  if(h.slots.some(s=>s.num==null)){UI.toast("Wybierz zawodników do biegu nominowanego.");return;}
  /* Bezwzględne zabezpieczenie: „Zawodnik zastępowany” NIGDY nie może zostać
     zatwierdzony jako jadący bez wybranego zastępstwa ZZ. */
  for(const s of h.slots){
    if(s.num==null||s.excl||s.subType)continue;
    const tk=lgTeamOfHelmet(s.helmet);
    if(lgIsZZRider(s.num,tk)){
      /* Gdy nie ma żadnego dostępnego kandydata na ZZ, nie blokujemy zatwierdzenia. */
      if(lgZZCandidates(tk,heatIdx).length===0&&lgZZRtCandidates(tk,heatIdx,s.num).length===0)continue;
      UI.toast("Bieg "+h.n+": pod numerem "+s.num+" jedzie Zawodnik zastępowany — wybierz najpierw zastępstwo.");
      return;
    }
  }
  if(h.n===14){
    /* Regulamin: nominacje do biegów 14 i 15 zapadają RAZEM, przed rozegraniem 14.
       Nie można zatwierdzić biegu 14, dopóki skład na bieg 15 nie jest obsadzony. */
    const h15=m.heats[heatIdx+1];
    if(h15&&h15.slots.some(s=>s.num==null)){
      UI.toast("Najpierw nominuj skład do biegu 15 — nominacje do biegów 14 i 15 zapadają razem.");
      return;
    }
  }
  if(h.n===14||h.n===15){
    const mains={home:new Set(lgNomMainNums("home")),away:new Set(lgNomMainNums("away"))};
    /* Numery jazd zasadniczych (bez rezerw RZ/RT/ZZ) w drugim biegu nominowanym —
       żeby nikt nie jechał i w 14, i w 15 (wyjątek: rezerwa RT, ona może). */
    const otherIdx=h.n===14?heatIdx+1:heatIdx-1;
    const other=m.heats[otherIdx];
    for(const s of h.slots){
      if(s.num==null||s.subType)continue; /* rezerwy (RZ/RT/ZZ) wg zwykłych zasad */
      const tk=lgTeamOfHelmet(s.helmet);
      if(!mains[tk].has(s.num)){
        UI.toast("Bieg "+h.n+": w nominowanych jadą tylko zawodnicy z pozycji 1–5 / 9–13.");
        return;
      }
      if(other){
        const dup=other.slots.find(x=>x.num===s.num&&!x.subType&&lgTeamOfHelmet(x.helmet)===tk);
        if(dup){UI.toast("Bieg "+h.n+": zawodnik nr "+s.num+" jedzie już w biegu "+other.n+" (dozwolone tylko jako rezerwa RT).");return;}
      }
    }
  }
  if(!mutate(()=>{h.score=lgComputeScore(h);h.confirmed=true;h.menuOpen=null;h.subListFor=null;}))return;
  lgRender();
  /* Automatyczne przewinięcie do najbliższego otwartego wyścigu. */
  const ni=lgFirstOpenIdx(m);
  if(ni>=0){
    const el=$("lgheat-"+m.heats[ni].n);
    if(el)setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),60);
  }
};
UI.lgEditHeat=function(heatIdx){
  const h=lgm().heats[heatIdx];
  if(!mutate(()=>{h.confirmed=false;h.score=null;}))return;
  lgRender();
};
UI.lgResetHeat=function(heatIdx){
  const h=lgm().heats[heatIdx];
  UI.confirm("Zresetować bieg "+h.n+" do stanu sprzed wyścigu?",()=>{
    if(!mutate(()=>{
      h.slots.forEach(s=>{s.num=s.origNum;s.excl=null;s.subType=null;delete s.exclSeq;delete s.exclWas;});
      h.order=[0,1,2,3];h.confirmed=false;h.score=null;h.menuOpen=null;h.subListFor=null;h.time=null;
      Object.keys(lgZZAsked).forEach(k=>{if(k.split("_")[0]===String(heatIdx))delete lgZZAsked[k];});
    }))return;
    lgRender();
  });
};
UI.lgToggleMenu=function(heatIdx,slotIdx){
  if(!lgHeatEditable(heatIdx))return;
  const h=lgm().heats[heatIdx];
  h.menuOpen=h.menuOpen===slotIdx?null:slotIdx;
  if(h.menuOpen!==null)h.subListFor=null;
  lgRenderHeatOnly(heatIdx);
};
UI.lgSetExcl=function(heatIdx,slotIdx,code){
  if(!lgHeatEditable(heatIdx))return;
  const h=lgm().heats[heatIdx];
  const s=h.slots[slotIdx];
  const wasSet=s.excl===code;
  if(!mutate(()=>{
    s.excl=wasSet?null:code;
    if(!wasSet)s.exclSeq=++lgExclSeq;
    lgReorder(h);
    /* Menu ZOSTAJE otwarte — po kodach -, T, U/-, W2 dodatkowo pytamy o rezerwę. */
    h.subListFor=null;
  }))return;
  lgRenderHeatOnly(heatIdx);
  if(!wasSet&&LG_RZ_CODES.includes(code))UI.lgReservePrompt(heatIdx,slotIdx);
};
UI.lgOpenSubList=function(heatIdx,slotIdx,type){
  if(!lgHeatEditable(heatIdx))return;
  const h=lgm().heats[heatIdx];
  if(!mutate(()=>{h.subListFor={slot:slotIdx,type};}))return;
  lgRenderHeatOnly(heatIdx);
};
UI.lgPickSub=function(heatIdx,slotIdx,type,newNum){
  const m=lgm();const h=m.heats[heatIdx];
  const s=h.slots[slotIdx];
  if(!mutate(()=>{
    s.exclWas=s.excl||s.exclWas||null;
    s.num=newNum;s.subType=type;s.excl=null;
    h.menuOpen=null;h.subListFor=null;
    lgReorder(h);
  }))return;
  UI.closeModal();
  lgRender();
};
/* Cofnięcie rezerwy/zastępstwa: przywraca zawodnika podstawowego z jego poprzednim symbolem wykluczenia. */
UI.lgUndoSub=function(heatIdx,slotIdx){
  if(!lgHeatEditable(heatIdx))return;
  const h=lgm().heats[heatIdx];
  const s=h.slots[slotIdx];
  if(!s.subType||s.origNum==null)return;
  if(!mutate(()=>{
    s.num=s.origNum;s.subType=null;s.excl=s.exclWas||"-";delete s.exclWas;
    if(!s.exclSeq)s.exclSeq=++lgExclSeq;
    h.subListFor=null;
    lgReorder(h);
  }))return;
  lgRenderHeatOnly(heatIdx);
};
/* Okno rezerwy: po kodach -, T, U/-, W2 automatycznie pytamy, czy będzie rezerwa. */
UI.lgReservePrompt=function(heatIdx,slotIdx){
  const m=lgm();if(!m)return;
  const h=m.heats[heatIdx];
  const s=h.slots[slotIdx];
  if(!s.excl)return;
  const teamKey=lgTeamOfHelmet(s.helmet);
  const exclNum=s.num!=null?s.num:s.origNum;
  const rzOk=lgEligible(teamKey,exclNum,"RZ",heatIdx).length>0;
  const rtOk=lgRtAllowed(teamKey,heatIdx)&&lgEligible(teamKey,exclNum,"RT",heatIdx).length>0;
  if(!rzOk&&!rtOk){lgRenderHeatOnly(heatIdx);return;}
  const btn=(type,ok,txt)=>ok
    ?"<button class='btn primary' data-onclick='UI.lgReservePick("+heatIdx+","+slotIdx+",\""+type+"\")'>"+txt+"</button>"
    :"<button class='btn' disabled style='opacity:0.4'>"+txt+"</button>";
  UI.openModal("<h3>Rezerwa?</h3><p style='text-align:center;font-size:0.78rem;color:var(--text-muted);margin:0 0 10px'>Bieg "+h.n+" — symbol <b>"+escq(s.excl)+"</b>. Czy przewidujesz rezerwę?</p>"+
    btn("RZ",rzOk,"RZ — rezerwa zwykła")+
    btn("RT",rtOk,"RT — rezerwa taktyczna")+
    "<button class='btn' data-onclick='UI.closeModal()'>Bez rezerwy</button>");
};
UI.lgReservePick=function(heatIdx,slotIdx,type){
  const m=lgm();if(!m)return;
  const h=m.heats[heatIdx];
  const s=h.slots[slotIdx];
  const teamKey=lgTeamOfHelmet(s.helmet);
  const exclNum=s.num!=null?s.num:s.origNum;
  const us=lgUsage(m);
  const cands=lgEligible(teamKey,exclNum,type,heatIdx);
  if(!cands.length){UI.toast("Brak dostępnych zawodników na "+type+".");return;}
  let html="<h3>Wybierz zawodnika ("+type+")</h3><p style='text-align:center;font-size:0.78rem;color:var(--text-muted);margin:0 0 10px'>Kto wjedzie w biegu "+h.n+"?</p>";
  cands.forEach(n=>{
    const rec=us[n]||{starts:0,usedRT:false,usedZZ:false};
    const left=5+(rec.usedRT?1:0)+(rec.usedZZ?1:0)-rec.starts;
    html+="<button class='btn' style='text-transform:none' data-onclick='UI.lgPickSub("+heatIdx+","+slotIdx+",\""+type+"\","+n+")'>"+escq(lgRiderName(n))+" <small style='opacity:0.7'>(pozostałe starty: "+left+")</small></button>";
  });
  html+="<button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>";
  UI.openModal(html);
};
/* Kolory kasków w biegu 15 ustawia się już PRZED rozegraniem biegu 14. */
function lgNomPreEditable(heatIdx){
  const m=lgm();if(!m||!m.nom)return false;
  const h=m.heats[heatIdx];
  return h.n===15&&!h.confirmed&&lgFirstOpenIdx(m)===heatIdx-1;
}
function lgNomPool(heatIdx,teamKey){
  /* Zawodnicy wybrani w nominacji do tego biegu (i jeszcze niewstawieni do biegu). */
  const m=lgm(),h=m.heats[heatIdx];
  const base=lgEligibleNominated(teamKey,heatIdx);
  const nom=m.nom&&m.nom[h.n]&&m.nom[h.n][teamKey];
  return nom?base.filter(n=>nom.includes(n)):base;
}
UI.lgNomSlotOpen=function(heatIdx,slotIdx){
  if(!lgHeatEditable(heatIdx)&&!lgNomPreEditable(heatIdx))return;
  const h=lgm().heats[heatIdx],s=h.slots[slotIdx];
  const tk=lgTeamOfHelmet(s.helmet);
  const KASK={C:"czerwonym",N:"niebieskim",B:"białym","Ż":"żółtym"};
  let html="<h3>Bieg "+h.n+" — kask "+KASK[s.helmet]+"</h3>"+
    "<p style='text-align:center;font-size:0.78rem;color:var(--text-muted);margin:0 0 10px'>Kto pojedzie w tym kasku? Drugi zawodnik drużyny dostanie pozostały kask.</p>";
  lgNomPool(heatIdx,tk).forEach(n=>{
    html+="<button class='btn' style='text-transform:none' data-onclick='UI.lgPickNominated("+heatIdx+","+slotIdx+","+n+")'>"+n+" — "+escq(lgRiderName(n))+"</button>";
  });
  html+="<button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>";
  UI.openModal(html);
};
UI.lgPickNominated=function(heatIdx,slotIdx,val){
  if(!lgHeatEditable(heatIdx)&&!lgNomPreEditable(heatIdx))return;
  const h=lgm().heats[heatIdx],s=h.slots[slotIdx];
  const tk=lgTeamOfHelmet(s.helmet);
  const n=Number(val);
  const rest=lgNomPool(heatIdx,tk).filter(x=>x!==n);
  if(!mutate(()=>{
    s.num=n;
    const oi=h.slots.findIndex((x,i)=>i!==slotIdx&&x.num==null&&lgTeamOfHelmet(x.helmet)===tk);
    if(oi>=0&&rest.length===1)h.slots[oi].num=rest[0]; /* drugi kask uzupełnia się sam */
    lgReorder(h);
  }))return;
  UI.closeModal();
  lgRenderHeatOnly(heatIdx);
};
UI.lgSetPart=function(part,n){
  const m=lgm();if(!m)return;
  const from=part===1?0:13,to=part===1?13:15;
  const curSet=part===1?m.set1_13:m.set14_15;
  if(n===curSet)return;
  const touched=m.heats.slice(from,to).some(h=>h.confirmed||h.slots.some(s=>s.excl||s.subType));
  const lbl=part===1?"1–13":"14–15";
  const go=()=>{
    if(!mutate(()=>{
      const src=LG_SETS[n];
      for(let i=from;i<to;i++){
        const h=m.heats[i];
        h.slots=src[i].map(lgSlotFromSrc);
        h.order=[0,1,2,3];h.confirmed=false;h.score=null;h.menuOpen=null;h.subListFor=null;h.time=null;
      }
      if(part===1)m.set1_13=n;else m.set14_15=n;
    }))return;
    lgRender();
  };
  if(touched)UI.confirm("Zmiana zestawu dla biegów "+lbl+" wyzeruje wyniki i zmiany zapisane w tych biegach. Kontynuować?",go);
  else go();
};
/* Czas biegu — numpad (ostatnie 3 cyfry = milisekundy), obsługa klawiatury fizycznej. */
let LgTime={heatIdx:null,ms:0};
UI.lgEditTime=function(heatIdx){
  const h=lgm().heats[heatIdx];
  LgTime={heatIdx,ms:h.time?Math.round(parseFloat(h.time.replace(",","."))*1000):0};
  let html="<h3>Czas biegu "+h.n+"</h3>"+
    "<p style='text-align:center;color:var(--text-muted);font-size:0.75rem;margin:0 0 10px'>Wpisz cyfry</p>"+
    "<div class='timedisplay' id='lgTimeVal'>"+fmtHeatTime(LgTime.ms)+"</div><div class='numpad'>";
  for(let d=1;d<=9;d++)html+="<button class='btn' data-onclick='UI.lgTimeDigit("+d+")'>"+d+"</button>";
  html+="<button class='btn secondary' data-onclick='UI.lgTimeBackspace()'>&#9003;</button>"+
    "<button class='btn' data-onclick='UI.lgTimeDigit(0)'>0</button>"+
    "<button class='btn danger' data-onclick='UI.lgTimeClear()'>C</button></div>"+
    "<button class='btn primary' style='margin-top:14px' data-onclick='UI.lgTimeSave()'>Zapisz</button>"+
    "<button class='btn' data-onclick='UI.closeModal()'>Anuluj</button>";
  UI.openModal(html);
  UI._timeKeyHandler=ev=>{
    if(ev.key>="0"&&ev.key<="9"){ev.preventDefault();UI.lgTimeDigit(+ev.key);}
    else if(ev.key==="Backspace"||ev.key==="Delete"){ev.preventDefault();UI.lgTimeBackspace();}
    else if(ev.key==="Enter"){ev.preventDefault();UI.lgTimeSave();}
  };
  document.addEventListener("keydown",UI._timeKeyHandler);
};
UI.lgTimeDigit=function(d){
  const t=(LgTime.ms||0)*10+d;
  if(t>99999)return;
  LgTime.ms=t;
  const el=$("lgTimeVal");if(el)el.textContent=fmtHeatTime(t);
};
UI.lgTimeBackspace=function(){
  LgTime.ms=Math.floor((LgTime.ms||0)/10);
  const el=$("lgTimeVal");if(el)el.textContent=fmtHeatTime(LgTime.ms);
};
UI.lgTimeClear=function(){
  LgTime.ms=0;
  const el=$("lgTimeVal");if(el)el.textContent=fmtHeatTime(0);
};
UI.lgTimeSave=function(){
  const h=lgm().heats[LgTime.heatIdx];
  UI.closeModal();
  if(!h)return;
  if(!mutate(()=>{h.time=LgTime.ms?fmtHeatTime(LgTime.ms):null;}))return;
  lgRender();
};
/* Dwa widoki meczu ligowego: „teams” (Składy) i „heats” (Wyścigi); przełączane ikonami lub przeciągnięciem. */
let LgView=null,LgViewFor=null,LgSort=false;
function lgApplyView(){
  const t=$("lgTeamsWrap"),h=$("lgHeatsWrap");
  if(t)t.style.display=LgView==="teams"?"":"none";
  if(h)h.style.display=LgView==="heats"?"":"none";
}
UI.lgView=function(v){
  const m=lgm();if(!m)return;
  LgView=v;lgApplyView();
  $("lgScorebar").innerHTML=lgScorebarHtml();
  if(v==="heats"){
    const i=lgFirstOpenIdx(m);
    const el=$("lgheat-"+(i>=0?m.heats[i].n:15));
    if(el)el.scrollIntoView({behavior:"auto",block:"start"});
  }else window.scrollTo(0,0);
};

UI.lgScrollToNext=function(){ /* (nieużywane — zastąpione przez UI.lgView) */
  const m=lgm();if(!m)return;
  const i=lgFirstOpenIdx(m);
  if(i<0){UI.toast("Wszystkie biegi zostały zatwierdzone.");return;}
  const el=$("lgheat-"+m.heats[i].n);
  if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"});
};
UI.leaveMatch=function(){
  const c=cur();
  let msg="Na pewno wrócić do ekranu głównego?<br><small style='color:var(--text-muted)'>Bieżący stan meczu zostanie automatycznie zapisany.</small>";
  if(c&&c.league&&c.match){
    const open=c.match.heats.filter(h=>!h.confirmed).length;
    const done=c.match.heats.filter(h=>h.confirmed).length;
    if(done>0&&open>0)
      msg="<b style='color:var(--amber)'>⚠ Uwaga: mecz w toku — "+open+" niezatwierdzonych biegów.</b><br><small style='color:var(--text-muted)'>Stan zostanie zapisany i można do niego wrócić z ekranu głównego.</small>";
  }
  UI.confirm(msg,()=>{UI.screen("home");});
};
/* ===== Render meczu ===== */
function lgRender(){
  const c=cur();if(!c||!c.league||!c.match){UI.screen("home");return;}
  if(LgViewFor!==c.id){LgViewFor=c.id;LgView=c.match.heats.some(h=>h.confirmed)?"heats":"teams";}
  $("lgTeamsWrap").innerHTML=lgTeamCard("home")+lgTeamCard("away");
  $("lgHeatsWrap").innerHTML=c.match.heats.map((_,i)=>lgHeatHtml(i)).join("");
  $("lgScorebar").innerHTML=lgScorebarHtml();
  lgApplyView();
  lgMaybePromptZZ();
  lgMaybeNominate();
}
function lgRenderHeatOnly(heatIdx){
  const el=$("lgheat-"+(heatIdx+1));
  if(!el){lgRender();return;}
  /* Pasek „Zestaw startowy” stoi tuż przed kartą biegu (1 i 14) i nie jest jej częścią —
     bez usunięcia starego paska każde odświeżenie karty dokładałoby kolejny. */
  while(el.previousElementSibling&&el.previousElementSibling.classList.contains("lg-setbar"))el.previousElementSibling.remove();
  el.outerHTML=lgHeatHtml(heatIdx);
  lgMaybePromptZZ();
}
const LG_HELM={home:["#ef4444","#3b82f6"],away:["#f8fafc","#eab308"]};
function lgHelmets(teamKey){return "<span class='lg-helmets'><i style='background:"+LG_HELM[teamKey][0]+"'></i><i style='background:"+LG_HELM[teamKey][1]+"'></i></span>";}
function lgTeamCard(teamKey){
  const side=lgLineup(teamKey);
  const nums=Object.keys(side.lineup).map(Number).sort((a,b)=>a-b);
  const totals=lgRiderTotals(teamKey);
  if(LgSort)nums.sort((a,b)=>(((totals[b]||{}).pts||0)-((totals[a]||{}).pts||0))||a-b);
  const maxCols=Math.max(5,...nums.map(n=>(totals[n]?totals[n].cells.length:0)),0);
  const cols=Math.min(7,maxCols);
  let head="<th class='lg-nm'>Zawodnik</th>";
  for(let i=1;i<=cols;i++)head+="<th>"+i+"</th>";
  head+="<th>S</th><th>B</th>";
  let rows=nums.map(n=>{
    const t=totals[n]||{pts:0,bon:0,cells:[]};
    const started=t.cells.length>0;
    const cells=[];
    for(let i=1;i<=cols;i++){
      const cell=t.cells[i-1];
      if(!cell)cells.push("<td class='lg-res0'>-</td>");
      else if(cell.excl!=null)cells.push("<td class='lg-res0'>"+escq(cell.excl)+"</td>");
      else cells.push("<td>"+cell.pts+(cell.bonus?"'":"")+"</td>");
    }
    const nm=normName(side.lineup[n]||"—");
    const sp=nm.indexOf(" ");
    const fn=sp>0?nm.slice(0,sp):"";
    const ln=sp>0?nm.slice(sp+1):nm;
    return "<tr><td class='lg-nm'><span class='lg-num'>"+n+"</span> <span class='lg-rname'>"+(fn?"<small class='fn'>"+escq(fn)+"</small>":"")+"<b class='ln'>"+escq(ln)+"</b></span></td>"+cells.join("")+
      "<td class='lg-sum'>"+(started?t.pts:"")+"</td><td class='lg-bon'>"+(t.bon>0?t.bon:"")+"</td></tr>";
  }).join("");
  return "<div class='lg-teamcard "+teamKey+"'><div class='lg-teamhead'>"+lgHelmets(teamKey)+"<div class='lg-tname'>"+escq(side.name)+"</div></div>"+
    "<div class='tblwrap'><table class='lg-rt'><thead><tr>"+head+"</tr></thead><tbody>"+rows+"</tbody></table></div></div>";
}
function lgScorebarHtml(){
  const c=cur();
  const sc=lgCumulative(c.match,15);
  const tv=LgView==="teams";
  return "<div class='lg-scorebar-inner'><div class='lg-sbrow' style='align-items:center'>"+
    fbtn("","Ekran główny","UI.leaveMatch()","home")+
    fbtn(tv?"active":"","Składy","UI.lgView(\"teams\")","teams")+
    fbtn(tv?"":"active","Wyścigi","UI.lgView(\"heats\")","flag")+
    (tv?fbtn(LgSort?"active":"","Sortuj zawodników wg punktów","UI.lgSortToggle()","sort"):fbtn("","Przejdź do bieżącego wyścigu","UI.lgScrollToNext()","next"))+
    "<div class='fbar-lbl big'>"+(tv?"Składy":"Wyścigi")+"</div>"+
    fbtn("danger","Reset całych zawodów","UI.lgResetMatch()","reset")+"</div>"+
    "<div class='lg-scorerow'><div class='snm'><span class='wrap2'>"+escq(c.home.name).split(" ").map(w=>"<span>"+w+"</span>").join("")+"</span></div>"+
    "<div class='ssc'>"+sc.home+":"+sc.away+"</div>"+
    "<div class='snm away'><span class='wrap2'>"+escq(c.away.name).split(" ").map(w=>"<span>"+w+"</span>").join("")+"</span></div></div></div>";
}
UI.lgSortToggle=function(){
  LgSort=!LgSort;
  $("lgTeamsWrap").innerHTML=lgTeamCard("home")+lgTeamCard("away");
  $("lgScorebar").innerHTML=lgScorebarHtml();
};
UI.lgResetMatch=function(){
  const m=lgm();if(!m)return;
  UI.confirm("Zresetować <b>całe zawody</b>?<br><small style='color:var(--text-muted)'>Wszystkie wyniki biegów, wykluczenia i zmiany zostaną przywrócone do stanu początkowego. Tej operacji nie można cofnąć.</small>",()=>{
    if(!mutate(()=>{
      const a=LG_SETS[m.set1_13],b=LG_SETS[m.set14_15];
      m.heats.forEach((h,i)=>{
        const src=i<13?a[i]:b[i];
        h.slots=src.map(lgSlotFromSrc);
        h.order=[0,1,2,3];h.confirmed=false;h.score=null;h.menuOpen=null;h.subListFor=null;h.time=null;
      });
      lgZZAsked={};lgNomAsked={};LgNom=null;
    }))return;
    lgRender();
  });
};
function lgSlotMenuHtml(heatIdx,slotIdx,teamKey){
  const m=lgm();const h=m.heats[heatIdx];
  const curExcl=h.slots[slotIdx].excl;
  const us=lgUsage(m);
  const slot=h.slots[slotIdx];
  const exclNum=slot.num!=null?slot.num:slot.origNum;
  const isMain=teamKey==="home"?(exclNum>=9&&exclNum<=13):(exclNum>=1&&exclNum<=5);
  let html="<div class='lg-menu'>";
  if(slot.subType&&slot.origNum!=null){
    html+="<div class='sublabel'>"+escq(slot.subType)+": "+escq(lgRiderName(slot.num))+" za "+escq(lgRiderName(slot.origNum))+"</div>"+
      "<button class='btn small danger' data-onclick='UI.lgUndoSub("+heatIdx+","+slotIdx+")'>Cofnij zastępstwo</button>";
  }
  html+="<div class='sublabel'>Wykluczenie</div><div class='mrow'>"+
    LG_EXCL_CODES.map(code=>"<button class='btn small "+(curExcl===code?"primary":"secondary")+"' data-onclick='UI.lgSetExcl("+heatIdx+","+slotIdx+",\""+code+"\")'>"+code+"</button>").join("")+
    "</div>";
  if(curExcl){
    html+="<div class='lg-hints'><div>Po wybraniu -, T, U/-, W2 pojawi się pytanie o rezerwę.</div>"+
      "<div>ZZ — automatycznie, gdy w biegu jedzie Zawodnik zastępowany.</div></div>";
  }else{
    html+="<div class='lg-hints'><div>Wskaż symbol wykluczenia — dla -, T, U/-, W2 pojawi się pytanie o rezerwę.</div></div>";
  }
  if(h.subListFor&&h.subListFor.slot===slotIdx){
    const type=h.subListFor.type;
    const cands=lgEligible(teamKey,exclNum,type,heatIdx);
    html+="<div class='sublabel'>Wybierz zawodnika ("+type+")</div><div class='lg-candlist'>";
    if(!cands.length)html+="<div style='color:var(--text-muted);font-size:0.8rem'>Brak dostępnych zawodników spełniających warunki.</div>";
    cands.forEach(n=>{
      const rec=us[n]||{starts:0,usedRT:false,usedZZ:false};
      const left=5+(rec.usedRT?1:0)+(rec.usedZZ?1:0)-rec.starts;
      html+="<button class='lg-candbtn' data-onclick='UI.lgPickSub("+heatIdx+","+slotIdx+",\""+type+"\","+n+")'>"+escq(lgRiderName(n))+"<small>pozostałe starty: "+left+"</small></button>";
    });
    html+="</div>";
  }
  html+="</div>";
  return html;
}
function lgHeatHtml(heatIdx){
  const m=lgm();
  const h=m.heats[heatIdx];
  const firstOpen=lgFirstOpenIdx(m);
  const active=!h.confirmed&&heatIdx===firstOpen;
  const pre=lgNomPreEditable(heatIdx);
  const dim=!h.confirmed&&!active&&!pre;
  const HELM_COLOR={C:"#ef4444",N:"#3b82f6",B:"#f8fafc","Ż":"#eab308"};
  let extraBar="";
  if(h.n===1){
    extraBar="<div class='lg-setbar'><span>ZESTAW STARTOWY (biegi 1–13)</span>"+
      [1,2].map(n=>"<button class='btn small "+(m.set1_13===n?"primary":"secondary")+"' data-onclick='UI.lgSetPart(1,"+n+")'>"+n+"</button>").join("")+"</div>";
  }
  if(h.n===14){
    extraBar="<div class='lg-setbar'><span>ZESTAW STARTOWY (biegi 14–15)</span>"+
      [1,2].map(n=>"<button class='btn small "+(m.set14_15===n?"primary":"secondary")+"' data-onclick='UI.lgSetPart(2,"+n+")'>"+n+"</button>").join("")+
      "<button class='btn small secondary' data-onclick='UI.lgRenominate()'>Nominacje</button></div>";
  }
  const scoreTxt=h.confirmed?(h.score.home+":"+h.score.away):"–:–";
  const fins=lgFinishers(h);
  const rows=h.order.map(slotIdx=>{
    const slot=h.slots[slotIdx];
    const teamKey=lgTeamOfHelmet(slot.helmet);
    const col=HELM_COLOR[slot.helmet];
    const finPos=fins.indexOf(slotIdx);
    const ptsHere=finPos>=0?Math.max(3-finPos,0):null;
    const isBonusHere=h.confirmed&&h.score&&h.score.bonusSlot===slotIdx;
    let nameHtml,posHtml="",btns="";
    if(slot.num==null){
      if(active||pre){
        nameHtml="<span class='name' style='flex:1'><button class='btn secondary small' style='margin:0;text-transform:none' data-onclick='UI.lgNomSlotOpen("+heatIdx+","+slotIdx+")'>Wybierz zawodnika…</button></span>";
      }else{
        nameHtml="<span class='name' style='flex:1;color:var(--text-muted)'>do obsadzenia (nominowany)</span>";
      }
    }else{
      const tag=slot.excl?("<span class='mk'>"+escq(slot.excl)+"</span>"):(slot.subType?("<span class='mk'>"+escq(slot.subType)+"</span>"):"");
      nameHtml="<span class='name'><b>"+slot.num+"</b> "+escq(lgRiderName(slot.num))+tag+"</span>";
      if(h.confirmed){
        if(finPos>=0)posHtml="<span class='pos'>"+(finPos+1)+". — "+ptsHere+(isBonusHere?"'":"")+" pkt.</span>";
      }else if(finPos>=0){
        posHtml="<span class='pos'>"+(finPos+1)+".</span>";
      }
    }
    const menu=(active&&h.menuOpen===slotIdx)?lgSlotMenuHtml(heatIdx,slotIdx,teamKey):"";
    if(active&&slot.num!=null&&slot.excl){
      btns="<div class='rcardbtns'>"+
        "<button class='cardbtn flag on' title='Zmień lub usuń wykluczenie' data-onclick='UI.lgToggleMenu("+heatIdx+","+slotIdx+")'>"+ICON_FLAG+"</button>"+
        "</div>";
    }else if(active&&slot.num!=null&&!slot.excl){
      const upDis=finPos<=0?"disabled":"";
      const downDis=(finPos<0||finPos>=fins.length-1)?"disabled":"";
      btns="<div class='rcardbtns'>"+
        "<button class='cardbtn' "+upDis+" title='Przesuń w górę' data-onclick='UI.lgMoveSlot("+heatIdx+","+slotIdx+",-1)'>"+ICON_UP+"</button>"+
        "<button class='cardbtn' "+downDis+" title='Przesuń w dół' data-onclick='UI.lgMoveSlot("+heatIdx+","+slotIdx+",1)'>"+ICON_DOWN+"</button>"+
        "<button class='cardbtn flag"+(h.menuOpen===slotIdx?" on":"")+"' title='Wykluczenia i zmiany' data-onclick='UI.lgToggleMenu("+heatIdx+","+slotIdx+")'>"+ICON_FLAG+"</button>"+
        "</div>";
    }
    return "<div class='rcard"+(slot.excl?" ex locked":"")+"' style='border-left:4px solid "+col+"'>"+
      ""+nameHtml+posHtml+btns+
      "</div>"+menu;
  }).join("");
  const actions="<div class='heatactions'>"+
    "<button class='iconbtn sm' title='Czas wyścigu' data-onclick='UI.lgEditTime("+heatIdx+")'>"+ICON_CLOCK+"</button>"+
    (h.confirmed
      ?"<button class='iconbtn sm' title='Edytuj bieg' data-onclick='UI.lgEditHeat("+heatIdx+")'>"+ICON_EDIT+"</button>"+
       "<button class='iconbtn sm' title='Reset biegu' data-onclick='UI.lgResetHeat("+heatIdx+")'>"+ICON_RESET+"</button>"
      :active
      ?"<button class='btn small primary' style='margin:0' data-onclick='UI.lgConfirmHeat("+heatIdx+")'>&#10004; Zatwierdź</button>"+
       "<button class='iconbtn sm' title='Reset biegu' data-onclick='UI.lgResetHeat("+heatIdx+")'>"+ICON_RESET+"</button>"
      :"<span style='color:var(--text-muted);font-size:0.8rem'>"+ICON_LOCK_SM+"Zablokowany</span>")+
    "</div>";
  return extraBar+"<div id='lgheat-"+h.n+"' class='heat"+(h.confirmed?" done":"")+(active?" active":"")+(dim?" dim":"")+"'>"+
    "<div class='heathead'><span class='heatnum'>BIEG "+h.n+(h.time?"<span class='heattime'>"+escq(h.time)+"</span>":"")+"</span>"+
    "<div class='lg-headright'><div class='lg-heatscore"+(h.confirmed?"":" empty")+"'>"+scoreTxt+"</div>"+actions+"</div></div>"+
    "<div class='hrows'>"+rows+"</div></div>";
}

renderHome();
/* Zastosowanie zapisanego rozmiaru czcionki przy starcie aplikacji. */
UI.applyFont();
/* Pływające menu zawodów indywidualnych (Klasyfikacja / Wyścigi). */
(function(){
  $("ptsBar").innerHTML=fbtn("","Ekran główny","UI.leave(\"points\")","home")+
    fbtn("navpts active","Klasyfikacja","UI.navScreen(\"points\")","teams")+
    fbtn("navraces","Wyścigi","UI.navScreen(\"races\")","flag")+
    fbtn("","Sortuj wg zajmowanego miejsca","UI.toggleSort()","sort","sortPts")+
    "<button class='fbar-lbl' id='ptsTitle' title='Zasady remisów' data-onclick='UI.tieRules()'><span class='fbar-t'>Klasyfikacja</span></button>"+
    fbtn("danger","Resetuj wszystkie wyścigi","UI.resetAllHeats()","reset");
  $("racesBar").innerHTML=fbtn("","Ekran główny","UI.leave(\"races\")","home")+
    fbtn("navpts","Klasyfikacja","UI.navScreen(\"points\")","teams")+
    fbtn("navraces active","Wyścigi","UI.navScreen(\"races\")","flag")+
    fbtn("","Przejdź do bieżącego wyścigu","UI.nextHeat()","next")+
    "<div class='fbar-lbl big' id='racesTitle'>Wyścigi</div>"+
    fbtn("danger","Resetuj wszystkie wyścigi","UI.resetAllHeats()","reset");
})();
UI.goPeople=function(){UI.closeModal();UI.screen("people");};
UI.nextHeat=function(){
  const c=cur();if(!c)return;
  const hs=compHeats(c);
  const next=hs.find(x=>!x.confirmed&&!x.extra)||hs.find(x=>!x.confirmed);
  if(!next){UI.toast("Wszystkie wyścigi zostały zatwierdzone.");return;}
  const el=$("heat-"+next.n);
  if(el)el.scrollIntoView({behavior:"smooth",block:"start"});
};

/* Aktualizacja tylko jednej karty biegu (np. po przesunięciu zawodnika). */
function updateHeatCard(h){
  const c=cur();if(!c)return;
  const el=$("heat-"+h.n);
  if(!el){renderRaces();return;}
  normalizeOrder(h);
  const firstOpen=compHeats(c).find(x=>!x.extra&&!x.confirmed);
  el.outerHTML=heatCardHtml(c,h,firstOpen);
}

/* Globalna obsługa nieoczekiwanych błędów — tylko komunikat; nic nie opuszcza urządzenia. */
(function(){
  let last=0;
  const onErr=ev=>{
    const msg=String((ev&&(ev.message||(ev.reason&&ev.reason.message)))||"");
    if(msg.indexOf("ResizeObserver")>=0)return;
    const now=Date.now();if(now-last<5000)return;last=now;
    try{UI.toast("⚠ Wystąpił nieoczekiwany błąd. Ostatnio zapisane dane nie zostały zmienione.");}catch(e){}
  };
  window.addEventListener("error",onErr);
  window.addEventListener("unhandledrejection",onErr);
})();