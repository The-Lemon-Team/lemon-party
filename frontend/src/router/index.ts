import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useChatsStore } from '@/stores/chats';
import FiltersView from '@/views/FiltersView.vue';
import GroupsView from '@/views/GroupsView.vue';
import GraphView from '@/views/GraphView.vue';
import ChatsLayoutView from '@/views/ChatsLayoutView.vue';
import ChatsEmptyRoute from '@/views/ChatsEmptyRoute.vue';
import ChatView from '@/views/ChatView.vue';
import TimelineView from '@/views/TimelineView.vue';
import CalendarView from '@/views/CalendarView.vue';
import TopView from '@/views/TopView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import SettingsView from '@/views/SettingsView.vue';
import TagsView from '@/views/TagsView.vue';
import WelcomeView from '@/views/WelcomeView.vue';
import { useSettingsStore } from '@/stores/settings';
import {
  resolveShellTransition,
  setShellTransitionName,
} from '@/composables/useShellRouteTransition';

const history =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? createWebHashHistory()
    : createWebHistory();

const router = createRouter({
  history,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.path.startsWith('/chats')) return false;
    return { top: 0 };
  },
  routes: [
    { path: '/', redirect: '/chats' },
    { path: '/filters', name: 'filters', component: FiltersView },
    { path: '/groups', name: 'groups', component: GroupsView, meta: { requiresAuth: true } },
    { path: '/tags', name: 'tags', component: TagsView, meta: { requiresAuth: true } },
    { path: '/graph', name: 'graph', component: GraphView, meta: { requiresAuth: true } },
    {
      path: '/chat',
      name: 'chat',
      redirect: '/chats',
      meta: { requiresAuth: true },
    },
    {
      path: '/chats',
      component: ChatsLayoutView,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'chats-list', component: ChatsEmptyRoute },
        {
          path: ':chatId',
          name: 'chat-room',
          component: ChatView,
        },
      ],
    },
    { path: '/welcome', name: 'welcome', component: WelcomeView, meta: { welcome: true } },
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
    { path: '/timeline', name: 'timeline', component: TimelineView, meta: { requiresAuth: true } },
    { path: '/calendar', name: 'calendar', component: CalendarView, meta: { requiresAuth: true } },
    { path: '/top', name: 'top', component: TopView, meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
    /*
    {
      path: '/telegram',
      name: 'telegram-export',
      component: () => import('mfe_telegram/TelegramExportViewer'),
      meta: { requiresAuth: true },
    },
    */
  ],
});

async function resolveGeneralChatId() {
  const chats = useChatsStore();
  await chats.load();
  return chats.general?.id ?? chats.allChats[0]?.id ?? null;
}

function isElectronShell() {
  return !!(window as Window & { electronAPI?: { isElectron: boolean } }).electronAPI?.isElectron;
}

router.beforeEach(async (to, from) => {
  const toName = typeof to.name === 'string' ? to.name : undefined;
  const fromName = typeof from.name === 'string' ? from.name : undefined;
  setShellTransitionName(resolveShellTransition(toName, fromName));

  const auth = useAuthStore();
  const settings = useSettingsStore();
  await auth.init();

  if (to.name === 'welcome' && settings.welcomeSeen) {
    return auth.isAuthenticated
      ? { name: 'chats-list' }
      : { name: 'login', query: { redirect: '/chats' } };
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'chats-list' };
  }

  if (isElectronShell() && to.path === '/' && !settings.welcomeSeen) {
    return { name: 'welcome', replace: true };
  }

  if (to.name === 'chat-room' && to.params.chatId === 'general') {
    const chatId = await resolveGeneralChatId();
    if (chatId && chatId !== 'general') {
      return { name: 'chat-room', params: { chatId }, replace: true };
    }
  }
});

export default router;
