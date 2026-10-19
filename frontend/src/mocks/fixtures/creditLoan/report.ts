import type { Report } from '@/domain'

export const report: Report = {
  summary: '요건 3건, 변경 위치 12곳(대상 아님 9곳), Draft PR 5건 · 작업 티켓 4건. 검증 2회차 통과',
  markdown: `# 개발 변경 명세서 · 개인신용대출 운영기준 v3 → v4

시행일 **2026-12-01**. 시행일 전 신청분과 기존 계약의 기간 연장은 종전 기준을 따른다(부칙 제2조).

## R1. 고령자 기준 만 65세 → 만 60세 (제15조)

| 항목 | 내용 |
|---|---|
| 근거 | 운영기준 v4 제15조 (reg://credit-loan-ops/v4/15) |
| 위치 | \`loan/eligibility.py\` is_senior · \`loan/pricing.py\` senior_discount, SENIOR_AGE_MONTHS · \`config/policy.yaml\` · 상품 규칙 P002 ELIGIBLE_MIN_AGE |
| 유형 | ② 로직 (하드코딩 65, > 64, 780 제거) · ① 값 (SENIOR_AGE 시행일 버전 추가) |
| 수정안 | \`age >= 65\` → \`age >= policy("SENIOR_AGE", as_of=applied_at)\`, 월 단위 상수와 \`> 64\`는 is_senior() 호출로 통일 |
| 대상 아님 | \`RETIREMENT_AGE = 65\`(소득 추정용 정년), 상품 규칙 INCOME_EST_RETIREMENT_AGE, SENIOR_RATE_DISCOUNT(우대 폭 변경 없음) |
| 테스트 | 59 / 60 / 62세 경계, 시행일 전날 신청, 신청 API 전체 흐름(62세 우대 적용), 시니어 상품 가입 |
| 검증 | 1회차 실패(경과조치 누락) → 2회차 통과 |

## R2. DSR 한도 40% → 35% (제8조)

| 항목 | 내용 |
|---|---|
| 근거 | 운영기준 v4 제8조 (reg://credit-loan-ops/v4/8) |
| 위치 | \`config/policy.yaml\` DSR_LIMIT · \`batch/limit_batch.py\` 하드코딩 0.4 · \`web/templates/apply.html\` 문구 "DSR 40%" · 상품 규칙 P001 · P002 DSR_LIMIT |
| 유형 | ① 값 · ② 로직 (배치) |
| 수정안 | DSR_LIMIT 시행일 버전 추가, 배치는 \`policy("DSR_LIMIT", as_of=loan.applied_at)\`, 화면 문구 35% |
| 대상 아님 | \`LTV_LIMIT = 0.40\`, 상품 규칙 MORTGAGE_LTV_LIMIT(LTV), P003 DSR_LIMIT 0.35(이미 신 기준 이하) |
| 테스트 | DSR 정확히 0.35 허용, 0.37은 시행일 전후로 승인 · 거절 |
| 검증 | 1회차 통과 |

## R3. 고령자 설명 확인 의무 신설 (제15조의2, ④ 신규)

| 항목 | 내용 |
|---|---|
| 근거 | 운영기준 v4 제15조의2 (reg://credit-loan-ops/v4/15-2), 부칙 제3조 |
| 범위 | MVP는 명세서 · 인터페이스 · 실패하는 테스트까지. 구현은 2단계 |
| 인터페이스 | \`loan/senior_explanation.py\` confirm_explanation(applicant, items, staff) → ExplanationRecord, 미확인 시 sign_contract()가 ExplanationRequired |
| 저장 | explanation_records(설명 일시, 항목, 확인 방법, 담당 직원), 계약 종료일부터 5년 보관 |
| 테스트 | 설명 확인 없이 체결 시 예외 (현재 xfail) |

## 전달

- Draft PR: eligibility, pricing, policy, batch, ui 묶음 5건
- 작업 티켓: 상품 규칙 3건(P002 ELIGIBLE_MIN_AGE, P001 · P002 DSR_LIMIT), ④ 신규 1건
`,
}
