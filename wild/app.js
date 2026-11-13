const grid = document.querySelector('#gallery-grid');
const featuredSection = document.querySelector('#featured-section');
const featuredGrid = document.querySelector('#featured-grid');
const search = document.querySelector('#gallery-search');
const count = document.querySelector('#result-count');
const empty = document.querySelector('#empty-state');
const photoDialog = document.querySelector('#photo-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogThumbs = document.querySelector('#dialog-thumbs');
const dialogCounter = document.querySelector('#dialog-counter');
const dialogFeatured = document.querySelector('#dialog-featured');
const dialogPhotoNote = document.querySelector('#dialog-photo-note');
const dialogStage = document.querySelector('.dialog-stage');
const galleryPrev = document.querySelector('#dialog-prev');
const galleryNext = document.querySelector('#dialog-next');
const authDialog = document.querySelector('#auth-dialog');
const authMessage = document.querySelector('#auth-message');
const notice = document.querySelector('#like-notice');
const voteStatus = document.querySelector('#vote-status');
const season = window.WILD_SEASON || { label: '第一届', year: '2025' };
const numberFormat = new Intl.NumberFormat('zh-CN');
const heartIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const ballotIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h16l-1.3 10H5.3L4 10Z"/><path d="m8 10 4-7 4 7M9 15h6"/></svg>';
const votingIcon = '<span class="vote-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16l-1.3 10H5.3L4 10Z"/><path class="vote-paper" d="m8 10 4-7 4 7"/><path d="M9 15h6"/></svg></span>';
let entries = [];
let likes = new Map();
let liked = new Set();
let userId = null;
let likesOnline = false;
let likesLoad;
let pendingAction = null;
let noticeTimer;
const busy = new Set();
const voteEffectTimers = new WeakMap();
let votes = new Map();
let voted = new Set();
let votesOnline = false;
let votesLoad;
let votingOpen = null;
let voteBusy = false;
let voteStateVersion = 0;
let voteCloseTimer;
let activeEntry = null;
let activeIndex = 0;
let touchStartX = null;

function addText(parent, className, content) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = content;
  parent.append(span);
  return span;
}

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 4000);
}

function populateEngagement(container, entry) {
  const like = document.createElement('button');
  like.type = 'button';
  like.className = 'engagement-item like-action';
  like.dataset.likeEntry = entry.number;
  like.setAttribute('aria-label', `点赞 ${entry.name} 的作品`);
  like.setAttribute('aria-pressed', String(liked.has(entry.number)));
  like.innerHTML = heartIcon;
  addText(like, 'like-total', numberFormat.format(likes.get(entry.number) || 0));
  addText(like, 'engagement-label', '赞');
  like.addEventListener('click', () => { void toggleLike(entry); });

  if (voteStatus) {
    const vote = document.createElement('button');
    vote.type = 'button';
    vote.className = 'engagement-item vote-action';
    vote.dataset.voteEntry = entry.number;
    vote.setAttribute('aria-label', `为 ${entry.name} 的作品投票`);
    vote.setAttribute('aria-pressed', String(voted.has(entry.number)));
    vote.disabled = voteBusy || votingOpen === false;
    vote.innerHTML = votingIcon;
    addText(vote, 'vote-total', votesOnline ? numberFormat.format(votes.get(entry.number) || 0) : '—');
    addText(vote, 'engagement-label', '票');
    addText(vote, 'vote-action-label', voted.has(entry.number) ? '已投票' : '投票');
    addText(vote, 'vote-feedback', '').setAttribute('aria-hidden', 'true');
    vote.addEventListener('click', () => { void toggleVote(entry); });
    container.replaceChildren(like, vote);
  } else {
    const vote = document.createElement('span');
    vote.className = 'engagement-item vote-count';
    vote.title = '2025 年第一届历史投票数，保持固定';
    vote.innerHTML = ballotIcon;
    addText(vote, 'vote-total', numberFormat.format(entry.historicalVotes));
    addText(vote, 'engagement-label', '票');
    container.replaceChildren(like, ...(Number.isInteger(entry.historicalVotes) ? [vote] : []));
  }
}

function syncLike(entryNumber) {
  document.querySelectorAll(`[data-like-entry="${entryNumber}"]`).forEach(button => {
    button.setAttribute('aria-pressed', String(liked.has(entryNumber)));
    button.disabled = busy.has(entryNumber);
    button.querySelector('.like-total').textContent = numberFormat.format(likes.get(entryNumber) || 0);
  });
}

function syncVotes() {
  if (!voteStatus) return;
  if (!votesOnline) voteStatus.textContent = '投票状态暂时不可用';
  else if (!votingOpen) voteStatus.textContent = '投票已结束';
  else if (!userId) voteStatus.textContent = '登录后可以投票';
  else voteStatus.textContent = `已投 ${voted.size} / 3 票 · 可以取消后重投`;
  document.querySelectorAll('[data-vote-entry]').forEach(button => {
    const entry = Number(button.dataset.voteEntry);
    button.setAttribute('aria-pressed', String(voted.has(entry)));
    button.disabled = voteBusy || votingOpen === false;
    button.querySelector('.vote-total').textContent = votesOnline ? numberFormat.format(votes.get(entry) || 0) : '—';
    button.querySelector('.vote-action-label').textContent = voted.has(entry) ? '已投票' : '投票';
  });
}

function animateVote(entryNumber, selected) {
  document.querySelectorAll(`[data-vote-entry="${entryNumber}"]`).forEach(button => {
    clearTimeout(voteEffectTimers.get(button));
    button.classList.remove('is-vote-added', 'is-vote-removed');
    button.querySelector('.vote-feedback').textContent = selected ? '+1' : '−1';
    void button.offsetWidth;
    button.classList.add(selected ? 'is-vote-added' : 'is-vote-removed');
    voteEffectTimers.set(button, setTimeout(() => {
      button.classList.remove('is-vote-added', 'is-vote-removed');
    }, 850));
  });
}

function openLogin(type, entryNumber) {
  pendingAction = { type, entryNumber };
  document.querySelector('#auth-title').textContent = type === 'vote' ? '登录后投票' : '登录后点赞';
  authDialog.querySelector('p').textContent = type === 'vote'
    ? '使用 ScanSci 账号登录，为喜欢的作品投票。'
    : '使用 ScanSci 账号，为喜欢的作品点个赞。';
  authMessage.textContent = '';
  if (!authDialog.open) authDialog.showModal();
}

function renderThumbs(entry) {
  dialogThumbs.replaceChildren(...entry.photos.map((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dialog-thumb';
    button.dataset.photoIndex = index;
    button.setAttribute('aria-label', `查看第 ${index + 1} 张照片`);
    const image = document.createElement('img');
    image.src = photo.thumb;
    image.alt = '';
    image.loading = 'lazy';
    button.append(image);
    button.addEventListener('click', () => setDialogPhoto(entry, index));
    return button;
  }));
  dialogThumbs.hidden = entry.photos.length < 2;
}

function setDialogPhoto(entry, index) {
  const total = entry.photos.length;
  activeIndex = (index + total) % total;
  const photo = entry.photos[activeIndex];
  dialogImage.src = photo.src;
  dialogImage.alt = `${entry.name}的野外科研投稿照片，第 ${activeIndex + 1} 张`;
  dialogCounter.textContent = `${activeIndex + 1} / ${total}`;
  dialogCounter.hidden = total < 2;
  dialogFeatured.hidden = !(entry.featured && activeIndex === 0);
  galleryPrev.hidden = total < 2;
  galleryNext.hidden = total < 2;
  dialogPhotoNote.textContent = total > 1 ? `本组共 ${total} 张照片，可用方向键或左右按钮切换。` : '本组收录 1 张照片。';
  dialogThumbs.querySelectorAll('[data-photo-index]').forEach(button => {
    const active = Number(button.dataset.photoIndex) === activeIndex;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'true' : 'false');
    if (active) button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  [activeIndex - 1, activeIndex + 1].forEach(neighbor => {
    if (total < 2) return;
    const image = new Image();
    image.src = entry.photos[(neighbor + total) % total].src;
  });
}

function stepDialog(delta) {
  if (!activeEntry || activeEntry.photos.length < 2) return;
  setDialogPhoto(activeEntry, activeIndex + delta);
}

function openPhoto(entry) {
  activeEntry = entry;
  document.querySelector('#dialog-number').textContent = `NO. ${String(entry.displayNumber ?? entry.number).padStart(2, '0')} / ${entries.length}`;
  document.querySelector('#dialog-batch').textContent = `${season.label} · ${season.year} · ${entry.featured ? '精选 · ' : ''}${entry.photos.length} 张照片`;
  document.querySelector('#dialog-title').textContent = entry.name;
  document.querySelector('#dialog-organization').textContent = entry.organization;
  populateEngagement(document.querySelector('#dialog-engagement'), entry);
  document.querySelector('#dialog-time').textContent = entry.time || '详见原文';
  document.querySelector('#dialog-location').textContent = entry.location || '详见原文';
  document.querySelector('#dialog-story').textContent = entry.story;
  const sourceLink = document.querySelector('#dialog-source');
  sourceLink.hidden = !entry.sourceUrl;
  if (entry.sourceUrl) sourceLink.href = entry.sourceUrl;
  renderThumbs(entry);
  setDialogPhoto(entry, 0);
  photoDialog.showModal();
  document.querySelector('#dialog-close').focus();
}

function cardFor(entry) {
  const cover = entry.photos[0];
  const card = document.createElement('article');
  card.className = `photo-card${entry.featured ? ' is-featured' : ''}`;
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'photo-open';
  open.setAttribute('aria-label', `查看 ${String(entry.displayNumber ?? entry.number).padStart(2, '0')} 号作品：${entry.name}，共 ${entry.photos.length} 张照片`);
  const media = document.createElement('span');
  media.className = 'photo-card-media';
  const image = document.createElement('img');
  image.src = cover.thumb;
  image.alt = `${entry.name}的野外科研投稿照片`;
  image.width = cover.width;
  image.height = cover.height;
  image.loading = 'lazy';
  media.append(image);
  addText(media, 'photo-card-no', String(entry.displayNumber ?? entry.number).padStart(2, '0'));
  addText(media, 'photo-card-arrow', '↗');
  if (entry.featured) addText(media, 'featured-badge', '精选');
  if (entry.photos.length > 1) addText(media, 'photo-count', `${entry.photos.length} 张`);
  const body = document.createElement('span');
  body.className = 'photo-card-body';
  addText(body, 'photo-card-name', entry.name);
  addText(body, 'photo-card-org', entry.organization);
  addText(body, 'photo-card-location', entry.location || `${season.label}作品`);
  open.append(media, body);
  open.addEventListener('click', () => openPhoto(entry));
  const engagement = document.createElement('div');
  engagement.className = 'engagement';
  populateEngagement(engagement, entry);
  card.append(open, engagement);
  return card;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const visible = entries.filter(entry => !query ||
    [entry.name, entry.organization, entry.location, entry.story].join(' ').toLocaleLowerCase().includes(query));
  const featured = visible.filter(entry => entry.featured)
    .sort((a, b) => (a.featuredPosition ?? 99) - (b.featuredPosition ?? 99));
  const archive = visible.filter(entry => !entry.featured).sort((a, b) => a.number - b.number);
  featuredGrid.replaceChildren(...featured.map(cardFor));
  featuredSection.hidden = featured.length === 0;
  grid.replaceChildren(...archive.map(cardFor));
  const photoTotal = visible.reduce((sum, entry) => sum + entry.photos.length, 0);
  count.textContent = `正在展示 ${visible.length} / ${entries.length} 组作品 · ${photoTotal} 张照片`;
  empty.hidden = visible.length !== 0;
}

async function api(path, options = {}) {
  return fetch(`/api${path}`, { credentials: 'same-origin', ...options });
}

async function loadLikes() {
  if (location.protocol === 'file:') return false;
  try {
    const response = await api('/wild-research/likes');
    if (!response.ok) return false;
    const data = await response.json();
    if (!data.ok) return false;
    userId = data.user_id;
    likes = new Map(Object.entries(data.counts).map(([entry, total]) => [Number(entry), Number(total)]));
    liked = new Set(data.liked);
    likesOnline = true;
    entries.forEach(entry => syncLike(entry.number));
    return true;
  } catch {
    return false;
  }
}

async function loadVotes() {
  if (!voteStatus || location.protocol === 'file:') return false;
  const version = voteStateVersion;
  try {
    const response = await api('/wild-research/votes', { cache: 'no-store' });
    if (!response.ok) throw new Error('votes_unavailable');
    const data = await response.json();
    if (!data.ok || version !== voteStateVersion) return false;
    userId = data.user_id;
    votes = new Map(Object.entries(data.counts).map(([entry, total]) => [Number(entry), Number(total)]));
    voted = new Set(data.selected);
    votesOnline = true;
    votingOpen = data.open;
    clearTimeout(voteCloseTimer);
    if (votingOpen) {
      const remaining = Math.max(0, Date.parse(data.closes_at) - Date.parse(data.server_time));
      voteCloseTimer = setTimeout(() => {
        if (remaining > 2147483647) { void loadVotes(); return; }
        votingOpen = false;
        syncVotes();
      }, Math.min(remaining, 2147483647));
    }
    syncVotes();
    return true;
  } catch {
    if (!votesOnline) syncVotes();
    return false;
  }
}

async function toggleVote(entry, selected) {
  if (!votesOnline && location.protocol !== 'file:') {
    await votesLoad;
    if (!votesOnline) await loadVotes();
  }
  if (!votesOnline) {
    showNotice(location.protocol === 'file:'
      ? '本地预览仅展示界面；投票在 ScanSci 网站启用。'
      : '投票服务暂时不可用，请稍后重试。');
    return;
  }
  if (!votingOpen) { showNotice('投票已结束。'); return; }
  if (!userId) { openLogin('vote', entry.number); return; }
  if (voteBusy) return;
  const desired = selected ?? !voted.has(entry.number);
  if (desired && voted.has(entry.number)) { showNotice('已为该作品投过票。'); return; }
  voteBusy = true;
  voteStateVersion++;
  syncVotes();
  let saved = false;
  try {
    const response = await api('/wild-research/votes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry: entry.number, selected: desired, expected_user_id: userId }),
    });
    const data = await response.json();
    if (response.status === 401) {
      userId = null;
      voted.clear();
      openLogin('vote', entry.number);
      return;
    }
    if (data.error === 'account_changed') {
      await loadVotes();
      await loadLikes();
      showNotice('账号已切换，请重新确认投票。');
      return;
    }
    if (data.error === 'voting_closed') {
      votingOpen = false;
      showNotice('投票已结束。');
      return;
    }
    if (data.error === 'vote_limit') {
      voted = new Set(data.selected);
      showNotice('已投满 3 票，可以取消已有投票后再选。');
      return;
    }
    if (!response.ok || !data.ok) throw new Error('vote_failed');
    votes.set(entry.number, data.votes);
    voted = new Set(data.selected);
    saved = voted.has(entry.number) === desired;
  } catch {
    showNotice('投票暂时未保存，请稍后重试。');
  } finally {
    voteBusy = false;
    syncVotes();
    if (saved) animateVote(entry.number, desired);
  }
}

async function toggleLike(entry) {
  if (!likesOnline && location.protocol !== 'file:') {
    await likesLoad;
    if (!likesOnline) await loadLikes();
  }
  if (!likesOnline) {
    showNotice(location.protocol === 'file:'
      ? '本地预览仅展示界面；登录点赞在 ScanSci 网站启用。'
      : '点赞服务暂时不可用，请稍后重试。');
    return;
  }
  if (!userId) {
    openLogin('like', entry.number);
    return;
  }
  if (busy.has(entry.number)) return;
  busy.add(entry.number);
  syncLike(entry.number);
  try {
    const response = await api('/wild-research/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry: entry.number, liked: !liked.has(entry.number), expected_user_id: userId }),
    });
    if (response.status === 401 || response.status === 409) {
      userId = null;
      openLogin('like', entry.number);
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    likes.set(entry.number, data.likes);
    if (data.liked) liked.add(entry.number);
    else liked.delete(entry.number);
  } catch {
    showNotice('点赞暂时未保存，请稍后重试。');
  } finally {
    busy.delete(entry.number);
    syncLike(entry.number);
  }
}

function authError(error) {
  const messages = {
    invalid_email: '请检查邮箱地址。',
    invalid_code: '验证码不正确。',
    invalid_or_expired_code: '验证码无效或已过期。',
    too_many_requests: '操作太频繁，请稍后再试。',
    too_many_attempts: '验证码尝试次数过多，请重新获取。',
  };
  return messages[error] || '登录暂时失败，请稍后重试。';
}

document.querySelector('#github-login').href = `/api/auth/github/start?return_to=${encodeURIComponent(location.pathname + location.search)}`;
document.querySelector('#github-login').addEventListener('click', event => {
  if (!likesOnline && !votesOnline) { event.preventDefault(); return; }
  try { sessionStorage.setItem('wild-pending-action', JSON.stringify(pendingAction)); } catch {}
});
document.querySelector('#send-code').addEventListener('click', async event => {
  const email = document.querySelector('#auth-email');
  if (!email.reportValidity()) return;
  const button = event.currentTarget;
  button.disabled = true;
  authMessage.textContent = '正在发送验证码…';
  try {
    const response = await api('/auth/email/request-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim() }),
    });
    const data = await response.json();
    authMessage.textContent = response.ok ? '验证码已发送，请查收邮箱。' : authError(data.error);
  } catch {
    authMessage.textContent = '验证码发送失败，请稍后重试。';
  } finally {
    button.disabled = false;
  }
});
document.querySelector('#email-login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  authMessage.textContent = '正在登录…';
  try {
    const response = await api('/auth/email/verify-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.querySelector('#auth-email').value.trim(),
        code: document.querySelector('#auth-code').value.trim(),
      }),
    });
    const data = await response.json();
    if (!response.ok) { authMessage.textContent = authError(data.error); return; }
    voteStateVersion++;
    const likesReady = await loadLikes();
    const votesReady = voteStatus ? await loadVotes() : false;
    if ((pendingAction?.type === 'like' && !likesReady) || (pendingAction?.type === 'vote' && !votesReady)) {
      authMessage.textContent = '登录成功，服务暂时不可用，请稍后重试。'; return;
    }
    authDialog.close();
    const action = pendingAction;
    pendingAction = null;
    const entry = entries.find(item => item.number === action?.entryNumber);
    if (entry && action.type === 'vote') await toggleVote(entry, true);
    else if (entry && action.type === 'like') await toggleLike(entry);
  } catch {
    authMessage.textContent = '登录暂时失败，请稍后重试。';
  } finally {
    button.disabled = false;
  }
});

search.addEventListener('input', render);
document.querySelector('#dialog-close').addEventListener('click', () => photoDialog.close());
galleryPrev.addEventListener('click', () => stepDialog(-1));
galleryNext.addEventListener('click', () => stepDialog(1));
document.addEventListener('keydown', event => {
  if (!photoDialog.open) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepDialog(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); stepDialog(1); }
});
dialogStage.addEventListener('touchstart', event => {
  if (event.touches.length === 1) touchStartX = event.touches[0].clientX;
}, { passive: true });
dialogStage.addEventListener('touchend', event => {
  if (touchStartX === null) return;
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 45) stepDialog(distance < 0 ? 1 : -1);
  touchStartX = null;
}, { passive: true });
photoDialog.addEventListener('click', event => { if (event.target === photoDialog) photoDialog.close(); });
document.querySelector('#auth-close').addEventListener('click', () => authDialog.close());
authDialog.addEventListener('click', event => { if (event.target === authDialog) authDialog.close(); });

if (Array.isArray(window.WILD_RESEARCHERS)) {
  entries = window.WILD_RESEARCHERS.slice();
  render();
  likesLoad = loadLikes();
  if (voteStatus) {
    votesLoad = loadVotes();
    setInterval(() => { if (!document.hidden && !voteBusy) void loadVotes(); }, 30000);
  }
  Promise.all([likesLoad, votesLoad]).then(() => {
    let action;
    try {
      action = JSON.parse(sessionStorage.getItem('wild-pending-action'));
      sessionStorage.removeItem('wild-pending-action');
    } catch { return; }
    const entry = entries.find(item => item.number === action?.entryNumber);
    if (!userId || !entry) return;
    if (action.type === 'vote' && voteStatus) void toggleVote(entry, true);
    else if (action.type === 'like') void toggleLike(entry);
  });
} else {
  count.textContent = '影像档案加载失败，请刷新页面重试。';
}
