<script setup lang="ts">
import { FileQuestionIcon } from '@lucide/vue'
import { computed, provide } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import StatusBadge from '@/components/domain/StatusBadge.vue'
import TaskNav from '@/components/domain/TaskNav.vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { TASK_CONTEXT } from '@/composables/taskContext'
import { useTaskPolling } from '@/composables/useTaskPolling'

// App.vue가 작업 id로 key를 걸어서, 다른 작업으로 가면 이 화면과 폴링이 새로 시작된다
const route = useRoute()
const context = useTaskPolling(String(route.params.id))
provide(TASK_CONTEXT, context)

const { detail, notFound, error } = context
const task = computed(() => detail.value?.task)
</script>

<template>
  <Empty v-if="notFound" class="border">
    <EmptyHeader>
      <EmptyMedia variant="icon"><FileQuestionIcon /></EmptyMedia>
      <EmptyTitle>작업을 찾을 수 없습니다</EmptyTitle>
      <EmptyDescription class="break-keep">
        데모를 초기화했거나 다른 브라우저 · 다른 주소에서 만든 작업일 수 있습니다.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child><RouterLink :to="{ name: 'upload' }">새 작업 시작</RouterLink></Button>
    </EmptyContent>
  </Empty>

  <div v-else-if="!task" class="space-y-4" aria-busy="true">
    <Skeleton class="h-8 w-96" />
    <Skeleton class="h-9 w-full" />
    <Skeleton class="h-64 w-full" />
  </div>

  <div v-else class="min-w-0 space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-semibold">{{ task.title }}</h1>
      <StatusBadge :status="task.status" />
      <span v-if="error" class="text-xs text-amber-700">
        서버 응답이 없어 마지막으로 받은 내용을 보여줍니다
      </span>
    </div>
    <TaskNav :task-id="task.id" />
    <RouterView />
  </div>
</template>
