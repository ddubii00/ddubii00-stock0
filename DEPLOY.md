# 배포 메모

## 1. GitHub

```bash
git init
git add .
git commit -m "Initial ddubii stock routine tracker"
git branch -M main
git remote add origin <GitHub repository URL>
git push -u origin main
```

## 2. Vercel

1. Vercel에서 GitHub 저장소를 Import합니다.
2. Framework Preset은 `Other`로 둡니다.
3. Build Command는 비워둡니다.
4. Output Directory는 비워둡니다.
5. 배포 후 생성된 URL로 PC와 모바일에서 접속합니다.

## 3. Google Sheets 동기화

1. 새 Google Spreadsheet를 만듭니다.
2. `확장 프로그램 > Apps Script`를 엽니다.
3. [google-apps-script/Code.gs](./google-apps-script/Code.gs) 내용을 붙여넣습니다.
4. Apps Script의 `프로젝트 설정 > 스크립트 속성`에 `SYNC_SECRET` 값을 추가합니다.
5. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
   - 실행 사용자: 나
   - 액세스 권한: 나 또는 링크가 있는 사용자
6. 발급된 Web App URL을 Vercel Environment Variable `GOOGLE_APPS_SCRIPT_URL`에 넣습니다.
7. 같은 secret 값을 Vercel Environment Variable `GOOGLE_SYNC_SECRET`에 넣습니다.
8. Vercel을 재배포합니다.

설정 전에는 브라우저 로컬 저장소에 저장됩니다. 설정 후에는 앱이 `/api/sync`를 통해 Google Sheet의 `수행기록`, `일별요약` 시트로 동기화합니다.

로컬에서 동기화를 시험하려면 `.env.example`을 참고해 환경변수를 설정한 뒤 `npm start`를 실행합니다.

## 4. Oracle 서버: 암호 보호 및 공통 저장소

오라클 서버에서는 Vercel이 아니라 Node 서버를 실행합니다. `stock0-7`처럼 별도 서비스 디렉터리에 배포한 뒤, 먼저 `npm install`과 `npm run build`를 실행하세요. Node 서버는 `public` 폴더가 아닌 Vite의 `dist` 빌드 결과를 서비스합니다. `base: './'` 설정이 적용되어 `/stock0-7/` 하위경로에서도 자산과 API가 현재 경로 기준으로 동작합니다. 서비스 환경변수에 아래 값을 넣습니다.

```ini
REQUIRE_APP_PASSWORD=true
APP_PASSWORD=1222
APP_SESSION_SECRET=충분히-긴-임의의-문자열
DATA_DIR=/var/lib/ddubii-stock0
```

`DATA_DIR`은 앱 소스 폴더와 별도인 영구 경로여야 합니다. 앱은 이 경로의 `routine-data.json`에 체크 항목과 메모를 저장하므로, 같은 오라클 서버 주소로 접속하는 PC와 모바일에서는 동일한 기록을 봅니다.

간단한 systemd 서비스 예시는 다음과 같습니다. 실제 `User`, `WorkingDirectory`, 포트는 서버 구성에 맞춰 바꾸세요.

```ini
[Service]
WorkingDirectory=/var/www/stock0-7
Environment=PORT=4173
Environment=HOST=127.0.0.1
Environment=REQUIRE_APP_PASSWORD=true
Environment=APP_PASSWORD=1222
Environment=APP_SESSION_SECRET=충분히-긴-임의의-문자열
Environment=DATA_DIR=/var/lib/ddubii-stock0
ExecStart=/usr/bin/node server.js
Restart=always
```

웹 프록시(Nginx 등)는 외부 HTTPS 요청을 이 Node 포트로 전달하고 `X-Forwarded-Proto: https` 헤더를 전달해야 합니다. 로그인 세션은 30일 동안 유효하며 `/logout`으로 해제할 수 있습니다.
