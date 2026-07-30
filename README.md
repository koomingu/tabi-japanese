# tabi-japanese
여행 중 바로 사용할 수 있는 일본어 회화 학습 앱

## 실제 AI 질문 연결

기본 배포는 표현 데이터 기반의 빠른 추천으로 동작합니다. 실제 생성형 AI 응답을 사용하려면 Supabase Edge Function을 배포한 뒤, 배포 URL을 브라우저 설정에서 `window.TABI_AI_ENDPOINT`에 지정하세요.

```js
window.TABI_AI_ENDPOINT = 'https://<project-ref>.supabase.co/functions/v1/ask-phrase'
window.TABI_SUPABASE_ANON_KEY = '<public-anon-key>'
```

Supabase에 아래 비밀값을 등록해야 합니다. API 키는 GitHub Pages나 브라우저 코드에 넣지 않습니다.

```text
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

## 사진·릴스 표현 가져오기

홈의 `사진·릴스에서 표현 가져오기`에서 스크린샷 또는 공개 Instagram 링크를 참고하며, 일본어 자막·캡션 텍스트에서 표현 후보를 확인해 저장할 수 있습니다. 저장한 표현은 이 브라우저의 북마크와 복습에 바로 포함됩니다.

현재 MVP의 표현 후보 생성은 브라우저에서 동작하며 AI API 연결이 필요 없습니다. 일본어 자막·캡션을 붙여넣은 뒤, 뜻과 발음을 직접 검토·입력해 저장합니다.

사진 속 글자를 자동으로 읽거나 링크 캡션을 자동 수집하는 기능은 별도 OCR 또는 서버 연동 단계에서 추가할 수 있습니다.
