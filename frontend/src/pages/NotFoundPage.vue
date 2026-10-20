<script setup lang="ts">
import { CompassIcon } from '@lucide/vue'
import { RouterLink } from 'vue-router'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
</script>

<template>
  <Empty class="border">
    <EmptyHeader>
      <EmptyMedia variant="icon"><CompassIcon /></EmptyMedia>
      <EmptyTitle>페이지를 찾을 수 없습니다</EmptyTitle>
      <EmptyDescription>주소를 다시 확인하세요.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child><RouterLink :to="{ name: 'upload' }">처음으로</RouterLink></Button>
    </EmptyContent>
  </Empty>
</template>
