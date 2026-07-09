<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useChatsStore } from '@/stores/chats';
import type { Chat } from '@/types';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{
  open: boolean;
  excludeChatId?: string | null;
}>();

const emit = defineEmits<{
  close: [];
  forward: [chatId: string];
}>();

const chats = useChatsStore();
const loading = ref(false);
const error = ref('');
const selectedChatId = ref<string | null>(null);

const chatOptions = computed(() =>
  chats.allChats.filter((chat) => chat.id !== props.excludeChatId),
);

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;

    selectedChatId.value = null;
    error.value = '';
    loading.value = true;

    try {
      await chats.load(true);
      const first = chatOptions.value[0];
      if (first) selectedChatId.value = first.id;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось загрузить чаты';
    } finally {
      loading.value = false;
    }
  },
);

function close() {
  emit('close');
}

function submit() {
  if (!selectedChatId.value) {
    error.value = 'Выберите чат';
    return;
  }
  emit('forward', selectedChatId.value);
}

function chatLabel(chat: Chat) {
  if (chat.kind === 'GENERAL') return 'general';
  return chat.name;
}

function chatIcon(chat: Chat) {
  if (chat.kind === 'GENERAL') return '🔖';
  return chat.name.charAt(0).toUpperCase() || '💬';
}
</script>

<template>
  <BaseModal
    :open="open"
    teleport-to="body"
    modal-class="forward-modal"
    dialog-class="forward-modal__dialog"
    :has-backdrop="false"
    aria-labelledby="forward-modal-title"
    @close="close"
  >
        <header class="forward-modal__head">
          <div>
            <p class="forward-modal__eyebrow">Пересылка</p>
            <h3 id="forward-modal-title" class="forward-modal__title">Выберите чат</h3>
            <p class="forward-modal__hint">Сообщение будет скопировано в выбранный чат</p>
          </div>
          <button type="button" class="forward-modal__close" aria-label="Закрыть" @click="close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div v-if="loading" class="forward-modal__state">
          <span class="material-symbols-outlined spin">progress_activity</span>
          <p class="caption">Загружаем чаты…</p>
        </div>

        <section v-else class="forward-modal__body">
          <ul v-if="chatOptions.length > 0" class="forward-modal__list">
            <li v-for="chat in chatOptions" :key="chat.id">
              <button
                type="button"
                class="forward-modal__chat"
                :class="{ 'forward-modal__chat--active': selectedChatId === chat.id }"
                @click="selectedChatId = chat.id"
              >
                <span class="forward-modal__chat-avatar" aria-hidden="true">{{ chatIcon(chat) }}</span>
                <span class="forward-modal__chat-name">{{ chatLabel(chat) }}</span>
                <span
                  v-if="selectedChatId === chat.id"
                  class="material-symbols-outlined forward-modal__chat-check"
                >
                  check_circle
                </span>
              </button>
            </li>
          </ul>

          <p v-else class="forward-modal__state">Нет доступных чатов</p>
          <p v-if="error" class="forward-modal__error">{{ error }}</p>
        </section>

        <footer class="forward-modal__footer">
          <button type="button" class="forward-modal__cancel" @click="close">Отмена</button>
          <button
            type="button"
            class="forward-modal__submit"
            :disabled="!selectedChatId || loading"
            @click="submit"
          >
            Отправить
          </button>
        </footer>
  </BaseModal>
</template>
