import { toast } from 'vue-sonner'

import { ApiError } from '@/api/client'

// 서버 문구에는 영어 상태 이름이 섞여 있어서, 제목은 상태 코드로 정하고 서버 문구는 설명으로 붙인다
const TITLE: Record<number, string> = {
  400: '요청을 처리할 수 없습니다',
  401: '다시 로그인해 주세요',
  403: '권한이 없습니다',
  404: '찾을 수 없습니다',
  409: '이미 처리되었거나 단계가 바뀌었습니다',
  413: '파일이 너무 큽니다',
  501: '데모에서 지원하지 않는 기능입니다',
}

export function notifyError(error: unknown) {
  if (error instanceof ApiError) {
    toast.error(TITLE[error.status] ?? '오류가 발생했습니다', { description: error.message })
    return
  }
  toast.error('서버에 연결할 수 없습니다', {
    description: error instanceof Error ? error.message : String(error),
  })
}
