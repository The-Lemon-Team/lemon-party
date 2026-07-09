<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useChatFolders } from '@/composables/useChatFolders';
import { useFoldersModal } from '@/composables/useFoldersModal';
import { useChatsStore } from '@/stores/chats';
import type { Chat } from '@/types';

const chats = useChatsStore();
const route = useRoute();
const { activeFolder, isAllChatsFolder, selectedFolderId } = useChatFolders();
const { openFoldersModal } = useFoldersModal();

const busy = ref(false);
const pinning = ref(false);

type ChatListItem = {
  chat: Chat;
  title: string;
  subtitle: string;
  groupLabel: string | null;
  time: string;
  badge: number;
  pinned: boolean;
  canPin: boolean;
  isChild?: boolean;
  isLastChild?: boolean;
};

const collectionNameById = computed(() => {
  const map = new Map<string, string>();
  for (const collection of chats.collections) {
    map.set(collection.id, collection.name);
  }
  return map;
});

function resolveCollectionName(chat: Chat) {
  if (!chat.collectionId) return null;
  return chat.collection?.name ?? collectionNameById.value.get(chat.collectionId) ?? null;
}

function sortByRecency(a: Chat, b: Chat) {
  const aTs = new Date(a.lastMessageAt ?? a.createdAt ?? 0).getTime();
  const bTs = new Date(b.lastMessageAt ?? b.createdAt ?? 0).getTime();
  return bTs - aTs;
}

const visibleItems = computed<ChatListItem[]>(() => {
  let folderChats = chats.allChats.slice();
  if (!isAllChatsFolder.value) {
    folderChats = folderChats.filter((chat) => chat.collectionId === selectedFolderId.value);
  }

  if (isAllChatsFolder.value) {
    folderChats.sort((a, b) => {
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return sortByRecency(a, b);
    });
  } else {
    folderChats.sort(sortByRecency);
  }

  const folderChatIds = new Set(folderChats.map((c) => c.id));
  const parents = folderChats.filter(
    (c) => !c.parentChatId || !folderChatIds.has(c.parentChatId),
  );

  const childrenMap = new Map<string, Chat[]>();
  for (const c of folderChats) {
    if (c.parentChatId && folderChatIds.has(c.parentChatId)) {
      if (!childrenMap.has(c.parentChatId)) {
        childrenMap.set(c.parentChatId, []);
      }
      childrenMap.get(c.parentChatId)!.push(c);
    }
  }

  function toItem(chat: Chat, isChild = false, isLastChild = false): ChatListItem {
    const collectionName = resolveCollectionName(chat);
    const isGeneral = chat.kind === 'GENERAL';
    const canPin = !chat.collectionId && !chat.parentChatId;
    const badge = 0;
    const groupLabel = isAllChatsFolder.value && collectionName ? collectionName : null;

    return {
      chat,
      title: isGeneral ? 'Saved Messages' : chat.name,
      subtitle: isGeneral
        ? 'личные заметки и черновики'
        : isChild
          ? 'дочерний канал'
          : 'самостоятельный чат',
      groupLabel,
      time: formatChatTime(chat.lastMessageAt ?? chat.createdAt),
      badge,
      pinned: Boolean(chat.isPinned),
      canPin,
      isChild,
      isLastChild,
    };
  }

  const result: ChatListItem[] = [];
  for (const parent of parents) {
    result.push(toItem(parent, false, false));
    const children = childrenMap.get(parent.id) ?? [];
    children.sort(sortByRecency);
    for (let i = 0; i < children.length; i++) {
      const isLast = i === children.length - 1;
      result.push(toItem(children[i], true, isLast));
    }
  }

  return result;
});

function routeForChat(chat: Chat) {
  return chat.kind === 'GENERAL'
    ? { name: 'chat-room', params: { chatId: 'general' } }
    : { name: 'chat-room', params: { chatId: chat.id } };
}

function isChatActive(chat: Chat) {
  if (route.name !== 'chat-room') return false;
  const param = route.params.chatId as string;
  if (chat.kind === 'GENERAL') {
    return param === 'general' || param === chat.id;
  }
  return param === chat.id;
}

async function togglePinned(item: ChatListItem) {
  if (!item.canPin || pinning.value) return;
  pinning.value = true;
  try {
    await chats.setPinned(item.chat.id, !item.pinned);
  } finally {
    pinning.value = false;
  }
}

function formatChatTime(value?: string) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function avatarText(chat: Chat) {
  if (chat.kind === 'GENERAL') return '🔖';
  const first = chat.name.trim().charAt(0).toUpperCase();
  return first || '💬';
}

const showCreateModal = ref(false);
const newChatName = ref('');
const chatNameInput = ref<HTMLInputElement | null>(null);

watch(showCreateModal, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    chatNameInput.value?.focus();
  }
});

function openCreateModal() {
  newChatName.value = '';
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
}

async function submitCreateChat() {
  const name = newChatName.value.trim();
  if (!name) return;
  busy.value = true;
  try {
    const collectionId = isAllChatsFolder.value ? undefined : selectedFolderId.value;
    await chats.createChat(name, collectionId);
    closeCreateModal();
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  chats.load(true);
});
</script>

<template>
  <div class="chats-list-page__content">
    <header class="chats-list-page__header">
      <div>
        <h2 class="chats-list-page__title">{{ activeFolder?.title ?? 'All chats' }}</h2>
        <p class="chats-list-page__subtitle caption">
          {{
            isAllChatsFolder
              ? 'Saved Messages и все чаты'
              : `${visibleItems.length} в группе`
          }}
        </p>
      </div>
      <div class="chats-list-page__actions">
        <button
          v-if="!isAllChatsFolder"
          type="button"
          class="btn-secondary"
          @click="openFoldersModal"
        >
          Папки
        </button>
        <button type="button" class="btn-primary" :disabled="busy" @click="openCreateModal">
          + Чат
        </button>
      </div>
    </header>

    <div class="tg-chat-list">
      <article
        v-for="item in visibleItems"
        :key="item.chat.id"
        class="tg-chat-row"
        :class="{
          'tg-chat-row--pinned': item.pinned,
          'tg-chat-row--active': isChatActive(item.chat),
          'tg-chat-row--child': item.isChild,
          'tg-chat-row--child-last': item.isLastChild,
        }"
      >
        <RouterLink :to="routeForChat(item.chat)" class="tg-chat-row__main">
          <div class="tg-chat-row__avatar">{{ avatarText(item.chat) }}</div>
          <div class="tg-chat-row__body">
            <div class="tg-chat-row__top">
              <h3 class="tg-chat-row__title">{{ item.title }}</h3>
              <time class="tg-chat-row__time">{{ item.time }}</time>
            </div>
            <div class="tg-chat-row__bottom">
              <p class="tg-chat-row__preview">{{ item.subtitle }}</p>
              <span v-if="item.badge > 0" class="tg-chat-row__badge">{{ item.badge }}</span>
            </div>
            <p v-if="item.groupLabel" class="tg-chat-row__folder">{{ item.groupLabel }}</p>
          </div>
        </RouterLink>
        <div v-if="item.canPin && isAllChatsFolder" class="tg-chat-row__actions">
          <button
            type="button"
            class="tg-chat-row__icon-btn"
            :disabled="pinning"
            :title="item.pinned ? 'Открепить чат' : 'Закрепить чат'"
            @click="togglePinned(item)"
          >
            <span class="material-symbols-outlined">
              {{ item.pinned ? 'keep_off' : 'keep' }}
            </span>
          </button>
        </div>
      </article>

      <p v-if="visibleItems.length === 0" class="tg-chat-list__empty">
        {{
          isAllChatsFolder
            ? 'Пока нет чатов'
            : 'В этой группе пока нет чатов'
        }}
      </p>
    </div>

    <!-- Модальное окно создания нового чата -->
    <div v-if="showCreateModal" class="folders-modal">
      <div class="folders-modal__backdrop" @click="closeCreateModal" />

      <section class="folders-modal__dialog" role="dialog" aria-labelledby="create-chat-title">
        <header class="folders-modal__head">
          <h2 id="create-chat-title" class="folders-modal__title">Новый чат</h2>
          <button type="button" class="folders-modal__close" aria-label="Закрыть" @click="closeCreateModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <form @submit.prevent="submitCreateChat" class="folders-modal__body folders-modal__body--edit">
          <label class="folders-modal__field">
            <span class="folders-modal__field-label">Название чата</span>
            <input
              ref="chatNameInput"
              v-model="newChatName"
              type="text"
              class="folders-modal__input"
              placeholder="Например: Любимые книги"
              :disabled="busy"
            />
          </label>

          <div style="display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end;">
            <button type="button" class="btn-secondary" :disabled="busy" @click="closeCreateModal">
              Отмена
            </button>
            <button type="submit" class="btn-primary" :disabled="busy || !newChatName.trim()">
              {{ busy ? 'Создание...' : 'Создать' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
