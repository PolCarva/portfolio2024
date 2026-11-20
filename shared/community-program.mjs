// The generated source only executes in a disposable worker inside an opaque-origin iframe.
const json = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
export function programDocument(program, preview = false) {
  const workerSource = `"use strict";
const send=self.postMessage.bind(self);
for(const name of ['fetch','XMLHttpRequest','WebSocket','EventSource','importScripts','Worker','SharedWorker','WebAssembly']) {try{Object.defineProperty(self,name,{value:undefined,writable:false,configurable:false});}catch{}}
const draw=(()=>{${program.javascript}\n;return typeof render==='function'?render:()=>{};})();
let canvas,ctx;
self.onmessage=event=>{try{const d=event.data;if(!canvas){canvas=new OffscreenCanvas(d.width,d.height);ctx=canvas.getContext('2d');}if(canvas.width!==d.width)canvas.width=d.width;if(canvas.height!==d.height)canvas.height=d.height;ctx.reset();draw({ctx,width:d.width,height:d.height,pointer:d.pointer,time:d.time,scrollY:d.scrollY});const bitmap=canvas.transferToImageBitmap();send({bitmap},[bitmap]);}catch{send({error:true});}};`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-community-runtime'; style-src 'unsafe-inline'; worker-src blob:; connect-src 'none'; img-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}#art{position:absolute;inset:0;pointer-events:none}#surface{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}</style></head><body><div id="art"></div><canvas id="surface"></canvas><script nonce="community-runtime">
'use strict';
const source=${json(workerSource)},markup=${json(program.html)},stylesheet=${json(program.css)},preview=${json(preview)};
const allowed=new Set('DIV SPAN SECTION MAIN HEADER FOOTER P B I EM STRONG SMALL H1 H2 H3 UL OL LI CANVAS SVG G PATH CIRCLE ELLIPSE RECT LINE POLYGON POLYLINE DEFS LINEARGRADIENT RADIALGRADIENT STOP TEXT TSPAN'.split(' '));
const attrs=new Set('class id style viewbox d x y x1 x2 y1 y2 cx cy r rx ry width height fill stroke stroke-width opacity transform points offset stop-color stop-opacity font-size text-anchor'.split(' '));
const template=document.createElement('template');template.innerHTML=markup;
let nodes=0;function clean(root){for(const node of [...root.children]){if(++nodes>300||!allowed.has(node.tagName.toUpperCase())){node.remove();continue;}for(const attr of [...node.attributes])if(!attrs.has(attr.name.toLowerCase())||attr.value.length>4096)node.removeAttribute(attr.name);clean(node);}}clean(template.content);
document.getElementById('art').append(template.content);
const style=document.createElement('style');style.textContent=stylesheet;document.head.append(style);
const surface=document.querySelector('body > canvas#surface'),out=surface.getContext('2d');
let worker,pending=false,watchdog,stopped=false,first=true,last=0,input={pointer:{x:0,y:0,down:false},scrollY:0};
function stop(){stopped=true;clearTimeout(watchdog);worker?.terminate();document.documentElement.dataset.status='error';}
function dimensions(){const scale=Math.min(1,1280/innerWidth,900/innerHeight);return {width:Math.max(1,Math.round(innerWidth*scale)),height:Math.max(1,Math.round(innerHeight*scale)),scale};}
function tick(now){if(stopped)return;requestAnimationFrame(tick);if(pending||now-last<50||document.hidden||(!preview&&matchMedia("(prefers-reduced-motion: reduce)").matches))return;last=now;pending=true;const d=dimensions();surface.width=d.width;surface.height=d.height;if(preview)input.pointer={x:d.width*.5+Math.sin(now/280)*120,y:d.height*.35+Math.cos(now/370)*65,down:false};worker.postMessage({...d,pointer:{...input.pointer,x:input.pointer.x*d.scale,y:input.pointer.y*d.scale},time:now/1000,scrollY:input.scrollY});watchdog=setTimeout(stop,first?1000:200);first=false;}
try{worker=new Worker(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));worker.onmessage=event=>{if(!pending)return;clearTimeout(watchdog);const bitmap=event.data?.bitmap;if(!(bitmap instanceof ImageBitmap)||bitmap.width>1280||bitmap.height>900){stop();return;}out.clearRect(0,0,surface.width,surface.height);out.drawImage(bitmap,0,0);bitmap.close();pending=false;document.documentElement.dataset.status='ready';};worker.onerror=stop;requestAnimationFrame(tick);}catch{stop();}
addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='portfolio-input')return;const d=event.data;for(const v of [d.x,d.y,d.scrollY])if(!Number.isFinite(v))return;input={pointer:{x:Math.max(0,Math.min(innerWidth,d.x)),y:Math.max(0,Math.min(innerHeight,d.y)),down:d.down===true},scrollY:Math.max(0,Math.min(100000,d.scrollY))};document.documentElement.style.setProperty('--pointer-x',input.pointer.x+'px');document.documentElement.style.setProperty('--pointer-y',input.pointer.y+'px');document.documentElement.style.setProperty('--scroll-y',input.scrollY+'px');});
addEventListener('pagehide',()=>{stopped=true;clearTimeout(watchdog);worker?.terminate();});
</script></body></html>`;
}
