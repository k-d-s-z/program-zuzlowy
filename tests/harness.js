/* Uruchamia app.js w Node (vm) z atrapą DOM — bez przeglądarki i bez zależności. */
const vm=require('vm'),fs=require('fs');
function el(){const e={innerHTML:'',textContent:'',style:{},className:'',dataset:{},value:'',
  classList:{_s:new Set(),add(c){this._s.add(c)},remove(c){this._s.delete(c)},contains(c){return this._s.has(c)},toggle(c,f){f?this._s.add(c):this._s.delete(c)}},
  querySelector(){return null},querySelectorAll(){return []},addEventListener(){},setAttribute(){},getAttribute(){return null},removeAttribute(){},
  focus(){},click(){},scrollIntoView(){},matches(){return false},appendChild(){},remove(){},nodeType:1,parentElement:null,offsetParent:null,previousElementSibling:null};return e;}
const els={};
const ls=new Map();
const ctx={console,setTimeout,clearTimeout,Intl,Date,JSON,Math,Object,Array,Set,Map,Number,String,Error,RegExp,Uint8Array,TextDecoder,parseFloat,parseInt,isNaN,
 localStorage:{getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v)),removeItem:k=>ls.delete(k),key:i=>[...ls.keys()][i],get length(){return ls.size}},
 document:{getElementById:id=>els[id]||(els[id]=el()),querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},removeEventListener(){},documentElement:{style:{}},body:el(),createElement:()=>el(),activeElement:null,contains:()=>false},
 window:{addEventListener(){},scrollTo(){}},navigator:{},requestAnimationFrame:f=>f(),MutationObserver:class{observe(){}},crypto:{randomUUID:()=>'id'+Math.random().toString(36).slice(2)},
 Blob:class{},URL:{createObjectURL(){return''},revokeObjectURL(){}},FileReader:class{}};
ctx.window.document=ctx.document;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8'),ctx);
module.exports={ctx,els,run:c=>vm.runInContext(c,ctx)};
