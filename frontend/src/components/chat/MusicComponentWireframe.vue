<script setup lang="ts">
import type { MusicDisplay } from '@lemon-party/blocks';

const props = defineProps<{
  variant: MusicDisplay;
  accentColor?: string;
  active?: boolean;
}>();

const accentStyle = () =>
  props.accentColor
    ? {
        '--wire-accent': props.accentColor,
        '--wire-fill': `color-mix(in srgb, ${props.accentColor} 14%, transparent)`,
        '--wire-stroke': `color-mix(in srgb, ${props.accentColor} 55%, var(--color-outline-variant))`,
      }
    : undefined;
</script>

<template>
  <div
    class="music-wireframe"
    :class="[
      `music-wireframe--${variant}`,
      { 'music-wireframe--active': active },
    ]"
    :style="accentStyle()"
    aria-hidden="true"
  >
    <template v-if="variant === 'card'">
      <div class="music-wireframe__card-cover">
        <span class="music-wireframe__play-ring" />
      </div>
      <div class="music-wireframe__card-meta">
        <span class="music-wireframe__line music-wireframe__line--badge" />
        <span class="music-wireframe__line music-wireframe__line--title" />
        <span class="music-wireframe__line music-wireframe__line--sub" />
      </div>
    </template>

    <template v-else>
      <span class="music-wireframe__tray-thumb" />
      <div class="music-wireframe__tray-meta">
        <span class="music-wireframe__line music-wireframe__line--badge" />
        <span class="music-wireframe__line music-wireframe__line--title" />
      </div>
      <span class="music-wireframe__tray-play" />
    </template>
  </div>
</template>
