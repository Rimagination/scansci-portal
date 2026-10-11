// Real publication previews. Only small rendered thumbnails persist in IndexedDB.
const thumbnails = new Map(), pending = new Map(), queue = [];
let active = 0, observer, pdfLibrary, database;
const TTL = 7 * 86400000, WIDTH = 560, HEIGHT = 350;
const here = new URL('./', import.meta.url);

function db() {
  return database ||= new Promise(resolve => {
    const request = indexedDB.open('scansci-reader-media-v1',1);
    request.onupgradeneeded = () => request.result.createObjectStore('thumbnails',{keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  }).catch(()=>null);
}

async function stored(id) {
  const connection=await db(); if(!connection) return null;
  return new Promise(resolve=>{
    const request=connection.transaction('thumbnails').objectStore('thumbnails').get(id);
    request.onsuccess=()=>resolve(request.result?.expires>Date.now()?request.result:null);
    request.onerror=()=>resolve(null);
  }).catch(()=>null);
}

async function save(entry) {
  const connection=await db(); if(!connection) return;
  try {
    const transaction=connection.transaction('thumbnails','readwrite'), store=transaction.objectStore('thumbnails');
    store.put(entry);
    const request=store.getAll();
    request.onsuccess=()=>{
      const entries=request.result.sort((a,b)=>b.expires-a.expires);
      entries.forEach((item,index)=>{if(index>=200 || item.expires<Date.now()) store.delete(item.id);});
    };
  } catch { /* Storage restrictions must not prevent reading. */ }
}

async function smallImage(blob, kind, source, license, provider) {
  const bitmap=await createImageBitmap(blob);
  try {
    if(bitmap.width<120 || bitmap.height<80) throw new Error('image_too_small');
    const canvas=document.createElement('canvas'); canvas.width=WIDTH; canvas.height=HEIGHT;
    const context=canvas.getContext('2d'); context.fillStyle='#fff'; context.fillRect(0,0,WIDTH,HEIGHT);
    const scale=Math.min(WIDTH/bitmap.width,HEIGHT/bitmap.height);
    context.drawImage(bitmap,(WIDTH-bitmap.width*scale)/2,(HEIGHT-bitmap.height*scale)/2,bitmap.width*scale,bitmap.height*scale);
    const thumbnail=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.85));
    if(!thumbnail) throw new Error('image_render_failed');
    return {blob:thumbnail,kind,source,license,provider};
  } finally { bitmap.close(); }
}

async function pdfImage(blob, source, license, provider) {
  const library=await (pdfLibrary ||= import(new URL('vendor/pdfjs/pdf.mjs',here)).then(library=>{
    library.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.mjs',here).href; return library;
  }));
  const task=library.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false,enableXfa:false,cMapUrl:new URL('vendor/pdfjs/cmaps/',here).href,cMapPacked:true,standardFontDataUrl:new URL('vendor/pdfjs/standard_fonts/',here).href,wasmUrl:new URL('vendor/pdfjs/wasm/',here).href});
  try {
    const documentPdf=await task.promise, first=await documentPdf.getPage(1);
    const viewport=first.getViewport({scale:WIDTH/first.getViewport({scale:1}).width});
    const canvas=document.createElement('canvas'); canvas.width=WIDTH; canvas.height=HEIGHT;
    await first.render({canvasContext:canvas.getContext('2d'),viewport,background:'#ffffff'}).promise;
    const thumbnail=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.85));
    if(!thumbnail) throw new Error('pdf_render_failed');
    return {blob:thumbnail,kind:'pdf',source,license,provider};
  } finally { await task.destroy(); }
}

function identifier(paper) {
  if(paper.doi) return new URLSearchParams({doi:paper.doi});
  const arxiv=(paper.fullTextUrl || paper.doiUrl || '').match(/^https:\/\/(?:export\.)?arxiv\.org\/(?:abs|pdf)\/([^?#]+?)(?:\.pdf)?$/i);
  return arxiv ? new URLSearchParams({arxiv:arxiv[1]}) : null;
}

async function fetchBlob(params, asset, index) {
  const query=new URLSearchParams(params); query.set('asset',asset); query.set('index',String(index));
  const response=await fetch(`/api/reader/media?${query}`,{signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw new Error('media_unavailable');
  return response.blob();
}

async function preview(paper, canUseOpenAlex, context) {
  const cached=thumbnails.get(paper.id);
  if(cached?.expires>Date.now() && (cached.blob || cached.context===context)) return cached;
  const pendingKey=paper.id+'|'+context;
  if(pending.has(pendingKey)) return pending.get(pendingKey);
  const job=(async()=>{
    const local=await stored(paper.id); if(local && (local.blob || local.context===context)) return local;
    const params=identifier(paper); if(!params) return null;
    let sources={};
    try {
      const response=await fetch(`/api/reader/media?${params}`,{signal:AbortSignal.timeout(30000)});
      if(response.ok) sources=await response.json();
    } catch { /* Account-backed PDFs can still be available when a public source times out. */ }
    let result;
    for(let i=0;i<(sources.images || []).length;i++) {
      const image=sources.images[i];
      try { result=await smallImage(await fetchBlob(params,'image',i),image.kind,image.source,sources.license,image.provider); break; } catch {}
    }
    if(!result) for(let i=0;i<(sources.pdfs || []).length;i++) {
      try { result=await pdfImage(await fetchBlob(params,'pdf',i),sources.pdfs[i].source,sources.license,sources.pdfs[i].provider); break; } catch {}
    }
    if(!result && paper.doi && canUseOpenAlex()) {
      try {
        const response=await fetch('/api/reader/openalex',{method:'POST',credentials:'include',signal:AbortSignal.timeout(25000),headers:{'Content-Type':'application/json'},body:JSON.stringify({path:'/pdf',params:{doi:paper.doi}})});
        if(response.ok) result=await pdfImage(await response.blob(),paper.doiUrl,paper.license || '');
      } catch {}
    }
    const entry={...result,id:paper.id,context,expires:Date.now()+(result?TTL:300000)};
    await save(entry); return entry;
  })().catch(()=>({id:paper.id,context,expires:Date.now()+60000})).then(entry=>{
    if(entry) {
      entry.url=entry.blob?URL.createObjectURL(entry.blob):'';
      if(thumbnails.get(paper.id)?.url) URL.revokeObjectURL(thumbnails.get(paper.id).url);
      thumbnails.set(paper.id,entry);
      while(thumbnails.size>200) { const first=thumbnails.keys().next().value; URL.revokeObjectURL(thumbnails.get(first).url); thumbnails.delete(first); }
    }
    return entry;
  }).finally(()=>pending.delete(pendingKey));
  pending.set(pendingKey,job); return job;
}

function show(node, result, paper) {
  if(!node.isConnected || !result?.url) return;
  const image=new Image(); image.alt=`${paper.title} · ${result.kind==='pdf'?'PDF 首页':'论文配图'}`;
  image.decoding='async'; image.src=result.url;
  node.dataset.kind=result.kind;
  node.title=result.kind==='graphical-abstract'?'图文摘要':result.kind==='pdf'?'PDF 首页':'论文配图';
  node.replaceChildren(image);
  if(result.provider) {
    const credit=document.createElement('span'); credit.className='paper-cover-credit';
    credit.textContent=result.provider; credit.title=result.license || '';
    node.append(credit);
  }
  node.hidden=false;
}

function drain() {
  while(active<2 && queue.length) {
    const {node,paper,canUseOpenAlex,context}=queue.shift();
    if(!node.isConnected) continue;
    active++;
    preview(paper,canUseOpenAlex,context).then(result=>show(node,result,paper)).finally(()=>{active--;drain();});
  }
}

export function observe(root, getPaper, canUseOpenAlex=()=>false, context='public') {
  observer?.disconnect(); queue.length=0;
  if(matchMedia('(max-width:680px)').matches) return;
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries) if(entry.isIntersecting) {
      observer.unobserve(entry.target);
      const node=entry.target.querySelector('.paper-cover');
      const paper=getPaper(entry.target.dataset.paper);
      if(node && paper && !entry.target.closest('.scientist-works')) queue.push({node,paper,canUseOpenAlex,context});
    }
    drain();
  },{rootMargin:'120px'});
  root.querySelectorAll('.paper-card[data-paper]').forEach(card=>{
    const result=thumbnails.get(card.dataset.paper);
    const paper=getPaper(card.dataset.paper);
    if(result?.url && result.expires>Date.now() && paper) show(card.querySelector('.paper-cover'),result,paper);
    else observer.observe(card);
  });
}
