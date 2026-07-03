<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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

const chatItems = computed<ChatListItem[]>(() => {
  const all = chats.allChats.slice();
  if (isAllChatsFolder.value) {
    all.sort((a, b) => {
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return sortByRecency(a, b);
    });
  } else {
    all.sort(sortByRecency);
  }

  const childCountByParent = new Map<string, number>();
  for (const item of all) {
    if (!item.parentChatId) continue;
    childCountByParent.set(
      item.parentChatId,
      (childCountByParent.get(item.parentChatId) ?? 0) + 1,
    );
  }

  return all.map((chat) => {
    const collectionName = resolveCollectionName(chat);
    const isGeneral = chat.kind === 'GENERAL';
    const isChild = Boolean(chat.parentChatId);
    const canPin = !chat.collectionId && !chat.parentChatId;
    const childCount = childCountByParent.get(chat.id) ?? 0;
    const badge = childCount > 0 ? childCount : 0;
    const groupLabel =
      isAllChatsFolder.value && collectionName ? collectionName : null;

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
    };
  });
});

const visibleItems = computed(() => {
  if (isAllChatsFolder.value) return chatItems.value;
  return chatItems.value.filter((item) => item.chat.collectionId === selectedFolderId.value);
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

async function createChat() {
  const name = window.prompt('Название чата');
  if (!name?.trim()) return;
  busy.value = true;
  try {
    const collectionId = isAllChatsFolder.value ? undefined : selectedFolderId.value;
    await chats.createChat(name.trim(), collectionId);
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
        <button type="button" class="btn-primary" :disabled="busy" @click="createChat">
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
              <span v-if="item.groupLabel" class="tg-chat-row__folder">{{ item.groupLabel }}</span>
              <span v-if="item.badge > 0" class="tg-chat-row__badge">{{ item.badge }}</span>
            </div>
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
  </div>
</template>
