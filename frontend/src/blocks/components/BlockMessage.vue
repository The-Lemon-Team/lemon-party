<script setup lang="ts">
import { computed } from 'vue';
import { documentFromStored, type MessageDocument } from '@lemon-party/blocks';
import BlockRenderer from './BlockRenderer.vue';

const props = defineProps<{
  rawText: string;
  content?: MessageDocument | null;
}>();

const document = computed(() =>
  documentFromStored(props.content ?? undefined, props.rawText),
);
</script>

<template>
  <BlockRenderer :blocks="document.blocks" compact />
</template>
