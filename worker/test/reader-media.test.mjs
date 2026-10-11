import test from 'node:test';
import assert from 'node:assert/strict';
import {getReaderMedia, mediaUrl, publisherMedia, readMediaBytes} from '../src/reader-media.js';

test('publisher images prefer graphical abstracts and exclude generic branding',()=>{
  const media=publisherMedia(`<meta name="citation_pdf_url" content="/paper.pdf"><meta property="og:image" content="/journal-logo.jpg"><figure id="Fig1"><img src="https://media.springernature.com/figure1.jpg" alt="Study results"></figure><img src="https://ars.els-cdn.com/ga1.jpg" alt="Graphical abstract"><figure><img src="/logo.png" alt="Journal logo"></figure><figure><img src="http://127.0.0.1/private.png"></figure>`,'https://www.nature.com/articles/example');
  assert.equal(media.images[0].kind,'graphical-abstract');
  assert.equal(media.images[1].kind,'figure');
  assert.equal(media.images.length,2);
  assert.equal(media.pdfs[0].url,'https://www.nature.com/paper.pdf');
});

const correspondenceHtml = doi => `<meta name="citation_doi" content="${doi}">
  <meta name="citation_author" content="Yin, Yadong"><meta name="citation_author_institution" content="Department of Gynaecology, Xi'an Jiaotong University, China">
  <meta name="citation_author" content="Yang, Hong"><meta name="citation_author_email" content="yanghong@fmmu.edu.cn"><meta name="citation_author_institution" content="Department of Gynaecology and Obstetrics, Xijing Hospital, Air Force Medical University, Xi&#8217;an, China">
  <p id="corresponding-author-list">Correspondence to <a id="corresp-c1" href="mailto:yanghong@fmmu.edu.cn">Hong Yang</a>.</p>`;

test('publisher correspondence uses the requested DOI and confirmed author affiliation',()=>{
  const doi='10.1000/correspondence-test', source='https://link.springer.com/article/'+doi;
  const result=publisherMedia(correspondenceHtml(doi),source,doi);
  assert.equal(result.correspondingInstitutions.length,1);
  assert.equal(result.correspondingInstitutions[0].name,'Air Force Medical University');
  assert.match(result.correspondingInstitutions[0].affiliation,/Xi’an/);
  assert.equal(result.correspondingInstitutions[0].source,source);
  assert.deepEqual(publisherMedia(correspondenceHtml(doi),source,'10.1000/different').correspondingInstitutions,[]);
  assert.deepEqual(publisherMedia(correspondenceHtml(doi).replace('id="corresp-c1"','id="author-email"'),source,doi).correspondingInstitutions,[]);
});

test('unmarked or ambiguous authors are not treated as corresponding authors',()=>{
  const doi='10.1000/ambiguous-correspondence';
  const html=`<meta name="citation_doi" content="${doi}"><meta name="citation_author" content="Alex Smith"><meta name="citation_author_institution" content="University A"><meta name="citation_author" content="Alex Smith"><meta name="citation_author_institution" content="University B"><a id="corresp-c1" href="mailto:alex@example.org">Alex Smith</a>`;
  assert.deepEqual(publisherMedia(html,'https://www.nature.com/articles/test',doi).correspondingInstitutions,[]);
});

test('URLs and publication identifiers cannot turn the endpoint into an arbitrary proxy',async()=>{
  for(const url of ['http://www.nature.com/a','https://www.nature.com:444/a','https://user:pass@www.nature.com/a','https://www.nature.com.attacker.example/a','https://127.0.0.1/a','https://[::1]/a','file:///tmp/a','data:image/png;base64,AAAA']) assert.equal(mediaUrl(url),'');
  const never=()=>{throw new Error('invalid request must not fetch');};
  for(const query of ['doi=bad','arxiv=bad','doi=10.1000/test&url=https://127.0.0.1','arxiv=1706.03762&asset=html','arxiv=1706.03762&index=-1','doi=10.1000/test&arxiv=1706.03762']) assert.equal((await getReaderMedia(new Request(`https://www.scansci.com/api/reader/media?${query}`),{},never)).status,400);
});

test('oversized streamed responses are cancelled before allocation',async()=>{
  let cancelled=false;
  const response=new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(8));},cancel(){cancelled=true;}}));
  await assert.rejects(readMediaBytes(response,4),/media_too_large/);
  assert.equal(cancelled,true);
});

function publisherFetcher(doi,{html='',imageType='image/png',redirect}={}) {
  return async input=>{
    const url=new URL(String(input));
    if(url.hostname==='api.crossref.org') return Response.json({message:{DOI:doi,link:[]}});
    if(url.hostname==='www.ebi.ac.uk') return Response.json({resultList:{result:[]}});
    if(url.hostname==='doi.org') return new Response(null,{status:302,headers:{Location:redirect || 'https://www.nature.com/articles/test'}});
    if(url.pathname==='/articles/test') return new Response(html,{headers:{'Content-Type':'text/html'}});
    if(url.pathname==='/figure.png') return new Response(new Uint8Array([137,80,78,71]),{headers:{'Content-Type':imageType}});
    if(url.pathname==='/paper.pdf') return new Response('%PDF-1.7\nreal-document',{headers:{'Content-Type':'application/pdf'}});
    throw new Error('unexpected source '+url.href);
  };
}

test('the existing media response also returns verified corresponding institutions',async()=>{
  const doi='10.1000/correspondence-endpoint-test';
  const result=await getReaderMedia(new Request(`https://www.scansci.com/api/reader/media?doi=${doi}`),{},publisherFetcher(doi,{html:correspondenceHtml(doi)}));
  const data=await result.json();
  assert.equal(result.status,200);
  assert.deepEqual(data.images,[]);
  assert.equal(data.correspondingInstitutions[0].name,'Air Force Medical University');
});

test('missing institutions retry after a minute even when another source provides a PDF',async t=>{
  const doi='10.1000/correspondence-retry-test', url=`https://www.scansci.com/api/reader/media?doi=${doi}`;
  let clock=Date.now(), healthy=false, publisherCalls=0;
  t.mock.method(Date,'now',()=>clock);
  const base=publisherFetcher(doi,{html:correspondenceHtml(doi)});
  const fetcher=input=>{
    const target=new URL(String(input));
    if(target.hostname==='api.crossref.org') return Response.json({message:{DOI:doi,link:[{'content-type':'application/pdf',URL:'https://www.nature.com/paper.pdf'}]}});
    if(target.pathname==='/articles/test') { publisherCalls++; if(!healthy) return new Response(null,{status:503}); }
    return base(input);
  };
  const first=await getReaderMedia(new Request(url),{},fetcher), empty=await first.json();
  assert.equal(first.headers.get('Cache-Control'),'public, max-age=60');
  assert.equal(empty.pdfs.length,1);
  assert.deepEqual(empty.correspondingInstitutions,[]);
  healthy=true;
  clock+=60001;
  const recovered=await getReaderMedia(new Request(url),{},fetcher);
  assert.equal((await recovered.json()).correspondingInstitutions[0].name,'Air Force Medical University');
  assert.equal(recovered.headers.get('Cache-Control'),'public, max-age=86400');
  assert.equal(publisherCalls,2);
  const pdf=await getReaderMedia(new Request(url+'&asset=pdf'),{},fetcher);
  assert.equal(pdf.headers.get('Cache-Control'),'public, max-age=86400');
});

test('Springer public correspondence survives its anonymous cookie redirects',async()=>{
  const doi='10.1000/correspondence-springer-redirects', source='https://link.springer.com/article/'+doi;
  const redirects=[`https://doi.org/${doi}`,`https://link.springer.com/${doi}`,source,'https://idp.springer.com/authorize','https://idp.springer.com/error',source+'?error=cookies_not_supported'];
  const visited=[], base=publisherFetcher(doi);
  const fetcher=(input,options)=>{
    const url=String(input), index=redirects.indexOf(url);
    if(index<0) return base(input,options);
    visited.push(url);
    if(new URL(url).hostname==='idp.springer.com') assert.equal(options.cf.cacheTtl,0);
    assert.equal(options.headers.Cookie,undefined);
    if(index===redirects.length-1) return new Response(correspondenceHtml(doi),{headers:{'Content-Type':'text/html'}});
    return new Response(null,{status:302,headers:{Location:redirects[index+1]}});
  };
  const result=await getReaderMedia(new Request(`https://www.scansci.com/api/reader/media?doi=${doi}`),{},fetcher);
  const institution=(await result.json()).correspondingInstitutions[0];
  assert.equal(institution.name,'Air Force Medical University');
  assert.equal(institution.source,source);
  assert.equal(visited.length,6);
  assert.equal(mediaUrl('https://idp.springer.com/authorize'),'');
});

test('metadata and raw image/PDF routes follow the same resolved publication',async()=>{
  const doi='10.1000/media-test-1';
  const fetcher=publisherFetcher(doi,{html:'<figure><img src="/figure.png"></figure><meta name="citation_pdf_url" content="/paper.pdf">'});
  const url=`https://www.scansci.com/api/reader/media?doi=${doi}`;
  const result=await getReaderMedia(new Request(url),{},fetcher);
  assert.equal(result.status,200);
  const body=await result.json(); assert.equal(body.images.length,1); assert.equal(body.pdfs.length,1);
  const image=await getReaderMedia(new Request(url+'&asset=image'),{},fetcher);
  assert.equal(image.status,200); assert.equal(image.headers.get('content-type'),'image/png');
  const pdf=await getReaderMedia(new Request(url+'&asset=pdf'),{},fetcher);
  assert.equal(pdf.status,200); assert.match(await pdf.text(),/^%PDF-/);
  assert.equal((await getReaderMedia(new Request(url+'&asset=image&index=9'),{},fetcher)).status,404);
});

test('unsafe redirects are never followed; missing media returns an empty result',async()=>{
  const doi='10.1000/media-test-2', visited=[];
  const base=publisherFetcher(doi,{redirect:'https://127.0.0.1/internal'});
  const fetcher=input=>{visited.push(String(input));return base(input);};
  const result=await getReaderMedia(new Request(`https://www.scansci.com/api/reader/media?doi=${doi}`),{},fetcher);
  assert.equal(result.status,200); assert.deepEqual((await result.json()).images,[]);
  assert.equal(visited.some(url=>url.includes('127.0.0.1')),false);
});

test('an HTML page labelled as an image is rejected',async()=>{
  const doi='10.1000/media-test-3';
  const fetcher=publisherFetcher(doi,{html:'<figure><img src="/figure.png"></figure>',imageType:'text/html'});
  const result=await getReaderMedia(new Request(`https://www.scansci.com/api/reader/media?doi=${doi}&asset=image`),{},fetcher);
  assert.equal(result.status,502);
});

test('arXiv resolves a real PDF without a publisher lookup',async()=>{
  const never=()=>{throw new Error('metadata must not fetch');};
  const result=await getReaderMedia(new Request('https://www.scansci.com/api/reader/media?arxiv=1706.03762'),{},never);
  assert.equal((await result.json()).pdfs[0].url,'https://arxiv.org/pdf/1706.03762');
  const doi=await getReaderMedia(new Request('https://www.scansci.com/api/reader/media?doi=10.48550/arXiv.1706.03762'),{},never);
  assert.equal((await doi.json()).pdfs[0].url,'https://arxiv.org/pdf/1706.03762');
});

test('PMC files come from official version metadata, with raster detection for octet-stream',async()=>{
  const doi='10.1000/media-test-pmc', pmcid='PMC10000001';
  const base=`https://pmc-oa-opendata.s3.amazonaws.com/${pmcid}.2/`;
  const fetcher=async input=>{
    const url=new URL(String(input));
    if(url.hostname==='api.crossref.org') return Response.json({message:{DOI:doi}});
    if(url.hostname==='www.ebi.ac.uk') return Response.json({resultList:{result:[{doi,pmcid,isOpenAccess:'Y'}]}});
    if(url.hostname==='doi.org') return new Response(null,{status:404});
    if(url.pathname==='/') return new Response(`<CommonPrefixes><Prefix>${pmcid}.2/</Prefix></CommonPrefixes><CommonPrefixes><Prefix>PMC999999.1/</Prefix></CommonPrefixes>`);
    if(url.pathname.endsWith('.json')) return Response.json({doi,license_code:'CC BY',xml_url:`s3://pmc-oa-opendata/${pmcid}.2/${pmcid}.2.xml`,pdf_url:base+pmcid+'.2.pdf',media_urls:[base+'logo.png',base+'study-fig1.jpg',base+'study-ga.png']});
    if(url.pathname.endsWith('.xml')) return new Response('<article><fig><graphic xlink:href="study-fig1"/></fig><abstract><graphic xlink:href="study-ga"/></abstract></article>');
    if(url.pathname.endsWith('study-ga.png')) return new Response(new Uint8Array([137,80,78,71,13,10,26,10]),{headers:{'Content-Type':'binary/octet-stream'}});
    throw new Error('unexpected source '+url.href);
  };
  const url=`https://www.scansci.com/api/reader/media?doi=${doi}`;
  const data=await (await getReaderMedia(new Request(url),{},fetcher)).json();
  assert.equal(data.images.length,2); assert.equal(data.images[0].kind,'graphical-abstract');
  assert.equal(data.images[0].provider,'NLM/PMC'); assert.equal(data.license,'CC BY');
  assert.equal(data.pdfs[0].url,base+pmcid+'.2.pdf');
  const image=await getReaderMedia(new Request(url+'&asset=image'),{},fetcher);
  assert.equal(image.status,200); assert.equal(image.headers.get('Content-Type'),'image/png');
  const bad=await getReaderMedia(new Request(url+'&asset=image'),{},async()=>new Response('<script>bad()</script>',{headers:{'Content-Type':'binary/octet-stream'}}));
  assert.equal(bad.status,502);
});
