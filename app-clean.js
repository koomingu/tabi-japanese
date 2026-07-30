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
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v10A1.5 1.5 0 0 0 5.5 17H8" /></svg>',
    bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.75A1.75 1.75 0 0 1 7.75 2h8.5A1.75 1.75 0 0 1 18 3.75V22l-6-3.75L6 22V3.75Z" /></svg>'
  };

  const readList = name => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(name)) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const readMap = name => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(name)) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };
  const normalizeReadinessGoal = value => Math.max(5, Math.min(100, Math.round((Number(value) || 30) / 5) * 5));

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

  const savedCustomPhrases = readList('custom-phrases').filter(phrase => phrase && phrase.id && phrase.jp && phrase.ko);
  savedCustomPhrases.forEach(phrase => {
    if (!phrases.some(item => item.id === phrase.id)) phrases.push(phrase);
  });

  const state = {
    favorites: readList('favorites'),
    wordFavorites: readList('word-favorites').filter(word => word && word.category && word.jp),
    views: readList('views'),
    recentSearches: readList('recent-searches'),
    conversationHistory: deduplicateConversationHistory(readList('conversation-history')),
    searchActive: false,
    searchHasResults: false,
    activePhrase: null,
    previousScreen: 'home',
    reviewItems: [],
    reviewIndex: 0,
    kanaScript: 'hiragana',
    kanaGroup: 'basic',
    conversationMode: 'listen',
    conversationSituation: '전체',
    conversationPickerOpen: false,
    conversationPhraseQuery: '',
    pronunciationStyle: localStorage.getItem(storageKey('pronunciation-style')) === 'roman' ? 'roman' : 'hangul',
    readinessGoal: normalizeReadinessGoal(localStorage.getItem(storageKey('readiness-goal'))),
    bookmarkCategories: readMap('bookmark-categories'),
    bookmarkFilter: 'all',
    trip: readMap('trip'),
    travelMission: '',
    rehearsalPhrase: null,
    rehearsalStage: 0,
    rehearsalSpokenText: '',
    customPhrases: savedCustomPhrases,
    importCandidates: [],
    importSource: null
  };

  // 이전 버전은 가져온 표현을 자동으로 북마크에 넣었다. 한 번만 정리해 이후에는 사용자가 직접 북마크를 선택하게 한다.
  if (!localStorage.getItem(storageKey('custom-bookmarks-separated'))) {
    const customIds = new Set(savedCustomPhrases.map(phrase => phrase.id));
    state.favorites = state.favorites.filter(id => !customIds.has(id));
    localStorage.setItem(storageKey('custom-bookmarks-separated'), 'true');
  }

  const conversationReplyGuide = [
    { situations: ['전체'], patterns: [/^(かしこまりました|畏まりました)$/], japanese: 'かしこまりました', pronunciation: '카시코마리마시타', korean: '알겠습니다. 요청을 정중하게 받아들였다는 뜻이에요.', keywords: ['매우 정중한 “알겠습니다”'], next: ['ありがとうございます。', 'はい、お願いします。'] },
    { situations: ['전체'], patterns: [/^(わかりました|分かりました|分りました|しょうちしました|承知しました)$/], japanese: '分かりました', pronunciation: '와카리마시타', korean: '알겠습니다. 내용을 이해했거나 요청을 받아들였다는 뜻이에요.', keywords: ['요청 수락', '일상·서비스 상황'], next: ['ありがとうございます。', 'はい、お願いします。'] },
    { situations: ['식당', '카페'], patterns: [/満席/, /席.*(ありません|ない)/], japanese: '満席です', pronunciation: '만세키데스', korean: '만석이에요. 지금은 빈자리가 없다는 뜻이에요.', keywords: ['빈자리 없음', '대기 가능 여부 확인'], next: ['どのくらい待ちますか？', '予約できますか？'] },
    { situations: ['식당', '카페'], patterns: [/少々お待ちください/, /少しお待ちください/, /お待ちください/], japanese: '少々お待ちください', pronunciation: '쇼오쇼오 오마치 쿠다사이', korean: '잠시 기다려 주세요.', keywords: ['대기 요청'], next: ['はい、分かりました。', 'どのくらい待ちますか？'] },
    { situations: ['식당', '쇼핑', '카페'], patterns: [/現金のみ/, /現金だけ/], japanese: '現金のみです', pronunciation: '겐킨노미데스', korean: '현금만 가능합니다.', keywords: ['현금 결제만 가능'], next: ['現金で払います。', 'ATMはどこですか？'] },
    { situations: ['식당', '쇼핑', '카페'], patterns: [/カード.*(使えます|大丈夫)/, /カード.*(いいです|可能)/], japanese: 'カードは使えます', pronunciation: '카아도와 츠카에마스', korean: '카드 결제가 가능합니다.', keywords: ['카드 결제 가능'], next: ['カードで払います。', 'ありがとうございます。'] },
    { situations: ['교통', '길 묻기'], patterns: [/右/, /左/, /まっすぐ/], japanese: '右・左・まっすぐ', pronunciation: '미기 · 히다리 · 맛스구', korean: '길을 안내하는 말이에요. 각각 오른쪽·왼쪽·직진이라는 뜻입니다.', keywords: ['방향 안내'], next: ['もう一度お願いします。', '地図で見せてもらえますか？'] },
    { situations: ['교통'], patterns: [/次/, /終点/, /乗り換え/], japanese: '次・終点・乗り換え', pronunciation: '츠기 · 슈우텐 · 노리카에', korean: '다음 역·종점·환승과 관련된 안내예요.', keywords: ['전철 안내'], next: ['何番線ですか？', 'もう一度お願いします。'] },
    { situations: ['숙소'], patterns: [/パスポート/, /予約.*(確認|名前)/], japanese: 'パスポート・予約', pronunciation: '파스포오토 · 요야쿠', korean: '여권 또는 예약 확인을 요청하는 안내예요.', keywords: ['여권', '예약 확인'], next: ['予約しています。', 'パスポートを見せます。'] },
    { situations: ['쇼핑'], patterns: [/試着/, /サイズ/, /在庫/], japanese: '試着・サイズ・在庫', pronunciation: '시차쿠 · 사이즈 · 자이코', korean: '착용·사이즈·재고와 관련된 안내예요.', keywords: ['쇼핑 안내'], next: ['別のサイズはありますか？', 'ありがとうございます。'] },
    { situations: ['전체', '병원·약국'], patterns: [/頭.*痛/, /頭が痛い/], japanese: '頭が痛いです', pronunciation: '아타마가 이타이데스', korean: '머리가 아파요.', keywords: ['두통', '약국·병원에서 사용'], next: ['薬をください。', '病院はどこですか？'] },
    { situations: ['전체', '병원·약국'], patterns: [/お腹.*痛/, /腹.*痛/], japanese: 'お腹が痛いです', pronunciation: '오나카가 이타이데스', korean: '배가 아파요.', keywords: ['복통', '약국·병원에서 사용'], next: ['薬をください。', '病院はどこですか？'] },
    { situations: ['전체', '병원·약국'], patterns: [/熱.*(あります|です)/], japanese: '熱があります', pronunciation: '네츠가 아리마스', korean: '열이 있어요.', keywords: ['발열', '증상이 심하면 119'], next: ['病院はどこですか？', '救急車を呼んでください。'] }
  ];

  const situationReplyPreview = {
    '전체': [conversationReplyGuide[0], conversationReplyGuide[1]],
    식당: [conversationReplyGuide[2], conversationReplyGuide[3]],
    교통: [conversationReplyGuide[6], conversationReplyGuide[7]],
    숙소: [conversationReplyGuide[8], conversationReplyGuide[1]],
    쇼핑: [conversationReplyGuide[5], conversationReplyGuide[9]]
  };

  // 초급자가 바로 말하기 어려운 존경·겸양 표현은 같은 뜻의 쉬운 표현으로 통일한다.
  const beginnerAlternatives = {
    'お水をいただけますか？': ['お水をください。', '오미즈오 쿠다사이.'],
    '写真を撮っていただけますか？': ['写真を撮ってください。', '샤신오 톳테 쿠다사이.'],
    'タクシーを呼んでいただけますか？': ['タクシーを呼んでください。', '타쿠시이오 욘데 쿠다사이.'],
    '地図で見せてもらえますか？': ['地図で見せてください。', '치즈데 미세테 쿠다사이.'],
    'Wi-Fiのパスワードを教えてください。': ['Wi-Fiのパスワードは何ですか？', '와이파이노 파스와아도와 난데스카?'],
    '医者に診てもらいたいです。': ['お医者さんはいますか？', '오이샤상와 이마스카?'],
    'この薬の飲み方を教えてください。': ['この薬はどう飲みますか？', '코노 쿠스리와 도오 노미마스카?'],
    '日本語の説明が分かりません。': ['ゆっくり話してください。', '윳쿠리 하나시테 쿠다사이.'],
    '手荷物検査はどこですか？': ['荷物検査はどこですか？', '니모츠 켄사와 도코데스카?'],
    'チェックインカウンターはどこですか？': ['チェックインはどこですか？', '첵쿠인와 도코데스카?']
  };
  phrases.forEach(phrase => {
    const alternative = beginnerAlternatives[phrase.jp];
    if (alternative) [phrase.jp, phrase.romaji] = alternative;
  });

  const kanaRoman = { あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',だ:'da',で:'de',ど:'do',な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',を:'o',ん:'n',ゃ:'ya',ゅ:'yu',ょ:'yo',ぁ:'a',ぃ:'i',ぇ:'e',ぉ:'o',ゔ:'vu',きゃ:'kya',きゅ:'kyu',きょ:'kyo',ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',しゃ:'sha',しゅ:'shu',しょ:'sho',じゃ:'ja',じゅ:'ju',じょ:'jo',ちゃ:'cha',ちゅ:'chu',ちょ:'cho',にゃ:'nya',にゅ:'nyu',にょ:'nyo',ひゃ:'hya',ひゅ:'hyu',ひょ:'hyo',びゃ:'bya',びゅ:'byu',びょ:'byo',ぴゃ:'pya',ぴゅ:'pyu',ぴょ:'pyo',みゃ:'mya',みゅ:'myu',みょ:'myo',りゃ:'rya',りゅ:'ryu',りょ:'ryo',てぃ:'ti',でぃ:'di',ふぁ:'fa',ふぃ:'fi',ふぇ:'fe',ふぉ:'fo',うぃ:'wi',うぇ:'we',うぉ:'wo' };
  const hangulOnset = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const hangulVowel = ['a','ae','ya','yae','o','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const hangulCoda = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'p', 'l', 'l', 'l', 'l', 'm', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't', 't'];
  const kanaByRoman = Object.fromEntries(Object.entries(kanaRoman).map(([kana, roman]) => [roman, kana]));
  Object.assign(kanaByRoman, { a:'あ', i:'い', u:'う', e:'え', o:'お', ya:'や', yu:'ゆ', yo:'よ', wa:'わ', wo:'を', n:'ん' });
  const koreanKana = { 스:'す', 즈:'ず', 츠:'つ', 시:'し', 지:'じ', 샤:'しゃ', 슈:'しゅ', 쇼:'しょ', 쟈:'じゃ', 쥬:'じゅ', 죠:'じょ', 체:'ちぇ', 치:'ち', 테:'て', 데:'で', 티:'てぃ', 디:'でぃ', 후:'ふ', 히:'ひ', 후:'ふ', 푸:'ぷ', 부:'ぶ', 윳:'ゆっ', 윳:'ゆっ', 으:'う', 외:'え', 웨:'え', 워:'を', 위:'うぃ' };

  function koreanReadingToHiragana(reading = '') {
    return [...String(reading)].map(character => {
      if (koreanKana[character]) return koreanKana[character];
      const code = character.codePointAt(0);
      if (code < 0xac00 || code > 0xd7a3) return character;
      const index = code - 0xac00;
      const onset = hangulOnset[Math.floor(index / 588)];
      const vowel = hangulVowel[Math.floor((index % 588) / 28)];
      const coda = hangulCoda[index % 28];
      const syllable = onset + vowel;
      const kana = kanaByRoman[syllable] || kanaByRoman[vowel] || character;
      const tail = coda === 'ng' || coda === 'n' || coda === 'm' ? 'ん' : coda ? 'っ' : '';
      return kana + tail;
    }).join('').replace(/[?？]/g, '？');
  }

  function romanizeKana(kana = '') {
    let result = '';
    for (let index = 0; index < kana.length; index += 1) {
      const pair = kana.slice(index, index + 2);
      if (pair === 'っ') { result += 't'; continue; }
      if (kana[index] === 'っ') { result += kanaRoman[kana[index + 1]]?.[0] || ''; continue; }
      if (kanaRoman[pair]) { result += kanaRoman[pair]; index += 1; continue; }
      result += kanaRoman[kana[index]] || kana[index];
    }
    return result;
  }

  function displayPronunciation(reading = '') {
    return state.pronunciationStyle === 'roman' ? romanizeKana(koreanReadingToHiragana(reading)) : reading;
  }

  function japaneseWithYomi(japanese, reading) {
    return `<ruby>${escapeHtml(japanese)}<rt>${escapeHtml(koreanReadingToHiragana(reading))}</rt></ruby>`;
  }

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
    병원: ['약국', '머리 아파요', '배 아파요', '약', '구급차'], 쇼핑: ['가격', '카드', '면세', '사이즈', '영수증'],
    헬리콥터: ['비행기', '공항', '탑승구', '구급차']
  };
  // 문장에 드러나지 않는 여행자 표현은 표현 단위 키워드로 보완한다.
  const phraseSearchKeywords = {
    '식당-0': ['물', '물주세요', '식수'], '식당-1': ['메뉴판', '메뉴주세요'], '식당-2': ['추천', '추천메뉴'], '식당-4': ['알레르기', '음식알레르기'], '식당-6': ['포장', '테이크아웃'], '식당-7': ['계산', '결제', '식사계산'], '식당-8': ['따로계산', '분할결제'],
    '교통-0': ['역', '역까지'], '교통-2': ['표', '승차권'], '교통-3': ['교통카드', 'ic카드', '스이카'], '교통-5': ['막차', '막차시간'], '교통-6': ['택시', '택시승강장'],
    '쇼핑-0': ['가격', '얼마'], '쇼핑-1': ['카드', '카드결제', '신용카드'], '쇼핑-4': ['면세', '택스프리'], '쇼핑-7': ['영수증'], '쇼핑-9': ['현금', '현금결제'],
    '숙소-0': ['체크인', '호텔체크인'], '숙소-2': ['체크아웃'], '숙소-5': ['와이파이', 'wifi', '비밀번호'], '숙소-9': ['택시', '택시불러줘'],
    '길 묻기-0': ['역', '역어디'], '길 묻기-1': ['화장실', '화장실어디'], '길 묻기-3': ['지도', '길찾기'], '길 묻기-6': ['버스정류장'], '길 묻기-9': ['길잃음', '길을잃었어요'],
    '긴급 상황-0': ['도움', '도와줘'], '긴급 상황-1': ['경찰'], '긴급 상황-2': ['구급차', '응급차'], '긴급 상황-3': ['병원'], '긴급 상황-5': ['약국'], '긴급 상황-6': ['지갑분실'], '긴급 상황-7': ['여권분실'],
    '공항-0': ['체크인', '체크인카운터'], '공항-1': ['탑승구', '게이트'], '공항-3': ['수하물', '짐부치기'], '공항-4': ['보안검색'], '공항-5': ['환승'], '공항-7': ['환전'],
    '관광지-0': ['입장권', '티켓'], '관광지-5': ['화장실'], '관광지-6': ['출구'], '카페-0': ['커피'], '카페-2': ['포장', '테이크아웃'], '카페-9': ['와이파이', 'wifi'],
    '병원·약국-0': ['의사', '진료'], '병원·약국-1': ['두통', '머리아파요'], '병원·약국-2': ['복통', '배아파요'], '병원·약국-4': ['약'], '병원·약국-8': ['약국']
  };
  // 등록 표현에는 없지만 여행 중 자주 입력하는 키워드 100개와 탐색용 연관어.
  const additionalRelatedSearches = Object.fromEntries([
    { terms: ['라멘', '스시', '우동', '야키니쿠', '이자카야', '채식', '어린이메뉴', '맵지않게', '젓가락', '물티슈'], related: ['식당', '메뉴', '추천 메뉴', '주문', '계산'] },
    { terms: ['신칸센', '특급열차', '노선도', '개찰구', '환승시간', '막차시간', '좌석예약', '캐리어', '교통패스', '버스카드'], related: ['교통', '전철', '표', '환승', '택시'] },
    { terms: ['돈키호테', '드럭스토어', '할인', '쿠폰', '포인트', '선물포장', '택스리펀드', '재고', '환불', '면세한도'], related: ['쇼핑', '가격', '카드', '면세', '영수증'] },
    { terms: ['룸서비스', '세탁', '에어컨', '난방', '금연실', '흡연실', '어댑터', '충전기', '짐보관', '늦은체크인'], related: ['숙소', '체크인', '체크아웃', '와이파이', '수건'] },
    { terms: ['엘리베이터', '에스컬레이터', '계단', '코인락커', '관광안내소', '횡단보도', '신호등', '출구번호', '길건너', '편의점위치'], related: ['길 묻기', '지도', '역', '출구', '버스 정류장'] },
    { terms: ['분실물', '소매치기', '여권재발급', '카드분실', '지진', '태풍', '화재', '응급실', '신고', '안전'], related: ['긴급 상황', '경찰', '구급차', '병원', '도움'] },
    { terms: ['수하물초과', '기내수하물', '액체류', '출국심사', '입국심사', '세관', '보딩타임', '탑승권', '좌석변경', '항공편취소'], related: ['공항', '탑승구', '수하물', '환승', '환전'] },
    { terms: ['오픈시간', '휴관일', '예약필수', '오디오가이드', '전망대', '박물관', '신사', '온천', '벚꽃', '야경'], related: ['관광지', '입장권', '사진', '출구', '가이드'] },
    { terms: ['디카페인', '오트밀크', '시럽', '테라스', '콘센트', '리필', '뜨거운물', '아이스', '주문번호', '와이파이비번'], related: ['카페', '커피', '음료', '포장', '추천 메뉴'] },
    { terms: ['감기', '기침', '인후통', '설사', '멀미', '생리통', '소독약', '밴드', '처방전', '알약'], related: ['병원·약국', '의사', '약국', '약', '구급차'] }
  ].flatMap(({ terms, related }) => terms.map(term => [term, related])));
  Object.assign(relatedSearches, additionalRelatedSearches);
  const moreRelatedSearches = Object.fromEntries([
    { terms: ['모닝세트', '정식', '뷔페', '예약시간', '웨이팅', '바자리', '창가자리', '유아의자', '반찬', '소스', '와사비', '식전주', '디저트', '얼음물', '뜨거운차', '음식사진', '포장용기', '알레르겐', '글루텐프리', '계산서'], related: ['식당', '메뉴', '추천 메뉴', '주문', '계산'] },
    { terms: ['자유석', '지정석', '그린카', '플랫폼', '승강장번호', '출발시간', '도착시간', '첫차', '왕복표', '편도표', '어린이요금', '교통앱', '택시요금', '택시앱', '버스시간표', '공항리무진', '자전거대여', '렌터카', '주차장', '통행료'], related: ['교통', '전철', '표', '환승', '택시'] },
    { terms: ['백화점', '아울렛', '시장', '기념품', '한정판', '색상', '사이즈교환', '시착실', '포장지', '쇼핑백', '셀프계산대', '현금인출', 'atm', '동전', '잔돈', '세일기간', '가격표', '바코드', '전자영수증', '해외카드'], related: ['쇼핑', '가격', '카드', '면세', '영수증'] },
    { terms: ['조식시간', '조식장소', '침대추가', '베개', '이불', '샴푸', '드라이기', '냉장고', '전자레인지', '정수기', '수영장', '헬스장', '프런트', '체크아웃연장', '얼리체크인', '객실청소', '방교체', '소음', '고장', '비상구'], related: ['숙소', '체크인', '체크아웃', '와이파이', '수건'] },
    { terms: ['지하통로', '육교', '지하철출구', '역무원', '버스정류장번호', '택시정류장', '공중화장실', '흡연구역', '쓰레기통', '코인세탁', '우체국', '은행', '환전소위치', '약국위치', '슈퍼마켓', '공원', '광장', '해변', '항구', '터미널'], related: ['길 묻기', '지도', '역', '출구', '버스 정류장'] },
    { terms: ['분실신고', '도난신고', '보험', '여행자보험', '대사관', '영사관', '비상연락처', '휴대폰분실', '여권사본', '현금분실', '부상', '출혈', '골절', '알레르기반응', '호흡곤란', '고열', '중독', '폭우', '피난소', '경보'], related: ['긴급 상황', '경찰', '구급차', '병원', '도움'] },
    { terms: ['온라인체크인', '여권검사', '출발층', '도착층', '항공사카운터', '면세점', '라운지', '보안검사', '보조배터리', '위탁수하물', '수하물벨트', '수하물분실', '환승게이트', '비자', '입국카드', '검역', '지연증명서', '결항', '탑승마감', '우선탑승'], related: ['공항', '탑승구', '수하물', '환승', '환전'] },
    { terms: ['테마파크', '수족관', '동물원', '미술관', '전시회', '축제', '불꽃놀이', '야시장', '전통시장', '기념관', '성', '정원', '등산', '케이블카', '유람선', '투어버스', '집합장소', '입장시간', '재입장', '사진금지'], related: ['관광지', '입장권', '사진', '출구', '가이드'] },
    { terms: ['아메리카노', '라떼', '말차', '차이라떼', '과일주스', '탄산수', '빵', '케이크', '샌드위치', '알레르기우유', '무설탕', '샷추가', '휘핑크림', '테이크아웃컵', '매장컵', '빨대', '냅킨', '좌석여유', '조용한자리', '반려동물'], related: ['카페', '커피', '음료', '포장', '추천 메뉴'] },
    { terms: ['두통약', '진통제', '해열제', '감기약', '소화제', '멀미약', '알레르기약', '안약', '피부약', '연고', '마스크', '체온계', '혈압', '당뇨', '임신', '소아과', '치과', '피부과', '정형외과', '건강보험'], related: ['병원·약국', '의사', '약국', '약', '구급차'] }
  ].flatMap(({ terms, related }) => terms.map(term => [term, related])));
  Object.assign(relatedSearches, moreRelatedSearches);

  function bookmarkCategory(phrase) {
    return state.bookmarkCategories[phrase.id] || phrase.cat;
  }

  function wordFavoriteIndex(category, jp) {
    return state.wordFavorites.findIndex(word => word.category === category && word.jp === jp);
  }

  function isWordFavorite(category, jp) {
    return wordFavoriteIndex(category, jp) !== -1;
  }

  function toggleWordFavorite(word) {
    const index = wordFavoriteIndex(word.category, word.jp);
    const isAdding = index === -1;
    if (isAdding) {
      state.wordFavorites.push({
        category: word.category,
        jp: word.jp,
        reading: word.reading || '',
        ko: word.ko || ''
      });
    } else {
      state.wordFavorites.splice(index, 1);
    }
    saveState();
    showToast(isAdding ? '단어를 북마크에 추가했어요.' : '단어 북마크를 해제했어요.');
    return isAdding;
  }

  function bookmarkWordCard(word) {
    return `<article class="quick-word-card bookmark-word-card">
      <strong>${japaneseWithYomi(word.jp, word.reading)}</strong><span class="pronunciation">${displayPronunciation(word.reading)}</span><small>${escapeHtml(word.ko)}</small>
      <div class="phrase-actions">
        <button class="icon-action" data-action="speak-word" data-text="${escapeHtml(word.jp)}" aria-label="${escapeHtml(word.jp)} 듣기" title="일본어 듣기">${icons.listen}</button>
        <button class="icon-action is-active" data-action="toggle-word-favorite" data-category="${escapeHtml(word.category)}" data-jp="${escapeHtml(word.jp)}" data-reading="${escapeHtml(word.reading)}" data-ko="${escapeHtml(word.ko)}" aria-label="${escapeHtml(word.jp)} 북마크 해제" title="북마크 해제">${icons.bookmark}</button>
      </div>
    </article>`;
  }

  function renderBookmarksByCategory(words, savedPhrases) {
    const categories = [...Object.keys(categoryMeta), ...words.map(word => word.category), ...savedPhrases.map(bookmarkCategory)]
      .filter((category, index, all) => all.indexOf(category) === index)
      .filter(category => words.some(word => word.category === category) || savedPhrases.some(phrase => bookmarkCategory(phrase) === category));
    if (!categories.length) return '<p class="profile-empty">아직 북마크한 단어·표현이 없어요.</p>';
    return categories.map(category => {
      const categoryWords = words.filter(word => word.category === category);
      const categoryPhrases = savedPhrases.filter(phrase => bookmarkCategory(phrase) === category);
      return `<section class="bookmark-category-group"><h2>${escapeHtml(category)}</h2>${categoryWords.length ? `<p class="bookmark-content-label">단어</p><div class="quick-word-grid bookmark-word-grid">${categoryWords.map(bookmarkWordCard).join('')}</div>` : ''}${categoryPhrases.length ? `<p class="bookmark-content-label">표현</p><div class="phrase-list bookmark-phrase-list">${categoryPhrases.map(phraseCard).join('')}</div>` : ''}</section>`;
    }).join('');
  }

  function saveState() {
    localStorage.setItem(storageKey('favorites'), JSON.stringify(state.favorites));
    localStorage.setItem(storageKey('word-favorites'), JSON.stringify(state.wordFavorites));
    localStorage.setItem(storageKey('views'), JSON.stringify(state.views));
    localStorage.setItem(storageKey('recent-searches'), JSON.stringify(state.recentSearches));
    localStorage.setItem(storageKey('conversation-history'), JSON.stringify(state.conversationHistory));
    localStorage.setItem(storageKey('bookmark-categories'), JSON.stringify(state.bookmarkCategories));
    localStorage.setItem(storageKey('trip'), JSON.stringify(state.trip));
    localStorage.setItem(storageKey('custom-phrases'), JSON.stringify(state.customPhrases));
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
    if (screen === 'conversation') setConversationMode(state.conversationMode);
    if (screen === 'home') renderTripHome();
    if (screen === 'trip-pack') renderTripPack();
    if (screen === 'travel-mode') renderTravelMode();
    if (screen === 'import') renderImportCandidates();
    window.scrollTo(0, 0);
  }

  function setConversationMode(mode) {
    state.conversationMode = mode === 'speak' ? 'speak' : 'listen';
    const isSpeak = state.conversationMode === 'speak';
    $$('.conversation-toggle button').forEach(button => button.classList.toggle('active', button.dataset.mode === state.conversationMode));
    $('#conversation-title').textContent = isSpeak ? '한국어를 일본어로 말하기' : '상대방 답변 이해하기';
    $('#conversation-input').placeholder = isSpeak
      ? '말하고 싶은 한국어를 입력하거나 마이크를 눌러 말하세요.'
      : '상대방이 말한 일본어를 입력하거나 마이크를 눌러 녹음하세요.';
    $('#conversation-record').setAttribute('aria-label', isSpeak ? '한국어로 말하기' : '일본어 답변 녹음');
    $('#conversation-record').textContent = '● 말하기';
    $('#conversation-analyze').textContent = isSpeak ? '일본어로 만들기' : '이해하기';
    $('#conversation-note').textContent = isSpeak
      ? '한국어를 말하면 바로 보여주고 들려줄 수 있어요.'
      : '마이크를 누르면 일본어 음성을 텍스트로 받아와요.';
    renderConversationPicker();
  }

  function setConversationSituation(situation) {
    state.conversationSituation = situationReplyPreview[situation] ? situation : '전체';
    $$('.situation-picker button').forEach(button => button.classList.toggle('active', button.dataset.situation === state.conversationSituation));
    renderConversationPicker();
    record('conversation_situation_selected', { situation: state.conversationSituation });
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

  function phraseCard(phrase, searchReason = '') {
    const saved = state.favorites.includes(phrase.id);
    return `<article class="phrase-card" data-action="open-phrase" data-id="${phrase.id}" role="button" tabindex="0" aria-label="${phrase.jp} 자세히 보기">
      <div class="jp">${japaneseWithYomi(phrase.jp, phrase.romaji)}</div>
      <div class="pronunciation">${displayPronunciation(phrase.romaji)}</div>
      <div class="ko">${phrase.ko}</div>
      ${searchReason ? `<div class="search-match">${searchReason}</div>` : ''}
      <div class="phrase-actions">
        <button class="icon-action" data-action="speak" data-id="${phrase.id}" aria-label="${phrase.jp} 듣기" title="일본어 듣기">${icons.listen}</button>
        <button class="icon-action ${saved ? 'is-active' : ''}" data-action="toggle-favorite" data-id="${phrase.id}" aria-label="${phrase.jp} ${saved ? '북마크 해제' : '북마크'}" title="북마크">${icons.bookmark}</button>
      </div>
    </article>`;
  }

  function quickWordPreview(category) {
    const words = quickWords[category] || [];
    if (!words.length) return '';
    return `<section class="quick-word-preview"><div class="quick-word-preview-heading"><div><p class="eyebrow">QUICK WORDS</p><h2>이 상황에서 바로 쓰는 단어</h2></div><button data-action="open-quick-words" data-category="${category}">전체 보기 ›</button></div><div class="quick-word-preview-grid">${words.slice(0, 4).map(([japanese, reading, korean]) => {
      const saved = isWordFavorite(category, japanese);
      return `<article class="quick-word-preview-card"><strong>${japaneseWithYomi(japanese, reading)}</strong><span>${displayPronunciation(reading)}</span><small>${korean}</small><div class="quick-word-preview-actions"><button class="icon-action" data-action="speak-word" data-text="${japanese}" aria-label="${japanese} 듣기" title="일본어 듣기">${icons.listen}</button><button class="icon-action ${saved ? 'is-active' : ''}" data-action="toggle-word-favorite" data-category="${category}" data-jp="${japanese}" data-reading="${reading}" data-ko="${korean}" aria-label="${japanese} ${saved ? '북마크 해제' : '북마크'}" title="북마크">${icons.bookmark}</button></div></article>`;
    }).join('')}</div></section>`;
  }

  function renderCategories() {
    $('#category-grid').innerHTML = Object.entries(categoryMeta).map(([name, [icon, color, description]]) => `
      <button class="category-card" data-action="open-category" data-category="${name}" style="--card:${color}">
        <span class="emoji">${icon}</span><strong>${name}</strong><small>${description} · ${phrases.filter(phrase => phrase.cat === name).length}개</small>
      </button>`).join('');
  }

  const tripCategoryMap = { 공항: ['공항'], 식당: ['식당', '카페'], 교통: ['교통', '길 묻기'], 숙소: ['숙소'], 쇼핑: ['쇼핑'], 관광지: ['관광지'] };
  const itineraryOptions = ['공항', '숙소', '식당', '교통', '관광지', '쇼핑'];
  const missionCopy = {
    공항: ['공항에서 이동 준비하기', '체크인과 이동 중 바로 필요한 말을 준비해요.'],
    숙소: ['숙소에서 체크인하기', '예약 확인부터 필요한 요청까지 짧게 연습해요.'],
    식당: ['식당에서 주문하기', '메뉴를 고르고 주문을 마칠 때 필요한 말이에요.'],
    교통: ['다음 목적지로 이동하기', '역과 길에서 바로 꺼내 말할 표현이에요.'],
    관광지: ['관광지에서 길 묻기', '입장과 길 안내에 필요한 말을 준비해요.'],
    쇼핑: ['가게에서 원하는 물건 찾기', '사이즈·재고·결제를 자연스럽게 물어봐요.']
  };
  const cityPhrases = {
    도쿄: { id: 'city-tokyo', cat: '도쿄에서 바로 쓰는 말', jp: '東京駅に行きたいです。', romaji: '토오쿄오에키니 이키타이데스.', ko: '도쿄역에 가고 싶어요.', use: '도쿄에서 역과 전철을 이용할 때 바로 말해요.', note: '역 이름은 지도 화면을 함께 보여 주면 더 정확해요.' },
    오사카: { id: 'city-osaka', cat: '오사카에서 바로 쓰는 말', jp: '大阪城に行きたいです。', romaji: '오오사카조오니 이키타이데스.', ko: '오사카성에 가고 싶어요.', use: '오사카 관광지로 가는 길을 물을 때 바로 말해요.', note: '목적지는 지도 화면을 함께 보여 주면 더 정확해요.' },
    후쿠오카: { id: 'city-fukuoka', cat: '후쿠오카에서 바로 쓰는 말', jp: '博多駅に行きたいです。', romaji: '하카타에키니 이키타이데스.', ko: '하카타역에 가고 싶어요.', use: '후쿠오카에서 하카타역으로 가는 길을 물을 때 바로 말해요.', note: '목적지는 지도 화면을 함께 보여 주면 더 정확해요.' },
    삿포로: { id: 'city-sapporo', cat: '삿포로에서 바로 쓰는 말', jp: '札幌駅に行きたいです。', romaji: '삿포로에키니 이키타이데스.', ko: '삿포로역에 가고 싶어요.', use: '삿포로에서 역으로 가는 길을 물을 때 바로 말해요.', note: '목적지는 지도 화면을 함께 보여 주면 더 정확해요.' },
    교토: { id: 'city-kyoto', cat: '교토에서 바로 쓰는 말', jp: '京都駅に行きたいです。', romaji: '쿄오토에키니 이키타이데스.', ko: '교토역에 가고 싶어요.', use: '교토에서 역과 버스를 이용할 때 바로 말해요.', note: '버스 정류장과 목적지를 지도에서 함께 보여 주세요.' }
  };
  Object.values(cityPhrases).forEach(phrase => { if (!phrases.some(item => item.id === phrase.id)) phrases.push(phrase); });

  function tripPhraseIds() {
    const interests = Array.isArray(state.trip.interests) && state.trip.interests.length ? state.trip.interests : ['식당', '교통', '숙소'];
    const itinerary = Array.isArray(state.trip.itinerary) ? state.trip.itinerary : [];
    const itineraryCategories = itinerary.flatMap(day => day.scenarios || []);
    const categories = [...new Set([...itineraryCategories, ...interests])].flatMap(interest => tripCategoryMap[interest] || []);
    const chosen = categories.flatMap(category => phrases.filter(phrase => phrase.cat === category).slice(0, 3)).slice(0, 22);
    const essentials = phrases.filter(phrase => phrase.cat === '긴급 상황').slice(0, 2);
    const cityPhrase = cityPhrases[state.trip.city];
    return [...new Map([cityPhrase, ...chosen, ...essentials].filter(Boolean).map(phrase => [phrase.id, phrase])).values()].map(phrase => phrase.id);
  }

  function tripMissions() {
    const itinerary = Array.isArray(state.trip.itinerary) && state.trip.itinerary.length ? state.trip.itinerary : defaultItinerary(state.trip.duration || 3);
    return itinerary.flatMap(day => (day.scenarios || []).map((scenario, index) => {
      const [title, description] = missionCopy[scenario] || [`${scenario}에서 바로 말하기`, '지금 필요한 표현을 짧게 준비해요.'];
      const categories = tripCategoryMap[scenario] || [scenario];
      const phrase = tripPhraseIds().map(findPhrase).find(item => item && categories.includes(item.cat));
      return { day: day.day, order: index + 1, scenario, title, description, phrase };
    }));
  }

  function currentTripMission() {
    const activeDay = activeItineraryDay().day;
    return tripMissions().find(mission => mission.day === activeDay) || tripMissions()[0] || null;
  }

  function formatTripDate(value) {
    if (!value) return '출발일 미정';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? '출발일 미정' : `${date.getMonth() + 1}월 ${date.getDate()}일 출발`;
  }

  function activeItineraryDay() {
    const itinerary = Array.isArray(state.trip.itinerary) && state.trip.itinerary.length ? state.trip.itinerary : defaultItinerary(state.trip.duration || 3);
    if (!state.trip.date) return itinerary[0];
    const start = new Date(`${state.trip.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const index = Math.floor((today - start) / 86400000);
    return itinerary[Math.max(0, Math.min(itinerary.length - 1, index))];
  }

  function scenarioForCategory(category = '') {
    if (category === '카페' || category === '식당') return '식당';
    if (category === '길 묻기' || category === '교통') return '교통';
    return itineraryOptions.includes(category) ? category : null;
  }

  function nextSituationRecommendation() {
    const day = activeItineraryDay();
    const scenarios = day?.scenarios?.length ? day.scenarios : state.trip.interests || ['식당'];
    const lastPhrase = findPhrase(state.views[0]);
    const current = scenarioForCategory(lastPhrase?.cat);
    const currentIndex = scenarios.indexOf(current);
    const next = scenarios[currentIndex >= 0 && currentIndex < scenarios.length - 1 ? currentIndex + 1 : 0] || '식당';
    return { day: day?.day || 1, scenario: next };
  }

  function renderTripHome() {
    const host = $('#trip-home');
    if (!state.trip.ready) {
      host.innerHTML = `<section class="trip-hero"><p class="eyebrow">MY JAPAN TRIP</p><h1>여행 중 필요한 말,<br /><em>순서대로 준비하기.</em></h1><p>일정을 고르면 그날 해야 할 말과 예상 답변을 말하기 플랜으로 정리해 드려요.</p><button class="trip-primary" data-action="start-trip">내 말하기 플랜 만들기</button></section>`;
      return;
    }
    const mission = currentTripMission();
    host.innerHTML = `<section class="trip-ready-card"><div class="trip-ready-top"><p class="eyebrow">TODAY'S SPEAKING PLAN</p><span>${escapeHtml(state.trip.city || '일본')} · ${mission ? `DAY ${mission.day}` : formatTripDate(state.trip.date)}</span></div><h2>${escapeHtml(mission?.title || '여행 말하기 플랜')}</h2><p>${escapeHtml(mission?.description || '오늘 일정에 맞는 말하기 미션을 준비해 두세요.')}</p><div class="trip-ready-bottom"><span class="trip-ready-count"><b>${tripMissions().length}</b>개 여행 미션</span><button data-action="open-trip-pack">오늘 플랜 보기 <b>›</b></button></div></section>`;
  }

  function fillTripForm() {
    $('#trip-city').value = state.trip.city || '도쿄';
    $('#trip-date').value = state.trip.date || '';
    $('#trip-duration').value = String(state.trip.duration || 3);
    const interests = state.trip.interests || ['식당', '교통', '숙소'];
    $$('input[name="trip-interest"]').forEach(input => { input.checked = interests.includes(input.value); });
    renderItineraryBuilder();
  }

  function defaultItinerary(duration) {
    return Array.from({ length: duration }, (_, index) => {
      if (index === 0) return { day: index + 1, scenarios: ['공항', '숙소'] };
      if (index === duration - 1 && duration > 1) return { day: index + 1, scenarios: ['쇼핑', '공항'] };
      return { day: index + 1, scenarios: ['관광지', '식당'] };
    });
  }

  function itineraryDayLabel(index) {
    const value = $('#trip-date').value;
    if (!value) return `${index + 1}일 차`;
    const date = new Date(`${value}T00:00:00`);
    date.setDate(date.getDate() + index);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 · ${index + 1}일 차`;
  }

  function renderItineraryBuilder() {
    const duration = Number($('#trip-duration').value || 3);
    const stored = Array.isArray(state.trip.itinerary) && state.trip.itinerary.length === duration ? state.trip.itinerary : defaultItinerary(duration);
    $('#itinerary-builder').innerHTML = stored.map((day, index) => `<section class="itinerary-day"><p>${itineraryDayLabel(index)}</p><div>${itineraryOptions.map(scenario => `<label><input type="checkbox" data-itinerary-scenario data-day="${index}" value="${scenario}" ${day.scenarios?.includes(scenario) ? 'checked' : ''} /><span>${scenario}</span></label>`).join('')}</div></section>`).join('');
  }

  function openTripSetup() {
    state.previousScreen = $('.screen.active').id.replace('-screen', '');
    fillTripForm();
    navigate('trip-setup', '');
  }

  function saveTrip(event) {
    event.preventDefault();
    const interests = $$('input[name="trip-interest"]:checked').map(input => input.value);
    if (!interests.length) {
      showToast('한 가지 이상 선택해 주세요.');
      return;
    }
    const duration = Number($('#trip-duration').value || 3);
    const itinerary = Array.from({ length: duration }, (_, index) => ({ day: index + 1, scenarios: $$(`[data-itinerary-scenario][data-day="${index}"]:checked`).map(input => input.value) }));
    state.trip = { ready: true, city: $('#trip-city').value, date: $('#trip-date').value, duration, interests, itinerary, createdAt: state.trip.createdAt || new Date().toISOString() };
    saveState();
    record('trip_pack_created', { city: state.trip.city, interests, duration, itinerary });
    navigate('trip-pack', '');
  }

  function deleteTrip() {
    if (!state.trip.ready) return;
    const confirmed = window.confirm('이 말하기 플랜을 삭제할까요? 저장한 북마크와 최근 기록은 유지됩니다.');
    if (!confirmed) return;
    const city = state.trip.city;
    state.trip = {};
    saveState();
    record('trip_pack_deleted', { city });
    showToast('말하기 플랜을 삭제했어요.');
    navigate('home');
  }

  function renderTripPack() {
    const pack = tripPhraseIds().map(findPhrase).filter(Boolean);
    const activeDay = activeItineraryDay().day;
    const missions = tripMissions();
    $('#trip-pack-title').textContent = `${state.trip.city || '나의'} 여행 말하기 플랜`;
    $('#trip-pack-description').textContent = `${formatTripDate(state.trip.date)} · 오늘 할 일을 따라, 필요한 말을 순서대로 준비하세요.`;
    $('#trip-pack-list').innerHTML = pack.length ? `<div class="trip-plan-heading"><p class="eyebrow">YOUR TRAVEL MISSIONS</p><h2>일정에 맞춰 하나씩 끝내세요</h2></div><div class="trip-mission-list">${missions.map(mission => `<article class="trip-mission-card ${mission.day === activeDay ? 'is-today' : ''}"><div class="trip-mission-meta"><span>DAY ${mission.day} · ${mission.order}</span>${mission.day === activeDay ? '<b>오늘</b>' : ''}</div><h2>${escapeHtml(mission.title)}</h2><p>${escapeHtml(mission.description)}</p>${mission.phrase ? `<div class="trip-mission-phrase"><span>먼저 이 말부터</span><strong>${japaneseWithYomi(mission.phrase.jp, mission.phrase.romaji)}</strong><small>${escapeHtml(mission.phrase.ko)}</small></div>` : ''}<div class="trip-mission-actions"><button data-action="open-mission-mode" data-scenario="${escapeHtml(mission.scenario)}">현장에서 쓰기 <b>›</b></button><button data-action="start-rehearsal" data-scenario="${escapeHtml(mission.scenario)}">30초 연습</button></div></article>`).join('')}</div>` : '<p class="profile-empty">여행 설정을 완료하면 말하기 플랜이 만들어져요.</p>';
    record('trip_pack_opened', { count: pack.length });
  }

  function renderTravelMode() {
    const mission = tripMissions().find(item => item.scenario === state.travelMission) || currentTripMission();
    const categories = mission ? tripCategoryMap[mission.scenario] || [mission.scenario] : [];
    const pack = tripPhraseIds().map(findPhrase).filter(phrase => !categories.length || categories.includes(phrase?.cat));
    $('#travel-mode-list').innerHTML = pack.length ? `<section class="travel-mode-mission"><p class="eyebrow">DAY ${mission?.day || 1} · NOW</p><h2>${escapeHtml(mission?.title || '지금 필요한 말')}</h2><p>${escapeHtml(mission?.description || '아래 표현을 듣고 바로 보여 주세요.')}</p></section>${pack.map(phrase => `<article class="travel-mode-card" data-action="open-phrase" data-id="${phrase.id}" role="button" tabindex="0"><span>${escapeHtml(phrase.cat)}</span><strong>${japaneseWithYomi(phrase.jp, phrase.romaji)}</strong><em>${escapeHtml(displayPronunciation(phrase.romaji))}</em><small>${escapeHtml(phrase.ko)}</small><div class="travel-mode-actions"><button class="icon-action" data-action="speak" data-id="${phrase.id}" aria-label="${escapeHtml(phrase.jp)} 듣기" title="일본어 듣기">${icons.listen}</button><button class="icon-action" data-action="copy-phrase" data-id="${phrase.id}" aria-label="${escapeHtml(phrase.jp)} 복사하기" title="일본어 복사하기">${icons.copy}</button><button class="icon-action ${state.favorites.includes(phrase.id) ? 'is-active' : ''}" data-action="toggle-favorite" data-id="${phrase.id}" aria-label="${escapeHtml(phrase.jp)} 북마크" title="북마크">${icons.bookmark}</button></div></article>`).join('')}<section class="travel-mode-next"><p class="eyebrow">30 SECOND REHEARSAL</p><h2>상대 답변까지 연습하기</h2><p>지금 미션에서 실제로 대화가 이어질 때를 대비해요.</p><button data-action="start-rehearsal" data-scenario="${escapeHtml(mission?.scenario || '')}">이 미션 연습하기 <b>›</b></button></section>` : '<p class="profile-empty">먼저 말하기 플랜을 만들어 주세요.</p>';
    record('travel_mode_opened', { count: pack.length });
  }

  async function shareTrip() {
    if (!state.trip.ready) return;
    const url = new URL(window.location.href);
    url.searchParams.set('tabi-city', state.trip.city || '일본');
    if (state.trip.date) url.searchParams.set('tabi-date', state.trip.date);
    url.searchParams.set('tabi-interests', (state.trip.interests || []).join(','));
    const shareData = { title: `${state.trip.city || '일본'} 여행 말하기 플랜`, text: '여행 일정에 맞는 말하기 미션을 함께 준비해요.', url: url.toString() };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        showToast('말하기 플랜 링크를 복사했어요.');
      }
      record('trip_pack_shared', { city: state.trip.city });
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('링크를 복사하지 못했어요.');
    }
  }

  function openRehearsal(scenario = '') {
    const pack = tripPhraseIds().map(findPhrase).filter(Boolean);
    state.previousScreen = 'trip-pack';
    state.rehearsalPhrase = null;
    state.rehearsalStage = 0;
    state.rehearsalSpokenText = '';
    if (scenario) {
      const category = (tripCategoryMap[scenario] || [scenario]).find(item => pack.some(phrase => phrase.cat === item));
      if (category) { chooseRehearsal(category); navigate('rehearsal', ''); return; }
    }
    const categories = [...new Set(pack.map(phrase => phrase.cat))].slice(0, 6);
    $('#rehearsal-content').innerHTML = `<section class="rehearsal-picker"><p class="eyebrow">CHOOSE A SITUATION</p><h2>어떤 상황을 연습할까요?</h2><div>${categories.map(category => `<button data-action="choose-rehearsal" data-category="${escapeHtml(category)}"><span>${escapeHtml(category)}</span><b>›</b></button>`).join('')}</div></section>`;
    record('rehearsal_opened');
    navigate('rehearsal', '');
  }

  function chooseRehearsal(category) {
    state.rehearsalPhrase = tripPhraseIds().map(findPhrase).find(phrase => phrase?.cat === category) || null;
    state.rehearsalStage = 0;
    state.rehearsalSpokenText = '';
    renderRehearsal();
  }

  function startRehearsalRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast('이 브라우저에서는 음성 인식을 지원하지 않아요.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    const button = $('[data-action="rehearsal-record"]');
    if (button) { button.textContent = '듣고 있어요…'; button.disabled = true; }
    recognition.onresult = event => {
      state.rehearsalSpokenText = event.results[0][0].transcript;
      record('rehearsal_spoken', { id: state.rehearsalPhrase?.id });
      renderRehearsal();
    };
    recognition.onerror = () => { showToast('음성을 인식하지 못했어요. 다시 말해 보세요.'); renderRehearsal(); };
    recognition.start();
  }

  function renderRehearsal() {
    const phrase = state.rehearsalPhrase;
    if (!phrase) return;
    const replies = phraseReplies(phrase).slice(0, 3);
    const [replyJapanese, replyReading, replyKorean] = replies[0];
    const stage = state.rehearsalStage;
    const content = stage === 0
      ? `<p class="eyebrow">STEP 1 · MY TURN</p><h2>${escapeHtml(phrase.ko)}</h2><p>이 말을 일본어로 해 보세요.</p><button class="rehearsal-primary" data-action="rehearsal-reveal">일본어 표현 확인하기</button>`
      : stage === 1
        ? `<p class="eyebrow">STEP 1 · MY TURN</p><h2>${japaneseWithYomi(phrase.jp, phrase.romaji)}</h2><p class="rehearsal-reading">${escapeHtml(displayPronunciation(phrase.romaji))}</p><p>${escapeHtml(phrase.ko)}</p>${state.rehearsalSpokenText ? `<p class="rehearsal-spoken">내가 말한 문장 · ${escapeHtml(state.rehearsalSpokenText)}</p>` : ''}<div class="rehearsal-actions rehearsal-actions-three"><button class="rehearsal-listen" data-action="speak" data-id="${phrase.id}">${icons.listen} 듣기</button><button class="rehearsal-listen" data-action="rehearsal-record">● 말해 보기</button><button class="rehearsal-primary" data-action="rehearsal-next">답변 듣기</button></div>`
        : stage === 2
          ? `<p class="eyebrow">STEP 2 · THEIR TURN</p><h2>상대는 이렇게 답할 수 있어요</h2><p>답변을 먼저 듣고, 아래 뜻과 발음을 확인해 보세요.</p><div class="rehearsal-replies">${replies.map(([japanese, reading, korean]) => `<article><strong>${japaneseWithYomi(japanese, reading)}</strong><span>${escapeHtml(displayPronunciation(reading))}</span><small>${escapeHtml(korean)}</small><button class="icon-action" data-action="speak-word" data-text="${escapeHtml(japanese)}" aria-label="${escapeHtml(japanese)} 듣기">${icons.listen}</button></article>`).join('')}</div><button class="rehearsal-primary" data-action="rehearsal-finish">리허설 완료</button>`
          : `<p class="eyebrow">COMPLETE</p><h2>${escapeHtml(replyKorean)}</h2><p>${japaneseWithYomi(replyJapanese, replyReading)}</p><p class="rehearsal-reading">${escapeHtml(displayPronunciation(replyReading))}</p><button class="rehearsal-primary" data-action="start-rehearsal">다른 상황 연습하기</button>`;
    $('#rehearsal-content').innerHTML = `<section class="rehearsal-card"><span class="rehearsal-category">${escapeHtml(phrase.cat)}</span>${content}</section>`;
  }

  function loadSharedTrip() {
    const params = new URLSearchParams(window.location.search);
    const city = params.get('tabi-city');
    const interests = params.get('tabi-interests')?.split(',').filter(interest => tripCategoryMap[interest]);
    if (!city || !interests?.length) return;
    state.trip = { ready: true, city, date: params.get('tabi-date') || '', interests, shared: true };
    saveState();
    record('trip_pack_opened_from_link', { city });
  }

  function renderProfile() {
    const events = readList('events');
    const audioCount = events.filter(event => event.name === 'audio_play').length;
    const readiness = Math.min(100, Math.round((state.views.length / state.readinessGoal) * 100));
    $('#stat-views').textContent = state.views.length;
    $('#stat-audio').textContent = audioCount;
    $('#stat-favorites').textContent = state.favorites.length + state.wordFavorites.length;
    $('#progress-label').textContent = `${readiness}% 준비`;
    $('#readiness-message').textContent = state.views.length
      ? readiness >= 100 ? `목표 ${state.readinessGoal}개를 달성했어요. 출발 전 복습으로 기억을 다져 보세요.` : `목표 ${state.readinessGoal}개 중 ${state.views.length}개를 확인했어요. 조금만 더 준비해 볼까요?`
      : '표현을 확인하며 여행 준비를 시작해 보세요.';
    $('#readiness-goal-input').value = state.readinessGoal;
    $('#progress-bar').style.width = `${readiness}%`;
    $('.progress-track').setAttribute('aria-valuenow', String(readiness));
    $('#history-description').textContent = state.views.length ? `${state.views.length}개 표현` : '아직 확인한 표현이 없어요';
    $('#profile-custom-count').textContent = state.customPhrases.length ? `${state.customPhrases.length}개 표현` : '아직 추가한 표현이 없어요';
    const bookmarkCount = state.favorites.length + state.wordFavorites.length;
    $('#profile-favorites-count').textContent = bookmarkCount ? `${bookmarkCount}개 저장됨` : '아직 북마크한 단어·표현이 없어요';
    $$('.pronunciation-options button').forEach(button => {
      const selected = button.dataset.style === state.pronunciationStyle;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-checked', String(selected));
    });
  }

  function openList(type) {
    state.previousScreen = $('.screen.active').id.replace('-screen', '');
    $('#list-screen [data-back]').hidden = false;
    const list = type === 'popular' ? phrases.slice(0, 12)
      : type === 'favorites' ? phrases.filter(phrase => state.favorites.includes(phrase.id) && (state.bookmarkFilter === 'all' || bookmarkCategory(phrase) === state.bookmarkFilter))
      : type === 'history' ? state.views.map(findPhrase).filter(Boolean)
      : type === 'custom' ? state.customPhrases.map(phrase => findPhrase(phrase.id)).filter(Boolean)
      : phrases.filter(phrase => phrase.cat === type);
    const labels = {
      popular: ['QUICK ACCESS', '자주 쓰는 말'],
      favorites: ['BOOKMARKS', '북마크한 단어·표현'],
      history: ['LEARNING LOG', '최근 확인'],
      custom: ['MY PHRASES', '내가 추가한 표현']
    };
    const [eyebrow, title] = labels[type] || ['SITUATION', type];
    $('#list-eyebrow').textContent = eyebrow;
    $('#list-title').textContent = title;
    const bookmarkWords = type === 'favorites' ? state.wordFavorites.filter(word => state.bookmarkFilter === 'all' || word.category === state.bookmarkFilter) : [];
    const bookmarkCount = list.length + bookmarkWords.length;
    $('#list-description').textContent = type === 'favorites'
      ? (bookmarkCount ? `${bookmarkCount}개의 단어와 표현을 저장했어요.` : '아직 북마크한 단어·표현이 없어요.')
      : list.length ? `${list.length}개의 표현을 준비했어요.` : type === 'history' ? '아직 확인한 표현이 없어요.' : type === 'custom' ? '사진이나 자막에서 표현을 가져와 보세요.' : '아직 북마크한 표현이 없어요.';
    const isCategory = !labels[type];
    $('#quick-word-entry').innerHTML = type === 'custom' ? `<button class="custom-add-entry" data-action="open-import"><span>＋</span><span><strong>새 표현 추가</strong><small>사진이나 자막에서 표현을 가져와 보세요</small></span><b>›</b></button>` : type === 'favorites' ? `<div class="bookmark-filter">${['all', ...Object.keys(categoryMeta)].map(category => `<button class="${state.bookmarkFilter === category ? 'active' : ''}" data-action="set-bookmark-filter" data-category="${category}">${category === 'all' ? '전체' : category}</button>`).join('')}</div>` : isCategory ? quickWordPreview(type) : quickWords[type] ? `
      <button class="quick-word-entry" data-action="open-quick-words" data-category="${type}">
        <span>🔖</span><div><strong>바로 쓰는 필수 단어</strong><small>상황별 핵심 단어를 한눈에 확인해요</small></div><b>›</b>
      </button>` : '';
    $('#phrase-list').innerHTML = type === 'favorites'
      ? renderBookmarksByCategory(bookmarkWords, list)
      : isCategory && list.length
      ? `<section class="featured-section"><p class="featured-label">대표 표현 · FEATURED</p>${phraseCard(list[0]).replace('phrase-card', 'phrase-card featured-card')}</section><p class="all-phrases-label">모든 표현</p>${list.slice(1).map(phrase => phraseCard(phrase)).join('')}`
      : list.map(phrase => phraseCard(phrase)).join('');
    record('category_open', { type });
    navigate('list', '');
  }

  function openQuickWords(category) {
    const words = quickWords[category];
    if (!words) return;
    state.previousScreen = 'list';
    $('#quick-words-title').textContent = `${category} 필수 단어`;
    $('#quick-words-description').textContent = `${words.length}개 단어를 듣고 바로 사용할 수 있어요.`;
    $('#quick-word-list').innerHTML = words.map(([jp, reading, ko]) => {
      const saved = isWordFavorite(category, jp);
      return `
      <article class="quick-word-card">
        <strong>${japaneseWithYomi(jp, reading)}</strong><span class="pronunciation">${displayPronunciation(reading)}</span><small>${ko}</small>
        <div class="phrase-actions">
          <button class="icon-action" data-action="speak-word" data-text="${jp}" aria-label="${jp} 듣기" title="일본어 듣기">${icons.listen}</button>
          <button class="icon-action ${saved ? 'is-active' : ''}" data-action="toggle-word-favorite" data-category="${category}" data-jp="${jp}" data-reading="${reading}" data-ko="${ko}" aria-label="${jp} ${saved ? '북마크 해제' : '북마크'}" title="북마크">${icons.bookmark}</button>
        </div>
      </article>`;
    }).join('');
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
    $('#detail-expected-replies').innerHTML = `<p class="expected-note">이 표현 뒤에 자주 들을 수 있는 답변이에요.</p>${replies.map(([japanese, reading, korean]) => `<div class="expected-reply"><strong>${japaneseWithYomi(japanese, reading)}</strong><span class="expected-reply-reading">${displayPronunciation(reading)}</span><span>${korean}</span><div class="expected-reply-actions"><button class="icon-action" data-action="speak-word" data-text="${japanese}" aria-label="${japanese} 듣기" title="일본어 듣기">${icons.listen}</button><button class="icon-action" data-action="copy-word" data-text="${japanese}" aria-label="${japanese} 복사하기" title="일본어 복사하기">${icons.copy}</button></div></div>`).join('')}`;
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
    $('#detail-japanese').innerHTML = japaneseWithYomi(phrase.jp, phrase.romaji);
    $('#detail-romaji').textContent = displayPronunciation(phrase.romaji);
    $('#detail-korean').textContent = phrase.ko;
    $('#detail-note').textContent = phrase.note;
    const politeJapanese = phrase.jp.startsWith('すみません') ? phrase.jp : `すみません、${phrase.jp}`;
    const politeReading = phrase.jp.startsWith('すみません') ? phrase.romaji : `스미마센, ${phrase.romaji}`;
    const politeMeaning = phrase.jp.startsWith('すみません') ? phrase.ko : `실례합니다, ${phrase.ko}`;
    $('#detail-polite').innerHTML = japaneseWithYomi(politeJapanese, politeReading);
    $('#detail-polite-reading').textContent = displayPronunciation(politeReading);
    $('#detail-polite-meaning').textContent = politeMeaning;
    $('#detail-favorite').classList.toggle('is-bookmarked', state.favorites.includes(id));
    renderExpectedReplies(phrase);
    record('phrase_view', { id, category: phrase.cat });
    navigate('detail', '');
  }

  function toggleFavorite() {
    const { id } = state.activePhrase || {};
    if (!id) return;
    const isAdding = toggleFavoriteId(id);
    $('#detail-favorite').classList.toggle('is-bookmarked', isAdding);
  }

  function toggleFavoriteId(id) {
    const index = state.favorites.indexOf(id);
    const isAdding = index === -1;
    if (isAdding) state.favorites.push(id);
    else state.favorites.splice(index, 1);
    saveState();
    showToast(isAdding ? '북마크에 추가했어요.' : '북마크를 해제했어요.');
    return isAdding;
  }

  function startReview() {
    const ids = [...state.favorites, ...state.views];
    const sourceIds = ids.length ? ids : phrases.slice(0, 5).map(phrase => phrase.id);
    state.reviewItems = [...new Set(sourceIds)].map(findPhrase).filter(Boolean).slice(0, 5);
    state.reviewIndex = 0;
    state.previousScreen = 'profile';
    renderReview();
    record('review_start');
    navigate('review', '');
  }

  function renderReview() {
    const phrase = state.reviewItems[state.reviewIndex];
    if (!phrase) return navigate('profile');
    const current = state.reviewIndex + 1;
    $('#review-progress').innerHTML = `<strong>${current}</strong><span>/ ${state.reviewItems.length} 표현</span>`;
    $('#review-progress').setAttribute('aria-label', `${current} / ${state.reviewItems.length} 표현`);
    $('#review-progress-bar').style.width = `${Math.round((current / state.reviewItems.length) * 100)}%`;
    $('#review-korean').textContent = phrase.ko;
    $('#review-japanese').innerHTML = japaneseWithYomi(phrase.jp, phrase.romaji);
    $('#review-romaji').textContent = displayPronunciation(phrase.romaji);
    $('#review-answer').hidden = true;
    $('#review-listen').hidden = true;
    $('#review-reveal').hidden = false;
    $('#review-next').hidden = true;
    $('#review-previous').hidden = state.reviewIndex === 0;
    $('#review-card-panel').hidden = false;
    $('#review-next').innerHTML = `${state.reviewIndex === state.reviewItems.length - 1 ? '복습 완료' : '다음 표현'} <span>›</span>`;
  }

  function completeReview() {
    $('#review-completion-summary').textContent = `${state.reviewItems.length}개 표현을 모두 확인했어요. 여행 전 한 번 더 복습해도 좋아요.`;
    record('review_complete', { count: state.reviewItems.length });
    navigate('review-complete', 'profile');
  }

  const offlineSpeakAdditions = [
    { id: 'offline-full', cat: '식당', jp: '満席ですか？', romaji: '만세키 데스카?', ko: '만석인가요?', use: '식당에서 빈자리가 있는지 확인할 때 사용해요.', note: '입구나 직원에게 짧게 물어보세요.' },
    { id: 'offline-wait', cat: '식당', jp: 'どのくらい待ちますか？', romaji: '도노쿠라이 마치마스카?', ko: '얼마나 기다리면 되나요?', use: '대기 시간을 물을 때 사용해요.', note: '대기 명단을 작성해야 할 수 있어요.' },
    { id: 'offline-not-spicy', cat: '식당', jp: '辛くしないでください。', romaji: '카라쿠 시나이데 쿠다사이.', ko: '맵지 않게 해 주세요.', use: '음식의 매운 정도를 요청할 때 사용해요.', note: '메뉴를 가리키며 말하면 더 정확해요.' },
    { id: 'offline-reservation', cat: '식당', jp: '予約できますか？', romaji: '요야쿠 데키마스카?', ko: '예약할 수 있나요?', use: '식당이나 체험 예약 가능 여부를 물을 때 사용해요.', note: '날짜와 인원을 이어서 알려 주세요.' }
  ];
  offlineSpeakAdditions.forEach(phrase => { if (!findPhrase(phrase.id)) phrases.push(phrase); });

  const localSpeakGuide = [
    { situations: ['식당'], patterns: [/만석|빈자리|자리있|웨이팅/], japanese: '満席ですか？' },
    { situations: ['식당'], patterns: [/얼마나.*기다|대기.*시간/], japanese: 'どのくらい待ちますか？' },
    { situations: ['식당'], patterns: [/맵지|안맵|매운.*않/], japanese: '辛くしないでください。' },
    { situations: ['식당'], patterns: [/예약.*가능|예약.*할|예약해/], japanese: '予約できますか？' },
    { situations: ['식당'], patterns: [/따로.*계산|나눠.*계산/], japanese: '別々に払えますか？' },
    { situations: ['식당', '쇼핑', '카페'], patterns: [/현금.*(만|만돼|만되)|현금결제/], japanese: '現金だけですか？' },
    { situations: ['식당', '쇼핑', '카페'], patterns: [/카드|신용카드/], japanese: 'カードは使えますか？' },
    { situations: ['식당', '카페'], patterns: [/포장|테이크아웃/], japanese: '持ち帰りできますか？' },
    { situations: ['식당', '카페'], patterns: [/메뉴|메뉴판/], japanese: 'メニューをください。' },
    { situations: ['식당', '카페'], patterns: [/추천/], japanese: 'おすすめは何ですか？' },
    { situations: ['식당'], patterns: [/알레르기|못.*먹|빼.*주세요/], japanese: 'アレルギーがあります。' },
    { situations: ['교통', '길 묻기'], patterns: [/역까지|역.*가고|역.*갈/], japanese: '駅までお願いします。' },
    { situations: ['교통'], patterns: [/몇.*번.*(선|승강장|플랫폼)|승강장|플랫폼/], japanese: '何番線ですか？' },
    { situations: ['교통'], patterns: [/막차/], japanese: '終電は何時ですか？' },
    { situations: ['교통'], patterns: [/환승/], japanese: '乗り継ぎがあります。' },
    { situations: ['교통'], patterns: [/여기서.*내|내릴게/], japanese: 'ここで降ります。' },
    { situations: ['교통'], patterns: [/지연|늦어/], japanese: '電車は遅れていますか？' },
    { situations: ['숙소'], patterns: [/체크인/], japanese: 'チェックインをお願いします。' },
    { situations: ['숙소'], patterns: [/체크아웃/], japanese: 'チェックアウトをお願いします。' },
    { situations: ['숙소'], patterns: [/짐.*맡|짐보관/], japanese: '荷物を預けられますか？' },
    { situations: ['숙소'], patterns: [/수건/], japanese: 'タオルをもう一枚ください。' },
    { situations: ['숙소'], patterns: [/와이파이|비밀번호/], japanese: 'Wi-Fiのパスワードは何ですか？' },
    { situations: ['숙소'], patterns: [/키.*안.*열|열쇠.*안.*열/], japanese: '部屋の鍵が開きません。' },
    { situations: ['숙소'], patterns: [/조식|아침.*식사/], japanese: '朝食は何時からですか？' },
    { situations: ['쇼핑'], patterns: [/얼마|가격/], japanese: 'これはいくらですか？' },
    { situations: ['쇼핑'], patterns: [/입어|시착/], japanese: '試着してもいいですか？' },
    { situations: ['쇼핑'], patterns: [/사이즈|큰.*사이즈|작은.*사이즈/], japanese: '大きいサイズはありますか？' },
    { situations: ['쇼핑'], patterns: [/다른.*색|색상/], japanese: 'ほかの色はありますか？' },
    { situations: ['쇼핑'], patterns: [/면세/], japanese: '免税できますか？' },
    { situations: ['쇼핑'], patterns: [/영수증/], japanese: 'レシートをください。' },
    { situations: ['전체'], patterns: [/천천히/], japanese: 'ゆっくり話してください。' },
    { situations: ['전체'], patterns: [/다시.*말|한번.*더|한.*번.*더/], japanese: 'もう一度お願いします。' },
    { situations: ['전체'], patterns: [/영어/], japanese: '英語を話せますか？' },
    { situations: ['전체'], patterns: [/도와|도움/], japanese: '手伝っていただけますか？' }
  ];

  // 자주 쓰는 한국어 변형을 같은 여행 표현으로 연결한다. 별칭을 추가하면 AI 없이도 바로 확장된다.
  const localSpeakAliases = [
    { situations: ['식당', '카페'], aliases: ['물좀주세요', '물부탁', '물주세요'], japanese: 'お水をください。' },
    { situations: ['식당'], aliases: ['이걸로주세요', '이것으로주세요', '주문할게'], japanese: 'これをお願いします。' },
    { situations: ['식당'], aliases: ['고기들어', '고기있', '육류'], japanese: '肉は入っていますか？' },
    { situations: ['식당'], aliases: ['계산해주세요', '계산부탁', '계산할게'], japanese: 'お会計をお願いします。' },
    { situations: ['식당'], aliases: ['예약했어요', '예약되어', '예약자'], japanese: '予約しています。' },
    { situations: ['교통'], aliases: ['표한장', '표주세요', '승차권'], japanese: '切符を一枚ください。' },
    { situations: ['교통'], aliases: ['교통카드', 'ic카드', '스이카'], japanese: 'ICカードは使えますか？' },
    { situations: ['교통'], aliases: ['택시승강장', '택시타는곳'], japanese: 'タクシー乗り場はどこですか？' },
    { situations: ['교통'], aliases: ['택시불러', '택시불러주세요'], japanese: 'タクシーを呼んでください。' },
    { situations: ['쇼핑'], aliases: ['현금만', '현금결제만'], japanese: '現金だけですか？' },
    { situations: ['쇼핑'], aliases: ['봉투', '쇼핑백'], japanese: '袋をください。' },
    { situations: ['쇼핑'], aliases: ['교환할수', '교환되', '바꿀수'], japanese: '交換できますか？' },
    { situations: ['숙소'], aliases: ['예약했어요', '예약확인', '예약자이름'], japanese: '予約しています。' },
    { situations: ['숙소'], aliases: ['체크인늦', '늦게체크인'], japanese: 'チェックインが遅くなります。' },
    { situations: ['숙소'], aliases: ['택시불러', '택시호출'], japanese: 'タクシーを呼んでください。' },
    { situations: ['길 묻기', '교통'], aliases: ['화장실어디', '화장실위치'], japanese: 'トイレはどこですか？' },
    { situations: ['길 묻기'], aliases: ['가까워', '근처야', '근처에'], japanese: 'ここから近いですか？' },
    { situations: ['길 묻기'], aliases: ['지도보여', '지도에서'], japanese: '地図で見せてください。' },
    { situations: ['길 묻기'], aliases: ['사진찍어', '사진부탁'], japanese: '写真を撮ってください。' },
    { situations: ['길 묻기'], aliases: ['입구어디', '들어가는곳'], japanese: '入口はどこですか？' },
    { situations: ['길 묻기'], aliases: ['버스정류장', '버스타는곳'], japanese: 'バス停はどこですか？' },
    { situations: ['길 묻기'], aliases: ['길잃', '길을잃'], japanese: '道に迷いました。' },
    { situations: ['긴급 상황'], aliases: ['도와주세요', '도움필요'], japanese: '助けてください。' },
    { situations: ['긴급 상황'], aliases: ['경찰불러', '경찰호출'], japanese: '警察を呼んでください。' },
    { situations: ['긴급 상황', '병원·약국'], aliases: ['구급차불러', '응급차불러'], japanese: '救急車を呼んでください。' },
    { situations: ['긴급 상황'], aliases: ['지갑잃', '지갑분실'], japanese: '財布をなくしました。' },
    { situations: ['긴급 상황'], aliases: ['여권잃', '여권분실'], japanese: 'パスポートをなくしました。' },
    { situations: ['공항'], aliases: ['체크인카운터', '항공사카운터'], japanese: 'チェックインはどこですか？' },
    { situations: ['공항'], aliases: ['탑승구', '게이트어디'], japanese: '搭乗口はどこですか？' },
    { situations: ['공항'], aliases: ['짐부치', '수하물맡'], japanese: '荷物を預けたいです。' },
    { situations: ['공항'], aliases: ['보안검색', '보안검사'], japanese: '荷物検査はどこですか？' },
    { situations: ['공항'], aliases: ['환전소', '환전어디'], japanese: '両替はどこですか？' },
    { situations: ['관광지'], aliases: ['티켓주세요', '표주세요', '입장권'], japanese: '入場券をください。' },
    { situations: ['관광지'], aliases: ['사진찍어도', '촬영해도'], japanese: '写真を撮ってもいいですか？' },
    { situations: ['관광지'], aliases: ['몇시까지', '마감시간'], japanese: 'ここは何時まで開いていますか？' },
    { situations: ['카페'], aliases: ['커피한잔', '커피주세요'], japanese: 'コーヒーを一つください。' },
    { situations: ['카페'], aliases: ['매장에서', '여기서마실'], japanese: '店内で飲みます。' },
    { situations: ['카페'], aliases: ['테이크아웃', '포장으로'], japanese: '持ち帰りにします。' },
    { situations: ['카페'], aliases: ['얼음없이', '아이스빼'], japanese: '氷なしでお願いします。' },
    { situations: ['병원·약국'], aliases: ['머리아파', '두통'], japanese: '頭が痛いです。' },
    { situations: ['병원·약국'], aliases: ['배아파', '복통'], japanese: 'お腹が痛いです。' },
    { situations: ['병원·약국'], aliases: ['열나요', '열있'], japanese: '熱があります。' },
    { situations: ['병원·약국'], aliases: ['약주세요', '약필요'], japanese: '薬をください。' },
    { situations: ['병원·약국'], aliases: ['보험돼', '보험사용'], japanese: '保険は使えますか？' },
    { situations: ['전체'], aliases: ['감사합니다', '고마워요'], japanese: 'ありがとうございます。' },
    { situations: ['전체'], aliases: ['괜찮아요', '괜찮습니다'], japanese: '大丈夫です。' },
    { situations: ['전체'], aliases: ['알겠어요', '알겠습니다'], japanese: '分かりました。' }
  ];

  const normalizeSpeakInput = value => String(value || '').replace(/\s+/g, '').replace(/[?!？！.,]/g, '');

  function isInConversationSituation(phrase, situation) {
    return situation === '전체' || phrase.cat === situation;
  }

  function localRecommendation(question) {
    const normalized = normalizeSpeakInput(question);
    const situation = state.conversationSituation;
    const exactPhrase = phrases.find(phrase => isInConversationSituation(phrase, situation) && normalizeSpeakInput(phrase.ko) === normalized);
    if (exactPhrase) return exactPhrase;
    const alias = localSpeakAliases.find(entry =>
      (entry.situations.includes('전체') || situation === '전체' || entry.situations.includes(situation))
      && entry.aliases.some(value => normalized.includes(value))
    );
    const aliasPhrase = alias && phrases.find(phrase => phrase.jp === alias.japanese);
    if (aliasPhrase) return aliasPhrase;
    const match = localSpeakGuide.find(entry =>
      (entry.situations.includes('전체') || situation === '전체' || entry.situations.includes(situation))
      && entry.patterns.some(pattern => pattern.test(normalized))
    );
    const selected = match && phrases.find(phrase => phrase.jp === match.japanese);
    if (selected) return selected;
    const intents = { 포장: '식당-6', 계산: '식당-7', 메뉴: '식당-1', 추천: '식당-2', 역: '교통-0', 택시: '교통-0', 막차: '교통-5', 가격: '쇼핑-0', 얼마: '쇼핑-0', 카드: '쇼핑-1', 면세: '쇼핑-4', 체크인: '숙소-0', 체크아웃: '숙소-2', 호텔: '숙소-0', 와이파이: '숙소-5', 화장실: '길 묻기-1', 길: '길 묻기-0', 사진: '길 묻기-4', 여권: '긴급 상황-7', 경찰: '긴급 상황-1', 병원: '병원·약국-0', 약국: '병원·약국-8', 약: '병원·약국-4', 공항: '공항-0', 탑승: '공항-1', 비행기: '공항-2', 환승: '공항-5', 관광: '관광지-0', 입장권: '관광지-0', 카페: '카페-0', 커피: '카페-0', 구급차: '긴급 상황-2' };
    const matchingId = Object.entries(intents).find(([keyword]) => normalized.includes(keyword))?.[1]
      || (/물/.test(normalized) ? '식당-0' : undefined);
    return findPhrase(matchingId) || phrases[0];
  }

  function renderLocalAnswer(question) {
    const phrase = localRecommendation(question);
    const polite = /정중|공손/.test(question) ? `<br>더 정중하게: すみません、${phrase.jp}` : '';
    hideSearchSuggestions();
    $('#ask-answer').innerHTML = `<article class="ai-card"><p class="eyebrow">TABi'S RECOMMENDATION</p>
      <h3>${japaneseWithYomi(phrase.jp, phrase.romaji)}</h3><p class="answer-ko">${displayPronunciation(phrase.romaji)}<br>${phrase.ko}</p>
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
      hideSearchSuggestions();
      $('#ask-answer').innerHTML = `<article class="ai-card"><p class="eyebrow">AI RECOMMENDATION</p>
        <h3></h3><p class="answer-ko"></p><small></small><br><button class="icon-action" data-action="speak-ai" aria-label="일본어 듣기" title="일본어 듣기">${icons.listen}</button><button class="icon-action" data-action="copy-ai" aria-label="일본어 복사하기" title="일본어 복사하기">${icons.copy}</button></article>`;
      const card = $('.ai-card');
      card.querySelector('h3').innerHTML = japaneseWithYomi(answer.japanese || '', answer.pronunciation || '');
      card.querySelector('.answer-ko').textContent = `${displayPronunciation(answer.pronunciation || '')}\n${answer.meaning || ''}`;
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

  const conversationQuickPhrases = {
    'どのくらい待ちますか？': { jp: 'どのくらい待ちますか？', romaji: '도노쿠라이 마치마스카?', ko: '얼마나 기다리면 되나요?' },
    '予約できますか？': { jp: '予約できますか？', romaji: '요야쿠 데키마스카?', ko: '예약할 수 있나요?' },
    'ATMはどこですか？': { jp: 'ATMはどこですか？', romaji: '에이티에무와 도코데스카?', ko: 'ATM은 어디인가요?' },
    '別のサイズはありますか？': { jp: '別のサイズはありますか？', romaji: '베츠노 사이즈와 아리마스카?', ko: '다른 사이즈가 있나요?' },
    'パスポートを見せます。': { jp: 'パスポートを見せます。', romaji: '파스포오토오 미세마스.', ko: '여권을 보여드릴게요.' }
  };

  function findConversationPhrase(japanese) {
    return phrases.find(phrase => phrase.jp === japanese) || conversationQuickPhrases[japanese] || { japanese, jp: japanese, romaji: '', ko: '이 문장을 말해 보세요.' };
  }

  function conversationSuggestions(situation = state.conversationSituation, next = []) {
    const requested = next.map(findConversationPhrase);
    if (requested.length) return requested;
    const category = situation === '전체' ? '식당' : situation;
    return phrases.filter(phrase => phrase.cat === category).slice(0, 3);
  }

  function matchingConversationReply(japanese) {
    const normalized = conversationKey(japanese);
    const situation = state.conversationSituation;
    return conversationReplyGuide.find(reply =>
      (reply.situations.includes('전체') || situation === '전체' || reply.situations.includes(situation))
      && reply.patterns.some(pattern => pattern.test(normalized))
    );
  }

  function localConversationAnswer(japanese) {
    const reply = matchingConversationReply(japanese);
    if (reply) {
      return {
        japanese,
        korean: reply.korean,
        pronunciation: reply.pronunciation,
        keywords: reply.keywords,
        suggestions: conversationSuggestions(state.conversationSituation, reply.next),
        expected: situationReplyPreview[state.conversationSituation] || situationReplyPreview['전체'],
        status: '표현을 찾았어요'
      };
    }
    const matches = [
      [/はい|ええ/, '네, 또는 괜찮다는 뜻이에요.'], [/いいえ|だめ|できません/, '어렵거나 불가능하다는 뜻이에요.'],
      [/カード/, '카드 결제와 관련된 답변이에요.'], [/現金/, '현금 결제와 관련된 답변이에요.'],
      [/水|お水/, '물과 관련된 답변이에요.'], [/分|時間/, '시간이나 대기 시간과 관련된 답변이에요.'],
      [/駅|電車/, '역 또는 전철과 관련된 답변이에요.']
    ];
    const korean = matches.find(([pattern]) => pattern.test(japanese))?.[1] || '이 표현은 아직 내장 회화 사전에 없어요. 아래 문장으로 천천히 또는 다시 말해 달라고 요청해 보세요.';
    return {
      japanese,
      korean,
      pronunciation: '',
      keywords: ['인식 결과를 직접 확인해 보세요'],
      suggestions: conversationSuggestions(state.conversationSituation, ['ゆっくり話してください。', 'もう一度お願いします。']),
      expected: situationReplyPreview[state.conversationSituation] || situationReplyPreview['전체'],
      status: '가까운 상황 표현을 안내해요',
      ambiguous: true
    };
  }

  function renderConversationPicker() {
    const picker = $('#conversation-phrase-picker');
    if (!picker) return;
    picker.hidden = !state.conversationPickerOpen;
    if (!state.conversationPickerOpen) return;
    const search = $('#conversation-phrase-search');
    const results = $('#conversation-phrase-results');
    const query = state.conversationPhraseQuery.trim().toLowerCase();
    const situation = state.conversationSituation;
    const candidates = phrases.filter(phrase => {
      const inSituation = situation === '전체' || phrase.cat === situation;
      const searchable = `${phrase.jp} ${phrase.romaji} ${phrase.ko}`.toLowerCase();
      return inSituation && (!query || searchable.includes(query));
    }).slice(0, 8);
    search.value = state.conversationPhraseQuery;
    search.placeholder = situation === '전체' ? '예: 만석, 카드, 체크인' : `${situation} 표현 검색`;
    results.innerHTML = candidates.length
      ? `<p>${query ? '검색 결과' : `${situation === '전체' ? '추천' : situation} 표현`} · ${candidates.length}개</p>${candidates.map(phrase => `<button data-action="choose-conversation-phrase" data-id="${phrase.id}"><strong>${japaneseWithYomi(phrase.jp, phrase.romaji)}</strong><span>${escapeHtml(phrase.ko)}</span><b>›</b></button>`).join('')}`
      : '<p class="conversation-picker-empty">찾는 표현이 없어요. 다른 단어로 검색해 보세요.</p>';
  }

  function showConversationPhrase(phrase) {
    if (!phrase) return;
    const isSpeak = state.conversationMode === 'speak';
    const answer = {
      japanese: phrase.jp,
      korean: phrase.ko,
      pronunciation: phrase.romaji,
      keywords: [isSpeak ? '표현 목록에서 선택' : `${phrase.cat}에서 자주 쓰는 표현`],
      suggestions: [],
      mode: isSpeak ? 'speak' : undefined
    };
    $('#conversation-input').value = isSpeak ? phrase.ko : phrase.jp;
    state.conversationPickerOpen = false;
    renderConversationPicker();
    const entry = { id: `${Date.now()}`, japanese: answer.japanese, korean: answer.korean, at: new Date().toISOString(), answer };
    state.conversationHistory = deduplicateConversationHistory([entry, ...state.conversationHistory]).slice(0, 20);
    saveState();
    renderConversationResult(answer);
    renderConversationLog();
    record('conversation_phrase_selected', { id: phrase.id, situation: state.conversationSituation });
  }

  function renderConversationLog() {
    const log = $('#conversation-log');
    const recent = state.conversationHistory.slice(0, 2);
    log.innerHTML = recent.length ? `<p>최근 대화</p>${recent.map(item => `<button data-action="show-conversation" data-conversation-id="${item.id}"><strong>${escapeHtml(item.japanese)}</strong><span>${escapeHtml(item.korean)}</span></button>`).join('')}` : '';
  }

  function renderConversationResult(answer) {
    const result = $('#conversation-result');
    const suggestions = (answer.suggestions || []).slice(0, 3);
    result.hidden = false;
    const isSpeak = answer.mode === 'speak';
    result.innerHTML = `<p class="eyebrow">${isSpeak ? 'READY TO SAY' : '뜻'}</p><h3>${answer.pronunciation ? japaneseWithYomi(answer.japanese, answer.pronunciation) : escapeHtml(answer.japanese)}</h3>${answer.pronunciation ? `<p class="conversation-reading">${escapeHtml(displayPronunciation(answer.pronunciation))}</p>` : ''}<p class="conversation-meaning">${escapeHtml(answer.korean)}</p>${answer.keywords?.length ? `<p class="conversation-keywords">${answer.keywords.map(escapeHtml).join(' · ')}</p>` : ''}${isSpeak ? `<div class="conversation-result-actions"><button class="icon-action" data-action="speak-word" data-text="${escapeHtml(answer.japanese)}" aria-label="일본어 듣기" title="일본어 듣기">${icons.listen}</button><button class="icon-action" data-action="copy-word" data-text="${escapeHtml(answer.japanese)}" aria-label="일본어 복사하기" title="일본어 복사하기">${icons.copy}</button></div>` : ''}${suggestions.length ? `<div class="conversation-next"><p>다음에 이렇게 말해 보세요</p>${suggestions.map(phrase => `<button data-action="speak-word" data-text="${escapeHtml(phrase.jp || phrase.japanese)}"><span><strong>${japaneseWithYomi(phrase.jp || phrase.japanese, phrase.romaji || '')}</strong><small>${escapeHtml(phrase.ko || '')}</small></span><b aria-hidden="true">${icons.listen}</b></button>`).join('')}</div>` : ''}`;
  }

  async function analyzeConversation() {
    const input = $('#conversation-input');
    const text = input.value.trim();
    const isSpeak = state.conversationMode === 'speak';
    if (!text) return showToast(isSpeak ? '말하고 싶은 한국어를 입력하거나 녹음해 주세요.' : '상대방의 일본어 답변을 입력하거나 녹음해 주세요.');
    $('#conversation-result').hidden = false;
    $('#conversation-result').innerHTML = `<p class="eyebrow">${isSpeak ? 'PREPARING JAPANESE' : 'UNDERSTANDING'}</p><p class="conversation-meaning">${isSpeak ? '바로 말할 일본어를 준비하고 있어요.' : '답변을 이해하고 있어요.'}</p>`;
    let answer;
    try {
      if (!window.TABI_AI_ENDPOINT) throw new Error('local mode');
      const headers = { 'Content-Type': 'application/json' };
      if (window.TABI_SUPABASE_ANON_KEY) { headers.apikey = window.TABI_SUPABASE_ANON_KEY; headers.Authorization = `Bearer ${window.TABI_SUPABASE_ANON_KEY}`; }
      const response = await fetch(window.TABI_AI_ENDPOINT, { method: 'POST', headers, body: JSON.stringify(isSpeak ? { mode: 'speak', korean: text } : { mode: 'conversation', japanese: text }) });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'conversation request failed');
      answer = isSpeak
        ? { japanese: data.japanese, korean: data.meaning || text, pronunciation: data.pronunciation, keywords: [], suggestions: [], mode: 'speak' }
        : { japanese: text, korean: data.korean, pronunciation: data.pronunciation, keywords: data.keywords || [], suggestions: conversationSuggestions(state.conversationSituation), expected: situationReplyPreview[state.conversationSituation] || situationReplyPreview['전체'], status: 'AI가 표현을 분석했어요' };
    } catch {
      if (isSpeak) {
        const phrase = localRecommendation(text);
        answer = { japanese: phrase.jp, korean: phrase.ko, pronunciation: phrase.romaji, keywords: ['여행에서 바로 쓰는 기본 표현'], suggestions: [], mode: 'speak' };
      } else {
        answer = localConversationAnswer(text);
      }
    }
    const entry = { id: `${Date.now()}`, japanese: answer.japanese, korean: answer.korean, at: new Date().toISOString(), answer };
    state.conversationHistory = deduplicateConversationHistory([entry, ...state.conversationHistory]).slice(0, 20);
    saveState();
    renderConversationResult(answer);
    if (answer.ambiguous) {
      state.conversationPickerOpen = true;
      state.conversationSituation = '전체';
      $$('.situation-picker button').forEach(button => button.classList.remove('active'));
      renderConversationPicker();
    }
    renderConversationLog();
    record(isSpeak ? 'conversation_spoken' : 'conversation_understood');
  }

  function startJapaneseRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return showToast('이 브라우저에서는 음성 인식을 지원하지 않아요. 일본어를 직접 입력해 주세요.');
    const recognition = new Recognition();
    const isSpeak = state.conversationMode === 'speak';
    recognition.lang = isSpeak ? 'ko-KR' : 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    const button = $('#conversation-record');
    button.classList.add('is-recording');
    $('#conversation-note').textContent = isSpeak ? '듣고 있어요. 말이 끝나면 일본어를 준비해요.' : '듣고 있어요. 상대방의 답변이 끝나면 자동으로 입력돼요.';
    recognition.onresult = event => {
      $('#conversation-input').value = event.results[0][0].transcript;
      $('#conversation-note').textContent = isSpeak ? '한국어를 받아왔어요. 바로 일본어로 만들고 있어요.' : '일본어 답변을 받아왔어요. 바로 해석하고 있어요.';
      analyzeConversation();
    };
    recognition.onerror = () => { $('#conversation-note').textContent = isSpeak ? '음성을 인식하지 못했어요. 한국어를 직접 입력해 주세요.' : '음성을 인식하지 못했어요. 일본어를 직접 입력해 주세요.'; };
    recognition.onend = () => button.classList.remove('is-recording');
    recognition.start();
  }

  function normalizeSearchText(value) {
    return String(value || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  }

  function scorePhraseForSearch(phrase, query) {
    const normalized = normalizeSearchText(query);
    const tokens = query.toLowerCase().split(/\s+/).map(normalizeSearchText).filter(Boolean);
    const fields = [phrase.jp, phrase.romaji, phrase.ko].map(normalizeSearchText);
    const keywords = [...(searchAliases[phrase.cat] || '').split(' '), ...(phraseSearchKeywords[phrase.id] || [])].map(normalizeSearchText);
    const category = normalizeSearchText(phrase.cat);
    const terms = [...fields, category, ...keywords];
    const fullMatch = terms.some(term => term.includes(normalized));
    const tokenMatches = tokens.filter(token => terms.some(term => term.includes(token))).length;
    if (!fullMatch && (!tokens.length || tokenMatches !== tokens.length)) return null;

    let score = tokenMatches * 60;
    let reason = '관련 키워드';
    if (fields[2] === normalized) { score += 1000; reason = '뜻이 정확히 일치'; }
    else if (fields[0] === normalized || fields[1] === normalized) { score += 950; reason = '표현이 정확히 일치'; }
    else if (keywords.includes(normalized)) { score += 850; reason = '검색 키워드 일치'; }
    else if (category === normalized) { score += 700; reason = `${phrase.cat} 상황`; }
    else if (fields.some(field => field.includes(normalized))) { score += 500; reason = '표현 내용 일치'; }
    else if (keywords.some(keyword => keyword.includes(normalized))) { score += 400; reason = '관련 키워드'; }
    return { phrase, score, reason };
  }

  function renderSearch(query) {
    const normalized = normalizeSearchText(query);
    const results = normalized ? phrases.map(phrase => scorePhraseForSearch(phrase, query)).filter(Boolean)
      .sort((left, right) => right.score - left.score)
      .filter((item, index, matches) => matches.findIndex(match => match.phrase.jp === item.phrase.jp && match.phrase.ko === item.phrase.ko) === index)
      .slice(0, 6) : [];
    state.searchHasResults = results.length > 0;
    $('#search-results').innerHTML = results.length
      ? results.map(({ phrase, reason }) => phraseCard(phrase, reason)).join('')
      : normalized ? `<div class="search-empty"><p>찾는 표현이 없어요.</p><button data-action="search-with-ai" data-query="${escapeHtml(query.trim())}">AI에게 표현 만들기</button></div>` : '';
    $('#ask-answer').innerHTML = '';
    if (results.length) hideSearchSuggestions();
    else renderSearchSuggestions(normalized);
  }

  function hideSearchSuggestions() {
    const panel = $('#search-suggestions');
    panel.hidden = true;
    panel.innerHTML = '';
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
    // 검색 결과가 있으면 입력창에 다시 포커스해도 연관 검색어를 표시하지 않는다.
    if (query && state.searchHasResults) {
      hideSearchSuggestions();
      return;
    }
    const terms = query ? getRelatedSearches(query) : state.recentSearches;
    const title = query ? '연관 검색어' : '최근 검색어';
    if (!terms.length) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }
    panel.hidden = false;
    panel.innerHTML = `<div class="search-panel-heading"><p>${title}</p>${!query && terms.length ? '<button data-action="clear-recent-searches">전체 삭제</button>' : ''}</div>${terms.length
      ? `<div class="search-term-list">${terms.map(term => `<button data-action="search-term" data-term="${term}"><span>${query ? '⌕' : '◷'}</span>${term}<b>↗</b></button>`).join('')}</div>`
      : ''}`;

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

  function makeCustomPhrase(candidate, source) {
    const category = ['식당', '교통', '쇼핑', '숙소', '길 묻기', '관광지', '카페', '병원·약국'].includes(candidate.category) ? candidate.category : '기타';
    return {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      cat: category,
      jp: String(candidate.japanese || '').trim(),
      romaji: String(candidate.pronunciation || '').trim(),
      ko: String(candidate.meaning || '').trim(),
      use: String(candidate.usage || `${category} 상황에서 사용할 수 있어요.`).trim(),
      note: '공유 콘텐츠에서 가져온 표현이에요. 사용 전 문맥을 확인해 보세요.',
      source: source || null,
      createdAt: new Date().toISOString()
    };
  }

  function renderImportCandidates() {
    const host = $('#import-results');
    if (!state.importCandidates.length) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.innerHTML = `<div class="import-results-heading"><p class="eyebrow">REVIEW & EDIT</p><h2>표현을 다듬어 저장하세요</h2><p>선택한 표현만 내 표현집에 추가돼요.</p></div><div class="import-candidate-list">${state.importCandidates.map((phrase, index) => `<article class="import-candidate"><div class="import-candidate-head"><span>표현 ${String(index + 1).padStart(2, '0')}</span><label class="import-select"><input type="checkbox" data-import-select="${index}" aria-label="표현 ${index + 1} 저장" checked /></label></div><div class="import-fields"><label class="import-field import-field-wide"><span>일본어</span><input data-import-field="japanese" data-import-index="${index}" value="${escapeHtml(phrase.japanese || '')}" /></label><label class="import-field"><span>한글 발음 <i>선택</i></span><input data-import-field="pronunciation" data-import-index="${index}" placeholder="예: 오하요 고자이마스" value="${escapeHtml(phrase.pronunciation || '')}" /></label><label class="import-field"><span>한국어 뜻 <i class="required">필수</i></span><input data-import-field="meaning" data-import-index="${index}" placeholder="예: 안녕하세요" value="${escapeHtml(phrase.meaning || '')}" /></label><label class="import-field import-field-wide"><span>사용 상황 <i>선택</i></span><input data-import-field="usage" data-import-index="${index}" placeholder="예: 가게에 들어갈 때" value="${escapeHtml(phrase.usage || '')}" /></label></div></article>`).join('')}</div><button class="trip-primary import-save-button" type="button" data-action="save-imported-phrases">선택한 표현 저장하기 <span>›</span></button>`;
  }

  function saveImportedPhrases() {
    const selected = $$('[data-import-select]:checked').map(input => Number(input.dataset.importSelect));
    if (!selected.length) return showToast('저장할 표현을 하나 이상 골라 주세요.');
    if (selected.some(index => !String(state.importCandidates[index]?.meaning || '').trim())) return showToast('선택한 표현의 한국어 뜻을 입력해 주세요.');
    const newPhrases = selected.map(index => makeCustomPhrase(state.importCandidates[index], state.importSource)).filter(phrase => phrase.jp && phrase.ko);
    // 기본 탑재 표현과 같아도 사용자가 직접 가져온 기록은 내 표현집에 남긴다.
    // 이미 가져온 같은 표현은 막지 않고, 방금 입력한 발음·뜻으로 갱신한다.
    const seen = new Set();
    const added = [];
    let updated = 0;
    newPhrases.forEach(phrase => {
      const key = `${phrase.jp}\u0000${phrase.ko}`;
      if (seen.has(key)) return;
      seen.add(key);
      const existingIndex = state.customPhrases.findIndex(item => item.jp === phrase.jp && item.ko === phrase.ko);
      if (existingIndex === -1) {
        added.push(phrase);
        return;
      }
      const existing = state.customPhrases[existingIndex];
      const refreshed = { ...existing, ...phrase, id: existing.id, createdAt: existing.createdAt };
      state.customPhrases[existingIndex] = refreshed;
      const phraseIndex = phrases.findIndex(item => item.id === existing.id);
      if (phraseIndex !== -1) phrases[phraseIndex] = refreshed;
      updated += 1;
    });
    state.customPhrases.push(...added);
    phrases.push(...added);
    saveState();
    record('phrase_import_saved', { count: added.length, updated, source: state.importSource?.type || 'unknown' });
    state.importCandidates = [];
    $('#import-form').reset();
    $('#import-file-name').textContent = 'PNG, JPG, WEBP · 최대 5MB';
    renderImportCandidates();
    showToast(added.length ? `${added.length}개 표현을 내 표현집에 저장했어요.` : `${updated}개 표현을 최신 내용으로 저장했어요.`);
    openList('custom');
  }

  function extractLocalImportCandidates(text) {
    const cleaned = String(text || '').replace(/#[^\s#]+/g, ' ').replace(/https?:\/\/\S+/g, ' ');
    const structured = cleaned.split(/\r?\n/).map(line => {
      const match = line.trim().match(/^[*\-•\s]*([ぁ-んァ-ヶー一-龯々〆ヵヶ][ぁ-んァ-ヶー一-龯々〆ヵヶ\s、。！？!?…「」]+?)\s*[（(]\s*([^()（）:：]+?)\s*[）)]\s*[:：]\s*(.+?)\s*$/);
      if (!match) return null;
      return { japanese: match[1].trim(), pronunciation: match[2].trim(), meaning: match[3].replace(/\*+/g, '').trim(), category: '기타', usage: '' };
    }).filter(Boolean);
    if (structured.length) return [...new Map(structured.map(phrase => [phrase.japanese, phrase])).values()].slice(0, 8);
    const candidates = cleaned.match(/[ぁ-んァ-ヶー一-龯々〆ヵヶ][ぁ-んァ-ヶー一-龯々〆ヵヶ\s、。！？!?…「」]*/g) || [];
    return [...new Set(candidates.map(value => value.replace(/\s+/g, ' ').trim()).filter(value => (value.match(/[ぁ-んァ-ヶー一-龯々〆ヵヶ]/g) || []).length >= 2))]
      .slice(0, 8)
      .map(japanese => ({ japanese, pronunciation: '', meaning: '', category: '기타', usage: '' }));
  }

  async function importPhrases(event) {
    event.preventDefault();
    const file = $('#import-image').files[0];
    const url = $('#import-url').value.trim();
    const sourceText = $('#import-text').value.trim();
    if (!file && !url && !sourceText) return showToast('사진, 링크, 또는 자막 텍스트를 입력해 주세요.');
    if (file && file.size > 5 * 1024 * 1024) return showToast('이미지는 5MB 이하로 올려 주세요.');
    if (url && !/^https:\/\//i.test(url)) return showToast('https로 시작하는 공개 링크만 사용할 수 있어요.');
    if (!sourceText) return showToast(file ? '사진의 일본어 자막을 텍스트로 붙여넣어 주세요.' : '링크의 일본어 캡션을 붙여넣어 주세요.');
    const submit = $('#import-form button[type="submit"]');
    submit.disabled = true;
    submit.textContent = '표현을 고르고 있어요…';
    try {
      state.importCandidates = extractLocalImportCandidates(sourceText);
      state.importSource = { type: file ? 'image' : url ? 'url' : 'text', url: url || null };
      if (!state.importCandidates.length) throw new Error('저장할 일본어 표현을 찾지 못했어요.');
      renderImportCandidates();
      record('phrase_import_analyzed', { count: state.importCandidates.length, source: state.importSource.type });
    } catch (error) {
      showToast(error instanceof Error ? error.message : '표현 추출에 실패했어요.');
    } finally {
      submit.disabled = false;
      submit.textContent = '표현 후보 만들기';
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
    if (action === 'start-trip' || action === 'edit-trip') openTripSetup();
    if (action === 'share-trip') shareTrip();
    if (action === 'start-rehearsal') openRehearsal(target.dataset.scenario || '');
    if (action === 'choose-rehearsal') chooseRehearsal(category);
    if (action === 'rehearsal-reveal') { state.rehearsalStage = 1; renderRehearsal(); record('rehearsal_phrase_revealed'); }
    if (action === 'rehearsal-record') startRehearsalRecognition();
    if (action === 'rehearsal-next') { state.rehearsalStage = 2; renderRehearsal(); record('rehearsal_reply_opened'); }
    if (action === 'rehearsal-finish') { state.rehearsalStage = 3; renderRehearsal(); record('rehearsal_completed'); }
    if (action === 'delete-trip') deleteTrip();
    if (action === 'open-trip-pack') { state.previousScreen = $('.screen.active').id.replace('-screen', ''); navigate('trip-pack', ''); }
    if (action === 'open-travel-mode') { state.travelMission = currentTripMission()?.scenario || ''; state.previousScreen = 'trip-pack'; navigate('travel-mode', ''); }
    if (action === 'open-mission-mode') { state.travelMission = target.dataset.scenario || ''; state.previousScreen = 'trip-pack'; navigate('travel-mode', ''); }
    if (action === 'open-conversation') { state.previousScreen = 'travel-mode'; navigate('conversation'); }
    if (action === 'open-import') { state.previousScreen = $('.screen.active').id.replace('-screen', ''); navigate('import', ''); }
    if (action === 'save-imported-phrases') saveImportedPhrases();
    if (action === 'open-category') openList(category);
    if (action === 'open-profile-list') openList(target.dataset.list);
    if (action === 'open-quick-words') openQuickWords(category);
    if (action === 'open-phrase') openPhrase(id);
    if (action === 'speak') { event.stopPropagation(); const phrase = findPhrase(id); if (phrase) { flashIcon(target); speak(phrase.jp); } }
    if (action === 'speak-word') { event.stopPropagation(); flashIcon(target); speak(target.dataset.text); }
    if (action === 'copy-phrase') { event.stopPropagation(); const phrase = findPhrase(id); if (phrase) copyText(phrase.jp, { id: phrase.id }, target); }
    if (action === 'toggle-favorite') { event.stopPropagation(); const isAdding = toggleFavoriteId(id); target.classList.toggle('is-active', isAdding); target.setAttribute('aria-label', `${findPhrase(id)?.jp || '표현'} ${isAdding ? '북마크 해제' : '북마크'}`); }
    if (action === 'toggle-word-favorite') {
      event.stopPropagation();
      const isAdding = toggleWordFavorite({ category, jp: target.dataset.jp, reading: target.dataset.reading, ko: target.dataset.ko });
      target.classList.toggle('is-active', isAdding);
      target.setAttribute('aria-label', `${target.dataset.jp} ${isAdding ? '북마크 해제' : '북마크'}`);
      target.setAttribute('title', isAdding ? '북마크 해제' : '북마크');
      if (!isAdding && $('.screen.active')?.id === 'list-screen' && $('#list-title').textContent === '북마크한 단어·표현') openList('favorites');
      renderProfile();
    }
    if (action === 'copy-word') { event.stopPropagation(); copyText(target.dataset.text, {}, target); }
    if (action === 'clear-recent-searches') clearRecentSearches();
    if (action === 'speak-ai') { flashIcon(target); speak(target.dataset.text); }
    if (action === 'copy-ai') copyText(target.dataset.text, {}, target);
    if (action === 'set-conversation-mode') setConversationMode(target.dataset.mode);
    if (action === 'set-conversation-situation') setConversationSituation(target.dataset.situation);
    if (action === 'toggle-conversation-picker') {
      state.conversationPickerOpen = !state.conversationPickerOpen;
      state.conversationPhraseQuery = '';
      if (state.conversationPickerOpen) {
        state.conversationSituation = '전체';
        $$('.situation-picker button').forEach(button => button.classList.remove('active'));
      }
      renderConversationPicker();
      if (state.conversationPickerOpen) $('#conversation-phrase-search').focus();
    }
    if (action === 'choose-conversation-phrase') showConversationPhrase(findPhrase(id));
    if (action === 'set-pronunciation-style') {
      state.pronunciationStyle = target.dataset.style === 'roman' ? 'roman' : 'hangul';
      localStorage.setItem(storageKey('pronunciation-style'), state.pronunciationStyle);
      renderProfile();
      showToast(`${state.pronunciationStyle === 'roman' ? '로마자형' : '한글형'} 발음 표기로 바꿨어요.`);
    }
    if (action === 'adjust-readiness-goal') {
      state.readinessGoal = normalizeReadinessGoal(state.readinessGoal + Number(target.dataset.adjustment || 0));
      localStorage.setItem(storageKey('readiness-goal'), String(state.readinessGoal));
      renderProfile();
    }
    if (action === 'open-bookmark-category') {
      state.bookmarkFilter = category;
      openList('favorites');
    }
    if (action === 'set-bookmark-filter') {
      state.bookmarkFilter = category || 'all';
      const previousScreen = state.previousScreen;
      openList('favorites');
      state.previousScreen = previousScreen;
    }
    if (action === 'search-with-ai') {
      const question = target.dataset.query || $('#global-search').value.trim();
      if (question) { saveSearch(question.toLowerCase()); askAi(question); }
    }
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
    $('#conversation-phrase-search').addEventListener('input', event => {
      state.conversationPhraseQuery = event.target.value;
      renderConversationPicker();
    });
    $('#trip-form').addEventListener('submit', saveTrip);
    $('#import-form').addEventListener('submit', importPhrases);
    $('#import-image').addEventListener('change', event => {
      const file = event.target.files[0];
      $('#import-file-name').textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)}MB` : 'PNG, JPG, WEBP · 최대 5MB';
    });
    document.addEventListener('input', event => {
      const input = event.target.closest('[data-import-field]');
      if (!input) return;
      const candidate = state.importCandidates[Number(input.dataset.importIndex)];
      if (candidate) candidate[input.dataset.importField] = input.value;
    });
    $('#trip-duration').addEventListener('change', renderItineraryBuilder);
    $('#trip-date').addEventListener('change', renderItineraryBuilder);
    $('#global-search').addEventListener('focus', event => { state.searchActive = true; renderSearch(event.target.value); });
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
    $('#readiness-goal-input').addEventListener('change', event => {
      state.readinessGoal = normalizeReadinessGoal(event.target.value);
      localStorage.setItem(storageKey('readiness-goal'), String(state.readinessGoal));
      renderProfile();
      showToast(`목표를 ${state.readinessGoal}개 표현으로 설정했어요.`);
    });
    $('#review-reveal').addEventListener('click', () => { $('#review-answer').hidden = false; $('#review-listen').hidden = false; $('#review-reveal').hidden = true; $('#review-next').hidden = false; record('review_reveal'); });
    $('#review-listen').addEventListener('click', () => speak(state.reviewItems[state.reviewIndex].jp));
    $('#review-next').addEventListener('click', () => { if (state.reviewIndex === state.reviewItems.length - 1) completeReview(); else { state.reviewIndex += 1; renderReview(); } });
    $('#review-previous').addEventListener('click', () => { if (state.reviewIndex > 0) { state.reviewIndex -= 1; renderReview(); } });
    $('#review-exit-profile').addEventListener('click', () => navigate('profile'));
    $('#kana-button').addEventListener('click', () => { state.previousScreen = 'profile'; renderKana(); navigate('kana', ''); });
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

  loadSharedTrip();
  renderCategories();
  renderConversationLog();
  saveState();
  renderSearchSuggestions();
  bindStaticEvents();
  registerServiceWorker();
  navigate('home');
})();
