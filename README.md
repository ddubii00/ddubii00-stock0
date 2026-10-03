# ddubii-stock0

주식투자 관련 하루 일과 수행 여부를 확인하는 웹앱입니다. 매일 루틴을 체크하고, 체크하지 않은 항목은 `안함`으로 기록합니다. 로컬에서는 브라우저에 저장되고, Vercel 배포 후 Google Apps Script를 연결하면 Google Sheets로 동기화됩니다.

## 실행

```bash
npm start
```

브라우저에서 `http://localhost:4173`을 엽니다.

## 기능

- 날짜별 루틴 체크
- 체크한 항목은 `함`, 체크하지 않은 항목은 `안함`으로 저장
- 완료율, 카테고리별 진행률, 연속 완료일 표시
- 최근 7일 완료율 요약
- 오늘 핵심 메모, 못 한 이유, 내일 보완할 것 자동 저장
- 루틴 항목 추가/삭제와 기본값 복원
- Excel 호환 `.xls` 문서 저장
- Vercel 서버리스 API 준비
- Google Sheets 동기화 준비

## 배포와 동기화

GitHub, Vercel, Google Sheets 연결 순서는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

Google Sheets 설정 전에는 각 브라우저의 로컬 저장소에 저장됩니다. 설정 후에는 `/api/sync`를 통해 Google Sheet의 `수행기록`, `일별요약` 시트로 기록됩니다. 오라클 Node 서버로 실행할 때는 `/api/data`가 서버 파일에 기록을 저장해 PC와 모바일의 데이터를 공유합니다. 암호 보호와 서버 배포는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.
