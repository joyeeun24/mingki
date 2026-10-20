<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

import { Button } from '@/components/ui/button'

// 주소가 바뀌는 이동이라 Tabs가 아니라 링크로 만든다. 현재 링크에는 RouterLink가 aria-current를 붙인다
defineProps<{ taskId: string }>()

const route = useRoute()

const ITEMS = [
  { name: 'task-progress', label: '진행 상황' },
  { name: 'task-requirements', label: '요건 확정' },
  { name: 'task-locations', label: '영향 위치' },
  { name: 'task-review', label: '검토 · 승인' },
  { name: 'task-report', label: '리포트' },
  { name: 'task-evaluation', label: '비교' },
] as const
</script>

<template>
  <nav aria-label="작업 메뉴" class="flex flex-wrap gap-1 border-b pb-2">
    <Button
      v-for="item in ITEMS"
      :key="item.name"
      as-child
      size="sm"
      :variant="route.name === item.name ? 'secondary' : 'ghost'"
    >
      <RouterLink :to="{ name: item.name, params: { id: taskId } }">{{ item.label }}</RouterLink>
    </Button>
  </nav>
</template>
