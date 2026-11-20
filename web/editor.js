/* ============================================================
   AI ENGINE: sends the image to app.py at /remove.
   To use a different model or server, change only this function.
   It must return a PNG Blob whose alpha channel is the mask.
   ============================================================ */
let MODELS=[['isnet-general-use','Balanced',true]];
function loadModels(init){return fetch('/models').then(r=>r.json()).then(m=>{if(!m.length)return;MODELS=m;
  const cur=m.find(x=>x[0]===S.ai.model);
  if(!cur||(init&&!cur[2])){const ok=m.find(x=>x[2])||m[0];S.ai.model=ok[0]}
  buildProps()}).catch(()=>{})}
async function segment(png,opts,onProgress){
  const cur=MODELS.find(m=>m[0]===opts.model),need=cur&&cur[2]===false;
  onProgress(need?'Downloading model (about 1 GB, first time only)…':'Removing background…',null);
  const r=await fetch('/remove?model='+encodeURIComponent(opts.model),{method:'POST',body:png});
  if(!r.ok)throw new Error(await r.text());
  const blob=await r.blob();if(need)loadModels();return blob;
}
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const h=(tag,attrs={},...kids)=>{const e=document.createElement(tag);
  for(const k in attrs){const val=attrs[k];if(k.startsWith('on'))e.addEventListener(k.slice(2),val);else if(val!==false&&val!=null)e.setAttribute(k,val===true?'':val)}
  for(const c of kids.flat())if(c!=null)e.append(c);return e};
const fmtSize=b=>b>1048576?(b/1048576).toFixed(2)+' MB':b<1024?b+' bytes':Math.round(b/1024)+' KB';
const canFilter=typeof mk(1,1).getContext('2d').filter==='string';
let toastT=0;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),3800)}

const I={
  auto:'M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  erase:'M20 20H9l-5-5a2 2 0 0 1 0-2.8l8.4-8.4a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L12 20M7.5 9.5l7 7',
  restore:'M4 20c2.5 0 4-1.5 4-3.5S6.5 13 5 14.5 4 18 2.5 19c.5.6 1 1 1.5 1zM9 14l9.5-9.5a2.1 2.1 0 0 1 3 3L12 17',
  magic:'M4 20L15 9M13 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.6 1.4 1.4.6-1.4.6L19 16l-.6-1.4L17 14l1.4-.6z',
  hair:'M6 3c0 4 3 5 3 9s-3 5-3 9M12 3c0 4 3 5 3 9s-3 5-3 9M18 3c0 4 2 5 2 9s-2 5-2 9',
  edge:'M12 3a9 9 0 0 1 0 18M9.5 3.4a9 9 0 0 0-2.6 1.2M4.6 7a9 9 0 0 0-1.2 2.6M3.4 14.4A9 9 0 0 0 4.6 17M6.9 19.4a9 9 0 0 0 2.6 1.2',
  select:'M4 4l6.5 16 2.3-6.7L19.5 11zM14 14l6 6',
  bg:'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
  shadow:'M12 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM5 20.5h14',
  crop:'M6 2v16h16M2 6h16v16',
  upload:'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
  download:'M12 4v12M7 11l5 5 5-5M4 20h16',
  undo:'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  redo:'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  settings:'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  fit:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  crown:'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 16h14',
  paint:'M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.6 9.4 12zM9 13c-2.5 0-4 1.6-4 3.6 0 1.5-1 2.4-2 2.4 1 1 2.5 2 4.5 2 3 0 4.5-2 4.5-4.2',
  text:'M5 7V4h14v3M12 4v16M9 20h6',
  move:'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3'
};
const ico=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${I[n]}"/></svg>`;
document.querySelectorAll('[data-i]').forEach(e=>e.insertAdjacentHTML('afterbegin',ico(e.dataset.i)));

/* ---------- state ---------- */
const TOOLS=[['auto','Automatic removal'],['move','Move & resize','V'],['erase','Manual eraser','E'],['restore','Restore brush','R'],['magic','Magic brush','M'],['hair','Hair refinement','H'],
  ['edge','Edge refinement'],['select','Object selection','S'],['paint','Paint brush','P'],['text','Text','T'],['bg','Background','B'],['shadow','Shadow'],['crop','Crop','C']];
const PAINT=new Set(['erase','restore','magic','hair']);
const S={tool:'auto',view:'edited',split:.5,
  brush:{size:60,soft:40},magic:{tol:32,mode:'erase'},hair:{strength:100},edge:{feather:0,shift:0},
  select:{tol:28,action:'remove'},ai:{model:'isnet-general-use'},
  bg:{type:'none',color:'#ffffff',c1:'#f1f2f4',c2:'#b9bec6',angle:180,blur:24,img:null},
  sub:{scale:100,x:0,y:0,rot:0,pv:null},shadow:{on:false,opacity:35,blur:26,dist:22,angle:60}};
const X={fmt:'png',custom:false,w:0,h:0,lock:true,q:95,matte:'#ffffff'};
const V={x:0,y:0,z:1};
let doc=null,hist=[],redoS=[],compDirty=false,raf=0,cropDraft=null,busy=false,aiMsg='',maskOut=null;
let ptr={sx:0,sy:0,in:false},drag=null,space=false,bbox=null,strokeC=null,selText=null,textId=0;
S.paint={color:'#d9482b',size:30,soft:20,opacity:100,mode:'paint'};
const view=$('#view'),v=view.getContext('2d'),stage=$('#stage');
const comp=mk(1,1),cut=mk(1,1),fm=mk(1,1),sil=mk(1,1);
const checker=(()=>{const c=mk(16,16),x=c.getContext('2d');x.fillStyle='#2a2d33';x.fillRect(0,0,16,16);x.fillStyle='#383c44';x.fillRect(0,0,8,8);x.fillRect(8,8,8,8);return v.createPattern(c,'repeat')})();
const mctx=()=>doc.mask.getContext('2d');
const octx=()=>doc.orig.getContext('2d');
const curCrop=()=>S.tool==='crop'?{x:0,y:0,w:doc.w,h:doc.h}:doc.crop;

/* ---------- loading ---------- */
// SVG: rasterize vector files for editing (long side at least 2048 px, at most 4096 px)
const isSVG=f=>f.type==='image/svg+xml'||/\.svg$/i.test(f.name||'');
// Parse an SVG: returns normalized text (with a viewBox) and its intrinsic size
function parseSVG(text){
  const d=new DOMParser().parseFromString(text,'image/svg+xml'),root=d.documentElement;
  if(!root||root.nodeName.toLowerCase()!=='svg'||d.querySelector('parsererror'))throw new Error('Invalid SVG');
  const num=v=>{const m=/^\s*([\d.]+)\s*(px)?\s*$/.exec(v||'');return m?+m[1]:0};
  const vb=(root.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number),hasVB=vb.length===4&&vb[2]>0&&vb[3]>0;
  let w=num(root.getAttribute('width')),hh=num(root.getAttribute('height'));
  if(!(w&&hh)&&hasVB){if(w)hh=w*vb[3]/vb[2];else if(hh)w=hh*vb[2]/vb[3];else{w=vb[2];hh=vb[3]}}
  if(!(w&&hh))w=hh=1024;
  if(!hasVB)root.setAttribute('viewBox',`0 0 ${w} ${hh}`);
  return{text:new XMLSerializer().serializeToString(d),w,h:hh}}
// Return the SVG text with a new width/height
function sizedSVG(text,W,H){const d=new DOMParser().parseFromString(text,'image/svg+xml'),r=d.documentElement;
  r.setAttribute('width',W);r.setAttribute('height',H);return new XMLSerializer().serializeToString(d)}
// Render the SVG to a W x H canvas
async function rasterSVG(text,W,H){const url=URL.createObjectURL(new Blob([sizedSVG(text,W,H)],{type:'image/svg+xml'}));
  try{const img=new Image();img.src=url;await img.decode();const c=mk(W,H);c.getContext('2d').drawImage(img,0,0,W,H);return c}
  finally{URL.revokeObjectURL(url)}}
async function decodeSVG(file){const v=parseSVG(await file.text());
  const s=clamp(2048/Math.max(v.w,v.h),1,4096/Math.max(v.w,v.h)),W=Math.max(1,Math.round(v.w*s)),H=Math.max(1,Math.round(v.h*s));
  const c=await rasterSVG(v.text,W,H);c.svgText=v.text;return c}
const decodeImage=file=>isSVG(file)?decodeSVG(file):createImageBitmap(file,{imageOrientation:'from-image'});

async function loadFile(file){
  if(!file)return;if(busy)return toast('Please wait for the current task to finish.');
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)&&!isSVG(file))return toast('Unsupported format. Use JPG, PNG, WebP or SVG.');
  if(file.size>60*1048576)return toast('That file is larger than 60 MB.');
  let bmp;try{bmp=await decodeImage(file)}catch{return toast('This image could not be decoded.')}
  if(doc){saveTab();tabs.push(blankTab());loadTab(tabs.length-1)}  // open in a new tab if an image is already open
  const svg=bmp.svgText||null,w=bmp.width,hh=bmp.height,orig=mk(w,hh);orig.getContext('2d').drawImage(bmp,0,0);bmp.close?bmp.close():freeCanvas(bmp);
  const mask=mk(w,hh),m=mask.getContext('2d');m.fillStyle='#fff';m.fillRect(0,0,w,hh);
  doc={w,h:hh,orig,mask,px:null,svg,paint:null,texts:[],name:(file.name||'image').replace(/\.[^.]+$/,''),crop:{x:0,y:0,w,h:hh}};
  for(const c of[comp,cut,fm,sil]){c.width=w;c.height=hh}
  hist=[];redoS=[];cropDraft=null;aiMsg='';S.edge={feather:0,shift:0};S.sub={scale:100,x:0,y:0,rot:0,pv:null};
  $('#drop').hidden=true;$('#hud').hidden=false;
  bbox=null;selText=null;setTool('auto');setView('edited');updHist();updInfo();fit();renderTabs();render();
}
function updInfo(){const c=doc.crop;$('#info').textContent=`${c.w} × ${c.h} px · ${(c.w*c.h/1e6).toFixed(1)} MP`}

/* ---------- history (mask + crop) ---------- */
const copyCanvas=src=>{const c=mk(src.width,src.height);c.getContext('2d').drawImage(src,0,0);return c};
const snap=()=>({mask:copyCanvas(doc.mask),paint:doc.paint&&copyCanvas(doc.paint),texts:structuredClone(doc.texts),crop:{...doc.crop},sub:{...S.sub}});
const freeSnap=s=>{freeCanvas(s.mask);freeCanvas(s.paint)};
// Memory: setting a canvas to 0x0 releases its memory immediately
const freeCanvas=c=>{if(c){c.width=0;c.height=0}};
// Undo depth depends on image size and open tabs (about 400 MB across all tabs)
const histMax=()=>clamp(Math.floor(400e6/(Math.max(1,tabs.length)*doc.w*doc.h*4*(doc.paint?2:1))),3,12);
function pushHist(){bbox=null;hist.push(snap());while(hist.length>histMax())freeSnap(hist.shift());
  redoS.forEach(freeSnap);redoS=[];updHist()}
function applySnap(s){const m=mctx();m.globalCompositeOperation='copy';m.drawImage(s.mask,0,0);m.globalCompositeOperation='source-over';
  if(s.paint){if(!doc.paint)doc.paint=mk(doc.w,doc.h);const g=doc.paint.getContext('2d');g.globalCompositeOperation='copy';g.drawImage(s.paint,0,0);g.globalCompositeOperation='source-over'}
  else if(doc.paint){freeCanvas(doc.paint);doc.paint=null}
  if(s.texts){doc.texts=s.texts;if(!curText())selText=null}
  freeSnap(s);doc.crop=s.crop;if(s.sub)S.sub=s.sub;bbox=null;updInfo();updHist();buildProps();render()}
function undo(){if(!doc||!hist.length)return;redoS.push(snap());applySnap(hist.pop())}
function redo(){if(!doc||!redoS.length)return;hist.push(snap());applySnap(redoS.pop())}
function updHist(){$('#bUndo').disabled=!hist.length;$('#bRedo').disabled=!redoS.length}
function resetMask(){pushHist();const m=mctx();m.globalCompositeOperation='source-over';m.fillStyle='#fff';m.fillRect(0,0,doc.w,doc.h);render()}

/* ---------- tabs ---------- */
let tabs=[],cur=-1,closing=-1;
const PER_TAB=['edge','sub','bg','shadow'];   // settings stored separately for each tab
function blankTab(){return{doc:null,hist:[],redoS:[],V:{x:0,y:0,z:1},view:'edited',aiMsg:'',
  st:{edge:{feather:0,shift:0},sub:{scale:100,x:0,y:0,rot:0,pv:null},bg:{type:'none',color:'#ffffff',c1:'#f1f2f4',c2:'#b9bec6',angle:180,blur:24,img:null},shadow:{on:false,opacity:35,blur:26,dist:22,angle:60}}}}
function saveTab(){const t=tabs[cur];if(!t)return;t.doc=doc;t.hist=hist;t.redoS=redoS;t.V={...V};t.view=S.view;t.aiMsg=aiMsg;PER_TAB.forEach(k=>t.st[k]=S[k])}
function loadTab(i){cur=i;const t=tabs[i];doc=t.doc;hist=t.hist;redoS=t.redoS;Object.assign(V,t.V);aiMsg=t.aiMsg;PER_TAB.forEach(k=>S[k]=t.st[k]);
  cropDraft=null;bbox=null;maskOut=null;drag=null;selText=null;freeCanvas(strokeC);strokeC=null;
  for(const c of[comp,cut,fm,sil]){c.width=doc?doc.w:1;c.height=doc?doc.h:1}
  $('#drop').hidden=!!doc;$('#hud').hidden=!doc;$('#info').textContent='';if(doc)updInfo();
  setView(t.view);updHist();buildProps();renderTabs();render()}
function freeTab(t){if(t.doc){freeCanvas(t.doc.orig);freeCanvas(t.doc.mask);freeCanvas(t.doc.paint);t.doc.px=null}
  t.hist.forEach(freeSnap);t.redoS.forEach(freeSnap);t.st.bg.img?.close?.()}
const tabBusy=()=>busy&&(toast('Please wait for the current task to finish.'),true);
function newTab(){if(tabBusy())return;saveTab();tabs.push(blankTab());loadTab(tabs.length-1)}
function switchTab(i){if(i===cur||tabBusy())return;saveTab();loadTab(i)}
function askClose(i){if(tabBusy())return;saveTab();const t=tabs[i];
  if(t.doc&&t.hist.length){closing=i;$('#closeDlg').showModal()}else closeTab(i)}
function closeTab(i){saveTab();freeTab(tabs[i]);tabs.splice(i,1);if(!tabs.length)tabs.push(blankTab());
  const n=i<cur?cur-1:i===cur?Math.min(i,tabs.length-1):cur;loadTab(n)}   // frees memory immediately
function renderTabs(){const el=$('#tabs');
  el.replaceChildren(...tabs.map((t,i)=>{const d=i===cur?doc:t.doc,name=d?d.name:'New tab';
    return h('div',{class:'tab'+(i===cur?' on':''),role:'tab','aria-selected':String(i===cur),title:name,
        onclick:()=>switchTab(i),onauxclick:e=>{if(e.button===1)askClose(i)}},
      h('span',{class:'tn'},name),
      h('button',{class:'tx',type:'button','aria-label':'Close '+name,onclick:e=>{e.stopPropagation();askClose(i)}},'×'))}),
    h('button',{class:'tadd',type:'button',title:'New tab (Ctrl+T)','aria-label':'New tab',onclick:newTab},'+'));
  el.querySelector('.tab.on')?.scrollIntoView({block:'nearest',inline:'nearest'})}

/* ---------- AI removal ---------- */
function setBusy(text,frac){$('#busy').hidden=false;$('#busyT').textContent=text;const ind=frac==null;$('#busyBar').classList.toggle('ind',ind);$('#busyB').style.width=ind?'':Math.round(clamp(frac,0,1)*100)+'%'}
async function runAI(){
  if(!doc||busy)return;busy=true;setBusy('Preparing image…');
  try{
        const sc=Math.min(1,2048/Math.max(doc.w,doc.h));let src=doc.orig;
    if(sc<1){src=mk(Math.round(doc.w*sc),Math.round(doc.h*sc));const sx=src.getContext('2d');sx.imageSmoothingQuality='high';sx.drawImage(doc.orig,0,0,src.width,src.height)}
    const png=await new Promise(r=>src.toBlob(r,'image/png'));
    const out=await segment(png,S.ai,setBusy);
    const bmp=await createImageBitmap(out);pushHist();
    const m=mctx();m.globalCompositeOperation='copy';m.drawImage(bmp,0,0,doc.w,doc.h);
    m.globalCompositeOperation='source-in';m.fillStyle='#fff';m.fillRect(0,0,doc.w,doc.h);m.globalCompositeOperation='source-over';bmp.close();
    aiMsg='Done. Use the brushes or Edge refinement to touch up.';setView('edited');
  }catch(err){
    console.error(err);
    aiMsg='AI engine unavailable: '+(err&&err.message||err)+'. The manual tools still work.';
    toast('AI background removal could not run.');
  }finally{busy=false;$('#busy').hidden=true;buildProps();render()}
}

/* ---------- compositing (non-destructive: original + mask) ---------- */
// o: {src, K, out, cut, sil} — lets export render SVG sources at a higher resolution
function compose(o={}){
  const{w,h:hh,mask}=doc,src=o.src||doc.orig,K=o.K||1,out=o.out||comp,cutC=o.cut||cut,silC=o.sil||sil,e=S.edge,u=Math.max(w,hh)/1000;
  maskOut=mask;
  if(canFilter&&(e.feather>0||e.shift!==0)){
    const f=fm.getContext('2d');f.globalCompositeOperation='source-over';f.clearRect(0,0,w,hh);
    f.filter=`blur(${Math.max(e.feather,e.shift?1.2:0)}px)`;f.drawImage(mask,0,0);f.filter='none';
    f.globalCompositeOperation=e.shift>0?'source-over':'destination-in';
    for(let i=0;i<Math.abs(e.shift);i++)f.drawImage(fm,0,0);
    f.globalCompositeOperation='source-over';maskOut=fm;
  }
  const c=cutC.getContext('2d');c.setTransform(K,0,0,K,0,0);c.imageSmoothingQuality='high';c.globalCompositeOperation='copy';c.drawImage(src,0,0,w,hh);
  c.globalCompositeOperation='destination-in';c.drawImage(maskOut,0,0,w,hh);c.globalCompositeOperation='source-over';c.setTransform(1,0,0,1,0,0);
  const k=out.getContext('2d'),b=S.bg;k.setTransform(1,0,0,1,0,0);k.clearRect(0,0,out.width,out.height);k.setTransform(K,0,0,K,0,0);k.imageSmoothingQuality='high';
  if(b.type==='color'){k.fillStyle=b.color;k.fillRect(0,0,w,hh)}
  else if(b.type==='gradient'){const a=(b.angle-90)*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),L=(Math.abs(w*dx)+Math.abs(hh*dy))/2,
    g=k.createLinearGradient(w/2-dx*L,hh/2-dy*L,w/2+dx*L,hh/2+dy*L);g.addColorStop(0,b.c1);g.addColorStop(1,b.c2);k.fillStyle=g;k.fillRect(0,0,w,hh)}
  else if(b.type==='image'&&b.img){const s=Math.max(w/b.img.width,hh/b.img.height),iw=b.img.width*s,ih=b.img.height*s;k.drawImage(b.img,(w-iw)/2,(hh-ih)/2,iw,ih)}
  else if(b.type==='blur'){const r=b.blur*u;if(canFilter)k.filter=`blur(${r*K}px)`;k.drawImage(src,-2*r,-2*r,w+4*r,hh+4*r);k.filter='none'}
  const sh=S.shadow;
  if(sh.on&&canFilter){
    const q=silC.getContext('2d');q.setTransform(1,0,0,1,0,0);q.globalCompositeOperation='copy';q.drawImage(cutC,0,0);
    q.globalCompositeOperation='source-in';q.fillStyle='#000';q.fillRect(0,0,silC.width,silC.height);q.globalCompositeOperation='source-over';
    const a=sh.angle*Math.PI/180,d=sh.dist*u;
    k.save();k.translate(Math.cos(a)*d,Math.sin(a)*d);xf(k);k.globalAlpha=sh.opacity/100;k.filter=`blur(${sh.blur*u*K}px)`;k.drawImage(silC,0,0,w,hh);k.restore();
  }
  k.save();xf(k);k.drawImage(cutC,0,0,w,hh);k.restore();
  if(doc.paint)k.drawImage(doc.paint,0,0,w,hh);                                   // paint layer
  if(strokeC){k.globalAlpha=S.paint.opacity/100;k.drawImage(strokeC,0,0,w,hh);k.globalAlpha=1}  // stroke in progress
  drawTexts(k);                                                                   // text on top
  k.setTransform(1,0,0,1,0,0);
}
function render(){compDirty=true;redraw()}
function redraw(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(compDirty&&doc){compose();compDirty=false}drawView()})}

/* ---------- viewport ---------- */
function drawView(){
  const r=stage.getBoundingClientRect(),d=devicePixelRatio||1,cw=Math.round(r.width*d),ch=Math.round(r.height*d);
  if(view.width!==cw||view.height!==ch){view.width=cw;view.height=ch}
  v.setTransform(d,0,0,d,0,0);v.clearRect(0,0,r.width,r.height);
  if(!doc)return;
  const c=curCrop(),z=V.z,x=V.x,y=V.y,W=c.w*z,H=c.h*z,put=s=>v.drawImage(s,c.x,c.y,c.w,c.h,x,y,W,H);
  $('#zl').firstChild.textContent=Math.round(z*100)+'%';
  v.save();v.beginPath();v.rect(x,y,W,H);v.clip();
  v.fillStyle=checker;v.fillRect(x,y,W,H);
  v.imageSmoothingEnabled=z<3;v.imageSmoothingQuality='high';
  if(S.view==='original')put(doc.orig);
  else if(S.view==='mask'){v.fillStyle='#000';v.fillRect(x,y,W,H);put(maskOut||doc.mask)}
  else{put(comp);
    if(S.view==='split'){v.save();v.beginPath();v.rect(x,y,W*S.split,H);v.clip();v.fillStyle=checker;v.fillRect(x,y,W,H);put(doc.orig);v.restore()}}
  v.restore();
  if(S.view==='split'){const lx=x+W*S.split,cy=clamp(y+H/2,24,r.height-24);v.fillStyle='#fff';v.fillRect(lx-.75,Math.max(y,0),1.5,Math.min(H,r.height));
    v.beginPath();v.arc(lx,cy,11,0,7);v.fill();v.strokeStyle='#17191D';v.lineWidth=1.6;v.beginPath();v.moveTo(lx-2,cy-4);v.lineTo(lx-6,cy);v.lineTo(lx-2,cy+4);v.moveTo(lx+2,cy-4);v.lineTo(lx+6,cy);v.lineTo(lx+2,cy+4);v.stroke()}
  if(S.tool==='crop'){const R=cropDraft||doc.crop,rx=x+R.x*z,ry=y+R.y*z,rw=R.w*z,rh=R.h*z;
    v.fillStyle='rgba(13,14,17,.62)';v.beginPath();v.rect(x,y,W,H);v.rect(rx,ry,rw,rh);v.fill('evenodd');
    v.strokeStyle='#fff';v.lineWidth=1;v.strokeRect(rx+.5,ry+.5,rw-1,rh-1)}
  if(S.tool==='text'&&curText()&&S.view!=='original'&&S.view!=='mask'){const cs=textCorners(curText());
    v.save();v.strokeStyle='#7C9CFF';v.lineWidth=1.5;v.setLineDash([6,4]);v.beginPath();cs.forEach((q,i)=>i?v.lineTo(q.x,q.y):v.moveTo(q.x,q.y));v.closePath();v.stroke();v.setLineDash([]);
    v.fillStyle='#fff';for(const q of cs){v.fillRect(q.x-5,q.y-5,10,10);v.strokeRect(q.x-5,q.y-5,10,10)}v.restore()}
  if(S.tool==='move'&&S.view!=='original'&&S.view!=='mask'){const R=boxOnScreen();
    v.save();v.strokeStyle='#7C9CFF';v.lineWidth=1.5;v.setLineDash([6,4]);v.beginPath();R.cs.forEach((q,i)=>i?v.lineTo(q.x,q.y):v.moveTo(q.x,q.y));v.closePath();v.stroke();v.setLineDash([]);
    v.beginPath();v.moveTo(R.top.x,R.top.y);v.lineTo(R.rh.x,R.rh.y);v.stroke();
    v.fillStyle='#fff';for(const q of R.cs){v.save();v.translate(q.x,q.y);v.rotate(R.a);v.fillRect(-5,-5,10,10);v.strokeRect(-5,-5,10,10);v.restore()}
    v.beginPath();v.arc(R.rh.x,R.rh.y,6.5,0,7);v.fill();v.stroke();
    v.strokeStyle='#4d6bd6';v.lineWidth=1.3;v.beginPath();v.arc(R.rh.x,R.rh.y,3,-.3,4.4);v.stroke();v.restore()}
  if(ptr.in&&(PAINT.has(S.tool)||S.tool==='paint')&&!space&&!(drag&&drag.k==='pan')){const rad=Math.max(2,S.tool==='paint'?S.paint.size/2*z:S.brush.size/2*z*S.sub.scale/100);
    v.beginPath();v.arc(ptr.sx,ptr.sy,rad,0,7);v.strokeStyle='rgba(0,0,0,.7)';v.lineWidth=2.5;v.stroke();v.strokeStyle='#fff';v.lineWidth=1;v.stroke()}
}
function fit(){if(!doc)return;const r=stage.getBoundingClientRect(),c=curCrop();V.z=Math.min((r.width-72)/c.w,(r.height-72)/c.h,8);V.x=(r.width-c.w*V.z)/2;V.y=(r.height-c.h*V.z)/2;redraw()}
function zoomAt(px,py,nz){nz=clamp(nz,.02,32);V.x=px-(px-V.x)*nz/V.z;V.y=py-(py-V.y)*nz/V.z;V.z=nz;redraw()}
const zoomC=f=>{const r=stage.getBoundingClientRect();zoomAt(r.width/2,r.height/2,f)};
new ResizeObserver(()=>redraw()).observe(stage);

/* ---------- move tool ---------- */
// Subject bounding box from the mask (computed on a small copy for speed)
function subjectBox(){if(bbox)return bbox;const{w,h:hh}=doc,sc=Math.min(1,512/Math.max(w,hh)),sw=Math.max(1,Math.round(w*sc)),sh=Math.max(1,Math.round(hh*sc)),
  c=mk(sw,sh),x=c.getContext('2d',{willReadFrequently:true});x.drawImage(doc.mask,0,0,sw,sh);const d=x.getImageData(0,0,sw,sh).data;
  let x0=sw,y0=sh,x1=-1,y1=-1;
  for(let y=0;y<sh;y++)for(let i=0;i<sw;i++)if(d[(y*sw+i)*4+3]>24){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return bbox={x:0,y:0,w,h:hh};
  const bx=Math.max(0,(x0-1)/sc),by=Math.max(0,(y0-1)/sc);
  return bbox={x:bx,y:by,w:Math.min(w,(x1+2)/sc)-bx,h:Math.min(hh,(y1+2)/sc)-by}}
function subBox(){const b=subjectBox(),s=S.sub.scale/100,cx=doc.w/2,cy=doc.h/2,ox=S.sub.x/100*doc.w,oy=S.sub.y/100*doc.h;
  return{x:(b.x-cx)*s+cx+ox,y:(b.y-cy)*s+cy+oy,w:b.w*s,h:b.h*s,b}}
function boxOnScreen(){const B=subBox(),c=curCrop(),z=V.z,P=pivotOut(),a=rotRad(),
    Ps={x:V.x+(P.x-c.x)*z,y:V.y+(P.y-c.y)*z},R={x:V.x+(B.x-c.x)*z,y:V.y+(B.y-c.y)*z,w:B.w*z,h:B.h*z},rc=q=>rotAbout(q,Ps,a);
  return{...R,a,Ps,B,cs:[[R.x,R.y],[R.x+R.w,R.y],[R.x+R.w,R.y+R.h],[R.x,R.y+R.h]].map(([x,y])=>rc({x,y})),
    top:rc({x:R.x+R.w/2,y:R.y}),rh:rc({x:R.x+R.w/2,y:R.y-30})}}
function moveHit(p){const R=boxOnScreen();
  if(Math.hypot(p.sx-R.rh.x,p.sy-R.rh.y)<11)return'rot';
  for(const q of R.cs)if(Math.abs(p.sx-q.x)<10&&Math.abs(p.sy-q.y)<10)return'scale';
  const u=rotAbout({x:p.sx,y:p.sy},R.Ps,-R.a);
  return u.x>=R.x&&u.x<=R.x+R.w&&u.y>=R.y&&u.y<=R.y+R.h?'move':null}
const r1=n=>Math.round(n*10)/10;

/* ---------- paint brush (separate layer) ---------- */
const hexRGB=c=>{const n=parseInt(c.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255].join(',')};
function paintStamp(q){const P=S.paint,er=P.mode==='erase',x=(er?doc.paint:strokeC).getContext('2d'),r=P.size/2,hard=Math.min(.999,1-P.soft/100),
    col=er?'0,0,0':hexRGB(P.color),g=x.createRadialGradient(q.x,q.y,0,q.x,q.y,r);
  g.addColorStop(0,`rgba(${col},1)`);g.addColorStop(hard,`rgba(${col},1)`);g.addColorStop(1,`rgba(${col},0)`);
  x.globalCompositeOperation=er?'destination-out':'source-over';if(er)x.globalAlpha=P.opacity/100;
  x.fillStyle=g;x.beginPath();x.arc(q.x,q.y,r,0,7);x.fill();x.globalCompositeOperation='source-over';x.globalAlpha=1}
function paintTo(q){const l=drag.last,d=Math.hypot(q.x-l.x,q.y-l.y),step=Math.max(1,S.paint.size*.12);if(d<step)return;
  for(let t=step;t<=d;t+=step)paintStamp({x:l.x+(q.x-l.x)*t/d,y:l.y+(q.y-l.y)*t/d});drag.last=q;render()}
function commitStroke(){if(!strokeC)return;const g=doc.paint.getContext('2d');g.globalAlpha=S.paint.opacity/100;g.drawImage(strokeC,0,0);g.globalAlpha=1;
  freeCanvas(strokeC);strokeC=null;render()}

/* ---------- text ---------- */
const FONTS=['Segoe UI','Arial','Arial Black','Impact','Georgia','Times New Roman','Trebuchet MS','Verdana','Courier New','Comic Sans MS'];
const SWATCH=['#ffffff','#111111','#d9482b','#f2c45c','#1f8a5b','#3a7bd5','#8e44ad'];
const measure=mk(1,1).getContext('2d');
const curText=()=>doc&&doc.texts.find(t=>t.id===selText);
function textLayout(t){const font=`${t.italic?'italic ':''}${t.bold?700:400} ${t.size}px "${t.font}", "Segoe UI", sans-serif`;measure.font=font;
  const lines=(t.text||' ').split('\n'),ws=lines.map(l=>measure.measureText(l).width),lh=t.size*1.2;
  return{font,lines,ws,lh,w:Math.max(t.size*.5,...ws),h:lh*lines.length}}
function drawTexts(k){for(const t of doc.texts){const L=textLayout(t),ax=t.align==='left'?-L.w/2:t.align==='right'?L.w/2:0;
  k.save();k.globalAlpha=t.opacity/100;k.translate(t.x,t.y);if(t.rot)k.rotate(t.rot*Math.PI/180);
  k.font=L.font;k.textAlign=t.align;k.textBaseline='middle';k.lineJoin='round';
  L.lines.forEach((ln,i)=>{const y=-L.h/2+L.lh*(i+.5);
    if(t.stroke>0){k.strokeStyle=t.strokeColor;k.lineWidth=t.size*t.stroke/50;k.strokeText(ln,ax,y)}
    k.fillStyle=t.color;k.fillText(ln,ax,y)});
  k.restore()}}
function textCorners(t){const L=textLayout(t),pd=t.size*.15,hw=L.w/2+pd,hh=L.h/2+pd,a=(t.rot||0)*Math.PI/180,c=curCrop();
  return[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>{const q=rotAbout({x:t.x+x,y:t.y+y},{x:t.x,y:t.y},a);return{x:V.x+(q.x-c.x)*V.z,y:V.y+(q.y-c.y)*V.z}})}
function textHit(p){const t0=curText();
  if(t0)for(const q of textCorners(t0))if(Math.abs(p.sx-q.x)<10&&Math.abs(p.sy-q.y)<10)return{t:t0,k:'scale'};
  for(let i=doc.texts.length-1;i>=0;i--){const t=doc.texts[i],L=textLayout(t),pd=t.size*.15,u=rotAbout(p,{x:t.x,y:t.y},-(t.rot||0)*Math.PI/180);
    if(Math.abs(u.x-t.x)<=L.w/2+pd&&Math.abs(u.y-t.y)<=L.h/2+pd)return{t,k:'move'}}
  return null}
function addText(x,y){pushHist();const t={id:++textId,text:'Your text',font:'Segoe UI',size:Math.max(12,Math.round(Math.max(doc.w,doc.h)/14)),color:'#111111',
    bold:true,italic:false,align:'center',opacity:100,rot:0,stroke:0,strokeColor:'#ffffff',x,y};
  doc.texts.push(t);selText=t.id;buildProps();render();setTimeout(()=>{const a=$('#tTxt');if(a){a.focus();a.select()}},0)}
function deleteText(){if(!curText())return;pushHist();doc.texts=doc.texts.filter(t=>t.id!==selText);selText=null;buildProps();render()}

/* ---------- brushes ---------- */
const toDoc=e=>{const r=view.getBoundingClientRect(),c=curCrop(),sx=e.clientX-r.left,sy=e.clientY-r.top;return{sx,sy,x:(sx-V.x)/V.z+c.x,y:(sy-V.y)/V.z+c.y}};
// Subject transform: scale + offset, then rotate around the pivot
const rotAbout=(p,c,a)=>{const cs=Math.cos(a),sn=Math.sin(a),dx=p.x-c.x,dy=p.y-c.y;return{x:c.x+dx*cs-dy*sn,y:c.y+dx*sn+dy*cs}};
const fwd=(x,y)=>{const s=S.sub.scale/100,W=doc.w,H=doc.h;return{x:(x-W/2)*s+W/2+S.sub.x/100*W,y:(y-H/2)*s+H/2+S.sub.y/100*H}};
const rotRad=()=>(S.sub.rot||0)*Math.PI/180;
function pivotOut(){const v=S.sub.pv||{x:doc.w/2,y:doc.h/2};return fwd(v.x,v.y)}
function setPivot(){const b=subjectBox();S.sub.pv={x:b.x+b.w/2,y:b.y+b.h/2}}
function xf(k){const s=S.sub.scale/100,W=doc.w,H=doc.h,r=rotRad();
  if(r){const P=pivotOut();k.translate(P.x,P.y);k.rotate(r);k.translate(-P.x,-P.y)}
  k.translate(W/2+S.sub.x/100*W,H/2+S.sub.y/100*H);k.scale(s,s);k.translate(-W/2,-H/2)}
const toImg=p=>{const r=rotRad();if(r)p=rotAbout(p,pivotOut(),-r);const s=S.sub.scale/100,cx=doc.w/2,cy=doc.h/2;
  return{x:(p.x-cx-S.sub.x/100*doc.w)/s+cx,y:(p.y-cy-S.sub.y/100*doc.h)/s+cy}};
function dab(q,erase){const m=mctx(),r=S.brush.size/2,hard=Math.min(.999,1-S.brush.soft/100),col=erase?'0,0,0':'255,255,255',g=m.createRadialGradient(q.x,q.y,0,q.x,q.y,r);
  g.addColorStop(0,`rgba(${col},1)`);g.addColorStop(hard,`rgba(${col},1)`);g.addColorStop(1,`rgba(${col},0)`);
  m.globalCompositeOperation=erase?'destination-out':'source-over';m.fillStyle=g;m.beginPath();m.arc(q.x,q.y,r,0,7);m.fill();m.globalCompositeOperation='source-over'}
function region(q){const r=Math.ceil(S.brush.size/2),x0=clamp(Math.floor(q.x-r),0,doc.w),y0=clamp(Math.floor(q.y-r),0,doc.h),x1=clamp(Math.ceil(q.x+r),0,doc.w),y1=clamp(Math.ceil(q.y+r),0,doc.h),w=x1-x0,hh=y1-y0;
  if(w<1||hh<1)return null;return{x0,y0,w,h:hh,r,o:octx().getImageData(x0,y0,w,hh).data,mi:mctx().getImageData(x0,y0,w,hh)}}
// Magic brush: only affects pixels whose colour matches the colour under the first click.
function magicStamp(q,ref){const R=region(q);if(!R)return;const{x0,y0,w,h:hh,r,o,mi}=R,m=mi.data,tol2=S.magic.tol**2*3,er=S.magic.mode==='erase',r2=r*r;
  for(let y=0;y<hh;y++)for(let x=0;x<w;x++){const px=x0+x+.5-q.x,py=y0+y+.5-q.y;if(px*px+py*py>r2)continue;
    const i=(y*w+x)*4,dr=o[i]-ref[0],dg=o[i+1]-ref[1],db=o[i+2]-ref[2],t=(dr*dr+dg*dg+db*db)/tol2;if(t>1)continue;
    const s=t<.6?1:(1-t)/.4;m[i]=m[i+1]=m[i+2]=255;m[i+3]=er?Math.min(m[i+3],255*(1-s)):Math.max(m[i+3],255*s)}
  mctx().putImageData(mi,x0,y0)}
// Hair refinement: re-estimates edge alpha from local subject and background colours.
function hairStamp(q){const R=region(q);if(!R)return;const{x0,y0,w,h:hh,r,o,mi}=R,m=mi.data;let f=[0,0,0],fn=0,b=[0,0,0],bn=0;
  for(let i=0;i<m.length;i+=4){const a=m[i+3];if(a>242){f[0]+=o[i];f[1]+=o[i+1];f[2]+=o[i+2];fn++}else if(a<13){b[0]+=o[i];b[1]+=o[i+1];b[2]+=o[i+2];bn++}}
  if(fn<16||bn<16)return;f=f.map(n=>n/fn);b=b.map(n=>n/bn);
  const d=[f[0]-b[0],f[1]-b[1],f[2]-b[2]],dd=d[0]*d[0]+d[1]*d[1]+d[2]*d[2];if(dd<600)return;
  const k=S.hair.strength/100,r2=r*r;
  for(let y=0;y<hh;y++)for(let x=0;x<w;x++){const px=x0+x+.5-q.x,py=y0+y+.5-q.y,d2=px*px+py*py;if(d2>r2)continue;
    const i=(y*w+x)*4,a=m[i+3];if(a>242)continue;
    const t=clamp(((o[i]-b[0])*d[0]+(o[i+1]-b[1])*d[1]+(o[i+2]-b[2])*d[2])/dd,0,1);
    m[i]=m[i+1]=m[i+2]=255;m[i+3]=a+(t*255-a)*k*(1-d2/r2)}
  mctx().putImageData(mi,x0,y0)}
function stamp(q){if(S.tool==='erase')dab(q,true);else if(S.tool==='restore')dab(q,false);else if(S.tool==='magic')magicStamp(q,drag.ref);else hairStamp(q)}
function strokeTo(q){const l=drag.last,d=Math.hypot(q.x-l.x,q.y-l.y),step=Math.max(1,S.brush.size*(S.tool==='erase'||S.tool==='restore'?.12:.3));if(d<step)return;
  for(let t=step;t<=d;t+=step)stamp({x:l.x+(q.x-l.x)*t/d,y:l.y+(q.y-l.y)*t/d});drag.last=q;render()}
// Object selection: flood-fills similar, connected colours from the clicked point.
function wand(ix,iy){const{w,h:hh}=doc;doc.px??=octx().getImageData(0,0,w,hh).data;const o=doc.px,mi=mctx().getImageData(0,0,w,hh),m=mi.data;
  const seen=new Uint8Array(w*hh),st=[ix+iy*w],p0=st[0]*4,r=o[p0],g=o[p0+1],b=o[p0+2],tol2=S.select.tol**2*3,a=S.select.action==='keep'?255:0,n=w*hh;seen[st[0]]=1;
  const tryPx=q=>{if(seen[q])return;seen[q]=1;const j=q*4,dr=o[j]-r,dg=o[j+1]-g,db=o[j+2]-b;if(dr*dr+dg*dg+db*db<=tol2)st.push(q)};
  while(st.length){const p=st.pop(),i=p*4,x=p%w;m[i]=m[i+1]=m[i+2]=255;m[i+3]=a;if(x>0)tryPx(p-1);if(x<w-1)tryPx(p+1);if(p>=w)tryPx(p-w);if(p<n-w)tryPx(p+w)}
  mctx().putImageData(mi,0,0)}

/* ---------- pointer + keyboard ---------- */
view.addEventListener('contextmenu',e=>e.preventDefault());
view.addEventListener('pointerdown',e=>{
  if(!doc||busy)return;view.setPointerCapture(e.pointerId);const p=toDoc(e),pan=()=>{drag={k:'pan',sx:e.clientX,sy:e.clientY,vx:V.x,vy:V.y}};
  if(space||e.button!==0)return pan();
  if(S.view==='split'){const c=curCrop();if(Math.abs(p.sx-(V.x+c.w*V.z*S.split))<14){drag={k:'split'};return}}
  if(S.tool==='paint'){if(S.view!=='edited')setView('edited');if(S.paint.mode==='erase'&&!doc.paint)return;pushHist();
    if(!doc.paint)doc.paint=mk(doc.w,doc.h);if(S.paint.mode==='paint')strokeC=mk(doc.w,doc.h);drag={k:'pp',last:p};paintStamp(p);render();return}
  if(S.tool==='text'){if(S.view!=='edited')setView('edited');const hit=textHit(p);
    if(hit){selText=hit.t.id;drag={k:hit.k==='scale'?'tsize':'tmove',p0:p,x0:hit.t.x,y0:hit.t.y,s0:hit.t.size,t:hit.t,pushed:false};buildProps();redraw()}
    else if(curText()){selText=null;buildProps();redraw()}
    else addText(p.x,p.y);
    return}
  if(PAINT.has(S.tool)){if(S.view==='original'||S.view==='split')setView('edited');pushHist();const q=toImg(p);drag={k:'paint',last:q,ref:null};
    if(S.tool==='magic')drag.ref=octx().getImageData(clamp(q.x|0,0,doc.w-1),clamp(q.y|0,0,doc.h-1),1,1).data;stamp(q);render()}
  else if(S.tool==='select'){const q=toImg(p),ix=Math.floor(q.x),iy=Math.floor(q.y);if(ix<0||iy<0||ix>=doc.w||iy>=doc.h)return;pushHist();wand(ix,iy);render()}
  else if(S.tool==='crop'){drag={k:'crop',x0:clamp(p.x,0,doc.w),y0:clamp(p.y,0,doc.h)};cropDraft=null}
  else if(S.tool==='move'){if(S.view==='original'||S.view==='mask')setView('edited');const k=moveHit(p);if(!k)return pan();
    pushHist();if(k==='rot'&&!S.sub.rot)setPivot();const B=subBox(),P=pivotOut();
    drag={k,p0:p,sub0:{...S.sub},cx:B.x+B.w/2,cy:B.y+B.h/2,b:B.b,P,a0:Math.atan2(p.y-P.y,p.x-P.x)}}
  else pan();
});
view.addEventListener('pointermove',e=>{
  if(!doc)return;const p=toDoc(e);ptr={sx:p.sx,sy:p.sy,in:true};
  if(drag){
    if(drag.k==='pan'){V.x=drag.vx+e.clientX-drag.sx;V.y=drag.vy+e.clientY-drag.sy}
    else if(drag.k==='split'){const c=curCrop();S.split=clamp((p.sx-V.x)/(c.w*V.z),0,1)}
    else if(drag.k==='paint')strokeTo(toImg(p));
    else if(drag.k==='pp')paintTo(p);
    else if(drag.k==='tmove'||drag.k==='tsize'){const t=drag.t;if(!drag.pushed){pushHist();drag.pushed=true;drag.t=t}
      if(drag.k==='tmove'){t.x=drag.x0+p.x-drag.p0.x;t.y=drag.y0+p.y-drag.p0.y}
      else{const d0=Math.hypot(drag.p0.x-drag.x0,drag.p0.y-drag.y0)||1;t.size=Math.round(clamp(drag.s0*Math.hypot(p.x-drag.x0,p.y-drag.y0)/d0,4,2000))}
      render()}
    else if(drag.k==='move'){S.sub.x=r1(clamp(drag.sub0.x+(p.x-drag.p0.x)/doc.w*100,-100,100));S.sub.y=r1(clamp(drag.sub0.y+(p.y-drag.p0.y)/doc.h*100,-100,100));render()}
    else if(drag.k==='rot'){let d=drag.sub0.rot+(Math.atan2(p.y-drag.P.y,p.x-drag.P.x)-drag.a0)*180/Math.PI;
      if(e.shiftKey)d=Math.round(d/15)*15;d=((d+180)%360+360)%360-180;S.sub.rot=Math.round(d);render()}
    else if(drag.k==='scale'){const d0=Math.hypot(drag.p0.x-drag.cx,drag.p0.y-drag.cy)||1,d1=Math.hypot(p.x-drag.cx,p.y-drag.cy),
        b=drag.b,W=doc.w,H=doc.h;S.sub.scale=Math.round(clamp(drag.sub0.scale*d1/d0,10,200));const s=S.sub.scale/100;
      // keep the box center fixed
      S.sub.x=r1(clamp((drag.cx-W/2-(b.x+b.w/2-W/2)*s)/W*100,-100,100));S.sub.y=r1(clamp((drag.cy-H/2-(b.y+b.h/2-H/2)*s)/H*100,-100,100));render()}
    else if(drag.k==='crop'){const x1=clamp(p.x,0,doc.w),y1=clamp(p.y,0,doc.h);cropDraft={x:Math.round(Math.min(drag.x0,x1)),y:Math.round(Math.min(drag.y0,y1)),w:Math.round(Math.abs(x1-drag.x0)),h:Math.round(Math.abs(y1-drag.y0))}}
  }else if(S.tool==='text'&&!space){const k=textHit(p);view.style.cursor=k?(k.k==='scale'?'nwse-resize':'move'):'text'}
  else if(S.tool==='move'&&!space){const k=moveHit(p);view.style.cursor=k==='rot'?'grab':k==='scale'?'nwse-resize':k==='move'?'move':'default'}
  redraw();
});
const endDrag=()=>{if(drag&&drag.k==='crop'){if(cropDraft&&(cropDraft.w<8||cropDraft.h<8))cropDraft=null;buildProps()}
  if(drag&&drag.k==='pp')commitStroke();
  if(drag&&(drag.k==='tmove'||drag.k==='tsize'))buildProps();
  if(drag&&(drag.k==='move'||drag.k==='scale'||drag.k==='rot')){if(!S.sub.rot)S.sub.pv=null;buildProps()}drag=null;redraw()};
view.addEventListener('pointerup',endDrag);view.addEventListener('pointercancel',endDrag);
view.addEventListener('pointerleave',()=>{ptr.in=false;redraw()});
view.addEventListener('wheel',e=>{if(!doc)return;e.preventDefault();const p=toDoc(e);zoomAt(p.sx,p.sy,V.z*Math.exp(-e.deltaY*(e.ctrlKey?.01:.0015)))},{passive:false});
function setCursor(){view.style.cursor=space?'grab':PAINT.has(S.tool)||S.tool==='paint'?'none':S.tool==='text'?'text':S.tool==='move'?'move':S.tool==='crop'||S.tool==='select'?'crosshair':'default'}
addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]')||e.target.matches('input:not([type=range]):not([type=checkbox]),textarea'))return;
  const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
  if(e.code==='Space'){space=true;setCursor();e.preventDefault();redraw();return}
  if(mod&&k==='t'){e.preventDefault();newTab();return}
  if(mod&&k==='w'){e.preventDefault();askClose(cur);return}
  if(e.ctrlKey&&e.key==='Tab'){e.preventDefault();switchTab((cur+(e.shiftKey?-1:1)+tabs.length)%tabs.length);return}
  if(mod&&k==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
  if(mod&&k==='y'){e.preventDefault();redo();return}
  if(mod||e.altKey)return;
  if(S.tool==='text'&&curText()&&(k==='delete'||k==='backspace')){e.preventDefault();deleteText();return}
  if(k==='escape'&&selText){selText=null;buildProps();redraw();return}
  if(k==='+'||k==='=')zoomC(V.z*1.25);else if(k==='-')zoomC(V.z*.8);else if(k==='0')fit();else if(k==='1')zoomC(1);
  else if(k==='o')setView(S.view==='original'?'edited':'original');
  else if(k==='['||k===']'){const B=S.tool==='paint'?S.paint:S.brush;B.size=clamp(Math.round(B.size*(k==='['?.85:1.18)),1,600);buildProps();redraw()}
  else{const t=TOOLS.find(t=>t[2]&&t[2].toLowerCase()===k);if(t)setTool(t[0])}
});
addEventListener('keyup',e=>{if(e.code==='Space'){space=false;setCursor();redraw()}});

/* ---------- UI: tools, views, properties ---------- */
const toolsEl=$('#tools');
TOOLS.forEach(([id,label,key])=>{const b=h('button',{class:'ib','data-tool':id,'data-tip':label+(key?` (${key})`:''),'aria-label':label,'aria-pressed':'false',onclick:()=>setTool(id)});b.innerHTML=ico(id);toolsEl.append(b)});
function setTool(id){const was=S.tool;S.tool=id;cropDraft=null;toolsEl.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===id)));
  setCursor();buildProps();if(doc&&(was==='crop')!==(id==='crop'))fit();redraw()}
function setView(m){S.view=m;document.querySelectorAll('#views button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===m)));redraw()}
$('#views').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setView(b.dataset.view)});

function range(label,obj,key,min,max,step=1,unit='',cb=render){const out=h('output',{},obj[key]+unit);
  return h('label',{class:'row'},h('span',{class:'lbl'},label,out),h('input',{type:'range',min,max,step,value:obj[key],oninput:e=>{obj[key]=+e.target.value;out.textContent=obj[key]+unit;cb()}}))}
function seg(label,obj,key,opts,cb=render){const g=h('div',{class:'wseg',role:'group','aria-label':label});
  opts.forEach(([val,txt])=>g.append(h('button',{type:'button','aria-pressed':String(obj[key]===val),onclick:()=>{obj[key]=val;[...g.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(opts[i][0]===val)));cb()}},txt)));
  return h('div',{class:'row'},h('span',{class:'lbl'},label),g)}
function check(label,obj,key,cb=render){const i=h('input',{type:'checkbox',onchange:e=>{obj[key]=e.target.checked;cb()}});i.checked=obj[key];return h('label',{class:'chk'},i,label)}
// Converts hex (#FF6600, FF6600, #F60) or RGB (255, 102, 0 / rgb(255,102,0)) to #rrggbb
function parseColor(v){v=String(v).trim().toLowerCase();let m;
  if((m=/^#?([0-9a-f]{3})$/.exec(v)))return'#'+[...m[1]].map(c=>c+c).join('');
  if((m=/^#?([0-9a-f]{6})$/.exec(v)))return'#'+m[1];
  if((m=/^(?:rgba?\s*\()?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+%?\s*)?\)?$/.exec(v))){const n=m.slice(1,4).map(Number);
    if(n.every(x=>x<=255))return'#'+n.map(x=>x.toString(16).padStart(2,'0')).join('')}
  return null}
function color(label,obj,key,cb=render){
  const pick=h('input',{type:'color',value:obj[key],'aria-label':label,oninput:e=>{obj[key]=e.target.value;txt.value=e.target.value;cb()}});
  const txt=h('input',{type:'text',class:'hex',value:obj[key],spellcheck:'false',title:'Hex (#FF6600) or RGB (255, 102, 0)','aria-label':label+', hex or RGB',
    oninput:e=>{const c=parseColor(e.target.value);if(c){obj[key]=c;pick.value=c;cb()}},
    onchange:e=>{const c=parseColor(e.target.value);if(!c){e.target.value=obj[key];return toast('Type a hex code like #FF6600 or RGB like 255, 102, 0.')}e.target.value=c},
    onkeydown:e=>{if(e.key==='Enter')e.target.blur()}});
  return h('div',{class:'clr row'},h('span',{},label),h('span',{class:'clrin'},txt,pick))}
const btn=(label,fn,cls='',dis=false)=>h('button',{type:'button',class:'btn '+cls,onclick:fn,disabled:dis},label);
const hint=t=>h('p',{class:'hint'},t);
const sub=t=>h('h3',{},t);

function buildProps(){
  const p=$('#props');p.replaceChildren(h('h2',{},TOOLS.find(t=>t[0]===S.tool)[1]));
  if(!doc){p.append(hint('Open an image to start editing.'));return}
  const add=(...n)=>p.append(...n),re=()=>{buildProps();render()};
  const brush=()=>[range('Brush size',S.brush,'size',2,600,1,' px',redraw),range('Softness',S.brush,'soft',0,100,1,'%',redraw)];
  switch(S.tool){
        case'auto':{const cur=MODELS.find(m=>m[0]===S.ai.model),need=cur&&cur[2]===false;
      add(hint('Runs an AI segmentation model on this computer. Your image is never uploaded.'),seg('Model',S.ai,'model',MODELS,buildProps));
      if(need)add(hint('This model is not installed yet. It downloads once (about 1 GB, needs internet), then works offline.'));
      add(btn(need?'Download and remove background':'Remove background',runAI,'primary'))}
      if(aiMsg)add(hint(aiMsg));add(btn('Show mask',()=>setView('mask')),btn('Reset mask',resetMask));break;
    case'move':add(hint('Drag the subject to move it. Drag a corner to resize it, or the round handle on top to rotate it (hold Shift for 15° steps).'),
      range('Size',S.sub,'scale',10,200,1,'%'),range('Rotate',S.sub,'rot',-180,180,1,'°',()=>{if(!S.sub.rot)S.sub.pv=null;else if(!S.sub.pv)setPivot();render()}),range('Horizontal',S.sub,'x',-100,100,1,'%'),range('Vertical',S.sub,'y',-100,100,1,'%'),
      btn('Center subject',()=>{pushHist();const b=subjectBox(),s=S.sub.scale/100;
        S.sub.x=r1(clamp(-(b.x+b.w/2-doc.w/2)*s/doc.w*100,-100,100));S.sub.y=r1(clamp(-(b.y+b.h/2-doc.h/2)*s/doc.h*100,-100,100));re()}),
      btn('Reset position',()=>{pushHist();S.sub={scale:100,x:0,y:0,rot:0,pv:null};re()}));break;
    case'paint':{const P=S.paint,sw=h('div',{class:'sw'});SWATCH.forEach(c=>sw.append(h('button',{style:'background:'+c,'aria-label':'Use '+c,onclick:()=>{P.color=c;buildProps()}})));
      add(hint('Paint on top of the image. Paint stays on its own layer, so erasing it never touches the photo.'),
        seg('Mode',P,'mode',[['paint','Paint'],['erase','Erase paint']],()=>{}),color('Colour',P,'color',()=>{}),sw,
        range('Brush size',P,'size',1,600,1,' px',redraw),range('Softness',P,'soft',0,100,1,'%',()=>{}),range('Opacity',P,'opacity',5,100,1,'%',()=>{}),
        btn('Clear all paint',()=>{pushHist();freeCanvas(doc.paint);doc.paint=null;re()},'',!doc.paint));break}
    case'text':{const t=curText();
      if(!t){add(hint('Click anywhere on the image to add text. Click a text to select it, drag to move it, or drag a corner to resize it.'),btn('Add text',()=>addText(doc.w/2,doc.h/2),'primary'));
        if(doc.texts.length)add(hint(`${doc.texts.length} text item${doc.texts.length>1?'s':''} on this image.`));break}
      const ta=h('textarea',{id:'tTxt',class:'ta',rows:3,'aria-label':'Text',onfocus:()=>pushHist(),oninput:e=>{t.text=e.target.value;render()}});ta.value=t.text;
      const sel=h('select',{class:'sel','aria-label':'Font',onchange:e=>{t.font=e.target.value;render()}},
        ...FONTS.map(f=>{const o=h('option',{value:f,style:`font-family:"${f}"`},f);o.selected=f===t.font;return o}));
      const sw=h('div',{class:'sw'});SWATCH.forEach(c=>sw.append(h('button',{style:'background:'+c,'aria-label':'Use '+c,onclick:()=>{t.color=c;re()}})));
      add(ta,h('label',{class:'row'},h('span',{class:'lbl'},'Font'),sel),range('Size',t,'size',6,Math.max(600,t.size),1,' px'),color('Colour',t,'color'),sw,
        seg('Weight',t,'bold',[[false,'Regular'],[true,'Bold']]),check('Italic',t,'italic'),seg('Align',t,'align',[['left','Left'],['center','Center'],['right','Right']]),
        range('Opacity',t,'opacity',5,100,1,'%'),range('Rotate',t,'rot',-180,180,1,'°'),
        sub('Outline'),range('Outline width',t,'stroke',0,20,1,''),color('Outline colour',t,'strokeColor'),
        btn('Duplicate',()=>{pushHist();const n={...t,id:++textId,x:t.x+t.size*.6,y:t.y+t.size*.6};doc.texts.push(n);selText=n.id;re()}),
        btn('Delete text',deleteText),btn('Done',()=>{selText=null;re()}));break}
    case'erase':add(hint('Paint to remove areas from the result.'),...brush());break;
    case'restore':add(hint('Paint to bring back parts of the original image.'),...brush());break;
    case'magic':add(hint('Click a colour, then paint. Only pixels similar to that colour are affected, so you can clean up along an edge without touching the subject.'),
      seg('Mode',S.magic,'mode',[['erase','Remove'],['restore','Restore']],()=>{}),range('Colour tolerance',S.magic,'tol',4,120,1,'',()=>{}),...brush());break;
    case'hair':add(hint('Paint over wispy edges. Alpha is re-estimated from the local subject and background colours. Works best where hair contrasts with the background.'),
      range('Detail strength',S.hair,'strength',10,100,1,'%',()=>{}),...brush());break;
    case'edge':add(hint('Applied live on top of the mask; the mask itself is not changed.'),
      range('Feather',S.edge,'feather',0,30,.5,' px'),range('Shift edge (− in / + out)',S.edge,'shift',-6,6,1,''),
      btn('Show mask',()=>setView('mask')),btn('Reset edge settings',()=>{S.edge={feather:0,shift:0};re()}));
      if(!canFilter)add(hint('This browser does not support canvas filters, so feather and shift are unavailable.'));break;
    case'select':add(hint('Click an area of the image to remove or keep everything connected to it with a similar colour.'),
      seg('Action',S.select,'action',[['remove','Remove'],['keep','Keep']],()=>{}),range('Colour tolerance',S.select,'tol',2,120,1,'',()=>{}));break;
    case'bg':{const b=S.bg;add(seg('Type',b,'type',[['none','None'],['color','Colour'],['gradient','Gradient'],['image','Image'],['blur','Blur']],re));
      if(b.type==='color'){const sw=h('div',{class:'sw'});['#ffffff','#f3f4f6','#e9e2d8','#dbe7ff','#111317','#1f8a5b','#d9482b'].forEach(c=>sw.append(h('button',{style:'background:'+c,'aria-label':'Use '+c,onclick:()=>{b.color=c;re()}})));add(color('Colour',b,'color'),sw)}
      if(b.type==='gradient'){const sw=h('div',{class:'sw'});[['Studio grey','#f1f2f4','#b9bec6'],['Soft white','#ffffff','#e6e8ec'],['Warm sand','#f3e9dc','#d9c3a5'],['Graphite','#3a3f47','#15171a']]
        .forEach(([n,c1,c2])=>sw.append(h('button',{style:`background:linear-gradient(180deg,${c1},${c2})`,'data-tip':n,'aria-label':n,onclick:()=>{b.c1=c1;b.c2=c2;b.angle=180;re()}})));
        add(sub('Studio presets'),sw,color('From',b,'c1'),color('To',b,'c2'),range('Angle',b,'angle',0,360,5,'°'))}
      if(b.type==='image')add(btn(b.img?'Replace background image':'Upload background image',()=>$('#bgfile').click()),hint('The image is scaled to cover the canvas.'));
      if(b.type==='blur')add(range('Blur amount',b,'blur',2,80,1,''));
      add(sub('Subject'),range('Scale',S.sub,'scale',10,200,1,'%'),range('Horizontal',S.sub,'x',-100,100,1,'%'),range('Vertical',S.sub,'y',-100,100,1,'%'),btn('Reset position',()=>{S.sub={scale:100,x:0,y:0,rot:0,pv:null};re()}));break}
    case'shadow':add(check('Drop shadow',S.shadow,'on',re));
      if(S.shadow.on)add(range('Opacity',S.shadow,'opacity',0,100,1,'%'),range('Blur',S.shadow,'blur',0,100,1,''),range('Distance',S.shadow,'dist',0,120,1,''),range('Direction',S.shadow,'angle',0,360,5,'°'));
      if(!canFilter)add(hint('This browser does not support canvas filters, so shadows are unavailable.'));break;
    case'crop':add(hint('Drag on the canvas to draw the crop area.'),hint(cropDraft?`Selection: ${cropDraft.w} × ${cropDraft.h} px`:`Current: ${doc.crop.w} × ${doc.crop.h} px`),
      btn('Apply crop',()=>{pushHist();doc.crop=cropDraft;cropDraft=null;updInfo();buildProps();redraw()},'primary',!cropDraft),
      btn('Reset crop',()=>{pushHist();doc.crop={x:0,y:0,w:doc.w,h:doc.h};cropDraft=null;updInfo();buildProps();redraw()}));break;
  }
}

/* ---------- export ---------- */
function encodeTIFF(img){ // uncompressed 8-bit RGBA
  const{width:w,height:hh,data}=img,tags=[[256,4,w],[257,4,hh],[258,3,0],[259,3,1],[262,3,2],[273,4,0],[277,3,4],[278,4,hh],[279,4,data.length],[338,3,2]];
  const bps=8+2+tags.length*12+4,off=bps+8,buf=new ArrayBuffer(off+data.length),dv=new DataView(buf);
  dv.setUint16(0,0x4949,true);dv.setUint16(2,42,true);dv.setUint32(4,8,true);dv.setUint16(8,tags.length,true);
  tags.forEach(([tag,type,val],i)=>{const o=10+i*12;dv.setUint16(o,tag,true);dv.setUint16(o+2,type,true);dv.setUint32(o+4,tag===258?4:1,true);
    if(tag===258)dv.setUint32(o+8,bps,true);else if(tag===273)dv.setUint32(o+8,off,true);else if(type===3)dv.setUint16(o+8,val,true);else dv.setUint32(o+8,val,true)});
  for(let i=0;i<4;i++)dv.setUint16(bps+i*2,8,true);
  new Uint8Array(buf,off).set(data);return buf}
// Can the SVG be saved as the original vector? (only if nothing was edited)
const plainSub=u=>u.scale===100&&!u.x&&!u.y&&!u.rot;
function vectorOK(){const c=doc.crop;return!!doc.svg&&!hist.length&&!doc.paint&&!doc.texts.length&&S.bg.type==='none'&&!S.shadow.on&&plainSub(S.sub)&&!S.edge.feather&&!S.edge.shift&&!c.x&&!c.y&&c.w===doc.w&&c.h===doc.h}
async function exportCanvas(){const c=doc.crop,ow=X.custom?X.w:c.w,oh=X.custom?X.h:c.h;let src=comp,K=1,tmp=[];
  // When enlarging an SVG source, re-render it from the vector (up to 40 MP)
  const want=doc.svg&&ow>c.w*1.01?Math.min(ow/c.w,Math.sqrt(40e6/(doc.w*doc.h))):1;
  if(want>1.01){const W=Math.round(doc.w*want),H=Math.round(doc.h*want);K=W/doc.w;
    const hi=await rasterSVG(doc.svg,W,H),o2=mk(W,H),c2=mk(W,H),s2=mk(W,H);tmp=[hi,o2,c2,s2];
    compose({src:hi,K,out:o2,cut:c2,sil:s2});src=o2}
  else{compose();compDirty=false}
  const out=mk(ow,oh),o=out.getContext('2d');
  if(X.fmt==='jpg'){o.fillStyle=S.bg.type==='none'?X.matte:'#ffffff';o.fillRect(0,0,ow,oh)}
  o.imageSmoothingQuality='high';o.drawImage(src,c.x*K,c.y*K,c.w*K,c.h*K,0,0,ow,oh);tmp.forEach(freeCanvas);return out}
function blobToDataURL(b){return new Promise((r,j)=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=j;f.readAsDataURL(b)})}
async function encode(){
  if(X.fmt==='svg'&&vectorOK())return new Blob([sizedSVG(doc.svg,X.custom?X.w:doc.w,X.custom?X.h:doc.h)],{type:'image/svg+xml'});  // original vector
  const out=await exportCanvas();
  if(X.fmt==='svg'){const W=out.width,H=out.height; // PNG embedded in SVG: keeps transparency, opens everywhere
    return new Promise(r=>out.toBlob(b=>{freeCanvas(out);r(b)},'image/png')).then(async b=>b&&new Blob([
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><image width="${W}" height="${H}" xlink:href="${await blobToDataURL(b)}"/></svg>`],{type:'image/svg+xml'}))}
  if(X.fmt==='tiff'){const b=new Blob([encodeTIFF(out.getContext('2d').getImageData(0,0,out.width,out.height))],{type:'image/tiff'});freeCanvas(out);return Promise.resolve(b)}
  return new Promise(r=>out.toBlob(b=>{freeCanvas(out);r(b)},{png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[X.fmt],X.q/100))}
let estT=0;
function est(){const el=$('#est');if(!el)return;el.textContent='Calculating file size…';clearTimeout(estT);
  estT=setTimeout(async()=>{const b=await encode(),e2=$('#est');if(e2&&b)e2.textContent=`${X.custom?X.w:doc.crop.w} × ${X.custom?X.h:doc.crop.h} px · about ${fmtSize(b.size)}`},350)}
function buildExport(){
  const d=$('#exportBody'),c=doc.crop,re=()=>buildExport();d.replaceChildren(
    seg('Format',X,'fmt',[['png','PNG'],['jpg','JPG'],['webp','WebP'],['tiff','TIFF'],['svg','SVG']],re),
    seg('Size',X,'custom',[[false,'Original'],[true,'Custom']],re));
  if(X.custom){const wi=h('input',{type:'number',min:1,max:16000,value:X.w,'aria-label':'Width',oninput:()=>{X.w=clamp(+wi.value||1,1,16000);if(X.lock){X.h=Math.max(1,Math.round(X.w*c.h/c.w));hi.value=X.h}est()}}),
      hi=h('input',{type:'number',min:1,max:16000,value:X.h,'aria-label':'Height',oninput:()=>{X.h=clamp(+hi.value||1,1,16000);if(X.lock){X.w=Math.max(1,Math.round(X.h*c.w/c.h));wi.value=X.w}est()}}),
      setW=w=>{X.w=w;X.h=Math.max(1,Math.round(w*c.h/c.w));re()},
      presets=h('div',{class:'wseg row',role:'group','aria-label':'Width presets'},[['50%',Math.max(1,Math.round(c.w/2))],['1080 px',1080],['1920 px',1920],['3840 px',3840]].map(([t,w])=>h('button',{type:'button',onclick:()=>setW(w)},t)));
    d.append(h('div',{class:'dims'},wi,'×',hi),presets,check('Maintain aspect ratio',X,'lock',()=>{}))}
  if(X.fmt==='jpg'||X.fmt==='webp')d.append(range('Quality',X,'q',50,100,1,'',est));
  if(X.fmt==='webp')d.append(hint('In Chrome and Edge, quality 100 is lossless.'));
  if(X.fmt==='jpg'&&S.bg.type==='none')d.append(color('Fill colour (JPG has no transparency)',X,'matte',est));
  if(X.fmt==='png'||X.fmt==='tiff')d.append(hint('Lossless, with a real alpha channel when the background is set to None.'));
  if(X.fmt==='svg')d.append(hint(vectorOK()?'Vector preserved: this SVG stays sharp at any size.':'An SVG file with your image inside, transparency included. Opens in browsers, Illustrator, Figma and Canva. The image keeps its pixels; it is not converted to vector shapes.'));
  else if(doc.svg)d.append(hint('Vector source: a larger custom size is rendered fresh from the SVG, so it stays sharp.'));
  d.append(h('p',{class:'hint',id:'est'}));est()}
function openExport(){if(!doc)return toast('Open an image first.');X.w=doc.crop.w;X.h=doc.crop.h;buildExport();$('#exportDlg').showModal()}
const SLUG=document.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'edited';
async function doExport(){const b=await encode();if(!b)return toast('Export failed. The image may be too large.');
  let ext=X.fmt;if(X.fmt==='webp'&&b.type!=='image/webp'){ext='png';toast('WebP could not be encoded, so a PNG was saved instead.')}
  const name=`${doc.name}-${SLUG}.${ext}`;
  if(window.pywebview?.api?.choose_save){ // app window: use the Windows "Save As" dialog
    try{const token=await window.pywebview.api.choose_save(name);if(!token)return;
      const r=await fetch('/save?token='+encodeURIComponent(token),{method:'POST',body:b});
      if(!r.ok)throw new Error(await r.text());$('#exportDlg').close();toast('Saved: '+await r.text())}
    catch(err){toast('Could not save the file: '+(err&&err.message||err))}
    return}
  const a=h('a',{href:URL.createObjectURL(b),download:name});a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);$('#exportDlg').close()}

/* ---------- wiring ---------- */
$('#bOpen').onclick=$('#bBrowse').onclick=()=>$('#file').click();
$('#file').onchange=e=>{loadFile(e.target.files[0]);e.target.value=''};
$('#bgfile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const nb=await decodeImage(f);S.bg.img?.close?.();S.bg.img=nb;S.bg.type='image';buildProps();render()}catch{toast('That background image could not be decoded.')}};
$('#bUndo').onclick=undo;$('#bRedo').onclick=redo;$('#bExport').onclick=openExport;
$('#xCancel').onclick=()=>$('#exportDlg').close();$('#xGo').onclick=doExport;
$('#bKeys').onclick=()=>$('#keysDlg').showModal();$('#kClose').onclick=()=>$('#keysDlg').close();
$('#zIn').onclick=()=>zoomC(V.z*1.25);$('#zOut').onclick=()=>zoomC(V.z*.8);$('#zl').onclick=()=>zoomC(1);$('#zFit').onclick=fit;
const drop=$('#drop');
stage.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('over')});
stage.addEventListener('dragleave',()=>drop.classList.remove('over'));
stage.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('over');loadFile(e.dataTransfer.files[0])});
addEventListener('paste',e=>{const f=[...(e.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));if(f)loadFile(f)});
$('#props').addEventListener('pointerdown',e=>{if(S.tool==='text'&&curText()&&e.target.closest('input,select,.wseg button,.sw button'))pushHist()},true);
view.addEventListener('dblclick',()=>{if(S.tool==='text'&&curText())$('#tTxt')?.focus()});
$('#bVip').onclick=()=>$('#vipDlg').showModal();$('#vipClose').onclick=()=>$('#vipDlg').close();
$('#vipDlg').addEventListener('click',e=>{if(e.target===e.currentTarget)$('#vipDlg').close()});   // click outside to close
$('#cCancel').onclick=()=>$('#closeDlg').close();
$('#cGo').onclick=()=>{$('#closeDlg').close();if(closing>=0)closeTab(closing);closing=-1};
tabs=[blankTab()];loadTab(0);
setTool('auto');

/* ---------- startup ---------- */
loadModels(true);
