<script setup lang="ts">
import type { TextEntity } from '@lemon-party/blocks';
import { splitByEntities } from '@lemon-party/blocks';

const props = defineProps<{
  text: string;
  entities?: TextEntity[];
}>();

const segments = () => splitByEntities(props.text, props.entities);
</script>

<template>
  <p class="block-text">
    <template v-for="(segment, index) in segments()" :key="index">
      <a
        v-if="segment.entity?.type === 'url'"
        :href="segment.entity.url || segment.text"
        class="block-text__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ segment.text }}
      </a>
      <code v-else-if="segment.entity?.type === 'code'" class="block-text__code">
        {{ segment.text }}
      </code>
      <strong v-else-if="segment.entity?.type === 'bold'">{{ segment.text }}</strong>
      <em v-else-if="segment.entity?.type === 'italic'">{{ segment.text }}</em>
      <template v-else>{{ segment.text }}</template>
    </template>
  </p>
</template>
