<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { chatsApi } from '@/api/chats';
import { useChatsStore } from '@/stores/chats';
import type { Chat, ChatContentSummary } from '@/types';
import BaseModal from '@/components/BaseModal.vue';
import {
  CONTENT_TYPES,
  type ContentTypeDefinition,
} from '@/utils/chat-content-types';

const props = defineProps<{
  open: boolean;
  chat: Chat | null;
  contentSummary: ChatContentSummary | null;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
  openSettings: [];
}>();

const chats = useChatsStore();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const selectedParentId = ref<string>('');
const newGroupName = ref('');

const isGeneral = computed(() => props.chat?.kind === 'GENERAL');
const relationHint = computed(() =>
  isGeneral.value
    ? 'Для general группа недоступна'
    : 'Можно связать с любым regular-чатом, кроме текущего и general.',
);

const candidates = computed(() => {
  if (!props.chat) return [];
  return chats.allChats.filter(
    (item) =>
      item.id !== props.chat!.id &&
      item.kind !== 'GENERAL' &&
      item.id !== props.chat!.parentChatId,
  );
});

const currentParentName = computed(() => props.chat?.parentChat?.name ?? 'Не связана');

const contentStats = computed<Array<ContentTypeDefinition & { count: number }>>(() =>
  CONTENT_TYPES.map((type) => ({
    ...type,
    count:
      props.contentSummary?.types.find((item) => item.id === type.id)?.count ?? 0,
  })),
);
const totalMessages = computed(() => props.contentSummary?.totalMessages ?? 0);

async function loadData() {
  if (!props.open) return;
  loading.value = true;
  error.value = '';
  try {
    await chats.load(true);
    selectedParentId.value = props.chat?.parentChatId ?? '';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить меню';
  } finally {
    loading.value = false;
  }
}

async function saveParent() {
  if (!props.chat || isGeneral.value) return;
  saving.value = true;
  error.value = '';
  try {
    await chatsApi.setParent(props.chat.id, selectedParentId.value || null);
    await chats.load(true);
    emit('updated');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось сохранить связь';
  } finally {
    saving.value = false;
  }
}

async function createGroupAndLink() {
  if (!props.chat || isGeneral.value) return;
  const name = newGroupName.value.trim();
  if (!name) return;

  saving.value = true;
  error.value = '';
  try {
    const created = await chats.createChat(name);
    await chatsApi.setParent(props.chat.id, created.id);
    newGroupName.value = '';
    await chats.load(true);
    selectedParentId.value = created.id;
    emit('updated');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось создать группу';
  } finally {
    saving.value = false;
  }
}



watch(
  () => [props.open, props.chat?.id] as const,
  ([open]) => {
    if (open) {
      loadData();
    }
  },
);

onMounted(() => {
  if (props.open) loadData();
});
</script>

<template>
  <BaseModal
    :open="open && !!chat"
    :teleport="false"
    modal-class="chat-header-menu"
    backdrop-class="chat-header-menu__backdrop"
    dialog-class="chat-header-menu__dialog"
    aria-labelledby="chat-header-menu-title"
    @close="emit('close')"
  >
    <template v-if="chat">
      <header class="chat-header-menu__head">
        <div>
          <p class="chat-header-menu__eyebrow">Инфо чата</p>
          <h2 id="chat-header-menu-title" class="chat-header-menu__title">{{ chat.name }}</h2>
        </div>
        <button type="button" class="chat-header-menu__close" @click="emit('close')">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <div class="chat-header-menu__body">
        <section class="chat-header-menu__section">
          <div class="chat-header-menu__quick-actions">
            <button type="button" class="chat-header-menu__quick-btn" @click="emit('openSettings')">
              <span class="material-symbols-outlined">tune</span>
              Настройки
            </button>
          </div>
        </section>

        <section class="chat-header-menu__section">
          <h3 class="chat-header-menu__section-title">Связь с группой</h3>
          <p class="caption">Текущая: <strong>{{ currentParentName }}</strong></p>
          <p class="caption">{{ relationHint }}</p>

          <div v-if="loading" class="caption">Загрузка…</div>

          <template v-else>
            <label class="chat-header-menu__field">
              <span class="chat-header-menu__label">Группа</span>
              <select
                v-model="selectedParentId"
                class="chat-header-menu__input"
                :disabled="saving || isGeneral"
              >
                <option value="">Не связана</option>
                <option v-for="item in candidates" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
            </label>

            <button
              type="button"
              class="btn-secondary"
              :disabled="saving || isGeneral"
              @click="saveParent"
            >
              Сохранить связь
            </button>
          </template>
        </section>

        <section class="chat-header-menu__section">
          <h3 class="chat-header-menu__section-title">Добавить группу</h3>
          <p class="caption">Создастся новый чат-группа и текущий чат будет привязан к нему.</p>
          <div class="chat-header-menu__inline-form">
            <input
              v-model="newGroupName"
              type="text"
              class="chat-header-menu__input"
              placeholder="Например: Видео канал"
              :disabled="saving || isGeneral"
            />
            <button
              type="button"
              class="btn-primary"
              :disabled="saving || isGeneral || !newGroupName.trim()"
              @click="createGroupAndLink"
            >
              Создать
            </button>
          </div>
        </section>

        <section class="chat-header-menu__section">
          <h3 class="chat-header-menu__section-title">Типы контента</h3>
          <div class="chat-header-menu__stats-grid">
            <article class="chat-header-menu__stat-card">
              <span class="material-symbols-outlined">chat</span>
              <span>Сообщения</span>
              <strong>{{ totalMessages }}</strong>
            </article>
            <article
              v-for="item in contentStats"
              :key="item.id"
              class="chat-header-menu__stat-card"
            >
              <span class="material-symbols-outlined">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </article>
          </div>
        </section>

        <p v-if="error" class="chat-header-menu__error">{{ error }}</p>
      </div>
    </template>
  </BaseModal>
</template>
