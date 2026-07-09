<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import {
  extractYoutubeVideoId,
  youtubeWatchUrl,
  type MusicDisplay,
} from '@lemon-party/blocks';
import {
  formatTemplateTagLabel,
  type ContentTemplate,
} from '@/constants/content-templates';
import type { MusicBlockFormPayload } from '@/composables/music-block-editor';
import MusicBlockPreviewSlot from './MusicBlockPreviewSlot.vue';
import MusicBlockTagPicker from './MusicBlockTagPicker.vue';
import MusicComponentWireframe from './MusicComponentWireframe.vue';
import type { Tag } from '@/types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    template: ContentTemplate | null;
    mode?: 'create' | 'edit';
    initial?: MusicBlockFormPayload | null;
    userTags?: Tag[];
  }>(),
  { mode: 'create', initial: null, userTags: () => [] },
);

const emit = defineEmits<{
  close: [];
  insert: [payload: MusicBlockFormPayload];
  save: [payload: MusicBlockFormPayload];
}>();

const isEditMode = computed(() => props.mode === 'edit');

const url = ref('');
const heading = ref('');
const description = ref('');
const display = ref<MusicDisplay>('card');
const extraTags = ref<string[]>([]);
const formError = ref('');
const fetchedTrackTitle = ref('');
const fetchingTitle = ref(false);

const videoId = computed(() => extractYoutubeVideoId(url.value));
const previewUrl = computed(() =>
  videoId.value ? youtubeWatchUrl(videoId.value) : '',
);
const cardTag = computed(() => {
  if (isEditMode.value && props.initial?.tag) return props.initial.tag;
  return formatTemplateTagLabel(props.template?.chipLabel ?? 'музыка');
});

const componentOptions: { id: MusicDisplay; label: string; hint: string }[] = [
  { id: 'card', label: 'Карточка', hint: 'Обложка сверху и текст снизу — как пост' },
  { id: 'tray', label: 'Трей', hint: 'Горизонтальная полоска плеера' },
];

watch(
  () => [props.open, props.mode, props.initial] as const,
  ([isOpen, mode, initial]) => {
    if (!isOpen) return;
    formError.value = '';

    if (mode === 'edit' && initial) {
      url.value = initial.url;
      heading.value = initial.heading ?? '';
      description.value = initial.description ?? '';
      display.value = initial.display;
      fetchedTrackTitle.value = initial.title ?? '';
      extraTags.value = [...(initial.extraTags ?? [])];
      return;
    }

    url.value = '';
    heading.value = '';
    description.value = '';
    display.value = 'card';
    fetchedTrackTitle.value = '';
    extraTags.value = [];
  },
);

watch(videoId, async (id) => {
  fetchedTrackTitle.value = '';
  if (!id) return;

  fetchingTitle.value = true;
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeWatchUrl(id))}&format=json`;
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = (await response.json()) as { title?: string };
      if (data.title) fetchedTrackTitle.value = data.title;
    }
  } catch {
    // ignore
  } finally {
    fetchingTitle.value = false;
  }
});

function close() {
  emit('close');
}



function buildPayload(): MusicBlockFormPayload {
  const template = props.template!;
  return {
    url: previewUrl.value,
    videoId: videoId.value!,
    title: fetchedTrackTitle.value.trim() || undefined,
    heading: heading.value.trim() || undefined,
    description: description.value.trim() || undefined,
    tag: cardTag.value,
    contentTypeId: isEditMode.value && props.initial?.contentTypeId
      ? props.initial.contentTypeId
      : template.contentTypeId,
    extraTags: extraTags.value.length ? [...extraTags.value] : undefined,
    display: display.value,
  };
}

function submit() {
  if (!props.template) return;
  formError.value = '';

  if (!videoId.value) {
    formError.value = 'Укажите корректную ссылку YouTube';
    return;
  }

  const payload = buildPayload();
  if (isEditMode.value) emit('save', payload);
  else emit('insert', payload);
  close();
}
</script>

<template>
  <BaseModal
    :open="open && !!template"
    teleport-to="body"
    modal-class="music-modal"
    dialog-class="music-modal__dialog music-modal__dialog--constructor"
    :has-backdrop="false"
    @close="close"
  >
    <template v-if="template">
        <header class="music-modal__head">
          <div>
            <p class="music-modal__eyebrow">
              {{ isEditMode ? 'Редактирование блока' : 'Конструктор блока' }}
            </p>
            <h3 class="music-modal__title">{{ template.title }}</h3>
            <p class="music-modal__hint">{{ template.hint }}</p>
          </div>
          <button type="button" class="music-modal__close" aria-label="Закрыть" @click="close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <section class="music-modal__controls">
          <div class="music-modal__step">
            <span class="music-modal__step-label">1. Заголовок</span>
            <label class="music-modal__field">
              <span class="music-modal__label">Заголовок карточки</span>
              <input
                v-model="heading"
                type="text"
                placeholder="Jazz-hop для работы"
                class="music-modal__input"
              />
              <span class="music-modal__field-hint">
                Отображается над карточкой. Тип контента: {{ cardTag }}.
              </span>
            </label>

            <MusicBlockTagPicker
              v-model="extraTags"
              :user-tags="userTags"
            />
          </div>

          <div class="music-modal__step">
            <span class="music-modal__step-label">2. Компонент</span>
            <div class="music-modal__components" role="radiogroup" aria-label="Вид блока музыки">
              <button
                v-for="option in componentOptions"
                :key="option.id"
                type="button"
                class="music-modal__component"
                :class="{ 'music-modal__component--active': display === option.id }"
                :style="{ '--chip-accent': template.color }"
                :aria-pressed="display === option.id"
                @click="display = option.id"
              >
                <div class="music-modal__component-wire">
                  <MusicComponentWireframe
                    :variant="option.id"
                    :accent-color="template.color"
                    :active="display === option.id"
                  />
                </div>
                <div class="music-modal__component-meta">
                  <strong>{{ option.label }}</strong>
                  <span>{{ option.hint }}</span>
                </div>
              </button>
            </div>

            <label class="music-modal__field music-modal__field--spaced">
              <span class="music-modal__label">
                <span class="material-symbols-outlined music-modal__yt-icon">play_circle</span>
                Ссылка с YouTube
              </span>
              <input
                v-model="url"
                type="url"
                :placeholder="template.urlPlaceholder"
                class="music-modal__input"
              />
              <span v-if="fetchingTitle" class="music-modal__field-hint">Подтягиваю название трека…</span>
              <span v-else-if="fetchedTrackTitle" class="music-modal__field-hint">
                Трек: {{ fetchedTrackTitle }}
              </span>
            </label>

            <div class="music-modal__result">
              <span class="music-modal__result-label">Результат</span>
              <MusicBlockPreviewSlot
                :display="display"
                :accent-color="template.color"
                :video-id="videoId || undefined"
                :url="previewUrl"
                :track-title="fetchedTrackTitle || undefined"
                :heading="heading || undefined"
                :description="description || undefined"
                :tag="cardTag"
                :extra-tags="extraTags"
                :user-tags="userTags"
              />
            </div>
          </div>

          <div class="music-modal__step">
            <span class="music-modal__step-label">3. Описание</span>
            <label class="music-modal__field">
              <span class="music-modal__label">Описание карточки (необязательно)</span>
              <textarea
                v-model="description"
                rows="2"
                placeholder="Почему сохранили, заметки…"
                class="music-modal__input music-modal__textarea"
              />
            </label>
          </div>

          <p v-if="formError" class="error">{{ formError }}</p>

          <button
            type="button"
            class="btn-primary music-modal__submit"
            :disabled="!videoId"
            @click="submit"
          >
            {{ isEditMode ? 'Сохранить' : 'Вставить в сообщение' }}
          </button>
        </section>
    </template>
  </BaseModal>
</template>
