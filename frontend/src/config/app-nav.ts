import type { RouteLocationNormalizedLoaded } from 'vue-router';

export type AppNavItem = {
  to: string;
  icon: string;
  label: string;
  matchRouteNames?: string[];
  matchPathPrefixes?: string[];
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    to: '/chats',
    icon: 'forum',
    label: 'Чаты',
    matchRouteNames: ['chats-list', 'chat-room', 'chat'],
    matchPathPrefixes: ['/chats', '/chat'],
  },
  /*
  { to: '/timeline', icon: 'view_timeline', label: 'Лента' },
  */
  { to: '/calendar', icon: 'calendar_month', label: 'Календарь' },
  /*
  {
    to: '/telegram',
    icon: 'import_export',
    label: 'Импорт Telegram',
    matchRouteNames: ['telegram-export'],
  },
  */
  {
    to: '/settings',
    icon: 'settings',
    label: 'Настройки',
    matchRouteNames: ['settings'],
  },
];

/** Primary rail navigation for the unified desktop app shell (no calendar). */
export const DESKTOP_SHELL_NAV_ITEMS = APP_NAV_ITEMS.filter(
  (item) => item.to !== '/calendar',
);

export function isAppNavActive(
  item: AppNavItem,
  route: RouteLocationNormalizedLoaded,
): boolean {
  const routeName = typeof route.name === 'string' ? route.name : '';
  if (item.matchRouteNames?.includes(routeName)) return true;
  if (item.matchPathPrefixes?.some((prefix) => route.path.startsWith(prefix))) {
    return true;
  }
  return route.path === item.to;
}
