/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_USE_MOCK: 'true' | 'false'
  /** 로그인 화면에 시연 계정 버튼을 보일지 */
  readonly VITE_DEMO_ACCOUNTS: 'true' | 'false'
}
