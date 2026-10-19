import type { TestCase } from '@/domain'

// 신청자 값은 eval/fixtures/applicants.json (A01 ~ A09)
export const testCases: TestCase[] = [
  {
    id: 1,
    testKey: 'T1',
    reqKey: 'R1',
    name: '만 59세는 고령자가 아니다',
    kind: 'BOUNDARY',
    code: `def test_59_is_not_senior():
    applicant = make_applicant(birth_date="1966-12-06", applied_at="2026-12-05")
    assert is_senior(applicant) is False`,
  },
  {
    id: 2,
    testKey: 'T2',
    reqKey: 'R1',
    name: '신청일에 만 60세가 되면 고령자다',
    kind: 'BOUNDARY',
    code: `def test_60_on_application_date_is_senior():
    applicant = make_applicant(birth_date="1966-12-05", applied_at="2026-12-05")
    assert is_senior(applicant) is True`,
  },
  {
    id: 3,
    testKey: 'T3',
    reqKey: 'R1',
    name: '시행일 전날 신청한 만 62세는 종전 기준으로 고령자가 아니다',
    kind: 'EFFECTIVE_DATE',
    code: `def test_62_before_effective_date_is_not_senior():
    applicant = make_applicant(birth_date="1964-03-15", applied_at="2026-11-30")
    assert is_senior(applicant) is False`,
  },
  {
    id: 4,
    testKey: 'T4',
    reqKey: 'R1',
    name: '만 62세가 신청 API 전체 흐름에서 고령자 우대를 받는다',
    kind: 'SYSTEM',
    code: `def test_62_gets_senior_discount(client):
    res = client.post("/applications", json={
        "productId": "P001", "birthDate": "1964-03-15", "appliedAt": "2026-12-10",
        "annualIncome": 40000000, "annualDebtService": 8000000,
    })
    assert res.json()["seniorApplied"] is True
    assert res.json()["rateDiscountPp"] == 0.3`,
  },
  {
    id: 5,
    testKey: 'T5',
    reqKey: 'R1',
    name: '만 62세가 시니어 상품(P002)에 가입할 수 있다',
    kind: 'SYSTEM',
    code: `def test_62_can_join_senior_product(client):
    res = client.post("/applications", json={
        "productId": "P002", "birthDate": "1964-06-01", "appliedAt": "2026-12-08",
        "annualIncome": 30000000, "annualDebtService": 6000000,
    })
    assert res.json()["decision"] == "APPROVE"`,
  },
  {
    id: 6,
    testKey: 'T6',
    reqKey: 'R2',
    name: 'DSR이 정확히 0.35면 허용한다',
    kind: 'BOUNDARY',
    code: `def test_dsr_exactly_035_is_allowed():
    applicant = make_applicant(applied_at="2026-12-07", annual_income=60000000, annual_debt_service=21000000)
    assert check_dsr(applicant) is True`,
  },
  {
    id: 7,
    testKey: 'T7',
    reqKey: 'R2',
    name: 'DSR 0.37은 시행일 이후 신청이면 거절, 전날 신청이면 승인',
    kind: 'EFFECTIVE_DATE',
    code: `@pytest.mark.parametrize("applied_at, allowed", [("2026-12-07", False), ("2026-11-30", True)])
def test_dsr_037_by_application_date(applied_at, allowed):
    applicant = make_applicant(applied_at=applied_at, annual_income=50000000, annual_debt_service=18500000)
    assert check_dsr(applicant) is allowed`,
  },
  {
    id: 8,
    testKey: 'T8',
    reqKey: 'R3',
    name: '설명 확인 없이 고령자와 대출 계약을 체결할 수 없다',
    kind: 'UNIT',
    code: `@pytest.mark.xfail(reason="④ 신규: MVP는 인터페이스와 실패하는 테스트까지")
def test_contract_blocked_without_explanation():
    applicant = make_applicant(birth_date="1960-01-15", applied_at="2026-12-10")
    with pytest.raises(ExplanationRequired):
        sign_contract(applicant, explanation=None)`,
  },
]
