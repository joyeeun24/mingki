import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DiffView from './DiffView.vue'

describe('DiffView', () => {
  it('줄마다 종류를 구분하고 +/- 기호를 그대로 보여준다', () => {
    const diff = [
      '--- a/loan/eligibility.py',
      '+++ b/loan/eligibility.py',
      '@@ -3,7 +3,7 @@',
      ' def is_senior(applicant) -> bool:',
      '-    return applicant.age >= 65',
      '+    return applicant.age >= policy("SENIOR_AGE")',
    ].join('\n')
    const spans = mount(DiffView, { props: { diff } }).findAll('span')

    expect(spans.map((s) => s.attributes('data-kind'))).toEqual([
      'file',
      'file',
      'hunk',
      'context',
      'del',
      'add',
    ])
    expect(spans[4]!.text()).toBe('-    return applicant.age >= 65')
    expect(spans[5]!.classes().join(' ')).toContain('bg-emerald')
  })
})
