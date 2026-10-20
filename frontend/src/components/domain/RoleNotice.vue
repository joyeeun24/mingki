<script setup lang="ts">
import { InfoIcon } from '@lucide/vue'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// 버튼을 막은 이유를 보여준다 (역할이 다르거나, 그 단계가 아니거나)
defineProps<{ title: string; message: string }>()
</script>

<template>
  <Alert>
    <InfoIcon />
    <AlertTitle>{{ title }}</AlertTitle>
    <AlertDescription class="break-keep">{{ message }}</AlertDescription>
  </Alert>
</template>
