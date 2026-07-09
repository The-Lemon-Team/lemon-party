<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useChatFolders } from '@/composables/useChatFolders';
import { useChatsStore } from '@/stores/chats';
import type { ChatCollection } from '@/types';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  close: [];
  created: [collectionId: string];
}>();

type View = 'list' | 'edit' | 'add-chats';

const chats = useChatsStore();
const { selectFolder } = useChatFolders();

const view = ref<View>('list');
const busy = ref(false);
const error = ref('');
const isCreating = ref(false);
const editingCollection = ref<ChatCollection | null>(null);
const draftName = ref('');
const draftChatIds = ref<string[]>([]);

const isFormView = computed(() => view.value === 'edit' || view.value === 'add-chats');
const formTitle = computed(() => (isCreating.value ? 'Новая папка' : 'Редактировать папку'));
const saveButtonLabel = computed(() => (isCreating.value ? 'Создать' : 'Сохранить'));

const folderRows = computed(() =>
  chats.collections.map((collection) => ({
    collection,
    id: collection.id,
    name: collection.name,
    count: collection.chats?.length ?? 0,
    color: folderColor(collection.name),
    initial: collectionInitial(collection.name),
  })),
);

const includedChats = computed(() => {
  const byId = new Map(chats.allChats.map((chat) => [chat.id, chat]));
  return draftChatIds.value
    .map((id) => byId.get(id))
    .filter((chat): chat is NonNullable<typeof chat> => Boolean(chat));
});

const addableChats = computed(() =>
  chats.allChats.filter(
    (chat) =>
      chat.kind !== 'GENERAL' && !draftChatIds.value.includes(chat.id),
  ),
);

const isDirty = computed(() => {
  if (isCreating.value) {
    return draftName.value.trim() !== '' || draftChatIds.value.length > 0;
  }
  if (!editingCollection.value) return false;
  const originalIds = (editingCollection.value.chats ?? []).map((chat) => chat.id).sort();
  const nextIds = [...draftChatIds.value].sort();
  return (
    draftName.value.trim() !== editingCollection.value.name ||
    originalIds.length !== nextIds.length ||
    originalIds.some((id, index) => id !== nextIds[index])
  );
});

function collectionInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function folderColor(name: string) {
  const colors = ['#5b8def', '#e85d75', '#45b7a8', '#f0a030', '#9b7cf8', '#22c55e', '#f472b6'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function chatCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} чат`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} чата`;
  }
  return `${count} чатов`;
}

function avatarText(name: string) {
  const first = name.trim().charAt(0).toUpperCase();
  return first || '💬';
}

function resetState() {
  view.value = 'list';
  isCreating.value = false;
  editingCollection.value = null;
  draftName.value = '';
  draftChatIds.value = [];
  error.value = '';
}

function openCreate() {
  isCreating.value = true;
  editingCollection.value = null;
  draftName.value = '';
  draftChatIds.value = [];
  view.value = 'edit';
  error.value = '';
}

function openEdit(collection: ChatCollection) {
  isCreating.value = false;
  editingCollection.value = collection;
  draftName.value = collection.name;
  draftChatIds.value = (collection.chats ?? []).map((chat) => chat.id);
  view.value = 'edit';
  error.value = '';
}

async function loadData() {
  busy.value = true;
  error.value = '';
  try {
    await chats.load(true);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить папки';
  } finally {
    busy.value = false;
  }
}

function createFolder() {
  openCreate();
}

async function deleteFolder(collectionId: string, name: string) {
  if (!window.confirm(`Удалить папку «${name}»? Чаты из неё останутся в общем списке.`)) {
    return;
  }

  busy.value = true;
  error.value = '';
  try {
    await chats.deleteCollection(collectionId);
    await chats.load(true);
    if (editingCollection.value?.id === collectionId) {
      view.value = 'list';
      editingCollection.value = null;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить папку';
  } finally {
    busy.value = false;
  }
}

function removeChat(chatId: string) {
  draftChatIds.value = draftChatIds.value.filter((id) => id !== chatId);
}

function addChat(chatId: string) {
  if (draftChatIds.value.includes(chatId)) return;
  draftChatIds.value = [...draftChatIds.value, chatId];
}

function openAddChats() {
  view.value = 'add-chats';
}

function backFromEdit() {
  if (isDirty.value) {
    const leave = window.confirm('Есть несохранённые изменения. Закрыть без сохранения?');
    if (!leave) return;
  }
  resetState();
}

function backFromAddChats() {
  view.value = 'edit';
}

async function saveFolder() {
  const name = draftName.value.trim();
  if (!name) {
    error.value = 'Введите название папки';
    return;
  }

  busy.value = true;
  error.value = '';
  try {
    if (isCreating.value) {
      const collection = await chats.createCollection(name);
      if (draftChatIds.value.length > 0) {
        await chats.syncCollectionChats(collection.id, draftChatIds.value);
      }
      await chats.load(true);
      selectFolder(collection.id);
      emit('created', collection.id);
      resetState();
      return;
    }

    if (!editingCollection.value) return;

    if (name !== editingCollection.value.name) {
      await chats.updateCollection(editingCollection.value.id, name);
    }
    await chats.syncCollectionChats(editingCollection.value.id, draftChatIds.value);
    await chats.load(true);
    resetState();
  } catch (e) {
    error.value = e instanceof Error
      ? e.message
      : isCreating.value
        ? 'Не удалось создать папку'
        : 'Не удалось сохранить папку';
  } finally {
    busy.value = false;
  }
}

function closeModal() {
  if (isFormView.value && isDirty.value) {
    const leave = window.confirm('Есть несохранённые изменения. Закрыть без сохранения?');
    if (!leave) return;
  }
  resetState();
  emit('close');
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetState();
      loadData();
    }
  },
);
</script>

<template>
  <BaseModal
    :open="open"
    :teleport="false"
    modal-class="folders-modal"
    backdrop-class="folders-modal__backdrop"
    dialog-class="folders-modal__dialog"
    :aria-labelledby="view === 'list' ? 'folders-modal-title' : 'folder-form-title'"
    @close="closeModal"
  >
      <template v-if="view === 'list'">
        <header class="folders-modal__head">
          <h2 id="folders-modal-title" class="folders-modal__title">Папки</h2>
          <button type="button" class="folders-modal__close" aria-label="Закрыть" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div class="folders-modal__intro">
          <div class="folders-modal__intro-icon" aria-hidden="true">📁</div>
          <p class="folders-modal__intro-text">
            Создавайте папки для разных групп чатов и быстро переключайтесь между ними.
          </p>
        </div>

        <div class="folders-modal__body">
          <p class="folders-modal__section-label">Мои папки</p>

          <div v-if="busy && folderRows.length === 0" class="folders-modal__state">Загрузка…</div>

          <ul v-else-if="folderRows.length > 0" class="folders-modal__list">
            <li v-for="folder in folderRows" :key="folder.id" class="folders-modal__row">
              <button
                type="button"
                class="folders-modal__row-main"
                @click="openEdit(folder.collection)"
              >
                <span
                  class="folders-modal__row-icon"
                  :style="{ background: folder.color }"
                >
                  {{ folder.initial }}
                </span>
                <span class="folders-modal__row-text">
                  <span class="folders-modal__row-name">{{ folder.name }}</span>
                  <span class="folders-modal__row-meta">{{ chatCountLabel(folder.count) }}</span>
                </span>
              </button>
              <button
                type="button"
                class="folders-modal__row-delete"
                aria-label="Удалить папку"
                :disabled="busy"
                @click.stop="deleteFolder(folder.id, folder.name)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </li>
          </ul>

          <p v-else class="folders-modal__state">Пока нет папок</p>

          <button type="button" class="folders-modal__create" :disabled="busy" @click="createFolder">
            <span class="material-symbols-outlined">add</span>
            Создать папку
          </button>

          <p v-if="error" class="folders-modal__error">{{ error }}</p>
        </div>
      </template>

      <template v-else-if="view === 'edit'">
        <header class="folders-modal__head">
          <h2 id="folder-form-title" class="folders-modal__title">{{ formTitle }}</h2>
          <button type="button" class="folders-modal__close" aria-label="Закрыть" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div class="folders-modal__body folders-modal__body--edit">
          <label class="folders-modal__field">
            <span class="folders-modal__field-label">Название папки</span>
            <input
              v-model="draftName"
              type="text"
              class="folders-modal__input"
              placeholder="Например: Работа"
              :disabled="busy"
              autofocus
            />
          </label>

          <div class="folders-modal__included">
            <p class="folders-modal__section-label">Включённые чаты</p>

            <button type="button" class="folders-modal__add-chats" :disabled="busy" @click="openAddChats">
              <span class="folders-modal__add-chats-icon">
                <span class="material-symbols-outlined">add</span>
              </span>
              Добавить чаты
            </button>

            <p class="folders-modal__hint">
              Выберите чаты, которые будут отображаться в этой папке.
            </p>

            <ul v-if="includedChats.length > 0" class="folders-modal__chat-list">
              <li v-for="chat in includedChats" :key="chat.id" class="folders-modal__chat-row">
                <span class="folders-modal__chat-avatar">{{ avatarText(chat.name) }}</span>
                <span class="folders-modal__chat-name">{{ chat.name }}</span>
                <button
                  type="button"
                  class="folders-modal__chat-remove"
                  aria-label="Убрать из папки"
                  :disabled="busy"
                  @click="removeChat(chat.id)"
                >
                  <span class="material-symbols-outlined">close</span>
                </button>
              </li>
            </ul>
          </div>

          <p v-if="error" class="folders-modal__error">{{ error }}</p>
        </div>

        <footer class="folders-modal__footer">
          <button type="button" class="folders-modal__footer-btn" :disabled="busy" @click="backFromEdit">
            Отмена
          </button>
          <button
            type="button"
            class="folders-modal__footer-btn folders-modal__footer-btn--primary"
            :disabled="busy || !draftName.trim()"
            @click="saveFolder"
          >
            {{ saveButtonLabel }}
          </button>
        </footer>
      </template>

      <template v-else-if="view === 'add-chats'">
        <header class="folders-modal__head">
          <button type="button" class="folders-modal__back" aria-label="Назад" @click="backFromAddChats">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 class="folders-modal__title">Добавить чаты</h2>
          <button type="button" class="folders-modal__close" aria-label="Закрыть" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div class="folders-modal__body">
          <ul v-if="addableChats.length > 0" class="folders-modal__chat-list">
            <li v-for="chat in addableChats" :key="chat.id">
              <button type="button" class="folders-modal__pick-row" @click="addChat(chat.id)">
                <span class="folders-modal__chat-avatar">{{ avatarText(chat.name) }}</span>
                <span class="folders-modal__pick-text">
                  <span class="folders-modal__chat-name">{{ chat.name }}</span>
                  <span v-if="chat.collection?.name" class="folders-modal__pick-meta">
                    {{ chat.collection.name }}
                  </span>
                </span>
                <span class="material-symbols-outlined folders-modal__pick-add">add</span>
              </button>
            </li>
          </ul>
          <p v-else class="folders-modal__state">Нет доступных чатов</p>
        </div>

        <footer class="folders-modal__footer">
          <button type="button" class="folders-modal__footer-btn folders-modal__footer-btn--primary" @click="backFromAddChats">
            Готово
          </button>
        </footer>
      </template>
  </BaseModal>
</template>
