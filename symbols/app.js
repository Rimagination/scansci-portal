(() => {
  'use strict';
  const COMMUNITY_ENABLED = document.documentElement.dataset.community !== 'off';

  const CATEGORIES = { plants: '植物', animals: '动物', biology: '微生物', ecology: '生态与环境', earth: '地球科学', laboratory: '实验仪器', medicine: '医学与健康', engineering: '工程与设施', other: '其他' };
  const LICENSES = {
    'CC0-1.0': { label: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', explanation: '可复制、修改与商业使用，无须署名；建议保留来源，方便学术追溯。' },
    'CC-BY-4.0': { label: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', explanation: '可复制、修改与商业使用。使用时须注明作者、提供许可链接，并说明是否修改。' }
  };
  function classify(item) {
    const taxonomy = window.ScanSciBrowseTaxonomy;
    const [domain, title] = taxonomy.assets[item.id] || taxonomy.subcategories[item.subcategory];
    return { ...item, domain, subcategory: `${domain}/${title}`, subcategory_title: title };
  }
  const EXPANDED = (window.ScanSciExpandedAssets || []).map(classify);
  const WHOLE_PLANTS = (window.ScanSciPlantAssets || []).map(classify);
  const STARTER = (window.ScanSciStarterAssets || []).map(classify);
  const DEMOS = [...WHOLE_PLANTS, ...EXPANDED, ...STARTER, ...[
    { id: 'demo-seedling', title: '对生叶幼苗', category: 'plants', tags: ['植物', '幼苗', '根系'], description: '对生叶、茎与根系的矢量示意。', preview_url: './assets/demo-seedling.svg' },
    { id: 'demo-incubator', title: '实验室培养箱', category: 'laboratory', tags: ['培养箱', '实验仪器'], description: '带观察窗与搁板的培养箱示意。', preview_url: './assets/demo-incubator.svg' },
    { id: 'demo-station', title: '环境监测站', category: 'ecology', tags: ['环境监测', '采样', '水体'], description: '监测建筑、屋顶传感器与水体采样池的组合示意。', preview_url: './assets/demo-station.svg' }
  ].map(item => classify({ ...item, demo: true, author: '本地原创示例', status: 'demo', license: '', source_url: '' }))];
  const LOCAL_PAGE_SIZE = 24;
  const original = { domain: '', subcategory: '' };
  const MAX_SVG_BYTES = 200 * 1024;
  const $ = id => document.getElementById(id);
  const state = { user: null, canReview: false, sessionAvailable: false, scope: 'public', demo: false, category: '', query: '', page: 0, hasMore: false, items: [], listRequest: 0, controller: null, detail: null, detailScope: '', svg: '', fileVersion: 0, objectURL: '', uploadBusy: false, moderationBusy: false, authBusy: false, afterLogin: false };

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = String(value);
    return element;
  }

  function message(id, text, error = false) {
    $(id).textContent = text;
    $(id).classList.toggle('error', error);
  }

  function forgetSession() {
    state.user = null;
    state.canReview = false;
    state.sessionAvailable = false;
    state.afterLogin = false;
    if (state.scope !== 'public') {
      state.scope = 'public';
      state.controller?.abort();
      state.listRequest++;
      state.items = [];
      state.hasMore = false;
      $('gallery').replaceChildren();
      $('gallery').setAttribute('aria-busy', 'false');
      $('loadMoreButton').hidden = true;
      $('resultsTitle').textContent = '社区素材';
      $('resultsCount').textContent = '请重新登录';
      showEmpty('登录已失效', '请重新登录后查看投稿，或重新连接社区素材。', true);
    }
    if (state.detailScope !== 'public') {
      $('detailDialog').close();
      state.detail = null;
    }
    renderSession();
  }

  async function api(path, { method = 'GET', body, signal, strict = true } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 15000);
    try {
      const response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || data.ok === false || (strict && data.ok !== true)) {
        if (response.status === 401) forgetSession();
        const known = { invalid_email: '请输入有效的邮箱地址。', invalid_code: '验证码不正确。', invalid_or_expired_code: '验证码无效或已过期。', too_many_requests: '操作过于频繁，请稍后再试。', too_many_attempts: '尝试次数过多，请重新发送验证码。', provider_unavailable: '邮件服务暂不可用，请稍后重试。' };
        const fallback = response.status === 401 ? '登录已失效，请重新登录。' : response.status === 403 ? '当前账号没有执行此操作的权限。' : response.status === 413 ? 'SVG 超出 200 KiB 限制。' : response.status === 400 || response.status === 422 ? '提交内容未通过验证，请检查文件、字段与授权选择。' : '服务暂不可用，请稍后重试。';
        const backendError = typeof data?.error === 'string' ? data.error : '';
        const symbolsError = /^\/api\/symbols(?:[/?]|$)/.test(path) && /[\u3400-\u9fff]/u.test(backendError)
          ? backendError.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 240) : '';
        // Display bounded service text through textContent; auth keeps its known code mapping.
        throw new Error(known[backendError] || symbolsError || fallback);
      }
      return data;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error.name === 'AbortError') throw new Error('连接超时，请稍后重试。');
      if (error instanceof TypeError) throw new Error('无法连接服务，请检查网络后重试。');
      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  function renderSession() {
    $('loginButton').hidden = !!state.user;
    $('account').hidden = !state.user;
    // Account identifiers stay in this private header and never become public author defaults.
    $('account').textContent = state.user ? '已登录' : '';
    if (!state.user || !state.canReview) $('moderationForm').hidden = true;
    document.querySelectorAll('[data-scope]').forEach(button => {
      const scope = button.dataset.scope;
      button.hidden = scope === 'mine' ? !state.sessionAvailable || !state.user : scope === 'review' ? !state.sessionAvailable || !state.user || !state.canReview : false;
      button.setAttribute('aria-pressed', String(scope === state.scope && !state.demo));
    });
  }

  async function loadSession() {
    if (!COMMUNITY_ENABLED) return false;
    try {
      const data = await api('/api/symbols/session');
      state.user = data.user && typeof data.user.id === 'string' ? data.user : data.user && typeof data.user.id === 'number' ? data.user : null;
      state.canReview = !!state.user && data.can_review === true;
      state.sessionAvailable = true;
      $('sessionNotice').hidden = true;
      if ((state.scope === 'mine' && !state.user) || (state.scope === 'review' && !state.canReview)) forgetSession();
      renderSession();
      return true;
    } catch (error) {
      forgetSession();
      $('sessionNotice').textContent = `登录状态暂不可用。${error.message}`;
      $('sessionNotice').hidden = false;
      return false;
    }
  }

  function showEmpty(title, copy, retry = false) {
    $('emptyState').hidden = false;
    $('emptyTitle').textContent = title;
    $('emptyCopy').textContent = copy;
    $('retryButton').hidden = !retry;
  }

  function fileURL(item, download = false) {
    if (item.demo) return item.preview_url + (item.visual_revision ? `?v=${encodeURIComponent(item.visual_revision)}` : '');
    const canonical = `/api/symbols/${encodeURIComponent(String(item.id))}/file`;
    try {
      const value = new URL((download ? item.download_url : item.preview_url) || canonical, location.origin);
      if (value.origin === location.origin && value.pathname === canonical) {
        // Only the file endpoint for this item may receive preview or download requests.
        return canonical + (download ? '?download=1' : '');
      }
    } catch { /* Use the contract's canonical same-origin file URL. */ }
    return canonical + (download ? '?download=1' : '');
  }

  function preview(item, target, lazy = false) {
    const img = node('img');
    img.alt = item.title || '科研素材预览';
    img.decoding = 'async';
    if (lazy) img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => { img.replaceWith(node('span', 'image-error', '预览暂不可用')); }, { once: true });
    img.src = fileURL(item);
    target.append(img);
  }

  function statusLabel(item) {
    return item.demo ? (item.local_original ? 'ScanSci 原创素材' : item.license ? '平台原创素材' : '预览示例') : ({ pending: '待审核', published: '已发布', rejected: '已退回' }[item.status] || '状态未知');
  }

  function renderCards() {
    const fragment = document.createDocumentFragment();
    for (const item of state.items) {
      const card = node('article', 'symbol-card');
      const button = node('button', 'card-button');
      button.type = 'button';
      button.setAttribute('aria-label', `查看 ${item.title} 的详情`);
      const art = node('div', `card-preview${String(item.id).startsWith('whole-') ? ' whole-plant' : ''}`);
      preview(item, art, true);
      const info = node('div', 'card-info');
      if (item.status !== 'published' && !item.demo) info.append(node('span', `status-badge ${item.status === 'rejected' ? 'rejected' : ''}`, statusLabel(item)));
      const heading = node('div', 'card-heading');
      heading.append(node('h3', '', item.title));
      info.append(heading);
      if (!item.demo || item.license) info.append(node('p', 'card-author', item.author || '未提供署名'));
      const meta = node('div', 'card-meta');
      meta.append(node('span', '', item.subcategory_title || CATEGORIES[item.category] || CATEGORIES.other));
      if (!item.demo || item.license) meta.append(node('span', 'card-license', LICENSES[item.license]?.label || '许可信息待确认'));
      info.append(meta);
      button.append(art, info);
      button.addEventListener('click', () => openDetail(item));
      card.append(button);
      fragment.append(card);
    }
    $('gallery').replaceChildren(fragment);
  }

  async function loadItems(append = false) {
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;
    const request = ++state.listRequest;
    const nextPage = append ? state.page + 1 : 1;
    if (!append) { state.items = []; state.page = 0; $('gallery').replaceChildren(); }
    $('emptyState').hidden = true;
    $('gallery').setAttribute('aria-busy', 'true');
    $('loadMoreButton').hidden = true;
    message('pageMessage', '');
    $('resultsCount').textContent = '正在加载…';
    $('resultsTitle').textContent = state.demo ? '原创素材与示例' : ({ public: '社区素材', mine: '我的投稿', review: '待审核' }[state.scope]);
    $('demoNotice').hidden = !state.demo;
    $('demoNotice').textContent = '按对象大类和小类查找，输入物种、器官或场景名称可进一步搜索。';
    $('originalFilters').hidden = !state.demo;
    document.querySelector('.category-row').hidden = state.demo;
    $('demoToggle').setAttribute('aria-pressed', String(state.demo));
    $('demoToggle').textContent = state.demo ? '返回社区' : '原创素材';
    renderSession();
    try {
      let items, localTotal = 0;
      if (state.demo) {
        const source = DEMOS;
        const matches = source.filter(item => (!original.domain || item.domain === original.domain) && (!original.subcategory || item.subcategory === original.subcategory) && [item.title, item.author, item.description, item.domain, item.subcategory_title, ...item.tags].join(' ').toLowerCase().includes(state.query.toLowerCase()));
        localTotal = matches.length;
        items = matches.slice((nextPage - 1) * LOCAL_PAGE_SIZE, nextPage * LOCAL_PAGE_SIZE);
        state.hasMore = nextPage * LOCAL_PAGE_SIZE < localTotal;
      } else {
        const params = new URLSearchParams({ scope: state.scope, q: state.query, category: state.category, page: String(nextPage) });
        const data = await api(`/api/symbols?${params}`, { signal: controller.signal });
        if (request !== state.listRequest) return;
        if (!Array.isArray(data.items) || data.page !== nextPage || typeof data.has_more !== 'boolean') throw new Error('服务返回的数据格式暂不兼容，请稍后重试。');
        items = data.items.filter(item => item && ['string', 'number'].includes(typeof item.id) && (state.scope !== 'public' || item.status === 'published')).map(item => ({ ...item, demo: false, tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [] }));
        state.hasMore = data.has_more;
      }
      if (request !== state.listRequest) return;
      state.items = append ? [...state.items, ...items.filter(item => !state.items.some(existing => String(existing.id) === String(item.id)))] : items;
      state.page = nextPage;
      renderCards();
      $('resultsCount').textContent = state.demo ? `已显示 ${state.items.length} / ${localTotal} 件` : `已显示 ${state.items.length} 份${state.hasMore ? ' · 还有更多' : ''}`;
      $('loadMoreButton').textContent = '加载更多';
      $('loadMoreButton').hidden = !state.hasMore;
      if (!state.items.length) {
        const filtered = state.query || (state.demo ? original.domain || original.subcategory : state.category);
        showEmpty(filtered ? '没有匹配的素材' : state.scope === 'mine' ? '暂无投稿' : state.scope === 'review' ? '暂无待审核投稿' : '暂无公开素材', filtered ? '换个关键词，或选择全部分类。' : state.scope === 'mine' ? '点击「上传 SVG」提交素材。' : state.scope === 'review' ? '新的投稿会显示在这里。' : '上传 SVG，或浏览原创素材。');
      }
    } catch (error) {
      if (request !== state.listRequest || controller.signal.aborted) return;
      $('resultsCount').textContent = append ? `已显示 ${state.items.length} 份 · 加载中断` : '连接未成功';
      if (append) { message('pageMessage', `加载更多失败。${error.message}`, true); $('loadMoreButton').hidden = false; $('loadMoreButton').textContent = '重试加载更多'; }
      else showEmpty('暂时无法连接素材库', `${error.message} 可点击「原创素材」浏览内置素材。`, true);
    } finally {
      if (request === state.listRequest) $('gallery').setAttribute('aria-busy', 'false');
    }
  }

  function safeSource(value) {
    if (!value) return null;
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
  }

  function openDetail(item) {
    state.detail = item;
    state.detailScope = state.scope;
    $('detailPreview').replaceChildren();
    $('detailPreview').classList.toggle('whole-plant', String(item.id).startsWith('whole-'));
    preview(item, $('detailPreview'));
    $('detailTitle').textContent = item.title;
    $('detailCategory').textContent = `${item.domain ? item.domain + ' / ' + item.subcategory_title : CATEGORIES[item.category] || CATEGORIES.other} / SVG`;
    $('detailAuthor').textContent = `作者 · ${item.author || '未提供署名'}`;
    $('detailDescription').textContent = item.description || '作者暂未添加说明。';
    $('detailTags').replaceChildren(...item.tags.map(tag => node('span', 'tag', tag)));
    $('detailStatus').textContent = statusLabel(item);
    $('detailLicense').replaceChildren();
    const license = LICENSES[item.license];
    if (license) {
      const link = node('a', '', `${license.label} ↗`);
      link.href = license.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      $('detailLicense').append(link);
    } else $('detailLicense').textContent = item.local_original ? 'ScanSci 原创素材' : '待作者确认';
    $('licenseExplanation').textContent = license ? license.explanation : item.local_original ? '可下载 SVG，在矢量编辑器中按部件修改。' : '此素材尚未确认公开使用许可。';
    const date = new Date(item.published_at || item.created_at || '');
    $('detailDate').textContent = Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('zh-CN');
    const source = safeSource(item.source_url);
    $('sourceLink').hidden = !source;
    $('sourceLink').removeAttribute('href');
    if (source) $('sourceLink').href = source;
    const reason = !item.demo && state.scope !== 'public' && item.status === 'rejected' && item.reason;
    $('rejectionNotice').hidden = !reason;
    $('rejectionNotice').textContent = reason ? `退回原因：${item.reason}` : '';
    $('attributionText').value = license ? `《${item.title}》— ${item.author || '未提供署名'}，${license.label}（${license.url}）。来源：${source || `${location.origin}/symbols/`}；素材 ID：${item.id}。${item.license === 'CC-BY-4.0' ? '修改说明：请按实际使用情况填写。' : ''}` : '本地示例 / 未公开投稿；授权待作者确认。';
    $('copyAttribution').hidden = !license;
    $('downloadLink').hidden = !license && !item.local_original;
    $('downloadLink').removeAttribute('href');
    if (license || item.local_original) $('downloadLink').href = fileURL(item, true);
    $('demoDownloadNote').hidden = !item.demo || !!license || !!item.local_original;
    const published = item.status === 'published';
    $('moderationForm').hidden = item.demo || !state.user || !state.canReview || !(published || (state.scope === 'review' && item.status === 'pending'));
    $('moderationTitle').textContent = published ? '已发布素材管理' : '投稿审核';
    $('moderationHint').textContent = published ? '（撤下时必填，投稿者可见）' : '（退回时必填，投稿者可见）';
    $('moderationReason').placeholder = published ? '说明撤下原因，素材将从社区隐藏' : '说明需要修改或补充的内容';
    $('rejectButton').textContent = published ? '撤下素材' : '退回投稿';
    $('publishButton').hidden = published;
    $('moderationForm').reset();
    message('detailMessage', '');
    $('detailDialog').showModal();
  }

  function resetFile() {
    state.fileVersion++;
    state.svg = '';
    if (state.objectURL) URL.revokeObjectURL(state.objectURL);
    state.objectURL = '';
    $('uploadPreview').replaceChildren();
    $('uploadPreview').hidden = true;
    $('fileLabel').textContent = '拖入 SVG 文件，或点击选择';
  }

  function validatePreview(xml) {
    const stack = [[xml.documentElement, 1, false]];
    let count = 0;
    while (stack.length) {
      const [element, depth, inClipPath] = stack.pop();
      if (++count > 5000) throw new Error('SVG 超过 5000 个 XML 节点，请精简后上传。');
      if (depth > 48) throw new Error('SVG 嵌套超过 48 层，请减少分组层级后上传。');
      const isElement = element.nodeType === 1;
      const insideClip = inClipPath || (isElement && element.localName.toLowerCase() === 'clippath');
      if (isElement) {
        if (/^(use|filter|mask|foreignObject|script)$/i.test(element.localName)) throw new Error('预览不支持 use、filter、mask、foreignObject 或 script，请导出为精简的静态 SVG。');
        const style = element.getAttribute('style') || '';
        if (insideClip && (element.hasAttribute('clip-path') || /clip-path\s*:/i.test(style) || element.style?.getPropertyValue('clip-path'))) throw new Error('clipPath 内部不支持再次引用裁剪路径，请简化裁剪结构后上传。');
      }
      for (const child of element.childNodes) stack.push([child, depth + 1, insideClip]);
    }
  }

  async function chooseFile(file) {
    if (state.uploadBusy) return;
    resetFile();
    const version = state.fileVersion;
    message('uploadMessage', '');
    if (!file) return;
    try {
      if (!/\.svg$/i.test(file.name)) throw new Error('请选择 .svg 格式的文件。');
      if (!file.size || file.size > MAX_SVG_BYTES) throw new Error('SVG 文件必须大于 0 字节且不超过 200 KiB。');
      const svg = await file.text();
      if (version !== state.fileVersion) return;
      if (new TextEncoder().encode(svg).length > MAX_SVG_BYTES) throw new Error('SVG 内容超过 200 KiB，请精简后上传。');
      if (/<!DOCTYPE|<!ENTITY/i.test(svg)) throw new Error('请移除 SVG 中的 DOCTYPE 或 ENTITY 声明后上传。');
      // Parse only in an inert XML document. Uploaded markup is never inserted into the page.
      const xml = new DOMParser().parseFromString(svg, 'image/svg+xml');
      if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'svg' || xml.documentElement.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('文件不是有效 SVG，请检查文件内容。');
      validatePreview(xml);
      state.svg = svg;
      state.objectURL = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const img = node('img');
      img.alt = '所选投稿文件预览';
      img.src = state.objectURL;
      img.addEventListener('error', () => { img.replaceWith(node('span', 'image-error', '无法生成预览，请检查 SVG')); }, { once: true });
      $('uploadPreview').append(img);
      $('uploadPreview').hidden = false;
      $('fileLabel').textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KiB`;
    } catch (error) { if (version === state.fileVersion) { $('svgFile').value = ''; message('uploadMessage', error.message, true); } }
  }

  function openUpload() { message('uploadMessage', ''); $('uploadDialog').showModal(); }

  async function contribute() {
    if ($('authDialog').open || $('uploadDialog').open) return;
    const available = await loadSession();
    if (available && state.user) openUpload();
    else { state.afterLogin = true; message('authMessage', available ? '' : '登录状态服务暂不可用，登录后将重新检查。', !available); $('authDialog').showModal(); }
  }

  async function submitUpload(event) {
    event.preventDefault();
    if (state.uploadBusy) return;
    if (!state.user || !state.sessionAvailable) { message('uploadMessage', '请关闭投稿窗口并重新登录；已填内容会保留。', true); return; }
    if (!state.svg) { message('uploadMessage', '请先选择有效的 SVG 文件。', true); $('svgFile').focus(); return; }
    const fields = new FormData($('uploadForm'));
    const title = String(fields.get('title') || '').trim();
    const author = String(fields.get('author') || '').trim();
    const description = String(fields.get('description') || '').trim();
    const source = String(fields.get('source_url') || '').trim();
    const tags = [...new Set(String(fields.get('tags') || '').split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
    if (!title || !author) { message('uploadMessage', '请填写素材名称和公开作者署名。', true); return; }
    if (title.length > 80 || author.length > 80 || description.length > 1000) { message('uploadMessage', '素材名称和作者署名各不超过 80 字，说明不超过 1000 字。', true); return; }
    if (tags.length > 8 || tags.some(tag => tag.length > 24)) { message('uploadMessage', '最多填写 8 个标签，每个标签不超过 24 个字符。', true); return; }
    if (source.length > 500 || (source && !safeSource(source))) { message('uploadMessage', '来源须为不含账号密码的公开 HTTPS 链接，且不超过 500 个字符。', true); return; }
    const category = fields.get('category');
    const license = fields.get('license');
    if (!Object.hasOwn(CATEGORIES, category) || !Object.hasOwn(LICENSES, license) || !$('rightsConfirmed').checked) { message('uploadMessage', '请选择分类、授权方式并确认素材权利。', true); return; }
    state.uploadBusy = true;
    $('uploadFields').disabled = true;
    message('uploadMessage', '正在提交，请稍候…');
    try {
      const data = await api('/api/symbols', { method: 'POST', body: { svg: state.svg, title, description, author, category, tags, license, source_url: source, rights_confirmed: true } });
      if (!data.id || data.status !== 'pending') throw new Error('服务未返回明确的投稿结果。请先查看「我的投稿」，避免重复提交。');
      state.uploadBusy = false;
      $('uploadForm').reset();
      resetFile();
      $('uploadDialog').close();
      state.demo = false;
      state.scope = 'mine';
      state.query = '';
      $('searchInput').value = '';
      setCategory('');
      await loadItems();
      message('pageMessage', '投稿已提交，状态为「待审核」。感谢分享！');
    } catch (error) { message('uploadMessage', `${error.message} 如提交结果不明确，请先查看「我的投稿」，确认后再重试。`, true); }
    finally { state.uploadBusy = false; $('uploadFields').disabled = false; }
  }

  async function moderate(event) {
    event.preventDefault();
    const item = state.detail;
    const status = event.submitter?.value;
    if (state.moderationBusy || !item || item.demo || !state.user || !state.canReview || !['published', 'rejected'].includes(status)) return;
    const withdrawing = item.status === 'published';
    if (withdrawing ? status !== 'rejected' : state.detailScope !== 'review' || item.status !== 'pending') return;
    const reason = $('moderationReason').value.trim();
    if (reason.length > 500) { message('detailMessage', '审核说明不超过 500 字。', true); return; }
    if (status === 'rejected' && !reason) { message('detailMessage', withdrawing ? '请填写撤下原因，投稿者将可查看此说明。' : '请填写退回原因，帮助投稿者完善素材。', true); $('moderationReason').focus(); return; }
    state.moderationBusy = true;
    $('moderationFields').disabled = true;
    message('detailMessage', '正在保存审核结果…');
    try {
      await api(`/api/symbols/${encodeURIComponent(String(item.id))}/moderate`, { method: 'POST', body: { status, reason } });
      state.moderationBusy = false;
      $('detailDialog').close();
      await loadItems();
      message('pageMessage', status === 'published' ? '素材已审核发布。' : withdrawing ? '素材已从社区撤下，作者可查看审核说明。' : '投稿已退回，作者可查看退回原因。');
    } catch (error) { message('detailMessage', error.message, true); }
    finally { state.moderationBusy = false; $('moderationFields').disabled = false; }
  }

  function setCategory(value) {
    state.category = value;
    $('allCategories').setAttribute('aria-pressed', String(!value));
    document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === value)));
  }

  for (const [id, label] of Object.entries(CATEGORIES)) {
    const button = node('button', 'category-chip', label);
    button.type = 'button';
    button.dataset.category = id;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => { setCategory(id); void loadItems(); });
    $('categories').append(button);
    const option = node('option', '', label);
    option.value = id;
    $('uploadCategory').append(option);
  }
  $('allCategories').addEventListener('click', () => { setCategory(''); void loadItems(); });
  document.querySelectorAll('[data-scope]').forEach(button => button.addEventListener('click', () => {
    const scope = button.dataset.scope;
    if ((scope === 'mine' && !state.user) || (scope === 'review' && !state.canReview)) return;
    state.scope = scope;
    state.demo = false;
    void loadItems();
  }));
  function populateSubcategories() {
    const items = DEMOS.filter(item => !original.domain || item.domain === original.domain);
    const groups = new Map();
    for (const item of items) {
      const group = groups.get(item.subcategory) || { title: item.subcategory_title, count: 0 };
      group.count++; groups.set(item.subcategory, group);
    }
    const all = node('option', '', original.domain ? `全部小类 · ${groups.size} 类` : '先选择大类'); all.value = '';
    $('subcategoryFilter').replaceChildren(all, ...(original.domain ? [...groups].map(([id, group]) => {
      const option = node('option', '', `${group.title} · ${group.count} 件`); option.value = id; return option;
    }) : []));
    $('subcategoryFilter').disabled = !original.domain;
  }
  function populateDomains() {
    const groups = new Map();
    for (const item of DEMOS) groups.set(item.domain, (groups.get(item.domain) || 0) + 1);
    const all = node('option', '', `全部大类 · ${groups.size} 类`); all.value = '';
    $('domainFilter').replaceChildren(all, ...[...groups].map(([id, count]) => {
      const option = node('option', '', `${id} · ${count} 件`); option.value = id; return option;
    }));
    $('domainFilter').value = original.domain;
    populateSubcategories();
  }
  populateDomains();
  $('domainFilter').addEventListener('change', () => {
    original.domain = $('domainFilter').value; original.subcategory = ''; populateSubcategories(); void loadItems();
  });
  $('subcategoryFilter').addEventListener('change', () => { original.subcategory = $('subcategoryFilter').value; void loadItems(); });
  function toggleDemo() { state.demo = !state.demo; if (state.demo) state.scope = 'public'; void loadItems(); }
  $('demoToggle').addEventListener('click', toggleDemo);
  $('searchForm').addEventListener('submit', event => { event.preventDefault(); state.query = $('searchInput').value.trim().slice(0, 80); void loadItems(); });
  $('searchInput').addEventListener('input', () => { if (!$('searchInput').value && state.query) { state.query = ''; void loadItems(); } });
  $('loadMoreButton').addEventListener('click', () => { void loadItems(true); });
  $('retryButton').addEventListener('click', () => { void Promise.all([loadSession(), loadItems()]); });
  $('contributeButton').addEventListener('click', () => { void contribute(); });
  $('loginButton').addEventListener('click', () => { state.afterLogin = false; message('authMessage', ''); $('authDialog').showModal(); });
  $('uploadForm').addEventListener('submit', submitUpload);
  $('moderationForm').addEventListener('submit', moderate);
  $('svgFile').addEventListener('change', event => { void chooseFile(event.target.files[0]); });
  for (const type of ['dragenter', 'dragover']) $('dropZone').addEventListener(type, event => { event.preventDefault(); if (!state.uploadBusy) $('dropZone').classList.add('dragging'); });
  for (const type of ['dragleave', 'drop']) $('dropZone').addEventListener(type, event => { event.preventDefault(); $('dropZone').classList.remove('dragging'); });
  $('dropZone').addEventListener('drop', event => {
    if (state.uploadBusy) return;
    if (event.dataTransfer.files.length !== 1) { message('uploadMessage', '请每次拖入一个 SVG 文件。', true); return; }
    $('svgFile').value = '';
    void chooseFile(event.dataTransfer.files[0]);
  });

  document.querySelectorAll('dialog').forEach(dialog => {
    const busy = () => dialog.id === 'uploadDialog' ? state.uploadBusy : dialog.id === 'detailDialog' ? state.moderationBusy : state.authBusy;
    dialog.querySelector('[data-close]').addEventListener('click', () => { if (!busy()) dialog.close(); });
    dialog.addEventListener('cancel', event => { if (busy()) event.preventDefault(); });
    dialog.addEventListener('close', () => {
      if (dialog.id === 'uploadDialog') { resetFile(); $('svgFile').value = ''; }
      if (dialog.id === 'detailDialog') { state.detail = null; $('detailPreview').replaceChildren(); }
      if (dialog.id === 'authDialog') { $('authCode').value = ''; state.afterLogin = false; }
    });
  });
  $('copyAttribution').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('attributionText').value); message('detailMessage', '署名已复制。'); }
    catch { $('attributionText').focus(); $('attributionText').select(); message('detailMessage', '已选中署名文字，请手动复制。'); }
  });

  let codeCooldownUntil = 0;
  $('sendCode').addEventListener('click', async () => {
    if (state.authBusy || Date.now() < codeCooldownUntil) return;
    const input = $('authEmail');
    input.value = input.value.trim();
    if (!input.reportValidity()) return;
    state.authBusy = true;
    $('authFields').disabled = true;
    message('authMessage', '正在发送验证码…');
    try {
      await api('/api/auth/email/request-code', { method: 'POST', body: { email: input.value.toLowerCase() }, strict: false });
      message('authMessage', '验证码已发送，请查收邮箱。');
      codeCooldownUntil = Date.now() + 60000;
      const timer = setInterval(() => {
        const seconds = Math.max(0, Math.ceil((codeCooldownUntil - Date.now()) / 1000));
        $('sendCode').textContent = seconds ? `${seconds} 秒后重发` : '发送验证码';
        $('sendCode').disabled = seconds > 0;
        if (!seconds) clearInterval(timer);
      }, 1000);
      $('sendCode').disabled = true;
      $('sendCode').textContent = '60 秒后重发';
    } catch (error) { message('authMessage', error.message, true); }
    finally { state.authBusy = false; $('authFields').disabled = false; }
  });
  $('authForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (state.authBusy) return;
    state.authBusy = true;
    $('authFields').disabled = true;
    message('authMessage', '正在验证…');
    const continueUpload = state.afterLogin;
    try {
      await api('/api/auth/email/verify-code', { method: 'POST', body: { email: $('authEmail').value.trim().toLowerCase(), code: $('authCode').value.trim() }, strict: false });
      if (!await loadSession() || !state.user) throw new Error('邮箱验证已完成，素材库登录状态暂未就绪。请稍后重新连接。');
      state.authBusy = false;
      $('authDialog').close();
      if (continueUpload) openUpload();
      else void loadItems();
    } catch (error) { message('authMessage', error.message, true); }
    finally { state.authBusy = false; $('authFields').disabled = false; }
  });

  // No account data or unpublished submissions are persisted in browser storage.
  window.addEventListener('pagehide', () => { if (state.objectURL) URL.revokeObjectURL(state.objectURL); });
  state.demo = !COMMUNITY_ENABLED || new URLSearchParams(location.search).get('demo') === '1';
  void Promise.all([loadSession(), loadItems()]);
})();
