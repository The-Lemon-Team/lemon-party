import {
  detectContentTypeIds,
  documentFromStored,
  type ContentTypeId,
} from '@lemon-party/blocks';
import type { Message } from '@/types';

export type { ContentTypeId };

export type ContentTypeDefinition = {
  id: ContentTypeId;
  label: string;
  icon: string;
};

export const CONTENT_TYPES: ContentTypeDefinition[] = [
  { id: 'design', label: 'Дизайн', icon: 'palette' },
  { id: 'lofi', label: 'Lo-fi', icon: 'headphones' },
  { id: 'music', label: 'Музыка', icon: 'music_note' },
  { id: 'video', label: 'Видео', icon: 'play_circle' },
];

const TYPE_BY_ID = new Map(CONTENT_TYPES.map((item) => [item.id, item]));

export function detectMessageContentTypeIds(message: Message): ContentTypeId[] {
  const document = documentFromStored(message.content ?? null, message.rawText);
  return detectContentTypeIds(document, message.rawText);
}

export function detectMessageContentTypes(message: Message): ContentTypeDefinition[] {
  return detectMessageContentTypeIds(message)
    .map((id) => TYPE_BY_ID.get(id))
    .filter((item): item is ContentTypeDefinition => Boolean(item));
}

export function computeContentTypeCounts(messages: Message[]) {
  const counts: Record<ContentTypeId, number> = {
    design: 0,
    lofi: 0,
    music: 0,
    video: 0,
  };

  for (const message of messages) {
    for (const typeId of detectMessageContentTypeIds(message)) {
      counts[typeId] += 1;
    }
  }

  return counts;
}
