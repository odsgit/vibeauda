# vibeauda

React + TypeScript + Vite 기반 프론트엔드 프로젝트

## 기술 스택

- **프레임워크**: React 19 + TypeScript
- **번들러**: Vite
- **스타일**: Tailwind CSS v4
- **린터/포매터**: ESLint (Airbnb) + Prettier
- **백엔드**: Supabase
- **AI**: OpenAI API

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
| `VITE_OPENAI_API_KEY` | OpenAI API 키 |

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run lint:fix` | ESLint 자동 수정 |
| `npm run format` | Prettier 포매팅 |

## 폴더 구조

```
src/
├── components/   # 재사용 가능한 UI 컴포넌트
├── pages/        # 라우트별 페이지 컴포넌트
├── lib/          # 외부 클라이언트 (Supabase 등) 초기화
├── hooks/        # 커스텀 훅
└── types/        # TypeScript 타입 정의
```
