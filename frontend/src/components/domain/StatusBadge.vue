<script setup lang="ts">
import { computed } from 'vue'

import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { TaskStatus } from '@/domain'
import { TASK_STATUS_LABEL } from '@/lib/labels'
import { TERMINAL_STATUSES, WAITING_STATUSES } from '@/lib/status'

const props = defineProps<{ status: TaskStatus }>()

const running = computed(
  () => !TERMINAL_STATUSES.has(props.status) && !WAITING_STATUSES.has(props.status),
)
const variant = computed(() => {
  if (props.status === 'DONE') return 'default'
  if (props.status === 'FAILED') return 'destructive'
  return running.value ? 'secondary' : 'outline'
})
</script>

<template>
  <Badge :variant="variant">
    <Spinner v-if="running" aria-hidden="true" />
    {{ TASK_STATUS_LABEL[status] }}
  </Badge>
</template>
