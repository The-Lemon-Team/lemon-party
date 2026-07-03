export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  isDefault: boolean;
  entryCount?: number;
  createdAt?: string;
}

export interface TagStatItem {
  tag: Tag;
  entryCount: number;
  messageCount: number;
  lastMentionedAt: string | null;
}

export interface TagMentionItem {
  id: string;
  content: string;
  createdAt: string;
  tag: Tag;
  messageId: string | null;
  chat: Pick<Chat, 'id' | 'name' | 'slug' | 'kind'> | null;
}

export interface TaggedMessageItem {
  id: string;
  rawText: string;
  createdAt: string;
  chat: Pick<Chat, 'id' | 'name' | 'slug' | 'kind'> | null;
  entries: Array<{
    id: string;
    content: string;
    createdAt: string;
    tag: Tag;
  }>;
  tags: Tag[];
}

export interface TagStatsResponse {
  summary: {
    mentionedTags: number;
    totalMentions: number;
    totalMessages: number;
  };
  topTags: TagStatItem[];
  recentMentions: TagMentionItem[];
  recentMessages: TaggedMessageItem[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type ChatKind = 'GENERAL' | 'REGULAR';

export interface Chat {
  id: string;
  name: string;
  slug: string;
  kind: ChatKind;
  parentChatId?: string | null;
  parentChat?: Chat | null;
  collectionId?: string | null;
  collection?: ChatCollection | null;
  isPinned?: boolean;
  sortOrder?: number;
  createdAt?: string;
  lastMessageAt?: string | null;
}

export type FlowEventKind = 'REPLAY_UP' | 'REPLAY_DOWN';

export interface FlowEventItem {
  id: string;
  kind: FlowEventKind;
  sourceChatId: string;
  sourceChatName: string;
  targetChatId: string;
  targetChatName: string;
  entryCount: number | null;
  createdAt: string;
  isOwn: boolean;
}

export interface ChannelActivityResponse {
  parentChat: Chat | null;
  events: FlowEventItem[];
}

export type ContentTypeSummaryId = 'design' | 'lofi' | 'music' | 'video';

export interface ContentTypeSummaryItem {
  id: ContentTypeSummaryId;
  label: string;
  count: number;
}

export interface ChatContentSummary {
  chatId: string;
  totalMessages: number;
  types: ContentTypeSummaryItem[];
}

export interface UpwardTarget {
  chatId: string;
  chatName: string;
  kind: ChatKind;
  via: 'parent' | 'grant';
}

export interface UpwardGrant {
  id: string;
  fromChatId: string;
  fromChatName: string;
  toChatId: string;
  toChatName: string;
  createdAt: string;
}

export interface ReplaySchedule {
  id: string;
  channelChatId: string;
  signalTagId: string;
  signalTag?: Tag;
  scheduleTime: string;
  timezone: string;
  enabled: boolean;
  skipIfEmpty: boolean;
  lastRunAt?: string | null;
  lastRunLocalDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageFlowMeta {
  kind?: 'REPLAY_UP' | 'REPLAY_DOWN' | 'SCHEDULED_DIGEST';
  sourceChatId?: string;
  sourceChatName?: string;
  signalTagName?: string;
  localDate?: string;
}

export interface ChatCollection {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
  createdAt?: string;
  lastMessageAt?: string | null;
  chats?: Chat[];
}

export interface ChatListResponse {
  general: Chat | null;
  collections: ChatCollection[];
  standalone: Chat[];
  chats: Chat[];
}

export interface Entry {
  id: string;
  content: string;
  tag: Tag;
  usefulVotes: number;
  completed: boolean;
  isPublic: boolean;
  createdAt: string;
  messageId?: string | null;
  user?: User;
}

export interface Message {
  id: string;
  rawText: string;
  content?: MessageDocument | null;
  createdAt: string;
  user?: User;
  chatId?: string;
  chat?: Chat;
  originMessageId?: string | null;
  flowMeta?: MessageFlowMeta | null;
  entries: Entry[];
}

import type { MessageDocument } from '@lemon-party/blocks';

export type { MessageDocument };

export interface TimelineDay {
  date: string;
  entries: Entry[];
}

export interface CalendarDay {
  date: string;
  count: number;
  entries: Entry[];
}

export function displayName(user?: User | null): string {
  if (!user) return 'Аноним';
  return user.name || user.email.split('@')[0];
}

export function messageAuthorLabel(message: Message): string {
  if (message.user?.name) return message.user.name;
  const tagName = message.entries[0]?.tag?.name;
  if (tagName) return tagName;
  if (message.user?.email) return message.user.email;
  return 'Аноним';
}

export function tagStyle(color: string) {
  return {
    borderLeftColor: color,
    badgeBackground: `${color}1a`,
    badgeColor: color,
  };
}
