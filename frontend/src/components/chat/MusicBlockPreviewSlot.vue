<script setup lang="ts">
import { computed } from 'vue';
import type { MusicDisplay } from '@lemon-party/blocks';
import BlockMusic from '@/blocks/components/BlockMusic.vue';
import type { Tag } from '@/types';
import MusicComponentWireframe from './MusicComponentWireframe.vue';

const props = defineProps<{
  display: MusicDisplay;
  accentColor?: string;
  videoId?: string;
  url?: string;
  trackTitle?: string;
  heading?: string;
  description?: string;
  tag?: string;
  extraTags?: string[];
  userTags?: Tag[];
}>();

const hasMedia = computed(() => Boolean(props.videoId));
</script>

<template>
  <div
    class="music-preview-slot"
    :class="`music-preview-slot--${display}`"
    :style="accentColor ? { '--preview-accent': accentColor } : undefined"
  >
    <BlockMusic
      v-if="hasMedia"
      :url="url || ''"
      :video-id="videoId || ''"
      :title="trackTitle"
      :heading="heading"
      :description="description"
      :tag="tag"
      :extra-tags="extraTags"
      :user-tags="userTags"
      :display="display"
      size="compact"
      class="music-preview-slot__component"
    />
    <MusicComponentWireframe
      v-else
      :variant="display"
      :accent-color="accentColor"
      active
      class="music-preview-slot__wireframe"
    />
  </div>
</template>
