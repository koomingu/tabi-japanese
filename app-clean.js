(() => {
  'use strict';

  const phrases = window.TABI_PHRASES;
  const categoryMeta = window.TABI_META;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const storageKey = name => `tabi-${name}`;

  const readList = name => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(name)) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const state = {
    favorites: readList('favorites'),
    views: readList('views'),
    activePhrase: null,
    previousScreen: 'home',
    reviewItems: [],
    reviewIndex: 0
  };

  function saveState() {
    localStorage.setItem(storageKey('favorites'), JSON.stringify(state.favorites));
    localStorage.setItem(storageKey('views'), JSON.stringify(state.views));
  }

  function record(name, data = {}) {
    const events = readList('events');
    events.unshift({ name, data, at: new Date().toISOString() });
    localStorage.setItem(storageKey('events'), JSON.stringify(events.slice(0, 100)));
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function navigate(screen, activeNav = screen) {
    $$('.screen').forEach(element => element.classList.toggle('active', element.id === `${screen}-screen`));
    $('.topbar').hidden = screen !== 'home';
    $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.nav === activeNav));
    if (screen === 'home') renderHome();
    if (screen === 'history') renderHistory();
    window.scrollTo(0, 0);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      showToast('이 브라우저에서는 음성 재생을 지원하지 않아요.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.82;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    record('audio_play', { text });
  }

  function findPhrase(id) {
    return phrases.find(phrase => phrase.id === id);
  }

  function phraseCard(phrase) {
    return `<article class="phrase-card" data-action="open-phrase" data-id="${phrase.id}">
      <button class="speaker" data-action="speak" data-id="${phrase.id}" aria-label="${phrase.jp} 듣기">▶</button>
      <div class="jp">${phrase.jp}</div><div class="ko">${phrase.ko}</div>
    </article>`;
  }

  function renderCategories() {
    $('#category-grid').innerHTML = Object.entries(categoryMeta).map(([name, [icon, color, description]]) => `
      <button class="category-card" data-action="open-category" data-category="${name}" style="--card:${color}">
        <span class="emoji">${icon}</span><strong>${name}</strong><small>${description} · 10개</small>
      </button>`).join('');
  }

  function renderHome() {
    renderRecent();
    const events = readList('events');
    const audioCount = events.filter(event => event.name === 'audio_play').length;
    $('#stat-views').textContent = state.views.length;
    $('#stat-audio').textContent = audioCount;
    $('#stat-favorites').textContent = state.favorites.length;
    $('#progress-label').textContent = state.views.length
      ? `여행 준비 ${Math.min(100, Math.round((state.views.length / 12) * 100))}%`
      : '';
  }

  function renderRecent() {
    const recent = state.views.slice(0, 3).map(findPhrase).filter(Boolean);
    $('#recent-section').hidden = recent.length === 0;
    $('#recent-list').innerHTML = recent.map(phrase => `
      <button class="recent-item" data-action="open-phrase" data-id="${phrase.id}">
        <span><strong>${phrase.jp}</strong><small>${phrase.ko}</small></span><b>›</b>
      </button>`).join('');
  }

  function openList(type) {
    const list = type === 'popular' ? phrases.slice(0, 12)
      : type === 'favorites' ? phrases.filter(phrase => state.favorites.includes(phrase.id))
      : phrases.filter(phrase => phrase.cat === type);
    const labels = {
      popular: ['QUICK ACCESS', '자주 쓰는 말'],
      favorites: ['SAVED PHRASES', '저장한 표현']
    };
    const [eyebrow, title] = labels[type] || ['SITUATION', type];
    $('#list-eyebrow').textContent = eyebrow;
    $('#list-title').textContent = title;
    $('#list-description').textContent = list.length ? `${list.length}개의 표현을 준비했어요.` : '아직 저장한 표현이 없어요.';
    $('#phrase-list').innerHTML = list.map(phraseCard).join('');
    record('category_open', { type });
    navigate('list', type === 'favorites' ? 'favorites' : '');
  }

  function openPhrase(id, previousScreen = null) {
    const phrase = findPhrase(id);
    if (!phrase) return;
    const currentScreen = $('.screen.active').id.replace('-screen', '');
    state.previousScreen = previousScreen || (currentScreen === 'detail' ? state.previousScreen : currentScreen);
    state.activePhrase = phrase;
    state.views = [id, ...state.views.filter(viewId => viewId !== id)].slice(0, 30);
    saveState();

    $('#detail-category').textContent = phrase.cat;
    $('#detail-japanese').textContent = phrase.jp;
    $('#detail-romaji').textContent = phrase.romaji;
    $('#detail-korean').textContent = phrase.ko;
    $('#detail-use').textContent = phrase.use;
    $('#detail-note').textContent = phrase.note;
    $('#detail-polite').textContent = phrase.jp.startsWith('すみません') ? phrase.jp : `すみません、${phrase.jp}`;
    $('#detail-dialogue').textContent = `나: ${phrase.jp}\n상대: はい、かしこまりました。`;
    $('#detail-favorite').classList.toggle('is-saved', state.favorites.includes(id));

    const related = phrases.filter(item => item.cat === phrase.cat && item.id !== id).slice(0, 2);
    $('#detail-related').innerHTML = related.map(item => `
      <button class="related-item" data-action="open-phrase" data-id="${item.id}">
        <strong>${item.jp}</strong><span>${item.ko}</span>
      </button>`).join('');
    record('phrase_view', { id, category: phrase.cat });
    navigate('detail', '');
  }

  function toggleFavorite() {
    const { id } = state.activePhrase || {};
    if (!id) return;
    const index = state.favorites.indexOf(id);
    const isAdding = index === -1;
    if (isAdding) state.favorites.push(id);
    else state.favorites.splice(index, 1);
    saveState();
    $('#detail-favorite').classList.toggle('is-saved', isAdding);
    showToast(isAdding ? '즐겨찾기에 저장했어요.' : '즐겨찾기에서 삭제했어요.');
  }

  function renderHistory() {
    const history = state.views.map(findPhrase).filter(Boolean);
    $('#history-description').textContent = history.length ? `${history.length}개 표현을 확인했어요.` : '아직 확인한 표현이 없어요.';
    $('#history-list').innerHTML = history.map(phraseCard).join('');
  }

  function startReview() {
    const ids = [...state.favorites, ...state.views];
    const sourceIds = ids.length ? ids : phrases.slice(0, 5).map(phrase => phrase.id);
    state.reviewItems = [...new Set(sourceIds)].map(findPhrase).filter(Boolean).slice(0, 5);
    state.reviewIndex = 0;
    renderReview();
    record('review_start');
    navigate('review', '');
  }

  function renderReview() {
    const phrase = state.reviewItems[state.reviewIndex];
    if (!phrase) return navigate('home');
    $('#review-progress').textContent = `${state.reviewIndex + 1} / ${state.reviewItems.length} 표현`;
    $('#review-korean').textContent = phrase.ko;
    $('#review-japanese').textContent = phrase.jp;
    $('#review-romaji').textContent = phrase.romaji;
    $('#review-answer').hidden = true;
    $('#review-listen').hidden = true;
    $('#review-reveal').hidden = false;
    $('#review-next').textContent = state.reviewIndex === state.reviewItems.length - 1 ? '복습 완료' : '다음 표현 ›';
  }

  function localRecommendation(question) {
    const intents = { 물: '식당-0', 포장: '식당-6', 계산: '식당-7', 메뉴: '식당-1', 추천: '식당-2', 역: '교통-0', 택시: '교통-0', 막차: '교통-5', 가격: '쇼핑-0', 얼마: '쇼핑-0', 카드: '쇼핑-1', 면세: '쇼핑-4', 체크인: '숙소-0', 체크아웃: '숙소-2', 호텔: '숙소-0', 와이파이: '숙소-5', 화장실: '길 묻기-1', 길: '길 묻기-0', 사진: '길 묻기-4', 여권: '긴급 상황-7', 경찰: '긴급 상황-1', 병원: '긴급 상황-3', 구급차: '긴급 상황-2' };
    const matchingId = Object.entries(intents).find(([keyword]) => question.includes(keyword))?.[1];
    return findPhrase(matchingId) || phrases[0];
  }

  function renderLocalAnswer(question) {
    const phrase = localRecommendation(question);
    const polite = /정중|공손/.test(question) ? `<br>더 정중하게: すみません、${phrase.jp}` : '';
    $('#ask-answer').innerHTML = `<article class="ai-card"><p class="eyebrow">TABi'S RECOMMENDATION</p>
      <h3>${phrase.jp}</h3><p class="answer-ko">${phrase.romaji}<br>${phrase.ko}</p>
      <small>${phrase.use}<br>${phrase.note}${polite}</small><br>
      <button data-action="speak" data-id="${phrase.id}">▶ 일본어로 듣기</button>
      <button class="answer-detail" data-action="open-phrase" data-id="${phrase.id}">자세히 보기</button></article>`;
    record('ai_question', { source: 'local' });
  }

  async function askAi(question) {
    if (!window.TABI_AI_ENDPOINT) return renderLocalAnswer(question);
    $('#ask-answer').innerHTML = '<article class="ai-card"><p class="eyebrow">TABi IS THINKING</p><small>여행에 맞는 표현을 고르고 있어요.</small></article>';
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (window.TABI_SUPABASE_ANON_KEY) {
        headers.apikey = window.TABI_SUPABASE_ANON_KEY;
        headers.Authorization = `Bearer ${window.TABI_SUPABASE_ANON_KEY}`;
      }
      const response = await fetch(window.TABI_AI_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ question }) });
      const answer = await response.json();
      if (!response.ok || answer.error) throw new Error(answer.error || 'AI request failed');
      $('#ask-answer').innerHTML = `<article class="ai-card"><p class="eyebrow">AI RECOMMENDATION</p>
        <h3></h3><p class="answer-ko"></p><small></small><br><button data-action="speak-ai">▶ 일본어로 듣기</button></article>`;
      const card = $('.ai-card');
      card.querySelector('h3').textContent = answer.japanese || '';
      card.querySelector('.answer-ko').textContent = `${answer.pronunciation || ''}\n${answer.meaning || ''}`;
      card.querySelector('small').textContent = `${answer.usage || ''}\n${answer.caution || ''}`;
      card.querySelector('[data-action="speak-ai"]').dataset.text = answer.japanese || '';
      record('ai_question', { source: 'api' });
    } catch {
      showToast('AI 연결에 실패해 기본 추천을 보여드려요.');
      renderLocalAnswer(question);
    }
  }

  function renderSearch(query) {
    const normalized = query.trim().toLowerCase();
    const results = normalized ? phrases.filter(phrase => `${phrase.jp}${phrase.romaji}${phrase.ko}${phrase.cat}`.toLowerCase().includes(normalized)).slice(0, 6) : [];
    $('#search-results').innerHTML = results.map(phraseCard).join('') || (normalized ? '<p class="empty-search">찾는 표현이 없어요. AI 질문을 이용해 보세요.</p>' : '');
    if (normalized) record('search', { query: normalized });
  }

  function handleAction(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, id, category } = target.dataset;
    if (action === 'open-category') openList(category);
    if (action === 'open-phrase') openPhrase(id);
    if (action === 'speak') { event.stopPropagation(); const phrase = findPhrase(id); if (phrase) speak(phrase.jp); }
    if (action === 'speak-ai') speak(target.dataset.text);
  }

  function bindStaticEvents() {
    document.addEventListener('click', handleAction);
    $('#popular-button').addEventListener('click', () => openList('popular'));
    $('#history-button').addEventListener('click', () => navigate('history'));
    $$('.nav-item').forEach(button => button.addEventListener('click', () => button.dataset.nav === 'favorites' ? openList('favorites') : navigate(button.dataset.nav)));
    $$('.back-button').forEach(button => button.addEventListener('click', () => navigate(state.previousScreen)));
    $('#detail-listen').addEventListener('click', () => state.activePhrase && speak(state.activePhrase.jp));
    $('#detail-favorite').addEventListener('click', toggleFavorite);
    $$('.feedback-row button').forEach(button => button.addEventListener('click', () => { button.classList.add('selected'); record('feedback', { type: button.dataset.feedback, id: state.activePhrase?.id }); showToast(button.dataset.feedback === 'helpful' ? '의견을 기록했어요.' : '오류 신고를 기록했어요.'); }));
    $('#global-search').addEventListener('input', event => renderSearch(event.target.value));
    $('#ask-form').addEventListener('submit', event => { event.preventDefault(); const question = $('#ask-input').value.trim(); if (question) { askAi(question); $('#ask-input').value = ''; } });
    $$('#suggestion-chips button').forEach(button => button.addEventListener('click', () => askAi(button.textContent)));
    $('#review-button').addEventListener('click', startReview);
    $('#review-reveal').addEventListener('click', () => { $('#review-answer').hidden = false; $('#review-listen').hidden = false; $('#review-reveal').hidden = true; record('review_reveal'); });
    $('#review-listen').addEventListener('click', () => speak(state.reviewItems[state.reviewIndex].jp));
    $('#review-next').addEventListener('click', () => { if (state.reviewIndex === state.reviewItems.length - 1) { record('review_complete'); navigate('home'); showToast('복습을 완료했어요!'); } else { state.reviewIndex += 1; renderReview(); } });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
    const setNetworkState = () => { $('#offline-note').hidden = navigator.onLine; };
    setNetworkState();
    addEventListener('online', setNetworkState);
    addEventListener('offline', setNetworkState);
  }

  renderCategories();
  bindStaticEvents();
  registerServiceWorker();
  navigate('home');
})();
