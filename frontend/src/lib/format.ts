// 시연 화면은 항상 한국 시간으로 보인다. 승인은 몇 초 차이로 일어나서 초까지 표시한다
const dateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const percent = new Intl.NumberFormat('ko-KR', { style: 'percent', maximumFractionDigits: 0 })

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

/** 시행일 같은 YYYY-MM-DD. Date를 거치면 시간대에 따라 하루가 밀릴 수 있어 문자열로만 다룬다 */
export function formatDate(ymd: string | null): string {
  if (!ymd) return '미정'
  const [year, month, day] = ymd.split('-')
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio)
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`
  const minutes = Math.round(seconds / 60)
  return minutes < 60 ? `${minutes}분` : `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}
