let scienceData = window.BENCHMARK_DATA;
let astaData = window.ASTA_DATA;
let chartData = window.CHART_DATA;
let inspireData = window.INSPIRE_DATA;
let recentData = window.RECENT_DATA;
let overallData = window.OVERALL_DATA;
const categories = [
  {id:'overall', label:'综合能力', title:'综合能力', description:'比较模型的通用能力与用户偏好。'},
  {id:'literature', label:'文献检索', title:'文献检索', description:'从海量论文中，找到真正相关的研究。', icon:'search'},
  {id:'reading', label:'论文阅读', title:'论文阅读', description:'关注模型对科学论文与证据的理解能力。', icon:'book'},
  {id:'writing', label:'学术写作', title:'文献综合', description:'关注文献综合、引用和研究对比表的生成。', icon:'pen'},
  {id:'analysis', label:'数据分析', title:'科研数据分析', description:'从真实科研任务出发，看看智能体在分析与编程中的表现。', icon:'chart'},
  {id:'reproduction', label:'论文复现', title:'论文复现', description:'从论文到代码和实验，关注研究结果的复现能力。', icon:'layers'},
  {id:'visualization', label:'科研绘图', title:'科研绘图', description:'关注科学数据分析和可视化任务。', icon:'image'}
];
const benchmarks = {
 overall:[{id:'aihot',name:'AIHOT 综合',metric:'AIHOT 评分',detail:'AIHOT 汇总多家第三方评测，按编程、科研、办公、知识问答和真人盲选加权；评分为标准化指标，不是百分比。',url:'https://aihot.news/leaderboard',overall:true}, {id:'arena',name:'Arena · 文本盲选',metric:'Arena 评分',detail:'Arena 官方文本风格控制榜，依据用户盲选计算评分；主要反映对话偏好，包含历史模型。',url:'https://arena.ai/leaderboard/chat/text',overall:true}],
 literature:[{id:'inspire',name:'INSPIRE · 2026',metric:'nDCG@10',detail:'针对开放科研问题检索相关论文；476 个计算机科学问题，成绩来自 2026-09-27 预印本表 2。',url:'https://arxiv.org/html/2609.33233v1#S4.T2'}, {id:'sciconbench',name:'SciConBench · 文献综合',metric:'证据 F1',detail:'基于医学系统综述检索并综合科学结论；衡量证据综合能力，不能等同于纯文献检索。',url:'https://sciconbench.cs.princeton.edu/',recent:true}, {id:'literature',name:'PaperFindingBench',metric:'调整后的微平均 F1',detail:'根据描述查找相关论文；指标以百分制显示。',url:'https://allenai.org/asta/bench'}],
 reading:[{id:'sciconbench',name:'SciConBench · 文献综合',metric:'证据 F1',detail:'依据医学系统综述衡量科学证据检索与综合；最新评测月的部分模型覆盖篇数不同。',url:'https://sciconbench.cs.princeton.edu/',recent:true}, {id:'reading',name:'LitQA2-FullText',metric:'问答正确率',detail:'查找并阅读科学论文全文，回答文献问题。',url:'https://allenai.org/asta/bench'}],
 writing:[{id:'sciconbench',name:'SciConBench · 文献综合',metric:'证据 F1',detail:'依据医学系统综述衡量科学结论综合；这是证据综合测试，不直接评估文章语言质量。',url:'https://sciconbench.cs.princeton.edu/',recent:true}, {id:'english-writing',name:'英文写作参考',metric:'AI 评审分',detail:'一般英文写作质量的参考榜单，覆盖多种文体；不专门评估学术写作或引文准确性。',url:'https://aiwritingbenchmark.com/leaderboard/',recent:true}, {id:'writing',name:'ScholarQA-CS2',metric:'综合分',detail:'计算机科学文献综述，衡量内容和引用的覆盖与准确性。',url:'https://allenai.org/asta/bench'}, {id:'tables',name:'ArxivDIGESTables-Clean',metric:'表格评分',detail:'基于相关论文生成文献对比表，与论文发表的表格对照。',url:'https://allenai.org/asta/bench'}],
 analysis:[{id:'terminal-science',name:'Terminal-Bench Science',metric:'任务完成率',detail:'Vals AI 对 70 项多学科科研工作流的评测，涵盖数据处理与建模等任务；仅显示 Mini-SWE-agent 配置。',url:'https://vals-ai.com/benchmarks/terminal-bench-science',recent:true}, {id:'swescience',name:'SWE-bench Science',metric:'任务完成率',detail:'科学软件仓库级问题修复；可参考科研编程能力，与数据分析任务不同。',url:'https://swescience.github.io/',recent:true}, {id:'science',name:'ScienceAgentBench',metric:'正确率',detail:'102 个科研数据分析任务 · SAB Self-Debug 配置',url:'https://hal.cs.princeton.edu/scienceagentbench'}, {id:'discovery',name:'DiscoveryBench',metric:'发现评分',detail:'评估数据驱动的科学发现与已发表研究结果的复现。',url:'https://allenai.org/asta/bench'}],
 reproduction:[{id:'paperbench-science',name:'PaperBench Science',metric:'部分复现分',detail:'93 项论文复现任务，覆盖六个科学领域；来源公布的部分复现分，包含模型与智能体配置的共同影响。',url:'https://pipelinelab.ai/blog/paperbench-expanded/',recent:true}, {id:'reproduction',name:'CORE-Bench Hard',metric:'任务正确率',detail:'依据论文和代码环境复现计算研究的结果。',url:'https://allenai.org/asta/bench'}],
 visualization:[{id:'scifigure-image',name:'SciFigure2Code · 原图复现',metric:'综合分',detail:'论文图表生成可编辑绘图代码，337 个图表的图像输入结果；论文固定结果，不代表新模型实时排名。',url:'https://arxiv.org/html/2609.08155v1#S6.T3',recent:true}, {id:'scifigure-caption',name:'SciFigure2Code · 图文复现',metric:'综合分',detail:'论文图表与文字说明共同输入，生成可编辑绘图代码；与纯图输入单独比较。',url:'https://arxiv.org/html/2609.08155v1#S6.T4',recent:true}, {id:'chart-direct',name:'ChartMimic · 原图复现',metric:'综合分',detail:'根据科学图表生成代码并复现原图，综合评价图表细节和整体效果。',url:'https://chartmimic.github.io/'}, {id:'chart-custom',name:'ChartMimic · 按要求修改',metric:'综合分',detail:'根据参考图表和修改要求生成绘图代码，评价修改后的图表效果。',url:'https://chartmimic.github.io/'}]
};
const logos = {OpenAI:'assets/openai.png',Anthropic:'assets/anthropic.png',DeepSeek:'assets/deepseek.png',Google:'assets/google.png',Qwen:'assets/qwen.png','Moonshot AI':'assets/moonshot.webp',MiniMax:'assets/minimax.png','Z.ai':'assets/zhipu.png',NVIDIA:'assets/nvidia.png',Meta:'assets/meta.svg',xAI:'assets/xai.svg',Xiaomi:'assets/mimo.svg',StepFun:'assets/stepfun.svg'};
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const $ = s => document.querySelector(s);
let selected = 'overall', selectedBenchmark = 'aihot', currentRows = [], searchQuery = '', selectedView = 'ranking';
function provider(row){ const text=`${row.provider||''} ${row.model}`.toLowerCase(); if(/claude|anthropic|\b(?:fable|opus)\b/.test(text))return 'Anthropic'; if(/gemini|google/.test(text))return 'Google'; if(/deepseek/.test(text))return 'DeepSeek'; if(/qwen|alibaba/.test(text))return 'Qwen'; if(/moonshot|\bkimi/.test(text))return 'Moonshot AI'; if(/minimax/.test(text))return 'MiniMax'; if(/z\.ai|\bglm/.test(text))return 'Z.ai'; if(/nvidia|nemotron/.test(text))return 'NVIDIA'; if(/openai|\bgpt-|\bo[1-9]/.test(text))return 'OpenAI'; if(/\bmeta\b|\bmuse\b/.test(text))return 'Meta'; if(/\bxai\b|\bgrok\b/.test(text))return 'xAI'; if(/xiaomi|\bmimo/.test(text))return 'Xiaomi'; if(/stepfun|\bstep\s*\d/.test(text))return 'StepFun'; return row.provider||''; }
const providerLogo = row => logos[provider(row)] || 'assets/unknown-model.svg';
function modelDisplayName(raw){
 const prefix=/^(anthropic|openai|google)\//i, knownPrefix=prefix.test(raw);
 let name=raw.replace(prefix,''), date='';
 if(/^together\/meta-llama\//i.test(raw))return raw.replace(/^together\/meta-llama\//i,'');
 if(knownPrefix){
   const dated=name.match(/-(\d{4}-\d{2}-\d{2}|\d{8})$/);
   if(dated){date=dated[1].replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');name=name.slice(0,-dated[0].length);}
 }
 const title=s=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase();
 let match=name.match(/^claude-(opus|sonnet|haiku)-(\d+)(?:-(\d+))?$/i);
 if(match)name=`Claude ${title(match[1])} ${match[2]}${match[3]?'.'+match[3]:''}`;
 else if((match=name.match(/^claude-(opus|sonnet|haiku)-(\d+(?:\.\d+)?)(\s+\([^)]*\))$/i)))name=`Claude ${title(match[1])} ${match[2]}${match[3]}`;
 else if((match=name.match(/^(fable|opus) (\d+(?:\.\d+)?)(.*)$/i)))name=`Claude ${title(match[1])} ${match[2]}${match[3]}`;
 else if((match=name.match(/^claude-(\d+)(?:[-.](\d+))?-(opus|sonnet|haiku)$/i)))name=`Claude ${match[1]}${match[2]?'.'+match[2]:''} ${title(match[3])}`;
 else if((match=name.match(/^Claude-(\d+(?:\.\d+)?) (Opus|Sonnet|Haiku)(.*)$/i)))name=`Claude ${match[1]} ${title(match[2])}${match[3]}`;
 else if(knownPrefix && (match=name.match(/^gpt-(\d+(?:\.\d+)?[a-z]?)(.*)$/i)))name=`GPT-${match[1]}${match[2].replace(/-([a-z]+)/gi,(_,word)=>' '+title(word))}`;
 else if(knownPrefix && (match=name.match(/^(o\d+)(-mini)?$/i)))name=match[1].toLowerCase()+(match[2]?'-mini':'');
 else if(knownPrefix && (match=name.match(/^gemini-(\d+(?:\.\d+)?)-(.*)$/i)))name=`Gemini ${match[1]} ${match[2].replace(/[a-z]+/gi,title).replace(/-(?=[a-z])/gi,' ')}`;
 else if(knownPrefix)return raw;
 return name+(date?` (${date})`:'');
}
function submissionDate(row){
 const date=row.submittedAt?new Date(row.submittedAt):null;
 return date&&!Number.isNaN(date.getTime())?date.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}):'';
}
function modelBenchmarkRows(rows){
 return rows.filter(r=>r.agent==='ReAct' && typeof r.model==='string' && r.model.trim() && !['none/none','mockllm/model','未公开模型'].includes(r.model.trim().toLowerCase()));
}
function renderNav(){ $('#nav').innerHTML = categories.map(c=>`<button type="button" class="nav-btn ${c.id===selected?'active':''}" data-category="${c.id}" ${c.id===selected?'aria-current="page"':''}>${c.label}</button>`).join(''); }
function benchmarkToolbar(b, options, isScience, isChart){
 const controls=options.map(o=>`<button type="button" data-benchmark="${o.id}" class="${o.id===b.id?'active':''}" aria-pressed="${o.id===b.id}">${escapeHTML(o.name)}</button>`).join('');
 const note=b.id==='aihot'?'AIHOT 的第三方评测综合分，覆盖不同能力，分数不是百分比。只展示原榜列出的模型；新模型需先被原榜纳入。':b.id==='arena'?'Arena 风格控制文本榜依据真人盲选评估对话偏好；评分和票数来自官方数据集，并不直接衡量科研能力。':b.id==='inspire'?'论文结果快照：统一检索工具和预算，原始 nDCG@10（0–1）越高越好；限计算机科学。':b.id==='sciconbench'?'医学系统综述上的证据综合，F1 转为百分制。仅显示原榜最新评测月份的结果；不同模型覆盖的综述篇数可能不同。':b.id==='english-writing'?'一般英文写作综合成绩，AI 裁判评分；不能代替学术引用与研究内容的准确性评估。':b.id==='terminal-science'?'Vals AI 评测 70 个多学科研究工作流，包含数据处理、模型校准与仿真；成绩反映模型与 Mini-SWE-agent 的组合。':b.id==='swescience'?'测试科学软件问题修复，模型与其编程智能体配置共同决定成绩；任务与科研数据分析不同。':b.id==='paperbench-science'?'测试 93 篇科学论文的复现；部分复现分为原始公布的评估指标，不等同于完整复现率。':b.id.startsWith('scifigure-')?'论文固定结果，评估图表视觉呈现及可执行绘图代码，不代表恢复原始数据。':isScience?'102 个科研数据分析任务；使用 SAB Self-Debug 配置。原榜 2026/10/05 提示部分成本被重复计算，且受影响程度不同。':isChart?'原榜综合评估图表细节与 GPT-4o 对整体效果的评价；执行率为绘图代码成功执行的比例。':'展示底层模型明确的 ReAct 记录。提交时间、代码版本和运行参数可能不同，请查看原始记录；原始指标按 0–100 显示。';
 return `<div class="benchmark-toolbar"><div class="benchmark-select" aria-label="选择基准">${controls}</div><details class="benchmark-info"><summary>评测说明</summary><div class="benchmark-info-body"><strong>${escapeHTML(b.name)}</strong><p>${escapeHTML(b.detail)}</p><p>${note}</p><p>不同基准的任务和指标各不相同，请在相同基准与条件下比较。</p><a href="${b.url}" target="_blank" rel="noopener noreferrer">查看基准 ↗</a></div></details></div>`;
}
function render(){
 const c=categories.find(x=>x.id===selected), options=benchmarks[selected], b=options.find(x=>x.id===selectedBenchmark)||options[0]; selectedBenchmark=b.id;
 renderNav(); $('#title').textContent=`${c.title}榜`;
 const isScience=b.id==='science', isChart=b.id.startsWith('chart-'), isInspire=b.id==='inspire', isRecent=!!b.recent, isOverall=!!b.overall;
 const toolbar=benchmarkToolbar(b,options,isScience,isChart);
 const data=isScience?scienceData:isChart?chartData:isInspire?inspireData:isRecent?recentData?.groups?.[b.id]:isOverall?overallData?.groups?.[b.id]:astaData;
 if(!data){$('#content').innerHTML=toolbar+`<div class="card empty-card"><h2>数据暂不可用</h2><p>请等待下一次更新或查看原始来源。</p></div>`;return;}
 currentRows=isScience||isInspire||isRecent||isOverall?data.rows:isChart?data.groups[b.id==='chart-direct'?'direct':'custom']:modelBenchmarkRows(data.groups[b.id]||[]);
 const sourceKey=isScience?'science':isChart?'chart':isInspire?'inspire':isRecent?'recent':isOverall?'overall':'asta';
 const latest=window.UPDATE_STATUS?.[sourceKey];
 const dates=currentRows.map(r=>r.submittedAt).filter(s=>s&&!Number.isNaN(new Date(s).getTime())).sort();
 const traceDates=isScience?currentRows.map(r=>r.traceUploadedAt).filter(Boolean).sort():[];
 const chartUpdate=isChart?data.updated?.[b.id==='chart-direct'?'direct':'custom']:null;
 const traceRow=isScience?currentRows.find(r=>r.traceUploadedAt===traceDates[traceDates.length-1]):null;
 const traceHistory=traceRow?.traceUrl?.replace('/resolve/main/','/blob/main/').split('?')[0];
 const recentDate=isRecent||isOverall?(/^\d{4}-\d{2}(?:-\d{2})?$/.test(data.updatedAt)||data.dateLabel.includes('发布')?data.updatedAt.slice(0,10):`${submissionDate({submittedAt:data.updatedAt})}（北京时间）`):'';
 const sourceTime=isInspire?`论文发布时间 ${data.publishedAt||'未提供'}`:isRecent||isOverall?`${data.dateLabel} ${recentDate}`:isScience?(traceDates.length===currentRows.length?`所列记录最新上传 ${submissionDate({submittedAt:traceDates[traceDates.length-1]})}（北京时间）`:'原榜记录上传时间暂不可用'):isChart?(chartUpdate?`数据文件提交 ${submissionDate({submittedAt:chartUpdate.date})}（北京时间）`:'数据文件提交时间暂不可用'):dates.length?`所列模型最新提交 ${submissionDate({submittedAt:dates[dates.length-1]})}（北京时间）`:'原榜未提供提交时间';
 const status=isRecent?(recentData.failed?.includes(b.id)?' · 来源更新失败，使用已保存数据':''):isOverall?(overallData.failed?.includes(b.id)?' · 来源更新失败，使用已保存数据':''):(latest&&!latest.ok?' · 来源更新失败，使用已保存数据':'');
 const switcher=isScience||b.id==='aihot'?`<div class="view-switch" role="group" aria-label="选择视图"><button type="button" data-view="ranking" aria-pressed="${selectedView==='ranking'}">榜单</button><button type="button" data-view="frontier" aria-pressed="${selectedView==='frontier'}">斩杀线</button></div>`:'';
 const head=`<div class="card-head"><div><div class="card-title">模型排行榜 <span class="count">${currentRows.length}</span></div><div class="card-sub">${escapeHTML(b.metric)} · ${escapeHTML(sourceTime)}${status}</div></div><div class="card-controls">${selectedView==='ranking'?'<input id="search" class="search" type="search" placeholder="搜索模型" aria-label="搜索模型">':''}${switcher}</div></div>`;
 if((isScience||b.id==='aihot') && selectedView==='frontier'){
   const aihot=b.id==='aihot', priced=aihot?currentRows.filter(r=>Number.isFinite(r.cost)&&r.cost>0).length:currentRows.length;
   $('#content').innerHTML=toolbar+`<section class="card frontier-card">${head}<div class="frontier-summary">${aihot?`斩杀线连接各价格下的最高综合评分，阴影中的模型存在价格不高、评分不低的选择。价格按缓存命中、输入、输出 7∶2∶1 折算；${currentRows.length-priced} 个价格未核验的模型未纳入图表。`:'斩杀线连接各成本下的最佳结果；阴影中的模型可找到成本不高、正确率不低的选择。原榜提示部分成本被高估且影响程度不同，斩杀线仅供参考。'}</div><div class="chart-scroll"><div class="chart-frame" id="chart"></div></div><div id="frontier-capsules" class="frontier-capsules"></div><div id="chart-tooltip" class="chart-tooltip" role="tooltip" hidden></div><div class="table-foot">${aihot?'价格和评分按 AIHOT 页面展示的数值计算，折算价为近似值；DeepSeek V4.1 Flash 1017 为非高峰价，高峰期价格翻倍。实际费用取决于用量、缓存命中率及服务商定价。':'原榜 2026/10/05 提示成本存在重复计算；请结合原始运行条件比较。'}</div></section>`;
   drawChart();
 }else{
   $('#content').innerHTML=toolbar+`<section class="card">${head}<div class="table-wrap"><table><thead><tr><th>排名</th><th>模型 / 测试配置</th>${b.id==='aihot'?'<th>上线日期</th><th>评测覆盖</th>':b.id==='arena'?'<th>投票数</th>':''}<th>${escapeHTML(b.metric)} ↑</th>${isScience?'<th>总成本</th>':isChart?'<th>执行率</th>':''}</tr></thead><tbody id="rows"></tbody></table></div><div class="table-foot">${isScience?`记录时间为原榜运行轨迹文件的上传时间；原榜 2026/10/05 提示部分成本被高估且影响程度不同。${traceHistory?` <a href="${escapeHTML(traceHistory)}" target="_blank" rel="noopener noreferrer">查看原始记录 ↗</a>`:''}`:isChart?`时间为原数据文件最近提交时间；执行率来自相同任务的官方榜单。${chartUpdate?.url?` <a href="${escapeHTML(chartUpdate.url)}" target="_blank" rel="noopener noreferrer">查看文件历史 ↗</a>`:''}`:isRecent||isOverall?escapeHTML(b.detail):isInspire?'论文表 2 的固定结果，适用计算机科学任务。':'仅展示底层模型明确的 ReAct 记录；提交时间、代码版本和运行参数可能不同。'}</div></section>`;
   $('#search').value=searchQuery; renderRows(searchQuery); $('#search').addEventListener('input',e=>{searchQuery=e.target.value;renderRows(searchQuery)});
 }

}
function renderRows(query){
 const q=query.trim().toLowerCase(), isScience=selectedBenchmark==='science', isChart=selectedBenchmark.startsWith('chart-'), isInspire=selectedBenchmark==='inspire', choice=benchmarks[selected].find(b=>b.id===selectedBenchmark), isRecent=!!choice?.recent, isOverall=!!choice?.overall, isAsta=!isScience&&!isChart&&!isInspire&&!isRecent&&!isOverall; let lastRank=0;
 const ranked=currentRows.map((r,i)=>{const prev=currentRows[i-1];const value=r.scoreRaw??r.score;const rank=isOverall?r.rank:prev&&value===(prev.scoreRaw??prev.score)?lastRank:i+1;lastRank=rank;return {...r,rank}});
 const rows=ranked.filter(r=>`${r.model} ${modelDisplayName(r.model)} ${r.agent} ${provider(r)}`.toLowerCase().includes(q));
 $('#rows').innerHTML=rows.length?rows.map(r=>{const p=provider(r), logo=`<img class="provider-logo" src="${providerLogo(r)}" alt="">`; const url=isScience?scienceData.source:r.source, title=modelDisplayName(r.model), date=isAsta?submissionDate(r):'', detail=`${r.agent}${p?' · '+p:''}${isAsta?(date?` · 提交 ${date}（北京时间）`:' · 提交时间未提供'):''}`, extra=selectedBenchmark==='aihot'?`<td class="cost">${escapeHTML(r.releaseDate)}</td><td class="cost">${r.benchmarkCount} 项 · ${r.coveragePercent}%</td>`:selectedBenchmark==='arena'?`<td class="cost">${r.votes.toLocaleString()}</td>`:''; return `<tr><td class="rank ${r.rank<=3?'top':''}">${String(r.rank).padStart(2,'0')}</td><td><div class="model-cell">${logo}<span><a class="model-name model-source" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" title="原始标识：${escapeHTML(r.model)}" aria-label="查看 ${escapeHTML(title)} 的原始记录">${escapeHTML(title)}</a><span class="model-sub">${escapeHTML(detail)}</span></span></div></td>${extra}<td class="score"${selectedBenchmark==='arena'?` title="原榜评分区间：${r.ratingLower.toFixed(0)}–${r.ratingUpper.toFixed(0)}"`:''}>${r.score.toFixed(isInspire?3:selectedBenchmark==='aihot'?1:selectedBenchmark==='arena'?0:2)}${isScience?'%':''}</td>${isScience?`<td class="cost">$${r.cost.toFixed(2)}</td>`:isChart?`<td class="cost">${r.executionRate.toFixed(1)}%</td>`:''}</tr>`}).join(''):`<tr><td colspan="${selectedBenchmark==='aihot'?5:isScience||isChart||selectedBenchmark==='arena'?4:3}">${currentRows.length?'没有找到匹配的结果。':'暂无符合条件的模型结果。'}</td></tr>`;
}
function paretoFrontier(rows){
 const sorted=[...rows].sort((a,b)=>a.cost-b.cost||b.score-a.score); let best=-Infinity;
 return sorted.filter(row=>{if(row.score>best){best=row.score;return true}return false});
}
function placeChartLabels(points, bounds){
 const placed=[];
 const overlap=(a,b)=>a.x < b.x+b.width+4 && a.x+a.width+4 > b.x && a.y < b.y+b.height+4 && a.y+a.height+4 > b.y;
 for(const point of points){
   const width=Math.min(bounds.width,point.labelWidth??Math.max(50,8+point.label.length*6.5)), height=30;
   const positions=[], offsets=[20,-width-20,24,-width-24,28,-width-28];
   for(let dy=0;dy<=36;dy+=12){
     for(const vertical of dy?[dy,-dy]:[0]){
       for(const horizontal of offsets){
         const x=Math.max(bounds.x,Math.min(bounds.x+bounds.width-width,point.x+horizontal));
         const y=Math.max(bounds.y,Math.min(bounds.y+bounds.height-height,point.y+vertical-height/2));
         const candidate={x,y,width,height};
         if(placed.some(previous=>!previous.hidden&&overlap(candidate,previous)) || (bounds.obstacles||[]).some(icon=>overlap(candidate,icon))) continue;
         const dx=Math.max(x-point.x,point.x-x-width,0),dy=Math.max(y-point.y,point.y-y-height,0);
         const distance=Math.hypot(dx,dy);
         if(distance>30)continue;
         positions.push({...candidate,distance});
       }
     }
   }
   // ponytail: hide labels that cannot fit near their marker; hover or focus reveals them without implying a false association.
   const best=positions.sort((a,b)=>a.distance-b.distance)[0];
   if(!best){placed.push({...point,hidden:true});continue;}
   placed.push({...point,...best});
 }
 return placed;
}
function sizeChartMarkers(points){
 const sizes=points.map(p=>p.onFront?34:24);
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
   const clearance=Math.max(Math.abs(points[i].x-points[j].x),Math.abs(points[i].y-points[j].y))-2;
   if(clearance>0 && sizes[i]+sizes[j]>2*clearance){
     const scale=2*clearance/(sizes[i]+sizes[j]);
     sizes[i]=Math.max(12,sizes[i]*scale); sizes[j]=Math.max(12,sizes[j]*scale);
   }
 }
 // ponytail: identical or extremely close coordinates can overlap at the minimum size; cluster them if dense datasets require it.
 return sizes;
}
function drawChart(){
 const aihot=selectedBenchmark==='aihot',rows=aihot?currentRows.filter(r=>Number.isFinite(r.cost)&&r.cost>0):currentRows;
 if(!rows.length){$('#chart').innerHTML='<p class="frontier-summary">暂无可比较的价格数据。</p>';return;}
 const score=r=>aihot?r.score.toFixed(1):`${r.score.toFixed(2)}%`,cost=r=>`${aihot?'¥':'$'}${r.cost.toFixed(2)}`;
 const metric=aihot?'AIHOT 评分':'正确率',costLabel=aihot?'折算价':'总成本';
 const frame=$('#chart'),w=Math.max(1080,Math.min(1400,frame.clientWidth)),h=Math.max(320,Math.min(700,innerHeight-(frame.getBoundingClientRect().top+scrollY)-18)),left=65,right=30,top=35,bottom=65;
 const maxCost=Math.max(...rows.map(r=>r.cost)),minCost=Math.min(...rows.map(r=>r.cost));
 const logarithmic=minCost>0 && maxCost/minCost>=10;
 const xMin=logarithmic?Math.floor(Math.log10(minCost)):0;
 const xMax=logarithmic?Math.ceil(Math.log10(maxCost)):Math.max(10,Math.ceil(maxCost/10)*10);
 const minY=Math.max(0,Math.floor((Math.min(...rows.map(r=>r.score))-2)/5)*5);
 const maxY=Math.max(minY+5,Math.ceil((Math.max(...rows.map(r=>r.score))+2)/5)*5);
 const x=v=>left+(w-left-right)*(logarithmic?(Math.log10(v)-xMin)/(xMax-xMin):v/xMax);
 const y=v=>h-bottom-(h-top-bottom)*(v-minY)/(maxY-minY);
 const front=paretoFrontier(rows);
 const grid=Array.from({length:5},(_,i)=>minY+i*(maxY-minY)/4).map(v=>`<line class="chart-grid" x1="${left}" x2="${w-right}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-text" x="${left-10}" y="${y(v)+4}" text-anchor="end">${Number(v.toFixed(1))}${aihot?'':'%'}</text>`).join('');
 const ticks=logarithmic?Array.from({length:xMax-xMin+1},(_,i)=>10**(xMin+i)):Array.from({length:5},(_,i)=>i*xMax/4);
 const xticks=ticks.map(v=>`<line class="chart-grid" x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${h-bottom}"/><text class="axis-text" x="${x(v)}" y="${h-bottom+22}" text-anchor="middle">${aihot?'¥':'$'}${Number(v.toFixed(2))}</text>`).join('');
 const stairs=front.map((r,i)=>i?`H ${x(r.cost)} V ${y(r.score)}`:`M ${x(r.cost)} ${y(r.score)}`).join(' ');
 const last=front[front.length-1],shade=`${stairs} H ${w-right} V ${h-bottom} H ${x(front[0].cost)} Z`;
 const textMeasure=document.createElement('canvas').getContext('2d');
 textMeasure.font="700 11px 'DM Sans','Noto Sans SC',sans-serif";
 const mapped=rows.map((r,index)=>{const label=modelDisplayName(r.model).replace(/\s+\([A-Za-z]+ \d{4}\)$/,'');return {index,x:x(r.cost),y:y(r.score),label,labelWidth:Math.max(textMeasure.measureText(label).width,textMeasure.measureText(`${score(r)} · ${cost(r)}`).width)+6,onFront:front.some(f=>f.cost===r.cost&&f.score===r.score)}});
 const sizes=sizeChartMarkers(mapped);
 const markers=mapped.map((p,i)=>({...p,drawX:p.x,drawY:p.y,size:sizes[i],box:{x:p.x-sizes[i]/2,y:p.y-sizes[i]/2,width:sizes[i],height:sizes[i]}}));
 const positions=placeChartLabels(markers.filter(p=>p.onFront).map(p=>({...p,x:p.drawX,y:p.drawY})).sort((a,b)=>a.y-b.y),{x:left,y:top,width:w-left-right,height:h-top-bottom,obstacles:markers.map(p=>p.box)});
 const labelByIndex=Object.fromEntries(positions.map(p=>[p.index,p]));
 const labels=[...markers].sort((a,b)=>Number(a.onFront)-Number(b.onFront)).map(point=>{
   const p=labelByIndex[point.index]||{...point,hidden:true};
   const r=rows[p.index],logo=providerLogo(r),size=point.size;
   return `<g class="chart-model ${p.onFront?'':'is-dominated'}" data-point="${p.index}" tabindex="0" role="button" aria-describedby="chart-tooltip" aria-label="${escapeHTML(modelDisplayName(r.model))}，${metric} ${score(r)}，${costLabel} ${cost(r)}，${p.onFront?'位于斩杀线':'被支配'}"><rect class="chart-marker" x="${point.drawX-size/2}" y="${point.drawY-size/2}" width="${size}" height="${size}" rx="${p.onFront?10:7}"/>${logo?`<image href="${logo}" x="${point.drawX-(size-8)/2}" y="${point.drawY-(size-8)/2}" width="${size-8}" height="${size-8}"/>`:''}${p.hidden?'':`<text class="chart-label-name" x="${p.x}" y="${p.y+12}">${escapeHTML(p.label)}</text><text class="chart-label-value" x="${p.x}" y="${p.y+25}">${score(r)} · ${cost(r)}</text>`}</g>`;
 }).join('');
 const hiddenLabels=positions.filter(p=>p.hidden).length;
 $('.frontier-summary').insertAdjacentHTML('beforeend',` 阴影中的模型可悬停或聚焦查看详情。${hiddenLabels?` ${hiddenLabels} 个线上的密集点名称请悬停查看。`:''}`);
 $('#chart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="group" aria-label="模型${costLabel}与${metric}斩杀线，图标位于实际坐标，悬停或聚焦可查看详情"><path class="dominated-area" d="${shade}"/>${grid}${xticks}<path class="frontier" d="${stairs}"/><path class="frontier-extension" d="M ${x(last.cost)} ${y(last.score)} H ${w-right}"/>${labels}<text class="axis-text" x="${w-right}" y="${h-15}" text-anchor="end">${aihot?'折算价 / 人民币 / 百万 Token':'总成本 / 美元'}${logarithmic?'（对数坐标）':''}</text></svg>`;
 $('#frontier-capsules').innerHTML=`<div class="capsule-title"><strong>斩杀线</strong><span>${front.length} 个模型 · 按${costLabel}从低到高</span></div><div class="capsule-list">${front.map((r,i)=>{const previous=front[i-1],label=modelDisplayName(r.model).replace(/\s+\([A-Za-z]+ \d{4}\)$/,'');const comparison=previous?(previous.cost>0?`${costLabel} ×${(r.cost/previous.cost).toFixed(1)} · `:'')+`${metric} +${(r.score-previous.score).toFixed(aihot?1:2)} ${aihot?'分':'个百分点'}`:`最低${costLabel}`;return `<button type="button" class="frontier-capsule" data-capsule="${rows.indexOf(r)}"><span class="capsule-name"><img src="${providerLogo(r)}" alt="">${escapeHTML(label)}</span><span class="capsule-score">${score(r)} <small>· ${cost(r)}</small></span><span class="capsule-comparison">${comparison}</span></button>`}).join('')}</div>`;
 const chart=$('#chart'), tooltip=$('#chart-tooltip');
 function show(target){
   const r=rows[Number(target.dataset.point)],onFront=front.some(f=>f.cost===r.cost&&f.score===r.score);
   tooltip.innerHTML=`<strong>${escapeHTML(modelDisplayName(r.model))}</strong><span>${escapeHTML(r.provider)} · ${escapeHTML(r.agent)}</span><dl><dt>${metric}</dt><dd>${score(r)}</dd><dt>${costLabel}</dt><dd>${cost(r)}</dd>${aihot?`<dt>缓存 / 输入 / 输出</dt><dd>¥${r.cachePrice} / ${r.inputPrice} / ${r.outputPrice}</dd><dt>评测覆盖</dt><dd>${r.benchmarkCount} 项 · ${r.coveragePercent}%</dd>`:''}</dl><div class="tooltip-status">${onFront?'位于斩杀线':'阴影区域 · 存在更优选择'}</div>`;
   tooltip.hidden=false;
   const box=target.querySelector('.chart-marker').getBoundingClientRect(), tip=tooltip.getBoundingClientRect();
   tooltip.style.left=`${Math.max(8,Math.min(innerWidth-tip.width-8,box.right+10))}px`;
   tooltip.style.top=`${Math.max(8,Math.min(innerHeight-tip.height-8,box.top))}px`;
 }
 chart.addEventListener('pointerover',e=>{const target=e.target.closest('[data-point]');if(target)show(target)});
 chart.addEventListener('pointerout',e=>{if(e.target.closest('[data-point]')&&!e.relatedTarget?.closest?.('[data-point]'))tooltip.hidden=true});
 chart.addEventListener('focusin',e=>{const target=e.target.closest('[data-point]');if(target)show(target)});
 chart.addEventListener('focusout',()=>{tooltip.hidden=true});
 chart.addEventListener('click',e=>{const target=e.target.closest('[data-point]');if(target)show(target)});
 chart.addEventListener('keydown',e=>{if(e.key==='Escape')tooltip.hidden=true});
 $('#frontier-capsules').addEventListener('click',e=>{const capsule=e.target.closest('[data-capsule]');if(!capsule)return;const target=chart.querySelector(`[data-point="${capsule.dataset.capsule}"]`);target?.scrollIntoView({block:'nearest',inline:'nearest'});target?.focus()});
}
$('#nav').addEventListener('click',e=>{const button=e.target.closest('[data-category]'); if(button){selected=button.dataset.category;selectedBenchmark=benchmarks[selected][0].id;searchQuery='';selectedView='ranking';render()}});
$('#content').addEventListener('click',e=>{const view=e.target.closest('[data-view]');if(view){selectedView=view.dataset.view;render();return}const button=e.target.closest('[data-benchmark]');if(button){selectedBenchmark=button.dataset.benchmark;searchQuery='';selectedView='ranking';render()}});
let chartResize;
window.addEventListener('resize',()=>{if(selectedView==='frontier'&&$('#chart')){cancelAnimationFrame(chartResize);chartResize=requestAnimationFrame(render)}});
render();

// Reload locally updated snapshots while the page remains open.
async function reloadSnapshots(){
 const before=[scienceData?.capturedAt,astaData?.capturedAt,chartData?.capturedAt,inspireData?.capturedAt,recentData?.capturedAt,overallData?.capturedAt,JSON.stringify(window.UPDATE_STATUS)];
 for(const file of ['data.js','asta-data.js','chart-data.js','inspire-data.js','recent-data.js','overall-data.js','update-status.js']){
   await new Promise(resolve=>{const script=document.createElement('script');script.src=file+'?refresh='+Date.now();script.onload=script.onerror=()=>{script.remove();resolve()};document.head.appendChild(script)});
 }
 scienceData=window.BENCHMARK_DATA;astaData=window.ASTA_DATA;chartData=window.CHART_DATA;inspireData=window.INSPIRE_DATA;recentData=window.RECENT_DATA;overallData=window.OVERALL_DATA;
 const after=[scienceData?.capturedAt,astaData?.capturedAt,chartData?.capturedAt,inspireData?.capturedAt,recentData?.capturedAt,overallData?.capturedAt,JSON.stringify(window.UPDATE_STATUS)];
 if(JSON.stringify(before)!==JSON.stringify(after))render();
}
setInterval(reloadSnapshots,5*60*1000);
