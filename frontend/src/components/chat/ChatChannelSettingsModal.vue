<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { chatsApi } from '@/api/chats';
import { tagsApi } from '@/api/tags';
import { useChatsStore } from '@/stores/chats';
import type { Chat, ReplaySchedule, Tag } from '@/types';
import BaseModal from '@/components/BaseModal.vue';

const props = defineProps<{
  open: boolean;
  chat: Chat | null;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const chats = useChatsStore();
const tags = ref<Tag[]>([]);
const schedules = ref<ReplaySchedule[]>([]);
const childChats = ref<Chat[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');

const newTagId = ref('');
const newTime = ref('12:00');
const newTimezone = ref('Europe/Moscow');

const isGeneral = computed(() => props.chat?.kind === 'GENERAL');

const selectedParentId = ref('');
const selectedNewChildId = ref('');

const parentCandidates = computed(() => {
  if (!props.chat) return [];
  return chats.allChats.filter(
    (item) => item.id !== props.chat!.id && item.kind !== 'GENERAL',
  );
});

const childCandidates = computed(() => {
  if (!props.chat) return [];
  const currentChildIds = new Set(childChats.value.map((c) => c.id));
  return chats.allChats.filter(
    (item) =>
      item.id !== props.chat!.id &&
      item.kind !== 'GENERAL' &&
      item.id !== props.chat!.parentChatId &&
      !currentChildIds.has(item.id),
  );
});

async function loadData() {
  if (!props.chat || isGeneral.value) return;

  loading.value = true;
  error.value = '';

  try {
    const [tagList, scheduleList, children] = await Promise.all([
      tagsApi.list(),
      chatsApi.getReplaySchedules(props.chat.id),
      chatsApi.getChildren(props.chat.id),
    ]);
    tags.value = tagList;
    schedules.value = scheduleList;
    childChats.value = children;
    selectedParentId.value = props.chat.parentChatId ?? '';

    if (!newTagId.value && tagList.length > 0) {
      const resumeTag = tagList.find((tag) =>
        ['резюме', 'resume'].includes(tag.slug.toLowerCase()),
      );
      newTagId.value = resumeTag?.id ?? tagList[0].id;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить настройки';
  } finally {
    loading.value = false;
  }
}

async function changeParent() {
  if (!props.chat) return;
  saving.value = true;
  error.value = '';
  try {
    const parentId = selectedParentId.value || null;
    await chatsApi.setParent(props.chat.id, parentId);
    await chats.load(true);
    emit('updated');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось привязать родительский чат';
    selectedParentId.value = props.chat?.parentChatId ?? '';
  } finally {
    saving.value = false;
  }
}

async function removeChild(childId: string) {
  if (!props.chat) return;
  saving.value = true;
  error.value = '';
  try {
    await chatsApi.setParent(childId, null);
    const children = await chatsApi.getChildren(props.chat.id);
    childChats.value = children;
    await chats.load(true);
    emit('updated');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось отвязать дочерний чат';
  } finally {
    saving.value = false;
  }
}

async function addChild() {
  if (!props.chat || !selectedNewChildId.value) return;
  saving.value = true;
  error.value = '';
  try {
    await chatsApi.setParent(selectedNewChildId.value, props.chat.id);
    selectedNewChildId.value = '';
    const children = await chatsApi.getChildren(props.chat.id);
    childChats.value = children;
    await chats.load(true);
    emit('updated');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось привязать дочерний чат';
  } finally {
    saving.value = false;
  }
}

async function addSchedule() {
  if (!props.chat || !newTagId.value || !newTime.value) return;

  saving.value = true;
  error.value = '';

  try {
    const created = await chatsApi.createReplaySchedule(props.chat.id, {
      signalTagId: newTagId.value,
      scheduleTime: newTime.value,
      timezone: newTimezone.value,
      skipIfEmpty: true,
    });
    schedules.value = [...schedules.value, created];
    emit('updated');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось добавить расписание';
  } finally {
    saving.value = false;
  }
}

async function toggleSchedule(schedule: ReplaySchedule) {
  saving.value = true;
  try {
    const updated = await chatsApi.updateReplaySchedule(schedule.id, {
      enabled: !schedule.enabled,
    });
    schedules.value = schedules.value.map((item) =>
      item.id === schedule.id ? updated : item,
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось обновить';
  } finally {
    saving.value = false;
  }
}

async function removeSchedule(schedule: ReplaySchedule) {
  if (!window.confirm('Удалить это расписание?')) return;

  saving.value = true;
  try {
    await chatsApi.deleteReplaySchedule(schedule.id);
    schedules.value = schedules.value.filter((item) => item.id !== schedule.id);
    emit('updated');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить';
  } finally {
    saving.value = false;
  }
}

async function runSchedule(schedule: ReplaySchedule) {
  saving.value = true;
  error.value = '';

  try {
    const result = await chatsApi.runReplaySchedule(schedule.id);
    if (result.skipped) {
      window.alert(
        result.reason === 'empty'
          ? 'Сегодня нет записей с этим тегом — сводка не создана'
          : 'Сводка уже была или нечего собирать',
      );
    } else {
      window.alert('Сводка отправлена в канал');
      emit('updated');
    }
    await loadData();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось запустить';
  } finally {
    saving.value = false;
  }
}

function formatLastRun(schedule: ReplaySchedule) {
  if (schedule.lastRunAt) {
    return new Date(schedule.lastRunAt).toLocaleString('ru-RU');
  }
  return 'ещё не запускалось';
}



watch(
  () => [props.open, props.chat?.id] as const,
  ([open]) => {
    if (open) {
      loadData();
      selectedParentId.value = props.chat?.parentChatId ?? '';
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
    modal-class="channel-settings"
    backdrop-class="channel-settings__backdrop"
    dialog-class="channel-settings__dialog"
    aria-labelledby="channel-settings-title"
    @close="emit('close')"
  >
    <template v-if="chat">
      <header class="channel-settings__head">
        <div>
          <p class="channel-settings__eyebrow">Настройки канала</p>
          <h2 id="channel-settings-title" class="channel-settings__title">{{ chat.name }}</h2>
        </div>
        <button type="button" class="channel-settings__close" @click="emit('close')">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <div v-if="loading" class="channel-settings__body">
        <p class="caption">Загрузка…</p>
      </div>

      <div v-else class="channel-settings__body">
        <section class="channel-settings__section">
          <h3 class="channel-settings__section-title">Иерархия</h3>
          
          <!-- Parent Chat Select -->
          <div class="channel-settings__field" style="margin-bottom: 1rem;">
            <span class="channel-settings__label">Родительский чат</span>
            <select
              v-model="selectedParentId"
              class="channel-settings__select"
              :disabled="saving || isGeneral"
              @change="changeParent"
            >
              <option value="">Не привязан</option>
              <option v-for="item in parentCandidates" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
            <span class="caption channel-settings__hint">
              Канал, куда будут собираться сводки и где этот чат будет дочерним.
            </span>
          </div>

          <!-- Child Chats Management -->
          <div class="channel-settings__children-list-wrapper" style="margin-top: 1rem;">
            <span class="channel-settings__label">Дочерние чаты</span>
            
            <ul v-if="childChats.length > 0" class="channel-settings__children-list">
              <li v-for="child in childChats" :key="child.id" class="channel-settings__child-item">
                <span class="channel-settings__child-name">{{ child.name }}</span>
                <button
                  type="button"
                  class="channel-settings__child-remove"
                  title="Отвязать"
                  :disabled="saving"
                  @click="removeChild(child.id)"
                >
                  <span class="material-symbols-outlined" style="font-size: 1.25rem;">link_off</span>
                </button>
              </li>
            </ul>
            <p v-else class="caption channel-settings__hint" style="margin: 0.25rem 0 0.5rem 0;">
              Нет дочерних чатов. Вы можете привязать к этому чату другие регулярные чаты.
            </p>

            <!-- Add Child Form -->
            <div v-if="childCandidates.length > 0" class="channel-settings__add-child" style="display: grid; gap: 0.5rem; margin-top: 0.75rem;">
              <select
                v-model="selectedNewChildId"
                class="channel-settings__select"
                :disabled="saving"
              >
                <option value="">-- Выберите дочерний чат --</option>
                <option v-for="item in childCandidates" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
              <button
                type="button"
                class="btn-secondary"
                style="justify-self: start; padding: 0.35rem 0.75rem; font-size: 0.85rem;"
                :disabled="saving || !selectedNewChildId"
                @click="addChild"
              >
                + Добавить дочерний чат
              </button>
            </div>
          </div>
        </section>

        <section class="channel-settings__section">
          <h3 class="channel-settings__section-title">Scheduled replay</h3>
          <p class="caption channel-settings__hint">
            Ежедневная сводка из дочерних чатов по выбранному тегу. Если за день нет
            записей с тегом — сводка не создаётся.
          </p>
          <p v-if="childChats.length === 0" class="caption channel-settings__warn">
            У этого чата пока нет дочерних — привяжите к нему другие чаты как родителя
            или откройте настройки на канале-агрегаторе.
          </p>

          <ul v-if="schedules.length" class="channel-settings__list">
            <li v-for="schedule in schedules" :key="schedule.id" class="channel-settings__item">
              <div class="channel-settings__item-main">
                <span class="channel-settings__item-time">{{ schedule.scheduleTime }}</span>
                <span class="channel-settings__item-tag">
                  #{{ schedule.signalTag?.name ?? 'тег' }}
                </span>
                <span class="channel-settings__item-meta caption">
                  {{ schedule.timezone }} · {{ formatLastRun(schedule) }}
                </span>
              </div>
              <div class="channel-settings__item-actions">
                <button
                  type="button"
                  class="channel-settings__icon-btn"
                  :title="schedule.enabled ? 'Выключить' : 'Включить'"
                  :disabled="saving"
                  @click="toggleSchedule(schedule)"
                >
                  <span class="material-symbols-outlined">
                    {{ schedule.enabled ? 'toggle_on' : 'toggle_off' }}
                  </span>
                </button>
                <button
                  type="button"
                  class="channel-settings__icon-btn"
                  title="Запустить сейчас"
                  :disabled="saving"
                  @click="runSchedule(schedule)"
                >
                  <span class="material-symbols-outlined">play_arrow</span>
                </button>
                <button
                  type="button"
                  class="channel-settings__icon-btn channel-settings__icon-btn--danger"
                  title="Удалить"
                  :disabled="saving"
                  @click="removeSchedule(schedule)"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="caption channel-settings__empty">Расписаний пока нет</p>

          <form class="channel-settings__form" @submit.prevent="addSchedule">
            <label class="channel-settings__field">
              <span class="channel-settings__label">Тег-сигнал</span>
              <select v-model="newTagId" class="channel-settings__input" required>
                <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                  {{ tag.name }}
                </option>
              </select>
            </label>

            <label class="channel-settings__field">
              <span class="channel-settings__label">Время</span>
              <input
                v-model="newTime"
                type="time"
                class="channel-settings__input"
                required
              />
            </label>

            <label class="channel-settings__field">
              <span class="channel-settings__label">Часовой пояс</span>
              <select v-model="newTimezone" class="channel-settings__input">
                <option value="Europe/Moscow">Europe/Moscow</option>
                <option value="UTC">UTC</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
              </select>
            </label>

            <button type="submit" class="btn-primary channel-settings__submit" :disabled="saving">
              Добавить ежедневный репорт
            </button>
          </form>
        </section>

        <p v-if="error" class="channel-settings__error">{{ error }}</p>
      </div>
    </template>
  </BaseModal>
</template>
