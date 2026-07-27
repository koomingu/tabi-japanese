(() => {
  'use strict';

  const phrases = window.TABI_PHRASES;
  const categoryMeta = window.TABI_META;
  const quickWords = window.TABI_QUICK_WORDS || {};
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const storageKey = name => `tabi-${name}`;
  const icons = {
    listen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Zm12.5-2.5a6 6 0 0 1 0 9M19 5a10 10 0 0 1 0 14" /></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v10A1.5 1.5 0 0 0 5.5 17H8" /></svg>'
  };

  const readList = name => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(name)) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  function conversationKey(japanese) {
    return String(japanese || '').normalize('NFKC').replace(/[\s、。！？!?,.]/g, '');
  }

  function deduplicateConversationHistory(entries) {
    const seen = new Set();
    return entries.filter(entry => {
      const key = conversationKey(entry?.japanese);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const state = {
    favorites: readList('favorites'),
    views: readList('views'),
    recentSearches: readList('recent-searches'),
    conversationHistory: deduplicateConversationHistory(readList('conversation-history')),
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
    localStorage.setItem(storageKey('conversation-history'), JSON.stringify(state.conversationHistory));
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
    if (screen === 'profile') renderProfile();
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
    return `<article class="phrase-card" data-action="open-phrase" data-id="${phrase.id}" role="button" tabindex="0" aria-label="${phrase.jp} 자세히 보기">
      <div class="jp">${phrase.jp}</div>
      <div class="pronunciation">${phrase.romaji}</div>
      <div class="ko">${phrase.ko}</div>
      <div class="phrase-actions">
        <button class="icon-action" data-action="speak" data-id="${phrase.id}" aria-label="${phrase.jp} 듣기" title="일본어 듣기">${icons.listen}</button>
        <button class="icon-action" data-action="copy-phrase" data-id="${phrase.id}" aria-label="${phrase.jp} 복사하기" title="일본어 복사하기">${icons.copy}</button>
      </div>
    </article>`;
  }

  function renderCategories() {
    $('#category-grid').innerHTML = Object.entries(categoryMeta).map(([name, [icon, color, description]]) => `
      <button class="category-card" data-action="open-category" data-category="${name}" style="--card:${color}">
        <span class="emoji">${icon}</span><strong>${name}</strong><small>${description} · ${phrases.filter(phrase => phrase.cat === name).length}개</small>
      </button>`).join('');
  }

  function renderProfile() {
    const events = readList('events');
    const audioCount = events.filter(event => event.name === 'audio_play').length;
    $('#stat-views').textContent = state.views.length;
    $('#stat-audio').textContent = audioCount;
    $('#stat-favorites').textContent = state.favorites.length;
    $('#progress-label').textContent = state.views.length
      ? `여행 준비 ${Math.min(100, Math.round((state.views.length / 12) * 100))}%`
      : '';
    $('#history-description').textContent = state.views.length ? `${state.views.length}개 표현` : '아직 확인한 표현이 없어요';
    $('#profile-favorites-count').textContent = state.favorites.length ? `${state.favorites.length}개 표현` : '아직 북마크한 표현이 없어요';
  }

  function openList(type) {
    state.previousScreen = $('.screen.active').id.replace('-screen', '');
    $('#list-screen [data-back]').hidden = false;
    const list = type === 'popular' ? phrases.slice(0, 12)
      : type === 'favorites' ? phrases.filter(phrase => state.favorites.includes(phrase.id))
      : type === 'history' ? state.views.map(findPhrase).filter(Boolean)
      : phrases.filter(phrase => phrase.cat === type);
    const labels = {
      popular: ['QUICK ACCESS', '자주 쓰는 말'],
      favorites: ['BOOKMARKS', '북마크한 표현'],
      history: ['LEARNING LOG', '최근 확인']
    };
    const [eyebrow, title] = labels[type] || ['SITUATION', type];
    $('#list-eyebrow').textContent = eyebrow;
    $('#list-title').textContent = title;
    $('#list-description').textContent = list.length ? `${list.length}개의 표현을 준비했어요.` : type === 'history' ? '아직 확인한 표현이 없어요.' : '아직 북마크한 표현이 없어요.';
    const isCategory = !labels[type];
    $('#quick-word-entry').innerHTML = quickWords[type] ? `
      <button class="quick-word-entry" data-action="open-quick-words" data-category="${type}">
        <span>🔖</span><div><strong>바로 쓰는 필수 단어</strong><small>상황별 핵심 단어를 한눈에 확인해요</small></div><b>›</b>
      </button>` : '';
    $('#phrase-list').innerHTML = isCategory && list.length
      ? `<section class="featured-section"><p class="featured-label">대표 표현 · FEATURED</p>${phraseCard(list[0]).replace('phrase-card', 'phrase-card featured-card')}</section><p class="all-phrases-label">모든 표현</p>${list.slice(1).map(phraseCard).join('')}`
      : list.map(phraseCard).join('');
    record('category_open', { type });
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
        <strong>${jp}</strong><span class="pronunciation">${reading}</span><small>${ko}</small>
        <div class="phrase-actions">
          <button class="icon-action" data-action="speak-word" data-text="${jp}" aria-label="${jp} 듣기" title="일본어 듣기">${icons.listen}</button>
          <button class="icon-action" data-action="copy-word" data-text="${jp}" aria-label="${jp} 복사하기" title="일본어 복사하기">${icons.copy}</button>
        </div>
      </article>`).join('');
    record('quick_words_open', { category });
    navigate('quick-words', '');
  }

  // 답변은 카테고리가 아니라 사용자가 실제로 말한 문장에 맞춰 보여 준다.
  // [일본어, 발음, 한국어] 형식을 함께 보관해 대화와 예상 답변이 같은 맥락을 유지한다.
  const reply = (japanese, reading, korean) => [japanese, reading, korean];
  const acknowledged = [
    reply('はい、承知しました。', '하이, 쇼오치시마시타.', '네, 알겠습니다.'),
    reply('かしこまりました。', '카시코마리마시타.', '알겠습니다.'),
    reply('少々お待ちください。', '쇼오쇼오 오마치쿠다사이.', '잠시만 기다려 주세요.')
  ];

  function phraseReplies(phrase) {
    const { jp } = phrase;
    const specific = {
      '駅までお願いします。': [reply('駅ですね。承知しました。', '에키데스네. 쇼오치시마시타.', '역이시군요. 알겠습니다.'), reply('どちらの駅ですか。', '도치라노 에키데스카.', '어느 역인가요?'), reply('地図を見せていただけますか。', '치즈오 미세테 이타다케마스카.', '지도를 보여 주시겠어요?')],
      'この電車は東京駅に行きますか？': [reply('はい、東京駅に行きます。', '하이, 토오쿄오에키니 이키마스.', '네, 도쿄역에 갑니다.'), reply('東京駅へは次の電車です。', '토오쿄오에키에와 츠기노 덴샤데스.', '도쿄역은 다음 전철입니다.'), reply('乗り換えが必要です。', '노리카에가 히츠요오데스.', '환승이 필요합니다.')],
      '何番線ですか？': [reply('3番線です。', '산반센데스.', '3번 승강장입니다.'), reply('案内表示をご覧ください。', '안나이 효오지오 고란쿠다사이.', '안내 표지를 봐 주세요.'), reply('ホームまでご案内します。', '호오무마데 고안나이시마스.', '승강장까지 안내해 드리겠습니다.')],
      'お水をいただけますか？': [reply('はい、ただいまお持ちします。', '하이, 타다이마 오모치시마스.', '네, 바로 가져다 드리겠습니다.'), reply('お水はセルフサービスです。', '오미즈와 세루후 사아비스데스.', '물은 셀프 서비스입니다.'), reply('こちらにあります。', '코치라니 아리마스.', '여기에 있습니다.')],
      '道に迷いました。': [reply('どちらへ行きたいですか。', '도치라에 이키타이데스카.', '어디로 가고 싶으세요?'), reply('地図を見せてください。', '치즈오 미세테쿠다사이.', '지도를 보여 주세요.'), reply('一緒に確認しましょう。', '잇쇼니 카쿠닌시마쇼오.', '함께 확인해 볼게요.')],
      '助けてください。': [reply('どうしましたか。', '도오시마시타카.', '무슨 일이세요?'), reply('すぐに係の者を呼びます。', '스구니 카카리노 모노오 요비마스.', '바로 담당 직원을 부르겠습니다.'), reply('危険なら110番に連絡してください。', '키켄나라 햐쿠토오반니 렌라쿠시테쿠다사이.', '위험하면 110번에 연락해 주세요.')],
      '警察を呼んでください。': [reply('分かりました。警察に連絡します。', '와카리마시타. 케이사츠니 렌라쿠시마스.', '알겠습니다. 경찰에 연락하겠습니다.'), reply('何がありましたか。', '나니가 아리마시타카.', '무슨 일이 있었나요?'), reply('ここでお待ちください。', '코코데 오마치쿠다사이.', '여기서 기다려 주세요.')],
      '救急車を呼んでください。': [reply('分かりました。すぐに呼びます。', '와카리마시타. 스구니 요비마스.', '알겠습니다. 바로 부르겠습니다.'), reply('意識はありますか。', '이시키와 아리마스카.', '의식이 있나요?'), reply('動かずにお待ちください。', '우고카즈니 오마치쿠다사이.', '움직이지 말고 기다려 주세요.')],
      '財布をなくしました。': [reply('いつ、どこでなくしましたか。', '이츠, 도코데 나쿠시마시타카.', '언제, 어디에서 잃어버리셨나요?'), reply('交番で届け出を出せます。', '코오반데 토도케데오 다세마스.', '파출소에서 분실 신고를 할 수 있습니다.'), reply('カードは止めましたか。', '카아도와 토메마시타카.', '카드는 정지하셨나요?')],
      'パスポートをなくしました。': [reply('大変ですね。警察に届け出ましょう。', '타이헨데스네. 케이사츠니 토도케데마쇼오.', '큰일이네요. 경찰에 신고합시다.'), reply('大使館に連絡してください。', '타이시칸니 렌라쿠시테쿠다사이.', '대사관에 연락해 주세요.'), reply('なくした場所は分かりますか。', '나쿠시타 바쇼와 와카리마스카.', '잃어버린 장소를 아시나요?')],
      '気分が悪いです。': [reply('大丈夫ですか。座ってください。', '다이조오부데스카. 슷테쿠다사이.', '괜찮으세요? 앉으세요.'), reply('救急車を呼びましょうか。', '큐우큐우샤오 요비마쇼오카.', '구급차를 부를까요?'), reply('どこが具合悪いですか。', '도코가 구아이 와루이데스카.', '어디가 불편하세요?')],
      '頭が痛いです。': [reply('いつから痛いですか。', '이츠카라 이타이데스카.', '언제부터 아프세요?'), reply('薬をお出しできます。', '쿠스리오 오다시데키마스.', '약을 드릴 수 있습니다.'), reply('症状が強ければ病院へ行ってください。', '쇼오조오가 츠요케레바 뵤오인에 잇테쿠다사이.', '증상이 심하면 병원에 가세요.')],
      'お腹が痛いです。': [reply('いつから痛いですか。', '이츠카라 이타이데스카.', '언제부터 아프세요?'), reply('ほかに症状はありますか。', '호카니 쇼오조오와 아리마스카.', '다른 증상이 있나요?'), reply('症状が強ければ病院へ行ってください。', '쇼오조오가 츠요케레바 뵤오인에 잇테쿠다사이.', '증상이 심하면 병원에 가세요.')],
      '熱があります。': [reply('体温を測りましょう。', '타이온오 하카리마쇼오.', '체온을 재 봅시다.'), reply('いつからですか。', '이츠카라데스카.', '언제부터인가요?'), reply('症状が強ければ病院へ行ってください。', '쇼오조오가 츠요케레바 뵤오인에 잇테쿠다사이.', '증상이 심하면 병원에 가세요.')],
      'アレルギーがあります。': [reply('何のアレルギーですか。', '나니노 아레루기이데스카.', '무슨 알레르기가 있으신가요?'), reply('確認しますので、少々お待ちください。', '카쿠닌시마스노데, 쇼오쇼오 오마치쿠다사이.', '확인하겠으니 잠시 기다려 주세요.'), reply('アレルギーの食材は避けます。', '아레루기이노 쇼쿠자이와 사케마스.', '알레르기 식재료는 피하겠습니다.')],
      '予約しています。': [reply('お名前をお願いします。', '오나마에오 오네가이시마스.', '성함을 부탁드립니다.'), reply('予約を確認します。', '요야쿠오 카쿠닌시마스.', '예약을 확인하겠습니다.'), reply('何時のご予約ですか。', '난지노 고요야쿠데스카.', '몇 시 예약이신가요?')],
      '日本語がよく分かりません。': [reply('ゆっくり話しますね。', '윳쿠리 하나시마스네.', '천천히 말씀드릴게요.'), reply('英語は大丈夫ですか。', '에이고와 다이조오부데스카.', '영어는 괜찮으세요?'), reply('翻訳アプリを使いましょう。', '혼야쿠 아푸리오 츠카이마쇼오.', '번역 앱을 사용합시다.')],
      '日本語の説明が分かりません。': [reply('ゆっくり説明しますね。', '윳쿠리 세츠메이시마스네.', '천천히 설명드릴게요.'), reply('英語の案内もあります。', '에이고노 안나이모 아리마스.', '영어 안내도 있습니다.'), reply('翻訳アプリを使いましょう。', '혼야쿠 아푸리오 츠카이마쇼오.', '번역 앱을 사용합시다.')],
      '英語を話せますか？': [reply('はい、少し話せます。', '하이, 스코시 하나세마스.', '네, 조금 할 수 있습니다.'), reply('英語ができるスタッフを呼びます。', '에이고가 데키루 스타후오 요비마스.', '영어 가능한 직원을 부르겠습니다.'), reply('翻訳アプリでも大丈夫です。', '혼야쿠 아푸리데모 다이조오부데스.', '번역 앱으로도 괜찮습니다.')],
      'これは何ですか？': [reply('こちらについてご説明します。', '코치라니 츠이테 고세츠메이시마스.', '이것에 관해 설명해 드리겠습니다.'), reply('表示をご覧ください。', '효오지오 고란쿠다사이.', '표시를 봐 주세요.'), reply('分からないところを聞いてください。', '와카라나이 토코로오 키이테쿠다사이.', '모르는 부분을 물어보세요.')],
      'ここでいいですか？': [reply('はい、こちらで大丈夫です。', '하이, 코치라데 다이조오부데스.', '네, 여기면 됩니다.'), reply('そのままお進みください。', '소노마마 오스스미쿠다사이.', '그대로 가세요.'), reply('確認します。', '카쿠닌시마스.', '확인하겠습니다.')],
      '近くにありますか？': [reply('この近くにあります。', '코노 치카쿠니 아리마스.', '이 근처에 있습니다.'), reply('少し歩きます。', '스코시 아루키마스.', '조금 걸어야 합니다.'), reply('地図でご案内します。', '치즈데 고안나이시마스.', '지도로 안내해 드릴게요.')],
      '写真を撮っていただけますか？': [reply('はい、撮りましょう。', '하이, 토리마쇼오.', '네, 찍어 드릴게요.'), reply('カメラをお預かりします。', '카메라오 오아즈카리시마스.', '카메라를 맡아 드릴게요.'), reply('ここで撮りますね。', '코코데 토리마스네.', '여기서 찍을게요.')],
      '空いている席はありますか？': [reply('はい、こちらの席が空いています。', '하이, 코치라노 세키가 아이테이마스.', '네, 이쪽 자리가 비어 있습니다.'), reply('お好きな席へどうぞ。', '오스키나 세키에 도오조.', '원하시는 자리에 앉으세요.'), reply('ただいま満席です。', '타다이마 만세키데스.', '현재 만석입니다.')],
      '現金だけですか？': [reply('いいえ、カードも使えます。', '이이에, 카아도모 츠카에마스.', '아니요, 카드도 사용할 수 있습니다.'), reply('現金のみのお店です。', '겐킨노미노 오미세데스.', '현금만 받는 가게입니다.'), reply('お支払い方法をご案内します。', '오시하라이 호오호오오 고안나이시마스.', '결제 방법을 안내해 드리겠습니다.')],
      '砂糖は入れますか？': [reply('はい、お願いします。', '하이, 오네가이시마스.', '네, 부탁드립니다.'), reply('いいえ、なしでお願いします。', '이이에, 나시데 오네가이시마스.', '아니요, 빼 주세요.'), reply('お好みでお取りください。', '오코노미데 오토리쿠다사이.', '취향에 맞게 가져가세요.')],
      '部屋の鍵が開きません。': [reply('すぐに確認に伺います。', '스구니 카쿠닌니 우카가이마스.', '바로 확인하러 가겠습니다.'), reply('鍵をお持ちください。', '카기오 오모치쿠다사이.', '열쇠를 가져와 주세요.'), reply('別の鍵をご用意します。', '베츠노 카기오 고요오이시마스.', '다른 열쇠를 준비하겠습니다.')],
      'ここで降ります。': [reply('分かりました。次で停まります。', '와카리마시타. 츠기데 토마리마스.', '알겠습니다. 다음에 세우겠습니다.'), reply('お忘れ物にご注意ください。', '오와스레모노니 고추우이쿠다사이.', '두고 내리는 물건에 주의해 주세요.'), reply('ありがとうございました。', '아리가토오 고자이마시타.', '감사합니다.')],
      '乗り継ぎがあります。': [reply('どちらまで行かれますか。', '도치라마데 이카레마스카.', '어디까지 가시나요?'), reply('乗り継ぎをご案内します。', '노리츠기오 고안나이시마스.', '환승을 안내해 드리겠습니다.'), reply('搭乗券を見せてください。', '토오조오켄오 미세테쿠다사이.', '탑승권을 보여 주세요.')],
      '家族に連絡したいです。': [reply('電話をお貸しします。', '덴와오 오카시시마스.', '전화를 빌려드리겠습니다.'), reply('Wi-Fiをお使いください。', '와이화이오 오츠카이쿠다사이.', '와이파이를 사용하세요.'), reply('連絡先は分かりますか。', '렌라쿠사키와 와카리마스카.', '연락처를 아시나요?')],
      '助かりました。': [reply('どういたしまして。', '도오이타시마시테.', '천만에요.'), reply('お気をつけて。', '오키오츠케테.', '조심히 가세요.'), reply('よい旅を。', '요이 타비오.', '좋은 여행 되세요.')],
      '分かりました。': [reply('ありがとうございます。', '아리가토오 고자이마스.', '감사합니다.'), reply('何かあれば聞いてください。', '나니카 아레바 키이테쿠다사이.', '궁금한 점이 있으면 물어보세요.'), reply('お気をつけて。', '오키오츠케테.', '조심히 가세요.')],
      'また来ます。': [reply('お待ちしています。', '오마치시테이마스.', '기다리고 있겠습니다.'), reply('ありがとうございました。', '아리가토오 고자이마시타.', '감사합니다.'), reply('お気をつけて。', '오키오츠케테.', '조심히 가세요.')]
    };
    if (specific[jp]) return specific[jp];

    if (jp.includes('どこですか')) return [reply('あちらです。', '아치라데스.', '저쪽입니다.'), reply('まっすぐ行ってください。', '맛스구 잇테쿠다사이.', '곧장 가세요.'), reply('地図でご案内します。', '치즈데 고안나이시마스.', '지도로 안내해 드릴게요.')];
    if (jp.includes('何時まで') || jp.includes('何時から')) return [reply('営業時間を確認します。', '에이교오 지칸오 카쿠닌시마스.', '영업 시간을 확인하겠습니다.'), reply('案内をご覧ください。', '안나이오 고란쿠다사이.', '안내를 봐 주세요.'), reply('今日は通常どおりです。', '쿄오와 츠우조오도오리데스.', '오늘은 정상 운영합니다.')];
    if (jp.includes('何時に出発') || jp.includes('終電')) return [reply('時刻表を確認します。', '지코쿠효오오 카쿠닌시마스.', '시간표를 확인하겠습니다.'), reply('案内表示をご覧ください。', '안나이 효오지오 고란쿠다사이.', '안내 표지를 봐 주세요.'), reply('遅れがないか確認します。', '오쿠레가 나이카 카쿠닌시마스.', '지연 여부를 확인하겠습니다.')];
    if (jp.includes('いくらですか')) return [reply('値札をご覧ください。', '네후다오 고란쿠다사이.', '가격표를 봐 주세요.'), reply('こちらは税込みの価格です。', '코치라와 제이코미노 카카쿠데스.', '이쪽은 세금 포함 가격입니다.'), reply('合計をお出しします。', '고오케이오 오다시시마스.', '합계를 알려 드리겠습니다.')];
    if (jp.includes('使えますか') || jp.includes('できますか') || jp.includes('してもいいですか')) return [reply('はい、ご利用いただけます。', '하이, 고리요오 이타다케마스.', '네, 이용하실 수 있습니다.'), reply('確認しますので、少々お待ちください。', '카쿠닌시마스노데, 쇼오쇼오 오마치쿠다사이.', '확인하겠으니 잠시 기다려 주세요.'), reply('申し訳ありませんが、対応していません。', '모오시와케 아리마센가, 타이오오시테이마센.', '죄송하지만 지원하지 않습니다.')];
    if (jp.includes('ありますか')) return [reply('はい、ございます。', '하이, 고자이마스.', '네, 있습니다.'), reply('在庫を確認します。', '자이코오 카쿠닌시마스.', '재고를 확인하겠습니다.'), reply('申し訳ありません、ただいまありません。', '모오시와케 아리마센, 타다이마 아리마센.', '죄송하지만 현재 없습니다.')];
    if (jp.includes('何ですか')) return [reply('こちらがおすすめです。', '코치라가 오스스메데스.', '이쪽을 추천드립니다.'), reply('ご希望を教えてください。', '고키보오오 오시에테쿠다사이.', '원하시는 것을 알려 주세요.'), reply('説明いたします。', '세츠메이 이타시마스.', '설명해 드리겠습니다.')];
    if (jp.includes('入っていますか')) return [reply('確認いたします。', '카쿠닌 이타시마스.', '확인하겠습니다.'), reply('こちらには入っていません。', '코치라니와 하잇테이마센.', '이것에는 들어 있지 않습니다.'), reply('原材料をご案内します。', '겐자이료오오 고안나이시마스.', '원재료를 안내해 드리겠습니다.')];
    if (jp.includes('遅れていますか')) return [reply('現在の運行状況を確認します。', '겐자이노 운코오 조오쿄오오 카쿠닌시마스.', '현재 운행 상황을 확인하겠습니다.'), reply('少し遅れています。', '스코시 오쿠레테이마스.', '조금 지연되고 있습니다.'), reply('案内表示をご覧ください。', '안나이 효오지오 고란쿠다사이.', '안내 표지를 봐 주세요.')];
    if (jp.includes('見せ') || jp.includes('教えてください')) return [reply('はい、こちらです。', '하이, 코치라데스.', '네, 여기입니다.'), reply('ご案内します。', '고안나이시마스.', '안내해 드리겠습니다.'), reply('少々お待ちください。', '쇼오쇼오 오마치쿠다사이.', '잠시만 기다려 주세요.')];
    if (jp.includes('近いですか')) return [reply('歩いてすぐです。', '아루이테 스구데스.', '걸어서 바로입니다.'), reply('少し距離があります。', '스코시 쿄리 가 아리마스.', '조금 거리가 있습니다.'), reply('地図でご案内します。', '치즈데 고안나이시마스.', '지도로 안내해 드릴게요.')];
    if (jp.includes('払えますか')) return [reply('はい、お支払いいただけます。', '하이, 오시하라이 이타다케마스.', '네, 결제하실 수 있습니다.'), reply('お会計は別々にできます。', '오카이케이와 베츠베츠니 데키마스.', '계산은 따로 할 수 있습니다.'), reply('お会計の際にお知らせください。', '오카이케이노 사이니 오시라세쿠다사이.', '계산할 때 말씀해 주세요.')];
    if (jp.includes('痛い') || jp.includes('診てもらいたい')) return [reply('症状を教えてください。', '쇼오조오오 오시에테쿠다사이.', '증상을 알려 주세요.'), reply('診察の受付をします。', '신사츠노 우케츠케오 시마스.', '진료 접수를 하겠습니다.'), reply('保険証はお持ちですか。', '호켄쇼오와 오모치데스카.', '보험증을 가지고 계신가요?')];
    if (jp.includes('なくしました')) return [reply('いつ、どこでなくしましたか。', '이츠, 도코데 나쿠시마시타카.', '언제, 어디에서 잃어버리셨나요?'), reply('届け出のお手伝いをします。', '토도케데노 오테츠다이오 시마스.', '신고를 도와드리겠습니다.'), reply('身分証明書はありますか。', '미분 쇼오메이쇼와 아리마스카.', '신분증이 있나요?')];
    if (jp.endsWith('ください。') || jp.endsWith('お願いします。') || jp.endsWith('します。') || jp.endsWith('たいです。')) return acknowledged;
    return [reply('分かりました。', '와카리마시타.', '알겠습니다.'), reply('確認します。', '카쿠닌시마스.', '확인하겠습니다.'), reply('少々お待ちください。', '쇼오쇼오 오마치쿠다사이.', '잠시만 기다려 주세요.')];
  }

  function renderExpectedReplies(phrase) {
    const replies = phraseReplies(phrase);
    $('#detail-expected-replies').innerHTML = `<p class="expected-note">이 표현 뒤에 자주 들을 수 있는 답변이에요.</p>${replies.map(([japanese, reading, korean]) => `<div class="expected-reply"><strong>${japanese}</strong><span class="expected-reply-reading">${reading}</span><span>${korean}</span><div class="expected-reply-actions"><button class="icon-action" data-action="speak-word" data-text="${japanese}" aria-label="${japanese} 듣기" title="일본어 듣기">${icons.listen}</button><button class="icon-action" data-action="copy-word" data-text="${japanese}" aria-label="${japanese} 복사하기" title="일본어 복사하기">${icons.copy}</button></div></div>`).join('')}`;
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
    $('#detail-note').textContent = phrase.note;
    const politeJapanese = phrase.jp.startsWith('すみません') ? phrase.jp : `すみません、${phrase.jp}`;
    const politeReading = phrase.jp.startsWith('すみません') ? phrase.romaji : `스미마센, ${phrase.romaji}`;
    const politeMeaning = phrase.jp.startsWith('すみません') ? phrase.ko : `실례합니다, ${phrase.ko}`;
    $('#detail-polite').textContent = politeJapanese;
    $('#detail-polite-reading').textContent = politeReading;
    $('#detail-polite-meaning').textContent = politeMeaning;
    $('#detail-favorite').classList.toggle('is-bookmarked', state.favorites.includes(id));
    renderExpectedReplies(phrase);
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
    $('#detail-favorite').classList.toggle('is-bookmarked', isAdding);
    showToast(isAdding ? '북마크에 추가했어요.' : '북마크를 해제했어요.');
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
    const intents = { 포장: '식당-6', 계산: '식당-7', 메뉴: '식당-1', 추천: '식당-2', 역: '교통-0', 택시: '교통-0', 막차: '교통-5', 가격: '쇼핑-0', 얼마: '쇼핑-0', 카드: '쇼핑-1', 면세: '쇼핑-4', 체크인: '숙소-0', 체크아웃: '숙소-2', 호텔: '숙소-0', 와이파이: '숙소-5', 화장실: '길 묻기-1', 길: '길 묻기-0', 사진: '길 묻기-4', 여권: '긴급 상황-7', 경찰: '긴급 상황-1', 병원: '병원·약국-0', 약국: '병원·약국-8', 약: '병원·약국-4', 공항: '공항-0', 탑승: '공항-1', 비행기: '공항-2', 환승: '공항-5', 관광: '관광지-0', 입장권: '관광지-0', 카페: '카페-0', 커피: '카페-0', 구급차: '긴급 상황-2' };
    const matchingId = Object.entries(intents).find(([keyword]) => question.includes(keyword))?.[1]
      || (/(^|\s)물(?:을|은|도)?(?:\s|$)/.test(question) ? '식당-0' : undefined);
    return findPhrase(matchingId) || phrases[0];
  }

  function renderLocalAnswer(question) {
    const phrase = localRecommendation(question);
    const polite = /정중|공손/.test(question) ? `<br>더 정중하게: すみません、${phrase.jp}` : '';
    $('#ask-answer').innerHTML = `<article class="ai-card"><p class="eyebrow">TABi'S RECOMMENDATION</p>
      <h3>${phrase.jp}</h3><p class="answer-ko">${phrase.romaji}<br>${phrase.ko}</p>
      <small>${phrase.use}<br>${phrase.note}${polite}</small><br>
      <button class="icon-action" data-action="speak" data-id="${phrase.id}" aria-label="일본어 듣기" title="일본어 듣기">${icons.listen}</button>
      <button class="icon-action" data-action="copy-phrase" data-id="${phrase.id}" aria-label="일본어 복사하기" title="일본어 복사하기">${icons.copy}</button>
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
      if ($('#global-search').value.trim() !== question) return;
      $('#ask-answer').innerHTML = `<article class="ai-card"><p class="eyebrow">AI RECOMMENDATION</p>
        <h3></h3><p class="answer-ko"></p><small></small><br><button class="icon-action" data-action="speak-ai" aria-label="일본어 듣기" title="일본어 듣기">${icons.listen}</button><button class="icon-action" data-action="copy-ai" aria-label="일본어 복사하기" title="일본어 복사하기">${icons.copy}</button></article>`;
      const card = $('.ai-card');
      card.querySelector('h3').textContent = answer.japanese || '';
      card.querySelector('.answer-ko').textContent = `${answer.pronunciation || ''}\n${answer.meaning || ''}`;
      card.querySelector('small').textContent = `${answer.usage || ''}\n${answer.caution || ''}`;
      card.querySelector('[data-action="speak-ai"]').dataset.text = answer.japanese || '';
      card.querySelector('[data-action="copy-ai"]').dataset.text = answer.japanese || '';
      record('ai_question', { source: 'api' });
    } catch {
      showToast('AI 연결에 실패해 기본 추천을 보여드려요.');
      renderLocalAnswer(question);
    }
  }

  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

  function localConversationAnswer(japanese) {
    // 음성 인식 결과는 마침표·공백·가나 표기가 조금씩 달라질 수 있으므로,
    // 비교할 때는 문장부호를 제외한 형태로 통일한다.
    const normalized = japanese.normalize('NFKC').replace(/[\s、。！？!?,.]/g, '');
    const commonReplies = [
      {
        patterns: [/^(かしこまりました|畏まりました)$/],
        korean: '알겠습니다. 요청하신 내용을 정중하게 받아들였다는 뜻이에요.',
        pronunciation: '카시코마리마시타',
        keywords: ['매우 정중한 “알겠습니다”', '직원·서비스 상황에서 자주 사용']
      },
      {
        patterns: [/^(わかりました|分かりました|分りました)$/],
        korean: '알겠습니다. 내용을 이해했거나 요청을 받아들였다는 뜻이에요.',
        pronunciation: '와카리마시타',
        keywords: ['일반적인 “알겠습니다”', '일상 대화에서 사용']
      },
      {
        patterns: [/^(しょうちしました|承知しました)$/],
        korean: '알겠습니다. 상대방의 요청이나 안내를 정중하게 받아들였다는 뜻이에요.',
        pronunciation: '쇼오치시마시타',
        keywords: ['정중한 “알겠습니다”', '업무·서비스 상황에서 사용']
      },
      {
        patterns: [/^(はい|ええ)$/],
        korean: '네. 긍정하거나 동의한다는 뜻이에요.',
        pronunciation: '하이 / 에에',
        keywords: ['긍정', '동의']
      }
    ];
    const commonReply = commonReplies.find(({ patterns }) => patterns.some(pattern => pattern.test(normalized)));
    if (commonReply) {
      return {
        japanese,
        korean: commonReply.korean,
        pronunciation: commonReply.pronunciation,
        keywords: commonReply.keywords,
        suggestions: conversationSuggestions()
      };
    }
    const matches = [
      [/はい|ええ/, '네, 또는 괜찮다는 뜻이에요.'], [/いいえ|だめ|できません/, '아니요, 또는 어렵다는 뜻이에요.'],
      [/カード/, '카드와 관련된 답변이에요.'], [/現金/, '현금과 관련된 답변이에요.'],
      [/水|お水/, '물과 관련된 답변이에요.'], [/満席/, '자리가 없거나 만석이라는 뜻이에요.'],
      [/分|時間/, '시간이나 대기 시간과 관련된 답변이에요.'], [/駅|電車/, '역 또는 전철과 관련된 답변이에요.']
    ];
    const korean = matches.find(([pattern]) => pattern.test(japanese))?.[1] || '상대방의 답변이에요. 인터넷 연결 시 더 자연스러운 번역을 제공해요.';
    const suggestions = conversationSuggestions();
    return { japanese, korean, pronunciation: '', keywords: [], suggestions };
  }

  function conversationSuggestions() {
    return phrases.filter(phrase => ['식당-0', '교통-0', '숙소-0'].includes(phrase.id));
  }

  function renderConversationLog() {
    const log = $('#conversation-log');
    const recent = state.conversationHistory.slice(0, 3);
    log.innerHTML = recent.length ? `<p>최근 대화</p>${recent.map(item => `<button data-action="show-conversation" data-conversation-id="${item.id}"><strong>${escapeHtml(item.japanese)}</strong><span>${escapeHtml(item.korean)}</span></button>`).join('')}` : '';
  }

  function renderConversationResult(answer) {
    const result = $('#conversation-result');
    const suggestions = (answer.suggestions || []).slice(0, 3);
    result.hidden = false;
    result.innerHTML = `<p class="eyebrow">KOREAN MEANING</p><h3>${escapeHtml(answer.japanese)}</h3>${answer.pronunciation ? `<p class="conversation-reading">${escapeHtml(answer.pronunciation)}</p>` : ''}<p class="conversation-meaning">${escapeHtml(answer.korean)}</p>${answer.keywords?.length ? `<p class="conversation-keywords">핵심 단어 · ${answer.keywords.map(escapeHtml).join(' · ')}</p>` : ''}<div class="conversation-next"><p>이어서 말하기</p>${suggestions.map(phrase => `<button data-action="speak" data-id="${phrase.id}"><strong>${escapeHtml(phrase.jp)}</strong><span>${escapeHtml(phrase.ko)}</span><b>▶</b></button>`).join('')}</div>`;
  }

  async function analyzeConversation() {
    const input = $('#conversation-input');
    const japanese = input.value.trim();
    if (!japanese) return showToast('상대방의 일본어 답변을 입력하거나 녹음해 주세요.');
    $('#conversation-result').hidden = false;
    $('#conversation-result').innerHTML = '<p class="eyebrow">UNDERSTANDING</p><p class="conversation-meaning">답변을 이해하고 있어요.</p>';
    let answer;
    try {
      if (!window.TABI_AI_ENDPOINT) throw new Error('local mode');
      const headers = { 'Content-Type': 'application/json' };
      if (window.TABI_SUPABASE_ANON_KEY) { headers.apikey = window.TABI_SUPABASE_ANON_KEY; headers.Authorization = `Bearer ${window.TABI_SUPABASE_ANON_KEY}`; }
      const response = await fetch(window.TABI_AI_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ mode: 'conversation', japanese }) });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'conversation request failed');
      answer = { japanese, korean: data.korean, pronunciation: data.pronunciation, keywords: data.keywords || [], suggestions: conversationSuggestions() };
    } catch {
      answer = localConversationAnswer(japanese);
    }
    const entry = { id: `${Date.now()}`, japanese, korean: answer.korean, at: new Date().toISOString(), answer };
    state.conversationHistory = deduplicateConversationHistory([entry, ...state.conversationHistory]).slice(0, 20);
    saveState();
    renderConversationResult(answer);
    renderConversationLog();
    record('conversation_understood');
  }

  function startJapaneseRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return showToast('이 브라우저에서는 음성 인식을 지원하지 않아요. 일본어를 직접 입력해 주세요.');
    const recognition = new Recognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    const button = $('#conversation-record');
    button.classList.add('is-recording');
    $('#conversation-note').textContent = '듣고 있어요. 상대방의 답변이 끝나면 자동으로 입력돼요.';
    recognition.onresult = event => {
      $('#conversation-input').value = event.results[0][0].transcript;
      $('#conversation-note').textContent = '일본어 답변을 받아왔어요. 바로 해석하고 있어요.';
      analyzeConversation();
    };
    recognition.onerror = () => { $('#conversation-note').textContent = '음성을 인식하지 못했어요. 일본어를 직접 입력해 주세요.'; };
    recognition.onend = () => button.classList.remove('is-recording');
    recognition.start();
  }

  function renderSearch(query) {
    const normalized = query.trim().toLowerCase();
    const results = normalized ? phrases
      .filter(phrase => `${phrase.jp}${phrase.romaji}${phrase.ko}${phrase.cat}${searchAliases[phrase.cat]}`.toLowerCase().includes(normalized))
      .filter((phrase, index, matches) => matches.findIndex(match => match.jp === phrase.jp && match.ko === phrase.ko) === index)
      .slice(0, 6) : [];
    $('#search-results').innerHTML = results.map(phraseCard).join('');
    clearTimeout(renderSearch.aiTimeout);
    if (!normalized || results.length) {
      $('#ask-answer').innerHTML = '';
    } else {
      const question = query.trim();
      renderSearch.aiTimeout = setTimeout(() => {
        if ($('#global-search').value.trim() === question) askAi(question);
      }, 350);
    }
    renderSearchSuggestions(normalized);
  }

  function saveSearch(query) {
    clearTimeout(saveSearch.timeout);
    saveSearch.timeout = setTimeout(() => {
      saveSearch.timeout = null;
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

    const clearButton = panel.querySelector('[data-action="clear-recent-searches"]');
    if (clearButton) {
      clearButton.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
        clearRecentSearches();
      }, { once: true });
    }
  }

  function clearRecentSearches() {
    clearTimeout(saveSearch.timeout);
    saveSearch.timeout = null;
    state.recentSearches = [];
    saveState();
    renderSearchSuggestions('');
    requestAnimationFrame(() => renderSearchSuggestions(''));
    showToast('최근 검색어를 모두 삭제했어요.');
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

  function flashIcon(button) {
    if (!button) return;
    button.classList.add('is-active');
    clearTimeout(button.flashTimeout);
    button.flashTimeout = setTimeout(() => button.classList.remove('is-active'), 700);
  }

  async function copyText(text, data = {}, button = null) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flashIcon(button);
      showToast('일본어 표현을 복사했어요.');
      record('phrase_copy', data);
    } catch {
      showToast('복사할 수 없어요. 표현을 길게 눌러 복사해 주세요.');
    }
  }

  function copyPhrase(button) {
    const phrase = state.activePhrase;
    if (phrase) copyText(phrase.jp, { id: phrase.id }, button);
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
    if (action === 'open-profile-list') openList(target.dataset.list);
    if (action === 'open-quick-words') openQuickWords(category);
    if (action === 'open-phrase') openPhrase(id);
    if (action === 'speak') { event.stopPropagation(); const phrase = findPhrase(id); if (phrase) { flashIcon(target); speak(phrase.jp); } }
    if (action === 'speak-word') { event.stopPropagation(); flashIcon(target); speak(target.dataset.text); }
    if (action === 'copy-phrase') { event.stopPropagation(); const phrase = findPhrase(id); if (phrase) copyText(phrase.jp, { id: phrase.id }, target); }
    if (action === 'copy-word') { event.stopPropagation(); copyText(target.dataset.text, {}, target); }
    if (action === 'clear-recent-searches') clearRecentSearches();
    if (action === 'speak-ai') { flashIcon(target); speak(target.dataset.text); }
    if (action === 'copy-ai') copyText(target.dataset.text, {}, target);
    if (action === 'show-conversation') { const entry = state.conversationHistory.find(item => item.id === target.dataset.conversationId); if (entry) renderConversationResult(entry.answer); }
    if (action === 'search-term') { $('#global-search').value = target.dataset.term; state.searchActive = true; saveSearch(target.dataset.term); renderSearch(target.dataset.term); $('#global-search').focus(); }
    if (action === 'speak-kana') speak(target.dataset.character);
  }

  function bindStaticEvents() {
    document.addEventListener('click', handleAction);
    $$('.nav-item').forEach(button => button.addEventListener('click', () => navigate(button.dataset.nav)));
    $$('.back-button').forEach(button => button.addEventListener('click', () => navigate(state.previousScreen)));
    $('#detail-listen').addEventListener('click', event => { flashIcon(event.currentTarget); if (state.activePhrase) speak(state.activePhrase.jp); });
    $('#detail-polite-listen').addEventListener('click', event => {
      if (!state.activePhrase) return;
      const text = state.activePhrase.jp.startsWith('すみません') ? state.activePhrase.jp : `すみません、${state.activePhrase.jp}`;
      flashIcon(event.currentTarget);
      speak(text);
    });
    $('#detail-polite-copy').addEventListener('click', event => {
      if (!state.activePhrase) return;
      const text = state.activePhrase.jp.startsWith('すみません') ? state.activePhrase.jp : `すみません、${state.activePhrase.jp}`;
      copyText(text, { id: state.activePhrase.id, version: 'polite' }, event.currentTarget);
    });
    $('#detail-copy').addEventListener('click', event => copyPhrase(event.currentTarget));
    $('#detail-favorite').addEventListener('click', toggleFavorite);
    $('#conversation-record').addEventListener('click', startJapaneseRecognition);
    $('#conversation-analyze').addEventListener('click', analyzeConversation);
    $('#global-search').addEventListener('focus', event => { state.searchActive = true; renderSearchSuggestions(event.target.value.trim().toLowerCase()); });
    $('#global-search').addEventListener('input', event => { state.searchActive = true; renderSearch(event.target.value); });
    $('#global-search').addEventListener('keydown', event => {
      if (event.key !== 'Enter' || !event.target.value.trim()) return;
      event.preventDefault();
      const question = event.target.value.trim();
      saveSearch(question.toLowerCase());
      askAi(question);
    });
    $('#global-search').addEventListener('blur', () => {
      setTimeout(() => { state.searchActive = false; renderSearchSuggestions(''); }, 160);
    });
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
  renderConversationLog();
  saveState();
  renderSearchSuggestions();
  bindStaticEvents();
  registerServiceWorker();
  navigate('home');
})();
