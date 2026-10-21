# Frontend 작업 계획

Rule Ripple 프론트엔드(Vue 3 + shadcn-vue)의 화면 구성, 작업 순서, 완료 기준.
제품 방향은 [SIMPLIFICATION.md](./SIMPLIFICATION.md) v2, API는 [BACKEND_API.md](./BACKEND_API.md) 10절, 응답 예시는 [`contracts/`](./contracts/).

## 원칙

- **백엔드는 끝났다.** 프론트는 화면 품질에 집중한다. 화면 구성을 먼저 정하고, 갤러리에서 예시 데이터로 UI를 완성한 뒤 실제 API를 붙인다.
- **사용자는 한 명, 역할 없음.** 로그인만 한다.
- **화면은 목록을 받아 그리기만 한다.** 규정 · 상품 · 제안이 늘어도 화면 코드는 그대로다. 시나리오별 컴포넌트는 만들지 않는다.
- **값은 단위로 표시한다.** `ratio` 0.35 → 35%, `percent` 35 → 35%, `percent_point` 0.3 → 0.3%p, `krw` → 원, `age` → 세, `score` → 점, `bool` → 예/아니오. 모르는 규칙 키는 키 그대로 보여준다.

## 화면 (6개)

| # | 화면 | 경로 | 레이아웃 | API |
|---|---|---|---|---|
| 1 | 로그인 | `/login` | 가운데 카드 1개 | `POST /api/auth/login` |
| 2 | 시작 | `/` | 상단바 + 개정 목록 (규정 이름, 바뀐 버전, 시행일, [분석 시작]) | `POST /api/ai/tasks` (규정 파일 2개 업로드) |
| 3 | ① 추출 | `/tasks/:id/extraction` | 작업 틀 + 바뀐 조항 카드 (전 · 후 원문 나란히, 바뀐 글자 강조, 경과조치) | `GET /requirements` |
| 4 | ② 영향 | `/tasks/:id/impact` | 작업 틀 + 상품 표 (변경 필요 · 유지 · 추가 확인 + 이유, 필터) + 영향 받는 계약 | `GET /proposals`(`impact`), `GET /contract-impacts` |
| 5 | ③ 제안 · 확인 | `/tasks/:id/proposals` | 작업 틀 + 제안 표 (선택, 지금 값 → 제안 값, 근거, 검사 결과) + 아래 고정 바 [반영] | `GET /proposals`, `POST /review` |
| 6 | 결과 | `/tasks/:id/result` | 작업 틀 + 반영 결과 (새 규칙 번호, 대기열 상태) + 최종 보고서 | `GET /proposals`(`apply`), `GET /report` |

`/tasks/:id`는 지금 단계의 화면으로 보낸다.

**작업 틀 (3 ~ 6 공통)**: 상단바(사용자 · 데모 초기화 · 로그아웃), 규정 이름과 상태, 4단계 표시(Stepper: ① 추출 → ② 영향 → ③ 제안 · 확인 → ④ 반영). 끝난 단계는 눌러서 이동한다. AI가 아직 그 단계를 하고 있으면 화면 안에 "지금 하는 일" 문장(`STEP.message`)과 로딩 표시를 둔다. 상태는 `GET /api/ai/tasks/{id}` + `/events?after=`를 1초마다 받는다.

| 상태 | 지금 단계 |
|---|---|
| `EXTRACTING` | ① |
| `LOCATING` | ② |
| `DESIGNING` · `VERIFYING` · `WAITING_REVIEW` | ③ (검사 회차 표시) |
| `PUBLISHING` · `DONE` · `REJECTED` | ④ |
| `NO_CHANGE` | ① ("실질 변경 없음") |
| `FAILED` | 오류 안내 (`errorMessage`) |

**데모 초기화**: 상단바 버튼 → 확인 대화상자 → `POST /api/demo/reset` → 시작 화면.

## 갤러리 (`/gallery`, 개발 빌드만)

- 백엔드 없이 6개 화면을 상태별로 한 페이지에서 본다. UI는 여기서 계속 다듬는다.
- 데이터: `docs/contracts/` 예시 + `data/business/products.json`(상품 이름) + `data/regulations/` 원문.
- 상태: 진행 중, 1차 검사 실패 → 2차 통과, 확인 대기, 반영 중, 완료, 실패, 빈 화면.
- 화면 부품은 데이터를 props로만 받는다. 갤러리와 실제 화면이 같은 부품을 쓰고, API 호출은 페이지만 한다.

## 진행 순서

| # | 할 일 | 끝난 기준 |
|---|---|---|
| 0 | 기반 옮기기: 옛 브랜치(`minkyojung/frontend-mock-handlers`)에서 로그인 · 서버 연결 · 상태 확인 · shadcn 설정. 역할 · 계정 전환 제거, 글꼴 설정 수정 | 검사 5개 통과 |
| 1 | 화면 구성 확정 (이 문서) | 팀 확인 |
| 2 | 타입과 예시 데이터: `docs/contracts/` 모양 그대로 | 예시 데이터가 계약 파일과 같은지 테스트로 검사 |
| 3 | 갤러리 + 공용 부품: 표(필터 · 선택), 값 표시, 단계 표시, 상태 배지 | 갤러리에서 확인 |
| 4 | 화면별 UI 완성: 6개 화면을 상태별로 | 모든 상태가 갤러리에서 자연스럽게 보임 |
| 5 | 페이지 연결: 실제 API, 1초 상태 확인, 반영, 초기화 | 실서버로 처음부터 끝까지 |
| 6 | 실행 설정: Dockerfile(nginx), `docker-compose.yml` frontend 주석 해제 | `docker compose up`으로 화면이 뜸 |
| 7 | 시연 연습 후 PR | 초기화 후 반복해도 같은 결과 |

PR은 0 ~ 4(기반 + 갤러리 + UI)와 5 ~ 7(연결 + 실행) 두 개로 나눈다.

## 방식

| 항목 | 결정 | 이유 |
|---|---|---|
| 가짜 서버 | 처음부터 끝까지 흐르는 가짜 서버는 만들지 않는다 | 화면 확인은 갤러리, 흐름 확인은 실서버가 맡는다 |
| 실서버 확인 | 5번부터 | OpenAI 키가 필요하고 한 번에 약 40초. 키가 없으면 예시 데이터를 돌려주는 간단한 가짜 응답만 둔다 |
| shadcn | `components/ui/`는 CLI 원본 그대로, 조합은 기능별 폴더 | 표는 공식 가이드대로 Table + TanStack Table |
| 피드백 | 만들지 않는다 | v2 계약에 `REQUEST_CHANGES` 없음. 확인은 반영 / 제외만 |
| 확인 단위 | 제안별 (`excludedProposalKeys`). 화면은 상품별로 묶어 보여준다 | 10.3 |

## 팀에 요청할 것 (5번 전까지)

| 누구 | 요청 | 없으면 |
|---|---|---|
| C | 제안 응답에 상품 이름, 계약 영향 응답에 계약 정보(상품 · 신청일 · DSR · 만기) | 상품 목록 파일로 임시 대응, 계약은 번호와 이유만 |
| A | 계약 영향 저장(`PUT /contract-impacts`), `live` 모드(MCP 사용)로 끝까지 확인 | 영향 받는 계약 칸이 비어 있음 |
| A (선택) | 도구 호출 이벤트(`TOOL_START` · `TOOL_END`) | 진행 표시에 단계 문장만 나옴 |

## 아직 정할 것

- 시작 화면의 개정 목록: 지금은 전 · 후 버전이 다 있는 규정이 `credit-loan-ops`(v3 → v4) 하나뿐이다.
- 결과 화면에서 최종 보고서(markdown)를 그대로 보여줄지, 반영 결과 표만 보여줄지.
