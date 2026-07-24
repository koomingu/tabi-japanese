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
