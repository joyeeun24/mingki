<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { VerifyStatus } from '@/domain'
import { VERIFY_STATUS_LABEL } from '@/lib/labels'

defineProps<{ status: VerifyStatus }>()

const VARIANT = { PASSED: 'default', FAILED: 'destructive', PENDING: 'secondary' } as const
</script>

<template>
  <Badge :variant="VARIANT[status]">
    <Spinner v-if="status === 'PENDING'" aria-hidden="true" />
    {{ VERIFY_STATUS_LABEL[status] }}
  </Badge>
</template>
