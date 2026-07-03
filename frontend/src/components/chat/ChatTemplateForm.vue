<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  extractYoutubeVideoId,
  youtubeThumbnailUrl,
} from '@lemon-party/blocks';
import type { ContentTemplate } from '@/constants/content-templates';
import { buildMessageFromTemplate } from '@/utils/build-template-message';

const props = defineProps<{
  template: ContentTemplate | null;
}>();

const emit = defineEmits<{
  apply: [text: string];
  applyLink: [data: { url: string; note: string }];
  close: [];
}>();

const url = ref('');
const title = ref('');
const note = ref('');
const formError = ref('');

const videoId = computed(() =>
  props.template?.form === 'youtube' ? extractYoutubeVideoId(url.value) : null,
);

const previewThumb = computed(() =>
  videoId.value ? youtubeThumbnailUrl(videoId.value) : '',
);

watch(
  () => props.template?.id,
  () => {
    url.value = '';
    title.value = '';
    note.value = '';
    formError.value = '';
  },
);

function submit() {
  if (!props.template) return;
  formError.value = '';

  if (props.template.form === 'youtube' && !videoId.value) {
    formError.value = 'Укажите корректную ссылку YouTube';
    return;
  }

  if (props.template.form === 'link' && !url.value.trim()) {
    formError.value = 'Укажите ссылку';
    return;
  }

  try {
    const text = buildMessageFromTemplate(props.template, {
      url: url.value,
      title: title.value,
      note: note.value,
    });
    if (props.template.form === 'link') {
      emit('applyLink', {
        url: url.value.trim(),
        note: note.value.trim() || title.value.trim(),
      });
    } else {
      emit('apply', text);
    }
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Не удалось собрать сообщение';
  }
}
</script>

<template>
  <div v-if="template" class="template-form">
    <div class="template-form__head">
      <div>
        <h3 class="template-form__title">{{ template.title }}</h3>
        <p class="template-form__hint">{{ template.hint }}</p>
      </div>
      <button type="button" class="template-form__close" aria-label="Закрыть" @click="emit('close')">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <label v-if="template.form === 'youtube'" class="template-form__field">
      <span class="template-form__label">
        <span class="material-symbols-outlined template-form__yt-icon">play_circle</span>
        Ссылка с YouTube
      </span>
      <input
        v-model="url"
        type="url"
        :placeholder="template.urlPlaceholder"
        class="template-form__input"
      />
    </label>

    <label v-else class="template-form__field">
      <span class="template-form__label">Ссылка</span>
      <input
        v-model="url"
        type="url"
        :placeholder="template.urlPlaceholder"
        class="template-form__input"
      />
    </label>

    <label class="template-form__field">
      <span class="template-form__label">
        {{ template.form === 'youtube' ? 'Название (необязательно)' : 'Заметка (необязательно)' }}
      </span>
      <input
        v-model="title"
        type="text"
        :placeholder="template.form === 'youtube' ? 'Jazz-hop для работы' : ''"
        class="template-form__input"
      />
    </label>

    <label class="template-form__field">
      <span class="template-form__label">Комментарий (необязательно)</span>
      <input
        v-model="note"
        type="text"
        placeholder="Почему сохранили"
        class="template-form__input"
      />
    </label>

    <div v-if="previewThumb" class="template-form__preview">
      <p class="template-form__preview-label">Превью в чате</p>
      <div class="block-youtube block-youtube--preview">
        <div class="block-youtube__thumb-wrap">
          <img :src="previewThumb" alt="" class="block-youtube__thumb" />
          <span class="block-youtube__play material-symbols-outlined">play_circle</span>
        </div>
        <div class="block-youtube__meta">
          <span class="block-youtube__badge">YouTube</span>
          <span class="block-youtube__title">{{ title || 'Видео с YouTube' }}</span>
        </div>
      </div>
    </div>

    <p v-if="formError" class="error">{{ formError }}</p>

    <button type="button" class="btn-primary template-form__submit" @click="submit">
      Вставить в сообщение
    </button>
  </div>
</template>
