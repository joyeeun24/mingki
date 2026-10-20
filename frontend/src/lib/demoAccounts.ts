/** 백엔드 시드 계정 (backend V2__seed.sql). VITE_DEMO_ACCOUNTS=true일 때만 로그인 화면에 버튼으로 보인다 */
export const DEMO_ACCOUNTS = [
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
] as const

export const showDemoAccounts = import.meta.env.VITE_DEMO_ACCOUNTS === 'true'
