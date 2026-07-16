<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useMoreModal } from '@/composables/useMoreModal';
import { ALL_CHATS_FOLDER_ID, useChatFolders } from '@/composables/useChatFolders';

const auth = useAuthStore();
const settings = useSettingsStore();
const { openMoreModal } = useMoreModal();
const { selectFolder } = useChatFolders();

function onChatsClick() {
  selectFolder(ALL_CHATS_FOLDER_ID);
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="header-leading">
        <RouterLink :to="settings.logoRoute" class="brand">
          <img src="/favicon.svg" alt="" class="brand-icon brand-icon--img" width="28" height="28" />
          <h1 class="brand-title">Lemon Party</h1>
        </RouterLink>

        <nav class="header-nav">
          <RouterLink
            v-if="auth.isAuthenticated"
            :to="{ name: 'chats-list' }"
            class="header-nav__wide"
            @click="onChatsClick"
          >
            Чаты
          </RouterLink>
          <!--
          <RouterLink v-if="auth.isAuthenticated" to="/timeline" class="header-nav__wide">
            Лента
          </RouterLink>
          -->
        </nav>
      </div>

      <div class="header-actions">
        <template v-if="auth.isAuthenticated">
          <button
            type="button"
            class="header-settings"
            title="Ещё"
            aria-label="Ещё"
            @click="openMoreModal"
          >
            <span class="material-symbols-outlined">settings</span>
          </button>
          <span class="header-user caption">{{ auth.user?.name || auth.user?.email }}</span>
          <button type="button" class="ghost-btn" @click="$emit('logout')">Выйти</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="header-auth-link">Вход</RouterLink>
          <RouterLink to="/register" class="header-auth-link header-auth-link--primary">
            Регистрация
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>
