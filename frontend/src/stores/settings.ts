import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type LogoClickTarget = 'filters' | 'chat';
export type ChatsLayoutPreference = 'three' | 'two' | 'auto';

const LOGO_TARGET_KEY = 'lemon_logo_target';
const CHATS_LAYOUT_KEY = 'lemon_chats_layout';
const WELCOME_SEEN_KEY = 'lemon_welcome_seen';

function loadLogoTarget(): LogoClickTarget {
  const stored = localStorage.getItem(LOGO_TARGET_KEY);
  return stored === 'chat' ? 'chat' : 'filters';
}

function loadChatsLayoutPreference(): ChatsLayoutPreference {
  const stored = localStorage.getItem(CHATS_LAYOUT_KEY);
  if (stored === 'three' || stored === 'two' || stored === 'auto') return stored;
  return 'auto';
}

function loadWelcomeSeen(): boolean {
  return localStorage.getItem(WELCOME_SEEN_KEY) === '1';
}

export const useSettingsStore = defineStore('settings', () => {
  const logoClickTarget = ref<LogoClickTarget>(loadLogoTarget());
  const chatsLayoutPreference = ref<ChatsLayoutPreference>(loadChatsLayoutPreference());
  const welcomeSeen = ref(loadWelcomeSeen());

  const logoRoute = computed(() => '/chats');

  function setLogoClickTarget(target: LogoClickTarget) {
    logoClickTarget.value = target;
    localStorage.setItem(LOGO_TARGET_KEY, target);
  }

  function setChatsLayoutPreference(preference: ChatsLayoutPreference) {
    chatsLayoutPreference.value = preference;
    localStorage.setItem(CHATS_LAYOUT_KEY, preference);
  }

  function markWelcomeSeen() {
    welcomeSeen.value = true;
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
  }

  return {
    logoClickTarget,
    logoRoute,
    chatsLayoutPreference,
    welcomeSeen,
    setLogoClickTarget,
    setChatsLayoutPreference,
    markWelcomeSeen,
  };
});
