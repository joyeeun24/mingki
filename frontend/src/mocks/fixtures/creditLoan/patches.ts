import type { CodePatch } from '@/domain'

// 고령자 묶음(eligibility)은 1회차에 경과조치를 빠뜨려 실패하고, 2회차에 신청일 기준으로 고쳐 통과한다.
// 실패한 묶음만 다시 만들므로 나머지 묶음은 1회차가 현재 회차다.
export const patches: CodePatch[] = [
  {
    id: 1,
    bundle: 'eligibility',
    round: 1,
    specKeys: ['S1', 'S4'],
    filePath: 'loan/eligibility.py',
    diff: `--- a/loan/eligibility.py
+++ b/loan/eligibility.py
@@ -3,7 +3,7 @@
 
 def is_senior(applicant) -> bool:
     """신청일 기준 만 나이로 고령자인지 판단한다 (운영기준 제15조)."""
-    return applicant.age >= 65
+    return applicant.age >= policy("SENIOR_AGE")
 
 
 def is_eligible(applicant) -> bool:`,
    verifyStatus: 'FAILED',
    verifyLog: `패치 적용 OK · 문법 OK
FAILED tests/test_eligibility.py::test_62_before_effective_date_is_not_senior
  2026-11-30 신청 · 만 62세: 종전 기준(65세)으로 고령자가 아니어야 하는데 고령자로 판정됨
  부칙 제2조 ①: 시행일 전 신청분은 종전 규정을 따른다
1 failed, 6 passed, 1 xfailed`,
    failureKind: 'PATCH',
    latest: false,
  },
  {
    id: 2,
    bundle: 'pricing',
    round: 1,
    specKeys: ['S2', 'S3'],
    filePath: 'loan/pricing.py',
    diff: `--- a/loan/pricing.py
+++ b/loan/pricing.py
@@ -1,14 +1,15 @@
-SENIOR_AGE_MONTHS = 780  # 65세 × 12개월
+from loan.eligibility import is_senior
+
 SENIOR_RATE_DISCOUNT = 0.3
 
 
 def senior_discount(applicant) -> float:
     """고령자 우대 금리 (운영기준 제16조 ①)."""
-    if applicant.age > 64:
+    if is_senior(applicant):
         return SENIOR_RATE_DISCOUNT
     return 0.0
 
 
 def prepayment_fee_waived(applicant) -> bool:
     """고령자는 중도상환수수료 면제 (운영기준 제16조 ②)."""
-    return applicant.age_months >= SENIOR_AGE_MONTHS
+    return is_senior(applicant)`,
    verifyStatus: 'PASSED',
    verifyLog: '패치 적용 OK · 문법 OK · 관련 테스트 통과',
    failureKind: null,
    latest: true,
  },
  {
    id: 3,
    bundle: 'policy',
    round: 1,
    specKeys: ['S5', 'S12'],
    filePath: 'config/policy.yaml',
    diff: `--- a/config/policy.yaml
+++ b/config/policy.yaml
@@ -1,5 +1,10 @@
-# 운영기준 정책값
+# 운영기준 정책값. 시행일이 다른 값은 버전 목록으로 둔다.
 MIN_AGE: 19
-DSR_LIMIT: 0.40
+DSR_LIMIT:
+  - { value: 0.40, effective_from: 2024-01-01 }
+  - { value: 0.35, effective_from: 2026-12-01 }
 MAX_INCOME_MULTIPLE: 1.0
 MAX_AMOUNT: 100000000
+SENIOR_AGE:
+  - { value: 65, effective_from: 2024-01-01 }
+  - { value: 60, effective_from: 2026-12-01 }`,
    verifyStatus: 'PASSED',
    verifyLog: '패치 적용 OK · 문법 OK · 관련 테스트 통과',
    failureKind: null,
    latest: true,
  },
  {
    id: 4,
    bundle: 'batch',
    round: 1,
    specKeys: ['S13'],
    filePath: 'batch/limit_batch.py',
    diff: `--- a/batch/limit_batch.py
+++ b/batch/limit_batch.py
@@ -1,3 +1,4 @@
+from config import policy
 from loan.dsr import calc_dsr
 
 
@@ -5,6 +6,6 @@
     """매일 밤 한도를 다시 계산해 DSR 초과 대출을 표시한다."""
     flagged = []
     for loan in loans:
-        if calc_dsr(loan) > 0.4:
+        if calc_dsr(loan) > policy("DSR_LIMIT", as_of=loan.applied_at):
             flagged.append(loan.id)
     return flagged`,
    verifyStatus: 'PASSED',
    verifyLog: '패치 적용 OK · 문법 OK · 관련 테스트 통과',
    failureKind: null,
    latest: true,
  },
  {
    id: 5,
    bundle: 'ui',
    round: 1,
    specKeys: ['S14'],
    filePath: 'web/templates/apply.html',
    diff: `--- a/web/templates/apply.html
+++ b/web/templates/apply.html
@@ -1,4 +1,4 @@
 <section class="notice">
   <h2>대출 한도 안내</h2>
-  <p>DSR 40% 이내, 연 소득의 100% 이내에서 신청할 수 있습니다.</p>
+  <p>DSR 35% 이내, 연 소득의 100% 이내에서 신청할 수 있습니다.</p>
 </section>`,
    verifyStatus: 'PASSED',
    verifyLog: '패치 적용 OK · 문법 OK · 관련 테스트 통과',
    failureKind: null,
    latest: true,
  },
  {
    id: 6,
    bundle: 'eligibility',
    round: 2,
    specKeys: ['S1', 'S4'],
    filePath: 'loan/eligibility.py',
    diff: `--- a/loan/eligibility.py
+++ b/loan/eligibility.py
@@ -2,8 +2,8 @@
 
 
 def is_senior(applicant) -> bool:
-    """신청일 기준 만 나이로 고령자인지 판단한다 (운영기준 제15조)."""
-    return applicant.age >= 65
+    """신청일 기준 만 나이로 고령자인지 판단한다 (운영기준 제15조, 부칙 제2조)."""
+    return applicant.age >= policy("SENIOR_AGE", as_of=applicant.applied_at)
 
 
 def is_eligible(applicant) -> bool:`,
    verifyStatus: 'PASSED',
    verifyLog: '패치 적용 OK · 문법 OK\n7 passed, 1 xfailed',
    failureKind: null,
    latest: true,
  },
]
