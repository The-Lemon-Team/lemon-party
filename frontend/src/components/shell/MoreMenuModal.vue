<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import SettingsPanel from '@/components/settings/SettingsPanel.vue';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{ close: [] }>();

const router = useRouter();

type View = 'menu' | 'settings';

const view = ref<View>('menu');

function closeModal() {
  view.value = 'menu';
  emit('close');
}

function openSettings() {
  view.value = 'settings';
}

function backToMenu() {
  view.value = 'menu';
}

function navigateToTelegram() {
  closeModal();
  void router.push('/telegram');
}

watch(
  () => props.open,
  (open) => {
    if (open) view.value = 'menu';
  },
);
</script>

<template>
  <BaseModal
    :open="open"
    :teleport="false"
    modal-class="more-modal"
    backdrop-class="more-modal__backdrop"
    :dialog-class="`more-modal__dialog ${view === 'settings' ? 'more-modal__dialog--wide' : ''}`"
    :aria-labelledby="view === 'settings' ? 'more-settings-title' : 'more-menu-title'"
    @close="closeModal"
  >
      <template v-if="view === 'menu'">
        <header class="more-modal__head">
          <h2 id="more-menu-title" class="more-modal__title">Ещё</h2>
          <button type="button" class="more-modal__close" aria-label="Закрыть" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <ul class="more-modal__list">
          <li>
            <button type="button" class="more-modal__row" @click="navigateToTelegram">
              <span class="more-modal__row-icon" style="background: rgba(112, 112, 255, 0.1); color: var(--accent-color, #7070ff); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%;">
                <span class="material-symbols-outlined">import_export</span>
              </span>
              <span class="more-modal__row-text">
                <span class="more-modal__row-name">Импорт Telegram</span>
                <span class="more-modal__row-meta">Загрузка и парсинг result.json</span>
              </span>
              <span class="material-symbols-outlined more-modal__row-chevron">chevron_right</span>
            </button>
          </li>
          <li>
            <button type="button" class="more-modal__row" @click="openSettings">
              <span class="more-modal__row-icon more-modal__row-icon--settings">
                <span class="material-symbols-outlined">settings</span>
              </span>
              <span class="more-modal__row-text">
                <span class="more-modal__row-name">Настройки</span>
                <span class="more-modal__row-meta">Интерфейс и аккаунт</span>
              </span>
              <span class="material-symbols-outlined more-modal__row-chevron">chevron_right</span>
            </button>
          </li>
        </ul>
      </template>

      <template v-else>
        <header class="more-modal__head">
          <button type="button" class="more-modal__back" aria-label="Назад" @click="backToMenu">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 id="more-settings-title" class="more-modal__title">Настройки</h2>
          <button type="button" class="more-modal__close" aria-label="Закрыть" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div class="more-modal__body">
          <SettingsPanel />
        </div>
      </template>
  </BaseModal>
</template>
