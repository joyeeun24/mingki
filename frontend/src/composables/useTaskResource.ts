import { ref, shallowRef, watch } from 'vue'

import { useTaskContext } from './taskContext'

/**
 * 작업 화면의 데이터를 불러온다. 작업이 바뀔 때(updatedAt)마다 다시 불러오되,
 * 다시 부르는 동안 이전 데이터를 그대로 보여주고, 늦게 도착한 옛 응답은 버린다.
 */
export function useTaskResource<T>(load: (taskId: string) => Promise<T>) {
  const { detail } = useTaskContext()
  const data = shallowRef<T | null>(null)
  const error = ref<unknown>(null)
  let latest = 0

  async function reload() {
    const task = detail.value?.task
    if (!task) return
    const request = ++latest
    try {
      const result = await load(task.id)
      if (request === latest) {
        data.value = result
        error.value = null
      }
    } catch (e) {
      if (request === latest) error.value = e
    }
  }

  watch(() => detail.value?.task.updatedAt, reload, { immediate: true })

  return { data, error, reload }
}
