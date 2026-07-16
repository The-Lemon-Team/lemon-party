<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { DESKTOP_SHELL_NAV_ITEMS, isAppNavActive, type AppNavItem } from '@/config/app-nav';
import { useAuthStore } from '@/stores/auth';
import { useChatsStore } from '@/stores/chats';
import { useMoreModal } from '@/composables/useMoreModal';
import type { User } from '@/types';
import ShellRailFolders from '@/components/shell/ShellRailFolders.vue';
import { ALL_CHATS_FOLDER_ID, useChatFolders } from '@/composables/useChatFolders';

defineEmits<{ logout: [] }>();

const auth = useAuthStore();
const chats = useChatsStore();
const route = useRoute();
const router = useRouter();
const { moreModalOpen, openMoreModal } = useMoreModal();
const { selectFolder } = useChatFolders();

const displayName = computed(
  () => auth.user?.name || auth.user?.email?.split('@')[0] || 'Пользователь',
);

function userInitials(user: User | null): string {
  if (user?.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }
  if (user?.email) return user.email.slice(0, 2).toUpperCase();
  return '?';
}

function onFolderSelect() {
  if (route.name === 'chat-room') {
    void router.push({ name: 'chats-list' });
    return;
  }
  if (!route.path.startsWith('/chats')) {
    void router.push({ name: 'chats-list' });
  }
}

function navItemLabel(item: AppNavItem): string {
  return item.to === '/settings' ? 'Ещё' : item.label;
}

function isNavItemActive(item: AppNavItem): boolean {
  if (item.to === '/settings') {
    return moreModalOpen.value || isAppNavActive(item, route);
  }
  return isAppNavActive(item, route);
}

function isMoreNavItem(item: AppNavItem): boolean {
  return item.to === '/settings';
}

function isChatsNavItem(item: AppNavItem): boolean {
  return item.to === '/chats';
}

function onNavClick(item: AppNavItem) {
  if (isChatsNavItem(item)) {
    selectFolder(ALL_CHATS_FOLDER_ID);
  }
}

function navItemTo(item: AppNavItem) {
  return isChatsNavItem(item) ? { name: 'chats-list' } : item.to;
}

onMounted(() => chats.load());
</script>

<template>
  <aside class="shell-rail electron-nav tg-folders-rail" aria-label="Навигация приложения">
    <RouterLink to="/chats" class="shell-rail__brand" title="lemon party">
      <img src="/favicon.svg" alt="" width="32" height="32" />
    </RouterLink>

    <div class="shell-rail__scroll">
      <template v-for="item in DESKTOP_SHELL_NAV_ITEMS" :key="item.to">
        <button
          v-if="isMoreNavItem(item)"
          type="button"
          class="tg-folders-rail__item"
          :class="{ 'tg-folders-rail__item--active': isNavItemActive(item) }"
          :title="item.label"
          @click="openMoreModal"
        >
          <span class="tg-folders-rail__icon tg-folders-rail__icon--all">
            <span
              class="material-symbols-outlined"
              :class="{ 'material-symbols-outlined--filled': isNavItemActive(item) }"
            >
              {{ item.icon }}
            </span>
          </span>
          <span class="tg-folders-rail__label">{{ navItemLabel(item) }}</span>
        </button>
        <RouterLink
          v-else
          :to="navItemTo(item)"
          class="tg-folders-rail__item"
          :class="{ 'tg-folders-rail__item--active': isNavItemActive(item) }"
          :title="item.label"
          @click="onNavClick(item)"
        >
          <span class="tg-folders-rail__icon tg-folders-rail__icon--all">
            <span
              class="material-symbols-outlined"
              :class="{ 'material-symbols-outlined--filled': isNavItemActive(item) }"
            >
              {{ item.icon }}
            </span>
          </span>
          <span class="tg-folders-rail__label">{{ navItemLabel(item) }}</span>
        </RouterLink>
      </template>

      <div class="shell-rail__groups-section" aria-labelledby="shell-rail-groups-label">
        <p id="shell-rail-groups-label" class="shell-rail__section-label">группы</p>
        <div class="shell-rail__section-divider" aria-hidden="true" />
        <ShellRailFolders @select="onFolderSelect" />
      </div>
    </div>

    <div class="shell-rail__footer">
      <div
        class="shell-rail__profile"
        :title="displayName"
        aria-label="Профиль"
      >
        <div class="shell-rail__avatar" aria-hidden="true">
          {{ userInitials(auth.user) }}
        </div>
      </div>
      <button
        type="button"
        class="tg-folders-rail__item shell-rail__logout"
        title="Выйти"
        aria-label="Выйти"
        @click="$emit('logout')"
      >
        <span class="tg-folders-rail__icon tg-folders-rail__icon--all">
          <span class="material-symbols-outlined">logout</span>
        </span>
      </button>
    </div>
  </aside>
</template>
