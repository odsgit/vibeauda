# vibeauda

React + TypeScript + Vite 기반 프론트엔드 프로젝트

## 기술 스택

- **프레임워크**: React 19 + TypeScript
- **번들러**: Vite
- **스타일**: Tailwind CSS v4
- **린터/포매터**: ESLint (Airbnb) + Prettier
- **테스트**: Vitest
- **악보 렌더링**: VexFlow (오선보 + TAB + 드럼보)
- **PDF 내보내기**: jsPDF + svg2pdf.js
- **오디오 → MIDI**: @spotify/basic-pitch (TF.js, PoC 단계)
- **백엔드**: Supabase (DB, Storage, Edge Functions)
- **분석**: Google Analytics 4, Microsoft Clarity
- **AI**: OpenAI API (연동 예정 — 아직 코드에서 사용되지 않음)

## 로컬 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/odsgit/vibeauda.git
cd vibeauda
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 각 값을 채워 넣습니다.

| 변수명 | 설명 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `VITE_OPENAI_API_KEY` | OpenAI API 키 (아직 어떤 코드에서도 참조하지 않음 — 향후 AI 기능용으로 예약된 변수) |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 측정 ID (미설정 시 GA 로딩 자체를 건너뜀) |
| `VITE_CLARITY_PROJECT_ID` | Microsoft Clarity 프로젝트 ID (미설정 시, 또는 localhost에서는 로딩을 건너뜀) |

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 사용 가능한 라우트:

| 경로 | 설명 |
|---|---|
| `/` | 홈 |
| `/viewer` | TrackViewer 데모 (하드코딩된 데모 트랙, 6파트 탭 + ΔKey + PDF 다운로드) |
| `/poc/basic-pitch` | Basic Pitch PoC — 알려진 이슈로 현재 깨져 있음(아래 참고) |

## 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run lint:fix` | ESLint 자동 수정 |
| `npm run format` | Prettier 포매팅 |
| `npm run test` | Vitest 전체 실행 (CI와 동일) |
| `npm run test:watch` | Vitest watch 모드 |

## CI

`main`, `develop` 브랜치로의 push 및 PR에서 GitHub Actions가 자동 실행됩니다 (lint → 타입 체크 → 테스트 순서). CI가 실패하면 PR 병합이 차단되므로, 머지 전에 로컬에서 `npm run lint`와 `npx tsc --noEmit`을 통과시켜 주세요.

## 배포 (Cloudflare Pages)

Production: https://vibeauda.pages.dev (GitHub `main` 브랜치와 연동)

### 빌드 설정 확인 체크리스트

Cloudflare Pages 대시보드 → 프로젝트 선택 → **Settings → Builds & deployments**에서 아래 값을 확인하세요.

- [ ] **Build command**: `npm run build` (현재 프로젝트 구조 기준 정확함 — `tsc -b && vite build`)
- [ ] **Build output directory**: `dist` (Vite 기본값, `vite.config.ts`에 별도 `build.outDir` 지정 없음 — 위 값과 일치해야 함)
- [ ] **Root directory**: 저장소 루트(비워둠)
- [ ] **Node.js version**: `20` (`.github/workflows/ci.yml`의 CI 노드 버전과 동일하게 맞추는 것을 권장)
- [ ] SPA 클라이언트 라우팅(`/viewer`, `/poc/basic-pitch` 등 `react-router-dom` 경로) 새로고침 시 404가 나지 않는지 확인 — `public/_redirects`(`/*  /index.html  200`)로 SPA 폴백 처리를 해두었으니, 배포 후 실제로 새로고침 테스트 필요

### 환경 변수(Production) 최신화 체크리스트

Settings → **Environment variables**의 Production 값이 아래와 실제로 일치하는지 확인하세요.

- [ ] `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — 사용 중인 Supabase 프로젝트(운영용)의 값과 일치
- [ ] `VITE_OPENAI_API_KEY` — 유효하고 만료/폐기되지 않은 키
- [ ] `VITE_GA_MEASUREMENT_ID` — 실제 운영 GA4 속성의 측정 ID (Phase 3-3에서 추가된 신규 변수)
- [ ] `VITE_CLARITY_PROJECT_ID` — 실제 운영 Clarity 프로젝트 ID (Phase 3-4에서 추가된 신규 변수)
- [ ] Preview 환경 변수도 별도로 설정되어 있는지 (Production과 값을 공유할지, 별도 테스트용 값을 쓸지 결정 필요)

### Preview 배포 확인 절차

`main` 이외 브랜치(예: `develop`) push 시 Cloudflare Pages가 Preview 배포를 만드는지 확인하는 절차입니다.

1. Cloudflare Pages 대시보드 → Settings → Builds & deployments에서 **Preview deployments**가 "All branches" 또는 원하는 브랜치 패턴으로 활성화되어 있는지 확인
2. `develop` 브랜치(또는 임의의 feature 브랜치)에 커밋을 push
3. Pages 대시보드의 **Deployments** 탭에 새 배포가 생성되고, 상태가 "Success"로 바뀌는지 확인
4. 해당 배포에 할당된 `*.vibeauda.pages.dev` 형태의 고유 Preview URL에 접속해 실제로 페이지가 뜨는지 확인
5. 같은 브랜치로 PR을 올렸다면, GitHub PR 화면에 Cloudflare Pages 봇이 Preview URL 코멘트를 자동으로 남기는지 확인

> 위 항목들은 Cloudflare 콘솔에서 사람이 직접 확인해야 하는 절차이며, 이 저장소의 코드만으로는 검증할 수 없습니다.

## Supabase Edge Functions

### cleanup-stale-tracks (Storage TTL)

`last_accessed_at`(마이그레이션 `20260702000000_track_ttl_columns.sql`) 기준으로 90일간 열람되지 않은 트랙의 원본 오디오(`audio-tracks` 버킷)와 스템 파일(`audio-stems` 버킷)을 삭제합니다. `sheets`(악보/가사 데이터)는 항상 보존되며, `tracks` 행도 삭제하지 않고 `status`를 `expired`로, `file_url`을 `null`로 갱신합니다.

배포 및 스케줄 등록:

```bash
supabase functions deploy cleanup-stale-tracks --no-verify-jwt
supabase secrets set CRON_SECRET=<임의의 랜덤 문자열>
```

이후 `supabase/functions/cleanup-stale-tracks/schedule.sql`을 열어 `<PROJECT_REF>`, `<CRON_SECRET>`을 실제 값으로 채운 뒤 Supabase SQL 편집기에서 한 번 실행하면 pg_cron으로 매일 03:00 UTC에 자동 실행되도록 등록됩니다(사전에 대시보드에서 `pg_cron`, `pg_net` 확장 활성화 필요).

> **주의**: 현재 앱 코드에는 트랙 조회 시 `last_accessed_at`을 갱신하는 로직이 아직 없습니다(실제 Supabase 연동 트랙 조회 화면이 구현되면 함께 추가해야 함). 그 전까지는 사실상 "생성 후 90일"과 동일하게 동작합니다.

## 알려진 이슈

- **`/poc/basic-pitch` 페이지가 dev 서버에서 깨짐**: `@tensorflow/tfjs-converter/dist/executor/hash_table.js`의 `async import(keys, values) {...}` 메서드를 현재 Vite 버전(`^8.1.1` → 실제 해석 `8.1.2`)의 dynamic-import 재작성 로직이 오인식해서 발생. `optimizeDeps.exclude`로는 문제가 옮겨갈 뿐 해결되지 않았음. 다른 라우트(`/`, `/viewer`)는 `App.tsx`에서 이 페이지를 `React.lazy()`로 분리해 영향받지 않도록 격리해 둠. 실제 수정은 Vite 버전 다운그레이드 또는 `patch-package`로 해당 라이브러리 파일을 패치해야 함.

## 폴더 구조

```
src/
├── components/   # 재사용 가능한 UI 컴포넌트 (SheetView 등)
├── pages/        # 라우트별 페이지 컴포넌트 (TrackViewer, PocBasicPitch)
├── lib/          # 순수 로직 + 외부 클라이언트 초기화
│                 #   supabase.ts, analytics.ts(GA4), clarity.ts,
│                 #   transpose.ts(이조), fft.ts/guitarSplit.ts(기타 분리),
│                 #   renderSheet.ts(VexFlow 렌더링), exportPdf.ts(PDF 내보내기)
├── data/         # 데모/샘플 데이터
├── hooks/        # 커스텀 훅 (현재 비어 있음)
└── types/        # TypeScript 타입 정의

supabase/
├── migrations/   # DB 스키마 마이그레이션
└── functions/    # Edge Functions (예: cleanup-stale-tracks)
```
