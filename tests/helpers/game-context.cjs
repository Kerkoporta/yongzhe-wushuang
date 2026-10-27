const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function gameContext(options={}){
 const elements=new Map(),listeners={},canvasCalls=[];
 const gradient={addColorStop(){}};
 const draw=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,createPattern:()=>({}),measureText:t=>({width:t.length*7})},{get:(o,k)=>k in o?o[k]:(...args)=>canvasCalls.push([k,...args])});
 function el(id=''){return {id,style:{},dataset:{},tagName:'DIV',textContent:'',innerHTML:'',width:800,height:600,classList:{toggle(){},add(){},remove(){}},getContext:()=>draw,appendChild(){},prepend(){},remove(){},querySelectorAll:()=>[],querySelector:()=>null,addEventListener(type,fn){(listeners[id+':'+type]||=[]).push(fn);},getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){},scrollIntoView(){},closest:()=>null};}
 const storage=new Map();let now=0;
 const doc={hidden:false,body:el('body'),head:el('head'),getElementById(id){if(!elements.has(id))elements.set(id,el(id));return elements.get(id);},createElement:()=>el(),querySelectorAll:()=>[]};
 const context={console,document:doc,navigator:{getGamepads:()=>[]},innerWidth:800,innerHeight:600,devicePixelRatio:1,Image:class{},performance:{now:()=>now},requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},addEventListener(t,f){(listeners[t]||=[]).push(f)},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},__calls:canvasCalls,__dispatch:(type,e)=>{for(const f of listeners[type]||[])f(e)},__storage:storage,__advance:dt=>now+=dt,__fire:(id,type,e)=>{for(const f of listeners[id+':'+type]||[])f(e)}};
 context.window=context;vm.createContext(context);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const [,src] of html.matchAll(/<script src="([^"]+)"/g)){const f=src.split('?')[0];let source=fs.readFileSync(path.join(root,f),'utf8');if(options.interval&&f==='src/net.js')source=source.replace('const NET_INTERVAL = 0.016;',`const NET_INTERVAL = ${options.interval/1000};`);vm.runInContext(source,context,{filename:f});}
 context.run=code=>vm.runInContext(code,context);return context;
}
module.exports={gameContext};
