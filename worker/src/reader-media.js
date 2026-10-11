// Sources are resolved from publication identifiers; this is not an arbitrary URL proxy.
const PUBLISHERS = ['link.springer.com', 'link.springernature.com', 'www.nature.com', 'nature.com', 'www.sciencedirect.com', 'www.cell.com', 'onlinelibrary.wiley.com', 'pubs.acs.org', 'pubs.rsc.org', 'academic.oup.com', 'journals.plos.org', 'www.frontiersin.org', 'www.mdpi.com', 'elifesciences.org', 'www.science.org', 'www.pnas.org', 'www.tandfonline.com'];
const PMC_BUCKET = 'https://pmc-oa-opendata.s3.amazonaws.com/';
const ASSETS = [...PUBLISHERS, 'media.springernature.com', 'ars.els-cdn.com', 'cdn.ncbi.nlm.nih.gov', 'pmc.ncbi.nlm.nih.gov', 'pmc-oa-opendata.s3.amazonaws.com', 'www.ebi.ac.uk', 'europepmc.org', 'arxiv.org', 'export.arxiv.org', 'www.biorxiv.org', 'www.medrxiv.org', 'mdpi-res.com', 'www.mdpi-res.com', 'public-pages-files-2025.frontiersin.org', 'public-pages-files-2026.frontiersin.org', 'onlinelibrary.wiley.com'];
const API_HOSTS = ['api.crossref.org', 'api.unpaywall.org', 'www.ebi.ac.uk', 'doi.org', 'pmc-oa-opendata.s3.amazonaws.com'];
const memo = new Map();
const inflight = new Map();
const JSON_LIMIT = 2 * 1024 * 1024;
const HTML_LIMIT = 2 * 1024 * 1024;
export const PDF_LIMIT = 20 * 1024 * 1024;

export function mediaUrl(raw, base, hosts = ASSETS) {
  try {
    const url = new URL(raw, base);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.includes(url.hostname)) return '';
    if (url.href.length > 2048) return '';
    return url.href;
  } catch { return ''; }
}

export async function readMediaBytes(response, limit) {
  if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); throw new Error('media_too_large'); }
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('media_too_large');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel(); throw error; }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

async function remote(raw, accept, fetcher, hosts = ASSETS) {
  let url = mediaUrl(raw, undefined, hosts);
  const signal = AbortSignal.timeout(accept === 'application/pdf' ? 15000 : 6500);
  for (let hop = 0; url && hop < (accept === 'text/html,application/xhtml+xml' ? 7 : 5); hop++) {
    const response = await fetcher(url, {redirect:'manual', signal, headers:{Accept:accept, 'User-Agent':'ScanSci-Reader/1.0 (+https://www.scansci.com/reader/)'}, cf:new URL(url).hostname === 'idp.springer.com' ? {cacheTtl:0, cacheEverything:false} : {cacheTtl:86400, cacheEverything:true}});
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location'); await response.body?.cancel();
      url = location ? mediaUrl(location, url, hosts) : ''; continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error('source_unavailable'); }
    return {response, url};
  }
  throw new Error('source_unavailable');
}

async function remoteJson(url, fetcher) {
  const {response} = await remote(url, 'application/json', fetcher, API_HOSTS);
  return JSON.parse(new TextDecoder().decode(await readMediaBytes(response, JSON_LIMIT)));
}

function decode(value) {
  return String(value || '').replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const named = {'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const number = entity[2].toLowerCase()==='x' ? parseInt(entity.slice(3,-1),16) : Number(entity.slice(2,-1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
  });
}

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+))/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4])]));
}

export function publisherMedia(html, sourceUrl, expectedDoi = '') {
  const images = [], pdfs = [], authors = [], correspondents = [];
  let pageDoi = '', author;
  // ponytail: a bounded HTML scan covers semantic figures; new publishers can add adapters here.
  for (const match of html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure\s*>/gi)) {
    const figure = match[0];
    const kind = /graphical[\s_-]*abstract|visual[\s_-]*abstract/i.test(figure) ? 'graphical-abstract' : 'figure';
    for (const image of figure.matchAll(/<img\b[^>]*>/gi)) {
      const a = attrs(image[0]);
      const url = mediaUrl(a['data-src'] || a.src || (a.srcset || '').split(',').at(-1)?.trim().split(/\s+/)[0], sourceUrl);
      if (url && !/logo|avatar|icon|badge/i.test([a.alt,a.class,url].join(' '))) images.push({url,kind,source:sourceUrl});
    }
  }
  // ScienceDirect and some journals put the graphical abstract outside a <figure>.
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const a = attrs(match[0]);
    if (!/graphical[\s_-]*abstract|visual[\s_-]*abstract|\bga1\b/i.test([a.alt,a.class,a.src,a['data-src']].join(' '))) continue;
    const url = mediaUrl(a['data-src'] || a.src, sourceUrl);
    if (url) images.push({url,kind:'graphical-abstract',source:sourceUrl});
  }
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(match[0]);
    if (a.name === 'citation_pdf_url') { const url = mediaUrl(a.content, sourceUrl); if (url) pdfs.push({url,source:sourceUrl}); }
    if (a.name === 'citation_doi') pageDoi = String(a.content || '').replace(/^https?:\/\/doi\.org\//i, '').trim().toLowerCase();
    if (a.name === 'citation_author') { author = {name: a.content || '', affiliations: []}; authors.push(author); }
    if (a.name === 'citation_author_email' && author) author.email = String(a.content || '').trim().toLowerCase();
    if (a.name === 'citation_author_institution' && author && a.content) author.affiliations.push(a.content.trim().slice(0, 600));
  }
  // Only explicit correspondence links on a page declaring the requested DOI identify corresponding authors.
  if (expectedDoi && pageDoi === expectedDoi.toLowerCase()) for (const match of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi)) {
    const a = attrs(match[0].slice(0, match[0].indexOf('>') + 1));
    if (!/^corresp(?:[-_]|$)/i.test(a.id || '') || !/^mailto:/i.test(a.href || '')) continue;
    correspondents.push({name: decode(match[0].replace(/<[^>]*>/g, '')).trim(), email: a.href.slice(7).split('?')[0].toLowerCase()});
  }
  const nameKey = name => String(name).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).sort().join(' ');
  const institutions = new Map();
  for (const person of correspondents) {
    const emailMatches = authors.filter(author => author.email && author.email === person.email);
    const matches = emailMatches.length ? emailMatches : authors.filter(author => nameKey(author.name) === nameKey(person.name));
    if (matches.length !== 1) continue;
    for (const affiliation of matches[0].affiliations) {
      // ponytail: comma-separated publisher affiliations supply the display name; use a verified ROR when upstream provides one.
      const name = affiliation.split(/\s*[,;]\s*/).find(part => /\b(university|université|college|institute|academy)\b|大学|学院|研究院|研究所/iu.test(part)) || affiliation;
      const id = `publisher:${nameKey(name)}`;
      institutions.set(id, {id, name, affiliation, source: sourceUrl});
    }
  }
  images.sort((a,b) => Number(b.kind==='graphical-abstract')-Number(a.kind==='graphical-abstract'));
  return {images:[...new Map(images.map(x=>[x.url,x])).values()].slice(0,4),pdfs,correspondingInstitutions:[...institutions.values()].slice(0,16)};
}

async function pmcMedia(article, doi, fetcher) {
  if (!/^PMC\d+$/.test(article?.pmcid || '') || article.isOpenAccess !== 'Y') return {images:[],pdfs:[]};
  try {
    // PMC's versioned public bucket includes actual file URLs; never guess a figure's filename.
    const {response} = await remote(`${PMC_BUCKET}?${new URLSearchParams({'list-type':'2',prefix:article.pmcid+'.',delimiter:'/', 'max-keys':'20'})}`,'application/xml',fetcher);
    const listing=new TextDecoder().decode(await readMediaBytes(response,HTML_LIMIT));
    const prefixes=[...listing.matchAll(/<CommonPrefixes>\s*<Prefix>(PMC\d+\.\d+\/)\s*<\/Prefix>/g)].map(m=>m[1]).filter(prefix=>prefix.startsWith(article.pmcid+'.')).slice(0,3);
    const versions=await Promise.allSettled(prefixes.map(prefix=>remoteJson(`${PMC_BUCKET}${prefix}${prefix.slice(0,-1)}.json`,fetcher)));
    const usable=versions.filter(x=>x.status==='fulfilled').map(x=>x.value).filter(x=>String(x.doi || '').toLowerCase()===doi && /^CC[ -]|^CC0$/i.test(x.license_code || '') && !x.is_retracted);
    const record=usable.find(x=>!x.is_manuscript) || usable[0];
    if(!record) return {images:[],pdfs:[]};
    const source=`https://pmc.ncbi.nlm.nih.gov/articles/${article.pmcid}/`;
    const asset=raw=>mediaUrl(String(raw || '').replace(/^s3:\/\/pmc-oa-opendata\//,PMC_BUCKET),undefined,['pmc-oa-opendata.s3.amazonaws.com']);
    const files=(record.media_urls || []).map(asset).filter(url=>url && /\.(png|jpe?g|gif|webp)(?:\?|$)/i.test(url));
    const xmlUrl=asset(record.xml_url); const images=[];
    if(xmlUrl) {
      const {response}=await remote(xmlUrl,'application/xml',fetcher);
      const xml=new TextDecoder().decode(await readMediaBytes(response,HTML_LIMIT));
      for(const match of xml.matchAll(/<(fig|abstract)\b[^>]*>[\s\S]*?<\/\1>/gi)) for(const graphic of match[0].matchAll(/<graphic\b[^>]*>/gi)) {
        const file=attrs(graphic[0])['xlink:href'];
        if(!file || !/^[\w.-]+$/.test(file)) continue;
        const url=files.find(url=>decodeURIComponent(new URL(url).pathname.split('/').at(-1)).replace(/\.(png|jpe?g|gif|webp)$/i,'')===file.replace(/\.(png|jpe?g|gif|webp)$/i,''));
        if(url) images.push({url,kind:match[1].toLowerCase()==='abstract'?'graphical-abstract':'figure',source,provider:'NLM/PMC'});
      }
    }
    const pdf=asset(record.pdf_url);
    return {images:[...new Map(images.map(x=>[x.url,x])).values()].slice(0,4),pdfs:pdf?[{url:pdf,source,provider:'NLM/PMC'}]:[],license:record.license_code};
  } catch { return {images:[],pdfs:[]}; }
}

async function resolveSources(doi, arxiv, env, fetcher) {
  arxiv ||= doi.match(/^10\.48550\/arxiv\.(.+)$/i)?.[1] || '';
  if (arxiv) return {images:[],pdfs:[{url:`https://arxiv.org/pdf/${arxiv}`,source:`https://arxiv.org/abs/${arxiv}`}],license:''};
  const [crossref, pmc, unpaywall] = await Promise.allSettled([
    remoteJson(`https://api.crossref.org/works/${encodeURIComponent(doi)}`,fetcher),
    remoteJson(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?${new URLSearchParams({query:`DOI:"${doi}"`,format:'json',resultType:'core',pageSize:'1'})}`,fetcher),
    // Unpaywall requires a configured contact email; do not invent the user's identity.
    env.READER_UNPAYWALL_EMAIL ? remoteJson(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(env.READER_UNPAYWALL_EMAIL)}`,fetcher) : Promise.resolve(null),
  ]);
  const work = crossref.status === 'fulfilled' ? crossref.value.message || {} : {};
  const article = pmc.status === 'fulfilled' ? pmc.value.resultList?.result?.find(x=>String(x.doi || '').toLowerCase()===doi) : null;
  const oa = unpaywall.status === 'fulfilled' ? unpaywall.value?.best_oa_location : null;
  let license = oa?.license || article?.license || work.license?.find(x=>/creativecommons\.org/.test(x.URL || ''))?.URL || '';
  const pdfs = (work.link || []).filter(x=>/pdf/i.test([x['content-type'],x.URL].join(' '))).map(x=>({url:mediaUrl(x.URL),source:`https://doi.org/${doi}`})).filter(x=>x.url);
  if (oa?.url_for_pdf) { const url=mediaUrl(oa.url_for_pdf); if(url) pdfs.unshift({url,source:oa.url_for_landing_page || `https://doi.org/${doi}`}); }
  const publisher = (async () => {
    try {
      // Springer public metadata can require six anonymous redirects through its cookie gateway.
      const {response,url} = await remote(`https://doi.org/${doi.split('/').map(encodeURIComponent).join('/')}`, 'text/html,application/xhtml+xml',fetcher,['doi.org',...PUBLISHERS,'idp.springer.com']);
      if (!/text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type') || '')) { await response.body?.cancel(); return {images:[],pdfs:[]}; }
      const source=new URL(url);
      if(source.hostname==='link.springer.com' && source.searchParams.get('error')==='cookies_not_supported') { source.searchParams.delete('error'); source.searchParams.delete('code'); }
      return publisherMedia(new TextDecoder().decode(await readMediaBytes(response,HTML_LIMIT)),source.href,doi);
    } catch { return {images:[],pdfs:[]}; }
  })();
  const [page, pmcFiles] = await Promise.all([publisher,pmcMedia(article,doi,fetcher)]);
  const images=[...page.images,...pmcFiles.images];
  license ||= pmcFiles.license || '';
  images.sort((a,b)=>Number(b.kind==='graphical-abstract')-Number(a.kind==='graphical-abstract'));
  return {images:[...new Map(images.map(x=>[x.url,x])).values()].slice(0,6),pdfs:[...new Map([...page.pdfs,...pmcFiles.pdfs,...pdfs].map(x=>[x.url,x])).values()].slice(0,4),license,correspondingInstitutions:page.correspondingInstitutions || []};
}

async function sources(key, doi, arxiv, env, fetcher) {
  const cached = memo.get(key);
  if (cached?.expires > Date.now()) return cached.value;
  if (inflight.has(key)) return inflight.get(key);
  const job = resolveSources(doi,arxiv,env,fetcher).then(value=>{
    memo.set(key,{value,expires:Date.now()+(value.correspondingInstitutions?.length ? 86400000 : 60000)});
    while(memo.size>200) memo.delete(memo.keys().next().value);
    return value;
  }).finally(()=>inflight.delete(key));
  inflight.set(key,job); return job;
}

export async function getReaderMedia(request, env = {}, fetcher = fetch) {
  const params = new URL(request.url).searchParams;
  const doi=String(params.get('doi') || '').trim().toLowerCase(), arxiv=String(params.get('arxiv') || '').trim();
  const asset=params.get('asset') || '', rawIndex=params.get('index') || '0';
  if ((doi && arxiv) || (!/^10\.\d{4,9}\/[^\s\x00-\x1f"<>]{1,240}$/.test(doi) && !/^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z]{2})?\/\d{7})(?:v\d+)?$/i.test(arxiv)) || !['','image','pdf'].includes(asset) || !/^\d$/.test(rawIndex) || [...params.keys()].some(k=>!['doi','arxiv','asset','index'].includes(k))) {
    return new Response(JSON.stringify({ok:false,error:'invalid_identifier'}),{status:400,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
  const key=doi || `arxiv:${arxiv}`;
  const cache = globalThis.caches?.default;
  const cacheKey = new Request(`https://www.scansci.com/api/reader/media?${new URLSearchParams({id:key,asset,index:rawIndex,...(!asset ? {schema:'2'} : {})})}`);
  const hit=await cache?.match(cacheKey); if(hit) return hit;
  try {
    const resolved=await sources(key,doi,arxiv,env,fetcher);
    let response;
    if (!asset) {
      response=new Response(JSON.stringify({ok:true,...resolved}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=${resolved.correspondingInstitutions?.length ? 86400 : 60}`}});
    } else {
      const entry=(asset==='image'?resolved.images:resolved.pdfs)[Number(rawIndex)];
      if(!entry) return new Response(null,{status:404,headers:{'Cache-Control':'public, max-age=300'}});
      const {response:upstream}=await remote(entry.url,asset==='image'?'image/png,image/jpeg,image/webp,image/avif,image/gif':'application/pdf',fetcher);
      let type=(upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const binary=['application/octet-stream','binary/octet-stream'].includes(type);
      if (asset==='image' && !binary && !['image/png','image/jpeg','image/webp','image/avif','image/gif'].includes(type)) { await upstream.body?.cancel(); throw new Error('not_an_image'); }
      const bytes=await readMediaBytes(upstream,asset==='image'?4*1024*1024:PDF_LIMIT);
      // PMC stores figures as octet-stream. Only recognized raster signatures get an image MIME type.
      if(asset==='image' && binary) {
        const head=new TextDecoder().decode(bytes.slice(0,32));
        type=bytes[0]===255 && bytes[1]===216 && bytes[2]===255 ? 'image/jpeg' :
          bytes[0]===137 && head.slice(1,4)==='PNG' ? 'image/png' :
          /^GIF8[79]a/.test(head) ? 'image/gif' :
          head.startsWith('RIFF') && head.slice(8,12)==='WEBP' ? 'image/webp' :
          /^....ftyp(?:avif|avis)/s.test(head) ? 'image/avif' : '';
        if(!type) throw new Error('not_an_image');
      }
      if (asset==='pdf' && !new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-')) throw new Error('not_a_pdf');
      response=new Response(bytes,{headers:{'Content-Type':asset==='pdf'?'application/pdf':type,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
    }
    if(cache) await cache.put(cacheKey,response.clone());
    return response;
  } catch { return new Response(JSON.stringify({ok:false,error:'media_unavailable'}),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}); }
}
