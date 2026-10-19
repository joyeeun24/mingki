# Frontend 작업 계획

Rule Ripple 프론트엔드(Vue 3 + Spring 백엔드)의 작업 순서와 완료 기준.
설계 근거는 [PROJECT.md](./PROJECT.md), 백엔드 API는 [BACKEND_API.md](./BACKEND_API.md).

## 원칙

- 백엔드가 바뀌어도 안 바뀌는 것(화면, 상태 흐름, 도메인 개념)과 바뀔 것(API 주소, 응답 필드, 인증, 진행 상황 전달 방식)을 분리한다.
- 바뀔 것은 `src/api/`와 `src/mocks/`에만 둔다. 화면과 store는 `src/domain/` 타입만 본다.
- 백엔드가 완성되기 전에는 MSW mock으로 모든 화면을 먼저 만든다.

## 진행 상황

| # | 작업 | 상태 | 완료 기준 |
|---|---|---|---|
| 1 | 프로젝트 세팅 | ✅ 완료 | `pnpm build` · `lint` · `typecheck` · `test` 통과 |
| 2 | 도메인 타입 | ✅ 완료 | BACKEND_API.md 5절 응답이 전부 `src/domain/` 타입으로 표현됨 |
| 3 | 가짜 데이터 | ✅ 완료 | 작업 1건이 아래 3절 항목을 전부 포함하고, 백엔드 응답 모양과 같음 |
| 4 | API 함수 + mock 서버 | ⬜ | 데모 범위 함수 11개가 MSW로 응답하고 성공 흐름을 시뮬레이션 |
| 5 | 화면 8개 | ⬜ | 각 화면이 fixture로 렌더링 (데모 범위 기능) |
| 6 | 상태별 전환 | ⬜ | 성공 흐름의 작업 상태 8개 화면 전환, 기본 로딩 |
| 7 | 데모 리허설 | ⬜ | PROJECT.md 10절 5분 데모를 mock으로 끝까지 클릭, 빠진 버튼 없음 |
| 8 | 실서버 연결 | ⬜ | `VITE_USE_MOCK=false`로 같은 화면이 동작 |
| 9 | 배포 | ⬜ | `docker compose up`으로 frontend 컨테이너가 뜨고, 어느 경로에서 새로고침해도 화면이 유지됨 |

## 데모 우선 범위

PROJECT.md 10절 5분 데모를 가짜 서버로 먼저 끝까지 만든다. 4 ~ 6단계는 성공 흐름 하나만 다루고, 나머지는 데모 뒤로 미룬다.
가짜 서버 데모는 화면 흐름을 보여주는 연습 · 백업용이다. 실제 Agent가 도는 시연은 8단계 뒤에 가능하다.

### 데모 흐름

| # | 누가 | 화면 | 일어나는 일 |
|---|---|---|---|
| 1 | 담당자 (`officer1`) | 로그인 → 업로드 | 규정 v3.md · v4.md 업로드 |
| 2 | 자동 | 진행 상황 | 요건 추출 중 → 요건 확정 대기에서 멈춤 |
| 3 | 담당자 | ① 요건 확정 | 요건 3건의 신 · 구 원문, 시행일, 경과조치 확인 → 확정 |
| 4 | 누구나 | 영향 위치 · 데모 비교 | 바꿀 곳 12개, 대상 아님 9개와 이유. 키워드 검색이 놓친 곳 · 잘못 고친 곳과 비교 |
| 5 | 자동 | 진행 상황 | 수정안 생성 → 검증 1회차 실패(경과조치 누락) → 수정안 다시 생성 → 2회차 통과 → 검토 · 승인 대기에서 멈춤 |
| 6 | 개발자 (`dev1`) | ② 검토 · 승인 | diff, 테스트, 회차별 검증 결과 확인 → 승인 |
| 7 | 자동 → 누구나 | 진행 상황 → 리포트 | PR · 티켓 생성 → 완료. 명세서와 PR 5개 · 티켓 4개 링크 |

자동 단계는 단계마다 몇 초씩 걸린다. 화면을 보는 동안에도 뒤에서 계속 진행된다.
성공 흐름의 작업 상태는 8개다: `EXTRACTING` → `WAITING_REQUIREMENT_APPROVAL` → `LOCATING` → `DESIGNING` → `VERIFYING` → `WAITING_REVIEW` → `PUBLISHING` → `DONE`.

### 데모 뒤로 미루는 것

| 항목 | 원래 단계 |
|---|---|
| 작업 목록 `/tasks`, `listTasks` | 4 · 5 |
| 진행 이벤트 `getEvents` (큐 재시도 표시 포함) | 4 |
| 보류 · 거절 · 실질 변경 없음 · 시스템 오류 흐름 | 4 · 6 |
| 검토 화면의 거절 · 수정 요청 · 위치 빼고 승인 | 5 |
| 빈 화면 · 오류 화면 | 6 |
| SSE | 8 |

## 2. 도메인 타입 (`src/domain/`)

BACKEND_API.md 5절 응답의 칸 이름과 값을 그대로 따른다. 자유 형식 칸(`detail`, `payload`)만 뺀다.

| 타입 | 백엔드 응답 |
|---|---|
| `AnalysisTask`, `TaskStatus` | `TaskSummary`, 아래 상태 목록 |
| `RegulationDocument` | `documents[]` (업로드한 v3 · v4) |
| `Requirement` | `requirements[]` |
| `ChangeSpec` (대상 · 대상 아님) | `targets[]`, `nonTargets[]` |
| `CodePatch` (검증 회차마다 한 행) | `patches[]` |
| `TestCase` | `testCases[]` |
| `Approval` | `approvals[]` |
| `Delivery` | `deliveries[]` |
| `User`, `Role` | `GET /api/auth/me` |

### 작업 상태

| 상태 | 화면 표시 | 사람이 할 일 |
|---|---|---|
| `EXTRACTING` | 요건 추출 중 | 대기 |
| `WAITING_REQUIREMENT_APPROVAL` | 요건 확정 대기 | 담당자: 확정 또는 보류 |
| `LOCATING` | 영향 위치 탐색 · 테스트 생성 중 | 대기 |
| `DESIGNING` | 수정안 생성 중 | 대기 |
| `VERIFYING` | 검증 중 (n회차, 최대 2회) | 대기 |
| `WAITING_REVIEW` | 검토 · 승인 대기 | 개발자: 승인 · 거절 · 수정 |
| `PUBLISHING` | PR · 티켓 생성 중 | 대기 |
| `DONE` | 완료 | 결과 보기 |
| `NO_CHANGE` | 실질 변경 없음 | 종료 |
| `HELD` / `REJECTED` | 보류 · 거절로 종료 | 종료 |
| `FAILED` | 시스템 오류 | 다시 시도 |

## 3. 가짜 데이터 (`src/mocks/fixtures/`)

백엔드 응답 모양(BACKEND_API.md 5절) 그대로 만든다. 그래야 실서버로 바꿀 때 화면과 `src/api/`를 그대로 쓴다.

작업 1건 = 규정 v3 → v4 업로드 1번. 요건은 3건이 함께 나온다.

- 규정 원문: `data/regulations/credit-loan-ops/`
- 코드 위치: PROJECT.md 10절 (샘플 레포가 나오면 맞춘다)
- 상품 규칙: `eval/answer_key.md` 2절

| 요건 | 포함할 것 |
|---|---|
| 제15조 고령자 65 → 60 | 바꿀 곳 4개(`age >= 65`, `age > 64`, `SENIOR_AGE_MONTHS = 780`, 경과조치 분기) + 상품 규칙 P002 `ELIGIBLE_MIN_AGE`, 대상 아님(`RETIREMENT_AGE = 65`, 상품 규칙 `INCOME_EST_RETIREMENT_AGE` · `SENIOR_RATE_DISCOUNT`), diff, 검증 1회차 실패 → 2회차 통과 |
| 제8조 DSR 0.40 → 0.35 | 바꿀 곳 3개(`DSR_LIMIT: 0.40`, 하드코딩 `0.4`, 문구 "DSR 40%") + 상품 규칙 P001 · P002 `DSR_LIMIT`, 대상 아님(`LTV_LIMIT = 0.40`, 상품 규칙 `MORTGAGE_LTV_LIMIT`, P003 `DSR_LIMIT 0.35`), diff, 검증 통과 |
| 제15조의2 고령자 설명 확인 (④ 신규) | 명세서 · 인터페이스 · 실패하는 테스트까지 (PROJECT.md 9절 MVP 범위) |

`creditLoan.spec.ts`가 원문 · 정답지 · 위 표와 맞는지 검사한다.
리포트 · 평가(데모 비교) 데이터는 4단계에서 API 응답 타입과 함께 만든다.

## 4. API 함수 + mock 서버 (`src/api/`, `src/mocks/handlers.ts`)

| 함수 | 용도 | 화면 |
|---|---|---|
| `login(username, password)` / `getMe()` | 로그인, 내 역할 | 로그인 |
| `createTask(files)` | 규정 v3 · v4 업로드, 작업 생성 | 업로드 |
| `listTasks()` / `getTask(id)` | 목록 · 상세 · 현재 상태 | 목록, 진행 상황 |
| `getRequirements(taskId)` | 요건 목록과 신 · 구 원문 | ① 요건 확정 |
| `approveRequirements(taskId, decisions)` | 확정 · 보류 | ① 요건 확정 |
| `getChangeSpecs(taskId)` | 영향 위치, 대상 아님 | 영향 위치 |
| `getPatches(taskId)` | diff, 테스트, 회차별 검증 결과 | ② 검토 · 승인 |
| `reviewPatches(taskId, decision)` | 승인 · 거절 · 수정 요청 | ② 검토 · 승인 |
| `getReport(taskId)` | 명세서, PR · 티켓 링크 | 리포트 |
| `getEvaluation(taskId)` | 키워드 검색 비교, 정답지 점수 | 데모 비교 |
| `getEvents(taskId, after)` | 진행 이벤트 (폴링) | 진행 상황 |

주소와 응답 모양은 BACKEND_API.md 3·5절을 따른다.
mock은 같은 모양으로 응답하고, `createTask` 뒤 시간 흐름으로 상태를 전환하고, interrupt 두 지점에서 멈춘다.

## 5. 화면 8개 (`src/pages/`)

구현 순서는 어려운 것부터.

| 순서 | 화면 | 경로 | 핵심 컴포넌트 | 추가 라이브러리 |
|---|---|---|---|---|
| 1 | ② 검토 · 승인 | `/tasks/:id/review` | Tabs, Badge, Alert, Dialog, Textarea | diff 뷰어 (`diff2html` 또는 `v-code-diff`) |
| 2 | ① 요건 확정 | `/tasks/:id/requirements` | Card, Checkbox, RadioGroup, Tabs | — |
| 3 | 영향 위치 | `/tasks/:id/locations` | Table, Badge, Collapsible, Tooltip | TanStack Table |
| 4 | 진행 상황 | `/tasks/:id` | Badge, Separator, Skeleton | — |
| 5 | 업로드 | `/tasks/new` | Card, Input(file), Progress | — |
| 6 | 리포트 | `/tasks/:id/report` | Card, Table, Button | `markdown-it` |
| 7 | 데모 비교 | `/tasks/:id/evaluation` | Table, Badge, Progress | — |
| 8 | 로그인 | `/login` | Card, Input, Button | — |

목록 화면 `/tasks`는 4번과 함께 만든다.
시연에서는 계정 `officer1`(담당자) · `dev1`(개발자)로 로그인해 역할을 바꾼다.

## 6. 상태별 전환

- 로그인 가드: 토큰이 없으면 `/login`으로 보낸다.
- 라우터 가드: 작업 상태와 `pendingAction`(백엔드가 알려주는 지금 사람이 할 일)으로 허용 화면을 정한다. 그 외는 진행 상황으로 리다이렉트.
- 역할 가드: ① 요건 확정은 담당자, ② 검토 · 승인은 개발자만. 서버도 403으로 막는다.
- 모든 화면에 로딩(Skeleton) · 빈 화면 · 오류 화면.
- `canApprove`가 false면 승인 버튼 비활성. 서버도 409로 막는다.

## 8. 실서버 연결

바꾸는 곳은 아래 네 파일만이어야 한다.

| 파일 | 바뀌는 것 |
|---|---|
| `vite.config.ts` | 개발 서버의 `/api` 요청을 백엔드(`localhost:8080`)로 프록시 |
| `src/api/client.ts` | `Authorization: Bearer` 토큰, 에러 형식 `{error, message}`, 401이면 로그인으로 |
| `src/api/types.ts` | 응답 모양이 달라진 항목. 도메인 타입이 응답과 같아서 변환 층(`mappers.ts`)은 두지 않는다 |
| `src/composables/useTaskPolling.ts` | `GET /tasks/{id}` + `/events?after=` 폴링 (SSE는 나중에) |

## 9. 배포

- frontend 컨테이너(nginx)가 빌드 결과를 서빙한다. history 라우팅은 `try_files $uri /index.html`.
- `/api` 요청은 nginx가 backend로 넘긴다.
- `docker-compose.yml`의 frontend 서비스 주석을 푼다.

## 백엔드와 확인한 것

답은 BACKEND_API.md 2절.

| 질문 | 답 | 프론트 영향 |
|---|---|---|
| 프론트는 Spring만 호출하나? | 네 | `/api`만 호출 |
| 인증 방식 | JWT. 시연은 계정 2개로 로그인 | 로그인 화면, `client.ts` 토큰 헤더 |
| 진행 상황 전달 | 폴링으로 충분, SSE도 가능 | `useTaskPolling`은 폴링 |
| ① 요건 확정에서 내용 수정 | 안 됨. 확정 · 보류만 | 편집 UI 없음 |
| ② 수정 요청 방식 | 코멘트로 요청 (`REQUEST_CHANGES`, 코멘트 필수) | 코드 편집기 없음 |
| 검증 실패 패치의 승인 예외 | 없음. 해당 위치를 빼고(`excludedSpecKeys`) 승인하거나 수정 요청 | 검토 화면에 위치 제외 선택 |
| 규정 파일 형식 | `.md` · `.markdown` · `.txt`, UTF-8, 파일당 1MB 이하 | 업로드 전 검사 |
| 작업 티켓 위치 | 백엔드 `work_tickets`, 링크 `/tickets/{id}`, 참조 `RR-{id}` | 리포트 링크 |
| 명세서 출력 형식 | `report.markdown` | 화면 렌더링 + 다운로드 |
| history 라우팅 | frontend nginx가 처리 | 9. 배포 |

## 아직 정할 것

- 제15조의2(④ 신규)를 시연에 넣을지. 정답지에는 요건으로 들어 있어서 가짜 데이터에 넣었다.
- `articleRef`에 조항 제목도 넣을지 (`제15조` → `제15조(고령자 기준)`).
- 평가의 `keywordBaseline` 모양. 프론트는 `{missed: specKey[], wrong: specKey[]}`로 가정했다 (`src/domain/report.ts`). `counts`는 쓰지 않는다.
