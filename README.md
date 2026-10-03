# ddubii-stock0

주식투자 관련 하루 일과 수행 여부를 확인하는 React/Vite 웹앱입니다. 달력, 일일 달성도, 투자 좌우명, 체크리스트, 투자 일지, 백업을 밝은 카드형 화면에서 관리합니다. 오라클 Node 서버에서는 암호 보호와 공용 파일 저장소를 사용하며, Google Sheets는 서버 저장을 사용할 수 없을 때의 동기화 경로로 유지됩니다.

## 실행

```bash
npm install
npm run build
npm start
```

브라우저에서 `http://localhost:4173`을 엽니다.

## 기능

- 달력과 날짜별 루틴·좌우명 체크
- 오늘의 종합 달성도와 주중 평균 달성도
- 투자 일지 자동 저장과 좌우명 편집
- JSON 백업·복구와 Excel 호환 `.xls` 내보내기
- 오라클 서버의 `routine-data.json` 공용 저장
- `REQUIRE_APP_PASSWORD=true`일 때 세션 기반 암호 보호
- Google Sheets fallback 동기화

## 배포와 동기화

GitHub, Vercel, Google Sheets 연결 순서는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

오라클 Node 서버에서는 `/api/data`가 `DATA_DIR/routine-data.json`에 기록을 저장해 PC와 모바일의 데이터를 공유합니다. 서버 저장을 사용할 수 없는 배포에서는 `/api/sync`가 Google Sheets 동기화 경로로 동작합니다. Vite `base: './'`와 상대 API 경로를 사용하므로 루트와 `/stock0-7/` reverse proxy 하위경로를 모두 지원합니다. 암호 보호와 서버 배포는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.
