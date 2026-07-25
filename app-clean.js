(() => {
  'use strict';

  const phrases = window.TABI_PHRASES;
  const categoryMeta = window.TABI_META;
  const quickWords = window.TABI_QUICK_WORDS || {};
  const travelModes = [
    { id: 'water', icon: '💧', title: '물 · 화장실', subtitle: '가장 급할 때', quickCategory: '식당', phraseIds: ['식당-0', '길 묻기-1'] },
    { id: 'order', icon: '🍽️', title: '주문 · 계산', subtitle: '식당과 카페에서', quickCategory: '식당', phraseIds: ['식당-3', '식당-7', '카페-0'] },
    { id: 'route', icon: '🚃', title: '길 · 교통', subtitle: '이동할 때', quickCategory: '교통', phraseIds: ['길 묻기-0', '교통-0', '교통-6'] },
    { id: 'emergency', icon: '🆘', title: '긴급 도움', subtitle: '도움이 필요할 때', quickCategory: '긴급 상황', phraseIds: ['긴급 상황-0', '긴급 상황-1', '긴급 상황-2', '긴급 상황-3'] }
  ];
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
    recentSearches: readList('recent-searches'),
    searchActive: false,
    activePhrase: null,
    previousScreen: 'home',
    reviewItems: [],
    reviewIndex: 0,
    kanaScript: 'hiragana',
    kanaGroup: 'basic'
  };

  const buildKana = rows => rows.flatMap(row => row.split(' ').map(item => item.split(':')));
  const kana = {
    hiragana: buildKana([
      'あ:아 い:이 う:우 え:에 お:오', 'か:카 き:키 く:쿠 け:케 こ:코', 'さ:사 し:시 す:스 せ:세 そ:소', 'た:타 ち:치 つ:츠 て:테 と:토', 'な:나 に:니 ぬ:누 ね:네 の:노', 'は:하 ひ:히 ふ:후 へ:헤 ほ:호', 'ま:마 み:미 む:무 め:메 も:모', 'や:야 ゆ:유 よ:요', 'ら:라 り:리 る:루 れ:레 ろ:로', 'わ:와 を:오 ん:응',
      'が:가 ぎ:기 ぐ:구 げ:게 ご:고', 'ざ:자 じ:지 ず:즈 ぜ:제 ぞ:조', 'だ:다 ぢ:지 づ:즈 で:데 ど:도', 'ば:바 び:비 ぶ:부 べ:베 ぼ:보', 'ぱ:파 ぴ:피 ぷ:푸 ぺ:페 ぽ:포',
      'きゃ:캬 きゅ:큐 きょ:쿄', 'しゃ:샤 しゅ:슈 しょ:쇼', 'ちゃ:차 ちゅ:추 ちょ:초', 'にゃ:냐 にゅ:뉴 にょ:뇨', 'ひゃ:햐 ひゅ:휴 ひょ:효', 'みゃ:먀 みゅ:뮤 みょ:묘', 'りゃ:랴 りゅ:류 りょ:료', 'ぎゃ:갸 ぎゅ:규 ぎょ:교', 'じゃ:자 じゅ:주 じょ:조', 'びゃ:뱌 びゅ:뷰 びょ:뵤', 'ぴゃ:퍄 ぴゅ:퓨 ぴょ:표'
    ]),
    katakana: buildKana([
      'ア:아 イ:이 ウ:우 エ:에 オ:오', 'カ:카 キ:키 ク:쿠 ケ:케 コ:코', 'サ:사 シ:시 ス:스 セ:세 ソ:소', 'タ:타 チ:치 ツ:츠 テ:테 ト:토', 'ナ:나 ニ:니 ヌ:누 ネ:네 ノ:노', 'ハ:하 ヒ:히 フ:후 ヘ:헤 ホ:호', 'マ:마 ミ:미 ム:무 メ:메 モ:모', 'ヤ:야 ユ:유 ヨ:요', 'ラ:라 リ:리 ル:루 レ:레 ロ:로', 'ワ:와 ヲ:오 ン:응',
      'ガ:가 ギ:기 グ:구 ゲ:게 ゴ:고', 'ザ:자 ジ:지 ズ:즈 ゼ:제 ゾ:조', 'ダ:다 ヂ:지 ヅ:즈 デ:데 ド:도', 'バ:바 ビ:비 ブ:부 ベ:베 ボ:보', 'パ:파 ピ:피 プ:푸 ペ:페 ポ:포',
      'キャ:캬 キュ:큐 キョ:쿄', 'シャ:샤 シュ:슈 ショ:쇼', 'チャ:차 チュ:추 チョ:초', 'ニャ:냐 ニュ:뉴 ニョ:뇨', 'ヒャ:햐 ヒュ:휴 ヒョ:효', 'ミャ:먀 ミュ:뮤 ミョ:묘', 'リャ:랴 リュ:류 リョ:료', 'ギャ:갸 ギュ:규 ギョ:교', 'ジャ:자 ジュ:주 ジョ:조', 'ビャ:뱌 ビュ:뷰 ビョ:뵤', 'ピャ:퍄 ピュ:퓨 ピョ:표'
    ])
  };
  const kanaGroups = {
    hiragana: { basic: kana.hiragana.slice(0, 46), voiced: kana.hiragana.slice(46, 71), contracted: kana.hiragana.slice(71) },
    katakana: { basic: kana.katakana.slice(0, 46), voiced: kana.katakana.slice(46, 71), contracted: kana.katakana.slice(71) }
  };
  const searchAliases = {
    식당: '식사 음식 주문 밥 점심 저녁 알레르기', 교통: '전철 지하철 버스 택시 기차 환승', 쇼핑: '가격 결제 카드 면세 선물 기념품', 숙소: '호텔 료칸 체크인 체크아웃 와이파이',
    '길 묻기': '방향 지도 위치 길찾기 화장실 출구', '긴급 상황': '분실 사고 위험 경찰 도움 신고', 공항: '비행기 출국 입국 탑승 수하물 보안검색 환전', 관광지: '여행 명소 입장권 관람 사진 투어', 카페: '커피 음료 디저트 테이크아웃', '병원·약국': '아픔 진료 의사 약 감기 통증 응급'
  };
  const relatedSearches = {
    물: ['물 주세요', '물티슈', '화장실', '카페 물'], 화장실: ['화장실은 어디', '출구', '역 화장실', '식당 화장실'],
    역: ['역까지 가기', '전철', '지하철', '택시', '막차'], 택시: ['역까지', '택시 승강장', '여기서 내리기', '목적지'],
    주문: ['메뉴', '추천 메뉴', '알레르기', '포장', '계산'], 계산: ['따로 계산', '카드 결제', '현금', '영수증'],
    호텔: ['체크인', '체크아웃', '예약', '와이파이', '수건'], 공항: ['탑승구', '수하물', '환승', '보안 검색', '환전'],
    병원: ['약국', '머리 아파요', '배 아파요', '약', '구급차'], 쇼핑: ['가격', '카드', '면세', '사이즈', '영수증']
  };

  function saveState() {
    localStorage.setItem(storageKey('favorites'), JSON.stringify(state.favorites));
    localStorage.setItem(storageKey('views'), JSON.stringify(state.views));
    localStorage.setItem(storageKey('recent-searches'), JSON.stringify(state.recentSearches));
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
    if (screen === 'browse') renderBrowse();
    if (screen === 'history') renderHistory();
    if (screen === 'home') renderHome();
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
    return `<article class="phrase-card" data-action="speak" data-id="${phrase.id}" role="button" tabindex="0" aria-label="${phrase.jp} 일본어로 듣기">
      <button class="speaker" data-action="speak" data-id="${phrase.id}" aria-label="${phrase.jp} 듣기">▶</button>
      <button class="phrase-detail-action" data-action="open-phrase" data-id="${phrase.id}">자세히</button>
      <div class="jp">${phrase.jp}</div>
      <div class="pronunciation">${phrase.romaji}</div>
      <div class="ko">${phrase.ko}</div>
    </article>`;
  }

  function renderCategories() {
    $('#category-grid').innerHTML = Object.entries(categoryMeta).map(([name, [icon, color, description]]) => `
      <button class="category-card" data-action="open-category" data-category="${name}" style="--card:${color}">
        <span class="emoji">${icon}</span><strong>${name}</strong><small>${description} · ${phrases.filter(phrase => phrase.cat === name).length}개</small>
      </button>`).join('');
  }

  function renderBrowse() {
    const events = readList('events');
    const audioCount = events.filter(event => event.name === 'audio_play').length;
    $('#stat-views').textContent = state.views.length;
    $('#stat-audio').textContent = audioCount;
    $('#stat-favorites').textContent = state.favorites.length;
    $('#progress-label').textContent = state.views.length
      ? `여행 준비 ${Math.min(100, Math.round((state.views.length / 12) * 100))}%`
      : '';
  }

  function renderHome() {
    $('#travel-mode-grid').innerHTML = travelModes.map(mode => `
      <button class="travel-mode-card" data-action="open-travel-mode" data-mode="${mode.id}">
        <span>${mode.icon}</span><strong>${mode.title}</strong><small>${mode.subtitle}</small>
      </button>`).join('');
    const favorites = state.favorites.map(findPhrase).filter(Boolean).slice(0, 12);
    $('#my-travel-count').textContent = favorites.length ? `${favorites.length}개` : '';
    $('#my-travel-empty').hidden = favorites.length > 0;
    $('#my-travel-list').innerHTML = favorites.map(phraseCard).join('');
  }

  function openList(type) {
    state.previousScreen = $('.screen.active').id.replace('-screen', '');
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
    const isCategory = !labels[type];
    $('#quick-word-entry').innerHTML = quickWords[type] ? `
      <button class="quick-word-entry" data-action="open-quick-words" data-category="${type}">
        <span>🔖</span><div><strong>바로 쓰는 필수 단어</strong><small>상황별 핵심 단어를 한눈에 확인해요</small></div><b>›</b>
      </button>` : '';
    $('#phrase-list').innerHTML = isCategory && list.length
      ? `<section class="featured-section"><p class="featured-label">대표 표현 · FEATURED</p>${phraseCard(list[0]).replace('phrase-card', 'phrase-card featured-card')}</section><p class="all-phrases-label">모든 표현</p>${list.slice(1).map(phraseCard).join('')}`
      : list.map(phraseCard).join('');
    record('category_open', { type });
    navigate('list', type === 'favorites' ? 'favorites' : '');
  }

  function openTravelMode(modeId) {
    const mode = travelModes.find(item => item.id === modeId);
    if (!mode) return;
    state.previousScreen = 'home';
    const list = mode.phraseIds.map(findPhrase).filter(Boolean);
    $('#list-eyebrow').textContent = 'TRAVEL MODE';
    $('#list-title').textContent = mode.title;
    $('#list-description').textContent = '카드를 누르면 바로 일본어 음성이 재생돼요.';
    $('#quick-word-entry').innerHTML = quickWords[mode.quickCategory] ? `
      <button class="quick-word-entry" data-action="open-quick-words" data-category="${mode.quickCategory}">
        <span>🔖</span><div><strong>${mode.title} 필수 단어</strong><small>단어만 모아 빠르게 확인해요</small></div><b>›</b>
      </button>` : '';
    $('#phrase-list').innerHTML = list.map(phraseCard).join('');
    record('travel_mode_open', { mode: modeId });
    navigate('list', '');
  }

  function openQuickWords(category) {
    const words = quickWords[category];
    if (!words) return;
    state.previousScreen = 'list';
    $('#quick-words-title').textContent = `${category} 필수 단어`;
    $('#quick-words-description').textContent = `${words.length}개 단어를 듣고 바로 사용할 수 있어요.`;
    $('#quick-word-list').innerHTML = words.map(([jp, reading, ko]) => `
      <article class="quick-word-card">
        <button class="speaker" data-action="speak-word" data-text="${jp}" aria-label="${jp} 듣기">▶</button>
        <strong>${jp}</strong><span class="pronunciation">${reading}</span><small>${ko}</small>
      </article>`).join('');
    record('quick_words_open', { category });
    navigate('quick-words', '');
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
    const politeJapanese = phrase.jp.startsWith('すみません') ? phrase.jp : `すみません、${phrase.jp}`;
    const politeReading = phrase.jp.startsWith('すみません') ? phrase.romaji : `스미마센, ${phrase.romaji}`;
    const politeMeaning = phrase.jp.startsWith('すみません') ? phrase.ko : `실례합니다, ${phrase.ko}`;
    $('#detail-polite').textContent = politeJapanese;
    $('#detail-polite-reading').textContent = politeReading;
    $('#detail-polite-meaning').textContent = politeMeaning;
    $('#detail-dialogue').textContent = `나: ${phrase.jp}\n${phrase.romaji}\n${phrase.ko}\n\n상대: はい、かしこまりました。\n하이, 카시코마리마시타.\n네, 알겠습니다.`;
    $('#detail-favorite').classList.toggle('is-saved', state.favorites.includes(id));

    const related = phrases.filter(item => item.cat === phrase.cat && item.id !== id).slice(0, 2);
    $('#detail-related').innerHTML = related.map(item => `
      <article class="related-item" data-action="open-phrase" data-id="${item.id}">
        <button class="speaker" data-action="speak" data-id="${item.id}" aria-label="${item.jp} 듣기">▶</button>
        <strong>${item.jp}</strong><span class="pronunciation">${item.romaji}</span><span>${item.ko}</span>
      </article>`).join('');
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
    const intents = { 물: '식당-0', 포장: '식당-6', 계산: '식당-7', 메뉴: '식당-1', 추천: '식당-2', 역: '교통-0', 택시: '교통-0', 막차: '교통-5', 가격: '쇼핑-0', 얼마: '쇼핑-0', 카드: '쇼핑-1', 면세: '쇼핑-4', 체크인: '숙소-0', 체크아웃: '숙소-2', 호텔: '숙소-0', 와이파이: '숙소-5', 화장실: '길 묻기-1', 길: '길 묻기-0', 사진: '길 묻기-4', 여권: '긴급 상황-7', 경찰: '긴급 상황-1', 병원: '병원·약국-0', 약국: '병원·약국-8', 약: '병원·약국-4', 공항: '공항-0', 탑승: '공항-1', 비행기: '공항-2', 환승: '공항-5', 관광: '관광지-0', 입장권: '관광지-0', 카페: '카페-0', 커피: '카페-0', 구급차: '긴급 상황-2' };
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
    const results = normalized ? phrases.filter(phrase => `${phrase.jp}${phrase.romaji}${phrase.ko}${phrase.cat}${searchAliases[phrase.cat]}`.toLowerCase().includes(normalized)).slice(0, 6) : [];
    $('#search-results').innerHTML = results.map(phraseCard).join('') || (normalized ? '<p class="empty-search">찾는 표현이 없어요. AI 질문을 이용해 보세요.</p>' : '');
    if (normalized) saveSearch(normalized);
    renderSearchSuggestions(normalized);
  }

  function saveSearch(query) {
    clearTimeout(saveSearch.timeout);
    saveSearch.timeout = setTimeout(() => {
      state.recentSearches = [query, ...state.recentSearches.filter(item => item !== query)].slice(0, 5);
      saveState();
      record('search', { query });
    }, 450);
  }

  function renderSearchSuggestions(query = '') {
    const panel = $('#search-suggestions');
    $('.home-search-only').classList.toggle('is-searching', state.searchActive);
    if (!state.searchActive) {
      panel.hidden = true;
      return;
    }
    const terms = query ? getRelatedSearches(query) : state.recentSearches;
    const title = query ? '연관 검색어' : '최근 검색어';
    const empty = query ? '연관된 검색어가 없어요.' : '최근 검색어가 없어요.';
    panel.hidden = false;
    panel.innerHTML = `<div class="search-panel-heading"><p>${title}</p>${!query && terms.length ? '<button data-action="clear-recent-searches">전체 삭제</button>' : ''}</div>${terms.length
      ? `<div class="search-term-list">${terms.map(term => `<button data-action="search-term" data-term="${term}"><span>${query ? '⌕' : '◷'}</span>${term}<b>↗</b></button>`).join('')}</div>`
      : `<small>${empty}</small>`}`;
  }

  function getRelatedSearches(query) {
    const compactQuery = query.replace(/\s/g, '');
    const direct = Object.entries(relatedSearches).find(([term]) => compactQuery.includes(term) || term.includes(compactQuery))?.[1] || [];
    const matchedCategories = Object.entries(searchAliases)
      .filter(([category, aliases]) => `${category} ${aliases}`.toLowerCase().includes(query))
      .flatMap(([category, aliases]) => [category, ...aliases.split(' ')]);
    const matchedPhrases = phrases
      .filter(phrase => `${phrase.jp} ${phrase.romaji} ${phrase.ko}`.toLowerCase().includes(query))
      .flatMap(phrase => [phrase.ko.replace(/[?.!]/g, ''), phrase.cat]);
    return [...new Set([...direct, ...matchedCategories, ...matchedPhrases])]
      .filter(term => term.toLowerCase() !== query)
      .slice(0, 7);
  }

  async function copyPhrase() {
    const phrase = state.activePhrase;
    if (!phrase) return;
    try {
      await navigator.clipboard.writeText(phrase.jp);
      showToast('일본어 표현을 복사했어요.');
      record('phrase_copy', { id: phrase.id });
    } catch {
      showToast('복사할 수 없어요. 표현을 길게 눌러 복사해 주세요.');
    }
  }

  function renderKana() {
    const characters = kanaGroups[state.kanaScript][state.kanaGroup];
    $$('.kana-tabs button').forEach(button => button.classList.toggle('active', button.dataset.kana === state.kanaScript));
    $$('.kana-groups button').forEach(button => button.classList.toggle('active', button.dataset.kanaGroup === state.kanaGroup));
    $('#kana-grid').innerHTML = characters.map(([character, pronunciation]) => `
      <button class="kana-item" data-action="speak-kana" data-character="${character}">
        <strong>${character}</strong><small>${pronunciation}</small>
      </button>`).join('');
  }

  function handleAction(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, id, category } = target.dataset;
    if (action === 'open-category') openList(category);
    if (action === 'open-travel-mode') openTravelMode(target.dataset.mode);
    if (action === 'open-quick-words') openQuickWords(category);
    if (action === 'open-phrase') openPhrase(id);
    if (action === 'speak') { event.stopPropagation(); const phrase = findPhrase(id); if (phrase) speak(phrase.jp); }
    if (action === 'speak-word') { event.stopPropagation(); speak(target.dataset.text); }
    if (action === 'clear-recent-searches') {
      clearTimeout(saveSearch.timeout);
      state.recentSearches = [];
      saveState();
      renderSearchSuggestions('');
    }
    if (action === 'speak-ai') speak(target.dataset.text);
    if (action === 'search-term') { $('#global-search').value = target.dataset.term; state.searchActive = true; renderSearch(target.dataset.term); $('#global-search').focus(); }
    if (action === 'speak-kana') speak(target.dataset.character);
  }

  function bindStaticEvents() {
    document.addEventListener('click', handleAction);
    $('#popular-button').addEventListener('click', () => openList('popular'));
    $$('.nav-item').forEach(button => button.addEventListener('click', () => button.dataset.nav === 'favorites' ? openList('favorites') : navigate(button.dataset.nav)));
    $$('.back-button').forEach(button => button.addEventListener('click', () => navigate(state.previousScreen)));
    $('#detail-listen').addEventListener('click', () => state.activePhrase && speak(state.activePhrase.jp));
    $('#detail-polite-listen').addEventListener('click', () => {
      if (!state.activePhrase) return;
      const text = state.activePhrase.jp.startsWith('すみません') ? state.activePhrase.jp : `すみません、${state.activePhrase.jp}`;
      speak(text);
    });
    $('#detail-dialogue-listen').addEventListener('click', () => {
      if (state.activePhrase) speak(`${state.activePhrase.jp}。はい、かしこまりました。`);
    });
    $('#detail-copy').addEventListener('click', copyPhrase);
    $('#detail-favorite').addEventListener('click', toggleFavorite);
    $$('.feedback-row button').forEach(button => button.addEventListener('click', () => { button.classList.add('selected'); record('feedback', { type: button.dataset.feedback, id: state.activePhrase?.id }); showToast(button.dataset.feedback === 'helpful' ? '의견을 기록했어요.' : '오류 신고를 기록했어요.'); }));
    $('#global-search').addEventListener('focus', event => { state.searchActive = true; renderSearchSuggestions(event.target.value.trim().toLowerCase()); });
    $('#global-search').addEventListener('input', event => { state.searchActive = true; renderSearch(event.target.value); });
    $('#global-search').addEventListener('blur', () => {
      setTimeout(() => { state.searchActive = false; renderSearchSuggestions(''); }, 160);
    });
    $('#ask-form').addEventListener('submit', event => { event.preventDefault(); const question = $('#ask-input').value.trim(); if (question) { askAi(question); $('#ask-input').value = ''; } });
    $$('#suggestion-chips button').forEach(button => button.addEventListener('click', () => askAi(button.textContent)));
    $('#review-button').addEventListener('click', startReview);
    $('#review-reveal').addEventListener('click', () => { $('#review-answer').hidden = false; $('#review-listen').hidden = false; $('#review-reveal').hidden = true; record('review_reveal'); });
    $('#review-listen').addEventListener('click', () => speak(state.reviewItems[state.reviewIndex].jp));
    $('#review-next').addEventListener('click', () => { if (state.reviewIndex === state.reviewItems.length - 1) { record('review_complete'); navigate('home'); showToast('복습을 완료했어요!'); } else { state.reviewIndex += 1; renderReview(); } });
    $('#kana-button').addEventListener('click', () => { state.previousScreen = 'browse'; renderKana(); navigate('kana', ''); });
    $$('.kana-tabs button').forEach(button => button.addEventListener('click', () => { state.kanaScript = button.dataset.kana; renderKana(); }));
    $$('.kana-groups button').forEach(button => button.addEventListener('click', () => { state.kanaGroup = button.dataset.kanaGroup; renderKana(); }));
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
    const setNetworkState = () => { $('#offline-note').hidden = navigator.onLine; };
    setNetworkState();
    addEventListener('online', setNetworkState);
    addEventListener('offline', setNetworkState);
  }

  renderCategories();
  renderHome();
  renderSearchSuggestions();
  bindStaticEvents();
  registerServiceWorker();
  navigate('home');
})();
