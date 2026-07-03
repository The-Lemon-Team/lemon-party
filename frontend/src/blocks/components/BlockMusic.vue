<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { MusicDisplay } from '@lemon-party/blocks';
import { youtubeThumbnailUrl, youtubeWatchUrl } from '@lemon-party/blocks';
import type { Tag } from '@/types';
import { tagStyle } from '@/types';
import { resolveTagColor } from '@/utils/tag-colors';

const props = withDefaults(
  defineProps<{
    url: string;
    videoId: string;
    title?: string;
    heading?: string;
    description?: string;
    tag?: string;
    extraTags?: string[];
    userTags?: Tag[];
    display: MusicDisplay;
    size?: 'default' | 'compact';
    editable?: boolean;
  }>(),
  { size: 'compact', tag: 'Музыка', extraTags: () => [], editable: false, userTags: () => [] },
);

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

const fetchedTitle = ref('');
const trackTitle = computed(
  () => props.title || fetchedTitle.value || 'Трек с YouTube',
);
const thumb = computed(() => youtubeThumbnailUrl(props.videoId));
const watchUrl = computed(() => props.url || youtubeWatchUrl(props.videoId));
const isCompact = computed(() => props.size === 'compact');
const tagLabel = computed(() => props.tag || 'Музыка');

onMounted(async () => {
  if (props.title) return;
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl.value)}&format=json`;
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = (await response.json()) as { title?: string };
      if (data.title) fetchedTitle.value = data.title;
    }
  } catch {
    // fallback title
  }
});

function onBodyClick() {
  if (props.editable) emit('edit');
}

function onBodyKeydown(event: KeyboardEvent) {
  if (props.editable && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    emit('edit');
  }
}

function chipStyle(name: string) {
  const color = resolveTagColor(name, props.userTags);
  return {
    color: tagStyle(color).badgeColor,
    background: tagStyle(color).badgeBackground,
  };
}
</script>

<template>
  <div class="block-music-wrap" :class="{ 'block-music-wrap--editable': editable }">
    <p v-if="heading?.trim()" class="block-music-wrap__heading">{{ heading.trim() }}</p>

    <div v-if="extraTags.length" class="block-music-wrap__tags">
      <span
        v-for="tagName in extraTags"
        :key="tagName"
        class="block-music-wrap__tag-chip"
        :style="chipStyle(tagName)"
      >
        #{{ tagName.replace(/^#+/, '') }}
      </span>
    </div>

    <div class="block-music-stack">
      <div v-if="editable" class="block-music__toolbar">
        <button
          type="button"
          class="block-music__toolbar-btn"
          aria-label="Редактировать"
          @click.stop="emit('edit')"
        >
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button
          type="button"
          class="block-music__toolbar-btn block-music__toolbar-btn--danger"
          aria-label="Удалить"
          @click.stop="emit('delete')"
        >
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>

      <span class="block-music__tag">{{ tagLabel }}</span>

      <component
        :is="editable ? 'div' : 'a'"
        v-if="display === 'card'"
        class="block-music block-music--card"
        :class="{ 'block-music--compact': isCompact, 'block-music--editable': editable }"
        :href="editable ? undefined : watchUrl"
        :target="editable ? undefined : '_blank'"
        :rel="editable ? undefined : 'noopener noreferrer'"
        :role="editable ? 'button' : undefined"
        :tabindex="editable ? 0 : undefined"
        @click="editable ? onBodyClick() : undefined"
        @keydown="editable ? onBodyKeydown($event) : undefined"
      >
        <template v-if="isCompact">
          <div class="block-music__mini-cover">
            <img :src="thumb" alt="" class="block-music__mini-thumb" loading="lazy" />
            <span class="block-music__mini-play material-symbols-outlined">play_circle</span>
          </div>
          <div class="block-music__mini-meta">
            <span class="block-music__track-title">{{ trackTitle }}</span>
          </div>
        </template>
        <template v-else>
          <div class="block-music__thumb-wrap">
            <img :src="thumb" alt="" class="block-music__thumb" loading="lazy" />
            <span class="block-music__play material-symbols-outlined">play_circle</span>
          </div>
          <div class="block-music__meta">
            <span class="block-music__track-title">{{ trackTitle }}</span>
            <span class="block-music__host">youtube.com</span>
          </div>
        </template>
      </component>

      <component
        :is="editable ? 'div' : 'a'"
        v-else
        class="block-music block-music--tray"
        :class="{ 'block-music--compact': isCompact, 'block-music--editable': editable }"
        :href="editable ? undefined : watchUrl"
        :target="editable ? undefined : '_blank'"
        :rel="editable ? undefined : 'noopener noreferrer'"
        :role="editable ? 'button' : undefined"
        :tabindex="editable ? 0 : undefined"
        @click="editable ? onBodyClick() : undefined"
        @keydown="editable ? onBodyKeydown($event) : undefined"
      >
        <img :src="thumb" alt="" class="block-music__tray-thumb" loading="lazy" />
        <div class="block-music__tray-body">
          <span class="block-music__tray-title">{{ heading?.trim() || trackTitle }}</span>
          <span v-if="heading?.trim()" class="block-music__tray-sub">{{ trackTitle }}</span>
        </div>
        <span class="block-music__tray-play material-symbols-outlined">play_arrow</span>
      </component>
    </div>

    <p v-if="description?.trim()" class="block-music-wrap__description">{{ description.trim() }}</p>
  </div>
</template>
