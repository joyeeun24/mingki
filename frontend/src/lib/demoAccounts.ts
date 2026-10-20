/** 로그인 화면에 시연 계정 버튼을 보일지 (.env.*의 VITE_DEMO_ACCOUNTS) */
export const showDemoAccounts = import.meta.env.VITE_DEMO_ACCOUNTS === 'true'

/**
 * 백엔드 시드 계정 (backend V2__seed.sql).
 * 조건이 빌드 때 정해지는 상수라서, 꺼진 빌드에는 계정 정보가 아예 들어가지 않는다
 */
export const DEMO_ACCOUNTS =
  import.meta.env.VITE_DEMO_ACCOUNTS === 'true'
    ? [
        {
          username: 'officer1',
          password: 'password',
          label: '담당자로 로그인',
          hint: '김준법 · 요건 확정',
        },
        {
          username: 'dev1',
          password: 'password',
          label: '개발자로 로그인',
          hint: '이개발 · 검토 · 승인',
        },
      ]
    : []
