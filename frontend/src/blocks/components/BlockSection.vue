<script setup lang="ts">
import type { ContentBlock } from '@lemon-party/blocks';
import BlockRenderer from './BlockRenderer.vue';

defineProps<{
  tag: string;
  tagColor?: string;
  children: ContentBlock[];
  compact?: boolean;
}>();
</script>

<template>
  <div class="block-section">
    <span
      class="block-section__tag"
      :style="tagColor ? { color: tagColor } : undefined"
    >
      {{ tag }}
    </span>
    <BlockRenderer :blocks="children" :compact="compact" />
  </div>
</template>
