/* Service Worker: cache-first, wyłącznie pliki z własnego hosta.
   Po zmianie index.html / app.js / app.css podbij numer wersji w CACHE. */
const PREFIX="zuzel-";
const CACHE=PREFIX+"v30";
const CORE=["./","./index.html","./app.js","./app.css","./manifest.json"];
const OPT=["./icon.svg","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
  /* cache:"reload" — omija pamięć HTTP przeglądarki, żeby nowa wersja nie pobrała starych plików. */
  /* Ikony są opcjonalne — jej brak nie może zablokować instalacji całej aplikacji. */
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(f=>new Request(f,{cache:"reload"}))).then(()=>Promise.all(OPT.map(f=>c.add(new Request(f,{cache:"reload"})).catch(()=>{}))))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  /* Kasujemy wyłącznie własne, stare cache (prefiks) — nigdy cudze. */
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==self.location.origin)return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).catch(()=>r.mode==="navigate"?caches.match("./index.html"):Response.error())));
});
