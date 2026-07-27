const sets={
 '식당':[['お水をいただけますか？','오미즈오 이타다케마스카?','물을 받을 수 있을까요?'],['メニューをください。','메뉴오 쿠다사이.','메뉴를 주세요.'],['おすすめは何ですか？','오스스메와 난데스카?','추천 메뉴는 무엇인가요?'],['これをお願いします。','코레오 오네가이시마스.','이것으로 부탁드립니다.'],['アレルギーがあります。','아레루기이가 아리마스.','알레르기가 있어요.'],['肉は入っていますか？','니쿠와 하잇테이마스카?','고기가 들어 있나요?'],['持ち帰りできますか？','모치카에리 데키마스카?','포장 가능한가요?'],['お会計をお願いします。','오카이케이오 오네가이시마스.','계산 부탁드립니다.'],['別々に払えますか？','베츠베츠니 하라에마스카?','따로 계산할 수 있나요?'],['予約しています。','요야쿠시테이마스.','예약했습니다.']],
 '교통':[['駅までお願いします。','에키마데 오네가이시마스.','역까지 부탁드립니다.'],['この電車は東京駅に行きますか？','코노 덴샤와 도쿄에키니 이키마스카?','이 전철은 도쿄역에 가나요?'],['切符を一枚ください。','킷푸오 이치마이 쿠다사이.','표 한 장 주세요.'],['ICカードは使えますか？','아이시카아도와 츠카에마스카?','IC카드를 사용할 수 있나요?'],['何番線ですか？','난반센데스카?','몇 번 승강장인가요?'],['終電は何時ですか？','슈덴와 난지데스카?','막차는 몇 시인가요?'],['タクシー乗り場はどこですか？','타쿠시이 노리바와 도코데스카?','택시 승강장은 어디인가요?'],['ここで降ります。','코코데 오리마스.','여기서 내릴게요.'],['電車は遅れていますか？','덴샤와 오쿠레테이마스카?','전철이 지연되고 있나요?'],['荷物を預けられますか？','니모츠오 아즈케라레마스카?','짐을 맡길 수 있나요?']],
 '쇼핑':[['これはいくらですか？','코레와 이쿠라데스카?','이건 얼마인가요?'],['カードは使えますか？','카아도와 츠카에마스카?','카드 사용할 수 있나요?'],['試着してもいいですか？','시차쿠시테모 이이데스카?','입어봐도 될까요?'],['大きいサイズはありますか？','오키이 사이즈와 아리마스카?','큰 사이즈가 있나요?'],['免税できますか？','멘제이 데키마스카?','면세 가능한가요?'],['袋をください。','후쿠로오 쿠다사이.','봉투를 주세요.'],['ほかの色はありますか？','호카노 이로와 아리마스카?','다른 색이 있나요?'],['レシートをください。','레시이토오 쿠다사이.','영수증을 주세요.'],['交換できますか？','코오칸 데키마스카?','교환할 수 있나요?'],['現金だけですか？','겐킨다케데스카?','현금만 가능한가요?']],
 '숙소':[['チェックインをお願いします。','첵쿠인오 오네가이시마스.','체크인 부탁드립니다.'],['予約しています。','요야쿠시테이마스.','예약했습니다.'],['チェックアウトをお願いします。','첵쿠아우토오 오네가이시마스.','체크아웃 부탁드립니다.'],['荷物を預けられますか？','니모츠오 아즈케라레마스카?','짐을 맡길 수 있나요?'],['タオルをもう一枚ください。','타오루오 모오 이치마이 쿠다사이.','수건 한 장 더 주세요.'],['Wi-Fiのパスワードを教えてください。','와이파이노 파스와아도오 오시에테 쿠다사이.','와이파이 비밀번호를 알려주세요.'],['部屋の鍵が開きません。','헤야노 카기가 아키마센.','방 열쇠가 열리지 않아요.'],['チェックインが遅くなります。','첵쿠인이 오소쿠 나리마스.','체크인이 늦어질 것 같아요.'],['朝食は何時からですか？','초오쇼쿠와 난지카라데스카?','조식은 몇 시부터인가요?'],['タクシーを呼んでいただけますか？','타쿠시이오 욘데 이타다케마스카?','택시를 불러주실 수 있나요?']],
 '길 묻기':[['駅はどこですか？','에키와 도코데스카?','역은 어디인가요?'],['トイレはどこですか？','토이레와 도코데스카?','화장실은 어디인가요?'],['ここから近いですか？','코코카라 치카이데스카?','여기서 가까운가요?'],['地図で見せてもらえますか？','치즈데 미세테 모라에마스카?','지도에서 보여주실 수 있나요?'],['写真を撮っていただけますか？','샤신오 톳테 이타다케마스카?','사진을 찍어주실 수 있나요?'],['入口はどこですか？','이리구치와 도코데스카?','입구는 어디인가요?'],['バス停はどこですか？','바스테이와 도코데스카?','버스 정류장은 어디인가요?'],['何時まで開いていますか？','난지마데 아이테이마스카?','몇 시까지 열어 있나요?'],['チケット売り場はどこですか？','치켓토 우리바와 도코데스카?','티켓 판매처는 어디인가요?'],['道に迷いました。','미치니 마요이마시타.','길을 잃었어요.']],
 '긴급 상황':[['助けてください。','타스케테 쿠다사이.','도와주세요.'],['警察を呼んでください。','케이사츠오 욘데 쿠다사이.','경찰을 불러주세요.'],['救急車を呼んでください。','큐우큐우샤오 욘데 쿠다사이.','구급차를 불러주세요.'],['病院はどこですか？','뵤오인와 도코데스카?','병원은 어디인가요?'],['気分が悪いです。','키분가 와루이데스.','몸 상태가 안 좋아요.'],['薬局はどこですか？','야쿄쿠와 도코데스카?','약국은 어디인가요?'],['財布をなくしました。','사이후오 나쿠시마시타.','지갑을 잃어버렸습니다.'],['パスポートをなくしました。','파스포오토오 나쿠시마시타.','여권을 잃어버렸습니다.'],['英語を話せる人はいますか？','에이고오 하나세루 히토와 이마스카?','영어를 할 수 있는 분이 있나요?'],['家族に連絡したいです。','카조쿠니 렌라쿠시타이데스.','가족에게 연락하고 싶어요.']],
 '공항':[['チェックインカウンターはどこですか？','첵쿠인 카운타아와 도코데스카?','체크인 카운터는 어디인가요?'],['搭乗口はどこですか？','토오조오구치와 도코데스카?','탑승구는 어디인가요?'],['この便は何時に出発しますか？','코노 빈와 난지니 슛파츠시마스카?','이 비행기는 몇 시에 출발하나요?'],['荷物を預けたいです。','니모츠오 아즈케타이데스.','짐을 부치고 싶어요.'],['手荷物検査はどこですか？','테니모츠 켄사와 도코데스카?','보안 검색대는 어디인가요?'],['乗り継ぎがあります。','노리츠기가 아리마스.','환승이 있어요.'],['フライトが遅れていますか？','후라이트가 오쿠레테이마스카?','항공편이 지연되고 있나요?'],['両替はどこですか？','료오가에와 도코데스카?','환전소는 어디인가요?'],['免税店はどこですか？','멘제이텐와 도코데스카?','면세점은 어디인가요?'],['パスポートを見せます。','파스포오토오 미세마스.','여권을 보여드릴게요.']],
 '관광지':[['入場券をください。','뉴우조오켄오 쿠다사이.','입장권을 주세요.'],['写真を撮ってもいいですか？','샤신오 톳테모 이이데스카?','사진을 찍어도 되나요?'],['おすすめの場所はどこですか？','오스스메노 바쇼와 도코데스카?','추천 장소는 어디인가요?'],['ガイドツアーはありますか？','가이도 츠아아와 아리마스카?','가이드 투어가 있나요?'],['ここは何時まで開いていますか？','코코와 난지마데 아이테이마스카?','여기는 몇 시까지 열어 있나요?'],['トイレはどこですか？','토이레와 도코데스카?','화장실은 어디인가요?'],['出口はどこですか？','데구치와 도코데스카?','출구는 어디인가요?'],['パンフレットはありますか？','판후렛토와 아리마스카?','안내 책자가 있나요?'],['日本語の説明が分かりません。','니혼고노 세츠메이가 와카리마센.','일본어 설명을 모르겠어요.'],['記念写真をお願いします。','키넨 샤신오 오네가이시마스.','기념사진 부탁드립니다.']],
 '카페':[['コーヒーを一つください。','코오히이오 히토츠 쿠다사이.','커피 한 잔 주세요.'],['店内で飲みます。','텐나이데 노미마스.','매장에서 마실게요.'],['持ち帰りにします。','모치카에리니 시마스.','포장으로 할게요.'],['おすすめの飲み物は何ですか？','오스스메노 노미모노와 난데스카?','추천 음료는 무엇인가요?'],['砂糖は入れますか？','사토오와 이레마스카?','설탕을 넣나요?'],['ミルクをください。','미루쿠오 쿠다사이.','우유를 주세요.'],['氷なしでお願いします。','코오리 나시데 오네가이시마스.','얼음 없이 부탁드립니다.'],['お水をください。','오미즈오 쿠다사이.','물을 주세요.'],['空いている席はありますか？','아이테이루 세키와 아리마스카?','빈자리가 있나요?'],['Wi-Fiは使えますか？','와이파이와 츠카에마스카?','와이파이를 사용할 수 있나요?']],
 '병원·약국':[['医者に診てもらいたいです。','이샤니 미테모라이타이데스.','의사에게 진료받고 싶어요.'],['頭が痛いです。','아타마가 이타이데스.','머리가 아파요.'],['お腹が痛いです。','오나카가 이타이데스.','배가 아파요.'],['熱があります。','네츠가 아리마스.','열이 있어요.'],['薬をください。','쿠스리오 쿠다사이.','약을 주세요.'],['この薬の飲み方を教えてください。','코노 쿠스리노 노미카타오 오시에테 쿠다사이.','이 약 먹는 법을 알려주세요.'],['アレルギーがあります。','아레루기이가 아리마스.','알레르기가 있어요.'],['保険は使えますか？','호켄와 츠카에마스카?','보험을 사용할 수 있나요?'],['近くの薬局はどこですか？','치카쿠노 야쿄쿠와 도코데스카?','근처 약국은 어디인가요?'],['救急車を呼んでください。','큐우큐우샤오 욘데 쿠다사이.','구급차를 불러주세요.']]
};
const meta={식당:['🍱','#f8e3c5','식사와 주문'],교통:['🚃','#dce8ed','전철과 택시'],쇼핑:['🛍️','#f1dce5','가격과 결제'],숙소:['🛎️','#e7e2ce','체크인과 요청'],'길 묻기':['🧭','#dce8d7','장소와 방향'],'긴급 상황':['🆘','#f0d6cd','도움이 필요할 때'],공항:['✈️','#e8e5f4','탑승과 환승'],관광지:['🗾','#e7eedf','입장과 관람'],카페:['☕','#f3e2d3','주문과 휴식'],'병원·약국':['💊','#f6dde1','진료와 약']};
const notes={식당:'알레르기나 재료 확인이 필요하면 메뉴를 함께 가리켜 주세요.',교통:'목적지는 지도 화면을 함께 보여주면 더 정확합니다.',쇼핑:'작은 가게에서는 현금만 가능한 경우가 있어요.',숙소:'예약 확인서나 여권을 함께 준비하면 편합니다.','길 묻기':'목적지 이름이나 지도 화면을 보여주며 물어보세요.','긴급 상황':'위급할 때는 경찰 110, 구급·소방 119로 전화하세요.',공항:'여권과 탑승권을 미리 준비하면 빠르게 안내받을 수 있어요.',관광지:'촬영 금지 구역과 관람 규칙을 먼저 확인해 주세요.',카페:'매장 이용과 포장은 店内・持ち帰り로 구분해 말해요.','병원·약국':'심각한 증상은 바로 119로 연락해 도움을 요청하세요.'};
const commonPhrases=[['すみません。','스미마센.','실례합니다.'],['ありがとうございます。','아리가토오 고자이마스.','감사합니다.'],['もう一度お願いします。','모오 이치도 오네가이시마스.','한 번 더 부탁드립니다.'],['ゆっくり話してください。','윳쿠리 하나시테 쿠다사이.','천천히 말해 주세요.'],['日本語がよく分かりません。','니혼고가 요쿠 와카리마센.','일본어를 잘 모르겠어요.'],['英語を話せますか？','에이고오 하나세마스카?','영어를 할 수 있나요?'],['これは何ですか？','코레와 난데스카?','이것은 무엇인가요?'],['これをください。','코레오 쿠다사이.','이것을 주세요.'],['ここでいいですか？','코코데 이이데스카?','여기가 맞나요?'],['近くにありますか？','치카쿠니 아리마스카?','가까이에 있나요?'],['写真を見せてもいいですか？','샤신오 미세테모 이이데스카?','사진을 보여드려도 되나요?'],['少し待ってください。','스코시 맛테 쿠다사이.','잠시 기다려 주세요.'],['助かりました。','타스카리마시타.','도움이 됐어요.'],['大丈夫です。','다이조오부데스.','괜찮습니다.'],['分かりました。','와카리마시타.','알겠습니다.'],['はい、お願いします。','하이, 오네가이시마스.','네, 부탁드립니다.'],['いいえ、結構です。','이이에, 켓코오데스.','아니요, 괜찮습니다.'],['現金で払います。','겐킨데 하라이마스.','현금으로 계산할게요.'],['カードで払います。','카아도데 하라이마스.','카드로 계산할게요.'],['また来ます。','마타 키마스.','다시 올게요.']];
const phrases=Object.entries(sets).flatMap(([cat,items])=>[...items,...commonPhrases].map(([jp,romaji,ko],i)=>({id:`${cat}-${i}`,cat,jp,romaji,ko,note:notes[cat],use:`${cat} 상황에서 ${ko}라고 말할 때 사용해요.`})));
const quickWords={
 식당:[
  ['一人','히토리','1명'],['二人','후타리','2명'],['一つ','히토츠','1개'],['二つ','후타츠','2개'],
  ['お水','오미즈','물'],['おしぼり','오시보리','물티슈'],['ティッシュ','팃슈','휴지'],['トイレ','토이레','화장실'],
  ['箸','하시','젓가락'],['スプーン','스푸운','숟가락'],['フォーク','포오쿠','포크'],['お皿','오사라','접시'],
  ['メニュー','메뉴우','메뉴'],['お会計','오카이케이','계산']
 ],
 교통:[
  ['駅','에키','역'],['電車','덴샤','전철'],['地下鉄','치카테츠','지하철'],['バス','바스','버스'],
  ['タクシー','타쿠시이','택시'],['切符','킷푸','표'],['ICカード','아이시 카아도','교통카드'],['乗り場','노리바','타는 곳'],
  ['出口','데구치','출구'],['入口','이리구치','입구'],['次','츠기','다음'],['終電','슈우덴','막차'],
  ['一駅','히토에키','한 정거장'],['二駅','후타에키','두 정거장']
 ],
 쇼핑:[
  ['これ','코레','이것'],['それ','소레','그것'],['一つ','히토츠','1개'],['二つ','후타츠','2개'],
  ['サイズ','사이즈','사이즈'],['色','이로','색'],['値段','네단','가격'],['現金','겐킨','현금'],
  ['カード','카아도','카드'],['レシート','레시이토','영수증'],['袋','후쿠로','봉투'],['試着室','시차쿠시츠','탈의실'],
  ['免税','멘제이','면세'],['トイレ','토이레','화장실']
 ],
 숙소:[
  ['ホテル','호테루','호텔'],['部屋','헤야','방'],['鍵','카기','열쇠'],['予約','요야쿠','예약'],
  ['チェックイン','체크인','체크인'],['チェックアウト','체크아우토','체크아웃'],['パスポート','파스포오토','여권'],['朝食','초오쇼쿠','조식'],
  ['タオル','타오루','수건'],['Wi-Fi','와이파이','와이파이'],['パスワード','파스와아도','비밀번호'],['エレベーター','에레베에타아','엘리베이터'],
  ['トイレ','토이레','화장실'],['一泊','잇파쿠','1박']
 ],
 '길 묻기':[
  ['駅','에키','역'],['出口','데구치','출구'],['入口','이리구치','입구'],['交差点','코오사텐','교차로'],
  ['右','미기','오른쪽'],['左','히다리','왼쪽'],['まっすぐ','맛스구','직진'],['近く','치카쿠','근처'],
  ['遠い','토오이','멀다'],['地図','치즈','지도'],['トイレ','토이레','화장실'],['コンビニ','콘비니','편의점'],
  ['バス停','바스테이','버스 정류장'],['タクシー乗り場','타쿠시이 노리바','택시 승강장']
 ],
 '긴급 상황':[
  ['助け','타스케','도움'],['警察','케이사츠','경찰'],['救急車','큐우큐우샤','구급차'],['病院','뵤오인','병원'],
  ['薬局','야쿄쿠','약국'],['財布','사이후','지갑'],['パスポート','파스포오토','여권'],['携帯電話','케이타이 덴와','휴대전화'],
  ['なくした','나쿠시타','잃어버렸다'],['痛い','이타이','아프다'],['危ない','아부나이','위험하다'],['日本語','니혼고','일본어'],
  ['英語','에이고','영어'],['110','햐쿠토오반','경찰 110']
 ],
 공항:[
  ['空港','쿠우코오','공항'],['パスポート','파스포오토','여권'],['搭乗券','토오조오켄','탑승권'],['搭乗口','토오조오구치','탑승구'],
  ['出発','슛파츠','출발'],['到着','토오차쿠','도착'],['荷物','니모츠','짐'],['手荷物','테니모츠','기내 수하물'],
  ['チェックイン','체크인','체크인'],['保安検査','호안 켄사','보안 검색'],['乗り継ぎ','노리츠기','환승'],['遅れ','오쿠레','지연'],
  ['両替','료오가에','환전'],['トイレ','토이레','화장실']
 ],
 관광지:[
  ['入場券','뉴우조오켄','입장권'],['入口','이리구치','입구'],['出口','데구치','출구'],['案内所','안나이조','안내소'],
  ['地図','치즈','지도'],['写真','샤신','사진'],['トイレ','토이레','화장실'],['お土産','오미야게','기념품'],
  ['パンフレット','판후렛토','안내 책자'],['ガイド','가이도','가이드'],['今日','쿄오','오늘'],['時間','지칸','시간'],
  ['開館','카이칸','개관'],['休み','야스미','휴무']
 ],
 카페:[
  ['一人','히토리','1명'],['二人','후타리','2명'],['一つ','히토츠','1개'],['二つ','후타츠','2개'],
  ['お水','오미즈','물'],['おしぼり','오시보리','물티슈'],['ティッシュ','팃슈','휴지'],['トイレ','토이레','화장실'],
  ['ストロー','스토로오','빨대'],['砂糖','사토오','설탕'],['ミルク','미루쿠','우유'],['氷','코오리','얼음'],
  ['席','세키','자리'],['持ち帰り','모치카에리','포장']
 ],
 '병원·약국':[
  ['病院','뵤오인','병원'],['薬局','야쿄쿠','약국'],['医者','이샤','의사'],['薬','쿠스리','약'],
  ['頭','아타마','머리'],['お腹','오나카','배'],['熱','네츠','열'],['痛い','이타이','아프다'],
  ['アレルギー','아레루기이','알레르기'],['保険証','호켄쇼오','보험증'],['処方箋','쇼호오센','처방전'],['飲み薬','노미구스리','먹는 약'],
  ['一日','이치니치','하루'],['救急車','큐우큐우샤','구급차']
 ]
};
window.TABI_PHRASES = phrases;
window.TABI_META = meta;
window.TABI_QUICK_WORDS = quickWords;
if (!window.TABI_DATA_ONLY) {
let favorites=JSON.parse(localStorage.getItem('tabi-favorites')||'[]'),views=JSON.parse(localStorage.getItem('tabi-views')||'[]'),active=null,back=[],reviewItems=[],reviewIndex=0;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);const save=()=>{localStorage.setItem('tabi-favorites',JSON.stringify(favorites));localStorage.setItem('tabi-views',JSON.stringify(views))};
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}
function event(name,data={}){let e=JSON.parse(localStorage.getItem('tabi-events')||'[]');e.unshift({name,data,at:Date.now()});localStorage.setItem('tabi-events',JSON.stringify(e.slice(0,100)))}
function show(id){$$('.screen').forEach(x=>x.classList.remove('active'));$(`#${id}-screen`).classList.add('active');$('.topbar').hidden=id!=='home';$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.nav===id));if(id==='home'){recent();progress()}if(id==='history')history();scrollTo(0,0)}
function speak(text){let u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.82;speechSynthesis.cancel();speechSynthesis.speak(u);event('audio_play',{text})}
function cards(list){return list.map(p=>`<article class="phrase-card" data-id="${p.id}"><button class="speaker" data-speak="${p.id}" aria-label="듣기">▶</button><div class="jp">${p.jp}</div><div class="ko">${p.ko}</div></article>`).join('')}
function bind(){ $$('.phrase-card').forEach(x=>x.onclick=e=>!e.target.dataset.speak&&detail(x.dataset.id));$$('[data-speak]').forEach(x=>x.onclick=e=>{e.stopPropagation();speak(phrases.find(p=>p.id===x.dataset.speak).jp)}) }
function list(cat){let x=cat==='popular'?phrases.slice(0,12):cat==='favorites'?phrases.filter(p=>favorites.includes(p.id)):phrases.filter(p=>p.cat===cat);$('#list-eyebrow').textContent=cat==='favorites'?'SAVED PHRASES':cat==='popular'?'QUICK ACCESS':'SITUATION';$('#list-title').textContent=cat==='popular'?'자주 쓰는 말':cat==='favorites'?'저장한 표현':cat;$('#list-description').textContent=x.length?`${x.length}개의 표현을 준비했어요.`:'아직 저장한 표현이 없어요.';$('#phrase-list').innerHTML=cards(x);bind();event('category_open',{cat});show('list');if(cat==='favorites')$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.nav==='favorites'))}
function detail(id,addHistory=true){active=phrases.find(p=>p.id===id);if(addHistory)back.push($('.screen.active').id.replace('-screen',''));views=[id,...views.filter(x=>x!==id)].slice(0,30);save();let p=active;$('#detail-category').textContent=p.cat;$('#detail-japanese').textContent=p.jp;$('#detail-romaji').textContent=p.romaji;$('#detail-korean').textContent=p.ko;$('#detail-use').textContent=p.use;$('#detail-note').textContent=p.note;$('#detail-polite').textContent=p.jp.startsWith('すみません')?p.jp:`すみません、${p.jp}`;$('#detail-dialogue').textContent=`나: ${p.jp}\n상대: はい、かしこまりました。`;let rel=phrases.filter(x=>x.cat===p.cat&&x.id!==id).slice(0,2);$('#detail-related').innerHTML=rel.map(x=>`<div class="related-item" data-id="${x.id}"><strong>${x.jp}</strong><span>${x.ko}</span></div>`).join('');$$('.related-item').forEach(x=>x.onclick=()=>detail(x.dataset.id));let f=$('#detail-favorite');f.classList.toggle('is-saved',favorites.includes(id));$$('[data-feedback]').forEach(x=>x.classList.remove('selected'));event('phrase_view',{id});show('detail')}
function recent(){let x=views.slice(0,3).map(id=>phrases.find(p=>p.id===id)).filter(Boolean);$('#recent-section').hidden=!x.length;$('#recent-list').innerHTML=x.map(p=>`<button class="recent-item" data-id="${p.id}"><span><strong>${p.jp}</strong><small>${p.ko}</small></span><b>›</b></button>`).join('');$$('.recent-item').forEach(x=>x.onclick=()=>detail(x.dataset.id))}
function history(){let x=views.map(id=>phrases.find(p=>p.id===id)).filter(Boolean);$('#history-description').textContent=x.length?`${x.length}개 표현을 확인했어요.`:'아직 확인한 표현이 없어요.';$('#history-list').innerHTML=cards(x);bind()}
function progress(){let events=JSON.parse(localStorage.getItem('tabi-events')||'[]'),audio=events.filter(x=>x.name==='audio_play').length;$('#stat-views').textContent=views.length;$('#stat-audio').textContent=audio;$('#stat-favorites').textContent=favorites.length;$('#progress-label').textContent=views.length?`여행 준비 ${Math.min(100,Math.round(views.length/12*100))}%`:''}
function startReview(){let ids=[...favorites,...views];if(!ids.length)ids=phrases.slice(0,5).map(p=>p.id);reviewItems=[...new Set(ids)].map(id=>phrases.find(p=>p.id===id)).filter(Boolean).slice(0,5);reviewIndex=0;renderReview();event('review_start');show('review')}
function renderReview(){let p=reviewItems[reviewIndex];$('#review-progress').textContent=`${reviewIndex+1} / ${reviewItems.length} 표현`;$('#review-korean').textContent=p.ko;$('#review-japanese').textContent=p.jp;$('#review-romaji').textContent=p.romaji;$('#review-answer').hidden=true;$('#review-listen').hidden=true;$('#review-reveal').hidden=false;$('#review-next').textContent=reviewIndex===reviewItems.length-1?'복습 완료':'다음 표현 ›'}
function localAsk(q){let words=q.toLowerCase().split(/\s+/);let p=phrases.map(p=>({p,n:words.reduce((n,w)=>n+((p.cat+p.jp+p.romaji+p.ko).toLowerCase().includes(w)?1:0),0)})).sort((a,b)=>b.n-a.n)[0].p;let keys={포장:'식당-6',계산:'식당-7',메뉴:'식당-1',추천:'식당-2',역:'교통-0',택시:'교통-0',막차:'교통-5',가격:'쇼핑-0',얼마:'쇼핑-0',카드:'쇼핑-1',면세:'쇼핑-4',체크인:'숙소-0',체크아웃:'숙소-2',호텔:'숙소-0',와이파이:'숙소-5',화장실:'길 묻기-1',길:'길 묻기-0',사진:'길 묻기-4',여권:'긴급 상황-7',경찰:'긴급 상황-1',병원:'긴급 상황-3',구급차:'긴급 상황-2'};for(let k in keys)if(q.includes(k))p=phrases.find(x=>x.id===keys[k]);if(/(^|\s)물(?:을|은|도)?(?:\s|$)/.test(q))p=phrases.find(x=>x.id==='식당-0');let polite=/정중|공손/.test(q)?`<br>더 정중하게: すみません、${p.jp}`:'';$('#ask-answer').innerHTML=`<article class="ai-card"><p class="eyebrow">TABi'S RECOMMENDATION</p><h3>${p.jp}</h3><p class="answer-ko">${p.romaji}<br>${p.ko}</p><small>${p.use}<br>${p.note}${polite}</small><br><button data-play="${p.id}">▶ 일본어로 듣기</button><button class="answer-detail" data-detail="${p.id}">자세히 보기</button></article>`;$('[data-play]').onclick=()=>speak(p.jp);$('[data-detail]').onclick=()=>detail(p.id);event('ai_question',{q,source:'local'})}
const escapeHtml=value=>String(value||'').replace(/[&<>'"]/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
async function ask(q){if(!window.TABI_AI_ENDPOINT)return localAsk(q);$('#ask-answer').innerHTML='<article class="ai-card"><p class="eyebrow">TABi IS THINKING</p><small>여행에 맞는 표현을 고르고 있어요.</small></article>';try{const headers={'Content-Type':'application/json'};if(window.TABI_SUPABASE_ANON_KEY){headers.apikey=window.TABI_SUPABASE_ANON_KEY;headers.Authorization=`Bearer ${window.TABI_SUPABASE_ANON_KEY}`}const response=await fetch(window.TABI_AI_ENDPOINT,{method:'POST',headers,body:JSON.stringify({question:q})});const answer=await response.json();if(!response.ok||answer.error)throw new Error(answer.error||'AI request failed');const jp=escapeHtml(answer.japanese),pronunciation=escapeHtml(answer.pronunciation),meaning=escapeHtml(answer.meaning),usage=escapeHtml(answer.usage),caution=escapeHtml(answer.caution);$('#ask-answer').innerHTML=`<article class="ai-card"><p class="eyebrow">AI RECOMMENDATION</p><h3>${jp}</h3><p class="answer-ko">${pronunciation}<br>${meaning}</p><small>${usage}<br>${caution}</small><br><button data-ai-play>▶ 일본어로 듣기</button></article>`;$('[data-ai-play]').onclick=()=>speak(answer.japanese);event('ai_question',{q,source:'api'})}catch(error){toast('AI 연결에 실패해 기본 추천을 보여드려요.');localAsk(q)}}
Object.entries(meta).forEach(([cat,[icon,color,sub]])=>$('#category-grid').insertAdjacentHTML('beforeend',`<button class="category-card" data-cat="${cat}" style="--card:${color}"><span class="emoji">${icon}</span><strong>${cat}</strong><small>${sub} · 10개</small></button>`));$$('[data-cat]').forEach(x=>x.onclick=()=>list(x.dataset.cat));
$('#global-search').oninput=e=>{let q=e.target.value.toLowerCase(),x=q?phrases.filter(p=>(p.jp+p.romaji+p.ko+p.cat).toLowerCase().includes(q)).slice(0,6):[];$('#search-results').innerHTML=cards(x)||(q?'<p style="color:#817c74;font-size:13px">찾는 표현이 없어요. AI 질문을 이용해 보세요.</p>':'');bind();q&&event('search',{q})};$('#popular-button').onclick=()=>list('popular');$('#history-button').onclick=()=>show('history');$$('[data-back]').forEach(x=>x.onclick=()=>show(back.pop()||'home'));$('#detail-listen').onclick=()=>speak(active.jp);$('#detail-favorite').onclick=()=>{let i=favorites.indexOf(active.id);i<0?favorites.push(active.id):favorites.splice(i,1);save();detail(active.id,false);toast(i<0?'즐겨찾기에 저장했어요':'즐겨찾기에서 삭제했어요')};$$('[data-feedback]').forEach(x=>x.onclick=()=>{x.classList.add('selected');event('feedback',{type:x.dataset.feedback,id:active.id});toast(x.dataset.feedback==='helpful'?'의견을 기록했어요.':'오류 신고를 기록했어요.')});$$('.nav-item').forEach(x=>x.onclick=()=>x.dataset.nav==='favorites'?list('favorites'):show(x.dataset.nav));$('#ask-form').onsubmit=e=>{e.preventDefault();let q=$('#ask-input').value.trim();if(q){ask(q);$('#ask-input').value=''}};$$('#suggestion-chips button').forEach(x=>x.onclick=()=>ask(x.textContent));if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js');const network=()=>$('#offline-note').hidden=navigator.onLine;network();addEventListener('online',network);addEventListener('offline',network);save();
$('#review-button').onclick=startReview;$('#review-reveal').onclick=()=>{$('#review-answer').hidden=false;$('#review-listen').hidden=false;$('#review-reveal').hidden=true;event('review_reveal',{id:reviewItems[reviewIndex].id})};$('#review-listen').onclick=()=>speak(reviewItems[reviewIndex].jp);$('#review-next').onclick=()=>{if(reviewIndex===reviewItems.length-1){event('review_complete',{count:reviewItems.length});show('home');toast('복습을 완료했어요!')}else{reviewIndex++;renderReview()}};
}
