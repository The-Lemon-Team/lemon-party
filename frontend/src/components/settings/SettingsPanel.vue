<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore, type ChatsLayoutPreference } from '@/stores/settings';

const auth = useAuthStore();
const settings = useSettingsStore();

const emailForm = ref({
  email: '',
  currentPassword: '',
});
const emailError = ref('');
const emailSuccess = ref('');

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const passwordError = ref('');
const passwordSuccess = ref('');

onMounted(() => {
  emailForm.value.email = auth.user?.email ?? '';
});

function onChatsLayoutChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as ChatsLayoutPreference;
  settings.setChatsLayoutPreference(value);
}

async function submitEmail() {
  emailError.value = '';
  emailSuccess.value = '';
  try {
    await auth.updateEmail(emailForm.value.email, emailForm.value.currentPassword);
    emailForm.value.currentPassword = '';
    emailSuccess.value = 'Email обновлён';
  } catch (e) {
    emailError.value = e instanceof Error ? e.message : 'Не удалось обновить email';
  }
}

async function submitPassword() {
  passwordError.value = '';
  passwordSuccess.value = '';

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Пароли не совпадают';
    return;
  }

  try {
    await auth.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword,
    );
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    passwordSuccess.value = 'Пароль обновлён';
  } catch (e) {
    passwordError.value = e instanceof Error ? e.message : 'Не удалось обновить пароль';
  }
}
</script>

<template>
  <div class="settings-panel">
    <div class="settings-section">
      <h3 class="settings-section__title">
        <span class="material-symbols-outlined">palette</span>
        Интерфейс
      </h3>
      <div class="settings-card">

        <label class="settings-row">
          <span class="settings-row__label">
            <span class="settings-row__name">Раскладка чатов</span>
            <span class="settings-row__hint caption">
              Три колонки (группы · список · чат) или две (как в Telegram на узком экране)
            </span>
          </span>
          <select
            class="settings-select"
            :value="settings.chatsLayoutPreference"
            @change="onChatsLayoutChange"
          >
            <option value="auto">Авто (по ширине окна)</option>
            <option value="three">Три колонки</option>
            <option value="two">Две колонки</option>
          </select>
        </label>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="settings-section__title">
        <span class="material-symbols-outlined">person</span>
        Аккаунт
      </h3>

      <div class="settings-card">
        <h4 class="settings-card__heading">Email для входа</h4>
        <form class="auth-form" @submit.prevent="submitEmail">
          <label>
            Новый email
            <input
              v-model="emailForm.email"
              type="email"
              required
              autocomplete="email"
            />
          </label>
          <label>
            Текущий пароль
            <input
              v-model="emailForm.currentPassword"
              type="password"
              required
              autocomplete="current-password"
            />
          </label>
          <p v-if="emailError" class="error">{{ emailError }}</p>
          <p v-if="emailSuccess" class="success">{{ emailSuccess }}</p>
          <button type="submit" class="btn-primary auth-form__submit" :disabled="auth.loading">
            {{ auth.loading ? 'Сохранение…' : 'Сохранить email' }}
          </button>
        </form>
      </div>

      <div class="settings-card">
        <h4 class="settings-card__heading">Пароль</h4>
        <form class="auth-form" @submit.prevent="submitPassword">
          <label>
            Текущий пароль
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              required
              autocomplete="current-password"
            />
          </label>
          <label>
            Новый пароль
            <input
              v-model="passwordForm.newPassword"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </label>
          <label>
            Повторите новый пароль
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </label>
          <p v-if="passwordError" class="error">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="success">{{ passwordSuccess }}</p>
          <button type="submit" class="btn-primary auth-form__submit" :disabled="auth.loading">
            {{ auth.loading ? 'Сохранение…' : 'Сохранить пароль' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
